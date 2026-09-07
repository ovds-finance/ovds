#!/usr/bin/env bash
# OVDS Phase 1 — Manual Exploration Helper (Linux/macOS)
# Counterpart to scripts/zap-explore-helper.ps1.
#
# Prints the ZAP Desktop browser proxy configuration, the application URL
# checklist, and verifies the proxy endpoint is reachable before manual
# exploration starts.
#
# Usage:
#   bash scripts/zap-explore-helper.sh
#   bash scripts/zap-explore-helper.sh --zap-proxy http://localhost:8080

set -euo pipefail

ZAP_PROXY="${ZAP_PROXY:-http://localhost:8080}"
ZAP_API_KEY="${ZAP_API_KEY:-ovds-zap-secret}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --zap-proxy)   ZAP_PROXY="$2";   shift 2 ;;
        --zap-key)     ZAP_API_KEY="$2"; shift 2 ;;
        --frontend)    FRONTEND_URL="$2"; shift 2 ;;
        --backend)     BACKEND_URL="$2"; shift 2 ;;
        --help|-h)     sed -n '2,18p' "$0"; exit 0 ;;
        *) echo "Unknown option: $1" >&2; exit 2 ;;
    esac
done

echo "========================================"
echo "  OVDS Phase 1 — Manual Exploration Helper"
echo "========================================"
echo ""

# 1) Verify ZAP is up
echo "[1] Verifying ZAP is reachable"
if command -v curl >/dev/null 2>&1; then
    if curl -fsS "${ZAP_PROXY}/JSON/core/view/version/?apikey=${ZAP_API_KEY}" -o /tmp/zap-version.json 2>/dev/null; then
        ZAP_VERSION=$(grep -oP '"version"\s*:\s*"\K[^"]+' /tmp/zap-version.json 2>/dev/null || echo "unknown")
        echo "  ✓ ZAP ${ZAP_VERSION} reachable at ${ZAP_PROXY}"
    else
        echo "  ✗ ZAP not reachable at ${ZAP_PROXY} — start ZAP Desktop first" >&2
        exit 1
    fi
else
    echo "  ! curl not found, skipping ZAP reachability check" >&2
fi
rm -f /tmp/zap-version.json 2>/dev/null || true

# 2) Proxy configuration
echo ""
echo "[2] ZAP Desktop browser proxy configuration"
echo "    When launching the browser through ZAP Desktop (Quick Start → Manual Explore)"
echo "    the following settings are applied automatically:"
echo "      - HTTP proxy:  127.0.0.1:8080"
echo "      - HTTPS proxy: 127.0.0.1:8080"
echo "      - API key:     ${ZAP_API_KEY}"
echo "      - Cert:        ZAP's auto-generated CA cert (browser ignores the warning)"
echo ""
echo "    If you prefer to configure the browser manually:"
echo "      - Chromium:    --proxy-server=\"${ZAP_PROXY}\" --ignore-certificate-errors"
echo "      - Firefox:     Network Settings → Manual proxy → HTTP/HTTPS = 127.0.0.1:8080"
echo "                        → Add Exception → ZAP Root CA certificate"
echo ""

# 3) URL checklist
echo "[3] Application URL checklist — visit each through ZAP"
echo ""
echo "    [Public (no auth)]"
for u in "/" "/login" "/register" "/forgot-password" "/reset-password" "/docs" "/getting-started" "/landing"; do
    echo "      - ${FRONTEND_URL}${u}"
done
echo ""
echo "    [Normal user (EMPLOYEE)]"
for u in "/dashboard" "/invoices" "/invoices/new" "/customers" "/vendors" "/payments" "/reports" "/profile" "/settings" "/notifications"; do
    echo "      - ${FRONTEND_URL}${u}"
done
echo ""
echo "    [Supervisor]"
for u in "/approvals" "/approvals/pending" "/team" "/reports/team"; do
    echo "      - ${FRONTEND_URL}${u}"
done
echo ""
echo "    [Administrator]"
for u in "/admin/users" "/admin/tenants" "/admin/security" "/admin/audit" "/admin/system" "/admin/modules" "/admin/integrations"; do
    echo "      - ${FRONTEND_URL}${u}"
done
echo ""
echo "    [Banking / Payments]"
for u in "/banking/accounts" "/banking/transfers" "/banking/reconciliation" "/treasury/forecast" "/treasury/collections"; do
    echo "      - ${FRONTEND_URL}${u}"
done
echo ""
echo "    [Compliance / EIMS]"
for u in "/compliance/eims/dashboard" "/compliance/eims/invoices" "/compliance/eims/receipts" "/compliance/audit" "/compliance/checklists"; do
    echo "      - ${FRONTEND_URL}${u}"
done

echo ""
echo "[4] After exploration completes"
echo "    1. Wait for ZAP's passive scan queue to reach 0"
echo "       (View → Passive Scan Queue, or via API: /JSON/pscan/view/recordsToScan/)"
echo "    2. Review passive alerts (View → Alerts)"
echo "    3. Save the ZAP session: File → Save Session..."
echo ""
echo "[5] Then proceed to Phase 2 (Spider) and Phase 3 (Auth config)"

# 4) Seed the Sites tree
echo ""
echo "[6] Seeding Sites tree with seed URLs (HEAD requests)"
for u in "${FRONTEND_URL}/" "${BACKEND_URL}/api/health/live" "${BACKEND_URL}/api/openapi.json" "${BACKEND_URL}/api/docs"; do
    if command -v curl >/dev/null 2>&1; then
        code=$(curl -s -o /dev/null -w '%{http_code}' -I -m 5 "$u" 2>/dev/null || echo "000")
        if [[ "$code" =~ ^(2|3) ]]; then
            echo "    ✓ $u -> $code"
        else
            echo "    ✗ $u -> $code"
        fi
    fi
done
