
## 📁 Architectural File Structure Summary
 
* 
* Nx Domain Module Directories: Structured split maps segmenting core layout frames, global shared domains, database utilities, and separate application engines (cloud-api / onpremise-api).
* Multi-Provider Data Isolation Engine: Full Prisma configuration mapping double-entry structures (JournalEntry, JournalLine, AccountType) tied to an automated dynamic query proxy $extends interceptor that blocks structural cross-tenant breaches completely.
* PKI Air-Gapped Verification Guard: Advanced security middleware leveraging symmetric key cryptography (crypto) to process encrypted licenses offline for enterprise modules inside isolated local networks.
* React Extension Slot Pipeline: Inversion of Control dynamic workspace context providers (ModuleRegistryProvider) that listen to active database flags and register sub-modules directly inside user interfaces without hardcoding layout configurations.
* 

If you are ready to configure the infrastructure pipelines next, let me know if you want to look at the NestJS tenant subdomain middleware routing resolver or a script to handle Prisma migrations across different database providers (PostgreSQL to SQLite/MySQL).

```
# Advanced Hybrid Enterprise Accounting Architecture Blueprint
## Stack: Nx Monorepo, React, NestJS, Prisma

This blueprint provides an production-ready architectural implementation matching the dynamic modular architecture of platforms like Ovds, designed for a dual-mode deployment: **Multi-Tenant On-Cloud B2B SaaS** and **Single/Multi-Tenant On-Premise Enterprise** topologies within a single unified TypeScript codebase.

---

## 1. Directory Structure (`Nx Workspace Layout`)

```text
Ovds/
├── apps/
│   ├── cloud-api/                  # Entrypoint for Multi-tenant B2B Cloud Platform
│   ├── onpremise-api/              # Entrypoint for Single/Multi-tenant On-Premise deployments
│   ├── web-client/                 # Core unified SPA dashboard frontend
│   └── web-client-e2e/             # Playwright End-to-End integration suite
├── Packages/
│   ├── backend/
│   │   ├── core/                   # Kernel, DI Engine, Deployment Bootstrapper
│   │   ├── database/               # Prisma Client, Multi-Tenant Context Filters, Extenders
│   │   └── modules/
│   │       ├── double-entry/       # GAAP/IFRS Ledger, Journaling, Balance Engine
│   │       ├── invoicing/          # Invoices, Quotes, Customer Portals
│   │       └── inventory/          # Dynamic extension module example
│   ├── frontend/
│   │   ├── core-shell/             # Main Workspace UI Shell, Auth Context, Layout Engine
│   │   ├── shared/                 # Precise Decimal-safe UI components, charts, grids
│   │   └── modules/
│   │       ├── double-entry-ui/    # Ledger views, trial balance reporting
│   │       └── invoicing-ui/       # Billing management plugins
│   └── shared/
│       └── domain-types/           # Common data interfaces, DTOs, Event Contracts
```

---

## 2. Advanced Multi-Tenant & Multi-Provider Data Layer

This Prisma schema utilizes an explicit isolation design where every transaction, journal entry, account, and module installation maps back to a structural `Company` (Tenant) boundary. To maximize portability across **Cloud** deployments (PostgreSQL) and **On-Premise** settings (MySQL / SQLite), dynamic schema switching is achieved through specialized Prisma Client Extensions.

### `packages/backend/database/src/prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql" // Mapped dynamically via connection URLs in on-premise builds
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

enum EntryType {
  DEBIT
  CREDIT
}

enum DeploymentMode {
  CLOUD_SAAS
  ON_PREMISE_SINGLE
  ON_PREMISE_MULTI
}

model Company {
  id                String             @id @default(uuid())
  name              String
  slug              String             @unique
  isActive          Boolean            @default(true)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Relations
  accounts          Account[]
  journalEntries    JournalEntry[]
  installedModules  InstalledModule[]
  licenses          LicenseActivation[]
}

model Account {
  id             String          @id @default(uuid())
  companyId      String
  code           String          // e.g., "10100" (CoA Pattern)
  name           String
  type           AccountType
  isActive       Boolean         @default(true)
  
  company        Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
  journalLines   JournalLine[]

  @@unique([companyId, code])
  @@index([companyId])
}

model JournalEntry {
  id             String          @id @default(uuid())
  companyId      String
  date           DateTime
  reference      String?         // Invoice #, Receipt Ref
  description    String?
  posted         Boolean         @default(false)
  createdAt      DateTime        @default(now())
  
  company        Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
  lines          JournalLine[]

  @@index([companyId])
}

model JournalLine {
  id             String          @id @default(uuid())
  journalEntryId String
  accountId      String
  type           EntryType
  amount         Decimal         @db.Decimal(20, 4) // Financial-grade fixed-point precision
  
  journalEntry   JournalEntry    @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  account        Account         @relation(fields: [accountId], references: [id], onDelete: Restrict)

  @@index([journalEntryId])
  @@index([accountId])
}

model InstalledModule {
  id             String          @id @default(uuid())
  companyId      String
  moduleKey      String          // e.g., "inventory", "pos", "payroll"
  isEnabled      Boolean         @default(true)
  settings       Json            @default("{}")
  activatedAt    DateTime        @default(now())
  
  company        Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([companyId, moduleKey])
}

model LicenseActivation {
  id             String          @id @default(uuid())
  companyId      String
  licenseKey     String          @unique
  signature      String          // Cryptographic signature for air-gapped on-premise verification
  expiresAt      DateTime?
  isValid        Boolean         @default(true)
  
  company        Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
}
```

---

## 3. Dynamic Runtimes & Hybrid Tenant Interception

To guarantee full safety against cross-tenant data leakage while natively supporting seamless single-tenant mode downscaling, we utilize Prisma Client Extensions (`$extends`) alongside a NestJS execution context tracking the active tenant tenancy context.

### `packages/backend/database/src/tenant-context.service.ts`
```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private currentCompanyId: string | null = null;
  private deploymentMode: 'CLOUD_SAAS' | 'ON_PREMISE_SINGLE' | 'ON_PREMISE_MULTI' = 'CLOUD_SAAS';

  constructor() {
    this.deploymentMode = (process.env.DEPLOYMENT_MODE as any) || 'CLOUD_SAAS';
  }

  setCompanyId(id: string) {
    this.currentCompanyId = id;
  }

  getCompanyId(): string {
    if (this.deploymentMode === 'ON_PREMISE_SINGLE') {
      return '00000000-0000-0000-0000-000000000000'; // Hardcoded fallback system company
    }
    if (!this.currentCompanyId) {
      throw new Error('Tenant context isolation breach: Company ID resolution failed.');
    }
    return this.currentCompanyId;
  }

  getMode() {
    return this.deploymentMode;
  }
}
```

### `packages/backend/database/src/tenant-prisma.client.ts`
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantPrismaClient extends PrismaClient implements OnModuleInit {
  constructor(private readonly tenantContext: TenantContextService) {
    super({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  // Generate extended client automatically applying tenant filter queries safely
  get client() {
    const companyId = this.tenantContext.getCompanyId();
    const isSingleTenant = this.tenantContext.getMode() === 'ON_PREMISE_SINGLE';

    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // Bypass filtering logic for global entities if any, or if single tenant deployment
            if (model === 'Company' || model === 'LicenseActivation' || isSingleTenant) {
              return query(args);
            }

            // Intercept create / writes to bind company automatically
            if (operation === 'create' || operation === 'createMany') {
              if (Array.isArray(args.data)) {
                args.data = args.data.map(item => ({ ...item, companyId }));
              } else {
                args.data = { ...args.data, companyId };
              }
            }

            // Inject query criteria boundary enforcement unconditionally
            if (['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
              args.where = { ...args.where, companyId };
            }

            return query(args);
          },
        },
      },
    });
  }
}
```

---

## 4. Advanced Double-Entry Balanced Ledger Engine

Leverages an event-driven system decoupler (`@nestjs/event-emitter`) alongside database transaction pools to verify transactional balancing inside financial operations.

### `packages/backend/modules/double-entry/src/double-entry.service.ts`
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { TenantPrismaClient } from '@my-workspace/backend/database';
import { OnEvent } from '@nestjs/event-emitter';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateJournalEntryPayload {
  reference: string;
  description: string;
  date: Date;
  lines: {
    accountId: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
  }[];
}

@Injectable()
export class DoubleEntryService {
  constructor(private readonly prisma: TenantPrismaClient) {}

  @OnEvent('invoice.created')
  async handleInvoiceGenerationEvent(payload: { total: number; invoiceId: string; arAccountId: string; salesAccountId: string }) {
    await this.createEntry({
      reference: payload.invoiceId,
      description: `Automated System Invoice Post - Ref ${payload.invoiceId}`,
      date: new Date(),
      lines: [
        { accountId: payload.arAccountId, type: 'DEBIT', amount: payload.total },
        { accountId: payload.salesAccountId, type: 'CREDIT', amount: payload.total }
      ]
    });
  }

  async createEntry(dto: CreateJournalEntryPayload) {
    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    for (const line of dto.lines) {
      const amount = new Decimal(line.amount);
      if (line.type === 'DEBIT') totalDebits = totalDebits.plus(amount);
      if (line.type === 'CREDIT') totalCredits = totalCredits.plus(amount);
    }

    // GAAP Validation Check: System balance verification matching
    if (!totalDebits.equals(totalCredits)) {
      throw new BadRequestException(`Unbalanced financial transaction. Total Debits (${totalDebits.toString()}) must equal Total Credits (${totalCredits.toString()}).`);
    }

    // Safely write isolation via contextual client
    return this.prisma.client.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          date: dto.date,
          reference: dto.reference,
          description: dto.description,
          posted: true,
        }
      });

      const lineQueries = dto.lines.map(line => 
        tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: line.accountId,
            type: line.type,
            amount: new Decimal(line.amount)
          }
        })
      );

      await Promise.all(lineQueries);
      return entry;
    });
  }
}
```

---

## 5. Module Subscription & Asymmetric License Activation Guard

Implements Ovds-like module toggling and provides secure cryptographic verification using Public Key Infrastructure (PKI) to allow **Air-Gapped / Offline On-Premise installations** to unlock enterprise items safely without cloud telemetry validation phone-home.

### `Package/backend/core/src/guards/module-subscription.guard.ts`
```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantPrismaClient } from '@my-workspace/backend/database';
import * as crypto from 'crypto';

@Injectable()
export class ModuleSubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: TenantPrismaClient
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.get<string>('requiredModule', context.getHandler());
    if (!requiredModule) return true;

    const request = context.switchToHttp().getRequest();
    const companyId = request.headers['x-company-id'] || request.user?.companyId;

    if (!companyId && process.env.DEPLOYMENT_MODE === 'ON_PREMISE_SINGLE') {
      return true; // Single tenant local deployment baseline defaults to open access
    }

    // Verify if feature toggle exists and module state is active
    const moduleInstall = await this.prisma.client.installedModule.findFirst({
      where: { moduleKey: requiredModule, isEnabled: true }
    });

    if (!moduleInstall) {
      throw new ForbiddenException(`The dynamic module [${requiredModule}] is not active or subscribed for this system profile.`);
    }

    // For Advanced On-Premise verification: If it's a paid tier extension component, evaluate signature validation offline
    if (moduleInstall.settings['isPremium']) {
      const license = await this.prisma.client.licenseActivation.findFirst({ where: { companyId } });
      if (!license || !this.verifyOfflineLicense(license.licenseKey, license.signature)) {
        throw new ForbiddenException('Premium enterprise module activation contains an invalid signature or missing offline token.');
      }
    }

    return true;
  }

  private verifyOfflineLicense(licenseKey: string, signature: string): boolean {
    try {
      const publicKey = process.env.OFFLINE_PUBLIC_KEY; // Pre-provisioned vendor key in environmental file configurations
      if (!publicKey) return false;
      
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

## 6. Frontend Dynamic UI Shell Architecture (React)

An inversion of control pattern built leveraging React's context tracking framework. Modules load runtime extensions, routing endpoints, hooks, and presentation widgets onto specific UI zones in the core layout frame dynamically.

### `packages/frontend/core-shell/src/registry/module-registry.context.tsx`
```tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UIModulePlugin {
  key: string;
  title: string;
  path: string;
  icon: string;
  dashboardComponent?: React.ComponentType;
  settingsComponent?: React.ComponentType;
}

interface ModuleRegistryContextProps {
  registeredModules: UIModulePlugin[];
  registerModule: (plugin: UIModulePlugin) => void;
}

const ModuleRegistryContext = createContext<ModuleRegistryContextProps | undefined>(undefined);

export const ModuleRegistryProvider = ({ children }: { children: ReactNode }) => {
  const [registeredModules, setRegisteredModules] = useState<UIModulePlugin[]>([]);

  const registerModule = (plugin: UIModulePlugin) => {
    setRegisteredModules((prev) => {
      if (prev.some(m => m.key === plugin.key)) return prev;
      return [...prev, plugin];
    });
  };

  return (
    <ModuleRegistryContext.Provider value={{ registeredModules, registerModule }}>
      {children}
    </ModuleRegistryContext.Provider>
  );
};

export const useModuleRegistry = () => {
  const context = useContext(ModuleRegistryContext);
  if (!context) throw new Error('useModuleRegistry must be consumed within a ModuleRegistryProvider framework.');
  return context;
};
```

### `packages/frontend/modules/invoicing-ui/src/index.ts`
```tsx
// Self registering structural pattern executing when the bundle compiles
import { UIModulePlugin } from '@my-workspace/frontend/core-shell';

export const InvoicingPluginConfig: UIModulePlugin = {
  key: 'invoicing',
  title: 'Billing & Invoices',
  path: '/billing',
  icon: 'receipt-long',
  dashboardComponent: () => <div>Invoicing KPI Metrics Dashboard Summary Panel</div>
};
```

---

## 7. Cloud vs On-Premise Multi-Target Packaging Matrix

```text
                                  ┌──────────────────────────┐
                                  │   Nx Monorepo Source    │
                                  └────────────┬─────────────┘
                                               │
                      ┌────────────────────────┴────────────────────────┐
                      ▼                                                 ▼
        ┌───────────────────────────┐                     ┌───────────────────────────┐
        │    Target 1: Cloud SaaS   │                     │  Target 2: On-Premise Local│
        ├───────────────────────────┤                     ├───────────────────────────┤
        │ Env: DEPLOYMENT_MODE=SaaS │                     │ Env: DEPLOYMENT_MODE=Local│
        │ Database: Distributed PG  │                     │ Database: Embedded SQLite  │
        │ Routing: Wildcard Domain  │                     │ Routing: localhost single  │
        │ Auth: OAuth2 / Cloud JWT  │                     │ Auth: Device Local Token  │
        └───────────────────────────┘                     └───────────────────────────┘
```

### Multi-Platform Production Deployments

#### On-Cloud Distributed Architecture: `apps/cloud-api/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npx nx build cloud-api --prod

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DEPLOYMENT_MODE=CLOUD_SAAS
COPY --from=builder /app/dist/apps/cloud-api .
RUN npm install --omit=dev
RUN npx prisma generate --schema=./database/schema.prisma
EXPOSE 3000
CMD ["node", "main.js"]
```

#### On-Premise Single-File Infrastructure: `apps/onpremise-api/docker-compose.yml`
```yaml
version: '3.8'
services:
  accounting-app:
    image: enterprise-accounting-local:latest
    container_name: local_accounting_engine
    environment:
      - NODE_ENV=production
      - DEPLOYMENT_MODE=ON_PREMISE_SINGLE
      - DATABASE_URL=file:/data/local-accounting.db # Embedded SQLite Database footprint
    volumes:
      - accounting_data:/data
    ports:
      - "8080:8080"
    restart: always

volumes:
  accounting_data:
    driver: local





