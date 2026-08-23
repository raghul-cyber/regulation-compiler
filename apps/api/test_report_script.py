import os
import time
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

import os
os.environ['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
os.environ['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user
from app.models.organizations import User, RoleEnum
import uuid
from sqlalchemy import create_engine, text

engine = create_engine(os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/rac_db"))
with engine.connect() as conn:
    row = conn.execute(text("SELECT id FROM organizations LIMIT 1")).fetchone()
    real_org_id = row[0]

client = TestClient(app)

def mock_get_admin_user():
    return User(id=uuid.uuid4(), role=RoleEnum.admin, email="admin@example.com", org_id=real_org_id)

app.dependency_overrides[get_current_user] = mock_get_admin_user

print("\n--- 1. Uploading PDF to trigger Ingestion ---")
pdf_path = os.path.join(os.path.dirname(__file__), "..", "..", "dummy.pdf")
with open(pdf_path, "rb") as f:
    pdf_content = f.read()

response = client.post(
    "/api/v1/regulations/upload",
    data={"jurisdiction": "EU", "name": "Test Regulation for Reports"},
    files={"file": ("dummy.pdf", pdf_content, "application/pdf")}
)
data = response.json()
print("Upload Response:", response.status_code, data)
reg_id = data.get("regulation_id")
job_id = data.get("job_id")

print(f"\n--- 2. Waiting for Ingestion Pipeline to Complete (Job: {job_id}) ---")
while True:
    res = client.get(f"/api/v1/jobs/{job_id}")
    status = res.json().get("status")
    print(f"Ingestion Status: {status}")
    if status in ["completed", "failed"]:
        break
    time.sleep(2)

print("\n--- 3. Triggering Executive Summary Report ---")
rep_res = client.post("/api/v1/reports", json={
    "regulation_id": reg_id,
    "report_type": "executive_summary"
})
rep_data = rep_res.json()
print("Report Creation Response:", rep_res.status_code, rep_data)
rep_job_id = rep_data.get("job_id")

print(f"\n--- 4. Waiting for Report Generation to Complete (Job: {rep_job_id}) ---")
while True:
    res = client.get(f"/api/v1/jobs/{rep_job_id}")
    status = res.json().get("status")
    print(f"Report Job Status: {status}")
    if status in ["completed", "failed"]:
        break
    time.sleep(1)

print("\n--- 5. Triggering Technical Report ---")
rep_res2 = client.post("/api/v1/reports", json={
    "regulation_id": reg_id,
    "report_type": "technical"
})
rep_data2 = rep_res2.json()
rep_job_id2 = rep_data2.get("job_id")

while True:
    res = client.get(f"/api/v1/jobs/{rep_job_id2}")
    status = res.json().get("status")
    print(f"Report Job 2 Status: {status}")
    if status in ["completed", "failed"]:
        break
    time.sleep(1)

print("\n--- 6. Listing Reports (Checking Signed URLs) ---")
list_res = client.get(f"/api/v1/reports/{reg_id}")
reports = list_res.json().get("data", [])
for r in reports:
    print(f"\nReport ID: {r['id']}")
    print(f"Type: {r['report_type']}")
    print(f"Status: {r['status']}")
    print(f"Download URL: {r['download_url'][:100]}... (truncated)")

print("\n--- 7. Querying Database for Reports Row ---")
with engine.connect() as conn:
    rows = conn.execute(text(f"SELECT id, regulation_id, report_type, status, storage_path FROM reports WHERE regulation_id = '{reg_id}'")).fetchall()
    for row in rows:
        print(row)

print("\nDone!")

