import time
from playwright.sync_api import sync_playwright

def test_dashboard():
    errors = []
    warnings = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("pageerror", lambda err: errors.append(str(err)))
        page.on("console", lambda msg: (
            errors.append(msg.text) if "Cannot update a component" in msg.text or msg.type == "error"
            else warnings.append(msg.text) if msg.type == "warning"
            else None
        ))

        print("1. Opening http://localhost:3000/dashboard...", flush=True)
        page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        time.sleep(3)

        print(f"2. Waiting 7 seconds for live surveillance polling interval...", flush=True)
        time.sleep(7)

        print(f"   Collected errors count: {len(errors)}")
        for e in errors:
            print(f"   Error: {e}")

        assert not any("Cannot update a component" in e for e in errors), "React setState in render error detected!"
        assert not any("Cannot update a component" in w for w in warnings), "React setState warning detected!"

        print("3. Clicking 'Trigger Probe' to verify manual signal dispatch...", flush=True)
        probe_btn = page.locator("button:has-text('Probe')").first
        if probe_btn.is_visible():
            probe_btn.click()
            time.sleep(2)

        assert not any("Cannot update a component" in e for e in errors), "Error appeared after probe!"
        print("\n=== DASHBOARD LIVE FEED RENDER VERIFIED CLEAN (ZERO SETSTATE WARNINGS) ===\n")
        browser.close()

if __name__ == "__main__":
    test_dashboard()
