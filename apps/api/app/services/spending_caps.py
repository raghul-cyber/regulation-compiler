import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.audit import LLMLog
from app.models.organizations import Organization, PlanEnum

logger = logging.getLogger("services.spending_caps")

# Default monthly spending caps by organization tier in USD ($)
TIER_MONTHLY_CAPS: Dict[str, float] = {
    "trial": 10.00,       # $10 max monthly LLM budget
    "standard": 100.00,   # $100 max monthly LLM budget
    "enterprise": 1000.00 # $1,000 max monthly LLM budget
}


class SpendingCapExceededException(Exception):
    """Raised when an organization attempts an LLM query that exceeds its monthly spending cap."""
    def __init__(self, current_spend: float, cap: float, plan: str):
        self.current_spend = current_spend
        self.cap = cap
        self.plan = plan
        super().__init__(
            f"Monthly LLM spending cap of ${cap:.2f} exceeded for tier '{plan}'. Current spend: ${current_spend:.2f}."
        )


def get_current_month_spend(db: Session, org_id: uuid.UUID | None = None) -> float:
    """
    Computes total LLM spend in USD for the current calendar month from llm_logs.
    """
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    total = db.query(func.coalesce(func.sum(LLMLog.estimated_cost), 0.0)).filter(
        LLMLog.created_at >= month_start
    ).scalar()

    return float(total or 0.0)


def get_org_spending_cap(db: Session, org_id: uuid.UUID | None) -> Tuple[float, str]:
    """
    Retrieves the configured spending cap and plan name for an organization.
    """
    if not org_id:
        return TIER_MONTHLY_CAPS["trial"], "trial"

    org = db.query(Organization).filter(Organization.id == org_id).first()
    plan_name = org.plan.value if (org and hasattr(org.plan, 'value')) else (org.plan if org else "trial")
    cap = TIER_MONTHLY_CAPS.get(plan_name, 10.00)
    return cap, plan_name


def check_spending_cap(db: Session, org_id: uuid.UUID | None, expected_invocation_cost: float = 0.005) -> bool:
    """
    Verifies that the organization will not exceed its monthly spending cap.
    Raises SpendingCapExceededException if cap is exceeded.
    """
    cap, plan = get_org_spending_cap(db, org_id)
    current_spend = get_current_month_spend(db, org_id)

    if (current_spend + expected_invocation_cost) > cap:
        logger.warning(
            f"SPENDING CAP EXCEEDED: Org {org_id} ({plan}) spend ${current_spend:.4f} + ${expected_invocation_cost:.4f} > cap ${cap:.2f}"
        )
        raise SpendingCapExceededException(current_spend, cap, plan)

    return True


def get_spending_report(db: Session, org_id: uuid.UUID | None) -> Dict[str, Any]:
    """
    Returns structured spending data for the organization.
    """
    now = datetime.now(timezone.utc)
    cap, plan = get_org_spending_cap(db, org_id)
    current_spend = get_current_month_spend(db, org_id)
    pct = round((current_spend / cap) * 100, 2) if cap > 0 else 100.0

    return {
        "current_spend_usd": round(current_spend, 4),
        "spending_cap_usd": round(cap, 2),
        "usage_percentage": min(pct, 100.0),
        "is_capped": current_spend >= cap,
        "plan": plan,
        "billing_cycle": now.strftime("%B %Y"),
        "currency": "USD"
    }
