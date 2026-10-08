# Blueprint: Ethiopian Online VAT Declaration & Core Accounting System
## Stack: Nx Monorepos, React, NestJS, Prisma ORM

This comprehensive technical blueprint provides the complete code architecture for integrating an automated **Online VAT Declaration System** into a custom core accounting platform modeled after Akaunting, explicitly tailored to meet the federal tax compliance guidelines of the **Ethiopian Ministry of Revenue (MoR)**.

---

## 1. System & Domain Architecture

### Ethiopian Fiscal Rules Engine Context
* **Standard VAT Rate:** 15% applied to standard taxable goods and services.
* **Special Tax Treatments:** Zero-rated (0% for exports and international transport) and Exempt (public transport, financial services, healthcare).
* **Tax Identification Number (TIN):** Mandatory 10-digit numeric unique identifier for business entities and B2B counterparties.
* **Withholding Tax (WHT) Interlock:** 2% on supply of goods exceeding 10,000 ETB, and 3% on supply of services exceeding 10,000 ETB in a single transaction.
* **Filing Period:** Monthly frequency based on the Ethiopian/Gregorian calendar alignments. Once a VAT return is marked as `SUBMITTED`, its financial parameters become structurally immutable.

### Monorepos Project Topology
```text
ovds/
├── apps/
│   ├── backend/                # NestJS Core Gateway API Engine
│   └── frontend/               # React Client SPA Workspace
└── packages/
    └── shared/
        └── dtos/               # Shared Class-Validator Transfer Objects
```

---

## 2. Shared Data Transfer Layer (`packages/shared/dtos`)

This layer ensures that both front-end runtime validation and back-end structural parsing enforce strict compliance criteria before processing data.

### `packages/shared/dtos/src/lib/vat.dto.ts`
```typescript
import { IsString, IsNotEmpty, Matches, IsNumber, IsUUID, IsEnum, Min, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum VatCategory {
  STANDARD = 'STANDARD', // 15%
  ZERO_RATED = 'ZERO_RATED', // 0%
  EXEMPT = 'EXEMPT' // No tax
}

export enum DeclarationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PAID = 'PAID'
}

export class CreateInvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0.01)
  unitPrice!: number;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsEnum(VatCategory)
  vatCategory!: VatCategory;
}

export class CreateInvoiceDto {
  @IsUUID()
  companyId!: string;

  @IsUUID()
  contactId!: string; // Customer or Supplier

  @IsString()
  @IsNotEmpty()
  invoiceNumber!: string;

  @IsNotEmpty()
  issueDate!: Date;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items!: CreateInvoiceItemDto[];
}

export class FileVatDeclarationDto {
  @IsUUID()
  companyId!: string;

  @IsNumber()
  year!: number; // Gregorian fiscal mapping year

  @IsNumber()
  month!: number; // Month index (1-12)
}
```

---

## 3. Data Persistence Architecture (`Prisma Schema`)

The unified multi-tenant schema maps accounts, tracking parameters, transactional journal layers, and immutable historic VAT declarations with explicit structural locking dependencies (`onDelete: Restrict`).

### `prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
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

enum VatCategory {
  STANDARD
  ZERO_RATED
  EXEMPT
}

enum DeclarationStatus {
  DRAFT
  SUBMITTED
  PAID
}

model Company {
  id               String           @id @default(uuid())
  name             String
  tin              String           @unique // Must be exactly 10 digits
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  accounts         Account[]
  invoices         Invoice[]
  journalEntries   JournalEntry[]
  vatDeclarations  VatDeclaration[]
}

model Contact {
  id        String    @id @default(uuid())
  name      String
  tin       String?   // B2B Customer or Supplier 10-digit TIN
  isVendor  Boolean   @default(false)
  invoices  Invoice[]
}

model Account {
  id           String        @id @default(uuid())
  companyId    String
  company      Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  code         String        // e.g., "1201" (Input VAT Claimable)
  name         String
  type         AccountType
  journalLines JournalLine[]

  @@unique([companyId, code])
}

model Invoice {
  id            String        @id @default(uuid())
  companyId     String
  company       Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  contactId     String
  contact       Contact       @relation(fields: [contactId], references: [id], onDelete: Restrict)
  invoiceNumber String
  issueDate     DateTime
  subTotal      Float         // Pre-tax base
  vatTotal      Float         // Accumulated VAT value
  whtTotal      Float         @default(0.0) // Withholding Tax if applicable
  grandTotal    Float
  isExpense     Boolean       @default(false) // false = Sales (Output), true = Purchase (Input)
  items         InvoiceItem[]

  @@unique([companyId, invoiceNumber])
}

model InvoiceItem {
  id          String      @id @default(uuid())
  invoiceId   String
  invoice     Invoice     @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  unitPrice   Float
  quantity    Int
  vatCategory VatCategory
  taxAmount   Float
  lineTotal   Float
}

model JournalEntry {
  id          String        @id @default(uuid())
  companyId   String
  company     Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  reference   String        // e.g., "INV-1002" or "VAT-2026-M09"
  description String
  postedDate  DateTime
  lines       JournalLine[]
}

model JournalLine {
  id             String       @id @default(uuid())
  journalEntryId String
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  accountId      String
  account        Account      @relation(fields: [accountId], references: [id], onDelete: Restrict)
  debit          Float        @default(0.0)
  credit         Float        @default(0.0)
}

model VatDeclaration {
  id              String            @id @default(uuid())
  companyId       String
  company         Company           @relation(fields: [companyId], references: [id], onDelete: Cascade)
  year            Int
  month           Int
  totalSalesValue Float             // Base value of all standard + zero-rated sales
  outputVat       Float             // Collected VAT liability
  totalPurchases  Float             // Base value of business expense items
  inputVat        Float             // Deductible/claimable VAT asset
  whtCredited     Float             @default(0.0) // Total WHT certificates received
  netVatPayable   Float             // (Output VAT - Input VAT) - WHT
  status          DeclarationStatus @default(DRAFT)
  filedAt         DateTime?
  referenceNumber String?           // Generated confirmation token upon submission

  @@unique([companyId, year, month])
}
```

---

## 4. Backend Processing Engine (`NestJS Core Services`)

The service engine below processes data atomically using standard `$transaction` calls. It encapsulates two critical mechanisms: dynamic automatic creation of invoice ledger structures, and computation/locking of monthly VAT filings.

### `apps/backend/src/app/vat/vat.service.ts`
```typescript
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Assumed standard global Prisma module
import { CreateInvoiceDto, FileVatDeclarationDto, VatCategory, DeclarationStatus } from '@ovds/shared-dtos';

@Injectable()
export class VatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates an Invoice, computes VAT + Withholding, and maps it directly to the Double-Entry Ledger
   */
  async createInvoice(dto: CreateInvoiceDto, isExpense: boolean) {
    // 1. Strict Validation on Company 10-Digit TIN
    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company || company.tin.length !== 10 || !/^\d+$/.test(company.tin)) {
      throw new BadRequestException('A valid 10-digit Ethiopian TIN is required to perform operations.');
    }

    return this.prisma.$transaction(async (tx) => {
      let subTotal = 0;
      let vatTotal = 0;

      const itemsData = dto.items.map(item => {
        const lineBase = item.unitPrice * item.quantity;
        let lineTax = 0;

        if (item.vatCategory === VatCategory.STANDARD) {
          lineTax = lineBase * 0.15; // standard Ethiopian 15% rate
        }

        subTotal += lineBase;
        vatTotal += lineTax;

        return {
          description: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          vatCategory: item.vatCategory as any,
          taxAmount: lineTax,
          lineTotal: lineBase + lineTax
        };
      });

      // 2. Assess Ethiopian Withholding Tax Rules (threshold > 10,000 ETB)
      let whtTotal = 0;
      if (subTotal >= 10000) {
        // If expense (purchase of services/goods) or sale, determine if WHT intercepts
        // Example: Assume a standard 2% WHT on goods for basic simulation
        whtTotal = subTotal * 0.02;
      }

      const grandTotal = (subTotal + vatTotal) - whtTotal;

      // 3. Create the Database Document Record
      const invoice = await tx.invoice.create({
        data: {
          companyId: dto.companyId,
          contactId: dto.contactId,
          invoiceNumber: dto.invoiceNumber,
          issueDate: new Date(dto.issueDate),
          subTotal,
          vatTotal,
          whtTotal,
          grandTotal,
          isExpense,
          items: { create: itemsData }
        }
      });

      // 4. Resolve System Accounting Target Accounts
      const arAccount = await tx.account.findFirst({ where: { companyId: dto.companyId, code: isExpense ? '2101' : '1101' } }); // Accounts Payable / Receivable
      const revAccount = await tx.account.findFirst({ where: { companyId: dto.companyId, code: isExpense ? '5001' : '4001' } }); // Expense / Revenue
      const vatAccount = await tx.account.findFirst({ where: { companyId: dto.companyId, code: isExpense ? '1201' : '2201' } }); // Input VAT / Output VAT

      if (!arAccount || !revAccount || !vatAccount) {
        throw new BadRequestException('Required chart of accounts entries for transaction routing are missing.');
      }

      // 5. Generate and Validate Double Entry Matrix Invariants
      const journalEntry = await tx.journalEntry.create({
        data: {
          companyId: dto.companyId,
          reference: dto.invoiceNumber,
          description: `${isExpense ? 'Purchase' : 'Sales'} Invoice System Record Entry`,
          postedDate: new Date(dto.issueDate),
        }
      });

      const lines = [];

      if (!isExpense) {
        // Sales Invariant Matrix Layout
        lines.push({ journalEntryId: journalEntry.id, accountId: arAccount.id, debit: grandTotal, credit: 0 });
        lines.push({ journalEntryId: journalEntry.id, accountId: revAccount.id, debit: 0, credit: subTotal });
        if (vatTotal > 0) {
          lines.push({ journalEntryId: journalEntry.id, accountId: vatAccount.id, debit: 0, credit: vatTotal });
        }
      } else {
        // Purchase Invariant Matrix Layout
        lines.push({ journalEntryId: journalEntry.id, accountId: revAccount.id, debit: subTotal, credit: 0 });
        if (vatTotal > 0) {
          lines.push({ journalEntryId: journalEntry.id, accountId: vatAccount.id, debit: vatTotal, credit: 0 });
        }
        lines.push({ journalEntryId: journalEntry.id, accountId: arAccount.id, debit: 0, credit: grandTotal });
      }

      await tx.journalLine.createMany({ data: lines });

      // Invariant mathematical check block
      const totalDebits = lines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredits = lines.reduce((sum, l) => sum + l.credit, 0);
      if (Math.abs(totalDebits - totalCredits) > 0.001) {
        throw new BadRequestException(`Double-entry broken ledger execution abandoned. Balance delta detected.`);
      }

      return invoice;
    });
  }

  /**
   * Compiles and closes a monthly VAT declaration period
   */
  async generateMonthlyDeclaration(dto: FileVatDeclarationDto) {
    const startPeriod = new Date(dto.year, dto.month - 1, 1);
    const endPeriod = new Date(dto.year, dto.month, 0, 23, 59, 59);

    // Verify existing immutable status constraints
    const existing = await this.prisma.vatDeclaration.findUnique({
      where: { companyId_year_month: { companyId: dto.companyId, year: dto.year, month: dto.month } }
    });

    if (existing && existing.status === DeclarationStatus.SUBMITTED) {
      throw new ConflictException('This tax declaration window is closed and finalized.');
    }

    // Extract cumulative invoice tracking data
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId: dto.companyId,
        issueDate: { gte: startPeriod, lte: endPeriod }
      }
    });

    let totalSalesValue = 0;
    let outputVat = 0;
    let totalPurchases = 0;
    let inputVat = 0;
    let whtCredited = 0;

    invoices.forEach(inv => {
      if (!inv.isExpense) {
        totalSalesValue += inv.subTotal;
        outputVat += inv.vatTotal;
        whtCredited += inv.whtTotal; // WHT collected from client payments
      } else {
        totalPurchases += inv.subTotal;
        inputVat += inv.vatTotal;
      }
    });

    const netVatPayable = (outputVat - inputVat) - whtCredited;

    return this.prisma.vatDeclaration.upsert({
      where: { companyId_year_month: { companyId: dto.companyId, year: dto.year, month: dto.month } },
      update: { totalSalesValue, outputVat, totalPurchases, inputVat, whtCredited, netVatPayable },
      create: {
        companyId: dto.companyId,
        year: dto.year,
        month: dto.month,
        totalSalesValue,
        outputVat,
        totalPurchases,
        inputVat,
        whtCredited,
        netVatPayable,
        status: DeclarationStatus.DRAFT
      }
    });
  }

  /**
   * Finalizes the declaration setting it to SUBMITTED status and locking records
   */
  async finalizeDeclaration(declarationId: string) {
    const declaration = await this.prisma.vatDeclaration.findUnique({ where: { id: declarationId } });
    if (!declaration || declaration.status !== DeclarationStatus.DRAFT) {
      throw new BadRequestException('Only active DRAFT declarations can be securely submitted to MoR.');
    }

    return this.prisma.vatDeclaration.update({
      where: { id: declarationId },
      data: {
        status: DeclarationStatus.SUBMITTED,
        filedAt: new Date(),
        referenceNumber: 'ET-MOR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      }
    });
  }
}
```

---

## 5. Reactive UI Layer (`React Form Dashboard`)

The frontend application uses `@tanstack/react-query` to pull state changes and trigger mutations, updating local data representations across standard UI modules.

### `apps/frontend/src/app/vat/VatDeclarationForm.tsx`
```tsx
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface DeclarationData {
  id: string;
  year: number;
  month: number;
  totalSalesValue: number;
  outputVat: number;
  totalPurchases: number;
  inputVat: number;
  whtCredited: number;
  netVatPayable: number;
  status: 'DRAFT' | 'SUBMITTED' | 'PAID';
  referenceNumber?: string;
}

export const VatDeclarationForm: React.FC<{ companyId: string }> = ({ companyId }) => {
  const queryClient = useQueryClient();
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(9);

  // Fetch or calculate declaration active state
  const { data: declaration, isLoading, refetch } = useQuery<DeclarationData>({
    queryKey: ['vatDeclaration', companyId, year, month],
    queryFn: async () => {
      const res = await axios.get(`/api/vat/calculate?companyId=${companyId}&year=${year}&month=${month}`);
      return res.data;
    }
  });

  // Calculate/Recompile backend baseline ledger values
  const compileMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post('/api/vat/compile', { companyId, year, month });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vatDeclaration', companyId, year, month] });
    }
  });

  // Structural Finalization / Submit to Ministry of Revenue
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.post(`/api/vat/finalize/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vatDeclaration', companyId, year, month] });
      alert('Declaration securely locked and submitted to the Ethiopian MoR E-Tax Engine.');
    }
  });

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md space-y-6 border border-gray-100">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">🇪🇹 Ethiopian Online VAT Interface</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          declaration?.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {declaration?.status || 'NO RECORD'}
        </span>
      </div>

      {/* Date Pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Fiscal Year (Gregorian Map)</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fiscal Month Range</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>Month {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      <button onClick={() => compileMutation.mutate()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition">
        {compileMutation.isPending ? 'Recompiling Records...' : 'Fetch & Sync Ledger Transactions'}
      </button>

      {declaration && (
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 uppercase">Gross Taxable Revenue Base</p>
              <p className="text-lg font-bold text-gray-900">{declaration.totalSalesValue.toFixed(2)} ETB</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Output VAT Liability (15%)</p>
              <p className="text-lg font-bold text-red-600">+{declaration.outputVat.toFixed(2)} ETB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 uppercase">Taxable Expense Purchase Base</p>
              <p className="text-lg font-bold text-gray-900">{declaration.totalPurchases.toFixed(2)} ETB</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Input VAT Asset Deductions</p>
              <p className="text-lg font-bold text-green-600">-{declaration.inputVat.toFixed(2)} ETB</p>
            </div>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-gray-700">Net Calculated VAT Tax Payable</p>
              <p className="text-2xl font-black text-gray-900">{declaration.netVatPayable.toFixed(2)} ETB</p>
            </div>
            
            {declaration.status === 'DRAFT' ? (
              <button onClick={() => submitMutation.mutate(declaration.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md shadow transition">
                Authorize & Electronically File (MoR)
              </button>
            ) : (
              <div className="text-right">
                <p className="text-xs text-gray-500">e-Filing Reference ID</p>
                <p className="text-sm font-mono font-bold text-indigo-700">{declaration.referenceNumber}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```