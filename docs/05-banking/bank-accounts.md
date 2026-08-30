<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Bank Accounts & Transactions

> **Part of:** [Banking](./README.md)
>
> **Requires:** Login · `banking:read` · `ovds:read`

Navigate to **Banking → Accounts** (`/accounting` → Banks tab).

OVDS supports unlimited bank accounts per company — checking, savings, petty cash, foreign currency, and credit cards — all managed from a single dashboard with a consolidated balance view.

---

## Adding a Bank Account

1. Go to **Accounting → Banks**.
2. Click **New Bank Account**.
3. Fill in the account details:

| Field | Required | Notes |
|-------|----------|-------|
| Bank Name | ✅ | CBE, Awash, Dashen, Abyssinia, Wegagen, etc. |
| Account Number | ✅ | Full account number as shown on statements |
| Account Name | ✅ | Name as it appears on bank statements |
| Account Type | ✅ | See types below |
| Currency | ✅ | ETB for domestic; USD/EUR/GBP for forex accounts |
| Opening Balance | ✅ | Balance on the date you start using OVDS |
| Opening Date | ✅ | The date of the opening balance |

4. Click **Save**.

### Account Types

| Type | Use Case |
|------|---------|
| **Checking** | Day-to-day operating account — most common |
| **Savings** | Interest-bearing savings or reserve fund |
| **Petty Cash** | Small cash fund for minor expenses |
| **Foreign Currency** | USD, EUR, GBP accounts — FX gains/losses auto-calculated |
| **Credit Card** | Corporate credit card — tracked as a liability |

### Multi-Account Management

- All accounts appear on the **Accounting Dashboard** with a consolidated total balance.
- Set a **Default Account** in account settings — new transactions default to this account.
- Switch between accounts using the account selector in any transaction form.

---

## Recording Transactions Manually

Navigate to **Banking → Transactions** (`/transactions`) — requires `ovds:read`.

Manual entries are used for transactions not imported from a bank statement — such as cash sales, petty cash expenses, or corrections.

1. Click **New Transaction**.
2. Select **Type**:
   - **Income** — money received (deposit)
   - **Expense** — money paid out (withdrawal)
3. Select the **Bank Account**.
4. Enter:
   - **Date**
   - **Amount**
   - **Description** — brief reference (e.g. *Rent payment June*)
   - **Reference Number** — bank ref, cheque number, or Telebirr transaction ID
5. Assign a **Category** — maps the transaction to a GL account (see below).
6. Optionally link to an existing **Invoice** or **Bill** for reconciliation.
7. Click **Save**.

### Transaction Categories

Categories map bank transactions to the correct GL accounts. Navigate to **Banking → Categories** (`/transaction-categories`) to manage them.

| Category | GL Account | Type |
|----------|-----------|------|
| Sales Revenue | 4000 Revenue | Income |
| Rent Expense | 6100 Rent | Expense |
| Utilities | 6200 Utilities | Expense |
| Payroll | 5000 Salaries | Expense |
| Loan Repayment | 2100 Loans Payable | Expense |
| Tax Payment | 2200 Tax Payable | Expense |
| Petty Cash | 1050 Petty Cash | Income / Expense |

Custom categories can be created and mapped to any GL account.

---

## Fund Transfers Between Accounts

Navigate to **Banking → Fund Transfers** (`/fund-transfers`) — requires `fund_transfers:read`.

Use Fund Transfers to move money between your own accounts — for example, topping up petty cash or converting ETB to USD.

1. Click **New Transfer**.
2. Select **From Account** and **To Account**.
3. Enter **Amount**, **Date**, and an optional **Reference**.
4. Add a **Description** if needed.
5. Click **Save**.

OVDS automatically creates:
- A debit entry on the source account
- A credit entry on the destination account
- Two corresponding GL journal entries

### Transfer Types

| Type | Example |
|------|---------|
| Internal Transfer | Move funds between two company bank accounts |
| Petty Cash Top-up | Transfer from main account to petty cash float |
| Forex Conversion | Convert ETB to USD — exchange gain/loss is auto-calculated per IAS 21 |

---

## Petty Cash

Navigate to **Cash & Banking → Petty Cash** (`/petty-cash`) — requires `banking:read`.

### Setting Up a Petty Cash Fund

1. Go to **Accounting → Banks → New Bank Account**.
2. Set **Account Type** to **Petty Cash**.
3. Set the opening balance (e.g. ETB 5,000) — this is the float amount.
4. A dedicated petty cash GL account is created automatically.

### Recording Petty Cash Expenses

1. Go to **Banking → Transactions → New Transaction**.
2. Select the petty cash account.
3. Set type to **Expense**, enter the amount and description.
4. Assign a category (Office Supplies, Transport, etc.).
5. Attach a receipt photo if required by your policy.
6. Click **Save**.

### Replenishing the Petty Cash Float

When the balance runs low:
1. Go to **Banking → Fund Transfers**.
2. Transfer from your main bank account to the petty cash account.
3. Amount = sum of all expenses since the last replenishment — this restores the float to its original level.

### Monthly Petty Cash Reconciliation

Use the same bank reconciliation workflow. The **Petty Cash Audit** view (`/petty-cash`) shows all transactions grouped by category for management review.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Import a bank statement | [Bank Reconciliation](./bank-reconciliation.md) |
| Reconcile transactions | [Bank Reconciliation](./bank-reconciliation.md) |
| Digital payments (Telebirr, Chapa) | [Digital Payments](./digital-payments.md) |
| Treasury and cash forecasting | [Treasury & Collections](./treasury-collections.md) |
| FX rates and multi-currency | [Financial Ops → Multi-Currency & FX](../04-financial-ops/multi-currency.md) |




