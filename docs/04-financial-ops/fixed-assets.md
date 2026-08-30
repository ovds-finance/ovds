<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Fixed Assets

> **Part of:** [Financial Operations](./README.md) › Fixed Assets
>
> **Requires:** Login · `fixed_assets:read` · `fixed_assets:write`
>
> **Related:** [IAS 16 depreciation → Reports](../07-reports/financial-reports.md#fixed-asset-register) · [IFRS compliance → Tax & Compliance](../06-tax-compliance/ifrs-and-audit.md)

Navigate to **ovds → Fixed Assets** (`/fixed-assets`).

OVDS manages the full fixed asset lifecycle — acquisition, monthly depreciation, impairment reviews, and disposals — with dual compliance for both IFRS (IAS 16) and ERCA's prescribed pool rates under Proclamation 1395/2025.

---

## Adding a Fixed Asset

1. Go to **ovds → Fixed Assets** → click **New Asset**.
2. Fill in the asset details:

| Field | Required | Notes |
|-------|----------|-------|
| Asset Name | ✅ | Descriptive name — e.g. *Toyota Hilux 2024* |
| Category | ✅ | Vehicles, Machinery, Buildings, IT Equipment, Furniture, etc. |
| Purchase Date | ✅ | Date the asset was acquired |
| Purchase Cost | ✅ | Total cost including installation, freight, and import duties |
| Residual Value | Optional | Estimated value at the end of useful life — defaults to 0 |
| Useful Life (years) | ✅ | Expected years of productive use — used for SLM |
| Depreciation Method | ✅ | Straight-Line (SLM) or Declining Balance (DB) |
| GL Asset Account | ✅ | Non-current asset account — e.g. 1500 Property, Plant & Equipment |
| GL Accumulated Depreciation | ✅ | Contra-asset account — e.g. 1510 Accumulated Depreciation |
| GL Depreciation Expense | ✅ | P&L expense account — e.g. 6200 Depreciation Expense |
| Serial / Reference Number | Optional | Manufacturer serial or asset tag for physical identification |
| Location | Optional | Branch, department, or physical location |
| Notes | Optional | Any relevant details — purchase order ref, warranty expiry, etc. |

3. Click **Save** — the system generates the full depreciation schedule automatically.

---

## Depreciation Methods

### Straight-Line (SLM) — IAS 16 Standard

Spreads the depreciable amount evenly over the asset's useful life.

```
Annual Depreciation = (Cost − Residual Value) ÷ Useful Life (years)

Example:
  Purchase Cost     = ETB 500,000
  Residual Value    = ETB 50,000
  Useful Life       = 5 years

  Annual Dep.       = (500,000 − 50,000) ÷ 5  =  ETB 90,000 / year
  Monthly Dep.      = 90,000 ÷ 12              =  ETB 7,500 / month
```

### Declining Balance (DB) — ERCA Pool Method

Applies a fixed percentage to the Net Book Value (NBV) each year. The depreciation charge is higher in early years and reduces over time.

```
Annual Depreciation = Net Book Value × Pool Rate

ERCA pool rates — Proclamation 1395/2025:
  Buildings & structures     →   5%
  Machinery & equipment      →  20%
  Motor vehicles             →  20%
  Computers & IT equipment   →  25%
  Furniture & fittings       →  10%
```

### IFRS vs ERCA: Timing Differences

IFRS (IAS 16) requires depreciation based on the asset's **economic useful life** as assessed by management. ERCA mandates fixed pool rates for tax purposes. These often produce different annual charges, creating a **temporary timing difference**.

The resulting **Deferred Tax Liability** is calculated per IAS 12 and posted automatically when IFRS mode is enabled in **Settings → Tax Engine**.

> For full IFRS deferred tax workflow, see [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md).

---

## Running Monthly Depreciation

Depreciation must be run each period (monthly recommended for IFRS compliance).

1. Go to **ovds → Fixed Assets**.
2. Click **Run Depreciation** → select the **period** (month and year).
3. OVDS calculates depreciation for all active assets and previews the journal entries before posting.
4. Review each entry — confirm amounts are correct.
5. Click **Post** — journal entries are created for every active asset:
   - **Debit:** Depreciation Expense (P&L)
   - **Credit:** Accumulated Depreciation (Balance Sheet contra-account)
6. Each asset's **Net Book Value (NBV)** updates automatically.

> Depreciation can also be run annually. Once posted, a period's depreciation cannot be reversed without ovds Director approval.

---

## Viewing the Depreciation Schedule

1. Open any asset to view its detail page.
2. Click **Depreciation Schedule** — a year-by-year table is displayed:

| Year | Opening NBV | Annual Depreciation | Closing NBV |
|------|------------|--------------------|-----------:|
| 1 | ETB 500,000 | ETB 90,000 | ETB 410,000 |
| 2 | ETB 410,000 | ETB 90,000 | ETB 320,000 |
| 3 | ETB 320,000 | ETB 90,000 | ETB 230,000 |
| 4 | ETB 230,000 | ETB 90,000 | ETB 140,000 |
| 5 | ETB 140,000 | ETB 90,000 | ETB 50,000 |

3. Click **Export PDF** — use as a supporting schedule for external audits or the BIT return.

---

## Asset Disposals

### Full Disposal (Sale or Retirement / Scrapping)

1. Open the asset → click **Dispose Asset**.
2. Enter:
   - **Disposal Date**
   - **Disposal Proceeds** — enter `0` if the asset is scrapped with no sale value
   - **Reason** — e.g. *Sold*, *Scrapped*, *Stolen*, *Written Off*
3. OVDS calculates the gain or loss:
   ```
   Gain / (Loss) on Disposal = Proceeds − Net Book Value at Disposal Date
   ```
4. Journal entries are posted automatically:
   - **Remove:** Asset cost from the asset account
   - **Remove:** Accumulated depreciation to date
   - **Record:** Proceeds received (if any) as other income
   - **Post:** Gain or loss to the GL (Gain on Disposal or Loss on Disposal account)
5. The asset is marked **Disposed** and excluded from all future depreciation runs.

### Partial Write-Down — IAS 36 Impairment

Use when the asset's recoverable amount falls below its Net Book Value due to damage, obsolescence, or market decline.

1. Open the asset → click **Impairment Review**.
2. Enter the **Recoverable Amount** — the higher of:
   - Fair Value less Costs to Sell
   - Value in Use (present value of expected future cash flows from the asset)
3. If the Recoverable Amount < NBV, OVDS posts the impairment loss:
   - **Debit:** Impairment Loss (P&L)
   - **Credit:** Accumulated Impairment (Balance Sheet — separate from Accumulated Depreciation)
4. Future depreciation is automatically recalculated on the post-impairment NBV over the remaining useful life.

> IAS 36 impairment reviews are required annually for all non-current assets, and whenever there are indicators of impairment (physical damage, adverse market changes, restructuring, etc.).

---

## Fixed Asset Register

Navigate to **Reports → Fixed Asset Register** (`/reports/fixed-assets`) — see [Reports → Financial Reports](../07-reports/financial-reports.md).

The register shows all assets with:

| Column | Description |
|--------|-------------|
| Asset Name & Category | Identifying details |
| Acquisition Date | When purchased |
| Purchase Cost | Original cost |
| Accumulated Depreciation | Total depreciation posted to date |
| Net Book Value | Current carrying amount |
| Depreciation Method | SLM or DB |
| Remaining Useful Life | Years remaining |
| Disposal Status | Active, Disposed, or Impaired |

**Export the register as PDF** for:
- The annual **BIT (Business Income Tax) return** — ERCA requires a fixed asset schedule
- External auditor working papers
- Internal management review

---

## Asset Categories Reference

| Category | Typical ERCA Pool Rate | IFRS Useful Life (typical) |
|----------|----------------------|---------------------------|
| Buildings & Structures | 5% DB | 20–50 years SLM |
| Machinery & Equipment | 20% DB | 5–15 years SLM |
| Motor Vehicles | 20% DB | 4–8 years SLM |
| Computers & IT Equipment | 25% DB | 3–5 years SLM |
| Furniture & Fittings | 10% DB | 5–10 years SLM |
| Leasehold Improvements | 10% DB | Shorter of lease term or useful life |

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Run the Fixed Asset Register report | [Reports → Financial Reports](../07-reports/financial-reports.md) |
| ERCA depreciation rules | [Tax & Compliance → WHT & Other Taxes](../06-tax-compliance/wht-and-other-taxes.md) |
| IFRS deferred tax (IAS 12) | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md) |
| IAS 2 stock valuation | [Items Catalog → IAS 2 Valuation](./items-catalog.md#ias-2-stock-valuation) |
| BIT return filing | [Tax & Compliance → BIT](../06-tax-compliance/README.md) |



