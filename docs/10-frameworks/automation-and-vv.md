<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Automation & Verification Framework

> **Part of:** [Frameworks & Reference](./README.md)
>
> **Requires:** Login · `ovds:read`

This guide covers two complementary topics: the **Accounting Process Automation (APA)** map showing what OVDS handles automatically, and the **Verification & Validation (V&V) Framework** defining the checks OVDS runs before every tax filing.

---

## Part 1 — Accounting Process Automation

OVDS replaces manual, repetitive ovds tasks with automated workflows. The table below shows what is fully automated, what is near-automated, and what still requires a human action.

### Automation Coverage Summary

| Process | Before OVDS | After OVDS | Manual Steps Remaining |
|---------|------------|-----------|----------------------|
| Recurring invoice generation | Create each invoice manually | Zero | None — cron generates and emails |
| Overdue invoice flagging | Check dates daily | Zero | None — cron flags at 01:00 EAT |
| Customer payment matching | Match bank statements manually | Near-zero | Review unmatched only |
| WHT calculation | Calculate 2% per bill manually | Zero | None — auto on every qualifying bill |
| VAT computation | Sum invoices/bills in spreadsheet | Zero | Review draft → click Submit |
| Payroll PIT calculation | Apply tax brackets per employee | Zero | HR clicks Generate |
| Monthly depreciation | Manual journal entry per asset | Zero | None — cron last day of month |
| Tax deadline reminders | Manual calendar entries | Zero | None — 13 automated notifications |
| Bank reconciliation | Match each statement line manually | Near-zero | Confirm proposed matches |
| OCR bill extraction | Re-type vendor invoice data | < 30 seconds | Review extracted values |
| Three-way PO/GRN/Bill match | Manual comparison | Auto-flagged | Investigate discrepancies only |
| IoT/POS transaction posting | Manual receipt entry | Zero | None — webhook → GL in real time |

---

### Cron Job Schedule

All automated processes run on scheduled cron jobs. Every execution is logged in the Audit Trail.

| Job | Schedule (EAT) | What It Does |
|-----|:--------------:|--------------|
| `cronFlagOverdueInvoices` | Daily 01:00 | Moves `PENDING` invoices past due date → `OVERDUE` |
| `cronRecurringInvoices` | Daily 06:00 | Generates and emails recurring invoices |
| `cronPayrollReminder` | 1st of month 07:00 | Notifies HR to run payroll |
| `cronVatAutoCompute` | 1st of month 07:00 | Aggregates invoices/bills → creates `VatFiling` (DRAFT) |
| `cronTotAutoCompute` | 1st of month 07:30 | Category B only — creates `TotFiling` (DRAFT) |
| `cronVatThresholdMonitor` | 1st of month 09:00 | Warns at 80% and 100% of ETB 2M VAT threshold |
| `cronMonthlyDepreciation` | Last day of month 23:00 | Calculates and posts depreciation for all active assets |
| VAT reminder | 20th of month 08:00 | 10-day warning — VAT due on 30th |
| TOT reminder | 22nd of month 08:00 | 8-day warning — TOT due on 30th |
| WHT reminder | 25th of month 08:00 | Reminder if unremitted WHT > 0 |
| Zero-declaration alert | 25th of month 08:00 | Alert if no VAT/TOT filing submitted for the month |
| DRRF reminder | 10th of Mar/Jun/Sep/Dec | 5-day warning before quarterly deadline |
| BIT annual reminder | October 1st 08:00 | 37-day warning before November 7 filing |
| BIT provisional reminder | 1st of Sep/Dec/Mar/Jun | 6-day warning before each quarterly installment |

---

### Key Automated Workflows in Detail

#### AR — Automated Payment Matching
When a customer pays via Telebirr or Chapa:
1. Gateway sends a webhook to OVDS.
2. OVDS matches the payment reference to the open invoice using a 5-signal scoring engine:

| Signal | Score | When Applied |
|--------|:-----:|--------------|
| ERCA QR code match | 97+ | QR reference in the payment matches invoice |
| Exact reference match | 95+ | Bank/gateway reference exactly matches invoice number |
| Fuzzy reference match | 80+ | Reference within 20% edit distance |
| Amount + Date match | 65+ | Same amount on the same date |
| Amount only | 40+ | Same amount, different date |

- Score ≥ 85 → auto-reconciled, no review needed
- Score 50–84 → proposed match, one-click confirm
- Score < 50 → unmatched, manual review required

#### AP — WHT Auto-Calculation
On every bill save, OVDS checks:
- Does the vendor have a TIN on file?
- Does the bill amount meet the threshold (≥ ETB 500 for services / ≥ ETB 10,000 for goods)?

If both conditions are met, WHT (2%) is calculated and displayed as a separate line. On payment: `Dr AP (gross) · Cr Cash (net) · Cr WHT Payable`.

#### Payroll — GL Auto-Posting (IAS 19)
When payroll is approved, OVDS posts:
```
Dr  Salary Expense         (gross payroll)
    Cr  Salary Payable     (net pay to employees)
    Cr  PIT Payable        (income tax withheld)
    Cr  Pension Payable    (employee + employer pension)
    Cr  Other Deductions   (loans, advances)
```

#### Fixed Assets — Monthly Depreciation Cron
On the last day of every month at 23:00 EAT:
```
Dr  Depreciation Expense
    Cr  Accumulated Depreciation
```
Calculated as: `(Cost − Residual Value) ÷ Useful Life ÷ 12` per asset. Safe to re-run — skips assets already depreciated for the period.

#### Period Close — Pre-Close Verification
Before a period can be locked, OVDS automatically checks:
```
GET /period-close/:year/:month/trial-balance
→ { isBalanced: true/false, totalDebits, totalCredits, difference }
```
If `isBalanced: false`, the lock is blocked until the imbalance is resolved.

---

## Part 2 — Verification & Validation (V&V) Framework

OVDS runs automated pre-submission checks before every tax filing to reduce MoR audit risk.

Navigate to **Frameworks → V&V Framework** (`/vandv`).

---

### Ethiopian Taxpayer Categories

| Category | Annual Turnover | Tax Type | Filing |
|----------|----------------|---------|--------|
| A | ≥ ETB 1,000,000 | VAT + BIT 30% | Monthly VAT + Annual BIT |
| B | ETB 500K – 1M | TOT (2%/10%) + BIT | Monthly TOT + Annual BIT |
| C | < ETB 500K | TOT (2%/10%) | Monthly TOT (progressive) |

---

### VAT Verification Checks

| Check | What Is Verified | If Failed |
|-------|----------------|-----------|
| Output VAT = Sum of invoice VAT | All invoices included in output | Reconcile missing invoices |
| Input VAT = Sum of bill VAT | All eligible purchase VAT captured | Add missing bills |
| Net VAT = Output − Input | Arithmetic accuracy | Re-compute from source |
| VAT-registered vendor only | Input VAT claimed only from registered vendors | Remove unregistered vendor VAT |
| TIN format | All TINs are 15-digit format | Update vendor/customer profile |
| ERCA QR on all invoices | Every issued invoice has a valid NBE-IQR QR | Regenerate QR for affected invoices |

---

### WHT Verification Checks

| Check | Threshold | Action if Missing |
|-------|-----------|------------------|
| Services WHT applied | Bill ≥ ETB 500 | Verify vendor TIN is on file |
| Goods WHT applied | Bill ≥ ETB 10,000 | Verify vendor TIN is on file |
| WHT Exempt flag | Vendor marked exempt | Verify exemption certificate in vendor profile |
| WHT remittance timing | By 30th of following month | Check WHT Payable balance before closing |
| WHT certificates generated | Monthly per vendor | Go to Purchases → WHT Certificates |

---

### Payroll (PAYE) Verification Checks

| Check | Description |
|-------|-------------|
| PIT bracket application | Each employee's PIT calculated per Proclamation 1395/2025 brackets |
| Pension cap applied | Employee and employer pension capped at ETB 15,000 insurable earnings |
| Gross-to-net reconciliation | Net pay = Gross − PIT − Employee Pension − Other Deductions |
| Headcount reconciliation | Payroll record count = active employee count for the period |
| GL posting balance | Salary expense debit = Salary payable + PIT payable + Pension payable |

---

### MoR Audit Alignment Checks

Before each filing, OVDS runs these cross-checks automatically:

| Check | Why It Matters |
|-------|---------------|
| BIT revenue = VAT-reported turnover | ERCA cross-references these — inconsistency is an audit trigger |
| Zero-declaration flag | Months with no transactions must still be filed — OVDS flags these |
| Penalty estimator | If a deadline will be missed, `/tax/penalty-calculator` shows the projected cost before late filing |
| Compliance score | Timely, accurate filing improves the live score in **Compliance Auditor** (`/compliance-auditor`) |

---

### Compliance Score Components

| Check | Weight | Passes When |
|-------|:------:|-------------|
| VAT Return Filed | 25% | Current month VAT return submitted |
| BIT Filed | 20% | Current fiscal year BIT return filed |
| DRRF Remitted | 20% | No overdue DRRF contributions |
| Payroll Configured | 15% | At least one payroll approved this month |
| Audit Clean | 10% | No open CRITICAL audit findings |
| IFRS Standards Enabled | 10% | At least one IFRS standard configured |

**Score Grades:**
- 🟢 A (90–100%) — Fully compliant
- 🟡 B (75–89%) — Minor gaps
- 🟠 C (60–74%) — Needs attention
- 🔴 D/F (0–59%) — Significant gaps / Non-compliant

---

## Related Topics

> **Lifecycle mapping:** This document maps to all phases of the [Digital Automated Filing Lifecycle](./../FILING-LIFECYCLE.md). Part 1 (Automation) covers cron-driven [Phase 2 — Tax Calculation](./../FILING-LIFECYCLE.md#3-phase-2--tax-calculation--accrual). Part 2 (V&V) covers [Phase 4 — V&V Pre-Submission](./../FILING-LIFECYCLE.md#5-phase-4--v&v-pre-submission-checks) and feeds into [Phase 6 — Compliance Scoring](./../FILING-LIFECYCLE.md#7-phase-6--compliance-scoring--audit-trail). All tax rates, thresholds, and deadlines are defined in [`CORE-CONFIG.md`](./../CORE-CONFIG.md).

| Topic | Where to go |
|-------|-------------|
| VAT monthly filing workflow | [Tax & Compliance → VAT & TOT](../06-tax-compliance/vat-and-tot.md) |
| WHT certificates and filing | [Tax & Compliance → WHT & Other Taxes](../06-tax-compliance/wht-and-other-taxes.md) |
| Payroll generation | [Advanced → HR & Payroll](../08-advanced/hr-and-payroll.md#payroll-generation) |
| Period lock workflow | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) |
| Penalty calculator | Settings → Tax → Penalty Calculator (`/tax/penalty-calculator`) |
| Compliance Auditor dashboard | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md#compliance-auditor-dashboard) |



