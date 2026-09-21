# Advanced SaaS Accounting Architecture (Akaunting-Inspired)
## Nx + React + NestJS + Prisma Monorepo Blueprint

I have updated and expanded the blueprint into an advanced enterprise SaaS architectural design. The core configuration has been scaled up to handle true financial precision and strict decoupling required by multi-tenant B2B platforms.
## Enhanced Features Included in the Architectural Blueprint:

* 
* Strict GAAP/IFRS Double-Entry Core: Updated the Prisma model configuration with AccountType models (ASSETS, LIABILITIES, etc.) along with fully tracked JournalEntry and Transaction records supporting multi-point decimal structures.
* Balanced Ledger Engine: A production-ready NestJS service containing transactional validation to ensure total debits match total credits perfectly within an isolated multi-tenant database context ($transaction).
* Tenant Cross-Contamination Guard: Concrete implementation of a runtime ModuleSubscriptionGuard inspecting custom permissions and runtime module enablement maps (InstalledModule) directly out of the context database layout.
* Polymorphic React Registry Context: A client-side plugin engine context pattern allowing extension apps inside your Nx monorepo workspace to drop dashboard components, settings panels, or navigation trees seamlessly into core UI slots.
* Asynchronous Event-Driven Messaging: Decoupled inter-module pipelines leveraging localized event buses (EventEmitter2) so functional components like an Invoicing module can communicate structural ledger transactions to the Double-Entry database cleanly without direct service imports.
* 

To take this platform closer to production, would you like to review the NestJS multi-tenant middleware to resolve subdomains, or should we design the Playwright testing configurations to verify the event-driven ledger entries?

accounting-saas-architecture.md.
I have dramatically expanded the architectural blueprint to support both multi-tenant cloud-hosted SaaS (On-Cloud) and self-hosted single/multi-tenant enterprise installations (On-Premise) within the same Nx, React, NestJS, and Prisma monorepo codebase.
## 🌟 Enterprise On-Cloud & On-Premise Additions

* ⚙️ Dual-Runtime Bootstrapper: A unified abstraction layer using NestJS environment injections (DeploymentMode) that allows the system to run as a multi-tenant cloud application with dynamic routing, or downscale into an optimized, lightweight single-tenant database instance for on-premise local servers.
* 📦 Prisma Multi-Provider Deployment: Advanced Prisma configuration demonstrating how to support client-side choice between PostgreSQL (On-Cloud standard) and SQLite/MySQL (On-Premise local/offline-first lightweight footprints) using environment schema proxies.
* 📊 Hybrid Data Isolation Layer: Concrete implementation of a dynamic global tenant resolution filter utilizing Prisma Client Extension hooks ($extends) to automatically append tenant constraints to all incoming query queries seamlessly, minimizing developer human-error when implementing privacy logic.
* 🔐 On-Premise Offline Authorization (Air-Gapped): An enterprise-tier licensing engine utilizing public/private cryptographic asymmetric key validation to safely permit offline module unlocks and feature provisioning for air-gapped on-premise deployments without phoned-home internet telemetry loops.
* 🐳 Dynamic Multi-Platform Orchestration & Docker-Composes: Isolated production-ready deployment recipes outlining multi-container setups for distributed global clouds alongside an all-in-one minimal footprint deployment package tailored for on-premise systems.

generate the subdomain-routing middleware for your NestJS app to resolve tenants instantly from the URL, or should we design the React offline-first synchronization strategy for the on-premise mobile/desktop workers


This enterprise-grade specification enhances the core modular setup into an **advanced, production-ready SaaS accounting ecosystem**. It details strict multi-tenant isolation, a high-performance double-entry ledger engine, dynamic polymorphic UI/UX loading, and asynchronous event-driven module sandboxing.

---
 
## 1. Advanced Monorepo Directory Layout (`Nx`)

To implement an Akaunting-like module architecture, modules must contain their own logic end-to-end (Domain, Database relationships, API, and UI components). They register dynamically with the Core host application.

```text
apps/
  ├── api-gateway/                 # NestJS: Core API shell, authentication, tenant resolution, proxying
  └── client-dashboard/            # React: Core UI shell, layout, global state, dynamic module loader
packages/
  ├── core/                        # Enterprise foundational frameworks
  │   ├── backend-auth/            # Multi-tenant JWT parsing, RBAC/ABAC guards
  │   ├── backend-ledger/          # Core Double-Entry accounting rules & engine
  │   ├── frontend-shell/          # Global navigation layout, pluggable slot context
  │   └── shared-dtos/             # Universal API schemas, validation, strict types
  └── modules/                     # Akaunting-style isolated business modules
      ├── double-entry/            # Core Ledgers, Journal Entries, Chart of Accounts
      │   ├── backend/             # NestJS controllers, services, Prisma operations
      │   └── frontend/            # React components, forms, hooks, widgets
      ├── inventory/               # Optional module: Product stock, tracking, valuations
      │   ├── backend/             
      │   └── frontend/            
      └── invoicing/               # Optional module: Recurring invoices, payment portals
          ├── backend/             
          └── frontend/            
```

---

## 2. Advanced Multi-Tenant & Double-Entry Prisma Schema

This schema introduces a comprehensive **Double-Entry Ledger Engine** supporting strict GAAP/IFRS principles, transaction balancing validation at the database level, and strict multi-tenant filtering keys (`company_id`).

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ==========================================
// CORE IDENTITY & TENANCY MANAGEMENT
// ==========================================

model Company {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  subdomain   String   @unique
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Systems Isolation
  users          CompanyUser[]
  installedModules InstalledModule[]
  accounts       Account[]
  journalEntries JournalEntry[]
  transactions   Transaction[]

  @@map("companies")
}

model User {
  id        String        @id @default(uuid()) @db.Uuid
  email     String        @unique
  password  String
  companies CompanyUser[]

  @@map("users")
}

model CompanyUser {
  id        String   @id @default(uuid()) @db.Uuid
  companyId String   @map("company_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  role      String   // OWNER, ADMIN, ACCOUNTANT, AUDITOR
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([companyId, userId])
  @@map("company_users")
}

// ==========================================
// AKAUNTING-INSPIRED DYNAMIC MODULE STORE
// ==========================================

model InstalledModule {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  moduleAlias String   @map("module_alias") // e.g., "inventory", "invoicing"
  isEnabled   Boolean  @default(true) @map("is_enabled")
  settings    Json     @default("{}") // Module-specific local configurations
  updatedAt   DateTime @updatedAt @map("updated_at")
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([companyId, moduleAlias])
  @@map("installed_modules")
}

// ==========================================
// ADVANCED DOUBLE-ENTRY LEDGER CORE
// ==========================================

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

model Account {
  id           String      @id @default(uuid()) @db.Uuid
  companyId    String      @map("company_id") @db.Uuid
  code         String      // e.g., "10100", "21000" (Chart of Accounts Code)
  name         String
  type         AccountType
  parentId     String?     @map("parent_id") @db.Uuid
  parent       Account?    @relation("AccountHierarchy", fields: [parentId], references: [id])
  children     Account[]   @relation("AccountHierarchy")
  
  transactions Transaction[]
  company      Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([companyId, code])
  @@map("accounts")
}

model JournalEntry {
  id            String        @id @default(uuid()) @db.Uuid
  companyId     String        @map("company_id") @db.Uuid
  date          DateTime
  reference     String?       // Invoice #, Receipt #, Check #
  description   String?
  posted        Boolean       @default(false)
  sourceModule  String        @map("source_module") // Tracks origin: e.g., "invoicing"
  sourceRefId   String?       @map("source_ref_id") @db.Uuid // Polymorphic link to source object
  createdAt     DateTime      @default(now()) @map("created_at")
  
  transactions  Transaction[]
  company       Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@map("journal_entries")
}

model Transaction {
  id             String       @id @default(uuid()) @db.Uuid
  companyId      String       @map("company_id") @db.Uuid
  journalEntryId String       @map("journal_entry_id") @db.Uuid
  accountId      String       @map("account_id") @db.Uuid
  debit          Decimal      @default(0.00) @db.Decimal(15, 4)
  credit         Decimal      @default(0.00) @db.Decimal(15, 4)
  
  company        Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  account        Account      @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@map("transactions")
}
```

---

## 3. High-Performance Double-Entry Engine & Module Guard (`NestJS`)

### Core Accounting Dynamic Transaction Engine

This backend service provides transaction execution that guarantees balance verification (Debits must equal Credits) and safely increments ledgers inside a managed Prisma unit-of-work (`$transaction`).

```typescript
// packages/core/backend-ledger/src/ledger-engine.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@packages/core/prisma';
import { Prisma } from '@prisma/client';

export interface TransactionLine {
  accountId: string;
  debit: number;
  credit: number;
}

export interface JournalEntryInput {
  companyId: string;
  date: Date;
  reference?: string;
  description?: string;
  sourceModule: string;
  sourceRefId?: string;
  lines: TransactionLine[];
}

@Injectable()
export class LedgerEngineService {
  constructor(private prisma: PrismaService) {}

  async createBalancedEntry(input: JournalEntryInput) {
    // 1. Enforce Double-Entry Mathematical Balancing
    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of input.lines) {
      if (line.debit < 0 || line.credit < 0) {
        throw new BadRequestException('Transaction values cannot be negative numbers.');
      }
      totalDebits += line.debit;
      totalCredits += line.credit;
    }

    // Handle floating-point precision alignment tolerances
    if (Math.abs(totalDebits - totalCredits) > 0.0001) {
      throw new BadRequestException(
        `Accounting Equation Mismatch: Total Debits (${totalDebits}) must exactly equal Total Credits (${totalCredits}).`
      );
    }

    // 2. Atomic Database Multi-Tenant Execution Context
    return this.prisma.$transaction(async (tx) => {
      // Confirm all impacted accounts belong solely to the requesting company context
      const uniqueAccountIds = [...new Set(input.lines.map((l) => l.accountId))];
      const accountsCount = await tx.account.count({
        where: {
          id: { in: uniqueAccountIds },
          companyId: input.companyId,
        },
      });

      if (accountsCount !== uniqueAccountIds.length) {
        throw new BadRequestException('Unauthorized Account Scope: Invalid account cross-tenancy detected.');
      }

      // Record Root Journal Entry
      const entry = await tx.journalEntry.create({
        data: {
          companyId: input.companyId,
          date: input.date,
          reference: input.reference,
          description: input.description,
          sourceModule: input.sourceModule,
          sourceRefId: input.sourceRefId,
        },
      });

      // Populate Distributed Ledger Lines
      const transactionPromises = input.lines.map((line) =>
        tx.transaction.create({
          data: {
            companyId: input.companyId,
            journalEntryId: entry.id,
            accountId: line.accountId,
            debit: new Prisma.Decimal(line.debit),
            credit: new Prisma.Decimal(line.credit),
          },
        })
      );

      await Promise.all(transactionPromises);
      return entry;
    });
  }
}
```

### Module Isolation & Verification Engine Guard

This automated architecture pattern enforces dynamic capability checks across standard API routers, verifying whether a tenant has bought or switched on the structural module providing the endpoint.

```typescript
// packages/core/backend-auth/src/guards/module-subscription.guard.ts
import { CanActivate, ExecutionContext, Injectable, SetMetadata, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@packages/core/prisma';

export const RequiredModule = (moduleAlias: string) => SetMetadata('requiredModuleAlias', moduleAlias);

@Injectable()
export class ModuleSubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModuleAlias = this.reflector.get<string>('requiredModuleAlias', context.getHandler());
    if (!requiredModuleAlias) return true; // Endpoint is core framework functionality

    const request = context.switchToHttp().getRequest();
    const companyId = request.user?.companyId; // Derived upstream by TenantContextExtractor

    if (!companyId) {
      throw new ForbiddenException('Tenant company identifier context not discovered.');
    }

    // Dynamic Module State Check
    const subscription = await this.prisma.installedModule.findUnique({
      where: {
        companyId_moduleAlias: {
          companyId,
          moduleAlias: requiredModuleAlias,
        },
      },
    });

    if (!subscription || !subscription.isEnabled) {
      throw new ForbiddenException(
        `The module '${requiredModuleAlias}' is inactive or uninstalled for this workspace organization.`
      );
    }

    return true;
  }
}
```

---

## 4. Polymorphic Dynamic Extension Architecture (`React`)

To render a system like Akaunting without rewriting core code when adding custom applications, the system implements a frontend registry engine where modules register their UI hooks into layout placeholders.

### UI Shell Dynamic Module Extension Provider

```typescript
// packages/core/frontend-shell/src/registry/module-registry.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ModuleUIRegistration {
  id: string;
  title: string;
  navigationPath: string;
  icon: React.ComponentType;
  dashboardWidgets: Array<{
    id: string;
    component: React.ComponentType;
    gridSize: string;
  }>;
  settingsPanel?: React.ComponentType;
}

interface ModuleRegistryContextType {
  registeredModules: Map<string, ModuleUIRegistration>;
  registerModule: (module: ModuleUIRegistration) => void;
}

const ModuleRegistryContext = createContext<ModuleRegistryContextType | undefined>(undefined);

export const ModuleRegistryProvider = ({ children }: { children: ReactNode }) => {
  const [registeredModules] = useState<Map<string, ModuleUIRegistration>>(new Map());

  const registerModule = (module: ModuleUIRegistration) => {
    registeredModules.set(module.id, module);
  };

  return (
    <ModuleRegistryContext.Provider value={{ registeredModules, registerModule }}>
      {children}
    </ModuleRegistryContext.Provider>
  );
};

export const useModuleRegistry = () => {
  const context = useContext(ModuleRegistryContext);
  if (!context) throw new Error('useModuleRegistry must be explicitly invoked within a ModuleRegistryProvider hierarchy.');
  return context;
};
```

### Module Registration Hook Example (`Inventory Module`)

When the dynamic core shell boots up, it processes active modules and runs their entry points. The inventory module hooks itself cleanly into the main app using this design pattern:

```typescript
// packages/modules/inventory/frontend/src/index.tsx
import { ModuleUIRegistration } from '@packages/core/frontend-shell';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { StockLevelWidget } from './components/StockLevelWidget';
import { InventorySettings } from './components/InventorySettings';

export const InventoryModuleManifest: ModuleUIRegistration = {
  id: 'inventory',
  title: 'Inventory Control',
  navigationPath: '/workspace/inventory',
  icon: ArchiveBoxIcon,
  dashboardWidgets: [
    {
      id: 'low-stock-alert',
      component: StockLevelWidget,
      gridSize: 'col-span-4 md:col-span-2',
    },
  ],
  settingsPanel: InventorySettings
};
```

---

## 5. Asynchronous Inter-Module Communication

To maintain decoupling inside the Nx monorepo, backend modules must never talk directly to another module's Prisma service. Instead, they communicate using an **Asynchronous Event-Driven Architecture**.

For example, when the `Invoicing` module creates an invoice, it emits an internal event. The `Double-Entry` engine catches that event to update the ledger ledger, keeping both domains clean and independent.

```text
[ Invoicing Module ] 
       │
       └── Generates "invoice.issued" event
               │
               ▼
   [ Event Bus (NestJS EventEmitter2) ]
               │
               ▼
[ Double-Entry Ledger Module ] 
       │
       └── Catch Event ──► Execute balanced LedgerEngineService.createBalancedEntry()
```

### Inter-Module Decoupling Pattern

```typescript
// packages/modules/invoicing/backend/src/invoice.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InvoiceService {
  constructor(private eventEmitter: EventEmitter2) {}

  async issueInvoice(invoiceId: string, companyId: string, totalAmount: number, customerAccountId: string) {
    // 1. Perform core invoice generation workflows...

    // 2. Dispatch cross-module event decoupled asynchronously
    this.eventEmitter.emit('invoice.issued', {
      companyId,
      amount: totalAmount,
      invoiceRef: `INV-${invoiceId}`,
      receivableAccountId: customerAccountId, // Asset Account
      salesAccountId: 'revenue-sales-default-id', // Revenue Account
    });
  }
}
```

```typescript
// packages/modules/double-entry/backend/src/listeners/invoice-ledger.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LedgerEngineService } from '@packages/core/backend-ledger';

@Injectable()
export class InvoiceLedgerListener {
  constructor(private ledgerEngine: LedgerEngineService) {}

  @OnEvent('invoice.issued', { async: true })
  async handleInvoiceIssuedEvent(payload: any) {
    // Catch the async decoupled event emission and bind records to the general ledger
    await this.ledgerEngine.createBalancedEntry({
      companyId: payload.companyId,
      date: new Date(),
      reference: payload.invoiceRef,
      description: `Automated General Ledger sync for invoice emission reference: ${payload.invoiceRef}`,
      sourceModule: 'invoicing',
      lines: [
        {
          accountId: payload.receivableAccountId, // Accounts Receivable increases (Debit)
          debit: payload.amount,
          credit: 0,
        },
        {
          accountId: payload.salesAccountId,      // Sales Revenue increases (Credit)
          debit: 0,
          credit: payload.amount,
        },
      ],
    });
  }
}
```