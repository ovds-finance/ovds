# OVDS Security Governance Check (PowerShell)
# Counterpart to scripts/security-policy-check.sh.
#
# Usage:
#   pwsh scripts/security-policy-check.ps1
#   pwsh scripts/security-policy-check.ps1 -Strict

param(
    [string]$Root = "",
    [switch]$Strict = $false
)

$ErrorActionPreference = "Continue"

if (-not $Root) {
    $Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
}

$pass = 0
$warnings = 0
$fails = 0

function Pass { param($msg) Write-Host "  [PASS] $msg" -ForegroundColor Green; $script:pass++ }
function Warn { param($msg) Write-Host "  [WARN] $msg" -ForegroundColor Yellow; $script:warnings++ }
function Fail { param($msg) Write-Host "  [FAIL] $msg" -ForegroundColor Red; $script:fails++ }

Write-Host "========================================"
Write-Host "  OVDS Security Governance Check"
Write-Host "========================================"
Write-Host "Root: $Root"
Write-Host ""

# 1) Required files
Write-Host "[1] Required configuration files"
$required = @(
    ".zap/contexts/ovds.context",
    ".zap/policies/ovds-scan.policy",
    ".zap/users/test-users.json",
    ".zap/automation/ovds-authenticated-scan.yaml",
    ".zap/automation/ovds-api-scan.yaml",
    ".zap/scripts/authentication/ovds-json-auth.js",
    "scripts/zap-baseline.ps1",
    "scripts/zap-baseline.sh",
    "scripts/zap-full-scan.ps1",
    "scripts/zap-full-scan.sh",
    "scripts/zap-api-scan.ps1",
    "scripts/zap-api-scan.sh",
    "scripts/zap-authenticated-scan.ps1",
    "scripts/zap-authenticated-scan.sh",
    "scripts/zap-init-session.ps1",
    "scripts/zap-init-session.sh",
    "scripts/zap-explore-helper.ps1",
    "scripts/zap-explore-helper.sh",
    "scripts/zap-verify-openapi.ps1",
    "scripts/zap-verify-openapi.sh",
    "scripts/zap-test-manual-all.ps1",
    "scripts/zap-test-manual-all.sh",
    "scripts/zap-retest.ps1",
    "scripts/zap-retest.sh",
    "scripts/security-test-runner.ps1",
    "scripts/security-test-runner.sh",
    "scripts/scan-secrets.sh",
    "scripts/scan-secrets.ps1",
    "scripts/security-status-snapshot.mjs",
    "scripts/zap-export-findings.mjs",
    "scripts/zap-report-diff.mjs",
    "scripts/security-policy-check.sh",
    "scripts/security-policy-check.ps1",
    ".github/workflows/zap-security-scan.yml",
    "docker-compose.security.yml"
)

foreach ($f in $required) {
    $full = Join-Path $Root $f
    if (Test-Path $full) { Pass $f } else { Fail "missing: $f" }
}

# 2) Test users consistency
Write-Host ""
Write-Host "[2] Test users consistency"
$ctxFile = Join-Path $Root ".zap/contexts/ovds.context"
$jsonFile = Join-Path $Root ".zap/users/test-users.json"

$ctxUsers = (Select-String -Path $ctxFile -Pattern '<user name="([^"]+)"' -AllMatches).Matches |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

$jsonUsers = (Get-Content -LiteralPath $jsonFile -Raw | ConvertFrom-Json).ovds_test_users |
    ForEach-Object { $_.role } | Sort-Object -Unique

foreach ($u in $ctxUsers) {
    if ($jsonUsers -contains $u) {
        Pass "user $u present in test-users.json"
    } else {
        Fail "user $u declared in context but missing from test-users.json"
    }
}

# 3) Dangerous endpoints excluded consistently
Write-Host ""
Write-Host "[3] Dangerous endpoints excluded consistently"
$excludes = (Select-String -Path $ctxFile -Pattern '<exclude>([^<]+)</exclude>' -AllMatches).Matches |
    ForEach-Object { $_.Groups[1].Value }

$autoFile = Join-Path $Root ".zap/automation/ovds-authenticated-scan.yaml"
foreach ($ex in $excludes) {
    if (Select-String -Path $autoFile -Pattern ([regex]::Escape($ex)) -Quiet) {
        Pass "automation YAML also excludes: $($ex.Substring(0, [Math]::Min(60, $ex.Length)))"
    } else {
        if ($Strict) {
            Fail "automation YAML missing exclude: $($ex.Substring(0, [Math]::Min(60, $ex.Length)))"
        } else {
            Warn "automation YAML does not exclude: $($ex.Substring(0, [Math]::Min(60, $ex.Length)))"
        }
    }
}

# 4) ZAP Docker image uses :stable
Write-Host ""
Write-Host "[4] ZAP Docker image tag is :stable"
$imageHits = @()
Get-ChildItem -Path (Join-Path $Root "scripts") -Recurse -File -Include *.ps1,*.sh,*.mjs,*.yml -ErrorAction SilentlyContinue | ForEach-Object {
    $imageHits += Select-String -Path $_.FullName -Pattern 'ghcr\.io/zaproxy/zaproxy:[a-zA-Z0-9._-]+' -AllMatches
}
Get-ChildItem -Path (Join-Path $Root ".github") -Recurse -File -Include *.yml,*.yaml -ErrorAction SilentlyContinue | ForEach-Object {
    $imageHits += Select-String -Path $_.FullName -Pattern 'ghcr\.io/zaproxy/zaproxy:[a-zA-Z0-9._-]+' -AllMatches
}
$images = $imageHits | ForEach-Object { $_.Matches[0].Value } | Sort-Object -Unique
if (-not $images) { $images = @() }

foreach ($img in $images) {
    if ($img -eq "ghcr.io/zaproxy/zaproxy:stable") {
        Pass "image pinned to :stable — $img"
    } else {
        Fail "image not pinned to :stable — $img"
    }
}

# 5) Password entropy
Write-Host ""
Write-Host "[5] Test user password entropy"
$users = (Get-Content -LiteralPath $jsonFile -Raw | ConvertFrom-Json).ovds_test_users
foreach ($u in $users) {
    $p = $u.password
    $lenOk = $p.Length -ge 16
    $upper = $p -cmatch "[A-Z]"
    $lower = $p -cmatch "[a-z]"
    $digit = $p -match "[0-9]"
    $special = $p -cmatch "[^A-Za-z0-9]"
    if ($lenOk -and $upper -and $lower -and $digit -and $special) {
        Pass "password entropy OK for $($u.role) (length=$($p.Length))"
    } else {
        $missing = @()
        if (-not $lenOk) { $missing += "len<16" }
        if (-not $upper) { $missing += "no-upper" }
        if (-not $lower) { $missing += "no-lower" }
        if (-not $digit) { $missing += "no-digit" }
        if (-not $special) { $missing += "no-special" }
        Fail "weak password for $($u.role): $($missing -join ', ')"
    }
}

# 6) Script-based authentication
Write-Host ""
Write-Host "[6] Authentication is script-based (JSON login)"
if (Select-String -Path $ctxFile -Pattern 'method="script"' -Quiet) {
    Pass "context uses script-based authentication"
} else {
    Fail "context still uses form/JSON/etc. — must use method=`"script`" pointing at ovds-json-auth.js"
}

# 7) CI workflow references Phase 6
Write-Host ""
Write-Host "[7] CI workflow references Phase 6 manual tests"
$wf = Join-Path $Root ".github/workflows/zap-security-scan.yml"
if (Select-String -Path $wf -Pattern "zap-test-manual-all" -Quiet) {
    Pass "workflow invokes zap-test-manual-all"
} else {
    Fail "workflow does not invoke Phase 6 manual suite"
}

# 7b) CI workflow uploads secret-scan SARIF
if (Select-String -Path $wf -Pattern "codeql-action/upload-sarif" -Quiet) {
    Pass "workflow uploads secret-scan SARIF to Code Scanning"
} else {
    Warn "workflow missing codeql-action/upload-sarif step for secret scan"
}

# 8) .gitignore excludes sensitive paths
Write-Host ""
Write-Host "[8] Sensitive paths excluded from VCS"
$gitignore = Join-Path $Root ".gitignore"
if (Test-Path $gitignore) {
    foreach ($entry in @("security-reports/", ".zap/session", ".zap/*.session")) {
        if (Select-String -Path $gitignore -Pattern ([regex]::Escape($entry)) -Quiet) {
            Pass ".gitignore contains: $entry"
        } else {
            Warn ".gitignore missing: $entry"
        }
    }
} else {
    Fail ".gitignore missing at repo root"
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Governance Check Summary"
Write-Host "========================================"
Write-Host "Passed:   $pass"
Write-Host "Failed:   $fails"
Write-Host "Warnings: $warnings"
Write-Host ""

if ($fails -gt 0) {
    Write-Host "❌ Security governance violations found" -ForegroundColor Red
    exit 1
}
if ($warnings -gt 0 -and $Strict) {
    Write-Host "❌ Warnings present in strict mode" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Security governance OK" -ForegroundColor Green
exit 0