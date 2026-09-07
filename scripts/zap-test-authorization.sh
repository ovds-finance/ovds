#!/usr/bin/env bash
# OVDS Phase 6 — Authorization (IDOR) Test Runner
#
# Bash equivalent of zap-test-authorization.ps1.
# Uses curl + jq only — no python/jq? Then this script will exit early.
#
# Usage:
#   bash scripts/zap-test-authorization.sh [http://localhost:3001]

set -uo pipefail

BACKEND_URL="${1:-http://localhost:3001}"
NORMAL_EMAIL="scanner.user@ovds.local"
NORMAL_PASSWORD="ZapScan#2024!Strong"
ADMIN_EMAIL="scanner.admin@ovds.local"
ADMIN_PASSWORD="ZapRoot#2024!Secure"
DISABLED_EMAIL="scanner.disabled@ovds.local"
DISABLED_PASSWORD="ZapDisabled#2024!Lock"

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required for this script"
  exit 2
fi

PASS=0
FAIL=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  local notes="${4:-}"
  if [ "$expected" = "$actual" ]; then
    echo -e "  \033[32m✓\033[0m $name"
    PASS=$((PASS + 1))
  else
    echo -e "  \033[31m✗\033[0m $name"
    echo "    expected=$expected actual=$actual $notes"
    FAIL=$((FAIL + 1))
  fi
}

extract_token() {
  echo "$1" | jq -r '.access_token // .token // .data.accessToken // .data.token // empty'
}

echo "========================================"
echo "  OVDS Phase 6 — Authorization Tests"
echo "========================================"
echo "Backend: $BACKEND_URL"
echo ""

# Login users
NORMAL_RAW=$(curl -sS -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"$NORMAL_EMAIL\",\"password\":\"$NORMAL_PASSWORD\"}" \
  "$BACKEND_URL/api/auth/login" || echo '{}')
ADMIN_RAW=$(curl -sS -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  "$BACKEND_URL/api/auth/login" || echo '{}')
DISABLED_RAW=$(curl -sS -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DISABLED_EMAIL\",\"password\":\"$DISABLED_PASSWORD\"}" \
  "$BACKEND_URL/api/auth/login" || echo '{}')

NORMAL_TOKEN=$(extract_token "$NORMAL_RAW")
ADMIN_TOKEN=$(extract_token "$ADMIN_RAW")
DISABLED_TOKEN=$(extract_token "$DISABLED_RAW")

[ -z "$NORMAL_TOKEN" ] && { echo "✗ Normal login failed"; exit 1; }
[ -z "$ADMIN_TOKEN" ] && { echo "✗ Admin login failed"; exit 1; }
echo "  ✓ Logged in: $NORMAL_EMAIL"
echo "  ✓ Logged in: $ADMIN_EMAIL"
echo ""

# 1) Authenticated profile access
echo "[1] Normal user authenticated access"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $NORMAL_TOKEN" \
  "$BACKEND_URL/api/users/me")
check "GET /api/users/me with normal token" 200 "$S"

# 2) Unauthenticated request blocked
echo ""
echo "[2] Unauthenticated request blocked"
S=$(curl -s -o /dev/null -w '%{http_code}' "$BACKEND_URL/api/users/me")
check "GET /api/users/me without token" 401 "$S"

# 3) Disabled user rejected
echo ""
echo "[3] Disabled user cannot authenticate"
[ -n "$DISABLED_TOKEN" ] && check "Disabled login rejected" 403 200 "Disabled account got a token!" || check "Disabled login rejected" 403 403

# 4) Normal user blocked from admin endpoints
echo ""
echo "[4] Normal user cannot reach admin endpoints"
for ep in /api/admin/users /api/admin/tenants /api/admin/security/policies; do
  S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $NORMAL_TOKEN" "$BACKEND_URL$ep")
  check "Normal GET $ep" 403 "$S"
done

# 5) Mass-assignment of companyId
echo ""
echo "[5] Mass-assignment of companyId rejected"
S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $NORMAL_TOKEN" \
  -d '{"name":"Fake Co","companyId":"00000000-0000-0000-0000-000000000099"}' \
  "$BACKEND_URL/api/companies")
check "POST /api/companies with body.companyId" 403 "$S"

# 6) x-company-id header spoofing
echo ""
echo "[6] Spoofed x-company-id header ignored"
S=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer $NORMAL_TOKEN" \
  -H 'x-company-id: attacker-tenant' \
  "$BACKEND_URL/api/companies")
check "Spoofed x-company-id rejected" 403 "$S"

# 7) Open redirect
echo ""
echo "[7] Open redirect blocked"
S=$(curl -s -o /dev/null -w '%{http_code}' "$BACKEND_URL/api/auth/callback?redirect=https://attacker.example/")
check "Open redirect to attacker.example" 400 "$S"

echo ""
echo "========================================"
echo "  Authorization Tests Complete"
echo "========================================"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo "Total:  $((PASS + FAIL))"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0