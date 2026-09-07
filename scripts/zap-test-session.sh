#!/usr/bin/env bash
# OVDS Phase 6 — Session Management Tests (bash)
# Counterpart to zap-test-session.ps1 for Linux/macOS CI.

set -uo pipefail

BACKEND_URL="${1:-http://localhost:3001}"
EMAIL="scanner.user@ovds.local"
PASSWORD="ZapScan#2024!Strong"

PASS=0
FAIL=0

record() {
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

echo "========================================"
echo "  OVDS Phase 6 — Session Management"
echo "========================================"
echo "Backend: $BACKEND_URL"
echo ""

# 1) Login: capture Set-Cookie + body token
echo "[1] Login response"
COOKIES=$(mktemp)
LOGIN_HEADERS=$(curl -sS -D - -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -c "$COOKIES" "$BACKEND_URL/api/auth/login" -o /dev/null -w '%{http_code}')
record "POST /api/auth/login" 200 "$LOGIN_HEADERS"

SET_COOKIE=$(grep -i '^set-cookie:' < <(curl -sS -D - -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BACKEND_URL/api/auth/login" -o /dev/null) || true)

if echo "$SET_COOKIE" | grep -qi HttpOnly; then
  record "Auth cookie HttpOnly" 1 1
else
  record "Auth cookie HttpOnly" 1 0 "Cookie missing HttpOnly"
fi

if echo "$SET_COOKIE" | grep -qi SameSite; then
  record "Auth cookie SameSite" 1 1
else
  record "Auth cookie SameSite" 1 0 "Cookie missing SameSite"
fi

TOKEN=$(curl -sS -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BACKEND_URL/api/auth/login" | grep -oP '"access_token"\s*:\s*"\K[^"]+')

# 2) Token accepted
echo ""
echo "[2] Access token works"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" \
  "$BACKEND_URL/api/users/me")
record "GET /api/users/me with token" 200 "$S"

# 3) Logout invalidates token
echo ""
echo "[3] Logout invalidates token"
curl -sS -X POST -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/auth/logout" >/dev/null || true
sleep 1
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/users/me")
record "Token rejected after logout" 401 "$S"

# 4) Cookie attributes on re-login
echo ""
echo "[4] Cookie attributes"
SET_COOKIE=$(curl -sS -D - -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BACKEND_URL/api/auth/login" -o /dev/null || true)
if echo "$SET_COOKIE" | grep -qi HttpOnly && echo "$SET_COOKIE" | grep -qi SameSite; then
  record "HttpOnly + SameSite on login" 1 1
else
  record "HttpOnly + SameSite on login" 1 0
fi

# 5) Malformed JWT rejected
echo ""
echo "[5] Malformed JWT rejected"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer not.a.real.token" \
  "$BACKEND_URL/api/users/me")
record "Tampered JWT rejected" 401 "$S"

rm -f "$COOKIES"

echo ""
echo "========================================"
echo "  Session Tests Complete"
echo "========================================"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0