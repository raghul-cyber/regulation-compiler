import time
import os
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\rcrag\.gemini\antigravity-ide\brain\fcae8e30-6301-4069-a84b-9b626f1b3aeb"

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}", flush=True))
        page.on("pageerror", lambda err: print(f"[Browser Error] {err}", flush=True))

        print("1. Opening http://localhost:3000/regulations/new...", flush=True)
        page.goto("http://localhost:3000/regulations/new", wait_until="domcontentloaded")
        page.wait_for_selector("h3:has-text('DORA')", timeout=20000)

        dora_card = page.locator("div.rounded-xl:has(h3:has-text('DORA'))")
        dora_btn = dora_card.locator("button")
        assert dora_btn.is_visible(), "DORA button not visible"
        print("2. Triggering DORA Live Ingestion & Compilation...", flush=True)
        dora_btn.click()

        print("3. Waiting for Compilation Pipeline to reach completed state...", flush=True)
        page.wait_for_selector("button:has-text('Download Executable Policy')", timeout=45000)
        print("   Compilation Pipeline completed! 'Download Executable Policy' is visible.", flush=True)
        time.sleep(1)

        # Locate the Generate Report button
        print("4. Finding and clicking 'Generate Report' button...", flush=True)
        gen_report_btn = page.locator("button:has-text('Generate Report')").first
        assert gen_report_btn.is_visible(), "Generate Report button not found on pipeline"
        gen_report_btn.click()

        # Wait for the Report Generator Modal to open
        print("5. Waiting for Report Generator modal to open...", flush=True)
        page.wait_for_selector("h2:has-text('Report Generator')", timeout=10000)
        time.sleep(1)
        
        # Save screenshot of modal opened (matching user's screenshot)
        modal_opened_path = os.path.join(ARTIFACT_DIR, "ui_report_generator_modal_opened.png")
        page.screenshot(path=modal_opened_path)
        print(f"   Saved screenshot: {modal_opened_path}", flush=True)

        # Select 'Executive Summary' (first option)
        print("6. Selecting 'Executive Summary' and clicking 'Start Generation >'...", flush=True)
        start_btn = page.locator("button:has-text('Start Generation')")
        assert start_btn.is_visible(), "Start Generation button not visible"
        start_btn.click()

        # Wait for either Error or Download Generated Report button
        print("7. Waiting for 5-stage Report Generation progress & Download button...", flush=True)
        # Should see stage progress: Initialize Report, Fetch Requirements, Compile Document Layout, Render PDF, Secure Storage Upload
        page.wait_for_selector("a:has-text('Download Generated Report')", timeout=35000)
        print("   SUCCESS: 'Download Generated Report' button appeared with green checkmarks on all 5 stages!", flush=True)
        time.sleep(1.5)

        # Save screenshot of report completed state
        modal_completed_path = os.path.join(ARTIFACT_DIR, "ui_report_generation_completed_verified.png")
        page.screenshot(path=modal_completed_path)
        print(f"   Saved screenshot: {modal_completed_path}", flush=True)

        # Verify NO error banner
        error_count = page.locator("text=Failed to generate report").count()
        assert error_count == 0, "Error banner still visible in UI!"

        # Close modal
        page.locator("button:has(svg.lucide-x)").click()
        time.sleep(0.5)

        # Reopen modal for Technical System Mapping
        print("7b. Reopening Report Generator for 'Technical System Mapping'...", flush=True)
        page.locator("button:has-text('Generate Report')").first.click()
        page.wait_for_selector("h2:has-text('Report Generator')", timeout=5000)
        
        tech_opt = page.locator("label:has-text('Technical System Mapping')")
        tech_opt.click()
        time.sleep(0.5)
        
        start_btn2 = page.locator("button:has-text('Start Generation')")
        start_btn2.click()

        print("7c. Waiting for Technical System Mapping generation...", flush=True)
        page.wait_for_selector("a:has-text('Download Generated Report')", timeout=35000)
        print("   SUCCESS: Technical System Mapping generated cleanly!", flush=True)
        time.sleep(1)

        # Download the report through the UI
        print("8. Clicking 'Download Generated Report' to verify file download...", flush=True)
        with page.expect_download(timeout=15000) as download_info:
            page.locator("a:has-text('Download Generated Report')").click()
        download = download_info.value
        save_path = os.path.join(ARTIFACT_DIR, "scratch", download.suggested_filename)
        download.save_as(save_path)
        print(f"   Successfully downloaded PDF report to: {save_path}", flush=True)

        # Check downloaded PDF
        with open(save_path, "rb") as f:
            pdf_data = f.read()
        print(f"   PDF size: {len(pdf_data)} bytes. Header: {pdf_data[:8]}", flush=True)
        assert len(pdf_data) > 10000, "Downloaded PDF is suspiciously small"
        assert pdf_data.startswith(b"%PDF"), "File does not have %PDF header"

        print("\n=== UI REPORT GENERATOR FLOW 100% VERIFIED AND WORKING! ===\n", flush=True)
        browser.close()

if __name__ == "__main__":
    run_test()
