import requests
import json
import time

url = "http://127.0.0.1:8080/api/v1/regulations/upload"

print("Triggering upload...")
files = {'file': ('gdpr.html', open('gdpr.html', 'rb'), 'text/html')}
data = {'jurisdiction': 'EU', 'name': 'SSE E2E Test'}
res = requests.post(url, files=files, data=data)
print("Upload response:", res.status_code)
if res.status_code != 200:
    print(res.text)
    exit(1)
    
job_id = res.json().get('job_id')
print(f"Job ID: {job_id}")

print("Connecting to SSE...")
sse_url = f"http://127.0.0.1:8080/api/v1/jobs/{job_id}/events"
response = requests.get(sse_url, stream=True, timeout=30)

start_time = time.time()
print("Listening for events...")
for line in response.iter_lines():
    if line:
        decoded_line = line.decode('utf-8')
        if decoded_line.startswith('data: '):
            data_json = json.loads(decoded_line[6:])
            elapsed = time.time() - start_time
            print(f"[{elapsed:.2f}s] Stage {data_json.get('stage_number')} - {data_json.get('stage_name')}: {data_json.get('status')} {data_json.get('details', '')}")
            
            if data_json.get('stage_number') == 9 and data_json.get('status') in ['completed', 'failed']:
                print("Terminal state reached!")
                break
                
print("Test completed.")
