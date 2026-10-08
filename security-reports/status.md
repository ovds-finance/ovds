# Security Assessment Status

_Generated: 2026-09-07T03:46:10.107Z_

## ZAP Automated Scans

| Scan | File | Critical | High | Medium | Low | Info |
|------|------|---------:|-----:|-------:|----:|-----:|
| baseline | `security-reports\zap-baseline-report.json` | `0` | 🟠 `1` | `0` | `0` | `0` |

**Total ZAP findings:** 1

## Phase 6 Manual Suites

| Suite | File | Total | Passed | Failed |
|-------|------|------:|------:|------:|
| phase6-zap-test-input-validation | `security-reports\phase6-zap-test-input-validation.json` | 2 | 1 | 1 |

## How to Update

```bash
pwsh scripts/zap-test-manual-all.ps1     # Phase 6 manual tests
node scripts/zap-export-findings.mjs --report security-reports/zap-baseline-report.json --output security-reports/findings.md
node scripts/security-status-snapshot.mjs
```