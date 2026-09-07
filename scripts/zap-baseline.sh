#!/usr/bin/env bash
# ZAP Baseline Scan Script (Linux/macOS)
# Counterpart to scripts/zap-baseline.ps1.
#
# Performs passive scanning and crawling without active attack payloads.
# Suitable for: every merge, nightly scans, pre-deployment checks.
#
# Usage:
#   bash scripts/zap-baseline.sh --target-url http://localhost:3000 \
#                                --report-path ./zap-baseline-report.html
#
# Prerequisites:
#   - Docker installed and running
#   - Target application running and accessible

set -euo pipefail

TARGET_URL=""
REPORT_PATH="${PWD}/zap-baseline-report.html"
ZAP_IMAGE="${ZAP_IMAGE:-ghcr.io/zaproxy/zaproxy:stable}"
TIMEOUT_MINUTES=30
FAIL_ON_RISK=0

while [[ $# -gt 0 ]]; do
    case $1 in
        --target-url)    TARGET_URL="$2";    shift 2 ;;
        --report-path)   REPORT_PATH="$2";   shift 2 ;;
        --image)         ZAP_IMAGE="$2";     shift 2 ;;
        --timeout)       TIMEOUT_MINUTES="$2"; shift 2 ;;
        --fail-on-risk)  FAIL_ON_RISK=1;     shift ;;
        --help|-h)       sed -n '2,22p' "$0"; exit 0 ;;
        *) echo "Unknown option: $1" >&2; exit 2 ;;
    esac
done

if [[ -z "$TARGET_URL" ]]; then
    echo "ERROR: --target-url is required" >&2
    exit 2
fi

if [[ ! "$TARGET_URL" =~ ^https?:// ]]; then
    echo "ERROR: --target-url must start with http:// or https://" >&2
    exit 2
fi

START_TIME=$(date +%s)
REPORT_DIR=$(dirname "$REPORT_PATH")
REPORT_BASE=$(basename "$REPORT_PATH")
REPORT_JSON="${REPORT_BASE%.*}.json"

echo "========================================"
echo "  OWASP ZAP Baseline Scan"
echo "========================================"
echo "Target:  $TARGET_URL"
echo "Report:  $REPORT_PATH"
echo "Image:   $ZAP_IMAGE"
echo "Timeout: $TIMEOUT_MINUTES minutes"
echo ""

if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker is not available. Please install Docker." >&2
    exit 1
fi
echo "Docker: $(docker --version)"

mkdir -p "$REPORT_DIR"

# Strip trailing slash
TARGET_URL="${TARGET_URL%/}"

echo ""
echo "Starting ZAP baseline scan..."
echo "This will crawl the application and perform passive scanning."
echo ""

# Build zap-baseline.py args
ZAP_ARGS=(
    "-t" "$TARGET_URL"
    "-r" "$REPORT_BASE"
    "-J" "$REPORT_JSON"
    "-I"
    "--max_children" "5"
    "--max_depth" "10"
    "--max_scan_time" "${TIMEOUT_MINUTES}m"
    "-j"
    "--auto"
)
[[ $FAIL_ON_RISK -eq 1 ]] && ZAP_ARGS+=("-d")

set +e
docker run --rm \
    -v "${PWD}:/zap/wrk/:rw" \
    -t "$ZAP_IMAGE" \
    zap-baseline.py "${ZAP_ARGS[@]}" 2>&1 | tee "${REPORT_PATH}.log"
EXIT_CODE=${PIPESTATUS[0]}
set -e

END_TIME=$(date +%s)
DURATION=$(( END_TIME - START_TIME ))

echo ""
echo "========================================"
echo "  Scan Complete"
echo "========================================"
echo "Duration: ${DURATION}s"
echo "Exit Code: $EXIT_CODE"
echo "Report: $REPORT_PATH"
echo "Log: ${REPORT_PATH}.log"
echo ""

# Parse alert counts from log
HIGH=$(grep -oP '\d+\s+High\s+alerts?' "${REPORT_PATH}.log" | grep -oP '^\d+' | head -1 || echo 0)
MEDIUM=$(grep -oP '\d+\s+Medium\s+alerts?' "${REPORT_PATH}.log" | grep -oP '^\d+' | head -1 || echo 0)
LOW=$(grep -oP '\d+\s+Low\s+alerts?' "${REPORT_PATH}.log" | grep -oP '^\d+' | head -1 || echo 0)
INFO=$(grep -oP '\d+\s+Informational\s+alerts?' "${REPORT_PATH}.log" | grep -oP '^\d+' | head -1 || echo 0)
[[ -z "$HIGH" ]]   && HIGH=0
[[ -z "$MEDIUM" ]] && MEDIUM=0
[[ -z "$LOW" ]]    && LOW=0
[[ -z "$INFO" ]]   && INFO=0

echo "Alert Summary:"
echo "  High:          $HIGH"
echo "  Medium:        $MEDIUM"
echo "  Low:           $LOW"
echo "  Informational: $INFO"
echo ""

case "$EXIT_CODE" in
    0)
        echo "SUCCESS: No significant issues found."
        exit 0
        ;;
    1)
        echo "WARNING: Low-risk issues found. Review the report."
        [[ $FAIL_ON_RISK -eq 1 ]] && exit 1
        exit 0
        ;;
    2)
        echo "WARNING: Medium-risk issues found. Review the report."
        [[ $FAIL_ON_RISK -eq 1 ]] && exit 2
        exit 0
        ;;
    *)
        echo "FAILURE: High-risk or critical issues found, or scan failed."
        exit "$EXIT_CODE"
        ;;
esac
