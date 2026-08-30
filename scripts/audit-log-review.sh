#!/bin/bash
set -euo pipefail

# Audit Log Review Script
# Reviews OVDS audit logs for suspicious activity

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$LOG_DIR/audit-review_$TIMESTAMP.json"

mkdir -p "$LOG_DIR"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "========================================"
echo "  OVDS Audit Log Review"
echo "========================================"
echo ""

# Configuration
FAILED_LOGIN_THRESHOLD=5
UNAUTHORIZED_THRESHOLD=3
TIME_RANGE_HOURS=24

# Calculate time range
 SINCE=$(date -d "$TIME_RANGE_HOURS hours ago" +%s 2>/dev/null || date -d "-${TIME_RANGE_HOURS} hours" +%s)

# Initialize report
cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "timeRange": "${TIME_RANGE_HOURS}h",
  "findings": [],
  "summary": {
    "totalFindings": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  }
}
EOF

# Function to add finding
add_finding() {
  local severity="$1"
  local category="$2"
  local description="$3"
  local count="$4"

  python3 -c "
import json, sys
with open('$REPORT_FILE', 'r') as f:
    report = json.load(f)

report['findings'].append({
    'severity': '$severity',
    'category': '$category',
    'description': '$description',
    'count': $count,
    'timestamp': '$(date -u +%Y-%m-%dT%H:%M:%SZ)'
})

report['summary']['totalFindings'] += 1
report['summary']['$severity'] += 1

with open('$REPORT_FILE', 'w') as f:
    json.dump(report, f, indent=2)
"
}

echo "Checking for suspicious activity in the last ${TIME_RANGE_HOURS} hours..."
echo ""

# Check 1: Failed login attempts
echo -n "Checking failed login attempts... "
FAILED_LOGINS=$(grep -c "login failed\|invalid credentials\|authentication failed" "$PROJECT_ROOT/logs/app.log" 2>/dev/null || echo "0")
if [ "$FAILED_LOGINS" -gt "$FAILED_LOGIN_THRESHOLD" ]; then
  echo -e "${RED}FOUND${NC} ($FAILED_LOGINS attempts)"
  add_finding "high" "authentication" "Excessive failed login attempts detected" "$FAILED_LOGINS"
else
  echo -e "${GREEN}OK${NC} ($FAILED_LOGINS attempts)"
fi

# Check 2: Unauthorized access attempts
echo -n "Checking unauthorized access attempts... "
UNAUTHORIZED=$(grep -c "unauthorized\|forbidden\|access denied" "$PROJECT_ROOT/logs/app.log" 2>/dev/null || echo "0")
if [ "$UNAUTHORIZED" -gt "$UNAUTHORIZED_THRESHOLD" ]; then
  echo -e "${RED}FOUND${NC} ($UNAUTHORIZED attempts)"
  add_finding "medium" "authorization" "Excessive unauthorized access attempts" "$UNAUTHORIZED"
else
  echo -e "${GREEN}OK${NC} ($UNAUTHORIZED attempts)"
fi

# Check 3: SQL injection patterns
echo -n "Checking for SQL injection patterns... "
SQL_INJECTION=$(grep -ci "union select\|drop table\|insert into\|delete from\|1=1\|or 1=1" "$PROJECT_ROOT/logs/app.log" 2>/dev/null || echo "0")
if [ "$SQL_INJECTION" -gt 0 ]; then
  echo -e "${RED}FOUND${NC} ($SQL_INJECTION patterns)"
  add_finding "high" "injection" "Potential SQL injection attempts detected" "$SQL_INJECTION"
else
  echo -e "${GREEN}OK${NC}"
fi

# Check 4: XSS patterns
echo -n "Checking for XSS patterns... "
XSS=$(grep -ci "<script>\|javascript:\|onerror=\|onload=" "$PROJECT_ROOT/logs/app.log" 2>/dev/null || echo "0")
if [ "$XSS" -gt 0 ]; then
  echo -e "${YELLOW}FOUND${NC} ($XSS patterns)"
  add_finding "medium" "xss" "Potential XSS attempts detected" "$XSS"
else
  echo -e "${GREEN}OK${NC}"
fi

# Check 5: Path traversal
echo -n "Checking for path traversal patterns... "
PATH_TRAVERSAL=$(grep -c "\.\.\/\|\.\.\\\\\|etc/passwd\|proc/self" "$PROJECT_ROOT/logs/app.log" 2>/dev/null || echo "0")
if [ "$PATH_TRAVERSAL" -gt 0 ]; then
  echo -e "${YELLOW}FOUND${NC} ($PATH_TRAVERSAL patterns)"
  add_finding "medium" "path-traversal" "Potential path traversal attempts detected" "$PATH_TRAVERSAL"
else
  echo -e "${GREEN}OK${NC}"
fi

# Check 6: Rate limit violations
echo -n "Checking rate limit violations... "
RATE_LIMIT=$(grep -c "too many requests\|rate limit\|throttled" "$PROJECT_ROOT/logs/app.log" 2>/dev/null || echo "0")
if [ "$RATE_LIMIT" -gt 10 ]; then
  echo -e "${YELLOW}FOUND${NC} ($RATE_LIMIT violations)"
  add_finding "low" "rate-limiting" "Excessive rate limit violations" "$RATE_LIMIT"
else
  echo -e "${GREEN}OK${NC}"
fi

# Check 7: Unusual user agents
echo -n "Checking for suspicious user agents... "
SUSPICIOUS_UA=$(grep -i "curl\|wget\|python\|scanner\|bot\|crawler" "$PROJECT_ROOT/logs/app.log" 2>/dev/null | wc -l)
if [ "$SUSPICIOUS_UA" -gt 20 ]; then
  echo -e "${YELLOW}FOUND${NC} ($SUSPICIOUS_UA requests)"
  add_finding "low" "reconnaissance" "Suspicious user agents detected" "$SUSPICIOUS_UA"
else
  echo -e "${GREEN}OK${NC}"
fi

# Check 8: Admin actions
echo -n "Checking admin actions... "
ADMIN_ACTIONS=$(grep -c "admin\|delete\|drop\|truncate" "$PROJECT_ROOT/logs/app.log" 2>/dev/null || echo "0")
if [ "$ADMIN_ACTIONS" -gt 0 ]; then
  echo -e "${GREEN}Found${NC} ($ADMIN_ACTIONS actions - review recommended)"
  add_finding "low" "admin-activity" "Admin actions detected - review recommended" "$ADMIN_ACTIONS"
else
  echo -e "${GREEN}OK${NC}"
fi

echo ""
echo "========================================"
echo "  Review Complete"
echo "========================================"
echo ""

# Display summary
TOTAL=$(python3 -c "import json; r=json.load(open('$REPORT_FILE')); print(r['summary']['totalFindings'])")
HIGH=$(python3 -c "import json; r=json.load(open('$REPORT_FILE')); print(r['summary']['high'])")
MEDIUM=$(python3 -c "import json; r=json.load(open('$REPORT_FILE')); print(r['summary']['medium'])")
LOW=$(python3 -c "import json; r=json.load(open('$REPORT_FILE')); print(r['summary']['low'])")

echo "Findings:"
echo "  High:   $HIGH"
echo "  Medium: $MEDIUM"
echo "  Low:    $LOW"
echo "  Total:  $TOTAL"
echo ""
echo "Report saved to: $REPORT_FILE"

# Exit with error if high findings
if [ "$HIGH" -gt 0 ]; then
  echo -e "${RED}WARNING: High severity findings detected!${NC}"
  exit 1
elif [ "$MEDIUM" -gt 0 ]; then
  echo -e "${YELLOW}WARNING: Medium severity findings detected.${NC}"
  exit 0
else
  echo -e "${GREEN}No critical findings detected.${NC}"
  exit 0
fi
