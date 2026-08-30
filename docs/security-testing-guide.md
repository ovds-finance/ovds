# OVDS Security Testing Guide

This guide provides OVDS-specific security testing instructions based on the application architecture, modules, and compliance requirements.

## Application Architecture

### Frontend
- **Framework:** React 19 with TypeScript
- **Routing:** React Router v7
- **State Management:** TanStack Query v5
- **UI Components:** Custom design system with Tailwind CSS
- **Authentication:** JWT-based with httpOnly cookies option

### Backend
- **Framework:** NestJS v11
- **Database:** MySQL 8.0 (Prisma ORM)
- **API:** RESTful with oRPC contracts
- **Authentication:** JWT (access + refresh tokens)
- **Authorization:** Role-based (RBAC) with guards
- **Rate Limiting:** @nestjs/throttler
- **File Upload:** Multer

### Modules
The application includes the following modules that require security testing:
- HR (Employees, Departments, Attendance, Leaves, Shifts, Holidays, Payroll)
- Sales (Invoices, Estimates, Credit Notes, Sales Orders, Refunds, Receipts)
- Purchases (Bills, Expenses, Purchase Orders, Vendors, Scanned Bills)
- Banking (Accounts, Transactions, Transfers, Feeds, Reconciliation)
- Accounting (General Ledger, Double Entry, Sub-Ledger, Fixed Assets)
- CRM (Contacts, Companies, Deals, Activities, Pipeline)
- Compliance (Audit Outsourcing, EIMS, Tax Reports, VAT)
- Tax (Business Income Tax, TOT, Deferred Tax, Property Tax, Excise Tax)
- Inventory (Items, Variants, Adjustments, Valuation)
- Projects, Helpdesk, IoT, Device Control, and more

## OVDS-Specific Security Considerations

### 1. Multi-Tenant Architecture
- Each user belongs to a company (tenant)
- Data isolation between companies must be enforced server-side
- Test cross-tenant data access attempts

### 2. Ethiopian Compliance Requirements
- EIMS (Electronic Invoicing Management System) compliance
- MoR (Ministry of Revenue) tax filing integration
- TIN (Taxpayer Identification Number) validation
- Fayda ID (national digital ID) integration
- Test that compliance data cannot be accessed across tenants

### 3. Financial Data Sensitivity
- Double-entry bookkeeping integrity
- Bank transaction security
- Payment gateway integration (Chapa)
- Audit trail immutability
- Financial report access controls

### 4. Business Logic Flows
- Maker-checker (approval) workflows
- Period closing and locking
- Invoice/bill status transitions
- Payroll processing
- Tax calculation accuracy

## Authentication Testing

### Login Flow
1. **Valid Credentials:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"scanner.user@ovds.local","password":"ZapScan#2024!Strong"}'
   ```

2. **Invalid Credentials:** Verify generic error message (no account enumeration)

3. **Brute Force Protection:** Test rate limiting on login endpoint

4. **Session Management:**
   - Verify JWT expiration
   - Verify refresh token rotation
   - Verify logout invalidates tokens

### Test Accounts
| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| scanner.user@ovds.local | ZapScan#2024!Strong | EMPLOYEE | Basic access |
| scanner.admin@ovds.local | ZapRoot#2024!Secure | ADMIN | Full access |
| scanner.supervisor@ovds.local | ZapSuper#2024!View | SUPERVISOR | Managerial access |
| scanner.disabled@ovds.local | ZapDisabled#2024!Test | EMPLOYEE | Disabled account |

## Authorization Testing

### Module-Level Authorization
Test that users can only access modules they have permissions for:
- HR modules: Employees, Departments, Attendance, Leaves, Shifts, Holidays, Payroll
- Financial modules: Accounting, Banking, Tax, VAT, Budgets
- Sales modules: Invoices, Customers, Estimates, Credit Notes
- Purchase modules: Bills, Vendors, Expenses, Purchase Orders
- Compliance modules: EIMS, Audit Outsourcing, Tax Reports
- System modules: Settings, Users, Roles, Licenses

### Data-Level Authorization
- **Cross-Company:** User from Company A cannot access Company B's data
- **Cross-Department:** User from Department A cannot access Department B's data
- **Record-Level:** User can only access their own records where applicable
- **Admin-Only:** Administrative functions require ADMIN role

### API Authorization
```bash
# Test as normal user
TOKEN="<user-token>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/admin/users

# Should return 403 Forbidden

# Test as admin
ADMIN_TOKEN="<admin-token>"
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/admin/users

# Should return 200 OK
```

## Module-Specific Testing

### HR Module
- Employee data privacy (PII protection)
- Salary/payroll confidentiality
- Attendance manipulation
- Leave approval workflow bypass

### Sales Module
- Invoice tampering (price/quantity modification)
- Credit note abuse
- Duplicate invoice creation
- Customer data isolation

### Accounting Module
- Journal entry manipulation
- Period closing bypass
- Double-entry integrity
- Financial report access controls

### Tax Module
- Tax calculation manipulation
- TOT (Turnover Tax) filing bypass
- VAT report access controls
- MoR submission integrity

### Banking Module
- Transaction manipulation
- Reconciliation bypass
- Bank statement import security
- Fund transfer authorization

### Compliance Module
- EIMS invoice security
- Audit trail immutability
- Certificate access controls
- Bulk operation authorization

## API Security Testing

### Endpoint Discovery
1. Import OpenAPI/Swagger definition into ZAP
2. Run API scan with authenticated users
3. Manually test undocumented endpoints

### Common API Vulnerabilities
- Broken authentication
- Broken authorization (IDOR)
- Mass assignment
- Excessive data exposure
- Lack of rate limiting
- Missing input validation

### GraphQL Testing (if applicable)
- Introspection enabled
- Query depth limiting
- Query complexity analysis
- Authorization on mutations

## Business Logic Testing

### Maker-Checker Workflows
- Test that approvals cannot be bypassed
- Test that makers cannot approve their own work
- Test concurrent approval handling

### Financial Integrity
- Test that invoices cannot be modified after payment
- Test that period-close prevents modifications
- Test that audit logs cannot be deleted
- Test transaction rollback on failure

### Workflow State Machines
- Test invalid state transitions
- Test concurrent state changes
- Test state persistence across sessions

## Input Validation Testing

### Server-Side Validation
- SQL injection in all parameters
- XSS in all input fields
- Path traversal in file operations
- SSRF in URL parameters
- XML external entity (XXE) in XML inputs
- Command injection in system commands

### File Upload Testing
- Upload malicious files (PHP, JS, HTML)
- Upload files with double extensions
- Upload files with null bytes
- Upload oversized files
- Upload files with disallowed MIME types

## Security Headers Testing

### Required Headers
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### CORS Configuration
- Verify allowed origins are not wildcard (`*`) in production
- Verify credentials are not allowed with wildcard origins
- Test preflight request handling

## Rate Limiting Testing

### Endpoints to Test
- `/api/auth/login` - 5 attempts per minute
- `/api/auth/register` - 3 attempts per minute
- `/api/auth/forgot-password` - 3 attempts per minute
- `/api/auth/otp/verify` - 5 attempts per minute
- API search endpoints - 30 requests per minute

### Testing Method
```bash
# Send multiple requests rapidly
for i in {1..20}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# Should return 429 Too Many Requests after threshold
```

## Session Management Testing

### JWT Testing
- Verify signature validation
- Verify algorithm confusion (none/HS256/RS256)
- Verify token expiration
- Verify refresh token rotation
- Verify token revocation on logout

### Session Fixation
- Verify session ID changes after login
- Verify session ID changes after privilege elevation
- Verify session invalidation on logout

## Sensitive Data Exposure

### Data in Responses
- Verify passwords are never returned
- Verify API keys are never returned in full
- Verify PII is minimized
- Verify internal IDs are not sequential

### Data in URLs
- Verify no sensitive data in query parameters
- Verify no session tokens in URLs

### Error Messages
- Verify no stack traces in production
- Verify no database errors in responses
- Verify no internal paths in error messages

## Reporting

### Finding Format
Each finding should include:
1. **Title:** Clear description
2. **Severity:** Critical/High/Medium/Low/Info
3. **URL:** Affected endpoint
4. **Parameter:** Affected parameter (if applicable)
5. **Request:** Sanitized request details
6. **Response:** Sanitized response details
7. **Impact:** What an attacker could achieve
8. **Recommendation:** How to fix
9. **Owner:** Assigned developer
10. **Target Date:** Remediation deadline

### OVDS-Specific Severity Guidelines

**Critical**
- Authentication bypass
- Remote code execution
- SQL injection with data access
- Cross-tenant data access
- Financial transaction manipulation

**High**
- Privilege escalation
- Authorization bypass on sensitive functions
- Insecure direct object references (IDOR)
- Missing input validation on critical endpoints
- CSRF on state-changing operations

**Medium**
- Missing security headers
- Weak session configuration
- Information disclosure
- Missing rate limiting
- Client-side validation only

**Low**
- Cookie without SameSite
- Missing X-Content-Type-Options
- Server version disclosure
- Verbose error messages

## Compliance Mapping

### OWASP Top 10 (2021)
| OWASP ID | OVDS Test Cases |
|----------|-----------------|
| A01:2021 | Broken Access Control - Module and data-level authorization |
| A02:2021 | Cryptographic Failures - JWT security, password hashing |
| A03:2021 | Injection - SQL, NoSQL, SSRF, XXE |
| A04:2021 | Insecure Design - Business logic flaws |
| A05:2021 | Security Misconfiguration - Headers, CORS, debug mode |
| A06:2021 | Vulnerable Components - Dependency scanning |
| A07:2027 | Auth Failures - Session management, password policy |
| A08:2021 | Data Integrity Failures - Audit logs, immutability |
| A09:2021 | Logging Failures - Audit trail completeness |
| A10:2021 | SSRF - URL validation, internal network access |

### OWASP ASVS Level 2
- V2: Authentication
- V3: Session Management
- V4: Access Control
- V5: Malicious Input
- V6: Cryptography
- V7: Error Handling
- V8: Data Protection
- V9: Communications
- V10: HTTP Security
- V11: API Security

### Ethiopian Compliance
- EIMS invoice security requirements
- MoR data submission integrity
- TIN validation security
- Tax data confidentiality

## Tools and Scripts

### ZAP Scripts
```bash
# Validate configuration
node scripts/validate-zap-config.mjs

# Seed test users
npm run seed:zap-users

# Run all scans
bash scripts/security-test-runner.sh all

# Import results
node scripts/zap-import-results.mjs --report zap-report.json --dry-run
```

### Additional Tools
- **Burp Suite Community:** Manual testing alternative to ZAP
- **Postman/Newman:** API testing
- **npm audit:** Dependency vulnerability scanning
- **OWASP Dependency-Check:** SCA for known vulnerabilities
- **ESLint security plugins:** Static analysis

## References

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST SP 800-53](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
