<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Reports

> **Part of:** [OVDS Documentation](../README.md) › Reports
>
> **Related modules:** [Financial Operations](../04-financial-ops/README.md) · [Tax & Compliance](../06-tax-compliance/README.md) · [Advanced](../08-advanced/README.md)

OVDS provides four categories of reports: Financial, Operational, Tax, and Custom. All reports are IFRS-aligned, exportable to PDF/CSV, and support scheduled delivery. Navigate to **Reports** (`/reports`) — requires `reports:read`.

---

## Standalone Guides

| Guide | Description |
|-------|-------------|
| [Financial Reports](./financial-reports.md) | Balance Sheet, P&L, Cash Flow, GL, AR/AP Aging, Ratios, Health Score, IFRS 9 ECL |
| [Tax Reports](./tax-reports.md) | Monthly VAT Summary, WHT Report, Tax Liability Dashboard, Tax Calendar |
| [Payroll & Attendance Reports](./payroll-reports.md) | Payroll Summary, PIT Certificates, Pension Schedule, Attendance, Leave Analytics, Budget vs Actual |
| [Custom Reports & Scheduling](./custom-reports.md) | Report builder, filters, grouping, scheduled email delivery |

---

---

## Report Categories

| Category | Tab | Key Reports |
|----------|-----|-------------|
| Financial | Financial | Balance Sheet, P&L, Trial Balance, Cash Flow, GL, Ratios, Health Score, Revenue Trend |
| Payroll | Payroll | Payroll Summary, PIT Certificates, Pension Schedule, Comparison |
| Comparison | Comparison | Period-over-period, Budget vs Actual |
| Attendance | Attendance | Attendance Report, Leave Analytics, Headcount |
| Sales Tax | Sales Tax | Monthly VAT Summary, WHT Report |
| Tax Liability | Tax Liability | Consolidated tax obligations dashboard |
| Custom Builder | ✦ Builder | Drag-and-drop custom reports, scheduling |
| IFRS | Financial | IFRS 9 ECL, Changes in Equity, Customer Statement, Customer Growth |

---

## 1. Financial Reports

### Balance Sheet
**What it shows:** Assets, Liabilities, and Equity at a point in time.

- Structured per IFRS IAS 1 (Statement of Financial Position)
- Current vs Non-current classification
- Comparative period (prior year or prior month)
- Drill-down to individual GL accounts

**Key sections:**
```
ASSETS
  Current Assets
    Cash and Cash Equivalents
    Accounts Receivable
    Inventory
    Prepaid Expenses
  Non-Current Assets
    Property, Plant & Equipment (net of depreciation)
    Intangible Assets
    Long-term Investments

LIABILITIES
  Current Liabilities
    Accounts Payable
    VAT Payable
    Accrued Expenses
    Short-term Loans
  Non-Current Liabilities
    Long-term Loans
    Deferred Tax

EQUITY
  Share Capital
  Retained Earnings
  Current Period Profit/(Loss)
```

### Profit & Loss (Income Statement)
**What it shows:** Revenue, expenses, and net profit for a period.

- Structured per IFRS IAS 1 (Statement of Comprehensive Income)
- Gross Profit → Operating Profit → Net Profit breakdown
- Expense categories with drill-down
- Comparative period support

**Key sections:**
```
Revenue
  Sales Revenue
  Service Revenue
  Other Income
Cost of Goods Sold
  Opening Inventory + Purchases − Closing Inventory
Gross Profit
Operating Expenses
  Salaries & Benefits
  Rent & Utilities
  Depreciation
  Marketing
  Administrative
Operating Profit (EBIT)
ovds Costs (Interest)
Profit Before Tax
Income Tax (BIT 30%)
Net Profit After Tax
```

### Trial Balance
**What it shows:** All GL account balances (debit and credit) for a period.

- Verifies that total debits = total credits
- Adjusted and unadjusted versions
- Export to CSV for external audit

### Cash Flow Statement
**What it shows:** Cash inflows and outflows by activity type.

- **Operating Activities** — cash from core business operations
- **Investing Activities** — asset purchases and sales
- **Financing Activities** — loans, equity, dividends
- Indirect method (starts from net profit, adjusts for non-cash items)
- IFRS IAS 7 compliant

### Statement of Changes in Equity
**What it shows:** Movement in equity accounts during the period.

- Opening balance + net profit + other comprehensive income − dividends = closing balance
- Required for Tier 1 and Tier 2 IFRS companies

### AR Aging Report
**What it shows:** Outstanding customer invoices grouped by age.

| Bucket | Description |
|--------|-------------|
| Current | Not yet due |
| 1–30 days | Overdue 1–30 days |
| 31–60 days | Overdue 31–60 days |
| 61–90 days | Overdue 61–90 days |
| 90+ days | Overdue more than 90 days |

### AP Aging Report
Same structure as AR Aging, but for outstanding vendor bills.

### General Ledger
**What it shows:** All journal entries for a period, grouped by GL account.

- Filter by account, date range, or reference
- Drill-down from any financial statement line to the underlying journal entries
- Export to CSV for audit

---

## 2. Payroll Reports

### Payroll Summary
Monthly payroll summary showing:
- Total gross pay
- Total PIT (income tax) deducted
- Total employee pension (7%)
- Total employer pension (11%)
- Total net pay disbursed
- Breakdown by department

### PIT Certificates
Annual income tax certificates for each employee:
- Required by employees for personal tax filing
- Shows annual gross income, total PIT deducted, and net income
- Generated per employee or in bulk
- Exportable as PDF

### Pension Remittance Schedule
Monthly pension report for ERCA submission:
- Employee pension (7%) per employee
- Employer pension (11%) per employee
- Total remittance amount
- Bank transfer details for ERCA pension account

### Payroll Comparison
Compare payroll across months:
- Month-over-month changes in headcount, gross pay, and deductions
- Identify anomalies (large salary changes, new hires, terminations)

---

## 3. Comparison Reports

### Setting Up Budgets

Before running Budget vs Actual, create a budget:

1. Navigate to **ovds → Budgets** (`/budgets`) — requires `ovds:read`.
2. Click **New Budget** → enter the budget name, fiscal year, and period (monthly/quarterly/annual).
3. Add budget lines: for each GL account or expense category, enter the planned amount.
4. Click **Save** — the budget is now available in the Comparison tab.

> Budgets can be imported from CSV via **Import Center → Budgets** if you have existing spreadsheet data.

### Period-over-Period
Compare any two periods (months, quarters, years):
- Revenue growth/decline
- Expense changes
- Profit margin trends
- Variance analysis (absolute and percentage)

**How to run:**
1. Go to **Reports → Comparison** tab.
2. Select **Period A** (e.g., this month) and **Period B** (e.g., same month last year).
3. The report shows absolute variance (ETB) and percentage change for each line.
4. Click any line to drill down to the underlying transactions.

### Budget vs Actual
If budgets are configured:
- Compare actual results against budget
- Highlight over/under-budget items
- Variance percentage per line item

**How to run:**
1. Go to **Reports → Comparison** tab → select **Budget vs Actual**.
2. Select the budget and the actual period.
3. Red rows = over budget; green rows = under budget.
4. Export to CSV for management review or board presentation.

---

## 4. Attendance Reports

### Attendance Report
Daily/monthly attendance summary:
- Present, absent, late, half-day counts per employee
- Department-level summaries
- Export to CSV for payroll processing

**How to run:**
1. Go to **Reports → Attendance** tab.
2. Select the month and optionally filter by department.
3. Click **Generate** — the report shows a day-by-day grid per employee.
4. Late arrivals are flagged in amber; absences in red.
5. Export to CSV to cross-reference with the payroll register.

### Leave Analytics
- Leave taken vs leave balance per employee
- Leave type breakdown (annual, sick, maternity, etc.)
- Department-level leave utilization
- Pending leave requests

### Employee Headcount
- Total headcount by department
- New hires and terminations in the period
- Headcount trend over time

---

## 5. Sales Tax Summary

Monthly VAT breakdown — see [Tax & Compliance → VAT](../06-tax-compliance/README.md) for full details.

| Column | Description |
|--------|-------------|
| Month | Calendar month |
| Taxable Revenue | Revenue subject to VAT |
| VAT Collected (15%) | Output VAT from invoices |
| Input VAT Paid | VAT on bills and expenses |
| Net VAT | Output − Input (payable or refundable) |
| Withholding Tax | WHT deducted from vendor payments |

**Export:** Click **Export CSV** to download the annual summary for ERCA submission.

---

## 6. Tax Liability Dashboard

Consolidated view of all outstanding tax obligations:

| Obligation | Calculation | Deadline |
|-----------|-------------|---------|
| VAT Payable | Output VAT − Input VAT | 30th of following month |
| WHT Unremitted | 2% on unpaid bills with TIN | 30th of following month |
| DRRF Levy | 1–5% on applicable transactions | 15th of last month of quarter |
| BIT Estimate | 30% of estimated net profit | November 7 |

**Tax Calendar** — shows upcoming deadlines with days remaining, color-coded by urgency:
- 🔴 Red: ≤ 3 days
- 🟡 Amber: ≤ 7 days
- ⚪ Normal: > 7 days

### Tax Liability Estimator

Navigate to **Dashboards → Tax Liability Estimator** (`/tax/liability-estimator`) — requires `vat:read`.

The estimator provides a **live pre-computation** of VAT, ToT, and Withholding taxes before the period closes — useful for cash-flow planning before the monthly filing deadline.

| Tax Type | Calculation Basis | When Updated |
|---|---|---|
| VAT (Output) | Sum of all VAT-liable invoices YTD for period | Real-time on each invoice save |
| VAT (Input) | Sum of all input VAT on bills | Real-time on each bill save |
| **Net VAT Estimate** | Output − Input | Live |
| TOT | Sum of TOT-liable revenue × rate (2%/10%) | Real-time |
| WHT | Sum of qualifying vendor payments × 2% | Real-time |
| **Total estimated liability** | Net VAT + TOT + WHT | Live |

**How to use it:**
1. Go to **Dashboards → Tax Liability Estimator** at any point during the month
2. Review the estimated liability per tax type
3. Use the **Cash Required by [deadline]** figure to plan bank transfers
4. The estimate auto-updates as you post invoices, bills, and payments
5. At month end, the actual filed amounts should match the estimate closely — large variances indicate missing transactions

---

## 7. Inventory & Asset Valuation (Analysis)

Navigate to **Analysis → Inventory & Assets** — requires `inventory:read`.

This Analysis-phase group reviews stock and fixed asset health before the period is closed for MoR filing.

### IAS 2 Stock Valuation (`/inventory/valuation`)
- Shows closing inventory value under FIFO or Weighted Average
- Compares cost vs Net Realisable Value (NRV) — flags write-downs required
- Feeds directly into the Balance Sheet (Current Assets → Inventories)
- Export the IAS 2 valuation schedule for the external auditor

### Stock on Hand (`/inventory`)
Real-time stock position:
| Column | Description |
|---|---|
| Item | Product name and SKU |
| Opening qty | Quantity at period start |
| Received | Units received (from GRNs/POs) |
| Sold | Units sold (from invoices) |
| Adjusted | Manual adjustments |
| **Closing qty** | Current stock balance |
| Unit cost | FIFO or WA cost |
| **Total value** | Closing qty × unit cost |

### IoT Asset Tracking Logs (`/iot/telemetry`)
For businesses using IoT-connected warehouse scanners, vehicles, or smart meters:
- Sensor events (movement, temperature, GPS position) are ingested in real time
- Each event is timestamped and attached to the relevant asset or inventory item
- The tracking log is available in both the Daily Operations (IoT feed) and here in Analysis (audit evidence)
- Use the log to verify physical asset location against the Fixed Asset Register
- IoT payload timestamps are included in the MoR Audit Trail

### Fixed Asset Register (`/fixed-assets`)
Review the IAS 16 depreciation schedule:
- Cost, accumulated depreciation, and Net Book Value per asset
- Verify assets are still in use (cross-reference with IoT tracking logs)
- Identify any assets that may need an IAS 36 impairment review
- Export the schedule as supporting documentation for the annual BIT return

---

## 8. Financial Intelligence Reports

These reports are available under **Reports → Financial** and **Dashboards → Business Insights** (`/business-insights`).

### Financial Ratios (`/reports?type=ratios`)

OVDS calculates key financial ratios automatically from your live data:

| Ratio | Formula | What It Tells You |
|-------|---------|------------------|
| **Current Ratio** | Current Assets ÷ Current Liabilities | Liquidity — can you pay short-term debts? (target: > 1.5) |
| **Quick Ratio** | (Cash + Receivables) ÷ Current Liabilities | Tighter liquidity — excludes inventory |
| **Gross Profit Margin** | (Revenue − COGS) ÷ Revenue × 100 | Profitability of core operations |
| **Net Profit Margin** | Net Profit ÷ Revenue × 100 | Overall profitability after all costs |
| **Return on Assets (ROA)** | Net Profit ÷ Total Assets × 100 | How efficiently assets generate profit |
| **Debt-to-Equity Ratio** | Total Liabilities ÷ Total Equity | Financial leverage — how much debt vs owner funds |
| **AR Days Outstanding** | (Receivables ÷ Revenue) × 365 | Average days to collect from customers |
| **AP Days Outstanding** | (Payables ÷ COGS) × 365 | Average days to pay suppliers |

Navigate to **Reports → Financial → Ratios** to view the live ratio dashboard with trend lines.

---

### Business Health Score (`/reports?type=health-score`)

The Health Score provides a single 0–100 composite score assessing the overall financial health of the business:

| Component | Weight | Measures |
|-----------|--------|---------|
| Liquidity | 25% | Current ratio trend |
| Profitability | 25% | Gross and net margins |
| Cash Flow | 20% | Operating cash flow positive? |
| Compliance | 15% | Tax filings on time, period closed |
| AR Collection | 15% | Days Sales Outstanding vs target |

**Score grades:**
- 🟢 **80–100** — Healthy
- 🟡 **60–79** — Needs monitoring
- 🟠 **40–59** — Attention required
- 🔴 **0–39** — Critical

Navigate to **Dashboards → Business Insights** → the Health Score card updates in real time as transactions are posted.

---

### Revenue Trend (`/reports?type=revenue-trend`)

Monthly revenue trend chart for the trailing 12 months:

- Total revenue by month (bar chart)
- Rolling 3-month average (trend line)
- Year-over-year comparison
- Breakdown by revenue category (Sales, Services, Other)

**How to use:** Navigate to **Reports → Financial → Revenue Trend**. Select the date range and optionally filter by customer segment or category.

---

### Customer Growth (`/reports/customer-growth`)

Tracks customer acquisition and retention:

| Metric | Description |
|--------|-------------|
| New customers this period | Customers with their first invoice in the period |
| Returning customers | Customers with invoices in both the prior and current period |
| Churned customers | Customers with invoices last period but none this period |
| Average revenue per customer | Total revenue ÷ active customer count |
| Top 10 customers by revenue | Ranked by total invoiced amount |

Navigate to **Reports → Financial → Customer Growth** or **Sales → Customer Growth** (`/customer-growth`).

---

### IFRS 9 ECL — Expected Credit Loss (`/reports?type=ifrs9-ecl`)

Navigate to **Reports → Financial → IFRS 9 ECL** — requires `reports:financial:full`.

For Tier 1 and Tier 2 IFRS companies, OVDS calculates the Expected Credit Loss (ECL) provision on the AR portfolio per IFRS 9:

**ECL Calculation (Simplified Approach for Trade Receivables):**

```
ECL = Gross Carrying Amount × Probability of Default (PD) × Loss Given Default (LGD)

Ageing buckets used:
  Current          →  PD: 0.5%
  1–30 days late   →  PD: 2%
  31–60 days late  →  PD: 8%
  61–90 days late  →  PD: 20%
  90+ days late    →  PD: 50%

LGD default: 100% (unsecured receivables)
```

**How to run:**
1. Navigate to **Reports → Financial → IFRS 9 ECL**.
2. Select the reporting date.
3. OVDS calculates the ECL provision per debtor ageing bucket.
4. Review the total provision amount — this feeds the Balance Sheet as a contra-asset under **Accounts Receivable**.
5. If the provision has changed from the prior period, OVDS generates the adjustment journal entry automatically:
   - **Increase:** Debit Bad Debt Expense / Credit ECL Provision
   - **Decrease:** Debit ECL Provision / Credit Bad Debt Expense Recovery
6. Export the ECL schedule as audit evidence for the external auditor.

> The ECL provision is required for Tier 1 companies (Full IFRS). Tier 2 companies (IFRS for SMEs) may use the simplified approach. Tier 3 micro-entities are exempt.

---

### Customer Statement (`/reports/customer-statement/:customerId`)

Generates a statement of account for a specific customer:

- All invoices, payments, credit notes, and outstanding balance for the period
- Aged balances (Current, 30, 60, 90, 90+ days)
- PDF format suitable for mailing to the customer

**How to generate:**
1. Go to **Sales → Customers** → click a customer name.
2. Click **Statement** → select the date range.
3. Download PDF or email directly to the customer's registered email.

---

## 9. Custom Report Builder

Navigate to **Reports → Builder** (`/reports?type=builder`) — requires `reports:custom:read`.

The Custom Report Builder lets you create and save bespoke reports for any combination of data.

### Building a Report

1. Click **New Report** in the Builder tab.
2. Select a **Data Source**: Invoices, Bills, Expenses, Payroll, GL Entries, Inventory, or Customers.
3. Choose **Columns**: drag fields from the left panel into the report columns.
4. Set **Filters**: date range, status, category, department, customer, vendor, etc.
5. Choose **Grouping**: group by month, department, category, or customer.
6. Choose **Aggregations**: Sum, Average, Count, Min, Max per numeric column.
7. Click **Preview** to see a live sample (first 50 rows).
8. Click **Save** — give the report a name and optionally a description.

### Running a Saved Report

1. Go to **Reports → Builder** — your saved reports appear in the list.
2. Click a report → it runs with the latest data.
3. Click **Export CSV** or **Export PDF** to download.

### Scheduled Report Delivery

Automate report delivery to email recipients on a recurring schedule:

1. Open a saved custom report → click **Schedule**.
2. Set the **Frequency**: Daily, Weekly, Monthly, or Quarterly.
3. Enter recipient **email addresses** (comma-separated).
4. Set the **Time** of delivery (EAT timezone).
5. Click **Save Schedule** — the report is emailed automatically.

> Scheduled reports are also available for built-in reports (P&L, AR Aging, Payroll Summary). Open any report → click **Schedule** in the top-right.

---

## 10. Expense Tracking (Analysis)

Navigate to **Analysis → Expense Tracking** — requires `expenses:read`.

### Expense Register (`/expenses`)
Full list of operational expenses for the period:
- Filter by category, department, date range, or employee
- Drill down to the source document (bill, receipt, or journal entry)
- Identify the largest expense categories before financial statement preparation

### Petty Cash Audit (`/petty-cash`)
Management review of the petty cash fund:
- All petty cash disbursements grouped by category
- Running balance vs expected float
- Receipts attached (or flagged as missing)
- Useful for verifying that all small cash expenditures are properly categorized before period close

### Cost Categories (`/transaction-categories`)
Review and refine the mapping of transactions to GL accounts:
- Ensure all expenses are correctly categorized for the P&L
- Reclassify any miscategorized items before generating financial statements

### Expense Summary Report (`/reports?type=expense-summary`)
| Column | Description |
|---|---|
| Category | Expense type (salaries, rent, utilities, etc.) |
| Budget | Approved budget for the period |
| Actual | Actual spend |
| Variance | Actual − Budget |
| % Utilised | Actual ÷ Budget × 100 |

---

## Navigation Flow

```
Reports                /reports              (reports:read)
├── Financial Tab
│   ├── Balance Sheet        /reports?type=bs           (reports:bs:read)
│   ├── Profit & Loss        /reports?type=pl           (reports:pl:read)
│   ├── Trial Balance        /reports?type=trial-balance (reports:gl:read)
│   ├── Cash Flow            /reports?type=cf           (reports:cf:read)
│   ├── Changes in Equity    /reports/equity            (reports:financial:read)
│   ├── General Ledger       /reports?type=gl           (reports:gl:read)
│   ├── Financial Ratios     /reports?type=ratios       (reports:financial:full)
│   ├── Health Score         /reports?type=health-score (reports:financial:full)
│   ├── Revenue Trend        /reports?type=revenue-trend (reports:read)
│   ├── Customer Growth      /reports/customer-growth   (reports:read)
│   ├── Customer Statement   /reports/customer-statement/:id (invoices:read)
│   ├── IFRS 9 ECL           /reports?type=ifrs9-ecl    (reports:financial:full)
│   ├── AR Aging             /reports/ar-aging          (reports:read)
│   └── AP Aging             /reports/ap-aging          (reports:read)
├── Payroll Tab
│   ├── Payroll Summary      /reports?type=payroll-summary (payroll:read)
│   ├── PIT Certificates     /reports?type=pit-certs    (payroll:read)
│   ├── Pension Schedule     /reports?type=pension      (payroll:read)
│   └── Payroll Comparison   /reports?type=payroll-comparison (payroll:read)
├── Comparison Tab
│   ├── Period-over-Period   /reports?type=period       (reports:read)
│   └── Budget vs Actual     /reports?type=budget       (ovds:read)
├── Attendance Tab
│   ├── Attendance           /reports?type=attendance   (attendance:read)
│   ├── Leave Analytics      /reports?type=leave        (leaves:read)
│   └── Headcount            /reports?type=headcount    (employees:read)
├── Sales Tax Tab
│   ├── Monthly VAT Summary  /reports?type=tax          (vat:read)
│   ├── WHT Report           /reports?type=wht          (vat:read)
│   └── Income vs Expense    /reports?type=income-expense (reports:read)
├── Tax Liability Tab        /tax/liability-estimator   (vat:read)
└── Builder Tab              /reports?type=builder      (reports:custom:read)
      Custom report builder + scheduled exports

ovds — Budgets
├── Budget Setup         /budgets                  (ovds:read)
└── Budget Variance      /budgets/variance         (ovds:read)

Analysis Phase — Dashboards
├── Main Dashboard         /dashboard               (ovds:read)
├── Accounting Dashboard   /accounting-dashboard    (ovds:read)
├── Tax Overview           /tax/dashboard           (vat:read)
├── Tax Liability Estimator /tax/liability-estimator (vat:read)
└── Business Insights      /business-insights       (insights:read)
      Financial ratios, health score, revenue trends, forecasting

Analysis Phase — Inventory & Assets
├── IAS 2 Stock Valuation  /inventory/valuation     (inventory:read)
├── Stock on Hand          /inventory               (inventory:read)
├── IoT Asset Tracking     /iot/telemetry           (api_docs:read)
└── Fixed Asset Register   /fixed-assets            (fixed_assets:read)

Analysis Phase — Expense Tracking
├── Expense Register       /expenses                (expenses:read)
├── Petty Cash Audit       /petty-cash              (banking:read)
├── Cost Categories        /transaction-categories  (ovds:read)
└── Expense Summary        /reports?type=expense-summary (reports:read)
```

---

## Reports Quick Reference

| Report | Route | Permission | Export |
|--------|-------|-----------|--------|
| Balance Sheet | `/reports?type=bs` | `reports:bs:read` | PDF, CSV |
| Profit & Loss | `/reports?type=pl` | `reports:pl:read` | PDF, CSV |
| Cash Flow | `/reports?type=cf` | `reports:cf:read` | PDF, CSV |
| Trial Balance | `/reports?type=trial-balance` | `reports:gl:read` | CSV |
| General Ledger | `/reports?type=gl` | `reports:gl:read` | CSV |
| Changes in Equity | `/reports/equity` | `reports:financial:read` | PDF |
| Financial Ratios | `/reports?type=ratios` | `reports:financial:full` | PDF |
| Health Score | `/reports?type=health-score` | `reports:financial:full` | PDF |
| Revenue Trend | `/reports?type=revenue-trend` | `reports:read` | CSV |
| AR Aging | `/reports/ar-aging` | `reports:read` | CSV, PDF |
| AP Aging | `/reports/ap-aging` | `reports:read` | CSV, PDF |
| Customer Growth | `/reports/customer-growth` | `reports:read` | CSV |
| Customer Statement | `/reports/customer-statement/:id` | `invoices:read` | PDF |
| IFRS 9 ECL | `/reports?type=ifrs9-ecl` | `reports:financial:full` | PDF |
| Sales Tax Summary | `/reports?type=tax` | `vat:read` | CSV |
| WHT Report | `/reports?type=wht` | `vat:read` | CSV |
| Payroll Summary | `/reports?type=payroll-summary` | `payroll:read` | PDF, CSV |
| PIT Certificates | `/reports?type=pit-certs` | `payroll:read` | PDF (bulk) |
| Pension Schedule | `/reports?type=pension` | `payroll:read` | CSV |
| Attendance | `/reports?type=attendance` | `attendance:read` | CSV |
| Budget vs Actual | `/reports?type=budget` | `ovds:read` | CSV |
| Custom Report | `/reports?type=builder` | `reports:custom:read` | CSV, PDF |
| Expense Summary | `/reports?type=expense-summary` | `reports:read` | CSV |




