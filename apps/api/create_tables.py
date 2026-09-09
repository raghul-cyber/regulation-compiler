import os
import sys

from sqlalchemy import text
from app.db.session import engine
from app.models.base import Base
import app.models.organizations
import app.models.regulations
import app.models.requirements
import app.models.jobs
import app.models.audit
import app.models.customer

# Ensure PostgreSQL extensions exist if using Postgres
try:
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
except Exception as ext_err:
    print(f"Notice: Extension creation skipped or not supported: {ext_err}")

# Create all tables safely via SQLAlchemy metadata
Base.metadata.create_all(bind=engine)
print("Tables and schema types verified successfully.")

# Check and auto-seed canonical frameworks & regulations if empty
try:
    from app.db.session import SessionLocal
    from app.models.regulations import Regulation, FrameworkCatalog
    db = SessionLocal()
    reg_count = db.query(Regulation).count()
    fw_count = db.query(FrameworkCatalog).count()
    print(f"Database readiness: {reg_count} regulations, {fw_count} frameworks.")
    if fw_count == 0:
        print("Auto-seeding framework catalog...")
        from seed_frameworks import seed_frameworks
        seed_frameworks()
    if reg_count == 0:
        print("Auto-seeding canonical statutory regulations & extracted requirements...")
        from seed_canonical_regulations import seed_canonical
        seed_canonical()
        print("Auto-seeding completed.")
    db.close()
except Exception as seed_err:
    print(f"Notice: Seeding check completed with notice: {seed_err}")


