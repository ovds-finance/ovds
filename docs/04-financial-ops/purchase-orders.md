<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Purchase Orders & Goods Received Notes

> **Part of:** [Financial Operations](./README.md) › Bills, Expenses & Purchases
>
> **Requires:** Login · `purchase_orders:read` · `purchase_orders:write` · `purchase_orders:approve`

Purchase Orders (POs) give your business a structured way to commit to purchases, track delivery, and ensure vendor bills match what was actually ordered and received. OVDS enforces a three-way match — PO ↔ GRN ↔ Bill — before payment is approved.

---

## Purchase Order Lifecycle

```
DRAFT ──► APPROVED ──► SENT TO VENDOR ──► PARTIALLY RECEIVED
                                                  │
                              ◄───────────────────┘
                              FULLY RECEIVED ──► BILLED ──► PAID
```

---

## Creating a Purchase Order

Navigate to **Purchases → Purchase Orders** (`/purchase-orders`) — requires `purchase_orders:write`.

1. Go to **Purchases → Purchase Orders** → click **New Purchase Order**.
2. Fill in the required details:

| Field | Required | Notes |
|-------|----------|-------|
| Vendor | ✅ | Select existing or create new |
| Order Date | ✅ | Date the PO is raised |
| Expected Delivery Date | ✅ | Agreed delivery date with vendor |
| Currency | ✅ | Defaults to ETB |
| Line Items | ✅ | Products or services with quantities and agreed prices |
| Delivery Address | Optional | Where goods should be delivered |
| Notes / Terms | Optional | Shipping terms, special instructions, Incoterms |

3. Click **Add an Item** for each product or service. Enter:
   - Item Name
   - Description
   - Quantity
   - Unit Price
4. Click **Save** — the PO is created with **Draft** status.

---

## Approving a Purchase Order

Requires `purchase_orders:approve`.

1. The PO approver opens **Purchases → Purchase Orders → Pending Approval**.
2. Click the PO to review line items, vendor, and total value.
3. Click **Approve** — the PO moves to **Approved** status.
4. To return for revision, click **Reject** with a comment.

> Configure approval thresholds in **Settings → Approval Workflows** — e.g. POs above ETB 50,000 require ovds Director approval.

---

## Sending a PO to the Vendor

Once approved:

1. Open the PO → click **Send**.
2. The vendor receives an email with the PO as a PDF attachment.
3. Alternatively, click **Download PDF** or **Print** for manual delivery.

---

## Receiving Goods (Creating a GRN)

Navigate to **Purchases → Goods Received Notes** (`/grn`) — requires `bills:read`.

When goods arrive, record the receipt against the PO:

1. Open the approved PO → click **Receive Goods**.
2. For each line item, enter the **quantity actually received** — this may differ from the ordered quantity if delivery is partial.
3. Click **Save** — a **Goods Received Note (GRN)** is created automatically.
4. If inventory tracking is enabled for the items, stock levels update immediately.

**Full vs Partial Receipt:**

| Scenario | PO Status |
|----------|----------|
| All items received in full | Fully Received |
| Some items received, others pending | Partially Received |
| Zero items received | Awaiting Delivery |

> You can create multiple GRNs against a single PO as goods arrive in batches.

---

## Three-Way Match: PO ↔ GRN ↔ Bill

OVDS automatically compares:
1. **PO** — what was ordered and at what price
2. **GRN** — what was physically received
3. **Bill** — what the vendor is charging

Discrepancies (wrong price, overbilled quantity, undelivered items) are flagged automatically before payment is approved.

### Converting a GRN to a Bill

1. Open the GRN → click **Create Bill**.
2. The bill is pre-filled with the vendor details and the quantities from the GRN (not the PO — only what was received is billed).
3. Review the line items and the vendor's invoice number.
4. Click **Save** — the bill enters the standard payment workflow.

If the vendor's bill does not match the GRN:
- **Vendor overcharged** → raise a **Debit Note** for the difference.
- **Vendor undercharged** → update the bill with the correct amount and note the variance.

---

## Purchase Order Statuses

| Status | Meaning |
|--------|---------|
| **Draft** | Created — not yet approved |
| **Approved** | Approved internally — ready to send to vendor |
| **Sent** | Delivered to the vendor |
| **Partially Received** | Some items received; others pending |
| **Fully Received** | All items received |
| **Billed** | A bill has been created from this PO/GRN |
| **Paid** | The bill has been fully paid |
| **Cancelled** | PO cancelled before delivery |

---

## Managing Purchase Orders

From **Purchases → Purchase Orders**:

**Quick actions (hover over a row):**
- **Edit** — available while in Draft status
- **Approve** — move to Approved (requires `purchase_orders:approve`)
- **Receive** — record delivery

**More options (⋯ menu):**
- Duplicate
- Print / Download PDF
- Cancel
- Delete (Draft only)

**Bulk actions:**
- Export selected POs as CSV

---

## Goods Received Notes (GRN)

Navigate to **Purchases → Goods Received Notes** (`/grn`).

The GRN list shows all delivery records with:
- Linked PO reference
- Vendor name
- Received date
- Items and quantities received
- Status (Open, Billed, Cancelled)

From a GRN you can:
- **Create Bill** — convert received quantities to a payable bill
- **Print / Download PDF** — for your warehouse or audit records
- **View linked PO** — jump directly to the originating purchase order

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Recording and paying a vendor bill | [Creating a Bill](./creating-a-bill.md) |
| Debit notes for vendor discrepancies | [Creating a Bill → Debit Notes](./creating-a-bill.md#debit-notes) |
| WHT on vendor payments | [Creating a Bill → WHT Certificates](./creating-a-bill.md#wht-certificates) |
| Inventory levels and stock movements | [Items Catalog](./items-catalog.md) |
| AP Aging report | [Reports → Financial Reports → AP Aging](../07-reports/financial-reports.md#ar--ap-aging-reports) |
| Approval workflow configuration | [Settings](../03-settings/README.md) |




