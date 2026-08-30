<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# SRM, Fiscal Printers & Hybrid Deployment

**Specification reference:** §3.2 – §3.5, §4.1 – §4.4  
**Proclamation:** MoR SRM Directive · Proc. 1341/2024 (VAT) · Proc. 1395/2025 (TOT/BIT)

---

## 1. System Architecture Overview

OVDS supports two infrastructure deployment models for SRM/IoT hardware communication.
Tenant Admins select the model during initial setup. Both models satisfy MoR requirements.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  OPTION A — Web-Based Cloud + Local Desktop Agent                        │
│                                                                          │
│  [ Browser (Cloud SPA) ] ──HTTPS──▶ [ OVDS Cloud API ]                  │
│         │                                                                │
│         └──WebSocket (ws://localhost:7474)──▶ [ Local Desktop Agent ]   │
│                                                    │                    │
│                                    USB / Serial COM / LAN               │
│                                                    │                    │
│                                         [ SRM / Fiscal Printer ]        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  OPTION B — Native Desktop App (Offline-First)                           │
│                                                                          │
│  [ .exe / .dmg Installer (Electron / .NET) ]                             │
│         │                                                                │
│    USB / Serial COM / Local LAN                                          │
│         │                                                                │
│  [ SRM / Fiscal Printer ]                                                │
│         │                                                                │
│   (Internet available?) ──Yes──▶ [ OVDS Cloud API ] (auto-sync)         │
│                         ──No───▶ Local SQLite buffer (queued sync)       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Option A — Web-Based Cloud Application with Local Desktop Agent

### Architecture

The core ERP/POS runs in the cloud. A lightweight **Local Desktop Agent** bridges the cloud
to physical SRM hardware on the same machine.

**Local Desktop Agent stack choices:**
- C# / .NET 8 minimal API (`dotnet new webapi`)
- Node.js + `express` + `serialport` package

### Agent Communication Protocol

The cloud frontend communicates with the agent via:

| Transport | Address | Use case |
|-----------|---------|----------|
| WebSocket | `ws://localhost:7474/srm` | Real-time bidirectional (receipt printing, status updates) |
| REST | `http://localhost:7474/api` | Request-response (hardware commands, status polling) |

Both are **localhost-only** — no external exposure required. TLS is not needed for
loopback communication but the cloud ↔ agent token must be validated on each request.

### Agent Endpoints (reference implementation)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Agent liveness + SRM connection status |
| `POST` | `/api/srm/print` | Print a fiscal receipt on the connected SRM |
| `POST` | `/api/srm/z-report` | Trigger end-of-day Z-Report generation |
| `GET` | `/api/srm/status` | SRM connection, memory status, last transmission |
| `POST` | `/api/srm/register` | Register device with TASS (proxies to cloud API) |

### Agent Authentication

The cloud generates a **device token** when the Tenant Admin registers a workstation
(`Settings → Downloads & Apps → Node Management → Add Workstation`). The token is
stored in the agent's local config and sent as `X-Agent-Token` on every request to
the cloud API.

---

## 3. Option B — Native Desktop Application (Offline-First)

### Architecture

A native application is installed directly on the POS machine. It communicates with
SRM hardware via:
- USB HID / CDC-ACM drivers
- Serial COM port (RS-232 / RS-485)
- Local LAN / Ethernet (for networked fiscal printers)

### Sync Behaviour

| Condition | Behaviour |
|-----------|-----------|
| Internet available | Auto-sync every `SYNC_INTERVAL_SECONDS` (default: 300s = 5 min) |
| Internet unavailable | All transactions buffered in local SQLite; Z-Reports queued |
| On reconnect | Queued sync — FIFO order; MoR batch upload if IRN not yet fetched |
| Air-gapped config | `SYNC_INTERVAL_SECONDS=0` disables auto-sync (manual trigger only) |

### Offline Queue Action Types

| Type | Handler | Description |
|------|---------|-------------|
| `INVOICE_CREATE` | `POST /ovds/invoices` | Create invoice offline |
| `INVOICE_SYNC` | `PATCH /ovds/invoices/*` | Sync batch of offline invoices |
| `FISCAL_PRINT` | `POST /iot/pipeline/ingest` | Forward fiscal event to cloud AIS |
| `MOR_BATCH_UPLOAD` | `POST /iot/etax/vat-return` | Batch transmit to MoR after reconnect |

---

## 4. SRM Hardware Mandate & Lock-out Mechanism (§3.3)

### Mandatory Integration

The software enforces integration with MoR-approved Sales Register Machines (SRMs)
and Fiscal Printers. Every taxable sale **must** pass through an SRM before a receipt
is issued.

### Lock-out Flow

```
1. Cashier initiates sale
2. System calls: POST /api/iot/pipeline/register-srm  (if not already registered)
3. System performs cryptographic handshake with SRM (TASS device verification)
4. Handshake result:
     ✅ SUCCESS → sale proceeds, receipt generated
     ❌ FAIL    → sale blocked, error shown: "SRM not connected or not verified"
```

**Penalty:** ETB 50,000 for unregistered SRM devices (Tax Administration Proc. s.26.1).

### IoT Edge Gateway (GPRS/4G SIM)

SRM hardware with built-in IoT modules transmit:
- Daily Z-Reports (end-of-day summaries)
- Fiscal memory data
- Real-time transaction confirmations

These are handled by the `IotTaxBridgeService` and persisted as immutable
`iot_fiscal_event` records with SHA-256 signatures.

### Entitlement Gate

SRM printing drivers are gated behind `feature:srm-printing`.
Free-trial tenants cannot use SRM integration until a paid plan is activated.

```typescript
// Backend gate
@UseGuards(MonetizationGuard)
@RequireEntitlement('feature:srm-printing')
async printFiscalReceipt() { ... }
```

---

## 5. Hybrid Data Transmission Modes to MoR (§3.4)

### Real-Time Integration Mode (Online)

When internet is available, every transaction is pushed to MoR EIS immediately:

```
1. Invoice saved → POST /ovds/invoices
2. IotTaxBridgeService.applyTaxToBillingTrigger()
3. ETaxService.submitVatReturn() → POST https://etax.mor.gov.et/api/invoice
4. MoR returns: { irn: "INV-2026-XXXXXXXX", qrCode: "data:image/png;base64,..." }
5. Invoice updated with IRN + QR code
6. Receipt printed with official QR code
```

Requires: `ERCA_API_URL` + `ERCA_API_KEY` in `.env`.
Feature gate: `feature:mor-live-api` (locked in free tier).

### Batch Processing Mode (Offline)

When internet is unavailable:

```
1. Transaction saved locally (SQLite / SQL Express)
2. Outbox event queued: type = "mor.batch.upload"
3. On reconnect (or daily schedule):
     → OutboxProcessor picks up queued events
     → Packages transactions per MoR batch format
     → POST https://etax.mor.gov.et/api/batch
     → Updates all pending invoices with their IRNs
```

No disruption to business operations during outage. Batch upload is atomic and
idempotent (duplicate references are silently ignored by MoR).

---

## 6. Fiscal Receipt Printing Modes (§3.5)

Tenant Admins toggle printing mode via:

```
Settings → Fiscal Printing Mode
  GET  /api/settings/fiscal-printing-mode?companyId=<id>
  PATCH /api/settings/fiscal-printing-mode  { companyId, printingMode: "AUTOMATED" | "MANUAL" }
```

### Option 1 — AUTOMATED (Zero-Click)

```
Telebirr / CBE Birr webhook received
  └─▶ MonetizationService.processWebhook()
       └─▶ emitPaymentConfirmedForFiscalPrint(companyId, ref, 'AUTOMATED')
            └─▶ EventEmitter.emit('payment.confirmed.for.fiscal.print')
                 └─▶ IotService / Local Agent: SRM.print(receipt)
```

No manual interaction required. Receipt prints the instant payment is confirmed.

### Option 2 — MANUAL (Staff-Controlled)

```
Telebirr / CBE Birr webhook received
  └─▶ Payment verified — system unlocks "Print Fiscal Receipt" button
  └─▶ WebSocket broadcasts to POS UI: { event: "payment.verified", printUnlocked: true }
  └─▶ Cashier visually confirms customer presence → clicks button
  └─▶ POST /api/iot/pipeline/ingest → triggers SRM print
```

Allows cashier final visual confirmation before printing.

---

## 7. Banking Gateway Integration (§2.3)

### Telebirr (Merchant Webhook / Payment Notification)

| Config Key | Description |
|-----------|-------------|
| `TELEBIRR_BUSINESS_ID` | Merchant ID from Ethio Telecom |
| `TELEBIRR_APP_KEY` | App key for API auth |
| `TELEBIRR_PUBLIC_KEY` | RSA public key for signature verification |
| `TELEBIRR_WEBHOOK_SECRET` | HMAC-SHA256 secret for webhook validation |

**Webhook event mapping:**
```
payment.notification → charge.success (normalised by MonetizationService)
```

### CBE Birr (Commercial Bank of Ethiopia)

| Config Key | Description |
|-----------|-------------|
| `CBE_BIRR_MERCHANT_ID` | CBE-assigned merchant identifier |
| `CBE_BIRR_API_KEY` | API credentials from CBE |
| `CBE_BIRR_WEBHOOK_SECRET` | HMAC-SHA256 secret for webhook validation |

**Webhook event mapping:**
```
transaction.confirmed → charge.success (normalised by MonetizationService)
transaction.failed    → charge.failed  (normalised by MonetizationService)
```

### Core Banking Systems (Automated Statement Fetching)

For automated bank statement reconciliation without manual CSV import:

| Config Key | Bank |
|-----------|------|
| `CBE_API_URL` | Commercial Bank of Ethiopia core API |
| `AWASH_API_URL` | Awash Bank |
| `DASHEN_API_URL` | Dashen Bank |
| `AMOLE_API_KEY` | Amole (Digital Birr) |

Feature gate: `feature:live-banking-webhooks` (locked in free tier).

---

## 8. Licensing & Trial Restriction Matrices (§4.2)

### Trial Restriction Modes

Configure when starting a trial via `POST /api/monetization/trial`:

```json
{
  "productId": "uuid",
  "restrictionMode": "TIME_BOUND" | "VOLUME_CAP" | "STRUCTURAL",

  // TIME_BOUND options
  "trialDays": 30,

  // VOLUME_CAP options
  "maxDocuments": 50,

  // STRUCTURAL options
  "maxSkus": 10,
  "maxUsers": 1,
  "maxBranches": 1
}
```

| Mode | Behaviour | Typical Cap |
|------|-----------|-------------|
| `TIME_BOUND` | All entry forms lock after N days from installation | 15 or 30 days |
| `VOLUME_CAP` | "Save Transaction" disabled after N documents generated | 30 or 50 invoices |
| `STRUCTURAL` | Hard caps on SKUs, users, branches | 10 SKUs / 1 user / 1 branch |

**Mandatory locked features under ALL trial modes:**
- `feature:live-banking-webhooks` — Telebirr/CBE API
- `feature:mor-live-api` — MoR EIS live push
- `feature:srm-printing` — SRM/fiscal printer drivers

### Commercial Tiers

| Tier | Type | Billing | License |
|------|------|---------|---------|
| Starter | Subscription | Monthly / Annual | Per company |
| Business | Subscription | Monthly / Annual | Per company |
| Enterprise | Subscription | Monthly / Annual | Per company + multi-branch |
| Business Lifetime | Perpetual | One-time lump sum | Per device/branch |

**Perpetual (lifetime) license behaviour:**
- Activates a permanent cryptographic key in `monetization_purchase`
- `source: 'LIFETIME'` in entitlement cache — never expires
- Cloud backup add-ons remain subscription-based
- 24-hour background validation check still runs (for cloud services only)

### Pay-to-Unlock & Data Migration (§4.4)

When a trial tenant upgrades to paid:

```
1. User clicks "Upgrade to Premium" in the app
2. Payment processed via Telebirr or CBE Birr wallet
3. Webhook: POST /api/monetization/webhook
     { provider: "telebirr", event: "charge.success", triggerTrialDataMigration: true }
4. MonetizationService:
     a. Creates subscription / purchase record
     b. Rebuilds entitlement cache (features unlock without app restart)
     c. Schedules data migration: outbox_event type = "trial.data.migration"
5. Background worker picks up migration event:
     a. Local SQLite / SQL Express data packaged
     b. Pushed to cloud MariaDB backend (tenant-scoped)
     c. `trialDataMigrated` flag set on company record
```

Feature unlock is **instant** (no restart required). Data migration runs in background.

---

## 9. API Reference

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `POST` | `/api/iot/pipeline/register-srm` | `iot:write` + `feature:srm-printing` | Register device as TASS SRM |
| `GET` | `/api/iot/pipeline/srm-status/:serialNo` | `iot:read` | Check TASS SRM status |
| `GET` | `/api/iot/pipeline/validate-receipt/:no` | `iot:read` | Validate ERCA fiscal receipt |
| `POST` | `/api/iot/pipeline/ingest` | `iot:write` + `feature:srm-printing` | Ingest telemetry + apply tax |
| `GET` | `/api/iot/pipeline/fiscal` | `iot:read` | Immutable fiscal event log |
| `GET` | `/api/iot/pipeline/tax-summary/:period` | `vat:read` | IoT tax summary for MoR |
| `GET` | `/api/settings/fiscal-printing-mode` | `settings:read` | Get tenant printing mode |
| `PATCH` | `/api/settings/fiscal-printing-mode` | ADMIN+ | Set tenant printing mode |
| `POST` | `/api/monetization/trial` | authenticated | Start trial with restriction mode |
| `POST` | `/api/monetization/webhook` | public (HMAC verified) | Process payment webhook |
| `GET` | `/api/client/invoice-module/manifest` | authenticated | Get installer manifest |
| `GET` | `/api/client/invoice-module/download/:platform` | authenticated | Download installer |

---

## 10. Environment Variables Checklist

```env
# SRM / IoT
TASS_API_URL=https://api.tass.mor.gov.et
IOT_API_TOKEN_SECRET=<random-secret>
IOT_HEARTBEAT_INTERVAL_SEC=60
IOT_OFFLINE_THRESHOLD_MIN=5

# MoR eTax (live mode)
ERCA_API_URL=https://api.etax.mor.gov.et
ERCA_API_KEY=<issued-by-MoR>
ETAX_MODE=stub           # stub | sandbox | live

# Telebirr
TELEBIRR_BUSINESS_ID=
TELEBIRR_APP_KEY=
TELEBIRR_PUBLIC_KEY=
TELEBIRR_WEBHOOK_SECRET=

# CBE Birr
CBE_BIRR_MERCHANT_ID=
CBE_BIRR_API_KEY=
CBE_BIRR_WEBHOOK_SECRET=

# Core Banking (auto statement fetch)
CBE_API_URL=
AWASH_API_URL=
DASHEN_API_URL=
AMOLE_API_KEY=

# Local Desktop Agent (Option A)
LOCAL_AGENT_PORT=7474
LOCAL_AGENT_TOKEN_SECRET=<random-secret>

# Sync (Option B offline-first)
SYNC_INTERVAL_SECONDS=300   # 0 = disabled (air-gapped)
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [../../ARCHITECTURE.md](../ARCHITECTURE.md) | Full monorepo architecture |
| [WEBHOOKS.md](WEBHOOKS.md) | Webhook integration details |
| [API.md](API.md) | Full REST API reference |
| [INSTALL.md](../01-getting-started/INSTALL.md) | Installation & cloud vs on-premise |
| [REVIEW.md](../REVIEW.md) | System gap analysis & production checklist |



