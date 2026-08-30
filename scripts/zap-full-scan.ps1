# ZAP Full Scan Script for Security Assessments
# Performs crawling + active scanning with attack payloads
# Suitable for: dedicated security environments, pre-release assessments
#
# Usage:
#   .\scripts\zap-full-scan.ps1 -TargetUrl "http://staging.example.com" -ReportPath ".\zap-full-scan-report.html"
#
# WARNING: Active scanning sends attack payloads. Only run in approved test environments.
# Prerequisites:
#   - Docker Desktop installed and running
#   - Target application in staging/security-test environment
#   - Database backup completed
#   - Test accounts available

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetUrl,

    [Parameter(Mandatory=$false)]
    [string]$ReportPath = "$(Resolve-Path .)\zap-full-scan-report.html",

    [Parameter(Mandatory=$false)]
    [string]$ZapImage = "ghcr.io/zaproxy/zaproxy:stable",

    [Parameter(Mandatory=$false)]
    [int]$TimeoutMinutes = 60,

    [Parameter(Mandatory=$false)]
    [switch]$FailOnRisk = $true,

    [Parameter(Mandatory=$false)]
    [string]$ApiDefinition = ""
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

Write-Host "========================================" -ForegroundColor Red
Write-Host "  OWASP ZAP Full Scan (ACTIVE)" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host "Target:    $TargetUrl"
Write-Host "Report:    $ReportPath"
Write-Host "Image:     $ZapImage"
Write-Host "Timeout:   $TimeoutMinutes minutes"
Write-Host "API Def:   $(if ($ApiDefinition) { $ApiDefinition } else { 'None' })"
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

# Validate target URL
if (-not ($TargetUrl -match '^https?://')) {
    Write-Host "ERROR: TargetUrl must start with http:// or https://" -ForegroundColor Red
    exit 1
}

# Create report directory
$reportDir = Split-Path -Parent $ReportPath
if (!(Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$TargetUrl = $TargetUrl.TrimEnd('/')

$isApiScan = ![string]::IsNullOrEmpty($ApiDefinition)

if ($isApiScan) {
    Write-Host ""
    Write-Host "Running ZAP API Scan..." -ForegroundColor Yellow
    $dockerArgs = @(
        "run", "--rm",
        "-v", "${PWD}:/zap/wrk/:rw",
        "-v", "${PWD}\.zap\automation\ovds-api-scan.yaml:/zap/ovds-api-scan.yaml:ro",
        "-t", $ZapImage,
        "zap.sh", "-cmd", "-autorun", "/zap/ovds-api-scan.yaml",
        "-config", "connection.timeoutInSecs=$($TimeoutMinutes * 60)"
    )
} else {
    Write-Host ""
    Write-Host "Running ZAP Full Scan..." -ForegroundColor Yellow
    Write-Host "This will crawl the application and perform active vulnerability scanning." -ForegroundColor Yellow
    $dockerArgs = @(
        "run", "--rm",
        "-v", "${PWD}:/zap/wrk/:rw",
        "-t", $ZapImage,
        "zap-full-scan.py",
        "-t", $TargetUrl,
        "-r", (Split-Path -Leaf $ReportPath),
        "--max_children", "5",
        "--max_depth", "10",
        "--max_scan_time", "$($TimeoutMinutes)m",
        "-j",
        "--auto"
    )
}

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
