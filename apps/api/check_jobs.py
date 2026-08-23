import sys
import os
sys.path.append(os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.jobs import BackgroundJob

db = SessionLocal()
jobs = db.query(BackgroundJob).order_by(BackgroundJob.created_at.desc()).limit(5).all()

for job in jobs:
    print(f"Job: {job.id}")
    print(f"Status: {job.status}")
    print(f"Error: {job.error_details}")
    print(f"Result: {job.result_data}")
    print("---")
