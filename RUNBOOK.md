# OVDS Enterprise — Operations Runbook

> **Stack:** Nx 23 monorepo · NestJS 11 (backend) · React 19 + Vite (frontend) · Prisma 7 + MariaDB/MySQL · pnpm workspaces  
> **Node requirement:** ≥ 20 LTS  
> **Package manager:** pnpm (use `npm` at the workspace root — the root `package.json` scripts call pnpm internally via Nx)

---

## Table of Contents

1. [First-Time Setup](#1-first-time-setup)
2. [Environment Files](#2-environment-files)
3. [Database Commands](#3-database-commands)
4. [Development Servers](#4-development-servers)
5. [Build Commands](#5-build-commands)
6. [Testing & Quality](#6-testing--quality)
7. [Security Scans](#7-security-scans)
8. [Production Deployment](#8-production-deployment)
9. [Troubleshooting](#9-troubleshooting)
10. [MoR / ERCA EIMS Integration](#10-mor--erca-eims-integration)

---

## 1. First-Time Setup

Run these steps **in order** on a clean checkout.

```bash
# 1. Install all workspace dependencies
npm install

# 2. Copy and fill the environment file
cp .env.example .env
# Edit .env — at minimum set PRISMA_DATABASE_URL and JWT_SECRET

# 3. Generate the Prisma client and Zod types
npm run db:generate

# 4. Apply the schema to the database (local dev)
npm run db:push
# — or — run pending migrations instead:
npm run db:migrate

# 5. Seed development data
npm run seed

# 6. Start both servers
npm run dev:all
```

> **Windows (PowerShell):** use the quick-start helper instead of step 6:
> ```powershell
> npm run quick-start
> ```

---

## 2. Environment Files

| File | Purpose |
|---|---|
| `.env` | Active config loaded by NestJS and Vite. **Never commit this file.** |
| `.env.development` | Development overrides (CORS, security headers, offline config). |
| `.env.production` | Production-only values (Google OAuth callback, mail settings). |
| `.env.example` | Template with every supported key and its default. Keep in sync. |

**Minimal `.env` required keys:**

```dotenv
PRISMA_DATABASE_URL=mysql://root:@127.0.0.1:3306/your_db
JWT_SECRET=<32+ random hex chars>
JWT_REFRESH_SECRET=<different 32+ random hex chars>
PORT=3000
NODE_ENV=development
EIMS_SANDBOX=true
REDIS_ENABLED=false
```

---

## 3. Database Commands

All database operations delegate to `@ovds/database` (`packages/database`).

### Prisma client generation

```bash
# Generate Prisma client + Zod types from schema.prisma
npm run db:generate

# Generate for Plesk/production server (uses .env.production)
npm run db:generate:plesk
```

> Run after **any** change to `packages/database/prisma/schema.prisma`.

### Schema push (local dev only — no migration files)

```bash
npm run db:push
```

> Pushes the current schema directly to the database. Fast for local iteration but **does not create migration files**. Do not use on shared or production databases.

### Migrations

```bash
# Create + apply a new migration (local dev — prompts for migration name)
npm run db:migrate:dev

# Apply all pending migrations (local dev, no prompt)
npm run db:migrate

# Deploy pending migrations to production
npm run db:migrate:prod
```

> **Correct order for a schema change:**
> 1. Edit `schema.prisma`
> 2. `npm run db:migrate:dev`   ← creates the migration file
> 3. `npm run db:generate`      ← regenerates the Prisma client
> 4. Commit both the migration file and the regenerated client types

### Seeding

```bash
# Seed development data (uses .env)
npm run seed

# Seed production reference data (uses .env.production)
npm run seed:prod

# Seed demo / showcase data
npm run seed:demo

# Seed ZAP security-test users
npm run seed:zap-users
```

### Prisma Studio (visual DB browser)

```bash
npm run db:studio
```

---

## 4. Development Servers

### Start everything (recommended)

```bash
npm run dev:all
```

Runs `scripts/ensure-ports.mjs` (checks that ports 3000 and 5173 are free) then launches both the backend and frontend concurrently via `scripts/dev-all.mjs`.

Default URLs:

| Service | URL |
|---|---|
| Frontend (Vite) | http://127.0.0.1:5173 |
| Backend API | http://127.0.0.1:3000/api |
| Swagger UI | http://127.0.0.1:3000/api/openapi *(when `ENABLE_SWAGGER=true`)* |

### Start individually

```bash
# NestJS backend only
npm run dev:backend

# Vite frontend only
npm run dev:frontend
```

### Quick health check

```bash
npm run health
```

---

## 5. Build Commands

### Full workspace build (all 116 projects)

```bash
npm run build:all
```

> Uses Nx's parallel task graph (8 workers). Nx caches task outputs — unchanged projects are skipped automatically.

### Targeted builds

```bash
# Backend only
npm run build:backend

# Frontend only
npm run build:frontend

# Both apps (parallel, no libraries)
npm run build:apps

# Shared libraries only
npm run build:libs

# oRPC contracts only
npm run build:contracts
```

### Recommended build order for a fresh environment

```bash
npm run build:libs       # 1. Shared packages (design-system, shared, ui, core, …)
npm run build:contracts  # 2. oRPC router contracts
npm run build:apps       # 3. Backend + frontend
```

> Nx handles dependency ordering automatically when using `build:all`. The stepped approach above is only needed when debugging build failures in isolation.

### Type-check without emitting

```bash
npm run typecheck          # all projects
npm run typecheck:libs     # libraries only
npm run typecheck:apps     # backend + frontend only
```

### Lint

```bash
npm run lint               # backend + frontend
npm run lint:all           # entire workspace
npm run lint:fix           # auto-fix where possible
```

---

## 6. Testing & Quality

```bash
# Run tests for backend, frontend, and shared
npm run test

# Individual projects
npm run test:backend
npm run test:frontend
npm run test:shared

# With coverage
npm run test:coverage

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Run only tests affected by current git changes
npm run affected:test
```

### Architecture boundary check

```bash
npm run check:arch
```

Verifies `@nx/enforce-module-boundaries` rules (e.g. `type:ui` cannot import from `scope:backend`).

### Dependency graph

```bash
npm run graph
```

Opens the Nx project dependency graph in a browser.

---

## 7. Security Scans

```bash
# SAST lint
npm run security:sast

# Dependency vulnerability audit
npm run audit
npm run audit:fix

# OWASP ZAP scans (require a running local server — start dev:all first)
npm run security:zap:baseline   # passive baseline
npm run security:zap:full       # active full scan
npm run security:zap:auth       # authenticated scan
npm run security:zap:api        # API definition scan

# Secrets detection
npm run security:scan:secrets

# Dependency check
npm run security:scan:deps

# App readiness check
npm run security:check
```

---

## 8. Production Deployment

```bash
# 1. Set NODE_ENV=production in .env.production and fill all required vars
# 2. Install dependencies (production only)
npm ci --omit=dev

# 3. Generate Prisma client for production
npm run db:generate:plesk

# 4. Run migrations
npm run db:migrate:prod

# 5. Build all projects
npm run build:all

# 6. Seed reference data (if first deploy)
npm run seed:prod

# 7. Start the compiled backend
npm run start:prod
```

> The `deploy` script (`npm run deploy`) wraps the Plesk-specific deployment flow via `scripts/deploy.mjs` and automatically runs `predeploy` (Prisma binary patching for the server's OpenSSL version).

---

## 9. Troubleshooting

### Nx cache is stale after a major dependency upgrade

```bash
npm run reset
# then rebuild
npm run build:all
```

### Port conflicts on `npm run dev:all`

The `ensure-ports.mjs` script checks ports 3000 and 5173. If either is occupied:

```powershell
# Windows — find and kill the process on a port
netstat -aon | Select-String ":3000"
Stop-Process -Id <PID>
```

### `prisma generate` fails with TLS error (Plesk / self-signed proxy)

Set `PRISMA_ALLOW_INSECURE_TLS=1` **only** on the affected host (never in CI or developer machines). See `.env.example` for context.

### `Cannot find module '@ovds/shared'` after a branch switch

```bash
npm run build:libs
```

The shared packages must be compiled before the apps can import them.

### `JWT_SECRET environment variable is required` on backend startup

`apps/backend/src/auth/strategies/jwt.strategy.ts` throws on missing `JWT_SECRET`. Ensure `.env` contains a non-empty `JWT_SECRET`.

### EIMS client throws `TIN must be exactly 10 digits`

Set `EIMS_SANDBOX=true` in `.env` while credentials are not yet provisioned. The sandbox client bypasses TIN validation and returns deterministic mock IRNs.

---

## 10. MoR / ERCA EIMS Integration

### Switching between sandbox and live

| Variable | Sandbox (dev/test) | Live (production) |
|---|---|---|
| `EIMS_SANDBOX` | `true` | `false` |
| `EIMS_API_URL` | *(leave blank)* | MoR-issued live endpoint |
| `EIMS_CLIENT_ID` | *(leave blank)* | MoR portal client ID |
| `EIMS_CLIENT_SECRET` | *(leave blank)* | MoR portal client secret |
| `EIMS_API_KEY` | *(leave blank)* | MoR portal static API key |
| `EIMS_TIN` | *(leave blank)* | Taxpayer's 10-digit TIN |
| `EIMS_SYSTEM_NUMBER` | *(leave blank)* | Source system number from MoR portal registration |

> When `EIMS_SANDBOX=true` the `MorEimsClient` short-circuits all API calls and returns deterministic mock IRNs (`deterministicIrn`). The `isEimsSandbox()` helper (from `@ovds/shared`) can be used anywhere in the backend to check the current mode.

### MoR submission workflow

```
1. Invoice finalized in OVDS
       │
       ▼
2. POST /api/eims/invoices/:id/register
       │  EimsService.registerSalesInvoice()
       │  → validates invoice for MoR (TIN, buyer, lines, currency, status)
       │  → maps OVDS invoice → MoR EIMS JSON (eims-invoice.mapper.ts)
       │  → signs payload with company INSA certificate (RSA-SHA512)
       │  → POSTs to MoR /v1/register via MorEimsClient
       ▼
3. MoR returns { irn, signedQR, ackDate, signedInvoice, invoiceSignature }
       │
       ▼
4. Receipt verified against EIMS_MOR_CERTIFICATE (if configured)
       │
       ▼
5. EimsRegistration row saved; Invoice.eimsIrn + eimsStatus updated
       │
       ▼
6. InvoiceActivity record created for audit trail
```

### Invoice summary report

```bash
# Preview (no submission)
GET /api/eims/summary/compile?from=2024-01-01&to=2024-01-31&reportType=MONTHLY

# Submit to MoR
POST /api/eims/invoices/submit-summary
Body: { from, to, reportType }
```

### Compliance pre-flight

```bash
GET /api/eims/compliance/readiness           # overall company readiness
GET /api/eims/compliance/checklist           # INSA cybersecurity checklist
GET /api/eims/compliance/bsp-checklist       # MoR BSP test case checklist
GET /api/eims/compliance/bsp-report          # BSP test case results
GET /api/eims/registry                       # OVDS ↔ MoR field-mapping registry
```

---

*Last updated: August 2026 — reflects OVDS v4.2.0-Alpha and MoR EIMS Spec v1.2*
