# 17 — Global Scopes and Query Optimization

## 1. Global Scopes Overview

Global scopes automatically apply constraints to all queries for a model. The system uses five global scopes:

| Scope | Model | Purpose |
|-------|-------|---------|
| `CompanyScope` | All tenant models | Automatically filters by `organizationId` |
| `SoftDeleteScope` | All soft-deletable models | Filters out `deletedAt IS NOT NULL` |
| `AccountScope` | `Transaction` | Filters by account context |
| `ContactScope` | `Transaction` | Filters by contact context |
| `ModuleEnabledScope` | All feature models | Filters by enabled modules |

## 2. Tenant Scope Implementation

```typescript
// libs/api-core/tenant/src/scopes/company.scope.ts
export class CompanyScope implements Scope {
  apply<T extends any>(builder: Model<T>, builderParams: ScopeParams<T>): SelectQueryBuilder<T> {
    const orgId = TenantContext.getOrganizationId();
    if (!orgId) {
      return builder.andWhere((qb: any) => {
        // For system-level queries (e.g., admin)
        if (builderParams.skipTenantCheck) {
          return qb;
        }
        throw new TenantNotFoundException();
      });
    }
    return builder.andWhere((qb: any) => qb.where('organization_id = :orgId', { orgId }));
  }
}
```

## 3. Soft Delete Scope

```typescript
// libs/api-core/common/src/scopes/soft-delete.scope.ts
export class SoftDeleteScope implements Scope {
  apply<T extends any>(builder: Model<T>, builderParams: ScopeParams<T>): SelectQueryBuilder<T> {
    return builder.andWhere((qb: any) => {
      if (builderParams.withDeleted) {
        return qb; // Include soft-deleted records
      }
      return qb.where('deleted_at IS NULL');
    });
  }
}
```

## 4. Scope Registration

```typescript
// entities/vat-return.entity.ts
@Entity('vat_returns')
@UseScopes(CompanyScope, SoftDeleteScope)
export class VatReturn {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  deletedAt?: Date;

  @Column()
  organizationId: string;

  // ... other columns
}
```

## 5. Query Builder Patterns

### 5.1 Basic Query with Scopes

```typescript
// Automatically scoped to current organization and excludes soft-deleted
const returns = await vatReturnRepository.findMany({
  where: { status: 'submitted' },
  orderBy: { periodStart: 'desc' },
});
```

### 5.2 Bypass Scopes

```typescript
// Admin or system operations
const allReturns = await vatReturnRepository.findMany(
  { where: { status: 'submitted' } },
  { skipScopes: true },
);
```

### 5.3 Include Soft-Deleted

```typescript
const deletedReturns = await vatReturnRepository.findMany(
  { where: { status: 'submitted' } },
  { withDeleted: true },
);
```

## 6. Composite Indexes

Common query patterns use composite indexes:

```sql
-- VAT returns by org, status, and period
CREATE INDEX idx_vat_returns_org_status_period 
ON vat_returns (organization_id, status, period_start DESC);

-- Transactions by org, date, and type
CREATE INDEX idx_transactions_org_date_type 
ON transactions (organization_id, transaction_date DESC, type);

-- Audit logs by org and created date
CREATE INDEX idx_audit_logs_org_created 
ON audit_logs (organization_id, created_at DESC);
```

## 7. Query Optimization Techniques

### 7.1 Select Only Required Fields

```typescript
// Instead of SELECT *
const returns = await prisma.vatReturn.findMany({
  where: { organizationId: orgId },
  select: {
    id: true,
    status: true,
    periodStart: true,
    periodEnd: true,
    netVatDue: true,
  },
});
```

### 7.2 Pagination

```typescript
// Cursor-based for large datasets
const { data, meta } = await vatReturnRepository.findManyWithCursor({
  orgId,
  cursor: lastId,
  limit: 20,
});

// Offset-based for admin
const { data, meta } = await vatReturnRepository.findManyWithOffset({
  orgId,
  page: 2,
  limit: 20,
});
```

### 7.3 Batching

```typescript
// Instead of N+1 queries
const returns = await prisma.vatReturn.findMany({
  where: { organizationId: orgId },
  include: { items: true },
});

// Or batch queries
const returns = await prisma.vatReturn.findMany({ where: { organizationId: orgId } });
const items = await prisma.vatReturnItem.findMany({
  where: { vatReturnId: { in: returns.map(r => r.id) } },
});
```

### 7.4 Query Caching

```typescript
// Redis cache for lookup tables
@Injectable()
export class JurisdictionCacheService {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async getJurisdictions(orgId: string): Promise<Jurisdiction[]> {
    const cacheKey = `jurisdictions:${orgId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const jurisdictions = await this.jurisdictionRepository.findMany(orgId);
    await this.redis.setEx(cacheKey, 3600, JSON.stringify(jurisdictions));
    return jurisdictions;
  }
}
```

## 8. Database Connection Pooling

```typescript
// PgBouncer configuration
const pgbouncerConfig = {
  maxClientConn: 1000,
  defaultPoolSize: 20,
  reservePoolSize: 5,
  poolMode: 'transaction',
};
```

## 9. Read Replicas

```typescript
// Reporting queries use read replica
const reportData = await this.readReplica.$queryRaw`
  SELECT jurisdiction_id, SUM(net_amount) as total
  FROM transactions
  WHERE organization_id = ${orgId}
    AND transaction_date >= ${startDate}
    AND transaction_date <= ${endDate}
  GROUP BY jurisdiction_id
`;
```

## 10. Query Monitoring

```typescript
// Log slow queries
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  if (duration > 1000) {
    logger.warn(`Slow query: ${params.model}.${params.action} took ${duration}ms`);
  }

  return result;
});
```
