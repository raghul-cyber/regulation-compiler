import asyncio
import os
import httpx
from playwright.async_api import async_playwright

ARTIFACT_DIR = "C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb"

async def test_ui_report_generator():
    print("=== Testing Report Generator Checklist UI End-to-End ===")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # 1. Navigate to Regulations Ingestion page
        print("Navigating to http://localhost:3000/regulations/new...", flush=True)
        await page.goto("http://localhost:3000/regulations/new", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # 2. Find DORA framework and click Live Ingest & Compile
        print("Locating DORA framework card...", flush=True)
        dora_btn = page.locator("button:has-text('Live Ingest & Compile')").nth(0)
        await dora_btn.wait_for(state="visible", timeout=10000)
        print("Triggering Live Ingest & Compile for DORA...", flush=True)
        await dora_btn.click()

        # 3. Wait for compilation pipeline to complete (Stage 9 Persist to Policy DB)
        print("Waiting for statutory compilation pipeline to complete...", flush=True)
        complete_indicator = page.locator("text=Pipeline Successfully Compiled")
        await complete_indicator.wait_for(state="visible", timeout=45000)
        print("Compilation complete!", flush=True)

        # 4. Find and click "Generate Report" button
        generate_report_btn = page.locator("button:has-text('Generate Report')")
        await generate_report_btn.wait_for(state="visible", timeout=10000)
        print("Clicking 'Generate Report' button...", flush=True)
        await generate_report_btn.click()
        await page.wait_for_timeout(1000)

        # 5. Verify Report Generator modal opened
        modal = page.locator("h2:has-text('Report Generator')")
        await modal.wait_for(state="visible", timeout=5000)
        print("Report Generator modal successfully opened!", flush=True)

        # 6. Verify Checklist items
        sections_label = page.locator("text=Select Report Sections")
        await sections_label.wait_for(state="visible")
        
        counter = page.locator("text=1 of 5 selected")
        await counter.wait_for(state="visible")
        print("Initial state verified: '1 of 5 selected' (Executive Summary default).", flush=True)

        # 7. Select Gap Analysis checkbox
        print("Selecting 'Gap Analysis' checkbox...", flush=True)
        gap_checkbox_label = page.locator("label:has-text('Gap Analysis')")
        await gap_checkbox_label.click()
        await page.wait_for_timeout(500)

        # Verify counter now says 2 of 5 selected
        counter_2 = page.locator("text=2 of 5 selected")
        await counter_2.wait_for(state="visible")
        print("Verified counter: '2 of 5 selected'.", flush=True)

        # Verify button text reflects 2 sections
        start_btn = page.locator("button:has-text('Start Generation (2 Sections)')")
        await start_btn.wait_for(state="visible")
        print("Verified button text: 'Start Generation (2 Sections) >'.", flush=True)

        # Capture checklist screenshot
        screenshot_checklist = os.path.join(ARTIFACT_DIR, "ui_report_checklist_multi_selected.png")
        await page.screenshot(path=screenshot_checklist)
        print(f"Screenshot saved: {screenshot_checklist}", flush=True)

        # 8. Click "Start Generation (2 Sections)"
        print("Starting unified report generation for 2 sections...", flush=True)
        await start_btn.click()
        await page.wait_for_timeout(1500)

        # 9. Wait for report generation to complete
        print("Waiting for report stages to execute and complete...", flush=True)
        download_btn = page.locator("a:has-text('Download Unified Report (2 Sections)')")
        await download_btn.wait_for(state="visible", timeout=45000)
        print("Report generation completed successfully! Download button is visible.", flush=True)

        # Capture completed state screenshot
        screenshot_completed = os.path.join(ARTIFACT_DIR, "ui_report_generation_unified_completed.png")
        await page.screenshot(path=screenshot_completed)
        print(f"Screenshot saved: {screenshot_completed}", flush=True)

        # 10. Verify download link
        href = await download_btn.get_attribute("href")
        print(f"Download URL: {href}", flush=True)
        assert href and "/download" in href, f"Invalid download URL: {href}"

        # Fetch PDF directly to verify integrity
        async with httpx.AsyncClient() as client:
            pdf_resp = await client.get(href, timeout=20.0)
            assert pdf_resp.status_code == 200, f"Failed to download PDF: {pdf_resp.status_code}"
            assert pdf_resp.content.startswith(b"%PDF"), "Content is not valid PDF"
            print(f"Verified downloaded PDF: {len(pdf_resp.content)} bytes from {href}", flush=True)

        await browser.close()
        print("\n=== ALL BROWSER CHECKLIST TESTS PASSED SUCCESSFULLY! ===", flush=True)

if __name__ == "__main__":
    asyncio.run(test_ui_report_generator())
