#!/usr/bin/env bash
# Secret Scanning Script for OVDS
# Scans the codebase for exposed secrets, API keys, passwords, and credentials
# Cross-platform counterpart: scripts/scan-secrets.ps1
#
# Usage:
#   bash scripts/scan-secrets.sh [--path .] [--format text|json] [--fail-on high|medium|low]
#
# Examples:
#   bash scripts/scan-secrets.sh
#   bash scripts/scan-secrets.sh --path ./apps/backend --fail-on high
#   bash scripts/scan-secrets.sh --format json --output secrets-report.json

set -euo pipefail

SCAN_PATH="${SCAN_PATH:-.}"
FORMAT="${FORMAT:-text}"
OUTPUT="${OUTPUT:-security-reports/secrets-scan}"
FAIL_ON="${FAIL_ON:-high}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --path)
      SCAN_PATH="$2"
      shift 2
      ;;
    --format)
      FORMAT="$2"
      shift 2
      ;;
    --output)
      OUTPUT="$2"
      shift 2
      ;;
    --fail-on)
      FAIL_ON="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "========================================"
echo "  OVDS Secret Scanner"
echo "========================================"
echo "Path:     $SCAN_PATH"
echo "Format:   $FORMAT"
echo "Fail on:  $FAIL_ON"
echo ""

# Create output directory
mkdir -p "$(dirname "$OUTPUT")"

# Secret patterns to detect
declare -A PATTERNS=(
  ["AWS Access Key"]="AKIA[0-9A-Z]{16}"
  ["AWS Secret Key"]="(?i)aws(.{0,20})?['\"][0-9a-zA-Z/+=]{40}['\"]"
  ["Private Key"]="-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----"
  ["API Key"]="(?i)(api[_-]?key|apikey)['\"]?\s*[:=]\s*['\"][0-9a-zA-Z_\-]{20,}['\"]"
  ["Bearer Token"]="(?i)bearer\s+[0-9a-zA-Z_\-\._~+/]+=*"
  ["Basic Auth"]="(?i)basic\s+[0-9a-zA-Z+/]{20,}={0,2}"
  ["Password in URL"]="(?i)://[^:]+:[^@]+@"
  ["JWT Token"]="eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"
  ["GitHub Token"]="(?i)github[_-]?token['\"]?\s*[:=]\s*['\"][0-9a-zA-Z_]{35,40}['\"]"
  ["Google API Key"]="AIza[0-9A-Za-z\-_]{35}"
  ["Slack Token"]="xox[abpr]-[0-9a-zA-Z-]+"
  ["Stripe API Key"]="(?i)sk_(live|test)_[0-9a-zA-Z]{24,}"
  ["Twilio API Key"]="SK[0-9a-fA-F]{32}"
  ["Mailgun API Key"]="key-[0-9a-zA-Z]{32}"
  ["Generic Secret"]="(?i)(secret|password|passwd|pwd)['\"]?\s*[:=]\s*['\"][^'\"]{8,}['\"]"
  ["Database URL"]="(?i)(mysql|postgresql|mongodb|redis)://[^:]+:[^@]+@"
  ["Private Key File"]="\.(pem|key|p12|pfx)$"
  ["Environment File"]="\.env(\..+)?$"
)

# Files to exclude
EXCLUDE_PATTERNS=(
  "node_modules"
  ".git"
  "dist"
  "build"
  "coverage"
  "*.min.js"
  "*.min.css"
  "package-lock.json"
  "yarn.lock"
  "pnpm-lock.yaml"
  ".zap"
  "security-reports"
)

# Build exclude arguments
EXCLUDE_ARGS=()
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  EXCLUDE_ARGS+=(-path "*/$pattern" -prune -o)
done

# Scan for secrets
FINDINGS=()
TOTAL_FINDINGS=0

echo "Scanning for secrets..."
echo ""

# Use grep to scan for patterns
for pattern_name in "${!PATTERNS[@]}"; do
  pattern="${PATTERNS[$pattern_name]}"
  
  # Skip private key files - we'll check them separately
  if [[ "$pattern_name" == "Private Key File" ]]; then
    continue
  fi
  
  # Search for pattern
  matches=$(grep -r -P -n -I "${pattern}" "${SCAN_PATH}" 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "dist" | grep -v "build" | grep -v "coverage" | grep -v ".zap" | grep -v "security-reports" | head -20 || true)
  
  if [[ -n "$matches" ]]; then
    echo "[$pattern_name] Found potential secrets:"
    echo "$matches" | while IFS= read -r line; do
      echo "  $line"
    done
    echo ""
    
    # Add to findings
    while IFS= read -r line; do
      FINDINGS+=("$pattern_name|$line")
      TOTAL_FINDINGS=$((TOTAL_FINDINGS + 1))
    done <<< "$matches"
  fi
done

# Check for private key files
echo "[Private Key Files] Checking for private key files..."
private_key_files=$(find "${SCAN_PATH}" -type f \( -name "*.pem" -o -name "*.key" -o -name "*.p12" -o -name "*.pfx" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" 2>/dev/null || true)

if [[ -n "$private_key_files" ]]; then
  echo "  Found private key files:"
  echo "$private_key_files" | while IFS= read -r line; do
    echo "  $line"
  done
  echo ""
  
  while IFS= read -r line; do
    FINDINGS+=("Private Key File|$line")
    TOTAL_FINDINGS=$((TOTAL_FINDINGS + 1))
  done <<< "$private_key_files"
fi

# Check for .env files
echo "[Environment Files] Checking for .env files..."
env_files=$(find "${SCAN_PATH}" -type f -name ".env*" ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null || true)

if [[ -n "$env_files" ]]; then
  echo "  Found .env files:"
  echo "$env_files" | while IFS= read -r line; do
    echo "  $line"
  done
  echo ""
fi

# Summary
echo "========================================"
echo "  Secret Scan Summary"
echo "========================================"
echo "Total findings: $TOTAL_FINDINGS"
echo ""

if [[ $TOTAL_FINDINGS -eq 0 ]]; then
  echo "✅ No secrets found"
  exit 0
fi

# Determine exit code based on severity
FAIL=false

if [[ "$FAIL_ON" == "low" ]]; then
  if [[ $TOTAL_FINDINGS -gt 0 ]]; then
    FAIL=true
  fi
elif [[ "$FAIL_ON" == "medium" ]]; then
  # Count medium+ findings (API keys, tokens, etc.)
  MEDIUM_COUNT=$(printf '%s\n' "${FINDINGS[@]}" | grep -c -E "API Key|Bearer Token|Basic Auth|JWT Token|GitHub Token|Google API Key|Slack Token|Stripe API Key|Twilio API Key|Mailgun API Key|Generic Secret" || true)
  if [[ $MEDIUM_COUNT -gt 0 ]]; then
    FAIL=true
  fi
elif [[ "$FAIL_ON" == "high" ]]; then
  # Count high findings (AWS keys, private keys, database URLs)
  HIGH_COUNT=$(printf '%s\n' "${FINDINGS[@]}" | grep -c -E "AWS Access Key|AWS Secret Key|Private Key|Database URL|Password in URL" || true)
  if [[ $HIGH_COUNT -gt 0 ]]; then
    FAIL=true
  fi
fi

if [[ "$FAIL" == "true" ]]; then
  echo "❌ Secrets detected - review required"
  echo ""
  echo "Remediation:"
  echo "  1. Remove secrets from code"
  echo "  2. Rotate exposed credentials"
  echo "  3. Use environment variables or secret management"
  echo "  4. Add secrets to .gitignore"
  exit 1
else
  echo "⚠️  Low-risk findings detected - review recommended"
  exit 0
fi
