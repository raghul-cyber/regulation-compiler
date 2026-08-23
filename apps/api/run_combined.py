import requests
import json
import time

url = "http://127.0.0.1:8080/api/v1/regulations/upload"

def start_job(name):
    files = {'file': ('gdpr.html', open('../../gdpr.html', 'rb'), 'text/html')}
    data = {'jurisdiction': 'EU', 'name': name}
    res = requests.post(url, files=files, data=data)
    if res.status_code != 200:
        print("Upload failed:", res.text)
        exit(1)
    return res.json().get('job_id')

print("\n=== STEP 4: FAILURE PROPAGATION ===")
job_id = start_job("Failure Test")
print(f"Job ID: {job_id}")

sse_url = f"http://127.0.0.1:8080/api/v1/jobs/{job_id}/events"
response = requests.get(sse_url, stream=True, timeout=10)
for line in response.iter_lines():
    if line:
        decoded = line.decode('utf-8')
        if decoded.startswith('data: '):
            ev = json.loads(decoded[6:])
            print(f"[{ev['status']}] Stage {ev['stage_number']} - {ev['stage_name']} | Details: {ev.get('details')}")
            if ev.get('status') == 'failed':
                print(">>> Caught expected failure!")
                break
            if ev.get('stage_number') == 9 and ev.get('status') in ['completed', 'failed']:
                break

print("\n=== STEP 3: MID-RUN RECONNECT ===")
# Wait a bit then query the same job ID. Since it failed, history should be yielded and stream should close instantly.
print("Reconnecting to failed job to simulate mid/post-run history fetch...")
response_mid = requests.get(sse_url, stream=True, timeout=10)
history = []
for line in response_mid.iter_lines():
    if line:
        decoded = line.decode('utf-8')
        if decoded.startswith('data: '):
            history.append(json.loads(decoded[6:]))
print(f"Reconnected and successfully fetched {len(history)} historical events instantly!")
print(f"Last historical event: {history[-1]['status']} - {history[-1]['stage_name']} | Details: {history[-1].get('details')}")

