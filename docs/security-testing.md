# Security Testing for OVDS

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

## Documentation

- [Security Testing Guide](security-testing-guide.md) - OVDS-specific security testing instructions
- [Security Status](security-status.md) - Security scan status and badges
- [ZAP Setup](scripts/zap-setup.md) - ZAP configuration and setup
- [Remediation Register](scripts/remediation-register.md) - Finding tracking template
- [Security Testing Checklist](scripts/security-testing-checklist.md) - Manual testing checklist

## Scripts

### Scan Scripts
| Script | Purpose | Usage |
|--------|---------|-------|
| `zap-baseline.ps1` | Passive scan | `.\scripts\zap-baseline.ps1 -TargetUrl "http://localhost:3000"` |
| `zap-full-scan.ps1` | Active scan | `.\scripts\zap-full-scan.ps1 -TargetUrl "http://staging.example.com"` |
| `zap-authenticated-scan.ps1` | Authenticated scan | `.\scripts\zap-authenticated-scan.ps1 -TargetFrontend "http://localhost:3000" -TargetBackend "http://localhost:3001"` |
| `zap-api-scan.ps1` | API scan | `.\scripts\zap-api-scan.ps1 -ApiDefinition "http://localhost:3001/api/openapi.json"` |

### Utility Scripts
| Script | Purpose | Usage |
|--------|---------|-------|
| `validate-zap-config.mjs` | Validate ZAP config | `node scripts/validate-zap-config.mjs` |
| `seed-zap-test-users.mjs` | Create test users via API | `node scripts/seed-zap-test-users.mjs --api-url http://localhost:3001/api --admin-token <jwt>` |
| `seed-zap-test-users-db.mjs` | Create test users in DB | `npm run seed:zap-users` |
| `seed-zap-test-data.mjs` | Create synthetic test data | `node scripts/seed-zap-test-data.mjs --api-url http://localhost:3001/api --token <jwt>` |
| `zap-import-results.mjs` | Import ZAP results | `node scripts/zap-import-results.mjs --report zap-report.json --assessment-id <id>` |
| `check-app-readiness.sh` | Check app readiness (Linux/macOS) | `bash scripts/check-app-readiness.sh` |
| `check-app-readiness.ps1` | Check app readiness (Windows) | `.\scripts\check-app-readiness.ps1` |
| `security-test-runner.sh` | Full workflow (bash) | `bash scripts/security-test-runner.sh all` |
| `security-test-runner.ps1` | Full workflow (PowerShell) | `.\scripts\security-test-runner.ps1 -ScanType all` |
| `generate-security-report.sh` | Generate report (bash) | `bash scripts/generate-security-report.sh --format html` |
| `generate-security-report.ps1` | Generate report (PowerShell) | `.\scripts\generate-security-report.ps1 -Format html` |

## CI/CD

The GitHub Actions workflow `.github/workflows/zap-security-scan.yml` implements four security gates:

1. **Gate 1 - Setup & Authorization:** Validates configuration and confirms test environment
2. **Gate 2 - Build & Deploy:** Builds and deploys the application
3. **Gate 3 - ZAP Scan:** Runs baseline or full scan and evaluates results
4. **Gate 4 - Retest & Sign-off:** Confirms all gates passed

### Triggers
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Weekly schedule (Monday 2 AM UTC)
- Manual workflow dispatch

## Security Status

![Security Scan](https://github.com/ovds/ovds/actions/workflows/zap-security-scan.yml/badge.svg)

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
- `policies/ovds-scan.policy` - Custom scan policy
- `users/test-users.json` - Test user credentials
- `automation/` - Automation framework configs

## Docker Compose

Start the security testing stack:
```bash
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d
```

Access points:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- ZAP: http://localhost:8080 (API key: `ovds-zap-secret`)

## NPM Scripts

```bash
# Validate ZAP configuration
npm run security:zap:validate

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
```

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

## Security Gates

| Gate | Requirement | Blocking |
|------|-------------|----------|
| 1 | Written authorization, approved environment, backup completed | Yes |
| 2 | Main workflows explored, all roles tested, API definitions imported | Yes |
| 3 | No unresolved Critical/High findings, Medium corrected or accepted | Yes |
| 4 | Critical/High fixes retested, regression testing completed | Yes |

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
