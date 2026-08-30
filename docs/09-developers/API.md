<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# API Documentation

OVDS exposes a full REST API at `/api`. All endpoints require a Bearer JWT token except `/api/auth/login` and `/api/auth/register`. The interactive Swagger UI is available at `http://localhost:3000/api/docs`.

---

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "ovds@ovds.com",
  "password": "fin_pass_2026"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx...",
      "username": "ovds@ovds.com",
      "role": "ovds",
      "companyId": "clx..."
    }
  }
}
```

### Using the Token
Include the token in all subsequent requests:
```http
Authorization: Bearer <token>
```

### Response Envelope
All API responses are wrapped by the `TransformInterceptor`:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "success": true
}
```

The `useApiQuery` hook in the frontend automatically unwraps this envelope — `result.data` gives you the payload directly.

---

## Rate Limiting

Global throttle: **100 requests/minute per IP**. Individual endpoints can override with `@Throttle()`.

Sensitive endpoints have stricter limits:
- `POST /api/auth/login` — 10/minute
- `POST /api/auth/register` — 5/minute

---

## Guard Order

Every request passes through guards in this order:
```
ThrottlerGuard → AnyAuthGuard → CompanyGuard → RBACGuard
```

- **ThrottlerGuard** — rate limiting
- **AnyAuthGuard** — validates JWT (HS256 local or RS256 Auth0)
- **CompanyGuard** — injects `req.companyId` from JWT; validates company exists
- **RBACGuard** — checks `@Roles()` decorator; SPURADMIN bypasses all

---

## Core Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/change-password` | Change authenticated user password |
| GET | `/api/auth/me` | Current user info |
| POST | `/api/auth/logout` | Logout + audit log |
| POST | `/api/auth/auth0/session` | Exchange Auth0 token for local JWT |

### Employees
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/employees` | List employees (paginated, filter by departmentId) |
| POST | `/api/employees` | Create employee |
| GET | `/api/employees/:id` | Get employee by ID |
| PATCH | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |
| GET | `/api/employees/payroll-status-summary` | Payroll config status per employee |
| POST | `/api/employees/bulk-import` | Bulk import from CSV rows |

### Attendance
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/attendance/check-in` | Biometric/GPS check-in |
| POST | `/api/attendance/check-out` | Biometric/GPS check-out |
| GET | `/api/attendance` | List attendance records (paginated) |
| GET | `/api/attendance/report` | Daily attendance report |
| GET | `/api/attendance/who-is-in` | Currently checked-in employees |
| GET | `/api/attendance/reports-summary` | 7-day attendance stats |
| PATCH | `/api/attendance/verify/:id` | Verify an attendance record |
| DELETE | `/api/attendance/:id` | Delete attendance record |

### Payroll
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/payroll` | Payroll summaries (paginated, filter by year/month/dept) |
| GET | `/api/payroll/dashboard-stats` | Payroll dashboard KPIs |
| GET | `/api/payroll/employee-history/:employeeId` | 12-month payroll history |
| GET | `/api/payroll/export-csv/:year/:month` | Export payroll as CSV |
| GET | `/api/payroll/export-pdf/:year/:month` | Export payroll as PDF |
| PATCH | `/api/payroll/workflow/:employeeId` | Advance workflow status (GENERATED→VERIFIED→FINALIZED→APPROVED) |
| PATCH | `/api/payroll/bulk-workflow` | Bulk advance workflow |

### Leaves
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leaves` | List all leave requests (admin) |
| GET | `/api/leaves/my-leaves` | Current user's leave requests |
| GET | `/api/leaves/balance/:id` | Leave balance for employee |
| POST | `/api/leaves/apply` | Submit a leave request |
| PATCH | `/api/leaves/:id/approve` | Approve a leave request |
| PATCH | `/api/leaves/:id/reject` | Reject a leave request |

### ovds — Invoices & Bills
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ovds/invoices` | List invoices (paginated, filter by status/date) |
| POST | `/api/ovds/invoices` | Create an invoice |
| PATCH | `/api/ovds/invoices/:id` | Update an invoice |
| DELETE | `/api/ovds/invoices/:id` | Delete an invoice (restores stock) |
| GET | `/api/ovds/invoices/stats` | Invoice stats with MoM trends |
| POST | `/api/ovds/invoices/:id/send` | Send a draft invoice (DRAFT → PENDING) |
| POST | `/api/ovds/invoices/:id/payments` | Record a payment |
| GET | `/api/ovds/invoices/:id/payments` | Get payments for an invoice |
| POST | `/api/ovds/invoices/:id/credit-note` | Create a credit note (refund) |
| POST | `/api/ovds/invoices/:id/duplicate` | Duplicate an invoice |
| GET | `/api/ovds/bills` | List all bills |
| POST | `/api/ovds/bills` | Create a bill |
| PATCH | `/api/ovds/bills/:id` | Update a bill |
| DELETE | `/api/ovds/bills/:id` | Delete a bill |

### ovds — Customers & Vendors
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ovds/customers/registry` | List customer registry |
| POST | `/api/ovds/customers/registry` | Create customer |
| PATCH | `/api/ovds/customers/registry/:id` | Update customer |
| DELETE | `/api/ovds/customers/registry/:id` | Delete customer |
| POST | `/api/ovds/customers/bulk-import` | Bulk import customers from CSV |
| GET | `/api/ovds/vendors` | List all vendors |
| POST | `/api/ovds/vendors` | Create a vendor |
| PATCH | `/api/ovds/vendors/:id` | Update a vendor |
| DELETE | `/api/ovds/vendors/:id` | Delete a vendor |
| POST | `/api/ovds/vendors/bulk-import` | Bulk import vendors from CSV |

### ovds — Items & Inventory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ovds/items` | List all items |
| POST | `/api/ovds/items` | Create an item |
| PATCH | `/api/ovds/items/:id` | Update an item (including stock) |
| DELETE | `/api/ovds/items/:id` | Delete an item |
| POST | `/api/ovds/items/bulk-import` | Bulk import items from CSV |
| GET | `/api/ovds/inventory` | Inventory valuation (FIFO/WA) |

### ovds — Accounting (GL)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ovds/accounts` | List all GL accounts |
| GET | `/api/ovds/accounts/balances` | All accounts with current GL balance |
| POST | `/api/ovds/accounts` | Create a GL account |
| PATCH | `/api/ovds/accounts/:id` | Update a GL account |
| POST | `/api/ovds/accounts/seed` | Seed default Ethiopian chart of accounts |
| POST | `/api/ovds/accounts/bulk-import` | Bulk import accounts from CSV |
| GET | `/api/ovds/accounts/:id/ledger` | Account ledger with running balance |
| GET | `/api/ovds/journal-entries` | List journal entries |
| POST | `/api/ovds/journal-entries` | Create a journal entry |
| DELETE | `/api/ovds/journal-entries/:id` | Delete a journal entry |
| GET | `/api/ovds/bank-accounts` | List bank accounts |
| POST | `/api/ovds/bank-accounts` | Create a bank account |
| POST | `/api/ovds/bank-accounts/:id/transactions` | Record a bank transaction |
| PATCH | `/api/ovds/bank-transactions/:id/reconcile` | Mark transaction as reconciled |
| POST | `/api/ovds/periods/lock` | Lock an accounting period |
| POST | `/api/ovds/periods/unlock` | Unlock an accounting period (Admin only) |

### ovds — Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ovds/reports/balance-sheet` | Balance Sheet |
| GET | `/api/ovds/reports/profit-loss` | Profit & Loss Statement |
| GET | `/api/ovds/reports/trial-balance` | Trial Balance |
| GET | `/api/ovds/reports/ar-aging` | AR Aging (0/30/60/90/90+ days) |
| GET | `/api/ovds/reports/ap-aging` | AP Aging (0/30/60/90/90+ days) |
| GET | `/api/ovds/reports/cash-flow` | Cash Flow Statement |
| GET | `/api/ovds/reports/financial-summary` | Financial health summary |
| GET | `/api/ovds/reports/health-score` | Financial health score A–F |
| GET | `/api/ovds/reports/sales-tax-summary` | Monthly VAT summary |

### ovds — VAT & Tax Filing
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ovds/vat/filings` | List VAT filings |
| POST | `/api/ovds/vat/filings/calculate` | Calculate VAT for a period (auto-posts GL) |
| GET | `/api/ovds/vat/summary` | Current month VAT summary |
| DELETE | `/api/ovds/vat/filings/:id` | Delete a VAT filing |
| GET | `/api/tax/liability-estimate` | Live pre-computation of VAT + TOT + WHT liability |
| POST | `/api/tax/pension-submission` | Record a pension submission to ERCA |
| GET | `/api/tax/pension-submission` | List pension submissions (paginated, filter by period) |
| POST | `/api/tax/payment-reference` | Generate an MoR payment voucher for a filing |
| GET | `/api/tax/payment-reference/:id` | Get a specific payment voucher |
| GET | `/api/tax/wht-certificates` | List WHT certificates for the period |
| POST | `/api/tax/wht-certificates/generate` | Generate WHT certificates for all qualifying vendors |
| GET | `/api/tax/tot/filings` | List TOT filings |
| POST | `/api/tax/tot/calculate` | Calculate TOT for a period |
| GET | `/api/disaster-fund/summary` | Fund contribution summary |
| POST | `/api/disaster-fund/bulk-remit` | Bulk remit contributions |
| GET | `/api/disaster-fund/export-csv` | Export contributions as CSV |

### IoT & Devices
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/iot/devices` | List registered IoT devices |
| POST | `/api/iot/devices` | Register a new device |
| PATCH | `/api/iot/devices/:id` | Update device details or status |
| DELETE | `/api/iot/devices/:id` | Deregister a device |
| POST | `/api/iot/devices/:id/token` | Generate or rotate a device API token |
| POST | `/api/iot/devices/:id/test` | Send a test ping to verify device connectivity |
| POST | `/api/iot/events` | Ingest a device event (called by device, not user) |
| GET | `/api/iot/events` | List IoT events (paginated, filter by deviceId/type/date) |
| GET | `/api/iot/telemetry` | Aggregated telemetry data for the current period |
| GET | `/api/iot/alerts` | List device alerts |
| PATCH | `/api/iot/alerts/:id/acknowledge` | Acknowledge a device alert |
| GET | `/api/iot/ota/packages` | List available OTA firmware packages |
| POST | `/api/iot/ota/deploy` | Deploy an OTA update to one or all devices |

### Digital Payments — Telebirr & Chapa
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/banking/digital-payments` | List Telebirr + Chapa transactions |
| GET | `/api/banking/digital-payments/unmatched` | List unmatched digital payment receipts |
| POST | `/api/banking/digital-payments/:id/match` | Manually match a payment to an invoice |
| POST | `/api/webhooks/telebirr` | Telebirr payment callback (called by Telebirr) |
| POST | `/api/webhooks/chapa` | Chapa payment callback (called by Chapa) |

### CRM
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/crm/deals` | List deals (paginated, filter by stage) |
| POST | `/api/crm/deals` | Create a deal |
| PATCH | `/api/crm/deals/:id` | Update a deal (including stage move) |
| DELETE | `/api/crm/deals/:id` | Delete a deal |

### Settings & System
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/settings` | Get system settings |
| POST | `/api/settings` | Save system settings |
| GET | `/api/settings/export` | Export full system backup (JSON) |
| GET | `/api/dashboard/audit-logs` | Get audit logs (paginated) |
| GET | `/api/dashboard/audit-logs/export-csv` | Export audit logs as CSV |
| GET | `/api/health/detailed` | System health check |
| GET | `/api/dashboard/stats` | Dashboard stats (30s cache) |

---

## Pagination

All list endpoints support pagination via query parameters:

```
GET /api/employees?take=20&skip=0&search=abebe&departmentId=clx...
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `take` | number | 20 | Number of records to return |
| `skip` | number | 0 | Number of records to skip |
| `search` | string | — | Full-text search |
| `companyId` | string | from JWT | Company context |

**Paginated response shape:**
```json
{
  "data": {
    "data": [...],
    "total": 150,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## Error Responses

| Status | Meaning | Common Cause |
|--------|---------|-------------|
| 400 | Bad Request | Validation error in request body |
| 401 | Unauthorized | Missing or expired JWT |
| 402 | Payment Required | Subscription expired |
| 403 | Forbidden | Insufficient RBAC permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate record (e.g., duplicate employee ID) |
| 422 | Unprocessable Entity | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Database or dependency down |

**Error response shape:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions: requires invoices:write",
  "error": "Forbidden"
}
```

---

## Swagger UI

The interactive Swagger UI is available at:
- **Development:** `http://localhost:3000/api/docs`
- **Production:** `https://your-domain.com/api/docs`

Features:
- Try any endpoint directly from the browser
- Authenticate with your JWT token (click **Authorize**)
- View request/response schemas
- Download the OpenAPI spec as JSON

---

## WebSocket (Real-Time)

OVDS uses Socket.io for real-time updates. Connect to the `/realtime` namespace:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/realtime', {
  auth: { token: 'Bearer <your-jwt>' }
});

// Listen for events
socket.on('notification', (data) => console.log(data));
socket.on('payroll:updated', (data) => console.log(data));
socket.on('invoice:paid', (data) => console.log(data));
```

**Events emitted by server:**
| Event | Payload | Trigger |
|-------|---------|---------|
| `notification` | `{ id, title, message, type }` | New notification created |
| `payroll:updated` | `{ employeeId, status }` | Payroll workflow status change |
| `invoice:paid` | `{ invoiceId, amount }` | Invoice payment recorded |
| `attendance:checkin` | `{ employeeId, time }` | Employee checks in |
| `vat:filed` | `{ period, amount }` | VAT return filed |

---

## Building a Module

See [AGENTS.md](AGENTS.md) for the full module development guide. Quick reference:

```typescript
// 1. Create NestJS module
@Module({
  imports: [PrismaModule],
  controllers: [MyModuleController],
  providers: [MyModuleService],
})
export class MyModuleModule {}

// 2. Register in app.module.ts
imports: [..., MyModuleModule]

// 3. Create React page
// frontend/src/pages/MyModule.tsx

// 4. Register route in App.tsx
const MyModule = lazyWithRetry(() => import('./pages/MyModule'));
// Add to ROUTES array: ['/my-module', MyModule]

// 5. Add to RBAC route policy in rbac.ts
ROUTE_POLICY['/my-module'] = 'my_module:read';
```




