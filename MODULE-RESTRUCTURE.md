# OVDS Module Restructure — Canonical Akaunting-Inspired Architecture

> Goal: collapse the ~80 overlapping feature folders in `apps/backend/src` (plus the
> redundant frontend/packages clusters) into a small number of **domain modules**, each
> self-contained and Akaunting-style, and delete the now-redundant originals.

## Progress tracker

| Domain | Status | What changed |
|--------|--------|--------------|
| `banking` | ✅ done | Folded `bank-accounts`, `bank-transactions`, `reconciliation` into `banking/`; originals deleted |
| `hr` | ✅ done | Moved `employees`, `attendance`, `leaves`, `shifts`, `holidays`, `departments`, `biometrics`, `payroll`, `disaster-fund` into `hr/<feature>/`; wired into `HrModule`; originals deleted |
| `settings` | ✅ done | Moved `currency`, `periods`, `fiscal`, `custom-fields`, `cost-centers`, `onboarding`, `business-registration`, `licensing` into `settings/<feature>/`; `accreditation` kept as `AccreditationModule` under `settings/`; originals deleted |
| `ledger` | ✅ done | New `ledger/` module: moved `accounting`(estimates), `ifrs`, `treasury` in; originals deleted |
| `items` | ✅ done | Folded `inventory`, `manufacturing` into `items/`; originals deleted |
| `purchases` | ✅ done | Folded `procurement`, `expense-claims` into `purchases/`; originals deleted |
| `crm` | ✅ done | Folded `loyalty` into `crm/`; original deleted |
| `projects` | ✅ done | New `projects/` module (standalone stub); original folder retained as module |
| `security` | ✅ done | New `security/` module: folded `device-control`, `iot`, `nodes`, `infrastructure` in (kept `SecurityController`); originals deleted |
| `platform` | ✅ done | New `platform/` module: folded `nav`, `admin`, `appstore`, `system-modules`, `releases`, `offline`, `sync`, `helpdesk`; originals deleted |
| `compliance` | ✅ done | Folded `master-compliance` into `compliance/` (kept `audit-log` as shared module used by `ovds`/`vat`); `master-compliance` deleted |
| `tax` | ✅ done | `vat` (real `VatService` from `@ovds/domains/vat`) folded into `TaxModule` as the canonical VAT surface; `vat/` module folder deleted; `tax/vat/*` facade left in place (different route path) pending product decision |
| `eims` | kept | Left as its own `EimsModule` (2968 LOC, distinct ERCA/ERA domain) |
| `cyber-audit`, `security-assessment` | kept | Left as distinct modules (real implementations) |
| `auth`, `common`, `core`, `types`, `orpc`, `ovds` | kept | Cross-cutting; not part of the duplication problem |

Every cluster above was gated by a green `npx nx typecheck backend` (EXIT=0).

### Remaining (separate efforts, not yet done)
- **Backend `tax`/`vat`** — needs the product decision above.
- **Frontend** (`apps/frontend/src`, `apps/portal/src`) and **packages** (`domains`, `features`, `modules`, `ui`) — duplicate UI slices (`accounting`, `banks`, `invoices`, `payroll`, `device-control`, `DisasterFund`, `crm`, `employees`, …) still overlap; follow §1 map per app. This is a larger, separate pass.

## 1. Target module taxonomy (the "perfect module arrangement")

Every domain module is a self-contained unit with a consistent internal layout:

```
modules/<domain>/
  <domain>.module.ts        # NestJS module (backend)
  <domain>.controller.ts     # HTTP/rpc surface (backend)
  <domain>.service.ts        # business logic (backend)
  dto/                       # zod/class-validator contracts
  domain/                    # pure domain types & rules
  web/                       # React pages + components (frontend side of the module)
  index.ts                   # public barrel
```

Canonical domains:

| # | Module (folder)        | Responsibility                                                                 | Absorbs (old folders) |
|---|------------------------|--------------------------------------------------------------------------------|-----------------------|
| 1 | `auth`                 | AuthN/Z, users, roles, permissions, TIN/IRN guards                              | `auth` |
| 2 | `settings`             | Company profile, currencies, fiscal periods, custom-fields, cost-centers, onboarding, localization | `settings`, `currency`, `periods`, `fiscal`, `custom-fields`, `cost-centers`, `onboarding`, `business-registration`, `licensing`, `accreditation` |
| 3 | `ledger`              | Double-entry, chart of accounts, journals, IFRS/TOT/BIT, treasury, estimates   | `accounting`, `ifrs`, `treasury`, `ovds` (facade), `core` (ledger parts) |
| 4 | `tax`                  | **VAT + WHT + TOT + BIT + declarations** — the core OVDS domain               | `tax`, `vat`  ← merged (VAT is a tax type) |
| 5 | `sales`                | Invoices, revenues, customers, CRM, loyalty                                    | `sales`, `crm`, `loyalty`, `invoices` |
| 6 | `purchases`            | Bills, payments, vendors, expenses, procurement                                | `purchases`, `procurement`, `expense-claims` |
| 7 | `banking`              | Accounts, transactions, reconciliation, transfers                             | `banking`, `bank-accounts`, `bank-transactions`, `reconciliation` |
| 8 | `items`                | Products, categories, inventory, manufacturing                                | `items`, `inventory`, `manufacturing` |
| 9 | `hr`                   | Employees, attendance, leaves, shifts, holidays, departments, biometrics, payroll, disaster-fund | `hr`, `employees`, `attendance`, `leaves`, `shifts`, `holidays`, `departments`, `biometrics`, `payroll`, `disaster-fund` |
|10 | `projects`             | Project accounting                                                             | `projects` |
|11 | `compliance`           | Tax compliance, EIMS, governance/AGM, master compliance, audit-log            | `compliance`, `eims`, `master-compliance`, `audit-log` |
|12 | `security`             | Cyber audit, security assessment, device-control, iot, infrastructure, nodes  | `security`, `cyber-audit`, `security-assessment`, `device-control`, `iot`, `infrastructure`, `nodes` |
|13 | `platform`             | App store, system modules, nav/menu, releases, admin, helpdesk, sync, offline  | `appstore`, `system-modules`, `nav`, `releases`, `admin`, `helpdesk`, `sync`, `offline`, `orpc` |
|14 | `reports`              | Analytics & statutory reports (frontend + orpc aggregations)                  | `releases`(status), reporting parts of `ovds` |
|15 | `common`               | Cross-cutting: prisma, guards, pipes, filters, interceptors, queues            | `common`, `types` |

## 2. Duplicate / overlap findings (must resolve before delete)

- **`tax` ⇄ `vat`** — both expose VAT filings/summary/ledgers. `vat` uses
  `VatService` from `@ovds/domains/vat`; `tax` uses a local `TaxService` facade.
  **Resolution:** keep `tax` as the single module; fold `vat`'s ERCA/eTax/IRN
  endpoints into `tax/vat/*` and retire the standalone `vat` module + `VatController`
  registration in `app.module.ts`.
- **`accounting` / `ifrs` / `treasury` / `fiscal`** — single controllers each, all
  "financials". Fold into `ledger`.
- **`banking` / `bank-accounts` / `bank-transactions` / `reconciliation`** — fold into `banking`.
- **`hr` vs `employees`/`attendance`/`leaves`/`shifts`/`holidays`/`departments`/`biometrics`/`payroll`/`disaster-fund`** — fold into `hr`.
- **`compliance` vs `eims` vs `master-compliance`** — `eims` is the heavy one (2968 LOC);
  `compliance`/`master-compliance` are thin. Keep `compliance`, subsume the others.
- **`security` vs `cyber-audit` vs `security-assessment` vs `device-control` vs `iot` vs `infrastructure` vs `nodes`** — fold into `security`.
- **`settings` vs `currency`/`periods`/`fiscal`/`custom-fields`/`cost-centers`/`onboarding`** — fold into `settings`.
- **`sales` vs `crm` vs `invoices` vs `loyalty`** and **`purchases` vs `procurement` vs `expense-claims`** — fold.
- **Frontend**: `apps/frontend/src/{accounting,banks,invoices,payroll,...}` and
  `apps/portal/src/{accounting,admin,assets,compliance,crm,employees,...}` and
  `packages/{domains,features,modules,ui}` overlap heavily. Map each UI slice to the
  matching backend module above; delete duplicate `ovds`/`DisasterFund`/`device-control`
  slices that duplicate `modules/*`.
- **`packages/core`** already owns the canonical `*Module` factories
  (`salesModule`, `taxModule`, `hrModule`, `complianceModule`, …). The backend `src`
  controllers that duplicate these should be deleted; the `@ovds/core` factories are the
  source of truth for module wiring.

## 3. Execution plan (run per domain, verify, then delete old)

For each domain row in §1:
1. `git mv apps/backend/src/<old> apps/backend/src/modules/<domain>/<old>` (or merge
   file-by-file where overlapping).
2. Rewrite relative imports (`../auth/...` → `../../auth/...`, etc.) with `sed`/`rg`.
3. Update `app.module.ts`: replace old controller/module imports with the merged ones;
   remove retired registrations (`VatController`, `VatModule`, …).
4. `npx nx typecheck backend && npx nx typecheck frontend` — must be green.
5. Only after green: `git rm -r` the now-empty original folders.

## 4. Verification & cleanup gate

- Never delete an old folder until `nx typecheck` + `nx build` pass for the affected
  apps and `npx nx test backend` is green for that module.
- Keep `git` history (use `git mv`) so the rename is tracked; delete only after the
  build proves the new structure is complete.
- Final pass: `knip` (already a devDep) to remove dead exports left behind by merges.

## 5. Why this is phased and not a single blind rename

The current tree has controllers wired by hand in `app.module.ts` while the real module
logic also lives in `@ovds/core` (`*Module` factories) and `@ovds/domains/*` services.
A single sweeping rename would silently break routes and imports across ~300 files with
no green build to catch it. The domain-by-domain approach above keeps each step
verifiable and reversible.

---

## 6. Package-layer consolidation (the `packages/**` duplication)

The `packages/features/*` and `packages/domains/*` trees duplicated entire bounded
contexts under different names (e.g. `features/invoice` vs `features/invoicing` vs
`domains/invoice` vs `domains/invoicing`; `features/accounting` vs `domains/accounting`).
This layer is now reorganised around **canonical DDD modules**.

### Canonical module surface
`packages/modules/<domain>` for each bounded context:

```
modules/<domain>/
  src/
    index.ts        # public barrel: domain types + namespaced `web`
    domain/index.ts # centralized domain types & rules (the bounded context's truth)
    dto/index.ts    # zod / class-validator contracts for the context
    web/index.ts    # React pages & components for the context
  package.json      # @ovds/modules-<domain>, exports ./web ./domain ./dto
  project.json      # tags: type:lib, type:module, domain:<domain>
  tsconfig.json     # bundler resolution (resolves @orpc/* ESM types)
```

Modules created: `auth, settings, ledger, tax, sales, purchases, banking, items, hr,
projects, compliance, security, platform, reports, common` (15; plus the pre-existing
canonical `hr` and `ovds` modules).

### Strict Nx DDD decoupling
`nx.json` `depConstraints` now enforce a strict layer model:
- `type:module` / `type:domain` may only depend on `core`, `lib`, `shared`, `tokens`,
  `domain` — never `type:feature` or `type:ui` (no frontend leakage into backend).
- `type:feature` may only depend on `module`, `ui`, `tokens`, `lib`, `shared` — never
  another `type:feature` or `type:domain` (features are isolated to their module).
- `type:ui` may not depend on `feature` / `domain` / `module` / `backend`.

### Centralized types
Each module owns its types in `src/domain` (`@ovds/modules/<domain>/domain`) and exposes
them from the root barrel. `tsconfig.base.json` gained `@ovds/modules/<domain>` (+ `/web`,
`/domain`, `/dto`) path aliases.

### Backward-compatible shims (frontend keeps working)
Old `features/*` / `domains/*` packages remain as-is (they are the live implementation)
and the canonical modules re-export them. The clear duplicate `invoice`/`invoicing` has
been collapsed: `features/invoicing` (stub) and `domains/invoicing` were deleted, and the
shim chain `receipts` / `purchases` / `procurement` / `expenses` now points straight at
the canonical `@ovds/domains/invoice` (exposed via the `sales` module).

### Finishing the move (delete old)
`scripts/consolidate-modules.mjs report` enumerates the remaining import sites (≈101)
grouped by the module that should own them. To complete:
1. Migrate each import from `@ovds/features|x/<x>` to `@ovds/modules/<domain>` (or
   `/web`, `/domain` as appropriate) per the report.
2. `npx nx run-many --target=typecheck --all` must be green.
3. `node scripts/consolidate-modules.mjs delete --force` removes the now-empty old
   package directories (guarded so it only runs after the above).
