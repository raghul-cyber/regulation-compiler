import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 950})

        print("Navigating to http://localhost:3000/dashboard...")
        await page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # 1. Check title & metrics
        print("Checking Dashboard components...")
        title = await page.locator("text=Compliance Hub").first.text_content()
        print("Page Title:", title)

        # 2. Check Live Surveillance feed presence
        feed_title = await page.locator("text=Live Regulatory Surveillance Feed").first.text_content()
        print("Feed Title:", feed_title)

        # 3. Locate the 'Live Probe' button and click it
        probe_btn = page.locator("button:has-text('Live Probe')").first
        if await probe_btn.is_visible():
            print("Clicking 'Live Probe' button...")
            await probe_btn.click()
            # Wait for probe execution and feed update
            await page.wait_for_timeout(1500)
            print("Probe clicked and processed.")

        # 4. Read top 3 feed events
        event_cards = page.locator(".group\\/event")
        count = await event_cards.count()
        print(f"Total event cards in feed: {count}")
        for i in range(min(3, count)):
            text = await event_cards.nth(i).text_content()
            print(f"  Event {i+1}: {text.strip()[:100]}...")

        # 5. Capture screenshot
        screenshot_path = "C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/live_surveillance_active_verified.png"
        await page.screenshot(path=screenshot_path, full_page=False)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
