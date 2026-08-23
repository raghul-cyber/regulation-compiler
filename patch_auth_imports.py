import os

files = ["apps/api/app/api/routers/policies.py", "apps/api/app/api/routers/compliance.py"]
for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace("from app.api.dependencies.auth import require_role", "from app.core.auth import require_role")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
print("Updated auth imports")
