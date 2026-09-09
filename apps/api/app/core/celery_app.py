import os
import ssl
from celery import Celery

redis_url = os.getenv("CELERY_BROKER_URL") or os.getenv("REDIS_URL") or "redis://localhost:6379/0"

celery_app = Celery(
    "rac_tasks",
    broker=redis_url,
    backend=redis_url,
    imports=["app.services.reporting", "app.workers.tasks"]
)

# Set as global default so any Celery tasks use this instance
celery_app.set_default()

ssl_options = {"ssl_cert_reqs": ssl.CERT_NONE} if redis_url.startswith("rediss://") else None

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=True,
    broker_use_ssl=ssl_options,
    redis_backend_use_ssl=ssl_options,
    # Route tasks so active worker processes them reliably
    task_routes={
        "app.workers.tasks.dispatch_webhook_task": {"queue": "notifications"},
        "app.workers.tasks.generate_report_task": {"queue": "ingestion"},
        "app.services.reporting.generate_pdf_report_task": {"queue": "ingestion"},
        "app.workers.tasks.*": {"queue": "ingestion"},
        "app.services.reporting.*": {"queue": "ingestion"},
    },
    task_default_queue="ingestion",
    beat_schedule={
        "poll-regulations-every-12-hours": {
            "task": "app.workers.tasks.poll_regulations_task",
            "schedule": 43200.0, # 12 hours in seconds
        }
    }
)

# Ensure we can discover tasks
celery_app.autodiscover_tasks(["app.workers", "app.services"])
