import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user
from app.models.organizations import User, RoleEnum
import uuid
import os
from sqlalchemy import create_engine, text

client = TestClient(app)

def mock_get_admin_user():
    return User(id=uuid.uuid4(), role=RoleEnum.admin, email="admin@example.com", org_id=uuid.uuid4())

def mock_get_developer_user():
    return User(id=uuid.uuid4(), role=RoleEnum.developer, email="dev@example.com", org_id=uuid.uuid4())

print("--- 1 & 2. Testing Upload as Admin (Real PDF) ---")
app.dependency_overrides[get_current_user] = mock_get_admin_user

pdf_path = os.path.join(os.path.dirname(__file__), "..", "..", "dummy.pdf")
if not os.path.exists(pdf_path):
    print(f"Error: Could not find dummy.pdf at {pdf_path}")
else:
    with open(pdf_path, "rb") as f:
        pdf_content = f.read()
    
    response = client.post(
        "/api/v1/regulations/upload",
        data={"jurisdiction": "EU", "name": "GDPR Consolidated Text"},
        files={"file": ("gdpr.pdf", pdf_content, "application/pdf")}
    )
    print("API Response:", response.status_code, response.json())
    
    print("\n--- 4. Querying the Real Database ---")
    engine = create_engine("postgresql://postgres:postgres@localhost:5432/regulation_db")
    with engine.connect() as conn:
        print("\nTable: regulations")
        regs = conn.execute(text("SELECT * FROM regulations ORDER BY created_at DESC LIMIT 1")).fetchall()
        for r in regs: print(r)
        
        print("\nTable: regulation_versions")
        vers = conn.execute(text("SELECT * FROM regulation_versions ORDER BY created_at DESC LIMIT 1")).fetchall()
        for v in vers: print(v)
        
        print("\nTable: source_documents")
        docs = conn.execute(text("SELECT * FROM source_documents ORDER BY created_at DESC LIMIT 1")).fetchall()
        for d in docs: print(d)

print("\n--- 5. Testing Invalid File Type (.txt) as Admin ---")
response = client.post(
    "/api/v1/regulations/upload",
    data={"jurisdiction": "EU", "name": "GDPR"},
    files={"file": ("test.txt", b"plain text", "text/plain")}
)
print("Response:", response.status_code, response.json())

print("\n--- 6. Testing Upload as Developer (Should Fail) ---")
app.dependency_overrides[get_current_user] = mock_get_developer_user
response = client.post(
    "/api/v1/regulations/upload",
    data={"jurisdiction": "EU", "name": "GDPR"},
    files={"file": ("test.pdf", b"fake pdf content", "application/pdf")}
)
print("Response:", response.status_code, response.json())

