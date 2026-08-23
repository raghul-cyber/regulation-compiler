# start_dev.ps1
Write-Host "========================================="
Write-Host " Starting Regulation-as-Code Compiler"
Write-Host "========================================="

Write-Host "`n[1/4] Starting Docker infrastructure..." -ForegroundColor Cyan
cd infra
docker-compose up -d
cd ..

Write-Host "`n[2/4] Booting FastAPI Server (Port 8080)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\api; .venv\Scripts\activate; uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload"

Write-Host "`n[3/4] Booting Celery Worker..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\api; .venv\Scripts\activate; celery -A app.core.celery_app worker --pool=solo --loglevel=info"

Write-Host "`n[4/4] Booting Next.js Frontend (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\web; pnpm run dev --port 3000"

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " All services have launched in separate windows!" -ForegroundColor Green
Write-Host " Frontend: http://localhost:3000"
Write-Host " API Docs: http://localhost:8080/docs"
Write-Host "=========================================" -ForegroundColor Green
