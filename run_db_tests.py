import os
import sys

# Add apps/api to path so we can import app modules
sys.path.append(os.path.abspath("apps/api"))

from app.db.session import SessionLocal
from app.models.regulations import Regulation, RegulationVersion, SourceDocument

print("\n=== 5. Database Verification (SQLAlchemy) ===")
db = SessionLocal()

print("Regulations Table (Latest):")
reg = db.query(Regulation).order_by(Regulation.created_at.desc()).first()
if reg:
    print(f"ID: {reg.id}, Name: {reg.name}, Jurisdiction: {reg.jurisdiction}, URL: {reg.source_url}")

print("Regulation Versions Table (Latest):")
rv = db.query(RegulationVersion).filter(RegulationVersion.regulation_id == reg.id).first()
if rv:
    print(f"ID: {rv.id}, Label: {rv.version_label}")

print("Source Documents Table (Latest):")
sd = db.query(SourceDocument).order_by(SourceDocument.created_at.desc()).first()
if sd:
    print(f"ID: {sd.id}, Type: {sd.file_type}, Path: {sd.storage_path}")

db.close()

print("\n=== 6. Object Storage Verification ===")
storage_dir = os.path.join("apps", "api", ".local_s3", "mock-bucket")
if os.path.exists(storage_dir):
    files_in_s3 = os.listdir(storage_dir)
    print(f"Files found in local S3 mock bucket: {len(files_in_s3)}")
    print("Latest 3 files:", files_in_s3[-3:])
else:
    print(f"Directory {storage_dir} not found.")

