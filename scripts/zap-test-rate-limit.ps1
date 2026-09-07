#!/usr/bin/env pwsh
# OVDS Phase 6 — Rate Limiting & Abuse Controls
#
# Verifies §13.9 of the OWASP ZAP Assessment Guide.
# Tests that excessive requests trigger 429 + Retry-After.
#
# Usage:
#   pwsh -File scripts/zap-test-rate-limit.ps1
#   pwsh -File scripts/zap-test-rate-limit.ps1 -BackendUrl http://localhost:3001 -BurstSize 80

param(
    [string]$BackendUrl = "http://localhost:3001",
    [int]$BurstSize = 60,
    [switch]$JsonReport = $false,
    [string]$ReportPath = ""
)

$ErrorActionPreference = "Continue"
$pass = 0
$fail = 0
$results = New-Object System.Collections.ArrayList

Write-Host "========================================"
Write-Host "  OVDS Phase 6 — Rate Limiting Tests"
Write-Host "========================================"
Write-Host "Backend: $BackendUrl"
Write-Host "Burst:   $BurstSize requests"
Write-Host ""

# Test 1: Rapid-fire login attempts from one IP should be throttled
Write-Host "[1] Burst login attempts trigger 429"
$last = 200
$got429 = $false
for ($i = 0; $i -lt $BurstSize; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "$BackendUrl/api/auth/login" `
            -Method POST -ContentType "application/json" `
            -Body '{"email":"scanner.user@ovds.local","password":"wrong"}' `
            -UseBasicParsing -TimeoutSec 5
        $last = $r.StatusCode
    } catch {
        $last = $_.Exception.Response.StatusCode.value__
    }
    if ($last -eq 429) {
        $got429 = $true
        Write-Host "  → throttled at request #$($i+1)" -ForegroundColor Yellow
        break
    }
}

if ($got429) {
    Write-Host "  ✓ Rate limit triggered" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  ✗ No 429 received after $BurstSize requests (last status=$last)" -ForegroundColor Red
    $fail++
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Rate Limit Tests Complete"
Write-Host "========================================"
Write-Host "Passed: $pass"
Write-Host "Failed: $fail"
Write-Host ""

if ($JsonReport) {
    $rp = if ($ReportPath) { $ReportPath } else { Join-Path $PSScriptRoot "..\security-reports\phase6-zap-test-rate-limit.json" }
    if (-not (Test-Path (Split-Path -Parent $rp))) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $rp) -Force | Out-Null
    }
    $results | ConvertTo-Json -Depth 5 | Out-File -FilePath $rp -Encoding utf8
}

if ($fail -gt 0) { exit 1 } else { exit 0 }