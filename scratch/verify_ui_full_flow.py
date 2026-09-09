from playwright.sync_api import sync_playwright
import time
import json

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"[Browser Error] {err}"))

        print("1. Opening http://localhost:3000/regulations/new...")
        page.goto("http://localhost:3000/regulations/new", wait_until="domcontentloaded")
        page.wait_for_selector("h3:has-text('DORA')", timeout=15000)

        # Locate DORA and GDPR cards and their respective buttons
        dora_card = page.locator("div.rounded-xl:has(h3:has-text('DORA'))")
        gdpr_card = page.locator("div.rounded-xl:has(h3:has-text('GDPR'))")
        dora_btn = dora_card.locator("button")
        gdpr_btn = gdpr_card.locator("button")
        
        assert dora_btn.is_visible(), "DORA button not visible"
        assert gdpr_btn.is_visible(), "GDPR button not visible"
        print("   Both DORA and GDPR cards and buttons are loaded, visible, and active.")

        # Click DORA button
        print("2. Clicking DORA 'Live Ingest & Compile' button...")
        dora_btn.click()

        # Wait for the Compilation Pipeline to mount
        print("3. Waiting for Compilation Pipeline component...")
        page.wait_for_selector("h2:has-text('Compilation Pipeline')", timeout=20000)
        print("   Compilation Pipeline successfully mounted!")
        page.screenshot(path="C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/pipeline_active_live.png")

        # Wait for all stages to complete and Download button to appear
        print("4. Waiting for 9-stage pipeline to complete...")
        page.wait_for_selector("button:has-text('Download Executable Policy')", timeout=45000)
        print("   ALL 9 STAGES FINISHED! 'Download Executable Policy' button is visible!")
        
        # Take screenshot of completed pipeline with policy download card
        page.screenshot(path="C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/pipeline_completed_with_download.png")
        print("   Saved completed screenshot to pipeline_completed_with_download.png")

        # Click the Download Executable Policy button and verify download event
        print("5. Clicking 'Download Executable Policy' button...")
        with page.expect_download(timeout=10000) as download_info:
            page.locator("button:has-text('Download Executable Policy')").click()
        download = download_info.value
        download_path = f"C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/scratch/{download.suggested_filename}"
        download.save_as(download_path)
        print(f"   Downloaded policy file to: {download_path}")

        # Verify downloaded JSON content
        with open(download_path, "r", encoding="utf-8") as f:
            policy_json = json.load(f)
        
        print("6. Verifying Downloaded Policy JSON Content:")
        print(f"   Format: {policy_json.get('format')}")
        print(f"   Compiler: {policy_json.get('compiler_engine')}")
        print(f"   Total Rules: {policy_json.get('metrics', {}).get('total_rules')}")
        print(f"   Executable Rules Array Length: {len(policy_json.get('executable_rules', []))}")
        print(f"   Knowledge Graph Entities: {len(policy_json.get('knowledge_graph', {}).get('entities', []))}")
        print(f"   Knowledge Graph Relationships: {len(policy_json.get('knowledge_graph', {}).get('relationships', []))}")

        assert len(policy_json.get("executable_rules", [])) > 0, "No executable rules found in downloaded policy!"
        print("\n--- DORA COMPLETE & VERIFIED ---\n")

        print("7. Testing GDPR Live Ingestion & Compilation...")
        page.goto("http://localhost:3000/regulations/new", wait_until="domcontentloaded")
        page.wait_for_selector("h3:has-text('GDPR')", timeout=15000)

        gdpr_card = page.locator("div.rounded-xl:has(h3:has-text('GDPR'))")
        gdpr_btn = gdpr_card.locator("button")
        assert gdpr_btn.is_visible(), "GDPR button not visible"

        print("8. Clicking GDPR 'Live Ingest & Compile' button...")
        gdpr_btn.click()

        print("9. Waiting for Compilation Pipeline component for GDPR...")
        page.wait_for_selector("h2:has-text('Compilation Pipeline')", timeout=20000)
        print("   GDPR Compilation Pipeline successfully mounted!")

        print("10. Waiting for GDPR 9-stage pipeline to complete...")
        page.wait_for_selector("button:has-text('Download Executable Policy')", timeout=45000)
        print("   GDPR 9 STAGES FINISHED! 'Download Executable Policy' button is visible!")
        page.screenshot(path="C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/gdpr_pipeline_completed_with_download.png")

        print("11. Clicking 'Download Executable Policy' for GDPR...")
        with page.expect_download(timeout=10000) as download_info_gdpr:
            page.locator("button:has-text('Download Executable Policy')").click()
        gdpr_download = download_info_gdpr.value
        gdpr_download_path = f"C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/scratch/{gdpr_download.suggested_filename}"
        gdpr_download.save_as(gdpr_download_path)
        print(f"   Downloaded GDPR policy file to: {gdpr_download_path}")

        with open(gdpr_download_path, "r", encoding="utf-8") as f:
            gdpr_policy_json = json.load(f)

        print("12. Verifying GDPR Downloaded Policy JSON Content:")
        print(f"   Regulation: {gdpr_policy_json.get('regulation_name')}")
        print(f"   Format: {gdpr_policy_json.get('format')}")
        print(f"   Compiler: {gdpr_policy_json.get('compiler_engine')}")
        print(f"   Total Rules: {gdpr_policy_json.get('metrics', {}).get('total_rules')}")
        print(f"   Executable Rules Array Length: {len(gdpr_policy_json.get('executable_rules', []))}")
        print(f"   Knowledge Graph Entities: {len(gdpr_policy_json.get('knowledge_graph', {}).get('entities', []))}")

        assert len(gdpr_policy_json.get("executable_rules", [])) > 0, "No executable rules found in GDPR policy!"
        print("\nALL VERIFICATIONS PASSED: Both DORA and GDPR live ingest, compile, and download independently with real data!")

        browser.close()

if __name__ == "__main__":
    run_test()

