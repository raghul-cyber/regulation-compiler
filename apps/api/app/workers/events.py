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
_sync_redis_client = None

def get_sync_redis():
    global _sync_redis_client
    if _sync_redis_client is None:
        try:
            _sync_redis_client = redis.from_url(
                redis_url,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
                retry_on_timeout=True
            )
        except Exception as e:
            logger.warning(f"Could not connect to Redis for events: {e}")
            return None
    return _sync_redis_client

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
        # 1. Persist to DB (primary ground truth)
        event_id = uuid.uuid4()
        now = datetime.now()
        try:
            event = JobEvent(
                id=event_id,
                job_id=self.job_id,
                stage_number=stage_number,
                stage_name=stage_name,
                status=status,
                details=details,
                created_at=now
            )
            self.db.add(event)
            self.db.commit()
        except Exception as db_err:
            logger.error(f"Failed to persist event to DB for Job {self.job_id}: {db_err}")
            self.db.rollback()
            return

        # 2. Publish to Redis PubSub (best-effort real-time delivery)
        try:
            r = get_sync_redis()
            if r:
                payload = {
                    "id": str(event_id),
                    "job_id": str(self.job_id),
                    "stage_number": stage_number,
                    "stage_name": stage_name,
                    "status": status,
                    "details": details,
                    "created_at": now.isoformat()
                }
                r.publish(self.channel, json.dumps(payload))
            logger.info(f"Dispatched event for Job {self.job_id}: Stage {stage_number} ({stage_name}) [{status}]")
        except Exception as pubsub_err:
            logger.warning(f"Redis publish skipped/failed for Job {self.job_id} Stage {stage_number}: {pubsub_err}")


