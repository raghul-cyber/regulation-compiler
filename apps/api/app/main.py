import os
import re
import time
import shutil
import logging
from typing import Optional
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from pythonjsonlogger import jsonlogger  # type: ignore
from asgi_correlation_id import CorrelationIdMiddleware, correlation_id  # type: ignore
import sentry_sdk
from sqlalchemy import text

from app.api.routers import (
    team, webhooks, test_rbac, regulations, requirements,
    reports, developer, api_keys, system_mappings, jobs,
    policies, compliance, customer, admin
)
from app.core.celery_app import celery_app
from app.core.limiter import limiter
from app.core.security_guard import (
    SQLInjectionGuardMiddleware,
    SecurityHeadersMiddleware,
    UploadSizeLimitMiddleware,
    RequestTimeoutMiddleware
)
from app.core.idempotency import IdempotencyGuardMiddleware
from app.db.session import SessionLocal, engine

# -------------------------------------------------------------
# Structured JSON Logging with PII / Secret Redaction
# -------------------------------------------------------------
SENSITIVE_PATTERNS = [
    re.compile(r"(Bearer\s+)[A-Za-z0-9_\-\.]{10,}", re.IGNORECASE),
    re.compile(r"(api[_-]?key[\"']?\s*[:=]\s*[\"'])[A-Za-z0-9_\-]{10,}([\"'])", re.IGNORECASE),
    re.compile(r"(password[\"']?\s*[:=]\s*[\"'])[^\"']+([\"'])", re.IGNORECASE),
    re.compile(r"(sk_[A-Za-z0-9_\-]{16,})", re.IGNORECASE),
]

def scrub_sensitive_data(message: str) -> str:
    """Redacts API keys, passwords, and bearer tokens from log outputs."""
    if not isinstance(message, str):
        return message
    scrubbed = message
    for pattern in SENSITIVE_PATTERNS:
        scrubbed = pattern.sub(r"\1[REDACTED]\2" if r"\2" in pattern.pattern else "[REDACTED_SECRET]", scrubbed)
    return scrubbed

class ScrubbingJsonFormatter(jsonlogger.JsonFormatter):
    def format(self, record):
        if isinstance(record.msg, str):
            record.msg = scrub_sensitive_data(record.msg)
        return super().format(record)

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logHandler = logging.StreamHandler()
formatter = ScrubbingJsonFormatter(
    fmt="%(asctime)s %(levelname)s %(name)s %(correlation_id)s %(message)s"
)
logHandler.setFormatter(formatter)
logger.handlers = [logHandler]

class CorrelationIdFilter(logging.Filter):
    def filter(self, record):
        record.correlation_id = correlation_id.get() or "no-corr-id"
        return True

logger.addFilter(CorrelationIdFilter())

# Initialize Sentry if configured
sentry_dsn = os.getenv("SENTRY_DSN", "")
if sentry_dsn and not sentry_dsn.startswith("https://placeholder"):
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

# -------------------------------------------------------------
# FastAPI Application Declaration
# -------------------------------------------------------------
app = FastAPI(
    title="Regulation-as-Code Compiler API",
    description="Enterprise-Hardened API for the Regulation-as-Code Compiler",
    version="1.1.0",
)

# -------------------------------------------------------------
# Enterprise Middleware Pipeline (Order Matters)
# -------------------------------------------------------------
# 1. GZip Compression (compress JSON/payloads > 1000 bytes)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 2. Correlation ID for distributed request tracing
app.add_middleware(CorrelationIdMiddleware)

# 3. Security Headers Enforcement (CSP, HSTS, X-Frame-Options, nosniff)
app.add_middleware(SecurityHeadersMiddleware)

# 4. SQL Injection Protection Guard
app.add_middleware(SQLInjectionGuardMiddleware)

# 5. Upload Size Ceiling (25MB)
app.add_middleware(UploadSizeLimitMiddleware)

# 6. Request Timeout Ceiling (60s)
app.add_middleware(RequestTimeoutMiddleware, timeout_seconds=60.0)

# 7. Idempotency Guard (protects duplicate submissions)
app.add_middleware(IdempotencyGuardMiddleware)

# 8. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['*', 'X-Idempotent-Replay', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    max_age=86400,
)

app.state.limiter = limiter

# -------------------------------------------------------------
# Centralized Error Handlers (Unified JSON Envelopes)
# -------------------------------------------------------------
@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "Rate limit exceeded. Please throttle your requests.",
                "details": str(exc.detail) if hasattr(exc, "detail") else "Too many requests"
            }
        },
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Retry-After": "60",
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    origin = request.headers.get("origin", "*")
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        errors.append({"field": loc, "message": err.get("msg")})
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The request payload failed schema validation.",
                "details": errors
            }
        },
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    corr_id = correlation_id.get() or "no-corr-id"
    logger.exception(f"Unhandled exception on {request.method} {request.url.path} (Trace: {corr_id}): {exc}")
    is_dev = os.getenv("ENVIRONMENT", "").lower() in ["development", "dev", "local"]
    detail = str(exc) if is_dev else "An unexpected server error occurred."
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": detail,
                "correlation_id": corr_id,
                "path": request.url.path
            }
        },
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    )

# -------------------------------------------------------------
# Router Inclusions
# -------------------------------------------------------------
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

# -------------------------------------------------------------
# High-Reliability Observability & Health Probes (Uptime Monitoring)
# -------------------------------------------------------------
@app.get("/health", response_class=JSONResponse)
async def health_check(request: Request):
    """Fast Liveness Probe (HTTP 200)."""
    return {"status": "ok", "timestamp": time.time()}

@app.get("/health/ready", response_class=JSONResponse)
@app.get("/health/deep", response_class=JSONResponse)
async def deep_health_check(request: Request):
    """
    Comprehensive Readiness & Deep Health Probe:
    - PostgreSQL read query + latency measurement
    - Redis broker ping + latency measurement
    - 24/7 Statutory Surveillance worker health
    - Disk storage availability
    """
    from app.core.cache import ResponseCache
    cached_ready = ResponseCache.get("health:ready")
    if cached_ready is not None:
        return cached_ready

    response = {
        "status": "ok",
        "timestamp": time.time(),
        "latency_ms": {},
        "checks": {}
    }
    is_degraded = False

    # 1. PostgreSQL Probe
    db_start = time.time()
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db_latency = round((time.time() - db_start) * 1000, 2)
        response["checks"]["database"] = "ok"
        response["latency_ms"]["database"] = db_latency
    except Exception as e:
        is_degraded = True
        response["checks"]["database"] = f"error: {str(e)}"
    finally:
        try:
            db.close()
        except Exception:
            pass

    # 2. Redis Probe
    redis_start = time.time()
    try:
        with celery_app.connection() as connection:
            connection.ensure_connection(max_retries=1)
        redis_latency = round((time.time() - redis_start) * 1000, 2)
        response["checks"]["redis"] = "ok"
        response["latency_ms"]["redis"] = redis_latency
    except Exception as e:
        # If Redis isn't connected in local mode, note as degraded
        response["checks"]["redis"] = f"standby: {str(e)}"

    # 3. Disk Space Probe
    try:
        total, used, free = shutil.disk_usage(".")
        free_gb = round(free / (2**30), 2)
        response["checks"]["disk"] = {
            "status": "ok" if free_gb > 1.0 else "low_disk_warning",
            "free_gb": free_gb
        }
    except Exception as e:
        response["checks"]["disk"] = {"status": "unknown", "error": str(e)}

    # 4. 24/7 Surveillance Daemon Probe
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

    if is_degraded:
        response["status"] = "degraded"

    ResponseCache.set("health:ready", response, ttl_seconds=5)
    return response

# -------------------------------------------------------------
# Organization AI Spending Cap Endpoints
# -------------------------------------------------------------
from app.services.spending_caps import get_spending_report
from app.core.auth import get_optional_current_user
from app.models.organizations import User
from fastapi import Depends
from app.db.session import get_db
from sqlalchemy.orm import Session

@app.get("/api/v1/organization/spending", response_class=JSONResponse)
def get_org_spending(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Returns real-time AI usage cost vs monthly spending cap."""
    org_id = current_user.org_id if current_user else None
    return {"data": get_spending_report(db, org_id)}

@app.get("/sentry-debug")
async def trigger_error():
    if os.getenv("ENVIRONMENT", "").lower() not in ["development", "dev", "local"]:
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    raise Exception("Test Sentry error")

from app.services.live_feed_scraper import start_24_7_surveillance_worker

@app.on_event("startup")
def startup_event():
    # Safely launch continuous 24/7 statutory surveillance daemon in background thread
    try:
        if os.getenv("ENABLE_SURVEILLANCE_DAEMON", "true").lower() != "false":
            interval = int(os.getenv("SURVEILLANCE_INTERVAL", "180"))
            start_24_7_surveillance_worker(interval_seconds=interval)
            logging.getLogger("app.main").info(f"24/7 Live Regulatory Surveillance Worker spawned in background thread ({interval}s interval).")
    except Exception as e:
        logging.getLogger("app.main").error(f"Surveillance worker startup notice: {e}")
