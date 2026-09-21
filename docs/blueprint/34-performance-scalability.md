# 34 — Performance and Scalability Patterns

## 1. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API P50 latency | < 100ms | Per endpoint |
| API P95 latency | < 300ms | Per endpoint |
| API P99 latency | < 800ms | Per endpoint |
| Database query P95 | < 50ms | Per query |
| Frontend initial load | < 2s | Web Vitals LCP |
| Frontend TTI | < 3.5s | Web Vitals TTI |
| Queue job processing | < 5s | P95 for standard jobs |
| Report generation | < 30s | For 10k rows |

## 2. Database Performance

### 2.1 Index Strategy

```sql
-- Critical indexes for multi-tenant queries
CREATE INDEX idx_vat_returns_org_status_period
ON vat_returns (organization_id, status, period_start DESC);

CREATE INDEX idx_transactions_org_date_type
ON transactions (organization_id, transaction_date DESC, type);

CREATE INDEX idx_audit_logs_org_created
ON audit_logs (organization_id, created_at DESC);

CREATE INDEX idx_notifications_org_user_read
ON notifications (organization_id, user_id, read_at);

-- JSONB GIN index for flexible queries
CREATE INDEX idx_jurisdictions_vat_rates
ON jurisdictions USING GIN (vat_rates);
```

### 2.2 Query Optimization

```typescript
// ✅ Good: Use indexed fields
const returns = await prisma.vatReturn.findMany({
  where: {
    organizationId: orgId,
    status: 'submitted',
  },
  orderBy: { periodStart: 'desc' },
  take: 20,
});

// ❌ Bad: Unindexed filter
const returns = await prisma.vatReturn.findMany({
  where: {
    notes: { contains: 'urgent' }, // No index on notes
  },
});
```

### 2.3 N+1 Query Prevention

```typescript
// ❌ Bad: N+1 queries
const returns = await prisma.vatReturn.findMany({ where: { organizationId: orgId } });
for (const ret of returns) {
  const items = await prisma.vatReturnItem.findMany({ where: { vatReturnId: ret.id } });
}

// ✅ Good: Batch with include
const returns = await prisma.vatReturn.findMany({
  where: { organizationId: orgId },
  include: { items: true },
});

// ✅ Good: Batch with separate query
const returns = await prisma.vatReturn.findMany({ where: { organizationId: orgId } });
const items = await prisma.vatReturnItem.findMany({
  where: { vatReturnId: { in: returns.map(r => r.id) } },
});
const itemsByReturn = groupBy(items, 'vatReturnId');
```

## 3. Caching Layers

```typescript
// L1: In-memory cache (per instance)
const memoryCache = new Map<string, { data: any; expires: number }>();

// L2: Redis cache (shared across instances)
const redis = new Redis(process.env.REDIS_URL);

// L3: CDN (static assets and public data)
const cdnUrl = process.env.CDN_BASE_URL;
```

## 4. Connection Pooling

```typescript
// PgBouncer configuration
const pgbouncerConfig = {
  maxClientConn: 1000,
  defaultPoolSize: 20,
  reservePoolSize: 5,
  poolMode: 'transaction',
};

// Prisma connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://user:pass@pgbouncer:6432/vat_shared?pool_timeout=10&statement_timeout=5000',
    },
  },
});
```

## 5. Read Replicas

```typescript
// Reporting queries use read replica
const reportData = await prisma.$queryRaw`
  SELECT jurisdiction_id, SUM(net_amount) as total
  FROM transactions
  WHERE organization_id = ${orgId}
    AND transaction_date >= ${startDate}
  GROUP BY jurisdiction_id
`;
```

## 6. Horizontal Scaling

### 6.1 Stateless API

```typescript
// No instance-local state
// All state in database, Redis, or external services
// Session data in Redis
// File uploads directly to S3
```

### 6.2 Session Affinity

```typescript
// WebSocket connections require sticky sessions
app.set('trust proxy', 1);
app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
```

## 7. Background Job Processing

```typescript
// Queue workers scale independently
const queueConfigs = {
  default: { concurrency: 10, consumers: 3 },
  integrations: { concurrency: 5, consumers: 2 },
  reports: { concurrency: 2, consumers: 2 },
  emails: { concurrency: 20, consumers: 5 },
};

// Auto-scaling based on queue depth
const autoScale = async () => {
  const queueDepth = await queue.getJobCounts('default');
  if (queueDepth.waiting > 100) {
    await scaleConsumers('default', 5); // Add more consumers
  }
};
```

## 8. CDN and Static Assets

```typescript
// Vite build output goes to CDN
const cdnConfig = {
  publicPath: process.env.CDN_BASE_URL || '/',
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg'],
};

// React lazy loading for code splitting
const VatReturnPage = lazy(() => import('./features/vat-returns/pages/[id]'));
```

## 9. Database Partitioning

```sql
-- Partition large tables by organization and date
CREATE TABLE transactions (
  ...
) PARTITION BY RANGE (transaction_date);

-- Create partitions per quarter
CREATE TABLE transactions_2024_q1 PARTITION OF transactions
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE transactions_2024_q2 PARTITION OF transactions
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
```

## 10. Rate Limiting

```typescript
// API rate limiting
const rateLimits = {
  'auth.login': { points: 5, duration: 60 },
  'vat-returns': { points: 100, duration: 60 },
  'integrations': { points: 50, duration: 60 },
};

// Per-user rate limiting
const userLimit = new SlidingWindowRateLimiter({
  key: (req) => req.user?.id || req.ip,
  points: 100,
  duration: 60,
});
```

## 11. Load Balancing

```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## 12. Database Query Monitoring

```typescript
// Log slow queries
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  if (duration > 1000) {
    logger.warn(`Slow query: ${params.model}.${params.action} took ${duration}ms`);
    metrics.recordSlowQuery(params.model, params.action, duration);
  }

  return result;
});
```

## 13. Caching Strategies

```typescript
// Cache invalidation on writes
@Post()
@CacheInvalidate(['vat-returns'])
async create(@Body() dto: CreateVatReturnDto) {
  return this.vatReturnService.create(dto);
}

// Cache warming on app startup
async onModuleInit() {
  await this.cacheWarmingService.warmJurisdictions();
  await this.cacheWarmingService.warmVatRates();
}
```

## 14. Frontend Performance

```typescript
// Code splitting
const VatReturnPage = lazy(() => import('./features/vat-returns/pages/[id]'));

// Image optimization
<img
  src={cdnUrl('/images/logo.webp')}
  srcSet={cdnUrl('/images/logo-1x.webp') + ' 1x, ' + cdnUrl('/images/logo-2x.webp') + ' 2x'}
  loading="lazy"
  decoding="async"
/>

// Virtual scrolling for large lists
<VirtualList
  items={transactions}
  itemHeight={50}
  containerHeight={600}
  renderItem={(transaction) => <TransactionRow key={transaction.id} transaction={transaction} />}
/>
```

## 15. Stress Testing

```typescript
// k6 load test
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://localhost:3001/api/v1/vat-returns');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 300ms': (r) => r.timings.duration < 300,
  });
}
```
