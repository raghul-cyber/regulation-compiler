import os

filepath = r"apps\web\src\app\(authenticated)\dashboard\actions.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("'http://127.0.0.1:8080/api/v1'", "'http://127.0.0.1:8000/api/v1'")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed actions.ts port to 8000")
