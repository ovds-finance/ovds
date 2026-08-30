# ZAP Baseline Scan Script for CI/CD
# Performs passive scanning and crawling without active attack payloads
# Suitable for: every merge, nightly scans, pre-deployment checks
#
# Usage:
#   .\scripts\zap-baseline.ps1 -TargetUrl "http://localhost:3000" -ReportPath ".\zap-baseline-report.html"
#
# Prerequisites:
#   - Docker Desktop installed and running
#   - Target application running and accessible

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetUrl,

    [Parameter(Mandatory=$false)]
    [string]$ReportPath = "$(Resolve-Path .)\zap-baseline-report.html",

    [Parameter(Mandatory=$false)]
    [string]$ZapImage = "ghcr.io/zaproxy/zaproxy:stable",

    [Parameter(Mandatory=$false)]
    [int]$TimeoutMinutes = 30,

    [Parameter(Mandatory=$false)]
    [switch]$FailOnRisk = $false
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OWASP ZAP Baseline Scan" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target:  $TargetUrl"
Write-Host "Report:  $ReportPath"
Write-Host "Image:   $ZapImage"
Write-Host "Timeout: $TimeoutMinutes minutes"
Write-Host ""

# Validate Docker is available
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not available. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Validate target URL
if (-not ($TargetUrl -match '^https?://')) {
    Write-Host "ERROR: TargetUrl must start with http:// or https://" -ForegroundColor Red
    exit 1
}

# Create report directory if needed
$reportDir = Split-Path -Parent $ReportPath
if (!(Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

# Ensure target URL has no trailing slash
$TargetUrl = $TargetUrl.TrimEnd('/')

Write-Host ""
Write-Host "Starting ZAP baseline scan..." -ForegroundColor Yellow
Write-Host "This will crawl the application and perform passive scanning." -ForegroundColor Yellow
Write-Host ""

$dockerArgs = @(
    "run", "--rm",
    "-v", "${PWD}:/zap/wrk/:rw",
    "-t", $ZapImage,
    "zap-baseline.py",
    "-t", $TargetUrl,
    "-r", (Split-Path -Leaf $ReportPath),
    "-J", (Split-Path -Leaf $ReportPath).Replace('.html', '.json'),
    "-I",
    "--max_children", "5",
    "--max_depth", "10",
    "--max_scan_time", "$($TimeoutMinutes)m",
    "-j",
    "--auto"
)

if ($FailOnRisk) {
    $dockerArgs += "-d"
}

$output = docker @dockerArgs 2>&1
$exitCode = $LASTEXITCODE

# Save raw output
$output | Out-File -FilePath "$ReportPath.log" -Encoding utf8

# Display summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Scan Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Duration: $((Get-Date) - $startTime)"
Write-Host "Exit Code: $exitCode"
Write-Host "Report: $ReportPath"
Write-Host "Log: $ReportPath.log"
Write-Host ""

# Parse and display alert counts
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
