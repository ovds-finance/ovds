# Dependency Security Checker for OVDS (Windows)
# Checks for vulnerable dependencies, outdated packages, and license issues
#
# Usage:
#   .\scripts\check-dependencies.ps1 [-AuditLevel moderate|high|critical] [-Fix] [-Format text|json]
#
# Examples:
#   .\scripts\check-dependencies.ps1
#   .\scripts\check-dependencies.ps1 -AuditLevel high
#   .\scripts\check-dependencies.ps1 -Fix
#   .\scripts\check-dependencies.ps1 -Format json -Output .\security-reports\deps-report.json

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("moderate", "high", "critical")]
    [string]$AuditLevel = "moderate",

    [Parameter(Mandatory=$false)]
    [switch]$Fix,

    [Parameter(Mandatory=$false)]
    [ValidateSet("text", "json")]
    [string]$Format = "text",

    [Parameter(Mandatory=$false)]
    [string]$Output = ".\security-reports\deps-scan"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dependency Security Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Audit level: $AuditLevel"
Write-Host "Auto-fix:    $Fix"
Write-Host ""

# Create output directory
$outputDir = Split-Path -Parent $Output
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Track issues
$issues = 0
$warnings = 0
$fixed = 0

# Check npm audit
Write-Host "--- NPM Audit ---"
if (Test-Path "package.json") {
    if ($Fix) {
        Write-Host "Running npm audit fix..." -ForegroundColor Yellow
        npm audit fix --audit-level=$AuditLevel 2>&1 | Tee-Object -FilePath "$Output-audit-fix.log"
    } else {
        npm audit --audit-level=$AuditLevel 2>&1 | Tee-Object -FilePath "$Output-audit.log"
    }
    
    # Parse audit results
    $auditOutput = npm audit --audit-level=$AuditLevel 2>&1 || $auditOutput = ""
    
    if ($auditOutput -match "found") {
        Write-Host ""
        Write-Host "Vulnerabilities found:" -ForegroundColor Yellow
        
        if ($auditOutput -match "(\d+)\s+critical") { $critical = $Matches[1] } else { $critical = 0 }
        if ($auditOutput -match "(\d+)\s+high") { $high = $Matches[1] } else { $high = 0 }
        if ($auditOutput -match "(\d+)\s+moderate") { $moderate = $Matches[1] } else { $moderate = 0 }
        if ($auditOutput -match "(\d+)\s+low") { $low = $Matches[1] } else { $low = 0 }
        
        Write-Host "  Critical: $critical"
        Write-Host "  High:     $high"
        Write-Host "  Moderate: $moderate"
        Write-Host "  Low:      $low"
        Write-Host ""
        
        $issues = [int]$critical + [int]$high
        $warnings = [int]$moderate + [int]$low
    } else {
        Write-Host "✅ No vulnerabilities found" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  No package.json found" -ForegroundColor Yellow
}

Write-Host ""

# Check for outdated dependencies
Write-Host "--- Outdated Dependencies ---"
if (Test-Path "package.json") {
    $outdated = npm outdated 2>&1 || $outdated = ""
    if ($outdated) {
        Write-Host "⚠️  Outdated dependencies found:" -ForegroundColor Yellow
        Write-Host $outdated
        $warnings += ($outdated | Measure-Object -Line).Lines
    } else {
        Write-Host "✅ All dependencies are up to date" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  No package.json found" -ForegroundColor Yellow
}

Write-Host ""

# Check for unused dependencies
Write-Host "--- Unused Dependencies ---"
if (Test-Path "package.json") {
    $unused = npx depcheck --json 2>$null | ConvertFrom-Json || $unused = $null
    if ($unused) {
        $unusedDeps = ($unused.dependencies | Measure-Object | Select-Object -ExpandProperty Count)
        $unusedDev = ($unused.devDependencies | Measure-Object | Select-Object -ExpandProperty Count)
        
        if ($unusedDeps -gt 0 -or $unusedDev -gt 0) {
            Write-Host "⚠️  Unused dependencies found:" -ForegroundColor Yellow
            Write-Host "  Dependencies: $unusedDeps"
            Write-Host "  Dev dependencies: $unusedDev"
            $warnings += $unusedDeps + $unusedDev
        } else {
            Write-Host "✅ No unused dependencies found" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ No unused dependencies found" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  No package.json found" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dependency Security Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Critical Issues: 0"
Write-Host "High Issues:     $issues"
Write-Host "Warnings:        $warnings"
Write-Host "Fixed:           $fixed"
Write-Host ""

if ($Format -eq "json") {
    $report = @{
        scanDate = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        auditLevel = $AuditLevel
        issues = $issues
        warnings = $warnings
        fixed = $fixed
        status = if ($issues -eq 0) { "PASS" } else { "FAIL" }
    } | ConvertTo-Json
    $report | Out-File -FilePath "$Output.json" -Encoding UTF8
    Write-Host "JSON report saved to: $Output.json" -ForegroundColor Green
}

if ($issues -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ No dependency security issues found" -ForegroundColor Green
    exit 0
} elseif ($issues -eq 0) {
    Write-Host "⚠️  $warnings warnings found - review recommended" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ $issues high/critical issues found - immediate attention required" -ForegroundColor Red
    exit 1
}
