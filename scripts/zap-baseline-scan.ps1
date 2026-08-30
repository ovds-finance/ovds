# OWASP ZAP baseline scan for OVDS staging/preprod (Windows PowerShell)
# Usage: .\scripts\zap-baseline-scan.ps1 -Target https://staging.example.com

param(
  [Parameter(Mandatory = $true)]
  [string]$Target,
  [string]$Report = "zap-baseline-report.html"
)

Write-Host "Running OWASP ZAP baseline scan against: $Target"
Write-Host "Report will be written to: $Report"

docker run --rm -v "${PWD}:/zap/wrk:rw" `
  ghcr.io/zaproxy/zaproxy:stable `
  zap-baseline.py `
  -t $Target `
  -r $Report `
  -J zap-baseline-report.json `
  -I

Write-Host "Scan complete. Open $Report for results."
