import time
from typing import Dict, Tuple, Optional
from datetime import datetime, timezone
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import get_optional_current_user
from app.models.organizations import User, Organization, PlanEnum

# Daily API request limits by plan tier
PLAN_QUOTAS: Dict[str, int] = {
    "trial": 200,          # 200 requests / day
    "standard": 10000,     # 10,000 requests / day
    "enterprise": 250000,  # 250,000 requests / day
}

# In-memory quota store: { "org_id:YYYY-MM-DD": request_count }
# Resets daily automatically based on UTC date string
_daily_usage_store: Dict[str, int] = {}


def check_api_quota(
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Dependency that enforces organization plan API quotas and injects
    X-RateLimit-* response headers.
    """
    if not current_user or not current_user.org_id:
        return  # Unauthenticated public routes handled by Slowapi

    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    plan_name = org.plan.value if (org and hasattr(org.plan, 'value')) else (org.plan if org else "trial")
    limit = PLAN_QUOTAS.get(plan_name, 200)

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = f"{str(current_user.org_id)}:{today_str}"
    
    current_count = _daily_usage_store.get(key, 0) + 1
    _daily_usage_store[key] = current_count

    remaining = max(0, limit - current_count)
    # Store in request state for response headers injection
    request.state.quota_limit = limit
    request.state.quota_remaining = remaining
    request.state.quota_plan = plan_name

    if current_count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "API_QUOTA_EXCEEDED",
                "message": f"Daily API quota limit ({limit} requests) for plan '{plan_name}' has been exceeded.",
                "plan": plan_name,
                "limit": limit,
                "reset_utc": f"{today_str}T23:59:59Z",
                "upgrade_url": "/dashboard/settings?tab=billing"
            }
        )
