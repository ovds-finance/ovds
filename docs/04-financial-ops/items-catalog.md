<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Items & Products Catalog

> **Part of:** [Financial Operations](./README.md) › Items & Products
>
> **Requires:** Login · `items:read` · `items:write`
>
> **Related:** [IAS 2 Stock Valuation → Reports](../07-reports/financial-reports.md) · [Data Import / Export](./data-import-export.md)

The Items Catalog is the central library of all products, services, and bundles your business sells or purchases. Every invoice and bill line item is drawn from this catalog, ensuring consistent pricing, VAT rates, and GL mapping across all transactions.

---

## Item Types

| Type | Description | Inventory Tracked |
|------|-------------|-------------------|
| **Product** | Physical goods sold or purchased | Optional (FIFO or Weighted Average) |
| **Service** | Billable services — consulting, labour, subscriptions | No |
| **Bundle** | A group of items sold together as a single unit | Based on component items |

---

## Creating an Item

Navigate to **Items** (`/items`) — requires `items:write`.

1. Click **New Item**.
2. Fill in the item details:

| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | Display name on invoices and bills |
| Type | ✅ | Product, Service, or Bundle |
| Unit Price | ✅ | Default selling price |
| Cost Price | Optional | Used for margin calculation and COGS posting |
| SKU | Optional | Stock keeping unit — useful for inventory tracking |
| Category | Optional | Groups items for reporting and GL mapping |
| VAT Rate | ✅ | 15%, 0%, or Exempt — applied when item appears on invoices |
| Track Inventory | Optional | Enables stock movement tracking for Products |
| Reorder Level | Optional | Triggers a low-stock alert when stock reaches this quantity |
| Description | Optional | Default line item description — appears on invoice PDFs |
| Unit of Measure | Optional | e.g. pcs, kg, hrs, m² |

3. Click **Save**.

---

## Bundles

A Bundle groups multiple items sold together as a single unit — for example, a *Starter Kit* that includes a product, an accessory, and an installation service billed as one line item.

### Creating a Bundle

1. Go to **Items** → click **New Item** → set type to **Bundle**.
2. Enter the bundle name, unit price, and VAT rate.
3. Under **Bundle Components**, click **Add Item** for each component and set the quantity per bundle.
4. Set the bundle price:
   - **Fixed price** — a flat rate regardless of component costs
   - **Sum of components** — price is calculated automatically from component unit prices
5. Click **Save**.

When the bundle is added to an invoice:
- Each component is listed as a sub-line item on the invoice PDF.
- Stock is deducted per component quantity if inventory tracking is enabled on the component items.

---

## Item Categories

Categories group items for reporting and GL mapping. Every item in a category inherits the category's GL accounts unless overridden at item level.

### Creating a Category

1. Go to **Items → Categories** → click **New Category**.
2. Enter a name (e.g. *Raw Materials*, *Finished Goods*, *Services*, *Spare Parts*).
3. Assign:
   - **GL Revenue Account** — posted when the item is invoiced (e.g. 4100 Sales Revenue)
   - **GL Cost Account** — posted when the item is purchased or COGS is recognized (e.g. 5100 Cost of Goods Sold)
4. Click **Save**.

---

## Inventory Costing Methods

Select the costing method per item category in **Settings → Inventory Costing** — requires `settings:write`.

| Method | Description | IFRS Compliance |
|--------|-------------|----------------|
| **FIFO** (First In, First Out) | The cost of the oldest stock is used first when goods are sold | ✅ IAS 2 compliant |
| **Weighted Average (WA)** | The average cost of all units on hand is used | ✅ IAS 2 compliant |
| LIFO (Last In, First Out) | The cost of the newest stock is used first | ❌ Prohibited under IAS 2 |

> Set the costing method **before** recording any stock movements. Changing it after transactions have been posted requires a full inventory revaluation — contact your accountant before making this change.

---

## Reorder Alerts

1. Open an item → set the **Reorder Level** (the minimum quantity on hand before an alert fires).
2. When stock on hand falls to or below this level, OVDS:
   - Sends an in-app notification to the assigned inventory manager
   - Sends an alert email
3. Navigate to **Inventory → Low Stock** to see all items currently below their reorder threshold.

---

## Stock Movements

Navigate to **Items → Stock Movements** (`/inventory`) — requires `inventory:read`.

Every time an item is purchased (via a bill or PO receipt) or sold (via an invoice or sales receipt), OVDS records a stock movement. The stock movements log shows:

| Column | Description |
|--------|-------------|
| Date | When the movement occurred |
| Type | Purchase, Sale, Adjustment, Transfer |
| Reference | Linked invoice, bill, or GRN number |
| Quantity In | Stock received |
| Quantity Out | Stock dispatched or sold |
| Balance | Running stock on hand after the movement |
| Unit Cost | Cost at the time of movement (FIFO or WA) |

### Manual Stock Adjustment

To correct stock levels after a physical count:

1. Go to **Inventory → Stock Movements** → click **New Adjustment**.
2. Select the item, enter the adjusted quantity, and provide a reason.
3. Click **Save** — the adjustment is posted and the stock balance updates immediately.

---

## IAS 2 Stock Valuation

Navigate to **Analysis → Inventory & Assets → IAS 2 Stock Valuation** (`/inventory/valuation`) — requires `inventory:read`.

Before the Ministry of Revenues (MoR) filing period, use this view to:
- See closing stock valued at **cost** vs **Net Realisable Value (NRV)**
- Identify items where NRV < cost — these require a write-down per IAS 2 §9
- Export the valuation schedule as a supporting document for the BIT return and external audit

> Write-downs are posted as: **Debit** Inventory Write-Down Expense · **Credit** Inventory (reducing the asset value on the Balance Sheet).

---

## Bulk Import

Use **Import Center** (`/import-center`) → **Items** to import large catalogs from CSV.

1. Click **Download Template** to get the correct column format.
2. Fill in your data:
   - Name, SKU, Unit Price, Cost Price, VAT Rate, Category, Type, Track Inventory, Reorder Level
3. Upload the completed CSV → Preview the first 5 rows.
4. Click **Import** — the system validates each row and reports errors per line.
5. Review the import summary (succeeded / failed counts) and fix any errors.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Add items to an invoice | [Creating an Invoice → Add Items](./creating-an-invoice.md#step-4--add-items-or-services) |
| Add items to a bill | [Creating a Bill → Add Items](./creating-a-bill.md#step-4--add-items-or-services) |
| Receiving stock via GRN | [Purchase Orders → Receiving Goods](./purchase-orders.md#receiving-goods-creating-a-grn) |
| IAS 2 valuation report | [Reports → Financial Reports](../07-reports/financial-reports.md) |
| Import items from CSV | [Data Import / Export](./data-import-export.md) |
| Configure inventory costing method | [Settings](../03-settings/README.md) |



