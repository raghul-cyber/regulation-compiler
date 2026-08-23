import httpx
import uuid
import asyncio
import os
import sys

from app.db.session import SessionLocal
from app.models.organizations import Organization, User, TeamInvite, RoleEnum
from app.models.regulations import FrameworkCatalog

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    db = SessionLocal()
    
    print("--- 1. RBAC Test ---")
    admin_clerk_id = "test_admin_" + str(uuid.uuid4())
    member_clerk_id = "test_member_" + str(uuid.uuid4())
    
    # Create org
    org = Organization(name="Test Org", plan="standard")
    db.add(org)
    db.commit()
    
    # Create Admin user
    admin = User(org_id=org.id, clerk_user_id=admin_clerk_id, role=RoleEnum.admin, email="admin@test.com")
    db.add(admin)
    
    # Create Invite & Member
    invite = TeamInvite(org_id=org.id, email="auditor@test.com", role=RoleEnum.auditor, token=str(uuid.uuid4()), status='accepted')
    db.add(invite)
    
    member = User(org_id=org.id, clerk_user_id=member_clerk_id, role=RoleEnum.auditor, email=invite.email)
    db.add(member)
    db.commit()
    print(f"Created member with role: {member.role.value}")
    
    # We will test RBAC via the API instead of raw dependency calls
    # To test RBAC, we'll try to hit a protected route as the auditor
    # We'll use get_current_user override
    from app.core.auth import get_current_user
    
    print("Simulating API request as Auditor to an Admin-only route (/api/v1/team/invites)...")
    app.dependency_overrides[get_current_user] = lambda: member
    client = TestClient(app)
    
    response = client.get("/api/v1/team/invites")
    if response.status_code == 403:
        print(f"SUCCESS: RBAC enforced correctly. API returned 403 Forbidden. Message: {response.json()}")
    else:
        print(f"ERROR: RBAC failed! API returned {response.status_code}")
        
    print("\n--- 2. Standard Framework Ingestion Test (NOT GDPR) ---")
    dora = db.query(FrameworkCatalog).filter(FrameworkCatalog.acronym == 'DORA').first()
    print(f"Selected Framework: {dora.name} ({dora.acronym}), Fetchable: {dora.is_fetchable}")
    
    print("Simulating Admin triggering ingest...")
    app.dependency_overrides[get_current_user] = lambda: admin
    
    # NOTE: The ingest endpoint does NOT have get_current_user attached in the router currently (public for now or inherited).
    # Wait, the ingest endpoint is currently public in our router (we didn't add Depends(get_current_user)). 
    # Let's hit it.
    
    # We will mock the StorageService because we don't have real S3 credentials configured in the script env
    # Actually, we might have S3 configured. Let's try.
    import httpx
    # Let's just do a live HTTP request to the local API
    # wait, TestClient uses Starlette, it can run it synchronously.
    # To prevent actual celery dispatch from hanging or throwing, we can patch `process_ingestion_pipeline.delay`
    from unittest.mock import patch
    with patch('app.workers.tasks.process_ingestion_pipeline.delay') as mock_delay:
        mock_delay.return_value.id = "mock_celery_task_123"
        response = client.post(f"/api/v1/regulations/frameworks/{dora.acronym}/ingest")
        
        print(f"Ingest API Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: Framework ingested. \nResponse: {data}")
            print(f"Real DB Version ID created: {data.get('regulation_version_id')}")
        else:
            print(f"ERROR: {response.text}")
            
    print("\n--- 3. Custom Upload Test ---")
    # Test uploading a file
    with patch('app.workers.tasks.process_ingestion_pipeline.delay') as mock_delay:
        mock_delay.return_value.id = "mock_celery_task_123"
        
        # TestClient upload
        files = {'file': ('test.html', '<html><body>Test</body></html>', 'text/html')}
        data = {'jurisdiction': 'US', 'name': 'Test Reg'}
        response = client.post("/api/v1/regulations/upload", files=files, data=data)
        
        print(f"Upload API Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"SUCCESS: Custom upload succeeded. \nResponse: {response.json()}")
        else:
            print(f"ERROR: {response.text}")
    
    print("\n--- 4. Query Framework Catalog ---")
    frameworks = db.query(FrameworkCatalog).all()
    for f in frameworks:
        print(f"- {f.acronym}: {f.jurisdiction} (URL: {f.source_url[:40]}...)")
        
    db.close()

if __name__ == "__main__":
    run_tests()


