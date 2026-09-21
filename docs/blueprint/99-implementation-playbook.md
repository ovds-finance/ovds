# 99 — Implementation Playbook and Step-by-Step Guide

## 1. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Week 1: Setup**
```bash
# Create Nx workspace
npx create-nx-workspace@latest vat-declaration --preset=nest

# Add apps
nx g @nrwl/react:app web --directory=apps
nx g @nrwl/nest:app api --directory=apps

# Add shared UI
nx g @nrwl/react:lib ui --directory=libs

# Add Prisma
npm install prisma @prisma/client
npx prisma init
```

**Week 2: Database**
```bash
# Define schema
# prisma/schema.prisma

# Run migrations
npx prisma migrate dev --name init

# Seed data
npx prisma db seed
```

**Week 3: Auth**
```typescript
// Implement JWT auth
// Implement RBAC
// Implement multi-tenancy
```

**Week 4: Core APIs**
```typescript
// Organizations CRUD
// Transactions CRUD
// Accounts CRUD
```

### Phase 2: VAT Features (Weeks 5-8)

**Week 5: VAT Engine**
```typescript
// Implement VAT calculation rules
// Add jurisdiction-specific logic
// Test accuracy
```

**Week 6: Tax Integrations**
```typescript
// EU VIES API
// UK HMRC API
// TaxJar API
```

**Week 7: Import/Export**
```typescript
// CSV import
// Excel export
// PDF reports
```

**Week 8: Notifications**
```typescript
// Email service
// Webhook system
// In-app notifications
```

### Phase 3: Advanced Features (Weeks 9-12)

**Week 9: Event-Driven**
```typescript
// Event bus
// CQRS
// Event sourcing
```

**Week 10: Search**
```typescript
// Elasticsearch integration
// Full-text search
// Faceted search
```

**Week 11: Caching**
```typescript
// Redis setup
// Cache strategies
// Cache invalidation
```

**Week 12: Monitoring**
```typescript
// Prometheus metrics
// Grafana dashboards
// Alert rules
```

## 2. Code Patterns

### Repository Pattern
```typescript
@InjectInject()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: FindManyParams): Promise<PaginatedResult<Transaction>> {
    const where = this.buildWhere(params);

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({ where, skip: ..., take: ... }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page: params.page, limit: params.limit };
  }
}
```

### Service Pattern
```typescript
@InjectInject()
export class TransactionService {
  constructor(private readonly repo: TransactionRepository) {}

  async create(orgId: string, dto: CreateTransactionDto): Promise<Transaction> {
    // Validate
    await this.validate(dto);

    // Create
    const transaction = await this.repo.create({ ...dto, organizationId: orgId });

    // Publish event
    await this.eventBus.publish('transaction.created', transaction);

    return transaction;
  }
}
```

### Controller Pattern
```typescript
@Controller('transactions')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Get()
  @Permissions('transactions.read')
  async findAll(@Query() params: QueryParams) {
    return this.service.findMany(params);
  }

  @Post()
  @Permissions('transactions.write')
  async create(@Body() dto: CreateTransactionDto) {
    return this.service.create(dto);
  }
}
```

## 3. Testing Strategy

### Unit Tests
```typescript
describe('TransactionService', () => {
  let service: TransactionService;
  let repo: MockType<TransactionRepository>;

  beforeEach(() => {
    repo = mock(TransactionRepository);
    service = new TransactionService(repo);
  });

  it('should create transaction', async () => {
    const dto = { amount: 100, currency: 'EUR' };
    const result = { id: '1', ...dto };

    when(repo.create).mockResolvedValue(result);

    expect(await service.create('org-1', dto)).toEqual(result);
  });
});
```

### Integration Tests
```typescript
describe('TransactionController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('/transactions (POST)', () => {
    return request(app.getHttpServer())
      .post('/transactions')
      .send({ amount: 100, currency: 'EUR' })
      .expect(201)
      .expect((res) => {
        expect(res.body.amount).toBe(100);
      });
  });
});
```

### E2E Tests
```typescript
describe('E2E VAT Return', () => {
  it('should submit VAT return', async () => {
    // Login
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(201);

    const token = login.body.accessToken;

    // Create transactions
    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1000, vatRate: 0.21 });

    // Submit VAT return
    await request(app.getHttpServer())
      .post('/vat-returns')
      .set('Authorization', `Bearer ${token}`)
      .send({ periodStart: '2024-01-01', periodEnd: '2024-03-31' })
      .expect(201);
  });
});
```

## 4. Deployment

### Docker Compose
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: vat
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: vat_declaration
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  api:
    build: ./apps/api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://vat:secret@postgres:5432/vat_declaration
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  web:
    build: ./apps/web
    ports:
      - "4200:4200"

volumes:
  postgres-data:
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    spec:
      containers:
        - name: api
          image: vat-declaration-api:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

## 5. CI/CD

### GitHub Actions
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: vat-declaration-api:${{ github.sha }}
```

## 6. Monitoring

### Prometheus
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:3000']
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "VAT Declaration API",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{ "expr": "rate(http_requests_total[5m])" }]
      },
      {
        "title": "Latency P95",
        "targets": [{ "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))" }]
      }
    ]
  }
}
```

## 7. Security

### Headers
```typescript
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS }));
app.use(rateLimit({ windowMs: 60000, max: 100 }));
```

### Input Validation
```typescript
export class CreateTransactionDto {
  @IsString()
  @MaxLength(255)
  description: string;

  @IsNumber()
  @Min(0)
  @Max(999999999)
  amount: number;

  @IsISO31661Alpha2()
  currency: string;
}
```

## 8. Performance

### Database Indexes
```prisma
@@index([organizationId, createdAt])
@@index([organizationId, type, status])
@@index([vatReturnId, lineNumber])
```

### Query Optimization
```typescript
const transactions = await this.prisma.transaction.findMany({
  where: { organizationId: orgId },
  include: { category: true },
  orderBy: { date: 'desc' },
  take: 20,
});
```

### Caching
```typescript
@Cacheable({ ttl: 300 })
async findById(id: string): Promise<Transaction> {
  return this.prisma.transaction.findUnique({ where: { id } });
}
```

## 9. Checklist

### Before First Commit
- [ ] ESLint passes
- [ ] Tests pass
- [ ] TypeScript compiles
- [ ] README updated
- [ ] .env.example created

### Before First Deploy
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Health check endpoint working
- [ ] Monitoring configured
- [ ] Backup strategy in place

### Before Production
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Penetration testing done
- [ ] Disaster recovery tested
- [ ] Documentation complete

## 10. Troubleshooting

### Common Issues

**Database connection refused**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check connection string
echo $DATABASE_URL
```

**Redis connection failed**
```bash
# Check Redis is running
redis-cli ping

# Check connection
redis-cli -h localhost -p 6379 ping
```

**NestJS won't start**
```bash
# Check logs
npm run start:dev

# Check for port conflicts
netstat -ano | findstr :3000
```
