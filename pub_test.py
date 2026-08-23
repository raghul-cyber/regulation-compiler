import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0)

job_id = "82dd786f-ab17-49e0-8d23-002f3cedb885"  # Using the job_id that was generated during the API test

payload = {
    "id": "test-123",
    "job_id": job_id,
    "stage_number": 5,
    "stage_name": "Test Stage",
    "status": "completed",
    "details": {"test": "success"},
    "created_at": "2023-01-01T00:00:00"
}
r.publish(f"job_events:{job_id}", json.dumps(payload))
print("Published test event")
