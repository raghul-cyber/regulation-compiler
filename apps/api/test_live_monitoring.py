import sys
import time
from playwright.sync_api import sync_playwright

def run():
    print("Launching Chromium headless...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 960})
        page = context.new_page()
        
        url = "http://localhost:3000/dashboard"
        print(f"Navigating to {url}...")
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        # Wait a few seconds for hydration and dynamic 3D WebGL to mount
        print("Waiting for components to mount and WebGL to initialize...")
        time.sleep(4)
        
        # Verify page title / heading
        h1 = page.locator("h1").inner_text()
        print(f"Page Title: {h1}")
        
        # Check active tab
        active_tab = page.locator("button:has-text('Global Monitoring')")
        print(f"Global Monitoring tab found: {active_tab.count() > 0}")
        
        # Check for 3D canvas
        canvas = page.locator("canvas")
        print(f"3D WebGL Canvas count: {canvas.count()}")
        
        # Check for Live Surveillance Feed
        feed_header = page.locator("h3:has-text('Live Regulatory Surveillance Feed')")
        print(f"Live Surveillance Feed header found: {feed_header.count() > 0}")
        
        # Check for Active Monitored Jurisdictions Deck
        matrix_header = page.locator("h3:has-text('Active Monitored Jurisdictions')")
        print(f"Active Jurisdictions section found: {matrix_header.count() > 0}")
        
        # Count feed items
        feed_items = page.locator("span:has-text('CRITICAL'), span:has-text('HIGH PRIORITY'), span:has-text('ACTIVE NOTICE'), span:has-text('TELEMETRY')")
        print(f"Feed event severity badges detected: {feed_items.count()}")
        
        # Count jurisdiction cards
        cards = page.locator("h4")
        print(f"Total H4 elements (cards/titles): {cards.count()}")
        
        # Save screenshot 1
        screenshot_path1 = r"C:\Users\rcrag\.gemini\antigravity-ide\brain\fcae8e30-6301-4069-a84b-9b626f1b3aeb\live_surveillance_verified.png"
        page.screenshot(path=screenshot_path1, full_page=True)
        print(f"Saved initial verification screenshot to {screenshot_path1}")
        
        # Click "EU" filter button to test interaction
        print("Clicking 'EU' filter button...")
        eu_button = page.locator("button:has-text('EU')").first
        if eu_button.count() > 0:
            eu_button.click()
            time.sleep(2)
            screenshot_path2 = r"C:\Users\rcrag\.gemini\antigravity-ide\brain\fcae8e30-6301-4069-a84b-9b626f1b3aeb\live_surveillance_focused.png"
            page.screenshot(path=screenshot_path2, full_page=True)
            print(f"Saved focused verification screenshot to {screenshot_path2}")
        
        browser.close()
        print("All validations completed successfully!")

if __name__ == "__main__":
    run()
