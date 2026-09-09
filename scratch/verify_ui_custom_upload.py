import os
import time
import json
import fitz
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\rcrag\.gemini\antigravity-ide\brain\fcae8e30-6301-4069-a84b-9b626f1b3aeb"
SCRATCH_DIR = os.path.join(ARTIFACT_DIR, "scratch")
os.makedirs(SCRATCH_DIR, exist_ok=True)

PDF_SAMPLE_PATH = os.path.join(SCRATCH_DIR, "test_ai_act_regulation.pdf")

def create_sample_pdf():
    print(f"Creating sample statutory PDF at {PDF_SAMPLE_PATH}...", flush=True)
    doc = fitz.open()
    page = doc.new_page()
    rect = fitz.Rect(50, 50, 550, 800)
    text = """REGULATION (EU) 2024/1689 OF THE EUROPEAN PARLIAMENT AND OF THE COUNCIL
laying down harmonised rules on artificial intelligence (Artificial Intelligence Act)

Article 9: Risk management system
1. A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI systems.
2. The risk management system shall be understood as a continuous iterative process planned and run throughout the entire lifecycle of a high-risk AI system.
3. Regulated entities shall adopt adequate technical and operational mitigation measures.

Article 10: Data and data governance
1. High-risk AI systems which make use of techniques involving the training of models with data shall be developed on the basis of training, validation and testing data sets that meet the quality criteria referred to in paragraphs 2 to 5.
2. Training, validation and testing data sets shall be subject to appropriate data governance and management practices.
"""
    page.insert_textbox(rect, text, fontsize=11)
    doc.save(PDF_SAMPLE_PATH)
    print(f"Sample PDF created successfully ({os.path.getsize(PDF_SAMPLE_PATH)} bytes).", flush=True)

def run_test():
    create_sample_pdf()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}", flush=True))
        page.on("pageerror", lambda err: print(f"[Browser Error] {err}", flush=True))

        print("1. Navigating to http://localhost:3000/regulations/new...", flush=True)
        page.goto("http://localhost:3000/regulations/new", wait_until="domcontentloaded")
        page.wait_for_selector("button:has-text('Custom Upload')", timeout=20000)

        print("2. Switching to 'Custom Upload' tab...", flush=True)
        page.locator("button:has-text('Custom Upload')").click()
        page.wait_for_selector("h2:has-text('Custom Upload')", timeout=5000)
        time.sleep(0.5)

        print("3. Filling in Regulation Metadata...", flush=True)
        reg_input = page.locator("input[placeholder='e.g. GDPR, HIPAA']")
        jur_input = page.locator("input[placeholder='e.g. EU, US, Global']")
        
        reg_input.fill("EU Artificial Intelligence Act (AI Act)")
        jur_input.fill("EU")
        time.sleep(0.5)

        print("4. Uploading PDF file via file input...", flush=True)
        file_input = page.locator("input[type='file']")
        file_input.set_input_files(PDF_SAMPLE_PATH)
        time.sleep(1)

        # Verify file name is shown in the card
        assert page.locator("text=test_ai_act_regulation.pdf").is_visible(), "File name not displayed in dropzone"
        print("   File test_ai_act_regulation.pdf is selected and visible in UI.", flush=True)

        # Save screenshot of ready-to-upload card (matches user's screenshot)
        ready_path = os.path.join(ARTIFACT_DIR, "ui_custom_upload_ready.png")
        page.screenshot(path=ready_path)
        print(f"   Saved screenshot: {ready_path}", flush=True)

        print("5. Clicking 'Start Ingestion Pipeline'...", flush=True)
        start_btn = page.locator("button:has-text('Start Ingestion Pipeline')")
        assert start_btn.is_enabled(), "Start Ingestion Pipeline button is not enabled"
        start_btn.click()

        print("6. Waiting for PipelineProgress component to mount...", flush=True)
        page.wait_for_selector("div:has-text('Compilation Pipeline')", timeout=15000)
        print("   PipelineProgress successfully mounted! No longer stuck on upload form.", flush=True)

        # Take screenshot of running pipeline
        time.sleep(2)
        progress_path = os.path.join(ARTIFACT_DIR, "ui_custom_upload_pipeline_progress.png")
        page.screenshot(path=progress_path)
        print(f"   Saved screenshot: {progress_path}", flush=True)

        print("7. Waiting for 9-stage pipeline to complete and show 'Download Executable Policy'...", flush=True)
        page.wait_for_selector("button:has-text('Download Executable Policy')", timeout=45000)
        print("   ALL 9 STAGES COMPLETED! 'Download Executable Policy' button is visible!", flush=True)
        time.sleep(1.5)

        # Take screenshot of completed pipeline
        completed_path = os.path.join(ARTIFACT_DIR, "ui_custom_upload_completed.png")
        page.screenshot(path=completed_path)
        print(f"   Saved screenshot: {completed_path}", flush=True)

        # Verify download of the executable policy JSON
        print("8. Testing 'Download Executable Policy'...", flush=True)
        with page.expect_download(timeout=15000) as download_info:
            page.locator("button:has-text('Download Executable Policy')").click()
        download = download_info.value
        policy_save_path = os.path.join(SCRATCH_DIR, download.suggested_filename)
        download.save_as(policy_save_path)
        print(f"   Successfully downloaded policy file: {policy_save_path}", flush=True)

        with open(policy_save_path, "r", encoding="utf-8") as f:
            policy_data = json.load(f)
        print(f"   Policy Format: {policy_data.get('format')}")
        print(f"   Total Rules: {policy_data.get('metrics', {}).get('total_rules')}")
        assert policy_data.get("format") == "REGULATER_AS_CODE_EXECUTABLE_POLICY", "Invalid policy format"

        print("9. Verifying 'Generate Report' is also available and working for the custom regulation...", flush=True)
        gen_report_btn = page.locator("button:has-text('Generate Report')").first
        assert gen_report_btn.is_visible(), "Generate Report button not visible on custom upload pipeline"
        gen_report_btn.click()
        page.wait_for_selector("h2:has-text('Report Generator')", timeout=5000)
        print("   Report Generator modal opened successfully for custom regulation!", flush=True)
        
        # Close modal
        page.locator("button:has(svg.lucide-x)").click()
        time.sleep(0.5)

        print("\n=== CUSTOM UPLOAD & PIPELINE EXECUTION 100% VERIFIED! ===\n", flush=True)
        browser.close()

if __name__ == "__main__":
    run_test()
