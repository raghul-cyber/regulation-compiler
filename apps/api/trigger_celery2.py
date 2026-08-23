import sys
import os
sys.path.append(os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.regulations import RegulationVersion
from app.models.requirements import Requirement
from app.workers.tasks import process_ingestion_pipeline

db = SessionLocal()
versions = db.query(RegulationVersion).order_by(RegulationVersion.created_at.desc()).limit(3).all()

for v in versions:
    req_count = db.query(Requirement).filter(Requirement.regulation_version_id == v.id).count()
    if req_count == 0:
        print(f"Triggering ingestion for {v.id}")
        process_ingestion_pipeline.delay(str(v.id))
