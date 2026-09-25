import pytest
import uuid
import os
from fastapi import HTTPException
from fastapi.testclient import TestClient

os.environ["ENVIRONMENT"] = "test"
os.environ["ENABLE_SURVEILLANCE_DAEMON"] = "false"

from app.main import app
from app.db.session import SessionLocal
from app.models.organizations import User, Organization, RoleEnum, PlanEnum
from app.models.billing import UserEntitlement, UsageEvent
from app.services.entitlement import EntitlementService

def test_user_three_actions_lockout_and_login_persistence():
    """
    STRICT VERIFICATION of user requirements:
    1. Dedicated non-premium user starts with 0/3 actions.
    2. Consumes Action 1 -> 1/3 used.
    3. Consumes Action 2 -> 2/3 used.
    4. Consumes Action 3 -> 3/3 used.
    5. Action 4 is STRICTLY BLOCKED with HTTP 402 PAYMENT_REQUIRED.
    6. User 'logs out' and 'logs back in' (retrieving user by Clerk ID).
    7. Verified: The state in PostgreSQL is CONTINUOUS and UNCHANGED (used=3, remaining=0).
    8. Background audit ledger confirms all 3 events are recorded with statutory live ledger.
    """
    db = SessionLocal()
    org_id = uuid.uuid4()
    user_id = uuid.uuid4()
    clerk_id = f"user_persistent_{uuid.uuid4().hex[:12]}"
    email = f"persisted_{uuid.uuid4().hex[:6]}@example.com"

    try:
        # Create user & org
        org = Organization(id=org_id, name="Test Persistence Workspace", plan=PlanEnum.trial)
        user = User(
            id=user_id,
            org_id=org_id,
            clerk_user_id=clerk_id,
            email=email,
            role=RoleEnum.developer
        )
        db.add(org)
        db.add(user)
        db.commit()

        service = EntitlementService(db)

        # 1. Initial State: 0/3 actions used
        initial_status = service.get_usage_summary(user)
        assert initial_status["free_usage"]["used"] == 0
        assert initial_status["free_usage"]["limit"] == 3
        assert initial_status["free_usage"]["remaining"] == 3
        assert initial_status["paid_access"] is False

        # 2. Action 1: Website Compliance Audit
        ev1 = service.reserve_usage(
            user=user,
            operation_type="website_audit",
            operation_id=f"audit_{uuid.uuid4().hex}",
            source="compliance_auditor",
            metadata={"target_url": "https://example.com"}
        )
        assert ev1.status == "reserved"
        assert ev1.credits_consumed == 1

        s1 = service.get_usage_summary(user)
        assert s1["free_usage"]["used"] == 1
        assert s1["free_usage"]["remaining"] == 2

        # 3. Action 2: Statutory Regulation Compilation
        ev2 = service.reserve_usage(
            user=user,
            operation_type="regulation_compilation",
            operation_id=f"compile_{uuid.uuid4().hex}",
            source="pdf_upload",
            metadata={"filename": "statute.pdf"}
        )
        assert ev2.status == "reserved"
        assert ev2.credits_consumed == 1

        s2 = service.get_usage_summary(user)
        assert s2["free_usage"]["used"] == 2
        assert s2["free_usage"]["remaining"] == 1

        # 4. Action 3: Statutory Framework Ingestion
        ev3 = service.reserve_usage(
            user=user,
            operation_type="framework_ingestion",
            operation_id=f"ingest_{uuid.uuid4().hex}",
            source="framework_catalog",
            metadata={"acronym": "GDPR"}
        )
        assert ev3.status == "reserved"
        assert ev3.credits_consumed == 1

        s3 = service.get_usage_summary(user)
        assert s3["free_usage"]["used"] == 3
        assert s3["free_usage"]["remaining"] == 0

        # 5. Action 4: STRICT 402 PAYMENT_REQUIRED LOCKOUT
        with pytest.raises(HTTPException) as exc_info:
            service.reserve_usage(
                user=user,
                operation_type="website_audit",
                operation_id=f"audit_{uuid.uuid4().hex}",
                source="compliance_crawler",
                metadata={"target_url": "https://blocked.com"}
            )

        assert exc_info.value.status_code == 402
        assert isinstance(exc_info.value.detail, dict)
        detail: dict = exc_info.value.detail
        assert detail["code"] == "PAYMENT_REQUIRED"
        assert detail["free_uses_used"] == 3
        assert detail["free_uses_limit"] == 3
        assert detail["upgrade_required"] is True

        # =====================================================================
        # 6. SIMULATE LOGOUT AND LOGIN
        # =====================================================================
        # Discard the current database session (user logged out and disconnected)
        db.close()

        # Reconnect with a fresh session (user logs back in with Clerk ID)
        db_new = SessionLocal()
        service_new = EntitlementService(db_new)

        # Lookup user by Clerk ID exactly as auth.py does upon login
        logged_in_user = db_new.query(User).filter(User.clerk_user_id == clerk_id).first()
        assert logged_in_user is not None
        assert logged_in_user.id == user_id

        # Authoritative billing summary after re-login
        status_after_relogin = service_new.get_usage_summary(logged_in_user)
        assert status_after_relogin["free_usage"]["used"] == 3
        assert status_after_relogin["free_usage"]["limit"] == 3
        assert status_after_relogin["free_usage"]["remaining"] == 0
        assert status_after_relogin["paid_access"] is False

        # Attempting an action after re-login MUST STILL FAIL with 402
        with pytest.raises(HTTPException) as exc_relogin:
            service_new.reserve_usage(
                user=logged_in_user,
                operation_type="regulation_compilation",
                operation_id=f"compile_after_relogin_{uuid.uuid4().hex}"
            )
        assert exc_relogin.value.status_code == 402

        # 7. Background usage events ledger check (all 3 actions permanently in DB)
        recorded_events = db_new.query(UsageEvent).filter(UsageEvent.org_id == org_id).all()
        assert len(recorded_events) == 3
        assert sum(e.credits_consumed for e in recorded_events) == 3

        db_new.close()

    finally:
        # Cleanup
        db_cleanup = SessionLocal()
        try:
            db_cleanup.query(UsageEvent).filter(UsageEvent.org_id == org_id).delete()
            db_cleanup.query(UserEntitlement).filter(UserEntitlement.org_id == org_id).delete()
            db_cleanup.query(User).filter(User.org_id == org_id).delete()
            db_cleanup.query(Organization).filter(Organization.id == org_id).delete()
            db_cleanup.commit()
        except Exception:
            db_cleanup.rollback()
        finally:
            db_cleanup.close()
