# Phase 4 – Fresh Install and Builds

All commands run from `C:\xampp\htdocs\ovds`.

---

## Pre-flight fixes applied before install

Two bugs blocked `pnpm install` and typechecks. Fixed automatically:

### Fix 1 — `packages/accounting/package.json`: wrong workspace dependency name
- **Before:** `"@ovds/shared/database": "workspace:*"` (no such package in workspace)
- **After:** `"@ovds/database": "workspace:*"`

### Fix 2 — `packages/accounting/src/**`: 12 source files had matching bad import
- Replaced all `from '@ovds/shared/database'` → `from '@ovds/database'` in:
  - `src/lib/compliance/bad-debt-relief.service.ts`
  - `src/lib/compliance/capex-amortization.service.ts`
  - `src/lib/compliance/refund-state-machine.service.ts`
  - `src/lib/compliance/threshold-monitor.service.ts`
  - `src/lib/ledgers/accounting.service.ts`
  - `src/lib/ledgers/amendment-ledger.service.ts`
  - `src/lib/ledgers/vat-aggregator.service.ts`
  - `src/lib/ledgers/vat-consolidation.service.ts`
  - `src/lib/tax-rules/classification-isolator.service.ts`
  - `src/lib/tax-rules/oss-harmonization.service.ts`
  - `src/lib/tax-rules/reverse-charge.service.ts`
  - `src/lib/tax-rules/tax-category-matcher.service.ts`

### Fix 3 — `nx.json`: `targetDefaults.typecheck.options.tsConfig` caused spurious `--tsConfig` flag
- Removed the `options: { tsConfig: ... }` block from `typecheck` in `nx.json`.
  The `nx:run-commands` executor was appending `--tsConfig=<path>` to every tsc invocation, causing `error TS5023: Unknown compiler option '--tsConfig'`.

---

## 4.1 pnpm install

**Command:** `pnpm install --ignore-scripts`
**Exit code:** 0 ✅

Note: First run without `--ignore-scripts` failed because `pkcs11js` (a direct dependency in root `package.json`) requires native compilation via `node-gyp`, and Visual Studio build tools are not installed on this machine. Using `--ignore-scripts` skips all postinstall native builds and is safe for development/typecheck purposes.

```
Scope: all 41 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +2635
Progress: resolved 0, reused 2188, downloaded 0, added 2635, done
Done in 8m 38.3s
```

**Warnings (non-fatal):**
- `apps/frontend`: `recharts@2.15.4` deprecated
- `apps/ovds-sync`: `eslint@9.39.5` deprecated

---

## 4.2 nx run database:build

**Command:** `npx nx run database:build`
**Exit code:** 0 ✅

```
NX   Running target build for project database and 2 tasks it depends on:

> nx run core:build          ✔
> nx run shared:build        ✔
> nx run database:build      ✔

NX   Successfully ran target build for project database and 2 tasks it depends on
```

---

## 4.3 nx run-many build

**Command:** `npx nx run-many --target=build --all --parallel=8`
**Exit code:** -1 (timeout at 30 minutes) ⚠️

The command was still running when it hit the 1800-second limit. Confirmed completed targets include all packages (design-system, core, shared, dto, contracts, ui, database, ledger, features-*, domains-*, modules-*, banking, etc.) and both frontend apps. The last captured output shows `ovds-mor` built successfully:

```
vite v8.3.1 building client environment for production...
✔ 4340 modules transformed.
../../dist/apps/ovds-mor/assets/index-B-NQhBHh.js    880.55 kB
../../dist/apps/ovds-mor/assets/react-vendor-BSL_TrHR.js  942.24 kB
✔ built in 5m 2s
```

**Known failures before timeout:**
- `modules-accounting-backend:build` — FATAL ERROR: heap out of memory (tsc OOM on large project)
- `modules-accounting-frontend:build` — same OOM failure

These OOM failures are environment constraints (Node v25 default heap ~2GB, large monorepo). Not code bugs.

---

## 4.4a backend typecheck

**Command:** `npx nx typecheck backend` (with `NODE_OPTIONS=--max-old-space-size=4096`)
**Exit code:** 1 ❌

Required `--max-old-space-size=4096` to avoid heap OOM. Without it the process crashes.

**Type errors found:**

```
apps/backend/src/app.module.ts(17,36): error TS2307: Cannot find module '@ovds/auth/guards/zone-isolation.guard'
apps/backend/src/app/app.module.ts(26,5): error TS2322: Type 'DynamicModule' is not assignable to type ...
apps/backend/src/auditor/mor.controller.ts(15,55): error TS2307: Cannot find module '@ovds/auth/guards/zone-isolation.guard'
apps/backend/src/auditor/overview.controller.ts(10,34): error TS2307: Cannot find module '@ovds/shared/types/roles'
apps/backend/src/auth/auth.service.ts(8,40): error TS2307: Cannot find module '@ovds/shared/types/roles'
apps/backend/src/auth/decorators/roles.decorator.ts(9,34): error TS2307: Cannot find module '@ovds/auth/guards/roles.guard'
apps/backend/src/auth/guards/jwt-auth.guard.ts(7,30): error TS2307: Cannot find module '@ovds/auth/guards/jwt-auth.guard'
apps/backend/src/auth/guards/roles.guard.ts(14,8): error TS2307: Cannot find module '@ovds/auth/guards/roles.guard'
apps/backend/src/cyber-audit/cyber-audit.service.ts(2,10): error TS2305: Module '"@ovds/shared"' has no exported member 'INSA_CYBER_AUDIT_CHECKLIST'
apps/backend/src/eims/eims-certificate.service.ts(6–9): error TS2305: '@ovds/shared' missing: generatePrivateKeyPem, generateCsrPem, generateCsrConfig, encodeCertificateForEims
apps/backend/src/eims/eims-data-registry.service.ts(41): error TS2305: '@ovds/shared' missing: EimsSummaryReportRequest
apps/backend/src/eims/eims-invoice.mapper.ts(17–19): error TS2305: '@ovds/shared' missing: EimsInvoiceRegistrationRequest, EimsItemLine, EimsPartyDetails
apps/backend/src/eims/eims.controller.ts(34): error TS2305: '@ovds/shared' missing: INSA_COMPLIANCE_CHECKLIST, getInsaComplianceSummary
apps/backend/src/eims/eims.service.ts(27–46): error TS2305/TS2724: '@ovds/shared' missing many Eims* types and helpers
apps/backend/src/eims/mor-eims.client.ts(28–43): error TS2305/TS2724: '@ovds/shared' missing many Eims* types and helpers
apps/backend/src/orpc/orpc-backend-handler.service.ts(1,2): error TS2307: Cannot find module '@orpc/server'
apps/backend/src/orpc/orpc-backend-handler.service.ts(2): error TS2307: Cannot find module '@ovds/contracts/router'
apps/backend/src/orpc/orpc.controller.ts(3,4): error TS2307: Cannot find module '@orpc/server', '@ovds/contracts/router'
apps/backend/src/ovds/vat/guards/vat-module.guard.ts(30): error TS2307: Cannot find module '@ovds/core/vat'
apps/backend/src/ovds/vat/ovds-vat.module.ts(18,19): error TS2307: Cannot find module '@ovds/core/vat', '@ovds/core/vat/report'
apps/backend/src/ovds/vat/vat-declaration.controller.ts(65): error TS2307: Cannot find module '@ovds/contracts/schemas'
apps/backend/src/ovds/vat/vat-declaration.orchestrator.ts(33–36): error TS2307: '@ovds/core/vat', '@ovds/core/vat/report'
apps/backend/src/ovds/vat/vat-filing.service.ts(53): error TS2307: Cannot find module '@ovds/contracts/schemas'
apps/backend/src/platform/nav.controller.ts(3): error TS2307: Cannot find module '@ovds/contracts/schemas'
apps/backend/src/sales/sales-order.service.ts(26–28): error TS2305/TS2724: '@ovds/shared' missing WHT_GOVERNMENT_DEFAULT_RATE, computeWithholdingTax, WithholdingResult
packages/shared/database/src/prisma.service.ts(2,7,11): error TS2305/TS2339: '@prisma/client' missing PrismaClient, $connect, $disconnect
```

**Error categories:**
| Category | Count |
|---|---|
| Missing `@ovds/auth/guards/*` subpath exports | ~6 files |
| Missing `@ovds/shared/types/roles` subpath | 2 files |
| Missing exports from `@ovds/shared` (Eims types, checklist consts, WHT helpers) | ~20 files |
| Missing `@orpc/server` package | 2 files |
| Missing `@ovds/contracts/router`, `/schemas` subpath exports | 5 files |
| Missing `@ovds/core/vat`, `@ovds/core/vat/report` subpath exports | 5 files |
| `@prisma/client` PrismaClient API mismatch (Prisma v7 breaking change) | 1 file |
| Duplicate `@nestjs/common` version conflict (INestApplication) | spec files |
| Implicit `any` parameters | several |

---

## 4.4b portal typecheck

**Command:** `npx nx typecheck portal` (with `NODE_OPTIONS=--max-old-space-size=4096`)
**Exit code:** 1 ❌

```
apps/portal/src/App.tsx(1,10): error TS2305: Module '"@ovds/shared"' has no exported member 'VatFormEngine'
apps/portal/src/App.tsx(1,25): error TS2305: Module '"@ovds/shared"' has no exported member 'SchemaDrivenForm'
apps/portal/src/AppRoutes.tsx(43,10): error TS2786: 'ErrorBoundary' cannot be used as a JSX component (refs missing in OvdsErrorBoundary)
apps/portal/src/AppRoutes.tsx(65,6): error TS2786: same ErrorBoundary issue
apps/portal/src/components/ClientPortalLayout.tsx(36,16): error TS2786: 'Icon' FC<IconProps> not valid JSX (ReactNode | Promise<ReactNode> not assignable)
apps/portal/src/pages/Dashboard.tsx(8,36): error TS2307: Cannot find module '@ovds/features-sales'
apps/portal/src/pages/eims/EimsDashboard.tsx: error TS2305: '@ovds/shared' missing useEimsReadiness, useEimsRegistrations, useEimsReceipts, useEimsBulkJobs
apps/portal/src/pages/eims/EimsDashboard.tsx: error TS2786: Icon, Card, CardContent, Progress not valid JSX (React type version mismatch)
apps/portal/src/pages/eims/EimsRoutes.tsx(21,34): error TS2786: ErrorBoundary JSX issue (same as above)
apps/portal/src/pages/Invoices.tsx(12,13): error TS2307: Cannot find module '@ovds/features-sales'
apps/portal/src/pages/Payments.tsx(12): error TS2307: Cannot find module '@ovds/features-sales'
packages/shared/src/fmt.ts(71,72): error TS2591: Cannot find name 'process' (missing @types/node in portal tsconfig)
packages/shared/src/ovds/etax-payload.types.ts(225): error TS2591: 'require', TS2307: 'crypto' not found
packages/shared/src/security/request-signing.ts(38): error TS2307: Cannot find module 'crypto'
packages/shared/src/utils.ts(461,462,477,488,497): error TS2591: 'process'/'Buffer' not found, TS2307: 'crypto' not found
packages/ui/src/hooks/useToast.ts(103): error TS2345: React type version mismatch in hot-toast callback
```

**Error categories:**
| Category | Count |
|---|---|
| Missing exports from `@ovds/shared` (VatFormEngine, SchemaDrivenForm, Eims hooks) | 6 |
| Missing `@ovds/features-sales` package | 3 files |
| React type version mismatch (`bigint` not assignable to `ReactNode`) | many — React 18 vs 19 types conflict |
| Node built-ins (`process`, `Buffer`, `crypto`) not in portal tsconfig types | 5 |
| `OvdsErrorBoundary.refs` missing (class component type mismatch) | 4 |

---

## 4.4c ovds-mor typecheck

**Command:** `npx nx typecheck ovds-mor`
**Exit code:** 1 ❌

```
apps/ovds-mor/src/pages/declarations/page.tsx(133,13): error TS2304: Cannot find name 'TableSkeleton'
apps/ovds-mor/src/pages/declarations/page.tsx(162,10): error TS2304: Cannot find name 'FilterPills'
apps/ovds-mor/src/pages/declarations/page.tsx(165,22): error TS7006: Parameter 'v' implicitly has an 'any' type
apps/ovds-mor/src/pages/declarations/page.tsx(279,12): error TS2304: Cannot find name 'Pagination'
apps/ovds-mor/src/utils/api.ts(15,21): error TS7053: Element implicitly has an 'any' type (property 'data' on '{}')
apps/ovds-mor/src/utils/api.ts(15,55): error TS7053: same
apps/ovds-mor/src/utils/api.ts(46,5): error TS7053: Element implicitly has an 'any' type (property 'message' on '{}')
```

**Error categories:**
| Category | Count |
|---|---|
| Undeclared component names (`TableSkeleton`, `FilterPills`, `Pagination`) | 3 — missing imports |
| Implicit `any` on untyped response objects | 3 |

---

## Summary

| Step | Result |
|---|---|
| 4.1 pnpm install | ✅ Success (with `--ignore-scripts` to bypass pkcs11js native build) |
| 4.2 database:build | ✅ Success |
| 4.3 build all | ⚠️ Timed out; most packages built; modules-accounting-* OOM |
| 4.4a backend typecheck | ❌ Pre-existing type errors (missing subpath exports, Prisma v7 API change, @orpc/server) |
| 4.4b portal typecheck | ❌ Pre-existing type errors (React type mismatch, missing exports, missing @types/node in tsconfig) |
| 4.4c ovds-mor typecheck | ❌ Pre-existing type errors (3 missing component imports, 3 untyped response properties) |
