# Enterprise Onboarding & Registration Blueprint
## OVDS SaaS & Online Enterprise Ecosystem (Cloud / On-Premise)

This master document establishes the unified, step-by-step technical and operational framework for registering and onboarding new **MOR (Ministry of Revenues / Merchant of Record) Customer Enterprises** into the **OVDS SaaS Online** ecosystem. It accommodates both multi-tenant **Cloud hosting** and self-managed **On-Premise deployment** environments.

---

## 1. System Architecture & Environment Modes

Before initiating registration, the hosting infrastructure determines the endpoint routing and credential validation methods.

| Operational Layer | Cloud Deployment Mode | On-Premise Deployment Mode |
| :--- | :--- | :--- |
| **Hosting Infrastructure** | AWS / Azure / GCP Managed by OVDS SaaS | Local Enterprise Hardware / Private Data Center |
| **Network Visibility** | Public Gateway / Restricted IP Whitelisting | Internal Corporate Intranet / Secure VPN Tunnel |
| **Data Residency** | Shared Secure Multi-Tenant Cloud Databases | Localized Single-Tenant Database Instances |
| **Identity Verification** | Centralized Global IAM / OAuth2 Services | Local Active Directory (AD) / Internal LDAP Sync |

---

## 2. Naming Standards & Data Dictionary

To ensure seamless integration with the **Error Fixer and Naming Standardizer Pipeline**, all registration forms, API request payloads, and database records must strictly use the following normalized naming conventions:

*   **`taxpayer_id_number`** *(String)*: The official Taxpayer Identification Number (TIN). Replaces legacy tags `TIN`, `tin_no`, or `TaxId`.
*   **`enterprise_legal_name`** *(String)*: The registered business entity name. Replaces `company_name`, `ent_name`.
*   **`relevant_phone_number`** *(String)*: The primary mobile number authorized by the tax authority to receive OTP verifications. Must follow the E.164 international format (e.g., `+251911XXXXXX`). Replaces `mobile`, `ph_no`.
*   **`deployment_type`** *(Enum)*: Defines the infrastructure stack. Allowed values: `CLOUD` or `ON_PREMISE`.
*   **`mor_customer_id`** *(UUID)*: The unique system identifier linking the enterprise profile directly to the Ministry of Revenues / Merchant of Record tracking center.

---

## 3. Step-by-Step Onboarding Workflow

### Step 1: Pre-Registration Validation & TIN Verification
1.  The Enterprise Administrator navigates to the registration page (`/auth/register`).
2.  The administrator inputs the **`taxpayer_id_number`** and selects the **`deployment_type`** (`CLOUD` or `ON_PREMISE`).
3.  The OVDS system initiates a background API handshake with the **MOR Online Portal** to verify the validity of the TIN.
4.  The system retrieves the registered **`relevant_phone_number`** masked from the MOR database to prevent data exposure.

### Step 2: Secured OTP Authentication Handshake
1.  The system dispatches an encrypted **One-Time Password (OTP)** via SMS gateway to the verified **`relevant_phone_number`**.
2.  The user must input the 6-digit verification code within **300 seconds** (5 minutes).
3.  Upon successful submission, the system generates a secure temporary token (`registration_session_token`) authorizing the administrator to complete the corporate profile setup.

### Step 3: Enterprise Profile & Metadata Configuration
The user completes the main registration form with structured fields:
*   **Legal Identity**: Enter the exact **`enterprise_legal_name`** matching official documents.
*   **Primary Administrator Account**: Establish the master administrator email address, username, and cryptographic credentials.
*   **Service Configuration**: Select standard operational tiers, localized currencies, and transaction volume limits based on the MOR partnership level.

### Step 4: Infrastructure Provisioning & Connection Setup
Depending on the selected `deployment_type`, execute the matching provisioning workflow:

#### Option A: Cloud Deployment
1.  The system runs automated scripts to isolate a secure virtual partition within the multi-tenant architecture.
2.  Database schemas are dynamically assigned using the format `ovds_tenant_[taxpayer_id_number]`.
3.  API Gateway access keys and OAuth2 client secrets are automatically generated and rendered inside the administrative dashboard.

#### Option B: On-Premise Deployment
1.  The platform provides a download link for the containerized deployment bundle (Docker Compose or Kubernetes manifests).
2.  The local system administrator configures local environment flags to point toward the central cloud licensing server:
    ```bash
    OVDS_LICENSE_KEY=CORE-XXXX-XXXX-XXXX
    OVDS_DEPLOYMENT_MODE=ON_PREMISE
    OVDS_MOR_SYNC_ENDPOINT=https://api.mor.gov.example/v1/sync
    ```
3.  The local instance runs internal initialization routines to build standard relational tables locally.
4.  An outbound secure webhook test connection checks connectivity back to the central OVDS control center.

### Step 5: Final Handshake, License Issuance & Live Activation
1.  The onboarding engine runs an end-to-end diagnostic check confirming that the database sync, encryption keys, and notification channels are operational.
2.  A permanent digital license certificate is issued to the enterprise record.
3.  The enterprise status updates from `PENDING_ACTIVATION` to `LIVE`. The organization can now process production operations, manage enterprise users, and transmit reporting payloads back to the MOR framework.

---

## 4. API Registration Payload Reference

Developers can skip the manual web dashboard and onboard enterprise entities directly using the secure JSON endpoint `POST /api/v2/enterprise/onboard`:

```json
{
  "registration_metadata": {
    "taxpayer_id_number": "TIN987654321",
    "enterprise_legal_name": "Global Enterprise Logistics Ltd",
    "deployment_type": "CLOUD"
  },
  "contact_authentication": {
    "relevant_phone_number": "+251911000000",
    "admin_email_address": "admin@globalent.example"
  },
  "mor_linkage_parameters": {
    "mor_customer_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "sync_frequency_seconds": 3600
  }
}
```

---

## 5. Troubleshooting & Operational Exceptions

| Observed Issue | Probable Root Cause | Recommended Remediation Action |
| :--- | :--- | :--- |
| **`TIN_NOT_FOUND` Error** | The inputted `taxpayer_id_number` is invalid or missing in the MOR database. | Re-verify spelling against physical tax certificates; confirm synchronization status of the MOR database. |
| **SMS OTP Timeout** | Network latency or local cellular blockages on the `relevant_phone_number`. | Select the 'Resend OTP' action after 60 seconds; check downstream SMS logs via cloud aggregator dashboard. |
| **Handshake Refused (On-Prem)** | Local firewall settings blocking outbound connections to the licensing validation server. | Whitelist the specific IP addresses and domains listed in the network configuration files. |
| **Schema Creation Failure** | Insufficient storage space or permission blocks on local hardware during On-Premise provisioning. | Confirm that the target deployment database account retains full `CREATE`, `ALTER`, and `INDEX` database rights. |