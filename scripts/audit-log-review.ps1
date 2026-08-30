# Audit Log Review Script (PowerShell)
# Reviews OVDS audit logs for suspicious activity

param()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogDir = Join-Path $ProjectRoot "security-reports"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ReportFile = Join-Path $LogDir "audit-review_$Timestamp.json"

# Ensure log directory exists
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Configuration
$FailedLoginThreshold = 5
$UnauthorizedThreshold = 3
$TimeRangeHours = 24

# Colors
$Red = "`e[31m"
$Yellow = "`e[33m"
$Green = "`e[32m"
$NC = "`e[0m"

Write-Host ""
Write-Host "========================================"
Write-Host "  OVDS Audit Log Review"
Write-Host "========================================"
Write-Host ""

$findings = @()

# Check 1: Failed login attempts
Write-Host -NoNewline "Checking failed login attempts... "
$FailedLogins = 0
$logFile = Join-Path $ProjectRoot "logs" "app.log"
if (Test-Path $logFile) {
    $content = Get-Content $logFile -ErrorAction SilentlyContinue
    $FailedLogins = ($content | Select-String -Pattern "login failed|invalid credentials|authentication failed" -CaseSensitive:$false).Count
}
if ($FailedLogins -gt $FailedLoginThreshold) {
    Write-Host "${Red}FOUND${NC} ($FailedLogins attempts)"
    $findings += @{ severity = "high"; category = "authentication"; description = "Excessive failed login attempts detected"; count = $FailedLogins }
} else {
    Write-Host "${GREEN}OK${NC} ($FailedLogins attempts)"
}

# Check 2: Unauthorized access attempts
Write-Host -NoNewline "Checking unauthorized access attempts... "
$Unauthorized = 0
if (Test-Path $logFile) {
    $content = Get-Content $logFile -ErrorAction SilentlyContinue
    $Unauthorized = ($content | Select-String -Pattern "unauthorized|forbidden|access denied" -CaseSensitive:$false).Count
}
if ($Unauthorized -gt $UnauthorizedThreshold) {
    Write-Host "${Red}FOUND${NC} ($Unauthorized attempts)"
    $findings += @{ severity = "medium"; category = "authorization"; description = "Excessive unauthorized access attempts"; count = $Unauthorized }
} else {
    Write-Host "${GREEN}OK${NC} ($Unauthorized attempts)"
}

# Check 3: SQL injection patterns
Write-Host -NoNewline "Checking for SQL injection patterns... "
$SqlInjection = 0
if (Test-Path $logFile) {
    $content = Get-Content $logFile -ErrorAction SilentlyContinue
    $SqlInjection = ($content | Select-String -Pattern "union select|drop table|insert into|delete from|1=1|or 1=1" -CaseSensitive:$false).Count
}
if ($SqlInjection -gt 0) {
    Write-Host "${Red}FOUND${NC} ($SqlInjection patterns)"
    $findings += @{ severity = "high"; category = "injection"; description = "Potential SQL injection attempts detected"; count = $SqlInjection }
} else {
    Write-Host "${GREEN}OK${NC}"
}

# Check 4: XSS patterns
Write-Host -NoNewline "Checking for XSS patterns... "
$Xss = 0
if (Test-Path $logFile) {
    $content = Get-Content $logFile -ErrorAction SilentlyContinue
    $Xss = ($content | Select-String -Pattern "<script>|javascript:|onerror=|onload=" -CaseSensitive:$false).Count
}
if ($Xss -gt 0) {
    Write-Host "${Yellow}FOUND${NC} ($Xss patterns)"
    $findings += @{ severity = "medium"; category = "xss"; description = "Potential XSS attempts detected"; count = $Xss }
} else {
    Write-Host "${GREEN}OK${NC}"
}

# Check 5: Path traversal
Write-Host -NoNewline "Checking for path traversal patterns... "
$PathTraversal = 0
if (Test-Path $logFile) {
    $content = Get-Content $logFile -ErrorAction SilentlyContinue
    $PathTraversal = ($content | Select-String -Pattern "\.\.\/|\.\.\\|etc/passwd|proc/self" -CaseSensitive:$false).Count
}
if ($PathTraversal -gt 0) {
    Write-Host "${Yellow}FOUND${NC} ($PathTraversal patterns)"
    $findings += @{ severity = "medium"; category = "path-traversal"; description = "Potential path traversal attempts detected"; count = $PathTraversal }
} else {
    Write-Host "${GREEN}OK${NC}"
}

# Check 6: Rate limit violations
Write-Host -NoNewline "Checking rate limit violations... "
$RateLimit = 0
if (Test-Path $logFile) {
    $content = Get-Content $logFile -ErrorAction SilentlyContinue
    $RateLimit = ($content | Select-String -Pattern "too many requests|rate limit|throttled" -CaseSensitive:$false).Count
}
if ($RateLimit -gt 10) {
    Write-Host "${Yellow}FOUND${NC} ($RateLimit violations)"
    $findings += @{ severity = "low"; category = "rate-limiting"; description = "Excessive rate limit violations"; count = $RateLimit }
} else {
    Write-Host "${GREEN}OK${NC}"
}

# Check 7: Unusual user agents
Write-Host -NoNewline "Checking for suspicious user agents... "
$SuspiciousUA = 0
if (Test-Path $logFile) {
    $content = Get-Content $logFile -ErrorAction SilentlyContinue
    $SuspiciousUA = ($content | Select-String -Pattern "curl|wget|python|scanner|bot|crawler" -CaseSensitive:$false).Count
}
if ($SuspiciousUA -gt 20) {
    Write-Host "${Yellow}FOUND${NC} ($SuspiciousUA requests)"
    $findings += @{ severity = "low"; category = "reconnaissance"; description = "Suspicious user agents detected"; count = $SuspiciousUA }
} else {
    Write-Host "${GREEN}OK${NC}"
}

# Check 8: Admin actions
Write-Host -NoNewline "Checking admin actions... "
$AdminActions = 0
if (Test-Path $logFile) {
    $content = Get-Content $logFile -ErrorAction SilentlyContinue
    $AdminActions = ($content | Select-String -Pattern "admin|delete|drop|truncate" -CaseSensitive:$false).Count
}
if ($AdminActions -gt 0) {
    Write-Host "${GREEN}Found${NC} ($AdminActions actions - review recommended)"
    $findings += @{ severity = "low"; category = "admin-activity"; description = "Admin actions detected - review recommended"; count = $AdminActions }
} else {
    Write-Host "${GREEN}OK${NC}"
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Review Complete"
Write-Host "========================================"
Write-Host ""

# Generate report
$summary = @{
    totalFindings = $findings.Count
    high = ($findings | Where-Object { $_.severity -eq "high" }).Count
    medium = ($findings | Where-Object { $_.severity -eq "medium" }).Count
    low = ($findings | Where-Object { $_.severity -eq "low" }).Count
}

$report = @{
    timestamp = (Get-Date -Format "o")
    timeRange = "${TimeRangeHours}h"
    findings = $findings
    summary = $summary
}

$report | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportFile -Encoding utf8

Write-Host "Findings:"
Write-Host "  High:   $($summary.high)"
Write-Host "  Medium: $($summary.medium)"
Write-Host "  Low:    $($summary.low)"
Write-Host "  Total:  $($summary.totalFindings)"
Write-Host ""
Write-Host "Report saved to: $ReportFile"

# Exit with error if high findings
if ($summary.high -gt 0) {
    Write-Host "${Red}WARNING: High severity findings detected!${NC}"
    exit 1
} elseif ($summary.medium -gt 0) {
    Write-Host "${Yellow}WARNING: Medium severity findings detected.${NC}"
    exit 0
} else {
    Write-Host "${Green}No critical findings detected.${NC}"
    exit 0
}
