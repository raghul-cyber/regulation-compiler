import sys
sys.path.insert(0, '.')
import uuid
from app.db.session import SessionLocal
from app.models.regulations import Regulation
from app.models.requirements import Requirement
from app.models.audit import Report, ReportTypeEnum, ReportStatusEnum
from app.models.jobs import BackgroundJob, JobTypeEnum, JobStatusEnum
from app.services.reporting import generate_pdf_report_task

db = SessionLocal()
reg = db.query(Regulation).filter(Regulation.current_version_id != None).first()
print(f"Using regulation: {reg.name} ({reg.id})")

report = Report(
    org_id=uuid.UUID('c2edd90d-0521-415c-b333-70769fba8df5'),
    regulation_id=reg.id,
    report_type=ReportTypeEnum.executive_summary,
    status=ReportStatusEnum.generating
)
db.add(report)
db.commit()
db.refresh(report)

job = BackgroundJob(
    job_type=JobTypeEnum.report,
    status=JobStatusEnum.queued,
    entity_id=str(report.id)
)
db.add(job)
db.commit()
db.refresh(job)

print(f"Created report {report.id} and job {job.id}")
print("Testing direct execution of generate_pdf_report_task...")
try:
    generate_pdf_report_task(str(report.id), str(job.id))
    db.refresh(report)
    print(f"Report status: {report.status}")
    print(f"Storage path: {report.storage_path}")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
