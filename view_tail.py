import os

files_to_fix = [
    r"apps\web\src\app\(authenticated)\regulations\[id]\requirements\page.tsx",
    r"apps\web\src\app\(authenticated)\regulations\[id]\reports\page.tsx",
    r"apps\web\src\app\(authenticated)\regulations\[id]\diff\page.tsx",
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        continue
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        print(f"--- {file_path} ---")
        print("".join(lines[-20:]))
