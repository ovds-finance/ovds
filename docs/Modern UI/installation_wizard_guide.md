# OVDS SaaS Online: Enterprise Full Installation Wizard Guide
**Standard Architecture & Deployment Document for MOR Customer Enterprise Users**
**Target Environments:** Multi-Tenant Cloud / Isolated On-Premise

---

## 1. Executive Summary & Core Intent
This document serves as the authoritative operational blueprint for deploying the **OVDS SaaS Online Full Installation Wizard**. It guides System Administrators, DevOps Engineers, and **MOR Customer Enterprise Users** through the standardized process of initializing, configuring, and provisioning their software environments. 

This guide bridges the gap between high-level wizard interfaces and low-level system realities across both **Cloud** and **On-Premise** delivery models.

---

## 2. Infrastructure Deployment Matrix
The installation wizard adapts its execution logic dynamically based on the selected infrastructure target. Use the matrix below to understand structural prerequisites, visibility boundaries, and networking constraints.

| Deployment Layer | Multi-Tenant Cloud Path | Isolated On-Premise Path |
| :--- | :--- | :--- |
| **Data Residency** | Shared secure public cloud clusters | Local bare-metal or private hypervisors |
| **Network Visibility** | Exposed over public HTTPS | Bound to internal subnets / Local VPNs |
| **Authentication Link** | Central Identity Provider (IdP) | Local Active Directory / LDAP Intercepts |
| **Database Engines** | Managed Cloud DB (e.g., RDS PostgreSQL) | Self-hosted containerized / Native DB clusters |
| **Storage Subsystems** | Encrypted Object Storage Buckets | Network Attached Storage (NAS) / Local SAN |
| **Gateway Routing** | Cloud Native Load Balancers (ALB) | Reverse Proxy (NGINX / HAProxy) |

---

## 3. Data Dictionary & Unified Naming Standards
To ensure zero friction during step-by-step wizard execution and maintain strict compliance with data pipelines, the installation wizard enforces the following naming definitions:

*   `taxpayer_id_number` (String): The verified Tax Identification Number (TIN) sourced directly from official MOR records.
*   `enterprise_legal_name` (String): The fully qualified business name registered legally with local tax authorities.
*   `relevant_phone_number` (String): The targeted E.164 formatted telephone number authorized to receive the system validation OTP.
*   `deployment_mode` (Enum): Allowed values are strictly limited to `CLOUD` or `ON_PREMISE`.
*   `mor_customer_id` (String): Unique relational identifier connecting the local enterprise deployment to the parent MOR tracking engine.
*   `system_admin_email` (String): The root account communication address used for emergency cluster recoveries and primary alerts.

---

## 4. The 5-Step Sequential Wizard Workflow

```
 [Step 1: ID & TIN] ──> [Step 2: OTP Handshake] ──> [Step 3: Environment Setup]
                                                               │
 [Step 5: Initialization] <── [Step 4: Database Provisioning] ─┘
```

### Step 1: Identification & MOR Verification
*   **Action**: The enterprise administrator launches the setup UI and inputs the target `taxpayer_id_number` and `mor_customer_id`.
*   **System Operation**: The wizard initiates a secure back-channel connection to the central MOR verification registry to cross-reference enterprise validity and retrieve the registered `relevant_phone_number`.

### Step 2: Multifactor Authentication & OTP Handshake
*   **Action**: The system displays a masked phone number and triggers an automated SMS containing a 6-digit cryptographic verification key.
*   **System Operation**: The user inputs the key. The wizard validates the payload against an ephemeral storage cache (300-second strict expiration window).

### Step 3: Infrastructure & Environment Setup
*   **Cloud Path**:
    1. System asks for sub-domain tenant assignment (e.g., `https://[enterprise-name].ovdssaas.online`).
    2. Wizard claims cloud resource slices dynamically.
*   **On-Premise Path**:
    1. User inputs the local target domain names, internal IP ranges, and SSL/TLS certificate bundles.
    2. Wizard checks local hardware dependencies (Minimum: 4 vCPUs, 16GB RAM, 100GB SSD storage).

### Step 4: Database Schema Provisioning
*   **Action**: The wizard initiates connection tests against the designated database cluster.
*   **System Operation**: The wizard executes migration scripts, builds tables, applies indexes, and standardizes data fields to prevent schema drifting errors.

### Step 5: System Initialization & Smoke Testing
*   **Action**: The wizard generates the root administrator account credentials and triggers system health checks.
*   **System Operation**: All core service containers are pinged. A successful installation confirmation report is generated, and access tokens are issued.

---

## 5. Automated JSON API Payload Reference
For DevOps engineers executing headless, automated cluster provisions without the graphical wizard UI, send a `POST` request to the following endpoint:

`POST /api/v1/installation/wizard/execute`

#### Sample JSON Payload Structure
```json
{
  "registration_metadata": {
    "mor_customer_id": "MOR-88732-XL",
    "taxpayer_id_number": "TIN-99201182-B",
    "enterprise_legal_name": "Apex Enterprise Solutions Ltd"
  },
  "security_verification": {
    "relevant_phone_number": "+15550192834",
    "otp_handshake_token": "883921"
  },
  "infrastructure_target": {
    "deployment_mode": "ON_PREMISE",
    "network_config": {
      "target_host_domain": "ovds.internal.apex.local",
      "enable_ssl_termination": true,
      "allowed_internal_subnets": ["10.100.0.0/16", "192.168.10.0/24"]
    },
    "database_connection": {
      "db_host": "db-cluster.internal.apex.local",
      "db_port": 5432,
      "db_name": "ovds_core_prod",
      "use_encrypted_tunnel": true
    }
  }
}
```

---

## 6. Exception Handling & Troubleshooting Matrix

| Error Identifier | Root Cause | Immediate Actionable Engineering Solution |
| :--- | :--- | :--- |
| `ERR_WIZ_TIN_NOT_FOUND` | Provided TIN doesn't exist inside active MOR systems. | Verify syntax; cross-reference entries against official tax certificates. |
| `ERR_WIZ_OTP_EXPIRED` | The 300-second validation window was breached. | Click "Resend OTP" to invalidate old tokens and clear memory cache. |
| `ERR_ONPREM_RESOURCE_INSUFFICIENT` | Target system falls below minimum compute specs. | Allocate additional vCPUs/RAM to local hypervisor before restarting. |
| `ERR_DB_SCHEMA_DRIFT` | Existing data formats block clean schema generation. | Execute pre-installation database cleaning scripts or use empty DB. |
| `ERR_NET_HANDSHAKE_TIMEOUT` | Firewalls block outbound connections to MOR verification hubs. | Whitelist outbound TCP Port 443 routes for the target server IP. |

---
*End of Deployment Documentation.*
