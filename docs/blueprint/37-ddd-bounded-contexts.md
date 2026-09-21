# 37 — Domain-Driven Design and Bounded Contexts

## 1. DDD Strategic Design

The system is organized into bounded contexts aligned with the Laravel Akaunting architecture but restructured for a VAT declaration SaaS.

```
┌─────────────────────────────────────────────────────────────────┐
│                        VAT SaaS System                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Identity &   │  │   Core VAT   │  │   VAT Returns        │  │
│  │   Access     │  │              │  │                      │  │
│  │              │  │ - Jurisdict  │  │ - Return CRUD        │  │
│  │ - User       │  │ - Registrat  │  │ - Validation         │  │
│  │ - Role       │  │ - VatRate    │  │ - Submission         │  │
│  │ - Permiss    │  │ - CalcEngine │  │ - History            │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Transactions │  │ Integrations │  │   Billing            │  │
│  │              │  │              │  │                      │  │
│  │ - Trans CRUD │  │ - Tax Auth   │  │ - Subscription       │  │
│  │ - Import     │  │ - Accounting │  │ - Plan               │  │
│  │ - Categorize │  │ - Webhooks   │  │ - Usage              │  │
│  │ - Reconcil   │  │ - OAuth2     │  │ - Invoicing          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Reporting    │  │ Notifications│  │   Audit & Compliance │  │
│  │              │  │              │  │                      │  │
│  │ - Reports    │  │ - In-App     │  │ - Audit Log          │  │
│  │ - Exports    │  │ - Email      │  │ - Data Retention     │  │
│  │ - Dashboards │  │ - Push       │  │ - GDPR               │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Bounded Context Details

### 2.1 Identity & Access Context

**Responsibility**: Authentication, authorization, user management.

**Aggregates**:
- `User` (aggregate root)
- `Role` (aggregate root)
- `Permission` (value object)

**Entities**:
- `User`
- `Role`
- `Permission`
- `OrganizationUser` (join table)

**Value Objects**:
- `Email`
- `PasswordHash`
- `PermissionSet`

**Domain Events**:
- `UserCreated`
- `UserUpdated`
- `UserDeleted`
- `UserInvited`
- `RoleAssigned`

**Anti-corruption**: None (core domain)

### 2.2 Core VAT Context

**Responsibility**: Jurisdiction configuration, VAT rates, calculation engine.

**Aggregates**:
- `Jurisdiction` (aggregate root)
- `VatRegistration` (aggregate root)
- `VatRate` (entity)

**Entities**:
- `Jurisdiction`
- `VatRegistration`
- `VatRate`

**Value Objects**:
- `VatNumber`
- `Money`
- `Period`
- `VatRateCode`

**Domain Events**:
- `JurisdictionCreated`
- `VatRateUpdated`
- `VatRegistrationVerified`

**Anti-corruption**: None (core domain)

### 2.3 VAT Returns Context

**Responsibility**: VAT return declaration lifecycle.

**Aggregates**:
- `VatReturn` (aggregate root)

**Entities**:
- `VatReturn`
- `VatReturnItem`
- `VatReturnHistory`
- `VatReturnAttachment`

**Value Objects**:
- `ReturnPeriod`
- `ReturnStatus`
- `ReturnBox`
- `LineCalculation`

**Domain Events**:
- `VatReturnCreated`
- `VatReturnSubmitted`
- `VatReturnAccepted`
- `VatReturnRejected`
- `VatReturnPaid`

**Anti-corruption**: 
- Maps to `Document` in Laravel (invoice/bill pattern)
- Uses `Integration` context for submission

### 2.4 Transactions Context

**Responsibility**: Financial transaction recording and categorization.

**Aggregates**:
- `Transaction` (aggregate root)

**Entities**:
- `Transaction`
- `TransactionTax`
- `Transfer`

**Value Objects**:
- `Money`
- `TransactionType`
- `TransactionDirection`

**Domain Events**:
- `TransactionCreated`
- `TransactionUpdated`
- `TransactionReconciled`
- `TransactionDeleted`

**Anti-corruption**: 
- Maps to `Banking/Transaction` in Laravel

### 2.5 Integrations Context

**Responsibility**: External system connectivity.

**Aggregates**:
- `Integration` (aggregate root)

**Entities**:
- `Integration`
- `Webhook`

**Value Objects**:
- `ProviderCredentials`
- `SyncToken`

**Domain Events**:
- `IntegrationConnected`
- `IntegrationSyncCompleted`
- `WebhookReceived`

**Anti-corruption**: 
- Adapter pattern for each external system
- Response normalization layer

### 2.6 Billing Context

**Responsibility**: Subscription and plan management.

**Aggregates**:
- `Subscription` (aggregate root)
- `SubscriptionPlan` (aggregate root)

**Entities**:
- `Subscription`
- `SubscriptionPlan`
- `Invoice`

**Value Objects**:
- `PlanFeatures`
- `BillingPeriod`

**Domain Events**:
- `SubscriptionCreated`
- `SubscriptionCanceled`
- `PlanUpgraded`

### 2.7 Reporting Context

**Responsibility**: Report generation and export.

**Aggregates**:
- `Report` (aggregate root)

**Entities**:
- `Report`
- `ReportSchedule`

**Value Objects**:
- `ReportType`
- `ExportFormat`
- `ReportParameters`

**Domain Events**:
- `ReportGenerated`
- `ReportExportCompleted`

### 2.8 Notifications Context

**Responsibility**: Multi-channel notifications.

**Aggregates**:
- `Notification` (aggregate root)

**Entities**:
- `Notification`
- `NotificationPreference`

**Value Objects**:
- `NotificationType`
- `NotificationPriority`
- `Channel`

**Domain Events**:
- `NotificationCreated`
- `NotificationRead`

### 2.9 Audit & Compliance Context

**Responsibility**: Immutable audit trail and compliance.

**Aggregates**:
- `AuditLog` (aggregate root)

**Entities**:
- `AuditLog`
- `DataSubjectRequest`

**Value Objects**:
- `AuditAction`
- `ChangeSet`

**Domain Events**:
- `AuditLogged`
- `ComplianceReportGenerated`

## 3. Context Map

```
┌─────────────────┐        ┌─────────────────┐
│ Identity &      │───────▶│ Core VAT        │
│ Access          │◀───────│                 │
│ (Owns User)     │ events │ (Owns Jurisdict)│
└─────────────────┘        └─────────────────┘
       │                           │
       │ API                       │ events
       ▼                           ▼
┌─────────────────┐        ┌─────────────────┐
│ Multi-Tenancy   │───────▶│ VAT Returns     │
│                 │◀───────│                 │
│ (Owns Org)      │ events │ (Owns Return)   │
└─────────────────┘        └─────────────────┘
                                   │
                                   │ API
                                   ▼
                            ┌─────────────────┐
                            │ Transactions    │
                            │                 │
                            │ (Owns Trans)    │
                            └─────────────────┘
                                   │
                                   │ events
                                   ▼
                            ┌─────────────────┐
                            │ Integrations    │
                            │                 │
                            │ (Owns Integrat) │
                            └─────────────────┘
```

## 4. Aggregate Design Principles

1. **Small Aggregates**: Keep aggregates small (VatReturn, not VatReturn + all history).
2. **Eventual Consistency**: Use events for cross-aggregate consistency.
3. **Optimistic Locking**: Version field on all aggregates.
4. **Invariants**: Enforce business rules at aggregate boundary.
5. **Repository per Aggregate**: One repository interface per aggregate root.

## 5. Context Integration Patterns

| From Context | To Context | Pattern | Mechanism |
|-------------|-----------|---------|-----------|
| Identity & Access | Core VAT | Event | `UserCreated` → welcome email |
| Core VAT | VAT Returns | API | Rate lookup during return creation |
| VAT Returns | Integrations | Event | `VatReturnSubmitted` → submit to authority |
| Transactions | VAT Returns | Event | `TransactionCreated` → update return |
| Billing | Identity & Access | Event | `SubscriptionCanceled` → disable user |
| Integrations | Notifications | Event | `IntegrationExpired` → notify user |

## 6. Shared Kernel

Minimal shared types between contexts:

```
libs/shared/types/
├── money.ts           # Money value object
├── vat-number.ts      # VAT number value object
├── period.ts          # Date period value object
├── currency.ts        # Currency code type
├── organization.ts    # Organization ID type
└── index.ts
```

## 7. Anti-Corruption Layers

### 7.1 External Tax Authorities

```
VAT Returns Context → Tax Authority ACL → HMRC/EuroVAT
```

The ACL:
- Translates internal `VatReturn` to authority-specific payload
- Normalizes authority responses to internal `SubmissionResult`
- Handles retry, rate limiting, and circuit breaking

### 7.2 Accounting Systems

```
Transactions Context → Accounting ACL → Xero/QuickBooks
```

The ACL:
- Normalizes external invoice/transaction formats
- Handles conflict resolution
- Maps external IDs to internal IDs

## 8. Domain Events Catalog

| Event | Context | Trigger | Handlers |
|-------|---------|---------|----------|
| `UserCreated` | Identity | User registration | Send welcome email |
| `OrganizationCreated` | Identity | Org creation | Setup default settings |
| `VatRegistrationVerified` | Core VAT | VIES validation | Notify user |
| `VatReturnCreated` | VAT Returns | Return created | Update dashboard |
| `VatReturnSubmitted` | VAT Returns | Submit action | Submit to authority, notify |
| `VatReturnAccepted` | VAT Returns | Authority accepts | Update status, notify |
| `VatReturnRejected` | VAT Returns | Authority rejects | Notify, allow resubmit |
| `TransactionCreated` | Transactions | Transaction import | Update return totals |
| `TransactionReconciled` | Transactions | Reconciliation | Update account balance |
| `IntegrationConnected` | Integrations | OAuth complete | Start initial sync |
| `IntegrationSyncCompleted` | Integrations | Sync done | Notify user |
| `SubscriptionCreated` | Billing | Signup | Provision access |
| `SubscriptionCanceled` | Billing | Cancellation | Downgrade access |
| `NotificationCreated` | Notifications | Event fired | Push to WebSocket |
| `AuditLogged` | Audit | Any mutation | Write to immutable log |

## 9. Context Boundaries Enforcement

- No shared database tables between contexts (except shared schema for identity)
- Communication only via events or well-defined API contracts
- Each context has its own NestJS module
- Shared kernel is versioned and changes require cross-context agreement

## 10. Migration from Laravel Bounded Contexts

| Laravel Context | Nx Context | NestJS Module | Changes |
|----------------|-----------|---------------|---------|
| `Auth` | Identity & Access | `AuthModule` | Laratrust → custom RBAC |
| `Banking` | Transactions | `TransactionsModule` | Renamed, VAT-focused |
| `Common` | Split | Multiple | Company → Organizations, Contact → Contacts |
| `Document` | VAT Returns | `VatReturnsModule` | Generalized to VAT returns |
| `Setting` | Core VAT + Billing | `JurisdictionsModule`, `BillingModule` | Split |
| `Module` | Integrations | `IntegrationsModule` | Generalized to all integrations |
| `Install` | Bootstrap | N/A | Replaced by NestJS module init |
