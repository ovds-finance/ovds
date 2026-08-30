<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Financial Operations — Income & Expenses

> **Part of:** [OVDS Documentation](../README.md) › Financial Operations
>
> **Phase:** 2 · Daily Operations — requires login and appropriate role permissions. This phase feeds [Phase 2 — Tax Calculation](./../FILING-LIFECYCLE.md#3-phase-2--tax-calculation--accrual) and [Phase 3 — Analysis](./../FILING-LIFECYCLE.md#4-phase-3--analysis--liability-estimation) of the Digital Automated Filing Lifecycle. Tax rates and terminology: [`CORE-CONFIG.md`](./../CORE-CONFIG.md).
>
> **Related modules:** [Settings](../03-settings/README.md) · [Banking](../05-banking/README.md) · [Tax & Compliance](../06-tax-compliance/README.md) · [Reports](../07-reports/README.md)

This module covers the full AR/AP cycle: invoices, estimates, bills, purchase orders, expenses, and unified payment workflows. All financial operations are double-entry — every transaction posts to the General Ledger automatically.

---

## Standalone Guides

| Guide | Description |
|-------|-------------|
| [Creating an Invoice](./creating-an-invoice.md) | Step-by-step invoice creation, fields reference, discounts, taxes, color, ERCA QR |
| [Managing Invoices](./managing-invoices.md) | Sending, status tracking, recording payments, refunds, recurring, archiving |
| [Estimates, Proforma & Sales Orders](./estimates-and-sales-orders.md) | Quotes, proforma invoices, sales order lifecycle, sales receipts |
| [Creating a Bill](./creating-a-bill.md) | Vendor bills, WHT auto-calc, discounts, taxes, payment, WHT certificates, OCR |
| [Purchase Orders & GRN](./purchase-orders.md) | PO lifecycle, approval, receiving goods, three-way match, bill conversion |
| [Expense Claims](./expense-claims.md) | Employee claims, approval workflow, HR recruitment, agency invoice, cost recovery |
| [Payments & Gateways](./payments-and-gateways.md) | Telebirr, Chapa, CBE Pay, Stripe setup, payment flow, refunds, payment tracker |
| [Items Catalog](./items-catalog.md) | Products, services, bundles, inventory costing (FIFO/WA), reorder alerts, IAS 2 |
| [Data Import / Export](./data-import-export.md) | Opening balances, CSV import order, export formats, scheduled exports |
| [Fixed Assets](./fixed-assets.md) | Add asset, SLM/DB depreciation, IAS 16 vs ERCA, disposals, impairment, register |
| [Budgets & Planning](./budgets-and-planning.md) | Budget creation, GL line items, CSV import, Budget vs Actual, variance dashboard |
| [General Ledger & Journal Entries](./general-ledger-and-journals.md) | Chart of Accounts, manual entries, accruals, prepayments, recurring templates, period-end sequence |
| [Customers & Vendors](./customers-and-vendors.md) | Customer 360, credit scores, statements, vendor TIN/WHT setup, transaction categories, bulk import |
| [Credit Notes](./credit-notes.md) | Create from invoice, partial credits, apply to future invoice, cash refund, VAT reversal, GL impact |
| [Cost Centers](./cost-centers.md) | Create cost centers, tag transactions, P&L by cost center, hierarchical structure, shared cost allocation |
| [Month-End & Year-End Closing](./month-end-and-year-end.md) | Complete monthly and annual close sequence — 24-step monthly checklist, quarterly DRRF, BIT annual, year-end tasks |
| [Multi-Currency & FX](./multi-currency.md) | Add currencies, FX rates, foreign-currency invoices/bills, IAS 21 exchange gains/losses, year-end revaluation |
| [Payment Edge Cases](./payment-edge-cases.md) | Overpayments, advance deposits (IFRS 15), bounced payments, write-offs, split payments |
| [Order & Dispatch Data Model](./order-dispatch-data-model.md) | Schema design: Sales Orders → Dispatch/Delivery → invoice pipeline, credit notes, pricing engine, assembly/kit expansion |

---

## Table of Contents

| # | Section | Key Topics |
|---|---------|-----------|
| [1](#1-invoices--estimates) | **Invoices & Estimates** | Create, send, track, pay, refund, recurring, portal |
| [1.1](#step-by-step-invoice-creation) | Step-by-Step Invoice Creation | 6-step UI walkthrough |
| [1.2](#track-invoice-status) | Invoice Status Tracking | Draft → Sent → Partial → Paid → Overdue |
| [1.3](#recording-a-payment) | Recording a Payment | Full, partial, split payments |
| [1.4](#set-up-automated-reminders) | Automated Reminders | Settings → invoice |
| [1.5](#customizing-invoice-templates) | Invoice Templates & Branding | Logo, layout, payment terms |
| [1.6](#recurring-invoices) | Recurring Invoices | Scheduled auto-generation |
| [1.7](#multi-currency-billing) | Multi-Currency Billing | FX rates, currency selection |
| [1.8](#match-and-reconcile-payments) | Reconciliation | Bank statement matching |
| [1.9](#assign-staff-roles-and-permissions) | Staff Roles & Permissions | Access control per user |
| [1.10](#estimates--converting-to-invoice) | Estimates → Invoice | Quote lifecycle |
| [1.11](#client-portal-customer-self-service) | Client Portal | Self-service payments |
| [1.12](#handle-refunds-and-credit-notes) | Refunds & Credit Notes | Full, partial, GL reversal |
| [1.13](#tax-audits-and-tax-liability-reports) | Tax Audits | Tax-inclusive/exclusive, Tax Summary |
| [1.14](#multi-company-invoice) | Multi-Company | Switch company environments |
| [1.15](#custom-fields-for-local-regulations) | Custom Fields | HSN codes, local requirements |
| [1.16](#year-end-archiving-and-cleanup) | Year-End Archiving | Bulk archive, fiscal year close |
| [1.17](#proforma-invoices) | Proforma Invoices | Pre-shipment billing |
| [1.18](#sales-orders) | Sales Orders | Estimate → SO → Invoice lifecycle |
| [1.19](#sales-receipts) | Sales Receipts | Point-of-sale, POS sync, ERCA QR |
| [2](#2-bills-expenses--purchases) | **Bills, Expenses & Purchases** | Vendor bills, PO/GRN workflow, WHT |
| [2.1](#creating-a-bill) | Creating a Bill | Vendor, line items, WHT auto-calc |
| [2.2](#adding-discounts-to-bills) | Adding Discounts to Bills | Global & line discounts |
| [2.3](#adding-taxes-to-bills) | Adding Taxes to Bills | Tax rates on line items |
| [2.4](#changing-the-color-of-a-bill) | Changing the Color of a Bill | Brand color customization |
| [2.5](#recording-bill-payment) | Recording Bill Payment | Full, partial, WHT deduction |
| [2.6](#managing-bills) | Managing Bills | Dashboard, bulk actions |
| [2.7](#editing-a-bill) | Editing a Bill | Update & save |
| [2.8](#changing-the-status-of-a-bill) | Changing Bill Status | Draft → Received → Partial → Paid |
| [2.9](#set-default-bill-tab) | Set Default Bill Tab | Pin a tab as default |
| [2.10](#purchase-orders-po-workflow) | Purchase Orders | Draft → Approved → Received → Billed |
| [2.11](#expense-claims--reimbursements) | Expense Claims | Fields, approval workflow, categories, RBAC |
| [2.12](#hr-recruitment-workflows) | HR Recruitment | Agency invoice, candidate costs |
| [2.13](#wht-certificates-taxwht-certificates) | WHT Certificates | Monthly vendor certificates |
| [2.14](#scanned-receipts-scanned-bills) | Scanned Receipts | OCR-powered receipt import |
| [2.15](#debit-notes-debit-notes) | Debit Notes | Vendor adjustments |
| [2.16](#goods-received-notes--grn-grn) | Goods Received Notes | Three-way PO ↔ GRN ↔ Bill match |
| [3](#3-unified-payments) | **Unified Payments** | Methods, gateway setup, customer flow, tracker |
| [4](#4-items--products-catalog) | **Items & Products** | Catalog, bundles, costing methods, categories |
| [5](#5-data-import--export) | **Data Import / Export** | Opening balances, CSV import, export, scheduled reports |
| [6](#6-fixed-assets) | **Fixed Assets** | Add asset, SLM/DB depreciation, disposals, IAS 16/36 |
| [7](#7-navigation-flow) | **Navigation Flow** | Full route tree with permissions |
| [8](#8-cross-module-links) | **Cross-Module Links** | Related docs, quick jumps |

---

## 1. Invoices & Estimates

Navigate to **Sales → Invoices** (`/invoices`) — requires `invoices:read`.

> **Before you start:** Ensure your company logo, TIN, and invoice template are configured in [Settings → Company & Tax](../03-settings/company-and-tax.md). Payment gateways (Telebirr, Chapa) must be enabled in [Settings → Banking & Payments](../03-settings/banking-and-payments.md) before the Pay Now button appears on client emails.

### Step-by-Step Invoice Creation

#### Step 1 — Navigate to Invoices
1. Log in to your OVDS Dashboard.
2. On the main navigation menu bar, click **Sales**.
3. Select **Invoices** from the drop-down menu.
4. Click **New Invoice** in the top-right corner to open a blank invoice template.

#### Step 2 — Fill in Invoice Details
- **Title / Subheading** — give your invoice a descriptive title (e.g., *Invoice #1024*).
- **Dates** — select the **Invoice Date** (date of issue) and the **Due Date**.
- **Numbers** — the system auto-generates an invoice number, or you can enter your own. Add an optional **Order Number** if applicable.

#### Step 3 — Add Customer Billing Information
1. Go to the **Billing** section.
2. Click **Add a Customer** and select an existing client from the dropdown, or click **New Customer** to add one.
3. Confirm the customer's **Name** and **Payment Currency**.

#### Step 4 — Add Items and Services
1. Click **Add an Item**.
2. Enter the item name, description, quantity, and unit price — the total calculates automatically.
3. Add more lines for additional products or services as needed.
4. Apply line-specific or global **discounts** (percentage or fixed amount) and assign **taxes** directly from the item line.

#### Step 5 — Notes, Footer, and Attachments
1. Expand **Advanced** options.
2. Add payment instructions, late fee policies, or other recipient notes in the **Notes** section.
3. Define the **Footer** text and assign a **Category**.
4. Upload supporting documents or receipts as **Attachments**.

#### Step 6 — Save or Send
- Click **Save** to store the invoice as a **Draft** for review before distribution.
- Click **Send To** to email it directly to the customer.
- From a draft you can download a PDF, print, or preview the layout before sending.

---

**Invoice Fields Reference:**
| Field | Required | Notes |
|-------|----------|-------|
| Customer | ✅ | TIN required for B2B VAT |
| Invoice Date | ✅ | Defaults to today |
| Due Date | ✅ | Calculated from payment terms |
| Line Items | ✅ | Min 1 item |
| VAT Rate | ✅ | 15%, 0%, or Exempt per item |
| Currency | ✅ | ETB default |
| ERCA QR Code | Auto | NBE-IQR format, generated automatically |

---

### Sending an Invoice
- **Email** — sends PDF to customer's email (requires SMTP)
- **Share Link** — generates a public URL for the Client Portal
- **QR Code** — customer scans to view and pay online
- **Print / PDF** — download for physical delivery

---

### Track Invoice Status

View the colored status badge next to each invoice in **Sales → Invoices**:

| Badge | Meaning |
|-------|---------|
| **Draft** | Created but not yet shared with the client |
| **Sent** | Emailed to the customer but unpaid |
| **Partial** | A partial payment has been applied |
| **Paid** | Full payment received and recorded |
| **Overdue** | Due date passed without full payment |

---

### Recording a Payment

**Full Payment:**
1. Open the invoice → click **Add Payment**.
2. Select the **Date**, **Account** (e.g., Business Bank Account), and **Payment Method** (Bank Transfer, Cash, Telebirr, etc.).
3. Enter the full amount received.
4. Click **Save** — invoice status changes to **Paid**.

**Partial Payment:**
1. Open the invoice → click **Add Payment**.
2. Enter an amount less than the balance due.
3. Invoice status changes to **Partial** — remaining balance is tracked.
4. Repeat until fully paid.

**Splitting Payments** — a single invoice can be paid across multiple methods (e.g., 50% Telebirr + 50% Bank Transfer):
1. Record the first payment with its method and amount.
2. Record a second payment with a different method.
3. Both payments are linked to the invoice and posted to the GL.

---

### Set Up Automated Reminders
1. Navigate to **Settings → invoice**.
2. Enable automated payment reminders.
3. Configure emails to trigger a set number of days **before** or **after** the due date.

---

### View Client History and Reports
- Go to **Sales → Customers** and click a client's name to view their complete transaction history, total revenue, and open balances.
- Navigate to **Reports** to see **Income vs Expense** or **Tax Summary** dashboards — these update automatically as invoices are paid.

---

### Customizing Invoice Templates

#### Brand Your Invoice
1. Go to **Settings → Company** to upload your company logo.
2. Navigate to **Settings → invoice** to choose a template layout.
3. Set default fields such as **Payment Terms** (e.g., Net 30) and default currency.
4. Add a global footer with your business registration or bank details — it appears automatically on every new invoice.

#### Enable Online Payments for Clients

> Setup guide for each gateway: [Settings → Payment Gateways](../03-settings/README.md#6-currencies--banking-setup)

1. Go to **Apps** (`/app-store`) from the left sidebar.
2. Search for your preferred payment gateway (Stripe, PayPal, Telebirr, CBE Pay, etc.).
3. Install the app and enter your payment gateway API credentials.
4. Once linked, OVDS automatically adds a **Pay Now** button to invoice emails sent to clients.

---

### Recurring Invoices

1. Open an invoice → click **Make Recurring** (or navigate to **Sales → Revenues** if the Recurring Invoices extension is installed).
2. Set **billing frequency**: Weekly, Monthly, Quarterly, Annually.
3. Set the **start date** and termination rules (e.g., after 12 cycles, or never).
4. The system auto-generates and emails the invoice on the scheduled dates — no manual intervention required.

---

### Exporting and Sharing Invoices

From any invoice, click **More Actions**:
- **Download PDF** — save a local copy for your records.
- **Print** — generate a hard copy immediately.
- **Share Link** — generate a unique URL to send via SMS, chat, or email.

---

### Multi-Currency Billing

> Exchange rate setup: [Settings → Currencies & FX](../03-settings/README.md#6-currencies--banking-setup) · IAS 21 FX differences are calculated automatically.

1. Go to **Settings → Currencies** (`/fx-rates`).
2. Click **Add New** to add currencies (USD, EUR, GBP, etc.).
3. Enter the current exchange rate or use an automatic rate plugin.
4. When creating an invoice, select the client's currency — OVDS converts the figures automatically for your main financial dashboard.

---

### Match and Reconcile Payments

> Full reconciliation workflow: [Banking → Reconciliation](../05-banking/README.md#4-reconciliation-workflow)

1. Navigate to **Banking → Transactions** or **Reconciliation** (`/bank-reconciliation`).
2. Upload your bank statement file (CSV, OFX, or QIF) — see [Banking → Import Statement](../05-banking/README.md#3-bank-statement-import) for format details.
3. Match deposited funds from the bank statement to your paid invoices.
4. Click **Reconcile** to lock the transaction and keep your books accurate.

---

### Assign Staff Roles and Permissions

> Full RBAC matrix and role definitions: [Users & Roles](../02-users-roles/README.md)

1. Go to **Settings → Users** (`/users`).
2. Click **Add New** to invite an employee, partner, or accountant.
3. Assign a role (Manager, Accountant, etc.) or create a custom role at **Settings → Roles & Permissions** (`/role-permissions`).
4. Restrict access so team members can only view, create, or send invoices without seeing overall bank balances or expenses.

---

### Track Performance with invoice Reports

> Full report reference: [Reports](../07-reports/README.md)

Navigate to **Reports** (`/reports`) on the left menu:
- **Income Summary** — see which clients generate the most revenue → [P&L report](../07-reports/README.md#profit--loss-income-statement)
- **Aged Receivables** — instantly see which invoices are overdue and by how many days → [AR Aging](../07-reports/README.md#ar-aging-report)
- **Tax Summary** — output vs input VAT per period → [Sales Tax report](../07-reports/README.md#5-sales-tax-summary)

---

### Estimates & Converting to Invoice

1. Go to **Sales → Estimates** to create and send a quotation.
2. Fill in the same fields as a regular invoice.
3. Send to the customer for approval.
4. Once approved, open the estimate → click **More Actions → Convert to Invoice**.
5. All items, pricing, and customer details copy into a new invoice template. The estimate is archived automatically.

---

### Invoice PDF & ERCA QR Code
Every invoice PDF includes:
- Company logo, name, TIN, address
- Customer details and TIN
- Itemized line items with VAT breakdown
- **NBE-IQR QR code** — ERCA-compliant digital verification
- Payment instructions and bank details

---

### Client Portal (Customer Self-Service)

1. Go to **Settings → invoice** and enable the **Client Portal** toggle.
2. When creating a new customer, check **Create Portal User** and enter their email.
3. The client receives an invitation to log into their own secure portal.
4. Inside the portal, clients can:
   - View unpaid invoices and download PDFs
   - Make online payments
   - View past payment receipts
   — all without emailing you directly.

**Public Share Link (no login required):**
1. Open invoice → click **Share**.
2. Copy the public link or send via email.
3. Customer sees invoice details, can download PDF, and pay online.
4. Payment confirmation is sent to both parties.

---

### Manage Invoice Comments and Communication

1. Open any sent invoice.
2. Scroll to the **History / Notes** section at the bottom.
3. Add internal team notes (e.g., *"Client promised payment by Friday"*).
4. If the client leaves a comment via their Client Portal, it appears here in real-time and triggers a notification.

---

### Handle Refunds and Credit Notes

1. Open a paid invoice where a refund or billing adjustment is needed.
2. Click **More Actions → Create Credit Note**.
3. Adjust the amount to match the refund value.
4. Apply the credit note to lower the customer's open balance, or log it as a refund transaction against your bank account.

**Full Refund via Sales → Refunds (`/refunds`)** — requires `invoices:write`:
1. Open the paid invoice → click **Issue Refund**.
2. Select the refund method (same as original or different).
3. A Credit Note is created and linked to the original invoice — GL entries are reversed automatically.

**Partial Refund:**
1. Open the paid invoice → click **Issue Refund**.
2. Enter the partial amount.
3. A Credit Note is created for that amount; the original invoice shows the remaining balance.

**Credit Note Application:**
- Apply to a future invoice for the same customer, or
- Issue a direct cash refund against your bank account.

---

### Tax Audits and Tax Liability Reports

> Full VAT configuration and filing workflow: [Tax & Compliance → VAT](../06-tax-compliance/README.md#1-vat-administration)

1. Go to **Settings → Taxes** (`/tax/dashboard`) to configure Compound Taxes (tax-on-tax) or fixed withholding percentages — see [Tax Engine setup](../03-settings/README.md#3-ethiopian-tax-engine).
2. When creating an invoice, specify whether prices are **Tax Inclusive** or **Tax Exclusive**.
3. Navigate to **Reports → Tax Summary** (`/reports?type=tax`) — see [Sales Tax report](../07-reports/README.md#5-sales-tax-summary).
4. Filter by date ranges to see total sales tax billed, collected, and owed to tax authorities.
5. Use the **Tax Liability Estimator** (`/tax/liability-estimator`) for a live pre-computation before the filing deadline — see [Tax Liability Dashboard](../07-reports/README.md#6-tax-liability-dashboard).

---

### Multi-Company invoice

1. Click your **company name** in the top-right corner of the Dashboard.
2. Select **Manage Companies → Add New**.
3. Create a separate profile with its own tax rules, currencies, and invoice designs for a different business entity.
4. Switch between companies using the top-header dropdown — no need to log out.

---

### Custom Fields for Local Regulations

If your tax authority requires specific fields (HSN codes, registration numbers, delivery dates, etc.):
1. Navigate to **Apps** and install the **Custom Fields** extension.
2. Create a new field — define its type (Text, Date, Dropdown, etc.) and set it to display within the Invoice Form.
3. Toggle the field to **Required** to ensure billing staff always fills it in before saving or sending.

**Full Features**

- Work with multiple field types (Text, Checkbox, Toggle Button, Date, Time, and more)
- Update time stamps on records
- Add toggle buttons on records
- Mark data as required
- Define position for fields
- Integrate with all features
- Create unlimited custom fields
- Define values for field items
- Set default values for fields
- Customize the size of fields

You can add custom information to invoices, customers, items, accounts, transfers, vendors, and more. Create custom fields tailored to your needs and requirements, ensuring you capture accurate and relevant data every time.

---

### Year-End Archiving and Cleanup

1. Open **Sales → Invoices**.
2. Filter by status (e.g., *Paid* or *Overdue*) or by custom date ranges.
3. Use bulk-selection checkboxes to select past invoices.
4. Click **More Actions → Archive** to hide completed records from your active view while preserving the historical ledger for reporting.

---

### Proforma Invoices
Navigate to **Sales → Proforma Invoices** (`/sales/proforma`).

A proforma is a preliminary invoice sent before goods are shipped or services rendered — common in Ethiopian import/export and construction contexts.

1. Create like a regular invoice — select customer, add line items
2. Send to customer for approval or customs purposes
3. Once goods are delivered, **Convert to Invoice** — one click, no re-entry

---

### Sales Orders

Navigate to **Sales → Sales Orders** (`/sales-orders`) — requires `invoices:read`.

A Sales Order (SO) is a confirmed commitment from a customer to purchase goods or services. It sits between an Estimate (quote) and an Invoice (billing).

**Sales Order Lifecycle:**
```
ESTIMATE ──► SALES ORDER ──► (Goods/Service Delivered) ──► INVOICE ──► PAID
```

**Creating a Sales Order:**
1. Go to **Sales → Sales Orders** → click **New Sales Order**.
2. Select the **Customer** and set the **Order Date** and **Expected Delivery Date**.
3. Add line items (products or services) with quantities and agreed prices.
4. Click **Save** — the SO is created with **Draft** status.
5. Click **Confirm** to move it to **Confirmed** — this commits the order and (optionally) reserves inventory.

**Converting a Sales Order to an Invoice:**
1. Open the confirmed SO → click **Create Invoice**.
2. The invoice is pre-filled with customer details and all line items from the SO.
3. Adjust quantities if partial delivery occurred.
4. Save and send the invoice to the customer.

**Sales Order Statuses:**

| Status | Meaning |
|--------|---------|
| Draft | Created but not yet confirmed |
| Confirmed | Committed — goods/services are being prepared |
| Partially Invoiced | Some line items invoiced, others pending |
| Fully Invoiced | All line items have been invoiced |
| Cancelled | Order was cancelled before invoice |

> Sales Orders are especially useful for construction, manufacturing, and project-based businesses where delivery and billing happen at different times.

---

### Sales Receipts

Navigate to **Sales → Receipts** (`/receipts`) — requires `invoices:read`.

A Sales Receipt records a payment received at the point of sale — used when payment is collected immediately (cash sales, POS transactions) without first issuing an invoice.

**When to use a Sales Receipt vs an Invoice:**

| Scenario | Use |
|----------|-----|
| Payment collected on the spot (cash sale) | Sales Receipt |
| Customer pays later (credit sale) | Invoice |
| POS terminal sale (retail) | Sales Receipt (auto-created via IoT/POS sync) |

**Creating a Sales Receipt:**
1. Go to **Sales → Receipts** → click **New Receipt**.
2. Select or create the **Customer**.
3. Add line items (items or services sold).
4. Select the **Payment Method** (Cash, Telebirr, Bank Transfer, etc.) and **Account**.
5. Enter the **Date** and an optional **Reference Number**.
6. Click **Save** — the receipt is recorded and the payment is posted to the GL immediately.

**ERCA Compliance:**
- Every receipt includes the **NBE-IQR QR code** for ERCA digital verification.
- Receipts from IoT/POS-connected fiscal printers are synced automatically — see [Advanced → IoT & POS Devices](../08-advanced/README.md#smart-billing--pos-iotbilling).
- VAT is calculated per line item and posted to the VAT Payable account.

---

## 2. Bills, Expenses & Purchases

Tracking bills is essential — it helps your business manage expenses, cash flow, and vendor relationships. It also supports informed decisions about where to allocate resources and cut costs. Record and manage your bills on OVDS effectively.

Navigate to **Purchases → Bills** (`/bills`) — requires `bills:read`.

> **Related:** [WHT rates and certificates → Tax & Compliance](../06-tax-compliance/README.md#withholding-tax-wht--online-filing) · [AP Aging report → Reports](../07-reports/README.md#ap-aging-report)

---

### Creating a Bill

> Estimated reading: 2 minutes

OVDS makes the process of creating a bill straightforward.

1. Log in to your company's dashboard and go to **Purchases** on the navigation menu bar.
2. Click **Purchases** to reveal the drop-down menu, then select **Bills**.
3. From the Bills dashboard, click **New Bill**.
4. Enter the required billing details:
   - **Required fields:** Vendor, Date, Bill Number, and at least one Item.
5. Add a vendor by clicking **Add a Vendor → New Vendor** and filling in: Name, Email, Phone Number, Tax Number (TIN), Payment Currency, and any other desired fields. Then **Save**.
6. Click **Add an Item** to add products or services. Enter the item name, description, quantity, and price. The bill's total is automatically calculated.
7. Use the **Notes** box to add any instructions or remarks to the bill.
8. Under **Advanced**, you can define a Footer, assign a Category, set a custom color, and upload Attachments.
9. Click **Save** when done.

> WHT (2%) is auto-calculated if the vendor has a TIN on file and the bill amount is ≥ ETB 500.

---

### Adding Discounts to Bills

You can apply a **global discount** to the entire bill or **line discounts** to specific items.

**Enable line discounts first:**
1. Go to **Settings → Localization**.
2. Scroll to **Other → Discount Location**.
3. Select **Both Line and Total** to enable both discount types.
4. Click **Save**.

**To add a line discount when creating a bill:**
1. Click **Add an Item** and enter the product or service details — name, description, quantity, and amount.
2. Below the Quantity field, click **Add Discount**.
3. Enter the discount as a percentage or a fixed currency amount.
4. The total discount is automatically reflected on the bill.

---

### Adding Taxes to Bills

1. Click **Add an Item** and enter the product or service details — name, description, quantity, and price.
2. Below the Price field, click **Add Tax**.
3. Click **New Tax** from the dropdown and enter: Name and Rate (as a percentage). Then **Save**.
4. The tax is automatically applied to the total bill amount.

---

### Changing the Color of a Bill

You can customize the bill color to match your brand.

1. On the **New Bill** page, scroll down to **Advanced** and click to expand it.
2. Click the **Color** icon to pick from the extended color palette, or type a color code directly.
3. Click **Save**.

---

### Recording Bill Payment

1. Open the bill → click **Pay Bill**.
2. Select the payment account (bank account or cash).
3. Enter the payment date and reference number.
4. The WHT amount is deducted automatically and tracked for ERCA remittance.
5. Bill status changes to **Paid**.

> If you make a partial payment, the bill status will be set to **Partial**.

---

### Managing Bills

> Estimated reading: 2 minutes

The Bills dashboard gives you an overview of overdue, open, and draft bills, plus a full list of all bills.

**To access:**
Go to **Purchases → Bills** from the navigation menu.

Bills are sorted by: Date, Status, Vendor, Bill Number, and Amount.

**Quick actions (hover over a bill):**
- **Edit** — update bill details
- **Duplicate** — create a copy of the bill
- **Add Payment** — record a payment against the bill

**More options (click the three dots ⋯):**
- Print
- Download PDF
- Cancel
- Delete

**Bulk actions (check one or more bills):**
Select bills using their checkboxes to reveal bulk options above the list:
- Mark as Received
- Cancel
- Delete
- Export

---

### Editing a Bill

1. Click the bill from the Bills dashboard to open its detail page.
2. Click **Edit** in the top-right corner.
3. Update the necessary fields and click **Save**.

From the bill detail page, the **⋯ menu** also gives access to: Duplicate, Print, Download PDF, Cancel, and Delete.

> You can also scan paper invoices and bills using **Receipts**.

---

### Changing the Status of a Bill

Bills are created with **Draft** status by default. You can change the status to:

| Status | How to set it |
|--------|--------------|
| **Received** | Click **Mark as Received** from the bill's detail page |
| **Partial** | Automatically set when a partial payment is recorded |
| **Paid** | Automatically set when the full payment is recorded |

---

### Set Default Bill Tab

1. Go to **Purchases → Bills**.
2. On the Bills list page, click the **Pin icon** on the tab you want as default.
3. That tab will now load by default each time you visit the Bills page.

---

### Purchase Orders (PO Workflow)
Full PO lifecycle: **Draft → Approved → Received → Billed**

1. **Create PO** (`/purchase-orders`) — requires `purchase_orders:write`
   - Select vendor, add items with quantities and prices
   - Set expected delivery date
2. **Approve PO** — requires `purchase_orders:approve`
   - Reviewer checks and approves the PO
   - PO is sent to vendor (email or print)
3. **Receive Goods** — mark items as received (partial or full)
   - Creates a Goods Receipt Note (GRN)
   - Updates inventory if items are tracked
4. **Convert to Bill** — click **Create Bill from PO**
   - Bill is pre-filled from PO line items
   - Three-way match: PO ↔ GRN ↔ Bill

### Expense Claims & Reimbursements

> Navigate to **My Workspace → Expenses** (`/expenses`) — requires `expenses:read`.

Employees submit expense claims for out-of-pocket spending. ovds or HR reviews and approves them before reimbursement is processed.

**Submitting an Expense Claim:**
1. Go to **My Workspace → Expenses** → click **New Expense**.
2. Fill in the required fields:

| Field | Required | Notes |
|-------|----------|-------|
| Amount | ✅ | Actual amount spent (ETB or foreign currency) |
| Category | ✅ | Maps to a GL expense account (e.g., Transport, Meals, Office Supplies) |
| Date | ✅ | Date the expense was incurred |
| Description | ✅ | Brief note on what the expense was for |
| Receipt | Recommended | Photo or scanned copy — required for amounts above policy threshold |
| Project | Optional | Link the expense to a billable project |
| Notes | Optional | Additional context for the approver |

3. Click **Submit** — the claim moves to **Pending Approval** status.

**Approval Workflow:**
1. HR or ovds receives a notification of the pending claim.
2. Reviewer opens **Expenses → Pending** and clicks the claim to review.
3. Options: **Approve**, **Reject** (with comment), or **Request More Info**.
4. Approved claims move to **Approved** status and queue for payment.

**Multi-level approval:** For larger amounts, configure a two-step flow — HR approves first (`expenses:approve`), then ovds confirms payment (`ovds:approve`).

**Paying an Approved Claim:**

| Method | When to use |
|--------|------------|
| Add to next payroll run | Standard monthly reimbursement — most common |
| Fund Transfer (immediate) | Urgent or large amounts paid directly to employee's bank account |

**Expense Categories (common):**
| Category | GL Account | Notes |
|----------|-----------|-------|
| Transport / Travel | 6300 Travel & Transport | Fuel, taxi, airfare |
| Accommodation | 6310 Accommodation | Hotel stays for business travel |
| Meals & Entertainment | 6320 Meals | Business meals — receipts required |
| Office Supplies | 6400 Office Expenses | Stationery, printer ink, etc. |
| Communication | 6410 Telephone & Internet | Mobile top-up, internet data |
| Per-Diem Allowance | 6300 Travel & Transport | Daily rate per location tier |
| Medical (work-related) | 6500 Medical | Occupational health expenses |

> Per-diem rates are configured per location tier in **HR → Payroll Administration → Per-Diem Tiers**. Claims at or below the configured rate are auto-approved; claims above it require manual review.

**Bulk Approval:**
1. Go to **Expenses → Pending**.
2. Use checkboxes to select multiple claims.
3. Click **Approve Selected** — all selected claims move to Approved in one step.

**RBAC requirements:**

| Action | Permission |
|--------|-----------|
| Submit own expense | `expenses:write` (all employees via My Workspace) |
| View all expenses | `expenses:read` (HR / ovds) |
| Approve expenses | `expenses:approve` (HR / ovds) |
| Pay via fund transfer | `fund_transfers:write` (ovds) |

> **Related:** [HR → Payroll Administration → Per-Diem Tiers](../08-advanced/README.md#employee-benefits--per-diem) · [Banking → Fund Transfers](../05-banking/README.md#5-fund-transfers-between-accounts)

---

### HR Recruitment Workflows

HR departments process two main types of recruitment and reimbursement workflows. Clear, transparent agreements must be established upfront to manage fees, refunds, and applicant reimbursements efficiently.

#### 1. Corporate Agency invoice

When recruitment is outsourced to a staffing or placement agency, the agency issues an invoice to the company upon successful placement. HR must process this as a vendor bill and track it against the signed agency agreement.

**Workflow:**

1. HR signs a **Recruitment Agency Agreement** — document the fee structure (fixed fee, percentage of annual salary, or retainer) and refund/replacement guarantee terms
2. Agency sources and presents candidates — no invoice is raised until placement is confirmed
3. Once a candidate accepts the offer and starts, the agency issues a **placement invoice**
4. HR raises the invoice under **Purchases → Bills** — select the agency as vendor
5. Use expense category `6012 Recruitment & HR Expenses` — sub-type: *Agency Placement Fee*
6. If a WHT obligation applies (agency TIN + amount ≥ ETB 500), the system auto-calculates WHT (2%) — deducted from payment
7. ovds approves and schedules payment via the standard Bill Payment workflow
8. If the placed candidate leaves within the **guarantee period** (commonly 30–90 days), raise a **Debit Note** against the agency for a refund or replacement credit

**Agency Fee Fields to Record:**

| Field | Notes |
|-------|-------|
| Vendor | Recruitment agency (must have TIN on file) |
| Invoice Ref | Agency's invoice number |
| Placement Date | Date candidate started work |
| Guarantee Period | Days within which a refund/replacement applies |
| Fee Type | Fixed / % of salary / Retainer |
| WHT Applied | Auto-calculated if applicable |
| Linked Employee | Reference to the `Employee` record created for the hire |

**Refund / Replacement Debit Note:**
- Navigate to **Purchases → Debit Notes** → link to the original agency bill
- Enter refund amount and reason (e.g., *candidate resigned within 60-day guarantee*)
- The debit note reduces net payable to the agency or triggers a cash refund
- Post the refund credit back to `6012 Recruitment & HR Expenses`

---

#### 2. Worker / Candidate Cost Recovery

HR may advance or incur costs on behalf of candidates or workers during the recruitment process — such as travel, accommodation, assessment fees, or pre-employment medicals. Where an agreement exists to recover these costs, they must be tracked and invoiced or deducted systematically.

**Common Recovery Scenarios:**

| Cost Type | Recovery Method | Notes |
|-----------|----------------|-------|
| Interview travel (airfare, hotel) | Reimbursed to candidate or deducted from first salary | Require receipts; set a policy cap per tier |
| Relocation assistance | Advance deducted over agreed months | Create a `Staff Advance` record; deduct via payroll |
| Pre-employment medical exam | Company-paid; recovered if candidate declines offer | Include recovery clause in offer letter |
| Skills assessment / certification fee | Company-paid; recovered if no-show or immediate resignation | Service bond clause recommended |
| Work permit / visa fees (expatriates) | Company-paid; may be partially recovered on early exit | IAS 21 applies if USD-denominated |

**Workflow — Advancing and Recovering Candidate Costs:**

1. HR documents the cost agreement in the **offer letter** or a separate **cost recovery letter** signed by the candidate
2. ovds advances the cost via **Fund Transfer** or direct payment to the service provider
3. Record the advance under `1030 Staff Advance — Recruitment` in the GL
4. Once the candidate joins, link the advance to their **Employee** record
5. Set up a **payroll deduction** (fixed monthly amount) to recover the balance:
   - Go to **HR → Payroll → Other Deductions** → add a deduction of type *Advance Recovery*
   - System deducts from net salary each month until the advance is cleared
6. If the candidate does **not** join or resigns before the recovery period ends:
   - Raise a **Receivable** (`1020 Other Receivables`) against the candidate
   - Issue a formal **demand letter** and track in the AR aging report
   - If unrecoverable, write off against `6012 Recruitment & HR Expenses` with manager approval

**Reimbursing Candidates for Agreed Interview Costs:**

Where the company agrees to cover a candidate's travel or accommodation for interviews:
1. Candidate submits receipts via HR (or email upload)
2. HR creates an **Expense Claim** on behalf of the candidate (`/expenses` — HR role)
3. ovds approves and pays via **Fund Transfer** to candidate's bank account
4. Post to `6012 Recruitment & HR Expenses — Interview Reimbursement`
5. If the candidate later joins as an employee, the reimbursement is already expensed — no further action
6. If the candidate declines and a recovery clause applies, follow the receivable workflow above

**RBAC Requirements:**

| Action | Required Permission |
|--------|-------------------|
| Create agency bill | `bills:write` (ACCOUNTING / ovds) |
| Approve agency payment | `bills:write` + `ovds:approve` (ovds) |
| Issue debit note to agency | `bills:write` (ACCOUNTING / ovds) |
| Create staff advance | `expenses:write` (HR / ovds) |
| Approve advance recovery deduction | `payroll:admin` (HR) |
| Write off unrecovered advance | `ovds:write` + `ovds:approve` (ovds) |

### WHT Certificates (`/tax/wht-certificates`)

Navigate to **Purchases → WHT Certificates** — requires `vat:write`.

Generated monthly for every vendor from whom WHT was deducted:
1. Go to **Tax → WHT Certificates → Generate [Month]**
2. OVDS creates one certificate per vendor showing total payments and WHT withheld
3. Email certificates to vendors — they use them to claim WHT credit on their own tax return
4. Keep a copy in the Audit Trail for ERCA verification

### Scanned Receipts (`/scanned-bills`)

Navigate to **Purchases → Scanned Receipts** — requires `bills:read`.

Upload physical receipts and OVDS extracts the data automatically using OCR (OpenAI or Gemini):
1. Click **Upload Receipt** — drag and drop a photo or PDF
2. OVDS reads: vendor name, date, amount, VAT
3. Review and confirm the extracted values
4. The receipt is converted to a bill and posted to the GL
5. The original image is stored and linked to the bill for audit purposes

**Setup:** Requires `OPENAI_API_KEY` or `GEMINI_API_KEY` in `.env`.

### Debit Notes (`/debit-notes`)

Navigate to **Purchases → Debit Notes** — requires `bills:read`.

Issued when you need to formally notify a vendor of an increase in what they owe you (e.g., short delivery, quality deduction):
1. Click **New Debit Note** → select the original bill
2. Enter the amount and reason
3. The debit note reduces the net payable to the vendor
4. Applied against the next vendor payment

### Goods Received Notes — GRN (`/grn`)

Navigate to **Purchases → Goods Received Notes** — requires `bills:read`.

GRNs record the physical receipt of goods against a Purchase Order:

| Step | Action |
|---|---|
| 1 | PO is approved and sent to vendor |
| 2 | Goods arrive — click **Receive** on the PO |
| 3 | Enter quantities actually received (may differ from ordered) |
| 4 | GRN is created and inventory is updated |
| 5 | Click **Create Bill from GRN** — bill is pre-filled from received quantities |

**Three-way match:** PO ↔ GRN ↔ Bill — all three must agree before payment is approved. OVDS flags discrepancies automatically.

### Vendor Fields Reference

| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | Legal business name |
| TIN | Recommended | Required for WHT calculation |
| Email | Recommended | For PO and bill delivery |
| Bank Name | Recommended | For payment batch export |
| Account Number | Recommended | For payment batch export |
| Payment Terms | Optional | Default: Net 30 |
| WHT Exempt | Optional | Mark if vendor is WHT-exempt |

---

## 3. Unified Payments

> **Related:** [Banking → Digital Payments](../05-banking/README.md#8-telebirr--chapa--digital-payments) · [Settings → Payment Gateways](../03-settings/README.md#6-currencies--banking-setup)

### Payment Methods Supported
| Method | Field | Notes |
|--------|-------|-------|
| Cash | — | Direct cash payment |
| Bank Transfer | `bankName`, `bankRef` | CBE, Awash, Dashen, Abyssinia, etc. |
| Telebirr | `telecomRef` | Ethio Telecom mobile money |
| Mobile Banking | — | Any mobile banking app |
| Cheque | `chequeNumber` | Physical cheque |

### Payment Gateway Setup

#### Telebirr
1. Go to **App Store** → install **Telebirr Gateway**.
2. Navigate to **Settings → Digital Wallets** (`/settings/digital-wallets`).
3. Enter your **Telebirr Business ID** and **API Key** (from the Telebirr Business Portal).
4. Set the webhook URL: `https://your-domain.com/api/webhooks/telebirr`.
5. Test with a sandbox transaction before going live.

Once live, incoming Telebirr payments are auto-matched to open invoices. Unmatched deposits are flagged for manual review.

#### Chapa
1. Go to **App Store** → install **Chapa Gateway**.
2. Navigate to **Settings → Payment Gateways → Chapa** (`/settings/payment-gateways/chapa`).
3. Enter your **Public Key** and **Secret Key** from the [Chapa Dashboard](https://dashboard.chapa.co).
4. Set the webhook URL: `https://your-domain.com/api/webhooks/chapa`.
5. Enable **Auto-post receipts** to automatically mark invoices as paid on a successful charge.

#### CBE Pay
1. Go to **App Store** → install **CBE Pay**.
2. Navigate to **Settings → Payment Gateways → CBE Pay**.
3. Enter your CBE merchant credentials (Business Account Number and API key from CBE Business Banking).
4. Set the webhook URL: `https://your-domain.com/api/webhooks/cbepay`.
5. Test with a small transaction in the sandbox environment.

#### Stripe (International Payments)
1. Go to **App Store** → install **Stripe**.
2. Navigate to **Settings → Payment Gateways → Stripe**.
3. Enter your **Publishable Key** and **Secret Key** from the [Stripe Dashboard](https://dashboard.stripe.com).
4. Configure the webhook endpoint in Stripe: `https://your-domain.com/api/webhooks/stripe`.
5. Set the **webhook signing secret** in OVDS to verify incoming events.

> Stripe is suited for USD/EUR invoices to international clients. For domestic ETB payments, Telebirr and Chapa are recommended.

---

### End-to-End Customer Payment Flow

When a payment gateway is active, customers see a **Pay Now** button on every invoice email:

1. Customer receives the invoice email with a **Pay Now** link.
2. Customer clicks the link → opens the Client Portal or a hosted payment page.
3. Customer selects their payment method (Telebirr, Chapa, CBE Pay, Card).
4. Payment is processed by the gateway.
5. Gateway sends a webhook to OVDS confirming the payment.
6. OVDS automatically:
   - Records the payment against the invoice
   - Updates invoice status to **Paid** (or **Partial**)
   - Sends a payment confirmation email to the customer
   - Posts the receipt to the GL

> If the webhook fails, you can manually record the payment via **Invoice → Add Payment** using the gateway's transaction reference.

---

### Refunds & Credit Notes
Navigate to **Sales → Refunds** (`/refunds`) — requires `invoices:write`.

**Full Refund:**
1. Open the paid invoice → click **Issue Refund**
2. Select refund method (same as original payment or different)
3. A Credit Note is created and linked to the original invoice
4. GL entries are reversed automatically

**Partial Refund:**
1. Open the paid invoice → click **Issue Refund**
2. Enter the partial amount to refund
3. Credit Note is created for the partial amount
4. Original invoice shows remaining balance

**Credit Note Application:**
- Apply a credit note to a future invoice for the same customer
- Or issue a cash refund directly

### Partial Payments Workflow
When a customer pays in installments:
1. Invoice shows **Balance Due** after each partial payment
2. Payment history tab shows all payments with dates and methods
3. Automated reminders sent when balance is overdue (configurable)
4. AR Aging report tracks all outstanding balances

### Payment Gateways
| Gateway | Integration | Setup |
|---------|-------------|-------|
| Telebirr | Direct API | App Store → Telebirr Gateway |
| CBE Pay | Direct API | App Store → CBE Pay |
| Bank Transfer | Manual reference | No setup required |
| Stripe (international) | Webhook | App Store → Stripe |

### Payment Tracker
Navigate to **ovds → Payment Tracker** (`/payment-tracker`).

Consolidated view of:
- All outstanding invoices (AR)
- All unpaid bills (AP)
- Overdue items with days overdue
- Expected cash inflows and outflows
- Collections workflow for overdue AR

---

## 4. Items & Products Catalog

Navigate to **Items** (`/items`) — requires `items:read`.

> **Related:** [IAS 2 Stock Valuation → Reports](../07-reports/README.md#ias-2-stock-valuation-inventoryvaluation) · [Import Center](#import-center-import-center)

### Item Types
| Type | Description | Inventory Tracked |
|------|-------------|-------------------|
| Product | Physical goods | Optional (FIFO/WA) |
| Service | Billable services | No |
| Bundle | Group of items sold together | Based on components |

### Item Fields
| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | Display name on invoices |
| Unit Price | ✅ | Default selling price |
| Cost Price | Optional | For margin calculation and COGS |
| SKU | Optional | Stock keeping unit |
| Category | Optional | For reporting grouping |
| VAT Rate | ✅ | 15%, 0%, or Exempt |
| Track Inventory | Optional | Enables stock management |
| Reorder Level | Optional | Triggers low-stock alert email |

### Bundles

A Bundle groups multiple items that are sold together as a single unit (e.g., *Starter Kit = Product A + Product B + Installation Service*).

**Creating a Bundle:**
1. Go to **Items** → click **New Item** → select type **Bundle**.
2. Enter the bundle name, price, and VAT rate.
3. Under **Bundle Components**, click **Add Item** and select each component with its quantity.
4. Set the bundle price — this can be fixed or calculated from the sum of component prices.
5. Click **Save**.

When the bundle is added to an invoice, each component is listed as a sub-line item and stock is deducted per component if inventory tracking is enabled.

### Inventory Costing Methods

Select the costing method per item category in **Settings → Inventory Costing**:

| Method | Description | IFRS Compliance |
|--------|-------------|----------------|
| FIFO (First In, First Out) | Oldest stock cost is used first | ✅ IAS 2 |
| Weighted Average (WA) | Average cost of all units on hand | ✅ IAS 2 |
| LIFO | Last In, First Out | ❌ Prohibited under IAS 2 |

> Set the costing method **before** recording any stock movements. Changing it after transactions have been posted requires a full inventory revaluation.

### Item Categories

Categories group items for reporting and GL mapping.

1. Go to **Items → Categories** → click **New Category**.
2. Enter a name (e.g., *Raw Materials*, *Finished Goods*, *Services*).
3. Assign a **GL Revenue Account** (used when the item is invoiced) and optionally a **GL Cost Account** (used when the item is purchased).
4. All items in the category inherit these GL mappings unless overridden at item level.

### Reorder Alerts

1. Open an item → set the **Reorder Level** (minimum quantity before an alert fires).
2. When stock on hand falls to or below the reorder level, OVDS sends an in-app notification and email to the assigned inventory manager.
3. Navigate to **Inventory → Low Stock** to see all items below their reorder threshold.

### Bulk Import
Use **Import Center** (`/import-center`) → Items to import from CSV. Download the items CSV template for the correct column format: Name, SKU, Unit Price, Cost Price, VAT Rate, Category, Track Inventory, Reorder Level.

### IAS 2 Stock Valuation
For the Analysis phase review of inventory value before MoR filing, see **Analysis → Inventory & Assets → IAS 2 Stock Valuation** (`/inventory/valuation`). This view shows closing stock at cost vs NRV and flags any required write-downs per IAS 2 §9.

---

## 5. Data Import / Export

> **Related:** [Getting Started → Import order](../01-getting-started/INSTALL.md) · [Reports → Scheduled Exports](../07-reports/README.md#navigation-flow)

### Opening Balances (`/accounting/opening-balances`)

Before importing transactional data, set your opening balances for the date you start using OVDS:

1. Go to **Accounting → Opening Balances** (`/accounting/opening-balances`) — requires `ovds:write`.
2. For each GL account, enter the balance on your cutover date.
3. Common accounts to set: Cash/Bank accounts, Accounts Receivable (per customer), Accounts Payable (per vendor), Inventory, Fixed Assets (cost + accumulated depreciation), Loans, and Equity.
4. The system posts a single opening balance journal entry dated to your cutover date.
5. Click **Confirm Opening Balances** — once confirmed, the balances are locked.

> Run the **Trial Balance** report immediately after confirming to verify total debits = total credits. Any imbalance indicates a missing account entry.

### Import Center (`/import-center`)
Unified CSV import for all data types. Recommended import order for new companies:

```
1. Chart of Accounts  →  2. Customers  →  3. Vendors  →  4. Items  →  5. Employees
```

Each import module provides:
- **CSV Template** — download with correct column headers and sample data
- **Preview** — see first 5 rows before importing
- **Validation** — errors reported per row with field-level messages
- **Result Summary** — succeeded/failed counts after import

### Export Options
| Report | Format | Location |
|--------|--------|----------|
| Invoice list | CSV, PDF | Invoices → Export |
| Bill list | CSV | Bills → Export |
| Customer list | CSV | Customers → Export |
| Vendor list | CSV | Vendors → Export |
| Items catalog | CSV | Items → Export |
| General Ledger | CSV, PDF | Reports → Financial |

### Scheduled Exports
Configure automatic exports on a schedule:
1. Go to **Reports → Builder** → **Scheduled Exports**
2. Select report type, format, and frequency
3. Enter recipient email addresses
4. Reports are emailed automatically

---

## 6. Fixed Assets

Navigate to **ovds → Fixed Assets** (`/fixed-assets`) — requires `fixed_assets:read`.

> **Related:** [IAS 16 depreciation schedules → Reports](../07-reports/README.md#fixed-asset-register-fixed-assets) · [IFRS compliance → Tax & Compliance](../06-tax-compliance/README.md#4-ifrs-compliance)

### Adding a Fixed Asset

1. Go to **ovds → Fixed Assets** → click **New Asset**.
2. Fill in the asset details:

| Field | Required | Notes |
|-------|----------|-------|
| Asset Name | ✅ | Descriptive name (e.g., *Toyota Hilux 2024*) |
| Category | ✅ | Vehicles, Machinery, Buildings, IT Equipment, Furniture, etc. |
| Purchase Date | ✅ | Date the asset was acquired |
| Purchase Cost | ✅ | Total cost including installation/freight |
| Residual Value | Optional | Estimated value at end of useful life (default: 0) |
| Useful Life (years) | ✅ | Expected years of productive use |
| Depreciation Method | ✅ | Straight-Line (SLM) or Declining Balance (DB) |
| GL Asset Account | ✅ | Non-current asset account (e.g., 1500 PP&E) |
| GL Depreciation Account | ✅ | Accumulated depreciation contra-account |
| GL Expense Account | ✅ | Depreciation expense account |

3. Click **Save** — the system generates a depreciation schedule automatically.

---

### Depreciation Methods

**Straight-Line (SLM) — IAS 16 most common:**
```
Annual Depreciation = (Cost − Residual Value) ÷ Useful Life

Example:
  Cost           = ETB 500,000
  Residual Value = ETB 50,000
  Useful Life    = 5 years
  Annual Dep.    = (500,000 − 50,000) ÷ 5 = ETB 90,000/year
  Monthly Dep.   = 90,000 ÷ 12 = ETB 7,500/month
```

**Declining Balance (DB) — ERCA pool method:**
```
Annual Depreciation = Net Book Value × Rate

ERCA pool rates (Proclamation 1395/2025):
  Buildings & structures  →  5%
  Machinery & equipment   →  20%
  Motor vehicles          →  20%
  Computers & IT          →  25%
  Furniture & fittings    →  10%
```

> **IFRS vs ERCA:** IFRS (IAS 16) uses the asset's economic useful life for depreciation. ERCA mandates fixed pool rates for tax purposes. These often differ, creating a temporary timing difference. The resulting deferred tax liability is calculated per **IAS 12** and posted automatically if IFRS mode is enabled. See [Tax & Compliance → IFRS](../06-tax-compliance/README.md#4-ifrs-compliance).

---

### Running Monthly Depreciation

1. Go to **ovds → Fixed Assets**.
2. Click **Run Depreciation** → select the period (month/year).
3. OVDS calculates depreciation for all active assets and previews the journal entries.
4. Review — confirm amounts are correct.
5. Click **Post** — journal entries are created:
   - **Debit:** Depreciation Expense (P&L)
   - **Credit:** Accumulated Depreciation (Balance Sheet contra-account)
6. The asset's Net Book Value updates automatically.

> Depreciation can be run monthly or annually. For IFRS compliance, monthly posting is recommended.

---

### Viewing the Depreciation Schedule

1. Click any asset to open its detail page.
2. Click **Depreciation Schedule** — a modal shows the year-by-year breakdown:

| Year | Opening NBV | Depreciation | Closing NBV |
|------|------------|-------------|------------|
| 1 | ETB 500,000 | ETB 90,000 | ETB 410,000 |
| 2 | ETB 410,000 | ETB 90,000 | ETB 320,000 |
| … | … | … | … |
| 5 | ETB 140,000 | ETB 90,000 | ETB 50,000 |

3. Export as PDF for the external auditor or for the BIT return.

---

### Asset Disposals and Write-Offs

**Full Disposal (sale or retirement):**
1. Open the asset → click **Dispose Asset**.
2. Enter: Disposal Date, Disposal Proceeds (0 if scrapped), and reason.
3. OVDS calculates the gain or loss:
   ```
   Gain/(Loss) on Disposal = Proceeds − Net Book Value
   ```
4. Journal entries are posted automatically:
   - Remove cost from the asset account
   - Remove accumulated depreciation
   - Record proceeds (if any) as income
   - Post gain or loss to the GL
5. The asset is marked **Disposed** and removed from future depreciation runs.

**Partial Write-Down (IAS 36 Impairment):**
1. Open the asset → click **Impairment Review**.
2. Enter the recoverable amount (higher of fair value less costs to sell, and value in use).
3. If recoverable amount < Net Book Value, OVDS posts the impairment loss:
   - **Debit:** Impairment Loss (P&L)
   - **Credit:** Accumulated Impairment (Balance Sheet)
4. Future depreciation is recalculated on the post-impairment NBV.

---

### Fixed Asset Register

Navigate to **Reports → Fixed Asset Register** — see [Reports → Fixed Asset Register](../07-reports/README.md#fixed-asset-register-fixed-assets).

The register shows all assets with:
- Asset name, category, and acquisition date
- Cost, accumulated depreciation, and current Net Book Value
- Depreciation method and remaining useful life
- Disposal status

Export the register as a supporting schedule for the annual **BIT return** and statutory audit.

---

## 7. Navigation Flow

> Quick-reference route tree for all Financial Operations screens. Routes marked `(invoices:read)` etc. require the corresponding RBAC permission — see [Users & Roles](../02-users-roles/README.md) for the full permission matrix.

```
Phase 2 · Daily Operations
│
├── Sales
│   ├── Invoices              /sales/invoices                (invoices:read)
│   │     New, edit, send, record payment, share link
│   ├── Estimates             /estimates               (invoices:read)
│   │     Create quote → convert to invoice
│   ├── Credit Notes          /credit-notes            (invoices:read)
│   │     Issue refund, apply to future invoice
│   ├── Sales Orders          /sales-orders            (invoices:read)
│   │     Confirmed orders → convert to invoice; SO lifecycle
│   ├── Receipts              /receipts                (invoices:read)
│   │     Point-of-sale receipts; POS sync; ERCA QR auto-generated
│   ├── Proforma Invoices     /sales/proforma          (invoices:read)
│   │     Pre-shipment billing → convert to invoice
│   └── Payment Tracker       /payment-tracker         (invoices:read)
│         Outstanding AR, expected inflows, collections
│
├── Purchases
│   ├── Bills                 /purchases/bills                   (bills:read)
│   │     Vendor invoices, WHT auto-calc, pay bill
│   ├── Purchase Orders       /purchases/orders         (purchase_orders:read)
│   │     Draft → Approve → Receive → Bill (three-way match)
│   ├── Expenses              /purchases/expenses                (expenses:read)
│   │     Employee claims, approval, payroll integration
│   ├── Goods Received Notes  /grn                     (bills:read)
│   │     Receive against PO, update inventory
│   ├── Debit Notes           /debit-notes             (bills:read)
│   │     Vendor billing adjustments
│   ├── Scanned Receipts      /scanned-bills           (bills:read)
│   │     OCR upload → auto-extract → post to GL
│   └── WHT Certificates      /tax/wht-certificates    (vat:write)
│         Monthly WHT certificates per vendor
│
├── Items & Inventory
│   ├── Items Catalog         /items                   (items:read)
│   │     Products, services, bundles; bulk import
│   ├── Stock Movements       /inventory               (inventory:read)
│   ├── IAS 2 Valuation       /inventory/valuation     (inventory:read)
│   │     FIFO/WA cost vs NRV write-down analysis
│   └── Fixed Assets          /fixed-assets            (fixed_assets:read)
│         SLM/DB depreciation, IAS 16, disposals
│
└── ovds (Setup/Admin)
    ├── Import Center         /import-center           (varies by module)
    │     CSV import: CoA → Customers → Vendors → Items → Employees
    └── Period Close          /period-close            (period_close:read)
          Lock period after all filings complete
```

### Invoice Lifecycle — State Machine

```
[New]
  │
  ▼
DRAFT ──────────► SENT ──────────► PARTIAL ──────────► PAID
  │                 │                  │
  │                 ▼                  ▼
  │             OVERDUE            OVERDUE
  │                 │
  └──► (Archive at year-end)
```

### Payment Methods — Quick Reference

| Method | Route / Setting | Notes |
|--------|----------------|-------|
| Cash | Record Payment dialog | No setup required |
| Bank Transfer | Record Payment dialog | Enter `bankName` + `bankRef` |
| Telebirr | Settings → Digital Wallets | Auto-match on incoming payments |
| CBE Pay | App Store → CBE Pay | Direct API |
| Chapa | Settings → Payment Gateways → Chapa | Webhook auto-marks invoices paid |
| Cheque | Record Payment dialog | Enter `chequeNumber` |
| Stripe | App Store → Stripe | International payments |

### Bill Lifecycle — State Machine

```
[New]
  │
  ▼
DRAFT ──────────► RECEIVED ──────────► PARTIAL ──────────► PAID
  │                                        │
  └──────────────────────────────────────► CANCELLED
```

### Purchase Order Lifecycle — State Machine

```
DRAFT ──► APPROVED ──► SENT TO VENDOR ──► PARTIALLY RECEIVED
                                                    │
                              ◄─────────────────────┘
                              FULLY RECEIVED ──► BILLED ──► PAID
```

---

## 8. Cross-Module Links

Quick navigation to related functionality in other documentation sections.

### From Financial Ops → Settings
| Task | Where to go |
|------|------------|
| Upload company logo for invoices | [Settings → Company & Tax](../03-settings/company-and-tax.md) |
| Configure invoice templates & numbering | [Settings → Company & Tax → Invoice Customization](../03-settings/company-and-tax.md#invoice-customization) |
| Set default payment terms | [Settings → Company & Tax → Payment Terms](../03-settings/company-and-tax.md#invoice-customization) |
| Add currencies and FX rates | [Settings → Banking & Payments](../03-settings/banking-and-payments.md#currencies--fx-rates) |
| Set up Telebirr gateway | [Settings → Banking & Payments → Telebirr](../03-settings/banking-and-payments.md#telebirr-digital-wallet) |
| Set up Chapa gateway | [Settings → Banking & Payments → Chapa](../03-settings/banking-and-payments.md#chapa-payment-gateway) |
| Configure SMTP for invoice emails | [Settings → Notifications & API → SMTP](../03-settings/notifications-and-api.md#email--smtp-configuration) |
| Set up automated reminders | [Managing Invoices → Automated Reminders](./managing-invoices.md#automated-payment-reminders) |
| Add users and restrict invoice access | [Users & Roles → RBAC Matrix](../02-users-roles/rbac-matrix.md) |
| Install Custom Fields extension | [Settings → Notifications & API → App Store](../03-settings/notifications-and-api.md#app-store--extensions) |

### From Financial Ops → Banking
| Task | Where to go |
|------|------------|
| Reconcile invoice payments against bank statement | [Banking → Bank Reconciliation](../05-banking/bank-reconciliation.md) |
| Import bank statement (CSV / PDF OCR) | [Banking → Bank Reconciliation → Import](../05-banking/bank-reconciliation.md#step-2--import-the-statement) |
| Record fund transfer between accounts | [Banking → Bank Accounts → Fund Transfers](../05-banking/bank-accounts.md#fund-transfers-between-accounts) |
| View Telebirr / Chapa daily transaction feed | [Banking → Digital Payments](../05-banking/digital-payments.md) |
| Manage petty cash fund | [Banking → Bank Accounts → Petty Cash](../05-banking/bank-accounts.md#petty-cash) |
| View cash flow forecast | [Banking → Treasury & Collections](../05-banking/treasury-collections.md) |
| Manage overdue AR collections | [Banking → Treasury & Collections → Collections](../05-banking/treasury-collections.md#collections--overdue-ar) |

### From Financial Ops → Tax & Compliance
| Task | Where to go |
|------|------------|
| Understand VAT on invoices (15% / 0% / Exempt) | [Tax → VAT & TOT](../06-tax-compliance/vat-and-tot.md) |
| Configure WHT on vendor bills | [Tax → WHT & Other Taxes](../06-tax-compliance/wht-and-other-taxes.md) |
| Generate monthly WHT certificates | [Creating a Bill → WHT Certificates](./creating-a-bill.md#wht-certificates) |
| Check tax liability before month-end | [Reports → Tax Reports → Tax Liability Dashboard](../07-reports/tax-reports.md#tax-liability-dashboard) |
| File VAT return after invoice period closes | [Tax → VAT & TOT → Monthly Filing Workflow](../06-tax-compliance/vat-and-tot.md#monthly-vat-filing-workflow) |
| Lock the period after filing | [Tax → IFRS & Audit → Period Lock](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) |
| Configure compound taxes / DRRF rates | [Settings → Company & Tax → Tax Engine](../03-settings/company-and-tax.md#ethiopian-tax-engine) |

### From Financial Ops → Reports
| Task | Where to go |
|------|------------|
| View AR aging (overdue invoices by age) | [Reports → Financial Reports → AR Aging](../07-reports/financial-reports.md#ar--ap-aging-reports) |
| View AP aging (overdue bills) | [Reports → Financial Reports → AP Aging](../07-reports/financial-reports.md#ar--ap-aging-reports) |
| View income summary by client | [Reports → Financial Reports → P&L](../07-reports/financial-reports.md#profit--loss-income-statement) |
| View Tax Summary (output/input VAT) | [Reports → Tax Reports](../07-reports/tax-reports.md) |
| Export invoice list to CSV/PDF | [Reports → Custom Reports & Scheduling](../07-reports/custom-reports.md) |
| Schedule automatic report delivery | [Reports → Custom Reports → Scheduled Delivery](../07-reports/custom-reports.md#scheduled-report-delivery) |
| Review inventory value (IAS 2) | [Items Catalog → IAS 2 Stock Valuation](./items-catalog.md#ias-2-stock-valuation) |
| Review fixed assets depreciation schedule | [Fixed Assets](./fixed-assets.md) |

---

*Back to top: [Table of Contents](#table-of-contents) · [OVDS Docs Home](../README.md)*



