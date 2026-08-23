import requests
import time
import os
import sqlite3
import json

url = "http://127.0.0.1:8080/api/v1/regulations/upload"

print("=== 1. Valid GDPR PDF Upload (Simulated with HTML) ===")
files = {'file': ('gdpr.html', open('gdpr.html', 'rb'), 'text/html')}
data = {'jurisdiction': 'EU', 'name': 'GDPR Phase 1 Test'}
res = requests.post(url, files=files, data=data)
print(f"Response ({res.status_code}):", res.text)
version_id = res.json().get('regulation_version_id')

print("\n=== 2. Valid Upload 3 Times in a Row ===")
for i in range(3):
    files = {'file': ('gdpr.html', open('gdpr.html', 'rb'), 'text/html')}
    res2 = requests.post(url, files=files, data=data)
    print(f"Run {i+1} Response ({res2.status_code}):", res2.text)

print("\n=== 3. Failure Mode: Invalid File Type ===")
files_invalid = {'file': ('invalid.txt', open('invalid.txt', 'rb'), 'text/plain')}
res3 = requests.post(url, files=files_invalid, data=data)
print(f"Response ({res3.status_code}):", res3.text)

print("\n=== 4. Failure Mode: Oversized File ===")
files_oversized = {'file': ('oversized.pdf', open('oversized.pdf', 'rb'), 'application/pdf')}
res4 = requests.post(url, files=files_oversized, data=data)
print(f"Response ({res4.status_code}):", res4.text)

print("\n=== 5. Database Verification ===")
# Give it a second to commit
time.sleep(1)
db_path = r"apps\api\rac.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("Regulations Table (Latest):")
cur.execute("SELECT id, name, jurisdiction, source_url FROM regulations ORDER BY created_at DESC LIMIT 1")
print(cur.fetchone())

print("Regulation Versions Table (Latest):")
cur.execute("SELECT id, regulation_id, version_label FROM regulation_versions WHERE id = ?", (version_id,))
print(cur.fetchone())

print("Source Documents Table (Latest):")
cur.execute("SELECT id, file_type, storage_path, page_count FROM source_documents ORDER BY created_at DESC LIMIT 1")
print(cur.fetchone())

conn.close()

print("\n=== 6. Object Storage Verification ===")
if os.path.exists(".local_s3/mock-bucket"):
    files_in_s3 = os.listdir(".local_s3/mock-bucket")
    print(f"Files found in local S3 mock bucket: {len(files_in_s3)}")
    print("Latest 3 files:", files_in_s3[-3:])
else:
    print("Local S3 mock bucket directory not found.")
