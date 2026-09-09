import asyncio
import os
from playwright.async_api import async_playwright

async def verify_e2e():
    print("Starting Playwright end-to-end verification...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1400, "height": 900})
        page = await context.new_page()

        # Step 1: Verify Regulations Page
        print("\n[Step 1] Navigating to http://localhost:3000/regulations...")
        await page.goto("http://localhost:3000/regulations", wait_until="networkidle", timeout=30000)
        
        # Check content
        content = await page.content()
        assert "Canonical Regulations" in content, "Page title missing"
        assert "No regulations loaded" not in content, "Found 'No regulations loaded' message!"
        
        cards = await page.locator(".grid .rounded-xl").all()
        print(f"Found {len(cards)} regulation cards on page.")
        assert len(cards) >= 7, f"Expected at least 7 regulation cards, found {len(cards)}"

        # Save screenshot
        artifacts_dir = r"C:\Users\rcrag\.gemini\antigravity-ide\brain\fcae8e30-6301-4069-a84b-9b626f1b3aeb"
        reg_screenshot = os.path.join(artifacts_dir, "canonical_regulations_catalog.png")
        await page.screenshot(path=reg_screenshot, full_page=False)
        print(f"Saved screenshot to: {reg_screenshot}")

        # Step 2: Click 'Inspect Requirements' on GDPR card
        print("\n[Step 2] Clicking 'Inspect Requirements' on first card...")
        inspect_btn = page.locator("text='Inspect Requirements'").first
        await inspect_btn.click()
        await page.wait_for_load_state("networkidle", timeout=20000)
        print("Navigated to:", page.url)
        assert "/requirements" in page.url, "Did not navigate to requirements page"

        req_content = await page.content()
        assert "Active Control" in req_content or "Enforceable Ruleset" in req_content, "Requirements headers missing"
        req_screenshot = os.path.join(artifacts_dir, "canonical_requirements_view.png")
        await page.screenshot(path=req_screenshot, full_page=False)
        print(f"Saved requirements screenshot to: {req_screenshot}")

        # Step 3: Verify Dashboard & Live Surveillance Feed
        print("\n[Step 3] Navigating to http://localhost:3000/dashboard...")
        await page.goto("http://localhost:3000/dashboard", wait_until="networkidle", timeout=30000)
        
        # Verify Live Surveillance Feed
        feed_header = await page.locator("text='Live Regulatory Surveillance Feed'").first.is_visible()
        print("Live Surveillance Feed header visible:", feed_header)
        assert feed_header, "Surveillance feed header missing"

        # Check for Inspect buttons in feed
        inspect_feed_btns = await page.locator("button:has-text('Inspect')").all()
        print(f"Found {len(inspect_feed_btns)} Inspect buttons across dashboard & feed.")
        assert len(inspect_feed_btns) > 0, "No Inspect buttons found in feed"

        dash_screenshot = os.path.join(artifacts_dir, "dashboard_live_surveillance.png")
        await page.screenshot(path=dash_screenshot, full_page=False)
        print(f"Saved dashboard screenshot to: {dash_screenshot}")

        # Step 4: Click Inspect from a feed event
        print("\n[Step 4] Clicking 'Inspect' from a live feed event...")
        feed_inspect_btn = page.locator(".divide-y button:has-text('Inspect')").first
        if await feed_inspect_btn.is_visible():
            btn_text = await feed_inspect_btn.text_content()
            print(f"Clicking live feed button: '{btn_text}'")
            await feed_inspect_btn.click()
            await page.wait_for_load_state("networkidle", timeout=20000)
            print("Redirected to URL:", page.url)
            assert "/regulations" in page.url, "Did not redirect to regulations or requirements"
            print("Redirection verified successfully!")

        await browser.close()
        print("\n=== ALL PLAYWRIGHT E2E VERIFICATIONS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    asyncio.run(verify_e2e())
