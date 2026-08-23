import os

app_dir = r"apps\web\src\app"
for root, _, files in os.walk(app_dir):
    for f in files:
        if f.endswith(".tsx"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()
                if "params" in content and "function" in content and "export default" in content:
                    print(f"File: {path}")
                    # simple check if they await params
                    if "await params" not in content:
                        print("  -> DOES NOT AWAIT PARAMS")
