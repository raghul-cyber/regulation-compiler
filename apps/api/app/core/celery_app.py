import os
from celery import Celery

redis_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "rac_tasks",
    broker=redis_url,
    backend=redis_url
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Phase 14: Real queue routing
    task_routes={
        "app.workers.tasks.dispatch_webhook_task": {"queue": "notifications"},
        "app.workers.tasks.generate_report_task": {"queue": "reports"},
        "app.workers.tasks.*": {"queue": "ingestion"},  # Default fallback for ingestion/amendment
    },
    # Ensure notifications don't get blocked by long tasks
    task_default_queue="ingestion",
    
    # Phase 16: Beat Schedule for Scraping
    beat_schedule={
        "poll-regulations-every-12-hours": {
            "task": "app.workers.tasks.poll_regulations_task",
            "schedule": 43200.0, # 12 hours in seconds
        }
    }
)

# Optional: ensure we can discover tasks
celery_app.autodiscover_tasks(["app.workers"])
