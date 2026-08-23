import sys
import os
import uuid
import time
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.regulations import SourceDocument
from app.models.requirements import Requirement
from app.models.jobs import BackgroundJob

db = SessionLocal()
doc = db.query(SourceDocument).order_by(SourceDocument.created_at.desc()).first()

print(f"Triggering ingestion for SourceDoc: {doc.id} (File: {doc.storage_path})")
job_id = str(uuid.uuid4())
job = BackgroundJob(
    id=uuid.UUID(job_id),
    job_type="ingestion",
    entity_id=str(doc.id),
    status="queued"
)
db.add(job)
db.commit()

from app.pipelines.extraction import run_extraction_pipeline
try:
    run_extraction_pipeline(db, doc.id, job_id)
    print("\n\n>>> Extraction pipeline completed synchronously.")
except Exception as e:
    print(f"\n\n>>> Extraction failed: {e}")

reqs = db.query(Requirement).filter(Requirement.regulation_version_id == doc.regulation_version_id).all()
print(f"Total Requirements now in DB for this document: {len(reqs)}")
for i, req in enumerate(reqs):
    print(f" - [{req.severity.value}] {req.title}")
    
