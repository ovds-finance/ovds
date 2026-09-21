# 43 — Data Layer and Repository Patterns

## 1. Data Access Architecture Translation

| Laravel Concept | NestJS/Prisma Equivalent |
|----------------|--------------------------|
| `Eloquent Model` | Prisma Client |
| `Eloquent Query` | Prisma Client query |
| `Global Scope` | Prisma Middleware |
| `Repository` | Service + Repository class |
| `Relationship` | Prisma `include` / `select` |
| `Fillable` | Prisma `create` / `update` data |
| `Soft Deletes` | Prisma `deletedAt` field + middleware |
| `Observer` | Event listener |
| `Cast` | Prisma type mapping |
| `Accessor/Mutator` | Value object / getter |

## 2. Repository Pattern

### 2.1 Base Repository

```typescript
// libs/api-core/prisma/src/base.repository.ts
export abstract class BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
  ) {}

  protected get model() {
    return (this.prisma as any)[this.modelName.toLowerCase()];
  }

  async findById(id: string, orgId: string): Promise<T | null> {
    return this.model.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
  }

  async findMany(orgId: string, filters?: any): Promise<T[]> {
    return this.model.findMany({
      where: { organizationId: orgId, deletedAt: null, ...filters },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(orgId: string, data: any): Promise<T> {
    return this.model.create({
      data: { ...data, organizationId: orgId },
    });
  }

  async update(id: string, orgId: string, data: any): Promise<T> {
    return this.model.update({
      where: { id, organizationId: orgId },
      data,
    });
  }

  async softDelete(id: string, orgId: string): Promise<void> {
    await this.model.update({
      where: { id, organizationId: orgId },
      data: { deletedAt: new Date() },
    });
  }

  async count(orgId: string, filters?: any): Promise<number> {
    return this.model.count({
      where: { organizationId: orgId, deletedAt: null, ...filters },
    });
  }
}
```

### 2.2 VAT Return Repository

```typescript
// vat-returns/vat-return.repository.ts
@Injectable()
export class VatReturnRepository extends BaseRepository<VatReturn> {
  constructor(prisma: PrismaService) {
    super(prisma, 'VatReturn');
  }

  async findWithItems(id: string, orgId: string): Promise<VatReturn | null> {
    return this.model.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        history: { orderBy: { createdAt: 'desc' } },
        attachments: true,
      },
    });
  }

  async findManyWithFilters(orgId: string, filters: VatReturnFilters): Promise<PaginatedResult<VatReturn>> {
    const where: any = { organizationId: orgId, deletedAt: null };

    if (filters.status) where.status = filters.status;
    if (filters.vatRegistrationId) where.vatRegistrationId = filters.vatRegistrationId;
    if (filters.periodFrom) where.periodStart = { gte: filters.periodFrom };
    if (filters.periodTo) where.periodEnd = { lte: filters.periodTo };

    const [items, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.model.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findByIdForUpdate(id: string, orgId: string): Promise<VatReturn | null> {
    return this.model.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: { items: true },
    });
  }
}
```

## 3. Transaction Management

### 3.1 Prisma Transactions

```typescript
// services/vat-return.service.ts
@Injectable()
export class VatReturnService {
  async createWithItems(dto: CreateVatReturnDto, userId: string): Promise<VatReturn> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the return
      const vatReturn = await tx.vatReturn.create({
        data: {
          organizationId: TenantContext.getOrganizationId()!,
          vatRegistrationId: dto.vatRegistrationId,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          dueDate: dto.dueDate,
          status: 'draft',
          currencyCode: dto.currencyCode,
        },
      });

      // 2. Create line items
      await tx.vatReturnItem.createMany({
        data: dto.items.map((item) => ({
          ...item,
          vatReturnId: vatReturn.id,
        })),
      });

      // 3. Create history entry
      await tx.vatReturnHistory.create({
        data: {
          vatReturnId: vatReturn.id,
          action: 'created',
          userId,
          notes: 'VAT return created',
        },
      });

      // 4. Emit event
      await this.eventBus.emit(new VatReturnCreatedEvent(vatReturn.id, vatReturn.organizationId, userId));

      return vatReturn;
    });
  }
}
```

### 3.2 Optimistic Locking

```typescript
// services/vat-return.service.ts
async update(
  id: string,
  orgId: string,
  dto: UpdateVatReturnDto,
  expectedVersion: number,
): Promise<VatReturn> {
  try {
    return await this.prisma.vatReturn.update({
      where: { id, organizationId: orgId, version: expectedVersion },
      data: {
        ...dto,
        version: { increment: 1 },
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new ConflictException('VAT return was modified by another user. Please refresh.');
    }
    throw error;
  }
}
```

## 4. Query Optimization

### 4.1 Select Only Required Fields

```typescript
async findBasicInfo(id: string, orgId: string): Promise<BasicVatReturnInfo | null> {
  return this.prisma.vatReturn.findFirst({
    where: { id, organizationId: orgId },
    select: {
      id: true,
      status: true,
      periodStart: true,
      periodEnd: true,
      netVatDue: true,
      currencyCode: true,
    },
  });
}
```

### 4.2 Batch Queries

```typescript
async findItemsForReturns(returnIds: string[]): Promise<Map<string, VatReturnItem[]>> {
  const items = await this.prisma.vatReturnItem.findMany({
    where: { vatReturnId: { in: returnIds } },
    orderBy: { createdAt: 'asc' },
  });

  return groupBy(items, 'vatReturnId');
}
```

### 4.3 Pagination

```typescript
async findManyPaginated(
  orgId: string,
  page: number,
  limit: number,
  filters?: any,
): Promise<PaginatedResult<VatReturn>> {
  const where = { organizationId: orgId, deletedAt: null, ...filters };

  const [items, total] = await Promise.all([
    this.prisma.vatReturn.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.vatReturn.count({ where }),
  ]);

  return {
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
```

## 5. Soft Deletes

```typescript
// prisma/soft-delete-middleware.ts
export function applySoftDeleteMiddleware(prisma: PrismaService) {
  prisma.$use(async (params, next) => {
    if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
      params.args.where = { ...params.args.where, deletedAt: null };
    }
    return next(params);
  });
}

// Hard delete (GDPR right to be forgotten)
async hardDelete(id: string, orgId: string): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    // Delete related records first
    await tx.vatReturnItem.deleteMany({ where: { vatReturnId: id } });
    await tx.vatReturnHistory.deleteMany({ where: { vatReturnId: id } });
    await tx.vatReturnAttachment.deleteMany({ where: { vatReturnId: id } });

    // Hard delete the return
    await tx.vatReturn.deleteMany({ where: { id, organizationId: orgId } });
  });
}
```

## 6. Audit Trail

```typescript
// audit/audit-interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async (result) => {
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const className = context.getClass().name;
        const action = `${className}.${handler.name}`;

        await this.auditService.log({
          action,
          subjectType: this.extractSubjectType(handler),
          subjectId: result?.id,
          changes: request.body,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }),
    );
  }
}
```

## 7. Database Indexes

```sql
-- Critical indexes for performance
CREATE INDEX idx_vat_returns_org_status_period
ON vat_returns (organization_id, status, period_start DESC);

CREATE INDEX idx_transactions_org_date_type
ON transactions (organization_id, transaction_date DESC, type);

CREATE INDEX idx_audit_logs_org_created
ON audit_logs (organization_id, created_at DESC);
```

## 8. Connection Pooling

```typescript
// PgBouncer configuration
const pgbouncerConfig = {
  maxClientConn: 1000,
  defaultPoolSize: 20,
  reservePoolSize: 5,
  poolMode: 'transaction',
};

// Prisma connection string
postgresql://user:pass@pgbouncer:6432/vat_shared?pool_timeout=10&statement_timeout=5000
```

## 9. Read Replicas

```typescript
// reporting/report.repository.ts
@Injectable()
export class ReportRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('READ_REPLICA') private readonly readReplica: PrismaService,
  ) {}

  async findManyForReport(orgId: string, filters: any): Promise<Transaction[]> {
    return this.readReplica.transaction.findMany({
      where: { organizationId: orgId, ...filters },
    });
  }
}
```

## 10. Data Consistency

```typescript
// jobs/data-consistency.job.ts
@Processor('default')
export class DataConsistencyProcessor {
  @Process('check_transaction_totals')
  async checkTransactionTotals(job: Job) {
    const mismatches = await this.prisma.$queryRaw`
      SELECT id, net_amount, vat_amount, gross_amount,
             (net_amount + vat_amount) AS expected_gross
      FROM transactions
      WHERE ABS(gross_amount - (net_amount + vat_amount)) > 0.01
    `;

    if (mismatches.length > 0) {
      await this.notificationService.sendAlert({
        type: 'data_inconsistency',
        message: `Found ${mismatches.length} transactions with amount mismatches`,
      });
    }
  }
}
```
