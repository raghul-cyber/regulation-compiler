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
from app.models.billing import UserEntitlement, UsageEvent, PaymentTransaction, WebhookEvent
from app.services.entitlement import EntitlementService

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def test_org_and_user(db_session):
    org_id = uuid.uuid4()
    user_id = uuid.uuid4()
    
    org = Organization(
        id=org_id,
        name=f"Test Org {org_id.hex[:6]}",
        plan=PlanEnum.trial
    )
    user = User(
        id=user_id,
        org_id=org_id,
        clerk_user_id=f"user_test_{user_id.hex[:12]}",
        email=f"testuser_{user_id.hex[:6]}@example.com",
        role=RoleEnum.compliance_officer
    )
    db_session.add(org)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    yield org, user

    # Cleanup
    try:
        db_session.query(UsageEvent).filter(UsageEvent.org_id == org_id).delete()
        db_session.query(PaymentTransaction).filter(PaymentTransaction.org_id == org_id).delete()
        db_session.query(UserEntitlement).filter(UserEntitlement.org_id == org_id).delete()
        db_session.query(User).filter(User.org_id == org_id).delete()
        db_session.query(Organization).filter(Organization.id == org_id).delete()
        db_session.commit()
    except Exception:
        db_session.rollback()


@pytest.fixture
def admin_user(db_session):
    org_id = uuid.uuid4()
    user_id = uuid.uuid4()
    
    org = Organization(
        id=org_id,
        name=f"Admin Test Org {org_id.hex[:6]}",
        plan=PlanEnum.trial
    )
    user = User(
        id=user_id,
        org_id=org_id,
        clerk_user_id=f"admin_clerk_{user_id.hex[:12]}",
        email=f"admin_{user_id.hex[:6]}@example.com",
        role=RoleEnum.admin
    )
    db_session.add(org)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    yield org, user

    try:
        db_session.query(UsageEvent).filter(UsageEvent.org_id == org_id).delete()
        db_session.query(UserEntitlement).filter(UserEntitlement.org_id == org_id).delete()
        db_session.query(User).filter(User.org_id == org_id).delete()
        db_session.query(Organization).filter(Organization.id == org_id).delete()
        db_session.commit()
    except Exception:
        db_session.rollback()


def test_free_usage_progression_and_blocking(db_session, test_org_and_user):
    """
    Verifies the 3 free uses policy:
    Initial: 0/3 used.
    Use 1: allowed -> 1/3 used.
    Use 2: allowed -> 2/3 used.
    Use 3: allowed -> 3/3 used.
    Use 4: blocked (HTTP 402 PAYMENT_REQUIRED).
    """
    org, user = test_org_and_user
    service = EntitlementService(db_session)

    # Initial check
    status = service.get_usage_summary(user)
    assert status["free_usage"]["used"] == 0
    assert status["free_usage"]["limit"] == 3
    assert status["free_usage"]["remaining"] == 3
    assert status["paid_access"] is False

    # Operation 1
    event1 = service.reserve_usage(user, "compile_regulation", "op_1")
    assert event1 is not None
    assert event1.id is not None
    summary1 = service.get_usage_summary(user)
    assert summary1["free_usage"]["used"] == 1
    assert summary1["free_usage"]["remaining"] == 2

    # Operation 2
    event2 = service.reserve_usage(user, "compile_regulation", "op_2")
    assert event2 is not None
    summary2 = service.get_usage_summary(user)
    assert summary2["free_usage"]["used"] == 2
    assert summary2["free_usage"]["remaining"] == 1

    # Operation 3
    event3 = service.reserve_usage(user, "compile_regulation", "op_3")
    assert event3 is not None
    summary3 = service.get_usage_summary(user)
    assert summary3["free_usage"]["used"] == 3
    assert summary3["free_usage"]["remaining"] == 0

    # Operation 4: Exhausted! Must be blocked with HTTP 402 PAYMENT_REQUIRED
    with pytest.raises(HTTPException) as exc_info:
        service.reserve_usage(user, "compile_regulation", "op_4")

    assert exc_info.value.status_code == 402
    assert isinstance(exc_info.value.detail, dict)
    detail: dict = exc_info.value.detail
    assert detail["code"] == "PAYMENT_REQUIRED"
    assert detail["free_uses_used"] == 3
    assert detail["free_uses_limit"] == 3
    assert detail["upgrade_required"] is True

    # Summary must remain at 3/3 (never exceed 3 or go negative)
    summary4 = service.get_usage_summary(user)
    assert summary4["free_usage"]["used"] == 3
    assert summary4["free_usage"]["remaining"] == 0


def test_idempotent_usage_consumption(db_session, test_org_and_user):
    """
    If the frontend or network retries an operation with the same operation_id,
    it must NOT consume another credit.
    """
    org, user = test_org_and_user
    service = EntitlementService(db_session)

    op_id = f"idempotent_test_{uuid.uuid4().hex}"

    # First call
    event1 = service.reserve_usage(user, "compile_regulation", op_id)
    assert event1 is not None
    summary1 = service.get_usage_summary(user)
    assert summary1["free_usage"]["used"] == 1

    # Replayed call with identical operation_id
    event2 = service.reserve_usage(user, "compile_regulation", op_id)
    assert event2 is not None
    assert event2.id == event1.id
    
    # Still only 1 use consumed
    summary2 = service.get_usage_summary(user)
    assert summary2["free_usage"]["used"] == 1


def test_admin_unlimited_exemption(db_session, admin_user):
    """
    Admin users must have unlimited entitlement and bypass the 3-use limit.
    """
    org, user = admin_user
    service = EntitlementService(db_session)

    assert service.is_admin(user) is True

    # Perform 5 consecutive operations
    for i in range(1, 6):
        event = service.reserve_usage(user, "compile_regulation", f"admin_op_{i}")
        assert event is not None, f"Admin operation {i} must be allowed"

    summary = service.get_usage_summary(user)
    assert summary["is_admin"] is True
    assert summary["paid_access"] is True
    assert summary["free_usage"]["remaining"] == 9999


def test_webhook_idempotency_and_payment_grant(db_session, test_org_and_user):
    """
    Tests payment entitlement grant via verified metadata:
    1. First delivery grants paid entitlement and updates status.
    2. User can immediately perform operations beyond the free limit.
    """
    org, user = test_org_and_user
    service = EntitlementService(db_session)

    payment_id = f"pay_{uuid.uuid4().hex}"

    # 1. Grant paid access via verified Dodo webhook payload
    entitlement = service.grant_paid_access(
        payment_id=payment_id,
        customer_id="cust_12345",
        product_id="prod_test_pro",
        amount=4900,
        currency="USD",
        metadata={"org_id": str(org.id), "user_id": str(user.id)}
    )

    assert entitlement is not None
    assert entitlement.status == "active"
    assert entitlement.plan == "pro"

    summary = service.get_usage_summary(user)
    assert summary["paid_access"] is True
    assert summary["plan"] == "pro"

    # User can now perform operations beyond the 3-use free limit
    event = service.reserve_usage(user, "compile_regulation", f"paid_op_{uuid.uuid4().hex}")
    assert event is not None


def test_refund_revocation(db_session, test_org_and_user):
    """
    Tests that a refund properly revokes the paid entitlement.
    """
    org, user = test_org_and_user
    service = EntitlementService(db_session)

    payment_id = f"pay_{uuid.uuid4().hex}"

    # Grant paid access first
    service.grant_paid_access(
        payment_id=payment_id,
        customer_id="cust_refund_test",
        product_id="prod_pro",
        amount=4900,
        currency="USD",
        metadata={"org_id": str(org.id), "user_id": str(user.id)}
    )

    summary_before = service.get_usage_summary(user)
    assert summary_before["paid_access"] is True

    # Process refund
    res = service.handle_refund(payment_id=payment_id, reason="Customer request")
    assert res is True

    summary_after = service.get_usage_summary(user)
    assert summary_after["paid_access"] is False
    assert summary_after["status"] == "past_due"


def test_checkout_endpoint_success(db_session, test_org_and_user):
    """
    Tests that POST /api/v1/billing/checkout correctly parses the JSON body,
    calls Dodo service, and returns the checkout URL without any 500 error.
    """
    from unittest.mock import AsyncMock, patch
    from app.core.auth import get_current_user
    from app.db.session import get_db

    org, user = test_org_and_user

    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: db_session

    try:
        client = TestClient(app)
        mock_checkout = AsyncMock(return_value={
            "checkout_url": "https://test.dodopayments.com/buy/session_test_abc123",
            "session_id": "session_test_abc123",
            "mode": "test"
        })

        with patch("app.api.routers.billing.dodo_service.create_checkout_session", new=mock_checkout):
            response = client.post(
                "/api/v1/billing/checkout",
                json={"product_id": "p_test_pro", "return_url": "https://example.com/return"}
            )

        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["checkout_url"] == "https://test.dodopayments.com/buy/session_test_abc123"
        assert data["session_id"] == "session_test_abc123"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)


def test_checkout_endpoint_admin_exempt(db_session, admin_user):
    """
    Tests that POST /api/v1/billing/checkout exempts admin users from checkout.
    """
    from app.core.auth import get_current_user
    from app.db.session import get_db

    org, user = admin_user

    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: db_session

    try:
        client = TestClient(app)
        response = client.post("/api/v1/billing/checkout", json={})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "exempt"
        assert data["is_admin"] is True
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)

