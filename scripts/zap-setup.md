# ZAP Security Testing Setup

This directory contains the complete OWASP ZAP security testing infrastructure for the OVDS application.

## Quick Start

```bash
# 1. Validate configuration
node scripts/validate-zap-config.mjs

# 2. Seed test users
npm run seed:zap-users

# 3. Start the security testing stack
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d

# 4. Run scans
bash scripts/security-test-runner.sh all

# 5. View reports
open security-reports/zap-*.html
```

## Directory Structure

```
.zap/                          # ZAP configuration
├── contexts/
│   └── ovds.context           # Application context with auth config
├── policies/
│   └── ovds-scan.policy       # Custom scan policy with 50+ rules
├── users/
│   └── test-users.json        # Test user credentials
├── automation/
│   ├── ovds-authenticated-scan.yaml  # Authenticated scan config
│   └── ovds-api-scan.yaml            # API scan config
└── scripts/
    └── authentication/         # Auth helper scripts

infra/zap/                     # Custom ZAP Docker image
├── Dockerfile                 # Pre-configured ZAP image
└── entrypoint.sh              # Auto-initializes OVDS session

scripts/                       # Security testing scripts
├── zap-baseline.ps1           # Passive scan (Windows)
├── zap-baseline-scan.sh       # Passive scan (Linux/macOS)
├── zap-full-scan.ps1          # Active scan (Windows)
├── zap-authenticated-scan.ps1 # Authenticated active scan
├── zap-api-scan.ps1           # API security scan
├── zap-init-session.sh        # ZAP Desktop session initializer
├── security-test-runner.sh    # Full workflow orchestrator (bash)
├── security-test-runner.ps1   # Full workflow orchestrator (PowerShell)
├── seed-zap-test-users.mjs    # Create test users via API
├── seed-zap-test-users-db.mjs # Create test users directly in DB
├── seed-zap-test-data.mjs     # Create synthetic test data
├── zap-import-results.mjs     # Import ZAP results to security module
├── validate-zap-config.mjs    # Configuration validator
├── zap-setup.md               # Setup documentation
├── remediation-register.md    # Remediation tracking template
└── security-testing-checklist.md  # Manual testing checklist

docker-compose.security.yml    # Security testing stack overlay
```

## Available Scripts

### Scan Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `zap-baseline.ps1` / `.sh` | Passive scan (no active payloads) | `pwsh scripts/zap-baseline.ps1 -TargetUrl http://localhost:3000` |
| `zap-full-scan.ps1` / `.sh` | Active scan (with attack payloads) | `pwsh scripts/zap-full-scan.ps1 -TargetUrl http://staging.example.com` |
| `zap-authenticated-scan.ps1` / `.sh` | Authenticated active scan | `pwsh scripts/zap-authenticated-scan.ps1 -TargetFrontend http://localhost:3000 -TargetBackend http://localhost:3001` |
| `zap-api-scan.ps1` / `.sh` | API security scan | `pwsh scripts/zap-api-scan.ps1 -ApiDefinition http://localhost:3001/api/openapi.json` |

### Utility Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `validate-zap-config.mjs` | Validate ZAP configuration | `node scripts/validate-zap-config.mjs` |
| `seed-zap-test-users.mjs` | Create test users via API | `node scripts/seed-zap-test-users.mjs --api-url http://localhost:3001/api --admin-token <jwt>` |
| `seed-zap-test-users-db.mjs` | Create test users in DB | `npm run seed:zap-users` |
| `seed-zap-test-data.mjs` | Create synthetic test data | `node scripts/seed-zap-test-data.mjs --api-url http://localhost:3001/api --token <jwt>` |
| `zap-import-results.mjs` | Import ZAP results to security module | `node scripts/zap-import-results.mjs --report zap-report.json --assessment-id <id>` |
| `zap-init-session.sh` / `.ps1` | Initialize ZAP Desktop session | `bash scripts/zap-init-session.sh http://localhost:8080 ovds-zap-secret` |
| `security-test-runner.sh` / `.ps1` | Full security testing workflow | `bash scripts/security-test-runner.sh all` |
| `zap-explore-helper.sh` / `.ps1` | Phase 1 manual exploration helper | `bash scripts/zap-explore-helper.sh` |
| `zap-verify-openapi.sh` / `.ps1` | Phase 5 OpenAPI pre-flight | `bash scripts/zap-verify-openapi.sh --backend http://localhost:3001` |
| `zap-test-authentication.sh` / `.ps1` | Phase 6 §13.1 | `pwsh scripts/zap-test-authentication.ps1` |
| `zap-test-authorization.sh` / `.ps1` | Phase 6 §13.2 | `pwsh scripts/zap-test-authorization.ps1` |
| `zap-test-session.sh` / `.ps1` | Phase 6 §13.3 | `pwsh scripts/zap-test-session.ps1` |
| `zap-test-input-validation.sh` / `.ps1` | Phase 6 §13.4 | `pwsh scripts/zap-test-input-validation.ps1` |
| `zap-test-misc.sh` / `.ps1` | Phase 6 §13.5/13.6/13.8 | `pwsh scripts/zap-test-misc.ps1` |
| `zap-test-rate-limit.sh` / `.ps1` | Phase 6 §13.9 | `pwsh scripts/zap-test-rate-limit.ps1` |
| `zap-test-manual-all.sh` / `.ps1` | Phase 6 master runner | `pwsh scripts/zap-test-manual-all.ps1` |
| `zap-retest.sh` / `.ps1` | §18 retest helper | `pwsh scripts/zap-retest.ps1 -FindingsFile security-reports/retest-input.json` |
| `zap-export-findings.mjs` | ZAP → redacted Markdown | `node scripts/zap-export-findings.mjs` |
| `zap-report-diff.mjs` | Baseline diff | `node scripts/zap-report-diff.mjs --baseline security-reports/zap-baseline-report.json` |
| `security-status-snapshot.mjs` | Aggregate status | `node scripts/security-status-snapshot.mjs` |
| `scan-secrets.sh` / `.ps1` | Hardened secret scanner (SARIF) | `bash scripts/scan-secrets.sh --format sarif --output security-reports/secret-scan` |
| `security-policy-check.sh` / `.ps1` | Governance checker | `pwsh scripts/security-policy-check.ps1` |

## Docker Compose

### Security Testing Stack

```bash
# Start application + ZAP
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d

# Check status
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml ps

# Stop and clean up
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml down -v
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | scanner.user@ovds.local / ZapScan#2024!Strong |
| Backend API | http://localhost:3001/api | scanner.user@ovds.local / ZapScan#2024!Strong |
| ZAP Desktop | http://localhost:8080 | API Key: ovds-zap-secret |

## CI/CD Integration

### GitHub Actions Workflow

The workflow `.github/workflows/zap-security-scan.yml` implements the four security gates:

**Gate 1 - Setup & Authorization**
- Validates ZAP configuration
- Confirms test environment
- Checks prerequisites

**Gate 2 - Build & Deploy**
- Builds application
- Runs database migrations
- Seeds demo data
- Starts application stack

**Gate 3 - ZAP Scan**
- Runs baseline or full scan
- Parses results
- Evaluates security gate against threshold

**Gate 4 - Retest & Sign-off**
- Confirms all gates passed
- Generates security summary
- Uploads reports as artifacts

### Workflow Triggers

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Weekly schedule (Monday 2 AM)
- Manual trigger with options:
  - Target URL
  - Scan type (baseline/full)
  - Fail threshold (low/medium/high/critical)

## Integration with Security Assessment Module

The OVDS application includes a built-in Security Assessment module (`security-assessment`) that can be used to track findings:

### Backend API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/security-assessment/assessments` | GET | List assessments |
| `/api/security-assessment/assessments` | POST | Create assessment |
| `/api/security-assessment/assessments/:id` | GET | Get assessment |
| `/api/security-assessment/assessments/:id` | PUT | Update assessment |
| `/api/security-assessment/assessments/:id/start` | POST | Start assessment |
| `/api/security-assessment/assessments/:id/complete` | POST | Complete assessment |
| `/api/security-assessment/assessments/:id/scans` | GET | List scans |
| `/api/security-assessment/assessments/:id/scans` | POST | Create scan |
| `/api/security-assessment/findings` | GET | List findings |
| `/api/security-assessment/findings/:id` | GET | Get finding |
| `/api/security-assessment/findings/:id` | PUT | Update finding |
| `/api/security-assessment/summary` | GET | Get summary stats |

### Importing ZAP Results

Use `zap-import-results.mjs` to parse ZAP reports and prepare them for import:

```bash
# Parse report and show findings
node scripts/zap-import-results.mjs --report zap-baseline-report.json --dry-run

# Import into specific assessment
node scripts/zap-import-results.mjs \
  --report zap-baseline-report.json \
  --api-url http://localhost:3001/api \
  --assessment-id <assessment-id>
```

## Manual Testing Checklist

See `scripts/security-testing-checklist.md` for the complete manual testing checklist based on the OWASP ZAP Security Assessment Guide.

Key areas:
- Authentication testing
- Authorization testing (user-to-user, role-to-role, tenant-to-tenant)
- Session management
- Input validation
- File upload security
- Error handling
- Sensitive data exposure
- Business logic
- Rate limiting
- API security
- Security headers

## Remediation Tracking

Use `scripts/remediation-register.md` to track findings through remediation:

| Field | Description |
|-------|-------------|
| Finding ID | Unique identifier |
| Severity | Critical/High/Medium/Low/Info |
| Source | ZAP/Manual/Code Review |
| Status | Open/In Progress/Fixed/Risk Accepted/False Positive |
| Owner | Assigned developer/team |
| Target Date | Agreed remediation date |
| Retest Result | Not tested/Fixed/Partially fixed/Not fixed/Risk accepted/False positive |

## Security Gates

| Gate | Requirement | Blocking |
|------|-------------|----------|
| 1 | Written authorization, approved environment, backup completed | Yes |
| 2 | Main workflows explored, all roles tested, API definitions imported | Yes |
| 3 | No unresolved Critical/High findings, Medium corrected or accepted | Yes |
| 4 | Critical/High fixes retested, regression testing completed | Yes |

## Test Accounts

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| scanner.user@ovds.local | ZapScan#2024!Strong | EMPLOYEE | Normal user testing |
| scanner.admin@ovds.local | ZapRoot#2024!Secure | ADMIN | Administrative testing |
| scanner.supervisor@ovds.local | ZapSuper#2024!View | SUPERVISOR | Supervisor testing |
| scanner.disabled@ovds.local | ZapDisabled#2024!Test | EMPLOYEE | Disabled account testing |

## Troubleshooting

### ZAP container won't start
```bash
# Check Docker is running
docker --version

# Check port conflicts
netstat -ano | findstr :8080

# View logs
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml logs zap
```

### Test users can't log in
```bash
# Verify users exist
npm run seed:zap-users

# Check backend logs
docker compose -f docker-compose.ovds.yml logs backend
```

### Scan not discovering endpoints
```bash
# Verify context configuration
cat .zap/contexts/ovds.context

# Check application is running
curl http://localhost:3000/health/live

# Try manual exploration first
# Use ZAP Desktop to manually browse the application
```

## Phase 6 — Mandatory Manual Tests

OWASP ZAP automated scanning is not sufficient on its own. The following
manual tests must be performed and recorded:

| §    | Area                                | Script                                          |
|------|-------------------------------------|-------------------------------------------------|
| 13.1 | Authentication                      | `scripts/zap-test-authentication.ps1` / `.sh`   |
| 13.2 | Authorization (IDOR, mass-assign)   | `scripts/zap-test-authorization.ps1` / `.sh`     |
| 13.3 | Session Management                  | `scripts/zap-test-session.ps1` / `.sh`          |
| 13.4 | Input Validation                    | `scripts/zap-test-input-validation.ps1` / `.sh`  |
| 13.5 | File Upload                         | `scripts/zap-test-misc.ps1` / `.sh`              |
| 13.6 | Error Handling                      | `scripts/zap-test-misc.ps1` / `.sh`              |
| 13.8 | Business Logic                      | `scripts/zap-test-misc.ps1` / `.sh`              |
| 13.9 | Rate Limiting & Abuse Controls      | `scripts/zap-test-rate-limit.ps1` / `.sh`        |

Run the full Phase 6 suite via:

```bash
pwsh scripts/zap-test-manual-all.ps1
# or on Linux/macOS:
bash scripts/zap-test-manual-all.sh
```

The bash variants are drop-in replacements. The full manual checklist
(including checks that cannot be automated, like MFA bypass and CSV
injection) lives in `scripts/security-testing-checklist.md`.

### Phase 1 — Manual Exploration Helper

Before automated crawling, populate the Sites tree manually through ZAP
Desktop:

```bash
pwsh scripts/zap-explore-helper.ps1
```

This prints the ZAP browser proxy configuration, lists every URL you need
to visit (per role), and seed-checks that the application is reachable.

### Exporting Findings to the Remediation Register

After a scan, run:

```bash
node scripts/zap-export-findings.mjs \
  --report security-reports/zap-authenticated-report.json \
  --min High \
  --output security-reports/findings.md
```

This produces Markdown rows that match `scripts/remediation-register.md`
and can be pasted into the register. Tokens, passwords, and session
cookies are redacted automatically.

### Importing Findings into the Security Assessment Module

```bash
node scripts/zap-import-results.mjs \
  --report zap-report.json \
  --api-url http://localhost:3001/api \
  --assessment-id <id> \
  --token <jwt>
```

## References

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [ZAP Automation Framework](https://www.zaproxy.org/docs/automate/automation-framework/)
