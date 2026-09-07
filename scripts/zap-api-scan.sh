#!/usr/bin/env bash
# ZAP API Scan Script (Linux/macOS)
# Counterpart to scripts/zap-api-scan.ps1.
#
# Performs API security testing against OpenAPI/Swagger definitions.
# Suitable for: CI/CD pipelines, API security assessments, pre-release checks.
#
# Usage:
#   bash scripts/zap-api-scan.sh --api http://localhost:3001/api/openapi.json \
#                                --report-path ./zap-api-report.html

set -euo pipefail

API_DEFINITION=""
REPORT_PATH="${PWD}/zap-api-report.html"
ZAP_IMAGE="${ZAP_IMAGE:-ghcr.io/zaproxy/zaproxy:stable}"
TIMEOUT_MINUTES=60
FAIL_ON_RISK=1

while [[ $# -gt 0 ]]; do
    case $1 in
        --api)            API_DEFINITION="$2"; shift 2 ;;
        --report-path)    REPORT_PATH="$2";    shift 2 ;;
        --image)          ZAP_IMAGE="$2";      shift 2 ;;
        --timeout)        TIMEOUT_MINUTES="$2"; shift 2 ;;
        --fail-on-risk)   FAIL_ON_RISK=1;      shift ;;
        --no-fail-on-risk) FAIL_ON_RISK=0;     shift ;;
        --help|-h)        sed -n '2,20p' "$0"; exit 0 ;;
        *) echo "Unknown option: $1" >&2; exit 2 ;;
    esac
done

if [[ -z "$API_DEFINITION" ]]; then
    echo "ERROR: --api is required" >&2
    exit 2
fi

START_TIME=$(date +%s)
REPORT_DIR=$(dirname "$REPORT_PATH")

echo "========================================"
echo "  OWASP ZAP API Scan"
echo "========================================"
echo "API Def: $API_DEFINITION"
echo "Report:  $REPORT_PATH"
echo "Image:   $ZAP_IMAGE"
echo "Timeout: $TIMEOUT_MINUTES minutes"
echo ""

if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker is not available." >&2
    exit 1
fi
echo "Docker: $(docker --version)"

mkdir -p "$REPORT_DIR"

echo ""
echo "Starting ZAP API Scan..."
echo "This will import the API definition and perform active vulnerability scanning."
echo ""

# Allow API definition to be a local path or a URL
DOCKER_ENV=()
if [[ "$API_DEFINITION" =~ ^https?:// ]]; then
    DOCKER_ENV+=("-e" "ZAP_API_DEF=$API_DEFINITION")
else
    ABS_API=$(readlink -f "$API_DEFINITION" 2>/dev/null || echo "$API_DEFINITION")
    DOCKER_MOUNT=("-v" "${ABS_API}:/zap/api-def.json:ro")
fi

set +e
docker run --rm \
    -v "${PWD}:/zap/wrk/:rw" \
    -v "${PWD}/.zap/automation/ovds-api-scan.yaml:/zap/ovds-api-scan.yaml:ro" \
    "${DOCKER_MOUNT[@]:-}" \
    "${DOCKER_ENV[@]}" \
    -t "$ZAP_IMAGE" \
    zap.sh -cmd -autorun /zap/ovds-api-scan.yaml \
    -config "connection.timeoutInSecs=$(( TIMEOUT_MINUTES * 60 ))" 2>&1 | tee "${REPORT_PATH}.log"
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
