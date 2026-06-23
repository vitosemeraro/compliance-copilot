# Avvio completo della POC (Windows PowerShell).
# Apre backend (uvicorn) e frontend (vite) in due finestre separate.
# Prerequisiti gia' eseguiti una volta: pip install, build_index, seed_audit, npm install.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$py = Join-Path $backend ".venv\Scripts\python.exe"

if (-not (Test-Path $py)) {
  Write-Host "Venv non trovato. Esegui prima:" -ForegroundColor Yellow
  Write-Host "  cd backend; python -m venv .venv; .venv\Scripts\pip install -r requirements.txt"
  Write-Host "  .venv\Scripts\python scripts\build_index.py; .venv\Scripts\python scripts\seed_audit.py"
  exit 1
}

Write-Host "Avvio backend su http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "`$env:PYTHONUTF8='1'; & '$py' -m uvicorn app.main:app --app-dir '$backend' --host 127.0.0.1 --port 8000"
)

Start-Sleep -Seconds 2
Write-Host "Avvio frontend su http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "npm run dev --prefix '$frontend'"
)

Write-Host "`nPronto. Apri http://localhost:5173" -ForegroundColor Green
