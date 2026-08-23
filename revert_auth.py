import os
path = r"apps\api\app\api\routers\regulations.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "# current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer])),",
    "current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer])),"
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Auth restored")
