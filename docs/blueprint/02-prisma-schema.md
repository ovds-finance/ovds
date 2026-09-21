# 02 — Prisma Schema Drafts

## 1. Schema Strategy

Two schema approaches are supported. The recommended default is **separate shared schema + tenant schema** to enforce logical isolation and simplify read-replica scaling.

```
prisma/
├── schema/
│   ├── shared.prisma     # Multi-tenant shared tables
│   ├── tenant.prisma     # Tenant-specific tables (all tenant data)
│   └── migrations/
│       ├── shared/
│       └── tenant/
├── generated/
│   ├── shared/           # Generated client for shared tables
│   └── tenant/           # Generated client for tenant tables
├── seed.ts
├── docker-compose.dev.yml
└── package.json
```

## 2. Shared Schema (schema/shared.prisma)

Contains identity, subscription, and tenant metadata. No tenant business data.

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/shared"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_SHARED_URL")
}

model Organization {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique
  legalName       String?
  taxId           String?   // VAT ID / Company registration number
  taxIdVerified   Boolean   @default(false)
  countryCode     String    @db.Char(2) // ISO 3166-1 alpha-2
  currencyCode    String    @db.Char(3) @default("EUR") // ISO 4217
  locale          String    @default("en")
  timezone        String    @default("UTC")
  planId          String?
  plan            SubscriptionPlan? @relation(fields: [planId], references: [id])
  subscription    Subscription?
  settings        Json?     // Feature flags, notification preferences
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  // Relations
  users           OrganizationUser[]
  members         User[]
  vatRegistrations VatRegistration[]
  vatReturns      VatReturn[]
  transactions    Transaction[]
  jurisdictions   Jurisdiction[]
  auditLogs       AuditLog[]
  integrations    Integration[]
  notifications   Notification[]

  @@index([slug])
  @@index([countryCode])
  @@index([isActive])
}

model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  emailVerified       Boolean   @default(false)
  emailVerifiedAt     DateTime?
  passwordHash        String
  firstName           String
  lastName            String
  avatarUrl           String?
  phone               String?
  phoneVerified       Boolean   @default(false)
  mfaEnabled          Boolean   @default(false)
  mfaSecret           String?
  lastLoginAt         DateTime?
  lastLoginIp         String?
  failedLoginCount    Int       @default(0)
  lockedUntil         DateTime?
  passwordChangedAt   DateTime  @default(now())
  isActive            Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  // Relations
  organizationUsers   OrganizationUser[]
  refreshTokens       RefreshToken[]
  auditLogs           AuditLog[]
  notifications       Notification[]
  passwordResets      PasswordReset[]

  @@index([email])
  @@index([createdAt])
}

model OrganizationUser {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  roleId         String
  isOwner        Boolean  @default(false)
  isActive       Boolean  @default(true)
  joinedAt       DateTime @default(now())
  leftAt         DateTime?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           Role         @relation(fields: [roleId], references: [id])

  @@unique([organizationId, userId])
  @@index([organizationId, roleId])
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique // e.g., "owner", "admin", "accountant", "viewer"
  description String?
  permissions Json     // { "vat_returns": ["create", "read", "update", "submit"], "transactions": ["create", "read"] }
  isSystem    Boolean  @default(false) // System roles cannot be deleted
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  organizationUsers OrganizationUser[]
}

model SubscriptionPlan {
  id              String    @id @default(cuid())
  name            String    @unique
  description     String?
  priceMonthly    Decimal   @db.Decimal(10, 2)
  priceYearly     Decimal   @db.Decimal(10, 2)
  maxOrganizations Int?
  maxUsers        Int?
  maxReturns      Int?      // Max VAT returns per period
  maxTransactions Int?      // Max transactions per month
  features        Json      // { "advanced_reports": true, "multi_jurisdiction": true, "api_access": false }
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  organizations   Organization[]
}

model Subscription {
  id                String    @id @default(cuid())
  organizationId    String    @unique
  planId            String
  status            String    @default("active") // active, canceled, past_due, trialing
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  canceledAt         DateTime?
  trialEndsAt        DateTime?
  metadata           Json?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  organization Organization     @relation(fields: [organizationId], references: [id])
  plan         SubscriptionPlan @relation(fields: [planId], references: [id])
}

model RefreshToken {
  id         String   @id @default(cuid())
  userId     String
  token      String   @unique
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}

model PasswordReset {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Integration {
  id              String    @id @default(cuid())
  organizationId  String
  provider        String    // e.g., "hmrc", "eurovat", "fintraffic"
  type            String    // "vat_authority", "accounting", "banking"
  status          String    @default("inactive") // inactive, active, error, expired
  credentials     Json      // Encrypted OAuth tokens, API keys
  config          Json?     // Provider-specific configuration
  lastSyncAt      DateTime?
  lastError       String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId, provider, type])
  @@index([organizationId, type])
}

model AuditLog {
  id            String   @id @default(cuid())
  organizationId String
  userId        String?
  action        String   // e.g., "vat_return.submit", "transaction.create"
  subjectType   String   // e.g., "VatReturn", "Transaction"
  subjectId     String
  changes       Json?    // Before/after diff
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id])

  @@index([organizationId, createdAt])
  @@index([subjectType, subjectId])
  @@index([action])
}

model Notification {
  id             String    @id @default(cuid())
  organizationId String
  userId         String?
  type           String    // "vat_return_due", "submission_success", "submission_failed", "payment_due"
  title          String
  message        String
  data           Json?     // Additional payload (return ID, amount, etc.)
  readAt         DateTime?
  priority       String    @default("normal") // low, normal, high, urgent
  createdAt      DateTime  @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id])

  @@index([organizationId, userId, readAt])
  @@index([createdAt])
}
```

## 3. Tenant Schema (schema/tenant.prisma)

Contains all tenant business data. Each tenant can optionally have a separate database schema or row-level filtering.

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/tenant"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_TENANT_URL")
}

model VatRegistration {
  id                String    @id @default(cuid())
  organizationId    String
  jurisdictionId    String
  registrationNumber String   // VAT number assigned by tax authority
  registrationType  String    // "standard", "flat_rate", "group", "non_established"
  scheme            String?   // e.g., "MOSS", "OSS", "IOSS"
  effectiveDate     DateTime
  endDate           DateTime?
  isActive          Boolean   @default(true)
  isVerified        Boolean   @default(false)
  verifiedAt        DateTime?
  metadata          Json?     // Additional authority-specific fields
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  jurisdiction      Jurisdiction           @relation(fields: [jurisdictionId], references: [id])
  vatReturns        VatReturn[]
  transactions      Transaction[]

  @@index([organizationId])
  @@index([jurisdictionId])
  @@index([registrationNumber])
}

model VatReturn {
  id                String    @id @default(cuid())
  organizationId    String
  vatRegistrationId String
  periodStart       DateTime
  periodEnd         DateTime
  dueDate           DateTime
  status            String    @default("draft") // draft, pending_review, submitted, accepted, rejected, paid
  submissionId      String?   // Authority-assigned submission ID
  submittedAt       DateTime?
  acceptedAt        DateTime?
  rejectedAt        DateTime?
  rejectionReason   String?
  version           Int       @default(1) // For optimistic locking
  totalSales        Decimal?  @db.Decimal(15, 2)
  totalPurchases    Decimal?  @db.Decimal(15, 2)
  totalVatDue       Decimal?  @db.Decimal(15, 2)
  totalVatReclaim   Decimal?  @db.Decimal(15, 2)
  netVatDue         Decimal?  @db.Decimal(15, 2)
  currencyCode      String    @db.Char(3) @default("EUR")
  metadata          Json?     // Authority-specific response data
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  vatRegistration   VatRegistration @relation(fields: [vatRegistrationId], references: [id])
  items             VatReturnItem[]
  history           VatReturnHistory[]
  attachments       VatReturnAttachment[]

  @@index([organizationId, status])
  @@index([organizationId, periodStart, periodEnd])
  @@index([dueDate])
  @@index([submissionId])
}

model VatReturnItem {
  id              String   @id @default(cuid())
  vatReturnId     String
  type            String   // "sales", "purchases", "adjustments", "corrections"
  boxCode         String   // Authority-specific box/code
  description     String?
  netAmount       Decimal  @db.Decimal(15, 2)
  vatRate         Decimal  @db.Decimal(5, 2) // e.g., 20.00 for 20%
  vatAmount       Decimal  @db.Decimal(15, 2)
  grossAmount     Decimal  @db.Decimal(15, 2)
  currencyCode    String   @db.Char(3)
  transactionId   String?  // Link to source transaction if applicable
  metadata        Json?
  createdAt       DateTime @default(now())

  vatReturn       VatReturn @relation(fields: [vatReturnId], references: [id], onDelete: Cascade)

  @@index([vatReturnId])
  @@index([transactionId])
}

model VatReturnHistory {
  id          String   @id @default(cuid())
  vatReturnId String
  action      String   // "created", "submitted", "accepted", "rejected", "corrected", "amended"
  userId      String?
  notes       String?
  snapshot    Json?    // Full return state at this point
  createdAt   DateTime @default(now())

  vatReturn   VatReturn @relation(fields: [vatReturnId], references: [id], onDelete: Cascade)

  @@index([vatReturnId, createdAt])
}

model VatReturnAttachment {
  id          String   @id @default(cuid())
  vatReturnId String
  name        String
  mimeType    String
  size        Int      // bytes
  path        String   // S3/object storage path
  uploadedBy  String?
  createdAt   DateTime @default(now())

  vatReturn   VatReturn @relation(fields: [vatReturnId], references: [id], onDelete: Cascade)

  @@index([vatReturnId])
}

model Jurisdiction {
  id              String   @id @default(cuid())
  organizationId  String
  countryCode     String   @db.Char(2) // ISO 3166-1 alpha-2
  regionCode      String?  // ISO 3166-2 or internal code
  name            String
  vatName         String   // Local name for VAT (e.g., "Value Added Tax", "MWSt")
  authorityName   String?  // Name of tax authority
  authorityUrl    String?
  currencyCode    String   @db.Char(3)
  locale          String
  timezone        String
  vatRates        Json     // [{ "rate": 20.00, "type": "standard", "label": "Standard" }, ...]
  filingFrequency String   @default("quarterly") // monthly, quarterly, annually
  deadlineRules   Json     // [{ "month": 4, "day": 30 }, ...] for quarterly
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  vatRegistrations VatRegistration[]
  transactions     Transaction[]

  @@unique([organizationId, countryCode, regionCode])
  @@index([countryCode])
}

model Transaction {
  id                String    @id @default(cuid())
  organizationId    String
  jurisdictionId    String
  vatRegistrationId String?
  type              String    // "sale", "purchase", "refund", "adjustment", "transfer"
  direction         String    // "incoming", "outgoing"
  transactionDate   DateTime
  dueDate           DateTime?
  invoiceNumber     String?
  reference         String?
  description       String?
  counterpartyName  String?
  counterpartyVatId String?
  currencyCode      String    @db.Char(3)
  exchangeRate      Decimal?  @db.Decimal(10, 4) // To organization currency
  netAmount         Decimal   @db.Decimal(15, 2)
  vatRate           Decimal?  @db.Decimal(5, 2)
  vatAmount         Decimal?  @db.Decimal(15, 2)
  grossAmount       Decimal   @db.Decimal(15, 2)
  vatCode           String?   // Internal VAT code
  isReconciled      Boolean   @default(false)
  isImportSource    Boolean   @default(false) // Imported from bank/accounting
  importedAt        DateTime?
  metadata          Json?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  jurisdiction      Jurisdiction     @relation(fields: [jurisdictionId], references: [id])
  vatRegistration   VatRegistration? @relation(fields: [vatRegistrationId], references: [id])

  @@index([organizationId, transactionDate])
  @@index([organizationId, type])
  @@index([jurisdictionId])
  @@index([vatRegistrationId])
  @@index([counterpartyVatId])
}

model VatRate {
  id          String   @id @default(cuid())
  jurisdictionId String
  code        String   // e.g., "STD", "RED", "ZR", "EX"
  name        String
  rate        Decimal  @db.Decimal(5, 2)
  type        String   // "standard", "reduced", "super_reduced", "zero", "exempt"
  isActive    Boolean  @default(true)
  effectiveFrom DateTime
  effectiveTo   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  jurisdiction Jurisdiction @relation(fields: [jurisdictionId], references: [id], onDelete: Cascade)

  @@unique([jurisdictionId, code])
  @@index([jurisdictionId, isActive])
}

model ImportJob {
  id            String    @id @default(cuid())
  organizationId String
  type          String    // "transactions", "invoices"
  status        String    @default("pending") // pending, processing, completed, failed, partial
  source        String    // "csv", "xlsx", "bank_api", "accounting_api"
  fileName      String?
  totalRows     Int?
  processedRows Int       @default(0)
  successRows   Int       @default(0)
  errorRows     Int       @default(0)
  errors        Json?     // Row-level errors
  metadata      Json?
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([organizationId, status])
  @@index([createdAt])
}

model Report {
  id            String    @id @default(cuid())
  organizationId String
  type          String    // "vat_summary", "audit_trail", "transaction_export", "compliance"
  name          String
  format        String    // "pdf", "xlsx", "csv", "json"
  parameters    Json?
  filePath      String?
  generatedBy   String?
  createdAt     DateTime  @default(now())
  expiresAt     DateTime?

  @@index([organizationId, type])
  @@index([createdAt])
}
```

## 4. Indexes and Performance Considerations

### 4.1 Critical Indexes

Every multi-tenant table has `organizationId` as the leading indexed column:

```sql
CREATE INDEX idx_vat_returns_org_status ON vat_returns (organization_id, status);
CREATE INDEX idx_transactions_org_date ON transactions (organization_id, transaction_date);
CREATE INDEX idx_audit_logs_org_created ON audit_logs (organization_id, created_at);
CREATE INDEX idx_notifications_org_user_read ON notifications (organization_id, user_id, read_at);
```

### 4.2 Partitioning Strategy (Large Tables)

For tables exceeding 10M rows per tenant, consider PostgreSQL declarative partitioning:

```sql
-- Partition transactions by year per tenant
CREATE TABLE transactions (
  ...
) PARTITION BY RANGE (transaction_date);
```

## 5. Multi-Tenancy Implementation Options

### Option A: Row-Level Isolation (Recommended Default)

All queries automatically filter by `organizationId` using a Prisma middleware:

```typescript
// prisma/middleware.ts
prisma.$use(async (params, next) => {
  if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
    params.args.where = { ...params.args.where, organizationId: currentOrgId };
  }
  if (params.action === 'create') {
    params.args.data = { ...params.args.data, organizationId: currentOrgId };
  }
  return next(params);
});
```

### Option B: Schema-Per-Tenant

Each tenant gets a dedicated PostgreSQL schema (e.g., `tenant_abc123`). Connection string is switched per request.

### Option C: Database-Per-Tenant

Maximum isolation. Suitable for enterprise tiers with dedicated infrastructure.

## 6. Migration Strategy

```bash
# Shared migrations
nx run api:prisma migrate deploy -- --schema=prisma/schema/shared.prisma

# Tenant migrations (run per tenant or use schema-level migration)
nx run api:prisma migrate deploy -- --schema=prisma/schema/tenant.prisma
```

## 7. Seeder Strategy

```typescript
// prisma/seed.ts
async function main() {
  // Seed shared data: plans, roles, jurisdictions, vat rates
  await seedSubscriptionPlans();
  await seedRoles();
  await seedJurisdictions(); // Pre-populate EU countries with VAT rates

  // Seed demo tenant
  const org = await seedDemoOrganization();
  await seedDemoUsers(org.id);
  await seedDemoVatRegistrations(org.id);
  await seedDemoTransactions(org.id);
}
```

## 8. Soft Deletes

All business tables use `deletedAt` for soft deletes. Prisma queries must include `deletedAt: null` filters. Global middleware handles this automatically.

## 9. Audit Trail

Every mutation to critical entities is logged in `AuditLog` (shared schema) with before/after JSON snapshots. This is enforced at the service layer via interceptors or explicit service calls.
