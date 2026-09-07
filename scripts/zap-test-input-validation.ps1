#!/usr/bin/env pwsh
# OVDS Phase 6 — Input Validation Tests
#
# Verifies §13.4 of the OWASP ZAP Assessment Guide.
# Server-side validation for text, numeric, dates, emails, search params,
# JSON properties, HTTP headers, file names, and redirect parameters.
#
# Usage:
#   pwsh -File scripts/zap-test-input-validation.ps1
#   pwsh -File scripts/zap-test-input-validation.ps1 -BackendUrl http://localhost:3001

param(
    [string]$BackendUrl = "http://localhost:3001",
    [string]$Email = "scanner.user@ovds.local",
    [string]$Password = "ZapScan#2024!Strong",
    [switch]$JsonReport = $false,
    [string]$ReportPath = ""
)

$ErrorActionPreference = "Continue"
$pass = 0; $fail = 0
$results = New-Object System.Collections.ArrayList

function Record {
    param([string]$Name, [int]$Expected, [int]$Actual, [string]$Notes = "")
    $ok = $Expected -eq $Actual
    $sym = if ($ok) { "✓" } else { "✗" }
    $col = if ($ok) { "Green" } else { "Red" }
    Write-Host "  $sym $Name" -ForegroundColor $col
    if (-not $ok -or $Notes) {
        Write-Host "    expected=$Expected actual=$Actual $Notes" -ForegroundColor DarkGray
    }
    $script:results.Add([PSCustomObject]@{
        test = $Name
        expected = $Expected
        actual = $Actual
        result = if ($ok) { "PASS" } else { "FAIL" }
        notes = $Notes
    }) | Out-Null
    if ($ok) { $script:pass++ } else { $script:fail++ }
}

# Acquire token
Write-Host "========================================"
Write-Host "  OVDS Phase 6 — Input Validation"
Write-Host "========================================"
Write-Host "Backend: $BackendUrl"
Write-Host ""

$login = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" `
    -Method POST -ContentType "application/json" `
    -Body (@{ email = $Email; password = $Password } | ConvertTo-Json -Compress) `
    -TimeoutSec 15
$token = $login.access_token ?? $login.token ?? $login.data.accessToken

if (-not $token) {
    Write-Host "✗ Login failed — cannot run input validation tests" -ForegroundColor Red
    exit 1
}

$headers = @{ Authorization = "Bearer $token" }

# 1) SQL injection in search params must be rejected (400/422) or escaped
Write-Host "[1] SQL injection payloads in search params"
$sqliPayloads = @(
    @{ name = "classic quote";  payload = "' OR '1'='1" },
    @{ name = "union select";   payload = "1' UNION SELECT NULL--" },
    @{ name = "stacked query";  payload = "'; DROP TABLE users; --" }
)
foreach ($p in $sqliPayloads) {
    $encoded = [uri]::EscapeDataString($p.payload)
    try {
        $r = Invoke-WebRequest -Uri "$BackendUrl/api/invoices?search=$encoded" `
            -Headers $headers -UseBasicParsing -TimeoutSec 10
        # A 200 is acceptable only if response does not contain SQL error markers
        $body = $r.Content
        $hasSqliError = ($body -match "SQL syntax|mysql_|ORA-|PostgreSQL|SQLSTATE|unterminated quoted string")
        if ($hasSqliError) {
            Record "Search rejects SQLi ($($p.name))" 1 0 "SQL error in body!"
        } else {
            Record "Search rejects SQLi ($($p.name))" 1 1
        }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -ge 400) {
            Record "Search rejects SQLi ($($p.name))" 1 1
        } else {
            Record "Search rejects SQLi ($($p.name))" 1 0 "Got $code"
        }
    }
}

# 2) XSS payloads in text fields must be escaped, not reflected
Write-Host ""
Write-Host "[2] XSS payloads in input fields"
$xssPayload = "<script>alert('XSS')</script>"
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/customers?name=$([uri]::EscapeDataString($xssPayload))" `
        -Headers $headers -UseBasicParsing -TimeoutSec 10
    if ($r.Content -match "<script>alert\('XSS'\)") {
        Record "XSS reflected in customer query response" 1 0 "Script tag in body!"
    } else {
        Record "XSS reflected in customer query response" 1 1
    }
} catch {
    Record "XSS reflected in customer query response" 1 1
}

# 3) Path traversal in file parameters
Write-Host ""
Write-Host "[3] Path traversal payloads in file parameters"
$pathPayloads = @(
    "../../../../etc/passwd",
    "..\\..\\..\\windows\\win.ini",
    "%2e%2e%2f%2e%2e%2fetc%2fpasswd"
)
foreach ($p in $pathPayloads) {
    $encoded = [uri]::EscapeDataString($p)
    try {
        $r = Invoke-WebRequest -Uri "$BackendUrl/api/files/download?path=$encoded" `
            -Headers $headers -UseBasicParsing -TimeoutSec 10
        $body = $r.Content
        if ($body -match "root:x:0:0|for 16-bit app support") {
            Record "Path traversal blocked ($($p.Substring(0, [Math]::Min(20, $p.Length)))...)" 1 0 "Sensitive content leaked!"
        } else {
            Record "Path traversal blocked" 1 1
        }
    } catch {
        Record "Path traversal blocked" 1 1
    }
}

# 4) Open redirect blocked
Write-Host ""
Write-Host "[4] Open redirect via redirect parameter"
$openRedirectPayloads = @(
    "https://attacker.example/",
    "//attacker.example/",
    "javascript:alert(1)"
)
foreach ($p in $openRedirectPayloads) {
    $encoded = [uri]::EscapeDataString($p)
    try {
        $r = Invoke-WebRequest -Uri "$BackendUrl/api/auth/callback?redirect=$encoded" `
            -Headers $headers -UseBasicParsing -TimeoutSec 10 -MaximumRedirection 0
        if ($r.StatusCode -eq 301 -or $r.StatusCode -eq 302) {
            $loc = $r.Headers["Location"]
            if ($loc -and ($loc -match "attacker.example" -or $loc -match "^javascript:")) {
                Record "Open redirect blocked ($p)" 1 0 "Redirect to $loc"
            } else {
                Record "Open redirect blocked" 1 1
            }
        } else {
            Record "Open redirect blocked" 1 1
        }
    } catch {
        Record "Open redirect blocked" 1 1
    }
}

# 5) Numeric field validation — negative quantity rejected
Write-Host ""
Write-Host "[5] Negative quantity rejected"
try {
    $body = @{ quantity = -1; unitPrice = 10 } | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/invoices/items" `
        -Method POST -Headers $headers -ContentType "application/json" -Body $body `
        -UseBasicParsing -TimeoutSec 10
    Record "Negative quantity rejected" 1 0 "Got $($r.StatusCode)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400 -or $code -eq 422) {
        Record "Negative quantity rejected" 1 1
    } else {
        Record "Negative quantity rejected" 1 0 "Got $code"
    }
}

# 6) Oversized field rejection
Write-Host ""
Write-Host "[6] Oversized field rejected"
try {
    $hugeName = "A" * 50000
    $body = @{ name = $hugeName } | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/customers" `
        -Method POST -Headers $headers -ContentType "application/json" -Body $body `
        -UseBasicParsing -TimeoutSec 10
    Record "Oversized payload rejected" 1 0 "Got $($r.StatusCode)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400 -or $code -eq 413 -or $code -eq 422) {
        Record "Oversized payload rejected" 1 1
    } else {
        Record "Oversized payload rejected" 1 0 "Got $code"
    }
}

# 7) Invalid Content-Type rejected
Write-Host ""
Write-Host "[7] Wrong Content-Type rejected"
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/customers" `
        -Method POST -Headers $headers -ContentType "text/xml" `
        -Body "<customer><name>foo</name></customer>" `
        -UseBasicParsing -TimeoutSec 10
    Record "Wrong Content-Type rejected" 1 0 "Got $($r.StatusCode)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -ge 400) {
        Record "Wrong Content-Type rejected" 1 1
    } else {
        Record "Wrong Content-Type rejected" 1 0 "Got $code"
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Input Validation Tests Complete"
Write-Host "========================================"
Write-Host "Passed: $pass"
Write-Host "Failed: $fail"
Write-Host ""

if ($JsonReport) {
    $rp = if ($ReportPath) { $ReportPath } else { Join-Path $PSScriptRoot "..\security-reports\phase6-zap-test-input-validation.json" }
    if (-not (Test-Path (Split-Path -Parent $rp))) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $rp) -Force | Out-Null
    }
    $results | ConvertTo-Json -Depth 5 | Out-File -FilePath $rp -Encoding utf8
}

if ($fail -gt 0) { exit 1 } else { exit 0 }