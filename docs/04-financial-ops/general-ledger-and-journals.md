<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# General Ledger & Journal Entries

> **Part of:** [Financial Operations](./README.md)
>
> **Requires:** Login · `ovds:read` · `ovds:write`
>
> **Navigate to:** **Accounting** (`/accounting`) · **Accounting Hub** (`/accounting-hub`)

The General Ledger (GL) is the master record of every financial transaction in OVDS. Every invoice, bill, payment, payroll run, and depreciation posting creates GL entries automatically. This guide covers the Chart of Accounts, manual journal entries, accruals, prepayments, and period-end adjustments.

---

## Chart of Accounts

Navigate to **Accounting → Chart of Accounts** (`/accounting?tab=accounts`).

### Seeding Ethiopian Default Accounts

For a new company, seed the standard account set before recording any transactions:

1. Go to **Accounting → Chart of Accounts → Seed Ethiopian Defaults**, or
2. Call `POST /ovds/accounts/seed` via the API.

This creates approximately 40 standard GL accounts aligned with IFRS IAS 1 and Ethiopian accounting practice. The seed is a starting point — you can add, rename, or archive accounts afterwards.

### Adding a Custom Account

1. Go to **Accounting → Chart of Accounts** → click **New Account**.
2. Fill in:

| Field | Required | Notes |
|-------|----------|-------|
| Account Code | ✅ | Unique numeric or alphanumeric code (e.g. `6450`) |
| Account Name | ✅ | Descriptive name (e.g. *Staff Entertainment*) |
| Account Type | ✅ | Asset, Liability, Equity, Revenue, or Expense |
| Sub-type | Optional | e.g. Current Asset, Operating Expense |
| Opening Balance | Optional | Enter a balance if migrating from another system |
| Description | Optional | Notes for team members |

3. Click **Save**.

### Account Type Rules

| Type | Normal Balance | Increases With |
|------|:-------------:|---------------|
| Asset | Debit | Debit |
| Liability | Credit | Credit |
| Equity | Credit | Credit |
| Revenue | Credit | Credit |
| Expense | Debit | Debit |

### Account Code Ranges (Ethiopian Default)

| Range | Category |
|-------|---------|
| 1000–1099 | Cash & Cash Equivalents |
| 1100–1199 | Accounts Receivable |
| 1200–1299 | Inventory |
| 1300–1399 | Prepaid Expenses |
| 1500–1599 | Property, Plant & Equipment |
| 1510–1519 | Accumulated Depreciation (contra) |
| 1600–1699 | Right-of-Use Assets (IFRS 16) |
| 2000–2099 | Accounts Payable |
| 2100–2199 | Accrued Expenses |
| 2150–2175 | Tax Payable (VAT, BIT, PIT, WHT, Pension, DRRF) |
| 2500–2599 | Long-term Loans |
| 3000–3999 | Equity |
| 4000–4999 | Revenue |
| 5000–5999 | Cost of Goods Sold |
| 6000–6999 | Operating Expenses |
| 7000–7999 | ovds Costs (Interest) |
| 8000–8999 | Income Tax Expense |

---

## General Ledger View

Navigate to **Reports → Financial → General Ledger** (`/reports?type=gl`) — requires `reports:gl:read`.

The GL shows every journal entry for any period, grouped by account. Use it to:
- Verify the source of any Balance Sheet or P&L figure by drilling into the account
- Investigate unexpected balances before period close
- Export the full GL as CSV for the external auditor

**Filters available:**
- Date range
- Account code or name
- Reference number
- Posted by (user)

**Drill-down:** Click any line to open the source document — the original invoice, bill, payment, payroll run, or manual entry.

---

## Manual Journal Entries

Navigate to **Accounting → Journal Entries** (`/accounting?tab=journal`).

Use manual entries for adjustments that cannot be captured through invoices or bills:
- Month-end accruals (expenses incurred but not yet billed)
- Prepayment amortisation (allocating prepaid costs to the correct period)
- Reclassification entries (moving an amount between accounts)
- Year-end provisions (e.g. audit fee provision, DRRF provision)
- Correction entries (reversing a posting error)
- IFRS 9 ECL provision adjustments

### Creating a Journal Entry

1. Go to **Accounting → Journal Entries** → click **New Entry**.
2. Fill in:

| Field | Required | Notes |
|-------|----------|-------|
| Date | ✅ | Date the entry takes effect (must be in an open period) |
| Reference | ✅ | Your internal reference (e.g. *JE-2026-07-001*) |
| Description | ✅ | Brief explanation of the purpose |
| Debit lines | ✅ | Account, amount — add as many lines as needed |
| Credit lines | ✅ | Account, amount — total debits must equal total credits |
| Attachments | Optional | Supporting document (invoice, approval email, calculation) |

3. Verify that **Total Debits = Total Credits** — the system will not save an unbalanced entry.
4. Click **Post** — the entry is posted immediately and appears in the GL.

> Entries cannot be deleted after posting. To reverse a mistake, post a **Reversal Entry** (see below).

### Reversing a Journal Entry

1. Open the posted entry from the Journal Entries list.
2. Click **Reverse Entry**.
3. Select the reversal date (typically the first day of the next period).
4. Click **Post Reversal** — OVDS creates a mirror entry that cancels the original.
5. Both the original and the reversal appear in the GL, preserving the full audit trail.

---

## Month-End Accruals

Accruals record expenses that have been incurred in the current period but where no invoice has been received yet — for example, utility bills that arrive after month-end, or professional fees for work already completed.

### Standard Accrual Entry

```
Debit:  Expense Account (e.g. 6410 Utilities Expense)
Credit: Accrued Expenses (2100)
```

### Reversing the Accrual in the Next Period

When the actual invoice arrives:
1. Post the reversal of the accrual (dated the first day of the new period).
2. Record the actual bill in **Purchases → Bills** as normal.
3. The net effect is that the expense is recorded in the correct period.

---

## IAS 37 — Provisions for Probable Obligations

Under **IAS 37**, a provision must be recognised when:
1. There is a **present obligation** (legal or constructive) arising from a past event
2. An outflow of resources is **probable** (more likely than not)
3. The amount can be **reliably estimated**

Common provisions in Ethiopian businesses:

| Provision Type | GL Entry | When to Post |
|----------------|----------|--------------|
| VAT late-filing penalty | Dr Penalty Expense / Cr Penalty Provision | When filing is overdue — ETB 500/day |
| DRRF overdue levy | Dr DRRF Expense / Cr DRRF Payable | When quarterly deadline is missed |
| Severance obligation (IAS 19/37) | Dr Severance Expense / Cr Severance Provision | Monthly accrual from date of hire |
| Legal claim (probable loss) | Dr Legal Expense / Cr Claim Provision | When legal advice confirms probable outcome |
| Warranty provision | Dr Warranty Expense / Cr Warranty Provision | As percentage of sales (product companies) |

### Recording a Provision

1. Go to **Accounting → Journal Entries → New Entry**.
2. Debit the relevant expense account.
3. Credit the provision liability account (under 2100–2199 Accrued Expenses).
4. Add a description explaining the nature of the obligation and estimated amount.
5. Attach supporting evidence (legal letter, calculation worksheet).
6. Click **Post**.

### Releasing a Provision

When the obligation is settled:
```
Dr  Provision Liability (2xxx)
    Cr  Cash / Bank  (if paid)
    or
    Cr  Provision Reversal / Gain  (if obligation no longer exists)
```

If the actual payment differs from the provision:
- **Underprovided:** Post an additional expense for the difference
- **Overprovided:** Reverse the excess as income in the period it lapses

> **IAS 37 disclosure:** All material provisions must be disclosed in the Notes to Financial Statements — description, expected timing, and any uncertainties. See [IFRS Financial Statements Guide](../07-reports/IFRS-Financial-Statements-MoR.md) for the full disclosure template.

---

## Prepayment Amortisation

Prepayments are amounts paid in advance — annual insurance premiums, rent paid 6 months in advance, or software subscriptions.

### Recording a Prepayment

When the payment is made:
```
Debit:  Prepaid Expenses (1300)
Credit: Cash / Bank
```

### Monthly Release

Each month, release the portion that covers the current period:
```
Debit:  Expense Account (e.g. 6100 Insurance Expense)
Credit: Prepaid Expenses (1300)
Monthly amount = Total Prepayment ÷ Number of Months
```

Use a **Recurring Journal Template** to automate this — see [Accounting Knowledge Base → Recurring Templates](../10-frameworks/accounting-knowledge-base.md#recurring-journal-templates).

---

## Recurring Journal Templates

Navigate to **Accounting → Journal → Templates** (`/accounting?tab=journal&view=templates`).

Create templates for entries that repeat every month to avoid re-entering them manually.

**Common templates:**

| Template | Debit | Credit | Frequency |
|----------|-------|--------|-----------|
| Depreciation (IAS 16) | Depreciation Expense | Accumulated Depreciation | Monthly (automated by cron) |
| Prepaid rent release | Rent Expense | Prepaid Expenses | Monthly |
| Insurance amortisation | Insurance Expense | Prepaid Expenses | Monthly |
| Interest accrual | Interest Expense | Accrued Interest Payable | Monthly |
| Audit fee provision | Professional Fees | Accrued Expenses | Monthly |
| DRRF provision | DRRF Expense | DRRF Payable | Quarterly |

To use a template:
1. Open the template → click **Post from Template**.
2. Confirm the date and amount (adjust if needed).
3. Click **Post** — the journal entry is created instantly.

---

## Accruals & Prepayments Dashboard

Navigate to **Accounting → Accruals & Prepayments** (`/accounting/accruals-prepayments`).

This dashboard shows a summary of:
- All open accruals (accrued but not yet invoiced)
- All open prepayments (paid in advance, not yet fully amortised)
- Remaining balance per item
- Expected release schedule for the next 12 months

Use this at month-end to confirm all accruals have been reversed and prepayments are being correctly amortised.

---

## Period-End Closing Sequence

Before locking an accounting period, complete these steps in order:

| Step | Action | Where |
|------|--------|-------|
| 1 | Run monthly depreciation | ovds → Fixed Assets → Run Depreciation |
| 2 | Post accruals for unbilled expenses | Accounting → Journal Entries |
| 3 | Release prepayment amortisation | Accounting → Templates → Post |
| 4 | Compute and review VAT | Tax → VAT Administration → Compute |
| 5 | Run the Trial Balance | Reports → Trial Balance — confirm debits = credits |
| 6 | Compute IFRS 9 ECL provision | Reports → IFRS 9 ECL → Post Provision |
| 7 | File VAT / TOT / WHT on eTax portal | Tax → Filing |
| 8 | Lock the period | ovds → Period Close |

> See [Tax & Compliance → IFRS & Audit → Period Lock](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) for the full lock workflow.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Chart of Accounts structure | [Frameworks → Accounting Knowledge Base](../10-frameworks/accounting-knowledge-base.md#chart-of-accounts--ethiopian-defaults) |
| Recurring templates | [Frameworks → Accounting Knowledge Base](../10-frameworks/accounting-knowledge-base.md#recurring-journal-templates) |
| Trial Balance report | [Reports → Financial Reports](../07-reports/financial-reports.md#trial-balance) |
| General Ledger report | [Reports → Financial Reports](../07-reports/financial-reports.md#general-ledger) |
| Fixed asset depreciation entries | [Fixed Assets](./fixed-assets.md#running-monthly-depreciation) |
| IFRS 9 ECL provision | [Reports → Financial Reports](../07-reports/financial-reports.md#ifrs-9-ecl--expected-credit-loss) |
| Period lock workflow | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) |
| Opening balances | [Data Import / Export](./data-import-export.md#setting-opening-balances) |



