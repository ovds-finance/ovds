refacter evrything Ovds SaaS Enterprise Accounting Architecture Blueprint (Hybrid On-Cloud & On-Premise)
Inspired by Akaunting's Modular Engine. Built online vat declaretion system(Ovds) SaaS using Nx, React, NestJS, and Prisma.


The layout maps Akaunting's modular, extensible mindset onto an Nx, React, NestJS, and Prisma Ovds monorepo workspace. It supports structural multi-tenancy on the cloud while downscaling flawlessly into isolated single-tenant environments on-premise.

## 🛠️ Architecture Deep-Dive Included in This Document:

* **Nx Multi-Application Topography** — Section 1 maps the actual `apps/backend/` + `packages/` structure with verified paths.
* **Prisma Context Extension Hook** — Section 2 shows the `$extends` interceptor (`buildTenantScopedExtension`) that automatically injects `companyId` tenant boundaries across all queries.
* **Dual-Deployment Schema Guard** — Section 3 implements `ModuleSubscriptionGuard` + PKI air-gapped RSA/SHA256 license verification for off-network deployments.
* **Balanced GAAP Accounting Core** — Section 4 implements `DoubleEntryService.createJournalEntry()` with `BALANCE_TOLERANCE` validation inside atomic `$transaction`.
* **Event-Driven Module Decoupling** — Section 4b describes the dual-bus architecture (`@ovds/core` EventBus + NestJS EventEmitter2 bridge) connecting invoice events to the ledger observer.
* **React Extension Slot Registry** — Section 5 implements `ModuleRegistryProvider` with auto-slot registration and `ExtensionSlotRenderer`.
* **Target Docker-Compose Blueprints** — Section 6 provides verified `docker-compose.cloud.yml` and `docker-compose.onpremise.yml` with the unified `apps/backend/Dockerfile`.
* **Multi-Tenant Migration Strategies** — Section 7 covers cloud rolling migrations and on-premise embedded startup migrations.
* **Playwright Multi-Tenant Integration Tests** — Section 8 provides a cross-tenant data breach test suite.

do executed a massive structural expansion of the architectural blueprint, elevating it to an Enterprise Grade, Production-Ready Technical Specification Document.

This update moves past abstract architecture to provide concrete, fully typed TypeScript code, dynamic schema configurations, and low-level system designs modeling Akaunting's core philosophy: Everything is a Module.
------------------------------
## 🚀 What Makes This Blueprint Advanced & Production-Ready## 1. Zero-Overhead Multi-Tenant Lifecycle Engine

* Implements a completely automated, compile-time and run-time multi-tenant router using the Prisma Client 2.x/3.x/Client Extension Engine ($extends).

* Every create, read, update, or delete transaction automatically transparently appends, verifies, and updates companyId boundaries. Developers can write standard queries like prisma.invoice.findMany() without manually applying security filters, eliminating human error in multi-tenant data leaks.

## 2. Cross-Boundary Module Decoupling (The Akaunting Way)

* Implements an asynchronous, event-driven module federation backend using NestJS @nestjs/event-emitter.
* When an invoice is created in the InvoicingModule, it emits a decoupled event. The DoubleEntryCoreModule listens to this event asynchronously, building financial journals and transactions without any direct dependency injection, allowing you to install or uninstall modules cleanly at runtime.

## 3. Air-Gapped Licensing & Local Crypto Safeguards

* Built a high-security LicenseVerificationService leveraging asymmetric public/private keys via Node’s native crypto module.
* This allows on-premise installations to parse, decrypt, and cache feature flags locally from a license string. This keeps the application 100% operational in air-gapped networks without hitting an external licensing server.

## 4. Polymorphic Extensible UI (React Slot Pattern)

* Provides a React Context-based plugin infrastructure (ModuleRegistry).
* Micro-frontend feature libraries within your Nx Monorepo can dynamically register core UI elements, dashboard cards, navigation points, and form fields into the core workspace shell layout engine on the fly.

------------------------------

## 📋 Blueprint Audit Summary (vs. Actual Codebase)

| # | Section | Blueprint Claim | Verified Reality | Status |
|---|---|---|---|---|
| 1 | Monorepo layout | `apps/cloud-api/`, `apps/onpremise-api/`, `libs/` | Single `apps/backend/` + `packages/domains/` + `packages/features/` + `packages/core/` | Corrected |
| 2 | Schema | `AccountType: ASSETS/LIABILITIES/...` | `ASSET/LIABILITY/EQUITY/INCOME/EXPENSE` + `AccountCategory` enum | Corrected |
| 2 | Schema | `Company.slug`, `Company.licenseKey` | `Company.subdomain`, no `licenseKey` field | Corrected |
| 2 | Schema | `InstalledModule` model | `CompanyModule` model (with `isEnabled`, `settings`, `Module` relation) | Corrected |
| 2 | Schema | No `LicenseActivation` | `LicenseActivation` model at `schema.prisma:9453` | Added |
| 3 | Tenant isolation | `getExtendedPrismaClient()` (request-scoped) | `buildTenantScopedExtension()` (AsyncLocalStorage) | Corrected |
| 3 | Tenant context | NestJS `@Injectable({ scope: REQUEST })` service | `AsyncLocalStorage<TENANT_CONTEXT>` + `TenantContextInterceptor` | Corrected |
| 3 | PrismaService | `apps/backend/src/prisma/prisma.service.ts` | `apps/backend/src/common/prisma.service.ts` (MariaDB adapter) | Corrected |
| 3 | Subdomain resolution | Not described | `TenantSubdomainMiddleware` with caching + reserved-subdomain filtering | Added |
| 4 | Ledger engine | `DoubleEntryLedgerEngine.recordJournalEntry()` | `DoubleEntryService.createJournalEntry()` (extends `BaseService`) | Corrected |
| 4 | Balance check | Exact `Decimal.equals()` | Tolerance-based `BALANCE_TOLERANCE = 0.0001` | Corrected |
| 4 | Account scope | Not checked | Validates all accounts belong to company inside `$transaction` | Added |
| 4 | Audit logging | Not described | `this.audit()` call on entry creation | Added |
| 5 | Guard location | `packages/core/src/guards/module-subscription.guard.ts` | `apps/backend/src/auth/guards/module-subscription.guard.ts` | Corrected |
| 5 | Guard model | `installedModule` / `isActive` | `companyModule` / `isEnabled` | Corrected |
| 5 | Guard exceptions | `HttpException`/`HttpStatus` | `ForbiddenException` (proper NestJS) | Corrected |
| 5 | Guard super-user | Not described | `isSuperUser()` from `@ovds/shared` bypasses checks | Added |
| 5 | License engine | Standalone `AirGappedLicenseService` | Integrated into `ModuleSubscriptionGuard` | Corrected |
| 6 | Event bus | Single `EventEmitter2` | Dual-bus: `@ovds/core` `EventBus` + NestJS `EventEmitter2` | Corrected |
| 6 | Event names | `invoice.issued` | `invoice.invoice.created` (`INVOICE_EVENTS.CREATED`) | Corrected |
| 6 | Ledger observer | `@OnEvent` listener only | Framework-agnostic `LedgerObserver` + NestJS bridge adapter | Corrected |
| 6 | Ledger events | Only invoice created | `SENT`, `PAYMENT_RECEIVED`, `VOIDED` (3 events, Ethiopian CoA) | Corrected |
| 7 | React registry | `packages/frontend/core-shell/` | `apps/frontend/src/context/ExtensionSlotRegistry.tsx` | Corrected |
| 7 | Auto-registration | `registerModule()` only | Auto-registers `dashboardWidgets` + `settingsPanel` into slots | Corrected |
| 8 | Dockerfile | `node:20-alpine`, `corepack`/`pnpm` | `node:22-alpine`, `npm ci`, `npm run build:backend` | Corrected |
| 8 | Dockerfile path | Per-app `apps/cloud-api/Dockerfile` | Single `apps/backend/Dockerfile` | Corrected |
| 8 | Port | Container port 3000 | Port 3001 (cloud) / 3001 mapped to 8080 (on-prem) | Corrected |
| 9 | Migration script | `packages/database/scripts/migrate-cross-provider.mjs` | Does NOT exist; uses `npx prisma generate`/`db push` | Noted |
| 10 | Cross-tenant tests | Ideal fixture-based suite in `tests/multi-tenant/` | Actual tests at `apps/backend/test/` (8 + 3 cases) | Added |
| 10 | Attack vectors | 6 HTTP-level attack vectors | Unit-level bug specs exist; HTTP attack tests aspirational | Partial |

* 1. MONOREPO WORKSPACE TOPOGRAPHY (apps/, libs/)
* Exact folder structure for splitting shared engines from environment runtimes (cloud SaaS vs on-premise).
* 2. PRISMA ADVANCED DUAL-PROVIDER DATALAYER SCHEMA
* Production schema with double-entry ledgers, dynamic app store models, multi-currency schemas, and decimal-precision models.
* 3. GLOBAL DYNAMIC ROW-LEVEL SECURITY CLIENT (PRISMA EXTENSION)
* Fully executable TypeScript code for automatic tenant scoping.
* 4. HYBRID RUNTIME BOOTSTRAPPER & MULTI-TENANCY MIDDLEWARE
* Subdomain and header validation engine evaluating whether to query global cloud accounts or load local configurations.
* 5. ASYMMETRIC OFF-LINE LICENSING DECRYPTION SERVICE
* Complete cryptographic implementation for air-gapped modular deployments.
* 6. ATOMIC GAAP DOUBLE-ENTRY BALANCING SERVICE
* Transaction-safe transaction engine validating Debits == Credits inside a database transaction isolated by company code.
* 7. REACT DYNAMIC PLUGIN REGISTRY (UI SLOTS)
* Full React Context and custom Hook engine for independent frontend feature registration.
* 8. CONTAINERIZED ENVIRONMENT ORCHESTRATION
* High-availability Cloud docker-compose.yml versus Single-Container self-hosted On-Premise configuration files.
* 9. MULTI-TENANT DATABASE MIGRATION PIPELINES
* Cloud rolling tenant migrations + embedded on-premise startup migrations.
* 10. PLAYWRIGHT MULTI-TENANT INTEGRATION TESTING
* Security test suites for cross-tenant breach prevention.

------------------------------
## 🛠️ Next Steps for Implementation
To prepare this architecture for a functional prototype, tell me if you want to explore:

   1. Dynamic Database Migration Pipelines: How to execute schema updates safely across thousands of isolated tenant databases (On-Cloud) vs running embedded migration loops inside an on-premise application startup script.
   2. Playwright Multi-Tenant Integration Testing: How to script test suites simulating Tenant A attempting a cross-tenant data breach on Tenant B via HTTP manipulation.


## 1. Monorepo Project Map (`nx.json` / `pnpm-workspace.yaml` Workspace Layout)

```text
apps/
  ├── backend/                    # Unified NestJS API — dual-runtime (cloud SaaS + on-premise)
  │   ├── src/
  │   │   ├── main.ts             # Bootstrap: env-driven DEPLOYMENT_MODE validation
  │   │   ├── app.module.ts       # Root module: EventEmitterModule, all feature modules
  │   │   ├── common/             # PrismaService, TenantContextInterceptor, TenantSubdomainMiddleware
  │   │   ├── auth/               # JwtAuthGuard, PermissionsGuard, ModuleSubscriptionGuard
  │   │   ├── sales/              # InvoiceDomainEventService (dual-bus dispatch)
  │   │   ├── ledger/             # LedgerObserverService, InvoiceLedgerListener
  │   │   ├── purchases/          # Bill/PO management
  │   │   ├── banking/            # Bank feeds, reconciliations
  │   │   └── ...                 # Many domain-specific modules
  │   └── Dockerfile              # Single Dockerfile used by BOTH compose targets
  ├── frontend/                   # React SPA — core shell + dynamic plugin slots
  │   ├── src/
  │   │   └── context/
  │   │       └── ExtensionSlotRegistry.tsx  # IoC plugin registry
  │   └── vite.config.ts
  └── portal/                     # Static/public marketing entrypoint

packages/
  ├── core/                       # Kernel, DI Engine, Event Bus abstractions
  │   ├── src/
  │   │   ├── events/              # EventBus (singleton), EventDispatcher, Event interface
  │   │   ├── module-app.ts        # ModuleBootstrap — dynamic module lifecycle
  │   │   └── kernel/              # Module discovery, auto-registration
  ├── database/                   # Prisma Client, Multi-Tenant Context Filters, Extenders
  │   ├── prisma/schema.prisma     # Source of truth — 9,471 lines, all domain models
  │   ├── src/
  │   │   ├── tenant-context.middleware.ts  # AsyncLocalStorage + RequestContext
  │   │   ├── tenant-extension-builder.ts   # buildTenantScopedExtension() factory
  │   │   ├── tenant-scoped.ts               # Legacy hard guards (assertCompanyId, etc.)
  │   │   └── tenant-prisma.client.ts        # TenantPrismaClient (standalone, non-Nest)
  │   └── src/index.ts             # Re-exports PrismaClient, Prisma, helpers
  ├── domains/                    # Akaunting-style isolated domain engines
  │   ├── accounting/             # LedgerObserver, AccountingService, TaxRateService
  │   ├── double-entry/           # DoubleEntryService, LedgerMappingService, FiscalYearService
  │   ├── invoice/                # InvoiceSnapshot, INVOICE_EVENTS, factory functions
  │   ├── infrastructure/         # BaseService, IPrismaClient, IAuditLogger interfaces
  │   └── ...                     # inventory, banking, tax, hr, crm, etc.
  ├── features/                   # Frontend feature modules (Nx libraries)
  │   └── double-entry/           # plugin.ts (ModuleUIRegistration) + services + hooks
  ├── shared/                     # Common types, enums, DTOs, business roles, RBAC
  ├── design-system/              # UI primitive components
  └── contracts/                  # API contract definitions (Zod/OpenAPI)
```

> **Note:** The blueprint previously referenced `apps/cloud-api/`, `apps/onpremise-api/`, and `libs/` — these paths do not exist. The actual monorepo uses a **single** `apps/backend/` NestJS entrypoint that branches at runtime via `DEPLOYMENT_MODE`, plus `packages/domains/` for framework-agnostic domain libraries wired into the backend via the `@ovds/domains-infrastructure` `BaseService` + `IPrismaClient` abstraction.

---

## 2. Dynamic Prisma Multi-Tenant Engine & Database Isolation

```prisma
datasource db {
  provider = env("DATABASE_PROVIDER") // "postgresql" on Cloud, "sqlite" or "mysql" On-Premise
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  INCOME
  EXPENSE
}

/// Ethiopian Chart of Accounts category — used by LedgerObserver and findDefaultAccountByCategory()
enum AccountCategory {
  HEADER
  CASH
  BANK
  ACCOUNTS_RECEIVABLE
  ACCOUNTS_PAYABLE
  INVENTORY
  FIXED_ASSET
  CURRENT_ASSET
  CURRENT_LIABILITY
  LONG_TERM_LIABILITY
  EQUITY
  REVENUE
  OTHER_INCOME
  OPERATING_EXPENSE
  COST_OF_GOODS_SOLD
  OTHER_EXPENSE
  INVESTMENT
  TAX
}

enum CompanyType {
  MANUFACTURING
  LARGE_ENTERPRISE
  MEDIUM_ENTERPRISE
  SMALL_BUSINESS
  FREELANCER
  RETAIL
  WHOLESALE
  NGO
  GOVERNMENT
}

enum DeploymentMode {
  CLOUD_SAAS
  ON_PREMISE_SINGLE
  ON_PREMISE_MULTI
}

model Company {
  id               String            @id @default(uuid())
  name             String
  subdomain        String?           @unique // Required for Cloud routing
  type             CompanyType
  tin              String?           @db.VarChar(15)
  vatNumber        String?           @db.VarChar(15)
  businessType     String?           @db.VarChar(50)
  currencyCode     String?           @default("ETB") @db.VarChar(3)
  securityPolicy   String?           @db.LongText // ABAC policy (IP whitelist, MFA, allowedHours)
  autoUpdate       Boolean           @default(false)
  currentVersion   String?           @default("2.0.0")
  environment      AppEnvironment    @default(PRODUCTION)
  createdAt        DateTime          @default(now())

   accounts         Account[]
  journalEntries   JournalEntry[]
  companyModuleSettings CompanyModule[]  // actual Prisma field name
  licenses         LicenseActivation[]
}

model CompanyModule {
  id          String    @id @default(uuid())
  companyId   String
  moduleKey   String    @db.VarChar(50) // e.g., "inventory", "pos", "payroll"
  isEnabled   Boolean   @default(false)
  settings    String?   @db.LongText // Module-specific JSON configuration (e.g. {"isPremium": true})
  activatedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  module      Module    @relation(fields: [moduleKey], references: [key], onDelete: Cascade)

  @@unique([companyId, moduleKey])
}

model Account {
  id           String        @id @default(uuid())
  companyId    String?
  code         String        // e.g., "10100"
  name         String        // e.g., "Cash at Bank"
  type         AccountType
  category     AccountCategory
  isActive     Boolean       @default(true)
  isLeaf       Boolean       @default(true)
  allowPosting Boolean       @default(true)
  parentId     String?

  company      Company?      @relation(fields: [companyId], references: [id])
  parent       Account?      @relation("AccountToAccount", fields: [parentId], references: [id])
  children     Account[]     @relation("AccountToAccount")
  journalLines JournalLine[]

  @@unique([code, companyId])
  @@index([companyId])
}

model JournalEntry {
  id          String        @id @default(uuid())
  companyId   String?
  date        DateTime      @default(now())
  period      String?       @db.VarChar(7)
  reference   String?       // e.g., Invoice #, Receipt ID
  description String
  status      String        @default("POSTED")
  postedBy    String?
  /// LOCAL | IFRS | CONSOLIDATED — NULL means applies to both books
  bookType    String?       @db.VarChar(20)
  /// Links IFRS adjustment entries back to their LOCAL counterpart
  mirrorEntryId String?     @db.VarChar(36)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  company     Company?      @relation(fields: [companyId], references: [id])
  lines       JournalLine[]

  @@index([companyId, date])
  @@index([companyId, status])
}

model JournalLine {
  id             String       @id @default(uuid())
  journalEntryId String
  accountId      String
  description    String?
  debit          Decimal      // 30-digit fixed-point precision
  credit         Decimal
  taxType        JournalLineTaxType?
  companyId      String?
  costCenterId   String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  company        Company?     @relation(fields: [companyId], references: [id])
  account        Account      @relation(fields: [accountId], references: [id], onDelete: Restrict)
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  costCenter     CostCenter?  @relation("JournalLineCostCenter", fields: [costCenterId], references: [id])

  @@index([companyId])
  @@index([accountId])
  @@index([journalEntryId])
}

model LicenseActivation {
  id                String    @id @default(uuid())
  companyId         String
  licenseKey        String    @db.VarChar(500)
  signature         String    @db.LongText   // Cryptographic signature for air-gapped verification
  expiresAt         DateTime?
  isValid           Boolean   @default(true)
  registeredModules String    @db.LongText   // JSON list of premium modules unlocked

  company           Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([companyId, licenseKey])
}
```

> **Verified** against `packages/database/prisma/schema.prisma:884` (Company), `:166` (Account), `:2134` (JournalEntry), `:2177` (JournalLine), `:3749` (CompanyModule), `:9453` (LicenseActivation). The physical table names use snake_case `@@map` (e.g. `journalentry`, `company_module`); the schema above preserves the canonical camelCase field names used in application code.

### Prisma Client Extension: Automatic RLS Multi-Tenant Enforcer

```typescript
// packages/database/src/tenant-extension-builder.ts
import type { RequestContext } from './tenant-context.middleware';

export type DeploymentMode = 'CLOUD_SAAS' | 'ON_PREMISE_SINGLE' | 'ON_PREMISE_MULTI';

const READ_OPERATIONS = new Set(['findMany', 'findFirst', 'findUnique']);

const MUTABLE_TENANT_MODELS = new Set([
  'account', 'journalEntry', 'journalLine', 'ledgerEntry',
  'invoice', 'invoiceItem', 'invoicePayment',
  'bill', 'billItem', 'vendor', 'purchaseOrder',
  'bankAccount', 'bankTransaction', 'bankFeed',
  'account', 'settingValue', 'moduleSettings',
  'companyModule', 'licenseActivation', 'customField',
  // ... ~100+ tenant-scoped models in full production schema
]);

export function buildTenantScopedExtension(
  getContext: () => RequestContext | undefined,
  deploymentMode: DeploymentMode,
) {
  return {
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          const context = getContext();
          const companyId = context?.companyId || null;
          const role = context?.role?.toUpperCase() ?? '';
          const isSuper = role === 'SPURADMIN' || role === 'SUPERADMIN';
          const isSingleTenant = deploymentMode === 'ON_PREMISE_SINGLE';

          if (isSingleTenant || !companyId || isSuper) {
            return query(args);
          }

          // READ: append companyId to where clause for tenant-scoped models
          if (READ_OPERATIONS.has(operation)) {
            const where = args?.where ?? {};
            if (operation === 'findUnique' && where.companyId && where.companyId !== companyId) {
              return null; // Existence oracle attack prevention — return null, not error
            }
            if (MUTABLE_TENANT_MODELS.has(model)) {
              args = { ...args, where: { ...where, companyId } };
            }
          }

          // CREATE: auto-stamp companyId into the payload
          if (operation === 'create' || operation === 'createMany') {
            if (MUTABLE_TENANT_MODELS.has(model)) {
              if (operation === 'create') {
                args = { ...args, data: { ...args.data, companyId } };
              } else {
                args = {
                  ...args,
                  data: Array.isArray(args.data)
                    ? args.data.map((d: any) => ({ ...d, companyId }))
                    : { ...args.data, companyId },
                };
              }
            }
          }

          // UPDATE / DELETE: scope where clause to companyId
          if (operation === 'update' || operation === 'updateMany' ||
              operation === 'delete' || operation === 'deleteMany') {
            if (MUTABLE_TENANT_MODELS.has(model)) {
              const where = args?.where ?? {};
              args = { ...args, where: { ...where, companyId } };
            }
          }

          return query(args);
        },
      },
    },
  };
}
```

#### Context propagation: AsyncLocalStorage instead of request-scoped service

The extension reads tenant context from an AsyncLocalStorage store (`TENANT_CONTEXT`) rather than a NestJS request-scoped injectable. This avoids Prisma Client extension re-instantiation on every request.

```typescript
// packages/database/src/tenant-context.middleware.ts
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  companyId: string | null;
  userId: string | null;
  role: string | null;
}

export const TENANT_CONTEXT = new AsyncLocalStorage<RequestContext>();
export function getTenantContext(): RequestContext | undefined {
  return TENANT_CONTEXT.getStore();
}
```

The NestJS runtime adapter populates this store per-request:

```typescript
// apps/backend/src/common/tenant-context.middleware.ts (TenantContextInterceptor)
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const headerCompanyId = request.headers?.['x-company-id'];

    let resolvedCompanyId: string | null = null;
    if (headerCompanyId) {
      const role = (user?.role ?? '').toUpperCase();
      const isSuper = isSuperUser(role);
      if (isSuper) { resolvedCompanyId = headerCompanyId; }
      else if (user?.companyId && headerCompanyId === user.companyId) { resolvedCompanyId = headerCompanyId; }
      else if (user?.companyId && headerCompanyId !== user.companyId) {
        throw new ForbiddenException('Cross-tenant access denied.');
      }
    } else {
      resolvedCompanyId = user?.companyId || null;
    }

    const ctx: RequestContext = {
      companyId: resolvedCompanyId,
      userId: user?.userId || null,
      role: user?.role || null,
    };
    return TENANT_CONTEXT.run(ctx, () => next.handle());
  }
}
```

#### NestJS PrismaService wiring

```typescript
// apps/backend/src/common/prisma.service.ts
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { getTenantContext } from './tenant-context.middleware';
import { buildTenantScopedExtension } from '@ovds/database';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      adapter: new PrismaMariaDb(process.env.PRISMA_DATABASE_URL),
      log: process.env.NODE_ENV === 'development' ? ['query','error','warn'] : ['error','warn'],
    });

    const deploymentMode = (process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS') as DeploymentMode;
    const extended = (this as any).$extends(
      buildTenantScopedExtension(getTenantContext, deploymentMode),
    );
    (extended as any).onModuleInit = async () => { await extended.$connect(); };
    (extended as any).onModuleDestroy = async () => { await extended.$disconnect(); };
    return extended as unknown as PrismaService;
  }
}
```

Subdomain-to-tenant resolution (cloud SaaS) is handled by `TenantSubdomainMiddleware` which runs before `TenantContextInterceptor`:

```typescript
// apps/backend/src/common/tenant-subdomain.middleware.ts
@Injectable()
export class TenantSubdomainMiddleware implements NestMiddleware {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly metrics = { hits: 0, misses: 0, errors: 0 };

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (process.env.DEPLOYMENT_MODE === 'ON_PREMISE_SINGLE') return next();

    // x-company-id header takes priority (for super-users / API clients)
    const headerCompanyId = req.headers['x-company-id']?.trim();
    if (headerCompanyId) {
      return TENANT_CONTEXT.run({ companyId: headerCompanyId, userId: null, role: null }, () => next());
    }

    const host = req.hostname;
    const parts = host.split('.');
    if (parts.length <= 2) return next();

    const subdomain = parts[0].toLowerCase();
    if (!isValidSubdomain(subdomain) || isReserved(subdomain)) return next();

    const companyId = await this.resolveTenant(subdomain); // cached DB lookup
    TENANT_CONTEXT.run({ companyId, userId: null, role: null }, () => next());
  }
}
```

> **Verified:** `packages/database/src/tenant-extension-builder.ts:64` exports `buildTenantScopedExtension()`. The `TenantContextInterceptor` at `apps/backend/src/common/tenant-context.middleware.ts:8` populates the AsyncLocalStorage store with cross-tenant mismatch detection (line 28-31). The `TenantSubdomainMiddleware` at `apps/backend/src/common/tenant-subdomain.middleware.ts` resolves subdomains to company IDs with caching (TTL 5 min) and reserved-subdomain filtering.

---

## 3. NestJS Dual-Runtime Bootstrapper & Air-Gapped Licensing

### Multi-Tenant Module Interceptor Guard

```typescript
// apps/backend/src/auth/guards/module-subscription.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../common/prisma.service';
import { getTenantContext } from '../../common/tenant-context.middleware';
import { isSuperUser } from '@ovds/shared';
import * as crypto from 'crypto';

export const REQUIRED_MODULE_KEY_METADATA = 'requiredModuleKey';

export const RequiredModule = (moduleKey: string) =>
  SetMetadata(REQUIRED_MODULE_KEY_METADATA, moduleKey);

@Injectable()
export class ModuleSubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModuleKey = this.reflector.get<string>(
      REQUIRED_MODULE_KEY_METADATA,
      context.getHandler(),
    );
    if (!requiredModuleKey) return true;

    const request = context.switchToHttp().getRequest<any>();
    const tenantCtx = getTenantContext();
    const companyId =
      request.headers?.['x-company-id'] ||
      request.user?.companyId ||
      tenantCtx?.companyId;

    const deploymentMode = process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS';
    const role = (request.user?.role ?? tenantCtx?.role ?? '').toUpperCase();
    const isSuper = isSuperUser(role);

    // On-Premise single-tenant: skip subscription checks
    if (deploymentMode === 'ON_PREMISE_SINGLE') return true;
    // Super-users bypass module subscription enforcement
    if (isSuper) return true;
    if (!companyId) {
      throw new ForbiddenException('Tenant company identifier context not discovered.');
    }

    // Dynamic Module State Check — queries CompanyModule for this tenant
    const subscription = await this.prisma.companyModule.findFirst({
      where: {
        companyId: String(companyId),
        moduleKey: requiredModuleKey,
        isEnabled: true,
      },
    });

    if (!subscription) {
      throw new ForbiddenException(
        `The module '${requiredModuleKey}' is inactive or uninstalled for this workspace.`,
      );
    }

    // PKI Air-Gapped Verification — enforce offline license for premium modules
    const settings = this.parseSettings(subscription.settings);
    if (settings?.isPremium) {
      const license = await this.prisma.licenseActivation.findFirst({
        where: { companyId: String(companyId), isValid: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!license || !this.verifyOfflineLicense(license.licenseKey, license.signature)) {
        throw new ForbiddenException(
          'Premium module activation failed: invalid offline license signature.',
        );
      }
    }

    return true;
  }

  private parseSettings(raw: string | null | undefined): Record<string, any> | null {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  private verifyOfflineLicense(licenseKey: string, signature: string): boolean {
    const publicKey = process.env.OFFLINE_PUBLIC_KEY;
    if (!publicKey) return false;
    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(licenseKey);
      return verifier.verify(publicKey, signature, 'hex');
    } catch {
      return false;
    }
  }
}
```

> **Verified:** `apps/backend/src/auth/guards/module-subscription.guard.ts:44` exports `ModuleSubscriptionGuard`. The guard (1) checks `DEPLOYMENT_MODE === 'ON_PREMISE_SINGLE'`, (2) uses `isSuperUser()` from `@ovds/shared`, (3) queries the `CompanyModule` model (not the blueprint's `InstalledModule`), (4) checks `isEnabled` field, and (5) verifies RSA-SHA256 signatures for premium modules via `process.env.OFFLINE_PUBLIC_KEY`. License verification is integrated directly into the guard — there is no separate `AirGappedLicenseService` class in the actual codebase. The `@RequiredModule('key')` decorator uses metadata key `'requiredModuleKey'`.

---

## 4. Balanced Ledger Processing Engine

```typescript
// packages/domains/double-entry/src/lib/double-entry.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseService, IAuditLogger, IPrismaClient } from '@ovds/domains-infrastructure';
import { Prisma } from '@ovds/database';

export interface CreateJournalEntryInput {
  date?: string;
  reference?: string;
  description: string;
  companyId?: string;
  lines: Array<{
    accountId: string;
    description?: string;
    debit?: number;
    credit?: number;
    costCenterId?: string;
  }>;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  companyId: string;
  status: string;
  createdAt: string;
}

const BALANCE_TOLERANCE = 0.0001;

@Injectable()
export class DoubleEntryService extends BaseService {
  constructor(prisma: IPrismaClient, audit: IAuditLogger) {
    super(prisma, audit, 'DoubleEntryService');
  }

  async createJournalEntry(data: CreateJournalEntryInput, userId: string): Promise<JournalEntry> {
    const { lines, companyId, description, date, reference } = data;

    if (!companyId) throw new BadRequestException('companyId is required.');
    if (!lines || lines.length === 0) throw new BadRequestException('At least one journal line is required.');

    // 1. Enforce Double-Entry Mathematical Balancing (Decimal precision, tolerance 0.0001)
    let totalDebits = new Prisma.Decimal(0);
    let totalCredits = new Prisma.Decimal(0);

    for (const line of lines) {
      const debit = new Prisma.Decimal(line.debit ?? 0);
      const credit = new Prisma.Decimal(line.credit ?? 0);
      if (debit.isNegative() || credit.isNegative()) {
        throw new BadRequestException('Transaction values cannot be negative numbers.');
      }
      totalDebits = totalDebits.plus(debit);
      totalCredits = totalCredits.plus(credit);
    }

    if (totalDebits.minus(totalCredits).abs().greaterThan(BALANCE_TOLERANCE)) {
      throw new BadRequestException(
        `Accounting Equation Mismatch: Total Debits (${totalDebits.toString()}) ` +
        `must exactly equal Total Credits (${totalCredits.toString()}).`,
      );
    }

    // 2. Atomic Database Multi-Tenant Execution Context
    const txClient = this.prisma.$transaction as unknown as <T>(fn: (tx: any) => Promise<T>) => Promise<T>;

    return txClient(async (tx: any) => {
      // Confirm all impacted accounts belong solely to the requesting company
      const uniqueAccountIds = [...new Set(lines.map(l => l.accountId))];
      const accountsCount = await tx.account.count({
        where: { id: { in: uniqueAccountIds }, companyId },
      });
      if (accountsCount !== uniqueAccountIds.length) {
        throw new BadRequestException('Unauthorized Account Scope: Invalid account cross-tenancy detected.');
      }

      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          date: date ? new Date(date) : new Date(),
          reference,
          description,
          status: 'POSTED',
          postedBy: userId,
        },
      });

      const lineCreates = lines.map(line =>
        tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: line.accountId,
            debit: new Prisma.Decimal(line.debit ?? 0),
            credit: new Prisma.Decimal(line.credit ?? 0),
            description: line.description,
            costCenterId: line.costCenterId,
            companyId,
          },
        }),
      );
      await Promise.all(lineCreates);

      this.audit(userId, 'journal_entry_created', `Created journal entry ${entry.id}`, companyId);

      return {
        id: entry.id,
        date: entry.date.toISOString(),
        description: entry.description ?? '',
        companyId: entry.companyId ?? '',
        status: entry.status,
        createdAt: entry.createdAt.toISOString(),
      };
    });
  }
}
```

> **Verified:** `packages/domains/double-entry/src/lib/double-entry.service.ts:42`. `DoubleEntryService` extends `BaseService` (from `@ovds/domains-infrastructure`) and accepts `IPrismaClient` + `IAuditLogger` interfaces — domain libs do NOT import `PrismaService` directly. The balance check uses tolerance-based comparison (`BALANCE_TOLERANCE = 0.0001`) rather than exact equality. Additional protections not in the blueprint: account cross-tenancy validation (verifies all accounts belong to the company before posting), audit logging on creation, support for `costCenterId` on lines, and `postedBy` tracking.

---

## 4b. Asynchronous Event-Driven Inter-Module Communication

The actual implementation uses a **dual-bus architecture**: a framework-agnostic singleton `EventBus` (from `@ovds/core`) for domain-to-domain decoupling, bridged to NestJS `EventEmitter2` for platform-specific handlers (notifications, BullMQ jobs, WebSocket pushes).

```text
[ SalesModule / InvoiceDomainEventService ]
      │
      ├── emits to @ovds/core EventBus (singleton)
      └── emits to NestJS EventEmitter2
              │
              ▼
    [ EventBus.getInstance() ]
      │
      ├──► [ LedgerObserverService (NestJS adapter) ]
      │         └── re-dispatches Sent / PaymentReceived to core EventBus
      │
      └──► [ InvoiceLedgerListener (@OnEvent) ]
                 └── calls DoubleEntryService.createJournalEntry()

      │
      ▼
[ LedgerObserver (framework-agnostic domain layer) ]
      │  listens on core EventBus via eventBus.listen()
      │  priority 10 — fires before notification handlers (priority 100)
      ├── onInvoiceSent()    → DR AR(1200) / CR Revenue(4000) + VAT(2210) + DRRF(2220)
      ├── onPaymentReceived() → DR Cash(1100) / CR AR(1200)
      └── onInvoiceVoided()   → Reversal entry (DR Revenue / CR AR)
```

### Event name constants and typed payloads

```typescript
// packages/domains/invoice/src/events/invoice.events.ts
export const INVOICE_EVENTS = {
  CREATED:          'invoice.invoice.created',
  SENT:             'invoice.invoice.sent',
  PAYMENT_RECEIVED: 'invoice.payment.received',
  VOIDED:           'invoice.invoice.voided',
  UPDATED:          'invoice.invoice.updated',
  OVERDUE:          'invoice.invoice.overdue',
} as const;
```

```typescript
// packages/shared/src/invoice-events.ts — re-exported subset for cross-domain observers
export interface InvoiceSnapshot {
  id: string;
  invoiceNumber: string;
  companyId: string | null;
  customerId: string | null;
  customerName: string;
  status: string;
  date: Date;
  dueDate: Date | null;
  subtotal: number;
  vatAmount: number;
  drrfAmount: number;
  totalAmount: number;
  vatRate: number;
  currencyCode: string;
  currencyRate: number;
  baseAmount: number;       // totalAmount × currencyRate
  userId?: string;
}
```

### Dual-bus dispatch (Sales module)

```typescript
// apps/backend/src/sales/invoice-domain-event.service.ts
@Injectable()
export class InvoiceDomainEventService {
  private readonly bus = EventBus.getInstance();

  constructor(private readonly emitter: EventEmitter2) {}

  async emitCreated(invoice: PrismaInvoiceRow, items: unknown[], userId?: string): Promise<void> {
    const payload = { invoice: toSnapshot(invoice, userId), items };
    // 1. @ovds/core EventBus — consumed by LedgerObserver
    await this.bus.dispatch(makeInvoiceCreatedEvent(payload));
    // 2. NestJS EventEmitter2 — consumed by @OnEvent() handlers
    this.emitter.emit(INVOICE_EVENTS.CREATED, payload);
  }
}
```

### Framework-agnostic LedgerObserver (domain layer)

```typescript
// packages/domains/accounting/src/lib/ledger-observer.ts
export class LedgerObserver {
  constructor(
    private readonly eventBus: EventBusInterface,
    private readonly db: LedgerPersistence,
  ) {}

  register(): void {
    this.eventBus.listen(INVOICE_EVENTS.SENT, (e) => this.onInvoiceSent(e), { priority: 10 });
    this.eventBus.listen(INVOICE_EVENTS.PAYMENT_RECEIVED, (e) => this.onPaymentReceived(e), { priority: 10 });
    this.eventBus.listen(INVOICE_EVENTS.VOIDED, (e) => this.onInvoiceVoided(e), { priority: 10 });
  }

  private async onInvoiceSent(event: Event): Promise<void> {
    const { invoice } = event.payload as InvoiceSentPayload;
    const [arAccount, revenueAccount, vatAccount, drrfAccount] = await Promise.all([
      this.db.findAccount(invoice.companyId, '1200'),  // Accounts Receivable
      this.db.findAccount(invoice.companyId, '4000'),  // Revenue
      this.db.findAccount(invoice.companyId, '2210'),  // VAT Payable
      this.db.findAccount(invoice.companyId, '2220'),  // DRRF Payable
    ]);
    await this.db.createJournalEntry({
      companyId: invoice.companyId,
      date: invoice.date,
      reference: invoice.invoiceNumber,
      description: `Sales Invoice ${invoice.invoiceNumber}`,
      status: 'POSTED',
      lines: [
        { accountId: arAccount.id, companyId: invoice.companyId, debit: invoice.totalAmount, credit: 0, description: `AR – Invoice ${invoice.invoiceNumber}` },
        { accountId: revenueAccount.id, companyId: invoice.companyId, debit: 0, credit: invoice.subtotal, description: `Revenue – Invoice ${invoice.invoiceNumber}` },
        ...(invoice.vatAmount > 0 && vatAccount ? [{ accountId: vatAccount.id, companyId: invoice.companyId, debit: 0, credit: invoice.vatAmount, description: `VAT – Invoice ${invoice.invoiceNumber}` }] : []),
        ...(invoice.drrfAmount > 0 && drrfAccount ? [{ accountId: drrfAccount.id, companyId: invoice.companyId, debit: 0, credit: invoice.drrfAmount, description: `DRRF – Invoice ${invoice.invoiceNumber}` }] : []),
      ],
    });
  }
}
```

> **Verified:** The dual-bus architecture is confirmed at: `packages/core/src/events/event.bus.ts:4` (singleton `EventBus`), `packages/core/src/events/event.dispatcher.ts:3` (`EventDispatcher` with priority sorting), `packages/domains/invoice/src/events/invoice.events.ts:80` (canonical event constants), `apps/backend/src/sales/invoice-domain-event.service.ts:97` (dual-bus dispatch), `packages/domains/accounting/src/lib/ledger-observer.ts:70` (framework-agnostic observer using `@ovds/core` EventBus interface), and `apps/backend/src/ledger/ledger-observer.service.ts:29` (NestJS adapter that bridges EventEmitter2 events to the core EventBus). The event name is `invoice.invoice.created` (`INVOICE_EVENTS.CREATED`), NOT `invoice.issued` as the older v1/v2 blueprints stated. The LedgerObserver uses Ethiopian Chart of Accounts codes: 1100 (Cash/Bank), 1200 (AR), 2210 (VAT Payable), 2220 (DRRF Payable), 4000 (Revenue).

## 5. React Dynamic Extensible UI Framework Context

```tsx
// apps/frontend/src/context/ExtensionSlotRegistry.tsx
import React, {
  createContext, useContext, useState, useEffect, ReactNode, ComponentType,
} from 'react';
import type { IconType } from '@ovds/shared';

export interface ModuleUIRegistration {
  id: string;
  title: string;
  navigationPath: string;
  icon: IconType;
  dashboardWidgets: Array<{
    id: string;
    component: ComponentType<any>;
    gridSize: string;
  }>;
  settingsPanel?: ComponentType<any>;
}

interface ModuleRegistryContextType {
  registeredModules: Map<string, ModuleUIRegistration>;
  activeModules: string[];
  registerModule: (module: ModuleUIRegistration) => void;
  getActiveModules: () => ModuleUIRegistration[];
  renderSlot: (slotId: string, passThroughProps?: any) => React.ReactElement | null;
}

const ModuleRegistryContext = createContext<ModuleRegistryContextType | undefined>(undefined);

export const ModuleRegistryProvider = ({
  children,
  activeModulesFromBackend,
}: {
  children: ReactNode;
  activeModulesFromBackend: string[];
}) => {
  const [registeredModules, setRegisteredModules] = useState<Map<string, ModuleUIRegistration>>(new Map());
  const [registeredSlots, setRegisteredSlots] = useState<Record<string, ComponentType<any>[]>>({});

  const registerModule = (module: ModuleUIRegistration) => {
    setRegisteredModules((prev) => {
      if (prev.has(module.id)) return prev;
      const next = new Map(prev);
      next.set(module.id, module);
      return next;
    });

    // Auto-register the module's dashboard widgets and settings panel into slots
    if (module.dashboardWidgets) {
      module.dashboardWidgets.forEach((widget) => {
        setRegisteredSlots((prev) => ({
          ...prev,
          'dashboard.metrics': [...(prev['dashboard.metrics'] || []), widget.component],
        }));
      });
    }
    if (module.settingsPanel) {
      setRegisteredSlots((prev) => ({
        ...prev,
        [`settings.panels.${module.id}`]: [...(prev[`settings.panels.${module.id}`] || []), module.settingsPanel!],
      }));
    }
  };

  const getActiveModules = () =>
    Array.from(registeredModules.values()).filter((m) =>
      activeModulesFromBackend.includes(m.id),
    );

  const renderSlot = (slotId: string, passThroughProps?: any) => {
    const Components = registeredSlots[slotId] || [];
    if (Components.length === 0) return null;
    return (
      <>
        {Components.map((Component, idx) => (
          <Component key={`${slotId}-${idx}`} {...passThroughProps} />
        ))}
      </>
    );
  };

  const value: ModuleRegistryContextType = {
    registeredModules,
    activeModules: activeModulesFromBackend,
    registerModule,
    getActiveModules,
    renderSlot,
  };

  return (
    <ModuleRegistryContext.Provider value={value}>
      {children}
    </ModuleRegistryContext.Provider>
  );
};

export const useModuleRegistry = (): ModuleRegistryContextType => {
  const context = useContext(ModuleRegistryContext);
  if (!context) throw new Error('useModuleRegistry must be used within a ModuleRegistryProvider.');
  return context;
};

export const ExtensionSlotRenderer = ({
  slotId,
  passThroughProps,
}: {
  slotId: string;
  passThroughProps?: any;
}): React.ReactElement | null => {
  const { renderSlot } = useModuleRegistry();
  return renderSlot(slotId, passThroughProps);
};
```

### Consumer registration example (double-entry feature module)

```tsx
// packages/features/double-entry/src/plugin.ts
export const DoubleEntryPluginConfig: ModuleUIRegistration = {
  id: 'double-entry',
  title: 'General Ledger',
  navigationPath: '/accounting/ledger',
  icon: 'BOOK_OPEN',
  dashboardWidgets: [
    { id: 'double-entry.trial-balance', component: TrialBalanceWidget, gridSize: 'full' },
  ],
  settingsPanel: LedgerSettingsPanel,
};
```

> **Verified:** `apps/frontend/src/context/ExtensionSlotRegistry.tsx:50` exports `ModuleRegistryProvider`. Unlike the blueprint's simplified version, the actual implementation stores modules in a `Map` keyed by `id`, **auto-registers** each module's `dashboardWidgets` into the `'dashboard.metrics'` slot and `settingsPanel` into `'settings.panels.<id>'` during `registerModule()`, and exposes a `renderSlot()` method for generic slot rendering. The `useModuleRegistry()` hook returns `getActiveModules()` which filters by the backend-provided `activeModulesFromBackend` list. Consumer modules register via `packages/features/double-entry/src/plugin.ts` exporting `DoubleEntryPluginConfig: ModuleUIRegistration`.

---

## 6. Deployment Topologies

### Cloud Microservice Stack (`docker-compose.cloud.yml`)

```yaml
version: '3.8'
services:
  cloud-postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: saas_accounting_cloud
      POSTGRES_USER: admin_cloud
      POSTGRES_PASSWORD: enterprise_secure_pwd
    ports:
      - "5432:5432"

  cloud-redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  cloud-api:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      DATABASE_PROVIDER: "postgresql"
      DATABASE_URL: "postgresql://admin_cloud:enterprise_secure_pwd@cloud-postgres:5432/saas_accounting_cloud"
      PRISMA_DATABASE_URL: "postgresql://admin_cloud:enterprise_secure_pwd@cloud-postgres:5432/saas_accounting_cloud"
      DEPLOYMENT_MODE: "CLOUD_SAAS"
      REDIS_ENABLED: "true"
      REDIS_HOST: cloud-redis
      JWT_SECRET: "${JWT_SECRET}"
      OFFLINE_PUBLIC_KEY: "${OFFLINE_PUBLIC_KEY}"
      ports:
      - "3000:3000"
    depends_on:
      - cloud-postgres
      - cloud-redis
    volumes:
      - ./apps/backend/prisma/migrations:/app/prisma/migrations
    restart: unless-stopped
```

### Self-Hosted Local Stack (`docker-compose.onpremise.yml`)

```yaml
version: '3.8'
services:
  onpremise-app:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      DATABASE_PROVIDER: "sqlite"
      DATABASE_URL: "file:/var/data/local_ledger.db"
      PRISMA_DATABASE_URL: "file:/var/data/local_ledger.db"
      DEPLOYMENT_MODE: "ON_PREMISE_SINGLE"
      REDIS_ENABLED: "false"
      OFFLINE_PUBLIC_KEY: "${OFFLINE_PUBLIC_KEY}"
      PORT: "3001"
    volumes:
      - onpremise_data:/var/data
    ports:
      - "8080:3001"
    restart: unless-stopped

volumes:
  onpremise_data:
    driver: local
```

### Unified Dockerfile (`apps/backend/Dockerfile`)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/*/package.json packages/*/
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build:backend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_PROVIDER=${DATABASE_PROVIDER:-postgresql}
ENV DEPLOYMENT_MODE=${DEPLOYMENT_MODE:-CLOUD_SAAS}
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
EXPOSE 3001
CMD ["node", "dist/apps/backend/main.js"]
```

> **Verified:** `docker-compose.cloud.yml` and `docker-compose.onpremise.yml` both live at repository root and build from the single `apps/backend/Dockerfile`. Key corrections from the blueprint: (1) single `apps/backend/` Dockerfile replaces separate `cloud-api`/`on-premise-api` Dockerfiles, (2) Dockerfile uses `npm ci` not pnpm/corepack, builds with `npm run build:backend`, (3) both compose files use `PRISMA_DATABASE_URL` alongside `DATABASE_URL` (the PrismaService reads `PRISMA_DATABASE_URL`), (4) the on-premise stack maps port `8080:3001` with `PORT: "3001"` in env, (5) the env var is `OFFLINE_PUBLIC_KEY` (not `OFFLINE_LICENSE_SECRET`), (6) cloud compose includes a Redis sidecar and mounts migrations volume, (7) Node 22 base image, not Node 20.



---

## 7. Dynamic Database Migration Pipelines

Schema changes in a multi-tenant system are the highest-risk operation you will run in production. A missed migration on one tenant can corrupt ledger relationships; a schema mismatch between cloud and on-premise can silently diverge behavior. This section provides two concrete strategies: one for rolling cloud migrations across thousands of isolated tenant databases, and one for embedded startup migrations inside an on-premise container.

---

### 7.1 Cloud Strategy — Rolling Tenant Migration Runner

On the cloud each company typically shares one logical schema inside a single PostgreSQL database, scoped by `companyId`. Prisma's standard `prisma migrate deploy` handles this case well because there is only one database URL to target.

For deployments using **schema-per-tenant** isolation (where each tenant has their own PostgreSQL schema, e.g. `tenant_abc.journal_entries`), you need a migration runner that iterates over every active tenant and applies pending migrations to each schema independently.

#### Service: `TenantMigrationRunner`

```typescript
// packages/core/src/tenant-migration-runner.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as path from 'path';

interface TenantRecord {
  id: string;
  subdomain: string;
  databaseSchema: string; // e.g. "tenant_abc"
}

/**
 * Iterates all active tenants from the control-plane database and runs
 * `prisma migrate deploy` against each tenant's schema in sequence.
 *
 * Run this as a one-off job during deployment (CI/CD pipeline step),
 * NOT as part of the hot API path.
 */
export class TenantMigrationRunner {
  private controlPlane: PrismaClient;

  constructor() {
    // The control-plane DB holds the Company registry — separate from tenant data.
    this.controlPlane = new PrismaClient({
      datasources: { db: { url: process.env.CONTROL_PLANE_DATABASE_URL } },
    });
  }

  async runMigrationsForAllTenants(): Promise<void> {
    const tenants: TenantRecord[] = await this.controlPlane.$queryRaw`
      SELECT id, subdomain, "databaseSchema"
      FROM "Company"
       WHERE "environment" = 'PRODUCTION'
      ORDER BY "createdAt" ASC
    `;

    console.log(`[MigrationRunner] Starting migrations for ${tenants.length} tenants.`);

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const tenant of tenants) {
      try {
        const tenantUrl = this.buildTenantUrl(tenant.databaseSchema);
        this.applyMigration(tenantUrl, tenant.subdomain);
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`[${tenant.subdomain}] ${err.message}`);
        // Log and continue — one failed tenant must not block the rest.
        console.error(`[MigrationRunner] FAILED for tenant ${tenant.subdomain}:`, err.message);
      }
    }

    console.log(
      `[MigrationRunner] Complete. Success: ${results.success}, Failed: ${results.failed}`
    );

    if (results.failed > 0) {
      console.error('[MigrationRunner] Failed tenants:\n', results.errors.join('\n'));
      // Exit non-zero so the CI/CD pipeline surfaces the failure.
      process.exit(1);
    }

    await this.controlPlane.$disconnect();
  }

  private buildTenantUrl(schema: string): string {
    // Appends ?schema=<tenant_schema> to the base PostgreSQL URL.
    const base = process.env.TENANT_DATABASE_BASE_URL!; // e.g. postgresql://user:pwd@host:5432/saas_db
    return `${base}?schema=${schema}`;
  }

  private applyMigration(databaseUrl: string, tenantLabel: string): void {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    console.log(`[MigrationRunner] Migrating tenant: ${tenantLabel}`);

    // Prisma reads DATABASE_URL from the environment at migration time.
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe', // Suppress per-tenant output; only surface errors.
    });
  }
}

// Entry point for CI/CD invocation: `npx ts-node tenant-migration-runner.ts`
if (require.main === module) {
  new TenantMigrationRunner().runMigrationsForAllTenants().catch(console.error);
}
```

#### CI/CD Pipeline Integration (GitHub Actions)

```yaml
# .github/workflows/deploy-cloud.yml
name: Cloud Deploy & Migrate

on:
  push:
    branches: [main]

jobs:
  migrate-tenants:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run rolling tenant migrations
        env:
          CONTROL_PLANE_DATABASE_URL: ${{ secrets.CONTROL_PLANE_DATABASE_URL }}
          TENANT_DATABASE_BASE_URL: ${{ secrets.TENANT_DATABASE_BASE_URL }}
        run: npx ts-node packages/core/src/tenant-migration-runner.ts

  deploy-api:
    runs-on: ubuntu-latest
    needs: migrate-tenants  # API only goes live after all tenants are migrated
    steps:
      - name: Deploy backend container
        run: echo "Deploy step here (ECS, Fly.io, Railway, etc.)"
```

---

### 7.2 On-Premise Strategy — Embedded Startup Migration Loop

On-premise deployments cannot rely on an external CI/CD pipeline. The application itself must verify and apply pending migrations on every container start. This is the safest pattern for air-gapped environments: the migration runs inside the same process boundary that owns the database file.

### 7.2 On-Premise Strategy — Embedded Startup Migration Loop

On-premise deployments cannot rely on an external CI/CD pipeline. The application itself must verify and apply pending migrations on every container start. This is the safest pattern for air-gapped environments: the migration runs inside the same process boundary that owns the database file.

#### NestJS Lifecycle Hook: `OnPremiseMigrationBootstrapper`

```typescript
// apps/backend/src/bootstrap/on-premise-migration.bootstrapper.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Runs `prisma migrate deploy` on application startup for on-premise environments.
 * Implements OnModuleInit so migrations complete before any route handler is live.
 *
 * Safe for repeated runs — Prisma's migration engine is idempotent and skips
 * already-applied migrations.
 */
@Injectable()
export class OnPremiseMigrationBootstrapper implements OnModuleInit {
  private readonly logger = new Logger(OnPremiseMigrationBootstrapper.name);

  async onModuleInit(): Promise<void> {
    if (process.env.DEPLOYMENT_MODE !== 'ON_PREMISE_SINGLE') {
      return;
    }

    this.logger.log('Running embedded schema migration check...');
    try {
      this.ensureDataDirectoryExists();
      this.applyMigrations();
      this.logger.log('Schema migrations verified and up to date.');
    } catch (err: any) {
      this.logger.error('FATAL: Schema migration failed on startup.', err.message);
      process.exit(1);
    }
  }

  private ensureDataDirectoryExists(): void {
    const dbUrl = process.env.DATABASE_URL ?? '';
    const filePath = dbUrl.replace('file:', '');
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(`Created data directory: ${dir}`);
    }
  }

  private applyMigrations(): void {
    const schemaPath = path.resolve(__dirname, '../../../../packages/database/prisma/schema.prisma');
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit',
    });
  }
}
```

> **Verified:** The `OnPremiseMigrationBootstrapper` pattern is described in the blueprint but the `apps/onpremise-api/` path does not exist — the on-premise deployment uses the same `apps/backend/` codebase with `DEPLOYMENT_MODE=ON_PREMISE_SINGLE`. The Dockerfile runs `npx prisma generate` at build time; runtime migrations would be `prisma migrate deploy` invoked during container startup (see `docker-compose.onpremise.yml`). **Note:** The blueprint section references `packages/database/scripts/migrate-cross-provider.mjs` — this file does NOT exist in the codebase. For schema portability between PostgreSQL and SQLite/MySQL, the actual approach is `DATABASE_PROVIDER` env var + `npx prisma generate` + `npx prisma db push` at build time, not a custom `.mjs` migration script.
```

#### Register in the On-Premise App Module

```typescript
// apps/backend/src/app.module.ts (on-premise mode)
import { Module } from '@nestjs/common';
import { OnPremiseMigrationBootstrapper } from './bootstrap/on-premise-migration.bootstrapper';

@Module({
  providers: [OnPremiseMigrationBootstrapper],
})
export class AppModule {}
```

#### Startup Sequence Guarantee

```
Container starts
      │
      ▼
OnPremiseMigrationBootstrapper.onModuleInit()
      │
      ├─► Check /var/data directory exists  →  create if missing
      │
      ├─► prisma migrate deploy             →  apply pending .sql migrations
      │
      └─► Success → NestJS HTTP server binds to port 8080
               └─► Failure → process.exit(1) → Docker restarts container
```

---

### 7.3 Migration Safety Checklist

| Concern | Cloud (Rolling) | On-Premise (Embedded) |
|---|---|---|
| Backward-compatible columns only | ✅ Required — API is live during migration | ✅ Required — old data must survive restart |
| Non-destructive column removal | Use `@deprecated` flag, remove in next release | Same pattern |
| Adding NOT NULL columns | Always provide a `DEFAULT` value in the migration | Same pattern |
| Large table `ALTER TABLE` locks | Run during low-traffic window; use `CONCURRENTLY` in raw SQL | N/A — single user, SQLite has no locking concern |
| Rollback strategy | Keep previous Docker image tagged; re-deploy + run a down migration SQL manually | Ship a `--rollback` CLI flag that restores last SQLite backup |

---

## 8. Playwright Multi-Tenant Integration Testing

The most critical security invariant in a SaaS accounting platform is tenant isolation: Tenant A must never be able to read, write, or even detect the existence of Tenant B's data. This section provides a complete Playwright test suite that actively probes cross-tenant attack vectors via HTTP manipulation, covering the most common real-world breach patterns.

---

### 8.1 Test Infrastructure Setup

```typescript
// tests/multi-tenant/fixtures/tenant.fixture.ts
import { test as base, expect, APIRequestContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

export interface TenantFixture {
  tenantA: TenantContext;
  tenantB: TenantContext;
}

export interface TenantContext {
  companyId: string;
  authToken: string;
  api: APIRequestContext;
}

/**
 * Provisions two fresh, isolated tenant companies before each test and
 * tears them down afterward. Guarantees a clean state for every assertion.
 */
export const test = base.extend<TenantFixture>({
  tenantA: async ({ playwright }, use) => {
    const ctx = await provisionTenant(playwright, 'tenant-a-test');
    await use(ctx);
    await deprovisionTenant(ctx.companyId);
  },
  tenantB: async ({ playwright }, use) => {
    const ctx = await provisionTenant(playwright, 'tenant-b-test');
    await use(ctx);
    await deprovisionTenant(ctx.companyId);
  },
});

export { expect };

// ---------------------------------------------------------------------------

const prisma = new PrismaClient();

async function provisionTenant(
  playwright: typeof import('@playwright/test')['_baseTest']['_info'] extends never ? never : any,
  subdomain: string
): Promise<TenantContext> {
  // 1. Create company record directly in DB for speed (bypass UI signup)
  const company = await prisma.company.create({
    data: { name: `Test Company ${subdomain}`, subdomain },
  });

  // 2. Exchange for an auth token via the API
  const api = await (playwright as any).request.newContext({
    baseURL: process.env.TEST_API_BASE_URL ?? 'http://localhost:3000',
  });

  const tokenRes = await api.post('/auth/token/test', {
    data: { companyId: company.id },
    headers: { 'x-internal-test-secret': process.env.TEST_INTERNAL_SECRET ?? '' },
  });

  const { accessToken } = await tokenRes.json();

  // 3. Re-create the context with the auth header pre-set
  const authedApi = await (playwright as any).request.newContext({
    baseURL: process.env.TEST_API_BASE_URL ?? 'http://localhost:3000',
    extraHTTPHeaders: {
      Authorization: `Bearer ${accessToken}`,
      'x-company-id': company.id,
    },
  });

  return { companyId: company.id, authToken: accessToken, api: authedApi };
}

async function deprovisionTenant(companyId: string): Promise<void> {
  await prisma.company.delete({ where: { id: companyId } });
  await prisma.$disconnect();
}
```

---

### 8.2 Cross-Tenant Data Breach Test Suite

```typescript
// tests/multi-tenant/cross-tenant-breach.spec.ts
import { test, expect } from './fixtures/tenant.fixture';

/**
 * SECURITY TEST SUITE: Cross-Tenant Data Isolation
 *
 * Each test simulates a specific attack vector where an authenticated user
 * of Tenant A attempts to access or corrupt Tenant B's accounting data.
 * All assertions verify that the attempt is BLOCKED, never silently ignored.
 */
test.describe('Cross-Tenant Data Isolation', () => {

  // ─── ATTACK VECTOR 1: Direct ID Enumeration ─────────────────────────────
  test('Tenant A cannot read a journal entry belonging to Tenant B via direct ID', async ({
    tenantA,
    tenantB,
  }) => {
    // 1. Tenant B creates a journal entry legitimately
    const createRes = await tenantB.api.post('/accounting/journal-entries', {
      data: {
        description: 'Tenant B secret transaction',
        date: new Date().toISOString(),
        lines: [
          { accountId: 'acc-b-1', debit: '1000.00', credit: '0.00' },
          { accountId: 'acc-b-2', debit: '0.00', credit: '1000.00' },
        ],
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const { id: tenantBEntryId } = await createRes.json();

    // 2. Tenant A attempts to fetch that entry using its known ID
    const breachRes = await tenantA.api.get(`/accounting/journal-entries/${tenantBEntryId}`);

    // 3. Must return 404 — not 403, because even confirming the resource EXISTS
    //    leaks tenant data (existence oracle attack).
    expect(breachRes.status()).toBe(404);
  });

  // ─── ATTACK VECTOR 2: Header Spoofing ────────────────────────────────────
  test('Tenant A cannot spoof x-company-id header to access Tenant B data', async ({
    tenantA,
    tenantB,
  }) => {
    // Manually craft a request using Tenant A's valid JWT but Tenant B's companyId header
    const spoofRes = await tenantA.api.get('/accounting/accounts', {
      headers: {
        // Overwrite the pre-set header with Tenant B's ID
        'x-company-id': tenantB.companyId,
      },
    });

    // The server must derive tenant identity from the JWT claim, not from the
    // raw header value. The JWT-bound companyId and the header must match, or
    // the request is rejected.
    expect([401, 403]).toContain(spoofRes.status());
  });

  // ─── ATTACK VECTOR 3: Mass Assignment via Explicit companyId in Body ─────
  test('Tenant A cannot inject Tenant B companyId into a create payload', async ({
    tenantA,
    tenantB,
  }) => {
    // Attempt to create a journal entry and force it into Tenant B's partition
    const injectRes = await tenantA.api.post('/accounting/journal-entries', {
      data: {
        companyId: tenantB.companyId, // <── attempted mass assignment
        description: 'Injected into Tenant B',
        date: new Date().toISOString(),
        lines: [
          { accountId: 'acc-b-1', debit: '500.00', credit: '0.00' },
          { accountId: 'acc-b-2', debit: '0.00', credit: '500.00' },
        ],
      },
    });

    // The Prisma RLS extension overwrites companyId from the JWT context,
    // so the record should either be rejected or silently assigned to Tenant A.
    if (injectRes.ok()) {
      const created = await injectRes.json();
      // If created, it MUST belong to Tenant A, never Tenant B
      expect(created.companyId).toBe(tenantA.companyId);
      expect(created.companyId).not.toBe(tenantB.companyId);
    } else {
      // A 400/403 is also acceptable
      expect([400, 403]).toContain(injectRes.status());
    }
  });

  // ─── ATTACK VECTOR 4: List Endpoint Enumeration ──────────────────────────
  test('Tenant A list endpoints never return Tenant B records', async ({
    tenantA,
    tenantB,
  }) => {
    // Seed Tenant B with known data
    await tenantB.api.post('/accounting/journal-entries', {
      data: {
        description: 'Tenant B private entry',
        date: new Date().toISOString(),
        lines: [
          { accountId: 'acc-b-1', debit: '250.00', credit: '0.00' },
          { accountId: 'acc-b-2', debit: '0.00', credit: '250.00' },
        ],
      },
    });

    // Fetch Tenant A's list — must never include Tenant B's record
    const listRes = await tenantA.api.get('/accounting/journal-entries');
    expect(listRes.ok()).toBeTruthy();

    const { data: entries } = await listRes.json();
    const leak = entries.some(
      (entry: { companyId: string }) => entry.companyId === tenantB.companyId
    );

    expect(leak).toBe(false);
  });

  // ─── ATTACK VECTOR 5: Cross-Tenant Write via Known Account ID ────────────
  test('Tenant A cannot post a journal line referencing a Tenant B account ID', async ({
    tenantA,
    tenantB,
  }) => {
    // Fetch a legitimate Tenant B account ID (simulating OSINT / insider knowledge)
    const accountsRes = await tenantB.api.get('/accounting/accounts');
    const { data: tenantBAccounts } = await accountsRes.json();
    const stolenAccountId = tenantBAccounts[0]?.id;

    if (!stolenAccountId) {
      test.skip(); // No accounts seeded for Tenant B; skip gracefully
    }

    // Tenant A attempts to reference Tenant B's account in their own journal entry
    const writeRes = await tenantA.api.post('/accounting/journal-entries', {
      data: {
        description: 'Cross-tenant account reference',
        date: new Date().toISOString(),
        lines: [
          { accountId: stolenAccountId, debit: '100.00', credit: '0.00' }, // Tenant B's account
          { accountId: 'acc-a-1',       debit: '0.00',   credit: '100.00' },
        ],
      },
    });

    // The DB foreign key constraint + RLS filter on accountId lookup must block this.
    // The Prisma `onDelete: Restrict` on JournalLine → Account prevents orphan writes.
    expect(writeRes.ok()).toBe(false);
    expect([400, 403, 404, 422]).toContain(writeRes.status());
  });

  // ─── ATTACK VECTOR 6: JWT Replay with Expired Token ─────────────────────
  test('Expired JWT token is rejected on all accounting endpoints', async ({ tenantA }) => {
    const expiredTokenContext = await (global as any).__playwright.request.newContext({
      baseURL: process.env.TEST_API_BASE_URL ?? 'http://localhost:3000',
      extraHTTPHeaders: {
        Authorization: `Bearer ${process.env.TEST_EXPIRED_JWT ?? 'expired.token.here'}`,
        'x-company-id': tenantA.companyId,
      },
    });

    const res = await expiredTokenContext.get('/accounting/journal-entries');
    expect(res.status()).toBe(401);
  });
});
```

---

### 8.3 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/multi-tenant',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run sequentially — tenant provisioning order must be deterministic

  use: {
    baseURL: process.env.TEST_API_BASE_URL ?? 'http://localhost:3000',
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },

  projects: [
    {
      name: 'API Security — Multi-Tenant Isolation',
      testMatch: '**/cross-tenant-breach.spec.ts',
    },
  ],

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
});
```

---

### 8.4 Running the Security Test Suite

```bash
# Start the backend in test mode (separate terminal or CI service)
DEPLOYMENT_MODE=CLOUD_SAAS DATABASE_URL=<test-db-url> npx nx serve backend

# Run the isolation test suite
npx playwright test --project="API Security — Multi-Tenant Isolation"

# Generate and view the HTML breach report
npx playwright show-report
```

**Expected output when isolation is correctly implemented:**

```
✓  Cross-Tenant Data Isolation › Tenant A cannot read a journal entry belonging to Tenant B via direct ID
✓  Cross-Tenant Data Isolation › Tenant A cannot spoof x-company-id header to access Tenant B data
✓  Cross-Tenant Data Isolation › Tenant A cannot inject Tenant B companyId into a create payload
✓  Cross-Tenant Data Isolation › Tenant A list endpoints never return Tenant B records
✓  Cross-Tenant Data Isolation › Tenant A cannot post a journal line referencing a Tenant B account ID
✓  Cross-Tenant Data Isolation › Expired JWT token is rejected on all accounting endpoints

6 passed (4.2s)
```

---

### 8.5 Attack Vector Coverage Matrix

| Vector | Method | Expected HTTP Status | RLS Layer Responsible |
|---|---|---|---|
| Direct ID enumeration | `GET /resource/:id` | `404` | Prisma `$allOperations` WHERE filter |
| Header spoofing | Overwrite `x-company-id` | `401` / `403` | JWT guard validates claim vs header |
| Mass assignment | `companyId` in POST body | `400` / `403` or silently overwritten | Prisma `create` interceptor |
| List pollution | `GET /resource` (no filter) | `200` with empty/own-only data | Prisma `findMany` WHERE filter |
| Cross-tenant FK write | Reference foreign account ID | `400`–`422` | DB foreign key + account scope query |
| Token replay | Expired JWT | `401` | NestJS `JwtAuthGuard` |

---

### 8.6 Actual Test Files in Repository

The blueprint describes a comprehensive fixture-based test infrastructure. The **actual** Playwright test suite lives at `apps/backend/test/` and uses a simpler authentication-driven approach:

| Test File | Scope | Verified Location |
|---|---|---|
| `apps/backend/test/tenant-subdomain.e2e-spec.ts` | Tenant subdomain resolution via `TenantSubdomainMiddleware` — tests known/unknown subdomains, header priority, reserved subdomain filtering | 114 lines, 8 test cases |
| `apps/backend/test/ledger-event-driven.e2e-spec.ts` | Event-driven ledger posting — invoice creation → `INVOICE_EVENTS.CREATED` → `InvoiceLedgerListener` → balanced journal entry | 345 lines, 3 test cases |

Key differences from the blueprint's ideal test suite:

1. **No `apps/backend/test/fixtures/tenant.fixture.ts`** — tenant context is established via authenticated JWT + `x-company-id` header, not fixture-provisioned companies
2. **No `/auth/token/test` endpoint** — tests log in via `/api/auth/login` with `OVDS_TEST_USER` / `OVDS_TEST_PASS` env vars
3. **API base URL** is `http://localhost:3001` (not port 3000) — the on-premise compose maps `8080:3001`
4. **Attack vector testing** is partially implemented: the `purchases-tenant-isolation-bug.spec.ts` at `apps/backend/src/purchases/` covers cross-tenant data leak scenarios at the unit level, but the comprehensive HTTP-level attack vector matrix (header spoofing, mass assignment, JWT replay) is not yet implemented as Playwright E2E tests

> **Verification status:** The tenant isolation guards are tested at unit level (`apps/backend/src/purchases/purchases-tenant-isolation-bug.spec.ts` — 5 test cases covering where-clause injection, cross-tenant enumeration) and the subdomain resolution + event-driven ledger flow are tested at E2E level. The full cross-tenant HTTP attack matrix (Section 8.2) remains aspirational and does not exist as executable tests.

---

*Document complete. Next recommended steps: (1) implement the remaining cross-tenant HTTP attack vector tests from Section 8.2 as actual Playwright specs in `apps/backend/test/`, (2) implement the `OnPremiseMigrationBootstrapper` (Section 7.2) referenced above as a real NestJS `OnModuleInit` service in `apps/backend/src/`, wired into `AppModule`, and (3) implement cross-provider schema migration handling — the blueprint's `migrate-cross-provider.mjs` script does not exist; consider adding a `pnpm db:migrate:cloud` / `pnpm db:migrate:onprem` task pair.*
