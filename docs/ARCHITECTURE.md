<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](./CORE-CONFIG.md)
     📌 FILING LIFECYCLE: [docs/FILING-LIFECYCLE.md](./FILING-LIFECYCLE.md)
     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](./subscription%20and%20monitaizetion.md)
     📌 MODULES BLUEPRINT: [docs/MODULES-BLUEPRINT.md](./MODULES-BLUEPRINT.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](./UBIQUITOUS-LANGUAGE.md)
     🔄 Last synced: 2026-08-27 -->
# OVDS Monorepo Architecture — Thin Apps, Thick Libraries

## Principle

This monorepo follows the **"thin apps, thick libraries"** architecture:

- **Apps** (`apps/`) are purely configurational — they wire dependencies, define routes, and bootstrap the application. They contain no business logic.
- **Libraries** (`packages/`) contain all core components, business logic, database entities, and reusable utilities. They are self-contained, independently buildable, and importable by any app or other library.

## Core Module System

The core platform is built around the Ovds SaaS modular framework. The `@ovds/core` package provides:

- **ModuleApp** — Abstract base class that every installable module extends. Includes blueprint metadata: `installType`, `subscriptionTiers`, `complianceStandards`, `dataFlow`.
- **ModuleRegistry** — Singleton registry that manages module lifecycle (register, boot, dependency ordering, entitlement gating).
- **ModuleDiscovery** — Lightweight factory-based discovery for module instantiation.
- **ModuleBootstrap** — Orchestrates module instantiation with enable/disable filtering.

### Module Contract

Every installable module implements the `ModuleApp` interface:

```typescript
export interface ModuleAppOptions {
  name: string;
  displayName: string;
  version?: string;
  description?: string;
  author?: string;
  category?: string;
  icon?: string;
  dependsOn?: string[];
  installType?: 'core' | 'app';
  subscriptionTiers?: string[];
  complianceStandards?: string[];
  dataFlow?: {
    emitsTo?: string[];
    receivesFrom?: string[];
  };
}
```

### Blueprint Modules

The OVDS ecosystem is organized into 7 primary module categories, each with a dedicated `ModuleApp` provider in `packages/core/src/modules/`:

| # | Category | Module Provider | Install Type | Core/App |
|---|----------|-----------------|--------------|----------|
| 1 | Accounts Receivable & Payable (Sales) | `SalesModuleProvider` | Core | Core |
| 2 | Accounts Receivable & Payable (Purchases) | `PurchasesModuleProvider` | Core | Core |
| 3 | General Ledger & Core Accounting (Banking) | `BankingModuleProvider` | Core | Core |
| 4 | Inventory & Asset Management | `ItemsModuleProvider` | Core | Core |
| 5 | General Ledger & Core Accounting (Advanced) | `DoubleEntryModuleProvider` | App | App |
| 6 | Tax Engine & Calculation Core | `TaxModuleProvider` | Core | Core |
| 7 | HR & Internal Operations | `HrModuleProvider` | App | App |

Additional composed modules:
- `SettingsModuleProvider` — System settings, company config, module management
- `CrmModuleProvider` — CRM, leads, pipeline (in `packages/domains/crm`)
- `AssetsModuleProvider` — Fixed assets, depreciation (in `packages/domains/*`)

### Module Lifecycle

1. **Registration** — Modules subscribe to core events and declare their routes, menus, settings, and permissions.
2. **Dependency Resolution** — `ModuleRegistry.getDependencyOrder()` performs topological sort based on `dependsOn`.
3. **Entitlement Check** — `ModuleRegistry.isEntitled()` verifies the module's `subscriptionTiers` against the current tenant's subscription.
4. **Boot** — Modules start background jobs, warm caches, and initialize domain services.
5. **Event Dispatch** — Modules communicate via the `EventBusInterface` using pipeline events.

### Pipeline Events

The integrated accounting pipeline is driven by domain events:

```
PIPELINE_DEAL_WON → PIPELINE_INVOICE_CREATED → PIPELINE_INVOICE_PAID → PIPELINE_BANK_DEPOSITED
                                                                                    ↓
                                                                         PIPELINE_JOURNAL_POSTED
                                                                                    ↓
                                                              PIPELINE_VAT_COMPUTED ← PIPELINE_DRRF_COMPUTED
                                                                                    ↓
                                                              PIPELINE_FINANCIAL_REPORT_GENERATED
                                                                                    ↓
                                                                      PIPELINE_TAX_FILED ← PIPELINE_PERIOD_CLOSED
```

## Directory Structure

```
ovds/
├── apps/
│   ├── backend/          ← Thin NestJS app: routing, DI wiring, bootstrap only
│   ├── frontend/         ← Thin React app: route definitions, layout, providers only
│   └── portal/           ← Thin React portal app: routing and providers only
├── packages/
│   ├── core/             ← Kernel: module system, event bus, settings, menu, blueprint modules
│   │   └── src/
│   │       ├── modules/  ← Blueprint module providers (ModuleApp implementations)
│   │       │   ├── sales.provider.ts
│   │       │   ├── purchases.provider.ts
│   │       │   ├── banking.provider.ts
│   │       │   ├── items.provider.ts
│   │       │   ├── double-entry.provider.ts
│   │       │   ├── tax.provider.ts
│   │       │   └── hr.provider.ts
│   │       ├── kernel/   ← Module registry, discovery, bootstrap
│   │       ├── events/   ← Event bus interfaces
│   │       ├── settings/ ← Settings service
│   │       ├── menu/     ← Menu builder
│   │       └── constants.ts ← Blueprint module constants, pipeline events
│   ├── shared/           ← Cross-cutting domain utilities (auth, RBAC, types, etc.)
│   ├── database/         ← Prisma client, generated types, tenant scoping
│   ├── ui/               ← React UI components, hooks, contexts, enterprise patterns
│   ├── contracts/        ← API contracts (Zod schemas, oRPC routers)
│   ├── design-system/    ← Design tokens, theme, icons
│   ├── modules/          ← Composed NestJS module libraries (thick)
│   │   ├── hr/           ← HR domain: services, entities, DTOs, controllers
│   │   ├── ovds/         ← OVDS domain: automation, accounting integration
│   │   ├── projects/     ← Projects domain: services, entities, controllers
│   │   └── settings/     ← Settings domain: configuration, catalog, templates
│   ├── domains/          ← Domain-specific libraries (thick)
│   │   ├── accounting/   ← Accounting: ledger, journal, reports
│   │   ├── tax/          ← Tax: VAT, WHT, eTax, schedules
│   │   ├── inventory/    ← Inventory: items, warehouses, valuation
│   │   ├── sales/        ← Sales: invoices, orders, estimates
│   │   ├── purchases/    ← Purchases: bills, orders, receipts
│   │   ├── treasury/     ← Treasury: payments, collections, cash flow
│   │   ├── reporting/    ← Reporting: financial statements, budgets
│   │   ├── crm/          ← CRM: contacts, deals, pipeline
│   │   ├── compliance/   ← Compliance: audit, IFRS, regulatory
│   │   ├── hr/           ← HR: employees, attendance, payroll
│   │   └── ...           ← Additional domains as needed
│   └── features/         ← Frontend feature libraries (thick)
│       ├── accounting/   ← Accounting UI: pages, components, hooks
│       ├── tax/          ← Tax UI: pages, components, hooks
│       ├── inventory/    ← Inventory UI: pages, components, hooks
│       ├── sales/        ← Sales UI: pages, components, hooks
│       ├── purchases/    ← Purchases UI: pages, components, hooks
│       ├── treasury/     ← Treasury UI: pages, components, hooks
│       ├── reporting/    ← Reporting UI: pages, components, hooks
│       ├── hr/           ← HR UI: pages, components, hooks
│       ├── crm/          ← CRM UI: pages, components, hooks
│       ├── dashboard/    ← Dashboard UI: widgets, charts, layouts
│       ├── settings/     ← Settings UI: pages, components, hooks
│       └── ...           ← Additional feature libraries as needed
└── scripts/
    └── check-arch.mjs    ← Architecture boundary enforcement
```

## Library Categories

### Core Libraries (`packages/core`, `packages/shared`, `packages/database`)

These are the foundation. Every app and domain library depends on them.

| Package | Responsibility |
|---------|---------------|
| `@ovds/core` | Event bus, module registry, blueprint modules, settings, menu |
| `@ovds/shared` | Cross-cutting utilities: auth, RBAC, types, constants, formatting |
| `@ovds/database` | Prisma client, generated types, tenant scoping helpers |
| `@ovds/dto` | Shared DTO classes used across backend and frontend |
| `@ovds/contracts` | API contracts: Zod schemas, oRPC router definitions |
| `@ovds/design-system` | Design tokens, theme configuration |
| `@ovds/ui` | React UI components, hooks, contexts |

### Domain Libraries (`packages/modules/*`, `packages/domains/*`)

Each domain library is a **thick** library containing:
- Services (business logic)
- Entities / models
- DTOs (input/output types)
- Controllers (NestJS) or components (React)
- Guards / interceptors / middleware specific to the domain
- Database migrations / Prisma schema extensions
- Tests

Domain libraries may depend on `@ovds/core`, `@ovds/shared`, `@ovds/database`, and `@ovds/contracts`.

### App Libraries (`apps/*`)

Apps are **thin**:
- `apps/backend` — NestJS bootstrap, route wiring, global guards/interceptors/filters, middleware pipeline
- `apps/frontend` — React bootstrap, route definitions, layout shell, providers, error boundaries
- `apps/portal` — Client portal bootstrap, route wiring

Apps depend on domain libraries and core libraries but contain no business logic.

## Dependency Rules

### Enforced by `nx.json` `@nx/enforce-module-boundaries`

| Source Tag | Can Depend On |
|-----------|--------------|
| `scope:frontend` | `scope:shared`, `type:ui`, `type:lib`, `type:tokens` |
| `scope:backend` | `scope:shared`, `type:lib`, `scope:backend` |
| `scope:shared` | `scope:shared`, `type:tokens` |
| `type:app` | `type:lib`, `scope:shared`, `type:tokens` |
| `type:ui` | `type:tokens`, `scope:shared`, `type:lib` |
| `type:module` | `type:core`, `type:lib`, `scope:shared`, `type:tokens` |
| `type:tokens` | *(nothing)* |

### Additional Rules (enforced by `scripts/check-arch.mjs`)

1. `apps/frontend` must not import `@ovds/design-system` directly — use `@ovds/ui`
2. `apps/backend` must not import `@ovds/ui` — UI is frontend-only
3. `apps/frontend` must not import `@ovds/database` — database is backend-only
4. `packages/shared` and `packages/ui` must not import `@ovds/database`
5. DTO classes must be imported from `@ovds/dto`, not `@ovds/shared`
6. UI components must not import `@ovds/design-system` directly

## Tagging Convention

Every Nx project must have tags that define its role and domain:

- `scope:frontend` — Frontend application or library
- `scope:backend` — Backend application or library
- `scope:shared` — Shared library used by both frontend and backend
- `type:app` — Application (thin)
- `type:lib` — Library (thick, contains business logic)
- `type:ui` — UI component library
- `type:tokens` — Design tokens / theme library
- `type:core` — Core kernel library
- `type:module` — Domain module library
- `type:domain` — Domain-specific library
- `type:feature` — Frontend feature library

## Migration Path

To move business logic from an app into a library:

1. Create the domain library under `packages/domains/<domain>/` or `packages/modules/<domain>/`
2. Add `project.json` with proper build/test targets and tags
3. Add tsconfig path alias in `tsconfig.base.json`
4. Add the library to `tsconfig.json` references
5. Move business logic files from the app to the library
6. Update imports in the app to use the new library
7. Update `nx.json` dependency constraints if needed
8. Run `npx nx run-many --target=build --all` to verify
9. Run `node scripts/check-arch.mjs` to verify boundaries

## Module Pattern

Each domain library follows this structure:

```
packages/domains/<domain>/
├── project.json
├── package.json
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── src/
│   ├── index.ts              ← Public API
│   ├── lib/
│   │   ├── <domain>-service.ts    ← Business logic service
│   │   ├── <domain>-controller.ts ← NestJS controller (backend only)
│   │   ├── <domain>-types.ts      ← TypeScript types
│   │   └── <domain>-dto.ts        ← DTO classes
│   ├── entities/           ← Database entities / Prisma models
│   ├── dto/                ← Input/output DTOs
│   ├── guards/             ← Domain-specific guards (backend)
│   ├── interceptors/       ← Domain-specific interceptors (backend)
│   ├── middleware/         ← Domain-specific middleware (backend)
│   ├── events/             ← Domain events
│   ├── constants.ts        ← Domain constants
│   └── index.ts            ← Re-exports
├── tests/
│   └── <domain>-service.spec.ts
└── prisma/                 ← Domain-specific Prisma migrations (if applicable)
```

## Frontend Feature Library Pattern

Each frontend feature library follows this structure:

```
packages/features/<domain>/
├── project.json
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              ← Public API
│   ├── components/           ← React components
│   ├── hooks/                ← Custom React hooks
│   ├── pages/                ← Page components
│   ├── services/             ← API client services
│   ├── types/                ← TypeScript types
│   ├── utils/                ← Utility functions
│   └── index.ts              ← Re-exports
```

## Module Installation & Entitlement

All modules (denoted with *(App)*) are installed via the **OVDS App Store** and gated by subscription entitlements:

1. **Browse** — Navigate to **Administration → App Store** (`/app-store`) or press `G → A`.
2. **Install** — Click **Install** on any module. Free modules install immediately; paid modules redirect to the subscription checkout.
3. **Configure** — After installation, a setup wizard guides configuration (tax rates, chart of accounts, bank accounts, team roles).
4. **Enable per company** — Modules are toggled on/off per company via **Module CRUD** in the subscription management panel.
5. **Entitlement enforcement** — The `EntitlementGuard` on the backend and `ModuleRegistry.isEntitled()` ensure that uninstalled or expired modules are inaccessible server-side — the UI never trusts client state.

> **Core modules** (Invoices, Customers, Vendors, Bills, Items, Banking) are included in all plans. **Apps** (Double-Entry, CRM, Payroll, Inventory, White-Label, etc.) require Professional tier or higher. See [subscription and monetization](subscription%20and%20monitaizetion.md) for plan details.
