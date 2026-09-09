import uuid
import json
import asyncio
import time
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.organizations import User, RoleEnum
from app.core.auth import require_role
from app.models.jobs import BackgroundJob, JobEvent
from app.core.celery_app import celery_app

router = APIRouter(tags=["jobs"])

@router.get("/jobs/{job_id}")
def get_job_status(
    job_id: uuid.UUID,
    # current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.developer, RoleEnum.compliance_officer])),
    db: Session = Depends(get_db)
):
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "id": str(job.id),
        "job_type": job.job_type.value if hasattr(job.job_type, 'value') else job.job_type,
        "status": job.status.value if hasattr(job.status, 'value') else job.status,
        "error_details": job.error_details,
        "result_data": job.result_data,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None
    }

@router.get("/jobs/{job_id}/events")
async def get_job_events(
    job_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    target_max_stage = 5 if (job and job.job_type and "report" in str(job.job_type).lower()) else 9
    
    historical_events = db.query(JobEvent).filter(JobEvent.job_id == job_id).order_by(JobEvent.created_at.asc()).all()
    
    async def event_generator():
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
            yield f"data: {json.dumps(payload)}\n\n"
            if event.status == 'failed' or (event.stage_number >= target_max_stage and event.status in ['completed', 'failed']):
                terminal_reached = True
                
        if terminal_reached:
            return
            
        redis_url = celery_app.conf.broker_url
        redis_client = aioredis.from_url(redis_url)
        pubsub = redis_client.pubsub()
        channel = f"job_events:{job_id}"
        await pubsub.subscribe(channel)
        
        try:
            last_heartbeat = time.time()
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message["type"] == "message":
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode("utf-8")
                    yield f"data: {data}\n\n"
                    
                    parsed = json.loads(data)
                    if parsed.get("stage_number", 0) >= target_max_stage and parsed.get("status") in ["completed", "failed"]:
                        await asyncio.sleep(0.5)
                        break
                    if parsed.get("status") == "failed":
                        await asyncio.sleep(0.5)
                        break
                else:
                    if time.time() - last_heartbeat > 15:
                        yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
                        last_heartbeat = time.time()
                        
                await asyncio.sleep(0.1)
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()
            await redis_client.aclose()
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/jobs/{job_id}/retry")
def retry_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    from app.models.regulations import RegulationVersion
    from app.workers.tasks import process_ingestion_pipeline
    
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    version = db.query(RegulationVersion).filter(RegulationVersion.id == job.entity_id).first()
    if not version or not version.source_document_id:
        raise HTTPException(status_code=400, detail="Cannot retry: missing source document linkage")
        
    db.query(JobEvent).filter(JobEvent.job_id == job_id).delete()
        
    task = process_ingestion_pipeline.delay(str(job.id), str(version.source_document_id))
    job.task_id = task.id
    db.commit()
    return {"message": "Job re-queued successfully", "job_id": str(job.id)}
