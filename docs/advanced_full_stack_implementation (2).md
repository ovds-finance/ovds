# Online VAT Declaration System (OVDS) - Enterprise Advanced Architecture & Implementation Blueprint


This production-ready implementation file outlines the high-performance architectural ecosystem for **OVDS**, inspired by **Akaunting's** modern modular patterns and built inside an enterprise **Nx Dev Tools Monorepo workspace**. It targets high-scale digital financial accounting infrastructure for the **Ministry of Revenues (MoR)**, handling both high-throughput cloud operations and offline regional network failures.

OVDS uses an **Nx Workspace** to enforce a decoupled, enterprise-grade separation of concerns. This structure models the business domain logic exactly like **Akaunting's modular core**, splitting the platform into highly cohesive, single-responsibility business apps and shared utility libraries.
---

## 📂 High-Performance Enterprise Monorepo Structure

```text
apps/
├── portal/            # React 19 Client: Advanced Tenant Dashboard, Sales, Purchase, Hr, Inventory, VAT Ledger, Banking, CRM, Item
├── ovds-mor/              # React 19 Client: Internal Auditor Platform, External Auditor Platform, AABE Auditor Platform, Auditor Platform, Fraud Detection, Multi-tenant Overview
├── backend/               # NestJS Enterprise API: Core Engine, Core Ledger, Core Module, Financial Reporting
└── ovds-sync/                # NestJS Microservice: Off-Grid Batch Sync Processor (Cron/Queue)

Packages/
├── ledger/                     # Shared NestJS Dynamic Double-Entry Engine & Tax Validation Modules
├── Auditor/                    # 
├── banking/                # Decoupled Adapters for Telebirr API & CBE Core Banking Hooks
├── shared/                     # Unified Type-Safe Contracts, Validation Vectors, and TIN Registries
└── database/                        # Prisma Client Engine, Multi-Tenant Query Middleware, Migrations
```

---

## 🛠️ Production-Ready Multi-Tenant Database Schema

This highly optimized `schema.prisma` architecture models complex financial transactions, tracking physical assets, intellectual property transfers, inheritance adjustments, and real estate state leases. It uses index-optimized tables, strict decimal field mapping, and structural multi-tenant partitioning.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-node"
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

enum TenantType {
  NATURAL_PERSON
  LEGAL_ENTITY
}

enum ConnectionMode {
  DIRECT_ONLINE
  OFFLINE_HYBRID
}

enum AssetCategory {
  RAW_MATERIAL
  FINISHED_GOOD
  INTELLECTUAL_PROPERTY
  REAL_ESTATE
  INFRASTRUCTURE_CONTRACT
}

enum TransactionType {
  B2B_TRADE
  IMPORT_LOGISTICS
  STATE_LEASE
  DONATION_COMMUNITY
  INHERITANCE_TRANSFER
  ASSET_LIQUIDATION
}

enum EntryType {
  DEBIT
  CREDIT
}

enum DeclarationStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  AUDITED
  CLEARED
  AMENDED
}

model TaxpayerTenant {
  id              String           @id @default(uuid())
  tinNumber       String           @unique
  legalName       String
  tradeName       String?
  type            TenantType
  connectionMode  ConnectionMode   @default(DIRECT_ONLINE)
  publicKeyFingerprint String?      // Cryptographic verification for offline hybrid clients
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  accounts        ChartOfAccount[]
  inventories     AssetInventory[]
  declarations    VatDeclaration[]
  transactions    JournalTransaction[]
  syncLogs        OfflineSyncLog[]

  @@index([tinNumber])
}

model ChartOfAccount {
  id              String           @id @default(uuid())
  tenantId        String
  code            String           // e.g., "1100", "2200"
  name            String
  isVatApplicable Boolean          @default(true)
  vatRate         Decimal          @default(15.00) @db.Decimal(5, 2)
  
  tenant          TaxpayerTenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  ledgerEntries   LedgerEntry[]

  @@unique([tenantId, code])
}

model AssetInventory {
  id              String           @id @default(uuid())
  tenantId        String
  sku             String
  name            String
  category        AssetCategory
  quantity        Decimal          @default(0.00) @db.Decimal(18, 4)
  unitOfMeasure   String
  unitCost        Decimal          @db.Decimal(18, 4)
  
  tenant          TaxpayerTenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, sku])
}

model JournalTransaction {
  id              String           @id @default(uuid())
  tenantId        String
  referenceNumber String           @unique // Generated by tenant system or OVDS
  type            TransactionType
  narration       String
  isOfflineIssued Boolean          @default(false)
  offlineSyncedAt DateTime?
  createdAt       DateTime         @default(now())
  
  tenant          TaxpayerTenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  entries         LedgerEntry[]
  vatDeclaration  VatDeclaration?  @relation(fields: [declarationId], references: [id])
  declarationId   String?

  @@index([tenantId, createdAt])
}

model LedgerEntry {
  id              String             @id @default(uuid())
  transactionId   String
  accountId       String
  type            EntryType
  amount          Decimal            @db.Decimal(18, 4)
  vatAmount       Decimal            @default(0.00) @db.Decimal(18, 4)
  
  transaction     JournalTransaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  account         ChartOfAccount     @relation(fields: [accountId], references: [id])

  @@index([transactionId, accountId])
}

model VatDeclaration {
  id              String             @id @default(uuid())
  tenantId        String
  taxPeriodYear   Int
  taxPeriodMonth  Int
  totalSales      Decimal            @db.Decimal(18, 4)
  totalVatOutput  Decimal            @db.Decimal(18, 4)
  totalPurchases  Decimal            @db.Decimal(18, 4)
  totalVatInput   Decimal            @db.Decimal(18, 4)
  netVatDue       Decimal            @db.Decimal(18, 4)
  status          DeclarationStatus  @default(DRAFT)
  paymentReference String?           @unique // Populated by Telebirr / CBE payment callbacks
  
  tenant          TaxpayerTenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  transactions    JournalTransaction[]

  @@unique([tenantId, taxPeriodYear, taxPeriodMonth])
}

model OfflineSyncLog {
  id              String           @id @default(uuid())
  tenantId        String
  batchId         String           @unique
  payloadHash     String
  processedCount  Int
  syncErrors      String?
  syncedAt        DateTime         @default(now())
  
  tenant          TaxpayerTenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}
```

---

## 🎛️ NestJS Enterprise Core Double-Entry Engine

This service validates the double-entry accounting ledger balance condition across the system before committing changes.

```typescript
// ledger/src/domain/ledger-engine.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { TransactionType, EntryType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface EntryInput {
  accountId: string;
  type: EntryType;
  amount: number;
  vatAmount: number;
}

export interface JournalPayload {
  tenantId: string;
  referenceNumber: string;
  type: TransactionType;
  narration: string;
  isOfflineIssued: boolean;
  entries: EntryInput[];
}

@Injectable()
export class LedgerEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async postJournalTransaction(payload: JournalPayload) {
    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    for (const entry of payload.entries) {
      const entryAmt = new Decimal(entry.amount);
      if (entry.type === EntryType.DEBIT) {
        totalDebits = totalDebits.plus(entryAmt);
      } else {
        totalCredits = totalCredits.plus(entryAmt);
      }
    }

    if (!totalDebits.equals(totalCredits)) {
      throw new BadRequestException(
        `Imbalanced Accounting Ledger Equation: Total Debits [${totalDebits.toString()}] must exactly equal Total Credits [${totalCredits.toString()}]`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const tenantExists = await tx.taxpayerTenant.findUnique({
        where: { id: payload.tenantId },
      });
      if (!tenantExists) {
        throw new BadRequestException(`Tenant Identity Context [${payload.tenantId}] unregistered.`);
      }

      const transaction = await tx.journalTransaction.create({
        data: {
          tenantId: payload.tenantId,
          referenceNumber: payload.referenceNumber,
          type: payload.type,
          narration: payload.narration,
          isOfflineIssued: payload.isOfflineIssued,
        },
      });

      const entryPromises = payload.entries.map((entry) =>
        tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: entry.accountId,
            type: entry.type,
            amount: new Decimal(entry.amount),
            vatAmount: new Decimal(entry.vatAmount),
          },
        })
      );

      await Promise.all(entryPromises);
      return transaction;
    });
  }
}
```

---

## 💳 Real-Time Third-Party Integration Infrastructure

This controller securely handles cryptographic transaction notifications from **Telebirr** and **Commercial Bank of Ethiopia (CBE)**.

```typescript
// banking/src/controllers/payment-gateway.controller.ts
import { Controller, Post, Body, Headers, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { DeclarationStatus } from '@prisma/client';
import * as crypto from 'crypto';

interface TelebirrCallbackDto {
  msisdn: string;
  totalAmount: string;
  transactionNo: string;
  outTradeNo: string; // Maps directly to our declarationId string
  updatedTime: string;
}

@Controller('api/v1/payment-callbacks')
export class PaymentGatewayController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('telebirr-webhook')
  @HttpCode(HttpStatus.OK)
  async handleTelebirrHook(
    @Body() payload: TelebirrCallbackDto,
    @Headers('X-Telebirr-Signature') signature: string
  ) {
    const isVerified = this.verifyTelebirrSignature(payload, signature);
    if (!isVerified) {
      throw new BadRequestException('Cryptographic Webhook Validation Handshake Failed');
    }

    return this.prisma.$transaction(async (tx) => {
      const declaration = await tx.vatDeclaration.findUnique({
        where: { id: payload.outTradeNo },
      });

      if (!declaration) {
        throw new BadRequestException('Target VAT declaration asset reference not found');
      }

      return tx.vatDeclaration.update({
        where: { id: payload.outTradeNo },
        data: {
          status: DeclarationStatus.CLEARED,
          paymentReference: payload.transactionNo,
        },
      });
    });
  }

  private verifyTelebirrSignature(payload: TelebirrCallbackDto, signature: string): boolean {
    if (!signature) return false;
    const publicKey = process.env.TELEBIRR_PUBLIC_KEY || 'mock-public-key';
    const verifier = crypto.createVerify('SHA256');
    verifier.update(JSON.stringify(payload));
    try {
      return verifier.verify(publicKey, signature, 'base64');
    } catch {
      return false;
    }
  }
}
```

---

## 💻 Advanced Real-Time Multi-Tenant Accounting Dashboard

This stateful React interface handles live transaction pipelines, localized tax rules, and connection indicators for offline operations.

```typescript
// apps/portal/src/components/VatLedgerDashboard.tsx
import React, { useState, useEffect } from 'react';

interface AccountSummary {
  tinNumber: string;
  legalName: string;
  connectionMode: 'DIRECT_ONLINE' | 'OFFLINE_HYBRID';
  outstandingVatDue: number;
}

export const VatLedgerDashboard: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/taxpayers/${tenantId}/summary`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId]);

  if (loading) return <div className="p-8 text-slate-500 font-medium">Loading OVDS Engine State Matrix...</div>;
  if (!summary) return <div className="p-8 text-rose-500 font-medium">Failed to initialize taxpayer state context.</div>;

  return (
    <div className="p-8 bg-slate-50 min-screen-y-100 font-sans">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{summary.legalName}</h1>
          <p className="text-sm text-slate-500 mt-1">TIN Identification Number: <span className="font-mono font-bold text-slate-700">{summary.tinNumber}</span></p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`h-2.5 w-2.5 rounded-full ${summary.connectionMode === 'DIRECT_ONLINE' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
            {summary.connectionMode.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Outstanding VAT Balance</h3>
          <p className="text-3xl font-black text-slate-900 mt-2 font-mono">
            {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(summary.outstandingVatDue)}
          </p>
          <div className="mt-4">
            <button 
              disabled={summary.outstandingVatDue <= 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all text-sm disabled:bg-slate-100 disabled:text-slate-400"
            >
              Settle Balance via Telebirr / CBE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🛡️ Production Deployment Architecture Verification Checklist

1. **Database Schema Setup:** Run `npx prisma migrate dev` within your database infrastructure library folder to generate multi-tenant optimization parameters.
2. **Environment Variable Configurations:** Populate `DATABASE_URL`, `TELEBIRR_PUBLIC_KEY`, and `CBE_SOAP_ENDPOINT` within your target NestJS production container frameworks.
3. **Multi-Tenant Partition Engine Guard:** Check that all custom routes filter explicitly on input `tenantId` query keys to prevent unauthorized horizontal cross-tenant access.


# Auditor Platform Architecture (NestJS + Prisma)

This blueprint defines a multi-tenant ecosystem containing four core operational portals along with an AI/Rule-based Fraud Detection system. 

## 1. Domain Matrix & Multi-Tenant Model

The platform uses a **Discriminator-Based Single-Database Multi-Tenancy** approach for architectural simplicity and cross-tenant regulatory aggregation by the oversight body (AABE), backed by row-level isolation and multi-tenant middleware context.

*   **Internal Auditor Platform:** Dedicated workspace for organization-specific internal audit teams evaluating internal controls, risks, and operational compliance.
*   **External Auditor Platform:** Independent workspace for external CPA firms performing statutory financial statement audits and issuing independent opinions.
*   **AABE Auditor Platform:** The sovereign oversight portal for the **Accounting and Auditing Board of Ethiopia (AABE)** to monitor firm registrations, enforce quality control reviews, and receive regulatory compliance filings.
*   **Auditor Platform (Core / Base Hub):** Shared core engines containing user management, shared workflows, global taxonomies, notifications, and document storage templates.
*   **Fraud Detection Engine:** Asynchronous rule/AI evaluation engine running across audit samples, transactional data, and ledger extracts to flag anomalies (e.g., Benford's Law anomalies, duplicate invoices, round numbers).

---

## 2. Comprehensive Prisma Schema (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  GLOBAL_ADMIN
  AABE_SUPERVISOR
  AABE_INSPECTOR
  EXTERNAL_PARTNER
  EXTERNAL_AUDITOR
  INTERNAL_DIRECTOR
  INTERNAL_AUDITOR
}

enum TenantType {
  AUDIT_FIRM       // For External Auditors
  ENTERPRISE       // For Internal Audit Departments
  REGULATOR        // AABE itself
}

enum AuditType {
  INTERNAL_OPERATIONAL
  INTERNAL_FINANCIAL
  EXTERNAL_STATUTORY
  AABE_QUALITY_INSPECTION
}

enum AuditStatus {
  PLANNING
  FIELDWORK
  REVIEW
  REPORTING
  ARCHIVED
}

enum FindingSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum FraudStatus {
  SUSPECTED
  UNDER_INVESTIGATION
  CLEARED
  CONFIRMED
}

// --- MULTI-TENANT CORE ---

model Tenant {
  id          String     @id @default(uuid())
  name        String
  type        TenantType
  taxId       String?    @unique // TIN Number
  licenseNo   String?    @unique // AABE Practice License Number for firms
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  users       User[]
  engagements AuditEngagement[]
  fraudAlerts FraudAlert[]
  auditLogs   AuditTrail[]

  @@index([type])
}

model User {
  id          String       @id @default(uuid())
  email       String       @unique
  passwordHash String
  firstName   String
  lastName    String
  role        UserRole
  isActive    Boolean      @default(true)
  tenantId    String
  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relations
  assignedAudits AuditEngagement[] @relation("AuditorAssignments")
  ledEngagements AuditEngagement[] @relation("LeadAuditor")
  findingsFound  AuditFinding[]    @relation("FindingCreator")
  actionsOwned   CorrectiveAction[]
  reviewsDone    QualityReview[]

  @@index([tenantId])
  @@index([email])
}

// --- AUDIT WORKFLOW MANAGEMENT ---

model AuditEngagement {
  id            String         @id @default(uuid())
  title         String
  fiscalYear    Int
  type          AuditType
  status        AuditStatus    @default(PLANNING)
  startDate     DateTime
  endDate       DateTime?
  
  // Multi-tenant context (The firm conducting it OR the enterprise owning it)
  tenantId      String
  tenant        Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Dynamic Target (For External audits: links to an Enterprise tenant ID being audited)
  targetEntityId String?        

  leadAuditorId String
  leadAuditor   User           @relation("LeadAuditor", fields: [leadAuditorId], references: [id])
  teamMembers   User[]         @relation("AuditorAssignments")
  
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  // Relations
  procedures    AuditProcedure[]
  findings      AuditFinding[]
  fraudAlerts   FraudAlert[]
  qualityReview QualityReview?

  @@index([tenantId])
  @@index([status])
}

model AuditProcedure {
  id            String          @id @default(uuid())
  engagementId  String
  engagement    AuditEngagement @relation(fields: [engagementId], references: [id], onDelete: Cascade)
  title         String
  description   String
  isCompleted   Boolean         @default(false)
  completedAt   DateTime?
  
  // Workpapers / Evidence tracking
  workpaperUrl  String?
  
  @@index([engagementId])
}

model AuditFinding {
  id            String          @id @default(uuid())
  engagementId  String
  engagement    AuditEngagement @relation(fields: [engagementId], references: [id], onDelete: Cascade)
  title         String
  description   String
  criteria      String?         // What should be
  condition     String?         // What is found
  cause         String?         // Why it happened
  effect        String?         // Financial impact / exposure
  severity      FindingSeverity @default(MEDIUM)
  
  createdById   String
  createdBy     User            @relation("FindingCreator", fields: [createdById], references: [id])
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  // Relations
  correctiveActions CorrectiveAction[]
  fraudAlerts       FraudAlert[]

  @@index([engagementId])
}

model CorrectiveAction {
  id          String       @id @default(uuid())
  findingId   String
  finding     AuditFinding @relation(fields: [findingId], references: [id], onDelete: Cascade)
  description String
  dueDate     DateTime
  isResolved  Boolean      @default(false)
  resolvedAt  DateTime?
  
  ownerId     String
  owner       User         @relation(fields: [ownerId], references: [id])

  @@index([findingId])
}

// --- FRAUD DETECTION ENGINE ---

model FraudAlert {
  id            String          @id @default(uuid())
  tenantId      String
  tenant        Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  engagementId  String?
  engagement    AuditEngagement? @relation(fields: [engagementId], references: [id], onDelete: SetNull)
  findingId     String?
  finding       AuditFinding?    @relation(fields: [findingId], references: [id], onDelete: SetNull)
  
  title         String
  description   String
  riskScore     Float           // 0.0 to 100.0 scale
  ruleTriggered String          // e.g., "BENFORDS_LAW_VIOLATION", "ROUND_NUMBER_DUPLICATION"
  status        FraudStatus     @default(SUSPECTED)
  metaData      Json?           // Stores anomalous raw transaction rows or ledger indexes
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([tenantId])
  @@index([status])
  @@index([riskScore])
}

// --- AABE QUALITY REVIEWS (OVERSIGHT) ---

model QualityReview {
  id            String          @id @default(uuid())
  engagementId  String          @unique
  engagement    AuditEngagement @relation(fields: [engagementId], references: [id], onDelete: Cascade)
  
  inspectorId   String
  inspector     User            @relation(fields: [inspectorId], references: [id])
  score         Float           // Quality score out of 100
  complianceNotes String
  deficienciesFound Boolean     @default(false)
  
  createdAt     DateTime        @default(now())

  @@index([inspectorId])
}

// --- GLOBAL SECURE AUDIT TRAIL ---

model AuditTrail {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId    String?
  userEmail String?
  action    String   // e.g., "UPDATE_WORKPAPER", "DELETE_FINDING"
  ipAddress String?
  timestamp DateTime @default(now())

  @@index([tenantId])
  @@index([timestamp])
}
```

---

## 3. NestJS Code Architecture Blueprint

### A. Multi-Tenant Scoped Interceptor

Ensures every query binds to the current user's tenant ID, providing strong platform multi-tenant partitioning.

```typescript
// src/common/interceptors/tenant.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Appended by AuthGuard via JWT payload

    if (user && user.tenantId) {
      // Bind tenant context safely to the request scope
      request.tenantId = user.tenantId;
      request.userRole = user.role;
    }

    return next.handle();
  }
}
```

### B. Prisma Multi-Tenant Extension Context

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper template method to enforce tenant constraints dynamically
  forTenant(tenantId: string) {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // Apply filtering logic across models containing tenant context
            if ('tenantId' in (args as any)?.where || model === 'Tenant') {
              return query(args);
            }
            if (['findFirst', 'findMany', 'update', 'delete', 'count'].includes(operation)) {
              args.where = { ...args.where, tenantId };
            }
            return query(args);
          },
        },
      },
    });
  }
}
```

### C. Fraud Detection Service Engine

```typescript
// src/fraud-detection/fraud-detection.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FraudStatus } from '@prisma/client';

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Scans a sample dataset for structural data risks (e.g. Round Number Anomalies)
   */
  async scanLedgerForRoundNumbers(tenantId: string, engagementId: string, transactions: any[]) {
    this.logger.log(`Starting fraud scan for Tenant: ${tenantId}, Engagement: ${engagementId}`);
    
    const anomalyThreshold = 10000; 
    const flaggedTransactions = transactions.filter(tx => tx.amount % 1000 === 0 && tx.amount > anomalyThreshold);

    if (flaggedTransactions.length > 0) {
      await this.prisma.fraudAlert.create({
        data: {
          tenantId,
          engagementId,
          title: 'High Materiality Round Number Clusters',
          description: `Detected ${flaggedTransactions.length} items ending in precise thousands values. Potential structural journal entry override.`,
          riskScore: 78.5,
          ruleTriggered: 'ROUND_NUMBER_DUPLICATION',
          status: FraudStatus.SUSPECTED,
          metaData: flaggedTransactions,
        },
      });
      this.logger.warn(`Fraud Alert created for Tenant ${tenantId} containing ${flaggedTransactions.length} anomalies.`);
    }
    
    return flaggedTransactions;
  }
}
```

### D. Multi-Tenant Overview Control

Provides top-level orchestration analytics across all systems.

```typescript
// src/overview/overview.controller.ts
import { Controller, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('overview')
@UseGuards(RolesGuard)
export class OverviewController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('metrics')
  @Roles(UserRole.AABE_SUPERVISOR, UserRole.GLOBAL_ADMIN)
  async getGlobalSystemOverview(@Req() req: any) {
    // Cross-tenant analytics visibility reserved strictly for oversight supervisors (AABE)
    const metrics = await this.prisma.$transaction([
      this.prisma.tenant.count(),
      this.prisma.auditEngagement.count(),
      this.prisma.fraudAlert.count({ where: { status: 'SUSPECTED' } }),
      this.prisma.auditFinding.count({ where: { severity: 'CRITICAL' } }),
    ]);

    return {
      totalRegisteredTenants: metrics[0],
      activeEngagements: metrics[1],
      unresolvedFraudAlerts: metrics[2],
      criticalFindingsCount: metrics[3],
    };
  }
}


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