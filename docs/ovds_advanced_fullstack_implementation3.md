# Enterprise Blueprint: Online VAT Declaration System (OVDS)
## Advanced Multi-Stakeholder Digital Accounting Architecture
*Inspired by Akaunting Modules | Built with Nx Monorepo, React, NestJS, and Prisma ORM*
 
---

## 1. Executive Vision & System Workflow
The **Online VAT Declaration System (OVDS)** serves as a digital bridge linking the entire lifecycle of commercial transactions (from raw goods and intellectual property to international imports and liquidations) across all major institutional stakeholders in Ethiopia:
*   **Taxpayers / Merchants:** Execute sales, purchases, contracts, asset inventory updates, and loan provisions.
*   **Ministry of Revenues (MoR / ገቢዎች):** Monitors live and offline-batched transactional data for VAT liabilities.
*   **Ministry of Finance:** Tracks broad macroeconomic trends, public budget allocations, and tax rates.
*   **Accounting & Auditing Board of Ethiopia (AABE) / External Auditors:** Validates corporate financial statements against legal compliance standards.
*   **Internal Auditors:** Continuously verify company journal entries and inventory changes prior to automated reporting.
*   **Commercial Banks & Telebirr:** Facilitate real-time financial settlement, VAT escrows, and automated state revenue routing via open APIs.

```
       +------------------------------------------------------------------------+
       |                         OVDS CENTRAL ROUTING ENGINE                    |
       +------------------------------------------------------------------------+
         /               |                 |                 \                       v                v                 v                  v               v
  [Taxpayers]     [Ministry of    [Ministry of Finance]    [AABE / Ext.    [Banks /
 (Online/Offline)   Revenues]     (Macro Fiscal Rules)      Auditors]     Telebirr]
```

---

## 2. Nx Monorepo Workspace Structure

```
ovds-monorepo/
├── apps/
│   ├── web-taxpayer/             # React front-end application tailored for Merchants
│   ├── web-authority/            # React front-end interface optimized for MoR, AABE, & Auditors
│   └── api-gateway/              # Main NestJS Backend API Engine serving all apps
├── libs/
│   ├── core-data/                # Shared Prisma Schema and Database Management Assets
│   ├── core-state/               # Shared State Management & Business Rules Actions
│   ├── dto-validation/           # Shared TypeScript interfaces and NestJS validation pipes
│   └── integration-services/     # Universal Bank API, Telebirr Webhooks, and Sync Components
├── package.json
└── nx.json
```

---

## 3. Database Architecture (`schema.prisma`)

This enterprise schema models comprehensive business workflows: asset creation, sales, imports, intellectual property tracking, multi-stakeholder audits, and multi-lingual metadata support.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum PartyType {
  NATURAL_PERSON
  LEGAL_ENTITY
}

enum TransactionCategory {
  GOODS_SALE
  GOODS_PURCHASE
  RAW_MATERIAL_INPUT
  INTELLECTUAL_PROPERTY_TRANSFER
  CONSTRUCTION_CONTRACT
  LEASE_RENTAL
  DONATION_GIFT
  INHERITANCE_TRANSFER
  BUSINESS_LIQUIDATION
}

enum TaxpayerStatus {
  ACTIVE
  SUSPENDED
  LIQUIDATED
}

enum AuditStatus {
  PENDING_INTERNAL
  INTERNAL_APPROVED
  EXTERNAL_AUDITED
  AABE_CERTIFIED
  REJECTED
}

model Taxpayer {
  id                String         @id @default(uuid())
  tin               String         @unique
  legalName         String
  tradeName         String?
  partyType         PartyType      @default(LEGAL_ENTITY)
  status            TaxpayerStatus @default(ACTIVE)
  registeredAddress String
  preferredLanguage String         @default("en") // Supports en, am, ti
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  // Relations
  ledgers           GeneralLedger[]
  sales             Transaction[]   @relation("SellerRelation")
  purchases         Transaction[]   @relation("BuyerRelation")
  audits            AuditTrail[]
}

model Transaction {
  id               String              @id @default(uuid())
  invoiceNumber    String              @unique
  category         TransactionCategory
  sellerId         String
  buyerId          String
  contractId       String? // Optional legal contract context
  descriptionJson  Json                // Localized description block (en/am/ti)
  
  subTotal         Decimal             @db.Decimal(18, 4)
  vatAmount        Decimal             @db.Decimal(18, 4)
  totalAmount      Decimal             @db.Decimal(18, 4)
  
  isOfflineSync    Boolean             @default(false)
  syncBatchId      String?
  auditStatus      AuditStatus         @default(PENDING_INTERNAL)
  
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  // Relations
  seller           Taxpayer            @relation("SellerRelation", fields: [sellerId], references: [id])
  buyer            Taxpayer            @relation("BuyerRelation", fields: [buyerId], references: [id])
  items            TransactionItem[]
  bankSettlements  BankSettlement[]
  auditTrails      AuditTrail[]
}

model TransactionItem {
  id             String      @id @default(uuid())
  transactionId  String
  itemCode       String      // Standard HS Code for physical items or unique IP registry code
  name           String
  quantity       Decimal     @db.Decimal(14, 4)
  unitPrice      Decimal     @db.Decimal(18, 4)
  vatRate        Decimal     @db.Decimal(5, 2) @default(15.00) // Standard 15% VAT rate
  isIntellectual Property Boolean @default(false)

  transaction    Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
}

model BankSettlement {
  id            String   @id @default(uuid())
  transactionId String
  paymentMethod String   // "TELEBIRR", "CBE", "AIB", "OFFLINE_CASH"
  referenceCode String   @unique
  amountPaid    Decimal  @db.Decimal(18, 4)
  isSettled     Boolean  @default(false)
  settledAt     DateTime?

  transaction   Transaction @relation(fields: [transactionId], references: [id])
}

model GeneralLedger {
  id           String   @id @default(uuid())
  taxpayerId   String
  accountCode  String   // e.g., 1000 Assets, 5000 VAT Payable
  accountName  String   // Multi-language string label
  debit        Decimal  @db.Decimal(18, 4)
  credit       Decimal  @db.Decimal(18, 4)
  balance      Decimal  @db.Decimal(18, 4)
  effectiveDate DateTime

  taxpayer     Taxpayer @relation(fields: [taxpayerId], references: [id])
}

model AuditTrail {
  id            String      @id @default(uuid())
  transactionId String
  taxpayerId    String
  auditorId     String      // Unique ID matching internal/external auditor credentials
  auditorRole   String      // "INTERNAL_AUDITOR", "EXTERNAL_AUDITOR", "AABE_OFFICER", "MOR_OFFICER"
  statusAssigned AuditStatus
  comments      String?
  reviewedAt    DateTime    @default(now())

  transaction   Transaction @relation(fields: [transactionId], references: [id])
  taxpayer      Taxpayer    @relation(fields: [taxpayerId], references: [id])
}
```

---

## 4. NestJS Backend Core (Akaunting Model)

### Transaction Controller (`transaction.controller.ts`)
```typescript
import { Controller, Post, Body, Get, Param, UseGuards, Put, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, OfflineSyncDto } from './dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('declare-online')
  async declareOnline(@Body() dto: CreateTransactionDto) {
    return await this.transactionService.processOnlineDeclaration(dto);
  }

  @Post('sync-offline-batch')
  async syncOfflineBatch(@Body() dto: OfflineSyncDto) {
    return await this.transactionService.processOfflineBatch(dto);
  }

  @Put(':id/audit-action')
  async performAuditUpdate(
    @Param('id') transactionId: string,
    @Body('auditorId') auditorId: string,
    @Body('role') role: string,
    @Body('action') action: string,
    @Body('comments') comments: string
  ) {
    return await this.transactionService.applyAuditStatus(transactionId, auditorId, role, action, comments);
  }

  @Get('ledger/:taxpayerId')
  async getLedgerReport(
    @Param('taxpayerId') taxpayerId: string,
    @Query('lang') lang: string = 'en'
  ) {
    return await this.transactionService.generateLedgerReport(taxpayerId, lang);
  }
}
```

### Transaction & Audit Processing Service (`transaction.service.ts`)
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTransactionDto, OfflineSyncDto } from './dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async processOnlineDeclaration(dto: CreateTransactionDto) {
    const subTotal = dto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const vatAmount = dto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.vatRate / 100)), 0);
    const totalAmount = subTotal + vatAmount;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create Core Transaction
      const transaction = await tx.transaction.create({
        data: {
          invoiceNumber: dto.invoiceNumber,
          category: dto.category,
          sellerId: dto.sellerId,
          buyerId: dto.buyerId,
          contractId: dto.contractId,
          descriptionJson: dto.descriptionJson,
          subTotal,
          vatAmount,
          totalAmount,
          isOfflineSync: false,
          items: {
            create: dto.items
          }
        },
        include: { items: true }
      });

      // 2. Generate double-entry General Ledger updates
      await tx.generalLedger.create({
        data: {
          taxpayerId: dto.sellerId,
          accountCode: '5000', // VAT Payable Account
          accountName: 'VAT Output / የቫት እዳ',
          debit: 0,
          credit: vatAmount,
          balance: vatAmount,
          effectiveDate: new Date()
        }
      });

      return transaction;
    });
  }

  async processOfflineBatch(dto: OfflineSyncDto) {
    const recordsProcessed = [];
    for (const record of dto.transactions) {
      try {
        const processed = await this.processOnlineDeclaration(record);
        await this.prisma.transaction.update({
          where: { id: processed.id },
          data: { isOfflineSync: true, syncBatchId: dto.batchId }
        });
        recordsProcessed.push(processed.id);
      } catch (e) {
        // Log errors locally for conflict settlement matching
      }
    }
    return { status: 'BATCH_PROCESSED', synchronizedIds: recordsProcessed };
  }

  async applyAuditStatus(txId: string, auditorId: string, role: string, action: string, comments: string) {
    let targetStatus: any;
    if (role === 'INTERNAL_AUDITOR') targetStatus = 'INTERNAL_APPROVED';
    else if (role === 'EXTERNAL_AUDITOR') targetStatus = 'EXTERNAL_AUDITED';
    else if (role === 'AABE_OFFICER') targetStatus = 'AABE_CERTIFIED';
    else throw new BadRequestException('Unauthorized auditor scope');

    if (action === 'REJECT') targetStatus = 'REJECTED';

    return await this.prisma.auditTrail.create({
      data: {
        transactionId: txId,
        taxpayerId: auditorId, // Tracking entity context
        auditorId: auditorId,
        auditorRole: role,
        statusAssigned: targetStatus,
        comments
      }
    });
  }

  async generateLedgerReport(taxpayerId: string, lang: string) {
    const entries = await this.prisma.generalLedger.findMany({
      where: { taxpayerId },
      orderBy: { effectiveDate: 'asc' }
    });

    // Simple dictionary for dynamic language handling
    const localizedHeader = lang === 'am' ? 'የሂሳብ መግለጫ' : lang === 'ti' ? 'ናይ ሒሳብ መግለፂ' : 'General Ledger Report';
    return { header: localizedHeader, totalEntries: entries.length, entries };
  }
}
```

---

## 5. React Frontend Interface (`TaxpayerDeclarationForm.tsx`)

A React UI component designed for standard transactions. It features live VAT computation and language hooks to match the localized interface profile.

```typescript
import React, { useState, useEffect } from 'react';

interface ItemRow {
  itemCode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export const TaxpayerDeclarationForm: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'am' | 'ti'>('en');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [buyerTin, setBuyerTin] = useState('');
  const [category, setCategory] = useState('GOODS_SALE');
  const [items, setItems] = useState<ItemRow[]>([
    { itemCode: '', name: '', quantity: 1, unitPrice: 0, vatRate: 15 }
  ]);

  const [totals, setTotals] = useState({ subTotal: 0, vatAmount: 0, grandTotal: 0 });

  useEffect(() => {
    let sub = 0;
    let vat = 0;
    items.forEach((i) => {
      const lineSub = i.quantity * i.unitPrice;
      sub += lineSub;
      vat += lineSub * (i.vatRate / 100);
    });
    setTotals({ subTotal: sub, vatAmount: vat, grandTotal: sub + vat });
  }, [items]);

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { itemCode: '', name: '', quantity: 1, unitPrice: 0, vatRate: 15 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { invoiceNumber, category, buyerTin, items, lang };
    
    // API Route Mapping to NestJS Backend Gateway
    const response = await fetch('/api/transactions/declare-online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert(lang === 'am' ? 'ዲክላሬሽን በተሳካ ሁኔታ ተልኳል!' : lang === 'ti' ? 'ዲክላሬሽን ብዓወት ተላኢኹ ኣሎ!' : 'Declaration submitted successfully!');
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>OVDS - Portal Entry</h2>
        <select value={lang} onChange={(e) => setLang(e.target.value as any)}>
          <option value="en">English</option>
          <option value="am">አማርኛ (Amharic)</option>
          <option value="ti">ትግርኛ (Tigrinya)</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Invoice Identifier / የክፍያ መጠየቂያ ቁጥር</label>
          <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Buyer TIN / የገዢው ታክስ ከፋይ መለያ ቁጥር</label>
          <input type="text" value={buyerTin} onChange={(e) => setBuyerTin(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Transaction Type / የግብይት ዓይነት</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
            <option value="GOODS_SALE">Goods Sale / የዕቃዎች ሽያጭ</option>
            <option value="INTELLECTUAL_PROPERTY_TRANSFER">Intellectual Property / የሐሳብ ሀብት ዝውውር</option>
            <option value="CONSTRUCTION_CONTRACT">Construction Contract / የህንፃ ኮንትራት ስራ</option>
            <option value="BUSINESS_LIQUIDATION">Business Closing / ድርጅት መዝጋት</option>
          </select>
        </div>

        <h3>Line Items / ዝርዝር ንብረቶች</h3>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input placeholder="HS Item Code" type="text" value={item.itemCode} onChange={(e) => handleItemChange(idx, 'itemCode', e.target.value)} style={{ flex: 2, padding: '6px' }} />
            <input placeholder="Description" type="text" value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} style={{ flex: 3, padding: '6px' }} />
            <input placeholder="Qty" type="number" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value))} style={{ flex: 1, padding: '6px' }} />
            <input placeholder="Unit Price" type="number" value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value))} style={{ flex: 2, padding: '6px' }} />
          </div>
        ))}

        <button type="button" onClick={addItemRow} style={{ padding: '8px 12px', background: '#e0e0e0', border: 'none', cursor: 'pointer', marginBottom: '20px' }}>
          + Add Line Item
        </button>

        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px', textAlign: 'right' }}>
          <p>Subtotal: <strong>ETB {totals.subTotal.toFixed(2)}</strong></p>
          <p>Calculated VAT (15%): <strong>ETB {totals.vatAmount.toFixed(2)}</strong></p>
          <h4 style={{ margin: 0 }}>Grand Total: <span style={{ color: '#2e7d32' }}>ETB {totals.grandTotal.toFixed(2)}</span></h4>
        </div>

        <button type="submit" style={{ marginTop: '15px', width: '100%', padding: '12px', background: '#1976d2', color: '#fff', fontSize: '16px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
          Transmit Legal Ledger Declaration
        </button>
      </form>
    </div>
  );
};
```

---

## 6. Financial Third-Party Integration Framework

### Telebirr & Banking Payment Settlement Integration (`telebirr.service.ts`)
```typescript
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TelebirrIntegrationService {
  private publicKey = process.env.TELEBIRR_PUBLIC_KEY;
  private appId = process.env.TELEBIRR_APP_ID;

  // Generates encrypted payment strings matching Telebirr API requirements
  generatePaymentPayload(invoiceId: string, amount: number, callbackUrl: string) {
    const rawPayload = {
      appId: this.appId,
      outTradeNo: invoiceId,
      totalAmount: amount.toString(),
      subject: 'OVDS Tax/VAT Settlement',
      notifyUrl: callbackUrl,
      timestamp: Date.now().toString()
    };

    const sign = this.signPayload(rawPayload);
    return { ...rawPayload, sign };
  }

  private signPayload(payload: any): string {
    const sortedString = Object.keys(payload).sort().map(key => `${key}=${payload[key]}`).join('&');
    return crypto.createHmac('sha256', process.env.TELEBIRR_APP_SECRET || 'secret').update(sortedString).digest('hex');
  }

  async verifyWebhookSignature(receivedPayload: any, signature: string): Promise<boolean> {
    const computedSignature = this.signPayload(receivedPayload);
    return computedSignature === signature;
  }
}
```

### Offline Client Cryptographic Sync Module
For remote or offline businesses with poor internet access, data can be run locally using the same schema setup. Transactions are cryptographically signed using the merchant's private key and exported to an external drive (e.g., flash drive, SD card). When connected to a network, the backend reads and processes the batch file.

```typescript
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OfflineSecuritySyncModule {
  // Signs local database logs before file system export
  generateOfflineEncryptedPackage(merchantTin: string, transactionsJson: string, privateKeyPem: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(transactionsJson);
    const signature = sign.sign(privateKeyPem, 'hex');

    const manifest = {
      merchantTin,
      timestamp: new Date().toISOString(),
      payload: transactionsJson,
      signature
    };

    return JSON.stringify(manifest);
  }

  // Gateway verification step for uploaded files from offline storage media
  verifyOfflinePackage(encryptedPackageStr: string, publicKeyPem: string): boolean {
    const manifest = JSON.parse(encryptedPackageStr);
    const verify = crypto.createVerify('SHA256');
    verify.update(manifest.payload);
    
    return verify.verify(publicKeyPem, manifest.signature, 'hex');
  }
}
```
