import requests
import json
import time
import sys

API_BASE = "http://127.0.0.1:8080/api/v1"

def test_pipeline():
    print("1. Fetching available frameworks...")
    r = requests.get(f"{API_BASE}/regulations/frameworks")
    assert r.status_code == 200, f"Failed to get frameworks: {r.status_code} {r.text}"
    frameworks = r.json()
    dora_fw = next((f for f in frameworks if f["acronym"] == "DORA"), None)
    assert dora_fw is not None, "DORA framework not found"
    print(f"   Found DORA framework: {dora_fw['name']}")

    print("\n2. Triggering Live Ingestion for DORA...")
    ingest_res = requests.post(f"{API_BASE}/regulations/frameworks/DORA/ingest")
    assert ingest_res.status_code in [200, 202], f"Ingestion failed: {ingest_res.status_code} {ingest_res.text}"
    job_info = ingest_res.json()
    job_id = job_info.get("job_id")
    reg_id = job_info.get("regulation_id")
    print(f"   Job ID: {job_id}")
    print(f"   Regulation ID: {reg_id}")

    print("\n3. Waiting for Celery worker to complete the 9-stage pipeline...")
    max_wait = 90
    start_time = time.time()
    completed = False
    
    while time.time() - start_time < max_wait:
        status_res = requests.get(f"{API_BASE}/jobs/{job_id}")
        if status_res.status_code == 200:
            status_data = status_res.json()
            job_status = status_data.get("status")
            print(f"   Job status: {job_status} (elapsed: {int(time.time() - start_time)}s)", flush=True)
            if job_status == "completed":
                completed = True
                break
            elif job_status == "failed":
                print(f"   Error: Job failed with details: {status_data}", flush=True)
                sys.exit(1)
        else:
            print(f"   Waiting for status (code {status_res.status_code}): {status_res.text}", flush=True)
        time.sleep(2)

    assert completed, "Job did not complete within timeout"
    print("   Pipeline successfully completed all 9 stages!")

    print("\n4. Testing Executable Policy Download via /regulations/{reg_id}/policy/download...")
    dl_res = requests.get(f"{API_BASE}/regulations/{reg_id}/policy/download")
    assert dl_res.status_code == 200, f"Policy download failed: {dl_res.status_code} {dl_res.text}"
    assert "attachment" in dl_res.headers.get("Content-Disposition", ""), "Missing Content-Disposition header"
    
    policy_data = dl_res.json()
    print("   Downloaded Policy Payload successfully!")
    print(f"   Format: {policy_data.get('format')}")
    print(f"   Compiler Engine: {policy_data.get('compiler_engine')}")
    print(f"   Total Rules: {policy_data.get('metrics', {}).get('total_rules')}")
    print(f"   Type Breakdown: {policy_data.get('metrics', {}).get('type_breakdown')}")
    print(f"   Severity Breakdown: {policy_data.get('metrics', {}).get('severity_breakdown')}")
    print(f"   Knowledge Graph Entities: {len(policy_data.get('knowledge_graph', {}).get('entities', []))}")
    print(f"   Knowledge Graph Relationships: {len(policy_data.get('knowledge_graph', {}).get('relationships', []))}")
    
    policy_id = policy_data.get("policy_id")
    if policy_id:
        print(f"\n5. Testing Executable Policy Download via /policies/{policy_id}/download...")
        dl_pol_res = requests.get(f"{API_BASE}/policies/{policy_id}/download")
        assert dl_pol_res.status_code == 200, f"Policy ID download failed: {dl_pol_res.status_code} {dl_pol_res.text}"
        print(f"   Downloaded policy {policy_id} directly!")

    print("\n6. Testing /regulations/{reg_id}/requirements/export endpoint...")
    rep_res = requests.get(f"{API_BASE}/regulations/{reg_id}/requirements/export")
    assert rep_res.status_code == 200, f"Reports export failed: {rep_res.status_code} {rep_res.text}"
    rep_data = rep_res.json()
    print(f"   Reports export returned {len(rep_data)} verified rules (no reg.title crash)!")

    print("\nALL BACKEND LIVE PIPELINE AND POLICY DOWNLOAD TESTS PASSED!")

if __name__ == "__main__":
    test_pipeline()
