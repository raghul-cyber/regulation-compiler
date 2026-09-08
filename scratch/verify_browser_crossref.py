import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        # 1. Navigate directly to PCI DSS requirements page
        url = "http://localhost:3000/regulations/616e1424-5779-4172-97f7-f1e61befc470/requirements"
        print(f"Navigating to {url}...")
        await page.goto(url, wait_until="networkidle")
        await page.wait_for_timeout(1000)
        
        # 2. Find all "Cross-Reference Original Source Text" buttons
        crossref_btns = page.locator("button:has-text('Cross-Reference Original Source Text')")
        count = await crossref_btns.count()
        print(f"Found {count} Cross-Reference buttons.")
        
        # Expand the first 2 requirements
        if count > 0:
            await crossref_btns.nth(0).click()
            await page.wait_for_timeout(400)
        if count > 1:
            await crossref_btns.nth(1).click()
            await page.wait_for_timeout(400)
            
        # Capture screenshot
        screenshot_path = "C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb/cross_reference_source_text_verified.png"
        await page.screenshot(path=screenshot_path, full_page=False)
        print(f"Screenshot captured to {screenshot_path}")
        
        # Read text of expanded drawers
        source_texts = await page.locator(".whitespace-pre-wrap").all_text_contents()
        citations = await page.locator("text=/Statutory Citation:/").all_text_contents()
        
        print("\n--- Citations found ---")
        for c in citations:
            print(" ", c)
            
        print("\n--- Statutory Excerpts found ---")
        for idx, text in enumerate(source_texts[:2]):
            print(f"\n[Requirement Drawer {idx + 1}]")
            print(" ", text.strip()[:200] + "...")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
