import os
import uuid
import asyncio
from sqlalchemy import create_engine, text
from app.database import SessionLocal
from app.models.organizations import Organization, User, RoleEnum
from app.models.regulations import Regulation, RegulationVersion
from app.models.audit import Report, ReportTypeEnum
from app.models.jobs import BackgroundJob, JobStatusEnum
from app.services.reporting import generate_pdf_report_task

db = SessionLocal()

# 1. Create a mock regulation
org = db.query(Organization).first()
if not org:
    org = Organization(name="Test Org")
    db.add(org)
    db.commit()

reg = Regulation(name="Test Regulation", jurisdiction="US", org_id=org.id)
db.add(reg)
db.commit()

ver = RegulationVersion(regulation_id=reg.id, version_label="v1", org_id=org.id)
db.add(ver)
db.commit()

# 2. Create a mock Executive Summary Report
job1 = BackgroundJob(job_type="report_generation", org_id=org.id)
db.add(job1)
db.commit()

rep1 = Report(regulation_id=reg.id, report_type=ReportTypeEnum.executive_summary, org_id=org.id)
db.add(rep1)
db.commit()

print(f"\n--- Generating Executive Summary Report (Job: {job1.id}) ---")
generate_pdf_report_task(str(rep1.id), str(job1.id))

db.refresh(rep1)
print(f"Executive Summary URL: {rep1.storage_path}")

# 3. Create a mock Technical Report
job2 = BackgroundJob(job_type="report_generation", org_id=org.id)
db.add(job2)
db.commit()

rep2 = Report(regulation_id=reg.id, report_type=ReportTypeEnum.technical, org_id=org.id)
db.add(rep2)
db.commit()

print(f"\n--- Generating Technical Report (Job: {job2.id}) ---")
generate_pdf_report_task(str(rep2.id), str(job2.id))

db.refresh(rep2)
print(f"Technical Report URL: {rep2.storage_path}")

print("\n--- Verification: Querying Database for Reports ---")
engine = create_engine(os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/rac_db"))
with engine.connect() as conn:
    rows = conn.execute(text(f"SELECT id, regulation_id, report_type, status, storage_path FROM reports WHERE regulation_id = '{reg.id}'")).fetchall()
    for row in rows:
        print(row)

