import os

jobs_router_path = r"apps\api\app\api\routers\jobs.py"
with open(jobs_router_path, "r", encoding="utf-8") as f:
    content = f.read()

if "/jobs/{job_id}/events" not in content:
    sse_code = """
import json
import asyncio
import redis.asyncio as aioredis
from fastapi.responses import StreamingResponse
from app.core.celery_app import celery_app
from app.models.jobs import JobEvent

@router.get("/jobs/{job_id}/events")
async def get_job_events(
    job_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    # Fetch historical events for this job so reloads instantly catch up
    historical_events = db.query(JobEvent).filter(JobEvent.job_id == job_id).order_by(JobEvent.created_at.asc()).all()
    
    async def event_generator():
        # Yield historical events first
        for event in historical_events:
            payload = {
                "id": str(event.id),
                "job_id": str(event.job_id),
                "stage_number": event.stage_number,
                "stage_name": event.stage_name,
                "status": event.status,
                "details": event.details,
                "created_at": event.created_at.isoformat()
            }
            yield f"data: {json.dumps(payload)}\\n\\n"
            
        # Connect to Redis PubSub for real-time events
        redis_url = celery_app.conf.broker_url
        redis_client = aioredis.from_url(redis_url)
        pubsub = redis_client.pubsub()
        channel = f"job_events:{job_id}"
        await pubsub.subscribe(channel)
        
        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message["type"] == "message":
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode("utf-8")
                    yield f"data: {data}\\n\\n"
                    
                    # If this is a terminal state event, we can break after a small delay
                    parsed = json.loads(data)
                    if parsed.get("stage_number") == 9 and parsed.get("status") in ["completed", "failed"]:
                        await asyncio.sleep(1) # Give UI time to receive
                        break
                    # Also break on any failure
                    if parsed.get("status") == "failed":
                        await asyncio.sleep(1)
                        break
                        
                await asyncio.sleep(0.1) # Prevent tight loop
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()
            await redis_client.aclose()
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
"""
    content += sse_code
    with open(jobs_router_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("SSE router added.")
else:
    print("SSE router already present.")
