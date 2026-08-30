# ZAP API Scan Script for OVDS
# Performs API security testing against OpenAPI/Swagger definitions
# Suitable for: CI/CD pipelines, API security assessments, pre-release checks
#
# Usage:
#   .\scripts\zap-api-scan.ps1 -ApiDefinition "http://localhost:3001/api/openapi.json" -ReportPath ".\zap-api-report.html"
#
# Prerequisites:
#   - Docker Desktop installed and running
#   - OpenAPI/Swagger definition available
#   - Target API running in test environment

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiDefinition,

    [Parameter(Mandatory=$false)]
    [string]$ReportPath = "$(Resolve-Path .)\zap-api-report.html",

    [Parameter(Mandatory=$false)]
    [string]$ZapImage = "ghcr.io/zaproxy/zaproxy:stable",

    [Parameter(Mandatory=$false)]
    [int]$TimeoutMinutes = 60,

    [Parameter(Mandatory=$false)]
    [switch]$FailOnRisk = $true
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OWASP ZAP API Scan" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Def:   $ApiDefinition"
Write-Host "Report:    $ReportPath"
Write-Host "Image:     $ZapImage"
Write-Host "Timeout:   $TimeoutMinutes minutes"
Write-Host ""

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

Write-Host ""
Write-Host "Starting ZAP API Scan..." -ForegroundColor Yellow
Write-Host "This will import the API definition and perform active vulnerability scanning." -ForegroundColor Yellow
Write-Host ""

$dockerArgs = @(
    "run", "--rm",
    "-v", "${PWD}:/zap/wrk/:rw",
    "-v", "${PWD}\.zap\automation\ovds-api-scan.yaml:/zap/ovds-api-scan.yaml:ro",
    "-t", $ZapImage,
    "zap.sh", "-cmd", "-autorun", "/zap/ovds-api-scan.yaml",
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
}

# Determine exit status
if ($exitCode -eq 0) {
    Write-Host "SUCCESS: No significant issues found." -ForegroundColor Green
    exit 0
} elseif ($exitCode -eq 1) {
    Write-Host "WARNING: Low-risk issues found. Review the report." -ForegroundColor Yellow
    if ($FailOnRisk) { exit 1 }
    exit 0
} elseif ($exitCode -eq 2) {
    Write-Host "WARNING: Medium-risk issues found. Review the report." -ForegroundColor Yellow
    if ($FailOnRisk) { exit 2 }
    exit 0
} else {
    Write-Host "FAILURE: High-risk or critical issues found, or scan failed." -ForegroundColor Red
    exit $exitCode
}
