#!/bin/bash
set -e

# Run migrations
echo "Running Alembic migrations..."
alembic upgrade head

# Start application
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
