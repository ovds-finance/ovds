<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Banking Module User Flow

> **Part of:** [Banking](./README.md)
>
> **Requires:** Login · `banking:read` · `bank_reconciliation:read` · various permissions per section

This guide covers the complete end-to-end banking lifecycle in OVDS — from setting up accounts and importing transactions, through reconciliation, to year-end closing. It also covers automated workflows, role-based access, API integration, and troubleshooting.

---

## 1. Setting Up Accounts

Before recording money flowing in or out, you must create a designated payment account.

### Adding a Bank Account

1. Go to **Banking → Accounts** (`/accounting` → Banks tab) — requires `banking:read`.
2. Click **New Bank Account**.
3. Fill in the details:

| Field | Required | Notes |
|-------|----------|-------|
| Account Name | ✅ | Name as it appears on statements |
| Account Number | ✅ | Full account number |
| Currency | ✅ | ETB for domestic; USD/EUR/GBP for forex accounts |
| Opening Balance | ✅ | Balance on the date you start using OVDS |
| Account Type | ✅ | Bank (Checking, Savings) or Credit Card |
| Opening Date | ✅ | The date of the opening balance |

4. Click **Save**.

> OVDS supports unlimited accounts per company — checking, savings, petty cash, foreign currency, and credit cards — all managed from a single dashboard with a consolidated balance view.

---

## 2. Importing Transactions

OVDS gives you two ways to feed your transaction data into the software.

### Option A — Automated Bank Feeds

Use the OVDS Bank Feeds App to securely connect your bank via Plaid or GoCardless.

1. Go to **Banking → Bank Feeds** (`/bank-feeds`).
2. Select your institution.
3. Log in to auto-sync transactions.

### Option B — Manual Import

If you prefer to upload statements, go to **Banking → Import Statement** (`/bank-statement-import`) — requires `bank_statement_import:write`.

| Format | Description |
|--------|-------------|
| CSV | Standard comma-separated — most banks support this |
| OFX/QFX | Open Financial Exchange — some international banks |
| PDF (OCR) | AI-powered PDF parsing — requires OpenAI or Gemini API key |

1. Upload your `.OFX`, `.QBO`, or `.XML` file exported from your bank.
2. Map columns: Date, Description, Debit, Credit, Balance.
3. Preview the transactions.
4. Click **Import** — transactions are created and marked as **Unreconciled**.

---

## 3. Managing Transactions & Transfers

Once your accounts are linked, you can review, create, and categorize every individual transaction.

### Recording Transactions Manually

Navigate to **Banking → Transactions** (`/transactions`) — requires `ovds:read`.

1. Click **New Transaction**.
2. Select **Type**: Income (deposit) or Expense (withdrawal).
3. Select the **Bank Account**.
4. Enter: Date, Amount, Description, Reference Number.
5. Assign a **Category** — maps the transaction to a GL account.
6. Optionally link to an existing **Invoice** or **Bill**.
7. Click **Save**.

### Revenues & Expenses

- Navigate to **Banking → Transactions** (`/transactions`).
- Click **New Income** or **New Expense** to manually add entries.
- Assign them to categories or customers, and attach receipts.

### Transfers

If moving money between your own accounts, navigate to **Banking → Fund Transfers** (`/fund-transfers`) — requires `fund_transfers:read`.

1. Click **New Transfer**.
2. Specify the **Source Account** and **Destination Account**.
3. Enter **Date**, **Amount**, and an optional **Reference**.
4. Add a **Description** if needed.
5. Click **Save**.

OVDS automatically creates:
- A debit entry on the source account
- A credit entry on the destination account
- Two corresponding GL journal entries

### Invoices & Bills

Transactions can be linked directly to outstanding customer invoices or mounting vendor bills when you create or edit the transaction.

---

## 4. Reconciliation

Reconciliation ensures that your records in OVDS perfectly mirror your real-life bank statements.

### Starting a Reconciliation

1. Go to **Banking → Reconcile** from the bank account detail page.
2. Enter the **Statement Ending Date** and **Ending Balance** from your bank statement.
3. OVDS shows all unreconciled transactions for the period.

### Matching Transactions

For each transaction in OVDS, take one of these actions:

| Action | When to Use |
|--------|------------|
| **Match** | Click to mark the transaction as reconciled |
| **Unmatch** | Undo a match |
| **Create** | Add a missing transaction directly from the reconciliation screen |

Work through all transactions until the **Difference** counter reaches **ETB 0.00**.

### Transaction Statuses

| Status | Meaning |
|--------|---------|
| **Unreconciled** | Transaction not yet matched to bank statement |
| **Reconciled** | Matched and confirmed — locked against editing |
| **Excluded** | Intentionally excluded (e.g., in-transit items) |

### Completing Reconciliation

When the **Difference = ETB 0.00**:

1. Click **Finish Reconciliation**.
2. A reconciliation report is generated and saved.
3. All matched transactions are **locked** — they cannot be edited without unlocking.
4. The reconciliation appears in the history for audit purposes.

---

## 5. Advanced Automations & Custom Workflows

Once your core banking flow is operational, you can optimize it using specialized modules and automations.

### Automated Matching Rules

Use automated rules to scan imported transactions. The system automatically categorizes recurring items like utility bills, software subscriptions, or regular vendor payouts.

### Batch Actions

Navigate to **Banking → Transactions** (`/transactions`) to select multiple unassigned rows at once. You can:
- Bulk-assign them to a category
- Mark them as paid
- Delete duplicates in one click

### Multi-Currency Handling

If you operate an international business account, OVDS automatically applies live exchange rates. It calculates realized gains or losses when transactions settle against invoices billed in foreign currencies.

---

## 6. Reports & Financial Insights

The banking flow directly feeds your financial dashboards, transforming raw transaction logs into actionable accounting metrics.

### Cash Flow Report

Located under **Reports → Cash Flow** (`/reports/cash-flow`) — requires `reports:read`. Shows monthly cash inflows versus outflows to help track liquidity trends.

### Income vs. Expenses

This dashboard provides a visual breakdown of your highest expense categories and primary revenue streams.

### Account Balance Sheet

Dynamically updates your current assets based on settled, cleared, and reconciled transactions across all connected banks.

---

## 7. User Roles & Security Permissions

When collaborating with a team or an external auditor, you must restrict or grant access to sensitive banking data.

| Role | Permissions |
|------|------------|
| **Admin** | Full administrative privileges across all connected bank accounts, setups, and system integrations |
| **Accountant** | Standard access to view balances, manage transactions, perform transfers, and run financial audits. They cannot change underlying company billing settings or link/unlink primary institutions |
| **Custom Permissions** | If utilizing the team access modules, you can restrict users to specific store locations or restrict them from viewing bank account opening balances |

---

## 8. Auditing & Fixing Discrepancies

If your reconciliation balance fails to match your actual bank statement, use this quick checklist:

```
[Unreconciled Discrepancy]
   │
   ├──► Check Date Ranges ──► Ensure statement start/end dates match exactly
   │
   ├──► Locate Duplicates ──► Scan for manual entries that double-count automated feeds
   │
   └──► Inspect Transfers ──► Verify inter-account movements are not logged as standard expense/income
```

### Common Discrepancy Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Date Window Inconsistencies | Statement date range does not encompass every transaction | Go to **Banking → Reconciliations**. Double-check that your statement date range encompasses every transaction being flagged |
| Duplicate Entries | A manual income/expense was logged, and an automated bank feed pulled the same transaction | Select the duplicate row under **Transactions** and click **Delete** |
| Broken Transfers | Money moved between internal accounts is labeled as a standard expense/income | Ensure inter-account movements are labeled explicitly as a **Transfer** rather than a standalone expense and distinct revenue entry |

---

## 9. Year-End Closing Flow

At the end of your financial fiscal year, the banking flow locks your records to prevent retrospective data modification.

### Closing Sequence

1. **Finalize Clearing** — Ensure every transaction up to your closing date has a status of **Reconciled**.
2. **Locking the Period** — Use the accounting settings panel to lock past periods. This prevents manual entries from accidentally altering finalized cash balances.
3. **Exporting Ledgers** — Generate and archive your general ledger and banking transaction summaries for tax filing and compliance audits.

---

## 10. Developer & API Integration Flow

For custom platforms, ERPs, or proprietary checkout setups, OVDS allows you to manipulate banking flows programmatically via its REST API.

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/banking/accounts` | Manage bank accounts |
| `/api/banking/transactions` | Manage transactions |
| `/api/banking/transfers` | Manage transfers |

### Payload Structure

When pushing external transactions into the flow, use JSON payloads to declare fields like:

| Field | Description |
|-------|-------------|
| `account_id` | Target bank account |
| `amount` | Transaction amount |
| `type` | `income` or `expense` |
| `paid_at` | Transaction date |

### Webhook Listeners

Set up listeners to fire alerts to external systems whenever:
- A transaction is marked as **Reconciled**
- A payment is cleared

---

## 11. Troubleshooting Sync Failures

If you are using automated bank feeds, third-party authentication tokens occasionally expire or break due to bank security protocols (MFA/OAuth).

### Token Expiration

Bank connection tokens typically expire every 90 days due to open banking security standards.

1. Go to **Banking → Bank Feeds**.
2. Click **Re-authenticate**.
3. Input MFA OTP.
4. Sync resumed.

### Missed Sync Windows

If a disconnection causes a multi-week gap in data, use the manual **MT940/OFX Import** tool (`/bank-statement-import`) to plug the historical coverage gap without creating duplicate ledger entries.

---

## Summary of the Complete Lifecycle

```
[ Setup Accounts ]
        │
        ▼
[ Import Feeds ] ──► (Manual Upload or Automated API)
        │
        ▼
[ Categorize ]   ──► (Match to Invoices, Bills, or Expense Categories)
        │
        ▼
[ Reconcile ]    ──► (Balance Out to Zero Discrepancy)
        │
        ▼
[ Lock Period ]  ──► (Audit, Archive, and Close Fiscal Year)
```

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Add a bank account | [Bank Accounts](./bank-accounts.md) |
| Record a manual transaction | [Bank Accounts → Manual Transactions](./bank-accounts.md#recording-transactions-manually) |
| Import bank statements | [Bank Reconciliation](./bank-reconciliation.md) |
| Reconcile transactions | [Bank Reconciliation](./bank-reconciliation.md) |
| Digital payments (Telebirr, Chapa) | [Digital Payments](./digital-payments.md) |
| Treasury and cash forecasting | [Treasury & Collections](./treasury-collections.md) |
| Multi-currency handling | [Financial Ops → Multi-Currency & FX](../04-financial-ops/multi-currency.md) |
| Period lock after reconciliation | [Tax & Compliance → IFRS & Audit → Period Lock](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) |




