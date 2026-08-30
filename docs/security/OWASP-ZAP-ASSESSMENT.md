# OWASP ZAP Security Assessment — OVDS

This document maps the **Internal Web Application Security Assessment Guide** to OVDS controls and provides repeatable ZAP testing steps.

## OVDS Security Controls Summary

| Control | Implementation |
|---------|----------------|
| Security headers (CSP, HSTS, X-Frame-Options, nosniff) | Helmet + `SecurityHeadersInterceptor` |
| Authentication | JWT + Auth0 + MFA (OTP) |
| Authorization | Global `RBACGuard` + `CompanyGuard` |
| Rate limiting | IP (`ThrottlerGuard`) + per-user (`UserRateLimitGuard`) |
| Input validation | `ValidationPipe` + `SanitizeInputMiddleware` |
| Financial request signing | `@SignedRequest()` + HMAC (`REQUEST_SIGNING_SECRET`) |
| Session timeout | `SessionTimeoutInterceptor` (X-Session-* headers) |
| Audit logging | `SecurityAuditService` + `AuditLogService` |
| Error disclosure | `AllExceptionsFilter` — generic 5xx in production |

## API Endpoints for Compliance Review

```
GET /api/security/checklist   — OWASP ZAP / ASVS control mapping
GET /api/security/readiness   — Readiness score by assessment phase
GET /api/security/health      — Security health snapshot
```

## Phase 1 — Passive Scanning (Safe for Staging)

1. Install [OWASP ZAP Desktop](https://www.zaproxy.org/download/) or use Docker:
   ```bash
   docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
     -t https://staging.your-domain.com \
     -r zap-baseline-report.html
   ```
2. Launch browser through ZAP (**Quick Start → Manual Explore**).
3. Log in with each test role (user, supervisor, admin).
4. Exercise main workflows: invoices, banking, payroll, settings.
5. Review passive alerts — OVDS should pass:
   - Content-Security-Policy
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Strict-Transport-Security (production HTTPS only)
   - No stack traces in error responses

## Phase 3 — Authenticated Scanning

Configure ZAP context with JSON authentication:

- **Login URL:** `POST /api/auth/login`
- **Body:** `{ "username": "<test-user>", "password": "<test-password>" }`
- **Logged-in indicator:** HTTP 200 + `Authorization: Bearer` token in response
- **Header:** `Authorization: Bearer {{token}}`
- **Company header:** `x-company-id: {{companyId}}`

Create separate ZAP users for: normal user, supervisor, admin, auditor.

## Phase 5 — API Scanning

Import OpenAPI spec from `/api/docs` (non-production) and scan:

```bash
docker run -v $(pwd):/zap/wrk -t ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py -t https://staging.your-domain.com/api/docs-json \
  -f openapi -r zap-api-report.html
```

Verify manually:
- Every endpoint requires authentication (except `@Public()` routes)
- RBAC denies cross-role access
- `x-company-id` prevents IDOR across tenants
- Banking transfer endpoints require HMAC headers when `REQUEST_SIGNING_SECRET` is set

## Environment Variables

```env
# Request signing (banking transfers) — same value on backend + frontend build
REQUEST_SIGNING_SECRET=<64-char-hex>
VITE_REQUEST_SIGNING_SECRET=<same-as-above>

# Per-user rate limiting (default: enabled)
USER_RATE_LIMIT_ENABLED=true

# Geo IP blocking (default: disabled)
IP_BLOCKING_ENABLED=false
```

## Pre-Scan Checklist (from Assessment Guide §11.2)

- [ ] Database backup/snapshot completed
- [ ] Synthetic test data loaded (no real PII)
- [ ] Email/SMS notifications disabled or redirected
- [ ] Payment integrations in sandbox mode
- [ ] Test accounts created per role
- [ ] Dangerous URLs excluded from active scan (bulk delete, payment submit)
- [ ] Application owner notified

## Dangerous Functions to Test Manually

Do **not** include in unrestricted active scans:

- Bulk invoice delete / EIMS bulk cancel
- Fund transfer approve/reject (use signed test transfers only)
- User password reset for real accounts
- Payroll batch processing

## Retesting

After fixing findings:

1. Re-run passive scan and confirm alert count decreased.
2. Re-test affected workflow manually.
3. Update evidence in `GET /api/security/checklist` if new controls were added.
