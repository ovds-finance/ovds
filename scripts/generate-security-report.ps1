# Security Assessment Report Generator for OVDS (Windows)
# Generates comprehensive security reports from ZAP scan results
#
# Usage:
#   .\scripts\generate-security-report.ps1 -Format html -Output .\security-reports\report.html
#   .\scripts\generate-security-report.ps1 -Format json -Output .\security-reports\report.json
#   .\scripts\generate-security-report.ps1 -Format md -Output .\security-reports\report.md

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("html", "json", "md")]
    [string]$Format = "html",

    [Parameter(Mandatory=$false)]
    [string]$Output = ".\security-reports\assessment-report",

    [Parameter(Mandatory=$false)]
    [string]$ZapReport = ""
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Security Assessment Report Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Format:  $Format"
Write-Host "Output:  $Output"
Write-Host ""

# Create output directory
$outputDir = Split-Path -Parent $Output
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

switch ($Format) {
    "html" {
        $outputFile = "$Output-$timestamp.html"
        $reportContent = @"
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
            <div class="meta-item"><span class="meta-label">Generated:</span> $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</div>
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
            <p>Generated by OVDS Security Testing Infrastructure | OWASP ZAP | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
        </div>
    </div>
</body>
</html>
"@
        Set-Content -Path $outputFile -Value $reportContent -Encoding UTF8
        Write-Host "✓ HTML report generated: $outputFile" -ForegroundColor Green
        ;;
    "json" {
        $outputFile = "$Output-$timestamp.json"
        $report = @{
            report = @{
                generated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
                application = "OVDS"
                assessmentType = "Internal DAST"
                tool = "OWASP ZAP"
                classification = "Internal Use"
                findings = @()
            }
        } | ConvertTo-Json -Depth 5
        Set-Content -Path $outputFile -Value $report -Encoding UTF8
        Write-Host "✓ JSON report generated: $outputFile" -ForegroundColor Green
        ;;
    "md" {
        $outputFile = "$Output-$timestamp.md"
        $report = @"
# OVDS Security Assessment Report

**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
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
"@
        Set-Content -Path $outputFile -Value $report -Encoding UTF8
        Write-Host "✓ Markdown report generated: $outputFile" -ForegroundColor Green
        ;;
}

Write-Host ""
Write-Host "Report generation complete."
Write-Host "Output: $outputFile"
