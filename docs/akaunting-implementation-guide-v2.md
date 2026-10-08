# Architecture Design Guide: Modular Micro-ERP System
**Stack:** Nx Workspace Monorepo • NestJS Core • React Presentation Layer • Prisma ORM

---

## 🏛️ System Architecture Overview
This blueprint details a modern, loosely coupled architecture inspired by the **Ovds core module engine**. It leverages **Nx** to cleanly separate apps from business logic Packagesraries, allowing you to load or toggle peripheral operational packages (like Payroll or Inventory) dynamically without polluting the core ledger engine.

```
📁 Ovds/
├── 📁 apps/
│   ├── 📁 backend/                # Core NestJS API Gateway & Base Engine
│   └── 📁 portal/               # Core React Dashboard App
├── 📁 Packages/
│   ├── 📁 shared/
│   │   └── 📁 dtos/               # Universal Shared Interface Definitions
│   └── 📁 modules/                # Plug-and-Play Application Modules
│       ├── 📁 double-entry/       # Ledger / Journal Entry Extension
│       └── 📁 inventory/          # Stock Tracking Extension
└── 📄 prisma/schema.prisma        # Universal Database Context Schema
```

---

## 📦 Step 1: Initialize the Monorepo Infrastructure

Run the following terminal sequences to generate the unified codebase structure with strict typescript boundaries.

```bash
# 1. Provision an empty integrated Nx workspace
npx create-nx-workspace@latest Ovds-monorepo --preset=apps --packageManager=pnpm
cd Ovds-monorepo

# 2. Add plugin capabilities for NestJS and React
npm install --save-dev @nx/nest @nx/react

# 3. Create the concrete target runtimes
npx nx g @nx/nest:application apps/backend --directory=apps/backend --portalProject=portal
npx nx g @nx/react:application apps/portal --directory=apps/portal --style=tailwind --routing=true

# 4. Generate the universal domain type Packagesrary 
npx nx g @nx/js:Packagesrary Packages/shared/dtos --directory=Packages/shared/dtos --bundler=none
```

---

## 💾 Step 2: Database Ledger Schema (Prisma ORM)

Accounting architectures dictate rigorous structural normalization. Initialize Prisma and paste this balance-compliant schema into `prisma/schema.prisma`.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
}

enum EntryType {
  DEBIT
  CREDIT
}

model Company {
  id        String    @id @default(uuid())
  name      String
  accounts  Account[]
  invoices  Invoice[]
  createdAt DateTime  @default(now())
}

model Account {
  id            String        @id @default(uuid())
  companyId     String
  company       Company       @relation(fields: [companyId], references: [id])
  code          String        // e.g., "1010" Cash, "2100" Accounts Payable
  name          String
  ledgerEntries LedgerEntry[]
  
  @@unique([companyId, code])
}

model Invoice {
  id          String        @id @default(uuid())
  companyId   String
  company     Company       @relation(fields: [companyId], references: [id])
  invoiceNum  String
  customerName String
  amount      Decimal       @db.Decimal(18, 4)
  status      InvoiceStatus @default(DRAFT)
  issueDate   DateTime      @default(now())
  dueDate     DateTime
}

model JournalTransaction {
  id          String        @id @default(uuid())
  description String
  postedAt    DateTime      @default(now())
  entries     LedgerEntry[]
}

model LedgerEntry {
  id            String             @id @default(uuid())
  transactionId String
  transaction   JournalTransaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  accountId     String
  account       Account            @relation(fields: [accountId], references: [id])
  type          EntryType
  amount        Decimal            @db.Decimal(18, 4)
}
```

Deploy the structural definitions to your data infrastructure:
```bash
npm install @prisma/client
npm install --save-dev prisma
npx prisma generate
```

---

## ⚙️ Step 3: Immutability & Double-Entry Guards (NestJS Service)

The most essential rule of a financial engine is that **Debits must equal Credits ($\sum D = \sum C$)** for every isolated economic event. Below is the transactional engine executing inside `apps/backend/src/app/ledger/ledger.service.ts`.

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateJournalDto } from '@Ovds-monorepo/shared/dtos';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(dto: CreateJournalDto) {
    // 1. Calculate and enforce zero balanced mathematical invariance
    let debitSum = 0;
    let creditSum = 0;

    for (const entry of dto.entries) {
      if (entry.type === 'DEBIT') debitSum += entry.amount;
      if (entry.type === 'CREDIT') creditSum += entry.amount;
    }

    if (Math.abs(debitSum - creditSum) > 0.0001) {
      throw new BadRequestException(
        `Accounting Invariance Breach: Debits (${debitSum}) must perfectly match Credits (${creditSum}).`
      );
    }

    // 2. Commit transaction through an atomic isolated database lock
    return this.prisma.$transaction(async (tx) => {
      const txRecord = await tx.journalTransaction.create({
        data: {
          description: dto.description,
        },
      });

      const entryPromises = dto.entries.map((entry) =>
        tx.ledgerEntry.create({
          data: {
            transactionId: txRecord.id,
            accountId: entry.accountId,
            type: entry.type,
            amount: entry.amount,
          },
        })
      );

      await Promise.all(entryPromises);
      return txRecord;
    });
  }
}
```

---

## 🎨 Step 4: Reactive Dashboard Composition (React Layer)

To populate data efficiently while tracking states gracefully, implement this form component utilizing `@tanstack/react-query` inside your React client context.

```tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface EntryLine {
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
}

export function CreateJournalForm() {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState<EntryLine[]>([
    { accountId: '', type: 'DEBIT', amount: 0 },
    { accountId: '', type: 'CREDIT', amount: 0 },
  ]);

  const mutation = useMutation({
    mutationFn: async (newTx: { description: string; entries: EntryLine[] }) => {
      const res = await fetch('/api/ledger/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Transaction processing failed.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-history'] });
      alert('Journal entry safely posted to Ledger.');
    },
    onError: (err: Error) => {
      alert(`Error: ${err.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ description, entries });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-md rounded-xl max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Record Journal Entry</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Memo / Description</label>
        <input 
          type="text" 
          className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500"
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          required 
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Transaction Lines</label>
        {entries.map((entry, idx) => (
          <div key={idx} className="flex gap-4 items-center">
            <input 
              type="text" 
              placeholder="Account UUID" 
              className="flex-1 p-2 border border-gray-300 rounded-md"
              value={entry.accountId}
              onChange={(e) => {
                const updated = [...entries];
                updated[idx].accountId = e.target.value;
                setEntries(updated);
              }}
              required
            />
            <select 
              className="p-2 border border-gray-300 rounded-md"
              value={entry.type}
              onChange={(e) => {
                const updated = [...entries];
                updated[idx].type = e.target.value as 'DEBIT' | 'CREDIT';
                setEntries(updated);
              }}
            >
              <option value="DEBIT">Debit</option>
              <option value="CREDIT">Credit</option>
            </select>
            <input 
              type="number" 
              step="0.01" 
              placeholder="Amount" 
              className="w-32 p-2 border border-gray-300 rounded-md"
              value={entry.amount || ''}
              onChange={(e) => {
                const updated = [...entries];
                updated[idx].amount = parseFloat(e.target.value) || 0;
                setEntries(updated);
              }}
              required
            />
          </div>
        ))}
      </div>

      <button 
        type="submit" 
        className="w-full py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
      >
        Post to Core Ledger
      </button>
    </form>
  );
}
```

---

## ⚡ Step 5: Advanced Module Engine (NestJS App Store Architecture)

To emulate the customizable architecture of dynamic plugin registration without changing central engine source parameters, lean heavily on **NestJS Dynamic Modules**.

Create an abstract or structured registration token gateway:

```typescript
// Packages/shared/src/Packages/interfaces/extension-module.interface.ts
export interface OvdsExtensionConfig {
  moduleName: string;
  enableAutomation: boolean;
  hooks: string[];
}

// apps/backend/src/app/extensions/extension.engine.ts
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { OvdsExtensionConfig } from '@Ovds-monorepo/shared/dtos';

@Module({})
export class ExtensionEngineModule {
  static registerExtension(config: OvdsExtensionConfig): DynamicModule {
    const configProvider: Provider = {
      provide: 'EXTENSION_CONFIG',
      useValue: config,
    };

    // Dynamically mount providers or resolve internal endpoints depending on config
    return {
      module: ExtensionEngineModule,
      providers: [configProvider],
      exports: [configProvider],
    };
  }
}
```

Register extensions inside your global entry context (`apps/backend/src/app/app.module.ts`) programmatically:

```typescript
import { Module } from '@nestjs/common';
import { ExtensionEngineModule } from './extensions/extension.engine';

@Module({
  imports: [
    // Core Engine standard dependencies
    LedgerModule,
    
    // Custom plug-and-play addon module enabled dynamically from settings config
    ExtensionEngineModule.registerExtension({
      moduleName: 'AdvancedInventoryTracking',
      enableAutomation: true,
      hooks: ['BEFORE_INVOICE_POST', 'AFTER_LEDGER_COMMIT']
    }),
  ],
})
export class AppModule {}
```
