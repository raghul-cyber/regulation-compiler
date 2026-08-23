import os
import shutil

# 1. Valid HTML (as fallback if reportlab is not installed)
with open("gdpr.html", "w") as f:
    f.write("<html><body><h1>GDPR Test</h1><p>Article 1: Privacy</p></body></html>")

# Create a small valid test file for upload testing (FastAPI accepts .pdf and .html)
# The API checks the filename extension `ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''`

# 2. Invalid file type
with open("invalid.txt", "w") as f:
    f.write("Just text")

# 3. Oversized file (> 50MB)
with open("oversized.pdf", "wb") as f:
    f.seek((51 * 1024 * 1024) - 1)
    f.write(b'\0')

print("Test files created.")
