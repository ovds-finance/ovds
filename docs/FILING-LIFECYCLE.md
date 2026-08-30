<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](./CORE-CONFIG.md)
     📌 FILING LIFECYCLE: [docs/FILING-LIFECYCLE.md](./FILING-LIFECYCLE.md)
     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](./subscription%20and%20monitaizetion.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](./UBIQUITOUS-LANGUAGE.md)
     🔄 Last synced: 2026-08-27 -->

# 📌 Digital Automated Filing Lifecycle

> **Canonical pipeline:** Source transaction → Canonical ledger → Tax engine → V&V checks → e-Tax submission → Payment → Compliance scoring
>
> **Core config:** All terminology, rates, deadlines, and permissions in this lifecycle are defined in [`CORE-CONFIG.md`](./CORE-CONFIG.md). This file consumes that configuration dynamically — when `CORE-CONFIG.md` is updated, all lifecycle steps, rates, and thresholds here are inherited.
>
> **Automation:** Every phase below is wired to the OVDS cron schedule (see [automation-and-vv.md](./10-frameworks/automation-and-vv.md)) and the four-phase workflow (Setup → Daily Ops → Analysis → Submit to MoR).

```
📌 CORE CONFIG → [docs/CORE-CONFIG.md](./CORE-CONFIG.md) — terminology, RBAC, GL map, rates
📌 FILING LIFECYCLE → [docs/FILING-LIFECYCLE.md](this file) — automated tax filing pipeline
```

---

## Table of Contents

1. [Overview](#1-overview)
2. [Phase 1 — Data Capture](#2-phase-1--data-capture)
3. [Phase 2 — Tax Calculation & Accrual](#3-phase-2--tax-calculation--accrual)
4. [Phase 3 — Analysis & Liability Estimation](#4-phase-3--analysis--liability-estimation)
5. [Phase 4 — V&V Pre-Submission Checks](#5-phase-4--vv-pre-submission-checks)
6. [Phase 5 — e-Tax Submission & Payment](#6-phase-5--etax-submission--payment)
7. [Phase 6 — Compliance Scoring & Audit Trail](#7-phase-6--compliance-scoring--audit-trail)
8. [Filing Model Reference](#8-filing-model-reference)
9. [State Transition Diagrams](#9-state-transition-diagrams)
10. [Cron Automation Schedule](#10-cron-automation-schedule)
11. [Compliance Gate Checkpoints](#11-compliance-gate-checkpoints)
12. [Error Handling & Recovery](#12-error-handling--recovery)

---

## 1. Overview

The Digital Automated Filing Lifecycle is the end-to-end pipeline that transforms every financial transaction in OVDS into a Ministry of Revenues (MoR) e-Tax submission. It is triggered by source events (invoices, bills, payroll, IoT sales) and runs through six automated phases, each with built-in verification gates.

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────────────┐
│ Phase 1     │ → │ Phase 2      │ → │ Phase 3      │ → │ Phase 4      │ → │ Phase 5      │ → │ Phase 6           │
│ Data Capture│   │ Tax Calc     │   │ Analysis     │   │ V&V Checks   │   │ e-Tax & Pay  │   │ Compliance        │
│             │   │ & Accrual    │   │ & Estimation │   │              │   │              │   │ Scoring           │
└─────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └───────────────────┘
  Live events     Real-time cron       TanStack Query      Auto-checks        User-action         Daily cron
  + on-event       + on-event           on load           on submit click    (vat:file role)      + on-event
```

### Taxpayer Categories

| Category | Annual Turnover | Tax Regime | Filing Obligation |
|----------|----------------|------------|-------------------|
| A | ≥ ETB 2,000,000 | VAT (15%) + BIT (30%) | Monthly VAT return + Annual BIT |
| B | ETB 500K–2M | TOT (2%/10%) + BIT | Monthly TOT + Annual BIT |
| C | < ETB 500K | TOT (2%/10%) | Monthly TOT |

> **VAT registration threshold:** ETB 2,000,000 annual turnover (Regulation No. 570/2025). Below this: TOT applies. The `TaxAutomationService` broadcasts a `THRESHOLD_ALERT` WebSocket event when revenue reaches 90% of the threshold. `CompanyTaxProfile.vatTotBand` records the current band (`A`, `B`, or `C`).

> **Key principle:** VAT and TOT are mutually exclusive. A company is either VAT-registered (Category A) or TOT-registered (Category B/C). `CompanyTaxProfile.isVatRegistered` and `isTotApplicable` govern this.

---

## 2. Phase 1 — Data Capture

**Duration:** Real-time on transaction creation
**Trigger:** User creates invoice / bill / payroll run / IoT sale
**Permission:** `invoices:write`, `bills:read`, `payroll:read`
**Backend services:** `invoiceService`, `PurchasesService`, `HrService`, `FiscalDeviceService`
**Event bus:** `invoice.created`, `invoice.payment_recorded`, `bill.paid`, `iot.billing.trigger.created`

### What Happens

Every source document posts to the canonical IFRS ledger via `AccountingService.autoPost*`. The entry is tenant-scoped to `companyId` and tagged with the source type. Simultaneously, `TaxAutomationService` listens for these events and updates the current period's `VatFiling` DRAFT projection in real-time.

```
Invoice Created / Paid
    │
    ├──► GL Journal (double-entry, Dr = Cr):
    │       Dr Accounts Receivable (1100)
    │       Cr Sales Revenue (4000)
    │       Cr Output VAT Payable (2150)   [15% × taxable amount — if VAT registered]
    │
    ├──► ERCA QR / IRN: SHA-256 of TIN|invoiceNumber|invoiceDate|grossAmount
    │       Stored on Invoice.irn (OVDS Directive No. 1142/2026)
    │
    ├──► TaxAutomationService.handleInvoiceCreated():
    │       Aggregate annual revenue → check VAT threshold (ETB 2M)
    │       Broadcast THRESHOLD_ALERT WebSocket if ≥ 90%
    │       Enqueue QUEUES.TAX_AUTOMATION job
    │
    └──► TaxAutomationService.handlePaymentRecorded():
            Re-compute VAT reconciliation for period
            Upsert VatFiling DRAFT with live outputVat / inputVat / netPayable
            If not VAT-registered: upsert TotFiling DRAFT (calculateTot())
            Broadcast VAT_RECONCILED or TOT_RECONCILED WebSocket event
```

### Source Documents & Tax Impact

| Document | Output VAT | Input VAT | WHT | DRRF | PIT / Pension |
|----------|-----------|----------|-----|------|---------------|
| Sales Invoice | Cr Output VAT Payable (2150) @ 15% | — | — | 1% of subtotal → `invoice.drrfAmount` | — |
| Vendor Bill | — | Dr VAT Recoverable (1130) @ 15% | Dr WHT Payable (2162) if `whtApplicable` | — | — |
| Payroll Run | — | — | — | 1% of gross salary → `PayeDeclaration.totalDrrf` | PIT progressive brackets + 18% pension |
| IoT / POS Sale | Cr Output VAT (2150) | — | — | Auto via `iot.billing.trigger.created` | — |

### Validation Gate

- Double-entry: `sum(debit) = sum(credit)` enforced inside `withTx()` — transaction rolls back on mismatch.
- TIN format: 10-digit numeric validation in `ETaxExportService.validateTIN()` before eTax exports.
- ERCA QR / IRN: `VatService.generateIrn()` produces `IRN-{SHA256[0..20]}` per OVDS Directive 1142/2026.
- Tenant scope: every Prisma write uses `withCompanyData(ctx, dto)` — missing `companyId` throws `TenantScopingViolation`.
- Period format: `TaxService.parsePeriod()` validates `YYYY-MM` and rejects invalid months before any DB write.

---

## 3. Phase 2 — Tax Calculation & Accrual

**Duration:** Real-time (event-driven) + batch cron (1st of month)
**Trigger:** `TaxAutomationService` on `invoice.payment_recorded`; monthly cron jobs for batch auto-compute
**Permission:** `vat:calculate`, `vat:read`
**Backend services:** `TaxService`, `VatService`, `WhtCertificateService`

### VAT Auto-Compute (`TaxService.autoComputeVatFiling`)

```
autoComputeVatFiling(companyId, period)
    │
    ├── Guard: skip if period is locked (periodLockedAt set) or already FILED/PAID
    │
    ├── getVatReconciliation(companyId, period)
    │       Output VAT: invoices WHERE status NOT IN (DRAFT, VOID, CANCELLED)
    │                   + manual vatoutputledger entries
    │       Input VAT:  bills WHERE status NOT IN (DRAFT, VOID, CANCELLED)
    │                   + manual vatinputledger WHERE claimable = 1
    │       Basis: ACCRUAL (VAT declarable when invoice issued — Proc. 1341/2024 Art. 24)
    │
    ├── Carry-forward: fetch prior period VatFiling.inputCreditCarryForward
    │
    ├── Apportionment: claimableInput = inputVat × inputApportionmentPct
    │       Mixed-use businesses only (Proc. 1341/2024 Art. 26)
    │       Default: 1.0 (fully claimable)
    │
    ├── netPayable = max(0, outputVat − claimableInput − carriedForward)
    │   newCarryForward = max(0, -(outputVat − claimableInput − carriedForward))
    │
    └── Upsert VatFiling { status: DRAFT, projected: netPayable, dueDate: 30th of next month }
```

### TOT Auto-Compute (`TaxService.autoComputeTotFiling`)

Only runs when `CompanyTaxProfile.isTotApplicable = true` (annual revenue < ETB 2M):

```
calculateTot(companyId, period)
    │
    ├── Goods invoices (category CONTAINS 'goods') → 2% rate (ETH_TAX.TOT_GOODS_RATE)
    ├── Service invoices (other categories)        → 10% rate (ETH_TAX.TOT_SERVICES_RATE)
    └── Upsert TotFiling { status: DRAFT, dueDate: 30th of next month }
```

### WHT Auto-Generate (`WhtCertificateService.autoGenerateFromBills`)

Triggered on-demand or by cron. Scans bills with `whtApplicable = true`:

- Goods ≥ ETB 10,000 → 3% WHT (`GOODS` type)
- Services ≥ ETB 500 → 3% WHT (`SERVICES` type) — Proc. 1395/2025
- Creates `WhtCertificate` records in `DRAFT` status with auto-generated `certNo`

### PAYE / Pension Generation (`HR PayeController`)

```
POST /hr/paye/declarations/generate   { period }
POST /hr/paye/pension/generate        { period }
    │
    ├── Aggregate PayrollRecord WHERE year=y AND month=m AND status='APPROVED'
    ├── Sum: totalGrossSalary, totalPit (PIT brackets), totalEmpPension (7%), totalEmpRPension (11%)
    ├── totalDrrf = totalGrossSalary × 1%
    ├── netPayableErca  = totalPit + totalDrrf
    ├── netPayablePfsa  = totalEmpPension + totalEmpRPension
    └── Upsert PayeDeclaration + PensionRemittance { status: DRAFT, dueDate: last day of next month }
```

### Tax Calculation Summary

| Tax | Rate | Formula | Filing Model | Due Date |
|-----|------|---------|--------------|----------|
| VAT | 15% | OutputVAT − ClaimableInput − CarryFwd | `VatFiling` | 30th of next month |
| TOT (goods) | 2% | goodsAmount × 0.02 | `TotFiling` | 30th of next month |
| TOT (services) | 10% | servicesAmount × 0.10 | `TotFiling` | 30th of next month |
| WHT (goods/services) | 3% | grossAmount × 0.03 | `WhtCertificate` | 30th of next month |
| BIT (regular) | 30% | taxableProfit × 0.30 | `IncomeTaxFiling` | November 7 |
| MAT | 2.5% | annualRevenue × 0.025 | `IncomeTaxFiling` | November 7 |
| BIT payable | max(30%, MAT) | max(regularCit, matPayable) | `IncomeTaxFiling` | November 7 |
| PIT | 0–35% brackets | Progressive per `PIT_BRACKETS` | `PayeDeclaration` | Last day of next month |
| Pension | 7% + 11% = 18% | min(salary, ETB 15K cap) × rates | `PensionRemittance` | 30th of next month → PFSA |
| DRRF | 1–5% | baseAmount × sector rate (Reg. 570/2025) | `DisasterFundContribution` | 15th of last month of quarter |

> **Zero-declaration:** `TaxService.createZeroDeclarationFiling()` upserts a DRAFT with `netPayable = 0` and a `[ZERO_DECLARATION]` note. Required even in zero-activity months.

---

## 4. Phase 3 — Analysis & Liability Estimation

**Duration:** Real-time (on dashboard/page load)
**Trigger:** User navigates to `/tax/dashboard`, `/tax/vat`, `/tax`, or any tax report page
**Permission:** `vat:read`, `reports:read`, `ovds:read`
**Frontend pages:** `TaxDashboard.tsx` (`/tax/dashboard`), `VatAdministration.tsx` (`/tax/vat`), `TaxFiling.tsx` (`/tax`)
**API:** `GET /api/tax/dashboard` → `TaxService.getTaxDashboard()`, `GET /api/vat/dashboard` → `VatService.getVatDashboard()`

### Tax Dashboard KPIs (`TaxService.getTaxDashboard`)

```
getTaxDashboard(companyId)
    │
    ├── vatCurrent     = VatFiling.netPayable for current period
    ├── incomeTaxDue   = IncomeTaxFiling.balanceDue for current fiscal year
    ├── drrfPending    = sum(DisasterFundContribution.levyAmount) WHERE status IN (PENDING, OVERDUE)
    ├── overdueFilings = count(VatFiling) WHERE status = OVERDUE
    ├── annualRevenue  = sum(Invoice.subtotal) WHERE status = PAID AND year = current
    ├── taxpayerCategory: A (≥ ETB 1M) / B (≥ 500K) / C (< 500K)
    ├── vatRegistrationRequired: annualRevenue ≥ ETB 2,000,000
    ├── matApplies: annualRevenue × 2.5% > annualRevenue × 30%
    └── complianceScore (0–100):
            base = 50
            +20 if vatFiling.status = PAID
            +15 if incomeTaxFiling.paid > 0
            +10 if drrfOverdue count = 0
            +5  if overdueFilings = 0
```

### VAT Administration Three-Zone Dashboard (`VatService.getVatDashboard`)

The `VatAdministration` page uses a three-zone layout:
- **Zone 1 (260px left sidebar):** Net payable hero card, output/input/WHT strip, quick actions, readiness validation panel
- **Zone 2 (center flex):** Tab content — Overview | Output | Input | WHT | Reverse | Filings | Refunds | DRRF | Reports
- **Zone 3 (280px right rail):** Filing workflow stepper, declaration readiness check, recent eTax submissions, audit trail

The `AkiMultiStateProgress` stepper shows: `Ledger → Review → Filed → Paid` based on the selected period's `VatFiling.status`.

### Declaration Readiness Check (`ETaxExportService.validateDeclarationReadiness`)

Pre-flight check run before submission. Returns `{ ready, errors[], warnings[], summary }`:

| Check | Type | What it verifies |
|-------|------|-----------------|
| Output VAT cross-check | Error (blocks) | Sales annexure VAT vs `VatFiling.outputVat` — tolerance ±ETB 1 |
| Input VAT cross-check | Warning | Purchase annexure VAT vs `VatFiling.inputVat` — tolerance ±ETB 1 |
| WHT supplier TIN | Warning | WHT certificates with blank supplier TIN |
| VAT filing exists | Warning | No `VatFiling` record found for the period |
| VAT filing in DRAFT | Warning | Filing not yet reviewed/confirmed |
| Period lock status | Info | `periodLockedAt` is set — no further mutations allowed |
| DRRF invoice total | Info | `invoice.drrfAmount` aggregate vs `DisasterFundContribution` records |

### Tax Calendar Widget (`TaxDashboard.tsx` — `buildDeadlines()`)

Deadlines are computed from `efyTaxDeadlines()`, `vatFilingDeadline()`, and `drrfQuarterDeadline()` from `@ovds/ui` (re-exported from `@ovds/shared`):

| Tax | Deadline | Penalty for late |
|-----|----------|-----------------|
| VAT Return | 30th of following month | ETB 500/day (max ETB 50,000) + 2%/month interest |
| WHT Remittance | 30th of following month | Per Proc. 1395/2025 |
| DRRF Quarterly | 15th of last month of quarter | 25% + 2%/month |
| BIT Annual | November 7 | 5% of tax due + 2%/month |
| Provisional BIT Q1 | September 7 | Per Proc. 1395/2025 |
| Provisional BIT Q2 | December 7 | Per Proc. 1395/2025 |
| Payroll PIT | Last day of following month | Per Proc. 1395/2025 |
| Pension | 30th of following month | 2%/month (PFSA) |

---

## 5. Phase 4 — V&V Pre-Submission Checks

**Duration:** Sub-second (on submission click)
**Trigger:** User clicks **File Return** / **Submit to eTax** / **Record Filing**
**Permission:** `vat:write`, `vat:file`
**Frontend:** `VatAdministration.tsx` (File Return modal), `ETaxDeclaration.tsx` (readiness panel), `TaxFiling.tsx` (Record Filing modal)
**Backend:** `ETaxExportService.validateDeclarationReadiness()`, `VatService.lockPeriod()`, `TaxService.recordVatFiling()`

### Period Lock Guard

`TaxService.recordVatFiling()` and `TaxService.autoComputeVatFiling()` both check `periodLockedAt` before any write:

```typescript
if (existing?.periodLockedAt) {
  throw new BadRequestException(
    `Period ${period} is locked — submitted to MoR and cannot be modified. Create an amendment instead.`
  );
}
if (existing?.status === 'PAID' || existing?.status === 'FILED') {
  throw new BadRequestException(`Period ${period} is already ${existing.status}.`);
}
```

### V&V Checks Summary

```
User clicks "File Return"
    │
    ├──► 1. Declaration Readiness (ETaxExportService.validateDeclarationReadiness)
    │         Sales Annexure VAT = VatFiling.outputVat  (±ETB 1 tolerance) [ERROR if fails]
    │         Purchase Annexure VAT ≈ VatFiling.inputVat                   [WARNING if differs]
    │         WHT certificates: all have supplierTin                       [WARNING if missing]
    │         VatFiling record exists for period                           [WARNING if absent]
    │         Period lock status shown to user                             [INFO]
    │
    ├──► 2. Period Lock Guard (in recordVatFiling)
    │         periodLockedAt must be null
    │         status must not be FILED or PAID
    │
    ├──► 3. Input Apportionment (if mixed-use)
    │         inputApportionmentPct validated: 0.0 – 1.0
    │         claimableInputVat = inputVat × apportionmentPct
    │
    ├──► 4. WHT V&V (WhtCertificateService)
    │         Certificates in DRAFT status flagged — must be ISSUED before remittance
    │         Missing supplier TIN → warning in readiness report
    │
    └──► 5. Re-submission Guard (ETaxDeclaration.tsx)
              Already SUBMITTED or ACCEPTED for this period → submission blocked client-side
```

### Pass / Fail States

| Check | If Passed | If Failed | Override Role |
|-------|-----------|-----------|---------------|
| Output VAT reconciles | ✅ Proceed | ❌ Re-run auto-compute VAT | `vat:write` |
| Input VAT reconciles | ✅ Proceed | ⚠ Check bills or manual entries | `vat:amend` |
| Supplier TIN on WHT certs | ✅ Proceed | ⚠ Update supplier TIN | `settings:write` |
| Period not locked | ✅ Proceed | ❌ Amendment required | `vat:amend` |
| Period not FILED / PAID | ✅ Proceed | ❌ Use status update endpoint | `vat:write` |
| Not already submitted | ✅ Proceed | ❌ Blocked (duplicate guard) | — |
| Readiness `ready: true` | ✅ Submit button enabled | ❌ Resolve Errors First (disabled) | — |

### GL Auto-Post on Filing (`AccountingService.autoPostVatFiling`)

When `recordVatFiling()` succeeds, the accounting service automatically posts the VAT settlement journal:

```
Dr Output VAT Payable (2150)    ← clears collected VAT
Cr Input VAT Recoverable (1130) ← clears claimable input
Cr VAT Payable — Net (2150)     ← net liability to remit
```

---

## 6. Phase 5 — e-Tax Submission & Payment

**Duration:** Seconds (API call) to minutes (manual portal upload)
**Trigger:** User clicks **Submit to MoR eTax** (requires `vat:file`)
**Permission:** `vat:file`, `bit:file`
**Frontend pages:** `ETaxDeclaration.tsx` (`/tax/etax`), `VatAdministration.tsx` (File Return modal)
**Backend service:** `ETaxHttpClientService`, `ETaxExportService`, `VatService.recordEtaxSubmission()`
**MoR portal:** `https://etax.mor.gov.et`

### Submission Modes (`ETAX_MODE` env var)

| Mode | Target | Behavior |
|------|--------|----------|
| `stub` (default) | Local only | Generates reference number locally, no HTTP request; `ETaxSubmissionRecord.status = DRAFT` |
| `sandbox` | `https://etax-sandbox.mor.gov.et/api/v1/declarations` | Full POST to MoR sandbox |
| `live` | `https://etax.mor.gov.et/api/v1/declarations` | Production submission |

### eTax HTTP Submission Flow (`ETaxHttpClientService.submit`)

```
submit(opts: ETaxSubmitOptions)
    │
    ├── 1. buildTaxpayerDeclaration({ tin, taxpayerName, period, vat, tot, wht, paye, bit, drrf })
    │         Combines all tax summaries into one signed MoR payload
    │         SystemSecurity.payloadHash = SHA-256(payloadJson)
    │         SystemSecurity.auditLogRef = ETAX-{random 8 chars}
    │
    ├── 2. validateTaxpayerDeclaration(declaration)
    │         Throws BadRequestException if errors[] non-empty
    │
    ├── 3. Persist ETaxSubmissionRecord { status: PENDING, mode, period, payloadJson }
    │
    ├── 4. POST https://etax.mor.gov.et/api/v1/declarations
    │         Headers: X-API-Key, X-Taxpayer-TIN, X-Request-ID (UUID)
    │         Body: TaxpayerDeclaration JSON
    │         Retry: 3 attempts, exponential back-off (2s → 4s → 8s)
    │         Timeout: 30 seconds per attempt (AbortSignal.timeout)
    │
    ├── 5. Parse response:
    │         SUCCESS  → status = ACCEPTED, store ercaReferenceNo, acceptedAt
    │         REJECTED → status = REJECTED, store rejectedAt, rejectionReason
    │         HTTP 4xx → BadRequestException (no retry)
    │         HTTP 5xx / network → retry up to MAX_RETRIES, then ServiceUnavailableException
    │
    ├── 6. On ACCEPTED:
    │         VatFiling.status = FILED
    │         VatFiling.filedAt = now()
    │         VatFiling.eTaxReference = receiptId
    │         VatFiling.periodLockedAt = now()   ← period is now immutable
    │         VatFiling.periodLockedBy = userId
    │
    └── 7. Audit: ETAX_ACCEPTED / ETAX_REJECTED with TIN, period, ref
```

### TaxpayerDeclaration Payload Structure (from `@ovds/shared`)

```typescript
TaxpayerDeclaration {
  Header: { FilingPeriodCode, TaxpayerTIN, TaxpayerName, FilingTimestamp, CalendarSystem }
  VatSummary?:                 { StandardTaxableSalesETB, OutputVatCollectedETB, ZeroRatedSalesETB,
                                  ExemptSalesETB, TotalEligibleInputVatETB, NetVatPayableRefundableETB }
  TotSummary?:                 { GoodsSalesETB, ServicesSalesETB, TotOnGoodsETB, TotOnServicesETB, TotalTotPayableETB }
  WithholdingTaxSummary?:      { Wht3PctGoodsBaseETB, Wht3PctServicesBaseETB, TotalWhtToRemitETB, ... }
  PayeSummary?:                { EmployeeCount, TotalGrossSalaryETB, TotalPitWithheldETB,
                                  TotalEmployeePensionETB, TotalEmployerPensionETB, TotalDrrfETB,
                                  NetPayableErcaETB, NetPayablePfsaETB }
  BusinessIncomeTaxSummary?:   { FiscalYear, TaxableNetIncomeETB, RegularCitETB, MatAmountETB,
                                  MatApplies, FinalTaxPayableETB, WhtCreditsAppliedETB,
                                  ProvisionalTaxPaidETB, BalanceDueETB }
  ExciseSummary?:              { ... }
  DrrfSummary?:                { Quarter, TotalLevyETB, ... }
  SystemSecurity:              { payloadHash (SHA-256), auditLogRef, submittedByUserId }
}
```

### MoR CSV Annexures (`ETaxExportService`)

All CSV files use `DD/MM/YYYY` date format (MoR portal requirement):

| Annexure | Endpoint | Contents | Key validation |
|----------|---------|---------|----------------|
| Sales Annexure (A) | `GET /tax/etax-export/vat-sales/:period` | `Buyer_TIN, Invoice_Number, Taxable_Amount, VAT_Amount, WHT_Amount, DRRF_Amount, Is_Canceled` | Buyer_TIN must be exactly 10 numeric digits — rejects export if any invalid |
| Purchase Annexure (12) | `GET /tax/etax-export/purchase-annexure/:period` | `Seller_TIN, Bill_Number, Net_Amount, Input_VAT, WHT_Deducted, HS_Code, Claimable` | Merges bills + manual `vatinputledger` entries |
| PAYE Schedule A | `GET /tax/etax-export/paye-salary/:period` | `Employee_TIN, Basic_Salary, Taxable_Income, Income_Tax, Pension_Company, Pension_Employee` | Approved payroll records only |
| WHT Certificates | `GET /tax/etax-export/wht-certificates/:period` | All ISSUED + REMITTED certificates | Non-standard TIN logged as warning (foreign vendors allowed) |
| TOT Log | `GET /tax/etax-export/tot-log/:period` | Goods (2%) and service (10%) invoices | Separate rate columns |
| DRRF Register | `GET /tax/etax-export/drrf-register/:period` | `DisasterFundContribution` rows + `invoice.drrfAmount` | Deduplicates by `invoiceNumber` |
| BIT Declaration | `GET /tax/etax-export/bit/:year` | Annual BIT with MAT comparison | Requires `IncomeTaxFiling` record |

### WHT Certificate Lifecycle

```
DRAFT   → (issue)   → ISSUED  → (remit with ercaReference)  → REMITTED
DRAFT   → (cancel)  → CANCELLED
ISSUED  → (cancel)  → CANCELLED
```

### PAYE & Pension Submission Lifecycle

```
DRAFT → (submit with ercaReference/pfsaReference) → SUBMITTED
                                                          │
                                                     (pay with bankRef)
                                                          ▼
                                                        PAID
DRAFT / SUBMITTED → (cron deadline past) → OVERDUE
```

---

## 7. Phase 6 — Compliance Scoring & Audit Trail

**Duration:** Daily (cron) + real-time on submission/payment events
**Trigger:** `cronComplianceScore` (daily 06:00 EAT); real-time on `tax.submitted` / `tax.paid` events
**Permission:** `audit_logs:read`, `ovds:read`
**Backend services:** `TaxService.getTaxDashboard()`, `AuditLogService`, `TaxService.flagOverdueTaxFilings()`
**Frontend pages:** `TaxDashboard.tsx` — compliance ring, overdue penalty summary, quarterly tax summary

### Compliance Score Calculation (`TaxService.getTaxDashboard`)

```
complianceScore = 50 (base)
    + 20  if VatFiling.status = 'PAID'   (current period)
    + 15  if IncomeTaxFiling.paid > 0    (current fiscal year)
    + 10  if DisasterFundContribution overdue count = 0
    + 5   if VatFiling OVERDUE count = 0
    = max 100
```

Score grades (frontend display):

| Score | Grade | Ring color | Dashboard message |
|-------|-------|-----------|-------------------|
| 90–100 | A | `text-emerald-500` | All filings up to date |
| 70–89 | B | `text-amber-500` | Some filings need attention |
| < 70 | C–D | `text-rose-500` | Critical filings overdue |

### Overdue Flagging (`TaxService.flagOverdueTaxFilings`)

```sql
UPDATE vatfiling SET status = 'OVERDUE'
WHERE status IN ('DRAFT', 'PENDING') AND dueDate < NOW()
```

Run by `cronFlagOverdueFilings`. Same pattern applies for `TotFiling` and `PayeDeclaration`.

### Quarterly Tax Summary (`TaxDashboard.tsx — QuarterlyTaxSummary`)

Category A taxpayers must file quarterly consolidated summaries (Proclamation No. 983/2016 Art. 19). The dashboard generates these on-demand via `POST /ovds/tax/quarterly/:quarter` and displays:

| Quarter | Gregorian months | Fields shown |
|---------|-----------------|--------------|
| Q1 | Jul–Sep | VAT net payable, WHT total, PAYE net ERCA, DRRF levy |
| Q2 | Oct–Dec | same |
| Q3 | Jan–Mar | same |
| Q4 | Apr–Jun | same |

Status transitions: `DRAFT → SUBMITTED_TO_MOR` (displayed as "✓ Submitted").

### Audit Trail (`AuditLogService`)

Every state-changing operation in the tax lifecycle emits a fire-and-forget audit log entry:

```typescript
auditLog.log(userId, action, details, companyId)
    // Fire-and-forget — never blocks the business transaction
    // Forwarded to SIEM_WEBHOOK_URL if configured
    // Skips silently if userId is not a valid UUID
```

Key audit actions in the tax lifecycle:

| Action | Fired by | When |
|--------|---------|------|
| `VAT_AUTO_COMPUTE` | `TaxService` | DRAFT filing upserted from cron/event |
| `VAT_FILING` | `TaxService` | Filing recorded as PAID |
| `VAT_PERIOD_LOCKED` | `TaxService` | Period locked manually or on acceptance |
| `VAT_APPORTIONMENT_SET` | `TaxService` | `inputApportionmentPct` updated |
| `VAT_INPUT_CREATE/UPDATE/DELETE` | `VatService` | Input ledger entry mutation |
| `VAT_OUTPUT_CREATE/UPDATE/DELETE` | `VatService` | Output ledger entry mutation |
| `VAT_RC_CREATE/DELETE` | `VatService` | Reverse-charge entry mutation |
| `VAT_REFUND_CREATE/STATUS/DELETE` | `VatService` | Refund claim mutation |
| `VAT_WH_CREATE/TOGGLE/DELETE` | `VatService` | Withholding entry mutation |
| `VAT_PERIOD_LOCK` | `VatService` | Period locked via lock endpoint |
| `VAT_APPORTIONMENT` | `VatService` | Apportionment set on filing |
| `IRN_GENERATE` | `VatService` | Invoice Registration Number generated |
| `VAT_ETAX_SUBMIT` | `VatService` | eTax submission record created |
| `ETAX_ACCEPTED/REJECTED` | `ETaxHttpClientService` | Portal response received |
| `ETAX_DECLARATION_BUILT` | `ETaxExportService` | Monthly declaration payload built |
| `ETAX_BIT_DECLARATION_BUILT` | `ETaxExportService` | Annual BIT payload built |
| `ETAX_VALIDATION` | `ETaxExportService` | Readiness check run |
| `ETAX_VAT_EXPORT` | `ETaxExportService` | CSV annexure downloaded |
| `INCOME_TAX_FILING` | `TaxService` | BIT recorded |
| `TOT_FILING` | `TaxService` | TOT filing recorded |
| `TOT_STATUS_UPDATE` | `TaxService` | TOT status changed |
| `WHT_REMITTANCE` | `TaxService` | WHT remittance summary recorded |
| `DRRF_REMITTANCE` | `TaxService` | DRRF contribution recorded |

Audit retention: ≥ 10 years per Tax Administration Proclamation No. 983/2016.

### Period Lock & Compliance Sign-off

A period becomes permanently immutable after MoR acceptance:

```
VatFiling.periodLockedAt = set      → no further mutations
VatFiling.periodLockedBy = userId   → audit trail
```

Manual lock via `VatService.lockPeriod()` is also available for roles with `vat:file`. Unlock requires DB-level intervention — not exposed via API to preserve audit trail integrity.

---

## 8. Filing Model Reference

### Prisma Models & Key Fields

| Model | Table | Unique key | Status field | Status values |
|-------|-------|-----------|--------------|---------------|
| `VatFiling` | `vatfiling` | `[companyId, period]` | `status` | `DRAFT → PENDING → FILED → PAID → OVERDUE` |
| `TotFiling` | `totfiling` | `[companyId, period]` | `status` | `DRAFT → PENDING → FILED → PAID → OVERDUE` |
| `IncomeTaxFiling` | `incometaxfiling` | `[companyId, fiscalYear]` | `status` | `DRAFT → PAID` |
| `WhtCertificate` | `wht_certificate` | `certNo` (unique) | `status` | `DRAFT → ISSUED → REMITTED → CANCELLED` |
| `PayeDeclaration` | `paye_declaration` | `[companyId, period]` | `status` | `DRAFT → SUBMITTED → PAID → OVERDUE` |
| `PensionRemittance` | `pension_remittance` | `[companyId, period]` | `status` | `DRAFT → SUBMITTED → PAID → OVERDUE` |
| `ETaxSubmissionRecord` | `etax_submission_record` | — | `status` | `DRAFT → PENDING → SUBMITTED → ACCEPTED → REJECTED → FAILED` |
| `MorAcknowledgementReceipt` | `mor_acknowledgement_receipt` | — | `verificationStatus` | `PENDING → VERIFIED → FAILED` |
| `CompanyTaxProfile` | `company_tax_profile` | `companyId` | — | One row per company |
| `TaxRule` | `tax_rule` | `code` | — | Seeded, read-only |
| `VatInputLedger` | `vatinputledger` | — | — | Manual + bill-sourced entries |
| `VatOutputLedger` | `vatoutputledger` | — | — | Manual + invoice-sourced entries |
| `VatReverseCharge` | `vatreverscharge` | — | — | Services from non-resident suppliers |
| `VatRefundClaim` | `vatrefundclaim` | — | `status` | `submitted → approved → rejected → paid` |
| `VatETaxSubmission` | *(inline in VatService)* | — | `status` | `SUBMITTED → ACCEPTED` |
| `DisasterFundContribution` | `disaster_fund_contribution` | — | `status` | `PENDING → REMITTED → OVERDUE` |

### VatFiling Extended Fields

| Field | Type | Purpose |
|-------|------|---------|
| `outputVat` | Decimal | Total output VAT from invoices + manual ledger |
| `inputVat` | Decimal | Total input VAT from bills + manual ledger |
| `netPayable` | Decimal | `max(0, outputVat − claimableInput − carryFwd)` |
| `inputCreditCarryForward` | Decimal | Excess input credit carried to next period (Art. 31 Proc. 1341/2024) |
| `inputApportionmentPct` | Decimal (0–1) | Claimable fraction for mixed-use businesses (Art. 26) |
| `collected` | Decimal | Alias for outputVat (legacy field) |
| `paid` | Decimal | Amount paid / inputVat (legacy field) |
| `projected` | Decimal | Forward estimate (set by auto-compute) |
| `periodLockedAt` | DateTime? | Set on MoR acceptance — blocks all mutations |
| `periodLockedBy` | String? | UserId who locked (or `'SYSTEM'` on auto-acceptance) |
| `eTaxReference` | String? | ERCA/MoR confirmation reference number |

### IncomeTaxFiling Extended Fields (IAS 12)

| Field | Purpose |
|-------|---------|
| `grossIncome` | Annual turnover — MAT base (2.5%) |
| `taxableIncome` | Accounting profit + permanent add-backs |
| `permanentAddBacks` | Entertainment > 5% cap + donations > 10% cap + penalties (Proc. 979/2016 Art. 25) |
| `permanentDeductions` | Tax-exempt income (dividends received, grants) |
| `timingDifferences` | Accelerated depreciation, provisions etc. (IAS 12 temporary differences) |
| `whtCredits` | WHT certificates applied against BIT balance (Proc. 1395/2025 Art. 94) |
| `provisionalPaid` | 25% × estimated BIT — paid quarterly (Sep 7 / Dec 7 / Mar 7 / Jun 7) |
| `balanceDue` | `max(regularCit, matPayable) − whtCredits − provisionalPaid − paid` |

### CompanyTaxProfile Key Fields

| Field | Values | Purpose |
|-------|--------|---------|
| `vatTotBand` | `A / B / C` | Tax regime band |
| `isVatRegistered` | boolean | Drives VAT vs TOT engine selection |
| `isTotApplicable` | boolean | Enables TOT auto-compute |
| `etaxAutoSubmit` | boolean | Auto-submit to MoR on declaration build |
| `srmIntegrated` | boolean | TASS/SRM fiscal device connected |
| `enableDeferredTax` | boolean | IAS 12 deferred tax calculation enabled |
| `fiscalYearStartMonth` | int (default 7) | EFY starts in July |
| `activeTaxes` | JSON | `{ vat: bool, tot: bool, bit: bool, pit: bool, drrf: bool, ... }` |
| `rateOverrides` | JSON? | MoR-granted special rates per tax code |

---

## 9. State Transition Diagrams

### VAT Filing

```
              invoice.created / invoice.payment_recorded
                           │
                           ▼
                        ┌──────┐
                        │ DRAFT│ ◄── autoComputeVatFiling() upserts
                        └──┬───┘     projection on every event
                           │
              User reviews + apportionment set
              Zero-declaration if no activity
                           │
                           ▼
                        ┌─────────┐
                        │ PENDING │ ◄── manual status update via UI
                        └────┬────┘
                             │
              V&V pass + User clicks "File Return"
              recordVatFiling() / or ETaxHttpClientService.submit()
                             │
                             ▼
                        ┌──────────┐
                        │  FILED   │ ← period locked (periodLockedAt set)
                        └────┬─────┘     eTaxReference stored
                             │
              Payment recorded (bank reference)
                             │
                             ▼
                        ┌──────┐
                        │ PAID │ ← terminal state, compliance score updated
                        └──────┘

  DRAFT / PENDING ──(deadline passed, cron)──► OVERDUE
  OVERDUE ──(late submission)──► FILED → PAID (with penalty)
```

### WHT Certificate

```
  ┌───────┐
  │ DRAFT │ ← createWhtCertificate() or autoGenerateFromBills()
  └───┬───┘
      │ issue()  →  certNo stamped, issueDate set
      ▼
  ┌────────┐
  │ ISSUED │ ← physical/digital certificate delivered to supplier
  └────┬───┘
       │ remit(ercaReference)  →  ercaReference stored, remittedAt set
       ▼
  ┌──────────┐
  │ REMITTED │ ← terminal, included in WHT annexure CSV
  └──────────┘

  DRAFT / ISSUED ──(cancel())──► CANCELLED
```

### PAYE Declaration & Pension Remittance

```
  ┌───────┐
  │ DRAFT │ ← generate() aggregates PayrollRecord rows
  └───┬───┘
      │ submit(ercaReference / pfsaReference)
      ▼
  ┌───────────┐
  │ SUBMITTED │
  └─────┬─────┘
        │ pay(paymentReference, bankName)
        ▼
  ┌──────┐
  │ PAID │ ← terminal
  └──────┘

  DRAFT / SUBMITTED ──(cron: deadline passed)──► OVERDUE
```

### eTax Submission Record

```
  ┌───────┐              ┌─────────┐
  │ DRAFT │ (stub mode)  │ PENDING │ (live / sandbox)
  └───────┘              └────┬────┘
                              │ HTTP POST to MoR portal
                              ▼
                    ┌────────────────────┐
                    │ SUBMITTED          │ ← awaiting portal async response
                    └──────┬─────────────┘
              ┌────────────┴─────────────┐
              ▼                          ▼
         ┌──────────┐              ┌──────────┐
         │ ACCEPTED │              │ REJECTED │
         └────┬─────┘              └──────────┘
              │
   VatFiling.periodLockedAt set
   VatFiling.status = FILED
   VatFiling.eTaxReference = receiptId
```

### MoR Acknowledgement Receipt

```
  ┌─────────┐
  │ PENDING │ ← created after ACCEPTED ETaxSubmissionRecord
  └────┬────┘
       │ verify(method: XML_SIGNATURE | QR_CODE | MANUAL)
       ▼
  ┌──────────┐
  │ VERIFIED │ ← documentHash checked, verifiedAt stamped
  └──────────┘
  ┌────────┐
  │ FAILED │ ← hash mismatch or manual rejection
  └────────┘
```

---

## 10. Cron Automation Schedule

> Full cron schedule in [automation-and-vv.md](./10-frameworks/automation-and-vv.md). This table maps each job to the lifecycle phase and the backend method it calls.

| Cron Job | Schedule (EAT) | Phase | Method / Event | What It Does |
|----------|---------------|-------|----------------|--------------|
| `cronFlagOverdueFilings` | Daily 01:00 | Phase 6 | `TaxService.flagOverdueTaxFilings()` | Sets `status = OVERDUE` on past-due DRAFT/PENDING VatFiling and TotFiling rows |
| `cronRecurringInvoices` | Daily 06:00 | Phase 1 | `invoiceService` | Generates recurring invoices → fires `invoice.created` → feeds VAT |
| `cronComplianceScore` | Daily 06:00 | Phase 6 | `TaxService.getTaxDashboard()` | Recalculates compliance score, triggers alerts |
| `cronVatAutoCompute` | 1st of month 07:00 | Phase 2 | `TaxService.autoComputeVatFiling()` | Aggregates prior-month invoices/bills → upserts DRAFT `VatFiling` with carry-forward |
| `cronTotAutoCompute` | 1st of month 07:30 | Phase 2 | `TaxService.autoComputeTotFiling()` | Category B/C only → upserts DRAFT `TotFiling` |
| `cronVatThresholdMonitor` | 1st of month 09:00 | Phase 3 | `TaxService.getThresholdMonitorStatus()` | Broadcasts `THRESHOLD_ALERT` WebSocket at 90%/100% of ETB 2M |
| `cronMonthlyDepreciation` | Last day of month 23:00 | Phase 1 | `AccountingService` | Posts IAS 16 depreciation → affects BIT taxable profit |
| VAT filing reminder | 20th of month 08:00 | Phase 3/4 | Notification | 10-day warning before 30th deadline |
| TOT filing reminder | 22nd of month 08:00 | Phase 3/4 | Notification | 8-day warning |
| WHT unremitted alert | 25th of month 08:00 | Phase 3/4 | Notification | Flags `WhtCertificate` rows with `status = ISSUED` (not yet remitted) |
| Zero-declaration alert | 25th of month 08:00 | Phase 2/4 | `TaxService.createZeroDeclarationFiling()` | Creates zero DRAFT if no filing exists for the period |
| DRRF quarterly reminder | 10th of Mar/Jun/Sep/Dec | Phase 3/4 | Notification | 5-day warning before 15th quarterly deadline |
| BIT annual reminder | October 1st 08:00 | Phase 3 | Notification | 37-day warning before November 7 |
| BIT provisional Q1 | August 31 08:00 | Phase 3 | Notification | 7-day warning before September 7 installment |
| BIT provisional Q2 | November 30 08:00 | Phase 3 | Notification | 7-day warning before December 7 installment |
| IoT VAT reconcile | On `iot.billing.trigger.created` | Phase 2 | `TaxAutomationService.handleIotBillingTrigger()` | Updates DRAFT VatFiling from IoT fiscal event, broadcasts `IOT_VAT_RECONCILED` |

### Real-Time Event-Driven Automation (`TaxAutomationService`)

In addition to cron, these `@OnEvent` handlers run synchronously when transactions occur:

| Event | Handler | What updates |
|-------|---------|-------------|
| `invoice.created` | `handleInvoiceCreated` | Annual revenue → threshold check → enqueue `QUEUES.TAX_AUTOMATION` |
| `invoice.payment_recorded` (×2) | `handlePaymentRecorded` + `handleInvoicePaymentRecorded` | Re-compute VAT reconciliation → upsert DRAFT VatFiling; compute TOT if not VAT-registered → upsert TotFiling; enqueue `QUEUES.DOCUMENT_SIGNING` |
| `bill.paid` | `handleBillPaid` | WHT accrual broadcast if `whtApplicable` and amount ≥ threshold |
| `iot.billing.trigger.created` | `handleIotBillingTrigger` | Update DRAFT VatFiling.netPayable from IoT revenue |

---

## 11. Compliance Gate Checkpoints

Each phase has a hard gate. A filing cannot advance to the next phase without passing its gate.

| Gate | Phase | Hard / Soft | Check | Failure consequence |
|------|-------|------------|-------|---------------------|
| **G1: Double-Entry Integrity** | 1 | Hard | `sum(debit) = sum(credit)` inside `withTx()` | Transaction rolled back |
| **G2: Period Format Valid** | 1/2 | Hard | `TaxService.parsePeriod()` — `YYYY-MM`, month 01–12 | `BadRequestException` |
| **G3: Tenant Scope Present** | 1 | Hard | `withCompanyWhere` / `withCompanyData` — `companyId` must exist | `TenantScopingViolation` |
| **G4: TIN Format** | 1/5 | Hard (export) | `ETaxExportService.validateTIN()` — 10 numeric digits | CSV export rejected (`BadRequestException`) |
| **G5: IRN / ERCA QR** | 1 | Soft | `VatService.generateIrn()` — SHA-256 hash written to `Invoice.irn` | Non-fatal (best-effort write); invoice non-compliant with OVDS Dir. 1142/2026 |
| **G6: Period Not Locked** | 2/4 | Hard | `VatFiling.periodLockedAt` must be null | `BadRequestException` — create amendment instead |
| **G7: Period Not Filed/Paid** | 2/4 | Hard | `status` must not be `FILED` or `PAID` | `BadRequestException` |
| **G8: eTax Payload Valid** | 5 | Hard | `validateTaxpayerDeclaration(declaration).length === 0` | `BadRequestException` with all errors listed |
| **G9: No Duplicate Submission** | 5 | Soft (client) | `ETaxSubmission` already `SUBMITTED` or `ACCEPTED` for period | Submit button disabled in `ETaxDeclaration.tsx` |
| **G10: V&V Output VAT Match** | 4/5 | Soft (warning) | Sales annexure VAT ≈ `VatFiling.outputVat` (±ETB 1) | Error in readiness report — submit button shows "Resolve Errors First" |
| **G11: WHT TIN Complete** | 4/5 | Soft (warning) | All `WhtCertificate` rows have `supplierTin` | Warning in readiness report |
| **G12: Apportionment Range** | 4 | Hard | `apportionmentPct` ∈ [0, 1] | `BadRequestException` |
| **G13: Compliance Score for Period Lock** | 6 | Soft | Score ≥ 80% recommended before `period_close:admin` | Advisory — period lock can still be forced |

---

## 12. Error Handling & Recovery

| Scenario | System Response | Recovery Path |
|----------|-----------------|---------------|
| **Network disconnect during eTax POST** | `ETaxHttpClientService` retries up to 3× with exponential back-off (2s → 4s → 8s); `ETaxSubmissionRecord.status` stays `PENDING` | Re-trigger submission once network restored; check `ETaxSubmissionRecord` for last error |
| **MoR portal returns HTTP 5xx** | Same retry logic; after 3 failures throws `ServiceUnavailableException` | Submission queued via `OutboxEvent` for reliable retry; operator notified |
| **MoR portal returns HTTP 400/422** | Immediate `REJECTED` status — no retry; `rejectionReason` stored | Fix payload validation errors from `validateTaxpayerDeclaration()` and re-submit |
| **V&V fails on submission** | `ETaxExportService.validateDeclarationReadiness()` returns `ready: false` with `errors[]`; submit button disabled | Resolve each error (re-run auto-compute, add missing bills, fix TINs) then re-check readiness |
| **Period already locked** | `BadRequestException: Period X is locked` | Create a corrective journal entry (reversal) in the new open period; never modify locked data |
| **Period status FILED or PAID** | `BadRequestException: Period X is already FILED/PAID` | Use the status update endpoint or the amendment workflow |
| **WHT certificate missing TIN** | Warning in readiness report; CSV export proceeds with warning logged | Update `supplierTin` on the vendor record; re-generate WHT certificates |
| **Duplicate invoice TIN in VAT Sales CSV** | `BadRequestException` — export rejected | Correct `customerTin` on the invoice; re-run export |
| **IoT fiscal invoice offline** | `FiscalDeviceService.queueOfflineInvoice()` → `SyncEngine` queues entry with `PENDING` status | `SyncEngine` replays on reconnect; `TaxAutomationService.handleIotBillingTrigger()` updates VatFiling when synced |
| **Zero activity in period** | `cronZeroDeclAlert` (25th) triggers `createZeroDeclarationFiling()` | DRAFT zero filing created; user submits zero return to MoR via `etax.mor.gov.et` before 30th |
| **Missed VAT deadline** | `flagOverdueTaxFilings()` sets `status = OVERDUE`; compliance score reduced; penalty calculator auto-invoked | Submit late via `etax.mor.gov.et`; record ERCA late reference; penalty estimate shown at `/tax/penalty-calculator` |
| **BIT carry-forward / WHT credit mismatch** | `IncomeTaxFiling.balanceDue` = `taxPayable − whtCredits − provisionalPaid − paid`; negative balance shown | Adjust `whtCredits` and `provisionalPaid` fields via `tax.bit.record` oRPC procedure |
| **Offline sync entry conflict** | `SyncEngine` applies `LAST_WRITE_WINS` (default) or escalates to `MANUAL` per `conflictResolution` setting | Review `SyncQueueEntry.status = CONFLICT` in the sync dashboard |
| **eTax API key expired** | HTTP 401 from MoR portal → `ServiceUnavailableException` | Renew API key with MoR; update `ERCA_API_KEY` env var; no data loss (payload stored in `ETaxSubmissionRecord`) |

### ETAX_MODE Transition for Production Go-Live

When moving from development to production:

1. Set `ETAX_MODE=sandbox` first — run full submission flow against MoR sandbox to verify payload format.
2. Fix any `validateTaxpayerDeclaration()` errors surfaced by sandbox.
3. Set `ETAX_MODE=live` and configure `ERCA_API_KEY` and `COMPANY_TIN` in production environment.
4. First live submission will set `periodLockedAt` — ensure all ledger entries are correct beforehand.

---

## Legal Reference

| Tax | Proclamation / Regulation | Key Articles |
|-----|--------------------------|-------------|
| VAT (15%) | Proclamation No. 1341/2024 | Art. 8 (reverse charge), Art. 24 (accrual basis), Art. 26 (partial exemption), Art. 31 (carry-forward) |
| VAT registration threshold | Regulation No. 570/2025 | ETB 2,000,000 annual turnover |
| VAT withholding (3%) | Proclamation No. 1395/2025 | WHT on goods ≥ ETB 10K, services ≥ ETB 500 |
| IRN mandate | OVDS Directive No. 1142/2026 | SHA-256 IRN on every fiscal invoice |
| BIT / CIT (30%) | Proclamation No. 979/2016 | Art. 19 (CIT rate), Art. 25 (non-deductible add-backs) |
| MAT (2.5%) | Proclamation No. 979/2016 | Minimum Alternative Tax on turnover |
| TOT (2% / 10%) | Proclamation No. 1395/2025 | Category B/C taxpayers below VAT threshold |
| DRRF (1–5%) | Regulation No. 570/2025 | Disaster Risk Response Fund quarterly levy |
| PIT (0–35%) | Proclamation No. 1395/2025 | Art. 7–11 (payroll), progressive brackets |
| Pension (7% + 11%) | Proclamation No. 1268/2023 | Private org. employee social security |
| Tax administration | Proclamation No. 983/2016 | Art. 19 (quarterly summary — Cat A), Art. 26 (penalties), audit retention ≥ 10 years |
| MoR establishment | Proclamation No. 1097/2018 | Restructured ERCA → Ministry of Revenues |
| Excise Tax | Proclamation No. 1186/2020 | 5–500% on excisable goods |
| Stamp Duty | Proclamation No. 110/1998 | Fixed / 0.1–2% on instruments |

> **MoR portals:** e-Tax `etax.mor.gov.et` · TASS `tass.mor.gov.et` · Customs `ects.mor.gov.et` · Official `mor.gov.et`

---

*This lifecycle is the operational backbone of the OVDS tax declaration system. It dynamically inherits all rates, deadlines, and permissions from [`CORE-CONFIG.md`](./CORE-CONFIG.md). All related documentation files reference both this lifecycle and the core config via the standard reference block.*
