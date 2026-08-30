# OVDS Security Testing Checklist

This checklist is based on the OWASP ZAP Security Assessment Guide and tailored for the OVDS application.

## Preparation

- [ ] Written authorization obtained
- [ ] Approved test environment confirmed (staging/preprod)
- [ ] Scope documented with approved URLs
- [ ] Database backup completed and restoration tested
- [ ] Synthetic/anonymized data prepared
- [ ] Test accounts created for each role:
  - [ ] Normal user (EMPLOYEE)
  - [ ] Supervisor/Manager
  - [ ] Department Administrator
  - [ ] System Administrator (ADMIN)
  - [ ] API service account
  - [ ] Disabled user
  - [ ] Locked user
- [ ] External integrations placed in sandbox mode
- [ ] Email/SMS notifications disabled
- [ ] Real payment processing disabled
- [ ] Monitoring enabled
- [ ] Emergency contacts identified

## ZAP Configuration

- [ ] ZAP Desktop or Docker installed
- [ ] Add-ons installed (Quick Start, Spider, Active Scanner, Report Generation, etc.)
- [ ] Application context created in ZAP
- [ ] Context marked as In Scope
- [ ] Production and third-party domains excluded
- [ ] Dangerous functions identified and excluded from active scanning
- [ ] Authentication configured (JSON-based for OVDS)
- [ ] Logged-in/out indicators tested
- [ ] ZAP users configured by role

## Application Coverage

- [ ] Public pages explored (Landing, Login, Register, Docs)
- [ ] Normal-user functions explored
- [ ] Administrative functions explored
- [ ] Traditional Spider completed
- [ ] Client Spider completed for modern routes
- [ ] API definitions imported (OpenAPI/Swagger)
- [ ] Passive scan queue completed
- [ ] Active scan completed in approved environment

## Authentication Testing

- [ ] Protected pages cannot be accessed without login
- [ ] Invalid credentials are rejected
- [ ] Login messages do not reveal account existence
- [ ] Password policy enforced (if applicable)
- [ ] Password reset tokens expire
- [ ] Password reset tokens cannot be reused
- [ ] Password change invalidates older sessions
- [ ] Disabled users cannot log in
- [ ] Locked users cannot log in
- [ ] Authentication tokens not exposed in URLs
- [ ] MFA cannot be bypassed (if enabled)

## Authorization Testing

- [ ] User-to-user access control tested
- [ ] Department-to-department access control tested
- [ ] Tenant-to-tenant access control tested
- [ ] Normal-user-to-administrator access blocked
- [ ] Direct URL access to hidden/admin pages blocked
- [ ] Record ID modification blocked (IDOR)
- [ ] Role/owner field modification blocked
- [ ] Downloading other users' documents blocked
- [ ] Administrative APIs protected
- [ ] API authorization tested with Postman/curl

## Session Management

- [ ] Session identifiers change after login
- [ ] Session identifiers change after privilege elevation
- [ ] Logout invalidates session
- [ ] Old session cookies cannot be reused after logout
- [ ] Sessions expire after inactivity period
- [ ] Cookies use Secure flag
- [ ] Cookies use HttpOnly flag
- [ ] Cookies use appropriate SameSite attribute
- [ ] CSRF protection applied to state-changing requests

## Input Validation

- [ ] Text fields validated server-side
- [ ] Numeric fields validated server-side
- [ ] Dates validated server-side
- [ ] Email addresses validated server-side
- [ ] Search parameters validated
- [ ] Sort/filter parameters validated
- [ ] Record identifiers validated
- [ ] JSON properties validated
- [ ] HTTP headers validated
- [ ] File names sanitized
- [ ] Uploaded file content validated
- [ ] Redirect parameters validated (open redirect)

## File Upload

- [ ] Only required file types accepted
- [ ] File extension AND content validated
- [ ] Maximum file size enforced
- [ ] File names regenerated/sanitized
- [ ] Uploaded files not stored in executable locations
- [ ] Uploaded files cannot overwrite existing files
- [ ] Files access-controlled
- [ ] Sensitive files cannot be downloaded by unauthorized users

## Error Handling

- [ ] Stack traces not exposed to users
- [ ] SQL errors not exposed
- [ ] Framework errors not exposed
- [ ] Source code fragments not exposed
- [ ] Internal file paths not exposed
- [ ] Server configuration details not exposed
- [ ] Internal IP addresses not exposed
- [ ] Database names not exposed

## Sensitive Data

- [ ] Passwords never returned in responses
- [ ] Secrets not included in HTML/JavaScript
- [ ] Sensitive data not placed in URLs
- [ ] Sensitive responses use appropriate cache controls
- [ ] PII minimized in responses
- [ ] API responses contain only required fields
- [ ] Logs do not contain passwords or session tokens

## Business Logic

- [ ] Mandatory workflow steps cannot be skipped
- [ ] Users cannot approve their own requests
- [ ] Transactions cannot be repeated
- [ ] Negative/unreasonable values rejected
- [ ] Expired requests cannot be reused
- [ ] Discounts cannot be applied multiple times
- [ ] Prices/totals cannot be modified client-side
- [ ] Actions cannot be performed in wrong sequence
- [ ] Transaction/approval limits enforced
- [ ] Maker-checker controls cannot be bypassed

## Rate Limiting and Abuse Controls

- [ ] Login attempts rate limited
- [ ] Password reset requests rate limited
- [ ] OTP generation/verification rate limited
- [ ] Account creation rate limited
- [ ] Search operations rate limited
- [ ] Expensive reports rate limited
- [ ] File upload rate limited
- [ ] Email/SMS generation rate limited
- [ ] Sensitive API calls rate limited

## API Security

- [ ] Every endpoint requires authentication
- [ ] Authorization checked on every request
- [ ] Object IDs cannot access other users' data
- [ ] Administrative endpoints protected
- [ ] Server-side input validation applied
- [ ] API responses do not expose unnecessary fields
- [ ] Error messages do not reveal stack traces
- [ ] Rate limits applied to sensitive endpoints
- [ ] Pagination limits enforced
- [ ] Bulk operations restricted
- [ ] Mass assignment prevented
- [ ] Content types restricted
- [ ] Expired/invalid tokens rejected
- [ ] Token scopes enforced
- [ ] API documentation does not expose secrets

## Security Headers and Configuration

- [ ] Content-Security-Policy header present
- [ ] X-Content-Type-Options header present
- [ ] X-Frame-Options header present
- [ ] Strict-Transport-Security header present (if HTTPS)
- [ ] Permissions-Policy header present
- [ ] Referrer-Policy header present
- [ ] CORS configured correctly (not wildcard in production)
- [ ] Server version not disclosed
- [ ] Debug mode disabled in production

## Review and Validation

- [ ] All Medium/High/Critical alerts manually validated
- [ ] False positives documented with justification
- [ ] Findings assigned to owners
- [ ] Remediation dates agreed
- [ ] Critical and High findings corrected
- [ ] Retesting completed
- [ ] Final report approved
- [ ] Evidence stored in restricted location
- [ ] Lessons learned documented
