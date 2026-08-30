<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Payroll Edge Cases

> **Part of:** [Advanced Modules](./README.md) › HR & Payroll
>
> **Requires:** Login · `payroll:read` · `payroll:admin`
>
> **Related:** [HR & Payroll](./hr-and-payroll.md) · [Employee Self-Service, PAYE & Gratuity](./employee-self-service.md)

This guide covers non-standard payroll scenarios that arise in day-to-day HR operations: mid-month hires, pro-rated salaries, salary changes, arrears, termination pay, and payroll corrections.

---

## Mid-Month Hire — Pro-Rated Salary

When an employee joins mid-month, they are entitled to a salary proportional to the days worked.

### How OVDS Calculates Pro-Ration

```
Pro-Rated Salary = (Monthly Salary ÷ Working Days in Month) × Days Worked

Example:
  Monthly salary    = ETB 18,000
  Working days       = 22 (in the hire month)
  Start date         = 15th of the month → 10 working days remaining
  Pro-Rated Salary  = (18,000 ÷ 22) × 10 = ETB 8,182
```

### Steps in OVDS

1. Add the employee in **HR → Employees** with their **Start Date** set to the actual first day of work.
2. On payroll generation, OVDS detects the start date falls within the current month.
3. The salary is automatically pro-rated — the full calculation is shown on the payslip.
4. PIT and pension are calculated on the pro-rated amount, not the full monthly salary.

> If OVDS does not auto-detect the start date (e.g. the employee was added after generation), manually adjust the salary amount in **HR → Payroll → [Employee Row] → Override Gross** before verifying.

---

## Mid-Month Termination — Final Pay Calculation

When an employee leaves before the end of the month:

1. Set the employee's **End Date** in **HR → Employees → Edit**.
2. On payroll generation, OVDS pro-rates the final month's salary the same way as a mid-month hire.
3. Add any outstanding items manually in **Payroll Administration → Other Payment Heads**:
   - Unused annual leave payout (leave balance × daily rate)
   - Notice pay (if applicable)
   - Gratuity (see [Employee Self-Service → Gratuity](./employee-self-service.md#gratuity--severance))
4. Ensure all pending loan deductions are settled or the remaining balance is transferred to an HR receivable.

---

## Salary Change Mid-Month

When an employee receives a pay rise or reduction effective mid-month:

### Option 1 — Apply from Next Month (Recommended)

Change the salary in **HR → Employees → Edit → Base Salary** with the new amount. The change takes effect from the next payroll generation. No mid-month adjustment needed.

### Option 2 — Apply Mid-Month with Arrears

If the change must be backdated:

1. Generate payroll for the current month at the old salary.
2. After generating, go to **Payroll Administration → Arrears → New Arrears Entry**.
3. Enter:
   - **Employee** — the affected employee
   - **Type** — Salary Arrears
   - **Amount** — the difference for the partial period: `(New Salary − Old Salary) × (Days remaining / Total days)`
   - **Pay Period** — the month the arrears will be paid
4. The arrears entry is included in the next payroll run automatically.

---

## Retroactive Salary Adjustment (Prior Periods)

When a salary change needs to be backdated to a previous period that is already approved:

1. Go to **Payroll Administration → Arrears → New Arrears Entry**.
2. Set the **Effective From** date to the period when the new salary should have started.
3. Enter the cumulative difference (sum of underpayment across all affected months).
4. OVDS includes the arrears amount in the next available payroll run.
5. The arrears are taxed as normal income in the month they are paid (not spread back).

> **IAS 19 note:** Retroactive salary changes create employee benefit obligations in prior periods. If material, post a prior-period adjustment journal entry. Consult your accountant.

---

## Bonus Payments

One-time or annual bonuses are processed through **Other Payment Heads**.

1. Go to **Payroll Administration → Other Payment Heads → New**.
2. Create a head named *Performance Bonus*, mark **Taxable = Yes**.
3. In the current payroll run, open the employee row → **Other Payments → Add → Select Performance Bonus → Enter Amount**.
4. The bonus is added to gross pay and PIT is calculated on the combined amount using the progressive brackets.

### Tax Treatment of Bonuses

Bonuses are taxable income under Ethiopian law. OVDS applies PIT to the total of basic salary + bonus in the month it is paid:

```
PIT = ((Basic + Bonus) × Rate) − Deductible
```

This may push the employee into a higher tax bracket for that month — this is correct per Ethiopian tax law.

---

## Allowances (Taxable vs Non-Taxable)

When creating a payment head in **Payroll Administration**:

| Allowance Type | `Taxable` Setting | PIT Treatment |
|----------------|:-----------------:|:-------------:|
| Performance Bonus | ✅ Yes | Added to gross, PIT calculated on total |
| Transport Allowance (cash) | ✅ Yes | Added to gross, PIT calculated on total |
| Housing Allowance (cash) | ✅ Yes | Added to gross, PIT calculated on total |
| Per-Diem (within approved rate) | ❌ No | Not taxable — excluded from PIT base |
| Medical Reimbursement (receipts) | ❌ No | Not taxable — excluded from PIT base |
| Uniform / Tool Allowance | ❌ No | Not taxable — excluded from PIT base |

> Always verify taxable status with your accountant — ERCA may challenge non-taxable classifications on audit.

---

## Payroll Correction (Already Approved Period)

If an error is found after payroll is approved and disbursed:

### Minor Correction — Recover/Pay via Next Month

1. Note the difference (overpayment or underpayment).
2. Add a **Deduction** (for overpayment) or **Arrears** (for underpayment) entry in the next payroll run.
3. Add a note to the payslip for the employee's records.

### Major Correction — Reverse and Reprocess

If the error is significant (wrong employee, entire salary missing):

1. Go to **HR → Payroll → [Affected Period] → More Actions → Unlock Period** — requires `ovds:approve`.
2. Correct the error.
3. Re-run **Verify → Finalize → Approve**.
4. Export and reissue payslips.
5. The correction is logged in the Audit Trail.

> Unlocking an approved payroll period requires ovds Director approval and is logged. Use sparingly — prefer the next-month correction where possible.

---

## Leave Pay — Annual Leave Encashment

When an employee leaves and has unused annual leave:

```
Leave Pay = (Annual Leave Days Remaining × Monthly Salary) ÷ 22 working days/month

Example:
  Remaining leave = 8 days
  Monthly salary  = ETB 24,000
  Leave Pay       = (8 × 24,000) ÷ 22 = ETB 8,727
```

1. Confirm the leave balance in **HR → Leaves → [Employee] → Balance**.
2. Add a **Leave Encashment** payment head in Payroll Administration (mark **Taxable = Yes**).
3. Enter the amount in the final payroll run.

---

## PAYE and Pension on Final Pay

On an employee's final payslip:
- PIT is calculated on **all earnings in the final month** including pro-rated salary, notice pay, leave encashment, and any arrears — using the normal progressive brackets.
- Gratuity payment is **not subject to PIT** under Ethiopian Labour Proclamation 1156/2019 — it is a tax-exempt terminal benefit.
- Pension is calculated on the **pro-rated basic salary only** — not on gratuity, leave pay, or bonuses.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Standard payroll generation workflow | [HR & Payroll](./hr-and-payroll.md#payroll-generation) |
| Gratuity and severance calculation | [Employee Self-Service → Gratuity](./employee-self-service.md#gratuity--severance) |
| Payroll PAYE declarations | [Employee Self-Service → PAYE](./employee-self-service.md#paye--pension-declarations) |
| Salary advances and loan deductions | [HR & Payroll → Loans](./hr-and-payroll.md#loans--salary-advances) |
| Payroll reports and PIT certificates | [Reports → Payroll Reports](../07-reports/payroll-reports.md) |




