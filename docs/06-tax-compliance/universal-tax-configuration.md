<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Universal Tax Configuration — Ethiopian ERP Blueprint

## Architecture Overview

The Universal Tax Configuration is the single source of truth for every tax calculation, GL posting, filing deadline, RBAC permission check, and IAS 12 treatment across **all industries** operating in Ethiopia.

```
packages/shared/src/ovds/universal-tax-config.ts   ← shared types + pure functions
apps/backend/src/ovds/tax/universal-tax-config.service.ts  ← tenant-scoped runtime
packages/database/migrations/universal_tax_config.sql  ← DB schema + seed data
```

---

## Legal Authority Hierarchy

| Level | Authority |
|-------|-----------|
| 1 | Federal Constitution of Ethiopia (1995) |
| 2 | Commercial Code Proc. 1243/2021 |
| 3 | Federal Tax Proclamations (979/2016, 1186/2020, 1341/2024, 1395/2025) |
| 4 | Council of Ministers Regulations (Reg. 570/2025) |
| 5 | MoR Directives (etax.mor.gov.et, TASS, ECC) |
| 6 | IFRS / IAS Standards (AABE adoption) |

---

## Tax Type Registry (All Industries)

| Code | Name | Rate | IAS 12 | IFRS 18 | Frequency | Portal |
|------|------|------|--------|---------|-----------|--------|
| VAT | Value Added Tax | 15% | NOT_INCOME_TAX | OPERATING | Monthly | eTax |
| TOT | Turnover Tax | 2% goods / 10% services | NOT_INCOME_TAX | OPERATING | Monthly | eTax |
| BIT | Business Income Tax | 30% (MAT 2.5%) | CURRENT_TAX | INCOME_TAX | Annual | eTax |
| PIT | Personal Income Tax / PAYE | 0–35% progressive | CURRENT_TAX | INCOME_TAX | Monthly | eTax |
| WHT_GOODS | WHT on Goods ≥ ETB 10K | 2% | NOT_INCOME_TAX | OPERATING | Monthly | eTax |
| WHT_SERVICES | WHT on Services ≥ ETB 500 | 2% | NOT_INCOME_TAX | OPERATING | Monthly | eTax |
| WHT_NR | WHT Non-Resident Services | 15% | NOT_INCOME_TAX | OPERATING | Monthly | eTax |
| WHT_RENT | WHT on Corporate Rent | 30% | NOT_INCOME_TAX | OPERATING | Monthly | eTax |
| WHT_DIVIDEND | Dividend WHT | 15% | NOT_INCOME_TAX | FINANCING | At Transaction | eTax |
| WHT_INTEREST | Interest WHT | 10% | NOT_INCOME_TAX | FINANCING | At Transaction | eTax |
| DRRF | Disaster Risk Response Fund | 1% / 5% | NOT_INCOME_TAX | OPERATING | Quarterly | eTax |
| PENSION_EE | Employee Pension (PFSA) | 7% | NOT_INCOME_TAX | OPERATING | Monthly | PFSA |
| PENSION_ER | Employer Pension (PFSA) | 11% | NOT_INCOME_TAX | OPERATING | Monthly | PFSA |
| EXCISE | Excise Tax | Variable | NOT_INCOME_TAX | OPERATING | Monthly | eTax |
| STAMP_DUTY | Stamp Duty | 1% (min ETB 500) | NOT_INCOME_TAX | OPERATING | At Transaction | eTax |
| PROPERTY_TAX | Property Tax | 1% assessed value | NOT_INCOME_TAX | OPERATING | Annual | Municipality |
| CUSTOMS_DUTY | Customs Duty | 0–35% CIF | NOT_INCOME_TAX | OPERATING | At Clearance | Customs |
| IMPORT_SURTAX | Import Surtax | 10% of (CIF+duty+excise) | NOT_INCOME_TAX | OPERATING | At Clearance | Customs |
| ADVANCE_BIT | Advance BIT on Imports | 3% CIF | CURRENT_TAX | INCOME_TAX | At Clearance | Customs |
| CAPITAL_GAINS | Capital Gains Tax | 15% | CURRENT_TAX | INCOME_TAX | At Transaction | eTax |
| SCHEDULE_D | Schedule D Other Income | 5–20% | CURRENT_TAX | INCOME_TAX | At Transaction | eTax |

---

## IAS 12 Classification Rules

```
CURRENT_TAX    → BIT, PIT, Advance BIT, Capital Gains, Schedule D
                 Dr Income Tax Expense (8100) / Cr Income Tax Payable (2160)

DEFERRED_TAX   → IAS 12 temporary differences (PPE pool vs. IFRS NBV, ECL provisions)
                 Dr Deferred Tax Asset (1133) / Cr Deferred Tax Liability (2175)

NOT_INCOME_TAX → VAT, TOT, WHT, DRRF, Pension, Excise, Stamp Duty, Property Tax,
                 Customs — these are operating costs or balance-sheet liabilities,
                 NOT income tax under IAS 12.2
```

### Key IAS 12 Deferred Tax Triggers

| Trigger | Difference Type | Effect |
|---------|-----------------|--------|
| PPE: IFRS NBV > Ethiopian pool balance | Taxable | Deferred Tax Liability |
| PPE: IFRS NBV < Ethiopian pool balance | Deductible | Deferred Tax Asset |
| ECL provision (IFRS 9) | Deductible (only deductible when legally exhausted) | Deferred Tax Asset |
| Gratuity accrual (IAS 19) | Deductible | Deferred Tax Asset |
| Advance BIT at customs | Current tax prepaid | Asset (1132) |

### Ethiopian Pool Depreciation Rates (Proc. 979/2016 Art. 25)

| Category | Assets | Tax Rate |
|----------|--------|----------|
| CAT 1 | Computers, software, vehicles | 25% declining balance |
| CAT 2 | Plant & machinery | 20% declining balance |
| CAT 3 | Buildings used in business | 15% declining balance |
| CAT 4 | Other fixed assets | 10% declining balance |

---

## AABE Reporting Framework Tiers

| Tier | Applies To | Turnover | Audit |
|------|-----------|----------|-------|
| FULL_IFRS | Public Interest Entities (banks, insurers, listed) | N/A — regulated | Mandatory |
| IFRS_FOR_SMES | Private companies | ≥ ETB 5M | Mandatory |
| EFRS_SMALL | Small private companies | ETB 500K–5M | Review |
| EFRS_MICRO | Micro/sole traders | < ETB 500K | None |

---

## VAT / TOT Band Determination

```
Annual turnover ≥ ETB 2,000,000  →  Band A (VAT registered)
Annual turnover ETB 500K – 2M   →  Band B (TOT — 2% goods, 10% services)
Annual turnover < ETB 500K       →  Band C (TOT — same rates)

VAT and TOT are MUTUALLY EXCLUSIVE — never both active.
```

---

## BIT / MAT Determination

```
Income Tax Schedule A  →  Turnover > ETB 1,000,000  →  30% flat on taxable profit
Income Tax Schedule B  →  Turnover ETB 500K–1M       →  30% flat (or MAT)
Income Tax Schedule C  →  Turnover < ETB 500K         →  Progressive brackets (like PIT)

MAT = 2.5% of gross annual turnover
Final tax = max(regular BIT, MAT)
Filing deadline: November 7 (4 months after EFY end July 7)
```

---

## RBAC Permission Matrix (Tax Operations)

| Action | Min Role | Description |
|--------|----------|-------------|
| view | AUDITOR (level 30) | Read-only access to all tax reports |
| calculate | ACCOUNTING (level 55) | Run tax calculations |
| create_draft | ACCOUNTING (level 55) | Create DRAFT filings |
| submit | ovds (level 60) | Submit to MoR eTax portal |
| approve | ovds (level 60) | Approve before eTax submission |
| pay | ovds (level 60) | Mark filings as paid |
| amend | ADMIN (level 100) | Amend filed returns |
| override_rate | SUPERADMIN (level 190) | Override a rate (audit trail mandatory) |
| configure | ADMIN (level 100) | Update company tax profile |
| export | AUDITOR (level 30) | Export to PDF/CSV |

---

## API Endpoints (Universal Config)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /ovds/tax/universal/rules | vat:read | All canonical tax rules |
| GET | /ovds/tax/universal/rules/sector/:sector | vat:read | Rules with sector exemptions |
| GET | /ovds/tax/universal/profile | vat:read | Company tax profile |
| PATCH | /ovds/tax/universal/profile | settings:write | Update profile (ADMIN) |
| GET | /ovds/tax/universal/compliance-health | vat:read | Full compliance health check |
| GET | /ovds/tax/universal/deadlines | vat:read | Upcoming deadlines (90 days) |
| POST | /ovds/tax/universal/resolve | vat:write | Rule engine — resolve taxes for transaction |

---

## Sector Exemptions

| Sector | Exempt Taxes | Authority |
|--------|-------------|-----------|
| AGRICULTURE | VAT, EXCISE, IMPORT_SURTAX | Proc. 1341/2024 Sch. 2; Proc. 1186/2020 |
| FINANCIAL_SERVICES | VAT, TOT | Proc. 1341/2024 Sch. 1 |
| EDUCATION | VAT, TOT | Proc. 1341/2024 Sch. 1 |
| HEALTHCARE | VAT | Proc. 1341/2024 Sch. 1 |
| NGO_NONPROFIT | BIT (charitable activities) | Proc. 979/2016 Art. 8 |
| MANUFACTURING | IMPORT_SURTAX (capital goods) | Investment Proc. 1180/2020 |
| GOVERNMENT | VAT, BIT | Proc. 979/2016 Art. 8 |

All other sectors: **full universal rates apply.**

---

## GL Account Map (Tax Entries)

| Code | Name | Type | IAS 12 |
|------|------|------|--------|
| 1130 | VAT Receivable (Input VAT) | Asset | — |
| 1131 | WHT Receivable | Asset | — |
| 1132 | Advance BIT Prepaid | Asset | CURRENT_TAX |
| 1133 | Deferred Tax Asset | Asset | DEFERRED_TAX |
| 2150 | VAT Payable (Output VAT) | Liability | — |
| 2160 | Income Tax Payable (BIT) | Liability | CURRENT_TAX |
| 2161 | PAYE / PIT Payable | Liability | CURRENT_TAX |
| 2162 | WHT Payable to MoR | Liability | — |
| 2163 | DRRF Levy Payable | Liability | — |
| 2164–2165 | Pension Payable (EE/ER) | Liability | — |
| 2175 | Deferred Tax Liability | Liability | DEFERRED_TAX |
| 8100 | Income Tax Expense — Current | Expense | CURRENT_TAX |
| 8105 | Income Tax Expense — Deferred | Expense | DEFERRED_TAX |

---

## Run Order (Setup)

```bash
# 1. Apply migrations (MySQL)
mysql -u root -p usc_db < packages/database/migrations/gap_fix_tax_settings.sql
mysql -u root -p usc_db < packages/database/migrations/universal_tax_config.sql

# 2. The UniversalTaxConfigService.ensureSystemSettings() runs automatically
#    on application startup via the TaxModule bootstrap.

# 3. Per-company profiles are created lazily on first GET /ovds/tax/universal/profile
#    or explicitly via PATCH /ovds/tax/universal/profile
```



