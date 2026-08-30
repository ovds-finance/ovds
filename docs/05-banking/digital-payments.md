<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Digital Payments — Telebirr & Chapa

> **Part of:** [Banking](./README.md)
>
> **Requires:** Login · `banking:read`
>
> **Navigate to:** **Cash & Banking → Telebirr & Chapa** (`/banking/digital-payments`)

OVDS integrates with Ethiopia's two primary digital payment platforms for automatic transaction matching, daily deposit logging, and tax remittance. Both channels feed into the same unified matching queue.

---

## Telebirr (Ethio Telecom)

| Feature | Detail |
|---------|--------|
| Provider | Ethio Telecom |
| Primary use | Customer payments, vendor disbursements, ERCA tax remittances |
| Integration | API-based — transactions sync automatically |
| Auto-match | ✅ Yes — matched by amount and reference to open invoices |

### Setup

1. Go to **App Store** (`/app-store`) → install **Telebirr Gateway**.
2. Navigate to **Settings → Digital Wallets** (`/settings/digital-wallets`).
3. Enter your **Telebirr Business ID** and **API Key** from the Telebirr Business Portal.
4. Set the webhook URL:
   ```
   https://your-domain.com/api/webhooks/telebirr
   ```
5. Run a sandbox test transaction before going live.

### Daily Workflow

1. A customer pays via Telebirr — the transaction appears in the **Digital Payments** feed automatically.
2. OVDS matches the Telebirr reference to the open invoice.
3. The invoice is marked **Paid** and the receipt is posted to the GL.
4. Unmatched deposits are flagged in **Banking → Unmatched Transactions** for manual review.
5. Reconcile the Telebirr wallet balance against the OVDS ledger monthly.

### Using Telebirr for Tax Remittances

After filing on the eTax portal:
1. Select **Pay via Telebirr** on the payment slip.
2. Complete the payment on your Telebirr Business account.
3. Return to OVDS → **Tax Filing → Record Payment**.
4. Enter the Telebirr transaction reference.
5. Attach the Telebirr receipt to the filing record for audit.

---

## Chapa Payment Gateway

| Feature | Detail |
|---------|--------|
| Provider | Chapa Financial Technologies |
| Primary use | Online invoice payments, Client Portal payments, e-commerce |
| Integration | REST API + webhooks |
| Auto-match | ✅ Yes — webhook auto-marks invoices as paid |

### Setup

1. Go to **App Store** → install **Chapa Gateway**.
2. Navigate to **Settings → Payment Gateways → Chapa** (`/settings/payment-gateways/chapa`).
3. Enter your **Public Key** and **Secret Key** from the [Chapa Dashboard](https://dashboard.chapa.co).
4. Set the webhook URL:
   ```
   https://your-domain.com/api/webhooks/chapa
   ```
5. Enable **Auto-post receipts** — OVDS marks invoices as Paid automatically on a successful Chapa charge.

### Daily Workflow

1. Customer clicks **Pay Now** on a client-portal invoice.
2. Chapa processes the payment and sends a webhook to OVDS.
3. OVDS automatically marks the invoice as Paid and posts the receipt to the GL.
4. Settlement appears in the Chapa settlement report (T+1 or T+2 per your Chapa agreement).

---

## Transaction Matching

Both Telebirr and Chapa feed into the unified matching queue in **Banking → Digital Payments**:

| Status | Meaning | Action |
|--------|---------|--------|
| **Auto-matched** | Reference and amount match an open invoice exactly | None — invoice is closed automatically |
| **Partially matched** | Amount matches but the reference differs | Review and confirm the match manually |
| **Unmatched** | No matching invoice found | Create a manual receipt, or flag as advance payment |

### Handling Unmatched Payments

1. Go to **Banking → Unmatched Transactions**.
2. Click the unmatched payment.
3. Options:
   - **Match to Invoice** — search and link to an existing invoice
   - **Create Receipt** — record as a point-of-sale receipt if no invoice exists
   - **Mark as Advance** — record as a customer advance payment to be applied later
   - **Return to Customer** — flag for refund if paid in error

---

## CBE Pay

| Feature | Detail |
|---------|--------|
| Provider | Commercial Bank of Ethiopia |
| Primary use | Large domestic payments, government disbursements |
| Integration | Direct API |

### Setup

1. Go to **App Store** → install **CBE Pay**.
2. Navigate to **Settings → Payment Gateways → CBE Pay**.
3. Enter your CBE merchant credentials — Business Account Number and API Key from CBE Business Banking.
4. Set the webhook URL:
   ```
   https://your-domain.com/api/webhooks/cbepay
   ```
5. Test with a small sandbox transaction before going live.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Full payment gateway setup (including Stripe) | [Financial Ops → Payments & Gateways](../04-financial-ops/payments-and-gateways.md) |
| Reconcile digital payment transactions | [Bank Reconciliation](./bank-reconciliation.md) |
| Record tax payments | [Tax & Compliance → VAT & TOT → Filing Workflow](../06-tax-compliance/vat-and-tot.md#step-4--submit-to-etax-portal) |
| Customer payment flow end-to-end | [Financial Ops → Payments & Gateways](../04-financial-ops/payments-and-gateways.md#end-to-end-customer-payment-flow) |




