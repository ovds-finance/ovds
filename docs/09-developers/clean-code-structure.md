<!--
  📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)
  📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)
  📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)
  📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)
  🔄 Last synced: 2026-08-27 -->

# Clean Code Structure — Thin Apps, Thick Libraries

This is the **canonical reference** for how code is organised in this Nx monorepo.
It turns the "thin apps, thick libraries" principle into a set of mechanical,
reviewable rules. Every file you add or move should be able to point at a rule
in this document.

## 1. The Principle

- **Apps (`apps/`) are thin.** They contain *only* configuration: dependency
  wiring, route tables, providers, bootstrap, and global middleware. No business
  logic, no database access, no domain entities.
- **Libraries (`packages/`) are thick.** All core components, business logic,
  database entities, DTOs, controllers, guards, hooks, and UI live in reusable
  local libraries.

If you find yourself writing a `switch`/business rule/prisma call inside an app,
**stop** — move it into a library.

## 2. Where Things Live

| Concern | Belongs in | Example |
|---------|-----------|---------|
| NestJS module wiring | `apps/backend/src/**/*.module.ts` | `accounting.module.ts` |
| HTTP controllers | `packages/domains/*/src/controllers` | `tax-rate.controller.ts` |
| Business-logic services | `packages/domains/*/src/lib` | `tax-rate.service.ts` |
| Domain entities / models | `packages/domains/*/src/entities` | `account.entity.ts` |
| DTOs (input/output) | `packages/domains/*/src/dto` | `create-account.dto.ts` |
| Domain guards | `packages/domains/*/src/guards` | `accounting.guard.ts` |
| Domain events | `packages/domains/*/src/events` | `accounting.events.ts` |
| React pages | `packages/features/*/src/pages` | `accounting.tsx` |
| React components | `packages/features/*/src/components` | `accountSummary.tsx` |
| React hooks | `packages/features/*/src/hooks` | `useAccounting.ts` |
| API clients | `packages/features/*/src/services` | `accountingApi.ts` |
| Prisma schema | `packages/database/prisma/schema.prisma` | — |
| Kernel (registry, event bus) | `packages/core/src` | `module-bootstrap.ts` |

## 3. Dependency Ordering

```
tokens (design tokens)
   └─ ui (dumb components)
        └─ features/* (frontend feature libs)
             └─ apps/frontend (thin)

core (kernel)
   └─ shared (cross-cutting utils)
        └─ domains/* (backend domain libs)
             └─ apps/backend (thin)
```

- `apps/frontend` may import `@ovds/ui`, `@ovds/features/*`, `@ovds/shared`, `@ovds/core`.
- `apps/backend` may import `@ovds/domains/*`, `@ovds/core`, `@ovds/shared`, `@ovds/database`, `@ovds/dto`, `@ovds/contracts`.
- `apps/backend` **never** imports `@ovds/features/*` or `@ovds/ui`.
- `apps/frontend` **never** imports `@ovds/domains/*` or `@ovds/database`.
- `packages/domains/*` may import `@ovds/core`, `@ovds/shared`, `@ovds/database`, `@ovds/dto`, `@ovds/contracts`, and `@ovds/domains/<itself>`.
- `packages/features/*` may import `@ovds/ui`, `@ovds/shared`, `@ovds/core`, `@ovds/contracts`.

These are enforced by `nx.json` `@nx/enforce-module-boundaries` **and** by
`scripts/check-arch.mjs`.

## 4. Naming & Tagging Conventions

**Nx project name** (in `project.json`) uses a kebab-case, domain-first form:

| Library | `project.json` name | `package.json` name | Path alias |
|---------|--------------------|--------------------|------------|
| Backend domain | `domains-accounting` | `@ovds/domains/accounting` | `@ovds/domains/accounting` |
| Frontend feature | `features-accounting` | `@ovds/features/accounting` | `@ovds/features/accounting` |

**Canonical tags** (in `project.json`):

| Library | `scope` | `type` |
|---------|---------|--------|
| Backend domain | `scope:backend` | `type:lib`, `type:domain` |
| Frontend feature | `scope:frontend` | `type:lib`, `type:feature` |
| Core kernel | `scope:shared` | `type:lib`, `type:core` |

Add a `domain:<name>` / `feature:<name>` tag for filtered Nx commands, e.g.
`nx run-many --projects=tag:domain:accounting`.

## 5. Backend Domain Library Layout

```
packages/domains/<domain>/
├── project.json           ← name: domains-<domain>, tags
├── package.json           ← name: @ovds/domains/<domain>
├── tsconfig.json          ← extends ../../../tsconfig.base.json
├── src/
│   ├── index.ts           ← public API barrel (NO @Module decorator re-export)
│   ├── lib/               ← business-logic services
│   ├── controllers/       ← NestJS controllers (thin, delegate to lib/)
│   ├── dto/               ← input/output DTOs
│   ├── entities/          ← domain entities (structural types)
│   ├── guards/            ← domain-specific NestJS guards
│   ├── interceptors/      ← domain-specific interceptors
│   ├── events/            ← domain events + listeners
│   └── constants.ts       ← domain constants
└── tests/                 ← vitest specs
```

> **Rule:** a domain library must **not** export a `@Module` decorator. NestJS
> modules stay in `apps/backend` and simply import services/controllers from the
> domain library. This keeps the domain library framework-wiring-free and
> independently testable.

## 6. Frontend Feature Library Layout

```
packages/features/<domain>/
├── project.json           ← name: features-<domain>, tags
├── package.json           ← name: @ovds/features/<domain>
├── tsconfig.json
├── src/
│   ├── index.ts           ← public API barrel
│   ├── pages/             ← route-level page components
│   ├── components/        ← feature components
│   ├── hooks/             ← custom hooks
│   ├── services/          ← API client services
│   ├── types/             ← feature types
│   └── utils/             ← feature utilities
└── tests/
```

## 7. Thin NestJS App Bootstrap

`apps/backend/src/app.module.ts` should be a **short, declarative composition**
that imports a typed registry of modules, plus global concerns. It should not
grow one import per domain service.

The registry lives in `packages/core` (via `createAppModules`) or in
`apps/backend/src/core/module-registrations.ts`. The `app.module.ts` reads that
registry and maps it into NestJS `@Module({ imports })`.

## 8. Migration Playbook (repeatable)

To move a backend concern out of `apps/backend` into a domain library:

1. Create (or reuse) `packages/domains/<domain>/`.
2. Move the service/controller/guard/dto into the right subfolder.
3. Rewrite import paths to use `@ovds/domains/<domain>` (and `@ovds/dto`,
   `@ovds/database`, `@ovds/shared`).
4. Re-export the moved symbols from `src/index.ts`.
5. Update the thin NestJS module in `apps/backend` to import from the library.
6. Ensure `project.json` tags + `tsconfig.base.json` alias exist.
7. Run `npm run build:libs`, `npm run typecheck`, `node scripts/check-arch.mjs`.

To move a frontend concern out of `apps/frontend` into a feature library,
follow the same steps with `packages/features/<domain>/`.

## 9. Enforcement

Run before every commit:

```bash
node scripts/check-arch.mjs   # fast, greps for boundary violations
npx nx affected --target=typecheck
```

`scripts/check-arch.mjs` already enforces 12 rules. The most important for this
document:

- Rule 11 — apps must not contain business logic (service methods calling prisma).
- Rule 7 — backend must not import `@ovds/features/*`.
- Rule 8 — frontend must not import `@ovds/domains/*`.
- Rule 12 — domains must not cross-import other domains.

## 10. Code Style

- **NestJS services** extend `BaseService` from `@ovds/domains/infrastructure`
  when they need prisma + audit access.
- **Repositories / prisma access** go through `@ovds/database` (`PrismaService`)
  or `@ovds/domains/infrastructure` (`IPrismaClient`), never raw `@prisma/client`
  in apps.
- **Errors** use NestJS exceptions (`NotFoundException`, `BadRequestException`)
  from `@nestjs/common`.
- **Validation** uses `class-validator` DTOs from `@ovds/dto` or Zod schemas from
  `@ovds/contracts`.
- **Naming** — files are kebab-case; classes PascalCase; services end in
  `.service.ts`; controllers end in `.controller.ts`.
