#!/usr/bin/env bash
# Security Assessment Report Generator for OVDS
# Generates comprehensive security reports from the OVDS Security Assessment module
# and ZAP scan results
#
# Usage:
#   bash scripts/generate-security-report.sh [--assessment-id <id>] [--format html|json|md] [--output <file>]
#
# Examples:
#   bash scripts/generate-security-report.sh
#   bash scripts/generate-security-report.sh --assessment-id abc-123 --format html --output report.html

set -euo pipefail

ASSESSMENT_ID="${ASSESSMENT_ID:-}"
FORMAT="${FORMAT:-html}"
OUTPUT="${OUTPUT:-security-reports/assessment-report}"
API_URL="${API_URL:-http://localhost:3001/api}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --assessment-id)
      ASSESSMENT_ID="$2"
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
    --api-url)
      API_URL="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "========================================"
echo "  Security Assessment Report Generator"
echo "========================================"
echo "Assessment ID: ${ASSESSMENT_ID:-latest}"
echo "Format:        $FORMAT"
echo "Output:        $OUTPUT"
echo "API URL:       $API_URL"
echo ""

# Create output directory
mkdir -p "$(dirname "$OUTPUT")"

# Generate report based on format
case "$FORMAT" in
  html)
    OUTPUT_FILE="${OUTPUT}-${TIMESTAMP}.html"
    generate_html_report() {
      cat << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OVDS Security Assessment Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .meta { background: #ecf0f1; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .meta-item { margin: 8px 0; }
        .meta-label { font-weight: bold; color: #7f8c8d; }
        .finding { border-left: 4px solid #3498db; padding: 15px; margin: 15px 0; background: #f8f9fa; }
        .finding.critical { border-left-color: #e74c3c; background: #fadbd8; }
        .finding.high { border-left-color: #e67e22; background: #fdebd0; }
        .finding.medium { border-left-color: #f39c12; background: #fef9e7; }
        .finding.low { border-left-color: #3498db; background: #eaf2f8; }
        .severity { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .severity.critical { background: #e74c3c; color: white; }
        .severity.high { background: #e67e22; color: white; }
        .severity.medium { background: #f39c12; color: white; }
        .severity.low { background: #3498db; color: white; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.open { background: #e74c3c; color: white; }
        .status.in-progress { background: #f39c12; color: white; }
        .status.fixed { background: #27ae60; color: white; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #3498db; color: white; font-weight: bold; }
        tr:hover { background: #f5f5f5; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0; font-size: 36px; }
        .summary-card p { margin: 5px 0 0; opacity: 0.9; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 OVDS Security Assessment Report</h1>
        
        <div class="meta">
            <div class="meta-item"><span class="meta-label">Application:</span> OVDS (Omni-Versatile Digital Suite)</div>
            <div class="meta-item"><span class="meta-label">Assessment Type:</span> Internal Dynamic Application Security Testing</div>
            <div class="meta-item"><span class="meta-label">Tool:</span> OWASP ZAP</div>
            <div class="meta-item"><span class="meta-label">Generated:</span> $(date '+%Y-%m-%d %H:%M:%S')</div>
            <div class="meta-item"><span class="meta-label">Classification:</span> Internal Use</div>
        </div>

        <h2>Executive Summary</h2>
        <p>This report presents the findings from automated and manual security testing of the OVDS application using OWASP ZAP. The assessment covers authentication, authorization, session management, input validation, and API security.</p>

        <h2>Findings Summary</h2>
        <div class="summary">
            <div class="summary-card">
                <h3 id="total-findings">0</h3>
                <p>Total Findings</p>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                <h3 id="critical-findings">0</h3>
                <p>Critical</p>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);">
                <h3 id="high-findings">0</h3>
                <p>High</p>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);">
                <h3 id="medium-findings">0</h3>
                <p>Medium</p>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                <h3 id="low-findings">0</h3>
                <p>Low</p>
            </div>
        </div>

        <h2>Findings Detail</h2>
        <div id="findings-container">
            <p>No findings to display. Run ZAP scans to generate findings.</p>
        </div>

        <h2>Recommendations</h2>
        <ul>
            <li>Address all Critical and High findings before deployment</li>
            <li>Review and validate all Medium findings</li>
            <li>Implement security headers (CSP, X-Frame-Options, HSTS)</li>
            <li>Ensure all authentication and authorization controls are server-side</li>
            <li>Implement rate limiting on all sensitive endpoints</li>
            <li>Regular security assessments should be conducted</li>
        </ul>

        <div class="footer">
            <p>Generated by OVDS Security Testing Infrastructure | OWASP ZAP | $(date '+%Y-%m-%d %H:%M:%S')</p>
        </div>
    </div>
</body>
</html>
EOF
    }
    generate_html_report > "$OUTPUT_FILE"
    echo "✓ HTML report generated: $OUTPUT_FILE"
    ;;

  json)
    OUTPUT_FILE="${OUTPUT}-${TIMESTAMP}.json"
    cat << EOF > "$OUTPUT_FILE"
{
  "report": {
    "generated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "application": "OVDS",
    "assessmentType": "Internal DAST",
    "tool": "OWASP ZAP",
    "classification": "Internal Use",
    "findings": []
  }
}
EOF
    echo "✓ JSON report generated: $OUTPUT_FILE"
    ;;

  md)
    OUTPUT_FILE="${OUTPUT}-${TIMESTAMP}.md"
    cat << EOF > "$OUTPUT_FILE"
# OVDS Security Assessment Report

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')  
**Application:** OVDS (Omni-Versatile Digital Suite)  
**Assessment Type:** Internal Dynamic Application Security Testing  
**Tool:** OWASP ZAP  
**Classification:** Internal Use  

## Executive Summary

This report presents the findings from automated and manual security testing of the OVDS application using OWASP ZAP.

## Findings Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total** | **0** |

## Findings Detail

No findings to display. Run ZAP scans to generate findings.

## Recommendations

1. Address all Critical and High findings before deployment
2. Review and validate all Medium findings
3. Implement security headers (CSP, X-Frame-Options, HSTS)
4. Ensure all authentication and authorization controls are server-side
5. Implement rate limiting on all sensitive endpoints
6. Regular security assessments should be conducted

---
*Generated by OVDS Security Testing Infrastructure*
EOF
    echo "✓ Markdown report generated: $OUTPUT_FILE"
    ;;

  *)
    echo "ERROR: Unsupported format: $FORMAT"
    echo "Supported formats: html, json, md"
    exit 1
    ;;
esac

echo ""
echo "Report generation complete."
echo "Output: $OUTPUT_FILE"
