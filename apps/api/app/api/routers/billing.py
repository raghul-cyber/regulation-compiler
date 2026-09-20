import hashlib
import json
import logging
import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Header
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import get_current_user, get_optional_current_user
from app.models.organizations import User
from app.models.billing import WebhookEvent, UsageEvent
from app.services.entitlement import EntitlementService
from app.services.dodo import dodo_service, DodoPaymentError

logger = logging.getLogger("routers.billing")

router = APIRouter(tags=["billing"])
webhook_router = APIRouter(tags=["billing_webhooks"])


# -------------------------------------------------------------
# Entitlement & Usage Queries
# -------------------------------------------------------------

@router.get("/status")
async def get_billing_status(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the authoritative billing and usage status for the authenticated user.
    Powers the UI usage indicator and paywall triggers.
    """
    if not current_user:
        return {
            "authenticated": False,
            "is_admin": False,
            "plan": "free",
            "status": "unauthenticated",
            "paid_access": False,
            "free_usage": {"limit": 3, "used": 0, "remaining": 3},
            "paid_credits": 0
        }

    service = EntitlementService(db)
    summary = service.get_usage_summary(current_user)
    return {
        "authenticated": True,
        **summary
    }


@router.get("/usage")
async def get_billing_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the historical usage event ledger for the user's organization.
    """
    events = db.query(UsageEvent).filter(
        UsageEvent.org_id == current_user.org_id
    ).order_by(UsageEvent.created_at.desc()).limit(50).all()

    return {
        "events": [
            {
                "id": str(e.id),
                "operation_type": e.operation_type,
                "operation_id": e.operation_id,
                "status": e.status,
                "credits_consumed": e.credits_consumed,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "metadata": e.meta_data
            }
            for e in events
        ]
    }


# -------------------------------------------------------------
# Checkout Session Creation
# -------------------------------------------------------------

@router.post("/checkout")
async def create_checkout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiates an authentic Dodo Payments checkout session.
    Returns the real checkout URL for user redirection.
    """
    body = await request.json().catch(lambda: {}) if hasattr(request, "json") else {}
    try:
        body = await request.json()
    except Exception:
        body = {}

    product_id = body.get("product_id")
    return_url = body.get("return_url")

    # If user is already an admin, notify that checkout is not required
    service = EntitlementService(db)
    if service.is_admin(current_user):
        return {
            "status": "exempt",
            "message": "Admin users possess unlimited compilation access. Checkout is not required.",
            "is_admin": True
        }

    try:
        user_name = current_user.email.split('@')[0] if current_user.email else "Subscriber"
        session_data = await dodo_service.create_checkout_session(
            user_id=str(current_user.id),
            org_id=str(current_user.org_id),
            user_email=current_user.email,
            user_name=user_name,
            product_id=product_id,
            return_url=return_url,
            custom_metadata={
                "clerk_user_id": current_user.clerk_user_id
            }
        )
        return {
            "success": True,
            "checkout_url": session_data.get("checkout_url"),
            "session_id": session_data.get("session_id"),
            "mode": session_data.get("mode", "production")
        }
    except DodoPaymentError as dpe:
        logger.error(f"Checkout generation failed: {dpe}")
        raise HTTPException(status_code=502, detail=str(dpe))
    except Exception as e:
        logger.exception(f"Unexpected error in checkout creation: {e}")
        raise HTTPException(status_code=500, detail="Could not initialize checkout gateway")


# -------------------------------------------------------------
# Customer Billing Portal
# -------------------------------------------------------------

@router.get("/portal")
async def get_customer_portal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a Dodo Payments customer portal URL for managing existing subscriptions.
    """
    service = EntitlementService(db)
    entitlement = service.get_or_create_entitlement(current_user)

    if not entitlement.dodo_customer_id:
        raise HTTPException(status_code=404, detail="No billing customer record exists for this organization yet.")

    portal_url = await dodo_service.get_customer_portal_url(entitlement.dodo_customer_id)
    if not portal_url:
        raise HTTPException(status_code=501, detail="Customer portal is not enabled for this billing product.")

    return {"portal_url": portal_url}


# -------------------------------------------------------------
# Remote / Secondary Operation Usage Check
# -------------------------------------------------------------

@router.post("/reserve-usage")
async def api_reserve_usage(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows authorized internal endpoints to reserve a credit atomically.
    Used by the website compliance auditor and secondary compute pipelines.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    operation_type = body.get("operation_type", "website_audit")
    operation_id = body.get("operation_id") or f"op-{uuid.uuid4()}"
    source = body.get("source", "internal_api")
    meta = body.get("metadata", {})

    service = EntitlementService(db)
    event = service.reserve_usage(
        user=current_user,
        operation_type=operation_type,
        operation_id=operation_id,
        source=source,
        metadata=meta
    )
    return {
        "success": True,
        "operation_id": event.operation_id,
        "status": event.status,
        "credits_consumed": event.credits_consumed
    }


# -------------------------------------------------------------
# Authoritative Dodo Payments Webhook Listener
# -------------------------------------------------------------

async def process_dodo_webhook(request: Request, db: Session) -> Response:
    raw_body = await request.body()
    headers_dict = dict(request.headers)

    # 1. Cryptographic Signature Verification
    try:
        payload = dodo_service.verify_webhook_signature(raw_body, headers_dict)
    except DodoPaymentError as dpe:
        logger.warning(f"Rejected unverified webhook: {dpe}")
        return Response(content=json.dumps({"error": str(dpe)}), status_code=400, media_type="application/json")

    event_id = headers_dict.get("webhook-id") or payload.get("id") or str(uuid.uuid4())
    event_type = payload.get("type") or payload.get("event") or "unknown"

    # 2. Strict Webhook Idempotency Check
    existing = db.query(WebhookEvent).filter(
        WebhookEvent.provider == "dodo",
        WebhookEvent.event_id == event_id
    ).first()

    if existing:
        logger.info(f"Duplicate webhook {event_id} ({event_type}) previously received. Idempotently returning HTTP 200.")
        return Response(content=json.dumps({"received": True, "status": "duplicate_ignored"}), status_code=200, media_type="application/json")

    # Record event in ledger
    payload_hash = hashlib.sha256(raw_body).hexdigest()
    wh_record = WebhookEvent(
        provider="dodo",
        event_id=event_id,
        event_type=event_type,
        status="processing",
        payload_hash=payload_hash
    )
    db.add(wh_record)
    db.commit()

    # 3. Handle Dodo Payments Lifecycle Events
    service = EntitlementService(db)
    event_data = payload.get("data", {})

    try:
        if event_type in ("payment.succeeded", "checkout.session.completed"):
            payment_id = event_data.get("payment_id") or event_data.get("id") or event_id
            customer = event_data.get("customer", {})
            customer_id = customer.get("customer_id") or event_data.get("customer_id")
            amount = event_data.get("total_amount") or event_data.get("amount") or 0
            currency = event_data.get("currency", "USD")
            product_cart = event_data.get("product_cart", [])
            product_id = product_cart[0].get("product_id") if product_cart else event_data.get("product_id")
            metadata = event_data.get("metadata", {})

            service.grant_paid_access(
                payment_id=payment_id,
                customer_id=customer_id,
                product_id=product_id,
                amount=amount,
                currency=currency,
                metadata=metadata
            )
            wh_record.status = "processed"
            wh_record.processed_at = datetime.now(timezone.utc)
            db.commit()
            logger.info(f"Successfully processed payment.succeeded webhook {event_id} for payment {payment_id}")

        elif event_type in ("payment.failed", "checkout.session.expired"):
            payment_id = event_data.get("payment_id") or event_data.get("id") or event_id
            customer = event_data.get("customer", {})
            customer_id = customer.get("customer_id")
            error_reason = event_data.get("error_message") or "Payment processing failed"
            metadata = event_data.get("metadata", {})

            service.record_payment_failure(
                payment_id=payment_id,
                customer_id=customer_id,
                error_message=error_reason,
                metadata=metadata
            )
            wh_record.status = "processed"
            wh_record.processed_at = datetime.now(timezone.utc)
            db.commit()

        elif event_type in ("refund.succeeded", "refund.created", "dispute.created"):
            payment_id = event_data.get("payment_id") or event_data.get("id")
            if payment_id:
                service.handle_refund(payment_id, reason=f"webhook_{event_type}")
            wh_record.status = "processed"
            wh_record.processed_at = datetime.now(timezone.utc)
            db.commit()

        else:
            logger.info(f"Acknowledged unhandled Dodo event type: {event_type}")
            wh_record.status = "ignored"
            wh_record.processed_at = datetime.now(timezone.utc)
            db.commit()

    except Exception as proc_err:
        logger.exception(f"Error handling webhook event {event_id}: {proc_err}")
        wh_record.status = "failed"
        wh_record.error = str(proc_err)
        db.commit()
        return Response(content=json.dumps({"error": "Failed to apply event"}), status_code=500, media_type="application/json")

    return Response(
        content=json.dumps({"received": True, "event_id": event_id, "event_type": event_type}),
        status_code=200,
        media_type="application/json"
    )


@router.post("/webhook")
async def billing_webhook_endpoint(request: Request, db: Session = Depends(get_db)):
    """Receives Dodo Payments webhooks under /api/v1/billing/webhook."""
    return await process_dodo_webhook(request, db)


@webhook_router.post("/webhooks/dodo")
async def root_dodo_webhook_endpoint(request: Request, db: Session = Depends(get_db)):
    """Receives Dodo Payments webhooks under /api/webhooks/dodo."""
    return await process_dodo_webhook(request, db)
