import requests

job_id = "9f8f3a6b-182c-411b-bc1c-86ed3723faea"
sse_url = f"http://127.0.0.1:8080/api/v1/jobs/{job_id}/events"
res = requests.get(sse_url)
print(f"Historical fetch length: {len(res.text)}")
lines = [line for line in res.text.split('\n') if line.startswith('data: ')]
print(f"Events recovered: {len(lines)}")
