import asyncio
from playwright.async_api import async_playwright
import os

ROUTES = [
    {"name": "landing", "path": "/"},
    {"name": "dashboard", "path": "/dashboard"},
    {"name": "regulations", "path": "/regulations"},
    {"name": "compliance-check", "path": "/compliance-check"},
    {"name": "settings", "path": "/settings"}
]

BREAKPOINTS = [
    {"name": "mobile", "width": 390, "height": 844},
    {"name": "tablet", "width": 768, "height": 1024},
    {"name": "desktop", "width": 1440, "height": 900}
]

async def capture_screenshots():
    out_dir = "public/visual-diffs"
    os.makedirs(out_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for bp in BREAKPOINTS:
            context = await browser.new_context(
                viewport={"width": bp["width"], "height": bp["height"]}
            )
            page = await context.new_page()
            
            for route in ROUTES:
                url = f"http://localhost:3000{route['path']}"
                print(f"Capturing {route['name']} at {bp['name']} ({url})...")
                try:
                    await page.goto(url, wait_until="networkidle")
                    await page.wait_for_timeout(1000)
                    
                    filename = f"{out_dir}/{route['name']}_{bp['name']}.png"
                    await page.screenshot(path=filename, full_page=True)
                    print(f"Saved {filename}")
                except Exception as e:
                    print(f"Failed to capture {url}: {e}")
            
            await context.close()
            
        await browser.close()

if __name__ == "__main__":
    os.system("playwright install chromium")
    asyncio.run(capture_screenshots())
