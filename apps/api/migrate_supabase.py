import os
import sys

from dotenv import load_dotenv
load_dotenv("../../.env")

from sqlalchemy import create_engine, text
from app.db.session import engine

with engine.connect() as conn:
    print("Installing PostgreSQL extensions...")
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    conn.commit()
    print("Extensions installed successfully!")

from app.models.base import Base
import app.models.organizations
import app.models.regulations
import app.models.requirements
import app.models.jobs
import app.models.audit
import app.models.customer

print("Running Base.metadata.create_all...")
Base.metadata.create_all(bind=engine)
print("Base.metadata.create_all succeeded!")

with engine.connect() as conn:
    tables = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")).fetchall()
    print("Public tables in DB now:")
    for t in tables:
        print("  -", t[0])
