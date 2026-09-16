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
from typing import Optional
from app.core.auth import require_role, get_optional_current_user
from app.models.jobs import BackgroundJob, JobEvent
from app.core.celery_app import celery_app

router = APIRouter(tags=["jobs"])

@router.get("/jobs/{job_id}")
def get_job_status(
    job_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    events = db.query(JobEvent).filter(JobEvent.job_id == job_id).order_by(JobEvent.created_at.asc()).all()
    events_list = [
        {
            "id": str(e.id),
            "job_id": str(e.job_id),
            "stage_number": e.stage_number,
            "stage_name": e.stage_name,
            "status": e.status,
            "details": e.details,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in events
    ]
        
    return {
        "id": str(job.id),
        "job_type": job.job_type.value if hasattr(job.job_type, 'value') else job.job_type,
        "status": job.status.value if hasattr(job.status, 'value') else job.status,
        "error_details": job.error_details,
        "result_data": job.result_data,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "events": events_list
    }

@router.get("/jobs/{job_id}/events-list")
def get_job_events_list(
    job_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    events = db.query(JobEvent).filter(JobEvent.job_id == job_id).order_by(JobEvent.created_at.asc()).all()
    return [
        {
            "id": str(e.id),
            "job_id": str(e.job_id),
            "stage_number": e.stage_number,
            "stage_name": e.stage_name,
            "status": e.status,
            "details": e.details,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in events
    ]

@router.get("/jobs/{job_id}/events")
async def get_job_events(
    job_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    from app.db.session import SessionLocal
    from app.models.jobs import JobStatusEnum

    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    target_max_stage = 5 if (job and job.job_type and "report" in str(job.job_type).lower()) else 9
    
    historical_events = db.query(JobEvent).filter(JobEvent.job_id == job_id).order_by(JobEvent.created_at.asc()).all()
    
    async def event_generator():
        seen_event_ids = set()
        terminal_reached = False
        
        # 1. Emit all historical events recorded in DB
        for event in historical_events:
            seen_event_ids.add(str(event.id))
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

        # 2. Setup Redis PubSub (best-effort real-time stream)
        pubsub = None
        redis_client = None
        channel = f"job_events:{job_id}"
        try:
            redis_url = celery_app.conf.broker_url
            redis_client = aioredis.from_url(redis_url, socket_timeout=2.0, socket_connect_timeout=2.0)
            pubsub = redis_client.pubsub()
            await pubsub.subscribe(channel)
        except Exception as r_err:
            pubsub = None
            redis_client = None
        
        try:
            last_heartbeat = time.time()
            last_db_poll = time.time()
            
            while True:
                # A. Try reading from Redis PubSub if connected
                if pubsub:
                    try:
                        message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.3)
                        if message and message.get("type") == "message":
                            data = message["data"]
                            if isinstance(data, bytes):
                                data = data.decode("utf-8")
                            
                            try:
                                parsed = json.loads(data)
                                event_id = str(parsed.get("id", ""))
                                if event_id and event_id not in seen_event_ids:
                                    seen_event_ids.add(event_id)
                                    yield f"data: {data}\n\n"
                                    
                                    if parsed.get("stage_number", 0) >= target_max_stage and parsed.get("status") in ["completed", "failed"]:
                                        await asyncio.sleep(0.5)
                                        break
                                    if parsed.get("status") == "failed":
                                        await asyncio.sleep(0.5)
                                        break
                            except Exception:
                                yield f"data: {data}\n\n"
                    except Exception:
                        pass

                # B. Dual-source safety: Poll PostgreSQL every 1.2s to guarantee zero missed events without DB thrashing
                now = time.time()
                poll_interval = 2.0 if pubsub else 1.2
                if now - last_db_poll >= poll_interval:
                    last_db_poll = now
                    try:
                        poll_db = SessionLocal()
                        try:
                            fresh_events = poll_db.query(JobEvent).filter(
                                JobEvent.job_id == job_id
                            ).order_by(JobEvent.created_at.asc()).all()
                            
                            for ev in fresh_events:
                                ev_id_str = str(ev.id)
                                if ev_id_str not in seen_event_ids:
                                    seen_event_ids.add(ev_id_str)
                                    payload = {
                                        "id": ev_id_str,
                                        "job_id": str(ev.job_id),
                                        "stage_number": ev.stage_number,
                                        "stage_name": ev.stage_name,
                                        "status": ev.status,
                                        "details": ev.details,
                                        "created_at": ev.created_at.isoformat()
                                    }
                                    yield f"data: {json.dumps(payload)}\n\n"
                                    
                                    if ev.status == 'failed' or (ev.stage_number >= target_max_stage and ev.status in ['completed', 'failed']):
                                        terminal_reached = True
                                        break
                            
                            # Check terminal job status
                            bg_job = poll_db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
                            if bg_job and bg_job.status in [JobStatusEnum.completed, JobStatusEnum.failed]:
                                terminal_reached = True
                        finally:
                            poll_db.close()
                            
                        if terminal_reached:
                            await asyncio.sleep(0.5)
                            break
                    except Exception as poll_err:
                        pass

                # C. Heartbeat to keep HTTP connection alive through proxies
                if now - last_heartbeat > 12:
                    yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
                    last_heartbeat = now
                    
                await asyncio.sleep(0.1)
        finally:
            if pubsub:
                try:
                    await pubsub.unsubscribe(channel)
                    await pubsub.close()
                except Exception:
                    pass
            if redis_client:
                try:
                    await redis_client.aclose()
                except Exception:
                    pass
            import gc
            gc.collect()
    headers = {
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Content-Type": "text/event-stream"
    }
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers=headers)

@router.post("/jobs/{job_id}/retry")
def retry_job(
    job_id: uuid.UUID,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.developer, RoleEnum.compliance_officer])),
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
    job.status = JobStatusEnum.processing
    job.error_details = None
    job.result_data = None
    db.commit()
        
    try:
        task = process_ingestion_pipeline.delay(str(job.id), str(version.source_document_id))
        job.task_id = task.id
    except Exception:
        job.task_id = str(uuid.uuid4())
    db.commit()

    from app.api.routers.regulations import run_pipeline_in_background
    run_pipeline_in_background(str(job.id), str(version.source_document_id))

    return {"message": "Job re-queued successfully", "job_id": str(job.id)}
