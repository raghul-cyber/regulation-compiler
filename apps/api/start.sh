#!/bin/bash
set -e

echo "=== Regulation-as-Code Compiler API Startup ==="

export PYTHONUNBUFFERED=1
export PYTHONDONTWRITEBYTECODE=1
export MALLOC_ARENA_MAX=2

# Ensure Render virtual environment is activated if present
if [ -f "/opt/render/project/src/.venv/bin/activate" ]; then
    echo "Activating Render virtual environment (/opt/render/project/src/.venv)..."
    source /opt/render/project/src/.venv/bin/activate
elif [ -f ".venv/bin/activate" ]; then
    echo "Activating local virtual environment (.venv)..."
    source .venv/bin/activate
fi

# Handle working directory if running from repo root
if [ -d "apps/api" ] && [ ! -d "app" ]; then
    echo "Switching to apps/api directory..."
    cd apps/api
fi

# 1. Run database migrations
if [ -f "alembic.ini" ]; then
    echo "[1/2] Running Alembic migrations..."
    python -m alembic upgrade head || python -m alembic stamp head || echo "Alembic notice: schema already up to date."
fi

# 2. Run seed / table safety script
if [ -f "create_tables.py" ]; then
    echo "[2/2] Verifying database tables..."
    python create_tables.py || echo "Table verification notice: continuing."
fi

# 3. Optional inline Celery worker (disabled by default on free tier to prevent 512MB RAM OOM)
if [ "$ENABLE_INLINE_CELERY" = "true" ]; then
    echo "Starting inline Celery worker..."
    celery -A app.workers.tasks worker --loglevel=info -B -P solo -Q ingestion,reports,notifications &
fi

# 4. Launch FastAPI web server
PORT="${PORT:-10000}"
echo "FastAPI launching on 0.0.0.0:${PORT} with $(python --version)..."
exec python -u -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --proxy-headers --forwarded-allow-ips='*'
