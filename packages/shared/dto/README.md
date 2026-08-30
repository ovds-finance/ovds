# @ovds/dto

Shared **Data Transfer Object** library for the OVDS Nx monorepo.

Use this package for `class-validator` / `class-transformer` DTO classes consumed by:

- **NestJS** (`ValidationPipe`, controllers, services)
- **React** (form payloads, API client typing)
- **Prisma** workflows (request/response shapes aligned with DB models)

## Import rules

| Need | Import from |
|------|-------------|
| DTO classes (`CreateInvoiceDto`, `PaginationQueryDto`, …) | `@ovds/dto` |
| Enums, interfaces, RBAC, constants | `@ovds/shared` |
| Prisma client & DB types | `@ovds/database` (backend only) |

```typescript
// Full barrel
import { CreateInvoiceDto, PaginationQueryDto } from '@ovds/dto';

// Domain subpath (smaller bundles)
import { CreateShiftDto } from '@ovds/dto/hr';
import { CreateCompanyDto } from '@ovds/dto/ovds';
```

## Path aliases

Configured in `tsconfig.base.json` for all TypeScript projects:

- `@ovds/dto` → `packages/shared/dto/src/index.ts`
- `@ovds/dto/*` → `packages/shared/dto/src/*`

Vite (`apps/frontend/vite.config.ts`) and NestJS (`apps/backend/tsconfig.json`) inherit these via `extends`.

## Layout

```
packages/shared/dto/src/
  common/       # PaginationQueryDto
  auth/
  ovds/
  hr/
  projects/
  trade/
  loyalty/
  modules/      # DTOs co-located with non-DTO code in @ovds/shared
```

## Build

```bash
npm run build:libs          # builds shared → dto → …
npx nx build dto
npx nx typecheck dto
```

`dto` depends on `@ovds/shared` (enums in `types.ts`). Build order: **shared first**, then **dto**.

## Adding a new DTO

1. Create `packages/shared/dto/src/<domain>/<name>.dto.ts`
2. Import enums from `@ovds/shared/types`
3. Export from `packages/shared/dto/src/<domain>/index.ts`
4. Import in apps via `@ovds/dto` — do **not** add DTOs back into `@ovds/shared`
