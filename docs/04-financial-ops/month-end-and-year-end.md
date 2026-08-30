<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Month-End & Year-End Closing Guide

> **Part of:** [Financial Operations](./README.md)
>
> **Requires:** `ovds:read` · `ovds:write` · `vat:file` · `period_close:read`
>
> **For roles:** ovds · ACCOUNTING · ADMIN

This guide consolidates every step for closing an accounting period — from the first day of month-end preparation through to locking the period and filing with ERCA. Use it as a checklist every month, and supplement it with the year-end additions in December/July.

---

## Monthly Close Sequence

Work through these steps in order. Each step links to the detailed guide where needed.

### Week 1 of the New Month — Process Transactions

| # | Task | Navigate to | Guide |
|---|------|-------------|-------|
| 1 | Confirm all sales invoices are sent and statuses are correct | Sales → Invoices | [Managing Invoices](./managing-invoices.md) |
| 2 | Confirm all vendor bills for the prior month are entered | Purchases → Bills | [Creating a Bill](./creating-a-bill.md) |
| 3 | Approve pending expense claims | Purchases → Expenses → Pending | [Expense Claims](./expense-claims.md) |
| 4 | Post any manual journal entries (accruals, corrections) | Accounting → Journal Entries | [GL & Journal Entries](./general-ledger-and-journals.md) |
| 5 | Import bank statement and run auto-reconciliation | Banking → Import Statement | [Bank Reconciliation](../05-banking/bank-reconciliation.md) |
| 6 | Complete bank reconciliation (Difference = ETB 0.00) | Banking → Reconcile | [Bank Reconciliation](../05-banking/bank-reconciliation.md) |

---

### Week 1–2 — Period-End Adjustments

| # | Task | Navigate to | Guide |
|---|------|-------------|-------|
| 7 | Run monthly depreciation | ovds → Fixed Assets → Run Depreciation | [Fixed Assets](./fixed-assets.md#running-monthly-depreciation) |
| 8 | Release prepayment amortisation | Accounting → Templates → Post | [GL & Journal Entries](./general-ledger-and-journals.md#prepayment-amortisation) |
| 9 | Post month-end accruals | Accounting → Journal Entries → New Entry | [GL & Journal Entries](./general-ledger-and-journals.md#month-end-accruals) |
| 9a | Post IAS 37 provisions (tax penalties, DRRF overdue, severance) | Accounting → Journal Entries → New Entry | [GL & Journal Entries](./general-ledger-and-journals.md#ias-37--provisions-for-probable-obligations) |
| 10 | Post IFRS 16 lease entries (if applicable) | ovds → IFRS → Leases | [IFRS 16 Leases](../06-tax-compliance/leases-ifrs16.md) |
| 11 | Compute IFRS 9 ECL provision | Reports → IFRS 9 ECL → Post Provision | [Financial Reports](../07-reports/financial-reports.md#ifrs-9-ecl--expected-credit-loss) |

---

### By the 25th — Tax Preparation

| # | Task | Navigate to | Guide |
|---|------|-------------|-------|
| 12 | Review VAT computation draft | Tax → VAT Administration | [VAT & TOT](../06-tax-compliance/vat-and-tot.md) |
| 13 | Verify WHT certificates are generated | Purchases → WHT Certificates | [Creating a Bill → WHT Certificates](./creating-a-bill.md#wht-certificates) |
| 14 | Check Tax Liability Estimator matches expectation | Tax → Liability Estimator | [Tax Reports](../07-reports/tax-reports.md#tax-liability-dashboard) |
| 15 | Run payroll for the month | HR → Payroll → Generate | [HR & Payroll](../08-advanced/hr-and-payroll.md#payroll-generation) |
| 16 | Verify payroll — PIT brackets, pension caps, gross-to-net | HR → Payroll → Verify | [HR & Payroll](../08-advanced/hr-and-payroll.md#payroll-generation) |
| 17 | ovds approves payroll | HR → Payroll → Approve | — |

---

### By the 30th — File and Lock

| # | Task | Navigate to | Guide |
|---|------|-------------|-------|
| 18 | Run Trial Balance — confirm debits = credits | Reports → Trial Balance | [Financial Reports](../07-reports/financial-reports.md#trial-balance) |
| 19 | Review General Ledger for unusual entries | Reports → General Ledger | [Financial Reports](../07-reports/financial-reports.md#general-ledger) |
| 20 | File VAT return on eTax portal | Tax → VAT Administration → Submit to eTax | [VAT & TOT](../06-tax-compliance/vat-and-tot.md#step-4--submit-to-etax-portal) |
| 21 | Remit WHT on eTax portal | Tax → Filing → WHT | [WHT & Other Taxes](../06-tax-compliance/wht-and-other-taxes.md#filing-wht-monthly) |
| 22 | Remit PIT and pension for payroll | Tax → PAYE & Pension → Generate Schedule | [Employee Self-Service](../08-advanced/employee-self-service.md#monthly-paye-report) |
| 23 | Record all tax payment references in OVDS | Tax → Record Filing | — |
| 24 | Lock the accounting period | ovds → Period Close → Lock Period | [IFRS & Audit → Period Lock](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) |

---

## Monthly VAT Filing Quick Reference

```
Output VAT   =  Sum of VAT on all paid invoices (15%)
Input VAT    =  Sum of VAT on all paid bills (vendor TIN required)
Net VAT      =  Output − Input

If Net VAT > 0  →  Pay to ERCA by 30th
If Net VAT < 0  →  Carry forward or apply for refund
```

**Zero declaration:** If there were no transactions, still file a zero return by the 30th — failure to file incurs ETB 500/day penalty.

---

## Quarterly Additions (DRRF)

On **15th of October, January, April, July** — remit the Disaster Risk Reduction Fund levy.

| # | Task | Navigate to | Guide |
|---|------|-------------|-------|
| Q1 | Compute DRRF for the quarter | Tax → Disaster Fund → Compute | [BIT & DRRF](../06-tax-compliance/bit-and-drrf.md#quarterly-remittance-workflow) |
| Q2 | Generate DRRF remittance schedule | Tax → Disaster Fund → Generate Report | — |
| Q3 | Remit to EDRRMO and record payment | Tax → Disaster Fund → Record Payment | — |

---

## Quarterly BIT Installments

Pay 25% of estimated annual BIT on each of these deadlines:

| Deadline | Quarter |
|----------|---------|
| September 7 | Q1 |
| December 7 | Q2 |
| March 7 | Q3 |
| June 7 | Q4 |

Record each installment in OVDS: **Business Income Tax → Provisional Payments → Record Payment**.

See [BIT & DRRF → Provisional Tax](../06-tax-compliance/bit-and-drrf.md#provisional-tax--quarterly-installments).

---

## Year-End Close (Ethiopian Fiscal Year: Sene 30 / ~July 7)

Year-end adds these steps on top of the regular monthly close:

### Financial Statements

| # | Task | Navigate to | Guide |
|---|------|-------------|-------|
| Y1 | Finalise all year-end journal entries (depreciation, provisions, accruals) | Accounting → Journal Entries | [GL & Journal Entries](./general-ledger-and-journals.md) |
| Y2 | Prepare draft Balance Sheet | Reports → Balance Sheet | [Financial Reports](../07-reports/financial-reports.md#balance-sheet) |
| Y3 | Prepare draft Profit & Loss | Reports → Profit & Loss | [Financial Reports](../07-reports/financial-reports.md#profit--loss-income-statement) |
| Y4 | Prepare draft Cash Flow Statement | Reports → Cash Flow | [Financial Reports](../07-reports/financial-reports.md#cash-flow-statement) |
| Y5 | Prepare Statement of Changes in Equity (Tier 1/2) | Reports → Changes in Equity | [Financial Reports](../07-reports/financial-reports.md#statement-of-changes-in-equity) |
| Y6 | Export IFRS 9 ECL schedule for auditor | Reports → IFRS 9 ECL → Export PDF | [Financial Reports](../07-reports/financial-reports.md#ifrs-9-ecl--expected-credit-loss) |
| Y7 | Export Fixed Asset Register | Reports → Fixed Asset Register | [Fixed Assets](./fixed-assets.md#fixed-asset-register) |

### Tax — BIT Annual Return

| # | Task | Navigate to | Guide |
|---|------|-------------|-------|
| Y8 | Calculate BIT (30% of net profit or MAT 2.5% of turnover) | Business Income Tax | [BIT & DRRF](../06-tax-compliance/bit-and-drrf.md) |
| Y9 | Add back non-deductible expenses | Business Income Tax → Adjustments | [BIT & DRRF](../06-tax-compliance/bit-and-drrf.md#bit-calculation) |
| Y10 | Apply any loss carry-forward (up to 3 years) | Business Income Tax → Prior Year Losses | [BIT & DRRF](../06-tax-compliance/bit-and-drrf.md#loss-carry-forward) |
| Y11 | Cross-check BIT-declared revenue with VAT-reported turnover | Reports → Tax Summary | — |
| Y12 | File BIT return on eTax portal by **November 7** | Business Income Tax → File Return | [BIT & DRRF](../06-tax-compliance/bit-and-drrf.md#bit-annual-filing-workflow) |
| Y13 | Pay BIT balance (after deducting quarterly installments) | Business Income Tax → Record Final Payment | — |

### HR — Annual Requirements

| # | Task | Navigate to | Guide |
|---|------|-------------|-------|
| Y14 | Generate PIT Certificates for all employees | Reports → Payroll → PIT Certificates | [Payroll Reports](../07-reports/payroll-reports.md#pit-certificates-annual) |
| Y15 | Distribute PIT certificates to employees | Reports → PIT Certificates → Bulk Download | — |
| Y16 | Compute year-end gratuity provisions | HR → Gratuity & Severance → Provisions | [Employee Self-Service](../08-advanced/employee-self-service.md#gratuity-provision-ias-19) |

### Audit & Compliance

| # | Task | Navigate to | Guide |
|---|------|-------------|-------|
| Y17 | Archive old invoices and bills | Sales → Invoices → Archive (bulk) | [Managing Invoices](./managing-invoices.md#exporting-and-archiving-invoices) |
| Y18 | Engage external auditors (Tier 1/2 companies) | Tax → Audit Outsourcing | [IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md#audit-outsourcing) |
| Y19 | Share financial statements with external auditor | Administration → Users → Grant EXTERNAL_AUDITOR role | [IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md#setting-up-an-external-audit-engagement) |
| Y20 | Lock the fiscal year period | ovds → Period Close → Lock Period | [IFRS & Audit → Period Lock](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) |

---

## Compliance Score Targets

After each monthly close, verify the **Compliance Auditor** shows all green:

Navigate to **Tax → Compliance Auditor** (`/compliance-auditor`).

| Check | Target |
|-------|--------|
| VAT Return Filed | ✅ by 30th |
| WHT Remitted | ✅ by 30th |
| Payroll PIT Remitted | ✅ by payroll date |
| Pension Remitted | ✅ by payroll date |
| DRRF Remitted | ✅ by 15th of quarter-end month |
| BIT Filed (annual) | ✅ by November 7 |
| Audit Clean | ✅ No open critical findings |

A compliance score of 90+ (Grade A) means all obligations are on time.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Full VAT filing workflow | [VAT & TOT](../06-tax-compliance/vat-and-tot.md) |
| WHT certificate generation | [Creating a Bill → WHT Certificates](./creating-a-bill.md#wht-certificates) |
| BIT calculation and filing | [BIT & DRRF](../06-tax-compliance/bit-and-drrf.md) |
| Period lock workflow | [IFRS & Audit → Period Lock](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) |
| Bank reconciliation checklist | [Bank Reconciliation](../05-banking/bank-reconciliation.md#monthly-reconciliation-checklist) |
| Full automation cron schedule | [Automation & V&V Framework](../10-frameworks/automation-and-vv.md#cron-job-schedule) |



