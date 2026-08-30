#!/usr/bin/env bash
# OVDS Security Testing Runner
# Orchestrates the complete security testing workflow:
#   1. Starts the security testing stack
#   2. Runs ZAP scans
#   3. Generates reports
#   4. Cleans up
#
# Usage:
#   ./scripts/security-test-runner.sh [baseline|full|api|all]
#
# Examples:
#   ./scripts/security-test-runner.sh baseline
#   ./scripts/security-test-runner.sh full
#   ./scripts/security-test-runner.sh api
#   ./scripts/security-test-runner.sh all

set -euo pipefail

SCAN_TYPE="${1:-baseline}"
TARGET_URL="${TARGET_URL:-http://localhost:3000}"
API_DEFINITION="${API_DEFINITION:-http://localhost:3001/api/openapi.json}"
REPORT_DIR="./security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILES="-f docker-compose.ovds.yml -f docker-compose.security.yml"

mkdir -p "${REPORT_DIR}"

echo "========================================"
echo "  OVDS Security Testing Runner"
echo "========================================"
echo "Scan Type:  ${SCAN_TYPE}"
echo "Target:     ${TARGET_URL}"
echo "API Def:    ${API_DEFINITION}"
echo "Reports:    ${REPORT_DIR}"
echo ""

# Cleanup handler
cleanup() {
  echo ""
  echo "Cleaning up..."
  docker compose ${COMPOSE_FILES} down -v || true
}
trap cleanup EXIT

# Start application stack
echo "Starting application stack..."
docker compose ${COMPOSE_FILES} up -d mysql
sleep 10

# Run migrations and seed
echo "Running database migrations..."
docker compose ${COMPOSE_FILES} exec -T backend npm run db:migrate:prod -w @ovds/database || true
docker compose ${COMPOSE_FILES} exec -T backend npm run seed:demo -w @ovds/database || true

# Start backend in background
echo "Starting backend..."
docker compose ${COMPOSE_FILES} up -d backend

# Wait for backend to be healthy
echo "Waiting for backend to be healthy..."
for i in $(seq 1 60); do
  if curl -s -o /dev/null -w "%{http_code}" "${TARGET_URL}/health/live" | grep -q "200"; then
    echo "✓ Backend is healthy"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "ERROR: Backend failed to become healthy"
    exit 1
  fi
  sleep 5
done

# Wait for ZAP to be ready
echo "Waiting for ZAP to be ready..."
ZAP_API_KEY="${ZAP_API_KEY:-ovds-zap-secret}"
for i in $(seq 1 60); do
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/JSON/core/view/version/?apikey=${ZAP_API_KEY}" | grep -q "200"; then
    echo "✓ ZAP is ready"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "ERROR: ZAP failed to start"
    exit 1
  fi
  sleep 3
done

# Run scans
case "${SCAN_TYPE}" in
  baseline)
    echo ""
    echo "Running Baseline Scan..."
    docker compose ${COMPOSE_FILES} exec -T zap \
      zap-baseline.py \
      -t "${TARGET_URL}" \
      -r "/zap/wrk/reports/zap-baseline-${TIMESTAMP}.html" \
      -J "/zap/wrk/reports/zap-baseline-${TIMESTAMP}.json" \
      -I \
      --max_children 5 \
      --max_depth 10 \
      --max_scan_time 30m \
      -j \
      --auto || true
    ;;

  full)
    echo ""
    echo "Running Full Scan..."
    docker compose ${COMPOSE_FILES} exec -T zap \
      zap-full-scan.py \
      -t "${TARGET_URL}" \
      -r "/zap/wrk/reports/zap-full-${TIMESTAMP}.html" \
      --max_children 5 \
      --max_depth 10 \
      --max_scan_time 60m \
      -j \
      --auto || true
    ;;

  api)
    echo ""
    echo "Running API Scan..."
    docker compose ${COMPOSE_FILES} exec -T zap \
      zap-api-scan.py \
      -t "${API_DEFINITION}" \
      -f openapi \
      -r "/zap/wrk/reports/zap-api-${TIMESTAMP}.html" \
      --max_children 5 \
      --max_depth 10 \
      --max_scan_time 60m \
      -j \
      --auto || true
    ;;

  all)
    echo ""
    echo "Running All Scans..."
    
    echo "  [1/3] Baseline Scan..."
    docker compose ${COMPOSE_FILES} exec -T zap \
      zap-baseline.py \
      -t "${TARGET_URL}" \
      -r "/zap/wrk/reports/zap-baseline-${TIMESTAMP}.html" \
      -J "/zap/wrk/reports/zap-baseline-${TIMESTAMP}.json" \
      -I \
      --max_children 5 \
      --max_depth 10 \
      --max_scan_time 30m \
      -j \
      --auto || true

    echo "  [2/3] Full Scan..."
    docker compose ${COMPOSE_FILES} exec -T zap \
      zap-full-scan.py \
      -t "${TARGET_URL}" \
      -r "/zap/wrk/reports/zap-full-${TIMESTAMP}.html" \
      --max_children 5 \
      --max_depth 10 \
      --max_scan_time 60m \
      -j \
      --auto || true

    echo "  [3/3] API Scan..."
    docker compose ${COMPOSE_FILES} exec -T zap \
      zap-api-scan.py \
      -t "${API_DEFINITION}" \
      -f openapi \
      -r "/zap/wrk/reports/zap-api-${TIMESTAMP}.html" \
      --max_children 5 \
      --max_depth 10 \
      --max_scan_time 60m \
      -j \
      --auto || true
    ;;
esac

# Copy reports to host
echo ""
echo "Copying reports to ${REPORT_DIR}..."
docker compose ${COMPOSE_FILES} cp zap:/zap/wrk/reports/. "${REPORT_DIR}/" || true

# Display summary
echo ""
echo "========================================"
echo "  Security Testing Complete"
echo "========================================"
echo "Reports saved to: ${REPORT_DIR}/"
ls -la "${REPORT_DIR}/" 2>/dev/null || echo "No reports generated"

echo ""
echo "Next steps:"
echo "  1. Review HTML reports in ${REPORT_DIR}/"
echo "  2. Validate findings (eliminate false positives)"
echo "  3. Update remediation register"
echo "  4. Create tasks for confirmed vulnerabilities"
