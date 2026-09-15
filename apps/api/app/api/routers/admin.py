import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.db.session import get_db
from app.core.config import settings
from app.core.auth import get_current_user, get_optional_current_user
from app.models.organizations import User, Organization, RoleEnum, PlanEnum
from app.models.audit import AuditLog
from app.models.requirements import ComplianceCheck, Policy

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["SuperAdmin"])

SUPER_ADMIN_EMAIL = "rcraghul12@gmail.com"
SUPER_ADMIN_CLERK_ID = "user_3HpP6350OcHxY6bu77tdXEtihSE"


def get_clerk_secret_key() -> str:
    key = settings.CLERK_SECRET_KEY or os.environ.get("CLERK_SECRET_KEY")
    if not key:
        logger.warning("CLERK_SECRET_KEY is not configured on the server. Falling back to local PostgreSQL database registry.")
        return ""
    return key


def verify_super_admin(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Strict security gate: Ensures the requester is strictly rcraghul12@gmail.com.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access Super-Admin Control Panel."
        )

    # Sync / verify super-admin identity
    is_super_admin = False
    user_email = (current_user.email or "").strip().lower()
    if user_email == SUPER_ADMIN_EMAIL.lower():
        is_super_admin = True
    elif current_user.clerk_user_id == SUPER_ADMIN_CLERK_ID:
        is_super_admin = True
        # Self-heal database record if email was a fallback
        if current_user.email != SUPER_ADMIN_EMAIL:
            current_user.email = SUPER_ADMIN_EMAIL
            db.commit()

    if not is_super_admin:
        logger.warning(f"Unauthorized admin access attempt by user {current_user.id} ({current_user.email})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Security Clearance Denied: Access is strictly restricted to designated super-admin ({SUPER_ADMIN_EMAIL})."
        )

    return current_user


def fetch_live_clerk_users() -> List[Dict[str, Any]]:
    """
    Queries official Clerk REST API for all real registered users (Zero mocks).
    """
    secret_key = get_clerk_secret_key()
    if not secret_key:
        return []
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(
                "https://api.clerk.com/v1/users?limit=100&order_by=-created_at",
                headers={
                    "Authorization": f"Bearer {secret_key}",
                    "Content-Type": "application/json"
                }
            )
            if resp.status_code != 200:
                logger.error(f"Failed to fetch Clerk users: {resp.status_code} {resp.text}")
                return []
            return resp.json()
    except Exception as e:
        logger.error(f"Error communicating with Clerk API: {e}")
        return []


def sync_clerk_users_to_db(clerk_users: List[Dict[str, Any]], db: Session):
    """
    Synchronizes Clerk registered accounts into local PostgreSQL users table.
    """
    if not clerk_users:
        return

    # Fetch default organization
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Primary Workspace", plan=PlanEnum.enterprise)
        db.add(org)
        db.commit()
        db.refresh(org)

    for c_user in clerk_users:
        c_id = c_user.get("id")
        if not c_id:
            continue

        # Extract primary email
        primary_id = c_user.get("primary_email_address_id")
        emails = c_user.get("email_addresses", [])
        email_val = ""
        for e in emails:
            if e.get("id") == primary_id or not email_val:
                email_val = e.get("email_address", "")

        if not email_val and emails:
            email_val = emails[0].get("email_address", "")

        if not email_val:
            email_val = f"{c_id}@user.clerk"

        existing = db.query(User).filter(User.clerk_user_id == c_id).first()
        if existing:
            if existing.email != email_val and email_val:
                existing.email = email_val
                db.commit()
        else:
            role = RoleEnum.admin if email_val.lower() == SUPER_ADMIN_EMAIL.lower() else RoleEnum.developer
            new_user = User(
                org_id=org.id,
                clerk_user_id=c_id,
                role=role,
                email=email_val
            )
            db.add(new_user)
            try:
                db.commit()
            except Exception as ex:
                db.rollback()
                logger.warning(f"Error syncing user {c_id}: {ex}")


@router.get("/overview")
def get_admin_overview(
    admin: User = Depends(verify_super_admin),
    db: Session = Depends(get_db)
):
    """
    Comprehensive Super-Admin Overview:
    - Real users directory directly from Clerk API with verified email IDs and login timestamps.
    - Activity timeline and breakdown for graphics.
    - PostgreSQL audit trace telemetry.
    """
    # 1. Fetch live Clerk users
    clerk_users_raw = fetch_live_clerk_users()
    sync_clerk_users_to_db(clerk_users_raw, db)

    # Build structured user list
    users_list = []
    total_logins_recorded = 0
    active_in_last_24h = 0
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    one_day_ms = 24 * 60 * 60 * 1000

    for u in clerk_users_raw:
        c_id = u.get("id")
        first_name = u.get("first_name") or ""
        last_name = u.get("last_name") or ""
        full_name = f"{first_name} {last_name}".strip() or "Verified User"

        primary_id = u.get("primary_email_address_id")
        emails = u.get("email_addresses", [])
        primary_email = ""
        verification_strategy = "email_code"
        is_verified = False

        for e in emails:
            if e.get("id") == primary_id or not primary_email:
                primary_email = e.get("email_address", "")
                ver = e.get("verification", {}) or {}
                if ver.get("status") == "verified":
                    is_verified = True
                verification_strategy = ver.get("strategy") or "standard"

        if not primary_email and emails:
            primary_email = emails[0].get("email_address", "")

        last_sign_in = u.get("last_sign_in_at")
        last_active = u.get("last_active_at")
        created_at_ms = u.get("created_at")

        if last_sign_in:
            total_logins_recorded += 1
            if (now_ms - last_sign_in) < one_day_ms:
                active_in_last_24h += 1
        elif last_active and (now_ms - last_active) < one_day_ms:
            active_in_last_24h += 1

        # Check DB role
        db_user = db.query(User).filter(User.clerk_user_id == c_id).first()
        user_role = db_user.role.value if (db_user and hasattr(db_user.role, 'value')) else (db_user.role if db_user else "developer")
        if primary_email.lower() == SUPER_ADMIN_EMAIL.lower():
            user_role = "super_admin"

        # Count audit actions by this user
        audit_count = 0
        if db_user:
            audit_count = db.query(AuditLog).filter(AuditLog.actor_id == db_user.id).count()

        users_list.append({
            "id": c_id,
            "name": full_name,
            "email": primary_email,
            "avatar_url": u.get("image_url"),
            "role": user_role,
            "is_verified": is_verified,
            "auth_strategy": verification_strategy,
            "created_at": datetime.fromtimestamp(created_at_ms / 1000, tz=timezone.utc).isoformat() if created_at_ms else None,
            "last_sign_in_at": datetime.fromtimestamp(last_sign_in / 1000, tz=timezone.utc).isoformat() if last_sign_in else None,
            "last_active_at": datetime.fromtimestamp(last_active / 1000, tz=timezone.utc).isoformat() if last_active else None,
            "audit_actions_count": audit_count,
            "is_super_admin": primary_email.lower() == SUPER_ADMIN_EMAIL.lower()
        })

    if not users_list:
        # Fallback to local PostgreSQL database users
        db_users = db.query(User).all()
        for du in db_users:
            em = du.email or ""
            audit_count = db.query(AuditLog).filter(AuditLog.actor_id == du.id).count()
            users_list.append({
                "id": du.clerk_user_id or str(du.id),
                "name": em.split("@")[0].title() if em else "System User",
                "email": em or "unassigned@local",
                "avatar_url": None,
                "role": du.role.value if hasattr(du.role, "value") else str(du.role),
                "is_verified": True,
                "auth_strategy": "database",
                "created_at": du.created_at.isoformat() if hasattr(du, "created_at") and du.created_at else datetime.now(timezone.utc).isoformat(),
                "last_sign_in_at": None,
                "last_active_at": None,
                "audit_actions_count": audit_count,
                "is_super_admin": bool(em and em.lower() == SUPER_ADMIN_EMAIL.lower())
            })

    # Sort users: Super-admin first, then by last sign-in descending
    users_list.sort(key=lambda x: (not x["is_super_admin"], x["last_sign_in_at"] or ""), reverse=False)

    # 2. Activity Timeline Graphics Data (Group audit logs by day over past 14 days)
    now_utc = datetime.now(timezone.utc)
    days_map = {}
    for i in range(13, -1, -1):
        day_date = (now_utc - timedelta(days=i)).strftime("%b %d")
        days_map[day_date] = {
            "date": day_date,
            "actions": 0,
            "evaluations": 0,
            "probes": 0,
            "total": 0
        }

    all_logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(300).all()
    action_categories_count = {
        "SURVEILLANCE_PROBES": 0,
        "COMPLIANCE_EVALUATIONS": 0,
        "POLICY_MODIFICATIONS": 0,
        "SECURITY_AUDITS": 0,
        "OTHER_TELEMETRY": 0
    }

    for log in all_logs:
        log_date_str = log.created_at.strftime("%b %d") if log.created_at else None
        act = (log.action or "").lower()
        
        category = "OTHER_TELEMETRY"
        if "probe" in act or "surveillance" in act:
            category = "SURVEILLANCE_PROBES"
        elif "evaluate" in act or "compliance" in act:
            category = "COMPLIANCE_EVALUATIONS"
        elif "policy" in act or "requirement" in act:
            category = "POLICY_MODIFICATIONS"
        else:
            category = "SECURITY_AUDITS"

        action_categories_count[category] += 1

        if log_date_str in days_map:
            days_map[log_date_str]["total"] += 1
            if category == "SURVEILLANCE_PROBES":
                days_map[log_date_str]["probes"] += 1
            elif category == "COMPLIANCE_EVALUATIONS":
                days_map[log_date_str]["evaluations"] += 1
            else:
                days_map[log_date_str]["actions"] += 1

    activity_timeline = list(days_map.values())

    # 3. Action Breakdown chart data
    action_breakdown = [
        {"name": "Surveillance Probes", "category": "SURVEILLANCE_PROBES", "count": action_categories_count["SURVEILLANCE_PROBES"], "color": "#10b981"},
        {"name": "Policy Evaluations", "category": "COMPLIANCE_EVALUATIONS", "count": action_categories_count["COMPLIANCE_EVALUATIONS"], "color": "#3b82f6"},
        {"name": "Policy Updates", "category": "POLICY_MODIFICATIONS", "count": action_categories_count["POLICY_MODIFICATIONS"], "color": "#8b5cf6"},
        {"name": "Security Audits", "category": "SECURITY_AUDITS", "count": action_categories_count["SECURITY_AUDITS"], "color": "#f59e0b"},
    ]

    # 4. Recent Real Audit Log Entries
    recent_logs = []
    for log in all_logs[:15]:
        created_iso = log.created_at.isoformat() if log.created_at else now_utc.isoformat()
        # Find actor email
        actor_email = "Automated Engine"
        if log.actor_id:
            user_match = next((u for u in users_list if str(u.get("id")) == str(log.actor_id)), None)
            if user_match:
                actor_email = user_match["email"]
            else:
                db_u = db.query(User).filter(User.id == log.actor_id).first()
                if db_u:
                    actor_email = db_u.email

        recent_logs.append({
            "id": str(log.id),
            "action": log.action.replace("_", " ").title(),
            "entity_type": log.entity_type,
            "actor": actor_email,
            "timestamp": created_iso,
            "metadata": log.metadata_
        })

    # Summary Statistics
    total_checks = db.query(ComplianceCheck).count()
    total_policies = db.query(Policy).count()

    return {
        "status": "success",
        "authorized_admin": admin.email,
        "metrics": {
            "total_users": len(users_list),
            "verified_users_count": sum(1 for u in users_list if u["is_verified"]),
            "active_users_today": active_in_last_24h or 1,
            "total_audit_events": len(all_logs),
            "total_compliance_evaluations": total_checks,
            "total_active_policies": total_policies,
            "last_synced_at": now_utc.isoformat()
        },
        "users": users_list,
        "activity_timeline": activity_timeline,
        "action_breakdown": action_breakdown,
        "recent_audit_trail": recent_logs
    }


@router.post("/sync-users")
def trigger_users_sync(
    admin: User = Depends(verify_super_admin),
    db: Session = Depends(get_db)
):
    """
    Forces immediate reconciliation between Clerk user accounts and PostgreSQL database.
    """
    raw_users = fetch_live_clerk_users()
    sync_clerk_users_to_db(raw_users, db)
    return {
        "status": "success",
        "message": f"Successfully synchronized {len(raw_users)} Clerk user accounts with PostgreSQL.",
        "synced_count": len(raw_users),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
