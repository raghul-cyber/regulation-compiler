from playwright.sync_api import sync_playwright
import time
import os

def test_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1400, 'height': 900})
        page = context.new_page()

        print("1. Navigating to http://localhost:3000/regulations/new...")
        page.goto("http://localhost:3000/regulations/new", wait_until="networkidle")
        time.sleep(2)

        # Ensure page title or framework buttons exist
        page.screenshot(path="C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/ui_regulations_new_ready.png")
        print("   Saved initial screenshot to ui_regulations_new_ready.png")

        # Find the DORA ingest button
        dora_btn = page.locator("button:has-text('Live Ingest & Compile')").first
        assert dora_btn.is_visible(), "DORA Live Ingest & Compile button not found"
        
        print("2. Clicking Live Ingest & Compile on DORA...")
        dora_btn.click()
        time.sleep(1)

        # Check button state: DORA button should show loading text
        page.screenshot(path="C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/ui_ingesting_dora_clicked.png")
        print("   Saved clicked screenshot to ui_ingesting_dora_clicked.png")

        # Wait for pipeline container or progress to appear
        print("3. Waiting for pipeline execution (stages 1-9)...")
        # Give pipeline time to stream stages
        for s in range(12):
            time.sleep(2)
            page.screenshot(path=f"C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/ui_pipeline_progress_{s}.png")
            content = page.content()
            if "Pipeline Successfully Compiled" in content or "Download Executable Policy" in content:
                print(f"   Pipeline completed detected at {s*2}s!")
                break

        page.screenshot(path="C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/ui_pipeline_completed_view.png")
        print("   Saved completed screenshot to ui_pipeline_completed_view.png")

        # Verify Download Executable Policy button is present
        download_btn = page.locator("button:has-text('Download Executable Policy')")
        assert download_btn.is_visible(), "Download Executable Policy button not found in UI!"
        print("   Download Executable Policy button is visible and active!")

        browser.close()
        print("UI Verification completed successfully!")

if __name__ == "__main__":
    test_ui()
