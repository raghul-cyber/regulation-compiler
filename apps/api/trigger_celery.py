import sys
import os
sys.path.append(os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.regulations import RegulationVersion
from app.workers.tasks import process_ingestion_pipeline

db = SessionLocal()
# Get the most recent version that has 0 requirements
versions = db.query(RegulationVersion).order_by(RegulationVersion.created_at.desc()).limit(10).all()

triggered = 0
for v in versions:
    if v.processing_status != "completed":
        print(f"Triggering ingestion for {v.id}")
        process_ingestion_pipeline.delay(str(v.id))
        triggered += 1

if triggered == 0:
    print("No incomplete versions found to trigger.")
else:
    print(f"Triggered {triggered} tasks.")
