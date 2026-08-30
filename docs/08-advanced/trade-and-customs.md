<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Trade & Customs

> **Part of:** [Advanced Modules](./README.md)
>
> **Requires:** Login · `vat:read`
>
> **Navigate to:** **Trade** (`/trade`)

The Trade module covers import/export operations — customs duty calculations, shipment tracking, and the tax obligations that arise at the Ethiopian Customs border for businesses that import goods or export products.

---

## Overview

Ethiopian import/export businesses face a layered set of customs obligations on top of standard domestic taxes. OVDS calculates these automatically when transactions are flagged as import/export and the relevant fields are completed.

```
Import Flow:
  Supplier Invoice (CIF value)
      ↓
  Customs Duty (0–35% of CIF)
      ↓
  Excise Tax (sector-specific %)
      ↓
  Import Surtax (10% of CIF + Duty + Excise)
      ↓
  Advance BIT on Imports (3% of CIF)
      ↓
  VAT at Import (15% of CIF + Duty + Excise + Surtax)
      ↓
  Total Landed Cost
```

---

## Customs Duty

### Rates

Customs duty rates range from **0% to 35%** of the **CIF value** (Cost + Insurance + Freight) depending on the HS tariff code of the goods.

| Goods Category | Typical Rate |
|----------------|-------------|
| Capital machinery (manufacturing) | 0% — exempt under Investment Proc. 1180/2020 |
| Raw materials | 5–10% |
| Semi-finished goods | 10–20% |
| Consumer goods | 20–35% |
| Vehicles | 35% |

**HS Code lookup:** Use the Ethiopia Customs Commission tariff engine at [ecca.gov.et](https://ecca.gov.et) or the Ethiopia Customs Trade Portal to find the exact rate for your commodity.

### Recording a Customs Duty Payment

1. Go to **Purchases → Bills** → click **New Bill**.
2. Select the vendor as **Ethiopian Customs Commission** or your customs clearing agent.
3. Enter the CIF value and select the applicable duty rate.
4. OVDS calculates the duty amount automatically.
5. The customs duty posts to `Customs Duty Expense` or is capitalized into the cost of inventory (per IAS 2 — duties are part of the cost of purchase).

> **IAS 2 note:** Import duties, freight, and insurance paid to bring inventory to its present location and condition are part of the inventory cost — they are not expensed immediately. OVDS adds them to the item's cost price when the bill is converted to a GRN.

---

## Import Surtax

**Rate:** 10% calculated on `(CIF + Customs Duty + Excise Tax)`

Import surtax is levied in addition to customs duty on most imported goods. It is calculated on the combined value of CIF, duty, and excise.

```
Import Surtax = (CIF + Customs Duty + Excise) × 10%
```

OVDS calculates this automatically when a bill is marked as an import transaction.

---

## Advance BIT on Imports (3% CIF)

When importing goods, **3% of the CIF value** is withheld at customs as an advance payment against the company's annual Business Income Tax.

- This is a **prepayment** of BIT — it reduces the final BIT liability at year-end.
- OVDS records it as: `Dr BIT Prepaid (advance) / Cr Cash`
- At year-end BIT computation, the prepaid amount is offset against the BIT liability.

---

## VAT at Import

VAT of **15%** is levied at the point of customs clearance on the total landed value:

```
VAT at Import = (CIF + Customs Duty + Excise + Import Surtax) × 15%
```

This VAT is **claimable as Input VAT** — it reduces your monthly net VAT payable to ERCA, the same as Input VAT on domestic purchases.

- OVDS records it as Input VAT on the import bill.
- It appears in the monthly **VAT Summary Report** as Import Input VAT.

---

## e-SAD (Electronic Single Administrative Document)

Navigate to **Trade → e-SAD** (`/trade`).

The e-SAD is the electronic customs declaration form submitted to the Ethiopian Customs Commission for every import or export consignment.

### For Imports

1. Go to **Trade → New e-SAD**.
2. Enter:
   - HS tariff code and goods description
   - Supplier name and country of origin
   - CIF value (in the invoice currency)
   - Shipping details (vessel/flight, bill of lading, arrival date)
3. OVDS calculates all applicable duties and taxes.
4. Submit via the **Ethiopia Customs Trade Portal** at [ecca.gov.et](https://ecca.gov.et) or via the ECC API (when credentials are configured).
5. The calculated duties are pre-filled into a bill in **Purchases → Bills** for payment.

### For Exports

1. Go to **Trade → New e-SAD → Export**.
2. Enter goods description, HS code, destination country, and FOB value.
3. For zero-rated VAT on exports: confirm the export HS code qualifies for VAT 0% under Proclamation 1341/2024 Schedule 2.
4. Submit the e-SAD and keep the customs export stamp as evidence for Input VAT reclaim.

---

## Shipment Tracking

Navigate to **Trade → Shipments** (`/trade`).

OVDS can track the status of inbound and outbound shipments when API credentials are configured for the relevant carrier:

| Carrier | Integration | Setup |
|---------|------------|-------|
| ESLSE (Ethiopian Shipping & Logistics) | REST API | Set `ESLSE_API_URL` + `ESLSE_API_KEY` in `.env` |
| Ethiopian Airlines Cargo | REST API | Set `EAL_CARGO_API_URL` + `EAL_CARGO_API_KEY` in `.env` |
| DHL / FedEx / UPS | Manual reference | Enter tracking number manually |

When integrated, shipment status updates automatically as the consignment moves through customs and transit.

---

## Tax Summary for Import/Export Transactions

All import taxes (customs duty, surtax, advance BIT, VAT at import) appear in the relevant reports:

| Report | Where to find it |
|--------|-----------------|
| Input VAT at Import | Reports → Sales Tax → VAT Summary → Input VAT |
| Customs Duty Expense | Reports → Financial → P&L → Operating Expenses |
| Advance BIT Prepaid | Reports → Financial → Balance Sheet → Prepaid Taxes |
| Import Surtax | Reports → Financial → P&L → Cost of Goods / Operating Expenses |

---

## Required Environment Variables (Optional Integrations)

| Variable | Description |
|----------|-------------|
| `ESLSE_API_URL` | ESLSE shipment tracking endpoint |
| `ESLSE_API_KEY` | ESLSE API credentials |
| `EAL_CARGO_API_URL` | Ethiopian Airlines Cargo tracking endpoint |
| `EAL_CARGO_API_KEY` | EAL Cargo API credentials |

> These integrations are optional. Without them, shipment tracking is manual (reference number entry only), but all customs duty calculations and tax postings function fully.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| WHT on imports | [Tax & Compliance → WHT & Other Taxes](../06-tax-compliance/wht-and-other-taxes.md) |
| VAT at import (Input VAT) | [Tax & Compliance → VAT & TOT](../06-tax-compliance/vat-and-tot.md) |
| Inventory costing — landed cost (IAS 2) | [Financial Ops → Items Catalog](../04-financial-ops/items-catalog.md#inventory-costing-methods) |
| BIT advance payment at year-end | [Tax & Compliance → BIT & DRRF](../06-tax-compliance/bit-and-drrf.md) |
| Ethiopian Customs Commission | [ecca.gov.et](https://ecca.gov.et) |
| Tax rates for imports | [Frameworks → Ethiopian Regulatory Reference](../10-frameworks/ethiopian-regulatory-reference.md) |


