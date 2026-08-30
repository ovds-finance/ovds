<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Taxes & Compliance

> **Part of:** [OVDS Documentation](../README.md) › Tax & Compliance
>
> **Related modules:** [Financial Operations](../04-financial-ops/README.md) · [Banking](../05-banking/README.md) · [Reports](../07-reports/README.md)

OVDS is built specifically for Ethiopian fiscal law. This module covers VAT (Proclamation 1341/2024), Business Income Tax, Disaster Risk Reduction Fund (DRRF), IFRS compliance, and audit management.

---

## Standalone Guides

| Guide | Description |
|-------|-------------|
| [VAT & Turnover Tax (TOT)](./vat-and-tot.md) | Output/input VAT, monthly filing, reverse-charge, zero declarations, TOT for Category B |
| [WHT & Other Taxes](./wht-and-other-taxes.md) | All WHT types and rates, stamp duty, Schedule D, sector exemptions, WHT certificates |
| [BIT & DRRF](./bit-and-drrf.md) | Business Income Tax, MAT, quarterly installments, DRRF levy categories, pension submissions |
| [IFRS & Audit](./ifrs-and-audit.md) | IFRS tiers, ECL, IFRS 16 leases, compliance score, external audit, period lock |
| [IFRS 16 — Lease Accounting](./leases-ifrs16.md) | ROU asset, lease liability, PV calculation, amortisation schedule, modifications, disclosures |
| [Property Tax, Excise Tax & TASS](./property-tax-and-excise.md) | Property tax recording, excise rates, TASS device registration, V&V compliance dashboard, period close checklist |
| [Universal Tax Configuration](./universal-tax-configuration.md) | Ethiopian ERP blueprint — full tax type registry, IAS 12 classification, GL account mappings |

---
## 1. VAT Administration

Navigate to **Tax & Compliance → VAT** (`/vat-administration`) — requires `vat:read`.

### Overview
Ethiopia's VAT is governed by **Proclamation No. 1341/2024**, effective July 7, 2024.

| Parameter | Value |
|-----------|-------|
| Standard Rate | 15% |
| Zero Rate | 0% (exports, basic goods) |
| Exempt | Non-taxable supplies |
| Registration Threshold | ETB 2,000,000/year |
| Filing Deadline | 30th of the following month |
| Late Filing Penalty | ETB 500/day (max ETB 50,000) |
| Late Payment Penalty | 2%/month compounded |

### Output VAT (Sales)
- Automatically calculated on all invoices with VAT rate = 15%
- Collected from customers and held as a liability
- Reported monthly on the VAT return

### Input VAT (Purchases)
- VAT paid on bills and expenses from VAT-registered vendors
- Deducted from Output VAT to calculate Net VAT Payable
- Requires valid VAT invoice from vendor (with their TIN and ERCA QR)

### Net VAT Calculation
```
Net VAT Payable = Output VAT − Input VAT

If Output VAT > Input VAT → Pay to ERCA
If Input VAT > Output VAT → VAT Refund (or carry forward)
```

### Monthly Filing Workflow
1. **Compute VAT** — click **Compute** in VAT Administration
   - OVDS aggregates all invoices and bills for the month
   - Calculates Output VAT, Input VAT, and Net VAT
   - Requires `vat:calculate` permission
2. **Review** — check the summary for accuracy
   - Verify Output VAT matches invoice totals
   - Verify Input VAT matches bill totals
3. **Generate Return** — click **Generate VAT Return**
   - Creates the official VAT return document
4. **Submit to eTax Portal** — click **Submit to eTax**
   - Opens [etax.erca.gov.et](https://etax.erca.gov.et) with pre-filled data
   - Or download the return file for manual submission
   - Requires `vat:file` permission
5. **Record Payment** — after paying ERCA, record the payment in OVDS

### Reverse-Charge (Foreign Services)
When paying for services from foreign providers (e.g., AWS, Google, software subscriptions):
- The Ethiopian business is responsible for VAT (reverse-charge mechanism)
- Record the foreign service bill with **Reverse Charge VAT** flag
- OVDS calculates 15% VAT on the service value
- This VAT is both Output VAT (you owe it) and Input VAT (you can claim it)
- Net effect: zero VAT cost, but must be reported on the VAT return

### Withholding VAT
For payments to non-VAT-registered suppliers:
- 50% of the VAT amount is withheld by the buyer
- Withheld VAT is remitted directly to ERCA
- Configure per vendor: **Vendor Profile → Withholding VAT: Yes**

### WHT Certificate
Navigate to **Tax → WHT Certificates**.
- Generate WHT certificates for vendors
- Required by vendors to claim WHT credit on their tax return
- Certificates are generated monthly and can be emailed to vendors

---

## 1a. Extended Withholding Tax (WHT) Types

Beyond standard WHT on domestic goods and services, the following additional WHT types apply per Proclamation No. 1395/2025:

| WHT Type | Rate | Threshold | Applies To |
|----------|------|-----------|-----------|
| WHT — Services (domestic) | 2% | ≥ ETB 500 per payment | Payments to registered businesses for services |
| WHT — Goods (domestic) | 2% | ≥ ETB 10,000 per payment | Payments for goods |
| WHT — Non-Resident Services | 15% | Any amount | Payments to foreign service providers (e.g., AWS, Google, SaaS subscriptions) |
| WHT — Corporate Rent | 30% | Any amount | Rent payments to corporate landlords |
| WHT — Dividend | 15% | Any amount | Dividends distributed to shareholders |
| WHT — Interest | 10% | Any amount | Interest paid on loans or deposits |

### Non-Resident WHT (Foreign Services)
When paying foreign providers (e.g., cloud services, software licenses, consulting fees):
1. Record the bill under **Purchases → Bills** — set vendor country to the foreign jurisdiction.
2. OVDS applies **WHT Non-Resident 15%** automatically when the vendor is marked as foreign.
3. The WHT is deducted from payment and remitted to ERCA.
4. Also apply the **Reverse-Charge VAT** flag (see VAT section above) — the two are independent obligations.
5. File both the WHT and reverse-charge VAT on the eTax portal monthly.

### Corporate Rent WHT
When paying rent to a corporate landlord (company, not individual):
1. Create the vendor with type **Corporate Landlord**.
2. Bills from that vendor will auto-flag for **WHT Rent 30%**.
3. Net payment = Gross Rent × 70%. The 30% is remitted to ERCA.

### Dividend & Interest WHT
- **Dividends:** Withheld at source when profits are distributed. Record under **Tax → Tax Filing → Dividend WHT**.
- **Interest:** Withheld when interest is paid on external loans or deposits. Record under **Tax → Tax Filing → Interest WHT**.

> All WHT types flow into the monthly WHT return filed on the eTax portal. OVDS generates the consolidated WHT schedule automatically.

---

## 1b. Stamp Duty

Stamp Duty applies to specific legal documents and contracts at **1%** of the transaction value (minimum ETB 500).

**Common documents subject to Stamp Duty:**

| Document Type | Rate | When Applicable |
|---------------|------|----------------|
| Share transfer agreements | 1% | On share purchase/sale value |
| Loan agreements | 1% | On principal amount |
| Lease agreements | 1% | On total lease value |
| Property sale contracts | 1% | On sale price |
| Guarantees and surety bonds | 1% | On guaranteed amount |

**Recording Stamp Duty in OVDS:**
1. Navigate to **Tax → Stamp Duty** (`/tax/stamp-duty`) — requires `vat:read`.
2. Select the document type and enter the transaction value.
3. OVDS calculates the duty (1% or ETB 500 minimum, whichever is higher).
4. Record the payment at the relevant government office.
5. Attach the stamped document to the transaction record for audit.

> Stamp duty is a one-time transaction cost — it is not filed monthly. Keep stamped originals as audit evidence.

---

## 1c. Schedule D — Other Income Tax

Schedule D covers income that is not from employment (Schedule A) or business operations (Schedule B/C):

| Income Type | Rate | Notes |
|-------------|------|-------|
| Rental income (individual landlord) | 15% flat | On gross rent |
| Casual/irregular income | 15% flat | One-off payments to individuals |
| Royalties | 5% | Intellectual property income |
| Interest (individual) | 10% | Bank interest paid to individuals |
| Other miscellaneous income | 20% | Catch-all for unclassified income |

**When OVDS applies Schedule D:**
- When paying rent to an **individual** (not a company) — 15% WHT is deducted automatically.
- When paying royalties — 5% WHT applied at source.
- Navigate to **Tax → Schedule D** (`/tax/schedule-d`) to view and manage Schedule D declarations.

---

## 1d. Sector Tax Exemptions

Certain sectors benefit from full or partial tax exemptions under Ethiopian law. OVDS applies these automatically when the company's **Business Sector** is set correctly in **Settings → Company Profile**.

| Sector | Exempt From | Legal Authority |
|--------|-------------|----------------|
| Agriculture | VAT, Excise, Import Surtax | Proc. 1341/2024 Sch. 2; Proc. 1186/2020 |
| Financial Services (banks, insurers) | VAT, TOT | Proc. 1341/2024 Sch. 1 |
| Education (private schools, universities) | VAT, TOT | Proc. 1341/2024 Sch. 1 |
| Healthcare (hospitals, clinics) | VAT | Proc. 1341/2024 Sch. 1 |
| NGOs / Non-profit (charitable activities) | BIT | Proc. 979/2016 Art. 8 |
| Manufacturing (capital goods imports) | Import Surtax | Investment Proc. 1180/2020 |
| Government entities | VAT, BIT | Proc. 979/2016 Art. 8 |

> All other sectors pay the full universal rates. Contact your MoR Regional Tax Office to register for a sector exemption and receive an exemption certificate.

---

## 2. Business Income Tax (BIT)

### Overview
| Parameter | Value |
|-----------|-------|
| Rate | 30% on net profit |
| Minimum Alternative Tax (MAT) | 2.5% of annual turnover — pay whichever is higher |
| Filing Deadline | November 7 (within 4 months of FY end) |
| Fiscal Year End | July 6/7 (Sene 30) |
| Advance Tax | Quarterly installments (25% each) |
| Withholding Tax — Services | 2% on payments ≥ ETB 500 |
| Withholding Tax — Goods | 2% on payments ≥ ETB 10,000 |
| Dividend Tax | 10% on distributed profits |
| Capital Gains | 15% on asset disposals |
| Cash Transaction Limit | ETB 30,000 — above this must be via bank/cheque |

### BIT Calculation
```
Taxable Income = Gross Revenue − Allowable Deductions
BIT             = Taxable Income × 30%
MAT             = Annual Turnover × 2.5%
Tax Payable     = MAX(BIT, MAT)
```

**Allowable Deductions:**
- Cost of goods sold
- Employee salaries and benefits
- Rent and utilities
- Depreciation (per ERCA schedule: buildings 5%, machinery 20%, vehicles 20%)
- Interest on business loans
- Pension contributions (employer portion)
- Insurance premiums (business only)
- Professional fees (audit, legal, accounting)
- Advertising and marketing expenses

**Non-Deductible Expenses:**
- Personal expenses
- Cash payments above ETB 30,000 (must be via bank/cheque to be deductible)
- Fines and penalties
- Dividends paid

### Provisional Tax (Quarterly Installments)
To avoid a lump-sum payment and 2%/month late-payment interest, pay quarterly:

| Quarter | Deadline | Amount |
|---------|----------|--------|
| Q1 | September 7 | 25% of estimated annual BIT |
| Q2 | December 7 | 25% of estimated annual BIT |
| Q3 | March 7 | 25% of estimated annual BIT |
| Q4 | June 7 | 25% of estimated annual BIT |

### Filing Workflow
1. **Prepare Financial Statements** — ensure P&L is finalized for the fiscal year
2. **Calculate BIT** — OVDS estimates BIT from the P&L; MAT is auto-applied if higher
3. **Adjust for Tax Differences** — add back non-deductible expenses
4. **Cross-check with VAT** — ERCA cross-references BIT declarations with VAT returns; consistent figures reduce audit risk
5. **File Return** — submit to ERCA via eTax portal by November 7
6. **Pay BIT** — record payment in OVDS with the bank reference

### Loss Carry-Forward
Corporate losses can be carried forward up to **3 years** to offset future taxable income. Record in OVDS under Business Income Tax → Prior Year Losses.

---

## 3. Disaster Risk Reduction Fund (DRRF)

Navigate to **Tax → Disaster Fund** (`/disaster-fund`) — requires `disaster_fund:read`.

### Overview
Governed by **Council of Ministers Regulation No. 570/2025**, effective July 7, 2025.

| Parameter | Value |
|-----------|-------|
| Rate | 1% – 5% depending on activity type |
| Filing Deadline | 15th of the last month of each quarter |
| Quarters | Q1: Oct 15, Q2: Jan 15, Q3: Apr 15, Q4: Jul 15 |
| Applies To | 17+ business activity categories |

### 17+ Levy Categories
| Category | Rate | Example Activities |
|----------|------|-------------------|
| Manufacturing | 1% | Textiles, food processing, metalwork |
| Construction | 2% | Building, infrastructure |
| Trade & Commerce | 1% | Wholesale, retail |
| Financial Services | 3% | Banking, insurance |
| Hospitality | 2% | Hotels, restaurants |
| Transport | 1.5% | Freight, passenger |
| Mining | 5% | Extraction activities |
| Telecommunications | 3% | ISPs, mobile operators |
| Healthcare | 1% | Private hospitals, clinics |
| Education | 1% | Private schools, universities |

### Auto-Generation from Activity
OVDS automatically calculates DRRF levies based on:
- Invoice amounts (for applicable activity types)
- Business type configured in company settings
- Transaction categories

### Quarterly Remittance Workflow
1. **Review** — go to Disaster Fund → current quarter
2. **Compute** — OVDS aggregates all applicable transactions
3. **Generate Report** — creates the DRRF remittance schedule
4. **Pay** — remit to ERCA by the quarterly deadline
5. **Record** — mark as paid in OVDS

---

## 4. IFRS Compliance

Navigate to **ovds → IFRS Dashboard** (`/ifrs`) — requires `ifrs_officer` role or `ovds:read`.

### IFRS Tiers (AABE)

| Tier | Criteria (meet 2 of 4) | Mandatory Since |
|------|----------------------|----------------|
| **Full IFRS (Tier 1)** | Turnover > ETB 300M **or** Employees > 200 **or** Assets > ETB 200M **or** Liabilities > ETB 200M | July 7, 2023 |
| **IFRS for SMEs (Tier 2)** | Turnover > ETB 20M **or** Employees > 20 **or** Assets > ETB 20M **or** Liabilities > ETB 20M | July 7, 2024 |
| **Micro-entity (Tier 3)** | Below Tier 2 thresholds | Outside IFRS scope |

Banks, insurance companies, and government-owned enterprises are **always Tier 1** regardless of size.

### IFRS Standards Supported

| Standard | Description | OVDS Feature |
|----------|-------------|--------------|
| IFRS 9 | Financial Instruments — ECL model | Expected Credit Loss calculator |
| IFRS 10 | Consolidated Financial Statements | Multi-company consolidation |
| IFRS 12 | Disclosure of Interests in Other Entities | Subsidiary disclosures |
| IFRS 15 | Revenue Recognition | Revenue schedule per contract |
| IFRS 16 | Leases | Right-of-use asset and lease liability |
| IAS 2 | Inventories — FIFO/WA (LIFO prohibited) | Inventory costing methods |
| IAS 16 | Property, Plant & Equipment | Fixed asset depreciation |
| IAS 36 | Impairment of Assets | Impairment testing |

### IFRS Configuration
Go to **Settings → IFRS** to configure:
- IFRS tier for your company
- Functional currency
- Presentation currency (for consolidated reports)
- Accounting policies (depreciation method, inventory costing)

---

## 5. Compliance Auditor Dashboard

Navigate to **Tax → Compliance Auditor** (`/compliance-auditor`) — requires `audit_logs:read`.

### Compliance Score
OVDS calculates a real-time compliance score (0–100) based on:
- VAT returns filed on time
- BIT filed on time
- DRRF remittances on time
- Payroll PIT remitted on time
- Pension contributions remitted on time
- Audit findings resolved

### Compliance Checks
| Check | Frequency | Alert Threshold |
|-------|-----------|----------------|
| VAT return filed | Monthly | 7 days before deadline |
| VAT payment made | Monthly | 3 days before deadline |
| DRRF remittance | Quarterly | 7 days before deadline |
| BIT filing | Annual | 14 days before deadline |
| Payroll PIT | Monthly | Last 3 days of month |
| Pension remittance | Monthly | Last 3 days of month |

---

## 6. Audit Outsourcing

Navigate to **Tax → Audit Outsourcing** (`/audit-outsourcing`) — requires `audit_outsourcing:read`.

### External Audit Management
For Tier 1 companies requiring statutory audits:

1. **Register Audit Firm** — add the external audit firm's details
2. **Create Engagement** — define scope, timeline, and fees
3. **Share Access** — grant `EXTERNAL_AUDITOR` role to audit firm users
4. **Audit Findings** — auditors record findings directly in OVDS
5. **Management Response** — management responds to each finding
6. **Management Letter** — auditors issue the final management letter
7. **Certification** — auditors certify the financial statements

### External Auditor Access
The `EXTERNAL_AUDITOR` role provides:
- Read-only access to all financial data
- Write access to audit findings and management letter
- Cannot modify any financial records
- All access is logged in the Audit Trail

---

## 7. Online Tax Reporting via E-Tax Portal

Ethiopian taxpayers file and pay taxes electronically through the **Ministry of Revenue (MoR) E-Tax portal** at [etax.erca.gov.et](https://etax.erca.gov.et). This applies to VAT, Turnover Tax (TOT), Withholding Tax, and Business Income Tax.

### Step-by-Step: Filing on the E-Tax Portal

| Step | Action | Details |
|------|--------|---------|
| 1 | **Access the portal** | Go to [etax.erca.gov.et](https://etax.erca.gov.et) |
| 2 | **Log in** | Enter your TIN, username, and password |
| 3 | **Navigate to Declaration** | Select **Tax Declaration** → choose tax type (VAT, TOT, Withholding) |
| 4 | **Fill in details** | Enter monthly sales, purchases, and income data |
| 5 | **Submit & confirm** | Review the entry, submit the form, and download the submission receipt |
| 6 | **Pay** | Use the generated payment slip to pay via a designated commercial bank or digital payment method |

### Net VAT Formula
```
Net VAT Payable = Output VAT − Input VAT

Output VAT > Input VAT  →  Pay to MoR/ERCA
Input VAT > Output VAT  →  VAT Refund (or carry forward)
```

### Zero Declaration (No-Transaction Months)
Even if your business had **no transactions** in a given month, you are legally required to file a **zero report** by the end of the following month. Failure to file — even a zero return — results in the standard late-filing penalty (ETB 500/day for VAT).

### Turnover Tax (TOT) — Category B Taxpayers
Businesses below the VAT registration threshold (ETB 2,000,000/year) pay TOT instead of VAT:

| TOT Type | Rate | Applies To |
|----------|------|-----------|
| TOT — Goods | 2% | Sale of goods |
| TOT — Services | 10% | Provision of services |

TOT is filed monthly on the E-Tax portal using the same declaration workflow as VAT.

**TOT Filing Workflow on E-Tax Portal:**
1. Log in to [etax.erca.gov.et](https://etax.erca.gov.et) with your TIN and password
2. Select **Tax Declaration → Turnover Tax**
3. Enter total monthly sales (goods and/or services separately)
4. The portal calculates: `TOT = Sales × Rate (2% or 10%)`
5. Submit and download the submission receipt
6. Pay via commercial bank or Telebirr using the generated payment slip
7. Record the payment reference in OVDS under **Tax Filing → Record Filing**

**TOT vs VAT — Key Differences:**

| | TOT (Category B) | VAT (Category A) |
|---|---|---|
| Threshold | Turnover < ETB 2,000,000/year | Turnover ≥ ETB 2,000,000/year |
| Rate | 2% (goods) / 10% (services) | 15% standard |
| Input credit | ❌ No input deduction | ✅ Input VAT deductible |
| Filing | Monthly | Monthly |
| Portal | E-Tax portal | E-Tax portal |

### Payment Methods After Filing
After submitting your declaration, pay using the generated payment slip via:
- Any designated **commercial bank** (CBE, Awash, Dashen, Abyssinia, etc.)
- **Telebirr** or other approved digital payment methods

Record the payment reference in OVDS under **Tax Filing → Record Filing** to keep your compliance score current.

### Key Requirements & Deadlines
| Tax | Filing Deadline | Zero Report Required |
|-----|----------------|---------------------|
| VAT | 30th of the following month | ✅ Yes |
| TOT | 30th of the following month | ✅ Yes |
| Withholding Tax | Monthly with VAT | ✅ Yes |
| Business Income Tax | November 7 | ✅ Yes |

### Documents to Prepare Before Filing
- All **sales invoices** for the period (with ERCA QR codes)
- All **purchase invoices** from VAT-registered vendors
- Bank statements for cross-referencing payment references
- Previous period's submission receipt (for carry-forward VAT credits)

### Support & Contact
| Channel | Details |
|---------|---------|
| Phone | +251 11 662 98 00 |
| Email | info.mor@mor.gov.et |
| Portal | [etax.erca.gov.et](https://etax.erca.gov.et) |
| Official site | [mor.gov.et](https://mor.gov.et) |

> **Note:** Tax laws and digital platforms change. Always verify deadlines and procedures on the official [Ministry of Revenue website](https://mor.gov.et).

### OVDS Integration with E-Tax Portal
OVDS streamlines the E-Tax filing workflow end-to-end:

**For VAT:**
1. **Compute VAT** in VAT Administration — OVDS aggregates all invoices and bills for the period
2. **Review** — verify Output VAT, Input VAT, and Net VAT totals
3. **Generate VAT Return** — creates the official return document (PDF)
4. **Submit to eTax** — click **Submit to eTax** in Tax Filing; OVDS logs the submission and opens the portal
5. **Pay** — use the portal's payment slip at a commercial bank or via Telebirr/CBE Pay
6. **Record Payment** — enter the bank reference in OVDS to close the filing and update the compliance score
7. **Download Receipt** — attach the portal submission receipt to the filing record for audit trail

**For TOT (Category B):**
1. Go to **Tax Filing → Record Filing** and select **Turnover Tax — Goods** or **Turnover Tax — Services**
2. Enter the period and total sales amount — OVDS calculates the TOT liability
3. Open the E-Tax portal and file the TOT declaration manually
4. Return to OVDS and update the filing status to **Submitted** with the portal reference number
5. After payment, update to **Paid** with the bank reference

**For WHT:**
1. OVDS auto-calculates WHT on all qualifying vendor payments (≥ ETB 500 for services, ≥ ETB 10,000 for goods)
2. Go to **Tax → WHT Certificates** to generate monthly WHT certificates for vendors
3. File the WHT return on the E-Tax portal
4. Record the remittance in OVDS with the payment reference

### Withholding Tax (WHT) — Online Filing
WHT is filed monthly alongside VAT on the E-Tax portal:

1. Log in to [etax.erca.gov.et](https://etax.erca.gov.et)
2. Select **Tax Declaration → Withholding Tax**
3. Enter total payments made to vendors and the WHT amounts withheld
4. Submit and download the WHT remittance receipt
5. Pay via commercial bank using the generated payment slip
6. In OVDS, go to **Tax Filing → Record Filing** and log the WHT submission with the portal reference

---

## 8. Tax Calendar

| Deadline | Tax | Action |
|----------|-----|--------|
| 30th of each month | VAT Return | File and pay monthly VAT via E-Tax portal |
| 30th of each month | TOT Return | File monthly TOT (Category B taxpayers) via E-Tax portal |
| 30th of each month | WHT Remittance | Remit withheld tax to ERCA via E-Tax portal (all WHT types) |
| 30th of each month | Non-Resident WHT | Remit 15% WHT on foreign service payments |
| 30th of each month | Schedule D WHT | Remit WHT on rent, royalties, casual income |
| 15th of last month of quarter | DRRF | Remit quarterly levy to EDRRFO |
| November 7 | BIT Annual Filing | File and pay annual income tax via E-Tax portal |
| Monthly (payroll date) | PIT | Remit employee income tax |
| Monthly (payroll date) | Pension | Remit employee + employer pension |
| At transaction | Dividend WHT (15%) | Withhold and remit on profit distribution |
| At transaction | Interest WHT (10%) | Withhold and remit on interest payments |
| At transaction | Stamp Duty (1%) | Pay at government office on qualifying documents |

> **Zero Declaration Rule:** All monthly taxes (VAT, TOT, WHT) require a filing even in months with zero transactions. File a zero return by the 30th of the following month to avoid penalties.

---

## 9. Pension Submissions

Navigate to **Tax Filing Portal → Pension Submissions** (`/tax/pension-submission`) — requires `payroll:read`.

Pension contributions are remitted monthly to ERCA alongside PIT. OVDS generates the submission schedule directly from the payroll run.

### Pension Rates
| Contribution | Rate | Basis | Cap |
|---|---|---|---|
| Employee | 7% | Basic salary | ETB 15,000 |
| Employer | 11% | Basic salary | ETB 15,000 |
| **Total remittance** | **18%** | Per employee | — |

### Submission Workflow
1. Run payroll for the month — OVDS calculates pension per employee automatically
2. Go to **Tax → Pension Submissions** → select the period
3. OVDS generates the POESSA-format pension schedule (employee name, pension number, amount)
4. Export the schedule as PDF or CSV
5. Remit via the ERCA eTax portal or bank transfer to the ERCA pension account
6. Record the payment reference in OVDS — status updates to **Remitted**
7. The pension remittance receipt is attached to the payroll record for audit

### Filing Deadline
Pension must be remitted on or before the payroll date each month. Late remittance incurs a **2%/month penalty** on the outstanding amount.

---

## 10. Payment Reference & MoR Vouchers

Navigate to **Tax Filing Portal → Payment Reference / Voucher** (`/tax/payment-reference`) — requires `vat:file`.

After filing any tax return on the eTax portal, OVDS generates a **payment reference** document for bank settlement.

### What It Contains
| Field | Description |
|---|---|
| Tax type | VAT / TOT / BIT / DRRF / WHT / Pension |
| Period | Month/quarter/year covered |
| Gross tax liability | Total before credits |
| Credits applied | Advance payments, input VAT, WHT |
| **Net amount due** | Amount to pay to ERCA |
| Payment deadline | Due date |
| eTax reference number | From the portal submission |
| Bank details | ERCA account for payment |

### Generating a Payment Reference
1. Complete a tax filing (VAT, BIT, TOT, DRRF, pension, or WHT)
2. Go to **Tax → Payment Reference** — select the filing
3. Click **Generate Voucher** — OVDS produces a printable PDF payment slip
4. Take the slip to any commercial bank (CBE, Awash, Dashen, etc.) or pay via Telebirr
5. Enter the bank's payment reference back into OVDS to close the filing

---

## 11. Compliance Sign-Off (Period Lock)

Navigate to **Audit Trail → Compliance Sign-Off** (`/period-close`) — requires `period_close:read`.

Once all declarations for a period are finalized, the reporting period is **locked** to prevent retroactive data tampering.

### What Locking Does
- Prevents any journal entries, invoices, or bills from being created or modified in the locked period
- All locked periods display a 🔒 indicator throughout OVDS
- Changes can only be made via a **Reversal Entry** in the next open period (full audit trail)
- Required before submitting audited financial statements to MoR

### Lock Workflow
1. Complete all period-end tasks (reconciliation, adjustments, depreciation, provisions)
2. File all mandatory returns for the period (VAT, PIT, pension, DRRF if applicable)
3. Go to **ovds → Period Close** → select the period
4. Review the period close checklist — all items must be green ✓
5. Click **Lock Period** — enter your password to confirm
6. The period is now read-only; the lock timestamp is recorded in the Audit Trail

### Unlocking a Period
If a correction is needed after locking:
- Only a user with `period_close:admin` permission can unlock
- Every unlock/relock is recorded in the Audit Trail with reason, user, and timestamp
- Best practice: post a correction in the next period instead of unlocking

---

## Navigation Flow

```
Tax & Compliance
├── VAT Administration    /vat-administration      (vat:read)
├── Tax Dashboard         /tax/dashboard           (vat:read)
├── e-Tax Declaration     /tax/etax-declaration    (vat:write)
├── TOT Filing            /tax/tot                 (vat:read)
├── Excise Tax            /tax/excise-tax          (vat:read)
├── Stamp Duty            /tax/stamp-duty          (vat:read)
│     1% on legal documents (min ETB 500)
├── Schedule D            /tax/schedule-d          (vat:read)
│     Rent, royalties, casual income, interest WHT
├── WHT Certificates      /tax/wht-certificates    (vat:write)
│     Monthly certificates per vendor — all WHT types
├── Penalty Calculator    /tax/penalty-calculator  (vat:read)
├── Business Income Tax   /business-income-tax     (bit:read)
├── Disaster Fund (DRRF)  /disaster-fund           (disaster_fund:read)
├── IFRS Dashboard        /ifrs                    (ovds:read)
├── Compliance Auditor    /compliance-auditor      (audit_logs:read)
└── Audit Outsourcing     /audit-outsourcing       (audit_outsourcing:read)

Phase 4 · Submit to MoR
├── e-Tax Declaration          /tax/etax-declaration   (vat:file)
├── Net Tax Report (All Types) /tax/filing             (vat:file)
├── Pension Submissions        /tax/pension-submission (payroll:read)
├── BIT Submission             /business-income-tax    (bit:file)
├── DRRF Quarterly             /disaster-fund          (disaster_fund:read)
├── Payment Reference/Voucher  /tax/payment-reference  (vat:file)
├── Audit Trail & IoT Logs     /audit-logs             (audit_logs:read)
├── Compliance Auditor         /compliance-auditor     (audit_logs:read)
└── Compliance Sign-Off        /period-close           (period_close:read)
```



