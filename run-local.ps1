# Script PowerShell khoi chay VLearn Class Knowledge Gap Map & AI Copilot Server
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " Starting VLearn Tutor & Topic Interest Map Server..." -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan

# Kiem tra Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# Realtime Runtime Log Folder Setup
if (-not (Test-Path -Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

Write-Host "Server URL: http://127.0.0.1:8000/" -ForegroundColor Yellow
Write-Host "Admin Page: http://127.0.0.1:8000/admin" -ForegroundColor Yellow
Write-Host "Health Check: http://127.0.0.1:8000/api/health" -ForegroundColor Yellow
Write-Host "Runtime Log: logs/vlearn-runtime.log" -ForegroundColor Yellow

python codebase/server.py
