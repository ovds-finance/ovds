# 10 — Testing Strategy

## 1. Testing Pyramid

```
        ┌──────────────┐
        │   E2E Tests  │  Playwright, critical user journeys
        │   (few)      │
        ├──────────────┤
        │ Integration  │  Supertest, API contracts, DB integration
        │   Tests       │
        ├──────────────┤
        │   Unit Tests  │  Jest, pure functions, services, utils
        │   (many)      │
        └──────────────┘
```

## 2. Unit Tests (Jest)

```typescript
// libs/feature/vat-returns/test/vat-return-calculator.spec.ts
describe('VatReturnCalculator', () => {
  let calculator: VatReturnCalculator;

  beforeEach(() => {
    calculator = new VatReturnCalculator();
  });

  it('should calculate net amount from gross and vat rate', () => {
    const result = calculator.calculateNet(120, 20);
    expect(result).toBe(100);
  });

  it('should calculate vat amount', () => {
    const result = calculator.calculateVat(100, 20);
    expect(result).toBe(20);
  });
});
```

## 3. Integration Tests (Supertest)

```typescript
// apps/api/test/vat-returns.e2e-spec.ts
describe('VatReturnsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let organizationId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Setup test org and user
    const authResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'Password123!', organizationName: 'Test Org' });

    authToken = authResponse.body.data.accessToken;
    organizationId = authResponse.body.data.user.organizationId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a VAT return', async () => {
    const response = await request(app.getHttpServer())
      .post('/vat-returns')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Organization-ID', organizationId)
      .send({
        vatRegistrationId: 'reg_123',
        periodStart: '2024-01-01',
        periodEnd: '2024-03-31',
        items: [
          { type: 'sales', boxCode: 'STD', netAmount: 1000, vatRate: 20, vatAmount: 200, grossAmount: 1200 },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('draft');
  });

  it('should reject unauthenticated request', async () => {
    const response = await request(app.getHttpServer())
      .post('/vat-returns')
      .send({});

    expect(response.status).toBe(401);
  });
});
```

## 4. E2E Tests (Playwright)

```typescript
// apps/web/e2e/vat-returns.spec.ts
import { test, expect } from '@playwright/test';

test.describe('VAT Returns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'Password123!');
    await page.click('[data-testid=login-button]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new VAT return', async ({ page }) => {
    await page.goto('/vat-returns');
    await page.click('[data-testid=new-return-button]');
    await page.selectOption('[data-testid=vat-registration]', 'reg_123');
    await page.fill('[data-testid=period-start]', '2024-01-01');
    await page.fill('[data-testid=period-end]', '2024-03-31');
    await page.click('[data-testid=add-item-button]');
    await page.fill('[data-testid=item-net-amount]', '1000');
    await page.fill('[data-testid=item-vat-rate]', '20');
    await page.click('[data-testid=save-button]');

    await expect(page.locator('[data-testid=success-toast]')).toBeVisible();
    await expect(page.locator('[data-testid=return-status]')).toHaveText('draft');
  });

  test('should submit a VAT return', async ({ page }) => {
    await page.goto('/vat-returns/ret_123');
    await page.click('[data-testid=submit-button]');
    await page.click('[data-testid=confirm-submit-checkbox]');
    await page.click('[data-testid=confirm-submission-button]');

    await expect(page.locator('[data-testid=success-toast]')).toBeVisible();
    await expect(page.locator('[data-testid=return-status]')).toHaveText('submitted');
  });
});
```

## 5. Database Test Utilities

```typescript
// test/utils/test-database.ts
export class TestDatabase {
  private prisma: PrismaService;

  async setup() {
    this.prisma = new PrismaService({ url: process.env.TEST_DATABASE_URL });
    await this.prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS test`;
    await this.prisma.$executeRaw`SET search_path TO test`;
    await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  }

  async seed() {
    await this.prisma.$transaction([
      this.prisma.organization.create({ data: testOrganizations[0] }),
      this.prisma.user.create({ data: testUsers[0] }),
      this.prisma.role.createMany({ data: testRoles }),
    ]);
  }

  async teardown() {
    await this.prisma.$executeRaw`DROP SCHEMA test CASCADE`;
    await this.prisma.$disconnect();
  }
}
```

## 6. Mock Providers

```typescript
// test/mocks/hmrc.provider.mock.ts
export class MockHMRCProvider implements TaxAuthorityProvider {
  readonly code = 'hmrc';
  readonly name = 'Mock HMRC';
  readonly countryCode = 'GB';
  readonly supportedOperations = [ProviderOperation.SubmitReturn];

  async authenticate() {
    return { success: true, accessToken: 'mock_token', expiresAt: new Date(Date.now() + 3600000) };
  }

  async submitReturn(returnId: string) {
    return {
      success: true,
      submissionId: `sub_${Date.now()}`,
      processingDate: new Date(),
      rawResponse: { status: 'success' },
    };
  }

  // Other methods return NotImplemented
}
```

## 7. Coverage Requirements

| Layer          | Minimum Coverage |
|----------------|------------------|
| Unit Tests     | 80% statements, branches |
| Integration    | 70% statements |
| E2E            | Critical paths covered |

Coverage enforced in CI via `jest --coverage` threshold.

## 8. CI Test Gates

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    steps:
      - run: pnpm nx run api:test -- --coverage --ci
      - run: pnpm nx run api:test:e2e
      - uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/api/coverage-summary.json
```

## 9. Test Data Factories

```typescript
// test/factories/vat-return.factory.ts
export class VatReturnFactory {
  static create(overrides?: Partial<VatReturn>): VatReturn {
    return {
      id: faker.string.uuid(),
      organizationId: faker.string.uuid(),
      vatRegistrationId: faker.string.uuid(),
      periodStart: faker.date.past(),
      periodEnd: faker.date.recent(),
      dueDate: faker.date.future(),
      status: 'draft',
      version: 1,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<VatReturn>[]): VatReturn[] {
    return Array.from({ length: count }, (_, i) => this.create(overrides?.[i]));
  }
}
```

## 10. Mutation Testing (Stryker)

Optional but recommended for critical business logic. Run periodically:

```bash
pnpm nx run api:test:mutation
```
