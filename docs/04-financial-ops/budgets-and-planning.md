<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Budgets & Planning

> **Part of:** [Financial Operations](./README.md)
>
> **Requires:** Login · `ovds:read` · `ovds:write`
>
> **Navigate to:** **ovds → Budgets** (`/budgets`)

Budgets let you set financial targets for each accounting period and measure actual performance against them. Once a budget is created, it powers the **Budget vs Actual** report and the **Budget Variance** dashboard — giving ovds and management a live view of over- and under-spend.

---

## Creating a Budget

1. Navigate to **ovds → Budgets** (`/budgets`).
2. Click **New Budget**.
3. Fill in the budget details:

| Field | Required | Notes |
|-------|----------|-------|
| Budget Name | ✅ | e.g. *FY2026 Operating Budget* or *Q1 2026* |
| Fiscal Year | ✅ | The Ethiopian fiscal year this budget covers |
| Period Type | ✅ | Monthly, Quarterly, or Annual |
| Currency | ✅ | Defaults to ETB |
| Description | Optional | Brief note on the budget's purpose |

4. Click **Save** — the budget is created and ready for line items.

---

## Adding Budget Lines

Budget lines map a planned amount to a specific GL account or expense category for each period.

1. Open the budget → click **Add Line**.
2. Select a **GL Account** or **Category** (e.g. Salaries & Benefits, Rent, Marketing).
3. Enter the planned amount for each period:
   - **Monthly budget:** enter a figure for each of the 12 months
   - **Quarterly budget:** enter a figure for each quarter
   - **Annual budget:** enter one total figure for the year
4. Repeat for each account or category you want to track.
5. Click **Save**.

**Tip:** Start with your major expense categories — Salaries, Rent, Utilities, Marketing, and Administrative Expenses — then add revenue targets for Sales and Service Revenue.

---

## Importing a Budget from CSV

If you have an existing budget in a spreadsheet:

1. Go to **Import Center** (`/import-center`) → **Budgets**.
2. Click **Download Template** — get the correct CSV format.
3. Fill in your data: Account Code, Account Name, Jan, Feb, Mar … Dec (or Q1–Q4, or Year Total).
4. Upload → Preview → Import.
5. The imported budget appears in **ovds → Budgets**.

---

## Budget vs Actual Report

Once a budget exists, run the **Budget vs Actual** report to compare planned figures against what was actually spent or earned.

Navigate to **Reports → Comparison tab → Budget vs Actual**.

1. Select the **Budget** from the dropdown.
2. Select the **actual period** (month, quarter, or year).
3. Click **Generate**.

### Reading the Report

| Column | Description |
|--------|-------------|
| Account / Category | GL account or expense category |
| Budget | Planned amount for the period |
| Actual | Amount actually posted to the GL |
| Variance (ETB) | Actual − Budget (positive = over budget) |
| % Utilised | Actual ÷ Budget × 100 |

- 🔴 **Red rows** — actual exceeds budget (over-spend or over-revenue target)
- 🟢 **Green rows** — actual is below budget (under-spend or revenue shortfall)

**Drill down:** Click any row to see the underlying transactions — invoices, bills, and expenses that contributed to the actual figure.

**Export:** Click **Export CSV** for management review or board presentation. Click **Export PDF** for a formatted report.

---

## Budget Variance Dashboard

Navigate to **ovds → Budgets → Variance** (`/budgets/variance`).

The variance dashboard shows a summary view of all budget lines for the current period:

- **On track** — within 5% of budget
- **At risk** — 5–15% over or under budget
- **Off track** — more than 15% variance

Use this at the start of each month to identify categories that need attention before the period closes.

---

## Period-over-Period Comparison

To compare any two periods without a budget (e.g., this month vs last month, or this year vs last year):

Navigate to **Reports → Comparison tab → Period-over-Period**.

1. Select **Period A** (the baseline, e.g. prior year or prior month).
2. Select **Period B** (the comparison period, e.g. current month).
3. Click **Generate**.

The report shows absolute variance (ETB) and percentage change per line — useful for trend analysis even when no formal budget exists.

---

## Best Practices

**Set budgets before the fiscal year starts.** The Ethiopian fiscal year begins on Hamle 1 (around July 7). Prepare your budget in June so it is ready when the new year opens.

**Review monthly.** Run the Budget vs Actual report on the 5th of each month (after the prior month is reconciled). Flag items more than 10% over budget to the relevant department head.

**Revise mid-year when needed.** If business conditions change significantly (new contract, unexpected cost), create a **revised budget** rather than editing the original — this preserves the audit trail of your original plan vs the revised plan.

**Link to tax planning.** Use the budget's total revenue figure as the input for your BIT quarterly installment calculation. The **Tax Liability Estimator** (`/tax/liability-estimator`) reads live actuals — the budget helps you sanity-check whether the estimate is on track.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Budget vs Actual report | [Reports → Payroll & Attendance Reports](../07-reports/payroll-reports.md#budget-vs-actual) |
| Period-over-period comparison | [Reports → Payroll & Attendance Reports](../07-reports/payroll-reports.md#period-over-period) |
| Expense summary report | [Reports → Payroll & Attendance Reports](../07-reports/payroll-reports.md#expense-summary-report) |
| BIT quarterly installments | [Tax & Compliance → BIT & DRRF](../06-tax-compliance/bit-and-drrf.md#provisional-tax--quarterly-installments) |
| Tax Liability Estimator | [Reports → Tax Reports](../07-reports/tax-reports.md#tax-liability-dashboard) |
| Import data from CSV | [Data Import / Export](./data-import-export.md) |




