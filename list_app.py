import os
for root, dirs, files in os.walk(r"apps\web\src\app"):
    for f in files:
        if f.endswith(".tsx"):
            print(os.path.join(root, f))
