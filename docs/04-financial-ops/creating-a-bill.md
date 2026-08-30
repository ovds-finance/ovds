<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Creating a Bill

> **Part of:** [Financial Operations](./README.md) › Bills, Expenses & Purchases
>
> **Requires:** Login · `bills:read` · `bills:write` permissions
>
> **Lifecycle phase:** [Phase 1 — Data Capture](./../FILING-LIFECYCLE.md#2-phase-1--data-capture) &middot; [Phase 2 — Tax Calculation](./../FILING-LIFECYCLE.md#3-phase-2--tax-calculation--accrual) | WHT rates: [`CORE-CONFIG.md`](./../CORE-CONFIG.md#7-tax-rate--deadline-summary)

Tracking bills keeps your business on top of expenses, cash flow, and vendor relationships. OVDS makes it straightforward to record, manage, and pay vendor bills — with Withholding Tax (WHT) calculated automatically where applicable.

---

## Before You Start

- **Vendors** with a TIN on file trigger automatic WHT calculation (2%) on bills ≥ ETB 10,000 for goods or ≥ ETB 500 for services.
- **Tax rates** for line items must be pre-configured in **Settings → Taxes** before you can assign them to bill items.
- **Discount Location** must be set to *Both Line and Total* in **Settings → Localization** to enable line-level discounts.

---

## Creating a Bill

### Step 1 — Navigate to Bills

1. Log in to your OVDS Dashboard.
2. On the main navigation menu bar, click **Purchases**.
3. Click **Purchases** to reveal the drop-down menu.
4. Select **Bills**.
5. From the Bills dashboard, click **New Bill**.

---

### Step 2 — Fill in Bill Details

Enter the required information on the bill creation page:

| Field | Required | Notes |
|-------|----------|-------|
| Vendor | ✅ | Select existing or create new |
| Bill Date | ✅ | Date on the vendor's invoice |
| Bill Number | ✅ | Vendor's invoice reference number |
| Due Date | Optional | Calculated from payment terms if left blank |
| Currency | ✅ | Defaults to ETB |
| Line Items | ✅ | At least one item required |

---

### Step 3 — Add a Vendor

1. In the **Vendor** field, click **Add a Vendor**.
2. Select an existing vendor from the dropdown, or click **New Vendor** to create one.
3. Fill in the vendor details:

| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | Legal business name |
| TIN | Recommended | Required for WHT auto-calculation |
| Email | Recommended | For PO and bill delivery |
| Phone Number | Optional | |
| Payment Currency | ✅ | Defaults to ETB |
| Bank Name | Recommended | For payment batch export |
| Account Number | Recommended | For payment batch export |
| Payment Terms | Optional | Default: Net 30 |
| WHT Exempt | Optional | Mark if vendor is WHT-exempt |

4. Click **Save**.

---

### Step 4 — Add Items or Services

1. Click **Add an Item**.
2. Enter the following for each item:
   - **Item Name**
   - **Description**
   - **Quantity**
   - **Unit Price**
3. The bill total is automatically calculated as you add items.
4. Repeat for each additional product or service.

> You can apply a **discount** or assign a **tax** directly on each item row. See the sections below.

---

### Step 5 — Notes, Footer, and Attachments

1. Use the **Notes** box to add instructions, remarks, or references relevant to the bill.
2. Scroll down and click **Advanced** to expand:
   - **Footer** — text printed at the bottom of the bill PDF
   - **Category** — assign to an accounting category for reporting
   - **Color** — customize the bill PDF accent color (see [Changing the Color of a Bill](#changing-the-color-of-a-bill))
   - **Attachments** — upload the vendor's original invoice PDF, delivery note, or supporting documents

---

### Step 6 — Save

Click **Save** — the bill is created with **Draft** status.

> **WHT Auto-Calculation:** If the vendor has a TIN on file and the bill total is ≥ ETB 10,000 (goods) or ≥ ETB 500 (services), OVDS automatically calculates and displays the 2% Withholding Tax deduction. This amount is tracked separately for ERCA remittance.

---

## Adding Discounts to Bills

You can apply a **global discount** to the entire bill, or a **line discount** to specific items.

### Enable Line Discounts First

Line discounts are disabled by default:

1. Go to **Settings → Localization**.
2. Scroll to **Other → Discount Location**.
3. Select **Both Line and Total**.
4. Click **Save**.

### Add a Line Discount

Once enabled:

1. Click **Add an Item** and enter the item details — name, description, quantity, and amount.
2. Below the **Quantity** field on the item row, click **Add Discount**.
3. Enter the discount as a **percentage** or a **fixed currency amount**.
4. The discounted total is automatically reflected in the bill.

> Global discounts (applied to the whole bill) are available without any settings change — enter the discount value in the discount field at the bottom of the line items section.

---

## Adding Taxes to Bills

> **Prerequisite:** Tax rates must be configured in **Settings → Taxes** before they can be assigned to bill items.

1. Click **Add an Item** and enter the item details.
2. Below the **Price** field on the item row, click **Add Tax**.
3. Click **New Tax** from the dropdown.
4. Enter:
   - **Name** — e.g. *VAT 15%*
   - **Rate** — as a percentage (e.g. `15`)
5. Click **Save** — the tax is applied to that item and reflected in the bill total.

> Multiple tax rates can be stacked on a single line item. Each is calculated and shown separately in the bill PDF.

---

## Changing the Color of a Bill

Customize the accent color of the bill PDF to match your brand or the vendor's branding.

> This applies to the **PDF and print layout** only — it does not affect the bill record's appearance in your dashboard.

1. On the **New Bill** page (or when editing), scroll down to **Advanced**.
2. Click **Advanced** to expand.
3. Click the **Color** icon to open the color palette, or type a hex code directly (e.g. `#16A34A`).
4. Click **Save**.

---

## Bill Status Lifecycle

| Status | How it's set |
|--------|-------------|
| **Draft** | Default on creation |
| **Received** | Click **Mark as Received** on the bill's detail page |
| **Partial** | Automatically set when a partial payment is recorded |
| **Paid** | Automatically set when full payment is recorded |
| **Cancelled** | Click **Cancel** from the ⋯ menu |

---

## Recording Bill Payment

1. Open the bill → click **Pay Bill**.
2. Select the **payment account** (bank account or cash).
3. Enter the **payment date** and an optional **reference number**.
4. If WHT applies, the deductible amount is shown separately — it is automatically tracked for ERCA remittance.
5. Click **Save** — bill status changes to **Paid**.

> If you record a partial payment, the bill status changes to **Partial** and the remaining balance is tracked. Record additional payments until fully settled.

---

## Managing Bills

### Bills Dashboard

Navigate to **Purchases → Bills** for an overview of all bills, including overdue, open, and draft.

Bills are sortable by: Date, Status, Vendor, Bill Number, and Amount.

**Quick actions (hover over a bill row):**
- **Edit** — update bill details
- **Duplicate** — copy the bill with today's date
- **Add Payment** — record a payment

**More options (⋯ menu):**
- Print
- Download PDF
- Cancel
- Delete

**Bulk actions (select one or more bills):**
- Mark as Received
- Cancel
- Delete
- Export

### Editing a Bill

1. Open the bill from the Bills dashboard.
2. Click **Edit** in the top-right corner.
3. Update the necessary fields.
4. Click **Save**.

> Bills with **Paid** status are locked. To make a correction, cancel the payment first, or issue a **Debit Note** for the adjustment.

### Duplicating a Bill

1. Open the bill → click **More Actions (⋯) → Duplicate**.
2. A new Draft bill is created with the same vendor, items, and amounts — update the bill date and number to match the new invoice.

### Set a Default Bill Tab

1. Go to **Purchases → Bills**.
2. On the Bills list, click the **Pin icon** on the tab you want to load by default.
3. That tab will now open automatically each time you visit the Bills page.

---

## WHT Certificates

After recording bill payments with WHT deductions, generate monthly certificates for each vendor:

1. Navigate to **Purchases → WHT Certificates** (`/tax/wht-certificates`) — requires `vat:write`.
2. Click **Generate** for the relevant month.
3. OVDS creates one certificate per vendor showing the total payments made and WHT withheld.
4. Email the certificate to the vendor — they use it to claim WHT credit on their own tax return.
5. Keep a copy in the Audit Trail for ERCA verification.

> Full WHT configuration and filing workflow: [Tax & Compliance → WHT & Other Taxes](../06-tax-compliance/wht-and-other-taxes.md)

---

## Scanned Receipts (OCR Import)

Upload physical receipts and paper invoices — OVDS extracts the data automatically using OCR.

Navigate to **Purchases → Scanned Receipts** (`/scanned-bills`) — requires `bills:read`.

1. Click **Upload Receipt** — drag and drop a photo or PDF of the paper bill.
2. OVDS reads: vendor name, date, amount, and VAT.
3. Review and confirm the extracted values.
4. The receipt is converted to a bill and posted to the GL.
5. The original image is stored and linked to the bill for audit purposes.

> **Setup:** Requires `OPENAI_API_KEY` or `GEMINI_API_KEY` in your environment configuration (`.env`).

---

## Debit Notes

Issue a Debit Note when you need to formally notify a vendor of an increase in what they owe you — for example, a short delivery or a quality deduction.

Navigate to **Purchases → Debit Notes** (`/debit-notes`) — requires `bills:read`.

1. Click **New Debit Note** → select the original bill.
2. Enter the amount and reason for the deduction.
3. Click **Save** — the debit note reduces the net payable to the vendor.
4. The debit note is applied against the next vendor payment.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Purchase Orders (PO workflow) | [Purchase Orders & GRN](./purchase-orders.md) |
| Goods Received Notes | [Purchase Orders & GRN → GRN](./purchase-orders.md#goods-received-notes-grn) |
| Expense claims and reimbursements | [Expense Claims](./expense-claims.md) |
| WHT rates and filing | [Tax & Compliance → WHT & Other Taxes](../06-tax-compliance/wht-and-other-taxes.md) |
| AP Aging report | [Reports → Financial Reports](../07-reports/financial-reports.md#ar--ap-aging-reports) |
| Vendor fields reference | [Customers & Vendors → Vendor Fields](./customers-and-vendors.md#vendors) |



