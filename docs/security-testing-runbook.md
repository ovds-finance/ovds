# Security Testing Runbook

This runbook provides step-by-step instructions for conducting security assessments of the OVDS application using OWASP ZAP.

## Pre-Assessment Checklist

### Authorization
- [ ] Written authorization obtained from application owner
- [ ] Scope documented with approved URLs and domains
- [ ] Assessment start and end dates confirmed
- [ ] Emergency contacts identified
- [ ] Prohibited activities documented

### Environment
- [ ] Dedicated security testing environment confirmed
- [ ] OR staging/preproduction environment approved
- [ ] Production testing limited to passive scanning only
- [ ] Database backup completed and restoration tested
- [ ] Synthetic or anonymized data loaded
- [ ] Real personal/financial data removed where possible
- [ ] Test user accounts created
- [ ] Email/SMS notifications disabled
- [ ] Real payment processing disabled
- [ ] Third-party integrations replaced with sandbox services

### Tools
- [ ] ZAP Desktop or Docker installed
- [ ] ZAP add-ons installed and updated
- [ ] Docker Desktop running (for containerized scans)
- [ ] Test accounts credentials documented

## Phase 1: Preparation

### Step 1.1: Validate Configuration
```bash
# Validate ZAP configuration
node scripts/validate-zap-config.mjs

# Check application readiness
bash scripts/check-app-readiness.sh http://localhost:3000
```

### Step 1.2: Seed Test Data
```bash
# Create test users
npm run seed:zap-users

# Create synthetic test data
node scripts/seed-zap-test-data.mjs --api-url http://localhost:3001/api --token <admin-token>
```

### Step 1.3: Start Application
```bash
# Start the security testing stack
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d

# Verify application is running
bash scripts/check-app-readiness.sh http://localhost:3000
```

## Phase 2: Manual Exploration and Passive Scanning

### Step 2.1: Launch ZAP
```bash
# Start ZAP Desktop
# OR start ZAP Docker container
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml up -d zap

# Initialize session (for ZAP Desktop)
bash scripts/zap-init-session.sh http://localhost:8080 ovds-zap-secret
```

### Step 2.2: Explore Application
Using the ZAP-launched browser:
1. Visit every main page
2. Log in using each user role
3. Open menus and submenus
4. Submit forms using normal test data
5. Exercise search and filtering
6. Create, update and delete test records
7. Test file upload and download
8. Generate reports
9. Trigger validation messages
10. Use password change and reset functions
11. Log out and log back in
12. Exercise administrative functions
13. Use multi-step workflows
14. Open pages available only to specific roles

### Step 2.3: Review Passive Alerts
Focus on:
- Cookies without Secure flag
- Cookies without HttpOnly flag
- Missing SameSite attribute
- Missing Content-Security-Policy
- Missing anti-clickjacking protection
- Missing X-Content-Type-Options
- Sensitive information in URLs
- Sensitive information in responses
- Debug messages
- Stack traces
- Server version disclosure
- Mixed HTTP and HTTPS content
- Insecure cache controls
- Cross-domain configuration
- Outdated browser-side JavaScript libraries

## Phase 3: Application Crawling

### Step 3.1: Traditional Spider
1. Right-click application context in ZAP
2. Select Attack → Spider
3. Select authenticated user (normal_user)
4. Confirm correct context
5. Start spider
6. Review discovered URLs

### Step 3.2: Client Spider (for modern apps)
1. Right-click application context
2. Select Attack → Client Spider
3. Select authenticated user
4. Start client spider
5. Wait for completion

### Step 3.3: Verify Coverage
Compare ZAP Sites tree against:
- Application menus
- API documentation
- QA test cases
- Known application routes
- Administrative functionality

## Phase 4: Configure Authenticated Scanning

### Step 4.1: Configure Authentication
1. Open Context Properties
2. Select Authentication
3. Method: JSON-based
4. Login URL: `http://localhost:3001/api/auth/login`
5. Username parameter: `email`
6. Password parameter: `password`
7. Logged-in indicator: `"access_token"`
8. Logged-out indicator: `Invalid credentials|401|Unauthorized`

### Step 4.2: Create ZAP Users
- Normal user: `scanner.user@ovds.local` / `ZapScan#2024!Strong`
- Admin user: `scanner.admin@ovds.local` / `ZapRoot#2024!Secure`

### Step 4.3: Verify Authentication
- Start scan as selected user
- Confirm authenticated pages appear in Sites tree
- Confirm application does not redirect to login
- Confirm session renewal works
- Confirm account lockout is not triggered

## Phase 5: Active Scanning

### Step 5.1: Pre-Scan Confirmation
- [ ] Backup or snapshot completed
- [ ] Restoration contact available
- [ ] Monitoring enabled
- [ ] Synthetic data loaded
- [ ] External notifications disabled
- [ ] Real payment services disabled
- [ ] Test accounts confirmed
- [ ] Scope verified
- [ ] Dangerous URLs reviewed
- [ ] Application owner notified

### Step 5.2: Run Active Scan
```bash
# Using PowerShell script
.\scripts\zap-authenticated-scan.ps1 -TargetFrontend "http://localhost:3000" -TargetBackend "http://localhost:3001"

# OR using Docker
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml exec -T zap \
  zap-full-scan.py \
  -t http://localhost:3000 \
  -r /zap/wrk/reports/zap-full-scan.html \
  --max_children 5 \
  --max_depth 10 \
  --max_scan_time 60m
```

### Step 5.3: Monitor Application
- Monitor CPU, memory, database activity
- Check application logs for errors
- Watch for rate limiting triggers
- Be ready to stop scan if instability observed

## Phase 6: API Security Testing

### Step 6.1: Import API Definition
```bash
# Using PowerShell script
.\scripts\zap-api-scan.ps1 -ApiDefinition "http://localhost:3001/api/openapi.json"

# OR using Docker
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml exec -T zap \
  zap-api-scan.py \
  -t http://localhost:3001/api/openapi.json \
  -f openapi \
  -r /zap/wrk/reports/zap-api-scan.html
```

### Step 6.2: Verify API Security
- Every endpoint requires intended authentication
- Authorization is checked on every request
- Object identifiers cannot access other users' data
- Administrative endpoints are protected
- Server-side input validation is applied
- API responses do not expose unnecessary fields
- Error messages do not reveal stack traces
- Rate limits are applied to sensitive endpoints
- Pagination limits are enforced
- Bulk operations have appropriate restrictions
- Mass assignment is prevented
- Content types are restricted
- Expired and invalid tokens are rejected
- Token scopes are enforced

## Phase 7: Manual Security Tests

### Authentication Testing
- [ ] Protected pages cannot be accessed without login
- [ ] Invalid credentials are rejected
- [ ] Login messages do not reveal account existence
- [ ] Password reset tokens expire
- [ ] Password reset tokens cannot be reused
- [ ] Password change invalidates older sessions
- [ ] Disabled users cannot log in
- [ ] Locked users cannot log in
- [ ] Authentication tokens are not exposed in URLs
- [ ] MFA cannot be bypassed (if enabled)

### Authorization Testing
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

### Session Management Testing
- [ ] Session identifiers change after login
- [ ] Session identifiers change after privilege elevation
- [ ] Logout invalidates session
- [ ] Old session cookies cannot be reused after logout
- [ ] Sessions expire after inactivity period
- [ ] Cookies use Secure flag
- [ ] Cookies use HttpOnly flag
- [ ] Cookies use appropriate SameSite attribute
- [ ] CSRF protection applied to state-changing requests

### Input Validation Testing
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
- [ ] Redirect parameters validated

### File Upload Testing
- [ ] Only required file types accepted
- [ ] File extension AND content validated
- [ ] Maximum file size enforced
- [ ] File names regenerated/sanitized
- [ ] Uploaded files not stored in executable locations
- [ ] Uploaded files cannot overwrite existing files
- [ ] Files access-controlled
- [ ] Sensitive files cannot be downloaded by unauthorized users

### Error Handling Testing
- [ ] Stack traces not exposed to users
- [ ] SQL errors not exposed
- [ ] Framework errors not exposed
- [ ] Source code fragments not exposed
- [ ] Internal file paths not exposed
- [ ] Server configuration details not exposed
- [ ] Internal IP addresses not exposed
- [ ] Database names not exposed

### Sensitive Data Testing
- [ ] Passwords never returned in responses
- [ ] Secrets not included in HTML/JavaScript
- [ ] Sensitive data not placed in URLs
- [ ] Sensitive responses use appropriate cache controls
- [ ] PII minimized in responses
- [ ] API responses contain only required fields
- [ ] Logs do not contain passwords or session tokens

### Business Logic Testing
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

### Rate Limiting Testing
- [ ] Login attempts rate limited
- [ ] Password reset requests rate limited
- [ ] OTP generation/verification rate limited
- [ ] Account creation rate limited
- [ ] Search operations rate limited
- [ ] Expensive reports rate limited
- [ ] File upload rate limited
- [ ] Email/SMS generation rate limited
- [ ] Sensitive API calls rate limited

## Phase 8: Review and Validate Findings

### Step 8.1: Validate Alerts
For every Medium, High or Critical alert:
1. Review affected URL
2. Review HTTP request
3. Review HTTP response
4. Confirm test user and role
5. Reproduce the finding
6. Determine whether behavior creates security impact
7. Check whether finding is duplicated elsewhere
8. Mark confirmed findings
9. Record false positives with justification
10. Assign finding to remediation owner

### Step 8.2: Classify Findings
- **Critical:** Complete compromise, RCE, auth bypass, mass data exposure → Block deployment
- **High:** Significant unauthorized access, privilege escalation, account takeover → Block deployment
- **Medium:** Limited info disclosure, weak config, incomplete controls → Correct or accept risk
- **Low:** Minor header gaps, low-value disclosure, hardening opportunities → Record and correct
- **Informational:** Improvement opportunities without demonstrated vulnerability

## Phase 9: Reporting

### Step 9.1: Generate Reports
```bash
# Generate HTML report
.\scripts\generate-security-report.ps1 -Format html -Output .\security-reports\report

# Generate JSON report
.\scripts\generate-security-report.ps1 -Format json -Output .\security-reports\report

# Generate Markdown report
.\scripts\generate-security-report.ps1 -Format md -Output .\security-reports\report
```

### Step 9.2: Create Remediation Register
Update `scripts/remediation-register.md` with:
- Finding ID
- Title
- Severity
- Affected component
- Status
- Owner
- Target date
- Retest result

### Step 9.3: Final Report Contents
1. Approved scope and rules-of-engagement record
2. Application architecture and role summary
3. ZAP session file where appropriate
4. ZAP HTML report
5. Manual testing checklist
6. Confirmed vulnerability report
7. Remediation register
8. Risk-acceptance records
9. Retest evidence
10. Final assessment sign-off

## Phase 10: Retesting

### Step 10.1: After Remediation
1. Deploy correction to test environment
2. Reproduce original vulnerability
3. Confirm original test no longer succeeds
4. Confirm application returns expected secure response
5. Test related endpoints and parameters
6. Run relevant ZAP scan again
7. Conduct regression testing
8. Confirm correction did not create another vulnerability
9. Update remediation register
10. Retain evidence of successful retest

### Step 10.2: Sign-off
- Vulnerability marked Fixed only after independent verification
- Final report approved
- Residual risk accepted by application owner

## Cleanup

```bash
# Stop security testing stack
docker compose -f docker-compose.ovds.yml -f docker-compose.security.yml down -v

# Clean up test data
npm run db:reset:dev -w @ovds/database

# Remove test users (if needed)
# Use application UI or database query to remove test accounts
```

## Emergency Procedures

### If Production is Affected
1. Stop scan immediately
2. Notify application owner and emergency contact
3. Document all actions taken
4. Preserve logs and evidence
5. Conduct post-incident review

### If Test Data is Corrupted
1. Stop scan immediately
2. Restore from backup
3. Verify restoration
4. Document incident
5. Update test environment procedures

## Contact

For security issues or questions about this runbook:
- Email: security@ovds.com.et
- Internal Slack: #security-team
