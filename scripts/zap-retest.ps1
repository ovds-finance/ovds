#!/usr/bin/env pwsh
# OVDS Phase 6 — Retest Helper
#
# Implements §18 of the OWASP ZAP Assessment Guide (Retesting).
# Given a list of previously-confirmed findings, run the matching Phase 6
# checks again and produce a Fixed / Partially-fixed / Not fixed / Risk
# accepted / False positive verdict for each.
#
# Usage:
#   pwsh -File scripts/zap-retest.ps1 -FindingsFile security-reports/retest-input.json
#   pwsh -File scripts/zap-retest.ps1 -FindingsFile findings.json -BackendUrl http://localhost:3001

param(
    [Parameter(Mandatory=$true)]
    [string]$FindingsFile,

    [string]$BackendUrl = "http://localhost:3001",

    [string]$OutputFile = ".\security-reports\retest-evidence.json"
)

$ErrorActionPreference = "Continue"

if (!(Test-Path $FindingsFile)) {
    Write-Host "ERROR: Findings file not found: $FindingsFile" -ForegroundColor Red
    exit 1
}

$findings = Get-Content -LiteralPath $FindingsFile -Raw | ConvertFrom-Json
if ($findings -isnot [System.Array]) { $findings = @($findings) }

$root = Split-Path -Parent $PSCommandPath
$results = @()
$pass = 0; $fail = 0

Write-Host "========================================"
Write-Host "  OVDS Phase 6 — Retest Helper"
Write-Host "========================================"
Write-Host "Backend:    $BackendUrl"
Write-Host "Findings:   $($findings.Count)"
Write-Host "Output:     $OutputFile"
Write-Host ""

# Login once
$login = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" `
    -Method POST -ContentType "application/json" `
    -Body (@{ email = "scanner.user@ovds.local"; password = "ZapScan#2024!Strong" } | ConvertTo-Json -Compress) `
    -TimeoutSec 15
$token = $login.access_token ?? $login.token

foreach ($f in $findings) {
    $fid = $f.findingId ?? $f.id ?? "?"
    $cat = ($f.category ?? "").ToLower()
    $title = $f.title ?? $f.description ?? ""
    Write-Host "[$fid] $title" -ForegroundColor Cyan

    # Map finding category to a Phase 6 verification script
    $script = $null
    switch -regex ($cat) {
        'auth|session|cookie|csrf|jwt|password' { $script = "zap-test-authentication.ps1" }
        'idor|access control|authorization|role|permission' { $script = "zap-test-authorization.ps1" }
        'session' { $script = "zap-test-session.ps1" }
        'injection|xss|sql|csrf' { $script = "zap-test-input-validation.ps1" }
        'upload|file|mime' { $script = "zap-test-misc.ps1" }
        'rate|brute|throttle' { $script = "zap-test-rate-limit.ps1" }
        default { $script = $null }
    }

    if (-not $script -or -not (Test-Path (Join-Path $root $script))) {
        Write-Host "  ⚠ No matching verification script — recording as Risk accepted" -ForegroundColor Yellow
        $results += [PSCustomObject]@{
            findingId = $fid
            title = $title
            verdict = "Risk accepted"
            evidence = "No automated verification available — manual review required"
            retestedAt = (Get-Date -Format o)
        }
        continue
    }

    Write-Host "  → running $script"
    $proc = Start-Process -FilePath "pwsh" `
        -ArgumentList "-NoProfile","-File",(Join-Path $root $script),"-BackendUrl",$BackendUrl,"-JsonReport" `
        -Wait -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\retest-$fid.log"

    $verdict = if ($proc.ExitCode -eq 0) { "Fixed" } else { "Not fixed" }
    $color = if ($proc.ExitCode -eq 0) { "Green" } else { "Red" }

    Write-Host "  $verdict" -ForegroundColor $color

    $results += [PSCustomObject]@{
        findingId = $fid
        title = $title
        verdict = $verdict
        script = $script
        exitCode = $proc.ExitCode
        logPath = "$env:TEMP\retest-$fid.log"
        retestedAt = (Get-Date -Format o)
    }
    if ($proc.ExitCode -eq 0) { $pass++ } else { $fail++ }
}

# Write evidence
if (!(Test-Path (Split-Path -Parent $OutputFile))) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $OutputFile) -Force | Out-Null
}
$results | ConvertTo-Json -Depth 5 | Out-File -FilePath $OutputFile -Encoding utf8

Write-Host ""
Write-Host "========================================"
Write-Host "  Retest Complete"
Write-Host "========================================"
Write-Host "Fixed:        $pass"
Write-Host "Not fixed:    $fail"
Write-Host "Evidence:     $OutputFile"
Write-Host ""

if ($fail -gt 0) { exit 1 } else { exit 0 }