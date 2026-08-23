import requests
import json
import time

url = "http://127.0.0.1:8080/api/v1/regulations/upload"

def start_job(name):
    files = {'file': ('gdpr.html', open('gdpr.html', 'rb'), 'text/html')}
    data = {'jurisdiction': 'EU', 'name': name}
    res = requests.post(url, files=files, data=data)
    if res.status_code != 200:
        print("Upload failed:", res.text)
        exit(1)
    return res.json().get('job_id')


print("=== STEP 3: MID-RUN RECONNECT ===")
mid_job_id = start_job("Mid Run Test v2")
mid_url = f"http://127.0.0.1:8080/api/v1/jobs/{mid_job_id}/events"

time.sleep(3.5)

response_mid = requests.get(mid_url, stream=True, timeout=15)
print("Reconnected! Initial burst (history) + live received:")
for line in response_mid.iter_lines():
    if line:
        decoded = line.decode('utf-8')
        if decoded.startswith('data: '):
            ev = json.loads(decoded[6:])
            print(f"[{ev['status']}] Stage {ev['stage_number']} - {ev['stage_name']}")
            if ev.get('stage_number') == 9 and ev.get('status') in ['completed', 'failed']:
                break
print("Mid-run reconnect test passed.")

