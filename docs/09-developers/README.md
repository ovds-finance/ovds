<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)
     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)
     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)
     🔄 Last synced: 2026-09-08 -->

# Developers

Technical reference for building on, extending, and deploying OVDS. Every module, route, and permission is open and configurable.

---

## Documents in This Section

### API & Integration

| Document | Description |
|----------|-------------|
| [API.md](API.md) | Complete REST API reference — all 250+ endpoints, authentication, pagination, DTOs, error codes, WebSocket events, EIMS/MoR e-Invoice integration |
| [WEBHOOKS.md](WEBHOOKS.md) | Outbound webhooks, App Store extensions, payment gateway integrations (Telebirr, Chapa, CBE Birr), eTax/ERCA, Slack, environment variables |

### Architecture & Code Organization

| Document | Description |
|----------|-------------|
| [AGENTS.md](AGENTS.md) | Full developer guide — project structure, RBAC engine (22 roles, 150+ permissions), backend modules, frontend pages, dev setup, default credentials |
| [STRUCTURE.md](STRUCTURE.md) | Four-phase module map — all frontend routes, API modules, sidebar groups, and their relationships across all 60+ domains |
| [modular-architecture.md](modular-architecture.md) | Core system (`@ovds/core`) — `ModuleInterface` contract, `EventBus`, `ModuleRegistryService`, per-company enable/disable, event catalog |
| [clean-code-structure.md](clean-code-structure.md) | Thin apps / thick libraries — layer rules, dependency ordering, `packages/domains` and `packages/features` layouts, Nx tags, enforcement commands |

### Adding & Migrating Modules

| Document | Description |
|----------|-------------|
| [ADDING-A-MODULE.md](ADDING-A-MODULE.md) | End-to-end playbook — Prisma model → NestJS service → React page → RBAC → sidebar → i18n → pre-merge checklist |
| [module-migration-guide.md](module-migration-guide.md) | Before/after example migrating a legacy `@Module` to the `ModuleInterface` architecture |

### Data & Schema

| Document | Description |
|----------|-------------|
| [DATA-MODEL.md](DATA-MODEL.md) | Generated schema reference — 325 models, 81 enums, 242 tenant-scoped models; multi-tenancy audit; missing `companyId` index table |

### Frontend

| Document | Description |
|----------|-------------|
| [SIDEBAR_UPGRADE_SUMMARY.md](SIDEBAR_UPGRADE_SUMMARY.md) | Sidebar architecture — 12 nav groups, `NavItem`/`NavGroup` interfaces, RBAC filtering, favorites, G-chord shortcuts, files to edit |
| [UI-ENHANCEMENT-GUIDE.md](UI-ENHANCEMENT-GUIDE.md) | UI system — 60-30-10 color rule, typography (tabular-nums), grid layout, table density, keyboard shortcuts, component reference |

### Operations & Deployment

| Document | Description |
|----------|-------------|
| [UPGRADING.md](UPGRADING.md) | Prisma migration workflow, Nx major upgrades, NestJS/React/Prisma version bumps, deprecation strategy, pre-release checklist |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Error response anatomy, symptom→cause→resolution table, HTTP status registry, Prisma `P2002`/`P2025`/`P2034` codes, env & port checklist |
| [DOCS-PORTAL.md](DOCS-PORTAL.md) | Documentation portal pipeline — static MD extraction, live module extractor, CI/CD gates, API, DB schema seeding |
| [SRM-HYBRID-DEPLOYMENT.md](SRM-HYBRID-DEPLOYMENT.md) | SRM hybrid deployment — §3.2–§3.5, §4.2–§4.4: SRM lockout, Options A/B, fiscal printing toggle |

---

## Quick Start

```bash
# 1. Clone and install (Nx monorepo — single install from root)
git clone https://github.com/ovds-platform/ovds.git
cd ovds
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set at minimum:
#   PRISMA_DATABASE_URL="mysql://root:@127.0.0.1:3306/ovds"
#   JWT_SECRET="ovds_secret_key_2026"
#   AUTH0_ENFORCED=false

# 3. Start MySQL (XAMPP)
# C:\xampp\mysql_start.bat
# mysql -u root -e "CREATE DATABASE ovds CHARACTER SET utf8mb4;"

# 4. Push schema and seed demo data
npm run db:push
npm run seed

# 5. Start everything
npm run dev:all
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| Swagger UI | http://localhost:3000/api/docs |
| Prisma Studio | http://localhost:5555 *(run `npm run db:studio`)* |

**Default login:** `superadmin@ovds.com` / `SuperAdmin@2026!` — see [AGENTS.md](AGENTS.md) for all role credentials.

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | NestJS | 11 |
| Frontend | React + Vite | 19 + 6 |
| ORM | Prisma | 7 (`@prisma/adapter-mariadb`) |
| Database | MySQL / MariaDB | 8.0+ / 10.6+ |
| Auth | JWT HS256 + Auth0 RS256 | — |
| Real-time | Socket.io | 4.x |
| Styling | Tailwind CSS | 3.x |
| State | TanStack Query | 5.x |
| Build | Nx monorepo | 23.1.x |

---

## Key Files & Directories

```
ovds/                                   Nx monorepo root
├── apps/
│   ├── backend/src/                    Thin NestJS app — module wiring only
│   │   ├── app.module.ts               Root module — imports domain libs, global guards
│   │   ├── auth/                       JWT + Auth0 guards, login, OTP, Fayda/TIN login
│   │   ├── hr/                         HR controller (employees, attendance, payroll, leaves, gratuity)
│   │   ├── ovds/                       ovds controller (invoices, bills, accounting, VAT, treasury)
│   │   ├── tax/                        Tax controller (VAT, TOT, BIT, DRRF, WHT, pension)
│   │   ├── banking/                    Banking controller (accounts, transactions, transfers)
│   │   ├── crm/                        CRM controller (leads, opportunities, contacts, deals)
│   │   └── common/                     Guards (JwtAuthGuard, RolesGuard, PermissionsGuard), interceptors
│   └── frontend/src/
│       ├── App.tsx                     Route table — all 222 lazy-loaded pages
│       ├── pages/                      222 page components (thin — delegate to features/*)
│       ├── rbac/
│       │   ├── rbac.ts                 RBAC engine — 22 roles, 150+ permissions, ROUTE_POLICY
│       │   ├── AuthContext.tsx         JWT session + all RBAC helpers
│       │   └── Can.tsx                 Declarative RBAC gate component
│       ├── context/
│       │   ├── BusinessContext.tsx     Multi-company context + selectedCompanyId
│       │   └── ThemeContext.tsx        Dark/light mode
│       ├── components/
│       │   ├── sidebar/index.tsx       OVDS_NAV_PARENTS — 12 nav domain groups
│       │   ├── utils/navGroups.ts      NavItem / NavGroup interfaces
│       │   ├── utils/navigation.tsx    ALL_NAV_ITEMS global search index
│       │   └── layout.tsx              routeTitleMap + ROUTE_BREADCRUMBS
│       ├── hooks/                      40+ custom hooks (useApiQuery, useAuditLog, …)
│       ├── services/api.ts             Axios instance with JWT interceptors
│       └── i18n/nav.json              Navigation labels (EN / AM / TI)
├── packages/
│   ├── core/src/                       Kernel — ModuleInterface, EventBus, ModuleRegistry
│   ├── domains/*/                      Backend domain libs (controllers, services, DTOs)
│   ├── features/*/                     Frontend feature libs (pages, components, hooks)
│   ├── modules/*/                      ModuleInterface implementations (per-company enable/disable)
│   ├── shared/src/                     Cross-cutting utils, RBAC types, constants, tax calc
│   ├── database/prisma/
│   │   └── schema.prisma               325 models, 81 enums — single source of truth
│   ├── ui/src/                         Shared React components + Tailwind config
│   ├── design-system/src/              60-30-10 design tokens
│   └── contracts/src/prisma-zod/       Generated Zod types (from prisma-zod generator)
├── postman/                            EIMS/MoR Postman collection + environment
├── docs/                               All documentation (18 sections)
├── scripts/
│   ├── check-arch.mjs                  Architecture boundary enforcement (12 rules)
│   ├── ensure-ports.mjs                Port reservation (3000–3003, 5173–5174)
│   └── deploy.mjs                      Production deploy script
├── ecosystem.config.js                 PM2 process manager config
├── docker-compose.ovds.yml             Docker deployment
├── .env.example                        Environment variable template
└── package.json                        Nx monorepo root scripts
```

---

## Common Dev Commands

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start backend (NestJS watch) + frontend (Vite) concurrently |
| `npm run dev -w @ovds/backend` | Backend only |
| `npm run dev -w ovds-frontend` | Frontend only → localhost:5173 |
| `npm run build:all` | Build libs + backend + frontend |
| `npm run typecheck:all` | TypeScript check all packages |
| `npm run db:push` | Apply Prisma schema to dev DB (never use on prod) |
| `npm run db:migrate:dev` | Create + apply a named migration |
| `npm run db:migrate:prod` | Apply pending migrations to production |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio → localhost:5555 |
| `npm run seed` | Seed demo data (all roles + sample records) |
| `npm run docs:schema` | Regenerate DATA-MODEL.md from schema.prisma |
| `npm run docs:ci` | CI gate — broken links + stale generated docs |
| `node scripts/check-arch.mjs` | Enforce thin-app boundaries (12 rules) |

---

## Adding a New Feature — Quick Checklist

For the full walkthrough see [ADDING-A-MODULE.md](ADDING-A-MODULE.md). Abbreviated:

```
Backend
  □ Prisma model with companyId + @@index([companyId, ...])
  □ db:migrate:dev + db:generate + db:generate:zod
  □ Service: every query filters on companyId
  □ Writes emit AuditLogService.log() (fire-and-forget)
  □ Prisma errors caught → ConflictException / NotFoundException
  □ Controller: JwtAuthGuard + RolesGuard/PermissionsGuard + @ApiTags
  □ Module registered in app.module.ts (or auto-discovered via ModuleInterface)

RBAC
  □ Permission added to ROLE_PERMISSIONS in rbac.ts
  □ Route added to ROUTE_POLICY in rbac.ts

Frontend
  □ Page uses useApiQuery + passes companyId to every call
  □ Mutations inside <Can permission="..."> gates
  □ Lazy import + route in App.tsx
  □ NavItem in apps/frontend/src/components/utils/navGroups.ts
  □ Entry in ALL_NAV_ITEMS (navigation.tsx)
  □ routeTitleMap entry in layout.tsx
  □ i18n keys in apps/frontend/src/i18n/nav.json (EN / AM / TI)

Docs
  □ npm run docs:schema → commit DATA-MODEL.md diff
  □ npm run docs:ci → green
  □ Update this README if a new guide was added
```

---

## Useful Links

| Resource | URL |
|----------|-----|
| Swagger UI (dev) | http://localhost:3000/api/docs |
| Prisma Studio | http://localhost:5555 |
| eTax Portal (ERCA) | https://etax.erca.gov.et |
| AABE (IFRS authority) | https://aabe.gov.et |
| NBE (National Bank) | https://nbe.gov.et |
| MoR Core API (EIMS) | https://core.mor.gov.et |
