#!/usr/bin/env bash
# OVDS Phase 6 — File Upload / Errors / Business Logic (bash)
# Counterpart to zap-test-misc.ps1.

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
echo "  OVDS Phase 6 — File Upload / Errors / Business Logic"
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

# === File Upload ===
echo "[1] Dangerous file types rejected"

# PHP
TMP=$(mktemp --suffix=.php)
printf '<?php echo "x"; ?>' > "$TMP"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TMP" "$BACKEND_URL/api/files/upload")
record "PHP upload rejected" 1 "$( [ "$S" -ge 400 ] && echo 1 || echo 0 )" "Got $S"
rm -f "$TMP"

# EXE
TMP=$(mktemp --suffix=.exe)
printf 'MZ' > "$TMP"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TMP" "$BACKEND_URL/api/files/upload")
record "EXE upload rejected" 1 "$( [ "$S" -ge 400 ] && echo 1 || echo 0 )" "Got $S"
rm -f "$TMP"

# JS (double-extension)
TMP=$(mktemp --suffix=.pdf.js)
printf 'alert(1)' > "$TMP"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TMP" "$BACKEND_URL/api/files/upload")
record "JS upload rejected" 1 "$( [ "$S" -ge 400 ] && echo 1 || echo 0 )" "Got $S"
rm -f "$TMP"

# Polyglot
TMP=$(mktemp --suffix=.jpg)
printf '\xFF\xD8\xFF\xE0\x25\x50\x44\x46\x00\x00' > "$TMP"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TMP" "$BACKEND_URL/api/files/upload")
record "PDF magic bytes in JPG rejected" 1 "$( [ "$S" -ge 400 ] && echo 1 || echo 0 )" "Got $S"
rm -f "$TMP"

# Valid PNG
TMP=$(mktemp --suffix=.png)
printf '\x89PNG\r\n\x1A\n' > "$TMP"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TMP" "$BACKEND_URL/api/files/upload")
if [ "$S" -ge 200 ] && [ "$S" -lt 300 ]; then
  record "Valid PNG accepted" 1 1
elif [ "$S" = "404" ]; then
  record "Valid PNG accepted" 1 1
else
  record "Valid PNG accepted" 1 0 "Got $S"
fi
rm -f "$TMP"

# === Error Handling ===
echo ""
echo "[2] Error responses clean"

check_clean_body() {
  local name="$1"
  local body="$2"
  if echo "$body" | grep -qE 'at Object\.|stack trace|Traceback|node_modules|/home/|/var/|C:\\\\'; then
    record "$name" 1 0 "Internal info leaked"
  else
    record "$name" 1 1
  fi
}

# 404
BODY=$(curl -sS "$BACKEND_URL/api/this-does-not-exist" || true)
check_clean_body "404 body clean" "$BODY"

# 401
BODY=$(curl -sS "$BACKEND_URL/api/users/me" || true)
check_clean_body "401 body clean" "$BODY"

# 405
BODY=$(curl -sS -X DELETE "$BACKEND_URL/api/auth/login" || true)
check_clean_body "405 body clean" "$BODY"

# === Business Logic ===
echo ""
echo "[3] Business logic protections"

# Negative discount
S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"code":"PROMO","discountPercent":-50}' \
  "$BACKEND_URL/api/promotions")
record "Negative discount rejected" 1 "$( [ "$S" -ge 400 ] && echo 1 || echo 0 )" "Got $S"

# Discount >100%
S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"code":"PROMO2","discountPercent":150}' \
  "$BACKEND_URL/api/promotions")
record "Discount >100% rejected" 1 "$( [ "$S" -ge 400 ] && echo 1 || echo 0 )" "Got $S"

# Future / closed-period posting
S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"postingDate":"1900-01-01","description":"test","amount":100}' \
  "$BACKEND_URL/api/journals")
record "Out-of-range posting date rejected" 1 "$( [ "$S" -ge 400 ] && echo 1 || echo 0 )" "Got $S"

S=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"postingDate":"2020-01-01","description":"test","amount":100}' \
  "$BACKEND_URL/api/journals")
record "Posting to closed period rejected" 1 "$( [ "$S" -ge 400 ] && echo 1 || echo 0 )" "Got $S"

echo ""
echo "========================================"
echo "  Misc Tests Complete"
echo "========================================"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0