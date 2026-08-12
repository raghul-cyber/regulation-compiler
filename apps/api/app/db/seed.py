import sys
import os

# Add the apps/api directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal
from app.models.organizations import Organization, User, PlanEnum, RoleEnum

def seed_db():
    print("Starting database seeding...")
    db = SessionLocal()
    try:
        # Check if we already have an org
        existing_org = db.query(Organization).first()
        if existing_org:
            print("Database already seeded!")
            return

        print("Inserting organization...")
        org = Organization(
            name="Acme Corp",
            plan=PlanEnum.enterprise
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        print(f"Organization '{org.name}' created with ID: {org.id}")

        print("Inserting user...")
        user = User(
            org_id=org.id,
            clerk_user_id="user_2XsomeIdGoesHere",
            role=RoleEnum.admin,
            email="admin@acmecorp.example.com"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        print(f"User '{user.email}' created with ID: {user.id}")

        print("Seeding complete!")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
