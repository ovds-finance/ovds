# OVDS Security Testing Runner (Windows)
# Orchestrates the complete security testing workflow:
#   1. Starts the security testing stack
#   2. Runs ZAP scans
#   3. Generates reports
#   4. Cleans up
#
# Usage:
#   .\scripts\security-test-runner.ps1 -ScanType baseline
#   .\scripts\security-test-runner.ps1 -ScanType full
#   .\scripts\security-test-runner.ps1 -ScanType api
#   .\scripts\security-test-runner.ps1 -ScanType all

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("baseline", "full", "api", "all")]
    [string]$ScanType = "baseline",

    [Parameter(Mandatory=$false)]
    [string]$TargetUrl = "http://localhost:3000",

    [Parameter(Mandatory=$false)]
    [string]$ApiDefinition = "http://localhost:3001/api/openapi.json",

    [Parameter(Mandatory=$false)]
    [string]$ReportDir = ".\security-reports"
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS Security Testing Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Scan Type:  $ScanType"
Write-Host "Target:     $TargetUrl"
Write-Host "API Def:    $ApiDefinition"
Write-Host "Reports:    $ReportDir"
Write-Host ""

# Create report directory
if (!(Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}

# Cleanup handler
$cleanup = {
    Write-Host ""
    Write-Host "Cleaning up..." -ForegroundColor Yellow
    docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml down -v 2>$null || true
}
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $cleanup | Out-Null
trap { $cleanup.Invoke() }

# Start application stack
Write-Host "Starting application stack..." -ForegroundColor Yellow
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d mysql

# Wait for MySQL
Write-Host "Waiting for MySQL..."
Start-Sleep -Seconds 10

# Run migrations
Write-Host "Running database migrations..."
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml exec -T backend npm run db:migrate:prod -w @ovds/database 2>$null || Write-Host "Migration may already be up to date"

# Seed demo data
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml exec -T backend npm run seed:demo -w @ovds/database 2>$null || Write-Host "Seeding skipped or already done"

# Start backend
Write-Host "Starting backend..."
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d backend

# Wait for backend
Write-Host "Waiting for backend to be healthy..."
$backendHealthy = $false
$backendHealthUrl = $TargetUrl -replace ":3000", ":3001"
for ($i = 1; $i -le 60; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$backendHealthUrl/health/live" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Backend is healthy at $backendHealthUrl" -ForegroundColor Green
            $backendHealthy = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 5
}

if (-not $backendHealthy) {
    Write-Host "ERROR: Backend failed to become healthy at $backendHealthUrl/health/live" -ForegroundColor Red
    exit 1
}

# Wait for ZAP
Write-Host "Waiting for ZAP to be ready..."
$zapReady = $false
$zapApiKey = $env:ZAP_API_KEY ?? "ovds-zap-secret"
for ($i = 1; $i -le 60; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8080/JSON/core/view/version/?apikey=$zapApiKey" -Method Get -TimeoutSec 5
        if ($response) {
            Write-Host "✓ ZAP is ready" -ForegroundColor Green
            $zapReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 3
}

if (-not $zapReady) {
    Write-Host "ERROR: ZAP failed to start" -ForegroundColor Red
    exit 1
}

# Run scans
switch ($ScanType) {
    "baseline" {
        Write-Host ""
        Write-Host "Running Baseline Scan..." -ForegroundColor Yellow
        $reportFile = "zap-baseline-${timestamp}.html"
        $jsonFile = "zap-baseline-${timestamp}.json"
        docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml exec -T zap `
            zap-baseline.py `
            -t $TargetUrl `
            -r "/zap/wrk/reports/$reportFile" `
            -J "/zap/wrk/reports/$jsonFile" `
            -I `
            --max_children 5 `
            --max_depth 10 `
            --max_scan_time 30m `
            -j `
            --auto 2>&1 | Write-Host
    }
    "full" {
        Write-Host ""
        Write-Host "Running Full Scan..." -ForegroundColor Yellow
        $reportFile = "zap-full-${timestamp}.html"
        docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml exec -T zap `
            zap-full-scan.py `
            -t $TargetUrl `
            -r "/zap/wrk/reports/$reportFile" `
            --max_children 5 `
            --max_depth 10 `
            --max_scan_time 60m `
            -j `
            --auto 2>&1 | Write-Host
    }
    "api" {
        Write-Host ""
        Write-Host "Running API Scan..." -ForegroundColor Yellow
        $reportFile = "zap-api-${timestamp}.html"
        docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml exec -T zap `
            zap-api-scan.py `
            -t $ApiDefinition `
            -f openapi `
            -r "/zap/wrk/reports/$reportFile" `
            --max_children 5 `
            --max_depth 10 `
            --max_scan_time 60m `
            -j `
            --auto 2>&1 | Write-Host
    }
    "all" {
        Write-Host ""
        Write-Host "Running All Scans..." -ForegroundColor Yellow

        Write-Host "  [1/5] Baseline Scan..." -ForegroundColor Cyan
        $reportFile = "zap-baseline-${timestamp}.html"
        docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml exec -T zap `
            zap-baseline.py `
            -t $TargetUrl `
            -r "/zap/wrk/reports/$reportFile" `
            -I `
            --max_children 5 `
            --max_depth 10 `
            --max_scan_time 30m `
            -j `
            --auto 2>&1 | Write-Host

        Write-Host "  [2/5] Full Scan..." -ForegroundColor Cyan
        $reportFile = "zap-full-${timestamp}.html"
        docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml exec -T zap `
            zap-full-scan.py `
            -t $TargetUrl `
            -r "/zap/wrk/reports/$reportFile" `
            --max_children 5 `
            --max_depth 10 `
            --max_scan_time 60m `
            -j `
            --auto 2>&1 | Write-Host

        Write-Host "  [3/5] API Scan..." -ForegroundColor Cyan
        $reportFile = "zap-api-${timestamp}.html"
        docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml exec -T zap `
            zap-api-scan.py `
            -t $ApiDefinition `
            -f openapi `
            -r "/zap/wrk/reports/$reportFile" `
            --max_children 5 `
            --max_depth 10 `
            --max_scan_time 60m `
            -j `
            --auto 2>&1 | Write-Host

        Write-Host "  [4/5] Authenticated Scan..." -ForegroundColor Cyan
        $authReport = "zap-authenticated-${timestamp}.html"
        docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml exec -T zap `
            zap.sh -cmd -autorun /zap/ovds-authenticated-scan.yaml 2>&1 | Write-Host

        Write-Host "  [5/5] Phase 6 Manual Tests..." -ForegroundColor Cyan
        $backendUrl = "http://localhost:3001"
        & pwsh -File (Join-Path $PSScriptRoot "zap-test-manual-all.ps1") -BackendUrl $backendUrl
    }
}

# Copy reports
Write-Host ""
Write-Host "Copying reports to $ReportDir..." -ForegroundColor Yellow
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml cp zap:/zap/wrk/reports/. $ReportDir 2>$null || Write-Host "No reports to copy"

# Aggregate status snapshot
& node "$PSScriptRoot\security-status-snapshot.mjs" --reports-dir $ReportDir 2>$null || Write-Host "Snapshot generation failed"

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Security Testing Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Duration: $((Get-Date) - $startTime)"
Write-Host "Reports:  $ReportDir"

if (Test-Path $ReportDir) {
    $files = Get-ChildItem -Path $ReportDir -File
    Write-Host "Files:    $($files.Count)"
    $files | ForEach-Object { Write-Host "  - $($_.Name) ($($_.Length) bytes)" }
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Review HTML reports in $ReportDir"
Write-Host "  2. Validate findings (eliminate false positives)"
Write-Host "  3. Update remediation register"
Write-Host "  4. Create tasks for confirmed vulnerabilities"
