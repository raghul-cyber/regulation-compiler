import os

file_path = "apps/api/app/main.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix the import
content = content.replace("from app.api.routers import policies, compliance", "")
content = content.replace("from app.api.routers import (", "from app.api.routers import policies, compliance\nfrom app.api.routers import (")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated main.py")
