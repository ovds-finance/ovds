# OVDS Monorepo

Multi-company ERP platform built with React 19 (Vite + SWC), NestJS 11, and Prisma 7 on MariaDB.

## Apps

| App | Path | Description |
|-----|------|-------------|
| Frontend | `apps/frontend` | React 19 SPA |
| Backend | `apps/backend` | NestJS REST + WebSocket API |

## Packages

| Package | Path | Description |
|---------|------|-------------|
| `@ovds/database` | `packages/database` | Prisma client + schema |
| `@ovds/shared` | `packages/shared` | Shared types and utilities |
| `@ovds/contracts` | `packages/contracts` | oRPC contracts + Zod schemas |
| `@ovds/ui` | `packages/ui` | Shared UI component library |

## Development

```bash
pnpm install
pnpm run dev:all        # start all apps
pnpm run build:apps     # production build
pnpm run test           # run all tests
pnpm run lint:all       # lint everything
```

## Optimization & Bundle Health

The monorepo ships a permanent automated pipeline that tracks bundle size, audits dependency hygiene, and checks Prisma configuration on every relevant commit.

| Quick command | What it does |
|---------------|-------------|
| `pwsh -File scripts/optimize.ps1 -SkipBuild -SkipKnip` | Fast local check (uses cached build) |
| `pnpm run optimize:bundle` | Analyze Vite output chunks |
| `pnpm run optimize:deps` | Dep hygiene (dedupe, ranges, circular deps) |
| `pnpm run optimize:size-check` | Bundle size regression vs baseline |
| `pnpm run optimize:size-baseline` | Advance baseline after intentional size change |

CI runs this pipeline automatically — see `.github/workflows/dep-optimization.yml` and `scripts/README.md#dependency-optimization-pipeline` for full documentation.

**Current baseline:** 15,703 KB total bundle, 2 oversized chunks tracked (see `scripts/README.md`).

## CI / CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `dep-optimization.yml` | push (dep paths), nightly | Bundle + dep health |
| `docs-pipeline.yml` | push (docs paths) | Docs validation + seeding |

## Scripts

See `scripts/README.md` for full script documentation.
