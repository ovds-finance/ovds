# OVDS DDD Bounded Contexts

This document defines the Domain-Driven Design bounded contexts for the OVDS monorepo.

## Philosophy

The monorepo is organized around **business domains** (bounded contexts), not technical layers. Each domain owns its business logic, entities, events, and DTOs. Application concerns (controllers, NestJS modules) stay in `apps/backend`. UI concerns (components, hooks, pages) stay in `packages/features/*` and `apps/frontend`.

## Directory Structure

```
packages/
├── domains/                    # Backend bounded contexts (business logic)
│   ├── infrastructure/         # BaseService, pagination, where builder
│   ├── accounting/             # dto/, entities/, events/, lib/
│   ├── banking/                # dto/, entities/, events/, lib/, constants.ts
│   ├── crm/                    # dto/, entities/, events/, lib/, constants.ts
│   ├── double-entry/           # dto/, entities/, events/, lib/, constants.ts, tests/
│   ├── general-ledger-compliance/
│   ├── helpdesk/
│   ├── hr/                     # lib/, dto/, events/, constants.ts
│   ├── ifrs/
│   ├── inventory/
│   ├── invoice/
│   ├── reporting/
│   ├── sales/
│   ├── settings/               # Removed controllers (DDD violation fixed)
│   ├── sub-ledger/
│   ├── tax/
│   ├── vat/
│   ├── audit-outsourcing/
│   └── ...                     # Other bounded contexts

├── features/                   # 53 frontend feature libraries
│   ├── accounting/             # services/ovdsApi.ts
│   ├── banking/                # services/bankingApi.ts, hooks/, components/, pages/
│   ├── hr/                     # services/hrApi.ts, hooks/, types/
│   ├── reporting/              # services/reportingApi.ts, hooks/
│   ├── settings/               # services/settingsApi.ts, components/, hooks/, pages/
│   ├── invoice/                # Invoice feature
│   ├── sales/                  # Sales feature
│   ├── purchases/              # Purchases feature
│   ├── inventory/              # Inventory feature
│   ├── items/                  # Items feature
│   ├── tax/                    # Tax feature
│   ├── vat/                    # VAT feature
│   ├── compliance/             # Compliance feature
│   ├── ifrs/                   # IFRS feature
│   ├── crm/                    # CRM feature
│   ├── dashboard/              # Dashboard widgets
│   ├── notifications/          # Notifications feature
│   ├── iot/                    # IoT feature
│   ├── device-control/         # Device control feature
│   ├── trade/                  # Trade & customs feature
│   ├── projects/               # Projects feature
│   ├── workflow/               # Workflow feature
│   ├── appstore/               # App Store feature
│   ├── expense-claims/         # Expense claims feature
│   ├── payroll/                # Payroll feature
│   ├── cost-centers/           # Cost centers feature
│   ├── currency/               # Currency/ FX feature
│   ├── custom-fields/          # Custom fields feature
│   ├── customers/              # Customers feature
│   ├── vendors/                # Vendors feature
│   ├── receipts/               # Receipts feature
│   ├── payments/               # Payments feature
│   ├── treasury/               # Treasury feature
│   ├── disaster-fund/          # Disaster Fund feature
│   ├── onboarding/             # Onboarding feature
│   ├── release/                # Release management feature
│   ├── security/               # Security feature
│   ├── security-assessment/    # Security assessment feature
│   ├── security-evaluator/     # Security evaluator feature
│   ├── manufacturing/          # Manufacturing feature
│   ├── loyalty/                # Loyalty feature
│   ├── fiscal/                 # Fiscal feature
│   └── ...                     # Other feature libraries

├── modules/                    # 3 module registries
│   ├── ovds/                   # Core OVDS ModuleApp
│   ├── hr/                     # HR ModuleApp
│   └── maintaining-technology/

├── contracts/                  # Zod schemas, oRPC router
├── database/                   # Prisma schema, migrations, generated client
├── shared/                     # RBAC, EIMS, tax config, types
├── core/                       # ModuleBootstrap, permissions, menu
├── ui/                         # Shared UI components
├── design-system/              # Design tokens, themes
└── dto/                        # Shared DTOs
```

## Bounded Contexts

### Identity
- **Models**: User, RoleDefinition, RolePermission, UserRole, Permission, Session, OtpCode, TokenBlacklist
- **Domain**: `packages/domains/identity/` (conceptual — logic lives in `accounting` and `settings` domains)
- **Feature**: `packages/features/auth/`
- **Backend**: `apps/backend/src/auth/`
- **Responsibilities**: Authentication, authorization, RBAC, session management

### Accounting / Core Finance
- **Models**: JournalEntry, JournalLine, LedgerEntry, Account, FiscalYear, LedgerMappingRule, FinancialCycle, PeriodClose
- **Domain**: `packages/domains/accounting/`
- **Feature**: `packages/features/accounting/`
- **Backend**: `apps/backend/src/` (core finance controllers)
- **Responsibilities**: Core accounting, chart of accounts, journal entries, ledger

### Sales
- **Models**: SalesOrder, SalesOrderLine, SalesOrderCreditNote, SalesOrderCreditNoteItem, Contract
- **Domain**: `packages/domains/sales/`
- **Feature**: `packages/features/sales/`
- **Backend**: `apps/backend/src/sales/`
- **Responsibilities**: Sales orders, contracts, credit notes

### Purchases / Procurement
- **Models**: PurchaseOrder, GoodsReceivedNote, GrnItem, LetterOfCredit, Vendor
- **Domain**: `packages/domains/accounting/` (purchase logic consolidated)
- **Feature**: `packages/features/purchases/`
- **Backend**: `apps/backend/src/purchases/`
- **Responsibilities**: Purchase orders, procurement, GRN, LC

### Invoice
- **Models**: Invoice, InvoiceItem, InvoicePayment, Bill, BillItem, BillPayment, DebitNote, Estimate, Receipt
- **Domain**: `packages/domains/invoice/`
- **Feature**: `packages/features/invoice/`
- **Backend**: `apps/backend/src/` (invoice controllers)
- **Responsibilities**: Invoicing, billing, estimates, debit notes

### Payments / Banking
- **Models**: Payment, PaymentBatch, BankAccount, BankTransaction, BankFxRate, BankTransactionFx, BankMatchingRule, ReconciliationPeriod, ReconciliationReport, CashForecast, BankFeed
- **Domain**: `packages/domains/banking/`
- **Feature**: `packages/features/banking/`
- **Backend**: `apps/backend/src/banking/`
- **Responsibilities**: Payments, bank accounts, transaction reconciliation, FX

### HR
- **Models**: Employee, Department, Attendance, Leave, PayrollRecord, PayrollLine, Deduction, ReimbursementClaim, Reward, Review, LoanRequest, Holiday, Shift, BiometricData
- **Domain**: `packages/domains/hr/`
- **Feature**: `packages/features/hr/`
- **Backend**: `apps/backend/src/hr/`
- **Responsibilities**: Employee management, payroll, attendance, leave management

### Items / Inventory
- **Models**: Item, ItemGroup, ItemVariant, Category, StockMovement, BomHeader, BomLine, Warehouse, WarehouseStock, TransferOrder, TransferOrderItem, InventoryAdjustment, StockTransaction, StockValuationLayer, StockDemandByOrder, PurchaseReceipt
- **Domain**: `packages/domains/items/`, `packages/domains/inventory/`
- **Feature**: `packages/features/items/`, `packages/features/inventory/`
- **Backend**: `apps/backend/src/items/`
- **Responsibilities**: Product catalog, item variants, BOM, warehouse management, stock tracking

### CRM
- **Models**: Customer, Vendor, CrmContact, CrmCompany, CrmDeal, CrmActivity, CrmPipeline, CustomerInteraction, CustomerLoyalty, LoyaltyRedemption, LoyaltyTierConfig, CreditHold
- **Domain**: `packages/domains/crm/`
- **Feature**: `packages/features/crm/`
- **Backend**: `apps/backend/src/crm/`
- **Responsibilities**: Customer relationship, vendor management, loyalty

### Reporting / Analytics
- **Models**: ReportDefinition, ReportLine, FinancialTracking, Revenue
- **Domain**: `packages/domains/reporting/`
- **Feature**: `packages/features/reporting/`
- **Backend**: `apps/backend/src/` (reporting controllers)
- **Responsibilities**: Financial reports, dashboards, analytics

### Settings / Configuration
- **Models**: SettingCategory, SettingGroup, Setting, SettingInput, SettingValue, Module, ModuleVersion, CompanyModule, ModuleSetting, FeatureFlag, CompanyFeatureFlag, SystemSetting, Company, Entity, EntityGroup
- **Domain**: `packages/domains/settings/`
- **Feature**: `packages/features/settings/`
- **Backend**: `apps/backend/src/settings/`
- **Responsibilities**: System configuration, module management, company settings

### Double-Entry / Ledger
- **Models**: Account, JournalEntry, JournalLine, LedgerEntry, FiscalYear, LedgerMappingRule, FinancialCycle, PeriodClose
- **Domain**: `packages/domains/double-entry/`
- **Feature**: `packages/features/double-entry/`
- **Backend**: `apps/backend/src/ledger/`
- **Responsibilities**: Chart of accounts, journal entries, ledger

### Tax
- **Models**: TaxRate, TaxRule, TaxLossCarryforward, TaxAuditLog, TaxDisputeCase, TaxClearanceRequest, ProvisionalTaxPayment, ForeignTaxCredit, ThinCapMonitor, TransferPricingRecord, NetTaxPayableReport
- **Domain**: `packages/domains/tax/`
- **Feature**: `packages/features/tax/`
- **Backend**: `apps/backend/src/tax/`
- **Responsibilities**: Tax calculations, tax rules, tax reporting

### VAT (Specialized Tax)
- **Models**: VatDeclaration, VatLineItem, VatFiling, VatETaxSubmission, VatInputLedger, VatOutputLedger, VatNote, VatRefundClaim, VatReverseCharge, VatWithholding, VatExportEvidence
- **Domain**: `packages/domains/vat/`
- **Feature**: `packages/features/vat/`
- **Backend**: `apps/backend/src/tax/`
- **Responsibilities**: VAT-specific calculations, filings, submissions

### Compliance / IFRS
- **Models**: MasterComplianceChecklist, MasterComplianceItem, AccreditationChecklist, AccreditationItem, PeriodLock, VerifiedLedgerState, IfrsStandard, ContractSnapshot, PerformanceObligation, RevenueAllocation, RecognitionScheduleRow, Ifrs15Schedule, Lease, LeasePayment, LeaseJournalEntry, LeaseModification, RemeasurementJournal, SoftwareAsset, SoftwareWorkItem, CapitalizationDecision, SoftwareAmortizationRow
- **Domain**: `packages/domains/compliance/`, `packages/domains/ifrs/`
- **Feature**: `packages/features/compliance/`, `packages/features/ifrs/`
- **Backend**: `apps/backend/src/compliance/`
- **Responsibilities**: Compliance tracking, period locks, IFRS compliance, revenue recognition, leases, software capitalization

### Platform / Helpdesk / IoT
- **Models**: Ticket, TicketReply, WorkOrder, WorkOrderOutput, IotDevice, IotTelemetry, IotAlert, OtaUpdateJob, IotBillingTrigger, IotDashboardWidget, DeviceControlPolicy, DeviceControlChangeRequest, SrmDevice, PortalSubmissionLog, Notification, NotificationCampaign, NotificationTemplate, OutboxEvent, WebhookEndpoint, WebhookDelivery
- **Domain**: `packages/domains/platform/`, `packages/domains/helpdesk/`
- **Feature**: `packages/features/platform/`, `packages/features/helpdesk/`
- **Backend**: `apps/backend/src/platform/`, `apps/backend/src/helpdesk/`
- **Responsibilities**: Helpdesk, notifications, IoT, workflow, webhooks

### Trade / Logistics
- **Models**: TradeShipment, TradeShipmentStep, TradeDocument, ForexApproval, TradeLicense, ProformaInvoice, DispatchDocket, DispatchDocketLine, DeliveryPerformance
- **Domain**: `packages/domains/trade/`
- **Feature**: `packages/features/trade/`
- **Backend**: `apps/backend/src/` (trade controllers)
- **Responsibilities**: Shipping, logistics, dispatch, customs

### Projects
- **Models**: Project, ProjectTask, ProjectMilestone, ProjectTimesheet, ProjectActivity, ProjectComment, ProjectAttachment, ProjectTimer, ProjectFinancialLink
- **Domain**: `packages/domains/projects/`
- **Feature**: `packages/features/projects/`
- **Backend**: `apps/backend/src/projects/`
- **Responsibilities**: Project management, tasks, timesheets

### General Ledger Compliance
- **Models**: Compliance-related ledger models
- **Domain**: `packages/domains/general-ledger-compliance/`
- **Feature**: `packages/features/general-ledger-compliance/`
- **Backend**: `apps/backend/src/` (GL compliance controllers)
- **Responsibilities**: General ledger compliance, audit outsourcing

### Audit Outsourcing
- **Models**: Audit-related models
- **Domain**: `packages/domains/audit-outsourcing/`
- **Feature**: `packages/features/audit-outsourcing/`
- **Backend**: `apps/backend/src/` (audit controllers)
- **Responsibilities**: Audit outsourcing, external audit workflows

### Sub-Ledger
- **Models**: Sub-ledger specific models
- **Domain**: `packages/domains/sub-ledger/`
- **Feature**: `packages/features/sub-ledger/`
- **Backend**: `apps/backend/src/` (sub-ledger controllers)
- **Responsibilities**: Sub-ledger management, subsidiary ledgers

## Frontend Service Extraction Checklist

### Already Extracted (frontend is re-export shim)
- [x] `apps/frontend/src/services/hrApi.ts` → `@ovds/features/hr`
- [x] `apps/frontend/src/services/ovdsApi.ts` → `@ovds/features/accounting`

### Already in Feature Package (create shim in frontend)
- [ ] `apps/frontend/src/services/banksApi.ts` → `@ovds/features/banking`
- [ ] `apps/frontend/src/services/inventoryApi.ts` → `@ovds/features/inventory`
- [ ] `apps/frontend/src/services/taxApi.ts` → `@ovds/features/tax`
- [ ] `apps/frontend/src/services/tradeApi.ts` → `@ovds/features/trade`
- [ ] `apps/frontend/src/services/treasuryApi.ts` → `@ovds/features/treasury`
- [ ] `apps/frontend/src/services/ifrsApi.ts` → `@ovds/features/ifrs`
- [ ] `apps/frontend/src/services/iotApi.ts` → `@ovds/features/iot`
- [ ] `apps/frontend/src/services/deviceControlApi.ts` → `@ovds/features/device-control`
- [ ] `apps/frontend/src/services/monetizationApi.ts` → `@ovds/features/monetization`
- [ ] `apps/frontend/src/services/releaseApi.ts` → `@ovds/features/release`

### Need Feature Package Update (merge APIs)
- [ ] `apps/frontend/src/services/reportsApi.ts` → `@ovds/features/reporting` (merge React hooks into `hooks/`)
- [ ] `apps/frontend/src/services/notifications.ts` → `@ovds/features/notifications` (merge templates/campaigns)
- [ ] `apps/frontend/src/services/settingsCatalogApi.ts` → `@ovds/features/settings` (already in `settingsApi.ts`)

### Need New/Expanded Feature Package
- [ ] `apps/frontend/src/services/reconciliationApi.ts` → `@ovds/features/banking` (add to existing)
- [ ] `apps/frontend/src/services/offlineQueue.ts` → `@ovds/features/offline-sync` (empty package)
- [ ] `apps/frontend/src/services/newTaxApi.ts` → `@ovds/features/tax` (add to existing)
- [ ] `apps/frontend/src/services/vatApi.ts` → create `@ovds/features/vat` (new package)

### Core / Shared Services (stay in frontend or move to shared)
- [ ] `apps/frontend/src/services/api.ts` — core HTTP client, stay in app
- [ ] `apps/frontend/src/services/auth0TokenRefresh.ts` → `@ovds/features/auth`
- [ ] `apps/frontend/src/services/advancedAccessApi.ts` → `@ovds/features/settings` or auth

### Inline Frontend Features to Extract
- [ ] `apps/frontend/src/features/reports/` → `packages/features/reporting/src/pages/` and `components/`
- [ ] `apps/frontend/src/features/accounting/hooks/` → `packages/features/accounting/src/hooks/`

## DDD Rules

### 1. Domain Libraries (`packages/domains/*`)
- **Own**: Business logic, entities, value objects, domain events, DTOs
- **Do NOT own**: Controllers, NestJS modules, UI components
- **Dependencies**: Can only import `@ovds/domains/infrastructure`, `@ovds/core`, `@ovds/shared`
- **Communication**: Via domain events or dependency interfaces (Deps pattern)

### 2. Feature Libraries (`packages/features/*`)
- **Own**: API clients, React hooks, components, pages, types
- **Dependencies**: Can import `@ovds/contracts`, `@ovds/ui`, `@ovds/design-system`, `@ovds/shared`
- **Communication**: Via API contracts (Zod schemas) — NO direct domain imports

### 3. Application Layer (`apps/backend`)
- **Own**: NestJS controllers, modules, guards, interceptors, pipes
- **Dependencies**: Can import all `@ovds/domains/*`, `@ovds/modules/*`, `@ovds/contracts`
- **Responsibility**: Wire domain services together via DI, handle HTTP concerns

### 4. Frontend App (`apps/frontend`)
- **Own**: App shell, routing, global state, layout
- **Dependencies**: Can import all `@ovds/features/*`, `@ovds/ui`, `@ovds/design-system`

## Tag System

| Tag | Purpose | Can Import |
|---|---|---|
| `scope:frontend` | Frontend code | shared, ui, lib, tokens, feature |
| `scope:backend` | Backend code | shared, lib, backend, domain, module, core |
| `type:core` | Core framework | tokens, shared |
| `type:domain` | Domain library | core, lib, shared, tokens, infrastructure |
| `type:feature` | Feature library | tokens, shared, lib, ui, feature |
| `type:module` | Module registry | core, lib, shared, tokens, domain |
| `domain:infrastructure` | Shared domain utilities | core, lib, shared, tokens |
| `type:ui` | UI components | tokens, shared, lib |
| `type:tokens` | Design tokens | *(nothing)* |

## Frontend Extraction Strategy

### Phase 1: Re-export Shims (Low Risk)
For services where `packages/features/*` already has a compatible or superset API:
1. Replace frontend inline service with re-export shim
2. Update imports in `apps/frontend/src/` to use feature package
3. Verify no type/function name mismatches

**Already completed:**
- `apps/frontend/src/services/hrApi.ts` → `@ovds/features/hr`
- `apps/frontend/src/services/ovdsApi.ts` → `@ovds/features/accounting`

**Safe to shim (feature package exports match frontend needs):**
- `reportsApi.ts` → `@ovds/features/reporting` (if components are extracted)
- `notifications.ts` → `@ovds/features/notifications`
- `settingsCatalogApi.ts` → `@ovds/features/settings`

### Phase 2: API Alignment (Medium Risk)
For services where APIs are structurally different:
1. Merge frontend API into feature package service file
2. Preserve backward-compatible exports via re-export shim
3. Update feature package `index.ts` to export merged API

**Examples:**
- `banksApi.ts` → merge with `packages/features/banking/src/services/bankingApi.ts`
- `taxApi.ts` → merge with `packages/features/tax/src/services/taxApi.ts`
- `inventoryApi.ts` → merge with `packages/features/inventory/src/services/inventoryApi.ts`

### Phase 3: React Hook Extraction (Higher Risk)
For services with React hooks mixed into API clients:
1. Split hooks into `packages/features/*/src/hooks/`
2. Keep pure API in `packages/features/*/src/services/`
3. Create re-export shims in frontend

**Examples:**
- `reportsApi.ts` has `useDeferredTax`, `useIfrs15Schedule`, etc. → move to `hooks/`
- `inventoryApi.ts` has `useItems`, `useWarehouses`, etc. → move to `hooks/`

### Phase 4: Inline Feature Extraction
For `apps/frontend/src/features/reports/`:
1. Move components to `packages/features/reporting/src/components/`
2. Move types to `packages/features/reporting/src/types/`
3. Move registry to `packages/features/reporting/src/lib/`
4. Create re-export shim at `apps/frontend/src/features/reports/`

## Current Package Layout (Actual)

The monorepo already implements DDD patterns at the package level:

```
packages/
├── domains/                    # 18 backend domain libraries
│   ├── infrastructure/         # BaseService, pagination, where builder
│   ├── accounting/             # dto/, entities/, events/, lib/
│   ├── audit-outsourcing/
│   ├── banking/                # dto/, entities/, events/, lib/, constants.ts
│   ├── crm/                    # dto/, entities/, events/, lib/, constants.ts
│   ├── double-entry/           # dto/, entities/, events/, lib/, constants.ts, tests/
│   ├── general-ledger-compliance/
│   ├── helpdesk/
│   ├── hr/                     # lib/, dto/, events/, constants.ts
│   ├── ifrs/
│   ├── inventory/
│   ├── invoice/
│   ├── reporting/
│   ├── sales/
│   ├── settings/               # Removed controllers (DDD violation fixed)
│   ├── sub-ledger/
│   ├── tax/
│   ├── vat/
│   └── ...                     # Stub packages with no src yet

├── features/                   # 53 frontend feature libraries
│   ├── accounting/             # services/ovdsApi.ts
│   ├── auth/
│   ├── banking/                # services/bankingApi.ts, hooks/, components/, pages/
│   ├── hr/                     # services/hrApi.ts, hooks/, types/
│   ├── reporting/              # services/reportingApi.ts, hooks/
│   ├── settings/               # services/settingsApi.ts, components/, hooks/, pages/
│   ├── invoice/
│   ├── sales/
│   ├── purchases/
│   ├── inventory/
│   ├── items/
│   ├── tax/
│   ├── vat/
│   ├── compliance/
│   ├── ifrs/
│   ├── crm/
│   ├── dashboard/              # Dashboard widgets
│   ├── notifications/
│   ├── iot/
│   ├── device-control/
│   ├── trade/
│   ├── projects/
│   ├── workflow/
│   ├── appstore/
│   ├── expense-claims/
│   ├── payroll/
│   ├── cost-centers/
│   ├── currency/
│   ├── custom-fields/
│   ├── customers/
│   ├── vendors/
│   ├── receipts/
│   ├── payments/
│   ├── treasury/
│   ├── disaster-fund/
│   ├── onboarding/
│   ├── release/
│   ├── security/
│   ├── security-assessment/
│   ├── security-evaluator/
│   ├── manufacturing/
│   ├── loyalty/
│   ├── fiscal/
│   └── ...                     # Other feature libraries

├── modules/                    # 3 module registries
│   ├── ovds/                   # Core OVDS ModuleApp
│   ├── hr/                     # HR ModuleApp
│   └── maintaining-technology/

├── contracts/                  # Zod schemas, oRPC router
├── database/                   # Prisma schema (325+ models)
├── shared/                     # RBAC, EIMS, tax config, types
├── core/                       # ModuleBootstrap, permissions, menu
├── ui/                         # Shared UI components
├── design-system/              # Design tokens, themes
└── dto/                        # Shared DTOs
```

## Frontend Extraction Progress

### Completed Extractions

**Types centralized in feature packages:**
- `BankTransaction` → `@ovds/features/banking`
- `ProjectionJournalRow`, `IfrsReportingBalanceRow` → `@ovds/features/reporting`
- `RolePermissionOverrideDTO`, `SettingCategory`, `SettingGroup`, `SettingDefinition` → `@ovds/features/settings`
- `TotCalculation`, `TotFiling`, `TaxAutomationStatus` → `@ovds/features/tax`
- All reporting types (27 interfaces) → `@ovds/features/reporting`

**APIs merged into feature packages:**
- `notifications.ts` → `@ovds/features/notifications` (merged `notificationsConfigApi`, `notificationTemplatesApi`, `notificationCampaignsApi`)
- `settingsCatalogApi.ts` → `@ovds/features/settings` (merged catalog CRUD APIs)
- `taxApi.ts` → `@ovds/features/tax` (merged 13 pure API functions)

**Inline features extracted:**
- `apps/frontend/src/features/reports/` → `packages/features/reporting/src/components/`, `lib/`, `services/`, `types/`

**Re-export shims created:**
- `apps/frontend/src/services/notifications.ts` → `@ovds/features/notifications`
- `apps/frontend/src/services/settingsCatalogApi.ts` → `@ovds/features/settings`
- `apps/frontend/src/services/advancedAccessApi.ts` → `@ovds/features/settings`
- `apps/frontend/src/features/reports/index.ts` → `@ovds/features/reporting`

**Frontend imports updated:**
- `ReportsDashboard.tsx` → imports from `@ovds/features/reporting`
- `DoubleEntry.tsx` → imports `KpiCell` from `@ovds/features/reporting`
- `ModularSettings.tsx` → imports `settingsCatalogApi` from `@ovds/features/settings`
- `AdvancedAccessControls.tsx` → imports from `@ovds/features/settings`
- `TaxFiling.tsx` → imports `recordTaxFiling` from `@ovds/features/tax`
- `TotFiling.tsx` → imports `calculateTot`, `triggerAutoComputeTot` from `@ovds/features/tax`
- `UniversalTaxConfig.tsx` → imports `updateCompanyTaxProfile` from `@ovds/features/tax`

### Remaining Frontend Services
Services still in `apps/frontend/src/services/` with code in frontend:

| Service | Feature Package | Status |
|---|---|---|
| `reportsApi.ts` | `@ovds/features/reporting` | Types extracted, hooks remain in frontend |
| `taxApi.ts` | `@ovds/features/tax` | Pure APIs extracted, hooks remain in frontend |
| `inventoryApi.ts` | `@ovds/features/inventory` | Types and hooks remain in frontend |
| `banksApi.ts` | `@ovds/features/banking` | Types extracted, API functions remain in frontend |
| `reconciliationApi.ts` | `@ovds/features/reporting` | Types extracted, API functions remain in frontend |

## Migration Status

### Completed
- [x] Moved settings controllers out of domain package (`packages/domains/settings/src/controllers/` removed)
- [x] Created missing `packages/domains/hr/project.json`
- [x] Updated Nx boundary constraints in `nx.json`:
  - Added `domain:infrastructure` as first-class tag
  - Blocked direct domain-to-domain imports in source
  - Domains can only depend on `core`, `lib`, `shared`, `tokens`, `infrastructure`
- [x] Created `docs/DDD-STRUCTURE.md` with bounded context definitions
- [x] Extracted shared types from frontend services to feature packages:
  - `BankTransaction` → `@ovds/features/banking`
  - `ProjectionJournalRow`, `IfrsReportingBalanceRow` → `@ovds/features/reporting`
  - `RolePermissionOverrideDTO` → `@ovds/features/settings`
  - `TotCalculation`, `TotFiling`, `TaxAutomationStatus` → `@ovds/features/tax`
  - 27+ reporting types → `@ovds/features/reporting`
- [x] Merged pure API functions into feature packages:
  - `notifications.ts` → `@ovds/features/notifications`
  - `settingsCatalogApi.ts` → `@ovds/features/settings`
  - `taxApi.ts` → `@ovds/features/tax` (13 functions)
- [x] Extracted inline reports feature to `@ovds/features/reporting`
- [x] Created re-export shims for backward compatibility
- [x] Updated frontend imports to use feature packages

### In Progress
- [ ] Extract remaining React hooks from frontend services to feature packages
- [ ] Extract inline frontend features (`apps/frontend/src/features/accounting/hooks/`)
- [ ] Add domain-specific constraints for each bounded context
- [ ] Migrate monolithic Prisma schema to per-domain schema fragments

### Planned
- [ ] Introduce Aggregate Root pattern for key entities
- [ ] Add Value Objects for Money, TaxRate, Address
- [ ] Abstract Prisma behind Repository interfaces
- [ ] Add UnitOfWork pattern for cross-aggregate transactions

## Known Limitations

### 1. React Hook Extraction Blocked by Local `api` Instance
Most remaining frontend services (`reportsApi.ts`, `taxApi.ts`, `inventoryApi.ts`, etc.) mix React hooks with API calls that depend on the local `api` instance from `apps/frontend/src/services/api.ts`. This creates a hard dependency on the app-level Axios/Fetch configuration.

**Options to unblock:**
- **Option A**: Extract hooks into feature packages and pass `api` as a parameter: `useTaxDashboard(api, companyId)`
- **Option B**: Create a shared `@ovds/features/core` package with a `createApiClient()` factory
- **Option C**: Keep hooks in frontend app; only extract pure API functions to feature packages (current approach)

**Current decision**: Option C — pure API functions are extracted, hooks remain in frontend until a shared client strategy is chosen.

### 2. Catch-All `modulesApi.ts`
`apps/frontend/src/services/modulesApi.ts` aggregates APIs for 15+ backend modules (manufacturing, procurement, projects, security, etc.) that don't have dedicated frontend services yet. This is a temporary "parking lot" that should be split into dedicated feature packages as those modules are built out.

### 3. Pre-existing Feature Package Gaps
Several feature packages have broken barrel exports referencing missing components:
- `features-accounting`: missing `JournalTable`, `AccountTreeView`
- `features-settings`: missing `SettingsPage`
- `features-invoice`: missing `InvoiceStatusBadge`, `InvoiceTable`, etc.
- `features-hr`: missing `EmployeeTable`, `PayrollSummaryCard`, etc.

These are **pre-existing** and unrelated to the DDD restructuring.

### 4. Monolithic Prisma Schema
All 130+ Prisma models live in a single `packages/database/prisma/schema.prisma`. While this is pragmatic for a MySQL monolith, it means:
- Domains cannot own their schema definitions
- Schema changes require coordination across all domains
- Migration to per-domain schemas would be a major undertaking

### 5. No Aggregate Roots or Value Objects
The current architecture uses Prisma models directly in domain services. There are no:
- Aggregate root classes with identity boundaries
- Value objects for Money, TaxRate, Address
- Repository interfaces abstracting Prisma

This is acceptable for a monolith but would need to be addressed before splitting into microservices.

## Architecture Recommendations

### Short Term (1-2 sprints)
1. **Choose a shared API client strategy** to unblock React hook extraction
2. **Extract `modulesApi.ts`** into dedicated feature packages per module
3. **Fill gaps** in `features-accounting`, `features-settings`, `features-invoice`, `features-hr`

### Medium Term (3-6 sprints)
4. **Add domain-specific Nx constraints**: e.g., `domain:banking` can only be imported by `domain:accounting` and `apps/backend`
5. **Introduce Aggregate Root pattern** for key entities: `Invoice`, `Payment`, `JournalEntry`
6. **Add Value Objects**: `Money`, `TaxRate`, `Address`, `PhoneNumber`

### Long Term (6+ sprints)
7. **Split Prisma schema** into per-domain schema fragments with a schema registry
8. **Abstract Prisma behind Repository interfaces** to enable swapping persistence
9. **Add UnitOfWork pattern** for cross-aggregate transactions
10. **Evaluate microservice readiness**: bounded contexts are now well-defined, domains are decoupled

## Quick Reference: What Changed

### Backend
| Change | File | Impact |
|---|---|---|
| Removed controllers from domain | `packages/domains/settings/src/controllers/` | DDD boundary enforced |
| Added missing Nx project | `packages/domains/hr/project.json` | Nx can now track hr domain |
| Tightened boundary rules | `nx.json` | Domains can't import each other directly |

### Frontend
| Change | Files | Impact |
|---|---|---|
| Types centralized | `banking.types.ts`, `reporting.types.ts`, `settings.types.ts`, `tax.types.ts` | Types no longer locked in services |
| APIs merged | `notificationsApi.ts`, `settingsApi.ts`, `taxApi.ts` | Pure functions in feature packages |
| Inline feature extracted | `packages/features/reporting/src/` | Reports feature now a proper library |
| Re-export shims | `banksApi.ts`, `advancedAccessApi.ts`, etc. | Backward compatibility preserved |
| Imports migrated | 7 page files | Frontend uses feature packages |

### Validation
| Package | Status |
|---|---|
| `features-banking` | ✅ typecheck passes |
| `features-reporting` | ✅ typecheck passes |
| `features-notifications` | ✅ typecheck passes |
| `features-tax` | ✅ typecheck passes |
| `features-settings` | ✅ typecheck passes (pre-existing SettingsPage error) |
| `domains-hr` | ✅ typecheck passes |
| `domains-settings` | ✅ typecheck passes |
