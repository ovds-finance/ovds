<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Custom Reports & Scheduled Exports

> **Part of:** [Reports](./README.md)
>
> **Requires:** Login · `reports:custom:read` · `reports:read`
>
> **Navigate to:** **Reports → Builder tab** (`/reports?type=builder`)

The Custom Report Builder lets you create bespoke reports for any combination of data in OVDS — and schedule automatic delivery to any email recipient.

---

## Building a Custom Report

1. Go to **Reports → Builder** tab.
2. Click **New Report**.
3. Configure the report using the four panels:

### Step 1 — Select Data Source

| Data Source | What It Contains |
|-------------|----------------|
| Invoices | All sales invoices — customer, amount, date, status, VAT |
| Bills | All vendor bills — vendor, amount, date, status, WHT |
| Expenses | Employee expense claims — category, amount, approver, status |
| Payroll | Payroll register — employee, gross, deductions, net per period |
| GL Entries | All journal entries — account, debit, credit, reference |
| Inventory | Stock movements — item, quantity, cost, type |
| Customers | Customer list — name, TIN, outstanding balance, revenue YTD |
| Vendors | Vendor list — name, TIN, outstanding balance, spend YTD |

### Step 2 — Choose Columns

Drag fields from the left panel into the **Columns** area. Available fields depend on the selected data source. Common fields include:

- Date, Reference Number, Status
- Customer / Vendor Name and TIN
- Line item descriptions and amounts
- VAT amount, WHT amount
- Payment method and account
- Category and department

Reorder columns by dragging them left or right in the column list.

### Step 3 — Set Filters

Add one or more filter conditions to narrow results:

| Filter Type | Examples |
|-------------|---------|
| Date range | Invoice date between July 1 and July 31 |
| Status | Status = Paid, or Status ≠ Draft |
| Customer / Vendor | Specific customer name or TIN |
| Amount | Amount > ETB 10,000 |
| Category | Category = Transport |
| Department | Department = ovds |

Combine filters with **AND** (all conditions must match) or **OR** (any condition matches).

### Step 4 — Group and Aggregate

Optionally group rows and apply summary calculations:

| Setting | Options |
|---------|---------|
| **Group By** | Month, Quarter, Department, Category, Customer, Vendor |
| **Aggregation** | Sum, Average, Count, Min, Max — applied per numeric column |

**Example:** Group invoices by *Customer* with a *Sum* on the Amount column to get total revenue per customer for the period.

### Step 5 — Preview and Save

1. Click **Preview** — shows the first 50 rows with the current configuration.
2. Review the data and adjust columns, filters, or grouping as needed.
3. Click **Save** — enter a report name and optional description.
4. The report is saved under **Reports → Builder** and available to all users with `reports:custom:read`.

---

## Running a Saved Report

1. Go to **Reports → Builder** — all saved custom reports appear in the list.
2. Click a report name — it runs instantly with the latest data.
3. Adjust the date range or filters if needed (changes are not saved unless you click **Save**).
4. Click **Export CSV** or **Export PDF** to download.

---

## Scheduled Report Delivery

Automate delivery of any report — built-in or custom — to any email address on a recurring schedule.

### Setting Up a Schedule

1. Open any report (built-in or custom) → click **Schedule** in the top-right corner.
2. Configure the schedule:

| Setting | Options |
|---------|---------|
| Frequency | Daily, Weekly, Monthly, Quarterly |
| Day of delivery | For weekly: Mon–Sun; for monthly: 1st–28th |
| Time | Hour and minute (EAT — East Africa Time UTC+3) |
| Format | CSV or PDF |
| Recipients | One or more email addresses (comma-separated) |

3. Click **Save Schedule** — the report is emailed automatically at each scheduled run.

### Managing Schedules

1. Go to **Reports → Builder → Scheduled Exports**.
2. All active schedules are listed with next run date, frequency, and recipients.
3. Click a schedule to **Edit**, **Pause**, or **Delete** it.

> Pausing a schedule does not delete it. Resume at any time by toggling it back to Active.

---

## Report Permissions

| Action | Permission | Role |
|--------|-----------|------|
| View and run saved reports | `reports:custom:read` | ovds, ACCOUNTING, ADMIN, HR |
| Create and edit reports | `reports:custom:read` | ovds, ACCOUNTING, ADMIN |
| Schedule report delivery | `reports:custom:read` | ovds, ADMIN |
| Delete saved reports | `reports:custom:read` | ADMIN only |

---

## Common Custom Report Examples

### Top Customers by Revenue (Month)
- **Data Source:** Invoices
- **Columns:** Customer Name, Total Amount
- **Filter:** Invoice Date = this month, Status = Paid
- **Group By:** Customer
- **Aggregation:** Sum on Amount
- **Sort:** Amount descending

### Overdue Invoice List
- **Data Source:** Invoices
- **Columns:** Invoice #, Customer, Due Date, Amount, Days Overdue
- **Filter:** Status = Sent or Partial, Due Date < today

### Expense Category Breakdown (Quarter)
- **Data Source:** Expenses
- **Columns:** Category, Total Amount
- **Filter:** Date = this quarter, Status = Approved
- **Group By:** Category
- **Aggregation:** Sum on Amount

### Monthly WHT Liability by Vendor
- **Data Source:** Bills
- **Columns:** Vendor Name, Gross Amount, WHT Amount, Net Paid
- **Filter:** Date = this month, WHT Amount > 0
- **Group By:** Vendor
- **Aggregation:** Sum on WHT Amount

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Financial reports (Balance Sheet, P&L) | [Financial Reports](./financial-reports.md) |
| Tax reports (VAT, WHT) | [Tax Reports](./tax-reports.md) |
| Payroll and attendance reports | [Payroll & Attendance Reports](./payroll-reports.md) |
| Scheduled CSV exports from list views | [Financial Ops → Data Import/Export](../04-financial-ops/data-import-export.md#scheduled-exports) |




