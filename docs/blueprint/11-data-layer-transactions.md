# 11 — Data Layer and Transaction Management

## 1. Data Access Architecture

The data layer is built on Prisma ORM with a repository pattern. All database access goes through repositories, never directly from controllers or services.

```
Controller → Service → Repository → Prisma Client → PostgreSQL
```

## 2. Base Repository Pattern

```typescript
// libs/api-core/prisma/src/base.repository.ts
export abstract class BaseRepository<T> {
  constructor(protected readonly prisma: PrismaService, protected readonly model: string) {}

  protected get modelRef() {
    return (this.prisma as any)[this.model.toLowerCase()];
  }

  async findById(id: string, orgId: string): Promise<T | null> {
    return this.modelRef.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
  }

  async findMany(orgId: string, filters?: any): Promise<T[]> {
    return this.modelRef.findMany({
      where: { organizationId: orgId, deletedAt: null, ...filters },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(orgId: string, data: any): Promise<T> {
    return this.modelRef.create({
      data: { ...data, organizationId: orgId },
    });
  }

  async update(id: string, orgId: string, data: any): Promise<T> {
    return this.modelRef.update({
      where: { id, organizationId: orgId },
      data,
    });
  }

  async softDelete(id: string, orgId: string): Promise<T> {
    return this.modelRef.update({
      where: { id, organizationId: orgId },
      data: { deletedAt: new Date() },
    });
  }

  async count(orgId: string, filters?: any): Promise<number> {
    return this.modelRef.count({
      where: { organizationId: orgId, deletedAt: null, ...filters },
    });
  }
}
```

## 3. Transaction Boundaries

Database transactions are managed at the service layer using Prisma's `$transaction`:

```typescript
// services/vat-return.service.ts
@Injectable()
export class VatReturnService {
  constructor(private readonly prisma: PrismaService) {}

  async createWithItems(dto: CreateVatReturnDto, orgId: string): Promise<VatReturn> {
    return this.prisma.$transaction(async (tx) => {
      const vatReturn = await tx.vatReturn.create({
        data: {
          organizationId: orgId,
          vatRegistrationId: dto.vatRegistrationId,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          dueDate: dto.dueDate,
          status: 'draft',
        },
      });

      await tx.vatReturnItem.createMany({
        data: dto.items.map(item => ({
          ...item,
          vatReturnId: vatReturn.id,
        })),
      });

      await tx.vatReturnHistory.create({
        data: {
          vatReturnId: vatReturn.id,
          action: 'created',
          userId: TenantContext.getUserId(),
        },
      });

      return vatReturn;
    });
  }
}
```

## 4. Soft Deletes and Global Scopes

All business tables support soft deletes via `deletedAt`. Prisma middleware automatically filters them:

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
```

Hard deletes are explicitly called via `$transaction` with raw SQL when needed (GDPR right to be forgotten).

## 5. Optimistic Locking

Critical entities use `version` for optimistic concurrency control:

```typescript
async updateVatReturn(id: string, orgId: string, data: UpdateVatReturnDto, expectedVersion: number): Promise<VatReturn> {
  try {
    return await this.prisma.vatReturn.update({
      where: { id, organizationId: orgId, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new ConflictException('VAT return was modified by another user. Please refresh.');
    }
    throw error;
  }
}
```

## 6. Audit Trail and Change Tracking

Every mutation to critical entities creates an `AuditLog` entry with before/after JSON:

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

        const before = request.body; // Previous state (for updates)
        const after = result;        // New state

        await this.auditService.log({
          action,
          subjectType: this.extractSubjectType(handler),
          subjectId: result?.id,
          changes: before && after ? { before, after } : undefined,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }),
    );
  }
}
```

## 7. Query Optimization

### 7.1 Indexed Queries Only

Prisma queries must use indexed fields in `where` clauses. The following fields are indexed in all tenant tables:

- `organizationId` (always)
- `createdAt` (for sorting)
- `status` (for filtering)
- Composite indexes for common query patterns

### 7.2 Pagination

Cursor-based pagination for large datasets:

```typescript
async findManyWithCursor(orgId: string, cursor?: string, limit = 20): Promise<PaginatedResult<Transaction>> {
  const where = { organizationId: orgId, deletedAt: null };

  const items = await this.prisma.transaction.findMany({
    where,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
  });

  const hasNextPage = items.length > limit;
  const data = hasNextPage ? items.slice(0, -1) : items;

  return {
    data,
    meta: {
      nextCursor: hasNextPage ? data[data.length - 1].id : null,
      hasNextPage,
    },
  };
}
```

Offset-based pagination for admin:

```typescript
async findManyWithOffset(orgId: string, page = 1, limit = 20): Promise<PaginatedResult<Transaction>> {
  const where = { organizationId: orgId, deletedAt: null };
  const [items, total] = await Promise.all([
    this.prisma.transaction.findMany({ where, skip: (page - 1) * limit, take: limit }),
    this.prisma.transaction.count({ where }),
  ]);

  return { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
```

## 8. Connection Pooling

PgBouncer is used in production for connection pooling:

```yaml
# pgbouncer.ini
[databases]
vat_shared = host=postgres port=5432 dbname=vat_shared

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
reserve_pool_size = 5
```

Prisma connection string in production:

```
postgres://user:pass@pgbouncer:6432/vat_shared
```

## 9. Read Replicas

For reporting queries, read replicas are used:

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

## 10. Data Seeding Strategy

```typescript
// prisma/seed.ts
async function main() {
  // Seed shared data
  await seedSubscriptionPlans();
  await seedRoles();
  await seedJurisdictions(); // Pre-populate EU countries

  // Seed demo tenant
  const demoOrg = await seedDemoOrganization();
  await seedDemoUsers(demoOrg.id);
  await seedDemoVatRegistrations(demoOrg.id);
  await seedDemoTransactions(demoOrg.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
```

## 11. Migration Management

Prisma migrations are versioned and applied in order:

```bash
# Create migration
npx prisma migrate dev --name add_vat_return_table --schema=prisma/schema/tenant.prisma

# Apply in CI/CD
npx prisma migrate deploy --schema=prisma/schema/tenant.prisma
```

## 12. Data Consistency Checks

Periodic consistency checks run via scheduled jobs:

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

## 13. Encryption at Rest

Sensitive fields (credentials, tokens) are encrypted using AES-256-GCM:

```typescript
// libs/api-core/common/src/services/encryption.service.ts
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    this.key = Buffer.from(configService.get('ENCRYPTION_KEY'), 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, tagHex, encrypted] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

## 14. JSONB Usage

Flexible data (settings, metadata, VAT rates) uses PostgreSQL JSONB:

```typescript
model Jurisdiction {
  vatRates     Json   // [{ "code": "STD", "rate": 20.00, "type": "standard" }]
  deadlineRules Json  // [{ "month": 4, "day": 30 }]
  metadata     Json?
}
```

Queries on JSONB use GIN indexes:

```sql
CREATE INDEX idx_jurisdictions_vat_rates ON jurisdictions USING GIN (vat_rates);
```
