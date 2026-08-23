import asyncio
from playwright.async_api import async_playwright

async def verify_clicks():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()
        
        print("Navigating to http://localhost:3001/")
        await page.goto("http://localhost:3001/", wait_until="networkidle")
        
        # Test clicking the main CTA. Playwright throws an error if an element is intercepted
        # by another element (e.g. the canvas)
        print("Testing click on 'Explore Dashboard'...")
        try:
            # We use timeout=5000 so it doesn't hang forever
            await page.click("text=Explore Dashboard", timeout=5000)
            print("SUCCESS: Explore Dashboard was clicked without interception!")
            print(f"Resulting URL: {page.url}")
        except Exception as e:
            print(f"FAILURE: {e}")
            
        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_clicks())
