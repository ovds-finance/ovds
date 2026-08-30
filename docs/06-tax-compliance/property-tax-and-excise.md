<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Property Tax, Excise Tax & TASS

> **Part of:** [Tax & Compliance](./README.md)
>
> **Requires:** Login · `vat:read`

This guide covers three additional compliance areas: Property Tax (annual municipal obligation), Excise Tax (sector-specific levies on goods), and TASS — the MoR device verification portal used for fiscal printer registration.

---

## Property Tax

Navigate to **Tax → Property Tax** (`/tax/property-tax`) — requires `vat:read`.

### Overview

Property tax is levied by the relevant municipality (Addis Ababa City Administration or regional city governments) on **business premises owned or used by a company**.

| Parameter | Value |
|-----------|-------|
| Rate | 1% of assessed property value per year |
| Assessment | Carried out by the municipal authority |
| Filing | Annual — deadline varies by municipality |
| Portal | Municipal Revenue Office (not MoR eTax) |

### Recording Property Tax in OVDS

Property tax is not filed through the MoR eTax portal — it is paid directly to the municipal revenue office. Record it in OVDS for accounting accuracy:

1. Go to **Tax → Property Tax**.
2. Enter the **assessed value** of your business premises.
3. OVDS calculates the annual tax: `Property Value × 1%`.
4. When you pay at the municipal office, return to OVDS → click **Record Payment**.
5. Enter the receipt reference and payment date.
6. GL entry posted automatically:
   ```
   Dr  Property Tax Expense (6xxx)
       Cr  Cash / Bank
   ```

### IAS 12 Treatment

Property tax is **NOT an income tax** under IAS 12 — it is an operating expense. It is not included in the BIT computation and does not create deferred tax.

---

## Excise Tax

Navigate to **Tax → Excise Tax** (`/tax/excise-tax`) — requires `vat:read`.

### Overview

Excise tax is levied on specific categories of goods — particularly luxury goods, tobacco, alcohol, vehicles, and similar items. Rates are set per HS tariff code.

**Common excise-liable goods:**

| Category | Rate (approximate) |
|----------|:-----------------:|
| Alcoholic beverages | 50–100% |
| Tobacco products | 75–150% |
| Fuel and petroleum products | Fixed rate per litre |
| Motor vehicles (imported) | 30–100% of CIF |
| Sugar | Variable |
| Soft drinks and juices | 30% |
| Perfumes and cosmetics | 30% |

> Exact rates are published in the Excise Tax Proclamation schedule. Use the [ECC Customs Tariff Engine](https://ecca.gov.et) to confirm the rate for your specific HS code.

### How Excise Tax Is Applied

Excise tax is applied **before VAT** on the import or domestic manufacture of excisable goods:

```
For imports:
  Excise = CIF Value × Excise Rate
  VAT    = (CIF + Customs Duty + Excise + Import Surtax) × 15%

For domestic manufacturers:
  Excise = Ex-factory price × Excise Rate
  VAT    = (Ex-factory price + Excise) × 15%
```

### Recording Excise Tax in OVDS

1. Go to **Tax → Excise Tax** → click **New Declaration**.
2. Select the period, goods category, and total production or import value.
3. OVDS calculates the excise liability.
4. File on the eTax portal and record the payment reference in OVDS.

### Custom Excise Rates

Sector-specific excise rates beyond the standard schedule can be added under **Settings → Tax Rates → Custom Rates**.

---

## TASS — MoR Device Verification Portal

Navigate to **Tax → V&V / TASS** (`/vandv`) — requires `vat:read`.

### What Is TASS?

**TASS (Tax Administration Support System)** is the MoR digital portal used for:
- Registering fiscal devices (printers, POS terminals)
- Verifying device approval status
- Cross-referencing with OVDS IoT device registry

All MoR-approved fiscal devices must be registered in both OVDS and TASS before they can be used to generate ERCA-compliant receipts.

### TASS Registration Workflow

1. Purchase a **MoR-approved fiscal printer or POS terminal** (devices must carry ERCA certification).
2. Register the device in OVDS:
   - Go to **IoT → Device Registry → New Device**
   - Enter the device serial number and MoR Approval Number
3. Register the same device in TASS:
   - Log in to [tass.erca.gov.et](https://tass.erca.gov.et) with your company TIN
   - Navigate to **Device Registration**
   - Enter the device serial number and OVDS confirmation reference
4. TASS issues a **TASS Registration Number** — enter this in the OVDS device record.
5. The device is now active and cross-referenced between OVDS and TASS.

### TASS Portal Features

| Feature | Description |
|---------|-------------|
| Device Verification | Confirm a device is ERCA-approved before purchase |
| Device Status | Check if your registered device is active or suspended |
| Fiscal Memory | Monitor fiscal memory usage — schedule maintenance when near capacity |
| Tamper Alerts | View any tamper events reported by MoR |
| Firmware Compliance | Verify devices are running MoR-mandated firmware versions |

### V&V Compliance Checks

The OVDS V&V page (`/vandv`) shows a dashboard of compliance status across:

| Check | What Is Verified |
|-------|----------------|
| All fiscal devices registered in TASS | Device registry cross-reference |
| All devices running approved firmware | OTA update compliance |
| ERCA QR codes on issued invoices | Invoice PDF integrity |
| WHT certificates generated monthly | Vendor WHT compliance |
| VAT return filed | Current month filing status |

A device showing as non-compliant in this dashboard requires immediate attention — ERCA audits can flag unregistered or non-compliant devices.

---

## Period Close Workflow

Navigate to **Accounting → Period Workflow** (`/accounting-workflow`) — requires `ovds:read`.

### End-of-Period Checklist

The Period Workflow page provides a guided checklist to ensure all period-end tasks are completed before locking the accounting period.

| Step | Task | Status Indicator |
|------|------|:---------------:|
| 1 | Bank reconciliation completed | ✅ / ❌ |
| 2 | All invoices sent for the period | ✅ / ❌ |
| 3 | All bills recorded and reviewed | ✅ / ❌ |
| 4 | Monthly depreciation run | ✅ / ❌ |
| 5 | Accruals and prepayments posted | ✅ / ❌ |
| 6 | Payroll approved and GL posted | ✅ / ❌ |
| 7 | VAT computed and filed | ✅ / ❌ |
| 8 | WHT remitted | ✅ / ❌ |
| 9 | Trial balance checks pass (debits = credits) | ✅ / ❌ |
| 10 | IFRS 9 ECL provision posted | ✅ / ❌ |
| 11 | All items green → Lock Period | — |

Each item links directly to the relevant OVDS page so you can complete outstanding tasks without leaving the checklist.

Once all items are green, the **Lock Period** button becomes active. See [Tax & Compliance → IFRS & Audit → Compliance Sign-Off](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) for the full lock workflow.

---

## Related Topics

> **Lifecycle context:** TASS/V&V checks map to [Phase 4 — V&V Pre-Submission](./../FILING-LIFECYCLE.md#5-phase-4--v&v-pre-submission-checks) and [Phase 6 — Compliance Scoring](./../FILING-LIFECYCLE.md#7-phase-6--compliance-scoring--audit-trail). Offline sync (72-hour rule) is defined in [`CORE-CONFIG.md`](../CORE-CONFIG.md#1-terminology-registry) under "Company Scope" and [`FILING-LIFECYCLE.md`](./../FILING-LIFECYCLE.md#11-error-handling--recovery).

| Topic | Where to go |
|-------|-------------|
| IoT device registration in OVDS | [Advanced → IoT & POS Devices](../08-advanced/iot-and-pos.md#device-registry) |
| Import and customs duties | [Advanced → Trade & Customs](../08-advanced/trade-and-customs.md) |
| VAT filing | [VAT & TOT](./vat-and-tot.md) |
| WHT types and filing | [WHT & Other Taxes](./wht-and-other-taxes.md) |
| Period lock workflow | [IFRS & Audit → Period Lock](./ifrs-and-audit.md#compliance-sign-off-period-lock) |
| General Ledger and period-end entries | [Financial Ops → GL & Journal Entries](../04-financial-ops/general-ledger-and-journals.md#period-end-closing-sequence) |



