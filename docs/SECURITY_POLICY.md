# OVDS Security Policy

## 1. Purpose and Scope

This document defines the security policies, controls, and procedures for the OVDS (Online VAT Declaration System). It applies to all developers, QA engineers, DevOps engineers, and application owners involved in the development, deployment, and maintenance of the OVDS platform.

**Scope:** All OVDS application components including backend services, frontend applications, databases, APIs, integrations, and infrastructure.

**Classification:** Internal Use

## 2. Security Governance

### 2.1 Roles and Responsibilities

| Role | Responsibilities |
|------|-----------------|
| Application Owner | Approves scope, confirms test environments, accepts residual risks |
| Lead Developer | Explains architecture, identifies auth/authz mechanisms, coordinates remediation |
| Security Tester | Configures ZAP, conducts testing, validates findings, records evidence |
| DevOps Engineer | Provides test environments, monitors system health, supports backups |
| QA Engineer | Provides workflows and test cases, confirms functional coverage |

### 2.2 Authorization Requirements

All security testing must have:
- Written authorization from the application owner
- Approved test environment
- Confirmed scope (URLs, domains, dates)
- Identified authorized testers
- Defined prohibited activities
- Emergency contact information

## 3. Authentication Security Policy

### 3.1 Password Requirements

| Requirement | Policy |
|-------------|--------|
| Minimum Length | 8 characters |
| Uppercase | Required (registration and change) |
| Lowercase | Required (registration and change) |
| Numbers | Required (registration and change) |
| Special Characters | Required (registration and change) |
| Common Password Check | Enforced |
| Password Hashing | bcrypt |

### 3.2 Session Management

| Control | Policy |
|---------|--------|
| JWT Secret Rotation | Sessions invalidated on new login |
| Token Expiration | Access: 15 minutes, Refresh: 7 days |
| Session Tracking | `sessionsCount` in JWT payload |
| Concurrent Sessions | Limited to 5 active sessions |
| Session Revocation | Via Redis blocklist (jti-based) |
| CSRF Protection | Required for state-changing browser requests |

### 3.3 Multi-Factor Authentication

| Control | Policy |
|---------|--------|
| MFA Support | TOTP (Google Authenticator compatible) |
| MFA Enforcement | Configurable per user |
| Backup Codes | Supported |
| Recovery | Email-based recovery with rate limiting |

## 4. Authorization Security Policy

### 4.1 Tenant Isolation

| Control | Policy |
|---------|--------|
| Data Isolation | All queries filtered by `companyId` |
| IDOR Prevention | Server-side ownership verification on all mutations |
| Cross-Tenant Access | Denied at database and service layers |
| Body `companyId` | Stripped; server uses authenticated user's company |

### 4.2 Role-Based Access Control

| Role | Access Level |
|------|-------------|
| SUPERADMIN | Full system access |
| SPURADMIN | Super admin delegation |
| ADMIN | Company administration |
| ACCOUNTING | Financial operations |
| AUDITOR | Read-only audit access |
| IFRS_OFFICER | IFRS 16 reporting |
| BANK_LIAISON | Banking operations |
| HR | Payroll and employee data |
| EMPLOYEE | Limited self-service |
| ovds | VAT operations |
| CLIENT | Customer portal |
| CRM | Customer management |
| PARTNER | Partner portal |
| DATA_CLERK | Data entry |

### 4.3 Authorization Testing Requirements

- All sensitive functions must verify server-side authorization
- Hidden menus are NOT authorization controls
- Direct API access must be tested with lower-privileged users
- Cross-tenant access must be tested with users from different companies

## 5. Input Validation Security Policy

### 5.1 Validation Controls

| Input Type | Validation |
|------------|------------|
| Text Fields | Length limits, character restrictions |
| Numeric Fields | Range validation, type checking |
| Dates | Format validation, range validation |
| Email | RFC-compliant format validation |
| Search/Filter | Parameterized queries, length limits |
| Record IDs | UUID validation, ownership verification |
| JSON Properties | Schema validation |
| HTTP Headers | Size limits, character restrictions |
| File Names | Sanitization, path traversal prevention |
| Redirect URLs | Allowlist validation |

### 5.2 Injection Prevention

| Attack Type | Prevention |
|-------------|------------|
| SQL Injection | Parameterized queries via Prisma ORM |
| NoSQL Injection | Input validation, type checking |
| XSS | Output encoding, CSP headers |
| Command Injection | Input sanitization, no shell execution |
| Path Traversal | Path canonicalization, allowlist |
| SSRF | URL validation, IP blocking |
| Open Redirect | Allowlist validation |

## 6. Business Logic Security Policy

### 6.1 Financial Transaction Controls

| Control | Policy |
|---------|--------|
| Price Manipulation | Server-side recalculation required |
| Negative Quantities | Rejected at validation layer |
| Zero-Price Items | Require explicit authorization |
| VAT Calculation | Server-enforced, not client-submitted |
| Duplicate Prevention | Unique constraints enforced |

### 6.2 Workflow Controls

| Control | Policy |
|---------|--------|
| Step Validation | Mandatory workflow steps enforced server-side |
| Approval Limits | Role-based approval limits enforced |
| Maker-Checker | Separation enforced for critical operations |
| Status Checks | Cancelled/completed records cannot be modified |

## 7. API Security Policy

### 7.1 API Requirements

| Control | Policy |
|---------|--------|
| Authentication | All endpoints require valid JWT |
| Authorization | Every request checked against user roles |
| IDOR Prevention | Object ownership verified on all endpoints |
| Input Validation | Server-side validation on all inputs |
| Error Handling | No stack traces or internal details in responses |
| Rate Limiting | Applied to sensitive endpoints |
| Pagination | Limits enforced on all list endpoints |
| Content Types | Restricted to allowed types |

### 7.2 API Security Testing

- All endpoints tested with invalid tokens
- All endpoints tested with expired tokens
- All endpoints tested with lower-privileged users
- All endpoints tested with cross-tenant users

## 8. File Upload Security Policy

### 8.1 Upload Controls

| Control | Policy |
|---------|--------|
| Allowed Types | Strict allowlist (images, PDF, Office) |
| Magic Bytes | Content-type validation required |
| Max File Size | 10MB default limit |
| File Names | Regenerated, no user input |
| Storage Location | Non-executable directory |
| Double Extensions | Blocked (e.g., .pdf.exe) |
| Dangerous Extensions | Blocked (.php, .exe, .sh, .js, etc.) |
| Access Control | Authenticated access only |
| Malware Scanning | Recommended for production |

## 9. Error Handling Security Policy

### 9.1 Information Disclosure Prevention

| Information Type | Policy |
|------------------|--------|
| Stack Traces | Never returned to client |
| SQL Errors | Never returned to client |
| Framework Errors | Never returned to client |
| Source Code | Never returned to client |
| Internal Paths | Never returned to client |
| Server Configuration | Never returned to client |
| Internal IP Addresses | Never returned to client |
| Database Names | Never returned to client |
| API Keys | Never returned to client |

### 9.2 Logging Requirements

| Log Type | Requirements |
|----------|--------------|
| Authentication Events | Login, logout, failed attempts, MFA events |
| Authorization Events | Access denials, role changes |
| Data Changes | Create, update, delete with before/after |
| Security Events | Rate limits, suspicious patterns |
| API Calls | Request/response metadata (no PII) |

## 10. Security Headers Policy

### 10.1 Required Headers

| Header | Required Value |
|--------|----------------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Content-Security-Policy | Strict policy with nonce/nonce |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | Restrict camera, microphone, geolocation |
| Strict-Transport-Security | max-age=31536000; includeSubDomains |
| Cross-Origin-Embedder-Policy | require-corp |
| Cross-Origin-Opener-Policy | same-origin |
| Cross-Origin-Resource-Policy | same-origin |

## 11. CORS Security Policy

| Control | Policy |
|---------|--------|
| Allowed Origins | Explicit allowlist only |
| Credentials | Only for specified origins |
| Max Age | 86400 seconds (24 hours) |
| Methods | GET, POST, PUT, DELETE only |
| Headers | Explicit allowlist |

## 12. Rate Limiting Policy

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Login | 5 attempts | 15 minutes |
| Password Reset | 3 requests | 1 hour |
| MFA Verification | 10 attempts | 5 minutes |
| Account Creation | 5 accounts | 1 hour |
| API Calls (general) | 100 requests | 1 minute |
| File Upload | 10 uploads | 1 hour |
| Search | 30 requests | 1 minute |

## 13. Testing Requirements

### 13.1 Automated Testing

| Test Type | Frequency | Tool |
|-----------|-----------|------|
| Unit Tests | Every commit | Vitest |
| E2E Security Tests | Every commit | Vitest |
| Baseline Scan | Every merge | ZAP Docker |
| API Scan | Every PR | ZAP Docker |
| Full Scan | Weekly / Pre-release | ZAP Docker |

### 13.2 Manual Testing

| Test Type | Frequency | When |
|-----------|-----------|------|
| Authentication Testing | Before release | Every release |
| Authorization Testing | Before release | Every release |
| Business Logic Testing | Before release | Every release |
| Penetration Testing | Annually | Scheduled assessment |

### 13.3 Release Gates

| Gate | Criteria |
|------|----------|
| Gate 1 | Written authorization, environment confirmed, backup completed |
| Gate 2 | All workflows explored, all roles tested, passive scan complete |
| Gate 3 | No unresolved Critical/High findings, Medium findings corrected or accepted |
| Gate 4 | Fixes retested, regression testing complete, final report approved |

## 14. Incident Response

### 14.1 Security Incident Classification

| Severity | Criteria | Response Time |
|----------|----------|---------------|
| Critical | RCE, auth bypass, mass data exposure | 1 hour |
| High | Significant unauthorized access, privilege escalation | 4 hours |
| Medium | Limited information disclosure, incomplete controls | 24 hours |
| Low | Hardening opportunities, minor gaps | 72 hours |

### 14.2 Incident Response Steps

1. Identify and classify the vulnerability
2. Isolate affected systems
3. Assess impact and scope
4. Develop remediation plan
5. Implement fix
6. Verify fix through retesting
7. Document lessons learned
8. Update security controls

## 15. Compliance and Auditing

### 15.1 Security Standards

- OWASP Top 10
- OWASP ASVS Level 2
- OWASP ZAP Internal Security Assessment Guide
- PCI DSS (where applicable)
- GDPR (for personal data)

### 15.2 Audit Requirements

- All security findings logged in remediation register
- Retest evidence retained
- Risk acceptance records maintained
- Final assessment sign-off documented
- Evidence stored in restricted location

## 16. References

- [OWASP ZAP](https://www.zaproxy.org/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [NIST SP 800-115](https://csrc.nist.gov/publications/detail/sp/800-115/final)
