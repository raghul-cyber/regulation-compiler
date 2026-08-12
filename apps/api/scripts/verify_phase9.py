import os
import sys
import uuid
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.db.session import get_db
from app.models.organizations import User

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/regulation_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify():
    db = SessionLocal()
    try:
        print("=== Backend Phase 9 Verification ===")
        
        # Grab regulation ID
        rv = db.execute(text("SELECT regulation_version_id FROM requirements LIMIT 1")).fetchone()
        if not rv:
            print("No requirements found.")
            return
            
        reg = db.execute(text("SELECT regulation_id FROM regulation_versions WHERE id = :id"), {"id": rv.regulation_version_id}).fetchone()
        reg_id = reg.regulation_id
        
        user = db.query(User).first()
        
        from app.api.routers.regulations import get_dashboard_summary, get_recent_activity
        
        print(f"Testing get_dashboard_summary for Regulation ID: {reg_id}...")
        summary = get_dashboard_summary(regulation_id=reg_id, current_user=user, db=db)
        print("Summary Data:")
        for k, v in summary.items():
            print(f"  {k}: {v}")
            
        print(f"\nTesting get_recent_activity for Regulation ID: {reg_id}...")
        activity = get_recent_activity(regulation_id=reg_id, current_user=user, db=db)
        print(f"Activity feed returned {len(activity['data'])} rows.")
        if len(activity['data']) > 0:
            print("Most recent activity:")
            log = activity['data'][0]
            print(f"  Action: {log['action']} by {log['actor_email']} at {log['timestamp']}")
            print(f"  Metadata: {log['metadata']}")
            
    finally:
        db.close()

if __name__ == "__main__":
    verify()
