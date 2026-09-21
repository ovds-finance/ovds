<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](./CORE-CONFIG.md)
     📌 FILING LIFECYCLE: [docs/FILING-LIFECYCLE.md](./FILING-LIFECYCLE.md)
     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](./subscription%20and%20monitaizetion.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](./UBIQUITOUS-LANGUAGE.md)
     🔄 Last synced: 2026-08-27 -->

# Online VAT Declaretion System (OVDS) — Documentation
**Online VAT Declaretion System (OVDS) — Unified Brand for the Multinational Enterprise**
**Intellectual Property Certification No. 04/03/491**

Online Vat Declaretion System (OVDS) is a comprehensive, production-ready architectural blueprint for a financial management and Online VAT Declaretion System(Ovds) Return platform designed for Ethiopian businesses and extended for multinational enterprise operations. It provides essential tools for invoice, expense tracking, inventory, and cash flow management — scaled to support a very large number of accounting users across multiple companies. Users subscribe online, register their company and modules via website or offline access on-promise full crud operations functioned, and can either use the system directly from the cloud or download it to their own computers after payment. The system handles end-to-end VAT and tax operations with automated report submission to the Ministry of Revenue (MoR) e-Tax portal.

OVDS reconciles three competing financial logic engines, enforces Ethiopian Business Sectors Legally Covered by the Regulation compliance (MoR / IFRS / AABE), and scales to multinational, multi-entity enterprise groups under IFRS/AABE. Sectors that require offline functionality (Resiliency) can continue sales/purchase even during internet interruptions.

> **Stack:** Nx 23 · React 19 + Vite 6 · TypeScript 5.9 · NestJS 11 · Prisma 7.9 (MariaDB/MySQL 8) · Tailwind CSS 3.4 · TanStack Query v5 · oRPC v1 + REST + WebSockets · class-validator (`@ovds/dto`) + Zod v4 (`@ovds/contracts`)
> **Package Manager:** pnpm (pnpm-lock.yaml present; workspace config uses npm-compatible format)
> **Deployment:** Hybrid — Cloud (multi-tenant SaaS) **and** On-Premise (air-gapped / regulated) from one codebase.
> **Clients:** Web PWA + desktop/Electron + mobile/Capacitor shells wrap the single Vite SPA; local offline store via SQLite / sql.js WASM + `@ovds/`.

---

## System Capabilities

Online VAT Declaretion System (OVDS) is architected to handle the full lifecycle of an online VAT Declaretion System(Ovds)Return system at scale, supporting a very large number of accounting users across thousands of companies:

### 1. Multi-Tenant User Scaling
- **Elastic scale:** Cloud tier auto-scales from 50 to 5,000+ concurrent users; On-Premise supports 200–2,000+ per deployment
- **Company isolation:** Every user, invoice, journal, and filing is bound to a `companyId` — enforced by `CompanyGuard` at the data layer
- **22 RBAC roles** across 6 groups (SPURADMIN → PARTNER) with 150+ permissions
- **Bulk operations:** Import Center supports bulk user, customer, vendor, and item imports via CSV

### 2. Subscription-Based Module CRUD
- **Online registration:** Companies subscribe at `ovds.com.et` — plans from Free/Trial → Starter → Professional → Enterprise
- **Module CRUD:** Admins enable/disable modules per company (invoice, purchases, inventory, payroll, tax, IoT, CRM, HR)
- **Entitlement gating:** `MonetizationModule` + `EntitlementGuard` enforce feature access server-side; UI never trusts client state
- **Trial periods:** Automated expiry warnings and entitlement rebuilds

### 3. Cloud & Download Deployment
- **Cloud (SaaS):** Multi-tenant hosted — use directly from the browser after payment
- **On-Premise:** Download the installer, deploy on your own server or laptop — fully air-gapped capable
- **One codebase:** Both tiers share identical business logic, data model, and build graph
- **Offline-first:** Local SQLite with AES-256-GCM encryption + bidirectional sync via `@ovds/`

### 4. VAT & Tax Operations → MoR Automated Submission
- **Full Digital Automated Filing Lifecycle:** Data Capture → Tax Calculation → Analysis → V&V → e-Tax Submission → Payment → Compliance Scoring
- **Automated calculations:** VAT (15%), WHT (2%/3%/15%), TOT (2%/10%), BIT (30%), DRRF (1–5%), PIT/Pension from canonical ledger events
- **Pre-submission V&V:** Output/input VAT reconciliation, TIN validation, ERCA QR verification, zero-declaration checks
- **Direct MoR submission:** Cloud submits via e-Tax API; On-Premise generates signed export files for manual upload
- **Payment integration:** Telebirr, Chapa, CBE Pay, commercial banks — auto-matched to filings
- **Compliance scoring:** Real-time 0–100 score with automated alerts and period-lock enforcement

### 5. End-to-End Data Flow
```
Subscription → Company Registration → Module CRUD → User Onboarding → Data Collection → Tax Calculation → V&V → MoR e-Tax Submission → Payment → Compliance Scoring
```

All terminology, rates, deadlines, and permissions are centralized in [`CORE-CONFIG.md`](./CORE-CONFIG.md). The full automated filing pipeline is defined in [`FILING-LIFECYCLE.md`](./FILING-LIFECYCLE.md).

| # | Section | What It Covers |
|---|---------|---------------|
| [01](01-getting-started/README.md) | **Getting Started** | Quick start, cloud vs on-premise, setup wizard, first-time checklist |
| [01](01-getting-started/INSTALL.md) | Installation Guide | Full on-premise setup: Node.js, MySQL, env vars, migrations, PM2, Nginx, SSL |
| [01](01-getting-started/quick-start.md) | Quick Start | 8-step cloud setup, on-premise sequence, setup checklist, default credentials |
| [01](01-getting-started/dashboard-guide.md) | Dashboard & Widgets Guide | Role-aware widgets, accounting dashboard, keyboard shortcuts, default routes |
| [01](01-getting-started/troubleshooting.md) | Troubleshooting & FAQ | Database, login, VAT, payroll, reconciliation, reports, email, IoT common fixes |
| [01](01-getting-started/mor-eims-onboarding.md) | MoR EIMS Onboarding Guide | Complete self-onboarding, source registration, INSA certificate, and BSP submission — step-by-step with OVDS support indicators |
| [02](02-users-roles/README.md) | **Users & Roles** | User management, 22 roles, RBAC overview |
| [02](02-users-roles/rbac-matrix.md) | RBAC Matrix | All roles with weights, capabilities table, full permissions list, Auth0 SSO, audit logs |
| [02](02-users-roles/multi-company.md) | Multi-Company Management | Create companies, switch context, data isolation, per-company config, IFRS 10 consolidation |
| [03](03-settings/README.md) | **Settings** | System-wide configuration overview |
| [03](03-settings/company-and-tax.md) | Company & Tax Settings | TIN/MoR credentials, localization, Ethiopian Tax Engine, invoice customization |
| [03](03-settings/system-administration-setup.md) | System Administration Setup | 14-phase setup wizard, deployment, company, financial, modules, users, system controls |
| [03](03-settings/banking-and-payments.md) | Banking & Payments Settings | FX rates, bank accounts, Telebirr, Chapa, CBE Pay, Stripe setup |
| [03](03-settings/notifications-and-api.md) | Notifications & API Settings | SMTP, email templates, Slack, geofencing, API keys, App Store |
| [04](04-financial-ops/README.md) | **Financial Operations** | Full AR/AP cycle overview and navigation |
| [04](04-financial-ops/creating-an-invoice.md) | Creating an Invoice | Step-by-step invoice creation, fields reference, discounts, taxes, ERCA QR |
| [04](04-financial-ops/managing-invoices.md) | Managing Invoices | Send, status tracking, record payment, refunds, recurring, archiving |
| [04](04-financial-ops/estimates-and-sales-orders.md) | Estimates & Sales Orders | Quotes, proforma invoices, SO lifecycle, sales receipts |
| [04](04-financial-ops/creating-a-bill.md) | Creating a Bill | Vendor bills, WHT auto-calc, discounts, taxes, OCR receipts |
| [04](04-financial-ops/purchase-orders.md) | Purchase Orders & GRN | PO lifecycle, approval, goods receipt, three-way match |
| [04](04-financial-ops/expense-claims.md) | Expense Claims | Employee claims, approval workflow, HR agency invoice, cost recovery |
| [04](04-financial-ops/payments-and-gateways.md) | Payments & Gateways | Telebirr/Chapa/Stripe setup, payment flow, refunds, payment tracker |
| [04](04-financial-ops/items-catalog.md) | Items Catalog | Products, services, bundles, FIFO/WA costing, IAS 2 valuation |
| [04](04-financial-ops/data-import-export.md) | Data Import / Export | Opening balances, CSV import order, export formats, scheduled exports |
| [04](04-financial-ops/fixed-assets.md) | Fixed Assets | SLM/DB depreciation, IAS 16 vs ERCA, disposals, impairment |
| [04](04-financial-ops/budgets-and-planning.md) | Budgets & Planning | Budget creation, line items, CSV import, Budget vs Actual report, variance dashboard |
| [04](04-financial-ops/general-ledger-and-journals.md) | General Ledger & Journal Entries | Chart of Accounts, manual entries, accruals, prepayments, recurring templates, period-end sequence |
| [04](04-financial-ops/customers-and-vendors.md) | Customers & Vendors | Customer 360, credit scores, statements, vendor TIN/WHT setup, transaction categories |
| [04](04-financial-ops/credit-notes.md) | Credit Notes | Create from invoice, partial credits, apply/refund, VAT reversal, GL entries |
| [04](04-financial-ops/cost-centers.md) | Cost Centers | Create centers, tag transactions, P&L by center, hierarchy, shared cost allocation |
| [04](04-financial-ops/month-end-and-year-end.md) | Month-End & Year-End Closing | 24-step monthly checklist, quarterly DRRF, BIT annual return, year-end financial statements |
| [04](04-financial-ops/multi-currency.md) | Multi-Currency & FX | Add currencies, FX rates, foreign invoices/bills, IAS 21 exchange gains/losses, year-end revaluation |
| [04](04-financial-ops/payment-edge-cases.md) | Payment Edge Cases | Overpayments, advance deposits (IFRS 15), bounced payments, write-offs, split payments |
| [05](05-banking/README.md) | **Banking** | Bank management overview |
| [05](05-banking/banking-module-flow.md) | Banking Module User Flow | Complete lifecycle: accounts, transactions, reconciliation, automation, roles, API, troubleshooting |
| [05](05-banking/bank-accounts.md) | Bank Accounts & Transactions | Add accounts, manual transactions, fund transfers, petty cash |
| [05](05-banking/bank-reconciliation.md) | Bank Reconciliation | CSV/PDF statement import, matching, month-end close |
| [05](05-banking/digital-payments.md) | Digital Payments | Telebirr & Chapa daily operations, auto-matching, CBE Pay |
| [05](05-banking/treasury-collections.md) | Treasury & Collections | Cash forecasting, business loans, overdue AR, credit hold |
| [06](06-tax-compliance/README.md) | **Taxes & Compliance** | Ethiopian fiscal compliance overview |
| [06](06-tax-compliance/vat-and-tot.md) | VAT & TOT | Output/input VAT, monthly filing, reverse-charge, zero declarations, TOT |
| [06](06-tax-compliance/wht-and-other-taxes.md) | WHT & Other Taxes | All WHT types and rates, stamp duty, Schedule D, sector exemptions |
| [06](06-tax-compliance/bit-and-drrf.md) | BIT & DRRF | Business Income Tax, MAT, quarterly installments, DRRF, pension |
| [06](06-tax-compliance/ifrs-and-audit.md) | IFRS & Audit | IFRS tiers, ECL, IFRS 16 leases, compliance score, external audit, period lock |
| [06](06-tax-compliance/leases-ifrs16.md) | IFRS 16 — Lease Accounting | ROU asset, lease liability, PV calculation, amortisation schedule, modifications, disclosures |
| [06](06-tax-compliance/property-tax-and-excise.md) | Property Tax, Excise Tax & TASS | Property tax recording, excise rates, TASS device registration, V&V dashboard, period close checklist |
| [06](06-tax-compliance/universal-tax-configuration.md) | Universal Tax Configuration | Ethiopian ERP blueprint — tax type registry, IAS 12 classification, GL account mappings |
| [07](07-reports/README.md) | **Reports** | Report categories overview |
| [07](07-reports/financial-reports.md) | Financial Reports | Balance Sheet, P&L, Cash Flow, GL, AR/AP Aging, Ratios, Health Score, IFRS 9 ECL |
| [07](07-reports/tax-reports.md) | Tax Reports | Monthly VAT Summary, WHT Report, Tax Liability Dashboard, Tax Calendar |
| [07](07-reports/payroll-reports.md) | Payroll & Attendance Reports | Payroll Summary, PIT Certificates, Pension Schedule, Attendance, Budget vs Actual |
| [07](07-reports/custom-reports.md) | Custom Reports & Scheduling | Report builder, filters, grouping, scheduled email delivery |
| [07](07-reports/IFRS-Financial-Statements-MoR.md) | IFRS Financial Statements Guide | 58-section bilingual IFRS + MoR submission reference |
| [08](08-advanced/README.md) | **Advanced Modules** | CRM, HR, IoT, helpdesk overview |
| [08](08-advanced/hr-and-payroll.md) | HR & Payroll | Employees, attendance, leave, PIT brackets, payroll workflow, loans |
| [08](08-advanced/crm-and-pipeline.md) | CRM & Deal Pipeline | Customer 360, Kanban pipeline, deal-to-invoice, client portal, loyalty |
| [08](08-advanced/iot-and-pos.md) | IoT & POS Devices | Device registry, telematics, smart billing, ERCA fiscal pipeline, OTA |
| [08](08-advanced/helpdesk-and-projects.md) | Helpdesk, Projects & BI | Ticket lifecycle, SLAs, project P&L, Business Insights |
| [08](08-advanced/employee-self-service.md) | Employee Self-Service, PAYE & Gratuity | My Workspace, HR calendar, PAYE declarations, gratuity (Labour Proc. 1156/2019) |
| [08](08-advanced/payroll-edge-cases.md) | Payroll Edge Cases | Mid-month pro-ration, salary changes, arrears, bonuses, termination pay, corrections |
| [08](08-advanced/compliance-and-credibility.md) | Compliance Dashboard & Business Credibility | ERCA compliance score, checklist, alerts, IFRS S1/S2, bank credibility score, scheduled sends |
| [08](08-advanced/monetization-and-plans.md) | Monetization & Plans | Subscription plans, entitlements, trial periods, SRM unlock, multi-company |
| [subscription and monitaizetion.md](subscription%20and%20monitaizetion.md) | Subscription & Monetization Guide | OVDS-specific subscription model, company CRUD, cloud/download, VAT/MoR lifecycle |
| [08](08-advanced/trade-and-customs.md) | Trade & Customs | Import landed cost, customs duty, surtax, advance BIT, VAT at import, e-SAD |
| [08](08-advanced/security-guide.md) | Security Guide | Admin security controls: lockout, RBAC, API keys, audit review, hardening checklist |
| [08](08-advanced/SECURITY.md) | Security Hardening (Dev) | Helmet headers, rate limits, JWT, input validation, multi-tenancy, CSP |
| [09](09-developers/README.md) | **Developers** | API, webhooks, architecture, developer setup |
| [09](09-developers/API.md) | API Reference | REST endpoints, authentication, pagination, error codes, WebSocket |
| [09](09-developers/WEBHOOKS.md) | Webhooks | Payment gateway webhooks, eTax/ERCA, Slack, env variables |
| [09](09-developers/AGENTS.md) | Developer Guide | Project structure, RBAC engine, backend modules, frontend pages |
| [09](09-developers/STRUCTURE.md) | Structure Map | 68+ backend modules, 222+ frontend pages, 49+ dashboard widgets, adding-feature checklist |
| [09](09-developers/SRM-HYBRID-DEPLOYMENT.md) | SRM & Hybrid Deployment | SRM lockout, Options A/B, MoR transmission modes, pay-to-unlock |
| [09](09-developers/UI-ENHANCEMENT-GUIDE.md) | UI Enhancement Guide | 60-30-10 color system, typography, grid, table density, keyboard shortcuts |
| [09](09-developers/DOCS-PORTAL.md) | Docs Portal | CI/CD pipeline, live extractor, GitHub Actions |
| [09](09-developers/SIDEBAR_UPGRADE_SUMMARY.md) | Sidebar Architecture | Four-phase sidebar group map, keyboard shortcuts, route-to-group mapping |
| [09](09-developers/TROUBLESHOOTING.md) | Troubleshooting & Error Reference | Error envelope, Symptom→Cause→Resolution, HTTP error registry, Prisma `Pxxxx` codes, env/ports checklist |
| [09](09-developers/UPGRADING.md) | Upgrading & Schema Migration | Nx migrate flow, Prisma `migrate dev`/`deploy` + rollback, deprecation strategy |
| [09](09-developers/ADDING-A-MODULE.md) | Adding a Module (Full-Stack Playbook) | Prisma model → NestJS resource → React feature → RBAC/routing/docs wiring |
| [09](09-developers/DATA-MODEL.md) | Data Model Reference | Auto-generated from `schema.prisma` — 325 models, multi-tenancy audit, enums (git-diffable; excluded from portal DB) |
| [10](10-frameworks/README.md) | **Frameworks & Reference** | IFRS standards, accounting KB, automation, regulatory reference |
| [10](10-frameworks/APA.md) | Accounting Process Automation | Detailed APA implementation guide with cron references |
| [CORE](./CORE-CONFIG.md) | **Core Configuration & Terminology** | Centralized references — terminology registry, data-flow links, RBAC matrix, GL account map, tax rates, portal URLs. Dynamic config hub for all docs. |
| [LIFECYCLE](./FILING-LIFECYCLE.md) | **Digital Automated Filing Lifecycle** | End-to-end pipeline: data capture → tax calc → V&V → e-Tax submission → payment → compliance scoring. Automated cron schedule + compliance gates. |
| [ARCH](ARCHITECTURE.md) | System Architecture | Nx monorepo, build graph, NestJS module map, IoT tax pipeline |
| [MODULES](MODULES-BLUEPRINT.md) | **Module Ecosystem Blueprint** | Complete blueprint of all primary functional modules, categorized by business function with data-flow pipeline and installation guide |
| [REVIEW](REVIEW.md) | System Review | Gap analysis, 51 resolved issues, production readiness checklist |
| [Compliance Documentation](../compliance/README.md) | Compliance Docs | Master checklist, OF/AEAD/001 cybersecurity audit, MoR EIMS functional gap analysis, compliance status dashboard |

---

## Four-Phase Workflow

OVDS follows Ethiopia's financial compliance cycle directly:

```
1 · Setup         →  Legal entity, TIN/MoR creds, tax engine, banking, IoT devices
2 · Daily Ops     →  Sales, purchases, banking (Telebirr/Chapa), payroll, IoT sync
3 · Analysis      →  Financial statements, GL, dashboards, inventory, expense review
4 · Submit to MoR →  e-Tax, net tax report, pension, audit trail, compliance sign-off
```

> **This four-phase workflow maps directly to the 6-phase Digital Automated Filing Lifecycle — see [`FILING-LIFECYCLE.md`](./FILING-LIFECYCLE.md) for the full automated pipeline, cron schedule, and compliance gate checkpoints. All terminology, rates, deadlines, and permissions are centralized in [`CORE-CONFIG.md`](./CORE-CONFIG.md).**



---

## Recommended Onboarding Path

```
 1. Quick Start     → Read docs/01-getting-started/quick-start.md
 2. Setup Wizard    → Press W in-app, or go to /getting-started
 3. System Administration Setup → Administration → System Administration Setup (docs/03-settings/system-administration-setup.md)
 4. TIN & MoR       → Settings → Company & Tax (docs/03-settings/company-and-tax.md)
 5. Tax Engine      → Setup → Tax Configuration (/tax/dashboard)
 6. Banking         → Settings → Banking & Payments (docs/03-settings/banking-and-payments.md)
 7. IoT Devices     → App Store → IoT Module → IoT → Device Registry (/iot/devices)
 8. Users & Roles   → Invite team, assign roles (docs/02-users-roles/rbac-matrix.md)
 9. Import Data     → Chart of Accounts → Customers → Vendors → Items → Employees
 10. First Invoice  → Sales → Invoices → New Invoice (docs/04-financial-ops/creating-an-invoice.md)
 11. First Payroll  → HR → Payroll → Run Payroll (docs/08-advanced/hr-and-payroll.md)
 12. First VAT      → Tax → VAT Administration → Compute (docs/06-tax-compliance/vat-and-tot.md)
 13. Reports        → Balance Sheet, P&L (docs/07-reports/financial-reports.md)
 14. MoR Submission → Tax → e-Tax Declaration (docs/06-tax-compliance/vat-and-tot.md#step-4)
  ```
  > **Filing Lifecycle reference:** Steps 12–14 flow through the [Digital Automated Filing Lifecycle](./FILING-LIFECYCLE.md) (Phases 2–6). All tax rates, deadlines, and permissions are defined in [Core Configuration](./CORE-CONFIG.md).

---

## Full Route Reference

### Phase 1 · Setup
| Page | Route | Permission |
|------|-------|-----------|
| Chart of Accounts | `/accounting` | `ovds:read` |
| Opening Balances | `/accounting/opening-balances` | `ovds:write` |
| Company Settings | `/settings` | `settings:read` |
| TIN & MoR Credentials | `/settings/company-profile` | `settings:write` |
| Business Registration | `/business-registration` | `settings:write` |
| Setup Wizard | `/getting-started` | `settings:read` |
| Users | `/users` | `users:read` |
| Roles & Permissions | `/role-permissions` | `role_permissions:read` |
| Currencies & FX | `/fx-rates` | `ovds:read` |
| Bank Accounts Setup | `/banking/accounts` | `banking:read` |
| Digital Wallets (Telebirr) | `/settings/digital-wallets` | `banking:read` |
| Chapa Payment Gateway | `/settings/payment-gateways/chapa` | `apps:read` |
| Tax Dashboard | `/tax/dashboard` | `vat:read` |
| e-Tax Configuration | `/tax/etax-declaration` | `vat:write` |
| Penalty Calculator | `/tax/penalty-calculator` | `vat:read` |
| App Store | `/app-store` | `apps:read` |
| IoT Device Registry | `/iot/devices` | `api_docs:read` |

### Phase 2 · Daily Operations
| Page | Route | Permission |
|------|-------|-----------|
| Invoices | `/invoices` | `invoices:read` |
| Estimates & Quotes | `/estimates` | `invoices:read` |
| Credit Notes | `/credit-notes` | `invoices:read` |
| Sales Orders | `/sales-orders` | `invoices:read` |
| Receipts | `/receipts` | `invoices:read` |
| Proforma Invoices | `/sales/proforma` | `invoices:read` |
| Payment Tracker | `/payment-tracker` | `invoices:read` |
| Bills | `/purchases/bills` | `bills:read` |
| Purchase Orders | `/purchases/orders` | `purchase_orders:read` |
| Expenses | `/purchases/expenses` | `expenses:read` |
| Goods Received Notes | `/purchases/grn` | `bills:read` |
| Debit Notes | `/purchases/debit-notes` | `bills:read` |
| Scanned Receipts | `/purchases/scanned-bills` | `bills:read` |
| WHT Certificates | `/tax/wht-certificates` | `vat:write` |
| CRM & Contacts | `/crm/contacts` | `crm:contacts:read` |
| Sales Pipeline | `/crm/pipeline` | `crm:deals:read` |
| Customer Summary | `/customer-summary` | `crm:read` |
| Client Portal | `/client-portal` | `crm:read` |
| Vendors | `/purchases/vendors` | `bills:read` |
| Bank Accounts | `/banking/accounts` | `banking:read` |
| Transactions | `/transactions` | `ovds:read` |
| Fund Transfers | `/fund-transfers` | `fund_transfers:read` |
| Bank Reconciliation | `/bank-reconciliation` | `bank_reconciliation:read` |
| Import Statements | `/bank-statement-import` | `bank_statement_import:write` |
| Petty Cash | `/petty-cash` | `banking:read` |
| Telebirr & Chapa (daily) | `/banking/digital-payments` | `banking:read` |
| IoT Device Registry | `/iot/devices` | `api_docs:read` |
| Sensor / Telematics Sync | `/iot/telemetry` | `api_docs:read` |
| Smart Billing (POS) | `/iot/billing` | `api_docs:read` |
| Device Alerts | `/iot/alerts` | `api_docs:read` |
| OTA Updates | `/iot/ota` | `api_docs:read` |
| Items & Products | `/items` | `items:read` |
| Stock Movements | `/inventory` | `inventory:read` |
| IAS 2 Valuation | `/inventory/valuation` | `inventory:read` |
| Employees | `/employees` | `employees:read` |
| Attendance | `/attendance` | `attendance:read` |
| Leave Management | `/leaves` | `leaves:read` |
| Payroll Runs | `/payroll` | `payroll:read` |
| PAYE & Pension | `/hr/paye-declarations` | `payroll:read` |
| VAT Return | `/vat` | `vat:read` |
| TOT Filing | `/tax/tot` | `vat:read` |
| Excise Tax | `/tax/excise-tax` | `vat:read` |
| Stamp Duty | `/tax/stamp-duty` | `vat:read` |
| Schedule D | `/tax/schedule-d` | `vat:read` |

### Phase 3 · Analysis
| Page | Route | Permission |
|------|-------|-----------|
| Balance Sheet | `/reports?type=bs` | `reports:bs:read` |
| Profit & Loss | `/reports?type=pl` | `reports:pl:read` |
| Cash Flow | `/reports?type=cf` | `reports:cf:read` |
| Changes in Equity | `/reports/equity` | `reports:financial:read` |
| Notes to Financials | `/reports?type=notes` | `reports:financial:read` |
| Main Dashboard | `/dashboard` | `ovds:read` |
| Accounting Dashboard | `/accounting-dashboard` | `ovds:read` |
| Tax Liability Estimator | `/tax/liability-estimator` | `vat:read` |
| Trial Balance | `/reports?type=trial-balance` | `reports:gl:read` |
| Budgets | `/budgets` | `ovds:read` |
| Budget Variance | `/budgets/variance` | `ovds:read` |
| Fixed Assets | `/fixed-assets` | `fixed_assets:read` |
| Leases (IFRS 16) | `/leases` | `ifrs16:leases:read` |
| IFRS Dashboard | `/ifrs` | `ifrs:read` |
| IAS 2 Stock Valuation | `/inventory/valuation` | `inventory:read` |
| IoT Asset Tracking Logs | `/iot/telemetry` | `api_docs:read` |
| Expense Register | `/purchases/expenses` | `expenses:read` |
| Petty Cash Audit | `/petty-cash` | `banking:read` |
| All Reports | `/reports` | `reports:read` |
| Tax Summary | `/reports?type=tax` | `reports:read` |
| Custom Reports | `/reports?type=builder` | `reports:custom:read` |
| Forecasting & AI | `/business-insights` | `insights:read` |

### Phase 4 · Submit to MoR
| Page | Route | Permission |
|------|-------|-----------|
| e-Tax Declaration | `/tax/etax-declaration` | `vat:file` |
| Net Tax Report (All Types) | `/tax/filing` | `vat:file` |
| Pension Submissions | `/tax/pension-submission` | `payroll:read` |
| BIT Submission | `/business-income-tax` | `bit:file` |
| DRRF Quarterly | `/disaster-fund` | `disaster_fund:read` |
| Payment Reference / Voucher | `/tax/payment-reference` | `vat:file` |
| ECC Customs Portal | `/trade` | `vat:read` |
| TASS — SRM Devices | `/vandv` | `vat:read` |
| Audit Trail & IoT Logs | `/audit-logs` | `audit_logs:read` |
| Compliance Auditor | `/compliance-auditor` | `audit_logs:read` |
| External Audit | `/audit-outsourcing` | `audit_outsourcing:read` |
| Compliance Sign-Off | `/period-close` | `period_close:read` |

### Administration
| Page | Route | Permission |
|------|-------|-----------|
| Companies | `/companies` | `companies:read` |
| Multi-Company | `/multi-company-admin` | `companies:read` |
| Investments | `/investments` | `investments:read` |
| Business Loans | `/business-loans` | `business_loans:read` |
| Partnerships | `/partnerships` | `partnerships:read` |
| Projects | `/projects` | `projects:read` |
| Notification Settings | `/admin/notifications-settings` | `notifications:config` |
| API Documentation | `/api-docs` | `api_docs:read` |

---

## Ethiopian Tax Quick Reference

| Tax | Rate | Basis | Filing Deadline |
|-----|------|-------|----------------|
| VAT | 15% | Output − Input VAT | 30th of following month |
| TOT — Goods | 2% | Turnover (Category B) | 30th of following month |
| TOT — Services | 10% | Turnover (Category B) | 30th of following month |
| WHT — Services (domestic) | 2% | Payments ≥ ETB 500 | 30th of following month |
| WHT — Goods (domestic) | 2% | Payments ≥ ETB 10,000 | 30th of following month |
| WHT — Non-Resident | 15% | Any foreign service payment | 30th of following month |
| WHT — Corporate Rent | 30% | Rent to corporate landlord | 30th of following month |
| WHT — Dividend | 15% | Profit distribution | At transaction |
| WHT — Interest | 10% | Interest payments | At transaction |
| PIT (0% bracket) | 0% | ≤ ETB 2,000/month | Monthly via payroll |
| PIT (top bracket) | 35% | > ETB 14,000/month | Monthly via payroll |
| Pension — employee | 7% | Basic salary (cap ETB 15,000) | Monthly (payroll date) |
| Pension — employer | 11% | Basic salary (cap ETB 15,000) | Monthly (payroll date) |
| DRRF | 1–5% | Transaction value (sector-dependent) | 15th of last quarter month |
| BIT | 30% | Net taxable profit | November 7 (Hidar 1 E.C.) |
| MAT | 2.5% | Annual gross turnover | November 7 — whichever is higher vs BIT |
| Stamp Duty | 1% (min ETB 500) | Qualifying legal documents | At transaction |
| Capital Gains | 15% | Asset disposal | At transaction |

**Ethiopian fiscal year:** Hamle 1 (≈ July 7) → Sene 30 (≈ July 6)  
**BIT filing deadline:** November 7 (4 months after FY end)  
**Advance BIT:** Quarterly — September 7, December 7, March 7, June 7

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [AGENTS.md](09-developers/AGENTS.md) | Developer Guide | Project structure, RBAC engine (22 roles, 150+ permissions), backend modules, frontend pages, coding conventions |
| [API.md](09-developers/API.md) | REST endpoint reference, pagination, error codes, WebSocket |
| [WEBHOOKS.md](09-developers/WEBHOOKS.md) | Webhooks, Telebirr, Chapa, IoT, payment gateway integrations |
| [STRUCTURE.md](09-developers/STRUCTURE.md) | Structure Map | 68+ backend modules, 222+ frontend pages, 49+ dashboard widgets, adding-feature checklist |
| [SIDEBAR_UPGRADE_SUMMARY.md](09-developers/SIDEBAR_UPGRADE_SUMMARY.md) | Sidebar Architecture | 12-domain navigation (`OVDS_NAV_PARENTS`), keyboard shortcuts, route-to-group mapping |
| [IFRS-Financial-Statements-MoR.md](07-reports/IFRS-Financial-Statements-MoR.md) | 58-section bilingual IFRS + MoR submission guide |
| [INSTALL.md](01-getting-started/INSTALL.md) | Installation, environment variables, production deployment |
| [REVIEW.md](REVIEW.md) | System analysis, 51 resolved issues, production readiness checklist |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Nx monorepo layout, build graph, IoT tax pipeline, database commands |
| [SECURITY.md](08-advanced/SECURITY.md) | Security hardening: headers, rate limiting, injection prevention, checklist |
| [APA.md](10-frameworks/APA.md) | Accounting Process Automation: cron map, automation coverage, setup guides |
| [DOCS-PORTAL.md](09-developers/DOCS-PORTAL.md) | Documentation portal: CI/CD pipeline, live extractor, GitHub Actions |
| [ORDER_DISPATCH_DATA_MODEL.md](04-financial-ops/order-dispatch-data-model.md) | Sales Orders → Dispatch/Delivery → invoice data model: schema design for SO, dispatch dockets, credit notes, pricing engine, and assembly/kit expansion |
| [CORE-CONFIG.md](CORE-CONFIG.md) | **Core Configuration & Terminology** — centralized references, data-flow links, RBAC matrix, GL account map, tax rates, and the standard reference block convention |
| [FILING-LIFECYCLE.md](FILING-LIFECYCLE.md) | **Digital Automated Filing Lifecycle** — 6-phase pipeline from transaction capture to compliance scoring with cron schedule and gate checkpoints |


https://github.com/ovds-finance/ovds.git 

