#!/usr/bin/env bash
# OVDS Secret Scanner (hardened)
#
# Detects accidentally-committed secrets, API keys, private keys, and
# database URLs in source files. Hardened version with:
#   - Binary file detection via `file --mime-type`
#   - Skips .env.example and other template files
#   - Skips lockfile files (pnpm-lock.yaml, package-lock.json)
#   - Categorizes findings by severity (high / medium / low)
#   - Optional SARIF 2.1.0 output for GitHub Security tab
#   - Optional GitHub Actions annotation via ::warning / ::error
#
# Cross-platform counterpart: scripts/scan-secrets.ps1
#
# Usage:
#   bash scripts/scan-secrets.sh
#   bash scripts/scan-secrets.sh --path ./apps/backend
#   bash scripts/scan-secrets.sh --format sarif --output security-reports/secrets.sarif.json
#   bash scripts/scan-secrets.sh --format text --fail-on high
#
# Exit codes:
#   0 — no findings above the configured severity
#   1 — findings at or above the configured severity
#   2 — scanner error (missing dependency, etc.)

set -euo pipefail

SCAN_PATH="${SCAN_PATH:-.}"
FORMAT="${FORMAT:-text}"
OUTPUT="${OUTPUT:-security-reports/secrets-scan}"
FAIL_ON="${FAIL_ON:-high}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --path)      SCAN_PATH="$2"; shift 2 ;;
    --format)    FORMAT="$2";    shift 2 ;;
    --output)    OUTPUT="$2";    shift 2 ;;
    --fail-on)   FAIL_ON="$2";   shift 2 ;;
    --help|-h)   sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$(dirname "$OUTPUT")" 2>/dev/null || true

echo "========================================"
echo "  OVDS Secret Scanner"
echo "========================================"
echo "Path:     $SCAN_PATH"
echo "Format:   $FORMAT"
echo "Fail on:  $FAIL_ON"
echo ""

# ---------------------------------------------------------------------------
# Patterns are tagged with severity:
#   high   — AWS keys, private keys, DB URLs with passwords, password-in-URL
#   medium — JWTs, bearer tokens, OAuth/3rd-party API keys, generic secrets
#   low    — ambiguous / informational
# ---------------------------------------------------------------------------
declare -A PATTERNS=(
  ["AWS Access Key|high"]="AKIA[0-9A-Z]{16}"
  ["AWS Secret Key|high"]="(?i)aws(.{0,20})?['\"][0-9a-zA-Z/+=]{40}['\"]"
  ["Private Key Block|high"]="-----BEGIN (RSA|DSA|EC|OPENSSH|PRIVATE) KEY-----"
  ["Password in URL|high"]="(?i)://[^\s:/@]+:[^\s@]+@"
  ["Database URL with Password|high"]="(?i)(mysql|postgresql|mongodb|redis|amqp)://[^\s:/@]+:[^\s@]+@"
  ["JWT Token|medium"]="eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"
  ["Bearer Token|medium"]="(?i)bearer\s+[0-9a-zA-Z_\-\._~+/]+=*"
  ["Basic Auth Header|medium"]="(?i)basic\s+[0-9a-zA-Z+/]{20,}={0,2}"
  ["GitHub Token|medium"]="(?i)github[_-]?token['\"]?\s*[:=]\s*['\"][0-9a-zA-Z_]{35,40}['\"]"
  ["Google API Key|medium"]="AIza[0-9A-Za-z\-_]{35}"
  ["Slack Token|medium"]="xox[abpr]-[0-9a-zA-Z-]+"
  ["Stripe API Key|medium"]="(?i)sk_(live|test)_[0-9a-zA-Z]{24,}"
  ["Twilio API Key|medium"]="SK[0-9a-fA-F]{32}"
  ["Mailgun API Key|medium"]="key-[0-9a-zA-Z]{32}"
  ["Generic API Key|medium"]="(?i)(api[_-]?key|apikey)['\"]?\s*[:=]\s*['\"][0-9a-zA-Z_\-]{20,}['\"]"
  ["Generic Secret|medium"]="(?i)(secret|password|passwd|pwd)['\"]?\s*[:=]\s*['\"][^'\"]{8,}['\"]"
)

EXCLUDE_DIRS_REGEX='/(node_modules|\.git|dist|build|coverage|\.nx|\.zap|security-reports|out|tmp)(\/|$)'
EXCLUDE_FILE_REGEX='(\.min\.(js|css)|package-lock\.json|yarn\.lock|pnpm-lock\.yarn\.yml)$'
EXCLUDE_PATH_REGEX='(\.env\.example|\.env\.sample|\.env\.template|\.test\.example)$'

# Collect candidate files (text files only)
mapfile -t CANDIDATES < <(
  find "${SCAN_PATH}" \
    -type d \( -name node_modules -o -name .git -o -name dist -o -name build -o -name coverage -o -name .nx -o -name .zap -o -name security-reports -o -name out -o -name tmp \) -prune -o \
    -type f -print 2>/dev/null
)

TEXT_FILES=()
SKIPPED_BINARY=0
SKIPPED_EXCLUDED=0
SKIPPED_TEMPLATE=0
SKIPPED_LOCKFILE=0

for f in "${CANDIDATES[@]}"; do
  # Exclude by path regex
  if [[ "$f" =~ $EXCLUDE_DIRS_REGEX ]]; then SKIPPED_EXCLUDED=$((SKIPPED_EXCLUDED+1)); continue; fi
  if [[ "$f" =~ $EXCLUDE_FILE_REGEX ]]; then SKIPPED_LOCKFILE=$((SKIPPED_LOCKFILE+1)); continue; fi
  if [[ "$f" =~ $EXCLUDE_PATH_REGEX ]]; then SKIPPED_TEMPLATE=$((SKIPPED_TEMPLATE+1)); continue; fi

  # Binary detection
  mime=$(file -b --mime-type "$f" 2>/dev/null || echo "application/octet-stream")
  if [[ "$mime" =~ ^(application/(octet-stream|pdf|zip|gzip|x-tar|x-rar|x-7z|x-bzip2)|image/|audio/|video/|font/) ]]; then
    SKIPPED_BINARY=$((SKIPPED_BINARY+1))
    continue
  fi

  # Reject huge files (>5MB) — secrets are unlikely in binaries/logs but skip for speed
  size=$(stat -c%s "$f" 2>/dev/null || echo 0)
  if [[ "$size" -gt 5242880 ]]; then
    SKIPPED_BINARY=$((SKIPPED_BINARY+1))
    continue
  fi

  TEXT_FILES+=("$f")
done

echo "Files scanned: ${#TEXT_FILES[@]}"
echo "Skipped:  binary=$SKIPPED_BINARY excluded-dir=$SKIPPED_EXCLUDED lockfile=$SKIPPED_LOCKFILE template=$SKIPPED_TEMPLATE"
echo ""

# Scan
declare -a FINDINGS=()
SEVERITY_HIGH=0
SEVERITY_MEDIUM=0
SEVERITY_LOW=0

for f in "${TEXT_FILES[@]}"; do
  for key in "${!PATTERNS[@]}"; do
    pattern="${PATTERNS[$key]}"
    name="${key%|*}"
    severity="${key##*|}"

    # grep -P uses PCRE; -I skips binary "files" by content sniffing
    while IFS= read -r match_line; do
      [[ -z "$match_line" ]] && continue
      # Skip false positives: tests, fixtures, mocks
      if [[ "$f" =~ (test|spec|mock|fixture|fake|example|sample) ]]; then
        severity="low"
      fi
      line_no=$(echo "$match_line" | cut -d: -f2)
      FINDINGS+=("[$severity] $name :: $f:$line_no :: $(echo "$match_line" | cut -d: -f3- | head -c 80)")
      case "$severity" in
        high)   SEVERITY_HIGH=$((SEVERITY_HIGH+1)) ;;
        medium) SEVERITY_MEDIUM=$((SEVERITY_MEDIUM+1)) ;;
        low)    SEVERITY_LOW=$((SEVERITY_LOW+1)) ;;
      esac

      # GitHub Actions annotations
      if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
        level="warning"
        [[ "$severity" == "high" ]] && level="error"
        printf '::%s file=%s,line=%s::%s\n' "$level" "$f" "$line_no" "$name"
      fi
    done < <(grep -P -n -I "$pattern" "$f" 2>/dev/null || true)
  done
done

TOTAL=$((SEVERITY_HIGH + SEVERITY_MEDIUM + SEVERITY_LOW))

# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
case "$FORMAT" in
  text)
    if [[ $TOTAL -gt 0 ]]; then
      echo "Findings:"
      printf '  %s\n' "${FINDINGS[@]}"
      echo ""
    fi
    echo "========================================"
    echo "  Secret Scan Summary"
    echo "========================================"
    echo "High:   $SEVERITY_HIGH"
    echo "Medium: $SEVERITY_MEDIUM"
    echo "Low:    $SEVERITY_LOW"
    echo "Total:  $TOTAL"
    ;;

  json)
    json_findings="["
    first=1
    for f in "${FINDINGS[@]}"; do
      [[ $first -eq 0 ]] && json_findings+=","
      first=0
      sev=$(echo "$f" | awk -F'[][]' '{print $2}')
      name=$(echo "$f" | awk -F' :: ' '{print $1}' | tr -d '[]')
      loc=$(echo "$f" | awk -F' :: ' '{print $2}')
      val=$(echo "$f" | awk -F' :: ' '{print $3}' | sed 's/"/\\"/g')
      json_findings+="{\"severity\":\"$sev\",\"type\":\"$name\",\"location\":\"$loc\",\"value\":\"$val\"}"
    done
    json_findings+="]"
    cat > "${OUTPUT}.json" <<JSON
{
  "scanDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "path": "${SCAN_PATH}",
  "counts": { "high": $SEVERITY_HIGH, "medium": $SEVERITY_MEDIUM, "low": $SEVERITY_LOW },
  "findings": ${json_findings}
}
JSON
    echo "JSON report: ${OUTPUT}.json"
    ;;

  sarif)
    # SARIF 2.1.0 — minimal but valid schema for GitHub Code Scanning
    sarif_results="["
    first=1
    rule_index=0
    declare -A RULE_MAP=()
    rules_json="["
    first_rule=1
    for f in "${FINDINGS[@]}"; do
      sev=$(echo "$f" | awk -F'[][]' '{print $2}')
      name=$(echo "$f" | awk -F' :: ' '{print $1}' | tr -d '[]')
      loc=$(echo "$f" | awk -F' :: ' '{print $2}')
      file_path=$(echo "$loc" | cut -d: -f1)
      line_no=$(echo "$loc" | cut -d: -f2)
      [[ $first -eq 0 ]] && sarif_results+=","
      first=0

      if [[ -z "${RULE_MAP[$name]:-}" ]]; then
        rule_index=$((rule_index+1))
        RULE_MAP[$name]=$rule_index
        [[ $first_rule -eq 0 ]] && rules_json+=","
        first_rule=0
        level="warning"
        [[ "$sev" == "high" ]] && level="error"
        rules_json+="{\"id\":\"secret-$rule_index\",\"name\":\"$name\",\"shortDescription\":{\"text\":\"$name\"},\"defaultConfiguration\":{\"level\":\"$level\"}}"
      fi
      rid=${RULE_MAP[$name]}
      sarif_results+="{\"ruleId\":\"secret-$rid\",\"level\":\"$([ "$sev" == "high" ] && echo error || echo warning)\",\"message\":{\"text\":\"$name\"},\"locations\":[{\"physicalLocation\":{\"artifactLocation\":{\"uri\":\"$file_path\"},\"region\":{\"startLine\":$line_no}}}]}"
    done
    sarif_results+="]"
    rules_json+="]"

    cat > "${OUTPUT}.sarif.json" <<SARIF
{
  "\$schema": "https://json.schemastore.org/sarif-2.1.0.json",
  "version": "2.1.0",
  "runs": [{
    "tool": {
      "driver": {
        "name": "ovds-secret-scanner",
        "version": "1.0",
        "informationUri": "https://ovds.example/security",
        "rules": ${rules_json}
      }
    },
    "results": ${sarif_results}
  }]
}
SARIF
    echo "SARIF report: ${OUTPUT}.sarif.json"
    ;;
esac

# ---------------------------------------------------------------------------
# Exit code
# ---------------------------------------------------------------------------
FAIL=false
case "$FAIL_ON" in
  low)    [[ $TOTAL -gt 0 ]] && FAIL=true ;;
  medium) [[ $((SEVERITY_HIGH + SEVERITY_MEDIUM)) -gt 0 ]] && FAIL=true ;;
  high)   [[ $SEVERITY_HIGH -gt 0 ]] && FAIL=true ;;
esac

if [[ "$FAIL" == "true" ]]; then
  echo ""
  echo "❌ Secrets detected — review required"
  exit 1
fi

if [[ $TOTAL -gt 0 ]]; then
  echo ""
  echo "⚠ Low-risk findings detected — review recommended"
fi
exit 0