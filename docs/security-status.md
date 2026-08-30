# Security Status

![Security Scan](https://github.com/ovds/ovds/actions/workflows/zap-security-scan.yml/badge.svg)

This badge shows the status of the latest OWASP ZAP security scan.

## Scan Schedule

- **Baseline scans:** On every push and pull request to `main` and `develop` branches
- **Full scans:** Weekly on Monday at 2 AM UTC, or manually triggered
- **On-demand:** Use the workflow dispatch option in GitHub Actions

## How to Trigger a Scan

1. Go to the [Actions tab](https://github.com/ovds/ovds/actions)
2. Select "OWASP ZAP Security Scan" workflow
3. Click "Run workflow"
4. Select:
   - **Target URL:** The URL to scan (e.g., `http://localhost:3000`)
   - **Scan Type:** `baseline` (passive) or `full` (active with payloads)
   - **Fail Threshold:** `low`, `medium`, `high`, or `critical`

## Security Gates

| Gate | Requirement | Status |
|------|-------------|--------|
| 1 | Setup & Authorization | ✅ |
| 2 | Build & Deploy | ✅ |
| 3 | ZAP Scan | ✅ |
| 4 | Retest & Sign-off | ✅ |

## Latest Scan Results

Check the [Actions tab](https://github.com/ovds/ovds/actions) for the latest scan results and artifacts.

## Security Policy

For security issues, please email security@ovds.com.et or use the [security policy](https://github.com/ovds/ovds/security/policy).
