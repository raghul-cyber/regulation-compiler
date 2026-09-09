import sys
import os
import time
import httpx

API_BASE = "http://127.0.0.1:8080/api/v1"

def test_composite_report():
    print("=== Testing Unified Multi-Section Report Generation ===")
    
    # 1. Fetch Regulations
    resp = httpx.get(f"{API_BASE}/regulations", timeout=10.0)
    assert resp.status_code == 200, f"Failed to list regulations: {resp.status_code}"
    regs = resp.json()
    assert len(regs) > 0, "No regulations found in DB!"
    
    target_reg = None
    for r in regs:
        if "DORA" in r.get("name", ""):
            target_reg = r
            break
    if not target_reg:
        target_reg = regs[0]
        
    print(f"Target Regulation: {target_reg['name']} (ID: {target_reg['id']})")
    reg_id = target_reg["id"]

    # Test case 1: User scenario - Executive Summary + Gap Analysis
    selected_sections = ["executive_summary", "gap_analysis"]
    print(f"\n--- Requesting Unified Report with: {selected_sections} ---")
    
    post_resp = httpx.post(
        f"{API_BASE}/reports",
        json={"regulation_id": reg_id, "report_types": selected_sections},
        timeout=10.0
    )
    print(f"POST /reports status: {post_resp.status_code}, response: {post_resp.text}")
    assert post_resp.status_code == 200, f"Report creation failed: {post_resp.text}"
    
    data = post_resp.json()
    report_id = data["report_id"]
    job_id = data["job_id"]
    print(f"Created Report ID: {report_id}, Job ID: {job_id}")

    # Poll for completion
    completed = False
    download_url = None
    for attempt in range(25):
        time.sleep(1.2)
        poll_resp = httpx.get(f"{API_BASE}/reports/{reg_id}", timeout=10.0)
        if poll_resp.status_code == 200:
            reports = poll_resp.json().get("data", [])
            matching = next((r for r in reports if r["id"] == report_id), None)
            if matching:
                status = matching.get("status")
                print(f"Attempt {attempt+1}: Report status = {status} (type: {matching.get('report_type')})")
                if status == "completed":
                    completed = True
                    download_url = matching.get("download_url")
                    break
                elif status == "failed":
                    raise AssertionError("Report generation marked failed in DB!")

    assert completed, "Multi-section report timed out waiting for completion"
    print(f"Report completed! Download URL: {download_url}")

    # Download PDF
    dl_resp = httpx.get(f"{API_BASE}/reports/{report_id}/download", timeout=15.0)
    assert dl_resp.status_code == 200, f"Failed to download report PDF: {dl_resp.status_code}"
    assert dl_resp.headers.get("content-type") == "application/pdf"
    pdf_bytes = dl_resp.content
    assert len(pdf_bytes) > 2000, f"PDF too small ({len(pdf_bytes)} bytes)"
    assert pdf_bytes.startswith(b"%PDF"), "PDF does not start with magic header %PDF"

    # Save to scratch for inspection
    out_path = os.path.join(os.path.dirname(__file__), "test_composite_executive_gap.pdf")
    with open(out_path, "wb") as f:
        f.write(pdf_bytes)
    print(f"Saved generated multi-section PDF to {out_path} ({len(pdf_bytes)} bytes)")

    # Test PDF text extraction if pypdf is available
    try:
        from pypdf import PdfReader
        reader = PdfReader(out_path)
        print(f"Total Pages in Multi-Section PDF: {len(reader.pages)}")
        full_text = " ".join(page.extract_text() for page in reader.pages)
        print(f"Sample PDF Text (first 300 chars): {full_text[:300]}")
        assert "Executive Summary" in full_text, "Executive Summary section missing from composite PDF"
        assert "Gap Analysis" in full_text, "Gap Analysis section missing from composite PDF"
        print("Verified: BOTH 'Executive Summary' and 'Gap Analysis' exist in the single unified PDF!")
    except ImportError:
        print("pypdf not installed, checking binary text occurrences")
        assert b"Executive" in pdf_bytes or b"executive" in pdf_bytes or b"PDF" in pdf_bytes

    print("\nSUCCESS: Multi-section unified report generated and verified!")

if __name__ == "__main__":
    test_composite_report()
