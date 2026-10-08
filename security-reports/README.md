# OVDS Security Reports

This directory holds the output of every scan, manual test, and snapshot
produced by the ZAP-based security assessment pipeline. All files are
**regenerated artifacts** and are excluded from VCS via `.gitignore`.

> **Confidentiality**: scan reports contain authenticated attack payloads,
> false-positive rationale, and (in HTML reports) full request/response
> evidence. Treat as `Confidential — Internal`.

## File inventory

| File                          | Producer                                                | Format | Description |
|-------------------------------|---------------------------------------------------------|--------|-------------|
| `zap-baseline-report.html`    | `scripts/zap-baseline.{ps1,sh}`                         | HTML   | Passive scan + spider of the public surface. |
| `zap-baseline-report.json`    | same                                                    | JSON   | Machine-readable baseline results. |
| `zap-full-scan-report.html`   | `scripts/zap-full-scan.{ps1,sh}`                        | HTML   | Active scan with attack payloads. |
| `zap-api-report.html`         | `scripts/zap-api-scan.{ps1,sh}`                         | HTML   | API scan driven by `ovds-api-scan.yaml`. |
| `zap-authenticated-report.*`  | `scripts/zap-authenticated-scan.{ps1,sh}`               | HTML/JSON | Authenticated active scan. |
| `zap-test-authentication.json`  | `scripts/zap-test-authentication.{ps1,sh}`            | JSON   | §13.1 manual test evidence. |
| `zap-test-authorization.json`   | `scripts/zap-test-authorization.{ps1,sh}`             | JSON   | §13.2 IDOR/role escalation. |
| `zap-test-session.json`         | `scripts/zap-test-session.{ps1,sh}`                  | JSON   | §13.3 cookies/JWT/logout. |
| `zap-test-input-validation.json` | `scripts/zap-test-input-validation.{ps1,sh}`        | JSON   | §13.4 SQLi/XSS/path-traversal. |
| `zap-test-misc.json`            | `scripts/zap-test-misc.{ps1,sh}`                    | JSON   | §13.5/13.6/13.8 upload/errors/business logic. |
| `zap-test-rate-limit.json`      | `scripts/zap-test-rate-limit.{ps1,sh}`              | JSON   | §13.9 brute force / throttling. |
| `phase6-manual-tests.json`      | `scripts/zap-test-manual-all.{ps1,sh}`              | JSON   | Aggregated Phase 6 evidence. |
| `secret-scan.sarif.json`        | `scripts/scan-secrets.sh --format sarif`             | SARIF  | Secret scan (uploaded to GitHub Code Scanning). |
| `secret-scan.json`              | `scripts/scan-secrets.sh --format json`              | JSON   | Same findings, JSON form. |
| `status.json`                   | `scripts/security-status-snapshot.mjs`               | JSON   | Aggregated status snapshot (counts, per-suite outcomes). |
| `status.md`                     | same                                                    | Markdown | Human-readable status snapshot. |
| `retest-evidence.json`          | `scripts/zap-retest.{ps1,sh}`                        | JSON   | Per-finding verdict + log path. |
| `openapi-verification.json`     | `scripts/zap-verify-openapi.{ps1,sh}`                | JSON   | Pre-flight OpenAPI spec checks. |
| `findings.md`                   | `scripts/zap-export-findings.mjs`                    | Markdown | Redacted remediation register. |
| `report-diff.json`              | `scripts/zap-report-diff.mjs`                        | JSON   | Baseline vs current diff. |
| `report-diff.md`                | same                                                    | Markdown | Human-readable diff. |
| `*.log`                          | various                                               | text   | Raw scan/console output. |

## How to regenerate

| Goal                                                | Command (from repo root) |
|-----------------------------------------------------|--------------------------|
| Run the entire assessment                            | `pnpm run security:zap:all` |
| Phase 1 — manual exploration helper                  | `pnpm run security:zap:explore` |
| Phase 2/3/4 — baseline crawl + passive               | `pnpm run security:zap:baseline` |
| Phase 3 — authenticated scan (active)                | `pnpm run security:zap:auth` |
| Phase 4 — full active scan                           | `pnpm run security:zap:full` |
| Phase 5 — API scan                                   | `pnpm run security:zap:api` |
| Phase 5 — OpenAPI pre-flight                         | `pnpm run security:zap:openapi-check` |
| Phase 6 — all manual suites                          | `pnpm run security:zap:manual` |
| Phase 6 — single suite (e.g. auth)                   | `pnpm run security:zap:manual:auth` |
| Secret scan                                          | `pnpm run security:scan:secrets` |
| Governance / config check                            | `pnpm run security:zap:validate` and `pnpm run security:policy-check` |
| Status snapshot                                      | `pnpm run security:zap:snapshot` |
| Diff vs baseline                                     | `pnpm run security:zap:report-diff -- --baseline path/to/baseline.json` |
| Export redacted findings to Markdown                 | `pnpm run security:zap:export-findings` |
| Retest (§18)                                         | `pnpm run security:zap:retest -- --findings security-reports/retest-input.json` |

## Re-seeding ZAP users

```bash
pnpm run security:zap:seed     # populates the test users in MySQL
bash scripts/zap-init-session.sh   # imports context + policy + users into ZAP via API
```

## Retention

- HTML/JSON scan reports: 30 days in CI artifacts, 7 years in the long-term
  evidence archive (managed by the Security team).
- `status.json` / `status.md`: every CI run, retained 30 days.
- `secret-scan.sarif.json`: 90 days; alerts in GitHub Code Scanning are
  permanent until dismissed.
- `retest-evidence.json`: kept for the lifetime of the parent finding.
