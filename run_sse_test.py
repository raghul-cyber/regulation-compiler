import requests
import json
import time

url = "http://127.0.0.1:8080/api/v1/regulations/upload"

# 1. Trigger Upload
print("Triggering upload...")
files = {'file': ('gdpr.html', open('gdpr.html', 'rb'), 'text/html')}
data = {'jurisdiction': 'EU', 'name': 'SSE Test'}
res = requests.post(url, files=files, data=data)
job_id = res.json().get('job_id')
print(f"Job ID: {job_id}")

# 2. Connect to SSE
print("Connecting to SSE...")
sse_url = f"http://127.0.0.1:8080/api/v1/jobs/{job_id}/events"
response = requests.get(sse_url, stream=True)

start_time = time.time()
for line in response.iter_lines():
    if line:
        decoded_line = line.decode('utf-8')
        if decoded_line.startswith('data: '):
            data_json = json.loads(decoded_line[6:])
            elapsed = time.time() - start_time
            print(f"[{elapsed:.2f}s] Stage {data_json.get('stage_number')} - {data_json.get('stage_name')}: {data_json.get('status')}")
            
            # Break on completion
            if data_json.get('stage_number') == 9 and data_json.get('status') in ['completed', 'failed']:
                print("Pipeline terminal state reached.")
                break
                
print("SSE Stream closed.")
