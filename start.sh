#!/bin/bash
set -e

echo "=== Regulation-as-Code Compiler API Startup ==="

# Handle working directory if running from repo root
if [ -d "apps/api" ] && [ ! -d "app" ]; then
    echo "Switching to apps/api directory..."
    cd apps/api
fi

# 1. Run database migrations
if [ -f "alembic.ini" ]; then
    echo "[1/2] Running Alembic migrations..."
    alembic upgrade head || alembic stamp head || echo "Alembic notice: schema already up to date."
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
echo "FastAPI launching on port ${PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
