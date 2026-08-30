# OVDS SaaS — Enterprise Technical Architecture Blueprint

## Ethiopian Ministry of Revenues (MoR) Electronic Invoice Information Management System (EIMS) Integration

**Version:** 1.0.0  
**Status:** Official Enterprise Blueprint  
**Date:** 2026-08-24

---

## 1. Executive Summary

This document defines the official enterprise technical architecture for OVDS SaaS integration with the Ethiopian Ministry of Revenues (MoR) Electronic Invoice Information Management System (EIMS). It serves as the authoritative reference for data mapping, compliance protocols, and enterprise module integration patterns.

---

## 2. Architecture Overview

### 2.1 Integration Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OVDS Enterprise SaaS Platform                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Sales Module │  │Purchase Module│  │Accounting Core│  │Tax Module    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │              │
│         └─────────────────┼─────────────────┼─────────────────┘              │
│                           │                 │                               │
│                    ┌──────▼─────────────────▼───────┐                       │
│                    │   EIMS Bridge Service Layer     │                       │
│                    │   (NestJS + Supabase Edge)       │                       │
│                    └──────┬─────────────────┬───────┘                       │
│                           │                 │                               │
│         ┌─────────────────┘                 └─────────────────┐             │
│         │                                                       │             │
│  ┌──────▼──────────┐                                   ┌──────▼──────────┐  │
│  │ Data Mapping    │                                   │ Compliance      │  │
│  │ Registry        │                                   │ Ledger          │  │
│  └─────────────────┘                                   └─────────────────┘  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MoR EIMS API (core.mor.gov.et / etax.erca.gov.et)         │
│                    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│                    │ Invoice Reg  │  │Receipt Reg   │  │ Cancel/Verify│    │
│                    │ /api/v1/...  │  │ /api/v1/...  │  │ /api/v1/...  │    │
│                    └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Components

| Component | Responsibility | Location |
|-----------|---------------|----------|
| EimsService (authoritative) | MoR API client, request signing, IRN resolution, retry logic, RBAC enforcement | `apps/backend/src/eims/` |
| MorEimsClient | HTTPS client with JWT auth, certificate-based request signing (XAdES-BES), token lifecycle | `apps/backend/src/eims/mor-eims.client.ts` |
| EimsController | REST endpoints (`POST /eims/invoices/:id/register`, `POST /eims/bulk/register`, etc.) | `apps/backend/src/eims/eims.controller.ts` |
| eims-invoice.mapper.ts | Pure field-level mapper: OVDS Invoice → MoR `EimsInvoiceRegistrationRequest` | `apps/backend/src/eims/eims-invoice.mapper.ts` |
| Supabase Bridge (fallback) | Lightweight edge function proxy for direct browser-to-MoR scenarios; does not persist ledger entries | `supabase/functions/mor-eims-bridge/index.ts` |
| Compliance Ledger | Audit trail for all MoR submissions | `prisma: EimsRegistration, EimsCertificate, EimsBulkJob, EimsSourceSystem` |
| Enterprise Modules | Sales, Purchases, Accounting, Tax | `apps/backend/src/{ovds}/` |

---

## 3. Data Mapping Registry

### 3.1 Invoice Registration Mapping

#### OVDS Invoice → MoR Invoice Request

| OVDS Field | Prisma Model | MoR Field | Type | Transform |
|------------|-------------|-----------|------|-----------|
| `invoiceNumber` | Invoice.invoiceNumber | DocumentDetails.DocumentNumber | string | Direct |
| `invoiceDate` | Invoice.date | DocumentDetails.Date | string | ISO → YYYY-MM-DD |
| `status` | Invoice.status | TransactionType | enum | PAID→SALE, DRAFT→DRAFT |
| `company.tin` | Company.tin | SellerDetails.Tin | string | Validate 10-digit |
| `company.name` | Company.name | SellerDetails.LegalName | string | Direct |
| `company.vatNumber` | Company.vatNumber | SellerDetails.VatNumber | string | Direct |
| `customer.name` | Customer.name | BuyerDetails.LegalName | string | Direct |
| `customer.tin` | Customer.tin | BuyerDetails.Tin | string | Validate 10-digit |
| `invoiceItem.description` | InvoiceItem.description | ItemList[].ProductDescription | string | Direct |
| `invoiceItem.quantity` | InvoiceItem.quantity | ItemList[].Quantity | number | Round to 2dp |
| `invoiceItem.unitPrice` | InvoiceItem.unitPrice | ItemList[].UnitPrice | number | Round to 2dp |
| `invoiceItem.vatAmount` | InvoiceItem.vatAmount | ItemList[].TaxAmount | number | Direct |
| `invoice.total` | Invoice.total | ValueDetails.TotalValue | number | Round to 2dp |
| `invoice.subtotal` | Invoice.subtotal | ValueDetails.Discount | number | Direct |
| `currencyCode` | Invoice.currencyCode | ValueDetails.InvoiceCurrency | string | Default ETB |
| `paymentMethod` | Payment.method | PaymentDetails.Mode | enum | normalizePaymentMode() |

### 3.2 Receipt Registration Mapping

#### OVDS Payment → MoR Sales Receipt Request

| OVDS Field | Prisma Model | MoR Field | Type | Transform |
|------------|-------------|-----------|------|-----------|
| `payment.reference` | Payment.reference | ReceiptNumber | string | Direct |
| `payment.date` | Payment.date | ReceiptDate | string | ISO → YYYY-MM-DD |
| `payment.amount` | Payment.amount | CollectedAmount | number | Round to 2dp |
| `payment.method` | Payment.method | TransactionDetails.ModeOfPayment | enum | normalizePaymentMode() |
| `invoice.invoiceNumber` | Invoice.invoiceNumber | Invoices[].InvoiceIRN | string | IRN from registration |
| `invoice.total` | Invoice.total | Invoices[].TotalAmount | number | Round to 2dp |
| `company.tin` | Company.tin | SellerTIN | string | Validate 10-digit |

### 3.3 Cancellation Mapping

| OVDS Field | Prisma Model | MoR Field | Type | Notes |
|------------|-------------|-----------|------|-------|
| `invoice.irn` | Invoice.irn | irn | string | Required for cancellation |
| `cancelReason` | — | reasonCode | enum | USER_CANCELLED, DATA_ERROR, etc. |
| `cancelNote` | — | remark | string | Max 500 chars |

---

## 4. Compliance Ledger Protocols

### 4.1 Submission State Machine

```
DRAFT → PENDING_REGISTRATION → REGISTERED → (ACKNOWLEDGED | FAILED)
                                           ↓
                                      CANCELLED
```

### 4.2 Ledger Models (Prisma)

```prisma
model EimsRegistration {
  id             String           @id @default(uuid())
  invoiceId      String
  companyId      String
  irn            String?          @unique
  status         EimsStatus       @default(PENDING)
  submissionMode String           @default(sandbox) // sandbox | live
  requestBody    String           @db.LongText
  responseBody   String?          @db.LongText
  errorMessage   String?          @db.Text
  retryCount     Int              @default(0)
  submittedAt    DateTime         @default(now())
  acknowledgedAt DateTime?
  company        Company          @relation(fields: [companyId], references: [id])
  invoice        Invoice          @relation(fields: [invoiceId], references: [id])

  @@index([invoiceId])
  @@index([companyId])
  @@index([status])
  @@map("eimsregistration")
}

model EimsCertificate {
  id             String           @id @default(uuid())
  registrationId String
  certificateNo  String           @unique
  type           EimsCertType     @default(REGISTRATION)
  signedQr       String?          @db.Text
  ackDate        DateTime?
  validFrom      DateTime?
  validTo        DateTime?
  status         EimsStatus       @default(ACTIVE)
  companyId      String
  createdAt      DateTime         @default(now())
  company        Company          @relation(fields: [companyId], references: [id])

  @@index([registrationId])
  @@index([companyId])
  @@map("eimscertificate")
}

model EimsBulkJob {
  id             String           @id @default(uuid())
  companyId      String
  type           EimsBulkType     @default(REGISTER)
  status         EimsStatus       @default(PROCESSING)
  totalItems     Int              @default(0)
  processedItems Int              @default(0)
  successCount   Int              @default(0)
  failureCount   Int              @default(0)
  conversationId String?
  startedAt      DateTime         @default(now())
  completedAt    DateTime?
  errorSummary   String?          @db.Text
  company        Company          @relation(fields: [companyId], references: [id])

  @@index([companyId])
  @@index([status])
  @@map("eimsbulkjob")
}

enum EimsStatus {
  PENDING
  PROCESSING
  REGISTERED
  ACKNOWLEDGED
  FAILED
  CANCELLED
  ACTIVE
  EXPIRED
}

enum EimsCertType {
  REGISTRATION
  CANCELLATION
  RECEIPT_SALES
  RECEIPT_WITHHOLDING
}

enum EimsBulkType {
  REGISTER
  CANCEL
}
```

### 4.3 Submission Protocol

1. **Pre-validation**: Validate TIN format (10 digits), VAT number, and required fields before submission
2. **Idempotency**: Store `requestBody` hash; skip duplicate submissions for same invoice
3. **Retry Logic**: Exponential backoff (1s, 2s, 4s) up to 3 retries on network errors
4. **Acknowledgment**: Poll for acknowledgment status; update ledger on receipt
5. **Certificate Storage**: Persist signed QR and acknowledgment date for audit trail
6. **Bulk Operations**: Use conversation-based async processing for batch submissions

---

## 5. Enterprise Module Integration Matrix

### 5.1 Sales → EIMS

| Trigger | Source | Target | Method |
|---------|--------|--------|--------|
| Invoice sent | `sales.controller.ts: POST /sales/invoices/:id/send` | `POST /api/v1/invoices/register` | Sync with retry |
| Invoice cancelled | `sales.controller.ts: POST /sales/invoices/:id/cancel` | `POST /api/v1/invoices/cancel` | Sync |
| Payment received | `purchases.controller.ts: POST payment` | `POST /api/v1/receipts/sales` | Async queue |

### 5.2 Purchases → EIMS

| Trigger | Source | Target | Method |
|---------|--------|--------|--------|
| WHT remitted | `purchases.controller.ts: POST payment` | `POST /api/v1/receipts/withholding` | Async queue |

### 5.3 Accounting → EIMS

| Trigger | Source | Target | Method |
|---------|--------|--------|--------|
| Period close | `fiscal.controller.ts: POST close` | No direct EIMS call | Validation only |

---

## 6. MoR EIMS Bridge Service

### 6.1 Location

- **Edge Function**: `supabase/functions/mor-eims-bridge/index.ts`
- **Backend Wrapper**: `apps/backend/src/eims/eims.controller.ts`
- **Frontend Client**: `apps/frontend/src/services/morApi.ts`

### 6.2 Configuration

Configuration follows a **company-driven** model: the per-company `EimsSourceSystem` record (stored in `EimsSourceSystem` table, status `APPROVED`) provides `systemNumber`, `systemType`, and signing credentials. Address defaults and payment mode are resolved from environment variables only as last-resort fallbacks — all real values are read from the `Company` and `Customer` rows at mapping time.

| Source | Variable/Field | Purpose | Default (last resort) |
|--------|---------------|---------|----------------------|
| Company row | `Company.currencyCode` | Invoice currency | `ETB` (from DB default) |
| Company row | `Company.location` | Seller address | Falls back to env |
| SourceSystem | `EimsSourceSystem.systemNumber` | MoR source system identifier | None — submission rejected if unconfigured |
| SourceSystem | `EimsSourceSystem.systemType` | `ERP\|POS\|MANUAL` | `ERP` |
| Env | `EIMS_DEFAULT_COUNTRY` | Seller/buyer country | `ETHIOPIA` |
| Env | `EIMS_DEFAULT_CURRENCY` | Fallback currency when no company setting | `ETB` |
| Env | `EIMS_DEFAULT_CITY` / `EIMS_DEFAULT_REGION` / `EIMS_DEFAULT_WEREDA` | Seller address fallbacks | `Addis Ababa` / `01` |
| Env | `EIMS_DEFAULT_PAYMENT_MODE` / `EIMS_DEFAULT_PAYMENT_TERM` | Payment defaults | `CASH` / `IMMEDIATE` |
| Env | `EIMS_API_URL` / `EIMS_API_FALLBACK_URL` | MoR API endpoints | Sandbox mode if unset |
| Env | `EIMS_CLIENT_ID` / `EIMS_CLIENT_SECRET` / `EIMS_API_KEY` | Client credentials | Required for live mode |

---

## 7. Security & Access Control

### 7.1 Authentication Flow

```
Client (JWT) → NestJS Backend → Certificate signing → MoR EIMS API (Bearer token)
```

The NestJS backend authenticates with the MoR via client credentials (`clientId`/`clientSecret`/`apiKey`/`tin`), obtaining a Bearer token cached for 60 minutes. Each registration/receipt/cancel request is wrapped in an XAdES-BES signed envelope using the company's private key and certificate before forwarding to the MoR. The Supabase Edge Function (fallback only) uses simpler header-based auth without signing envelopes.

### 7.2 RBAC Matrix

EIMS operations are guarded by dedicated RBAC permissions. The NestJS `EimsController` enforces them via the `RolesGuard`:

| Role | EIMS Permissions | Scope |
|------|------------------|-------|
| SPURADMIN / SUPERADMIN | All EIMS permissions (bypass) | Full system |
| ADMIN | `eims:*` (submit, register, cancel, bulk-cancel, verify, retry, certificates, source_systems, compliance, callback) | Company-wide |
| FINANCE | `eims:submit`, `eims:bulk:submit`, `eims:verify`, `eims:retry`, `eims:compliance`, `eims:callback` | Company-wide |
| ACCOUNTING | `eims:compliance` (read-only dashboard) | Company-wide |

| Permission | Description | Roles |
|------------|-------------|-------|
| `eims:submit` | Register a single invoice or receipt with MoR | ADMIN, FINANCE |
| `eims:bulk:submit` | Bulk-register invoices (async, 202) | ADMIN, FINANCE |
| `eims:cancel` | Cancel a single registered invoice | ADMIN |
| `eims:bulk:cancel` | Bulk-cancel invoices (async, 202) | ADMIN |
| `eims:verify` | Verify an invoice IRN with MoR | ADMIN, FINANCE |
| `eims:retry` | Retry a failed registration | ADMIN, FINANCE |
| `eims:certificates` | Generate CSR, install & submit certificates | ADMIN |
| `eims:source_systems` | Register & approve MoR source systems | ADMIN |
| `eims:compliance` | View compliance dashboard, readiness, checklists | ADMIN, FINANCE, ACCOUNTING |
| `eims:callback` | Handle MoR async callback (webhook-verified) | ADMIN, FINANCE |

> Cancel and bulk-cancel require ADMIN only. Certificate and source-system management requires ADMIN only.

### 7.3 Company-Level Isolation

All EIMS operations are scoped to `companyId`. The `x-company-id` header is validated against the authenticated user's company membership.

---

## 8. IFRS Accounting Integration

### 8.1 Double-Entry Enforcement

Every financial transaction creates matching debit/credit journal lines:

```typescript
// OVDS double-entry pattern
JournalEntry (header)
  ├── JournalLine (DEBIT)  → Account A
  └── JournalLine (CREDIT) → Account B
        sum(debit) == sum(credit) always
```

### 8.2 MoR-Relevant IFRS Mappings

| IFRS Standard | OVDS Model | MoR Requirement |
|---------------|-----------|-----------------|
| IFRS 9 | Invoice, Payment | Revenue recognition timing |
| IFRS 15 | InvoiceItem | Performance obligation tracking |
| IFRS 16 | Lease | Right-of-use asset/liability |
| IFRS 9 | BankTransactionFx | FX gain/loss recognition |
| IAS 2 | Item, StockMovement | Inventory valuation |

### 8.3 Chart of Accounts Structure

The OVDS Chart of Accounts follows IFRS-classified structure:

```
1xxx — Assets (IFRS: Statement of Financial Position)
  11xx — Current Assets
  12xx — Non-current Assets
2xxx — Liabilities
  21xx — Current Liabilities
  22xx — Non-current Liabilities
3xxx — Equity
4xxx — Revenue (IFRS: Statement of Profit or Loss)
5xxx — Cost of Sales
6xxx — Operating Expenses
7xxx — Other Income/Expenses
8xxx — Tax
9xxx — Statistical/Control
```

---

## 9. Error Handling & Resilience

### 9.1 MoR Error Categories

| MoR Error | HTTP Status | OVDS Action | Retry |
|-----------|------------|------------|-------|
| `VALIDATION_ERROR` / `SCHEMA ERROR` | 400 / 422 | Reject locally, log to `AuditLog`, notify user | No |
| `RULE VALIDATION ERROR` | 422 | Business rule violation (e.g. TIN mismatch) | No |
| `VERIFICATION ERROR` | 422 | IRN verification failed | No |
| `NOT_ACCEPTABLE` | 422 | MoR rejected payload (missing fields, duplicate) | No |
| `AUTHENTICATION ERROR` | 401 | Token expired / invalid credentials | Token refresh + retry |
| `DUPLICATE_IRN` | 422 | Idempotent skip — update ledger | No |
| `NETWORK_ERROR` | 502 | Queue for retry | Yes (3x backoff: 1s/2s/4s) |
| `MAINTENANCE` | 503 | Queue, resume on status check | Yes (polling) |
| `RATE_LIMIT` | 429 | Exponential backoff | Yes (up to 60s) |

The `HttpExceptionFilter` (shared by all backend endpoints) distinguishes `MorEimsError` (4xx → 422, 5xx → 502) from generic errors (500). Stack traces are only included in non-production environments.

### 9.2 Fallback Strategy

```
Production EIMS → Network Error → Fallback URL → Queue → Manual Retry
```

---

## 10. Compliance & Audit

### 10.1 Compliance Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| Master Compliance Checklist | EIRMS rollout readiness — functional tests, system-type checks, sign-off | [`compliance/master-compliance-checklist.md`](../../compliance/master-compliance-checklist.md) |
| OF/AEAD/001 Cybersecurity Audit Checklist | INSA device-level security controls — secure boot, firmware, hardware, physical security | [`compliance/of-aead-001-cybersecurity-audit-checklist.md`](../../compliance/of-aead-001-cybersecurity-audit-checklist.md) |
| MoR EIMS Functional Requirements Gap Analysis | Maps MoR EIMS Compliance Document v1.0 requirements to OVDS implementation | [`compliance/mor-eims-gap-analysis.md`](../../compliance/mor-eims-gap-analysis.md) |
| Compliance Status Dashboard | Consolidated compliance status with gap summary, remediation roadmap, and compliance score | [`compliance/compliance-status-dashboard.md`](../../compliance/compliance-status-dashboard.md) |

**Gap Analysis Summary:**
- **Functional Coverage:** ~88% (7 of 8 functional areas fully implemented)
- **Identified Gap:** File-based bulk upload (Figures 4–5) — JSON-only bulk operations currently supported
- **Reference:** Section 14.1 of Master Compliance Checklist for detailed mapping

### 10.2 Compliance Status Matrix

| Requirement Category | Total | Implemented | Gaps | Coverage |
|---------------------|-------|-------------|------|----------|
| Authentication & Token | 3 | 3 | 0 | 100% |
| Invoice Registration | 1 | 1 | 0 | 100% |
| Cancellation | 1 | 1 | 0 | 100% |
| Bulk Operations | 2 | 1 | 1 | 50% |
| Receipts | 1 | 1 | 0 | 100% |
| Security | 1 | 1 | 0 | 100% |
| **Functional Total** | **9** | **8** | **1** | **~89%** |
| OF/AEAD/001 (software-applicable) | 4 | 3 | 1 | 75% |
| **Overall** | **13** | **11** | **2** | **~85%** |

### 10.3 Audit Trail Requirements

- All EIMS submissions logged in `AuditLog` with:
  - `action`: `EIMS_INVOICE_REGISTERED`, `EIMS_INVOICE_CANCELLED`, etc.
  - `userId`: Submitting user
  - `companyId`: Submitting company
  - `details`: Full request/response payload

### 10.4 Data Retention

- EIMS request/response bodies: 7 years (Ethiopian tax law)
- Audit logs: 7 years minimum
- Certificate signed QR: Permanent archive

---

## 11. Deployment Architecture

### 11.1 Environments

| Environment | EIMS Mode | URL |
|-------------|-----------|-----|
| Development | Sandbox | `http://localhost:3000` |
| Staging | Sandbox | `https://staging.ovds.com.et` |
| Production | Live | `https://core.mor.gov.et` |

### 11.2 Network Topology

```
Internet
    │
    ▼
[Cloudflare / WAF]
    │
    ▼
[OVDS Backend — NestJS]
    │
    ├──▶ [Supabase Edge Function — EIMS Bridge]
    │         │
    │         ▼
    │    [MoR EIMS API]
    │
    └──▶ [MariaDB — OVDS Database]
```

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| EIMS | Electronic Invoice Information Management System |
| MoR | Ministry of Revenues (Ethiopia) |
| IRN | Invoice Reference Number (MoR-generated) |
| TIN | Taxpayer Identification Number |
| ACK | Acknowledgment (MoR confirmation) |
| VAT | Value Added Tax |
| WHT | Withholding Tax |
| TOT | Turnover Tax |
| BIT | Business Income Tax |
| IFRS | International Financial Reporting Standards |
| ERCA | Ethiopian Revenues and Customs Authority |
| Proc. 1395/2025 | Federal Income Tax Proclamation No. 1395/2025 |

---

*This document is maintained by the OVDS Architecture Team. Last updated: 2026-08-25*
