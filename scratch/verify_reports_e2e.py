import sys
import os
import time
import httpx

API_BASE = "http://127.0.0.1:8080/api/v1"

def test_all_reports():
    print("=== Testing Regulation-as-Code Report Generation End-to-End ===")
    
    # 1. Get Regulations
    resp = httpx.get(f"{API_BASE}/regulations", timeout=10.0)
    assert resp.status_code == 200, f"Failed to list regulations: {resp.status_code}"
    regs = resp.json()
    assert len(regs) > 0, "No regulations found in DB!"
    
    # Pick DORA or first regulation with requirements
    target_reg = None
    for r in regs:
        if "DORA" in r.get("name", "") or r.get("requirements_count", 0) > 0:
            target_reg = r
            break
    if not target_reg:
        target_reg = regs[0]
        
    print(f"Target Regulation: {target_reg['name']} (ID: {target_reg['id']})")
    reg_id = target_reg["id"]

    report_types = [
        "executive_summary",
        "technical",
        "audit_evidence",
        "gap_analysis",
        "checklist"
    ]

    results = {}

    for r_type in report_types:
        print(f"\n--- Testing Report Type: {r_type} ---")
        post_resp = httpx.post(
            f"{API_BASE}/reports",
            json={"regulation_id": reg_id, "report_type": r_type},
            timeout=10.0
        )
        print(f"POST /reports status: {post_resp.status_code}")
        assert post_resp.status_code == 200, f"Report creation failed: {post_resp.status_code} - {post_resp.text}"
        
        post_data = post_resp.json()
        report_id = post_data["report_id"]
        job_id = post_data["job_id"]
        print(f"Created report: {report_id}, job: {job_id}")

        # Poll for completion (up to 30s)
        completed = False
        download_url = None
        for attempt in range(20):
            time.sleep(1.5)
            poll_resp = httpx.get(f"{API_BASE}/reports/{reg_id}", timeout=10.0)
            if poll_resp.status_code == 200:
                reports = poll_resp.json().get("data", [])
                matching = next((r for r in reports if r["id"] == report_id), None)
                if matching:
                    status = matching.get("status")
                    print(f"Attempt {attempt+1}: Report status = {status}")
                    if status == "completed":
                        completed = True
                        download_url = matching.get("download_url")
                        break
                    elif status == "failed":
                        raise AssertionError(f"Report {report_id} failed generation!")

        assert completed, f"Report {r_type} timed out waiting for completion"
        print(f"Report {r_type} successfully generated! Download URL: {download_url}")

        # Test download endpoint
        dl_resp = httpx.get(f"{API_BASE}/reports/{report_id}/download", timeout=15.0)
        assert dl_resp.status_code == 200, f"Download failed: {dl_resp.status_code}"
        assert dl_resp.headers.get("content-type") == "application/pdf", f"Invalid content type: {dl_resp.headers.get('content-type')}"
        pdf_bytes = dl_resp.content
        assert len(pdf_bytes) > 1000, f"PDF content too small ({len(pdf_bytes)} bytes)"
        assert pdf_bytes.startswith(b"%PDF"), "Content does not start with PDF magic header %PDF"
        
        results[r_type] = {
            "status": "SUCCESS",
            "size_bytes": len(pdf_bytes),
            "report_id": report_id,
            "filename": dl_resp.headers.get("Content-Disposition", "")
        }
        print(f"Downloaded valid PDF: {len(pdf_bytes)} bytes. Header: {dl_resp.headers.get('Content-Disposition')}")

    print("\n=== SUMMARY OF ALL 5 REPORT GENERATION TESTS ===")
    for r_type, res in results.items():
        print(f"  [PASS] {r_type.ljust(20)}: {res['size_bytes']} bytes (PDF validated)")

    print("\nALL 5 REPORT TYPES SUCCESSFULLY GENERATED AND VERIFIED!")

if __name__ == "__main__":
    test_all_reports()
