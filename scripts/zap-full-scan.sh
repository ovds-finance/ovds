#!/usr/bin/env bash
# ZAP Full Scan Script (Linux/macOS)
# Counterpart to scripts/zap-full-scan.ps1.
#
# Performs crawling + active scanning with attack payloads.
# Suitable for: dedicated security environments, pre-release assessments.
#
# Usage:
#   bash scripts/zap-full-scan.sh --target-url http://staging.example.com \
#                                 --report-path ./zap-full-scan-report.html
#
# WARNING: Active scanning sends attack payloads. Only run in approved test environments.

set -euo pipefail

TARGET_URL=""
REPORT_PATH="${PWD}/zap-full-scan-report.html"
ZAP_IMAGE="${ZAP_IMAGE:-ghcr.io/zaproxy/zaproxy:stable}"
TIMEOUT_MINUTES=60
FAIL_ON_RISK=1
API_DEFINITION=""
ASSUME_YES=0

while [[ $# -gt 0 ]]; do
    case $1 in
        --target-url)    TARGET_URL="$2";    shift 2 ;;
        --report-path)   REPORT_PATH="$2";   shift 2 ;;
        --image)         ZAP_IMAGE="$2";     shift 2 ;;
        --timeout)       TIMEOUT_MINUTES="$2"; shift 2 ;;
        --api)           API_DEFINITION="$2"; shift 2 ;;
        --fail-on-risk)  FAIL_ON_RISK=1;     shift ;;
        --no-fail-on-risk) FAIL_ON_RISK=0;   shift ;;
        --yes|-y)        ASSUME_YES=1;       shift ;;
        --help|-h)       sed -n '2,20p' "$0"; exit 0 ;;
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

echo "========================================"
echo "  OWASP ZAP Full Scan (ACTIVE)"
echo "========================================"
echo "Target:  $TARGET_URL"
echo "Report:  $REPORT_PATH"
echo "Image:   $ZAP_IMAGE"
echo "Timeout: $TIMEOUT_MINUTES minutes"
echo "API Def: ${API_DEFINITION:-None}"
echo ""
echo "WARNING: Active scanning sends attack payloads."
echo "Ensure you have authorization and a backup before proceeding."
echo ""

if [[ $ASSUME_YES -eq 0 ]]; then
    read -r -p "Have you taken a backup and confirmed authorization? (yes/no): " confirmation
    if [[ "$confirmation" != "yes" ]]; then
        echo "Aborted. Please complete prerequisites before running active scans."
        exit 1
    fi
fi

if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker is not available." >&2
    exit 1
fi
echo "Docker: $(docker --version)"

mkdir -p "$REPORT_DIR"
TARGET_URL="${TARGET_URL%/}"

if [[ -n "$API_DEFINITION" ]]; then
    echo ""
    echo "Running ZAP API Scan via automation plan..."
    set +e
    docker run --rm \
        -v "${PWD}:/zap/wrk/:rw" \
        -v "${PWD}/.zap/automation/ovds-api-scan.yaml:/zap/ovds-api-scan.yaml:ro" \
        -t "$ZAP_IMAGE" \
        zap.sh -cmd -autorun /zap/ovds-api-scan.yaml \
        -config "connection.timeoutInSecs=$(( TIMEOUT_MINUTES * 60 ))" 2>&1 | tee "${REPORT_PATH}.log"
    EXIT_CODE=${PIPESTATUS[0]}
    set -e
else
    echo ""
    echo "Running ZAP Full Scan..."
    set +e
    docker run --rm \
        -v "${PWD}:/zap/wrk/:rw" \
        -t "$ZAP_IMAGE" \
        zap-full-scan.py \
            -t "$TARGET_URL" \
            -r "$REPORT_BASE" \
            --max_children 5 \
            --max_depth 10 \
            --max_scan_time "${TIMEOUT_MINUTES}m" \
            -j \
            --auto 2>&1 | tee "${REPORT_PATH}.log"
    EXIT_CODE=${PIPESTATUS[0]}
    set -e
fi

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
echo "NEXT STEPS:"
echo "  1. Review the HTML report: $REPORT_PATH"
echo "  2. Validate each finding (eliminate false positives)"
echo "  3. Create remediation tasks for confirmed vulnerabilities"
echo "  4. Retest after fixes are deployed"
echo ""

case "$EXIT_CODE" in
    0)
        echo "SUCCESS: No significant issues found."
        exit 0
        ;;
    1|2)
        echo "WARNING: Low/Medium risk issues found. Review required."
        [[ $FAIL_ON_RISK -eq 1 ]] && exit "$EXIT_CODE"
        exit 0
        ;;
    *)
        echo "FAILURE: High-risk or critical issues found."
        exit "$EXIT_CODE"
        ;;
esac
