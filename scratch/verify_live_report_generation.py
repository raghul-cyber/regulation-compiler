import asyncio
import os
import httpx
import pymupdf
from playwright.async_api import async_playwright

ARTIFACT_DIR = "C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb"

async def test_and_inspect_live_report():
    print("=== Testing Live Report Generation and Inspecting Layout Quality ===")
    
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

        # 3. Wait for compilation pipeline to complete
        print("Waiting for statutory compilation pipeline to complete...", flush=True)
        complete_indicator = page.locator("text=Pipeline Successfully Compiled")
        await complete_indicator.wait_for(state="visible", timeout=50000)
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

        # 6. Select Gap Analysis checkbox
        print("Selecting 'Gap Analysis' checkbox...", flush=True)
        gap_checkbox_label = page.locator("label:has-text('Gap Analysis')")
        await gap_checkbox_label.click()
        await page.wait_for_timeout(500)

        # Also select Technical System Mapping for comprehensive verification
        print("Selecting 'Technical System Mapping' checkbox...", flush=True)
        tech_checkbox_label = page.locator("label:has-text('Technical System Mapping')")
        await tech_checkbox_label.click()
        await page.wait_for_timeout(500)

        # Verify button text reflects 3 sections
        start_btn = page.locator("button:has-text('Start Generation (3 Sections)')")
        await start_btn.wait_for(state="visible")
        print("Verified button text: 'Start Generation (3 Sections) >'.", flush=True)

        # 7. Click "Start Generation (3 Sections)"
        print("Starting unified report generation for 3 sections...", flush=True)
        await start_btn.click()
        await page.wait_for_timeout(1500)

        # 8. Wait for report generation to complete
        print("Waiting for report stages to execute and complete...", flush=True)
        download_btn = page.locator("a:has-text('Download Unified Report (3 Sections)')")
        await download_btn.wait_for(state="visible", timeout=50000)
        print("Report generation completed successfully! Download button is visible.", flush=True)

        # 9. Verify download link & download PDF
        href = await download_btn.get_attribute("href")
        print(f"Download URL: {href}", flush=True)
        assert href and "/download" in href, f"Invalid download URL: {href}"

        pdf_path = os.path.join(os.path.dirname(__file__), "live_generated_report.pdf")
        async with httpx.AsyncClient() as client:
            pdf_resp = await client.get(href, timeout=30.0)
            assert pdf_resp.status_code == 200, f"Failed to download PDF: {pdf_resp.status_code}"
            assert pdf_resp.content.startswith(b"%PDF"), "Content is not valid PDF"
            with open(pdf_path, "wb") as f:
                f.write(pdf_resp.content)
            print(f"Saved live generated PDF ({len(pdf_resp.content)} bytes) to {pdf_path}", flush=True)

        await browser.close()

    # 10. Render pages to images using PyMuPDF to inspect visually
    doc = pymupdf.open(pdf_path)
    page_count = len(doc)
    print(f"Rendered PDF has {page_count} pages.")
    for i in range(min(page_count, 6)):
        page = doc[i]
        pix = page.get_pixmap(dpi=150)
        img_filename = f"live_report_page_{i+1}.png"
        img_scratch_path = os.path.join(os.path.dirname(__file__), img_filename)
        img_artifact_path = os.path.join(ARTIFACT_DIR, img_filename)
        pix.save(img_scratch_path)
        pix.save(img_artifact_path)
        print(f"Page {i+1} saved to {img_artifact_path}")

    print("\n=== LIVE REPORT GENERATION AND VISUAL EXPORT COMPLETE ===")

if __name__ == "__main__":
    asyncio.run(test_and_inspect_live_report())
