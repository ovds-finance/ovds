#!/usr/bin/env pwsh
# OVDS Comprehensive Security Test Runner
# Runs all security-related unit and E2E tests
#
# Usage:
#   .\scripts\run-security-tests.ps1
#   .\scripts\run-security-tests.ps1 -UnitOnly
#   .\scripts\run-security-tests.ps1 -E2EOnly
#   .\scripts\run-security-tests.ps1 -Coverage
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed

param(
    [switch]$UnitOnly,
    [switch]$E2EOnly,
    [switch]$Coverage,
    [switch]$FailFast,
    [int]$Timeout = 120
)

$ErrorActionPreference = "Stop"
$testDir = Join-Path $PSScriptRoot "..\apps\backend"
$backendDir = Join-Path $PSScriptRoot "..\apps\backend"
$projectRoot = Join-Path $PSScriptRoot ".."
$startTime = Get-Date

$unitTests = @(
    "src\auth\csrf.guard.spec.ts",
    "src\auth\jwt-rotation.spec.ts",
    "src\auth\auth.service.spec.ts",
    "src\common\security-validation.service.spec.ts",
    "src\common\url-validation.service.spec.ts",
    "src\tax\vat.service.spec.ts",
    "src\treasury\lease.service.spec.ts",
    "src\ifrs\ifrs16-modification.service.spec.ts"
)

$e2eTests = @(
    "test\security-headers.e2e-spec.ts",
    "test\rate-limiting.e2e-spec.ts",
    "test\account-lockout.e2e-spec.ts",
    "test\input-sanitization.e2e-spec.ts",
    "test\sensitive-data-leakage.e2e-spec.ts",
    "test\concurrent-sessions.e2e-spec.ts",
    "test\security-monitoring.e2e-spec.ts",
    "test\cors-configuration.e2e-spec.ts",
    "test\token-blacklist.e2e-spec.ts",
    "test\password-complexity.e2e-spec.ts",
    "test\mfa-enforcement.e2e-spec.ts",
    "test\rbac-escalation.e2e-spec.ts",
    "test\audit-log.e2e-spec.ts",
    "test\https-enforcement.e2e-spec.ts",
    "test\cookie-security.e2e-spec.ts",
    "test\jwt-expiration.e2e-spec.ts",
    "test\clickjacking-protection.e2e-spec.ts",
    "test\business-logic.e2e-spec.ts"
)

$totalPassed = 0
$totalFailed = 0
$failedTests = @()

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS Security Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Project:   $projectRoot"
Write-Host "Backend:   $backendDir"
Write-Host "Started:   $startTime"
Write-Host ""

# Ensure Prisma client is generated
Write-Host "[Setup] Generating Prisma client..." -ForegroundColor Yellow
Push-Location $backendDir
try {
    npx prisma generate 2>&1 | Out-Null
    Write-Host "[Setup] Prisma client generated" -ForegroundColor Green
} catch {
    Write-Host "[Setup] Warning: Prisma generate failed: $_" -ForegroundColor Yellow
}
Pop-Location

function Run-TestSuite {
    param(
        [string]$TestType,
        [string[]]$Tests,
        [string]$Pattern
    )

    Write-Host ""
    Write-Host "========================================" -ForegroundColor $(if ($TestType -eq "Unit") { "Blue" } else { "Magenta" })
    Write-Host "  $TestType Tests" -ForegroundColor $(if ($TestType -eq "Unit") { "Blue" } else { "Magenta" })
    Write-Host "========================================" -ForegroundColor $(if ($TestType -eq "Unit") { "Blue" } else { "Magenta" })
    Write-Host ""

    $suitePassed = 0
    $suiteFailed = 0
    $suiteStart = Get-Date

    foreach ($test in $Tests) {
        $testPath = Join-Path $backendDir $test
        if (-not (Test-Path $testPath)) {
            Write-Host "[SKIP] $test - File not found" -ForegroundColor DarkGray
            continue
        }

        $testName = Split-Path $test -Leaf
        Write-Host "[RUN] $testName" -ForegroundColor Cyan -NoNewline

        $args = @("run", "vitest", "run", $test)
        if ($Coverage) {
            $args += "--coverage"
        }
        if ($FailFast) {
            $args += "--bail=1"
        }

        $output = & npx @args 2>&1
        $exitCode = $LASTEXITCODE

        if ($exitCode -eq 0) {
            $passed = [regex]::Match($output, "(\d+)\s+passed").Groups[1].Value
            $suitePassed += [int]$passed
            Write-Host " - PASSED ($passed tests)" -ForegroundColor Green
        } else {
            $failed = [regex]::Match($output, "(\d+)\s+failed").Groups[1].Value
            $suiteFailed += [int]$failed
            $script:totalFailed += [int]$failed
            $failedTests += $test
            Write-Host " - FAILED ($failed tests)" -ForegroundColor Red
            Write-Host $output | Select-String -Pattern "FAIL|failed|Error" | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
            if ($FailFast) {
                Write-Host "[FAILFAST] Stopping after first failure" -ForegroundColor Red
                break
            }
        }
    }

    $script:totalPassed += $suitePassed

    Write-Host ""
    Write-Host "$TestType Summary:" -ForegroundColor $(if ($TestType -eq "Unit") { "Blue" } else { "Magenta" })
    Write-Host "  Passed: $suitePassed" -ForegroundColor Green
    if ($suiteFailed -gt 0) {
        Write-Host "  Failed: $suiteFailed" -ForegroundColor Red
    }
    Write-Host "  Duration: $((Get-Date) - $suiteStart)"
}

# Run unit tests
if (-not $E2EOnly) {
    Run-TestSuite -TestType "Unit" -Tests $unitTests
}

# Run E2E tests
if (-not $UnitOnly) {
    Run-TestSuite -TestType "E2E" -Tests $e2eTests
}

# Final summary
$duration = (Get-Date) - $startTime

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FINAL RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Duration:  $duration"
Write-Host "Passed:    $totalPassed" -ForegroundColor Green
if ($totalFailed -gt 0) {
    Write-Host "Failed:    $totalFailed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed test files:" -ForegroundColor Red
    foreach ($test in $failedTests) {
        Write-Host "  - $test" -ForegroundColor Red
    }
} else {
    Write-Host "Failed:    0" -ForegroundColor Green
    Write-Host ""
    Write-Host "ALL SECURITY TESTS PASSED" -ForegroundColor Green
}
Write-Host ""

if ($totalFailed -gt 0) {
    exit 1
} else {
    exit 0
}
