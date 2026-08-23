import os

file_path = "apps/api/app/main.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_import = "from app.api.routers import webhooks, test_rbac, regulations, requirements, reports, developer, api_keys, system_mappings, jobs"
new_import = "from app.api.routers import webhooks, test_rbac, regulations, requirements, reports, developer, api_keys, system_mappings, jobs, policies, compliance"
content = content.replace(old_import, new_import)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated main.py imports")
