# Online VAT Declaration System (OVDS) — Canonical Full-Stack Engineering Architecture

**Repository:** `ovds/`  
**Architecture version:** 2.0  
**Status:** Implementation blueprint aligned to the current Nx monorepo  
**Primary runtime:** NestJS 12.0.2, React 19.2.8, Prisma 7.10, Nx 23.2.1, pnpm workspaces

This document is the canonical engineering blueprint for the Online VAT Declaration System (OVDS). It replaces the earlier concatenated blueprint drafts and distinguishes implemented repository behavior from proposed extensions.

## 1. Executive summary

OVDS is a multi-tenant Ethiopian financial and tax-compliance platform. It connects business operations with the Ministry of Revenues (MoR, formerly ERCA), supports AABE-oriented audit evidence, and provides controlled data flows to internal auditors, external audit firms, the Ministry of Finance, banks, and Telebirr.

The architecture is based on five engineering invariants:

1. **Tenant isolation is mandatory.** Company-scoped Prisma extensions and request context prevent cross-company reads and writes.
2. **Financial events are double-entry by construction.** A posted event creates balanced journal lines and immutable ledger snapshots inside a database transaction.
3. **Contracts are shared, but the current backend is REST-first.** The repository defines oRPC routers and a frontend client, while NestJS controllers currently expose the implemented server API; backend oRPC wiring is a roadmap item.
4. **Tax calculation is server-authoritative.** The frontend may preview VAT, but the Ethiopia VAT rule engine validates rates, exemptions, zero-rating, reverse charge, and filing data on the backend.
5. **Offline operation is auditable.** Queued operations carry checksums, idempotency keys, device identity, retry state, and reconciliation evidence.

### Institutional scope

| Entity                        | Responsibility in OVDS                                                                                        | Primary controls                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Taxpayer / Company            | Create invoices, bills, payments, contracts, asset movements, draft VAT returns, and offline records          | Company identity, TIN, tax profile, RBAC, tenant scoping, immutable ledger                    |
| Internal Auditor              | Review draft transactions, exceptions, period close, and filing evidence                                      | `AUDITOR` role, contextual permissions, `AuditLog`, review status                             |
| External Auditor              | Run audit engagements, record findings, attach evidence, and issue management conclusions                     | `EXTERNAL_AUDITOR`, `AuditEngagement`, `AuditFinding`, company-scoped access                  |
| AABE / Accreditation function | Maintain accreditation evidence, control checklists, and reporting readiness                                  | `AccreditationChecklist`, `AccreditationItem`, `VandvSubmission`, evidence retention          |
| Ministry of Revenues          | Receive EIMS invoice/receipt registrations, acknowledgements, VAT/TOT/WHT/PAYE filings, and compliance events | EIMS client, RSA-SHA512 verification, idempotency, acknowledgement vault                      |
| Ministry of Finance           | Consume authorized aggregate fiscal and macroeconomic metrics                                                 | Aggregated projections, period/sector filters, data minimization, no unnecessary taxpayer PII |
| Banks / Telebirr              | Settle invoices, import bank activity, reconcile payments, and report settlement status                       | Webhook signatures, AES-256-GCM, HMAC-SHA256, payment references, reconciliation              |
| System Operator               | Operate deployments, migrations, queues, keys, monitoring, and security controls                              | Deployment modes, health checks, secret management, audit logs, CI security gates             |

## 2. Truth boundary and repository alignment

The current repository is a real Nx/pnpm monorepo. The earlier blueprint contained several hypothetical paths and incompatible examples. The following rules apply to this document:

- The source tree uses `apps/` and `packages/`; it does not use the earlier `libs/` layout.
- The current applications are `apps/backend`, `apps/frontend`, and the smaller `apps/portal`. There is no separate `apps/authority` application today. Authority workflows are represented by role-scoped routes and can be extracted into a dedicated application later.
- The primary Prisma datasource is MySQL. PostgreSQL and SQLite compose profiles exist, but they are not runtime-switchable by environment variable alone; each requires a provider-specific Prisma build and migrations.
- The shared API contract is defined under `packages/contracts/src/router`, but the current NestJS backend is REST-first. The backend oRPC module is registered without contract handlers; frontend oRPC calls therefore require server wiring before they are operational.
- Telebirr cryptography uses AES-256-GCM with HMAC-SHA256 signatures. AES-256-CBC examples from the earlier draft are not part of the implemented design.
- The document describes the current implementation first and labels future legal-domain extensions explicitly.

## 3. Workspace topology

```text
ovds/
├── apps/
│   ├── backend/                 # NestJS API, integrations, and REST controllers
│   ├── frontend/                # React, Vite, Refine, Tailwind, i18next, PWA
│   ├── portal/                  # Client portal using REST/axios
│   └── public/                  # Static PWA shell and service-worker assets
├── packages/
│   ├── contracts/               # oRPC contracts and composed Zod schemas
│   ├── core/                    # VAT engine, module registry, shared kernel
│   ├── database/                # Prisma schema, migrations, tenant client
│   ├── shared/                  # Types, RBAC, crypto, compliance, utilities
│   ├── shared/dto/              # Shared DTO and Zod bridge packages
│   ├── modules/                 # Tax, compliance, and other domain modules
│   ├── domains/                 # Accounting, reporting, sales, purchases, etc.
│   ├── features/                # Workflow, IFRS, projects, offline, dashboards
│   ├── ui/                      # Shared enterprise UI primitives
│   ├── design-system/           # Brand tokens and design-system package
│   └── design-tokens/           # Standalone design-token package
├── docker-compose.*.yml
├── nx.json
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### Build and runtime boundaries

- **Backend:** NestJS modules are assembled in `apps/backend/src/app.module.ts`; the HTTP prefix defaults to `/api`.
- **Frontend:** React 19 with Vite 6, Refine, TailwindCSS, i18next, React Router, Workbox PWA support, and oRPC React Query clients.
- **Contracts:** `packages/contracts/src/router/index.ts` composes 23 domain routers. The frontend has an oRPC client, but the current backend server surface is implemented through NestJS REST controllers; backend oRPC handler wiring is not yet present.
- **Database:** `packages/database/prisma/schema.prisma` is the authoritative model source. `zod-prisma-types` generates typed schemas into `packages/contracts/src/prisma-zod`.
- **Domain logic:** VAT and module lifecycle logic lives in `packages/core`; operational domain services live in `packages/domains` and feature packages.

## 4. Institutional workflow

The workflow is a logical overlay across existing models. It is not currently represented by one universal enum; status transitions are persisted through the relevant domain records and audit events.

```text
Company operation
  -> Invoice / Bill / Contract / Asset event
  -> Balanced JournalEntry + JournalLine + LedgerEntry
  -> Internal review
  -> External audit engagement and findings
  -> AABE evidence / accreditation readiness
  -> MoR EIMS registration and VAT filing
  -> Bank / Telebirr settlement and reconciliation
  -> Aggregated authority and Ministry of Finance metrics
```

### Logical review states

| State                   | Meaning                                                           | Persisted evidence                                                        |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `DRAFT`                 | Transaction or filing is being prepared                           | Invoice, Bill, `VatFilingRecord`, `VatFilingEvent`                        |
| `INTERNAL_REVIEW`       | Internal audit or finance review is active                        | `AuditLog`, reviewer identity, review comments                            |
| `EXTERNAL_REVIEW`       | External audit engagement is active                               | `AuditEngagement`, `AuditFinding`, attached evidence                      |
| `AABE_EVIDENCE_READY`   | Evidence package is ready for accreditation or statutory review   | `AccreditationChecklist`, `AccreditationItem`, `VandvSubmission`          |
| `MOR_SUBMITTED`         | EIMS or tax filing has been transmitted                           | EIMS registration/receipt rows, `MorAcknowledgementReceipt`, filing event |
| `SETTLED`               | Payment and ledger reconciliation are complete                    | `Payment`, `BankTransaction`, `BankFeed`, reconciliation records          |
| `REJECTED` or `AMENDED` | Authority or reviewer rejected the record; correction is required | Rejection reason, new amendment record, immutable prior version           |

### Actor authorization

- Taxpayer users can create and manage records only for their company.
- Internal auditors can review company records according to `AUDITOR` permissions and contextual rules.
- External auditors are scoped to assigned companies and engagements.
- AABE/accreditation users can read evidence and checklist state without receiving unrestricted operational data.
- MoR integration identities can submit only approved, signed, idempotent payloads.
- Ministry of Finance consumers receive aggregate projections unless a specific legal authorization grants record-level access.
- Bank and Telebirr identities can write settlement events but cannot alter accounting policy or tax calculations.

## 5. Data architecture

### 5.1 Primary database and generation pipeline

The checked-in Prisma datasource is:

```prisma
datasource db {
  provider = "mysql"
}

generator client {
  provider = "prisma-client-js"
}
```

The repository also configures a `zod` generator that writes generated types to `packages/contracts/src/prisma-zod`. The checked-in dependency set includes `@prisma/adapter-mariadb`; `packages/database/prisma.config.js` supplies `PRISMA_DATABASE_URL` but does not currently branch providers or configure a PostgreSQL/SQLite adapter. The contract pipeline is:

```text
Prisma models
  -> zod-prisma-types
  -> generated Prisma Zod types
  -> hand-composed request/response schemas
  -> oRPC router contract
  -> NestJS implementation and React client
```

Relevant commands are defined in `package.json`:

- `npm run db:generate`
- `npm run db:generate:zod`
- `npm run db:migrate:dev`
- `npm run db:studio`
- `npm run docs:schema`

### 5.2 Model clusters

| Cluster                 | Representative models                                                                                                                   | Purpose                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Tenant and identity     | `Company`, `User`, `RoleDefinition`, `RolePermission`, `UserRole`, `Permission`                                                         | Company root, authentication, RBAC, ABAC policy                               |
| Commercial operations   | `Invoice`, `InvoiceItem`, `Bill`, `Customer`, `Vendor`, `Item`, `InventoryAdjustment`                                                   | Sales, purchases, inventory, line-item tax data                               |
| Contracts and assets    | `ContractSnapshot`, `PerformanceObligation`, `RevenueAllocation`, `FixedAsset`, `FixedAssetDisposal`, `Lease`                           | Construction, long-term contracts, IP-like intangible rights, asset lifecycle |
| Double-entry accounting | `Account`, `JournalEntry`, `JournalLine`, `LedgerEntry`, `LedgerMappingRule`                                                            | Chart of accounts, balanced posting, immutable ledger history                 |
| Banking and settlement  | `BankAccount`, `BankTransaction`, `BankFeed`, `Payment`, `InvoicePayment`, `FxRate`                                                     | Payments, bank feeds, FX, reconciliation                                      |
| Tax and authority       | `CompanyTaxProfile`, `VatFilingRecord`, `VatFilingEvent`, `VatReportArtifact`, `MorAcknowledgementReceipt`                              | VAT/TOT/WHT/PAYE preparation, submission, acknowledgement                     |
| Audit and accreditation | `AuditEngagement`, `AuditFinding`, `AuditFirm`, `AuditLog`, `AccreditationChecklist`, `AccreditationItem`, `VandvSubmission`            | Internal/external audit and AABE evidence                                     |
| Offline resilience      | `OfflineInvoiceQueue`, `OfflineDeviceRegistry`, `ClientNode`, `DualNodeVerification`, `VerifiedLedgerState`, `SyncQueue`, `PeriodClose` | Disconnected operation, replay protection, reconciliation                     |

A focused accounting excerpt illustrates the intended relationships:

```prisma
model Company {
  id           String   @id @default(uuid())
  name         String   @unique
  tin          String?
  currencyCode String?  @default("ETB")
  securityPolicy String? @db.LongText
  account      Account[]
  journalEntry JournalEntry[]
}

model Account {
  id          String   @id @default(uuid())
  code        String
  name        String
  type        AccountType
  companyId   String?
  company     Company? @relation(fields: [companyId], references: [id])
  journalLine JournalLine[]
  ledgerEntries LedgerEntry[]

  @@unique([code, companyId])
}

model JournalEntry {
  id          String        @id @default(uuid())
  date        DateTime      @default(now())
  period      String?
  description String
  status      String        @default("POSTED")
  companyId   String?
  company     Company?      @relation(fields: [companyId], references: [id])
  journalLine JournalLine[]
  ledgerEntries LedgerEntry[]
}

model JournalLine {
  id             String       @id @default(uuid())
  journalEntryId String
  accountId      String
  debit          Decimal      @default(0)
  credit         Decimal      @default(0)
  companyId      String?
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  account        Account      @relation(fields: [accountId], references: [id])
}

model LedgerEntry {
  id             String       @id @default(uuid())
  journalEntryId String
  companyId      String?
  accountId      String
  debit          Decimal      @default(0)
  credit         Decimal      @default(0)
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  account        Account      @relation(fields: [accountId], references: [id])
}
```

The complete schema in `packages/database/prisma/schema.prisma` remains authoritative; the excerpt is illustrative and should not be copied as a replacement schema.

### 5.3 Double-entry invariant

A financial event must be committed as one unit:

1. Create or update the source document.
2. Create one `JournalEntry`.
3. Create at least two `JournalLine` rows whose total debit equals total credit.
4. Create corresponding `LedgerEntry` snapshots.
5. Write an `AuditLog` event with actor, company, action, and timestamp.
6. Commit all steps through `Prisma.$transaction`.

If any step fails, the transaction rolls back. Ledger history is append-oriented; corrections create reversing or amended entries rather than mutating posted history.

### 5.4 Asset and legal-event lifecycle

The current schema supports the core lifecycle through general-purpose records:

- Physical goods move through `Item`, `InventoryAdjustment`, invoices, bills, and journal entries.
- Construction and long-term contracts use `ContractSnapshot`, performance obligations, allocations, and recognition schedules.
- Fixed assets use `FixedAsset` and `FixedAssetDisposal`; disposals record proceeds, net book value, gain/loss, buyer, and date.
- Leases use `Lease`, `LeasePayment`, and lease journal entries.
- Intangible/IP transfers, inheritance distributions, and formal corporate liquidation are target extensions. They should reuse the common event model and add explicit legal metadata rather than overloading invoices.

Recommended extension records are:

| Extension                   | Required fields                                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `AssetTransfer`             | company, asset reference, transfer type, legal basis, counterparty, ownership before/after, valuation, tax treatment, approval state, evidence |
| `LiquidationCase`           | company, opening balance, creditor claims, asset realizations, tax clearance, distribution plan, court/authority reference, closure state      |
| `InheritanceDistribution`   | estate reference, beneficiary, legal share, asset allocation, valuation date, tax treatment, approval evidence                                 |
| `IntellectualPropertyRight` | right identifier, owner, licensor/licensee, territory, term, consideration, transfer/license type, registration evidence                       |

Each extension must create a balanced accounting event when value changes and must be included in audit and filing workflows.

## 6. Database deployment profiles

The repository contains multiple compose files, but the Prisma provider is compile-time configuration. Environment variables alone cannot safely change MySQL to PostgreSQL or SQLite.

| Profile                  | Compose file                   | Declared database         | Current status                                                                                    |
| ------------------------ | ------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------- |
| Local / standard         | `docker-compose.ovds.yml`      | MySQL 8.0                 | Primary supported profile                                                                         |
| Cloud SaaS               | `docker-compose.cloud.yml`     | PostgreSQL 15             | Declarative profile; requires provider-specific Prisma build, adapter, generation, and migrations |
| On-premise single tenant | `docker-compose.onpremise.yml` | SQLite                    | Declarative profile; requires provider-specific Prisma build, adapter, generation, and migrations |
| On-premise multi tenant  | deployment configuration       | MySQL-compatible database | Uses the primary tenant model and shared-schema or database-per-tenant strategy                   |

To make a non-MySQL profile operational:

1. Create a provider-specific Prisma schema or build-time transformation.
2. Install and configure the matching Prisma driver adapter.
3. Run provider-specific `prisma generate`.
4. Generate and test provider-specific migrations.
5. Run the deployment smoke test before enabling traffic.

Do not point the MySQL-compiled client at a PostgreSQL or SQLite URL and treat the resulting connection failure as an environment-variable issue.

## 7. API architecture

### 7.1 Shared contracts and current REST surface

`packages/contracts/src/router/index.ts` defines 23 shared oRPC routers:

- `auth`
- `ovds`
- `banking`
- `hr`
- `inventory`
- `nav`
- `tax`
- `settings`
- `monetization`
- `sync`
- `customFields`
- `accounting`
- `consolidation`
- `compliance`
- `crm`
- `sales`
- `purchases`
- `eims`
- `invoice`
- `ifrs`
- `subLedger`
- `cyberAudit`
- `masterCompliance`

The shared routers provide a target contract for typed clients, and `apps/frontend/src/lib/orpc.ts` creates a frontend oRPC client. The current backend does not implement `appContract`: `apps/backend/src/orpc/orpc.module.ts` only registers `ORPCModule.forRoot({})`, and no backend `/api/rpc` handler or `oc.implementer` wiring is present. The implemented server API is therefore the NestJS REST controller surface described below; wiring the shared contract into the backend is an explicit roadmap item.

### 7.2 REST adapter surface

The NestJS application uses the `/api` prefix. Swagger is generated only when explicitly enabled or outside production and is exposed under `/api/openapi`.

Existing REST adapters include, among others:

| Area      | Existing endpoint pattern           | Purpose                                      |
| --------- | ----------------------------------- | -------------------------------------------- |
| Health    | `/api/health/live`                  | Container and process readiness              |
| Dashboard | `/api/dashboard/stats`              | Aggregated operational statistics            |
| Dashboard | `/api/dashboard/reports`            | Recent trend data                            |
| Dashboard | `/api/dashboard/strategic-insights` | Executive KPIs for authorized roles          |
| Offline   | `/api/offline/capabilities`         | Queue limits and offline capability metadata |
| Offline   | `/api/offline/sla-report`           | Offline service-level report                 |
| Swagger   | `/api/openapi`                      | Optional API documentation                   |

REST endpoints must delegate to domain services and enforce the same tenant, RBAC, ABAC, validation, and idempotency rules that future oRPC procedures will share.

### 7.3 Proposed Ministry of Finance dashboard contract

The following procedures and REST adapters are architectural targets. They should be added to `packages/contracts` before frontend implementation:

| Capability                | Proposed oRPC procedure               | Proposed REST adapter                | Authorization                             |
| ------------------------- | ------------------------------------- | ------------------------------------ | ----------------------------------------- |
| VAT period summary        | `ovds.metrics.vatPeriodSummary`       | `GET /api/dashboard/vat-summary`     | MoF aggregate role or authorized MoR role |
| Filing status             | `tax.metrics.filingStatus`            | `GET /api/dashboard/filings`         | MoR/MoF authorized role                   |
| EIMS acknowledgement rate | `eims.metrics.acknowledgementSummary` | `GET /api/dashboard/eims-summary`    | MoR integration/oversight role            |
| Audit readiness           | `compliance.metrics.auditReadiness`   | `GET /api/dashboard/audit-readiness` | AABE/MoR authorized role                  |
| Offline sync health       | `sync.metrics.queueHealth`            | `GET /api/dashboard/offline-health`  | Operator/MoR authorized role              |
| Settlement summary        | `banking.metrics.settlementSummary`   | `GET /api/dashboard/settlements`     | MoF/bank-liaison authorized role          |
| Regional/sector aggregate | `ovds.metrics.aggregateBySector`      | `GET /api/dashboard/aggregates`      | MoF aggregate role                        |

Dashboard queries must use precomputed or cached aggregate projections where possible. They must not scan raw taxpayer records for every request. Responses should include period, currency, aggregation level, source freshness, and suppression rules for small cohorts.

## 8. Backend architecture

### 8.1 NestJS module responsibilities

`apps/backend/src/app.module.ts` imports the main feature modules:

- `AuthModule` and security guards
- `SalesModule`, `PurchasesModule`, `ItemsModule`, and `CrmModule`
- `BankingModule` and payment gateway
- `LedgerModule` and accounting domain services
- `TaxModule`, `EimsModule`, and OVDS facade
- `ComplianceModule`, `AccreditationModule`, and `CyberAuditModule`
- `ProjectsModule`, `TradeModule`, and reporting-related features
- `PlatformModule`, `NotificationsModule`, and `MonetizationModule`
- `AuditLogModule` and `SecurityModule`

The global guard order is:

1. `CustomThrottlerGuard`
2. `StatusCodeAbuseGuard`
3. `PermissionsGuard`
4. `ModuleSubscriptionGuard`

`ZodValidationPipe` and `HttpExceptionFilter` are registered globally. Redis and BullMQ are enabled only when `REDIS_ENABLED=true`.

### 8.2 Transaction and event boundaries

- Synchronous document creation and ledger posting use `Prisma.$transaction`.
- External calls to MoR, Telebirr, banks, and notification providers must not block a financial commit.
- Outbox-style events or domain events should be published after the transaction commits.
- Retryable integrations use idempotency keys and persisted job state.
- A failed external acknowledgement leaves the local record in a recoverable pending state; it must not silently become settled.

### 8.3 VAT engine

The VAT core is intentionally framework-independent:

- Interface and orchestration: `packages/core/src/vat/vat-rule-engine.ts`
- Module registry: `packages/core/src/vat/vat-module-registry.ts`
- Ethiopia implementation: `packages/modules/tax/src/countries/et/et-vat-rule-engine.ts`
- Filing persistence: `VatFilingRecord`, `VatFilingEvent`, and `VatReportArtifact`

The Ethiopia engine currently defines:

- 15% standard rate
- zero-rated exports and qualifying supplies
- exempt categories
- imported-service reverse charge
- ETB reporting and date validation
- withholding and fiscal-device checks where applicable

The frontend can display a preview, but the backend must recalculate and validate every submitted line.

## 9. Security, identity, and authorization

### 9.1 RBAC and ABAC

The shared RBAC implementation is under `packages/shared/src/rbac`:

- 22 roles are defined in `packages/shared/src/types/roles.ts`.
- The role hierarchy and permission map are in `role-permissions.ts`.
- Granular permissions are defined in `permissions.ts`.
- Contextual rules in `contextual-rules.ts` currently gate selected actions by amount, status, company, and role; the shared context type also reserves department, time, and ownership fields for future rules.
- `Company.securityPolicy` stores tenant-specific ABAC policy, including IP allowlists, allowed hours, MFA requirements, and sensitive-permission overrides.

Relevant roles include `OVDS`, `ACCOUNTING`, `FINANCE`, `AUDITOR`, `EXTERNAL_AUDITOR`, `BANK_LIAISON`, `COMPLIANCE`, `ADMIN`, `SUPERADMIN`, and `SPURADMIN`.

### 9.2 Request and deployment security

The backend applies:

- JWT authentication and role/permission guards
- CSRF protection
- input sanitization
- tenant subdomain resolution and request-context interception
- rate limiting and abuse detection
- security headers, including CSP nonce, HSTS, frame denial, and no-sniff behavior
- request-body limits
- honeypot and IP-block controls
- secret-backed JWT, EIMS, offline, and payment configuration
- optional Swagger exposure only in non-production or explicitly enabled environments

Security automation is available through the ZAP scripts, security workflows, readiness checks, dependency checks, and secret scans defined in `package.json` and `.github/workflows`.

### 9.3 Cryptography

#### Telebirr and bank webhooks

`apps/backend/src/payment-gateway/telebirr-crypto.service.ts` uses:

- HMAC-SHA256 signatures with constant-time comparison
- AES-256-GCM encryption with a random IV and authentication tag
- SHA-256 payload hashing
- base64 envelopes containing IV, tag, and ciphertext

The configuration currently uses `TEBIRR_*` environment names in the service. Deployment documentation and environment templates should standardize these names before production rollout.

#### MoR EIMS

`apps/backend/src/eims/` handles:

- per-company MoR clients
- bearer-token lifecycle
- invoice and bulk registration
- cancellation and verification
- per-company signing material
- RSA-SHA512 signature verification when enabled
- idempotency by invoice ID and MoR conversation ID
- acknowledgement persistence in `MorAcknowledgementReceipt`

The EIMS private key and certificate must remain company-scoped and must never be selected from a global default.

#### Offline packages

The offline design uses a canonical payload plus:

- SHA-256 checksum
- device ID and registration state
- idempotency key
- operation type and expiry
- asymmetric signature or authority-approved certificate verification
- AES-256-GCM confidentiality envelope when encryption is required
- dual-node verification after import

AES-256-CBC must not be used for new offline packages because it lacks built-in authentication.

## 10. Offline resilience and physical-media handshake

### 10.1 Current repository capabilities

The current schema and contracts provide the foundation for disconnected operation:

- `OfflineInvoiceQueue` stores invoice/bill payloads and retry state.
- `OfflineDeviceRegistry` tracks enrolled devices.
- `SyncQueue` and `SyncQueueEntrySchema` provide operation, checksum, idempotency, engine, and expiry metadata.
- `DualNodeVerification` compares expected and actual balances.
- `VerifiedLedgerState` preserves verification evidence.
- `apps/frontend/src/services/offlineQueue.ts` supports frontend queue behavior.
- `packages/contracts/src/schemas/sync.ts` defines queue, conflict, reconciliation, and device contracts.

### 10.2 Physical-media adapter

A physical flash-drive or SD-card workflow is a proposed adapter around the existing sync model:

```text
Disconnected company node
  -> create local operation
  -> persist canonical JSON and checksum
  -> sign with enrolled device/company key
  -> encrypt with AES-256-GCM
  -> write manifest and package to removable media
  -> import at tax station or connected OVDS node
  -> verify signature, checksum, device registration, and expiry
  -> apply idempotency key
  -> post ledger/filing events transactionally
  -> write dual-node verification and acknowledgement
  -> return signed import receipt to the removable-media package
```

The manifest should contain schema version, package ID, company ID, device ID, creation time, record count, checksum, signature algorithm, encryption algorithm, and idempotency keys. It must not contain plaintext private keys or reusable authentication tokens.

The physical-media adapter should be implemented as a separate package with explicit file-format versioning and tests for corruption, replay, wrong-device import, key rotation, and partial batches.

## 11. AABE, external audit, and statutory evidence

### 11.1 Audit model

- `AuditFirm` identifies the external firm and license.
- `AuditEngagement` defines scope, risk, status, dates, company, and report summary.
- `AuditFinding` records severity, owner, due date, resolution, and evidence.
- `AuditLog` records security and business actions with company and actor context.
- `AccreditationChecklist` and `AccreditationItem` preserve AABE/MoR accreditation evidence.
- `VandvSubmission` records validation and verification submissions.

Audit evidence should be immutable after certification. Corrections create a new version or amendment event and retain the prior artifact.

### 11.2 AABE readiness gates

Before a filing or financial statement is marked ready for authority submission, the system should verify:

- balanced ledger and period close
- VAT rate and exemption decisions
- EIMS invoice registration and acknowledgement status
- audit findings and unresolved exceptions
- accreditation checklist evidence
- retention and access-policy requirements
- authorized reviewer and certification identity

These gates can be implemented as workflow tasks and reporting checks before being promoted to hard database constraints.

## 12. Frontend and localization

### 12.1 Application structure

`apps/frontend` is the primary taxpayer and authority-facing web application. It uses:

- React 19 and Vite 6
- Refine for data-provider and resource workflows
- TailwindCSS and shared UI primitives
- i18next with browser language detection
- Workbox/PWA service-worker registration in production
- oRPC React Query clients for domain operations
- role-scoped navigation and module entitlements

`apps/portal` is a smaller client portal for invoice, payment, and profile workflows. A future `apps/authority` application can reuse the same contracts and UI packages while enforcing a separate authority shell and data-minimization policy.

### 12.2 Languages

The frontend supports:

- English (`en`)
- Amharic (`am`)
- Tigrinya (`ti`)

Translation resources are split by domain under `apps/frontend/src/i18n/`. English is loaded eagerly; Amharic and Tigrinya resources are loaded lazily on first use. VAT, invoice, navigation, tax, HR, IFRS, business-registration, toast, and common UI labels have localized resource sections.

Client-side VAT calculations are previews only. The server response is authoritative and must be rendered after validation.

### 12.3 Taxpayer declaration UI requirements

The declaration UI should provide:

- company/TIN context selected from the authenticated session
- reporting period and fiscal-year validation
- line-item quantity, unit price, discount, HS code, tax treatment, and localized description
- server-derived VAT preview after validation
- input VAT, output VAT, payable/refundable summary
- draft/save/submit/amend states
- internal-review and external-audit status
- EIMS acknowledgement and filing receipt
- offline queue status and retry/conflict resolution
- accessible labels and keyboard navigation in all three languages

## 13. Reporting and Ministry dashboards

### 13.1 Current reporting path

`packages/domains/reporting/src/lib/report.service.ts` builds Ethiopian IFRS statements and a MoR submission package from accounting, payroll, VAT, and withholding data. It uses shared builders for:

- income statement
- balance sheet
- cash-flow statement
- equity statement
- Schedule A
- IFRS notes
- MoR submission package

`apps/backend/src/dashboard/dashboard.controller.ts` provides authenticated aggregate dashboard adapters for operational and strategic metrics.

### 13.2 Ministry of Finance projection model

Ministry dashboards should read from aggregate projections rather than raw operational tables. A projection should contain:

- period and fiscal-year key
- geographic/sector aggregation key
- currency and exchange-rate basis
- output VAT, input VAT, payable, refundable, and filing status
- EIMS registered, acknowledged, rejected, and failed counts
- audit-ready, externally audited, AABE-certified, and MoR-submitted counts
- settlement volume by bank/Telebirr and reconciliation status
- offline queue age, failure rate, and last successful sync
- data freshness and suppression flags

Access policy must separate taxpayer-level MoR operations from MoF aggregate analytics. Record-level taxpayer data should be unavailable to MoF views unless a specific legal workflow grants it.

## 14. Deployment and operations

### 14.1 Compose and container targets

- `docker-compose.ovds.yml`: MySQL, backend, frontend, health checks, resource limits, and audit-chain initialization.
- `docker-compose.cloud.yml`: PostgreSQL, Redis, cloud API profile, internal database network, and SaaS deployment settings.
- `docker-compose.onpremise.yml`: SQLite single-tenant API profile and persistent local ledger volume.
- `docker-compose.scale.yml` and `docker-compose.security.yml`: scaling and security-tooling profiles.
- `apps/backend/Dockerfile` and `apps/frontend/Dockerfile`: backend and static frontend images.

The standard local stack can be started with:

```bash
docker compose -f docker-compose.ovds.yml up --build
```

The provider caveat in section 6 applies to the cloud and on-premise compose files.

### 14.2 Required environment groups

- Database: `PRISMA_DATABASE_URL`, provider-specific URL, migration mode
- Deployment: `DEPLOYMENT_MODE`, `PORT`, `API_PREFIX`, `CORS_ORIGIN`
- Identity: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Queue: `REDIS_ENABLED`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- EIMS: API URL, client credentials, TIN/system identity, certificate and private-key references, signature-verification flag
- Offline: public key, queue size, retry limits, package retention
- Payments: Telebirr merchant/API/secret/base/callback/webhook configuration
- Security: Swagger flag, error-detail flag, throttle and abuse limits

Secrets must be supplied by the deployment environment or secret manager and must not be committed.

### 14.3 CI and operational gates

The repository includes workflows for cloud deployment, on-premise builds, documentation, architecture checks, dependency optimization, security testing, and ZAP scans. A release should require:

1. contract and Prisma generation
2. backend/frontend type checks
3. lint and targeted tests
4. Prisma validation and migration review
5. tenant-isolation tests
6. EIMS/offline/payment cryptographic tests
7. security headers, authentication, authorization, and input-validation scans
8. compose smoke test for the selected provider profile

## 15. Development workflow

### 15.1 Contract-first change sequence

1. Add or update the domain model in `packages/database/prisma/schema.prisma`.
2. Run Prisma generation and the Zod generator.
3. Add or update composed schemas in `packages/contracts/src/schemas`.
4. Add or update the shared oRPC procedure in the appropriate router as the target contract.
5. Implement the backend behavior in the owning NestJS REST module now; add the matching oRPC handler when backend oRPC wiring is enabled.
6. Add the frontend REST client/page or oRPC client once the server adapter exists.
7. Add tenant, authorization, idempotency, and rollback tests.
8. Add migration and documentation updates.

### 15.2 Quality commands

Use the scripts defined in `package.json` rather than ad hoc commands:

```bash
npm run db:generate
npm run db:generate:zod
npm run typecheck
npm run lint
npm test
npm run security:check
npm run security:zap:validate
```

Use `npm run check:arch` for architecture checks and the relevant Nx project commands for targeted validation.

## 16. Extension roadmap

The following items are explicit architectural extensions rather than claims about the current implementation:

1. Split Prisma provider configuration into reproducible MySQL, PostgreSQL, and SQLite build profiles.
2. Wire `appContract` into the NestJS backend and expose the matching `/api/rpc` adapter; verify that frontend oRPC calls have a server implementation.
3. Add the physical-media offline package adapter and signed import receipt format.
4. Add dedicated `AssetTransfer`, `IntellectualPropertyRight`, `InheritanceDistribution`, and `LiquidationCase` models with legal evidence and balanced accounting events.
5. Extract authority-specific UI into `apps/authority` or a role-scoped authority shell using the same oRPC contracts.
6. Implement the proposed Ministry of Finance aggregate procedures and cached projections.
7. Standardize Telebirr environment variable names and add configuration startup validation.
8. Promote logical review states into a versioned workflow state machine with immutable transitions.
9. Add authority data-retention, legal-hold, and export controls for audit and accreditation evidence.

## 17. Reference index

### Core architecture

- `apps/backend/src/main.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/orpc/orpc.module.ts` — current oRPC module registration; backend contract handlers are a roadmap item
- `packages/contracts/src/router/index.ts`
- `packages/contracts/src/schemas/`
- `packages/database/prisma/schema.prisma`
- `packages/database/src/tenant-prisma.client.ts`
- `packages/database/src/tenant-context.middleware.ts`

### VAT, tax, and authority

- `packages/core/src/vat/`
- `packages/modules/tax/src/countries/et/`
- `apps/backend/src/eims/`
- `apps/backend/src/tax/`
- `packages/contracts/src/router/eims.ts`
- `packages/contracts/src/schemas/eims.ts`
- `packages/shared/src/ovds/`

### Accounting, audit, and reporting

- `packages/domains/double-entry/`
- `packages/domains/reporting/`
- `packages/features/double-entry/`
- `packages/features/workflow/`
- `apps/backend/src/ledger/`
- `apps/backend/src/settings/accreditation/`
- `apps/backend/src/audit-log/`

### Offline and payments

- `packages/contracts/src/schemas/sync.ts`
- `apps/backend/src/platform/offline.controller.ts`
- `apps/backend/src/platform/sync.controller.ts`
- `apps/frontend/src/services/offlineQueue.ts`
- `apps/backend/src/payment-gateway/`

### Security and deployment

- `packages/shared/src/rbac/`
- `apps/backend/src/common/security-headers.middleware.ts`
- `apps/backend/src/auth/guards/`
- `docker-compose.ovds.yml`
- `docker-compose.cloud.yml`
- `docker-compose.onpremise.yml`
- `.github/workflows/`
- `scripts/zap-*`

## 18. Canonicality rule

When this document conflicts with generated code, the running implementation and its tests are authoritative for current behavior. When a proposed extension is not yet implemented, it must be labeled as a roadmap item and added through the contract-first workflow in section 15 before being treated as an API or database guarantee.
