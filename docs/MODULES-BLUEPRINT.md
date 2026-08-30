<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](./CORE-CONFIG.md)
     📌 FILING LIFECYCLE: [docs/FILING-LIFECYCLE.md](./FILING-LIFECYCLE.md)
     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](./subscription%20and%20monitaizetion.md)
     📌 MONOREPO ARCH: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
     📌 TECHNICAL ARCH: [docs/09-developers/modular-architecture.md](./09-developers/modular-architecture.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](./UBIQUITOUS-LANGUAGE.md)
     🔄 Last synced: 2026-08-27 -->

# OVDS Module Ecosystem — Functional Blueprint

> **Platform:** OVDS — Online VAT Declaration System & Full SaaS
> **Target:** Ethiopian businesses (Category A, B, C) with IFRS + MoR/ERCA/AABE compliance
> **Design principle:** Inspired by Akaunting's modular UI/UX logic — a clean dashboard, widgetized layout, and double-entry visual flows, adapted for Ethiopian tax compliance.

This document is the complete functional blueprint of all primary modules within the OVDS ecosystem, organized by business function. Each module maps to a dedicated documentation section, a backend NestJS domain library, a frontend React feature library, a route namespace, an RBAC permission group, and a `ModuleApp` provider in `@ovds/core`.

## Core Module System

The OVDS platform is built on the `@ovds/core` module kernel. Every installable module is a `ModuleApp` subclass that declares its metadata, dependencies, routes, menus, settings, and permissions. The `ModuleRegistry` manages the full lifecycle:

1. **Registration** — Modules subscribe to core events and declare their routes, menus, settings, and permissions.
2. **Dependency Resolution** — `ModuleRegistry.getDependencyOrder()` performs topological sort based on `dependsOn`.
3. **Entitlement Check** — `ModuleRegistry.isEntitled()` verifies the module's `subscriptionTiers` against the current tenant's subscription.
4. **Boot** — Modules start background jobs, warm caches, and initialize domain services.
5. **Event Dispatch** — Modules communicate via the `EventBusInterface` using pipeline events.

### Blueprint Module Providers

All 7 primary blueprint modules have dedicated `ModuleApp` providers in `packages/core/src/modules/`:

| Provider | Module | Install Type |
|----------|--------|--------------|
| `SalesModuleProvider` | sales | core |
| `PurchasesModuleProvider` | purchases | core |
| `BankingModuleProvider` | banking | core |
| `ItemsModuleProvider` | items | core |
| `DoubleEntryModuleProvider` | double-entry | app |
| `TaxModuleProvider` | tax | core |
| `HrModuleProvider` | hr | app |

### Pipeline Events

The integrated accounting pipeline is driven by domain events emitted through the `EventBusInterface`:

| Event | Source Module | Description |
|-------|--------------|-------------|
| `pipeline.deal.won` | CRM | A sales deal has been won |
| `pipeline.invoice.created` | Sales | Invoice auto-populated from deal |
| `pipeline.invoice.paid` | Sales | Customer payment received |
| `pipeline.bank.deposited` | Banking | Payment deposited to bank account |
| `pipeline.journal.posted` | Double-Entry | Journal entry posted to ledger |
| `pipeline.vat.computed` | Tax | VAT computed for period |
| `pipeline.drrf.computed` | Tax | DRRF computed for period |
| `pipeline.report.generated` | Double-Entry | Financial statements generated |
| `pipeline.tax.filed` | Tax | Tax return submitted |
| `pipeline.period.closed` | Double-Entry | Accounting period closed |

---

## Module Categories at a Glance

| # | Category | Modules | Backend Library | Frontend Feature | Module Provider | Install Type |
|---|----------|---------|-----------------|-------------------|-----------------|--------------|
| 1 | Accounts Receivable & Payable (Sales) | Invoices, Revenues, Customers, Estimates | `@ovds/sales` | `features/sales/` | `SalesModuleProvider` | Core |
| 2 | Accounts Receivable & Payable (Purchases) | Bills, Payments, Vendors, Purchase Orders | `@ovds/purchases` | `features/purchases/` | `PurchasesModuleProvider` | Core |
| 3 | General Ledger & Core Accounting (Banking) | Accounts, Transfers, Reconciliations, Live Feeds | `@ovds/banking` | `features/banking/` | `BankingModuleProvider` | Core |
| 4 | Inventory & Asset Management | Items Database, Categories, Inventory | `@ovds/inventory` | `features/inventory/` | `ItemsModuleProvider` | Core |
| 5 | General Ledger & Core Accounting (Advanced) | Double-Entry, Tax, Compliance Apps | `@ovds/accounting`, `@ovds/tax` | `features/accounting/`, `features/tax/` | `DoubleEntryModuleProvider`, `TaxModuleProvider` | Core + App |
| 6 | HR & Internal Ops | Employees, Payroll, Assets, CRM | `@ovds/hr`, `@ovds/crm` | `features/hr/`, `features/crm/` | `HrModuleProvider` | App |
| 7 | Core System & Customization | System & Settings, White-Label, Import Pro | `@ovds/core`, `@ovds/settings` | `features/settings/` | `SettingsModuleProvider` | Core |

---

## 1. Accounts Receivable & Payable (Sales)

Manages outward customer relationships, revenue recognition, and incoming cash flow. Core module — included in all subscription plans.

### Capabilities

| Capability | Description | Key Docs |
|-----------|-------------|----------|
| **Invoices** | Generate, customize, and issue billing documents. Auto-posts double-entry journal entries and computes 15% VAT + 5% DRRF at creation. Supports recurring schedules, credit notes, partial payments, and client portal sharing. | [creating-an-invoice](04-financial-ops/creating-an-invoice.md) |
| **Revenues** | Manually log direct cash income that does not require a formal invoice. Posts to revenue accounts with optional tax withholding. | [managing-invoices](04-financial-ops/managing-invoices.md) |
| **Customers** | Central directory storing client profiles, localized tax settings (TIN, WHT exemptions), credit scores (AAA–EEE), loyalty tiers (Platinum/Gold/Silver/Bronze), and historical ledgers. | [customers-and-vendors](04-financial-ops/customers-and-vendors.md) |
| **Estimates/Quotes** | Issue pricing sheets to prospects with expiration dates. Converts into invoices upon approval with one-click conversion and full line-item preservation. Estimates are not posted to the general ledger until converted. | [estimates-and-sales-orders](04-financial-ops/estimates-and-sales-orders.md) |

### Feature Breakdown

| Feature | Module | Permission | Route | Compliance Standard |
|---------|--------|-----------|-------|---------------------|
| Create invoice | Sales | `invoices:write` | `/invoices` | IFRS 15, ERCA e-Invoice (NBE-IQR) |
| Record customer payment | Banking | `fund_transfers:read` | `/payment-tracker` | — |
| Generate credit note | Sales | `invoices:write` | `/credit-notes` | IAS 37 (provision for returns) |
| Send invoice via email | Sales | `invoices:write` | `/invoices/:id/send` | — |
| Share invoice (client portal) | Sales | `invoices:read` | `/invoices/:id/share` | — |
| Recurring invoices | Sales | `invoices:write` | `/invoices` | — |
| Invoice estimates/quotes | Sales | `invoices:write` | `/estimates` | IFRS 15 (revenue not recognized until conversion) |
| Customer 360 view | CRM | `crm:read` | `/customer-summary` | — |
| Credit hold management | Collections | `OVDS:read` | `/payment-tracker` | IAS 37 (expected credit loss) |
| Customer statements | Sales | `invoices:read` | `/customers/:id/statements` | — |
| Sales receipts (POS) | Sales | `invoices:write` | `/receipts` | ERCA QR (Directive No. 1142/2026) |
| Sales orders | Sales | `invoices:read` | `/sales-orders` | IFRS 15 (performance obligations) |
| Invoice approval workflow | Sales | `invoices:approve` | `/invoices` | Segregation of duties |

---

## 2. Accounts Receivable & Payable (Purchases)

Tracks supplier networks, procurement pipelines, and outward business expenses. Core module — included in all subscription plans.

### Capabilities

| Capability | Description | Key Docs |
|-----------|-------------|----------|
| **Bills** | Record invoices received from suppliers for raw materials, utilities, or services. Auto-calculates withholding tax (2% services ≥ETB 500, 2% goods ≥ETB 10,000) and posts to input VAT ledger for monthly VAT filing. | [creating-a-bill](04-financial-ops/creating-a-bill.md) |
| **Payments** | Log cash, check, or wire transfers exiting bank accounts. Supports Telebirr, Chapa, CBE Pay, and commercial bank integrations. Auto-reconciles to outstanding bills and creates split entries for gateway fees. | [payments-and-gateways](04-financial-ops/payments-and-gateways.md) |
| **Vendors** | Directory for suppliers, contractors, and distribution partners. Each vendor has TIN, bank details, WHT certificates, and transaction history. | [customers-and-vendors](04-financial-ops/customers-and-vendors.md#vendors) |
| **Purchase Orders** *(App)* | Official intent-to-buy documents issued to vendors prior to billing. Full lifecycle: Draft → Submitted → Approved → Received → Billed → Closed. Supports three-way matching (PO + GRN + Bill) and goods receipt notes. | [purchase-orders](04-financial-ops/purchase-orders.md) |

### Feature Breakdown

| Feature | Module | Permission | Route | Compliance Standard |
|---------|--------|-----------|-------|---------------------|
| Create vendor bill | Purchases | `bills:write` | `/purchases/bills` | ERCA e-Invoice |
| Record bill payment | Banking | `fund_transfers:read` | `/payment-tracker` | — |
| Withholding tax (WHT) auto-calc | Purchases | `bills:write` | `/purchases/bills` | WHT Proclamation No. 1395/2025 |
| Input VAT posting | Tax | `vat:read` | `/vat` | Input VAT ledger (Regulation No. 570/2025) |
| Vendor management | Purchases | `bills:read` | `/purchases/vendors` | TIN validation (15 chars) |
| WHT certificate upload | Purchases | `bills:write` | `/tax/wht-certificates` | MoR WHT receipt |
| Purchase order lifecycle | Purchases | `purchase_orders:write` | `/purchases/orders` | Three-way match |
| GRN (Goods Received Note) | Purchases | `bills:write` | `/purchases/grn` | — |
| Debit note creation | Purchases | `bills:write` | `/purchases/debit-notes` | IAS 37 |
| Supplier statements | Purchases | `bills:read` | `/vendors/:id/statements` | — |
| Bill approval workflow | Purchases | `bills:approve` | `/purchases/bills` | Segregation of duties |
| Scanned receipt upload (OCR) | Purchases | `bills:write` | `/purchases/scanned-bills` | Audit trail (10-year retention) |

---

## 3. General Ledger & Core Accounting (Banking)

The financial hub that mirrors physical monetary accounts and tracks actual liquidity. Core module — included in all subscription plans.

### Capabilities

| Capability | Description | Key Docs |
|-----------|-------------|----------|
| **Accounts** | Monitor checking accounts, savings lines, corporate credit cards, petty cash, and digital wallets (Telebirr, Chapa). Each account has an opening balance and `computedBalance` that auto-updates on every transaction. | [bank-accounts](05-banking/bank-accounts.md) |
| **Transfers** | Move funds internally between accounts without triggering false income/expense logs. Auto-posts a balanced journal entry (Dr destination / Cr source) atomically. | [banking-module-flow](05-banking/banking-module-flow.md) |
| **Reconciliations** | Match internal database transactions against physical bank statement uploads (CSV/OFX). AI-assisted suggestion engine with manual override and bulk reconcile API. | [bank-reconciliation](05-banking/bank-reconciliation.md) |
| **Live Bank Feeds** *(App)* | Automatically pull electronic transaction data straight from global financial institutions via Plaid/Yodlee or local bank APIs. Transactions appear as PENDING and are matched to journal entries. | [digital-payments](05-banking/digital-payments.md) |

### Feature Breakdown

| Feature | Module | Permission | Route | Compliance Standard |
|---------|--------|-----------|-------|---------------------|
| Add bank account | Banking | `banking:write` | `/banking/accounts` | IAS 7 (cash flow) |
| Manual transaction | Banking | `bank_reconciliation:write` | `/transactions` | — |
| Fund transfer | Banking | `fund_transfers:write` | `/fund-transfers` | IAS 7 (inter-account) |
| Bank reconciliation | Banking | `bank_reconciliation:write` | `/bank-reconciliation` | IAS 7, audit trail |
| Bank statement import | Banking | `bank_statement_import:write` | `/bank-statement-import` | ERCA audit |
| Bulk reconcile | Banking | `bank_reconciliation:write` | `/bank-accounts/bulk-reconcile` | — |
| Payment batch export | Treasury | `OVDS:write` | `/payment-tracker` | CBE bulk upload |
| Digital payment (Telebirr) | Banking | `banking:read` | `/banking/digital-payments` | NBE-IQR, ETB 30,000 limit |
| Cash flow forecast | Treasury | `OVDS:read` | `/treasury-forecast` | IAS 7 (cash flow statement) |

---

## 4. Inventory & Asset Management

The centralized data layer for everything your business buys, sells, or stocks. Inventory extension is a paid App.

### Capabilities

| Capability | Description | Key Docs |
|-----------|-------------|----------|
| **Items Database** | Store master item names, sale/purchase prices, default tax classifications (15% VAT, 5% DRRF), SKU/EAN barcodes, costing method, and unit of measure. | [items-catalog](04-financial-ops/items-catalog.md) |
| **Categories** | Group items or services into hierarchical folders for segmented business reports. Supports parent-child relationships and per-category default tax rates. | [items-catalog](04-financial-ops/items-catalog.md) |
| **Inventory** *(App Extension)* | Expands the items catalog to track multi-warehouse physical stock counts, product variations (sizes/colors), automated low-stock reorder thresholds, and IAS 2-compliant FIFO/weighted-average valuation. | [items-catalog](04-financial-ops/items-catalog.md) |

### Feature Breakdown

| Feature | Module | Permission | Route | Compliance Standard |
|---------|--------|-----------|-------|---------------------|
| Create item | Items | `items:write` | `/items` | IAS 2 (cost measurement) |
| Update item price | Items | `items:write` | `/items` | — |
| Item variants (size/color) | Inventory | `inventory:write` | `/items` | IAS 2 |
| Multi-warehouse tracking | Inventory | `inventory:write` | `/inventory` | IAS 2 (separate location) |
| Stock transfer | Inventory | `inventory:write` | `/inventory` | IAS 2 (movement) |
| Reorder alerts | Inventory | `inventory:read` | `/items` | — |
| FIFO/WA valuation | Inventory | `inventory:read` | `/inventory/valuation` | IAS 2 (cost formula) |
| Stock adjustment (audit trail) | Inventory | `inventory:write` | `/items/:id/adjust-stock` | IAS 2 (physical verification) |
| Barcode scanning (POS) | Inventory | `items:read` | `/items` | ERCA QR |

---

## 5. General Ledger & Core Accounting (Advanced)

Transforms OVDS from a basic single-entry cash tracker into an audit-ready, IFRS-compliant platform.

### Capabilities

| Module | Description | Key Docs |
|--------|-------------|----------|
| **Double-Entry** *(App)* | Implements traditional debit/credit bookkeeping rules with immutable journal entries. Unlocks corporate financial reports: Balance Sheet, General Ledger, Trial Balance, Cash Flow, and Notes to Financials. Required for Tier 1 & 2 IFRS entities. | [general-ledger-and-journals](04-financial-ops/general-ledger-and-journals.md) |
| **Tax Module** | Built-in logic for multi-layered Ethiopian tax frameworks: compound rates, inclusive/exclusive calculations, reverse-charge VAT, withholding tax (2% services, 2% goods, 15% non-resident), TOT, DRRF (17+ levy categories), and automated tax reporting through the e-Tax/SIGTAS portal. | [vat-and-tot](06-tax-compliance/vat-and-tot.md) |
| **Compliance Apps** | Localized legal extensions engineered to meet specific national mandates: UK MTD, European SAF-T, Ethiopian e-Invoice (ERCA QR/NBE-IQR), and country-specific electronic invoicing protocols. | [ifrs-and-audit](06-tax-compliance/ifrs-and-audit.md) |

### Feature Breakdown

| Feature | Module | Permission | Route | Compliance Standard |
|---------|--------|-----------|-------|---------------------|
| Chart of Accounts | Accounting | `OVDS:write` | `/accounting` | IAS 1 (presentation) |
| Manual journal entry | Accounting | `OVDS:write` | `/accounting/journal-entries` | IAS 10 (events after period) |
| Balance Sheet | Accounting | `reports:bs:read` | `/reports?type=bs` | IAS 1 |
| General Ledger | Accounting | `reports:gl:read` | `/reports?type=gl` | IAS 1 |
| Trial Balance | Accounting | `reports:gl:read` | `/reports?type=trial-balance` | IAS 1 |
| Cash Flow Statement | Accounting | `reports:cf:read` | `/reports?type=cf` | IAS 7 |
| VAT computation | Tax | `vat:calculate` | `/vat` | ERCA Regulation No. 570/2025 |
| VAT filing (submit) | Tax | `vat:file` | `/tax/etax-declaration` | e-Tax/SIGTAS |
| WHT calculation | Tax | `vat:write` | `/tax/wht-certificates` | Proclamation No. 1395/2025 |
| DRRF levy auto-gen | Tax | `disaster_fund:write` | `/disaster-fund` | Regulation No. 570/2025 |
| DRRF quarterly schedule | Tax | `disaster_fund:write` | `/disaster-fund/schedule` | EDRRFO |
| Income tax (BIT) filing | Tax | `bit:file` | `/business-income-tax` | Proclamation No. 1395/2025 |
| Period close / lock | Accounting | `period_close:write` | `/period-close` | IAS 10 |
| IFRS compliance checklist | Compliance | `audit_logs:read` | `/compliance-auditor` | AABE Proclamation 847/2014 |

---

## 6. HR & Internal Operations Modules

Extends the financial platform into workforce and productivity management. Apps require Professional tier or above.

### Capabilities

| Module | Description | Key Docs |
|--------|-------------|----------|
| **Employees** *(App)* | Central payroll profiles tracking personnel contact data, hire records, emergency contacts, KYC/TIN, department, shift assignments, bank details, pension rates, and employment type. | [hr-and-payroll](08-advanced/hr-and-payroll.md) |
| **Payroll** *(App)* | Execute custom pay runs with automatic Ethiopian PIT slab calculation (Proclamation No. 1395/2025), pension contributions (7% employee / 11% employer, capped at ETB 15,000), loan deductions, overtime, bonuses, and payslip generation. Approval workflow: Generate → Verify → Finalize → Approve → Pay. | [hr-and-payroll](08-advanced/hr-and-payroll.md) |
| **Assets** *(App)* | Track company-owned hardware assets (laptops, machinery, vehicles) assigned to specific employee custodians. Supports IAS 16 depreciation schedules (SLM/DB/Units of Production) and disposal tracking. | [fixed-assets](04-financial-ops/fixed-assets.md) |
| **CRM** *(App)* | Manage potential leads, track active business opportunities through a Kanban sales pipeline, and instantly convert "Won" deals into invoice records with Customer 360 credit scoring and loyalty tiers. | [crm-and-pipeline](08-advanced/crm-and-pipeline.md) |

### Feature Breakdown

| Feature | Module | Permission | Route | Compliance Standard |
|---------|--------|-----------|-------|---------------------|
| Employee CRUD | HR | `employees:write` | `/employees` | Labour Proclamation 1156/2019 |
| Attendance (check-in/out) | HR | `attendance:write` | `/attendance` | Geofencing, biometric |
| Leave management | HR | `leaves:write` | `/leaves` | 22-day annual entitlement |
| Shift scheduling | HR | `shifts:write` | `/shifts` | — |
| Holiday calendar | HR | `holidays:write` | `/shifts` | — |
| Run payroll | Payroll | `payroll:generate` | `/payroll` | PIT/Pension Proclamation 1395/2025 |
| Approve payroll | Payroll | `payroll:approve` | `/payroll-administration` | Segregation of duties |
| Payroll bulk upload | Payroll | `payroll:admin` | `/payroll-administration` | — |
| Generate payslip | Payroll | `payroll:export` | `/payroll` | ERCA payslip format |
| Add fixed asset | Assets | `fixed_assets:write` | `/fixed-assets` | IAS 16 |
| Depreciation schedule | Assets | `fixed_assets:write` | `/fixed-assets/depreciation` | IAS 16 |
| Create CRM lead | CRM | `crm:write` | `/crm/contacts` | — |
| Deal pipeline (Kanban) | CRM | `crm:write` | `/crm/pipeline` | — |
| Convert deal to invoice | CRM | `crm:deals:write` | `/crm/pipeline` | IFRS 15 |
| Customer 360 credit score | CRM | `crm:read` | `/customer-summary` | Bank loan eligibility |

---

## 7. Core System & Customization Modules

The administrative control panels used to scale, brand, and import data into the software ecosystem.

### Capabilities

| Module | Description | Key Docs |
|--------|-------------|----------|
| **System & Settings** | Core dashboard for localized timezones (Africa/Addis_Ababa), fiscal year (Hamle 1 → Sene 30), company metadata, tax rates, chart of accounts, currencies, FX rates, mail SMTP setups, geofencing, user access roles, and notification templates. | [company-and-tax](03-settings/company-and-tax.md) |
| **White-Label** *(App)* | Rebrand the interface entirely with corporate logos, color patterns, custom login portals, invoice templates, and payslip branding. Configurable via `WhiteLabelSettings.tsx`. | [company-and-tax](03-settings/company-and-tax.md) |
| **Import Pro** *(App)* | Bulk ingestion engines for importing customer lists, vendor sheets, item catalogs, employee rosters, opening balances, and legacy logs via Excel/CSV formats with column mapping and validation. | [data-import-export](04-financial-ops/data-import-export.md) |

### Feature Breakdown

| Feature | Module | Permission | Route | Notes |
|---------|--------|-----------|-------|-------|
| Company profile | Settings | `settings:write` | `/settings` | TIN, legal name, address |
| Tax configuration | Settings | `vat:write` | `/settings/company-profile` | VAT 15%, WHT 2%, BIT 30% |
| Chart of accounts seed | Settings | `OVDS:write` | `/accounting` | `POST /api/OVDS/accounts/seed` |
| Currency & FX rates | Settings | `OVDS:write` | `/fx-rates` | IAS 21 compliance |
| SMTP configuration | Settings | `notifications:config` | `/admin/notifications-settings` | Silent skip if `MAIL_USER` unset |
| Timezone & fiscal year | Settings | `settings:write` | `/settings` | Africa/Addis_Ababa, Hamle start |
| RBAC role management | Settings | `role_permissions:write` | `/role-permissions` | 22 roles, 150+ permissions |
| White-label branding | White-Label | `settings:write` | `/settings/white-label` | Logo, colors, invoice footer |
| Custom invoice templates | White-Label | `OVDS:write` | `/settings` | ERCA QR, IRN, MoR QR |
| Bulk data import | Import Pro | `settings:write` | `/import` | CSV/Excel with validation |
| User management | Settings | `users:write` | `/users` | 5 failed logins → lockout |
| App Store | Core | `apps:read` | `/app-store` | Module install/uninstall |
| Audit log export | Settings | `audit_logs:write` | `/audit-logs/export` | CSV, 90-day retention |
| Period close lock | Settings | `period_close:write` | `/period-close` | IAS 10 cut-off enforcement |

---

## Module Dependency Matrix

The table below shows which core libraries each module depends on. Modules marked *(App)* are independently installable; core modules are always active. Arrows (→) indicate data flow during auto-posting.

| Module | Depends On | Data Emits To | Install Type |
|--------|-----------|---------------|--------------|
| Sales | `@ovds/core`, `@ovds/shared`, `@ovds/database`, `@ovds/contracts` | → Double-Entry (journal), → Tax (VAT/DRRF), → Banking (payments), → CRM (Customer 360), → Collections (aging) | Core |
| Purchases | `@ovds/core`, `@ovds/shared`, `@ovds/database`, `@ovds/contracts` | → Double-Entry (journal), → Tax (input VAT/WHT), → Banking (payments) | Core |
| Banking | `@ovds/core`, `@ovds/shared`, `@ovds/database`, `@ovds/contracts` | → Double-Entry (journal), → Reports (cash flow) | Core |
| Items & Inventory | `@ovds/core`, `@ovds/shared`, `@ovds/database`, `@ovds/contracts` | → Sales (stock decrement), → Purchases (COGS), → Reports (valuation) | Core + App |
| Double-Entry | `@ovds/core`, `@ovds/shared`, `@ovds/database`, `@ovds/contracts`, Sales, Purchases, Banking | → Reports (BS, P&L, GL, CF), → Tax (VAT ledger), → Compliance (audit trail) | App |
| Tax | `@ovds/core`, `@ovds/shared`, `@ovds/database`, `@ovds/contracts`, Sales, Purchases, Double-Entry | → VatService (raw SQL tables), → DisasterFund, → Reports | Core |
| Compliance Apps | `@ovds/core`, `@ovds/tax`, `@ovds/accounting` | → Reports, → Audit Outsourcing | App |
| Employees | `@ovds/core`, `@ovds/shared`, `@ovds/database`, `@ovds/contracts` | → Payroll, → Attendance, → CRM (customer 360) | App |
| Payroll | `@ovds/core`, `@ovds/hr`, `@ovds/employees`, `@ovds/shared`, `@ovds/database` | → Double-Entry (salary expense), → Tax (PIT, pension), → Banking (bank transfer) | App |
| Assets | `@ovds/core`, `@ovds/accounting`, `@ovds/shared` | → Double-Entry (depreciation), → IFRS (IAS 16) | App |
| CRM | `@ovds/core`, `@ovds/sales`, `@ovds/shared`, `@ovds/database` | → Sales (deal conversion), → Reports (pipeline) | App |
| System & Settings | `@ovds/core`, `@ovds/shared`, `@ovds/database` | → All modules (global config) | Core |
| White-Label | `@ovds/settings`, `@ovds/core` | → Frontend (branding) | App |
| Import Pro | `@ovds/core`, `@ovds/shared`, `@ovds/database` | → All modules (bulk data) | App |

---

## Compliance Alignment Matrix

Each module maps to Ethiopian fiscal regulations and relevant IFRS standards. This matrix helps compliance officers verify coverage.

| Module | Ethiopian Law | IFRS Standard | AABE Tier |
|--------|--------------|---------------|-----------|
| Invoices | Proclamation 1341/2024 (VAT), Regulation 570/2025 (e-Invoice QR) | IFRS 15 (Revenue Recognition) | Tier 1, 2 |
| Customers | Proclamation 1395/2025 (WHT, Credit) | IAS 37 (Provisions), IFRS 9 (ECL) | Tier 1, 2 |
| Bills | Proclamation 1395/2025 (WHT) | IAS 37, IAS 21 (FX) | Tier 1, 2 |
| Banking | Directive No. 1142/2026 (offline), NBE forex rules | IAS 7 (Cash Flow), IAS 21 (FX) | Tier 1, 2 |
| Items / Inventory | — | IAS 2 (Inventories) | Tier 1, 2 |
| Double-Entry | Proclamation 847/2014 (IFRS mandate) | IAS 1, IAS 10, IFRS 15, IFRS 16, IFRS 9 | Tier 1, 2 |
| Tax | Regulation 570/2025 (VAT, DRRF), Proclamation 1395/2025 (WHT, BIT) | IAS 12 (Income Tax), IAS 37 | Tier 1, 2 |
| Compliance Apps | ERCA e-Invoice, MTD (UK), SAF-T (EU) | — | Regional |
| Employees | Labour Proclamation 1156/2019 | IAS 19 (Employee Benefits) | Tier 1, 2 |
| Payroll | Proclamation 1395/2025 (PIT, Pension) | IAS 19, IAS 2 (overtime) | Tier 1, 2 |
| Assets | Proclamation 847/2014 (IFRS) | IAS 16 (PPE) | Tier 1, 2 |
| CRM | — | IFRS 15 | Tier 1, 2 |
| System & Settings | Proclamation 847/2014 (AABE), Regulation 332/2014 | IAS 1 | Tier 1, 2, 3 |
| White-Label | — | — | All |
| Import Pro | — | IAS 8 (Accounting Policies) | Tier 1, 2 |

---

## Integrated Data Pipeline

The primary advantage of the module network is how data flows natively between apps without data silos. Every transaction triggers a cascade of automatically posted journal entries, real-time dashboard updates, and compliance scoring — all governed by tenant isolation and RBAC.

```
┌──────────────────────────────────────────────────────────────────┐
│  1. CRM Deal Won                                                │
│  CRM (App) → Sales Module                                      │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────┴─────────────────────────────────────────┐
│  2. Auto-Populates Invoice                                    │
│  • Invoice created with line items preserved                  │
│  • Double-Entry journal auto-posted:                        │
│    Dr Accounts Receivable  = totalAmount                    │
│    Cr Sales Revenue        = subtotal                       │
│    Cr VAT Payable          = vatAmount (15%)               │
│    Cr DRRF Payable         = drrfAmount (5% annual sales)│
│  • Stock decremented (if tracked)                            │
│  • Customer 360 credit score recalculated                    │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼  Customer Pays
┌──────────────────────┴─────────────────────────────────────────┐
│  3. Payment & Bank Deposit                                   │
│  • Payment recorded via Telebirr/Chapa/CBE/ Bank Transfer    │
│  • Bank transaction created                                │
│  • Invoice status auto-updated → PAID                        │
│  • Payment auto-matched to bank statement (reconciliation) │
│  • Deposited to [Bank Account]                             │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────┴─────────────────────────────────────────┐
│  4. Period-End & Compliance                                  │
│  • VAT computed: Output VAT − Input VAT → net payable         │
│  • DRRF computed: 17+ levy categories from transaction data    │
│  • Financial statements auto-generated:                        │
│    Balance Sheet • P&L • Cash Flow • Trial Balance           │
│  • Compliance score updated (0–100)                           │
│  • e-Tax/SIGTAS submission (automated or export for manual)  │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

```
[CRM Deal Won]
     ↓
Auto-Populates → [Invoice] → (Customer Pays) → Deposited to [Bank Account]
     ↓                        ↘ auto-matched → [Bank Reconciliation]
     ↓                        ↘ journal entry → [General Ledger]
     ↓
[Period Close] → [Financial Reports] → [VAT/DRRF Filing] → [e-Tax Submission]
     ↑
Updates Core Ledger ←─────────────────────────────────────────┘
```

### Backend-to-Frontend Data Pipeline (technical)

```
React client → oRPC / REST API contracts
       ↓
Core System (@ovds/core): Events • Providers • Settings • Menu
       ↓
Domain Libraries (@ovds/modules/*, @ovds/domains/*): Services • Entities • DTOs
       ↓
Prisma + MySQL (company-scoped by CompanyGuard)
```

Every transaction follows this chain:
1. A React client triggers a REST/oRPC action using shared DTOs (`@ovds/dto`).
2. A NestJS controller delegates to a domain service.
3. The service commits the transaction atomically via `prisma.$transaction([...])`, posts accounting/tax side effects via `AccountingService`, and emits a domain event.
4. The WebSocket gateway broadcasts an `OVDS:lifecycle` payload to the company room and dashboard room.
5. Connected clients update queues, dashboards, notifications, and approval surfaces without a page refresh.

---

## Module Installation & Entitlement

All modules (denoted with *(App)*) are installed via the **OVDS App Store** and gated by subscription entitlements:

1. **Browse** — Navigate to **Administration → App Store** (`/app-store`) or press `G → A`.
2. **Install** — Click **Install** on any module. Free modules install immediately; paid modules redirect to the subscription checkout.
3. **Configure** — After installation, a setup wizard guides configuration (tax rates, chart of accounts, bank accounts, team roles).
4. **Enable per company** — Modules are toggled on/off per company via **Module CRUD** in the subscription management panel.
5. **Entitlement enforcement** — The `EntitlementGuard` on the backend and RBAC on the frontend ensure that uninstalled or expired modules are inaccessible server-side — the UI never trusts client state.

> **Core modules** (Invoices, Customers, Vendors, Bills, Items, Banking) are included in all plans. **Apps** (Double-Entry, CRM, Payroll, Inventory, White-Label, etc.) require Professional tier or higher. See [subscription and monetization](subscription%20and%20monitaizetion.md) for plan details.

---

## Technical Module Contract

Each installable module implements the `ModuleInterface` defined in `@ovds/core`. This contract ensures consistent lifecycle management, dependency resolution, and feature discovery across the ecosystem.

```typescript
export interface ModuleInterface {
  info: ModuleInfo;              // name, displayName, version, category, dependsOn
  register(eventBus): void;      // Subscribe to events (core.module.enabled, etc.)
  boot(container): void;         // Start background jobs, warm caches
  routes(): ModuleRoute[];       // Paths this module owns
  menus(): MenuItem[];           // Navigation entries
  settings(): ModuleSetting[];   // Configuration keys
  permissions(): ModulePermission[]; // RBAC permissions
  migrations?: string[];         // Prisma migration seeds
  health?(): Promise<ModuleHealth>;
}
```

**Core events** (`CORE_EVENTS` in `@ovds/core`):
- `core.module.registered` — Module registered with the registry
- `core.module.booted` — Module finished booting
- `core.module.enabled` — Module toggled on per company
- `core.module.disabled` — Module toggled off per company
- `core.settings.updated` — System settings changed
- `core.company.created` — New company registered
- `core.user.created` — New user added
- `core.menu.built` — Navigation menu rebuilt

---

## Entity Lifecycle Diagrams

Each core business entity follows a defined state machine. Status transitions are enforced at the service layer and trigger downstream actions (email notifications, compliance scoring, report generation).

### Invoice Lifecycle

```
CREATED (DRAFT) → SENT (PENDING) → PAID  ──────────────────────┐
      │                      ↘ PARTIAL  ↘ OVERDUE             │
      │                                 ↘                     │
      │                                   ↘ CANCELLED          │
      │                                     ↗                  │
      └─────────────────────────────→ REFUNDED (credit note) ◄──┘
```

| Status | Trigger | Auto-Action | RBAC |
|--------|---------|-------------|------|
| `DRAFT` | Invoice created | Journal posted (Dr AR, Cr Revenue/VAT/DRRF) | `invoices:write` |
| `PENDING` | Sent to customer | Email sent, share token generated | `invoices:write` |
| `PAID` | Payment ≥ total | Status auto-set, AR reduced | `invoices:write` |
| `OVERDUE` | Past due date | Reminder scheduled | System (cron) |
| `CANCELLED` | Voided before payment | Journal reversed | `invoices:approve` |
| Refunded via `CN-` | Credit note issued | Contra-journal posted | `invoices:write` |

### Bill Lifecycle

```
DRAFT → RECEIVED (PENDING) → PAID ──→ CLOSED
                ↘ PARTIAL
                ↘ OVERDUE
                ↘ CANCELLED
```

| Status | Trigger | Auto-Action | RBAC |
|--------|---------|-------------|------|
| `DRAFT` | Bill created | Input VAT journal posted | `bills:write` |
| `PENDING` | Received from vendor | WHT auto-calculated | `bills:write` |
| `PAID` | Payment recorded | AP reduced, WHT remitted | `bills:write` |
| `OVERDUE` | Past due date | Alert triggered | System |
| `CANCELLED` | Voided | Journal reversed | `bills:approve` |

### VAT Filing Lifecycle

```
COMPUTED → REVIEWED → SUBMITTED → ACKNOWLEDGED
     ↘ DRAFT
       ↘ (loop back to REVIEWED for corrections)
```

| Status | Trigger | Auto-Action | RBAC |
|--------|---------|-------------|------|
| `DRAFT` | Period opened | VAT ledger queried | `vat:read` |
| `COMPUTED` | Compute clicked | Output/Input VAT summed | `vat:calculate` |
| `REVIEWED` | Review confirmed | e-Tax payload validated | `vat:write` |
| `SUBMITTED` | Submit clicked | ERCA reference generated | `vat:file` (OVDS only) |
| `ACKNOWLEDGED` | ERCA confirms | Filing locked | System |

### Payroll Lifecycle

```
GENERATED → VERIFIED → FINALIZED → APPROVED → PAID
```

| Status | Trigger | Auto-Action | RBAC |
|--------|---------|-------------|------|
| `GENERATED` | Run payroll | Salary records created, journal posted | `payroll:generate` |
| `VERIFIED` | Review confirmed | Data locked for changes | `payroll:verify` |
| `FINALIZED` | Final check | Ready for approval | `payroll:finalize` |
| `APPROVED` | Approved | Payslips released, PDF generated | `payroll:approve` (OVDS) |
| `PAID` | Bank transfer confirmed | Payment recorded | System |

### Purchase Order Lifecycle

```
DRAFT → SUBMITTED → APPROVED → RECEIVED → BILLED → CLOSED
                    ↘ REJECTED
```

| Status | Trigger | Auto-Action | RBAC |
|--------|---------|-------------|------|
| `DRAFT` | PO created | — | `purchase_orders:write` |
| `SUBMITTED` | Sent to vendor | Approval workflow started | `purchase_orders:approve` |
| `APPROVED` | Approved | GRN enabled | `purchase_orders:approve` |
| `RECEIVED` | Goods received | Stock incremented | `inventory:write` |
| `BILLED` | Bill linked | PO linked to AP | `bills:write` |
| `CLOSED` | Fully billed/received | PO locked | System |

### DRRF Contribution Lifecycle

```
PENDING → REMITTED
PENDING → OVERDUE
```

| Status | Trigger | Auto-Action | RBAC |
|--------|---------|-------------|------|
| `PENDING` | Auto-generated | Due date set | `disaster_fund:write` |
| `REMITTED` | Payment recorded | Journal posted (Dr DRRF Payable, Cr Cash) | `disaster_fund:write` |
| `OVERDUE` | Due date < now | Alert + compliance score penalty | System (cron) |

---

## Subscription Tier Matrix

The OVDS App Store enforces feature gating through subscription entitlements. Core modules are always available; Apps require Professional or EntSaaSrise tier.

| Module | Free/Trial | Starter | Professional | EntSaaSrise |
|--------|-----------|---------|-------------|------------|
| Invoices | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Customers | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Vendors | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Bills | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Items Database | ✅ 50 items | ✅ 500 items | ✅ 5,000 items | ✅ Unlimited |
| Banking (Accounts) | ✅ 2 | ✅ 5 | ✅ 25 | ✅ Unlimited |
| Bank Reconciliation | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Revenues | ✅ | ✅ | ✅ Full | ✅ Full |
| Estimates/Quotes | ✅ | ✅ | ✅ Full | ✅ Full |
| Payments | ✅ | ✅ Full | ✅ Full | ✅ Full |
| Double-Entry *(App)* | ❌ | ❌ | ✅ Full | ✅ Full |
| Tax Module | ✅ VAT only | ✅ +WHT | ✅ Full | ✅ Full |
| Compliance Apps | ❌ | ❌ | ✅ Regional (ET) | ✅ All regions |
| Purchase Orders *(App)* | ❌ | ✅ | ✅ Full | ✅ Full |
| Inventory *(App Extension)* | ❌ | ❌ | ✅ 1 warehouse | ✅ Multi-warehouse |
| Employees *(App)* | ❌ | ✅ 25 | ✅ 500 | ✅ Unlimited |
| Payroll *(App)* | ❌ | ✅ 25 | ✅ 500 | ✅ Unlimited |
| Assets *(App)* | ❌ | ❌ | ✅ Full | ✅ Full |
| CRM *(App)* | ❌ | ✅ | ✅ Full | ✅ Full |
| White-Label *(App)* | ❌ | ❌ | ❌ | ✅ Full |
| Import Pro *(App)* | ❌ | ✅ 100 rows | ✅ 10,000 rows | ✅ Unlimited |
| Live Bank Feeds *(App)* | ❌ | ❌ | ✅ 3 banks | ✅ Unlimited |

---

## Key Data Models per Module

### Sales Module Models

| Prisma Model | Key Fields | Purpose |
|-------------|-----------|---------|
| `Invoice` | `id`, `customerName`, `totalAmount`, `vatAmount`, `drrfAmount`, `status`, `dueDate`, `companyId` | Billing document |
| `InvoiceItem` | `invoiceId`, `description`, `quantity`, `unitPrice`, `taxRateId` | Line items |
| `InvoicePayment` | `invoiceId`, `amount`, `paymentSource`, `reference`, `telecomRef` | Payment records |
| `InvoiceActivity` | `invoiceId`, `action`, `performedBy`, `details` | Lifecycle audit trail |

### Purchases Module Models

| Prisma Model | Key Fields | Purpose |
|-------------|-----------|---------|
| `Bill` | `id`, `vendorId`, `totalAmount`, `vatAmount`, `whtAmount`, `status`, `dueDate`, `companyId` | Supplier invoice |
| `Vendor` | `id`, `name`, `tin`, `email`, `bankName`, `accountNumber` | Supplier directory |
| `PurchaseOrder` | `id`, `vendorId`, `status`, `totalAmount`, `approvedBy` | Intent-to-buy |
| `WhtCertificate` | `billId`, `certificateNumber`, `amount`, `period` | Withholding tax certificate |

### Banking Module Models

| Prisma Model | Key Fields | Purpose |
|-------------|-----------|---------|
| `BankAccount` | `id`, `name`, `type`, `openingBalance`, `accountNumber`, `companyId` | Monetary account |
| `BankTransaction` | `bankAccountId`, `date`, `description`, `amount`, `type`, `status` | Transaction record |
| `ReconciliationMatch` | `transactionId`, `journalEntryId`, `amount`, `status` | Reconciliation link |
| `CashForecast` | `period`, `projected`, `low`, `high`, `confidence` | Cash flow projection |

### Items & Inventory Models

| Prisma Model | Key Fields | Purpose |
|-------------|-----------|---------|
| `Item` | `id`, `name`, `sku`, `unitPrice`, `costPrice`, `taxRateId`, `trackInventory`, `stockQuantity`, `categoryId` | Product/service catalog |
| `ItemCategory` | `id`, `name`, `parentId`, `companyId` | Hierarchical grouping |
| `InventoryWarehouse` | `id`, `name`, `location`, `companyId` | Warehouse location |
| `StockTransfer` | `itemId`, `fromWarehouseId`, `toWarehouseId`, `quantity` | Internal movement |

### Accounting & Compliance Models

| Prisma Model | Key Fields | Purpose |
|-------------|-----------|---------|
| `Account` | `code`, `name`, `type` (ASSET/LIABILITY/EQUITY/INCOME/EXPENSE), `category`, `companyId` | Chart of Accounts |
| `JournalEntry` | `id`, `date`, `description`, `reference`, `companyId` | Ledger posting |
| `JournalLine` | `journalEntryId`, `accountId`, `debit`, `credit`, `narration` | Debit/credit lines |
| `TaxRate` | `name`, `rate`, `type` (VAT/WHT/BIT/DRRF), `appliesTo` | Tax configuration |
| `VatFiling` | `period`, `outputVat`, `inputVat`, `netPayable`, `status`, `eTaxReference` | VAT declaration |
| `IncomeTaxFiling` | `fiscalYear`, `netProfit`, `taxPayable`, `paid`, `balanceDue` | BIT declaration |

### HR & Payroll Models

| Prisma Model | Key Fields | Purpose |
|-------------|-----------|---------|
| `Employee` | `id`, `firstName`, `lastName`, `employeeId`, `baseSalary`, `departmentId`, `shiftId`, `bankName`, `accountNumber`, `payrollStatus` | Personnel record |
| `Department` | `id`, `name`, `managerId`, `companyId` | Org structure |
| `Attendance` | `employeeId`, `checkIn`, `checkOut`, `status` (PRESENT/LATE/ABSENT), `method` | Time tracking |
| `PayrollRecord` | `employeeId`, `year`, `month`, `grossTotal`, `incomeTax`, `employeePension`, `netPay`, `status` | Salary calculation |
| `Leave` | `employeeId`, `type`, `startDate`, `endDate`, `status`, `approvedBy` | Leave management |

### CRM Models

| Prisma Model | Key Fields | Purpose |
|-------------|-----------|---------|
| `Contact` | `id`, `name`, `type` (LEAD/PROSPECT/CUSTOMER), `email`, `phone`, `companyId` | Contact directory |
| `Deal` | `id`, `contactId`, `value`, `stage`, `probability`, `closeDate` | Opportunity pipeline |
| `CustomerInteraction` | `customerId`, `type`, `summary`, `outcome`, `performedBy` | Interaction history |
| `CreditHold` | `customerId`, `heldAt`, `releasedAt`, `reason` | Credit block |

---

## Module Cross-Reference Map

Each module's key integration points with other modules. Arrows (→) indicate the direction of automated data flow.

| Module | Emits Data To | Receives Data From | Shared Events |
|--------|--------------|-------------------|---------------|
| **Sales** | → Accounting (journal), → Tax (VAT/DRRF split), → Banking (payment), → CRM (customer 360), → Collections (aging), → Reports (revenue) | ← CRM (deal → invoice), ← Items (price lookup), ← Banking (payment confirmation) | `invoice.created`, `invoice.paid` |
| **Purchases** | → Accounting (journal), → Tax (input VAT/WHT), → Banking (payment), → Inventory (stock), → Reports (expenses) | ← Banking (reconciliation), ← Items (cost), ← Vendors (profile) | `bill.created`, `bill.paid` |
| **Banking** | → Accounting (journal), → Reconciliation (matches), → Treasury (cash flow), → Reports (bank position) | ← Sales (payments), ← Purchases (payments), ← All modules (transactions) | `payment.received`, `transfer.created` |
| **Items & Inventory** | → Sales (price, stock decrement), → Purchases (COGS), → Accounting (valuation), → Reports (inventory value) | ← Sales (invoice lines), ← Purchases (bills) | `stock.movement`, `low.stock` |
| **Double-Entry** | → Reports (BS, P&L, GL, CF), → Tax (ledger), → Compliance (audit trail), → Collections (AR/AP aging) | ← Sales, Purchases, Banking, Payroll (journal entries) | `journal.posted`, `period.closed` |
| **Tax** | → VatService (raw SQL ledgers), → DisasterFund (DRRF triggers), → Reports (tax summary), → Compliance (checklist) | ← Sales (output VAT), ← Purchases (input VAT/WHT), ← Banking (remittance) | `vat.computed`, `vat.filed`, `wht.calculated` |
| **Compliance Apps** | → Reports (disclosures), → Audit Outsourcing (findings) | ← Double-Entry (GL), ← Tax (filings), ← All modules (audit trail) | `compliance.checked`, `report.generated` |
| **Employees** | → Payroll (salary data), → Attendance (shift), → CRM (customer 360), → Assets (custodian) | ← Departments (org), ← Shifts (schedule), ← Settings (config) | `employee.created`, `employee.updated` |
| **Payroll** | → Banking (salary transfer), → Double-Entry (salary expense), → Tax (PIT, pension), → Reports (payroll summary) | ← Employees (data), ← Attendance (worked days), ← FinancialCycle (period) | `payroll.generated`, `payroll.approved`, `payroll.paid` |
| **Assets** | → Double-Entry (depreciation), → Reports (fixed assets), → IFRS (IAS 16) | ← Employees (custodian) | `asset.depreciated`, `asset.disposed` |
| **CRM** | → Sales (deal → invoice), → Reports (pipeline), → Dashboard (credibility) | ← Sales (invoice data), ← Employees (customer 360) | `lead.converted`, `deal.won`, `customer.scored` |
| **System & Settings** | → All modules (global config) | ← All modules (settings reads) | `settings.updated`, `currency.rate.changed` |
| **White-Label** | → Frontend (branding) | ← Settings (brand config) | `branding.updated` |
| **Import Pro** | → All modules (bulk data) | ← CSV/Excel files | `data.imported` |

---

## Route Reference (Module → Routes)

Key routes grouped by module, with minimum RBAC permission required. SPURADMIN bypasses all route policies.

### Sales Routes

| Route | Permission | Module |
|-------|-----------|--------|
| `/invoices` | `invoices:read` | Sales |
| `/invoices/new` | `invoices:write` | Sales |
| `/invoices/:id` | `invoices:read` | Sales |
| `/invoices/:id/share` | `invoices:read` | Sales |
| `/invoices/:id/send` | `invoices:write` | Sales |
| `/credit-notes` | `invoices:read` | Sales |
| `/estimates` | `invoices:read` | Sales |
| `/receipts` | `invoices:read` | Sales |
| `/sales-orders` | `invoices:read` | Sales |
| `/customer-summary` | `crm:read` | CRM |

### Purchases Routes

| Route | Permission | Module |
|-------|-----------|--------|
| `/purchases/bills` | `bills:read` | Purchases |
| `/purchases/bills/new` | `bills:write` | Purchases |
| `/purchases/orders` | `purchase_orders:read` | Purchases |
| `/purchases/orders/new` | `purchase_orders:write` | Purchases |
| `/purchases/vendors` | `bills:read` | Purchases |
| `/purchases/grn` | `bills:write` | Purchases |
| `/purchases/debit-notes` | `bills:read` | Purchases |
| `/purchases/scanned-bills` | `bills:read` | Purchases |
| `/tax/wht-certificates` | `vat:write` | Tax |

### Banking Routes

| Route | Permission | Module |
|-------|-----------|--------|
| `/banking/accounts` | `banking:read` | Banking |
| `/banking/digital-payments` | `banking:read` | Banking |
| `/transactions` | `OVDS:read` | Banking |
| `/fund-transfers` | `fund_transfers:read` | Banking |
| `/bank-reconciliation` | `bank_reconciliation:read` | Banking |
| `/bank-statement-import` | `bank_statement_import:write` | Banking |
| `/petty-cash` | `banking:read` | Banking |
| `/treasury-forecast` | `OVDS:read` | Treasury |
| `/payment-tracker` | `OVDS:read` | Treasury |
| `/accounting-collections` | `OVDS:read` | Collections |

### Accounting & Compliance Routes

| Route | Permission | Module |
|-------|-----------|--------|
| `/accounting` | `OVDS:read` | Double-Entry |
| `/accounting-dashboard` | `OVDS:read` | Double-Entry |
| `/accounting/journal-entries` | `OVDS:read` | Double-Entry |
| `/accounting/accounts` | `OVDS:read` | Double-Entry |
| `/accounting/ledger` | `OVDS:read` | Double-Entry |
| `/vat` | `vat:read` | Tax |
| `/vat-administration` | `vat:read` | Tax |
| `/tax-filing` | `vat:file` | Tax |
| `/business-income-tax` | `bit:file` | Tax |
| `/disaster-fund` | `disaster_fund:read` | Tax |
| `/period-close` | `period_close:read` | Double-Entry |
| `/compliance-auditor` | `audit_logs:read` | Compliance |

### HR Routes

| Route | Permission | Module |
|-------|-----------|--------|
| `/employees` | `employees:read` | Employees |
| `/departments` | `departments:read` | Employees |
| `/attendance` | `attendance:read` | Employees |
| `/leaves` | `leaves:read` | Employees |
| `/shifts` | `shifts:read` | Employees |
| `/payroll` | `payroll:read` | Payroll |
| `/payroll-administration` | `payroll:admin` | Payroll |
| `/hr/paye-declarations` | `payroll:read` | Payroll |

### CRM & Business Routes

| Route | Permission | Module |
|-------|-----------|--------|
| `/crm/contacts` | `crm:contacts:read` | CRM |
| `/crm/pipeline` | `crm:deals:read` | CRM |
| `/partnerships` | `partnerships:read` | CRM |
| `/business-loans` | `business_loans:read` | CRM |
| `/investments` | `investments:read` | CRM |

### Administration Routes

| Route | Permission | Module |
|-------|-----------|--------|
| `/app-store` | `apps:read` | Core |
| `/settings` | `settings:read` | Settings |
| `/users` | `users:read` | Settings |
| `/role-permissions` | `role_permissions:read` | Settings |
| `/companies` | `companies:read` | Settings |
| `/audit-logs` | `audit_logs:read` | Compliance |
| `/reports` | `reports:read` | Reports |
| `/import` | `settings:read` | Import Pro |

---

## Key Metrics & KPIs per Module

Each module surfaces role-aware KPIs on the dashboard. The table below maps modules to their primary metrics.

| Module | KPI | Calculation | Refresh | RBAC |
|--------|-----|-------------|---------|------|
| Sales | Invoice Stats | `thisTotal`, `lastTotal`, `trend`, `overdueCount`, `draftCount` | Real-time | `OVDS` |
| Sales | AR Aging | Outstanding invoices bucketed by days overdue | Real-time | `OVDS` |
| Purchases | AP Aging | Outstanding bills bucketed by due date | Real-time | `OVDS` |
| Banking | Cash & Bank Position | Sum of all active bank account balances | Real-time | `OVDS` |
| Banking | Reconciliation Summary | `{ total, reconciled, totalPending, accounts[] }` | Real-time | `OVDS` |
| Items | Inventory Valuation | `{ items, totalValue, method }` (FIFO/WA) | On change | `OVDS` |
| Accounting | Financial Health Score | A–F grade from liquidity, profitability, collection | 30s cache | `ADMIN` |
| Accounting | Trial Balance | All accounts with debit/credit totals, `isBalanced` flag | Real-time | `OVDS` |
| Tax | VAT Net Payable | Output VAT − Claimable Input VAT | On compute | `OVDS` |
| Tax | Compliance Score | `(vatScore × 50 + drrfScore × 30 + payrollScore × 20)` | Daily | `OVDS` |
| Tax | DRRF Compliance Grade | A (≥90%), B (≥75%), C (≥60%), D (≥40%), F (<40%) | Daily | `OVDS` |
| HR | Attendance Summary | `daysPresent`, `daysVerified`, `daysOnLeave` | Daily | `HR` |
| HR | Who Is In | Employees checked in, not checked out | Real-time (WS) | `HR` |
| Payroll | Payroll Stats | `totalEmployees`, `configured`, `totalNetPay`, `totalTax` | On generate | `HR` |
| Payroll | Absenteeism Rate | `(absentRecords / totalAttendance) × 100` | 30s cache | `ADMIN` |
| CRM | Credibility Score | 0–100 (TIN, license, members, customers, transparency) | On update | `ADMIN` |
| CRM | Customer 360 | `creditScore`, `loyaltyTier`, 6-month revenue trend | On access | `crm` |

---

## Audit & Compliance Requirements

OVDS maintains an immutable audit trail for all financial operations, meeting Ethiopian MoR requirements for a minimum 10-year record retention.

| Requirement | How OVDS Handles It | RBAC |
|-------------|---------------------|------|
| Audit trail (10 years) | `AuditLog` model — all CRUD operations logged with user, timestamp, IP | `audit_logs:read` |
| Document attachments | `FileAttachment` model — receipts, WHT certificates, supporting docs (base64) | `OVDS:read` |
| User access logs | `AuthService` logs every login, logout, role change, MFA event | `audit_logs:read` |
| Transaction immutability | `JournalEntry` lines are append-only — no updates/deletes after posting | `OVDS:approve` |
| Period locking | `PeriodManager` prevents backdated entries in closed periods | `period_close:write` |
| Bank reconciliation | Transaction matching with `PENDING → RECONCILED` status | `bank_reconciliation:write` |
| Tax filings | `VatFiling` and `IncomeTaxFiling` models with ERCA eTax references | `vat:file` |
| DRRF contributions | `DisasterFundContribution` with audit trail and remittance records | `disaster_fund:write` |
| Segregation of duties | RBAC enforces role separation for generate/verify/approve/submit steps | `rbac.ts` |
| Financial statements | Auto-generated from GL; prior-year comparatives required (IAS 1) | `reports:financial:read` |

---

## Module Development Checklist

Adding a new module or extending an existing one requires changes across 5 layers. This checklist ensures completeness and compliance.

### Backend (NestJS)
1. [ ] Create `src/<module>/` with controller, service, DTOs, module file
2. [ ] Implement `ModuleInterface` in `<module>.provider.ts`
3. [ ] Register module in `ModuleRegistryService`
4. [ ] Add Prisma models to schema with `companyId` and `@@index`
5. [ ] Run `npm run db:push && npx prisma generate`
6. [ ] Apply `@UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)` on all controllers
7. [ ] Add `@Roles()` with appropriate `AppRole` values
8. [ ] Call `AuditLogService.log()` on all write operations
9. [ ] Use `prisma.$transaction([...])` for multi-model writes
10. [ ] Apply `@Throttle()` on auth-adjacent endpoints

### Prisma Schema
1. [ ] Add `companyId String?` field with `@@index([companyId])`
2. [ ] Add `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
3. [ ] Add `@@unique` constraints where needed
4. [ ] Add `@@index` on `WHERE` clause fields (status, date, foreignKey)

### Frontend (React)
1. [ ] Create `features/<module>/` with pages, components, hooks, services
2. [ ] Add lazy import in `App.tsx` with `lazyWithRetry()`
3. [ ] Add route to `ROUTES` array in `App.tsx`
4. [ ] Add to `ROUTE_POLICY` in `rbac.ts`
5. [ ] Add nav entry in `Sidebar.tsx` with correct permission key
6. [ ] Add to `routeTitleMap` in `Layout.tsx`
7. [ ] Add to `ROUTE_BREADCRUMBS` in `Header.tsx`
8. [ ] Add i18n keys to all three sections (default/am/en) in `i18n.json`
9. [ ] Wrap mutating UI with `<Can permission="...">`
10. [ ] Fire `useAuditLog()` on delete/export actions

### RBAC
1. [ ] Add permission string to `PERMISSION_GROUPS` in `rbac.ts`
2. [ ] Assign permission to appropriate roles in `ROLE_PERMISSIONS`
3. [ ] Add to `RESOURCE_DOMAINS` if it belongs to a resource domain
4. [ ] Add route to `ROUTE_POLICY` in `rbac.ts`
5. [ ] Add sensitive routes to `SENSITIVE_ROUTES` if needed

### Testing
1. [ ] Add backend service tests with tenant isolation
2. [ ] Add backend controller tests with guard verification
3. [ ] Add frontend component tests with RBAC gate coverage
4. [ ] Run `npm run test:backend` and `npm run test:frontend`
5. [ ] Run `npm run typecheck` and `npm run check:arch`

---

## Feature-to-Report Mapping

Each module's transactional data feeds specific financial and operational reports. This matrix helps auditors and analysts trace report lineage back to source modules.

| Report | Source Modules | Key Metrics | RBAC | Docs |
|--------|---------------|-------------|------|------|
| **Balance Sheet** | Double-Entry, Banking, Items, Assets | Assets, Liabilities, Equity, `isBalanced` flag | `reports:bs:read` | [financial-reports](07-reports/financial-reports.md) |
| **Profit & Loss** | Sales, Purchases, Tax, Payroll, Banking | Revenue, COGS, Expenses, Net Profit | `reports:pl:read` | [financial-reports](07-reports/financial-reports.md) |
| **Cash Flow** | Banking, Sales, Purchases | Inflows, Outflows, Operating Net | `reports:cf:read` | [financial-reports](07-reports/financial-reports.md) |
| **Trial Balance** | Double-Entry | All accounts with Dr/Cr totals | `reports:gl:read` | [financial-reports](07-reports/financial-reports.md) |
| **General Ledger** | Double-Entry, Sales, Purchases, Banking | All journal entries with line details | `reports:gl:read` | [general-ledger](04-financial-ops/general-ledger-and-journals.md) |
| **AR Aging** | Sales | Outstanding invoices by days overdue | `reports:read` | [financial-reports](07-reports/financial-reports.md) |
| **AP Aging** | Purchases | Outstanding bills by due date | `reports:read` | [financial-reports](07-reports/financial-reports.md) |
| **Tax Summary** | Tax | Output VAT, Input VAT, WHT, Net Payable | `reports:read` | [tax-reports](06-tax-compliance/vat-and-tot.md) |
| **VAT Form 1** | Tax | ERCA-formatted VAT declaration | `vat:file` | [vat-and-tot](06-tax-compliance/vat-and-tot.md) |
| **DRRF Schedule** | Tax | Quarterly levy breakdown by category | `disaster_fund:write` | [bit-and-drrf](06-tax-compliance/bit-and-drrf.md) |
| **BIT Declaration** | Tax | 30% tax on net profit | `bit:file` | [bit-and-drrf](06-tax-compliance/bit-and-drrf.md) |
| **Payroll Summary** | Payroll, HR, Employees | Gross, Net, Tax, Pension totals | `payroll:export` | [payroll-reports](07-reports/payroll-reports.md) |
| **Attendance Report** | HR, Employees | Daily attendance, late, absent | `attendance:read` | [payroll-reports](07-reports/payroll-reports.md) |
| **Inventory Valuation** | Items, Inventory | Stock by location, FIFO/WA values | `inventory:read` | [items-catalog](04-financial-ops/items-catalog.md) |
| **Credibility Score** | CRM, Partnerships | 0–100 bank eligibility score | `crm:read` | [compliance-and-credibility](08-advanced/compliance-and-credibility.md) |
| **Compliance Dashboard** | Tax, Payroll, Double-Entry, Sales | 10-item ERCA checklist, filing deadlines | `OVDS:read` | [compliance-and-credibility](08-advanced/compliance-and-credibility.md) |
| **Financial Health Score** | Accounting, Banking, Sales, Purchases | A–F grade (liquidity, profitability) | `OVDS:read` | [financial-reports](07-reports/financial-reports.md) |
| **Budget vs Actual** | Accounting, Purchases | Variance analysis | `reports:read` | [budgets-and-planning](04-financial-ops/budgets-and-planning.md) |
| **Audit Trail** | All modules | Immutable timestamped action log | `audit_logs:read` | [compliance-and-credibility](08-advanced/compliance-and-credibility.md) |
| **Cash Forecast** | Treasury, Banking, Sales, Purchases | 30/60/90-day projection with confidence | `OVDS:read` | [treasury-collections](05-banking/treasury-collections.md) |

---

## RBAC Role Access per Module

SPURADMIN bypasses all checks. The table below shows the minimum role or permission required to access each module's key functions.

| Module | Read Access | Write Access | Approval/Admin Access | SPURADMIN |
|--------|-------------|-------------|----------------------|-----------|
| **Sales** | `OVDS`, `ACCOUNTING`, `CRM`, `ADMIN` | `OVDS`, `ACCOUNTING`, `CRM` | `OVDS` | ✅ |
| **Purchases** | `OVDS`, `ACCOUNTING`, `ADMIN`, `PARTNER` | `OVDS`, `ACCOUNTING` | `OVDS` | ✅ |
| **Banking** | `OVDS`, `ACCOUNTING`, `ADMIN` | `OVDS`, `ACCOUNTING` | `OVDS` | ✅ |
| **Items & Inventory** | `OVDS`, `ACCOUNTING`, `ADMIN` | `OVDS`, `ACCOUNTING` | `OVDS` | ✅ |
| **Double-Entry** | `OVDS`, `ACCOUNTING`, `AUDITOR` | `OVDS`, `ACCOUNTING` | `OVDS` | ✅ |
| **Tax** | `OVDS`, `ACCOUNTING`, `AUDITOR` | `OVDS`, `ACCOUNTING` | `OVDS` | ✅ |
| **Compliance Apps** | `OVDS`, `ACCOUNTING`, `AUDITOR`, `IFRS_OFFICER` | `OVDS`, `IFRS_OFFICER` | `OVDS` | ✅ |
| **Employees** | `HR`, `EMPLOYEE`, `ADMIN` (own), `OVDS` | `HR`, `ADMIN` | `HR` | ✅ |
| **Payroll** | `HR`, `OVDS`, `EMPLOYEE` (own payslips) | `HR`, `OVDS` | `OVDS` | ✅ |
| **Assets** | `OVDS`, `ACCOUNTING`, `ADMIN` | `OVDS`, `ACCOUNTING` | `OVDS` | ✅ |
| **CRM** | `CRM`, `ADMIN`, `CLIENT` (own) | `CRM`, `ADMIN` | `CRM` | ✅ |
| **System & Settings** | `ADMIN`, `SPURADMIN` | `ADMIN` | `ADMIN` | ✅ |
| **White-Label** | `ADMIN`, `SPURADMIN` | `ADMIN` | `ADMIN` | ✅ |
| **Import Pro** | `ADMIN`, `SPURADMIN` | `ADMIN`, `SPURADMIN` | `SPURADMIN` | ✅ |

---

## Third-Party Integrations

OVDS integrates with regional and international platforms across banking, identity, communication, and compliance channels.

| Integration | Module | Purpose | Config Key |
|-------------|--------|---------|-----------|
| **Ethio Telecom (telebirr)** | Banking | Mobile payment processing, receipt verification | `paymentSource: TELECOM`, `telecomRef` |
| **Chapa** | Banking | Card and mobile payment gateway | `paymentSource: MOBILE_BANKING` |
| **CBE Pay / Commercial Bank of Ethiopia** | Banking | Salary disbursement, bulk payments | `bankName: CBE` |
| **Awash Bank / Dashen Bank / Abyssinia Bank** | Banking | Commercial banking integration | `bankName: Awash/Dashen/Abyssinia` |
| **Auth0** | Core (Auth) | SSO, MFA, RS256 JWT authentication | `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` |
| **ERCA e-Tax / SIGTAS** | Tax | VAT, BIT, WHT, DRRF filings submission | `eTaxReference` format |
| **Plaid / Yodlee** | Banking (Live Feeds) | Bank account data aggregation | Live Bank Feeds App |
| **SMTP providers** (Mailtrap, Gmail, ethionet.et) | System & Settings | Email delivery for invoices, reminders, payslips | `MAIL_HOST`, `MAIL_PORT` |
| **Slack** | System & Settings | Webhook notifications for alerts | `notifications_config.slack.webhookUrl` |
| **Google Drive / OneDrive** | Import Pro | Cloud file source for bulk imports | N/A (upload) |
| **ZATCA (Saudi Arabia)** | Compliance Apps | E-invoice compliance for GCC markets | Country-specific app |
| **European SAF-T** | Compliance Apps | Tax audit file generation | Country-specific app |
| **UK MTD** | Compliance Apps | Making Tax Digital submission | Country-specific app |
| **Fayda (Ethiopian Digital ID)** | Core (Auth) | National digital identity authentication | `/auth/fayda` |
| **NBE (National Bank of Ethiopia)** | Tax | Exchange rate feed, QR code standard | `CurrencyRate` model, NBE-IQR format |

---

## Data Retention & Archiving

OVDS enforces retention policies compliant with Ethiopian MoR requirements (minimum 10 years for Category A businesses).

| Data Type | Retention Period | Archival Mechanism | RBAC |
|-----------|-----------------|-------------------|------|
| Audit Logs | 90 days (active) → archived | `CleanupService.cleanupOldLogs(90)` daily | `audit_logs:read` |
| Audit Archives | 10 years | Manual export to offsite storage | `audit_logs:write` |
| Invoices | Permanent (legal requirement) | Never purged; status → CANCELLED only | `invoices:read` |
| Bills | Permanent | Never purged | `bills:read` |
| Journal Entries | Permanent | Immutable after posting | `OVDS:read` |
| Bank Transactions | 7 years | `CleanupScheduler` flags after 7y | `banking:read` |
| Employee Records | 7 years post-employment | `CleanupScheduler` flags | `employees:read` |
| Payroll Records | 7 years | `CleanupScheduler` flags | `payroll:read` |
| Tax Filings | Permanent | Never purged; ERCA submission tracked | `vat:file` |
| DRRF Contributions | Permanent | Archived quarterly on 15th/25th | `disaster_fund:read` |
| Attachments (receipts, certificates) | 10 years | `FileAttachment` with `attachableType` | `OVDS:read` |
| Telecom Receipts Cache | 24 hours | `TelecomReceiptCache` with TTL | System |

---

## Module Maturity & Deployment Status

Each module's production readiness, deployment model, and dependency status. Modules marked *(Beta)* are available but undergoing refinement; *(Experimental)* modules are opt-in for pilot customers.

| Module | Install Type | Status | Offline Capable | Mobile PWA | Requires Double-Entry | Notes |
|--------|-------------|--------|-----------------|------------|----------------------|-------|
| Invoices | Core | Production | Yes | Yes | No (single-entry) | Auto-journal only with Double-Entry App |
| Revenues | Core | Production | Yes | Yes | No | Manual income logging |
| Customers | Core | Production | Yes | Yes | No | Credit scoring requires CRM App |
| Estimates/Quotes | Core | Production | Yes | Yes | No | No GL posting until conversion |
| Bills | Core | Production | Yes | Yes | No (single-entry) | WHT auto-calc on vendor TIN |
| Payments | Core | Production | Yes | Yes | No | Split entry for gateway fees |
| Vendors | Core | Production | Yes | Yes | No | TIN validation (15 chars) |
| Purchase Orders | App | Production | Partial (draft only) | Yes | No | Three-way match requires Bills |
| Accounts | Core | Production | Yes | Yes | No | Bank statement import requires Reconciliation |
| Transfers | Core | Production | Yes | Yes | No | Same-account restriction enforced |
| Reconciliations | Core | Production | Partial (manual) | Yes | No | AI matching requires cloud |
| Live Bank Feeds | App | Production | No | Partial (view cached) | No | Real-time requires internet |
| Items Database | Core | Production | Yes | Yes | No | |
| Categories | Core | Production | Yes | Yes | No | |
| Inventory | App Extension | Production | Partial (view only) | Partial | No | Multi-warehouse, FIFO/WA, reorder alerts |
| Double-Entry | App | Production | Yes (journal view) | Yes | N/A | Required for IFRS reporting |
| Tax Module | Core | Production | Partial (compute only) | Yes | Recommended | e-Tax submission requires internet |
| Compliance Apps | App | Production | No | No | Required | Regional legal extensions |
| Employees | App | Production | Yes | Yes | No | Biometric registration required |
| Payroll | App | Production | Partial (view only) | Partial | No | PIT/Pension per Proclamation 1395/2025 |
| Assets | App | Production | Yes | Yes | Recommended | IAS 16 depreciation schedules |
| CRM | App | Production | Yes | Yes | No | Credibility scoring requires Partnerships |
| System & Settings | Core | Production | Yes | Yes | No | |
| White-Label | App | Production | Yes | Yes | No | EntSaaSrise tier only |
| Import Pro | App | Production | Yes (file upload) | Yes | No | |

---

## Key API Endpoints per Module

Concise reference to the most frequently used REST endpoints per module. Full API documentation: [API.md](09-developers/API.md). All endpoints are prefixed with `/api/` and require a valid JWT bearer token.

### Sales (`src/sales/`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET` | `/invoices` | `invoices:read` | List invoices (paginated, filterable by status/date) |
| `POST` | `/invoices` | `invoices:write` | Create invoice (auto-posts journal + VAT/DRRF) |
| `GET` | `/invoices/:id` | `invoices:read` | Get single invoice with payments history |
| `PUT` | `/invoices/:id` | `invoices:write` | Update invoice (draft/sent only) |
| `POST` | `/invoices/:id/send` | `invoices:write` | Send invoice via email + generate share link |
| `POST` | `/invoices/:id/share` | `invoices:write` | Generate `shareToken` for public client portal |
| `POST` | `/invoices/:id/pay` | `invoices:write` | Record customer payment (full/partial/split) |
| `POST` | `/invoices/:id/send-reminder` | `invoices:write` | Send payment reminder for overdue invoice |
| `POST` | `/invoices/:id/duplicate` | `invoices:write` | Duplicate invoice with new number |
| `POST` | `/credit-notes` | `invoices:write` | Create credit note (negative mirror invoice) |
| `GET` | `/customers` | `invoices:read` | List customers with credit scores |
| `POST` | `/customers` | `invoices:write` | Create customer with KYC/TIN fields |
| `GET` | `/customers/:id/360` | `crm:read` | Customer 360 view (invoices, interactions, scores) |
| `GET` | `/invoices/stats` | `invoices:read` | Invoice statistics (thisTotal, trend, overdueCount) |
| `GET` | `/ar-aging` | `reports:read` | AR aging buckets by days overdue |

### Purchases (`src/purchases/`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET` | `/bills` | `bills:read` | List bills (paginated, filterable by status/vendor) |
| `POST` | `/bills` | `bills:write` | Create bill (auto-calculates WHT, posts input VAT) |
| `POST` | `/bills/:id/pay` | `bills:write` | Record bill payment |
| `GET` | `/vendors` | `bills:read` | List vendors with billCount and totalBilled |
| `POST` | `/vendors` | `bills:write` | Create vendor |
| `POST` | `/purchase-orders` | `purchase_orders:write` | Create purchase order |
| `PATCH` | `/purchase-orders/:id/advance` | `purchase_orders:approve` | Advance PO status (Draft→Submitted→Approved→Received→Billed→Closed) |
| `GET` | `/ap-aging` | `reports:read` | AP aging by due date |
| `POST` | `/wht-certificates` | `bills:write` | Upload WHT certificate for a bill |

### Banking (`src/banking/`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET` | `/bank-accounts` | `banking:read` | List bank accounts with computedBalance |
| `POST` | `/bank-accounts` | `banking:write` | Create bank account |
| `POST` | `/fund-transfers` | `fund_transfers:write` | Transfer funds between accounts (atomic) |
| `POST` | `/bank-statement-import` | `bank_statement_import:write` | Upload CSV/OFX bank statement for reconciliation |
| `POST` | `/bank-accounts/:id/bulk-reconcile` | `bank_reconciliation:write` | Bulk reconcile pending transactions |
| `GET` | `/bank-accounts/reconciliation-summary` | `bank_reconciliation:read` | Pending/reconciled counts per account |

### Tax (`src/tax/`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `POST` | `/vat/compute` | `vat:calculate` | Compute VAT for a period (output − input) |
| `POST` | `/vat/submit` | `vat:file` | Submit VAT filing to ERCA e-Tax portal |
| `GET` | `/vat/dashboard` | `vat:read` | VAT dashboard (netPayable, withheld, reverse-charge) |
| `POST` | `/disaster-fund/auto-generate` | `disaster_fund:write` | Auto-generate DRRF contributions from activity |
| `POST` | `/disaster-fund/:id/remit` | `disaster_fund:write` | Record DRRF remittance to EDRRFO |
| `POST` | `/tax/seed-et` | `ADMIN` | Seed default Ethiopian tax rates |

### HR & Payroll (`src/hr/`, `src/payroll/`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET` | `/employees` | `employees:read` | List employees with department/shift |
| `POST` | `/employees` | `employees:write` | Create employee |
| `POST` | `/payroll/generate` | `payroll:generate` | Generate payroll for period |
| `POST` | `/payroll/:id/approve` | `payroll:approve` | Approve payroll (OVDS only) |
| `GET` | `/payroll/:id/payslip` | `payroll:export` | Generate payslip PDF |
| `POST` | `/attendance/checkin` | `attendance:verify` | Record employee check-in (biometric/geofence) |
| `POST` | `/attendance/checkout` | `attendance:verify` | Record check-out + overtime calculation |

### Core System (`src/core/`, `src/settings/`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET` | `/settings` | `settings:read` | Get all system settings |
| `PUT` | `/settings` | `settings:write` | Update system settings |
| `POST` | `/accounts/seed` | `OVDS:write` | Seed default Ethiopian chart of accounts |
| `POST` | `/import` | `settings:write` | Bulk import (customers, vendors, items, employees) |
| `GET` | `/app-store` | `apps:read` | List available modules |
| `POST` | `/app-store/:id/install` | `apps:write` | Install a module |
| `GET` | `/audit-logs` | `audit_logs:read` | List audit log entries |
| `GET` | `/audit-logs/export` | `audit_logs:write` | Export audit logs to CSV |

---

## Business Continuity & Offline Support

Ethiopia's Directive No. 1142/2026 mandates that regulated sectors maintain offline functionality to continue issuing invoices during internet interruptions. OVDS implements this through the Sync Engine and PWA architecture.

| Module | Offline Capability | Data Stored Locally | Sync Behavior | Regulatory Requirement |
|--------|-------------------|-------------------|---------------|----------------------|
| Invoices | Create, edit, delete | Full invoice + journal data | Syncs on reconnect; 72-hour MoR deadline | Directive No. 1142/2026 |
| Customers | Full CRUD | Customer profiles, TIN, credit data | Syncs on reconnect | — |
| Bills | Create, edit, delete | Bill + WHT + input VAT | Syncs on reconnect | — |
| Payments | Record payments | Payment records, gateway refs | Queue + retry | ETB 30,000 cash limit |
| Items | Full CRUD | Item catalog, stock levels | Syncs on reconnect | — |
| Inventory | Stock adjustments | Warehouse, transfer, adjustment data | Queue + reconcile | IAS 2 |
| Banking | View only | Cached account balances | Read-only offline | — |
| Double-Entry | View journal entries | Recently posted entries | Read-only offline | IAS 10 (period close) |
| Tax | No (compute/submit) | Cached tax rates | Online only | e-Tax requires internet |
| Payroll | View payslips only | Cached payslip data | Read-only offline | PAYE requires real-time |
| CRM | Lead/opportunity CRUD | Contact, deal, interaction data | Syncs on reconnect | — |
| Attendance | Full (biometric/geofence) | Check-in/out, templates | IndexedDB queue + background sync | Labour Proc. 1156/2019 |
| System Settings | View only | Cached settings | Read-only offline | — |

### Offline Sync Architecture

```
[Browser/PWA] ← IndexedDB (OVDSOffline DB)
      │
      ├── Sync Engine (@ovds/)
      │   • Transaction queue (create/update/delete)
      │   • Conflict resolution (last-write-wins per module)
      │   • Circuit breaker (72-hour deadline warning)
      │
      └── Background Sync (SW)
          • On connectivity restore → replay queue
          • PostMessage → tabs: "SYNC_SUCCESS"
          • Audit trail: offline timestamps logged
```

### Disaster Recovery SLA

| Scenario | RTO | RPO | Mechanism |
|----------|-----|-----|-----------|
| Database corruption | 4 hours | 24 hours | Daily MySQL dump + `./public` backup |
| Network outage | Immediate | 0 | Offline PWA + IndexedDB queue |
| Server failure | 2 hours | 0 (cloud) | Multi-AZ replication |
| Auth0 outage | 8 hours | 0 | Local JWT fallback (AUTH0_ENFORCED=false) |
| POS terminal offline | Immediate | 0 | Local SQLite + 72h sync window |

---

## Module Observability & Monitoring

Each module emits health metrics, audit events, and dashboard KPIs. This reference helps SRE teams and compliance officers understand what to monitor.

| Module | Health Checks | Audit Events | Dashboard Metrics | Alert Triggers | Monitoring Endpoint |
|--------|--------------|-------------|-------------------|----------------|-------------------|
| Invoices | `GET /invoices/health` | `INVOICE_CREATED`, `INVOICE_SENT`, `INVOICE_PAID`, `INVOICE_OVERDUE` | `invoiceStats`, `arAging` | Overdue > 30 days | `GET /dashboard/alerts` |
| Purchases | `GET /bills/health` | `BILL_CREATED`, `BILL_PAID`, `WHT_RECORDED` | `apAging`, `expenseSummary` | Overdue > 30 days | `GET /dashboard/alerts` |
| Banking | `GET /bank-accounts/health` | `BANK_TX_CREATED`, `RECONCILIATION_MATCHED`, `TRANSFER_CREATED` | `cashPosition`, `reconciliationSummary` | Unreconciled > 7 days | `GET /dashboard/alerts` |
| Items & Inventory | `GET /items/health` | `STOCK_ADJUSTED`, `STOCK_TRANSFER`, `REORDER_TRIGGERED` | `inventoryValuation`, `lowStockItems` | Stock < reorderLevel | `GET /dashboard/alerts` |
| Double-Entry | `GET /accounting/health` | `JOURNAL_ENTRY_POSTED`, `PERIOD_CLOSED`, `ACCOUNT_BALANCE_CHANGED` | `trialBalance`, `financialHealthScore` | Imbalanced journal entry | `GET /dashboard/alerts` |
| Tax | `GET /vat/health` | `VAT_COMPUTED`, `VAT_FILED`, `WHT_CALCULATED`, `DRRF_GENERATED` | `vatDashboard`, `complianceScore` | Filing deadline approaching | `GET /dashboard/alerts` |
| Compliance Apps | `GET /compliance-auditor/health` | `COMPLIANCE_CHECKED`, `REPORT_GENERATED` | `complianceChecklist` | Any CRITICAL item | `GET /compliance-auditor` |
| Employees | `GET /employees/health` | `EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED`, `BIOMETRIC_REGISTERED` | `employeeStats`, `departmentStats` | Missing bank details | `GET /dashboard/alerts` |
| Payroll | `GET /payroll/health` | `PAYROLL_GENERATED`, `PAYROLL_APPROVED`, `PAYSLIP_ISSUED` | `payrollStats`, `payrollTrends` | Unapproved payroll > 24h | `GET /dashboard/alerts` |
| Assets | `GET /fixed-assets/health` | `ASSET_ADDED`, `DEPRECIATION_POSTED`, `ASSET_DISPOSED` | `assetRegister`, `depreciationSchedule` | Missing depreciation | `GET /dashboard/alerts` |
| CRM | `GET /crm/health` | `LEAD_CONVERTED`, `DEAL_WON`, `CUSTOMER_SCORED` | `credibilityScore`, `pipelineSummary` | Stalled deal > 30 days | `GET /dashboard/alerts` |
| System & Settings | `GET /health/detailed` | `SETTINGS_CHANGED`, `USER_CREATED`, `USER_ROLE_CHANGED` | `systemHealth` | Config error | `GET /health/detailed` |
| White-Label | `GET /settings/health` | `BRANDING_APPLIED` | — | Brand config error | `GET /health/detailed` |
| Import Pro | `POST /import/status` | `DATA_IMPORTED`, `IMPORT_COMPLETED` | `importStats` | Import failure | `GET /dashboard/alerts` |

### Health Check Response Format

All health endpoints return a standardized shape consumed by the global health check (`GET /api/health/detailed`):

```typescript
interface ModuleHealth {
  ok: boolean;              // Whether the module's health checks pass
  message?: string;         // Optional detail (e.g. "5 overdue invoices")
  metrics: Record<string, number>; // Module-specific counters
  sla: {                     // SLA thresholds
    metric: string;
    threshold: number;
    operator: '>=' | '<=' | '>';
  }[];
}
```

Status determination for `GET /api/health/detailed`:
- `healthy` — all module checks pass
- `degraded` — one or more modules report `ok: false` but no critical failures
- `unhealthy` — a core module (Sales, Banking, Double-Entry) is non-functional

---

## Module Security & Data Protection

Each module's data is encrypted at rest (AES-256-GCM) and in transit (TLS 1.2+). This table summarizes module-specific security concerns and mitigations.

| Module | Data Sensitivity | Encryption | PII Handling | RBAC Scope | Audit Trail |
|--------|-----------------|------------|--------------|------------|-------------|
| Invoices | High (financial) | AES-256-GCM | Customer names, emails, TIN | `invoices:write` | `INVOICE_CREATED/PAID/DELETED` |
| Customers | High (PII) | AES-256-GCM | Name, email, phone, TIN, address | `crm:read` on customer data | `CUSTOMER_CREATED/UPDATED` |
| Bills | High (financial) | AES-256-GCM | Vendor names, bank details, TIN | `bills:write` | `BILL_CREATED/PAID` |
| Vendors | Medium (business) | AES-256-GCM | Vendor name, TIN, bank account | `bills:read` | `VENDOR_CREATED/UPDATED` |
| Banking | High (financial) | AES-256-GCM | Account numbers, transaction details | `banking:read` | `BANK_TX_CREATED/RECONCILED` |
| Items & Inventory | Medium | AES-256-GCM | SKU, pricing (business-sensitive) | `items:write` | `STOCK_ADJUSTED` |
| Double-Entry | Critical (audit) | AES-256-GCM | Account codes, journal entries | `OVDS:approve` on edits | `JOURNAL_POSTED` (immutable) |
| Tax | Critical (compliance) | AES-256-GCM | Tax amounts, filings, ERCA refs | `vat:file` | `VAT_COMPUTED/FILED` |
| Employees | Very High (PII) | AES-256-GCM | TIN, bank details, salary, biometric templates | `employees:read` (own data only for EMPLOYEE role) | `EMPLOYEE_CREATED/UPDATED` |
| Payroll | Critical (PII + financial) | AES-256-GCM | Salary, net pay, tax, pension | `payroll:admin` | `PAYROLL_GENERATED/APPROVED` |
| Assets | Medium | AES-256-GCM | Asset tags, custodian, value | `fixed_assets:write` | `ASSET_ADDED/DISPOSED` |
| CRM | High (PII) | AES-256-GCM | Contact info, deal values, credit scores | `crm:read` | `LEAD_CONVERTED/DEAL_WON` |
| System & Settings | Very High | AES-256-GCM | SMTP credentials, JWT secret, API keys | `settings:write` | `SETTINGS_CHANGED` |
| White-Label | Low | AES-256-GCM | Branding configs | `settings:write` | `BRANDING_APPLIED` |
| Import Pro | Medium | AES-256-GCM | Bulk PII (names, TINs, etc.) | `settings:write` | `DATA_IMPORTED` |

### Data Residency & Sovereignty

- **Primary storage:** Ethiopian jurisdiction (MySQL on Ethiopian servers)
- **Cloud tier:** EU/GDPR-compliant for EU subsidiaries, US for US subsidiaries
- **On-Premise tier:** Customer premises, fully air-gapped capable
- **Cross-border transfers:** Require explicit consent and contractual safeguards (GDPR Chapter V)

---

## Module Testing Coverage Matrix

Test coverage reference for quality assurance teams. Last audited: 2026-08-18.

| Module | Backend Tests | Frontend Tests | E2E Tests | Coverage | Last Tested |
|--------|-------------|----------------|-----------|----------|-------------|
| Invoices | 28 tests | 12 tests | 4 flows | 92% | 2026-08-15 |
| Customers | 19 tests | 8 tests | 2 flows | 88% | 2026-08-15 |
| Bills | 25 tests | 10 tests | 3 flows | 89% | 2026-08-15 |
| Vendors | 14 tests | 6 tests | 1 flow | 85% | 2026-08-14 |
| Banking | 22 tests | 9 tests | 3 flows | 91% | 2026-08-16 |
| Reconciliations | 18 tests | 7 tests | 2 flows | 87% | 2026-08-16 |
| Items | 16 tests | 5 tests | 2 flows | 83% | 2026-08-16 |
| Inventory | 24 tests | 11 tests | 3 flows | 90% | 2026-08-16 |
| Double-Entry | 35 tests | 14 tests | 5 flows | 94% | 2026-08-17 |
| Tax | 31 tests | 12 tests | 4 flows | 91% | 2026-08-17 |
| VAT Filing | 20 tests | 8 tests | 3 flows | 88% | 2026-08-16 |
| DRRF | 18 tests | 6 tests | 2 flows | 86% | 2026-08-15 |
| Employees | 26 tests | 10 tests | 3 flows | 89% | 2026-08-15 |
| Payroll | 29 tests | 13 tests | 4 flows | 93% | 2026-08-17 |
| Attendance | 22 tests | 9 tests | 3 flows | 90% | 2026-08-16 |
| Assets | 15 tests | 6 tests | 2 flows | 84% | 2026-08-14 |
| CRM | 23 tests | 11 tests | 3 flows | 88% | 2026-08-15 |
| System Settings | 17 tests | 5 tests | 2 flows | 82% | 2026-08-14 |
| White-Label | 8 tests | 4 tests | 1 flow | 78% | 2026-08-13 |
| Import Pro | 14 tests | 6 tests | 2 flows | 85% | 2026-08-15 |
| **Total** | **367 tests** | **158 tests** | **51 flows** | **88% avg** | — |

### Test Coverage by Layer

| Layer | Framework | Target | Key Patterns |
|-------|-----------|--------|--------------|
| Backend unit | Jest (NestJS Testing Module) | 90%+ per module | `mockDeep(PrismaService)`, tenant isolation tests |
| Backend integration | Supertest (e2e) | All CRUD + guards | Full guard chain: `JwtAuthGuard` → `RBACGuard` → `CompanyGuard` |
| Frontend unit | Vitest (React Testing Library) | 80%+ per feature | RBAC `<Can>` gate coverage, form dirty-state tests |
| Frontend e2e | Playwright | Critical user journeys | Login → Invoice → Payment → VAT filing |
| Cross-tenant | Custom e2e suite | 100% | SPURADMIN cross-company, role isolation, data leakage |

---

## Module Caching Strategy

Each module employs specific caching patterns. All caches are invalidated on company switch and respect tenant isolation.

| Module | Cache Layer | TTL | Invalidation Trigger | Cache Key Pattern |
|--------|------------|-----|---------------------|-------------------|
| Dashboard | In-memory (DashboardService) | 30s | `kiro:refresh` event | `dashboard:companyId:role` |
| Invoice stats | In-memory (useApiQuery) | 30s | Invoice created/paid | `/invoices/stats?companyId=` |
| Tax dashboard | In-memory (VatService) | 60s | VAT computed/filed | `vat:dashboard:companyId:period` |
| DRRF rules | In-memory (DisasterFundService) | 300s | Settings updated | `drrf:rules:companyId` |
| Credibility score | Database (`Partnership.credibilityScore`) | Persistent | Partnership updated | `partnership:id` |
| Customer 360 | Database (`Customer.creditScore`) | Persistent | Invoice paid | `customer:id` |
| Bank balances | Database (`BankAccount.computedBalance`) | Real-time | Transaction added | `bankAccount:id` |
| Tax rates | Database (`TaxRate`) | Persistent | Settings updated | `taxRates:companyId` |
| Menu items | In-memory (core settings) | 3600s | `core.settings.updated` | `menu:companyId` |
| Auth0 status | Session (`useAuth0Status`) | Session | Config change | `auth0:status` |
| Telecom receipts | Database (`TelecomReceiptCache`) | 24h (TTL) | Daily cleanup cron | `telecom:ref:refNumber` |
| Strategic insights | In-memory (DashboardService) | 30s | Payroll/VAT filing | `insights:companyId` |
| Item catalog | In-memory (useApiQuery) | 120s | Item created/updated | `/items?companyId=` |
| Customer list | In-memory (useApiQuery) | 120s | Customer created/updated | `/customers?companyId=` |
| Employee list | In-memory (useApiQuery) | 120s | Employee created/updated | `/employees?companyId=` |

---

## Glossary of Module Terms

| Term | Definition | Modules |
|------|-----------|---------|
| **Core Module** | Always-active module included in every subscription plan. Cannot be uninstalled. | All section 1–4 modules |
| **App Module** | Independently installable module from the OVDS App Store. Requires subscription entitlement. | Section 5–7 modules (marked *(App)*) |
| **App Extension** | Feature that expands an existing core module with additional capabilities. | Inventory, Live Bank Feeds |
| **ModuleInterface** | TypeScript interface that every App module implements: `info`, `register`, `boot`, `routes`, `menus`, `settings`, `permissions`, `migrations`, `health`. | @ovds/core |
| **Journal Entry** | Immutable double-entry record: Debit entries must equal Credit entries (tolerance < 0.01 ETB). | Double-Entry, all source modules |
| **Company ID** | Tenant identifier. Every query, invoice, journal, and filing is bound to `companyId` via `CompanyGuard`. | All modules |
| **shareToken** | Unique UUID on `Invoice` enabling public client portal access without login. | Sales |
| **computedBalance** | Bank account balance = `openingBalance + SUM(all transactions including PENDING)`. | Banking |
| **WHT** | Withholding Tax — 2% on service payments ≥ ETB 500, 2% on goods payments ≥ ETB 10,000, 15% on non-resident services. | Purchases, Tax |
| **DRRF** | Disaster Response Fund — 17+ levy categories managed by EDRRFO. | Tax, Disaster Fund |
| **ERCA** | Ethiopian Revenue and Customs Authority. Administers VAT, withholding tax, and customs. | Tax, Sales, Purchases |
| **e-Tax / SIGTAS** | Ethiopian electronic tax filing portal. | Tax |
| **MoR** | Ministry of Revenues. Oversees VAT registration, BIT, and all tax filings. | Tax, Compliance |
| **NBE-IQR** | National Bank of Ethiopia Invoice QR format for e-invoices. Each invoice carries a unique MoR tracking ID. | Sales, Tax |
| **ERCA QR** | ERCA-compliant QR code format on invoices (per Directive No. 1142/2026). | Sales |
| **IFRS Tier** | Three-tier classification: Tier 1 (Full IFRS), Tier 2 (IFRS for SMEs), Tier 3 (Micro-entity) per AABE Proclamation 847/2014. | Double-Entry, Compliance |
| **Credit Score** | Customer creditworthiness (AAA–EEE or 0–100) computed from payment history, CRM interactions, and partnership links. | CRM, Customers |
| **Loyalty Tier** | Customer loyalty level: Platinum (≥80), Gold (≥60), Silver (≥40), Bronze (<40). | CRM, Customers |
| **Financial Cycle** | Payroll period with start/end dates and `incrementPercentage` for projected payroll. | Payroll |
| **Arrear Config** | Retroactive salary adjustment for employees who received incorrect pay in a previous period. | Payroll |
| **Three-Way Match** | Matching a Purchase Order, Goods Received Note, and Bill to ensure accurate payment. | Purchases, Purchase Orders |
| **FIFO/WA** | Inventory costing methods (First-In-First-Out, Weighted Average). LIFO is prohibited under IAS 2. | Items, Inventory |
| **ECL** | Expected Credit Loss — IFRS 9 impairment model applied to AR aging buckets. | Double-Entry, Sales |
| **ROU Asset** | Right-of-Use Asset — IFRS 16 lease asset recognized for leases > 12 months. | Assets, Accounting |
| **MAT** | Minimum Alternative Tax — 2.5% of annual turnover (Proclamation No. 1395/2025). Whichever is higher: regular income tax or MAT. | Tax |
| **Circuit Breaker** | Telecom payment fault-tolerance pattern: opens after 3 failures, stays open 60 seconds. | Banking, Payments |
| **Geofence** | Virtual boundary (default 500m radius) for attendance/mobile check-ins. | Attendance, HR |
| **Audit Trail** | Immutable, uneditable timeline of all user actions. Minimum 10-year retention per MoR. | All modules |
| **Period Close** | Locking a fiscal period to prevent backdated entries (IAS 10 cut-off). | Double-Entry |
| **Entitlement Guard** | Server-side check ensuring only subscribed modules are accessible. | Core (App Store) |
| **Tenant Isolation** | Data separation between companies via `companyId` enforced by `CompanyGuard`. SPURADMIN bypasses. | All modules |
| **Module Registry** | Central service in `@ovds/core` that tracks installed/enabled modules per company, resolves dependencies, and dispatches lifecycle events. | Core |
| **Event Bus** | Pub/sub system in `@ovds/core` (`EventBus`/`EventDispatcher`) with priority ordering for inter-module communication. | Core, all modules |

---

## Module Error Handling & Troubleshooting

Reference for SREs and support teams. Each module defines error codes in the format `MODULE_<CODE>` with structured responses.

| Module | Error Code | HTTP Status | Description | Resolution Steps |
|--------|-----------|------------|-------------|-----------------|
| Invoices | `INV_001` | 409 | Invoice number already exists | Use `duplicate` endpoint or generate new number |
| Invoices | `INV_002` | 400 | Invoice total mismatch (items ≠ sum) | Recalculate line totals; check rounding |
| Invoices | `INV_003` | 422 | Customer missing required fields | Add TIN, phone, and address to customer profile |
| Invoices | `INV_004` | 422 | Cannot send invoice in DRAFT status | Update status to SENT first |
| Invoices | `INV_005` | 409 | Invoice already paid | Reverse payment first or issue credit note |
| Customers | `CUST_001` | 422 | Invalid TIN format (must be 15 chars) | Validate TIN checksum; use `TINValidator` util |
| Customers | `CUST_002` | 400 | Customer has outstanding balance | Collect payment or negotiate payment plan |
| Bills | `BILL_001` | 422 | WHT exceeds 15% threshold | Verify vendor TIN status; adjust WHT percentage |
| Bills | `BILL_002` | 409 | Bill already reconciled | Cannot edit; reverse reconciliation first |
| Banking | `BANK_001` | 409 | Insufficient funds | Top up account; use overdraft if enabled |
| Banking | `BANK_002` | 400 | Transfer to same account | Select different destination account |
| Banking | `BANK_003` | 422 | Bank statement parse failure | Validate CSV column headers against template |
| Banking | `BANK_004` | 409 | Transaction already reconciled | Cannot modify; use `unreconcile` endpoint |
| Items | `ITEM_001` | 422 | SKU already in use | Change SKU or archive existing item |
| Items | `ITEM_002` | 400 | Negative stock not allowed | Set `allowNegativeStock: false` in settings |
| Inventory | `INV_006` | 422 | Cannot transfer to same warehouse | Select different destination warehouse |
| Inventory | `INV_007` | 422 | Insufficient stock for transfer | Reduce quantity or restock first |
| Double-Entry | `GL_001` | 409 | Journal entry unbalanced | Ensure total debits = total credits |
| Double-Entry | `GL_002` | 403 | Period already closed | Reopen period via Settings → Period Management |
| Double-Entry | `GL_003` | 400 | Account not found in company chart | Run `/accounts/seed` or add manually |
| Tax | `VAT_001` | 409 | VAT already filed for period | Cannot re-file; amend via ERCA e-Tax portal only |
| Tax | `VAT_002` | 422 | No taxable transactions in period | Verify transaction dates fall within period |
| Tax | `VAT_003` | 502 | ERCA e-Tax portal unreachable | Retry during off-peak hours; check network |
| DRRF | `DRRF_001` | 422 | DRRF auto-generation found no applicable levies | Verify transaction types and dates |
| Employees | `EMP_001` | 422 | Duplicate employee ID | Use unique employee ID |
| Employees | `EMP_002` | 422 | Missing biometric registration | Register employee biometrics via device |
| Employees | `EMP_003` | 422 | Bank account format invalid | Use Ethiopian bank account format validator |
| Payroll | `PAY_001` | 422 | No employees in department | Add employees to department or select different department |
| Payroll | `PAY_002` | 422 | Salary component formula error | Check `incrementPercentage` and overtime rules |
| Payroll | `PAY_003` | 422 | Pension contribution exceeds ceiling | Verify pension tier and gross salary |
| Attendance | `ATT_001` | 409 | Check-in already recorded | Use `checkout` instead or override with manager role |
| Attendance | `ATT_002` | 422 | Outside geofence boundary | Check in within 500m radius of bureau location |
| Attendance | `ATT_003` | 422 | Biometric match failed (3 retries) | Retry biometric scan; use PIN fallback |
| Assets | `ASSET_001` | 422 | Depreciation already posted for asset | Cannot delete; dispose via `dispose` endpoint |
| Assets | `ASSET_002` | 422 | Useful life cannot be 0 or negative | Set useful life in years (min 1) |
| CRM | `CRM_001` | 422 | Lead score below threshold | Customer credit score below Bronze tier requirement |
| CRM | `CRM_002` | 409 | Interaction already logged for deal | Use `update` instead of `create` |
| Settings | `SET_001` | 400 | Invalid JSON in settings payload | Validate JSON syntax with `JSON.parse()` |
| Settings | `SET_002` | 422 | Tax rate conflicts with MoR requirements | Apply MoR Directive No. 1142/2026 rate table |
| Import Pro | `IMP_001` | 422 | CSV column mismatch | Match CSV headers to template; download template from UI |
| Import Pro | `IMP_002` | 422 | Duplicate TIN/IPIN detected | Enable `skipDuplicates` or resolve duplicates manually |

### Error Response Format

All module endpoints return errors in a standardized `ErrorResponse` shape:

```typescript
interface ErrorResponse {
  error: {
    code: string;        // e.g. "INV_003"
    message: string;     // Human-readable description
    details?: Record<string, unknown>; // Additional context
    statusCode: number;   // HTTP status code
    timestamp: string;    // ISO timestamp
    path: string;        // Request path
  }
}
```

---

## Module Performance Benchmarks

Expected performance characteristics under standard load (1,000 concurrent users, 4-core VM, 8GB RAM). Benchmarks last run: 2026-08-10.

| Module | Read Latency (p95) | Write Latency (p95) | Throughput (req/s) | Memory Usage | Notes |
|--------|-------------------|---------------------|-------------------|-------------|-------|
| Invoices | 120ms | 250ms | 120 | 45 MB | Journal posting on write |
| Customers | 85ms | 180ms | 180 | 22 MB | Credit score async |
| Bills | 110ms | 230ms | 110 | 38 MB | WHT calc on write |
| Banking | 95ms | 200ms | 150 | 35 MB | Bank statement import slow |
| Items | 65ms | 140ms | 250 | 18 MB | Lightweight CRUD |
| Inventory | 80ms | 160ms | 200 | 25 MB | Stock level recalculation |
| Double-Entry | 75ms | 300ms | 100 | 40 MB | Imbalance check heavy |
| Tax | 90ms | 450ms (compute) / 2s (submit) | 80 | 30 MB | ERCA sync on submit |
| Employees | 100ms | 220ms | 130 | 32 MB | Biometric data lookup |
| Payroll | 85ms | 500ms (generate) | 60 | 55 MB | Multi-threaded calc |
| Attendance | 60ms | 120ms | 300 | 20 MB | Fast check-in/out |
| Assets | 70ms | 190ms | 140 | 28 MB | Depreciation schedule |
| CRM | 95ms | 210ms | 140 | 35 MB | Scoring engine async |
| Settings | 40ms | 110ms | 400 | 10 MB | In-memory cache |
| Import Pro | — | 500ms–5s (batch) | 10 | 40 MB | Depends on file size |

### Performance SLA Targets

| Metric | Target | Alert Threshold | Critical Threshold |
|--------|--------|----------------|-------------------|
| API Response Time (p95) | < 200ms | 300ms | 500ms |
| API Response Time (p99) | < 500ms | 750ms | 1000ms |
| Database Query Time (p95) | < 100ms | 200ms | 500ms |
| Error Rate | < 0.1% | 0.5% | 2% |
| Uptime | 99.5% | — | Downtime > 30 min/day |
| Offline Sync Recovery | < 72h | — | MoR deadline violation |
| VAT E-Filing Success | 99.9% | 95% | 90% |

---

## Module Upgrade & Migration Paths

Version upgrade considerations for each module. All migrations run through Prisma Migrate with a `companyId` scope. Rolling upgrades are supported for stateless modules; data migrations run during low-traffic windows (02:00–04:00 local time).

| Module | Upgrade Strategy | Data Migration Required? | Downtime | Backward Compatible? | Notes |
|--------|-----------------|------------------------|----------|---------------------|-------|
| Invoices | Rolling | Only on major version | None | Yes | v3.0+ adds `shareToken` (nullable) |
| Customers | Rolling | No | None | Yes | v2.5+ adds `creditabilityScore` column |
| Bills | Rolling | No | None | Yes | v3.2+ adds `whtPercentage` column |
| Banking | Rolling | No | None | Yes | v4.1+ adds `bankStatementImportStatus` |
| Items | Rolling | No | None | Yes | v3.8+ adds `inventoryValuationMethod` |
| Inventory | Rolling | No | None | Yes | v4.0+ adds `warehouseId` (optional) |
| Double-Entry | Blue-green | Yes (GL schema) | 5 min | No | v5.0 requires full re-index; contact support |
| Tax | Blue-green | Yes (tax code table) | 10 min | No | v3.5+ aligns with MoR Directive 1142/2026 |
| DRRF | Rolling | No | None | Yes | v2.3+ adds new levy categories |
| Employees | Rolling | No | None | Yes | v4.2+ deprecates `employeeId` in favor of `userId` |
| Payroll | Blue-green | Yes (salary config) | 15 min | No | v3.0+ requires pension tier mapping |
| Attendance | Rolling | No | None | Yes | v5.1+ adds geofence v2 schema |
| Assets | Rolling | No | None | Yes | v3.4+ adds `disposalMethod` enum |
| CRM | Rolling | No | None | Yes | v4.0+ adds `credibilityScoreV2` |
| Settings | Blue-green | No | None | Yes | v6.0+ adds `auth0Enforced` flag |
| White-Label | Rolling | No | None | Yes | v2.8+ adds dark mode |
| Import Pro | Rolling | No | None | Yes | v3.1+ adds telecom receipt import |

### Migration Safety Checklist

1. **Backup** — Run `./scripts/db-backup.sh` before any schema migration
2. **Dry run** — Test migration against a copy of production data
3. **Rollback plan** — Ensure `ROLLBACK` migrations are available in `migrations/`
4. **Tenant isolation** — Verify `companyId` scope in all migration scripts
5. **Offline mode** — Warn offline users before migrations that affect schema
6. **Post-migration validation** — Run `npm run test:post-migration` suite
7. **ERCA sync** — Re-sync any VAT filings affected by tax code changes
8. **Audit trail** — Log migration to `AuditLog` with `ADMIN` role context

### Version Compatibility Matrix

| Component | Min Version | Max Version |
|-----------|------------|------------|
| Next.js (frontend) | 14.x | 15.x |
| NestJS (backend) | 10.x | 10.x |
| Prisma | 5.x | 5.x |
| MySQL | 8.0 | 8.4 |
| Redis | 7.x | 7.x |
| Auth0 SDK | 4.x | 4.x |
| Tailwind CSS | 3.3 | 3.4 |

---

## Module Regulatory Compliance Mapping

Each module's compliance posture against Ethiopian and international regulations. This reference helps legal teams and auditors verify regulatory alignment.

| Module | Ethiopian Regulations | IFRS Compliance | Data Protection | Audit Readiness | Last Review |
|--------|---------------------|----------------|-----------------|-----------------|-------------|
| Invoices | Directive No. 1142/2026 (e-Invoice QR), VAT Proclamation 1153/2020 | IFRS 15 (Revenue) | PII encryption | 99% (audit fields) | 2026-08-15 |
| Customers | Income Tax Proclamation 1153/2020 (TIN collection) | IFRS 9 (ECL) | GDPR consent logs | 95% | 2026-08-15 |
| Bills | WHT Proclamation 1153/2020, Input VAT rules | IFRS 9 (ECL) | Vendor PII encryption | 97% | 2026-08-15 |
| Banking | Directive No. 1142/2026, ETB 30,000 cash limit | — | Bank secrecy encrypted | 98% | 2026-08-16 |
| Items & Inventory | IAS 2 (Inventories) | IFRS for SMEs Tier 2 | SKU encryption | 96% | 2026-08-16 |
| Double-Entry | VAT Proclamation, IFRS for SMEs | Full IFRS (all 10 standards) | GL line encryption | 100% | 2026-08-17 |
| Tax | MoR VAT Directive, WHT rules, DRRF Proclamation 1395/2025, e-Tax SIGTAS | IFRS 12 (Tax) | Filing metadata encrypted | 100% | 2026-08-17 |
| DRRF | Disaster Response Fund Proclamation 1395/2025 | — | Levy computation logs | 98% | 2026-08-15 |
| Employees | Labour Proclamation 1156/2019, Pension Proclamation | IAS 19 (Employee Benefits) | SSN/TIN encrypted | 95% | 2026-08-15 |
| Payroll | PAYE rules, Pension Proclamation 718/2011 | IAS 19, IFRS 2 (Share-based) | Salary data encrypted | 99% | 2026-08-17 |
| Attendance | Labour Proc. 1156/2019, Overtime rules | IAS 19 | Biometric templates encrypted | 93% | 2026-08-16 |
| Assets | IAS 16 (PPE), IAS 36 (Impairment) | IFRS for SMEs Tier 2 | Asset tag encryption | 90% | 2026-08-14 |
| CRM | Consumer Protection Proclamation | IFRS 9 (ECL) | Contact PII encrypted, consent mgmt | 92% | 2026-08-15 |
| System & Settings | Data Protection Proclamation (draft) | — | JWT/API key encryption | 95% | 2026-08-14 |
| White-Label | Branding guidelines | — | Config encryption | 70% | 2026-08-13 |
| Import Pro | Data handling guidelines | — | Source PII encrypted | 94% | 2026-08-15 |

### Compliance Attestations

| Certification | Scope | Valid Until | Auditor | Notes |
|---------------|-------|------------|---------|-------|
| ERCA VAT Filing Compliance | Tax module | Ongoing | Internal QA | Monthly sync test with e-Tax portal |
| IFRS for SMEs Alignment | Double-Entry, Items, Assets | 2026-12-31 | External (Deloitte) | Annual audit scheduled |
| GDPR Chapter V | EU subsidiary data | 2027-03-15 | External (PwC) | Cross-border transfer assessment |
| Data Encryption (AES-256) | All PII modules | Continuous | Internal | AES-256-GCM validated |
| ISO 27001 ISMS | System Security | 2026-11-30 | External | Stage 2 audit Q4 2026 |
| MoR Audit Trail | All financial modules | 10 years | Internal | 100% immutability verified |

---

## Module Event Flow Reference

The OVDS Event Bus (`@ovds/core`) enables decoupled communication between modules. Each event has a priority level (1=highest, 5=lowest) and is dispatched to all registered listeners. This table documents critical event chains that span multiple modules.

| Trigger Event | Source Module | Target Modules | Priority | Description | Business Impact |
|--------------|--------------|----------------|----------|-------------|----------------|
| `InvoiceCreated` | Sales | Double-Entry, Tax, CRM | 1 | New invoice triggers auto-journal entry | GL updated in milliseconds |
| `InvoicePaid` | Sales | Double-Entry, CRM, Banking | 1 | Payment triggers journal + credit score update | Customer credit score increases |
| `InvoiceOverdue` | Sales | CRM, Settings | 2 | 30+ days overdue triggers reminder | Reminder emails sent |
| `BillCreated` | Purchases | Double-Entry, Tax | 1 | Bill triggers journal entry + WHT calc | WHT withheld automatically |
| `BillPaid` | Purchases | Double-Entry, Banking | 1 | Payment triggers journal + bank transaction | Bank balance updated |
| `BankTransactionReconciled` | Banking | Double-Entry | 1 | Reconciliation posts journal entry | GL updated with bank data |
| `StockTransfer` | Inventory | Double-Entry | 3 | Inter-warehouse transfer | Valuation method applied |
| `StockReorder` | Inventory | Purchases | 3 | Stock below threshold | Auto-generates draft PO for vendor |
| `JournalPosted` | Double-Entry | Tax, Settings | 1 | Journal triggers period balance update | Tax calculations reflect new data |
| `PeriodClosed` | Double-Entry | Tax | 1 | Period close locks for backdated entries | VAT filing locked for period |
| `PayrollGenerated` | Payroll | Double-Entry, Banking | 1 | Payroll triggers journal + bank transfer entries | Salary expense posted |
| `PayrollApproved` | Payroll | Payments, Banking | 2 | Approval triggers payment disbursement | Bank transfers queued |
| `EmployeeCheckIn` | Attendance | Payroll | 4 | Check-in records feed into payroll | Overtime calculated |
| `PensionContributed` | Employees | Payroll | 2 | Pension contribution triggers ledger update | Pension ledger updated |
| `LeadConverted` | CRM | Sales, Credits | 2 | Lead → Customer triggers credit score | New customer record created |
| `AssetDepreciated` | Assets | Double-Entry | 2 | Monthly depreciation posts journal | Depreciation expense recorded |
| `CustomerCredibilityUpdated` | CRM | Sales, Credits | 2 | Credit score changes affect invoicing terms | Payment terms may change |
| `AttendanceApproved` | Attendance | Payroll | 3 | Attendance approval triggers overtime calc | Payroll reflects overtime |
| `WHTThresholdExceeded` | Tax | Purchases | 1 | WHT > 15% triggers review flag | Manual review required |
| `VatFiled` | Tax | Settings | 1 | VAT filing locks period in compliance tracker | Period marked as compliant |
| `DrrfContributed` | Tax | Banking | 2 | DRRF remittance creates bank transaction | Bank balance reduced |
| `ItemUpdated` | Items | Inventory, Sales | 3 | Price change propagates to inventory valuation | COGS recalculated |
| `AccountUpdated` | Double-Entry | Tax, Settings | 2 | Chart of accounts changes propagate | Tax mappings updated |
| `SettingChanged` | System | All | 1 | Any setting change dispatches to all modules | Cache invalidated, UI refreshed |
| `CompanyCreated` | Core | All | 1 | New company triggers module bootstrap | Seed data created for all modules |

### Event Bus Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EventBus (@ovds/core)                     │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Dispatcher  │ → │  Priority Q   │ → │  Listeners   │  │
│  │  (dispatch)   │    │  (Redis)      │    │  (register)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
    [Producer]           [Queue]              [Consumer]
    Modules that
    dispatch events
```

Event payload format:

```typescript
interface DomainEvent {
  eventId: string;        // UUID v7
  eventType: string;      // e.g. "invoice.created"
  source: string;          // Module name (e.g. "sales")
  timestamp: Date;        // ISO timestamp
  companyId: string;      // Tenant context
  correlationId: string;  // UUID for request tracing
  payload: Record<string, unknown>; // Event-specific data
  priority: 1 | 2 | 3 | 4 | 5;    // Execution priority
  retries: number;        // Retry count for failed events
}
```

---

## Module Internationalization

OVDS supports Amharic (አማርኛ), Afaan Oromoo, Tigrinya (ትግርኛ), and English. The following table documents which modules have completed localization and which support RTL layouts.

| Module | English | Amharic | Afaan Oromoo | Tigrinya | RTL | Date Formats | Number Formats | Notes |
|--------|---------|---------|-------------|----------|-----|--------------|----------------|-------|
| Invoices | ✅ | ✅ | ✅ | ✅ | No | DD/MM/YYYY | ETB (1,000.00) | Invoice labels translatable |
| Customers | ✅ | ✅ | ✅ | ✅ | No | DD/MM/YYYY | ETB | Address fields localized |
| Bills | ✅ | ✅ | ✅ | ✅ | No | DD/MM/YYYY | ETB | Vendor name transliteration |
| Banking | ✅ | ✅ | ✅ | ✅ | No | DD/MM/YYYY | ETB | Bank names in local language |
| Items & Inventory | ✅ | ✅ | ✅ | ✅ | No | DD/MM/YYYY | ETB | Unit names localized |
| Double-Entry | ✅ | ✅ | Partial | Partial | No | DD/MM/YYYY | ETB | GL account names |
| Tax | ✅ | ✅ | ✅ | ✅ | No | DD/MM/YYYY | ETB | Tax descriptions, WHT labels |
| DRRF | ✅ | ✅ | ❌ | ❌ | No | DD/MM/YYYY | ETB | English + Amharic only |
| Employees | ✅ | ✅ | ✅ | ✅ | No | DD/MM/YYYY | ETB | Fields per Labour Proc. 1156/2019 |
| Payroll | ✅ | ✅ | ✅ | ✅ | No | DD/MM/YYYY | ETB | Payslip fully localized |
| Attendance | ✅ | ✅ | ✅ | ✅ | No | HH:MM | 24h | Geofence labels |
| Assets | ✅ | ✅ | Partial | Partial | No | DD/MM/YYYY | ETB | Depreciation terms |
| CRM | ✅ | ✅ | ✅ | ✅ | No | DD/MM/YYYY | ETB | Lead sources, deal stages |
| System & Settings | ✅ | ✅ | ✅ | ✅ | No | DD/MM/YYYY | ETB | All config labels |
| White-Label | ✅ | ✅ | ✅ | ✅ | No | DD/MM/YYYY | ETB | Branding text translatable |
| Import Pro | ✅ | ✅ | ❌ | ❌ | No | DD/MM/YYYY | ETB | Template column headers |

### Currency Support

| Currency | Symbol | ISO Code | Decimal Places | Modules |
|----------|--------|----------|---------------|---------|
| Ethiopian Birr | Br | ETB | 2 | All |
| US Dollar | $ | USD | 2 | Banking, Settings |
| Euro | € | EUR | 2 | Banking, Settings |
| British Pound | £ | GBP | 2 | Banking, Settings |

---

## Module Extensibility Points

Each module exposes hook points where custom business logic can be injected. Developers implement `ModuleHook` and register via the `@Hook()` decorator.

| Module | Hook Name | Lifecycle Stage | Execution Order | Use Cases |
|--------|-----------|----------------|----------------|-----------|
| Invoices | `beforeCreate` | Pre-persistence | Priority 1 | Validation, auto-number generation |
| Invoices | `afterCreate` | Post-persistence | Priority 3 | Notifications, CRM scoring, journal posting |
| Invoices | `beforeSend` | Pre-send | Priority 2 | Attach custom terms, modify share link |
| Invoices | `onOverdue` | Daily cron | Priority 5 | Escalation emails, SMS, suspend customer |
| Customers | `beforeCreate` | Pre-persistence | Priority 1 | Duplicate detection, TIN validation |
| Customers | `afterCreate` | Post-persistence | Priority 2 | Credit score initialization, welcome email |
| Bills | `beforeCreate` | Pre-persistence | Priority 1 | WHT calculation, vendor validation |
| Bills | `afterCreate` | Post-persistence | Priority 2 | Journal entry, notification to AP team |
| Banking | `beforeTransfer` | Pre-execution | Priority 1 | Fraud check, balance verification |
| Banking | `afterTransfer` | Post-execution | Priority 2 | Journal posting, bank reconciliation |
| Banking | `onStatementImport` | During import | Priority 3 | Transaction categorization, rule matching |
| Items | `beforeCreate` | Pre-persistence | Priority 1 | SKU generation, duplicate check |
| Inventory | `beforeTransfer` | Pre-execution | Priority 1 | Stock availability, warehouse validation |
| Inventory | `onReorder` | Trigger | Priority 2 | Auto-PO generation, supplier notification |
| Double-Entry | `beforePost` | Pre-commit | Priority 1 | Balance validation, account existence check |
| Double-Entry | `aftSaaSost` | Post-commit | Priority 2 | Balance recalculation, audit log write |
| Tax | `beforeVatCompute` | Pre-calc | Priority 1 | Exclude exempt transactions, rate overrides |
| Tax | `afterVatCompute` | Post-calc | Priority 2 | Store VAT summary, compliance check |
| Tax | `beforeVatSubmit` | Pre-submit | Priority 1 | Final validation, signature |
| Tax | `onVatFiled` | Post-submit | Priority 3 | Compliance tracking, period lock |
| Employees | `beforeCreate` | Pre-persistence | Priority 1 | Employee ID generation, TIN validation |
| Employees | `afterCreate` | Post-persistence | Priority 2 | Biometric registration queue, welcome workflow |
| Payroll | `beforeGenerate` | Pre-generation | Priority 1 | Validate salary components, overtime check |
| Payroll | `afterGenerate` | Post-generation | Priority 2 | Payslip generation, journal estimation |
| Payroll | `beforeApprove` | Pre-approval | Priority 1 | Final validation, tax calculation review |
| Payroll | `afterApprove` | Post-approval | Priority 2 | Payment disbursement, bank transfer queue |
| Attendance | `onCheckIn` | Real-time | Priority 1 | Biometric verification, geofence check |
| Attendance | `onCheckOut` | Real-time | Priority 1 | Overtime calculation, leave deduction |
| Assets | `beforeDepreciate` | Pre-calc | Priority 1 | Validate useful life, residual value |
| Assets | `afterDepreciate` | Post-calc | Priority 2 | Journal entry, schedule update |
| CRM | `beforeScore` | Pre-scoring | Priority 1 | Custom scoring rules, weight overrides |
| CRM | `onDealWon` | Trigger | Priority 2 | Generate invoice, update customer credit |
| Settings | `onSettingChange` | Real-time | Priority 1 | Cache invalidation, config propagation |
| Import Pro | `onImportStart` | Pre-import | Priority 1 | Column mapping validation |
| Import Pro | `onImportComplete` | Post-import | Priority 2 | Data validation report, error summary |

### Hook Execution Context

```typescript
interface HookContext {
  companyId: string;           // Tenant identifier
  userId: string;             // Acting user
  correlationId: string;      // Request tracing
  data: Record<string, unknown>; // Entity payload
  metadata: {                 // Execution metadata
    source: 'api' | 'cron' | 'webhook' | 'import';
    priority: number;
    retries: number;
    timestamp: Date;
  };
  services: {                 // Injected services
    prisma: PrismaService;
    logger: LoggerService;
    eventBus: EventBus;
  };
}
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Nx monorepo layout, build graph, IoT tax pipeline, database commands |
| [09-developers/modular-architecture.md](09-developers/modular-architecture.md) | Technical architecture: core system, module contract (`ModuleInterface`), module registry, event bus, dependency rules |
| [CORE-CONFIG.md](./CORE-CONFIG.md) | Centralized terminology, tax rates, GL account map, RBAC matrix, data-flow links |
| [FILING-LIFECYCLE.md](./FILING-LIFECYCLE.md) | Digital Automated Filing Lifecycle: 6-phase pipeline from data capture to compliance scoring |
| [01-getting-started/quick-start.md](01-getting-started/quick-start.md) | 8-step setup, default credentials, first invoice, first payroll, first VAT filing |
| [02-users-roles/rbac-matrix.md](02-users-roles/rbac-matrix.md) | All 22 roles, 150+ permissions, hierarchy weights, route policies |
| [06-tax-compliance/README.md](06-tax-compliance/README.md) | Ethiopian tax compliance overview: VAT, WHT, BIT, DRRF, MAT, e-Invoice |
| [07-reports/financial-reports.md](07-reports/financial-reports.md) | Balance Sheet, P&L, Cash Flow, Trial Balance, AR/AP Aging, financial ratios |


