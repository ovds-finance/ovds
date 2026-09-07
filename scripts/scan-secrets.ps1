# OVDS Secret Scanner (PowerShell, hardened)
# Cross-platform counterpart: scripts/scan-secrets.sh
#
# Usage:
#   pwsh scripts/scan-secrets.ps1
#   pwsh scripts/scan-secrets.ps1 -Path ./apps/backend -Format sarif -Output security-reports/secrets

param(
    [string]$Path = ".",
    [ValidateSet("text", "json", "sarif")]
    [string]$Format = "text",
    [string]$Output = "security-reports/secrets-scan",
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

$outputDir = Split-Path -Parent $Output
if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }

$patterns = @{
    "AWS Access Key|high"               = "AKIA[0-9A-Z]{16}"
    "AWS Secret Key|high"               = "(?i)aws(.{0,20})?['`"][0-9a-zA-Z/+=]{40}['`"]"
    "Private Key Block|high"            = "-----BEGIN (RSA|DSA|EC|OPENSSH|PRIVATE) KEY-----"
    "Password in URL|high"              = "(?i)://[^\s:/@]+:[^\s@]+@"
    "Database URL with Password|high"   = "(?i)(mysql|postgresql|mongodb|redis|amqp)://[^\s:/@]+:[^\s@]+@"
    "JWT Token|medium"                  = "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"
    "Bearer Token|medium"               = "(?i)bearer\s+[0-9a-zA-Z_\-\._~+/]+=*"
    "Basic Auth Header|medium"          = "(?i)basic\s+[0-9a-zA-Z+/]{20,}={0,2}"
    "GitHub Token|medium"               = "(?i)github[_-]?token['`"]?\s*[:=]\s*['`"][0-9a-zA-Z_]{35,40}['`"]"
    "Google API Key|medium"             = "AIza[0-9A-Za-z\-_]{35}"
    "Slack Token|medium"                = "xox[abpr]-[0-9a-zA-Z-]+"
    "Stripe API Key|medium"             = "(?i)sk_(live|test)_[0-9a-zA-Z]{24,}"
    "Twilio API Key|medium"             = "SK[0-9a-fA-F]{32}"
    "Mailgun API Key|medium"            = "key-[0-9a-zA-Z]{32}"
    "Generic API Key|medium"            = "(?i)(api[_-]?key|apikey)['`"]?\s*[:=]\s*['`"][0-9a-zA-Z_\-]{20,}['`"]"
    "Generic Secret|medium"             = "(?i)(secret|password|passwd|pwd)['`"]?\s*[:=]\s*['`"][^'`"]{8,}['`"]"
}

$excludeDirs   = @("node_modules", ".git", "dist", "build", "coverage", ".nx", ".zap", "security-reports", "out", "tmp")
$excludeFiles  = @("*.min.js", "*.min.css", "package-lock.json", "yarn.lock", "pnpm-lock.yaml")
$excludeTemplates = @(".env.example", ".env.sample", ".env.template", "*.test.example")

function Test-IsBinary {
    param([string]$FilePath)
    $bytes = [System.IO.File]::ReadAllBytes($FilePath)
    $size = $bytes.Length
    if ($size -gt 5MB) { return $true }
    # Check first 4096 bytes for null bytes (binary marker)
    $check = [Math]::Min(4096, $size)
    for ($i = 0; $i -lt $check; $i++) {
        if ($bytes[$i] -eq 0) { return $true }
    }
    return $false
}

$files = Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue

$textFiles = @()
$skippedBinary = 0
$skippedDir = 0
$skippedFile = 0
$skippedTemplate = 0

foreach ($f in $files) {
    $path = $f.FullName
    $excluded = $false
    foreach ($d in $excludeDirs) {
        if ($path -like "*\$d\*") { $excluded = $true; break }
    }
    if ($excluded) { $skippedDir++; continue }

    foreach ($p in $excludeFiles) {
        if ($f.Name -like $p) { $excluded = $true; break }
    }
    if ($excluded) { $skippedFile++; continue }

    foreach ($p in $excludeTemplates) {
        if ($f.Name -like $p) { $excluded = $true; break }
    }
    if ($excluded) { $skippedTemplate++; continue }

    if (Test-IsBinary -FilePath $path) { $skippedBinary++; continue }

    $textFiles += $f
}

Write-Host "Files scanned: $($textFiles.Count)"
Write-Host "Skipped:  binary=$skippedBinary excluded-dir=$skippedDir lockfile=$skippedFile template=$skippedTemplate"
Write-Host ""

$findings = New-Object System.Collections.ArrayList
$sevHigh = 0
$sevMedium = 0
$sevLow = 0

foreach ($file in $textFiles) {
    try {
        $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }

        # Mark as test/fixture/mock paths as low severity by default
        $isTestPath = $file.FullName -match "(test|spec|mock|fixture|fake|example|sample)"

        foreach ($key in $patterns.Keys) {
            $name = ($key -split '\|')[0]
            $severity = ($key -split '\|')[1]
            $pattern = $patterns[$key]

            $regex = New-Object System.Text.RegularExpressions.Regex($pattern)
            $matches = $regex.Matches($content)

            foreach ($m in $matches) {
                $lineNo = ($content.Substring(0, $m.Index)).Split("`n").Count
                $value = $m.Value.Substring(0, [Math]::Min(80, $m.Value.Length))
                $finalSev = $severity
                if ($isTestPath) { $finalSev = "low" }

                $script:findings.Add([PSCustomObject]@{
                    severity = $finalSev
                    type = $name
                    location = "$($file.FullName):$lineNo"
                    value = $value
                }) | Out-Null

                switch ($finalSev) {
                    "high"   { $script:sevHigh++ }
                    "medium" { $script:sevMedium++ }
                    "low"    { $script:sevLow++ }
                }

                if ($Format -eq "text") {
                    $color = if ($finalSev -eq "high") { "Red" } elseif ($finalSev -eq "medium") { "Yellow" } else { "DarkYellow" }
                    Write-Host "  [$finalSev] $name :: $($file.FullName):$lineNo" -ForegroundColor $color
                }

                if ($env:GITHUB_ACTIONS -eq "true") {
                    $level = if ($finalSev -eq "high") { "error" } else { "warning" }
                    Write-Host "::$level file=$($file.FullName),line=$lineNo::$name"
                }
            }
        }
    } catch {
        # skip unreadable
    }
}

$total = $sevHigh + $sevMedium + $sevLow

switch ($Format) {
    "json" {
        $report = @{
            scanDate = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
            path = $Path
            counts = @{ high = $sevHigh; medium = $sevMedium; low = $sevLow }
            findings = $findings
        }
        $report | ConvertTo-Json -Depth 5 | Out-File -FilePath "$Output.json" -Encoding utf8
        Write-Host "JSON report: $Output.json"
    }
    "sarif" {
        $rules = @()
        $ruleIndex = 0
        $ruleMap = @{}
        $results = @()
        foreach ($f in $findings) {
            if (-not $ruleMap.ContainsKey($f.type)) {
                $ruleIndex++
                $ruleMap[$f.type] = $ruleIndex
                $level = if ($f.severity -eq "high") { "error" } else { "warning" }
                $rules += [PSCustomObject]@{
                    id = "secret-$ruleIndex"
                    name = $f.type
                    shortDescription = @{ text = $f.type }
                    defaultConfiguration = @{ level = $level }
                }
            }
            $parts = $f.location -split ':'
            $filePath = ($parts[0..($parts.Length - 2)]) -join ':'
            $lineNo = [int]$parts[-1]
            $level = if ($f.severity -eq "high") { "error" } else { "warning" }
            $results += [PSCustomObject]@{
                ruleId = "secret-$($ruleMap[$f.type])"
                level = $level
                message = @{ text = $f.type }
                locations = @(
                    @{
                        physicalLocation = @{
                            artifactLocation = @{ uri = $filePath }
                            region = @{ startLine = $lineNo }
                        }
                    }
                )
            }
        }
        $sarif = @{
            '$schema' = "https://json.schemastore.org/sarif-2.1.0.json"
            version = "2.1.0"
            runs = @(
                @{
                    tool = @{
                        driver = @{
                            name = "ovds-secret-scanner"
                            version = "1.0"
                            informationUri = "https://ovds.example/security"
                            rules = $rules
                        }
                    }
                    results = $results
                }
            )
        }
        $sarif | ConvertTo-Json -Depth 10 | Out-File -FilePath "$Output.sarif.json" -Encoding utf8
        Write-Host "SARIF report: $Output.sarif.json"
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Secret Scan Summary" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host "High:   $sevHigh"
Write-Host "Medium: $sevMedium"
Write-Host "Low:    $sevLow"
Write-Host "Total:  $total"

$fail = $false
switch ($FailOn) {
    "low"    { if ($total -gt 0) { $fail = $true } }
    "medium" { if ($sevHigh + $sevMedium -gt 0) { $fail = $true } }
    "high"   { if ($sevHigh -gt 0) { $fail = $true } }
}

if ($fail) {
    Write-Host ""
    Write-Host "❌ Secrets detected — review required" -ForegroundColor Red
    exit 1
}
if ($total -gt 0) {
    Write-Host ""
    Write-Host "⚠ Low-risk findings detected — review recommended" -ForegroundColor Yellow
}
exit 0