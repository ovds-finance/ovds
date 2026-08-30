<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](./CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [./FILING-LIFECYCLE.md](./FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](./subscription and monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](./UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

I have thoroughly explored the codebase. Here is the comprehensive summary.

# Codebase Exploration Report: OVDS Monorepo (`C:\xampp\htdocs\ovds`)

## 1. Project Type & Tech Stack

This is **OVDS** — an *Online VAT Return System* / ERP-BPM platform for Ethiopian businesses (accounting, HR/payroll, tax vat compliance, invoice, CRM, IoT, device governance). It is a **single Nx monorepo** (`name: "ovds-monorepo"`, private) using **pnpm workspaces** (`apps/*`, `packages/*`, `packages/shared/*`).

**Core stack:**
- **Orchestration/API:** NestJS 11 (`@nx/nest`), REST controllers, WebSockets (`@nestjs/websockets`), EventEmitter, BullMQ/Redis queues, `@nestjs/throttler` rate limiting.
- **Presentation:** React 19 + Vite (`@nx/react`), TanStack React Query, Tailwind, Radix UI (`packages/ui`).
- **Shared contracts:** TypeScript packages `@ovds/shared`, `@ovds/contracts`, `@ovds/dto`, `@ovds/database`.
- **RPC (emerging):** `@orpc/server` / `@orpc/client` mounted alongside REST (migration-in-progress).
- **Validation:** `class-validator` / `class-transformer` + `zod` (Prisma Zod generator).
- **DB:** Prisma 7.8 (`@prisma/client`) over **MySQL/MariaDB** (`@prisma/adapter-mariadb`, `mariadb` driver).
- **Auth:** JWT (HS256 local) + Auth0 (RS256), bcryptjs password hashing, Google OAuth.
- **Docs/Infra:** `docs/` (mdoc manuals), `infra/nginx`, `infra/mysql`.

## 2. Directory Layout & Purpose

```
C:\xampp\htdocs\ovds
├── apps/
│   ├── backend/                NestJS API + WebSocket gateway + biz modules + static serving
│   │   └── src/                ~70 domain modules (auth, hr, ovds, tax, iot, workflow, device-control, …)
│   ├── frontend/               React/Vite SPA (pages/, services/, hooks/, rbac/, components/)
│   └── public/                 Built static assets served by backend
├── packages/
│   ├── shared/                 @ovds/shared: enums (Role, CompanyType), RBAC policy, device-control types, workflow engine, tax/ovds utils
│   ├── database/               @ovds/database: Prisma schema, migrations, seeds, tenant helpers
│   ├── contracts/              @ovds/contracts: oRPC appContract + generated prisma-zod schemas
│   ├── ui / design-system/     @ovds/ui: reusable React components/shells
│   ├── dto/                    @ovds/dto: class-validator DTOs
│   ├── license/ node-registry/ /   auxiliary packages
├── infra/mysql  infra/nginx    DB config (my.cnf), nginx.conf + docker-compose.scale.yml
├── docs/                       mdoc manuals (01-getting-started … 10-frameworks) + ARCHITECTURE.md
├── scripts/                    build/seed/deploy/check-arch helpers
├── nx.json  package.json  tsconfig.base.json  .env* (.env, .env.production, .env.example …)
```

The workspace enforces module boundaries via `nx.json` `depConstraints` (tags: `scope:frontend`, `scope:backend`, `scope:shared`, `type:ui`, `type:lib`, `type:tokens`).

## 3. Models / Schemas (Prisma)

Schema lives at `packages/database/prisma/schema.prisma` (6,665 lines, ~170 models, 2 generators: `prisma-client-js` + `zod-prisma-types` → `packages/contracts/src/prisma-zod`; datasource `provider = "mysql"`).

### Organizations — `Company` (`packages/database/prisma/schema.prisma:686`)
`id @id @default(uuid())`, `name @unique`, `type CompanyType`, `tin`, `vatNumber`, `businessType`, `language`, `location`, `apiKey @unique`, `currencyCode` (default ETB), `logoUrl`, `fiscalYearStart`, `industry`, `teamSize`, `settings LongText`, `ifrsConfig LongText`, `autoUpdate`, `currentVersion`, `environment AppEnvironment`. Relations to nearly every domain entity (`user`, `employee`, `invoice`, `account`, `journalEntry`, `vatFiling`, `clientNode`, `taxProfile`, etc.). `@@map("company")`.
- `CompanyType` enum (`packages/shared/src/types.ts:92`): MANUFACTURING, LARGE_ENTERPRISE, MEDIUM_ENTERPRISE, SMALL_BUSINESS, FREELANCER, GOVERNMENT, RETAIL, WHOLESALE, SERVICE, NGO.
- `AppEnvironment` enum (`types.ts:107`): STAGING, PRODUCTION, DEVELOPMENT.

### Users — `User` (`schema.prisma:2278`)
`id @id uuid`, `username @unique`, `email @unique`, `password?`, `role Role @default(EMPLOYEE)`, `employeeId @unique?`, `companyId?` → `Company`, `auth0Id @unique?`, `mfaEnrolled`, `isActive`, `failedLoginAttempts`, `lockedUntil`, `lastLoginAt`, `timezone`, `lastLoginCountry`, `lastLoginIP`, `sessionsCount`, `@@index([companyId])`, `@@map("user")`.
- `Role` (`packages/shared/src/types.ts:62`): SPURADMIN, SUPERADMIN, DEVELOPER, ADMIN, PROJECT_MANAGER, ovds, ACCOUNTING, IFRS_OFFICER, HR, AUDITOR, EXTERNAL_AUDITOR, BANK_LIAISON, CRM, PARTNER, EMPLOYEE, CLIENT, DATA_CLERK (22 roles, hierarchy-weighted in `rbac.ts`).

### Devices
- **`SrmDevice`** (`schema.prisma:5245`) — ERCA/TASS fiscal devices: `deviceSerialNo @unique`, `deviceModel`, `tassDeviceId?`, `registrationCode?`, `tin`, `businessAddress`, `status` (ACTIVE|SUSPENDED|DECOMMISSIONED), `lastZReportDate`, `lastXReportDate`, `fiscalMemoryUsedPct`, `serviceContractRef/Expiry`, `@@map("srm_device")`.
- **`IotDevice`** (`schema.prisma:5486`) — `name`, `serialNumber`, `externalRef?`, `deviceType` (SMART_METER|ROUTER|SENSOR|CONTROLLER|CAMERA|POS_TERMINAL|OTHER), `location`, `firmwareVersion`, `status` (ACTIVE|INACTIVE|MAINTENANCE|DECOMMISSIONED|OFFLINE), `lastSeenAt`, `batteryLevel`, `connectionString`, `protocol` (MQTT|HTTP|COAP|MODBUS|ZIGBEE|ZWAVE|BLE), `configJson LongText`, `customerId?`, `fixedAssetId?`. Relations: `IotTelemetry`, `IotAlert`, `OtaUpdateJob`, `IotBillingTrigger`. (`@map("iot_device")`).

### Policies
- **`DeviceControlPolicy`** (`schema.prisma:6602`) — org-wide enforced policy: `companyId`, `category DeviceControlCategory`, `version Int` (monotonic per company+category), `settings LongText` (JSON), `changeRequestId?`, `enforcedAt`, `enforcedById?`, `@@unique([companyId, category])`, `@@map("device_control_policy")`.
- **`DeviceControlCategory`** enum: `ENCRYPTION | APP_PERMISSION | NETWORK_POLICY | ENFORCEMENT_RULE`.
- Other policy-like: `TaxRule`, `SectorTaxOverride`, `TaxGlAccount`, `CompanyTaxProfile`, `systemsetting`, `FeatureFlag`/`CompanyFeatureFlag`.

### Approvals / Workflow
- **`DeviceControlChangeRequest`** (`schema.prisma:6623`) — maker-checker: `companyId`, `category`, `settings LongText`, `reason?`, `status DeviceControlChangeStatus @default(DRAFT)`, `makerId/makerName`, `submittedAt`, `checkerId/checkerName`, `reviewedAt`, `reviewNote?`, `resultingPolicyId?`. `@@index([companyId,status])`, `@@map("device_control_change_request")`.
- **`DeviceControlChangeStatus`** enum: `DRAFT | PENDING | APPROVED | REJECTED | APPLIED | CANCELLED`.
- **`ForexApproval`** (`schema.prisma:3811`) — `shipmentId`, `bankName`, `applicationDate`, `approvalDate`, `approvalRef?`, `foreignCurrency`, `foreignAmount`, `etbEquivalent`, `exchangeRate`, `status` (PENDING|APPROVED|REJECTED|EXPIRED), linked to `TradeShipment`.
- **`workflowrun` / `workflowtaskrun`** — generic workflow persistence models.
- Other approval-bearing entities: `ExpenseClaim`, `LoanRequest`, `ReimbursementClaim`, `TaxClearanceRequest`, `TaxDisputeCase`, `TradeLicense`, `ProformaInvoice`, `CustomsDeclaration` (status DRAFT→SUBMITTED→ASSESSED→PAID→CLEARED→REJECTED).

**Shared device-control types** (`packages/shared/src/device-control.ts`): `DeviceControlCategory`, `DEVICE_CONTROL_CATEGORIES`, `DEVICE_CONTROL_CATEGORY_META`, `DeviceControlChangeStatus`, `DEVICE_CONTROL_PERMISSIONS` (`device_control:read|propose|approve`), `DeviceControlSettings`, `DeviceControlPolicyDTO`, `DeviceControlChangeRequestDTO`, `CreateDeviceControlChangeRequestDTO`, `ReviewDeviceControlChangeRequestDTO`, and `DEVICE_CONTROL_DEFAULT_SETTINGS` (per-category safe defaults).

## 4. Route Patterns

Global prefix **`api`** set in `main.ts:80`; static frontend served at `/` (excluded `/api/*`).

**NestJS REST controllers** (each `@Controller('<base>')`, guarded by `AnyAuthGuard` + `RBACGuard` globally). Example — `DeviceControlController` (`apps/backend/src/device-control/device-control.controller.ts`):
- `GET /api/device-control/policies` → `device_control:read`
- `GET /api/device-control/change-requests?status&category` → `device_control:read`
- `POST /api/device-control/change-requests` → `device_control:propose` (body `CreateChangeRequestDto`)
- `POST /api/device-control/change-requests/:id/submit` → `device_control:propose`
- `POST /api/device-control/change-requests/:id/review` → `device_control:approve` (body `ReviewChangeRequestDto`)
- `POST /api/device-control/change-requests/:id/cancel` → `device_control:propose`

Other examples: `WorkflowEngineController` `@Controller('ovds/workflow')` → `GET /api/ovds/workflow/:period`, `POST .../:period/run`, `POST .../:period/run/:taskId`, `GET .../catalog`; `AuthController` (`/api/auth`), plus 70+ modules each exposing `/api/<domain>` routes.

**oRPC** (`apps/backend/src/orpc/orpc.module.ts`) — catch-all `POST /api/rpc/*path` from `@ovds/contracts` (`appContract`), running alongside REST during migration; `useOrpc.ts`/`orpc.ts` on frontend.

**Frontend API clients** (`apps/frontend/src/services/*.ts`) — axios wrappers (`api.ts` base) e.g. `deviceControlApi.ts` uses React Query (`useDeviceControlPolicies`, `useCreateChangeRequest`, …). Pages in `apps/frontend/src/pages/` (incl. `DeviceControl.tsx`, `IotHub.tsx`).

## 5. Approval / Workflow Patterns

**Maker-checker for device governance** (`device-control.service.ts`):
- `createChangeRequest` → status `DRAFT` (or `PENDING` if `submit`).
- `submitChangeRequest` → `DRAFT`→`PENDING`.
- `reviewChangeRequest` → only `PENDING` reviewable; **segregation of duties** enforced (`makerId !== checkerId`, throws `ForbiddenException`); APPROVE calls `applyApproved`.
- `applyApproved` → `upsert`s `DeviceControlPolicy` (bumps `version`), sets request `APPLIED` + `resultingPolicyId`, then **broadcasts `DEVICE_CONTROL_POLICY_ENFORCED` via WebSocket** to the company room and writes an audit log (`APPROVE_DEVICE_CONTROL_CHANGE`, etc.).
- `cancelChangeRequest` → only maker can cancel `DRAFT`/`PENDING`.
- Every transition emits audit logs through `AuditLogService`; WebSocket broadcast via `WebsocketGateway.broadcastDeviceControlUpdate`.

**General RBAC** (single source of truth `packages/shared/src/rbac.ts`):
- `ROLE_HIERARCHY`, `ROLE_PERMISSIONS` (role→permission[]), `Permission` type (`resource:action`), `CONTEXTUAL_RULES` (amount/status gated approvals e.g. `payroll:approve`, `fund_transfers:approve`), `RESOURCE_DOMAINS`, `ROUTE_POLICY` (route→permission), `DEFAULT_ROUTE`, helpers `hasPermission`, `canAccessRoute`, `canCrud`, `getPermissions`.

**ovds Workflow Engine** (`apps/backend/src/workflow/workflow-engine.service.ts`) — 7-module accounting lifecycle (pre/post conditions, `dependsOn`, rollback) with `TaskStatus` (PENDING|SKIPPED|RUNNING|COMPLETED|FAILED|BLOCKED) and `TaskPriority` (REQUIRED|RECOMMENDED|OPTIONAL), catalog from `@ovds/shared`.

## 6. Authentication & Middleware / Guards

Global guard chain (`app.module.ts:157` providers `APP_GUARD`): `ThrottlerGuard` → `AnyAuthGuard` → `CompanyGuard` → `MandatoryReleaseGuard` → `RBACGuard`, plus `SecurityHeadersInterceptor`.

- `AnyAuthGuard` (`auth/any-auth.guard.ts`) — `AuthGuard(['jwt','auth0'])`; respects `@Public()`; fails hard if `JWT_SECRET` unset in production; SSO enforcement (`AUTH0_ENFORCED`); logs failures via `SecurityAuditService`.
- `JwtStrategy` (`auth/jwt.strategy.ts`) — `passport-jwt`, Bearer token, validates against `prisma.user`, caches session in Redis (`CacheService`/`CacheKeys.user`), reads Auth0 `roles`/`permissions` claims.
- `RBACGuard` (`auth/guards/rbac.guard.ts`) — reads `@Roles()`/`@RequirePermission()` (`ROLES_KEY`); super-admins bypass; supports role-name + permission-string (`resource:action`) + Auth0 fine-grained fallback; **caches company type** (60s TTL, size-capped) to gate module availability; logs authz failures.
- Other guards: `roles.guard.ts`, `rbac.guard.ts`, `business-type.guard.ts`, `company.guard.ts`, `google-auth.guard.ts`, `auth0-auth.guard.ts`.
- Decorators: `@CurrentUser`, `@Roles`, `@RequirePermission`, `@Public`, `@SecurityContext`.
- Strategies: `jwt.strategy.ts`, `auth0.strategy.ts`, `google.strategy.ts`; `otp.service.ts`, `auth0-user.repository.ts`.
- Middleware (registered in `app.module.ts` `configure`): `SanitizeInputMiddleware`, `RequestIdMiddleware`, `MaintenanceMiddleware`, `RequestLoggerMiddleware`.
- Global: `ValidationPipe` (whitelist, forbidNonWhitelisted), `helmet`, `compression`, CORS (dev port allowlist), `AllExceptionsFilter`, `Transform/Logging/TimeoutInterceptors`. Throttler default: 100 req/min.

## 7. Database Setup

- **ORM/DB:** Prisma 7.8 client over MySQL/MariaDB. Adapter `@prisma/adapter-mariadb`. Connection via `PRISMA_DATABASE_URL` (`.env` chain: `apps/backend/.env.<NODE_ENV>` → root `.env`).
- **Migrations:** `packages/database/prisma/migrations/` (~30 numbered migrations, 2026-05 → 2026-07) **and** raw SQL in `packages/database/migrations/` (`device_control_tables.sql`, `gap_fix_*.sql`, `universal_tax_config.sql`, `add_local_nodes_table.sql`).
- **Scripts (root `package.json`):** `db:generate`, `db:push`/`db:push:prod`, `db:migrate`/`db:migrate:dev`/`db:migrate:prod`, `db:studio`, `seed`/`seed:prod`/`seed:demo`. Database pkg scripts use `scripts/prisma-run.mjs`, `fix-fk-collisions.mjs`.
- **Tenant scoping:** `PrismaModule`/`PrismaService` + `TenantModule` (`common/tenant`) for hard per-request tenant isolation; `tenant-scoped.ts` helper in `@ovds/database`.
- **Seeds/Zod:** `prisma/seed.ts`, `seed-demo.ts`; `db:generate:zod` outputs browser-safe Zod schemas to `packages/contracts/src/prisma-zod`.
- **Outbox pattern:** `OutboxEvent` model for reliable portal/double-submission handling.

## 8. Testing Setup

Backend (`apps/backend`):
- **Jest** unit (`*.spec.ts`, e.g. `auth.service.spec.ts`) and **Playwright** e2e (`test/*.e2e-spec.ts`: `health.e2e-spec.ts`, `ovds-crud.e2e-spec.ts`, `app.integration-spec.ts`) with `global-setup.ts`/`setup.ts`/`jest-e2e.json`.
- **Vitest** configs: `vitest.config.ts`, `vitest.config.integration.ts`, `vitest.setup.ts`; integration targets via `test:integration`/`test:e2e` scripts. `playwright.config.ts` present.

Frontend (`apps/frontend`): **Vitest** unit/component tests under `src/**/*.test.ts(x)` (e.g. `rbac.engine.test.ts`, `utils.ethiopianTax.test.ts`, `pages/DocsPortal.spec.tsx`) with `setup.ts`.

Workspace commands: `npm run test` (nx run-many backend/frontend/shared), `test:coverage`, `test:ci`, `affected:test`, `lint`, `typecheck`.

---

### Key takeaway for your domain (orgs/users/devices/policies/approvals)
The **`device-control` module is the canonical reference implementation** for org-wide policy approvals: `DeviceControlPolicy` (enforced settings, versioned per `companyId`+`category`), `DeviceControlChangeRequest` (maker-checker DRAFT→PENDING→APPROVED/REJECTED/CANCELLED/APPLIED with segregation-of-duties + WebSocket broadcast + audit logging), backed by shared types in `packages/shared/src/device-control.ts`, RBAC permissions `device_control:read|propose|approve` in `rbac.ts`, and a React Query frontend client (`services/deviceControlApi.ts` + `pages/DeviceControl.tsx`). Devices are modeled as `SrmDevice` (fiscal) and `IotDevice` (telemetry/OTA/alerts). The same guard/RBAC/audit patterns apply across all ~70 modules.


