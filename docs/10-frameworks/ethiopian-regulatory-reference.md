<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Ethiopian Regulatory Reference

> **Part of:** [Frameworks & Reference](./README.md)
>
> **Requires:** Login · `ovds:read`

A consolidated reference for the Ethiopian tax laws, proclamations, fiscal calendar, and regulatory thresholds built into OVDS. Use this when verifying rates, deadlines, or legal citations before filing.

---

## Legal Authority Hierarchy

| Level | Authority | Scope |
|-------|-----------|-------|
| 1 | Federal Constitution of Ethiopia (1995) | Supreme law |
| 2 | Commercial Code — Proclamation 1243/2021 | Business law foundation |
| 3 | Federal Tax Proclamations | Tax obligations |
| 4 | Council of Ministers Regulations | Implementation rules |
| 5 | MoR Directives (etax.mor.gov.et, TASS, ECC) | Operational procedures |
| 6 | IFRS / IAS Standards (AABE adoption) | Financial reporting |

---

## Key Proclamations & Regulations

| Law | Subject | Key Provisions |
|-----|---------|---------------|
| **Proclamation 979/2016** | Income Tax | BIT 30%, PIT brackets, exemptions for NGOs and government |
| **Proclamation 1186/2020** | Investment Incentives | Manufacturing capital goods import duty exemptions |
| **Proclamation 1243/2021** | Commercial Code | Company formation, governance, accounting obligations |
| **Proclamation 1341/2024** | VAT Reform | 15% standard rate, ETB 2M threshold, monthly filing, NBE-IQR QR |
| **Proclamation 1395/2025** | PIT & Pension Reform | Updated 6-bracket PIT (0–35%), pension cap ETB 15,000, WHT thresholds |
| **Regulation 570/2025** | DRRF | Disaster Risk Response Fund — 17+ levy categories, quarterly remittance |
| **AABE IFRS Directive** | IFRS Adoption | Tier 1 (July 7, 2023), Tier 2 (July 7, 2024) |
| **NBE-IQR Standard** | Invoice QR Code | ERCA-compliant QR code format — mandatory on all fiscal invoices |

---

## Ethiopian Fiscal Calendar

| Event | Gregorian Date | Ethiopian Date |
|-------|---------------|---------------|
| Fiscal Year Start | ~July 7/8 | Hamle 1 |
| Fiscal Year End | ~July 6/7 | Sene 30 |
| Monthly VAT / TOT / WHT deadline | 30th of following month | 30th of following month |
| DRRF Q1 deadline | October 15 | Tikimt 5 |
| DRRF Q2 deadline | January 15 | Tir 7 |
| DRRF Q3 deadline | April 15 | Miazia 7 |
| DRRF Q4 deadline | July 15 | Hamle 9 |
| BIT Quarterly — Q1 | September 7 | Meskerem 28 |
| BIT Quarterly — Q2 | December 7 | Hidar 28 |
| BIT Quarterly — Q3 | March 7 | Yekatit 27 |
| BIT Quarterly — Q4 | June 7 | Sene 1 |
| BIT Annual Filing | November 7 | Hidar 1 (within 4 months of FY end) |
| Pension Remittance | Monthly, same day as payroll | — |

---

## Complete Tax Rate Reference

### VAT (Proclamation 1341/2024)

| Rate | Applies To | Registration Threshold |
|------|-----------|----------------------|
| 15% | Standard domestic supplies | ETB 2,000,000/year turnover |
| 0% | Exports, basic food items | — |
| Exempt | Financial services, education, healthcare | — |

**Filing deadline:** 30th of the following month. Zero declaration required even with no transactions.

### Turnover Tax — TOT

| Rate | Applies To | Category |
|------|-----------|---------|
| 2% | Sale of goods | B (below VAT threshold) |
| 10% | Provision of services | B (below VAT threshold) |

### Withholding Tax — WHT (Proclamation 1395/2025)

| Type | Rate | Threshold | Filing |
|------|:----:|-----------|--------|
| Services — domestic | 2% | ≥ ETB 500 per payment | Monthly |
| Goods — domestic | 2% | ≥ ETB 10,000 per payment | Monthly |
| Non-resident services | 15% | Any amount | Monthly |
| Corporate rent | 30% | Any amount | Monthly |
| Individual rent (Schedule D) | 15% | Any amount | Monthly |
| Dividend | 15% | Any amount | At transaction |
| Interest | 10% | Any amount | Monthly |
| Capital gains | 15% | On disposal proceeds | At transaction |
| Royalties (Schedule D) | 5% | Any amount | Monthly |

### Business Income Tax — BIT

| Parameter | Value |
|-----------|-------|
| Standard rate | 30% of net taxable profit |
| Minimum Alternative Tax (MAT) | 2.5% of annual gross turnover |
| Tax payable | MAX(BIT, MAT) |
| Loss carry-forward | Up to 3 years |
| Filing deadline | November 7 |
| Advance installments | 25% quarterly — Sep 7, Dec 7, Mar 7, Jun 7 |
| Cash transaction limit | ETB 30,000 — above this must use bank/cheque to be deductible |

**Allowable deductions:** COGS, salaries, rent, depreciation (ERCA schedule), loan interest, pension (employer 11%), insurance, audit/legal fees, advertising.

**Non-deductible:** Personal expenses, cash payments > ETB 30,000, fines and penalties, dividends paid.

### Personal Income Tax — Schedule A (Proclamation 1395/2025)

| Monthly Taxable Income (ETB) | Rate | Deductible (ETB) |
|------------------------------|:----:|:----------------:|
| 0 – 2,000 | 0% | 0 |
| 2,001 – 4,000 | 10% | 200 |
| 4,001 – 7,000 | 15% | 400 |
| 7,001 – 11,000 | 20% | 750 |
| 11,001 – 14,000 | 25% | 1,300 |
| > 14,000 | 35% | 2,700 |

**Formula:** `PIT = (Taxable Salary × Rate) − Deductible Amount`
**Taxable salary** = Gross salary − Employee pension (7%, capped at ETB 15,000 insurable earnings).

### Pension (Proclamation 1395/2025)

| Contribution | Rate | Monthly Cap |
|---|:---:|---|
| Employee | 7% | ETB 15,000 insurable earnings |
| Employer | 11% | ETB 15,000 insurable earnings |
| Total remittance | 18% | Per employee per month |

### DRRF Levy Rates (Regulation 570/2025)

| Category | Rate | Applies To |
|----------|:----:|-----------|
| Salary contribution | 1% | Net salary of all employees |
| Loan disbursement | 1% | Loan value disbursed by financial institutions |
| Insurance premium | 1% | Premiums collected by insurers |
| Dividend distribution | 1% | Dividends paid to shareholders |
| Mobile / digital banking fees | 5% | Service fees |
| Airtime sales | 5% | Telecom airtime revenue |
| Annual sales revenue | 5% | Gross sales (sector-specific — see sector list) |
| Tobacco and alcohol | 5% | Product sales |
| Telecom / digital services | 5% | Revenue from telecom and digital services |
| Manufacturing | 1% | Sector transactions |
| Construction | 2% | Projects and infrastructure |
| Trade & Commerce | 1% | Wholesale and retail |
| Financial Services | 3% | Banking, insurance, microovds |
| Hospitality | 2% | Hotels, restaurants, tourism |
| Transport | 1.5% | Freight and passenger |
| Mining | 5% | Mineral extraction |
| Healthcare | 1% | Private hospitals and clinics |
| Education | 1% | Private schools and universities |
| Government budget | 0.25% | Annual budget allocation |
| Domestic flight tickets | ETB 100 flat | Per ticket issued |
| Retail fuel sales | ETB 200 flat | Per issuance at outlets |

**Quarterly deadlines:** 15th of October, January, April, July.

### Stamp Duty

| Document Type | Rate | Minimum |
|---|:---:|:---:|
| Share transfer agreements | 1% | ETB 500 |
| Loan agreements | 1% | ETB 500 |
| Lease agreements | 1% | ETB 500 |
| Property sale contracts | 1% | ETB 500 |
| Guarantees and surety bonds | 1% | ETB 500 |

Paid at the relevant government office at time of document execution — not filed monthly.

---

## Sector Tax Exemptions

| Sector | Exempt From | Legal Authority |
|--------|-------------|----------------|
| Agriculture | VAT, Excise, Import Surtax | Proc. 1341/2024 Sch. 2; Proc. 1186/2020 |
| Financial Services | VAT, TOT | Proc. 1341/2024 Sch. 1 |
| Education (private) | VAT, TOT | Proc. 1341/2024 Sch. 1 |
| Healthcare (private) | VAT | Proc. 1341/2024 Sch. 1 |
| NGOs / Non-profit | BIT | Proc. 979/2016 Art. 8 |
| Manufacturing (capital goods) | Import Surtax | Investment Proc. 1180/2020 |
| Government entities | VAT, BIT | Proc. 979/2016 Art. 8 |

> Contact your **MoR Regional Tax Office** to register for a sector exemption and obtain an exemption certificate before claiming.

---

## Late Filing & Payment Penalties

| Tax | Late Filing Penalty | Late Payment Penalty |
|-----|--------------------|--------------------|
| VAT | ETB 500/day (max ETB 50,000) | 2%/month compounded |
| TOT | ETB 500/day | 2%/month compounded |
| WHT | ETB 500/day | 2%/month compounded |
| BIT | 5% of tax due + interest | 2%/month |
| Pension | — | 2%/month on outstanding |

Use the **Penalty Calculator** at `/tax/penalty-calculator` to estimate penalties before filing late.

---

## MoR Contact & Portals

| Resource | URL / Contact |
|----------|--------------|
| eTax Filing Portal | [etax.erca.gov.et](https://etax.erca.gov.et) |
| TASS — Device Registration | [tass.erca.gov.et](https://tass.erca.gov.et) |
| Ministry of Revenue Official Site | [mor.gov.et](https://mor.gov.et) |
| Ethiopian Customs Commission | [ecca.gov.et](https://ecca.gov.et) |
| AABE (IFRS standards) | [aabe.gov.et](https://aabe.gov.et) |
| MoR Phone | +251 11 662 98 00 |
| MoR Email | info.mor@mor.gov.et |

---

## Related Topics

> **Lifecycle context:** All tax rates, deadlines, and thresholds here are the source of truth for [`CORE-CONFIG.md`](./../CORE-CONFIG.md#7-tax-rate--deadline-summary) and drive the cron alerts in [`FILING-LIFECYCLE.md`](./../FILING-LIFECYCLE.md#9-cron-automation-schedule).
>
> **Filing pipeline:** These rates feed [Phase 2 — Tax Calculation](./../FILING-LIFECYCLE.md#3-phase-2--tax-calculation--accrual) and the deadline calendar feeds [Phase 3 — Analysis](./../FILING-LIFECYCLE.md#4-phase-3--analysis--liability-estimation).

| Topic | Where to go |
|-------|-------------|
| VAT filing in OVDS | [Tax & Compliance → VAT & TOT](../06-tax-compliance/vat-and-tot.md) |
| WHT and all withholding types | [Tax & Compliance → WHT & Other Taxes](../06-tax-compliance/wht-and-other-taxes.md) |
| BIT filing and DRRF | [Tax & Compliance → BIT & DRRF](../06-tax-compliance/bit-and-drrf.md) |
| IFRS tiers and compliance | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md) |
| Penalty calculator | Settings → Tax (`/tax/penalty-calculator`) |



