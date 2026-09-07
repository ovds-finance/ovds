#!/usr/bin/env bash
# OVDS Phase 6 — Master Manual Test Runner (bash)
# Counterpart to zap-test-manual-all.ps1.

set -uo pipefail

BACKEND_URL="${1:-http://localhost:3001}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GLOBAL_PASS=0
GLOBAL_FAIL=0
SUITE_RESULTS=()

run_suite() {
  local name="$1"
  local script="$2"
  echo ""
  echo "========================================"
  echo "  Suite: $name"
  echo "========================================"
  if bash "$SCRIPT_DIR/$script" "$BACKEND_URL"; then
    GLOBAL_PASS=$((GLOBAL_PASS + 1))
    SUITE_RESULTS+=("PASS $name")
  else
    GLOBAL_FAIL=$((GLOBAL_FAIL + 1))
    SUITE_RESULTS+=("FAIL $name")
  fi
}

echo "========================================"
echo "  OVDS Phase 6 — Master Manual Suite"
echo "========================================"
echo "Backend: $BACKEND_URL"
echo ""

run_suite "Authentication"          "zap-test-authentication.sh"
run_suite "Authorization (IDOR)"    "zap-test-authorization.sh"
run_suite "Session Management"      "zap-test-session.sh"
run_suite "Input Validation"        "zap-test-input-validation.sh"
run_suite "File Upload / Errors / Business Logic" "zap-test-misc.sh"
run_suite "Rate Limiting"           "zap-test-rate-limit.sh"

echo ""
echo "========================================"
echo "  Phase 6 — Final Summary"
echo "========================================"
for line in "${SUITE_RESULTS[@]}"; do
  echo "  $line"
done

echo ""
echo "Suites passed: $GLOBAL_PASS"
echo "Suites failed: $GLOBAL_FAIL"
echo ""

if [ "$GLOBAL_FAIL" -gt 0 ]; then exit 1; fi
exit 0