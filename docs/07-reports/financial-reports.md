<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Financial Reports

> **Part of:** [Reports](./README.md)
>
> **Requires:** Login · `reports:read` · `reports:financial:full` (for ratios, health score, IFRS 9)
>
> **Navigate to:** **Reports → Financial tab** (`/reports`)

All financial reports are IFRS-aligned, support comparative periods, drill down to individual GL entries, and export to PDF and CSV. **Lifecycle context:** feeds [Phase 3 — Analysis](./../FILING-LIFECYCLE.md#4-phase-3--analysis--liability-estimation) and [Phase 5 — e-Tax Submission](./../FILING-LIFECYCLE.md#6-phase-5--etax-submission--payment). GL codes: [`CORE-CONFIG.md`](./../CORE-CONFIG.md#6-gl-account-map).

---

## Balance Sheet

**Route:** `/reports?type=bs` — requires `reports:bs:read`

The Balance Sheet shows assets, liabilities, and equity at a single point in time — the company's financial position. Structured per **IFRS IAS 1** (Statement of Financial Position).

### Features
- Current vs Non-current classification for all items
- Comparative period column (prior year or prior month)
- Drill-down from any line to the underlying GL account transactions
- Export: PDF, CSV

### Structure
```
ASSETS
  Current Assets
    Cash and Cash Equivalents
    Accounts Receivable (net of ECL provision)
    Inventory (at lower of cost or NRV — IAS 2)
    Prepaid Expenses
  Non-Current Assets
    Property, Plant & Equipment (cost less accumulated depreciation)
    Right-of-Use Assets (IFRS 16 leases)
    Intangible Assets
    Long-term Investments

LIABILITIES
  Current Liabilities
    Accounts Payable
    VAT Payable
    Accrued Expenses
    Short-term portion of Loans
    Lease Liability (current — IFRS 16)
  Non-Current Liabilities
    Long-term Loans
    Lease Liability (non-current — IFRS 16)
    Deferred Tax Liability (IAS 12)

EQUITY
  Share Capital
  Retained Earnings
  Current Period Profit / (Loss)
```

### How to Run
1. Go to **Reports → Financial** tab.
2. Select **Balance Sheet**.
3. Set the **reporting date** (defaults to today).
4. Optionally enable **Comparative Period** — select prior year or prior month.
5. Click **Generate** — the report renders instantly from live data.
6. Click **Export PDF** or **Export CSV**.

---

## Profit & Loss (Income Statement)

**Route:** `/reports?type=pl` — requires `reports:pl:read`

Shows revenue, expenses, and net profit for a period. Structured per **IFRS IAS 1** (Statement of Comprehensive Income).

### Features
- Gross Profit → Operating Profit → Net Profit breakdown
- Drill-down per expense category to source invoices and bills
- Comparative period support
- Export: PDF, CSV

### Structure
```
Revenue
  Sales Revenue
  Service Revenue
  Other Income
Cost of Goods Sold
  Opening Inventory + Purchases − Closing Inventory
                    ───────────
Gross Profit
Operating Expenses
  Salaries & Benefits
  Rent & Utilities
  Depreciation & Amortisation
  Marketing & Advertising
  Administrative Expenses
                    ───────────
Operating Profit (EBIT)
ovds Costs (Interest on loans / leases)
                    ───────────
Profit Before Tax
Income Tax (BIT 30% or MAT 2.5% of turnover — whichever is higher)
                    ───────────
Net Profit After Tax
```

### How to Run
1. Go to **Reports → Financial** tab → **Profit & Loss**.
2. Set the **period** (month, quarter, or custom date range).
3. Enable **Comparative Period** if needed.
4. Click **Generate**.

---

## Trial Balance

**Route:** `/reports?type=trial-balance` — requires `reports:gl:read`

Lists all GL account balances (debit and credit) for a period. Verifies that total debits = total credits — a fundamental accounting control.

### Versions
- **Unadjusted** — before period-end journal entries (depreciation, accruals, provisions)
- **Adjusted** — after all period-end adjustments are posted

### How to Run
1. Go to **Reports → Financial** tab → **Trial Balance**.
2. Select the period end date.
3. Choose Adjusted or Unadjusted.
4. Click **Export CSV** to share with your external auditor.

---

## Cash Flow Statement

**Route:** `/reports?type=cf` — requires `reports:cf:read`

Shows cash inflows and outflows classified by activity type. Prepared under the **indirect method**, starting from net profit and adjusting for non-cash items. **IFRS IAS 7** compliant.

### Structure
```
Operating Activities
  Net Profit
  Adjustments for non-cash items:
    + Depreciation & Amortisation
    + ECL Provision movement
    ± Changes in working capital:
        (Increase)/Decrease in Receivables
        (Increase)/Decrease in Inventory
        Increase/(Decrease) in Payables
  = Net Cash from Operating Activities

Investing Activities
  Purchase of fixed assets
  Proceeds from asset disposals
  = Net Cash from Investing Activities

Financing Activities
  Loan drawdowns
  Loan repayments
  Lease liability payments
  Dividends paid
  = Net Cash from Financing Activities

Net Change in Cash
Opening Cash Balance
Closing Cash Balance
```

---

## Statement of Changes in Equity

**Route:** `/reports/equity` — requires `reports:financial:read`

Shows the movement in each equity account during the period. Required for **Tier 1 and Tier 2 IFRS companies**.

### Columns
| Column | Description |
|--------|-------------|
| Share Capital | Issued and paid-up share capital |
| Retained Earnings | Accumulated profits less dividends |
| Current Period P&L | Net profit or loss for the period |
| Other Comprehensive Income | FX translation differences, actuarial gains/losses |
| Total Equity | Sum of all equity components |

---

## General Ledger

**Route:** `/reports?type=gl` — requires `reports:gl:read`

All journal entries for a period, grouped by GL account. The source of truth for every number on the financial statements.

### Features
- Filter by account code, date range, reference number, or user
- Drill down from any Balance Sheet or P&L line to the underlying entries
- Export to CSV for external audit

### How to Use
1. Go to **Reports → Financial** → **General Ledger**.
2. Set the date range.
3. Optionally filter by a specific account code.
4. Click any journal entry line to see the source document (invoice, bill, payment, manual entry).

---

## AR & AP Aging Reports

### AR Aging — `/reports/ar-aging`

Outstanding customer invoices grouped by how long they have been overdue. Key input for the IFRS 9 ECL provision and the collections workflow.

| Bucket | Overdue Period |
|--------|---------------|
| Current | Not yet due |
| 1–30 days | Mildly overdue |
| 31–60 days | Moderately overdue |
| 61–90 days | Seriously overdue |
| 90+ days | Critical — potential write-off |

### AP Aging — `/reports/ap-aging`

Same structure as AR Aging, but for outstanding vendor bills. Use to plan cash outflows and identify overdue payables before supplier relations deteriorate.

**How to run either:**
1. Go to **Reports → Financial** → select **AR Aging** or **AP Aging**.
2. Set the **as-at date** (defaults to today).
3. Optionally filter by customer or vendor.
4. Export: PDF, CSV.

---

## Financial Ratios

**Route:** `/reports?type=ratios` — requires `reports:financial:full`

OVDS calculates key ratios automatically from live data. Navigate to **Reports → Financial → Ratios**.

| Ratio | Formula | Healthy Target |
|-------|---------|---------------|
| Current Ratio | Current Assets ÷ Current Liabilities | > 1.5 |
| Quick Ratio | (Cash + Receivables) ÷ Current Liabilities | > 1.0 |
| Gross Profit Margin | (Revenue − COGS) ÷ Revenue × 100 | Industry-dependent |
| Net Profit Margin | Net Profit ÷ Revenue × 100 | Industry-dependent |
| Return on Assets (ROA) | Net Profit ÷ Total Assets × 100 | > 5% |
| Debt-to-Equity | Total Liabilities ÷ Total Equity | < 2.0 |
| AR Days Outstanding | (Receivables ÷ Revenue) × 365 | < payment terms |
| AP Days Outstanding | (Payables ÷ COGS) × 365 | ≥ payment terms |

Each ratio is shown with a trend line for the trailing 12 months.

---

## Business Health Score

**Route:** `/reports?type=health-score` — requires `reports:financial:full`

A single 0–100 composite score of overall financial health. Updates in real time as transactions are posted.

| Component | Weight | What It Measures |
|-----------|--------|-----------------|
| Liquidity | 25% | Current ratio trend |
| Profitability | 25% | Gross and net margins |
| Cash Flow | 20% | Is operating cash flow positive? |
| Compliance | 15% | Tax filings on time, period closed |
| AR Collection | 15% | Days Sales Outstanding vs target |

**Score grades:**
- 🟢 80–100 — Healthy
- 🟡 60–79 — Needs monitoring
- 🟠 40–59 — Attention required
- 🔴 0–39 — Critical

---

## Revenue Trend

**Route:** `/reports?type=revenue-trend` — requires `reports:read`

Monthly revenue for the trailing 12 months shown as a bar chart with a rolling 3-month average trend line. Supports year-over-year comparison and breakdown by revenue category (Sales, Services, Other Income).

---

## Customer Reports

### Customer Growth — `/reports/customer-growth`

| Metric | Description |
|--------|-------------|
| New customers | First invoice in this period |
| Returning customers | Invoiced in both prior and current period |
| Churned customers | Invoiced last period but not this period |
| Average revenue per customer | Total revenue ÷ active customers |
| Top 10 by revenue | Ranked by total invoiced amount |

### Customer Statement — `/reports/customer-statement/:id`

A full statement of account for a single customer — all invoices, payments, credit notes, and the outstanding balance for the selected period, aged by bucket. PDF output suitable for mailing directly to the customer.

**How to generate:**
1. Go to **Sales → Customers** → click a customer name.
2. Click **Statement** → select the date range.
3. Download PDF or click **Email** to send directly to the customer's registered address.

---

## IFRS 9 ECL — Expected Credit Loss

**Route:** `/reports?type=ifrs9-ecl` — requires `reports:financial:full`

Required for Tier 1 (Full IFRS) companies. Calculates the Expected Credit Loss provision on the AR portfolio per IFRS 9 using the simplified approach for trade receivables.

```
ECL = Gross Carrying Amount × Probability of Default (PD) × Loss Given Default (LGD)

Default ageing-based PD rates:
  Current          →  0.5%
  1–30 days late   →  2%
  31–60 days late  →  8%
  61–90 days late  →  20%
  90+ days late    →  50%

LGD default: 100% (unsecured receivables)
```

**How to run:**
1. Go to **Reports → Financial → IFRS 9 ECL**.
2. Select the reporting date.
3. OVDS calculates the provision per debtor ageing bucket.
4. Review the total — if changed from prior period, OVDS generates the adjustment journal entry automatically.
5. Click **Post Provision** to book the entry.
6. Export the ECL schedule as audit evidence.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Tax reports (VAT, WHT) | [Tax Reports](./tax-reports.md) |
| Payroll and attendance reports | [Payroll & Attendance Reports](./payroll-reports.md) |
| Custom report builder | [Custom Reports & Scheduling](./custom-reports.md) |
| IFRS compliance configuration | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md) |
| Fix AR collection issues | [Banking → Treasury & Collections](../05-banking/treasury-collections.md) |
| Fixed asset depreciation schedule | [Financial Ops → Fixed Assets](../04-financial-ops/fixed-assets.md) |



