import os

filepath = "apps/api/app/pipelines/extraction.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("Respond ONLY with a JSON array of objects", 'Respond ONLY with a JSON object containing a single key "requirements" whose value is an array of objects')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Patched system prompt for json_object compatibility")
