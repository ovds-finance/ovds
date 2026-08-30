#!/usr/bin/env bash
# Application Readiness Check for Security Testing
# Validates that the OVDS application is properly configured for security testing
# Cross-platform counterpart: scripts/check-app-readiness.ps1
#
# Usage:
#   bash scripts/check-app-readiness.sh [http://localhost:3000]

set -euo pipefail

TARGET_URL="${1:-http://localhost:3000}"
API_URL="${TARGET_URL/http:\/\/localhost:3000/http:\/\/localhost:3001}/api"

echo "========================================"
echo "  OVDS Security Testing Readiness Check"
echo "========================================"
echo "Frontend: $TARGET_URL"
echo "Backend:  $API_URL"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

check() {
  local name="$1"
  local cmd="$2"
  local expected="$3"
  
  echo -n "Checking $name... "
  
  if eval "$cmd" > /dev/null 2>&1; then
    echo "✓ PASS"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo "✗ FAIL"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
}

# Frontend checks
echo "--- Frontend ---"
check "Frontend is running" "curl -s -o /dev/null -w '%{http_code}' '$TARGET_URL' | grep -q '200'" "200"
check "Frontend returns HTML" "curl -s '$TARGET_URL' | grep -qi '<html'" "html"
check "Frontend has login page" "curl -s '$TARGET_URL/login' | grep -qi 'login'" "login"

# Backend checks
echo ""
echo "--- Backend ---"
check "Backend health endpoint" "curl -s -o /dev/null -w '%{http_code}' '$API_URL/health/live' | grep -q '200'" "200"
check "Backend auth endpoint exists" "curl -s -o /dev/null -w '%{http_code}' '$API_URL/auth/login' | grep -qE '405|404|401|200'" "405/404/401"
check "Backend CORS headers" "curl -s -I '$API_URL/health/live' | grep -qi 'access-control'" "cors"

# Authentication checks
echo ""
echo "--- Authentication ---"
check "Login endpoint accepts POST" "curl -s -X POST -H 'Content-Type: application/json' -d '{}' '$API_URL/auth/login' | grep -qE 'email|password|invalid|401'" "email/password"

# API checks
echo ""
echo "--- API ---"
check "Users endpoint exists" "curl -s -o /dev/null -w '%{http_code}' '$API_URL/users' | grep -qE '200|401|403|404'" "200/401/403/404"
check "Settings endpoint exists" "curl -s -o /dev/null -w '%{http_code}' '$API_URL/settings' | grep -qE '200|401|403|404'" "200/401/403/404"

# Security headers checks
echo ""
echo "--- Security Headers ---"
HEADERS=$(curl -s -I "$TARGET_URL" 2>/dev/null || echo "")

check "Content-Type header" "echo '$HEADERS' | grep -qi 'content-type'" "content-type"
check "Server header present" "echo '$HEADERS' | grep -qi 'server'" "server"

# Rate limiting checks
echo ""
echo "--- Rate Limiting ---"
check "Rate limit headers" "curl -s -I '$API_URL/health/live' | grep -qi 'x-ratelimit|retry-after'" "rate limit"

# Summary
echo ""
echo "========================================"
echo "  Readiness Summary"
echo "========================================"
echo "Passed: $CHECKS_PASSED"
echo "Failed: $CHECKS_FAILED"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo "✅ Application is ready for security testing"
  echo ""
  echo "Next steps:"
  echo "  1. Create test users: npm run seed:zap-users"
  echo "  2. Start ZAP: docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d"
  echo "  3. Run scans: bash scripts/security-test-runner.sh all"
  exit 0
else
  echo "❌ Application is NOT ready for security testing"
  echo ""
  echo "Please fix the failed checks before proceeding."
  exit 1
fi
