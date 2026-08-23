import os
import re

search_dirs = [r"apps\web\src", r"apps\api\app"]
patterns = [
    r"(?i)TODO:.*wire.*real.*API",
    r"(?i)TODO:.*mock",
    r"(?i)mock\s*data",
    r"(?i)mock\s*upload",
    r"(?i)hardcoded"
]

print("--- ZERO MOCKS AUDIT ---")
for d in search_dirs:
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith((".ts", ".tsx", ".py")):
                path = os.path.join(root, f)
                with open(path, "r", encoding="utf-8") as file:
                    content = file.read()
                    for idx, line in enumerate(content.split("\n")):
                        for p in patterns:
                            if re.search(p, line):
                                print(f"[{path}:{idx+1}] {line.strip()}")
