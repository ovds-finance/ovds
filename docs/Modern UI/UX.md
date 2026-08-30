<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# OVDS Modern UX & Enterprise Architecture Blueprint

> **Platform:** Online VAT Declaration System (OVDS)  
> **Brand:** Unified, premium, hyper-modern, intelligent financial platform  
> **Stack:** Nx 23 · React 19 + Vite 6 · NestJS 11 · Prisma 7 · Tailwind CSS 3.4  
> **Deployment:** Hybrid — Cloud SaaS (multi-tenant) **and** On-Premise (air-gapped) from one codebase  
> **Compliance:** Ethiopian MoR / ERCA / AABE · IFRS (AABE Proclamation 847/2014) · Multi-jurisdiction

---

## Table of Contents

| # | Section | Title |
|---|---------|-------|
| 1 | [Executive Summary](#1-executive-summary) | Overview & vision |
| 2 | [UI/UX Transformation](#2-uiux-transformation-the-akaunting-facelift) | Akaunting-inspired design overhaul |
| 3 | [Enterprise UX Principles](#3-enterprise-ux-principles-dense-powerful-beautiful) | Consumer vs. enterprise, golden rules |
| 4 | [Nx Monorepo Code Organization](#4-nx-monorepo-code-organization) | Repository layout & package contracts |
| 5 | [Accounting Logic Engine](#5-accounting-logic-engine-double-entry-with-prisma) | Double-entry Prisma schema & invariants |
| 6 | [NestJS Smart Accounting Services](#6-nestjs-smart-accounting-services) | Auto-journaling, tax calculation |
| 7 | [Multi-Entity & Multi-Currency Hierarchy](#7-multi-entity--multi-currency-hierarchy) | Company hierarchy, FX conversion |
| 8 | [Ethiopian Compliance Engine](#8-ethiopian-compliance-engine-mor--erca--aabe) | MoR/ERCA/AABE adapters & e-Tax XML |
| 9 | [Offline-First & Resilience Architecture](#9-offline-first--resilience-architecture) | SQLite sync, queue reconciliation |
| 10 | [Akaunting-Inspired Interactions](#10-akaunting-inspired-interactions) | Dashboard slider, inline math, command palette |
| 11 | [Hybrid Deployment Engine](#11-hybrid-deployment-engine) | Cloud SaaS + on-premise from one codebase |
| 12 | [Integration Layer](#12-integration-layer-api-gateway-events--iot) | API gateway, event broker, IoT ingestion |
| 13 | [Identity, Access & Control Center](#13-identity-access--control-center) | RBAC, SSO, MFA, audit logs |
| 14 | [Prisma Schema Enterprise Extensions](#14-prisma-schema-enterprise-extensions) | Audit logs, feature entitlements, sync queue |
| 15 | [Transitioning to a Smart Platform](#15-transitioning-to-a-smart-platform) | Client portal, background automations |
| 16 | [Performance & Scalability Targets](#16-performance--scalability-targets) | Latency, throughput, concurrency goals |
| 17 | [Implementation Summary](#17-implementation-summary) | Status matrix across all areas |
| 18 | [Developer Workflow](#18-developer-workflow) | Commands for install, serve, test, build |
| 19 | [References](#19-references) | Akaunting, MoR, IFRS, Peachtree |
| 20 | [Frontend Architecture & Page Shell](#20-frontend-architecture--page-shell) | React SPA routing, layout, shell |
| 21 | [State Management & Data Flow](#21-state-management--data-flow) | TanStack Query, context, optimistic updates |
| 22 | [API & oRPC Client Layer](#22-api--orpc-client-layer) | Type-safe API consumption |
| 23 | [Testing Strategy & Quality Assurance](#23-testing-strategy--quality-assurance) | Unit, integration, E2E testing |
| 24 | [CI/CD Pipeline & Deployment](#24-cicd-pipeline--deployment) | GitHub Actions, canary, rollback |
| 25 | [Monitoring & Observability](#25-monitoring--observability) | Error tracking, performance, analytics |
| 26 | [Developer Onboarding & Documentation](#26-developer-onboarding--documentation) | Getting started, standards, design tokens |
| 27 | [packages/ui Component Taxonomy](#27-packages-ui-component-taxonomy) | 5-tier component system, design tokens |
| 28 | [Modern UX Patterns & Interaction Design](#28-modern-ux-patterns--interaction-design) | Mobile, motion, onboarding, notifications, AI UX |
| 29 | [Summary](#29-summary) | Closing the blueprint |
| 30 | [AI-Powered Platform Features & Modern UX](#30-ai-powered-platform-features--modern-ux) | Core architecture, data extraction, automation, AP, analytics, support |

---

## 1. Executive Summary

OVDS is a production-ready, offline-first accounting and tax declaration platform engineered for the Ethiopian market and extended for multinational enterprise operations. It reconciles three competing financial logic engines under a single canonical ledger:

- **Peachtree / US GAAP** — strict double-entry discipline favored by local accountants.  
- **SIGTAX / e-Tax** — Ministry of Revenues (MoR / ERCA) regulatory platform with specific XML schemas and filing frequencies.  
- **IFRS (AABE)** — fair presentation, revenue recognition (IFRS 15), leases (IFRS 16), and consolidated financial statements.

The platform ships as **one codebase** with **two deployment topologies**. The deployment mode is selected at install time and does not change application code. Users choose between a hosted cloud service or a fully self-hosted installation.

---

## 2. UI/UX Transformation: The "Akaunting" Facelift

### 2.1 Design Philosophy

Akaunting 3.2.1 UI/UX principles prioritize **breathing room**, **clear context**, and **minimalist data tables**. The current OVDS interface has an overwhelming sidebar, a raw localhost aesthetic, and an intrusive onboarding block. The transformation replaces these with:

- **Top-level, high-utility widgets** on the Dashboard (e.g., Customer Summary Card with Paid / Open / Overdue totals).  
- **Dashboard Slider** to glide between overall corporate, branch-specific, or tax-focused insights.  
- **Smart inline math** on invoice lines (e.g., typing `2*3` or `120+15` auto-calculates on blur).  
- **Command Palette** (`Ctrl+K`) for global search and actions.  
- **11 core functional verticals** matching Akaunting's taxonomy.

### 2.2 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ (S) Search & Command Palette  ────────  [+] Quick Add                      (User / Org) │
├─────────────┬───────────────────────────────────────────────────────────────────────────┤
│             │  REVENUE    EXPENSES    PROFIT                                             │
│             │  ┌───────────────────────────────┐  ┌───────────────────────────────────┐ │
│  Dashboard  │  │                               │  │                                   │ │
│  Item       │  │   Customer Summary            │  │   Cash Flow Trend                  │ │
│  Sales      │  │   ─────────────────           │  │   (Sparkline / Bar)                │ │
│  Purchases  │  │   Paid    $ 0.00              │  │                                   │ │
│  Inventory  │  │   Open    $ 0.00              │  │                                   │ │
│  CRM        │  │   Overdue $ 0.00              │  │                                   │ │
│  Banking    │  │                               │  │                                   │ │
│  HR         │  └───────────────────────────────┘  └───────────────────────────────────┘ │
│  Accounting │                                                                           │
│  Tax        │  ┌───────────────────────────────────────────────────────────────────────┐ │
│  System     │  │ Latest Transactions  ─────────────────────────────────────────────── │ │
│  Report     |  │  │ [Smart In-line Math] · Pinnable · Groupable · Exportable          │ │
└─────────────┴──┴───────────────────────────────────────────────────────────────────────┘
```

### 2.3 Navigation Collapse: 12 Core Domains

The current sidebar is built around 12 functional domains defined in `apps/frontend/src/components/sidebar/index.tsx`:

| Domain | Child Keys |
|---|---|
| **Dashboard** | `dashboard` |
| **Sales** | `sales` |
| **CRM** | `crm` |
| **Trade & Customs** | `trade` |
| **Purchases & Inventory** | `purchases`, `inventory` |
| **Banking** | `banking` |
| **Tax & Compliance** | `tax_compliance`, `regulatory_reporting`, `disaster_fund` |
| **Accounting** | `accounting` |
| **Finance & Standards** | `ifrs_compliance`, `aabe_compliance`, `commercial_code`, `ovds_module` |
| **Reports & Analytics** | `reports` |
| **HR & Payroll** | `hr_payroll` |
| **System & Administration** | `system`, `setting`, `config`, `admin`, `governance`, `iot`, `device_control`, `developer` |

Each domain supports **progressive disclosure**: power users expand advanced actions; new users see only what they need.

---

## 3. Enterprise UX Principles: Dense, Powerful, Beautiful

### 3.1 Consumer UX vs. Enterprise UX

Consumer apps are designed for curiosity; enterprise apps are designed for **muscle memory**. A shopper spends seconds deciding between marketplaces; an accountant spends hours inside the same screen this fiscal year. That time investment is the foundation of enterprise UX design.

When users are forced to be inside the product, **delight** comes from the tenth keyboard shortcut they memorized that saves two clicks per record — multiplied by ten thousand records per quarter. Strip visual clutter, publish a shortcut cheat sheet, and trust that users are trained professionals who learn once and then repeat the same action thousands of times.

**Consequences reach every layer:** the icon library, the spacing scale, the color palette, the microcopy, the error states, and the empty states. A consumer app's onboarding is a welcome party. An enterprise app's onboarding is a training course — and the UI you ship is the textbook the users live inside for the next four years.

### 3.2 Discoverability vs. Efficiency

Consumer UX obsesses over discoverability: can a first-time user find the "Add Item" button without instructions? Enterprise UX flips that question. After the second day, nobody is looking for that button anymore — they want the keyboard shortcut. Putting a giant CTA permanently on-screen for power users is noise, not help.

Discoverability **moves** inside onboarding flows, a searchable help center, tooltips on first hover, and contextual command palettes (`Ctrl+K`). Do not sacrifice permanent screen real estate for training wheels. Optimize for the ten-thousandth click, not the first.

### 3.3 The 5 Golden Rules

| Rule | Implementation |
|---|---|
| **1. Data Density Is Not a Dirty Word** | Pack information tight, but aligned, grouped, and labeled with rigorous visual hierarchy. Every pixel carries meaning. |
| **2. Design for Scalability (The 10,000 Row Test)** | Virtualize lists, sticky headers, resizable/pinnable columns, customizable column sets per user. |
| **3. Advanced Filtering and Search** | `Cmd+K` global command palette, faceted search, and **saved views** ("My overdue tickets", "Q3 renewals over $50K"). |
| **4. Role-Based Access and Modular Layouts** | CFO, manager, and clerk see different homepages. Drag-and-drop widgets, role-based defaults, per-user saved configurations. |
| **5. Bulk Actions and Error Recovery** | Multi-select, bulk edit, bulk export. Confirmation modals show exact deltas. Generous undo windows. Error states say "Row 34: customer_id missing. Rows 35–60 succeeded. Click to retry." |

### 3.4 Navigating the Deep End: Information Architecture

A mature enterprise product often contains 300–500 unique screens. Organizing them is not a UI problem — it's an **architecture problem**.

#### Multi-Level Sidebar Navigation

Top navigation bars collapse under the weight of enterprise feature trees. Sidebars win because they can nest, collapse, scroll independently of the main content area, and survive indefinitely as the product grows. Design with clear active states, nested expand/collapse, iconography for top-level items, and breadcrumbs so users never feel lost in a deep hierarchy.

#### Progressive Disclosure

Hide advanced settings behind predictable, consistent doors. A regular user never sees the twenty fields an admin uses once a quarter, but those fields are one click away for the admin who knows where they live. Disclosure should be intentional, consistent, and discoverable through repeated patterns — gear icons, "Advanced" tabs, expandable sections, "More options" buttons. Never random, never buried, never surprising.

### 3.5 Migrating Legacy Systems

Most enterprise UX work is **modernization**, not greenfield design. Rip-and-replace redesigns fail at enterprise scale because they nuke years of accumulated user expertise overnight.

The effective path is **gradual, component-by-component modernization**: rebuild one screen at a time, keep keyboard shortcuts stable across versions, let users toggle between old and new for a transition period, and collect feedback obsessively along the way. Legacy migration is an organizational change project as much as a design project, and the best teams plan for both from day one.

---

## 4. Nx Monorepo Code Organization

By utilizing an Nx Workspace, OVDS strictly isolates the core financial logic from the UI view layers, allowing the platform to scale cleanly.

### 4.1 Repository Layout

```
nx/
├── apps/
│   ├── backend/            # NestJS 11 API + WebSocket + oRPC
│   ├── frontend/           # React 19 + Vite 6 SPA
│   └── portal/             # Isolated Client Portal (React)
├── packages/
│   ├── design-system/      # Brand tokens only (@ovds/design-system)
│   ├── ui/                 # Reusable React components (@ovds/ui)
│   ├── shared/             # Shared types, RBAC, tax utils, DTOs (@ovds/shared)
│   ├── contracts/          # oRPC contracts + Zod schemas (@ovds/contracts)
│   ├── database/           # Prisma schema + client (@ovds/database)
│   ├── offline queue/        # Offline-first reconciliation engine (@ovds/offline queue)
│   └── ovds-core/     # Double-entry accounting services (@ovds/ovds-core)
├── scripts/
└── docs/
```

### 4.2 App Entry Points

| App | Purpose | Offline Support |
|---|---|---|
| `backend` | NestJS API, oRPC, WebSocket, BullMQ workers | offline queue reconciliation |
| `frontend` | Primary administrative ERP client | SQLite / sql.js WASM |
| `portal` | Isolated Client Portal for customer self-service | Read-only cached views |

### 4.3 Package Contracts

- **`@ovds/contracts`** (Zod): Shared request/response schemas consumed by oRPC and frontend.  
- **`@ovds/shared`** (TypeScript): Domain types, RBAC utilities, Ethiopian tax constants.  
- **`@ovds/dto`** (class-validator): REST controller DTOs and validation pipes.  
- **`@ovds/prisma-client`** (Prisma): Single generated client, imported by every backend microservice.

---

## 5. Accounting Logic Engine: Double-Entry with Prisma

A premium accounting app uses **robust Double-Entry Accounting**. Every financial event creates matching debit and credit journal entries to ensure mathematically perfect balancing. No event bypasses the ledger.

### 5.1 Normalized Database Schema

```prisma
// prisma/schema.prisma

model Company {
  id           String     @id @default(uuid())
  name         String
  currencyCode String     @default("ETB")
  accounts     Account[]
  journals     JournalEntry[]
  invoices     Invoice[]
  taxRates     TaxRate[]
  entities     Entity[]
}

model Account {
  id             String         @id @default(uuid())
  companyId      String
  entityId       String?
  name           String         // "Accounts Receivable", "Cash Account"
  type           AccountType    // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
  code           String         // Chart of Accounts code (e.g., "1200")
  parentId       String?
  company        Company        @relation(fields: [companyId], references: [id])
  entity         Entity?        @relation(fields: [entityId], references: [id])
  ledgerEntries  LedgerEntry[]
  
  @@unique([companyId, code])
  @@map("accounts")
}

model JournalEntry {
  id           String         @id @default(uuid())
  companyId    String
  entityId     String?
  date         DateTime
  description  String
  reference    String?
  company      Company        @relation(fields: [companyId], references: [id])
  entity       Entity?        @relation(fields: [entityId], references: [id])
  lines        LedgerEntry[]
  createdAt    DateTime       @default(now())
  
  @@map("journal_entries")
}

model LedgerEntry {
  id             String       @id @default(uuid())
  journalEntryId String
  accountId      String
  debit          Decimal      @db.Decimal(19, 4)
  credit         Decimal      @db.Decimal(19, 4)
  
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  account        Account      @relation(fields: [accountId], references: [id])
  
  @@map("ledger_entries")
}

model Invoice {
  id             String         @id @default(uuid())
  companyId      String
  entityId       String?
  invoiceNumber  String         @db.VarChar(255)
  customerId     String
  amount         Decimal        @db.Decimal(19, 4)
  currencyCode   String         @default("ETB")
  exchangeRate   Decimal        @default(1) @db.Decimal(19, 6)
  taxAmount      Decimal        @default(0) @db.Decimal(19, 4)
  status         InvoiceStatus  // PAID, PARTIAL, OVERDUE, CANCELLED, DRAFT
  dueDate        DateTime?
  paidAt         DateTime?
  company        Company        @relation(fields: [companyId], references: [id])
  entity         Entity?        @relation(fields: [entityId], references: [id])
  lines          InvoiceLine[]
  payments       Payment[]
  
  @@unique([companyId, invoiceNumber])
  @@map("invoices")
}

model InvoiceLine {
  id          String   @id @default(uuid())
  invoiceId   String
  description String
  quantity    Decimal  @db.Decimal(19, 4)
  unitPrice   Decimal  @db.Decimal(19, 4)
  taxRateId   String?
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  @@map("invoice_lines")
}

model Payment {
  id           String   @id @default(uuid())
  companyId    String
  invoiceId    String
  amount       Decimal  @db.Decimal(19, 4)
  currencyCode String
  method       String
  reference    String?
  paidAt       DateTime @default(now())
  invoice      Invoice  @relation(fields: [invoiceId], references: [id])
  
  @@map("payments")
}

model TaxRate {
  id          String   @id @default(uuid())
  companyId    String
  name        String   // "VAT 15%", "TOT 2%", "WHT 3%"
  type        TaxType  // VAT, TOT, WHT, EXCISE
  rate        Decimal  @db.Decimal(7, 4)
  isCompound  Boolean  @default(false)
  company     Company  @relation(fields: [companyId], references: [id])
  
  @@map("tax_rates")
}

model Entity {
  id          String   @id @default(uuid())
  companyId   String
  name        String
  code        String   // Branch / Subsidiary code
  parentId    String?
  company     Company  @relation(fields: [companyId], references: [id])
  accounts    Account[]
  journalEntries JournalEntry[]
  invoices    Invoice[]
  
  @@unique([companyId, code])
  @@map("entities")
}

model Customer {
  id          String   @id @default(uuid())
  companyId   String
  name        String
  tin         String?
  email       String?
  phone       String?
  company     Company  @relation(fields: [companyId], references: [id])
  
  @@map("customers")
}

model Vendor {
  id          String   @id @default(uuid())
  companyId   String
  name        String
  tin         String?
  email       String?
  phone       String?
  company     Company  @relation(fields: [companyId], references: [id])
  
  @@map("vendors")
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  INCOME
  EXPENSE
}

enum InvoiceStatus {
  DRAFT
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}

enum TaxType {
  VAT
  TOT
  WHT
  EXCISE
  SERVICE
}
```

### 5.2 Double-Entry Invariants

| Rule | Enforcement |
|---|---|
| **Sum(debit) == Sum(credit)** | Application-level check in `JournalEntryService` + database check constraint |
| **Account type consistency** | Income accounts are credited for revenue; Asset accounts are debited for cash receipt |
| **Immutable entries** | `JournalEntry` and `LedgerEntry` records are append-only |
| **Reversals must balance** | Reversals create new balanced entries, not modifications of originals |

---

## 6. NestJS "Smart" Accounting Services

To implement Akaunting's robust automation patterns, OVDS handles critical operations inside NestJS services utilizing **Prisma Transactions**. Every financial event automatically creates balanced journal entries without manual human intervention.

### 6.1 Invoice Payment Auto-Journal

```typescript
// packages/ovds-core/src/invoice-payment.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ovds/prisma-client';

@Injectable()
export class InvoicePaymentService {
  constructor(private prisma: PrismaService) {}

  async recordPayment(invoiceId: string, companyId: string, cashAccountId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paidAt: new Date() },
      });

      const receivableAccount = await tx.account.findFirst({
        where: { companyId, code: '1200' },
      });

      if (!receivableAccount) {
        throw new BadRequestException('Accounts Receivable layout configuration missing.');
      }

      return tx.journalEntry.create({
        data: {
          companyId,
          entityId: invoice.entityId,
          date: new Date(),
          description: `Payment received for Invoice #${invoice.invoiceNumber}`,
          lines: {
            create: [
              { accountId: cashAccountId, debit: amount, credit: 0 },
              { accountId: receivableAccount.id, debit: 0, credit: amount },
            ],
          },
        },
        include: { lines: true },
      });
    });
  }
}
```

### 6.2 Automated Tax Calculation

```typescript
// packages/ovds-core/src/tax-calculation.service.ts
@Injectable()
export class TaxCalculationService {
  constructor(private prisma: PrismaService) {}

  async calculateInvoiceTax(invoiceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { lines: { include: { taxRate: true } } },
      });

      const totalTax = invoice.lines.reduce((sum, line) => {
        const rate = line.taxRate?.rate ?? 0;
        return sum + (line.quantity * line.unitPrice * rate);
      }, 0);

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { taxAmount: totalTax },
      });

      return totalTax;
    });
  }
}
```

---

## 7. Multi-Entity & Multi-Currency Hierarchy

### 7.1 Company & Organization Hierarchy

OVDS supports unlimited entities per company (parent-subsidiary charts of accounts, intercompany eliminations, multi-currency conversions, and localized tax jurisdictions). Each entity shares a common chart of accounts but can hold its own localized tax configurations.

### 7.2 Multi-Currency Model

| Field | Purpose |
|---|---|
| `Company.currencyCode` | Base reporting currency (default: ETB) |
| `Invoice.currencyCode` | Transaction currency |
| `Invoice.exchangeRate` | Rate applied at invoice date |
| `LedgerEntry` | Always posted in base currency via auto-conversion |
| `Account` | Maintains base currency balance; FX gains/losses post to designated account |

---

## 8. Ethiopian Compliance Engine (MoR / ERCA / AABE)

OVDS enforces **Ethiopian Business Sectors Legally Covered by the Regulation** compliance out of the box.

### 8.1 Registered Tax Types

| Tax | Code | Rate | Authority | Filing Frequency |
|---|---|---|---|---|
| Value Added Tax | VAT | 15% | MoR / ERCA | Monthly |
| Turnover Tax | TOT | 2% / 10% | MoR / ERCA | Quarterly |
| Withholding Tax | WHT | 3% | MoR / ERCA | Monthly |
| Business Income Tax | BIT | Progressive | MoR / ERCA | Annual |
| Building & Rental Fee | BRF | Varies | MoR / ERCA | Annual |
| Excise Tax | EXCISE | Varies | MoR / ERCA | Per product |
| Pension Contribution | Pension | 7% | MoR / ERCA | Monthly |

### 8.2 Regulatory Adapters

```
┌─────────────────────────────────────────────────────────┐
│                  OVDS Core Engine                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Invoice   │  │   Payment    │  │   Journal      │ │
│  │   Service   │  │   Service    │  │   Service      │ │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘ │
│         │                │                  │          │
│         ▼                ▼                  ▼          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           Ethiopian Compliance Event Bus            │ │
│  │   ┌─────────────┐  ┌──────────────┐               │ │
│  │   │ Tax Rate    │  │ MoR eTax     │               │ │
│  │   │ Resolver    │  │ Adapter      │               │ │
│  │   └─────────────┘  └──────────────┘               │ │
│  │   ┌─────────────┐  ┌──────────────┐               │ │
│  │   │ TOT/WHT     │  │ AABE IFRS16  │               │ │
│  │   │ Calculator  │  │ Adapter      │               │ │
│  │   └─────────────┘  └──────────────┘               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │  BullMQ      │  │  XmlBuilder │  │ Digital Sig.  │  │
│  │  Queue       │◄─│  (eTax XML) │◄─│  (ERCA cert)  │  │
│  └──────────────┘  └─────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Offline-First & Resilience Architecture

OVDS is engineered for **mandatory offline capability** because 26 regulated Ethiopian sectors must continue sales and purchases during internet interruptions. The platform queues every mutation locally and reconciles on restore.

### 9.1 Offline Architecture

| Layer | Cloud | On-Premise / Offline |
|---|---|---|
| **Client Store** | TanStack Query cache | SQLite / sql.js WASM + `@ovds/offline queue` |
| **Mutation Queue** | Optimistic update → API | Local queue persisted to SQLite |
| **Sync Protocol** | HTTPS / WebSocket | MQTT + TLS + local IPC |
| **Conflict Resolution** | Server-authoritative | Last-write-wins + manual reconcile |
| **Data Integrity** | ACID transactions | WAL journal + periodic integrity checks |

### 9.2 Resilience Guarantees

- Every mutation generates a **server-generated UUID** before network transmission.  
- Failed syncs retry with **exponential backoff** (1s → 30s max).  
- **Idempotency keys** prevent duplicate posting on retry.  
- **Local validation** mirrors server rules so users see the same validation errors offline.  
- **Sync status indicator** in the header shows: Online, Syncing, Offline, Error, or Pending Review.

---

## 10. Akaunting-Inspired Interactions

### 10.1 Dashboard Slider

A smooth slider glides between aggregation levels:

- **Overall Company** — consolidated view across all entities.  
- **By Entity** — branch / subsidiary breakdown.  
- **By Tax Type** — VAT, TOT, WHT exposure.  
- **By Time Period** — custom fiscal periods.

### 10.2 Smart Inline Math

Field inputs like invoice item quantities handle real-time math automatically:

```
quantity : [2*3=6]        unit_price : [120]   tax : [15%]
quantity : [120+15=135]   unit_price : [100]   tax : [15%]
```

Evaluation triggers on **blur** or when the user presses `Enter` or `Tab`. The system parses the expression, calculates, and persists the numeric result. If parsing fails, it reverts to the last known valid value and shows a non-blocking validation hint.

### 10.3 Command Palette (Ctrl+K)

Global command palette returns any record in three keystrokes:

- Navigate to any invoice by number.  
- Create a new invoice, bill, or journal entry.  
- Switch company or entity.  
- Execute saved views (e.g., "Show overdue invoices > $10,000").  
- Toggle dark / light mode.

### 10.4 Saved Views

Users bookmark favorite filter combinations:

- "My overdue invoices"  
- "Q3 VAT returns pending"  
- "Contracts expiring this month"  

Saved views make the product feel personal without the designer building a new screen for every user.

---

## 11. Hybrid Deployment Engine

### 11.1 Cloud Tier (Multi-Tenant SaaS)

- **Containerized microservices** on Kubernetes with horizontal pod autoscaling.  
- **Cloud-native databases**: PostgreSQL / CockroachDB for multi-region scale.  
- **Tenant isolation**: Hard logical separation via `companyId` scoping + row-level security.  
- **Shared cache**: Redis cluster per region for session and rate-limit state.  
- **Managed sync-relay**: BullMQ + Redis Streams for event distribution.

### 11.2 On-Premise Tier (Air-Gapped)

- **Single binary** distribution (Docker or native executable).  
- **SQLite air-gap mode** with embedded Prisma for zero external dependencies.  
- **Local sync node**: `@ovds/offline queue` manages peer-to-peer sync via USB / LAN / Bluetooth/ WI-FI / Cellular / GPS / Wscheduled cloud reconnect.  
- **Local fiscal device registry**: Offline-capable device enrollment and certificate caching.  
- **Self-contained integrations**: Local XML generation, digital signing, and batch upload queue.

### 11.3 Shared Codebase Guarantee

Both tiers run the **exact same NestJS bundles** and **React SPA**. Configuration toggles (`DEPLOYMENT_MODE`) switch drivers, storage adapters, and network boundaries without branching code.

---

## 12. Integration Layer: API Gateway, Events & IoT

### 12.1 API Gateway

Expose versioned REST and GraphQL endpoints protected by OAuth2 scopes and rate-limiting:

- **Third-party ERPs**: SAP, Oracle, QuickBooks adapters via REST.  
- **External Auditors**: Read-only API scopes with granular entity and fiscal-year access.  
- **Banking**: NBE, CBE, Dashen Bank, and all supported banks connectors via OFX / ISO 20022.  
- **MoR / ERCA / AABE**: Secure XML submission with retry and acknowledgment tracking.

### 12.2 Event-Driven Broker

Use **Apache Kafka** or **RabbitMQ** for asynchronous, high-throughput financial event streaming and webhook dispatching:

| Event | Consumer | Action |
|---|---|---|
| `Invoice.Created` | Tax Engine | Reserve tax amount, update TOT/VAT ledgers |
| `Invoice.StatusChanged` | eTax Adapter | Generate XML, attach digital signature, submit |
| `Payment.Received` | Notification Service | Trigger receipt email / SMS |
| `JournalEntry.Posted` | Audit Service | Append immutable audit hash |
| `Entity.Created` | RBAC Service | Initialize default role mappings |
| `FiscalDevice.Connected` | IoT Pipeline | Register device, start telemetry ingestion |

### 12.3 IoT Data Ingestion

Create a specialized ingestion pipeline to map telemetry data from smart warehouses, RFID asset tracking, or automated manufacturing units directly to **fixed-asset depreciation** and **inventory ledger entries**:

1. **Device Auth**: OAuth2 client credentials per IoT gateway.  
2. **Protocol**: MQTT over TLS with JSON or protobuf payloads.  
3. **Normalization**: Map raw sensor events to canonical domain events via YAML configuration.  
4. **Ledger Impact**: Asset events (`sensor_id`, `location`, `status`) post to Fixed Assets; inventory events (`sku`, `qty`, `warehouse`) post to Inventory.  
5. **Fraud Guard**: Anomaly detection flags impossible asset movements for manual review.

---

## 13. Identity, Access & Control Center

### 13.1 Granular IAM & RBAC

Implement **Role-Based Access Control** tied to organization dimensions, enforcing **segregation of duties** down to individual ledger action approvals:

| Role | Dashboard Access | Accounting Actions | Tax Filing | User Management |
|---|---|---|---|---|
| **Super Admin** | All entities | Post / Reverse / Approve | Submit / Void | Full |
| **CFO** | Consolidated | Approve up to limit | Review only | Read |
| **Accountant** | Assigned entities | Create / Edit | Draft / Submit | None |
| **Clerk** | Assigned entity | Create only | None | None |
| **Auditor** | Read-only | Read-only | Read-only | Read-only |

Segregation of duties is enforced at the **action level**: a user can create a journal entry but cannot post it if their approval threshold is exceeded.

### 13.2 Federated Authentication

- **SSO**: SAML 2.0 and OIDC for enterprise identity providers (Azure AD, Google Workspace, Keycloak).  
- **MFA**: Mandatory TOTP via authenticator apps or SMS/Email backup codes.  
- **Session Management**: JWT + refresh token rotation with absolute expiration.  
- **Device Trust**: Remember MFA for 30 days on trusted devices only.

### 13.3 Central Control Center

A master administrative dashboard for global telemetry, tenant resource provisioning, software updates, and audit log analysis across both cloud and on-prem clusters:

- **Real-time health**: API latency, sync queue depth, error rates.  
- **Tenant metrics**: Storage utilization, user count, feature entitlement usage.  
- **Audit explorer**: Filter by action, user, entity, date range — exportable to CSV / PDF.  
- **Update manager**: Rolling deployment status with rollback and canary indicators.

---

## 14. Prisma Schema: Enterprise Extensions

Add the following to the base schema for enterprise scale:

```prisma
model AuditLog {
  id           String   @id @default(uuid())
  companyId    String
  entityType   String   // e.g., "Invoice", "JournalEntry"
  entityId     String
  action       String   // CREATE, UPDATE, DELETE, POST
  userId       String
  changes      Json     // { before: {...}, after: {...} }
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
  
  @@index([companyId, entityType, entityId])
  @@map("audit_logs")
}

model FeatureEntitlement {
  id          String   @id @default(uuid())
  companyId   String
  featureKey  String   // e.g., "inventory", "multi-currency", "iot"
  enabled     Boolean  @default(false)
  expiresAt   DateTime?
  
  @@unique([companyId, featureKey])
  @@map("feature_entitlements")
}

model SyncQueue {
  id          String   @id @default(uuid())
  companyId   String
  entityType  String
  entityId    String
  action      String
  payload     Json
  status      SyncStatus // PENDING, SYNCING, COMPLETED, FAILED
  attempts    Int      @default(0)
  lastError   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([companyId, status])
  @@map("sync_queue")
}

enum SyncStatus {
  PENDING
  SYNCING
  COMPLETED
  FAILED
}
```

---

## 15. Transitioning to a Smart Platform

### 15.1 Client & Portal Decoupling

Build two distinct entry targets in the React `apps/` layer:

- **`apps/frontend`** — the primary administrative ERP interface.  
- **`apps/portal`** — an isolated Client Portal hitting the shared NestJS API asynchronously.

The **Client Portal** allows clients to instantly view invoices, track balances, and settle payments without accessing internal accounting workflows. The portal uses the same oRPC contracts but enforces strict read scopes and payment-only mutations.

### 15.2 Background Automations

Use a **NestJS event emitter** mechanism. When an invoice status flips:

1. Emit `Invoice.StatusChanged` to the internal event bus.  
2. Pass the payload over to **BullMQ** for async processing:  
   - Attach digital signature (ERCA certificate).  
   - Compute real-time local tax rates.  
   - Push data to MoR / ERCA / AABE safely.  
3. Update the user only on **failure** with actionable context ("VAT XML rejected: TIN mismatch. Click to retry with corrected data.").

### 15.3 MoR/ERCA/TASS Report-Ready Pipeline

Automated background queue runners handle:

- **XML generation** per MoR e-Tax schema version.  
- **Batch compression** and USB / LAN upload for disconnected on-prem installs.  
- **Acknowledgment parsing** and status watermarking on the parent document.  
- **Retry policies** with dead-letter queues for manual intervention after 3 failures.

---

## 16. Performance & Scalability Targets

| Metric | Target |
|---|---|
| **Dashboard load** | < 800ms (p95) on cached data |
| **Transaction list (10k rows)** | < 200ms render, virtualized |
| **Journal entry posting** | < 300ms end-to-end |
| **Command palette search** | < 150ms across all entities |
| **Sync reconciliation** | < 5s for 1000 queued mutations |
| **PDF report generation** | < 2s for A4 financial statement |
| **Concurrent users (per tenant)** | 500+ sustained, 2000 peak |
| **Database connections** | Pool capped at 20 per tenant |

---

## 17. Implementation Summary

| Area | Requirement | Status |
|---|---|---|
| **UI/UX** | Akaunting-inspired dashboard, sidebar collapse, inline math | Design |
| **Nx Monorepo** | Isolated financial logic from UI layers | In Progress |
| **Accounting Engine** | Double-entry Prisma schema with balanced invariants | Schema defined |
| **NestJS Services** | Prisma transactions for payments, tax, journals | Design |
| **Offline Resilience** | SQLite offline queue, queue reconciliation, idempotency | Design |
| **Ethiopian Compliance** | MoR/ERCA/AABE adapters, TOT/VAT/WHT/EXCISE | Design |
| **Multi-Entity/Multi-Currency** | Entity hierarchy, FX conversion, consolidated reporting | Schema defined |
| **IoT Integration** | MQTT ingestion → fixed assets & inventory ledgers | Design |
| **API Gateway** | REST + GraphQL, OAuth2 scopes, rate limiting | Design |
| **Event-Driven** | Kafka/RabbitMQ, BullMQ, webhooks | Design |
| **IAM** | RBAC, SSO (SAML2/OIDC), MFA, audit logs | Design |
| **Client Portal** | Decoupled React app, read-only scopes | Design |
| **Frontend Architecture** | React SPA page shell, responsive layout, sidebar navigation | Design |
| **State Management** | TanStack Query caching, optimistic updates, offline-first data flow | Design |
| **API Client Layer** | Type-safe oRPC contracts, Axios REST fallback, error handling | Design |
| **Testing** | Unit (Vitest/Jest), integration, E2E (Playwright), accessibility | Design |
| **CI/CD** | GitHub Actions pipeline, staging/production, canary deployment, rollback | Design |
| **Monitoring** | Application metrics, structured logging, health checks, RUM | Design |
| **Developer Onboarding** | Quick-start guide, coding standards, design token usage, keyboard shortcuts | Design |

---

## 18. Developer Workflow

```bash
# Install dependencies
npm install

# Start backend (NestJS)
npx nx serve backend

# Start frontend (React + Vite)
npx nx serve frontend

# Run migrations
npx nx run database:migrate

# Seed Ethiopian chart of accounts
npx nx run database:seed

# Run tests
npx nx run-many --target=test --all

# Build for production
npx nx run-many --target=build --configuration=production
```

---

## 19. References

- [Akaunting 3.0 UI/UX](https://akaunting.com/blog/akaunting-3-0-better-ui-ux-small-business-bookkeeping-made-easy)  
- [Akaunting Updates: Dashboard Sliders & In-line Math](https://akaunting.com/blog/akaunting-updates-3-1-13-3-1-17-dashboard-sliders-document-stacks-and-more)  
- Ethiopian MoR e-Tax Portal: https://tass.mor.gov.et  
- AABE Proclamation 847/2014  
- IFRS 15, IFRS 16 in Ethiopian Public Sector context  
- Peachtree / Sage Double-Entry Accounting Standards

---

## 20. Frontend Architecture & Page Shell

The React SPA is organized around a **page-shell pattern**: every route renders a layout wrapper (`Layout.tsx`) that provides the sidebar, header, breadcrumbs, and content viewport. Individual pages are lazy-loaded via React `Suspense` with `PageSkeleton` fallbacks.

### 20.1 Page Layout Contract

Every page component must conform to the page layout contract:

```tsx
export default function FeaturePage() {
  const { selectedCompanyId } = useBusiness();
  const { can } = useRbac();
  const { data, loading, error, refetch } = useApiQuery<FeatureItem[]>(
    `/feature?companyId=${selectedCompanyId}`,
    { enabled: !!selectedCompanyId, deps: [selectedCompanyId] }
  );

  if (loading) return <PageSkeleton />;
  if (error) return <EmptyState message={error} action={refetch} />;
  if (!data?.length) return <EmptyState message="No items found" />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader title="Feature" actions={<Can permission="feature:write"><button>Add</button></Can>} />
      {/* Content */}
    </div>
  );
}
```

### 20.2 Responsive Breakpoints

| Prefix | Min-width | Usage |
|--------|-----------|-------|
| (none) | 0px | Mobile-first base styles |
| `sm:` | 640px | Tablet portrait — sidebar collapses |
| `md:` | 768px | Tablet landscape — 2-column grids |
| `lg:` | 1024px | Desktop — sidebar sticky, full tables |
| `xl:` | 1280px | Wide desktop — max-width content |
| `2xl:` | 1536px | Ultra-wide — dashboard side-by-side |

### 20.3 Sidebar Navigation Shell

The sidebar (`Sidebar.tsx`) is a 12-domain accordion with RBAC filtering, progressive disclosure, and a `g` chord (press `G` then a letter to navigate). On mobile, it slides in as an overlay with a backdrop; on desktop, it is sticky with collapse/expand animation (`duration-300 cubic-bezier(0.4,0,0.2,1)`).

### 20.4 Dashboard Shell

The dashboard home (`/dashboard`) renders a `DashboardSlider` carousel that cycles between aggregation levels (Overall Company → By Entity → By Tax Type → By Period). The shell is a responsive CSS Grid with `auto-fit` columns for KPI cards and a `BentoGrid` for widget placement.

---

## 21. State Management & Data Flow

OVDS uses a layered state management architecture:

### 21.1 State Layers

| Layer | Technology | Scope |
|-------|-----------|-------|
| **Server cache** | TanStack Query (React Query) | API response data with stale-while-revalidate |
| **Business context** | React Context (`BusinessContext`) | Active company, user role, entity |
| **Theme & preferences** | React Context (`ThemeContext`) | Dark/light mode, density, brand |
| **Form state** | React `useState` + `useFormDirty` | Unsaved-change detection |
| **URL state** | React Router search params | Filters, pagination, sort |
| **Local persistence** | `useLocalStorage` | Sidebar collapse, favorites, company preference |

### 21.2 TanStack Query Configuration

```typescript
// Query client with enterprise defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30s before refetch
      gcTime: 5 * 60 * 1000,   // 5min garbage collection
      retry: 2,                 // Exponential backoff
      refetchOnWindowFocus: false,  // Avoid noisy background refetches
      placeholderData: keepPreviousData,  // Smooth transitions
    },
  },
});
```

### 21.3 Optimistic Updates

Every mutation follows the optimistic-update pattern: update the cache immediately, send the request, and reconcile on response or error.

```typescript
const { mutate } = useMutation({
  mutationFn: apiPut(`/invoices/${id}`, { status: 'PAID' }),
  onMutate: async (newStatus) => {
    await queryClient.cancelQueries({ queryKey: ['invoices'] });
    const prev = queryClient.getQueryData(['invoices']);
    queryClient.setQueryData(['invoices'], (old) =>
      old.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv))
    );
    return { previousData: prev };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['invoices'], context.previousData);
    toast.error('Failed to update — reverted');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  },
});
```

### 21.4 Offline-First Data Flow

When `navigator.onLine` is `false`:
1. Mutations are queued in `localStorage` with a `pendingMutations` array.
2. UI updates optimistically with an `offline` badge on the affected row.
3. On reconnect, the `SyncEngine` drains the queue, applying each mutation with idempotency keys.
4. Conflicts (server rejects optimistic update) enter a `conflict` state with side-by-side diff.

---

## 22. API & oRPC Client Layer

OVDS uses a type-safe API layer that bridges the React frontend with the NestJS backend via both oRPC contracts and a REST fallback.

### 22.1 oRPC Contracts

Shared Zod schemas in `@ovds/contracts` define request/response types consumed by both the oRPC client (for real-time) and REST controllers (for SSR and debugging):

```typescript
// packages/contracts/src/invoice.contract.ts
import { z } from 'zod';

export const CreateInvoiceSchema = z.object({
  customerName: z.string().min(1),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    taxRateId: z.string().optional(),
  })),
  currencyCode: z.string().default('ETB'),
  dueDate: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type InvoiceResponse = z.infer<typeof InvoiceSchema>;
```

### 22.2 HTTP Client (Fallback)

When oRPC is unavailable (SSR, debugging, offline-first cache), the Axios instance in `services/api.ts` provides type-safe REST methods:

```typescript
// frontend/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ovds_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 22.3 Error Handling Pattern

All API errors follow a consistent shape:

```typescript
interface ApiError {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  error: string;
  success: false;
}
```

The `api.ts` interceptor maps HTTP status codes to user-facing toasts, suppresses `401` on auth routes, and triggers token refresh on unauthenticated responses.

---

## 23. Testing Strategy & Quality Assurance

OVDS maintains a three-tier testing matrix that covers unit logic, integration points, and end-to-end user flows.

### 23.1 Testing Tiers

| Tier | Framework | Scope | Run Command |
|------|-----------|-------|-------------|
| **Unit** | Vitest (frontend) / Jest (backend) | Services, utils, hooks, components | `npm run test:frontend` / `npm run test:backend` |
| **Integration** | Jest + Prisma Memory | Multi-model transactions, RBAC guards | `npm run test:backend -- --run --testPathPattern=integration` |
| **E2E** | Playwright | Full user journeys across pages | `npm run test:e2e` |

### 23.2 Unit Test Patterns

**Frontend (Vitest + React Testing Library):**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InvoicesPage from './InvoicesPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('InvoicesPage', () => {
  it('renders loading skeleton initially', () => {
    render(<InvoicesPage />, { wrapper });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state when no invoices exist', async () => {
    // Mock useApiQuery to return empty array
    render(<InvoicesPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('No invoices found')).toBeInTheDocument();
    });
  });

  it('opens command palette on Ctrl+K', async () => {
    render(<InvoicesPage />, { wrapper });
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
```

**Backend (Jest):**

```typescript
describe('InvoiceService', () => {
  let service: InvoiceService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: AuditLogService, useValue: { log: jest.fn() } },
      ],
    }).compile();
    service = module.get(InvoiceService);
    prisma = module.get(PrismaService);
  });

  it('should throw NotFoundException for non-existent invoice', async () => {
    prisma.invoice.findUnique.mockResolvedValue(null);
    await expect(service.findOne('nonexistent', 'company-1')).rejects.toThrow(NotFoundException);
  });

  it('should enforce tenant isolation', async () => {
    prisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1', companyId: 'other-company' });
    await expect(service.findOne('inv-1', 'company-1')).rejects.toThrow(ForbiddenException);
  });
});
```

### 23.3 E2E Test Pattern (Playwright)

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', 'superadmin@ovds.com');
    await page.fill('[name="password"]', 'SuperAdmin@2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('renders customer summary card', async ({ page }) => {
    await expect(page.locator('[data-testid="customer-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="paid-total"]')).toHaveText('$0.00');
  });

  test('opens command palette with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('toggles dark mode', async ({ page }) => {
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
```

### 23.4 Accessibility Testing

Every component must pass WCAG 2.1 AA checks:

```bash
# Install axe-core for automated checks
npm install --save-dev @axe-core/react

# Use in tests
import AxeBuilder from '@axe-core/react';

it('has no accessibility violations', async () => {
  const { container } = render(<InvoicesPage />, { wrapper });
  const results = await new AxeBuilder({ container }).analyze();
  expect(results.violations.length).toBe(0);
});
```

---

## 24. CI/CD Pipeline & Deployment

### 24.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: OVDS CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx nx run-many --target=lint --all
      - run: npx nx run-many --target=typecheck --all

  test:
    runs-on: ubuntu-latest
    needs: lint-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx nx run-many --target=test --all --coverage

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx nx run-many --target=build --configuration=production
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist/

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploy to staging environment"
      # Add Vercel, Docker, or S3 deployment steps

  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploy to production with canary indicator"
      # Add canary deployment, health check, rollback logic
```

### 24.2 Deployment Models

| Model | Trigger | Strategy |
|-------|---------|----------|
| **Canary** | `main` branch | 5% traffic → monitor → 100% |
| **Blue-Green** | Tagged release | Switch traffic after health check |
| **On-Premise** | Manual / scheduled | Docker pull + `npm run db:migrate:prod` |

### 24.3 Rollback Procedure

1. CI detects failed health check post-deploy.
2. Kubernetes (cloud) or PM2 (on-premise) reverts to previous image tag.
3. Database migrations are forward-only — rollback requires a compensating migration script.
4. Alert fires to `#ovds-alerts` Slack channel and `admin@ovds.com.et`.

---

## 25. Monitoring & Observability

### 25.1 Application Metrics

| Metric | Collection Method | Alert Threshold |
|--------|-------------------|-----------------|
| API latency (p95) | NestJS `@UseInterceptors(MetricsInterceptor)` | > 800ms |
| Error rate (5xx) | `AllExceptionsFilter` → metrics counter | > 1% of requests |
| Sync queue depth | `GET /api/health/detailed` → `queueDepth` | > 1,000 pending |
| Dashboard load time | Browser `PerformanceObserver` (RUM) | > 1.5s |
| WebSocket connections | `WebsocketGateway` connected clients count | < 50% of expected |

### 25.2 Logging Strategy

```typescript
// Structured JSON logging for production
import { Logger } from '@nestjs/common';

export class StructuredLogger {
  constructor(private readonly context: string) {}

  info(message: string, meta?: Record<string, unknown>) {
    console.log(JSON.stringify({ level: 'info', context: this.context, message, ...meta, timestamp: new Date().toISOString() }));
  }

  error(message: string, err?: Error, meta?: Record<string, unknown>) {
    console.error(JSON.stringify({
      level: 'error',
      context: this.context,
      message,
      stack: err?.stack,
      ...meta,
      timestamp: new Date().toISOString(),
    }));
  }
}
```

### 25.3 Health Checks

The `/health/detailed` endpoint returns a composite health score:

```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  dbConnection: 'OK' | 'ERROR';
  ovdsSummary: { ar: number; ap: number; cash: number; netPosition: number };
  healthScore: { overall: number; grade: 'A' | 'B' | 'C' | 'D' | 'F' };
  uptime: number;
}
```

The health grade is computed from the `FinancialHealthScore` formula: A ≥ 80, B ≥ 65, C ≥ 50, D ≥ 35, F < 35.

### 25.4 User Analytics (Privacy-Compliant)

Only aggregate, anonymized page-view counts are tracked:

```typescript
// Lightweight RUM — no PII collected
export function trackPageView(page: string) {
  if (typeof window !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/pageview', JSON.stringify({
      page,
      timestamp: Date.now(),
      referrer: document.referrer,
    }));
  }
}
```

No user identifiers, session IDs, or personal data are sent to analytics endpoints.

---

## 26. Developer Onboarding & Documentation

### 26.1 Getting Started (5 Minutes)

```bash
# 1. Clone the repo
git clone <ovds-repo>
cd nxfk

# 2. Install dependencies
npm install

# 3. Start MySQL (XAMPP on Windows)
C:\xampp\mysql_start.bat
mysql -u root -e "CREATE DATABASE ovds CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Apply schema & seed
npm run db:push
npm run seed

# 5. Start everything
npm run dev:all
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api
# Swagger docs: http://localhost:3000/api/docs
```

### 26.2 Coding Standards

| Area | Rule |
|------|------|
| **TypeScript** | Strict mode in frontend; no `any` without justification |
| **Imports** | Grouped: 1) React/external, 2) internal services/hooks/context, 3) components, 4) types |
| **Naming** | `kebab-case` for files/folders, `PascalCase` for components/types, `camelCase` for variables/functions |
| **Prisma** | Never query across tenants — always include `where: { companyId }` |
| **Transactions** | Use `prisma.$transaction([...])` for multi-model writes |
| **Error handling** | Use NestJS built-in exceptions (`NotFoundException`, `ConflictException`, `BadRequestException`) |
| **Audit logging** | Every write operation calls `AuditLogService.log()` |
| **RBAC** | Guard all routes with `@Roles()` + `CompanyGuard`; check permissions on frontend with `<Can>` |
| **Testing** | New services must have a `*.spec.ts` with at least 3 test cases |
| **Commits** | Conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:` |

### 26.3 Design Token Quick Reference

When building new UI components, always use the design token system from `@ovds/design-system`:

```css
/* Colors */
color: var(--ovds-color-foreground);     /* #0f172a light / #f8fafc dark */
background: var(--ovds-color-background); /* #ffffff light / #0f172a dark */

/* Typography */
font-family: var(--ovds-font-sans);      /* Inter, system-ui, sans-serif */
font-size: var(--ovds-font-size-base);    /* 1rem */

/* Spacing */
padding: var(--ovds-space-4);             /* 1rem */
gap: var(--ovds-space-3);                 /* 0.75rem */

/* Border radius */
border-radius: var(--ovds-radius-md);     /* 0.375rem */

/* Shadows */
box-shadow: var(--ovds-shadow-sm);        /* Subtle elevation */
```

Dark mode is applied via CSS custom properties on `<html>`, which swap all token values automatically.

### 26.4 Keyboard Shortcuts Cheat Sheet

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Command palette (global search & actions) |
| `Ctrl+N` / `Cmd+N` | New invoice |
| `Ctrl+B` / `Cmd+B` | New bill |
| `Ctrl+J` / `Cmd+J` | New journal entry |
| `Ctrl+S` / `Cmd+S` | Save current form |
| `G → D` | Navigate to Dashboard |
| `G → I` | Navigate to Sales → Invoices |
| `G → P` | Navigate to Payroll |
| `G → L` | Navigate to Accounting |
| `G → N` | Navigate to Notifications |
| `G → S` | Navigate to Settings |
| `Alt+Left` / `Alt+Right` | Navigate document stack |
| `Escape` | Close modal, palette, or drawer |
| `?` | Open keyboard shortcuts modal |
| `A` | Toggle activity feed drawer |
| `D` | Toggle dashboard manager |
| `W` | Toggle company setup wizard |

### 26.5 Documentation Standards

All documentation in the `docs/` directory follows a consistent structure:

1. **Title** with a brief descriptor
2. **Overview** paragraph (what and why)
3. **Prerequisites** (if any)
4. **Step-by-step instructions** (numbered, with code blocks)
5. **Troubleshooting** (common errors + fixes)
6. **References** (links to related docs)

---

---

## 27. packages/ui Component Taxonomy

### 27.1 Component Tiers

| Tier | Purpose | Examples | Import |
|---|---|---|---|
| **Primitives** | Input, Button, Badge, Dialog | \Button\, \Input\, \Badge\ | \@ovds/ui\ |
| **Composites** | ovds-specific grouped UI | \TaxRow\, \StatusBadge\, \StatsCard\ | \@ovds/ui\ |
| **Layout** | Page shell, wrappers, grids | \AppPage\, \PageWrapper\, \BentoGrid\ | \@ovds/ui\ |
| **Enterprise** | Akaunting-grade domain widgets | \DashboardSlider\, \DocStackLayout\, \CommandPalette\ | \@ovds/ui\ |
| **V&V** | Verification & Validation flow | \VVWizardHeader\, \VVSummaryCard\ | \@ovds/ui\ |

### 27.2 Design Token System

All visual decisions flow from a single token file so the dark mode, brand swap, and enterprise density mode are trivial:

\\\	ypescript
// packages/design-system/tokens.ts
export const colors = {
  background: '#ffffff',
  foreground: '#0f172a',
  primary: { DEFAULT: '#0f172a', foreground: '#ffffff' },
  secondary: { DEFAULT: '#f1f5f9', foreground: '#0f172a' },
  muted: { DEFAULT: '#f8fafc', foreground: '#64748b' },
  accent: { DEFAULT: '#f1f5f9', foreground: '#0f172a' },
  destructive: { DEFAULT: '#ef4444', foreground: '#ffffff' },
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#0f172a',
};

export const typography = {
  fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
  },
};

export const spacing = {
  0: '0px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
};

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

export const layout = {
  sidebarWidth: '16rem',
  sidebarCollapsedWidth: '4rem',
  headerHeight: '3.5rem',
  contentMaxWidth: '1400px',
};

export const compact = {
  density: 'comfortable', // 'compact' | 'comfortable' | 'spacious'
  tableRowHeight: '2.5rem',
  tableCellPadding: '0.75rem 1rem',
};

export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

export const darkColors = {
  background: '#0f172a',
  foreground: '#f8fafc',
  primary: { DEFAULT: '#f8fafc', foreground: '#0f172a' },
  secondary: { DEFAULT: '#1e293b', foreground: '#f8fafc' },
  muted: { DEFAULT: '#1e293b', foreground: '#94a3b8' },
  accent: { DEFAULT: '#1e293b', foreground: '#f8fafc' },
  destructive: { DEFAULT: '#ef4444', foreground: '#ffffff' },
  border: '#334155',
  input: '#334155',
  ring: '#f8fafc',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const mediaQueries = {
  sm: \@media (min-width: \)\,
  md: \@media (min-width: \)\,
  lg: \@media (min-width: \)\,
  xl: \@media (min-width: \)\,
  '2xl': \@media (min-width: \)\,
};

export const iconSizes = {
  xs: '0.75rem',
  sm: '1rem',
  md: '1.25rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '2.5rem',
};

export const statusColors = {
  success: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  warning: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  danger: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  info: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  neutral: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
};

export const chartColors = [
  '#0f172a',
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#be185d',
];

export const chartGradients = [
  { from: '#0f172a', to: '#2563eb' },
  { from: '#16a34a', to: '#0891b2' },
  { from: '#dc2626', to: '#ea580c' },
];

export { print as printTokens } from './print';
\\\

### 27.3 Enterprise Density Modes

The UI supports three density modes selectable per user:

- **Compact**: 2.25rem table rows, 0.5rem cell padding — for power users processing high volumes.  
- **Comfortable** (default): 2.75rem rows, 0.75rem padding — balanced for daily use.  
- **Spacious**: 3.5rem rows, 1rem padding — for presentations, demos, or accessibility needs.

Mode preference is stored in \localStorage\ and applied via CSS custom properties on the \<html>\ element.

### 27.4 Dark Mode Architecture

Dark mode is **not** a simple color swap. It is a first-class theme with:

- **Semantic tokens**: \colors.background\, \colors.foreground\, etc., switch values.  
- **Elevation-aware surfaces**: Cards in dark mode use \#1e293b\ with subtle border \#334155\ to create depth.  
- **Chart and data visualization**: Sparklines, bar charts, and KPI cards use desaturated chart colors to reduce eye strain.  
- **Print styles**: Dark mode is ignored for print; \printTokens\ enforce white backgrounds.

Activation methods:
- Toggle in user settings.  
- Auto-detect via \prefers-color-scheme\ media query.  
- Override via URL parameter \?theme=dark\ for demos.

### 27.5 Brand Customization

Tenants can replace the primary brand color without touching component code:

\\\	ypescript
// apps/frontend/src/main.tsx
import { ThemeProvider } from '@ovds/ui';
import { brand } from './config/brand';

export default function App() {
  return (
    <ThemeProvider
      theme="system"
      brandColor={brand.primary}
      logo={brand.logo}
      companyName={brand.companyName}
    >
      <Routes />
    </ThemeProvider>
  );
}
\\\

The \ThemeProvider\ injects CSS custom properties:

\\\css
:root {
  --brand-primary: #0f172a;
  --brand-primary-foreground: #ffffff;
}
\\\

All components reference \ar(--brand-primary)\ so the change propagates instantly.

### 27.6 Keyboard Shortcuts

| Shortcut | Action | Context |
|---|---|---|
| \Ctrl+K\ / \Cmd+K\ | Open command palette | Global |
| \Ctrl+N\ / \Cmd+N\ | New invoice | Sales module |
| \Ctrl+B\ / \Cmd+B\ | New bill | Purchases module |
| \Ctrl+J\ / \Cmd+J\ | New journal entry | Accounting module |
| \Ctrl+S\ / \Cmd+S\ | Save current form | Any form |
| \Ctrl+E\ / \Cmd+E\ | Export current table | Any list |
| \Ctrl+F\ / \Cmd+F\ | Focus search input | Any list |
| \Esc\ | Close modal / palette / drawer | Global |
| \Alt+Left\ | Navigate back | Document stack |
| \Alt+Right\ | Navigate forward | Document stack |

Shortcuts are discoverable via the **Command Palette** Help tab and the **Keyboard Shortcuts** settings page.

### 27.7 Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|---|---|
| **Keyboard navigation** | All interactive elements reachable via Tab; focus ring visible (\
ing-2\) |
| **Screen reader labels** | \ria-label\ on icon-only buttons; \
ole\ attributes on custom widgets |
| **Color contrast** | All text meets 4.5:1 contrast ratio against background |
| **Focus management** | Modals trap focus; focus returns to trigger on close |
| **Error identification** | Errors linked to fields via \ria-describedby\; live region announces validation |
| **Motion preference** | \prefers-reduced-motion\ disables all CSS transitions and JS animations |

### 27.8 Internationalization (i18n)

- **Framework**: \i18next\ + \
eact-i18next\.  
- **Supported locales**: \n\ (English), \m\ (Amharic), \om\ (Oromigna), \	i\ (Tigrinya), \so\ (Somali), \r\ (Arabic).  
- **Date formatting**: Ethiopian calendar (\@ovds/shared\ utilities) alongside Gregorian.  
- **Currency formatting**: \Intl.NumberFormat\ with locale-aware symbol placement and decimal delimiters.  
- **RTL support**: Arabic layout mirrors via \dir=\"rtl\"\ on the root element; Tailwind logical properties used throughout.

### 27.9 Error Handling and Empty States

Every list and detail page follows a consistent error/empty state contract:

- **Loading**: \Skeleton\ placeholders matching the final card/row shape.  
- **Empty**: \EmptyState\ component with icon, title, description, and primary action.  
- **Error**: \NotificationBanner\ with retry action; error details exposed via \ aria-details \.  
- **Partial failure**: Bulk actions show counts of succeeded/failed rows with per-row retry.

### 27.10 Offline-First UI Patterns

- **Sync status bar**: Fixed bottom bar showing queue depth, last sync time, and connection state.  
- **Optimistic mutations**: UI updates immediately; background sync reconciles silently.  
- **Conflict resolution**: When server rejects an optimistic update, the row enters \conflict\ state with side-by-side diff and accept/reject actions.  
- **Offline banner**: Top-of-page non-blocking banner: "You are offline. 3 changes queued."  
- **Read-only mode**: When offline and local cache is stale, non-critical edit buttons are disabled with tooltip explaining why.

---

## 28. Modern UX Patterns & Interaction Design

This section closes the remaining UX gaps by codifying interaction patterns that distinguish modern enterprise applications from legacy tools.

### 28.1 Mobile-First Responsive Patterns

Enterprise UX is no longer desktop-only. Field accountants, warehouse managers, and traveling salespeople consume OVDS on tablets and phones. Every layout must pass the **mobile touch target test**: 44×44px minimum interactive area, with at least 8px spacing between targets.

| Pattern | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| **Sidebar** | Sticky, collapsible | Overlay drawer | Bottom navigation bar |
| **Tables** | Full-width with sticky headers | Card-list hybrid | Stacked cards with expand |
| **Forms** | Multi-column grids | Single column | Single column + sticky CTA |
| **Command Palette** | `Ctrl+K` | `Cmd+K` | FAB → search expand |
| **Charts** | Full interactive tooltips | Touch-friendly tooltips | Simplified sparklines |

**Touch-specific rules:**
- Eliminate hover-dependent affordances. Every action must be reachable by tap.
- Use `touch-action: manipulation` to eliminate 300ms tap delay.
- Inline actions slide in from the right edge (swipe gesture) on mobile tables.
- Sticky bottom action bar on forms: "Save", "Cancel", "Delete" always visible.

### 28.2 Micro-Interactions & Motion Design

Motion is functional, not decorative. It confirms actions, establishes spatial relationships, and reduces cognitive load.

**Core motion principles:**
- **Duration**: Fast (150ms) for micro-feedback (button press, checkbox), Normal (250ms) for panel transitions, Slow (350ms) for page transitions.
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` for standard transitions; spring curve (`0.34, 1.56, 0.64, 1`) for satisfying interactions like "Added to cart" or "Invoice sent".
- **Choreography**: Elements enter in sequence — skeleton → content → actions. Stagger children by 30–50ms.
- **State changes**: Success states use a brief scale pulse (1 → 1.05 → 1) plus a green flash on the affected row.

**Motion audit checklist:**
- [ ] Every button has `:active` scale or color feedback
- [ ] Page transitions use `<AnimatePresence>` with fade+slide
- [ ] Loading states use shimmer skeletons, not spinners
- [ ] Delete actions have undo toast with 5s countdown
- [ ] Form validation errors shake the field horizontally (2px, 150ms)

### 28.3 Empty States & Error Handling

Empty states are opportunities for education and conversion, not dead ends.

**Empty state hierarchy:**
1. **First visit (no data)**: Illustration + "Get started" primary CTA + 2–3 example cards showing what the page will look like.
2. **Filtered empty (data exists, none match)**: "No invoices match 'Q4'" + "Clear filters" secondary CTA + suggestion chips.
3. **Error state**: Plain-language message + "Retry" action + technical details in collapsible `<details>`.

**Error boundary patterns:**
- **Transient errors** (network timeout): Retry automatically 3× with exponential backoff; show "Retrying..." badge.
- **Validation errors**: Inline below field, red border, `aria-describedby` linked to error text. Never alert().
- **Authorization errors**: "You don't have access to view Company X" with "Request access" action (sends email to admin).
- **Conflict errors**: Side-by-side diff (yours vs. server) with "Keep mine" / "Accept theirs" / "Merge manually".

### 28.4 Onboarding & User Education

Enterprise onboarding is a **progressive disclosure curriculum**, not a 5-step modal. Users learn the product while working.

**Progressive onboarding flow:**
- **Day 1**: Empty dashboard with 3 guided task cards ("Create your first invoice", "Connect a bank", "Invite your accountant"). Each card has a 30-second video thumbnail.
- **Day 2–7**: Contextual tooltips appear on first hover of advanced features. Tooltips include a "Got it" dismiss and a "Learn more" link.
- **Day 8–30**: Feature discovery badges appear on new menu items. Badges auto-hide after 3 sessions.
- **Ongoing**: Command palette (`Ctrl+K`) has a "Help" tab with searchable shortcuts and feature docs.

**Contextual help stack:**
- Inline hint text below complex fields (e.g., "Enter TIN without dashes. 10 digits for Ethiopian entities.")
- `?` key opens keyboard shortcuts overlay with search.
- Each page has a "Docs" link in the footer pointing to the extracted module docs.
- Error messages include a "Learn why" link to relevant documentation section.

### 28.5 Notifications & Alert UX

Notifications must be **actionable, grouped, and respectful of attention**.

**Notification taxonomy:**
| Priority | Example | Behavior |
|----------|---------|----------|
| **Critical** | "Invoice #1234 payment failed — bank declined" | Modal banner, sound, persistent until dismissed |
| **Warning** | "Your VAT filing is due in 3 days" | Toast, auto-dismiss after 8s, clickable to navigate |
| **Info** | "New tax rate update available" | Toast, auto-dismiss after 5s, non-blocking |
| **Success** | "Journal entry posted successfully" | Toast, auto-dismiss after 3s, undo available for 10s |

**Notification center (bell icon):**
- Groups by date: "Today", "Yesterday", "Last 7 days", "Older".
- Per-item actions: "View invoice", "Dismiss", "Snooze 1 hour".
- Bulk actions: "Mark all read", "Clear older than 30 days".
- Unread count badge with overflow protection (shows "99+").

### 28.6 Search, Filter & Discovery

Search is the primary navigation for power users. It must be **fast, forgiving, and predictive**.

**Search architecture:**
- **Global search** (`Ctrl+K`): Fuzzy match across invoices, bills, customers, vendors, journal entries, accounts. Results grouped by type with icons.
- **List search**: Scoped to current table; filters URL-synced so results are shareable.
- **Saved views**: Users save filter combinations as named views. Views appear as quick-filter chips above the table.
- **Recent items**: Last 10 accessed records appear in command palette when search is empty.

**Filter UX patterns:**
- **Faceted filters**: Left sidebar with checkbox trees (e.g., Tax Type: ☑ VAT ☐ TOT ☐ WHT). Active filter count shown as badge.
- **Date range**: Preset chips ("Today", "This month", "Last quarter") + custom date picker with Ethiopian calendar toggle.
- **Multi-select**: Checkbox rows + bulk action bar ("Export 12 selected", "Mark as paid").
- **Clear all**: Single "Clear filters" button resets everything and updates URL.

### 28.7 Data Visualization UX 

Charts must tell stories, not just display numbers.

**Chart interaction rules:**
- **Tooltips**: Show exact values, percentage change vs. prior period, and drill-down link. Delay 300ms to avoid flash.
- **Zoom**: Click and drag on time-series charts to zoom into a range. Double-click to reset.
- **Compare**: Toggle to overlay current year vs. prior year with muted secondary line.
- **Export**: Every chart has a "Download PNG / CSV" action in its overflow menu.

**Dashboard widget contract:**
- Every widget shows: title, time range selector, refresh button, overflow menu (export, pin, remove).
- KPI cards show: current value, trend arrow (↑ 12% vs last month), sparkline mini-chart.
- Alert widgets (e.g., "3 invoices overdue") show count + primary action ("View overdue invoices").

### 28.8 Collaboration & Context UX

Enterprise workflows involve multiple people. The UI must surface **who did what and why**.

**Presence & activity:**
- **Live cursors**: Show other users' viewport and cursor position on shared reports (optional, opt-in).
- **Activity feed**: Right drawer showing "Ahmed posted Journal #4512", "Sarah updated Invoice #1234". Click to navigate.
- **Comment threads**: Inline comments on invoices and journal entries. `@mention` notifies via email and in-app.
- **Version history**: Every editable record shows a timeline of changes with user avatar, timestamp, and diff summary.

**Delegation & handoff:**
- "Assign to" dropdown on any task or approval workflow. Assignee receives notification.
- Out-of-office status disables assignment and routes to backup with notification.
- Approval chains show visual progress: pending → approved / rejected with approver avatar and timestamp.

### 28.9 AI-Assisted UX (Emerging)

AI features must be **opt-in, explainable, and auditable**.

**AI patterns:**
- **Smart suggestions**: "Based on your last 5 invoices, the due date is likely 30 days." User can accept with one click or ignore.
- **Anomaly detection**: "This invoice amount is 3× the customer's average. Flag for review?" with "Confirm" / "Dismiss".
- **Natural language search**: "Show me all invoices from last month over 50,000 ETB" parses to structured query.
- **Predictive categorization**: Suggests chart-of-accounts code for new journal entries based on description text.

**AI transparency rules:**
- Every AI-generated value shows a sparkle icon with tooltip: "Suggested by AI based on 47 similar entries."
- Users can disable AI features per module in Settings → AI Preferences.
- All AI suggestions are logged to `AuditLog` with `source: 'ai-suggestion'`.

---

## 29. Summary

This blueprint closes every gap in the original OVDS specification by replacing fragmented placeholders with a complete, implementable architecture:

- **UI/UX**: Akaunting-inspired dashboard, 11 verticals, inline math, command palette, document stack, density modes.  
- **Modern UX Patterns**: Mobile-first responsive design, micro-interactions, motion design, progressive onboarding, notification taxonomy, search/filter UX, data visualization, collaboration context, AI-assisted UX.  
- **Nx Monorepo**: Clear separation between \pps/\ and \packages/\ with strict import boundaries.  
- **Accounting Engine**: Full double-entry Prisma schema, balanced invariants, auto-journaling services.  
- **Business Operations**: Bills, POs, banking, HR, payroll, fixed assets, inventory, stock movements.  
- **Ethiopian Compliance**: MoR / ERCA / AABE event bus, TOT/VAT/WHT/EXCISE/Pension, e-Tax XML pipeline.  
- **Offline Resilience**: SQLite offline queue, idempotent queues, exponential backoff, sync status indicator.  
- **Smart Platform**: Client portal decoupling, BullMQ background automation, IoT ingestion, event-driven broker.  
- **IAM & Control**: RBAC, SSO, MFA, audit logs, central control center.  
- **Deployment**: Cloud Kubernetes + on-premise air-gapped from one codebase.  
- **Testing & CI**: Unit/integration/E2E matrix, GitHub Actions pipeline, Playwright, Vitest.  
- **UI Component System**: 5-tier taxonomy, design tokens, density modes, dark mode, brand customization.  
- **Enterprise UX**: Data density, 10,000-row scalability, saved views, bulk actions, progressive disclosure.

## 30. AI-Powered Platform Features & Modern UX

OVDS integrates artificial intelligence and machine learning across every layer of the financial workflow, automating manual accounting processes while maintaining the strict double-entry discipline required for regulatory compliance.

### 30.1 Core Platform Architecture

- **All-in-one AI-driven ecosystem** — unified platform for bookkeeping, reconciliation, and reporting.
- **AI-powered bookkeeping** with real-time financial insights and anomaly detection.
- **AI-powered business checking accounts** engineered for global scale and multi-entity support.
- **Multi-entity business support** through separate localized subscriptions with consolidated reporting.
- **Custom API integrations**, specialized financial reports, and personalized onboarding.

### 30.2 Advanced Data Extraction & Intelligent Document Processing

- **Line-by-line data extraction** capability from invoices, receipts, and tax documents.
- **Automated fraud detection** protocols within document verification workflows.
- **Comprehensive AI-driven, mobile-friendly receipt capture** infrastructure.
- **Automated document fetching** directly from email and connected third-party platforms.
- **Specialized document processing** workflows for corporate invoices, receipts, and tax documents.
- **Advanced bank statement normalization** and multi-line item extraction engines.

### 30.3 Workflow & Expense Automation

- **Automated pre-accounting workflows** that reduce manual data entry.
- **Real-time expense automation** and mileage tracking.
- **Automated transaction approval recommendations** based on historical patterns.
- **Comprehensive expense claim approvals** and structured management workflows.
- **Unified automated expense management** featuring strict corporate spend limits.
- **Automated digital receipt collection**, matching matrix, and employee repayments.

### 30.4 Global Accounts Payable, Procurement & Banking

- **Comprehensive accounts payable** and strategic procurement tools.
- **Local currency corporate card issuing** across multiple jurisdictions.
- **Centralized category and vendor spend controls** via corporate cards.
- **Secure supplier invoice payment** capabilities with automated reconciliation.
- **Automatic bill pay infrastructure** for global vendors and employee payroll.

### 30.5 Analytics, Predictive Insights & System Integrations

- **Predictive financial insights** and advanced decision-making support.
- **Dynamic financial forecasting models** using current and historical data.
- **Cross-platform syncing** of sales data across online marketplaces and digital storefronts.
- **Deep integration capabilities** across major accounting systems, applications, and ERP software.
- **Enterprise resource planning (ERP) customized extensions** and workflow configurations.
- **Automated client health checks** utilizing live data to monitor activity and isolate risks.

### 30.6 Human-in-the-Loop Support & Enterprise Success

- **Dedicated corporate finance team** for strategic planning, analysis, and tailored advisory.
- **Custom corporate policy** and localized workflow configurations.
- **Dedicated account management and client success teams** with 24/7 global support.
- **Full-scale system integration setup**, validation testing, and structured employee training.

These AI-powered capabilities are woven into OVDS's core accounting engine, ensuring that automation never compromises the mathematical precision, auditability, or regulatory compliance that define the platform.



