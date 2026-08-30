#!/usr/bin/env bash
# Security Misconfiguration Checker for OVDS
# Checks for common security misconfigurations in the application
#
# Usage:
#   bash scripts/check-security-config.sh [http://localhost:3000]

set -euo pipefail

TARGET_URL="${1:-http://localhost:3000}"
API_URL="${TARGET_URL/http:\/\/localhost:3000/http:\/\/localhost:3001}/api"

echo "========================================"
echo "  Security Misconfiguration Checker"
echo "========================================"
echo "Target: $TARGET_URL"
echo ""

ISSUES=0
WARNINGS=0

check_issue() {
  local name="$1"
  local severity="$2"
  local result="$3"
  
  if [ "$result" = "FAIL" ]; then
    echo "[$severity] $name"
    if [ "$severity" = "HIGH" ] || [ "$severity" = "CRITICAL" ]; then
      ISSUES=$((ISSUES + 1))
    else
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo "[PASS] $name"
  fi
}

# Check security headers
echo "--- Security Headers ---"
HEADERS=$(curl -s -I "$TARGET_URL" 2>/dev/null || echo "")

check_issue "Content-Security-Policy" "HIGH" "$(echo "$HEADERS" | grep -qi 'content-security-policy' && echo 'PASS' || echo 'FAIL')"
check_issue "X-Content-Type-Options" "MEDIUM" "$(echo "$HEADERS" | grep -qi 'x-content-type-options' && echo 'PASS' || echo 'FAIL')"
check_issue "X-Frame-Options" "HIGH" "$(echo "$HEADERS" | grep -qi 'x-frame-options' && echo 'PASS' || echo 'FAIL')"
check_issue "Strict-Transport-Security" "HIGH" "$(echo "$HEADERS" | grep -qi 'strict-transport-security' && echo 'PASS' || echo 'FAIL')"
check_issue "Referrer-Policy" "LOW" "$(echo "$HEADERS" | grep -qi 'referrer-policy' && echo 'PASS' || echo 'FAIL')"
check_issue "Permissions-Policy" "LOW" "$(echo "$HEADERS" | grep -qi 'permissions-policy' && echo 'PASS' || echo 'FAIL')"

# Check CORS
echo ""
echo "--- CORS Configuration ---"
CORS_HEADERS=$(curl -s -I -H "Origin: https://evil.com" "$API_URL/health/live" 2>/dev/null || echo "")

check_issue "CORS wildcard origin" "HIGH" "$(echo "$CORS_HEADERS" | grep -qi 'access-control-allow-origin: \*' && echo 'FAIL' || echo 'PASS')"
check_issue "CORS credentials with wildcard" "HIGH" "$(echo "$CORS_HEADERS" | grep -qi 'access-control-allow-credentials: true' && echo "$CORS_HEADERS" | grep -qi 'access-control-allow-origin: \*' && echo 'FAIL' || echo 'PASS')"

# Check cookie security
echo ""
echo "--- Cookie Security ---"
COOKIE_HEADERS=$(curl -s -I -c /tmp/cookies.txt "$API_URL/health/live" 2>/dev/null || echo "")

check_issue "Cookies without Secure flag" "HIGH" "$(grep -qi 'Secure' /tmp/cookies.txt 2>/dev/null && echo 'PASS' || echo 'FAIL')"
check_issue "Cookies without HttpOnly flag" "MEDIUM" "$(grep -qi 'HttpOnly' /tmp/cookies.txt 2>/dev/null && echo 'PASS' || echo 'FAIL')"
check_issue "Cookies without SameSite" "MEDIUM" "$(grep -qi 'SameSite' /tmp/cookies.txt 2>/dev/null && echo 'PASS' || echo 'FAIL')"

# Check information disclosure
echo ""
echo "--- Information Disclosure ---"

check_issue "Server version disclosure" "LOW" "$(echo "$HEADERS" | grep -qi 'server:' && echo "$HEADERS" | grep -qiE 'nginx|apache|express' && echo 'FAIL' || echo 'PASS')"
check_issue "X-Powered-By header" "LOW" "$(echo "$HEADERS" | grep -qi 'x-powered-by' && echo 'FAIL' || echo 'PASS')"

# Check error handling
echo ""
echo "--- Error Handling ---"
ERROR_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"invalid": "data"}' "$API_URL/auth/login" 2>/dev/null || echo "")

check_issue "Stack trace in error response" "HIGH" "$(echo "$ERROR_RESPONSE" | grep -qi 'stack trace\|at \|Error:' && echo 'FAIL' || echo 'PASS')"
check_issue "Database error in response" "HIGH" "$(echo "$ERROR_RESPONSE" | grep -qi 'mysql\|postgresql\|sqlite\|database' && echo 'FAIL' || echo 'PASS')"
check_issue "Internal path in response" "MEDIUM" "$(echo "$ERROR_RESPONSE" | grep -qiE '\/home\/|\/var\/www\/|\/usr\/src\/' && echo 'FAIL' || echo 'PASS')"

# Check authentication
echo ""
echo "--- Authentication ---"

check_issue "Login endpoint without rate limiting" "HIGH" "$(curl -s -I -X POST "$API_URL/auth/login" | grep -qi 'retry-after\|x-ratelimit' && echo 'PASS' || echo 'FAIL')"

# Check HTTPS
echo ""
echo "--- Transport Security ---"
check_issue "HTTP instead of HTTPS" "HIGH" "$(echo "$TARGET_URL" | grep -qi '^http://' && echo 'FAIL' || echo 'PASS')"

# Summary
echo ""
echo "========================================"
echo "  Security Configuration Summary"
echo "========================================"
echo "Critical Issues: 0"
echo "High Issues:     $ISSUES"
echo "Warnings:        $WARNINGS"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ No security misconfigurations found"
  exit 0
elif [ $ISSUES -eq 0 ]; then
  echo "⚠️  $WARNINGS warnings found - review recommended"
  exit 0
else
  echo "❌ $ISSUES high/critical issues found - immediate attention required"
  exit 1
fi
