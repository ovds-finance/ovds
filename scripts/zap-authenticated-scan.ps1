# ZAP Authenticated Scan Script for OVDS
# Performs spider + active scanning with JWT authentication
# Suitable for: security testing environments, pre-release assessments
#
# Usage:
#   .\scripts\zap-authenticated-scan.ps1 -TargetFrontend "http://localhost:3000" -TargetBackend "http://localhost:3001" -ReportPath ".\zap-authenticated-report.html"
#
# WARNING: Active scanning sends attack payloads. Only run in approved test environments.
# Prerequisites:
#   - Docker Desktop installed and running
#   - Target application running in staging/security-test environment
#   - Database backup completed
#   - Test accounts configured in .zap/users/test-users.json

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetFrontend,

    [Parameter(Mandatory=$true)]
    [string]$TargetBackend,

    [Parameter(Mandatory=$false)]
    [string]$ReportPath = "$(Resolve-Path .)\zap-authenticated-report.html",

    [Parameter(Mandatory=$false)]
    [string]$ZapImage = "ghcr.io/zaproxy/zaproxy:stable",

    [Parameter(Mandatory=$false)]
    [int]$TimeoutMinutes = 60,

    [Parameter(Mandatory=$false)]
    [switch]$FailOnRisk = $true
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

Write-Host "========================================" -ForegroundColor Red
Write-Host "  OWASP ZAP Authenticated Scan (ACTIVE)" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host "Frontend: $TargetFrontend"
Write-Host "Backend:  $TargetBackend"
Write-Host "Report:   $ReportPath"
Write-Host "Image:    $ZapImage"
Write-Host "Timeout:  $TimeoutMinutes minutes"
Write-Host ""
Write-Host "WARNING: Active scanning sends attack payloads." -ForegroundColor Red
Write-Host "Ensure you have authorization and a backup before proceeding." -ForegroundColor Red
Write-Host ""

# Safety confirmation
if (!$Confirm) {
    $confirmation = Read-Host "Have you taken a backup and confirmed authorization? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Host "Aborted. Please complete prerequisites before running active scans." -ForegroundColor Red
        exit 1
    }
}

# Validate Docker
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not available." -ForegroundColor Red
    exit 1
}

# Create report directory
$reportDir = Split-Path -Parent $ReportPath
if (!(Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

# Update automation config with actual targets
$automationConfig = Join-Path $PWD ".zap\automation\ovds-authenticated-scan.yaml"
$automationContent = Get-Content $automationConfig -Raw
$automationContent = $automationContent -replace 'http://localhost:3000', $TargetFrontend.TrimEnd('/')
$automationContent = $automationContent -replace 'http://localhost:3001', $TargetBackend.TrimEnd('/')

$tempConfig = Join-Path $env:TEMP "ovds-zap-config.yaml"
Set-Content -Path $tempConfig -Value $automationContent -Encoding UTF8

Write-Host ""
Write-Host "Running ZAP Authenticated Scan..." -ForegroundColor Yellow
Write-Host "This will crawl the application and perform active vulnerability scanning with authentication." -ForegroundColor Yellow
Write-Host ""

$dockerArgs = @(
    "run", "--rm",
    "-v", "${PWD}:/zap/wrk/:rw",
    "-v", "${tempConfig}:/zap/ovds-authenticated-scan.yaml:ro",
    "-t", $ZapImage,
    "zap.sh", "-cmd", "-autorun", "/zap/ovds-authenticated-scan.yaml",
    "-config", "connection.timeoutInSecs=$($TimeoutMinutes * 60)"
)

$output = docker @dockerArgs 2>&1
$exitCode = $LASTEXITCODE

# Save output
$output | Out-File -FilePath "$ReportPath.log" -Encoding utf8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Scan Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Duration: $((Get-Date) - $startTime)"
Write-Host "Exit Code: $exitCode"
Write-Host "Report: $ReportPath"
Write-Host "Log: $ReportPath.log"
Write-Host ""

# Parse alerts
$alertPattern = '(\d+)\s+(Low|Medium|High|Informational)\s+alerts?'
$alertCounts = @{}

foreach ($line in $output) {
    if ($line -match $alertPattern) {
        $count = [int]$Matches[1]
        $risk = $Matches[2]
        $alertCounts[$risk] = $count
    }
}

if ($alertCounts.Count -gt 0) {
    Write-Host "Alert Summary:" -ForegroundColor Yellow
    foreach ($risk in @("High", "Medium", "Low", "Informational")) {
        if ($alertCounts.ContainsKey($risk)) {
            $color = switch ($risk) {
                "High" { "Red" }
                "Medium" { "Yellow" }
                "Low" { "DarkYellow" }
                default { "Gray" }
            }
            Write-Host "  $risk : $($alertCounts[$risk])" -ForegroundColor $color
        }
    }
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "  1. Review the HTML report: $ReportPath"
    Write-Host "  2. Validate each finding (eliminate false positives)"
    Write-Host "  3. Create remediation tasks for confirmed vulnerabilities"
    Write-Host "  4. Retest after fixes are deployed"
    Write-Host ""
}

# Exit status
if ($exitCode -eq 0) {
    Write-Host "SUCCESS: No significant issues found." -ForegroundColor Green
    exit 0
} elseif ($exitCode -le 2) {
    Write-Host "WARNING: Low/Medium risk issues found. Review required." -ForegroundColor Yellow
    if ($FailOnRisk) { exit $exitCode }
    exit 0
} else {
    Write-Host "FAILURE: High-risk or critical issues found." -ForegroundColor Red
    exit $exitCode
}
