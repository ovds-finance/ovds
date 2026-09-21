# Endpoint Bugs E2E Fix — Bugfix Design

## Overview

This design covers ten categories of end-to-end bugs discovered across the NX monorepo
(NestJS/Prisma backend + React/Vite frontend). Left unfixed these bugs produce: silent
cross-tenant data leaks, runtime `TypeError`s in the browser, incorrect financial totals,
status-tab counts always showing 0, and requests that match the wrong NestJS route handler.

Each section below maps directly to a bug category in `bugfix.md`, formalises the bug
condition, proposes the minimal targeted fix, and defines correctness properties for
property-based testing.

---

## Glossary

- **Bug_Condition (C)**: A predicate over an input (request, function call, data record)
  that identifies when the bug manifests.
- **Property (P)**: The correct observable output that must hold when the fix is applied to
  a buggy input.
- **Preservation**: Behaviour for all inputs **not** in C(X) — must be identical before and
  after the fix.
- **OvdsController**: `apps/backend/src/ovds/ovds.controller.ts` — the central NestJS
  controller serving `/ovds/*` routes.
- **SalesService**: `apps/backend/src/sales/sales.service.ts` — invoice business logic.
- **PurchasesService**: `apps/backend/src/purchases/purchases.service.ts` — bills/PO/GRN
  business logic.
- **BankingService**: `apps/backend/src/banking/banking.service.ts` — bank account queries.
- **estimatesApi (accounting)**: `packages/features/accounting/src/services/ovdsApi.ts` —
  the version imported by `apps/frontend/src/services/ovdsApi.ts` (re-export shim).
- **Estimate model**: A Prisma model that does not yet exist; must be added to
  `packages/database/prisma/schema.prisma`.
- **isBugCondition**: Pseudocode predicate identifying a buggy input.
- **expectedBehavior**: Pseudocode predicate over the output of the fixed function.

---

## Bug Details

### Bug Condition — Category 1: NestJS Route Ordering

NestJS resolves controller routes in **declaration order**. When a static path such as
`/ovds/invoices/stats` is declared **after** the dynamic `@Get(':id')` handler, Express
matches the dynamic segment first and interprets `"stats"` as an invoice ID.

**Formal Specification:**

```
FUNCTION isBugCondition_RouteOrdering(request)
  INPUT: HTTP request
  OUTPUT: boolean
  
  staticPaths ← [
    "GET  /ovds/invoices/stats",
    "GET  /ovds/invoices/next-number",
    "POST /ovds/invoices/bulk-send",
    "POST /ovds/invoices/bulk-cancel",
    "POST /ovds/invoices/flag-overdue",
    "GET  /ovds/estimates/stats",
    "GET  /ovds/estimates/next-number"
  ]
  
  RETURN request.method + " " + request.path IN staticPaths
END FUNCTION
```

**Examples:**
- `GET /ovds/invoices/stats` → currently hits `:id` handler, returns 404 — **bug**
- `POST /ovds/invoices/bulk-send` → currently hits `/:id/send`, returns 404 — **bug**
- `GET /ovds/invoices/abc-123` → hits `:id` handler correctly — **not a bug**

---

### Bug Condition — Category 2: Missing Backend Endpoints

```
FUNCTION isBugCondition_MissingEndpoint(request)
  INPUT: HTTP request
  OUTPUT: boolean
  
  RETURN (request.method = "POST" AND request.path MATCHES "/ovds/invoices/[^/]+/void")
      OR (request.method = "POST" AND request.path MATCHES "/ovds/invoices/[^/]+/reminder")
      OR (request.method = "GET"  AND request.path MATCHES "/ovds/invoices/[^/]+$"
          AND NOT EXISTS handler for GET /ovds/invoices/:id)
      OR (request.path MATCHES "^/ovds/estimates"
          AND NOT EXISTS handler for that method+path in OvdsController)
END FUNCTION
```

**Examples:**
- `POST /ovds/invoices/abc/void` → 404 — **bug**
- `GET /ovds/invoices/abc` → 404 — **bug**
- `GET /ovds/estimates` → 404 — **bug** (no estimates routes in OvdsController)

---

### Bug Condition — Category 3: Stats Response Shape Mismatch

```
FUNCTION isBugCondition_StatsKeyMismatch(response)
  INPUT: JSON response from GET /ovds/invoices/stats
  OUTPUT: boolean
  
  RETURN response HAS KEYS { total, paid, draft, pending, partial, overdue }
     AND response DOES NOT HAVE KEYS { draftCount, pendingCount, paidCount, overdueCount }
END FUNCTION
```

Also includes the `flagOverdue` path mismatch:

```
FUNCTION isBugCondition_FlagOverdueMismatch(call)
  INPUT: JavaScript function call on invoicesApi
  OUTPUT: boolean
  
  RETURN call.function = "flagOverdue"
     AND call.httpMethod = "GET"
     AND call.path MATCHES "/ovds/invoices/overdue"
     AND backend ONLY handles "POST /ovds/invoices/flag-overdue"
END FUNCTION
```

---

### Bug Condition — Category 4: Tenant Isolation Failures

```
FUNCTION isBugCondition_TenantLeak(request)
  INPUT: authenticated HTTP request with JWT
  OUTPUT: boolean
  
  affectedEndpoints ← [
    "GET /purchases/bills",
    "GET /purchases/orders",
    "GET /purchases/grn",
    "GET /purchases/payments",
    "GET /ovds/bills",
    "GET /ovds/items",
    "GET /ovds/accounts",
    "GET /ovds/journal-entries",
    "GET /ovds/bank-accounts"
  ]
  
  RETURN request.path IN affectedEndpoints
     AND request.JWT.companyId IS NOT APPLIED to database WHERE clause
END FUNCTION
```

---

### Bug Condition — Category 5: Bill Total Miscalculation

```
FUNCTION isBugCondition_BillTotal(billData)
  INPUT: bill creation/update payload
  OUTPUT: boolean
  
  RETURN billData.items IS NOT EMPTY
     AND storedTotal ≠ SUM(item.price × item.quantity FOR item IN billData.items)
                       + calculatedVAT
END FUNCTION
```

---

### Bug Condition — Category 6: AP Aging Date Field

```
FUNCTION isBugCondition_ApAgingDate(bill)
  INPUT: bill record from database
  OUTPUT: boolean
  
  RETURN daysOverdue IS COMPUTED FROM bill.date (creation date)
     AND bill.dueDate EXISTS
     AND bill.dueDate ≠ bill.date
END FUNCTION
```

---

### Bug Condition — Category 7: Invoice Search

```
FUNCTION isBugCondition_Search(query)
  INPUT: search query string
  OUTPUT: boolean
  
  RETURN query.search IS NOT EMPTY
     AND (search IS CASE_SENSITIVE
          OR search ONLY MATCHES customerName
             AND NOT invoiceNumber)
END FUNCTION
```

---

### Bug Condition — Category 8: Frontend API Method Names

```
FUNCTION isBugCondition_ApiMethodName(call)
  INPUT: JavaScript method call on estimatesApi (imported from @ovds/features/accounting)
  OUTPUT: boolean
  
  RETURN (call.methodName = "delete"   AND "delete" NOT IN estimatesApi)
      OR (call.methodName = "convert"  AND "convert" NOT IN estimatesApi)
END FUNCTION
```

**Root cause detail:** `Invoices.tsx` imports `estimatesApi` from the accounting package
(via the re-export shim at `apps/frontend/src/services/ovdsApi.ts`). That object has
`remove` and `convertToInvoice`. The `EstimatesPanel` inside `Invoices.tsx` (lines 2165,
2171) calls the non-existent `estimatesApi.delete(id)` and `estimatesApi.convert(id)`,
throwing a `TypeError` at runtime.

---

### Bug Condition — Category 9: Bulk Delete Partial Failure

```
FUNCTION isBugCondition_BulkDelete(deletionResults)
  INPUT: array of Promise results for bulk deletion
  OUTPUT: boolean
  
  RETURN Promise.all IS USED (short-circuits on first failure)
     AND AT LEAST ONE deletion fails
     AND no success feedback is shown for completed deletions
END FUNCTION
```

---

### Bug Condition — Category 10: OTP Service Null-Safety

```
FUNCTION isBugCondition_OtpNullSafety(request)
  INPUT: HTTP request to POST /auth/otp/send or POST /auth/otp/verify
  OUTPUT: boolean
  
  RETURN (this.authService as any).otpService IS UNDEFINED
     AND optional chaining ?. suppresses the error
     AND response.success = true IS RETURNED despite no OTP being sent/verified
END FUNCTION
```

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors (must survive all fixes):**
- All existing invoice CRUD operations (create, update, send, mark-paid, duplicate, cancel)
- Double-entry GL journal posting on invoice creation and payment
- AR aging report (already fixed to use `dueDate`)
- `flagOverdue` service logic (already correctly scoped to PENDING/PARTIAL)
- `GET /auth/me` and all other auth endpoints
- `bankingService.findAccounts` with a valid non-null `companyId`
- `purchasesService` paginated responses — shape `{ data, total, page, limit, totalPages }`
- OTP happy-path when the OTP service **is** injected

**Scope of Non-Buggy Inputs:**
All requests that do NOT match any `isBugCondition_*` predicate above. These include:
- Invoice requests that use dynamic `:id` paths (not the static collision paths)
- Single-company data requests where `companyId` scoping was already applied
- Search requests without a `search` query param
- Bulk operations on empty or single-element sets

---

## Hypothesized Root Causes

### Category 1 — Route Ordering
NestJS registers routes in the order they appear in the controller class. In
`OvdsController`, static sub-paths (`/stats`, `/next-number`, `/bulk-send`,
`/bulk-cancel`, `/flag-overdue`) are declared **after** `@Get(':id')` and
`@Post(':id/send')`. The Express router consumes the segment before the static handler
is even checked.

### Category 2 — Missing Endpoints
The `OvdsController` was written incrementally and the following handlers were never
added: `GET /invoices/:id`, `POST /invoices/:id/void`, `POST /invoices/:id/reminder`.
The entire `/ovds/estimates` resource is absent; there is also no `Estimate` Prisma model
in `packages/database/prisma/schema.prisma`.

### Category 3 — Stats Shape Mismatch
`SalesService.getStats()` returns `{ total, paid, draft, pending, partial, overdue }`
but `fetchStats()` in `Invoices.tsx` reads `res?.draftCount`, `res?.pendingCount`,
`res?.paidCount`, `res?.overdueCount`. The key names diverged at some point and neither
side was updated. The `invoicesApi.flagOverdue()` client method issues a `GET` request
to `/ovds/invoices/overdue`, but the backend handler is `POST /ovds/invoices/flag-overdue`.

### Category 4 — Tenant Isolation
`PurchasesService` methods build `where: {}` clauses without a `companyId` parameter;
the `PurchasesController` forwards `@Query()` directly without injecting the JWT user's
`companyId`. `OvdsController.getBills/getItems/getAccounts/getJournalEntries` similarly
do not inject `req.user.companyId`. `BankingService.findAccounts(null, query)` returns
`where = {}` when `companyId` is null, selecting all tenants.

### Category 5 — Bill Totals
`PurchasesService.createBill` passes `data as any` directly to `prisma.bill.create`,
storing whatever `total` field the client sent without re-deriving it from line items.
There is no equivalent of `calculateInvoiceTotals()` for bills.

### Category 6 — AP Aging Date
`OvdsController.getApAging` computes `daysOverdue` as
`(now - new Date(b.date).getTime()) / MS_PER_DAY`. It should use `b.dueDate ?? b.date`
(matching the already-corrected AR aging logic in the same file).

### Category 7 — Invoice Search
`SalesService.findAll` builds `where.customerName = { contains: query.search }` — a
single-field, case-sensitive Prisma `contains`. It never searches `invoiceNumber`, and
the missing `mode: 'insensitive'` option causes MySQL/PostgreSQL case-sensitive matching.

### Category 8 — API Method Names
Two call-sites inside `EstimatesPanel` (rendered inline in `Invoices.tsx`) call
`estimatesApi.delete(id)` and `estimatesApi.convert(id)`. The `estimatesApi` exported by
`@ovds/features/accounting` has `remove` (not `delete`) and `convertToInvoice` (not
`convert`). The `@ovds/features/invoice` package's `estimatesApi` does have `convert` but
not `convertToInvoice`, and it is **not** the version that Invoices.tsx actually imports.

### Category 9 — Bulk Delete
`handleBulkDelete` in `Invoices.tsx` uses `Promise.all([...ids.map(invoicesApi.remove)])`.
`Promise.all` short-circuits on the first rejection, abandoning remaining deletions and
never reporting the partial success count to the user.

### Category 10 — OTP Null-Safety
`AuthController` accesses `(this.authService as any).otpService?.generateOtp(...)`. When
`otpService` is not injected (missing from the module registration or DI token), the
optional chaining returns `undefined`, the result is ignored, and the endpoint returns
`{ success: true }` — a false confirmation. This pattern also affects `verifyOtp`,
`forgotPassword`, and `resetPassword`.

---

## Correctness Properties

Property 1: Route Ordering — Static Routes Resolve Before Dynamic

_For any_ HTTP request where `isBugCondition_RouteOrdering` is true, the fixed
`OvdsController` SHALL route the request to the correct static handler and return a
non-404 response with the expected data shape.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

---

Property 2: Missing Endpoints — All Required Handlers Exist

_For any_ HTTP request where `isBugCondition_MissingEndpoint` is true, the fixed backend
SHALL respond with HTTP 200/201 (success) or an appropriate domain error (4xx for
validation), never 404.

**Validates: Requirements 2.7, 2.8, 2.9, 2.10, 2.11, 2.12**

---

Property 3: Stats Response Keys Match Frontend Expectations

_For any_ call to `GET /ovds/invoices/stats`, the fixed backend SHALL return an object
containing the keys `draftCount`, `pendingCount`, `paidCount`, `overdueCount`, `total`,
`partialCount` so that the invoice status tabs in `Invoices.tsx` display correct counts.

**Validates: Requirements 3.1**

---

Property 4: flagOverdue HTTP Contract Alignment

_For any_ call to `invoicesApi.flagOverdue()`, the fixed client SHALL issue a
`POST /ovds/invoices/flag-overdue` request that matches the backend handler, returning
`{ success: true, data: { flagged: N } }`.

**Validates: Requirements 3.2**

---

Property 5: Estimate API Method Names — No TypeError

_For any_ user action that triggers estimate deletion or estimate-to-invoice conversion,
the fixed `EstimatesPanel` SHALL call `estimatesApi.remove(id)` and
`estimatesApi.convertToInvoice(id)` respectively, without throwing a `TypeError`.

**Validates: Requirements 3.3, 3.4, 8.1, 8.2**

---

Property 6: Tenant Isolation — No Cross-Tenant Data

_For any_ authenticated request where `isBugCondition_TenantLeak` is true, the fixed
backend SHALL return only records whose `companyId` equals the JWT user's `companyId`.

**Validates: Requirements 4.1 – 4.9**

---

Property 7: Bill Totals Recalculated From Line Items

_For any_ bill creation request containing `items`, the fixed `PurchasesService` SHALL
recompute `subtotal`, `vatAmount`, and `total` from the line items using the same formula
as `SalesService.calculateInvoiceTotals()`, ignoring any `total` value supplied by the
client.

**Validates: Requirements 5.1**

---

Property 8: AP Aging Uses dueDate

_For any_ bill record where `dueDate` is set, the fixed AP aging endpoint SHALL compute
`daysOverdue` as `(now − dueDate) / MS_PER_DAY`, not `(now − date) / MS_PER_DAY`.

**Validates: Requirements 6.1**

---

Property 9: Invoice Search — Case-Insensitive, Multi-Field

_For any_ non-empty `search` string, the fixed `SalesService.findAll` SHALL return
invoices matching `invoiceNumber` OR `customerName`, case-insensitively.

**Validates: Requirements 7.1, 7.2**

---

Property 10: Bulk Delete — Partial Success Reported

_For any_ bulk deletion where at least one item succeeds and at least one fails, the
fixed `handleBulkDelete` SHALL use `Promise.allSettled`, report the count of succeeded
deletions to the user via a toast, and not swallow the partial failure silently.

**Validates: Requirements 9.1**

---

Property 11: OTP Endpoints — ServiceUnavailableException When Not Injected

_For any_ call to `POST /auth/otp/send`, `POST /auth/otp/verify`, `POST /auth/forgot-password`,
or `POST /auth/reset-password` when the OTP service is unavailable, the fixed handler
SHALL throw `ServiceUnavailableException` (HTTP 503) rather than returning a false
`{ success: true }` response.

**Validates: Requirements 10.1, 10.2**

---

Property 12: Preservation — Non-Buggy Inputs Unchanged

_For any_ input where none of the `isBugCondition_*` predicates hold, the fixed system
SHALL produce exactly the same result as the original system.

**Validates: Requirements 3.1 – 3.12 (Unchanged Behavior section)**

---

## Fix Implementation

### Fix 1 — Route Ordering in OvdsController

**File:** `apps/backend/src/ovds/ovds.controller.ts`

**Strategy:** Move all static sub-resource route handlers to appear **before** any dynamic
`@Get(':id')`, `@Patch(':id')`, `@Delete(':id')`, or `@Post(':id/…')` handler in the
class body. NestJS resolves routes in declaration order, so static paths must come first.

**Specific route reordering (invoices section):**
```
BEFORE :id handlers:
  GET  /invoices/stats          ← move above GET :id
  GET  /invoices/next-number    ← move above GET :id
  POST /invoices/bulk-send      ← move above POST :id/send
  POST /invoices/bulk-cancel    ← move above POST :id/send
  POST /invoices/flag-overdue   ← move above POST :id/send

AFTER :id handlers (already correct or new):
  GET    /invoices/:id
  PATCH  /invoices/:id
  DELETE /invoices/:id
  POST   /invoices/:id/send
  POST   /invoices/:id/void     ← new (Fix 2)
  POST   /invoices/:id/reminder ← new (Fix 2)
  POST   /invoices/:id/payments
  GET    /invoices/:id/payments
  ...
```

Same reordering applies to the `/estimates` section once added (Fix 2).

No logic changes — only physical handler ordering within the file.

---

### Fix 2 — Missing Endpoints

**Strategy:** Add estimates CRUD to `OvdsController` (not a new controller), add a
`Estimate` Prisma model, add `GET /invoices/:id`, `POST /invoices/:id/void`, and
`POST /invoices/:id/reminder`.

#### 2a — Prisma Estimate Model

**File:** `packages/database/prisma/schema.prisma`

Add a new `Estimate` model adjacent to `Invoice`:

```prisma
model Estimate {
  id              String   @id @default(uuid())
  estimateNumber  String   @default(uuid())
  customerName    String
  customerId      String?
  companyId       String?
  status          String   @default("DRAFT")    // DRAFT|SENT|ACCEPTED|DECLINED|CONVERTED
  date            DateTime @default(now())
  dueDate         DateTime?
  subtotal        Decimal  @default(0)
  vatAmount       Decimal  @default(0)
  totalAmount     Decimal  @default(0)
  notes           String?  @db.Text
  items           String?  @db.LongText         // JSON line-items (same shape as Invoice)
  convertedInvoiceId String?
  sentAt          DateTime?
  customerEmail   String?  @db.VarChar(200)
  customerPhone   String?  @db.VarChar(50)
  customerAddress String?  @db.VarChar(500)
  customerTin     String?  @db.VarChar(50)
  paymentTerms    String?  @db.VarChar(20)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @default(now()) @updatedAt
}
```

Run `prisma migrate dev` after adding the model.

#### 2b — EstimatesService (new file)

**File:** `apps/backend/src/sales/estimates.service.ts`

Extract from `SalesService` pattern. Key methods:

```typescript
findAll(query)     → paginated Estimate list, scoped to companyId
findOne(id)        → single Estimate or NotFoundException
create(data, userId?)
update(id, data, userId?)
remove(id)
send(id)           → status DRAFT → SENT, set sentAt
convertToInvoice(id) → create Invoice from Estimate, set convertedInvoiceId + status CONVERTED
getNextNumber(companyId?)
getStats(companyId?)
```

Totals calculation reuses `calculateEstimateTotals()` — same formula as
`calculateInvoiceTotals()` in `SalesService` (subtotal + VAT, no DRRF on estimates since
they are not final fiscal documents).

#### 2c — New handlers in OvdsController

Add before any dynamic `:id` route in the estimates section:

```typescript
// Static routes FIRST
@Get('estimates/stats')
@Get('estimates/next-number')

// Then CRUD
@Get('estimates')
@Post('estimates')
@Get('estimates/:id')
@Patch('estimates/:id')
@Delete('estimates/:id')

// Then actions (after :id routes)
@Post('estimates/:id/send')
@Post('estimates/:id/convert')
```

Add missing invoice handlers:

```typescript
@Get('invoices/:id')          // delegates to salesService.findOne(id)
@Post('invoices/:id/void')    // delegates to salesService.cancel(id, body.reason)
@Post('invoices/:id/reminder') // sends notification, delegates to NotificationService
```

#### 2d — Role guard on DELETE /invoices/:id

Change `@Roles('ADMIN', 'SALES')` (if missing) to `@Roles('ADMIN')` on
`deleteInvoice` — consistent with the Ovds SaaS "only ADMIN can permanently delete"
policy.

---

### Fix 3 — Stats Response Shape

**File:** `apps/backend/src/sales/sales.service.ts`

**Strategy:** Rename the returned keys in `getStats()` to match what the frontend reads.
This is safer than adding aliases because the frontend has been consistently expecting
the `*Count` suffix naming and will not need any changes.

```typescript
// BEFORE
return { total, paid, draft, pending, partial, overdue };

// AFTER
return {
  total,
  paidCount:    paid,
  draftCount:   draft,
  pendingCount: pending,
  partialCount: partial,
  overdueCount: overdue,
};
```

Also rename in the `getInvoiceStats` controller response (no wrapping needed — the
controller already returns `{ success: true, data }` and the frontend reads `res` after
the `invoicesApi.stats()` unwrapping).

**File:** `packages/features/accounting/src/services/ovdsApi.ts`

Fix `invoicesApi.flagOverdue`:

```typescript
// BEFORE
flagOverdue: (companyId?: string | null) => get<any>(`/ovds/invoices/overdue${buildQuery({ companyId })}`),

// AFTER
flagOverdue: (companyId?: string | null) => post<any>(`/ovds/invoices/flag-overdue`, { companyId }),
```

The backend `flagOverdue` handler is already a `POST` and already scopes to the JWT
`companyId` (see the existing BUG FIX comment in the controller). The client just needs
to use the correct method + path.

---

### Fix 4 — Tenant Isolation

#### 4a — PurchasesController (inject companyId from JWT)

**File:** `apps/backend/src/purchases/purchases.controller.ts`

Add `@Request() req: any` to all list methods. Pass `req.user.companyId` into the
service:

```typescript
// BEFORE
listBills(@Query() query: Record<string, unknown>) {
  return this.purchasesService.findBills(query);
}

// AFTER
listBills(@Query() query: Record<string, unknown>, @Request() req: any) {
  return this.purchasesService.findBills({ ...query, companyId: req.user?.companyId });
}
```

Apply to: `listBills`, `listOrders`, `listGrns`, `listPayments`.

#### 4b — PurchasesService (honour companyId in where clause)

**File:** `apps/backend/src/purchases/purchases.service.ts`

Each `find*` method already handles `query.status` and `query.vendorId` in `where`.
Add companyId scoping:

```typescript
// Add to findBills / findPurchaseOrders / findGrns / findVendorPayments
if (query.companyId) where.companyId = query.companyId;
```

#### 4c — OvdsController (inject JWT companyId into queries)

**File:** `apps/backend/src/ovds/ovds.controller.ts`

Affected handlers: `getBills`, `getItems`, `getAccounts`, `getJournalEntries`.

```typescript
// BEFORE
async getBills(@Query() query: Record<string, unknown>) {
  const result = await this.purchasesService.findBills(query as any);

// AFTER
async getBills(@Query() query: Record<string, unknown>, @Request() req: any) {
  const result = await this.purchasesService.findBills({
    ...query,
    companyId: query.companyId ?? req.user?.companyId,
  } as any);
```

For `getAccounts` and `getJournalEntries` (direct Prisma queries in the controller),
inject `companyId` into the `where` clause:

```typescript
const companyId = (query.companyId as string) ?? req.user?.companyId;
const where = companyId ? { companyId } : {};
```

#### 4d — BankingService guard against null companyId

**File:** `apps/backend/src/banking/banking.service.ts`

`findAccounts` already has `const where = companyId ? { companyId } : {};` — if
`companyId` is null it returns all accounts. Change behaviour to return empty when null:

```typescript
// BEFORE
const where = companyId ? { companyId } : {};

// AFTER
if (!companyId) return { data: [], total: 0, page: 1, limit, totalPages: 0 };
const where = { companyId };
```

`OvdsController.getBankAccounts` currently calls
`this.bankingService.findAccounts(null, query)`. Change to pass the JWT company:

```typescript
async getBankAccounts(@Query() query: Record<string, unknown>, @Request() req: any) {
  const companyId = (query.companyId as string) ?? req.user?.companyId ?? null;
  const result = await this.bankingService.findAccounts(companyId, query as any);
```

---

### Fix 5 — Bill Total Recalculation

**File:** `apps/backend/src/purchases/purchases.service.ts`

**Strategy:** Extract a shared `calculateBillTotals(items, vatRate)` helper inside
`PurchasesService`. Mirror the `calculateInvoiceTotals` signature from `SalesService`
but without DRRF (bills are payables, not fiscal sales documents).

```typescript
private calculateBillTotals(items: any[], vatRate = 15): { subtotal: number; vatAmount: number; total: number } {
  const subtotal = items.reduce((acc, item) => {
    const gross = Number(item.price ?? item.unitPrice ?? 0) * Number(item.quantity ?? 1);
    const disc  = Number(item.discount ?? 0);
    return acc + Math.max(0, gross - disc);
  }, 0);
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total     = Math.round((subtotal + vatAmount) * 100) / 100;
  return { subtotal, vatAmount, total };
}
```

In `createBill` and `updateBill`, call this helper when `data.items` is present:

```typescript
async createBill(data: Record<string, unknown>) {
  const items = (data.items as any[]) ?? [];
  const totals = items.length > 0
    ? this.calculateBillTotals(items, Number(data.vatRate ?? 15))
    : { subtotal: Number(data.subtotal ?? 0), vatAmount: Number(data.vatAmount ?? 0), total: Number(data.total ?? 0) };
  return this.prisma.bill.create({
    data: { ...data, ...totals } as any,
  });
}
```

---

### Fix 6 — AP Aging Date Field

**File:** `apps/backend/src/ovds/ovds.controller.ts`

In `getApAging()`, change the computation from `b.date` to `b.dueDate ?? b.date`:

```typescript
// BEFORE
daysOverdue: Math.floor((Date.now() - new Date(b.date).getTime()) / MILLISECONDS_PER_DAY)

// AFTER
const agingBase = b.dueDate ?? b.date;
daysOverdue: Math.floor((Date.now() - new Date(agingBase).getTime()) / MILLISECONDS_PER_DAY)
```

Also limit the query to bills that are actually overdue (add `dueDate: { lt: new Date() }`
filter), matching the already-corrected AR aging endpoint pattern.

---

### Fix 7 — Invoice Search (Multi-field, Case-Insensitive)

**File:** `apps/backend/src/sales/sales.service.ts`

In `findAll`, replace the single-field `where.customerName` assignment with a Prisma
`OR` clause and `mode: 'insensitive'`:

```typescript
// BEFORE
if (query.search) {
  where.customerName = { contains: query.search };
}

// AFTER
if (query.search) {
  where.OR = [
    { customerName:   { contains: query.search, mode: 'insensitive' } },
    { invoiceNumber:  { contains: query.search, mode: 'insensitive' } },
  ];
}
```

`mode: 'insensitive'` works on both PostgreSQL (native) and MySQL via Prisma's
case-folding. The `OR` is placed at the top level of `where`, meaning all other filters
(status, companyId, dateFrom/dateTo) continue to apply normally — search refines the
already-scoped result set.

---

### Fix 8 — Frontend API Method Name Aliases

**File:** `packages/features/accounting/src/services/ovdsApi.ts`

The `estimatesApi` object in this file is the canonical version imported by
`Invoices.tsx`. The `EstimatesPanel` inside that file calls `estimatesApi.delete(id)` and
`estimatesApi.convert(id)`. Rather than changing every call-site (which could regress
other panels), add the aliases on the API object:

```typescript
export const estimatesApi = {
  // ... existing methods ...
  remove:           (id: string) => del<void>(`/ovds/estimates/${id}`),
  delete:           (id: string) => del<void>(`/ovds/estimates/${id}`),  // alias for remove
  convertToInvoice: (id: string) => post<any>(`/ovds/estimates/${id}/convert`, {}),
  convert:          (id: string) => post<any>(`/ovds/estimates/${id}/convert`, {}),  // alias for convertToInvoice
};
```

This is a non-breaking additive change: existing callers of `remove` and `convertToInvoice`
continue to work, and the two broken call-sites in `EstimatesPanel` resolve without
touching the JSX.

---

### Fix 9 — Bulk Delete: Promise.allSettled

**File:** `apps/frontend/src/pages/Invoices.tsx`

In `handleBulkDelete`, replace `Promise.all` with `Promise.allSettled`:

```typescript
// BEFORE
await Promise.all(
  Array.from(selected).map((id) => invoicesApi.remove(id)),
);
toast.success(`${selected.size} invoice(s) deleted`);

// AFTER
const results = await Promise.allSettled(
  Array.from(selected).map((id) => invoicesApi.remove(id)),
);
const succeeded = results.filter(r => r.status === 'fulfilled').length;
const failed    = results.filter(r => r.status === 'rejected').length;
if (succeeded > 0) toast.success(`${succeeded} invoice(s) deleted`);
if (failed    > 0) toast.error(`${failed} invoice(s) could not be deleted`);
```

---

### Fix 10 — OTP Service Null-Safety

**File:** `apps/backend/src/auth/auth.controller.ts`

Replace the optional-chain access pattern with an explicit guard that throws
`ServiceUnavailableException` (HTTP 503) when the service is not available.

```typescript
// Helper — add as private method
private getOtpService(): any {
  const svc = (this.authService as any).otpService;
  if (!svc) {
    throw new ServiceUnavailableException('OTP service is not available');
  }
  return svc;
}

// BEFORE (sendOtp)
const code = await (this.authService as any).otpService?.generateOtp(email, purpose.toUpperCase());
return { success: true, message: 'OTP sent to email' };

// AFTER (sendOtp)
await this.getOtpService().generateOtp(email, purpose.toUpperCase());
return { success: true, message: 'OTP sent to email' };
```

Apply `getOtpService()` in: `sendOtp`, `verifyOtp`, `forgotPassword`, `resetPassword`.

Import `ServiceUnavailableException` from `@nestjs/common`.

---

## Testing Strategy

### Validation Approach

Two-phase strategy: (1) write exploratory tests that **fail on unfixed code** to confirm
the root cause, then (2) fix the code and verify all tests pass plus preservation tests
remain green.

---

### Exploratory Bug Condition Checking

**Goal:** Confirm each root cause before writing the fix.

**Category 1 — Route Ordering:**
1. `GET /ovds/invoices/stats` on unfixed code → expect 404 (will fail after fix)
2. `POST /ovds/invoices/bulk-send` on unfixed code → expect 404
3. `POST /ovds/invoices/flag-overdue` on unfixed code → expect 404

**Category 3 — Stats Keys:**
1. Call `salesService.getStats()` → assert returned object has key `draft` but NOT `draftCount`

**Category 4 — Tenant Isolation:**
1. Create bills for company A and company B. Authenticate as company A user.
   Call `GET /purchases/bills` without any filter. Assert response contains bills from
   both companies — confirming the leak.

**Category 7 — Search:**
1. Create invoice with `invoiceNumber: "INV-2024-0001"`, `customerName: "Acme"`.
   Call `findAll({ search: "INV-2024" })`. Assert 0 results (will fail after fix).
2. Create invoice with `customerName: "ACME CORP"`.
   Call `findAll({ search: "acme corp" })`. Assert 0 results (will fail after fix).

**Category 8 — API Methods:**
1. In a browser or jsdom test, call `estimatesApi.delete('id')`. Assert `TypeError`.
2. Call `estimatesApi.convert('id')`. Assert `TypeError`.

**Expected Counterexamples:**
- Route ordering: handler returns wrong entity or 404 for static paths
- Stats keys: `statusCounts.DRAFT` is always 0 in the UI despite existing DRAFT invoices
- Tenant leak: cross-tenant records appear in response
- Search: valid search returns empty result set
- API methods: uncaught TypeError crashes the React component

---

### Fix Checking

```
FOR ALL request WHERE isBugCondition_RouteOrdering(request) DO
  response ← OvdsController_fixed(request)
  ASSERT response.status ≠ 404
  ASSERT response.data MATCHES expectedShape(request.path)
END FOR

FOR ALL statsResponse WHERE isBugCondition_StatsKeyMismatch(statsResponse) DO
  fixed ← salesService_fixed.getStats(companyId)
  ASSERT fixed.draftCount   IS NUMBER
  ASSERT fixed.pendingCount IS NUMBER
  ASSERT fixed.paidCount    IS NUMBER
  ASSERT fixed.overdueCount IS NUMBER
END FOR

FOR ALL request WHERE isBugCondition_TenantLeak(request) DO
  result ← endpoint_fixed(request)
  ASSERT ALL item IN result.data SATISFY item.companyId = request.JWT.companyId
END FOR

FOR ALL bill WHERE isBugCondition_BillTotal(bill) DO
  stored ← purchasesService_fixed.createBill(bill)
  expected ← calculateBillTotals(bill.items)
  ASSERT stored.total = expected.total
END FOR

FOR ALL query WHERE isBugCondition_Search(query) DO
  results ← salesService_fixed.findAll({ search: query.search })
  ASSERT results.data CONTAINS invoice WHERE invoiceNumber MATCHES query.search
         OR customerName MATCHES query.search (case-insensitive)
END FOR
```

---

### Preservation Checking

```
FOR ALL request WHERE NOT isBugCondition_TenantLeak(request)
                   AND NOT isBugCondition_RouteOrdering(request)
                   AND request.path DOES NOT MATCH newly-added routes DO
  ASSERT endpoint_original(request) = endpoint_fixed(request)
END FOR

FOR ALL invoice WHERE invoice.status IN ['PAID', 'PENDING', 'OVERDUE'] DO
  // Flag-overdue must not touch non-PENDING/PARTIAL invoices
  salesService_fixed.flagOverdue(companyId)
  ASSERT invoice.status UNCHANGED
END FOR

FOR ALL call WHERE NOT isBugCondition_ApiMethodName(call) DO
  // Existing estimatesApi.remove() and estimatesApi.convertToInvoice() still work
  ASSERT estimatesApi_fixed[call.method](args) DOES NOT THROW
END FOR
```

**Property-Based Test Approach (Category 4 — Tenant Isolation):**
Generate random `companyId` pairs. For each pair, insert records for both companies.
For each company, call all affected endpoints authenticated as that company. Assert:
`ALL(result.data, r => r.companyId === authenticatedCompanyId)`.

**Property-Based Test Approach (Category 7 — Search):**
Generate random invoice numbers and customer names. For each, assert that searching by
an exact substring of either field returns the invoice in the result set (regardless of
case).

---

### Unit Tests

- `SalesService.getStats()` returns `{ draftCount, pendingCount, paidCount, overdueCount }`
- `PurchasesService.calculateBillTotals([...])` — spot-check totals against known values
- `PurchasesService.createBill({ items: [...] })` — assert stored `total` matches
  calculated total, ignoring any `total` in the payload
- `SalesService.findAll({ search: 'INV-2024' })` — asserts invoiceNumber search works
- `SalesService.findAll({ search: 'acme corp' })` — asserts case-insensitive customer match
- `BankingService.findAccounts(null, {})` — asserts returns empty set, not all accounts
- `AuthController.sendOtp` with no OTP service → asserts `ServiceUnavailableException`

### Property-Based Tests

- Random `companyId` pairs: all list endpoints return only same-company records (Cat 4)
- Random invoice line-item arrays: stored `totalAmount` always equals
  `calculateInvoiceTotals(items).grandTotal` (Cat 5, extended to bills)
- Random search strings containing substrings of generated invoice/customer names:
  search always returns at least the matching invoice (Cat 7)
- Random bulk-delete arrays with simulated partial failures: success count + failure count
  equals total array length (Cat 9)

### Integration Tests

- Full estimate lifecycle: `POST /ovds/estimates` → `POST /ovds/estimates/:id/send` →
  `POST /ovds/estimates/:id/convert` → assert invoice created in DB with `CONVERTED` estimate
- Invoice stats page load: `GET /ovds/invoices/stats` → assert tab badges show correct counts
- Bulk delete with one unauthorised ID: assert partial success toast shown, remaining
  invoices deleted
- OTP send with service unavailable: assert 503 returned, not 200

