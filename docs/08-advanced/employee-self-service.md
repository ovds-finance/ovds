<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Employee Self-Service, PAYE Declarations & Gratuity

> **Part of:** [Advanced Modules](./README.md) › HR & Payroll
>
> **Related:** [HR & Payroll](./hr-and-payroll.md)

This guide covers the features that employees and HR managers use daily outside of core payroll generation: the employee self-service portal, PAYE and pension declarations, gratuity and severance calculations, and the HR calendar.

---

## My Workspace — Employee Self-Service

Navigate to **My Workspace** — available to all authenticated users.

Every employee has access to a personal self-service area where they can manage their own HR records without involving HR staff.

### Features Available to All Employees

| Feature | Navigate to | What You Can Do |
|---------|-------------|----------------|
| My Payslips | My Workspace → Payslips | View and download monthly payslips as PDF |
| My Leave Balance | My Workspace → Leaves | Check remaining leave days per type |
| Submit Leave Request | My Workspace → Leaves → New Request | Request annual, sick, or other leave |
| Check Attendance | My Workspace → Attendance | View personal attendance records for the month |
| My Expenses | My Workspace → Expenses | Submit expense claims for reimbursement |
| My Loans | My Workspace → Loans | View loan balance and repayment schedule |
| My Profile | My Workspace → Profile | Update personal contact details and bank account |

### Submitting a Leave Request

1. Go to **My Workspace → Leaves → New Request**.
2. Select the **Leave Type** (Annual, Sick, Maternity, etc.).
3. Enter the **From Date** and **To Date**.
4. Add a brief **Reason**.
5. Attach a medical certificate (required for sick leave).
6. Click **Submit** — the request goes to HR for approval.
7. You receive an in-app and email notification when approved or rejected.

### Viewing Payslips

1. Go to **My Workspace → Payslips**.
2. Select the month from the dropdown.
3. Click **Download PDF** to save your payslip.

The payslip shows: basic salary, allowances, overtime, PIT deducted, employee pension (7%), loan deductions, net pay, and employer pension (11%) — shown separately as an employer cost.

---

## HR Calendar

Navigate to **HR → Calendar** (`/calendar`) — requires `leaves:read`.

The HR Calendar provides a consolidated view of all leave, holidays, and attendance events for the organization.

### Views

| View | Shows |
|------|-------|
| Month | All approved leaves and public holidays for the month — colour-coded by employee and leave type |
| Week | Detailed week view with attendance check-in/out times |
| Department filter | Filter by department to see availability at a glance |

### Using the Calendar for Planning

- **Identify coverage gaps** — see when multiple employees from the same department are on leave simultaneously
- **Plan around public holidays** — Ethiopian public holidays (pre-loaded) are shown alongside approved leaves
- **Attendance at a glance** — check-in status for the current day is visible in real time

---

## PAYE & Pension Declarations

Navigate to **HR → PAYE & Pension** (`/hr/paye-declarations`) — requires `payroll:read`.

The PAYE Declarations page generates the monthly PIT and pension submission schedules required for ERCA remittance.

### Monthly PAYE Report

After approving payroll for the month:

1. Go to **HR → PAYE & Pension**.
2. Select the month.
3. Click **Generate PAYE Schedule** — OVDS produces a report showing:

| Column | Description |
|--------|-------------|
| Employee Name | Full legal name |
| TIN | Employee's Tax Identification Number |
| Gross Taxable Salary | Basic + allowances − exempt items |
| PIT Withheld | Income tax deducted per the progressive brackets |
| Employee Pension (7%) | Pension deducted from salary |
| Employer Pension (11%) | Company's matching contribution |
| Net Pay | Amount paid to the employee |

4. Click **Export CSV** — submit to the eTax portal or use as the bank transfer schedule.
5. Click **Export PDF** — formatted payroll declaration for internal records.

### Remitting PIT and Pension to ERCA

After generating the PAYE schedule:

1. Log in to [etax.erca.gov.et](https://etax.erca.gov.et).
2. Select **Tax Declaration → PAYE**.
3. Enter the total PIT withheld for the month.
4. Submit and download the payment slip.
5. Pay via commercial bank or Telebirr.
6. Return to OVDS → **Tax → Record Filing** → log the payment reference.

**Pension remittance** follows the same process via the **Pension** section of the eTax portal. See [Tax & Compliance → BIT & DRRF → Pension Submissions](../06-tax-compliance/bit-and-drrf.md#pension-submissions).

---

## Gratuity & Severance

Navigate to **HR → Gratuity & Severance** (`/hr/gratuity`) — requires `employees:read`.

Ethiopian Labour Law entitles permanent employees to gratuity (a lump-sum payment) upon termination or retirement, calculated based on years of service and final salary.

### Gratuity Calculation (Ethiopian Labour Proclamation 1156/2019)

| Years of Service | Gratuity Rate |
|:----------------:|:------------:|
| < 1 year | Not entitled |
| 1–3 years | 1 month's salary per year of service |
| 3–10 years | 1.5 months' salary per year |
| > 10 years | 2 months' salary per year |

**Formula:**
```
Gratuity = Final Month's Gross Salary × Rate × Years of Service

Example:
  Employee with 7 years of service
  Final gross salary = ETB 18,000
  Rate = 1.5 months/year
  Gratuity = ETB 18,000 × 1.5 × 7 = ETB 189,000
```

### Computing Gratuity in OVDS

1. Go to **HR → Gratuity & Severance**.
2. Select the employee and their **Termination Date**.
3. OVDS automatically calculates:
   - Years of service (from start date to termination date)
   - Applicable rate per the Labour Proclamation
   - Gratuity amount based on the final month's gross salary
4. Review the calculation.
5. Click **Record Gratuity** — OVDS creates the GL entry:
   ```
   Dr  Gratuity Expense (6150)
       Cr  Gratuity Payable (2190)
   ```
6. When the gratuity is paid: `Dr Gratuity Payable / Cr Cash/Bank`.

### Severance Pay

Severance is distinct from gratuity — it applies when an employee is terminated without cause or made redundant.

| Scenario | Entitlement |
|----------|------------|
| Termination without cause | 30 days' pay per year of service |
| Redundancy / restructuring | As negotiated, subject to Labour Law minimum |
| Resignation | Not entitled to severance (gratuity only) |
| Retirement | Gratuity only |

OVDS calculates severance using the same workflow as gratuity — select the termination reason and OVDS applies the correct formula.

### Gratuity Provision (IAS 19)

For IFRS-compliant companies, gratuity is an employee benefit that must be provisioned monthly — not just recorded when paid.

1. Go to **HR → Gratuity & Severance → Provisions**.
2. Click **Run Monthly Provision** — OVDS calculates the accrued gratuity liability for all active employees based on current service length and salary.
3. A journal entry is posted:
   ```
   Dr  Gratuity Expense (6150)
       Cr  Gratuity Provision (2191)
   ```
4. When an employee is actually paid gratuity, the provision is released and the payment is recorded against it.

> IAS 19 requires the gratuity obligation to be measured using the Projected Unit Credit method for large companies. For Tier 2 companies, the simplified approach (accumulating annual charges) is acceptable. Configure the method in **Settings → IFRS → Employee Benefits**.

---

### Annual Leave Accrual (IAS 19)

Under IAS 19, unused annual leave is a short-term employee benefit that must be recognised as a liability on the balance sheet — **accrued monthly**, not only when leave is taken or paid out.

**Why this matters:** If 15 employees each have 8 days of unused leave at month-end, the company owes them that leave as a liability. Ignoring it understates current liabilities and overstates profit.

#### Monthly Accrual Calculation

```
Monthly Leave Accrual = (Annual Leave Days ÷ 12) × Daily Rate

Daily Rate = Monthly Basic Salary ÷ 26 working days

Example (1 employee):
  Monthly basic salary  = ETB 18,000
  Annual leave days     = 16 days
  Daily rate            = ETB 18,000 ÷ 26 = ETB 692.31
  Monthly accrual       = (16 ÷ 12) × ETB 692.31 = ETB 923.08/month
```

#### Posting the Leave Accrual

1. Go to **Accounting → Journal Entries → Post from Template** → select the **Leave Accrual** template.
   *(Or create manually: **Accounting → Journal Entries → New Entry**.)*
2. Post the entry:
   ```
   Dr  Leave Expense (6xxx)
       Cr  Accrued Leave Payable (2051)
   ```
3. The liability on the balance sheet grows monthly until leave is taken.

#### Reversing When Leave Is Taken

When an employee actually takes leave:
1. The leave days are recorded in **HR → Attendance** (leave approved via the workflow).
2. The accrued liability is reduced:
   ```
   Dr  Accrued Leave Payable (2051)
       Cr  Leave Expense (6xxx)    ← reversal of accrual
   ```
   Or, if leave is encashed on departure (see [Payroll Edge Cases → Leave Encashment](./payroll-edge-cases.md#leave-pay--annual-leave-encashment)):
   ```
   Dr  Accrued Leave Payable (2051)
       Cr  Cash / Bank
   ```

> Add a **Recurring Journal Template** for the monthly leave accrual in **Accounting → Journal → Templates** to avoid re-entering it each month. See [GL & Journal Entries → Recurring Templates](../04-financial-ops/general-ledger-and-journals.md#recurring-journal-templates).

---

## Payroll Administration Reference

Navigate to **HR → Payroll Administration** (`/payroll-administration`) — requires `payroll:admin`.

| Setting | Description |
|---------|-------------|
| Payroll Periods | Define the pay cycle (monthly, bi-weekly) and cut-off dates |
| Other Payment Heads | Add bonus, transport allowance, housing allowance, overtime types |
| Other Deduction Heads | Add loan recovery, advance recovery, union dues, penalty deductions |
| Per-Diem Tiers | Set daily allowance rates per location tier (Addis, regional, international) |
| Arrears | Process retroactive salary adjustments for prior periods |
| Bulk Upload | Import salary data from CSV for mass updates |

### Adding a Bonus or Allowance

1. Go to **Payroll Administration → Other Payment Heads → New**.
2. Enter: Name (e.g. *Performance Bonus*), whether it is taxable (toggle), and the GL account to post to.
3. Click **Save** — the head is now available when generating payroll.
4. Assign amounts per employee in their employee profile under **Other Payments**.

### Setting Up a Loan Deduction

1. Go to **Payroll Administration → Other Deduction Heads → New**.
2. Enter: Name (e.g. *Staff Loan Recovery*), GL account, and whether it reduces the pension base.
3. Assign the deduction to specific employees in **HR → Employees → [Employee] → Deductions**.
4. The amount is deducted automatically on every payroll run until the loan balance is cleared.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Full payroll generation workflow | [HR & Payroll](./hr-and-payroll.md#payroll-generation) |
| Payroll reports and PIT certificates | [Reports → Payroll Reports](../07-reports/payroll-reports.md) |
| Pension submission to eTax | [Tax & Compliance → BIT & DRRF](../06-tax-compliance/bit-and-drrf.md#pension-submissions) |
| Employee expense claims | [Financial Ops → Expense Claims](../04-financial-ops/expense-claims.md) |
| Leave analytics report | [Reports → Payroll & Attendance Reports](../07-reports/payroll-reports.md#leave-analytics) |
| Attendance tracking methods | [HR & Payroll → Attendance](./hr-and-payroll.md#attendance) |




