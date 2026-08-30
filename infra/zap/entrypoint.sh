#!/bin/bash
set -e

# OVDS ZAP Docker Entrypoint
# Starts ZAP in daemon mode and optionally initializes the session

ZAP_API_KEY="${ZAP_API_KEY:-ovds-zap-secret}"
ZAP_PORT="${ZAP_PORT:-8080}"
INIT_SESSION="${INIT_SESSION:-true}"

echo "Starting OWASP ZAP for OVDS Security Testing..."
echo "API Key: ${ZAP_API_KEY}"
echo "Port: ${ZAP_PORT}"

# Start ZAP in daemon mode
zap.sh -daemon \
  -host 0.0.0.0 \
  -port ${ZAP_PORT} \
  -config api.addr.addr=0.0.0.0 \
  -config api.key=${ZAP_API_KEY} \
  -config connection.timeoutInSecs=60 &

ZAP_PID=$!

# Wait for ZAP to be ready
echo "Waiting for ZAP to start..."
for i in $(seq 1 60); do
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${ZAP_PORT}/JSON/core/view/version/?apikey=${ZAP_API_KEY}" | grep -q "200"; then
    echo "✓ ZAP is ready"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "ERROR: ZAP failed to start within 60 seconds"
    exit 1
  fi
  sleep 2
done

# Initialize session with OVDS context and policies
if [ "${INIT_SESSION}" = "true" ]; then
  echo "Initializing OVDS session..."
  /zap/scripts/zap-init-session.sh "http://localhost:${ZAP_PORT}" "${ZAP_API_KEY}" || true
fi

# Keep running
wait $ZAP_PID
