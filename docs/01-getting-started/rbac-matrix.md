<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# RBAC Matrix — Roles, Permissions & Access Control

> **Part of:** [Getting Started](./README.md)
>
> **Permissions:** Defined in [`CORE-CONFIG.md`](./../CORE-CONFIG.md#7-rbac-permission-matrix)
>
> **Lifecycle use:** RBAC gates each [Digital Automated Filing Lifecycle](./../FILING-LIFECYCLE.md) phase — see [`CORE-CONFIG.md`](./../CORE-CONFIG.md#3-digital-automated-filing-lifecycle-summary) for phase-to-permission mapping.

## RBAC Permission Matrix

| Action | Min Role | Permission Key | Description |
|--------|----------|----------------|-------------|
| View tax reports | AUDITOR (30) | `vat:read` | Read-only tax data |
| Calculate taxes | ACCOUNTING (55) | `vat:calculate` | Run tax calculations |
| Create draft filings | ACCOUNTING (55) | `vat:write` | Create DRAFT filings |
| Submit to e-Tax | ovds (60) | `vat:file` | Submit to MoR eTax portal |
| Approve before submission | ovds (60) | `vat:approve` | Approve filing before eTax |
| Configure company tax | ADMIN (100) | `settings:write` | Update company tax profile |
| Export reports | AUDITOR (30) | `vat:export` | Export to PDF/CSV |

## Role Hierarchy (by weight)

| Role | Weight |
|------|--------|
| SPURADMIN | 200 |
| SUPERADMIN | 190 |
| DEVELOPER | 150 |
| ADMIN | 100 |
| PROJECT_MANAGER | 80 |
| ovds | 60 |
| ACCOUNTING | 55 |
| IFRS_OFFICER | 52 |
| HR | 50 |
| AUDITOR | 30 |
| EXTERNAL_AUDITOR | 28 |
| BANK_LIAISON | 25 |
| PARTNER | 20 |
| EMPLOYEE | 10 |
| DATA_CLERK | 8 |
| CLIENT | 5 |

## Related Topics

> **Lifecycle mapping:** RBAC enforces phase-level gates:
> - **Phase 1 (Data Capture):** `invoices:write`, `bills:write`, `payroll:read` — roles: EMPLOYEE, ACCOUNTING
> - **Phase 2 (Tax Calculation):** `vat:calculate`, `vat:write` — role: ACCOUNTING (55)+
> - **Phase 3 (Analysis):** `reports:read`, `vat:read` — role: AUDITOR (30)+
> - **Phase 4 (V&V):** `vat:approve` — role: ovds (60)+
> - **Phase 5 (e-Tax Submission):** `vat:file`, `vat:pay` — role: ovds (60)+
> - **Phase 6 (Compliance Scoring):** `ifrs:read`, `audit:read` — role: IFRS_OFFICER (70)+
>
> All permission keys are defined in [`CORE-CONFIG.md`](./../CORE-CONFIG.md#7-rbac-permission-matrix).


