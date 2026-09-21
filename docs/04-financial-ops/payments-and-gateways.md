<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Payments & Payment Gateways

> **Part of:** [Financial Operations](./README.md) › Unified Payments
>
> **Requires:** Login · `invoices:read` · `invoices:write`
>
> **Related:** [Banking → Digital Payments](../05-banking/digital-payments.md) · [Settings → Banking & Payments](../03-settings/banking-and-payments.md)

OVDS supports a full range of payment methods — from cash and cheque to Telebirr, Chapa, CBE Pay, and Stripe for international billing. Once a gateway is configured, incoming payments auto-match to open invoices and post to the General Ledger without manual intervention.

## Supported Payment Methods

| Method | Domestic / International | Auto-match | Setup Required |
|--------|------------------------|-----------|----------------|
| Cash | Domestic | Manual | None |
| Bank Transfer | Domestic | Manual (via reconciliation) | None |
| Cheque | Domestic | Manual | None |
| Telebirr | Domestic | ✅ Auto | App Store install + API key |
| Chapa | Domestic | ✅ Auto | App Store install + API key |
| CBE Pay | Domestic | ✅ Auto | App Store install + credentials |
| Stripe | International | ✅ Auto | App Store install + API key |
| Mobile Banking | Domestic | Manual | None |

---

## Setting Up Payment Gateways

### Telebirr

1. Go to **App Store** (`/app-store`) → search for and install **Telebirr Gateway**.
2. Navigate to **Settings → Digital Wallets** (`/settings/digital-wallets`).
3. Enter your **Telebirr Business ID** and **API Key** from the Telebirr Business Portal.
4. Set the webhook URL to:
   ```
   https://your-domain.com/api/webhooks/telebirr
   ```
5. Run a sandbox test transaction before going live.

Once live, incoming Telebirr payments are auto-matched to open invoices by amount and reference. Unmatched deposits are flagged in **Banking → Unmatched Transactions** for manual review.

---

### Chapa

1. Go to **App Store** → install **Chapa Gateway**.
2. Navigate to **Settings → Payment Gateways → Chapa** (`/settings/payment-gateways/chapa`).
3. Enter your **Public Key** and **Secret Key** from the [Chapa Dashboard](https://dashboard.chapa.co).
4. Set the webhook URL to:
   ```
   https://your-domain.com/api/webhooks/chapa
   ```
5. Enable **Auto-post receipts** — Ovds will automatically mark invoices as Paid on a successful Chapa charge.

---

### CBE Pay

1. Go to **App Store** → install **CBE Pay**.
2. Navigate to **Settings → Payment Gateways → CBE Pay**.
3. Enter your CBE merchant credentials — Business Account Number and API Key from CBE Business Banking.
4. Set the webhook URL to:
   ```
   https://your-domain.com/api/webhooks/cbepay
   ```
5. Test with a small transaction in the sandbox before going live.

---

### Stripe (International Payments)

Stripe is suited for USD/EUR invoices sent to international clients. For domestic ETB payments, Telebirr and Chapa are recommended.

1. Go to **App Store** → install **Stripe**.
2. Navigate to **Settings → Payment Gateways → Stripe**.
3. Enter your **Publishable Key** and **Secret Key** from the [Stripe Dashboard](https://dashboard.stripe.com).
4. In Stripe, configure the webhook endpoint:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
5. Copy the **Webhook Signing Secret** from Stripe and paste it into Ovds Settings — this secures the webhook and prevents spoofed payment events.

---

## End-to-End Customer Payment Flow

Once a gateway is active, customers see a **Pay Now** button on every invoice email:

1. Customer receives the invoice email with a **Pay Now** link.
2. Customer clicks → opens the Client Portal or a hosted payment page.
3. Customer selects their payment method (Telebirr, Chapa, CBE Pay, Card).
4. Payment is processed by the gateway.
5. Gateway sends a webhook to Ovds confirming the payment.
6. Ovds automatically:
   - Records the payment against the matching invoice
   - Updates the invoice status to **Paid** (or **Partial**)
   - Sends a payment confirmation email to the customer
   - Posts the receipt to the GL

> If the webhook fails or the payment cannot be auto-matched, record it manually via **Invoice → Add Payment** using the gateway's transaction reference number.

---

## Recording Payments Manually

For cash, bank transfer, or cheque — or when auto-matching isn't possible:

1. Open the invoice → click **Add Payment**.
2. Select:
   - **Date** — date payment was received
   - **Account** — the bank account or cash account it was received into
   - **Payment Method** — choose from the list
3. Enter the **Amount**.
4. Add a **Reference Number** (bank ref, cheque number, Telebirr transaction ID, etc.).
5. Click **Save**.

For partial payments, repeat this process — each payment is recorded separately and the running balance is tracked on the invoice.

---

## Refunds & Credit Notes

Navigate to **Sales → Refunds** (`/refunds`) — requires `invoices:write`.

### Full Refund
1. Open the paid invoice and click **More Actions → Issue Refund**.
2. Select the refund method — can differ from the original payment method.
3. Click **Confirm**:
   - A Credit Note is created and linked to the original invoice
   - GL entries are reversed automatically
   - Invoice status reflects the refund

### Partial Refund
1. Open the paid invoice and click **More Actions → Issue Refund**.
2. Enter the partial amount.
3. A Credit Note is created for that amount; the original invoice retains the remaining paid balance.

### Applying a Credit Note to a Future Invoice
1. Open a future invoice for the same customer.
2. In the payment section, select **Apply Credit Note**.
3. Select the credit note — the invoice balance is reduced accordingly.

---

## Partial Payments Workflow

When a customer pays in installments:

1. Each partial payment is recorded separately via **Add Payment**.
2. The invoice shows the **Balance Due** after each payment.
3. The **Payment History** tab on the invoice lists all payments with dates, methods, and amounts.
4. Automated reminders are sent when the balance is overdue (configure in **Settings → invoice → Payment Reminders**).
5. The **AR Aging** report tracks all outstanding balances grouped by days overdue.

---

## Payment Tracker

Navigate to **ovds → Payment Tracker** (`/payment-tracker`) — requires `invoices:read`.

The Payment Tracker gives a consolidated real-time view of all money in and out:

| Section | What It Shows |
|---------|--------------|
| Outstanding AR | All unpaid or partially paid invoices |
| Overdue AR | Invoices past their due date, with days overdue |
| Outstanding AP | All unpaid vendor bills |
| Expected Inflows | Upcoming payments due from customers |
| Expected Outflows | Upcoming bill payments due to vendors |
| Collections Workflow | Tools to follow up on overdue AR — send reminder, log call, escalate |

Use the Payment Tracker as your daily cash position dashboard before making payment decisions.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Recording a payment on an invoice | [Managing Invoices → Recording a Payment](./managing-invoices.md#recording-a-payment) |
| Recording a payment on a bill | [Creating a Bill → Recording Bill Payment](./creating-a-bill.md#recording-bill-payment) |
| Reconciling bank payments | [Banking → Bank Reconciliation](../05-banking/bank-reconciliation.md) |
| Multi-currency invoice and FX | [Multi-Currency & FX](./multi-currency.md) |
| AR Aging report | [Reports → Financial Reports](../07-reports/financial-reports.md#ar--ap-aging-reports) |
| AP Aging report | [Reports → Financial Reports](../07-reports/financial-reports.md#ar--ap-aging-reports) |



