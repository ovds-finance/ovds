#!/usr/bin/env pwsh
# OVDS Phase 6 — Master Manual Test Runner
# Runs all Phase 6 mandatory manual tests in sequence.
#
# Usage:
#   pwsh -File scripts/zap-test-manual-all.ps1
#   pwsh -File scripts/zap-test-manual-all.ps1 -BackendUrl http://localhost:3001

param([string]$BackendUrl = "http://localhost:3001", [string]$ReportsDir = ".\security-reports")

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSCommandPath

if (!(Test-Path $ReportsDir)) { New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null }

$suites = @(
    @{ Name = "Authentication";          Script = "zap-test-authentication.ps1" },
    @{ Name = "Authorization (IDOR)";    Script = "zap-test-authorization.ps1" },
    @{ Name = "Session Management";      Script = "zap-test-session.ps1" },
    @{ Name = "Input Validation";        Script = "zap-test-input-validation.ps1" },
    @{ Name = "File Upload / Errors / Business Logic"; Script = "zap-test-misc.ps1" },
    @{ Name = "Rate Limiting";           Script = "zap-test-rate-limit.ps1" }
)

$globalPass = 0
$globalFail = 0
$suiteResults = @()
$allResults = @()

Write-Host "========================================"
Write-Host "  OVDS Phase 6 — Master Manual Suite"
Write-Host "========================================"
Write-Host "Backend:    $BackendUrl"
Write-Host "Reports:    $ReportsDir"
Write-Host "Suites:     $($suites.Count)"
Write-Host ""

foreach ($suite in $suites) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Suite: $($suite.Name)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $jsonOut = Join-Path $ReportsDir ("phase6-" + ($suite.Script -replace '\.ps1$','') + ".json")
    & pwsh -File (Join-Path $root $suite.Script) -BackendUrl $BackendUrl -JsonReport -ReportPath $jsonOut *>$null

    # Parse the JSON the suite wrote
    if (Test-Path $jsonOut) {
        try {
            $data = Get-Content -LiteralPath $jsonOut -Raw | ConvertFrom-Json
            $allResults += $data
            $suitePass = ($data | Where-Object { $_.result -eq "PASS" }).Count
            $suiteFail = ($data | Where-Object { $_.result -eq "FAIL" }).Count
            $code = if ($suiteFail -eq 0) { 0 } else { 1 }
        } catch {
            $code = $LASTEXITCODE
        }
    } else {
        # Suite doesn't write JSON; fall back to exit code
        & pwsh -File (Join-Path $root $suite.Script) -BackendUrl $BackendUrl
        $code = $LASTEXITCODE
    }

    $globalPass += if ($code -eq 0) { 1 } else { 0 }
    $globalFail += if ($code -ne 0) { 1 } else { 0 }
    $suiteResults += [PSCustomObject]@{
        suite = $suite.Name
        result = if ($code -eq 0) { "PASS" } else { "FAIL" }
        exitCode = $code
    }
}

# Combined JSON
$combinedPath = Join-Path $ReportsDir "phase6-manual-tests.json"
@{ suite = "phase6"; generatedAt = (Get-Date -Format o); results = $allResults; suites = $suiteResults } |
    ConvertTo-Json -Depth 5 | Out-File -FilePath $combinedPath -Encoding utf8

Write-Host ""
Write-Host "========================================"
Write-Host "  Phase 6 — Final Summary"
Write-Host "========================================"
foreach ($r in $suiteResults) {
    $color = if ($r.result -eq "PASS") { "Green" } else { "Red" }
    $sym = if ($r.result -eq "PASS") { "✓" } else { "✗" }
    Write-Host "  $sym $($r.suite) — $($r.result)" -ForegroundColor $color
}
Write-Host ""
Write-Host "Suites passed: $globalPass"
Write-Host "Suites failed: $globalFail"
Write-Host "Combined JSON: $combinedPath"
Write-Host ""

if ($globalFail -gt 0) { exit 1 } else { exit 0 }