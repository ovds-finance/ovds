<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Settings

> **Part of:** [OVDS Documentation](../README.md) › Settings
>
> **Related modules:** [Getting Started](../01-getting-started/INSTALL.md) · [Users & Roles](../02-users-roles/README.md) · [Tax & Compliance](../06-tax-compliance/README.md)

System-wide configuration for your OVDS instance. Requires `settings:read` to view, `settings:write` to modify. Most settings are stored in the `SystemSetting` key-value table and take effect immediately without a restart.

---

## Standalone Guides

| Guide | Description |
|-------|-------------|
| [Company Profile & Tax Configuration](./company-and-tax.md) | TIN/MoR credentials, localization, Ethiopian Calendar, full tax rate tables (VAT, WHT, PIT, BIT, Pension), invoice numbering, payment terms |
| [System Administration Setup](./system-administration-setup.md) | 14-phase setup wizard covering deployment, company, financial, modules, users, and system controls |
| [Banking, Currencies & Payment Gateways](./banking-and-payments.md) | FX rates, bank account setup, Telebirr, Chapa, CBE Pay, Stripe configuration |
| [Email, Notifications, API Keys & App Store](./notifications-and-api.md) | SMTP, email templates, Slack, geofencing, API key scopes, App Store extensions |

---

---

## 1. General Settings

Navigate to **Administration → Settings** (`/settings`).

### Company Profile
- **Company Name** — displayed on invoices, payslips, and reports
- **TIN (Tax Identification Number)** — 15-digit Ethiopian TIN, required for VAT invoices
- **Logo** — uploaded logo appears on all printed documents
- **Address** — used on invoice headers and ERCA QR codes
- **Phone / Email** — contact details on customer-facing documents

### Localization
| Setting | Options | Default |
|---------|---------|---------|
| Currency | ETB (Ethiopian Birr) + others | ETB |
| Timezone | Africa/Addis_Ababa + others | Africa/Addis_Ababa |
| Date Format | DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD | DD/MM/YYYY |
| Fiscal Year Start | Any month (Ethiopian: July 7 — Hamle 1) | July |
| Language | English, Amharic | English |
| Ethiopian Calendar | Enabled / Disabled | Enabled for ET locale |

**Ethiopian Calendar:** When enabled, dates display in the Ethiopic calendar (e.g., Hamle 1, 2016 E.C.) alongside Gregorian equivalents. The fiscal year follows the Ethiopian calendar — Hamle 1 to Sene 30 (≈ July 7 to July 7 Gregorian). All report date ranges, VAT periods, BIT filing deadlines, and payroll months respect this calendar.

### Number Formatting
- Decimal separator: `.` (period)
- Thousands separator: `,` (comma)
- Currency position: prefix (ETB 1,500.00)

---

## 2. TIN & MoR Credentials

Navigate to **Setup → Company Settings → TIN & MoR Credentials** (`/settings/company-profile`) — requires `settings:write`.

Stores the legal registration details used in all tax filings and ERCA communications.

| Field | Description | Required |
|---|---|---|
| Registered Company Name | Legal name as on MoR registration certificate | ✅ |
| TIN | 15-digit Ethiopian Tax Identification Number | ✅ |
| Branch Code | Branch identifier (for multi-branch businesses) | If applicable |
| VAT Registration Number | ERCA VAT registration (if registered) | If VAT-registered |
| eTax Username | Login username for [etax.erca.gov.et](https://etax.erca.gov.et) | Recommended |
| eTax Password | Stored encrypted; used for portal pre-fill | Recommended |
| Business Category | A / B / C (determines tax filing type) | ✅ |
| MoR Region | Tax office branch responsible for the entity | ✅ |
| AABE Tier | Tier 1 / Tier 2 / Tier 3 (IFRS classification) | ✅ |

These credentials auto-populate:
- ERCA QR codes on all invoices
- BIT computation (TIN, category, taxable income)
- Pension submission schedules (POESSA format)
- VAT return headers

**Setup Wizard:** If you haven't filled these in yet, go to **Setup → Setup Wizard** (`/getting-started`) — it walks through company profile, tax registration, bank accounts, and first invoice in a guided 5-step flow.

---

## 3. Ethiopian Tax Engine

Navigate to **Setup → Tax Configuration** (`/tax/dashboard`) — requires `vat:read`.

Pre-configured tax rates for all Ethiopian statutory obligations. Rates are applied automatically to invoices, bills, and payroll — no manual calculation needed.

### VAT (Proclamation 1341/2024)
| Rate | Description | Applies To |
|------|-------------|-----------|
| 15% | Standard rate | Domestic taxable supplies |
| 0% | Zero-rated | Exports, basic food items |
| Exempt | Non-taxable | Financial services, educational fees |

**Registration threshold:** ETB 2,000,000/year turnover. Below this, use TOT instead.

### Turnover Tax — TOT
| Rate | Applies To |
|------|-----------|
| 2% | Sale of goods (Category B) |
| 10% | Provision of services (Category B) |

### Withholding Tax (WHT) — Proclamation 1395/2025
| Payment Type | Rate | Threshold |
|---|---|---|
| Services to registered businesses | 2% | ≥ ETB 500 per transaction |
| Goods payments | 2% | ≥ ETB 10,000 per transaction |
| Dividend payments | 10% | Any amount |
| Capital gains | 15% | On asset disposal |

WHT is auto-calculated on bills when the vendor has a TIN and the payment meets the threshold. WHT Certificates are generated monthly under **Purchases → WHT Certificates** (`/tax/wht-certificates`).

### Pension Contributions (Proclamation 1395/2025)
| Contribution | Rate | Salary Cap |
|---|---|---|
| Employee | 7% | ETB 15,000 |
| Employer | 11% | ETB 15,000 |

Deducted automatically on every payroll run. Submitted monthly via **Tax → Pension Submissions** (`/tax/pension-submission`).

### Personal Income Tax (PIT) — Schedule A
| Monthly Taxable Income (ETB) | Rate | Deductible (ETB) |
|---|---|---|
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
|---|---|
| Rate | 30% on net taxable profit |
| Minimum Alternative Tax (MAT) | 2.5% of annual turnover |
| Tax payable | MAX(BIT, MAT) |
| Filing deadline | November 7 (Hidar 1 E.C.) |
| Advance tax | Quarterly — Sep 7, Dec 7, Mar 7, Jun 7 |

### Excise Tax & Stamp Duty
Custom rates for sector-specific excise taxes and stamp duty can be added under **Tax → Tax Configuration → Custom Rates**.

### Penalty Calculator (`/tax/penalty-calculator`)
Estimates late-filing and late-payment penalties for any tax type before filing. Useful for budgeting when a deadline has been missed.

---

## 4. Tax Rates (Custom)

Go to **Settings → Tax Rates** to add rates beyond the pre-configured Ethiopian engine:
- Tourism levy
- Sector-specific excise rates
- Foreign jurisdiction rates (for international operations)

---

## 5. Payment Terms

Default payment terms applied to new invoices and bills.

| Term | Days | Description |
|------|------|-------------|
| Due on Receipt | 0 | Payment due immediately |
| Net 15 | 15 | Payment due in 15 days |
| Net 30 | 30 | Payment due in 30 days |
| Net 60 | 60 | Payment due in 60 days |
| Net 90 | 90 | Payment due in 90 days |

Custom terms can be added. The due date is calculated from the invoice date.

---

## 6. Currencies & Banking Setup

Navigate to **Setup → Currencies & Banking** — requires `banking:read`.

### Currencies & FX Rates (`/fx-rates`)
- Set **Default Currency** to ETB
- Add additional currencies (USD, EUR, GBP) for import/export businesses
- Configure exchange rate source: manual entry or live rate feed
- IAS 21 FX differences are calculated automatically on foreign-currency transactions

### Bank Accounts Setup (`/banking/accounts`)
Add all company bank accounts before recording transactions:

| Ethiopian Bank | SWIFT Code |
|---|---|
| Commercial Bank of Ethiopia (CBE) | CBETETAA |
| Awash Bank | AWAIETAA |
| Dashen Bank | DASHETAA |
| Abyssinia Bank | ABYSETAA |
| Wegagen Bank | WEGAETAA |
| Bank of Abyssinia | ABYSETAA |

1. Go to **Accounting → Banks → New Bank Account**
2. Enter bank name, account number, account name, currency, opening balance
3. Set as **Default** if it is the primary operating account

### Digital Wallets — Telebirr (`/settings/digital-wallets`)

| Field | Description |
|---|---|
| Telebirr Business ID | Your Ethio Telecom merchant ID |
| API Key | From the Telebirr Business Portal |
| Webhook URL | `https://your-domain.com/api/webhooks/telebirr` |
| Auto-match invoices | Enable to auto-reconcile incoming Telebirr payments |

**Setup steps:**
1. Register on the [Telebirr Business Portal](https://business.telebirr.com)
2. Obtain your Business ID and API key
3. Enter credentials in **Settings → Digital Wallets**
4. Configure the webhook URL in the Telebirr portal
5. Test with a sandbox transaction

### Chapa Payment Gateway (`/settings/payment-gateways/chapa`)

| Field | Description |
|---|---|
| Public Key | From [Chapa Dashboard](https://dashboard.chapa.co) |
| Secret Key | Stored encrypted |
| Webhook URL | `https://your-domain.com/api/webhooks/chapa` |
| Currency | ETB (default) |
| Auto-post receipts | Enable to auto-mark invoices as paid on successful charge |

**Setup steps:**
1. Create an account at [chapa.co](https://chapa.co)
2. Go to Dashboard → API Keys → copy public and secret keys
3. Enter in **Settings → Payment Gateways → Chapa**
4. Set the webhook URL in your Chapa dashboard
5. Test with a test charge before going live

Both Telebirr and Chapa appear as payment options in the **Client Portal** and on the **Record Payment** dialog.

---

## 7. IoT / Device Registry Setup

Navigate to **Setup → IoT & POS Devices** — requires `api_docs:read`.

Before IoT features can be used in Daily Operations, register every MoR-approved fiscal device.

### Enabling the IoT Module
1. Go to **App Store** (`/app-store`) → install **IoT Module**
2. IoT menu groups appear in the sidebar under Daily Operations and Developer sections

### Registering a Device (`/iot/devices`)
1. Click **New Device**
2. Fill in:

| Field | Description |
|---|---|
| Device ID | Hardware serial number |
| Device Type | Fiscal Printer / POS Terminal / Smart Meter / GPS Tracker / Warehouse Scanner |
| MoR Approval # | ERCA/TASS approval number (mandatory for fiscal devices) |
| Location | Branch or warehouse |
| GL Account | Account for transactions from this device |
| API Token | Generated by OVDS for device authentication |

3. Click **Test Connection** — OVDS sends a ping to verify the device is reachable
4. Set status to **Active**

### Fiscal Printer Configuration
MoR-approved fiscal printers must be registered in both OVDS and the TASS portal:
1. Register in OVDS (above)
2. Log in to [TASS portal](https://tass.erca.gov.et) and register the device serial
3. OVDS cross-references the TASS registration number on every receipt

### IoT API Endpoint
Devices send events to:
```
POST https://your-domain.com/api/iot/events
Authorization: Bearer <device_token>
```
Full schema in **Developer → API Documentation** (`/api-docs`).

---

## 8. Invoice Customization & White-Label

### Invoice Template
- **Header** — company logo, name, address, TIN
- **Footer** — payment instructions, bank details, terms
- **Color Scheme** — primary color for invoice header
- **Font** — document font family
- **ERCA QR Code** — automatically included on all invoices (NBE-IQR format)

### White-Label Settings (ADMIN/SPURADMIN only)
- Custom application name (replaces "OVDS")
- Custom logo in the sidebar and login page
- Custom primary color for the UI
- Custom domain (requires DNS configuration)

### Invoice Numbering
- **Prefix** — e.g., `INV-`, `2026-`
- **Starting Number** — e.g., `1001`
- **Format** — `{PREFIX}{YEAR}{NUMBER}` → `INV-2026-1001`
- Auto-increments on each new invoice

---

## 9. Email / SMTP Configuration

Configure outbound email for invoice delivery, payslips, and system notifications.

### SMTP Settings
```
Host:     smtp.mailtrap.io (or your provider)
Port:     587 (TLS) or 465 (SSL)
Username: your_smtp_username
Password: your_smtp_password
From:     noreply@yourcompany.com
From Name: Your Company Name
```

### Email Templates
Customizable templates for:
- Invoice sent to customer
- Payment received confirmation
- Payslip delivery
- Leave approval/rejection
- Password reset
- System alerts

Go to **Administration → Email Templates** (`/email-templates`) to edit templates. Supports variables like `{{customerName}}`, `{{invoiceNumber}}`, `{{amount}}`.

---

## 10. Geofencing & Attendance Settings

Configure location-based attendance verification.

### Geofence Setup
1. Go to **Settings → Attendance**
2. Enter the workplace coordinates (latitude, longitude)
3. Set the allowed radius (meters) — default: 100m
4. Enable **Geofence Enforcement** to require location check-in

### Attendance Methods
| Method | Description | Setup Required |
|--------|-------------|----------------|
| Mobile App | GPS-based check-in via browser | Geofence coordinates |
| QR Code | Scan QR at entrance | Print QR from Settings |
| Biometric | Fingerprint/face via device | Enrollment (`/enrollment`) |
| Manual | HR manually records attendance | No setup |

### Working Hours
- Define standard working hours per shift
- Configure overtime thresholds
- Set grace period for late arrivals (minutes)

---

## 11. Notification Settings (Admin Only)

Go to **Administration → Notification Settings** (`/admin/notifications-settings`).

### Channels
| Channel | Use Case | Setup |
|---------|----------|-------|
| Email (SMTP) | Invoices, payslips, alerts | SMTP credentials above |
| Slack | Team alerts, deadline reminders | Slack webhook URL |
| Intercom | Customer support integration | Intercom app ID |
| In-App | Real-time WebSocket notifications | No setup required |

### Notification Campaigns
Create targeted notification campaigns for:
- Payment reminders to customers
- Payroll processing alerts to HR
- Tax deadline reminders to ovds
- System maintenance notices

---

## 12. API Keys

Navigate to **Settings → API Keys** (`/settings?tab=api-keys`) — requires `settings:read`.

Generate API keys for external integrations and automation:

| Field | Description |
|-------|-------------|
| Name | Descriptive label (e.g., "Zapier Integration") |
| Scopes | Permissions granted (e.g., `invoices:read`, `payroll:read`) |
| Expires In | 30, 90, 180, 365 days, or Never |
| Prefix | First 8 characters shown for identification |

**Available Scopes:**
- `invoices:read` / `invoices:write`
- `payroll:read`
- `employees:read`
- `reports:read`
- `vat:read`
- `settings:read`

> API keys are shown **once** at creation. Copy and store them securely.

---

## 13. App Store & Extensions

Navigate to **Administration → App Store** (`/app-store`).

| Extension | Description |
|---|---|
| 2FA Authenticator | TOTP-based two-factor authentication |
| IoT Module | Fiscal printers, POS, sensors, telematics |
| Address Finder | Ethiopian address autocomplete |
| Live Currency | Real-time ETB exchange rates |
| Calendar Integration | Sync with Google Calendar |
| Telebirr Gateway | Ethio Telecom mobile money integration |
| Chapa Gateway | Online payment processing |
| CBE Pay | Commercial Bank of Ethiopia gateway |

---

## Settings Quick Reference

| Setting | Route | Permission |
|---------|-------|------------|
| Company profile & TIN | `/settings/company-profile` | `settings:write` |
| Localization & Calendar | `/settings` | `settings:write` |
| Ethiopian Tax Engine | `/tax/dashboard` | `vat:read` |
| Currencies & FX | `/fx-rates` | `ovds:read` |
| Bank Accounts Setup | `/banking/accounts` | `banking:read` |
| Digital Wallets (Telebirr) | `/settings/digital-wallets` | `banking:read` |
| Chapa Gateway | `/settings/payment-gateways/chapa` | `apps:read` |
| IoT Device Registry | `/iot/devices` | `api_docs:read` |
| Invoice template | `/settings` → Invoices tab | `settings:write` |
| SMTP email | `/settings` → Email tab | `settings:write` |
| Geofencing | `/settings` → Attendance tab | `settings:write` |
| White-label | `/settings` → Branding tab | ADMIN/SPURADMIN |
| API Keys | `/settings?tab=api-keys` | `settings:read` |
| Notification channels | `/admin/notifications-settings` | `notifications:config` |
| App Store | `/app-store` | `apps:write` |
| Setup Wizard | `/getting-started` | `settings:read` |
| System Administration Setup | `/settings/setup-wizard` | `settings:read` |
| Business Registration | `/business-registration` | `settings:write` |
| Users & Roles | `/users` | `users:read` |
| Role Permissions | `/role-permissions` | `role_permissions:read` |
| Deployment Mode | `/getting-started/cloud` or `/getting-started/on-premise` | `system:config` |



