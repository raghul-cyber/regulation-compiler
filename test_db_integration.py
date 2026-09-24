import sys
import os
import unittest

sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'api'))

from app.db.session import SessionLocal
from app.models.organizations import User, Organization
from app.models.billing import UserEntitlement

db = SessionLocal()

try:
    print("1. Checking Samarjeeth user in database...")
    user = db.query(User).filter(User.clerk_user_id == "user_3JKDUKZru9dKgWGQ5EBghqYTPCZ").first()
    assert user is not None, "Samarjeeth user not found in DB"
    print(f"   Found user: {user.email}, Role: {user.role}, Org ID: {user.org_id}")

    print("2. Checking organization in database...")
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    assert org is not None, "Organization not found"
    print(f"   Found org: {org.name}, Plan: {org.plan}")

    print("3. Checking user entitlement...")
    ent = db.query(UserEntitlement).filter(UserEntitlement.org_id == user.org_id).first()
    assert ent is not None, "Entitlement not found"
    print(f"   Found entitlement: Plan: {ent.plan}, Status: {ent.status}, Limit: {ent.free_usage_limit}, Used: {ent.free_usage_used}")

    print("4. Testing billing summary service for user...")
    from app.services.entitlement import EntitlementService
    service = EntitlementService(db)
    summary = service.get_usage_summary(user)
    print(f"   Usage summary: {summary}")
    assert summary["status"] == "active" or summary["plan"] is not None

    print("\nAll database integration checks passed flawlessly!")
finally:
    db.close()
