#!/usr/bin/env pwsh
# OVDS Phase 1 — Manual Exploration Helper
#
# Prints the ZAP Desktop browser proxy configuration, the application URL
# checklist (every public page + every role-protected page that the operator
# must visit manually through ZAP), and verifies the proxy endpoint is
# reachable before manual exploration starts.
#
# Usage:
#   pwsh -File scripts/zap-explore-helper.ps1
#   pwsh -File scripts/zap-explore-helper.ps1 -ZapProxy http://localhost:8080 -FrontendUrl http://localhost:3000

param(
    [string]$ZapProxy = "http://localhost:8080",
    [string]$ZapApiKey = "ovds-zap-secret",
    [string]$FrontendUrl = "http://localhost:3000",
    [string]$BackendUrl = "http://localhost:3001"
)

$ErrorActionPreference = "Continue"

Write-Host "========================================"
Write-Host "  OVDS Phase 1 — Manual Exploration Helper"
Write-Host "========================================"
Write-Host ""

# 1) Verify ZAP is up
Write-Host "[1] Verifying ZAP is reachable"
try {
    $zap = Invoke-RestMethod -Uri "$ZapProxy/JSON/core/view/version/?apikey=$ZapApiKey" -TimeoutSec 10
    Write-Host "  ✓ ZAP $($zap.version) reachable at $ZapProxy" -ForegroundColor Green
} catch {
    Write-Host "  ✗ ZAP not reachable at $ZapProxy — start ZAP Desktop first" -ForegroundColor Red
    exit 1
}

# 2) Print proxy configuration for ZAP Desktop browser launch
Write-Host ""
Write-Host "[2] ZAP Desktop browser proxy configuration"
Write-Host "    When launching the browser through ZAP Desktop (Quick Start → Manual Explore)"
Write-Host "    the following settings are applied automatically:"
Write-Host "      - HTTP proxy:  127.0.0.1:8080"
Write-Host "      - HTTPS proxy: 127.0.0.1:8080"
Write-Host "      - API key:     $ZapApiKey"
Write-Host "      - Cert:        ZAP's auto-generated CA cert (browser ignores the warning)"
Write-Host ""
Write-Host "    If you prefer to configure the browser manually:"
Write-Host "      - Chromium:    --proxy-server=`"$ZapProxy`" --ignore-certificate-errors"
Write-Host "      - Firefox:     Network Settings → Manual proxy → HTTP/HTTPS = 127.0.0.1:8080"
Write-Host "                        → Add Exception → ZAP Root CA certificate"
Write-Host ""

# 3) URL checklist
Write-Host "[3] Application URL checklist — visit each through ZAP"

$categories = @(
    @{ name = "Public (no auth)";     urls = @(
        "$FrontendUrl/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/docs",
        "/getting-started",
        "/landing"
    ) },
    @{ name = "Normal user (EMPLOYEE)"; urls = @(
        "/dashboard",
        "/invoices", "/invoices/new",
        "/customers", "/vendors",
        "/payments", "/reports",
        "/profile", "/settings",
        "/notifications"
    ) },
    @{ name = "Supervisor";           urls = @(
        "/approvals", "/approvals/pending",
        "/team", "/reports/team"
    ) },
    @{ name = "Administrator";         urls = @(
        "/admin/users", "/admin/tenants",
        "/admin/security", "/admin/audit",
        "/admin/system", "/admin/modules",
        "/admin/integrations"
    ) },
    @{ name = "Banking / Payments";   urls = @(
        "/banking/accounts", "/banking/transfers",
        "/banking/reconciliation",
        "/treasury/forecast", "/treasury/collections"
    ) },
    @{ name = "Compliance / EIMS";    urls = @(
        "/compliance/eims/dashboard",
        "/compliance/eims/invoices",
        "/compliance/eims/receipts",
        "/compliance/audit",
        "/compliance/checklists"
    ) }
)

foreach ($cat in $categories) {
    Write-Host ""
    Write-Host "    [$($cat.name)]" -ForegroundColor Cyan
    foreach ($u in $cat.urls) {
        Write-Host "      - $u"
    }
}

Write-Host ""
Write-Host "[4] After exploration completes"
Write-Host "    1. Wait for ZAP's passive scan queue to reach 0"
Write-Host "       (View → Passive Scan Queue, or via API: /JSON/pscan/view/recordsToScan/)"
Write-Host "    2. Review passive alerts (View → Alerts)"
Write-Host "    3. Save the ZAP session: File → Save Session..."
Write-Host ""
Write-Host "[5] Then proceed to Phase 2 (Spider) and Phase 3 (Auth config)"

# 4) Try to fetch some pages to seed the Sites tree automatically
Write-Host ""
Write-Host "[6] Seeding Sites tree with seed URLs (HEAD requests through ZAP not required)"
$seedUrls = @(
    "$FrontendUrl/",
    "$BackendUrl/api/health/live",
    "$BackendUrl/api/openapi.json",
    "$BackendUrl/api/docs"
)

foreach ($u in $seedUrls) {
    try {
        $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 5 -Method HEAD
        Write-Host "    ✓ $u -> $($r.StatusCode)" -ForegroundColor Green
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "    ✗ $u -> $code" -ForegroundColor Red
    }
}