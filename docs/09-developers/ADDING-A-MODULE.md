<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)
     📌 ARCHITECTURE: [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md) -->

# Adding a Module (Full-Stack Playbook)

> End-to-end recipe for a new OVDS capability: Prisma model → NestJS (backend) →
> React (frontend) → wiring → docs. Follows this repo's conventions so the new module
> slots into the existing RBAC, multi-tenancy, audit, and docs pipelines.
>
> Companion: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) · [UPGRADING.md](./UPGRADING.md) · [DATA-MODEL.md](./DATA-MODEL.md)

A "module" here = one business capability. It spans three layers and must satisfy all of:

- **Tenant isolation** — every query filters on `companyId`.
- **RBAC** — a permission string gates the route, both backend and frontend.
- **Audit** — every write emits an `AuditLogService.log()`.
- **Docs** — the data model is regenerated and the index is updated.

---

## 0. Two frontend conventions (read first)

OVDS has **two** valid frontend homes for feature UI. Pick one per module:

1. **`packages/features/<name>`** — the repo's dominant convention (e.g.
   `packages/features/banking`). Hand-rolled package with
   `components/ hooks/ pages/ services/ types/ utils/` + `index.ts`, published as
   `@ovds/features-<name>`, built with `tsc` (not an Nx-built-in target). **Default to
   this for business-domain features.**
2. **`apps/frontend/src/pages/...`** — route-level pages wired through `App.tsx`,
   `Sidebar.tsx`, and `rbac.ts`. Use for top-level navigable screens.

The backend is generated with Nx/NestJS schematics in all cases.

---

## 1. Prisma model

Add the model to `packages/database/prisma/schema.prisma`. Minimum shape:

```prisma
model SupportTicket {
  id        String   @id @default(uuid())
  companyId String                          // tenant isolation — required
  subject   String
  status    TicketStatus @default(OPEN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([companyId])                       // leading index prefix (perf + tenant queries)
  @@index([companyId, status])               // composite for common filtered reads
  @@map("support_ticket")
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  CLOSED
}
```

Then generate the migration and clients:

```bash
npm run db:migrate:dev -- --name add-support-ticket
npm run db:generate          # prisma-client-js
npm run db:generate:zod      # packages/contracts Zod types (the `zod` generator)
npm run docs:schema          # refresh DATA-MODEL.md so the diff is in your PR
```

> Avoid `db:push` in shared environments (see [UPGRADING.md](./UPGRADING.md)). Keep
> `companyId` present and indexed — the data-model audit flags the 12 existing models
> that miss the leading index; don't add to that list.

---

## 2. Backend (NestJS)

### 2.1 Generate the resource

Use the Nx Nest generator (wraps `@nestjs/schematics`, so plain `nest g resource` also
works):

```bash
npx nx g @nx/nest:resource support-ticket \
  --project=backend --type=rest --crud
```

This scaffolds `support-ticket.module.ts`, `.controller.ts`, `.service.ts`, and DTOs
under `apps/backend/src/support-ticket/`. Register the module in
`apps/backend/src/app.module.ts` if it isn't auto-imported.

### 2.2 Harden the service (required conventions)

```ts
@Injectable()
export class SupportTicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(companyId: string, query: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { companyId, ...(query.search && { subject: { contains: query.search } }) },
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        take: query.take ?? 20,
        skip: ((query.page ?? 1) - 1) * (query.take ?? 20),
      }),
      this.prisma.supportTicket.count({ where: { companyId } }),
    ]);
    return { data, pagination: { page: query.page, take: query.take, total, pages: Math.ceil(total / (query.take ?? 20)) } };
  }

  async create(companyId: string, userId: string, dto: CreateSupportTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: { ...dto, companyId },
    });
    this.audit.log(userId, 'SUPPORT_TICKET_CREATED', { id: ticket.id }).catch(() => {});
    return ticket;
  }

  async remove(id: string) {
    const existing = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Ticket ${id} not found`);
    return this.prisma.supportTicket.delete({ where: { id } });
  }
}
```

Catch Prisma errors with the shared helper (it turns `P2002` into `ConflictException`):

```ts
try { return await this.prisma.supportTicket.create({ data }); }
catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) this.prisma.handlePrismaError(e);
  throw e;
}
```

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) §4 for the `P2002`/`P2025`/`P2003` map.

### 2.3 Guard & annotate the controller

Real guards in this repo: `JwtAuthGuard`, `PermissionsGuard`, `RolesGuard`
(no `CompanyGuard`/`RBACGuard` class exists — tenant scope is enforced in the service via
`companyId`). Apply auth + role guards and Swagger metadata:

```ts
@ApiTags('Support Tickets')
@Controller('support-tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupportTicketController {
  @Get()
  @Roles('ADMIN', 'SUPPORT')
  findAll(@CurrentUser('companyId') companyId: string, @Query() q: PaginationQueryDto) {
    return this.service.findAll(companyId, q);
  }
}
```

Inject the tenant id from the JWT with `@CurrentUser('companyId')` (defined in
`apps/backend/src/auth/`). Never trust `companyId` from the request body for tenant
filtering.

---

## 3. Frontend

### Option A — `packages/features/<name>` (preferred for domain features)

Mirror the existing `packages/features/banking` layout:

```
packages/features/support-ticket/
├── src/
│   ├── components/   # presentational UI
│   ├── hooks/        # useSupportTickets() wrapping the API
│   ├── pages/        # route screens (if navigable)
│   ├── services/     # axios calls via apps/frontend/src/services/api.ts
│   ├── types/        # local TS types
│   ├── utils/
│   └── index.ts      # barrel: export public API
├── package.json      # name: @ovds/features-support-ticket
└── tsconfig.json     # build with tsc
```

Publish as `@ovds/features-support-ticket` and import it from the app or other features.

### Option B — `apps/frontend/src/pages` (top-level screen)

```tsx
// apps/frontend/src/pages/SupportTickets.tsx
import { useBusiness } from '../context/BusinessContext';
import { useApiQuery } from '../hooks/useApiQuery';

export default function SupportTickets() {
  const { selectedCompanyId } = useBusiness();
  const { data, loading } = useApiQuery<SupportTicket[]>(
    `/support-tickets?companyId=${selectedCompanyId}`,
    { enabled: !!selectedCompanyId, deps: [selectedCompanyId] },
  );
  if (loading) return <Skeleton />;
  return <TicketList items={data ?? []} />;
}
```

Service call via the shared axios instance (always pass `companyId`):

```ts
// apps/frontend/src/services/supportTicketApi.ts
import { apiGet, apiPost } from './api';
export const getTickets = (companyId: string) =>
  apiGet<SupportTicket[]>(`/support-tickets?companyId=${companyId}`);
```

### 3.1 Wrap mutations in RBAC + audit

```tsx
<Can permission="support_tickets:write" fallback={<ReadOnly />}>
  <NewTicketButton />
</Can>

const { log } = useAuditLog();
const handleDelete = async (id: string) => {
  await apiDelete(`/support-tickets/${id}`);
  log('SUPPORT_TICKET_DELETED', { id }, 'SupportTicket', id);
  invalidateQueryPrefix('/support-tickets');
};
```

---

## 4. Wire RBAC, routing & i18n

1. **Permission** — add `support_tickets:read` / `:write` to the right group in
   `frontend/src/rbac/rbac.ts` (`ROLE_PERMISSIONS`), assign to `ADMIN`/`SUPPORT`, and
   add to `RESOURCE_DOMAINS` / `PERMISSION_GROUPS` if applicable.
2. **Route policy** — add `'/support-tickets': 'support_tickets:read'` to `ROUTE_POLICY`.
3. **Backend guard** — `@Roles('ADMIN', 'SUPPORT')` (§2.3).
4. **Navigation** — if it's a screen, add a `Sidebar.tsx` entry (with permission key),
   a lazy import in `App.tsx`, a `routeTitleMap` entry in `Layout.tsx`, and a
   `ROUTE_BREADCRUMBS` entry in `Header.tsx`.
5. **i18n** — add the keys to all three sections (`default`/`am`/`en`) in
   `frontend/src/assets/i18n.json`.

Sensitive/financial routes also go in `SENSITIVE_ROUTES` (MFA step-up for Auth0 users).

---

## 5. Docs & finish

```bash
npm run docs:schema      # refresh DATA-MODEL.md (commit the diff)
# update docs/README.md index if you added a navigable screen/guide
npm run docs:ci          # CI gate: broken links + stale generated docs
```

Pre-merge checklist:

- [ ] Prisma model has `companyId` + leading `@@index([companyId, ...])`
- [ ] Migration committed (`db:migrate:dev`); clients regenerated
- [ ] Backend service filters every query on `companyId`
- [ ] Writes emit `AuditLogService.log()`; Prisma errors via `handlePrismaError`
- [ ] Controller uses `JwtAuthGuard` + `RolesGuard`; `@ApiTags`/`@ApiBearerAuth`
- [ ] Frontend uses `useApiQuery` + `<Can>`; passes `companyId`
- [ ] Permission in `rbac.ts`; route in `ROUTE_POLICY`; nav/i18n updated
- [ ] `DATA-MODEL.md` regenerated; `docs:ci` green
