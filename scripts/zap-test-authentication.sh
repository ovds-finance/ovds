#!/usr/bin/env bash
# OVDS Phase 6 — Authentication Tests (bash)
# Counterpart to zap-test-authentication.ps1.

set -uo pipefail

BACKEND_URL="${1:-http://localhost:3001}"

PASS=0
FAIL=0

record() {
  local name="$1" expected="$2" actual="$3" notes="${4:-}"
  if [ "$expected" = "$actual" ]; then
    echo -e "  \033[32m✓\033[0m $name"
    PASS=$((PASS + 1))
  else
    echo -e "  \033[31m✗\033[0m $name"
    echo "    expected=$expected actual=$actual $notes"
    FAIL=$((FAIL + 1))
  fi
}

echo "========================================"
echo "  OVDS Phase 6 — Authentication Tests"
echo "========================================"
echo "Backend: $BACKEND_URL"
echo ""

# 1) Unknown user rejected
echo "[1] Invalid credentials rejected"
S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -d '{"email":"nobody@ovds.local","password":"wrong"}' \
  "$BACKEND_URL/api/auth/login")
record "Unknown user rejected" 401 "$S"

# 2) Indistinguishable errors
echo ""
echo "[2] Identical error responses"
B1=$(curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"email":"scanner.user@ovds.local","password":"definitely-wrong"}' \
  "$BACKEND_URL/api/auth/login" || true)
B2=$(curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"email":"nobody-12345@ovds.local","password":"definitely-wrong"}' \
  "$BACKEND_URL/api/auth/login" || true)
NORM1=$(echo "$B1" | sed 's/scanner\.user/X/g')
NORM2=$(echo "$B2" | sed 's/nobody-12345/X/g')
if [ "$NORM1" = "$NORM2" ] && [ -n "$NORM1" ]; then
  record "Identical error messages" 1 1
else
  record "Identical error messages" 1 0 "Different bodies"
fi

# 3) Password reset
echo ""
echo "[3] Password reset token handling"
S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -d '{"email":"scanner.user@ovds.local"}' \
  "$BACKEND_URL/api/auth/forgot-password")
record "Forgot-password request accepted" 200 "$S"

S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -d '{"newPassword":"NewP@ssw0rd!2024"}' \
  "$BACKEND_URL/api/auth/reset-password?token=fake_token_xxx")
record "Fake reset token rejected" 400 "$S"

# 4) Disabled user
echo ""
echo "[4] Disabled account cannot authenticate"
S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -d '{"email":"scanner.disabled@ovds.local","password":"ZapDisabled#2024!Lock"}' \
  "$BACKEND_URL/api/auth/login")
record "Disabled login rejected" 403 "$S"

# 5) URL token ignored
echo ""
echo "[5] Token in URL is ignored"
S=$(curl -s -o /dev/null -w '%{http_code}' \
  "$BACKEND_URL/api/users/me?access_token=anything")
record "URL token ignored" 401 "$S"

# 6) Token not reflected in response
echo ""
echo "[6] Sensitive headers not reflected"
HEAD=$(curl -sI -H 'Authorization: Bearer fake' "$BACKEND_URL/api/health/live" || true)
if echo "$HEAD" | grep -q "fake" && ! echo "$HEAD" | grep -qi "^authorization:"; then
  record "Token not reflected in response" 1 0 "Token leaked"
else
  record "Token not reflected in response" 1 1
fi

echo ""
echo "========================================"
echo "  Authentication Tests Complete"
echo "========================================"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0