<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# HR & Payroll

> **Part of:** [Advanced Modules](./README.md)
>
> **Requires:** Login · `employees:read` · `payroll:read`
>
> **Navigate to:** **HR & Payroll** section

OVDS HR covers the full employee lifecycle — hire → attendance → leave → payroll → offboard. Payroll integrates directly with the General Ledger and generates ERCA-ready PIT and pension submissions.

---

## Employees

Navigate to **HR → Employees** (`/employees`) — requires `employees:read`.

### Employee Fields

| Field | Required | Notes |
|-------|----------|-------|
| First Name, Last Name | ✅ | Legal name as on national ID |
| Employee ID | ✅ | Unique internal identifier |
| Department | ✅ | Must exist in Departments |
| Shift | ✅ | Must exist in Shifts |
| Base Salary | ✅ | ETB/month — set > 0 to activate payroll |
| Employment Nature | ✅ | PERMANENT, CONTRACT, PART_TIME |
| Bank Name | Recommended | For payslip and direct deposit |
| Account Number | Recommended | For direct deposit |
| TIN | Recommended | Required for PIT certificate |
| Pension Number | Recommended | Required for pension remittance |
| Start Date | ✅ | Used for leave accrual and probation tracking |

### Adding an Employee

1. Go to **HR → Employees** → click **New Employee**.
2. Fill in the required fields.
3. Click **Save** — the employee is active in the next payroll run.

**Bulk import:** Use **Import Center → Employees** to import from CSV. Download the template for correct column headers.

---

## Departments & Shifts

### Departments — `/departments`
Organizational units with an assigned manager.

1. Go to **HR → Departments** → click **New Department**.
2. Enter name and assign a manager.
3. Employees are assigned to departments when their record is created or updated.

### Shifts — `/shifts`
Working hour schedules — Morning, Afternoon, Night, or custom.

1. Go to **HR → Shifts** → click **New Shift**.
2. Set the shift name, start time, end time, and grace period for late arrivals.
3. Assign employees to the shift in their employee profile.

### Holidays — `/holidays`
Public holiday calendar (Ethiopian public holidays pre-loaded + custom).

1. Go to **HR → Holidays** → click **New Holiday**.
2. Enter the date, name, and whether it applies company-wide or to specific departments.
3. Holidays are automatically excluded from attendance and leave calculations.

---

## Attendance

Navigate to **HR → Attendance** (`/attendance`) — requires `attendance:read`.

### Check-In Methods

| Method | How It Works |
|--------|-------------|
| Mobile (GPS) | Employee checks in via the browser — GPS verified against a configured geofence radius |
| QR Code | Employee scans a QR code at the entrance — new QR generated daily |
| Biometric | Fingerprint or face recognition via an enrolled biometric device |
| Manual | HR manually records attendance for an employee |

### Attendance Records

Each day an employee checks in, OVDS records:
- Check-in and check-out times
- Late arrival flag — triggered if check-in is after the shift start + grace period
- Overtime — calculated when check-out exceeds shift end by the configured threshold
- Absent — flagged automatically by a nightly cron job for employees with no check-in

### Biometric Enrollment — `/enrollment`

1. Go to **HR → Enrollment**.
2. Select the employee.
3. The employee places their finger (or presents their face) on the biometric device.
4. The biometric template is stored in the `BiometricData` record.
5. Future check-ins are verified against the stored template in real time.

---

## Leave Management

Navigate to **HR → Leaves** (`/leaves`) — requires `leaves:read`.

### Leave Types

| Type | Days/Year | Paid | Notes |
|------|-----------|:----:|-------|
| Annual Leave | 16+ | ✅ | Accrues monthly; accrual rules configurable |
| Sick Leave | 6 | ✅ | Medical certificate required |
| Maternity Leave | 90 | ✅ | Ethiopian Labour Proclamation |
| Paternity Leave | 3 | ✅ | |
| Bereavement Leave | 3 | ✅ | Immediate family only |
| Unpaid Leave | Unlimited | ❌ | Manager approval required |

### Leave Workflow

1. **Employee** submits a leave request in **My Workspace → Leave Requests** — selects type, from/to dates, and reason.
2. **HR** reviews the request — checks leave balance and overlap with other employees.
3. **HR** approves or rejects with a comment.
4. **Employee** receives an in-app and email notification.
5. Approved leave is reflected in the attendance records automatically.
6. Leave balance is deducted on the first day of the approved period.

### Leave Balance Tracking

- Accrual rules are configured per leave type in **HR → Leave Settings**.
- Employee balances are visible on their self-service portal and in the HR leave analytics report.
- HR can manually adjust balances (e.g. for a carry-over policy) via the employee record.

---

## Employee Benefits & Per-Diem

### Benefits
Track non-salary benefits per employee:
- Transport allowance
- Housing allowance
- Medical / health insurance
- School fees (company-sponsored)

Benefits are added as **Other Payment Heads** in **Payroll Administration** and appear as taxable or non-taxable lines on the payslip.

### Per-Diem Tiers
Location-based daily allowances for business travel — configured in **HR → Payroll Administration → Per-Diem Tiers**.

| Location Tier | Example Rate |
|--------------|-------------|
| Addis Ababa | ETB X/day |
| Regional cities | ETB Y/day |
| International | USD Z/day |

Claims at or below the configured rate are **auto-approved**. Claims above require manual HR review.

---

## Payroll Generation

Navigate to **HR → Payroll** (`/payroll`) — requires `payroll:read`.

### Ethiopian PIT Brackets (Proclamation 1395/2025)

| Monthly Income (ETB) | Rate | Deductible (ETB) |
|---------------------|:----:|:----------------:|
| 0 – 2,000 | 0% | 0 |
| 2,001 – 4,000 | 10% | 200 |
| 4,001 – 7,000 | 15% | 400 |
| 7,001 – 11,000 | 20% | 750 |
| 11,001 – 14,000 | 25% | 1,300 |
| > 14,000 | 35% | 2,700 |

**PIT Formula:**
```
Taxable Salary = Gross Salary − Employee Pension (7%)
PIT            = (Taxable Salary × Rate) − Deductible Amount
```

### Pension Rates (Proclamation 1395/2025)

| Contribution | Rate | Base | Cap |
|---|:---:|---|---|
| Employee | 7% | Basic salary | ETB 15,000/month |
| Employer | 11% | Basic salary | ETB 15,000/month |
| **Total remittance** | **18%** | Per employee | — |

### Payroll Workflow

| Step | Action | Permission |
|------|--------|-----------|
| 1. Generate | HR computes gross pay, PIT, pension, deductions, and net pay for all active employees | `payroll:generate` |
| 2. Verify | HR reviews the register — checks for anomalies (new hires, terminations, salary changes) | `payroll:verify` |
| 3. Finalize | HR locks the payroll period — no further changes allowed | `payroll:finalize` |
| 4. Approve | ovds verifies total cost and approves for disbursement | `payroll:approve` |
| 5. Export | Generate individual PDF payslips and the bank transfer file for bulk payment | `payroll:export` |

### Payroll Administration — `/payroll-administration`

Requires `payroll:admin`:
- Configure payroll periods
- Set up deduction heads (loans, advances, penalties, advance recovery)
- Configure payment heads (bonuses, allowances, overtime)
- Manage arrears and retroactive salary adjustments

### Loans & Salary Advances

1. Employee requests a loan or advance via **My Workspace → Loans**.
2. HR/ovds approves the request.
3. The approved amount is paid via Fund Transfer.
4. A repayment schedule is set up under **Payroll → Other Deductions → Loan Recovery**.
5. The deduction runs automatically each month until the balance is cleared.
6. Loan balance is visible on the employee's payslip and in HR loan reports.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Payroll reports and PIT certificates | [Reports → Payroll Reports](../07-reports/payroll-reports.md) |
| Pension submission to eTax | [Tax & Compliance → BIT & DRRF](../06-tax-compliance/bit-and-drrf.md#pension-submissions) |
| Expense claims and reimbursements | [Financial Ops → Expense Claims](../04-financial-ops/expense-claims.md) |
| HR recruitment agency invoice | [Financial Ops → Expense Claims](../04-financial-ops/expense-claims.md#1-corporate-agency-invoice) |
| Fund transfers for loan disbursements | [Banking → Bank Accounts](../05-banking/bank-accounts.md#fund-transfers-between-accounts) |




