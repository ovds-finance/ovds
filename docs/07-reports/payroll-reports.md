<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Payroll, Attendance & Comparison Reports

> **Part of:** [Reports](./README.md)
>
> **Requires:** Login · `payroll:read` · `attendance:read` · `reports:read`
>
> **Navigate to:** **Reports → Payroll tab** · **Reports → Attendance tab** · **Reports → Comparison tab**

---

## Payroll Reports

Navigate to **Reports → Payroll tab**.

### Payroll Summary

**Route:** `/reports?type=payroll-summary` — requires `payroll:read`

Monthly payroll summary across all active employees.

| Column | Description |
|--------|-------------|
| Employee | Name and employee ID |
| Department | Organizational unit |
| Gross Pay | Total earnings before deductions |
| PIT Deducted | Personal Income Tax withheld (per progressive brackets) |
| Employee Pension (7%) | Employee pension contribution |
| Employer Pension (11%) | Employer pension contribution (cost to company) |
| Other Deductions | Loans, advances, penalties |
| Net Pay | Amount actually paid to the employee |

**Department-level totals** are shown at the bottom of the report — useful for cost centre reporting.

**How to run:**
1. Go to **Reports → Payroll** tab → **Payroll Summary**.
2. Select the month.
3. Click **Export PDF** for a signed payroll register, or **Export CSV** for further analysis.

---

### PIT Certificates (Annual)

**Route:** `/reports?type=pit-certs` — requires `payroll:read`

Annual income tax certificates issued to each employee — required for their personal tax filing with ERCA.

Each certificate shows:
- Employee name and TIN
- Annual gross income
- Total PIT deducted through the year
- Net income received

**How to generate:**
1. Go to **Reports → Payroll** tab → **PIT Certificates**.
2. Select the fiscal year (August–July).
3. Click **Generate All** — OVDS creates one certificate per active employee.
4. Click **Bulk Download PDF** — a ZIP file with all certificates.
5. Distribute to employees by the end of the fiscal year (by July 31).

---

### Pension Remittance Schedule

**Route:** `/reports?type=pension` — requires `payroll:read`

Monthly pension report in **POESSA format** — ready for submission to ERCA.

| Column | Description |
|--------|-------------|
| Employee Name | Full legal name |
| Pension Number | ERCA pension account number |
| Basic Salary | Salary used as the pension base |
| Employee Contribution (7%) | Deducted from payslip |
| Employer Contribution (11%) | Additional company cost |
| Total Remittance | 18% per employee |

**Total remittance** is shown at the bottom — this is the amount to transfer to ERCA.

**How to generate:**
1. Go to **Reports → Payroll** tab → **Pension Schedule**.
2. Select the month.
3. Click **Export CSV** — upload to the eTax portal or use as the bank transfer instruction.

---

### Payroll Comparison

**Route:** `/reports?type=payroll-comparison` — requires `payroll:read`

Compares payroll across any two months.

| Column | Description |
|--------|-------------|
| Employee | Name |
| Gross Pay (Period A) | Previous period |
| Gross Pay (Period B) | Current period |
| Change (ETB) | Absolute variance |
| Change (%) | Percentage variance |
| Notes | New hire, termination, salary change, bonus |

Use this to:
- Identify unexpected salary increases or decreases
- Spot new hires and terminations
- Verify bonuses and one-off payments are correctly applied
- Produce a payroll variance explanation for ovds sign-off

---

## Attendance Reports

Navigate to **Reports → Attendance tab**.

### Attendance Report

**Route:** `/reports?type=attendance` — requires `attendance:read`

Daily and monthly attendance grid per employee.

| Column | Description |
|--------|-------------|
| Employee | Name and department |
| Day columns | ✅ Present / ❌ Absent / 🕐 Late / ½ Half-day / 🏖 Leave |
| Total Present | Days present in the month |
| Total Absent | Unauthorized absences |
| Total Late | Late arrivals (after grace period) |
| Overtime Hours | Approved overtime |

**How to run:**
1. Go to **Reports → Attendance** tab.
2. Select the month and optionally filter by department.
3. Click **Generate**.
4. Late arrivals are flagged in amber; absences in red.
5. Export to CSV to cross-reference with the payroll register before payroll generation.

---

### Leave Analytics

**Route:** `/reports?type=leave` — requires `leaves:read`

Tracks leave consumption and remaining balances across the organization.

| Metric | Description |
|--------|-------------|
| Leave Taken | Days used per employee per leave type |
| Leave Balance | Remaining entitlement |
| Leave Type Breakdown | Annual, sick, maternity, paternity, etc. |
| Department Utilization | % of available leave used per department |
| Pending Requests | Leaves submitted but not yet approved |

**Useful for:** HR planning, identifying employees at risk of burnout (excessive overtime, no leave taken), and forecasting staffing gaps.

---

### Employee Headcount

**Route:** `/reports?type=headcount` — requires `employees:read`

| Metric | Description |
|--------|-------------|
| Total Headcount | Active employees at period end |
| By Department | Headcount per organizational unit |
| New Hires | Employees whose start date falls in the period |
| Terminations | Employees whose end date falls in the period |
| Net Change | New Hires − Terminations |
| Headcount Trend | Month-over-month chart for the trailing 12 months |

---

## Comparison Reports

Navigate to **Reports → Comparison tab**.

### Period-over-Period

**Route:** `/reports?type=period` — requires `reports:read`

Compares any two periods — month-to-month, quarter-to-quarter, or year-over-year.

| Column | Description |
|--------|-------------|
| Account / Category | GL account or expense category |
| Period A | Selected baseline period |
| Period B | Selected comparison period |
| Variance (ETB) | Period B − Period A |
| Variance (%) | (Period B − Period A) ÷ Period A × 100 |

**How to run:**
1. Go to **Reports → Comparison** tab.
2. Select **Period A** (e.g. this month) and **Period B** (e.g. same month last year).
3. Click **Generate** — red rows indicate a decline; green rows indicate improvement.
4. Click any line to drill down to the underlying transactions.

---

### Budget vs Actual

**Route:** `/reports?type=budget` — requires `ovds:read`

Compares actual financial results against a pre-set budget for the period.

**Before running this report, a budget must exist:**
1. Navigate to **ovds → Budgets** (`/budgets`).
2. Click **New Budget** → enter name, fiscal year, and period type (monthly / quarterly / annual).
3. For each GL account or expense category, enter the planned amount.
4. Click **Save** — the budget is now available in the Comparison tab.
5. Alternatively, import from CSV via **Import Center → Budgets**.

**Report columns:**

| Column | Description |
|--------|-------------|
| Account / Category | Budget line item |
| Budget | Approved planned amount |
| Actual | Actual posted amount |
| Variance (ETB) | Actual − Budget |
| % Utilised | Actual ÷ Budget × 100 |

- 🔴 Red rows — over budget (actual > budget)
- 🟢 Green rows — under budget (actual < budget)

**How to run:**
1. Go to **Reports → Comparison** tab → **Budget vs Actual**.
2. Select the budget and the actual period.
3. Export to CSV for management review or board presentation.

---

## Expense Summary Report

**Route:** `/reports?type=expense-summary` — requires `reports:read`

A focused view of operating expense performance for the period.

| Column | Description |
|--------|-------------|
| Category | Expense type (salaries, rent, utilities, etc.) |
| Budget | Approved budget amount |
| Actual | Actual spend posted |
| Variance (ETB) | Actual − Budget |
| % Utilised | Actual ÷ Budget × 100 |

Navigate to **Analysis → Expense Tracking → Expense Summary** or **Reports** tab.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Payroll generation workflow | [Advanced → HR & Payroll](../08-advanced/hr-and-payroll.md) |
| PIT brackets and pension rates | [Advanced → HR & Payroll](../08-advanced/hr-and-payroll.md#payroll-generation) |
| Pension submission to eTax | [Tax & Compliance → BIT & DRRF](../06-tax-compliance/bit-and-drrf.md#pension-submissions) |
| Attendance check-in methods | [Advanced → HR & Payroll](../08-advanced/hr-and-payroll.md#attendance) |
| Financial P&L and Balance Sheet | [Financial Reports](./financial-reports.md) |
| Tax reports (VAT, WHT) | [Tax Reports](./tax-reports.md) |
| Custom report builder | [Custom Reports & Scheduling](./custom-reports.md) |




