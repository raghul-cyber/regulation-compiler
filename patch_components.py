import os
import glob

components = glob.glob("apps/web/src/components/compliance/*.tsx")

for file_path in components:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace("from '@/lib/api'", "from '@/app/(authenticated)/dashboard/actions'")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
print("Updated imports to use actions")
