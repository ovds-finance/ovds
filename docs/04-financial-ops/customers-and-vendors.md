<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Customers & Vendors

> **Part of:** [Financial Operations](./README.md)
>
> **Requires:** Login · `crm:contacts:read` (customers) · `bills:read` (vendors)
>
> **Navigate to:** **Sales → Customers** (`/crm/contacts`) · **Purchases → Vendors** (`/purchases/vendors`)

Customers and vendors are the two master data registries that power every invoice and bill in OVDS. Keeping them accurate — especially TINs, payment currencies, and bank details — ensures correct VAT treatment, WHT auto-calculation, and smooth payment processing.

---

## Customers

### Adding a Customer

Navigate to **Sales → Customers** → click **New Customer**.

| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | Legal business name or individual name |
| TIN | Recommended | 15-digit Ethiopian TIN — required for B2B VAT invoices |
| Email | Recommended | Used for invoice delivery |
| Phone | Optional | |
| Payment Currency | ✅ | Defaults to ETB — change for international customers |
| Payment Terms | Optional | Default terms applied to all new invoices for this customer |
| Credit Limit | Optional | OVDS warns when a new invoice would exceed this amount |
| Billing Address | Optional | Appears on invoice PDFs |
| Create Portal User | Optional | Sends an invitation to the Customer Portal |

Click **Save**.

### Customer 360° View

Click any customer name to open their full profile:

| Section | What It Shows |
|---------|--------------|
| Summary | Total revenue, total paid, outstanding balance, credit score |
| Invoices | All invoices with status, amount, and payment date |
| Payments | All recorded payments |
| Credit Notes | Any credit notes issued |
| Communications | Internal notes and Customer Portal messages |
| Loyalty Tier | Platinum / Gold / Silver / Bronze (auto-assigned from revenue) |

### Customer Credit Score

OVDS calculates a live credit score (0–100) based on:
- Percentage of invoices paid on time
- Average days to pay
- Outstanding overdue balance

Use this to decide whether to extend credit terms or require advance payment for new orders.

### Customer Statement

Generate a statement of account for any customer:

1. Open the customer → click **Statement**.
2. Select the date range.
3. The statement shows all invoices, payments, and credit notes for the period with an aged balance summary.
4. Click **Download PDF** or **Email** to send directly to the customer.

### Bulk Import

Import a large customer list from CSV via **Import Center → Customers**. Download the template for the correct column format: Name, Email, Phone, TIN, Currency, Payment Terms, Opening Balance.

---

## Vendors

Navigate to **Purchases → Vendors** (`/purchases/vendors`) — requires `bills:read`.

### Adding a Vendor

Navigate to **Purchases → Vendors** → click **New Vendor**, or add a vendor inline when creating a bill.

| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | Legal business name |
| TIN | Recommended | Required for WHT auto-calculation (2% on qualifying bills) |
| Email | Recommended | For PO and bill delivery |
| Phone | Optional | |
| Payment Currency | ✅ | Defaults to ETB |
| Payment Terms | Optional | Default: Net 30 |
| Bank Name | Recommended | For payment batch export |
| Account Number | Recommended | For payment batch export |
| WHT Exempt | Optional | Mark if vendor holds a WHT exemption certificate |
| Business Type | Optional | Domestic / Foreign — determines WHT rate (2% domestic, 15% non-resident) |

Click **Save**.

### WHT Auto-Calculation

WHT is calculated automatically on bills when:
- The vendor has a **TIN** on file, and
- The bill amount meets the threshold:
  - Services: ≥ ETB 10,000
  - Goods: ≥ ETB 20,000

If the vendor is marked **WHT Exempt**, no WHT is applied regardless of amount.

> Foreign vendors (Business Type = Foreign) trigger **15% Non-Resident WHT** automatically. See [Tax & Compliance → WHT & Other Taxes](../06-tax-compliance/wht-and-other-taxes.md#non-resident-wht-foreign-services).

### Vendor Ledger

Click any vendor name to see their full transaction history:

| Section | What It Shows |
|---------|--------------|
| Summary | Total spend, total paid, outstanding balance |
| Bills | All bills with status, amount, and WHT |
| Purchase Orders | All POs linked to this vendor |
| Debit Notes | Any debit notes raised against this vendor |
| WHT Certificates | Monthly certificates generated for this vendor |
| Bank Details | Account info for payment processing |

### Managing Vendors

From the Vendors list, the following bulk and quick actions are available:

**Quick actions (hover over a row):**
- Edit vendor details
- New Bill — create a bill directly for this vendor
- New Purchase Order

**Bulk actions:**
- Export selected vendors as CSV
- Update payment terms in bulk

### Vendor Fields Reference

| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | Legal business name |
| TIN | Recommended | Required for WHT calculation |
| Email | Recommended | PO and bill delivery |
| Bank Name | Recommended | Payment batch export |
| Account Number | Recommended | Payment batch export |
| Payment Terms | Optional | Default: Net 30 |
| WHT Exempt | Optional | Mark with exemption certificate on file |
| Foreign Vendor | Optional | Triggers 15% non-resident WHT |

### Bulk Import

Import vendor lists from CSV via **Import Center → Vendors**. Required columns: Name, TIN, Email, Phone, Payment Currency, Payment Terms, Bank Name, Account Number, WHT Exempt (TRUE/FALSE).

---

## Transaction Categories

Navigate to **Banking → Transaction Categories** (`/transaction-categories`) — requires `ovds:read`.

Transaction categories map bank transactions (imported from statements) to the correct GL accounts. Setting these up accurately ensures that reconciled transactions post to the right place automatically.

### Default Categories

| Category | GL Account | Type |
|----------|-----------|------|
| Sales Revenue | 4000 Revenue | Income |
| Service Revenue | 4100 Service Revenue | Income |
| Rent Expense | 6100 Rent | Expense |
| Utilities | 6200 Utilities | Expense |
| Payroll | 5000 Salaries | Expense |
| Loan Repayment | 2100 Loans Payable | Expense |
| Tax Payment (VAT) | 2150 VAT Payable | Expense |
| Tax Payment (BIT) | 2160 Income Tax Payable | Expense |
| Petty Cash | 1050 Petty Cash | Income / Expense |

### Creating a Custom Category

1. Go to **Banking → Transaction Categories** → click **New Category**.
2. Enter:
   - **Name** — e.g. *Staff Transport Allowance*
   - **Type** — Income or Expense
   - **GL Account** — the account this category maps to
3. Click **Save**.

Once created, the category is available in the **Record Transaction** dialog and in the reconciliation screen. Transactions tagged with this category will automatically post to the mapped GL account.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Create an invoice for a customer | [Creating an Invoice](./creating-an-invoice.md) |
| Create a bill for a vendor | [Creating a Bill](./creating-a-bill.md) |
| WHT calculation on vendor bills | [Tax & Compliance → WHT & Other Taxes](../06-tax-compliance/wht-and-other-taxes.md) |
| Customer portal setup | [Advanced → CRM & Pipeline → Client Portal](../08-advanced/crm-and-pipeline.md#client-portal) |
| AR Aging by customer | [Reports → Financial Reports](../07-reports/financial-reports.md#ar--ap-aging-reports) |
| AP Aging by vendor | [Reports → Financial Reports](../07-reports/financial-reports.md#ar--ap-aging-reports) |
| WHT certificates for vendors | [Creating a Bill → WHT Certificates](./creating-a-bill.md#wht-certificates) |
| Bulk import customers / vendors | [Data Import / Export](./data-import-export.md) |




