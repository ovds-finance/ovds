<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Company Profile & Tax Configuration

> **Part of:** [Settings](./README.md)
>
> **Requires:** Login · `settings:read` · `settings:write`
>
> **Navigate to:** **Administration → Settings** (`/settings`)

This is the foundation of every document OVDS produces — invoices, payslips, VAT returns, and the ERCA QR code all pull from these settings. Configure these before creating any transactions.

---

## Company Profile

Navigate to **Settings → Company Profile** (or **Setup → Company Settings → TIN & MoR Credentials** at `/settings/company-profile`).

### Required Fields

| Field | Description |
|-------|-------------|
| Company Name | Legal name as on MoR registration certificate — appears on all invoices and reports |
| TIN | 15-digit Ethiopian Tax Identification Number — embedded in ERCA QR codes |
| Address | Business address — appears on invoice headers |
| Phone / Email | Contact details on customer-facing documents |
| Logo | Uploaded logo — appears on all printed invoices, payslips, and reports |

### MoR Registration Details

| Field | Description | Required |
|-------|-------------|:--------:|
| Registered Company Name | Legal name exactly as on MoR certificate | ✅ |
| TIN | 15-digit TIN | ✅ |
| Branch Code | Branch identifier for multi-branch businesses | If applicable |
| VAT Registration Number | ERCA VAT registration number | If VAT-registered |
| eTax Username | Login for [etax.erca.gov.et](https://etax.erca.gov.et) | Recommended |
| eTax Password | Stored encrypted — used for portal pre-fill | Recommended |
| Business Category | A (VAT-registered, turnover ≥ ETB 2M) / B (TOT, below threshold) / C | ✅ |
| MoR Region | Regional tax office responsible for your entity | ✅ |
| AABE Tier | Tier 1 / Tier 2 / Tier 3 — determines IFRS reporting requirement | ✅ |

These credentials auto-populate:
- ERCA QR codes on all invoices and receipts
- BIT computation headers (TIN, category, taxable income)
- Pension submission schedules (POESSA format)
- VAT return filing headers

---

## Localization

Navigate to **Settings → Localization**.

| Setting | Options | Default |
|---------|---------|---------|
| Default Currency | ETB (Ethiopian Birr) + others | ETB |
| Timezone | Africa/Addis_Ababa and others | Africa/Addis_Ababa |
| Date Format | DD/MM/YYYY · MM/DD/YYYY · YYYY-MM-DD | DD/MM/YYYY |
| Fiscal Year Start | Any month — Ethiopian: July (Hamle 1) | July |
| Language | English · Amharic | English |
| Ethiopian Calendar | Enabled / Disabled | Enabled for ET locale |
| Discount Location | Line only · Total only · Both Line and Total | Total only |

### Ethiopian Calendar

When enabled, dates display in the Ethiopic calendar alongside Gregorian equivalents (e.g., Hamle 1, 2016 E.C.). The fiscal year follows the Ethiopian calendar — **Hamle 1 to Sene 30** (approximately July 7 to July 7 Gregorian). All report date ranges, VAT periods, BIT filing deadlines, and payroll months respect this calendar.

### Discount Location

Controls where discounts can be applied on invoices and bills:
- **Line only** — discounts on individual line items only
- **Total only** — a single discount applied to the whole document total (default)
- **Both Line and Total** — enables both; required for line-level discounts on invoices and bills

> Change this before creating invoices if you need line discounts. See [Creating an Invoice → Adding Discounts](../04-financial-ops/creating-an-invoice.md#adding-discounts-to-invoices).

---

## Ethiopian Tax Engine

Navigate to **Setup → Tax Configuration** (`/tax/dashboard`) — requires `vat:read`.

All Ethiopian statutory tax rates are pre-configured and applied automatically. You do not need to manually calculate any of these.

### VAT (Proclamation 1341/2024)

| Rate | Applies To |
|------|-----------|
| 15% | Standard-rated domestic supplies |
| 0% | Exports, basic food items |
| Exempt | Financial services, educational fees, healthcare |

Registration threshold: ETB 2,000,000/year. Below this, use TOT instead.

### Turnover Tax — TOT (Category B)

| Rate | Applies To |
|------|-----------|
| 2% | Sale of goods |
| 10% | Provision of services |

### Withholding Tax (Proclamation 1395/2025)

| Type | Rate | Threshold |
|------|------|-----------|
| Services — domestic | 2% | ≥ ETB 500 per payment |
| Goods — domestic | 2% | ≥ ETB 10,000 per payment |
| Non-resident services | 15% | Any amount |
| Corporate rent | 30% | Any amount |
| Individual rent | 15% | Any amount |
| Dividend | 15% | Any amount |
| Interest | 10% | Any amount |

### Pension Contributions (Proclamation 1395/2025)

| Contribution | Rate | Monthly Salary Cap |
|---|:---:|---|
| Employee | 7% | ETB 15,000 |
| Employer | 11% | ETB 15,000 |

### Personal Income Tax — Schedule A

| Monthly Taxable Income (ETB) | Rate | Deductible (ETB) |
|------------------------------|:----:|:----------------:|
| 0 – 600 | 0% | 0 |
| 601 – 1,650 | 10% | 60 |
| 1,651 – 3,200 | 15% | 142.50 |
| 3,201 – 5,250 | 20% | 302.50 |
| 5,251 – 7,800 | 25% | 565.00 |
| 7,801 – 10,900 | 30% | 955.00 |
| Over 10,900 | 35% | 1,500.00 |

**Formula:** `PIT = (Taxable Salary × Rate) − Deductible Amount`
Taxable salary = Gross salary − Employee pension (7%).

### Business Income Tax (BIT)

| Parameter | Value |
|-----------|-------|
| Rate | 30% on net taxable profit |
| Minimum Alternative Tax (MAT) | 2.5% of annual turnover — pay whichever is higher |
| Filing Deadline | November 7 |
| Advance Tax | Quarterly — Sep 7, Dec 7, Mar 7, Jun 7 |

### Seeding Tax Rates

If this is a fresh install, seed the default Ethiopian rates:

1. Go to **Settings → Taxes → Seed Ethiopian Defaults**, or
2. Call `POST /ovds/tax-rates/seed-et` via the API.

Custom rates (tourism levy, sector excise, foreign jurisdiction) can be added under **Settings → Tax Rates**.

---

## Invoice Customization

Navigate to **Settings → invoice tab**.

### Template Settings

| Setting | Description |
|---------|-------------|
| Header | Company logo, name, address, TIN |
| Footer | Payment instructions, bank details, terms and conditions |
| Color Scheme | Primary accent color for the invoice header |
| Font | Document font family |
| ERCA QR Code | Automatically included on all invoices — NBE-IQR format |

### Invoice Numbering

| Setting | Example |
|---------|---------|
| Prefix | `INV-` or `2026-` |
| Starting Number | `1001` |
| Format | `{PREFIX}{YEAR}{NUMBER}` → `INV-2026-1001` |

The number auto-increments with each new invoice. Change the prefix per fiscal year if needed.

### Payment Terms

Default payment terms applied to all new invoices:

| Term | Days |
|------|-----:|
| Due on Receipt | 0 |
| Net 15 | 15 |
| Net 30 | 30 |
| Net 60 | 60 |
| Net 90 | 90 |

Custom terms can be added. The due date is calculated from the invoice date automatically.

---

## White-Label Settings

Available to ADMIN and SPURADMIN only.

| Setting | Description |
|---------|-------------|
| Application Name | Replaces "OVDS" in the UI and emails |
| Sidebar Logo | Custom logo in the sidebar and login page |
| Primary Color | Custom UI accent color |
| Custom Domain | Requires DNS CNAME configuration |

---

## Penalty Calculator

Navigate to **Tax → Penalty Calculator** (`/tax/penalty-calculator`).

Estimates late-filing and late-payment penalties for any tax type before you file. Useful for budgeting when a deadline has passed.

Enter: tax type, original deadline, and filing/payment date → the calculator shows the estimated penalty.

---

## Related Topics

> **Lifecycle context:** Company tax configuration is [Phase 1 — Setup](../FILING-LIFECYCLE.md#2-phase-1--data-capture) of the Digital Automated Filing Lifecycle. All tax rates, thresholds, and deadlines are centralized in [`CORE-CONFIG.md`](../CORE-CONFIG.md#7-tax-rate--deadline-summary). The penalty calculator integrates with [`FILING-LIFECYCLE.md`](../FILING-LIFECYCLE.md#11-error-handling--recovery).

| Topic | Where to go |
|-------|-------------|
| System Administration Setup checklist | [System Administration Setup](./system-administration-setup.md) |
| Banking and payment gateway setup | [Banking & Payments Settings](./banking-and-payments.md) |
| SMTP email configuration | [Notifications & API Settings](./notifications-and-api.md) |
| Invoice template per-invoice color | [Creating an Invoice → Changing the Color](../04-financial-ops/creating-an-invoice.md#changing-the-color-of-an-invoice) |
| VAT filing workflow | [Tax & Compliance → VAT & TOT](../06-tax-compliance/vat-and-tot.md) |
| IFRS tier configuration | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md) |



