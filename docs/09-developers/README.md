<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Developers

Technical reference for building on, extending, and deploying OVDS. The system is fully open — every module, route, and permission is configurable.

---

## Documents in This Section

| Document | Description |
|----------|-------------|
| [AGENTS.md](AGENTS.md) | Full developer guide: project structure, RBAC engine, backend modules, frontend pages, dev setup |
| [API.md](API.md) | REST API reference: all endpoints, authentication, pagination, error codes, WebSocket events |
| [WEBHOOKS.md](WEBHOOKS.md) | Webhooks, App Store, payment gateway integrations, eTax/ERCA, Slack, environment variables |
| [STRUCTURE.md](STRUCTURE.md) | System organization: navigational flow, expanded modules, unified concepts |
| [SIDEBAR_UPGRADE_SUMMARY.md](SIDEBAR_UPGRADE_SUMMARY.md) | Role-aware sidebar: domain ordering, urgency alerts, view modes, state management |
| [DOCS-PORTAL.md](DOCS-PORTAL.md) | Documentation portal pipeline: static MD extraction, live module extractor, CI/CD, API, DB schema |
| [UI-ENHANCEMENT-GUIDE.md](UI-ENHANCEMENT-GUIDE.md) | UI system: 60-30-10 color rule, typography, grid layout, table density, keyboard shortcuts |
| [SRM-HYBRID-DEPLOYMENT.md](SRM-HYBRID-DEPLOYMENT.md) | SRM hybrid deployment: §3.2–§3.5, §4.2–§4.4 — SRM lockout, Options A/B, fiscal printing toggle |

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/ovds-platform/ovds.git
cd ovds
npm install

# Configure
cp .env.example .env
# Edit .env — set PRISMA_DATABASE_URL and JWT_SECRET

# Database
npm run db:push
npm run seed

# Start
npm run dev:all
```

**URLs:** Frontend `localhost:5173` · API `localhost:3000/api` · Swagger `localhost:3000/api/docs`

**API Key (Cloud):** Sign up at [ovds.com.et](https://ovds.com.et) → log in at [ovds.com.et/login](https://ovds.com.et/login) → copy the API key from the top of your Account Dashboard → paste it in the Company Setup Wizard.

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | NestJS | 11 |
| Frontend | React + Vite | 18 + 5 |
| ORM | Prisma | 7 |
| Database | MySQL / MariaDB | 8.0+ / 10.6+ |
| Auth | JWT (HS256) + Auth0 (RS256) | — |
| Real-time | Socket.io | 4.x |
| Styling | Tailwind CSS | 3.x |
| State | React Query (TanStack) | 5.x |

---

## Key Files

```
ovds/                               # Nx monorepo root
├── apps/
│   ├── backend/src/                # NestJS feature modules
│   │   ├── app.module.ts           # Root module — guard order, global config
│   │   ├── auth/                   # JWT + Auth0, login, guards, RBAC
│   │   ├── ovds/                # invoice, billing, accounting, VAT, treasury
│   │   ├── hr/                     # Employees, payroll, attendance, leaves, shifts
│   │   ├── dashboard/              # Analytics, strategic insights (30 s cache)
│   │   ├── settings/               # SystemSetting key-value store
│   │   ├── notifications/          # Email/Slack/Intercom + WebSocket push
│   │   └── common/                 # Guards, interceptors, middleware, DTOs
│   └── frontend/src/
│       ├── App.tsx                 # Route table — all 90 lazy-loaded pages
│       ├── pages/                  # 90 page components
│       │   └── admin/              # Admin-only pages (NotificationSettings)
│       ├── components/             # Shared UI components
│       ├── rbac/
│       │   ├── rbac.ts             # Core RBAC engine (22 roles, 150+ permissions)
│       │   ├── AuthContext.tsx     # JWT session + RBAC helpers
│       │   └── Auth0ProviderWrapper.tsx
│       ├── context/
│       │   ├── BusinessContext.tsx # Multi-company context
│       │   └── ThemeContext.tsx    # Dark/light mode
│       ├── hooks/                  # 40+ custom React hooks
│       └── services/api.ts         # Axios instance with interceptors
├── packages/
│   ├── shared/src/                 # Shared DTOs, types, RBAC, constants, tax calc
│   ├── database/prisma/            # schema.prisma (130 models) + migrations + seed
│   ├── ui/src/                     # Shared React UI components + Tailwind config
│   └── design-system/src/          # Design tokens (60-30-10 color system)
├── docs/                           # All documentation (18 sections + root files)
├── scripts/                        # docs-ci.mjs, seed-docs.mjs, extract-module-docs.mjs
├── ecosystem.config.js             # PM2 process manager config
├── docker-compose.yml              # Docker deployment
├── Dockerfile                      # 3-stage build (frontend → backend → runtime)
├── .env.example                    # Environment variable template
└── package.json                    # Nx monorepo root scripts
```

---

## Adding a New Page

1. **Create the page component:**
   ```tsx
   // frontend/src/pages/MyFeature.tsx
   export default function MyFeature() {
     usePageTitle('My Feature');
     return <div>...</div>;
   }
   ```

2. **Register the lazy import in `App.tsx`:**
   ```tsx
   const MyFeature = lazyWithRetry(() => import('./pages/MyFeature'));
   ```

3. **Add to the ROUTES array in `App.tsx`:**
   ```tsx
   ['/my-feature', MyFeature],
   ```

4. **Add to RBAC route policy in `rbac.ts`:**
   ```typescript
   ROUTE_POLICY['/my-feature'] = 'my_feature:read';
   ```

5. **Add to the sidebar in `Sidebar.tsx`** — find the appropriate domain and add an item.

---

## Adding a New Backend Module

```bash
# Generate NestJS module scaffold
npx nest g module my-module
npx nest g controller my-module
npx nest g service my-module
```

```typescript
// src/my-module/my-module.service.ts
@Injectable()
export class MyModuleService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.myModel.findMany({
      where: { companyId },  // ← always scope to company
    });
  }
}
```

```typescript
// src/my-module/my-module.controller.ts
@Controller('my-module')
@UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)
@Roles('my_module:read')
export class MyModuleController {
  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll(req['companyId']);
  }
}
```

Register in `app.module.ts`:
```typescript
imports: [..., MyModuleModule]
```

---

## RBAC Engine

The RBAC engine (`packages/shared/src/rbac.ts` + `apps/frontend/src/rbac/rbac.ts`) is the single source of truth for all permissions.

```typescript
import { rbac } from '../rbac/rbac';

// Check a single permission
rbac.can('ovds', 'invoices:write')  // true

// Check route access
rbac.canAccessRoute('EMPLOYEE', '/payroll-administration')  // false

// Get all permissions for a role
rbac.permissionsFor('HR')  // Permission[]

// Check hierarchy
rbac.isAtLeast('ovds', 'ACCOUNTING')  // true (60 >= 55)
```

See [AGENTS.md](AGENTS.md) for the complete RBAC reference including all engine methods, hooks, and ABAC options.

---

## Useful Links

- **Swagger UI:** `http://localhost:3000/api/docs`
- **Prisma Studio:** `npm run db:studio` → `http://localhost:5555`
- **eTax Portal:** [etax.erca.gov.et](https://etax.erca.gov.et)
- **AABE (IFRS):** [aabe.gov.et](https://aabe.gov.et)
- **NBE (National Bank):** [nbe.gov.et](https://nbe.gov.et)




