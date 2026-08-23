import requests
import json
import time
from datetime import datetime

url = "http://127.0.0.1:8080/api/v1/regulations/upload"

def start_job(name):
    files = {'file': ('gdpr.html', open('gdpr.html', 'rb'), 'text/html')}
    data = {'jurisdiction': 'EU', 'name': name}
    res = requests.post(url, files=files, data=data)
    if res.status_code != 200:
        print("Upload failed:", res.text)
        exit(1)
    return res.json().get('job_id')

print("=== STEP 1: RAW EVENT STREAM ===")
job_id = start_job("Stream Test")
sse_url = f"http://127.0.0.1:8080/api/v1/jobs/{job_id}/events"
response = requests.get(sse_url, stream=True, timeout=30)
stream_events = []
for line in response.iter_lines():
    if line:
        decoded = line.decode('utf-8')
        if decoded.startswith('data: '):
            print(decoded)
            ev = json.loads(decoded[6:])
            stream_events.append(ev)
            if ev.get('stage_number') == 9 and ev.get('status') in ['completed', 'failed']:
                break
print(f"\nCaptured {len(stream_events)} live events.\n")

print("=== STEP 2 & 5: DB PERSISTENCE & TIMING ===")
# We query the DB via a local sqlalchemy session
import os, sys
sys.path.append(os.path.abspath("apps/api"))
from app.db.session import SessionLocal
from app.models.jobs import JobEvent

db = SessionLocal()
db_events = db.query(JobEvent).filter(JobEvent.job_id == job_id).order_by(JobEvent.created_at.asc()).all()
print(f"Total rows in JobEvent table for {job_id}: {len(db_events)}")

# Compute durations (Step 5)
stages = {}
for e in db_events:
    if e.stage_number not in stages:
        stages[e.stage_number] = {'name': e.stage_name}
    if e.status == 'started':
        stages[e.stage_number]['start'] = e.created_at
    elif e.status == 'completed':
        stages[e.stage_number]['end'] = e.created_at
        if 'start' in stages[e.stage_number]:
            diff = (e.created_at - stages[e.stage_number]['start']).total_seconds()
            print(f"Stage {e.stage_number} ({e.stage_name}): {diff:.2f} seconds")

print("\n=== STEP 3: MID-RUN RECONNECT ===")
mid_job_id = start_job("Mid Run Test")
mid_url = f"http://127.0.0.1:8080/api/v1/jobs/{mid_job_id}/events"

# Give it 3.5 seconds to reach Stage 3
time.sleep(3.5)

# Reconnect and fetch what's there
response_mid = requests.get(mid_url, stream=True, timeout=10)
print("Reconnected! Initial burst received:")
for line in response_mid.iter_lines():
    if line:
        decoded = line.decode('utf-8')
        if decoded.startswith('data: '):
            ev = json.loads(decoded[6:])
            print(f"[{ev['status']}] Stage {ev['stage_number']} - {ev['stage_name']}")
            # We break after printing a few to prove history was dumped
            if ev.get('stage_number') >= 3 and ev.get('status') == 'started':
                break

