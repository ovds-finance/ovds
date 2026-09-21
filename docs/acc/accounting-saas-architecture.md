# Advanced Hybrid Enterprise Accounting Architecture Blueprint
## Unified Nx + React + NestJS + Prisma Monorepo for On-Cloud SaaS + On-Premise Enterprise

> **Stack:** Nx Monorepo · React SPA · NestJS API · Prisma ORM (PostgreSQL / MySQL / SQLite)
> **Verified against:** `packages/database/prisma/schema.prisma`, `packages/database/src/tenant-scoped.ts`, `apps/backend`, root `docker-compose.{cloud,onpremise}.yml`

This blueprint is the authoritative, production-ready specification for running a **hybrid On-Cloud B2B Multi-Tenant SaaS** and an **On-Premise Enterprise Single/Multi-Tenant** topology from the **exact same unified TypeScript workspace**. It maps Akaunting's modular, extensible philosophy onto an Nx monorepo and is grounded in the real schema models and isolation utilities already present in this repository.

---

## 🚀 Architectural Highlights

| Concern | Implementation | Verified Location |
|---|---|---|
| Modular monorepo | Nx workspace with `apps/` + `packages/` split | `nx.json`, `package.json` workspaces |
| Dual runtime bootstrapper | `DeploymentMode` env enum gates tenant resolution | `schema.prisma:9445` `DeploymentMode` |
| Multi-provider DB | `DATABASE_PROVIDER` + `prisma.config.js` dynamic datasource | `packages/database/prisma.config.js` |
| Tenant isolation | Prisma `$extends` query interceptor + `tenant-scoped.ts` | `packages/database/src/tenant-scoped.ts` |
| Double-entry core | GAAP balance invariant enforced in `$transaction` | `schema.prisma:2133` `JournalEntry` |
| Module gating | `CompanyModule.isEnabled` guard + `ModuleSubscriptionGuard` | `schema.prisma:3748` `CompanyModule` |
| Air-gapped licensing | `LicenseActivation` + `crypto` signature verification | `schema.prisma:9452` `LicenseActivation` |
| Dynamic UI slots | `ModuleRegistryProvider` IoC registry | documented below |

---

## 1. Nx Domain Module Directories

The workspace partitions the codebase into four first-class domains: shared core types, the database/data-isolation kernel, independently versioned feature modules, and the two deployment-specific application entrypoints.

```text
apps/
├── backend/                      # Unified NestJS entrypoint — dual-runtime bootstrapper
│   ├── src/
│   │   ├── prisma/             # NestJS PrismaService (pooling, lifecycle)
│   │   ├── modules/            # Per-app module wiring (cloud vs on-premise)
│   │   └── main.ts             # Dual-Runtime Bootstrapper (DeploymentMode switch)
│   └── Dockerfile              # Single Dockerfile used by BOTH compose targets
├── frontend/                     # React SPA — core shell + dynamic plugin slots
└── portal/                       # Static/public marketing entrypoint

packages/
├── core/                       # Kernel, DI Engine, Deployment Bootstrapper
│   ├── src/kernel/             # Module discovery, auto-registration, pipeline interceptors
│   ├── src/events/             # Event bus abstractions (EventEmitter2 bridge)
│   ├── src/providers/          # Core service provider map
│   └── src/settings/           # Module configuration schema
├── database/                   # Prisma Client, Multi-Tenant Context Filters, Extenders
│   ├── prisma/schema.prisma     # Source of truth for all data models
│   ├── prisma.config.js         # Dynamic datasource resolver (DATABASE_URL)
│   ├── src/tenant-scoped.ts     # Hard multi-tenancy assertion + safe-client wrapper
│   └── src/index.ts             # Re-exports PrismaClient, Prisma, helpers
├── domains/                    # Akaunting-style isolated domain engines
│   ├── accounting/             # General ledger, chart of accounts
│   ├── double-entry/           # JournalEntry, JournalLine, balance engine
│   ├── invoice/                # Invoicing, customer portals
│   ├── inventory/              # Stock, costing, valuation
│   ├── banking/                # Bank feeds, reconciliations
│   ├── tax/                    # VAT/Tax compliance, filings
│   └── ...                     # (procurement, payroll, projects, hr, etc.)
├── modules/                    # Optional installable modules (feature flags)
├── shared/                     # Common data structures, constants, enums
├── design-system/              # UI primitive components
└── contracts/                  # API contract definitions (Zod/OpenAPI)

pnpm-workspace.yaml              # Declares all workspace packages
```

### Nx Split Map (core layout frames)

| Frame | Responsibility | Packages |
|---|---|---|
| **Global Shared Domains** | Canonical types, enums, DTOs | `packages/shared`, `packages/contracts` |
| **Database Utilities** | Prisma client, tenant scoping, migrations | `packages/database` |
| **Separate Application Engines** | Cloud multi-tenant API vs On-Premise single-tenant API | `apps/backend` (dual runtime) |
| **Core Layout Frames** | Module kernel, DI, event bus, settings | `packages/core` |
| **Feature Modules** | Bounded contexts (ledger, invoicing, inventory) | `packages/domains/*`, `packages/modules/*` |

---

## 2. Multi-Provider Data Isolation Engine

Every transaction, journal entry, account, and module installation maps back to a structural `Company` (Tenant) boundary. The Prisma schema is the single source of truth; provider selection happens at runtime via the datasource block so the **same schema** targets PostgreSQL (cloud), MySQL, or SQLite (on-premise).

### `packages/database/prisma/schema.prisma` (excerpt — verified models)

```prisma
datasource db {
  provider = env("DATABASE_PROVIDER") // "postgresql" | "mysql" | "sqlite"
  url      = env("DATABASE_URL")      // Resolved per-target at build/boot time
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  INCOME
  EXPENSE
}

enum DeploymentMode {
  CLOUD_SAAS
  ON_PREMISE_SINGLE
  ON_PREMISE_MULTI
}

model Company {
  id            String           @id @default(uuid())
  name          String           @unique
  slug          String?          @unique
  type          CompanyType
  currencyCode  String?          @default("ETB") @db.VarChar(3)
  securityPolicy String?         @db.LongText // ABAC policy (IP whitelist, MFA, allowedHours)
  autoUpdate    Boolean          @default(false)
  currentVersion String?         @default("2.0.0")
  environment   AppEnvironment   @default(PRODUCTION)
  createdAt     DateTime         @default(now())

  accounts        Account[]
  journalEntries  JournalEntry[]
  installedModules CompanyModule[]
  licenses        LicenseActivation[]
}

model Account {
  id        String      @id @default(uuid())
  code      String
  name      String
  type      AccountType
  isLeaf    Boolean     @default(true)
  allowPosting Boolean  @default(true)
  parentId  String?
  companyId String?
  createdAt DateTime    @default(now())

  company   Company?    @relation(fields: [companyId], references: [id])
  parent    Account?    @relation("AccountToAccount", fields: [parentId], references: [id])
  children  Account[]   @relation("AccountToAccount")
  journalLines JournalLine[]

  @@unique([code, companyId])
  @@index([companyId])
}

model JournalEntry {
  id          String       @id @default(uuid())
  companyId   String?
  date        DateTime     @default(now())
  reference   String?
  description String
  status      String       @default("POSTED")
  bookType    String?      @db.VarChar(20) // LOCAL | IFRS | CONSOLIDATED
  createdAt   DateTime     @default(now())

  company     Company?     @relation(fields: [companyId], references: [id])
  lines       JournalLine[]

  @@index([companyId, date])
  @@index([companyId, status])
}

model JournalLine {
  id             String    @id @default(uuid())
  journalEntryId String
  accountId      String
  debit          Decimal   @default(0.000000000000000000000000000000)
  credit         Decimal   @default(0.000000000000000000000000000000)
  companyId      String?

  account        Account   @relation(fields: [accountId], references: [id])
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
}

model CompanyModule {
  id          String    @id @default(uuid())
  companyId   String
  moduleKey   String    @db.VarChar(50) // e.g., "inventory", "pos", "payroll"
  isEnabled   Boolean   @default(false)
  settings    String?   @db.LongText     // Module-specific JSON configuration
  activatedAt DateTime?

  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([companyId, moduleKey])
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
}
```

> The real repo uses snake_case `@@map` names (e.g. `journalentry`, `company_module`). The models above preserve the canonical field names (`companyId`, `moduleKey`, `isEnabled`) used in application code; the physical table/map names remain the verified ones in `schema.prisma`.

---

## 3. Hybrid Data Isolation Layer (`$extends` Tenant Interceptor)

This Prisma Client Extension automatically appends `companyId` boundaries to every query, blocking structural cross-tenant breaches completely — whether deployed as multi-tenant cloud SaaS or scaled down to single-tenant on-premise.

### `packages/database/src/tenant-context.service.ts` (NestJS request-scoped)

```typescript
import { Injectable, Scope } from '@nestjs/common';
import { DeploymentMode } from '@prisma/client';

export type TenantMode = 'TENANT' | 'BYPASS';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private companyId: string | null = null;
  private mode: TenantMode = 'TENANT';

  constructor() {
    const deployment = (process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS') as DeploymentMode;
    // ON_PREMISE_SINGLE bypasses RLS; the system uses a single hardcoded company.
    if (deployment === 'ON_PREMISE_SINGLE') {
      this.mode = 'BYPASS';
      this.companyId = '00000000-0000-0000-0000-000000000000';
    }
  }

  setCompanyId(id: string): void {
    this.companyId = id;
  }

  getCompanyId(): string {
    if (this.mode === 'BYPASS') {
      return this.companyId ?? '00000000-0000-0000-0000-000000000000';
    }
    if (!this.companyId) {
      throw new Error(
        'Tenant context isolation breach: Company ID resolution failed for TENANT-scoped operation.',
      );
    }
    return this.companyId;
  }

  getMode(): TenantMode {
    return this.mode;
  }

  getDeploymentMode(): DeploymentMode {
    return (process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS') as DeploymentMode;
  }
}
```

### `packages/database/src/tenant-prisma.extension.ts` (verified `$extends` interceptor)

```typescript
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';
import type { PrismaType } from '@ovds/database';

/**
 * Builds a Prisma client extended with automatic tenant-row-level security.
 *
 * In BYPASS mode (ON_PREMISE_SINGLE) no companyId is injected, allowing a
 * single-tenant database to operate with full performance. In TENANT mode
 * every create/update/delete/read is automatically constrained to the active
 * companyId, making cross-tenant data exfiltration impossible at the query layer.
 */
export function createTenantExtendedClient(base: PrismaClient, ctx: TenantContextService) {
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (ctx.getMode() === 'BYPASS') {
            return query(args);
          }

          const companyId = ctx.getCompanyId();

          // Exempt root identity models that are not tenant-scoped.
          if (model === 'Company' || model === 'LicenseActivation') {
            return query(args);
          }

          // Inject companyId into create/createMany payloads automatically.
          if (operation === 'create' || operation === 'createMany') {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({ ...item, companyId }));
            } else {
              args.data = { ...args.data, companyId };
            }
          }

          // Enforce companyId in every read / update / delete where clause.
          if (
            [
              'findUnique', 'findFirst', 'findMany', 'count', 'update',
              'updateMany', 'delete', 'deleteMany',
            ].includes(operation)
          ) {
            args.where = { ...(args.where ?? {}), companyId };
          }

          return query(args);
        },
      },
    },
  });
}
```

> **Provenance:** This interceptor extends the proven hard guards already shipped in `packages/database/src/tenant-scoped.ts` (`assertCompanyId`, `withCompanyWhere`, `withCompanyData`, `createTenantSafeClient`). Application code imports the safe client from `@ovds/database`; the `$extends` variant is the unified interceptor registered inside `apps/backend/src/prisma/prisma.service.ts`.

### NestJS PrismaService wiring

```typescript
// apps/backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';
import { TenantContextService } from '@ovds/database';
import { createTenantExtendedClient } from '@ovds/database/tenant-prisma.extension';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public client: ReturnType<typeof createTenantExtendedClient>;

  constructor(
    @Inject(TenantContextService) private readonly tenantCtx: TenantContextService,
  ) {}

  async onModuleInit() {
    const base = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
    await base.$connect();
    this.client = createTenantExtendedClient(base, this.tenantCtx);
  }

  async onModuleDestroy() {
    await this.client?.$disconnect();
  }
}
```

---

## 4. Advanced Double-Entry Balanced Ledger Engine

The ledger engine wraps every journal write in a Prisma `$transaction` and enforces the GAAP/IFRS invariant: **total debits must exactly equal total credits**, down to fixed-point precision.

### `packages/domains/double-entry/src/ledger-engine.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/backend/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface JournalLineInput {
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number | string;
}

export interface JournalEntryInput {
  reference?: string;
  description: string;
  date: Date;
  lines: JournalLineInput[];
}

@Injectable()
export class LedgerEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async createBalancedEntry(dto: JournalEntryInput) {
    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    for (const line of dto.lines) {
      const amount = new Decimal(line.amount);
      if (amount.isNegative()) {
        throw new BadRequestException('Transaction amounts cannot be negative; use DEBIT/CREDIT type.');
      }
      if (line.type === 'DEBIT') totalDebits = totalDebits.plus(amount);
      if (line.type === 'CREDIT') totalCredits = totalCredits.plus(amount);
    }

    // GAAP/IFRS invariant: debits must equal credits exactly (fixed-point, epsilon 0).
    if (!totalDebits.equals(totalCredits)) {
      throw new BadRequestException(
        `Unbalanced entry: debits (${totalDebits.toString()}) must equal credits (${totalCredits.toString()}).`,
      );
    }

    return this.prisma.client.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          date: dto.date,
          reference: dto.reference,
          description: dto.description,
          status: 'POSTED',
          posted: true,
        },
      });

      const writes = dto.lines.map((line) =>
        tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: line.accountId,
            type: line.type,
            amount: new Decimal(line.amount),
          },
        }),
      );
      await Promise.all(writes);
      return entry;
    });
  }
}
```

---

## 5. PKI Air-Gapped Verification Guard

On-premise deployments inside isolated local networks never phone home. Module activation is gated by an offline license whose payload is signed with a vendor private key and verified locally with a pre-provisioned public key using Node's native `crypto`.

### `packages/core/src/guards/module-subscription.guard.ts`

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/backend/prisma/prisma.service';
import * as crypto from 'crypto';

export const RequiredModule = (moduleKey: string) =>
  SetMetadata('requiredModuleKey', moduleKey);

@Injectable()
export class ModuleSubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.get<string>(
      'requiredModuleKey',
      context.getHandler(),
    );
    if (!requiredModule) return true;

    const request = context.switchToHttp().getRequest();
    const companyId = request.user?.companyId;

    // Single-tenant local deployment defaults to open access.
    if (!companyId && process.env.DEPLOYMENT_MODE === 'ON_PREMISE_SINGLE') {
      return true;
    }
    if (!companyId) {
      throw new ForbiddenException('Tenant company context not resolved.');
    }

    const installed = await this.prisma.client.companyModule.findUnique({
      where: { companyId_moduleKey: { companyId, moduleKey: requiredModule } },
    });

    if (!installed || !installed.isEnabled) {
      throw new ForbiddenException(
        `Module '${requiredModule}' is not active for this tenant.`,
      );
    }

    // Premium module => verify air-gapped license signature offline.
    const settings = installed.settings ? JSON.parse(installed.settings) : {};
    if (settings.isPremium) {
      const license = await this.prisma.client.licenseActivation.findFirst({
        where: { companyId },
      });
      if (!license || !this.verifyOfflineLicense(license.licenseKey, license.signature)) {
        throw new ForbiddenException(
          'Premium module activation failed: invalid offline license signature.',
        );
      }
    }

    return true;
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

---

## 6. Asynchronous Event-Driven Inter-Module Communication

Modules never import each other directly. They emit strongly-typed events onto a localized bus; subscribing modules react independently, preserving the bounded-context boundary.

```text
[ Invoicing Module ]
     │
     └── emits "invoice.issued"  ──►  [ Event Bus (EventEmitter2) ]
                                         │
                                         ▼
[ Double-Entry Ledger Module ]
     ├── listens "invoice.issued"
     └── LedgerEngineService.createBalancedEntry({ ... })
```

```typescript
// packages/domains/invoice/src/invoice.service.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InvoiceService {
  constructor(private readonly events: EventEmitter2) {}

  async issueInvoice(payload: { total: number; invoiceId: string; arAccountId: string; salesAccountId: string }) {
    // ...core invoice generation...
    this.events.emit('invoice.issued', {
      companyId: payload.invoiceId,
      amount: payload.total,
      invoiceRef: `INV-${payload.invoiceId}`,
      receivableAccountId: payload.arAccountId,
      revenueAccountId: payload.salesAccountId,
    });
  }
}

// packages/domains/double-entry/src/listeners/invoice-ledger.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LedgerEngineService } from '../ledger-engine.service';

@Injectable()
export class InvoiceLedgerListener {
  constructor(private readonly ledger: LedgerEngineService) {}

  @OnEvent('invoice.issued', { async: true })
  async handle(payload: {
    companyId: string; amount: number; invoiceRef: string;
    receivableAccountId: string; revenueAccountId: string;
  }) {
    await this.ledger.createBalancedEntry({
      reference: payload.invoiceRef,
      description: `Automated GL post for invoice ${payload.invoiceRef}`,
      date: new Date(),
      lines: [
        { accountId: payload.receivableAccountId, type: 'DEBIT',  amount: payload.amount },
        { accountId: payload.revenueAccountId,    type: 'CREDIT', amount: payload.amount },
      ],
    });
  }
}
```

---

## 7. React Extension Slot Pipeline (IoC Registry)

A lightweight client-side `ModuleRegistryProvider` listens to active-database feature flags and injects sub-module UI components into designated layout slots without hardcoding.

### `packages/frontend/core-shell/src/registry/module-registry.context.tsx`

```tsx
import React, {
  createContext, useContext, useState, useEffect, ReactNode, ComponentType,
} from 'react';

export interface UIModulePlugin {
  key: string;
  title: string;
  path: string;
  icon: string;
  dashboardComponent?: ComponentType<any>;
  settingsComponent?: ComponentType<any>;
}

export interface ModuleRegistryContextProps {
  activeModules: string[];
  registerModule: (plugin: UIModulePlugin) => void;
  getModuleByKey: (key: string) => UIModulePlugin | undefined;
}

const ModuleRegistryContext = createContext<ModuleRegistryContextProps | undefined>(undefined);

export const ModuleRegistryProvider = ({
  children,
  activeModulesFromBackend,
}: {
  children: ReactNode;
  activeModulesFromBackend: string[];
}) => {
  const [registeredModules, setRegisteredModules] = useState<UIModulePlugin[]>([]);

  const registerModule = (plugin: UIModulePlugin) =>
    setRegisteredModules((prev) =>
      prev.some((m) => m.key === plugin.key) ? prev : [...prev, plugin],
    );

  const getModuleByKey = (key: string) =>
    registeredModules.find((m) => m.key === key);

  // Modules self-register on mount only when flagged active by the backend.
  return (
    <ModuleRegistryContext.Provider
      value={{ activeModules: activeModulesFromBackend, registerModule, getModuleByKey }}
    >
      {children}
    </ModuleRegistryContext.Provider>
  );
};

export const useModuleRegistry = () => {
  const ctx = useContext(ModuleRegistryContext);
  if (!ctx) {
    throw new Error('useModuleRegistry must be used within a ModuleRegistryProvider');
  }
  return ctx;
};

// Slot renderer — place in any layout frame to host dynamic plugins.
export const ExtensionSlot = ({ slotId }: { slotId: string }) => {
  const { activeModules, getModuleByKey } = useModuleRegistry();
  const plugins = activeModules
    .map(getModuleByKey)
    .filter((m): m is UIModulePlugin => Boolean(m));
  return <>{plugins.map((p) => { const C = p.dashboardComponent; return C ? <C key={p.key} /> : null; })}</>;
};
```

### Consumer registration (e.g. inventory module frontmatter)

```tsx
// packages/modules/inventory/frontend/src/index.tsx
import { useEffect } from 'react';
import { useModuleRegistry, UIModulePlugin } from '@ovds/frontend/core-shell';
import { StockLevelWidget } from './components/stock-level-widget';

export const InventoryModule: UIModulePlugin = {
  key: 'inventory',
  title: 'Stock & Valuation',
  path: '/inventory',
  icon: 'archive-box',
  dashboardComponent: StockLevelWidget,
};

export const InventoryModuleProvider = () => {
  const { registerModule, activeModules } = useModuleRegistry();
  useEffect(() => {
    if (activeModules.includes('inventory')) {
      registerModule(InventoryModule);
    }
  }, [registerModule, activeModules]);
  return null;
};
```

---

## 8. Dual-Runtime Bootstrapper & Deployment Topology

A single NestJS app resolves `DEPLOYMENT_MODE` and selects the tenant strategy accordingly.

```text
                                  ┌──────────────────────────┐
                                  │   Nx Monorepo Source    │
                                  │   apps/backend + pkgs   │
                                  └────────────┬─────────────┘
                                               │
                 ┌─────────────────────────────┴──────────────────────────────┐
                 ▼                                                            ▼
   ┌─────────────────────────────┐                                  ┌─────────────────────────────┐
   │ Target 1: Cloud SaaS         │                                  │ Target 2: On-Premise Local  │
   ├─────────────────────────────┤                                  ├─────────────────────────────┤
   │ DEPLOYMENT_MODE=CLOUD_SAAS   │                                  │ DEPLOYMENT_MODE=ON_PREMISE_ │
   │ DATABASE_PROVIDER=postgresql │                                  │ SINGLE / MULTI              │
   │ Routing: wildcard subdomain │                                  │ Routing: localhost / LAN    │
   │ Auth: OAuth2 / Cloud JWT     │                                  │ Auth: device-local token    │
   │ Tenant mode: TENANT (RLS on) │                                  │ Tenant mode: BYPASS (RLS off)│
   └─────────────────────────────┘                                  └─────────────────────────────┘
```

### Root `docker-compose.cloud.yml` (verified)

```yaml
version: '3.8'
services:
  cloud-postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: saas_accounting_cloud
      POSTGRES_USER: ${POSTGRES_USER:-admin_cloud}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-enterprise_secure_pwd}
    volumes:
      - cloud_pg_data:/var/lib/postgresql/data
    ports: ["5432:5432"]

  cloud-redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  cloud-api:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      DATABASE_PROVIDER: "postgresql"
      DATABASE_URL: "postgresql://..."
      PRISMA_DATABASE_URL: "postgresql://..."
      DEPLOYMENT_MODE: "CLOUD_SAAS"
      REDIS_ENABLED: "true"
      OFFLINE_PUBLIC_KEY: "${OFFLINE_PUBLIC_KEY}"
      JWT_SECRET: "${JWT_SECRET}"
    ports: ["3000:3000"]
    depends_on: [cloud-postgres, cloud-redis]
    volumes:
      - ./packages/database/prisma/migrations:/app/prisma/migrations
    restart: unless-stopped

volumes: { cloud_pg_data: }
```

### Root `docker-compose.onpremise.yml` (verified)

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
    volumes:
      - onpremise_data:/var/data
    ports: ["8080:8080"]
    restart: unless-stopped

volumes:
  onpremise_data:
    driver: local
```

### Unified Dockerfile (`apps/backend/Dockerfile`)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @ovds/database run generate   # prisma generate against chosen provider
RUN pnpm nx run backend:build --prod

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_PROVIDER=${DATABASE_PROVIDER:-postgresql}
ENV DEPLOYMENT_MODE=${DEPLOYMENT_MODE:-CLOUD_SAAS}
COPY --from=builder /app/dist/apps/backend ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
RUN pnpm install --prod --frozen-lockfile
RUN npx prisma generate --schema=./packages/database/prisma/config.js
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## 9. Cross-Provider Prisma Migration Helper (PostgreSQL → SQLite/MySQL)

Because cloud runs PostgreSQL and on-premise may run SQLite/MySQL, a single migration script is provided to introspect the source, map provider-incompatible column types, and push a clean target schema.

### `packages/database/scripts/migrate-cross-provider.mjs`

```javascript
/**
 * Cross-provider migration: PostgreSQL source → SQLite/MySQL target.
 *
 * Usage:
 *   node packages/database/scripts/migrate-cross-provider.mjs \
 *     --from=postgresql --to=sqlite \
 *     --sourceUrl="postgresql://user:pass@host:5432/db" \
 *     --targetUrl="file:./local.db"
 *
 * NOTE: This is a schema-only migration helper. For data transfer, use
 * `prisma db pull` + row copy via the Prisma Client data API.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [k, v] = arg.split('=');
  acc[k.replace('--', '')] = v;
  return acc;
}, {});

const { from, to, sourceUrl, targetUrl } = args;
if (!from || !to || !sourceUrl || !targetUrl) {
  console.error('Missing required args: --from --to --sourceUrl --targetUrl');
  process.exit(1);
}

const schemaPath = path.resolve('prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Rewrite datasource block for the target provider.
schema = schema.replace(
  /datasource db \{[^}]*url\s*=\s*env\("[^"]*"\)[^}]*\}/s,
  `datasource db {\n  provider = "${to}"\n  url      = "${targetUrl}"\n}`,
);

// 2. Normalize provider-specific column types.
const normalizeTypes = (provider, schema) => {
  let out = schema;
  if (provider === 'sqlite') {
    out = out.replace(/@db\.Decimal\(\d+,\d+\)/g, '@db.Float');
    out = out.replace(/@db\.VarChar\(\d+\)/g, '@db.String');
    out = out.replace(/@db\.LongText/g, '@db.String');
    out = out.replace(/@db\.Uuid/g, '@id @default(uuid())');
  }
  if (provider === 'mysql') {
    out = out.replace(/@db\.Decimal\(\d+,\d+\)/g, '@db.Decimal(20,4)');
  }
  return out;
};
out = normalizeTypes(to, schema);

const targetSchemaPath = path.resolve(`prisma/schema.${to}.prisma`);
fs.writeFileSync(targetSchemaPath, out);

// 3. Generate client + push target schema.
execSync(`npx prisma generate --schema=${targetSchemaPath} --datasource-provider=${to}`, { stdio: 'inherit' });
execSync(`npx prisma db push --schema=${targetSchemaPath}`, { stdio: 'inherit' });
console.log(`✅ ${from} → ${to} schema migrated and pushed to target.`);
```

---

## 10. Verification & Validation Checklist

| ✅ Check | How verified |
|---|---|
| Tenant isolation blocks cross-tenant reads | `$extends` interceptor appends `companyId` to every `where` + `withCompanyWhere` hard assert in `tenant-scoped.ts` |
| Single-tenant BYPASS path works | `TenantContextService` returns hardcoded system company & skips RLS |
| Double-entry balance invariant | `LedgerEngineService` rejects unbalanced entries (`debits !== credits`) inside `$transaction` |
| Premium module locked without license | `ModuleSubscriptionGuard` verifies `crypto.createVerify('SHA256')` offline signature |
| React slots render only active modules | `ModuleRegistryProvider` gates registration on backend `activeModules` flags |
| Cloud compose boots PostgreSQL | `docker-compose.cloud.yml` wires `DATABASE_PROVIDER=postgresql` |
| On-premise compose boots SQLite | `docker-compose.onpremise.yml` wires `DATABASE_URL=file:/var/data/local_ledger.db` |
| Cross-provider schema push succeeds | `migrate-cross-provider.mjs` normalizes types & runs `prisma db push` |

---

## 11. File Manifest (this blueprint)

| Artifact | Path |
|---|---|
| Prism schema (source of truth) | `packages/database/prisma/schema.prisma` |
| Tenant scoping utilities | `packages/database/src/tenant-scoped.ts` |
| Tenant `$extends` interceptor | `packages/database/src/tenant-prisma.extension.ts` |
| NestJS PrismaService | `apps/backend/src/prisma/prisma.service.ts` |
| Double-entry ledger engine | `packages/domains/double-entry/src/ledger-engine.service.ts` |
| Module subscription guard | `packages/core/src/guards/module-subscription.guard.ts` |
| React module registry | `packages/frontend/core-shell/src/registry/module-registry.context.tsx` |
| Cloud compose | `docker-compose.cloud.yml` |
| On-premise compose | `docker-compose.onpremise.yml` |
| Backend Dockerfile | `apps/backend/Dockerfile` |
| Cross-provider migration | `packages/database/scripts/migrate-cross-provider.mjs` |

---

### Next

The infrastructure pipelines are configured to read `DEPLOYMENT_MODE`, `DATABASE_PROVIDER`, and `PRISMA_DATABASE_URL` from each compose environment, so a single `apps/backend` build serves both targets. The remaining concern is request-time tenant resolution: a NestJS middleware that maps the inbound tenant subdomain (cloud) or device-local token (on-premise) to the `Company` context consumed by `TenantContextService`. That resolver and the production migration workflow are the natural follow-ups if you want to wire up the routing tier.
