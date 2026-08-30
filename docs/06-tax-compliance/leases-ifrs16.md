<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# IFRS 16 — Lease Accounting

> **Part of:** [Tax & Compliance](./README.md)
>
> **Requires:** Login · `ifrs16:leases:read` · `ovds:read`
>
> **Navigate to:** **ovds → IFRS → Leases** (`/leases`) · **ovds → IFRS Dashboard** (`/ifrs`)

IFRS 16 (effective for Ethiopian Tier 1 and Tier 2 companies) requires most leases to be recognised on the balance sheet as a **Right-of-Use (ROU) Asset** and a corresponding **Lease Liability**. OVDS automates the present value calculation, monthly journal entries, and the balance sheet presentation.

---

## When IFRS 16 Applies

**Must apply IFRS 16 if:**
- Your company is AABE Tier 1 (turnover > ETB 300M or employees > 200) — mandatory since July 2023
- Your company is AABE Tier 2 (turnover > ETB 20M) — mandatory since July 2024
- You have leases with a term exceeding **12 months**, and
- The underlying asset value is **above your low-value threshold** (typically assets costing > USD 5,000 new)

**Exempt from IFRS 16 (practical expedients):**
- Short-term leases with a term of **12 months or less**
- Leases of low-value assets (e.g., laptops, small office equipment)

These exemptions can be elected in **Settings → IFRS → Lease Practical Expedients**. If elected, lease payments are expensed on a straight-line basis — no ROU asset or liability is recognised.

---

## Core Concepts

### Right-of-Use (ROU) Asset
The present value of all future lease payments, recognised as a non-current asset on the Balance Sheet and depreciated over the lease term on a straight-line basis.

### Lease Liability
The present value of all remaining lease payments, recognised as a liability (split into current and non-current portions). Reduced each month as payments are made, with interest unwound using the incremental borrowing rate.

### Incremental Borrowing Rate (IBR)
The rate of interest your company would pay to borrow funds to purchase an equivalent asset over the lease term. Use your bank's lending rate for the relevant currency and term as a proxy.

---

## Adding a Lease

Navigate to **ovds → IFRS → Leases** (`/leases`) → click **New Lease**.

| Field | Required | Notes |
|-------|----------|-------|
| Lease Name | ✅ | e.g. *Head Office — 4th Floor* |
| Asset Type | ✅ | Property / Vehicle / Equipment / Other |
| Lease Start Date | ✅ | Date the lease commenced |
| Lease End Date | ✅ | Date the lease expires (initial term) |
| Monthly Payment (ETB) | ✅ | Fixed monthly payment amount |
| Payment Frequency | ✅ | Monthly / Quarterly / Annual |
| Incremental Borrowing Rate | ✅ | Annual rate as a decimal (e.g. `0.12` for 12%) |
| Currency | ✅ | ETB or foreign currency |
| GL ROU Asset Account | ✅ | e.g. 1600 Right-of-Use Assets |
| GL Lease Liability Account | ✅ | e.g. 2600 Lease Liability |
| GL Depreciation Expense | ✅ | e.g. 6200 Depreciation Expense |
| GL Interest Expense | ✅ | e.g. 7100 Interest on Lease Liabilities |
| Extension Options | Optional | Document any renewal options — affects lease term assessment |
| Notes | Optional | Lease agreement reference number, landlord details |

Click **Save** — OVDS immediately calculates the present value of lease payments and creates:
- The **ROU Asset** at the initial measurement amount
- The **Lease Liability** at the same amount
- The full **amortisation schedule** for the lease term

---

## How Present Value Is Calculated

```
PV = Σ [Payment ÷ (1 + r)^n]

Where:
  Payment = monthly lease payment (ETB)
  r       = monthly rate = (1 + annual IBR)^(1/12) − 1
  n       = payment number (1 to total months)

Example — Office Lease:
  Monthly payment   = ETB 50,000
  Lease term        = 36 months (3 years)
  IBR               = 12% per annum
  Monthly rate      = (1.12)^(1/12) − 1 = 0.9489%

  Initial ROU Asset = Initial Lease Liability = PV of 36 payments
                    ≈ ETB 1,492,000
```

OVDS performs this calculation automatically. The result appears in the lease detail before you save.

---

## Amortisation Schedule

Click the lease → **View Amortisation Schedule** to see the full month-by-month table:

| Month | Opening Liability | Payment | Interest | Principal Reduction | Closing Liability | ROU Depreciation |
|-------|:-----------------:|:-------:|:--------:|:-------------------:|:-----------------:|:----------------:|
| 1 | ETB 1,492,000 | ETB 50,000 | ETB 14,155 | ETB 35,845 | ETB 1,456,155 | ETB 41,444 |
| 2 | ETB 1,456,155 | ETB 50,000 | ETB 13,815 | ETB 36,185 | ETB 1,419,970 | ETB 41,444 |
| … | … | … | … | … | … | … |
| 36 | ETB 41,053 | ETB 50,000 | ETB 389 | ETB 49,611 | ETB 0 | ETB 41,444 |

Click **Export PDF** — use as a supporting schedule for the external auditor or the BIT return.

---

## Monthly Journal Entries (Auto-Posted)

OVDS posts these entries automatically when the monthly depreciation cron runs (last day of every month at 23:00 EAT):

**1. Depreciation of ROU Asset:**
```
Dr  Depreciation Expense (6200)       ETB 41,444
    Cr  Accumulated Depreciation — ROU (1610)    ETB 41,444
```

**2. Interest expense (unwinding the discount):**
```
Dr  Interest Expense — Leases (7100)  ETB 14,155
    Cr  Lease Liability (2600)                   ETB 14,155
```

**3. Lease payment (when paid):**
```
Dr  Lease Liability (2600)            ETB 35,845
    Cr  Cash / Bank                              ETB 35,845
```
*(Payment of ETB 50,000 = ETB 14,155 interest + ETB 35,845 principal reduction)*

---

## Balance Sheet Presentation

The lease generates these balance sheet lines:

**Non-Current Assets:**
```
Right-of-Use Assets (1600)           ETB 1,492,000
Less: Accumulated Depreciation (1610)  (ETB 41,444)
Net ROU Asset                          ETB 1,450,556
```

**Current Liabilities:**
```
Current Portion — Lease Liability    ETB 428,000  (next 12 months' principal)
```

**Non-Current Liabilities:**
```
Lease Liability — Long-term          ETB 1,028,155
```

---

## Lease Modifications

If the lease terms change (rent increase, extension, early termination):

1. Open the lease → click **Modify Lease**.
2. Enter the **effective date** of the modification.
3. Update the relevant fields (new monthly payment, new end date, etc.).
4. OVDS recalculates the lease liability at the modification date using the revised cash flows and the current IBR.
5. The difference between the old and new liability is adjusted against the ROU asset.
6. A modification journal entry is posted automatically:

```
Dr / Cr  Right-of-Use Asset (1600)   [remeasurement adjustment]
         Cr / Dr  Lease Liability (2600)
```

All modifications are recorded in the Audit Trail with the effective date and user.

---

## Short-Term and Low-Value Lease Exemptions

If you elect the practical expedients:

1. Go to **Settings → IFRS → Lease Practical Expedients**.
2. Toggle **Short-Term Leases** and/or **Low-Value Assets** as applicable.
3. For exempt leases, record the payment directly as an expense:

```
Dr  Rent / Lease Expense (6xxx)
    Cr  Cash / Bank
```

No ROU asset or liability is created for exempt leases.

---

## Disclosure Requirements

OVDS generates the IFRS 16 disclosure notes automatically in **Reports → Financial → Notes to Financial Statements**:

- Maturity analysis of lease liabilities (< 1 year, 1–5 years, > 5 years)
- Total depreciation charge on ROU assets
- Total interest expense on lease liabilities
- Total cash outflow for leases
- Carrying amount of ROU assets by asset class
- Statement of any short-term or low-value exemptions elected

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| IFRS tiers and configuration | [IFRS & Audit](./ifrs-and-audit.md#ifrs-compliance) |
| IAS 12 deferred tax on leases | [IFRS & Audit → IAS 12](./ifrs-and-audit.md) |
| Fixed asset depreciation (IAS 16 PPE) | [Financial Ops → Fixed Assets](../04-financial-ops/fixed-assets.md) |
| Balance Sheet presentation | [Reports → Financial Reports](../07-reports/financial-reports.md#balance-sheet) |
| General Ledger entries | [Financial Ops → GL & Journal Entries](../04-financial-ops/general-ledger-and-journals.md) |
| Stamp duty on lease agreements | [Tax & Compliance → WHT & Other Taxes](./wht-and-other-taxes.md#stamp-duty-1) |




