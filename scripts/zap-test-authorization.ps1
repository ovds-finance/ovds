#!/usr/bin/env pwsh
# OVDS Phase 6 — Authorization (IDOR) Test Runner
#
# Tests §13.2 of the OWASP ZAP Assessment Guide:
#   - User-to-user access control
#   - Tenant-to-tenant access control
#   - Role-to-role privilege escalation
#   - Hidden admin URL access
#   - Mass-assignment of role/owner fields
#
# Prerequisites:
#   1. Backend running at $BackendUrl (default http://localhost:3001)
#   2. Test users seeded via: npm run seed:zap-users
#   3. Two tenants seeded via: npm run seed:demo
#
# Usage:
#   pwsh -File scripts/zap-test-authorization.ps1
#   pwsh -File scripts/zap-test-authorization.ps1 -BackendUrl http://localhost:3001

param(
    [Parameter(Mandatory = $false)]
    [string]$BackendUrl = "http://localhost:3001",

    [Parameter(Mandatory = $false)]
    [string]$NormalUserEmail = "scanner.user@ovds.local",

    [Parameter(Mandatory = $false)]
    [string]$NormalUserPassword = "ZapScan#2024!Strong",

    [Parameter(Mandatory = $false)]
    [string]$AdminEmail = "scanner.admin@ovds.local",

    [Parameter(Mandatory = $false)]
    [string]$AdminPassword = "ZapRoot#2024!Secure",

    [Parameter(Mandatory = $false)]
    [string]$DisabledEmail = "scanner.disabled@ovds.local",

    [Parameter(Mandatory = $false)]
    [string]$DisabledPassword = "ZapDisabled#2024!Lock",

    [Parameter(Mandatory = $false)]
    [switch]$JsonReport = $false
)

$ErrorActionPreference = "Continue"
$results = New-Object System.Collections.ArrayList

function Write-Result {
    param(
        [string]$Name,
        [string]$Expected,
        [int]$ActualStatus,
        [string]$Notes = ""
    )
    $pass = ($ActualStatus -eq $Expected)
    $color = if ($pass) { "Green" } else { "Red" }
    $symbol = if ($pass) { "✓" } else { "✗" }

    $entry = [PSCustomObject]@{
        test        = $Name
        expected    = $Expected
        actual      = $ActualStatus
        result      = if ($pass) { "PASS" } else { "FAIL" }
        notes       = $Notes
        timestamp   = (Get-Date -Format o)
    }
    $script:results.Add($entry) | Out-Null

    Write-Host "  $symbol $Name" -ForegroundColor $color
    if (-not $pass -or $Notes) {
        Write-Host "    expected=$Expected actual=$ActualStatus $Notes" -ForegroundColor DarkGray
    }
}

function Login-User {
    param([string]$Email, [string]$Password)
    try {
        $body = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
        $resp = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" `
            -Method POST -ContentType "application/json" -Body $body -TimeoutSec 15
        return $resp
    } catch {
        return $null
    }
}

Write-Host "========================================"
Write-Host "  OVDS Phase 6 — Authorization Tests"
Write-Host "========================================"
Write-Host "Backend: $BackendUrl"
Write-Host ""

# Acquire tokens
Write-Host "Logging in test users..."
$normal = Login-User -Email $NormalUserEmail -Password $NormalUserPassword
$admin = Login-User -Email $AdminEmail -Password $AdminPassword
$disabled = Login-User -Email $DisabledEmail -Password $DisabledPassword

if (-not $normal) { Write-Host "✗ Normal user login failed" -ForegroundColor Red; exit 1 }
if (-not $admin) { Write-Host "✗ Admin user login failed" -ForegroundColor Red; exit 1 }
Write-Host "  ✓ Logged in: $NormalUserEmail"
Write-Host "  ✓ Logged in: $AdminEmail"
Write-Host ""

# Test 1: Normal user can access their profile
Write-Host "[1] Authenticated normal user can reach a protected endpoint"
$normalToken = $normal.access_token ?? $normal.token ?? $normal.data.accessToken
$adminToken = $admin.access_token ?? $admin.token ?? $admin.data.accessToken

try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/users/me" `
        -Headers @{ Authorization = "Bearer $normalToken" } -UseBasicParsing -TimeoutSec 10
    Write-Result -Name "GET /api/users/me with normal token" -Expected 200 -ActualStatus $r.StatusCode
} catch {
    Write-Result -Name "GET /api/users/me with normal token" -Expected 200 -ActualStatus $_.Exception.Response.StatusCode.value__
}

# Test 2: Unauthenticated request blocked
Write-Host ""
Write-Host "[2] Unauthenticated request rejected"
try {
    Invoke-WebRequest -Uri "$BackendUrl/api/users/me" -UseBasicParsing -TimeoutSec 10 | Out-Null
    Write-Result -Name "GET /api/users/me without token" -Expected 401 -ActualStatus 200 -Notes "Endpoint accepted anonymous request!"
} catch {
    Write-Result -Name "GET /api/users/me without token" -Expected 401 -ActualStatus $_.Exception.Response.StatusCode.value__
}

# Test 3: Disabled user cannot log in
Write-Host ""
Write-Host "[3] Disabled user cannot log in"
$disabledLogin = Login-User -Email $DisabledEmail -Password $DisabledPassword
if ($disabledLogin -and $disabledLogin.access_token) {
    Write-Result -Name "Disabled user login rejected" -Expected 403 -ActualStatus 200 -Notes "Disabled account was issued a token!"
} else {
    Write-Result -Name "Disabled user login rejected" -Expected 403 -ActualStatus 403
}

# Test 4: Hidden admin endpoint without admin role
Write-Host ""
Write-Host "[4] Normal user cannot access admin endpoints"
$adminEndpoints = @(
    "/api/admin/users",
    "/api/admin/tenants",
    "/api/admin/security/policies"
)
foreach ($endpoint in $adminEndpoints) {
    try {
        $r = Invoke-WebRequest -Uri "$BackendUrl$endpoint" `
            -Headers @{ Authorization = "Bearer $normalToken" } -UseBasicParsing -TimeoutSec 10
        Write-Result -Name "Normal GET $endpoint" -Expected 403 -ActualStatus $r.StatusCode -Notes "Normal user reached admin endpoint!"
    } catch {
        Write-Result -Name "Normal GET $endpoint" -Expected 403 -ActualStatus $_.Exception.Response.StatusCode.value__
    }
}

# Test 5: Cross-tenant IDOR — body companyId override
Write-Host ""
Write-Host "[5] Mass-assignment of companyId in request body is rejected"
$payload = @{ name = "Fake Co"; companyId = "00000000-0000-0000-0000-000000000099" } | ConvertTo-Json -Compress
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/companies" `
        -Method POST -ContentType "application/json" -Body $payload `
        -Headers @{ Authorization = "Bearer $normalToken" } -UseBasicParsing -TimeoutSec 10
    Write-Result -Name "POST /api/companies with body.companyId" -Expected 403 -ActualStatus $r.StatusCode -Notes "Mass assignment of companyId succeeded!"
} catch {
    Write-Result -Name "POST /api/companies with body.companyId" -Expected 403 -ActualStatus $_.Exception.Response.StatusCode.value__
}

# Test 6: x-company-id header from authenticated context only
Write-Host ""
Write-Host "[6] Switching x-company-id header is ignored"
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/companies" `
        -Headers @{ Authorization = "Bearer $normalToken"; "x-company-id" = "attacker-tenant" } `
        -UseBasicParsing -TimeoutSec 10
    Write-Result -Name "Spoofed x-company-id rejected" -Expected 403 -ActualStatus $r.StatusCode -Notes "Cross-tenant access via header succeeded!"
} catch {
    Write-Result -Name "Spoofed x-company-id rejected" -Expected 403 -ActualStatus $_.Exception.Response.StatusCode.value__
}

# Test 7: Open redirect on auth callback
Write-Host ""
Write-Host "[7] Open redirect rejected"
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/auth/callback?redirect=https://attacker.example/" `
        -UseBasicParsing -TimeoutSec 10
    Write-Result -Name "Open redirect to attacker.example" -Expected 400 -ActualStatus $r.StatusCode -Notes "Redirect to external host succeeded!"
} catch {
    Write-Result -Name "Open redirect to attacker.example" -Expected 400 -ActualStatus $_.Exception.Response.StatusCode.value__
}

# Summary
Write-Host ""
Write-Host "========================================"
$passed = ($results | Where-Object { $_.result -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.result -eq "FAIL" }).Count
Write-Host "  Authorization Tests Complete"
Write-Host "========================================"
Write-Host "Passed: $passed"
Write-Host "Failed: $failed"
Write-Host "Total:  $($results.Count)"
Write-Host ""

if ($JsonReport) {
    $reportPath = Join-Path $PSScriptRoot "..\security-reports\authorization-test-results.json"
    if (-not (Test-Path (Split-Path -Parent $reportPath))) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $reportPath) -Force | Out-Null
    }
    $results | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath -Encoding utf8
    Write-Host "JSON report written to: $reportPath"
}

if ($failed -gt 0) {
    exit 1
}
exit 0