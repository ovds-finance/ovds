# 57 — Audit Logging and Compliance Tracking

## 1. Audit Architecture

The audit system provides tamper-evident logging of all critical actions.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Audit Logging System                        │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Audit     │  │   Audit     │  │   Retention Policies     │ │
│  │   Events    │  │   Storage   │  │                         │ │
│  │             │  │             │  │ - Hot (30d): PostgreSQL │ │
│  │ - Auth      │  │ - Postgres  │  │ - Warm (1y): S3/Obj    │ │
│  │ - CRUD      │  │ - Archive   │  │ - Cold (7y): Glacier   │ │
│  │ - Tax       │  │ - Digest    │  │                         │ │
│  │ - Export    │  │             │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Integrity Verify  │                        │
│                   │   (Hash Chain)      │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Audit Log Model

```prisma
model AuditLog {
  id            String   @id @default(cuid())
  organizationId String
  actorId       String
  actorType     String   // "user", "system", "api"
  event         String   // "transaction.created", "vat_return.submitted"
  category      String   // "auth", "crud", "tax", "export", "system"
  resourceType  String?  // "Transaction", "VatReturn", "Invoice"
  resourceId    String?
  beforeState   Json?
  afterState    Json?
  ipAddress     String?
  userAgent     String?
  metadata      Json?
  hash          String   @unique
  previousHash  String?
  createdAt     DateTime @default(now()) @db.Timestamptz

  @@index([organizationId, createdAt])
  @@index([organizationId, event])
  @@index([organizationId, actorId])
  @@index([category])
  @@index([createdAt])
}
```

## 3. Audit Event Decorator

```typescript
// audit/audit.decorator.ts
export const Audit = (event: string, category: AuditCategory) => MethodDecorator & ClassDecorator;

export function ApplyAudit(
  event: string,
  category: AuditCategory = 'crud',
  captureBefore = true,
): MethodDecorator {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const beforeState = captureBefore ? JSON.stringify(args[0]) : null;
      const result = await originalMethod.apply(this, args);
      const afterState = JSON.stringify(result);

      // Audit log is injected via async local storage or explicit call
      const context = AsyncLocalStorageContext.getStore();
      if (context) {
        context.addAuditEvent({
          event,
          category,
          resourceType: target.constructor.name,
          beforeState,
          afterState,
        });
      }

      return result;
    };

    return descriptor;
  };
}

// Usage
export class TransactionService {
  @ApplyAudit('transaction.created', 'crud')
  async create(orgId: string, dto: CreateTransactionDto): Promise<Transaction> {
    // ... business logic
  }

  @ApplyAudit('transaction.deleted', 'crud')
  async delete(id: string): Promise<void> {
    // ... business logic
  }
}
```

## 4. Audit Service

```typescript
// audit/audit.service.ts
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(event: AuditEvent): Promise<AuditLog> {
    const lastLog = await this.prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { hash: true },
    });

    const hash = this.computeHash({
      event,
      previousHash: lastLog?.hash,
      timestamp: new Date(),
    });

    return this.prisma.auditLog.create({
      data: {
        organizationId: event.organizationId,
        actorId: event.actorId,
        actorType: event.actorType,
        event: event.event,
        category: event.category,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        beforeState: event.beforeState,
        afterState: event.afterState,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        metadata: event.metadata,
        hash,
        previousHash: lastLog?.hash,
      },
    });
  }

  private computeHash(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  async verifyIntegrity(organizationId: string): Promise<IntegrityReport> {
    const logs = await this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });

    const issues: IntegrityIssue[] = [];
    let previousHash: string | null = null;

    for (const log of logs) {
      const expectedHash = this.computeHash({
        event: log,
        previousHash,
        timestamp: log.createdAt,
      });

      if (log.hash !== expectedHash) {
        issues.push({
          logId: log.id,
          issue: 'hash_mismatch',
          expected: expectedHash,
          actual: log.hash,
        });
      }

      if (log.previousHash !== previousHash) {
        issues.push({
          logId: log.id,
          issue: 'chain_break',
          expected: previousHash,
          actual: log.previousHash,
        });
      }

      previousHash = log.hash;
    }

    return {
      totalLogs: logs.length,
      issues,
      isValid: issues.length === 0,
    };
  }
}
```

## 5. Retention Policies

```typescript
// audit/retention.service.ts
@Injectable()
export class AuditRetentionService {
  @Cron('0 2 * * *') // Daily at 2 AM
  async archiveOldLogs() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Archive logs older than 30 days from hot storage to warm storage
    const toArchive = await this.prisma.auditLog.findMany({
      where: { createdAt: { lt: thirtyDaysAgo }, archivedAt: null },
      take: 10000,
    });

    for (const log of toArchive) {
      await this.storageService.upload(`audit/${log.organizationId}/${log.id}.json`, log);
      await this.prisma.auditLog.update({
        where: { id: log.id },
        data: { archivedAt: new Date() },
      });
    }
  }

  @Cron('0 3 * * 0') // Weekly on Sunday at 3 AM
  async deleteExpiredLogs() {
    const sevenYearsAgo = new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000);

    await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: sevenYearsAgo } },
    });
  }
}
```

## 6. Audit Query Service

```typescript
// audit/audit-query.service.ts
@Injectable()
export class AuditQueryService {
  async search(orgId: string, params: AuditSearchParams): Promise<PaginatedResult<AuditLog>> {
    const where: any = { organizationId: orgId };

    if (params.event) where.event = { contains: params.event, mode: 'insensitive' };
    if (params.category) where.category = params.category;
    if (params.actorId) where.actorId = params.actorId;
    if (params.resourceType) where.resourceType = params.resourceType;
    if (params.resourceId) where.resourceId = params.resourceId;
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = params.dateFrom;
      if (params.dateTo) where.createdAt.lte = params.dateTo;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, total, page: params.page, limit: params.limit };
  }
}
```

## 7. Audit React Hook

```typescript
// apps/web/src/features/audit/hooks/use-audit-logs.ts
export function useAuditLogs(filters: AuditFilters) {
  return useQuery({
    queryKey: ['audit', filters],
    queryFn: () => api.audit.search(filters),
    staleTime: 30000,
  });
}

// apps/web/src/features/audit/components/audit-log-table.tsx
export function AuditLogTable() {
  const [filters, setFilters] = useState({ category: 'all', dateFrom: '', dateTo: '' });
  const { data, isLoading } = useAuditLogs(filters);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={filters.category} onValueChange={(category) => setFilters({ ...filters, category })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="auth">Authentication</SelectItem>
            <SelectItem value="crud">Data Changes</SelectItem>
            <SelectItem value="tax">Tax Operations</SelectItem>
            <SelectItem value="export">Exports</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable data={data?.data || []} columns={auditColumns}>
        <TableBody>
          {data?.data.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{formatDateTime(log.createdAt)}</TableCell>
              <TableCell>{log.actorId}</TableCell>
              <TableCell><Badge variant="outline">{log.category}</Badge></TableCell>
              <TableCell className="font-mono text-sm">{log.event}</TableCell>
              <TableCell>{log.resourceType}</TableCell>
              <TableCell>{log.resourceId}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}
```

## 8. Compliance Reporting

```typescript
// audit/compliance.service.ts
@Injectable()
export class ComplianceService {
  async generateComplianceReport(orgId: string, params: ComplianceReportParams): Promise<ComplianceReport> {
    const logs = await this.searchAuditLogs(orgId, params);
    const integrity = await this.verifyIntegrity(orgId);

    return {
      organizationId: orgId,
      period: { from: params.dateFrom, to: params.dateTo },
      totalEvents: logs.length,
      eventsByCategory: this.groupByCategory(logs),
      eventsByUser: this.groupByUser(logs),
      integrityCheck: integrity,
      generatedAt: new Date(),
    };
  }
}
```
