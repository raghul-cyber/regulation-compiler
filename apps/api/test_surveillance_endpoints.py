import sys
import os

sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_surveillance():
    print("1. Testing GET /health/ready for 24/7 surveillance daemon status...")
    res = client.get("/health/ready")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    ready_data = res.json()
    surveillance_check = ready_data.get("checks", {}).get("surveillance_24_7", {})
    print(f"   Success: 24/7 surveillance check: {surveillance_check}")

    print("\n2. Testing POST /api/v1/compliance/monitoring/sync...")
    res_sync = client.post("/api/v1/compliance/monitoring/sync")
    assert res_sync.status_code == 200, f"Expected 200, got {res_sync.status_code}: {res_sync.text}"
    sync_data = res_sync.json()
    print(f"   Success: Sync executed. Result: {sync_data.get('sync_details')}")

    print("\n3. Testing GET /api/v1/compliance/monitoring/feed...")
    res_feed = client.get("/api/v1/compliance/monitoring/feed?limit=10")
    assert res_feed.status_code == 200, f"Expected 200, got {res_feed.status_code}: {res_feed.text}"
    feed_data = res_feed.json()
    items = feed_data.get("data", [])
    telemetry = feed_data.get("telemetry", {})
    print(f"   Success: Retrieved {len(items)} feed items. Stream status: {telemetry.get('stream_status')}")
    assert len(items) > 0, "Expected non-empty surveillance feed"

    print("\n4. Testing POST /api/v1/compliance/monitoring/probe targeting 'EU'...")
    res_probe = client.post("/api/v1/compliance/monitoring/probe", json={"jurisdiction": "EU"})
    assert res_probe.status_code == 200, f"Expected 200, got {res_probe.status_code}: {res_probe.text}"
    probe_data = res_probe.json()
    print(f"   Success: Probe outcome: {probe_data.get('message')}")
    assert probe_data.get("status") == "success"

    print("\nALL 24/7 REGULATORY SURVEILLANCE ENDPOINTS VERIFIED AND PASSING!")

if __name__ == "__main__":
    test_surveillance()
