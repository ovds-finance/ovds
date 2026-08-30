#!/usr/bin/env bash
# ZAP Session Initializer for OVDS
# Configures ZAP with the OVDS context, users, and policies
# Run this after starting ZAP Desktop to prepare the session
#
# Usage:
#   ./scripts/zap-init-session.sh http://localhost:8080 ovds-zap-secret

set -euo pipefail

ZAP_URL="${1:-http://localhost:8080}"
ZAP_API_KEY="${2:-ovds-zap-secret}"
CONTEXT_FILE="/zap/wrk/.zap/contexts/ovds.context"
POLICY_FILE="/zap/wrk/.zap/policies/ovds-scan.policy"

echo "========================================"
echo "  ZAP Session Initializer for OVDS"
echo "========================================"
echo "ZAP URL:    $ZAP_URL"
echo "API Key:    $ZAP_API_KEY"
echo ""

# Check ZAP is running
if ! curl -s -o /dev/null -w "%{http_code}" "$ZAP_URL/JSON/core/view/version/?apikey=$ZAP_API_KEY" | grep -q "200"; then
    echo "ERROR: ZAP is not running or not accessible at $ZAP_URL"
    exit 1
fi

echo "✓ ZAP is running"

# Import context
echo "Importing OVDS context..."
curl -s -X POST "$ZAP_URL/JSON/context/importContext/?apikey=$ZAP_API_KEY" \
    -F "contextFile=@$CONTEXT_FILE" | jq -r '.Result // "OK"'

# Get context ID
CONTEXT_ID=$(curl -s "$ZAP_URL/JSON/context/action/listContexts/?apikey=$ZAP_API_KEY" | jq -r '.contextList[0].id // "0"')
echo "✓ Context imported (ID: $CONTEXT_ID)"

# Import scan policy
echo "Importing OVDS scan policy..."
curl -s -X POST "$ZAP_URL/JSON/action/importScanPolicy/?apikey=$ZAP_API_KEY" \
    -F "file=@$POLICY_FILE" | jq -r '.Result // "OK"'

# Get policy ID
POLICY_ID=$(curl -s "$ZAP_URL/JSON/ascan/action/exportScanPolicy/?apikey=$ZAP_API_KEY&scanPolicyName=OVDS+Scan+Policy" | jq -r '.scanPolicyId // "0"')
echo "✓ Scan policy imported (ID: $POLICY_ID)"

# Set context as default
echo "Setting OVDS as default context..."
curl -s -X POST "$ZAP_URL/JSON/context/action/setDefaultContextInScope/?apikey=$ZAP_API_KEY" \
    -d "contextName=OVDS"

echo ""
echo "========================================"
echo "  Session Initialized"
echo "========================================"
echo "Context:     OVDS"
echo "Policy:      OVDS Scan Policy"
echo "Test Users:  normal_user, admin_user"
echo ""
echo "Next steps:"
echo "  1. Open ZAP Desktop"
echo "  2. Start manual exploration through the proxy"
echo "  3. Run spider with authenticated users"
echo "  4. Start active scan from the context menu"
echo ""
