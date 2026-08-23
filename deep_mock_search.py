import os
import re

search_dir = r"apps\web\src"

print("--- DEEP MOCK SEARCH ---")
for root, _, files in os.walk(search_dir):
    for f in files:
        if f.endswith((".ts", ".tsx")):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()
                # Find variable names with "mock" or "dummy" or comments
                for idx, line in enumerate(content.split("\n")):
                    if re.search(r"(?i)\bmock\b|\bdummy\b|TODO", line):
                        print(f"[{path}:{idx+1}] {line.strip()}")
