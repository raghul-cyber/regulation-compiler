import requests
import json
import time

job_id = "9f8f3a6b-182c-411b-bc1c-86ed3723faea"
sse_url = f"http://127.0.0.1:8080/api/v1/jobs/{job_id}/events"

response = requests.get(sse_url, stream=True, timeout=5)

print("Reading history buffer...")
lines = []
try:
    for line in response.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            if decoded_line.startswith('data: '):
                lines.append(decoded_line)
                data_json = json.loads(decoded_line[6:])
                # Stop reading once we see the final event from history
                if data_json.get('stage_number') == 9 and data_json.get('status') in ['completed', 'failed']:
                    break
except Exception as e:
    print(f"Exception (expected if timeout): {e}")

print(f"Total historical events recovered: {len(lines)}")
for l in lines[-3:]:
    print("...", l[:100], "...")
