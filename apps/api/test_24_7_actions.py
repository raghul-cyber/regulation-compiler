import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("."))
from app.main import app

client = TestClient(app)

def test_24_7_actions_suite():
    print("\n=== Testing 24/7 Actions Suite ===")
    
    # 1. Surveillance daemon status
    print("1. Testing GET /api/v1/compliance/surveillance/status...")
    res_status = client.get("/api/v1/compliance/surveillance/status")
    assert res_status.status_code == 200, f"Expected 200, got {res_status.status_code}: {res_status.text}"
    status_data = res_status.json().get("data", {})
    assert "daemon_status" in status_data, "Missing daemon_status"
    assert "authorities" in status_data, "Missing authorities"
    assert status_data.get("monitored_authorities_count", 0) >= 5, "Expected at least 5 authorities"
    print(f"   Success: Daemon status: {status_data.get('daemon_status')}, Monitored Authorities: {status_data.get('monitored_authorities_count')}")

    # 2. Surveillance actions ledger
    print("\n2. Testing GET /api/v1/compliance/surveillance/actions...")
    res_actions = client.get("/api/v1/compliance/surveillance/actions?limit=15")
    assert res_actions.status_code == 200, f"Expected 200, got {res_actions.status_code}: {res_actions.text}"
    actions_data = res_actions.json().get("data", [])
    assert len(actions_data) > 0, "Expected non-empty actions ledger"
    first_action = actions_data[0]
    assert "action_id" in first_action, "Missing action_id in action record"
    assert "action_type" in first_action, "Missing action_type in action record"
    print(f"   Success: Retrieved {len(actions_data)} actions. Latest action: {first_action.get('action_type')} - {first_action.get('title')}")

    # 3. Trigger on-demand probe action
    print("\n3. Testing POST /api/v1/compliance/surveillance/trigger-action (targeted probe)...")
    res_trig_probe = client.post(
        "/api/v1/compliance/surveillance/trigger-action",
        json={"action_type": "probe", "params": {"jurisdiction": "SG"}}
    )
    assert res_trig_probe.status_code == 200, f"Expected 200, got {res_trig_probe.status_code}: {res_trig_probe.text}"
    probe_res = res_trig_probe.json()
    assert probe_res.get("status") == "success"
    print(f"   Success: Dispatched probe action. Result: {probe_res.get('message')}")

    # 4. Trigger policy drift check
    print("\n4. Testing POST /api/v1/compliance/surveillance/trigger-action (policy drift check)...")
    res_drift = client.post(
        "/api/v1/compliance/surveillance/trigger-action",
        json={"action_type": "drift_check", "params": {}}
    )
    assert res_drift.status_code == 200, f"Expected 200, got {res_drift.status_code}: {res_drift.text}"
    drift_res = res_drift.json()
    assert drift_res.get("status") == "success"
    print(f"   Success: Dispatched drift audit. Alignment score: {drift_res.get('details', {}).get('alignment_score')}%")

    # 5. Trigger AST recompile
    print("\n5. Testing POST /api/v1/compliance/surveillance/trigger-action (AST recompile)...")
    res_ast = client.post(
        "/api/v1/compliance/surveillance/trigger-action",
        json={"action_type": "recompile_ast", "params": {}}
    )
    assert res_ast.status_code == 200, f"Expected 200, got {res_ast.status_code}: {res_ast.text}"
    ast_res = res_ast.json()
    assert ast_res.get("status") == "success"
    print(f"   Success: Dispatched AST recompile. Details: {ast_res.get('details')}")

    print("\nALL 24/7 ACTIONS SUITE TESTS PASSED!")

if __name__ == "__main__":
    test_24_7_actions_suite()
