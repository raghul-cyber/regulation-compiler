import sys
import os
import time
sys.path.append(os.path.abspath('.'))

import httpx
from app.db.session import SessionLocal
from app.models.requirements import Requirement
from app.models.regulations import SourceDocument

print("Uploading test PDF...")
with open("test_upload_script.py", "r", encoding="utf-8") as f:
    # Just run the upload script
    pass

import subprocess
subprocess.run([sys.executable, "test_upload_script.py"])

print("\nWaiting 10 seconds for Celery to process the extraction pipeline (OpenAI calls etc)...")
for i in range(10):
    time.sleep(1)
    print(".", end="", flush=True)
print()

db = SessionLocal()
latest_doc = db.query(SourceDocument).order_by(SourceDocument.created_at.desc()).first()
print(f"Latest uploaded SourceDoc: {latest_doc.id}, Pages: {latest_doc.page_count}")

# Check requirements
if latest_doc.regulation_version_id:
    reqs = db.query(Requirement).filter(Requirement.regulation_version_id == latest_doc.regulation_version_id).all()
    print(f"Found {len(reqs)} requirements!")
    for i, req in enumerate(reqs[:3]):
        print(f"Req {i+1}: {req.title} (Severity: {req.severity})")
else:
    print("No regulation_version_id attached to SourceDocument yet.")
