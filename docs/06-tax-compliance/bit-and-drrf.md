<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Business Income Tax (BIT) & Disaster Risk Reduction Fund (DRRF)

> **Part of:** [Tax & Compliance](./README.md)
>
> **Requires:** Login · `bit:read` · `bit:file` · `disaster_fund:read`

---

## Business Income Tax (BIT)

Navigate to **Tax & Compliance → Business Income Tax** (`/business-income-tax`) — requires `bit:read`.

### BIT at a Glance

| Parameter | Value |
|-----------|-------|
| Rate | 30% on net taxable profit |
| Minimum Alternative Tax (MAT) | 2.5% of annual turnover — pay whichever is higher |
| Filing Deadline | November 7 (within 4 months of fiscal year end) |
| Ethiopian Fiscal Year End | July 6/7 (Sene 30) |
| Advance Tax | Quarterly installments — 25% each |
| Capital Gains Tax | 15% on asset disposals |
| Dividend Tax | 10% on distributed profits |
| Loss Carry-Forward | Up to 3 years |
| Cash Transaction Limit | ETB 30,000 — above this must be via bank or cheque to be deductible |

---

### BIT Calculation

```
Taxable Income  = Gross Revenue − Allowable Deductions
BIT             = Taxable Income × 30%
MAT             = Annual Turnover × 2.5%
Tax Payable     = MAX(BIT, MAT)
```

### Allowable Deductions

| Deduction | Notes |
|-----------|-------|
| Cost of Goods Sold | Directly matched to revenue |
| Employee Salaries & Benefits | Including employer pension contribution |
| Rent & Utilities | Business premises only |
| Depreciation | Per ERCA schedule: buildings 5%, machinery 20%, vehicles 20% |
| Interest on Business Loans | Bank loan interest only |
| Insurance Premiums | Business-related policies |
| Professional Fees | Audit, legal, accounting |
| Advertising & Marketing | Business-related |
| Pension Contributions | Employer portion (11%) |

### Non-Deductible Expenses

| Item | Reason |
|------|--------|
| Personal expenses | Not business-related |
| Cash payments > ETB 30,000 | Must be via bank/cheque to qualify |
| Fines and penalties | Including tax penalties |
| Dividends paid | Not an expense — an appropriation of profit |

---

### Provisional Tax — Quarterly Installments

Pay quarterly to spread the tax burden and avoid the 2%/month late-payment interest on a lump-sum annual payment.

| Quarter | Deadline | Amount |
|---------|----------|--------|
| Q1 | September 7 | 25% of estimated annual BIT |
| Q2 | December 7 | 25% of estimated annual BIT |
| Q3 | March 7 | 25% of estimated annual BIT |
| Q4 (final) | June 7 | 25% of estimated annual BIT |

> Base quarterly installments on last year's BIT liability as a safe estimate. Adjust at the annual filing if the actual figure differs.

Recording a quarterly payment in OVDS:
1. Go to **Business Income Tax → Provisional Payments**.
2. Click **Record Payment** for the quarter.
3. Enter the amount, date, and bank reference.
4. Status updates to **Paid** for the quarter.

---

### BIT Annual Filing Workflow

1. **Finalize Financial Statements** — ensure the P&L for the full fiscal year is complete and reconciled.
2. **Calculate BIT** — OVDS estimates BIT from the P&L; MAT is applied automatically if higher.
3. **Adjust for Tax Differences** — add back non-deductible expenses (cash payments > ETB 30,000, penalties, personal expenses).
4. **Cross-check with VAT** — ERCA compares BIT declarations with VAT returns. Consistent turnover figures reduce audit risk.
5. **Prior Year Losses** — if applicable, apply loss carry-forward (up to 3 years) to reduce taxable income.
6. **File Return** — submit to ERCA via the [eTax portal](https://etax.erca.gov.et) by **November 7**.
7. **Pay BIT** — pay the balance after deducting quarterly installments already paid.
8. **Record in OVDS** — enter the bank reference under **BIT → Record Final Payment**.

### Loss Carry-Forward

Corporate losses can be carried forward to offset future taxable income:
- Carry-forward period: up to **3 years**
- Record in OVDS: **Business Income Tax → Prior Year Losses**
- The system applies the carry-forward automatically in subsequent BIT calculations

---

## Disaster Risk Reduction Fund (DRRF)

Navigate to **Tax → Disaster Fund** (`/disaster-fund`) — requires `disaster_fund:read`.

Governed by **Council of Ministers Regulation No. 570/2025**, effective July 7, 2025.

### DRRF at a Glance

| Parameter | Value |
|-----------|-------|
| Rate | 1% – 5% depending on business activity |
| Filing Frequency | Quarterly |
| Q1 Deadline | October 15 |
| Q2 Deadline | January 15 |
| Q3 Deadline | April 15 |
| Q4 Deadline | July 15 |
| Applies To | 17+ business activity categories |

### DRRF Levy Categories

| Category | Rate | Example Activities |
|----------|------|-------------------|
| Manufacturing | 1% | Textiles, food processing, metalwork |
| Construction | 2% | Building, infrastructure, civil works |
| Trade & Commerce | 1% | Wholesale, retail |
| Financial Services | 3% | Banking, insurance, microovds |
| Hospitality | 2% | Hotels, restaurants, tourism |
| Transport | 1.5% | Freight, passenger transport |
| Mining & Extraction | 5% | Mining, quarrying |
| Telecommunications | 3% | ISPs, mobile operators |
| Healthcare | 1% | Private hospitals, clinics, pharmacies |
| Education | 1% | Private schools, universities, training centres |

### Auto-Calculation from Activity

OVDS calculates DRRF levies automatically based on:
- Invoice amounts for applicable activity types
- The business type configured in **Settings → Company Profile**
- Transaction categories mapped to DRRF-applicable revenue lines

### Quarterly Remittance Workflow

1. Go to **Tax → Disaster Fund** → select the current quarter.
2. Click **Compute** — OVDS aggregates all applicable transactions for the quarter.
3. Click **Generate Report** — creates the DRRF remittance schedule.
4. File and pay via the **Ethiopian Disaster Risk Management Commission** (EDRRMO) or through the eTax portal if integrated.
5. Return to OVDS → click **Record Payment** with the payment reference.
6. Status updates to **Remitted** for the quarter.

---

## Pension Submissions

Navigate to **Tax Filing Portal → Pension Submissions** (`/tax/pension-submission`) — requires `payroll:read`.

Pension is remitted monthly alongside PIT from payroll. OVDS generates the submission schedule directly from each payroll run.

### Pension Rates

| Contribution | Rate | Basis | Cap |
|---|---|---|---|
| Employee | 7% | Basic salary | ETB 15,000/month |
| Employer | 11% | Basic salary | ETB 15,000/month |
| **Total remittance** | **18%** | Per employee | — |

### Pension Submission Workflow

1. Run payroll for the month — OVDS calculates pension per employee automatically.
2. Go to **Tax → Pension Submissions** → select the period.
3. OVDS generates the **POESSA-format** pension schedule (employee name, pension number, contribution amount).
4. Export as PDF or CSV.
5. Remit via the eTax portal or bank transfer to the ERCA pension account.
6. Return to OVDS → record the payment reference — status updates to **Remitted**.
7. The pension remittance receipt is attached to the payroll record for audit.

> Late remittance penalty: **2%/month** on the outstanding amount. File on or before the payroll date each month.

---

## Tax Calendar Summary

| Deadline | Tax | Action |
|----------|-----|--------|
| 30th of each month | VAT / TOT / WHT | File and pay monthly returns |
| September 7 | BIT Q1 installment | Pay 25% of estimated annual BIT |
| October 15 | DRRF Q1 | Remit quarterly levy |
| December 7 | BIT Q2 installment | Pay 25% of estimated annual BIT |
| January 15 | DRRF Q2 | Remit quarterly levy |
| March 7 | BIT Q3 installment | Pay 25% of estimated annual BIT |
| April 15 | DRRF Q3 | Remit quarterly levy |
| June 7 | BIT Q4 installment | Pay 25% of estimated annual BIT |
| July 15 | DRRF Q4 | Remit quarterly levy |
| November 7 | BIT Annual | File and pay final BIT return |
| Monthly | PIT & Pension | Remit from payroll run |

---

## Related Topics

> **Lifecycle context:** BIT annual filing flows through [Phase 5 — e-Tax Submission](./../FILING-LIFECYCLE.md#6-phase-5--etax-submission--payment) and DRRF quarterly remittance through [Phase 4 — V&V Checks](./../FILING-LIFECYCLE.md#5-phase-4--v&v-pre-submission-checks) → [Phase 5](./../FILING-LIFECYCLE.md#6-phase-5--etax-submission--payment). BIT/MAT rates, pension rates, and deadlines are in [`CORE-CONFIG.md`](../CORE-CONFIG.md#7-tax-rate--deadline-summary). The tax calendar below integrates with [`FILING-LIFECYCLE.md`](./../FILING-LIFECYCLE.md#9-cron-automation-schedule) cron alerts.

| Topic | Where to go |
|-------|-------------|
| VAT and TOT filing | [VAT & TOT](./vat-and-tot.md) |
| WHT on vendor payments | [WHT & Other Taxes](./wht-and-other-taxes.md) |
| IFRS compliance and deferred tax | [IFRS & Audit](./ifrs-and-audit.md) |
| Fixed asset depreciation (ERCA vs IFRS) | [Financial Ops → Fixed Assets](../04-financial-ops/fixed-assets.md) |
| eTax portal | [etax.erca.gov.et](https://etax.erca.gov.et) |
| MoR contact | [mor.gov.et](https://mor.gov.et) · +251 11 662 98 00 |



