<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)
     📌 ARCHITECTURE: [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md) -->

# Upgrading & Schema Migration

> How to safely evolve the OVDS monorepo: Nx upgrades, Prisma schema/migration
> changes, dependency bumps, and a deprecation strategy.
>
> Companion: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) · [DATA-MODEL.md](./DATA-MODEL.md) · [ADDING-A-MODULE.md](./ADDING-A-MODULE.md)

Toolchain baseline (verify with `npx nx --version` / `npx prisma -v`):

| Tool | Version in this repo |
|------|----------------------|
| Nx | `23.1.1` (pnpm workspaces) |
| Prisma | `7.9.1` (driver adapter `@prisma/adapter-mariadb`, MySQL/MariaDB) |
| Node | `18+` (see the dev guide's prerequisites) |

---

## 1. Two kinds of change

| Change | Use | Risk | Script |
|--------|-----|------|--------|
| **Schema/migration** (model, field, index, enum) | `prisma migrate dev` locally, `migrate deploy` in prod | Data loss if you `db push` to prod | `npm run db:migrate:dev` / `npm run db:migrate:prod` |
| **Code/dependency** (Nx, NestJS, React, libs) | `nx migrate`, then `npm install` | Config/plugin drift | `npx nx migrate <version>` |

Rule of thumb: **never run `db:push` against production.** `npm run db:push` is explicitly gated with a warning and `db:push:prod` is disabled (it `exit 1`s) for exactly this reason. Production schema changes flow through migration files only.

---

## 2. Prisma schema & migration workflow

All Prisma commands run through `packages/database` using `prisma.config.js` (env-file
based datasource). The root wraps them:

| Root script | Command run | When |
|-------------|-------------|------|
| `npm run db:generate` | `prisma generate` | After **any** schema edit, and in CI after migrations |
| `npm run db:migrate:dev` | `prisma migrate dev` | Local development — creates/appends a migration, applies it, regenerates client |
| `npm run db:migrate:prod` | `prisma migrate deploy` | Production & staging — applies pending migrations only, no new files |
| `npm run db:push` | `prisma db push` (+ `fix-fk-collisions.mjs`) | **Local only** — sync schema without migration history (use for throwaway dev DBs) |
| `npm run db:studio` | `prisma studio` | Inspect live data |

### 2.1 Adding a field / model (normal path)

```bash
# 1. Edit packages/database/prisma/schema.prisma
# 2. Generate the migration locally
npm run db:migrate:dev -- --name add-credit-score-to-customer

# 3. Regenerate clients (run automatically by migrate dev, but be explicit in CI)
npm run db:generate

# 4. Regenerate the Zod contract types (schema uses the `zod` generator too)
npm run db:generate:zod

# 5. Re-run the data-model reference so the doc diff shows in your PR
npm run docs:schema
```

The `--name` is mandatory and should be descriptive (it becomes the migration folder name).
Commit both `prisma/migrations/<timestamp>_<name>/migration.sql` **and** the updated
`schema.prisma`. The migration SQL is the source of truth for production.

> Tenant-scoped models: add `companyId` **and** a leading `@@index([companyId, ...])`.
> The generated [DATA-MODEL.md](./DATA-MODEL.md) flags the 12 models currently missing
> that index prefix — keep that list at zero.

### 2.2 Applying to production / staging

```bash
npm run db:migrate:prod
```

`migrate deploy` is idempotent and safe to re-run: it applies only migrations not yet
recorded in `_prisma_migrations`. Run it during a deploy window after the new build is in
place (the app reads the schema the client was generated against).

### 2.3 Rollback

Prisma migrations are **not** auto-reversible. Options, in order of safety:

1. **Forward fix (preferred).** Write a new migration that undoes the change
   (`migrate dev --name undo-<x>`), and `db:migrate:prod`. The history stays linear and
   auditable.
2. **Resolve a failed migration.** If `migrate deploy` stops midway:
   `npx prisma migrate resolve --applied <migration-name>` (it succeeded) or
   `--rolled-back <migration-name>` (it failed), then re-run `db:migrate:prod`.
3. **`migrate reset` is dev only** — it drops the database. Never run it on shared/prod
   data.

### 2.4 Drift & "already applied" errors

If CI or prod reports a migration that is "already applied" / history drift, **do not**
hand-edit `schema.prisma` to "fix" it. Determine whether:
- a teammate merged a migration with a colliding timestamp (resolve via
  `migrate resolve`), or
- the database was changed outside migrations (`db push` was used) — reconcile by
  recreating the intended state as a new migration.

The [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) §4 `P2021`/`P2022` rows cover the resulting
runtime errors.

---

## 3. Nx & workspace dependency upgrades

### 3.1 Minor/patch within the same major

```bash
npm install @nx/<plugin>@latest   # targeted plugin bumps
npx nx reset                      # clear Nx cache after plugin changes
npm run build                     # verify nothing broke
```

### 3.2 Major Nx upgrade

```bash
# 1. Generate the migration (interactive; picks latest or a pinned version)
npx nx migrate latest
#    or pin:  npx nx migrate 23.1.1

# 2. Install the new deps
npm install

# 3. Apply codemods Nx generated
npx nx migrate --run-migrations

# 4. Verify the graph and build
npx nx graph     # sanity-check project dependencies
npm run build:all
```

`nx migrate` writes a `migrations.json` of codemods; `--run-migrations` executes them.
If a codemod fails, fix the file manually and re-run. Commit `package.json`,
`nx.json`, `migrations.json`, and the changed configs together.

### 3.3 Library / framework bumps (NestJS, React, Prisma)

- **Prisma**: bump `prisma` + `@prisma/client` together, then `npm run db:generate`.
  Major Prisma versions can change client APIs — run the backend test suite.
- **NestJS**: bump `@nestjs/*` in lockstep (they share a version). Watch for
  `@nestjs/swagger`, `class-validator`, and `class-transformer` peer changes.
- **React / Vite**: bump `react`, `react-dom`, `vite` together; re-run the frontend
  build and tests.

Run `npm run typecheck:all` (or the project's equivalent) and the test suites before
merging an upgrade PR.

---

## 4. Deprecation strategy

OVDS is a multi-tenant product with published contracts (`packages/contracts` Zod types)
and a docs portal. Changes that break consumers need a staged rollout.

### 4.1 API / contract changes

- **Additive changes are safe**: new optional fields, new endpoints, new permissions.
- **Breaking changes** (remove/rename a field, change a type, tighten validation):
  1. Keep the old shape working; add the new one.
  2. Mark the old field/endpoint `@deprecated` in the Swagger DTO and note it in the
     relevant `docs/09-developers` guide.
  3. Emit a deprecation log/warning server-side for callers still using it.
  4. Remove only after a full release cycle with zero remaining internal callers.
- The frontend and `packages/contracts` must stay in sync — a Zod contract change that
  the SPA hasn't adopted will surface as `422` (see TROUBLESHOOTING §3).

### 4.2 Prisma model changes that affect tenants

- Renaming a model/field = a breaking data change. Use `@map`/`@@map` to keep the DB
  column name stable while renaming the Prisma field, so existing data survives without
  a data-migration.
- Dropping a tenant-scoped column: confirm no service filters on it, then a standard
  migration. Never drop `companyId`.

### 4.3 Docs & generated artifacts

- After any schema or generator change, re-run `npm run docs:schema` so
  [DATA-MODEL.md](./DATA-MODEL.md) reflects the new state in the same PR (the file is
  git-diffable — schema drift shows up in review).
- Keep `docs/README.md` index in sync (register new guides, fix links).
- Run the docs pipeline (`docs:ci`) in CI to block broken links and stale generated docs.

---

## 5. Pre-release checklist

- [ ] `npm run db:migrate:prod` dry-run reviewed (migration SQL inspected)
- [ ] `npm run db:generate` + `db:generate:zod` regenerated and committed
- [ ] `npm run docs:schema` re-run; DATA-MODEL.md diff reviewed
- [ ] `package.json`, `nx.json`, `migrations.json` (if Nx migrated) committed together
- [ ] Backend + frontend test suites green
- [ ] No `console`/runtime `db push` against shared environments
- [ ] Deprecated surfaces logged and documented, not silently removed
