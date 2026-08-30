<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Order & Dispatch Data Model

> **Part of:** [Financial Operations](./README.md) › Sales Orders → Dispatch → invoice
>
> Design reference for the Sales Orders → Dispatch/Delivery → invoice pipeline.
> Uses a dedicated `credit_note` model (Option B).

---

## 1. Sales Orders

### `sales_order`

| Field | Type | Notes |
|-------|------|-------|
| `id` | String, PK | |
| `orderNumber` | String | Unique per company |
| `customerId` | FK → customer | |
| `customerName` | String | Denormalized |
| `companyId` | String | Tenant isolation |
| `orderDate` | DateTime | |
| `requestedDeliveryDate` | DateTime? | Optional |
| `salesType` | String? | Optional |
| `currencyCode` | String | |
| `currencyRate` | Decimal | |
| `shipToAddressId` | FK → sales_order_ship_to_address | |
| `deliveryAddressText` | String | Freeform fallback |
| `status` | Enum | DRAFT / APPROVED / COMPLETED / CANCELLED |
| `notes` | String? | |
| `createdBy` | String | |
| `createdAt` / `updatedAt` | DateTime | |

### `sales_order_line`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `salesOrderId` | FK | |
| `lineNo` | Int | |
| `itemId` | FK → item (nullable) | Null for non-stock/service lines |
| `itemType` | Enum | PRODUCT / SERVICE / ASSEMBLY |
| `description` | String | |
| `orderedQty` | Decimal | |
| `unitOfMeasure` | String? | |
| `unitWeight` | Decimal? | Optional — for shipping weight calc |
| `unitCubic` | Decimal? | Optional — for volumetric calc |
| `listPrice` | Decimal | Snapshot at order time |
| `salePrice` | Decimal | Negotiated / discounted price |
| `discountType` | String? | PERCENT or FIXED |
| `discountValue` | Decimal? | |
| `taxAmount` | Decimal? | Optional — recalculated on invoice |
| `kitSetRef` / `assemblyRef` | String? | For assembly/kit explosion |

---

## 2. Ship-To / Delivery Addresses

### `sales_order_ship_to_address`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `salesOrderId` | FK | |
| `label` | String | e.g., "Main Warehouse", "Branch Office" |
| `addressLine1` | String | |
| `warehouseLocationId` | FK → warehouse (nullable) | |
| `deliverySalesPersonId` | FK → user/employee (nullable) | |
| `createdAt` / `updatedAt` | DateTime | |

---

## 3. Dispatch / Delivery Dockets

### `dispatch_docket`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `salesOrderId` | FK | |
| `dispatchNumber` | String | Unique per company |
| `dispatchDate` | DateTime | |
| `dispatchFromWarehouseId` | FK → warehouse | |
| `dispatchToShipToAddressId` | FK | |
| `status` | Enum | DRAFT / APPROVED / POSTED / CANCELLED |
| `notes` | String? | |

### `dispatch_docket_line`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `dispatchDocketId` | FK | |
| `lineNo` | Int | |
| `salesOrderLineId` | FK | |
| `itemId` | FK → item (nullable) | |
| `dispatchedQty` | Decimal | |
| `uom` | String | |
| `unitWeight` / `unitCubic` | Decimal? | Optional |
| `orderedQtyAtDispatchTime` | Decimal | Snapshot for variance tracking |
| `varianceQty` | Decimal | orderedQty − dispatchedQty |
| `varianceReason` | String? | |

---

## 4. Qty-Left-to-Invoice Tracking

Embed in `sales_order_line`:

| Field | Type | Notes |
|-------|------|-------|
| `invoicedQty` | Decimal (default 0) | Updated when invoices/credit notes are created |
| `remainingQtyToInvoice` | Computed | `orderedQty − invoicedQty` |

Update `invoicedQty` whenever an invoice or credit note references the order/dispatch line.

---

## 5. Invoice + Credit Note Linkage

The existing `invoice` table is used for customer invoices. Add the following linkage fields to `invoice`:

| New Field | Type | Notes |
|-----------|------|-------|
| `salesOrderId` | FK (nullable) | |
| `dispatchDocketId` | FK (nullable) | |
| `createdFromDispatch` | Boolean | |
| `customerOrderNumber` | String? | Denormalized reference |

### `credit_note`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `creditNoteNumber` | String | Unique per company |
| `originalInvoiceId` | FK → invoice (nullable) | |
| `salesOrderId` | FK → sales_order | |
| `dispatchDocketId` | FK (nullable) | |
| `customerId` / `customerName` | | Denormalized |
| `companyId` | String | Tenant isolation |
| `status` | Enum | PENDING / DRAFT / POSTED / CANCELLED |
| `date` | DateTime | |
| `currencyCode` / `currencyRate` | | |
| `subtotal`, `vatAmount`, `drrfAmount`, `totalAmount` | Decimal | Stored as positive + sign convention |
| `notes` | String? | |
| `createdAt` / `updatedAt` | DateTime | |

### `credit_note_item`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `creditNoteId` | FK | |
| `salesOrderLineId` | FK | |
| `itemId` | FK → item | |
| `quantity` | Decimal | |
| `salePrice`, `discountType`, `discountValue`, `taxAmount` | | Snapshots from original line |

---

## 6. Pricing Engine

### `price_list`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `priceListName` | String | |
| `currencyCode` | String | |
| `companyId` | String | |
| `effectiveStartDate` | DateTime | |
| `effectiveEndDate` | DateTime? | |
| `isActive` | Boolean | |

### `price_list_line`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `priceListId` | FK | |
| `itemId` | FK (nullable) | Null for category-level pricing |
| `itemCategory` | String? | |
| `salesType` | String? | |
| `branchId` | FK (nullable) | |
| `customerId` | FK (nullable) | Customer-specific exception line |
| `customerBranchId` | FK (nullable) | |
| `unitPrice` | Decimal | |
| `validFrom` | DateTime | |
| `validTo` | DateTime? | |

### `discount_matrix`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `companyId` | String | |
| `currencyCode` | String? | Omit if discounts are % |
| `salesType` | String? | Applies-to scope |
| `productSet` / `category` | String? | |
| `minQty` / `maxQty` | Decimal | Quantity break |
| `discountType` | Enum | FIXED / PERCENT |
| `discountValue` | Decimal | |

---

## 7. Assembly / Kit Expansion

### `assembly`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `companyId` | String | |
| `assemblyItemId` | FK → item | The assembled/kit item |

### `assembly_component`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `assemblyId` | FK | |
| `componentItemId` | FK → item | |
| `componentQtyPerAssemblyQty` | Decimal | Component qty required per 1 assembly unit |

**Demand calculation:** On a sales order line for an assembly item, explode component quantities proportionally (`orderedQty × componentQtyPerAssemblyQty`) to derive raw material demand.

---

## 8. Stock Demand Aggregation

### `stock_demand_by_order`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `companyId` | String | |
| `warehouseId` | FK | |
| `itemId` | FK | |
| `sourceType` | Enum | ORDER / ASSEMBLY_COMPONENT |
| `sourceOrderId` | FK → sales_order | |
| `sourceDispatchId` | FK (nullable) | |
| `demandedQty` | Decimal | Total qty demanded |
| `remainingQtyToInvoice` | Decimal | Updated as invoices are posted |
| `createdAt` / `updatedAt` | DateTime | |

> **Alternative:** Compute on-the-fly via SQL aggregates from `sales_order_line` + `dispatch_docket_line`. Cache results for large datasets.

---

## 9. Delivery Performance

### `delivery_performance`

| Field | Type | Notes |
|-------|------|-------|
| `id` | PK | |
| `companyId` | String | |
| `salesOrderId` | FK | |
| `promisedDeliveryDate` | DateTime | From `requestedDeliveryDate` on SO |
| `actualDeliveryDate` | DateTime? | Date of last POSTED dispatch docket |
| `isDeliveredInFull` | Boolean | All lines dispatched at 100% qty |
| `isDeliveredOnTime` | Boolean | `actualDeliveryDate <= promisedDeliveryDate` |
| `createdAt` | DateTime | |




