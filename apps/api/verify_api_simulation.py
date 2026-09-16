import sys
import os

sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api():
    print("Testing GET /api/v1/team/me...")
    res = client.get("/api/v1/team/me")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    me_data = res.json()
    print(f"Success: /team/me response: {me_data}")

    print("\nTesting GET /api/v1/simulation/swarm/agents...")
    res = client.get("/api/v1/simulation/swarm/agents")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["total_agents"] == 10
    print(f"Success: {data['total_agents']} personas retrieved via API.")

    print("\nTesting POST /api/v1/simulation/swarm/run (1 round)...")
    res = client.post("/api/v1/simulation/swarm/run", json={"rounds": 1})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    sim_data = res.json()
    assert sim_data["status"] == "success"
    report = sim_data["report"]
    run_id = report["run_id"]
    print(f"Success: Run {run_id} completed with {report['total_traffic_requests']} requests.")

    print("\nTesting GET /api/v1/simulation/swarm/runs...")
    res = client.get("/api/v1/simulation/swarm/runs")
    assert res.status_code == 200
    runs = res.json()["runs"]
    assert len(runs) > 0
    print(f"Success: Found {len(runs)} historical simulation runs.")

    print(f"\nTesting GET /api/v1/simulation/swarm/report/{run_id}...")
    res = client.get(f"/api/v1/simulation/swarm/report/{run_id}")
    assert res.status_code == 200
    fetched_report = res.json()["report"]
    assert fetched_report["run_id"] == run_id
    print("Success: Report successfully retrieved by run_id.")

    print("\nTesting RBAC clearance: Simulated non-admin user (developer@example.com)...")
    from app.models.organizations import User, RoleEnum
    from app.core.auth import get_optional_current_user
    import uuid

    non_admin = User(
        id=uuid.uuid4(),
        org_id=uuid.uuid4(),
        clerk_user_id="user_non_admin_test",
        role=RoleEnum.developer,
        email="developer@example.com"
    )
    # Override get_optional_current_user to simulate non-admin
    app.dependency_overrides[get_optional_current_user] = lambda: non_admin
    try:
        res_forbidden = client.post("/api/v1/simulation/swarm/run", json={"rounds": 1})
        assert res_forbidden.status_code == 403, f"Expected 403 Forbidden for non-admin, got {res_forbidden.status_code}: {res_forbidden.text}"
        print(f"Success: Non-admin developer correctly rejected with HTTP 403 Forbidden: {res_forbidden.json()['detail']}")

        res_agents_forbidden = client.get("/api/v1/simulation/swarm/agents")
        assert res_agents_forbidden.status_code == 403, f"Expected 403 Forbidden for non-admin, got {res_agents_forbidden.status_code}"
        print("Success: Non-admin developer correctly blocked from retrieving swarm agents.")
    finally:
        app.dependency_overrides.pop(get_optional_current_user, None)

    print("\nTesting RBAC clearance: Simulated tenant admin user (org_admin@company.com, role=admin)...")
    tenant_admin = User(
        id=uuid.uuid4(),
        org_id=uuid.uuid4(),
        clerk_user_id="user_tenant_admin_test",
        role=RoleEnum.admin,
        email="org_admin@company.com"
    )
    app.dependency_overrides[get_optional_current_user] = lambda: tenant_admin
    try:
        res_tenant_forbidden = client.post("/api/v1/simulation/swarm/run", json={"rounds": 1})
        assert res_tenant_forbidden.status_code == 403, f"Expected 403 Forbidden for tenant admin, got {res_tenant_forbidden.status_code}"
        print(f"Success: Tenant admin correctly rejected with HTTP 403 Forbidden: {res_tenant_forbidden.json()['detail']}")

        res_tenant_agents = client.get("/api/v1/simulation/swarm/agents")
        assert res_tenant_agents.status_code == 403
        print("Success: Tenant admin correctly blocked from retrieving swarm agents.")
    finally:
        app.dependency_overrides.pop(get_optional_current_user, None)

    print("\nTesting RBAC clearance: Super-admin user (rcraghul12@gmail.com)...")
    super_admin = User(
        id=uuid.uuid4(),
        org_id=uuid.uuid4(),
        clerk_user_id="user_3HpP6350OcHxY6bu77tdXEtihSE",
        role=RoleEnum.admin,
        email="rcraghul12@gmail.com"
    )
    app.dependency_overrides[get_optional_current_user] = lambda: super_admin
    try:
        res_super_agents = client.get("/api/v1/simulation/swarm/agents")
        assert res_super_agents.status_code == 200, f"Expected 200 for super admin, got {res_super_agents.status_code}"
        print(f"Success: Super-admin rcraghul12@gmail.com granted HTTP 200 with {res_super_agents.json()['total_agents']} agents.")
    finally:
        app.dependency_overrides.pop(get_optional_current_user, None)

    print("\nALL FASTAPI SIMULATION AND STRICT RBAC CLEARANCE ENDPOINTS VERIFIED!")

if __name__ == "__main__":
    test_api()
