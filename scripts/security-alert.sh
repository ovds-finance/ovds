#!/usr/bin/env bash
# Security Alerting Script for OVDS
# Sends alerts when critical/high security findings are detected
#
# Usage:
#   bash scripts/security-alert.sh --severity high --message "SQL Injection found in /api/users" --details "URL: /api/users?id=1"
#
# Supported channels:
#   - Slack (webhook)
#   - Email (SMTP)
#   - Microsoft Teams (webhook)
#   - Console (default)
#
# Configuration:
#   Set environment variables or edit config section below

set -euo pipefail

SEVERITY="${SEVERITY:-info}"
MESSAGE="${MESSAGE:-}"
DETAILS="${DETAILS:-}"
CHANNEL="${CHANNEL:-console}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --severity)
      SEVERITY="$2"
      shift 2
      ;;
    --message)
      MESSAGE="$2"
      shift 2
      ;;
    --details)
      DETAILS="$2"
      shift 2
      ;;
    --channel)
      CHANNEL="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ -z "$MESSAGE" ]; then
  echo "Usage: $0 --severity <severity> --message <message> [--details <details>] [--channel <channel>]"
  exit 1
fi

# Severity colors
case $SEVERITY in
  critical) COLOR="#ff0000" ;;
  high) COLOR="#ff6600" ;;
  medium) COLOR="#ffcc00" ;;
  low) COLOR="#0066ff" ;;
  *) COLOR="#666666" ;;
esac

# Timestamp
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Alert payload
ALERT_PAYLOAD=$(cat << EOF
{
  "timestamp": "$TIMESTAMP",
  "severity": "$SEVERITY",
  "message": "$MESSAGE",
  "details": "$DETAILS",
  "source": "OVDS Security Testing",
  "application": "OVDS"
}
EOF
)

send_alert() {
  local channel="$1"
  local payload="$2"
  
  case $channel in
    slack)
      send_slack_alert "$payload"
      ;;
    email)
      send_email_alert "$payload"
      ;;
    teams)
      send_teams_alert "$payload"
      ;;
    console)
      send_console_alert "$payload"
      ;;
    *)
      echo "Unknown channel: $channel"
      exit 1
      ;;
  esac
}

send_console_alert() {
  local payload="$1"
  echo "========================================"
  echo "  SECURITY ALERT"
  echo "========================================"
  echo "$payload" | jq .
  echo "========================================"
}

send_slack_alert() {
  local payload="$1"
  local webhook="${SLACK_WEBHOOK_URL:-}"
  
  if [ -z "$webhook" ]; then
    echo "Slack webhook not configured. Set SLACK_WEBHOOK_URL environment variable."
    exit 1
  fi
  
  local slack_payload=$(cat << EOF
{
  "attachments": [
    {
      "color": "$COLOR",
      "title": "🚨 OVDS Security Alert",
      "text": "$MESSAGE",
      "fields": [
        {
          "title": "Severity",
          "value": "$SEVERITY",
          "short": true
        },
        {
          "title": "Timestamp",
          "value": "$TIMESTAMP",
          "short": true
        }
      ],
      "footer": "OVDS Security Testing",
      "ts": $(date +%s)
    }
  ]
}
EOF
)
  
  curl -X POST -H 'Content-Type: application/json' -d "$slack_payload" "$webhook" 2>/dev/null || true
}

send_email_alert() {
  local payload="$1"
  local smtp_host="${SMTP_HOST:-localhost}"
  local smtp_port="${SMTP_PORT:-25}"
  local from_addr="${SMTP_FROM:-security@ovds.com.et}"
  local to_addr="${SMTP_TO:-security@ovds.com.et}"
  
  local subject="[OVDS Security Alert] $SEVERITY: $MESSAGE"
  local body=$(echo "$payload" | jq -r '"\(.timestamp) - \(.severity): \(.message)\nDetails: \(.details)"')
  
  echo "$body" | mail -s "$subject" "$to_addr" 2>/dev/null || \
  echo "Email not configured. Set SMTP_* environment variables."
}

send_teams_alert() {
  local payload="$1"
  local webhook="${TEAMS_WEBHOOK_URL:-}"
  
  if [ -z "$webhook" ]; then
    echo "Teams webhook not configured. Set TEAMS_WEBHOOK_URL environment variable."
    exit 1
  fi
  
  local teams_payload=$(cat << EOF
{
  "@type": "MessageCard",
  "@context": "http://schema.org/extensions",
  "themeColor": "$COLOR",
  "title": "🚨 OVDS Security Alert",
  "sections": [
    {
      "activityTitle": "$SEVERITY Security Finding",
      "activitySubtitle": "$TIMESTAMP",
      "text": "$MESSAGE",
      "facts": [
        {
          "name": "Severity",
          "value": "$SEVERITY"
        },
        {
          "name": "Details",
          "value": "$DETAILS"
        },
        {
          "name": "Source",
          "value": "OVDS Security Testing"
        }
      ]
    }
  ]
}
EOF
)
  
  curl -X POST -H 'Content-Type: application/json' -d "$teams_payload" "$webhook" 2>/dev/null || true
}

# Send alert
send_alert "$CHANNEL" "$ALERT_PAYLOAD"

# Log alert
mkdir -p security-reports
echo "$ALERT_PAYLOAD" >> security-reports/security-alerts.log

exit 0
