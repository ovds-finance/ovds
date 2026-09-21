<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Creating an Invoice

> **Part of:** [Financial Operations](./README.md) › Invoices & Estimates
>
> **Requires:** Login · `invoices:read` · `invoices:write` permissions
>
> **Lifecycle phase:** [Phase 1 — Data Capture](./../FILING-LIFECYCLE.md#2-phase-1--data-capture) &middot; [Phase 2 — Tax Calculation](./../FILING-LIFECYCLE.md#3-phase-2--tax-calculation--accrual) | Rates: [`CORE-CONFIG.md`](./../CORE-CONFIG.md#7-tax-rate--deadline-summary)

It is easy to start creating an invoice on Ovds. You can add recipients, global/line discounts, and taxes.

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

Once you log in to your dashboard, go to **Sales** on the navigation menu bar.

1. Click **Sales** to reveal a drop-down menu.
2. Select **Invoices**.
3. From the Invoices dashboard, click **New Invoice**.
4. Enter the required details on the Invoice creation page.

Invoice creation details include but are not limited to **Customer**, **Title**, **Logo**, **Billing information**, **Date**, **Order number**, and more.

![New Invoice page showing Company, Billing, and Items sections](../../docs/images/new-invoice.png)

---

### Add a Customer

1. Add a recipient to the invoice by selecting **Add a Customer**.
2. Click **New Customer** and enter the customer details.
   - **Customer Name** and **Payment Currency** are required fields.
3. Click **Save**.

---

### Add Items or Services

1. Click **Add an Item** to add services or products.
2. Enter the **item name**, **description**, **quantity**, and **price**.
3. The invoice total price is automatically calculated.
4. After entering the necessary details, click **Save**.

---

### Notes and Advanced Options

You can add **Notes** to invoices for instructions to the recipient.

The **Advanced** option lets you define a **Footer**, **Category**, and upload **Attachments** where necessary.

![Invoice bottom section showing Notes and Advanced fields](../../docs/images/invoice-advanced.png)

---

### Save or Send

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

When creating an invoice, you can apply a **global discount** to the entire invoice total, or limit the discount to specific invoice items. Discounts applied to specific invoice items are called **line discounts**.

### Enable Line Discounts First

Line discounts are disabled by default. To turn them on:

1. Go to **Settings** on the sidebar and select **Localization**.
2. On the Localization page, scroll down to **Other → Discount Location**.
3. Select **Both Line and Total** to enable both line and global discounts.
4. Click **Save**.

### Add a Line Discount to an Invoice Item

Once line discounts are enabled:

1. While creating an invoice, click **New Item**. Enter the item details — name, description, quantity, and amount.
2. Below the **Quantity** input box, click **Add Discount**.
3. Enter the discount as a **percentage** or a **fixed currency amount**.
4. The total discount is automatically calculated on the invoice.

![Invoice item row with Add Discount highlighted below the Quantity field](../../docs/images/invoice-line-discount.png)

> Global discounts (applied to the whole invoice total) are available without any settings change and can be entered in the discount field at the bottom of the line items section.

---

## Adding Taxes to Invoices

1. While creating an invoice, click **New Item**. Enter the item details — name, description, quantity, and amount.
2. Below the **Price** input box, click **Add Tax**.
3. Click **New Tax** from the dropdown option and enter the required details:
   - **Name** — e.g. *VAT 20%*
   - **Rate** — entered as a percentage (e.g. `20`)
4. Click **Save**.
5. The added tax is automatically applied to the total invoice amount.

![Invoice item row with Add Tax button highlighted below the Price field](../../docs/images/invoice-add-tax.png)

> You can assign multiple tax rates to a single line item (e.g., VAT + TOT). Each tax is calculated independently and shown in the invoice PDF breakdown.

---

## Changing the Color of an Invoice

While creating an invoice, you can customize the color to match your customer's brand colors.

1. On the **New Invoice** page, scroll down to **Advanced**.
2. Click **Advanced** to expand the section.
3. Click the **Color** icon to see an extended color palette, or enter the color code manually.
4. Click **Save**.

> Note: This color change applies to the **invoice PDF and print layout** only — it does not change the appearance of the invoice record in your dashboard list.

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



