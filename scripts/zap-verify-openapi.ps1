#!/usr/bin/env pwsh
# OVDS Phase 5 — OpenAPI Definition Verification
#
# Verifies the backend's /api/openapi.json is complete, well-formed, and
# covers the routes the ZAP automation plan will attack. The ZAP automation
# plan (.zap/automation/ovds-api-scan.yaml) imports the same definition; this
# script is a pre-flight check so we fail fast in CI if the spec is broken.
#
# Usage:
#   pwsh -File scripts/zap-verify-openapi.ps1 -BackendUrl http://localhost:3001
#   pwsh -File scripts/zap-verify-openapi.ps1 -OpenApiPath ./openapi.json

param(
    [string]$BackendUrl = "http://localhost:3001",
    [string]$OpenApiPath = "",
    [string]$OutputFile = ".\security-reports\openapi-verification.json"
)

$ErrorActionPreference = "Stop"

$openapi = $null
$sourceLabel = ""

if ($OpenApiPath -and (Test-Path $OpenApiPath)) {
    $openapi = Get-Content -LiteralPath $OpenApiPath -Raw | ConvertFrom-Json
    $sourceLabel = "file: $OpenApiPath"
} else {
    Write-Host "Fetching OpenAPI spec from $BackendUrl/api/openapi.json"
    try {
        $openapi = Invoke-RestMethod -Uri "$BackendUrl/api/openapi.json" -TimeoutSec 15
        $sourceLabel = "url: $BackendUrl/api/openapi.json"
    } catch {
        Write-Host "ERROR: cannot fetch OpenAPI spec from $BackendUrl/api/openapi.json" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

$checks = New-Object System.Collections.Generic.List[Object]
$pass = 0; $fail = 0; $warn = 0

function Add-Check { param($id, $name, $ok, $warning, $detail = "")
    $status = if ($ok) { "pass" } elseif ($warning) { "warn" } else { "fail" }
    $script:checks.Add([PSCustomObject]@{
        id      = $id
        name    = $name
        pass    = $ok
        warning = $warning
        detail  = $detail
    }) | Out-Null
    if ($ok) { $script:pass++ } elseif ($warning) { $script:warn++ } else { $script:fail++ }
}

Write-Host "========================================"
Write-Host "  OVDS Phase 5 — OpenAPI Verification"
Write-Host "========================================"
Write-Host "Source:  $sourceLabel"
Write-Host ""

# 1) Top-level OpenAPI 3.x fields
Add-Check "spec.openapi"  "openapi field present and is 3.x" `
    ($openapi.openapi -and $openapi.openapi -like "3.*") `
    $false `
    "openapi=$($openapi.openapi)"

Add-Check "spec.info"     "info.title present" `
    ($openapi.info -and $openapi.info.title) `
    $false `
    "title=$($openapi.info.title)"

Add-Check "spec.version"  "info.version present" `
    ($openapi.info -and $openapi.info.version) `
    $false `
    "version=$($openapi.info.version)"

# 2) Servers
Add-Check "spec.servers"  "servers array present" `
    ($openapi.servers -and $openapi.servers.Count -gt 0) `
    $true `
    "count=$($openapi.servers.Count)"

# 3) Paths coverage
$paths = $openapi.paths
Add-Check "spec.paths.count" "at least 20 paths defined" `
    ($paths -and $paths.PSObject.Properties.Count -ge 20) `
    $true `
    "count=$($paths.PSObject.Properties.Count)"

# 4) Required high-risk endpoints are present
$requiredPaths = @(
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/logout",
    "/api/users",
    "/api/invoices",
    "/api/payments",
    "/api/banking/transfers",
    "/api/admin/users",
    "/api/health/live"
)
foreach ($p in $requiredPaths) {
    Add-Check "spec.path.${p}" "path ${p} defined" `
        ($paths.PSObject.Properties.Name -contains $p) `
        $true `
        ""
}

# 5) Each path must declare at least one operation
$noOp = @()
foreach ($prop in $paths.PSObject.Properties) {
    $p = $prop.Value
    $hasOp = $false
    foreach ($verb in @("get","post","put","patch","delete")) {
        if ($p.PSObject.Properties.Name -contains $verb) { $hasOp = $true; break }
    }
    if (-not $hasOp) { $noOp += $prop.Name }
}
Add-Check "spec.paths.operations" "all paths have at least one operation" `
    ($noOp.Count -eq 0) `
    $true `
    "missing=$($noOp -join ', ')"

# 6) Security schemes declared
$secDefs = $openapi.components.securitySchemes
Add-Check "spec.securitySchemes" "components.securitySchemes present" `
    ($secDefs -ne $null) `
    $false `
    "schemes=$((@($secDefs.PSObject.Properties.Name) -join ','))"

if ($secDefs) {
    Add-Check "spec.security.bearer" "bearerAuth / JWT scheme defined" `
        ($secDefs.PSObject.Properties.Name -match "bearer|BearerAuth|JwtAuth") `
        $true `
        ""
}

# 7) Forbidden: production server URLs
$forbidden = @("api.ovds.example.com", "ovds.example.com", "production.example.com")
$bad = @()
foreach ($s in $openapi.servers) {
    foreach ($b in $forbidden) {
        if ($s.url -like "*$b*") { $bad += $s.url }
    }
}
Add-Check "spec.no-prod-urls" "no production URLs in spec" `
    ($bad.Count -eq 0) `
    $true `
    "found=$($bad -join ', ')"

# 8) Operations have responses declared
$opsMissingResponses = @()
foreach ($prop in $paths.PSObject.Properties) {
    foreach ($verb in @("get","post","put","patch","delete")) {
        $op = $prop.Value.$verb
        if ($op -and -not $op.responses) {
            $opsMissingResponses += "${verb}:${prop.Name}"
        }
    }
}
Add-Check "spec.responses" "all operations declare responses" `
    ($opsMissingResponses.Count -eq 0) `
    $true `
    "missing=$($opsMissingResponses.Count) operation(s)"

# 9) Operations have either security or 401 response
$opsMissingAuth = @()
foreach ($prop in $paths.PSObject.Properties) {
    foreach ($verb in @("get","post","put","patch","delete")) {
        $op = $prop.Value.$verb
        if (-not $op) { continue }
        $has401 = $op.responses -and ($op.responses.PSObject.Properties.Name -contains "401")
        $hasSec = $op.security -or $openapi.security
        if (-not $has401 -and -not $hasSec) {
            $opsMissingAuth += "${verb}:${prop.Name}"
        }
    }
}
Add-Check "spec.auth-coverage" "all operations declare security or 401" `
    ($opsMissingAuth.Count -eq 0) `
    $true `
    "unprotected=$($opsMissingAuth.Count) operation(s)"

Write-Host ""
Write-Host "========================================"
Write-Host "  OpenAPI Verification Summary"
Write-Host "========================================"
Write-Host "Passed:   $pass"
Write-Host "Failed:   $fail"
Write-Host "Warnings: $warn"
Write-Host ""

$report = [PSCustomObject]@{
    source    = $sourceLabel
    checkedAt = (Get-Date -Format o)
    totals    = @{ pass = $pass; fail = $fail; warn = $warn }
    checks    = $checks
}
$dir = Split-Path -Parent $OutputFile
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$report | ConvertTo-Json -Depth 6 | Out-File -FilePath $OutputFile -Encoding utf8
Write-Host "Report: $OutputFile"

if ($fail -gt 0) { exit 1 } else { exit 0 }
