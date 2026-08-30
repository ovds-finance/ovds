<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Banking, Currencies & Payment Gateway Setup

> **Part of:** [Settings](./README.md)
>
> **Requires:** Login · `banking:read` · `settings:write` · `apps:read`
>
> **Navigate to:** **Setup → Currencies & Banking**

Configure bank accounts, foreign exchange rates, and digital payment gateways before recording any transactions. These settings affect every invoice, bill, payment, and reconciliation in the system.

---

## Currencies & FX Rates

Navigate to **Setup → Currencies & Banking → Currencies & FX Rates** (`/fx-rates`) — requires `ovds:read`.

### Default Currency

Set your **Default Currency** to ETB (Ethiopian Birr). All financial statements, VAT returns, and payroll are denominated in ETB unless a transaction is explicitly in a foreign currency.

### Adding Foreign Currencies

For import/export businesses or international client billing:

1. Go to **Settings → Currencies** → click **Add Currency**.
2. Select the currency (USD, EUR, GBP, etc.).
3. Enter the current exchange rate against ETB.
4. Optionally enable **Live Rate Feed** — requires a currency API key in your environment.
5. Click **Save**.

Foreign-currency invoices and bills automatically convert to ETB for reporting. Exchange gains and losses are calculated per **IAS 21** and posted to the GL automatically.

### Ethiopian Banks SWIFT Reference

| Bank | SWIFT Code |
|------|-----------|
| Commercial Bank of Ethiopia (CBE) | CBETETAA |
| Awash Bank | AWAIETAA |
| Dashen Bank | DASHETAA |
| Bank of Abyssinia | ABYSETAA |
| Wegagen Bank | WEGAETAA |
| Cooperative Bank of Oromia | CBORETAA |
| Lion International Bank | LIBNETAA |
| Zemen Bank | ZEMEETAA |

---

## Bank Accounts Setup

Navigate to **Setup → Currencies & Banking → Bank Accounts Setup** (`/banking/accounts`) — requires `banking:read`.

### Adding a Bank Account

1. Go to **Accounting → Banks** → click **New Bank Account**.
2. Fill in:

| Field | Required | Notes |
|-------|----------|-------|
| Bank Name | ✅ | Choose from list or enter manually |
| Account Number | ✅ | Full account number as on statements |
| Account Name | ✅ | Name exactly as it appears on bank statements |
| Account Type | ✅ | Checking / Savings / Petty Cash / Foreign Currency / Credit Card |
| Currency | ✅ | ETB for domestic; USD/EUR for forex accounts |
| Opening Balance | ✅ | Balance on the date you start using OVDS |
| Opening Date | ✅ | The date of the opening balance |

3. Toggle **Set as Default** if this is your primary operating account.
4. Click **Save**.

### Account Types

| Type | Use Case |
|------|---------|
| Checking | Day-to-day operating account |
| Savings | Interest-bearing or reserve account |
| Petty Cash | Small cash float for minor expenses |
| Foreign Currency | USD/EUR/GBP — FX gains/losses auto-calculated |
| Credit Card | Corporate card — tracked as a current liability |

---

## Telebirr Digital Wallet

Navigate to **Settings → Digital Wallets** (`/settings/digital-wallets`) — requires `banking:read`.

Telebirr is Ethiopia's primary mobile money platform operated by Ethio Telecom. Once configured, incoming Telebirr payments auto-match to open invoices.

### Required Credentials

| Field | Description | Where to Get It |
|-------|-------------|----------------|
| Telebirr Business ID | Your Ethio Telecom merchant identifier | [Telebirr Business Portal](https://business.telebirr.com) |
| API Key | Secret key for API authentication | Telebirr Business Portal |
| Webhook URL | OVDS endpoint for payment notifications | Set to `https://your-domain.com/api/webhooks/telebirr` |
| Auto-match invoices | Enable to auto-reconcile incoming payments | Toggle in settings |

### Setup Steps

1. Register your business at the [Telebirr Business Portal](https://business.telebirr.com).
2. Obtain your **Business ID** and **API Key**.
3. Go to **Settings → Digital Wallets** in OVDS.
4. Enter the credentials and set the webhook URL.
5. Copy the webhook URL back into the Telebirr Business Portal → Webhook Settings.
6. Run a **sandbox test transaction** to verify the connection before going live.

### Daily Workflow

Once live, Telebirr payments flow automatically:
1. Customer pays via Telebirr → transaction appears in the **Banking → Digital Payments** feed.
2. OVDS matches the reference to the open invoice and marks it Paid.
3. Unmatched deposits are flagged in **Banking → Unmatched Transactions**.
4. Reconcile the Telebirr wallet balance monthly using the standard reconciliation workflow.

> See [Banking → Digital Payments](../05-banking/digital-payments.md) for the full daily workflow.

---

## Chapa Payment Gateway

Navigate to **Settings → Payment Gateways → Chapa** (`/settings/payment-gateways/chapa`) — requires `apps:read`.

Chapa enables online invoice payments via the Client Portal — customers pay with a single click from the invoice email.

### Required Credentials

| Field | Description | Where to Get It |
|-------|-------------|----------------|
| Public Key | Client-side key for checkout | [Chapa Dashboard](https://dashboard.chapa.co) → API Keys |
| Secret Key | Server-side key (stored encrypted) | Chapa Dashboard → API Keys |
| Webhook URL | OVDS endpoint for payment events | Set to `https://your-domain.com/api/webhooks/chapa` |
| Currency | ETB (default) | — |
| Auto-post receipts | Mark invoices Paid automatically on success | Toggle in settings |

### Setup Steps

1. Create an account at [chapa.co](https://chapa.co).
2. Go to **Dashboard → API Keys** → copy the public and secret keys.
3. Enter both in **Settings → Payment Gateways → Chapa**.
4. Set the webhook URL in both OVDS and your Chapa dashboard.
5. Enable **Auto-post receipts**.
6. Run a **test charge** using Chapa's sandbox environment before going live.

### Settlement

Chapa settlements arrive in your bank account on T+1 or T+2 per your Chapa agreement. Each settlement appears as a bank deposit — reconcile against the Chapa settlement report monthly.

---

## CBE Pay

Navigate to **App Store** → install **CBE Pay** → **Settings → Payment Gateways → CBE Pay**.

| Field | Where to Get It |
|-------|----------------|
| Business Account Number | Commercial Bank of Ethiopia Business Banking |
| API Key | CBE Business Banking portal |
| Webhook URL | `https://your-domain.com/api/webhooks/cbepay` |

> Test with a small sandbox transaction before enabling for live payments.

---

## Stripe (International Payments)

Navigate to **App Store** → install **Stripe** → **Settings → Payment Gateways → Stripe**.

Stripe is suited for invoices in USD/EUR sent to international clients. For domestic ETB payments, Telebirr and Chapa are recommended.

| Field | Where to Get It |
|-------|----------------|
| Publishable Key | [Stripe Dashboard](https://dashboard.stripe.com) → API Keys |
| Secret Key | Stripe Dashboard → API Keys |
| Webhook Signing Secret | Stripe Dashboard → Webhooks → your endpoint |
| Webhook URL | `https://your-domain.com/api/webhooks/stripe` |

**Important:** Add the webhook signing secret to OVDS — this prevents spoofed payment events from being processed.

---

## Payment Terms

Navigate to **Settings → Payment Terms**.

Default terms applied to all new invoices and bills. The due date is calculated from the invoice date automatically.

| Term | Net Days |
|------|:--------:|
| Due on Receipt | 0 |
| Net 15 | 15 |
| Net 30 | 30 |
| Net 60 | 60 |
| Net 90 | 90 |

Custom terms can be created and named. Set a company-wide default in Settings — it applies to all new invoices unless overridden per customer.

---

## App Store — Payment Extensions

Navigate to **Administration → App Store** (`/app-store`).

| Extension | Description |
|-----------|-------------|
| Telebirr Gateway | Ethio Telecom mobile money — domestic payments |
| Chapa Gateway | Online card and mobile payments — Client Portal |
| CBE Pay | Commercial Bank of Ethiopia direct API |
| Stripe | International card payments (USD/EUR) |
| Live Currency | Real-time ETB exchange rate feed |

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Company profile and TIN setup | [Company & Tax Settings](./company-and-tax.md) |
| Telebirr and Chapa daily matching | [Banking → Digital Payments](../05-banking/digital-payments.md) |
| Bank reconciliation | [Banking → Reconciliation](../05-banking/bank-reconciliation.md) |
| Invoice payment flow end-to-end | [Financial Ops → Payments & Gateways](../04-financial-ops/payments-and-gateways.md) |
| Multi-currency invoice | [Financial Ops → Multi-Currency & FX](../04-financial-ops/multi-currency.md) |




