# OWASP ZAP Security Testing Infrastructure

This directory contains the complete OWASP ZAP security testing infrastructure for the OVDS application, based on the Internal Web Application Security Assessment Guide.

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

## Documentation

- [Security Testing Guide](docs/security-testing-guide.md) - OVDS-specific security testing instructions
- [Security Testing Runbook](docs/security-testing-runbook.md) - Step-by-step assessment procedures
- ~~[Security Status](docs/security-status.md)~~ — archived; content merged into this document
- [ZAP Setup](scripts/zap-setup.md) - ZAP configuration and setup guide
- [Remediation Register](scripts/remediation-register.md) - Finding tracking template
- [Security Testing Checklist](scripts/security-testing-checklist.md) - Manual testing checklist

## Scan Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/zap-baseline.ps1` | Passive scan (no active payloads) | `.\scripts\zap-baseline.ps1 -TargetUrl "http://localhost:3000"` |
| `scripts/zap-full-scan.ps1` | Active scan (with attack payloads) | `.\scripts\zap-full-scan.ps1 -TargetUrl "http://staging.example.com"` |
| `scripts/zap-authenticated-scan.ps1` | Authenticated active scan | `.\scripts\zap-authenticated-scan.ps1 -TargetFrontend "http://localhost:3000" -TargetBackend "http://localhost:3001"` |
| `scripts/zap-api-scan.ps1` | API security scan | `.\scripts\zap-api-scan.ps1 -ApiDefinition "http://localhost:3001/api/openapi.json"` |

## Utility Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/validate-zap-config.mjs` | Validate ZAP configuration | `node scripts/validate-zap-config.mjs` |
| `scripts/seed-zap-test-users.mjs` | Create test users via API | `node scripts/seed-zap-test-users.mjs --api-url http://localhost:3001/api --admin-token <jwt>` |
| `scripts/seed-zap-test-users-db.mjs` | Create test users in DB | `npm run seed:zap-users` |
| `scripts/seed-zap-test-data.mjs` | Create synthetic test data | `node scripts/seed-zap-test-data.mjs --api-url http://localhost:3001/api --token <jwt>` |
| `scripts/zap-import-results.mjs` | Import ZAP results to security module | `node scripts/zap-import-results.mjs --report zap-report.json --assessment-id <id>` |
| `scripts/check-app-readiness.sh` | Check app readiness (Linux/macOS) | `bash scripts/check-app-readiness.sh` |
| `scripts/check-app-readiness.ps1` | Check app readiness (Windows) | `.\scripts\check-app-readiness.ps1` |
| `scripts/check-security-config.sh` | Check security config (Linux/macOS) | `bash scripts/check-security-config.sh` |
| `scripts/check-security-config.ps1` | Check security config (Windows) | `.\scripts\check-security-config.ps1` |
| `scripts/security-test-runner.sh` | Full workflow orchestrator (bash) | `bash scripts/security-test-runner.sh all` |
| `scripts/security-test-runner.ps1` | Full workflow orchestrator (PowerShell) | `.\scripts\security-test-runner.ps1 -ScanType all` |
| `scripts/security-summary.sh` | Security testing summary (bash) | `bash scripts/security-summary.sh` |
| `scripts/security-summary.ps1` | Security testing summary (PowerShell) | `.\scripts\security-summary.ps1` |
| `scripts/generate-security-report.sh` | Generate report (bash) | `bash scripts/generate-security-report.sh --format html` |
| `scripts/generate-security-report.ps1` | Generate report (PowerShell) | `.\scripts\generate-security-report.ps1 -Format html` |
| `scripts/zap-init-session.sh` | Initialize ZAP Desktop session | `bash scripts/zap-init-session.sh http://localhost:8080 ovds-zap-secret` |

## NPM Scripts

```bash
# Validate ZAP configuration
npm run security:zap:config

# Seed test users
npm run security:zap:seed

# Run scans
npm run security:zap:baseline
npm run security:zap:full
npm run security:zap:auth
npm run security:zap:api
npm run security:zap:all

# Generate reports
npm run security:report

# Check application readiness
npm run security:check

# Check security configuration
npm run security:check:config

# View summary
npm run security:summary
```

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
- Weekly schedule (Monday 2 AM UTC)
- Manual trigger with options:
  - Target URL
  - Scan type (baseline/full)
  - Fail threshold (low/medium/high/critical)

## Security Status

![Security Scan](https://github.com/ovds/ovds/actions/workflows/zap-security-scan.yml/badge.svg)

This badge shows the status of the latest OWASP ZAP security scan.

### Scan Schedule

- **Baseline scans:** On every push and pull request to `main` and `develop` branches
- **Full scans:** Weekly on Monday at 2 AM UTC, or manually triggered
- **On-demand:** Use the workflow dispatch option in GitHub Actions

### How to Trigger a Scan

1. Go to the [Actions tab](https://github.com/ovds/ovds/actions)
2. Select "OWASP ZAP Security Scan" workflow
3. Click "Run workflow"
4. Select:
   - **Target URL:** The URL to scan (e.g., `http://localhost:3000`)
   - **Scan Type:** `baseline` (passive) or `full` (active with payloads)
   - **Fail Threshold:** `low`, `medium`, `high`, or `critical`

### Latest Scan Results

Check the [Actions tab](https://github.com/ovds/ovds/actions) for the latest scan results and artifacts.

For security issues, please email security@ovds.com.et or use the [security policy](https://github.com/ovds/ovds/security/policy).

## Test Accounts

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| scanner.user@ovds.local | ZapScan#2024!Strong | EMPLOYEE | Normal user testing |
| scanner.admin@ovds.local | ZapRoot#2024!Secure | ADMIN | Administrative testing |
| scanner.supervisor@ovds.local | ZapSuper#2024!View | SUPERVISOR | Supervisor testing |
| scanner.disabled@ovds.local | ZapDisabled#2024!Test | EMPLOYEE | Disabled account testing |

## ZAP Configuration

The ZAP configuration is stored in `.zap/`:
- `contexts/ovds.context` - Application context with auth config
- `policies/ovds-scan.policy` - Custom scan policy with 50+ rules
- `users/test-users.json` - Test user credentials
- `automation/` - Automation framework configs

## Security Gates

| Gate | Requirement | Blocking |
|------|-------------|----------|
| 1 | Written authorization, approved environment, backup completed | Yes |
| 2 | Main workflows explored, all roles tested, API definitions imported | Yes |
| 3 | No unresolved Critical/High findings, Medium corrected or accepted | Yes |
| 4 | Critical/High fixes retested, regression testing completed | Yes |

## Finding Severity Guidelines

### Critical
- Authentication bypass
- Remote code execution
- SQL injection with data access
- Cross-tenant data access
- Financial transaction manipulation

### High
- Privilege escalation
- Authorization bypass on sensitive functions
- Insecure direct object references (IDOR)
- Missing input validation on critical endpoints
- CSRF on state-changing operations

### Medium
- Missing security headers
- Weak session configuration
- Information disclosure
- Missing rate limiting
- Client-side validation only

### Low
- Cookie without SameSite
- Missing X-Content-Type-Options
- Server version disclosure
- Verbose error messages

## Reporting

### Finding Format
Each confirmed finding should contain:
- **Title:** Clear description of the vulnerability
- **Severity:** Critical/High/Medium/Low/Informational
- **Affected Component:** URL, API endpoint, module, parameter
- **Description:** What security control is missing or ineffective
- **Reproduction Steps:** Minimum steps to reproduce
- **Evidence:** Sanitized request/response, screenshots
- **Impact:** What an attacker could achieve
- **Recommendation:** Practical correction
- **Owner and Target Date:** Responsible team and remediation date
- **Retest Status:** Not retested/Fixed/Partially fixed/Not fixed/Risk accepted/False positive

## Makefile Commands

```bash
# Show all available commands
make help

# Check application readiness
make security-check

# Validate ZAP configuration
make security-zap-validate

# Seed test users
make security-zap-seed

# Run scans
make security-zap-baseline
make security-zap-full
make security-zap-auth
make security-zap-api
make security-zap-all

# Generate reports
make security-report

# Start/stop security stack
make security-zap-start
make security-zap-stop

# View ZAP logs
make security-zap-logs
```

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

## References

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST SP 800-53](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [ZAP Automation Framework](https://www.zaproxy.org/docs/automate/automation-framework/)
