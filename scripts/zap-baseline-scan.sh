#!/usr/bin/env bash
# OWASP ZAP baseline scan for OVDS staging/preprod environments.
# Usage: ./scripts/zap-baseline-scan.sh https://staging.example.com

set -euo pipefail

TARGET="${1:-}"
REPORT="${2:-zap-baseline-report.html}"

if [ -z "$TARGET" ]; then
  echo "Usage: $0 <target-url> [report-file]"
  echo "Example: $0 https://staging.ovds.local"
  exit 1
fi

echo "Running OWASP ZAP baseline scan against: $TARGET"
echo "Report will be written to: $REPORT"

docker run --rm -v "$(pwd):/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t "$TARGET" \
  -r "$REPORT" \
  -J zap-baseline-report.json \
  -I

echo "Scan complete. Open $REPORT for results."
