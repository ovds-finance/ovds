<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Withholding Tax, Stamp Duty & Other Taxes

> **Part of:** [Tax & Compliance](./README.md)
>
> **Requires:** Login · `vat:read` · `vat:write`

This section covers all withholding tax (WHT) types, stamp duty, Schedule D income, and sector-specific exemptions as defined under Ethiopian fiscal law (Proclamation No. 1395/2025 and related directives).

---

## Withholding Tax (WHT) Overview

WHT is deducted at source by the payer and remitted directly to ERCA — the vendor or payee receives the net amount. OVDS calculates WHT automatically on qualifying payments based on the vendor's profile and the transaction amount.

All WHT types are filed **monthly** alongside VAT on the [eTax portal](https://etax.erca.gov.et), due by the **30th of the following month**.

---

## WHT Types & Rates

| WHT Type | Rate | Threshold | Trigger |
|----------|------|-----------|---------|
| Services — domestic | 2% | ≥ ETB 500 per payment | Payments to registered businesses for services |
| Goods — domestic | 2% | ≥ ETB 10,000 per payment | Payments for goods |
| Non-resident services | 15% | Any amount | Payments to foreign service providers |
| Corporate rent | 30% | Any amount | Rent paid to a corporate landlord |
| Individual rent | 15% | Any amount | Rent paid to an individual |
| Dividend | 15% | Any amount | Profit distributions to shareholders |
| Interest | 10% | Any amount | Interest paid on loans or deposits |

---

## WHT on Domestic Services & Goods

OVDS automatically applies WHT when:
- The vendor has a **TIN on file** in their vendor profile, and
- The bill amount meets the relevant threshold (ETB 500 for services / ETB 10,000 for goods).

The WHT amount is displayed on the bill and deducted from the payment:
```
Net Payment = Gross Bill Amount − WHT Amount
WHT Amount  = Gross Bill Amount × 2%
```

> Mark a vendor as **WHT Exempt** in their vendor profile if they are exempt (e.g. government entities, diplomatic missions).

---

## Non-Resident WHT (Foreign Services)

When paying foreign providers (AWS, Google, software licenses, SaaS, consulting):

1. Record the bill under **Purchases → Bills** — set the vendor's country to their foreign jurisdiction.
2. OVDS applies **WHT Non-Resident 15%** automatically when the vendor is flagged as foreign.
3. The 15% WHT is deducted from the payment and remitted to ERCA.
4. Additionally, apply the **Reverse-Charge VAT** flag — these are two separate and independent obligations (see [VAT & TOT](./vat-and-tot.md#reverse-charge-vat-foreign-services)).
5. File both the WHT and reverse-charge VAT monthly on the eTax portal.

---

## Corporate Rent WHT (30%)

When paying rent to a **corporate landlord** (a company, not an individual):

1. Create or update the vendor with type **Corporate Landlord**.
2. Bills from that vendor auto-flag for **WHT Rent 30%**.
3. Net payment = Gross Rent × 70%. The 30% is remitted directly to ERCA.

---

## Dividend & Interest WHT

**Dividends (15%):**
- Withheld at source when profits are distributed to shareholders.
- Record under **Tax → Tax Filing → Dividend WHT**.
- Remit to ERCA at the time of distribution.

**Interest (10%):**
- Withheld when interest is paid on external loans or deposits to individuals or entities.
- Record under **Tax → Tax Filing → Interest WHT**.
- Remit monthly with the regular WHT return.

---

## WHT Certificates

Generate monthly certificates for every vendor from whom WHT was deducted. Vendors use these to claim WHT credit on their own tax return.

Navigate to **Purchases → WHT Certificates** (`/tax/wht-certificates`) — requires `vat:write`.

1. Go to **Tax → WHT Certificates → Generate [Month]**.
2. OVDS creates one certificate per vendor showing total payments made and WHT withheld.
3. Email certificates to vendors.
4. Keep a copy in the Audit Trail for ERCA verification.

---

## Filing WHT Monthly

1. Log in to [etax.erca.gov.et](https://etax.erca.gov.et).
2. Select **Tax Declaration → Withholding Tax**.
3. Enter total payments made and WHT amounts withheld (by type).
4. Submit and download the WHT remittance receipt.
5. Pay via commercial bank using the generated payment slip.
6. In OVDS: **Tax Filing → Record Filing** → log the WHT submission with the portal reference.

---

## Stamp Duty (1%)

Navigate to **Tax → Stamp Duty** (`/tax/stamp-duty`) — requires `vat:read`.

Stamp Duty applies to specific legal documents at **1%** of the transaction value (minimum ETB 500).

### Documents Subject to Stamp Duty

| Document Type | Rate | When Applicable |
|---------------|------|----------------|
| Share transfer agreements | 1% | On share purchase/sale value |
| Loan agreements | 1% | On principal amount |
| Lease agreements | 1% | On total lease value |
| Property sale contracts | 1% | On sale price |
| Guarantees and surety bonds | 1% | On guaranteed amount |

### Recording Stamp Duty

1. Navigate to **Tax → Stamp Duty**.
2. Select the document type and enter the transaction value.
3. OVDS calculates the duty: `MAX(Transaction Value × 1%, ETB 500)`.
4. Pay at the relevant government office.
5. Attach the stamped document to the transaction record in OVDS for audit.

> Stamp duty is a **one-time transaction cost** — not filed monthly. Keep the stamped originals as audit evidence.

---

## Schedule D — Other Income Tax

Schedule D covers income that is not from employment (Schedule A) or business operations (Schedule B/C).

| Income Type | WHT Rate | Notes |
|-------------|----------|-------|
| Rental income — individual landlord | 15% flat | On gross rent |
| Casual / irregular income | 15% flat | One-off payments to individuals |
| Royalties | 5% | Intellectual property income |
| Interest — individual | 10% | Bank interest paid to individuals |
| Other miscellaneous income | 20% | Catch-all for unclassified income |

**How OVDS applies Schedule D:**
- When paying rent to an **individual** (not a company) → 15% WHT deducted automatically.
- When paying royalties → 5% WHT applied at source.
- Navigate to **Tax → Schedule D** (`/tax/schedule-d`) to view and manage all Schedule D declarations.

---

## Sector Tax Exemptions

Certain sectors benefit from full or partial tax exemptions. OVDS applies these automatically when the company's **Business Sector** is correctly set in **Settings → Company Profile**.

| Sector | Exempt From | Legal Authority |
|--------|-------------|----------------|
| Agriculture | VAT, Excise, Import Surtax | Proc. 1341/2024 Sch. 2; Proc. 1186/2020 |
| Financial Services (banks, insurers) | VAT, TOT | Proc. 1341/2024 Sch. 1 |
| Education (private schools, universities) | VAT, TOT | Proc. 1341/2024 Sch. 1 |
| Healthcare (hospitals, clinics) | VAT | Proc. 1341/2024 Sch. 1 |
| NGOs / Non-profit (charitable activities) | BIT | Proc. 979/2016 Art. 8 |
| Manufacturing (capital goods imports) | Import Surtax | Investment Proc. 1180/2020 |
| Government entities | VAT, BIT | Proc. 979/2016 Art. 8 |

> Contact your **MoR Regional Tax Office** to register for a sector exemption and obtain an exemption certificate before claiming.

---

## Related Topics

> **Lifecycle context:** WHT calculation occurs in [Phase 2 — Tax Calculation](./../FILING-LIFECYCLE.md#3-phase-2--tax-calculation--accrual) and submission in [Phase 5 — e-Tax Submission](./../FILING-LIFECYCLE.md#6-phase-5--etax-submission--payment). WHT types, rates, and thresholds are defined in [`CORE-CONFIG.md`](../CORE-CONFIG.md#7-tax-rate--deadline-summary). All WHT types are filed monthly alongside VAT on the eTax portal by the 30th of the following month.

| Topic | Where to go |
|-------|-------------|
| VAT filing workflow | [VAT & TOT](./vat-and-tot.md) |
| Business Income Tax | [BIT & DRRF](./bit-and-drrf.md) |
| Creating vendor bills with WHT | [Financial Ops → Creating a Bill](../04-financial-ops/creating-a-bill.md) |
| WHT certificates | [Financial Ops → Creating a Bill → WHT Certificates](../04-financial-ops/creating-a-bill.md#wht-certificates) |
| Tax calendar | [Tax & Compliance → BIT & DRRF → Tax Calendar](./bit-and-drrf.md#tax-calendar-summary) |



