#!/usr/bin/env bash
# OVDS Phase 6 — Input Validation Tests (bash)
# Counterpart to zap-test-input-validation.ps1.

set -uo pipefail

BACKEND_URL="${1:-http://localhost:3001}"
EMAIL="scanner.user@ovds.local"
PASSWORD="ZapScan#2024!Strong"

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
echo "  OVDS Phase 6 — Input Validation"
echo "========================================"
echo "Backend: $BACKEND_URL"
echo ""

TOKEN=$(curl -sS -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BACKEND_URL/api/auth/login" | grep -oP '"access_token"\s*:\s*"\K[^"]+')

if [ -z "$TOKEN" ]; then
  echo "✗ Login failed"
  exit 1
fi

# 1) SQL injection in search
echo "[1] SQL injection payloads"
for payload in "'%20OR%20'1'='1" "1'%20UNION%20SELECT%20NULL--" "';%20DROP%20TABLE%20users;%20--"; do
  BODY=$(curl -sS -H "Authorization: Bearer $TOKEN" \
    "$BACKEND_URL/api/invoices?search=$payload" || true)
  if echo "$BODY" | grep -qiE 'SQL syntax|mysql_|ORA-|PostgreSQL|SQLSTATE|unterminated quoted string'; then
    record "SQLi rejected (${payload:0:15}...)" 1 0 "SQL error in body!"
  else
    record "SQLi rejected" 1 1
  fi
done

# 2) XSS
echo ""
echo "[2] XSS payloads"
PAYLOAD=$(printf '%s' "<script>alert('XSS')</script>" | jq -sRr @uri)
BODY=$(curl -sS -H "Authorization: Bearer $TOKEN" \
  "$BACKEND_URL/api/customers?name=$PAYLOAD" || true)
if echo "$BODY" | grep -q "<script>alert('XSS')</script>"; then
  record "XSS reflected" 1 0 "Script tag in body!"
else
  record "XSS reflected" 1 1
fi

# 3) Path traversal
echo ""
echo "[3] Path traversal"
for payload in "..%2F..%2F..%2Fetc%2Fpasswd" "..%5C..%5C..%5Cwindows%5Cwin.ini"; do
  BODY=$(curl -sS -H "Authorization: Bearer $TOKEN" \
    "$BACKEND_URL/api/files/download?path=$payload" || true)
  if echo "$BODY" | grep -qE 'root:x:0:0|for 16-bit app support'; then
    record "Path traversal blocked" 1 0 "Sensitive content leaked!"
  else
    record "Path traversal blocked" 1 1
  fi
done

# 4) Open redirect
echo ""
echo "[4] Open redirect"
for payload in "https%3A%2F%2Fattacker.example%2F" "%2F%2Fattacker.example%2F" "javascript%3Aalert(1)"; do
  HEADERS=$(curl -sS -I -H "Authorization: Bearer $TOKEN" \
    "$BACKEND_URL/api/auth/callback?redirect=$payload" 2>/dev/null || true)
  LOC=$(echo "$HEADERS" | grep -i '^location:' | head -1)
  if echo "$LOC" | grep -qi 'attacker.example\|javascript:'; then
    record "Open redirect blocked" 1 0 "Redirected to $LOC"
  else
    record "Open redirect blocked" 1 1
  fi
done

# 5) Negative quantity
echo ""
echo "[5] Numeric validation"
S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"quantity":-1,"unitPrice":10}' \
  "$BACKEND_URL/api/invoices/items")
if [ "$S" = "400" ] || [ "$S" = "422" ]; then
  record "Negative quantity rejected" 1 1
else
  record "Negative quantity rejected" 1 0 "Got $S"
fi

# 6) Oversized payload
echo ""
echo "[6] Oversized payload"
BIG=$(printf 'A%.0s' $(seq 1 50000))
S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"$BIG\"}" \
  "$BACKEND_URL/api/customers")
if [ "$S" = "400" ] || [ "$S" = "413" ] || [ "$S" = "422" ]; then
  record "Oversized payload rejected" 1 1
else
  record "Oversized payload rejected" 1 0 "Got $S"
fi

# 7) Wrong Content-Type
echo ""
echo "[7] Wrong Content-Type"
S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: text/xml' \
  -d '<customer><name>foo</name></customer>' \
  "$BACKEND_URL/api/customers")
if [ "$S" -ge 400 ] 2>/dev/null; then
  record "Wrong Content-Type rejected" 1 1
else
  record "Wrong Content-Type rejected" 1 0 "Got $S"
fi

echo ""
echo "========================================"
echo "  Input Validation Tests Complete"
echo "========================================"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0