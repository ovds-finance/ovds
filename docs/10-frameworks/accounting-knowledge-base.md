<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Accounting Knowledge Base

> **Part of:** [Frameworks & Reference](./README.md)
>
> **Requires:** Login · `ovds:read`
>
> **Navigate to:** **Frameworks → Accounting Knowledge Base** (`/accounting?tab=journal&view=golden-rules`)

A quick reference for the double-entry accounting principles that underpin every transaction in OVDS. Use this to understand how journal entries work, how the GL is structured, and how OVDS maps Ethiopian statutory obligations to IFRS-compliant accounts.

---

## The Golden Rules of Double-Entry Accounting

Every transaction in OVDS creates at least two journal entries — one debit and one credit — that must always balance.

| Account Type | Debit Effect | Credit Effect |
|-------------|:------------:|:-------------:|
| Asset | Increases (+) | Decreases (−) |
| Liability | Decreases (−) | Increases (+) |
| Equity | Decreases (−) | Increases (+) |
| Revenue / Income | Decreases (−) | Increases (+) |
| Expense | Increases (+) | Decreases (−) |

**Key principle:** Total Debits must always equal Total Credits. The Trial Balance (`/reports?type=trial-balance`) verifies this — any imbalance indicates a posting error that must be investigated before period close.

---

## Common Journal Entry Patterns

| Transaction | Debit | Credit |
|-------------|-------|--------|
| Customer pays invoice | Cash / Bank | Accounts Receivable |
| Issue an invoice to customer | Accounts Receivable | Sales Revenue |
| Pay a vendor bill | Accounts Payable | Cash / Bank |
| Record a vendor bill | Expense Account | Accounts Payable |
| Pay VAT to ERCA | VAT Payable | Cash / Bank |
| Record payroll | Salary Expense | Salary Payable + PIT Payable + Pension Payable |
| Pay employee net salary | Salary Payable | Cash / Bank |
| Record depreciation | Depreciation Expense | Accumulated Depreciation |
| Record DRRF levy | DRRF Expense | DRRF Payable |
| Customer advance (deposit) | Cash / Bank | Deferred Revenue |
| Recognize revenue from advance | Deferred Revenue | Sales Revenue |
| Write off bad debt | Bad Debt Expense | Accounts Receivable |
| Impairment loss (IFRS 9 ECL) | Impairment Loss | Allowance for Doubtful Debts |

---

## IFRS Accounting Chain in OVDS

Every financial event flows through this chain automatically:

```
Item / Service (IAS 2 / IFRS 15)
    ↓
Invoice or Bill (IFRS 15 revenue recognition)
    ↓
Journal Entry posted to GL (IAS 1)
    ↓
Income Statement or Balance Sheet line (IAS 1.81A)
    ↓
VAT Payable / DRRF Payable (IAS 12 / IAS 37)
    ↓
Income Tax — BIT (IAS 12 current + deferred tax)
```

---

## Chart of Accounts — Ethiopian Defaults

The seeded Chart of Accounts follows IFRS IAS 1 classification. Navigate to **Accounting → Chart of Accounts** (`/accounting?tab=accounts`).

### Standard Account Groups

| Range | Group | Type |
|-------|-------|------|
| 1000–1999 | Assets | Balance Sheet |
| 1000–1099 | Cash & Cash Equivalents | Current Asset |
| 1100–1199 | Accounts Receivable | Current Asset |
| 1200–1299 | Inventory | Current Asset |
| 1300–1399 | Prepaid Expenses | Current Asset |
| 1500–1599 | Property, Plant & Equipment | Non-current Asset |
| 1510–1519 | Accumulated Depreciation | Non-current Asset (contra) |
| 1600–1699 | Right-of-Use Assets (IFRS 16) | Non-current Asset |
| 2000–2999 | Liabilities | Balance Sheet |
| 2000–2099 | Accounts Payable | Current Liability |
| 2100–2199 | Accrued Expenses | Current Liability |
| 2150–2159 | VAT Payable | Current Liability |
| 2160–2169 | Income Tax Payable | Current Liability |
| 2170–2179 | WHT Payable | Current Liability |
| 2180–2189 | Pension Payable | Current Liability |
| 2190–2199 | DRRF Payable | Current Liability |
| 2500–2599 | Long-term Loans | Non-current Liability |
| 2600–2699 | Deferred Tax Liability (IAS 12) | Non-current Liability |
| 3000–3999 | Equity | Balance Sheet |
| 3000–3099 | Share Capital | Equity |
| 3100–3199 | Retained Earnings | Equity |
| 4000–4999 | Revenue | Income Statement |
| 4000–4099 | Sales Revenue | Revenue |
| 4100–4199 | Service Revenue | Revenue |
| 4200–4299 | Other Income | Revenue |
| 5000–5999 | Cost of Goods Sold | Income Statement |
| 6000–6999 | Operating Expenses | Income Statement |
| 6100–6199 | Salaries & Benefits | Expense |
| 6200–6299 | Depreciation | Expense |
| 6300–6399 | Travel & Transport | Expense |
| 6400–6499 | Office Expenses | Expense |
| 7000–7999 | ovds Costs | Income Statement |
| 7000–7099 | Interest Expense | Expense |
| 8000–8999 | Tax Expense | Income Statement |
| 8100–8199 | Income Tax Expense (BIT) | Expense |

### Seeding the Chart of Accounts

For a fresh installation:
1. Go to **Accounting → Chart of Accounts → Seed Ethiopian Defaults**, or
2. Call `POST /ovds/accounts/seed` via the API.

This creates the full standard account set. You can add, rename, or archive accounts afterward — the seed is a starting point, not a lock-in.

---

## Recurring Journal Templates

Navigate to **Accounting → Journal → Templates** (`/accounting?tab=journal&view=templates`).

Create templates for entries that repeat every month — depreciation adjustments, prepayment amortisation, accruals:

1. Go to **Accounting → Journal → Templates** → click **New Template**.
2. Enter the debit and credit account, description, and default amount.
3. Give the template a name (prefixed `RECURRING:` in the reference field automatically).
4. To use a template: click it → set the date and amount → click **Post**.

### Common Recurring Templates

| Template Name | Debit | Credit | When to Use |
|---|---|---|---|
| Monthly Depreciation | Depreciation Expense (6200) | Accumulated Depreciation (1510) | Last day of each month |
| Prepayment Amortisation | Prepaid Expense release to P&L | Prepaid Expenses (1300) | Monthly for prepaid rent/insurance |
| Accrued Expense | Expense Account | Accrued Expenses (2100) | Month-end for goods/services received but not yet invoiced |
| Deferred Revenue Release | Deferred Revenue (2200) | Sales Revenue (4000) | When performance obligation is satisfied (IFRS 15) |
| ECL Provision Adjustment | Impairment Loss | Allowance for Doubtful Debts | When IFRS 9 ECL provision changes |

---

## IAS 12 — Deferred Tax

When ERCA's depreciation schedule differs from IFRS useful life, a timing difference arises. OVDS posts the deferred tax entry automatically when IFRS mode is enabled.

```
Deferred Tax Liability = Timing Difference × BIT Rate (30%)

Example:
  IFRS depreciation (SLM 5 years) = ETB 100,000/year
  ERCA depreciation (DB 20%)      = ETB 200,000/year (Year 1)
  Timing difference               = ETB 100,000 (ERCA deducted more)
  Deferred Tax Liability          = ETB 100,000 × 30% = ETB 30,000

  Dr: Income Tax Expense   ETB 30,000
  Cr: Deferred Tax Liability ETB 30,000
```

The deferred tax liability unwinds in later years when ERCA depreciation falls below IFRS depreciation. See [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md) for configuration.

---

## Related Topics

> **Lifecycle context:** Double-entry journal posting is [Phase 1 — Data Capture](./../FILING-LIFECYCLE.md#2-phase-1--data-capture). The GL account map aligns with [`CORE-CONFIG.md`](./../CORE-CONFIG.md#6-gl-account-map). Deferred tax computation links to [Phase 2 — Tax Calculation](./../FILING-LIFECYCLE.md#3-phase-2--tax-calculation--accrual).

| Topic | Where to go |
|-------|-------------|
| Trial Balance — verify debits = credits | [Reports → Financial Reports](../07-reports/financial-reports.md#trial-balance) |
| General Ledger drill-down | [Reports → Financial Reports](../07-reports/financial-reports.md#general-ledger) |
| Opening balances setup | [Financial Ops → Data Import/Export](../04-financial-ops/data-import-export.md#setting-opening-balances) |
| Fixed asset depreciation entries | [Financial Ops → Fixed Assets](../04-financial-ops/fixed-assets.md) |
| IFRS 9 ECL provision | [Reports → Financial Reports](../07-reports/financial-reports.md#ifrs-9-ecl--expected-credit-loss) |
| Audit trail of all journal entries | [Administration → Audit Logs](../02-users-roles/rbac-matrix.md#audit-logs) |



