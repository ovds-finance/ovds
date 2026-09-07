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
USERS_FILE="/zap/wrk/.zap/users/test-users.json"

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
    -F "contextFile=@$CONTEXT_FILE" | jq -r '.Result // "OK"' || echo "(skipped)"

# Get context ID
CONTEXT_ID=$(curl -s "$ZAP_URL/JSON/context/action/listContexts/?apikey=$ZAP_API_KEY" | jq -r '.contextList[]? | select(.name=="OVDS") | .id // "0"')
echo "✓ Context imported (ID: $CONTEXT_ID)"

# Import scan policy
echo "Importing OVDS scan policy..."
curl -s -X POST "$ZAP_URL/JSON/action/importScanPolicy/?apikey=$ZAP_API_KEY" \
    -F "file=@$POLICY_FILE" | jq -r '.Result // "OK"' || echo "(skipped)"

POLICY_ID=$(curl -s "$ZAP_URL/JSON/ascan/action/viewScanPolicies/?apikey=$ZAP_API_KEY" | jq -r '.scanPolicies[]? | select(.name=="OVDS Scan Policy") | .id // "0"')
echo "✓ Scan policy imported (ID: $POLICY_ID)"

# Import test users
if [ -f "$USERS_FILE" ] && [ "$CONTEXT_ID" != "0" ]; then
    echo "Importing test users..."
    for row in $(jq -c '.ovds_test_users[]?' "$USERS_FILE"); do
        USERNAME=$(echo "$row" | jq -r '.email')
        PASSWORD=$(echo "$row" | jq -r '.password')
        ROLE=$(echo "$row" | jq -r '.role')

        curl -s -X POST "$ZAP_URL/JSON/users/action/addUser/?apikey=$ZAP_API_KEY" \
            -d "contextId=$CONTEXT_ID" \
            -d "name=$ROLE" \
            -d "username=$USERNAME" \
            -d "password=$PASSWORD" >/dev/null || true
        echo "  + user $ROLE ($USERNAME)"
    done
    echo "✓ Test users imported"
fi

# Set context as default scope
echo "Setting OVDS as default in-scope context..."
curl -s -X POST "$ZAP_URL/JSON/context/action/setDefaultContextInScope/?apikey=$ZAP_API_KEY" \
    -d "contextName=OVDS" >/dev/null || true

echo ""
echo "========================================"
echo "  Session Initialized"
echo "========================================"
echo "Context:     OVDS"
echo "Policy:      OVDS Scan Policy"
echo "Test Users:  normal_user, admin_user, supervisor_user, disabled_user"
echo ""
echo "Next steps:"
echo "  1. Open ZAP Desktop (or use the API at $ZAP_URL)"
echo "  2. Start manual exploration through the proxy"
echo "  3. Run spider with authenticated users"
echo "  4. Start active scan from the context menu"
echo ""
