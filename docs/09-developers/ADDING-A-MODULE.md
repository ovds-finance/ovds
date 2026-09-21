<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)
     📌 ARCHITECTURE: [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)
     🔄 Last synced: 2026-09-08 -->

# Adding a Module — Full-Stack Playbook

> End-to-end recipe for a new OVDS capability: Prisma model → NestJS backend →
> React frontend → wiring → docs.
>
> Companion docs:
> [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) ·
> [UPGRADING.md](./UPGRADING.md) ·
> [DATA-MODEL.md](./DATA-MODEL.md) ·
> [modular-architecture.md](./modular-architecture.md)

A "module" in OVDS is one **business capability**. It spans three layers and
must satisfy all four invariants before it can be merged:

| Invariant | Rule |
|-----------|------|
| **Tenant isolation** | Every DB query filters on `companyId` — no exceptions |
| **RBAC** | A permission string gates the route on both backend and frontend |
| **Audit** | Every write emits `AuditLogService.log()` (fire-and-forget) |
| **Docs** | `DATA-MODEL.md` regenerated; index updated if a screen was added |

---

## 0. Choose a module home (read first)

OVDS has **two** valid homes for a module. Pick one before writing any code:

### Option A — `packages/modules/<name>` *(preferred for domain features)*

The dominant convention for business-domain modules (HR, ovds, Tax, CRM …).
Each module is an independent Nx package that implements `ModuleInterface` from
`@ovds/core`, registers itself with `ModuleRegistryService`, and can be
**enabled / disabled per company** at runtime.

```
packages/modules/<name>/
├── src/
│   ├── <name>.provider.ts      # ModuleInterface implementation — the entry point
│   ├── <name>.module.ts        # NestJS module (optional if no DI needed)
│   ├── <name>.controller.ts    # REST endpoints
│   ├── <name>.service.ts       # Business logic
│   ├── dto/                    # class-validator DTOs
│   └── events/                 # EventBus listeners for core + other modules
├── prisma/                     # Module-specific schema fragment (optional)
├── package.json                # name: @ovds/module-<name>
├── project.json                # tags: ["type:module"]
└── tsconfig.json
```

Add a `tsconfig.base.json` path alias: `"@ovds/module-<name>": ["packages/modules/<name>/src/index.ts"]`

### Option B — `apps/backend/src/<name>` *(simple admin / utility features)*

Use for features that do not need per-company enable/disable and have no
`ModuleInterface` contract (e.g. system health, audit log, one-off admin APIs).
Generated with the Nx NestJS schematic:

```bash
npx nx g @nx/nest:resource <name> --project=backend --type=rest --crud
```

This scaffolds `<name>.module.ts`, `.controller.ts`, `.service.ts`, and `dto/`
under `apps/backend/src/<name>/`. Register the module in
`apps/backend/src/app.module.ts`.

> **Default to Option A** for any feature end users can toggle. Use Option B
> only when tenant-level enable/disable is not needed.

---

## 0b. Clean-code layer rules (thin apps, thick libraries)

OVDS enforces a **"thin apps, thick libraries"** boundary enforced by `@nx/enforce-module-boundaries` and `scripts/check-arch.mjs`. Understand these before creating any file.

### Where code lives

| Concern | Location | Package name |
|---------|----------|-------------|
| NestJS module wiring (`@Module`) | `apps/backend/src/**/*.module.ts` | — |
| HTTP controllers | `packages/domains/<name>/src/controllers/` | `@ovds/domains-<name>` |
| Business-logic services | `packages/domains/<name>/src/lib/` | `@ovds/domains-<name>` |
| Domain entities / structural types | `packages/domains/<name>/src/entities/` | `@ovds/domains-<name>` |
| DTOs (input/output) | `packages/domains/<name>/src/dto/` | `@ovds/dto` or co-located |
| Domain guards / interceptors | `packages/domains/<name>/src/guards/` | `@ovds/domains-<name>` |
| Domain events + listeners | `packages/domains/<name>/src/events/` | `@ovds/domains-<name>` |
| Prisma schema | `packages/database/prisma/schema.prisma` | `@ovds/database` |
| React pages | `packages/features/<name>/src/pages/` | `@ovds/features/<name>` |
| React components | `packages/features/<name>/src/components/` | `@ovds/features/<name>` |
| React hooks | `packages/features/<name>/src/hooks/` | `@ovds/features/<name>` |
| API client services | `packages/features/<name>/src/services/` | `@ovds/features/<name>` |
| Kernel (registry, event bus) | `packages/core/src/` | `@ovds/core` |

### Dependency ordering

```
@ovds/tokens (design tokens)
   └─ @ovds/ui (dumb components)
        └─ @ovds/features/* (frontend features)
             └─ apps/frontend (thin — routes + providers only)

@ovds/core (kernel)
   └─ @ovds/shared (cross-cutting utils)
        └─ @ovds/domains-* (backend domain libs)
             └─ apps/backend (thin — @Module wiring only)
```

**Hard rules** (enforced at CI — Rule 7, 8, 11, 12):
- `apps/backend` never imports `@ovds/features/*` or `@ovds/ui`
- `apps/frontend` never imports `@ovds/domains-*` or `@ovds/database`
- `packages/domains/*` never cross-imports other domains
- Apps never contain Prisma calls or business logic — those go in domain libs

### Backend domain library layout

```
packages/domains/<name>/
├── project.json          # name: domains-<name>  tags: [scope:backend, type:lib, type:domain, domain:<name>]
├── package.json          # name: @ovds/domains-<name>
├── tsconfig.json
└── src/
    ├── index.ts          # public API barrel — no @Module decorator re-exported
    ├── lib/              # business-logic services
    ├── controllers/      # NestJS controllers (thin, delegate to lib/)
    ├── dto/              # class-validator DTOs
    ├── entities/         # structural types
    ├── guards/           # domain-specific guards
    ├── interceptors/
    ├── events/           # domain event listeners
    └── constants.ts
```

> A domain library **must not** export a `@Module` decorator. NestJS modules stay in `apps/backend` and import services/controllers from the library. This keeps the domain independently testable without the NestJS IoC container.

### Frontend feature library layout

```
packages/features/<name>/
├── project.json          # name: features-<name>  tags: [scope:frontend, type:lib, type:feature, feature:<name>]
├── package.json          # name: @ovds/features/<name>
├── tsconfig.json
└── src/
    ├── index.ts          # public API barrel
    ├── pages/
    ├── components/
    ├── hooks/
    ├── services/
    ├── types/
    └── utils/
```

### Nx project naming & tagging

| Library | `project.json` `name` | `package.json` `name` | Tags |
|---------|----------------------|-----------------------|------|
| Backend domain | `domains-<name>` | `@ovds/domains-<name>` | `scope:backend`, `type:domain` |
| Frontend feature | `features-<name>` | `@ovds/features/<name>` | `scope:frontend`, `type:feature` |
| Module (ModuleInterface) | `module-<name>` | `@ovds/module-<name>` | `scope:shared`, `type:module` |
| Core kernel | `core` | `@ovds/core` | `scope:shared`, `type:core` |

Add a path alias in `tsconfig.base.json`:
```json
"@ovds/domains-<name>": ["packages/domains/<name>/src/index.ts"]
```

### Enforcement commands

Run before every commit:

```bash
node scripts/check-arch.mjs          # fast boundary-violation grep (12 rules)
npx nx affected --target=typecheck   # TypeScript check only affected packages
npm run build:libs                   # full library build
```

---

## 0c. Migrating an existing module to ModuleInterface

If you are moving an existing `apps/backend` module to the `packages/modules/` architecture, follow this checklist (see [module-migration-guide.md](./module-migration-guide.md) for a full before/after example):

- [ ] Create `packages/modules/<name>/src/<name>.provider.ts` implementing `ModuleInterface`
- [ ] Move DTOs into the `dto/` subfolder
- [ ] Move event listeners from the old `onModuleInit` / bootstrap code into `register()` and `boot()`
- [ ] Declare `menus()`, `settings()`, `permissions()` on the provider
- [ ] Add `"type:module"` tag to `project.json`
- [ ] Add `tsconfig.base.json` path alias for `@ovds/module-<name>`
- [ ] Register the provider in `ModuleRegistryService.onModuleInit()` (or rely on auto-discovery)
- [ ] Remove the old `@Module` decorator from `apps/backend` — the NestJS module now just imports the provider's controller/service

---

---

## 1. `ModuleInterface` contract (Option A)

Every Option A module must implement this interface
(`packages/core/src/module.interface.ts`):

```ts
import type { ModuleInterface, ModuleInfo, ModuleRoute,
              MenuItem, ModuleSetting, ModulePermission,
              ModuleHealth } from '@ovds/core';

export class SupportTicketProvider implements ModuleInterface {
  info: ModuleInfo = {
    name:        'support-ticket',
    displayName: 'Support Tickets',
    version:     '1.0.0',
    category:    'operations',   // MODULE_CATEGORIES constant
    dependsOn:   [],             // other module names this requires
  };

  /** Subscribe to EventBus events (core + other modules). */
  register(eventBus: EventBus): void {
    eventBus.on('core.company.created', this.onCompanyCreated.bind(this));
  }

  /** Start background jobs, warm caches — called after all modules register. */
  boot(container: ServiceContainer): void { /* ... */ }

  /** REST / oRPC paths owned by this module. */
  routes(): ModuleRoute[] {
    return [{ path: '/support-tickets', methods: ['GET', 'POST'] }];
  }

  /** Navigation entries injected into the shell sidebar. */
  menus(): MenuItem[] {
    return [{
      key:        'support_tickets',
      label:      'Support Tickets',
      icon:       'TICKET',
      path:       '/support-tickets',
      permission: 'support_tickets:read',
      group:      'operations',
    }];
  }

  /** Company-scoped key/value settings exposed in the Settings UI. */
  settings(): ModuleSetting[] {
    return [{ key: 'support_ticket.sla_hours', type: 'number', default: 24 }];
  }

  /** RBAC permissions this module introduces. */
  permissions(): ModulePermission[] {
    return [
      { key: 'support_tickets:read',  label: 'View tickets' },
      { key: 'support_tickets:write', label: 'Create / update tickets' },
    ];
  }

  async health(): Promise<ModuleHealth> {
    return { status: 'ok', latencyMs: 0 };
  }
}
```

Register in `ModuleRegistryService` (or rely on auto-discovery if the registry
is configured to scan `packages/modules/*/src/*.provider.ts`).

---

## 2. Prisma model

**Schema at a glance:** 325 models · 81 enums · 242 tenant-scoped models · 74 global models.

### Minimum shape

```prisma
model SupportTicket {
  id          String        @id @default(uuid())
  companyId   String                                // tenant isolation — required
  subject     String
  body        String        @db.Text
  status      TicketStatus  @default(OPEN)
  createdById String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([companyId])                              // leading index — required
  @@index([companyId, status])                      // composite for common filters
  @@map("support_ticket")
}

enum TicketStatus { OPEN  IN_PROGRESS  CLOSED }
```

### ⚠️ Missing leading `companyId` index — do not repeat this mistake

The [DATA-MODEL.md](./DATA-MODEL.md) multi-tenancy audit flags **12 models** that carry
`companyId` without a leading index. Tenant-filtered reads on these tables
cannot use an index prefix and degrade as data grows.

| Model | Table | Issue |
|-------|-------|-------|
| `CompanyTaxProfile` | `company_tax_profile` | No `[companyId]` leading index |
| `ContractSnapshot` | `contract_snapshot` | Leading index is `[contractRef, companyId]` |
| `DispatchDocketLine` | `dispatch_docket_line` | No `[companyId]` leading index |
| `FinancialTracking` | `financial_tracking` | No indexes at all |
| `FraudLog` | `fraudlog` | No `[companyId]` leading index |
| `LoyaltyRedemption` | `loyaltyredemption` | No `[companyId]` leading index |
| `NotificationTemplate` | `notificationtemplate` | No indexes at all |
| `OcrExtraction` | `ocr_extraction` | No `[companyId]` leading index |
| `ProjectMilestone` | `project_milestone` | No `[companyId]` leading index |
| `ProjectTask` | `project_task` | No `[companyId]` leading index |
| `ProjectTimesheet` | `project_timesheet` | No `[companyId]` leading index |
| `ReceiptStorage` | `receipt_storage` | No `[companyId]` leading index |

Keep this list at zero for new models.

### Generate the migration

```bash
npm run db:migrate:dev -- --name add-support-ticket
npm run db:generate          # regenerate prisma-client-js
npm run db:generate:zod      # regenerate packages/contracts Zod types
npm run docs:schema          # refresh DATA-MODEL.md — commit the diff
```

> **Never run `db:push` against shared or production environments.**
> Production schema changes flow through `npm run db:migrate:prod` only.
> See [UPGRADING.md](./UPGRADING.md) for the full migration workflow.

---

## 3. Backend (NestJS)

### 3.1 Service — required conventions

```ts
// packages/modules/support-ticket/src/support-ticket.service.ts
@Injectable()
export class SupportTicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(companyId: string, query: PaginationQueryDto) {
    const take = query.take ?? 20;
    const skip = ((query.page ?? 1) - 1) * take;

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: {
          companyId,                                    // ← always scope to company
          ...(query.search && {
            subject: { contains: query.search },
          }),
        },
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        take,
        skip,
      }),
      this.prisma.supportTicket.count({ where: { companyId } }),
    ]);

    return {
      data,
      pagination: { page: query.page ?? 1, take, total, pages: Math.ceil(total / take) },
    };
  }

  async create(companyId: string, userId: string, dto: CreateSupportTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: { ...dto, companyId },
    });
    // Audit — fire-and-forget, never block the response
    this.audit.log(userId, 'SUPPORT_TICKET_CREATED', { id: ticket.id }).catch(() => {});
    return ticket;
  }

  async remove(companyId: string, id: string) {
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!existing)               throw new NotFoundException(`Ticket ${id} not found`);
    if (existing.companyId !== companyId) throw new ForbiddenException();
    return this.prisma.supportTicket.delete({ where: { id } });
  }
}
```

### 3.2 Prisma error recovery

Wrap creates and updates to surface clean HTTP errors instead of raw 500s:

```ts
import { Prisma } from '@prisma/client';
import { ConflictException, NotFoundException } from '@nestjs/common';

try {
  return await this.prisma.supportTicket.create({ data });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':                            // unique constraint
        throw new ConflictException(
          `Duplicate value for: ${(e.meta?.target as string[])?.join(', ')}`,
        );
      case 'P2025':                            // record not found for update/delete
        throw new NotFoundException('Record not found');
      case 'P2003':                            // foreign key — parent missing
        throw new BadRequestException(
          `Referenced record does not exist: ${e.meta?.field_name}`,
        );
    }
  }
  throw e;
}
```

See [TROUBLESHOOTING.md §4](./TROUBLESHOOTING.md#4-prisma-error-codes) for the full
`P2002 / P2003 / P2025 / P2034` reference.

### 3.3 Controller — correct guards and decorators

```ts
// packages/modules/support-ticket/src/support-ticket.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard }     from '../../../apps/backend/src/auth/guards/jwt-auth.guard';
import { RolesGuard }       from '../../../apps/backend/src/auth/guards/roles.guard';
import { PermissionsGuard } from '../../../apps/backend/src/auth/guards/permissions.guard';
import { Permissions }      from '../../../apps/backend/src/auth/decorators/permissions.decorator';
import { Roles }            from '../../../apps/backend/src/auth/decorators/roles.decorator';

@ApiTags('Support Tickets')
@ApiBearerAuth()
@Controller('support-tickets')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)  // ← correct guard order
export class SupportTicketController {
  constructor(private readonly service: SupportTicketService) {}

  @Get()
  @Permissions('support_tickets:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List support tickets' })
  findAll(
    @Request() req: any,                         // companyId comes from the JWT
    @Query() query: PaginationQueryDto,
  ) {
    // Tenant id is extracted from the validated JWT — never trust req.body
    const companyId: string = req.user.companyId;
    return this.service.findAll(companyId, query);
  }

  @Post()
  @Permissions('support_tickets:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a support ticket' })
  create(@Request() req: any, @Body() dto: CreateSupportTicketDto) {
    return this.service.create(req.user.companyId, req.user.userId, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')                                // role-level gate (admin only)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a support ticket' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.companyId, id);
  }
}
```

**Guard reference:**

| Guard | Import path | Purpose |
|-------|------------|---------|
| `JwtAuthGuard` | `src/auth/guards/jwt-auth.guard` | Validates JWT (HS256 local or RS256 Auth0) |
| `RolesGuard` | `src/auth/guards/roles.guard` | Checks `@Roles(...)` decorator — role-level gate |
| `PermissionsGuard` | `src/auth/guards/permissions.guard` | Checks `@Permissions(...)` decorator — fine-grained permission gate |

> ⚠️ There is no `CompanyGuard` or `RBACGuard` class. Tenant scope is enforced
> in the **service layer** by extracting `companyId` from `req.user.companyId`
> (injected by `JwtAuthGuard` from the JWT payload) and filtering every Prisma
> query on it.

### 3.4 Register the module

```ts
// apps/backend/src/app.module.ts
imports: [
  ...,
  SupportTicketModule,   // Option B: direct NestJS module
  // Option A: ModuleRegistryService auto-discovers @ovds/module-support-ticket
],
```

---

## 4. Frontend

### Option A — `packages/features/<name>` *(preferred for domain features)*

Mirror the layout of existing feature packages (`packages/features/banking`, etc.):

```
packages/features/support-ticket/
├── src/
│   ├── components/          # presentational UI
│   ├── hooks/               # useSupportTickets(), etc.
│   ├── pages/               # route-level screens
│   ├── services/            # axios wrappers calling /api/support-tickets
│   ├── types/               # local TypeScript types
│   ├── utils/
│   └── index.ts             # barrel — export public API only
├── package.json             # name: @ovds/features-support-ticket
└── tsconfig.json            # build with tsc
```

Import from app:
```ts
import { SupportTicketList } from '@ovds/features-support-ticket';
```

### Option B — `apps/frontend/src/pages` *(top-level navigable screen)*

```tsx
// apps/frontend/src/pages/SupportTickets.tsx
import { useBusiness } from '../context/BusinessContext';
import { useApiQuery } from '../hooks/useApiQuery';

export default function SupportTickets() {
  const { selectedCompanyId } = useBusiness();
  const { data, isLoading } = useApiQuery<SupportTicket[]>(
    `/support-tickets?companyId=${selectedCompanyId}`,
    { enabled: !!selectedCompanyId, deps: [selectedCompanyId] },
  );
  if (isLoading) return <Skeleton />;
  return <TicketList items={data ?? []} />;
}
```

Service layer (always pass `companyId`):
```ts
// apps/frontend/src/services/supportTicketApi.ts
import { apiGet, apiPost, apiDelete } from './api';

export const getTickets = (companyId: string) =>
  apiGet<SupportTicket[]>(`/support-tickets?companyId=${companyId}`);

export const createTicket = (dto: CreateSupportTicketDto) =>
  apiPost<SupportTicket>('/support-tickets', dto);
```

### 4.1 RBAC gates on mutations

Wrap every write action in a `<Can>` gate and emit an audit event:

```tsx
import { Can }          from '../rbac/Can';
import { useAuditLog }  from '../rbac/useAuditLog';
import { invalidateQueryPrefix } from '../hooks/useApiQuery';

const { log } = useAuditLog();

const handleDelete = async (id: string) => {
  await apiDelete(`/support-tickets/${id}`);
  log('SUPPORT_TICKET_DELETED', { id }, 'SupportTicket', id);
  invalidateQueryPrefix('/support-tickets');
};

// Declarative gate — hides the button entirely if permission is absent
<Can permission="support_tickets:write" fallback={<ReadOnly />}>
  <NewTicketButton />
</Can>
```

---

## 5. Wire RBAC, routing, sidebar & i18n

### 5.1 RBAC — `apps/frontend/src/rbac/rbac.ts`

Add to `ROLE_PERMISSIONS` (which roles get the new permissions):
```ts
ROLE_PERMISSIONS['ADMIN'] = [
  ...ROLE_PERMISSIONS['ADMIN'],
  'support_tickets:read',
  'support_tickets:write',
];
```

Add to `ROUTE_POLICY`:
```ts
ROUTE_POLICY['/support-tickets'] = 'support_tickets:read';
```

Add to `RESOURCE_DOMAINS` and `PERMISSION_GROUPS` if the feature warrants its
own permissions matrix row in the UI.

Mark as `SENSITIVE_ROUTES` if the route requires MFA step-up for Auth0 users
(financial or admin routes typically do).

### 5.2 Frontend routing — `apps/frontend/src/App.tsx`

```tsx
const SupportTickets = lazyWithRetry(
  () => import('./pages/SupportTickets'),
);

// Add to ROUTES array:
['/support-tickets', SupportTickets],
// Or with a RouteHandle for a slider/modal/wizard:
['/support-tickets', SupportTickets, {
  layout: 'inline',
  inline: { title: 'Support Tickets' },
  meta: { module: 'support-ticket', entity: 'ticket' },
}],
```

### 5.3 Sidebar — `navGroups.ts` / `navigation.tsx`

Add a `NavItem` to the correct domain group in `apps/frontend/src/components/utils/navGroups.ts`:

```ts
{
  key:        'support_tickets',
  label:      'nav.support_tickets',      // i18n key
  icon:       'TICKET',
  path:       '/support-tickets',
  permission: 'support_tickets:read',
  pinnable:   true,
  isNew:      true,                       // shows "New" badge — remove after 1 release
}
```

Add to `ALL_NAV_ITEMS` in `apps/frontend/src/components/utils/navigation.tsx` for the global search index.

### 5.4 Page title — `Layout.tsx`

```ts
// apps/frontend/src/components/layout.tsx → routeTitleMap
routeTitleMap['/support-tickets'] = 'nav.support_tickets';
```

### 5.5 Breadcrumbs — `Header.tsx`

```ts
ROUTE_BREADCRUMBS['/support-tickets'] = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Support Tickets' },
];
```

### 5.6 i18n — `nav.json`

All navigation labels live in `apps/frontend/src/i18n/nav.json`. Add keys to all three locales:

```json
{
  "default": { "nav": { "support_tickets": "Support Tickets" } },
  "am":      { "nav": { "support_tickets": "የድጋፍ ትኬቶች" } },
  "en":      { "nav": { "support_tickets": "Support Tickets" } }
}
```

### 5.7 Keyboard shortcut (optional)

Register a G-chord shortcut in `apps/frontend/src/components/sidebar.tsx`:

```ts
// SHORTCUT_HINTS map
'/support-tickets': 'G S',

// chordMap in layout.tsx
's': '/support-tickets',
```

---

## 6. Docs & finish

```bash
npm run docs:schema      # refresh DATA-MODEL.md — commit the diff
npm run docs:ci          # CI gate: broken links + stale generated docs
```

---

## 7. Pre-merge checklist

### Prisma / Database
- [ ] Model has `companyId` **and** a leading `@@index([companyId, ...])`
- [ ] Migration file committed (`db:migrate:dev --name <desc>`)
- [ ] Prisma clients regenerated (`db:generate` + `db:generate:zod`)
- [ ] `DATA-MODEL.md` regenerated and diff reviewed (`docs:schema`)
- [ ] No `db:push` used against any shared or production environment

### Backend
- [ ] Every service method filters on `companyId` — no cross-tenant reads
- [ ] Writes emit `AuditLogService.log()` (fire-and-forget `.catch(() => {})`)
- [ ] Prisma errors caught and re-thrown as `ConflictException` / `NotFoundException` (not raw 500)
- [ ] Controller uses `JwtAuthGuard` + `RolesGuard` / `PermissionsGuard` — **not** `CompanyGuard` or `RBACGuard` (those don't exist)
- [ ] `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation` on every controller + endpoint
- [ ] Module registered in `app.module.ts` (Option B) or auto-discovered (Option A)

### Frontend
- [ ] Page uses `useApiQuery` + passes `companyId` to every API call
- [ ] Mutations wrapped in `<Can permission="...">` gates
- [ ] `AuditLog` event emitted on delete / sensitive writes
- [ ] Permission added to `ROLE_PERMISSIONS` in `rbac.ts`
- [ ] Route added to `ROUTE_POLICY` in `rbac.ts`
- [ ] Lazy import + route entry in `App.tsx`
- [ ] `NavItem` added to `navGroups.ts` + `ALL_NAV_ITEMS`
- [ ] `routeTitleMap` entry in `Layout.tsx`
- [ ] `ROUTE_BREADCRUMBS` entry in `Header.tsx`
- [ ] i18n keys added to all three locales in `apps/frontend/src/i18n/nav.json` (`default`, `am`, `en`)
- [ ] `isNew: true` badge added (remove after next release cycle)

### Quality & Docs
- [ ] `npm run docs:schema` re-run; diff committed
- [ ] `npm run docs:ci` passes (no broken links, no stale generated docs)
- [ ] `docs/README.md` index updated if a new navigable screen or guide was added
- [ ] If this is a sensitive/financial route: added to `SENSITIVE_ROUTES` in `rbac.ts`

---

## Related guides

| Guide | When to read |
|-------|-------------|
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Guards return unexpected 401/403; Prisma throws P2002/P2025 |
| [UPGRADING.md](./UPGRADING.md) | Schema migration workflow; rollback strategy; Nx/Prisma version bumps |
| [DATA-MODEL.md](./DATA-MODEL.md) | 325-model schema reference; multi-tenancy audit; missing index table |
| [modular-architecture.md](./modular-architecture.md) | `ModuleInterface` full contract; event catalog; per-company enable/disable |
| [module-migration-guide.md](./module-migration-guide.md) | Before/after example migrating a legacy `@Module` to `ModuleInterface` |
| [clean-code-structure.md](./clean-code-structure.md) | Thin apps / thick libraries rules; dependency ordering; Nx tag conventions |
| [API.md](./API.md) | All endpoint reference + DTO shapes + guard order |
| [AGENTS.md](./AGENTS.md) | RBAC engine API; 22 roles; 150+ permissions reference |
| [SIDEBAR_UPGRADE_SUMMARY.md](./SIDEBAR_UPGRADE_SUMMARY.md) | Nav group map; `NavItem`/`NavGroup` interfaces; keyboard shortcuts; files to edit |

---

## 8. Marketplace Download Pipeline

> This section documents the programmatic download and installation system that
> backs the **OVDS App Store** (`/app-store`). It replaces the old "click a link,
> manually copy files" workflow with a fully automated, backend-controlled pipeline
> inspired by [Akaunting's App Store](https://akaunting.com/blog/akaunting-app-store).

### Architecture overview

```
React App Store UI  →  NestJS ModuleDownloadController  →  ModuleDownloadService
      ↓                            ↓                              ↓
  ApiKeyModal               /api/modules/*              ON_PREMISE pipeline
  DownloadProgressBanner    /api/appstore/*             SAAS pipeline
  useAppInstallations hook                              Prisma ModuleDownloadJob
```

The system operates in two completely separate execution paths depending on the
deployment environment — controlled by the `IS_SAAS` environment variable.

### Execution paths

#### On-Premises (self-hosted, `IS_SAAS=false`)

The NestJS backend physically owns the download:

1. **React** collects the operator's OVDS Marketplace API key via `ApiKeyModal`
2. **React** calls `POST /api/modules/download-local` with `{ moduleAlias, apiKey }`
3. **NestJS** creates a `ModuleDownloadJob` row (`status: PENDING`) and returns it immediately
4. **NestJS** runs the download pipeline asynchronously:
   - Validates the API key against `marketplace.ovds.com.et/api/modules/:alias/validate`
   - Streams the ZIP to `OVDS_TMP_DIR/<alias>-<ts>.zip` using Node's built-in `http/https`
   - Computes SHA-256 of the downloaded file and persists it on the job row
   - Extracts to `OVDS_MODULES_PATH/<moduleAlias>/` (system `unzip` first, then streaming inflate fallback)
   - Cleans up the temp ZIP
   - Upserts `CompanyModule` (enabled) and `AppInstallation` (ACTIVE) rows
   - Sets job `status: DONE`, `progress: 100`
5. **React** polls `GET /api/modules/download-status/:jobId` every 2 s via `useAppInstallations`
6. **React** renders a `DownloadProgressBanner` strip with a live progress bar

```
PENDING → DOWNLOADING (5–79%) → EXTRACTING (80–94%) → ACTIVATING (95%) → DONE
                                                                        ↘ FAILED
```

#### SaaS / Cloud (`IS_SAAS=true`)

All module code is pre-bundled into the cluster image at build time.
"Installing" an extension is a **pure database operation** — no filesystem writes occur.

1. **React** calls `POST /api/modules/activate-saas` with `{ moduleAlias }`
2. **NestJS** creates a job (`status: ACTIVATING`) and immediately runs:
   - Validates the API key (skipped if `SKIP_MARKETPLACE_VALIDATION=true`)
   - Upserts `CompanyModule` (enabled) and `AppInstallation` (ACTIVE)
   - Sets job `status: DONE`
3. **React** receives the completed job in the same response — no polling required

This approach guarantees ephemeral Docker containers are never mutated at runtime,
preventing state drift between pod replicas.

### Key files

| File | Role |
|------|------|
| `packages/database/prisma/schema.prisma` | `ModuleDownloadJob` model — tracks every install job per tenant |
| `apps/backend/src/platform/module-download.service.ts` | Both pipelines: streaming download, ZIP extraction, DB activation |
| `apps/backend/src/platform/module-download.controller.ts` | REST endpoints: `download-local`, `activate-saas`, `download-status/:id`, `download-jobs`, `cancel` |
| `apps/backend/src/platform/platform.module.ts` | Registers `ModuleDownloadController` + `ModuleDownloadService` |
| `packages/features/appstore/src/services/appstoreApi.ts` | `moduleDownloadApi` client — `downloadLocal`, `activateSaaS`, `getJobStatus`, `listJobs`, `cancelJob` |
| `packages/features/appstore/src/hooks/useAppInstallations.ts` | React hook — exposes `install`, `uninstall`, `activeJobs`, `installing` |
| `apps/frontend/src/pages/AppStore.tsx` | `DownloadProgressBanner`, `ApiKeyModal`, wired `handleInstall` |

### REST endpoints

All endpoints require `Authorization: Bearer <JWT>` and `apps:write` permission
(read-only poll endpoint requires `apps:read`).

```
POST /api/modules/download-local
  Body:   { moduleAlias: string; apiKey: string }
  Guard:  IS_SAAS=false only — 400 otherwise
  Returns: ModuleDownloadJob (PENDING/DOWNLOADING)

POST /api/modules/activate-saas
  Body:   { moduleAlias: string }
  Guard:  IS_SAAS=true only — 400 otherwise
  Returns: ModuleDownloadJob (DONE)

GET  /api/modules/download-status/:jobId   (apps:read)
  Returns: ModuleDownloadJob with live progress 0-100

GET  /api/modules/download-jobs            (apps:read)
  Returns: ModuleDownloadJob[] — last 50 for the company

POST /api/modules/download-jobs/:jobId/cancel
  Returns: ModuleDownloadJob (CANCELLED)
```

`companyId` is always extracted from the JWT — never trusted from the request body.

### Prisma model

```prisma
model ModuleDownloadJob {
  id             String    @id @default(uuid())
  companyId      String
  moduleAlias    String    // e.g. "erca-etax"
  status         String    // PENDING | DOWNLOADING | EXTRACTING | ACTIVATING | DONE | FAILED | CANCELLED
  deploymentType String    // ON_PREMISE | SAAS
  downloadUrl    String?   // remote URL (on-premise only)
  targetPath     String?   // extraction path on server disk (on-premise only)
  progress       Int       // 0-100
  message        String?   // human-readable status message
  sha256         String?   // checksum of downloaded ZIP (on-premise only)
  triggeredBy    String?   // username who triggered
  startedAt      DateTime?
  completedAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  company  Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@index([companyId, moduleAlias])
  @@index([status])
  @@map("module_download_job")
}
```

Run `npm run db:push && npm run db:generate` after pulling this schema change.

### React integration

```tsx
import { useAppInstallations, moduleDownloadApi } from '@ovds/features/appstore';

// Inside your component:
const {
  installedIds,   // Set<appId> — ACTIVE installs
  activeJobs,     // Map<moduleAlias, ModuleDownloadJob> — in-progress jobs
  installing,     // Set<appId> — currently going through install pipeline
  install,        // (appId, moduleAlias, apiKey?) => Promise<void>
  uninstall,      // (appId) => Promise<void>
} = useAppInstallations({ companyId, enabled: !!companyId });

// Install (SaaS — no API key needed):
await install('erca-etax', 'erca-etax');

// Install (on-premise — API key required):
await install('erca-etax', 'erca-etax', 'ovds_live_xxxx');

// Manually cancel a job:
await moduleDownloadApi.cancelJob(job.jobId);
```

The hook automatically polls `GET /api/modules/download-status/:jobId` every
2 seconds for non-terminal jobs and stops when status reaches `DONE`, `FAILED`,
or `CANCELLED`. On `DONE` it re-fetches the installations list so `installedIds`
updates without a page reload.

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `IS_SAAS` | `false` | `true` → logical-only activation; `false` → physical ZIP download |
| `OVDS_MARKETPLACE_URL` | `https://marketplace.ovds.com.et` | Base URL for the marketplace API |
| `OVDS_MODULES_PATH` | `<cwd>/modules` | Destination root for on-premise extractions |
| `OVDS_TMP_DIR` | `<OVDS_MODULES_PATH>/.tmp` | Temp directory for ZIP staging |
| `SKIP_MARKETPLACE_VALIDATION` | `false` | Set `true` in dev to skip key validation network call |
| `VITE_IS_SAAS` | `false` | Frontend flag — controls `ApiKeyModal` visibility |

### Security notes

- The `moduleAlias` is URL-encoded before being interpolated into the marketplace
  URL, preventing path-traversal injection.
- The `targetPath` is constructed as `path.join(OVDS_MODULES_PATH, moduleAlias)`
  — `moduleAlias` must not contain `..` or `/`. Add a regex guard if user-supplied
  aliases are accepted.
- API keys are transmitted as query parameters to the marketplace (matching its
  existing API contract) but are **never stored** in OVDS — only the `moduleAlias`
  and job metadata are persisted.
- The `companyId` on every job row is always taken from the validated JWT, not
  from the request body, maintaining tenant isolation.

### Infrastructure comparison

| Element | On-Premises | SaaS/Cloud |
|---------|-------------|-----------|
| Download method | Node `http.get()` streams ZIP to `OVDS_TMP_DIR` | None — code pre-bundled in image |
| Extraction | System `unzip` (fallback: Node `zlib inflateRaw`) | None |
| Filesystem writes | `OVDS_MODULES_PATH/<alias>/` | Never |
| Prisma role | Tracks job + activates `CompanyModule` + `AppInstallation` | Primary activation mechanism |
| Job polling | Required — async pipeline (seconds to minutes) | Not required — job completes synchronously |
| Security surface | ZIP path-traversal guard; SHA-256 integrity check | Minimal — no code execution paths |

### Pre-merge checklist (marketplace modules)

- [ ] `ModuleDownloadJob` migration applied (`npm run db:push`)
- [ ] `IS_SAAS` set correctly in `.env` for the target environment
- [ ] `OVDS_MODULES_PATH` directory exists and is writable by the NestJS process
- [ ] `OVDS_MARKETPLACE_URL` reachable from the server network
- [ ] API key validated with `GET <OVDS_MARKETPLACE_URL>/api/modules/:alias/validate`
- [ ] Frontend `VITE_IS_SAAS` matches backend `IS_SAAS`
- [ ] `npm run db:generate` run after schema change
