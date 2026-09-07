#!/usr/bin/env bash
# OVDS Phase 6 — Rate Limiting & Abuse Controls (bash)
# Counterpart to zap-test-rate-limit.ps1.

set -uo pipefail

BACKEND_URL="${1:-http://localhost:3001}"
BURST_SIZE="${3:-60}"

PASS=0
FAIL=0

echo "========================================"
echo "  OVDS Phase 6 — Rate Limiting Tests"
echo "========================================"
echo "Backend: $BACKEND_URL"
echo "Burst:   $BURST_SIZE requests"
echo ""

echo "[1] Burst login attempts trigger 429"
GOT_429=0
LAST=200
for i in $(seq 1 "$BURST_SIZE"); do
  LAST=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
    -d '{"email":"scanner.user@ovds.local","password":"wrong"}' \
    "$BACKEND_URL/api/auth/login")
  if [ "$LAST" = "429" ]; then
    GOT_429=1
    echo "  → throttled at request #$i" >&2
    break
  fi
done

if [ "$GOT_429" = "1" ]; then
  echo -e "  \033[32m✓\033[0m Rate limit triggered"
  PASS=$((PASS + 1))
else
  echo -e "  \033[31m✗\033[0m No 429 after $BURST_SIZE attempts (last=$LAST)"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "========================================"
echo "  Rate Limit Tests Complete"
echo "========================================"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0