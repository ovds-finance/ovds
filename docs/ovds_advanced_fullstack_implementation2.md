# Online VAT Declaration System (OVDS) - Advanced Full-Stack Implementation Blueprint
Inspired by Akaunting Engine, structured utilizing **Nx Monorepo, React, NestJS, and Prisma ORM**.

This system serves as an advanced digital bridge interfacing **Taxpayers, the Ministry of Finance, the Ministry of Revenues (MoR), the Accounting & Auditing Board of Ethiopia (AABE), External Auditors, Internal Auditors, and Financial Systems (Commercial Banks / Telebirr)**.

---

## 1. Monorepo Architecture & Modular Workspace Structure
 
```
ovds-monorepo/
├── apps/
│   ├── web-taxpayer/                 # React SPA for Taxpayers (Invoicing, General Ledger, VAT Filing)
│   ├── web-authority/                # React SPA for Ministry of Revenues, MoF, & AABE Auditing Boards
│   └── api-gateway/                  # NestJS Enterprise Backend API Engine
├── libs/
│   ├── core-data/                    # Shared Prisma Client and Database Migration Scripts
│   ├── crypto-sync/                  # Offline Encrypted Packet Packaging and Decryption Helpers
│   └── api-interfaces/               # Shared TypeScript DTOs, Enums, and Type Definitions
├── nx.json
├── package.json
└── schema.prisma
```

---

## 2. Relational Database Engine (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-api"
}

enum PartyType {
  NATURAL_PERSON
  LEGAL_ENTITY
}

enum AssetCategory {
  RAW_MATERIAL
  FINISHED_GOOD
  INTELLECTUAL_PROPERTY
  CONSTRUCTION_WORK
  REAL_ESTATE
}

enum TransactionType {
  SALE
  PURCHASE
  LEASE
  LOAN_ISSUANCE
  LOAN_REPAYMENT
  INHERITANCE
  DONATION
  LIQUIDATION
}

enum AuditState {
  DRAFT
  INTERNAL_AUDITED
  EXTERNAL_AUDITED
  AABE_CERTIFIED
  REVENUE_APPROVED
  REJECTED
}

enum SupportLanguage {
  ENGLISH
  AMHARIC
  TIGRINYA
}

model Organization {
  id             String         @id @default(uuid())
  tin            String         @unique
  legalName      String
  partyType      PartyType
  languagePreference SupportLanguage @default(ENGLISH)
  isClosed       Boolean        @default(false)
  createdAt      DateTime       @default(now())
  
  // Relations
  ledgers        GeneralLedger[]
  invoicesIssued Invoice[]      @relation("IssuerRelation")
  invoicesRecv   Invoice[]      @relation("RecipientRelation")
  audits         AuditTrail[]
}

model GeneralLedger {
  id             String         @id @default(uuid())
  organizationId String
  accountCode    String         // e.g., 10100 Cash, 40000 Revenue
  accountName    String
  debit          Decimal        @default(0.00)
  credit         Decimal        @default(0.00)
  balance        Decimal        @default(0.00)
  updatedAt      DateTime       @updatedAt

  organization   Organization   @relation(fields: [organizationId], references: [id])
  @@unique([organizationId, accountCode])
}

model Invoice {
  id             String         @id @default(uuid())
  invoiceNumber  String         @unique
  issuerTin      String
  recipientTin   String
  category       AssetCategory
  txType         TransactionType
  subTotal       Decimal
  vatAmount      Decimal        // Calculated at 15% standard rate if applicable
  totalAmount    Decimal
  isOfflineSync  Boolean        @default(false)
  auditState     AuditState     @default(DRAFT)
  createdAt      DateTime       @default(now())

  issuer         Organization   @relation("IssuerRelation", fields: [issuerTin], references: [tin])
  recipient      Organization   @relation("RecipientRelation", fields: [recipientTin], references: [tin])
  items          LineItem[]
  financialTx    FinancialTransaction?
}

model LineItem {
  id             String         @id @default(uuid())
  invoiceId      String
  description    String
  quantity       Decimal
  unitPrice      Decimal
  total          Decimal

  invoice        Invoice        @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
}

model FinancialTransaction {
  id             String         @id @default(uuid())
  invoiceId      String         @unique
  referenceBank  String         // e.g., "CBE", "Telebirr", "Awash"
  paymentRef     String         @unique
  amountPaid     Decimal
  settledAt      DateTime       @default(now())

  invoice        Invoice        @relation(fields: [invoiceId], references: [id])
}

model AuditTrail {
  id             String         @id @default(uuid())
  organizationId String
  auditorType    String         // "INTERNAL", "EXTERNAL", "AABE", "MoR"
  auditorName    String
  actionTaken    String
  previousState  AuditState
  newState       AuditState
  remarks        String?
  timestamp      DateTime       @default(now())

  organization   Organization   @relation(fields: [organizationId], references: [id])
}
```

---

## 3. NestJS Accounting & Transaction Service Engine

### Transaction Ledger Controller (`transaction.controller.ts`)
```typescript
import { Controller, Post, Body, Get, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateInvoiceDto, OfflinePacketDto } from './dtos';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly txService: TransactionService) {}

  @Post('invoice')
  async createOnlineInvoice(@Body() dto: CreateInvoiceDto) {
    return this.txService.processInvoice(dto);
  }

  @Post('sync-offline-packet')
  async syncOfflinePacket(@Body() dto: OfflinePacketDto) {
    return this.txService.ingestOfflineData(dto);
  }

  @Get('audit-stream/:tin')
  async getAuditStream(@Param('tin') tin: string) {
    return this.txService.fetchOrganizationHistory(tin);
  }
}
```

### Double-Entry Ledger Processing Service (`transaction.service.ts`)
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, OfflinePacketDto } from './dtos';
import * as crypto from 'crypto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async processInvoice(dto: CreateInvoiceDto) {
    const vatRate = 0.15;
    const subTotal = dto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const vatAmount = subTotal * vatRate;
    const totalAmount = subTotal + vatAmount;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Invoice Entry
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: dto.invoiceNumber,
          issuerTin: dto.issuerTin,
          recipientTin: dto.recipientTin,
          category: dto.category,
          txType: dto.txType,
          subTotal,
          vatAmount,
          totalAmount,
          items: {
            create: dto.items
          }
        }
      });

      // 2. Adjust Issuer Double-Entry Accounts (Debit Receivable / Credit Revenue)
      await tx.generalLedger.upsert({
        where: { organizationId_accountCode: { organizationId: dto.issuerTin, accountCode: '12000' } },
        update: { debit: { increment: totalAmount }, balance: { increment: totalAmount } },
        create: { organizationId: dto.issuerTin, accountCode: '12000', accountName: 'Accounts Receivable', debit: totalAmount, balance: totalAmount }
      });

      // 3. Post VAT Liability to Ministry of Revenues Control Account
      await tx.generalLedger.upsert({
        where: { organizationId_accountCode: { organizationId: dto.issuerTin, accountCode: '21500' } },
        update: { credit: { increment: vatAmount }, balance: { decrement: vatAmount } },
        create: { organizationId: dto.issuerTin, accountCode: '21500', accountName: 'VAT Payable MoR', credit: vatAmount, balance: -vatAmount }
      });

      return invoice;
    });
  }

  async ingestOfflineData(dto: OfflinePacketDto) {
    // Decrypting the package utilizing local security infrastructure specs
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.SYNC_SECRET), Buffer.from(dto.iv, 'hex'));
      let decrypted = decipher.update(dto.encryptedPayload, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const transactions = JSON.parse(decrypted);
      
      // Batch ingest historical packets
      for (const txData of transactions) {
        await this.processInvoice(txData);
      }
      return { status: 'SUCCESS', importedRecords: transactions.length };
    } catch (err) {
      throw new BadRequestException('Cryptographic Verification Defect or Corrupted Offline Packet Asset.');
    }
  }

  async fetchOrganizationHistory(tin: string) {
    return this.prisma.auditTrail.findMany({
      where: { organizationId: tin },
      orderBy: { timestamp: 'desc' }
    });
  }
}
```

---

## 4. Multi-Lingual React Taxpayer UI Module

### Advanced Declaration Form (`VatDeclarationForm.tsx`)
```tsx
import React, { useState } from 'react';

type Lang = 'ENGLISH' | 'AMHARIC' | 'TIGRINYA';

const dictionary = {
  ENGLISH: { title: 'Corporate VAT Declaration Engine', tin: 'Taxpayer TIN', type: 'Asset Flow Classification', execute: 'Authorize Transaction' },
  AMHARIC: { title: 'የድርጅት የቫት ማስታወቂያ ሞዱል', tin: 'የግብር ከፋይ መለያ ቁጥር (TIN)', type: 'የንብረት ፍሰት ምድብ', execute: 'ግብይቱን አፅድቅ' },
  TIGRINYA: { title: 'ትካል ቫት መፍለጢ ሞዱል', tin: 'መፍለጢ ቁፅሪ ግብሪ (TIN)', type: 'ዓይነት ምንቅስቓስ ንብረት', execute: 'ግብይት ኣፅድቕ' }
};

export const VatDeclarationForm: React.FC = () => {
  const [lang, setLang] = useState<Lang>('ENGLISH');
  const [tin, setTin] = useState('');
  const [txType, setTxType] = useState('SALE');
  const [items, setItems] = useState([{ description: '', quantity: 0, unitPrice: 0 }]);

  const calculateVat = () => {
    const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return { subTotal, vat: subTotal * 0.15, total: subTotal * 1.15 };
  };

  const handlePost = async () => {
    const totals = calculateVat();
    const payload = { issuerTin: tin, txType, items, ...totals };
    await fetch('/api/transactions/invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    alert(lang === 'ENGLISH' ? 'Online Filing Transmitted!' : lang === 'AMHARIC' ? 'መዝገብ ተላልፏል!' : 'መዝገብ ተመሓላሊፉ!');
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
        <option value="ENGLISH">English</option>
        <option value="AMHARIC">አማርኛ</option>
        <option value="TIGRINYA">ትግርኛ</option>
      </select>

      <h2>{dictionary[lang].title}</h2>
      <div>
        <label>{dictionary[lang].tin}: </label>
        <input value={tin} onChange={(e) => setTin(e.target.value)} placeholder="888888888" />
      </div>

      <div style={{ marginTop: '12px' }}>
        <label>{dictionary[lang].type}: </label>
        <select value={txType} onChange={(e) => setTxType(e.target.value)}>
          <option value="SALE">SALE / ሽያጭ</option>
          <option value="PURCHASE">PURCHASE / ዕድጊት</option>
          <option value="LIQUIDATION">LIQUIDATION / መዝጊያ</option>
        </select>
      </div>

      <button onClick={handlePost} style={{ marginTop: '20px', display: 'block' }}>
        {dictionary[lang].execute}
      </button>
    </div>
  );
};
```

---

## 5. Security & Bank Interfacing Handshake Integration

```typescript
// Telebirr Core Payment Verification Interceptor Mockup
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TelebirrVerificationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const inboundSignature = request.headers['x-telebirr-signature'];
    const appSecret = process.env.TELEBIRR_PUBLIC_KEY;

    if (!inboundSignature) {
      throw new UnauthorizedException('Missing Telebirr Verification Fingerprint Signature.');
    }

    const computedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(JSON.stringify(request.body))
      .digest('hex');

    if (inboundSignature !== computedSignature) {
      throw new UnauthorizedException('Security Handshake Failure. Telebirr Payload Signature Mismatch.');
    }

    return next.handle();
  }
}
```
