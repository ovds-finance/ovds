<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Frameworks & Reference

> **Part of:** [OVDS Documentation](../README.md) › Frameworks & Reference
>
> **Visible to:** ovds · Accounting · Auditor · IFRS Officer · Bank Liaison · External Auditor roles

The Frameworks & Reference section provides quick access to compliance standards, accounting principles, and audit tools.

---

## Standalone Guides

| Guide | Description |
|-------|-------------|
| [Accounting Knowledge Base](./accounting-knowledge-base.md) | Double-entry golden rules, common journal patterns, IFRS accounting chain, Chart of Accounts structure, recurring templates, IAS 12 deferred tax |
| [Automation & V&V Framework](./automation-and-vv.md) | Full cron job schedule, auto-matching scoring, WHT auto-calc, payroll GL posting, pre-close checks, VAT/WHT/PAYE verification checks, MoR audit alignment |
| [Ethiopian Regulatory Reference](./ethiopian-regulatory-reference.md) | All proclamations, complete rate tables (VAT, WHT, PIT, BIT, DRRF, Pension, Stamp Duty), fiscal calendar, sector exemptions, late-filing penalties, MoR contact |
| [APA Guide](./APA.md) | Detailed Accounting Process Automation implementation guide with cron references |

---

## What's in This Section

| Sub-section | Items | Who Sees It |
|-------------|-------|-------------|
| Standards & Compliance | IFRS Dashboard, Compliance Auditor | ovds, ACCOUNTING, AUDITOR, IFRS_OFFICER, EXTERNAL_AUDITOR |
| Knowledge Base | Accounting Knowledge Base, APA Guide, Audit Trail, V&V Framework | ADMIN, ovds, AUDITOR, IFRS_OFFICER, EXTERNAL_AUDITOR |

---

## 1. Standards & Compliance

### IFRS Dashboard (`/ifrs`)
Navigate to **Frameworks → IFRS Standards**.

The IFRS Dashboard provides a real-time view of your company's IFRS compliance status across all applicable standards.

**Quick access tabs:**
| Tab | Standard | Description |
|-----|----------|-------------|
| Tier 1 | Full IFRS | For companies with turnover > ETB 300M or employees > 200 |
| Tier 2 | IFRS for SMEs | For companies with turnover > ETB 20M or employees > 20 |
| AABE Thresholds | AABE | Ethiopian IFRS adoption thresholds and effective dates |
| IAS 16 | Fixed Assets | Property, Plant & Equipment depreciation schedules |
| IAS 2 | Inventory | FIFO/WA costing (LIFO prohibited) |

**IFRS Standards Tracked:**

| Standard | Topic | OVDS Feature |
|----------|-------|-------------|
| IFRS 9 | Financial Instruments — ECL | Expected Credit Loss calculator |
| IFRS 10 | Consolidated Statements | Multi-company consolidation |
| IFRS 12 | Disclosure of Interests | Subsidiary disclosures |
| IFRS 15 | Revenue Recognition | Revenue schedule per contract |
| IFRS 16 | Leases | Right-of-use asset and lease liability |
| IFRS S1/S2 | Sustainability Disclosures | Climate and ESG reporting (see §1 below) |
| IAS 1 | Presentation of Statements | Balance Sheet, P&L structure |
| IAS 2 | Inventories | FIFO/WA costing |
| IAS 7 | Cash Flow Statements | Indirect method cash flow |
| IAS 12 | Income Taxes | Deferred tax, BIT 30% |
| IAS 16 | Property, Plant & Equipment | Depreciation schedules |
| IAS 36 | Impairment of Assets | Impairment testing |
| IAS 37 | Provisions & Contingencies | DRRF levy provisions |

#### IFRS S1/S2 — Sustainability Disclosures

Navigate to **Frameworks → Compliance Auditor → IFRS S1/S2** (`/compliance-auditor?view=sustainability`).

**IFRS S1** (General Requirements for Sustainability-Related Disclosures) and **IFRS S2** (Climate-Related Disclosures) are applicable to Tier 1 companies and increasingly expected by investors and lenders.

| Disclosure Area | IFRS S1 | IFRS S2 |
|----------------|---------|---------|
| Governance | Board oversight of sustainability risks | Board oversight of climate risks |
| Strategy | Sustainability risks + opportunities | Climate scenario analysis |
| Risk Management | Integration with enterprise risk | Climate risk identification & assessment |
| Metrics & Targets | Sector-specific sustainability metrics | Scope 1, 2, 3 GHG emissions |

**OVDS tracking for IFRS S2 Scope 1/2/3:**
- **Scope 1** (direct emissions): Fuel usage from IoT fleet trackers → `IotFiscalEvent` with `industryContext: LOGISTICS_FLEET`
- **Scope 2** (purchased electricity): Utility smart meter data → energy kWh consumed
- **Scope 3** (supply chain): Tracked manually via expense categories; vendor sustainability scores in the CRM vendor profile

> IFRS S1/S2 mandatory adoption timeline for Ethiopian Tier 1 companies follows AABE directives. Check [aabe.gov.et](https://aabe.gov.et) for the current effective date.

**IFRS Tier Thresholds (AABE):**

| Tier | Criteria (meet 2 of 4) | Mandatory Since |
|------|----------------------|----------------|
| Full IFRS (Tier 1) | Turnover > ETB 300M **or** Employees > 200 **or** Assets > ETB 200M **or** Liabilities > ETB 200M | July 7, 2023 |
| IFRS for SMEs (Tier 2) | Turnover > ETB 20M **or** Employees > 20 **or** Assets > ETB 20M **or** Liabilities > ETB 20M | July 7, 2024 |
| Micro-entity (Tier 3) | Below Tier 2 thresholds | Outside IFRS scope |

> Banks, insurance companies, and government-owned enterprises are **always Tier 1** regardless of size.

---

### Compliance Auditor (`/compliance-auditor`)
Navigate to **Frameworks → Compliance Auditor**.

The Compliance Auditor dashboard provides a real-time compliance score and checklist across all Ethiopian regulatory requirements.

**Compliance Score Components:**

| Check | Weight | Passes When |
|-------|--------|-------------|
| VAT Return Filed | 25% | Current month VAT return submitted |
| BIT Filed | 20% | Current fiscal year BIT return filed |
| DRRF Remitted | 20% | No overdue DRRF contributions |
| Payroll Configured | 15% | At least one payroll approved this month |
| Audit Clean | 10% | No open CRITICAL audit findings |
| IFRS Standards Enabled | 10% | At least one IFRS standard configured |

**Score Grades:**
- **A (90–100%)** — Fully compliant
- **B (75–89%)** — Minor gaps
- **C (60–74%)** — Needs attention
- **D (40–59%)** — Significant gaps
- **F (0–39%)** — Non-compliant

**Compliance Checklist Views:**
- `/compliance-auditor?view=checklist` — Full compliance checklist
- `/compliance-auditor?view=sustainability` — IFRS S1/S2 sustainability disclosures
- `/audit-outsourcing` — External audit engagement management

---

## 2. Knowledge Base

### Accounting Knowledge Base (`/accounting?tab=journal&view=golden-rules`)
Navigate to **Frameworks → Accounting Knowledge Base**.

Quick reference for double-entry accounting principles used throughout OVDS.

**The Golden Rules of Double-Entry Accounting:**

| Account Type | Debit | Credit |
|-------------|-------|--------|
| Asset | Increases (+) | Decreases (−) |
| Liability | Decreases (−) | Increases (+) |
| Equity | Decreases (−) | Increases (+) |
| Income/Revenue | Decreases (−) | Increases (+) |
| Expense | Increases (+) | Decreases (−) |

**Key Principle:** Every transaction must have equal debits and credits. The Trial Balance verifies this — if `Total Debits ≠ Total Credits`, there is a posting error.

**Common Journal Entry Patterns:**

| Transaction | Debit | Credit |
|-------------|-------|--------|
| Customer pays invoice | Cash/Bank | Accounts Receivable |
| Pay vendor bill | Accounts Payable | Cash/Bank |
| Record salary expense | Salaries Expense | Salaries Payable |
| Pay VAT to ERCA | VAT Payable | Cash/Bank |
| Depreciation | Depreciation Expense | Accumulated Depreciation |
| Record DRRF levy | DRRF Expense | DRRF Payable |

**IFRS Accounting Chain in OVDS:**
```
Item (IAS 2)
  → Invoice/Bill (IFRS 15)
    → Journal Entry (IAS 1)
      → Income/Expense (IAS 1.81A)
        → VAT & DRRF (IAS 12 / IAS 37)
          → Income Tax (IAS 12)
```

**Recurring Journal Templates** (`/accounting?tab=journal&view=templates`):
- Create templates for monthly entries (depreciation, accruals, prepayments)
- Post a template to create a dated journal entry
- Templates are prefixed `RECURRING:` in the reference field

---

### APA Guide ([APA.md](./APA.md))
Navigate to **Frameworks → APA Guide**.

Comprehensive guide on Accounting Process Automation, benefits, and implementation priorities in OVDS.

---

### Audit Trail (`/audit-logs`)
Navigate to **Frameworks → Audit Trail**.

Every action in OVDS is logged and cannot be retroactively edited. The audit trail is the immutable record of all system activity.

**IFRS Evidence Logging (IFRS 15/16/IAS 38):**
- Schedule regeneration events (deferred revenue recognition)
- Allocation table changes (bundled SaaS performance obligations)
- Lease PV inputs + borrowing rate source identifiers
- Lease modification classification decisions + effective dates
- Software capitalization vs expense gate decisions (IAS 38 / IFRIC) with reviewer authorization

**What Gets Logged:**


| Category | Events |
|----------|--------|
| Authentication | Login, logout, failed attempts, account lockout |
| ovds | Invoice created/sent/paid, bill created/paid, journal entry posted |
| Payroll | Payroll generated, verified, finalized, approved |
| Tax | VAT calculated, filed, DRRF remitted, BIT filed |
| HR | Employee added/updated/deleted, leave approved/rejected |
| System | Settings changed, user role changed, company created |
| Security | Password reset, MFA enrolled, Auth0 linked/unlinked |
| Data | CSV import, report exported, data backup |

**Audit Log Fields:**

| Field | Description |
|-------|-------------|
| `timestamp` | UTC timestamp of the action |
| `userId` | User who performed the action |
| `action` | Action type (e.g., `GENERATE_SALARY`, `VAT_FILED`) |
| `resource` | Module affected (e.g., `Invoice`, `Employee`) |
| `resourceId` | ID of the affected record |
| `companyId` | Company context |
| `ipAddress` | Client IP address |
| `changes` | JSON diff of before/after values |

**Filtering & Export:**
- Filter by: user, action type, date range, company, resource
- Export to CSV for compliance reporting
- Security-specific view: `/audit-logs?type=security`
- Export action: `/audit-logs?action=export`

**Permissions Required:**
- View: `audit_logs:read`
- Export: `audit_logs:write`
- Annotate (AUDITOR role): `audit_logs:write`

---

## 3. Ethiopian Regulatory Reference

### Key Proclamations & Regulations

| Law | Subject | Key Provisions |
|-----|---------|---------------|
| Proclamation 1341/2024 | VAT | 15% standard rate, ETB 2M registration threshold, monthly filing |
| Proclamation 1395/2025 | PIT & Pension | 6 PIT brackets (0–35%), pension cap ETB 15,000 |
| Regulation 570/2025 | DRRF | 17+ levy categories, 1–5% rates, quarterly remittance |
| AABE IFRS Directive | IFRS Adoption | Tier 1 (July 2023), Tier 2 (July 2024) |
| NBE-IQR Standard | Invoice QR | ERCA-compliant QR code format for all invoices |

### Ethiopian Fiscal Calendar

| Event | Date |
|-------|------|
| Fiscal Year Start | Hamle (July 7/8) |
| Fiscal Year End | Sene (July 6/7) |
| Monthly VAT Deadline | 30th of following month |
| DRRF Q1 Deadline | October 15 |
| DRRF Q2 Deadline | January 15 |
| DRRF Q3 Deadline | April 15 |
| DRRF Q4 Deadline | July 15 |
| BIT Annual Filing | November 7 (within 4 months of FY end) |
| Pension Remittance | Monthly, same cycle as payroll |

### PIT Brackets (Proclamation 1395/2025, effective July 7, 2025)

| Monthly Income (ETB) | Rate | Deductible (ETB) |
|---------------------|------|-----------------|
| 0 – 2,000 | 0% | 0 |
| 2,001 – 4,000 | 10% | 200 |
| 4,001 – 7,000 | 15% | 400 |
| 7,001 – 11,000 | 20% | 750 |
| 11,001 – 14,000 | 25% | 1,300 |
| > 14,000 | 35% | 2,700 |

**Formula:** `PIT = (Taxable Salary × Rate) − Deductible Amount`  
**Taxable salary** = Gross salary − Employee pension (7%, capped at ETB 15,000 insurable earnings).

**Pension:** Employee 7% + Employer 11%, both capped at ETB 15,000 insurable earnings per Proclamation 1395/2025.

### DRRF Levy Rates (Regulation 570/2025)

| Category | Rate | Applies To |
|----------|------|-----------|
| SALARY_CONTRIBUTION | 1% | Net salary of employees |
| LOAN_VALUE | 1% | Loan value disbursed by financial institutions |
| INSURANCE_PREMIUM | 1% | Insurance premiums collected |
| DIVIDEND | 1% | Dividend distributions |
| SERVICE_FEE | 5% | Mobile / digital banking service fees |
| AIRTIME_SALES | 5% | Telecom airtime sales |
| ANNUAL_SALES_REVENUE | 5% | Annual gross sales revenue (sector-specific) |
| TOBACCO_ALCOHOL | 5% | Tobacco and alcohol product sales |
| TELECOM_DIGITAL | 5% | Telecom and digital services revenue |
| GOVERNMENT_BUDGET | 0.25% | Annual government budget allocation |
| TICKET_SALES | ETB 100 flat | Per domestic flight ticket issued |
| FUEL_SALES | ETB 200 flat | Per fuel issuance at retail outlets |
| MANUFACTURING | 1% | Manufacturing sector transactions |
| CONSTRUCTION | 2% | Construction and infrastructure projects |
| TRADE_COMMERCE | 1% | Wholesale and retail trade |
| FINANCIAL_SERVICES | 3% | Banking, insurance, and related services |
| HOSPITALITY | 2% | Hotels, restaurants, and tourism |
| TRANSPORT | 1.5% | Freight and passenger transport |
| MINING | 5% | Mineral extraction activities |
| HEALTHCARE | 1% | Private hospitals and clinics |
| EDUCATION | 1% | Private schools and universities |

> OVDS auto-calculates the applicable DRRF rate based on the company's **Business Sector** configured in **Settings → Company Profile**. Go to **Tax → Disaster Fund** (`/disaster-fund`) to review and remit quarterly. Deadline: 15th of the last month of each quarter.

---

## 4. V&V Framework

Navigate to **Frameworks → V&V Framework** (`./VANDV_FRAMEWORK.md`).

The Verification & Validation (V&V) Framework defines how OVDS validates tax calculations before filing and verifies data accuracy across all financial modules.

> **Lifecycle context:** This framework is the validation engine for [Phase 4 — V&V Pre-Submission Checks](../FILING-LIFECYCLE.md#5-phase-4--v&v-pre-submission-checks) of the Digital Automated Filing Lifecycle. Taxpayer categories, rates, and thresholds are centralized in [`CORE-CONFIG.md`](../CORE-CONFIG.md#7-tax-rate--deadline-summary).

### Ethiopian Taxpayer Categories

| Category | Criteria | Tax Type | Filing |
|----------|----------|----------|--------|
| A | Annual turnover ≥ ETB 1,000,000 | VAT + BIT 30% | Monthly VAT + Annual BIT |
| B | Annual turnover ETB 500K–1M | TOT (2%/10%) + BIT | Monthly TOT + Annual BIT |
| C | Annual turnover < ETB 500K | TOT (2%/10%) | Monthly TOT (progressive) |

### VAT Verification & Validation

| Check | What it Verifies | Action if Failed |
|-------|-----------------|-----------------|
| Output VAT = Sum of invoice VAT | All invoices accounted for in VAT output | Reconcile missing invoices |
| Input VAT = Sum of bill VAT | All eligible purchase VAT captured | Add missing bills |
| Net VAT = Output − Input | Arithmetic accuracy | Re-compute from source |
| VAT-registered vendor check | Input VAT only claimed from VAT-registered vendors | Remove unregistered vendor VAT |
| TIN format validation | All customer/vendor TINs are 15-digit format | Update vendor profile |
| ERCA QR on invoices | Every issued invoice has a valid NBE-IQR QR code | Regenerate QR for affected invoices |

### WHT Verification & Validation

| Check | Threshold | Action |
|-------|-----------|--------|
| Services WHT applied | Payment ≥ ETB 500 | Auto-calculated — verify vendor TIN on file |
| Goods WHT applied | Payment ≥ ETB 10,000 | Auto-calculated — verify vendor TIN on file |
| WHT Exempt flag | Vendor marked exempt | Verify exemption certificate in vendor profile |
| WHT remittance timing | By 30th of following month | Check WHT payable balance before closing |

### PAYE Verification & Validation

| Check | Description |
|-------|-------------|
| PIT bracket application | Each employee's PIT calculated per Proc. 1395/2025 brackets |
| Pension cap | Employee and employer pension capped at ETB 15,000 insurable earnings |
| Gross-to-net reconciliation | Net pay = Gross − PIT − Employee Pension − Deductions |
| Headcount reconciliation | Payroll record count = Active employee count for the period |
| GL posting balance | Salary expense debit = Salary payable + PIT payable + Pension payable |

### MoR Audit Alignment

Before each tax filing, OVDS runs automatic pre-submission checks:

1. **Cross-reference** — BIT-declared revenue matches VAT-reported turnover (ERCA cross-checks these)
2. **Zero-declaration flag** — months with no transactions are flagged for mandatory zero filing
3. **Penalty estimator** — if a deadline will be missed, `/tax/penalty-calculator` shows the projected penalty before you file late
4. **Compliance score** — filing on time and accurately improves the company's live compliance score in **Compliance Auditor** (`/compliance-auditor`)

---

## Navigation Flow

```
Frameworks & Reference
├── Standards & Compliance
│   ├── IFRS Standards        /ifrs                    (ovds:read)
│   │   ├── Tier 1            /ifrs?tier=1
│   │   ├── Tier 2            /ifrs?tier=2
│   │   ├── AABE Thresholds   /ifrs?view=thresholds
│   │   ├── IAS 16            /fixed-assets
│   │   └── IAS 2             /inventory
│   └── Compliance Auditor    /compliance-auditor      (audit_logs:read)
│       ├── Checklist         /compliance-auditor?view=checklist
│       ├── Audit Outsourcing /audit-outsourcing
│       ├── IFRS S1/S2        /compliance-auditor?view=sustainability
│       └── Period Close      /period-close
└── Knowledge Base
    ├── Accounting KB         /accounting?tab=journal&view=golden-rules  (ovds:read)
    │   ├── Golden Rules      /accounting?tab=journal&view=golden-rules
    │   ├── Chart of Accounts /accounting?tab=accounts
    │   └── Templates         /accounting?tab=journal&view=templates
    ├── APA Guide             ./APA.md                                   (ovds:read)
    ├── Audit Trail           /audit-logs              (audit_logs:read)
    │   ├── Security View     /audit-logs?type=security
    │   └── Export            /audit-logs/export
    └── V&V Framework         ./VANDV_FRAMEWORK.md                     (ovds:read)
        ├── Taxpayer Categories (A/B/C)
        ├── VAT & TOT Verification & Validation
        ├── PAYE & WHT Verification & Validation
        ├── Excise Tax V&V
        └── MoR Audit Alignment
        └── Export            /audit-logs?action=export
```



