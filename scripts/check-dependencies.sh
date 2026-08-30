#!/usr/bin/env bash
# Dependency Security Checker for OVDS
# Checks for vulnerable dependencies, outdated packages, and license issues
#
# Usage:
#   bash scripts/check-dependencies.sh [--audit-level moderate|high|critical] [--fix] [--json]
#
# Examples:
#   bash scripts/check-dependencies.sh
#   bash scripts/check-dependencies.sh --audit-level high
#   bash scripts/check-dependencies.sh --fix
#   bash scripts/check-dependencies.sh --json --output security-reports/deps-report.json

set -euo pipefail

AUDIT_LEVEL="${AUDIT_LEVEL:-moderate}"
FIX=false
JSON_OUTPUT=""
OUTPUT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --audit-level)
      AUDIT_LEVEL="$2"
      shift 2
      ;;
    --fix)
      FIX=true
      shift
      ;;
    --json)
      JSON_OUTPUT="security-reports/deps-report.json"
      shift
      ;;
    --output)
      OUTPUT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "========================================"
echo "  Dependency Security Checker"
echo "========================================"
echo "Audit level: $AUDIT_LEVEL"
echo "Auto-fix:    $FIX"
echo ""

# Create output directory
mkdir -p security-reports

# Track issues
ISSUES=0
WARNINGS=0
FIXED=0

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

# Check npm audit
echo "--- NPM Audit ---"
if [ -f "package.json" ]; then
  if [ "$FIX" = true ]; then
    npm audit fix --audit-level=$AUDIT_LEVEL 2>&1 | tee security-reports/npm-audit-fix.log || true
    FIXED=$((FIXED + $(grep -c "fixed" security-reports/npm-audit-fix.log 2>/dev/null || echo 0)))
  else
    npm audit --audit-level=$AUDIT_LEVEL 2>&1 | tee security-reports/npm-audit.log || true
  fi
  
  # Parse audit results
  AUDIT_OUTPUT=$(npm audit --audit-level=$AUDIT_LEVEL 2>&1 || true)
  
  if echo "$AUDIT_OUTPUT" | grep -q "found"; then
    CRITICAL=$(echo "$AUDIT_OUTPUT" | grep -oP '\d+\s+critical' | grep -oP '\d+' | head -1 || echo 0)
    HIGH=$(echo "$AUDIT_OUTPUT" | grep -oP '\d+\s+high' | grep -oP '\d+' | head -1 || echo 0)
    MODERATE=$(echo "$AUDIT_OUTPUT" | grep -oP '\d+\s+moderate' | grep -oP '\d+' | head -1 || echo 0)
    LOW=$(echo "$AUDIT_OUTPUT" | grep -oP '\d+\s+low' | grep -oP '\d+' | head -1 || echo 0)
    
    echo ""
    echo "Vulnerabilities found:"
    echo "  Critical: $CRITICAL"
    echo "  High:     $HIGH"
    echo "  Moderate: $MODERATE"
    echo "  Low:      $LOW"
    echo ""
    
    ISSUES=$((ISSUES + CRITICAL + HIGH))
    WARNINGS=$((WARNINGS + MODERATE + LOW))
  else
    echo "✅ No vulnerabilities found"
  fi
else
  echo "⚠️  No package.json found"
fi

echo ""

# Check for outdated dependencies
echo "--- Outdated Dependencies ---"
if [ -f "package.json" ]; then
  OUTDATED=$(npm outdated 2>&1 || true)
  if [ -n "$OUTDATED" ]; then
    echo "⚠️  Outdated dependencies found:"
    echo "$OUTDATED" | while IFS= read -r line; do
      echo "  $line"
    done
    WARNINGS=$((WARNINGS + $(echo "$OUTDATED" | wc -l)))
  else
    echo "✅ All dependencies are up to date"
  fi
else
  echo "⚠️  No package.json found"
fi

echo ""

# Check for unused dependencies
echo "--- Unused Dependencies ---"
if [ -f "package.json" ]; then
  UNUSED=$(npx depcheck --json 2>/dev/null || echo '{"dependencies":[],"devDependencies":[]}')
  UNUSED_DEPS=$(echo "$UNUSED" | jq -r '.dependencies[]' 2>/dev/null | wc -l)
  UNUSED_DEV=$(echo "$UNUSED" | jq -r '.devDependencies[]' 2>/dev/null | wc -l)
  
  if [ $UNUSED_DEPS -gt 0 ] || [ $UNUSED_DEV -gt 0 ]; then
    echo "⚠️  Unused dependencies found:"
    echo "  Dependencies: $UNUSED_DEPS"
    echo "  Dev dependencies: $UNUSED_DEV"
    WARNINGS=$((WARNINGS + UNUSED_DEPS + UNUSED_DEV))
  else
    echo "✅ No unused dependencies found"
  fi
else
  echo "⚠️  No package.json found"
fi

echo ""

# Check license compliance
echo "--- License Compliance ---"
if [ -f "package.json" ]; then
  LICENSES=$(npm ls --all --json 2>/dev/null | jq -r '.. | .license? // empty' 2>/dev/null | sort | uniq -c | sort -rn || true)
  
  if [ -n "$LICENSES" ]; then
    echo "Dependency licenses:"
    echo "$LICENSES" | while IFS= read -r line; do
      echo "  $line"
    done
    
    # Check for problematic licenses
    PROBLEMATIC=$(echo "$LICENSES" | grep -iE "GPL|AGPL|SSPL" || true)
    if [ -n "$PROBLEMATIC" ]; then
      echo ""
      echo "⚠️  Potentially problematic licenses found:"
      echo "$PROBLEMATIC" | while IFS= read -r line; do
        echo "  $line"
      done
      WARNINGS=$((WARNINGS + $(echo "$PROBLEMATIC" | wc -l)))
    fi
  fi
else
  echo "⚠️  No package.json found"
fi

echo ""

# Check for known malicious packages
echo "--- Known Malicious Packages ---"
if [ -f "package.json" ]; then
  MALICIOUS=$(npm audit --json 2>/dev/null | jq -r '.advisories | to_entries[] | select(.value.malicious == true) | .value.module_name' 2>/dev/null || true)
  
  if [ -n "$MALICIOUS" ]; then
    echo "❌ Malicious packages found:"
    echo "$MALICIOUS" | while IFS= read -r line; do
      echo "  $line"
    done
    ISSUES=$((ISSUES + $(echo "$MALICIOUS" | wc -l)))
  else
    echo "✅ No malicious packages found"
  fi
else
  echo "⚠️  No package.json found"
fi

echo ""

# Summary
echo "========================================"
echo "  Dependency Security Summary"
echo "========================================"
echo "Critical Issues: 0"
echo "High Issues:     $ISSUES"
echo "Warnings:        $WARNINGS"
echo "Fixed:           $FIXED"
echo ""

if [ -n "$JSON_OUTPUT" ] || [ -n "$OUTPUT" ]; then
  REPORT_FILE="${OUTPUT:-$JSON_OUTPUT}"
  cat > "${REPORT_FILE}.json" << EOF
{
  "scanDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "auditLevel": "$AUDIT_LEVEL",
  "issues": $ISSUES,
  "warnings": $WARNINGS,
  "fixed": $FIXED,
  "status": "$([ $ISSUES -eq 0 ] && echo 'PASS' || echo 'FAIL')"
}
EOF
  echo "JSON report saved to: ${REPORT_FILE}.json"
fi

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ No dependency security issues found"
  exit 0
elif [ $ISSUES -eq 0 ]; then
  echo "⚠️  $WARNINGS warnings found - review recommended"
  exit 0
else
  echo "❌ $ISSUES high/critical issues found - immediate attention required"
  exit 1
fi
