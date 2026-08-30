<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# OVDS — Repository Guidelines & System Reference

## Project Overview
**OVDS** (Online VAT Return System) is a production-ready, multi-tenant ERP platform built for Ethiopian businesses. It provides full HR, payroll, accounting, tax compliance (VAT/ERCA), invoice, CRM, and business management in a single system.

**Stack:** NestJS 11 (backend) + React 19 + Vite 6 (frontend) + Prisma 7 + MySQL/MariaDB

### Strategic Purpose
OVDS bridges international ERP standards with Ethiopian fiscal law, enabling enterprises of all sizes — from freelancers to large manufacturers — to manage operations, HR, and ovds in one locally deployable system. It strengthens business credibility, bank loan eligibility, and investment transparency through live scoring dashboards and audit-ready records.

---

## Ethiopian SME Context

Understanding the Ethiopian business landscape is essential for building features that serve OVDS users correctly. The `BusinessType` enum and IFRS tier system are designed around this reality.

### Common SME Sectors in Ethiopia

| Sector | Examples | Typical `BusinessType` | IFRS Tier |
|--------|---------|----------------------|-----------|
| Manufacturing / Agro-Processing | Textiles, garments, leather, food & beverage, metalwork, furniture, honey/spice packaging | `MANUFACTURING` | Tier 1 or Tier 2 |
| Service | Cafes, restaurants, transport, tourism, maintenance, beauty salons, ICT/software | `SMALL_BUSINESS` / `MEDIUM_ENTERPRISE` | Tier 2 or Tier 3 |
| Trade & Retail | Wholesale, retail, raw material supply, e-commerce (Telegram, Instagram, TikTok) | `SMALL_BUSINESS` | Tier 2 or Tier 3 |
| Construction | Sub-contracting, cobblestone production, building materials | `SMALL_BUSINESS` / `MEDIUM_ENTERPRISE` | Tier 2 |
| Urban Agriculture | Livestock, poultry, dairy processing, bee production | `SMALL_BUSINESS` / `FREELANCER` | Tier 2 or Tier 3 |
| Large Enterprise | 500+ employees, banks, insurers, government-owned entities | `LARGE_ENTERPRISE` / `GOVERNMENT` | Tier 1 (mandatory) |

### Ethiopian Business Legal Structures

| Structure | Description | Typical Size | OVDS `BusinessType` |
|-----------|-------------|-------------|---------------------|
| Sole Proprietorship | Single owner, unlimited liability | Micro / Freelancer | `FREELANCER` |
| Partnership | 2+ individuals pooling resources | Small | `SMALL_BUSINESS` |
| Private Limited Company (PLC) | Limited liability, preferred for growth | Small–Medium | `SMALL_BUSINESS` / `MEDIUM_ENTERPRISE` |
| Cooperative Society | Government-backed, min 5 members | Small–Medium | `SMALL_BUSINESS` |
| Share Company | Corporate structure, larger SMEs | Medium–Large | `MEDIUM_ENTERPRISE` / `LARGE_ENTERPRISE` |
| Government Entity | Public sector, state-owned enterprises | Any | `GOVERNMENT` |

### IFRS Threshold Quick Reference (AABE)

| Threshold | Criteria (meet 2 of 4) | Mandatory Since |
|-----------|----------------------|----------------|
| **Full IFRS (Tier 1)** | Turnover > ETB 300M **or** Employees > 200 **or** Assets > ETB 200M **or** Liabilities > ETB 200M | 7 July 2023 |
| **IFRS for SMEs (Tier 2)** | Turnover > ETB 20M **or** Employees > 20 **or** Assets > ETB 20M **or** Liabilities > ETB 20M | 7 July 2024 |
| **Micro-entity (Tier 3)** | Below Tier 2 thresholds | Outside IFRS scope |

> Banks, insurance companies, and government-owned enterprises are **always Tier 1** regardless of size.

### Ethiopian Fiscal Year

- **Start:** Hamle (July 7/8) — month 7 in Gregorian
- **End:** Sene (July 6/7 of the following year)
- **BIT filing deadline:** Within 4 months of FY end → **November 7**
- **VAT filing deadline:** 30th of the following month (monthly)
- **DRRF filing:** Quarterly — 15th of the last month of each quarter
- **Pension remittance:** Monthly, same cycle as payroll

### Digital Commerce & Payment Context

Ethiopian SMEs increasingly use digital channels. OVDS supports:
- **Ethio Telecom (telebirr)** — `paymentSource: TELECOM`, `telecomRef` field, circuit breaker protection
- **CBE, Awash, Dashen, Abyssinia** — `paymentSource: BANK_TRANSFER`, `bankName` field
- **Mobile banking apps** — `paymentSource: MOBILE_BANKING`
- **E-commerce invoice** — recurring invoices, share links, QR codes for digital storefronts
- **NBE-IQR format** — ERCA-compliant QR on every invoice for digital verification

### Government Support Programs

Ethiopian government provides SME support through:
- **Working spaces ("shades")** — relevant for `geofence_lat/lon` configuration per location
- **Technical training** — tracked via `Employee.cadre` and `Employee.designation` fields
- **Market access programs** — partnership agreements tracked via `Partnership` model
- **Cooperative financing** — `BusinessLoan` model with `LoanType: WORKING_CAPITAL` or `GOVERNMENT`

---


## Project Structure

```
ovds/                               # Nx monorepo root
├── apps/
│   ├── backend/                    # NestJS API
│   │   └── src/                    # Feature modules
│   └── frontend/                   # React + Vite frontend
│       └── src/
│           ├── pages/              # 222 lazy-loaded page components
│           │   └── admin/          # Admin-only pages (NotificationSettings)
│           ├── components/         # Shared UI components
│           │   ├── Accounting/     # Chart of accounts, journal entries, banks
│           │   ├── Dashboard/      # 49 dashboard widgets
│           │   ├── Invoices/       # Invoice modals and drawers
│           │   ├── Payroll/        # Payroll panels (loans, arrears, bulk upload)
│           │   └── DisasterFund/   # ERCA levy components
│           ├── rbac/               # Auth, RBAC policy, Auth0 integration
│           │   ├── rbac.ts         # Core RBAC engine (22 roles, 150+ permissions)
│           │   ├── AuthContext.tsx  # JWT session + RBAC helpers
│           │   ├── Auth0LoginButton.tsx
│           │   ├── Auth0ProviderWrapper.tsx
│           │   ├── auth0Client.ts
│           │   └── Can.tsx         # Declarative RBAC gate
│           ├── context/            # BusinessContext, ThemeContext, EntitlementContext
│           ├── hooks/              # Custom React hooks
│           ├── services/           # API clients (20 service files)
│           ├── types/              # TypeScript type definitions
│           └── utils/              # fmt.ts, download.ts, confirm.ts, storage.ts
├── packages/
│   ├── shared/src/                 # Shared DTOs, types, RBAC, constants
│   ├── database/prisma/            # schema.prisma (130 models) + migrations + seed
│   ├── ui/src/                     # Shared React components
│   └── design-system/src/          # Design tokens and base UI primitives
├── docs/                           # All documentation (18 sections)
├── scripts/                        # bin-run.mjs, deploy.mjs, patch-prisma.mjs
├── ecosystem.config.js             # PM2 process manager config
├── docker-compose.yml              # Docker deployment
├── Dockerfile                      # 3-stage build (frontend → backend → runtime)
├── .env.example                    # Environment variable template
└── package.json                    # Nx monorepo root scripts
```

---

## Database

- **Development DB:** `ovds` (MySQL/MariaDB via XAMPP) — `mysql://root:@127.0.0.1:3306/ovds`
- **Production DB:** `usc` (MySQL 8.4 on `mysql-db02.remote:32636`) — see `PLESK-FULL-SETUP.md`
- **ORM:** Prisma 7 with `@prisma/adapter-mariadb`
- **Schema:** `packages/database/prisma/schema.prisma` (130 models)

### Key Models

| Domain | Models |
|--------|--------|
| Multi-tenancy | `Company`, `User`, `Employee` |
| HR | `Department`, `Shift`, `Attendance`, `Leave`, `Holiday`, `BiometricData` |
| Payroll | `PayrollRecord`, `Deduction`, `OtherPayment`, `OtherPaymentHead`, `LoanRequest`, `ReimbursementClaim`, `FinancialCycle`, `ArrearConfig` |
| ovds | `Account`, `JournalEntry`, `JournalLine`, `BankAccount`, `BankTransaction` |
| AR/AP | `Invoice`, `InvoiceItem`, `InvoicePayment`, `Bill`, `Vendor`, `Customer`, `Item` |
| Tax | `TaxRate`, `VatFiling`, `IncomeTaxFiling`, `DisasterFundContribution` |
| Collections | `CreditHold`, `CollectionCase`, `PaymentBatch`, `PaymentBatchItem` |
| Business | `Partnership`, `BusinessLoan`, `Investment`, `CashForecast` |
| Audit | `AuditLog`, `AuditFirm`, `AuditEngagement`, `AuditFinding` |
| System | `SystemSetting`, `Notification`, `NotificationTemplate`, `AdminCreatedMenuItem`, `App` |

---

## Local Development Setup

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Use `nvm` or `fnm` for version management |
| MySQL / MariaDB | 8.0+ / 10.6+ | Via XAMPP, Docker, or native install |
| npm | 9+ | Comes with Node.js |
| Git | Any | For cloning the repo |

### First-Time Setup (Windows / XAMPP)

```bash
# 1. Start MySQL via XAMPP
C:\xampp\mysql_start.bat

# 2. Create the database
mysql -u root -e "CREATE DATABASE ovds CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Install dependencies (Nx monorepo — single install from root)
npm install

# 4. Copy environment file
cp .env.example .env
# Edit .env — set PRISMA_DATABASE_URL if needed

# 5. Push Prisma schema to database
npm run db:push

# 6. Seed demo data
npm run seed

# 7. Start everything
npm run dev:all
```

**URLs after startup:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`
- Swagger docs: `http://localhost:3000/api/docs`
- Prisma Studio: `http://localhost:5555` (run `npm run db:studio`)

### Common Dev Commands

```bash
# Start backend + frontend together
npm run dev:all

# Backend only (NestJS watch mode)
npm run dev -w @ovds/backend

# Frontend only (Vite dev server → localhost:5173)
npm run dev -w ovds-frontend

# Prisma — after schema changes
npm run db:push          # apply to dev DB
npm run db:generate      # regenerate Prisma client
npm run db:studio        # open GUI → localhost:5555

# Reset everything (⚠️ destroys all data)
npm run db:push          # re-sync schema

# Run tests
npm run test:backend     # backend unit tests
npm run test:frontend    # frontend tests
npm run test:e2e         # end-to-end tests

# Build for production
npm run build            # NestJS backend
npm run build:frontend   # React frontend → apps/public/
npm run build:all        # libs + backend + frontend
npm run typecheck:all    # TypeScript check all packages
```

### Environment Variables Quick Setup

Minimum required in `.env`:
```env
PRISMA_DATABASE_URL="mysql://root:@127.0.0.1:3306/ovds"
JWT_SECRET="ovds_secret_key_2026"
AUTH0_NAMESPACE="http://localhost:3000"
AUTH0_ENFORCED=false
```

For email (optional — silently skipped if not set):
```env
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_pass
```

For OCR (optional):
```env
OPENAI_API_KEY=sk-...
# or
GEMINI_API_KEY=...
```

### Port Conflicts

| Port | Service | Fix |
|------|---------|-----|
| 3000 | NestJS API | Kill: `npx kill-port 3000` |
| 5173–5176 | Vite dev server | Kill stale node processes |
| 3306 | MySQL | Start XAMPP MySQL service |
| 5555 | Prisma Studio | Kill: `npx kill-port 5555` |

### VS Code Recommended Extensions

- **Prisma** — syntax highlighting for `.prisma` files
- **ESLint** — linting
- **Prettier** — formatting (`.prettierrc` in root)
- **REST Client** — test API endpoints from `.http` files
- **Thunder Client** — lightweight Postman alternative

---

## Build, Test & Development Commands

Run from repository root unless noted.

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start backend (NestJS watch) + frontend (Vite) concurrently |
| `npm run dev -w @ovds/backend` | Backend only (NestJS watch mode) |
| `npm run dev -w ovds-frontend` | Frontend only (Vite dev server → localhost:5173) |
| `npm run build` | Compile NestJS backend → `apps/backend/dist/` |
| `npm run build:frontend` | Build frontend → `apps/public/` |
| `npm run build:all` | Build libs + backend + frontend |
| `npm run typecheck:all` | TypeScript check all packages |
| `npm run seed` | Seed the database with demo data |
| `npm run seed:prod` | Seed production database |
| `npm run seed:demo` | Seed extended demo data |
| `npm run db:push` | Apply Prisma schema changes to dev database |
| `npm run db:push:prod` | Apply schema to production database |
| `npm run db:migrate:prod` | Run `prisma migrate deploy` on production |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:generate:plesk` | Regenerate Prisma client (bypasses Plesk TLS issue) |
| `npm run db:studio` | Open Prisma Studio GUI → localhost:5555 |
| `npm run test:backend` | Run backend unit tests |
| `npm run test:frontend` | Run frontend tests |
| `npm run test:e2e` | Run end-to-end Playwright tests |
| `npm run deploy` | Run deploy script (`scripts/deploy.mjs`) |

### Prerequisites
1. **MySQL must be running** before starting the backend. Use XAMPP: `C:\xampp\mysql_start.bat`
2. **Database must exist:** `CREATE DATABASE ovds CHARACTER SET utf8mb4;`
3. **Schema must be pushed:** `npm run db:push`
4. **Seed data:** `npm run seed`

---

## Environment Variables (`.env`)

```env
PRISMA_DATABASE_URL="mysql://root:@127.0.0.1:3306/ovds"
JWT_SECRET="ovds_secret_key_2026"
AUTH0_NAMESPACE="http://localhost:3000"
AUTH0_ENFORCED=false
```

### Optional Auth0 Variables (`.env` or `frontend/.env`)
```env
VITE_AUTH0_ENABLED=false
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
VITE_AUTH0_AUDIENCE=
VITE_AUTH0_CONNECTION=
```

---

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **SPURADMIN** | `superadmin@ovds.com` | `SuperAdmin@2026!` |
| ADMIN | `admin@ovds.com` | `changeme123` |
| HR | `hr@ovds.com` | `hr_pass_2026` |
| ovds | `ovds@ovds.com` | `fin_pass_2026` |
| ACCOUNTING | `selam@ovds.com` | `acct_pass_2026` |
| AUDITOR | `bereket@ovds.com` | `audit_pass_2026` |
| EMPLOYEE | `employee@ovds.com` | `emp_pass_2026` |
| CRM | `crm@ovds.com` | `crm_pass_2026` |
| IFRS_OFFICER | `ifrs@ovds.com` | `ifrs_pass_2026` |
| BANK_LIAISON | `banking@ovds.com` | `bank_pass_2026` |
| EXTERNAL_AUDITOR | `extaudit@ovds.com` | `extaudit_pass_2026` |

> Run `npm run seed` to create all users. SPURADMIN bypasses all RBAC route policies.

---

## Backend Modules (`src/`)

| Module | Path | Responsibility |
|--------|------|----------------|
| Auth | `src/auth/` | JWT + Auth0, login, guards, RBAC |
| Employees | `src/employees/` | Employee CRUD, KYC |
| Departments | `src/departments/` | Department management |
| Attendance | `src/attendance/` | Check-in/out, biometric, geofencing, cron absences, reports |
| Biometrics | `src/biometrics/` | Fingerprint/face template management |
| Leaves | `src/leaves/` | Leave request workflow, overlap validation, balance tracking |
| Holidays | `src/holidays/` | Holiday calendar |
| Shifts | `src/shifts/` | Shift scheduling |
| Payroll | `src/payroll/` | Ethiopian PIT, salary generation, approval workflow |
| ovds | `src/ovds/` | invoice, billing, accounting, VAT, treasury, collections |
| Disaster Fund | `src/disaster-fund/` | ERCA DRRF levy calculations and submissions |
| Dashboard | `src/dashboard/` | Analytics, strategic insights (30s cache) |
| Settings | `src/settings/` | System configuration via `SystemSetting` key-value store |
| Notifications | `src/notifications/` | Email/Slack/Intercom + WebSocket push + templates + campaigns |
| Onboarding | `src/onboarding/` | Company setup wizard |
| Audit Outsourcing | `src/audit-outsourcing/` | External audit management |
| Appstore | `src/appstore/` | Extension marketplace |
| Websocket | `src/websocket/` | Real-time updates via Socket.io (`/realtime` namespace) |
| Prisma | `src/prisma/` | Database service + audit log service + email service |
| Common | `src/common/` | Guards, interceptors, middleware, DTOs, health, cleanup |

> **Note:** The backend contains 68+ module directories under `apps/backend/src/`. The table above lists the primary modules; additional feature modules include tax, compliance, CRM, HR, IoT, and domain-specific services.

### Global Guard Order (`app.module.ts`)

Guards are applied globally in this exact order via `APP_GUARD` providers:

```
ThrottlerGuard → AnyAuthGuard → CompanyGuard → RBACGuard
```

Global throttle: **100 requests/minute per IP**. Individual endpoints can override with `@Throttle()`.

Static files served from `./public` (NestJS frontend build output), excluding `/api/*` routes.
Request logging via `RequestLoggerMiddleware` on all routes.

---

## Frontend Pages (`frontend/src/pages/`)

### HR & Attendance
`Employees`, `Departments`, `Attendance`, `Leaves`, `Shifts`, `Holidays`, `Enrollment`

### Payroll
`Payroll`, `PayrollAdministration`

### ovds & Accounting
`Accounting`, `AccountingDashboard`, `Invoices`, `Bills`, `Vendors`, `Items`, `Inventory`, `Expenses`, `PurchaseOrders`, `FixedAssets`, `FundTransfers`, `BankStatementImport`, `TransactionCategories`, `ovdsHub`, `PaymentTracker`, `AccountingCollections`, `PeriodClose`

### Tax & Compliance
`VatAdministration`, `TaxDashboard`, `TaxFiling`, `BusinessIncomeTax`, `DisasterFund`, `ComplianceAuditor`, `AuditOutsourcing`

### Business Development
`Partnerships`, `BusinessLoans`, `Investments`, `CRM`, `CustomerSummary`, `ClientPortal`, `TreasuryForecast`, `BusinessInsights`

### Administration
`Companies`, `MultiCompanyAdmin`, `Users`, `RolePermissions`, `Settings`, `AuditLogs`, `Notifications`, `EmailTemplates`, `OnboardingAdmin`, `AppStore`, `Reports`, `ApiDocs`
`admin/NotificationSettings` — SMTP, Slack, Intercom, templates, campaigns

### Auth & Misc
`Login`, `Register`, `Onboarding`, `EntryPortal`, `NotFound`, `Forbidden`, `Auth0Callback`

> **Note:** The frontend contains 222+ page components under `apps/frontend/src/pages/`. The lists above cover the primary pages; additional specialized pages exist for compliance, reporting, and admin functions.

---

## RBAC System (`frontend/src/rbac/`)

### Design Principles
- **Role-Centric Authorization:** Roles define privileges; users inherit permissions through assigned roles
- **CRUD Enforcement:** Each role explicitly governs Create, Read, Update, Delete per module
- **Deny-by-Default:** No access unless explicitly granted
- **Least Privilege:** Users see and can do only what their role permits
- **Segregation of Duties:** Compliance steps (compute, approve, submit) are split across roles
- **Immutable Audit Trail:** Every CRUD operation is logged and cannot be retroactively edited
- **Cross-Tenant Isolation:** Strict data segregation between companies via `CompanyGuard`
- **ABAC Extensions:** Permissions adapt to subsidiary, business type, and MFA status
- **MFA Step-Up:** Sensitive routes require re-authentication before access

### 22 Roles Across 6 Groups

| Group | Roles | Hierarchy Weight | Enforcement Scope |
|-------|-------|-----------------|-------------------|
| System | `SPURADMIN`, `DEVELOPER` | 200, 150 | Full system control — audit & security oversight |
| Operations | `ADMIN`, `PROJECT_MANAGER` | 100, 80 | Workflow & document management — operational compliance |
| HR | `HR`, `EMPLOYEE` | 50, 10 | Payroll, attendance, pension — PIT & pension law |
| ovds | `ovds`, `ACCOUNTING`, `AUDITOR` | 60, 55, 30 | VAT, Disaster Fund, Income Tax — MoR & ERCA filings |
| IFRS & Banking | `IFRS_OFFICER`, `BANK_LIAISON`, `EXTERNAL_AUDITOR` | 52, 25, 28 | AFIS standards enforcement, banking operations, statutory audit |
| External | `CRM`, `CLIENT`, `PARTNER` | 25, 5, 20 | Customer/vendor portals — contractual transparency |
| Operational | `DATA_CLERK` | 8 | Data entry — draft items/inventory/invoices only; no financial access |

### Role Access Summary

| Role | Access Level | Default Route | CRUD Scope |
|------|-------------|---------------|------------|
| `SPURADMIN` | Full system — bypasses all policies | `/dashboard` | Full (all modules) |
| `DEVELOPER` | Full API + system, read-only audit | `/dashboard` | Full (API + code) |
| `ADMIN` | Full operations, read ovds/HR | `/dashboard` | C/R/U (office, scheduling) |
| `PROJECT_MANAGER` | Projects + read HR/ovds | `/dashboard` | C/U/R (projects, HR, ovds) |
| `HR` | Full HRIS, payroll generate | `/dashboard` | Full (HRIS, payroll) |
| `EMPLOYEE` | Self-service: leaves, payslips, expenses | `/dashboard` | C/U/R (timesheets, HR self-service) |
| `ovds` | Full ovds, VAT, payroll approve | `/accounting-dashboard` | Full (ovds, VAT, payroll) |
| `ACCOUNTING` | Bookkeeping, bank reconciliation, VAT calculate | `/accounting-dashboard` | Full (ovds, payroll) |
| `AUDITOR` | Read-only all domains + annotate audit logs | `/audit-logs` | R/U (audit logs only) |
| `IFRS_OFFICER` | AFIS-aligned IFRS compliance: ECL (IFRS 9), consolidation (IFRS 10), disclosures (IFRS 12), leases (IFRS 16) | `/ifrs` | Full IFRS write; ovds approves |
| `BANK_LIAISON` | Banking operations: loan applications, KYC/AML, collateral, covenants, intercompany, credibility scoring | `/business-loans` | Write banking ops; ovds approves disbursements |
| `EXTERNAL_AUDITOR` | Statutory audit partner (Tier 1 IFRS). Read-only financial access; writes findings and management letter; certifies statements | `/audit-outsourcing` | R (all ovds) + W (findings, management letter) |
| `CRM` | Customer management, invoice read | `/crm` | C/U (CRM) |
| `CLIENT` | Client portal, invoice read | `/client-portal` | C/R (service requests, invoices) |
| `PARTNER` | Vendor portal, bills, purchase orders | `/purchases/orders` | C/U/R (vendor portal, ovds) |

### RBAC Engine (`rbac.ts`) — Key Exports

```typescript
import {
  rbac,                  // Engine object with all methods
  ROLE_PERMISSIONS,      // Record<AppRole, Permission[]>
  ROLE_METADATA,         // UI metadata (label, color, description, icon)
  ROLE_GROUPS,           // Functional group definitions
  ROLE_HIERARCHY,        // Numeric weights per role
  ROUTE_POLICY,          // Route → minimum permission map
  DEFAULT_ROUTE,         // Post-login redirect per role
  SENSITIVE_ROUTES,      // Set<string> requiring MFA step-up
  RESOURCE_DOMAINS,      // Resource → { read, write, admin } permissions
  RESOURCE_DOMAINS_FLAT, // Resource → Permission[] (for matrix UI)
  PERMISSION_GROUPS,     // UI grouping of permissions
  requiresMfa,           // (path: string) => boolean
  type AppRole,
  type Permission,
  type DomainSummary,
  type RoleMetadata,
} from '../rbac/rbac';
```

### Engine Methods

```typescript
rbac.can(role, permission)           // boolean — single permission check
rbac.canAny(role, ...permissions)    // boolean — OR logic
rbac.canAll(role, ...permissions)    // boolean — AND logic
rbac.is(role, ...targets)            // boolean — role match
rbac.isAtLeast(role, target)         // boolean — hierarchy check
rbac.isAbove(role, target)           // boolean — strict hierarchy
rbac.canAccessRoute(role, path)      // boolean — route guard
rbac.vatLevel(role)                  // 'none'|'read'|'write'|'admin'
rbac.accessLevel(role, resource)     // 'none'|'read'|'write'|'admin'
rbac.canCrud(role, resource, action) // boolean — CRUD verb check
rbac.domainAccessMap(role)           // Record<string, level>
rbac.permissionsFor(role)            // Permission[]
rbac.rolesWithPermission(permission) // AppRole[]
rbac.rolesWithRouteAccess(path)      // AppRole[]
rbac.permissionCoverage()            // CoverageStats[]
rbac.summary(role)                   // DomainSummary[] — granted/denied per domain
rbac.diff(baseRole, targetRole)      // Permission[] — what target has that base doesn't
rbac.intersection(roleA, roleB)      // Permission[] — shared permissions
rbac.defaultRoute(role)              // string — post-login redirect
rbac.groupOf(role)                   // string — group key
rbac.rolesInGroup(groupKey)          // AppRole[]
```

### RBAC Hooks & Components

```typescript
// All importable from '../rbac' barrel:

useAuth()              // Full auth context + RBAC helpers
useRbac()              // Convenience: can, is, isAtLeast, canCrud, accessLevel, guard()
usePermissionGuard()   // RBAC + ABAC combined guard (permission, role, atLeast, requireMfa, requireCompany...)
useRouteGuard(path?)   // Route-level guard with redirect logic
useAuditLog()          // Fire-and-forget audit event emitter (log, logDenied, logExport)
useSessionRefresh()    // Proactive Auth0 token refresh before expiry (mount in Layout)
useStepUp()            // MFA step-up re-authentication (requireStepUp, StepUpGate)

<Can permission="invoices:write">...</Can>          // Declarative RBAC gate
<Can anyOf={[...]} atLeast="ovds">...</Can>      // OR logic + hierarchy
<Can role="ADMIN" requireMfa>...</Can>              // Role + MFA gate
<RoleBadge role="ovds" size="md" showTooltip />  // Role chip with metadata colors
<PermissionTooltip permission="payroll:approve">    // "Why denied" tooltip on hover
  <button>Approve</button>
</PermissionTooltip>
<StepUpProvider>...</StepUpProvider>                // Wrap app for MFA step-up support
``` 

### AuthContext Value Shape (`useAuth()`)

```typescript
const {
  // State
  user,               // AuthUser | null
  token,              // string | null
  isAuthenticated,    // boolean
  expiresInMinutes,   // number | null
  sessionExpiring,    // boolean — true when < 5 min remain

  // Actions
  login,              // (token, user) => void
  logout,             // () => void — clears storage, redirects
  refreshUser,        // () => Promise<void> — re-syncs from /auth/me
  dismissExpiryWarning,

  // RBAC helpers
  can,                // (permission) => boolean
  canAny,             // (...permissions) => boolean
  canAll,             // (...permissions) => boolean
  is,                 // (...roles) => boolean
  canAccessRoute,     // (path) => boolean
  isAtLeast,          // (...roles) => boolean
  vatLevel,           // 'none'|'read'|'write'|'admin'
  accessLevel,        // (resource) => 'none'|'read'|'write'|'admin'
  domainAccessMap,    // () => Record<string, level>

  // Convenience booleans
  isAdmin,            // role === 'ADMIN' || 'SPURADMIN'
  isHR,               // role === 'HR'
  isovds,          // role === 'ovds' || 'ACCOUNTING'
  isEmployee,         // role === 'EMPLOYEE'
  isAuditor,          // role === 'AUDITOR'
  isStaff,            // not EMPLOYEE, CLIENT, or PARTNER

  // Auth0 / MFA
  isAuth0User,        // boolean
  stepUp,             // 'full'|'partial'|'none'
  mfaEnrolled,        // boolean
  hasMfa,             // stepUp === 'full'
} = useAuth();
```

### Session Management

- Token stored in `localStorage` under `ovds_token`; user under `ovds_user`
- Expiry checked every 30 seconds; `sessionExpiring` triggers `SessionExpiryBanner`
- Cross-tab sync via native `storage` event
- Same-tab token refresh fires `ovds:token-refreshed` custom event (caught by AuthContext)
- On mount, token is validated against `GET /api/auth/me`; stale tokens are cleared
- Auth0 silent refresh handled by `auth0TokenRefresh.ts` + `useSessionRefresh()` hook

### ABAC Options (`usePermissionGuard` / `<Can>`)

| Option | Type | Description |
|--------|------|-------------|
| `permission` | `Permission` | Single permission required |
| `anyOf` / `anyPermission` | `Permission[]` | OR logic |
| `allOf` / `allPermissions` | `Permission[]` | AND logic |
| `role` | `AppRole \| AppRole[]` | Exact role match |
| `atLeast` | `AppRole` | Hierarchy weight >= target |
| `requireCompany` | `boolean` | Must have active company context |
| `requireMfa` | `boolean` | Must have completed MFA step-up |
| `requireSubsidiary` | `string[]` | Must belong to subsidiary |
| `requireBusinessType` | `string[]` | Company must be specific type |
| `negate` | `boolean` | Invert the check |
| `skip` | `boolean` | Always allow |

### Sensitive Routes (require MFA step-up for Auth0 users)
`/users`, `/role-permissions`, `/settings`, `/audit-logs`, `/multi-company-admin`,
`/payroll-administration`, `/vat-administration`, `/tax-filing`, `/admin/notifications-settings`

### Route Policy — Full Map (`ROUTE_POLICY` in `rbac.ts`)

| Route | Min Permission |
|-------|---------------|
| `/employees` | `employees:read` |
| `/departments` | `departments:read` |
| `/attendance` | `attendance:read` |
| `/leaves` | `leaves:read` |
| `/shifts` | `shifts:read` |
| `/holidays` | `holidays:read` |
| `/enrollment`, `/enroll` | `enrollment:write` |
| `/payroll` | `payroll:read` |
| `/payroll-administration` | `payroll:admin` |
| `/accounting`, `/accounting-dashboard` | `ovds:read` |
| `/banking/accounts` | `bank_reconciliation:read` |
| `/sales/invoices` | `invoices:read` |
| `/purchases/bills` | `bills:read` |
| `/purchases/vendors` | `bills:read` |
| `/items` | `items:read` |
| `/inventory` | `inventory:read` |
| `/purchases/expenses` | `expenses:read` |
| `/purchases/orders` | `purchase_orders:read` |
| `/fixed-assets` | `fixed_assets:read` |
| `/fund-transfers` | `fund_transfers:read` |
| `/bank-statement-import` | `bank_reconciliation:read` |
| `/period-close` | `period_close:read` |
| `/ovds`, `/payment-tracker`, `/accounting-collections`, `/transaction-categories` | `ovds:read` |
| `/vat`, `/vat-administration`, `/tax`, `/tax-dashboard` | `vat:read` |
| `/tax-filing` | `vat:file` |
| `/business-income-tax` | `bit:read` |
| `/disaster-fund` | `disaster_fund:read` |
| `/compliance-auditor`, `/audit-logs` | `audit_logs:read` |
| `/audit-outsourcing` | `audit_outsourcing:read` |
| `/partnerships` | `partnerships:read` |
| `/business-loans` | `business_loans:read` |
| `/investments` | `investments:read` |
| `/crm`, `/customer-summary` | `crm:read` |
| `/client-portal` | `invoices:read` |
| `/treasury-forecast` | `ovds:read` |
| `/business-insights` | `insights:read` |
| `/companies` | `companies:read` |
| `/multi-company-admin` | `companies:write` |
| `/users` | `users:read` |
| `/role-permissions` | `role_permissions:read` |
| `/settings` | `settings:read` |
| `/notifications` | `notifications:read` |
| `/email-templates` | `notifications:config` |
| `/admin/notifications-settings` | `notifications:config` |
| `/onboarding-admin` | `onboarding:write` |
| `/app-store` | `apps:read` |
| `/reports` | `reports:read` |
| `/api-docs` | `api_docs:read` |
| `/dashboard` | `reports:read` |
| `/entry` | `attendance:read` |

### Permission Reference — All 150+ Permissions by Group

**HR:** `employees:read/write/delete`, `departments:read/write`, `attendance:read/verify`, `leaves:read/write/approve/delete/read_own/write_own`, `shifts:read/write/delete`, `holidays:read/write/delete`, `enrollment:write`

**Payroll:** `payroll:read/generate/verify/finalize/approve/export/delete/admin`

**ovds:** `ovds:read/write/approve/delete`, `invoices:read/write/delete`, `bills:read/write/delete`, `items:read/write/delete`, `items:categories:read/write/delete`, `items:variants:read/write`, `expenses:read/write/approve`, `purchase_orders:read/write/approve`, `fixed_assets:read/write`, `fund_transfers:read/write/approve`, `bank_reconciliation:read/write`, `period_close:read/write`, `inventory:read/write`

**Tax & Compliance:** `vat:read/write/file/calculate/delete/refund/withholding/invoice/export`, `bit:read/write/file`, `disaster_fund:read/write/delete`

**Reports:** `reports:read`, `insights:read`, `reports:custom:read/write`, `reports:financial:read/full`, `reports:bs:read`, `reports:pl:read`, `reports:gl:read`, `reports:cf:read`

**System:** `users:read/write/delete`, `audit_logs:read/write`, `settings:read/write`, `role_permissions:read/write`, `notifications:read/write/config`, `api_docs:read/write`, `apps:read/write`, `companies:read/write/delete`, `onboarding:read/write`, `system:config/deploy/monitor`, `api:full`, `sandbox:access`

**Business:** `partnerships:read/write`, `investments:read/write`, `business_loans:read/write/approve`, `audit_outsourcing:read/write`, `projects:read/write/delete`, `milestones:read/write`

**CRM:** `crm:read/write`, `crm:contacts:read/write`, `crm:companies:read/write`, `crm:deals:read/write`, `crm:activities:read/write`, `crm:reports:read`, `crm:marketing:read/write`, `crm:settings:read/write`

---

## Multi-Tenancy Architecture

Every request is scoped to a company via `CompanyGuard`. Key patterns:

- `@CurrentCompany()` decorator injects the active `companyId` into every controller
- All Prisma queries **must** include `where: { companyId }` — never query across tenants
- `BusinessContext` on the frontend holds the active company; switching companies re-fetches all data
- `SPURADMIN` can operate across all companies; all other roles are strictly tenant-scoped
- Subsidiary support: `requireSubsidiary` ABAC option restricts access to specific sub-entities within a company

### BusinessContext API (`useBusiness()`)

```typescript
const {
  companies,            // Company[] — all companies the user can access
  selectedCompanyId,    // string | null — active company
  setSelectedCompanyId, // (id: string | null) => void — persisted to localStorage
  loading,              // boolean
  isMultiCompany,       // boolean — companies.length > 1
  refreshCompanies,     // () => Promise<void>
  selectedBusinessType, // BusinessType | null — type of active company
  effectiveBusinessRole,// (base: BaseRole) => BusinessRole | null
} = useBusiness();
```

Companies are fetched from `GET /ovds/companies`. The active company is persisted in `localStorage` under `selectedCompanyId` and synced across browser tabs via the `storage` event.

### Business Types

| Type | Short | Badge Color | IFRS Tier |
|------|-------|-------------|-----------|
| `MANUFACTURING` | MFG | orange | Full IFRS (if meets Threshold 1) or IFRS for SMEs |
| `LARGE_ENTERPRISE` | LARGE | violet | Full IFRS (mandatory — Proclamation 847/2014) |
| `MEDIUM_ENTERPRISE` | MED | blue | Full IFRS or IFRS for SMEs (based on AABE threshold) |
| `SMALL_BUSINESS` | SMB | emerald | IFRS for SMEs (mandatory if meets Threshold 2) |
| `FREELANCER` | FRLNC | amber | Micro-entity — outside IFRS scope per Proclamation 847/2014 |
| `GOVERNMENT` | GOV | slate | Full IFRS (government-owned enterprises — mandatory) |

### AuthUser Shape

```typescript
interface AuthUser {
  id: string;
  username: string;
  role: AppRole;
  employeeId?: string;      // links user to Employee record
  companyId?: string;       // active tenant
  subsidiary?: string;      // sub-entity within company
  lastLoginAt?: string | null;
  isAuth0User?: boolean;    // true = SSO session
  stepUp?: 'full' | 'partial' | 'none'; // MFA completion level
  mfaEnrolled?: boolean;    // has at least one Auth0 MFA factor
}
```

Stored in `localStorage` under `ovds_user`. Token stored under `ovds_token`. Both cleared on logout. Session validated against `GET /api/auth/me` on mount.

### Adding a New Tenant-Scoped Feature

1. Add `companyId` to the Prisma model
2. Inject `@CurrentCompany() company: Company` in the controller
3. Pass `companyId` to every service method
4. Guard the route with `CompanyGuard` in the module
5. On the frontend, read `businessContext.activeCompany.id` and pass it to API calls

---

## ovds & Treasury

### Real-Time KPIs (ovdsHub / AccountingDashboard)

| KPI | Description |
|-----|-------------|
| Cash & Bank Position | Sum of all active bank account balances |
| Accounts Receivable | Outstanding invoice totals by aging bucket |
| Accounts Payable | Outstanding bill totals by due date |
| VAT Net Payable | Output VAT − Input VAT for current period |
| Net Financial Position | Assets − Liabilities snapshot |
| Financial Health Score | A–D rating based on liquidity + profitability metrics |
| Revenue vs. Expense Trend | Month-over-month comparison chart |

### Automated Accounting Operations

- **Double-entry enforcement:** Every invoice/bill auto-generates balanced journal entries — no manual override
- **Bank reconciliation:** Match imported bank transactions against journal entries; flag unmatched items
- **Period closing:** Lock a fiscal period to prevent backdated entries; `PeriodManager.tsx` controls this
- **Chart of Accounts:** Hierarchical account structure; `ChartOfAccounts.tsx` manages creation and mapping
- **Cash Forecast:** `CashForecast` model + `CashForecastChart.tsx` + `treasuryApi.ts` for 30/60/90-day projections

### Company Snapshot (`getCompanySnapshot`)

`GET /ovds/companies/:id/snapshot` returns a full dashboard payload:

| Field | Description |
|-------|-------------|
| `revenue` | This month's paid invoice total |
| `revenueTrend` | % change vs last month |
| `invoiceCount` | Invoices created this month |
| `pendingBillsAmount` | Sum of PENDING + OVERDUE bills |
| `employeeCount` | Active employees in company |
| `payrollNetPay` | Total net pay this month |
| `journalCount` | Total journal entries |
| `recentInvoices` | 3 most urgent unpaid invoices |
| `revenueSeries` | 6-month revenue trend array `[{ month, revenue }]` |

---

## Accounting Service (`AccountingService`)

### Chart of Accounts — Balance Logic

Account balance direction by type:
- `ASSET`, `EXPENSE` → `balance = totalDebit − totalCredit`
- `LIABILITY`, `EQUITY`, `INCOME` → `balance = totalCredit − totalDebit`

`getAccountBalances()` uses DB-level `groupBy` aggregation on `JournalLine` — never loads all lines into memory.

### Seeding Default Chart of Accounts

`POST /api/ovds/accounts/seed` (ovds role) seeds the default Ethiopian chart of accounts with standard account codes and types. Run this after creating a new company.

### Journal Entry Rules

- Debits must equal credits (tolerance: `< 0.01 ETB`) — `BadRequestException` if unbalanced
- Entry + lines created atomically in `$transaction`
- Recurring templates stored with `reference` prefix `RECURRING:` — excluded from main journal list
- `postRecurringTemplate(id, date)` creates a new entry from template with `reference` prefix `POSTED:`

### Bank Account Balance

`computedBalance = openingBalance + SUM(all transactions including PENDING)`

Bank account deletion blocked if it has any transactions. Transaction deletion reverses balance atomically in `$transaction`.

### Bank Statement Import & Reconciliation

**Import methods:**
- CSV upload — standard bank statement format
- AI OCR extraction — upload bank statement image/PDF (requires `OPENAI_API_KEY` or `GEMINI_API_KEY`)
  - Supports: CBE, Awash, Dashen, Abyssinia, and other Ethiopian banks
  - Extracted fields: date, description, amount, type (CREDIT/DEBIT), reference, confidence

**Reconciliation process:**
1. Import bank statement → transactions appear as `PENDING`
2. OVDS suggests matches based on amount and date
3. Confirm matches → status changes `PENDING → RECONCILED`
4. For unmatched transactions → create new journal entry or expense

**Bulk reconcile:** `POST /api/ovds/bank-accounts/:id/bulk-reconcile`

**Reconciliation summary:** `GET /api/ovds/bank-accounts/reconciliation-summary`
Returns: `{ total, reconciled, totalPending, accounts: [{ id, name, pendingCount }] }`

### Bank Transaction Status

`PENDING` → `RECONCILED` (via `reconcileTransaction` or `bulkReconcile`)

### Financial Reports

| Report | Endpoint method | Navigation | Description |
|--------|----------------|-----------|-------------|
| Balance Sheet | `getBalanceSheet(date?)` | Accounting → Reports → Balance Sheet | Assets / Liabilities / Equity as of date |
| P&L (Income Statement) | `getProfitAndLoss(start, end)` | Accounting → Reports → Profit & Loss | Income / Expenses / Net Profit for period |
| Trial Balance | `getTrialBalance(date?)` | Accounting → Reports → Trial Balance | All accounts with debit/credit totals; `isBalanced` flag |
| Cash Flow | `getCashFlow(start, end)` | Accounting → Reports → Cash Flow | Bank transactions split into inflows/outflows; operating net |
| Changes in Equity | `ChangesInEquity.tsx` | Accounting → Reports → Changes in Equity | Opening equity + net profit + other changes = closing equity |
| Notes to Financials | `NotesToFinancials.tsx` | Accounting → Reports → Notes | IFRS-compliant disclosure notes |
| General Ledger | — | Accounting → Reports → General Ledger | All journal entries with debit/credit lines per account |
| Expense Summary | `getExpenseSummary(start?, end?)` | Accounting → Reports → Expense Summary | Bills aggregated by category + status |
| Revenue Trend | `getRevenueTrend()` | Dashboard → Financial Health | 6-month `[{ month, revenue, expenses, profit }]` — 2 queries |
| AR Aging | `getArAging()` | Accounting → Reports → AR Aging | Outstanding invoices bucketed by days overdue |
| AP Aging | `getApAging()` | Accounting → Reports → AP Aging | Outstanding bills bucketed by days overdue |
| Financial Summary | `getFinancialSummary()` | ovdsHub | AR, AP, cash, netPosition, revenue, expenses, netProfit |

**All reports support:** date range filtering, company filter (SPURADMIN sees all), export to CSV or PDF, print view.

**Minimum comparative period (IFRS IAS 1):** Reports should include prior-year figures. Pass `startDate`/`endDate` for prior period comparison.

### Financial Health Score (`getHealthScore`)

Composite score from 4 components:

| Component | Scoring Logic |
|-----------|--------------|
| AR Collection | Penalizes invoices > 90 days overdue |
| AP Management | Penalizes bills > 90 days overdue |
| Cash Position | `min(100, cash/AP × 50)` |
| Profitability | `50 + (netProfit/revenue × 50)` |

Grade: A ≥ 80, B ≥ 65, C ≥ 50, D ≥ 35, F < 35

### Auto-Post Income Tax Filing

`autoPostIncomeTaxFiling(period, amount, userId)` creates a journal entry:
```
Debit:  Income Tax Payable  = amount
Credit: Cash (CASH category) = amount
Reference: INCOME_TAX-{period}
```

### Vendor Aggregation

`getVendors()` uses a single query with `include: { Bills: { select: { total } } }` to avoid N+1. Returns `billCount` and `totalBilled` per vendor.

### Reconciliation Summary

`getReconciliationSummary()` returns `{ total, reconciled, totalPending, accounts: [{ id, name, pendingCount }] }` using `groupBy` per account.

---

## VAT Administration

- Built around **Proclamation No. 1341/2024 · Regulation No. 570/2025**
- VAT registration threshold raised to **ETB 2,000,000/year** (Regulation No. 570/2025, effective mid-2025)
- Standard VAT rate remains **15%**
- Supports Output VAT, Input VAT, reverse-charge, zero-rated, and exempt categories
- **E-Invoice QR verification:** Each invoice gets a unique MoR tracking ID; QR code in NBE-IQR format
- **Refund tracking:** Input VAT excess triggers refund workflow with ERCA submission
- **Monthly filing deadline:** 30th of the following month; ETB 500/day late penalty
- **VAT Form 1:** Auto-populated from journal entries; exportable for eTax portal upload
- RBAC: `ovds` and `ACCOUNTING` can compute; only `ovds` can submit

### VAT Categories

| Category | Rate | Notes |
|----------|------|-------|
| Standard | 15% | Most goods and services |
| Zero-rated | 0% | Exports, certain food items, medical supplies |
| Exempt | — | Financial services, education, healthcare |
| Withholding VAT | 15% | Withheld from supplier invoices by registered agents |
| Reverse-charge | 15% | Services purchased from foreign suppliers |

### VAT Filing Workflow

```
DRAFT → COMPUTED → REVIEWED → SUBMITTED → ACKNOWLEDGED
```

| Step | Action | Permission | Role |
|------|--------|-----------|------|
| 1 — Compute | Click Compute for period (YYYY-MM) | `vat:calculate` | `ovds`, `ACCOUNTING` |
| 2 — Review | Verify output/input VAT, reverse-charge, withholding | `vat:write` | `ovds`, `ACCOUNTING` |
| 3 — Submit | Submit to ERCA; eTax reference generated | `vat:file` | `ovds` only |

**eTax reference format:** `ETAX-VATRETURN-YYYY-MM-XXXXX`

### VAT Filing States
`DRAFT` → `COMPUTED` → `REVIEWED` → `SUBMITTED` → `ACKNOWLEDGED`

### VAT Service — Raw SQL Tables (`VatService`)

`VatService` manages 7 raw SQL tables created via `$executeRawUnsafe` on module init (not in Prisma schema):

| Table | Purpose |
|-------|---------|
| `vatreverscharge` | Reverse-charge register — foreign supplier services |
| `vatrefundclaim` | Input VAT refund claims submitted to ERCA |
| `vatnote` | Internal VAT compliance notes |
| `vatwithholding` | Withholding VAT register (15% withheld from suppliers) |
| `vatinputledger` | Input VAT ledger (merged with Bills that have `vatAmount > 0`) |
| `vatoutputledger` | Output VAT ledger (merged with Invoices that have `vatAmount > 0`) |
| `vatexportevidence` | Zero-rated export evidence (customs decl, bill of lading, bank receipt) |
| `vatetaxsubmission` | eTax portal submission tracker |

### VAT Calculations

- **Reverse-charge VAT:** `vatDue = amountETB × 15%`
- **Withholding VAT:** `withheldVat = invoiceAmount × 15%`
- **Net VAT Payable:** `totalOutputVat − claimableInputVat`
- Input ledger merges manual entries + Bills with `vatAmount > 0`
- Output ledger merges manual entries + Invoices with `vatAmount > 0`

### VAT Dashboard Response (`getVatDashboard`)

| Field | Description |
|-------|-------------|
| `totalOutputVat` | Sum of output ledger + invoice VAT |
| `totalInputVat` | Sum of input ledger + bill VAT |
| `claimableInputVat` | Only claimable input entries |
| `netPayable` | `totalOutputVat − claimableInputVat` |
| `totalWithheld` | Total withholding VAT |
| `unremittedWithholding` | Withheld but not yet remitted |
| `totalReverseCharge` | Sum of reverse-charge VAT due |
| `pendingRefunds` | Sum of non-paid/non-rejected refund claims |

### eTax Submission Types

`VAT_RETURN`, `WHT_RETURN`, `BIT_DECLARATION`

Auto-generates ERCA reference: `ETAX-{TYPE}-{PERIOD}-{SEQ}` (e.g. `ETAX-VATRETURN-2026-01-A3F2K`)

### Export Evidence Status Cycle

Each evidence field (`customsDecl`, `billOfLading`, `bankReceipt`) cycles: `missing` → `partial` → `complete` → `missing`

### Refund Claim Reference Format

Auto-generated: `REF-{YEAR}-{SEQ:3}` (e.g. `REF-2026-001`)

---

## Invoice Business Logic (`ovdsService`)

### Invoice Lifecycle

| Status | Description |
|--------|-------------|
| `DRAFT` | Created, not yet sent |
| `PENDING` | Sent to customer, awaiting payment |
| `PAID` | Fully paid (auto-set when `totalPaid ≥ totalAmount`) |
| `OVERDUE` | Past due date, unpaid |
| `CANCELLED` | Voided |

### Invoice Number Format

- Standard invoices: `INV-YYYY-NNNN` (e.g. `INV-2026-0042`)
- Recurring invoices: `INV-R-` prefix
- Credit notes: `CN-` prefix
- Estimates: separate sequence, not posted to accounting

### Sending an Invoice

| Method | How | Requirement |
|--------|-----|-------------|
| Email from OVDS | Open invoice → Send → enter email | SMTP configured in Notification Settings |
| Share link (client portal) | Open invoice → Share → copy public URL | `POST /ovds/invoices/:id/share` generates `shareToken` |
| Download PDF | Open invoice → Download | None |
| Payment reminder | Open overdue invoice → Send Reminder | `POST /ovds/invoices/:id/send-reminder` |

### Auto-Journal Entry on Invoice Creation

When an invoice is created, `AccountingService.autoPostInvoiceCreation()` is called automatically (best-effort, never blocks invoice creation):

```
Debit:  Accounts Receivable  = totalAmount
Credit: Sales Revenue        = subtotal
Credit: VAT Payable          = vatAmount  (15% per Proclamation 1341/2024)
Credit: DRRF Payable         = drrfAmount (5% of subtotal, ANNUAL_SALES_REVENUE category)
```

### Auto-Journal Entry on Bill Creation

```
Debit:  Expense Account      = subtotal
Debit:  VAT Receivable       = vatAmount  (input VAT)
Credit: Accounts Payable     = totalAmount
```

Input VAT is recorded in the `vatinputledger` raw SQL table for monthly VAT filing.

### Stock Management

- Invoice creation: stock decremented atomically within `$transaction`
- Invoice deletion: stock restored **only if status ≠ PAID** (goods not yet delivered)
- Item deletion blocked if used in any invoice (`usageCount > 0`)

### Recurring Invoices

Intervals: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`
- `recurringNextDate` advances automatically after each generation
- Auto-generated invoices start as `DRAFT` with number prefix `INV-R-`
- `processScheduledInvoices()` sends DRAFT invoices with `scheduledSendAt ≤ now`

### Credit Notes

`createCreditNote(originalId)` creates a mirror invoice with negative amounts, prefixed `CN-`. Both original and credit note get `InvoiceActivity` entries.

### Estimates

Estimates use the same form as invoices but are **not posted to accounting**.

| Status | Description |
|--------|-------------|
| `DRAFT` | Created |
| `SENT` | Sent to customer |
| `ACCEPTED` | Customer accepted |
| `DECLINED` | Customer declined |
| `CONVERTED` | Converted to invoice |

Convert to invoice: open accepted estimate → Convert to Invoice → new DRAFT invoice created with all line items copied.

### Payment Recording

`recordInvoicePayment()` supports NBE/MoR compliance fields:
`paymentSource`, `orderNo`, `orderType`, `mcc`, `mccDescription`, `qrType`, `tinValidated`, `isDuplicate`, `telecomRef`, `bankName`, `bankAccountName`, `interactionType`, `archType`, `processType`

**Supported payment sources:** `CASH`, `BANK_TRANSFER`, `TELECOM`, `CHEQUE`, `MOBILE_BANKING`, `CREDIT_CARD`

Partial payments are supported — invoice stays `PENDING` until `totalPaid ≥ totalAmount`.

### Invoice Stats Response

`getInvoiceStats()` returns: `thisTotal`, `lastTotal`, `trend` (% MoM), `paidThis`, `overdueCount`, `draftCount`, `scheduledCount`, `avgDaysToPay`

### Inventory Costing Methods

`getInventory(companyId, method)` supports `FIFO`, `LIFO`, `WA` (Weighted Average). Returns `{ items, totalValue, method }`.

> ⚠️ **IFRS Note:** `LIFO` is prohibited under IAS 2 for IFRS-compliant entities. Use `FIFO` or `WA` for Tier 1/2 companies.

### Telecom Circuit Breaker

`ovdsService` has a built-in circuit breaker for telecom payment integrations: opens after 3 failures, stays open for 60 seconds (`TELECOM_CB_THRESHOLD = 3`, `TELECOM_CB_OPEN_MS = 60_000`).

### Customer Management

**Adding a customer:**
- Required: `name`
- Recommended for compliance: `tin` (15 chars — required for B2B VAT invoices), `email`, `phone`, `kycStatus`

**Customer 360 view** (`getCustomer360(customerId)`):
- Computes and persists `creditScore` + `loyaltyTier` to DB
- Returns: invoice summary, 6-month revenue trend, CRM interactions, partnerships, loans, investments

**Loyalty tiers (auto-assigned):**

| Tier | Credit Score |
|------|-------------|
| `PLATINUM` | ≥ 80 |
| `GOLD` | ≥ 60 |
| `SILVER` | ≥ 40 |
| `BRONZE` | < 40 |

**Credit hold:** `CreditHold.releasedAt = null` means hold is active. Invoice creation logic must check for active holds before proceeding.

### Vendor Management

- Required: `name`
- Recommended: `tin` (for withholding VAT), `email`, `phone`, `bankDetails`
- Each vendor shows `billCount` and `totalBilled` computed from linked bills
- Vendor deletion blocked if vendor has any linked bills

---

## ovds Sub-Modules

### Items & Inventory

Navigate to **ovds → Items**.

**Item fields:**
- `name`, `description`, `unitPrice`, `taxRateId` (links to `TaxRate`)
- `trackInventory` — enables stock management
- `stockQuantity` — current stock level (decremented on invoice, restored on delete if not PAID)
- `category`, `unit` (e.g. kg, pcs, litre)

**Inventory costing** (`GET /ovds/inventory?method=FIFO|WA`):
- `FIFO` — First-In-First-Out (IFRS IAS 2 compliant)
- `WA` — Weighted Average (IFRS IAS 2 compliant)
- `LIFO` — ⚠️ **Prohibited under IFRS IAS 2** — do not use for Tier 1/2 entities

**Item deletion** blocked if `usageCount > 0` (item used in any invoice).

**Stock adjustment** (manual): `POST /ovds/items/:id/adjust-stock` with `{ quantity, reason }` — creates audit trail.

---

### Fixed Assets & Depreciation

Navigate to **ovds → Fixed Assets**.

**Fixed Asset fields:**
- `name`, `assetCode`, `category` (e.g. MACHINERY, VEHICLE, FURNITURE, BUILDING, IT_EQUIPMENT)
- `purchaseDate`, `purchaseCost`, `residualValue`, `usefulLifeYears`
- `depreciationMethod`: `STRAIGHT_LINE`, `DECLINING_BALANCE`, `UNITS_OF_PRODUCTION`
- `accumulatedDepreciation` — running total of posted depreciation
- `bookValue` = `purchaseCost − accumulatedDepreciation`
- `status`: `ACTIVE`, `DISPOSED`, `FULLY_DEPRECIATED`

**Depreciation schedule** (`DepreciationScheduleModal.tsx`):
- Generates monthly depreciation journal entries
- Journal: Debit `Depreciation Expense` (EXPENSE) / Credit `Accumulated Depreciation` (contra-ASSET)
- Straight-line: `(purchaseCost − residualValue) / usefulLifeYears / 12` per month

**IFRS IAS 16 notes:**
- Cost model: carry at cost less accumulated depreciation (default)
- Revaluation model: carry at fair value — revaluation surplus → `EQUITY` (OCI); deficit → P&L
- Componentization: significant parts with different useful lives depreciated separately
- Disposal: remove cost + accumulated depreciation; recognize gain/loss in P&L

**IFRS 16 (Leases):** Office/equipment leases > 12 months → create as Fixed Asset (ROU) with corresponding `LONG_TERM_LIABILITY` account entry.

---

### Expenses & Reimbursements

Navigate to **ovds → Expenses**.

HR departments process two main types of reimbursement workflows. Clear, transparent agreements must be established upfront to manage fees, refunds, and applicant reimbursements efficiently.

**Expense types:**
- Direct expenses — posted as bills against a vendor
- Employee reimbursements — `ReimbursementClaim` model
- Recruitment agency invoice — vendor bill (`Bill` model) against a staffing agency
- Candidate / worker cost recovery — staff advance (`StaffAdvance` via `LoanRequest`) or AR receivable

---

#### Workflow A — Corporate Agency invoice

Applies when recruitment is outsourced to a staffing or placement agency. The agency invoice is processed as a vendor `Bill`, not a `ReimbursementClaim`.

**Data flow:**
```
Agency Agreement signed
  → Candidate placed → agency issues invoice
  → HR raises Bill (Purchases → Bills)
    vendorId = agency, category = "Recruitment & HR Expenses"
   → WHT auto-calculated (2% if vendor TIN + amount ≥ ETB 500)
  → Bill approved by ovds → payment scheduled
  → If candidate leaves within guarantee period:
      → Debit Note raised against original Bill
      → Net AP reduced; GL credit reversed to 6012
```

**Key API interactions:**
- `POST /api/bills` — create agency placement bill
- `POST /api/debit-notes` — raise refund/replacement debit note
- `GET /api/bills/:id` — retrieve bill with WHT breakdown
- `PATCH /api/bills/:id/pay` — record payment (net of WHT)

**RBAC:**
- Create agency bill: `bills:write` (ACCOUNTING / ovds)
- Approve and pay: `bills:write` + `ovds:approve` (ovds)
- Issue debit note: `bills:write` (ACCOUNTING / ovds)

---

#### Workflow B — Worker / Candidate Cost Recovery

Applies when the company advances costs on behalf of candidates (interview travel, relocation, medicals, certifications). Recovery is tracked as a staff advance or receivable — not expensed until confirmed irrecoverable.

**Data flow:**
```
Cost recovery clause in offer letter
  → ovds pays cost → recorded as Staff Advance (account 1030)
  → If candidate joins:
      → Advance linked to Employee record
      → Payroll deduction set up (OtherDeduction type = ADVANCE_RECOVERY)
      → Each payroll run decrements remainingBalance
      → When balance = 0: advance transferred to 6012 (expense)
  → If candidate does not join / resigns early:
      → Advance reclassified to Receivable (account 1020)
      → Demand letter issued; tracked in AR aging
      → If recovered: Dr Bank / Cr Receivable
      → If irrecoverable (approved write-off): Dr 6012 / Cr Receivable
```

**Key API interactions:**
- `POST /api/loan-requests` — create staff advance (category: `RECRUITMENT_ADVANCE`)
- `POST /api/payroll/deductions` — set up monthly recovery deduction
- `POST /api/expenses` — record interview reimbursement to external candidate
- `GET /api/loan-requests/:employeeId` — check advance balance
- `PATCH /api/loan-requests/:id` — update remaining balance or write off

**RBAC:**
- Create advance: `expenses:write` (HR / ovds)
- Approve advance: `expenses:approve` (ovds)
- Set up payroll deduction: `payroll:admin` (HR)
- Write off irrecoverable advance: `ovds:write` + `ovds:approve` (ovds)

---

**ReimbursementClaim fields:**
- `employeeId`, `purpose`, `locationTier` (travel tier affecting per diem rates)
- `amount` (base expense), `transportCost`, `perDiemAmount`
- `totalAmount = amount + transportCost + perDiemAmount`
- `status`: `PENDING → APPROVED → PAID` / `REJECTED`
- `receiptUrl` — attached receipt
- `workflowType` — `EMPLOYEE_EXPENSE` | `CANDIDATE_REIMBURSEMENT` | `AGENCY_INVOICE` (use to route to correct approval chain)

**Reimbursement RBAC:**
- `EMPLOYEE` — submit own claims (`expenses:write`)
- `HR` / `ovds` — approve claims (`expenses:approve`)
- `HR` — submit claims on behalf of external candidates (`expenses:write` with `workflowType = CANDIDATE_REIMBURSEMENT`)

---

### Purchase Orders

Navigate to **ovds → Purchase Orders**.

Purchase orders track procurement from vendors before bills are created.

**PO lifecycle:**
```
DRAFT → SUBMITTED → APPROVED → RECEIVED → BILLED → CLOSED
                 ↘ REJECTED
```

**Key fields:** `vendorId`, `orderDate`, `expectedDelivery`, `items[]`, `totalAmount`, `status`, `approvedBy`

**RBAC:**
- `purchase_orders:read` — `ovds`, `ACCOUNTING`, `ADMIN`, `PARTNER`
- `purchase_orders:write` — `ovds`, `ADMIN`
- `purchase_orders:approve` — `ovds` only

**Converting PO to Bill:** Once goods are received, create a bill referencing the PO. The PO status advances to `BILLED`.

---

### Fund Transfers

Navigate to **ovds → Fund Transfers**.

Transfers money between two bank accounts within the same company.

**What happens on transfer:**
1. Debit transaction created on source account
2. Credit transaction created on destination account
3. Both created atomically in `$transaction`
4. Journal entry auto-posted: Debit destination account / Credit source account

**RBAC:** `fund_transfers:write` (ovds), `fund_transfers:approve` (ovds)

---

### Transaction Categories

Navigate to **ovds → Transaction Categories**.

Categories classify bank transactions for reporting and reconciliation. Used when matching imported bank statement transactions to journal entries.

**Common categories:** Salary, Rent, Utilities, Tax Payment, Customer Receipt, Vendor Payment, Transfer

---

### Period Close

Navigate to **ovds → Period Close**.

Locks a fiscal period to prevent backdated journal entries.

**Period close rules:**
- Once closed, no journal entries can be posted with a date in the closed period
- `PeriodManager.tsx` manages open/closed periods
- Requires `period_close:write` permission (ovds role)
- Supports IAS 10 cut-off enforcement

**Workflow:**
1. Run trial balance — confirm `isBalanced = true`
2. Review all pending reconciliations
3. Post any accruals or adjustments
4. Close the period in Period Manager
5. Generate financial statements for the closed period

---

### Business Insights

Navigate to **Business → Business Insights**.

AI-powered strategic insights combining HR, ovds, and compliance data.

**Powered by:** `DashboardService.getStrategicInsights()` (30-second in-memory cache)

**Key metrics:**
- `projectedPayrollNextMonth` — based on `FinancialCycle.incrementPercentage` or historical ratio
- `absenteeismPredictionRate` — `(absentRecords / totalAttendance) × 100` over last 30 days
- `efficiencyScoreByDept` — `(actualAttendance / (headcount × workingDays)) × 100` per department
- `complianceHealth.missingBankDetails` — employees without `bankName` or `accountNumber`
- `complianceHealth.unconfiguredPayroll` — employees with `payrollStatus = NOT_CONFIGURED`
- `resourceUtilizationTrend` — `UP` if `basePayroll > totalUnpaidBills`, else `DOWN`

**RBAC:** `insights:read` (ADMIN, SPURADMIN)

---

### Client Portal

Navigate to `/client-portal/:token` (public — no login required).

Customers access their invoices via a share link generated by `POST /ovds/invoices/:id/share`.

**What customers can do:**
- View invoice details (line items, VAT, DRRF, totals)
- Download invoice PDF
- View payment history

**`shareToken`** is a unique UUID stored on the `Invoice` model. The link never expires unless the token is regenerated.

**RBAC:** Public endpoint — `@Public()` decorator, no auth required.

---

### Enrollment (Biometric Registration)

Navigate to **HR → Enrollment**.

The Enrollment module registers employee biometric templates for attendance check-in.

**Enrollment workflow:**
1. HR staff opens HR → Enrollment
2. Selects employee from list
3. Captures biometric template (fingerprint/face scan from device SDK)
4. Template stored via `POST /biometrics/register` → `BiometricData` record created
5. Employee can now check in via biometric kiosk or mobile

**BiometricType:** `FINGERPRINT`, `FACE`, `IRIS`, `CARD`

**Important:** The current implementation uses **exact string match** for verification (simulation). Production deployment requires integration with a real biometric SDK (e.g. ZKTeco, Suprema) that provides 1:N matching.

**Multiple templates:** Multiple templates per employee per type are allowed (e.g. both index fingers registered).

**RBAC:** `enrollment:write` (HR, ADMIN, SPURADMIN)

---

## Tax Rate Reference (Ethiopia 2026)

> **Proclamation No. 1395/2025** (effective July 7, 2025): PIT tax-free threshold raised from ETB 600 → **ETB 2,000/month**; top 35% bracket raised from ETB 10,900 → **ETB 14,000/month**; brackets reduced from 7 to 6; minimum starting rate raised from 10% → 15%. Pension contributions capped at **ETB 15,000 insurable earnings**. Withholding tax set at **2%** (threshold: ETB 500 for services, ETB 10,000 for goods). Minimum Alternative Tax (MAT) of **2.5% of turnover** introduced for businesses. Cash transactions above **ETB 30,000** must be via bank/cheque.
>
> **Regulation No. 570/2025** (effective mid-2025): VAT registration threshold raised to **ETB 2,000,000/year**. New Disaster Response Fund introduces 17+ levy categories (5% on telecom/digital services, 1% on loans/dividends, 5% on alcohol/tobacco, flat fees on tickets/fuel/government services).

| Tax | Rate | Basis | Frequency | Filing Portal |
|-----|------|--------|-----------|---------------|
| VAT | 15% | Output − Input VAT | Monthly | eTax / SIGTAS |
| VAT Registration Threshold | ETB 2M/yr | Annual turnover | — | ERCA (Reg. 570/2025) |
| Business Income Tax | 30% | Net profit (corporate) | Annual | MoR office |
| Personal Income Tax | 0–35% progressive | Gross salary | Monthly (via payroll) | eTax |
| Pension (Employee) | 7% | Basic salary (cap: ETB 15,000) | Monthly | Pension Authority |
| Pension (Employer) | 11% | Basic salary (cap: ETB 15,000) | Monthly | Pension Authority |
| DRRF | 1–5% + flat fees | Transaction value | Monthly / event-based | EDRRFO |
| Withholding Tax (Services) | 2% | Service payments ≥ ETB 500 | Per transaction | eTax |
| Withholding Tax (Goods) | 2% | Goods payments ≥ ETB 10,000 | Per transaction | eTax |
| Minimum Alternative Tax (MAT) | 2.5% | Annual turnover | Annual | MoR |

### PIT Brackets (ETB/month)

| Income Range | Rate |
|-------------|------|
| 0 – 2,000 | 0% |
| 2,001 – 4,000 | 15% |
| 4,001 – 7,000 | 20% |
| 7,001 – 10,000 | 25% |
| 10,001 – 14,000 | 30% |
| > 14,000 | 35% |

---

## Regulatory Reporting

| Report | Formula | Submission Target | RBAC Role |
|--------|---------|------------------|-----------|
| VAT Summary | Output VAT − Input VAT | ERCA (MoR) | `ovds` (Submit) |
| DRRF Summary | Transaction × levy % | EDRRFO | `ovds` (Submit) |
| Net Profit Report | Income − Expenses | MoR | `ovds` (Approve) |
| Payroll PIT Certificate | Per-employee PIT computation | ERCA | `HR` / `ovds` |
| Annual BIT Declaration | 30% × net profit | MoR (within 4 months of FY end) | `ovds` (Submit) |

---

## Frontend Services (`frontend/src/services/`)

| File | Purpose |
|------|---------|
| `api.ts` | Axios instance — JWT interceptor, 401 auto-refresh, background suppression |
| `accountingApi.ts` | Accounting-specific API calls |
| `vatApi.ts` | VAT/ERCA filing API |
| `taxApi.ts` | Tax dashboard and filing |
| `treasuryApi.ts` | Cash flow forecast API |
| `collectionsApi.ts` | Collections and disputes |
| `notifications.ts` | Notification templates and campaigns |
| `health.service.ts` | Backend health check provider |
| `auth0TokenRefresh.ts` | Auth0 silent token refresh |
| `nav.ts` | Navigation backend stub |

### `api.ts` — Axios Instance Details

Base URL: `VITE_API_URL` env var or `/api` (proxied by Vite to `http://localhost:3000`).
Timeout: 10 seconds.

**Request interceptor:** Reads token from `localStorage.ovds_token` → `localStorage.auth0_token` → `sessionStorage.auth0_token` (in priority order). Attaches as `Authorization: Bearer <token>`.

**Response interceptor behaviors:**

| Condition | Behavior |
|-----------|---------|
| `401` on first attempt | Tries `refreshAuth0Token()` silently; retries original request with new token |
| `401` after retry fails | Redirects to `/login` (unless already there) |
| `401` on `/auth/*` or `/health` routes | Suppressed — expected, no redirect |
| Any error with `x-background: 1` header | Suppressed — no toast shown |
| Other errors | `toast.error(message)` shown globally |

**Helper exports:**

```typescript
import api, { apiGet, apiPost, apiPut, apiPatch, apiDelete, extractData } from '../services/api';

// Auto-extracts response.data.data ?? response.data
const invoices = await apiGet<Invoice[]>('/invoices?companyId=...');
const created  = await apiPost<Invoice>('/invoices', payload);
const updated  = await apiPut<Invoice>(`/invoices/${id}`, payload);
const deleted  = await apiDelete<void>(`/invoices/${id}`);

// Suppress toast for background polls
api.get('/notifications?...', { headers: { 'x-background': '1' } });
```

---

## Frontend Hooks (`frontend/src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useRBAC` / `useRbac` | Combined auth + permission guard |
| `usePermissionGuard` | RBAC + ABAC guard with reason |
| `useRouteGuard` | Route-level access check |
| `useAuditLog` | Client-side audit event emitter |
| `useSessionRefresh` | Proactive Auth0 token refresh |
| `useAuth0Session` | Auth0 redirect callback + token exchange |
| `useAuth0Status` | Server-side Auth0 config status (cached) |
| `useApiQuery` | Generic data fetching with loading/error |
| `useDebounce` | Input debouncing |
| `useLocalStorage` | Persistent state in localStorage |
| `usePagination` | Page/take/total pagination state |
| `useFormDirty` | Unsaved changes detection + beforeunload |
| `usePageTitle` | Document title management |
| `useInterval` | Safe setInterval with cleanup |
| `useWebSocket` | Socket.io connection hook |
| `useClickOutside` | Outside-click detection |
| `useKeyboardShortcut` | Global keyboard shortcut binding |
| `useCountUp` | Animated number counter |
| `useAnimatedValue` | Spring-animated values |
| `useRelativeTime` | Human-readable relative timestamps |
| `useLastRefreshed` | "Last refreshed X ago" display |
| `usePrevious` | Previous value tracking |
| `useEscapeKey` | Escape key handler |
| `useFinancialAlerts` | Financial anomaly alert polling |

### `useApiQuery` — Data Fetching Hook

Lightweight alternative to React Query with built-in caching, deduplication, and retries.

```typescript
const { data, loading, error, refetch, mutate } = useApiQuery<Invoice[]>(
  `/invoices?companyId=${companyId}`,
  {
    enabled: !!companyId,          // skip fetch when param missing
    staleTime: 30_000,             // cache for 30s (default)
    retries: 2,                    // retry on 5xx/network errors
    select: (raw) => raw.data,     // transform response
    onSuccess: (data) => ...,
    onError: (msg) => ...,
    deps: [companyId],             // re-fetch when these change
  }
);

// Force re-fetch (bypasses cache)
refetch();

// Optimistic update without network call
mutate(prev => prev ? [...prev, newItem] : [newItem]);
```

Cache invalidation helpers:
```typescript
import { invalidateQuery, invalidateQueryPrefix } from '../hooks/useApiQuery';
invalidateQuery('/invoices?companyId=abc');       // exact URL
invalidateQueryPrefix('/invoices');               // all invoice queries
```

Cache: in-memory `Map<url, { data, ts }>`. Default stale time: 30s. Concurrent identical requests are deduplicated. Retries use exponential backoff (1s, 2s).

### `useWebSocket` — Real-Time Events

```typescript
const { connected, emit } = useWebSocket({
  namespace: '/realtime',          // default
  path: '/socket.io',             // default
  enabled: isAuthenticated,       // skip when not logged in
  events: {
    newCheckin: (data) => setLogs(prev => [data, ...prev]),
    payrollUpdate: (data) => refetch(),
    notification: (data) => setUnread(n => n + 1),
  },
});

// Manually emit
emit('subscribe', { companyId });
```

Transports: `['websocket', 'polling']`. Auto-connects on mount, disconnects on unmount. Re-connects when `enabled` changes `false → true`.

### `useAuditLog` — Audit Event Emitter

```typescript
const { log, logDenied, logExport } = useAuditLog();

// Standard action log
log('INVOICE_DELETED', { invoiceId: id, amount: 5000 }, 'Invoice', id);

// Access denied
logDenied('payroll:approve', '/payroll-administration');

// Data export
logExport('Invoice', 'csv', 150);
```

Posts to `POST /audit-logs/client` with `x-background: 1` header (no toast on failure). Payload includes `_role`, `_companyId`, `_route` automatically from `useAuth()`.

**All `AuditAction` values:**
`LOGIN`, `LOGOUT`, `LOGIN_FAILED`, `PASSWORD_RESET`, `ROLE_CHANGED`, `MFA_ENROLLED`, `SSO_LINKED`, `SSO_UNLINKED`, `ACCOUNT_LOCKED`, `ACCOUNT_UNLOCKED`, `ACCESS_DENIED`, `PERMISSION_ESCALATION_ATTEMPT`, `EMPLOYEE_CREATED/UPDATED/DELETED`, `LEAVE_APPROVED/REJECTED/SUBMITTED`, `ATTENDANCE_VERIFIED`, `ENROLLMENT_COMPLETED`, `PAYROLL_GENERATED/APPROVED/FINALIZED/EXPORTED`, `INVOICE_CREATED/SENT/DELETED`, `PAYMENT_RECORDED`, `BILL_CREATED/PAID`, `JOURNAL_ENTRY_POSTED`, `PERIOD_CLOSED`, `BANK_RECONCILED`, `FUND_TRANSFER_APPROVED`, `VAT_FILED/CALCULATED`, `BIT_FILED`, `DISASTER_FUND_SUBMITTED`, `SETTINGS_CHANGED`, `USER_CREATED/DELETED`, `COMPANY_CREATED`, `REPORT_EXPORTED`, `DATA_EXPORTED`

### `usePagination` — Pagination State

```typescript
const { page, take, setPage, setTake, paginationProps } = usePagination({
  defaultPage: 1,
  defaultTake: 20,
});

// Use with useApiQuery
const { data } = useApiQuery<PaginatedResult<Invoice>>(
  `/invoices?companyId=${companyId}&page=${page}&take=${take}`,
  { deps: [companyId, page, take] }
);

// Spread into Pagination component
<Pagination {...paginationProps} total={data?.pagination.total} />
```

### `useDebounce` — Input Debouncing

```typescript
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 400); // 400ms delay

// Use debouncedSearch in API calls — avoids request on every keystroke
const { data } = useApiQuery(
  `/employees?companyId=${companyId}&search=${debouncedSearch}`,
  { deps: [companyId, debouncedSearch] }
);
```

### `useLocalStorage` — Persistent State

```typescript
// Persists to localStorage, syncs across tabs
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('ovds_theme', 'light');
const [collapsed, setCollapsed] = useLocalStorage<boolean>('sidebar_collapsed', false);

// Clears on logout — AuthContext calls localStorage.removeItem('ovds_token')
```

### `useFormDirty` — Unsaved Changes Guard

```typescript
const { isDirty, setDirty, resetDirty } = useFormDirty();

// Mark form as dirty when user edits
<input onChange={(e) => { setDirty(true); setValue(e.target.value); }} />

// Reset after save
const handleSave = async () => {
  await apiPost('/invoices', data);
  resetDirty(); // clears dirty flag
};

// Fires window.beforeunload warning if dirty and user tries to navigate away
// Also integrates with React Router's useBlocker for in-app navigation
```

### `useInterval` — Safe setInterval

```typescript
// Polls notifications every 30 seconds — clears on unmount
useInterval(() => {
  refetchNotifications();
}, 30_000);

// Conditional polling — pass null to pause
useInterval(() => {
  refetchPresence();
}, isAuthenticated ? 10_000 : null);
```

### `useClickOutside` — Outside Click Detection

```typescript
const ref = useRef<HTMLDivElement>(null);
useClickOutside(ref, () => setDropdownOpen(false));

return (
  <div ref={ref}>
    <button onClick={() => setDropdownOpen(true)}>Open</button>
    {dropdownOpen && <Dropdown />}
  </div>
);
```

### `useKeyboardShortcut` — Global Shortcut Binding

```typescript
// Single key
useKeyboardShortcut('Escape', () => setModalOpen(false));

// With modifier
useKeyboardShortcut('k', () => setSearchOpen(true), { ctrl: true });

// Disabled when focus is in input/textarea/select (automatic)
```

### `useFinancialAlerts` — Anomaly Alert Polling

```typescript
const { alerts, unreadCount } = useFinancialAlerts();

// Polls GET /dashboard/alerts every 60 seconds
// Returns alerts for: overdue invoices, low cash, VAT deadline, payroll pending
// Displayed in SmartAlertsWidget
```

---

## Frontend Components (`frontend/src/components/`)

### RBAC & Auth
| Component | Purpose |
|-----------|---------|
| `Can.tsx` | Declarative RBAC + ABAC gate (permission, role, atLeast, requireMfa, negate, render prop) |
| `RoleBadge.tsx` | Role chip driven by ROLE_METADATA (badge/dot/minimal variants) |
| `PermissionTooltip.tsx` | "Why denied" tooltip wrapper for any element |
| `StepUpAuthModal.tsx` | MFA step-up re-authentication modal + StepUpProvider |
| `SessionExpiryBanner.tsx` | JWT expiry warning with Auth0 auto-refresh |
| `Auth0Badge.tsx` | SSO/MFA status indicator |

### Layout
| Component | Purpose |
|-----------|---------|
| `Layout.tsx` | Main app shell (sidebar + header + footer + scroll) |
| `Sidebar.tsx` | Navigation sidebar — 12-domain accordion, favorites, RBAC filtering |
| `Header.tsx` | Top bar — search, notifications, company switcher, user profile |
| `Footer.tsx` | App footer |
| `PageHeader.tsx` | Page-level header with search, filter chips, actions |

### UI Primitives
`Skeleton.tsx`, `StatsCard.tsx`, `Pagination.tsx`, `EmptyState.tsx`, `ColumnToggle.tsx`, `DefaultTabPin.tsx`

### Feature Components

| Component | Purpose | Trigger |
|-----------|---------|---------|
| `GlobalSearchModal.tsx` | Full-text search across employees, invoices, bills, vendors, customers, pages | `Ctrl/⌘+K` |
| `ActivityFeedDrawer.tsx` | Slide-in drawer showing recent system activity | `A` key / FAB |
| `KeyboardShortcutsModal.tsx` | Lists all global keyboard shortcuts | `?` key |
| `CompanySetupWizard.tsx` | Guided company onboarding wizard | `W` key / auto |
| `ContextualInsight.tsx` | AI-powered insight panel for current page context | Automatic |
| `CashForecastChart.tsx` | 30/60/90-day cash flow projection chart | Treasury page |
| `ChartWidgets.tsx` | Reusable chart components (bar, line, pie) | Dashboard |
| `CollectionsTable.tsx` | Collections case management table | Collections page |
| `DeductionResolver.tsx` | Invoice deduction/dispute resolution UI | ovds |
| `LivePnLWidget.tsx` | Real-time P&L comparison widget | Dashboard |
| `NotificationSettings.tsx` | SMTP/Slack/Intercom config UI | Admin settings |
| `PaymentBatchModal.tsx` | Bulk payment batch creation modal | ovds |
| `ReceiptViewer.tsx` | Telebirr/bank payment receipt viewer | Invoice payments |
| `ScheduledExportModal.tsx` | Recurring data export scheduler | Reports |
| `WhiteLabelSettings.tsx` | Company branding customization | Settings |

### GlobalSearchModal — Implementation Detail

`GlobalSearchModal.tsx` uses `FuseSearch.tsx` (Fuse.js) for client-side fuzzy search.

**Search scope:** employees, invoices, bills, vendors, customers, pages, settings

**Keyboard behavior:**
- `Ctrl/⌘+K` — open
- `↑/↓` — navigate results
- `Enter` — navigate to selected result
- `Escape` — close

**Data loading:** Fetches search index on first open; cached for the session. Results grouped by category with icons.

### ActivityFeedDrawer — Implementation Detail

`ActivityFeedDrawer.tsx` shows a chronological feed of recent system events.

**Data source:** `GET /audit-logs?companyId=&limit=50` — most recent audit log entries

**Event types shown:** Invoice created/paid, payroll approved, employee added, leave approved, VAT filed, bank reconciled

**Trigger methods:**
```typescript
// Keyboard shortcut
useKeyboardShortcut('a', () => setShowActivityFeed(true));

// Custom DOM event (from Header user menu)
window.dispatchEvent(new CustomEvent('ovds:toggle-activity'));

// FAB button (bottom-right, visible after 300px scroll)
```

### Notification Bell — Implementation Detail

The notification bell in `Header.tsx` polls every 30 seconds:

```typescript
useInterval(() => {
  if (!employeeId || !companyId) return;
  api.get(`/notifications?employeeId=${employeeId}&companyId=${companyId}&limit=50`, {
    headers: { 'x-background': '1' }  // suppress error toast
  }).then(r => {
    const list = r.data.data ?? r.data;
    setNotifications(list);
    setUnreadCount(list.filter((n: any) => !n.read && !n.isRead).length);
  });
}, 30_000);
```

**Badge behavior:** Bounces when `unreadCount` increases. Shows count up to 99, then "99+".

**Mark as read:** Clicking the bell opens the notification panel; clicking a notification calls `PUT /notifications/:id/read`.

### Report Export — Implementation Detail

All financial reports support CSV and PDF export:

```typescript
// CSV export — triggers browser download
const handleExportCsv = async () => {
  const response = await api.get(`/ovds/reports/balance-sheet?format=csv&date=${date}`, {
    responseType: 'blob'
  });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `balance-sheet-${date}.csv`;
  a.click();
  logExport('BalanceSheet', 'csv', 1);
};

// PDF export — opens in new tab or downloads
const handleExportPdf = async () => {
  window.open(`/api/ovds/reports/balance-sheet?format=pdf&date=${date}&token=${token}`);
  logExport('BalanceSheet', 'pdf', 1);
};
```

**Scheduled exports** (`ScheduledExportModal.tsx`): Configure recurring exports (daily/weekly/monthly) delivered via email.

### Company Switcher — Implementation Detail

The company switcher in `Header.tsx` and `Sidebar.tsx` uses `BusinessContext`:

```typescript
const { companies, selectedCompanyId, setSelectedCompanyId, isMultiCompany } = useBusiness();

// Switch company — persists to localStorage, syncs across tabs
const handleSwitch = (id: string) => {
  setSelectedCompanyId(id);
  // All useApiQuery hooks with deps: [selectedCompanyId] auto-refetch
  invalidateQueryPrefix('/');  // clear all cached data
};
```

**Visibility:** Hidden on mobile (`hidden md:block`). SPURADMIN sees all companies; other roles see only their assigned company.

**Cross-tab sync:** `storage` event listener in `BusinessContext` syncs `selectedCompanyId` across browser tabs.

### Layout-Managed Modals & Drawers

`Layout.tsx` owns the lifecycle of all global overlays. Trigger them via custom DOM events or the props passed down from Header:

| Overlay | Trigger | State key |
|---------|---------|-----------|
| `GlobalSearchModal` | `Ctrl/⌘+K` or Header search button | `showGlobalSearch` |
| `KeyboardShortcutsModal` | `?` key | `showShortcuts` |
| `DashboardManager` | `D` key or Header button | `showDashboardManager` |
| `CompanySetupWizard` | `W` key, `ovds:open-setup-wizard` event, or auto on ADMIN with no companies | `showSetupWizard` |
| `ActivityFeedDrawer` | `A` key, `ovds:toggle-activity` event, or FAB button | `showActivityFeed` |
| `SessionExpiryBanner` | Automatic when `sessionExpiring === true` | (always mounted) |

Auto-wizard: fires once per session for `ADMIN` users with zero companies. Dismissed state stored in `sessionStorage` under `wizard_auto_dismissed`.

### ErrorBoundary

Two variants exported from `App.tsx`:

```tsx
// Page-level (full-screen error with Retry + Reload)
<ErrorBoundary resetKey={someKey}>
  <Page />
</ErrorBoundary>

// Widget-level (compact inline error bar)
<ErrorBoundary inline resetKey={someKey}>
  <Widget />
</ErrorBoundary>
```

`resetKey` prop: when it changes, the boundary resets automatically — useful for re-fetching after a user action.

---

## Coding Style & Conventions

### Backend (NestJS)
- **Controllers/Services:** NestJS dependency injection; services own all business logic
- **DTOs:** Every endpoint uses DTOs with `class-validator` decorators
- **Response format:** `TransformInterceptor` wraps all responses as `{ statusCode, message, data, success, ms? }` — `ms` only in non-production
- **Error format:** `AllExceptionsFilter` returns `{ statusCode, timestamp, path, message, error, success: false }`
- **Multi-tenancy:** `CompanyGuard` + `@CurrentUser()` decorator enforce tenant isolation
- **Audit logging:** `AuditLogService.log(userId, action, details?)` records all write operations; also fires SIEM webhook if `SIEM_WEBHOOK_URL` is set
- **Guards order:** `AnyAuthGuard` → `RBACGuard` → `CompanyGuard` — always in this sequence
- **New module checklist:** Create module + controller + service + DTO files; register in `src/app.module.ts`; add `CompanyGuard` if tenant-scoped; inject `AuditLogService` for write ops
- **Prisma transactions:** Use `prisma.$transaction([...])` for multi-model writes (e.g., invoice + journal entry together)
- **Pagination pattern:** Use `PaginationQueryDto` (`page`, `take`, `search`, `sortBy`, `sortOrder`); return `PaginatedResult<T>` with `{ data, pagination: { page, take, total, pages } }`
- **Rate limiting:** `@Throttle({ default: { ttl: 60_000, limit: N } })` on auth endpoints (login: 10/min, signup: 5/min)
- **SPURADMIN bypass:** Both `RolesGuard` and `RBACGuard` check `user.role === 'SPURADMIN'` first and return `true` unconditionally
- **Public endpoints:** Decorate with `@Public()` to skip JWT auth entirely
- **Error throwing:** Use NestJS built-ins — `NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException`; never throw raw `Error`
- **Async/await:** All service methods are `async`; never mix `.then()` chains with `await` in the same function
- **Naming:** Controllers = `feature.controller.ts`; Services = `feature.service.ts`; DTOs = `create-feature.dto.ts`, `update-feature.dto.ts`; Modules = `feature.module.ts`

### Backend DTO Patterns

```typescript
// create-invoice.dto.ts
import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  customerName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}

// Pagination DTO (already exists — reuse it)
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
```

### Backend Error Handling Patterns

```typescript
// Standard not-found pattern
const invoice = await this.prisma.invoice.findUnique({ where: { id } });
if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

// Tenant isolation check
if (invoice.companyId !== req.companyId) throw new ForbiddenException();

// Unique constraint (P2002)
try {
  return await this.prisma.employee.create({ data });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    this.prisma.handlePrismaError(e); // → ConflictException on P2002
  }
  throw e;
}

// Business rule validation
if (invoice.status === 'PAID') {
  throw new BadRequestException('Cannot delete a paid invoice');
}
```

### Backend Decorators & Guards Reference

```typescript
// ── Decorators ────────────────────────────────────────────────────────────
@Public()                          // Skip JWT auth entirely (login, health, etc.)
@Roles(Role.ADMIN, Role.ovds)   // Restrict to specific roles (SPURADMIN bypasses)
@CurrentUser()                     // Inject full user object from JWT
@CurrentUser('id')                 // Inject single field from user
// CompanyGuard injects req.companyId from user.companyId in JWT

// ── Guards ────────────────────────────────────────────────────────────────
AnyAuthGuard    // Accepts both JWT (HS256) and Auth0 (RS256) tokens
Auth0AuthGuard  // Auth0 RS256 tokens only — used for /auth/auth0/session
RBACGuard       // Checks @Roles() decorator; SPURADMIN bypasses
CompanyGuard    // Injects req.companyId from user.companyId in JWT

// ── Standard controller pattern ───────────────────────────────────────────
@ApiTags('Feature')
@Controller('feature')
export class FeatureController {
  @Get()
  @UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)
  @Roles(Role.ovds, Role.ADMIN)
  @ApiBearerAuth()
  findAll(
    @CurrentUser('id') userId: string,
    @Req() req: Request,           // req.companyId injected by CompanyGuard
    @Query() query: PaginationQueryDto,
  ) { ... }
}
```

### Auth Endpoints Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/login` | Public | JWT login (rate: 10/min) |
| `POST` | `/auth/signup` | Public | Self-registration (rate: 5/min) |
| `GET` | `/auth/me` | JWT | Current user info |
| `POST` | `/auth/logout` | JWT | Logout + audit log |
| `POST` | `/auth/change-password` | JWT | Change own password |
| `GET` | `/auth/auth0/status` | Public | Auth0 config status |
| `GET` | `/auth/health` | Public | Auth subsystem health |
| `POST` | `/auth/auth0/session` | Auth0 | Exchange Auth0 token for local JWT |
| `POST` | `/auth/register` | ADMIN | Create new user |
| `GET` | `/auth/users` | ADMIN | List all users (paginated) |
| `DELETE` | `/auth/users/:id` | ADMIN | Delete user |
| `PATCH` | `/auth/users/:id/role` | ADMIN | Change user role |
| `PATCH` | `/auth/users/:id/company` | ADMIN | Assign company to user |
| `PATCH` | `/auth/users/:id/unlock` | ADMIN | Unlock locked account |
| `PATCH` | `/auth/users/:id/reset-password` | ADMIN | Admin password reset |
| `PATCH` | `/auth/users/:id/auth0/link` | JWT | Link Auth0 identity |
| `PATCH` | `/auth/users/:id/auth0/unlink` | JWT | Unlink Auth0 identity |
| `GET` | `/auth/role-permissions` | ADMIN | RBAC metadata |

### PrismaService Patterns

```typescript
// Standard tenant-scoped query
await this.prisma.invoice.findMany({
  where: { companyId: req.companyId },
  orderBy: { createdAt: 'desc' },
  take: query.take,
  skip: (query.page - 1) * query.take,
});

// Multi-model atomic write
await this.prisma.$transaction([
  this.prisma.invoice.create({ data: invoiceData }),
  this.prisma.journalEntry.create({ data: journalData }),
]);

// Prisma error handling — P2002 = unique constraint violation
try { ... }
catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    this.prisma.handlePrismaError(e); // throws ConflictException on P2002
  }
  throw e;
}
```

`PrismaService` uses `@prisma/adapter-mariadb` (Prisma 7 driver adapter). Connection config parsed from `PRISMA_DATABASE_URL`.

### Frontend (React)
- **Components:** Functional components with hooks only
- **State:** React Context (`AuthContext`, `BusinessContext`, `ThemeContext`) + `@tanstack/react-query`
- **Routing:** React Router v6 with lazy-loaded pages
- **Styling:** Tailwind CSS with custom `ovds-blue` brand color
- **RBAC:** Import from `'../rbac'` barrel — never import directly from `rbac.ts`
- **API:** All calls via `frontend/src/services/api.ts` (Axios instance with JWT interceptor)
- **Notifications:** Use `GET /notifications?employeeId=...&companyId=...` (query params, not path params)
- **Error boundaries:** `ErrorBoundary` at page and widget level
- **New page checklist:** Create page in `frontend/src/pages/`; add lazy import in `App.tsx`; add to `ROUTES` array; add route in `AppRoutes`; add nav entry in `Sidebar.tsx` with RBAC permission; add to `ROUTE_POLICY` in `rbac.ts` if access-controlled; add to `routeTitleMap` in `Layout.tsx`; add to `ROUTE_BREADCRUMBS` in `Header.tsx`
- **New widget checklist:** Create component in `components/Dashboard/`; add to `DashboardManager.tsx`; wrap with `<Can>` gate if role-restricted
- **Query keys:** Use consistent string keys per resource (e.g., `['invoices', companyId]`) for cache invalidation
- **Forms:** Use `useFormDirty` to warn on unsaved changes; validate with controlled inputs before submit
- **TypeScript:** All props, state, and API responses must be typed; avoid `any`; use `type` for unions/intersections, `interface` for object shapes
- **Imports:** Group as: 1) React/external libs, 2) internal services/hooks/context, 3) components, 4) types
- **Loading states:** Always show `<Skeleton />` or spinner while `loading === true`; never render stale data without indication

### Frontend TypeScript Patterns

```typescript
// ✅ Typed API response
interface Invoice {
  id: string;
  customerName: string;
  totalAmount: number;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  createdAt: string;
}

// ✅ useApiQuery with type + transform
const { data: invoices, loading } = useApiQuery<Invoice[]>(
  `/invoices?companyId=${companyId}`,
  {
    enabled: !!companyId,
    select: (raw) => raw.data ?? raw,   // handle both wrapped and unwrapped
    deps: [companyId],
  }
);

// ✅ Optimistic update
const handleMarkPaid = async (id: string) => {
  mutate(prev => prev?.map(inv => inv.id === id ? { ...inv, status: 'PAID' } : inv));
  await apiPut(`/invoices/${id}`, { status: 'PAID' });
  refetch();
};

// ✅ Cache invalidation after mutation
import { invalidateQueryPrefix } from '../hooks/useApiQuery';
invalidateQueryPrefix('/invoices');   // clears all invoice queries
```

### Frontend Component Patterns

```tsx
// ✅ Standard page structure
export default function FeaturePage() {
  const { selectedCompanyId } = useBusiness();
  const { can } = useRbac();
  const { data, loading, error, refetch } = useApiQuery<Item[]>(
    `/feature?companyId=${selectedCompanyId}`,
    { enabled: !!selectedCompanyId }
  );

  if (loading) return <Skeleton />;
  if (error) return <EmptyState message={error} />;
  if (!data?.length) return <EmptyState message="No items found" />;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Feature" actions={
        <Can permission="feature:write">
          <button onClick={() => setShowModal(true)}>Add New</button>
        </Can>
      } />
      {/* table / list */}
    </div>
  );
}

// ✅ Modal pattern
const [showModal, setShowModal] = useState(false);
const [editItem, setEditItem] = useState<Item | null>(null);

const handleSave = async (data: CreateItemDto) => {
  if (editItem) {
    await apiPut(`/feature/${editItem.id}`, data);
    log('FEATURE_UPDATED', { id: editItem.id });
  } else {
    await apiPost('/feature', data);
    log('FEATURE_CREATED', data);
  }
  setShowModal(false);
  refetch();
};
```

### Route Registration Pattern

All protected pages are registered in the `ROUTES` array in `App.tsx` and wrapped by `ProtectedRoute`:

```tsx
// ProtectedRoute checks isAuthenticated + rbac.canAccessRoute(role, path)
// Redirects to /login if not authenticated, /forbidden if no permission
const ROUTES: [string, React.ComponentType][] = [
  ['/my-page', MyPage],
  // ...
];

// Special routes (not in ROUTES array) need manual Route entries:
<Route path="/tax/dashboard" element={<ProtectedRoute path="/tax/dashboard"><TaxDashboard /></ProtectedRoute>} />
```

Public routes (no auth required): `/`, `/login`, `/register`, `/auth/callback`, `/forbidden`, `/client-portal/:token`

### RBAC Patterns
```typescript
// ✅ Correct — import from barrel
import { useAuth, Can, rbac, type AppRole } from '../rbac';

// ✅ Permission check in component
const { can, is, accessLevel } = useRbac();
if (can('invoices:write')) { ... }

// ✅ Declarative gate
<Can permission="payroll:approve" fallback={<ReadOnly />}>
  <ApproveButton />
</Can>

// ✅ Hierarchy check
<Can atLeast="ovds">
  <ovdsWidget />
</Can>

// ✅ CRUD check
const { canCrud } = useRbac();
if (canCrud('employees', 'delete')) { ... }

// ✅ Audit logging
const { log, logExport } = useAuditLog();
log('INVOICE_DELETED', { invoiceId: id });
logExport('Invoice', 'csv', count);
```

### Notification API Patterns

```typescript
// ✅ Fetch notifications — always use query params, never path params
GET /notifications?employeeId=<id>&companyId=<id>&limit=50

// ✅ Mark single notification read
PUT /notifications/<id>/read

// ✅ Mark all read
PUT /notifications/mark-all-read/<employeeId>
```

Both the Header bell and Sidebar badge poll this endpoint every 30 seconds via `useInterval`. The unread count is `list.filter(n => !n.read && !n.isRead).length` — check both fields for compatibility.

### Keyboard Shortcuts (Global)

| Shortcut | Action |
|----------|--------|
| `G S` | Go to Settings |
| `G N` | Go to Notifications |
| `/` | Focus sidebar nav search |
| `?` | Open keyboard shortcuts modal |
| `A` | Toggle Activity Feed drawer |
| `Escape` | Close context menus / clear nav search |

Shortcuts are bound in `Header.tsx` and `Sidebar.tsx` via `useKeyboardShortcut` and native `keydown` listeners. Add new global shortcuts in `KeyboardShortcutsModal.tsx`.

### Header Breadcrumbs

Every route has a breadcrumb entry in `ROUTE_BREADCRUMBS` inside `Header.tsx`. When adding a new page, add its entry:

```typescript
'/my-new-page': { domain: 'ovds', label: 'My New Page' },
// domain supports ' › ' separator for nested breadcrumbs:
'/my-nested-page': { domain: 'ovds › Sub-section', label: 'Page Title' },
```

### Role Visual Identity

When adding a new role (rare), update these three maps in addition to `rbac.ts`:

| File | Map to update |
|------|--------------|
| `Header.tsx` | `ROLE_GRADIENT` (avatar gradient) and `ROLE_BADGE` (badge colors) |
| `Sidebar.tsx` | `ROLE_BADGE` (sidebar user badge) |
| `rbac.ts` | `ROLE_METADATA` (full metadata including `color.badge`, `color.header`, `color.dot`, `icon`) |

---

## Compliance (Ethiopian Regulations)

- **VAT/ERCA:** 15% standard VAT, zero-rated categories, monthly filing (by 30th of following month)
- **PIT (Personal Income Tax):** Progressive slabs per **Proclamation No. 1395/2025** (effective July 7, 2025) — 0% (≤2,000), 15%, 20%, 25%, 30%, 35% (>14,000 ETB); 6 brackets (down from 7); tax-free threshold raised from ETB 600 → ETB 2,000
- **Pension:** Employee 7% + Employer 11% of basic salary; **capped at ETB 15,000 insurable earnings** per Proclamation No. 1395/2025
- **Withholding Tax:** 2% on service payments ≥ ETB 500 and goods payments ≥ ETB 10,000
- **Minimum Alternative Tax (MAT):** 2.5% of annual turnover — businesses must pay whichever is higher: regular income tax or MAT
- **Cash Transaction Limit:** Payments above ETB 30,000 must be via bank transfer or cheque; cash payments above this limit are not tax-deductible
- **DRRF (Disaster Risk Reduction Fund):** 17+ levy categories (1%–5% + flat fees), per Regulation No. 570/2025 (replaces 576/2025)
- **QR/E-Invoice:** Digital invoice generation with ERCA-compliant QR codes (NBE-IQR format); each invoice carries a unique MoR tracking ID
- **KYC/AML:** Customer and loan applicant verification
- **BIT (Business Income Tax):** 30% flat rate, file within 4 months of FY end
- **Late VAT Filing Penalty:** ETB 500/day
- **Data Residency:** All financial data stored within Ethiopian jurisdiction
- **Retention Policy:** Minimum 7 years per MoR audit requirement
- **Encryption:** AES-256 for all transactional and tax data

### KYC / AML Compliance

OVDS supports Know Your Customer (KYC) and Anti-Money Laundering (AML) verification for customers and loan applicants.

**Customer KYC fields:**
- `kycStatus`: `PENDING` → `VERIFIED` → `REJECTED`
- `tin`: Tax Identification Number (15 chars) — required for B2B VAT invoices
- `nationalId`: National ID number
- `businessLicense`: Business license number
- `kycDocuments`: Array of uploaded document references

**KYC workflow:**
1. Customer created with `kycStatus: PENDING`
2. HR/ovds uploads KYC documents (national ID, business license, TIN certificate)
3. Reviewer verifies documents → updates `kycStatus: VERIFIED`
4. Verified customers unlock: credit limits, high-value invoices, loan applications

**AML checks:**
- `CreditHold` model flags customers with overdue invoices or suspicious activity
- `BusinessLoan` applicants require `kycStatus: VERIFIED` before approval
- `Partnership` credibility score factors in TIN and license verification

**RBAC:** KYC verification requires `employees:write` (HR) or `ovds:write` (ovds)

---

### DRRF End-to-End Workflow

Navigate to **Tax & Compliance → Disaster Fund**.

```
Step 1: Auto-Generate Contributions
  → Click Auto-Generate → select period (YYYY-MM) and sources
  → Preview (dryRun=true) → review amounts
  → Confirm (dryRun=false) → DisasterFundContribution records created

Step 2: Review Contributions
  → Filter by period and category
  → Check status: PENDING (new), OVERDUE (past due date)
  → Verify amounts against source data

Step 3: Record Remittance
  → Open a contribution → Record Remittance
  → Enter: amount, bankName, referenceNo, notes, remittedBy
  → Status changes: PENDING → REMITTED
  → Journal entry auto-posted: Debit DRRF Payable / Credit Cash

Step 4: Generate Schedule (quarterly)
  → Payroll Administration → DRRF Schedule
  → generateSchedule(year) creates entries for all 13 categories × 4 quarters
  → Due dates: 15th of last month of each quarter (Mar 15, Jun 15, Sep 15, Dec 15)

Step 5: Compliance Score
  → Tax Dashboard → DRRF Compliance Score
  → Grade A (≥90%), B (≥75%), C (≥60%), D (≥40%), F (<40%)
```

**Auto-generation sources:**

| Source | What's scanned | Levy |
|--------|---------------|------|
| `SALARY_CONTRIBUTION` | `PayrollRecord` (APPROVED/PAID) for period | 1% of total netPay |
| `ANNUAL_SALES_REVENUE` | `Invoice` (PAID) for period | 5% of subtotal |
| `SERVICE_FEE` | `Invoice` (PAID, paymentSource=TELECOM/BANK) | 5% of subtotal |
| `TICKET_SALES` | `Invoice` (PAID, notes contains 'ticket') | ETB 100 × count |
| `LOAN_VALUE` | `BusinessLoan` (disbursed) for period | 1% of disbursedAmount |

**Remittance bank:** Commercial Bank of Ethiopia (CBE) — designated EDRRFO collection bank.

---

### DRRF Levy Breakdown (Regulation No. 570/2025 — 17+ categories)

| Category | Rate | Basis |
|----------|------|-------|
| `SALARY_CONTRIBUTION` | 1% | Net salary per payroll period |
| `LOAN_VALUE` | 1% | Loan value disbursed |
| `INSURANCE_PREMIUM` | 1% | Insurance premium |
| `DIVIDEND` | 1% | Dividend distributions |
| `CONTRABAND_PROCEEDS` | 1% | Confiscated goods value |
| `SERVICE_FEE` | 5% | Service fees (mobile/bank payments) |
| `AIRTIME_SALES` | 5% | Airtime sales (telecom) |
| `ANNUAL_SALES_REVENUE` | 5% | Annual sales revenue (paid invoice subtotals) |
| `TOBACCO_ALCOHOL` | 5% | Tobacco & alcohol sales |
| `TELECOM_DIGITAL` | 5% | Telecom/digital services (new — Reg. 570/2025) |
| `GOVERNMENT_BUDGET` | 0.25% | Annual government budget |
| `TICKET_SALES` | ETB 100 flat | Per domestic flight ticket |
| `FUEL_SALES` | ETB 200 flat | Per fuel issuance |
| `GOVERNMENT_SERVICE` | ETB 200 flat | Per government service |
| `OTHER` | 1% | Default fallback |

### DRRF Contribution Lifecycle

```
PENDING → REMITTED
PENDING → OVERDUE  (auto-flagged when dueDate < now via flagOverdue())
```

Quarterly schedule: due on the 15th of the last month of each quarter. `generateSchedule(year)` creates schedule entries for all 13 categories × 4 quarters.

### DRRF Auto-Generation from Activity

`autoGenerateFromActivity(period, sources, userId, dryRun)` scans real system data:

| Source | Data scanned | Levy |
|--------|-------------|------|
| `SALARY_CONTRIBUTION` | `PayrollRecord` (APPROVED/PAID) for period | 1% of total netPay |
| `ANNUAL_SALES_REVENUE` | `Invoice` (PAID) for period | 5% of subtotal |
| `SERVICE_FEE` | `Invoice` (PAID, paymentSource=TELECOM/BANK) | 5% of subtotal |
| `TICKET_SALES` | `Invoice` (PAID, notes contains 'ticket') | ETB 100 × count |
| `LOAN_VALUE` | `BusinessLoan` (disbursed) for period | 1% of disbursedAmount |

`dryRun=true` returns preview without persisting. `dryRun=false` creates `DisasterFundContribution` records.

### DRRF Compliance Score

`complianceScore(year)` returns `{ score, grade, breakdown }`:
- Grade A: ≥ 90% remittance rate
- Grade B: ≥ 75%
- Grade C: ≥ 60%
- Grade D: ≥ 40%
- Grade F: < 40%

### DRRF Forecast

3-month trailing average of levy amounts used to forecast next period. `forecastNextPeriod()` returns `{ forecastPeriod, forecastLevy, basedOnMonths }`.

### DRRF Remittance

`recordRemittance(id, { amount, bankName, referenceNo, notes, remittedBy })` creates a `DisasterFundRemittance` record and auto-marks the contribution as `REMITTED`.

### Accounting Compliance Chain (Ascending Logic)

Every transaction follows this RBAC-enforced chain — from source document to tax submission:

| Step | Component | Legal Principle | Responsible Role |
|------|------------|-----------------|------------------|
| 1 | Item / Product | Identification & Valuation | Inventory Clerk / Product Manager |
| 2 | Invoice / Bill | Source Document (proof of sale/purchase) | Sales Admin (Create) / Auditor (Read) |
| 3 | Journal Entry | Double-Entry Accounting (auto-posted) | System (Automated) / Accountant (Review) |
| 4 | Income / Expense | Matching Principle | ovds Manager (Approve) |
| 5 | VAT & DRRF | Fiduciary Duty — tax collection for state | Tax Officer (Compute/Submit) |
| 6 | Income Tax | Annual tax obligation | CFO / ovds role (Approve/Submit) |

### Compliance Submission Workflow

1. **Record** — Invoice/Bill creation → Journal Entry auto-posted with VAT & DRRF splits
2. **Reconcile** — VAT & DRRF computation via Tax worksheets
3. **Declare** — Monthly VAT & withholding taxes filed via eTax portal (MoR/SIGTAS)
4. **Audit** — Immutable logs + Compliance Auditor module review
5. **Report** — Annual Income Tax filing with audited financials (within 4 months of FY end)
6. **Remit** — DRRF payment to EDRRFO / designated banks (Commercial Bank of Ethiopia)

Each step is digitally signed, timestamped, and RBAC-verified, forming a gap-free audit trail.

---

## IFRS Standards — Ethiopian Context

Ethiopia adopted IFRS via **Proclamation 847/2014** and **Council of Ministers Regulation 332/2014**, enforced by the **Accounting and Auditing Board of Ethiopia (AABE)**. OVDS financial reports, journal entries, and disclosures must align with the applicable tier for each company's business type.

### IFRS Adoption Tiers (AABE Classification)

| Tier | Standard | Mandatory Since | Who Qualifies |
|------|----------|----------------|---------------|
| **Tier 1 — Full IFRS** | IFRS Accounting Standards (IASB) | 7 July 2023 | Entities meeting **2 of 4** criteria: turnover > ETB 300M, employees > 200, assets > ETB 200M, liabilities > ETB 200M |
| **Tier 2 — IFRS for SMEs** | IFRS for SMEs Accounting Standard | 7 July 2024 | Entities meeting **2 of 4** criteria: turnover > ETB 20M, employees > 20, assets > ETB 20M, liabilities > ETB 20M |
| **Tier 3 — Micro-entity** | Outside IFRS scope | — | Entities below Tier 2 thresholds (e.g. sole traders, freelancers) |

> Banks, insurance companies, government-owned enterprises, and other publicly accountable entities are **always Tier 1** regardless of size thresholds.

### IFRS Tier by Business Type

| `BusinessType` | Default Tier | Rationale |
|----------------|-------------|-----------|
| `LARGE_ENTERPRISE` | Tier 1 — Full IFRS | Publicly accountable; always exceeds Threshold 1 |
| `MANUFACTURING` | Tier 1 or Tier 2 | Depends on turnover/asset size; large manufacturers → Tier 1 |
| `MEDIUM_ENTERPRISE` | Tier 1 or Tier 2 | Straddles both thresholds; AABE criteria determine tier |
| `SMALL_BUSINESS` | Tier 2 — IFRS for SMEs | Typically meets Threshold 2 but not Threshold 1 |
| `GOVERNMENT` | Tier 1 — Full IFRS | Government-owned enterprises — mandatory Full IFRS |
| `FREELANCER` | Tier 3 — Micro-entity | Below Threshold 2; outside IFRS scope |

### Key IFRS Standards and Their OVDS Impact

#### IFRS 15 — Revenue from Contracts with Customers
Applies to: `LARGE_ENTERPRISE`, `MANUFACTURING`, `MEDIUM_ENTERPRISE`, `SMALL_BUSINESS` (Tier 2 equivalent in IFRS for SMEs Section 23)

**5-Step Revenue Recognition Model:**
1. Identify the contract with the customer
2. Identify separate performance obligations
3. Determine the transaction price
4. Allocate the transaction price to performance obligations
5. Recognize revenue when (or as) each performance obligation is satisfied

**OVDS Implementation Notes:**
- Invoice `status: PENDING` → revenue not yet recognized; `status: PAID` → revenue recognized
- Recurring invoices (`INV-R-` prefix) must recognize revenue per period, not upfront
- Multi-line invoices with distinct goods/services = separate performance obligations → each `InvoiceItem` may be a separate obligation
- Credit notes (`CN-` prefix) reverse previously recognized revenue in the period issued
- `vatAmount` is excluded from revenue (collected on behalf of ERCA — liability, not income)
- `drrfAmount` (5% ANNUAL_SALES_REVENUE levy) is also excluded from net revenue

#### IFRS 16 — Leases
Applies to: `LARGE_ENTERPRISE`, `MANUFACTURING`, `MEDIUM_ENTERPRISE` (Tier 1); IFRS for SMEs Section 20 for Tier 2

**Core Principle:** Lessees recognize a **right-of-use (ROU) asset** and a **lease liability** for all leases > 12 months (unless low-value asset exemption applies).

**OVDS Implementation Notes:**
- Office/equipment leases must be capitalized as `FixedAsset` (ROU asset) with a corresponding liability in `Account` (LONG_TERM_LIABILITY category)
- Lease payments split into: interest expense (debit `EXPENSE` account) + principal repayment (debit liability)
- Short-term leases (≤ 12 months) and low-value assets may use straight-line expense recognition
- `JournalEntry` auto-posting for lease commencement: Debit ROU Asset / Credit Lease Liability
- Depreciation of ROU asset posted monthly via `DepreciationScheduleModal` workflow

#### IFRS 9 — Financial Instruments
Applies to: All Tier 1 entities; IFRS for SMEs Sections 11–12 for Tier 2

**Three Classification Categories:**
- **Amortized Cost** — held-to-collect business model (e.g. trade receivables, bank loans)
- **Fair Value through OCI (FVOCI)** — held-to-collect-and-sell
- **Fair Value through P&L (FVTPL)** — trading assets

**Expected Credit Loss (ECL) Model:**
- Replaces the old incurred-loss model
- Trade receivables (Accounts Receivable) must use the **simplified approach**: lifetime ECL from day 1
- AR aging buckets in OVDS map directly to ECL provision rates:

| AR Aging Bucket | Suggested ECL Provision Rate |
|----------------|------------------------------|
| Current (0–30 days) | 1–2% |
| 31–60 days | 5–10% |
| 61–90 days | 15–25% |
| 91–180 days | 30–50% |
| > 180 days | 75–100% |

**OVDS Implementation Notes:**
- `getArAging()` returns aging buckets — apply ECL rates to compute impairment provision
- Impairment journal: Debit `Bad Debt Expense` (EXPENSE) / Credit `Allowance for Doubtful Accounts` (contra-ASSET)
- `BankAccount` balances classified as amortized cost — no fair value adjustment needed
- `BusinessLoan` disbursements are financial assets at amortized cost; apply ECL on outstanding balance

#### IAS 16 — Property, Plant and Equipment
Applies to: All Tier 1 entities; IFRS for SMEs Section 17 for Tier 2

**Two Measurement Models (choose one per class):**
- **Cost Model:** Carry at cost less accumulated depreciation and impairment
- **Revaluation Model:** Carry at fair value less subsequent depreciation (requires regular revaluation)

**OVDS Implementation Notes:**
- `FixedAsset` model supports both models via `depreciationMethod` field
- Depreciation methods supported: Straight-Line, Declining Balance, Units of Production
- `DepreciationScheduleModal` generates monthly depreciation journal entries
- Revaluation surplus posted to `EQUITY` account (OCI); revaluation deficit to P&L
- Componentization: significant parts of an asset with different useful lives must be depreciated separately
- Disposal: remove cost + accumulated depreciation; recognize gain/loss in P&L

#### IAS 2 — Inventories
Applies to: `MANUFACTURING`, `LARGE_ENTERPRISE`, `MEDIUM_ENTERPRISE`; IFRS for SMEs Section 13 for Tier 2

**Cost Formulas:**
- **FIFO** (First-In-First-Out) — permitted ✅
- **Weighted Average (WA)** — permitted ✅
- **LIFO** (Last-In-First-Out) — **prohibited under IFRS** ❌

**OVDS Implementation Notes:**
- `getInventory(companyId, method)` supports `FIFO`, `LIFO`, `WA` — **LIFO must not be used for IFRS-compliant reporting**; flag a warning when `LIFO` is selected for Tier 1/2 entities
- Inventory measured at **lower of cost and net realizable value (NRV)**
- Write-down to NRV: Debit `Cost of Goods Sold` / Credit `Inventory`
- Manufacturing entities must include direct materials, direct labor, and allocated production overheads in inventory cost

#### IAS 19 — Employee Benefits
Applies to: All Tier 1 entities; IFRS for SMEs Section 28 for Tier 2

**Short-Term Employee Benefits (recognized when service rendered):**
- Salaries, wages, social security contributions (pension), paid annual leave, sick leave
- Ethiopian pension (7% employee + 11% employer) → recognized as expense in the period of service

**Post-Employment Benefits:**
- Defined contribution plans (Ethiopian pension scheme) → expense = contribution due
- Defined benefit plans (if any severance/gratuity obligations) → actuarial valuation required

**OVDS Implementation Notes:**
- `PayrollRecord` fields (`incomeTax`, `employeePension`, `employerPension`) align with IAS 19 short-term benefit recognition
- Accrued leave balances must be recognized as a liability (`CURRENT_LIABILITY` account) if employees have unused entitlement
- `leaveEntitlement` on `Employee` model drives the accrual calculation
- Severance obligations (if applicable under Ethiopian Labour Proclamation 1156/2019) should be provisioned under IAS 37

#### IAS 36 — Impairment of Assets
Applies to: All Tier 1 entities; IFRS for SMEs Section 27 for Tier 2

**OVDS Implementation Notes:**
- Annual impairment review required for `FixedAsset` records (goodwill: annually; others: when indicators exist)
- Impairment indicators: significant decline in market value, adverse changes in technology/market, asset underperformance
- Recoverable amount = higher of **Fair Value less Costs of Disposal** and **Value in Use**
- Impairment loss: Debit `Impairment Loss` (EXPENSE) / Credit `Accumulated Impairment` (contra-ASSET)

#### IAS 37 — Provisions, Contingent Liabilities and Contingent Assets
Applies to: All Tier 1 entities; IFRS for SMEs Section 21 for Tier 2

**Recognition Criteria (all three must be met):**
1. Present obligation (legal or constructive) as a result of a past event
2. Probable outflow of economic benefits
3. Reliable estimate can be made

**OVDS Implementation Notes:**
- VAT late filing penalties (ETB 500/day) → provision when filing is overdue
- DRRF overdue contributions → provision when `status: OVERDUE`
- Legal disputes, warranty obligations, restructuring costs → `JournalEntry` with `CURRENT_LIABILITY` or `LONG_TERM_LIABILITY` account
- Contingent liabilities disclosed in notes only (not recognized on balance sheet)

#### IAS 38 — Intangible Assets
Applies to: All Tier 1 entities; IFRS for SMEs Section 18 for Tier 2

**OVDS Implementation Notes:**
- Software licenses, patents, trademarks → capitalize if future economic benefits are probable and cost is reliably measurable
- Internally generated goodwill → **not recognized**
- Research costs → expensed; development costs → capitalized if 6 criteria met (IFRS criteria)
- Amortize over useful life using straight-line method; post via `DepreciationScheduleModal`

#### IAS 21 — Effects of Changes in Foreign Exchange Rates
Applies to: All Tier 1 entities; IFRS for SMEs Section 30 for Tier 2

**OVDS Implementation Notes:**
- `CurrencyRate` model stores exchange rates; `GET /ovds/currency-rates/convert` endpoint
- Monetary items (receivables, payables, bank balances in foreign currency) → retranslate at closing rate each period
- Exchange differences → recognized in P&L (not deferred)
- Functional currency for Ethiopian entities: **ETB (Ethiopian Birr)**
- Foreign currency invoices must display both foreign amount and ETB equivalent at transaction date rate

#### IAS 10 — Events After the Reporting Period
Applies to: All Tier 1 entities; IFRS for SMEs Section 32 for Tier 2

**OVDS Implementation Notes:**
- `PeriodManager` period-close lock prevents backdated entries — supports IAS 10 cut-off
- Adjusting events (e.g. settlement of a court case confirming a liability that existed at period end) → adjust financial statements
- Non-adjusting events (e.g. major acquisition after year-end) → disclose in notes only

### IFRS for SMEs — Key Differences from Full IFRS

Relevant for `SMALL_BUSINESS` and qualifying `MEDIUM_ENTERPRISE` entities:

| Topic | Full IFRS | IFRS for SMEs |
|-------|-----------|---------------|
| Revenue | IFRS 15 (5-step model) | Section 23 (simplified) |
| Leases | IFRS 16 (all leases on balance sheet) | Section 20 (ovds/operating distinction retained) |
| Financial Instruments | IFRS 9 (ECL model, 3 categories) | Sections 11–12 (simplified, amortized cost or FVTPL) |
| PP&E | IAS 16 (cost or revaluation) | Section 17 (cost model only — no revaluation) |
| Goodwill | IAS 36 (annual impairment test) | Section 19 (amortize over 10 years if life indeterminate) |
| Employee Benefits | IAS 19 (full actuarial) | Section 28 (simplified actuarial) |
| Investment Property | IAS 40 (fair value or cost) | Section 16 (fair value if reliably measurable, else cost) |
| Borrowing Costs | IAS 23 (capitalize on qualifying assets) | Section 25 (expense all borrowing costs) |

### Financial Statement Presentation Requirements (IAS 1 / IFRS for SMEs Section 3)

All IFRS-compliant entities must present a **complete set of financial statements**:

| Statement | OVDS Component | Standard |
|-----------|---------------|---------|
| Statement of Financial Position (Balance Sheet) | `BalanceSheet.tsx` + `getBalanceSheet()` | IAS 1 / Section 4 |
| Statement of Profit or Loss and OCI | `ProfitLoss.tsx` + `getProfitAndLoss()` | IAS 1 / Section 5 |
| Statement of Changes in Equity | `ChangesInEquity.tsx` | IAS 1 / Section 6 |
| Statement of Cash Flows | `getCashFlow()` | IAS 7 / Section 7 |
| Notes to Financial Statements | `NotesToFinancials.tsx` | IAS 1 / Section 8 |

**Minimum comparative period:** Current year + prior year figures required on all statements.

**Going concern:** Management must assess ability to continue as a going concern for at least 12 months from reporting date.

### IFRS Compliance Checklist (per Business Type)

When generating financial reports or running the compliance auditor, verify:

**Tier 1 (Full IFRS) — `LARGE_ENTERPRISE`, `GOVERNMENT`, large `MANUFACTURING`:**
- [ ] Revenue recognized per IFRS 15 five-step model
- [ ] All leases > 12 months on balance sheet (IFRS 16 ROU asset + liability)
- [ ] ECL provision computed on AR aging buckets (IFRS 9)
- [ ] Inventory at lower of cost and NRV; FIFO or WA only (IAS 2)
- [ ] PP&E depreciation schedule current; impairment review performed (IAS 16, IAS 36)
- [ ] Employee benefit accruals posted (IAS 19)
- [ ] Provisions for VAT penalties, DRRF overdue, legal claims (IAS 37)
- [ ] Foreign currency monetary items retranslated at closing rate (IAS 21)
- [ ] Period closed before financial statements issued (IAS 10 cut-off)
- [ ] Full set of 5 financial statements prepared with comparatives

**Tier 2 (IFRS for SMEs) — `SMALL_BUSINESS`, qualifying `MEDIUM_ENTERPRISE`:**
- [ ] Revenue recognized per Section 23 (performance obligation satisfied)
- [ ] ovds leases on balance sheet; operating leases expensed (Section 20)
- [ ] Financial assets at amortized cost or FVTPL (Sections 11–12)
- [ ] Inventory at lower of cost and NRV; FIFO or WA only (Section 13)
- [ ] PP&E at cost model; depreciation schedule current (Section 17)
- [ ] Goodwill amortized over useful life (max 10 years) (Section 19)
- [ ] Borrowing costs expensed (Section 25)
- [ ] Full set of financial statements prepared

**Tier 3 (Micro-entity) — `FREELANCER`:**
- [ ] No IFRS obligation; basic cash-basis or accrual records sufficient
- [ ] VAT, PIT, and DRRF obligations still apply regardless of IFRS tier

### IFRS-Related OVDS Components

| Component | File | IFRS Relevance |
|-----------|------|----------------|
| Balance Sheet | `Reports/BalanceSheet.tsx` | IAS 1 / Section 4 — assets, liabilities, equity |
| Profit & Loss | `Reports/ProfitLoss.tsx` | IAS 1 / Section 5 — income, expenses, net profit |
| Changes in Equity | `Reports/ChangesInEquity.tsx` | IAS 1 / Section 6 — equity movements |
| Trial Balance | `Reports/TrialBalance.tsx` | Supports IAS 1 preparation |
| Notes to Financials | `Reports/NotesToFinancials.tsx` | IAS 1 / Section 8 — disclosures |
| IFRS Compliance Matrix | `Accounting/IFRSComplianceMatrix.tsx` | Visual compliance status per standard |
| IFRS Disclosure Checklist | `Accounting/IFRSDisclosureChecklist.tsx` | Checklist of required disclosures |
| IFRS Tax Rate Reference | `Accounting/IFRSTaxRateReference.tsx` | Tax rate reference aligned with IFRS |
| Period Manager | `Accounting/PeriodManager.tsx` | IAS 10 — period cut-off enforcement |
| Depreciation Schedule | `DepreciationScheduleModal.tsx` | IAS 16 / IAS 38 — asset depreciation |
| Chart of Accounts | `Accounting/ChartOfAccounts.tsx` | IAS 1 — account classification (ASSET, LIABILITY, EQUITY, INCOME, EXPENSE) |
| Journal Entry Form | `Accounting/JournalEntryForm.tsx` | Double-entry per IFRS Conceptual Framework |

### AABE Regulatory Authority

- **Full name:** Accounting and Auditing Board of Ethiopia (AABE)
- **Website:** [aabe.gov.et](http://www.aabe.gov.et/)
- **Legal basis:** Proclamation 847/2014 + Regulation 332/2014
- **Role:** Endorsement body — adopts IFRS as issued by IASB without modification
- **Enforcement:** AABE updates SME classification thresholds periodically; always check current AABE guidance
- **Audit requirement:** Tier 1 entities require statutory audit by a licensed audit firm; `AuditOutsourcing` module supports this workflow
- **No local GAAP:** Ethiopia has no separate local GAAP — entities use Full IFRS, IFRS for SMEs, or are outside scope

---

## User Management

### Inviting a User

```
POST /api/auth/register
Body: { username, password, role, companyId, employeeId }
```

Required: `username`, `password` (min 8 chars), `role`
Optional: `companyId` (tenant assignment), `employeeId` (links to Employee record for HR/payroll)

After creation the user can log in immediately. Encourage password change on first login.

### User Actions (ADMIN / SPURADMIN)

| Action | Endpoint |
|--------|---------|
| List users (paginated) | `GET /api/auth/users` |
| Change role | `PATCH /api/auth/users/:id/role` |
| Assign company | `PATCH /api/auth/users/:id/company` |
| Reset password | `PATCH /api/auth/users/:id/reset-password` |
| Unlock account | `PATCH /api/auth/users/:id/unlock` |
| Delete user | `DELETE /api/auth/users/:id` |
| Link Auth0 identity | `PATCH /api/auth/users/:id/auth0/link` |

### Account Locking

After **5 consecutive failed login attempts**, the account is locked (`lockedUntil` is set). Unlock via `PATCH /api/auth/users/:id/unlock`. The `failedLoginAttempts` counter resets on successful login.

### Accountant Access Patterns

| Scenario | Recommended Role | Key Permissions |
|----------|-----------------|----------------|
| External bookkeeper | `ACCOUNTING` | Create journal entries, reconcile banks, compute VAT, view all financial reports |
| Read-only auditor | `AUDITOR` | Read all domains, annotate audit logs — cannot create or modify records |
| Full ovds control | `ovds` | Everything ACCOUNTING can do + submit VAT, approve payroll, manage fund transfers |

### Role Customization

OVDS does **not** support runtime role customization. Roles and permissions are compile-time constants in `frontend/src/rbac/rbac.ts` and enforced by `RBACGuard` on the backend. Modifying roles requires a code change and redeployment.

---

## CRM Module

### Contact Management

**Contact types:** `LEAD`, `PROSPECT`, `CUSTOMER`, `PARTNER`

```
POST /api/crm/contacts        — create contact (crm:contacts:write)
GET  /api/crm/contacts        — list contacts with filter/search
PATCH /api/crm/contacts/:id   — update contact
DELETE /api/crm/contacts/:id  — delete contact
```

**Logging an interaction:**
```
POST /api/crm/contacts/:id/interactions
Body: { type: 'CALL'|'EMAIL'|'MEETING'|'NOTE', summary, outcome, performedBy }
```

Interactions are stored as `CustomerInteraction` records and feed into the Customer 360 credit score calculation.

### Deal Pipeline

```
POST /api/crm/deals           — create deal (crm:deals:write)
GET  /api/crm/deals           — list deals
PATCH /api/crm/deals/:id      — update deal stage/value
```

### CRM Reports

```
GET /api/crm/reports          — pipeline summary, conversion rates (crm:reports:read)
```

### Converting a Contact to Customer

When a CRM contact is converted to a customer, a `Customer` record is created in the ovds module. This enables:
- Invoice creation against the customer
- Customer 360 view with credit score and loyalty tier
- AR aging tracking

### CRM RBAC

| Permission | Who Has It |
|-----------|-----------|
| `crm:read` | `CRM`, `ADMIN`, `SPURADMIN` |
| `crm:write` | `CRM`, `ADMIN`, `SPURADMIN` |
| `crm:contacts:read/write` | `CRM`, `ADMIN` |
| `crm:deals:read/write` | `CRM`, `ADMIN` |
| `crm:reports:read` | `CRM`, `ADMIN`, `ovds` |
| `crm:marketing:read/write` | `CRM`, `ADMIN` |

---

## Payroll Workflow

The Payroll Engine automates Ethiopian PIT brackets and pension contributions (7% employee / 11% employer).

**Approval stages:** Generate → Verify → Finalize → Approve → Submit

Each stage is RBAC-controlled — only authorized roles can advance the workflow. Produces ERCA-compliant payslips and PIT certificates. Biometric attendance and geo-fencing enforce workforce authenticity.

### Payroll Calculation Logic (`PayrollService`)


```
grossPay    = (basicPay / daysInMonth) × presentDays
otPay       = overtimeHours × hourlyRate × 1.5
grossTotal  = grossPay + otPay
incomeTax   = calcEthiopianPIT(grossTotal)   ← PIT slabs below
employeePension = min(grossTotal, 15000) × 7%  (or employee.pensionRate; cap: ETB 15,000 insurable earnings)
employerPension = min(grossTotal, 15000) × 11% (or employee.employerPensionRate)
loanDeduction   = employee.loanMonthlyDeduction
totalDeductions = incomeTax + employeePension + loanDeduction
netPay      = grossTotal − totalDeductions
```

PIT cumulative calculation (exact values from `calcEthiopianPIT`) — **Proclamation No. 1395/2025, effective July 7, 2025**:

| Taxable (ETB) | Tax |
|--------------|-----|
| ≤ 2,000 | 0 |
| 2,001–4,000 | (taxable − 2,000) × 15% |
| 4,001–7,000 | 300 + (taxable − 4,000) × 20% |
| 7,001–10,000 | 900 + (taxable − 7,000) × 25% |
| 10,001–14,000 | 1,650 + (taxable − 10,000) × 30% |
| > 14,000 | 2,850 + (taxable − 14,000) × 35% |

### Payroll Status Transitions

```
GENERATED → VERIFIED → FINALIZED → APPROVED → PAID
```

Bulk status change enforces valid transitions only — `bulkStatus()` rejects invalid target states. Approved/Paid records cannot be deleted.

### Payroll Bulk Upload

Navigate to **Payroll → Payroll Administration → Bulk Upload**.

Import employee payroll data from CSV for mass updates.

**CSV format:**
```csv
employeeId,basicSalary,hourlyRate,pensionRate,employerPensionRate,loanMonthlyDeduction,bankName,accountNumber
EMP-001,15000,93.75,7,11,500,CBE,1000123456789
EMP-002,22000,137.50,7,11,0,Awash,0012345678
```

**What bulk upload does:**
- Updates `Employee.baseSalary`, `hourlyRate`, `pensionRate`, `employerPensionRate`
- Updates `Employee.loanMonthlyDeduction`, `bankName`, `accountNumber`
- Sets `payrollStatus = ACTIVE` for employees with `baseSalary > 0`
- Skips rows with validation errors; returns `{ succeeded, failed, errors[] }`

**Validation rules:**
- `employeeId` must exist in the company
- `basicSalary` must be ≥ 0
- `pensionRate` must be between 0 and 100
- `bankName` and `accountNumber` required together

**RBAC:** `payroll:admin` (ovds, SPURADMIN)

### Payroll RBAC — Stage Permissions

| Stage | Action | Required Permission | Role |
|-------|--------|-------------------|------|
| Generate | Create payroll records | `payroll:generate` | `HR`, `ovds`, `ACCOUNTING` |
| Verify | Review and verify | `payroll:verify` | `HR`, `ovds` |
| Finalize | Lock for approval | `payroll:finalize` | `HR`, `ovds` |
| Approve | Final approval | `payroll:approve` | `ovds` only |
| Export | Download payslips/CSV | `payroll:export` | `HR`, `ovds` |
| Admin | Full payroll admin | `payroll:admin` | `ovds`, `SPURADMIN` |

### Payroll Setup Checklist

Before running payroll for the first time:

- [ ] All employees have `baseSalary > 0` (sets `payrollStatus = ACTIVE`)
- [ ] Pension rates verified (default: 7% employee, 11% employer)
- [ ] Shifts configured with correct start/end times and work days
- [ ] Financial cycles set up (optional — defines payroll period dates and increment %)
- [ ] `OtherPaymentHead` categories defined for bonuses/allowances (mark `taxable = true` for PIT)
- [ ] Loan deductions configured per employee (`loanMonthlyDeduction` field)
- [ ] Bank details set on each employee (`bankName`, `accountNumber`) for payslip

### Payroll Stats Response

`GET /payroll/stats?year=&month=` returns:
`totalEmployees`, `processed`, `approved`, `pending`, `totalGross`, `totalNet`, `totalTax`, `totalPension`, `totalEmployerPension`, `totalLoans`, `totalOtPay`

### Pay Increment

If `employee.dateOfNextIncrement ≤ first day of payroll month`, `basicPay` is multiplied by `1.05` (5% increment). `dateOfNextIncrement` advances by 1 year after the increment is applied.

### Payslip Contents

Each payslip shows:
- Employee name, ID, department, designation
- Bank name and account number
- Month/year, worked days, absent days, overtime hours
- Gross pay breakdown: basic, overtime, other payments
- Deductions: income tax (PIT), employee pension, loan deduction, other deductions
- Net pay
- Employer pension (shown separately — not deducted from employee)

Export: `Payroll → Export CSV` for all payslips in a month. Individual payslip: click employee → Print Payslip.

---

## HR Sub-Modules

### Departments

Navigate to **HR → Departments**.

Departments group employees for reporting, attendance, and payroll analytics.

**Key fields:** `name`, `description`, `managerId` (links to Employee), `companyId`

**Usage:**
- Every employee must belong to a department (`departmentId` on `Employee`)
- Department stats appear in `getReportsSummary()` — employee count per department
- Efficiency scores in `StrategicInsightsWidget` are computed per department
- Leave analytics (`getAnalytics()`) break down leave counts by department

**RBAC:** `departments:read` (all staff), `departments:write` (HR, ADMIN, SPURADMIN)

---

### Shifts

Navigate to **HR → Shifts**.

Shifts define work schedules — start time, end time, and work days. Every employee is assigned a shift.

**Key fields:**
- `name` (e.g. "Morning Shift", "Night Shift")
- `startTime` / `endTime` — used for LATE threshold calculation and overtime
- `workDays` — comma-separated (e.g. `Mon,Tue,Wed,Thu,Fri`)
- `companyId`

**How shifts affect payroll:**
- `presentDays` = days employee checked in during the payroll month
- `grossPay = (basicPay / daysInMonth) × presentDays`
- `overtimeHours` = hours worked beyond `standard_work_hours` setting (default 8h)

**How shifts affect attendance:**
- Auto-absence cron uses shift `startTime`/`endTime` for ABSENT records
- LATE status triggered if check-in > `late_threshold` minutes after shift `startTime`

**RBAC:** `shifts:read` (all staff), `shifts:write` (HR, ADMIN), `shifts:delete` (HR, ADMIN)

---

### Holidays

Navigate to **HR → Holidays**.

Public holidays are excluded from the auto-absence cron — employees are not marked ABSENT on holidays.

**Key fields:** `name`, `date`, `type` (PUBLIC, COMPANY), `companyId`

**Ethiopian public holidays** (seed via HR → Holidays → Add):
- Ethiopian Christmas (Genna) — January 7
- Ethiopian Epiphany (Timkat) — January 19
- Adwa Victory Day — March 2
- Good Friday / Easter (variable)
- Ethiopian Labour Day — May 1
- Patriots' Victory Day — May 5
- Downfall of the Derg — May 28
- Ethiopian New Year (Enkutatash) — September 11
- Finding of the True Cross (Meskel) — September 27
- Eid al-Fitr (variable)
- Eid al-Adha (variable)
- Prophet's Birthday (Mawlid) (variable)

**RBAC:** `holidays:read` (all staff), `holidays:write` (HR, ADMIN), `holidays:delete` (HR, ADMIN)

---

## Auth0 & SSO

OVDS supports both local JWT authentication and Auth0 SSO. Auth0 is optional — controlled by `AUTH0_ENFORCED` env var.

### Auth0 Configuration

| Env Var | Purpose |
|---------|---------|
| `AUTH0_DOMAIN` | Auth0 tenant domain (e.g. `your-tenant.auth0.com`) |
| `AUTH0_AUDIENCE` | API audience identifier |
| `AUTH0_NAMESPACE` | Custom claims namespace (default: `http://localhost:3000`) |
| `AUTH0_ENFORCED` | `true` = require Auth0; `false` = allow local JWT (default for dev) |
| `VITE_AUTH0_ENABLED` | Frontend toggle — shows Auth0 login button |
| `VITE_AUTH0_DOMAIN` | Frontend Auth0 domain |
| `VITE_AUTH0_CLIENT_ID` | Frontend Auth0 client ID |
| `VITE_AUTH0_AUDIENCE` | Frontend API audience |
| `VITE_AUTH0_CONNECTION` | Auth0 connection name (e.g. `Username-Password-Authentication`) |

### Auth0 Token Flow

```
User logs in via Auth0 → Auth0 issues RS256 JWT
→ Frontend calls POST /auth/auth0/session with Auth0 token
→ Backend validates RS256 token via Auth0AuthGuard
→ Backend issues local HS256 JWT with user data
→ Frontend stores local JWT in localStorage (ovds_token)
→ All subsequent API calls use local JWT
```

### Auth0 Silent Refresh

`auth0TokenRefresh.ts` + `useSessionRefresh()` hook handle proactive token refresh before expiry. Fires `ovds:token-refreshed` custom DOM event → `AuthContext` updates session state.

### MFA Step-Up

Sensitive routes require MFA re-authentication for Auth0 users:

```typescript
// Routes requiring MFA step-up:
SENSITIVE_ROUTES = new Set([
  '/users', '/role-permissions', '/settings', '/audit-logs',
  '/multi-company-admin', '/payroll-administration',
  '/vat-administration', '/tax-filing', '/admin/notifications-settings'
])
```

`useStepUp()` hook + `<StepUpGate>` component + `<StepUpProvider>` context manage the re-auth flow.

### Auth0 User Linking

Users can link their Auth0 identity to an existing local account:
```
PATCH /auth/users/:id/auth0/link    — link Auth0 identity
PATCH /auth/users/:id/auth0/unlink  — unlink Auth0 identity
```

`AuthUser.isAuth0User = true` when the session originated from Auth0.

---

## Multi-Company Administration

Navigate to **Administration → Multi-Company Admin** (requires `companies:write`).

### Cross-Company Operations (SPURADMIN only)

SPURADMIN can operate across all companies. All other roles are strictly tenant-scoped.

```typescript
// SPURADMIN sees all companies in the company switcher
// All other roles only see their assigned company
```

### Company Snapshot

`GET /ovds/companies/:id/snapshot` returns a full dashboard payload:

| Field | Description |
|-------|-------------|
| `revenue` | This month's paid invoice total |
| `revenueTrend` | % change vs last month |
| `invoiceCount` | Invoices created this month |
| `pendingBillsAmount` | Sum of PENDING + OVERDUE bills |
| `employeeCount` | Active employees in company |
| `payrollNetPay` | Total net pay this month |
| `journalCount` | Total journal entries |
| `recentInvoices` | 3 most urgent unpaid invoices |
| `revenueSeries` | 6-month revenue trend `[{ month, revenue }]` |

### Intercompany Transactions

`IntercompanyTransaction` model tracks transfers between two companies:
- `fromCompanyId` / `toCompanyId` — source and destination
- `type`: `TRANSFER`, `LOAN`, `DIVIDEND`, etc.
- `status`: `PENDING → COMPLETED`
- Must manually create a `JournalEntry` and link via `journalEntryId` for GL posting

### Adding a Company

**Method 1 — Company Setup Wizard:** Press `W` → guided setup (departments, shifts, employees)

**Method 2 — Admin panel:** Administration → Companies → New Company

**After adding:**
1. Assign users: `PATCH /api/auth/users/:id/company`
2. Seed tax rates: `POST /api/ovds/tax-rates/seed-et`
3. Seed chart of accounts: `POST /api/ovds/accounts/seed`
4. Add departments and shifts via HR module

---

## White-Label & Branding

Navigate to **Settings → White-Label** (via `WhiteLabelSettings.tsx`).

### Configurable Branding

| Setting | Description |
|---------|-------------|
| Company logo | Shown on invoice PDFs, payslips, and login page |
| Primary color | Overrides `ovds-blue` brand color |
| Company name | Shown in email templates and reports |
| Invoice footer text | Custom footer on all invoice PDFs |
| Favicon | Browser tab icon |

### Invoice PDF Branding

Invoice PDFs include:
- Company logo (from `company_logo_url` SystemSetting)
- Company name, TIN, address
- ERCA-compliant QR code (NBE-IQR format)
- MoR tracking ID
- Custom footer text

### Dark Mode

Full dark mode support via `ThemeContext`. Toggle via `ThemeToggle` in Header. `darkMode: 'class'` in Tailwind config — adds `dark` class to `<html>`. Persisted in `localStorage`.

---

## Financial Ratios Reference

The `FinancialRatioWidget` displays key ratios computed from live financial data. These are standard ratios used by Ethiopian banks for loan assessment.

### Liquidity Ratios

| Ratio | Formula | Healthy Range | Notes |
|-------|---------|--------------|-------|
| Current Ratio | Current Assets / Current Liabilities | ≥ 1.5 | < 1.0 = liquidity risk |
| Quick Ratio | (Current Assets − Inventory) / Current Liabilities | ≥ 1.0 | Excludes illiquid inventory |
| Cash Ratio | Cash & Bank / Current Liabilities | ≥ 0.5 | Most conservative |

### Profitability Ratios

| Ratio | Formula | Notes |
|-------|---------|-------|
| Gross Profit Margin | (Revenue − COGS) / Revenue × 100 | Higher = better pricing power |
| Net Profit Margin | Net Profit / Revenue × 100 | After all expenses and taxes |
| Return on Assets (ROA) | Net Profit / Total Assets × 100 | Efficiency of asset use |
| Return on Equity (ROE) | Net Profit / Total Equity × 100 | Return to shareholders |

### Leverage Ratios

| Ratio | Formula | Notes |
|-------|---------|-------|
| Debt-to-Equity | Total Liabilities / Total Equity | < 2.0 preferred by Ethiopian banks |
| Debt-to-Assets | Total Liabilities / Total Assets | < 0.6 preferred |
| Interest Coverage | EBIT / Interest Expense | > 3.0 = comfortable |

### Efficiency Ratios

| Ratio | Formula | Notes |
|-------|---------|-------|
| AR Turnover | Revenue / Average AR | Higher = faster collection |
| Days Sales Outstanding (DSO) | (AR / Revenue) × 365 | Lower = better |
| AP Turnover | COGS / Average AP | Measures payment speed |
| Inventory Turnover | COGS / Average Inventory | Higher = less stock sitting |

> **Ethiopian bank context:** CBE, Awash, and Dashen typically require Current Ratio ≥ 1.2 and Debt-to-Equity ≤ 2.5 for working capital loan approval.

---

## Testing

### Running Tests

```bash
npm run test          # Jest unit tests (backend)
npm run test:e2e      # End-to-end tests
npm run test:watch    # Watch mode (dev only)
npm run test:cov      # Coverage report
```

### Backend Test Structure

Tests live alongside source files: `feature.service.spec.ts`, `feature.controller.spec.ts`.

```typescript
// Standard service test pattern
describe('InvoiceService', () => {
  let service: InvoiceService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: AuditLogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get(InvoiceService);
    prisma = module.get(PrismaService);
  });

  it('should create an invoice', async () => {
    prisma.invoice.create.mockResolvedValue(mockInvoice);
    const result = await service.create(mockDto, 'company-1', 'user-1');
    expect(result.customerName).toBe(mockDto.customerName);
    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ companyId: 'company-1' }) })
    );
  });
});
```

### What to Test

| Layer | What to test |
|-------|-------------|
| Services | Business logic, PIT calculation, DRRF levy rates, status transitions |
| Controllers | Guard application, DTO validation, response shape |
| Guards | SPURADMIN bypass, role checks, company isolation |
| Utilities | `calcEthiopianPIT()`, `haversineDistance()`, date helpers |

### Frontend Testing

Frontend uses Vitest (via Vite). Run with:
```bash
npm run test --prefix frontend -- --run   # single run (no watch)
```

Test files: `*.test.tsx` or `*.spec.tsx` alongside components.

---

## API Documentation (Swagger)

Navigate to `/api/docs` (requires `api_docs:read` permission — `DEVELOPER`, `SPURADMIN`).

OVDS uses NestJS Swagger (`@nestjs/swagger`) to auto-generate OpenAPI 3.0 documentation.

### Swagger Setup

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('OVDS API')
  .setVersion('2.0.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Decorators Used

```typescript
@ApiTags('Invoices')           // Groups endpoints in Swagger UI
@ApiBearerAuth()               // Shows lock icon — requires JWT
@ApiOperation({ summary: '' }) // Endpoint description
@ApiResponse({ status: 200, type: InvoiceDto }) // Response schema
@ApiProperty()                 // DTO field documentation
@ApiPropertyOptional()         // Optional DTO field
```

### API Versioning

All endpoints are prefixed with `/api`. No versioning prefix currently — breaking changes handled via deprecation notices in Swagger descriptions.

### Postman Collection

Export from Swagger UI: click **Export** → **OpenAPI 3.0 JSON** → import into Postman.

Base URL for local dev: `http://localhost:3000/api`

---

## Module Dependency Map

Key inter-module dependencies in the NestJS backend. Understanding these prevents circular dependency errors and helps with module registration order.

```
AppModule
├── AuthModule          → PrismaModule, SettingsModule
├── EmployeesModule     → PrismaModule, DepartmentsModule, ShiftsModule
├── DepartmentsModule   → PrismaModule
├── ShiftsModule        → PrismaModule
├── AttendanceModule    → PrismaModule, EmployeesModule, BiometricsModule, SettingsModule, HolidaysModule
├── BiometricsModule    → PrismaModule, EmployeesModule
├── LeavesModule        → PrismaModule, EmployeesModule
├── HolidaysModule      → PrismaModule
├── PayrollModule       → PrismaModule, EmployeesModule, AttendanceModule, SettingsModule
├── ovdsModule       → PrismaModule, AccountingModule, VatModule, TaxModule
├── AccountingModule    → PrismaModule
├── VatModule           → PrismaModule, ovdsModule
├── DisasterFundModule  → PrismaModule, ovdsModule, PayrollModule
├── DashboardModule     → PrismaModule, ovdsModule, EmployeesModule
├── NotificationsModule → PrismaModule, SettingsModule
├── SettingsModule      → PrismaModule
├── WebsocketModule     → (standalone, subscribes to AttendanceEventsService)
├── OnboardingModule    → PrismaModule, EmailModule
├── AuditOutsourcingModule → PrismaModule
├── AppstoreModule      → PrismaModule
└── PrismaModule        → (root — no dependencies)
```

### Key Shared Services

| Service | Imported By |
|---------|------------|
| `PrismaService` | Every module |
| `AuditLogService` | ovds, Payroll, Auth, Attendance, Leaves, Settings |
| `EmailService` | Notifications, Leaves, Onboarding |
| `SettingsService` | Attendance, Payroll, Notifications |
| `AccountingService` | ovds (invoice/bill auto-posting), VAT, Tax, DisasterFund |

### AttendanceEventsService (RxJS Bridge)

```typescript
// AttendanceService emits:
this.attendanceEvents.emitCheckin(checkinData);

// WebsocketGateway subscribes in afterInit():
this.attendanceEvents.checkin$.subscribe(data => {
  this.server.to('dashboard').emit('newCheckin', data);
  this.server.to('global').emit('newCheckin', data);
});
```

This RxJS Subject pattern decouples `AttendanceService` from `WebsocketGateway` — no circular dependency.

---
| `ServeStaticModule` | Serves `./public` as static files (frontend build), excluding `/api/*` |
| `RequestLoggerMiddleware` | Logs all incoming HTTP requests — applied globally in `AppModule` |

---

## Platform Capabilities

- **Multilingual interface:** Amharic (`am`), Tigrinya (`ti`), English (`en`) — via `react-i18next`; translations in `frontend/src/assets/i18n.json`; switch at runtime via `i18n.changeLanguage(code)`
- **PWA support:** Mobile installation and offline access — `vite-plugin-pwa` with `autoUpdate` register type; disabled in dev to prevent stale cache
- **Real-time dashboards:** Predictive analytics and KPI widgets
- **Smart Alerts:** Payroll, invoice, and attendance anomaly detection
- **Agentic AI:** Autonomous reconciliation and anomaly detection
- **White-labeling:** Customizable branding via `WhiteLabelSettings.tsx`
- **Open-source core:** Self-hostable and customizable
- **Dark mode:** Full theme support via `ThemeContext`; `darkMode: 'class'` in Tailwind; toggled by `ThemeToggle` in Header
- **Offline detection:** `Layout.tsx` listens to `window offline/online` events; shows dismissible `WifiOff` banner when disconnected
- **Deployment models:** Cloud (SaaS at ovds.com.et) or On-Premise (self-hosted via Docker)
- **Ethiopian fiscal year:** Hamle (July) to Sene (June) — `fiscal_year_start = 7` in SystemSetting
- **Ethiopian calendar display:** Gregorian default; Ethiopian calendar display available via localization settings
- **Timezone:** Africa/Addis_Ababa (EAT, UTC+3) — live clock in Sidebar footer uses `en-ET` locale

---

## Deployment Models

### Cloud (SaaS)

- Hosted at `https://ovds.com.et`
- Automatic updates, backups, and scaling
- Subscription pricing based on employee count and modules
- Sign-up flow: go to ovds.com.et → Get Started → verify email → get API key from Account Dashboard → paste in Company Setup Wizard

### On-Premise (Self-Hosted)

```bash
# Prerequisites: Docker + Docker Compose
docker-compose up -d    # Starts MySQL 8 + NestJS API

# First-time setup
npm run db:push         # Apply Prisma schema
npm run seed            # Seed demo data and default users
```

**Server requirements:**
- Node.js 18+ (for non-Docker builds)
- MySQL 8 / MariaDB 10.6+
- 2 GB RAM minimum (4 GB recommended for production)
- Ports: 3000 (API), 5173 (Vite dev), 3306 (MySQL)

**Production checklist:**
- [ ] Set `JWT_SECRET` to a strong random value (min 32 chars)
- [ ] Set `NODE_ENV=production` (disables `ms` field in API responses)
- [ ] Configure SMTP (`MAIL_USER`, `MAIL_PASS`, `MAIL_HOST`) for email delivery
- [ ] Set `SIEM_WEBHOOK_URL` if integrating with a SIEM system
- [ ] Run `npm run build --prefix frontend` and copy output to `./public`
- [ ] Set `PRISMA_DATABASE_URL` to production database
- [ ] Enable HTTPS via reverse proxy (nginx/Caddy) in front of port 3000
- [ ] Set `AUTH0_ENFORCED=true` if using Auth0 SSO in production

---

## Data Migration Guide

When migrating from another system (QuickBooks, Sage, spreadsheets), follow this order to avoid data integrity issues:

| Step | Action | Where |
|------|--------|-------|
| 1 | Seed Chart of Accounts | `POST /api/ovds/accounts/seed` or Accounting → Chart of Accounts |
| 2 | Enter opening balances | Create a journal entry dated last day of previous period; debits = credits |
| 3 | Import customers | ovds → Customers → Import CSV (required: name; recommended: TIN, email) |
| 4 | Import vendors | ovds → Vendors → Import CSV (required: name; recommended: TIN, bank details) |
| 5 | Import items/inventory | ovds → Items → Import CSV (name, unit price, tax rate, stock qty) |
| 6 | Import open invoices | Status PENDING or OVERDUE only — do not import already-paid transactions |
| 7 | Import open bills | Status PENDING or OVERDUE only |
| 8 | Import employees | HR → Employees → Add or bulk upload; set baseSalary, pension rates, bank details |
| 9 | Add bank accounts | Accounting → Bank Accounts → Add Account with opening balance as of migration date |
| 10 | Verify trial balance | Accounting → Reports → Trial Balance — confirm `isBalanced = true` before going live |

> **Critical:** Never import paid historical transactions as invoices/bills. Use opening balance journal entries instead to avoid double-counting revenue and expenses.

---

---

## Mobile & PWA

### PWA Configuration

Configured via `vite-plugin-pwa` in `frontend/vite.config.ts`:

| Setting | Value |
|---------|-------|
| Register type | `autoUpdate` (silent background update) |
| Dev mode | Disabled (prevents stale cache blank pages) |
| Display mode | `standalone` (full-screen app feel) |
| Theme color | `#2980b9` (ovds-blue) |
| Background color | `#f8fafc` |
| Start URL | `/` |
| Orientation | `portrait-primary` |
| Categories | `business`, `productivity`, `ovds` |

PWA shortcuts (home screen long-press):
- **Dashboard** → `/dashboard`
- **Invoices** → `/sales/invoices`

### Service Worker Strategy (`public/sw.js`)

Cache name: `ovds-v3`. Old caches are purged on activate.

| Request type | Strategy |
|-------------|----------|
| API calls (`/api/*`) | Pass-through — never cached |
| HTML / navigation | Network-first (never serve stale `index.html`) |
| Static assets (JS/CSS/images) | Cache-first |
| Offline attendance check-ins | Queued to IndexedDB (`OVDSOffline` → `checkins` store) |

Background sync: When connectivity returns, the `checkins-sync` sync event replays queued check-ins and notifies open tabs via `postMessage({ type: 'SYNC_SUCCESS' })`.

SW messages supported:
- `SKIP_WAITING` — force activate new SW
- `CLEAR_CACHE` — wipe all caches

### Mobile Layout Behavior (`Layout.tsx`)

- Sidebar is **hidden off-screen** on mobile (`-translate-x-full`) and slides in when `sidebarOpen = true`
- Mobile overlay (`bg-slate-900/60 backdrop-blur-[2px]`) covers content when sidebar is open; tap to close
- Sidebar closes automatically on route change (`useEffect` on `location.pathname`)
- Content padding: `p-4` (mobile) → `sm:p-6` → `lg:p-8`
- Max content width: `max-w-[1400px] mx-auto`
- Route-change progress bar: thin `ovds-blue` bar at top of viewport
- Scroll-to-top button with SVG progress ring — appears after 300px scroll
- Activity feed FAB: fixed bottom-right, shifts left when scroll-to-top is also visible

### Responsive Tailwind Breakpoints

| Prefix | Min-width | Usage |
|--------|----------|-------|
| (none) | 0px | Mobile-first base styles |
| `sm:` | 640px | Tablet portrait |
| `md:` | 768px | Tablet landscape |
| `lg:` | 1024px | Desktop — sidebar becomes sticky |
| `xl:` | 1280px | Wide desktop |
| `2xl:` | 1536px | Ultra-wide |

Key mobile patterns used in the codebase:
```tsx
// Sidebar: hidden on mobile, sticky on desktop
className="fixed lg:sticky top-0 z-[100] h-screen"

// Content padding scales up
className="p-4 sm:p-6 lg:p-8"

// Hide on mobile, show on sm+
className="hidden sm:inline"
className="hidden md:block"

// Company switcher hidden on mobile
className="relative hidden md:block"
```

### Keyboard Shortcuts — Full Reference

All shortcuts are bound in `Layout.tsx` via a global `keydown` listener. Ignored when focus is in `input`, `textarea`, or `select`.

| Shortcut | Action |
|----------|--------|
| `?` | Toggle keyboard shortcuts modal |
| `Ctrl/⌘ + K` | Open global search modal |
| `Ctrl/⌘ + B` | Toggle sidebar collapse |
| `Home` | Scroll to top of current page |
| `A` | Toggle activity feed drawer |
| `D` | Toggle dashboard manager |
| `W` | Toggle company setup wizard |
| `R` | Dispatch `kiro:refresh` event (page data refresh) |
| `G → D` | Navigate to `/dashboard` |
| `G → I` | Navigate to `/sales/invoices` |
| `G → P` | Navigate to `/payroll` |
| `G → L` | Navigate to `/accounting` |
| `G → N` | Navigate to `/notifications` |
| `G → S` | Navigate to `/settings` |
| `G → H` | Navigate to `/reports` |
| `G → V` | Navigate to `/vat` |
| `G → E` | Navigate to `/employees` |
| `/` | Focus sidebar nav search (when sidebar expanded) |
| `Escape` | Close context menus / clear nav search |

G-chord: press `G` then a letter within 1 second. Navigation uses `window.__ovds_navigate` (set by Layout on mount).

### Global Events (Custom DOM Events)

| Event | Fired by | Handled by |
|-------|---------|-----------|
| `ovds:token-refreshed` | `api.ts` after Auth0 silent refresh | `AuthContext` — updates session state |
| `ovds:toggle-activity` | Header user menu | `Layout` — toggles activity feed |
| `ovds:open-setup-wizard` | Sidebar | `Layout` — opens company setup wizard |
| `kiro:refresh` | `R` shortcut | Page-level listeners — re-fetch data |

### Build Chunking Strategy (`vite.config.ts`)

| Chunk | Contents |
|-------|---------|
| `vendor-react` | `react`, `react-dom`, `react-router-dom` |
| `vendor-ui` | `lucide-react`, `react-hot-toast` |
| `vendor-i18n` | `i18next`, `react-i18next` |
| `vendor-http` | `axios` |
| (per-page) | Each lazy page is its own chunk |

Build output: `../public` (served by NestJS static file middleware).

### Internationalization

Languages: `en` (English), `am` (Amharic), `ti` (Tigrinya)

```typescript
import { useTranslation } from 'react-i18next';
const { t, i18n } = useTranslation();

// Translate a key
t('admin.title')           // → 'Dashboard'
t('employees.add_btn')     // → 'Add Employee'

// Interpolation
t('invoice.total', { amount: '15,000' }) // → 'Total: ETB 15,000'

// Switch language
i18n.changeLanguage('am'); // → Amharic
i18n.changeLanguage('ti'); // → Tigrinya
i18n.changeLanguage('en'); // → English
```

### i18n.json Structure

`frontend/src/assets/i18n.json` has three top-level sections:

```json
{
  // Default = Tigrinya (ti)
  "admin": { "title": "ዳሽቦርድ", "add_btn": "ወስኽ" },

  "am": {
    // Amharic
    "admin": { "title": "ዳሽቦርድ", "add_btn": "አክል" }
  },

  "en": {
    // English
    "admin": { "title": "Dashboard", "add_btn": "Add" }
  }
}
```

### Adding a New Translation Key

1. Add the key to **all three sections** (`default`/`am`/`en`):

```json
// In i18n.json
{
  "feature": { "new_key": "ትግርኛ ትርጉም" },   // default (Tigrinya)
  "am": {
    "feature": { "new_key": "አማርኛ ትርጉም" }   // Amharic
  },
  "en": {
    "feature": { "new_key": "English translation" }  // English
  }
}
```

2. Use in component:
```typescript
const { t } = useTranslation();
return <button>{t('feature.new_key')}</button>;
```

3. If key is missing from a section, `react-i18next` falls back to the default (Tigrinya) section.

### Key Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `module.label` | `employees.title` | Page/section title |
| `module.action_btn` | `invoices.create_btn` | Action button |
| `module.field_name` | `employees.first_name` | Form field label |
| `module.status_value` | `invoices.status_paid` | Status badge text |
| `common.save` | `common.save` | Shared across modules |
| `common.cancel` | `common.cancel` | Shared across modules |
| `errors.required` | `errors.required` | Validation messages |
| `nav.module_name` | `nav.payroll` | Sidebar navigation |

### Language Switcher

The language switcher is in the Header (top-right). Language preference is persisted in `localStorage` under `i18nextLng`. No page reload required — all labels update immediately via React re-render.

### Brand Colors (Tailwind)

| Token | Hex | Usage |
|-------|-----|-------|
| `ovds-blue` | `#2980b9` | Primary brand, active nav, buttons |
| `ovds-blue-dark` | `#1a6fa8` | Hover state |
| `ovds-blue-light` | `#3d9fd3` | Light accent |
| `ovds-sidebar` | `#1e293b` | Sidebar background |
| `ovds-success` | `#16a34a` | Success states |
| `ovds-warning` | `#d97706` | Warning states |
| `ovds-danger` | `#dc2626` | Error/danger states |
| `ovds-info` | `#0284c7` | Info states |

Custom shadows: `shadow-card`, `shadow-card-hover`, `shadow-ovds`, `shadow-ovds-lg`
Custom animations: `fade-up`, `slide-up`, `fade-in`, `spin-slow`, `scan`, `ticker`, `pulse-slow`

### Brand Colors (Tailwind)

| Token | Hex | Usage |
|-------|-----|-------|
| `ovds-blue` | `#2980b9` | Primary brand, active nav, buttons |
| `ovds-blue-dark` | `#1a6fa8` | Hover state |
| `ovds-blue-light` | `#3d9fd3` | Light accent |
| `ovds-sidebar` | `#1e293b` | Sidebar background |
| `ovds-success` | `#16a34a` | Success states |
| `ovds-warning` | `#d97706` | Warning states |
| `ovds-danger` | `#dc2626` | Error/danger states |
| `ovds-info` | `#0284c7` | Info states |

Custom shadows: `shadow-card`, `shadow-card-hover`, `shadow-ovds`, `shadow-ovds-lg`
Custom animations: `fade-up`, `slide-up`, `fade-in`, `spin-slow`, `scan`, `ticker`, `pulse-slow`

---

## Attendance Service (`AttendanceService`)

### Check-In Methods

| Method | How | Notes |
|--------|-----|-------|
| `BIOMETRIC` | Fingerprint/face via HR → Enrollment kiosk | Template must match exactly |
| `MANUAL` | HR staff records attendance manually | No biometric required |
| `MOBILE` | Employee checks in via PWA | Geofence enforced |
| `QR_CODE` | Scan QR code at office entrance | — |
| `KIOSK` | Dedicated kiosk device | — |
| `SYSTEM` | Auto-generated (e.g. auto-absence cron) | — |

### Check-In Flow

1. Verify biometric template via `BiometricsService.verify()`
2. Block check-in if employee has an APPROVED leave today
3. Validate geofence (if lat/lon provided) — Haversine formula, default 500m radius
4. Block if already checked in today (PRESENT or LATE status)
5. Delete system-generated ABSENT record if it exists for today
6. Determine status: PRESENT or LATE (based on `late_threshold` setting, default 15 min after shift start)
7. Create attendance + audit log atomically in `$transaction`
8. Emit `newCheckin` event via `AttendanceEventsService` → WebSocket

### Check-Out Flow

1. Verify biometric
2. Validate geofence
3. Find most recent check-in without check-out (within last 36 hours — covers night shifts)
4. Calculate `overtimeHours = max(0, totalHours − standard_work_hours)` (default 8h)
5. Update attendance + audit log in `$transaction`
6. Emit `newCheckout` event

### Cron: Auto-Absence (`@Cron(EVERY_DAY_AT_11PM)`)

Runs nightly at 11 PM. Skips weekends (from `work_days` setting) and holidays.

For each employee without attendance or approved leave today:
- Creates ABSENT record with shift start/end times (or 09:00–17:00 default)
- Uses `createMany({ skipDuplicates: true })` for efficiency

### Geofence Settings

| Setting key | Default | Description |
|-------------|---------|-------------|
| `geofence_lat` | `13.4967` | Bureau latitude |
| `geofence_lon` | `39.4753` | Bureau longitude |
| `geofence_radius` | `500` | Max distance in meters |
| `late_threshold` | `15` | Minutes after shift start before LATE |
| `standard_work_hours` | `8` | Hours per day for overtime calculation |
| `work_days` | `Mon,Tue,Wed,Thu,Fri` | Comma-separated work days |

### Monthly Summary

`getMonthlySummary(year, month)` returns per-employee:
`daysPresent`, `daysVerified`, `daysOnLeave`, `holidaysInMonth`, `totalHours`, `totalOvertimeHours`

### Who Is In

`getWhoIsIn()` returns employees with `checkIn ≥ today` and `checkOut = null` — real-time presence. Powered by `WhoIsInWidget` and `RealtimePresenceWidget` on the dashboard.

---

## Leaves Service (`LeavesService`)

### Leave Types

| Type | Description | Notes |
|------|-------------|-------|
| `ANNUAL` | Standard annual leave | Balance tracked against `leaveEntitlement` (default 22 days) |
| `SICK` | Sick leave | No balance limit by default |
| `MATERNITY` | Maternity leave | Per Ethiopian Labour Proclamation 1156/2019 |
| `PATERNITY` | Paternity leave | Per Ethiopian Labour Proclamation 1156/2019 |
| `UNPAID` | Unpaid leave | No pay during period |
| `EMERGENCY` | Emergency leave | Short-notice approval |
| `OTHER` | Other leave types | Custom reason required |

### Leave Application Rules

- `startDate` must not be after `endDate`
- User must be linked to an Employee record
- Overlap check: blocks if PENDING or APPROVED leave exists for the same period
- On apply: emails `hr@OVDS.gov.et` with leave details
- Approved leaves **block attendance check-in** for the leave period

### Leave Approval/Rejection

On approve/reject:
1. Updates `LeaveStatus` + sets `approvedBy`
2. Audit log entry
3. Sends email to employee
4. Creates in-app `Notification` (type: `LEAVE_APPROVED` / `LEAVE_REJECTED`) → triggers WebSocket push

### Leave Balance

`getLeaveBalance(employeeId)` calculates ANNUAL leave only:
```
remaining = employee.leaveEntitlement − sum(approved ANNUAL leave days)
```

Default entitlement: 22 days/year. Override per employee via `leaveEntitlement` field.

> **IAS 19 note:** Unused leave entitlement must be recognized as a `CURRENT_LIABILITY` in IFRS-compliant financial statements.

### Leave Analytics

`getAnalytics()` returns: `total`, `byType`, `byStatus`, `byDepartment` (with approved/pending counts), `monthlyTrend` (YTD)

### Bulk Action

`bulkAction(ids, 'approve'|'reject', adminId)` uses `Promise.allSettled` — partial failures don't block others. Returns `{ succeeded, failed, total }`.

### Employee Self-Service (EMPLOYEE role)

Employees can:
- Apply for leave: HR → Leaves → Apply for Leave
- View their own leave balance and history
- View their own payslips and attendance summary

Permissions: `leaves:read_own`, `leaves:write_own`

---

## Notifications Service (`NotificationsService`)

### Delivery Channels

| Channel | Config key | Trigger |
|---------|-----------|---------|
| WebSocket | — | Always — `sendNotification(employeeId, notification)` → `user_{employeeId}` room |
| Email | `smtpHost`, `smtpPort`, `smtpUser`, `smtpPass`, `fromEmail` | When `email.active = true` and employee has email |
| Slack | `webhookUrl`, `channel` | When `slack.active = true` |
| Intercom | `appId` | When `intercom.active = true` (placeholder log) |

### Integration Config Storage

Config stored in `SystemSetting` under key `notifications_config` as JSON. Loaded on service init and on every `getIntegrationConfig()` call. Updated via `setIntegrationConfig()`.

### Notification Model

```typescript
{
  id, employeeId, type: NotificationType,
  title, message,
  isRead,           // ← note: isRead (not read) in DB
  createdAt
}
```

> The frontend normalizes both `n.read` and `n.isRead` — always check both fields.

### Notification API Patterns

```typescript
// Fetch notifications — always use query params, never path params
GET /notifications?employeeId=<id>&companyId=<id>&limit=50

// Mark single notification read
PUT /notifications/<id>/read

// Mark all read
PUT /notifications/mark-all-read/<employeeId>

// Test a channel
POST /notifications/test  { channel: 'email'|'slack'|'intercom', employeeId? }
```

Both the Header bell and Sidebar badge poll `GET /notifications` every 30 seconds via `useInterval`. Unread count: `list.filter(n => !n.read && !n.isRead).length` — check both fields.

### Email Templates

Navigate to **Admin → Email Templates** (or Notifications → Email Templates).
Requires `notifications:config` permission (`ADMIN`, `SPURADMIN`).

Templates use `{{variableName}}` placeholders:

| Placeholder | Example value |
|-------------|--------------|
| `{{employeeName}}` | Abebe Girma |
| `{{amount}}` | ETB 12,500.00 |
| `{{dueDate}}` | 2026-05-30 |
| `{{invoiceNumber}}` | INV-2026-0042 |
| `{{companyName}}` | Selam Trading PLC |
| `{{period}}` | 2026-04 |

**Available template types:**
`Invoice sent`, `Payment reminder`, `Leave approved`, `Leave rejected`, `Payroll generated`, `VAT filing reminder`, `Welcome / onboarding`

`NotificationTemplate.variables` stores the list of expected placeholders as a JSON string array.

### SMTP Configuration

Navigate to **Admin → Notification Settings** (requires `notifications:config`).

| Field | Notes |
|-------|-------|
| Host | e.g. `smtp.mailtrap.io`, `smtp.gmail.com`, `mail.ethionet.et` |
| Port | `587` (STARTTLS), `465` (SSL), `2525` (Mailtrap) |
| Secure | `true` for port 465; `false` for 587/2525 |
| Username / Password | SMTP credentials |
| From name | Displayed as sender name (e.g. `OVDS ovds`) |
| From address | `noreply@yourcompany.com` |

> If `MAIL_USER` env var is not set, all emails are **silently skipped** — no error thrown. Check `MAIL_USER` first when debugging email delivery.

### Slack Integration

Set `webhookUrl` (Incoming Webhook URL from Slack app settings) and `channel` (e.g. `#ovds-alerts`). Toggle `active: true`. Test via `POST /notifications/test { channel: 'slack' }`.

### Campaign Lifecycle

`DRAFT` → `SENT` (via `sendCampaign(id)`)

Campaigns store `targets` as JSON string array of employee IDs. Use for bulk announcements (payroll ready, VAT deadline reminders, etc.).

### Test Endpoint

`testNotification(channel, employeeId?)` — sends a test message to the first ADMIN employee if no `employeeId` provided.

---

## Settings Service (`SettingsService`)

All settings stored in `SystemSetting` table as key-value pairs (`key: string`, `value: string`).

```typescript
// Read single setting
await settingsService.getSetting('geofence_radius'); // → '500'

// Read all settings as object
await settingsService.getAllSettings(); // → { geofence_radius: '500', ... }

// Upsert single setting
await settingsService.updateSetting('late_threshold', '20');

// Upsert multiple settings at once
await settingsService.updateMany({ late_threshold: '20', work_days: 'Mon,Tue,Wed,Thu,Fri' });
```

### Known Setting Keys

| Key | Default | Used By |
|-----|---------|---------|
| `geofence_lat` | `13.4967` | AttendanceService |
| `geofence_lon` | `39.4753` | AttendanceService |
| `geofence_radius` | `500` | AttendanceService |
| `late_threshold` | `15` | AttendanceService |
| `standard_work_hours` | `8` | AttendanceService |
| `work_days` | `Mon,Tue,Wed,Thu,Fri` | AttendanceService cron |
| `notifications_config` | `{}` | NotificationsService |
| `default_currency` | `ETB` | ovds / Invoice generation |
| `vat_rate` | `15` | Invoice VAT auto-calculation |
| `drrf_rate` | `5` | DRRF levy auto-calculation (ANNUAL_SALES_REVENUE) |
| `fiscal_year_start` | `7` | Ethiopian fiscal year (July = month 7) |
| `invoice_prefix` | `INV-` | Invoice number generation |
| `invoice_next_number` | `1` | Auto-incrementing invoice sequence |
| `default_payment_terms` | `Net 30` | Default terms on new invoices |
| `invoice_default_tax_rate_id` | — | Default tax rate applied to new invoice lines |
| `company_logo_url` | — | Logo shown on invoice PDFs and payslips |
| `timezone` | `Africa/Addis_Ababa` | Date/time display (EAT, UTC+3) |
| `language` | `en` | UI language (`en`, `am`, `ti`) |

### Data Export

`exportAllData()` returns a full system snapshot: employees, departments, shifts, attendances, leaves, holidays, settings, auditLogs, reimbursements, payrollRecords.

---

## WebSocket Gateway (`WebsocketGateway`)

Namespace: `/realtime` | Path: `/socket.io`

### Rooms

| Room | Who joins | Events received |
|------|----------|----------------|
| `user_{userId}` | Authenticated users (by JWT `sub`) | `newNotification` |
| `user_{employeeId}` | Users with `employeeId` in JWT | `newNotification` |
| `dashboard` | All authenticated users | `newCheckin`, `newCheckout`, `notificationUpdate` |
| `public` / `global` | Unauthenticated clients | `newCheckin`, `newCheckout` |

### Authentication

JWT token passed via `handshake.auth.token` or `handshake.query.token`. Invalid token → `client.disconnect()`.

### Events Emitted by Server

| Event | Room | Payload |
|-------|------|---------|
| `newCheckin` | `dashboard`, `global` | `CheckinEvent` (employeeId, checkIn, status, firstName, lastName, type) |
| `newCheckout` | `dashboard`, `global` | `CheckoutEvent` |
| `newNotification` | `user_{employeeId}` | Notification object |
| `notificationUpdate` | `dashboard` | `{ type: 'new', count: 1 }` |
| `onlineUsers` | broadcast | Connected client count |

### Client Messages

| Message | Payload | Effect |
|---------|---------|--------|
| `joinRoom` | `{ room: string }` | Joins the specified room |

### Real-Time Flow

```
AttendanceService.checkIn()
  → AttendanceEventsService.emitCheckin()   ← RxJS Subject
    → WebsocketGateway.afterInit() subscriber
      → server.to('dashboard').emit('newCheckin', data)
      → server.to('global').emit('newCheckin', data)
```

### Frontend WebSocket Usage

```typescript
// useWebSocket hook — connect and listen to events
const { connected, emit } = useWebSocket({
  namespace: '/realtime',
  path: '/socket.io',
  enabled: isAuthenticated,
  events: {
    // Real-time attendance
    newCheckin: (data: CheckinEvent) => {
      setLogs(prev => [data, ...prev.slice(0, 49)]);
    },
    newCheckout: (data: CheckoutEvent) => {
      setLogs(prev => prev.map(l => l.employeeId === data.employeeId
        ? { ...l, checkOut: data.checkOut } : l));
    },
    // Notifications
    newNotification: (data: Notification) => {
      setUnread(n => n + 1);
      toast(data.title);
    },
    notificationUpdate: ({ count }: { count: number }) => {
      setUnread(prev => prev + count);
    },
    // Payroll updates
    payrollUpdate: () => refetch(),
  },
});

// Join a room after connecting
useEffect(() => {
  if (connected) {
    emit('joinRoom', { room: 'dashboard' });
  }
}, [connected]);
```

### WebSocket Connection Lifecycle

```
1. Client connects → sends JWT via handshake.auth.token
2. Gateway validates JWT → extracts userId + employeeId
3. Client auto-joins: user_{userId}, user_{employeeId}, dashboard
4. Client can emit 'joinRoom' to join additional rooms
5. On disconnect → client removed from all rooms
6. On reconnect → client must re-emit 'joinRoom' for custom rooms
```

### Debugging WebSocket

```typescript
// Check connection status
const { connected } = useWebSocket({ ... });
console.log('WS connected:', connected);

// Backend: check connected clients
// GET /api/health/detailed → services.websocket.connectedClients

// Common issues:
// - Not connected: check JWT is valid, port 3000 accessible
// - Not receiving events: ensure 'joinRoom' was emitted after connect
// - Events firing twice: check useWebSocket deps array, avoid re-mounting
```

---

## Docker & Production

### Docker Compose Services

```bash
docker-compose up -d    # Start MySQL 8 + NestJS API
docker-compose down     # Stop all services
docker-compose logs -f api   # Stream API logs
docker-compose exec api sh   # Shell into API container
```

**Services defined in `docker-compose.yml`:**

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `db` | `mysql:8` | 3306 | MySQL 8 database |
| `api` | Built from `Dockerfile` | 3000 | NestJS API + static frontend |

### Dockerfile (Multi-Stage Build)

```
Stage 1 (build):  node:18-alpine → npm ci → npm run build → npm run build --prefix frontend
Stage 2 (prod):   node:18-alpine → copy dist + public → node dist/main.js
```

Frontend build output (`frontend/dist`) is copied to `./public` — served by NestJS `ServeStaticModule`.

### Production Checklist

- [ ] `JWT_SECRET` set to strong random value (min 32 chars)
- [ ] `NODE_ENV=production` (disables `ms` field in API responses)
- [ ] SMTP configured (`MAIL_USER`, `MAIL_PASS`, `MAIL_HOST`)
- [ ] HTTPS via reverse proxy (nginx/Caddy) in front of port 3000
- [ ] `PRISMA_DATABASE_URL` points to production database
- [ ] `AUTH0_ENFORCED=true` if using Auth0 SSO
- [ ] `SIEM_WEBHOOK_URL` set if integrating with SIEM
- [ ] Database backups configured (MySQL dump or managed DB)
- [ ] Log rotation configured for `backend-out.log`
- [ ] Firewall: only expose ports 80/443 externally; 3000/3306 internal only

### Health Check

```bash
GET /api/health/detailed
```

Returns `HealthStatus` with `status: 'healthy' | 'degraded' | 'unhealthy'`. Used by Docker health check and load balancers.

**Status determination:**
- `healthy` — financial health grade A or B, OR (cash > AP × 10% AND netProfit > 0)
- `degraded` — ovds data unavailable or below thresholds
- `unhealthy` — exception thrown during health check

### Rate Limiting

Global throttle: **600 requests/minute per IP** (10/s) via `ThrottlerModule`.

Override per endpoint:
```typescript
@Throttle({ default: { ttl: 60_000, limit: 10 } })  // 10/min
@Post('login')
async login() { ... }
```

Auth endpoint limits:
- `POST /auth/login` — 10/min
- `POST /auth/signup` — 5/min

### Request Logging

`RequestLoggerMiddleware` logs all incoming HTTP requests globally:
```
[HTTP] GET /api/invoices 200 45ms
[HTTP] POST /api/auth/login 401 12ms
```

Applied in `AppModule.configure()` on all routes.

### Caching Strategy

| Layer | TTL | Mechanism |
|-------|-----|-----------|
| Strategic insights | 30s | In-memory `_strategicCache` in `DashboardService` |
| Telecom receipts | Configurable | `TelecomReceiptCache` DB table, cleaned daily |
| Frontend API responses | 30s default | `useApiQuery` in-memory `Map<url, {data, ts}>` |
| Auth0 status | Session | `useAuth0Status` hook with session-level cache |

### Error Handling Architecture

**Backend:**
- `AllExceptionsFilter` — catches all unhandled exceptions, returns `{ statusCode, timestamp, path, message, error, success: false }`
- `TransformInterceptor` — wraps successful responses as `{ statusCode, message, data, success, ms? }`
- `HttpException` subclasses used throughout: `NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException`, `UnauthorizedException`

**Frontend:**
- `ErrorBoundary` at page level (full-screen error with Retry + Reload)
- `ErrorBoundary inline` at widget level (compact inline error bar)
- `toast.error()` via `react-hot-toast` for API errors (suppressed with `x-background: 1`)
- `401` auto-refresh: `api.ts` interceptor retries with refreshed Auth0 token before redirecting to `/login`

### Security Headers (NestJS)

```typescript
// main.ts — apply before app.listen()
import helmet from 'helmet';
app.use(helmet());                    // sets X-Frame-Options, X-XSS-Protection, etc.
app.enableCors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-background'],
});
```

**Helmet headers set:** `X-DNS-Prefetch-Control`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-XSS-Protection`, `Strict-Transport-Security` (HTTPS only)

### Input Sanitization

```typescript
// DTOs use class-validator — all inputs validated before reaching service
@IsString()
@MaxLength(255)
@Matches(/^[a-zA-Z0-9\s\-_.,]+$/, { message: 'Invalid characters' })
name: string;

// Prisma uses parameterized queries — SQL injection not possible via ORM
// Raw SQL ($executeRawUnsafe) — only used in VatService for table creation, never with user input

// Frontend — never use dangerouslySetInnerHTML with user data
// All user content rendered as text nodes via React (XSS-safe by default)
```

### Nginx Reverse Proxy (Production)

```nginx
# /etc/nginx/sites-available/ovds
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;

    # Proxy to NestJS
    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';  # WebSocket support
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;  # long-running requests (OCR, PDF generation)
    }
}
```

```bash
# Get SSL certificate (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### PM2 Process Manager (Non-Docker)

```bash
# Install PM2
npm install -g pm2

# Start OVDS API
pm2 start dist/main.js --name ovds-api --env production

# Auto-restart on server reboot
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs ovds-api
pm2 monit

# Restart after deployment
pm2 restart ovds-api
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'ovds-api',
    script: 'dist/main.js',
    instances: 'max',          // cluster mode — one per CPU core
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    max_memory_restart: '1G',  // restart if memory exceeds 1GB
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
```

### Database Backup (MySQL)

```bash
# Manual backup
mysqldump -u root -p ovds > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
mysql -u root -p ovds < backup_20260418_120000.sql

# Automated daily backup (cron)
# Add to crontab: crontab -e
0 2 * * * mysqldump -u root -p'yourpassword' ovds | gzip > /backups/ovds_$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
0 3 * * * find /backups -name "ovds_*.sql.gz" -mtime +30 -delete
```

**Docker backup:**
```bash
docker-compose exec db mysqldump -u root -p ovds > backup.sql
```

### Log Rotation

```bash
# /etc/logrotate.d/ovds
/path/to/ovds/backend-out.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Prisma Migrations (Production)

```bash
# Development — push schema directly (no migration history)
npm run db:push

# Production — use migrations for safe schema changes
npx prisma migrate dev --name add-feature-name   # creates migration file
npx prisma migrate deploy                         # apply pending migrations (CI/CD)
npx prisma migrate status                         # check migration status

# If migration fails in production
npx prisma migrate resolve --rolled-back <migration-name>
```

> **Important:** Never run `prisma migrate reset` in production — it drops all data.

### Bulk Employee Import

Navigate to **HR → Employees → Import CSV**.

**CSV format:**
```csv
firstName,lastName,employeeId,departmentName,shiftName,basicSalary,email,phone,bankName,accountNumber
Abebe,Girma,EMP-001,ovds,Morning,25000,abebe@company.com,+251911234567,CBE,1000123456789
Tigist,Haile,EMP-002,HR,Morning,18000,tigist@company.com,+251922345678,Awash,0012345678
```

**Required fields:** `firstName`, `lastName`, `employeeId` (unique per company)

**Optional fields:** `departmentName` (must match existing department), `shiftName` (must match existing shift), `basicSalary`, `email`, `phone`, `bankName`, `accountNumber`

**What happens:**
- Creates `Employee` records for new `employeeId` values
- Updates existing employees if `employeeId` already exists
- Sets `payrollStatus = ACTIVE` for employees with `basicSalary > 0`
- Returns `{ created, updated, failed, errors[] }`

**RBAC:** `employees:write` (HR, ADMIN, SPURADMIN)

### Custom Seed Data

To add custom seed data for a specific company or scenario:

```typescript
// prisma/seed-custom.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find or create company
  const company = await prisma.company.upsert({
    where: { name: 'My Test Company' },
    create: { name: 'My Test Company', businessType: 'SMALL_BUSINESS', tin: '123456789012345' },
    update: {},
  });

  // Create employees
  await prisma.employee.createMany({
    data: [
      { firstName: 'Test', lastName: 'Employee', employeeId: 'TEST-001', companyId: company.id, baseSalary: 15000 },
    ],
    skipDuplicates: true,
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

```bash
npx ts-node prisma/seed-custom.ts
```

### Multi-Tenant Testing Patterns

```typescript
// Always test with companyId isolation
describe('InvoiceService - tenant isolation', () => {
  it('should not return invoices from another company', async () => {
    const company1 = 'company-1';
    const company2 = 'company-2';

    // Create invoice for company1
    prisma.invoice.findMany.mockResolvedValue([mockInvoice]);

    const result = await service.findAll(company1, defaultQuery);

    // Verify companyId filter was applied
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: company1 })
      })
    );
    // Should NOT include company2 data
    expect(prisma.invoice.findMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: company2 })
      })
    );
  });
});

// Test SPURADMIN bypass
it('SPURADMIN should access all companies', async () => {
  const spuradminUser = { role: 'SPURADMIN', companyId: undefined };
  // SPURADMIN queries without companyId filter
  const result = await service.findAll(undefined, defaultQuery);
  expect(prisma.invoice.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: {} })
  );
});
```

---

## Dashboard Service (`DashboardService`)

### `getStats(companyId?)` Response

Combines HR stats + invoice ovds stats:

```typescript
{
  totalEmployees, totalDepartments,
  presentToday, lateToday, absentToday,
  recentAttendance,           // last 5 check-ins with employee name
  reimbursement: { pending, approved, totalApprovedAmount },
  payroll: {
    configuredEmployees,      // employees with baseSalary > 0
    totalEmployees,
    totalLoanDeductions,
    totalPensionEmployees,
    approvedCurrentMonth,     // from AuditLog count
    approvedPrevMonth,
  },
  ovds: { thisTotal, lastTotal, trend, paidThis, overdueCount, ... }
}
```

### `getReportsSummary()` Response

Single-query 7-day attendance stats (one `findMany` → grouped in memory):

```typescript
{
  attendanceStats: [{ date, present, late, absent }],  // 7 days
  leaveStats: [{ type, count }],
  departmentStats: [{ name, employees }],
  systemHealth: { dbRecords, recentVerifications, pendingVerifications, uptime },
  reimbursement: { byStatus, byTier, byPurpose },
  ovdsTrends: { vatSummary }
}
```

### `getStrategicInsights()` — AI Analytics

Cached in-memory for 30 seconds. Returns `StrategicInsights`:

| Field | Calculation |
|-------|-------------|
| `projectedPayrollNextMonth` | `currentBasePayroll × growthFactor` (from `FinancialCycle.incrementPercentage` or historical payroll ratio) |
| `absenteeismPredictionRate` | `(absentRecords / totalAttendance) × 100` over last 30 days |
| `efficiencyScoreByDept` | `(actualAttendance / (headcount × workingDays)) × 100` per department |
| `complianceHealth.missingBankDetails` | Employees with no `bankName` or `accountNumber` |
| `complianceHealth.unconfiguredPayroll` | Employees with `payrollStatus = NOT_CONFIGURED` |
| `resourceUtilizationTrend` | `UP` if `basePayroll > totalUnpaidBills`, else `DOWN` |

Working days approximation: `22 − holidaysInPeriod`

---

## Dashboard Widgets (`frontend/src/components/Dashboard/`)

All widgets are managed via `DashboardManager`. Press `D` to open it. Widgets can be toggled, reordered, and saved per dashboard view. Each role has a different default widget set.

### Default Widget Set by Role

| Role | Default Widgets |
|------|----------------|
| `ADMIN` / `SPURADMIN` | BusinessCredibilityWidget, StrategicInsightsWidget, GrowthInsightsBanner, SmartAlertsWidget, QuickActionsBar, LiveComplianceWidget |
| `ovds` / `ACCOUNTING` | FinancialHealthWidget, CashFlowWidget, WeeklyActivityChart, LivePnLBanner, TaxCalendarWidget, PayrollActionItems |
| `HR` | WhoIsInWidget, RecentAttendanceLogs, PayrollSummaryWidget, PayrollInsightsWidget, EmployeeDashboard |
| `EMPLOYEE` | EmployeeDashboard (self-service: leaves, payslips, attendance) |

### Full Widget Reference

| Widget | File | Purpose | Min Role |
|--------|------|---------|----------|
| `AccountingChainWidget` | `AccountingChainWidget.tsx` | Visual compliance chain from invoice → tax submission | `ovds` |
| `AuditReadinessWidget` | `AuditReadinessWidget.tsx` | Audit readiness score and open findings summary | `AUDITOR` |
| `BusinessCredibilityWidget` | `BusinessCredibilityWidget.tsx` | Live Ethiopian bank credibility score (0–100) | `ADMIN` |
| `CashFlowWidget` | `CashFlowWidget.tsx` | Cash in/out trend chart (30/60/90-day) | `ovds` |
| `DashboardManager` | `DashboardManager.tsx` | Orchestrates widget layout, visibility, and saved views | Any |
| `DashboardSlider` | `DashboardSlider.tsx` | Carousel for cycling between saved dashboard views | Any |
| `EmployeeDashboard` | `EmployeeDashboard.tsx` | Self-service HR summary (leaves, payslips, attendance) | `EMPLOYEE` |
| `ERCAComplianceDashboard` | `ERCAComplianceDashboard.tsx` | Full ERCA compliance status with 10-item checklist | `ovds` |
| `ExecutiveSummaryWidget` | `ExecutiveSummaryWidget.tsx` | High-level KPI summary for executive view | `ADMIN` |
| `FinancialHealthWidget` | `FinancialHealthWidget.tsx` | A–F health score with AR/AP/cash/profitability breakdown | `ovds` |
| `FinancialRatioWidget` | `FinancialRatioWidget.tsx` | Key financial ratios (current ratio, debt-to-equity, etc.) | `ovds` |
| `GrowthInsightsBanner` | `GrowthInsightsBanner.tsx` | AI-driven growth recommendations | `ADMIN` |
| `IFRSReadinessWidget` | `IFRSReadinessWidget.tsx` | IFRS compliance readiness score per business type tier | `ovds` |
| `LiveComplianceWidget` | `LiveComplianceWidget.tsx` | ERCA checklist + upcoming filing deadlines | `ovds` |
| `LivePnLBanner` | `LivePnLBanner.tsx` | Real-time revenue vs expense comparison banner | `ovds` |
| `MobileKPIStrip` | `MobileKPIStrip.tsx` | Compact KPI strip optimized for mobile screens | Any |
| `PayrollActionItems` | `PayrollActionItems.tsx` | Pending payroll approvals requiring action | `HR` / `ovds` |
| `PayrollInsightsWidget` | `PayrollInsightsWidget.tsx` | Payroll trends, PIT totals, pension breakdown | `HR` |
| `PayrollSummaryWidget` | `PayrollSummaryWidget.tsx` | Current period payroll totals | `HR` |
| `QuickActionsBar` | `QuickActionsBar.tsx` | Role-specific shortcut buttons | Any |
| `RealtimePresenceWidget` | `RealtimePresenceWidget.tsx` | Live WebSocket-powered employee presence map | `HR` |
| `RecentAttendanceLogs` | `RecentAttendanceLogs.tsx` | Last 7-day attendance summary with status breakdown | `HR` |
| `SmartAlertsWidget` | `SmartAlertsWidget.tsx` | Anomaly detection and deadline alerts | Any |
| `StrategicInsightsWidget` | `StrategicInsightsWidget.tsx` | AI-generated business insights (30s cache) | `ADMIN` |
| `TaxCalendarWidget` | `TaxCalendarWidget.tsx` | Upcoming VAT, DRRF, and BIT filing deadlines | `ovds` |
| `WeeklyActivityChart` | `WeeklyActivityChart.tsx` | Weekly transaction volume chart | `ovds` |
| `WhoIsInWidget` | `WhoIsInWidget.tsx` | Real-time attendance presence (checked in, no checkout) | `HR` |

---

## Sidebar Navigation Domains

The `Sidebar.tsx` accordion is organized into 12 domains. Each nav item is filtered by RBAC at render time — items the user cannot access are hidden entirely.

| Domain | Key Pages | Min Permission |
|--------|----------|----------------|
| Dashboard | `/dashboard`, `/accounting-dashboard` | Any authenticated |
| HR | Employees, Departments, Attendance, Leaves, Shifts, Holidays | `employees:read` |
| Payroll | Payroll, PayrollAdministration | `payroll:read` |
| ovds | Invoices, Bills, Vendors, Items, Expenses, PurchaseOrders | `invoices:read` |
| Accounting | Accounting, ChartOfAccounts, JournalEntries, BankAccounts | `accounting:read` |
| Tax & Compliance | VatAdministration, TaxFiling, DisasterFund, ComplianceAuditor | `vat:read` |
| Business | Partnerships, BusinessLoans, Investments, CRM, TreasuryForecast | `crm:read` |
| Collections | AccountingCollections, PaymentTracker | `collections:read` |
| Reports | Reports, AuditLogs, AuditOutsourcing | `reports:read` |
| Administration | Companies, Users, RolePermissions, Settings | `settings:read` |
| Appstore | AppStore | `settings:read` |
| Notifications | Notifications, EmailTemplates, `admin/NotificationSettings` | `notifications:read` |

> Favorites: Users can pin any nav item; stored in `localStorage` per user.

### NavItem Structure

Each nav item in `Sidebar.tsx` supports:

```typescript
interface NavItem {
  to: string;               // route path
  icon: React.ReactNode;    // lucide icon
  label: string;            // display text
  key: string;              // unique key (used for favorites + visited tracking)
  roles?: AppRole[];        // restrict to specific roles (SPURADMIN bypasses)
  writePermission?: Permission; // shows Eye icon if user lacks write access
  businessTypes?: string[]; // restrict to specific company types
  isNew?: boolean;          // shows "New" badge
  badge?: number;           // numeric badge (e.g. unread count)
  shortcut?: string;        // keyboard shortcut hint shown in tooltip
  quickActions?: QuickAction[]; // hover flyout with sub-actions
  external?: boolean;       // opens in new tab
  action?: () => void;      // renders as button instead of NavLink
}
```

### Domain Color Map

| Domain Key | Color |
|-----------|-------|
| `dashboard`, `my_workspace` | sky |
| `sales` | teal |
| `purchases` | rose |
| `items_domain`, `inventory` | amber |
| `banking_treasury` | emerald |
| `hr` | indigo |
| `accounting` | cyan |
| `tax_compliance` | orange |
| `financial_reports` | violet |
| `crm_domain`, `business_domain` | orange / purple |
| `spuradmin` | red |
| `system` | slate |

### Sidebar Behaviors

- **Collapsed mode:** Shows icon-only with tooltip on hover; domain dividers shown as colored dots
- **Expanded mode:** Full accordion with section sub-groups (e.g. HR has `hr_workforce`, `hr_time`, `hr_leave`, `hr_loans`)
- **Nav search:** Press `/` to focus; filters all items in real time
- **Visited tracking:** Unvisited items show a small dot indicator; cleared after first visit
- **Live notification badge:** Polls `GET /notifications` every 30s; badge bounces on new notifications
- **Admin menu items:** Dynamic items fetched from `GET /admin-menu-items?isActive=true` appended to system domain
- **Company switcher:** Shown in sidebar footer; persists selection to `localStorage`
- **Live clock:** Shows Ethiopian time (locale `en-ET`) updated every 30s

---

## Accessibility

OVDS follows WCAG 2.1 AA guidelines. Full validation requires manual testing with assistive technologies.

### Implemented Patterns

| Pattern | Implementation |
|---------|---------------|
| Semantic HTML | `<button>`, `<nav>`, `<main>`, `<header>`, `<aside>` used correctly |
| ARIA labels | `aria-label` on icon-only buttons; `aria-expanded` on accordions |
| Keyboard navigation | All interactive elements reachable via Tab; modals trap focus |
| Focus management | Modals restore focus to trigger on close |
| Color contrast | `ovds-blue` (#2980b9) meets AA on white backgrounds |
| Screen reader text | `sr-only` Tailwind class for visually hidden labels |
| Form labels | All inputs have associated `<label>` or `aria-label` |
| Error announcements | Form errors use `role="alert"` for screen reader announcement |
| Skip links | Skip-to-content link at top of page |
| Loading states | `aria-busy="true"` on loading containers |

### Tailwind Accessibility Utilities

```tsx
// Visually hidden but readable by screen readers
<span className="sr-only">Loading...</span>

// Focus ring (always visible, not just on mouse click)
<button className="focus:outline-none focus:ring-2 focus:ring-ovds-blue">

// Reduced motion support
<div className="motion-reduce:transition-none animate-fade-up">
```

### Keyboard Shortcuts Accessibility

All keyboard shortcuts are documented in `KeyboardShortcutsModal.tsx` (press `?`). Shortcuts are disabled when focus is in `input`, `textarea`, or `select` to avoid conflicts with text entry.

### RTL Support

OVDS does not currently support RTL (right-to-left) layout. Amharic and Tigrinya are written left-to-right, so this is not required for the current language set.

### Testing Accessibility

```bash
# Install axe-core for automated checks
npm install --save-dev @axe-core/react

# Manual testing tools:
# - NVDA (Windows screen reader) — free
# - VoiceOver (macOS/iOS) — built-in
# - Chrome DevTools Accessibility panel
# - axe DevTools browser extension
```

> Full WCAG compliance requires manual testing with assistive technologies and expert accessibility review beyond automated checks.

---

## Quick Reference — Common Operations

A cheat sheet for the most frequent development tasks.

### Backend — Most Used Patterns

```typescript
// ── Tenant-scoped list with pagination ──────────────────────────────────
async findAll(companyId: string, query: PaginationQueryDto) {
  const [data, total] = await Promise.all([
    this.prisma.invoice.findMany({
      where: { companyId, ...(query.search && {
        customerName: { contains: query.search }
      })},
      orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      take: query.take ?? 20,
      skip: ((query.page ?? 1) - 1) * (query.take ?? 20),
    }),
    this.prisma.invoice.count({ where: { companyId } }),
  ]);
  return { data, pagination: { page: query.page, take: query.take, total, pages: Math.ceil(total / query.take) } };
}

// ── Atomic multi-model write ─────────────────────────────────────────────
const [invoice, journal] = await this.prisma.$transaction([
  this.prisma.invoice.create({ data: invoiceData }),
  this.prisma.journalEntry.create({ data: journalData }),
]);

// ── Audit log (fire-and-forget) ──────────────────────────────────────────
this.auditLog.log(userId, 'INVOICE_CREATED', { invoiceId: invoice.id })
  .catch(() => {}); // never block the main operation

// ── Throw standard errors ────────────────────────────────────────────────
throw new NotFoundException(`Invoice ${id} not found`);
throw new BadRequestException('Cannot delete a paid invoice');
throw new ConflictException('Employee ID already exists');
throw new ForbiddenException('Access denied');
```

### Frontend — Most Used Patterns

```typescript
// ── Fetch with cache ─────────────────────────────────────────────────────
const { data, loading, refetch } = useApiQuery<Invoice[]>(
  `/invoices?companyId=${companyId}`,
  { enabled: !!companyId, deps: [companyId] }
);

// ── Mutate then refetch ──────────────────────────────────────────────────
const handleDelete = async (id: string) => {
  await apiDelete(`/invoices/${id}`);
  log('INVOICE_DELETED', { id });
  invalidateQueryPrefix('/invoices');
  refetch();
};

// ── RBAC gate ────────────────────────────────────────────────────────────
const { can } = useRbac();
if (!can('invoices:write')) return <ReadOnly />;

// ── Company-scoped API call ──────────────────────────────────────────────
const { selectedCompanyId } = useBusiness();
const url = `/invoices?companyId=${selectedCompanyId}`;

// ── Toast notifications ──────────────────────────────────────────────────
import toast from 'react-hot-toast';
toast.success('Invoice created');
toast.error('Failed to save');
toast.loading('Processing...');
```

### API Endpoint Patterns

```
# List (paginated)
GET  /api/resource?companyId=&page=1&take=20&search=&sortBy=createdAt&sortOrder=desc

# Get one
GET  /api/resource/:id

# Create
POST /api/resource
Body: { ...fields, companyId }

# Update
PATCH /api/resource/:id
Body: { ...changedFields }

# Delete
DELETE /api/resource/:id

# Bulk action
POST /api/resource/bulk-action
Body: { ids: string[], action: 'approve'|'reject' }
```

### Prisma Quick Patterns

```typescript
// Count + data in one round trip
const [data, total] = await Promise.all([
  prisma.model.findMany({ where, take, skip }),
  prisma.model.count({ where }),
]);

// Upsert (create or update)
await prisma.systemSetting.upsert({
  where: { key },
  create: { key, value },
  update: { value },
});

// Aggregate
const { _sum } = await prisma.invoicePayment.aggregate({
  where: { invoiceId },
  _sum: { amount: true },
});

// Group by
const byStatus = await prisma.invoice.groupBy({
  by: ['status'],
  where: { companyId },
  _count: { id: true },
});
```

### Ethiopian Tax Quick Calculations

```typescript
// PIT (Personal Income Tax) — Proclamation No. 1395/2025 (effective July 7, 2025)
function calcPIT(gross: number): number {
  if (gross <= 2000)  return 0;
  if (gross <= 4000)  return (gross - 2000) * 0.15;
  if (gross <= 7000)  return 300 + (gross - 4000) * 0.20;
  if (gross <= 10000) return 900 + (gross - 7000) * 0.25;
  if (gross <= 14000) return 1650 + (gross - 10000) * 0.30;
  return 2850 + (gross - 14000) * 0.35;
}

// Pension (cap: ETB 15,000 insurable earnings per Proclamation No. 1395/2025)
const insurableEarnings = Math.min(grossTotal, 15000);
const employeePension = insurableEarnings * 0.07;
const employerPension = insurableEarnings * 0.11;

// VAT
const vatAmount = subtotal * 0.15;

// DRRF (ANNUAL_SALES_REVENUE)
const drrfAmount = subtotal * 0.05;

// Net pay
const netPay = grossTotal - incomeTax - employeePension - loanDeduction;
```

---

## Security Checklist

When building or reviewing any feature, verify:

- [ ] Route added to `ROUTE_POLICY` in `rbac.ts` with minimum permission
- [ ] Sensitive routes added to `SENSITIVE_ROUTES` set if they involve financial or user data
- [ ] Backend controller uses `JwtAuthGuard` + `RolesGuard`
- [ ] Tenant-scoped endpoints use `CompanyGuard` + `@CurrentCompany()`
- [ ] All write operations call `AuditLogService.log()`
- [ ] Frontend `<Can>` gates wrap any UI that mutates data
- [ ] No direct `rbac.ts` imports — always use the `'../rbac'` barrel
- [ ] `useAuditLog()` fires on delete/export actions
- [ ] MFA step-up enforced for routes in `SENSITIVE_ROUTES`
- [ ] No cross-tenant Prisma queries (always include `companyId` in `where`)
- [ ] New module registered in `src/app.module.ts`
- [ ] DTOs use `class-validator` decorators for all input fields
- [ ] Rate limiting applied to auth endpoints (`@Throttle`)
- [ ] `@Public()` only used on truly public endpoints (login, health, share links)
- [ ] IFRS-relevant financial mutations include appropriate journal entry auto-posting
- [ ] Inventory mutations (invoice create/delete) update stock atomically in `$transaction`

---

## Troubleshooting Guide

### Diagnostic Flow — Backend Not Starting

```
1. Check MySQL is running
   → C:\xampp\mysql_start.bat  (Windows)
   → sudo service mysql start  (Linux)
   → docker-compose up -d db   (Docker)

2. Check database exists
   → mysql -u root -e "SHOW DATABASES;" | grep ovds
   → If missing: CREATE DATABASE ovds CHARACTER SET utf8mb4;

3. Check Prisma schema is pushed
   → npm run db:push
   → If error: check PRISMA_DATABASE_URL in .env

4. Check port 3000 is free
   → npx kill-port 3000

5. Check .env file exists and has required vars
   → PRISMA_DATABASE_URL, JWT_SECRET

6. Check for TypeScript compilation errors
   → npm run build
```

### Diagnostic Flow — Frontend Not Loading

```
1. Check backend is running on port 3000
   → curl http://localhost:3000/api/health

2. Check Vite proxy config
   → frontend/vite.config.ts → proxy: { '/api': 'http://localhost:3000' }

3. Check for JS errors in browser console
   → F12 → Console tab

4. Check for stale PWA cache
   → DevTools → Application → Service Workers → Unregister
   → DevTools → Application → Storage → Clear site data

5. Check port conflicts
   → Kill stale node processes on 5173-5176
```

### Diagnostic Flow — Authentication Issues

```
1. JWT expired or invalid
   → Check localStorage.ovds_token in browser DevTools
   → Token format: header.payload.signature (3 parts)
   → Decode at jwt.io to check expiry

2. 401 on all requests
   → Token missing: check login flow
   → Token expired: logout and login again
   → Wrong JWT_SECRET: check .env matches what was used to sign tokens

3. 403 Forbidden
   → Check ROUTE_POLICY in rbac.ts for the route
   → Check user role has required permission
   → SPURADMIN bypasses all — test with superadmin@ovds.com

4. Auth0 issues
   → Set AUTH0_ENFORCED=false and VITE_AUTH0_ENABLED=false for local dev
   → Check AUTH0_DOMAIN and AUTH0_AUDIENCE match Auth0 app settings
```

### Diagnostic Flow — Data Not Appearing

```
1. Check companyId is set
   → User must have companyId in JWT
   → Frontend must pass companyId in API calls
   → Check BusinessContext.selectedCompanyId is not null

2. Check RBAC permission
   → User role must have :read permission for the resource
   → Check ROUTE_POLICY and ROLE_PERMISSIONS in rbac.ts

3. Check database has data
   → npm run db:studio → browse tables
   → Run npm run seed if tables are empty

4. Check API response
   → Network tab in DevTools → find the failing request
   → Check response body for error message
   → Check companyId in query params matches user's company
```

### Diagnostic Flow — Payroll Issues

```
1. Payroll not generating
   → Employee must have baseSalary > 0 (payrollStatus = ACTIVE)
   → Employee must have shiftId set
   → Check attendance records exist for the period

2. Wrong tax calculation
   → Verify calcEthiopianPIT() with known values
   → Check grossTotal = grossPay + otPay (not just basicPay)
   → Pension = grossTotal × 7% (not basicPay)

3. Payroll stuck in GENERATED
   → Must advance through: GENERATED → VERIFIED → FINALIZED → APPROVED
   → Each stage requires specific permission (see Payroll RBAC table)
   → APPROVED records cannot be deleted
```

### Diagnostic Flow — VAT Filing Issues

```
1. VAT not computing
   → Invoices must have vatAmount > 0
   → Bills must have vatAmount > 0
   → Check VatService raw SQL tables exist (created on module init)

2. eTax submission failing
   → TIN must be exactly 15 characters
   → Check Company.tin field
   → Verify eTax reference format: ETAX-VATRETURN-YYYY-MM-XXXXX

3. Input VAT not appearing
   → Bills must have status PAID and vatAmount > 0
   → Check vatinputledger raw SQL table
```

### Diagnostic Flow — WebSocket Not Working

```
1. Not connecting
   → Check backend WebsocketModule is imported in app.module.ts
   → Check port 3000 is accessible
   → Check JWT token is valid (passed via handshake.auth.token)

2. Not receiving events
   → Emit 'joinRoom' after connecting: emit('joinRoom', { room: 'dashboard' })
   → Check room name matches exactly (case-sensitive)

3. Events firing twice
   → Check useWebSocket is not mounted twice (StrictMode double-mount)
   → Check deps array doesn't cause unnecessary re-mounts
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Blank page at `/` | Check MySQL is running; check browser console for JS errors |
| `ECONNREFUSED 3306` | Start MySQL: `C:\xampp\mysql_start.bat` |
| `EADDRINUSE 3000` | Kill existing node process on port 3000 |
| Vite on wrong port | Kill stale node processes on 5173-5176 |
| Route shows `/forbidden` | Check `ROUTE_POLICY` in `frontend/src/rbac/rbac.ts` |
| Seed fails | Run `npm run db:push` first, then `npm run seed` |
| `Invalid model ID` | Prisma client out of sync — run `npx prisma generate` |
| Notification badge ≠ page count | Both use `GET /notifications?employeeId=...` — ensure employee is linked to user |
| ROLE_GRADIENT missing for new role | Add entry to `ROLE_GRADIENT` and `ROLE_BADGE` in `Header.tsx` and `ROLE_BADGE` in `Sidebar.tsx` |
| New page not appearing in sidebar | Add nav entry to `Sidebar.tsx` with correct permission key |
| New route not guarded | Add to `ROUTE_POLICY` in `rbac.ts`; add `AnyAuthGuard` + `RBACGuard` on backend controller |
| Journal entry not auto-posting | Check that the invoice/bill service calls `AccountingService.createJournalEntry()` after save |
| VAT filing stuck in DRAFT | Ensure `VatFiling.status` is updated and `vatApi.ts` `submit` endpoint is called |
| Auth0 login loop | Check `VITE_AUTH0_ENABLED` and `AUTH0_ENFORCED` — set both to `false` for local dev |
| `CompanyGuard` 403 on valid request | Ensure `companyId` is in the JWT payload and `BusinessContext` is initialized |
| Prisma migration conflict | Run `npx prisma migrate reset` (dev only) then `npm run seed` |
| `useWebSocket` not connecting | Confirm backend `WebsocketModule` is imported in `app.module.ts` and port 3000 is free |
| Employee can check in during leave | `AttendanceService.checkIn()` blocks this — ensure leave has `status: APPROVED` and correct date range |
| Cron absences not firing | Check `work_days` setting includes today's short name (e.g. `Mon`); check `HolidaysService.isHoliday()` |
| Notification not delivered via email | Check `notifications_config` in `SystemSetting` — `email.active` must be `true` and SMTP configured |
| Slack notification failing | Verify `slack.webhookUrl` is set and `slack.active = true` in `notifications_config` |
| Leave overlap not detected | Overlap check uses `status: { in: [PENDING, APPROVED] }` — REJECTED leaves don't block |
| `isRead` vs `read` mismatch | Notification model uses `isRead`; frontend normalizes both — always check `n.read ?? n.isRead` |
| WebSocket room not receiving events | Ensure client calls `emit('joinRoom', { room: 'dashboard' })` after connecting |
| Global throttle 429 errors | Default: 600 req/min globally. Override per endpoint with `@Throttle({ default: { ttl, limit } })` |
| Employee P2002 on create | Email or `employeeId` already exists — `ConflictException` thrown |
| Biometric verify fails | Template must be exact string match — ensure device SDK returns same format as registered |
| Onboarding emails not sending | Check `MAIL_USER` env var — silently skipped if not set |
| Audit certificate fails | Engagement must have `status: COMPLETED` — `BadRequestException` otherwise |
| `dateOfNextIncrement` not triggering | Must be `≤ first day of payroll month` — check date is not in the future |
| Employee `payrollStatus` stuck at `NOT_CONFIGURED` | Set `baseSalary > 0` via `updatePayrollStatus()` or employee update |
| `FileAttachment` not loading on engagement | Query uses `attachableType: 'AuditEngagement'` and `attachableId: engagementId` — check both match |
| Invoice share link not working | `shareToken` must be set via `POST /ovds/invoices/:id/share` — not set on creation |
| Cash forecast not generating | `generateCashForecast(period)` requires bank accounts with balances and AR/AP data |
| Payment batch CSV empty | Batch must have `Items` — check `CreatePaymentBatchDto.items` array is non-empty |
| App rating not updating | `updateRating()` is called after `createReview()` — check `Review.appId` matches `App.id` |
| Tax rates missing | Run `POST /ovds/tax-rates/seed-et` (ADMIN only) to seed Ethiopian defaults |
| Chart of accounts empty | Run `POST /ovds/accounts/seed` (ovds only) to seed default Ethiopian accounts |
| OCR extraction failing | Requires `OPENAI_API_KEY` or `GEMINI_API_KEY` env var — check `OcrService` configuration |
| Loan repayment rejected | Loan must be `ACTIVE` or `DISBURSED`; amount must be `> 0` and `≤ outstandingBalance` |
| Credibility score always 0 | Partnership needs TIN, license, members, and linked customers to score above 0 |
| Customer 360 credit score not updating | `getCustomer360()` persists to DB — check `Customer.creditScore` field after call |
| Compliance checklist all PENDING | Run payroll approval, VAT filing, and DRRF contributions to advance checklist items |
| eTax payload validation fails | TIN must be exactly 15 characters; check `Customer.tin` or `Company` TIN field |
| DRRF contributions not archiving | `CleanupScheduler` runs on 15th & 25th — check `ScheduleModule` is imported in `app.module.ts` |
| Tax dashboard `complianceScore` is 0 | Requires approved payroll records, filed VAT filings, and remitted DRRF contributions |
| Health endpoint returns `degraded` | ovds data unavailable — check `AccountingService` and DB connection |
| `TelecomReceiptCache` growing large | `CleanupService.cleanupExpiredCache()` runs daily — check `CleanupScheduler` is active |
| Duplicate attendance detected | `CleanupService.detectDuplicates()` uses raw SQL — check `ScheduleModule` is imported |
| `AdminCreatedMenuItem` not showing in sidebar | Check `isActive: true` and `roles` field includes the user's role |
| `IntercompanyTransaction` not posting to GL | Must manually create `JournalEntry` and link via `journalEntryId` |
| `CreditHold` not blocking invoices | `CreditHold` is a data model only — invoice creation guard must check it explicitly |
| `LoanRequest` vs `BusinessLoan` confusion | `LoanRequest` = employee salary advance; `BusinessLoan` = company bank loan |
| `OtherPayment` not appearing in payslip | Must be included in payroll generation logic — check `PayrollService` |
| Attachment file too large | `FileAttachment.fileData` is `LongText` (max ~4GB) but base64 inflates size ~33% |
| PWA showing stale content | SW is `devOptions.enabled: false` in dev — clear browser cache or disable SW in DevTools |
| `toast.error` firing on background poll | Add `{ headers: { 'x-background': '1' } }` to the axios call |
| `useApiQuery` not re-fetching on param change | Add the param to the `deps` array option |
| `P2002` Prisma error | Unique constraint violation — call `prisma.handlePrismaError(e)` to get `ConflictException` |
| New page title missing | Add entry to `routeTitleMap` in `Layout.tsx` |
| Breadcrumb not showing | Add entry to `ROUTE_BREADCRUMBS` in `Header.tsx` |
| i18n key showing raw key | Add translation to all three sections (`default`/`am`/`en`) in `i18n.json` |
| LIFO selected for IFRS entity | LIFO is prohibited under IAS 2 — warn user and switch to FIFO or WA for Tier 1/2 entities |
| Balance sheet not IFRS-compliant | Ensure accounts use correct `AccountType` (ASSET/LIABILITY/EQUITY/INCOME/EXPENSE) and `AccountCategory`; seed defaults via `POST /ovds/accounts/seed` |
| Revenue recognized on invoice creation | Per IFRS 15, revenue recognized when performance obligation satisfied — use `status: PAID` or delivery confirmation, not creation date |
| Lease not on balance sheet | IFRS 16 requires ROU asset + lease liability for leases > 12 months — create `FixedAsset` (ROU) and corresponding `LONG_TERM_LIABILITY` account entry |
| ECL provision missing from AR | Apply ECL rates to `getArAging()` buckets and post impairment journal: Debit Bad Debt Expense / Credit Allowance for Doubtful Accounts |
| IFRS tier not matching business type | Check AABE thresholds: Tier 1 if 2 of 4 criteria > ETB 300M/200 employees/ETB 200M assets/liabilities; Tier 2 if 2 of 4 > ETB 20M/20 employees/ETB 20M |
| Foreign currency invoice missing ETB equivalent | IAS 21 requires ETB amount at transaction date rate — use `CurrencyRate` model and `GET /ovds/currency-rates/convert` |
| Depreciation not posted monthly | Use `DepreciationScheduleModal` to generate IAS 16/IAS 38 monthly depreciation journal entries |
| Leave accrual not on balance sheet | IAS 19 requires unused leave entitlement recognized as `CURRENT_LIABILITY` — compute from `leaveEntitlement` minus approved ANNUAL leave days |
| VAT penalty provision missing | IAS 37 requires provision when filing is overdue — post Debit Penalty Expense / Credit `CURRENT_LIABILITY` at ETB 500/day |
| DRRF overdue not provisioned | IAS 37 — overdue DRRF contributions (`status: OVERDUE`) must be provisioned as `CURRENT_LIABILITY` |
| Financial statements missing comparatives | IAS 1 requires prior-year figures on all statements — ensure reports accept `startDate`/`endDate` for prior period comparison |
| Credibility score not improving | Score requires: TIN (+10), license (+10), members > 0 (+10), ACTIVE status (+10), linked customers (up to 35pts), agreementRef + contact details (up to 25pts) |
| Business loan not showing in credibility | `BusinessLoan` must be linked to a `Partnership` via `partnershipId`; check `overallCreditScore` is computed on save |
| Investment status stuck at PROSPECTING | Use `PATCH /ovds/investments/:id` to advance `InvestmentStatus` through the lifecycle |
| Audit certificate blocked | Engagement must have `status: COMPLETED` and no open CRITICAL findings — resolve all CRITICAL findings first |
| Notification email not sending | Check `MAIL_USER` env var is set; check `notifications_config.email.active = true` in SystemSetting; test via `POST /notifications/test { channel: 'email' }` |
| Slack notification not sending | Verify `notifications_config.slack.webhookUrl` is set and `slack.active = true`; test via `POST /notifications/test { channel: 'slack' }` |
| Email template placeholder not replaced | `{{variableName}}` must match exactly — missing variables render as raw `{{variableName}}` not blank |
| Campaign not sending | Campaign must be in `DRAFT` status; call `sendCampaign(id)` to advance to `SENT`; check `targets` JSON array is non-empty |
| Collection case not closing invoice | Case closure only updates invoice to `PAID` if `totalPaid >= totalAmount` — record the payment first |
| Cash forecast confidence always 75% | Confidence is hardcoded at 75%; `low = projected - volatility`, `high = projected + volatility` |
| Payment batch CSV empty | Batch must have `Items` — check `CreatePaymentBatchDto.items` array is non-empty before setting status to `PAID` |
| App rating not updating | `updateRating()` is called after `createReview()` — check `Review.appId` matches `App.id` |
| SME IFRS tier wrong | Check AABE thresholds: Tier 1 if 2 of 4 criteria exceed ETB 300M/200 employees/ETB 200M; Tier 2 if 2 of 4 exceed ETB 20M/20 employees/ETB 20M |
| telebirr payment not verifying | Check `TELECOM_CB_THRESHOLD` — circuit breaker opens after 3 failures for 60s; check `TelecomReceiptCache` for cached result |
| Cooperative/government loan not tracked | Use `LoanType: OTHER` or `GOVERNMENT` on `BusinessLoan`; link to `Partnership` for credibility scoring |
| Auth0 login loop | Check `VITE_AUTH0_ENABLED` and `AUTH0_ENFORCED` — set both to `false` for local dev |
| Auth0 session not creating local JWT | Ensure `POST /auth/auth0/session` is called after Auth0 callback; check `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` match Auth0 app settings |
| MFA step-up not triggering | Route must be in `SENSITIVE_ROUTES` set in `rbac.ts`; user must be `isAuth0User = true` |
| Intercompany transaction not in GL | Must manually create `JournalEntry` and set `journalEntryId` on `IntercompanyTransaction` |
| Holiday not blocking auto-absence | Holiday `date` must match today exactly (YYYY-MM-DD); check `HolidaysService.isHoliday()` is called in cron |
| Shift not affecting payroll | Employee must have `shiftId` set; shift `startTime`/`endTime` used for overtime and LATE calculation |
| Department not showing in analytics | Employee must have `departmentId` set; `getReportsSummary()` groups by department |
| Fixed asset not depreciating | Run `DepreciationScheduleModal` to generate monthly entries; check `depreciationMethod` and `usefulLifeYears` are set |
| Purchase order not converting to bill | PO must have `status: RECEIVED`; create bill manually referencing the PO number |
| Period close blocking journal entry | Check `PeriodManager` — entry date falls in a closed period; open the period or use a date in the current open period |
| Swagger docs not loading | Check `api_docs:read` permission — only `DEVELOPER` and `SPURADMIN` can access `/api/docs` |
| White-label logo not showing on invoice | Set `company_logo_url` in SystemSetting; must be a publicly accessible URL or base64 data URI |
| Financial ratios showing zero | Requires journal entries with correct `AccountType` — seed chart of accounts first via `POST /ovds/accounts/seed` |
| Dark mode not persisting | `ThemeContext` persists to `localStorage` — check browser storage is not blocked |
| i18n not switching language | Call `i18n.changeLanguage('am')` — check key exists in all 3 sections of `i18n.json` |
| Department deletion blocked | Reassign all employees to another department first — `departmentId` on each `Employee` |
| Shift not found for employee | Every employee must have `shiftId` set — assign via HR → Employees → Edit |
| Holiday not blocking absence | `isHoliday()` checks exact date match — ensure holiday `date` is stored as midnight UTC |
| FinancialCycle not affecting payroll | `FinancialCycle.incrementPercentage` only affects `projectedPayrollNextMonth` in strategic insights — not live payroll |
| ArrearConfig not applied | `status` must be `PENDING`; apply via Payroll Administration → Arrears |
| OtherPayment not on payslip | `OtherPayment.status` must be `APPROVED`; `headId` must link to active `OtherPaymentHead` |
| LoanRequest not deducting | `employee.loanMonthlyDeduction` must be set; `LoanRequest.status` must be `DISBURSED` |
| Item reorder alert not firing | `reorderLevel` must be set on `Item`; alert logic must check `stockQuantity <= reorderLevel` |
| Currency conversion returning wrong rate | `CurrencyRate` must have entry for `(fromCurrency, toCurrency, date)` — add rate via ovds → Currency Rates |
| Seed fails with foreign key error | Run `npm run db:push` first to create all tables, then `npm run seed` |
| Demo data not loading | Run `npm run seed-demo` after `npm run seed` — requires seed users to exist first |
| Docker container not starting | Check `PRISMA_DATABASE_URL` in `.env` — must be accessible from inside container (use service name `db` not `127.0.0.1`) |
| Docker MySQL connection refused | Wait for MySQL health check to pass before API starts — check `depends_on` with `condition: service_healthy` |
| Rate limit 429 on login | Default: 10/min on `POST /auth/login` — override with `@Throttle()` if needed for testing |
| SIEM webhook not receiving events | Check `SIEM_WEBHOOK_URL` env var is set and accessible from server; check `AuditLogService` is injected |
| Audit logs not purging | `CleanupService.cleanupOldLogs(90)` runs daily at midnight — check `ScheduleModule` is imported in `app.module.ts` |
| Module circular dependency | Check `Module Dependency Map` section — use `forwardRef()` if circular reference is unavoidable |
| `AttendanceEventsService` not emitting | Must be provided in `AttendanceModule` and injected into both `AttendanceService` and `WebsocketGateway` |
| Stock adjustment not creating audit log | `POST /ovds/items/:id/adjust-stock` must call `AuditLogService.log()` with `STOCK_ADJUSTED` action |
| Nginx WebSocket not proxying | Add `proxy_set_header Upgrade $http_upgrade` and `Connection 'upgrade'` to nginx location block |
| PM2 cluster mode not working | Ensure `exec_mode: 'cluster'` and `instances: 'max'` in ecosystem.config.js; NestJS must be stateless |
| SSL certificate expired | Run `sudo certbot renew` — set up auto-renewal: `0 12 * * * certbot renew --quiet` |
| CORS error in browser | Check `app.enableCors()` in `main.ts` — `origin` must match frontend URL exactly including protocol |
| Helmet blocking WebSocket | Helmet's `contentSecurityPolicy` may block Socket.io — configure CSP to allow `ws://` and `wss://` |
| Bulk employee import failing | Check CSV headers match exactly; `departmentName` and `shiftName` must match existing records |
| Custom seed not running | Run `npx ts-node prisma/seed-custom.ts` — ensure `ts-node` is installed (`npm install -D ts-node`) |
| Prisma migration conflict in production | Run `npx prisma migrate status` to check; use `migrate resolve` for failed migrations |
| Database backup not running | Check cron syntax: `crontab -l` to list; `crontab -e` to edit; test manually first |
| Log rotation not working | Check `/etc/logrotate.d/ovds` exists; run `sudo logrotate -f /etc/logrotate.d/ovds` to test |
| `usePagination` not resetting on filter change | Add filter values to `deps` array of `useApiQuery`; reset `page` to 1 when filter changes |
| `useDebounce` not working | Ensure debounce value is in `deps` array of `useApiQuery`, not the raw input value |
| `useFormDirty` not blocking navigation | Must be mounted in the component that owns the form; React Router `useBlocker` must be enabled |
| `useInterval` firing after unmount | Hook cleans up on unmount — if still firing, check for multiple component instances |
| Global search not finding results | Search index built on first open — if stale, close and reopen modal to rebuild |
| Activity feed showing wrong company data | Feed uses `companyId` from `BusinessContext` — ensure company switcher is set correctly |
| Notification bell count not matching page | Both use `GET /notifications?employeeId=...` — check `employeeId` is linked to user account |
| Report export downloading empty file | Check `responseType: 'blob'` on axios call; ensure backend returns correct `Content-Type` header |
| Company switcher not syncing across tabs | `storage` event listener in `BusinessContext` handles cross-tab sync — check localStorage is not blocked |
| Session expiry banner not showing | `sessionExpiring` triggers when `expiresInMinutes < 5` — check JWT expiry time is set correctly |
| Multi-tenant test failing | Ensure `companyId` is in `where` clause; mock `prisma.model.findMany` to verify filter |
| File upload too slow | Base64 encoding inflates size ~33%; files > 5MB cause slow uploads — consider chunked upload or external storage |
| PDF generation failing | `jsPDF` requires `dist/main.js` to have access to fonts — check `@nestjs/serve-static` is serving `./public` |
| Notification type not triggering email | Check `NotificationType` matches the handler in `NotificationsService`; verify `email.active = true` in config |
| Cron job not running | Ensure `ScheduleModule.forRoot()` is in `AppModule`; check server timezone matches expected cron schedule |
| Recurring invoice not generating | `recurringNextDate` must be ≤ today; check `processRecurringInvoices()` is called (no automatic cron — must be triggered) |
| Scheduled invoice not sending | `scheduledSendAt` must be ≤ now; `processScheduledInvoices()` must be called; invoice must be in DRAFT status |
| Connection pool exhausted | Increase `connection_limit` in `PRISMA_DATABASE_URL`; check for unclosed transactions or long-running queries |
| Slow queries in production | Enable MySQL slow query log; use `EXPLAIN` on slow queries; add indexes for `WHERE` clause fields |
| Bundle too large | Run `npx vite-bundle-visualizer` to identify large chunks; ensure all pages use `lazy()` import |
| Memory leak in frontend | Check for accumulating state arrays; ensure `useEffect` cleanups are in place; avoid storing large datasets in state |
| PWA install prompt not showing | Must be HTTPS; SW must be registered; `manifest.json` must be valid; user must have visited twice |
| Offline check-in not syncing | Check `checkins-sync` background sync tag is registered; verify IndexedDB `OVDSOffline.checkins` store has data |
| SW cache stale after deployment | SW cache name is `ovds-v3` — increment version to force cache bust; or send `CLEAR_CACHE` message |
| Password change not working | `currentPassword` must match stored bcrypt hash; new password min 8 chars; check `POST /auth/change-password` |
| Account locked after failed logins | After 5 failures `lockedUntil` is set; unlock via `PATCH /auth/users/:id/unlock` (ADMIN only) |
| Soft delete not filtering | OVDS uses hard delete by default; add `deletedAt: null` to `where` clause if implementing soft delete |
| TypeScript strict errors | Backend has `strict: false`; frontend has `strict: true` — frontend is stricter; fix type errors in frontend code |
| ESLint errors blocking build | Run `npm run lint` to see all errors; `eslint.config.mjs` (backend) and `frontend/eslint.config.js` (frontend) |
| Vite proxy not forwarding WebSocket | Add `ws: true` to the `/socket.io` proxy entry in `vite.config.ts` |

---

## Key File Locations

### Backend — Core

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Full database schema — all 50+ models, enums, indexes |
| `prisma/seed.ts` | Database seed (companies, departments, shifts, users, holidays, tax rates) |
| `prisma.config.ts` | Prisma 7 datasource config |
| `.env` | Environment variables |
| `src/app.module.ts` | Root NestJS module — all imports, global guards, throttler, static files |
| `src/prisma/prisma.service.ts` | Database client + `handlePrismaError()` |
| `src/prisma/audit-log.service.ts` | `AuditLogService.log()` + SIEM webhook + CSV export |
| `src/prisma/email.service.ts` | Nodemailer wrapper with `{{variable}}` template rendering |
| `src/common/interceptors/transform.interceptor.ts` | Wraps all responses in `{ statusCode, message, data, success }` |
| `src/common/filters/http-exception.filter.ts` | Standardizes error responses |
| `src/common/dto/pagination-query.dto.ts` | `PaginationQueryDto` — page, take, search, sortBy, sortOrder |
| `src/common/health.service.ts` | Health check — DB ping, cleanup stats, status determination |
| `src/common/cleanup.service.ts` | Log cleanup (90d), cache cleanup, report archival, duplicate detection |
| `src/common/cleanup.scheduler.ts` | Daily cleanup cron + monthly DRRF archival (15th & 25th) |

### Backend — Auth & Guards

| File | Purpose |
|------|---------|
| `src/auth/guards/company.guard.ts` | Injects `req.companyId` from JWT |
| `src/auth/guards/roles.guard.ts` | Enforces `@Roles()` decorator; SPURADMIN bypasses |
| `src/auth/decorators/current-user.decorator.ts` | `@CurrentUser()` param decorator |
| `src/auth/decorators/public.decorator.ts` | `@Public()` — skips JWT auth |

### Backend — Feature Services

| File | Purpose |
|------|---------|
| `src/ovds/ovds.service.ts` | Invoices, bills, items, companies, inventory, telecom circuit breaker |
| `src/ovds/ovds.controller.ts` | All ovds endpoints — invoices, bills, accounts, VAT, collections, treasury |
| `src/ovds/accounting.service.ts` | Journal entries, bank reconciliation, financial reports, health score |
| `src/ovds/vat.service.ts` | VAT ledgers, reverse-charge, withholding, refunds, eTax submissions (raw SQL) |
| `src/ovds/tax.service.ts` | VAT reconciliation, BIT, DRRF levies, compliance checklist, eTax payload |
| `src/ovds/tax-rate.service.ts` | TaxRate CRUD, Ethiopian rate seeding, tax calculation |
| `src/ovds/treasury.service.ts` | Cash forecasts, payment batches, CSV export |
| `src/ovds/attachment.service.ts` | FileAttachment CRUD — base64 storage, polymorphic attachableType |
| `src/ovds/ocr.service.ts` | Bank statement + invoice OCR via GPT-4o or Gemini |
| `src/disaster-fund/disaster-fund.service.ts` | DRRF levy computation, auto-generation, compliance scoring, remittances |
| `src/payroll/payroll.service.ts` | PIT calculation, salary generation, approval workflow, bulk upload |
| `src/employees/employees.service.ts` | Employee CRUD, KYC, payroll status summary |
| `src/attendance/attendance.service.ts` | Check-in/out, geofence, auto-absence cron, monthly summary |
| `src/leaves/leaves.service.ts` | Leave apply/approve/reject, overlap check, balance, analytics |
| `src/biometrics/biometrics.service.ts` | Biometric register/verify (exact-match simulation) |
| `src/dashboard/dashboard.service.ts` | HR stats, strategic insights (30s cache), reports summary |
| `src/notifications/notifications.service.ts` | Email/Slack/Intercom delivery, WebSocket push, templates, campaigns |
| `src/settings/settings.service.ts` | Key-value SystemSetting store, data export |
| `src/websocket/websocket.gateway.ts` | Socket.io `/realtime` namespace, rooms, JWT auth, event subscriptions |
| `src/audit-outsourcing/audit-outsourcing.service.ts` | Audit firms, engagements, findings, PDF/certificate generation |
| `src/onboarding/onboarding.service.ts` | Onboarding questionnaire, email notifications, CSV export |
| `src/appstore/appstore.service.ts` | App marketplace — listings, reviews, download tracking |

### Frontend — Core

| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | React router + lazy page imports + provider tree + ErrorBoundary |
| `frontend/src/rbac/rbac.ts` | RBAC engine — roles, permissions, route policy, engine methods |
| `frontend/src/rbac/index.ts` | RBAC barrel export (single import point) |
| `frontend/src/rbac/AuthContext.tsx` | Auth state + RBAC helpers + JWT expiry |
| `frontend/src/context/BusinessContext.tsx` | Company switcher + business type context |
| `frontend/src/services/api.ts` | Axios instance with JWT interceptor + helper exports |
| `frontend/src/assets/i18n.json` | All UI translations (en, am, ti) |
| `frontend/vite.config.ts` | Vite config (proxy, PWA, port, build chunks) |
| `frontend/tailwind.config.js` | Tailwind + custom brand colors + animations |
| `frontend/public/sw.js` | Service worker (cache strategy + offline queue) |
| `frontend/public/manifest.json` | PWA manifest (display, shortcuts, icons) |

### Frontend — Layout & Navigation

| File | Purpose |
|------|---------|
| `frontend/src/components/Layout.tsx` | Main app shell — sidebar, header, footer, global modals, offline banner |
| `frontend/src/components/Sidebar.tsx` | Navigation sidebar — 12-domain accordion, favorites, RBAC filtering |
| `frontend/src/components/Header.tsx` | Top bar — search, notifications, breadcrumbs, ROLE_GRADIENT, ROLE_BADGE |
| `frontend/src/components/Footer.tsx` | App footer |
| `frontend/src/components/PageHeader.tsx` | Page-level header with search, filter chips, actions |

### Frontend — Hooks

| File | Purpose |
|------|---------|
| `frontend/src/hooks/useApiQuery.ts` | Data fetching with cache + deduplication + retries |
| `frontend/src/hooks/useAuditLog.ts` | Client-side audit event emitter |
| `frontend/src/hooks/useWebSocket.ts` | Socket.io real-time event hook |
| `frontend/src/hooks/useFormDirty.ts` | Unsaved changes detection + beforeunload |
| `frontend/src/hooks/usePagination.ts` | Page/take/total pagination state |
| `frontend/src/hooks/useDebounce.ts` | Input debouncing |
| `frontend/src/hooks/useInterval.ts` | Safe setInterval with cleanup |
| `frontend/src/hooks/useLocalStorage.ts` | Persistent state in localStorage |

### Frontend — ovds Services

| File | Purpose |
|------|---------|
| `frontend/src/services/accountingApi.ts` | Accounting-specific API calls |
| `frontend/src/services/vatApi.ts` | VAT/ERCA filing API |
| `frontend/src/services/taxApi.ts` | Tax dashboard and filing |
| `frontend/src/services/treasuryApi.ts` | Cash flow forecast API |
| `frontend/src/services/collectionsApi.ts` | Collections and disputes |
| `frontend/src/services/notifications.ts` | Notification templates and campaigns |

---

## Provider Tree (App.tsx)

```
ThemeProvider
  Auth0ProviderWrapper
    AuthProvider
      HealthProvider
        BusinessProvider
          StepUpProvider          ← MFA step-up re-auth
            Router
              ThemedToaster
              AppRoutes
                Layout             ← mounts useSessionRefresh()
```

---

## Adding a New Full-Stack Feature — Quick Reference

### 1. Backend
```bash
# Create module skeleton
nest g module feature-name
nest g controller feature-name
nest g service feature-name
```

**Service checklist:**
- [ ] Inject `PrismaService` and `AuditLogService`
- [ ] All queries include `where: { companyId }` (tenant isolation)
- [ ] Write operations call `AuditLogService.log(userId, action, details)`
- [ ] Multi-model writes use `prisma.$transaction([...])`
- [ ] List endpoints use `PaginationQueryDto` and return `PaginatedResult<T>`
- [ ] Prisma errors caught and passed to `prisma.handlePrismaError(e)`

**Controller checklist:**
- [ ] Apply `@UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)`
- [ ] Add `@Roles(Role.ovds, Role.ADMIN)` (or appropriate roles)
- [ ] Add `@ApiTags('Feature')` and `@ApiBearerAuth()` for Swagger
- [ ] Use `@CurrentUser('id')` for userId, `@Req() req` for `req.companyId`
- [ ] Rate-limit auth-adjacent endpoints with `@Throttle()`

**Module checklist:**
- [ ] Register in `src/app.module.ts` imports array
- [ ] Add `CompanyGuard` to module providers if tenant-scoped
- [ ] Export service if used by other modules

### 2. Prisma
```bash
# After editing prisma/schema.prisma
npm run db:push          # apply schema to DB (dev)
npx prisma generate      # regenerate Prisma client
# For production migrations:
npx prisma migrate dev --name add-feature-name
```

**Schema checklist:**
- [ ] Add `companyId String?` field for tenant isolation
- [ ] Add `@@index([companyId])` for query performance
- [ ] Add `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- [ ] Add unique constraints where needed (`@@unique`)
- [ ] Add `@@index` on fields used in `where` clauses (status, date, foreignKey)

### 3. Frontend Service
```typescript
// frontend/src/services/featureApi.ts
import { apiGet, apiPost, apiPut, apiDelete } from './api';

export const getFeatureItems = (companyId: string) =>
  apiGet<FeatureItem[]>(`/feature-name?companyId=${companyId}`);

export const createFeatureItem = (data: CreateFeatureDto) =>
  apiPost<FeatureItem>('/feature-name', data);

export const updateFeatureItem = (id: string, data: UpdateFeatureDto) =>
  apiPut<FeatureItem>(`/feature-name/${id}`, data);

export const deleteFeatureItem = (id: string) =>
  apiDelete<void>(`/feature-name/${id}`);
```

### 4. Frontend Page
```tsx
// frontend/src/pages/FeatureName.tsx
import { useAuth } from '../rbac';
import { Can } from '../components/Can';
import { useApiQuery } from '../hooks/useApiQuery';
import { useBusiness } from '../context/BusinessContext';

export default function FeatureName() {
  const { selectedCompanyId } = useBusiness();
  const { data, loading, refetch } = useApiQuery<FeatureItem[]>(
    `/feature-name?companyId=${selectedCompanyId}`,
    { enabled: !!selectedCompanyId, deps: [selectedCompanyId] }
  );
  // ...
}
```

**Page registration checklist:**
- [ ] Add lazy import in `App.tsx`: `const FeatureName = lazy(() => import('./pages/FeatureName'))`
- [ ] Add to `ROUTES` array in `App.tsx`: `['/feature-name', FeatureName]`
- [ ] Add nav entry in `Sidebar.tsx` with correct permission key and domain
- [ ] Add to `ROUTE_POLICY` in `rbac.ts`: `'/feature-name': 'feature:read'`
- [ ] Add to `routeTitleMap` in `Layout.tsx`: `'/feature-name': 'Feature Name'`
- [ ] Add to `ROUTE_BREADCRUMBS` in `Header.tsx`: `'/feature-name': { domain: 'ovds', label: 'Feature Name' }`
- [ ] Add i18n keys to all 3 sections in `frontend/src/assets/i18n.json`

### 5. RBAC Gate
```tsx
// Wrap any mutating UI
<Can permission="feature:write" fallback={<ReadOnly />}>
  <MutationButton />
</Can>

// Audit log on destructive actions
const { log, logExport } = useAuditLog();
const handleDelete = async (id: string) => {
  await deleteFeatureItem(id);
  log('FEATURE_DELETED', { id }, 'Feature', id);
  refetch();
};
```

### 6. Adding a New Permission (if needed)
- [ ] Add permission string to the relevant group in `ROLE_PERMISSIONS` in `rbac.ts`
- [ ] Assign to appropriate roles in `ROLE_PERMISSIONS`
- [ ] Add to `ROUTE_POLICY` if it gates a route
- [ ] Add to `RESOURCE_DOMAINS` if it belongs to a resource domain
- [ ] Add to `PERMISSION_GROUPS` for UI grouping in Role Permissions page
- [ ] Add `@Roles()` decorator on backend controller using the new permission

### 7. Adding a New Dashboard Widget
- [ ] Create `frontend/src/components/Dashboard/FeatureWidget.tsx`
- [ ] Wrap with `<Can permission="feature:read">` if role-restricted
- [ ] Add to `AVAILABLE_WIDGETS` array in `DashboardManager.tsx`
- [ ] Add default visibility per role in `DashboardManager.tsx`
- [ ] Export from `frontend/src/components/Dashboard/` if needed

---

## Glossary

| Term | Meaning |
|------|---------|
| SPURADMIN | Super Admin — highest privilege, bypasses all RBAC policies |
| RBAC | Role-Based Access Control — permissions derived from assigned role |
| ABAC | Attribute-Based Access Control — additional conditions (MFA, subsidiary, business type) |
| DRRF / DRRF | Disaster Risk Reduction Fund — Ethiopian levy managed by EDRRFO |
| ERCA | Ethiopian Revenue and Customs Authority — tax authority |
| MoR | Ministry of Revenues — oversees all tax filings |
| SIGTAS / eTax | Ethiopian electronic tax filing portal |
| PIT | Personal Income Tax — progressive salary tax |
| BIT | Business Income Tax — 30% corporate flat rate |
| NBE-IQR | National Bank of Ethiopia Invoice QR format for e-invoices |
| IFRS | International Financial Reporting Standards — global accounting standards issued by IASB |
| IASB | International Accounting Standards Board — issues IFRS standards |
| AABE | Accounting and Auditing Board of Ethiopia — endorses IFRS for Ethiopian jurisdiction (Proclamation 847/2014) |
| Tier 1 (Full IFRS) | Entities meeting 2 of 4: turnover > ETB 300M, employees > 200, assets > ETB 200M, liabilities > ETB 200M |
| Tier 2 (IFRS for SMEs) | Entities meeting 2 of 4: turnover > ETB 20M, employees > 20, assets > ETB 20M, liabilities > ETB 20M |
| Tier 3 (Micro-entity) | Entities below Tier 2 thresholds — outside IFRS scope (e.g. freelancers) |
| IFRS 15 | Revenue from Contracts with Customers — 5-step revenue recognition model |
| IFRS 16 | Leases — all leases > 12 months on balance sheet as ROU asset + lease liability (Tier 1) |
| IFRS 9 | Financial Instruments — ECL impairment model; 3 classification categories (Tier 1) |
| IAS 1 | Presentation of Financial Statements — complete set of 5 statements with comparatives |
| IAS 2 | Inventories — lower of cost and NRV; FIFO or WA only (LIFO prohibited under IFRS) |
| IAS 7 | Statement of Cash Flows — operating, investing, financing activities |
| IAS 10 | Events After the Reporting Period — adjusting vs non-adjusting; period cut-off |
| IAS 16 | Property, Plant and Equipment — cost or revaluation model; depreciation schedule |
| IAS 19 | Employee Benefits — pension, leave accruals, severance obligations |
| IAS 21 | Effects of Changes in Foreign Exchange Rates — ETB functional currency; closing rate for monetary items |
| IAS 36 | Impairment of Assets — recoverable amount test; annual review for goodwill |
| IAS 37 | Provisions, Contingent Liabilities and Contingent Assets — recognition criteria |
| IAS 38 | Intangible Assets — capitalize development costs; expense research costs |
| ECL | Expected Credit Loss — IFRS 9 impairment model applied to AR aging buckets |
| ROU Asset | Right-of-Use Asset — IFRS 16 lessee asset recognized for leased property/equipment |
| NRV | Net Realizable Value — estimated selling price less costs to complete and sell (IAS 2) |
| OCI | Other Comprehensive Income — items bypassing P&L (e.g. revaluation surplus, actuarial gains) |
| CompanyGuard | NestJS guard that enforces tenant isolation per request |
| AnyAuthGuard | NestJS guard accepting both HS256 (JWT) and RS256 (Auth0) tokens |
| RBACGuard | NestJS guard enforcing `@Roles()` decorator; SPURADMIN bypasses |
| StepUpProvider | React context that manages MFA re-authentication flow |
| FinancialCycle | Payroll period model — defines start/end dates for salary runs |
| ArrearConfig | Configuration for retroactive salary adjustments |
| CreditHold | Collections model — flags customers with overdue invoices |
| VatFiling | Model tracking monthly VAT Return lifecycle |
| DisasterFundContribution | Model tracking per-transaction DRRF levy amounts |
| InvoiceActivity | Audit trail for invoice lifecycle events (CREATED, SENT, PAID, etc.) |
| InvoicePayment | Partial or full payment record against an invoice |
| PayrollRecord | Single employee salary record for a month/year |
| PayCommissionService | Service computing basic pay from pay-matrix levels |
| AccountingService | Service handling journal entry auto-posting and reconciliation |
| TransformInterceptor | NestJS interceptor wrapping all responses in `{ statusCode, message, data, success }` |
| AllExceptionsFilter | NestJS filter standardizing all error responses |
| PaginationQueryDto | Standard DTO for `page`, `take`, `search`, `sortBy`, `sortOrder` |
| PaginatedResult | Standard response shape `{ data, pagination: { page, take, total, pages } }` |
| FIFO / LIFO / WA | Inventory costing methods (First-In-First-Out, Last-In-First-Out, Weighted Average) |
| Circuit Breaker | Telecom payment fault-tolerance pattern in `ovdsService` (3 failures → 60s open) |
| SIEM | Security Information and Event Management — webhook target for audit events |
| ovds:token-refreshed | Custom DOM event fired after Auth0 silent token refresh |
| kiro:refresh | Custom DOM event triggering page-level data re-fetch |
| `x-background: 1` | Axios header suppressing global error toast for background polls |

| `vatinputledger` | Raw SQL table for Input VAT ledger entries (merged with Bills at query time) |
| `vatoutputledger` | Raw SQL table for Output VAT ledger entries (merged with Invoices at query time) |
| `vatreverscharge` | Raw SQL table for reverse-charge VAT register |
| `vatwithholding` | Raw SQL table for withholding VAT register (15% withheld from suppliers) |
| `vatetaxsubmission` | Raw SQL table for eTax portal submission tracker |
| `StrategicInsights` | Dashboard AI analytics type — projected payroll, absenteeism, efficiency, compliance health |
| `ReimbursementClaim` | Employee expense reimbursement with `locationTier` and `purpose` fields |
| `DisasterFundSchedule` | Quarterly DRRF filing schedule (year × quarter × category) |
| `DisasterFundRemittance` | Bank remittance record for a DRRF contribution |
| `DisasterFundAuditLog` | Immutable audit trail for DRRF contribution status changes |
| `DisasterFundTarget` | Annual levy target per category for variance analysis |
| `BankTransaction` | Bank transaction record — starts as PENDING, moves to RECONCILED |
| `JournalLine` | Single debit or credit line within a JournalEntry |
| `AccountType` | Prisma enum: ASSET, LIABILITY, EQUITY, INCOME, EXPENSE |
| `AccountCategory` | Prisma enum includes CASH — used to find cash account for auto-posting |
| `AttendanceStatus` | Prisma enum: PRESENT, LATE, ABSENT |
| `PayrollStatus` | Enum: GENERATED, VERIFIED, FINALIZED, APPROVED, PAID |

---

## Employee Model — Key Fields

The `Employee` model is the central HR entity. Key fields beyond the basics:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `baseSalary` | Decimal | 0 | Monthly base salary for payroll |
| `hourlyRate` | Decimal | 0 | Used for overtime calculation |
| `pensionRate` | Decimal | 7 | Employee pension % |
| `employerPensionRate` | Decimal | 11 | Employer pension % |
| `loanBalance` | Decimal | 0 | Outstanding loan balance |
| `loanMonthlyDeduction` | Decimal | 0 | Monthly loan repayment deducted from salary |
| `monthlyDeductions` | Decimal | 0 | Other fixed monthly deductions |
| `leaveEntitlement` | Int | 22 | Annual leave days |
| `employmentNature` | String | `Permanent` | Employment type |
| `cadre` | String | `Non-Teaching` | Staff category |
| `designation` | String? | — | Job title |
| `dateOfNextIncrement` | DateTime? | — | Triggers 5% pay increment when ≤ payroll month |
| `payrollStatus` | String | `NOT_CONFIGURED` | `ACTIVE` / `NOT_CONFIGURED` / `FLAGGED` |
| `bankName` / `accountNumber` | String? | — | For payslip and salary transfer |
| `businessType` | Enum? | — | Links employee to company business type |
| `companyId` | String? | — | Tenant isolation |

### Employee Payroll Status Summary

`getPayrollStatusSummary()` returns: `total`, `configured` (baseSalary > 0), `notConfigured`, `withLoans` (loanBalance > 0), `dueForIncrement` (dateOfNextIncrement ≤ today)

### Employee `findOne` Includes

`findOne(id)` includes: `department`, `shift`, `biometricData`, last 10 `attendance` records (desc).

---

## Departments Service (`DepartmentsService`)

### Key Operations

| Method | Endpoint | Description |
|--------|---------|-------------|
| `findAll(companyId)` | `GET /departments?companyId=` | List all departments with employee count |
| `findOne(id)` | `GET /departments/:id` | Single department with employees |
| `create(dto)` | `POST /departments` | Create department |
| `update(id, dto)` | `PATCH /departments/:id` | Update name/description/manager |
| `remove(id)` | `DELETE /departments/:id` | Delete (blocked if has employees) |

### Department Model — Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Department name (unique per company) |
| `description` | String? | Optional description |
| `managerId` | String? | Links to `Employee.id` — department head |
| `companyId` | String | Tenant isolation |
| `employees` | Employee[] | Relation — all employees in this department |

**Deletion rule:** Department deletion is blocked if it has any linked employees. Reassign employees first.

**RBAC:** `departments:read` (all authenticated), `departments:write` (HR, ADMIN, SPURADMIN)

---

## Shifts Service (`ShiftsService`)

### Key Operations

| Method | Endpoint | Description |
|--------|---------|-------------|
| `findAll(companyId)` | `GET /shifts?companyId=` | List all shifts |
| `findOne(id)` | `GET /shifts/:id` | Single shift with assigned employees |
| `create(dto)` | `POST /shifts` | Create shift |
| `update(id, dto)` | `PATCH /shifts/:id` | Update schedule |
| `remove(id)` | `DELETE /shifts/:id` | Delete (blocked if has employees) |

### Shift Model — Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Shift name (e.g. "Morning", "Night") |
| `startTime` | String | HH:MM format (e.g. "08:00") |
| `endTime` | String | HH:MM format (e.g. "17:00") |
| `workDays` | String | Comma-separated (e.g. "Mon,Tue,Wed,Thu,Fri") |
| `companyId` | String | Tenant isolation |

### How Shifts Drive Calculations

```
presentDays     = attendance records with status PRESENT or LATE in payroll month
grossPay        = (basicPay / daysInMonth) × presentDays
overtimeHours   = max(0, totalHoursWorked − standard_work_hours)  [per day]
LATE status     = checkIn > shiftStartTime + late_threshold minutes
autoAbsence     = no attendance AND no approved leave AND workDay AND not holiday
```

**RBAC:** `shifts:read` (all authenticated), `shifts:write` (HR, ADMIN), `shifts:delete` (HR, ADMIN)

---

## Holidays Service (`HolidaysService`)

### Key Operations

| Method | Endpoint | Description |
|--------|---------|-------------|
| `findAll(companyId, year?)` | `GET /holidays?companyId=&year=` | List holidays, optionally filtered by year |
| `create(dto)` | `POST /holidays` | Add a holiday |
| `bulkCreate(dtos)` | `POST /holidays/bulk` | Add multiple holidays at once |
| `isHoliday(date, companyId)` | Internal | Returns `true` if date is a holiday — used by attendance cron |
| `remove(id)` | `DELETE /holidays/:id` | Delete a holiday |

### Holiday Model — Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Holiday name |
| `date` | DateTime | Holiday date (time component ignored) |
| `type` | String | `PUBLIC` or `COMPANY` |
| `companyId` | String | Tenant isolation |

**RBAC:** `holidays:read` (all authenticated), `holidays:write` (HR, ADMIN), `holidays:delete` (HR, ADMIN)

---

## Payroll Sub-Services

### FinancialCycle (Payroll Periods)

`FinancialCycle` defines payroll period start/end dates and increment percentages.

| Field | Description |
|-------|-------------|
| `name` | Period name (e.g. "July 2026") |
| `startDate` / `endDate` | Period boundaries |
| `incrementPercentage` | Used by `DashboardService.getStrategicInsights()` for projected payroll |
| `status` | `OPEN` / `CLOSED` |
| `companyId` | Tenant isolation |

Navigate to **Payroll → Payroll Administration → Financial Cycles**.

### ArrearConfig (Retroactive Adjustments)

`ArrearConfig` configures retroactive salary adjustments for employees who received incorrect pay in a previous period.

| Field | Description |
|-------|-------------|
| `employeeId` | Target employee |
| `period` | Period being corrected (YYYY-MM) |
| `adjustmentAmount` | Positive (underpaid) or negative (overpaid) |
| `reason` | Explanation for the adjustment |
| `status` | `PENDING` / `APPLIED` |

### OtherPayment & OtherPaymentHead

Ad-hoc supplementary payroll payments (bonuses, allowances, transport, housing).

**OtherPaymentHead** — category definition:

| Field | Description |
|-------|-------------|
| `name` | Category name (e.g. "Housing Allowance", "Transport") |
| `shortCode` | Abbreviation for payslip |
| `isTaxable` | Whether PIT applies to this payment |
| `companyId` | Tenant isolation |

**OtherPayment** — individual payment:

| Field | Description |
|-------|-------------|
| `headId` | Links to `OtherPaymentHead` |
| `employeeId` | Target employee |
| `amount` | Payment amount |
| `period` | Payroll period (YYYY-MM) |
| `taxable` | Overrides `OtherPaymentHead.isTaxable` if set |
| `diaryNo` | Reference number |
| `status` | `PENDING → APPROVED → PAID` |

### LoanRequest (Employee Salary Advance)

Separate from `BusinessLoan` (company bank loan). Tracks employee salary advances.

| Field | Description |
|-------|-------------|
| `employeeId` | Borrowing employee |
| `category` | `LOAN`, `ADVANCE`, etc. |
| `amount` | Total loan amount |
| `installments` | Number of monthly deductions |
| `monthlyDeduction` | `amount / installments` |
| `remainingBalance` | Decremented on each payroll run |
| `status` | `PENDING → APPROVED → DISBURSED → CLOSED` |

**How it affects payroll:** `employee.loanMonthlyDeduction` is deducted from `netPay` each month. When `remainingBalance < 0.01`, the loan closes automatically.

---

## ovds Service — Items & Inventory Detail

### Item Model — Full Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Item name |
| `description` | String? | Optional description |
| `sku` | String? | Stock keeping unit |
| `unitPrice` | Decimal | Selling price |
| `costPrice` | Decimal? | Purchase cost (for margin calculation) |
| `taxRateId` | String? | Links to `TaxRate` |
| `trackInventory` | Boolean | Enable stock management |
| `stockQuantity` | Int | Current stock level |
| `reorderLevel` | Int? | Alert threshold for low stock |
| `category` | String? | Item category |
| `unit` | String? | Unit of measure (kg, pcs, litre, etc.) |
| `companyId` | String | Tenant isolation |

### Stock Adjustment Audit Trail

`POST /ovds/items/:id/adjust-stock`

```typescript
Body: {
  quantity: number,   // positive = add stock, negative = remove
  reason: string,     // e.g. "Physical count correction", "Damaged goods"
  date?: string       // defaults to now
}
```

Creates an `AuditLog` entry with `action: 'STOCK_ADJUSTED'` and the adjustment details.

### Inventory Valuation Methods

| Method | Formula | IFRS IAS 2 |
|--------|---------|-----------|
| `FIFO` | Oldest cost first | ✅ Permitted |
| `WA` | Total cost / total units | ✅ Permitted |
| `LIFO` | Newest cost first | ❌ Prohibited |

`GET /ovds/inventory?companyId=&method=FIFO|WA` returns `{ items, totalValue, method }`.

---

## Currency & Exchange Rates

### CurrencyRate Model

| Field | Description |
|-------|-------------|
| `fromCurrency` | Source currency code (e.g. `USD`) |
| `toCurrency` | Target currency code (e.g. `ETB`) |
| `rate` | Exchange rate |
| `date` | Rate date |
| Unique constraint | `(fromCurrency, toCurrency, date)` |

### Currency Conversion

```
GET /ovds/currency-rates/convert?from=USD&to=ETB&amount=100&date=2026-04-18
```

Returns `{ from, to, amount, converted, rate, date }`.

**IAS 21 compliance:** Monetary items (receivables, payables, bank balances in foreign currency) must be retranslated at the closing rate each period. Exchange differences recognized in P&L.

**Functional currency:** ETB (Ethiopian Birr) for all Ethiopian entities.

---

## Seed Data Reference

### `npm run seed` — What Gets Created

The seed script (`prisma/seed.ts`) creates:

| Entity | Count | Details |
|--------|-------|---------|
| Companies | 2 | "OVDS Demo Company" + "Selam Trading PLC" |
| Departments | 5 | HR, ovds, Operations, IT, Management |
| Shifts | 2 | Morning (08:00–17:00), Evening (14:00–22:00) |
| Users | 8 | One per role (see Default Login Credentials) |
| Employees | 5 | Linked to demo company |
| Holidays | 12 | Ethiopian public holidays for current year |
| Tax Rates | 4 | VAT 15%, BIT 30%, WHT 2% (services), WHT 2% (goods) |
| Chart of Accounts | ~40 | Standard Ethiopian accounts |

### `npm run seed-demo` — Extended Demo Data

Creates additional demo data:
- 20+ employees with varied salaries and departments
- 3 months of payroll records
- 10+ invoices (mix of PAID, PENDING, OVERDUE)
- 5+ bills
- Bank accounts with transactions
- VAT filings for last 3 months
- DRRF contributions

### `npm run seed-all`

Runs both `seed` and `seed-demo` sequentially.

### Resetting the Database

```bash
npm run db:reset    # Drop + recreate all tables + reseed
# WARNING: Destroys all data. Dev only.
```

---

## Logging & Monitoring

### Request Logging

`RequestLoggerMiddleware` logs all HTTP requests:
```
[HTTP] GET /api/invoices?companyId=abc 200 45ms
[HTTP] POST /api/auth/login 401 12ms
[HTTP] DELETE /api/invoices/xyz 403 8ms
```

Applied globally in `AppModule.configure()`. Output goes to stdout (captured by Docker/PM2).

### Audit Logging

`AuditLogService.log(userId, action, details?)` records all write operations:

```typescript
await this.auditLog.log(userId, 'INVOICE_CREATED', {
  invoiceId: invoice.id,
  amount: invoice.totalAmount,
  companyId: invoice.companyId,
});
```

**Storage:** `AuditLog` Prisma model. Indexed on `userId` and `companyId`.
**Retention:** 90 days (cleaned by `CleanupService.cleanupOldLogs(90)`).
**SIEM:** If `SIEM_WEBHOOK_URL` is set, every audit event is POSTed to the webhook.
**Export:** `GET /audit-logs/export` → CSV (requires `audit_logs:write`).

### Client-Side Audit Logging

```typescript
const { log, logDenied, logExport } = useAuditLog();

log('INVOICE_DELETED', { invoiceId: id, amount: 5000 }, 'Invoice', id);
logDenied('payroll:approve', '/payroll-administration');
logExport('Invoice', 'csv', 150);
```

Posts to `POST /audit-logs/client` with `x-background: 1` (no toast on failure).

### Backend Log Output

```bash
# View live logs (Docker)
docker-compose logs -f api

# View log file (non-Docker)
tail -f backend-out.log
```

### Error Monitoring

All unhandled exceptions are caught by `AllExceptionsFilter` and logged with:
- `statusCode`, `timestamp`, `path`, `message`, `error`
- Stack trace in development (`NODE_ENV !== 'production'`)

---

## Biometrics Service (`BiometricsService`)

The Biometrics Service manages employee biometric template registration and verification for attendance check-in. It is a **simulation** — production deployments require a real hardware SDK.

### Verification (1:N Matching)

`verify(template, type)` does an **exact string match** against `BiometricData.template` — this is a simulation. Real hardware SDKs (ZKTeco, Suprema, etc.) provide a `search`/`identify` function for 1:N matching.

Returns the matched `Employee` (with `shift` included) or throws `BadRequestException('Biometric match not found')`.

### Registration

`register(employeeId, type, template)` stores the raw template string. No deduplication — multiple templates per employee per type are allowed (e.g. both index fingers).

### BiometricType Enum

| Type | Use Case |
|------|---------|
| `FINGERPRINT` | Most common — fingerprint scanner |
| `FACE` | Face recognition camera |
| `IRIS` | Iris scanner |
| `CARD` | RFID/NFC card (template = card ID string) |

> Note: `AttendanceMethod` enum has different values: `MANUAL`, `BIOMETRIC`, `KIOSK`, `MOBILE`, `QR_CODE`, `SYSTEM`

### Production Integration Notes

To integrate a real biometric device:
1. Replace `verify()` with the SDK's `identify(template)` call — returns matched employee ID
2. Replace `register()` with the SDK's `enroll(employeeId, template)` call
3. The `BiometricData.template` field stores whatever string the SDK returns (base64, hex, etc.)
4. Ensure the device SDK is accessible from the NestJS server (USB, network, or API)

---

## Onboarding Service (`OnboardingService`)

The Onboarding module handles the company setup questionnaire for new OVDS customers. It collects business information, sends confirmation emails, and tracks review status.

**Navigate to:** Administration → Onboarding Admin (requires `onboarding:write`)

**Company Setup Wizard** (frontend): Press `W` on any page, or go to Settings → Companies → Add Company. The wizard guides through departments, shifts, and initial employees.

### Submission Flow

1. Creates `OnboardingResponse` record with all questionnaire fields
2. Sends confirmation email to client via `EmailService.sendTemplate()` with `{{variable}}` substitution
3. Sends internal alert to `ADMIN_EMAIL` env var (fallback: `admin@ovds.com.et`)

### OnboardingResponse Lifecycle

`PENDING` → `IN_REVIEW` → `COMPLETED` / `REJECTED`

### Questionnaire Fields

Key fields collected during onboarding:
- Business name, type (`BusinessType`), TIN (15 chars), address
- Number of employees (determines plan recommendation)
- Primary use case: payroll, invoice, VAT, or full ERP
- Contact email, phone
- Fiscal year start month (default: 7 — July)

### Key Operations

| Method | Description |
|--------|-------------|
| `create(dto)` | Submit questionnaire + send emails |
| `findAll(status?)` | List all responses, optionally filtered by status |
| `updateStatus(id, status)` | Advance lifecycle state |
| `updateNotes(id, notes, assignedTo?)` | Add internal notes + assign reviewer |
| `getStats()` | Count by status: total, pending, inReview, completed, rejected |
| `bulkUpdateStatus(ids, status)` | Batch status change |
| `bulkDelete(ids)` | Batch delete |
| `exportCsv()` | Full CSV export with all questionnaire fields |
| `sendEmail(id, to, subject, body)` | Ad-hoc email to client |

### Auto-Wizard Trigger

`Layout.tsx` auto-opens the Company Setup Wizard once per session for `ADMIN` users with zero companies. Dismissed state stored in `sessionStorage` under `wizard_auto_dismissed`.

---

## Audit Outsourcing Service (`AuditOutsourcingService`)

The Audit Outsourcing module manages relationships with external audit firms, engagement lifecycles, findings, and compliance certificates. Required for Tier 1 IFRS entities (statutory audit obligation).

### Engagement Lifecycle

```
CONSULTATION → PLANNING → FIELDWORK → REPORTING → FOLLOWUP → COMPLETED
```

`advanceEngagement(id)` moves to the next step automatically.

### Engagement Types

Common engagement types tracked in OVDS:
- `STATUTORY_AUDIT` — annual statutory audit (required for Tier 1 IFRS entities)
- `TAX_AUDIT` — ERCA/MoR tax compliance audit
- `INTERNAL_AUDIT` — internal controls review
- `SPECIAL_PURPOSE` — specific scope audit (e.g. loan application, investment due diligence)

### Finding Severity / Status

| Severity | Status | Action Required |
|----------|--------|----------------|
| `LOW` | `OPEN` / `IN_PROGRESS` / `RESOLVED` | Monitor |
| `MEDIUM` | `OPEN` / `IN_PROGRESS` / `RESOLVED` | Address within 90 days |
| `HIGH` | `OPEN` / `IN_PROGRESS` / `RESOLVED` | Address within 30 days |
| `CRITICAL` | `OPEN` / `IN_PROGRESS` / `RESOLVED` | Immediate action; blocks compliance certificate |

### Compliance Certificate

`generateComplianceCertificate(id)` — only for `COMPLETED` engagements. Returns PDF `Buffer` via `jsPDF`.
- `FULLY COMPLIANT` if no open CRITICAL findings
- `COMPLETED WITH N OPEN CRITICAL FINDINGS` otherwise
- Certificate ID: `COMP-{first 8 chars of engagement ID}`

> Compliance certificates are used for bank loan applications, investor due diligence, and ERCA audit responses.

### PDF Export

`generateEngagementPdf(id)` generates a full engagement report PDF with: overview table, scope, findings table, report summary, page numbers.

### Analytics Response

`getAnalytics()` returns: `byStatus`, `byType`, `findingsBySeverity`, `findingsByStatus`, `totalBudget`, `totalActual`, `monthlyTrend` (6 months)

### Stats Response

`getStats()` returns: `firms`, `totalEngagements`, `active`, `completed`, `overdue`, `openFindings`, `criticalFindings`

### File Attachments

Engagements and findings support file attachments via `FileAttachment` model:
- `attachableType: 'AuditEngagement'` — engagement-level documents (scope letter, management letter)
- `attachableType: 'AuditFinding'` — finding-level evidence (screenshots, supporting docs)

### RBAC

| Permission | Who Has It |
|-----------|-----------|
| `audit_outsourcing:read` | `AUDITOR`, `ovds`, `ADMIN`, `SPURADMIN` |
| `audit_outsourcing:write` | `ovds`, `ADMIN`, `SPURADMIN` |

---

## Email Service (`EmailService`)

Configured via environment variables:

| Env Var | Default | Purpose |
|---------|---------|---------|
| `MAIL_HOST` | `smtp.mailtrap.io` | SMTP server |
| `MAIL_PORT` | `2525` | SMTP port |
| `MAIL_SECURE` | `false` | TLS (`true`/`false`) |
| `MAIL_USER` | — | SMTP username (required — skips silently if not set) |
| `MAIL_PASS` | — | SMTP password |
| `MAIL_FROM_NAME` | `ovds ovds` | Sender display name |
| `MAIL_FROM_ADDRESS` | `noreply@ovds.com.et` | Sender email |
| `ADMIN_EMAIL` | `admin@ovds.com.et` | Internal alert recipient |

### Template Rendering

`sendTemplate(to, subject, bodyTemplate, variables)` replaces `{{variableName}}` placeholders. Missing variables render as `{{variableName}}` (not blank).

> If `MAIL_USER` is not set, all emails are silently skipped with a log entry — no errors thrown.

---

## Prisma Schema — Key Enums

| Enum | Values |
|------|--------|
| `AccountType` | `ASSET`, `LIABILITY`, `EQUITY`, `INCOME`, `EXPENSE` |
| `AccountCategory` | `CASH`, `BANK`, `ACCOUNTS_RECEIVABLE`, `ACCOUNTS_PAYABLE`, `INVENTORY`, `FIXED_ASSET`, `CURRENT_ASSET`, `CURRENT_LIABILITY`, `LONG_TERM_LIABILITY`, `EQUITY`, `REVENUE`, `OTHER_INCOME`, `OPERATING_EXPENSE`, `COST_OF_GOODS_SOLD`, `OTHER_EXPENSE` |
| `AttendanceMethod` | `MANUAL`, `BIOMETRIC`, `KIOSK`, `MOBILE`, `QR_CODE`, `SYSTEM` |
| `AttendanceStatus` | `PRESENT`, `LATE`, `ABSENT`, `HALF_DAY` |
| `BiometricType` | `FINGERPRINT`, `FACE`, `IRIS`, `CARD` |
| `BusinessType` | `MANUFACTURING`, `LARGE_ENTERPRISE`, `MEDIUM_ENTERPRISE`, `SMALL_BUSINESS`, `FREELANCER`, `GOVERNMENT` |
| `ContributionCategory` | `LOAN_VALUE`, `INSURANCE_PREMIUM`, `SERVICE_FEES`, `AIRTIME_SALES`, `TICKET_SALES`, `ANNUAL_SALES_REVENUE`, `FUEL_SALES`, `TOBACCO_ALCOHOL`, `GOVERNMENT_SERVICES`, `GOVERNMENT_BUDGET`, `SALARY_CONTRIBUTION`, `CONTRABAND_PROCEEDS`, `OTHER` |
| `ContributionStatus` | `PENDING`, `REMITTED`, `OVERDUE`, `PAID`, `ARCHIVED` |
| `InvestmentType` | `EQUITY`, `DEBT`, `GRANT`, `VENTURE_CAPITAL`, `ANGEL`, `GOVERNMENT`, `OTHER` |
| `InvestmentStatus` | `PROSPECTING`, `NEGOTIATING`, `COMMITTED`, `ACTIVE`, `EXITED` |
| `InvoiceStatus` | `DRAFT`, `PENDING`, `PAID`, `OVERDUE`, `CANCELLED` |
| `BillStatus` | `DRAFT`, `PENDING`, `PAID`, `OVERDUE`, `CANCELLED` |
| `LeaveStatus` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `LeaveType` | `ANNUAL`, `SICK`, `MATERNITY`, `PATERNITY`, `UNPAID`, `EMERGENCY`, `OTHER` |
| `LoanType` | `TERM_LOAN`, `OVERDRAFT`, `WORKING_CAPITAL`, `EQUIPMENT_FINANCING`, `MORTGAGE`, `OTHER` |
| `LoanStatus` | `APPLIED`, `UNDER_REVIEW`, `APPROVED`, `DISBURSED`, `ACTIVE`, `CLOSED`, `REJECTED` |
| `PayrollStatus` | `GENERATED`, `VERIFIED`, `FINALIZED`, `APPROVED`, `PAID` |
| `VatFilingStatus` | `DRAFT`, `COMPUTED`, `REVIEWED`, `SUBMITTED`, `ACKNOWLEDGED` |
| `PartnershipStatus` | `ACTIVE`, `INACTIVE`, `DISSOLVED`, `PENDING` |
| `CollectionStage` | `ASSIGNED`, `CONTACTED`, `PROMISE_TO_PAY`, `ESCALATED`, `LEGAL`, `CLOSED` |
| `EngagementStatus` | `CONSULTATION`, `PLANNING`, `FIELDWORK`, `REPORTING`, `FOLLOWUP`, `COMPLETED` |
| `FindingSeverity` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `FindingStatus` | `OPEN`, `IN_PROGRESS`, `RESOLVED` |
| `OnboardingStatus` | `PENDING`, `IN_REVIEW`, `COMPLETED`, `REJECTED` |
| `TaxType` | `VAT`, `INCOME_TAX`, `WITHHOLDING`, `DRRF`, `SALES_TAX`, `CUSTOM` |
| `RecurringInterval` | `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY` |
| `PaymentSource` | `CASH`, `BANK_TRANSFER`, `TELECOM`, `CHEQUE`, `MOBILE_BANKING`, `CREDIT_CARD` |
| `HolidayType` | `PUBLIC`, `COMPANY` |
| `DepreciationMethod` | `STRAIGHT_LINE`, `DECLINING_BALANCE`, `UNITS_OF_PRODUCTION` |
| `FixedAssetStatus` | `ACTIVE`, `DISPOSED`, `FULLY_DEPRECIATED` |
| `PurchaseOrderStatus` | `DRAFT`, `SUBMITTED`, `APPROVED`, `RECEIVED`, `BILLED`, `CLOSED`, `REJECTED` |
| `ReimbursementStatus` | `PENDING`, `APPROVED`, `PAID`, `REJECTED` |
| `LoanRequestStatus` | `PENDING`, `APPROVED`, `DISBURSED`, `CLOSED` |
| `OtherPaymentStatus` | `PENDING`, `APPROVED`, `PAID` |
| `CampaignStatus` | `DRAFT`, `SENT` |
| `BatchStatus` | `PENDING`, `PROCESSING`, `PAID`, `FAILED` |
| `TransactionStatus` | `PENDING`, `RECONCILED` |
| `TransactionType` | `CREDIT`, `DEBIT` |
| `KycStatus` | `PENDING`, `VERIFIED`, `REJECTED` |
| `NotificationType` | Various — `LEAVE_APPROVED`, `LEAVE_REJECTED`, `PAYROLL_GENERATED`, `INVOICE_SENT`, etc. |

### Key Model Indexes

Performance-critical indexes defined in schema:

| Model | Indexed Fields |
|-------|---------------|
| `Attendance` | `employeeId`, `checkIn` |
| `AuditLog` | `userId`, `companyId` |
| `Bill` | `vendorId`, `status`, `companyId`, `dueDate` |
| `BusinessLoan` | `customerId`, `partnershipId`, `status` |
| `Customer` | `companyId`, `kycStatus` |
| `DisasterFundContribution` | `category`, `period`, `status` |
| `Employee` | `companyId`, `departmentId`, `shiftId` |
| `Invoice` | `customerName`, `date`, `status`, `companyId`, `dueDate`, `shareToken`, `recurringNextDate`, `scheduledSendAt` |
| `InvoicePayment` | `invoiceId`, `reference`, `telecomRef` |
| `JournalEntry` | `companyId`, `date`, `reference` |
| `JournalLine` | `accountId`, `journalEntryId` |
| `FileAttachment` | `attachableType`, `attachableId` (composite) |
| `PayrollRecord` | `employeeId`, `year`, `month` |
| `VatFiling` | `companyId`, `period` |
| `BankTransaction` | `bankAccountId`, `status`, `date` |

### User Model — Key Fields

| Field | Purpose |
|-------|---------|
| `auth0Id` | Links to Auth0 SSO identity |
| `mfaEnrolled` | Whether user has Auth0 MFA factor |
| `failedLoginAttempts` | Incremented on failed login; triggers lock after 5 |
| `lockedUntil` | Account lock expiry (set by `unlockUser`) |
| `lastLoginAt` | Updated on successful login |
| `employeeId` | Links User to Employee record (unique) |
| `companyId` | Tenant isolation |
| `role` | `AppRole` enum — single role per user |

### Company Model — Key Fields

| Field | Purpose |
|-------|---------|
| `name` | Company display name |
| `legalName` | Legal registered name |
| `tin` | Tax Identification Number (15 chars) — required for VAT invoices |
| `businessType` | `BusinessType` enum — determines IFRS tier |
| `address`, `phone`, `email` | Contact details |
| `currency` | Default `ETB` |
| `fiscalYearStart` | Month number (default: 7 = July) |
| `vatRate` | Default 15% |
| `logoUrl` | Company logo for invoices/payslips |

---

## Collections Service (`CollectionsService`)

The Collections module manages overdue invoice recovery — from initial assignment through legal escalation to closure.

### Collection Case Lifecycle

```
ASSIGNED → CONTACTED → PROMISE_TO_PAY → ESCALATED → LEGAL → CLOSED
```

When a case is closed and the invoice is fully paid, the invoice status is automatically updated to `PAID`.

### Creating a Collection Case

A collection case is created when an invoice becomes overdue and requires active follow-up. Link the case to the overdue invoice and assign to a collections agent.

### Collections Dashboard

`getCollectionsDashboard()` returns:
- `openCases` — cases not in CLOSED stage
- `overduePromises` — PROMISE_TO_PAY cases where `promiseDate < now`
- `agingSummary` — count by stage (via `groupBy`)
- `dsoDays` — Days Sales Outstanding (30-day trailing: `(collected/sales) × 30`)

### Case Response Shape

Each case includes computed fields:
- `agingDays` — days since invoice due date
- `balanceDue` — `totalAmount − sum(payments)`
- `promiseStatus` — `OVERDUE` / `ACTIVE` / `NONE`

### Deduction Model

`Deduction` tracks invoice adjustments (discounts, write-offs, disputes) with `DeductionStatus` and `DeductionReason` enums.

### RBAC

| Permission | Who Has It |
|-----------|-----------|
| `ovds:read` | `ovds`, `ACCOUNTING`, `ADMIN` — view collections |
| `ovds:write` | `ovds`, `ADMIN` — create/update cases |
| `ovds:approve` | `ovds` — approve write-offs and deductions |

---

## Treasury Service (`TreasuryService`)

The Treasury module provides 30/60/90-day cash flow forecasting and bulk payment batch management.

### Cash Forecast Generation

`generateCashForecast(period)` auto-calculates:

```
currentCash      = sum(bankAccount.balance)
expectedInflows  = AR.current × 0.8 + AR.days30 × 0.6 + recurringRevenue × 1.1
expectedOutflows = AP.current × 0.9 + AP.days30 × 0.7
projected        = currentCash + expectedInflows − expectedOutflows
volatility       = |inflows − outflows| × 0.2
confidence       = 75%
```

Upserts `CashForecast` by `period` (e.g. `2026-01`). Returns `{ projected, low, high, confidence }`.

Navigate to **Business → Treasury Forecast** to view the `CashForecastChart` with 30/60/90-day projections.

### Payment Batch

`PaymentBatch` groups multiple invoice/bill payments for bulk bank upload.

| Field | Description |
|-------|-------------|
| `type` | `ACCOUNTS_RECEIVABLE` (money in) or `ACCOUNTS_PAYABLE` (money out) |
| `status` | `BatchStatus` enum |
| `totalAmount` | Sum of all item amounts |
| `exportedAt` | Set when batch is exported to CSV |
| `exportFormat` | `CSV` |

When batch status is set to `PAID`, `exportPaymentBatch()` is called automatically — generates CSV via `papaparse` with columns: `InvoiceID`, `BillID`, `Amount`, `Type` (IN/OUT).

**Use case:** Export a payment batch CSV and upload directly to CBE, Awash, or Dashen internet banking for bulk salary/vendor payments.

---

## App Store Service (`AppstoreService`)

The App Store is an extension marketplace for optional OVDS modules and integrations.

Navigate to **Administration → App Store** (requires `apps:read`).

### App Model

| Field | Description |
|-------|-------------|
| `slug` | Auto-generated from name (`name.toLowerCase().replace(/\s+/g, '-')`) |
| `rating` | Computed average — updated on every new review |
| `downloads` | Incremented via `incrementDownload(appId)` |
| `isActive` | Only active apps returned in `findAll()` |

### App Lifecycle

1. Browse / search in App Store
2. Click **Install** (or **Purchase** for paid apps) — `downloads` increments
3. Follow app-specific setup instructions
4. To uninstall: App Store → Installed → Uninstall (data is **not** deleted)

### Review System

`Review` model uses polymorphic `entityType` + `entityId` fields. For apps: `entityType: 'APP'`, `entityId: appId`.

`createReview()` creates the review then calls `updateRating()` to recompute the app's average rating (1–5 stars).

### RBAC

| Permission | Who Has It |
|-----------|-----------|
| `apps:read` | All roles except `CLIENT`, `PARTNER` |
| `apps:write` | `ADMIN`, `SPURADMIN` |

---

## Partnership Service (`PartnershipService`)

The Partnership module tracks business partnerships, their credibility for Ethiopian bank loan applications, investments, and customer relationships. It is the backbone of the **Business Credibility Score** shown on the dashboard.

### Partnership Statuses

`ACTIVE` → `INACTIVE` → `DISSOLVED` | `PENDING`

### Credibility Score Algorithm

Ethiopian banks evaluate businesses on 3 pillars. Score is computed from `Partnership` data:

| Pillar | Max Points | Criteria |
|--------|-----------|---------|
| Org Structure | 40 | TIN (+10), license (+10), members > 0 (+10), ACTIVE status (+10) |
| Customer Relationships | 35 | `min(35, linkedCustomers × 7)` |
| Financial Transparency | 25 | agreementRef (+10), description (+5), contactEmail/Phone (+10) |

Max score: 100. Returned on every `getPartnerships()` and `getPartnership()` call.

> **Why this matters:** Ethiopian banks (CBE, Awash, Dashen) use credibility scores to assess loan eligibility. A score ≥ 70 significantly improves approval chances for `WORKING_CAPITAL` and `TERM_LOAN` applications.

### Business Loan Credit Score

`overallCreditScore = round(orgScore × 0.4 + custScore × 0.35 + finScore × 0.25)`

Computed automatically on create/update from the three Ethiopian bank pillar scores.

### Business Loan Types

| `LoanType` | Use Case |
|-----------|---------|
| `TERM_LOAN` | Fixed-term financing for equipment, expansion |
| `OVERDRAFT` | Short-term working capital buffer |
| `WORKING_CAPITAL` | Day-to-day operational financing |
| `EQUIPMENT_FINANCING` | Machinery, vehicles, production equipment |
| `MORTGAGE` | Property / real estate financing |
| `OTHER` | Government grants, cooperative loans |

### Business Loan Lifecycle

```
APPLIED → UNDER_REVIEW → APPROVED → DISBURSED → ACTIVE → CLOSED
                                              ↘ REJECTED
```

### Loan Repayment Rules

- Loan must be `ACTIVE` or `DISBURSED` to accept repayment
- Repayment amount must be `> 0` and `≤ outstandingBalance`
- When `newBalance < 0.01` → loan auto-closes (`status: CLOSED`)
- `totalRepaid` incremented and `outstandingBalance` decremented atomically in `$transaction`
- DRRF levy (1% of `disbursedAmount`) auto-generated on disbursement via `LOAN_VALUE` category

### Investment Types

| `InvestmentType` | Description |
|-----------------|-------------|
| `EQUITY` | Equity stake from investor |
| `DEBT` | Debt financing |
| `GRANT` | Government or NGO grant (non-repayable) |
| `VENTURE_CAPITAL` | VC fund investment |
| `ANGEL` | Angel investor |
| `GOVERNMENT` | Government development fund |
| `OTHER` | Other investment types |

### Investment Lifecycle

```
PROSPECTING → NEGOTIATING → COMMITTED → ACTIVE → EXITED
```

### Customer 360 View

`getCustomer360(customerId)` computes and persists `creditScore` + `loyaltyTier`:

| Tier | Score Range |
|------|------------|
| PLATINUM | ≥ 80 |
| GOLD | ≥ 60 |
| SILVER | ≥ 40 |
| BRONZE | < 40 |

Credit score formula:
```
creditScore = min(50, paymentRate × 0.5)     ← payment behaviour
            + min(20, interactions × 2)       ← CRM depth
            + min(20, partnershipLinks × 5)   ← partnership links
            + round(loanRepayRate × 10)        ← loan history
```

Returns: customer data, invoice summary, 6-month revenue trend, interactions, partnerships, loans, investments.

### Credibility Dashboard

`getCredibilityDashboard()` returns:
- `summary`: totalPartnerships, activePartnerships, avgCredibilityScore, totalCustomers, totalLoans, totalLoanApplied/Approved/Outstanding, avgCreditScore, totalInvestments, totalInvestmentAmount
- `loansByStatus`, `investmentsByStatus` — count maps
- `topCustomers` — top 5 by interaction count
- `recentLoans`, `recentInvestments` — last 5 each

### Partnership Members

`PartnershipMember` tracks individual members of a partnership:

| Field | Description |
|-------|-------------|
| `role` | Member's role in the partnership |
| `ownershipPct` | Ownership percentage |
| `contribution` | Capital or asset contribution |

Members count (`members > 0`) contributes +10 to the Org Structure pillar score.

---

## Tax Service (`TaxService`)

The Tax Service orchestrates VAT reconciliation, Business Income Tax, DRRF levies, compliance scoring, and eTax portal submissions. It is the central compliance engine for ERCA obligations.

### Tax Filing Calendar

| Tax | Frequency | Deadline | Portal | Permission |
|-----|-----------|---------|--------|-----------|
| VAT | Monthly | 30th of following month | eTax / SIGTAS | `vat:file` (ovds) |
| Withholding VAT | Monthly | 30th of following month | eTax | `vat:file` (ovds) |
| DRRF | Quarterly | 15th of last month of quarter | EDRRFO / CBE | `disaster_fund:write` (ovds) |
| Business Income Tax | Annual | Within 4 months of FY end (Nov 7) | MoR office | `bit:file` (ovds) |
| Personal Income Tax | Monthly (via payroll) | Same as payroll cycle | eTax | `payroll:approve` (ovds) |
| Pension | Monthly | Same as payroll cycle | Pension Authority | `payroll:approve` |

### VAT Reconciliation

`getVatReconciliation(period)` — period format: `YYYY-MM`

```
outputVat = SUM(invoice.vatAmount) WHERE status=PAID AND date in period
inputVat  = SUM(bill.vatAmount)    WHERE status=PAID AND updatedAt in period
netPayable = max(0, outputVat − inputVat)
```

### VAT Filing Auto-Post

`recordVatFiling()` calls `AccountingService.autoPostVatFiling()` which creates journal entries:
```
Debit:  VAT Payable (output)  = outputVat
Credit: VAT Receivable (input) = inputVat
Credit: Cash                   = netPayable
```

### Business Income Tax

`calculateIncomeTax(year)` uses `getProfitAndLoss(year-01-01, year-12-31)`:
```
taxPayable = max(0, netProfit × 30%)
```
Auto-posts income tax provision journal entry via `autoPostIncomeTaxFiling()`.

### DRRF Levy Calculation

`calculateDRRLevies(period)` scans real data:

| Category | Source | Rate |
|----------|--------|------|
| Digital Banking/Telecom | Invoices with `notes contains 'digital'` | 5% |
| Loans | `BusinessLoan.disbursedAmount` where `status=DISBURSED` in period | 1% |
| Flat Fees | Invoices with `notes contains 'flight'` | ETB 150 avg |

### Tax Dashboard Response

`getTaxDashboard(year?)` returns: `vatCurrent`, `drrfCurrent`, `incomeTaxDue`, `drrfPendingYear`, `overdueVat`, `overdueDrrf`, `nextDue` (VAT: 25th of next month, DRRF: 15th of last month of quarter), `complianceScore`

### Compliance Score Formula

```
vatScore    = min(1, vatFiled/monthsElapsed) × 50
drrfScore   = min(1, drrfRemitted/quartersElapsed) × 30
payrollScore = payrollApproved > 0 ? 20 : 0
total = round(vatScore + drrfScore + payrollScore)
```

### Live Compliance Checklist

`getComplianceStatus()` returns 10 checklist items with `OK` / `WARNING` / `CRITICAL` / `PENDING` status:

| ID | Label | Module |
|----|-------|--------|
| `einvoice` | e-Invoice QR on every invoice | VAT |
| `etax` | eTax portal account active | VAT |
| `monthly` | Monthly VAT return filing | VAT |
| `reverse` | Reverse-charge for digital services | VAT |
| `annual` | Annual VAT reconciliation | VAT |
| `pit` | PIT brackets in payroll | Payroll |
| `pension` | Pension 7%/11% configured | Payroll |
| `disaster` | DRRF levies tracked | Disaster Fund |
| `bit` | BIT declaration ready (30%, by Nov 7) | Tax |
| `audit` | Audit trail immutable | Audit |

### eTax Payload Validation

TIN must be exactly 15 characters. Tax amount must be positive. Returns `{ valid, errors[] }`.

### Withholding Tax

`getWithholdingReport(period)` — 2% WHT on service payments ≥ ETB 500 and goods payments ≥ ETB 10,000.

---

## OCR Service (`OcrService`)

### Providers

| Env Var | Model | Priority |
|---------|-------|---------|
| `OPENAI_API_KEY` | `gpt-4o` (high detail) | First |
| `GEMINI_API_KEY` | `gemini-1.5-flash` | Fallback |

If neither is set → `BadRequestException('No OCR provider configured')`.

### Bank Statement OCR (`extractFromImage`)

Extracts transactions from bank statement images. Returns `OcrResult`:

```typescript
{
  transactions: [{
    date: 'YYYY-MM-DD',
    description: string,
    amount: number,        // always positive
    type: 'CREDIT'|'DEBIT',
    reference?: string,
    confidence: number,    // 0–1
  }],
  bankName?, accountNumber?, statementPeriod?,
  provider: 'openai'|'gemini'
}
```

Supported banks: CBE, Awash, Dashen, Abyssinia, and other Ethiopian banks.

### Invoice OCR (`extractInvoiceFromImage`)

Extracts structured invoice data. Returns `InvoiceOcrResult` with all invoice fields including:
- `items[]` — line items with description, quantity, unitPrice, discount, total
- `customerTin`, `vendorTin` — Ethiopian TIN numbers
- `telecomRef` — Ethio Telecom payment reference
- `confidence` — 0–1 (1.0 = clearly readable)
- `currency` — defaults to ETB

JSON parsing is fault-tolerant: strips markdown code fences, falls back to regex extraction.

---

## Cleanup Scheduler (`CleanupScheduler`)

### Cron Jobs

| Schedule | Trigger | Action |
|----------|---------|--------|
| `EVERY_DAY_AT_MIDNIGHT` | Daily | `CleanupService.fullCleanup()` |
| `0 0 15,25 * *` | 15th & 25th monthly | Archive DRRF contributions > 3 months old; warn on overdue |

### DRRF Monthly Cleanup

Archives `DisasterFundContribution` records where:
- `period < 3 months ago`
- `status NOT IN (PAID, ARCHIVED)`

Sets status to `ARCHIVED`. Logs warning if any contributions are still `PENDING` past due date.

---

## ovds Controller — Additional Endpoints

Key endpoints not covered elsewhere:

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/ovds/invoices/share/:token` | Public | Client portal — view invoice by share token |
| `POST` | `/ovds/invoices/:id/share` | ovds | Generate `shareToken` for public invoice link |
| `POST` | `/ovds/invoices/ocr-extract` | ovds | Extract invoice data from image via OCR (GPT-4o/Gemini) |
| `POST` | `/ovds/invoices/:id/send-reminder` | ovds | Send payment reminder email for overdue invoice |
| `POST` | `/ovds/invoices/:id/duplicate` | ovds | Duplicate invoice with new number |
| `POST` | `/ovds/invoices/flag-overdue` | ovds | Auto-flag overdue invoices |
| `POST` | `/ovds/items/:id/adjust-stock` | ovds | Adjust stock with audit trail |
| `GET` | `/ovds/invoices/telecom-receipt/:ref` | ovds | Proxy fetch Ethio Telecom receipt |
| `POST` | `/ovds/tax-rates/seed-et` | ADMIN | Seed default Ethiopian tax rates (VAT 15%, Income 30%, WHT 2%) |
| `POST` | `/ovds/accounts/seed` | ovds | Seed default Ethiopian chart of accounts |
| `GET` | `/ovds/currency-rates/convert` | ovds | Convert amount between currencies |
| `GET` | `/ovds/companies/:id/activity` | ovds | Recent audit logs for a company |

### Invoice Share Token

`Invoice.shareToken` is a unique UUID. `GET /ovds/invoices/share/:token` is public (no auth required) — used by `ClientPortal` page for external customer access.

---

## Health Service (`HealthService`)

### `GET /api/health/detailed`

Returns `HealthStatus`:

```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  timestamp: string,
  apiVersion: '2.0.0',
  dbConnection: 'OK' | 'ERROR',
  uptime: number,           // process.uptime() in seconds
  cleanupStats: {
    pendingExpiredCache: number,   // TelecomReceiptCache expired entries
    recentAttendance: number,      // attendance in last 30 days
    auditLogsCount: number,
  },
  ovdsSummary: { ar, ap, cash, netPosition, revenue, expenses, netProfit, overdueInvoices, pendingBills },
  healthScore: { overall, grade, components },
  services: { prisma, accounting, cleanup },
}
```

### Status Determination

- `healthy` — financial health grade A or B, OR (cash > AP × 10% AND netProfit > 0)
- `degraded` — ovds data unavailable or below thresholds
- `unhealthy` — exception thrown during health check

### Manual Cleanup Trigger

`POST /api/health/cleanup` → calls `CleanupService.fullCleanup()` and returns results.

---

## Cleanup Service (`CleanupService`)

### `fullCleanup()` — runs all 4 tasks in parallel

| Task | Method | Action |
|------|--------|--------|
| Log cleanup | `cleanupOldLogs(90)` | Delete `AuditLog` + `DisasterFundAuditLog` older than 90 days |
| Cache cleanup | `cleanupExpiredCache()` | Delete `TelecomReceiptCache` where `expiresAt < now` |
| Report archival | `archiveOldReports(90)` | Set `DisasterFundReport.status = ARCHIVED` for records > 90 days |
| Duplicate detection | `detectDuplicates()` | Raw SQL: find employees with > 1 attendance per day in last 30 days |

Returns: `{ logs, cache, reports, duplicates }` counts.

---

## Tax Rate Service (`TaxRateService`)

### Default Ethiopian Rates (seeded via `POST /ovds/tax-rates/seed-et`)

| Name | Rate | Type | Legal Basis |
|------|------|------|-------------|
| VAT Standard Rate | 15% | VAT | Proclamation No. 1341/2024 |
| Business Income Tax | 30% | CUSTOM | Proclamation No. 1395/2025 |
| Withholding Tax - Services | 2% | WITHHOLDING | ≥ ETB 500 |
| Withholding Tax - Goods | 2% | WITHHOLDING | ≥ ETB 10,000 |

Seed is idempotent — existing rates are preserved, only missing ones are created.

### `calculateTaxes(items)` 

Calculates tax per line item. Falls back to 15% VAT if no `taxRateId` provided.

### `TaxRate.appliesTo`

Stored as JSON string array: `['INVOICE', 'BILL', 'ITEM']`. Parsed on read.

---

## Attachment Service (`AttachmentService`)

### Supported `attachableType` Values

`TaxRate`, `Invoice`, `Bill`, `JournalEntry`, `AuditEngagement`, `AuditFinding`

### Storage

`FileAttachment.fileData` stores base64-encoded file content as `LongText`. No external storage — all in DB.

### Query Pattern

```typescript
// Get all attachments for an entity
GET /ovds/attachments/:attachableType/:attachableId

// Upload
POST /ovds/attachments
{ filename, mimeType, fileSize, fileData (base64), attachableId, attachableType, description }
```

---

## Prisma Schema — Additional Models

### `TelecomReceiptCache`

Caches Ethio Telecom payment receipt lookups. `expiresAt` controls TTL. Cleaned daily by `CleanupService`.

| Field | Purpose |
|-------|---------|
| `ref` | Unique telecom reference number |
| `payload` | Raw API response (LongText) |
| `parsedJson` | Parsed structured data |
| `expiresAt` | Cache expiry — cleaned by `CleanupService` |

### `PayrollRecord` — Full Field List

| Field | Type | Description |
|-------|------|-------------|
| `employeeId` + `year` + `month` + `type` | Unique | Prevents duplicate payroll records |
| `grossPay` | Decimal | Attendance-based gross (before OT) |
| `otPay` | Decimal | Overtime pay |
| `grossTotal` | Decimal | `grossPay + otPay` |
| `incomeTax` | Decimal | PIT computed via `calcEthiopianPIT()` |
| `employeePension` | Decimal | 7% of grossTotal |
| `employerPension` | Decimal | 11% of grossTotal |
| `loanDeduction` | Decimal | Monthly loan repayment |
| `totalDeductions` | Decimal | `incomeTax + employeePension + loanDeduction` |
| `netPay` | Decimal | `grossTotal − totalDeductions` |
| `workedDays` / `presentDays` | Int | Attendance-based |
| `absentDays` | Int | `workingDays − presentDays` |
| `otHours` | Decimal | Total overtime hours |
| `status` | String | GENERATED → VERIFIED → FINALIZED → APPROVED → PAID |
| `approvedBy` / `approvedAt` | String/DateTime | Set on approval |

### `VatFiling` — Full Field List

| Field | Description |
|-------|-------------|
| `period` | Unique `YYYY-MM` string |
| `outputVat` | Total output VAT collected |
| `inputVat` | Total input VAT paid |
| `netPayable` | `outputVat − inputVat` |
| `collected` | Alias for outputVat (used by TaxService) |
| `paid` | Amount actually paid to ERCA |
| `status` | DRAFT → FILED → PAID |
| `filedAt` | Submission timestamp |
| `dueDate` | Filing deadline (25th of following month) |
| `eTaxReference` | ERCA portal reference number |

### `IncomeTaxFiling` — Full Field List

| Field | Description |
|-------|-------------|
| `fiscalYear` | Unique year (e.g. 2026) |
| `netProfit` | From P&L report |
| `taxRate` | Default 30% |
| `taxPayable` | `netProfit × taxRate` |
| `paid` | Amount paid |
| `balanceDue` | `taxPayable − paid` |
| `dueDate` | Within 4 months of FY end (by Nov 7 for Ethiopian FY) |

### `ReimbursementClaim` — Key Fields

| Field | Description |
|-------|-------------|
| `locationTier` | Travel tier (affects per diem rates) |
| `purpose` | Trip or reimbursement purpose |
| `transportCost` | Transport component |
| `perDiemAmount` | Daily allowance component |
| `totalAmount` | `amount + transportCost + perDiemAmount` |
| `status` | `PENDING → APPROVED → PAID` / `REJECTED` |
| `workflowType` | `EMPLOYEE_EXPENSE` — standard employee claim; `CANDIDATE_REIMBURSEMENT` — interview/relocation cost paid to an external candidate (Workflow B); `AGENCY_INVOICE` — routes to Bill creation against the agency vendor (Workflow A) |
| `candidateName` | Populated when `workflowType = CANDIDATE_REIMBURSEMENT`; candidate may not yet be an employee |
| `recoveryClause` | Boolean — whether a cost recovery agreement exists in the offer letter |
| `advanceLinkId` | FK to `LoanRequest.id` — set when the claim converts to a staff advance under Workflow B |

### `LoanRequest` — Employee Loan

Separate from `BusinessLoan` — this is for employee salary advances/loans.

| Field | Description |
|-------|-------------|
| `category` | LOAN, ADVANCE, etc. |
| `installments` | Number of monthly deductions |
| `monthlyDeduction` | Auto-calculated deduction per month |
| `remainingBalance` | Decremented on each payroll |
| `status` | PENDING → APPROVED → DISBURSED → CLOSED |

### `OtherPayment` — Supplementary Payroll

Ad-hoc payments outside regular salary (bonuses, allowances, etc.).

| Field | Description |
|-------|-------------|
| `headId` | Links to `OtherPaymentHead` category |
| `taxable` | Whether PIT applies |
| `diaryNo` | Reference number |
| `status` | PENDING → APPROVED → PAID |

### `AdminCreatedMenuItem` — Dynamic Navigation

Custom nav items created by ADMIN via the UI. Fetched by `Sidebar.tsx` from `GET /admin-menu-items?isActive=true`.

| Field | Description |
|-------|-------------|
| `label` | Display text |
| `path` / `to` | Route path |
| `roles` | Comma-separated role list (e.g. `ADMIN,ovds`) |
| `parentKey` | Domain key in sidebar accordion |
| `sortOrder` / `order` | Display order |
| `isActive` | Only active items fetched |

### `IntercompanyTransaction`

Cross-company transfers between two `Company` records. Linked to a `JournalEntry` for double-entry accounting.

| Field | Description |
|-------|-------------|
| `fromCompanyId` / `toCompanyId` | Source and destination companies |
| `type` | TRANSFER, LOAN, DIVIDEND, etc. |
| `status` | PENDING → COMPLETED |

### `CreditHold`

Flags a customer's credit — blocks new invoices until released.

| Field | Description |
|-------|-------------|
| `heldAt` | When hold was placed |
| `releasedAt` | When hold was lifted (null = still active) |
| `heldBy` | User who placed the hold |

---

## Environment Variables — Complete Reference

| Variable | Default | Required | Used By |
|----------|---------|----------|---------|
| `PRISMA_DATABASE_URL` | — | ✅ | PrismaService |
| `JWT_SECRET` | — | ✅ | AuthService |
| `AUTH0_DOMAIN` | — | Auth0 only | Auth0AuthGuard |
| `AUTH0_AUDIENCE` | — | Auth0 only | Auth0AuthGuard |
| `AUTH0_NAMESPACE` | `http://localhost:3000` | — | Auth0 claims |
| `AUTH0_ENFORCED` | `false` | — | Auth0 enforcement |
| `MAIL_HOST` | `smtp.mailtrap.io` | — | EmailService |
| `MAIL_PORT` | `2525` | — | EmailService |
| `MAIL_SECURE` | `false` | — | EmailService |
| `MAIL_USER` | — | Email only | EmailService (skips if not set) |
| `MAIL_PASS` | — | Email only | EmailService |
| `MAIL_FROM_NAME` | `ovds ovds` | — | EmailService |
| `MAIL_FROM_ADDRESS` | `noreply@ovds.com.et` | — | EmailService |
| `ADMIN_EMAIL` | `admin@ovds.com.et` | — | OnboardingService |
| `SIEM_WEBHOOK_URL` | — | SIEM only | AuditLogService |
| `NODE_ENV` | — | — | TransformInterceptor (`ms` field in dev only) |
| `VITE_API_URL` | `/api` | — | Frontend api.ts |
| `VITE_AUTH0_ENABLED` | `false` | Auth0 only | Frontend Auth0 |
| `VITE_AUTH0_DOMAIN` | — | Auth0 only | Frontend Auth0 |
| `VITE_AUTH0_CLIENT_ID` | — | Auth0 only | Frontend Auth0 |
| `VITE_AUTH0_AUDIENCE` | — | Auth0 only | Frontend Auth0 |
| `VITE_AUTH0_CONNECTION` | — | Auth0 only | Frontend Auth0 |

---

## Project Configuration Files

### TypeScript Configuration

**Backend (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "strict": false,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

**Frontend (`frontend/tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

### ESLint Configuration

**Backend (`eslint.config.mjs`):** NestJS default — TypeScript ESLint with `@typescript-eslint/recommended`.

**Frontend (`frontend/eslint.config.js`):** React + TypeScript ESLint with `react-hooks/rules-of-hooks` and `react-refresh/only-export-components`.

Key rules enforced:
- No unused variables (warning)
- React hooks rules (error)
- No `any` type (warning — not error, to allow gradual typing)

### Prettier Configuration (`.prettierrc`)

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

### Vite Configuration (`frontend/vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react(), VitePWA({ ... })],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,           // WebSocket proxy
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../public',    // NestJS serves from ./public
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':    ['lucide-react', 'react-hot-toast'],
          'vendor-i18n':  ['i18next', 'react-i18next'],
          'vendor-http':  ['axios'],
        },
      },
    },
  },
});
```

### Environment Validation

OVDS does not currently use a schema-based env validator (Joi/Zod). Validation is implicit — missing required vars cause runtime errors on first use.

**Recommended pattern for new env vars:**
```typescript
// src/config/env.ts
export const config = {
  databaseUrl: process.env.PRISMA_DATABASE_URL ?? (() => { throw new Error('PRISMA_DATABASE_URL required') })(),
  jwtSecret:   process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET required') })(),
  nodeEnv:     process.env.NODE_ENV ?? 'development',
  port:        parseInt(process.env.PORT ?? '3000', 10),
};
```

---

## Cron Jobs — Complete Reference

All scheduled jobs in the OVDS backend:

| Job | Schedule | Service | Action |
|-----|----------|---------|--------|
| Auto-absence | `EVERY_DAY_AT_11PM` (23:00) | `AttendanceService` | Creates ABSENT records for employees without attendance or approved leave |
| Full cleanup | `EVERY_DAY_AT_MIDNIGHT` (00:00) | `CleanupScheduler` | Runs log cleanup (90d), cache cleanup, report archival, duplicate detection |
| DRRF archival | `0 0 15,25 * *` (15th & 25th) | `CleanupScheduler` | Archives DRRF contributions > 3 months old; warns on overdue |
| Scheduled invoices | On-demand via `processScheduledInvoices()` | `ovdsService` | Sends DRAFT invoices with `scheduledSendAt ≤ now` |
| Recurring invoices | On-demand via `processRecurringInvoices()` | `ovdsService` | Generates new invoices from recurring templates |
| Strategic insights cache | 30s TTL (in-memory) | `DashboardService` | Expires `_strategicCache` — rebuilt on next request |

### Adding a New Cron Job

```typescript
// In any NestJS service
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MyService {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async myDailyJob() {
    // job logic
  }

  @Cron('0 0 1 * *')  // 1st of every month at midnight
  async myMonthlyJob() {
    // job logic
  }
}
```

**Requirements:**
- `ScheduleModule.forRoot()` must be imported in `AppModule`
- Service must be provided in a module
- Cron jobs run in the same Node.js process — avoid blocking operations

---

## File Uploads & Attachments

### FileAttachment Model

OVDS stores file attachments as base64-encoded strings in the `FileAttachment.fileData` field (`LongText`).

**Supported `attachableType` values:** `TaxRate`, `Invoice`, `Bill`, `JournalEntry`, `AuditEngagement`, `AuditFinding`

### Upload Flow

```typescript
// Frontend — convert file to base64
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const handleUpload = async (file: File) => {
  const fileData = await toBase64(file);
  await apiPost('/ovds/attachments', {
    filename: file.name,
    mimeType: file.type,
    fileSize: file.size,
    fileData,                    // base64 data URI
    attachableId: engagementId,
    attachableType: 'AuditEngagement',
    description: 'Scope letter',
  });
};
```

### Size Limits

| Limit | Value | Notes |
|-------|-------|-------|
| `fileData` field | ~4GB (LongText) | Base64 inflates size ~33% |
| Practical limit | ~10MB per file | Larger files cause slow uploads and DB bloat |
| Recommended | < 5MB | Use external storage (S3/MinIO) for larger files |

### PDF Generation (jsPDF)

Used in `AuditOutsourcingService` for engagement reports and compliance certificates.

```typescript
import { jsPDF } from 'jspdf';

const doc = new jsPDF();
doc.setFontSize(16);
doc.text('OVDS Compliance Certificate', 20, 20);
doc.setFontSize(12);
doc.text(`Company: ${company.name}`, 20, 40);
doc.text(`TIN: ${company.tin}`, 20, 50);
doc.text(`Status: FULLY COMPLIANT`, 20, 60);

// Add page numbers
const pageCount = doc.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  doc.text(`Page ${i} of ${pageCount}`, 180, 290);
}

const buffer = Buffer.from(doc.output('arraybuffer'));
return buffer;  // returned as HTTP response with Content-Type: application/pdf
```

---

## Notification Types Reference

All `NotificationType` enum values used in the `Notification` model:

| Type | Trigger | Recipient |
|------|---------|-----------|
| `LEAVE_APPROVED` | Leave request approved | Employee |
| `LEAVE_REJECTED` | Leave request rejected | Employee |
| `LEAVE_SUBMITTED` | New leave request submitted | HR |
| `PAYROLL_GENERATED` | Payroll records generated | HR, ovds |
| `PAYROLL_APPROVED` | Payroll approved | HR |
| `INVOICE_SENT` | Invoice sent to customer | ovds |
| `INVOICE_OVERDUE` | Invoice past due date | ovds |
| `PAYMENT_RECEIVED` | Invoice payment recorded | ovds |
| `VAT_FILING_DUE` | VAT filing deadline approaching | ovds |
| `DRRF_OVERDUE` | DRRF contribution overdue | ovds |
| `EMPLOYEE_CREATED` | New employee added | HR |
| `ATTENDANCE_ALERT` | Unusual attendance pattern | HR |
| `SYSTEM` | System-level notification | Admin |
| `GENERAL` | General announcement | All |

### Notification Delivery Matrix

| Event | WebSocket | Email | Slack |
|-------|-----------|-------|-------|
| Leave approved/rejected | ✅ Always | ✅ If SMTP configured | ✅ If webhook set |
| Payroll generated | ✅ Always | ✅ | ✅ |
| Invoice overdue | ✅ Always | ✅ | ✅ |
| VAT filing due | ✅ Always | ✅ | ✅ |
| System alerts | ✅ Always | ❌ | ✅ |

---

## Password Management

### User Password Change (Self-Service)

```
POST /auth/change-password
Authorization: Bearer <token>
Body: { currentPassword: string, newPassword: string }
```

- Validates `currentPassword` against stored hash
- Hashes new password with bcrypt (salt rounds: 10)
- Logs `PASSWORD_RESET` audit action
- Does not invalidate existing JWT tokens (user stays logged in)

### Admin Password Reset

```
PATCH /auth/users/:id/reset-password
Authorization: Bearer <admin-token>
Body: { newPassword: string }
```

- ADMIN or SPURADMIN only
- Does not require current password
- Logs `PASSWORD_RESET` audit action with `adminId`

### Password Requirements

- Minimum 8 characters
- No maximum length
- No complexity requirements enforced by default (add `@Matches()` DTO decorator to enforce)

### Account Lockout

After **5 consecutive failed login attempts**:
- `failedLoginAttempts` counter incremented on each failure
- Account locked: `lockedUntil = now + 30 minutes`
- Unlock via: `PATCH /auth/users/:id/unlock` (ADMIN only)
- Counter resets on successful login

---

## Soft Delete Patterns

OVDS does **not** use soft delete by default — most models use hard delete. Exceptions:

| Model | Deletion behavior | Reason |
|-------|-----------------|--------|
| `Invoice` (PAID) | Blocked — cannot delete | Financial integrity |
| `PayrollRecord` (APPROVED/PAID) | Blocked — cannot delete | Audit trail |
| `AuditLog` | Purged after 90 days by `CleanupService` | Retention policy |
| `Employee` | Hard delete (blocks if has payroll/attendance) | No soft delete |
| `BankAccount` | Blocked if has transactions | Financial integrity |
| `Item` | Blocked if used in invoices (`usageCount > 0`) | Referential integrity |
| `Vendor` | Blocked if has bills | Referential integrity |
| `Department` | Blocked if has employees | Referential integrity |

### Implementing Soft Delete (if needed)

```typescript
// Add to Prisma model
model Employee {
  deletedAt DateTime?
  // ...
}

// Filter in all queries
where: { companyId, deletedAt: null }

// Soft delete
await prisma.employee.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

> **Note:** Prisma 7 supports `@prisma/extension-soft-delete` for automatic soft delete filtering.

---

## PWA — Advanced Details

### Install Prompt

The browser shows an "Add to Home Screen" prompt when:
1. Site is served over HTTPS
2. Service worker is registered
3. `manifest.json` is valid
4. User has visited the site at least twice

```typescript
// Capture the install prompt for custom UI
let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  setShowInstallButton(true);
});

// Trigger install
const handleInstall = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') setShowInstallButton(false);
  deferredPrompt = null;
};
```

### Offline Attendance Queue

When the device is offline, attendance check-ins are queued to IndexedDB:

```javascript
// public/sw.js — intercept attendance check-in
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/attendance/checkin') && !navigator.onLine) {
    event.respondWith(
      queueCheckin(event.request.clone()).then(() =>
        new Response(JSON.stringify({ queued: true }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
  }
});

// Background sync — replay when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'checkins-sync') {
    event.waitUntil(replayQueuedCheckins());
  }
});
```

**IndexedDB store:** `OVDSOffline` database → `checkins` object store

**Sync notification:** After successful replay, SW sends `postMessage({ type: 'SYNC_SUCCESS', count: n })` to all open tabs.

### SW Cache Management

```javascript
// Force update SW (from app code)
navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });

// Clear all caches (from app code)
navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });

// Check SW registration
const reg = await navigator.serviceWorker.getRegistration();
console.log('SW state:', reg?.active?.state);
```

---

## Database Connection & Performance

### Connection Pooling (Prisma + MariaDB)

Prisma 7 with `@prisma/adapter-mariadb` manages connection pooling automatically.

**Default pool settings:**
```
connection_limit = 10   (max concurrent connections)
pool_timeout    = 10    (seconds to wait for connection)
```

**Override in `PRISMA_DATABASE_URL`:**
```
mysql://root:@127.0.0.1:3306/ovds?connection_limit=20&pool_timeout=30
```

**For production (high traffic):**
```
connection_limit=50&pool_timeout=60&connect_timeout=10
```

### Query Performance Tips

```typescript
// ✅ Use select to limit fields
prisma.employee.findMany({
  select: { id: true, firstName: true, lastName: true, baseSalary: true }
});

// ✅ Use take/skip for pagination — never load all records
prisma.invoice.findMany({ take: 20, skip: 0 });

// ✅ Use groupBy for aggregations — never load all rows to count
prisma.invoice.groupBy({ by: ['status'], _count: { id: true } });

// ✅ Use Promise.all for independent queries
const [employees, departments] = await Promise.all([
  prisma.employee.findMany({ where: { companyId } }),
  prisma.department.findMany({ where: { companyId } }),
]);

// ❌ Avoid N+1 — use include instead
// BAD:
const invoices = await prisma.invoice.findMany();
for (const inv of invoices) {
  inv.payments = await prisma.invoicePayment.findMany({ where: { invoiceId: inv.id } });
}
// GOOD:
const invoices = await prisma.invoice.findMany({
  include: { payments: true }
});
```

### Slow Query Detection

```bash
# Enable MySQL slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  # log queries > 1 second
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';

# View slow queries
tail -f /var/log/mysql/slow.log

# Analyze with EXPLAIN
EXPLAIN SELECT * FROM Invoice WHERE companyId = 'abc' AND status = 'PENDING';
```

---

## Frontend Bundle Optimization

### Current Chunk Strategy

| Chunk | Contents | Approx Size |
|-------|---------|------------|
| `vendor-react` | react, react-dom, react-router-dom | ~140KB |
| `vendor-ui` | lucide-react, react-hot-toast | ~80KB |
| `vendor-i18n` | i18next, react-i18next | ~50KB |
| `vendor-http` | axios | ~15KB |
| Per-page chunks | Each lazy-loaded page | 5–50KB each |

### Lazy Loading Pattern

```tsx
// All pages are lazy-loaded in App.tsx
const Invoices = lazy(() => import('./pages/Invoices'));
const Payroll  = lazy(() => import('./pages/Payroll'));

// Wrapped in Suspense with skeleton fallback
<Suspense fallback={<PageSkeleton />}>
  <Invoices />
</Suspense>
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build --prefix frontend
npx vite-bundle-visualizer --prefix frontend
# Opens interactive treemap in browser
```

### Memory Management

```typescript
// ✅ Clean up subscriptions on unmount
useEffect(() => {
  const sub = someObservable.subscribe(handler);
  return () => sub.unsubscribe();
}, []);

// ✅ Cancel fetch on unmount (useApiQuery handles this automatically)
// ✅ Clear intervals (useInterval handles this automatically)

// ❌ Avoid large state arrays — paginate instead
// BAD: setAllInvoices([...allInvoices, ...newPage])
// GOOD: setInvoices(newPage)  // replace, don't accumulate
```

---

## Performance Patterns

Key patterns used across services to avoid N+1 queries and memory issues:

| Pattern | Where Used | Description |
|---------|-----------|-------------|
| `groupBy` aggregation | `getAccountBalances`, `getReconciliationSummary`, `getExpenseSummary` | DB-level sum/count instead of loading all rows |
| `Promise.all` parallel queries | `getCompanySnapshot`, `getStats`, `getReportsSummary` | Fire independent queries concurrently |
| Single query + in-memory grouping | `getRevenueTrend`, `getReportsSummary` attendance | 2 queries for 6 months instead of 12 sequential queries |
| In-memory cache | `DashboardService._strategicCache` (30s) | Prevents repeated heavy queries on dashboard refresh |
| `$transaction` atomicity | Invoice creation (stock), bank transaction (balance), payroll approval | Ensures consistency across related model updates |
| `include` with `select` | `getVendors` (Bills), `getPayslip` (Employee) | Avoids N+1 by loading relations in one query |
| Pagination everywhere | All list endpoints | `page` + `take` with `skip`; max `take` capped (100–500) |
| Background audit log | `createJournalEntry` | Audit log outside transaction with `.catch(() => {})` — never blocks |
| `createMany` with `skipDuplicates` | Auto-absence cron | Bulk insert without failing on existing records |
| `select` projection | All list endpoints | Only fetch fields needed — never `SELECT *` on large models |
| `Promise.allSettled` | `bulkAction` (leaves), payroll bulk status | Partial failures don't block the rest |
| Exponential backoff retries | `useApiQuery` frontend | 1s → 2s retry on 5xx/network errors |
| Request deduplication | `useApiQuery` frontend | Concurrent identical requests share one in-flight fetch |
| `x-background: 1` header | Notification polls, health checks | Suppresses global error toast for background requests |
| `ScheduleModule` | NestJS cron scheduler — enables `@Cron()` decorators across services |
| `ThrottlerModule` | NestJS rate limiter — global 600 req/min, per-endpoint override via `@Throttle()` |
| `ServeStaticModule` | Serves `./public` as static files (frontend build), excluding `/api/*` |
| `RequestLoggerMiddleware` | Logs all incoming HTTP requests — applied globally in `AppModule` |

| `OnboardingResponse` | Prisma model storing company setup questionnaire submissions |
| `AuditFirm` | External audit firm with `engagements` count |
| `AuditEngagement` | Audit engagement with lifecycle status, findings, comments, attachments |
| `AuditFinding` | Individual finding within an engagement — severity + status |
| `AuditComment` | Comment thread on an engagement |
| `FileAttachment` | Polymorphic file attachment — `attachableType` + `attachableId` |
| `BiometricData` | Employee biometric template — exact string match for verification |
| `FinancialCycle` | Payroll period with `incrementPercentage` for projected payroll |
| `CurrencyRate` | Exchange rate record — unique on `(fromCurrency, toCurrency, date)` |
| `TaxRate` | Configurable tax rate — `TaxType` enum (VAT, INCOME_TAX, WITHHOLDING, DRRF, etc.) |
| `LoanRepayment` | Individual repayment record against a `BusinessLoan` |
| `CustomerInteraction` | CRM interaction log — type, summary, outcome, performedBy |
| `IntercompanyTransaction` | Cross-company transaction between two `Company` records |
| `EmailService` | Nodemailer wrapper — skips silently if `MAIL_USER` not set |
| `jsPDF` | PDF generation library used in `AuditOutsourcingService` for reports and certificates |
| `ADMIN_EMAIL` | Env var for internal alert recipient (default: `admin@ovds.com.et`) |
| `shareToken` | Unique token on `Invoice` for public client portal access without login |

| `CollectionCase` | Tracks overdue invoice collection — stage, assignedTo, promiseDate |
| `CollectionStage` | Enum: ASSIGNED, CONTACTED, PROMISE_TO_PAY, ESCALATED, LEGAL, CLOSED |
| `Deduction` | Invoice adjustment record with `DeductionStatus` and `DeductionReason` |
| `CashForecast` | Treasury forecast record — period, projected, low, high, confidence |
| `PaymentBatch` | Bulk payment grouping — type (AR/AP), items, CSV export |
| `PaymentBatchItem` | Individual invoice or bill within a `PaymentBatch` |
| `BatchStatus` | Enum for payment batch lifecycle |
| `App` | App Store listing — slug, rating, downloads, isActive |
| `Review` | Polymorphic review — `entityType` + `entityId` + `appId` |
| `DSO` | Days Sales Outstanding — `(collected/sales) × 30` over trailing 30 days |
| `OcrService` | Extracts invoice data from images via GPT-4o or Gemini |
| `TaxRateService` | Manages `TaxRate` records — seed Ethiopian defaults, bulk activate/deactivate |
| `PartnershipService` | Manages partnerships, members, business loans, investments, customer interactions |
| `AttachmentService` | Manages `FileAttachment` records — polymorphic upload/download |
| `CleanupService` | Scheduled cleanup of stale data (via `CleanupScheduler`) |
| `HealthService` | Backend health check — `/api/health/detailed` endpoint |
| `papaparse` | CSV generation library used in `TreasuryService.exportPaymentBatch()` |

| `Partnership` | Business partnership entity — TIN, license, members, credibility score |
| `PartnershipMember` | Individual member of a partnership — role, ownershipPct, contribution |
| `PartnershipCustomer` | M2M link between Partnership and Customer — relationshipType, since |
| `PartnershipStatus` | Enum: ACTIVE, INACTIVE, DISSOLVED, PENDING |
| `credibilityScore` | Computed score (0–100) for Ethiopian bank loan eligibility |
| `loyaltyTier` | Customer tier: PLATINUM (≥80), GOLD (≥60), SILVER (≥40), BRONZE (<40) |
| `Customer360` | Unified customer view — invoices, interactions, loans, investments, credit score |
| `VatFiling` | Monthly VAT Return record — period, collected, netPayable, status |
| `IncomeTaxFiling` | Annual BIT declaration — fiscalYear, taxPayable, paid, balanceDue |
| `TaxType` | DTO enum: VAT, INCOME_TAX, DRRF (used in `CreateTaxFilingDto`) |
| `OcrResult` | Bank statement OCR output — transactions[], bankName, accountNumber, provider |
| `InvoiceOcrResult` | Invoice OCR output — all invoice fields + items[], confidence, provider |
| `CleanupScheduler` | Cron service — daily cleanup + monthly DRRF archival on 15th & 25th |
| `OPENAI_API_KEY` | Env var for GPT-4o OCR (primary provider) |
| `GEMINI_API_KEY` | Env var for Gemini 1.5 Flash OCR (fallback provider) |
| `autoPostVatFiling` | AccountingService method — posts VAT journal entry on filing |
| `autoPostDRRRemittance` | AccountingService method — posts DRRF remittance journal entry |
| `getComplianceStatus` | TaxService method — returns 10-item ERCA compliance checklist with scores |

| `TelecomReceiptCache` | Caches Ethio Telecom receipt lookups — `ref` unique, `expiresAt` TTL |
| `HealthStatus` | TypeScript type for `/api/health/detailed` response |
| `HealthScore` | Financial health score — overall (0–100), grade (A–F), components |
| `CleanupService.fullCleanup()` | Runs log cleanup + cache cleanup + report archival + duplicate detection in parallel |
| `TaxRate.appliesTo` | JSON string array: `['INVOICE', 'BILL', 'ITEM']` — parsed on read |
| `FileAttachment.fileData` | Base64-encoded file content stored as `LongText` in DB |
| `attachableType` | Polymorphic discriminator: `TaxRate`, `Invoice`, `Bill`, `JournalEntry`, `AuditEngagement`, `AuditFinding` |
| `LoanRequest` | Employee salary advance/loan — separate from `BusinessLoan` (company bank loan) |
| `OtherPayment` | Ad-hoc supplementary payroll payment (bonus, allowance) linked to `OtherPaymentHead` |
| `OtherPaymentHead` | Category definition for `OtherPayment` — name, shortCode, isTaxable |
| `AdminCreatedMenuItem` | Dynamic sidebar nav item created by ADMIN — fetched from `GET /admin-menu-items?isActive=true` |
| `IntercompanyTransaction` | Cross-company transfer — links two `Company` records and optionally a `JournalEntry` |
| `CreditHold` | Customer credit block — `releasedAt = null` means hold is active |
| `ReimbursementClaim.locationTier` | Travel tier affecting per diem rates |
| `PayrollRecord` unique constraint | `(employeeId, year, month, type)` — prevents duplicate payroll records |
| `VatFiling.dueDate` | 25th of the month following the period |
| `IncomeTaxFiling.dueDate` | Within 4 months of FY end — November 7 for Ethiopian fiscal year |
| `HealthService.determineStatus()` | healthy if grade A/B or (cash > AP×10% AND profit > 0); degraded otherwise |
| Sole Proprietorship | Single-owner Ethiopian business — maps to `FREELANCER` BusinessType; Tier 3 (outside IFRS scope) |
| PLC | Private Limited Company — preferred Ethiopian SME structure for limited liability; maps to `SMALL_BUSINESS` or `MEDIUM_ENTERPRISE` |
| Share Company | Ethiopian corporate structure for larger SMEs — maps to `MEDIUM_ENTERPRISE` or `LARGE_ENTERPRISE` |
| Cooperative Society | Government-backed group (min 5 members) — maps to `SMALL_BUSINESS`; eligible for government loan programs |
| telebirr | Ethio Telecom mobile payment service — `paymentSource: TELECOM`, `telecomRef` field on `InvoicePayment` |
| CBE | Commercial Bank of Ethiopia — primary bank for DRRF remittances and salary transfers |
| EDRRFO | Ethiopian Disaster Risk Reduction Fund Office — receives DRRF levy remittances |
| Ethiopian Fiscal Year | Hamle (July 7/8) to Sene (July 6/7) — `fiscal_year_start = 7`; BIT due November 7 |
| Hamle | Ethiopian month corresponding to July — start of Ethiopian fiscal year |
| Sene | Ethiopian month corresponding to June — end of Ethiopian fiscal year |
| NBE | National Bank of Ethiopia — issues NBE-IQR format for e-invoice QR codes |
| MoR | Ministry of Revenues — oversees VAT, BIT, and all tax filings |
| SIGTAS | Standard Integrated Government Tax Administration System — eTax portal for filings |
| Working Capital Loan | `LoanType: WORKING_CAPITAL` — short-term financing for day-to-day operations; common for Ethiopian SMEs |
| Credibility Score | 0–100 score computed from Partnership data (TIN, license, members, customers, financial transparency) — used for bank loan eligibility |
| Business Credibility Widget | `BusinessCredibilityWidget.tsx` — live credibility score dashboard widget for ADMIN role |
| IFRS Readiness Widget | `IFRSReadinessWidget.tsx` — shows IFRS compliance readiness per business type tier |
| ERCA Compliance Dashboard | `ERCAComplianceDashboard.tsx` — full ERCA compliance status with 10-item checklist |
| Financial Ratio Widget | `FinancialRatioWidget.tsx` — key financial ratios (current ratio, debt-to-equity, etc.) |
| Accounting Chain Widget | `AccountingChainWidget.tsx` — visual compliance chain from invoice → tax submission |
| Audit Readiness Widget | `AuditReadinessWidget.tsx` — audit readiness score and open findings summary |
| Executive Summary Widget | `ExecutiveSummaryWidget.tsx` — high-level KPI summary for executive view |
| Mobile KPI Strip | `MobileKPIStrip.tsx` — compact KPI strip optimized for mobile screens |
| Realtime Presence Widget | `RealtimePresenceWidget.tsx` — live WebSocket-powered employee presence map |
| Tax Calendar Widget | `TaxCalendarWidget.tsx` — upcoming VAT, DRRF, and BIT filing deadlines |
| Live P&L Banner | `LivePnLBanner.tsx` — real-time revenue vs expense comparison banner |
| Payroll Insights Widget | `PayrollInsightsWidget.tsx` — payroll trends, PIT totals, pension breakdown |
| ERCA | Ethiopian Revenue and Customs Authority — administers VAT, withholding tax, and customs |
| eTax | Ethiopian electronic tax filing portal (also called SIGTAS) — used for VAT and BIT submissions |
| Proclamation 847/2014 | Ethiopian law mandating IFRS adoption; establishes AABE |
| Regulation 332/2014 | Council of Ministers regulation establishing AABE and IFRS implementation roadmap |
| Proclamation 1341/2024 | Ethiopian VAT proclamation — 15% standard rate, e-invoice QR requirement |
| Regulation 570/2025 | Ethiopian DRRF regulation — 17+ levy categories; raises VAT threshold to ETB 2M/year |
| Labour Proclamation 1156/2019 | Ethiopian labour law — governs maternity/paternity leave, severance, employment contracts |
| Auth0 | Cloud identity provider — provides SSO, MFA, and RS256 JWT tokens; optional in OVDS |
| RS256 | RSA-signed JWT — used by Auth0; validated by `Auth0AuthGuard` |
| HS256 | HMAC-signed JWT — used by local auth; validated by `AnyAuthGuard` |
| MFA Step-Up | Re-authentication required for sensitive routes — managed by `useStepUp()` + `StepUpProvider` |
| `StepUpGate` | React component that blocks access until MFA step-up is completed |
| `useStepUp()` | Hook providing `requireStepUp` function and step-up state |
| `Auth0AuthGuard` | NestJS guard accepting only Auth0 RS256 tokens — used for `/auth/auth0/session` |
| `AnyAuthGuard` | NestJS guard accepting both HS256 (local) and RS256 (Auth0) tokens |
| `ovds_token` | localStorage key for local JWT token |
| `ovds_user` | localStorage key for serialized `AuthUser` object |
| `auth0_token` | localStorage key for Auth0 access token |
| `selectedCompanyId` | localStorage key for active company in `BusinessContext` |
| `wizard_auto_dismissed` | sessionStorage key — prevents Company Setup Wizard from auto-opening twice |
| Genna | Ethiopian Christmas — January 7; public holiday |
| Timkat | Ethiopian Epiphany — January 19; public holiday |
| Enkutatash | Ethiopian New Year — September 11; public holiday |
| Meskel | Finding of the True Cross — September 27; public holiday |
| Adwa | Victory of Adwa Day — March 2; public holiday |
| Current Ratio | Current Assets / Current Liabilities — liquidity measure; ≥ 1.5 healthy |
| Quick Ratio | (Current Assets − Inventory) / Current Liabilities — excludes illiquid inventory |
| Debt-to-Equity | Total Liabilities / Total Equity — leverage measure; < 2.0 preferred by Ethiopian banks |
| DSO | Days Sales Outstanding — `(AR / Revenue) × 365`; lower = faster collection |
| ROA | Return on Assets — Net Profit / Total Assets × 100 |
| ROE | Return on Equity — Net Profit / Total Equity × 100 |
| Gross Profit Margin | (Revenue − COGS) / Revenue × 100 |
| Net Profit Margin | Net Profit / Revenue × 100 |
| `FinancialRatioWidget` | Dashboard widget showing key financial ratios for loan assessment |
| `WhiteLabelSettings.tsx` | Component for customizing company branding (logo, colors, invoice footer) |
| `IntercompanyTransaction` | Cross-company transfer model — requires manual `JournalEntry` for GL posting |
| `AdminCreatedMenuItem` | Dynamic sidebar nav item created by ADMIN — fetched from `GET /admin-menu-items?isActive=true` |
| `DepreciationScheduleModal.tsx` | Modal for generating IAS 16/IAS 38 monthly depreciation journal entries |
| `PeriodManager.tsx` | Component for opening/closing fiscal periods — enforces IAS 10 cut-off |
| `CompanySetupWizard.tsx` | Guided onboarding wizard — triggered by `W` key or `ovds:open-setup-wizard` event |
| `GlobalSearchModal.tsx` | Full-text search across employees, invoices, bills, vendors, customers, pages |
| `ActivityFeedDrawer.tsx` | Slide-in drawer showing recent system activity — triggered by `A` key |
| `KeyboardShortcutsModal.tsx` | Modal listing all global keyboard shortcuts — triggered by `?` key |
| `SessionExpiryBanner.tsx` | Warning banner shown when JWT expires in < 5 minutes |
| `StepUpAuthModal.tsx` | MFA re-authentication modal for sensitive route access |
| `ReceiptViewer.tsx` | Component for viewing telebirr and bank payment receipts |
| `ScheduledExportModal.tsx` | Modal for scheduling recurring data exports |
| `PaymentBatchModal.tsx` | Modal for creating and managing bulk payment batches |
| `DeductionResolver.tsx` | Component for resolving invoice deductions and disputes |
| `LivePnLWidget.tsx` | Real-time P&L widget (separate from `LivePnLBanner`) |
| `ComplianceStatusBar.tsx` | Horizontal compliance status bar showing ERCA checklist progress |
| `ContextualInsight.tsx` | AI-powered contextual insight panel for current page |
| `FuseSearch.tsx` | Client-side fuzzy search component using Fuse.js |
| `DefaultTabPin.tsx` | Component for pinning a default tab in tabbed interfaces |
| `Skeleton.tsx` | Loading skeleton placeholder component |
| `StatsCard.tsx` | Reusable KPI card with value, trend, and icon |
| `Pagination.tsx` | Reusable pagination component |
| `EmptyState.tsx` | Empty state placeholder with message and optional action |
| `ColumnToggle.tsx` | Column visibility toggle for data tables |
| `Can.tsx` | Declarative RBAC gate — wraps UI elements with permission checks |
| `RoleBadge.tsx` | Role chip with metadata colors — badge/dot/minimal variants |
| `PermissionTooltip.tsx` | "Why denied" tooltip wrapper for any element |
| `Auth0Badge.tsx` | SSO/MFA status indicator badge |
| `PageHeader.tsx` | Page-level header with search, filter chips, and action buttons |
| `DepartmentsService` | Manages departments — CRUD, employee count, deletion guard |
| `ShiftsService` | Manages shifts — schedule, work days, deletion guard |
| `HolidaysService` | Manages holidays — `isHoliday()` used by attendance cron |
| `FinancialCycle` | Payroll period model — `startDate`, `endDate`, `incrementPercentage`, `status` |
| `ArrearConfig` | Retroactive salary adjustment — `period`, `adjustmentAmount`, `reason`, `status` |
| `OtherPaymentHead` | Supplementary payment category — `name`, `shortCode`, `isTaxable` |
| `OtherPayment` | Individual supplementary payment — links to `OtherPaymentHead`, `employeeId`, `period` |
| `LoanRequest` | Employee salary advance — `installments`, `monthlyDeduction`, `remainingBalance` |
| `CurrencyRate` | Exchange rate record — unique on `(fromCurrency, toCurrency, date)` |
| `FixedAsset` | Fixed asset record — `depreciationMethod`, `bookValue`, `accumulatedDepreciation` |
| `DepreciationMethod` | Enum: `STRAIGHT_LINE`, `DECLINING_BALANCE`, `UNITS_OF_PRODUCTION` |
| `FixedAssetStatus` | Enum: `ACTIVE`, `DISPOSED`, `FULLY_DEPRECIATED` |
| `PurchaseOrder` | Procurement document — lifecycle: DRAFT → SUBMITTED → APPROVED → RECEIVED → BILLED → CLOSED |
| `ReimbursementClaim` | Employee expense claim — `locationTier`, `perDiemAmount`, `transportCost`, `totalAmount` |
| `Item` | Product/service catalog entry — `sku`, `unitPrice`, `costPrice`, `trackInventory`, `stockQuantity`, `reorderLevel` |
| `Inventory` | Computed from `Item` records using FIFO/WA costing method |
| `AttendanceEventsService` | RxJS Subject bridge — decouples `AttendanceService` from `WebsocketGateway` |
| `RequestLoggerMiddleware` | Logs all HTTP requests globally — applied in `AppModule.configure()` |
| `ThrottlerModule` | NestJS rate limiter — global 600 req/min; override with `@Throttle()` |
| `ServeStaticModule` | Serves `./public` as static files — frontend build output, excludes `/api/*` |
| `ScheduleModule` | NestJS cron scheduler — enables `@Cron()` decorators |
| `AllExceptionsFilter` | Global exception filter — standardizes all error responses |
| `TransformInterceptor` | Global response wrapper — adds `statusCode`, `message`, `success`, `ms` |
| `forwardRef()` | NestJS circular dependency resolver — use when two modules depend on each other |
| `$executeRawUnsafe` | Prisma raw SQL execution — used by `VatService` for 7 raw SQL tables |
| `createMany` | Prisma bulk insert — used with `skipDuplicates: true` in auto-absence cron |
| `groupBy` | Prisma aggregation — used for account balances, reconciliation summary, expense summary |
| `Promise.allSettled` | Partial failure tolerance — used in bulk leave actions and payroll bulk status |
| `invalidateQuery` | `useApiQuery` cache invalidation — exact URL match |
| `invalidateQueryPrefix` | `useApiQuery` cache invalidation — all URLs starting with prefix |
| `mutate` | `useApiQuery` optimistic update — updates cache without network call |
| `staleTime` | `useApiQuery` cache TTL — default 30s; set to 0 to always refetch |
| `deps` | `useApiQuery` dependency array — re-fetches when any dep changes |
| `enabled` | `useApiQuery` conditional fetch — skip when `false` (e.g. missing `companyId`) |
| `select` | `useApiQuery` transform — maps raw response to desired shape |
| `onSuccess` | `useApiQuery` callback — fires after successful fetch |
| `onError` | `useApiQuery` callback — fires after failed fetch |
| `retries` | `useApiQuery` retry count — default 2; uses exponential backoff (1s, 2s) |
| `useFormDirty` | Hook — detects unsaved form changes; fires `beforeunload` warning |
| `usePageTitle` | Hook — sets `document.title` for current page |
| `useCountUp` | Hook — animated number counter for KPI cards |
| `useAnimatedValue` | Hook — spring-animated values for smooth transitions |
| `useRelativeTime` | Hook — human-readable relative timestamps ("2 hours ago") |
| `useLastRefreshed` | Hook — "Last refreshed X ago" display |
| `usePrevious` | Hook — tracks previous value of a state variable |
| `useEscapeKey` | Hook — Escape key handler |
| `useFinancialAlerts` | Hook — polls for financial anomaly alerts |
| `useAuth0Session` | Hook — Auth0 redirect callback + token exchange |
| `useAuth0Status` | Hook — server-side Auth0 config status (session-cached) |
| `useSessionRefresh` | Hook — proactive Auth0 token refresh before expiry; mount in `Layout` |
| `useStepUp` | Hook — MFA step-up re-authentication (`requireStepUp`, `StepUpGate`) |
| `useRouteGuard` | Hook — route-level access check with redirect logic |
| `usePermissionGuard` | Hook — RBAC + ABAC combined guard with reason |
| `useAuditLog` | Hook — client-side audit event emitter (`log`, `logDenied`, `logExport`) |
| `useWebSocket` | Hook — Socket.io connection with event handlers and `emit` |
| `useApiQuery` | Hook — data fetching with cache, deduplication, retries, optimistic updates |
| `useRbac` | Hook — convenience: `can`, `is`, `isAtLeast`, `canCrud`, `accessLevel`, `guard()` |
| `useAuth` | Hook — full auth context + RBAC helpers + session state |
| `useBusiness` | Hook — company switcher context: `selectedCompanyId`, `companies`, `isMultiCompany` |
| `usePagination` | Hook — `page`, `take`, `setPage`, `setTake`, `paginationProps` for list views |
| `useDebounce` | Hook — delays value update by N ms; use for search inputs to reduce API calls |
| `useLocalStorage` | Hook — persistent state in localStorage with cross-tab sync |
| `useFormDirty` | Hook — tracks unsaved form changes; fires `beforeunload` warning on navigation |
| `useInterval` | Hook — safe `setInterval` with automatic cleanup on unmount; pass `null` to pause |
| `useClickOutside` | Hook — fires callback when user clicks outside a referenced element |
| `useKeyboardShortcut` | Hook — binds global keyboard shortcut; disabled when focus is in input/textarea/select |
| `useFinancialAlerts` | Hook — polls `/dashboard/alerts` every 60s for anomaly alerts |
| `jsPDF` | PDF generation library — used in `AuditOutsourcingService` for reports and certificates |
| `FileAttachment` | Polymorphic file attachment — base64 stored in `LongText`; max practical size ~5MB |
| `NotificationType` | Enum — `LEAVE_APPROVED`, `LEAVE_REJECTED`, `PAYROLL_GENERATED`, `INVOICE_SENT`, `INVOICE_OVERDUE`, `PAYMENT_RECEIVED`, `VAT_FILING_DUE`, `DRRF_OVERDUE`, `EMPLOYEE_CREATED`, `ATTENDANCE_ALERT`, `SYSTEM`, `GENERAL` |
| `BeforeInstallPromptEvent` | Browser event for PWA install prompt — captured and deferred for custom install button |
| `OVDSOffline` | IndexedDB database name — stores offline attendance check-ins in `checkins` object store |
| `checkins-sync` | Background sync tag — replays queued offline check-ins when connectivity returns |
| `SKIP_WAITING` | SW message — forces new service worker to activate immediately |
| `CLEAR_CACHE` | SW message — wipes all SW caches; use after deployment to force fresh assets |
| `ovds-v3` | SW cache name — increment version to force cache bust on deployment |
| `connection_limit` | Prisma URL param — max concurrent DB connections (default 10; increase for production) |
| `pool_timeout` | Prisma URL param — seconds to wait for available connection (default 10) |
| `ecosystem.config.js` | PM2 configuration file — defines app name, instances, memory limits, log paths |
| `pm2` | Node.js process manager — cluster mode, auto-restart, log management |
| `certbot` | Let's Encrypt SSL certificate tool — `certbot --nginx -d yourdomain.com` |
| `logrotate` | Linux log rotation tool — configured in `/etc/logrotate.d/ovds` |
| `mysqldump` | MySQL backup utility — `mysqldump -u root -p ovds > backup.sql` |
| `prisma migrate deploy` | Applies pending migrations in production — safe, no data loss |
| `prisma migrate dev` | Creates and applies migration in development — generates migration file |
| `prisma migrate reset` | Drops all tables and reseeds — **dev only, destroys all data** |
| `vite-bundle-visualizer` | Tool for analyzing frontend bundle size — `npx vite-bundle-visualizer` |
| `tsconfig.json` | TypeScript config — backend has `strict: false`; frontend has `strict: true` |
| `.prettierrc` | Prettier config — `singleQuote: true`, `trailingComma: all`, `printWidth: 100` |
| `eslint.config.mjs` | Backend ESLint config — TypeScript ESLint with `@typescript-eslint/recommended` |
| `frontend/eslint.config.js` | Frontend ESLint config — React + TypeScript ESLint with hooks rules |
| `FRONTEND_URL` | Optional env var — used in `app.enableCors()` for production CORS origin |
| `PORT` | Optional env var — NestJS listen port (default 3000) |
| `bcrypt` | Password hashing library — salt rounds: 10; used in `AuthService` |
| `failedLoginAttempts` | User model field — incremented on failed login; triggers lockout after 5 |
| `lockedUntil` | User model field — account lock expiry; set to `now + 30 minutes` on lockout |
| `autoUpdate` | Vite PWA register type — silently updates SW in background without user prompt |
| `standalone` | PWA display mode — full-screen app feel without browser chrome |
| `manifest.json` | PWA manifest — defines app name, icons, shortcuts, display mode, theme color |
| `sw.js` | Service worker — cache strategy, offline queue, background sync |
| `SYNC_SUCCESS` | SW postMessage type — sent to open tabs after offline check-ins are replayed |
| `N+1 query` | Performance anti-pattern — loading relations in a loop; fix with Prisma `include` |
| `SELECT *` | Performance anti-pattern — loads all fields; fix with Prisma `select` projection |
| `lazy()` | React lazy import — splits page into separate chunk; reduces initial bundle size |
| `Suspense` | React component — shows fallback while lazy component loads |
| `PageSkeleton` | Loading skeleton for full page — shown during lazy page load |
| `rollupOptions.manualChunks` | Vite config — splits vendor libraries into separate cached chunks |





