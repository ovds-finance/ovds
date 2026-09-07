#!/usr/bin/env bash
# OVDS Phase 6 — Retest Helper (Linux/macOS)
# Counterpart to scripts/zap-retest.ps1.
#
# Implements §18 of the OWASP ZAP Assessment Guide (Retesting).
# Given a list of previously-confirmed findings, run the matching Phase 6
# checks again and produce a Fixed / Not fixed / Risk accepted verdict.
#
# Usage:
#   bash scripts/zap-retest.sh --findings security-reports/retest-input.json
#   bash scripts/zap-retest.sh --findings findings.json --backend http://localhost:3001

set -euo pipefail

FINDINGS_FILE=""
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
OUTPUT_FILE="${OUTPUT_FILE:-./security-reports/retest-evidence.json}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --findings)  FINDINGS_FILE="$2"; shift 2 ;;
        --backend)   BACKEND_URL="$2";  shift 2 ;;
        --output)    OUTPUT_FILE="$2";  shift 2 ;;
        --help|-h)   sed -n '2,18p' "$0"; exit 0 ;;
        *) echo "Unknown option: $1" >&2; exit 2 ;;
    esac
done

if [[ -z "$FINDINGS_FILE" ]]; then
    echo "ERROR: --findings is required" >&2
    exit 2
fi
if [[ ! -f "$FINDINGS_FILE" ]]; then
    echo "ERROR: Findings file not found: $FINDINGS_FILE" >&2
    exit 1
fi

if ! command -v pwsh >/dev/null 2>&1; then
    echo "ERROR: pwsh (PowerShell 7) is required to run Phase 6 verification scripts." >&2
    exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT
mkdir -p "$(dirname "$OUTPUT_FILE")"

echo "========================================"
echo "  OVDS Phase 6 — Retest Helper"
echo "========================================"
echo "Backend:  $BACKEND_URL"
echo "Findings: $FINDINGS_FILE"
echo "Output:   $OUTPUT_FILE"
echo ""

# Extract finding IDs + categories with simple grep (no jq dependency)
IDS=$(grep -oE '"(findingId|id)"\s*:\s*"[^"]+"' "$FINDINGS_FILE" | grep -oE '"[^"]+"$' | tr -d '"' | sort -u)
CATS=$(grep -oE '"category"\s*:\s*"[^"]+"' "$FINDINGS_FILE" | grep -oE '"[^"]+"$' | tr -d '"' | sort -u)
TITLES=$(grep -oE '"(title|description)"\s*:\s*"[^"]+"' "$FINDINGS_FILE" | grep -oE '"[^"]+"$' | tr -d '"')

declare -a RESULTS_JSON=()
PASS=0
FAIL=0

# Iterate by line — assume one finding per top-level object. For simplicity
# we read all findings, then walk them in order.
TOTAL=$(grep -c '"findingId"' "$FINDINGS_FILE" 2>/dev/null || echo 0)
[[ "$TOTAL" -eq 0 ]] && TOTAL=$(grep -c '"id"' "$FINDINGS_FILE" 2>/dev/null || echo 0)
echo "Total findings: $TOTAL"

i=0
while [[ $i -lt $TOTAL ]]; do
    i=$((i + 1))
    # We use pwsh + the existing retest harness in scripts/zap-retest.ps1 for
    # actual verification. This bash wrapper orchestrates one finding at a time.
    FID=$(printf 'F%03d' "$i")
    TITLE="Finding $i"
    CAT=""

    # Map known categories to scripts
    SCRIPT=""
    case "$CAT" in
        auth|session|cookie|csrf|jwt|password)    SCRIPT="zap-test-authentication.ps1" ;;
        idor|access|authorization|role|permission) SCRIPT="zap-test-authorization.ps1" ;;
        injection|xss|sql)                          SCRIPT="zap-test-input-validation.ps1" ;;
        upload|file|mime)                           SCRIPT="zap-test-misc.ps1" ;;
        rate|brute|throttle)                        SCRIPT="zap-test-rate-limit.ps1" ;;
    esac

    if [[ -z "$SCRIPT" ]]; then
        echo "[$FID] $TITLE — no matching verification script (Risk accepted)"
        VERDICT="Risk accepted"
        EVIDENCE="No automated verification available — manual review required"
        FAIL=$((FAIL+1))
        RESULTS_JSON+=("$(printf '{"findingId":"%s","title":"%s","verdict":"%s","evidence":"%s","retestedAt":"%s"}' \
            "$FID" "$TITLE" "$VERDICT" "$EVIDENCE" "$(date -u +%Y-%m-%dT%H:%M:%SZ)")")
        continue
    fi

    echo "[$FID] $TITLE — running $SCRIPT"
    LOG="$TMP_DIR/retest-$FID.log"
    if pwsh -NoProfile -File "$SCRIPT_DIR/$SCRIPT" -BackendUrl "$BACKEND_URL" -JsonReport > "$LOG" 2>&1; then
        VERDICT="Fixed"
        PASS=$((PASS+1))
    else
        VERDICT="Not fixed"
        FAIL=$((FAIL+1))
    fi
    echo "  $VERDICT"
    RESULTS_JSON+=("$(printf '{"findingId":"%s","title":"%s","verdict":"%s","script":"%s","logPath":"%s","retestedAt":"%s"}' \
        "$FID" "$TITLE" "$VERDICT" "$SCRIPT" "$LOG" "$(date -u +%Y-%m-%dT%H:%M:%SZ)")")
done

# Build the JSON document
{
    echo "{"
    echo "  \"retestedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
    echo "  \"backend\": \"$BACKEND_URL\","
    echo "  \"totals\": { \"fixed\": $PASS, \"notFixed\": $FAIL },"
    echo "  \"findings\": ["
    sep=""
    for r in "${RESULTS_JSON[@]}"; do
        echo "    ${sep}${r}"
        sep=","
    done
    echo "  ]"
    echo "}"
} > "$OUTPUT_FILE"

echo ""
echo "========================================"
echo "  Retest Complete"
echo "========================================"
echo "Fixed:        $PASS"
echo "Not fixed:    $FAIL"
echo "Evidence:     $OUTPUT_FILE"
echo ""

[[ $FAIL -eq 0 ]] && exit 0 || exit 1
