# OVDS Module Architecture — Ovds SaaS-Inspired Target Structure

## Current Issues
- **Duplicate/overlapping modules**: `accounting` + `double-entry` + `sub-ledger` + `general-ledger-compliance` all cover core accounting
- **Inconsistent naming**: `ovds` as a domain name, `general-ledger-compliance` vs `compliance`, `items` vs `inventory`
- **Mixed concerns**: `settings` domain contains controllers (DDD violation)
- **Scattered APIs**: 30+ frontend services in `apps/frontend/src/services/` with no clear ownership
- **Inline features**: `apps/frontend/src/features/reports/` and `accounting/` not in feature packages

## Target Architecture (Ovds SaaS-Inspired)

### Principle
Each module is a **self-contained business capability** with:
- Backend domain (`packages/domains/<module>/`)
- Frontend feature (`packages/features/<module>/`)
- Backend NestJS module (`apps/backend/src/<module>/`)
- Clear API boundaries
- No duplicate logic across modules

### Core Modules

| Module | Backend Domain | Frontend Feature | Backend App | Responsibility |
|---|---|---|---|---|
| **dashboard** | `packages/domains/dashboard/` | `packages/features/dashboard/` | `apps/backend/src/dashboard/` | Overview widgets, KPIs |
| **identity** | `packages/domains/identity/` | `packages/features/auth/` | `apps/backend/src/auth/` | Users, roles, permissions, sessions |
| **company** | `packages/domains/company/` | `packages/features/company/` | `apps/backend/src/settings/` | Company settings, modules, features |
| **chart-of-accounts** | `packages/domains/chart-of-accounts/` | `packages/features/chart-of-accounts/` | `apps/backend/src/ledger/` | Accounts, fiscal years, periods |
| **journal** | `packages/domains/journal/` | `packages/features/journal/` | `apps/backend/src/ledger/` | Journal entries, journal lines, postings |
| **invoicing** | `packages/domains/invoicing/` | `packages/features/invoicing/` | `apps/backend/src/invoicing/` | Invoices, bills, estimates, credit notes |
| **payments** | `packages/domains/payments/` | `packages/features/payments/` | `apps/backend/src/payments/` | Payments, payment batches, links to invoices/bills |
| **banking** | `packages/domains/banking/` | `packages/features/banking/` | `apps/backend/src/banking/` | Bank accounts, transactions, reconciliation, feeds |
| **tax** | `packages/domains/tax/` | `packages/features/tax/` | `apps/backend/src/tax/` | VAT, TOT, BIT, WHT, DRRF, PAYE, Pension, filings |
| **hr** | `packages/domains/hr/` | `packages/features/hr/` | `apps/backend/src/hr/` | Employees, attendance, leave, payroll |
| **inventory** | `packages/domains/inventory/` | `packages/features/inventory/` | `apps/backend/src/inventory/` | Items, warehouses, stock, transfers, adjustments |
| **crm** | `packages/domains/crm/` | `packages/features/crm/` | `apps/backend/src/crm/` | Customers, vendors, contacts, deals |
| **projects** | `packages/domains/projects/` | `packages/features/projects/` | `apps/backend/src/projects/` | Projects, tasks, timesheets |
| **reporting** | `packages/domains/reporting/` | `packages/features/reporting/` | `apps/backend/src/reporting/` | Financial statements, analytics, IFRS reports |
| **settings** | `packages/domains/settings/` | `packages/features/settings/` | `apps/backend/src/settings/` | System config, catalog, modules |
| **compliance** | `packages/domains/compliance/` | `packages/features/compliance/` | `apps/backend/src/compliance/` | IFRS, audits, security assessments |
| **platform** | `packages/domains/platform/` | `packages/features/platform/` | `apps/backend/src/platform/` | Helpdesk, notifications, IoT, workflow |

### Modules to be Consolidated

| Current Domains | Target Module | Rationale |
|---|---|---|
| `accounting` + `double-entry` + `sub-ledger` + `general-ledger-compliance` | `chart-of-accounts` + `journal` | Split into two focused modules: COA management and journal posting |
| `invoice` + `expenses` + `receipts` | `invoicing` | Unified invoicing/billing module |
| `sales` + `purchases` + `procurement` | `invoicing` + `projects` | Sales → invoicing; Purchases/procurement → invoicing (bills) |
| `banking` + `payments` + `treasury` | `banking` + `payments` | Banking = accounts/reconciliation; Payments = payment processing |
| `tax` + `vat` | `tax` | Single tax module with sub-types |
| `hr` + `payroll` | `hr` | Unified HR module |
| `inventory` + `items` | `inventory` | Unified inventory module |
| `crm` + `customers` + `vendors` | `crm` | Unified CRM module |
| `ifrs` + `compliance` + `audit-outsourcing` + `general-ledger-compliance` | `compliance` + `reporting` | Compliance = rules/audits; Reporting = IFRS reports |
| `helpdesk` + `notifications` + `iot` + `workflow` + `release` + `appstore` + `offline-sync` | `platform` | Platform services module |
| `manufacturing` + `trade` + `projects` | `projects` + `inventory` | Manufacturing → projects; Trade → projects/logistics |

### Naming Conventions

**Backend Domains**: kebab-case, singular, business-meaningful
- ✅ `chart-of-accounts`, `journal`, `invoicing`, `banking`, `payments`, `tax`, `hr`, `inventory`, `crm`, `projects`, `reporting`, `settings`, `compliance`, `platform`
- ❌ `ovds`, `double-entry`, `sub-ledger`, `general-ledger-compliance`, `invoice`, `items`, `sales`, `purchases`, `procurement`, `treasury`, `expenses`

**Frontend Features**: kebab-case, singular, matches backend domain
- ✅ Same as backend domains
- ❌ `expenses`, `payments`, `items`, `sales`, `purchases`, `trade`

**Backend App Modules**: kebab-case, matches domain name
- ✅ Same as domain names

### Internal Module Structure (Ovds SaaS-Inspired)

Each module follows this consistent structure:

```
packages/domains/<module>/
├── src/
│   ├── index.ts              # Public API barrel
│   ├── <module>.service.ts   # Main domain service
│   ├── <module>.deps.ts      # Dependency interfaces
│   ├── entities/             # Entity type definitions
│   ├── dto/                  # Data transfer objects
│   ├── events/               # Domain events
│   ├── constants.ts          # Domain constants
│   ├── errors.ts             # Domain-specific errors
│   └── types/                # Additional type definitions
├── project.json
├── tsconfig.json
└── package.json

packages/features/<module>/
├── src/
│   ├── index.ts              # Public API barrel
│   ├── services/             # API clients (fetch/axios)
│   ├── hooks/                # React hooks
│   ├── components/           # Reusable UI components
│   ├── pages/                # Page-level components
│   ├── types/                # TypeScript interfaces
│   └── utils/                # Helpers
├── project.json
├── tsconfig.json
└── package.json

apps/backend/src/<module>/
├── <module>.controller.ts    # NestJS controllers
├── <module>.module.ts        # NestJS module
├── <module>.service.ts       # Application service (wires domain)
├── dto/                      # Request/response DTOs
├── guards/                   # Auth guards
├── interceptors/             # Response interceptors
└── pipes/                    # Validation pipes
```

### Migration Strategy

**Phase 1: Rename & Consolidate (Current)**
1. Rename overlapping domains to canonical names
2. Create new canonical domain folders
3. Move/merge code from old to new
4. Create backward-compatible re-export shims
5. Update tsconfig paths
6. Update nx.json tags

**Phase 2: Update Imports**
1. Update all `@ovds/domains-*` imports
2. Update all `@ovds/features/*` imports
3. Update all backend controller imports
4. Update all frontend page imports
5. Validate with typecheck

**Phase 3: Remove Old Structure**
1. Remove empty old domain/feature folders
2. Remove stale project.json files
3. Remove stale tsconfig paths
4. Clean up nx.json tags
5. Final validation

### Backward Compatibility

During migration:
- Old import paths remain valid via re-export shims
- Old folders contain only `index.ts` re-exporting from new location
- Gradual migration: frontend pages can migrate one-by-one
- No breaking changes until Phase 3

### Validation Gates

Each phase requires:
1. `nx affected:libs` — no unexpected dependency changes
2. `nx typecheck` — all modified packages pass
3. `nx lint` — no new lint errors
4. Frontend build succeeds
5. Backend build succeeds
