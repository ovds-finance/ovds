<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Banking

> **Part of:** [OVDS Documentation](../README.md) › Banking
>
> **Related modules:** [Financial Operations](../04-financial-ops/README.md) · [Tax & Compliance](../06-tax-compliance/README.md) · [Reports](../07-reports/README.md)

Full bank account management, transaction recording, OCR-powered statement import, and reconciliation workflow. All banking operations require `bank_reconciliation:read`.

---

## Standalone Guides

| Guide | Description |
|-------|-------------|
| [Bank Accounts & Transactions](./bank-accounts.md) | Add accounts, manual transactions, fund transfers, petty cash |
| [Bank Module User Flow](./banking-module-flow.md) | Complete end-to-end banking lifecycle, automation, roles, API, and troubleshooting |
| [Bank Statement Import & Reconciliation](./bank-reconciliation.md) | CSV/PDF import, column mapping, matching, month-end close |
| [Digital Payments — Telebirr & Chapa](./digital-payments.md) | Setup, auto-matching, unmatched payments, CBE Pay |
| [Treasury, Cash Forecasting & Collections](./treasury-collections.md) | 30/60/90-day forecast, loans, overdue AR, credit hold, write-offs |

---

---

## 1. Bank Accounts

Navigate to **Banking → Accounts** (`/accounting` → Banks tab).

### Adding a Bank Account
1. Go to **Accounting → Banks**
2. Click **New Bank Account**
3. Fill in:
   - **Bank Name** — CBE, Awash, Dashen, Abyssinia, Wegagen, etc.
   - **Account Number** — full account number
   - **Account Name** — as it appears on statements
   - **Currency** — ETB (or foreign currency for forex accounts)
   - **Opening Balance** — balance on the date you start using OVDS
   - **Opening Date** — the date of the opening balance

### Account Types
| Type | Description |
|------|-------------|
| Checking | Day-to-day operating account |
| Savings | Interest-bearing savings |
| Petty Cash | Small cash fund |
| Foreign Currency | USD, EUR, GBP accounts |
| Credit Card | Corporate credit card |

### Multi-Account Management
- Manage unlimited bank accounts per company
- View consolidated balance across all accounts on the Accounting Dashboard
- Set a **Default Account** for new transactions

---

## 2. Adding Transactions

Navigate to **Banking → Transactions** (`/transactions`).

### Manual Transaction Entry
1. Click **New Transaction**
2. Select **Type**: Income (deposit) or Expense (withdrawal)
3. Select **Bank Account**
4. Enter: Date, Amount, Description, Reference Number
5. Assign a **Category** (maps to a GL account)
6. Optionally link to an existing Invoice or Bill

### Transaction Categories
Navigate to **Banking → Categories** (`/transaction-categories`).

Categories map bank transactions to GL accounts:
| Category | GL Account | Type |
|----------|-----------|------|
| Sales Revenue | 4000 - Revenue | Income |
| Rent Expense | 6100 - Rent | Expense |
| Utilities | 6200 - Utilities | Expense |
| Payroll | 5000 - Salaries | Expense |
| Loan Repayment | 2100 - Loans Payable | Expense |
| Tax Payment | 2200 - Tax Payable | Expense |

Custom categories can be added and mapped to any GL account.

---

## 3. Bank Statement Import

Navigate to **Banking → Import Statement** (`/bank-statement-import`) — requires `bank_reconciliation:read`.

### Supported Import Formats
| Format | Description | Notes |
|--------|-------------|-------|
| CSV | Standard comma-separated | Most banks support this |
| OFX/QFX | Open Financial Exchange | Some international banks |
| PDF (OCR) | AI-powered PDF parsing | Requires OpenAI or Gemini API key |

### CSV Import Workflow
1. Download your bank statement as CSV from your bank's online portal
2. Go to **Import Statement** → select your bank account
3. Upload the CSV file
4. Map columns: Date, Description, Debit, Credit, Balance
5. Preview the transactions
6. Click **Import** — transactions are created and marked as **Unreconciled**

### OCR Import (PDF Statements)
For banks that only provide PDF statements:
1. Upload the PDF statement
2. OVDS uses AI (OpenAI GPT-4 or Gemini) to extract transactions
3. Review extracted transactions for accuracy
4. Confirm and import

**Setup:** Add `OPENAI_API_KEY` or `GEMINI_API_KEY` to `.env`.

### Duplicate Detection
OVDS automatically detects potential duplicates based on:
- Same date + same amount + same description
- Flagged for review before import

---

## 4. Reconciliation Workflow

Bank reconciliation matches your OVDS transactions against your bank statement to ensure accuracy.

### Starting a Reconciliation
1. Go to **Banking → Reconcile** (from the bank account detail page)
2. Enter the **Statement Ending Date** and **Ending Balance** from your bank statement
3. OVDS shows all unreconciled transactions for the period

### Matching Transactions
For each transaction in OVDS:
- **Match** — click to mark as reconciled (matches a line on the bank statement)
- **Unmatch** — undo a match
- **Create** — add a missing transaction directly from the reconciliation screen

### Reconciliation Status
| Status | Meaning |
|--------|---------|
| Unreconciled | Transaction not yet matched to bank statement |
| Reconciled | Matched and confirmed |
| Excluded | Intentionally excluded (e.g., in-transit items) |

### Completing Reconciliation
When the **Difference** reaches **ETB 0.00**:
1. Click **Finish Reconciliation**
2. A reconciliation report is generated and saved
3. All matched transactions are locked (cannot be edited)
4. The reconciliation appears in the history for audit purposes

### Common Reconciliation Issues
| Issue | Cause | Fix |
|-------|-------|-----|
| Outstanding deposits | Deposit recorded in OVDS but not yet cleared | Mark as in-transit |
| Outstanding cheques | Cheque issued but not yet cashed | Mark as in-transit |
| Bank charges | Bank fees not recorded in OVDS | Add transaction in OVDS |
| Timing differences | Transaction in different period | Check dates |

---

## 5. Fund Transfers Between Accounts

Navigate to **Banking → Fund Transfers** (`/fund-transfers`) — requires `fund_transfers:read`.

### Recording a Transfer
1. Click **New Transfer**
2. Select **From Account** and **To Account**
3. Enter **Amount**, **Date**, and **Reference**
4. Optionally add a **Description**
5. Click **Save**

OVDS automatically creates:
- A debit on the source account
- A credit on the destination account
- Two GL journal entries (debit cash/bank, credit cash/bank)

### Transfer Types
| Type | Example |
|------|---------|
| Internal Transfer | Move funds between two company bank accounts |
| Petty Cash Top-up | Transfer from main account to petty cash |
| Forex Conversion | Convert ETB to USD (records exchange gain/loss) |

---

## 6. Treasury & Cash Forecasting

Navigate to **ovds → Treasury Forecast** (`/treasury-forecast`) — requires `ovds:read`.

### Cash Flow Forecast
- Projects cash inflows (from outstanding invoices) and outflows (from unpaid bills)
- 30, 60, and 90-day forecast horizons
- Visual chart showing projected cash position
- Alerts when projected balance falls below a threshold

### Business Loans
Navigate to **Business → Loans** (`/business-loans`) — requires `business_loans:read`.

Track business loans:
- Loan amount, interest rate, term
- Repayment schedule
- Outstanding balance
- Integration with bank accounts for repayment recording

---

## 7. Accounting Collections

Navigate to **ovds → Collections** (`/accounting-collections`) — requires `ovds:read`.

Manage overdue AR:
- **Credit Hold** — flag customers with overdue balances
- **Collection Cases** — track collection efforts per customer
- **Payment Batches** — group multiple payments for batch processing
- **Aging Analysis** — 30/60/90/120+ day buckets

---

## 8. Telebirr & Chapa — Digital Payments

Navigate to **Cash & Banking → Telebirr & Chapa** (`/banking/digital-payments`) — requires `banking:read`.

OVDS integrates with Ethiopia's two primary digital payment channels for daily deposit logging and automatic transaction matching.

### Telebirr (Ethio Telecom)
| Feature | Detail |
|---------|--------|
| Provider | Ethio Telecom |
| Use case | Customer payments, vendor disbursements, tax remittances |
| Integration | API-based; transactions sync automatically |
| Setup | **Settings → Digital Wallets** → enter Telebirr Business ID and API key |

**Daily workflow:**
1. Customer pays via Telebirr — transaction appears in the digital payments feed
2. OVDS matches the Telebirr reference to the open invoice automatically
3. Unmatched deposits are flagged for manual review
4. Reconcile the Telebirr wallet balance against the OVDS ledger monthly

### Chapa Payment Gateway
| Feature | Detail |
|---------|--------|
| Provider | Chapa Financial Technologies |
| Use case | Online invoice payments, e-commerce, client portal payments |
| Integration | REST API + webhooks |
| Setup | **Settings → Payment Gateways → Chapa** (`/settings/payment-gateways/chapa`) → enter public key, secret key |

**Daily workflow:**
1. Customer clicks **Pay Now** on a client-portal invoice
2. Chapa processes the payment and sends a webhook to OVDS
3. OVDS automatically marks the invoice as paid and posts the receipt
4. Settlement appears in the Chapa settlement report (T+1 or T+2 per agreement)

### Transaction Matching
Both channels feed into the unified matching queue:
- **Auto-matched** — Telebirr or Chapa reference matches an open invoice exactly
- **Partially matched** — amount matches but reference differs — flagged for review
- **Unmatched** — no matching invoice found — create a manual receipt or flag as advance payment

### Setting Up Digital Wallets (Setup Phase)
1. Go to **Settings → Currencies & Banking → Digital Wallets** (`/settings/digital-wallets`)
2. Add Telebirr Business credentials
3. Go to **Settings → Currencies & Banking → Chapa Payment Gateway** (`/settings/payment-gateways/chapa`)
4. Enter Chapa API keys and configure webhook URL: `https://your-domain.com/api/webhooks/chapa`
5. Test with a sandbox transaction before going live

### Using Digital Payments for Tax Remittances
Both Telebirr and bank transfers are accepted for MoR tax payments:
- After filing on the eTax portal, select **Pay via Telebirr** or bank transfer
- Record the payment reference in OVDS under **Tax Filing → Record Payment**
- Attach the Telebirr receipt or bank slip to the filing record for audit trail

---

## 9. Petty Cash

Navigate to **Cash & Banking → Petty Cash** (`/petty-cash`) — requires `banking:read`.

### Setting Up a Petty Cash Fund
1. Go to **Accounting → Banks → New Bank Account**
2. Set Account Type to **Petty Cash**
3. Set the opening balance (e.g., ETB 5,000)
4. This creates a dedicated petty cash GL account

### Recording Petty Cash Expenses
1. Go to **Transactions → New Transaction**
2. Select the petty cash account
3. Select type **Expense**, enter amount and description
4. Assign a category (office supplies, transport, etc.)
5. Attach a receipt photo if required

### Petty Cash Replenishment
When the petty cash fund runs low:
1. Record a **Fund Transfer** from the main bank account to petty cash
2. Amount = sum of all expenses since last replenishment
3. The transfer resets the petty cash fund to its original float

### Petty Cash Reconciliation
Reconcile monthly using the same bank reconciliation workflow. The **Petty Cash Audit** view in the Analysis phase (`/petty-cash`) shows all transactions grouped by category for management review.

---

## Navigation Flow

```
Cash & Banking (Daily Operations)
├── Bank Accounts          /banking/accounts         (banking:read)
├── Transactions           /transactions             (ovds:read)
├── Fund Transfers         /fund-transfers           (fund_transfers:read)
├── Bank Reconciliation    /bank-reconciliation      (bank_reconciliation:read)
├── Import Statements      /bank-statement-import    (bank_statement_import:write)
├── Petty Cash             /petty-cash               (banking:read)
├── FX & Currencies        /fx-rates                 (ovds:read)
└── Telebirr & Chapa       /banking/digital-payments (banking:read)

Setup — Currencies & Banking
├── Bank Accounts Setup    /banking/accounts         (banking:read)
├── Digital Wallets        /settings/digital-wallets (banking:read)
└── Chapa Gateway          /settings/payment-gateways/chapa (apps:read)

ovds
├── Treasury Forecast      /treasury-forecast        (ovds:read)
├── Collections            /accounting-collections   (ovds:read)
└── Business Loans         /business-loans           (business_loans:read)
```

---

## How-To: Monthly Bank Reconciliation

1. **Download** your bank statement (CSV or PDF) from your bank's portal
2. **Import** the statement via Banking → Import Statement
3. **Review** imported transactions — fix any OCR errors
4. **Reconcile** — go to the bank account → Reconcile
5. **Match** each OVDS transaction to the bank statement line
6. **Investigate** any differences (bank charges, timing differences)
7. **Finish** when difference = ETB 0.00
8. **Export** the reconciliation report for your records

**Tip:** Reconcile monthly, ideally within the first week of the following month. This ensures your financial statements are accurate for VAT filing (due by the 30th).



