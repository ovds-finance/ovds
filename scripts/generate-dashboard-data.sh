#!/usr/bin/env bash
# Security Dashboard Data Generator
# Generates JSON data for the security metrics dashboard
#
# Usage:
#   bash scripts/generate-dashboard-data.sh [--output security-reports/dashboard-data.json]

set -euo pipefail

OUTPUT="${OUTPUT:-security-reports/dashboard-data.json}"

echo "========================================"
echo "  Security Dashboard Data Generator"
echo "========================================"
echo ""

# Create output directory
mkdir -p "$(dirname "$OUTPUT")"

# Collect data from various sources
SCAN_DIR="security-reports"
ZAP_DIR=".zap"

# Count findings from ZAP reports
CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0
INFO=0

if [ -d "$SCAN_DIR" ]; then
  for report in "$SCAN_DIR"/zap-*.html; do
    if [ -f "$report" ]; then
      CRITICAL=$((CRITICAL + $(grep -oP 'risk-Critical' "$report" 2>/dev/null | wc -l || echo 0)))
      HIGH=$((HIGH + $(grep -oP 'risk-High' "$report" 2>/dev/null | wc -l || echo 0)))
      MEDIUM=$((MEDIUM + $(grep -oP 'risk-Medium' "$report" 2>/dev/null | wc -l || echo 0)))
      LOW=$((LOW + $(grep -oP 'risk-Low' "$report" 2>/dev/null | wc -l || echo 0)))
      INFO=$((INFO + $(grep -oP 'risk-Informational' "$report" 2>/dev/null | wc -l || echo 0)))
    fi
  done
fi

# Calculate security score (simple heuristic)
TOTAL=$((CRITICAL + HIGH + MEDIUM + LOW + INFO))
if [ $TOTAL -gt 0 ]; then
  SECURITY_SCORE=$((100 - (CRITICAL * 20 + HIGH * 10 + MEDIUM * 5 + LOW * 2)))
  [ $SECURITY_SCORE -lt 0 ] && SECURITY_SCORE=0
else
  SECURITY_SCORE=100
fi

# Count total scans
TOTAL_SCANS=0
if [ -d "$SCAN_DIR" ]; then
  TOTAL_SCANS=$(find "$SCAN_DIR" -name "zap-*.html" | wc -l)
fi

# Determine gate statuses
GATE1_STATUS="pending"
GATE2_STATUS="pending"
GATE3_STATUS="pending"
GATE4_STATUS="pending"

if [ -f "$ZAP_DIR/contexts/ovds.context" ] && [ -f "$ZAP_DIR/policies/ovds-scan.policy" ]; then
  GATE1_STATUS="passed"
fi

if [ -f ".github/workflows/zap-security-scan.yml" ]; then
  GATE2_STATUS="passed"
fi

if [ $TOTAL_SCANS -gt 0 ]; then
  GATE3_STATUS="passed"
fi

if [ -f "scripts/remediation-register.md" ]; then
  GATE4_STATUS="passed"
fi

# Generate recent findings (placeholder - in real scenario, parse from reports)
RECENT_FINDINGS="[]"
if [ -f "$SCAN_DIR/zap-authenticated-report.json" ]; then
  RECENT_FINDINGS=$(cat "$SCAN_DIR/zap-authenticated-report.json" | jq '[.site[].alerts[] | {title: .alert, severity: .risk, category: .alert, url: .url, status: "OPEN", date: now | todate}] | .[0:10]' 2>/dev/null || echo "[]")
fi

# Generate scan history
SCAN_HISTORY="[]"
if [ -d "$SCAN_DIR" ]; then
  SCAN_HISTORY=$(find "$SCAN_DIR" -name "zap-*.html" -exec basename {} \; | sed 's/zap-//;s/-[0-9]*.html//' | sort -u | jq -R -s 'split("\n") | map(select(length > 0)) | .[0:10] | map({date: now | todate, type: ., findings: 0, duration: "N/A", status: "success"})' 2>/dev/null || echo "[]")
fi

# Generate JSON
cat > "$OUTPUT" << EOF
{
  "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "findings": {
    "critical": $CRITICAL,
    "high": $HIGH,
    "medium": $MEDIUM,
    "low": $LOW,
    "info": $INFO
  },
  "securityScore": $SECURITY_SCORE,
  "totalScans": $TOTAL_SCANS,
  "gates": {
    "gate1": { "status": "$GATE1_STATUS", "description": "Setup & Authorization" },
    "gate2": { "status": "$GATE2_STATUS", "description": "Build & Deploy" },
    "gate3": { "status": "$GATE3_STATUS", "description": "ZAP Scan" },
    "gate4": { "status": "$GATE4_STATUS", "description": "Retest & Sign-off" }
  },
  "recentFindings": $RECENT_FINDINGS,
  "scanHistory": $SCAN_HISTORY
}
EOF

echo "Dashboard data generated: $OUTPUT"
echo ""
echo "Findings summary:"
echo "  Critical: $CRITICAL"
echo "  High:     $HIGH"
echo "  Medium:   $MEDIUM"
echo "  Low:      $LOW"
echo "  Info:     $INFO"
echo ""
echo "Security Score: $SECURITY_SCORE%"
echo ""
echo "To view the dashboard, open docs/security-dashboard.html in a browser."
