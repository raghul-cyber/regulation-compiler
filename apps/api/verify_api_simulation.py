import sys
import os

sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api():
    print("Testing GET /api/v1/simulation/swarm/agents...")
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

    print("\nALL FASTAPI SIMULATION ENDPOINTS VERIFIED!")

if __name__ == "__main__":
    test_api()
