import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 1100})

        print("Navigating to http://localhost:3000/dashboard...")
        await page.goto("http://localhost:3000/dashboard", wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)

        # Scroll down to reveal the Active Monitored Jurisdictions Deck
        await page.evaluate("window.scrollTo(0, 500)")
        await page.wait_for_timeout(1000)

        screenshot_path = "C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/live_jurisdictions_deck_verified.png"
        await page.screenshot(path=screenshot_path, full_page=False)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
