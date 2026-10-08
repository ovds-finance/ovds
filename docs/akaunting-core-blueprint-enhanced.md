# Enhanced Core Akaunting Module System Blueprint
## Built with Nx, React, NestJS, Prisma, and dynamic extension modules.

---

## 1. Monorepo Structural Blueprint (`nx.json` & Workspace Layout)

```
akaunting-workspace/
├── apps/
│   ├── frontend/             # React SPA (Tailwind + React Query)
│   └── backend/              # NestJS Core Gateway
├── libs/
│   ├── shared/
│   │   └── dtos/             # Shared TypeScript Validation Schemas (class-validator)
│   └── modules/
│       ├── double-entry/     # Dynamic Extensible Accounting Engine Module
│       └── inventory/        # Dynamic Inventory Module Core Hook
├── prisma/
│   └── schema.prisma         # Multi-tenant Transactional Schema
```

### `apps/backend/src/app/app.module.ts`
```typescript
import { Module, DynamicModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CoreAccountingModule } from './core-accounting/core-accounting.module';

@Module({
  imports: [PrismaModule, CoreAccountingModule],
})
export class AppModule {
  // Simulates Akaunting App-Store Marketplace engine runtime loading
  static registerExtensions(modules: DynamicModule[]): DynamicModule {
    return {
      module: AppModule,
      imports: [...modules],
    };
  }
}
```

---

## 2. Multi-Tenant Ledger Architecture (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Company {
  id        String    @id @default(uuid())
  name      String
  currency  String    @default("USD")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  accounts  Account[]
  invoices  Invoice[]
  ledgers   Ledger[]
}

model Account {
  id           String        @id @default(uuid())
  companyId    String
  company      Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  code         String        // e.g., "1010" Cash, "4000" Revenue
  name         String
  type         AccountType   // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  createdAt    DateTime      @default(now())
  journalLines JournalLine[]

  @@unique([companyId, code])
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

model Invoice {
  id          String        @id @default(uuid())
  companyId   String
  company     Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  number      String
  issueDate   DateTime
  dueDate     DateTime
  totalAmount Decimal       @db.Decimal(18, 4)
  status      InvoiceStatus @default(DRAFT)
  ledgerId    String?       @unique
  ledger      Ledger?       @relation(fields: [ledgerId], references: [id])
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
}

model Ledger {
  id           String        @id @default(uuid())
  companyId    String
  company      Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  description  String
  postedAt     DateTime      @default(now())
  invoice      Invoice?
  journalLines JournalLine[]
}

model JournalLine {
  id        String   @id @default(uuid())
  ledgerId  String
  ledger    Ledger   @relation(fields: [ledgerId], references: [id], onDelete: Cascade)
  accountId String
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Restrict)
  debit     Decimal  @db.Decimal(18, 4) @default(0.0000)
  credit    Decimal  @db.Decimal(18, 4) @default(0.0000)
}
```

---

## 3. Data Transfer Objects Layer (`libs/shared/dtos/src/index.ts`)

```typescript
import { IsString, IsNotEmpty, IsArray, ValidateNested, ArrayMinSize, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class JournalLineDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsNumber()
  @Min(0)
  debit: number;

  @IsNumber()
  @Min(0)
  credit: number;
}

export class CreateLedgerEntryDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
```

---

## 4. Transactional Safeguard Engine (`apps/backend/src/core-accounting/ledger.service.ts`)

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLedgerEntryDto } from '@akaunting-workspace/shared/dtos';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async createTransactionEntry(dto: CreateLedgerEntryDto) {
    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of dto.lines) {
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException('A single journal line cannot possess both a debit and credit value.');
      }
      totalDebits += line.debit;
      totalCredits += line.credit;
    }

    // Double-entry mathematical check balance validation step
    // Using a safe epsilon comparison for floating-point values
    if (Math.abs(totalDebits - totalCredits) > 0.0001) {
      throw new BadRequestException(`Accounting Ledger Unbalanced. Sum of Debits (${totalDebits}) must match sum of Credits (${totalCredits}).`);
    }

    // Execute isolated ACID atomic SQL transaction runtime
    return this.prisma.$transaction(async (tx) => {
      const ledger = await tx.ledger.create({
        data: {
          companyId: dto.companyId,
          description: dto.description,
        },
      });

      const lineCreations = dto.lines.map((line) =>
        tx.journalLine.create({
          data: {
            ledgerId: ledger.id,
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
          },
        })
      );

      await Promise.all(lineCreations);
      
      return tx.ledger.findUnique({
        where: { id: ledger.id },
        include: { journalLines: true },
      });
    });
  }
}
```

---

## 5. Reactive Enterprise View Layout (`apps/frontend/src/components/TransactionMatrix.tsx`)

```tsx
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CreateLedgerEntryDto, JournalLineDto } from '@akaunting-workspace/shared/dtos';

interface AccountOption { id: string; name: string; code: string; }

export const TransactionMatrix: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalLineDto[]>([
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 },
  ]);

  const { data: accounts } = useQuery<AccountOption[]>({
    queryKey: ['accounts', companyId],
    queryFn: () => fetch(`/api/accounts?companyId=${companyId}`).then(res => res.json()),
  });

  const ledgerMutation = useMutation({
    mutationFn: (newEntry: CreateLedgerEntryDto) =>
      fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      }).then((res) => {
        if (!res.ok) throw new Error('Transaction rejected by Core Engine validation rule.');
        return res.json();
      }),
  });

  const sumDebits = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const sumCredits = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const isBalanced = Math.abs(sumDebits - sumCredits) < 0.0001 && sumDebits > 0;

  const handleLineChange = (index: number, field: keyof JournalLineDto, value: string | number) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;
    ledgerMutation.mutate({ companyId, description, lines });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-slate-200 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-4 font-sans">New Journal Entry Matrix</h2>
      <form onSubmit={submitForm} className="space-y-4">
        <input
          type="text"
          placeholder="Transaction Description (e.g., Q3 Office Rental Payment)"
          className="w-full p-2 border rounded-md border-slate-300 focus:ring-2 focus:ring-emerald-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-sm font-semibold">
              <th className="pb-2">Account Allocation</th>
              <th className="pb-2 w-32">Debit ($)</th>
              <th className="pb-2 w-32">Credit ($)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-2">
                  <select
                    className="w-full p-1.5 bg-slate-50 border rounded-md"
                    value={line.accountId}
                    onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                    required
                  >
                    <option value="">Select Account Ledger Code...</option>
                    {accounts?.map((acc) => (
                      <option key={acc.id} value={acc.id}>[{acc.code}] {acc.name}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-1.5 border rounded-md text-right"
                    value={line.debit}
                    onChange={(e) => handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-1.5 border rounded-md text-right"
                    value={line.credit}
                    onChange={(e) => handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border text-sm font-semibold">
          <div className="text-slate-700">Total Calculation Matrix:</div>
          <div className="flex space-x-8">
            <span className="text-blue-600">Debits: ${sumDebits.toFixed(2)}</span>
            <span className="text-indigo-600">Credits: ${sumCredits.toFixed(2)}</span>
            <span>
              Status: {isBalanced ? (
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">● Balanced</span>
              ) : (
                <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-300">❌ Out of Balance</span>
              )}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isBalanced || ledgerMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-md disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {ledgerMutation.isPending ? 'Writing Ledger Transaction...' : 'Post Transaction to Core System'}
        </button>
      </form>
    </div>
  );
};
```
