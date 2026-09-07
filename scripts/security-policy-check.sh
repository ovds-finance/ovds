#!/usr/bin/env bash
# OVDS Security Governance Check
#
# Verifies that the security/ZAP configuration is complete, current, and
# matches the policies declared in:
#   - .zap/contexts/ovds.context
#   - .zap/policies/ovds-scan.policy
#   - .zap/users/test-users.json
#   - .github/workflows/zap-security-scan.yml
#
# Fails CI if any of the following drift:
#   - .zap files referenced from automation YAMLs are missing
#   - Test users in context file are not in test-users.json
#   - Excluded dangerous URLs in context are also excluded in automation YAMLs
#   - ZAP Docker image tag is not "stable"
#   - Test-user password entropy below threshold
#
# Usage:
#   bash scripts/security-policy-check.sh
#   bash scripts/security-policy-check.sh --strict

set -uo pipefail

ROOT="${ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
STRICT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict) STRICT=true; shift ;;
    --help)   sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

PASS=0
FAIL=0
WARN=0

pass() { echo -e "  \033[32m✓\033[0m $1"; PASS=$((PASS+1)); }
fail() { echo -e "  \033[31m✗\033[0m $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  \033[33m⚠\033[0m $1"; WARN=$((WARN+1)); }

echo "========================================"
echo "  OVDS Security Governance Check"
echo "========================================"
echo "Root:   $ROOT"
echo ""

# 1) Required files exist
echo "[1] Required configuration files"
for f in \
  ".zap/contexts/ovds.context" \
  ".zap/policies/ovds-scan.policy" \
  ".zap/users/test-users.json" \
  ".zap/automation/ovds-authenticated-scan.yaml" \
  ".zap/automation/ovds-api-scan.yaml" \
  ".zap/scripts/authentication/ovds-json-auth.js" \
  "scripts/zap-baseline.ps1" \
  "scripts/zap-baseline.sh" \
  "scripts/zap-full-scan.ps1" \
  "scripts/zap-full-scan.sh" \
  "scripts/zap-authenticated-scan.ps1" \
  "scripts/zap-authenticated-scan.sh" \
  "scripts/zap-api-scan.ps1" \
  "scripts/zap-api-scan.sh" \
  "scripts/zap-init-session.ps1" \
  "scripts/zap-init-session.sh" \
  "scripts/zap-explore-helper.ps1" \
  "scripts/zap-explore-helper.sh" \
  "scripts/zap-verify-openapi.ps1" \
  "scripts/zap-verify-openapi.sh" \
  "scripts/zap-test-manual-all.ps1" \
  "scripts/zap-test-manual-all.sh" \
  "scripts/zap-retest.ps1" \
  "scripts/zap-retest.sh" \
  "scripts/security-test-runner.ps1" \
  "scripts/security-test-runner.sh" \
  "scripts/scan-secrets.sh" \
  "scripts/scan-secrets.ps1" \
  "scripts/security-status-snapshot.mjs" \
  "scripts/zap-export-findings.mjs" \
  "scripts/zap-report-diff.mjs" \
  "scripts/security-policy-check.sh" \
  "scripts/security-policy-check.ps1" \
  ".github/workflows/zap-security-scan.yml" \
  "docker-compose.security.yml"
do
  if [[ -f "$ROOT/$f" ]]; then pass "$f"; else fail "missing: $f"; fi
done

# 2) Test users in context file match test-users.json
echo ""
echo "[2] Test users consistency"
CTX_USERS=$(grep -oP '<user name="[^"]+"' "$ROOT/.zap/contexts/ovds.context" | sed 's/<user name="//' | sort)
JSON_USERS=$(grep -oP '"role"\s*:\s*"[^"]+"' "$ROOT/.zap/users/test-users.json" | sed 's/"role": "//' | sed 's/"//' | sort)
for u in $CTX_USERS; do
  if echo "$JSON_USERS" | grep -qx "$u"; then
    pass "user $u present in test-users.json"
  else
    fail "user $u declared in context but missing from test-users.json"
  fi
done

# 3) Context excludes are also excluded in automation YAMLs
echo ""
echo "[3] Dangerous endpoints excluded consistently"
EXCLUDES=$(grep -oP '<exclude>\K[^<]+' "$ROOT/.zap/contexts/ovds.context" | sort -u)
for ex in $EXCLUDES; do
  count=$(grep -c "$ex" "$ROOT/.zap/automation/ovds-authenticated-scan.yaml" 2>/dev/null || echo 0)
  if [[ "$count" -gt 0 ]]; then
    pass "automation YAML also excludes: $(echo "$ex" | head -c 60)"
  else
    if $STRICT; then
      fail "automation YAML missing exclude: $(echo "$ex" | head -c 60)"
    else
      warn "automation YAML does not exclude: $(echo "$ex" | head -c 60)"
    fi
  fi
done

# 4) ZAP Docker image uses "stable" tag
echo ""
echo "[4] ZAP Docker image tag is pinned to :stable"
IMAGES=$(grep -rohP 'ghcr\.io/zaproxy/zaproxy:[a-zA-Z0-9._-]+' "$ROOT/scripts" "$ROOT/.github" 2>/dev/null | sort -u)
for img in $IMAGES; do
  if [[ "$img" == *:stable ]]; then
    pass "image uses :stable — $img"
  else
    fail "image not pinned to :stable — $img"
  fi
done

# 5) Test user passwords are sufficiently long (>= 16 chars) and contain mixed case + digit
echo ""
echo "[5] Test user password entropy"
PASSWORD_REGEX='^[^,]+, "[^"]+", "[^"]+", "[^"]+",'
for line in $(grep -oP '"password"\s*:\s*"\K[^"]+' "$ROOT/.zap/users/test-users.json"); do
  if [[ ${#line} -ge 16 ]] && [[ "$line" =~ [A-Z] ]] && [[ "$line" =~ [a-z] ]] && [[ "$line" =~ [0-9] ]] && [[ "$line" =~ [^A-Za-z0-9] ]]; then
    pass "password length=${#line} for $(echo "$line" | cut -c1-3)***"
  else
    fail "weak password: length=${#line} (need >=16 + upper + lower + digit + special)"
  fi
done

# 6) ZAP context contains the script-based auth directive
echo ""
echo "[6] Authentication is script-based (JSON login)"
if grep -q 'method="script"' "$ROOT/.zap/contexts/ovds.context"; then
  pass "context uses script-based authentication"
else
  fail "context still uses form/JSON/etc. — must be method=\"script\" pointing at ovds-json-auth.js"
fi

# 7) GitHub Actions workflow references Phase 6 step
echo ""
echo "[7] CI workflow references Phase 6 manual tests"
if grep -q "zap-test-manual-all" "$ROOT/.github/workflows/zap-security-scan.yml"; then
  pass "workflow invokes zap-test-manual-all"
else
  fail "workflow does not invoke Phase 6 manual suite"
fi

# 7b) Workflow uploads secret-scan SARIF to GitHub Code Scanning
if grep -q "codeql-action/upload-sarif" "$ROOT/.github/workflows/zap-security-scan.yml"; then
  pass "workflow uploads secret-scan SARIF to Code Scanning"
else
  warn "workflow missing codeql-action/upload-sarif step for secret scan"
fi

# 8) .gitignore excludes security-reports and ZAP session files
echo ""
echo "[8] Sensitive paths excluded from VCS"
if [[ -f "$ROOT/.gitignore" ]]; then
  for entry in "security-reports/" ".zap/session" ".zap/*.session"; do
    if grep -q "$entry" "$ROOT/.gitignore"; then
      pass ".gitignore contains: $entry"
    else
      warn ".gitignore missing: $entry"
    fi
  done
else
  fail ".gitignore missing at repo root"
fi

echo ""
echo "========================================"
echo "  Governance Check Summary"
echo "========================================"
echo "Passed:   $PASS"
echo "Failed:   $FAIL"
echo "Warnings: $WARN"
echo ""

if [[ "$FAIL" -gt 0 ]]; then
  echo "❌ Security governance violations found"
  exit 1
fi
if [[ "$WARN" -gt 0 && "$STRICT" == "true" ]]; then
  echo "❌ Warnings present in strict mode"
  exit 1
fi
echo "✅ Security governance OK"
exit 0