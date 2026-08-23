import httpx
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

class FrameworkFetcher:
    def __init__(self):
        # We use a real user-agent to prevent basic blocks
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    async def fetch_html(self, url: str) -> tuple[bytes, str]:
        """
        Fetches the URL, parses it to strip out heavy scripts/styles,
        and returns the raw HTML bytes and a suggested filename.
        """
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(url, headers=self.headers, timeout=30.0)
                response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            
            # Remove scripts, styles, and heavy nav elements for cleaner AI processing later
            for element in soup(["script", "style", "nav", "footer", "iframe"]):
                element.decompose()

            clean_html = str(soup)
            
            # Create a safe filename from URL
            filename = url.split("://")[-1].replace("/", "_").replace("?", "_").replace(":", "_") + ".html"
            
            return clean_html.encode('utf-8'), filename
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching {url}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error parsing fetched content from {url}: {e}")
            raise
