<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Creating an Invoice

> **Part of:** [Financial Operations](./README.md) › Invoices & Estimates
>
> **Requires:** Login · `invoices:read` · `invoices:write` permissions
>
> **Lifecycle phase:** [Phase 1 — Data Capture](./../FILING-LIFECYCLE.md#2-phase-1--data-capture) &middot; [Phase 2 — Tax Calculation](./../FILING-LIFECYCLE.md#3-phase-2--tax-calculation--accrual) | Rates: [`CORE-CONFIG.md`](./../CORE-CONFIG.md#7-tax-rate--deadline-summary)

It is easy to start creating an invoice on OVDS using the OVDS-style UI. You can add recipients, apply global or line discounts, and assign taxes — all from a single invoice creation page.

---

## Before You Start

Before creating your first invoice, confirm the following are already configured:

- **Company logo and TIN** — set in **Settings → Company**
- **Invoice template and payment terms** — set in **Settings → invoice**
- **Tax rates** — pre-configured in **Settings → Taxes** (required before you can assign taxes to line items)
- **Payment gateways** (Telebirr, Chapa, Stripe, etc.) — enabled in **Settings → Payment Gateways** so the **Pay Now** button appears on client emails

> These are one-time setup steps. Once done, they apply automatically to every invoice you create.

---

## Creating an Invoice

### Step 1 — Navigate to Invoices

1. Log in to your OVDS Dashboard.
2. On the main navigation menu bar, click **Sales**.
3. Click **Sales** to reveal the drop-down menu.
4. Select **Invoices**.
5. From the Invoices dashboard, click **New Invoice** in the top-right corner.

---

### Step 2 — Fill in Invoice Details

On the invoice creation page, enter the following details:

| Field | Required | Notes |
|-------|----------|-------|
| Customer | ✅ | TIN required for B2B VAT invoices |
| Title | Optional | e.g. *Invoice #1024* or a descriptive label |
| Invoice Date | ✅ | Date of issue — defaults to today |
| Due Date | ✅ | Calculated from your default payment terms |
| Invoice Number | Auto | System-generated; you can override it manually |
| Order Number | Optional | Reference number from the customer's purchase order |
| Currency | ✅ | Defaults to ETB; change per customer if needed |
| VAT Rate (per item) | ✅ | 15%, 0%, or Exempt — assigned at the line item level |
| ERCA QR Code | Auto | NBE-IQR format — generated automatically on every invoice PDF |

> **Logo** is set globally in **Settings → Company**, not per invoice. It appears automatically on every invoice PDF once configured.

---

### Step 3 — Add a Customer

1. In the **Billing** section, click **Add a Customer**.
2. Select an existing customer from the dropdown, or click **New Customer** to create one.
3. On the New Customer form, enter the customer's details.
   - **Customer Name** and **Payment Currency** are required fields.
4. Click **Save**.

---

### Step 4 — Add Items or Services

1. Click **Add an Item**.
2. Enter the following for each item:
   - **Item Name**
   - **Description**
   - **Quantity**
   - **Unit Price**
3. The invoice total is automatically calculated as you add items.
4. Repeat for each additional product or service.

> You can apply a **discount** or assign a **tax** directly on each item line. See the sections below for details.

---

### Step 5 — Notes, Footer, and Attachments

1. In the **Notes** field, add any instructions or information for the recipient — for example, payment instructions or late fee policies.
2. Scroll down and click **Advanced** to expand additional options:
   - **Footer** — add text that appears at the bottom of the invoice PDF (e.g., bank details, registration number)
   - **Category** — assign the invoice to an accounting category
   - **Attachments** — upload supporting documents or receipts

---

### Step 6 — Save or Send

- Click **Save** to store the invoice as a **Draft** for review before distributing.
- Click **Send To** to email the invoice directly to the customer as a PDF.
- From a saved draft you can also:
  - **Download PDF** — save a local copy
  - **Print** — generate a hard copy
  - **Share Link** — generate a public URL the customer can open without logging in
  - **QR Code** — customer scans to view and pay online

> Every invoice PDF automatically includes the **NBE-IQR QR code** for ERCA digital verification compliance.

---

## Invoice Status Tracking

Once saved or sent, each invoice carries a colored status badge visible in **Sales → Invoices**:

| Status | Meaning |
|--------|---------|
| **Draft** | Created but not yet shared with the customer |
| **Sent** | Emailed to the customer — awaiting payment |
| **Partial** | A partial payment has been recorded |
| **Paid** | Full payment received and posted to the General Ledger |
| **Overdue** | Due date has passed without full payment |

---

## Adding Discounts to Invoices

You can apply a **global discount** to the entire invoice total, or limit discounts to specific line items. Line-level discounts are called **line discounts**.

### Enable Line Discounts First

Line discounts are disabled by default. To turn them on:

1. Go to **Settings** on the sidebar and select **Localization**.
2. On the Localization page, scroll down to **Other → Discount Location**.
3. Select **Both Line and Total** to enable both line and global discounts.
4. Click **Save**.

### Add a Line Discount to an Invoice Item

Once line discounts are enabled:

1. While creating an invoice, click **Add an Item** (or **New Item**).
2. Enter the item details — name, description, quantity, and price.
3. Below the **Quantity** field on the item row, click **Add Discount**.
4. Enter the discount as a **percentage** or a **fixed currency amount**.
5. The discounted total is automatically recalculated on the invoice.

> Global discounts (applied to the whole invoice total) are available without any settings change and can be entered in the discount field at the bottom of the line items section.

---

## Adding Taxes to Invoices

> **Prerequisite:** Tax rates must be pre-configured in **Settings → Taxes** before they can be assigned to invoice items. If you have not done this yet, go to **Settings → Taxes** and create the applicable rates (e.g., VAT 15%, TOT, Exempt) first.

1. While creating an invoice, click **Add an Item** (or **New Item**).
2. Enter the item details — name, description, quantity, and price.
3. Below the **Price** field on the item row, click **Add Tax**.
4. Click **New Tax** from the dropdown.
5. Enter the required details:
   - **Name** — e.g. *VAT 15%*
   - **Rate** — entered as a percentage (e.g. `15`)
6. Click **Save**.
7. The tax is automatically applied to that item and reflected in the invoice total.

> You can assign multiple tax rates to a single line item (e.g., VAT + TOT). Each tax is calculated independently and shown in the invoice PDF breakdown.

---

## Changing the Color of an Invoice

While creating an invoice, you can customize the accent color of the invoice PDF to match your customer's brand or your own.

> Note: This color change applies to the **invoice PDF and print layout** only — it does not change the appearance of the invoice record in your dashboard list.

1. On the **New Invoice** page, scroll down to **Advanced**.
2. Click **Advanced** to expand the section.
3. Click the **Color** icon to open an extended color palette, or type a hex color code manually (e.g., `#2563EB`).
4. Click **Save**.

---

## What Happens After You Save

- The invoice is stored as a **Draft** and visible in **Sales → Invoices**.
- Once you click **Send To**, the status changes to **Sent** and the customer receives an email with the invoice PDF and a **Pay Now** link (if a payment gateway is configured).
- Payments recorded against the invoice update the status automatically (Partial → Paid).
- All invoice amounts post automatically to the **General Ledger** — no manual journal entry needed.

---

## Related Topics

> **Lifecycle mapping:** Creating an invoice triggers [Phase 1 — Data Capture](./../FILING-LIFECYCLE.md#2-phase-1--data-capture) (journal posting) which feeds [Phase 2 — Tax Calculation](./../FILING-LIFECYCLE.md#3-phase-2--tax-calculation--accrual) (Output VAT accrual). All tax rates, permissions, and terminology are defined in [`CORE-CONFIG.md`](./../CORE-CONFIG.md).

| Topic | Where to go |
|-------|-------------|
| Record a payment against an invoice | [Managing Invoices → Recording a Payment](./managing-invoices.md#recording-a-payment) |
| Set up automated payment reminders | [Managing Invoices → Automated Reminders](./managing-invoices.md#automated-payment-reminders) |
| Customize invoice template and branding | [Settings → Company & Tax → Invoice Customization](../03-settings/company-and-tax.md#invoice-customization) |
| Set up recurring invoices | [Managing Invoices → Recurring Invoices](./managing-invoices.md#recurring-invoices) |
| Issue a refund or credit note | [Credit Notes](./credit-notes.md) |
| Configure tax rates | [Settings → Company & Tax → Tax Engine](../03-settings/company-and-tax.md#ethiopian-tax-engine) |
| Configure discount location | [Settings → Company & Tax → Localization](../03-settings/company-and-tax.md#localization) |
| Enable payment gateways | [Settings → Banking & Payments](../03-settings/banking-and-payments.md) |
| ERCA QR code compliance | [Tax & Compliance](../06-tax-compliance/README.md) |



