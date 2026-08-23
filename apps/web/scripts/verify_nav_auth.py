import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    out_dir = "public/visual-diffs-next"
    os.makedirs(out_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()
        
        await page.goto("http://localhost:3001/", wait_until="networkidle")
        
        # Take signed out screenshot
        filename = f"{out_dir}/nav_signed_out.png"
        # clip to just the top nav for clarity
        await page.locator("header").screenshot(path=filename)
        print(f"Saved {filename}")
        
        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
