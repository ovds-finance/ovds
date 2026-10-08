# Internal Web Application Security Assessment Guide — Primary Tool: OWASP ZAP

**Audience:** Developers, QA Engineers, DevOps Engineers and Application Owners
**Document Version:** 1.0
**Assessment Type:** Internal Dynamic Application Security Testing
**Classification:** Internal Use

---

## 1. Purpose

This guide defines the process developers should follow to conduct an internal security assessment of a web application using OWASP ZAP.

The assessment is intended to:

- Identify common web application vulnerabilities before deployment.
- Test publicly accessible and authenticated application functions.
- Verify authentication, authorization and session controls.
- Detect insecure configurations, missing security headers and information exposure.
- Test APIs used by the application.
- Produce evidence-based findings for remediation.
- Retest corrected vulnerabilities.
- Introduce repeatable security testing into the development lifecycle.

OWASP ZAP operates primarily as an intercepting proxy and dynamic application security testing tool. It observes and manipulates traffic between the browser and application and can perform passive and active security scanning.

---

## 2. Important limitation

A ZAP scan is not, by itself, a complete security assessment.

Automated scanning may not fully identify:

- Business logic vulnerabilities.
- Complex authorization failures.
- Fraud and workflow abuse.
- Vulnerabilities that require source-code review.
- Insecure system architecture.
- Secrets embedded in source repositories.
- Vulnerable server-side dependencies that are not visible through web traffic.
- Infrastructure vulnerabilities outside the web application.

The assessment should therefore combine:

1. Automated ZAP scanning.
2. Manual testing through ZAP.
3. Developer review of critical security controls.
4. Role-based authorization testing.
5. Review against OWASP ASVS requirements.

The OWASP Web Security Testing Guide covers information gathering, configuration, identity, authentication, authorization, session management, input validation, error handling, cryptography, business logic and client-side testing. OWASP ASVS provides detailed technical security requirements that developers can use as a verification checklist.

---

## 3. Rules of engagement

### 3.1 Written authorization

Testing shall only be performed against applications that the organization owns or has written authorization to assess.

The assessment authorization should identify:

- Application name.
- Approved environment.
- Approved URLs and domains.
- Assessment start and end dates.
- Authorized testers.
- Permitted test types.
- Prohibited activities.
- Emergency contact.
- Application owner.
- Data backup and restoration contact.

ZAP active scanning sends vulnerability-testing payloads to the target. ZAP explicitly warns that active scanning is an attack and should only be used against systems the tester owns or has permission to test.

### 3.2 Approved test environment

Active scanning should normally be conducted against:

- A dedicated security-testing environment.
- A staging environment.
- A preproduction environment.
- A temporary copy of the application and database.

Production testing should be limited to passive scanning unless the application owner has approved specific active tests after evaluating the operational risk.

### 3.3 Protect application data

Before testing:

- Take a current database backup or snapshot.
- Confirm that restoration has been tested.
- Use synthetic or anonymized data.
- Remove real personal, financial and confidential information where possible.
- Create test user accounts.
- Disable or redirect email and SMS notifications.
- Disable real payment processing.
- Disable real customer onboarding.
- Replace third-party production integrations with sandbox services.
- Confirm that transactions can be reversed.

### 3.4 Identify dangerous functions

Developers shall identify functions that could cause irreversible or disruptive actions, including:

- Deleting users or records.
- Bulk data deletion.
- Sending messages to customers.
- Submitting payments.
- Creating financial transactions.
- Changing passwords for real users.
- Triggering account lockouts.
- Generating large reports.
- Uploading large files.
- Calling paid external APIs.
- Starting background jobs.
- Changing application configuration.

Such functions should either be tested using controlled records or temporarily excluded from automated active scanning.

---

## 4. Recommended assessment roles

| Role | Responsibilities |
|------|-----------------|
| **Application owner** | Approves the scope; confirms the correct test environment; approves operational risk; accepts or rejects residual risks. |
| **Lead developer** | Explains application architecture; identifies authentication and authorization mechanisms; provides test accounts and API definitions; coordinates remediation. |
| **Security tester or assigned developer** | Configures ZAP; conducts automated and manual testing; validates findings; records evidence; performs retesting. |
| **DevOps engineer** | Provides the test environment; monitors system health; supports backups and restoration; integrates ZAP into the CI/CD pipeline. |
| **QA engineer** | Provides application workflows and test cases; confirms functional coverage; verifies that security fixes do not create regressions. |

Where possible, the person validating a security control should not be the only developer who implemented that control.

---

## 5. Tool installation

### 5.1 Installation options

Developers may use either:

**Option A — ZAP Desktop**
Recommended for:

- First-time users.
- Manual exploration.
- Authentication configuration.
- Role-based testing.
- Reviewing requests and responses.
- Validating findings.

Install the current stable ZAP Desktop release for Windows, Linux or macOS. ZAP can also be run using its official Docker image.

**Option B — ZAP Docker**
Recommended for:

- CI/CD pipelines.
- Repeatable baseline scans.
- Scheduled scans.
- API scans.
- Standardized team execution.

Official Docker image:

```
ghcr.io/zaproxy/zaproxy:stable
```

### 5.2 Recommended ZAP add-ons

From Manage Add-ons, confirm that the following are installed and updated:

- Quick Start.
- Traditional Spider.
- Client Side Integration and Client Spider.
- Authentication Helper.
- OpenAPI Support.
- GraphQL Support, where applicable.
- Report Generation.
- Passive Scanner Rules.
- Active Scanner Rules.
- Retire.js.

Add-ons can be managed through the ZAP Marketplace from within the desktop application.

---

## 6. Information required before testing

Developers should prepare the following information:

**Application information**

- Application name and business purpose.
- Test environment URL.
- Front-end framework.
- Back-end framework.
- Web server or reverse proxy.
- Database platform.
- Authentication method.
- Session management method.
- API technologies.
- File upload functions.
- External integrations.
- Administrative functions.
- Sensitive data processed.

**Test accounts**

Prepare separate accounts for each role, for example:

- Unauthenticated user.
- Normal user.
- Supervisor.
- Department administrator.
- System administrator.
- API service account.
- Disabled user.
- Locked user.
- User from a different department or tenant.

Do not use production credentials or personal administrator accounts.

**API documentation**

Provide, where applicable:

- OpenAPI or Swagger file.
- GraphQL endpoint or schema.
- SOAP WSDL.
- Postman collection.
- Authentication header requirements.
- Example API requests.
- Test API credentials.

---

## 7. Define the test scope in ZAP

### 7.1 Create an application context

In the ZAP Sites tree:

1. Open the application using ZAP.
2. Right-click the application domain.
3. Select **Include in Context**.
4. Select **New Context**.
5. Name the context after the application.
6. Mark the context as **In Scope**.

ZAP contexts group related URLs and define which application resources are included in testing. ZAP recommends defining contexts for the applications being assessed.

### 7.2 Define included URLs

Example:

```
https://staging.example.internal/.*
```

Include:

- Main web application.
- API base URL.
- Static application resources where relevant.
- Authentication endpoints.
- Administrative areas that are within scope.

### 7.3 Define excluded URLs

Exclude URLs only where automated testing could cause unacceptable harm.

Possible examples:

```
.*/logout.*
.*/admin/database-reset.*
.*/admin/purge.*
.*/payment/submit.*
.*/notifications/send-all.*
```

Do not exclude sensitive functionality merely because it is important. Instead, test it manually using controlled test data.

### 7.4 Verify scope

Enable ZAP's scope display and confirm that:

- Only approved domains are in scope.
- Third-party services are outside scope.
- Production domains are outside scope.
- CDN and analytics domains are excluded unless specifically authorized.
- The identity provider is included only when authorized.

---

## 8. Phase 1 — Manual exploration and passive scanning

Passive scanning analyzes traffic without sending vulnerability attack payloads. It is the safest starting point.

### 8.1 Launch the application through ZAP

From ZAP Desktop:

1. Select **Quick Start**.
2. Select **Manual Explore**.
3. Enter the test application URL.
4. Select Chrome or Firefox.
5. Select **Launch Browser**.

Browsers launched from ZAP are automatically configured to proxy traffic through ZAP and ignore the ZAP-generated certificate warnings.

### 8.2 Explore the application

Using the ZAP-launched browser:

- Visit every main page.
- Log in using each user role.
- Open menus and submenus.
- Submit forms using normal test data.
- Exercise search and filtering.
- Create, update and delete test records.
- Test file upload and download.
- Generate reports.
- Trigger validation messages.
- Use password change and password reset functions.
- Log out and log back in.
- Exercise administrative functions.
- Use multi-step workflows.
- Open pages available only to specific roles.

The objective is to populate the ZAP Sites tree with realistic application traffic.

### 8.3 Review passive alerts

Pay particular attention to alerts involving:

- Cookies without Secure.
- Cookies without HttpOnly.
- Missing SameSite.
- Missing Content Security Policy.
- Missing anti-clickjacking protection.
- Missing X-Content-Type-Options.
- Sensitive information in URLs.
- Sensitive information in responses.
- Debug messages.
- Stack traces.
- Server version disclosure.
- Mixed HTTP and HTTPS content.
- Insecure cache controls.
- Cross-domain configuration.
- Outdated browser-side JavaScript libraries.

Wait until the passive scanning queue reaches zero before treating the results as complete.

---

## 9. Phase 2 — Application crawling

Automated crawling helps discover URLs that were not visited manually.

### 9.1 Traditional Spider

Use the traditional spider for server-rendered applications and link-based content.

1. Right-click the application context.
2. Select **Attack**.
3. Select **Spider**.
4. Select the appropriate authenticated user.
5. Confirm the correct context.
6. Start the spider.
7. Review discovered URLs.

The traditional spider discovers resources by following links and references contained in application responses.

### 9.2 Client Spider for modern applications

Use Client Spider for applications built with frameworks such as:

- React.
- Angular.
- Vue.
- Single-page applications.
- Applications using client-side routing.
- Applications that load content dynamically.

ZAP currently recommends Client Spider for modern web applications because it can observe browser-side application behavior and generally provides better coverage than the older AJAX Spider.

After crawling, compare the ZAP Sites tree against:

- Application menus.
- API documentation.
- QA test cases.
- Known application routes.
- Administrative functionality.

Missing routes must be manually explored or imported through an API definition.

---

## 10. Phase 3 — Configure authenticated scanning

Authenticated scanning is necessary because most important application functions are not publicly accessible.

### 10.1 Configure authentication

Within the application context:

1. Open **Context Properties**.
2. Select **Authentication**.
3. Select the appropriate method:
   - Form-based authentication.
   - JSON-based authentication.
   - HTTP or NTLM authentication.
   - Browser-based authentication.
   - Authentication script.
4. Configure the login URL.
5. Configure username and password parameters.
6. Define a logged-in indicator.
7. Define a logged-out indicator.
8. Test the authentication configuration.

ZAP supports multiple authentication methods, including form-based, JSON-based, HTTP/NTLM, browser-based and scripted authentication. ZAP recommends testing authentication configuration through the desktop interface before automating it.

### 10.2 Create ZAP users

Create a ZAP user for each application role:

- Normal user.
- Supervisor.
- Administrator.
- Other business roles.

Store only dedicated test credentials.

### 10.3 Verify authentication

Before scanning:

- Start the scan as the selected user.
- Confirm that authenticated pages appear in the Sites tree.
- Confirm that the application does not redirect the scan to the login page.
- Confirm that session renewal works.
- Confirm that account lockout is not being triggered.
- Check ZAP authentication statistics where available.

If authenticated content is not being discovered, stop the active scan and correct authentication first.

---

## 11. Phase 4 — Active scanning

### 11.1 Safety warning

Active scanning sends attack payloads to application parameters and may:

- Create unexpected records.
- Change stored data.
- Cause validation errors.
- Trigger application logs and alerts.
- Increase CPU, memory or database activity.
- Trigger rate limiting.
- Lock test accounts.
- Affect external integrations.

Active scanning shall therefore be conducted only in the approved test environment.

### 11.2 Pre-scan confirmation

Before starting, confirm:

- Backup or snapshot completed.
- Restoration contact available.
- Monitoring enabled.
- Synthetic data loaded.
- External notifications disabled.
- Real payment services disabled.
- Test accounts confirmed.
- Scope verified.
- Dangerous URLs reviewed.
- Application owner notified.

### 11.3 Run the active scan

In ZAP Desktop:

1. Right-click the in-scope context.
2. Select **Attack**.
3. Select **Active Scan**.
4. Select the intended user.
5. Select the application scan policy.
6. Verify the starting URL.
7. Confirm that only in-scope URLs are selected.
8. Start the scan.
9. Monitor application and infrastructure health.
10. Stop the scan if instability is observed.

### 11.4 Recommended first active scan

For the initial assessment:

- Use one normal user account.
- Use a limited number of scan threads.
- Scan one application module at a time.
- Avoid unrestricted recursion.
- Monitor application logs.
- Review early findings before continuing.
- Increase coverage gradually.

Once the application remains stable, conduct scans for other roles and administrative areas.

---

## 12. Phase 5 — API security testing

### 12.1 Import the API definition

Where an OpenAPI definition is available:

1. Open ZAP.
2. Select **Import**.
3. Select **OpenAPI Definition**.
4. Import the definition from a file or approved URL.
5. Verify the imported endpoints.
6. Add the endpoints to the application context.
7. Configure API authentication.
8. Scan the imported API.

ZAP provides a dedicated API scan for OpenAPI, SOAP and GraphQL targets. The scan imports the API definition and applies testing rules appropriate for APIs.

### 12.2 API assessment checks

Developers shall verify:

- Every endpoint requires the intended authentication.
- Authorization is checked on every request.
- Object identifiers cannot be used to access another user's data.
- Administrative endpoints are protected.
- Server-side input validation is applied.
- API responses do not expose unnecessary fields.
- Error messages do not reveal stack traces or internal details.
- Rate limits are applied to sensitive endpoints.
- Pagination limits are enforced.
- Bulk operations have appropriate restrictions.
- Mass assignment is prevented.
- Content types are restricted.
- Expired and invalid tokens are rejected.
- Token scopes are enforced.
- API documentation does not expose secrets.

---

## 13. Phase 6 — Mandatory manual security tests

Automated scanning findings must be supplemented by the following manual tests.

### 13.1 Authentication

Verify that:

- Protected pages cannot be accessed without login.
- Invalid credentials are rejected.
- Login messages do not unnecessarily reveal whether an account exists.
- Password policies meet organizational requirements.
- Password reset tokens expire.
- Password reset tokens cannot be reused.
- Password change invalidates older sessions where required.
- Disabled users cannot log in.
- Locked users cannot log in.
- Authentication tokens are not exposed in URLs.
- MFA cannot be bypassed where MFA is required.

### 13.2 Authorization

For every sensitive function:

1. Capture the authorized request in ZAP.
2. Repeat the request using a lower-privileged test user.
3. Confirm that the server rejects the request.
4. Confirm that no sensitive information is returned.
5. Confirm that no data change occurs.

Test:

- User-to-user access.
- Department-to-department access.
- Tenant-to-tenant access.
- Normal-user-to-administrator access.
- Direct access to hidden URLs.
- Modification of record identifiers.
- Modification of role or owner fields.
- Downloading another user's documents.
- Calling administrative APIs directly.

A hidden menu is not an authorization control. Authorization must be enforced by the server.

### 13.3 Session management

Verify that:

- Session identifiers change after login.
- Session identifiers change after privilege elevation.
- Logout invalidates the session.
- Old session cookies cannot be reused after logout.
- Sessions expire after the approved inactivity period.
- Cookies use Secure, HttpOnly and appropriate SameSite settings.
- Session tokens are not stored insecurely.
- Concurrent-session behavior matches organizational policy.
- CSRF protection is applied to state-changing browser requests.

### 13.4 Input validation

Verify server-side validation for:

- Text fields.
- Numeric fields.
- Dates.
- Email addresses.
- Search parameters.
- Sort and filter parameters.
- Record identifiers.
- JSON properties.
- HTTP headers.
- File names.
- Uploaded file content.
- Redirect parameters.

Client-side validation alone is insufficient because it can be bypassed by sending requests directly through ZAP.

### 13.5 File upload

Verify that:

- Only required file types are accepted.
- File extension and content are both validated.
- Maximum file size is enforced.
- File names are regenerated or sanitized.
- Uploaded files are not stored in an executable location.
- Uploaded files cannot overwrite existing files.
- Files are access-controlled.
- Sensitive files cannot be downloaded by unauthorized users.
- Malware scanning is applied where required.
- Error messages do not disclose storage paths.

### 13.6 Error handling

Verify that users do not receive:

- Stack traces.
- SQL errors.
- Framework errors.
- Source-code fragments.
- Internal file paths.
- Server configuration details.
- Internal IP addresses.
- Database names.
- API keys or tokens.

Detailed error information should be recorded only in protected server logs.

### 13.7 Sensitive data

Verify that:

- Passwords are never returned.
- Secrets are not included in HTML or JavaScript.
- Sensitive data is not placed in URLs.
- Sensitive responses use appropriate cache controls.
- Personally identifiable information is minimized.
- API responses contain only required fields.
- Logs do not contain passwords, session tokens or full payment information.
- Export and reporting functions enforce authorization.

### 13.8 Business logic

Test whether users can:

- Skip mandatory workflow steps.
- Approve their own requests when prohibited.
- Repeat a transaction.
- Submit negative or unreasonable values.
- Reuse expired requests.
- Apply the same discount multiple times.
- Change prices or totals submitted by the browser.
- Perform actions in the wrong sequence.
- Exceed transaction or approval limits.
- Bypass maker-checker controls.
- Act on records already cancelled or completed.

### 13.9 Rate limiting and abuse controls

Using only approved test accounts, verify reasonable controls for:

- Login attempts.
- Password reset requests.
- OTP generation and verification.
- Account creation.
- Search operations.
- Expensive reports.
- File upload.
- Email or SMS generation.
- Sensitive API calls.

Testing should stop before it affects shared infrastructure or third-party services.

---

## 14. Review and validate findings

ZAP alerts must not automatically be treated as confirmed vulnerabilities.

For every Medium, High or Critical alert:

1. Review the affected URL.
2. Review the HTTP request.
3. Review the HTTP response.
4. Confirm the test user and role.
5. Reproduce the finding.
6. Determine whether the behavior creates a security impact.
7. Check whether the finding is duplicated elsewhere.
8. Mark confirmed findings.
9. Record false positives with justification.
10. Assign the finding to a remediation owner.

Do not place active passwords, API secrets, complete session tokens or confidential production data in the final report.

---

## 15. Finding classification

The following internal classification is recommended.

| Rating | Characteristics | Release decision |
|--------|----------------|-----------------|
| **Critical** | Complete application compromise; Remote code execution; Authentication bypass; Mass exposure of highly sensitive data; Full administrative control; Cross-tenant compromise affecting many customers. | Deployment must be blocked. |
| **High** | Significant unauthorized data access; Privilege escalation; Account takeover; Serious injection vulnerability; Unauthorized administrative action; Significant integrity or financial impact. | Deployment must normally be blocked. |
| **Medium** | Limited information disclosure; Weak session configuration; Missing protection on a noncritical function; Restricted authorization weakness; Security control present but incomplete. | Correct before deployment or obtain documented risk acceptance. |
| **Low** | Minor security-header gaps; Low-value information disclosure; Hardening opportunities; Inconsistent security configuration. | Record and correct within the agreed remediation period. |
| **Informational** | A security observation or improvement opportunity without a demonstrated vulnerability. | N/A |

---

## 16. Required finding format

Each confirmed finding should contain:

| Field | Description |
|-------|-------------|
| **Finding title** | A clear description of the vulnerability. |
| **Risk rating** | Critical, High, Medium, Low or Informational. |
| **Affected component** | URL; API endpoint; Application module; User role; Parameter. |
| **Description** | Explain what security control is missing or ineffective. |
| **Reproduction steps** | Provide the minimum steps necessary for an authorized developer to reproduce the issue. |
| **Evidence** | Include sanitized: Request details; Response details; Screenshots; Error messages; User role; Date and time. |
| **Impact** | Explain what an attacker or unauthorized user could achieve. |
| **Recommendation** | Provide a practical development or configuration correction. |
| **Owner and target date** | Identify the responsible team and agreed remediation date. |
| **Retest status** | Not retested; Fixed; Partially fixed; Not fixed; Risk accepted; False positive. |

---

## 17. Generate the ZAP report

After scanning:

1. Wait for the passive scan queue to finish.
2. Review and validate the alerts.
3. Mark false positives where justified.
4. Select **Report**.
5. Select **Generate Report**.
6. Select an HTML or suitable risk-based template.
7. Include the approved application site only.
8. Include the required risk levels.
9. Save the report in the project's restricted security folder.

ZAP supports report generation through both its desktop interface and Automation Framework. Reports can be filtered by site, risk and confidence.

The ZAP report should be accompanied by a separate remediation register containing:

- Finding number.
- Finding title.
- Severity.
- Affected module.
- Assigned owner.
- Target date.
- Current status.
- Retest result.
- Risk acceptance reference.

---

## 18. Retesting

After remediation:

1. Deploy the correction to the test environment.
2. Reproduce the original vulnerability.
3. Confirm that the original test no longer succeeds.
4. Confirm that the application now returns the expected secure response.
5. Test related endpoints and parameters.
6. Run the relevant ZAP scan again.
7. Conduct regression testing.
8. Confirm that the correction did not create another vulnerability.
9. Update the remediation register.
10. Retain evidence of the successful retest.

A vulnerability shall be marked Fixed only after independent verification.

---

## 19. Docker-based baseline scan

A ZAP baseline scan performs crawling and passive scanning without active attack payloads. ZAP describes this as suitable for short, repeatable checks and CI/CD use.

Run from Linux, macOS or PowerShell:

```bash
docker run --rm \
  -v "$(pwd):/zap/wrk/:rw" \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t https://staging.example.internal \
  -r zap-baseline-report.html
```

Replace the example URL with the approved test environment.

Recommended use:

- On every major merge.
- Before deployment to staging.
- As a nightly or weekly security check.
- After security-sensitive configuration changes.

---

## 20. Docker-based full scan

The ZAP full scan performs crawling followed by active scanning. It sends attack payloads and must not be run against production without explicit approval.

```bash
docker run --rm \
  -v "$(pwd):/zap/wrk/:rw" \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py \
  -t https://security-test.example.internal \
  -r zap-full-scan-report.html
```

Recommended use:

- In a dedicated security environment.
- Before major releases.
- After material authentication or authorization changes.
- After large framework or platform upgrades.
- During scheduled internal security assessments.

---

## 21. Docker-based API scan

Example for an OpenAPI-defined API:

```bash
docker run --rm \
  -v "$(pwd):/zap/wrk/:rw" \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py \
  -t https://security-test.example.internal/openapi.json \
  -f openapi \
  -r zap-api-report.html
```

Supported formats include:

- `openapi`
- `soap`
- `graphql`

The API scan performs active testing unless safe mode is specifically selected.

---

## 22. Suggested release security gates

The following internal release gates are recommended:

| Gate | Criteria |
|------|----------|
| **Gate 1 — Scope and environment** | Written authorization completed; Test environment confirmed; Backup completed; Test accounts available. |
| **Gate 2 — Coverage** | Main application workflows explored; All relevant roles tested; API definitions imported; Traditional or Client Spider completed; Passive scanning completed. |
| **Gate 3 — Findings** | No unresolved Critical findings; No unresolved High findings; Medium findings corrected or formally accepted; False positives documented; Business logic tests completed. |
| **Gate 4 — Retest** | Critical and High fixes independently retested; Regression testing completed; Final report approved; Residual risk accepted by the application owner. |

---

## 23. Developer assessment checklist

### Preparation

- [ ] Written authorization obtained.
- [ ] Approved environment confirmed.
- [ ] Scope documented.
- [ ] Database backup completed.
- [ ] Synthetic data prepared.
- [ ] Test accounts created for every role.
- [ ] External integrations placed in sandbox mode.
- [ ] Monitoring enabled.
- [ ] Emergency contacts identified.

### ZAP configuration

- [ ] Current ZAP release installed.
- [ ] Add-ons updated.
- [ ] Application context created.
- [ ] Context marked in scope.
- [ ] Production and third-party domains excluded.
- [ ] Authentication configured.
- [ ] Logged-in and logged-out indicators tested.
- [ ] ZAP users configured by role.

### Application coverage

- [ ] Public pages explored.
- [ ] Normal-user functions explored.
- [ ] Administrative functions explored.
- [ ] Traditional Spider completed.
- [ ] Client Spider completed for modern application routes.
- [ ] API definitions imported.
- [ ] Passive scan queue completed.
- [ ] Active scan completed in the approved environment.

### Manual testing

- [ ] Authentication tested.
- [ ] Password reset tested.
- [ ] Authorization tested between users.
- [ ] Authorization tested between roles.
- [ ] Tenant or department separation tested.
- [ ] Session invalidation tested.
- [ ] CSRF protection tested.
- [ ] File upload tested.
- [ ] Error handling tested.
- [ ] Sensitive data exposure tested.
- [ ] Business logic tested.
- [ ] Rate limiting tested.
- [ ] API authorization tested.

### Reporting and closure

- [ ] Alerts manually validated.
- [ ] False positives documented.
- [ ] Findings assigned to owners.
- [ ] Remediation dates agreed.
- [ ] Critical and High findings corrected.
- [ ] Retesting completed.
- [ ] Final report approved.
- [ ] Evidence stored in a restricted location.
- [ ] Lessons learned included in development standards.

---

## 24. Recommended testing frequency

Conduct the assessment:

- Before the first production release.
- Before every major release.
- After material authentication or authorization changes.
- After significant API changes.
- After major framework or dependency upgrades.
- After a security incident.
- After major infrastructure changes.
- At least annually for internally used applications.
- More frequently for applications processing sensitive or financial information.

Passive baseline scans should be incorporated into the normal CI/CD process. Full authenticated active assessments should be performed at controlled release points.

---

## 25. Final assessment deliverables

The development team shall produce:

1. Approved scope and rules-of-engagement record.
2. Application architecture and role summary.
3. ZAP session file where appropriate.
4. ZAP HTML report.
5. Manual testing checklist.
6. Confirmed vulnerability report.
7. Remediation register.
8. Risk-acceptance records.
9. Retest evidence.
10. Final assessment sign-off.

---

## References

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP ASVS](https://owasp.org/www-project-application-verification-standard/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST SP 800-53](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [OWASP ZAP Security Assessment — OVDS](OWASP-ZAP-ASSESSMENT.md)
- [OVDS Security Testing Guide](../security-testing-guide.md)
- [OVDS Security Testing Checklist](../../scripts/security-testing-checklist.md)
- [ZAP Setup and Scripts](../../scripts/zap-setup.md)
- [Remediation Register](../../scripts/remediation-register.md)

---

## Conclusion

OWASP ZAP provides a practical, fully free platform for internal dynamic security testing. The strongest results will come from combining authenticated ZAP scanning with role-based authorization tests, API testing, business logic review and verification against OWASP WSTG and ASVS.

A successful assessment is not measured by the number of alerts generated. It is measured by whether the team has achieved adequate coverage, validated the findings, corrected significant vulnerabilities and demonstrated that the security controls operate effectively.