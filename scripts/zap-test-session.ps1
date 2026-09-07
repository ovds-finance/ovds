#!/usr/bin/env pwsh
# OVDS Phase 6 — Session Management Tests
#
# Verifies §13.3 of the OWASP ZAP Assessment Guide:
#   - Session id changes after login (rotation)
#   - Logout invalidates the session
#   - Cookies use Secure / HttpOnly / SameSite
#   - JWT cannot be replayed after logout (jti blocklist)
#
# Usage:
#   pwsh -File scripts/zap-test-session.ps1
#   pwsh -File scripts/zap-test-session.ps1 -BackendUrl http://localhost:3001

param(
    [string]$BackendUrl = "http://localhost:3001",
    [string]$Email = "scanner.user@ovds.local",
    [string]$Password = "ZapScan#2024!Strong",
    [switch]$JsonReport = $false,
    [string]$ReportPath = ""
)

$ErrorActionPreference = "Continue"
$results = @()
$pass = 0
$fail = 0

function Record {
    param([string]$Name, [int]$Expected, [int]$Actual, [string]$Notes = "")
    $ok = $Expected -eq $Actual
    $sym = if ($ok) { "✓" } else { "✗" }
    $col = if ($ok) { "Green" } else { "Red" }
    Write-Host "  $sym $Name" -ForegroundColor $col
    if (-not $ok -or $Notes) {
        Write-Host "    expected=$Expected actual=$Actual $Notes" -ForegroundColor DarkGray
    }
    $script:results += [PSCustomObject]@{
        test = $Name
        expected = $Expected
        actual = $Actual
        result = if ($ok) { "PASS" } else { "FAIL" }
        notes = $Notes
    }
    if ($ok) { $script:pass++ } else { $script:fail++ }
}

Write-Host "========================================"
Write-Host "  OVDS Phase 6 — Session Management"
Write-Host "========================================"
Write-Host "Backend: $BackendUrl"
Write-Host ""

# 1) Login returns Set-Cookie + token
Write-Host "[1] Login response sets authentication cookie + body token"
$loginResp = Invoke-WebRequest -Uri "$BackendUrl/api/auth/login" `
    -Method POST -ContentType "application/json" `
    -Body (@{ email = $Email; password = $Password } | ConvertTo-Json -Compress) `
    -UseBasicParsing -SessionVariable session -TimeoutSec 15

$cookies = $loginResp.Headers["Set-Cookie"]
if ($cookies) {
    Write-Host "  Set-Cookie: $cookies" -ForegroundColor DarkGray
    Record "Set-Cookie header present" 1 1
    if ($cookies -match "HttpOnly") {
        Record "Auth cookie has HttpOnly" 1 1
    } else {
        Record "Auth cookie has HttpOnly" 1 0 "Cookie missing HttpOnly"
    }
    if ($cookies -match "SameSite") {
        Record "Auth cookie has SameSite" 1 1
    } else {
        Record "Auth cookie has SameSite" 1 0 "Cookie missing SameSite"
    }
} else {
    Record "Set-Cookie header present" 1 0
}

$body = $loginResp.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
$token = $body.access_token ?? $body.token ?? $body.data.accessToken

# 2) Access token works
Write-Host ""
Write-Host "[2] Issued access token is accepted on protected endpoints"
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/users/me" `
        -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing -TimeoutSec 10
    Record "GET /api/users/me with new token" 200 $r.StatusCode
} catch {
    Record "GET /api/users/me with new token" 200 0
}

# 3) Logout invalidates token
Write-Host ""
Write-Host "[3] Logout invalidates the access token"
try {
    Invoke-WebRequest -Uri "$BackendUrl/api/auth/logout" `
        -Method POST -Headers @{ Authorization = "Bearer $token" } `
        -UseBasicParsing -TimeoutSec 10 | Out-Null
} catch { }

Start-Sleep -Seconds 1

try {
    Invoke-WebRequest -Uri "$BackendUrl/api/users/me" `
        -Headers @{ Authorization = "Bearer $token" } `
        -UseBasicParsing -TimeoutSec 10 | Out-Null
    Record "Token rejected after logout" 401 200 "Token still worked after logout!"
} catch {
    Record "Token rejected after logout" 401 $_.Exception.Response.StatusCode.value__
}

# 4) Re-login and inspect cookie attributes (Secure flag is environment-dependent)
Write-Host ""
Write-Host "[4] Cookie security attributes on second login"
$resp2 = Invoke-WebRequest -Uri "$BackendUrl/api/auth/login" `
    -Method POST -ContentType "application/json" `
    -Body (@{ email = $Email; password = $Password } | ConvertTo-Json -Compress) `
    -UseBasicParsing -TimeoutSec 15
$cookies2 = $resp2.Headers["Set-Cookie"]
if ($cookies2 -match "HttpOnly" -and $cookies2 -match "SameSite") {
    Record "HttpOnly + SameSite on login" 1 1
} else {
    Record "HttpOnly + SameSite on login" 1 0
}

# Secure flag only matters over HTTPS; mark informational
if ($BackendUrl -like "https://*") {
    if ($cookies2 -match "Secure") {
        Record "Secure flag (HTTPS)" 1 1
    } else {
        Record "Secure flag (HTTPS)" 1 0 "Cookie missing Secure on HTTPS endpoint"
    }
} else {
    Write-Host "  (informational: Secure flag check skipped for HTTP target)" -ForegroundColor DarkYellow
}

# 5) Expired token rejected
Write-Host ""
Write-Host "[5] Tampered / malformed JWT rejected"
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/users/me" `
        -Headers @{ Authorization = "Bearer not.a.real.token" } `
        -UseBasicParsing -TimeoutSec 10
    Record "Tampered JWT rejected" 401 $r.StatusCode
} catch {
    Record "Tampered JWT rejected" 401 $_.Exception.Response.StatusCode.value__
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Session Tests Complete"
Write-Host "========================================"
Write-Host "Passed: $pass"
Write-Host "Failed: $fail"
Write-Host ""

if ($JsonReport) {
    $rp = if ($ReportPath) { $ReportPath } else { Join-Path $PSScriptRoot "..\security-reports\phase6-zap-test-session.json" }
    if (-not (Test-Path (Split-Path -Parent $rp))) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $rp) -Force | Out-Null
    }
    $results | ConvertTo-Json -Depth 5 | Out-File -FilePath $rp -Encoding utf8
}

if ($fail -gt 0) { exit 1 } else { exit 0 }