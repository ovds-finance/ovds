#!/usr/bin/env bash
# Security Testing Summary Generator
# Generates a summary of all security testing activities and results
#
# Usage:
#   bash scripts/security-summary.sh

set -euo pipefail

echo "========================================"
echo "  OVDS Security Testing Summary"
echo "========================================"
echo ""

# Check if ZAP reports exist
REPORTS_DIR="security-reports"
if [ ! -d "$REPORTS_DIR" ]; then
  echo "No security reports found in $REPORTS_DIR/"
  echo "Run security scans first:"
  echo "  bash scripts/security-test-runner.sh all"
  exit 1
fi

# Count reports
BASELINE_REPORTS=$(find "$REPORTS_DIR" -name "zap-baseline-*.html" 2>/dev/null | wc -l)
FULL_REPORTS=$(find "$REPORTS_DIR" -name "zap-full-*.html" 2>/dev/null | wc -l)
API_REPORTS=$(find "$REPORTS_DIR" -name "zap-api-*.html" 2>/dev/null | wc -l)

echo "## Scan Reports"
echo ""
echo "| Type | Count |"
echo "|------|-------|"
echo "| Baseline | $BASELINE_REPORTS |"
echo "| Full | $FULL_REPORTS |"
echo "| API | $API_REPORTS |"
echo ""

# Check ZAP configuration
echo "## Configuration Status"
echo ""
if [ -f ".zap/contexts/ovds.context" ]; then
  echo "✅ ZAP context configured"
else
  echo "❌ ZAP context missing"
fi

if [ -f ".zap/policies/ovds-scan.policy" ]; then
  echo "✅ Scan policy configured"
else
  echo "❌ Scan policy missing"
fi

if [ -f ".zap/users/test-users.json" ]; then
  echo "✅ Test users configured"
else
  echo "❌ Test users missing"
fi

echo ""

# Check test users in database
echo "## Test Users"
echo ""
echo "| Email | Role |"
echo "|-------|------|"

if command -v node &> /dev/null; then
  node scripts/validate-zap-config.mjs 2>/dev/null | grep -E "✓ Test users has" || true
fi

echo ""

# Check scripts availability
echo "## Available Scripts"
echo ""
echo "| Script | Status |"
echo "|--------|--------|"

SCRIPTS=(
  "scripts/zap-baseline.ps1:Baseline Scan"
  "scripts/zap-full-scan.ps1:Full Scan"
  "scripts/zap-authenticated-scan.ps1:Authenticated Scan"
  "scripts/zap-api-scan.ps1:API Scan"
  "scripts/security-test-runner.sh:Test Runner"
  "scripts/validate-zap-config.mjs:Config Validator"
  "scripts/seed-zap-test-users.mjs:User Seeder"
  "scripts/check-app-readiness.sh:Readiness Check"
  "scripts/check-security-config.sh:Config Checker"
  "scripts/generate-security-report.sh:Report Generator"
)

for script_desc in "${SCRIPTS[@]}"; do
  script="${script_desc%%:*}"
  desc="${script_desc##*:}"
  if [ -f "$script" ]; then
    echo "| $desc | ✅ Available |"
  else
    echo "| $desc | ❌ Missing |"
  fi
done

echo ""

# Check Docker compose
echo "## Docker Compose"
echo ""
if [ -f "docker-compose.security.yml" ]; then
  echo "✅ Security testing stack configured"
  echo ""
  echo "To start:"
  echo "  docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d"
else
  echo "❌ docker-compose.security.yml missing"
fi

echo ""

# Check CI/CD
echo "## CI/CD Integration"
echo ""
if [ -f ".github/workflows/zap-security-scan.yml" ]; then
  echo "✅ GitHub Actions workflow configured"
  echo ""
  echo "Triggers:"
  echo "  - Push to main/develop"
  echo "  - Pull requests to main/develop"
  echo "  - Weekly schedule (Monday 2 AM)"
  echo "  - Manual workflow dispatch"
else
  echo "❌ GitHub Actions workflow missing"
fi

echo ""

# Recommendations
echo "## Recommendations"
echo ""
echo "1. Run configuration validation:"
echo "   node scripts/validate-zap-config.mjs"
echo ""
echo "2. Seed test users:"
echo "   npm run seed:zap-users"
echo ""
echo "3. Start security testing stack:"
echo "   docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d"
echo ""
echo "4. Run all scans:"
echo "   bash scripts/security-test-runner.sh all"
echo ""
echo "5. Review reports in: $REPORTS_DIR/"
echo ""
echo "6. Check application readiness:"
echo "   bash scripts/check-app-readiness.sh"
echo ""
echo "7. Check security configuration:"
echo "   bash scripts/check-security-config.sh"
echo ""

# Security gates
echo "## Security Gates"
echo ""
echo "| Gate | Requirement | Status |"
echo "|------|-------------|--------|"
echo "| 1 | Setup & Authorization | ⏳ Pending |"
echo "| 2 | Build & Deploy | ⏳ Pending |"
echo "| 3 | ZAP Scan | ⏳ Pending |"
echo "| 4 | Retest & Sign-off | ⏳ Pending |"
echo ""
echo "Run scans to complete gates."
echo ""

echo "========================================"
echo "  Summary Complete"
echo "========================================"
