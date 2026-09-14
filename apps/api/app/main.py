from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api.routers import team, webhooks, test_rbac, regulations, requirements, reports, developer, api_keys, system_mappings, jobs, policies, compliance, customer, admin
from app.core.celery_app import celery_app
from app.core.limiter import limiter
import os
import logging
from pythonjsonlogger import jsonlogger  # type: ignore
from asgi_correlation_id import CorrelationIdMiddleware, correlation_id  # type: ignore
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

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Regulation-as-Code Compiler API",
    description="API for the Regulation-as-Code Compiler",
    version="1.0.0",
)

# Add Middlewares
app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['*'],
    max_age=86400,
)

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please retry shortly."},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    is_dev = os.getenv("ENVIRONMENT", "").lower() in ["development", "dev", "local"]
    detail = str(exc) if is_dev else "An unexpected server error occurred."
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": detail, "path": request.url.path},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    )

app.include_router(webhooks.router, prefix="/api")
app.include_router(test_rbac.router, prefix="/api")
app.include_router(regulations.router, prefix="/api/v1/regulations")
app.include_router(team.router, prefix="/api/v1/team")
app.include_router(requirements.router, prefix="/api")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(developer.router, prefix="/api/v1")
app.include_router(api_keys.router, prefix="/api/v1")
app.include_router(system_mappings.router, prefix="/api")
app.include_router(customer.router, prefix="/api")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(policies.router, prefix="/api/v1")
app.include_router(compliance.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

from sqlalchemy import text
from app.db.session import SessionLocal, engine


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

    # 3. Check 24/7 Statutory Surveillance Daemon
    try:
        from app.services.live_feed_scraper import scraper_service
        is_active = getattr(scraper_service, "is_running", False)
        response["checks"]["surveillance_24_7"] = {
            "status": "active" if is_active else "standby",
            "signals_scraped": scraper_service.stats.get("total_scraped", 0),
            "regulations_extracted": scraper_service.stats.get("total_extracted", 0),
            "last_scan_at": scraper_service.stats.get("last_scan_at"),
        }
    except Exception as se:
        response["checks"]["surveillance_24_7"] = {"status": "error", "detail": str(se)}

    return response

@app.get("/sentry-debug")
async def trigger_error():
    if os.getenv("ENVIRONMENT", "").lower() not in ["development", "dev", "local"]:
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    raise Exception("Test Sentry error")


from app.services.live_feed_scraper import start_24_7_surveillance_worker

@app.on_event("startup")
def startup_event():
    # Launch continuous 24/7 statutory surveillance daemon in background thread
    start_24_7_surveillance_worker(interval_seconds=25)
    logging.getLogger("app.main").info("24/7 Live Regulatory Surveillance Worker spawned in background thread (25s interval).")







