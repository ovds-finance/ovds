<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Advanced Modules

> **Part of:** [OVDS Documentation](../README.md) › Advanced Modules
>
> **Related modules:** [Financial Operations](../04-financial-ops/README.md) · [Banking](../05-banking/README.md) · [Tax & Compliance](../06-tax-compliance/README.md) · [Reports](../07-reports/README.md)

Advanced modules extend OVDS beyond core accounting into full ERP territory: CRM, HR & Payroll, Inventory, Projects, and Business Intelligence. Each module integrates with the financial core — CRM deals link to invoices, HR payroll posts to the GL, inventory costs flow to COGS.

---

## Standalone Guides

| Guide | Description |
|-------|-------------|
| [HR & Payroll](./hr-and-payroll.md) | Employees, departments, shifts, attendance (biometric/GPS/QR), leave management, PIT brackets, payroll workflow, loans |
| [CRM & Deal Pipeline](./crm-and-pipeline.md) | Customer 360, Kanban pipeline, deal-to-invoice conversion, automation rules, client portal, loyalty tiers |
| [IoT & POS Devices](./iot-and-pos.md) | Device registry, telematics sync, smart billing, ERCA fiscal pipeline, OTA updates, REST API |
| [Helpdesk, Projects & BI](./helpdesk-and-projects.md) | Ticket lifecycle, SLAs, project P&L, resource tracking, Business Insights, partnerships, investments |
| [Monetization & Plans](./monetization-and-plans.md) | Subscription plans, feature entitlements, trial periods, SRM pay-to-unlock, multi-company admin |
| [Trade & Customs](./trade-and-customs.md) | Import landed cost, customs duty, surtax, advance BIT, VAT at import, e-SAD, shipment tracking |
| [Employee Self-Service, PAYE & Gratuity](./employee-self-service.md) | My Workspace portal, leave requests, payslips, HR calendar, PAYE declarations, gratuity calculation (Labour Proc. 1156/2019), IAS 19 provisions, payroll admin heads |
| [Payroll Edge Cases](./payroll-edge-cases.md) | Mid-month hire pro-ration, salary changes, arrears, bonuses, taxable allowances, termination pay, payroll corrections |
| [Compliance Dashboard & Business Credibility](./compliance-and-credibility.md) | ERCA compliance score, 10-item checklist, automated alerts, IFRS S1/S2, business credibility score, scheduled invoice sends |
| [Security Guide](./security-guide.md) | Admin security controls: account lockout, RBAC, API keys, audit log review, production hardening checklist |
| [Security Hardening Reference](./SECURITY.md) | Full technical reference: Helmet headers, Throttler limits, JWT config, input validation, multi-tenancy, CSP, secrets |

------

## 1. CRM & Business Development

### CRM Overview
Navigate to **CRM → Customers** (`/crm`) — requires `crm:read`.

The CRM module manages the full customer lifecycle: from lead to deal to invoice to loyalty.

### Contacts & Customers
- **Customer 360 View** — full history: invoices, payments, deals, communications
- **Credit Score** — calculated from payment history (on-time payments, overdue amounts)
- **Loyalty Tier** — Platinum / Gold / Silver / Bronze based on revenue
- **Customer Summary** (`/customer-summary`) — aggregated stats per customer

**Customer Fields:**
| Field | Notes |
|-------|-------|
| Name | Legal business name |
| TIN | 15-digit Ethiopian TIN (required for B2B VAT) |
| Email | For invoice delivery |
| Phone | Primary contact |
| Payment Terms | Default terms for invoices |
| Credit Limit | Maximum outstanding balance allowed |
| Loyalty Tier | Auto-calculated from revenue |

### Deal Pipeline (Kanban View)
Navigate to **CRM → Pipeline** (`/crm/pipeline`) — requires `crm:read`.

Visual kanban board with 6 stages:

| Stage | Default Probability | Description |
|-------|-------------------|-------------|
| Lead | 10% | Initial contact, unqualified |
| Qualified | 25% | Confirmed interest and budget |
| Proposal | 50% | Proposal sent to customer |
| Negotiation | 75% | Terms being negotiated |
| Closed Won | 100% | Deal signed |
| Closed Lost | 0% | Deal lost |

**Pipeline Features:**
- Drag cards between stages (or use the **Move to Next Stage** button)
- Kanban view (columns) or List view (table)
- Pipeline value per stage
- Win rate calculation
- Search and filter deals

**Creating a Deal:**
1. Click **New Deal**
2. Enter: Title, Customer Name, Deal Value (ETB), Stage, Probability
3. Set Expected Close Date and Assigned Sales Rep
4. Add notes
5. Click **Create Deal**

**Converting a Deal to Invoice:**
When a deal reaches **Closed Won**:
1. Open the deal → click **Create Invoice**
2. Invoice is pre-filled with customer and deal value
3. Add line items and send to customer

### Pipeline Management & Conversion Tracking
- **Pipeline Value** — total value of all active deals (excluding Closed Won/Lost)
- **Won Revenue** — total value of Closed Won deals
- **Win Rate** — Won / (Won + Lost) × 100%
- **Lead Velocity** — new deals created per month

### CRM Analytics
- Deal stage funnel visualization
- Average deal size by stage
- Sales rep performance
- Customer acquisition trends
- Revenue forecast from pipeline (probability-weighted)

### Automation Rules
Configure automatic actions:
- **Payment Reminders** — auto-send email when invoice is X days overdue
- **Deal Stage Alerts** — notify sales rep when deal is stale (no activity for X days)
- **Scheduled Exports** — auto-export customer list or pipeline report

### Client Portal
Navigate to **CRM → Client Portal** (`/client-portal`) — requires `invoices:read`.

Customers access their portal via a unique link:
- View all their invoices and payment history
- Download invoice PDFs
- Pay online (if payment gateway is configured)
- Submit service requests

---

## 2. HR & Payroll

### HR Overview
Navigate to **HR & Payroll** section — requires `employees:read`.

OVDS HR covers the full employee lifecycle: hire → attendance → leave → payroll → offboard.

### Employees
Navigate to **HR → Employees** (`/employees`).

**Employee Fields:**
| Field | Required | Notes |
|-------|----------|-------|
| First Name, Last Name | ✅ | Legal name |
| Employee ID | ✅ | Unique identifier |
| Department | ✅ | Must exist in Departments |
| Shift | ✅ | Must exist in Shifts |
| Base Salary | ✅ | ETB/month — set > 0 to activate payroll |
| Employment Nature | ✅ | PERMANENT, CONTRACT, PART_TIME |
| Bank Name | Recommended | For payslip and payment |
| Account Number | Recommended | For direct deposit |
| TIN | Recommended | For PIT certificate |
| Pension Number | Recommended | For pension remittance |

**Bulk Import:** Use Import Center → Employees to import from CSV.

### Departments & Shifts
- **Departments** (`/departments`) — organizational units with managers
- **Shifts** (`/shifts`) — working hour schedules (Morning, Afternoon, Night, etc.)
- **Holidays** (`/holidays`) — public holiday calendar (Ethiopian and custom)

### Attendance
Navigate to **HR → Attendance** (`/attendance`) — requires `attendance:read`.

**Check-in Methods:**
| Method | How It Works |
|--------|-------------|
| Mobile (GPS) | Employee checks in via browser — GPS verified against geofence |
| QR Code | Employee scans QR code at entrance |
| Biometric | Fingerprint or face recognition via enrolled device |
| Manual | HR manually records attendance |

**Attendance Records:**
- Check-in and check-out times
- Late arrival flag (if after grace period)
- Overtime calculation
- Absence auto-marking (cron job runs nightly)

**Biometric Enrollment** (`/enrollment`):
1. HR goes to Enrollment page
2. Employee places finger on biometric device
3. Template is stored in `BiometricData` model
4. Future check-ins are verified against the template

### Leave Management
Navigate to **HR → Leaves** (`/leaves`) — requires `leaves:read`.

**Leave Types:**
| Type | Days/Year | Paid | Notes |
|------|-----------|------|-------|
| Annual Leave | 16+ | Yes | Accrues monthly |
| Sick Leave | 6 | Yes | Requires medical certificate |
| Maternity Leave | 90 | Yes | Ethiopian Labour Law |
| Paternity Leave | 3 | Yes | |
| Bereavement | 3 | Yes | Immediate family |
| Unpaid Leave | Unlimited | No | Manager approval required |

**Leave Workflow:**
1. **Employee** submits leave request (from/to dates, type, reason)
2. **HR** reviews — checks leave balance and overlap with other employees
3. **HR** approves or rejects with comment
4. **Employee** receives notification
5. Approved leave is reflected in attendance records
6. Leave balance is deducted automatically

**Leave Balance Tracking:**
- Accrual rules configured per leave type
- Balance shown on employee's self-service portal
- HR can manually adjust balances

### Employee Benefits & Per-Diem
- **Benefits** — track non-salary benefits (transport allowance, housing, medical)
- **Per-Diem Tiers** — location-based daily allowances for business travel
  - Addis Ababa: ETB X/day
  - Regional cities: ETB Y/day
  - International: USD Z/day

### Payroll Generation
Navigate to **HR → Payroll** (`/payroll`) — requires `payroll:read`.

**Ethiopian PIT Brackets (Proclamation 1395/2025):**
| Monthly Income (ETB) | Rate | Deductible (ETB) |
|---------------------|------|-----------------|
| 0 – 2,000 | 0% | 0 |
| 2,001 – 4,000 | 10% | 200 |
| 4,001 – 7,000 | 15% | 400 |
| 7,001 – 11,000 | 20% | 750 |
| 11,001 – 14,000 | 25% | 1,300 |
| > 14,000 | 35% | 2,700 |

**Formula:** `PIT = (Taxable Salary × Rate) − Deductible Amount`  
Taxable salary = Gross salary − Employee pension (7%).

**Pension (Proclamation 1395/2025):**
- Employee: 7% of basic salary (capped at ETB 15,000)
- Employer: 11% of basic salary (capped at ETB 15,000)

**Payroll Workflow:**
1. **Generate** — HR clicks Generate for the month (requires `payroll:generate`)
   - OVDS calculates gross pay, PIT, pension, deductions, net pay for all active employees
2. **Verify** — HR reviews the payroll register (requires `payroll:verify`)
   - Check for anomalies: new hires, terminations, salary changes
3. **Finalize** — HR locks the payroll period (requires `payroll:finalize`)
   - No further changes allowed after finalization
4. **Approve** — ovds approves for disbursement (requires `payroll:approve`)
   - ovds verifies the total payroll cost
5. **Export** — Generate payslips and bank transfer file (requires `payroll:export`)
   - Individual PDF payslips for each employee
   - Bank transfer file for bulk payment

**Payroll Administration** (`/payroll-administration`) — requires `payroll:admin`:
- Configure payroll periods
- Set up deduction heads (loans, advances, penalties)
- Configure other payment heads (bonuses, allowances)
- Manage arrears and retroactive adjustments

### Loans & Salary Advances
- Employees can request salary advances or loans
- HR/ovds approves loan requests
- Repayments are automatically deducted from monthly payroll
- Loan balance tracked until fully repaid

---

### HR Reimbursement Workflows

HR departments process two main types of reimbursement workflows. Clear, transparent agreements must be established upfront to manage fees, refunds, and applicant reimbursements efficiently.

#### Workflow A — Corporate Agency invoice

When recruitment is outsourced to a staffing or placement agency, the agency fee is handled through the AP (bills) workflow — not as an employee expense claim.

**How it works:**

1. HR signs a **Recruitment Agency Agreement** before any search begins — document fee structure, guarantee period, and refund terms
2. Agency sources candidates; no invoice is raised until a candidate accepts and starts
3. Once placed, agency issues a placement invoice → HR creates a **Bill** under **Purchases → Bills**
   - Vendor: the agency (TIN required)
   - Category: Recruitment & HR Expenses (Agency Fee)
   - WHT: auto-calculated at 2% if agency TIN present and amount ≥ ETB 500
4. ovds approves payment; bill is paid net of WHT
5. **Guarantee period tracking:** if the placed candidate resigns within the agreed window (typically 30–90 days):
   - Navigate to **Purchases → Debit Notes** → link to the original agency bill
   - Enter refund amount — the debit note reduces net payable to the agency

**Key fields on the agency bill:**

| Field | Purpose |
|-------|---------|
| Placement Date | Date the candidate started — starts the guarantee clock |
| Guarantee Period (days) | Configurable per agreement |
| Linked Employee | Ties the bill to the hired employee record |
| Fee Type | Fixed / % of salary / Retainer |
| WHT Applied | Auto-calculated; shown as a separate line |

---

#### Workflow B — Worker / Candidate Cost Recovery

When the company pays costs on behalf of candidates during recruitment — travel, accommodation, medicals, certification fees, or relocation — these must be tracked as recoverable advances, not immediate expenses.

**Key principle:** If a cost recovery clause exists in the offer letter, the payment is a **staff advance** (balance sheet) until recovered. It only becomes an expense when deducted from payroll or written off.

**Workflow:**

1. HR documents the recovery agreement in the **offer letter** or a signed **cost recovery letter**
2. ovds pays the cost → records it as a **Staff Advance** under `HR → Payroll → Other Deductions → Advance Recovery`
3. **If candidate joins:**
   - Advance is linked to the employee record
   - Set up a monthly payroll deduction (type: *Advance Recovery*) until the balance is cleared
   - Once fully deducted, the advance is transferred to Recruitment Expense
4. **If candidate does not join or resigns early:**
   - Advance is reclassified as a receivable
   - HR issues a formal demand letter
   - If recovered — record receipt against the receivable
   - If unrecoverable — write off to Recruitment Expense with ovds approval

**Where to go in OVDS:**

| Action | Navigation |
|--------|-----------|
| Record candidate advance | HR → Payroll → Other Deductions → New Advance |
| Set up payroll recovery deduction | HR → Payroll → Other Deductions → Advance Recovery |
| Submit interview reimbursement (no recovery clause) | My Workspace → Expenses → New (workflowType: Candidate) |
| View advance balance | HR → Employees → [Employee] → Advances |
| Write off irrecoverable advance | ovds → Journal Entries (requires ovds approval) |

**RBAC summary:**

| Action | Permission | Role |
|--------|-----------|------|
| Create agency bill | `bills:write` | ACCOUNTING / ovds |
| Approve and pay agency bill | `bills:write` + `ovds:approve` | ovds |
| Issue guarantee debit note | `bills:write` | ACCOUNTING / ovds |
| Record candidate reimbursement | `expenses:write` | HR |
| Approve candidate advance | `expenses:approve` | ovds |
| Set up payroll recovery deduction | `payroll:admin` | HR |
| Write off irrecoverable advance | `ovds:write` + `ovds:approve` | ovds |

---

## 3. Inventory Management

Navigate to **Items → Inventory** (`/inventory`) — requires `inventory:read`.

### Costing Methods
| Method | Description | IFRS Compliance |
|--------|-------------|----------------|
| FIFO | First In, First Out | ✅ IAS 2 compliant |
| Weighted Average (WA) | Average cost of all units | ✅ IAS 2 compliant |
| LIFO | Last In, First Out | ❌ Prohibited under IAS 2 |

### Stock Management
- **Stock Adjustments** — record stock counts, write-offs, and corrections
- **Reorder Alerts** — automatic alert when stock falls below reorder level
- **Stock Valuation** — total inventory value at cost (FIFO or WA)
- **Movement History** — full audit trail of stock in/out

### Inventory Integration
- **Invoices** — selling an item reduces stock automatically
- **Bills/POs** — receiving goods increases stock automatically
- **COGS** — cost of goods sold is calculated and posted to the GL

---

## 4. Projects

Navigate to **Projects** — requires `projects:read`.

### Task Tracking & Milestones
- Create projects with start/end dates and budget
- Add tasks with assignees, due dates, and status
- Track milestones and deliverables
- Gantt-style timeline view

### Project Profitability
- Link invoices to projects (revenue)
- Link expenses and bills to projects (costs)
- Real-time project P&L
- Resource allocation and utilization

---

## 5. Business Intelligence

### Business Insights
Navigate to **Business → Insights** (`/business-insights`) — requires `insights:read`.

- Revenue trends and growth rate
- Customer acquisition cost
- Average invoice value
- Payment collection efficiency
- Top customers by revenue
- Top expense categories

### Loyalty Dashboard
Navigate to **CRM → Loyalty** (`/loyalty-dashboard`).

Customer loyalty program management:
- Tier assignment (Platinum/Gold/Silver/Bronze)
- Points accumulation rules
- Redemption tracking
- Tier upgrade/downgrade history

### Partnerships
Navigate to **Business → Partnerships** (`/partnerships`) — requires `partnerships:read`.

Track business partnerships and agreements:
- Partner details and contract terms
- Revenue sharing arrangements
- Partnership performance metrics

### Investments
Navigate to **Business → Investments** (`/investments`) — requires `investments:read`.

Track business investments:
- Investment amount and date
- Current valuation
- Return on investment
- Integration with financial statements

---

---

## 6. Helpdesk

Navigate to **Helpdesk** (`/helpdesk`) — requires `helpdesk:read`.

The Helpdesk module manages internal and external support tickets — employees submitting IT or HR requests, customers raising billing issues, and management tracking resolution SLAs.

### Ticket Lifecycle

```
NEW ──► OPEN ──► IN_PROGRESS ──► RESOLVED ──► CLOSED
  │                                               │
  └──────────────────────────────────────► CANCELLED
```

### Creating a Ticket
1. Go to **Helpdesk** → click **New Ticket**.
2. Fill in:

| Field | Required | Notes |
|-------|----------|-------|
| Subject | ✅ | Brief description of the issue |
| Category | ✅ | HR / ovds / IT / Billing / Other |
| Priority | ✅ | Low / Medium / High / Urgent |
| Description | ✅ | Full details of the issue |
| Attachments | Optional | Screenshots, documents |
| Assigned To | Optional | Defaults to category owner |

3. Click **Submit** — ticket is created with status **New** and a notification is sent to the assigned team.

### Managing Tickets

**For support agents (HR / ovds / Admin):**
- View all tickets in the queue via **Helpdesk → All Tickets**
- Filter by status, category, priority, or assignee
- Click a ticket → update status, add an internal note, or reply to the requester
- Set **Resolution** notes when closing

**For requesters (all employees):**
- View own tickets via **Helpdesk → My Tickets**
- Add follow-up comments or attachments
- Reopen a resolved ticket within 7 days if the issue persists

### Ticket Priority SLAs

| Priority | First Response | Resolution Target |
|----------|---------------|------------------|
| Urgent | 1 hour | 4 hours |
| High | 4 hours | 1 business day |
| Medium | 1 business day | 3 business days |
| Low | 2 business days | 5 business days |

> SLA breach alerts are sent automatically to the ticket assignee and their manager.

### RBAC

| Action | Permission |
|--------|-----------|
| Submit a ticket | All authenticated users |
| View and respond to tickets | `helpdesk:read` (HR / ADMIN / ovds) |
| Assign tickets | `helpdesk:write` (ADMIN) |
| Close or cancel tickets | `helpdesk:write` (ADMIN) |
| View all company tickets | `helpdesk:read` (ADMIN / ovds) |

---

## 7. IoT & POS Devices

### Overview
OVDS integrates with MoR-approved IoT devices — fiscal printers, POS terminals, smart meters, and fleet trackers — to automate real-time transaction capture and compliance.

Navigate to **Daily Operations → IoT & POS Devices** — requires `api_docs:read`.

### Device Registry (`/iot/devices`)

Register every MoR-approved fiscal device before it goes live.

| Field | Description |
|---|---|
| Device ID | Unique hardware identifier (serial number) |
| Device Type | Fiscal Printer / POS Terminal / Smart Meter / GPS Tracker / Warehouse Scanner |
| MoR Approval # | ERCA/TASS registration number |
| Location | Branch or site |
| Assigned Account | GL account for transactions originating from this device |
| Status | Active / Inactive / Pending Approval |

**Registration workflow:**
1. Go to **IoT → Device Registry → New Device**
2. Enter device details and MoR approval number
3. Run **Connection Test** — OVDS sends a ping to verify the device is reachable
4. Set status to **Active**
5. The device now appears in the TASS portal cross-reference list

### Sensor / Telematics Sync (`/iot/telemetry`)

Automatically ingests live data from field sensors to trigger financial recognition:

| Sensor Type | Data Collected | Financial Trigger |
|---|---|---|
| Fleet GPS tracker | Location, distance, fuel consumption | Fuel expense recognition; vehicle depreciation |
| Smart meter (electricity/water) | Usage readings | Utility expense accrual |
| Warehouse temperature sensor | Temperature logs | Inventory write-down trigger (cold chain breach) |
| Weight/flow meter | Quantity dispensed | Revenue recognition (metered billing) |
| Warehouse scanner | Stock movements | Inventory in/out |

**Sync frequency:** Configurable per device (real-time, every 5 min, hourly, daily).

**How a sensor event creates a transaction:**
1. Sensor sends a reading to the OVDS IoT endpoint
2. OVDS evaluates the reading against configured **recognition rules**
3. If a rule matches (e.g., fuel > threshold), OVDS auto-creates a journal entry or expense
4. The IoT payload is stored with the transaction for audit purposes
5. The event appears in the **IoT Asset Tracking Logs** (also visible in Analysis → Inventory & Assets)

### Smart Billing / POS (`/iot/billing`)

Sync physical POS sales data directly into OVDS invoice:

**Supported POS integrations:**
- MoR-approved fiscal printers (Epson TM series with ERCA firmware)
- Standalone POS terminals with ERCA QR receipt generation
- Custom POS via the OVDS REST API

**Sales sync workflow:**
1. Cashier makes a sale on the POS terminal
2. POS generates an ERCA QR receipt and sends the payload to OVDS
3. OVDS creates an invoice and receipt automatically (no manual entry)
4. VAT is calculated and posted to the VAT Payable account
5. Inventory is reduced for goods sold
6. Sales are reflected in real-time on the Main Dashboard

### Device Alerts (`/iot/alerts`)

Automated alerts for device and compliance events:

| Alert Type | Trigger | Action |
|---|---|---|
| Device offline | No heartbeat for > 15 min | Notify admin; flag in compliance auditor |
| Fiscal memory near full | > 80% capacity | Schedule maintenance |
| Cold chain breach | Temperature outside range | Flag inventory for write-down review |
| Tamper detected | Unexpected hardware event | Lock device; notify MoR |
| Connectivity restored | Device back online | Resume sync; reconcile missed data |

Configure alert recipients and thresholds under **IoT → Alerts → Settings**.

### OTA Updates (`/iot/ota`)

Manage firmware and software updates for all registered devices:

| Feature | Description |
|---|---|
| Update packages | Upload MoR-approved firmware files |
| Staged rollout | Deploy to one device first, then all |
| Rollback | Revert to previous version if issues arise |
| Update log | Full history of what was deployed, when, and by whom |
| Compliance check | Verify all devices are running MoR-mandated firmware version |

**Important:** Only MoR-approved firmware versions should be deployed to fiscal devices. Unauthorized firmware changes can void the ERCA registration.

---

### IoT → Ethiopian Tax Pipeline

OVDS acts as a **certified AIS (Automated Invoice System)** between IoT edge devices and the MoR e-Tax portal. IoT devices cannot communicate with MoR directly — all fiscal data must flow through the OVDS processing layer.

```
[ IoT Edge Devices ]  ──HTTPS/MQTT+TLS──▶  [ OVDS AIS Layer ]  ──▶  [ MoR e-Tax Portal ]
  Fiscal printers, POS,                       Aggregates & applies         etax.mor.gov.et
  smart meters, GPS                           Ethiopian tax in real-time   tass.mor.gov.et
  trackers, scanners                          VAT 15% / TOT 2%/10%
```

**How a sale event flows through the pipeline:**

1. IoT device (POS/fiscal printer) sends a sale event to `POST /api/iot/telemetry`
2. `IotBillingService` evaluates the event against billing thresholds → creates a `billing_trigger`
3. `IotTaxBridgeService` calculates tax (VAT 15% if Category A, or TOT 2%/10% if Category B)
4. An **immutable `iot_fiscal_event`** is created with a SHA-256 fiscal signature
5. The tax amount is posted to the VAT Output Ledger — feeding the monthly MoR return
6. Real-time WebSocket broadcast updates the company dashboard

**Tax applied per company status:**

| Company Status | Tax | Rate |
|---|---|---|
| VAT-registered (turnover ≥ ETB 2M) | VAT | 15% |
| Category B — goods | TOT | 2% |
| Category B — services | TOT | 10% |

**Fiscal integrity:** Every IoT billing event creates an append-only `iot_fiscal_event` record — no UPDATE path exists. The `fiscalSignature` field (`sha256(deviceId:triggerId:amount:recordedAt)`) prevents tampering and satisfies MoR audit requirements.

**Industry use-cases:**

| Sector | IoT Data | Financial Trigger |
|--------|----------|------------------|
| Retail / Vending | Sale amount, item scanned | VAT/TOT posted to output ledger |
| Logistics / Fleet | GPS distance, fuel litres | Fuel expense → BIT-deductible |
| Manufacturing | Weight kg, yield kg | COGS contribution → IAS 2 valuation |
| Utilities | kWh, m³ | Usage billing → VAT/TOT |
| Telecom / ISPs | Bandwidth, data GB | DRRF levy applicable |

> Full IoT pipeline API reference: **Developer → API Documentation** (`/api-docs`) · [ARCHITECTURE.md](../ARCHITECTURE.md#12-iot--ethiopian-tax-workflow-integration)

---

### Setup (Phase 1 — IoT Device Registry)

Before using IoT features, register your devices during Setup:
1. Go to **Setup → IoT/Device Registry** → **Settings → Integrations & API** (`/app-store`)
2. Enable the **IoT Module** from the App Store
3. Configure the IoT API endpoint and authentication keys in **Settings → Integrations**
4. Register each device under **IoT → Device Registry**
5. Configure recognition rules for sensor events under **IoT → Telemetry → Rules**

### Developer / Advanced: IoT API

For custom device integrations, use the OVDS IoT REST API:

```
POST /api/iot/events
Authorization: Bearer <device_token>
Content-Type: application/json

{
  "deviceId": "DEV-001",
  "eventType": "sale",
  "timestamp": "2024-07-01T10:30:00Z",
  "payload": {
    "amount": 1500.00,
    "vatAmount": 195.65,
    "items": [{ "sku": "ITEM-001", "qty": 2, "price": 750.00 }],
    "receiptQR": "ERCA-QR-XXXX"
  }
}
```

Full API documentation: **Developer → API Documentation** (`/api-docs`).

---

## Navigation Flow

```
CRM
├── Customers          /crm                    (crm:read)
├── Pipeline           /crm/pipeline           (crm:read)
├── Customer Summary   /customer-summary       (crm:read)
└── Client Portal      /client-portal          (invoices:read)

HR & Payroll
├── Employees          /employees              (employees:read)
├── Departments        /departments            (departments:read)
├── Shifts             /shifts                 (shifts:read)
├── Holidays           /holidays               (holidays:read)
├── Attendance         /attendance             (attendance:read)
├── Enrollment         /enrollment             (enrollment:write)
├── Leaves             /leaves                 (leaves:read)
├── Payroll            /payroll                (payroll:read)
└── Payroll Admin      /payroll-administration (payroll:admin)

Items & Inventory
├── Items Catalog      /items                  (items:read)
├── Stock Movements    /inventory              (inventory:read)
└── IAS 2 Valuation    /inventory/valuation    (inventory:read)

IoT & POS Devices (Daily Operations)
├── Device Registry    /iot/devices            (api_docs:read)
├── Telematics Sync    /iot/telemetry          (api_docs:read)
├── Smart Billing      /iot/billing            (api_docs:read)
├── Device Alerts      /iot/alerts             (api_docs:read)
└── OTA Updates        /iot/ota                (api_docs:read)

IoT & Smart Devices (Developer — advanced config)
├── Device Registry    /iot/devices            (api_docs:read)
├── Telemetry          /iot/telemetry          (api_docs:read)
├── Alerts             /iot/alerts             (api_docs:read)
├── OTA Updates        /iot/ota                (api_docs:read)
└── Smart Billing      /iot/billing            (api_docs:read)

Business
├── Insights           /business-insights      (insights:read)
├── Partnerships       /partnerships           (partnerships:read)
├── Investments        /investments            (investments:read)
├── Business Loans     /business-loans         (business_loans:read)
└── Loyalty Dashboard  /loyalty-dashboard      (crm:read)

Helpdesk
├── All Tickets        /helpdesk               (helpdesk:read)
├── My Tickets         /helpdesk?view=mine     (authenticated)
└── New Ticket         /helpdesk/new           (authenticated)
```




