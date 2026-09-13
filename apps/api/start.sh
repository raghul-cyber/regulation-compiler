#!/bin/bash
set -e

echo "=== Regulation-as-Code Compiler API Startup ==="

# 1. Run database migrations
if [ -f "alembic.ini" ]; then
    echo "[1/3] Running Alembic migrations..."
    alembic upgrade head || echo "Alembic notice: schema already up to date or skipping."
fi

# 2. Run seed / table safety script
if [ -f "create_tables.py" ]; then
    echo "[2/3] Verifying database tables..."
    python create_tables.py || echo "Table verification notice: continuing."
fi

# 3. Start Celery worker with Celery Beat in background (using solo pool for minimal memory on free tier)
echo "[3/3] Starting Celery background worker with 24/7 Beat scheduler..."
celery -A app.workers.tasks worker --loglevel=info -B -P solo -Q ingestion,reports,notifications &

# 4. Launch FastAPI web server
PORT="${PORT:-8000}"
echo "FastAPI launching on port ${PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
