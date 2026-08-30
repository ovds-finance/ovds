<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Multi-Currency Billing & FX

> **Part of:** [Financial Operations](./README.md)
>
> **Requires:** Login · `ovds:read` · `ovds:write`
>
> **Navigate to:** **Settings → Currencies** (`/fx-rates`) · **Accounting → FX Rates**

OVDS supports multi-currency invoice, billing, and bank accounts. All foreign-currency transactions are automatically converted to ETB for financial statements, with exchange gains and losses calculated per **IAS 21** and posted to the GL.

---

## Setting Up Foreign Currencies

Navigate to **Settings → Currencies** (`/fx-rates`) — requires `ovds:read`.

1. Click **Add Currency**.
2. Select the currency code (USD, EUR, GBP, AED, CNY, etc.).
3. Enter the current **exchange rate against ETB**.
4. Optionally enable **Live Rate Feed** — requires `NBE_RATES_API_URL` in your environment configuration.
5. Click **Save**.

Once added, the currency is available as a selection on invoices, bills, bank accounts, and customer/vendor profiles.

### Exchange Rate Sources

| Source | Setup | Accuracy |
|--------|-------|---------|
| Manual entry | Enter rate in Settings → Currencies | Updated when you update it |
| NBE live feed | Set `NBE_RATES_API_URL` in `.env` | Updates daily from National Bank of Ethiopia |
| Automatic fallback | If live feed fails, uses last known rate | Rate shown in UI for transparency |

> For BIT and VAT reporting, use the NBE rate on the **transaction date** — OVDS records and uses this rate automatically.

---

## Foreign-Currency Invoices

### Creating an Invoice in a Foreign Currency

1. Open **Sales → Invoices → New Invoice**.
2. In the **Billing** section, select or create the customer — set their **Payment Currency** to USD, EUR, etc.
3. When you return to the invoice, the **Currency** field will show the customer's currency.
4. Enter line item prices in the foreign currency.
5. OVDS automatically shows:
   - The foreign currency amount on the invoice PDF
   - The **ETB equivalent** at today's exchange rate
   - Both amounts are included on the invoice for IAS 21 compliance

> Ethiopian law requires the ETB equivalent to be shown on all commercial invoices issued to foreign customers, even if payment is in USD.

### Recording Payment on a Foreign-Currency Invoice

When the customer pays:

1. Open the invoice → click **Add Payment**.
2. Select the bank account the payment was received into (a foreign-currency account if you hold USD/EUR).
3. Enter the **amount received in the foreign currency**.
4. OVDS converts to ETB using the exchange rate on the payment date.
5. If the rate has changed since the invoice date, an **exchange gain or loss** is calculated automatically:

```
Exchange Difference = (Invoice ETB amount) − (Payment ETB amount at today's rate)

If ETB received > ETB invoiced  →  Exchange Gain  (Cr Other Income)
If ETB received < ETB invoiced  →  Exchange Loss  (Dr ovds Costs)
```

**GL entries posted automatically:**
```
On invoice (USD 1,000 at ETB 120):
  Dr  Accounts Receivable    ETB 120,000
      Cr  Revenue                        ETB 120,000

On payment received (ETB rate now 118):
  Dr  USD Bank Account       ETB 118,000
  Dr  Exchange Loss (7xxx)   ETB   2,000
      Cr  Accounts Receivable            ETB 120,000
```

---

## Foreign-Currency Bills (Vendor Invoices)

When a foreign vendor bills you in USD or EUR:

1. Open **Purchases → Bills → New Bill**.
2. Select the vendor — set their **Payment Currency** in the vendor profile.
3. Enter the bill amount in the foreign currency.
4. OVDS records the ETB equivalent at the rate on the bill date.
5. On payment, if the rate has changed, an exchange difference is posted to **Exchange Gain/Loss**.

---

## Foreign-Currency Bank Accounts

For businesses that hold USD or EUR accounts:

1. Go to **Accounting → Banks → New Bank Account**.
2. Set **Currency** to USD, EUR, etc.
3. Set the **opening balance** in the foreign currency.

All deposits and withdrawals for this account are recorded in the foreign currency. The ETB equivalent is calculated at the transaction date rate and posted to the GL. The balance sheet shows the account at the **closing rate** on the reporting date, with the resulting revaluation difference posted to:

```
Dr / Cr  Foreign Currency Bank Account  (at closing rate)
         Cr / Dr  Exchange Gain/Loss on Monetary Items  (IAS 21.23)
```

---

## IAS 21 Compliance

OVDS follows **IAS 21 — The Effects of Changes in Foreign Exchange Rates** for all foreign currency transactions.

### Key Principles Applied

| Item | Treatment |
|------|-----------|
| Foreign currency invoices | Translated at **transaction date rate** |
| Foreign currency bank accounts | Retranslated at **closing rate** at each reporting date |
| Exchange differences on monetary items | Recognised in **P&L** in the period they arise |
| Non-monetary items (prepayments) | Remain at **historical rate** — no retranslation |
| Functional currency | ETB for all Ethiopian entities |
| Presentation currency | ETB (can be changed in Settings → IFRS for consolidated reporting) |

### Year-End Revaluation

At year-end, OVDS automatically revalues all foreign currency monetary items (receivables, payables, bank balances) to the closing rate:

1. Go to **Accounting → FX Revaluation** at period end.
2. Confirm the **closing rates** for each foreign currency.
3. Click **Run Revaluation** — OVDS posts the revaluation entries.
4. The exchange differences appear in the P&L under **ovds Costs** or **Other Income**.

---

## Exchange Rate Report

Navigate to **Reports → Financial → General Ledger** and filter by account `7xxx Exchange Gain/Loss` to see all exchange differences for the period.

The **Notes to Financial Statements** (`/reports?type=notes`) includes a required IAS 21 disclosure showing:
- Exchange gains and losses recognised in P&L
- Net position in each foreign currency
- Sensitivity analysis (if material)

---

## Common Scenarios

### Customer Pays in USD but You Want ETB

1. Create the invoice in USD (customer's preferred currency).
2. When payment arrives in your USD bank account, record it there.
3. Transfer the USD to ETB using **Banking → Fund Transfers** — select **Forex Conversion** as the transfer type.
4. OVDS posts the conversion at the rate you specify and records any gain/loss.

### Vendor Pays You in ETB for a USD-Denominated Contract

Record the bill in USD (the contract currency). When paying in ETB, enter the ETB amount paid — OVDS calculates the effective exchange rate and posts the difference.

### Tracking Multiple Currencies on the Dashboard

Go to **Accounting → Dashboard** — the bank balances section shows each account in its native currency with the ETB equivalent at the current rate in parentheses.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Add a foreign currency bank account | [Banking → Bank Accounts](../05-banking/bank-accounts.md) |
| Set up exchange rates | [Settings → Banking & Payments](../03-settings/banking-and-payments.md#currencies--fx-rates) |
| IAS 21 disclosures in financial statements | [Reports → Financial Reports](../07-reports/financial-reports.md) |
| Fund transfer for FX conversion | [Banking → Bank Accounts → Fund Transfers](../05-banking/bank-accounts.md#fund-transfers-between-accounts) |
| IFRS configuration | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md) |




