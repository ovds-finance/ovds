# 18 — Domain Model and Entity Relationships

## 1. Core Entities

The domain is organized around these core entities:

| Entity | Bounded Context | Purpose |
|--------|-----------------|---------|
| `Organization` | Identity & Access | Tenant root; contains all tenant data |
| `User` | Identity & Access | System user; can belong to multiple organizations |
| `Role` | Identity & Access | Permission bundle; assigned to users per organization |
| `OrganizationUser` | Identity & Access | Join table; user-organization membership with role |
| `VatRegistration` | Core VAT | VAT number registration with a tax authority |
| `Jurisdiction` | Core VAT | Geographic tax authority configuration |
| `VatRate` | Core VAT | Time-bound VAT rate for a jurisdiction |
| `VatReturn` | VAT Returns | Periodic VAT return declaration |
| `VatReturnItem` | VAT Returns | Line items within a VAT return |
| `VatReturnHistory` | VAT Returns | Immutable audit trail of return changes |
| `VatReturnAttachment` | VAT Returns | Supporting documents for returns |
| `Transaction` | Transactions | Financial transaction with VAT implications |
| `Integration` | Integrations | Third-party tax authority connection |
| `Subscription` | Billing | Organization subscription plan |
| `AuditLog` | Audit & Compliance | Immutable action log |
| `Notification` | Notifications | User notification |
| `ImportJob` | Common | Import processing status |
| `Report` | Reporting | Generated report metadata |

## 2. Entity Relationship Diagram

```
Organization (1) ──< (n) OrganizationUser (n) >── (1) User
    │                                           │
    │                                           │
    ├──< (n) VatRegistration                    ├──< (n) Role
    │         │                                  │
    │         ├──< (n) VatReturn                 │
    │         │         │
    │         │         ├──< (n) VatReturnItem
    │         │         ├──< (n) VatReturnHistory
    │         │         └──< (n) VatReturnAttachment
    │         │
    │         └──< (n) Transaction
    │                   │
    ├──< (n) Jurisdiction │
    │         │           │
    │         ├──< (n) VatRate
    │         │
    ├──< (n) Integration
    │
    ├──< (n) Subscription ──> (1) SubscriptionPlan
    │
    ├──< (n) AuditLog
    ├──< (n) Notification
    ├──< (n) ImportJob
    └──< (n) Report
```

## 3. Detailed Entity Specifications

### 3.1 Organization

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  taxId?: string;
  taxIdVerified: boolean;
  countryCode: string;          // ISO 3166-1 alpha-2
  currencyCode: string;         // ISO 4217
  locale: string;               // e.g., "en", "de", "fr"
  timezone: string;             // IANA timezone
  planId?: string;
  settings: Record<string, any>; // Feature flags, preferences
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

**Business Rules:**
- `slug` must be unique across all organizations.
- `countryCode` determines available tax authorities.
- `currencyCode` is the base currency for all amounts.
- `isActive` controls login and API access.

### 3.2 User

```typescript
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  passwordHash: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  failedLoginCount: number;
  lockedUntil?: Date;
  passwordChangedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

**Business Rules:**
- Password must meet strength requirements (min 8 chars, mixed case, number, symbol).
- Account locks after 5 failed login attempts for 15 minutes.
- `passwordChangedAt` is used to force re-authentication for sensitive operations.

### 3.3 VatRegistration

```typescript
interface VatRegistration {
  id: string;
  organizationId: string;
  jurisdictionId: string;
  registrationNumber: string;
  registrationType: 'standard' | 'flat_rate' | 'group' | 'non_established';
  scheme?: string;               // "MOSS", "OSS", "IOSS"
  effectiveDate: Date;
  endDate?: Date;
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules:**
- `registrationNumber` must be unique per organization.
- `endDate` soft-deactivates the registration.
- `scheme` determines special VAT handling (OSS for EU B2C).
- `isVerified` is set after successful validation with tax authority.

### 3.4 VatReturn

```typescript
interface VatReturn {
  id: string;
  organizationId: string;
  vatRegistrationId: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  status: VatReturnStatus;
  submissionId?: string;
  submittedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  version: number;               // For optimistic locking
  totalSales?: Decimal;
  totalPurchases?: Decimal;
  totalVatDue?: Decimal;
  totalVatReclaim?: Decimal;
  netVatDue?: Decimal;
  currencyCode: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

type VatReturnStatus = 'draft' | 'pending_review' | 'submitted' | 'accepted' | 'rejected' | 'paid';
```

**Business Rules:**
- `version` increments on every update for optimistic locking.
- `dueDate` is calculated based on jurisdiction deadline rules.
- `status` transitions: draft → pending_review → submitted → accepted/rejected.
- `netVatDue` = `totalVatDue` - `totalVatReclaim`.

### 3.5 VatReturnItem

```typescript
interface VatReturnItem {
  id: string;
  vatReturnId: string;
  type: 'sales' | 'purchases' | 'adjustments' | 'corrections';
  boxCode: string;               // Authority-specific box code
  description?: string;
  netAmount: Decimal;
  vatRate: Decimal;
  vatAmount: Decimal;
  grossAmount: Decimal;
  currencyCode: string;
  transactionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

**Business Rules:**
- `grossAmount` must equal `netAmount + vatAmount` (validated).
- `boxCode` is specific to the jurisdiction and return type.
- `transactionId` links to source transaction if applicable.

### 3.6 Transaction

```typescript
interface Transaction {
  id: string;
  organizationId: string;
  jurisdictionId: string;
  vatRegistrationId?: string;
  type: 'sale' | 'purchase' | 'refund' | 'adjustment' | 'transfer';
  direction: 'incoming' | 'outgoing';
  transactionDate: Date;
  dueDate?: Date;
  invoiceNumber?: string;
  reference?: string;
  description?: string;
  counterpartyName?: string;
  counterpartyVatId?: string;
  currencyCode: string;
  exchangeRate?: Decimal;
  netAmount: Decimal;
  vatRate?: Decimal;
  vatAmount?: Decimal;
  grossAmount: Decimal;
  vatCode?: string;
  isReconciled: boolean;
  isImportSource: boolean;
  importedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules:**
- `grossAmount` = `netAmount + vatAmount` for VAT-applicable transactions.
- `vatRate` is optional for exempt transactions.
- `isReconciled` links to bank statement or accounting system.
- `isImportSource` marks transactions imported from external systems.

### 3.7 Jurisdiction

```typescript
interface Jurisdiction {
  id: string;
  organizationId: string;
  countryCode: string;
  regionCode?: string;
  name: string;
  vatName: string;
  authorityName?: string;
  authorityUrl?: string;
  currencyCode: string;
  locale: string;
  timezone: string;
  vatRates: VatRateDefinition[];
  filingFrequency: 'monthly' | 'quarterly' | 'annually';
  deadlineRules: DeadlineRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface VatRateDefinition {
  code: string;
  name: string;
  rate: Decimal;
  type: 'standard' | 'reduced' | 'super_reduced' | 'zero' | 'exempt';
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

interface DeadlineRule {
  month: number;
  day: number;
  description?: string;
}
```

**Business Rules:**
- `vatRates` is a JSON array of time-bound rates.
- `filingFrequency` determines return period structure.
- `deadlineRules` calculates due dates.

## 4. Value Objects

### 4.1 Money

```typescript
class Money {
  constructor(
    public readonly amount: Decimal,
    public readonly currencyCode: string,
  ) {}

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount.plus(other.amount), this.currencyCode);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount.minus(other.amount), this.currencyCode);
  }

  multiply(factor: number): Money {
    return new Money(this.amount.times(factor), this.currencyCode);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currencyCode !== other.currencyCode) {
      throw new CurrencyMismatchException(this.currencyCode, other.currencyCode);
    }
  }
}
```

### 4.2 VatNumber

```typescript
class VatNumber {
  constructor(public readonly value: string, public readonly countryCode: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.length < 3) {
      throw new InvalidVatNumberException(this.value);
    }
  }

  toString(): string {
    return `${this.countryCode}${this.value}`;
  }
}
```

### 4.3 Period

```typescript
class VatPeriod {
  constructor(
    public readonly start: Date,
    public readonly end: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.start >= this.end) {
      throw new InvalidPeriodException();
    }
  }

  contains(date: Date): boolean {
    return date >= this.start && date <= this.end;
  }

  days(): number {
    return Math.ceil((this.end.getTime() - this.start.getTime()) / (1000 * 60 * 60 * 24));
  }
}
```

## 5. Aggregate Boundaries

### 5.1 VatReturn Aggregate

```
VatReturn (Aggregate Root)
├── VatReturnItem (Entity)
├── VatReturnHistory (Entity)
├── VatReturnAttachment (Entity)
└── VatReturnEvent (Event)
```

**Invariants:**
- All items must sum to the return totals.
- Status transitions must follow the state machine.
- Version increments on every mutation.

### 5.2 Transaction Aggregate

```
Transaction (Aggregate Root)
└── TransactionTax (Value Object)
```

**Invariants:**
- Gross amount must equal net + tax.
- Cannot be deleted if reconciled.
- Cannot be modified if imported and reconciled.

## 6. Repository Interfaces

```typescript
interface IVatReturnRepository {
  findById(id: string, orgId: string): Promise<VatReturn | null>;
  findMany(orgId: string, filters: VatReturnFilters): Promise<PaginatedResult<VatReturn>>;
  create(data: CreateVatReturnDto): Promise<VatReturn>;
  update(id: string, orgId: string, data: UpdateVatReturnDto, expectedVersion: number): Promise<VatReturn>;
  softDelete(id: string, orgId: string): Promise<void>;
  addItem(returnId: string, item: CreateVatReturnItemDto): Promise<VatReturnItem>;
  addHistory(returnId: string, action: string, userId: string): Promise<VatReturnHistory>;
}

interface ITransactionRepository {
  findById(id: string, orgId: string): Promise<Transaction | null>;
  findMany(orgId: string, filters: TransactionFilters): Promise<PaginatedResult<Transaction>>;
  create(data: CreateTransactionDto): Promise<Transaction>;
  update(id: string, orgId: string, data: UpdateTransactionDto): Promise<Transaction>;
  reconcile(id: string, orgId: string, statementId: string): Promise<Transaction>;
  bulkImport(orgId: string, rows: TransactionImportRow[]): Promise<ImportResult>;
}
```

## 7. Domain Events

Domain events are raised by aggregates:

```typescript
// Domain event raised by VatReturn aggregate
class VatReturnStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly returnId: string,
    public readonly oldStatus: VatReturnStatus,
    public readonly newStatus: VatReturnStatus,
    public readonly changedBy: string,
  ) {
    super();
  }
}
```

## 8. Anti-Corruption Layer

The integration bounded context acts as an anti-corruption layer between the domain and external tax authorities:

```
┌─────────────────────────────────────────────────────────────┐
│                    Domain (Internal)                         │
│  VatReturn, Transaction, Integration (internal model)       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Anti-Corruption Layer                          │
│  - Provider adapters (HMRC, EuroVAT)                        │
│  - Response normalization                                   │
│  - Retry and circuit breaker                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              External System (Tax Authority)                 │
│  HMRC API, VIES SOAP, etc.                                  │
└─────────────────────────────────────────────────────────────┘
```

## 9. Bounded Context Communication

Contexts communicate via:
- **Events**: Asynchronous, eventual consistency
- **API Calls**: Synchronous, when immediate response needed
- **Shared Kernel**: Minimal shared types (e.g., `Money`, `VatNumber`) in `libs/shared/types`

## 10. Context Map

```
┌────────────────┐       events        ┌──────────────────┐
│ Identity &     │───────────────────▶│ Core VAT         │
│ Access         │◀───────────────────│                  │
└────────────────┘       events        └──────────────────┘
       │                                       │
       │ API                                   │ events
       ▼                                       ▼
┌────────────────┐       events        ┌──────────────────┐
│ Multi-Tenancy  │───────────────────▶│ VAT Returns      │
│                │◀───────────────────│                  │
└────────────────┘       API            └──────────────────┘
                                                      │
                                                      │ API
                                                      ▼
                                                ┌──────────────────┐
                                                │ Transactions     │
                                                │                  │
                                                └──────────────────┘
                                                      │
                                                      │ events
                                                      ▼
                                                ┌──────────────────┐
                                                │ Integrations     │
                                                │                  │
                                                └──────────────────┘
```
