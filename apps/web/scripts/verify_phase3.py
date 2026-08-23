import asyncio
from playwright.async_api import async_playwright
import os

BREAKPOINTS = [
    {"name": "mobile", "width": 390, "height": 844},
    {"name": "tablet", "width": 768, "height": 1024},
    {"name": "desktop", "width": 1440, "height": 900}
]

async def verify():
    out_dir = "public/visual-diffs-next"
    os.makedirs(out_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()
        print("Navigating to http://localhost:3001/")
        await page.goto("http://localhost:3001/", wait_until="networkidle")
        
        # Verify CTAs
        explore_href = await page.locator("a:has-text('Explore Dashboard')").get_attribute("href")
        launch_href = await page.locator("a:has-text('Launch Compiler')").get_attribute("href")
        
        print(f"Explore Dashboard href: {explore_href}")
        print(f"Launch Compiler href: {launch_href}")
        
        # 3. Screenshots
        for bp in BREAKPOINTS:
            await page.set_viewport_size({"width": bp["width"], "height": bp["height"]})
            await page.wait_for_timeout(1000)
            
            filename = f"{out_dir}/landing_next_{bp['name']}.png"
            await page.screenshot(path=filename, full_page=True)
            print(f"Saved {filename}")
            
        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
