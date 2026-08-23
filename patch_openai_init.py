import os
import re

filepath = "apps/api/app/pipelines/extraction.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace module-level OpenAI client with dynamic initialization inside the function
old_init = """# Initialize OpenAI client (relies on OPENAI_API_KEY env var)
try:
    openai_client = OpenAI()
except Exception as e:
    logger.error(f"Failed to init OpenAI client: {e}")
    openai_client = None"""

new_init = """# OpenAI client will be initialized inside the pipeline using app settings
from app.core.config import settings"""

content = content.replace(old_init, new_init)

old_loop = """        for chunk in chunks_to_process:
            if not openai_client:
                break"""

new_loop = """        try:
            openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        except Exception as e:
            logger.error(f"Failed to init OpenAI client: {e}")
            openai_client = None
            
        for chunk in chunks_to_process:
            if not openai_client:
                logger.error("No OpenAI client available. Skipping AI extraction.")
                break"""

content = content.replace(old_loop, new_loop)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched extraction.py for dynamic OpenAI initialization")
