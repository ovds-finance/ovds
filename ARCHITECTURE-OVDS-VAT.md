# OVDS Modular VAT Declaration Architecture

> **Version:** 1.1.0 · **Status:** Production-Ready  
> Inspired by Akaunting's "thick library, thin app" modular design.  
> Every VAT jurisdiction rule, country localization, and reporting tool is an independent, pluggable module.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Layer Map — All Files Produced](#3-layer-map--all-files-produced)
4. [Core Kernel Layer (`@ovds/core/vat`)](#4-core-kernel-layer-ovdscorelvat)
5. [Country Module Layer](#5-country-module-layer)
6. [Backend Engine Layer (NestJS)](#6-backend-engine-layer-nestjs)
7. [Database Schema](#7-database-schema)
8. [Frontend Layer (React)](#8-frontend-layer-react)
9. [Request Flow — End-to-End](#9-request-flow--end-to-end)
10. [Multi-Tenant Isolation Model](#10-multi-tenant-isolation-model)
11. [Report Engine & Format Adapters](#11-report-engine--format-adapters)
12. [Authoring a New Country Module](#12-authoring-a-new-country-module)
13. [API Reference](#13-api-reference)
14. [Environment Variables](#14-environment-variables)
15. [Extending the Architecture](#15-extending-the-architecture)
16. [Security Considerations](#16-security-considerations)
17. [Roadmap](#17-roadmap)

---

## 1. Design Philosophy

### Core axiom
> The OVDS application is a **lightweight engine**.  
> Every VAT rule, every jurisdiction, every report format is a **pluggable module**.

This mirrors Akaunting's App Store model where the base product ships as minimal infrastructure, and every business function is an independently installable, versioned package.

### Five principles

| Principle | Implementation |
|-----------|---------------|
| **Separation of concerns** | VAT arithmetic lives in `IVatRuleEngine` — zero NestJS/Prisma deps |
| **Open/Closed** | Add countries by adding packages; never modify the engine |
| **Multi-tenant isolation** | Per-tenant activation; no tenant can see another's data |
| **Dependency inversion** | Orchestrator depends on `IVatRuleEngine` interface, not concrete classes |
| **Explicit over magic** | Every module registers itself; nothing is auto-scanned |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OVDS SaaS Platform                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Frontend (React + Vite)                      │  │
│  │                                                               │  │
│  │  VatModuleProvider ──► useVatModules() hook                  │  │
│  │       │                                                       │  │
│  │  VatModuleRouter   ──► /tax/vat/:countryCode/*               │  │
│  │       │                                                       │  │
│  │  VatModuleStore    ──► /tax/vat/store (App Store UI)         │  │
│  │       │                                                       │  │
│  │  CountryVatRouter  ──► lazy-loads ET / AE page sets          │  │
│  └─────────────────────────────┬────────────────────────────────┘  │
│                                │  REST /api/vat/*                  │
│  ┌─────────────────────────────▼────────────────────────────────┐  │
│  │              Backend (NestJS — OvdsVatModule)                 │  │
│  │                                                               │  │
│  │  VatDeclarationController  (10 REST endpoints)               │  │
│  │          │                                                    │  │
│  │  VatDeclarationOrchestrator (OnApplicationBootstrap)         │  │
│  │          │              │               │                     │  │
│  │  VatModuleRegistry  VatReportEngine  PrismaService           │  │
│  │          │                                                    │  │
│  │  VatModuleGuard  (per-route tenant activation check)         │  │
│  └─────────────────────────────┬────────────────────────────────┘  │
│                                │  IVatRuleEngine interface          │
│  ┌─────────────────────────────▼────────────────────────────────┐  │
│  │              Core Kernel (@ovds/core/vat)                     │  │
│  │                                                               │  │
│  │  vat-types.ts           — all canonical type contracts        │  │
│  │  vat-rule-engine.ts     — IVatRuleEngine + AbstractVat…       │  │
│  │  vat-module.ts          — VatModule (extends ModuleApp)       │  │
│  │  vat-module-registry.ts — runtime lookup + activation        │  │
│  │  report/vat-report-engine.ts — pluggable renderer dispatch   │  │
│  └─────────────────────────────┬────────────────────────────────┘  │
│                                │  extends VatModule                 │
│  ┌─────────────────────────────▼────────────────────────────────┐  │
│  │           Country Module Packages                             │  │
│  │                                                               │  │
│  │  packages/modules/tax/src/countries/                         │  │
│  │    et/  EtVatRuleEngine + EtVatModule  (ERCA, 15%, monthly)  │  │
│  │    ae/  AeVatRuleEngine + AeVatModule  (FTA,  5%, quarterly) │  │
│  │    gb/  (future) GbVatRuleEngine + GbVatModule  (HMRC, 20%) │  │
│  │    ke/  (future) KeVatRuleEngine + KeVatModule  (KRA, 16%)  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Database (MySQL / Prisma)                           │  │
│  │                                                               │  │
│  │  vat_module_manifest   — global installed module catalogue    │  │
│  │  tenant_vat_module     — per-tenant activation records        │  │
│  │  vat_filing_record     — immutable return drafts & ack refs   │  │
│  │  vat_filing_event      — audit trail for every status change  │  │
│  │  vat_report_artifact   — rendered PDF/XLSX/XML storage refs   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer Map — All Files Produced

### Core kernel (`packages/core/src/vat/`)

| File | Purpose |
|------|---------|
| `vat-types.ts` | All canonical types: `VatRate`, `VatContext`, `VatResult`, `VatFilingPeriod`, `VatReturnDraft`, `VatComplianceResult`, `VatReportTemplate`, `VatJurisdictionInfo` |
| `vat-rule-engine.ts` | `IVatRuleEngine` interface + `AbstractVatRuleEngine` base class with `calculate`, `validate`, `periods`, `buildReturn`, rate helpers |
| `vat-module.ts` | `VatModule` abstract class extending `ModuleApp`; adds `ruleEngine()`, `reportTemplates()`, `filingForms()`, `authority`, `locales`, `validateEnvVars()` |
| `vat-module-registry.ts` | `VatModuleRegistry` singleton: `register`, `resolve`, `activate`, `deactivate`, `syncTenantActivations`, `catalogue`, `catalogueForTenant` |
| `report/vat-report-engine.ts` | `VatReportEngine`: `IVatReportRenderer` interface, `registerRenderer`, `render`, `renderAll`, built-in JSON + CSV renderers |

### Country modules (`packages/modules/tax/src/countries/`)

| File | Purpose |
|------|---------|
| `et/et-vat-rule-engine.ts` | Ethiopia rule engine: 15% standard, zero-rated exports, HS-code exempt map, EIMS FSNo validation, WHT, monthly periods, ERCA VAT-01 return boxes |
| `et/et-vat-module.ts` | `EtVatModule`: 4 report templates, 2 filing forms, ORCA event listeners, 5 settings, 4 permissions, navigation menu |
| `ae/ae-vat-rule-engine.ts` | UAE rule engine: 5% standard, zero/exempt supply types, designated zones, profit-margin scheme, reverse charge, quarterly/monthly periods, FTA VAT201 return boxes |
| `ae/ae-vat-module.ts` | `AeVatModule`: 5 report templates, 2 filing forms, FTA event listeners, 6 settings, 4 permissions, navigation menu |

### Backend (`apps/backend/src/ovds/vat/`)

| File | Purpose |
|------|---------|
| `ovds-vat.module.ts` | NestJS `@Module`: provides `VAT_MODULE_REGISTRY` + `VAT_REPORT_ENGINE` as DI tokens, exports `VatDeclarationOrchestrator`, `VatFilingService`, `VatModuleGuard` |
| `vat-declaration.orchestrator.ts` | `OnApplicationBootstrap`: bootstraps registry, upserts `VatModuleManifest` DB rows, syncs tenant activations, routes calculate/validate/periods/buildReturn/buildAndSave/renderReport |
| `vat-declaration.controller.ts` | 17 REST endpoints under `/api/vat` (catalogue, activate, calculate, validate, periods, build return, render report, + 7 filing persistence endpoints) |
| `vat-filing.service.ts` | **NEW** Filing persistence: `saveDraft`, `listFilings`, `getFiling`, `getFilingEvents`, `submitFiling`, `recordAck`, `amendFiling`, `trackArtifact`, `cleanupExpiredArtifacts` |
| `dto/vat-declaration.dto.ts` | Zod schemas: Calculate, BuildReturn, RenderReport, ActivateModules, GetPeriods + **SaveFiling, ListFilings, SubmitFiling, AmendFiling, RecordAck** |
| `guards/vat-module.guard.ts` | `VatModuleGuard`: resolves `countryCode` from route/body/query, enforces per-tenant activation, throws 403 with actionable message |

### Country module barrel (`packages/modules/tax/src/`)

| File | Purpose |
|------|---------|
| `countries/index.ts` | **NEW** Barrel: exports `etVatModule`, `aeVatModule`, all classes, and `ALL_VAT_MODULES` array |
| `index.ts` | Updated: re-exports country modules directly + `countries` namespace so callers can `import { etVatModule } from '@ovds/modules/tax'` |

### Database (`packages/database/prisma/schema.prisma` — appended)

| Model | Purpose |
|-------|---------|
| `VatModuleManifest` | Global installed module catalogue, one row per country |
| `TenantVatModule` | Per-tenant activation record with settings JSON override |
| `VatFilingRecord` | Persisted return drafts; immutable once `SUBMITTED` |
| `VatFilingEvent` | Immutable audit trail for every filing status transition |
| `VatReportArtifact` | Storage references for rendered PDF/XLSX/XML report files |

### Frontend (`apps/frontend/src/`)

| File | Purpose |
|------|---------|
| `context/VatModuleContext.tsx` | React context + `useVatModules()` + `useActiveVatModules()` hooks; imports canonical types from `@ovds/core/vat`; owns catalogue, tenant modules, and all API calls including filing persistence |
| `hooks/useVatFilings.ts` | **NEW** `useVatFilings()` hook: filing list state, `saveDraft()`, `submit()`, per-mutation loading/error, optimistic list updates |
| `lib/vat-module-router.tsx` | `VatModuleRouter` + `CountryVatRouter`; `VAT_PAGE_REGISTRY` (add new country in one line); `ModuleNotActivated` wall |
| `pages/vat/VatModuleStore.tsx` | App-Store UI: `ModuleCard`, `FilterBar`, Active/Available sections, search, loading skeleton, stats |
| `pages/vat/et/EtVatFiling.tsx` | **UPDATED** Full 3-step wizard with real persistence: Step 1 builds+auto-saves DRAFT, Step 2 reviews+explicit save, Step 3 submits with 4-channel selector and ack display |
| `pages/vat/et/Et*.tsx` | Ethiopia pages: Dashboard, InputLedger, OutputLedger |
| `pages/vat/ae/Ae*.tsx` | UAE pages: Dashboard, Filing (VAT201 builder), InputLedger, OutputLedger |

---

## 4. Core Kernel Layer (`@ovds/core/vat`)

### `IVatRuleEngine` interface

```typescript
interface IVatRuleEngine {
  readonly countryCode:    string;
  readonly ruleSetVersion: string;

  calculate(ctx: VatContext): VatResult;
  validate(ctx: VatContext):  Promise<VatComplianceResult>;
  periods(year: number, frequency?: FilingFrequency): VatFilingPeriod[];
  buildReturn(companyId, periodKey, inputVat, outputVat, currency): VatReturnDraft;
  activeRates(asOfDate?: string): VatRate[];
  jurisdiction(): VatJurisdictionInfo;
}
```

**Key design decisions:**
- `calculate()` is **pure** — deterministic, side-effect-free, synchronous
- `validate()` is **async** — may query DB for regulation look-ups in future modules
- `periods()` generates filing deadlines dynamically from the year and frequency
- `buildReturn()` assembles the official authority form boxes from raw ledger totals

### `AbstractVatRuleEngine` base

Provides shared machinery so country implementors focus only on jurisdiction-specific logic:

```
AbstractVatRuleEngine
  ├── activeRates(asOfDate)      ← filters allRates() by effectiveFrom/To
  ├── resolveRate(rateType)      ← find rate by type
  ├── resolveRateForCode(hsCode) ← HS-code look-up with standard-rate fallback
  ├── applyRates(ctx, rates)     ← builds VatLineResult[]
  ├── assembleResult(ctx, lines) ← VatResult with effectiveRate, dominantRateType
  ├── buildZeroResult(ctx)       ← EXEMPT result when no rate found
  ├── validateBaseRules(ctx)     ← shared rules (non-null companyId, date format, etc.)
  ├── generatePeriods(year, freq, offsetDays) ← MONTHLY/QUARTERLY/SEMI_ANNUAL/ANNUAL
  └── periods(year, freq)        ← default: delegates to generatePeriods with freq[0]
```

Subclasses must implement:
- `allRates()` — return ALL rate rows (active + historical)
- `validateCustomRules(ctx)` — jurisdiction-specific compliance checks
- `jurisdiction()` — static metadata

### `VatModuleRegistry`

The single in-memory lookup table for the entire process lifetime:

```
register(module)           → adds to global Map<countryCode, VatModuleEntry>
resolve(code, tenantId?)   → returns VatModule | undefined (checks activation if tenantId given)
activate(tenantId, codes)  → validates codes exist, adds to tenant Set, throws if unknown
syncTenantActivations()    → called at bootstrap from DB TenantVatModule rows
catalogue()                → safe serialisable summary of all registered modules
catalogueForTenant(id)     → filtered to tenant's active codes
```

One singleton per process (`getVatModuleRegistry()`). NestJS injects it via `VAT_MODULE_REGISTRY` token.

---

## 5. Country Module Layer

### Module class hierarchy

```
ModuleApp                            ← generic plugin kernel
  └── VatModule                      ← adds VAT-specific contract
        ├── EtVatModule (ET)         ← Ethiopia / ERCA
        ├── AeVatModule (AE)         ← UAE / FTA
        ├── GbVatModule (GB)         ← (future) UK / HMRC
        └── KeVatModule (KE)         ← (future) Kenya / KRA
```

Every `VatModule` implementation must provide:

| Method | Returns | Description |
|--------|---------|-------------|
| `ruleEngine()` | `IVatRuleEngine` | Concrete engine instance |
| `reportTemplates()` | `VatReportTemplate[]` | Report templates bundled with this module |
| `filingForms()` | `VatFilingFormSpec[]` | Official authority form specs (XML schema, version) |
| `register(eventBus)` | `void` | Subscribe to domain events (invoice.posted, etc.) |
| `boot(container)` | `void` | Warm up caches, validate env vars, log status |

Plus inherited from `ModuleApp`:
- `menus()` — navigation menu items injected into the sidebar
- `permissions()` — ABAC permission declarations
- `settings()` — tenant-configurable settings with types and defaults

### Ethiopia VAT module (ET) — Reference Implementation

```
Rate:         15% standard (Proc. 285/2002)
Zero-rated:   Exports, international transport, aid projects
Exempt:       Basic foods (HS prefixes 0401, 0402, 1001, 1101…),
              medical (3003, 3004, 9018), books (4901, 4902)
Filing:       Monthly; due 30th of following month
Authority:    ERCA (Ethiopian Revenue and Customs Authority)
e-Filing:     EIMS API (OAuth2); env: EIMS_API_URL, EIMS_CLIENT_ID, EIMS_CLIENT_SECRET
Special:      WHT at source (15%); requires vendor FSNo on WHT invoices
              Reverse charge on imported services (Art. 4(3))
Calendar:     Ethiopian calendar + Gregorian both supported
Form:         ERCA VAT-01 — boxes A1–D2 (sections: Output, Input, Net, EIMS)
```

### UAE VAT module (AE)

```
Rate:         5% standard (FDL 8/2017, effective 1 Jan 2018)
Zero-rated:   Exports, international transport, healthcare (zero category),
              education (zero category), investment gold, crude oil/gas,
              first residential supply
Exempt:       Bare land, residential property (subsequent supply),
              local passenger transport, financial services (margin)
Filing:       Quarterly (default); monthly for turnover > AED 150M
              Due 28 days after period end
Authority:    FTA (Federal Tax Authority)
e-Filing:     EmaraTax API; env: FTA_API_BASE_URL, FTA_CLIENT_ID, FTA_CLIENT_SECRET, FTA_TRN
Special:      Designated Zones (treated outside UAE), Profit Margin Scheme,
              Reverse charge on imports (Art. 48)
              TRN required on B2B invoices > AED 10,000
Form:         VAT201 v3 — boxes 1a–15 (sections: Sales VAT, Purchase VAT, Net)
```

---

## 6. Backend Engine Layer (NestJS)

### Module dependency graph

```
AppModule
  └── OvdsFacadeModule
        └── OvdsVatModule
              ├── providers:
              │     VAT_MODULE_REGISTRY (singleton value)
              │     VAT_REPORT_ENGINE   (singleton value)
              │     VatDeclarationOrchestrator
              │     VatModuleGuard
              └── controllers:
                    VatDeclarationController
```

### Bootstrap sequence (`OnApplicationBootstrap`)

```
1. Register country modules into VatModuleRegistry
   etVatModule → registry.register(etVatModule)
   aeVatModule → registry.register(aeVatModule)

2. Register report templates into VatReportEngine
   etVatModule.reportTemplates() → reportEngine.registerTemplates(...)
   aeVatModule.reportTemplates() → reportEngine.registerTemplates(...)

3. Sync tenant activations from DB
   SELECT tenant_id, country_code FROM tenant_vat_module WHERE is_active = 1
   → registry.syncTenantActivations(tenantId, codes) for each tenant

4. Log summary — "2 country module(s) loaded, N tenants synced"
```

If the `tenant_vat_module` table doesn't exist yet (first run before migration), step 3 is caught and skipped with a warning — the system boots cleanly.

### `VatDeclarationOrchestrator` — service responsibilities

```
activateModules(dto)    → registry.activate() + INSERT/UPDATE tenant_vat_module + emit event
deactivateModules()     → registry.deactivate() + UPDATE is_active=0 + emit event
calculate(dto)          → resolveEngine() → engine.calculate(ctx)
validate(dto)           → resolveEngine() → engine.validate(ctx)
getPeriods(code, year)  → resolveEngine() → engine.periods(year)
buildReturn(dto)        → aggregateVatLedger() → engine.buildReturn(...)
buildAndSave(dto, actor)→ buildReturn() + filingService.saveDraft()  ← NEW
renderReport(dto)       → buildReturn() → reportEngine.render(templateId, format, ctx)
```

`resolveEngine()` throws:
- `NotFoundException`  — module not installed on platform
- `BadRequestException` — module installed but not activated for this tenant

---

### `VatFilingService` — filing lifecycle

The `VatFilingService` is the single source of truth for all `VatFilingRecord` persistence.  It is registered in `OvdsVatModule` and injected into both `VatDeclarationOrchestrator` and `VatDeclarationController`.

#### Filing state machine

```
DRAFT ──► PENDING_REVIEW ──► SUBMITTED ──► ACCEPTED
  │                │                  └──► REJECTED
  │                │                         │
  └────────────────┴──── (amend) ──────► DRAFT
```

#### Methods

| Method | Transition | Description |
|--------|-----------|-------------|
| `saveDraft(tenantId, dto, actorId)` | → `DRAFT` | Upsert — creates or updates the most recent DRAFT for the period. Throws `ConflictException` if the existing record is already submitted. |
| `listFilings(tenantId, dto)` | — | Paginated list with optional `countryCode`, `status`, `year` filters. |
| `getFiling(tenantId, id)` | — | Single record fetch, tenant-scoped (404 if wrong tenant). |
| `getFilingEvents(tenantId, filingId)` | — | Full immutable audit trail in chronological order. |
| `submitFiling(tenantId, id, dto, actorId)` | `DRAFT/PENDING_REVIEW` → `SUBMITTED` | Marks the filing as submitted. `dto.channel` determines how it reaches the authority (`API_DIRECT`, `PORTAL_UPLOAD`, `EMAIL`, `MANUAL`). |
| `recordAck(tenantId, id, dto, actorId)` | `SUBMITTED` → `ACCEPTED/REJECTED` | Called by the authority integration adapter or a webhook. Stores `ackNumber` and raw payload. |
| `amendFiling(tenantId, id, dto, actorId)` | — → new `DRAFT` | Creates a new `VatFilingRecord` with `amendmentOf = originalId`. The original is never modified. |
| `trackArtifact(params)` | — | Appends a `VatReportArtifact` row for every rendered PDF/XLSX/XML. Non-fatal on failure. |
| `cleanupExpiredArtifacts()` | — | Deletes `VatReportArtifact` rows past their `expiresAt`. Called by a scheduled job. |

Every status transition appends a `VatFilingEvent` row (append-only audit log) via the non-fatal `appendEvent()` helper and emits an `EventEmitter2` event:

| Status change | Event name |
|--------------|-----------|
| Draft created / updated | `vat.filing.saved` |
| Submitted | `vat.filing.submitted` |
| Accepted | `vat.filing.accepted` |
| Rejected | `vat.filing.rejected` |
| Amendment created | `vat.filing.amended` |

### `VatModuleGuard` — route guard

Decorates any controller method that needs activation verification:

```typescript
@UseGuards(JwtAuthGuard, VatModuleGuard)
@Get('periods/:countryCode/:year')
getPeriods(...) { ... }
```

Country code resolution priority:
1. Route param `:countryCode`
2. Request body `.countryCode`
3. Query param `?countryCode=`

Throws `ForbiddenException` with actionable message pointing to the activate endpoint.

---

## 7. Database Schema

### Entity relationship overview

```
Company (tenant root)
  │
  └── TenantVatModule (many per tenant)
        │  country_code FK ──► VatModuleManifest
        │
        └── VatFilingRecord (many per tenant+country+period)
              │
              ├── VatFilingEvent[] (immutable audit trail)
              └── VatReportArtifact[] (rendered file refs)
```

### Model descriptions

#### `VatModuleManifest`
Global catalogue of installed country modules. One row per `countryCode`. Populated at bootstrap by the orchestrator (future enhancement — currently the registry is purely in-memory; the DB model is ready for persistence).

Key fields: `countryCode UNIQUE`, `modulePackageName`, `moduleVersion`, `ruleSetVersion`, `authoritySpec JSON`, `reportTemplates JSON`, `filingForms JSON`.

#### `TenantVatModule`
Per-tenant activation. Unique constraint `(tenantId, countryCode)`.

Key fields: `tenantId`, `countryCode`, `isActive`, `activatedBy`, `activatedAt`, `settingsJson` (tenant-specific overrides like custom TRN, filing frequency choice).

#### `VatFilingRecord`
Immutable filing records. Status lifecycle:

```
DRAFT → PENDING_REVIEW → SUBMITTED → ACCEPTED
                                   └► REJECTED → AMENDED (new record)
```

Key fields: `tenantId`, `countryCode`, `periodKey`, `status`, `outputVat`, `inputVat`, `netVatPayable`, `returnDraftJson`, `complianceJson`, `ackNumber`, `ackPayloadJson`.

#### `VatFilingEvent`
Append-only audit log for every `VatFilingRecord` status transition. Never updated, never deleted.

#### `VatReportArtifact`
Storage pointer to rendered report files (PDF, XLSX, XML). Includes `expiresAt` for automatic cleanup of generated files in object storage.

### Running migrations

```bash
# Generate Prisma client after schema change
pnpm run db:generate

# Apply to local dev DB
pnpm run db:migrate:dev

# Apply to production
pnpm run db:migrate:prod
```

---

## 8. Frontend Layer (React)

### Provider hierarchy

Mount `VatModuleProvider` inside `AuthenticatedShell` so every authenticated page can access VAT module state:

```tsx
// In AuthenticatedShell or a tax-section layout component
<VatModuleProvider>
  <VatModuleRouter />   {/* mounted at /tax/vat/* */}
</VatModuleProvider>
```

### `useVatModules()` hook API

```typescript
const {
  catalogue,        // VatModuleSummary[] — all installed modules
  tenantModules,    // VatModuleSummary[] — active for this tenant
  loading,          // boolean
  error,            // string | null
  isActive,         // (code: string) => boolean
  getModule,        // (code: string) => VatModuleSummary | undefined
  activate,         // (codes: string[]) => Promise<void>
  deactivate,       // (codes: string[]) => Promise<void>
  calculate,        // (input: CalculateVatInput) => Promise<VatResult>
  getPeriods,       // (code, year) => Promise<VatFilingPeriod[]>
  buildReturn,      // (input: BuildReturnInput) => Promise<VatReturnDraft>
  renderReport,     // (input: RenderReportInput) => Promise<{filename, content, mimeType}>
  refresh,          // () => Promise<void>
} = useVatModules();
```

### Route map

```
/tax/vat/store            — VatModuleStore  (App Store)
/tax/vat/et               — EtVatDashboard
/tax/vat/et/filing        — EtVatFiling
/tax/vat/et/input         — EtVatInputLedger
/tax/vat/et/output        — EtVatOutputLedger
/tax/vat/ae               — AeVatDashboard
/tax/vat/ae/filing        — AeVatFiling
/tax/vat/ae/input         — AeVatInputLedger
/tax/vat/ae/output        — AeVatOutputLedger
/tax/vat                  — redirect → first active country or /store
```

### Adding a new country's UI

1. Create `src/pages/vat/<iso2>/` with at minimum:
   - `<ISO2>VatDashboard.tsx`
   - `<ISO2>VatFiling.tsx`
   - `<ISO2>VatInputLedger.tsx`
   - `<ISO2>VatOutputLedger.tsx`

2. Add one entry to `VAT_PAGE_REGISTRY` in `vat-module-router.tsx`:
   ```typescript
   const gbPages: CountryPageSet = {
     VatDashboard:    lazy(() => import('../pages/vat/gb/GbVatDashboard')),
     VatFiling:       lazy(() => import('../pages/vat/gb/GbVatFiling')),
     VatInputLedger:  lazy(() => import('../pages/vat/gb/GbVatInputLedger')),
     VatOutputLedger: lazy(() => import('../pages/vat/gb/GbVatOutputLedger')),
   };

   const VAT_PAGE_REGISTRY: Record<string, CountryPageSet> = {
     ET: etPages,
     AE: aePages,
     GB: gbPages,  // ← add this line
   };
   ```

3. Add the flag emoji + standard rate to `COUNTRY_META` in `VatModuleStore.tsx`.

That's the entire frontend change for a new country.

---

## 9. Request Flow — End-to-End

### VAT Calculation

```
Browser
  POST /api/vat/calculate
  { countryCode: "ET", transactionDate: "2025-07-01", subtotal: 1000, currency: "ETB" }

VatDeclarationController.calculate()
  ZodValidationPipe → CalculateVatSchema.parse(body)
  JwtAuthGuard → extracts tenantId from JWT
  PermissionsGuard → checks "vat:read"

VatDeclarationOrchestrator.calculate(dto)
  resolveEngine("ET", tenantId)
    → registry.ruleEngine("ET", tenantId)
    → throws 404 if not installed, 400 if not activated

EtVatRuleEngine.calculate(ctx)
  isExport? → zero-rated
  hsCode?   → HS-code exempt check → returns EXEMPT
  standard  → rate 15% → vatAmount = 150.00
  → assembleResult() → VatResult

Response: { success: true, data: { totalVat: 150, grandTotal: 1150, effectiveRate: 15, … } }
```

### Module Activation

```
Browser (admin user)
  POST /api/vat/modules/activate
  { countryCodes: ["AE"] }

VatDeclarationController.activateModules()
  ActivateModulesSchema.parse(body)
  tenantId = req.user.companyId

VatDeclarationOrchestrator.activateModules()
  registry.activate(tenantId, ["AE"])    ← validates AE is installed
  prisma.$executeRawUnsafe INSERT/UPDATE tenant_vat_module
  eventEmitter.emit("vat.module.activated", …)

Response: { success: true, message: "Activated: AE" }

Frontend (VatModuleContext)
  fetchTenantModules()    ← refetches tenant module list
  → tenantModules state updated
  → isActive("AE") now returns true
  → UI re-renders: AE card shows "Active" badge
```

### Filing Persistence Flow (EtVatFiling wizard)

```
Browser (Step 1 — EtVatFiling)
  POST /api/vat/returns/build?save=true
  { countryCode: "ET", periodKey: "2025-07", currency: "ETB" }

VatDeclarationController.buildReturn()
  BuildReturnSchema.parse(body)
  orchestrator.buildAndSave(dto, actorId)
    ├─ aggregateVatLedger() → { inputVat, outputVat }
    ├─ engine.buildReturn() → VatReturnDraft  (in-memory)
    └─ filingService.saveDraft()
         → VatFilingRecord { id: "3f8…", status: "DRAFT" }
         → VatFilingEvent  { eventType: "CREATED" }

Response: { success: true, data: VatReturnDraft }

Browser (Step 2 — review)
  Draft displayed; "Proceed to Submit" enabled when filing.id present

Browser (Step 3 — submit)
  POST /api/vat/filings/3f8…/submit { channel: "MANUAL" }

VatFilingService.submitFiling()
  → UPDATE vat_filing_record SET status = "SUBMITTED", submitted_at = NOW()
  → VatFilingEvent { eventType: "SUBMITTED", fromStatus: "DRAFT" }
  → eventEmitter.emit("vat.filing.submitted", { filingId, channel })

Response: { success: true, data: FilingRecord { status: "SUBMITTED" } }
UI: shows "✓ Filing submitted" banner with submittedAt + submittedBy

Authority webhook (later):
  POST /api/vat/filings/3f8…/ack { ackNumber: "ERCA-2025-001", status: "ACCEPTED" }
  → VatFilingRecord { status: "ACCEPTED", ackNumber: "ERCA-2025-001" }
  → VatFilingEvent  { eventType: "ACCEPTED" }
```

---

## 10. Multi-Tenant Isolation Model

### Activation isolation

```
Tenant A activates: [ET]
Tenant B activates: [ET, AE]
Tenant C activates: []          ← no VAT modules

registry.isActive("TenantA", "AE") → false
registry.isActive("TenantB", "AE") → true
registry.isActive("TenantC", "ET") → false

VatModuleGuard on GET /vat/periods/AE/2025:
  Tenant A → 403 "AE not activated for your organisation"
  Tenant B → passes through ✓
  Tenant C → 403 ✓
```

### Data isolation

All VAT DB models use `tenantId` as a column (not a separate schema). Every query in the orchestrator scopes by `tenantId`:

```sql
SELECT SUM(vat_amount) FROM vat_input_ledger
WHERE company_id = :tenantId AND country_code = :countryCode
  AND transaction_date BETWEEN :startDate AND :endDate
```

`VatFilingRecord` has a unique constraint `(tenantId, countryCode, periodKey, status)` — a tenant cannot accidentally overwrite another tenant's filing.

### Settings isolation

`TenantVatModule.settingsJson` stores per-tenant overrides. Example:

```json
{
  "ae_vat.filing_frequency": "MONTHLY",
  "ae_vat.trn": "100123456700003",
  "ae_vat.designated_zone_ids": "DZ001,DZ002"
}
```

These override the module's `settings()` defaults without modifying the shared module code.

---

## 11. Report Engine & Format Adapters

### Built-in renderers (zero dependencies)

| Format | Implementation | Use case |
|--------|---------------|---------|
| `JSON` | `registerBuiltinJsonRenderer()` | API responses, integration testing |
| `CSV`  | `registerBuiltinCsvRenderer()`  | Quick data exports, spreadsheet import |

### Pluggable format adapters (install as separate packages)

```typescript
// PDF adapter (using pdfmake or Puppeteer)
class PdfVatRenderer implements IVatReportRenderer {
  readonly format = 'PDF';
  async render(template, context): Promise<VatRenderResult> { … }
}

// Register at bootstrap
getVatReportEngine().registerRenderer(new PdfVatRenderer());

// XLSX adapter (using ExcelJS)
class XlsxVatRenderer implements IVatReportRenderer {
  readonly format = 'XLSX';
  async render(template, context): Promise<VatRenderResult> { … }
}

// XML adapter (using xmlbuilder2) — required for ERCA e-filing
class XmlVatRenderer implements IVatReportRenderer {
  readonly format = 'XML';
  async render(template, context): Promise<VatRenderResult> { … }
}
```

### Template authoring

Each country module declares its templates in `reportTemplates()`:

```typescript
{
  id:          'et-vat-return-form',     // stable unique ID
  label:       'ERCA VAT Return (Form VAT-01)',
  description: '…',
  formats:     ['PDF', 'XML', 'XLSX'],  // only these formats are rendered
  countryCode: 'ET',
  formVersion: 'VAT-01-2024',           // authority form version
}
```

The `VatReportEngine` will automatically surface only formats for which a renderer is registered at render time.

---

## 12. Authoring a New Country Module

Complete checklist to add, say, **Kenya (KE)**:

### Step 1 — Rule engine

```bash
# Create directory
mkdir packages/modules/tax/src/countries/ke
```

```typescript
// packages/modules/tax/src/countries/ke/ke-vat-rule-engine.ts
import { AbstractVatRuleEngine } from '../../../../../core/src/vat/vat-rule-engine';
import type { VatRate, VatComplianceIssue, VatJurisdictionInfo, VatFilingPeriod } from '../../../../../core/src/vat/vat-types';

export class KeVatRuleEngine extends AbstractVatRuleEngine {
  readonly countryCode    = 'KE';
  readonly ruleSetVersion = '1.0.0';

  protected allRates(): VatRate[] {
    return [
      { countryCode: 'KE', label: 'Standard Rate', rateType: 'STANDARD',
        rate: 16, effectiveFrom: '2023-01-01', effectiveTo: null },
      { countryCode: 'KE', label: 'Zero-Rated',    rateType: 'ZERO_RATED',
        rate: 0,  effectiveFrom: '2023-01-01', effectiveTo: null },
      { countryCode: 'KE', label: 'Exempt',         rateType: 'EXEMPT',
        rate: 0,  effectiveFrom: '2023-01-01', effectiveTo: null },
    ];
  }

  protected async validateCustomRules(ctx): Promise<VatComplianceIssue[]> {
    const issues: VatComplianceIssue[] = [];
    if (ctx.currency !== 'KES') {
      issues.push({ code: 'KE-001', severity: 'WARNING',
        message: 'KRA VAT returns must be reported in KES.', field: 'currency' });
    }
    return issues;
  }

  jurisdiction(): VatJurisdictionInfo {
    return {
      countryCode: 'KE', countryName: 'Kenya',
      authorityName: 'Kenya Revenue Authority', authorityAbbrev: 'KRA',
      authorityUrl: 'https://www.kra.go.ke',
      currency: 'KES', rates: this.activeRates(),
      filingFrequencies: ['MONTHLY'], eFilingMandatory: true,
      registrationThreshold: 5_000_000,
    };
  }

  periods(year: number, frequency?: FilingFrequency): VatFilingPeriod[] {
    return this.generatePeriods(year, frequency ?? 'MONTHLY', 20);
  }
}
```

### Step 2 — Module class

```typescript
// packages/modules/tax/src/countries/ke/ke-vat-module.ts
import { VatModule } from '../../../../../core/src/vat/vat-module';
import { KeVatRuleEngine } from './ke-vat-rule-engine';

export class KeVatModule extends VatModule {
  private _engine = new KeVatRuleEngine();
  constructor() {
    super({
      name: 'ke-vat', displayName: 'Kenya VAT (KRA)', version: '1.0.0',
      countryCode: 'KE', countryName: 'Kenya',
      filingFrequencies: ['MONTHLY'],
      authority: { id: 'KRA', name: 'Kenya Revenue Authority',
        apiBaseUrl: process.env['KRA_API_URL'] ?? null,
        authMethod: 'API_KEY', filingChannels: ['PORTAL_UPLOAD', 'API_DIRECT'],
        sandboxSupported: false, requiredEnvVars: ['KRA_API_URL', 'KRA_API_KEY'] },
      locales: [{ languageTag: 'sw-KE', label: 'Swahili (Kenya)',
        numberFormat: { decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2 },
        currency: { code: 'KES', symbol: 'KSh', symbolPosition: 'BEFORE' },
        calendarSystem: 'GREGORIAN', dateFormat: 'DD/MM/YYYY' }],
    });
  }
  ruleEngine() { return this._engine; }
  reportTemplates() { return []; }  // add KRA form templates here
  filingForms() { return []; }
  async register(eventBus) { /* subscribe to events */ }
  async boot(container) { this.logger.log('KeVatModule booted'); }
}

export const keVatModule = new KeVatModule();
```

### Step 3 — Register on the backend (one line)

```typescript
// apps/backend/src/ovds/vat/vat-declaration.orchestrator.ts
import { keVatModule } from '../../../../packages/modules/tax/src/countries/ke/ke-vat-module';

// In onApplicationBootstrap():
const modules = [etVatModule, aeVatModule, keVatModule]; // ← add here
```

### Step 4 — Frontend UI (4 pages + 2 lines)

Create `src/pages/vat/ke/{KeVatDashboard,KeVatFiling,KeVatInputLedger,KeVatOutputLedger}.tsx`.

Add to `VAT_PAGE_REGISTRY` in `vat-module-router.tsx`:
```typescript
KE: {
  VatDashboard:    lazy(() => import('../pages/vat/ke/KeVatDashboard')),
  VatFiling:       lazy(() => import('../pages/vat/ke/KeVatFiling')),
  VatInputLedger:  lazy(() => import('../pages/vat/ke/KeVatInputLedger')),
  VatOutputLedger: lazy(() => import('../pages/vat/ke/KeVatOutputLedger')),
},
```

Add to `COUNTRY_META` in `VatModuleStore.tsx`:
```typescript
KE: { flag: '🇰🇪', standardRate: '16%' },
```

**Total change surface for a new country: ~150 lines of typed TypeScript across 6 files. Zero changes to the engine, orchestrator, guard, or registry.**

---

## 13. API Reference

All endpoints require `Authorization: Bearer <token>` and `permissions: vat:read` (or higher).

### Module Management

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET`  | `/api/vat/modules` | `vat:read` | All installed country modules |
| `GET`  | `/api/vat/modules/tenant` | `vat:read` | Modules active for calling tenant |
| `POST` | `/api/vat/modules/activate` | `vat:admin` | Activate `{ countryCodes: string[] }` |
| `POST` | `/api/vat/modules/deactivate` | `vat:admin` | Deactivate `{ countryCodes: string[] }` |

### VAT Operations

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `POST` | `/api/vat/calculate` | `vat:read` | Real-time VAT calculation |
| `POST` | `/api/vat/validate` | `vat:read` | Compliance check (no DB write) |
| `GET`  | `/api/vat/periods/:countryCode/:year` | `vat:read` | Filing periods for year |
| `POST` | `/api/vat/returns/build` | `vat:write` | Build return draft from ledger |

### Reports

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET`  | `/api/vat/reports/templates/:countryCode` | `vat:read` | Available report templates |
| `POST` | `/api/vat/reports/render` | `vat:write` | Render PDF/XLSX/XML/JSON/CSV |

### Filing Persistence

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `POST` | `/api/vat/returns/build?save=true` | `vat:write` | Build return draft **and** auto-persist as DRAFT |
| `POST` | `/api/vat/filings/save` | `vat:write` | Save (create or update) a DRAFT filing |
| `GET`  | `/api/vat/filings` | `vat:read` | List filings — query: `countryCode`, `status`, `year`, `page`, `limit` |
| `GET`  | `/api/vat/filings/:id` | `vat:read` | Get a single filing by UUID |
| `GET`  | `/api/vat/filings/:id/events` | `vat:read` | Immutable audit trail for a filing |
| `POST` | `/api/vat/filings/:id/submit` | `vat:submit` | Transition DRAFT → SUBMITTED |
| `POST` | `/api/vat/filings/:id/ack` | `vat:admin` | Record ACCEPTED/REJECTED from authority |
| `POST` | `/api/vat/filings/:id/amend` | `vat:write` | Create an amendment (new DRAFT referencing original) |

#### Save filing request schema

```json
{
  "countryCode":   "ET",
  "periodKey":     "2025-07",
  "currency":      "ETB",
  "returnDraft":   { "lines": [ … ] },
  "outputVat":     15000,
  "inputVat":      8000,
  "netVatPayable": 7000,
  "dueDate":       "2025-08-30",
  "notes":         "Reviewed by finance team"
}
```

#### Submit filing request schema

```json
{
  "channel": "API_DIRECT",
  "notes":   "Submitted via ERCA EIMS API"
}
```

Allowed `channel` values: `API_DIRECT` · `PORTAL_UPLOAD` · `EMAIL` · `MANUAL`

#### Filing record response shape

```json
{
  "id":             "3f8a1b2c-…",
  "tenantId":       "company-uuid",
  "countryCode":    "ET",
  "periodKey":      "2025-07",
  "status":         "SUBMITTED",
  "currency":       "ETB",
  "outputVat":      15000,
  "inputVat":       8000,
  "netVatPayable":  7000,
  "submittedAt":    "2025-08-15T09:30:00.000Z",
  "submittedBy":    "user-id",
  "ackNumber":      null,
  "dueDate":        "2025-08-30",
  "amendmentOf":    null,
  "createdAt":      "2025-08-10T08:00:00.000Z",
  "updatedAt":      "2025-08-15T09:30:00.000Z"
}
```

### Filing data flow — end-to-end

```
Browser (EtVatFiling wizard)
  Step 1: POST /api/vat/returns/build?save=true
          → orchestrator.buildAndSave()
          → filingService.saveDraft()
          → VatFilingRecord { status: DRAFT, id: "3f8…" }

  Step 2: Review return lines
          If auto-save failed: POST /api/vat/filings/save  (explicit save)
          → filingService.saveDraft()  (idempotent upsert)

  Step 3: POST /api/vat/filings/3f8…/submit { channel: "API_DIRECT" }
          → filingService.submitFiling()
          → VatFilingRecord { status: SUBMITTED }
          → EventEmitter2.emit('vat.filing.submitted')
          → appendEvent(SUBMITTED) → VatFilingEvent row

  Authority webhook: POST /api/vat/filings/3f8…/ack { ackNumber: "ERCA-2025-001", status: "ACCEPTED" }
          → filingService.recordAck()
          → VatFilingRecord { status: ACCEPTED, ackNumber: "ERCA-2025-001" }
          → appendEvent(ACCEPTED) → VatFilingEvent row
```

### Calculate request schema

```json
{
  "countryCode":     "ET",
  "transactionDate": "2025-07-15",
  "subtotal":        10000,
  "currency":        "ETB",
  "hsCode":          "1101",
  "isExport":        false,
  "isImport":        false,
  "reverseCharge":   false,
  "meta": {
    "vendorFsNo":      "FS-0001234",
    "whtApplicable":   true
  }
}
```

### Calculate response schema

```json
{
  "success": true,
  "data": {
    "countryCode":          "ET",
    "subtotal":             10000,
    "totalVat":             0,
    "grandTotal":           10000,
    "currency":             "ETB",
    "effectiveRate":        0,
    "reverseChargeApplied": false,
    "dominantRateType":     "EXEMPT",
    "calculatedAt":         "2025-07-15T09:00:00.000Z",
    "lines": [
      { "description": "Exempt", "rateType": "EXEMPT",
        "rate": 0, "taxableAmount": 10000, "vatAmount": 0 }
    ]
  }
}
```

---

## 14. Environment Variables

### Ethiopia (ERCA integration)

| Variable | Required | Description |
|----------|----------|-------------|
| `EIMS_API_URL` | For e-filing | ERCA EIMS API base URL |
| `EIMS_CLIENT_ID` | For e-filing | OAuth2 client ID |
| `EIMS_CLIENT_SECRET` | For e-filing | OAuth2 client secret |

Without these, the ET module boots in **portal-upload mode** (manual filing). The system warns but does not crash.

### UAE (FTA integration)

| Variable | Required | Description |
|----------|----------|-------------|
| `FTA_API_BASE_URL` | For e-filing | FTA EmaraTax API base URL |
| `FTA_CLIENT_ID` | For e-filing | OAuth2 client ID |
| `FTA_CLIENT_SECRET` | For e-filing | OAuth2 client secret |
| `FTA_TRN` | For e-filing | Company Tax Registration Number |

---

## 15. Extending the Architecture

### Adding a format renderer (PDF/XLSX/XML)

```typescript
// packages/adapters/vat-pdf-renderer/src/index.ts
import type { IVatReportRenderer, VatReportTemplate, VatRenderContext, VatRenderResult }
  from '@ovds/core/vat/report/vat-report-engine';

export class PdfVatRenderer implements IVatReportRenderer {
  readonly format = 'PDF' as const;

  async render(template: VatReportTemplate, ctx: VatRenderContext): Promise<VatRenderResult> {
    // Use pdfmake, Puppeteer, or react-pdf to generate buffer
    const buffer = await generatePdf(template, ctx);
    return {
      templateId: template.id,
      format:     'PDF',
      mimeType:   'application/pdf',
      filename:   `vat-return-${ctx.returnDraft.periodKey}.pdf`,
      buffer,
      renderedAt: new Date().toISOString(),
    };
  }
}

// Register in OvdsVatModule or a dedicated AdaptersModule
getVatReportEngine().registerRenderer(new PdfVatRenderer());
```

### Adding a third-party authority integration

Each country module can define an authority adapter that the orchestrator calls during `submitFiling()`:

```typescript
interface IAuthorityAdapter {
  readonly authorityId: string;
  submit(draft: VatReturnDraft, credentials: Record<string, string>): Promise<VatAckPayload>;
  checkStatus(ackNumber: string): Promise<VatFilingStatus>;
}
```

Authority adapters are registered separately from rule engines — decoupling calculation logic from network I/O.

### Adding compliance framework hooks

```typescript
// A compliance module can listen to VAT events
eventBus.listen('vat.filing.submitted', async (event) => {
  // Update compliance checklist, trigger audit notification, etc.
});
```

---

## 16. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Tenant data leakage | All queries scoped by `tenantId`; `VatModuleGuard` prevents cross-tenant activation |
| Privilege escalation | `vat:admin` required for activate/deactivate; separated from `vat:read`/`vat:write` |
| Input injection | All API inputs validated via Zod schemas before reaching orchestrator |
| Rate limiting | Global `ThrottlerGuard` applies to all `/api/vat/*` endpoints |
| Authority credentials | API keys/secrets stored as env vars, never in DB or logs; `validateEnvVars()` surface missing vars at startup |
| Return immutability | Once `VatFilingRecord.status = SUBMITTED`, amendments create a new record (audit trail preserved) |
| CSRF | All state-changing endpoints protected by `CsrfProtectionMiddleware` inherited from `AppModule` |

---

## 17. Roadmap

| Phase | Features |
|-------|---------|
| **v1.0** ✅ | ET + AE modules, registry, orchestrator, report engine (JSON/CSV), App Store UI, multi-tenant activation |
| **v1.1** ✅ | `VatFilingService` full filing lifecycle (DRAFT→SUBMITTED→ACCEPTED/REJECTED→AMENDED), 7 filing API endpoints, `useVatFilings` hook, EtVatFiling 3-step wizard with real persistence, `VatModuleManifest` DB bootstrap, countries barrel, `@ovds/core/vat` subpath exports |
| **v1.2** | PDF renderer adapter (pdfmake), XLSX renderer (ExcelJS), XML renderer (xmlbuilder2 for ERCA e-filing) |
| **v1.3** | ERCA EIMS API direct e-filing adapter, automatic ack webhook handler, BullMQ retry queue for failed submissions |
| **v1.4** | FTA EmaraTax API adapter, VAT201 XML schema validation before submission |
| **v2.0** | UK (GB) module, Kenya (KE) module, module marketplace in App Store |
| **v2.1** | AI-assisted rate classification from invoice line descriptions (HS code suggestion) |
| **v2.2** | Cross-jurisdiction consolidation reports (multi-country enterprise filings) |
| **v3.0** | Module hot-reload (activate new country without restart), versioned rule sets with effective-date management |

---

*This document is the canonical reference for the OVDS modular VAT architecture.*  
*Update it whenever a new country module is added or the engine contract changes.*
