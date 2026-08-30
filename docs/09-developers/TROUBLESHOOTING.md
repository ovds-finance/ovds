<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)
     📌 ARCHITECTURE: [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md) -->

# Troubleshooting & Error Reference

> How to diagnose failures in OVDS quickly. Sections:
> 1. [How to read an error response](#1-how-to-read-an-error-response) — the envelope every API call returns.
> 2. [Symptom → Cause → Resolution](#2-symptom--cause--resolution) — start here when something breaks.
> 3. [Backend HTTP error registry](#3-backend-http-error-registry) — what each status code means, with the NestJS exception that produces it.
> 4. [Prisma error codes](#4-prisma-error-codes) — the raw engine codes you will hit, and how to recover.
> 5. [Environment & ports checklist](#5-environment--ports-checklist) — `.env` and port conflicts.
> 6. [Logging & tracing](#6-logging--tracing).

Companion files:
- Data model reference: [DATA-MODEL.md](./DATA-MODEL.md)
- Upgrades & migrations: [UPGRADING.md](./UPGRADING.md)
- Extending the system: [ADDING-A-MODULE.md](./ADDING-A-MODULE.md)

---

## 1. How to read an error response

Every backend error passes through the global exception filter at
`apps/backend/src/common/http-exception.filter.ts`. The filter is a catch-all
(`@Catch()`), so **all** unhandled exceptions — HTTP exceptions, validation
errors, and unexpected runtime errors — are normalized to the same shape.

### Success envelope

```json
{ "statusCode": 200, "message": "OK", "data": { /* payload */ }, "success": true }
```

### Error envelope

```json
{
  "statusCode": 409,
  "message": "Unique constraint failed on the fields: (`email`)",
  "timestamp": "2026-08-23T00:12:34.567Z",
  "path": "/api/auth/register"
}
```

| Field | Always present? | Notes |
|-------|-----------------|-------|
| `statusCode` | Yes | HTTP status from the original exception. |
| `message` | Yes | Human-readable message. For validation failures this is a stringified array of per-field messages (see §3). |
| `timestamp` | Yes | ISO-8601 UTC time the error was handled. |
| `path` | Yes | Request path the error originated from. |
| `error` | **Only if `SHOW_ERROR_DETAILS=true`** | Short error name, e.g. `ConflictException`. |
| `stack` | **Only if `SHOW_ERROR_DETAILS=true`** | Stack trace (dev only). Never enable in production. |

> **Rule:** production logs and client code must rely only on `statusCode` +
> `message`. `error`/`stack` leak internals and are suppressed unless
> `SHOW_ERROR_DETAILS` is set. If you need detail in production, add structured
> logging (§6) instead of flipping that flag.

The frontend never hits the backend directly. `VITE_API_URL` points at a proxy
(e.g. `/api`) and the backend listens on **port 3001**, exposing Swagger at
`/api/docs`. So `path` values in errors look like `/api/...` even though the
browser URL differs.

---

## 2. Symptom → Cause → Resolution

Pick the closest symptom. Each row names the likely root cause and the fix.

| Symptom | Likely cause | Resolution |
|---------|--------------|------------|
| `401 Unauthorized` on a route that should be public | `JwtAuthGuard` applied to the wrong scope, or missing/expired JWT secret | Check the controller's `@UseGuards`. Verify `JWT_SECRET` / `REFRESH_TOKEN_SECRET` are set and match what issued the token. Turn on `SHOW_ERROR_DETAILS` to see the guard name in the error body. |
| `403 Forbidden` after login works | Role/permission check (`PermissionsGuard` / `RolesGuard`, backed by `RolePermission` / `UserRole` data) missing the mapping | Verify the user's `Role` has the `RolePermission` row for that action. Tenant-scoped checks also require `companyId` context. |
| `404 Not Found` for a tenant record that exists | Query missing `companyId` filter, or wrong company context | Every tenant-scoped query **must** filter on `companyId` (there is no `CompanyGuard` class — the filter is applied in the service/repository layer). Re-query with explicit `where: { id, companyId }`. |
| `409 Conflict` on create/update | `P2002` unique constraint (email, slug, tax number, etc.) | See [§4](#4-prisma-error-codes). Use `upsert` or check existence first. |
| `400 Bad Request` with a long array message | `class-validator` failed DTO validation | The `message` is a JSON array of field errors. Parse it and show per-field. See [§3](#3-backend-http-error-registry). |
| `500 Internal Server Error` with no detail | Unexpected runtime error swallowed by the catch-all filter (env has `SHOW_ERROR_DETAILS` off) | Turn on `SHOW_ERROR_DETAILS=true` in a dev/staging env to see `error`/`stack`, or grep backend logs by `path` + `timestamp` (§6). |
| App boots but calls fail with `ECONNREFUSED` | Backend not running, or `VITE_API_URL` wrong | `npx nx run backend:serve` (default 3001). Confirm `VITE_API_URL` in `apps/frontend/.env` (defaults to `/api`). |
| `PrismaClientInitializationError` / `Can't reach server` | `PRISMA_DATABASE_URL` wrong, or MariaDB down | Validate the URL and that MariaDB is reachable. Check `scripts/ensure-ports.mjs` for DB port. |
| Migrations fail with "already applied" / drift | Schema changed without `prisma migrate` | See [UPGRADING.md](./UPGRADING.md) — use `prisma migrate dev` and never hand-edit migration history. |
| Slow tenant queries | `companyId` present but no leading index | The multi-tenancy audit in [DATA-MODEL.md](./DATA-MODEL.md) lists 12 models missing the `companyId` index prefix. Add `@@index([companyId, ...])`. |
| Portal docs show stale content | `seed-docs` not re-run after editing `docs/` | Run `npm run docs:seed` (see [UPGRADING.md](./UPGRADING.md)). Note: `DATA-MODEL.md` is excluded from seeding — it ships as a file, not a portal article. |
| `422` from an oRPC procedure | Zod schema rejected input | oRPC validates with the generated `packages/contracts` Zod types. The message carries the Zod issue path. Fix the client payload. |

---

## 3. Backend HTTP error registry

These are the status codes you will see, the NestJS exception that produces
them, and where they come from. All are formatted by
`http-exception.filter.ts`.

| Status | NestJS exception | Typical origin | Meaning |
|--------|------------------|----------------|---------|
| 400 | `BadRequestException` | `class-validator` DTO failures, malformed input | The request body/params failed validation. `message` is a stringified array of field-level messages. |
| 401 | `UnauthorizedException` | `JwtAuthGuard`, expired/missing token | Authentication required or failed. |
| 403 | `ForbiddenException` | `RolePermission` / `CompanyGuard` | Authenticated but not permitted for this tenant/action. |
| 404 | `NotFoundException` | Repository `getOrThrow`, missing record | Resource does not exist (or not visible in this `companyId`). |
| 405 | `MethodNotAllowedException` | Wrong HTTP verb on a route | Route exists but not for this method. |
| 409 | `ConflictException` | `P2002` unique violation surfaced as conflict | Resource already exists / unique constraint. |
| 422 | n/a (oRPC) | Zod contract validation | Input failed the generated Zod schema on an oRPC procedure. |
| 429 | `HttpException(429)` | Rate limiter / throttler | Too many requests. |
| 500 | `InternalServerErrorException` (catch-all) | Any unhandled exception | Unexpected error. Detail hidden unless `SHOW_ERROR_DETAILS`. |
| 502/504 | n/a | Upstream/proxy timeout | Backend or MariaDB unresponsive behind the proxy. |

### Validation error detail (400)

When `class-validator` fails, NestJS throws `BadRequestException` whose `message`
is a **JSON array of strings**, one per failed constraint, e.g.:

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "timestamp": "2026-08-23T00:12:34.567Z",
  "path": "/api/auth/register"
}
```

Parse `JSON.parse(message)` on the client to render per-field errors.

---

## 4. Prisma error codes

OVDS uses the MariaDB/MySQL driver adapter (`@prisma/adapter-mariadb`) and does
**not** currently remap Prisma engine errors into custom domain exceptions — the
raw error surfaces through the catch-all filter (usually as a `500`, or a `409`
if the code is recognized). Treat the codes below as the authoritative registry.

Recover by mapping the code in a service-layer `try/catch` and re-throwing a
domain exception (e.g. `ConflictException`) so clients get a clean status.

| Code | Name | Meaning | Common OVDS trigger | Recovery |
|------|------|---------|---------------------|----------|
| `P2002` | Unique constraint failed | A create/update violated a `@unique`/`@@unique` field. | Duplicate email, slug, tax/VAT number, `companyId`+code composite. | Read `meta.target` (the field(s)), return `409`. Offer "did you mean" / suggest a corrected value. Use `upsert` where appropriate. |
| `P2003` | Foreign key constraint failed | A relation referenced a row that doesn't exist (or delete blocked by child rows). | Deleting a `Company` with child rows; referencing a missing `userId`. | Check `meta.field_name`. Cascade or null the relation as designed, or delete children first. |
| `P2025` | Record to update/delete does not exist | `update`/`delete`/`deleteMany` targeted a missing row. | Editing a record that was soft-deleted or belongs to another tenant. | Return `404`. Ensure queries include `companyId` so a different-tenant row isn't "found". |
| `P2000` | Value too long for column | String exceeded `@db.VarChar(n)`. | Long free-text in a `VarChar` field. | Shorten/validate on the DTO (`@MaxLength`), or widen the column via a new migration. |
| `P2011` | Null constraint violation | Non-nullable field received `null`. | Missing required DTO field bypassed (or partial update). | Make the field required in the Zod/DTO, or provide a default. |
| `P2014` | Relation violation | Required relation not connected on create. | Creating an invoice without a `companyId` connection. | Connect the required relation before save. |
| `P2021` | Table does not exist | Query hit a table missing from the DB. | Migration not applied / wrong schema. | Run `prisma migrate deploy` (see [UPGRADING.md](./UPGRADING.md)). |
| `P2022` | Column does not exist | Query referenced a column absent from the DB. | Client generated from a newer schema than the DB. | Regenerate client and apply migrations. |
| `P2034` | Transaction failed | Write conflict / deadlock (InnoDB). | Concurrent writes to the same row (stock, balances). | Retry with backoff; keep transactions short; avoid locking reads. |

> Example recovery pattern:

```ts
try {
  return await this.prisma.invoice.create({ data });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    throw new ConflictException(
      `Duplicate value for ${e.meta?.target ?? 'unique field'}`,
    );
  }
  throw e;
}
```

---

## 5. Environment & ports checklist

### `.env` (from `.env.example`)

| Variable | Required | Purpose | Symptom if missing |
|----------|----------|---------|--------------------|
| `PRISMA_DATABASE_URL` | Yes | MariaDB/MySQL connection for Prisma adapter | `PrismaClientInitializationError` / `Can't reach server`. |
| `JWT_SECRET` | Yes | Signs access tokens | All requests `401` after login. |
| `REFRESH_TOKEN_SECRET` | Yes | Signs refresh tokens | Refresh flow fails; forced re-login. |
| `REDIS_*` | Yes (caching/sessions) | Session store / queues | Auth/session features misbehave. |
| `SMTP_*` | For email | Transactional email | Invites/alerts silently fail. |
| `VITE_API_URL` | Yes (portal) | Proxy base the SPA calls | `ECONNREFUSED` from the frontend. |
| `SHOW_ERROR_DETAILS` | No (dev) | Exposes `error`/`stack` | Leave **off** in production. |

### Ports

`scripts/ensure-ports.mjs` reserves: **3000, 3001, 3002, 3003, 5173, 5174**.

| Port | Service |
|------|---------|
| 3001 | NestJS API — default `PORT` from `main.ts`; Swagger at `/api/docs` |
| 3000 | Also reserved by `ensure-ports` (alternate/legacy serve port) |
| 3002 / 3003 | Additional backend instances / workers |
| 5173 / 5174 | Vite dev servers (portal / other apps) |

If you see `EADDRINUSE`, a previous dev process is still bound. Kill it or let
`ensure-ports` reassign. MariaDB/Redis run on their own default ports — verify
they are up before blaming the app.

---

## 6. Logging & tracing

- The catch-all filter logs every exception with `path` + `timestamp`. Correlate
  client errors to server logs using those two fields.
- Enable `SHOW_ERROR_DETAILS=true` **only** in dev/staging to get `error`/`stack`
  in the response body.
- For production diagnostics, prefer structured logging (request id, `companyId`,
  `userId`) over response bodies. Add a NestJS logger interceptor rather than
  widening the error envelope.
- Swagger at `/api/docs` (port 3001) documents every REST route and the expected
  error statuses — use it to confirm what a given endpoint returns.

---

## 7. Escalation

1. Reproduce with `SHOW_ERROR_DETAILS=true` (non-prod) and capture `statusCode`,
   `message`, `path`, `timestamp`.
2. Cross-reference the status in [§3](#3-backend-http-error-registry) and any
   `Pxxxx` code in [§4](#4-prisma-error-codes).
3. If it's a data/schema issue, check [DATA-MODEL.md](./DATA-MODEL.md) (the
   multi-tenancy audit catches missing `companyId` indexes).
4. If it's an upgrade/migration issue, see [UPGRADING.md](./UPGRADING.md).
