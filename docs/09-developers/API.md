<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-09-08 -->
# RESTful API

OVDS provides a RESTful API to create, read, update, and delete (CRUD) all entities of OVDS.

---

## Authentication

The OVDS API uses **Bearer JWT** authentication. Obtain a token by calling `POST /api/auth/login` with your email and password. Include the token in every subsequent request:

```http
Authorization: Bearer <token>
```

Any user with the `api_docs:read` permission may access the API. By default, OVDS grants this permission to the `SPURADMIN`, `ADMIN`, and `ovds` roles. Permissions for CRUD actions follow the default [RBAC policy](AGENTS.md#rbac-system).

> **Sensitive endpoints** (`/users`, `/settings`, `/audit-logs`, `/vat-administration`, `/payroll-administration`) require MFA step-up for Auth0 sessions. See [Guard Order](#guard-order) below.

---

## Postman Collections

The OVDS Postman collection covers the full API including the MoR/ERCA e-invoice lifecycle:

```
postman/EimsCoreApiMockCollection.postman_collection.json
postman/EimsCoreApiMockEnvironment.postman_environment.json
```

Import both files into Postman, select the **EimsCoreApiMockLocal** environment, fill in your MoR credentials, and run `Authentication > login` first to obtain a bearer token that is auto-injected into all subsequent requests.

See [`postman/README.md`](../../postman/README.md) for the full import and usage guide, including Newman (CLI) instructions for CI pipelines.

---

## Swagger UI

The interactive Swagger UI is available at:

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000/api/docs` |
| Production  | `https://your-domain.com/api/docs` |

Click **Authorize**, paste your JWT, and try any endpoint directly from the browser. You can also download the full OpenAPI spec as JSON from the Swagger UI.

---

## Routes

The full list of API endpoints is registered in the NestJS module tree under `apps/backend/src/`. Each domain module declares its own controller and routes. You may add API endpoints to your own module:

```typescript
// apps/backend/src/my-module/my-module.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * 'AnyAuthGuard + CompanyGuard + RBACGuard' applied to all routes.
 * Full route becomes /api/my-module/...
 *
 * @see apps/backend/src/app.module.ts
 */
@Controller('my-module')
@UseGuards(AnyAuthGuard, CompanyGuard, RBACGuard)
@Roles('my_module:read')
export class MyModuleController {
  @Get('posts/:id/enable')
  enable(@Param('id') id: string) { ... }

  @Get('posts/:id/disable')
  disable(@Param('id') id: string) { ... }

  @Get('posts')
  findAll() { ... }

  @Post('posts')
  create(@Body() body: CreatePostDto) { ... }

  @Patch('posts/:id')
  update(@Param('id') id: string, @Body() body: UpdatePostDto) { ... }

  @Delete('posts/:id')
  remove(@Param('id') id: string) { ... }
}
```

Check out the `ovds` module at `apps/backend/src/ovds/ovds.controller.ts` as a full working example.

---

## API Resources (DTOs)

OVDS uses **Data Transfer Objects (DTOs)** backed by `class-validator` and `class-transformer` to consistently shape API inputs and outputs. DTOs are co-located with their module:

```
apps/backend/src/
├── ovds/dto/               # Invoice, Bill, Item, Payment DTOs
├── hr/dto/                 # Employee, Attendance, Leave DTOs
├── auth/dto/               # Login, Register, ChangePassword DTOs
└── common/dto/             # Shared pagination, filter, response DTOs
```

All list responses are wrapped by `TransformInterceptor` in a consistent envelope:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "success": true
}
```

The `useApiQuery` hook in the frontend automatically unwraps this envelope — `result.data` gives you the payload directly.

Feel free to read the [NestJS documentation](https://docs.nestjs.com/techniques/serialization) for further details on serialization and DTO patterns.

---

## Guard Order

Every request passes through guards in this exact order:

```
ThrottlerGuard → AnyAuthGuard → CompanyGuard → RBACGuard
```

| Guard | Responsibility |
|-------|---------------|
| `ThrottlerGuard` | Rate limiting — 100 req/min per IP globally; stricter on auth endpoints |
| `AnyAuthGuard` | Validates JWT (HS256 local or RS256 Auth0) |
| `CompanyGuard` | Injects `req.companyId` from JWT; validates company exists |
| `RBACGuard` | Checks `@Roles()` decorator; `SPURADMIN` bypasses all |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| All endpoints (default) | 100 req/min per IP |
| `POST /api/auth/login` | 10/min |
| `POST /api/auth/register` | 5/min |

Individual endpoints can override with `@Throttle()`.

---

## Core Endpoints

### Authentication

#### Session & Identity

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Login — returns JWT + sets `httpOnly` cookies | Public |
| POST | `/api/auth/register` | Register a new user | Public |
| GET  | `/api/auth/check-email` | Check if an email is already registered (`?email=`) | Public |
| GET  | `/api/auth/profile` | Current user profile (from JWT) | Bearer |
| GET  | `/api/auth/me` | Full current user object (re-validated from DB) | Bearer |
| POST | `/api/auth/logout` | Logout — clears cookies + audit log | Bearer |
| POST | `/api/auth/refresh` | Refresh access token using refresh cookie | Bearer |
| POST | `/api/auth/change-password` | Change authenticated user password | Bearer |

#### Password Reset & OTP

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/forgot-password` | Send OTP reset code to email | Public |
| POST | `/api/auth/reset-password` | Reset password with OTP code | Public |
| POST | `/api/auth/otp/send` | Send OTP for a specific purpose (e.g. `mfa`, `email-verify`) | Public |
| POST | `/api/auth/otp/verify` | Verify an OTP code | Public |

#### Alternative Login Methods

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/auth0/session` | Exchange Auth0 RS256 token for local HS256 JWT | Public |
| GET  | `/api/auth/auth0/status` | Check if Auth0 enforcement is enabled | Public |
| GET  | `/api/auth/google/status` | Check if Google OAuth is enabled | Public |
| POST | `/api/auth/fayda/login` | Login with Ethiopian Fayda National ID + PIN | Public |
| POST | `/api/auth/tin/login` | Login with TIN + PIN (ERCA-linked accounts) | Public |
| POST | `/api/auth/ekyb/verify` | eKYB identity verification (Fayda ID + optional TIN) | Bearer |

#### Push Notifications

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/fcm-token` | Register a Firebase Cloud Messaging device token | Bearer |

#### API Key Management

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET    | `/api/auth/api-keys` | List API keys for the current user | Bearer |
| POST   | `/api/auth/api-keys` | Create a named API key | Bearer |
| DELETE | `/api/auth/api-keys/:id` | Revoke an API key | Bearer |

#### User Administration (`ADMIN` / `SPURADMIN` only)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET    | `/api/auth/users` | List all users (paginated) | Bearer + `users:read` |
| PATCH  | `/api/auth/users/:id` | Update user profile or role | Bearer + `users:write` |
| DELETE | `/api/auth/users/:id` | Delete a user | Bearer + `users:delete` |
| POST   | `/api/auth/users/:id/reset-password` | Admin-forced password reset | Bearer + `users:write` |
| GET    | `/api/auth/users/:id/roles` | Get roles assigned to a user | Bearer + `users:read` |
| POST   | `/api/auth/users/:id/roles` | Assign roles to a user | Bearer + `users:write` |

**Login request/response:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ovds@ovds.com",
  "password": "fin_pass_2026"
}
```

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx...",
      "username": "ovds@ovds.com",
      "role": "ovds",
      "companyId": "clx..."
    }
  }
}
```

> The server also sets two `httpOnly` cookies — `access_token` and `refresh_token` — for browser-based clients. API consumers should use the `accessToken` from the JSON body.

---

### HR — Employees

All HR routes are served under the `/api/hr` prefix (`@Controller('hr')`).

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET    | `/api/hr/employees` | `employees:read` | List employees (paginated, filter by `departmentId`, `search`) |
| GET    | `/api/hr/employees/:id` | `employees:read` | Get employee by ID |
| POST   | `/api/hr/employees` | `employees:write` | Create employee |
| PUT    | `/api/hr/employees/:id` | `employees:write` | Update employee |
| DELETE | `/api/hr/employees/:id` | `employees:delete` | Delete employee |
| GET    | `/api/employees/payroll-status-summary` | `payroll:read` | Payroll config status per employee |
| POST   | `/api/employees/bulk-import` | `employees:write` | Bulk import from CSV rows |

### HR — Departments

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET    | `/api/hr/departments` | `employees:read` | List departments |
| GET    | `/api/hr/departments/:id` | `employees:read` | Get department by ID |
| POST   | `/api/hr/departments` | `ADMIN`, `HR` | Create department |
| PUT    | `/api/hr/departments/:id` | `ADMIN`, `HR` | Update department |
| DELETE | `/api/hr/departments/:id` | `ADMIN` | Delete department |

### HR — Attendance

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST   | `/api/hr/attendance/check-in` | `attendance:write` | Biometric/GPS check-in (`employeeId`, `method`, `latitude`, `longitude`) |
| POST   | `/api/hr/attendance/check-out` | `attendance:write` | Biometric/GPS check-out |
| GET    | `/api/hr/attendance` | `attendance:read` | List attendance records (paginated) |
| PATCH  | `/api/hr/attendance/verify/:id` | `attendance:verify` | Verify an attendance record |
| DELETE | `/api/hr/attendance/:id` | `attendance:delete` | Delete attendance record |

### HR — Payroll

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/payroll` | Payroll summaries (paginated, filter by year/month/dept) |
| GET    | `/api/payroll/dashboard-stats` | Payroll dashboard KPIs |
| GET    | `/api/payroll/employee-history/:employeeId` | 12-month payroll history |
| GET    | `/api/payroll/export-csv/:year/:month` | Export payroll as CSV |
| GET    | `/api/payroll/export-pdf/:year/:month` | Export payroll as PDF |
| PATCH  | `/api/payroll/workflow/:employeeId` | Advance workflow (`GENERATED → VERIFIED → FINALIZED → APPROVED`) |
| PATCH  | `/api/payroll/bulk-workflow` | Bulk advance workflow for multiple employees |

### HR — Leaves

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/leaves` | List all leave requests (admin) |
| GET    | `/api/leaves/my-leaves` | Current user's leave requests |
| GET    | `/api/leaves/balance/:id` | Leave balance for employee |
| POST   | `/api/leaves/apply` | Submit a leave request |
| PATCH  | `/api/leaves/:id/approve` | Approve a leave request |
| PATCH  | `/api/leaves/:id/reject` | Reject a leave request |

### HR — Gratuity (Ethiopian Labour Proclamation No. 1156/2019)

Gratuity amounts are calculated per the statutory formula:
- < 1 year service → 0
- 1–3 years → 1 month salary × years
- 3–10 years → 1.5 months salary × years
- 10+ years → 2 months salary × years

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST   | `/api/hr/gratuity/calculate` | `ADMIN`, `HR`, `FINANCE` | Calculate gratuity entitlement for an employee (`employeeId`, optional `asOfDate`) |
| GET    | `/api/hr/gratuity` | `ADMIN`, `HR`, `FINANCE` | List gratuity records |
| POST   | `/api/hr/gratuity` | `ADMIN`, `HR`, `FINANCE` | Create a gratuity record |
| PATCH  | `/api/hr/gratuity/:id` | `ADMIN`, `HR`, `FINANCE` | Update a gratuity record |
| POST   | `/api/hr/gratuity/:id/mark-paid` | `ADMIN`, `FINANCE` | Mark gratuity as paid (`paidAt`, `paidBy`, `paymentRef`) |

---

### Invoices & Estimates

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/invoices` | List invoices (paginated, filter by status/date) |
| POST   | `/api/ovds/invoices` | Create an invoice |
| GET    | `/api/ovds/invoices/stats` | Invoice stats with MoM trends |
| GET    | `/api/ovds/invoices/next-number` | Preview the next invoice number |
| GET    | `/api/ovds/invoices/:id` | Get invoice by ID |
| PATCH  | `/api/ovds/invoices/:id` | Update an invoice |
| DELETE | `/api/ovds/invoices/:id` | Delete an invoice (restores stock) |
| POST   | `/api/ovds/invoices/:id/send` | Send a draft invoice (`DRAFT → PENDING`) |
| POST   | `/api/ovds/invoices/:id/send-reminder` | Send a payment reminder for an overdue invoice |
| POST   | `/api/ovds/invoices/:id/void` | Void an invoice |
| POST   | `/api/ovds/invoices/:id/cancel` | Cancel an invoice |
| POST   | `/api/ovds/invoices/:id/mark-paid` | Mark invoice as fully paid |
| POST   | `/api/ovds/invoices/:id/payments` | Record a payment |
| GET    | `/api/ovds/invoices/:id/payments` | Get payments for an invoice |
| POST   | `/api/ovds/invoices/:id/credit-note` | Create a credit note (refund) |
| POST   | `/api/ovds/invoices/:id/duplicate` | Duplicate an invoice |
| GET    | `/api/ovds/invoices/:id/activity` | Invoice activity log |
| GET    | `/api/ovds/invoices/:id/pdf` | Download invoice as PDF |
| POST   | `/api/ovds/invoices/bulk-send` | Bulk send draft invoices |
| POST   | `/api/ovds/invoices/bulk-cancel` | Bulk cancel invoices |
| POST   | `/api/ovds/invoices/flag-overdue` | Flag overdue invoices (cron-triggered) |
| GET    | `/api/ovds/estimates` | List estimates |
| POST   | `/api/ovds/estimates` | Create an estimate |
| GET    | `/api/ovds/estimates/stats` | Estimate stats |
| GET    | `/api/ovds/estimates/:id` | Get estimate by ID |
| PATCH  | `/api/ovds/estimates/:id` | Update an estimate |
| DELETE | `/api/ovds/estimates/:id` | Delete an estimate |
| POST   | `/api/ovds/estimates/:id/send` | Send an estimate to customer |
| POST   | `/api/ovds/estimates/:id/convert` | Convert accepted estimate to invoice |

---

### Bills & Vendors

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/bills` | List all bills |
| POST   | `/api/ovds/bills` | Create a bill |
| PATCH  | `/api/ovds/bills/:id` | Update a bill |
| DELETE | `/api/ovds/bills/:id` | Delete a bill |
| GET    | `/api/ovds/vendors` | List all vendors |
| POST   | `/api/ovds/vendors` | Create a vendor |
| PATCH  | `/api/ovds/vendors/:id` | Update a vendor |
| DELETE | `/api/ovds/vendors/:id` | Delete a vendor |
| GET    | `/api/ovds/vendors/:id/bills` | Bills for a specific vendor |
| POST   | `/api/ovds/vendors/bulk-import` | Bulk import vendors from CSV |

---

### Customers

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/customers/registry` | List customer registry |
| POST   | `/api/ovds/customers/registry` | Create customer |
| PATCH  | `/api/ovds/customers/registry/:id` | Update customer |
| DELETE | `/api/ovds/customers/registry/:id` | Delete customer |
| POST   | `/api/ovds/customers/bulk-import` | Bulk import customers from CSV |

---

### Items & Inventory

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/items` | List all items |
| POST   | `/api/ovds/items` | Create an item |
| PATCH  | `/api/ovds/items/:id` | Update an item (including stock) |
| DELETE | `/api/ovds/items/:id` | Delete an item |
| POST   | `/api/ovds/items/bulk-import` | Bulk import items from CSV |
| GET    | `/api/ovds/inventory` | Inventory valuation (FIFO/WA) |
| GET    | `/api/ovds/inventory/items` | Inventory item list with stock levels |
| PATCH  | `/api/ovds/inventory/items/:id` | Adjust inventory item |
| GET    | `/api/ovds/warehouses` | List warehouses |
| POST   | `/api/ovds/warehouses` | Create a warehouse |
| GET    | `/api/ovds/warehouses/:id` | Get warehouse by ID |
| PATCH  | `/api/ovds/warehouses/:id` | Update a warehouse |
| DELETE | `/api/ovds/warehouses/:id` | Delete a warehouse |

---

### Accounting — Chart of Accounts

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/accounts` | List all GL accounts |
| GET    | `/api/ovds/accounts/balances` | All accounts with current GL balance |
| POST   | `/api/ovds/accounts` | Create a GL account |
| PATCH  | `/api/ovds/accounts/:id` | Update a GL account |
| POST   | `/api/ovds/accounts/seed` | Seed default Ethiopian chart of accounts |
| POST   | `/api/ovds/accounts/bulk-import` | Bulk import accounts from CSV |
| GET    | `/api/ovds/accounts/:id/ledger` | Account ledger with running balance |

---

### Accounting — Journal Entries

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/journal-entries` | List journal entries |
| POST   | `/api/ovds/journal-entries` | Create a journal entry |
| GET    | `/api/ovds/journal-entries/:id` | Get journal entry by ID |
| PATCH  | `/api/ovds/journal-entries/:id` | Update a journal entry |
| DELETE | `/api/ovds/journal-entries/:id` | Delete a journal entry |
| GET    | `/api/ovds/journals` | List journals (GL view) |
| POST   | `/api/ovds/journals` | Create a journal |
| GET    | `/api/ovds/journals/:id` | Get journal by ID |
| DELETE | `/api/ovds/journals/:id` | Delete a journal |
| GET    | `/api/ovds/general-ledger` | General ledger view |

---

### Accounting — Banking

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/bank-accounts` | List bank accounts |
| POST   | `/api/ovds/bank-accounts` | Create a bank account |
| POST   | `/api/ovds/bank-accounts/:id/transactions` | Record a bank transaction |
| PATCH  | `/api/ovds/bank-transactions/:id/reconcile` | Mark transaction as reconciled |
| GET    | `/api/ovds/reconciliation-summary` | Bank reconciliation summary |
| POST   | `/api/ovds/periods/lock` | Lock an accounting period |
| POST   | `/api/ovds/periods/unlock` | Unlock an accounting period (Admin only) |
| GET    | `/api/ovds/periods` | List locked periods |

---

### Accounting — Fixed Assets

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/fixed-assets` | List fixed assets |
| GET    | `/api/ovds/fixed-assets/:id` | Get fixed asset by ID |
| POST   | `/api/ovds/fixed-assets` | Create a fixed asset |
| PATCH  | `/api/ovds/fixed-assets/:id` | Update a fixed asset |
| DELETE | `/api/ovds/fixed-assets/:id` | Delete a fixed asset |
| POST   | `/api/ovds/fixed-assets/depreciate-all` | Run depreciation for a period |
| GET    | `/api/ovds/fixed-assets/:id/depreciation-schedule` | Depreciation schedule for an asset |
| GET    | `/api/ovds/fixed-assets/disposals` | List disposals |
| GET    | `/api/ovds/fixed-assets/disposals/:id` | Get disposal by ID |
| POST   | `/api/ovds/fixed-assets/disposals` | Dispose of an asset |
| PATCH  | `/api/ovds/fixed-assets/disposals/:id` | Update a disposal |
| DELETE | `/api/ovds/fixed-assets/disposals/:id` | Delete a disposal |

---

### Accounting — Budget & Cost Centers

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/budget/vs-actual` | Budget vs. actual comparison |
| POST   | `/api/ovds/budget` | Create or update a budget |
| GET    | `/api/ovds/budget/variance-summary` | Budget variance summary |
| GET    | `/api/ovds/budget/variance-detail` | Budget variance detail |
| GET    | `/api/ovds/cost-centers` | List cost centers |
| GET    | `/api/ovds/categories` | List transaction categories |
| POST   | `/api/ovds/categories` | Create a category |

---

### Reports

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/reports/balance-sheet` | Balance Sheet |
| GET    | `/api/ovds/reports/profit-loss` | Profit & Loss Statement |
| GET    | `/api/ovds/reports/trial-balance` | Trial Balance |
| GET    | `/api/ovds/reports/cash-flow` | Cash Flow Statement |
| GET    | `/api/ovds/reports/ar-aging` | AR Aging (0/30/60/90/90+ days) |
| GET    | `/api/ovds/reports/ap-aging` | AP Aging (0/30/60/90/90+ days) |
| GET    | `/api/ovds/reports/expense-summary` | Expense summary by category |
| GET    | `/api/ovds/reports/financial-summary` | Financial health summary |
| GET    | `/api/ovds/reports/health-score` | Financial health score A–F |
| GET    | `/api/ovds/reports/revenue-trend` | 6-month revenue trend |
| GET    | `/api/ovds/reports/export-pdf` | Export any report as PDF |

---

### VAT — Filings & Dashboard

All VAT routes are served under `/api/vat` (`@Controller('vat')`). Required permission: `vat:read` / `vat:write` / `vat:calculate` / `vat:file`.

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET    | `/api/vat/filings` | `vat:read` | List VAT filings (paginated, filter by period/status) |
| POST   | `/api/vat/filings/calculate` | `vat:calculate` | Calculate VAT for a period — auto-posts GL entry |
| GET    | `/api/vat/summary` | `vat:read` | Current month VAT summary (output/input/net) |
| GET    | `/api/vat/dashboard` | `vat:read` | Full VAT dashboard — all 7 KPIs |
| POST   | `/api/vat/filings/:id/lock` | `vat:file` | Lock a filing to prevent further edits |
| DELETE | `/api/vat/filings/:id` | `vat:delete` | Delete a draft VAT filing |
| GET    | `/api/vat/period/:period/summary` | `vat:read` | Period-level output/input/net summary (`YYYY-MM`) |

#### VAT — Apportionment

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vat/filings/:id/apportionment` | Get input VAT apportionment for a filing |
| PATCH  | `/api/vat/filings/:id/apportionment` | Update apportionment percentages |

#### VAT — Input Ledger

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vat/input-ledger` | List input VAT ledger entries (merged with Bills that have `vatAmount > 0`) |
| POST   | `/api/vat/input-ledger` | Create a manual input ledger entry |
| PATCH  | `/api/vat/input-ledger/:id` | Update an input ledger entry |
| DELETE | `/api/vat/input-ledger/:id` | Delete an input ledger entry |

#### VAT — Output Ledger

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vat/output-ledger` | List output VAT ledger entries (merged with Invoices that have `vatAmount > 0`) |
| POST   | `/api/vat/output-ledger` | Create a manual output ledger entry |
| PATCH  | `/api/vat/output-ledger/:id` | Update an output ledger entry |
| DELETE | `/api/vat/output-ledger/:id` | Delete an output ledger entry |

#### VAT — Withholding

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vat/withholding` | List withholding VAT entries |
| POST   | `/api/vat/withholding` | Create a withholding VAT entry (15% withheld from supplier) |
| PATCH  | `/api/vat/withholding/:id/toggle` | Toggle remitted status |
| DELETE | `/api/vat/withholding/:id` | Delete a withholding entry |

#### VAT — Reverse Charges

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vat/reverse-charges` | List reverse-charge entries (foreign supplier services) |
| POST   | `/api/vat/reverse-charges` | Create a reverse-charge entry (`vatDue = amountETB × 15%`) |
| DELETE | `/api/vat/reverse-charges/:id` | Delete a reverse-charge entry |

#### VAT — Refund Claims

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vat/refund-claims` | List input VAT refund claims submitted to ERCA |
| POST   | `/api/vat/refund-claims` | Create a refund claim (auto-ref `REF-YYYY-NNN`) |
| PATCH  | `/api/vat/refund-claims/:id/status` | Update claim status (`PENDING → APPROVED / REJECTED`) |
| DELETE | `/api/vat/refund-claims/:id` | Delete a refund claim |

#### VAT — Notes

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vat/notes` | List internal VAT compliance notes |
| POST   | `/api/vat/notes` | Create a compliance note |
| DELETE | `/api/vat/notes/:id` | Delete a compliance note |

#### VAT — Zero-Rated Export Evidence

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vat/export-evidence` | List zero-rated export evidence records |
| POST   | `/api/vat/export-evidence` | Create an export evidence record (customs decl, bill of lading, bank receipt) |
| PATCH  | `/api/vat/export-evidence/:id/cycle` | Cycle field status: `missing → partial → complete → missing` |
| DELETE | `/api/vat/export-evidence/:id` | Delete an export evidence record |

#### VAT — eTax Submissions

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vat/etax-submissions` | List eTax portal submission records |
| POST   | `/api/vat/etax-submissions` | Submit a VAT return to ERCA eTax portal — generates `ETAX-VATRETURN-YYYY-MM-XXXXX` |
| POST   | `/api/vat/declaration` | Submit a full VAT declaration (TIN-validated) |
| GET    | `/api/vat/declaration/:id` | Get a VAT declaration by ID |
| GET    | `/api/vat/declarations` | List VAT declarations (filter by `companyId`, `taxPeriod`) |

#### VAT — IRN (Invoice Registration Number)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vat/irn/:irn` | Look up a registered invoice by IRN |
| GET    | `/api/vat/irn/invoice/:invoiceId` | Get the IRN registered for a specific invoice |

---

### Tax — Rates & Configuration

Routes under `/api/tax` (`@Controller('tax')`).

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/tax/rates` | List all tax rates |
| POST   | `/api/tax/rates/seed` | Seed standard Ethiopian tax rates (VAT 15%, TOT 2%, WHT 2%/15%) |
| GET    | `/api/ovds/tax-rates` | List tax rates (accounting view) |
| POST   | `/api/ovds/tax-rates` | Create a tax rate |
| PATCH  | `/api/ovds/tax-rates/:id` | Update a tax rate |
| DELETE | `/api/ovds/tax-rates/:id` | Delete a tax rate |
| POST   | `/api/ovds/tax-rates/seed` | Seed standard Ethiopian tax rates (accounting module) |

#### Tax — WHT Certificates

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/tax/wht/summary` | WHT certificate summary (total issued, remitted, outstanding) |
| GET    | `/api/tax/wht-certificates` | List WHT certificates for the current period |
| POST   | `/api/tax/wht-certificates` | Create a WHT certificate |
| GET    | `/api/ovds/wht-certificates` | WHT certificates — accounting view |
| POST   | `/api/ovds/wht-certificates` | Create a certificate manually |
| POST   | `/api/ovds/wht-certificates/auto-generate` | Auto-generate certificates for all qualifying vendors |
| POST   | `/api/ovds/wht-certificates/:id/issue` | Issue certificate to vendor |
| POST   | `/api/ovds/wht-certificates/:id/cancel` | Cancel a certificate |
| POST   | `/api/ovds/wht-certificates/:id/remit` | Mark withholding remitted to ERCA |

#### Tax — TOT (Turnover Tax)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/tax/tot` | TOT configuration and current status |
| GET    | `/api/tax/tot/filings` | List TOT filings |
| POST   | `/api/tax/tot/filings` | Create a TOT filing |
| POST   | `/api/tax/tot/filings/:id/submit` | Submit a TOT filing to ERCA |

#### Tax — BIT (Business Income Tax)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/tax/bit` | BIT configuration and filing history |
| GET    | `/api/tax/profile` | Company tax profile (TIN, registration, VAT number) |
| GET    | `/api/tax/ack-vault` | Acknowledgement vault — all filed ERCA references |
| GET    | `/api/tax/filings` | All tax filings across types |
| POST   | `/api/tax/filings` | Create a tax filing |

#### Tax — Ledger Views

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/tax/input-ledger` | Tax input ledger (combined VAT/WHT view) |
| GET    | `/api/tax/output-ledger` | Tax output ledger |
| GET    | `/api/tax/reports` | Tax reports (all types, filter by period) |

#### Tax — Compliance & Automation Status

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/tax/compliance/status` | Overall tax compliance status across all obligations |
| GET    | `/api/tax/automation/status` | Automation pipeline status (scheduled jobs, last run times) |

#### Tax — Penalty Calculator

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/tax/period/:period/validate` | Validate a tax period string (`YYYY-MM`) |
| POST   | `/api/tax/penalty/calculate` | Calculate late-filing penalty (`taxType`, `period`, `amountDue`, `daysLate`) |

**Penalty calculation request:**
```json
{
  "taxType": "VAT",
  "period": "2026-07",
  "amountDue": 15000.00,
  "daysLate": 12
}
```

VAT late penalty: **ETB 500/day** per Proclamation No. 1341/2024. TOT and BIT penalties use their respective gazette rates.

#### Tax — DRRF (Disaster Risk Reduction Fund)

Quarterly levy: 5% of annual sales revenue, remitted to ERCA by the 15th of the last month of each quarter.

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/tax/drrf/summary` | DRRF contribution summary (total, remitted, outstanding) |
| GET    | `/api/tax/drrf/filings` | List DRRF filings (paginated) |
| GET    | `/api/tax/drrf/filings/:id` | Get a DRRF filing by ID |
| POST   | `/api/tax/drrf/compute` | Compute DRRF levy for a quarter |
| POST   | `/api/tax/drrf/filings/:id/submit` | Submit a DRRF filing to ERCA |
| GET    | `/api/tax/drrf/contributions` | List individual employee DRRF contributions |
| GET    | `/api/tax/drrf/remittances` | List DRRF remittance records |
| POST   | `/api/tax/drrf/remit` | Record a bulk DRRF remittance |
| GET    | `/api/disaster-fund/summary` | Disaster fund summary (disaster-fund module view) |
| POST   | `/api/disaster-fund/bulk-remit` | Bulk remit disaster fund contributions |
| GET    | `/api/disaster-fund/export-csv` | Export contributions as CSV |

#### Tax — Liability Estimator

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/tax/liability-estimate` | Live pre-computation of VAT + TOT + WHT liability for current period |

#### Tax — Pension Submissions

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/api/tax/pension-submission` | Record a pension submission to ERCA (`period`, `employeeCount`, `totalAmount`) |
| GET    | `/api/tax/pension-submission` | List pension submissions (paginated, filter by period) |

#### Tax — Payment References (MoR Vouchers)

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/api/tax/payment-reference` | Generate an MoR payment voucher for a tax filing |
| GET    | `/api/tax/payment-reference/:id` | Get a specific payment voucher |

---

### IFRS Compliance

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/ifrs15/schedule` | IFRS 15 revenue recognition schedule |
| GET    | `/api/ovds/ifrs15/compliance-check` | IFRS 15 compliance check |
| GET    | `/api/ovds/ifrs15/:invoiceId/contract` | IFRS 15 contract details for an invoice |
| POST   | `/api/ovds/ifrs15/schedule` | Create an IFRS 15 schedule |
| GET    | `/api/ovds/ifrs9/ecl` | IFRS 9 Expected Credit Loss computation |
| POST   | `/api/ovds/ifrs9/ecl/post-provision` | Post ECL provision to GL |
| GET    | `/api/ovds/deferred-tax` | Deferred tax asset/liability computation |
| POST   | `/api/ovds/deferred-tax/post` | Post deferred tax entry to GL |

---

### Multi-Company & Consolidation

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/companies` | List companies |
| POST   | `/api/ovds/companies` | Create a company |
| PATCH  | `/api/ovds/companies/:id` | Update a company |
| DELETE | `/api/ovds/companies/:id` | Delete a company |
| GET    | `/api/ovds/entity-groups` | List entity groups (consolidation) |
| GET    | `/api/ovds/entity-groups/:id` | Get entity group by ID |
| POST   | `/api/ovds/entity-groups` | Create an entity group |
| PATCH  | `/api/ovds/entity-groups/:id` | Update an entity group |
| DELETE | `/api/ovds/entity-groups/:id` | Delete an entity group |
| GET    | `/api/ovds/translation-reserves` | List translation reserves (IFRS 21) |
| POST   | `/api/ovds/translation-reserves` | Create a translation reserve entry |

---

### Currency

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/currency/rates` | List currency rates |
| POST   | `/api/ovds/currency/convert` | Convert between currencies |
| POST   | `/api/ovds/currency/rates` | Upsert a currency rate |
| GET    | `/api/ovds/currency/rates/live` | Fetch live rates from NBE |

---

### Banking — Accounts & Transactions

All routes under `/api/banking` (`@Controller('banking')`). Required permission: `banking:read` / `banking:write` / `banking:delete`.

#### Bank Accounts

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET    | `/api/banking/accounts` | `banking:read` | List bank accounts for the company |
| GET    | `/api/banking/accounts/:id` | `banking:read` | Get bank account by ID |
| POST   | `/api/banking/accounts` | `banking:write` | Create a bank account |
| PUT    | `/api/banking/accounts/:id` | `banking:write` | Update a bank account |
| DELETE | `/api/banking/accounts/:id` | `banking:delete` | Delete a bank account (blocked if it has transactions) |

#### Bank Transactions

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET    | `/api/banking/transactions` | `ADMIN`, `FINANCE`, `EMPLOYEE` | List transactions (paginated, filter by account/date) |
| GET    | `/api/banking/transactions/:id` | `ADMIN`, `FINANCE`, `EMPLOYEE` | Get transaction by ID |
| POST   | `/api/banking/transactions` | `ADMIN`, `FINANCE` | Record a bank transaction |
| PATCH  | `/api/banking/transactions/:id` | `ADMIN`, `FINANCE` | Update a transaction |
| DELETE | `/api/banking/transactions/:id` | `ADMIN`, `FINANCE` | Delete a transaction (reverses balance) |

#### Fund Transfers

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET    | `/api/banking/transfers` | `ADMIN`, `FINANCE`, `EMPLOYEE` | List fund transfers |
| GET    | `/api/banking/transfers/:id` | `ADMIN`, `FINANCE`, `EMPLOYEE` | Get transfer by ID |
| POST   | `/api/banking/transfers` | `ADMIN`, `FINANCE` | Create a fund transfer (auto-posts GL) |
| PATCH  | `/api/banking/transfers/:id` | `ADMIN`, `FINANCE` | Update a transfer |
| DELETE | `/api/banking/transfers/:id` | `ADMIN`, `FINANCE` | Delete a transfer |

#### Reconciliation

| Method | Path | Description |
|--------|------|-------------|
| PATCH  | `/api/ovds/bank-transactions/:id/reconcile` | Mark a single transaction as reconciled (`PENDING → RECONCILED`) |
| POST   | `/api/ovds/bank-accounts/:id/bulk-reconcile` | Bulk reconcile transactions (`{ transactionIds: [...] }`) |
| GET    | `/api/ovds/reconciliation-summary` | Summary: total, reconciled, pending counts per account |

#### Digital Payments — Telebirr & Chapa

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/banking/digital-payments` | List Telebirr + Chapa transactions |
| GET    | `/api/banking/digital-payments/unmatched` | Unmatched digital payment receipts |
| POST   | `/api/banking/digital-payments/:id/match` | Manually match a receipt to an invoice |
| POST   | `/api/webhooks/telebirr` | Telebirr payment callback *(called by Telebirr, not your code)* |
| POST   | `/api/webhooks/chapa` | Chapa payment callback *(called by Chapa)* |
| POST   | `/api/webhooks/cbe-birr` | CBE Birr payment callback *(called by CBE)* |

---

### IoT & Devices

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/iot/devices` | List registered IoT devices |
| POST   | `/api/iot/devices` | Register a new device |
| PATCH  | `/api/iot/devices/:id` | Update device details or status |
| DELETE | `/api/iot/devices/:id` | Deregister a device |
| POST   | `/api/iot/devices/:id/token` | Generate or rotate a device API token |
| POST   | `/api/iot/devices/:id/test` | Send a test ping to verify connectivity |
| POST   | `/api/iot/events` | Ingest a device event (called by device) |
| GET    | `/api/iot/events` | List IoT events (paginated) |
| GET    | `/api/iot/telemetry` | Aggregated telemetry data |
| GET    | `/api/iot/alerts` | List device alerts |
| PATCH  | `/api/iot/alerts/:id/acknowledge` | Acknowledge a device alert |
| GET    | `/api/iot/ota/packages` | List available OTA firmware packages |
| POST   | `/api/iot/ota/deploy` | Deploy an OTA update to one or all devices |

---

### CRM

All CRM routes are served under `/api/crm` (`@Controller('crm')`). Required roles: `ADMIN`, `SALES`, or `CRM` unless noted.

#### Leads

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/crm/leads` | List leads (paginated) |
| GET    | `/api/crm/leads/:id` | Get lead by ID |
| POST   | `/api/crm/leads` | Create a lead |
| PUT    | `/api/crm/leads/:id` | Update a lead |
| DELETE | `/api/crm/leads/:id` | Delete a lead (`ADMIN` only) |
| POST   | `/api/crm/leads/:id/convert` | Convert lead → opportunity (`{ customerId }`) |

#### Opportunities

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/crm/opportunities` | List opportunities (paginated) |
| GET    | `/api/crm/opportunities/:id` | Get opportunity by ID |
| POST   | `/api/crm/opportunities` | Create an opportunity |
| PUT    | `/api/crm/opportunities/:id` | Update an opportunity (including stage move) |
| DELETE | `/api/crm/opportunities/:id` | Delete an opportunity (`ADMIN` only) |
| POST   | `/api/crm/opportunities/:id/convert` | Convert opportunity → draft invoice |

#### Activities

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/crm/activities` | List activities (paginated, filter by type/date) |
| POST   | `/api/crm/activities` | Create an activity (call, meeting, email, task) |
| POST   | `/api/crm/activities/:id/complete` | Mark an activity as completed |

#### Contacts

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/crm/contacts` | List contacts (paginated) |
| POST   | `/api/crm/contacts` | Create a contact |
| PUT    | `/api/crm/contacts/:id` | Update a contact |
| DELETE | `/api/crm/contacts/:id` | Delete a contact (`ADMIN` only) |
| GET    | `/api/crm/customers/registry` | Customer registry (for linking to invoices) |
| GET    | `/api/crm/customers/me` | Current user's customer profile |

#### CRM Companies

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/crm/companies` | List CRM companies |
| POST   | `/api/crm/companies` | Create a CRM company |
| PUT    | `/api/crm/companies/:id` | Update a CRM company |
| DELETE | `/api/crm/companies/:id` | Delete a CRM company (`ADMIN` only) |

#### Deals & Pipelines

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/crm/deals` | List deals (paginated, filter by stage/pipeline) |
| GET    | `/api/crm/deals/stats` | Deal stats (count, value by stage) |
| POST   | `/api/crm/deals` | Create a deal |
| PUT    | `/api/crm/deals/:id` | Update a deal (including stage move) |
| DELETE | `/api/crm/deals/:id` | Delete a deal (`ADMIN` only) |
| GET    | `/api/crm/pipelines` | List pipelines |
| POST   | `/api/crm/pipelines` | Create a pipeline (`ADMIN` only) |
| PUT    | `/api/crm/pipelines/:id` | Update a pipeline (`ADMIN` only) |
| DELETE | `/api/crm/pipelines/:id` | Delete a pipeline (`ADMIN` only) |

---

### Settings & System

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/settings` | Get system settings |
| POST   | `/api/settings` | Save system settings |
| GET    | `/api/settings/export` | Export full system backup (JSON) |
| GET    | `/api/dashboard/audit-logs` | Get audit logs (paginated) |
| GET    | `/api/dashboard/audit-logs/export-csv` | Export audit logs as CSV |
| GET    | `/api/health/detailed` | System health check |
| GET    | `/api/dashboard/stats` | Dashboard stats (30 s cache) |

---

### Purchases — Expenses & Orders

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/expenses` | List expenses (paginated, filter by category/date) |
| POST   | `/api/ovds/expenses` | Create an expense |
| GET    | `/api/ovds/purchase-orders` | List purchase orders |
| POST   | `/api/ovds/purchase-orders` | Create a purchase order |
| PATCH  | `/api/ovds/purchase-orders/:id` | Update a purchase order |
| DELETE | `/api/ovds/purchase-orders/:id` | Delete a purchase order |
| POST   | `/api/ovds/purchase-orders/:id/approve` | Approve a purchase order |
| GET    | `/api/ovds/bills/:billId/debit-note` | Get debit note for a bill |
| POST   | `/api/ovds/bills/:billId/debit-note` | Create a debit note for a bill |

---

### Accounting — Accruals & Prepayments

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/accruals` | List accruals and prepayments |
| POST   | `/api/ovds/accruals` | Create an accrual |
| GET    | `/api/ovds/accruals/summary` | Accruals summary |
| POST   | `/api/ovds/accruals/post-period` | Post accruals for a period |
| POST   | `/api/ovds/accruals/:id/cancel` | Cancel an accrual |

---

### Accounting — Sub-Ledger & IFRS 16 Leases

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/sub-ledger/gl` | Sub-ledger GL view |
| GET    | `/api/ovds/sub-ledger/ar-transactions` | AR sub-ledger transactions |
| POST   | `/api/ovds/leases/monthly-entries` | Post monthly IFRS 16 lease entries |
| POST   | `/api/ovds/revenue/deferred/recognize` | Recognize deferred revenue (IFRS 15) |

---

### Report Definitions (Custom Reports)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/report-definitions` | List custom report definitions |
| GET    | `/api/ovds/report-definitions/:id` | Get report definition by ID |
| POST   | `/api/ovds/report-definitions` | Create a report definition |
| PATCH  | `/api/ovds/report-definitions/:id` | Update a report definition |
| DELETE | `/api/ovds/report-definitions/:id` | Delete a report definition |
| GET    | `/api/ovds/report-definitions/:id/lines` | List report lines |
| POST   | `/api/ovds/report-definitions/:id/lines` | Create a report line |
| PATCH  | `/api/ovds/report-definitions/:definitionId/lines/:id` | Update a report line |
| DELETE | `/api/ovds/report-definitions/:definitionId/lines/:id` | Delete a report line |

---

### HR — Shifts, Holidays & Biometrics

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/shifts` | List shifts |
| POST   | `/api/shifts` | Create a shift |
| PATCH  | `/api/shifts/:id` | Update a shift |
| DELETE | `/api/shifts/:id` | Delete a shift |
| GET    | `/api/holidays` | List holidays |
| POST   | `/api/holidays` | Create a holiday |
| PATCH  | `/api/holidays/:id` | Update a holiday |
| DELETE | `/api/holidays/:id` | Delete a holiday |
| GET    | `/api/biometrics` | List biometric templates |
| POST   | `/api/biometrics/enroll` | Enroll a biometric template (fingerprint/face) |
| DELETE | `/api/biometrics/:id` | Delete a biometric template |

---

### Projects & Milestones

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/projects` | List projects (paginated) |
| POST   | `/api/projects` | Create a project |
| GET    | `/api/projects/:id` | Get project by ID |
| PATCH  | `/api/projects/:id` | Update a project |
| DELETE | `/api/projects/:id` | Delete a project |
| GET    | `/api/projects/:id/milestones` | List milestones for a project |
| POST   | `/api/projects/:id/milestones` | Create a milestone |
| PATCH  | `/api/projects/:id/milestones/:milestoneId` | Update a milestone |
| DELETE | `/api/projects/:id/milestones/:milestoneId` | Delete a milestone |

---

### Business Development

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/partnerships` | List partnerships |
| POST   | `/api/ovds/partnerships` | Create a partnership |
| GET    | `/api/ovds/investments` | List investments |
| POST   | `/api/ovds/investments` | Create an investment record |
| GET    | `/api/ovds/business-loans` | List business loans |
| POST   | `/api/ovds/business-loans` | Create a business loan |
| POST   | `/api/ovds/business-loans/:id/repayment` | Record a loan repayment |

---

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/notifications` | List notifications for the current user |
| POST   | `/api/notifications/mark-read` | Mark notifications as read |
| GET    | `/api/notifications/templates` | List notification templates |
| POST   | `/api/notifications/templates` | Create a notification template |
| PATCH  | `/api/notifications/templates/:id` | Update a notification template |
| DELETE | `/api/notifications/templates/:id` | Delete a notification template |
| POST   | `/api/notifications/campaigns` | Send a notification campaign |

---

### Departments & Onboarding

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/departments` | List departments |
| POST   | `/api/departments` | Create a department |
| PATCH  | `/api/departments/:id` | Update a department |
| DELETE | `/api/departments/:id` | Delete a department |
| GET    | `/api/onboarding/status` | Get company onboarding status |
| POST   | `/api/onboarding/complete` | Mark onboarding step as complete |

---

## Validation Utilities

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/ovds/validate/tin/:tin` | Validate an Ethiopian TIN |
| GET    | `/api/ovds/validate/vat/:vat` | Validate a VAT registration number |
| GET    | `/api/ovds/validate/nid/:nid` | Validate a National ID |
| GET    | `/api/ovds/validate/doc-ref/:ref` | Validate a document reference |
| POST   | `/api/ovds/validate/duplicate-payment` | Check for a duplicate payment |

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
| `companyId` | string | from JWT | Company context (auto-injected by `CompanyGuard`) |

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
| 409 | Conflict | Duplicate record (e.g. duplicate employee ID) |
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

## WebSocket (Real-Time)

OVDS uses **Socket.io** for real-time updates. Connect to the `/realtime` namespace:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/realtime', {
  auth: { token: 'Bearer <your-jwt>' }
});

socket.on('notification',       (data) => console.log(data));
socket.on('payroll:updated',    (data) => console.log(data));
socket.on('invoice:paid',       (data) => console.log(data));
socket.on('attendance:checkin', (data) => console.log(data));
socket.on('vat:filed',          (data) => console.log(data));
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
// 1. Scaffold with NestJS CLI
//    npx nest g module my-module
//    npx nest g controller my-module
//    npx nest g service my-module

// 2. Service — always scope to companyId
@Injectable()
export class MyModuleService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.myModel.findMany({ where: { companyId } });
  }
}

// 3. Controller — apply guards and roles
@Controller('my-module')
@UseGuards(AnyAuthGuard, CompanyGuard, RBACGuard)
@Roles('my_module:read')
export class MyModuleController {
  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll(req['companyId']);
  }
}

// 4. Register in app.module.ts
imports: [..., MyModuleModule]

// 5. Create the React page
// apps/frontend/src/pages/MyModule.tsx

// 6. Register route in App.tsx
const MyModule = lazyWithRetry(() => import('./pages/MyModule'));
// Add to ROUTES array: ['/my-module', MyModule]

// 7. Add to RBAC route policy in rbac.ts
ROUTE_POLICY['/my-module'] = 'my_module:read';
```

---

## API Keys

For programmatic access — scripts, integrations, IoT devices — you can generate long-lived API keys instead of logging in each time.

1. Go to **Settings → API Keys** (`/settings`) — requires `settings:write`
2. Click **Generate API Key**
3. Copy the key immediately — it is only shown once
4. Use it as a Bearer token on every request:

```http
GET /api/ovds/invoices
Authorization: Bearer ovds_key_live_...
```

API keys are:
- Scoped to the company of the user who created them
- Granted the same RBAC permissions as the creating user
- Revocable at any time from the same Settings screen

> IoT devices use a separate token system issued per-device via `POST /api/iot/devices/:id/token`. Those tokens are scoped to a single device and company and should not be used for general API access.

---

## EIMS — MoR / ERCA e-Invoice API

OVDS integrates with Ethiopia's **Electronic Invoice Management System (EIMS)** operated by the Ministry of Revenues (MoR/ERCA) at `https://core.mor.gov.et`. All commercial invoices issued through OVDS are automatically registered with ERCA.

### Prerequisites

Before any EIMS call can be made:

1. **Register your source** with the MoR e-invoice back office
2. **Obtain back-office approval** — credentials are issued only after source registration is approved

See `postman/README.md` for the full onboarding guide.

### EIMS Credentials (`.env`)

| Variable | Description |
|----------|-------------|
| `EIMS_CLIENT_ID` | API client ID issued by MoR |
| `EIMS_CLIENT_SECRET` | Secret key issued by MoR |
| `EIMS_API_KEY` | Additional authentication key |
| `COMPANY_TIN` | Your 15-digit Tax Identification Number |
| `EIMS_API_URL` | Base URL — defaults to `https://core.mor.gov.et` |
| `EIMS_SANDBOX` | Set `true` during testing to log without hitting live MoR API |

### EIMS Endpoints

All endpoints require `Authorization: Bearer <token>` except `/auth/login`.

| Step | Method | Path | Description |
|------|--------|------|-------------|
| Auth | POST | `/auth/login` | Generate EIMS bearer token |
| Auth | POST | `/auth/refresh-token` | Refresh expired EIMS token |
| Register | POST | `/v1/register` | Register a single invoice |
| Register | POST | `/v1/bulkRegister` | Register multiple invoices (array) |
| Verify  | POST | `/v1/verify` | Verify an invoice by IRN |
| Cancel  | POST | `/v1/cancel` | Cancel a single invoice |
| Cancel  | POST | `/v1/bulkCancel` | Cancel multiple invoices |
| Receipt | POST | `/v1/receipt/sales` | Record a sales receipt |
| Receipt | POST | `/v1/receipt/withholding` | Record a withholding receipt |

### Typical Registration Flow

```
1. OVDS creates invoice → INV-2026-0042
2. POST /v1/register → ERCA returns IRN + signed QR
3. QR encoded in NBE-IQR format on the invoice PDF
4. Customer scans QR on etax.erca.gov.et to verify
```

**Single invoice registration request:**
```json
{
  "sellerTin": "0016324478",
  "documentNumber": "INV-2026-0042",
  "invoiceCounter": 42,
  "previousIrn": "IRN-...",
  "systemType": "ERP",
  "systemNumber": "SYS-001",
  "invoiceDate": "2026-09-08",
  "totalAmount": 11500.00,
  "vatAmount": 1500.00,
  "items": [
    { "description": "Consulting", "qty": 1, "unitPrice": 10000.00, "vatRate": 15 }
  ]
}
```

**Response:**
```json
{
  "irn": "IRN-2026-0042-XXXXX",
  "qrCode": "ERCA-QR-...",
  "signedInvoice": "...",
  "timestamp": "2026-09-08T10:30:00Z"
}
```

### Bulk vs. Single Registration

| Aspect | Single | Bulk |
|--------|--------|------|
| Invoices per request | 1 | Multiple (array) |
| `previousIrn` chaining | Auto-managed by OVDS | First item chains; rest are manual |
| Response | Immediate IRN + QR | `202 Accepted` + `conversationId`; results via callback webhook |

For bulk registration, configure a webhook endpoint in OVDS to receive the async results. See the [Webhooks](#webhooks) section below.

### Testing with Postman

```bash
# Import both files into Postman
postman/EimsCoreApiMockCollection.postman_collection.json
postman/EimsCoreApiMockEnvironment.postman_environment.json

# Or run headless with Newman
newman run postman/EimsCoreApiMockCollection.postman_collection.json \
  -e postman/EimsCoreApiMockEnvironment.postman_environment.json \
  --bail
```

---

## Webhooks

OVDS can push real-time event notifications to your external systems whenever key business events occur.

### Configuration

Go to **Settings → Webhooks** (`/settings`) — requires `settings:write`.

1. Click **Add Webhook**
2. Enter your endpoint URL (HTTPS required in production)
3. Select the events to subscribe to
4. Copy the **Signing Secret** — used to verify payload authenticity on your side

### Outbound Events

| Event | Trigger | Key Payload Fields |
|-------|---------|-------------------|
| `invoice.created` | New invoice created | `invoiceId`, `invoiceNumber`, `customerId`, `amount` |
| `invoice.paid` | Invoice fully paid | `invoiceId`, `invoiceNumber`, `amount`, `paymentMethod` |
| `invoice.overdue` | Invoice past due date | `invoiceId`, `daysOverdue`, `amount` |
| `bill.created` | New bill created | `billId`, `vendorId`, `amount`, `dueDate` |
| `bill.paid` | Bill marked as paid | `billId`, `amount`, `paymentDate` |
| `payroll.approved` | Payroll approved for disbursement | `month`, `year`, `totalNetPay`, `employeeCount` |
| `employee.created` | New employee added | `employeeId`, `name`, `department` |
| `vat.filed` | VAT return filed | `period`, `outputVat`, `inputVat`, `netVat` |
| `pension.submitted` | Pension submission recorded | `period`, `employeeCount`, `totalAmount` |
| `tax.payment_reference` | MoR payment voucher generated | `taxType`, `period`, `amount`, `referenceNumber` |
| `leave.approved` | Leave request approved | `employeeId`, `leaveType`, `fromDate`, `toDate` |
| `attendance.checkin` | Employee checks in | `employeeId`, `timestamp`, `method` |
| `iot.sale` | POS/fiscal device records a sale | `deviceId`, `amount`, `vatAmount`, `receiptQR` |
| `iot.event` | Sensor/telematics event received | `deviceId`, `eventType`, `payload` |
| `iot.device_offline` | Device stops heartbeat | `deviceId`, `deviceType`, `lastSeen` |
| `banking.digital_payment` | Telebirr or Chapa payment received | `provider`, `reference`, `amount`, `invoiceId`, `matched` |

### Payload Structure

```json
{
  "event": "invoice.paid",
  "timestamp": "2026-09-08T10:30:00Z",
  "companyId": "clx...",
  "data": {
    "invoiceId": "clx...",
    "invoiceNumber": "INV-2026-0042",
    "amount": 15000.00,
    "paymentMethod": "TELEBIRR"
  }
}
```

### Verifying Signatures

OVDS signs every outbound payload with **HMAC-SHA256** using your signing secret. Always verify before processing:

```javascript
const crypto = require('crypto');

function verifyWebhook(rawBody, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)           // raw Buffer — do NOT parse JSON first
    .digest('hex');
  return `sha256=${expected}` === signature;
}

// Express example
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-ovds-signature'];
  if (!verifyWebhook(req.body, sig, process.env.OVDS_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  const event = JSON.parse(req.body);
  // handle event.event ...
  res.status(200).send('OK');
});
```

### Retry Policy

| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 30 minutes |
| 4th retry | 2 hours |
| 5th retry | 24 hours |

After 5 failures, the webhook is marked **failed** and disabled. Re-enable it from Settings → Webhooks. Your endpoint should return `2xx` within 10 seconds — use async processing (queue the event, respond immediately) for slow handlers.

### Inbound Payment Webhooks (Telebirr & Chapa)

These endpoints are called by the payment provider — not by your code:

```
POST /api/webhooks/telebirr    # Telebirr payment callback
POST /api/webhooks/chapa       # Chapa payment callback
POST /api/webhooks/cbe-birr    # CBE Birr payment callback
```

OVDS verifies the provider signature, auto-matches the payment to the open invoice, marks it `PAID`, posts the double-entry GL, and fires the `banking.digital_payment` outbound webhook to any subscribers.

---

## Beyond CRUD

Standard CRUD covers most needs but OVDS has several multi-step business workflows exposed through dedicated action endpoints.

### Invoice Lifecycle

```
DRAFT → PENDING → PAID
              ↓        ↓
           OVERDUE  CANCELLED
```

| Transition | Endpoint | Notes |
|-----------|----------|-------|
| Create | `POST /api/ovds/invoices` | Always starts as `DRAFT` |
| Send | `POST /api/ovds/invoices/:id/send` | `DRAFT → PENDING`; triggers email if SMTP configured |
| Record payment | `POST /api/ovds/invoices/:id/payments` | Partial payments supported; auto-transitions to `PAID` when `totalPaid ≥ totalAmount` |
| Mark paid | `POST /api/ovds/invoices/:id/mark-paid` | Full-payment shortcut; posts GL immediately |
| Send reminder | `POST /api/ovds/invoices/:id/send-reminder` | Overdue invoices only |
| Void | `POST /api/ovds/invoices/:id/void` | Keeps record; creates audit entry |
| Cancel | `POST /api/ovds/invoices/:id/cancel` | Requires `reason` in body |
| Credit note | `POST /api/ovds/invoices/:id/credit-note` | Creates mirror invoice with negative amounts; prefixed `CN-` |
| Duplicate | `POST /api/ovds/invoices/:id/duplicate` | New `DRAFT` with all line items copied |

**Auto-accounting:** Every invoice creation automatically posts:
```
Debit:  Accounts Receivable  = totalAmount
Credit: Sales Revenue        = subtotal
Credit: VAT Payable          = vatAmount   (15% — Proclamation 1341/2024)
Credit: DRRF Payable         = drrfAmount  (5% of subtotal)
```

### Estimate Lifecycle

```
DRAFT → SENT → ACCEPTED → CONVERTED (to Invoice)
                       ↓
                   DECLINED
```

Convert an accepted estimate to an invoice with one call:
```http
POST /api/ovds/estimates/:id/convert
```

A new `DRAFT` invoice is created with all line items copied. The estimate status becomes `CONVERTED`.

### Payment Recording

`POST /api/ovds/invoices/:id/payments` accepts full NBE/MoR compliance fields:

```json
{
  "amount": 15000.00,
  "paymentDate": "2026-09-08",
  "paymentSource": "TELEBIRR",
  "telecomRef": "TLB-20260908-XXXX",
  "orderNo": "ORD-001",
  "tinValidated": true,
  "qrType": "NBE-IQR",
  "archType": "CLOUD",
  "processType": "REALTIME",
  "notes": "Payment via Telebirr mobile app"
}
```

**Supported `paymentSource` values:** `CASH`, `BANK_TRANSFER`, `TELEBIRR`, `CHEQUE`, `MOBILE_BANKING`, `CREDIT_CARD`

### VAT Filing Workflow

```
DRAFT → COMPUTED → REVIEWED → SUBMITTED → ACKNOWLEDGED
```

| Step | Endpoint | Permission | Who |
|------|----------|-----------|-----|
| Calculate VAT for a period | `POST /api/ovds/vat/filings/calculate` | `vat:calculate` | `ovds`, `ACCOUNTING` |
| Review & adjust | `GET /api/ovds/vat/summary` | `vat:read` | `ovds`, `ACCOUNTING` |
| Submit to ERCA | Handled via eTax portal | `vat:file` | `ovds` only |

**eTax reference format:** `ETAX-VATRETURN-YYYY-MM-XXXXX`

Calculating VAT auto-posts the journal entry:
```
Debit:  VAT Payable (output)    = totalOutputVat
Credit: VAT Receivable (input)  = claimableInputVat
Credit: Cash (net)              = netVatPayable
```

### Payroll Workflow

```
GENERATED → VERIFIED → FINALIZED → APPROVED
```

Advance a single employee or use bulk:

```http
PATCH /api/payroll/workflow/:employeeId
{ "action": "verify" }

PATCH /api/payroll/bulk-workflow
{ "employeeIds": ["id1", "id2"], "action": "finalize" }
```

| Action | Required Permission | Who |
|--------|--------------------|----|
| `verify` | `payroll:verify` | `HR` |
| `finalize` | `payroll:finalize` | `HR` |
| `approve` | `payroll:approve` | `ovds` |

### Bank Reconciliation Workflow

```
PENDING → RECONCILED
```

```http
# Match a single transaction
PATCH /api/ovds/bank-transactions/:id/reconcile

# Bulk match
POST /api/ovds/bank-accounts/:id/bulk-reconcile
{ "transactionIds": ["id1", "id2"] }
```

### Accounting Period Close

```
OPEN → LOCKED
```

Locking a period prevents backdated journal entries:

```http
POST /api/ovds/periods/lock
{ "period": "2026-08", "companyId": "clx..." }

POST /api/ovds/periods/unlock        # Admin only
{ "period": "2026-08", "companyId": "clx...", "reason": "Audit adjustment" }
```

---

## DTO Reference

Key request body shapes for the most-used endpoints. All fields marked `*` are required.

### Create Invoice

```typescript
POST /api/ovds/invoices
```

```json
{
  "customerId": "clx...",          // * Customer ID
  "companyId": "clx...",           // * Company ID (auto-injected from JWT in practice)
  "dueDate": "2026-10-08",         // * ISO date string
  "currency": "ETB",               //   defaults to "ETB"
  "vatRate": 15,                   //   defaults to 15 (%)
  "notes": "Net 30",
  "items": [                       // * At least one item required
    {
      "itemId": "clx...",          //   optional — links to Item record
      "description": "Consulting", // * free-text if no itemId
      "quantity": 1,               // *
      "unitPrice": 10000.00,       // *
      "vatRate": 15                //   per-line override
    }
  ],
  "scheduledSendAt": null,         //   ISO datetime — auto-sends at this time
  "isRecurring": false,
  "recurringInterval": null        //   "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"
}
```

### Create Employee

```typescript
POST /api/employees
```

```json
{
  "firstName": "Abebe",            // *
  "lastName":  "Kebede",           // *
  "email": "abebe@company.com",    // *
  "phone": "0911223344",
  "departmentId": "clx...",        // *
  "jobTitle": "Senior Engineer",
  "employmentType": "FULL_TIME",   //   "FULL_TIME" | "PART_TIME" | "CONTRACT"
  "grossSalary": 25000,            // *  ETB
  "startDate": "2026-09-08",       // *
  "tinNumber": "0016324478",
  "bankName": "CBE",
  "bankAccount": "1000123456789",
  "companyId": "clx..."            // *
}
```

### Record Invoice Payment

```typescript
POST /api/ovds/invoices/:id/payments
```

```json
{
  "amount": 15000.00,              // *
  "paymentDate": "2026-09-08",     // *  ISO date string
  "paymentSource": "TELEBIRR",     // *  see supported values above
  "telecomRef": "TLB-XXXX",        //    required when paymentSource = TELEBIRR
  "bankName": "CBE",               //    required when paymentSource = BANK_TRANSFER
  "bankAccountName": "Trading PLC",
  "orderNo": "ORD-001",
  "tinValidated": true,
  "qrType": "NBE-IQR",
  "notes": "Partial payment"
}
```

### Create Journal Entry

```typescript
POST /api/ovds/journal-entries
```

```json
{
  "date": "2026-09-08",            // *
  "reference": "ADJ-001",          // *
  "description": "Accrual adjustment",
  "companyId": "clx...",           // *
  "lines": [                       // *  Must balance (Σ debits = Σ credits, tolerance < 0.01 ETB)
    { "accountId": "clx...", "debit": 5000, "credit": 0,    "description": "Prepaid expense" },
    { "accountId": "clx...", "debit": 0,    "credit": 5000, "description": "Cash" }
  ]
}
```

### Create VAT Filing Calculation

```typescript
POST /api/ovds/vat/filings/calculate
```

```json
{
  "period": "2026-08",             // *  YYYY-MM
  "companyId": "clx..."            // *
}
```

### Bulk Import (Employees / Customers / Vendors / Items)

All bulk import endpoints accept an array of objects in the request body:

```typescript
POST /api/employees/bulk-import
POST /api/ovds/customers/bulk-import
POST /api/ovds/vendors/bulk-import
POST /api/ovds/items/bulk-import
```

```json
{
  "companyId": "clx...",
  "rows": [
    { "firstName": "Abebe", "lastName": "Kebede", "email": "...", ... },
    { "firstName": "Sara",  "lastName": "Ali",    "email": "...", ... }
  ]
}
```

Each row is validated independently. The response includes a per-row `success`/`error` summary:

```json
{
  "imported": 48,
  "failed": 2,
  "errors": [
    { "row": 5,  "field": "email", "message": "Email already exists" },
    { "row": 12, "field": "tin",   "message": "Invalid TIN format"   }
  ]
}
```

---

## Environment Variables

Minimum required to run OVDS:

```env
PRISMA_DATABASE_URL="mysql://root:@127.0.0.1:3306/ovds"
JWT_SECRET="ovds_secret_key_2026"
AUTH0_NAMESPACE="http://localhost:3000"
AUTH0_ENFORCED=false
```

Full reference:

| Variable | Required | Description |
|----------|:--------:|-------------|
| `PRISMA_DATABASE_URL` | ✅ | MySQL / MariaDB connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars, HS256) |
| `AUTH0_NAMESPACE` | ✅ | Auth0 namespace (use `http://localhost:3000` for local JWT) |
| `AUTH0_ENFORCED` | ✅ | `true` to require Auth0; `false` for local JWT only |
| **Email (SMTP)** | | |
| `MAIL_HOST` | Optional | SMTP host (e.g. `smtp.mailtrap.io`) |
| `MAIL_PORT` | Optional | SMTP port (`587` or `465`) |
| `MAIL_USER` | Optional | SMTP username |
| `MAIL_PASS` | Optional | SMTP password |
| **OCR / AI** | | |
| `OPENAI_API_KEY` | Optional | For OCR bank statement / receipt parsing |
| `GEMINI_API_KEY` | Optional | Alternative to OpenAI for OCR |
| **Auth0 (Frontend)** | | |
| `VITE_AUTH0_ENABLED` | Optional | `true` to enable Auth0 login button |
| `VITE_AUTH0_DOMAIN` | Optional | Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | Optional | Auth0 SPA client ID |
| `VITE_AUTH0_AUDIENCE` | Optional | Auth0 API audience |
| `VITE_AUTH0_CONNECTION` | Optional | Auth0 connection name |
| **Payment Gateways** | | |
| `TELEBIRR_BUSINESS_ID` | Optional | Telebirr merchant ID |
| `TELEBIRR_APP_KEY` | Optional | Telebirr app key |
| `TELEBIRR_PUBLIC_KEY` | Optional | Telebirr public key |
| `TELEBIRR_SHORT_CODE` | Optional | Telebirr short code |
| `TELEBIRR_WEBHOOK_SECRET` | Optional | HMAC secret for Telebirr callbacks |
| `CHAPA_SECRET_KEY` | Optional | Chapa payment gateway secret key |
| `CHAPA_PUBLIC_KEY` | Optional | Chapa public key |
| `CHAPA_WEBHOOK_SECRET` | Optional | HMAC secret for Chapa callbacks |
| `CHAPA_CALLBACK_URL` | Optional | Your domain + `/api/webhooks/chapa` |
| `CBE_BIRR_MERCHANT_ID` | Optional | CBE Birr merchant ID |
| `CBE_BIRR_API_KEY` | Optional | CBE Birr API key |
| `CBE_BIRR_WEBHOOK_SECRET` | Optional | HMAC secret for CBE Birr callbacks |
| **EIMS / eTax** | | |
| `EIMS_CLIENT_ID` | Optional | MoR-issued API client ID |
| `EIMS_CLIENT_SECRET` | Optional | MoR-issued secret key |
| `EIMS_API_KEY` | Optional | MoR-issued additional API key |
| `EIMS_API_URL` | Optional | EIMS base URL (default: `https://core.mor.gov.et`) |
| `EIMS_SANDBOX` | Optional | `true` logs submissions without hitting live MoR API |
| `COMPANY_TIN` | Optional | Your 15-digit Tax Identification Number |
| **IoT** | | |
| `IOT_API_TOKEN_SECRET` | Optional | Signing secret for device tokens |
| `IOT_HEARTBEAT_INTERVAL_SEC` | Optional | Heartbeat interval (default: `300`) |
| `IOT_OFFLINE_THRESHOLD_MIN` | Optional | Minutes before device is marked offline (default: `15`) |
| **Notifications** | | |
| `SLACK_WEBHOOK_URL` | Optional | Slack Incoming Webhook URL |
| `INTERCOM_APP_ID` | Optional | Intercom app ID |
| `INTERCOM_SECRET_KEY` | Optional | Intercom identity verification secret |

---

## Version Compatibility & Upgrades

### Toolchain Versions

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | Use `nvm` or `fnm` for management |
| Nx | 23.1.x | Monorepo build orchestrator |
| NestJS | 11.x | Backend framework |
| React | 19.x | Frontend framework |
| Prisma | 7.x | ORM — `@prisma/adapter-mariadb` |
| MySQL / MariaDB | 8.0+ / 10.6+ | Via XAMPP, Docker, or native |

### API Versioning Policy

OVDS follows a **contract-first, additive-first** strategy:

| Change type | Safe? | Action required |
|-------------|-------|----------------|
| New optional request field | ✅ Safe | None |
| New response field | ✅ Safe | None |
| New endpoint | ✅ Safe | None |
| New optional query parameter | ✅ Safe | None |
| Remove / rename a field | ❌ Breaking | Deprecate first (see below) |
| Change a field's type | ❌ Breaking | Deprecate first |
| Tighten validation | ❌ Breaking | Major version bump |
| Change HTTP method or path | ❌ Breaking | Keep old route as alias |

### Deprecation Workflow

1. Mark the old field/endpoint `@deprecated` in Swagger (`@ApiProperty({ deprecated: true })`)
2. Log a server-side deprecation warning for callers still using it
3. Document the replacement in this file and in the relevant module guide
4. Remove only after one full release cycle with zero remaining internal callers

### Schema Migration

Database schema changes are managed exclusively through **Prisma migrations** — never `db:push` to production.

```bash
# Development — create and apply a new migration
npm run db:migrate:dev -- --name describe-your-change

# Production / staging — apply pending migrations only
npm run db:migrate:prod

# Regenerate the Prisma client after any schema edit
npm run db:generate
```

Key rules:
- Every tenant-scoped model must have `companyId` with a leading `@@index([companyId, ...])`
- Renaming a model column: use `@map` / `@@map` to keep the DB column name stable
- Rollback = write a forward-fix migration, not a manual database edit
- Never drop `companyId` from any model

See [UPGRADING.md](UPGRADING.md) for the complete upgrade playbook including Nx major upgrades, NestJS/React/Prisma bumps, and the pre-release checklist.

---

## Module Map — Four-Phase Architecture

OVDS is organized around the Ethiopian financial compliance cycle. Every API module fits into one of four phases:

```
Phase 1 · Setup         Phase 2 · Daily Ops      Phase 3 · Analysis      Phase 4 · Submit to MoR
─────────────────────   ─────────────────────     ────────────────────    ──────────────────────────
/api/settings           /api/ovds/invoices        /api/ovds/reports       /api/ovds/vat/filings
/api/ovds/accounts      /api/ovds/bills           /api/ovds/budget        /api/tax/pension-submission
/api/ovds/bank-accounts /api/payroll              /api/ovds/fixed-assets  /api/tax/payment-reference
/api/auth/users         /api/attendance           /api/ovds/ifrs*         /api/disaster-fund
/api/ovds/tax-rates     /api/leaves               /api/dashboard          /api/tax/tot
/api/iot/devices        /api/ovds/items           /api/crm                /api/tax/wht-certificates
/api/ovds/periods       /api/banking/*            /api/ovds/inventory     /api/dashboard/audit-logs
```

| Phase | Purpose | Key Modules |
|-------|---------|------------|
| **1 — Setup** | Configure legal entity, tax rates, banking, IoT | `settings`, `accounts`, `bank-accounts`, `tax-rates`, `iot/devices` |
| **2 — Daily Operations** | Real-time transactions, HR, payroll, compliance tasks | `invoices`, `bills`, `payroll`, `attendance`, `leaves`, `banking` |
| **3 — Analysis** | Review before filing — statements, GL, dashboards | `reports`, `budget`, `fixed-assets`, `ifrs*`, `dashboard` |
| **4 — Submit to MoR** | Tax declarations, ERCA submissions, audit trail | `vat/filings`, `tax/tot`, `disaster-fund`, `tax/pension-submission` |

---

## Endpoint Quick-Reference

Complete alphabetical index of every API path prefix, its controller, owning module, required permission or role, and sidebar group. Use this as a fast lookup when building integrations.

| Prefix | Controller | Description | Min Permission / Role | Sidebar |
|--------|-----------|-------------|----------------------|---------|
| `/api/auth/login` | `AuthController` | Login (public) | Public | — |
| `/api/auth/register` | `AuthController` | Register (public) | Public | — |
| `/api/auth/otp` | `AuthController` | OTP send/verify | Public | — |
| `/api/auth/forgot-password` | `AuthController` | Password reset flow | Public | — |
| `/api/auth/fayda` | `AuthController` | Fayda National ID login | Public | — |
| `/api/auth/tin` | `AuthController` | TIN + PIN login | Public | — |
| `/api/auth/auth0` | `AuthController` | Auth0 token exchange | Public | — |
| `/api/auth/me` | `AuthController` | Current user info | Bearer | — |
| `/api/auth/api-keys` | `AuthController` | API key CRUD | Bearer | `setup_config` |
| `/api/auth/users` | `AuthController` | User admin | `users:read` | `users_access` |
| `/api/auth/fcm-token` | `AuthController` | Push notification token | Bearer | — |
| `/api/banking/accounts` | `BankingController` | Bank accounts CRUD | `banking:read` | `banking` |
| `/api/banking/transactions` | `BankingController` | Bank transactions | `banking:read` | `banking` |
| `/api/banking/transfers` | `BankingController` | Fund transfers | `ADMIN`, `FINANCE` | `banking` |
| `/api/banking/digital-payments` | `BankingController` | Telebirr / Chapa receipts | `banking:read` | `banking` |
| `/api/crm/leads` | `CrmController` | Lead pipeline | `CRM`, `SALES` | `customers` |
| `/api/crm/opportunities` | `CrmController` | Opportunities → invoices | `CRM`, `SALES` | `customers` |
| `/api/crm/activities` | `CrmController` | CRM activities (calls, tasks) | `CRM`, `SALES` | `customers` |
| `/api/crm/contacts` | `CrmController` | Contact management | `CRM`, `SALES` | `customers` |
| `/api/crm/companies` | `CrmController` | CRM companies | `CRM`, `SALES` | `customers` |
| `/api/crm/deals` | `CrmController` | Deal pipeline + stats | `crm:read` | `customers` |
| `/api/crm/pipelines` | `CrmController` | Pipeline config | `ADMIN` | `customers` |
| `/api/crm/customers` | `CrmController` | Customer registry | `CRM`, `SALES` | `customers` |
| `/api/dashboard` | `DashboardController` | KPIs, audit logs (30 s cache) | `reports:read` | `dashboards` |
| `/api/disaster-fund` | `DisasterFundController` | DRRF contributions / remittance | `disaster_fund:read` | `tax_filing` |
| `/api/health` | `HealthController` | System health check | Public | — |
| `/api/hr/employees` | `HrController` | Employee CRUD | `employees:read` | `payroll_hr` |
| `/api/hr/departments` | `HrController` | Department CRUD | `employees:read` | `payroll_hr` |
| `/api/hr/attendance` | `HrController` | Check-in/out, verify | `attendance:read` | `payroll_hr` |
| `/api/hr/gratuity` | `HrController` | Gratuity calculate + records | `ADMIN`, `HR` | `payroll_hr` |
| `/api/iot/devices` | `IotController` | Device registry + tokens | `system:config` | `iot_daily` |
| `/api/iot/events` | `IotController` | Device event ingestion | Device token | `iot_daily` |
| `/api/iot/telemetry` | `IotController` | Aggregated telemetry | `reports:read` | `iot_daily` |
| `/api/iot/alerts` | `IotController` | Device alerts | `reports:read` | `iot_daily` |
| `/api/iot/ota` | `IotController` | OTA firmware packages + deploy | `system:config` | `iot_daily` |
| `/api/leaves` | `LeavesController` | Leave requests + approvals | `leaves:read` | `payroll_hr` |
| `/api/notifications` | `NotificationsController` | Notifications + templates | `notifications:read` | `system` |
| `/api/onboarding` | `OnboardingController` | Setup wizard status | `onboarding:read` | `setup_config` |
| `/api/ovds/accounts` | `OvdsController` | Chart of Accounts CRUD | `ovds:read` | `coa` |
| `/api/ovds/accruals` | `OvdsController` | Accruals & prepayments | `ovds:read` | `accounting_ledger` |
| `/api/ovds/bank-accounts` | `OvdsController` | GL bank accounts + transactions | `bank_reconciliation:read` | `banking` |
| `/api/ovds/bills` | `OvdsController` | Bills / AP | `bills:read` | `purchases` |
| `/api/ovds/budget` | `OvdsController` | Budget vs. actual | `ovds:read` | `accounting_ledger` |
| `/api/ovds/business-loans` | `OvdsController` | Business loans + repayments | `business_loans:read` | `capital` |
| `/api/ovds/categories` | `OvdsController` | Transaction categories | `ovds:read` | `expense_tracking` |
| `/api/ovds/companies` | `OvdsController` | Multi-company CRUD | `companies:read` | `company_admin` |
| `/api/ovds/cost-centers` | `OvdsController` | Cost centers | `ovds:read` | `accounting_ledger` |
| `/api/ovds/currency` | `OvdsController` | Currency rates + live NBE feed | `ovds:read` | `currency_banking_setup` |
| `/api/ovds/customers` | `OvdsController` | Customer registry | `invoices:read` | `customers` |
| `/api/ovds/deferred-tax` | `OvdsController` | IAS 12 deferred tax | `ovds:read` | `accounting_ledger` |
| `/api/ovds/entity-groups` | `OvdsController` | Consolidation groups (IFRS 10) | `companies:read` | `company_admin` |
| `/api/ovds/estimates` | `OvdsController` | Estimates → invoices | `invoices:read` | `sales` |
| `/api/ovds/expenses` | `OvdsController` | Expense records | `expenses:read` | `purchases` |
| `/api/ovds/fixed-assets` | `OvdsController` | Fixed assets + depreciation | `fixed_assets:read` | `accounting_ledger` |
| `/api/ovds/ifrs9` | `OvdsController` | IFRS 9 ECL provision | `ovds:read` | `accounting_ledger` |
| `/api/ovds/ifrs15` | `OvdsController` | IFRS 15 revenue schedules | `ovds:read` | `accounting_ledger` |
| `/api/ovds/inventory` | `OvdsController` | Inventory valuation (FIFO/WA) | `inventory:read` | `inventory` |
| `/api/ovds/investments` | `OvdsController` | Investment records | `investments:read` | `capital` |
| `/api/ovds/invoices` | `OvdsController` | Invoice CRUD + lifecycle | `invoices:read` | `sales` |
| `/api/ovds/items` | `OvdsController` | Items + stock | `items:read` | `inventory` |
| `/api/ovds/journal-entries` | `OvdsController` | Manual journal entries | `ovds:read` | `accounting_ledger` |
| `/api/ovds/partnerships` | `OvdsController` | Partnership records | `partnerships:read` | `capital` |
| `/api/ovds/periods` | `OvdsController` | Period lock / unlock | `period_close:read` | `coa` |
| `/api/ovds/purchase-orders` | `OvdsController` | Purchase orders | `purchase_orders:read` | `purchases` |
| `/api/ovds/report-definitions` | `OvdsController` | Custom report builder | `reports:custom:read` | `reports` |
| `/api/ovds/reports` | `OvdsController` | Financial statements (BS/PL/CF/TB) | `reports:read` | `financial_statements` |
| `/api/ovds/stamp-duty` | `OvdsController` | Stamp duty records | `vat:read` | `compliance_tasks` |
| `/api/ovds/sub-ledger` | `OvdsController` | AR/GL sub-ledger views | `ovds:read` | `accounting_ledger` |
| `/api/ovds/tax-rates` | `OvdsController` | Tax rate config (accounting view) | `ovds:read` | `tax_config` |
| `/api/ovds/translation-reserves` | `OvdsController` | IFRS 21 FX translation reserves | `ovds:read` | `accounting_ledger` |
| `/api/ovds/validate` | `OvdsController` | TIN / VAT / NID validation | Bearer | — |
| `/api/ovds/vendors` | `OvdsController` | Vendor CRUD | `bills:read` | `vendors` |
| `/api/ovds/warehouses` | `OvdsController` | Warehouse management | `inventory:read` | `inventory` |
| `/api/ovds/wht-certificates` | `OvdsController` | WHT certificates (accounting) | `vat:withholding` | `purchases` |
| `/api/payroll` | `PayrollController` | Payroll runs + workflow | `payroll:read` | `payroll_hr` |
| `/api/projects` | `ProjectsController` | Projects + milestones | `projects:read` | `projects` |
| `/api/settings` | `SettingsController` | System settings + export | `settings:read` | `setup_config` |
| `/api/tax/rates` | `TaxController` | Tax rates (tax module view) | `ovds:read` | `tax_config` |
| `/api/tax/wht` | `TaxController` | WHT certificates + summary | `vat:withholding` | `purchases` |
| `/api/tax/tot` | `TaxController` | TOT filings + submit | `vat:file` | `compliance_tasks` |
| `/api/tax/bit` | `TaxController` | Business Income Tax | `bit:read` | `tax_filing` |
| `/api/tax/drrf` | `TaxController` | DRRF levy + remittances | `disaster_fund:read` | `tax_filing` |
| `/api/tax/liability-estimate` | `TaxController` | Live VAT+TOT+WHT estimate | `vat:read` | `dashboards` |
| `/api/tax/pension-submission` | `TaxController` | Pension ERCA submissions | `payroll:admin` | `tax_filing` |
| `/api/tax/payment-reference` | `TaxController` | MoR payment vouchers | `vat:file` | `tax_filing` |
| `/api/tax/compliance` | `TaxController` | Compliance + automation status | `vat:read` | `compliance_tasks` |
| `/api/tax/penalty` | `TaxController` | Late-filing penalty calculator | `vat:read` | `tax_config` |
| `/api/vat` | `VatController` | VAT filings, ledgers, eTax, IRN | `vat:read` | `compliance_tasks` |
| `/api/webhooks` | Webhook handlers | Inbound Telebirr / Chapa / CBE | Provider HMAC | — |

---

## Developers

- [Read Me](README.md)
- [Understanding the hierarchy](STRUCTURE.md)
- [Modules](AGENTS.md#backend-modules)
- [Menu / Sidebar](SIDEBAR_UPGRADE_SUMMARY.md)
- [Settings](../../docs/03-settings)
- [Permissions](AGENTS.md#rbac-system)
- [Bulk Actions](AGENTS.md#employees) *(bulk-import endpoints)*
- [Search String](AGENTS.md#pagination) *(search query parameter)*
- [Overriding Output](AGENTS.md#api-resources-dtos)
- [Hooking Models](WEBHOOKS.md)
- **RESTful API** ← you are here
- [Beyond CRUD](AGENTS.md#ovds--treasury)
- [Making a payment method](WEBHOOKS.md#payment-gateways)
- [Version compatibility](UPGRADING.md)
- [Become a Module Developer](AGENTS.md#building-a-module)
