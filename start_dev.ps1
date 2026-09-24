# start_dev.ps1
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Starting Regulation-as-Code Compiler" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan

$workspaceRoot = $PSScriptRoot
if (-not $workspaceRoot) { $workspaceRoot = Get-Location }

Write-Host "`n[1/3] Booting FastAPI Backend Server (Port 8080)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$workspaceRoot\apps\api'; .\.venv\Scripts\activate; uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload"

Write-Host "`n[2/3] Booting Celery Worker (Upstash Queue)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$workspaceRoot\apps\api'; .\.venv\Scripts\activate; celery -A app.core.celery_app worker --pool=solo --loglevel=info"

Write-Host "`n[3/3] Booting Next.js Frontend (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$workspaceRoot\apps\web'; pnpm run dev"

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " All services have launched in dedicated consoles!" -ForegroundColor Green
Write-Host " Frontend: http://localhost:3000" -ForegroundColor White
Write-Host " API Docs: http://localhost:8080/docs" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Green
