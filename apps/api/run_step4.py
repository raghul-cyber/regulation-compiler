import requests
import json
import time

url = "http://127.0.0.1:8080/api/v1/regulations/upload"

print("=== STEP 4: FAILURE PROPAGATION ===")
files = {'file': ('gdpr.html', open('../../gdpr.html', 'rb'), 'text/html')}
data = {'jurisdiction': 'EU', 'name': 'Failure Test'}
res = requests.post(url, files=files, data=data)
job_id = res.json().get('job_id')
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

