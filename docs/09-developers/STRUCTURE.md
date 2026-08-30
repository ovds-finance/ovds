<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# OVDS — System Structure & Module Map

Complete map of the OVDS platform — pages, API modules, sidebar groups, and their relationships. Use this as the reference when adding a new feature to understand where it lives across frontend, backend, sidebar, and docs.

---

## 1. Four-Phase Architecture

OVDS is organized around the Ethiopian financial compliance cycle:

```
┌─ Phase 1: Setup ──────────────────────────────────────────────┐
│  Configure legal entity, tax rates, banking, IoT devices       │
│  Routes: /settings, /accounting, /tax/dashboard, /iot/devices  │
└───────────────────────────────────────────────────────────────┘
         ↓
┌─ Phase 2: Daily Operations (IoT) ─────────────────────────────┐
│  Real-time transactions: sales, purchases, banking, IoT        │
│  Telebirr & Chapa payments, payroll, compliance tasks          │
└───────────────────────────────────────────────────────────────┘
         ↓
┌─ Phase 3: Analysis ───────────────────────────────────────────┐
│  Review before filing: financial statements, GL, dashboards    │
│  Tax liability estimator, inventory valuation, expense audit   │
└───────────────────────────────────────────────────────────────┘
         ↓
┌─ Phase 4: Submit to MoR ──────────────────────────────────────┐
│  Tax declarations, pension submissions, payment references     │
│  Audit trail with IoT logs, compliance sign-off (period lock)  │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Full Module Map

### Phase 1 · Setup

| Feature | Frontend Route | API Module | Sidebar Group |
|---|---|---|---|
| Chart of Accounts | `/accounting` | `ovds/accounts` | `coa` |
| Opening Balances | `/accounting/opening-balances` | `ovds/accounts` | `coa` |
| Cost Centers | `/accounting/cost-centers` | `ovds/accounts` | `coa` |
| Period Close | `/period-close` | `ovds/periods` | `coa` |
| Company Settings | `/settings` | `settings` | `setup_config` |
| TIN & MoR Credentials | `/settings/company-profile` | `settings` | `setup_config` |
| Business Registration | `/business-registration` | `settings` | `setup_config` |
| Setup Wizard | `/getting-started` | `settings` | `setup_config` |
| User Management | `/users` | `auth/users` | `users_access` |
| Roles & Permissions | `/role-permissions` | `auth/rbac` | `users_access` |
| Onboarding | `/onboarding-admin` | `auth/users` | `users_access` |
| Currencies & FX | `/fx-rates` | `ovds/fx` | `currency_banking_setup` |
| Bank Accounts Setup | `/banking/accounts` | `ovds/bank-accounts` | `currency_banking_setup` |
| Digital Wallets (Telebirr) | `/settings/digital-wallets` | `settings/integrations` | `currency_banking_setup` |
| Chapa Gateway | `/settings/payment-gateways/chapa` | `settings/integrations` | `currency_banking_setup` |
| Tax Dashboard | `/tax/dashboard` | `ovds/vat` | `tax_config` |
| e-Tax Configuration | `/tax/etax-declaration` | `ovds/vat` | `tax_config` |
| Penalty Calculator | `/tax/penalty-calculator` | `ovds/vat` | `tax_config` |
| App Store | `/app-store` | `settings/apps` | `integrations` |
| Payment Gateways | `/ovds/payment-gateways` | `settings/integrations` | `integrations` |
| Cloud Setup | `/getting-started/cloud` | `settings` | `deployment` |
| On-Premise Setup | `/getting-started/on-premise` | `settings` | `deployment` |
| System Updates | `/releases` | `settings/releases` | `deployment` |

### Phase 2 · Daily Operations

| Feature | Frontend Route | API Module | Sidebar Group |
|---|---|---|---|
| Invoices | `/invoices` | `ovds/invoices` | `sales` |
| Estimates & Quotes | `/estimates` | `ovds/invoices` | `sales` |
| Credit Notes | `/credit-notes` | `ovds/invoices` | `sales` |
| Sales Orders | `/sales-orders` | `ovds/invoices` | `sales` |
| Receipts | `/receipts` | `ovds/invoices` | `sales` |
| Proforma Invoices | `/sales/proforma` | `ovds/invoices` | `sales` |
| Payment Tracker | `/payment-tracker` | `ovds/invoices` | `sales` |
| Bills | `/purchases/bills` | `ovds/bills` | `purchases` |
| Purchase Orders | `/purchases/orders` | `ovds/purchase-orders` | `purchases` |
| Expenses | `/purchases/expenses` | `ovds/expenses` | `purchases` |
| Goods Received Notes | `/purchases/grn` | `ovds/grn` | `purchases` |
| Debit Notes | `/purchases/debit-notes` | `ovds/bills` | `purchases` |
| Scanned Receipts | `/purchases/scanned-bills` | `ovds/ocr` | `purchases` |
| WHT Certificates | `/tax/wht-certificates` | `tax/wht` | `purchases` |
| CRM & Contacts | `/crm/contacts` | `crm` | `customers` |
| Sales Pipeline | `/crm/pipeline` | `crm/deals` | `customers` |
| Customer Summary | `/customer-summary` | `crm` | `customers` |
| Customer Statements | `/customer-statement` | `crm` | `customers` |
| Client Portal | `/client-portal` | `crm` | `customers` |
| Vendor List | `/purchases/vendors` | `ovds/vendors` | `vendors` |
| Vendor Balances | `/accounting-hub` | `ovds/accounts` | `vendors` |
| Bank Accounts | `/banking/accounts` | `ovds/bank-accounts` | `banking` |
| Transactions | `/transactions` | `ovds/bank-accounts` | `banking` |
| Fund Transfers | `/fund-transfers` | `ovds/fund-transfers` | `banking` |
| Bank Reconciliation | `/bank-reconciliation` | `ovds/bank-accounts` | `banking` |
| Import Statements | `/bank-statement-import` | `ovds/bank-accounts` | `banking` |
| Petty Cash | `/petty-cash` | `ovds/bank-accounts` | `banking` |
| FX & Currencies | `/fx-rates` | `ovds/fx` | `banking` |
| Telebirr & Chapa (daily) | `/banking/digital-payments` | `banking/digital-payments` | `banking` |
| IoT Device Registry | `/iot/devices` | `iot/devices` | `iot_daily` |
| Sensor / Telematics Sync | `/iot/telemetry` | `iot/events` | `iot_daily` |
| Smart Billing (POS) | `/iot/billing` | `iot/events` | `iot_daily` |
| Device Alerts | `/iot/alerts` | `iot/alerts` | `iot_daily` |
| OTA Updates | `/iot/ota` | `iot/ota` | `iot_daily` |
| Items & Products | `/items` | `ovds/items` | `inventory` |
| Stock Movements | `/inventory` | `ovds/inventory` | `inventory` |
| IAS 2 Valuation | `/inventory/valuation` | `ovds/inventory` | `inventory` |
| Employees | `/employees` | `employees` | `payroll_hr` |
| Attendance | `/attendance` | `attendance` | `payroll_hr` |
| Leave Management | `/leaves` | `leaves` | `payroll_hr` |
| Payroll Runs | `/payroll` | `payroll` | `payroll_hr` |
| PAYE & Pension | `/hr/paye-declarations` | `payroll` | `payroll_hr` |
| Gratuity & Severance | `/hr/gratuity` | `employees` | `payroll_hr` |
| HR Calendar | `/calendar` | `leaves` | `payroll_hr` |
| VAT Return | `/vat` | `ovds/vat` | `compliance_tasks` |
| TOT Filing | `/tax/tot` | `tax/tot` | `compliance_tasks` |
| Excise Tax | `/tax/excise-tax` | `tax/excise` | `compliance_tasks` |
| Stamp Duty | `/tax/stamp-duty` | `tax/stamp` | `compliance_tasks` |
| Property Tax | `/tax/property-tax` | `tax/property` | `compliance_tasks` |
| Schedule D | `/tax/schedule-d` | `tax/schedule-d` | `compliance_tasks` |

### Phase 3 · Analysis

| Feature | Frontend Route | API Module | Sidebar Group |
|---|---|---|---|
| Balance Sheet | `/reports?type=bs` | `ovds/reports` | `financial_statements` |
| Profit & Loss | `/reports?type=pl` | `ovds/reports` | `financial_statements` |
| Cash Flow | `/reports?type=cf` | `ovds/reports` | `financial_statements` |
| Changes in Equity | `/reports/equity` | `ovds/reports` | `financial_statements` |
| Notes to Financials | `/reports?type=notes` | `ovds/reports` | `financial_statements` |
| Main Dashboard | `/dashboard` | `dashboard` | `dashboards` |
| Accounting Dashboard | `/accounting-dashboard` | `dashboard` | `dashboards` |
| Tax Overview Dashboard | `/tax/dashboard` | `ovds/vat` | `dashboards` |
| Tax Liability Estimator | `/tax/liability-estimator` | `tax/liability` | `dashboards` |
| Trial Balance | `/reports?type=trial-balance` | `ovds/reports` | `accounting_ledger` |
| Budgets | `/budgets` | `ovds/budgets` | `accounting_ledger` |
| Budget Variance | `/budgets/variance` | `ovds/budgets` | `accounting_ledger` |
| Depreciation Schedule | `/fixed-assets` | `ovds/fixed-assets` | `accounting_ledger` |
| Leases (IFRS 16) | `/leases` | `ovds/leases` | `accounting_ledger` |
| Accruals & Prepayments | `/accounting/accruals-prepayments` | `ovds/journal-entries` | `accounting_ledger` |
| IFRS Dashboard | `/ifrs` | `ovds/ifrs` | `accounting_ledger` |
| IAS 2 Stock Valuation | `/inventory/valuation` | `ovds/inventory` | `inventory_analysis` |
| Stock on Hand | `/inventory` | `ovds/inventory` | `inventory_analysis` |
| IoT Asset Tracking Logs | `/iot/telemetry` | `iot/events` | `inventory_analysis` |
| Fixed Asset Register | `/fixed-assets` | `ovds/fixed-assets` | `inventory_analysis` |
| Expense Register | `/purchases/expenses` | `ovds/expenses` | `expense_tracking` |
| Petty Cash Audit | `/petty-cash` | `ovds/bank-accounts` | `expense_tracking` |
| Cost Categories | `/transaction-categories` | `ovds/categories` | `expense_tracking` |
| Expense Summary | `/reports?type=expense-summary` | `ovds/reports` | `expense_tracking` |
| All Reports | `/reports` | `ovds/reports` | `reports` |
| Income vs Expense | `/reports?type=income-expense` | `ovds/reports` | `reports` |
| Tax Summary | `/reports?type=tax` | `ovds/reports` | `reports` |
| Custom Reports | `/reports?type=builder` | `ovds/reports` | `reports` |
| Forecasting & AI | `/business-insights` | `dashboard` | `reports` |
| Period Workflow | `/accounting-workflow` | `ovds/periods` | `reports` |

### Phase 4 · Submit to MoR

| Feature | Frontend Route | API Module | Sidebar Group |
|---|---|---|---|
| e-Tax Declaration | `/tax/etax-declaration` | `ovds/vat` | `tax_filing` |
| Net Tax Report (All Types) | `/tax/filing` | `tax/filing` | `tax_filing` |
| Pension Submissions | `/tax/pension-submission` | `tax/pension` | `tax_filing` |
| BIT Submission | `/business-income-tax` | `tax/bit` | `tax_filing` |
| DRRF Quarterly | `/disaster-fund` | `disaster-fund` | `tax_filing` |
| Payment Reference / Voucher | `/tax/payment-reference` | `tax/payment-reference` | `tax_filing` |
| ECC Customs Portal | `/trade` | `tax/trade` | `mor_portals` |
| TASS — SRM Devices | `/vandv` | `tax/tass` | `mor_portals` |
| Audit Trail & IoT Logs | `/audit-logs` | `dashboard/audit-logs` | `mor_compliance` |
| Compliance Auditor | `/compliance-auditor` | `tax/compliance` | `mor_compliance` |
| External Audit | `/audit-outsourcing` | `tax/audit` | `mor_compliance` |
| Compliance Sign-Off | `/period-close` | `ovds/periods` | `mor_compliance` |
| Schedule D Filings | `/tax/schedule-d` | `tax/schedule-d` | `intl_tax` |
| Import Center | `/import-center` | `ovds/import` | `intl_tax` |

### Administration

| Feature | Frontend Route | API Module | Sidebar Group |
|---|---|---|---|
| Companies | `/companies` | `companies` | `company_admin` |
| Multi-Company | `/multi-company-admin` | `companies` | `company_admin` |
| SME Profiles | `/smes` | `companies` | `company_admin` |
| Investments | `/investments` | `ovds/investments` | `capital` |
| Business Loans | `/business-loans` | `ovds/loans` | `capital` |
| Partnerships | `/partnerships` | `ovds/partnerships` | `capital` |
| Projects | `/projects` | `projects` | `projects` |
| Notification Settings | `/admin/notifications-settings` | `notifications` | `system` |

### Developer

| Feature | Frontend Route | API Module | Sidebar Group |
|---|---|---|---|
| API Documentation | `/api-docs` | `docs` | `developer` |
| Developer Guide | `/developers` | `docs` | `developer` |
| IoT Device Registry | `/iot/devices` | `iot/devices` | `iot` |
| Telemetry | `/iot/telemetry` | `iot/events` | `iot` |
| Device Alerts | `/iot/alerts` | `iot/alerts` | `iot` |
| OTA Updates | `/iot/ota` | `iot/ota` | `iot` |
| Smart Billing | `/iot/billing` | `iot/events` | `iot` |

---

## 3. Documentation Structure (`docs/`)

| Directory | Contents |
|---|---|
| `docs/01-getting-started/` | Installation, cloud vs on-premise, setup wizard |
| `docs/02-users-roles/` | RBAC, 15 roles, permissions matrix, Auth0, audit logs |
| `docs/03-settings/` | Company profile, TIN/MoR credentials, Ethiopian Tax Engine, Telebirr, Chapa, IoT registry |
| `docs/04-financial-ops/` | Invoices, bills, PO/GRN, WHT, scanned receipts, items, fixed assets |
| `docs/05-banking/` | Bank accounts, reconciliation, fund transfers, Telebirr & Chapa daily, petty cash |
| `docs/06-tax-compliance/` | VAT, TOT, BIT, DRRF, IFRS, pension submissions, payment reference, compliance sign-off |
| `docs/07-reports/` | Financial statements, dashboards, tax liability estimator, inventory/asset valuation, expense tracking |
| `docs/08-advanced/` | CRM, HR & payroll, inventory, IoT & POS devices, projects, business intelligence |
| `docs/09-developers/` | API, webhooks, sidebar architecture, structure map, AGENTS guide |
| `docs/10-frameworks/` | APA compliance reference |
| `docs/07-reports/IFRS-Financial-Statements-MoR.md` | 58-section IFRS + MoR submission guide (6,200+ lines) |

---

## 4. Adding a New Feature — Checklist

When adding any new feature to OVDS, touch all of these:

```
□  1. Backend: Create NestJS module (service + controller + module)
□  2. Backend: Add to app.module.ts
□  3. Backend: Scope all queries to companyId
□  4. Backend: Apply AnyAuthGuard + CompanyGuard + RBACGuard
□  5. RBAC: Add permission key to rbac.ts (ROUTE_POLICY + role grants)
□  6. Frontend: Create page component in pages/
□  7. Frontend: Register lazy import + route in App.tsx
□  8. Sidebar: Add NavItem to the correct group in navGroups.ts
□  9. Search: Add entry to ALL_NAV_ITEMS in navigation.tsx
□  10. Titles: Add route → i18n key to routeTitleMap in layout.tsx
□  11. i18n: Add English + Amharic + Tigrinya keys to nav.json
□  12. Docs: Add to the relevant README in docs/
□  13. Webhooks: Add webhook event if external systems need notification
□  14. IoT (if applicable): Add recognition rule in IoT module config
```

---

## 5. Key Conventions

- **All DB queries must include `where: { companyId }`** — enforced by CompanyGuard
- **SPURADMIN bypasses all RBAC** — weight 200, explicit `isSpurAdmin()` check
- **Route policies are in `rbac.ts`** — `ROUTE_POLICY['/route'] = 'permission:action'`
- **Nav groups are in `navGroups.ts`** — single source of truth for sidebar structure
- **Icons are from `@ovds/ui`** — use `IconType` keys, never raw SVGs in nav items
- **`isNew: true`** on a NavItem renders a "New" badge — remove after 1 release cycle
- **`pinnable: true`** on a NavItem enables the ★ favorites pin
- **Section labels** (`sectionLabel: true`) are non-clickable phase dividers — one per phase



