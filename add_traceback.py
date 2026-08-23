import os

file_path = "apps/api/app/services/reporting.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('print(f"Report Generation Failed: {e}")', 'import traceback\n        print("Report Generation Failed Traceback:")\n        traceback.print_exc()')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Added traceback to reporting.py")
