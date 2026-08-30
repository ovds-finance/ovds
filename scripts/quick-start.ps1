# OVDS Quick Start with Health Check
# Starts dev servers and verifies they are running

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting development servers..." -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Gray
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host ""

Start-Process -FilePath "pwsh" -ArgumentList "-Command","npm run dev:all" -WindowStyle Normal

Write-Host "Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Running health check..." -ForegroundColor Yellow
Write-Host ""

& "$PSScriptRoot\quick-health-check.ps1"

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
