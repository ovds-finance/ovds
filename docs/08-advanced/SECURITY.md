<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Security Hardening for OVDS

This document covers the security architecture, threat mitigations, and production hardening checklist for the OVDS platform.

---

## Core Defense Layers

```
[Secure Code] → [Input Validation] → [Auth & RBAC] → [Rate Limiting] → [Transport Security] → [Audit Logging]
```

Every request passes through the global guard chain before reaching any controller:

```
ThrottlerGuard → AnyAuthGuard → CompanyGuard → MandatoryReleaseGuard → RBACGuard
```

---

## 1. HTTP Security Headers (Helmet)

`helmet` is applied globally in `app.module.ts`:

| Header | Value | Protects Against |
|--------|-------|-----------------|
| Content-Security-Policy | Strict allow-list + `upgradeInsecureRequests` | XSS, data injection |
| Strict-Transport-Security | max-age=31536000; includeSubDomains | SSL stripping (HSTS) |
| X-Frame-Options | DENY | Clickjacking |
| X-Content-Type-Options | nosniff | MIME sniffing |
| Referrer-Policy | same-origin | Referrer leakage |
| X-DNS-Prefetch-Control | off | DNS prefetch leakage |
| X-IE-Open | noopen | IE content execution |

---

## 2. Rate Limiting (Throttler)

| Scope | Limit | Override |
|-------|-------|---------|
| Global (all routes) | 100 req/min per IP | `@Throttle()` decorator on specific routes |
| Login | 10 req/min | Brute-force protection |
| Signup | 5 req/min | Account creation spam |
| Password reset | 5 req/min | Enumeration protection |
| MFA endpoints | 10 req/min | OTP brute-force |
| API key operations | 5 req/min | Key enumeration |
| Docs API | 30–60 req/min | Content scraping |

Rate limit responses return `429 Too Many Requests` with a `Retry-After` header.

---

## 3. Authentication & Session Security

### JWT Configuration
- Algorithm: HS256 (local) / RS256 (Auth0)
- Secret: Minimum 48 random bytes — `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Expiry: Configurable via `JWT_EXPIRES_IN` env var (default: 24 h)
- Storage: `localStorage` on the client — `ovds_token` and `ovds_user` keys

### Session Lifecycle
- Token validated on every request via `AnyAuthGuard` → `GET /api/auth/me`
- Stale/invalid tokens are cleared immediately
- Cross-tab sync via native `storage` event listener
- `sessionExpiring` flag fires when < 5 minutes remain — triggers `SessionExpiryBanner`
- Logout clears `localStorage`, revokes the server session, and redirects to `/login`

### Auth0 SSO (Optional)
- Enabled via `AUTH0_ENFORCED=true` — disabled by default for self-hosted deployments
- Token exchange: Auth0 JWT → local JWT via `POST /api/auth/auth0/session`
- MFA step-up required for sensitive routes (see §6)

### Account Lockout
- **5 failed login attempts** → account locked for **15 minutes**
- Every login attempt is stamped with client IP in the audit log
- Lockout is per-account, not per-IP (prevents distributed brute-force locking out legitimate users)

### Timing Attack Protection
- Login service uses `bcrypt.compare()` even for non-existent users to prevent username enumeration via response time differences

---

## 4. Input Validation & Injection Prevention

### NestJS ValidationPipe (Global)
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,             // Strip unknown fields
  forbidNonWhitelisted: true,  // Reject requests with unexpected fields
  forbidUnknownValues: true,   // Reject unknown class-validator decorators
  transform: true,             // Auto-transform types (string → number, etc.)
}));
```

### SQL Injection Prevention
- All database queries use **Prisma ORM** with parameterized queries — no raw SQL string interpolation in business logic
- Raw SQL (where used for performance) always uses `prisma.$queryRaw` with tagged template literals: `prisma.$queryRaw\`SELECT * FROM users WHERE id = ${id}\``
- Inputs are validated by class-validator DTOs before reaching the service layer

### XSS Prevention
- React renders all user-supplied content as text by default (`textContent`) — no `dangerouslySetInnerHTML` in financial data components
- CSP header blocks inline scripts and untrusted script sources
- Markdown content (docs portal) is sanitized before rendering — HTML tags stripped

### NoSQL / Prototype Pollution
- `forbidNonWhitelisted: true` in ValidationPipe prevents prototype-polluting key injection (`__proto__`, `constructor`, `prototype`)
- Prisma's type system prevents direct query object injection

### Path Traversal
- File uploads routed through `AttachmentService` — filenames are sanitized and stored with UUID-based names, not the original filename
- Serve-static is scoped to `./public` — cannot traverse above the document root

### CSRF
- API endpoints require the `Authorization: Bearer <token>` header — browser-based CSRF attacks cannot set custom headers
- Cookie-based auth is not used — `credentials: 'omit'` on all docs portal fetches
- `SameSite=Strict` on any cookies set by the application

---

## 5. Multi-Tenancy & Data Isolation

### CompanyGuard
Applied globally to every authenticated route. Ensures all Prisma queries are scoped to the `companyId` from the JWT:

```typescript
// Every service method must scope to companyId
prisma.invoice.findMany({ where: { companyId: req.companyId } })
```

A user authenticated for Company A can never access Company B's data — the guard injects `companyId` into the request object and the service layer is required to use it.

### RBAC — Deny by Default
- No route is accessible without an explicit `ROUTE_POLICY` entry
- Missing policy → `403 Forbidden` (not `404`) — prevents route enumeration
- All RBAC decisions are logged in the audit trail

---

## 6. MFA Step-Up (Auth0 Users)

Sensitive routes require re-authentication before access:

| Route | Why |
|-------|-----|
| `/users` | User provisioning |
| `/role-permissions` | RBAC changes |
| `/settings` | Company configuration |
| `/audit-logs` | Compliance evidence |
| `/payroll-administration` | Payroll configuration |
| `/vat-administration` | VAT filing |
| `/tax-filing` | Tax submission |
| `/admin/notifications-settings` | SMTP/Slack credentials |
| `/multi-company-admin` | Multi-tenant admin |

The `requiresMfa(path)` function in `rbac.ts` checks the `SENSITIVE_ROUTES` set. The frontend `<StepUpProvider>` intercepts navigation to these routes and re-challenges the user.

---

## 7. Secrets Management

### Environment Variables
All secrets are stored in `.env` and never committed to source control (`.env` is in `.gitignore`).

| Secret | Minimum Requirement | Notes |
|--------|-------------------|-------|
| `JWT_SECRET` | 48 random bytes | Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `MYSQL_ROOT_PASSWORD` | 20+ characters, mixed case + special | Never use default `root` password |
| `DOCS_CACHE_FLUSH_TOKEN` | 32 random bytes | CI/CD use only |
| `CHAPA_SECRET_KEY` | As issued by Chapa | Stored encrypted in env, never logged |
| `TELEBIRR_APP_KEY` | As issued by Ethio Telecom | Stored encrypted in env, never logged |

### Secrets in Logs
- `RequestLoggerMiddleware` strips `Authorization`, `password`, `token`, `secret`, `key` headers and body fields from all log output
- Never log raw JWT payloads — log only `userId` and `companyId` extracted from the decoded token

### Rotating Secrets
1. Generate a new `JWT_SECRET` value
2. Update `.env` in production
3. Restart the NestJS process — all active sessions will be invalidated (users must re-login)
4. Update `JWT_SECRET` in CI/CD secrets (GitHub Actions)

---

## 8. Frontend Protections

### Anti-Copy & Anti-Mirroring
- Right-click context menu disabled in production
- Text selection disabled via CSS and JS for financial data fields
- F12, Ctrl+Shift+I (DevTools), Ctrl+U (Source), Ctrl+S (Save) disabled

### Anti-Screenshot
- Application content blurs automatically on `visibilitychange` (window loses focus)
- `@media print` CSS hides the body — prevents Print-to-PDF capture

### Crawler Protection
- `robots.txt` disallows all crawlers from indexing the application

### Content Security Policy
The CSP header is set server-side via Helmet and enforced by the browser:
- `script-src 'self'` — no inline scripts, no CDN scripts without hash
- `style-src 'self' 'unsafe-inline'` — required for Tailwind CSS utility classes
- `img-src 'self' data: blob:` — allows base64 logos and blob URLs for PDF preview
- `connect-src 'self'` — API calls only to same origin
- `frame-ancestors 'none'` — equivalent to X-Frame-Options: DENY

---

## 9. Infrastructure Security

### CORS
- `CORS_ORIGIN` env var specifies allowed origin(s)
- Production: set to your exact frontend domain (e.g., `https://app.ovds.com.et`)
- Never use `*` in production — this allows any origin to call the API

### Transport Security
- TLS 1.3 required in production
- HSTS header enforces HTTPS for 1 year including subdomains
- Certificate management: Let's Encrypt via Certbot or Plesk SSL

### Graceful Shutdown
- `SIGTERM`/`SIGINT` handlers close the HTTP server and Prisma connections cleanly
- Prevents in-flight transactions from being left in an inconsistent state during deployments

### Database Security
- Database is not exposed on a public port — only accessible from the application server
- Production: use a dedicated database user with `SELECT`, `INSERT`, `UPDATE`, `DELETE` only — no `DROP`, `CREATE`, `GRANT`
- Enable MySQL binary logging for point-in-time recovery
- Rotate database password on a schedule and update `PRISMA_DATABASE_URL`

---

## 10. Audit Logging

Every security-sensitive action is logged to the `AuditLog` table and cannot be retroactively edited:

| Event | Logged Fields |
|-------|--------------|
| Login success | `userId`, `ipAddress`, `userAgent`, timestamp |
| Login failure | `email`, `ipAddress`, reason (wrong password / locked) |
| Account lockout | `userId`, lockout expiry time |
| JWT issued | `userId`, `companyId`, expiry |
| Permission denied (403) | `userId`, route, required permission |
| Data export | `userId`, export type, record count |
| Role changed | `userId`, old role, new role, changedBy |
| Settings changed | `userId`, key changed, old/new value (secrets redacted) |
| Period locked | `userId`, period, timestamp |
| VAT filed | `userId`, period, amount |

View audit logs at **Administration → Audit Logs** (`/audit-logs`) — requires `audit_logs:read`.

---

## 11. Dependency Scanning

```bash
# Check for vulnerable npm packages
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# Check for high/critical only
npm audit --audit-level=high

# Generate a full audit report
npm audit --json > security-audit.json
```

Run `npm audit` in CI before every production deployment. Block deploys with `--audit-level=critical` in the CI pipeline.

---

## 12. Verification & Validation Checklist

### Verification (Build-Time)
- [ ] `npm audit` passes with no critical vulnerabilities
- [ ] TypeScript strict mode enabled (`strict: true` in tsconfig)
- [ ] ESLint security plugin rules pass (`eslint-plugin-security`)
- [ ] `ValidationPipe` with `forbidNonWhitelisted: true` confirmed in `app.module.ts`
- [ ] No `dangerouslySetInnerHTML` in financial data components
- [ ] No raw SQL string interpolation — all queries parameterized via Prisma
- [ ] JWT_SECRET is ≥ 48 bytes (enforced at startup if `JWT_SECRET_MIN_LENGTH` env is set)
- [ ] Auth0 enforced in production (`AUTH0_ENFORCED=true`)

### Validation (Runtime)
- [ ] Rate limiting tested under load (100 req/min → 429 after threshold)
- [ ] Account lockout triggers after 5 failed logins
- [ ] CORS rejects requests from non-allowed origins
- [ ] CompanyGuard prevents cross-tenant data access (test with two company JWTs)
- [ ] MFA step-up fires on all `SENSITIVE_ROUTES`
- [ ] Audit log captures login, logout, 403s, and all write operations
- [ ] HTTPS enforced — HTTP redirects to HTTPS via HSTS
- [ ] Penetration test quarterly — document findings and remediation

### Production Hardening
- [ ] `NODE_ENV=production` set
- [ ] `MAINTENANCE_MODE=false`
- [ ] `CORS_ORIGIN` set to exact production domain
- [ ] `JWT_SECRET` rotated from dev default
- [ ] `MYSQL_ROOT_PASSWORD` changed from default
- [ ] Database not exposed on public port
- [ ] `robots.txt` disallows all crawlers
- [ ] TLS certificate valid and auto-renewing
- [ ] `SIEM_WEBHOOK_URL` configured for audit event forwarding (optional)
- [ ] Backups tested — restore from backup verified at least once



