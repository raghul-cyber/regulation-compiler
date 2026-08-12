import os
import sys
import json
import uuid
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/regulation_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify():
    db = SessionLocal()
    try:
        print("=== Backend Phase 8 Verification ===")
        
        # 1. Grab a regulation and version
        req = db.execute(text("SELECT regulation_version_id FROM requirements LIMIT 1")).fetchone()
        if not req:
            print("No requirements found.")
            return
            
        rv = db.execute(text("SELECT regulation_id FROM regulation_versions WHERE id = :id"), {"id": req.regulation_version_id}).fetchone()
        reg_id = rv.regulation_id
        
        # Ensure it's the current version
        db.execute(text("UPDATE regulations SET current_version_id = :rv_id WHERE id = :r_id"), {"rv_id": req.regulation_version_id, "r_id": reg_id})
        db.commit()
        
        print(f"Regulation ID: {reg_id}")
        
        # 2. Test GET endpoint logic directly
        from app.api.routers.requirements import list_requirements
        
        # We need a mock user
        from app.models.organizations import User, RoleEnum
        user = db.query(User).first()
        if not user:
            print("No users found.")
            return
            
        print(f"Testing list_requirements as {user.email}...")
        res = list_requirements(regulation_id=reg_id, limit=5, current_user=user, db=db)
        
        print(f"Fetched {len(res['data'])} requirements.")
        print(f"Next Cursor: {res['next_cursor']}")
        if len(res['data']) > 0:
            print(f"Sample Title: {res['data'][0]['title']}")
            print(f"Has Source Text: {'source_text' in res['data'][0]}")
            
        # 3. Test PATCH endpoint
        target_req = res['data'][0]['id']
        from app.api.routers.requirements import update_requirement_status, RequirementStatusUpdate
        from app.models.requirements import ValidationStatusEnum
        
        print(f"\nTesting update_requirement_status on {target_req}...")
        payload = RequirementStatusUpdate(status=ValidationStatusEnum.approved, reviewer_note="Looks good!")
        update_res = update_requirement_status(requirement_id=target_req, payload=payload, current_user=user, db=db)
        print("Patch Result:", update_res)
        
        # 4. Check Audit Log
        audit = db.execute(text("SELECT action, metadata FROM audit_log WHERE entity_id = :id"), {"id": target_req}).fetchone()
        if audit:
            print(f"\nAudit Log Created!")
            print(f"Action: {audit.action}")
            print(f"Metadata: {audit.metadata}")
        else:
            print("\nWARNING: Audit Log not found!")
            
    finally:
        db.close()

if __name__ == "__main__":
    verify()
