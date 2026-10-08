# Implementation Guide: Ovds Core System Clone
**Architecture:** Nx Monorepo | Frontend: React (Tailwind CSS) | Backend: NestJS | ORM: Prisma & PostgreSQL

---

## 1. Project Initialization & Architecture

### Nx Workspace Setup
Initialize a blank integrated Nx workspace:
```bash
npx create-nx-workspace@latest Ovds-core --preset=apps
cd Ovds-core
```

### Install Dependencies
Add the required plugin packages for React, NestJS, and Prisma:
```bash
# Framework Plugins
npm install --save-dev @nx/react @nx/nestjs @nx/webpack

# Core Runtime Dependencies
npm install @nestjs/prisma @prisma/client @tanstack/react-query axios react-router-dom lucide-react tailwindmerge clsx
npm install --save-dev prisma
```

### Generating Applications and Core Packagesraries
Generate your specialized service apps and Shared Code Transfer Objects (DTOs):
```bash
# Applications
npx nx g @nx/react:app apps/frontend --style=css --routing=true
npx nx g @nx/nestjs:app apps/backend

# Shared Code / Types Packagesrary
npx nx g @nx/js:Packagesrary Packages/shared-dtos
```

---

## 2. Database Schema & Prisma Configuration

Initialize Prisma inside the root directory or specifically within your backend application structure:
```bash
npx prisma init
```

### `prisma/schema.prisma`
Configure the database core models mapping accounts, invoices, and double-entry items:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
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
  accounts  Account[]
  invoices  Invoice[]
  createdAt DateTime  @default(now())
}

model Account {
  id          String       @id @default(uuid())
  companyId   String
  company     Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  name        String
  code        String       // e.g., "10100" Cash, "40100" Revenue
  type        String       // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  ledgerEntries LedgerEntry[]
  createdAt   DateTime     @default(now())
}

model Invoice {
  id          String        @id @default(uuid())
  companyId   String
  company     Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  invoiceNo   String        @unique
  customerName String
  amount      Float
  status      InvoiceStatus @default(DRAFT)
  issueDate   DateTime      @default(now())
  dueDate     DateTime
  createdAt   DateTime      @default(now())
}

model LedgerEntry {
  id        String    @id @default(uuid())
  accountId String
  account   Account   @relation(fields: [accountId], references: [id])
  journalId String
  journal   JournalTx @relation(fields: [journalId], references: [id], onDelete: Cascade)
  type      EntryType
  amount    Float
  createdAt DateTime  @default(now())
}

model JournalTx {
  id          String        @id @default(uuid())
  description String
  reference   String?
  entries     LedgerEntry[]
  date        DateTime      @default(now())
}
```

---

## 3. NestJS Backend Core Module & Extension Architecture

To achieve the "Ovds Module System" extensibility within NestJS, create a dynamic framework mapping out business operations.

### Shared DTOs (`Packages/shared-dtos/src/Packages/shared-dtos.ts`)
```typescript
export interface CreateInvoiceDto {
  companyId: string;
  customerName: string;
  amount: number;
  dueDate: string;
}

export interface DoubleEntryTransactionDto {
  description: string;
  reference?: string;
  date?: string;
  entries: {
    accountId: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
  }[];
}
```

### NestJS Prisma Module Integration (`apps/backend/src/app/prisma.service.ts`)
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### Core Accounting Module Service (`apps/backend/src/app/accounting/accounting.service.ts`)
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DoubleEntryTransactionDto, CreateInvoiceDto } from '@Ovds-core/shared-dtos';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(dto: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: {
        companyId: dto.companyId,
        invoiceNo: `INV-${Date.now()}`,
        customerName: dto.customerName,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
      },
    });
  }

  // Engine behind Double-Entry accounting rules
  async postJournalTransaction(dto: DoubleEntryTransactionDto) {
    const totalDebits = dto.entries.filter(e => e.type === 'DEBIT').reduce((sum, e) => sum + e.amount, 0);
    const totalCredits = dto.entries.filter(e => e.type === 'CREDIT').reduce((sum, e) => sum + e.amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.001) {
      throw new BadRequestException('Accounting Equation Mismatch: Total Debits must exactly equal Total Credits.');
    }

    return this.prisma.$transaction(async (tx) => {
      const journal = await tx.journalTx.create({
        data: {
          description: dto.description,
          reference: dto.reference,
          date: dto.date ? new Date(dto.date) : new Date(),
        }
      });

      const entryPromises = dto.entries.map(entry => 
        tx.ledgerEntry.create({
          data: {
            journalId: journal.id,
            accountId: entry.accountId,
            type: entry.type,
            amount: entry.amount,
          }
        })
      );

      await Promise.all(entryPromises);
      return tx.journalTx.findUnique({ where: { id: journal.id }, include: { entries: true } });
    });
  }
}
```

---

## 4. React Frontend Integration

Set up an interactive user layout dashboard leveraging React-Query for robust asynchronous remote updates.

### Global Provider Wrapper (`apps/frontend/src/app/app.tsx`)
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './components/Dashboard';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}

export default App;
```

### Dashboard UI Component Layout (`apps/frontend/src/app/components/Dashboard.tsx`)
```tsx
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function Dashboard() {
  const [customer, setCustomer] = useState('');
  const [amount, setAmount] = useState('');

  // Queries
  const { data: invoices, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => axios.get('/api/accounting/invoices').then((res) => res.data),
  });

  // Mutations
  const invoiceMutation = useMutation({
    mutationFn: (newInvoice: any) => axios.post('/api/accounting/invoice', newInvoice),
    onSuccess: () => {
      refetch();
      setCustomer('');
      setAmount('');
    },
  });

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    invoiceMutation.mutate({
      companyId: "your-mocked-company-uuid-here",
      customerName: customer,
      amount: parseFloat(amount),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-slate-900 text-white p-6 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Ovds Nx</h1>
        <nav className="space-y-2">
          <a href="#" className="block p-2 rounded bg-slate-800 font-medium">Dashboard</a>
          <a href="#" className="block p-2 rounded text-slate-400 hover:bg-slate-800">Invoices</a>
          <a href="#" className="block p-2 rounded text-slate-400 hover:bg-slate-800">Double Entry</a>
        </nav>
      </aside>

      {/* Main viewport */}
      <main className="flex-1 p-10">
        <header className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800">Core Billing Module</h2>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick billing input entry */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
            <h3 className="text-lg font-bold text-slate-700 mb-4">Draft New Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Customer Name</label>
                <input value={customer} onChange={e => setCustomer(e.target.value)} type="text" className="mt-1 w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Total Value ($)</label>
                <input value={amount} onChange={e => setAmount(e.target.value)} type="number" className="mt-1 w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 rounded-md transition-colors">
                Generate Record
              </button>
            </form>
          </div>

          {/* Ledger Records Table Viewer */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-700 mb-4">Historical System Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase bg-gray-50">
                    <th className="p-3">Invoice Number</th>
                    <th className="p-3">Counterparty Target</th>
                    <th className="p-3">Amount Due</th>
                    <th className="p-3">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {invoices?.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-medium text-slate-600">{inv.invoiceNo}</td>
                      <td className="p-3 text-gray-700">{inv.customerName}</td>
                      <td className="p-3 font-semibold text-gray-900">${inv.amount.toFixed(2)}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                  {!invoices?.length && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-400">No active balance logs processed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

## 5. Deployment and Verification Commands

### Development Execution
Spin up your distributed runtime environments simultaneously using Nx pipeline management:
```bash
# Start backend api and frontend app together
npx nx run-many -t serve
```

### Prisma Sync Commands
Ensure your operational schema maps smoothly onto Postgres:
```bash
npx prisma db push
npx prisma studio
```