import traceback
import uuid
import os
os.environ["AWS_ACCESS_KEY_ID"] = "" # force empty
from app.services.reporting import generate_pdf_report_task
from app.core.db import SessionLocal
from app.models.organizations import Organization
from app.models.regulations import Regulation, RegulationVersion
from app.models.audit import Report, ReportTypeEnum

db = SessionLocal()
org = db.query(Organization).first()
reg = Regulation(name="Test Regulation", jurisdiction="US", org_id=org.id)
db.add(reg)
db.commit()
rep = Report(regulation_id=reg.id, report_type=ReportTypeEnum.executive_summary, org_id=org.id)
db.add(rep)
db.commit()

try:
    generate_pdf_report_task(str(rep.id), None)
    print("Success")
except Exception as e:
    traceback.print_exc()
