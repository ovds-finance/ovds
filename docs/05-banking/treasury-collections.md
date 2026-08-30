<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Treasury, Cash Forecasting & Collections

> **Part of:** [Banking](./README.md)
>
> **Requires:** Login · `ovds:read` · `banking:read`

This section covers forward-looking cash management — treasury forecasts, business loans, and the collections workflow for overdue receivables.

---

## Treasury & Cash Forecasting

Navigate to **ovds → Treasury Forecast** (`/treasury-forecast`) — requires `ovds:read`.

The Treasury Forecast projects your cash position based on known future inflows and outflows, helping you plan payments, avoid overdrafts, and decide when to draw on credit.

### Cash Flow Forecast

The forecast is built automatically from:
- **Outstanding invoices** — expected inflows from customers (based on due dates)
- **Unpaid bills** — expected outflows to vendors (based on due dates)
- **Scheduled loan repayments** — fixed outflows from loan repayment schedules
- **Tax payment deadlines** — VAT, DRRF, BIT quarterly installments

| Horizon | View |
|---------|------|
| 30 days | Short-term liquidity position |
| 60 days | Medium-term planning |
| 90 days | Working capital visibility |

A visual chart shows the projected daily cash balance. An alert fires automatically when the projected balance is forecast to fall below your configured minimum threshold.

### Setting a Minimum Cash Threshold

1. Go to **ovds → Treasury Forecast → Settings**.
2. Set your **Minimum Cash Balance** — the floor below which you want to be alerted.
3. OVDS will send an in-app notification and email when the forecast drops below this level.

---

## Business Loans

Navigate to **ovds → Business Loans** (`/business-loans`) — requires `business_loans:read`.

Track all business loans in one place — with repayment schedules, outstanding balances, and automatic GL entries on each repayment.

### Adding a Loan

1. Go to **ovds → Business Loans** → click **New Loan**.
2. Enter:

| Field | Required | Notes |
|-------|----------|-------|
| Lender Name | ✅ | Bank or institution name |
| Loan Amount | ✅ | Principal borrowed |
| Interest Rate | ✅ | Annual rate (%) |
| Term | ✅ | Months or years |
| Start Date | ✅ | Date the loan was drawn down |
| Repayment Frequency | ✅ | Monthly, quarterly, annual |
| Bank Account | ✅ | Account the loan was received into |

3. Click **Save** — OVDS generates the full repayment schedule automatically (principal + interest split per period).

### Recording a Repayment

1. Open the loan → click **Record Repayment**.
2. Select the **payment account** and enter the **date** and **reference number**.
3. OVDS automatically:
   - Deducts the payment from the outstanding balance
   - Splits the amount into **principal** (reduces loan liability) and **interest** (posts to Interest Expense)
   - Posts both GL entries

### Outstanding Balance

The loan detail page shows:
- Original principal
- Total repaid to date
- Outstanding balance
- Next repayment date and amount
- Total interest paid and remaining

---

## Collections — Overdue AR

Navigate to **ovds → Collections** (`/accounting-collections`) — requires `ovds:read`.

The Collections module manages the workflow for chasing overdue invoices — from automated reminders through to formal collection cases.

### AR Aging Overview

The collections dashboard groups all outstanding invoices by how long they have been overdue:

| Bucket | Overdue Period |
|--------|---------------|
| Current | Not yet due |
| 1–30 days | Mildly overdue |
| 31–60 days | Moderately overdue |
| 61–90 days | Seriously overdue |
| 90+ days | Critical — potential write-off risk |

### Credit Hold

Flag customers whose overdue balance exceeds your policy threshold:

1. Open the customer record → click **Credit Hold**.
2. OVDS blocks new invoices from being saved for that customer.
3. A credit hold warning appears on the customer's profile and in any new invoice form.
4. Release the hold once payment is received.

### Collection Cases

Track collection efforts per customer:

1. Go to **Collections → New Case**.
2. Select the customer and the overdue invoices in scope.
3. Log actions as they happen:
   - Phone call (log date, contact, and outcome)
   - Email sent (attach copy)
   - Payment promise (log promised date and amount)
   - Escalation to legal
4. Status options: Open, Promised, Escalated, Settled, Written Off.

### Payment Batches

Group multiple customer payments for batch processing — useful for high-volume collection runs:

1. Go to **Collections → Payment Batches → New Batch**.
2. Add multiple invoice payments to the batch.
3. Click **Post Batch** — all payments are recorded simultaneously and the invoices are updated.

### Writing Off Bad Debt

If a debt is deemed unrecoverable:

1. Open the invoice → click **More Actions → Write Off**.
2. Select the **Bad Debt Expense** GL account.
3. Enter the reason.
4. Click **Confirm** — the invoice balance is cleared and the expense is posted to the GL.

> Bad debt write-offs require `ovds:write` + `ovds:approve` permissions.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Record and pay vendor bills | [Financial Ops → Creating a Bill](../04-financial-ops/creating-a-bill.md) |
| Reconcile bank account | [Bank Reconciliation](./bank-reconciliation.md) |
| AR Aging report | [Reports → Financial Reports](../07-reports/financial-reports.md#ar--ap-aging-reports) |
| Set up automated invoice reminders | [Financial Ops → Managing Invoices](../04-financial-ops/managing-invoices.md#automated-payment-reminders) |
| Fund transfers between accounts | [Bank Accounts → Fund Transfers](./bank-accounts.md#fund-transfers-between-accounts) |




