import os

jobs_router_path = r"apps\api\app\api\routers\jobs.py"
with open(jobs_router_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the SSE generator logic
old_loop = """
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
"""

new_loop = """
        # Yield historical events first
        terminal_reached = False
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
            if event.status == 'failed' or (event.stage_number == 9 and event.status in ['completed', 'failed']):
                terminal_reached = True
                
        if terminal_reached:
            return
            
        # Connect to Redis PubSub for real-time events
"""

if old_loop in content:
    content = content.replace(old_loop, new_loop)
    with open(jobs_router_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("FastAPI SSE endpoint patched for terminal state.")
else:
    print("Could not find old loop.")
