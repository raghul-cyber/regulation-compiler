import json
import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
import redis
from app.models.jobs import JobEvent
from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)

# Using the same redis URL that celery uses
redis_url = celery_app.conf.broker_url
sync_redis = redis.from_url(redis_url)

class EventDispatcher:
    def __init__(self, db: Session, job_id: uuid.UUID):
        self.db = db
        self.job_id = job_id
        self.channel = f"job_events:{self.job_id}"

    def emit(self, stage_number: int, stage_name: str, status: str, details: dict = None):
        """
        Emits a pipeline event to PostgreSQL for persistence, and to Redis PubSub for real-time SSE.
        status should be one of: "started", "completed", "failed"
        """
        try:
            # 1. Persist to DB
            event = JobEvent(
                job_id=self.job_id,
                stage_number=stage_number,
                stage_name=stage_name,
                status=status,
                details=details
            )
            self.db.add(event)
            self.db.commit()
            
            # Refresh to get timestamps etc
            self.db.refresh(event)

            # 2. Publish to Redis PubSub
            payload = {
                "id": str(event.id),
                "job_id": str(event.job_id),
                "stage_number": event.stage_number,
                "stage_name": event.stage_name,
                "status": event.status,
                "details": event.details,
                "created_at": event.created_at.isoformat()
            }
            sync_redis.publish(self.channel, json.dumps(payload))
            logger.info(f"Dispatched event for Job {self.job_id}: Stage {stage_number} ({stage_name}) [{status}]")
        except Exception as e:
            logger.error(f"Failed to dispatch event: {e}")
            self.db.rollback()

