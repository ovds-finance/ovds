<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](./CORE-CONFIG.md)
     📌 FILING LIFECYCLE: [docs/FILING-LIFECYCLE.md](./FILING-LIFECYCLE.md)
     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](./subscription%20and%20monitaizetion.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](./UBIQUITOUS-LANGUAGE.md)
     🔄 Last synced: 2026-08-27 -->

# 📌 OVDS Core Configuration & Terminology Reference

> **Canonical source for standardized terminology, data-flow links, authority hierarchy, RBAC permissions, GL account mappings, and the Digital Automated Filing Lifecycle.**
>
> Every documentation file in the OVDS knowledge base includes a dynamic reference block pointing to this file and to [`FILING-LIFECYCLE.md`](./FILING-LIFECYCLE.md). Update this file when terminology, rates, deadlines, or links change — all connected docs inherit the change automatically via the reference anchor pattern.

```
📌 CORE CONFIG → docs/CORE-CONFIG.md        (this file — centralized references)
📌 FILING LIFECYCLE → docs/FILING-LIFECYCLE.md (automated tax filing lifecycle)
📌 UBIQUITOUS LANGUAGE → docs/UBIQUITOUS-LANGUAGE.md (canonical terminology standard)
```

---

## Table of Contents

1. [Terminology Registry](#1-terminology-registry)
2. [Authority Hierarchy](#2-authority-hierarchy)
3. [Digital Automated Filing Lifecycle (Summary)](#3-digital-automated-filing-lifecycle-summary)
4. [Data-Flow Links (End-to-End)](#4-data-flow-links-end-to-end)
5. [RBAC Permission Matrix](#5-rbac-permission-matrix)
6. [GL Account Map](#6-gl-account-map)
7. [Tax Rate & Deadline Summary](#7-tax-rate--deadline-summary)
   - [7.1 PIT Brackets (Proc. 1395/2025)](#pit-brackets--proclamation-13952025-effective-july-7-2025)
   - [7.2 Taxpayer Categories](#taxpayer-categories)
8. [Portal & URL Registry](#8-portal--url-registry)
9. [Reference Block Convention](#9-reference-block-convention)
10. [Tech Stack Reference](#10-tech-stack-reference)

---

## 1. Terminology Registry

Canonical terms used consistently across all OVDS documentation. When documenting, always use the **Preferred Term** and never substitute without updating this registry.

| Term | Preferred Term | Definitions / Notes |
|------|---------------|---------------------|
| ERCA | **ERCA / MoR** | Ethiopian Revenue & Customs Authority — restructured under the Ministry of Revenue (MoR) by Proclamation 1097/2018. The brand "ERCA" remains in common use; official body is MoR. Parent body of e-Tax. |
| e-Tax | **e-Tax** | MoR's online tax portal at `etax.erca.gov.et` — for VAT, TOT, WHT, BIT, DRRF, PIT, Pension filing and payment. |
| TIN | **TIN** | Taxpayer Identification Number — **15-digit** Ethiopian format. Required on all B2B invoices and ERCA QR codes. |
| FS No. | **Fiscal Sales Register Number** | The FSR identifier assigned by ERCA to each business. Required on tax invoices. |
| VAT | **Value Added Tax (VAT)** | 15% standard rate under Proclamation 1341/2024. Applies to Category A taxpayers (turnover ≥ ETB 2,000,000/yr). |
| TOT | **Turnover Tax (TOT)** | 2% (goods/construction) / 10% (services) for Category B & C taxpayers (annual turnover < ETB 1,000,000). Category C applies below ETB 500,000. |
| BIT | **Business Income Tax (BIT)** | 30% flat rate on net taxable profit; or MAT at 2.5% of annual turnover — whichever is higher. |
| WHT | **Withholding Tax (WHT)** | Tax deducted at source by the payer and remitted to ERCA. Types: Services (3%, ≥ETB 500), Goods (3%, ≥ETB 10K), Imports (3%), Non-Resident (15%), Corporate Rent (30%), Dividend (15%), Interest (10%/30% for FIs), Royalties (5%–10%). |
| PIT | **Personal Income Tax (PIT)** | 0–35% progressive brackets under Proclamation 1395/2025, Schedule A (effective July 7, 2025). Tax-free threshold raised to ETB 2,000/month; 6 brackets up to 35% above ETB 14,000/month. Applied via payroll (PAYE). |
| PAYE | **Pay As You Earn (PAYE)** | The monthly PIT deduction mechanism through payroll. |
| DRRF | **Disaster Risk Reduction Fund (DRRF)** | 1% levy per Regulation 570/2025 on eligible transactions. Filed quarterly. |
| MAT | **Minimum Alternative Tax (MAT)** | 2.5% of annual gross turnover — floor on BIT liability. |
| Pension | **Pension (PFSA)** | Employee 7% + Employer 11%, capped at ETB 15,000 insurable earnings/month. Filed monthly. |
| QSR | **Quarterly Submission Return** | The consolidated submission window (VAT, TOT, WHT) — due 30th of the following month. |
| NBE | **National Bank of Ethiopia** | Central bank; publishes official FX rates and the NBE-IQR QR code standard. |
| AABE | **Accounting & Audit Board of Ethiopia** | IFRS adoption authority; enforces Proclamation 847/2014. |
| QR Code | **ERCA QR Code / NBE-IQR** | Mandatory machine-readable QR on all fiscal invoices containing TIN, FS No., date, total, VAT, and SHA-256 hash. |
| V&V | **Verification & Validation (V&V)** | Pre-submission checks that validate tax calculations before filing. See `FILING-LIFECYCLE.md` Phase 4. |
| Audit Trail | **Immutable Audit Log** | Append-only log of all user actions, tax filings, and system events. Retention: ≥ 10 years (Proc. 983/2016). |
| Tax Period | **Tax Period** | The active filing duration (monthly, quarterly, or annual). Governs VAT, TOT, WHT, and BIT submission windows. |
| VAT Return | **VAT Return** | The core aggregate for assembled VAT calculations. Contains output VAT, input VAT, net payable, and line items. |
| Line Item | **Line Item** | Individual ledger or invoice entries contributing to VAT. Each line item records net amount, VAT amount, rate category, and deductibility. |
| E-Filing Status | **E-Filing Status** | The receipt and status of transmission to the government portal. Tracks submission timestamp, confirmation number, and acknowledgment state. |
| Tax Filing | **Tax Filing** | The master record for any tax submission (VAT, TOT, WHT, BIT, DRRF). Tracks status, period, computed amounts, and payment reference. |
| Compliance Score | **Compliance Score** | Real-time 0–100 score reflecting filing timeliness, calculation accuracy, and audit readiness. |
| Period Lock | **Compliance Sign-Off (Period Lock)** | Locking a reporting period to prevent retroactive changes. Requires reversal entries in the next open period. |
| Canonical Ledger | **Canonical IFRS Ledger** | The single source-of-truth journal. Peachtree and SIGTAX views are read-time projections. |
| Three-Engine Reconciliation | **Three-Engine Reconciliation** | Peachtree / US GAAP + SIGTAX / e-Tax + IFRS / AABE — reconciled from one canonical ledger. |
| Company Scope | **Company-Scoped (company_id)** | Every query, invoice, journal, and filing is bound to a `companyId` — enforced by `CompanyGuard`. |

---

## 2. Authority Hierarchy

| Level | Authority | Scope | Linked Doc |
|-------|-----------|-------|------------|
| 1 | Federal Constitution of Ethiopia (1995) | Supreme law | [ethiopian-regulatory-reference.md](./10-frameworks/ethiopian-regulatory-reference.md) |
| 2 | Commercial Code — Proclamation 1243/2021 | Business law foundation | [ethiopian-regulatory-reference.md](./10-frameworks/ethiopian-regulatory-reference.md) |
| 3 | Federal Tax Proclamations | Tax obligations — 979/2016, 1186/2020, 1341/2024, 1395/2025 | [ethiopian-regulatory-reference.md](./10-frameworks/ethiopian-regulatory-reference.md), [universal-tax-configuration.md](./06-tax-compliance/universal-tax-configuration.md) |
| 4 | Council of Ministers Regulations | Implementation — Regulation 570/2025 (DRRF) | [ethiopian-regulatory-reference.md](./10-frameworks/ethiopian-regulatory-reference.md) |
| 5 | MoR Directives | Operational — eTax.mor.gov.et, TASS, ECC | [ethiopian-regulatory-reference.md](./10-frameworks/ethiopian-regulatory-reference.md) |
| 6 | AABE IFRS Directive | Financial reporting — tiers, deadlines | [ethiopian-regulatory-reference.md](./10-frameworks/ethiopian-regulatory-reference.md), [ifrs-and-audit.md](./06-tax-compliance/ifrs-and-audit.md) |

---

## 3. Digital Automated Filing Lifecycle (Summary)

The **Digital Automated Filing Lifecycle** is the end-to-end pipeline that transforms source transactions into MoR-compliant submissions. It is defined in full in [`FILING-LIFECYCLE.md`](./FILING-LIFECYCLE.md). Here is the high-level flow:

```
┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────────┐
│ Phase 1 │ → │ Phase 2  │ → │ Phase 3  │ → │ Phase 4  │ → │ Phase 5  │ → │ Phase 6    │
│ Data    │   │ Tax      │   │ Analysis │   │ V&V      │   │ e-Tax &  │   │ Compliance │
│ Capture │   │ Calc     │   │ Review   │   │ Check    │   │ Pay      │   │ Scoring    │
└─────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └────────────┘
```

| Phase | Stage | What Happens | Cron / Trigger | Key Document |
|-------|-------|-------------|----------------|--------------|
| 1 | Data Capture | Invoices, bills, IoT sales, payroll posted to canonical ledger | Real-time on transaction | [creating-an-invoice.md](./04-financial-ops/creating-an-invoice.md), [creating-a-bill.md](./04-financial-ops/creating-a-bill.md) |
| 2 | Tax Calculation | VAT/WHT/DRRF/BIT/PAYE computed from ledger events | `cronVatAutoCompute` (1st of month), `cronTotAutoCompute` (1st of month) | [vat-and-tot.md](./06-tax-compliance/vat-and-tot.md), [universal-tax-configuration.md](./06-tax-compliance/universal-tax-configuration.md) |
| 3 | Analysis | Tax liability estimator, reports generated | Real-time (TanStack Query) | [tax-reports.md](./07-reports/tax-reports.md), [financial-reports.md](./07-reports/financial-reports.md) |
| 4 | V&V Check | Pre-submission validation runs | On submission click | [automation-and-vv.md](./10-frameworks/automation-and-vv.md) |
| 5 | e-Tax & Pay | Submission to eTax portal + bank payment | User-action (requires `vat:file`) | [vat-and-tot.md](./06-tax-compliance/vat-and-tot.md#step-4), [bit-and-drrf.md](./06-tax-compliance/bit-and-drrf.md) |
| 6 | Compliance Scoring | Audit trail updated, compliance score recalculated | `cronComplianceScore` (daily) | [ifrs-and-audit.md](./06-tax-compliance/ifrs-and-audit.md), [compliance-and-credibility.md](./08-advanced/compliance-and-credibility.md) |

**Full lifecycle spec:** See [`FILING-LIFECYCLE.md`](./FILING-LIFECYCLE.md)

---

## 4. Data-Flow Links (End-to-End)

### 4.1 Transaction → Ledger → Tax → Filing → MoR

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Source Document │ ──▶ │ Canonical Ledger│ ──▶ │ Tax Engine      │ ──▶ │ Filing Record   │ ──▶ │ e-Tax Portal    │
│ (Invoice/Bill/  │     │ (JournalEntry)  │     │ (VAT/WHT/BIT/   │     │ (Submission,    │     │ (etax.erca.gov. │
│ Payroll/IoT)    │     │                 │     │ DRRF/Pension)   │     │  Payment Ref)   │     │ et)             │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                         │                       │                       │
        │ posts via             │ tagged by source        │ aggregates            │ generates             │ manual or auto-
        │ auto-journal          │ + companyId             │ by companyId +        │ confirmation# +       │ mated via bridge
        │ entry                 │                         │ period                │ payment ref           │
```

### 4.2 Data-Flow Link Map

| Source Entity | Posts To | Triggers | Aggregated By | Filed As | Submitted Via |
|--------------|----------|----------|--------------|----------|--------------|
| `Invoice` (Sales) | `JournalEntry` (Revenue + Output VAT) | Output VAT auto-accrual | VAT Return | `vat:filed` event | `Submit to eTax` |
| `Bill` (Purchases) | `JournalEntry` (Expense + Input VAT) + WHT accrual | Input VAT + WHT auto-calc | VAT Return + WHT Return | `wht:filed` event | `Submit to eTax` |
| `Payroll Run` | `JournalEntry` (Salary Expense + PIT Payable + Pension Payable) | PAYE + Pension auto-calc | PIT + Pension Submission | `pit:filed`, `pension:submitted` events | eTax Portal / PFSA |
| `IoT / POS Sale` | `JournalEntry` (via IoT tax bridge) | VAT output auto-post | VAT Return | `vat:filed` event | `Submit to eTax` |
| `Foreign Currency Bill` | `JournalEntry` + FX Gain/Loss | Reverse-charge VAT flag | FX Revaluation | `fx:revalued` event | — (internal) |
| `Depreciation Entry` | `JournalEntry` (Depreciation Expense) | Monthly cron | — | `depreciation:posted` event | — (internal) |

### 4.3 Projection Layers

The canonical IFRS ledger fans out to three read-model projections:

```
[ Canonical IFRS Ledger ]
          │
          ├──► [ Peachtree Projection ]  — US GAAP adjustments, legacy mapping
          │
          ├──► [ SIGTAX / e-Tax Projection ] — tax-specific field extraction, XML schema
          │
          └──► [ IFRS Reporting Layer ]     — AABE-compliant statements, disclosures
```

- **Peachtree Projection** tables: `peachtree_projection_journal`
- **SIGTAX Projection** tables: `sigtax_projection_journal`
- **IFRS Reporting** tables: `ifrs_reporting_balance`

---

## 5. RBAC Permission Matrix

| Action | Min Role | Permission Key | Description |
|--------|----------|----------------|-------------|
| View tax reports | AUDITOR (30) | `vat:read` | Read-only tax data |
| Calculate taxes | ACCOUNTING (55) | `vat:calculate` | Run tax calculations |
| Create draft filings | ACCOUNTING (55) | `vat:write` | Create DRAFT filings |
| Submit to e-Tax | ovds (60) | `vat:file` | Submit to MoR eTax portal |
| Approve before submission | ovds (60) | `vat:approve` | Approve filing before eTax |
| Mark as paid | ovds (60) | `vat:pay` | Mark filings as paid |
| Amend filed returns | ADMIN (100) | `vat:amend` | Amend filed returns |
| Override tax rate | SUPERADMIN (190) | `vat:override` | Override a rate (audit trail mandatory) |
| Configure company tax | ADMIN (100) | `settings:write` | Update company tax profile |
| Export reports | AUDITOR (30) | `vat:export` | Export to PDF/CSV |
| Period lock | `period_close:admin` | — | Lock/unlock accounting periods |
| External auditor access | EXTERNAL_AUDITOR | — | Read-only + audit findings write |

**Role hierarchy (by weight):**

| Group | Role | Weight |
|-------|------|--------|
| System | SPURADMIN | 200 |
| System | SUPERADMIN | 190 |
| System | DEVELOPER | 150 |
| Operations | ADMIN | 100 |
| Operations | PROJECT_MANAGER | 80 |
| OVDS | OVDS | 60 |
| OVDS | ACCOUNTING | 55 |
| OVDS | IFRS_OFFICER | 52 |
| HR | HR | 50 |
| OVDS | AUDITOR | 30 |
| OVDS | EXTERNAL_AUDITOR | 28 |
| OVDS | BANK_LIAISON | 25 |
| OVDS | CRM | 25 |
| External | PARTNER | 20 |
| HR | EMPLOYEE | 10 |
| Operational | DATA_CLERK | 8 |
| External | CLIENT | 5 |

---

## 6. GL Account Map

| Code | Name | Type | IAS 12 Classification | Linked Doc |
|------|------|------|----------------------|------------|
| 1000–1099 | Cash & Bank | Current Asset | — | [accounting-knowledge-base.md](./10-frameworks/accounting-knowledge-base.md) |
| 1100–1199 | Trade Receivables | Current Asset | — | [accounting-knowledge-base.md](./10-frameworks/accounting-knowledge-base.md) |
| 1130 | VAT Receivable (Input VAT) | Current Asset | — | [vat-and-tot.md](./06-tax-compliance/vat-and-tot.md) |
| 1131 | WHT Receivable | Current Asset | — | [wht-and-other-taxes.md](./06-tax-compliance/wht-and-other-taxes.md) |
| 1132 | Advance BIT Prepaid | Current Asset | CURRENT_TAX | [universal-tax-configuration.md](./06-tax-compliance/universal-tax-configuration.md) |
| 1133 | Deferred Tax Asset | Non-current Asset | DEFERRED_TAX | [ifrs-and-audit.md](./06-tax-compliance/ifrs-and-audit.md) |
| 1200–1299 | Inventory (IAS 2) | Current Asset | — | [items-catalog.md](./04-financial-ops/items-catalog.md) |
| 1300–1399 | Prepaid Expenses | Current Asset | — | [accounting-knowledge-base.md](./10-frameworks/accounting-knowledge-base.md) |
| 1510–1519 | Accumulated Depreciation | Contra-Asset | — | [fixed-assets.md](./04-financial-ops/fixed-assets.md) |
| 1500–1599 | PPE / Property Plant & Equipment | Non-current Asset | — | [fixed-assets.md](./04-financial-ops/fixed-assets.md) |
| 1600–1699 | Right-of-Use Assets (IFRS 16) | Non-current Asset | — | [leases-ifrs16.md](./06-tax-compliance/leases-ifrs16.md) |
| 2000–2099 | Trade Payables | Current Liability | — | [creating-a-bill.md](./04-financial-ops/creating-a-bill.md) |
| 2150 | VAT Payable (Output VAT) | Current Liability | — | [vat-and-tot.md](./06-tax-compliance/vat-and-tot.md) |
| 2160 | Income Tax Payable (BIT) | Current Liability | CURRENT_TAX | [bit-and-drrf.md](./06-tax-compliance/bit-and-drrf.md) |
| 2161 | PAYE / PIT Payable | Current Liability | CURRENT_TAX | [hr-and-payroll.md](./08-advanced/hr-and-payroll.md) |
| 2162 | WHT Payable to MoR | Current Liability | — | [wht-and-other-taxes.md](./06-tax-compliance/wht-and-other-taxes.md) |
| 2163 | DRRF Payable | Current Liability | — | [bit-and-drrf.md](./06-tax-compliance/bit-and-drrf.md) |
| 2164–2165 | Pension Payable (EE/ER) | Current Liability | — | [bit-and-drrf.md](./06-tax-compliance/bit-and-drrf.md) |
| 2175 | Deferred Tax Liability | Non-current Liability | DEFERRED_TAX | [ifrs-and-audit.md](./06-tax-compliance/ifrs-and-audit.md), [accounting-knowledge-base.md](./10-frameworks/accounting-knowledge-base.md) |
| 3000–3099 | Share Capital | Equity | — | [company-and-tax.md](./03-settings/company-and-tax.md) |
| 3100–3199 | Retained Earnings | Equity | — | [month-end-and-year-end.md](./04-financial-ops/month-end-and-year-end.md) |
| 4000–4099 | Sales Revenue | Revenue | — | [creating-an-invoice.md](./04-financial-ops/creating-an-invoice.md) |
| 5000–5999 | Cost of Goods Sold | Expense | — | [items-catalog.md](./04-financial-ops/items-catalog.md) |
| 6000–6999 | Operating Expenses | Expense | — | [creating-a-bill.md](./04-financial-ops/creating-a-bill.md) |
| 61330 | Corporate Income Tax Provision | Expense | CURRENT_TAX | [bit-and-drrf.md](./06-tax-compliance/bit-and-drrf.md) |
| 8100–8199 | Income Tax Expense | Expense | CURRENT_TAX / DEFERRED_TAX | [ifrs-and-audit.md](./06-tax-compliance/ifrs-and-audit.md) |

---

## 7. Tax Rate & Deadline Summary

> For full detail, see [`ethiopian-regulatory-reference.md`](./10-frameworks/ethiopian-regulatory-reference.md) and [`universal-tax-configuration.md`](./06-tax-compliance/universal-tax-configuration.md).

| Tax | Rate | Basis | Filing Deadline | Filing Frequency | Permission |
|-----|------|-------|-----------------|------------------|------------|
| VAT | 15% | Output − Input | 30th of following month | Monthly | `vat:file` |
| TOT — Goods | 2% | Turnover | 30th of following month | Monthly | `vat:file` |
| TOT — Construction | 2% | Turnover | 30th of following month | Monthly | `vat:file` |
| TOT — Services | 10% | Turnover | 30th of following month | Monthly | `vat:file` |
| WHT — Services | 3% | ≥ ETB 500 | 30th of following month | Monthly | `vat:file` |
| WHT — Goods | 3% | ≥ ETB 10,000 | 30th of following month | Monthly | `vat:file` |
| WHT — Imports | 3% | CIF value | At import clearance | Per transaction | `vat:file` |
| WHT — Government contracts | 30% | Any | 30th of following month | Monthly | `vat:file` |
| WHT — Non-Resident services | 15% | Any | 30th of following month | Monthly | `vat:file` |
| WHT — Dividend | 15% | Distribution amount | 30th of following month | Monthly | `vat:file` |
| WHT — Interest (standard) | 10% | Interest amount | 30th of following month | Monthly | `vat:file` |
| WHT — Interest (FIs / credit sales) | 30% | Interest amount | 30th of following month | Monthly | `vat:file` |
| WHT — Royalties (artistic) | 5% | Royalty amount | 30th of following month | Monthly | `vat:file` |
| WHT — Royalties (technical/industrial) | 10% | Royalty amount | 30th of following month | Monthly | `vat:file` |
| BIT | 30% | Net taxable profit | November 7 | Annual | `bit:file` |
| MAT | 2.5% | Annual turnover | November 7 | Annual | `bit:file` |
| Advance BIT (Schedule C imports) | 3% | CIF value | At import | Per transaction | `bit:file` |
| Capital Gains | 15% | Asset disposal (shares, bonds, buildings) | At transaction | Per transaction | `bit:file` |
| Games of Chance | 20% | Lottery / tombola winnings | At transaction | Per transaction | `bit:file` |
| Repatriated / Undistributed Profit | 15% | Branch profits / undistributed profits | At transaction | Per transaction | `bit:file` |
| Digital Content Income | 15% | Creator income | 30th of following month | Monthly | `bit:file` |
| PIT (PAYE) — Proc. 1395/2025 | 0–35% (6 brackets) | Monthly employment income | Monthly | Monthly | `payroll:read` |
| Pension — EE | 7% | Insurable earnings cap ETB 15,000/mo | Monthly | Monthly | `payroll:read` |
| Pension — ER | 11% | Insurable earnings cap ETB 15,000/mo | Monthly | Monthly | `payroll:read` |
| DRRF | 1% | Eligible transaction value | 15th of last quarter month | Quarterly | `disaster_fund:read` |
| Stamp Duty | 1% (min ETB 500) | Document value | At transaction | Per transaction | `vat:read` |
| Import Surtax | 10% | CIF + Customs Duty + Excise | At import | Per transaction | `vat:read` |
| Customs Duty | 0–35% | CIF value | At import | Per transaction | `vat:read` |
| Thin Capitalisation limit | 2:1 | Debt:equity ratio (Proc. 979/2016 s.20.3) | — | — | — |

**PIT Brackets — Proclamation 1395/2025 (effective July 7, 2025):**

> Tax-free threshold raised from ETB 600 → ETB 2,000/month. Reduced from 7 to 6 brackets.

| Monthly Income (ETB) | Rate | Standard Deduction (ETB) |
|----------------------|------|--------------------------|
| 0 – 2,000 | 0% | 0 |
| 2,001 – 4,000 | 15% | 300 |
| 4,001 – 7,000 | 20% | 500 |
| 7,001 – 10,000 | 25% | 850 |
| 10,001 – 14,000 | 30% | 1,350 |
| 14,001 + | 35% | 2,050 |

> Previous brackets (Proc. 1186/2016) are retained in `PIT_BRACKETS_2016` for historical payroll recalculations. `PIT_BRACKETS` always points to the current (2025) set. Source: `packages/shared/src/constants.ts`.

**Taxpayer Categories (see [`FILING-LIFECYCLE.md`](./FILING-LIFECYCLE.md) Phase 1):**

| Category | Annual Turnover | Tax Type | Filing | VAT Registration |
|----------|----------------|----------|--------|-----------------|
| A | ≥ ETB 1,000,000 | BIT 30% (or MAT 2.5%) | Annual BIT | Mandatory ≥ ETB 2,000,000 |
| B | ETB 500K – < ETB 1M | TOT (2%/10%) + BIT | Monthly TOT + Annual BIT | Not applicable |
| C | < ETB 500,000 | TOT (2%/10%) | Monthly TOT | Not applicable |

> Note: VAT registration threshold is ETB 2,000,000/year (Regulation 570/2025). Category A covers BIT obligation (≥ ETB 1M). A Category A taxpayer below ETB 2M is subject to BIT but not mandatory VAT. Source: `ETH_TAX.CAT_A_THRESHOLD` and `ETH_TAX.VAT_REGISTRATION_THRESHOLD` in `packages/shared/src/constants.ts`.

---

## 8. Portal & URL Registry

> These URLs are centralized here so every doc references the same canonical addresses.

| Resource | URL | Purpose |
|----------|-----|---------|
| **e-Tax Portal** | https://etax.erca.gov.et | VAT, TOT, WHT, BIT, DRRF, PIT, Pension filing + payment |
| **TASS — Device Verification** | https://tass.erca.gov.et | Fiscal device (printer/POS) registration & verification |
| **Ministry of Revenue** | https://mor.gov.et | Official MoR site — phone: +251 11 662 98 00, email: info.mor@mor.gov.et |
| **Ethiopian Customs** | https://ecca.gov.et | Customs duties, import clearance |
| **AABE (IFRS standards)** | https://aabe.gov.et | IFRS adoption, tier thresholds, audit standards |
| **ERCA QR Standard** | NBE-IQR | Machine-readable invoice QR (TIN, FS No., date, total, VAT, SHA-256 hash) |

---

## 9. Reference Block Convention

All related markdown files include a **dynamic reference block** in their front matter / header. This block creates a two-way connection to this core config and the filing lifecycle:

```markdown
<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](./CORE-CONFIG.md)
     📌 FILING LIFECYCLE: [docs/FILING-LIFECYCLE.md](./FILING-LIFECYCLE.md)
     🔄 Last synced: YYYY-MM-DD -->
```

To update terminology, rates, or deadlines across all docs:

1. **Edit this file** (`CORE-CONFIG.md`) — it is the single source of truth.
2. Search for the reference block `<!-- 📌 CORE CONFIG` across `docs/**/*.md` to find every connected file.
3. Cross-check the affected term/section in each connected file and update in lock-step.

**Connected file count:** See the reference block in each doc header — every file in `docs/` carries one.

---

## 10. Tech Stack Reference

Key versions and packages as defined in the monorepo. Update when a major dependency changes.

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | React 19, Vite 6 |
| Styling | Tailwind CSS | — |
| Data fetching | TanStack Query + oRPC client | — |
| Backend | NestJS + Passport/JWT + BullMQ + Socket.io | — |
| ORM | Prisma (MariaDB via `@prisma/adapter-mariadb`) | `^7.8` |
| API contract | oRPC | `1.14.6` |
| Validation | Zod | `^4.0.0` |
| Monorepo | Nx | `^22.7.6` |
| TypeScript | — | `^5.9.3` |
| Test (backend) | Jest | 30 |
| Test (frontend/libs) | Vitest | 3 |
| E2E | Playwright | Chromium |

**Key shared packages:**

| Package | Alias | Purpose |
|---------|-------|---------|
| `@ovds/contracts` | `packages/contracts/src/index.ts` | oRPC contracts + Zod schemas |
| `@ovds/shared` | `packages/shared/src/index.ts` | Pure TS types/utils + re-exports `@ovds/core` |
| `@ovds/database` | `packages/database/src/index.ts` | PrismaClient + query helpers + tenant scoping |
| `@ovds/core` | `packages/core/src/index.ts` | Module kernel, EventBus, MenuBuilder, ModuleRegistry |
| `@ovds/ui` | `packages/ui/src/index.ts` | React component library + hooks + design tokens |
| `@ovds/dto` | `packages/shared/dto/src/index.ts` | class-validator DTOs for NestJS + forms |
| `@ovds/` | `packages//src/index.ts` | Offline-first sync engine (14 regulated sectors) |

> **Module boundary rule:** Frontend may import `@ovds/shared`, `@ovds/contracts`, `@ovds/ui`, `@ovds/core`. Backend may import `@ovds/shared`, `@ovds/contracts`, `@ovds/database`, `@ovds/core`. Neither app imports the other's scope. `@ovds/database` is backend-only — never aliased in `vite.config.ts`.

### Subscription & Scale

OVDS is a **subscription-monetized, multi-tenant** platform architected to handle a very large number of accounting users:

- **Scalability:** Cloud tier auto-scales from 50 to 5,000+ concurrent users; On-Premise supports 200–2,000+ per deployment
- **Company-scoped data:** Every query, invoice, journal, and filing is bound to a `companyId` — enforced by `CompanyGuard`
- **Subscription:** Online registration → plan selection (Free/Trial → Starter → Professional → Enterprise) → module CRUD gated by entitlements
- **Dual deployment:** Use directly from cloud after payment, or download the installer for on-premise/air-gapped operation
- **Monetization:** See [Subscription & Monetization](./subscription%20and%20monitaizetion.md) and [monetization-and-plans.md](./08-advanced/monetization-and-plans.md)

---

*This is a living document. All OVDS documentation files dynamically reference this configuration. See [`FILING-LIFECYCLE.md`](./FILING-LIFECYCLE.md) for the automated filing pipeline.*