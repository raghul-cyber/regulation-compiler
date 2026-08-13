from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api.routers import webhooks, test_rbac, regulations, requirements, reports, developer, api_keys, system_mappings, jobs
from app.core.limiter import limiter

import os
import logging
from pythonjsonlogger import jsonlogger
from asgi_correlation_id import CorrelationIdMiddleware, correlation_id
import sentry_sdk

# Configure JSON Logging with Correlation ID
logger = logging.getLogger()
logger.setLevel(logging.INFO)
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    fmt="%(asctime)s %(levelname)s %(name)s %(correlation_id)s %(message)s"
)
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)

# Inject correlation ID into log records
class CorrelationIdFilter(logging.Filter):
    def filter(self, record):
        record.correlation_id = correlation_id.get()
        return True

logger.addFilter(CorrelationIdFilter())

# Initialize Sentry
sentry_dsn = os.getenv("SENTRY_DSN", "")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

app = FastAPI(
    title="Regulation-as-Code Compiler API",
    description="API for the Regulation-as-Code Compiler",
    version="1.0.0",
)

# Add Middlewares
app.add_middleware(CorrelationIdMiddleware)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(webhooks.router, prefix="/api")
app.include_router(test_rbac.router, prefix="/api")
app.include_router(regulations.router, prefix="/api/v1/regulations")
app.include_router(requirements.router, prefix="/api")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(developer.router, prefix="/api/v1")
app.include_router(api_keys.router, prefix="/api/v1")
app.include_router(system_mappings.router, prefix="/api")
app.include_router(jobs.router, prefix="/api/v1")

from sqlalchemy import text
from app.db.session import SessionLocal

@app.get("/health", response_class=JSONResponse)
async def health_check(request: Request):
    # Base response
    response = {"status": "ok", "checks": {}}
    
    # 1. Check DB
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        response["checks"]["database"] = "ok"
    except Exception as e:
        response["status"] = "degraded"
        response["checks"]["database"] = f"error: {str(e)}"
    finally:
        db.close()
        
    # 2. Check Redis (via Celery Broker)
    try:
        from app.core.celery_app import celery_app
        # Ping the broker
        with celery_app.connection() as connection:
            connection.ensure_connection(max_retries=1)
        response["checks"]["redis"] = "ok"
    except Exception as e:
        response["status"] = "degraded"
        response["checks"]["redis"] = f"error: {str(e)}"

    return response

@app.get("/sentry-debug")
async def trigger_error():
    raise Exception("Test Sentry error")
