# ============================================================
# OVDS - Windows Service Setup
# Makes Apache + NestJS backend start automatically on boot
# Run as Administrator in PowerShell
# ============================================================

$nestAppDir  = "C:\xampp\htdocs\nxfk"
$nestMain    = "$nestAppDir\dist\main.js"
$nodePath    = (Get-Command node -ErrorAction SilentlyContinue)?.Source

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS Windows Service Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Apache as Windows Service ---
Write-Host "[1] Registering Apache as Windows service..." -ForegroundColor Yellow
$apacheSvc = Get-Service -Name "Apache2.4" -ErrorAction SilentlyContinue
if ($apacheSvc) {
    Write-Host "    Apache service already registered" -ForegroundColor Gray
} else {
    & "C:\xampp\apache\bin\httpd.exe" -k install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    Apache service registered" -ForegroundColor Green
    } else {
        Write-Host "    Failed to register Apache service" -ForegroundColor Red
    }
}

# Set Apache to auto-start
Set-Service -Name "Apache2.4" -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name "Apache2.4" -ErrorAction SilentlyContinue
Write-Host "    Apache set to auto-start on boot" -ForegroundColor Green

# --- 2. Check Node.js ---
Write-Host ""
Write-Host "[2] Checking Node.js..." -ForegroundColor Yellow
if (-not $nodePath) {
    Write-Host "    Node.js not found in PATH" -ForegroundColor Red
    Write-Host "    Install from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
$nodeVersion = node --version
Write-Host "    Node.js $nodeVersion found at $nodePath" -ForegroundColor Green

# --- 3. Check dist/main.js exists ---
Write-Host ""
Write-Host "[3] Checking NestJS build..." -ForegroundColor Yellow
if (-not (Test-Path $nestMain)) {
    Write-Host "    dist\main.js not found. Building now..." -ForegroundColor Yellow
    Push-Location $nestAppDir
    npm run build
    Pop-Location
    if (-not (Test-Path $nestMain)) {
        Write-Host "    Build failed. Run 'npm run build' manually." -ForegroundColor Red
        exit 1
    }
}
Write-Host "    dist\main.js found" -ForegroundColor Green

# --- 4. Install NSSM (Non-Sucking Service Manager) for NestJS ---
Write-Host ""
Write-Host "[4] Setting up NestJS as Windows service..." -ForegroundColor Yellow
$nssmPath = "C:\nssm\nssm.exe"

if (-not (Test-Path $nssmPath)) {
    Write-Host "    Downloading NSSM..." -ForegroundColor Yellow
    $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
    $zipPath = "$env:TEMP\nssm.zip"
    try {
        Invoke-WebRequest -Uri $nssmUrl -OutFile $zipPath -TimeoutSec 30
        $extractPath = "$env:TEMP\nssm-extract"
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
        New-Item -ItemType Directory -Path "C:\nssm" -Force | Out-Null
        Copy-Item "$extractPath\nssm-2.24\win64\nssm.exe" $nssmPath
        Remove-Item $zipPath, $extractPath -Recurse -Force
        Write-Host "    NSSM installed to C:\nssm\" -ForegroundColor Green
    } catch {
        Write-Host "    NSSM download failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "    Download manually from https://nssm.cc and place nssm.exe at C:\nssm\nssm.exe" -ForegroundColor Yellow
        exit 1
    }
}

# Register NestJS as a service
$svcName = "OVDS-Backend"
$existingSvc = Get-Service -Name $svcName -ErrorAction SilentlyContinue

if ($existingSvc) {
    Write-Host "    Service '$svcName' already exists. Updating..." -ForegroundColor Gray
    & $nssmPath stop $svcName 2>$null
    & $nssmPath remove $svcName confirm 2>$null
}

& $nssmPath install $svcName $nodePath "$nestMain"
& $nssmPath set $svcName AppDirectory $nestAppDir
& $nssmPath set $svcName AppEnvironmentExtra "NODE_ENV=production"
& $nssmPath set $svcName DisplayName "OVDS Backend (NestJS)"
& $nssmPath set $svcName Description "OVDS ovds Platform - NestJS API Server"
& $nssmPath set $svcName Start SERVICE_AUTO_START
& $nssmPath set $svcName AppStdout "$nestAppDir\logs\backend-stdout.log"
& $nssmPath set $svcName AppStderr "$nestAppDir\logs\backend-stderr.log"
& $nssmPath set $svcName AppRotateFiles 1
& $nssmPath set $svcName AppRotateBytes 10485760

# Create logs directory
New-Item -ItemType Directory -Path "$nestAppDir\logs" -Force | Out-Null

# Start the service
& $nssmPath start $svcName
Start-Sleep -Seconds 3

$svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -eq "Running") {
    Write-Host "    '$svcName' service is running" -ForegroundColor Green
} else {
    Write-Host "    '$svcName' service failed to start" -ForegroundColor Red
    Write-Host "    Check logs at: $nestAppDir\logs\backend-stderr.log" -ForegroundColor Yellow
}

# --- 5. Summary ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Service Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services registered:" -ForegroundColor White
Write-Host "  Apache2.4    - Web server (auto-start)" -ForegroundColor Green
Write-Host "  OVDS-Backend - NestJS API  (auto-start)" -ForegroundColor Green
Write-Host ""
Write-Host "Manage services:" -ForegroundColor White
Write-Host "  Start  : Start-Service Apache2.4; Start-Service OVDS-Backend" -ForegroundColor Gray
Write-Host "  Stop   : Stop-Service Apache2.4; Stop-Service OVDS-Backend" -ForegroundColor Gray
Write-Host "  Status : Get-Service Apache2.4, OVDS-Backend" -ForegroundColor Gray
Write-Host ""
Write-Host "Backend logs: $nestAppDir\logs\" -ForegroundColor Gray
Write-Host "Apache logs : C:\xampp\apache\logs\" -ForegroundColor Gray
Write-Host ""
