# Security Alerting Script for OVDS (Windows)
# Sends alerts when critical/high security findings are detected
#
# Usage:
#   .\scripts\security-alert.ps1 -Severity high -Message "SQL Injection found in /api/users" -Details "URL: /api/users?id=1"
#
# Supported channels:
#   - Slack (webhook)
#   - Email (SMTP)
#   - Microsoft Teams (webhook)
#   - Console (default)

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("critical", "high", "medium", "low", "info")]
    [string]$Severity = "info",

    [Parameter(Mandatory=$true)]
    [string]$Message,

    [Parameter(Mandatory=$false)]
    [string]$Details = "",

    [Parameter(Mandatory=$false)]
    [ValidateSet("console", "slack", "email", "teams")]
    [string]$Channel = "console"
)

$ErrorActionPreference = "Stop"

# Severity colors
$colorMap = @{
    "critical" = "#ff0000"
    "high" = "#ff6600"
    "medium" = "#ffcc00"
    "low" = "#0066ff"
    "info" = "#666666"
}
$color = $colorMap[$Severity]

# Timestamp
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"

# Alert payload
$alertPayload = @{
    timestamp = $timestamp
    severity = $Severity
    message = $Message
    details = $Details
    source = "OVDS Security Testing"
    application = "OVDS"
} | ConvertTo-Json

function Send-ConsoleAlert {
    param([string]$Payload)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  SECURITY ALERT" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Payload
    Write-Host "========================================" -ForegroundColor Cyan
}

function Send-SlackAlert {
    param([string]$Payload)
    
    $webhook = $env:SLACK_WEBHOOK_URL
    if (-not $webhook) {
        Write-Host "Slack webhook not configured. Set SLACK_WEBHOOK_URL environment variable." -ForegroundColor Yellow
        return
    }
    
    $payloadObj = $Payload | ConvertFrom-Json
    $slackPayload = @{
        attachments = @(
            @{
                color = $color
                title = "🚨 OVDS Security Alert"
                text = $payloadObj.message
                fields = @(
                    @{ title = "Severity"; value = $payloadObj.severity; short = $true }
                    @{ title = "Timestamp"; value = $payloadObj.timestamp; short = $true }
                )
                footer = "OVDS Security Testing"
                ts = [long](Get-Date -UFormat %s)
            }
        )
    } | ConvertTo-Json -Depth 3
    
    try {
        Invoke-RestMethod -Uri $webhook -Method Post -Body $slackPayload -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
        Write-Host "✅ Slack alert sent" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Failed to send Slack alert: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

function Send-EmailAlert {
    param([string]$Payload)
    
    $smtpHost = $env:SMTP_HOST
    $smtpPort = $env:SMTP_PORT
    $fromAddr = $env:SMTP_FROM
    $toAddr = $env:SMTP_TO
    
    if (-not $smtpHost -or -not $toAddr) {
        Write-Host "Email not configured. Set SMTP_* environment variables." -ForegroundColor Yellow
        return
    }
    
    $payloadObj = $Payload | ConvertFrom-Json
    $subject = "[OVDS Security Alert] $($payloadObj.severity): $($payloadObj.message)"
    $body = "$($payloadObj.timestamp) - $($payloadObj.severity): $($payloadObj.message)`nDetails: $($payloadObj.details)"
    
    try {
        Send-MailMessage -SmtpServer $smtpHost -Port $smtpPort -From $fromAddr -To $toAddr -Subject $subject -Body $body -ErrorAction SilentlyContinue | Out-Null
        Write-Host "✅ Email alert sent" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Failed to send email alert: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

function Send-TeamsAlert {
    param([string]$Payload)
    
    $webhook = $env:TEAMS_WEBHOOK_URL
    if (-not $webhook) {
        Write-Host "Teams webhook not configured. Set TEAMS_WEBHOOK_URL environment variable." -ForegroundColor Yellow
        return
    }
    
    $payloadObj = $Payload | ConvertFrom-Json
    $teamsPayload = @{
        "@type" = "MessageCard"
        "@context" = "http://schema.org/extensions"
        themeColor = $color
        title = "🚨 OVDS Security Alert"
        sections = @(
            @{
                activityTitle = "$($payloadObj.severity) Security Finding"
                activitySubtitle = $payloadObj.timestamp
                text = $payloadObj.message
                facts = @(
                    @{ name = "Severity"; value = $payloadObj.severity }
                    @{ name = "Details"; value = $payloadObj.details }
                    @{ name = "Source"; value = "OVDS Security Testing" }
                )
            }
        )
    } | ConvertTo-Json -Depth 3
    
    try {
        Invoke-RestMethod -Uri $webhook -Method Post -Body $teamsPayload -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
        Write-Host "✅ Teams alert sent" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Failed to send Teams alert: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Send alert based on channel
switch ($Channel) {
    "console" { Send-ConsoleAlert -Payload $alertPayload }
    "slack" { Send-SlackAlert -Payload $alertPayload }
    "email" { Send-EmailAlert -Payload $alertPayload }
    "teams" { Send-TeamsAlert -Payload $alertPayload }
}

# Log alert
$logDir = "security-reports"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$logEntry = "[$timestamp] [$Severity] $Message"
if ($Details) {
    $logEntry += " | Details: $Details"
}
$logEntry | Out-File -FilePath "$logDir\security-alerts.log" -Append -Encoding UTF8

exit 0
