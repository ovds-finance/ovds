# 33 — Reconciliation and Transaction Matching

## 1. Reconciliation Overview

Reconciliation matches transactions against external sources (bank statements, accounting systems, payment processors) to ensure data accuracy.

```
┌─────────────────────────────────────────────────────────────┐
│                    Reconciliation Engine                     │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────────┐  │
│  │   Bank       │    │   Internal   │    │  Accounting    │  │
│  │  Statement   │    │  Transactions│    │  System        │  │
│  └─────────────┘    └─────────────┘    └────────────────┘  │
│         │                    │                    │          │
│         └────────────────────┼────────────────────┘          │
│                              ▼                               │
│                   ┌─────────────────────┐                    │
│                   │   Matching Engine   │                    │
│                   │  - Exact match      │                    │
│                   │  - Fuzzy match      │                    │
│                   │  - Manual match     │                    │
│                   └─────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## 2. Reconciliation Models

```prisma
model Reconciliation {
  id              String   @id @default(cuid())
  organizationId  String
  type            String   // "bank", "accounting", "payment"
  source          String   // "bank_statement", "xero", "quickbooks"
  sourceReference String
  status          String   @default("pending") // pending, matched, partial, completed, failed
  matchedCount    Int      @default(0)
  totalCount      Int      @default(0)
  difference      Decimal? @db.Decimal(15, 2)
  startedAt       DateTime?
  completedAt     DateTime?
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  items           ReconciliationItem[]

  @@index([organizationId, status])
  @@index([source, sourceReference])
}

model ReconciliationItem {
  id                String   @id @default(cuid())
  reconciliationId  String
  transactionId     String?
  externalId        String?
  type              String   // "match", "partial", "unmatched"
  amount            Decimal  @db.Decimal(15, 2)
  currencyCode      String   @db.Char(3)
  externalAmount    Decimal? @db.Decimal(15, 2)
  difference        Decimal? @db.Decimal(15, 2)
  matchConfidence   Decimal? @db.Decimal(5, 2) // 0-100
  matchReason       String?
  matchedAt         DateTime?
  matchedBy         String?
  createdAt         DateTime @default(now())

  reconciliation    Reconciliation @relation(fields: [reconciliationId], references: [id], onDelete: Cascade)
  transaction       Transaction?   @relation(fields: [transactionId], references: [id])

  @@index([reconciliationId])
  @@index([transactionId])
}
```

## 3. Matching Strategies

```typescript
// reconciliation/matching-strategies.ts
export enum MatchingStrategy {
  ExactAmountDate = 'exact_amount_date',
  ExactAmountReference = 'exact_amount_reference',
  FuzzyAmountDate = 'fuzzy_amount_date',
  FuzzyAmountReference = 'fuzzy_amount_reference',
  Manual = 'manual',
}

export interface MatchResult {
  transactionId: string;
  externalId: string;
  strategy: MatchingStrategy;
  confidence: number;
  difference?: Decimal;
}

@Injectable()
export class MatchingEngine {
  async match(reconciliationId: string): Promise<MatchingResult[]> {
    const reconciliation = await this.reconciliationService.findById(reconciliationId);
    const items = await this.reconciliationItemService.findByReconciliationId(reconciliationId);

    const matches: MatchResult[] = [];

    for (const item of items) {
      // Try exact match first
      const exactMatch = await this.findExactMatch(item);
      if (exactMatch) {
        matches.push(exactMatch);
        continue;
      }

      // Try fuzzy match
      const fuzzyMatch = await this.findFuzzyMatch(item);
      if (fuzzyMatch && fuzzyMatch.confidence > 80) {
        matches.push(fuzzyMatch);
        continue;
      }

      // Mark as unmatched
      matches.push({
        transactionId: '',
        externalId: item.externalId,
        strategy: MatchingStrategy.Manual,
        confidence: 0,
      });
    }

    return matches;
  }

  private async findExactMatch(item: ReconciliationItem): Promise<MatchResult | null> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        organizationId: item.reconciliation.organizationId,
        grossAmount: item.amount,
        currencyCode: item.currencyCode,
        transactionDate: item.transactionDate,
        isReconciled: false,
      },
    });

    if (!transaction) return null;

    return {
      transactionId: transaction.id,
      externalId: item.externalId,
      strategy: MatchingStrategy.ExactAmountDate,
      confidence: 100,
    };
  }

  private async findFuzzyMatch(item: ReconciliationItem): Promise<MatchResult | null> {
    const tolerance = Decimal(0.05); // 5% tolerance

    const candidates = await this.prisma.transaction.findMany({
      where: {
        organizationId: item.reconciliation.organizationId,
        grossAmount: { gte: item.amount.minus(tolerance), lte: item.amount.plus(tolerance) },
        transactionDate: {
          gte: subDays(item.transactionDate, 3),
          lte: addDays(item.transactionDate, 3),
        },
        isReconciled: false,
      },
    });

    if (candidates.length === 0) return null;

    const bestMatch = candidates.reduce((best, candidate) => {
      const amountDiff = Math.abs(candidate.grossAmount - item.amount);
      const dateDiff = Math.abs(candidate.transactionDate - item.transactionDate);
      const score = this.calculateMatchScore(amountDiff, dateDiff, item.amount);

      return score > best.score ? { transaction: candidate, score } : best;
    }, { transaction: null as any, score: 0 });

    if (bestMatch.score < 70) return null;

    return {
      transactionId: bestMatch.transaction.id,
      externalId: item.externalId,
      strategy: MatchingStrategy.FuzzyAmountDate,
      confidence: bestMatch.score,
      difference: item.amount.minus(bestMatch.transaction.grossAmount),
    };
  }

  private calculateMatchScore(amountDiff: Decimal, dateDiff: number, expectedAmount: Decimal): number {
    const amountScore = Math.max(0, 100 - (amountDiff.toNumber() / expectedAmount.toNumber()) * 100);
    const dateScore = Math.max(0, 100 - dateDiff * 10);
    return amountScore * 0.7 + dateScore * 0.3;
  }
}
```

## 4. Bank Statement Import

```typescript
// reconciliation/services/bank-import.service.ts
@Injectable()
export class BankImportService {
  async importStatement(orgId: string, file: Express.Multer.File): Promise<BankImportResult> {
    const transactions = this.parseBankFile(file);

    const reconciliation = await this.prisma.reconciliation.create({
      data: {
        organizationId: orgId,
        type: 'bank',
        source: this.detectBankFormat(file.originalname),
        sourceReference: file.originalname,
        status: 'pending',
        totalCount: transactions.length,
        createdBy: orgId,
      },
    });

    await this.prisma.reconciliationItem.createMany({
      data: transactions.map((t) => ({
        reconciliationId: reconciliation.id,
        externalId: t.id,
        amount: t.amount,
        currencyCode: t.currency,
        transactionDate: t.date,
        externalData: t,
      })),
    });

    return {
      reconciliationId: reconciliation.id,
      importedCount: transactions.length,
    };
  }

  private parseBankFile(file: Express.Multer.File): BankTransaction[] {
    // Parse CSV, OFX, or MT940 formats
    const ext = file.originalname.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'csv':
        return this.parseCsv(file.buffer);
      case 'ofx':
        return this.parseOfx(file.buffer);
      case 'mt940':
        return this.parseMt940(file.buffer);
      default:
        throw new UnsupportedBankFormatException(ext);
    }
  }
}
```

## 5. Auto-Reconciliation

```typescript
// reconciliation/services/auto-reconciliation.service.ts
@Injectable()
export class AutoReconciliationService {
  async autoReconcile(reconciliationId: string): Promise<AutoReconcileResult> {
    const reconciliation = await this.reconciliationService.findById(reconciliationId);
    const items = await this.reconciliationItemService.findByReconciliationId(reconciliationId);

    const results: AutoReconcileResult = {
      matched: 0,
      unmatched: 0,
      partial: 0,
    };

    for (const item of items) {
      const match = await this.matchingEngine.findBestMatch(item);

      if (match && match.confidence >= 95) {
        await this.applyMatch(item.id, match);
        results.matched++;
      } else if (match && match.confidence >= 70) {
        await this.applyPartialMatch(item.id, match);
        results.partial++;
      } else {
        results.unmatched++;
      }
    }

    await this.reconciliationService.updateStatus(reconciliationId, {
      matchedCount: results.matched,
      status: results.unmatched === 0 ? 'completed' : 'partial',
    });

    return results;
  }
}
```

## 6. Manual Reconciliation

```typescript
// reconciliation/services/manual-reconciliation.service.ts
@Injectable()
export class ManualReconciliationService {
  async manualMatch(reconciliationItemId: string, transactionId: string, userId: string): Promise<void> {
    await this.prisma.reconciliationItem.update({
      where: { id: reconciliationItemId },
      data: {
        transactionId,
        type: 'match',
        matchedAt: new Date(),
        matchedBy: userId,
        matchConfidence: 100,
        matchReason: 'Manual match',
      },
    });

    await this.transactionService.markReconciled(transactionId);
  }

  async unmatch(reconciliationItemId: string): Promise<void> {
    const item = await this.prisma.reconciliationItem.findUnique({
      where: { id: reconciliationItemId },
    });

    if (item?.transactionId) {
      await this.transactionService.unmarkReconciled(item.transactionId);
    }

    await this.prisma.reconciliationItem.update({
      where: { id: reconciliationItemId },
      data: {
        transactionId: null,
        type: 'unmatched',
        matchedAt: null,
        matchedBy: null,
        matchConfidence: 0,
      },
    });
  }
}
```

## 7. Reconciliation Reporting

```typescript
// reconciliation/services/reconciliation-report.service.ts
@Injectable()
export class ReconciliationReportService {
  async generateReport(orgId: string, reconciliationId: string): Promise<ReconciliationReport> {
    const reconciliation = await this.reconciliationService.findById(reconciliationId);
    const items = await this.reconciliationItemService.findByReconciliationId(reconciliationId);

    const matched = items.filter((i) => i.type === 'match');
    const partial = items.filter((i) => i.type === 'partial');
    const unmatched = items.filter((i) => i.type === 'unmatched');

    const matchedAmount = matched.reduce((sum, i) => sum.plus(i.amount), Decimal.ZERO);
    const unmatchedAmount = unmatched.reduce((sum, i) => sum.plus(i.amount), Decimal.ZERO);

    return {
      reconciliationId,
      organizationId: orgId,
      period: {
        from: reconciliation.createdAt,
        to: new Date(),
      },
      summary: {
        totalItems: items.length,
        matchedCount: matched.length,
        partialCount: partial.length,
        unmatchedCount: unmatched.length,
        matchedAmount: this.roundingService.roundCurrency(matchedAmount),
        unmatchedAmount: this.roundingService.roundCurrency(unmatchedAmount),
        matchRate: (matched.length / items.length) * 100,
      },
      items: items.map((i) => ({
        id: i.id,
        externalId: i.externalId,
        amount: i.amount,
        type: i.type,
        transactionId: i.transactionId,
        confidence: i.matchConfidence,
      })),
    };
  }
}
```

## 8. Multi-Statement Reconciliation

```typescript
// reconciliation/services/multi-statement.service.ts
@Injectable()
export class MultiStatementReconciliationService {
  async reconcileMultipleStatements(orgId: string, statementIds: string[]): Promise<MultiStatementResult> {
    const statements = await this.prisma.reconciliation.findMany({
      where: {
        id: { in: statementIds },
        organizationId: orgId,
      },
    });

    const allItems = await this.prisma.reconciliationItem.findMany({
      where: {
        reconciliationId: { in: statementIds },
      },
      include: { transaction: true },
    });

    // Deduplicate across statements
    const uniqueItems = this.deduplicateItems(allItems);

    // Run matching engine
    const matches = await this.matchingEngine.matchBatch(uniqueItems);

    return {
      statementCount: statements.length,
      totalItems: uniqueItems.length,
      matched: matches.filter((m) => m.confidence >= 95).length,
      partial: matches.filter((m) => m.confidence >= 70 && m.confidence < 95).length,
      unmatched: matches.filter((m) => m.confidence < 70).length,
    };
  }

  private deduplicateItems(items: ReconciliationItem[]): ReconciliationItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = `${item.externalId}:${item.amount}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
```

## 9. Reconciliation Metrics

```typescript
// reconciliation/metrics.service.ts
@Injectable()
export class ReconciliationMetricsService {
  async getMetrics(orgId: string, period: DateRange): Promise<ReconciliationMetrics> {
    const reconciliations = await this.prisma.reconciliation.findMany({
      where: {
        organizationId: orgId,
        createdAt: { gte: period.from, lte: period.to },
      },
    });

    const totalItems = reconciliations.reduce((sum, r) => sum + r.totalCount, 0);
    const matchedItems = reconciliations.reduce((sum, r) => sum + r.matchedCount, 0);

    return {
      totalReconciliations: reconciliations.length,
      totalItems,
      matchedItems,
      unmatchedItems: totalItems - matchedItems,
      matchRate: totalItems > 0 ? (matchedItems / totalItems) * 100 : 0,
      averageMatchRate: reconciliations.length > 0
        ? reconciliations.reduce((sum, r) => sum + (r.matchedCount / r.totalCount) * 100, 0) / reconciliations.length
        : 0,
    };
  }
}
```

## 10. Bank Feed Integration

```typescript
// reconciliation/services/bank-feed.service.ts
export interface BankFeedConnection {
  id: string;
  organizationId: string;
  provider: string; // "plaid", "teller", "bank_api"
  status: 'connected' | 'disconnected' | 'error';
  credentials: Json;
  lastSyncAt?: Date;
}

@Injectable()
export class BankFeedService {
  async connect(orgId: string, provider: string, credentials: any): Promise<BankFeedConnection> {
    // Exchange public token for access token
    const accessToken = await this.exchangeToken(provider, credentials.publicToken);

    return this.prisma.bankFeedConnection.create({
      data: {
        organizationId: orgId,
        provider,
        status: 'connected',
        credentials: this.encrypt(accessToken),
        lastSyncAt: new Date(),
      },
    });
  }

  async sync(connectionId: string): Promise<BankSyncResult> {
    const connection = await this.prisma.bankFeedConnection.findUnique({
      where: { id: connectionId },
    });

    const transactions = await this.fetchBankTransactions(connection);

    const result = await this.importService.importTransactions(
      connection.organizationId,
      transactions,
    );

    await this.prisma.bankFeedConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date() },
    });

    return result;
  }
}
```
