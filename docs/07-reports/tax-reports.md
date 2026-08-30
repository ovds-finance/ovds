<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Tax & Compliance Reports

> **Part of:** [Reports](./README.md)
>
> **Requires:** Login · `vat:read` · `reports:read`
>
> **Navigate to:** **Reports → Sales Tax tab** and **Reports → Tax Liability tab**

OVDS generates all tax reports directly from posted transactions — invoices, bills, and payments. Every figure on every tax report can be traced back to a source document.

---

## Sales Tax Summary (Monthly VAT)

**Route:** `/reports?type=tax` — requires `vat:read`

Navigate to **Reports → Sales Tax tab**.

The Sales Tax Summary shows the monthly VAT position — output VAT collected, input VAT paid, and the net amount due to or refundable from ERCA.

| Column | Description |
|--------|-------------|
| Month | Calendar month |
| Taxable Revenue | Revenue on invoices subject to 15% VAT |
| Output VAT (15%) | VAT collected from customers |
| Input VAT Paid | VAT on bills from VAT-registered vendors |
| Net VAT | Output − Input (positive = payable; negative = refund/carry-forward) |
| WHT Deducted | Withholding Tax deducted from vendor payments in the period |

### How to Run
1. Go to **Reports → Sales Tax** tab.
2. Select the month or custom date range.
3. Click **Generate**.
4. Click **Export CSV** — download the annual summary for ERCA submission cross-referencing.

### Annual View
Select the full fiscal year (August–July) to see a 12-month rolling table. Use this to:
- Cross-check with VAT returns filed on the eTax portal
- Identify months where Input VAT exceeded Output VAT (potential refund or carry-forward)
- Prepare the VAT input for the annual BIT return

---

## WHT Report

**Route:** `/reports?type=wht` — requires `vat:read`

Shows all Withholding Tax deducted from vendor payments in the period, broken down by WHT type.

| Column | Description |
|--------|-------------|
| Vendor | Vendor name and TIN |
| Payment Date | Date payment was made |
| Gross Amount | Amount before WHT deduction |
| WHT Type | Services 2%, Goods 2%, Non-Resident 15%, Corporate Rent 30%, etc. |
| WHT Amount | Amount withheld |
| Net Paid | Gross − WHT |
| Certificate # | WHT certificate number issued to the vendor |

### How to Run
1. Go to **Reports → Sales Tax** tab → **WHT Report**.
2. Select the month.
3. Click **Export CSV** — use for the monthly WHT return on the eTax portal.

---

## Tax Liability Dashboard

**Route:** `/tax/liability-estimator` — requires `vat:read`

Navigate to **Dashboards → Tax Liability Estimator** or **Reports → Tax Liability tab**.

The Tax Liability Dashboard consolidates all outstanding and estimated tax obligations in one view — updated in real time as invoices and bills are posted.

| Obligation | Calculation | Deadline |
|-----------|-------------|---------|
| VAT Payable | Output VAT − Input VAT | 30th of following month |
| TOT Payable | Revenue × 2% or 10% (Category B only) | 30th of following month |
| WHT Unremitted | 2% on qualifying vendor bills not yet remitted | 30th of following month |
| Non-Resident WHT | 15% on foreign service payments | 30th of following month |
| DRRF Levy | 1–5% on applicable transactions | 15th of last month of quarter |
| BIT Estimate | 30% of estimated net profit (or MAT 2.5%) | November 7 |

### Tax Calendar Widget

Shows all upcoming tax deadlines with a countdown, color-coded by urgency:
- 🔴 Red — 3 days or fewer
- 🟡 Amber — 4–7 days
- ⚪ White — more than 7 days

### Tax Liability Estimator

The estimator provides a live pre-computation of each tax type before the period closes — useful for cash-flow planning before the monthly filing deadline.

| Tax Type | Calculation Basis | Updated |
|---|---|---|
| VAT Output | Sum of VAT-liable invoices for the period | Real-time on each invoice save |
| VAT Input | Sum of input VAT on bills | Real-time on each bill save |
| **Net VAT** | Output − Input | Live |
| TOT | Sum of TOT-liable revenue × rate | Real-time |
| WHT | Sum of qualifying vendor payments × rate | Real-time |
| **Total estimated liability** | Net VAT + TOT + WHT | Live |

**Cash Required by Deadline** — the estimator shows the total ETB amount you need to have available by each filing deadline. Use this to plan bank transfers in advance.

---

## Income vs Expense Summary

**Route:** `/reports?type=income-expense` — requires `reports:read`

A simplified view of total income and total expenses for the period — useful for a quick management snapshot without running the full P&L.

| Line | Description |
|------|-------------|
| Total Income | Sum of all posted invoice amounts |
| Total Expenses | Sum of all posted bills and expenses |
| Net Position | Income − Expenses (before tax) |

---

## Payroll Tax Reports

For PIT, pension, and payroll-specific reports, see [Payroll & Attendance Reports](./payroll-reports.md).

---

## Related Topics

> **Lifecycle mapping:** Tax reports provide input to [Phase 3 — Analysis & Liability Estimation](./../FILING-LIFECYCLE.md#4-phase-3--analysis--liability-estimation). Output VAT, Input VAT, and Net VAT are computed and filed per [`FILING-LIFECYCLE.md`](./../FILING-LIFECYCLE.md) Phases 2–5. All rates and deadlines are in [`CORE-CONFIG.md`](./../CORE-CONFIG.md#7-tax-rate--deadline-summary).

| Topic | Where to go |
|-------|-------------|
| File VAT on the eTax portal | [Tax & Compliance → VAT & TOT](../06-tax-compliance/vat-and-tot.md) |
| WHT types and rates | [Tax & Compliance → WHT & Other Taxes](../06-tax-compliance/wht-and-other-taxes.md) |
| BIT calculation and filing | [Tax & Compliance → BIT & DRRF](../06-tax-compliance/bit-and-drrf.md) |
| Generate WHT certificates for vendors | [Financial Ops → Creating a Bill](../04-financial-ops/creating-a-bill.md#wht-certificates) |
| Financial P&L and Balance Sheet | [Financial Reports](./financial-reports.md) |



