<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Security Guide for Administrators

> **Part of:** [Advanced Modules](./README.md)
>
> **Requires:** ADMIN or SPURADMIN role
>
> **Also see:** [SECURITY.md](./SECURITY.md) — full technical hardening reference for developers

This guide covers the security controls available to OVDS administrators — what is enforced automatically by the system and what you should configure before going to production.

---

## Defence Layers Overview

Every request passes through the following guard chain before reaching any controller:

```
ThrottlerGuard → AnyAuthGuard → CompanyGuard → MandatoryReleaseGuard → RBACGuard
```

Most of these are automatic. Your responsibilities as an admin are the configuration items below.

---

## Authentication Controls

### Password Policy
- Minimum: 8 characters
- Users are required to change all default seed passwords immediately on first login in production

### Account Lockout
- **5 failed login attempts** → account locked for **15 minutes**
- Every login attempt (success and failure) is logged in the Audit Trail with IP address
- Lockout is per-account — prevents targeted account takeover

### JWT Session Security
- Sessions expire after 24 hours by default (configurable via `JWT_EXPIRES_IN`)
- A banner appears when a session has less than 5 minutes remaining
- Logout clears all session data immediately

### Auth0 / SSO (Optional)
- Enable for Google, Microsoft, or SAML single sign-on via **Settings → Auth0**
- When enabled, MFA is enforced on sensitive routes (payroll, VAT filing, user management)
- See [RBAC Matrix → Auth0 Setup](../02-users-roles/rbac-matrix.md#auth0--sso-setup) for configuration

### Two-Factor Authentication (2FA)
- Install the **2FA Authenticator** extension from the App Store
- Enforces TOTP-based 2FA for all users
- Recommended for ovds, ADMIN, and SPURADMIN roles

---

## Access Control

### Role-Based Access (RBAC)
OVDS uses a deny-by-default RBAC system — no route is accessible without an explicit policy entry. A missing policy returns `403 Forbidden`, not `404`.

Review the full role and permission matrix: [Users & Roles → RBAC Matrix](../02-users-roles/rbac-matrix.md).

**Admin responsibilities:**
- Assign the minimum role needed for each user's job function
- Remove or deactivate users immediately when they leave the organization
- Review the Role Permissions page (`/role-permissions`) quarterly

### Multi-Tenancy Isolation
- The `CompanyGuard` ensures every database query is scoped to the user's company
- A user authenticated for Company A cannot access Company B's data — the isolation is enforced at every query, not just at the UI layer
- Multi-company access is only possible via explicit assignment in **Administration → Users**

### Sensitive Route MFA Step-Up

When Auth0 is enabled, these routes require MFA re-authentication before access is granted:

| Route | Reason |
|-------|--------|
| `/users` | User provisioning |
| `/role-permissions` | RBAC changes |
| `/settings` | Company configuration |
| `/audit-logs` | Compliance evidence |
| `/payroll-administration` | Payroll configuration |
| `/vat-administration` | VAT filing |
| `/tax-filing` | Tax submission |
| `/admin/notifications-settings` | SMTP/Slack credentials |
| `/multi-company-admin` | Multi-tenant administration |

---

## Secrets & Credentials

### Critical Secrets to Rotate Before Production

| Secret | Action Required |
|--------|----------------|
| `JWT_SECRET` | Replace the development default with ≥ 48 random bytes |
| Database password | Change from the default `root` to a strong password |
| Telebirr API Key | Rotate if the dev/sandbox key was used during testing |
| Chapa Secret Key | Rotate if sandbox key was exposed |

**Generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### API Keys
- Grant API keys the **minimum scopes** needed for the integration
- Set expiry dates — avoid "Never" for production integrations
- Rotate compromised keys immediately: delete and create a new key
- Keys are shown **once** at creation — copy and store securely

### SMTP Credentials
- Use a dedicated sending account for OVDS — not a personal email
- Prefer App Passwords or OAuth2 over plain SMTP passwords
- Test the connection in **Admin → Notification Settings** before going live

---

## Audit Trail

Navigate to **Administration → Audit Logs** (`/audit-logs`) — requires `audit_logs:read`.

Every action in OVDS is logged automatically and cannot be retroactively edited.

### What to Review Regularly

| Review Cadence | What to Look For |
|----------------|-----------------|
| Daily | Failed login attempts from unusual IP addresses |
| Weekly | Role changes — ensure no unexpected privilege escalations |
| Monthly | Data exports — verify all exports were authorized |
| Monthly | 403 (permission denied) events — investigate patterns |
| Quarterly | Login events for inactive accounts — deactivate if still open |

### Security-Specific View
Navigate to `/audit-logs?type=security` to filter only authentication and permission events.

### Export for Compliance
Navigate to `/audit-logs?action=export` — export to CSV for external audit evidence, ERCA audit preparation, or SIEM ingestion.

---

## Rate Limiting

All API endpoints are rate-limited automatically:

| Endpoint Type | Limit |
|--------------|-------|
| All routes (global) | 100 requests/minute per IP |
| Login | 10 requests/minute |
| Password reset | 5 requests/minute |
| Sign-up | 5 requests/minute |

If a user or system hits the limit, they receive `429 Too Many Requests` with a `Retry-After` header. This protects against brute-force and credential stuffing attacks.

---

## Production Hardening Checklist

Complete this checklist before going live with any real financial data.

### Secrets & Configuration
- [ ] `JWT_SECRET` replaced with ≥ 48 random bytes (never reuse the dev default)
- [ ] Database password changed from `root` to a strong, unique password
- [ ] `NODE_ENV=production` set in environment
- [ ] `CORS_ORIGIN` set to your exact production frontend domain — never `*`
- [ ] All default seed user passwords changed immediately after seeding

### Access Control
- [ ] All team members have the minimum role needed for their job
- [ ] No shared logins — every user has their own account
- [ ] SPURADMIN account secured with a strong, unique password and MFA
- [ ] Auth0 enforced in production (`AUTH0_ENFORCED=true`) or JWT-only security confirmed

### Infrastructure
- [ ] HTTPS enforced — HTTP redirects to HTTPS via HSTS header
- [ ] TLS certificate valid and auto-renewing (Let's Encrypt or Plesk SSL)
- [ ] Database not exposed on a public port
- [ ] Nginx reverse proxy configured (not exposing NestJS port 3000 directly)
- [ ] MySQL binary logging enabled for point-in-time recovery
- [ ] Daily automated database backups tested (restore verified)
- [ ] Health check monitoring on `GET /api/health/ready`

### Monitoring
- [ ] Audit logs reviewed on a regular schedule
- [ ] Slack or email alerts configured for critical events (IoT device offline, tax deadline)
- [ ] `npm audit` passing with no critical vulnerabilities

---

## Reporting a Security Issue

If you discover a security vulnerability in OVDS:

1. Do **not** create a public GitHub issue.
2. Email the security team at security@ovds.com.et with:
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. You will receive a response within 48 hours.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| System Administration Setup checklist | [Settings → System Administration Setup](../03-settings/system-administration-setup.md) |
| Full technical security reference (developer) | [SECURITY.md](./SECURITY.md) |
| User roles and permissions | [Users & Roles → RBAC Matrix](../02-users-roles/rbac-matrix.md) |
| Auth0 SSO configuration | [Users & Roles → RBAC Matrix → Auth0](../02-users-roles/rbac-matrix.md#auth0--sso-setup) |
| API key management | [Settings → Notifications & API](../03-settings/notifications-and-api.md#api-keys) |
| Audit log fields reference | [Users & Roles → RBAC Matrix → Audit Logs](../02-users-roles/rbac-matrix.md#audit-logs) |
| Period lock after tax filing | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) |




