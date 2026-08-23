import os

file_path = "apps/api/app/main.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
if "from app.api.routers import policies, compliance" not in content:
    content = content.replace("from app.api.routers import (", "from app.api.routers import policies, compliance\nfrom app.api.routers import (")

# Add router includes
if "app.include_router(policies.router" not in content:
    include_str = """app.include_router(jobs.router, prefix="/api/v1")
app.include_router(policies.router, prefix="/api/v1")
app.include_router(compliance.router, prefix="/api/v1")"""
    content = content.replace('app.include_router(jobs.router, prefix="/api/v1")', include_str)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated main.py")
