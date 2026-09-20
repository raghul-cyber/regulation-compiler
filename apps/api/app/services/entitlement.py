import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.organizations import User, RoleEnum, Organization, PlanEnum
from app.models.billing import UserEntitlement, UsageEvent, PaymentTransaction
from app.models.audit import AuditLog

logger = logging.getLogger("services.entitlement")

# Super-admin identifiers that are unconditionally granted unlimited access
SUPER_ADMIN_EMAILS = {"rcraghul12@gmail.com"}
SUPER_ADMIN_CLERK_IDS = {"user_3HpP6350OcHxY6bu77tdXEtihSE"}


class EntitlementService:
    """
    Centralized Entitlement & Usage Accounting Engine.
    Enforces the '3 Free Uses' policy, server-side admin exemptions,
    concurrency-safe atomic reservations, and strict idempotency.
    """

    def __init__(self, db: Session):
        self.db = db

    def is_admin(self, user: Optional[User]) -> bool:
        """
        Server-side evaluation of administrative privileges.
        Never relies on client-provided query parameters or payload properties.
        """
        if not user:
            return False

        # 1. Database role check
        if getattr(user, "role", None) == RoleEnum.admin:
            return True

        # 2. Super-admin email address
        user_email = (getattr(user, "email", "") or "").strip().lower()
        if user_email in SUPER_ADMIN_EMAILS:
            return True

        # 3. Super-admin Clerk ID
        clerk_id = getattr(user, "clerk_user_id", "")
        if clerk_id in SUPER_ADMIN_CLERK_IDS:
            return True

        # 4. Organization enterprise plan
        if getattr(user, "org_id", None):
            org = self.db.query(Organization).filter(Organization.id == user.org_id).first()
            if org and (getattr(org, "plan", None) == PlanEnum.enterprise or getattr(org, "plan", None) == "enterprise"):
                return True

        return False

    def get_or_create_entitlement(self, user: User, org_id: Optional[uuid.UUID] = None) -> UserEntitlement:
        """
        Retrieves or initializes the organization's entitlement ledger.
        Defaults to 'free' plan with 3 complimentary uses.
        """
        target_org_id = org_id or user.org_id
        if not target_org_id:
            raise HTTPException(status_code=400, detail="User is not associated with an organization")

        entitlement = self.db.query(UserEntitlement).filter(UserEntitlement.org_id == target_org_id).first()
        if not entitlement:
            entitlement = UserEntitlement(
                org_id=target_org_id,
                user_id=user.id,
                plan="free",
                status="active",
                free_usage_limit=3,
                free_usage_used=0,
                paid_credits=0
            )
            self.db.add(entitlement)
            self.db.commit()
            self.db.refresh(entitlement)

        return entitlement

    def get_usage_summary(self, user: User) -> Dict[str, Any]:
        """
        Returns a complete entitlement and usage summary for UI indicators and status queries.
        """
        is_admin_user = self.is_admin(user)
        entitlement = self.get_or_create_entitlement(user)

        is_paid = (
            entitlement.plan in ("pro", "enterprise") and entitlement.status == "active"
        ) or entitlement.paid_credits > 0

        free_remaining = max(0, entitlement.free_usage_limit - entitlement.free_usage_used)

        return {
            "is_admin": is_admin_user,
            "plan": "enterprise" if is_admin_user else entitlement.plan,
            "status": entitlement.status,
            "paid_access": is_admin_user or is_paid,
            "free_usage": {
                "limit": entitlement.free_usage_limit,
                "used": entitlement.free_usage_used,
                "remaining": 9999 if is_admin_user else free_remaining
            },
            "paid_credits": entitlement.paid_credits,
            "current_period_end": entitlement.current_period_end.isoformat() if entitlement.current_period_end else None,
            "dodo_customer_id": entitlement.dodo_customer_id
        }

    def can_perform_operation(
        self,
        user: User,
        operation_type: str,
        operation_id: Optional[str] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Determines whether a user is entitled to run a metered operation.
        Returns: (allowed: bool, reason: str, details: dict)
        """
        if self.is_admin(user):
            return True, "Admin unlimited access granted.", {"is_admin": True, "unlimited": True}

        # Idempotency check: If this exact operation_id was already started/completed, permit replay without charge
        if operation_id:
            existing_event = self.db.query(UsageEvent).filter(
                UsageEvent.org_id == user.org_id,
                UsageEvent.operation_id == operation_id
            ).first()
            if existing_event and existing_event.status in ("reserved", "completed"):
                return True, "Idempotent operation replay allowed.", {"replayed": True, "event_id": str(existing_event.id)}

        entitlement = self.get_or_create_entitlement(user)

        # Active paid subscription
        if entitlement.plan in ("pro", "enterprise") and entitlement.status == "active":
            return True, "Paid plan active.", {"plan": entitlement.plan}

        # Available paid credits
        if entitlement.paid_credits > 0:
            return True, f"{entitlement.paid_credits} paid credits remaining.", {"paid_credits": entitlement.paid_credits}

        # Free usage allowance
        if entitlement.free_usage_used < entitlement.free_usage_limit:
            remaining = entitlement.free_usage_limit - entitlement.free_usage_used
            return True, f"{remaining} free compilation(s) remaining.", {
                "free_uses_used": entitlement.free_usage_used,
                "free_uses_limit": entitlement.free_usage_limit,
                "free_uses_remaining": remaining
            }

        # Free uses exhausted and no paid entitlement
        return False, "Your 3 free uses have been used.", {
            "code": "PAYMENT_REQUIRED",
            "free_uses_used": entitlement.free_usage_used,
            "free_uses_limit": entitlement.free_usage_limit,
            "upgrade_required": True
        }

    def reserve_usage(
        self,
        user: User,
        operation_type: str,
        operation_id: str,
        source: str = "web_upload",
        metadata: Optional[Dict[str, Any]] = None
    ) -> UsageEvent:
        """
        Concurrency-safe atomic reservation of a compilation/audit usage.
        Uses row-level locking (SELECT ... FOR UPDATE) to prevent race conditions.
        Enforces idempotency using unique constraint on (org_id, operation_id).
        """
        target_org_id = user.org_id

        # 1. Check for duplicate request (Idempotency)
        existing_event = self.db.query(UsageEvent).filter(
            UsageEvent.org_id == target_org_id,
            UsageEvent.operation_id == operation_id
        ).first()
        if existing_event:
            logger.info(f"Idempotent reservation replay for operation {operation_id}")
            return existing_event

        # 2. Admin exemption: Record audit trail with 0 consumed credits
        if self.is_admin(user):
            admin_event = UsageEvent(
                org_id=target_org_id,
                user_id=user.id,
                operation_type=operation_type,
                operation_id=operation_id,
                source=source,
                status="reserved",
                credits_consumed=0,
                meta_data={**(metadata or {}), "admin_bypass": True}
            )
            self.db.add(admin_event)
            self.db.commit()
            self.db.refresh(admin_event)
            return admin_event

        # 3. Concurrency-safe atomic check and reservation via row lock
        # Ensure row exists first
        self.get_or_create_entitlement(user, target_org_id)

        # Lock the entitlement row for update
        entitlement = self.db.query(UserEntitlement).filter(
            UserEntitlement.org_id == target_org_id
        ).with_for_update().first()

        credits_to_consume = 1
        is_paid_sub = entitlement.plan in ("pro", "enterprise") and entitlement.status == "active"

        if is_paid_sub:
            credits_to_consume = 0
        elif entitlement.paid_credits > 0:
            entitlement.paid_credits -= 1
            credits_to_consume = 1
        elif entitlement.free_usage_used < entitlement.free_usage_limit:
            entitlement.free_usage_used += 1
            credits_to_consume = 1
        else:
            # Reached free limit: reject immediately
            self.db.rollback()
            logger.warning(f"Entitlement rejected: Free limit reached (3/3) for org {target_org_id}")
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "code": "PAYMENT_REQUIRED",
                    "message": "Your 3 free uses have been used. Continue compiling regulations by upgrading your access.",
                    "free_uses_used": entitlement.free_usage_used,
                    "free_uses_limit": entitlement.free_usage_limit,
                    "upgrade_required": True,
                    "upgrade_url": "/billing"
                }
            )

        # Create the usage ledger event
        event = UsageEvent(
            org_id=target_org_id,
            user_id=user.id,
            operation_type=operation_type,
            operation_id=operation_id,
            source=source,
            status="reserved",
            credits_consumed=credits_to_consume,
            meta_data=metadata or {}
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        logger.info(
            f"Reserved usage for operation {operation_id} (org {target_org_id}, "
            f"free_used: {entitlement.free_usage_used}/{entitlement.free_usage_limit}, "
            f"consumed: {credits_to_consume})"
        )
        return event

    def release_usage(self, operation_id: str, reason: str = "internal_failure") -> bool:
        """
        Safely refunds / releases a reserved usage credit if an internal infrastructure failure
        occurs before meaningful document processing begins.
        """
        event = self.db.query(UsageEvent).filter(UsageEvent.operation_id == operation_id).first()
        if not event or event.status != "reserved":
            return False

        entitlement = self.db.query(UserEntitlement).filter(
            UserEntitlement.org_id == event.org_id
        ).with_for_update().first()

        if entitlement and event.credits_consumed > 0:
            if entitlement.paid_credits > 0:
                entitlement.paid_credits += event.credits_consumed
            elif entitlement.free_usage_used > 0:
                entitlement.free_usage_used = max(0, entitlement.free_usage_used - event.credits_consumed)

        event.status = "refunded"
        if not event.meta_data:
            event.meta_data = {}
        event.meta_data["refund_reason"] = reason

        self.db.commit()
        logger.info(f"Released/refunded usage for operation {operation_id} (Reason: {reason})")
        return True

    def complete_usage(self, operation_id: str) -> bool:
        """
        Marks a reserved usage event as completed.
        """
        event = self.db.query(UsageEvent).filter(UsageEvent.operation_id == operation_id).first()
        if not event:
            return False

        event.status = "completed"
        self.db.commit()
        return True

    def grant_paid_access(
        self,
        payment_id: str,
        customer_id: Optional[str],
        product_id: Optional[str],
        amount: int,
        currency: str = "USD",
        metadata: Optional[Dict[str, Any]] = None
    ) -> UserEntitlement:
        """
        Activates paid plan entitlement and records transaction upon verified Dodo Payments webhook.
        Guarantees database consistency across payment transactions and entitlements.
        """
        meta = metadata or {}
        org_id_str = meta.get("org_id")
        user_id_str = meta.get("user_id")

        org_id = uuid.UUID(org_id_str) if org_id_str else None
        user_id = uuid.UUID(user_id_str) if user_id_str else None

        # 1. Record or update payment transaction
        tx = self.db.query(PaymentTransaction).filter(PaymentTransaction.dodo_payment_id == payment_id).first()
        if not tx:
            tx = PaymentTransaction(
                org_id=org_id,
                user_id=user_id,
                dodo_payment_id=payment_id,
                dodo_customer_id=customer_id,
                dodo_product_id=product_id,
                amount=amount,
                currency=currency,
                status="succeeded",
                payment_type="one_time",
                meta_data=meta
            )
            self.db.add(tx)
        else:
            tx.status = "succeeded"
            tx.amount = amount
            tx.currency = currency
            tx.dodo_customer_id = customer_id or tx.dodo_customer_id

        # 2. Update entitlement
        if not org_id:
            # Fallback: locate entitlement by customer_id
            entitlement = self.db.query(UserEntitlement).filter(
                UserEntitlement.dodo_customer_id == customer_id
            ).first()
        else:
            entitlement = self.db.query(UserEntitlement).filter(
                UserEntitlement.org_id == org_id
            ).first()

        if not entitlement:
            if not org_id:
                raise ValueError(f"Cannot associate payment {payment_id} without organization context")
            entitlement = UserEntitlement(
                org_id=org_id,
                user_id=user_id,
                plan="pro",
                status="active",
                free_usage_limit=3,
                free_usage_used=0,
                paid_credits=100,
                dodo_customer_id=customer_id,
                current_period_start=datetime.now(timezone.utc),
                current_period_end=datetime.now(timezone.utc) + timedelta(days=365)
            )
            self.db.add(entitlement)
        else:
            entitlement.plan = "pro"
            entitlement.status = "active"
            entitlement.dodo_customer_id = customer_id or entitlement.dodo_customer_id
            entitlement.current_period_start = datetime.now(timezone.utc)
            entitlement.current_period_end = datetime.now(timezone.utc) + timedelta(days=365)
            # Add bonus paid credits
            entitlement.paid_credits += 100

        # Also upgrade organization plan in organizations table if exists
        if org_id:
            org = self.db.query(Organization).filter(Organization.id == org_id).first()
            if org:
                org.plan = PlanEnum.standard

        self.db.flush()

        # 3. Create Immutable Audit Log
        audit_log = AuditLog(
            org_id=entitlement.org_id,
            actor_id=user_id,
            action="entitlement.paid_upgrade",
            entity_type="payment_transaction",
            entity_id=tx.id or uuid.uuid4(),
            metadata_={
                "payment_id": payment_id,
                "amount": amount,
                "currency": currency,
                "product_id": product_id,
                "new_plan": "pro"
            }
        )
        self.db.add(audit_log)

        self.db.commit()
        self.db.refresh(entitlement)
        logger.info(f"Paid entitlement activated for org {entitlement.org_id} (Payment: {payment_id})")
        return entitlement

    def record_payment_failure(
        self,
        payment_id: str,
        customer_id: Optional[str],
        error_message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentTransaction:
        """
        Records a failed payment attempt without unlocking access.
        """
        meta = metadata or {}
        org_id_str = meta.get("org_id")
        user_id_str = meta.get("user_id")

        org_id = uuid.UUID(org_id_str) if org_id_str else None
        user_id = uuid.UUID(user_id_str) if user_id_str else None

        tx = self.db.query(PaymentTransaction).filter(PaymentTransaction.dodo_payment_id == payment_id).first()
        if not tx and org_id:
            tx = PaymentTransaction(
                org_id=org_id,
                user_id=user_id,
                dodo_payment_id=payment_id,
                dodo_customer_id=customer_id,
                amount=0,
                status="failed",
                meta_data={**meta, "error": error_message}
            )
            self.db.add(tx)
        elif tx:
            tx.status = "failed"
            if not tx.meta_data:
                tx.meta_data = {}
            tx.meta_data["error"] = error_message

        self.db.commit()
        logger.warning(f"Recorded payment failure for {payment_id}: {error_message}")
        return tx

    def handle_refund(self, payment_id: str, reason: str = "refund_processed") -> bool:
        """
        Revokes paid entitlement upon payment refund or chargeback reversal.
        """
        tx = self.db.query(PaymentTransaction).filter(PaymentTransaction.dodo_payment_id == payment_id).first()
        if not tx:
            return False

        tx.status = "refunded"
        if not tx.meta_data:
            tx.meta_data = {}
        tx.meta_data["refund_reason"] = reason

        entitlement = self.db.query(UserEntitlement).filter(UserEntitlement.org_id == tx.org_id).first()
        if entitlement:
            entitlement.plan = "free"
            entitlement.status = "past_due"
            entitlement.paid_credits = 0

        self.db.commit()
        logger.info(f"Revoked entitlement for org {tx.org_id} due to refund of payment {payment_id}")
        return True
