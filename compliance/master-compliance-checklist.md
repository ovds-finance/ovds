# MASTER COMPLIANCE CHECKLIST — EIRMS ROLLOUT READINESS

## Document Control

| Field | Value |
|-------|-------|
| Document Version | 1.0 |
| Last Updated | 2026-08-25 |
| Status | DRAFT |
| Applicable System Types | SaaS SP / On-Premises S-POS / Aggregator / Hardware POS |
| Regulatory Authority | Ministry of Revenue (MoR) & INSA |
| Gap Analysis Documents | `compliance/of-aead-001-cybersecurity-audit-checklist.md`, `compliance/mor-eims-gap-analysis.md`, `compliance/compliance-status-dashboard.md` |
| Analysis Owner | OVDS Compliance Team |
| Next Review Date | 2026-11-25 |
| Compliance Score | ~89% (Functional) / ~85% (Overall) |

---

## I. General Information (All System Types)

| Field | Description | Value |
|-------|-------------|-------|
| BSP Name/Taxpayer Name | Legal name of the taxpayer | |
| BSP /Taxpayer TIN | Tax Identification Number | |
| Tax Office/Region | Jurisdiction | |
| Authorized Contact Person | Full name | |
| Contact Phone | Primary number | |
| Email Address | Primary email | |
| Company Registration Number | Trade registration | |
| Testing Location | Physical address | |
| Service/system Type | ☐ SaaS ☐ On-Premises S-POS ☐ Aggregator ☐ Hardware POS | |
| System Name | Name/version | |
| Hosting / Deployment Type | ☐ Cloud ☐ Desktop ☐ Local Server ☐ Device | |
| Version / Build | System version | |
| Tested Environment | ☐ Sandbox ☐ Manual ☐ Production-like | |
| Test Date | Date | |
| Testing Period Start | Start date | |
| Testing Period End | End date | |
| Release Date | Planned release | |
| Currency | ETB / multi-currency | |
| Language | Primary language(s) | |
| Fiscal Year | Current fiscal year | |

---
## OF/AEAD/001 Cybersecurity Audit Alignment

| Field | Value |
|-------|-------|
| Related Document | OF/AEAD/001 — Cybersecurity Audit Requirements |
| Gap Analysis Document | `compliance/of-aead-001-cybersecurity-audit-checklist.md` |
| MoR EIMS Functional Gap Analysis | `compliance/mor-eims-gap-analysis.md` |
| Compliance Status Dashboard | `compliance/compliance-status-dashboard.md` |
| Last Gap Review | 2026-08-25 |
| Gap Status | Open items identified — see below |

### Gap Summary

The Master Compliance Checklist covers functional EIRMS requirements (invoice registration, receipts, cancellations, etc.) but has **significant gaps** in device-level cybersecurity and hardware security controls defined in OF/AEAD/001. Use the dedicated OF/AEAD/001 audit checklist alongside this document for complete compliance coverage.

| Area | OF/AEAD/001 Requirement | This Checklist Coverage | Action |
|------|------------------------|------------------------|--------|
| Secure Boot | Hardware key verification, bypass detection | ❌ Not covered | Use OF/AEAD/001 checklist §4.1 |
| Firmware Integrity | AES-256 encryption, hash validation | ⚠️ Partial | Use OF/AEAD/001 checklist §4.2 |
| Hardware Security | JTAG/UART disable, tamper sensors, shielding | ❌ Not covered | Use OF/AEAD/001 checklist §4.3 |
| Data at Rest | AES-256 for all fiscal data | ⚠️ Partial | Use OF/AEAD/001 checklist §4.4 |
| Secure Communication | TLS 1.3+, mTLS, disable insecure protocols | ⚠️ Partial | Use OF/AEAD/001 checklist §4.5 |
| Access Control | MFA, session management, account lockout | ⚠️ Partial | Use OF/AEAD/001 checklist §4.6 |
| Key Management | HSM provisioning, unique keys, rotation | ❌ Not covered | Use OF/AEAD/001 checklist §4.7 |
| OTA Updates | Signed/encrypted, anti-rollback, logging | ❌ Not covered | Use OF/AEAD/001 checklist §4.8 |
| Device Lockdown | Whitelisting, CLI restriction, least privilege | ❌ Not covered | Use OF/AEAD/001 checklist §4.9 |
| Fiscal Data Protection | WORM, digital signatures, HMAC, time-stamping | ⚠️ Partial | Use OF/AEAD/001 checklist §4.10 |
| Penetration Testing | Physical, network, firmware, API testing | ❌ Not covered | Use OF/AEAD/001 checklist §5.1 |
| Physical Security | Tamper-evident enclosures, secure mounting | ❌ Not covered | Use OF/AEAD/001 checklist §4.12 |
| Compliance Standards | PCI-DSS, ISO 27001, ISO 15408 | ❌ Not covered | Use OF/AEAD/001 checklist §5.2 |

### Remediation Actions

| # | Action | Priority | Owner | Status |
|---|--------|----------|-------|--------|
| 1 | Integrate OF/AEAD/001 cybersecurity checks into rollout readiness | High | Security Team | ☐ Open |
| 2 | Conduct hardware security assessment for all POS/EIM devices | High | Hardware Team | ☐ Open |
| 3 | Verify TLS 1.3+ and mTLS implementation in all system types | High | Dev/Infra Team | ☐ Open |
| 4 | Implement secure boot verification for Hardware POS | Critical | Hardware Team | ☐ Open |
| 5 | Establish OTA update security testing process | Medium | Dev Team | ☐ Open |

---

## Table of Contents

1. Invoice Registration
2. Receipt Registration
3. Cancellation
4. Credit and Debit Memos
5. Negative Tests
6. Notification Service
7. Setup and Configuration
8. Printing Layout and Content
9. Security and Access Control
10. Data Management and Integrity
11. API Integration and Connectivity
12. Performance and Reliability
13. Additional Tests by System Type
14. OF/AEAD/001 Cybersecurity Audit Alignment *(gap analysis & supplementary checklist)*
  14.1 MoR EIMS Functional Requirements Gap Analysis
15. Rental Evidence Table
16. Architectural Model
17. Legal, Compliance and Agreement Requirements
18. Test Summary and Sign-Off

---

## 1. Invoice Registration

### IRC-P01 — B2C Sales Invoice Without Buyer TIN and With VAT

**Description:** Verify successful registration and printing of VAT-inclusive B2C sales invoice.

**Actions:**
1. Prepare sales document with multiple items (VAT0, VAT15, VATEX).
2. Issue invoice.
3. Print full layout invoice.

**Verification:**
1. Scan QR with mobile app.
2. Confirm invoice valid and registered.

**Expected Result:** Invoice registered; IRN and QR printed; QR scannable; details correct in app.

**Test Result:**

| No. | Document No. | IRN | Result |
|-----|-------------|-----|--------|
| 1 | | | Pass / Fail |
| 2 | | | Pass / Fail |
| 3 | | | Pass / Fail |
| 4 | | | Pass / Fail |
| 5 | | | Pass / Fail |

**Comment:**

---

### IRC-P01a — B2C with Zero-Rated Items Only

**Description:** Verify B2C invoice with only VAT0/VATEX items.

**Actions:** Create invoice with only zero-rated/exempt items; issue; print.

**Verification:** Scan QR; verify VAT breakdown.

**Expected Result:** Registers successfully; correct breakdown displayed.

**Test Result:**

| No. | Document No. | IRN | Result |
|-----|-------------|-----|--------|
| 1 | | | Pass / Fail |
| 2 | | | Pass / Fail |
| 3 | | | Pass / Fail |

**Comment:**

---

### IRC-P02 — B2B Sales Invoice with Buyer TIN and Legal Name

**Description:** Verify B2B invoice with mandatory buyer TIN and legal name.

**Actions:**
1. Prepare B2B invoice with buyer TIN and legal name.
2. Add items with discount, excise tax, withholding.
3. Issue and print.

**Verification:**
1. Scan QR with mobile app.
2. Confirm registration and validity.
3. Verify invalid buyer details are rejected.

**Expected Result:** Registered with valid buyer; IRN and QR printed; invalid buyer blocked with error.

**Test Result:**

| No. | Document No. | IRN | Result |
|-----|-------------|-----|--------|
| 1 | | | Pass / Fail |
| 2 | | | Pass / Fail |
| 3 | | | Pass / Fail |
| 4 | | | Pass / Fail |
| 5 | | | Pass / Fail |

**Comment:**

---

### IRC-P02a — B2B with Multiple VAT Rates and Discounts

**Description:** Verify B2B invoice with multiple VAT rates, item-level and invoice-level discounts.

**Actions:** Create B2B invoice with 5+ items across VAT categories; apply discounts; issue and print.

**Verification:** Manually verify totals.

**Expected Result:** Discounts and VAT correctly calculated; totals match.

**Test Result:**

| No. | Document No. | IRN | Result |
|-----|-------------|-----|--------|
| 1 | | | Pass / Fail |
| 2 | | | Pass / Fail |
| 3 | | | Pass / Fail |

**Comment:**

---

### IRC-P08 — Invoice with Multiple Currencies

**Description:** Verify invoices with foreign currency amounts and proper VAT conversion.

**Actions:** Create invoice in foreign currency; verify exchange rate; issue and print.

**Verification:** Verify exchange rate, VAT on converted amount, mobile app display.

**Expected Result:** Correct converted totals; both currencies displayed.

**Test Result:**

| No. | Document No. | IRN | Currency | Result |
|-----|-------------|-----|----------|--------|
| 1 | | | | Pass / Fail |
| 2 | | | | Pass / Fail |
| 3 | | | | Pass / Fail |

**Comment:**

---

### IRC-P09 — Bulk Invoices

**Description:** Verify batch processing of at least 50 invoices.

**Actions:** Prepare batch of 50+ varied invoices; submit; monitor.

**Verification:** All registered; no duplicates/missing; response times acceptable.

**Expected Result:** All registered with unique IRNs; no data loss.

**Test Result:**

| No. | Batch ID | Total | Successful | Failed | Result |
|-----|----------|-------|------------|--------|--------|
| 1 | | | | | Pass / Fail |
| 2 | | | | | Pass / Fail |

**Comment:**

---

### IRC-P10 — Invoice with Special Characters and Amharic Text

**Description:** Verify handling of Unicode, Amharic script, and special characters.

**Actions:** Create invoices with Amharic text and special characters; issue and print.

**Verification:** Verify correct rendering; no corruption in app.

**Expected Result:** All characters preserved; no truncation.

**Test Result:**

| No. | Document No. | IRN | Character Type | Result |
|-----|-------------|-----|----------------|--------|
| 1 | | | Amharic | Pass / Fail |
| 2 | | | Special chars | Pass / Fail |
| 3 | | | Mixed | Pass / Fail |

**Comment:**

---

## 2. Receipt Registration

### IRC-P03 — Sales Receipt from Registered Invoice

**Description:** Verify receipt registration linked to previously registered invoice.

**Actions:**
1. Register invoice (get IRN).
2. Generate sales receipt; send to EIRMS.
3. Receive RRN; print receipt with QR and RRN.

**Verification:**
1. Scan QR with mobile app.
2. Confirm receipt valid and linked to invoice.

**Expected Result:** Receipt registered; RRN and QR printed; details match in app; invalid invoice blocked.

**Test Result:**

| No. | Document No. | IRN and RRN | Result |
|-----|-------------|-------------|--------|
| 1 | | | Pass / Fail |
| 2 | | | Pass / Fail |
| 3 | | | Pass / Fail |
| 4 | | | Pass / Fail |
| 5 | | | Pass / Fail |

**Comment:**

---

### IRC-P03a — Partial Sales Receipt

**Description:** Verify partial receipt registration when only portion of invoice is paid.

**Actions:** Register invoice; generate partial receipt; generate second receipt for balance.

**Verification:** Verify first receipt amount; verify cumulative does not exceed total.

**Expected Result:** Partial receipt registered; balance tracked correctly.

**Test Result:**

| No. | Document No. | IRN and RRN | Amount Paid | Result |
|-----|-------------|-------------|-------------|--------|
| 1 | | | | Pass / Fail |
| 2 | | | | Pass / Fail |
| 3 | | | | Pass / Fail |

**Comment:**

---

### IRC-P04 — Withhold Receipt from Registered Invoice

**Description:** Verify withhold receipt registration for already registered invoice.

**Actions:** Register invoice; generate withhold receipt; print with QR and RRN.

**Verification:** Scan QR; confirm receipt valid and linked.

**Expected Result:** Receipt registered; RRN and QR printed; invalid invoice blocked.

**Test Result:**

| No. | Document No. | IRN and RRN | Result |
|-----|-------------|-------------|--------|
| 1 | | | Pass / Fail |
| 2 | | | Pass / Fail |
| 3 | | | Pass / Fail |
| 4 | | | Pass / Fail |
| 5 | | | Pass / Fail |

**Comment:**

---

### IRC-P11 — Receipt with Multiple Payment Methods

**Description:** Verify receipts with split payments (cash, card, mobile money).

**Actions:** Register invoice; generate receipt split across 2+ payment methods; print.

**Verification:** Verify amounts and totals; scan QR for breakdown in app.

**Expected Result:** Correct payment breakdown; totals match invoice.

**Test Result:**

| No. | Document No. | IRN and RRN | Payment Methods | Result |
|-----|-------------|-------------|-----------------|--------|
| 1 | | | | Pass / Fail |
| 2 | | | | Pass / Fail |
| 3 | | | | Pass / Fail |

**Comment:**

---

### IRC-P12 — Refund Receipt

**Description:** Verify refund receipt linked to previously registered invoice.

**Actions:** Register invoice and receipt; generate refund receipt; print.

**Verification:** Verify linkage; scan QR; confirm amount does not exceed original.

**Expected Result:** Refund receipt registered; valid RRN and QR; correct details in app.

**Test Result:**

| No. | Document No. | IRN and RRN | Refund Amount | Result |
|-----|-------------|-------------|---------------|--------|
| 1 | | | | Pass / Fail |
| 2 | | | | Pass / Fail |
| 3 | | | | Pass / Fail |

**Comment:**

---

## 3. Cancellation

### IRC-P05 — Cancel Registered Invoice

**Description:** Verify cancellation of previously registered invoices.

**Actions:**
1. Identify invoices from IRC-P02.
2. Submit cancellation requests.
3. Receive confirmation.

**Verification:** Log into Back Office; verify status updated to cancelled.

**Expected Result:** Successfully cancelled; confirmation received; invalid/duplicate blocked.

**Test Result:**

| No. | Document No. | Cancelled Invoice (IRN) | Result |
|-----|-------------|------------------------|--------|
| 1 | | | Pass / Fail |
| 2 | | | Pass / Fail |
| 3 | | | Pass / Fail |
| 4 | | | Pass / Fail |
| 5 | | | Pass / Fail |

**Comment:**

---

### IRC-P05a — Cancel Invoice with Active Linked Receipts

**Description:** Verify behavior when cancelling invoice with active receipts.

**Actions:** Register invoice and generate receipt; attempt cancellation.

**Verification:** Verify system response; check if receipt reversal required.

**Expected Result:** System blocks or requires reversal; no orphaned records.

**Test Result:**

| No. | Document No. | IRN | Linked Receipts | System Response | Result |
|-----|-------------|-----|-----------------|-----------------|--------|
| 1 | | | | | Pass / Fail |
| 2 | | | | | Pass / Fail |
| 3 | | | | | Pass / Fail |

**Comment:**

---

## 4. Credit and Debit Memos

### IRC-P06 — Credit Memo from Registered Invoice

**Description:** Verify credit memo registration against previously registered invoice.

**Actions:**
1. Register credit memo with IRN.
2. Send to EIRMS.
3. Receive confirmation; print with QR and IRN.

**Verification:** Scan QR; confirm registered; amount does not exceed original.

**Expected Result:** Credit memo registered; valid IRN and QR; invalid invoice or excess amount blocked.

**Test Result:**

| No. | Document No. | IRN | Original IRN | Amount | Result |
|-----|-------------|-----|-------------|--------|--------|
| 1 | | | | | Pass / Fail |
| 2 | | | | | Pass / Fail |
| 3 | | | | | Pass / Fail |
| 4 | | | | | Pass / Fail |
| 5 | | | | | Pass / Fail |

**Comment:**

---

### IRC-P06a — Credit Memo Exceeding Original Amount

**Description:** Verify rejection of credit memo exceeding original invoice amount.

**Actions:** Register invoice; attempt credit memo with amount greater than original.

**Verification:** Confirm blocked; error message displayed.

**Expected Result:** Rejected; no IRN generated; error shown.

**Test Result:**

| No. | Document No. | Original IRN | Credit Amount | Original Amount | Result |
|-----|-------------|-------------|---------------|-----------------|--------|
| 1 | | | | | Pass / Fail |
| 2 | | | | | Pass / Fail |
| 3 | | | | | Pass / Fail |

**Comment:**

---

### IRC-P07 — Debit Memo from Registered Invoice

**Description:** Verify debit memo registration against previously registered invoice.

**Actions:** Register debit memo; send to EIRMS; print with QR and IRN.

**Verification:** Scan QR; confirm registered; invalid invoice blocked.

**Expected Result:** Debit memo registered; valid IRN and QR; invalid invoice blocked.

**Test Result:**

| No. | Document No. | IRN | Original IRN | Result |
|-----|-------------|-----|-------------|--------|
| 1 | | | | Pass / Fail |
| 2 | | | | Pass / Fail |
| 3 | | | | Pass / Fail |
| 4 | | | | Pass / Fail |
| 5 | | | | Pass / Fail |

**Comment:**

---

## 5. Negative Tests

### IRC-N01 — B2B Invoice with Invalid Buyer TIN/Legal Name

**Description:** Verify rejection of B2B invoice with invalid buyer details.

**Actions:** Prepare B2B invoice with invalid TIN (e.g., 000000000) or legal name; attempt issue.

**Verification:** System displays error; transaction halted.

**Expected Result:** Invalid buyer info rejected; transaction halted.

**Test Result:**

| No. | Document No. | IRN | Invalid Data Type | Result |
|-----|-------------|-----|-------------------|--------|
| 1 | | | Invalid TIN format | Blocked / Passed |
| 2 | | | Unregistered TIN | Blocked / Passed |
| 3 | | | Missing legal name | Blocked / Passed |
| 4 | | | Null buyer details | Blocked / Passed |
| 5 | | | Wrong TIN length | Blocked / Passed |

**Comment:**

---

### IRC-N02 — Receipt from Non-existent or Cancelled Invoice

**Description:** Verify rejection of receipt generation for invalid invoices.

**Actions:** Submit receipt requests using non-existent or cancelled IRNs.

**Verification:** Error displayed; process halted.

**Expected Result:** Invalid invoice identified; receipt blocked.

**Test Result:**

| No. | IRN | Type | Result |
|-----|-----|------|--------|
| 1 | | Non-existent | Blocked / Passed |
| 2 | | Non-existent | Blocked / Passed |
| 3 | | Non-existent | Blocked / Passed |
| 4 | | Cancelled | Blocked / Passed |
| 5 | | Cancelled | Blocked / Passed |

**Comment:**

---

### IRC-N03 — Cancel Non-existent or Already Cancelled Invoice

**Description:** Verify rejection of invalid cancellation requests.

**Actions:** Submit cancellation for non-existent IRNs; submit for already cancelled invoices.

**Verification:** Error displayed; process blocked.

**Expected Result:** Invalid/duplicate cancellation blocked.

**Test Result:**

| No. | IRN | Type | Result |
|-----|-----|------|--------|
| 1 | | Non-existent | Blocked / Passed |
| 2 | | Non-existent | Blocked / Passed |
| 3 | | Non-existent | Blocked / Passed |
| 4 | | Cancelled | Blocked / Passed |
| 5 | | Cancelled | Blocked / Passed |

**Comment:**

---

### IRC-N04 — Register Duplicate Invoice

**Description:** Verify detection and prevention of duplicate invoices.

**Actions:** Register invoice; attempt duplicate registration.

**Verification:** Duplicate rejected; error displayed.

**Expected Result:** Duplicate identified and blocked.

**Test Result:**

| No. | Document No. | IRN | Result |
|-----|-------------|-----|--------|
| 1 | | | Blocked / Passed |
| 2 | | | Blocked / Passed |
| 3 | | | Blocked / Passed |

**Comment:**

---

### IRC-N05 — Invoice with Future Date

**Description:** Verify rejection of invoices with future dates beyond tolerance.

**Actions:** Attempt registration with date >24 hours in future.

**Verification:** Blocked; error displayed.

**Expected Result:** Future-dated invoices rejected.

**Test Result:**

| No. | Document No. | Future Date (days) | Result |
|-----|-------------|-------------------|--------|
| 1 | | | Blocked / Passed |
| 2 | | | Blocked / Passed |
| 3 | | | Blocked / Passed |

**Comment:**

---

### IRC-N06 — Invoice with Backdated Date Beyond Threshold

**Description:** Verify rejection of backdated invoices beyond allowed threshold.

**Actions:** Attempt registration with date >30 days in past.

**Verification:** Blocked; error displayed.

**Expected Result:** Backdated invoices rejected.

**Test Result:**

| No. | Document No. | Backdated Days | Result |
|-----|-------------|----------------|--------|
| 1 | | | Blocked / Passed |
| 2 | | | Blocked / Passed |
| 3 | | | Blocked / Passed |

**Comment:**

---

### IRC-N07 — Invoice with Negative or Zero Quantity

**Description:** Verify rejection of items with negative or zero quantity.

**Actions:** Attempt invoice with negative quantity; attempt with zero quantity.

**Verification:** Both blocked; errors displayed.

**Expected Result:** Invalid quantities rejected.

**Test Result:**

| No. | Document No. | Invalid Quantity | Result |
|-----|-------------|------------------|--------|
| 1 | | Negative | Blocked / Passed |
| 2 | | Zero | Blocked / Passed |
| 3 | | Negative with valid price | Blocked / Passed |

**Comment:**

---

## 6. Notification Service

### ADD-N001 — Notification Service: Email and SMS

**Description:** Verify notifications sent for invoice/receipt events.

**Actions:** Perform registration, cancellation, debit, credit with buyer having email and phone.

**Verification:** Confirm receipt within 5 minutes; message includes action, date/time, invoice number, reason.

**Expected Result:** Clear notification via preferred method (SMS/email).

**Test Result:**

| No. | IRN | Action | Media | Email/Phone | Result |
|-----|-----|--------|-------|-------------|--------|
| 1 | | Registration | SMS | | Pass / Fail |
| 2 | | Registration | Email | | Pass / Fail |
| 3 | | Cancellation | SMS | | Pass / Fail |
| 4 | | Cancellation | Email | | Pass / Fail |
| 5 | | Debit | SMS | | Pass / Fail |
| 6 | | Debit | Email | | Pass / Fail |
| 7 | | Credit | SMS | | Pass / Fail |
| 8 | | Credit | Email | | Pass / Fail |
| 9 | | Receipt | SMS | | Pass / Fail |
| 10 | | Receipt | Email | | Pass / Fail |
| 11 | | Withholding | SMS | | Pass / Fail |
| 12 | | Withholding | Email | | Pass / Fail |

**Comment:**

---

### ADD-N002 — Notification Delivery Confirmation and Retry

**Description:** Verify retry logic for failed notifications.

**Actions:** Trigger to invalid contacts; trigger to valid contacts; monitor retries.

**Verification:** Failed logged; retries triggered; successes confirmed.

**Expected Result:** Failed logged with reason codes; retries attempted; successes confirmed.

**Test Result:**

| No. | Notification Type | Delivery Status | Retry Count | Result |
|-----|-------------------|-----------------|-------------|--------|
| 1 | Email (invalid) | Failed | | Pass / Fail |
| 2 | SMS (invalid) | Failed | | Pass / Fail |
| 3 | Email (valid) | Delivered | | Pass / Fail |
| 4 | SMS (valid) | Delivered | | Pass / Fail |

**Comment:**

---

## 7. Setup and Configuration

### ADD-C001 — Credential Management and Access Control

**Description:** Verify secure maintenance of credentials and keys; authorized access only.

**Actions:** Observe configuration process; note modification procedure.

**Verification:**
1. Only admin/equivalent can setup/view/modify.
2. Other roles restricted.
3. Credentials encrypted at rest.

**Expected Result:** Credentials secure; only authorized access; encrypted storage.

**Test Result:**

| Check | Status | Evidence/Notes |
|-------|--------|----------------|
| Secure runtime credential entry; no hard-coding | ☐ Yes ☐ No | |
| Admin-only access to setup/view/modify | ☐ Yes ☐ No | |
| Credentials encrypted at rest | ☐ Yes ☐ No | |

**Comment:**

---

### ADD-C002 — API Key and Certificate Rotation

**Description:** Verify secure rotation without service interruption.

**Actions:** Identify current credentials; initiate rotation; verify operation continues.

**Verification:** Old credentials invalidated; new active; no disruption.

**Expected Result:** Rotation successful; no service loss.

**Test Result:**

| Step | Action | Result |
|------|--------|--------|
| 1 | Pre-rotation check | Pass / Fail |
| 2 | Rotation execution | Pass / Fail |
| 3 | Post-rotation validation | Pass / Fail |
| 4 | Service continuity | Pass / Fail |

**Comment:**

---

### ADD-C003 — Time Synchronization (NTP)

**Description:** Verify automatic NTP synchronization.

**Actions:** Check NTP config; verify sync active; offset clock and observe.

**Verification:** NTP configured; drift within limits; abnormal timestamps rejected.

**Expected Result:** Clock synced; drift acceptable; abnormal timestamps blocked.

**Test Result:**

| Check | Status | Notes |
|-------|--------|-------|
| NTP server configured | ☐ Yes ☐ No | |
| Clock drift within tolerance | ☐ Yes ☐ No | |
| Timestamp validation enforced | ☐ Yes ☐ No | |

**Comment:**

---

## 8. Printing Layout and Content

### ADD-P001 — Thermal and Normal Printers

**Description:** Verify clear, legible printing on all printer types.

**Actions:** Print all supported invoice and receipt types.

**Verification:** Confirm data completeness; visual appeal; legibility.

**Expected Result:** All printouts clear, appealing, legible, complete.

**Test Result:**

| Check | Status | Notes |
|-------|--------|-------|
| Normal printer: all data present | ☐ Yes ☐ No | |
| Thermal printer: all data present | ☐ Yes ☐ No | |
| Digital format legible | ☐ Yes ☐ No | |
| QR code scannable | ☐ Yes ☐ No | |
| IRN/RRN clearly visible | ☐ Yes ☐ No | |
| VAT breakdown itemized | ☐ Yes ☐ No | |

**Comment:**

---

### ADD-P002 — Minimum Data Elements Verification

**Description:** Verify all mandatory fields present on every document type.

**Actions:** Print each document type; verify against mandatory checklist.

**Verification:** Header, line-item, and footer fields present.

**Expected Result:** All mandatory fields present and legible.

**Test Result:**

| Document Type | Mandatory Fields Present | QR Scannable | Result |
|---------------|------------------------|--------------|--------|
| B2C Invoice | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| B2B Invoice | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| Credit Memo | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| Debit Memo | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| Sales Receipt | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| Withholding Receipt | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |

**Comment:**

---

## 9. Security and Access Control

### SEC-001 — User Role Management and RBAC

**Description:** Verify proper RBAC with distinct roles and permissions.

**Actions:** Review defined roles; test unauthorized actions.

**Verification:** At least 3 roles; appropriate permissions; unauthorized actions blocked.

**Expected Result:** RBAC enforced; least privilege maintained.

**Test Result:**

| Role | Expected Permissions | Unauthorized Actions Blocked | Result |
|------|---------------------|------------------------------|--------|
| Admin | Full access | N/A | Pass / Fail |
| Cashier | Invoices, receipts | ☐ Yes ☐ No | Pass / Fail |
| Accountant | Reports, reconciliation | ☐ Yes ☐ No | Pass / Fail |
| Viewer | Read-only | ☐ Yes ☐ No | Pass / Fail |

**Comment:**

---

### SEC-002 — Password Policy and MFA

**Description:** Verify password complexity and MFA enforcement.

**Actions:** Attempt weak passwords; test MFA enrollment and enforcement.

**Verification:** Weak passwords rejected; MFA required for privileged accounts.

**Expected Result:** Strong password policy enforced; MFA active.

**Test Result:**

| Check | Status | Notes |
|-------|--------|-------|
| Min 12 chars with complexity | ☐ Yes ☐ No | |
| MFA available/enforced | ☐ Yes ☐ No | |
| Account lockout after failed attempts | ☐ Yes ☐ No | |

**Comment:**

---

### SEC-003 — Audit Logging

**Description:** Verify comprehensive audit logging for all critical operations.

**Actions:** Perform critical operations; verify logs captured.

**Verification:** Logs include user, timestamp, action, IP, result; tamper-evident.

**Expected Result:** All critical actions logged; logs protected.

**Test Result:**

| Operation | Logged | Tamper-Evident | Result |
|-----------|--------|----------------|--------|
| Invoice registration | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| Cancellation | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| Receipt generation | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| Configuration changes | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| Login/logout | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |

**Comment:**

---

## 10. Data Management and Integrity

### DATA-001 — Backup and Restore

**Description:** Verify daily backups and successful restore capability.

**Actions:** Trigger backup; perform test restore; verify data integrity.

**Verification:** Backup completed; restore successful; data intact.

**Expected Result:** Backups reliable; restore tested and successful.

**Test Result:**

| Check | Status | Notes |
|-------|--------|-------|
| Daily backups automated | ☐ Yes ☐ No | |
| Restore tested successfully | ☐ Yes ☐ No | |
| Data integrity after restore | ☐ Yes ☐ No | |

**Comment:**

---

### DATA-002 — Data Retention and Deletion

**Description:** Verify data retention policies and secure deletion.

**Actions:** Review retention configuration; test deletion procedures.

**Verification:** Retention periods defined; secure deletion implemented.

**Expected Result:** Retention enforced; deletion secure and complete.

**Test Result:**

| Check | Status | Notes |
|-------|--------|-------|
| Retention periods configured | ☐ Yes ☐ No | |
| Secure deletion implemented | ☐ Yes ☐ No | |
| Audit trail preserved | ☐ Yes ☐ No | |

**Comment:**

---

### DATA-003 — Data Encryption at Rest

**Description:** Verify sensitive data encrypted in storage.

**Actions:** Inspect database and file storage; verify encryption.

**Verification:** PII, TIN, credentials encrypted; keys protected.

**Expected Result:** All sensitive data encrypted at rest.

**Test Result:**

| Data Type | Encrypted | Method | Result |
|-----------|-----------|--------|--------|
| PII fields | ☐ Yes ☐ No | AES-256-GCM | Pass / Fail |
| TIN | ☐ Yes ☐ No | AES-256-GCM | Pass / Fail |
| Credentials | ☐ Yes ☐ No | AES-256-GCM | Pass / Fail |
| Certificates | ☐ Yes ☐ No | Encrypted private key | Pass / Fail |

**Comment:**

---

## 11. API Integration and Connectivity

### API-001 — EIMS API Connectivity

**Description:** Verify reliable connectivity to EIMS APIs.

**Actions:** Configure API endpoints; test connectivity; verify TLS.

**Verification:** Connection established; TLS 1.3+; mTLS working.

**Expected Result:** Stable, secure API connectivity.

**Test Result:**

| Check | Status | Notes |
|-------|--------|-------|
| API endpoint reachable | ☐ Yes ☐ No | |
| TLS 1.3+ enforced | ☐ Yes ☐ No | |
| mTLS/certificate auth working | ☐ Yes ☐ No | |
| Request/response format compliant | ☐ Yes ☐ No | |

**Comment:**

---

### API-002 — Offline Mode and Resend

**Description:** Verify offline operation and automatic resync.

**Actions:** Disconnect network; issue invoices; reconnect; verify sync.

**Verification:** Invoices queued offline; synced after reconnect; no data loss.

**Expected Result:** Offline mode functional; auto-sync within SLA.

**Test Result:**

| Check | Status | Notes |
|-------|--------|-------|
| Offline invoice creation | ☐ Yes ☐ No | |
| Encrypted offline queue | ☐ Yes ☐ No | |
| Auto-resend after reconnect | ☐ Yes ☐ No | |
| Sync within 72 hours | ☐ Yes ☐ No | |

**Comment:**

---

### API-003 — Input Validation and Error Handling

**Description:** Verify strict input validation and proper error responses.

**Actions:** Send malformed requests; verify responses.

**Verification:** Invalid inputs rejected; error messages clear; no stack traces exposed.

**Expected Result:** All endpoints validate inputs; errors generic in production.

**Test Result:**

| Test Case | Blocked | Error Message Clear | Result |
|-----------|---------|---------------------|--------|
| Missing required field | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| Invalid data type | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| Oversized payload | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |
| SQL injection attempt | ☐ Yes ☐ No | ☐ Yes ☐ No | Pass / Fail |

**Comment:**

---

## 12. Performance and Reliability

### PERF-001 — API Response Time

**Description:** Verify API response time within acceptable limits.

**Actions:** Measure response times for registration, query, and cancellation operations.

**Verification:** Response time <2s for SaaS/On-Premises; <3s for Hardware POS.

**Expected Result:** All operations complete within time limits.

**Test Result:**

| Operation | Avg Response Time | Max Response Time | Result |
|-----------|-------------------|-------------------|--------|
| Invoice registration | ___ ms | ___ ms | Pass / Fail |
| Receipt registration | ___ ms | ___ ms | Pass / Fail |
| Cancellation | ___ ms | ___ ms | Pass / Fail |
| Query/status check | ___ ms | ___ ms | Pass / Fail |

**Comment:**

---

### PERF-002 — Concurrent User Support

**Description:** Verify system handles concurrent users.

**Actions:** Simulate 50+ concurrent users performing operations.

**Verification:** No failures; response times acceptable; no data corruption.

**Expected Result:** System supports required concurrency.

**Test Result:**

| Concurrent Users | Operations | Failures | Result |
|------------------|------------|----------|--------|
| 10 | | | Pass / Fail |
| 25 | | | Pass / Fail |
| 50 | | | Pass / Fail |
| 100 | | | Pass / Fail |

**Comment:**

---

### PERF-003 — Monitoring and Health Checks

**Description:** Verify monitoring tools and health check endpoints.

**Actions:** Review monitoring setup; test health endpoints; verify alerts.

**Verification:** Health endpoint responsive; alerts configured; dashboards active.

**Expected Result:** Real-time monitoring active; alerts functional.

**Test Result:**

| Check | Status | Notes |
|-------|--------|-------|
| Health check endpoint | ☐ Yes ☐ No | |
| Monitoring dashboard | ☐ Yes ☐ No | |
| Alert notifications configured | ☐ Yes ☐ No | |
| Log aggregation active | ☐ Yes ☐ No | |

**Comment:**

---

## 13. Additional Tests by System Type

### Section A: SaaS SP (Cloud-Based Solution)

| Category | Check | Why | Result / Comments |
|----------|-------|-----|-------------------|
| Performance | Response time <2s per API call | Ensures fast invoice submission | ☐ Pass ☐ Fail |
| Performance | Handles >=50 concurrent users | Verifies scalability | ☐ Pass ☐ Fail |
| Performance | Automatic retry on API timeout | Prevents missing invoices | ☐ Pass ☐ Fail |
| Security | HTTPS/TLS enforced | Protects data in transit | ☐ Pass ☐ Fail |
| Security | Credentials encrypted & not hard-coded | Prevents data exposure | ☐ Pass ☐ Fail |
| Security | Role-based access (Admin/User/Viewer) | Enforces least privilege | ☐ Pass ☐ Fail |
| Reliability | Daily backups & restore tested | Ensures continuity | ☐ Pass ☐ Fail |
| Reliability | Monitoring alerts active | Detects failures early | ☐ Pass ☐ Fail |
| Reliability | Auto health-check system | Assures real-time status | ☐ Pass ☐ Fail |
| Architecture | Multi-tenant isolation per TIN/Sub-TIN/Branches | Prevents cross-data leakage | ☐ Pass ☐ Fail |
| Architecture | CI/CD with rollback | Safe version updates | ☐ Pass ☐ Fail |
| Architecture | Monitoring tools (ELK, Grafana) | Operational visibility | ☐ Pass ☐ Fail |
| Offline Mode | Issues invoices offline | Continuity in network loss | ☐ Pass ☐ Fail |
| Offline Mode | Automatic resend after reconnecting | Sync consistency | ☐ Pass ☐ Fail |

**Comment:**

---

### Section B: On-Premises S-POS (Installed Software)

| Category | Check | Why | Result / Comments |
|----------|-------|-----|-------------------|
| Performance | Invoice submission <2s | Fast response for users | ☐ Pass ☐ Fail |
| Performance | Multi-user operation supported | Supports concurrent use | ☐ Pass ☐ Fail |
| Security | Local roles configured (Admin/Cashier) | Access control | ☐ Pass ☐ Fail |
| Security | Credentials encrypted | Protects sensitive data | ☐ Pass ☐ Fail |
| Security | Activity logs available | Traceability | ☐ Pass ☐ Fail |
| Reliability | Backup & restore tested | Ensures recovery readiness | ☐ Pass ☐ Fail |
| Reliability | Data integrity maintained | Prevents loss | ☐ Pass ☐ Fail |
| Offline Mode | Issues invoices offline | Continuity in network loss | ☐ Pass ☐ Fail |
| Offline Mode | Automatic resend after reconnecting | Sync consistency | ☐ Pass ☐ Fail |
| Integration | Connects to EIMS via API/middleware | Integration compliance | ☐ Pass ☐ Fail |
| Integration | Source numbers mapped correctly | Traceability | ☐ Pass ☐ Fail |

**Comment:**

---

### Section C: Aggregator (Multi-Merchant Platform)

| Category | Check | Why | Result / Comments |
|----------|-------|-----|-------------------|
| Scalability | Handles large number of merchants | Validates platform scalability | ☐ Pass ☐ Fail |
| Security | Merchant data isolation enforced | Prevents cross-merchant leaks | ☐ Pass ☐ Fail |
| Reliability | Centralized backup and restore verified | Data protection | ☐ Pass ☐ Fail |
| Offline Mode | Issues invoices offline | Continuity in network loss | ☐ Pass ☐ Fail |
| Offline Mode | Automatic resend after reconnecting | Sync consistency | ☐ Pass ☐ Fail |
| Security | Separate DB schema or encrypted tenant partitioning | Strong isolation | ☐ Pass ☐ Fail |
| Security | End-to-end encryption + per-merchant keys | Maximum security | ☐ Pass ☐ Fail |
| Reliability | Published uptime SLA >=99.9% with proven DR site | Shared platform risk | ☐ Pass ☐ Fail |
| Reliability | Centralized backup & restore tested | Disaster recovery proof | ☐ Pass ☐ Fail |
| Performance | Per-merchant rate-limit handling | One client cannot block others | ☐ Pass ☐ Fail |
| Visibility | Real-time merchant-specific dashboard & alerts | Visibility per client | ☐ Pass ☐ Fail |
| Traceability | Merchant-specific identifier numbers/TIN | Correct tax reporting | ☐ Pass ☐ Fail |
| Traceability | Trace every transaction to exact branch/location | MoR compliance | ☐ Pass ☐ Fail |
| Exit clause | Full data export & deletion within 30 days | Merchant portability | ☐ Pass ☐ Fail |

**Comment:**

---

### Section D: Hardware POS (Device-Based Solution)

| Category | Check | Why | Result / Comments |
|----------|-------|-----|-------------------|
| Security | Device serial registered | Ensures traceability | ☐ Pass ☐ Fail |
| Security | Secure firmware and boot loader | Prevents tampering | ☐ Pass ☐ Fail |
| Performance | Invoice processed <3s | Guarantees quick service | ☐ Pass ☐ Fail |
| Reliability | 24-hour continuous operation | Proves durability | ☐ Pass ☐ Fail |
| Security | PIN/Fingerprint login enabled | Access control | ☐ Pass ☐ Fail |
| Security | Data encrypted in memory and transfer | Secures invoice data | ☐ Pass ☐ Fail |
| Reliability | Battery/UPS protection present | Prevents data loss | ☐ Pass ☐ Fail |
| Reliability | Auto resume after power loss | Reliability under outage | ☐ Pass ☐ Fail |
| Integration | Communicates with EIMS | Integration compliance | ☐ Pass ☐ Fail |
| Notification | SMS and Email sent for every transaction; paper print on demand | Buyer notification | ☐ Pass ☐ Fail |

**Comment:**

---

### Section E: Additional (Applicable to All Where Relevant)

| Category | Check | Why | Result / Comments |
|----------|-------|-----|-------------------|
| Architecture | System overview: services, components, interaction | Understanding system design | ☐ Pass ☐ Fail |
| Reliability | Latest DR test report + redundancy diagram | Business continuity | ☐ Pass ☐ Fail |
| Deployment | Deployment location and ownership model | Infrastructure clarity | ☐ Pass ☐ Fail |
| Datacenter | Datacenter service tier (I/II/III/IV) | Reliability assurance | ☐ Pass ☐ Fail |
| Architecture | Overall integration architecture (Monolithic/Microservice/Hybrid/Interfaced) | Design clarity | ☐ Pass ☐ Fail |
| Integration | Communication with API Gateway (Web service) | Standardized integration | ☐ Pass ☐ Fail |
| Resilience | Offline storage and resend capability | Continuity during downtime | ☐ Pass ☐ Fail |
| Multi-branch | Sub-TIN (branch-level) management | Multi-branch support | ☐ Pass ☐ Fail |
| Time sync | Automatic NTP time sync | Prevents timestamp errors | ☐ Pass ☐ Fail |
| Validation | Legal name and TIN validation | Ensures MoR compliance | ☐ Pass ☐ Fail |

**Comment:**

---

## 14. OF/AEAD/001 Cybersecurity Audit Alignment & MoR EIMS Gap Analysis

> **These sections have been extracted into dedicated standalone documents** to avoid duplication. See below for links to the full authoritative versions.

| Document | Scope | Location |
|----------|-------|----------|
| **OF/AEAD/001 Cybersecurity Audit Checklist** | Complete device/hardware security controls per INSA OF/AEAD/001 (Sections 4.1-4.12), penetration testing (Section 5.1), compliance auditing (Section 5.2), and gap analysis vs master checklist | [compliance/of-aead-001-cybersecurity-audit-checklist.md](./of-aead-001-cybersecurity-audit-checklist.md) |
| **MoR EIMS Functional Requirements Gap Analysis** | Full requirements-to-implementation mapping (Authentication, Token, Invoice, Cancellation, Bulk, Receipts, Security), identified gaps, traceability matrix, and sign-off | [MoR EIMS Gap Analysis](mor-eims-gap-analysis.md) |

*Sections 14 and 14.1 were removed from this master document on 2026-09-14. The standalone documents above contain the complete and authoritative detail.*

---

## 15. Rental Evidence Table

| S.N | Evidence or Information | Response | Remark | Result/Comments |
|-----|------------------------|----------|--------|-----------------|
| 1.2.1 | Legal name of service provider | __________ | Attach company registration | |
| 1.2.2 | TIN and License Number | TIN: __________ License No: __________ | Attach certificates | |
| 1.2.3 | DARA identifier for contract | __________ | Attach agreement | |
| 1.2.5 | Signed MSA / Contract | ☐ Attached | Must show scope, duration, payment | |
| 1.2.9 | Compliance with local data residency law | ☐ Yes ☐ N/A | Attach legal opinion if required | |

---

## 16. Architectural Model

Select one:
- ☐ Monolithic
- ☐ Micro-service-based
- ☐ Interfaced components

**Component Table (Monolithic / Interfaced):**

| # | Component Name | Version | Purpose | Source | Vendor & TIN | Permit | Origin | Hash | Doc | IP Cert |
|---|---------------|---------|---------|--------|--------------|--------|--------|------|-----|---------|
| 1 | | | | ☐ D ☐ P ☐ OS | | | | ☐ Y ☐ N | ☐ Y ☐ N |
| 2 | | | | ☐ D ☐ P ☐ OS | | | | ☐ Y ☐ N | ☐ Y ☐ N |

**Component Table (Microservice-based):**

| # | Component Name | Version | Purpose | Source | Vendor & TIN | Permit | Origin | Hash | Doc | IP Cert |
|---|---------------|---------|---------|--------|--------------|--------|--------|------|-----|---------|
| 1 | | | | ☐ D ☐ P ☐ OS | | | | ☐ Y ☐ N | ☐ Y ☐ N |
| 2 | | | | ☐ D ☐ P ☐ OS | | | | ☐ Y ☐ N | ☐ Y ☐ N |

---

## 17. Legal, Compliance and Agreement Requirements

| # | Requirement | Purpose / Assurance | Status / Evidence Required |
|---|-------------|---------------------|---------------------------|
| 1 | Audit logs retained for >=90 days | Enables traceability and forensic analysis | |
| 2 | SLA uptime >=99.5% | Confirms system reliability | Signed SLA with uptime commitment |
| 3 | Signed SLA and support plan in place | Defines accountability and remedies | Executed SLA document |
| 4 | Data ownership clearly retained by taxpayer | Provides legal protection | Clause in agreement explicitly stating ownership |
| 5 | 24/7 support contact channels available | Ensures service accessibility | |
| 6 | Exit policy & data export mechanism defined | Guarantees data portability | |
| 7 | Maintenance agreement signed | Ensures ongoing accountability | |
| 8 | Dedicated support contacts provided | Facilitates quick assistance | |
| 9 | Signed merchant/service provider agreements | Clearly defines rights & responsibilities | All relevant executed agreements |
| 10 | Firmware/software update process defined | Maintains security and device life cycle | All relevant agreements/documents |
| 11 | Technical support details documented & shared | Ensures support readiness | Support handbook / SOP shared with client |

---

## 18. Test Summary and Sign-Off

### Testers

| No. | Name | Signature | Date |
|-----|------|-----------|------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### Test Manager Approval

| Name | Signature | Date |
|------|-----------|------|
| | | |

### Taxpayer Representative Acknowledgment

| Name | Signature | Date |
|------|-----------|------|
| | | |

---

*End of Master Compliance Checklist*
