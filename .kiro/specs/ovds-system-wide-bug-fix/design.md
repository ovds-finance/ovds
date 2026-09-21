# OVDS System-Wide Bug Fix — Bugfix Design

## Overview

Five confirmed bugs block production builds and strict-mode TypeScript compilation across the OVDS monorepo (React 19/Vite 8 frontend, NestJS 11 backend, Prisma 7 on MariaDB). Together they prevent the frontend from building entirely (63 bundler MISSING_EXPORT errors), break the NestJS backend TypeScript compilation (3 errors across 2 files), and introduce silent runtime failures in browser environments through misuse of Node.js-only APIs.

The fix strategy is minimal and surgical: correct the broken `package.json` entry points for ~40 feature packages, tighten the type annotation at two `companyId` assignment sites, remove one obsolete Prisma internal import, fix one invalid Prisma count call, and replace one static Node.js `crypto` import in `license-crypto.native.ts` with a guarded dynamic import or move it fully to a `.node.ts` boundary.

No new abstractions, no architectural changes, no feature removals. All five bugs must be fixed together to achieve a clean `tsc --noEmit` and a passing `vite build`.

---

## Glossary

- **Bug_Condition (C)**: The condition that identifies an input that triggers one of the five confirmed bugs.
- **Property (P)**: The desired correct behavior when the bug condition holds — i.e., what the fixed system must do instead.
- **Preservation**: Existing observable behaviors (API contracts, build outputs, runtime results) that the fix must not change.
- **isBugCondition_BugN**: Pseudocode predicate for each bug's trigger condition.
- **rolldown / Vite 8**: The bundler used for the frontend production build; resolves workspace packages through alias entries in `vite.config.ts`.
- **`resolvedCompanyId`**: A `string | null` variable in `auth.service.ts` that carries the tenant scope during login and profile resolution.
- **`Prisma.Decimal`**: The Prisma 7 runtime decimal type, available from the top-level `@prisma/client` package only (the internal sub-path `@prisma/client/runtime/library` was removed in Prisma v5+).
- **Web Crypto API (`globalThis.crypto.subtle`)**: The browser-native cryptographic API, available in all modern browsers and in Node.js ≥ 15 as a global.
- **`LicenseCryptoNative`**: The class in `packages/shared/src/license-crypto.native.ts` that uses Node.js `crypto` for HMAC-SHA256 license signing and timing-safe verification. Backend-only.

---

## Bug Details

### Bug 1 — Frontend Build Failure: 63 Missing Exports

#### Bug Condition

The bug manifests when the rolldown bundler processes a frontend page that imports named symbols from a `@ovds/features/*` package whose `package.json` `main` field points to a non-existent file (either `./dist/index.js` for unbuilt packages, or `./src/index.js` where the file on disk is `src/index.ts`). Rolldown cannot statically resolve re-exports through this broken entry point and emits a MISSING_EXPORT error per symbol.

**Formal Specification:**
```
FUNCTION isBugCondition_Bug1(pkg)
  INPUT: pkg of type FeaturePackage
  OUTPUT: boolean

  RETURN (pkg.packageJson.main ENDS WITH ".js" AND file(pkg.packageJson.main) DOES NOT EXIST ON DISK)
      OR (pkg.packageJson.main ENDS WITH "index.js" AND src/index.ts EXISTS BUT src/index.js DOES NOT)
END FUNCTION
```

#### Examples

- `packages/features/tax/package.json` has `"main": "./dist/index.js"` — `dist/` does not exist → MISSING_EXPORT for `calculateTot`, `triggerAutoComputeTot`, and 28 other symbols.
- `packages/features/eims/package.json` has `"main": "./src/index.js"` — `src/index.ts` exists but `src/index.js` does not → MISSING_EXPORT for `useCyberAuditList`, `useCyberAudit`, and 30 other symbols.
- `packages/features/security/package.json` has `"main": "./src/index.js"` — same broken `.js` extension.
- Packages like `packages/features/projects` and `packages/features/platform` already use `"main": "src/index.ts"` and are NOT affected.

---

### Bug 2 — Backend TS2322: `string | null` not assignable to `string`

#### Bug Condition

The bug manifests when TypeScript strict mode evaluates the assignment of `resolvedCompanyId` (typed `string | null`) into an object property context inferred as `string`. This occurs at two call sites in `auth.service.ts`: the `login()` method (~line 80, 96) and the `getProfile()` method (~line 447).

**Formal Specification:**
```
FUNCTION isBugCondition_Bug2(assignmentSite)
  INPUT: assignmentSite of type TypeScriptAssignment
  OUTPUT: boolean

  RETURN assignmentSite.sourceType = "string | null"
     AND assignmentSite.targetType = "string"
     AND tsc.strictNullChecks = true
END FUNCTION
```

#### Examples

- `auth.service.ts` ~line 80: `companyId: resolvedCompanyId` inside `const payload = { ... }` — the JWT payload type inferred by `JwtService.sign()` may expect `string`.
- `auth.service.ts` ~line 96: `companyId: resolvedCompanyId` inside the returned `user` object literal — the return type of `login()` is `any` so TypeScript doesn't enforce it here; the actual error is at line 80 in the JWT payload.
- `auth.service.ts` ~line 447: same pattern in `getProfile()` response shape.

---

### Bug 3 — Backend TS2307: Cannot find module `@prisma/client/runtime/library`

#### Bug Condition

The bug manifests when TypeScript processes `trade.service.ts` and encounters `import { Prisma } from '@prisma/client/runtime/library'`. This internal sub-path was removed in Prisma v5; the monorepo uses Prisma 7.

**Formal Specification:**
```
FUNCTION isBugCondition_Bug3(importDeclaration)
  INPUT: importDeclaration of type TSImportDeclaration
  OUTPUT: boolean

  RETURN importDeclaration.moduleSpecifier = '@prisma/client/runtime/library'
     AND installedPrismaVersion >= 5
END FUNCTION
```

#### Examples

- `trade.service.ts` line 24: `import { Prisma } from '@prisma/client/runtime/library'` → TS2307 error; `Prisma` (including `Prisma.Decimal`) is available from the already-present top-level import `import { Prisma } from '@prisma/client'` at line 21.

---

### Bug 4 — Backend TS2345: Prisma `tradeLicense.count()` with `undefined`

#### Bug Condition

The bug manifests when Prisma 7's strict typings reject an explicit `undefined` argument passed to `tradeLicense.count()`. The ternary `companyId ? { where: { companyId } } : undefined` produces a union type `{ where: { companyId: string } } | undefined` but the second branch collapses to `{}` in some TypeScript evaluations, neither of which satisfies the required parameter type.

**Formal Specification:**
```
FUNCTION isBugCondition_Bug4(callSite)
  INPUT: callSite of type PrismaCountCall
  OUTPUT: boolean

  RETURN callSite.argument = "companyId ? { where: { companyId } } : undefined"
     AND prismaVersion >= 5
     AND tsc.strict = true
END FUNCTION
```

#### Examples

- `trade.service.ts` ~line 98: `this.prisma.tradeLicense.count(companyId ? { where: { companyId } } : undefined)` → TS2345; fix is `companyId ? this.prisma.tradeLicense.count({ where: { companyId } }) : this.prisma.tradeLicense.count()`.

---

### Bug 5 — Node.js `crypto` in Browser-Bundled `@ovds/shared`

#### Bug Condition

The bug manifests when Vite processes `@ovds/shared` (aliased to `packages/shared/src/`) for the browser build and encounters static `import * as crypto from 'crypto'` or synchronous `require('crypto')` calls that are not guarded by a runtime environment check. Vite externalizes the Node built-in and emits warnings; at runtime in the browser these calls produce `undefined` or throw.

**Formal Specification:**
```
FUNCTION isBugCondition_Bug5(file)
  INPUT: file of type SharedPackageFile
  OUTPUT: boolean

  RETURN file IS INCLUDED IN vite.config.ts alias for '@ovds/shared'
     AND (file CONTAINS "import * as crypto from 'crypto'"    // static top-level import
          OR file CONTAINS "require('crypto')" WITHOUT runtime isNode guard
          OR file CONTAINS Buffer.from() WITHOUT isNode guard)
     AND browserEnvironment = true
END FUNCTION
```

#### Examples

- `license-crypto.native.ts`: `import * as crypto from 'crypto'` — static top-level import, unconditionally bundled → Vite warning + runtime crash in browser.
- `utils.ts`: `require('crypto')` inside `randomBytes()` — no environment guard; throws in browser.
- `tax-invoice-qr.ts`: `require('crypto')` is guarded via `typeof require !== 'undefined'` but still causes a Vite externalization warning; the async `sha256TaxInvoiceHashAsync()` path already uses SubtleCrypto correctly.
- `security/request-signing.ts`: already uses a dynamic `await import('crypto')` with Web Crypto primary path — **not buggy**, no change needed.
- `eims/eims-encryption.ts`: uses dynamic `await import('crypto')` with a try/catch throwing a descriptive error — **not buggy for the browser bundle** (dynamic import is not statically bundled by Vite); no change needed.
- `eims/eims-signing.ts`, `eims/csr-encoder.ts`, `ovds/etax-payload.types.ts`: require further inspection to confirm bundling scope.

---

## Expected Behavior

### Preservation Requirements

**Bug 1 — Unchanged Behaviors:**
- The `vite.config.ts` alias map SHALL remain unchanged; `@ovds/features/tax` continues to resolve to `packages/features/tax/src/index.ts` at dev time.
- All named exports currently exposed by every feature package `src/index.ts` SHALL continue to be importable by frontend pages without modification to the index files themselves.
- HMR (Hot Module Replacement) during development SHALL continue to work via the existing alias paths.

**Bug 2 — Unchanged Behaviors:**
- When `resolvedCompanyId` is a non-null `string`, the JWT payload and login response body SHALL continue to include it under the `companyId` key with the same string value.
- When `resolvedCompanyId` is `null` (user has no company association), the login response SHALL continue to return `null` in the `companyId` field without throwing or coercing it to a different value.
- The JWT signing algorithm, token expiry, and refresh token flow SHALL remain unchanged.

**Bug 3 — Unchanged Behaviors:**
- `Prisma.Decimal` usage inside `toDecimal()` and `computeTotalTaxes()` SHALL continue to provide arbitrary-precision arithmetic for financial calculations.
- All trade service operations (shipment CRUD, forex approvals, proforma invoices, dashboard) SHALL continue to produce correctly typed `Prisma.Decimal` results.

**Bug 4 — Unchanged Behaviors:**
- When `companyId` is provided to `getDashboard()`, the count SHALL continue to filter trade licenses to that company only.
- When `companyId` is absent, the count SHALL continue to return the total across all trade licenses.

**Bug 5 — Unchanged Behaviors:**
- `LicenseCryptoNative.sign()` and `LicenseCryptoNative.verify()` called from NestJS SHALL continue to use Node.js HMAC-SHA256 and `timingSafeEqual` and produce identical signed keys.
- `sha256TaxInvoiceHashAsync()` in `tax-invoice-qr.ts` already uses `SubtleCrypto` and SHALL continue to compute correct hashes in both browser and server contexts.
- The Node.js path in `randomBytes()` (if used server-side) SHALL continue to produce cryptographically-secure random bytes.

**Scope of Non-Affected Inputs:**
All existing code paths that do not import from the affected feature packages, do not rely on `resolvedCompanyId` assignment typing, do not import from `@prisma/client/runtime/library`, do not call `tradeLicense.count()`, and do not call Node-crypto-backed functions from browser context are completely unaffected by this fix.

---

## Hypothesized Root Cause

### Bug 1

1. **Inconsistent scaffold defaults**: The monorepo scaffolding tool used to generate new feature packages defaults to `"main": "./dist/index.js"` (a compiled-output pattern common in published npm packages). However, workspace packages in this monorepo are consumed source-first via Vite aliases and never need a `dist/` build.
2. **Partial manual overrides**: A small subset of packages (`projects`, `platform`, `payments`, `journal`, `compliance`, `chart-of-accounts`) were manually corrected to `src/index.ts` at some point, but the remaining ~35 were not.
3. **Wrong extension variant**: `eims` and `security` were partially corrected but used `.js` instead of `.ts`, leaving them still broken.

### Bug 2

1. **JWT payload type inference**: `JwtService.sign(payload)` from `@nestjs/jwt` infers the payload type from the object literal. If the JWT strategy or a downstream decoder expects `companyId: string` (not `string | null`), TypeScript's strict mode surfaces the mismatch.
2. **Variable declared too broadly**: `resolvedCompanyId` is correctly typed `string | null` to represent the nullable database value, but the assignment context narrows it to `string` when the JWT payload interface requires a non-optional string.

### Bug 3

1. **Stale import from a Prisma major version upgrade**: The `@prisma/client/runtime/library` sub-path was valid in Prisma v4 but was removed in v5 as part of a runtime restructure. The import was not updated when the monorepo was upgraded to Prisma 7.
2. **Redundant import**: The top-level `import { Prisma } from '@prisma/client'` already exists in the file, making the `/runtime/library` import entirely superfluous.

### Bug 4

1. **Incorrect conditional pattern**: The ternary `count(x ? args : undefined)` was written with the assumption that Prisma accepts `undefined` as "no filter". Prisma 7 strict types require either a valid args object or the argument to be entirely absent (no argument at all).

### Bug 5

1. **`license-crypto.native.ts` — wrong module boundary**: The file's name suffix `.native.ts` signals Node-only usage, but the `@ovds/shared` package does not enforce tree-shaking or separate entry points. The static `import * as crypto from 'crypto'` is therefore included in the browser bundle even though no browser page should call `LicenseCryptoNative`.
2. **`utils.ts` — missing environment guard on `require('crypto')`**: The `randomBytes()` function uses a bare `require('crypto')` with no `typeof window === 'undefined'` or `isNode` guard, unlike the `tax-invoice-qr.ts` which does check before calling `require`.

---

## Correctness Properties

Property 1: Bug Condition — Feature Package Exports Resolve in Production Build

_For any_ feature package where `isBugCondition_Bug1` holds (broken `main` entry), after applying the fix the production build SHALL complete with exit code 0 and the rolldown bundler SHALL resolve all named exports from that package's `src/index.ts` without emitting a MISSING_EXPORT error.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation — Dev-Mode Alias Resolution Unchanged

_For any_ feature package where `isBugCondition_Bug1` does NOT hold (already-correct `src/index.ts` entry), the Vite dev server SHALL continue to resolve workspace aliases to `src/index.ts` with the same behavior as before the fix.

**Validates: Requirements 3.1, 3.2, 3.3**

Property 3: Bug Condition — `string | null` CompanyId Compiles Without TS2322

_For any_ assignment of `resolvedCompanyId` where `isBugCondition_Bug2` holds (target type is `string`, source is `string | null`), after the fix the TypeScript compiler SHALL produce no TS2322 error at that site in strict mode.

**Validates: Requirements 2.4, 2.5**

Property 4: Preservation — Login Response CompanyId Value Unchanged

_For any_ authenticated user where `isBugCondition_Bug2` does NOT hold (user has a non-null `companyId`), the login response and JWT payload SHALL continue to carry the same `companyId` value as before the fix.

**Validates: Requirements 3.4, 3.5**

Property 5: Bug Condition — Prisma Runtime Import Compiles Without TS2307

_For any_ file where `isBugCondition_Bug3` holds (contains `import from '@prisma/client/runtime/library'`), after the fix the TypeScript compiler SHALL produce no TS2307 error for that import, and `Prisma.Decimal` SHALL remain accessible via the top-level `@prisma/client` import.

**Validates: Requirements 2.6, 2.7**

Property 6: Preservation — Decimal Arithmetic Behavior Unchanged

_For any_ call to `toDecimal()` or `computeTotalTaxes()` in `trade.service.ts`, the return type and computed values SHALL be identical before and after the fix.

**Validates: Requirements 3.6, 3.7**

Property 7: Bug Condition — Prisma Count Compiles Without TS2345

_For any_ call site where `isBugCondition_Bug4` holds (explicit `undefined` passed to `count()`), after the fix the TypeScript compiler SHALL produce no TS2345 error, and the runtime behavior SHALL filter by `companyId` when provided or count all records when absent.

**Validates: Requirements 2.8, 2.9, 2.10**

Property 8: Preservation — Dashboard Count Results Unchanged

_For any_ invocation of `getDashboard()` where `isBugCondition_Bug4` does NOT hold, the `totalLicenses` figure in the response SHALL be identical before and after the fix.

**Validates: Requirements 3.8, 3.9**

Property 9: Bug Condition — No Node.js `crypto` Externalization Warnings in Browser Build

_For any_ file where `isBugCondition_Bug5` holds (static/unguarded Node crypto import bundled for browser), after the fix the Vite browser build SHALL emit no externalization warning for that file and any browser code path through that file SHALL execute without throwing.

**Validates: Requirements 2.11, 2.12**

Property 10: Preservation — Node.js Crypto Behavior Unchanged in Backend

_For any_ call to `LicenseCryptoNative.sign()` or `LicenseCryptoNative.verify()` from a Node.js context, the output SHALL be byte-for-byte identical before and after the fix.

**Validates: Requirements 2.13, 3.10, 3.12**

---

## Fix Implementation

### Bug 1 — Correct `package.json` `main` and `types` fields

**Files**: All `packages/features/*/package.json` where `main` is `./dist/index.js` or `./src/index.js`

**Specific Changes:**

1. **Packages pointing to `./dist/index.js`** (~35 packages including `tax`, `banking`, `hr`, `payroll`, `invoice`, `inventory`, etc.): change `"main"` to `"./src/index.ts"` and `"types"` to `"./src/index.ts"`.

2. **Packages pointing to `./src/index.js`** (`eims`, `security`): change `"main"` to `"./src/index.ts"` and `"types"` to `"./src/index.ts"`.

3. **No changes to `vite.config.ts`**: the alias map already resolves to `src/index.ts`; only the `package.json` entry points need to match so that Node module resolution (used by `tsc` and the bundler's module graph walker) also finds the correct file.

4. **No changes to any `src/index.ts` files**: the export surfaces are correct; only the pointers to them were broken.

---

### Bug 2 — Fix `resolvedCompanyId` type at assignment sites

**File**: `apps/backend/src/auth/auth.service.ts`

**Specific Changes:**

1. **`login()` method — JWT payload** (~line 80): The `payload` object passed to `jwtService.sign()` should explicitly type `companyId` as `string | null`. If the JWT strategy interface requires `string`, add a local type cast only at the JWT signing call with a comment explaining the null is intentional: `companyId: resolvedCompanyId as string | null`. Alternatively, if the strategy interface can be widened, widen it there.

2. **`login()` return value** (~line 96): The `user.companyId` in the return object is untyped (`any` return), so no TypeScript error surfaces here, but keep `resolvedCompanyId` as-is for runtime correctness (null is a valid and expected value).

3. **`getProfile()` method** (~line 447): Same treatment — ensure `companyId: resolvedCompanyId` is typed `string | null` in the return object, not narrowed to `string`.

4. **Do NOT use non-null assertion (`!`)**: A `!` would suppress the TypeScript error but hide a real null at runtime. The value can legitimately be null and the API contract documents it.

---

### Bug 3 — Remove `@prisma/client/runtime/library` import

**File**: `apps/backend/src/trade/trade.service.ts`

**Specific Changes:**

1. **Remove line 24**: Delete the line `import { Prisma } from '@prisma/client/runtime/library'`.
2. **Verify line 21**: Confirm `import { Prisma } from '@prisma/client'` already exists (it does, at line 21) — no new import needed.
3. **No other changes**: All usages of `Prisma.Decimal`, `Prisma.TradeShipmentWhereInput`, etc. resolve through the top-level import.

---

### Bug 4 — Fix `tradeLicense.count()` argument

**File**: `apps/backend/src/trade/trade.service.ts`

**Specific Changes:**

1. **Replace the ternary argument pattern** (~line 98):

   Before:
   ```typescript
   this.prisma.tradeLicense.count(companyId ? { where: { companyId } } : undefined),
   ```

   After:
   ```typescript
   companyId
     ? this.prisma.tradeLicense.count({ where: { companyId } })
     : this.prisma.tradeLicense.count(),
   ```

   This satisfies Prisma 7's strict typings: when `companyId` is truthy, `count` receives a valid args object; when falsy, `count` is called with no argument.

---

### Bug 5 — Guard or isolate Node.js `crypto` in `@ovds/shared`

**Files**: `packages/shared/src/license-crypto.native.ts`, `packages/shared/src/utils.ts`

**Specific Changes:**

1. **`license-crypto.native.ts`** — Convert the static top-level import to a dynamic import pattern or confirm the file is excluded from the browser bundle:

   - **Option A (preferred)**: Add `// @vite-ignore` and convert to a conditional dynamic import with a clear browser-throw guard, consistent with how `eims-encryption.ts` handles this:
     ```typescript
     // Node.js only — do not call from browser contexts
     async function getCrypto(): Promise<typeof import('crypto')> {
       try { return await import('crypto'); }
       catch { throw new Error('LicenseCryptoNative: Node.js runtime required'); }
     }
     ```
     Then convert `sign()` and `verify()` to async and use `await getCrypto()` internally.
   
   - **Option B**: Add `license-crypto.native.ts` to Vite's `optimizeDeps.exclude` or use a `resolve.alias` condition to replace it with a no-op stub in the browser bundle. Less invasive to the call sites.

2. **`utils.ts` — `randomBytes()`**: Add an environment guard matching the pattern already in `tax-invoice-qr.ts`:
   ```typescript
   export function randomBytes(size: number): Buffer | Uint8Array {
     if (typeof window === 'undefined') {
       // Node.js path
       return require('crypto').randomBytes(size);
     }
     // Browser path — Web Crypto
     const arr = new Uint8Array(size);
     globalThis.crypto.getRandomValues(arr);
     return arr;
   }
   ```

3. **`tax-invoice-qr.ts`**: No change required. The `typeof require !== 'undefined'` guard already prevents the require from executing in the browser, and the async SubtleCrypto path handles the browser case correctly.

4. **`security/request-signing.ts`**: No change required. The dynamic `await import('crypto')` is already behind a `globalThis.crypto?.subtle` check and is not statically bundled.

5. **`eims/eims-encryption.ts`**: No change required. The dynamic `await import('crypto')` pattern already throws a clear browser error rather than silently failing.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate each bug on the unfixed codebase, then verify the fix passes fix-checking and preservation-checking for each property.

---

### Exploratory Bug Condition Checking

**Goal**: Confirm the root cause analysis before writing fix tests. Run these checks on the UNFIXED code to observe failures.

**Test Cases:**

1. **Bug 1 — Build smoke test**: Run `vite build` (or `npm run build`) on the frontend. Expected: ~63 MISSING_EXPORT errors naming symbols from `@ovds/features/tax`, `@ovds/features/eims`, etc. This confirms the broken `package.json` entry points.

2. **Bug 2 — TypeScript strict check**: Run `tsc --noEmit` in the backend workspace. Expected: TS2322 at `auth.service.ts` line ~80 (`companyId: resolvedCompanyId`).

3. **Bug 3 — TypeScript module resolution**: Run `tsc --noEmit` in the backend workspace. Expected: TS2307 at `trade.service.ts` line 24 (`Cannot find module '@prisma/client/runtime/library'`).

4. **Bug 4 — TypeScript argument check**: Run `tsc --noEmit` in the backend workspace. Expected: TS2345 at `trade.service.ts` line ~98 (`tradeLicense.count(...)` argument type mismatch).

5. **Bug 5 — Vite bundle warning check**: Run `vite build` and capture stderr. Expected: externalization warnings for `crypto` referencing `license-crypto.native.ts` and `utils.ts`. Optionally, write a Vitest browser-mode test that calls `LicenseCryptoNative.sign()` — expected: runtime error or `undefined` return.

**Expected Counterexamples:**
- Build process exits with non-zero code and lists 63+ MISSING_EXPORT symbols.
- `tsc --noEmit` reports 3 backend errors across 2 files.
- Vite build output includes `crypto` externalization warnings.

---

### Fix Checking

**Goal**: After each fix is applied, verify the bug condition no longer holds.

**Pseudocode (applied to each bug):**

```
FOR ALL input WHERE isBugCondition_BugN(input) DO
  result := runFixedSystem(input)
  ASSERT expectedBehavior_N(result)
END FOR
```

**Fix Checking Test Cases:**

1. **Bug 1**: After updating all `package.json` `main` fields → `vite build` completes with exit code 0, zero MISSING_EXPORT errors.
2. **Bug 2**: After updating type annotation → `tsc --noEmit` produces no TS2322 for `auth.service.ts`.
3. **Bug 3**: After removing the `/runtime/library` import → `tsc --noEmit` produces no TS2307 for `trade.service.ts`.
4. **Bug 4**: After rewriting the count call → `tsc --noEmit` produces no TS2345 for `trade.service.ts`.
5. **Bug 5**: After converting `license-crypto.native.ts` and `utils.ts` → `vite build` produces zero `crypto` externalization warnings; a browser test calling `randomBytes(16)` returns a `Uint8Array`.

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed system produces the same result as the original system.

**Pseudocode:**

```
FOR ALL input WHERE NOT isBugCondition_BugN(input) DO
  ASSERT originalSystem(input) = fixedSystem(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it generates many inputs automatically across the input domain, catching edge cases that manual tests might miss.

**Preservation Test Cases:**

1. **Bug 1 Preservation**: For feature packages that already had correct `src/index.ts` entries (`projects`, `platform`, `payments`, `journal`, `compliance`, `chart-of-accounts`) — verify their named exports are still resolvable and the bundle output is identical.

2. **Bug 2 Preservation (PBT)**: Generate random `{ companyId: string, ...userFields }` objects and verify `login()` returns `{ companyId }` unchanged. Generate `{ companyId: null }` objects and verify `login()` returns `{ companyId: null }` without throwing.

3. **Bug 3 Preservation**: Verify `toDecimal(value)` and `computeTotalTaxes(data)` return the same `Prisma.Decimal` values as before for all numeric inputs (PBT: generate random financial amounts and assert result equality).

4. **Bug 4 Preservation (PBT)**: Generate random `companyId` values (string or undefined) and assert `getDashboard()` returns the same `totalLicenses` count as a reference implementation that calls `count({ where: { companyId } })` or `count()` conditionally.

5. **Bug 5 Preservation**: Call `LicenseCryptoNative.sign()` with known inputs in a Node.js test environment before and after the fix; assert byte-for-byte identical outputs. Call `sha256TaxInvoiceHashAsync()` in both environments and assert identical hash outputs.

---

### Unit Tests

- Verify `vite build` exits with code 0 after Bug 1 fix (can be a CI shell assertion).
- Verify `tsc --noEmit` in backend exits with code 0 after Bugs 2–4 are fixed.
- Test `login()` with a user that has `companyId: null` — assert response includes `companyId: null`, not undefined or throwing.
- Test `login()` with a user that has `companyId: 'abc-123'` — assert JWT payload and response include `companyId: 'abc-123'`.
- Test `getDashboard()` with and without `companyId` — assert `totalLicenses` returns correctly in both cases.
- Test `LicenseCryptoNative.sign()` and `.verify()` in a Node.js environment — assert verification succeeds for a freshly signed key.
- Test `randomBytes(16)` in a mock browser environment (JSDOM/happy-dom) — assert returns a 16-element `Uint8Array`.

### Property-Based Tests

- **Property 1 (Bug 1)**: For any symbol name exported from a fixed feature package index file, the bundler resolves it without error (verify via build output parsing).
- **Property 3 (Bug 2)**: For any `resolvedCompanyId: string`, `login()` returns an object where `user.companyId === resolvedCompanyId`.
- **Property 4 (Bug 2)**: For `resolvedCompanyId: null`, `login()` returns an object where `user.companyId === null` (not undefined, not empty string).
- **Property 7 (Bug 4)**: For any `companyId: string | undefined`, `getDashboard(companyId)` returns a non-negative integer for `totalLicenses`.
- **Property 10 (Bug 5)**: For any `(secret, companyId, issuedAt, expiresAt, version)` tuple, `LicenseCryptoNative.sign()` produces a string, and `LicenseCryptoNative.verify(secret, signedKey, companyId)` returns `{ valid: true }`.

### Integration Tests

- Full login flow: authenticate as a user without a `companyId` → assert token is issued with `companyId: null`, no server error.
- Full login flow: authenticate as a user with a direct `companyId` → assert token includes the correct company scope.
- `getDashboard()` E2E: call with and without `companyId` against a seeded database → assert counts are consistent.
- Frontend build integration: after all `package.json` fixes, run `vite build` in CI and assert zero errors in the output.
- License signing round-trip (backend integration): sign a license key with `LicenseCryptoNative.sign()`, verify it with `LicenseCryptoNative.verify()`, assert `valid: true`.
