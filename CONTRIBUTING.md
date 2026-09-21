# Contributing to OVDS

## Architecture Overview

OVDS is a full-stack Nx monorepo with strict separation between frontend (React), backend (NestJS), and shared packages. The architecture enforces these boundaries through ESLint rules, TypeScript path aliases, and shared libraries.

## Package Structure

```
apps/
├── frontend/          # React app (Vite + Tailwind)
├── backend/           # NestJS app
└── portal/            # Public portal app

packages/
├── design-tokens/     # 🎨 Single source of truth for colors, fonts, spacing
├── design-system/     # TypeScript token objects + status color utilities
├── ui/                # React component library (Radix + Tailwind)
├── shared/
│   ├── dto/           # 🔄 Zod schemas + class-validator DTOs + serializers
│   └── ...            # Types, utils, constants
├── contracts/         # NestJS pipes, filters, interceptors, Zod schemas
├── database/          # Prisma schema + client (backend only)
├── core/              # Framework-agnostic kernel
├── domains/           # Domain-specific logic
├── features/          # Feature modules
└── modules/           # Backend modules
```

## Architecture Boundaries

### Frontend (`apps/frontend`)

**CAN import:**
- `@ovds/ui` — React components and hooks
- `@ovds/design-system` — Token objects
- `@ovds/design-tokens` — Canonical token values
- `@ovds/contracts` — Zod schemas, pipes, filters
- `@ovds/dto` — Shared DTOs and validators
- `@ovds/shared` — Types and utilities

**CANNOT import:**
- `packages/database` — Prisma client
- `apps/backend` — NestJS code
- `packages/modules` — Backend logic

### Backend (`apps/backend`)

**CAN import:**
- `@ovds/contracts` — Zod schemas, pipes, filters, interceptors
- `@ovds/dto` — Shared DTOs and validators
- `@ovds/database` — Prisma client
- `@ovds/shared` — Types and utilities
- `@ovds/design-tokens` — Token values (for PDF/email rendering)

**CANNOT import:**
- `packages/ui` — React components
- `apps/frontend` — React code
- `apps/portal` — Portal code

### Shared Packages

**CAN import:**
- `@ovds/core` — Framework-agnostic kernel
- `@ovds/shared` — Sibling shared packages

**CANNOT import:**
- `@ovds/design-system` — Use `@ovds/design-tokens` instead
- `@ovds/ui` — UI layer
- `apps/*` — Application code

## Design Tokens

### Single Source of Truth

All design token values live in `packages/design-tokens/src/tokens.ts`. This is the ONLY place where hex codes, font sizes, and spacing values are defined.

### Token Flow

```
packages/design-tokens/src/tokens.ts
    ↓ (canonical values)
packages/ui/src/styles/tokens.css (CSS custom properties)
    ↓
packages/ui/tailwind.config.js (Tailwind utilities)
    ↓
React components: className="bg-surface-light text-primary"
    ↓
@ovds/design-tokens/backend.ts (NestJS services)
```

### Adding New Tokens

1. Add the token to `packages/design-tokens/src/tokens.ts`
2. Run `node packages/design-tokens/scripts/sync-css-variables.mjs` to update CSS
3. Update `packages/ui/tailwind.config.js` if needed
4. Export from `@ovds/design-tokens` barrel if needed for backend

## Shared Validation (Zod)

### Frontend ↔ Backend Consistency

Zod schemas in `@ovds/dto` and `@ovds/contracts/schemas` are the single source of truth for validation. Both React forms and NestJS pipes use the exact same schemas.

### Creating a New Schema

1. Define Zod schema in `@ovds/contracts/schemas/<domain>.ts`:
   ```ts
   export const MyEntitySchema = z.object({
     id: z.string().uuid(),
     name: z.string().min(1).max(100),
   });
   ```

2. Mirror in `@ovds/dto/<domain>/zod-bridge.ts` for frontend:
   ```ts
   export const MyEntitySchema = z.object({ /* same shape */ });
   ```

3. Use in React:
   ```tsx
   import { useZodForm } from '@ovds/ui';
   import { MyEntitySchema } from '@ovds/dto';
   
   const { register, handleSubmit } = useZodForm({ schema: MyEntitySchema });
   ```

4. Use in NestJS:
   ```ts
   import { ZodValidationPipe } from '@ovds/contracts';
   import { MyEntitySchema } from '@ovds/dto';
   
   @Post()
   create(@Body(new ZodValidationPipe(MyEntitySchema)) dto: z.infer<typeof MyEntitySchema>) {
     return this.service.create(dto);
   }
   ```

## Serialization

### Entity → DTO Transformation

Prisma entities must be serialized before being sent to the frontend. Use `@ovds/dto` utilities:

```ts
import { serializeEntity, serializePaginated, stripSensitive } from '@ovds/dto';

// Single entity
const clean = serializeEntity(rawEntity, {
  omit: ['internalNotes'],
  datesToIso: true,
  decimalsToString: true,
});

// Paginated response
const page = serializePaginated(
  entities.map(serializeEntity),
  total,
  page,
  limit,
);
```

### NestJS Interceptors

Apply `SerializeResponseInterceptor` globally or per-controller:

```ts
@UseInterceptors(SerializeResponseInterceptor)
@Controller('entities')
export class EntitiesController {}
```

## ESLint Rules

The repository enforces architecture boundaries through ESLint:

- `import/no-restricted-paths` — Prevents frontend from importing database/backend code
- `import/no-relative-packages` — Enforces `@ovds/*` aliases across packages
- `import/order` — Enforces consistent import ordering

### Running Lint

```bash
# Lint all packages
npm run lint:all

# Fix auto-fixable issues
npm run lint:fix

# Validate architecture
node scripts/check-arch.mjs
```

## Pre-commit Hooks

Husky + lint-staged runs on every commit:

1. ESLint with auto-fix on staged `.ts`/`.tsx` files
2. Prettier on staged `.json`, `.css`, `.md` files

### Setup

```bash
npm run prepare
```

## TypeScript Path Aliases

Use `@ovds/*` aliases instead of relative imports across package boundaries:

```ts
// ✅ Good
import { LoginSchema } from '@ovds/dto';

// ❌ Bad
import { LoginSchema } from '../../../shared/dto/src/common/zod-bridge';
```

Available aliases:
- `@ovds/shared` → `packages/shared/src`
- `@ovds/dto` → `packages/shared/dto/dist`
- `@ovds/contracts` → `packages/contracts/dist`
- `@ovds/design-tokens` → `packages/design-tokens/src`
- `@ovds/design-system` → `packages/design-system/src`
- `@ovds/ui` → `packages/ui/src`
- `@ovds/core` → `packages/core/src`
- `@ovds/database` → `packages/database/src`

## Scripts

| Script | Purpose |
|--------|---------|
| `node scripts/check-arch.mjs` | Validate architecture integrity |
| `node packages/design-tokens/scripts/sync-css-variables.mjs` | Sync tokens.ts → tokens.css |
| `node packages/design-tokens/scripts/generate-tailwind-config.mjs` | Generate Tailwind config from tokens |
| `npm run lint:all` | Lint all packages |
| `npm run typecheck:libs` | Typecheck all shared libraries |
| `npm run build:libs` | Build all shared libraries |

## Design Philosophy

The OVDS design system follows these principles:

1. **High contrast** — Dark charcoal (`#111827`) on white (`#FFFFFF`)
2. **Neutral grays** — Slate-50 through slate-900 for structure
3. **Functional accents** — Indigo (`#6366F1`) for primary actions
4. **Strict typography** — Inter font at defined scales
5. **Data safety** — Sensitive fields stripped by default in serializers
