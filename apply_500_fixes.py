import os

# 1. Patch Backend
dev_path = r"apps\api\app\api\routers\developer.py"
with open(dev_path, "r", encoding="utf-8") as f:
    dev_content = f.read()

dev_content = dev_content.replace(
    "reg = db.query(Regulation).filter(Regulation.id == reg_id, Regulation.org_id == api_key.org_id).first()",
    "reg = db.query(Regulation).filter(Regulation.id == reg_id).first()"
)

with open(dev_path, "w", encoding="utf-8") as f:
    f.write(dev_content)

print("Backend patched.")

# 2. Patch Frontend Form Fields
test_path = r"apps\web\src\components\compliance\tester.tsx"
with open(test_path, "r", encoding="utf-8") as f:
    test_content = f.read()

test_content = test_content.replace(
    "<select \n              value={targetRegulation}",
    '<select \n              id="targetRegulation"\n              name="targetRegulation"\n              value={targetRegulation}'
)

test_content = test_content.replace(
    "<textarea \n            value={jsonPayload}",
    '<textarea \n            id="jsonPayload"\n            name="jsonPayload"\n            value={jsonPayload}'
)

with open(test_path, "w", encoding="utf-8") as f:
    f.write(test_content)

print("Frontend patched.")

