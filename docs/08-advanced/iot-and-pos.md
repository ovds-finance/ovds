<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# IoT, POS Devices & Smart Billing

> **Part of:** [Advanced Modules](./README.md)
>
> **Requires:** Login · `api_docs:read`
>
> **Navigate to:** **Daily Operations → IoT & POS Devices**

OVDS integrates with MoR-approved IoT devices — fiscal printers, POS terminals, smart meters, fleet trackers, and warehouse scanners — to automate real-time transaction capture, ERCA compliance, and financial recognition.

---

## Ethiopian Tax Pipeline — How IoT Connects to MoR

OVDS acts as a certified **AIS (Automated Invoice System)** between IoT edge devices and the Ministry of Revenue eTax portal. IoT devices cannot communicate with MoR directly — all fiscal data flows through OVDS.

```
[ IoT Edge Devices ]  ──HTTPS/MQTT+TLS──▶  [ OVDS AIS Layer ]  ──▶  [ MoR e-Tax Portal ]
  Fiscal printers                             Aggregates transactions     etax.erca.gov.et
  POS terminals                               Applies Ethiopian tax        tass.mor.gov.et
  Smart meters                                VAT 15% / TOT 2%/10%
  GPS trackers                                Posts to GL in real time
  Warehouse scanners
```

### How a Sale Event Flows Through the Pipeline

1. IoT device (POS / fiscal printer) sends a sale event to `POST /api/iot/telemetry`.
2. `IotBillingService` evaluates the event against billing thresholds → creates a `billing_trigger`.
3. `IotTaxBridgeService` calculates tax based on the company's registration status.
4. An **immutable `iot_fiscal_event`** is created with a SHA-256 fiscal signature.
5. The tax amount is posted to the VAT Output Ledger — feeding the monthly MoR return.
6. A real-time WebSocket broadcast updates the company dashboard.

### Tax Applied Per Company Status

| Company Status | Tax | Rate |
|---|---|---|
| VAT-registered (turnover ≥ ETB 2M) | VAT | 15% |
| Category B — goods | TOT | 2% |
| Category B — services | TOT | 10% |

**Fiscal integrity:** Every IoT billing event is an append-only record. The `fiscalSignature` field (`sha256(deviceId:triggerId:amount:recordedAt)`) prevents tampering and satisfies MoR audit requirements.

---

## Device Registry

Navigate to **IoT → Device Registry** (`/iot/devices`).

Register every MoR-approved fiscal device before it goes live.

| Field | Description |
|-------|-------------|
| Device ID | Unique hardware serial number |
| Device Type | Fiscal Printer / POS Terminal / Smart Meter / GPS Tracker / Warehouse Scanner |
| MoR Approval # | ERCA/TASS registration number |
| Location | Branch or physical site |
| Assigned Account | GL account for transactions originating from this device |
| Status | Active / Inactive / Pending Approval |

### Registration Workflow

1. Go to **IoT → Device Registry → New Device**.
2. Enter the device details and MoR approval number.
3. Click **Connection Test** — OVDS pings the device to verify it is reachable.
4. Set status to **Active**.
5. The device appears in the TASS portal cross-reference list.

---

## Sensor & Telematics Sync

Navigate to **IoT → Telemetry** (`/iot/telemetry`).

Automatically ingests live data from field sensors and triggers financial recognition based on configured rules.

| Sensor Type | Data Collected | Financial Trigger |
|---|---|---|
| Fleet GPS tracker | Location, distance, fuel consumption | Fuel expense recognition; vehicle depreciation alert |
| Smart meter (electricity/water) | Usage readings (kWh, m³) | Utility expense accrual |
| Warehouse temperature sensor | Temperature log | Inventory write-down trigger on cold chain breach |
| Weight / flow meter | Quantity dispensed | Revenue recognition for metered billing |
| Warehouse scanner | Stock movements (in/out) | Inventory ledger update |

**Sync frequency:** Configurable per device — real-time, every 5 minutes, hourly, or daily.

### Industry Use Cases

| Sector | IoT Data | Financial Trigger |
|--------|----------|-----------------|
| Retail / Vending | Sale amount, item scanned | VAT/TOT posted to output ledger |
| Logistics / Fleet | GPS distance, fuel litres | Fuel expense → BIT-deductible |
| Manufacturing | Weight kg, yield kg | COGS contribution → IAS 2 valuation |
| Utilities | kWh, m³ | Usage billing → VAT/TOT |
| Telecom / ISPs | Bandwidth GB | DRRF levy applicable |

---

## Smart Billing / POS

Navigate to **IoT → Smart Billing** (`/iot/billing`).

Sync physical POS sales directly into OVDS invoice — zero manual entry.

### Supported POS Integrations

- MoR-approved fiscal printers (Epson TM series with ERCA firmware)
- Standalone POS terminals with ERCA QR receipt generation
- Custom POS via the OVDS REST API

### Sales Sync Workflow

1. Cashier makes a sale on the POS terminal.
2. POS generates an **ERCA QR receipt** and sends the payload to OVDS.
3. OVDS creates an invoice and receipt automatically.
4. VAT is calculated and posted to the VAT Payable account.
5. Inventory is reduced for goods sold.
6. The sale appears in real time on the Main Dashboard.

---

## Device Alerts

Navigate to **IoT → Alerts** (`/iot/alerts`).

| Alert Type | Trigger | Action |
|---|---|---|
| Device offline | No heartbeat for > 15 minutes | Notify admin; flag in Compliance Auditor |
| Fiscal memory near full | > 80% capacity used | Schedule maintenance |
| Cold chain breach | Temperature outside configured range | Flag inventory items for IAS 36 write-down review |
| Tamper detected | Unexpected hardware event | Lock device; notify MoR |
| Connectivity restored | Device back online after outage | Resume sync; reconcile missed data |

Configure alert recipients and thresholds under **IoT → Alerts → Settings**.

---

## OTA (Over-The-Air) Updates

Navigate to **IoT → OTA Updates** (`/iot/ota`).

Manage firmware and software updates for all registered devices.

| Feature | Description |
|---------|-------------|
| Update packages | Upload MoR-approved firmware files |
| Staged rollout | Deploy to one test device first, then roll out to all |
| Rollback | Revert to the previous version if issues arise |
| Update log | Full history of what was deployed, when, and by whom |
| Compliance check | Verify all devices run the MoR-mandated firmware version |

> Only MoR-approved firmware versions should be deployed to fiscal devices. Unauthorized firmware changes can void the ERCA device registration.

---

## Developer API — Custom Device Integration

For custom device integrations, use the OVDS IoT REST API:

```http
POST /api/iot/events
Authorization: Bearer <device_token>
Content-Type: application/json

{
  "deviceId": "DEV-001",
  "eventType": "sale",
  "timestamp": "2025-07-01T10:30:00Z",
  "payload": {
    "amount": 1500.00,
    "vatAmount": 195.65,
    "items": [
      { "sku": "ITEM-001", "qty": 2, "price": 750.00 }
    ],
    "receiptQR": "ERCA-QR-XXXX"
  }
}
```

Full API documentation: **Developer → API Documentation** (`/api-docs`).

See also: [ARCHITECTURE.md](../ARCHITECTURE.md#12-iot--ethiopian-tax-workflow-integration) for the full IoT pipeline architecture.

---

## Setup (Phase 1)

Before using IoT features, complete the following during initial setup:

1. Go to **App Store** (`/app-store`) → enable the **IoT Module**.
2. Configure the IoT API endpoint and authentication keys in **Settings → Integrations**.
3. Register each device under **IoT → Device Registry**.
4. Configure recognition rules for sensor events under **IoT → Telemetry → Rules**.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Sales receipts from POS sync | [Financial Ops → Sales Receipts](../04-financial-ops/estimates-and-sales-orders.md#sales-receipts) |
| ERCA QR code on invoices | [Financial Ops → Creating an Invoice](../04-financial-ops/creating-an-invoice.md) |
| IoT asset tracking logs (analysis) | [Reports → Financial Reports](../07-reports/financial-reports.md) |
| DRRF levy on IoT-tracked sectors | [Tax & Compliance → BIT & DRRF](../06-tax-compliance/bit-and-drrf.md#disaster-risk-reduction-fund-drrf) |
| Developer API docs | `/api-docs` in your OVDS instance |




