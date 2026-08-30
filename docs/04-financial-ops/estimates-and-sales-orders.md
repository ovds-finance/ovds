<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Estimates, Proforma Invoices, Sales Orders & Receipts

> **Part of:** [Financial Operations](./README.md) › Invoices & Estimates
>
> **Requires:** Login · `invoices:read` · `invoices:write` permissions

This section covers the full pre-billing workflow — from sending a quote, through confirmed orders, to point-of-sale receipts. Each document type sits at a distinct stage of the sales cycle and can be converted forward with a single click.

---

## Sales Cycle Overview

```
ESTIMATE (Quote)
    │
    ▼
SALES ORDER (Confirmed commitment)
    │
    ▼  (Goods / services delivered)
INVOICE (Billing)
    │
    ▼
PAID

─── or, for immediate cash sales ───

SALES RECEIPT (Payment on the spot, no invoice needed)
```

---

## Estimates

Navigate to **Sales → Estimates** — requires `invoices:read`.

An Estimate (quote) is a formal offer sent to a customer before work begins. It is not a financial transaction — no GL entries are created until you convert it to an invoice.

### Creating an Estimate

1. Go to **Sales → Estimates** → click **New Estimate**.
2. Fill in the same fields as a regular invoice:
   - Customer, Estimate Date, Expiry Date, line items (name, description, quantity, price)
   - Apply discounts or taxes to line items as needed
3. Add any **Notes** for the customer — e.g. validity period, payment terms, scope limitations.
4. Expand **Advanced** to add a Footer, Category, or Attachments.
5. Click **Save** — the estimate is created with **Draft** status.
6. Click **Send** to email it to the customer as a PDF.

### Estimate Statuses

| Status | Meaning |
|--------|---------|
| **Draft** | Created, not yet sent |
| **Sent** | Emailed to the customer — awaiting response |
| **Approved** | Customer accepted the estimate |
| **Declined** | Customer rejected the estimate |
| **Expired** | Expiry date passed with no response |
| **Invoiced** | Converted to an invoice |

### Converting an Estimate to an Invoice

Once the customer approves:

1. Open the estimate → click **More Actions → Convert to Invoice**.
2. All items, pricing, and customer details are copied into a new invoice template.
3. Review and adjust if needed (e.g. update the invoice date or due date).
4. Click **Save** or **Send**.
5. The estimate is automatically archived — it remains viewable in **Sales → Estimates** with status **Invoiced**.

> Converting an estimate does not post anything to the GL. The GL entry is created only when the invoice is saved and a payment is recorded.

---

## Proforma Invoices

Navigate to **Sales → Proforma Invoices** (`/sales/proforma`) — requires `invoices:read`.

A proforma invoice is a preliminary billing document sent before goods are shipped or services are delivered. It is commonly used in:
- Ethiopian import/export for customs clearance
- Construction and project businesses for advance payment requests
- International trade as a declaration of value

A proforma is **not** a legally binding invoice and does not post to the GL.

### Creating a Proforma Invoice

1. Go to **Sales → Proforma Invoices** → click **New Proforma Invoice**.
2. Select the **Customer** and fill in line items, quantities, and prices — same as a regular invoice.
3. Add any relevant **Notes** (e.g. shipping terms, Incoterms, customs HS codes).
4. Click **Save**, then **Send** to email it to the customer.

### Converting a Proforma to a Final Invoice

Once goods are delivered or services rendered:

1. Open the proforma → click **Convert to Invoice**.
2. The invoice is pre-filled with all proforma details — no re-entry needed.
3. Adjust dates and any delivered quantities if partial.
4. Click **Save** — the invoice is now live and posts to the GL when paid.

---

## Sales Orders

Navigate to **Sales → Sales Orders** (`/sales-orders`) — requires `invoices:read`.

A Sales Order (SO) is a confirmed commitment from a customer to purchase goods or services. It sits between an Estimate (quote) and an Invoice (billing), and is especially useful when delivery and billing happen at different times — common in construction, manufacturing, and project-based businesses.

### Sales Order Lifecycle

```
ESTIMATE ──► SALES ORDER ──► (Goods / Service Delivered) ──► INVOICE ──► PAID
```

### Creating a Sales Order

1. Go to **Sales → Sales Orders** → click **New Sales Order**.
2. Select the **Customer**.
3. Set the **Order Date** and **Expected Delivery Date**.
4. Add line items — products or services with quantities and agreed prices.
5. Add **Notes** or **Terms** for the customer if needed.
6. Click **Save** — the SO is created with **Draft** status.
7. Click **Confirm** to move it to **Confirmed** — this commits the order and optionally reserves inventory.

### Sales Order Statuses

| Status | Meaning |
|--------|---------|
| **Draft** | Created but not yet confirmed |
| **Confirmed** | Committed — goods or services are being prepared |
| **Partially Invoiced** | Some line items have been invoiced; others are pending |
| **Fully Invoiced** | All line items have been invoiced |
| **Cancelled** | Order was cancelled before any invoice |

### Converting a Sales Order to an Invoice

1. Open the confirmed SO → click **Create Invoice**.
2. The invoice is pre-filled with the customer details and all SO line items.
3. If only partial delivery occurred, adjust the quantities to match what was actually delivered.
4. Click **Save** and then **Send** to the customer.
5. The SO status updates to **Partially Invoiced** or **Fully Invoiced** automatically.

### Managing Sales Orders

From the **Sales → Sales Orders** list:

**Quick actions (hover over a row):**
- **Edit** — available while in Draft status
- **Confirm** — commit the order
- **Create Invoice** — convert to invoice

**More options (⋯ menu):**
- Duplicate
- Print / Download PDF
- Cancel

---

## Sales Receipts

Navigate to **Sales → Receipts** (`/receipts`) — requires `invoices:read`.

A Sales Receipt records a payment collected at the point of sale — used when payment is received immediately (cash sales, POS transactions) without first issuing an invoice.

### When to Use a Receipt vs an Invoice

| Scenario | Document to Use |
|----------|----------------|
| Customer pays on the spot (cash sale) | Sales Receipt |
| Customer pays later (credit sale) | Invoice |
| POS terminal transaction (retail) | Sales Receipt (auto-created via IoT/POS sync) |
| Advance / deposit before delivery | Sales Receipt or Invoice with partial payment |

### Creating a Sales Receipt

1. Go to **Sales → Receipts** → click **New Receipt**.
2. Select or create the **Customer**.
3. Add line items — items or services sold.
4. Select the **Payment Method** (Cash, Telebirr, Bank Transfer, Cheque, etc.) and the **Account** it was received into.
5. Enter the **Date** and an optional **Reference Number**.
6. Click **Save** — the receipt is recorded and the payment is posted to the GL immediately.

> Unlike an invoice, a Sales Receipt does not go through a Draft → Sent → Paid lifecycle. Payment is recorded at the time of creation.

### ERCA Compliance

- Every receipt PDF includes the **NBE-IQR QR code** for ERCA digital verification.
- Receipts from IoT/POS-connected fiscal printers are synced automatically — see [Advanced → IoT & POS Devices](../08-advanced/iot-and-pos.md#smart-billing--pos).
- VAT is calculated per line item and posted to the **VAT Payable** account.

### Viewing and Exporting Receipts

From **Sales → Receipts**:
- **Download PDF** — full receipt with QR code
- **Print** — physical receipt
- **Export** — CSV list of all receipts for a selected period

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Create and send an invoice | [Creating an Invoice](./creating-an-invoice.md) |
| Record payment against an invoice | [Managing Invoices](./managing-invoices.md#recording-a-payment) |
| Configure payment gateways | [Settings → Banking & Payments](../03-settings/banking-and-payments.md) |
| ERCA QR code and fiscal compliance | [Tax & Compliance](../06-tax-compliance/README.md) |
| IoT / POS device sync | [Advanced → IoT & POS](../08-advanced/iot-and-pos.md) |
| Inventory reservation on Sales Orders | [Items Catalog](./items-catalog.md#inventory-costing-methods) |




