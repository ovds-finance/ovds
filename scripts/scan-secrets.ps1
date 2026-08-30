# Secret Scanning Script for OVDS (Windows)
# Scans the codebase for exposed secrets, API keys, passwords, and credentials
# Cross-platform counterpart: scripts/scan-secrets.sh
#
# Usage:
#   .\scripts\scan-secrets.ps1 -Path "." -Format text -FailOn high
#
# Examples:
#   .\scripts\scan-secrets.ps1
#   .\scripts\scan-secrets.ps1 -Path ".\apps\backend" -FailOn high
#   .\scripts\scan-secrets.ps1 -Format json -Output ".\security-reports\secrets-report.json"

param(
    [Parameter(Mandatory=$false)]
    [string]$Path = ".",

    [Parameter(Mandatory=$false)]
    [ValidateSet("text", "json")]
    [string]$Format = "text",

    [Parameter(Mandatory=$false)]
    [string]$Output = ".\security-reports\secrets-scan",

    [Parameter(Mandatory=$false)]
    [ValidateSet("low", "medium", "high")]
    [string]$FailOn = "high"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS Secret Scanner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Path:     $Path"
Write-Host "Format:   $Format"
Write-Host "Fail on:  $FailOn"
Write-Host ""

# Create output directory
$outputDir = Split-Path -Parent $Output
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Secret patterns to detect
$patterns = @{
    "AWS Access Key" = "AKIA[0-9A-Z]{16}"
    "AWS Secret Key" = "(?i)aws(.{0,20})?['`"][0-9a-zA-Z/+=]{40}['`"]"
    "Private Key" = "-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----"
    "API Key" = "(?i)(api[_-]?key|apikey)['`"]?\s*[:=]\s*['`"][0-9a-zA-Z_\-]{20,}['`"]"
    "Bearer Token" = "(?i)bearer\s+[0-9a-zA-Z_\-\._~+/]+=*"
    "Basic Auth" = "(?i)basic\s+[0-9a-zA-Z+/]{20,}={0,2}"
    "Password in URL" = "(?i)://[^:]+:[^@]+@"
    "JWT Token" = "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"
    "GitHub Token" = "(?i)github[_-]?token['`"]?\s*[:=]\s*['`"][0-9a-zA-Z_]{35,40}['`"]"
    "Google API Key" = "AIza[0-9A-Za-z\-_]{35}"
    "Slack Token" = "xox[abpr]-[0-9a-zA-Z-]+"
    "Stripe API Key" = "(?i)sk_(live|test)_[0-9a-zA-Z]{24,}"
    "Twilio API Key" = "SK[0-9a-fA-F]{32}"
    "Mailgun API Key" = "key-[0-9a-zA-Z]{32}"
    "Generic Secret" = "(?i)(secret|password|passwd|pwd)['`"]?\s*[:=]\s*['`"][^'`"]{8,}['`"]"
    "Database URL" = "(?i)(mysql|postgresql|mongodb|redis)://[^:]+:[^@]+@"
}

# Exclude patterns
$excludePatterns = @("node_modules", ".git", "dist", "build", "coverage", "*.min.js", "*.min.css", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".zap", "security-reports")

# Get all files to scan
$filesToScan = Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $exclude = $false
    foreach ($excludePattern in $excludePatterns) {
        if ($_.FullName -like "*\$excludePattern*") {
            $exclude = $true
            break
        }
    }
    -not $exclude
}

Write-Host "Scanning $($filesToScan.Count) files..."
Write-Host ""

$findings = @()
$totalFindings = 0

foreach ($file in $filesToScan) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        
        foreach ($patternName in $patterns.Keys) {
            $pattern = $patterns[$patternName]
            $matches = [regex]::Matches($content, $pattern)
            
            if ($matches.Count -gt 0) {
                foreach ($match in $matches) {
                    $lineNumber = ($content.Substring(0, $match.Index)).Split("`n").Count
                    $finding = "$patternName|$($file.FullName):$lineNumber|$($match.Value)"
                    $findings += $finding
                    $totalFindings++
                    
                    if ($Format -eq "text") {
                        Write-Host "[$patternName] $($file.FullName):$lineNumber" -ForegroundColor Red
                        Write-Host "  Value: $($match.Value.Substring(0, [Math]::Min(50, $match.Value.Length)))..." -ForegroundColor DarkRed
                    }
                }
            }
        }
    } catch {
        # Skip files that can't be read
    }
}

# Check for private key files
Write-Host "[Private Key Files] Checking for private key files..." -ForegroundColor Yellow
$privateKeyFiles = Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $_.Extension -match "\.(pem|key|p12|pfx)$" -and
    $_.FullName -notlike "*node_modules*" -and
    $_.FullName -notlike "*.git*"
}

foreach ($file in $privateKeyFiles) {
    $finding = "Private Key File|$($file.FullName)"
    $findings += $finding
    $totalFindings++
    Write-Host "  Found: $($file.FullName)" -ForegroundColor Red
}

# Check for .env files
Write-Host ""
Write-Host "[Environment Files] Checking for .env files..." -ForegroundColor Yellow
$envFiles = Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -like ".env*" -and
    $_.FullName -notlike "*node_modules*" -and
    $_.FullName -notlike "*.git*"
}

foreach ($file in $envFiles) {
    Write-Host "  Found: $($file.FullName)" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Secret Scan Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total findings: $totalFindings"
Write-Host ""

if ($totalFindings -eq 0) {
    Write-Host "✅ No secrets found" -ForegroundColor Green
    exit 0
}

# Generate JSON report if requested
if ($Format -eq "json") {
    $report = @{
        scanDate = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        path = $Path
        totalFindings = $totalFindings
        findings = @()
    }
    
    foreach ($finding in $findings) {
        $parts = $finding -split "\|"
        $report.findings += @{
            type = $parts[0]
            location = $parts[1]
            value = $parts[2]
        }
    }
    
    $report | ConvertTo-Json -Depth 3 | Out-File -FilePath "$Output.json" -Encoding UTF8
    Write-Host "JSON report saved to: $Output.json" -ForegroundColor Green
}

# Determine exit code based on severity
$fail = $false

if ($FailOn -eq "low") {
    if ($totalFindings -gt 0) {
        $fail = $true
    }
} elseif ($FailOn -eq "medium") {
    $mediumCount = ($findings | Where-Object { $_ -match "API Key|Bearer Token|Basic Auth|JWT Token|GitHub Token|Google API Key|Slack Token|Stripe API Key|Twilio API Key|Mailgun API Key|Generic Secret" }).Count
    if ($mediumCount -gt 0) {
        $fail = $true
    }
} elseif ($FailOn -eq "high") {
    $highCount = ($findings | Where-Object { $_ -match "AWS Access Key|AWS Secret Key|Private Key|Database URL|Password in URL" }).Count
    if ($highCount -gt 0) {
        $fail = $true
    }
}

if ($fail) {
    Write-Host "❌ Secrets detected - review required" -ForegroundColor Red
    Write-Host ""
    Write-Host "Remediation:"
    Write-Host "  1. Remove secrets from code"
    Write-Host "  2. Rotate exposed credentials"
    Write-Host "  3. Use environment variables or secret management"
    Write-Host "  4. Add secrets to .gitignore"
    exit 1
} else {
    Write-Host "⚠️  Low-risk findings detected - review recommended" -ForegroundColor Yellow
    exit 0
}
