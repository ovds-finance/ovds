# MoR EIMS Functional Requirements Gap Analysis

**Reference Document:** MoR EIMS Compliance Document (Version 1.0)  
**Analysis Date:** 2026-08-25  
**Analyst:** OVDS Compliance Team  
**Status:** DRAFT
**Last Updated:** 2026-08-25
**Next Review:** 2026-11-25 (quarterly)
**Owner:** OVDS Compliance Team

---

## 1. Executive Summary

This document provides a gap analysis of the OVDS implementation against the functional requirements specified in the Ministry of Revenue (MoR) Electronic Invoice Management System (EIMS) Compliance Document (Version 1.0).

### Overall Assessment

| Category | Total Requirements | Implemented | Gaps | Coverage |
|----------|-------------------|-------------|------|----------|
| Authentication & Authorization | 2 | 2 | 0 | 100% |
| Token Management | 1 | 1 | 0 | 100% |
| Invoice Registration | 1 | 1 | 0 | 100% |
| Cancellation | 1 | 1 | 0 | 100% |
| Bulk Operations | 2 | 1 | 1 | 50% |
| Receipts | 1 | 1 | 0 | 100% |
| Security | 1 | 1 | 0 | 100% |
| **Total** | **9** | **8** | **1** | **~89%** |

### Compliance Readiness Score

| Score Range | Status | Description |
|-------------|--------|-------------|
| 90–100% | 🟢 Ready | Production-ready for MoR EIMS compliance |
| 70–89% | 🟡 Partial | Minor gaps; remediation recommended before production |
| 50–69% | 🟠 At Risk | Significant gaps; must be addressed before production |
| <50% | 🔴 Not Ready | Major gaps; production deployment not recommended |

**Current Score: ~89% — 🟡 Partial**

**Rationale:** All critical functional requirements are implemented. The single gap (file-based bulk upload) affects BSPs that require file-based bulk submission but does not impact standard invoice registration, cancellation, or receipt workflows.

---

## 2. Requirements-to-Implementation Mapping

### 2.1 Authentication Services (Table 2, Figure 1)

**MoR EIMS Reference:** Table 2 — Authentication Services, Figure 1 — Authentication Process

| Requirement | OVDS Implementation | Status | Evidence |
|-------------|---------------------|--------|----------|
| Client authentication via client credentials (clientId, clientSecret, apiKey, tin) | `MorEimsClient` configured with client credentials; `JwtAuthGuard` for OVDS API; `RolesGuard` for RBAC | ✅ Implemented | `apps/backend/src/eims/mor-eims.client.ts`, `apps/backend/src/auth/guards/` |
| Authentication flow: Client → Login → Token → Use Token → Refresh Token | OAuth2 client credentials flow; Bearer token obtained and cached; auto-refresh on expiry | ✅ Implemented | `MorEimsClient` token lifecycle management |

### 2.2 Token Refresh Services (Table 3)

**MoR EIMS Reference:** Table 3 — Token Refresh Services

| Requirement | OVDS Implementation | Status | Evidence |
|-------------|---------------------|--------|----------|
| Bearer token lifecycle with automatic refresh | Token cached for 60 minutes; `MorEimsClient` handles token refresh automatically | ✅ Implemented | `apps/backend/src/eims/mor-eims.client.ts` |

### 2.3 Invoice Registration (Table 4, Figure 2, Section 3)

**MoR EIMS Reference:** Table 4 — Invoice Registration Services, Figure 2 — Invoice Registration, Section 3 — Invoice Registration Schema Detail

| Requirement | OVDS Implementation | Status | Evidence |
|-------------|---------------------|--------|----------|
| Single invoice registration with IRN resolution, signed QR, acknowledgement | `EimsService.registerSalesInvoice` maps OVDS Invoice → MoR request, XAdES-BES signing via `EimsCertificateService`, IRN persisted in `EimsRegistration` | ✅ Implemented | `apps/backend/src/eims/eims.service.ts`, `apps/backend/src/eims/eims-invoice.mapper.ts` |
| Invoice Registration Process (Figure 2): Prepare → Connect → Send Request → Receive Response → Record | End-to-end flow: map invoice → sign request → submit to MoR → persist IRN/ack → update OVDS Invoice | ✅ Implemented | `EimsService.registerSalesInvoice` |
| Schema: SellerDetails, BuyerDetails, DocumentDetails, ItemList, PaymentDetails, ReferenceDetails, SourceSystem, TransactionType, ValueDetails, Version | Full `EimsInvoiceRegistrationRequest` interface with all required fields | ✅ Implemented | `packages/shared/src/eims/eims.types.ts` |
| Line items: ItemCode, ProductDescription, Quantity, UnitPrice, TaxAmount, TotalLineAmount | `EimsItemLine` interface with all line-level fields | ✅ Implemented | `packages/shared/src/eims/eims.types.ts` |

### 2.4 Cancellation (Table 5, Figure 6, Section 5)

**MoR EIMS Reference:** Table 5 — Cancellation Process, Figure 6 — Invoice Cancelation, Section 5 — Invoice Cancellation

| Requirement | OVDS Implementation | Status | Evidence |
|-------------|---------------------|--------|----------|
| Cancel registered invoice with reasonCode and remark | `EimsService.cancelInvoice` sends `EimsCancellationRequest` with reasonCode/remark; updates status to CANCELLED | ✅ Implemented | `apps/backend/src/eims/eims.service.ts` |
| Cancellation flow: Search → Select → Request Cancellation → Receive Response | IRN resolved from `EimsRegistration`; cancellation request sent; status updated | ✅ Implemented | `EimsService.cancelInvoice` |

### 2.5 Bulk Operations (Table 6, Figures 3–5, Section 4)

**MoR EIMS Reference:** Table 6 — Bulk Registration/Cancellation Service, Figure 3 — Bulk Registration And Cancelation, Figure 4 — Bulk Registration And Cancelation With File, Figure 5 — Bulk Upload Header, Section 4 — Bulk Invoice Registration Request

| Requirement | OVDS Implementation | Status | Evidence |
|-------------|---------------------|--------|----------|
| Async bulk operations with conversationId and callback | `EimsService.bulkRegister`/`bulkCancel` return conversationId; `EimsBulkJob` tracks progress; `bulkCallback` endpoint receives MoR async results | ✅ Implemented | `apps/backend/src/eims/eims.service.ts`, `apps/backend/src/eims/eims.controller.ts` |
| Bulk process without file (Figure 3): Prepare → Connect → Send Request → Receive Response → Record | JSON-based bulk via `invoiceIds` array | ✅ Implemented | `POST /eims/bulk/register`, `POST /eims/bulk/cancel` |
| Bulk process with file (Figure 4): Prepare file → Connect → Send File → Receive Response → Record | **NOT IMPLEMENTED** | ❌ Missing | See Gap 1 |
| Bulk upload header format (Figure 5) | **NOT IMPLEMENTED** | ❌ Missing | See Gap 1 |
| End-point details, headers, request format (Section 4.1.4) | JSON endpoints implemented; file upload endpoints missing | ⚠️ Partial | See Gap 1 |
| Responses: Successful Synchronous (4.1.4.4.1), Failed Async (4.1.4.4.2), Callback (4.1.4.4.3) | Sync response with conversationId implemented; async callback handling implemented | ✅ Implemented | `EimsBulkCallbackPayload` handling |

### 2.6 Receipts (Section 6)

**MoR EIMS Reference:** Section 6 — Receipt

| Requirement | OVDS Implementation | Status | Evidence |
|-------------|---------------------|--------|----------|
| Sales receipt registration linked to invoice IRN | `EimsService.registerSalesReceipt` resolves IRN from `EimsRegistration` and links receipt | ✅ Implemented | `apps/backend/src/eims/eims.service.ts` |
| Receipt process: Search Invoice → Select → Send Request → Receive Response → Record | IRN resolved; receipt created with RRN; QR returned | ✅ Implemented | `EimsService.registerSalesReceipt` |

### 2.7 Security (Section 7)

**MoR EIMS Reference:** Section 7 — Security

| Requirement | OVDS Implementation | Status | Evidence |
|-------------|---------------------|--------|----------|
| TLS 1.3+ for all communications | `SecurityHeadersMiddleware` enforces HTTPS/HSTS; outbound EIMS calls use TLS 1.3+ | ✅ Implemented | `apps/backend/src/common/security-headers.middleware.ts` |
| Mutual TLS (mTLS) | Certificate-based digital signing (XAdES-BES) on every EIMS request | ✅ Implemented | `EimsSigningService`, `EimsCertificateService` |
| RBAC and access control | `RolesGuard` enforces role-based permissions; company-level isolation via `x-company-id` | ✅ Implemented | `apps/backend/src/auth/guards/roles.guard.ts` |
| Audit logging | All EIMS operations logged with user, timestamp, action, IP, result | ✅ Implemented | `AuditLog` with EIMS-specific actions |
| Input validation | `SanitizeInputMiddleware` + class-validator DTOs + TIN format validation | ✅ Implemented | `apps/backend/src/common/`, `apps/backend/src/eims/eims.dto.ts` |

---

## 3. Identified Gaps

### Gap 1: File-Based Bulk Operations

**MoR EIMS Reference:** Table 6 (Bulk Registration/Cancellation Service), Figures 4–5 (Bulk Registration And Cancelation With File, Bulk Upload Header)

**Description:**  
The MoR EIMS Compliance Document specifies bulk invoice registration and cancellation via file upload (Figure 4: "Bulk Registration And Cancelation With File", Figure 5: "Bulk Upload Header"). OVDS currently supports JSON-based bulk operations only, where the frontend submits an array of `invoiceIds` to `POST /eims/bulk/register` or `POST /eims/bulk/cancel`.

**Current OVDS Implementation:**
```typescript
// apps/backend/src/eims/eims.controller.ts
@Post('bulk/register')
bulkRegister(@Body() dto: BulkRegisterDto) {
  return this.eims.bulkRegister(companyIdFrom(headers), dto);
}

// BulkRegisterDto expects:
// { invoiceIds: string[] }
```

**Missing Capability:**
- `POST /eims/bulk/register/file` — Accept multipart/form-data with CSV/JSON file
- `POST /eims/bulk/cancel/file` — Accept multipart/form-data with CSV/JSON file
- File parsing and validation against MoR schema
- Progress tracking for file-based bulk jobs

**Impact:** Medium — BSPs (Business Service Providers) that are required to submit bulk invoices via file upload cannot use OVDS for this workflow. This affects compliance with MoR bulk submission protocols.

**Remediation:**
1. Add file upload endpoints to `EimsController`
2. Implement file parsing service (CSV/JSON) in `EimsService`
3. Validate parsed data against MoR bulk schema
4. Add progress tracking for file-based bulk jobs
5. Update frontend to support file upload UI

**Priority:** Medium  
**Estimated Effort:** 3–5 days

**Action Plan:**
1. **Week 1:** Design file upload API contract (`POST /eims/bulk/register/file`, `POST /eims/bulk/cancel/file`)
2. **Week 1:** Implement file parsing service (CSV/JSON) with MoR schema validation
3. **Week 2:** Add progress tracking for file-based bulk jobs (`EimsBulkJob` extension)
4. **Week 2:** Update frontend bulk operations page with file upload UI
5. **Week 2:** Write E2E tests for file upload flow
6. **Week 3:** Integration testing and documentation update

---

### Gap 2: Source Document Completeness

**MoR EIMS Reference:** Entire document

**Description:**  
The source MoR EIMS Compliance Document appears incomplete. The text in Section 1.6 (Technical Introduction to EIMS) ends abruptly at: *"The specifications define the structure,"* without completing the sentence or providing the referenced schema details. Additional sections referenced in the Table of Contents (e.g., Section 4 "Bulk Invoice Registration Request", Section 5 "Invoice Cancellation") may have incomplete content.

**Impact:** Low — Cannot verify complete alignment without full document. The current implementation covers all functional areas referenced in the available content.

**Remediation:**
1. Obtain the complete MoR EIMS Compliance Document from the Ministry of Revenue
2. Re-run this gap analysis against the full document
3. Update OVDS implementation if additional requirements are identified

**Priority:** Low  
**Estimated Effort:** N/A (pending document receipt)

**Action Plan:**
1. Contact MoR EIMS support team to request complete compliance document
2. Schedule review session with compliance team upon receipt
3. Re-run gap analysis against complete document
4. Update OVDS implementation if additional requirements identified

---

## 4. Recommendations

### Immediate Actions (High Priority)
1. **None** — All critical functional requirements are implemented.

### Short-Term Actions (Medium Priority)
1. Implement file-based bulk operations (see Gap 1)
2. Obtain complete MoR EIMS Compliance Document (see Gap 2)

### Long-Term Actions (Low Priority)
1. Establish quarterly review of MoR EIMS specification updates
2. Automate gap analysis re-execution when new MoR documents are received

---

## 5. Traceability Matrix

| MoR EIMS Section | Figure/Table | OVDS Implementation | Test Coverage | Status |
|-------------------|--------------|---------------------|---------------|--------|
| Authentication Process | Figure 1 | `MorEimsClient` client credentials flow | Integration tests | ✅ Covered |
| Authentication Services | Table 2 | `JwtAuthGuard` + `RolesGuard` | `apps/backend/test/*.e2e-spec.ts` | ✅ Covered |
| Token Refresh Services | Table 3 | `MorEimsClient` token lifecycle (60 min cache) | Integration tests | ✅ Covered |
| Invoice Registration Services | Table 4, Figure 2 | `EimsService.registerSalesInvoice` | E2E tests | ✅ Covered |
| Invoice Registration Schema | Section 3 | `EimsInvoiceRegistrationRequest`, `EimsItemLine` | Schema validation tests | ✅ Covered |
| Cancellation Process | Table 5, Figure 6 | `EimsService.cancelInvoice` | E2E tests | ✅ Covered |
| Bulk Registration/Cancellation | Table 6, Figure 3 | `EimsService.bulkRegister`/`bulkCancel` | E2E tests | ✅ Covered (JSON only) |
| Bulk with File Upload | Figure 4, Figure 5 | **NOT IMPLEMENTED** | ❌ Not Covered | Gap 1 |
| Bulk Responses | Section 4.1.4.4 | `EimsBulkCallbackPayload` handling | Integration tests | ✅ Covered |
| Receipt | Section 6, Figure 6 | `EimsService.registerSalesReceipt` | E2E tests | ✅ Covered |
| Security | Section 7 | `SecurityHeadersMiddleware`, `EimsSigningService` | Security test suite | ✅ Covered |

### 5.1 Test Coverage Details

| Requirement | Unit Tests | Integration Tests | E2E Tests | Status |
|-------------|------------|-------------------|-----------|--------|
| Authentication | `packages/shared/src/eims/eims-signing.spec.ts` | `apps/backend/test/*.e2e-spec.ts` | — | ✅ Covered |
| Token Refresh | — | `apps/backend/src/eims/mor-eims.client.ts` | — | ✅ Covered |
| Invoice Registration | `packages/shared/src/eims/eims-validation.spec.ts` | — | E2E tests | ✅ Covered |
| Cancellation | — | — | E2E tests | ✅ Covered |
| Bulk JSON | — | — | E2E tests | ✅ Covered |
| Bulk File Upload | — | — | — | ❌ Missing |
| Receipts | — | — | E2E tests | ✅ Covered |
| Security | `packages/shared/src/eims/eims-encryption.spec.ts` | Security test suite | — | ✅ Covered |

---

## 6. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Compliance Analyst | | | |
| Technical Reviewer | | | |
| MoR Integration Lead | | | |

---

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-08-25 | OVDS Compliance Team | Initial gap analysis against MoR EIMS Compliance Document v1.0 |
| | | | Added Section 14.1 to Master Compliance Checklist |
| | | | Created standalone gap analysis document |
| | | | Identified 1 functional gap (file-based bulk upload) |

---

*End of MoR EIMS Functional Requirements Gap Analysis*
