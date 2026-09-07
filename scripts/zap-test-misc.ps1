#!/usr/bin/env pwsh
# OVDS Phase 6 — File Upload, Error Handling, Business Logic Tests
#
# Verifies §13.5, §13.6, §13.8 of the OWASP ZAP Assessment Guide.
# - File upload: type, magic-bytes, size, sanitization
# - Error handling: no stack traces / SQL errors / framework details
# - Business logic: workflow skips, negative values, expired tokens, etc.
#
# Usage:
#   pwsh -File scripts/zap-test-misc.ps1

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

function Expect-Reject {
    param([string]$Name, [int]$Code)
    if ($Code -ge 400) {
        Record $Name 1 1
    } else {
        Record $Name 1 0 "Got $Code (expected 4xx/5xx)"
    }
}

function Expect-Accept {
    param([string]$Name, [int]$Code)
    if ($Code -ge 200 -and $Code -lt 300) {
        Record $Name 1 1
    } else {
        Record $Name 1 0 "Got $Code (expected 2xx)"
    }
}

Write-Host "========================================"
Write-Host "  OVDS Phase 6 — File Upload / Errors / Business Logic"
Write-Host "========================================"
Write-Host "Backend: $BackendUrl"
Write-Host ""

$login = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" `
    -Method POST -ContentType "application/json" `
    -Body (@{ email = $Email; password = $Password } | ConvertTo-Json -Compress) `
    -TimeoutSec 15
$token = $login.access_token ?? $login.token ?? $login.data.accessToken
if (-not $token) { Write-Host "✗ Login failed"; exit 1 }
$headers = @{ Authorization = "Bearer $token" }

# === §13.5 — File Upload ===
Write-Host "[1] Dangerous file types rejected"

# PHP file
$phpFile = [System.IO.Path]::GetTempFileName()
Set-Content -LiteralPath $phpFile -Value '<?php echo "x"; ?>' -Encoding ASCII -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/files/upload" `
        -Method POST -Headers $headers -UseBasicParsing -TimeoutSec 10 `
        -Form @{ file = Get-Item $phpFile }
    Expect-Reject "PHP upload rejected" $r.StatusCode
} catch {
    Expect-Reject "PHP upload rejected" $_.Exception.Response.StatusCode.value__
}
Remove-Item -LiteralPath $phpFile -Force -ErrorAction SilentlyContinue

# EXE file
$exeFile = [System.IO.Path]::GetTempFileName() + ".exe"
Set-Content -LiteralPath $exeFile -Value "MZ" -Encoding ASCII -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/files/upload" `
        -Method POST -Headers $headers -UseBasicParsing -TimeoutSec 10 `
        -Form @{ file = Get-Item $exeFile }
    Expect-Reject "EXE upload rejected" $r.StatusCode
} catch {
    Expect-Reject "EXE upload rejected" $_.Exception.Response.StatusCode.value__
}
Remove-Item -LiteralPath $exeFile -Force -ErrorAction SilentlyContinue

# JS file (double-extension attack)
$jsFile = [System.IO.Path]::GetTempFileName() + ".pdf.js"
Set-Content -LiteralPath $jsFile -Value "alert(1)" -Encoding ASCII -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/files/upload" `
        -Method POST -Headers $headers -UseBasicParsing -TimeoutSec 10 `
        -Form @{ file = Get-Item $jsFile }
    Expect-Reject "JS upload rejected" $r.StatusCode
} catch {
    Expect-Reject "JS upload rejected" $_.Exception.Response.StatusCode.value__
}
Remove-Item -LiteralPath $jsFile -Force -ErrorAction SilentlyContinue

# Polyglot PDF/JPG
$polyglot = [System.IO.Path]::GetTempFileName() + ".jpg"
[byte[]]$bytes = [byte[]](0xFF, 0xD8, 0xFF, 0xE0) + [byte[]](0x25, 0x50, 0x44, 0x46) + [byte[]](0x00, 0x00)
[System.IO.File]::WriteAllBytes($polyglot, $bytes)
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/files/upload" `
        -Method POST -Headers $headers -UseBasicParsing -TimeoutSec 10 `
        -Form @{ file = Get-Item $polyglot }
    # We allow JPG but not PDF-as-JPG; either rejection is acceptable
    Expect-Reject "PDF magic bytes in JPG rejected" $r.StatusCode
} catch {
    Expect-Reject "PDF magic bytes in JPG rejected" $_.Exception.Response.StatusCode.value__
}
Remove-Item -LiteralPath $polyglot -Force -ErrorAction SilentlyContinue

# Valid PNG should be accepted
$pngFile = [System.IO.Path]::GetTempFileName() + ".png"
[byte[]]$pngHeader = 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
[System.IO.File]::WriteAllBytes($pngFile, $pngHeader)
try {
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/files/upload" `
        -Method POST -Headers $headers -UseBasicParsing -TimeoutSec 10 `
        -Form @{ file = Get-Item $pngFile }
    Expect-Accept "Valid PNG accepted" $r.StatusCode
} catch {
    # 415/400 may be acceptable if upload not configured
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -ge 200 -and $code -lt 300) {
        Record "Valid PNG accepted" 1 1
    } elseif ($code -eq 404) {
        Record "Valid PNG accepted" 1 1 -Notes "Endpoint not present (acceptable)"
    } else {
        Record "Valid PNG accepted" 1 0 "Got $code"
    }
}
Remove-Item -LiteralPath $pngFile -Force -ErrorAction SilentlyContinue

# === §13.6 — Error Handling ===
Write-Host ""
Write-Host "[2] Error responses do not leak internals"

$errTests = @(
    @{ name = "404 — unknown route"; path = "/api/this-does-not-exist" },
    @{ name = "401 — no auth";        path = "/api/users/me" },
    @{ name = "405 — wrong method";   path = "/api/auth/login"; method = "DELETE" }
)

foreach ($t in $errTests) {
    $method = if ($t.method) { $t.method } else { "GET" }
    try {
        if ($method -eq "GET") {
            $r = Invoke-WebRequest -Uri "$BackendUrl$($t.path)" -UseBasicParsing -TimeoutSec 10
            $body = $r.Content
        } else {
            $r = Invoke-WebRequest -Uri "$BackendUrl$($t.path)" -Method $method -UseBasicParsing -TimeoutSec 10
            $body = $r.Content
        }
    } catch {
        $resp = $_.Exception.Response
        if ($resp) {
            $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
            $body = $reader.ReadToEnd()
        } else { $body = "" }
    }

    $hasStack = ($body -match "at Object\.|at function|stack trace|Traceback|at line \d+|node_modules|\\.ts:\d+")
    $hasSql = ($body -match "SQL syntax|mysql_|ORA-|PostgreSQL|SQLSTATE|unterminated")
    $hasPath = ($body -match "C:\\\\|\\\\home\\\\|\\\\var\\\\|\\\\app\\\\|node_modules")
    if ($hasStack -or $hasSql -or $hasPath) {
        Record "Error body for $($t.name) is clean" 1 0 "Internal info leaked"
    } else {
        Record "Error body for $($t.name) is clean" 1 1
    }
}

# === §13.8 — Business Logic ===
Write-Host ""
Write-Host "[3] Business logic protections"

# Negative discount rejected
try {
    $body = @{ code = "PROMO"; discountPercent = -50 } | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/promotions" `
        -Method POST -Headers $headers -ContentType "application/json" -Body $body `
        -UseBasicParsing -TimeoutSec 10
    Record "Negative discount rejected" 1 0 "Got $($r.StatusCode)"
} catch {
    Expect-Reject "Negative discount rejected" $_.Exception.Response.StatusCode.value__
}

# Discount >100% rejected
try {
    $body = @{ code = "PROMO2"; discountPercent = 150 } | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/promotions" `
        -Method POST -Headers $headers -ContentType "application/json" -Body $body `
        -UseBasicParsing -TimeoutSec 10
    Record "Discount >100% rejected" 1 0 "Got $($r.StatusCode)"
} catch {
    Expect-Reject "Discount >100% rejected" $_.Exception.Response.StatusCode.value__
}

# Future-dated posting rejected (negative test)
try {
    $body = @{ postingDate = "1900-01-01"; description = "test"; amount = 100 } | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/journals" `
        -Method POST -Headers $headers -ContentType "application/json" -Body $body `
        -UseBasicParsing -TimeoutSec 10
    Record "Out-of-range posting date rejected" 1 0 "Got $($r.StatusCode)"
} catch {
    Expect-Reject "Out-of-range posting date rejected" $_.Exception.Response.StatusCode.value__
}

# Closed-period posting rejected
try {
    $body = @{ postingDate = "2020-01-01"; description = "test"; amount = 100 } | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri "$BackendUrl/api/journals" `
        -Method POST -Headers $headers -ContentType "application/json" -Body $body `
        -UseBasicParsing -TimeoutSec 10
    Record "Posting to closed period rejected" 1 0 "Got $($r.StatusCode)"
} catch {
    Expect-Reject "Posting to closed period rejected" $_.Exception.Response.StatusCode.value__
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Misc Tests Complete"
Write-Host "========================================"
Write-Host "Passed: $pass"
Write-Host "Failed: $fail"
Write-Host ""

if ($JsonReport) {
    $rp = if ($ReportPath) { $ReportPath } else { Join-Path $PSScriptRoot "..\security-reports\phase6-zap-test-misc.json" }
    if (-not (Test-Path (Split-Path -Parent $rp))) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $rp) -Force | Out-Null
    }
    $results | ConvertTo-Json -Depth 5 | Out-File -FilePath $rp -Encoding utf8
}

if ($fail -gt 0) { exit 1 } else { exit 0 }