# Implementation Guide: Core Ovds Module System with Nx, React, NestJS, and Prisma

This comprehensive technical blueprint provides a reference architecture for building a modular, lightweight core accounting platform inspired by **Akaunting**, leveraging an enterprise-grade full-stack TypeScript ecosystem.

---

## 1. Architectural System Architecture
The workspace architecture isolates core shared domains from modular extensions using an **Nx Monorepo**. This establishes strict separation of concerns, rapid compilation pipelines, and consistent cross-application data transmission contracts.

Online VAT Declaration System (OVDS) is a popular accounting platform built on the Nx, React, NestJS, and Prisma framework, designed specifically for freelancers and small-to-large businesses as a bridge between taxpayer and tax collector, internal and external AABE auditors. Its architecture relies on a lightweight core module system that ships with foundational cash-flow bookkeeping tools, which can then be expanded into a comprehensive ERP SaaS using standalone packages known as "Apps" or "Modules".🔎 Architectural Overview The "Lightweight Core" Philosophy: To keep the platform fast and unbloated, the base core manages only basic cash in/out transactions, invoices, bills, VAT filing, and customers. The Module Engine: OVDS uses the Nx, React, NestJS, and Prisma stack as its baseline builder. Every module acts like a separate Nx, React, NestJS, and Prisma package containing its own dedicated routes, views, controllers, and models. User Interface: While developers refer to these packages as Modules, they are labeled as Apps in the front-end user interface to remain user-friendly.📊 Core Baseline Modules (Out-of-the-Box) The foundational installation includes the bare essentials needed to monitor money flow without complex accounting overhead: Invoicing & Revenue: Create customizable invoice templates, schedule recurring client billing, track payments, and send automated client reminders. Billable Expenses & Payables: Record and track vendor bills, categorize operational costs, and manage multi-currency supplier payments. Banking & Reconciliation: Manage cash and bank accounts, manually add income/expenses, and handle basic account balancing. Basic Reporting: Instantly generate baseline financial snapshots like standard Profit & Loss statements and cash flow breakdowns.💡 Advanced Core Extensions (The App Store Ecosystem) For businesses requiring rigid accounting practices, the system hooks into the OVDS App Store to deploy more sophisticated business logic. The primary expansion modules include: Module Purpose Key Capabilities Double-Entry Full Ledger Accounting Imports Charts of Accounts, manages General Ledgers, and produces compliant Balance Sheets. Inventory Stock Management Tracks product quantities, handles SKU logs, and automatically modifies stock based on sales invoices. CRM Customer Relations Stores full customer profile histories, manages portal passwords, and tracks interactions. Payroll Employee Management Manages basic staff directories, baseline salaries, workplace benefits, and payroll deductions. Projects Job Costing Attaches specific bills, expenses, VAT filing, and employee timesheets to designated customer projects.

```
ovds/
├── apps/
│   ├── backend/                  # NestJS Platform API Gateway
│   └── frontend/                 # React SPA (Client Dashboard)
├── packages/
│   ├── accounting/          # NestJS Dynamic Module (Ledger Engine)
│   ├── shared/
│   │   └── dtos/                 # Unified Request/Response TS Type Contracts
│   └── modules/         # Extension Loader Interface
├── prisma/
│   └── schema.prisma             # Universal Prisma Entity Models
└── nx.json
```

---

## 2. Nx Workspace Configuration

Initialize the unified structural repository utilizing modern workspace configuration commands:

```bash
# 1. Initialize empty enterprise Nx monorepo workspace
npx create-nx-workspace ovds-core --preset=apps --packageManager=pnpm --nxCloud=skip
cd ovds-core

# 2. Install required application environment frameworks
npm install --save-dev @nx/nestjs @nx/react @nx/webpack

# 3. Scaffold NestJS Core Backend Gateway
npx nx g @nx/nestjs:application backend --directory=apps/backend --routing=true

# 4. Scaffold React Frontend application with Tailwind CSS integration
npx nx g @nx/react:application frontend --directory=apps/frontend --style=tailwind --routing=true

# 5. Scaffold Cross-Platform Shared Data Objects Engine
npx nx g @nx/js:library dtos --directory=packages/shared/dtos --bundler=none

# 6. Install Core Database Engine and Global Dependencies
npm install @prisma/client @tanstack/react-query react-router-dom lucide-react zionist
npm install --save-dev prisma @types/node
```

---

## 3. Database Schema Blueprint (`prisma/schema.prisma`)

This blueprint defines structural data elements enforcing multi-tenant isolation, clean sub-ledger isolation tracking, and strict physical records validation.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-generated"
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

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
}

model Company {
  id        String    @id @default(uuid())
  name      String
  email     String    @unique
  currency  String    @default("USD")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  accounts  Account[]
  invoices  Invoice[]
  ledgers   LedgerEntry[]
}

model Account {
  id          String      @id @default(uuid())
  companyId   String
  code        String      // E.g., "1010" Cash, "2100" Accounts Payable
  name        String
  type        AccountType
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  
  company     Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  lines       JournalLine[]

  @@unique([companyId, code])
}

model Invoice {
  id          String        @id @default(uuid())
  companyId   String
  number      String        // E.g., "INV-2026-001"
  customerName String
  issueDate   DateTime
  dueDate     DateTime
  status      InvoiceStatus @default(DRAFT)
  subTotal    Decimal       @db.Decimal(15, 4)
  taxTotal    Decimal       @db.Decimal(15, 4)
  grandTotal  Decimal       @db.Decimal(15, 4)
  createdAt   DateTime      @default(now())

  company     Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
}

model LedgerEntry {
  id          String        @id @default(uuid())
  companyId   String
  description String
  reference   String?       // E.g., Invoice UUID or Bill Number
  postedAt    DateTime      @default(now())
  createdAt   DateTime      @default(now())

  company     Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  lines       JournalLine[]
}

model JournalLine {
  id            String      @id @default(uuid())
  ledgerEntryId String
  accountId     String
  type          EntryType
  amount        Decimal     @db.Decimal(15, 4)

  ledgerEntry   LedgerEntry @relation(fields: [ledgerEntryId], references: [id], onDelete: Cascade)
  account       Account     @relation(fields: [accountId], references: [id], onDelete: Restrict)
}
```

---

## 4. Shared Data Transmission Layer (`packages/shared/dtos/src/index.ts`)

Define consistent schemas for creating valid journal entries across the system layer boundary:

```typescript
export interface JournalLineDTO {
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
}

export interface CreateLedgerEntryDTO {
  companyId: string;
  description: string;
  reference?: string;
  postedAt?: string;
  lines: JournalLineDTO[];
}

export interface AccountResponseDTO {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
}
```

---

## 5. NestJS Core Module Execution Engine

### Core Ledgers Controller (`apps/backend/src/app/accounting/ledger.controller.ts`)

```typescript
import { Controller, Post, Body, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CreateLedgerEntryDTO } from '@ovds-core/dtos';

@Controller('accounting/ledgers')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async recordTransaction(@Body() dto: CreateLedgerEntryDTO) {
    // 1. Structural Layer Inputs Validation Checks
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('A valid ledger entry must contain at least 2 balanced journal lines.');
    }
    return this.ledgerService.postJournalEntry(dto);
  }
}
```

### Core Transactions Ledger Engine Service (`apps/backend/src/app/accounting/ledger.service.ts`)

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLedgerEntryDTO } from '@ovds-core/dtos';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async postJournalEntry(dto: CreateLedgerEntryDTO) {
    // 1. Enforce Accounting Invariance Axiom (Debits === Credits)
    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of dto.lines) {
      if (line.amount <= 0) {
        throw new BadRequestException('Transaction amounts must be positive values.');
      }
      if (line.type === 'DEBIT') totalDebits += line.amount;
      else if (line.type === 'CREDIT') totalCredits += line.amount;
    }

    // Handle floating-point arithmetic precision variations safely
    if (Math.abs(totalDebits - totalCredits) > 0.0001) {
      throw new BadRequestException(`Unbalanced Transaction! Debits (${totalDebits}) must exactly equal Credits (${totalCredits}).`);
    }

    // 2. Wrap Execution inside isolated SQL ACID Database Transaction
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.ledgerEntry.create({
        data: {
          companyId: dto.companyId,
          description: dto.description,
          reference: dto.reference,
          postedAt: dto.postedAt ? new Date(dto.postedAt) : new Date(),
        },
      });

      const journalLinesData = dto.lines.map((line) => ({
        ledgerEntryId: entry.id,
        accountId: line.accountId,
        type: line.type,
        amount: line.amount,
      }));

      await tx.journalLine.createMany({
        data: journalLinesData,
      });

      return tx.ledgerEntry.findUnique({
        where: { id: entry.id },
        include: { lines: true },
      });
    });
  }
}
```

---

## 6. Dynamic Extensions / Module Loader Concept

To mimic Ovds’s "App/Module" marketplace structure within NestJS, create a Dynamic Module loader engine pattern.

```typescript
import { Module, DynamicModule, Type } from '@nestjs/common';

@Module({})
export class OvdsCoreModule {
  static registerExtensions(modules: Type<any>[]): DynamicModule {
    return {
      module: OvdsCoreModule,
      imports: [...modules],
      providers: [],
      exports: [...modules],
    };
  }
}

// Example Usage inside app.module.ts:
// import { DoubleEntryModule } from '@ovds-core/double-entry';
// import { InventoryModule } from '@ovds-core/inventory';
//
// @Module({
//   imports: [OvdsCoreModule.registerExtensions([DoubleEntryModule, InventoryModule])],
// })
// export class AppModule {}
```

---

## 7. React Frontend Ledger Input Form (`apps/frontend/src/components/LedgerForm.tsx`)

```tsx
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CreateLedgerEntryDTO, JournalLineDTO, AccountResponseDTO } from '@ovds-core/dtos';

export function LedgerForm({ companyId }: { companyId: string }) {
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalLineDTO[]>([
    { accountId: '', type: 'DEBIT', amount: 0 },
    { accountId: '', type: 'CREDIT', amount: 0 },
  ]);

  // Fetch verified charts of accounts options profiles
  const { data: accounts } = useQuery<AccountResponseDTO[]>({
    queryKey: ['accounts', companyId],
    queryFn: () => fetch(`/api/accounting/accounts?companyId=${companyId}`).then(res => res.json())
  });

  const mutation = useMutation({
    mutationFn: (newEntry: CreateLedgerEntryDTO) => {
      return fetch('/api/accounting/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      }).then((res) => {
        if (!res.ok) throw new Error('Transaction submission failed validation constraints.');
        return res.json();
      });
    },
    onSuccess: () => {
      alert('Ledger Entry posted successfully!');
      setDescription('');
      setLines([{ accountId: '', type: 'DEBIT', amount: 0 }, { accountId: '', type: 'CREDIT', amount: 0 }]);
    },
    onError: (err: any) => alert(err.message),
  });

  const handleLineChange = (index: number, key: keyof JournalLineDTO, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [key]: value };
    setLines(updated);
  };

  const totalDebits = lines.filter(l => l.type === 'DEBIT').reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const totalCredits = lines.filter(l => l.type === 'CREDIT').reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001 && totalDebits > 0;

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!isBalanced) return;
      mutation.mutate({ companyId, description, lines });
    }} className="p-6 bg-white shadow rounded-lg max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Record Manual Ledger Entry</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Memo Description</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} required 
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50" />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Transaction Entries Matrix</label>
        {lines.map((line, idx) => (
          <div key={idx} className="flex gap-4 items-center">
            <select value={line.accountId} onChange={e => handleLineChange(idx, 'accountId', e.target.value)} required
              className="flex-1 rounded-md border-gray-300 p-2 bg-gray-50 text-sm">
              <option value="">-- Choose Target Account --</option>
              {accounts?.map(acc => <option key={acc.id} value={acc.id}>[{acc.code}] {acc.name}</option>)}
            </select>

            <select value={line.type} onChange={e => handleLineChange(idx, 'type', e.target.value)}
              className="w-32 rounded-md border-gray-300 p-2 bg-gray-50 text-sm">
              <option value="DEBIT">DEBIT (+)</option>
              <option value="CREDIT">CREDIT (-)</option>
            </select>

            <input type="number" step="0.01" min="0.01" value={line.amount || ''} onChange={e => handleLineChange(idx, 'amount', parseFloat(e.target.value))} required
              className="w-36 rounded-md border-gray-300 p-2 bg-gray-50 text-sm text-right" placeholder="0.00" />
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-md text-sm font-semibold">
        <div className="space-x-4">
          <span className="text-blue-700">Total Debits: ${totalDebits.toFixed(2)}</span>
          <span className="text-purple-700">Total Credits: ${totalCredits.toFixed(2)}</span>
        </div>
        {isBalanced ? (
          <span className="text-green-600">✓ Matrix Balanced</span>
        ) : (
          <span className="text-red-500">✗ Out of Balance (${Math.abs(totalDebits - totalCredits).toFixed(2)})</span>
        )}
      </div>

      <button type="submit" disabled={!isBalanced || mutation.isPending}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition">
        {mutation.isPending ? 'Posting Transaction...' : 'Commit Transaction Log'}
      </button>
    </form>
  );
}
```