# Enterprise Onboarding Wizard Registration Blueprint
## OVDS SaaS Online System Evolution Framework

This document outlines the standard production-ready workflow for the **Enterprise Registration Wizard** on the **OVDS SaaS Online** platform. It provides actionable configurations for onboarding **MOR Customer Enterprise Users** across both **Cloud (Multi-Tenant)** and **On-Premise (Private Infrastructure)** environments.

**Legal Basis:** Ethiopian Commercial Code (Proclamation No. 1243/2021), Tax Administration Proc. 983/2016, VAT Proc. 1341/2024, NID Proc. 1024/2025, Income Tax Proc. 1395/2025.

---

## 1. System Architecture & Environment Matrix

The registration wizard dynamically adapts its validation, networking, and deployment scripts based on the selected infrastructure.

| Dimension | Cloud (Multi-Tenant SaaS) | On-Premise (Private Infrastructure) |
| :--- | :--- | :--- |
| **Data Residency** | Shared cloud database with logical tenant isolation. | Fully isolated local database instance within enterprise perimeter. |
| **Network Accessibility** | Public internet via secure HTTPS gateway endpoints. | Internal corporate network / private VPN routing. |
| **Validation Engine** | Real-time global API connection to central MOR registers. | Localized cache sync or whitelisted outbound proxy to MOR. |
| **Identity Management** | Cloud-native IAM or federated Single Sign-On (SSO). | Local Active Directory (AD) / LDAP / Keycloak deployment. |
| **Storage Architecture** | Managed cloud object storage clusters. | Local Network Attached Storage (NAS) or SAN volumes. |
| **Deployment Route** | `/getting-started/cloud` | `/getting-started/on-premise` |

---

## 2. Standardized Data Dictionary

To ensure seamless integration with the automated error-fixer pipeline and naming standardizers, all registration wizard fields must utilize the following unified naming parameters:

### Core Enterprise Identifiers

| Field | Type | Validation | Description |
| :--- | :--- | :--- | :--- |
| `taxpayer_id_number` | String | `/^\d{10}$/` | The validated Taxpayer Identification Number (TIN) provided by the MOR authority. |
| `enterprise_legal_name` | String | Required | The official corporation title registered with trade registries. |
| `relevant_phone_number` | String | E.164 format | The authenticated mobile phone number mapped to the TIN for OTP handshakes. |
| `deployment_mode` | Enum | `CLOUD` \| `ON_PREMISE` | Infrastructure selection determining provisioning path. |
| `admin_identity_token` | String | UUID v4 | Secure anchor payload connecting the primary registering user to the corporate entity. |

### Ethiopian Identity Harmonization Fields

| Field | Type | Validation | Description |
| :--- | :--- | :--- | :--- |
| `fayda_id` | String | `/^\d{12}$/` | 12-digit Fayda Identification Number (FIN) from NIDP. |
| `vat_number` | String | `/^\d{10}$/` | VAT registration certificate number (10 digits after optional "VAT" prefix). |
| `license_number` | String | Required | Official business license number from MoTRI. |
| `ecr_serial` | String | Optional | ECR/POS device serial number registered on TASS. |

### Business Structure Types (2021 Commercial Code)

| Structure ID | Label | Min Founders | Min Capital | Liability |
| :--- | :--- | :--- | :--- | :--- |
| `plc` | Private Limited Company | 1 | ETB 50,000 | Limited |
| `share_company` | Share Company | 5 | ETB 500,000 | Limited |
| `one_person` | One-Person Company | 1 | ETB 50,000 | Limited |
| `llp` | Limited Liability Partnership | 2 | None | Limited |
| `general_partnership` | General Partnership | 2 | None | Unlimited |
| `limited_partnership` | Limited Partnership | 2 | None | Mixed |
| `sole_proprietor` | Sole Proprietorship | 1 | None | Unlimited |

---

## 3. Step-by-Step Registration Wizard Workflow

```
[ Step 1: NID ] -> [ Step 2: TIN ] -> [ Step 3: License ] -> [ Step 4: VAT ] -> [ Step 5: Cross-Reference ]
```

### Step 1: Fayda National Identification (NID) Verification

**Route:** `/settings/business-registration`

*   The system presents the user with the initial wizard window requesting the 12-digit `fayda_id`.
*   **Validation:** `isValidFaydaId()` verifies the format `/^\d{12}$/`.
*   The user provides full legal name as registered with NIDP and optional date of birth.
*   **API Endpoint:** `POST /business-registration/nid`
*   **Portal Reference:** NIDP (National ID Program) portal for registration.

### Step 2: Ministry of Revenues TIN Authentication

*   The wizard requests the 10-digit Ethiopian TIN (`taxpayer_id_number`).
*   **Validation:** `isValidTin()` enforces `/^\d{10}$/` with rejection of all-zeros and test values.
*   The user provides registered business name and sub-city tax office.
*   **Biometric Check:** Confirmation of biometric registration at MoR.
*   **API Endpoint:** `POST /business-registration/tin`
*   **Portal Reference:** MoR eTax portal (`etax.mor.gov.et`).

### Step 3: Business License Verification

*   The system captures the official business license number from MoTRI.
*   Required fields: trade name, licensed commercial activity, registered address.
*   **Turnover Classification:**
    *   Category A: ≥ ETB 2,000,000 (VAT mandatory)
    *   Category B: < ETB 2,000,000 (TOT applicable)
*   **API Endpoint:** `POST /business-registration/license`
*   **Portal Reference:** e-Trade portal (`etrade.gov.et`).

### Step 4: VAT Registration & ECR Status

*   The administrator selects VAT registration status:
    *   `NOT_REGISTERED` — No VAT registration
    *   `PENDING_APPLICATION` — Application in progress
    *   `REGISTERED` — Active VAT registration
    *   `SUSPENDED` — Temporarily suspended
    *   `DEREGISTERED` — Permanently deregistered
*   If registered: VAT number and ECR/POS machine status required.
*   **ECR Status Options:** `NOT_REQUIRED`, `REQUIRED_PENDING`, `REGISTERED`
*   **API Endpoint:** `POST /business-registration/vat`

### Step 5: Cross-Reference & Harmonization

*   The system verifies all identifier links:
    *   NID ↔ TIN link verified on e-Trade
    *   TIN ↔ Business License link verified
    *   Business License ↔ VAT link verified
    *   All records aligned in MoR administrative system
*   **Completion Score:** `computeHarmonizationPct()` calculates weighted progress (0-100%).
*   **API Endpoint:** `POST /business-registration/cross-reference`
*   **Finalization:** `POST /business-registration/complete`

---

## 4. Multi-Factor OTP Authentication Handshake

For sensitive operations (login, registration, password reset, MFA), the system implements OTP verification:

### OTP Configuration

| Parameter | Value | Environment Variable |
| :--- | :--- | :--- |
| Code Length | 6 digits | — |
| Token Lifetime | 600 seconds (10 minutes) | `OTP_TTL_MS` |
| Max Pending Codes | 3 per email/purpose | — |
| Rate Limit (Send) | 3 requests/minute | — |
| Rate Limit (Verify) | 5 requests/minute | — |

### OTP Purposes

| Purpose | Description |
| :--- | :--- |
| `LOGIN` | User authentication |
| `REGISTER` | New account registration |
| `PASSWORD_RESET` | Password recovery |
| `MFA` | Multi-factor authentication |

### API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/otp/send` | Generate and send OTP |
| `POST` | `/auth/otp/verify` | Verify OTP code |
| `POST` | `/auth/forgot-password` | Request password reset OTP |
| `POST` | `/auth/reset-password` | Reset password with OTP |

### Security Features

*   Constant-time comparison via `secureCompare()` prevents timing attacks.
*   Optimistic locking prevents double-use of OTP codes.
*   Automatic cleanup of expired codes.

---

## 5. Infrastructure & Deployment Mode Selection

### Cloud Path

**Route:** `/getting-started/cloud`

*   Bypasses infrastructure configuration.
*   Automatically maps tenant to optimized shared computing zone.
*   Instantly provisions tenant spaces, registers structural database boundaries, and creates custom workspace subdomains.

### On-Premise Path

**Route:** `/getting-started/on-premise`

*   Prompts for target infrastructure configurations:
    *   Database connection strings
    *   Local cluster URLs
    *   File store mounting paths
*   Compiles and outputs customized configuration manifest (`docker-compose.yml` or Helm values) with pre-baked tokens for local deployment initialization.

### Deployment Scripts

| Script | Purpose |
| :--- | :--- |
| `scripts/deploy.py` | SSH-based full deployment to `ovds.com.et` |
| `scripts/deploy-plesk.sh` | Plesk deployment for MySQL 8.4.0 |
| `scripts/build-airgap.sh` | Creates airgap distribution package |
| `scripts/restore-db.sh` | Database restore from backup |
| `scripts/backup-db.sh` | Encrypted database backup |

---

## 6. API Registration Payload Reference

### Business Registration Endpoints

```http
POST /business-registration/nid
Content-Type: application/json

{
  "faydaId": "123456789012",
  "fullName": "Abebe Kebede",
  "dateOfBirth": "1990-01-15"
}
```

```http
POST /business-registration/tin
Content-Type: application/json

{
  "tin": "1234567890",
  "businessName": "Global Mor Trading Enterprise Ltd",
  "taxOffice": "Kirkos Sub-City",
  "biometricComplete": true
}
```

```http
POST /business-registration/license
Content-Type: application/json

{
  "licenseNumber": "LIC-2026-001234",
  "tradeName": "Global Mor Trading",
  "activity": "Import/Export of Agricultural Products",
  "registeredAddress": "Bole Sub-City, Addis Ababa",
  "annualTurnover": 5000000
}
```

```http
POST /business-registration/vat
Content-Type: application/json

{
  "vatNumber": "1234567890",
  "registrationStatus": "REGISTERED",
  "ecrStatus": "REGISTERED",
  "ecrSerial": "ECR-2026-78901"
}
```

> **Note:** The `vatNumber` field accepts the raw 10-digit format. The "VAT" prefix is optional in UI inputs but is stripped during validation via `validateVatNumber()`.
```

```http
POST /business-registration/cross-reference
Content-Type: application/json

{
  "nidTinLinked": true,
  "tinLicenseLinked": true,
  "licenseVatLinked": true,
  "morSystemActive": true,
  "conflictNotes": []
}
```

### Full Registration Payload (Direct Provisioning)

For automated background provisioning or bypassing the UI wizard layer, issue requests to the registry routing service:

```json
{
  "registration_metadata": {
    "deployment_mode": "ON_PREMISE",
    "timestamp": "2026-08-26T18:56:00Z"
  },
  "enterprise_data": {
    "taxpayer_id_number": "TIN-987654321-X",
    "enterprise_legal_name": "Global Mor Trading Enterprise Ltd",
    "relevant_phone_number": "+251911234567"
  },
  "infrastructure_config": {
    "local_database_url": "postgresql://<username>:<password>@<host>:<port>/<database>",
    "storage_mount_point": "/mnt/secure_ovds/data",
    "network_whitelist_ips": ["10.0.0.0/8", "192.168.1.0/24"]
  }
}
```

> **Security Note:** Database credentials should be stored in environment variables (e.g., `DATABASE_URL`) and never hardcoded in configuration manifests.
```

---

## 7. Database Schema Reference

### Company Model (Tenant)

```prisma
model Company {
  id                         String           @id @default(uuid())
  name                       String           @unique
  type                       CompanyType
  tin                        String?          @db.VarChar(15)
  vatNumber                  String?          @db.VarChar(15)
  businessType               String?          @db.VarChar(50)
  language                   String?          @default("en") @db.VarChar(10)
  location                   String?          @db.VarChar(200)
  apiKey                     String?          @unique @db.VarChar(100)
  currencyCode               String?          @default("ETB") @db.VarChar(3)
  logoUrl                    String?          @db.VarChar(500)
  fiscalYearStart            Int?             @default(2024)
  industry                   String?          @db.VarChar(100)
  teamSize                   String?          @db.VarChar(50)
  settings                   String?          @db.LongText
  ifrsConfig                 String?          @db.LongText
  createdAt                  DateTime         @default(now())
  autoUpdate                 Boolean          @default(false)
  currentVersion             String?          @default("2.0.0")
  environment                AppEnvironment   @default(PRODUCTION)
  taxProfile                 CompanyTaxProfile?
}
```

### OTP Code Model

```prisma
model OtpCode {
  id        String   @id @default(uuid())
  email     String
  code      String
  purpose   String
  expiresAt DateTime
  status    String   // PENDING | VERIFIED | EXPIRED
  createdAt DateTime @default(now())
}
```

---

## 8. Exception Handling & Troubleshooting Protocols

### Error Response Format

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "timestamp": "2026-08-26T18:56:00Z",
  "path": "/business-registration/tin",
  "errorCode": "VALIDATION_ERROR"
}
```

### Registration Exception Codes

| Exception Identifier | HTTP Status | Error Context | Actionable Resolution Workflow |
| :--- | :--- | :--- | :--- |
| `ERR_TIN_NOT_FOUND` | 404 | Provided TIN does not match any registered MOR company profile. | Instruct user to verify input string or contact the local MOR registry bureau. |
| `ERR_TIN_INVALID` | 422 | TIN format validation failed. | Verify TIN is exactly 10 numeric digits. |
| `ERR_OTP_TIMEOUT` | 400 | Verification code expired or was not received in time. | Trigger fallback routing or verify connectivity of the target relevant phone number. |
| `ERR_OTP_MAX_ATTEMPTS` | 429 | Too many OTP requests for this email/purpose. | Wait 1 minute before retrying. |
| `ERR_DB_INIT_FAILED` | 500 | Local database connectivity failed during Step 5 of On-Premise setup. | Verify container-side firewall permissions, user credentials, and database server availability. |
| `ERR_PROXY_BLOCK` | 502 | On-Premise node is unable to communicate back to the core OVDS SaaS engine. | Update enterprise egress rules to whitelist outer proxy gateways and authentication nodes. |
| `ERR_FAYDA_INVALID` | 422 | Fayda ID format validation failed. | Verify Fayda ID is exactly 12 numeric digits. |
| `ERR_VAT_INVALID` | 422 | VAT number format validation failed. | Verify VAT number is exactly 10 numeric digits after optional "VAT" prefix. |

### Frontend Error Handling

| HTTP Status | Behavior |
| :--- | :--- |
| `401` | Toast notification + redirect to `/login` |
| `402` | Toast notification + redirect to `/payment-required` |
| `403` | Toast "Access denied" |
| `404` | Toast with display message; silent proceed for unwired endpoints |
| `409` | Toast "A conflict occurred — this record may already exist." |
| `422` | Toast "The data provided could not be processed." |
| `429` | Toast "Too many requests" (6s duration) |
| `500/502/503/504` | Toast "Service temporarily unavailable" (6s duration) |
| Network Error | Toast "No connection to server — check your network." |

---

## 9. Frontend Component Architecture

### Wizard Pages

| Route | Component | Description |
| :--- | :--- | :--- |
| `/getting-started` | `GettingStarted.tsx` | Public deployment onboarding flow |
| `/getting-started/cloud` | `SetupCloud.tsx` | Cloud-specific setup step |
| `/getting-started/on-premise` | — | On-premise deployment configuration |
| `/settings/business-registration` | `BusinessRegistration.tsx` | Ethiopian Business Registration wizard |
| `/settings/setup-wizard` | `SystemAdministrationSetup.tsx` | System administration setup wizard |
| `/settings/onboarding` | `OnboardingAdmin.tsx` | Admin onboarding dashboard |

### Reusable Components

| Component | Location | Description |
| :--- | :--- | :--- |
| `WizardStepper` | `packages/ui/src/components/WizardStepper.tsx` | Vertical/horizontal step indicator |
| `useBusinessRegistration` | `apps/frontend/src/hooks/useBusinessRegistration.ts` | Wizard state management hook |

### State Management

The `useBusinessRegistration` hook provides:

```typescript
interface UseBusinessRegistrationReturn {
  stepIndex: number;
  currentStep: WizardStepId;
  totalSteps: number;
  draft: RegistrationDraft;
  errors: StepErrors;
  saving: boolean;
  submitting: boolean;
  submitted: boolean;
  harmonization: HarmonizationSummary;
  completionPct: number;
  overallStatus: HarmonizationStatus;
  goBack: () => void;
  goNext: () => void;
  goToStep: (index: number) => void;
  handleSubmit: () => Promise<void>;
  resetWizard: () => void;
  updateNid: (data: Partial<NidFormState>) => void;
  updateTin: (data: Partial<TinFormState>) => void;
  updateLicense: (data: Partial<LicenseFormState>) => void;
  updateVat: (data: Partial<VatFormState>) => void;
  updateCrossRef: (data: Partial<CrossRefFormState>) => void;
}
```

---

## 10. Tax Reference Quick Guide

### Income Tax Schedules (Proc. 1395/2025)

| Schedule | Type | Rates | Basis |
| :--- | :--- | :--- | :--- |
| A — Employment | Progressive | 0% – 35% | Salaries & wages |
| B — Rental | Progressive/Flat | Up to 35% / 30% corp. | Property rental income |
| C — Business Profit | Flat/Progressive | 30% corp. / Up to 35% sole | Net business profit |
| D — Other Income | Flat | 5% – 15% | Dividends, CGT, royalties |
| E — Exempt | 0% | Fully exempt | Diplomatic, NGO grants |

### PIT Brackets (Monthly)

| Income Range (ETB) | Rate | Formula |
| :--- | :--- | :--- |
| 0 – 2,000 | 0% | Exempt |
| 2,001 – 4,000 | 15% | (gross − 2,000) × 15% |
| 4,001 – 7,000 | 20% | 300 + (gross − 4,000) × 20% |
| 7,001 – 10,000 | 25% | 900 + (gross − 7,000) × 25% |
| 10,001 – 14,000 | 30% | 1,650 + (gross − 10,000) × 30% |
| > 14,000 | 35% | 2,850 + (gross − 14,000) × 35% |

### Indirect Taxes

| Tax | Rate | Description |
| :--- | :--- | :--- |
| VAT | 15% | Standard consumption tax |
| Turnover Tax (TOT) | 2% / 10% | Category B presumptive tax |
| Excise Tax | Varies | Luxury/hazardous goods |
| Customs Duty | 10% – 35% | Import tariffs |
| Stamp Duty | Fixed | Legal documents |

### Contribution Rates

| Contribution | Employee | Employer | Cap |
| :--- | :--- | :--- | :--- |
| Pension | 7% | 11% | ETB 15,000 |

---

## 11. Official Resources

| Resource | URL | Purpose |
| :--- | :--- | :--- |
| MoR e-Tax Portal | https://etax.mor.gov.et | TIN registration, tax filing |
| e-Trade Portal | https://etrade.gov.et | Business license management |
| Ministry of Revenues | https://mor.gov.et | Official tax authority |
| AABE (IFRS Standards) | https://aabe.gov.et | Accounting standards |
| NBE (Exchange Rates) | https://nbe.gov.et | Currency exchange rates |

---

## Appendix A: Validation Helper Functions

```typescript
// Fayda ID Validation (12 digits)
export function isValidFaydaId(id: string | null | undefined): boolean {
  if (!id) return false;
  return /^\d{12}$/.test(id.replace(/[\s-]/g, ''));
}

// TIN Validation (10 digits)
export function isValidTin(tin: string | null | undefined): boolean {
  if (!tin) return false;
  return /^\d{10}$/.test(tin.replace(/[-\s]/g, ''));
}

// VAT Number Validation (10 digits after optional "VAT" prefix)
export function validateVatNumber(vat: string | null | undefined):
  { valid: true } | { valid: false; reason: string } {
  const clean = vat.replace(/[-\s]/g, '').replace(/^VAT/i, '');
  if (!/^\d{10}$/.test(clean)) {
    return { valid: false, reason: `VAT number must be exactly 10 digits` };
  }
  return { valid: true };
}

// Harmonization Completion Percentage
export function computeHarmonizationPct(record: Partial<BusinessHarmonization>): number {
  let score = 0;
  if (record.nid?.status === 'VERIFIED') score += 20;
  if (record.tin?.status === 'VERIFIED') score += 20;
  if (record.businessLicense?.status === 'VERIFIED') score += 20;
  if (record.vat?.registrationStatus === 'REGISTERED') score += 20;
  const cr = record.crossReference;
  if (cr) {
    const linked = [cr.nidTinLinked, cr.tinLicenseLinked, cr.licenseVatLinked, cr.morSystemActive].filter(Boolean).length;
    score += Math.round((linked / 4) * 20);
  }
  return score;
}
```

---

*Document Version: 2.0.0*
*Last Updated: 2026-08-26*
*Platform: OVDS SaaS Online v2.0.0*
