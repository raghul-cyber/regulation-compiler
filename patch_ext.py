import os

ext_path = r"apps\api\app\pipelines\extraction.py"
with open(ext_path, "r", encoding="utf-8") as f:
    content = f.read()

# Inject error
content = content.replace(
    'name = "AI Understanding"',
    'name = "AI Understanding"\n        if True:\n            raise ValueError("Simulated LLM API Key Error: Connection Refused")'
)

with open(ext_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Failure injected.")
