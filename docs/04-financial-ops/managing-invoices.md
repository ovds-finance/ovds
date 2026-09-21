<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Managing Invoices

> **Part of:** [Financial Operations](./README.md) › Invoices & Estimates
>
> **Requires:** Login · `invoices:read` · `invoices:write` permissions

Once an invoice is created, Ovds gives you full control over its lifecycle — sending it to customers, recording payments, issuing refunds, setting up recurring billing, and archiving completed records.

---

## Sending an Invoice

After saving a draft invoice, you can deliver it to your customer in several ways.

### Email (Recommended)
1. Open the invoice from **Sales → Invoices**.
2. Click **Send To**.
3. Confirm or update the customer's email address.
4. Click **Send** — the customer receives an email with the invoice PDF attached and a **Pay Now** button (if a payment gateway is configured).

> Sending requires SMTP to be configured in **Settings → Email / SMTP**.

### Share Link (No Login Required)
1. Open the invoice and click **Share**.
2. Copy the generated public URL.
3. Send it via SMS, WhatsApp, or any channel — the customer can view, download, and pay without creating an account.

### QR Code
1. Open the invoice and click **Share → QR Code**.
2. The customer scans the QR code with their phone to open the invoice and pay online.

### Download PDF / Print
1. Open the invoice and click **More Actions**.
2. Select **Download PDF** to save a local copy, or **Print** for a physical copy.

> Every invoice PDF automatically includes the **NBE-IQR QR code** for ERCA digital verification.

---

## Invoice Status Tracking

Every invoice carries a colored status badge visible in **Sales → Invoices**:

| Status | Meaning |
|--------|---------|
| **Draft** | Created but not yet sent to the customer |
| **Sent** | Emailed — awaiting payment |
| **Partial** | At least one payment recorded; balance still outstanding |
| **Paid** | Full payment received and posted to the GL |
| **Overdue** | Due date has passed with no full payment |

Status updates automatically as payments are recorded. You do not need to change it manually.

---

## Recording a Payment

### Full Payment
1. Open the invoice and click **Add Payment**.
2. Select:
   - **Date** — date the payment was received
   - **Account** — e.g. Business Bank Account, Cash
   - **Payment Method** — Bank Transfer, Cash, Telebirr, Chapa, Cheque, etc.
3. Enter the full amount.
4. Click **Save** — invoice status changes to **Paid** and the receipt is posted to the GL.

### Partial Payment
1. Open the invoice and click **Add Payment**.
2. Enter an amount less than the balance due.
3. Click **Save** — status changes to **Partial** and the remaining balance is tracked.
4. Repeat until the full amount is paid.

### Split Payment (Multiple Methods)
A single invoice can be settled across multiple payment methods — for example, 50% Telebirr and 50% Bank Transfer:
1. Record the first payment with its method and amount.
2. Record a second payment with a different method and the remaining amount.
3. Both payments appear in the invoice's **Payment History** tab and are each posted to the GL.

### Payment Methods Reference

| Method | Notes |
|--------|-------|
| Cash | No setup required |
| Bank Transfer | Enter bank name and reference number |
| Telebirr | Auto-matched when gateway is configured |
| Chapa | Auto-matched via webhook |
| CBE Pay | Auto-matched via direct API |
| Cheque | Enter cheque number for audit trail |
| Stripe | For international USD/EUR payments |

---

## Automated Payment Reminders

OVDS can automatically email customers before and after the invoice due date.

1. Navigate to **Settings → invoice**.
2. Enable **Automated Payment Reminders**.
3. Configure the trigger:
   - **Before due date** — e.g. send a reminder 3 days before
   - **After due date** — e.g. send a follow-up 7 days overdue
4. Customize the email subject and message body.
5. Click **Save** — reminders are sent automatically for all unpaid invoices matching the trigger criteria.

---

## Editing an Invoice

Invoices in **Draft** status can be freely edited.

1. Open the invoice from **Sales → Invoices**.
2. Click **Edit** in the top-right corner.
3. Make the necessary changes.
4. Click **Save**.

---

> Invoices with status **Sent**, **Partial**, or **Paid** are locked for editing to preserve audit integrity. To correct an already-sent invoice, issue a **Credit Note** and create a new invoice with the correct details.

## Duplicating an Invoice

Use Duplicate to quickly create a new invoice pre-filled with the same customer, items, and pricing.

1. Open the invoice and click **More Actions (⋯)**.
2. Select **Duplicate**.
3. The system creates a new Draft invoice with today's date — update any fields as needed.
4. Click **Save** or **Send**.

---

## Handle Refunds and Credit Notes

### Issue a Full Refund
1. Open the paid invoice and click **More Actions → Issue Refund** (or navigate to **Sales → Refunds** `/refunds`).
2. Select the refund method (can differ from the original payment method).
3. Click **Confirm** — Ovds:
   - Creates a **Credit Note** linked to the original invoice
   - Reverses the GL entries automatically
   - Updates the invoice status to reflect the refund

### Issue a Partial Refund
1. Open the paid invoice and click **More Actions → Issue Refund**.
2. Enter the partial amount to refund.
3. A Credit Note is created for that amount; the original invoice retains the remaining paid balance.

### Apply a Credit Note to a Future Invoice
1. Open a future invoice for the same customer.
2. In the payment section, select **Apply Credit Note**.
3. Choose the credit note from the list — the invoice balance is reduced accordingly.

### Create a Credit Note Manually
1. Navigate to **Sales → Credit Notes** (`/credit-notes`).
2. Click **New Credit Note**.
3. Select the customer and the original invoice.
4. Adjust the items and amounts as needed.
5. Click **Save** — the credit note reduces the customer's open balance.

---

## Recurring Invoices

Use recurring invoices to automatically generate and send invoices on a set schedule — ideal for subscriptions, retainers, and monthly service fees.

1. Open any saved invoice and click **Make Recurring**.
   *(Alternatively, navigate to **Sales → Recurring Invoices** if the extension is installed.)*
2. Set the **billing frequency**: Weekly, Monthly, Quarterly, or Annually.
3. Set the **start date**.
4. Set the termination rule:
   - After a fixed number of cycles (e.g., after 12 months)
   - On a specific end date
   - Never (runs indefinitely until manually stopped)
5. Click **Save** — Ovds automatically generates and emails the invoice on each scheduled date.

> Recurring invoices appear in **Sales → Invoices** with a recurring icon. You can pause, edit, or cancel the schedule at any time without affecting previously issued invoices.

---

## Exporting and Archiving Invoices

### Export Invoice List
1. Go to **Sales → Invoices**.
2. Apply any filters (date range, status, customer).
3. Click **Export** — download as CSV or PDF.

### Download Individual Invoice PDF
1. Open the invoice and click **More Actions → Download PDF**.

### Year-End Archiving
1. Go to **Sales → Invoices**.
2. Filter by status (e.g., *Paid*) and the relevant date range.
3. Use bulk-selection checkboxes to select the invoices to archive.
4. Click **More Actions → Archive**.

Archived invoices are hidden from the active list view but remain fully searchable and included in all reports and the General Ledger. They are never deleted.

---

## Manage Invoice Comments and Internal Notes

1. Open any invoice and scroll to the **History / Notes** section at the bottom.
2. Add an internal note — e.g. *"Customer confirmed payment by Thursday"*.
3. If the customer leaves a comment via the Client Portal, it appears here in real-time and triggers a notification to the assigned team member.

> Internal notes are visible only to your team. They do not appear on the invoice PDF or in the customer-facing portal.

---

## invoice Reports

Navigate to **Reports** (`/reports`) to track invoice performance:

| Report | What it shows | Location |
|--------|--------------|---------|
| Income Summary | Revenue by customer and period | Reports → Financial |
| Aged Receivables | Overdue invoices grouped by days outstanding | Reports → AR Aging |
| Tax Summary | Output VAT billed, collected, and owed | Reports → Tax Summary |
| Invoice List | Filterable list of all invoices with status | Sales → Invoices → Export |

> See [Reports](../07-reports/README.md) for the full reporting reference.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Create a new invoice | [Creating an Invoice](./creating-an-invoice.md) |
| Customize invoice template and logo | [Settings → Company & Tax](../03-settings/company-and-tax.md#invoice-customization) |
| Set up payment gateways | [Settings → Banking & Payments](../03-settings/banking-and-payments.md) |
| Multi-currency invoice | [Multi-Currency & FX](./multi-currency.md) |
| Client portal setup | [Advanced → CRM & Pipeline → Client Portal](../08-advanced/crm-and-pipeline.md#client-portal) |
| Reconcile payments with bank | [Banking → Bank Reconciliation](../05-banking/bank-reconciliation.md) |
| ERCA QR code compliance | [Tax & Compliance](../06-tax-compliance/README.md) |



