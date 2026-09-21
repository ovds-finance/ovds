# 38 — Database Migration Strategy

## 1. Migration Philosophy

The database evolves through versioned, reversible migrations. Each bounded context owns its schema changes.

```
prisma/
├── schema/
│   ├── shared.prisma       # Identity, billing, audit
│   ├── tenant.prisma       # All tenant business data
│   └── migrations/
│       ├── shared/
│       │   ├── 20240101_init/
│       │   ├── 20240115_add_webhooks/
│       │   └── 20240201_add_audit/
│       └── tenant/
│           ├── 20240101_init/
│           ├── 20240115_add_vat_returns/
│           ├── 20240201_add_transactions/
│           └── 20240215_add_reconciliation/
├── generated/
│   ├── shared/
│   └── tenant/
├── seed.ts
└── package.json
```

## 2. Migration Naming Convention

```
<YYYYMMDD>_<description>/
├── migration.sql          # Raw SQL for complex changes
├── seed.sql               # Optional seed data
└── README.md              # Migration description
```

Examples:
- `20240101_init/` - Initial schema
- `20240115_add_vat_returns/` - Add VAT return tables
- `20240201_add_transactions/` - Add transaction tables
- `20240215_add_reconciliation/` - Add reconciliation tables

## 3. Shared Schema Migrations

### 3.1 Initial Shared Migration

```sql
-- migrations/shared/20240101_init/migration.sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  legal_name VARCHAR(255),
  tax_id VARCHAR(255),
  tax_id_verified BOOLEAN DEFAULT false,
  country_code CHAR(2) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'EUR',
  locale VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  plan_id UUID,
  settings JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(50),
  phone_verified BOOLEAN DEFAULT false,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  failed_login_count INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  password_changed_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  is_owner BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_country ON organizations(country_code);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_organization_users_org ON organization_users(organization_id);
```

### 3.2 Add Webhooks Migration

```sql
-- migrations/shared/20240115_add_webhooks/migration.sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_success_at TIMESTAMP,
  last_failure_at TIMESTAMP,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_org ON webhooks(organization_id);
```

## 4. Tenant Schema Migrations

### 4.1 Initial Tenant Migration

```sql
-- migrations/tenant/20240101_init/migration.sql
CREATE TABLE jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  country_code CHAR(2) NOT NULL,
  region_code VARCHAR(10),
  name VARCHAR(255) NOT NULL,
  vat_name VARCHAR(255) NOT NULL,
  authority_name VARCHAR(255),
  authority_url TEXT,
  currency_code CHAR(3) NOT NULL,
  locale VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  vat_rates JSONB NOT NULL,
  filing_frequency VARCHAR(20) DEFAULT 'quarterly',
  deadline_rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, country_code, region_code)
);

CREATE TABLE vat_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  registration_number VARCHAR(255) NOT NULL,
  registration_type VARCHAR(50) NOT NULL DEFAULT 'standard',
  scheme VARCHAR(50),
  effective_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vat_registrations_org ON vat_registrations(organization_id);
CREATE INDEX idx_vat_registrations_number ON vat_registrations(registration_number);
```

### 4.2 Add VAT Returns Migration

```sql
-- migrations/tenant/20240115_add_vat_returns/migration.sql
CREATE TABLE vat_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  vat_registration_id UUID NOT NULL REFERENCES vat_registrations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  submission_id VARCHAR(255),
  submitted_at TIMESTAMP,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  total_sales NUMERIC(15,2),
  total_purchases NUMERIC(15,2),
  total_vat_due NUMERIC(15,2),
  total_vat_reclaim NUMERIC(15,2),
  net_vat_due NUMERIC(15,2),
  currency_code CHAR(3) NOT NULL DEFAULT 'EUR',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vat_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vat_return_id UUID NOT NULL REFERENCES vat_returns(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  box_code VARCHAR(50) NOT NULL,
  description TEXT,
  net_amount NUMERIC(15,2) NOT NULL,
  vat_rate NUMERIC(5,2) NOT NULL,
  vat_amount NUMERIC(15,2) NOT NULL,
  gross_amount NUMERIC(15,2) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  transaction_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vat_return_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vat_return_id UUID NOT NULL REFERENCES vat_returns(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  user_id UUID,
  notes TEXT,
  snapshot JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vat_returns_org_status ON vat_returns(organization_id, status);
CREATE INDEX idx_vat_returns_org_period ON vat_returns(organization_id, period_start, period_end);
CREATE INDEX idx_vat_return_items_return ON vat_return_items(vat_return_id);
```

### 4.3 Add Transactions Migration

```sql
-- migrations/tenant/20240201_add_transactions/migration.sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  vat_registration_id UUID REFERENCES vat_registrations(id),
  type VARCHAR(50) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  transaction_date DATE NOT NULL,
  due_date DATE,
  invoice_number VARCHAR(255),
  reference VARCHAR(255),
  description TEXT,
  counterparty_name VARCHAR(255),
  counterparty_vat_id VARCHAR(255),
  currency_code CHAR(3) NOT NULL,
  exchange_rate NUMERIC(10,4),
  net_amount NUMERIC(15,2) NOT NULL,
  vat_rate NUMERIC(5,2),
  vat_amount NUMERIC(15,2),
  gross_amount NUMERIC(15,2) NOT NULL,
  vat_code VARCHAR(50),
  is_reconciled BOOLEAN DEFAULT false,
  is_import_source BOOLEAN DEFAULT false,
  imported_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_org_date ON transactions(organization_id, transaction_date);
CREATE INDEX idx_transactions_org_type ON transactions(organization_id, type);
CREATE INDEX idx_transactions_jurisdiction ON transactions(jurisdiction_id);
```

## 5. Migration Execution

### 5.1 Prisma Migration Command

```bash
# Generate migration from schema
pnpm nx run api:prisma migrate dev -- --name add_vat_returns --schema=prisma/schema/tenant.prisma

# Apply migrations (production)
pnpm nx run api:prisma migrate deploy -- --schema=prisma/schema/tenant.prisma
```

### 5.2 Custom Migration Runner

```typescript
// scripts/run-migrations.ts
import { PrismaClient } from '@prisma/client';

const shared = new PrismaClient({ datasources: { shared: { url: process.env.DATABASE_SHARED_URL } } });
const tenant = new PrismaClient({ datasources: { tenant: { url: process.env.DATABASE_TENANT_URL } } });

async function runSharedMigrations() {
  const migrations = await glob('prisma/schema/migrations/shared/*/migration.sql');
  for (const migration of migrations.sort()) {
    console.log(`Running shared migration: ${migration}`);
    const sql = await fs.readFile(migration, 'utf-8');
    await shared.$executeRaw(sql);
  }
}

async function runTenantMigrations() {
  const migrations = await glob('prisma/schema/migrations/tenant/*/migration.sql');
  for (const migration of migrations.sort()) {
    console.log(`Running tenant migration: ${migration}`);
    const sql = await fs.readFile(migration, 'utf-8');
    await tenant.$executeRaw(sql);
  }
}
```

## 6. Seed Data Strategy

### 6.1 Shared Seeds

```typescript
// prisma/seed.ts
async function seedShared() {
  // Currencies
  await prisma.currency.createMany({
    data: [
      { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isBase: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
      { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
      // ... all ISO 4217 currencies
    ],
  });

  // Roles
  await prisma.role.createMany({
    data: [
      { name: 'owner', description: 'Full access', permissions: { '*': true }, isSystem: true },
      { name: 'admin', description: 'Admin access', permissions: { /* ... */ }, isSystem: true },
      { name: 'accountant', description: 'Accountant', permissions: { /* ... */ }, isSystem: true },
      { name: 'viewer', description: 'Read-only', permissions: { /* ... */ }, isSystem: true },
    ],
  });

  // Subscription plans
  await prisma.subscriptionPlan.createMany({
    data: [
      { name: 'Free', priceMonthly: 0, maxUsers: 1, maxReturns: 10, features: {} },
      { name: 'Pro', priceMonthly: 29, maxUsers: 5, maxReturns: 100, features: { advanced_reports: true } },
      { name: 'Business', priceMonthly: 99, maxUsers: 20, maxReturns: 500, features: { advanced_reports: true, multi_jurisdiction: true } },
    ],
  });
}
```

### 6.2 Tenant Seeds

```typescript
async function seedTenant(orgId: string) {
  // Jurisdictions for the organization's country
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const jurisdictions = await getJurisdictionsForCountry(org.countryCode);

  for (const jurisdiction of jurisdictions) {
    await prisma.jurisdiction.create({
      data: {
        organizationId: orgId,
        ...jurisdiction,
      },
    });
  }
}
```

## 7. Rollback Strategy

```bash
# Rollback last migration
pnpm nx run api:prisma migrate resolve --rolled-back <migration_name> --schema=prisma/schema/tenant.prisma

# Or use raw SQL rollback
psql -f migrations/tenant/20240115_add_vat_returns/rollback.sql
```

Each migration should have a corresponding `rollback.sql`:

```sql
-- migrations/tenant/20240115_add_vat_returns/rollback.sql
DROP TABLE IF EXISTS vat_return_history CASCADE;
DROP TABLE IF EXISTS vat_return_items CASCADE;
DROP TABLE IF EXISTS vat_returns CASCADE;
```

## 8. Migration Best Practices

1. **Never modify applied migrations** - Create new ones
2. **Keep migrations small** - One logical change per migration
3. **Test rollbacks** - Every migration must be reversible
4. **Use transactions** - Wrap DDL in transactions where possible
5. **Avoid downtime** - Use expand/contract pattern for schema changes
6. **Index concurrently** - Use `CREATE INDEX CONCURRENTLY` in Postgres
7. **Monitor migration time** - Alert if > 30s

## 9. Zero-Downtime Migrations

```sql
-- Expand/contract pattern for column rename
-- Step 1: Add new column
ALTER TABLE vat_returns ADD COLUMN status_new VARCHAR(50);

-- Step 2: Backfill data
UPDATE vat_returns SET status_new = status;

-- Step 3: Swap columns (in app code, not DB)
-- Step 4: Drop old column
ALTER TABLE vat_returns DROP COLUMN status;
ALTER TABLE vat_returns RENAME COLUMN status_new TO status;
```

## 10. Database Versioning

```sql
-- Track applied migrations
CREATE TABLE schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT NOW(),
  applied_by VARCHAR(255)
);
```
