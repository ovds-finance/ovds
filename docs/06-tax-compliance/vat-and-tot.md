<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)
     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)
     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)
     🔄 Last synced: 2026-08-27 -->

# VAT & Turnover Tax (TOT)

> **Part of:** [Tax & Compliance](./README.md)
>
> **Requires:** Login · `vat:read` · `vat:write` · `vat:file`
>
> **Navigate to:** **Tax & Compliance → VAT Administration** (`/vat-administration`)

Ethiopia's VAT is governed by **Proclamation No. 1341/2024**, effective July 7, 2024. OVDS calculates, aggregates, and files VAT automatically — you review, approve, and submit.

---

## VAT at a Glance

| Parameter | Value |
|-----------|-------|
| Standard Rate | 15% |
| Zero Rate | 0% — exports, basic goods |
| Exempt | Non-taxable supplies |
| Registration Threshold | ETB 2,000,000/year turnover |
| Filing Deadline | 30th of the following month |
| Late Filing Penalty | ETB 500/day (max ETB 50,000) |
| Late Payment Penalty | 2%/month compounded |
| Zero Declaration Required | ✅ Yes — even in months with no transactions |

---

## Output VAT (Sales)

Output VAT is collected from customers on every invoice with a VAT rate of 15%.

- Automatically calculated on all invoices assigned a 15% VAT rate
- Held as a liability in the **VAT Payable** account
- Reported monthly on the VAT Return

When creating an invoice, assign the correct VAT rate to each line item:
- **15%** — standard-rated supply
- **0%** — zero-rated (e.g. exports)
- **Exempt** — not subject to VAT

---

## Input VAT (Purchases)

Input VAT is the VAT you paid on bills and expenses from VAT-registered vendors. It is deducted from Output VAT to reduce what you owe ERCA.

**Requirements to claim Input VAT:**
- The vendor must be VAT-registered.
- The vendor's invoice must include their **TIN** and an **ERCA QR code**.
- The bill must be recorded in OVDS under **Purchases → Bills** with the correct VAT rate.

---

## Net VAT Calculation

```
Net VAT Payable = Output VAT − Input VAT

Output VAT > Input VAT  →  Pay the difference to ERCA
Input VAT > Output VAT  →  VAT refund (or carry forward to next month)
```

---

## Monthly VAT Filing Workflow

### Step 1 — Compute VAT

1. Go to **Tax & Compliance → VAT Administration**.
2. Click **Compute** for the relevant month — requires `vat:calculate`.
3. OVDS aggregates all invoices (Output VAT) and all bills (Input VAT) for the period.
4. A summary is shown: Output VAT, Input VAT, and Net VAT Payable.

### Step 2 — Review

Check the summary before submitting:
- Output VAT total should match the sum of VAT on all sales invoices for the month.
- Input VAT total should match the sum of VAT on all purchase bills with valid vendor TINs.
- Investigate any unexpected figures before proceeding.

### Step 3 — Generate VAT Return

1. Click **Generate VAT Return** — creates the official VAT return document (PDF).
2. Review the return document.

### Step 4 — Submit to eTax Portal

1. Click **Submit to eTax** in Tax Filing — requires `vat:file`.
   - This logs the submission in OVDS and opens [etax.erca.gov.et](https://etax.erca.gov.et).
   - Alternatively, download the return file for manual upload.
2. On the portal, log in with your TIN and password.
3. Select **Tax Declaration → VAT**.
4. Enter your monthly sales, purchases, and the net VAT.
5. Submit and download the **submission receipt**.
6. Attach the receipt to the filing record in OVDS.

### Step 5 — Pay ERCA

After filing:
1. Use the generated payment slip at any designated commercial bank (CBE, Awash, Dashen, etc.) or pay via **Telebirr**.
2. Return to OVDS → **Tax Filing → Record Payment**.
3. Enter the bank reference number and date.
4. The filing is marked **Paid** and the compliance score updates.

---

## Reverse-Charge VAT (Foreign Services)

When paying for services from foreign providers (AWS, Google, software subscriptions, consulting):

- The Ethiopian business is responsible for the VAT — this is the **reverse-charge** mechanism.
- Record the foreign service bill with the **Reverse Charge VAT** flag enabled.
- OVDS calculates 15% VAT on the service value.
- This VAT appears as **both** Output VAT (you owe it) and Input VAT (you can claim it back).
- Net VAT cost = zero, but it **must be reported** on the monthly VAT return.

---

## Withholding VAT

For payments to non-VAT-registered suppliers:
- 50% of the VAT amount is withheld by the buyer (you).
- The withheld VAT is remitted directly to ERCA — not paid to the supplier.
- Enable per vendor: **Vendor Profile → Withholding VAT: Yes**.

---

## Zero Declaration (No-Transaction Months)

Even if your business had **no sales or purchases** in a given month, you are legally required to file a **zero return** by the 30th of the following month. Failure to file — even a zero return — incurs the standard penalty (ETB 500/day for VAT).

From OVDS:
1. Go to **VAT Administration → Compute** for the month.
2. If there are no transactions, totals will all be ETB 0.
3. Generate and submit the zero return as normal.

---

## Turnover Tax (TOT) — Category B Taxpayers

Businesses with annual turnover **below ETB 2,000,000** pay TOT instead of VAT.

| TOT Type | Rate | Applies To |
|----------|------|-----------|
| TOT — Goods | 2% | Sale of physical goods |
| TOT — Services | 10% | Provision of services |

### TOT vs VAT

| | TOT (Category B) | VAT (Category A) |
|---|---|---|
| Threshold | Turnover < ETB 2M/year | Turnover ≥ ETB 2M/year |
| Rates | 2% goods / 10% services | 15% standard |
| Input deduction | ❌ No | ✅ Input VAT deductible |
| Filing | Monthly, by 30th | Monthly, by 30th |
| Zero filing required | ✅ Yes | ✅ Yes |

### TOT Filing in OVDS

1. Go to **Tax Filing → Record Filing** → select **Turnover Tax — Goods** or **Turnover Tax — Services**.
2. Enter the period and total sales amount — OVDS calculates the TOT liability.
3. Open the [eTax portal](https://etax.erca.gov.et) and file the TOT declaration.
4. Return to OVDS → update the filing status to **Submitted** with the portal reference number.
5. After payment, update to **Paid** with the bank reference.

---

## Documents to Prepare Before Filing

- All **sales invoices** for the period (with ERCA QR codes)
- All **purchase invoices** from VAT-registered vendors
- Bank statements for cross-referencing payment references
- Previous period's submission receipt (for carry-forward VAT credits if applicable)

---

## Related Topics

> **Lifecycle context:** This guide covers [Phase 2 — Tax Calculation](./../FILING-LIFECYCLE.md#3-phase-2--tax-calculation--accrual) and [Phase 5 — e-Tax Submission](./../FILING-LIFECYCLE.md#6-phase-5--etax-submission--payment) of the Digital Automated Filing Lifecycle. All terminology and rates are defined in [`CORE-CONFIG.md`](../CORE-CONFIG.md).

| Topic | Where to go |
|-------|-------------|
| Configure VAT rates on items | [Financial Ops → Items Catalog](../04-financial-ops/items-catalog.md) |
| WHT on vendor payments | [WHT & Withholding Taxes](./wht-and-other-taxes.md) |
| Business Income Tax | [BIT & DRRF](./bit-and-drrf.md) |
| Tax calendar | [Tax & Compliance → BIT & DRRF → Tax Calendar](./bit-and-drrf.md#tax-calendar-summary) |
| eTax portal support | MoR: [etax.erca.gov.et](https://etax.erca.gov.et) |


