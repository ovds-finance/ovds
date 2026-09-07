#!/usr/bin/env bash
# OVDS Phase 5 — OpenAPI Definition Verification (Linux/macOS)
# Counterpart to scripts/zap-verify-openapi.ps1.
#
# Verifies the backend's /api/openapi.json is well-formed, declares auth,
# and covers the routes the ZAP automation plan will attack.
#
# Usage:
#   bash scripts/zap-verify-openapi.sh --backend http://localhost:3001
#   bash scripts/zap-verify-openapi.sh --file ./openapi.json

set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
OPENAPI_PATH=""
OUTPUT_FILE="${OUTPUT_FILE:-./security-reports/openapi-verification.json}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)   BACKEND_URL="$2";   shift 2 ;;
        --file)      OPENAPI_PATH="$2";  shift 2 ;;
        --output)    OUTPUT_FILE="$2";   shift 2 ;;
        --help|-h)   sed -n '2,18p' "$0"; exit 0 ;;
        *) echo "Unknown option: $1" >&2; exit 2 ;;
    esac
done

mkdir -p "$(dirname "$OUTPUT_FILE")"

if [[ -n "$OPENAPI_PATH" && -f "$OPENAPI_PATH" ]]; then
    SOURCE="file:${OPENAPI_PATH}"
    JSON=$(cat "$OPENAPI_PATH")
else
    SOURCE="url:${BACKEND_URL}/api/openapi.json"
    if ! command -v curl >/dev/null 2>&1; then
        echo "ERROR: curl is required to fetch the OpenAPI spec" >&2
        exit 2
    fi
    echo "Fetching OpenAPI spec from $BACKEND_URL/api/openapi.json"
    if ! JSON=$(curl -fsS -m 15 "${BACKEND_URL}/api/openapi.json"); then
        echo "ERROR: cannot fetch OpenAPI spec from $BACKEND_URL/api/openapi.json" >&2
        exit 1
    fi
fi

if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: node is required for spec parsing" >&2
    exit 2
fi

# Pipe the JSON into a Node.js verifier
node -e '
const data = JSON.parse(process.argv[1]);
const source = process.argv[2];
const out = process.argv[3];

const checks = [];
let pass = 0, fail = 0, warn = 0;

function add(id, name, ok, warning, detail) {
    const status = ok ? "pass" : (warning ? "warn" : "fail");
    if (ok) pass++;
    else if (warning) warn++;
    else fail++;
    checks.push({ id, name, pass: ok, warning, detail: detail || "" });
}

// 1) openapi field
add("spec.openapi", "openapi field present and is 3.x",
    typeof data.openapi === "string" && data.openapi.startsWith("3."),
    false,
    "openapi=" + data.openapi);

// 2) info
add("spec.info", "info.title present",
    data.info && typeof data.info.title === "string",
    false,
    "title=" + (data.info && data.info.title));
add("spec.version", "info.version present",
    data.info && typeof data.info.version === "string",
    false,
    "version=" + (data.info && data.info.version));

// 3) servers
add("spec.servers", "servers array present",
    Array.isArray(data.servers) && data.servers.length > 0,
    true,
    "count=" + (Array.isArray(data.servers) ? data.servers.length : 0));

// 4) paths count
const pathCount = data.paths ? Object.keys(data.paths).length : 0;
add("spec.paths.count", "at least 20 paths defined",
    pathCount >= 20,
    true,
    "count=" + pathCount);

// 5) required high-risk endpoints
const required = [
    "/api/auth/login", "/api/auth/refresh", "/api/auth/logout",
    "/api/users", "/api/invoices", "/api/payments",
    "/api/banking/transfers", "/api/admin/users", "/api/health/live"
];
for (const p of required) {
    add("spec.path." + p, "path " + p + " defined",
        data.paths && Object.prototype.hasOwnProperty.call(data.paths, p),
        true, "");
}

// 6) every path has at least one operation
const noOp = [];
if (data.paths) {
    for (const [name, p] of Object.entries(data.paths)) {
        const verbs = ["get","post","put","patch","delete"];
        if (!verbs.some(v => Object.prototype.hasOwnProperty.call(p, v))) {
            noOp.push(name);
        }
    }
}
add("spec.paths.operations", "all paths have at least one operation",
    noOp.length === 0,
    true,
    "missing=" + noOp.join(", "));

// 7) security schemes
const sec = data.components && data.components.securitySchemes;
add("spec.securitySchemes", "components.securitySchemes present",
    sec !== undefined && sec !== null,
    false,
    "schemes=" + (sec ? Object.keys(sec).join(",") : ""));
if (sec) {
    const hasBearer = Object.keys(sec).some(k => /bearer|jwt/i.test(k));
    add("spec.security.bearer", "bearerAuth / JWT scheme defined",
        hasBearer, true, "");
}

// 8) no production URLs
const forbidden = ["api.ovds.example.com", "ovds.example.com", "production.example.com"];
const bad = [];
if (Array.isArray(data.servers)) {
    for (const s of data.servers) {
        if (forbidden.some(f => s.url && s.url.includes(f))) bad.push(s.url);
    }
}
add("spec.no-prod-urls", "no production URLs in spec",
    bad.length === 0, true, "found=" + bad.join(", "));

// 9) responses declared
let missingResp = 0;
if (data.paths) {
    const verbs = ["get","post","put","patch","delete"];
    for (const p of Object.values(data.paths)) {
        for (const v of verbs) {
            const op = p[v];
            if (op && !op.responses) missingResp++;
        }
    }
}
add("spec.responses", "all operations declare responses",
    missingResp === 0, true, "missing=" + missingResp + " operation(s)");

// 10) auth coverage
let missingAuth = 0;
if (data.paths) {
    const verbs = ["get","post","put","patch","delete"];
    for (const p of Object.values(data.paths)) {
        for (const v of verbs) {
            const op = p[v];
            if (!op) continue;
            const has401 = op.responses && Object.prototype.hasOwnProperty.call(op.responses, "401");
            const hasSec = op.security || data.security;
            if (!has401 && !hasSec) missingAuth++;
        }
    }
}
add("spec.auth-coverage", "all operations declare security or 401",
    missingAuth === 0, true, "unprotected=" + missingAuth + " operation(s)");

const report = {
    source,
    checkedAt: new Date().toISOString(),
    totals: { pass, fail, warn },
    checks
};
require("fs").writeFileSync(out, JSON.stringify(report, null, 2));
console.log("");
console.log("========================================");
console.log("  OpenAPI Verification Summary");
console.log("========================================");
console.log("Passed:   " + pass);
console.log("Failed:   " + fail);
console.log("Warnings: " + warn);
console.log("");
console.log("Report: " + out);
process.exit(fail > 0 ? 1 : 0);
' "$JSON" "$SOURCE" "$OUTPUT_FILE"
