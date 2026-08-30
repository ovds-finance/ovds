# Security Dashboard Data Generator (Windows)
# Generates JSON data for the security metrics dashboard
#
# Usage:
#   .\scripts\generate-dashboard-data.ps1 [-Output .\security-reports\dashboard-data.json]

param(
    [Parameter(Mandatory=$false)]
    [string]$Output = ".\security-reports\dashboard-data.json"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Security Dashboard Data Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create output directory
$outputDir = Split-Path -Parent $Output
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Collect data from various sources
$scanDir = "security-reports"
$zapDir = ".zap"

# Count findings from ZAP reports
$critical = 0
$high = 0
$medium = 0
$low = 0
$info = 0

if (Test-Path $scanDir) {
    $reports = Get-ChildItem -Path $scanDir -Filter "zap-*.html" -ErrorAction SilentlyContinue
    foreach ($report in $reports) {
        $content = Get-Content -Path $report.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $critical += ([regex]::Matches($content, 'risk-Critical')).Count
            $high += ([regex]::Matches($content, 'risk-High')).Count
            $medium += ([regex]::Matches($content, 'risk-Medium')).Count
            $low += ([regex]::Matches($content, 'risk-Low')).Count
            $info += ([regex]::Matches($content, 'risk-Informational')).Count
        }
    }
}

# Calculate security score
$total = $critical + $high + $medium + $low + $info
if ($total -gt 0) {
    $securityScore = [Math]::Max(0, 100 - ($critical * 20 + $high * 10 + $medium * 5 + $low * 2))
} else {
    $securityScore = 100
}

# Count total scans
$totalScans = 0
if (Test-Path $scanDir) {
    $totalScans = (Get-ChildItem -Path $scanDir -Filter "zap-*.html" -ErrorAction SilentlyContinue | Measure-Object).Count
}

# Determine gate statuses
$gate1Status = "pending"
$gate2Status = "pending"
$gate3Status = "pending"
$gate4Status = "pending"

if ((Test-Path "$zapDir\contexts\ovds.context") -and (Test-Path "$zapDir\policies\ovds-scan.policy")) {
    $gate1Status = "passed"
}

if (Test-Path ".github\workflows\zap-security-scan.yml") {
    $gate2Status = "passed"
}

if ($totalScans -gt 0) {
    $gate3Status = "passed"
}

if (Test-Path "scripts\remediation-register.md") {
    $gate4Status = "passed"
}

# Generate recent findings (placeholder)
$recentFindings = @()

# Generate scan history
$scanHistory = @()
if (Test-Path $scanDir) {
    $reports = Get-ChildItem -Path $scanDir -Filter "zap-*.html" -ErrorAction SilentlyContinue | Select-Object -First 10
    foreach ($report in $reports) {
        $scanType = $report.BaseName -replace 'zap-', '' -replace '-\d+', ''
        $scanHistory += @{
            date = $report.LastWriteTime.ToString("yyyy-MM-ddTHH:mm:ssZ")
            type = $scanType
            findings = 0
            duration = "N/A"
            status = "success"
        }
    }
}

# Create report object
$report = @{
    lastUpdated = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    findings = @{
        critical = $critical
        high = $high
        medium = $medium
        low = $low
        info = $info
    }
    securityScore = $securityScore
    totalScans = $totalScans
    gates = @{
        gate1 = @{ status = $gate1Status; description = "Setup & Authorization" }
        gate2 = @{ status = $gate2Status; description = "Build & Deploy" }
        gate3 = @{ status = $gate3Status; description = "ZAP Scan" }
        gate4 = @{ status = $gate4Status; description = "Retest & Sign-off" }
    }
    recentFindings = $recentFindings
    scanHistory = $scanHistory
} | ConvertTo-Json -Depth 3

$report | Out-File -FilePath $Output -Encoding UTF8

Write-Host "Dashboard data generated: $Output" -ForegroundColor Green
Write-Host ""
Write-Host "Findings summary:"
Write-Host "  Critical: $critical"
Write-Host "  High:     $high"
Write-Host "  Medium:   $medium"
Write-Host "  Low:      $low"
Write-Host "  Info:     $info"
Write-Host ""
Write-Host "Security Score: $securityScore%"
Write-Host ""
Write-Host "To view the dashboard, open docs/security-dashboard.html in a browser."
