# 45 — Seed Data and Demo Environment

## 1. Seed Strategy

The system uses a layered seed strategy:

| Layer | Scope | Purpose |
|-------|-------|---------|
| Shared seeds | Global | Currencies, roles, plans, jurisdictions |
| Tenant seeds | Per-organization | Default settings, categories, VAT registrations |
| Demo seeds | Demo organization only | Sample transactions, returns, contacts |

## 2. Shared Seeds

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function seedShared() {
  // Currencies
  await prisma.currency.createMany({
    data: [
      { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isBase: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
      { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', decimalPlaces: 2 },
    ],
    skipDuplicates: true,
  });

  // Roles
  await prisma.role.createMany({
    data: [
      {
        name: 'owner',
        description: 'Full access to all features',
        permissions: { '*': true },
        isSystem: true,
      },
      {
        name: 'admin',
        description: 'Administrative access',
        permissions: {
          organizations: ['read', 'update'],
          users: ['read', 'create', 'update', 'delete', 'invite'],
          vat_registrations: ['*'],
          vat_returns: ['*'],
          transactions: ['*'],
          integrations: ['*'],
          reports: ['*'],
          settings: ['read', 'update'],
        },
        isSystem: true,
      },
      {
        name: 'accountant',
        description: 'VAT and transaction management',
        permissions: {
          vat_registrations: ['read'],
          vat_returns: ['read', 'create', 'update', 'submit'],
          transactions: ['read', 'create', 'update', 'import'],
          reports: ['read', 'export'],
        },
        isSystem: true,
      },
      {
        name: 'viewer',
        description: 'Read-only access',
        permissions: {
          vat_registrations: ['read'],
          vat_returns: ['read'],
          transactions: ['read'],
          reports: ['read'],
        },
        isSystem: true,
      },
    ],
    skipDuplicates: true,
  });

  // Subscription plans
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: 'Free',
        description: 'For individuals and freelancers',
        priceMonthly: 0,
        priceYearly: 0,
        maxUsers: 1,
        maxReturns: 10,
        maxTransactions: 100,
        features: { basic_reports: true },
        isActive: true,
      },
      {
        name: 'Pro',
        description: 'For small businesses',
        priceMonthly: 29,
        priceYearly: 290,
        maxUsers: 5,
        maxReturns: 100,
        maxTransactions: 10000,
        features: { advanced_reports: true, multi_jurisdiction: true, api_access: false },
        isActive: true,
      },
      {
        name: 'Business',
        description: 'For growing companies',
        priceMonthly: 99,
        priceYearly: 990,
        maxUsers: 20,
        maxReturns: 500,
        maxTransactions: 100000,
        features: {
          advanced_reports: true,
          multi_jurisdiction: true,
          api_access: true,
          priority_support: true,
        },
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Shared seeds completed');
}
```

## 3. Jurisdiction Seeds

```typescript
// prisma/seeds/jurisdictions.ts
export const jurisdictionData: Record<string, any> = {
  DE: {
    name: 'Germany',
    vatName: 'Umsatzsteuer (USt)',
    authorityName: 'Bundeszentralamt für Steuern',
    authorityUrl: 'https://www.bzst.de',
    currencyCode: 'EUR',
    locale: 'de',
    timezone: 'Europe/Berlin',
    vatRates: [
      { code: 'STD', name: 'Standard', rate: 19, type: 'standard', isActive: true, effectiveFrom: '2020-01-01' },
      { code: 'RED', name: 'Reduced', rate: 7, type: 'reduced', isActive: true, effectiveFrom: '2020-01-01' },
      { code: 'ZR', name: 'Zero', rate: 0, type: 'zero', isActive: true, effectiveFrom: '2020-01-01' },
    ],
    filingFrequency: 'monthly',
    deadlineRules: [{ month: 1, day: 10 }, { month: 4, day: 10 }, { month: 7, day: 10 }, { month: 10, day: 10 }],
  },
  FR: {
    name: 'France',
    vatName: 'TVA',
    authorityName: 'Direction Générale des Finances Publiques',
    authorityUrl: 'https://www.impots.gouv.fr',
    currencyCode: 'EUR',
    locale: 'fr',
    timezone: 'Europe/Paris',
    vatRates: [
      { code: 'STD', name: 'Standard', rate: 20, type: 'standard', isActive: true, effectiveFrom: '2020-01-01' },
      { code: 'RED', name: 'Reduced', rate: 10, type: 'reduced', isActive: true, effectiveFrom: '2020-01-01' },
      { code: 'SUP', name: 'Super Reduced', rate: 5.5, type: 'super_reduced', isActive: true, effectiveFrom: '2020-01-01' },
      { code: 'ZR', name: 'Zero', rate: 0, type: 'zero', isActive: true, effectiveFrom: '2020-01-01' },
    ],
    filingFrequency: 'monthly',
    deadlineRules: [{ month: 2, day: 15 }, { month: 5, day: 15 }, { month: 8, day: 15 }, { month: 11, day: 15 }],
  },
  GB: {
    name: 'United Kingdom',
    vatName: 'VAT',
    authorityName: 'HM Revenue & Customs',
    authorityUrl: 'https://www.gov.uk/hmrc',
    currencyCode: 'GBP',
    locale: 'en',
    timezone: 'Europe/London',
    vatRates: [
      { code: 'STD', name: 'Standard', rate: 20, type: 'standard', isActive: true, effectiveFrom: '2020-01-01' },
      { code: 'RED', name: 'Reduced', rate: 5, type: 'reduced', isActive: true, effectiveFrom: '2020-01-01' },
      { code: 'ZR', name: 'Zero', rate: 0, type: 'zero', isActive: true, effectiveFrom: '2020-01-01' },
    ],
    filingFrequency: 'quarterly',
    deadlineRules: [{ month: 5, day: 7 }, { month: 8, day: 7 }, { month: 11, day: 7 }, { month: 2, day: 7 }],
  },
  NL: {
    name: 'Netherlands',
    vatName: 'BTW',
    authorityName: 'Belastingdienst',
    authorityUrl: 'https://www.belastingdienst.nl',
    currencyCode: 'EUR',
    locale: 'nl',
    timezone: 'Europe/Amsterdam',
    vatRates: [
      { code: 'STD', name: 'Standard', rate: 21, type: 'standard', isActive: true, effectiveFrom: '2020-01-01' },
      { code: 'RED', name: 'Reduced', rate: 9, type: 'reduced', isActive: true, effectiveFrom: '2020-01-01' },
      { code: 'ZR', name: 'Zero', rate: 0, type: 'zero', isActive: true, effectiveFrom: '2020-01-01' },
    ],
    filingFrequency: 'monthly',
    deadlineRules: [{ month: 2, day: 1 }, { month: 5, day: 1 }, { month: 8, day: 1 }, { month: 11, day: 1 }],
  },
};
```

## 4. Tenant Seed Service

```typescript
// prisma/seeds/tenant-seed.service.ts
@Injectable()
export class TenantSeedService {
  async seedOrganization(orgId: string): Promise<void> {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });

    // Seed jurisdictions for the organization's country
    const jurisdictionData = getJurisdictionData(org.countryCode);
    for (const jurisdiction of Object.values(jurisdictionData)) {
      await prisma.jurisdiction.create({
        data: {
          organizationId: orgId,
          countryCode: org.countryCode,
          ...jurisdiction,
        },
      });
    }

    // Seed default categories
    await prisma.category.createMany({
      data: [
        { organizationId: orgId, type: 'income', name: 'Sales', color: '#22c55e' },
        { organizationId: orgId, type: 'income', name: 'Services', color: '#3b82f6' },
        { organizationId: orgId, type: 'expense', name: 'Purchases', color: '#ef4444' },
        { organizationId: orgId, type: 'expense', name: 'Operating Expenses', color: '#f59e0b' },
        { organizationId: orgId, type: 'expense', name: 'Salaries', color: '#8b5cf6' },
        { organizationId: orgId, type: 'transfer', name: 'Transfers', color: '#6b7280' },
      ],
    });

    // Seed default items
    await prisma.item.createMany({
      data: [
        { organizationId: orgId, name: 'Standard Service', description: 'Standard consulting service', salePrice: 100, purchasePrice: 80, taxIds: [] },
        { organizationId: orgId, name: 'Premium Service', description: 'Premium consulting service', salePrice: 200, purchasePrice: 150, taxIds: [] },
      ],
    });

    console.log(`Tenant seeded for organization ${orgId}`);
  }
}
```

## 5. Demo Data Seeds

```typescript
// prisma/seeds/demo-seed.service.ts
@Injectable()
export class DemoSeedService {
  async seedDemoData(orgId: string): Promise<void> {
    // Seed demo contacts
    const contacts = await this.seedContacts(orgId);

    // Seed demo transactions
    await this.seedTransactions(orgId, contacts);

    // Seed demo VAT returns
    await this.seedVatReturns(orgId, contacts);

    console.log('Demo data seeded successfully');
  }

  private async seedContacts(orgId: string) {
    const contacts = [
      { name: 'Acme Corp', email: 'billing@acme.com', type: 'customer', countryCode: 'DE' },
      { name: 'Globex Inc', email: 'ap@globex.com', type: 'vendor', countryCode: 'FR' },
      { name: 'Initech', email: 'finance@initech.com', type: 'customer', countryCode: 'GB' },
    ];

    return Promise.all(
      contacts.map((c) =>
        prisma.contact.create({
          data: {
            organizationId: orgId,
            ...c,
            currencyCode: 'EUR',
            enabled: true,
          },
        }),
      ),
    );
  }

  private async seedTransactions(orgId: string, contacts: Contact[]) {
    const transactions = [
      { type: 'sale', direction: 'incoming', description: 'Consulting services', netAmount: 1000, vatRate: 19, vatAmount: 190, grossAmount: 1190, contactId: contacts[0].id },
      { type: 'purchase', direction: 'outgoing', description: 'Office supplies', netAmount: 500, vatRate: 19, vatAmount: 95, grossAmount: 595, contactId: contacts[1].id },
      { type: 'sale', direction: 'incoming', description: 'Software license', netAmount: 2000, vatRate: 19, vatAmount: 380, grossAmount: 2380, contactId: contacts[2].id },
    ];

    await prisma.transaction.createMany({
      data: transactions.map((t) => ({
        organizationId: orgId,
        jurisdictionId: (await this.getDefaultJurisdiction(orgId)).id,
        ...t,
        currencyCode: 'EUR',
        transactionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      })),
    });
  }

  private async seedVatReturns(orgId: string, contacts: Contact[]) {
    const jurisdiction = await this.getDefaultJurisdiction(orgId);

    await prisma.vatReturn.create({
      data: {
        organizationId: orgId,
        vatRegistrationId: (await this.getDefaultVatRegistration(orgId, jurisdiction.id)).id,
        periodStart: new Date(2024, 0, 1),
        periodEnd: new Date(2024, 2, 31),
        dueDate: new Date(2024, 3, 30),
        status: 'draft',
        currencyCode: 'EUR',
        items: {
          create: [
            { type: 'sales', boxCode: 'STD', netAmount: 3000, vatRate: 19, vatAmount: 570, grossAmount: 3570, currencyCode: 'EUR' },
            { type: 'purchases', boxCode: 'STD', netAmount: 500, vatRate: 19, vatAmount: 95, grossAmount: 595, currencyCode: 'EUR' },
          ],
        },
      },
    });
  }
}
```

## 6. Seed Commands

```typescript
// apps/api/src/commands/seed/seed-all.command.ts
@Command({ name: 'db:seed', description: 'Seed the database' })
export class SeedAllCommand {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharedSeedService: SharedSeedService,
    private readonly tenantSeedService: TenantSeedService,
    private readonly demoSeedService: DemoSeedService,
  ) {}

  async run(options: SeedOptions) {
    console.log('Seeding database...');

    await this.sharedSeedService.seed();

    if (options.tenantId) {
      await this.tenantSeedService.seedOrganization(options.tenantId);
      if (options.demo) {
        await this.demoSeedService.seedDemoData(options.tenantId);
      }
    }

    console.log('Seeding completed');
  }
}

// Usage:
// pnpm nx run api:seed all
// pnpm nx run api:seed tenant --tenant-id=org_123
// pnpm nx run api:seed demo --tenant-id=org_123
```

## 7. Factory Pattern for Tests

```typescript
// test/factories/vat-return.factory.ts
import { faker } from '@faker-js/faker';

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
      currencyCode: 'EUR',
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<VatReturn>[]): VatReturn[] {
    return Array.from({ length: count }, (_, i) => this.create(overrides?.[i]));
  }

  static createSubmitted(overrides?: Partial<VatReturn>): VatReturn {
    return this.create({
      status: 'submitted',
      submittedAt: new Date(),
      submissionId: `sub_${faker.string.alphanumeric(10)}`,
      ...overrides,
    });
  }
}

// Usage in tests
const vatReturn = VatReturnFactory.create({
  organizationId: testOrg.id,
  status: 'submitted',
});
```

## 8. Demo Organization Setup

```typescript
// prisma/seeds/demo-organization.ts
export async function createDemoOrganization(): Promise<Organization> {
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Company GmbH',
      slug: 'demo',
      legalName: 'Demo Company GmbH',
      taxId: 'DE123456789',
      countryCode: 'DE',
      currencyCode: 'EUR',
      locale: 'en',
      timezone: 'Europe/Berlin',
      planId: (await prisma.subscriptionPlan.findFirst({ where: { name: 'Pro' } }))?.id,
      isActive: true,
    },
  });

  // Create owner user
  const ownerRole = await prisma.role.findFirst({ where: { name: 'owner' } });
  const owner = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      passwordHash: await hash('demo123456'),
      firstName: 'Demo',
      lastName: 'User',
      emailVerified: true,
      isActive: true,
    },
  });

  await prisma.organizationUser.create({
    data: {
      organizationId: org.id,
      userId: owner.id,
      roleId: ownerRole!.id,
      isOwner: true,
      isActive: true,
    },
  });

  // Seed tenant data
  await tenantSeedService.seedOrganization(org.id);
  await demoSeedService.seedDemoData(org.id);

  return org;
}
```

## 9. Environment-Specific Seeds

```typescript
// prisma/seed.ts
async function main() {
  const env = process.env.NODE_ENV;

  await seedShared();

  if (env === 'development') {
    // Seed demo organization
    const demoOrg = await createDemoOrganization();
    console.log(`Demo organization created: ${demoOrg.slug}`);
  }

  if (env === 'test') {
    // Seed test organization
    const testOrg = await createTestOrganization();
    console.log(`Test organization created: ${testOrg.id}`);
  }
}
```

## 10. Seed Verification

```typescript
// scripts/verify-seeds.ts
async function verifySeeds() {
  const orgCount = await prisma.organization.count();
  const userCount = await prisma.user.count();
  const jurisdictionCount = await prisma.jurisdiction.count();
  const vatReturnCount = await prisma.vatReturn.count();

  console.log('Seed verification:');
  console.log(`  Organizations: ${orgCount}`);
  console.log(`  Users: ${userCount}`);
  console.log(`  Jurisdictions: ${jurisdictionCount}`);
  console.log(`  VAT Returns: ${vatReturnCount}`);

  if (orgCount === 0) {
    throw new Error('No organizations found - seeds may have failed');
  }
}
```
