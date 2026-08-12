from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user
from app.models.organizations import User, RoleEnum

client = TestClient(app)

def mock_get_admin_user():
    return User(role=RoleEnum.admin, email="admin@example.com")

def mock_get_developer_user():
    return User(role=RoleEnum.developer, email="dev@example.com")

print("--- Testing as Developer ---")
app.dependency_overrides[get_current_user] = mock_get_developer_user
print("GET /api/test/developer-only ->", client.get("/api/test/developer-only").json())
print("GET /api/test/admin-only ->", client.get("/api/test/admin-only").json())

print("\n--- Testing as Admin ---")
app.dependency_overrides[get_current_user] = mock_get_admin_user
print("GET /api/test/admin-only ->", client.get("/api/test/admin-only").json())
