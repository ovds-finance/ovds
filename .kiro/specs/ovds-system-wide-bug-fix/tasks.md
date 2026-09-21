# Implementation Plan

- [x] 1. Write bug condition exploration tests (all 5 bugs, BEFORE any fix)
  - **Property 1: Bug Condition** - All Five OVDS Build/Compile Bugs
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms each bug exists
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: Tests encode expected behavior — they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate each bug exists; document them for root-cause understanding

  - **Bug 1 — Frontend build smoke test (scoped PBT)**
    - Scope: for every `packages/features/*/package.json` where `main` ends in `.js` or points to a non-existent path, the bundler must resolve all named exports without error
    - Run `vite build` (or `npm run build`) from `apps/frontend`
    - Expected FAILURE: ~63 MISSING_EXPORT errors naming symbols from `@ovds/features/tax`, `@ovds/features/eims`, etc.
    - Document counterexamples: e.g. `"calculateTot" is not exported by packages/features/tax/src/index.ts`
    - isBugCondition_Bug1: `pkg.packageJson.main` ends with `.js` AND the referenced file does not exist on disk

  - **Bug 2 — TypeScript strict-mode check (scoped to `auth.service.ts`)**
    - Run `tsc --noEmit` in the backend workspace (`apps/backend`)
    - Expected FAILURE: TS2322 at `auth.service.ts` ~line 80 (`companyId: resolvedCompanyId`) and ~line 447
    - Document counterexample: `Type 'string | null' is not assignable to type 'string'`
    - isBugCondition_Bug2: `resolvedCompanyId` is `string | null` and assigned to a property context typed `string`

  - **Bug 3 — TypeScript module resolution check (scoped to `trade.service.ts`)**
    - Run `tsc --noEmit` in the backend workspace (`apps/backend`)
    - Expected FAILURE: TS2307 at `trade.service.ts` line 24 (`Cannot find module '@prisma/client/runtime/library'`)
    - Document counterexample: the exact TS error output
    - isBugCondition_Bug3: file contains `import { Prisma } from '@prisma/client/runtime/library'` and Prisma ≥ 5 is installed

  - **Bug 4 — TypeScript argument check (scoped to `tradeLicense.count`)**
    - Run `tsc --noEmit` in the backend workspace (`apps/backend`)
    - Expected FAILURE: TS2345 at `trade.service.ts` ~line 98 (explicit `undefined` passed to `tradeLicense.count()`)
    - Document counterexample: the exact TS error output including the union type mismatch
    - isBugCondition_Bug4: `count(companyId ? { where: { companyId } } : undefined)` pattern used

  - **Bug 5 — Vite bundle externalization warning check**
    - Run `vite build` from `apps/frontend` and capture stderr/stdout
    - Expected FAILURE: externalization warnings for Node.js `crypto` module referencing `license-crypto.native.ts` and `utils.ts`
    - Optionally write a Vitest browser-mode test calling `randomBytes(16)` in a JSDOM/happy-dom environment — expect runtime error or undefined return
    - Document counterexample: list of warning lines from Vite output

  - Mark task complete when ALL five exploration tests are written, run, and their failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12_

- [x] 2. Write preservation property tests (BEFORE implementing any fix)
  - **Property 2: Preservation** - Existing Behaviors Across All Five Bug Domains
  - **IMPORTANT**: Follow observation-first methodology — observe UNFIXED code output for non-buggy inputs first, then codify as tests
  - **EXPECTED OUTCOME**: All preservation tests PASS on unfixed code (confirms baseline before any change)

  - **Bug 1 Preservation — Already-correct package entries**
    - Observe: packages `projects`, `platform`, `payments`, `journal`, `compliance`, `chart-of-accounts` already have `"main": "./src/index.ts"`
    - Write property-based test: for all packages where `isBugCondition_Bug1` is FALSE, `resolvedModule(pkg)` is identical before and after any change
    - Verify test passes on unfixed code
    - _Requirements: 3.1, 3.2, 3.3_

  - **Bug 2 Preservation — Login response for non-null companyId (PBT)**
    - Observe: `login()` with a user that has `companyId: 'abc-123'` returns `{ companyId: 'abc-123' }` in the response body and JWT payload
    - Write PBT: generate arbitrary non-null `companyId` strings; assert `login(user).user.companyId === user.companyId` for all of them
    - Also observe: `login()` with `companyId: null` returns `{ companyId: null }` — does NOT throw
    - Write PBT: for `{ companyId: null }`, assert response `companyId` is `null`, not `undefined`, not empty string
    - Verify both PBTs pass on unfixed code
    - _Requirements: 3.4, 3.5_

  - **Bug 3 Preservation — Decimal arithmetic unchanged**
    - Observe: `toDecimal(value)` and `computeTotalTaxes(data)` return `Prisma.Decimal` with correct precision for known financial inputs
    - Write PBT: generate random financial amounts (positive numbers, high precision); assert `toDecimal(v)` returns a `Prisma.Decimal` equal to the input
    - Verify PBT passes on unfixed code
    - _Requirements: 3.6, 3.7_

  - **Bug 4 Preservation — Dashboard count results unchanged (PBT)**
    - Observe: `getDashboard({ companyId: 'x' })` returns a non-negative integer for `totalLicenses` filtered to company `x`; `getDashboard({})` returns total count across all licenses
    - Write PBT: generate random `companyId` strings and `undefined`; assert `getDashboard(companyId)` returns a non-negative integer in both cases and matches a reference count query
    - Verify PBT passes on unfixed code
    - _Requirements: 3.8, 3.9_

  - **Bug 5 Preservation — Node.js crypto output unchanged**
    - Observe: `LicenseCryptoNative.sign(secret, companyId, issuedAt, expiresAt, version)` produces a deterministic string for known inputs in Node.js context; `verify()` returns `{ valid: true }` for freshly-signed keys
    - Write PBT: generate arbitrary `(secret, companyId, issuedAt, expiresAt, version)` tuples; assert `sign()` returns a non-empty string and `verify(secret, signedKey, companyId)` returns `{ valid: true }`
    - Also assert `sha256TaxInvoiceHashAsync()` produces correct hashes in both browser and server contexts (baseline snapshot)
    - Verify PBTs pass on unfixed code
    - _Requirements: 3.10, 3.11, 3.12_

  - Mark task complete when ALL preservation tests are written, run, and PASSING on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

- [x] 3. Fix all five OVDS bugs

  - [x] 3.1 Fix Bug 1 — Correct `package.json` `main` and `types` fields for all affected feature packages
    - Enumerate all `packages/features/*/package.json` files; for each where `main` is `./dist/index.js` or `./src/index.js` (and the file does not exist), set `"main": "./src/index.ts"` and `"types": "./src/index.ts"`
    - Target ~35 packages pointing to `./dist/index.js` (including `tax`, `banking`, `hr`, `payroll`, `invoice`, `inventory`, etc.)
    - Target 2 packages pointing to `./src/index.js` (`eims`, `security`)
    - Do NOT change `vite.config.ts` (alias map is already correct)
    - Do NOT change any `src/index.ts` export surface
    - _Bug_Condition: isBugCondition_Bug1(pkg) — pkg.packageJson.main ends with .js and referenced file does not exist_
    - _Expected_Behavior: bundler resolves all named exports from pkg/src/index.ts without MISSING_EXPORT errors_
    - _Preservation: packages with already-correct src/index.ts entries remain unchanged; vite dev aliases unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

  - [x] 3.2 Fix Bug 2 — Widen `companyId` type in JWT payload and return objects in `auth.service.ts`
    - File: `apps/backend/src/auth/auth.service.ts`
    - In `login()` ~line 80: update the `payload` object type so `companyId` accepts `string | null` — use an explicit inline type annotation or widen the JWT payload interface; do NOT use non-null assertion (`!`)
    - In `login()` ~line 96: confirm `resolvedCompanyId` passes through correctly to the return object (`any` return, no TS error expected here but verify null is preserved at runtime)
    - In `getProfile()` ~line 447: ensure the return object types `companyId` as `string | null`
    - Do NOT add non-null assertions or nullish coalescing that would change the null semantics at runtime
    - _Bug_Condition: isBugCondition_Bug2 — resolvedCompanyId is string | null, target property context requires string, tsc strict=true_
    - _Expected_Behavior: tsc --noEmit produces no TS2322 for auth.service.ts; null is preserved in response payload_
    - _Preservation: non-null companyId strings continue to appear in JWT payload and login response unchanged; null continues to be returned as null, not coerced_
    - _Requirements: 2.4, 2.5, 3.4, 3.5_

  - [x] 3.3 Fix Bug 3 — Remove obsolete `@prisma/client/runtime/library` import from `trade.service.ts`
    - File: `apps/backend/src/trade/trade.service.ts`
    - Delete line 24: `import { Prisma } from '@prisma/client/runtime/library'`
    - Confirm line 21 `import { Prisma } from '@prisma/client'` already exists and covers all `Prisma.Decimal`, `Prisma.TradeShipmentWhereInput`, etc. usages
    - No other changes needed in this step
    - _Bug_Condition: isBugCondition_Bug3 — file imports from @prisma/client/runtime/library, Prisma >= 5 installed_
    - _Expected_Behavior: tsc --noEmit produces no TS2307 for trade.service.ts; Prisma.Decimal still accessible via top-level import_
    - _Preservation: toDecimal() and computeTotalTaxes() continue to return correctly-typed Prisma.Decimal values for all financial inputs_
    - _Requirements: 2.6, 2.7, 3.6, 3.7_

  - [x] 3.4 Fix Bug 4 — Rewrite `tradeLicense.count()` conditional pattern in `trade.service.ts`
    - File: `apps/backend/src/trade/trade.service.ts`
    - Locate ~line 98: `this.prisma.tradeLicense.count(companyId ? { where: { companyId } } : undefined)`
    - Replace with the two-call conditional pattern:
      ```typescript
      companyId
        ? this.prisma.tradeLicense.count({ where: { companyId } })
        : this.prisma.tradeLicense.count()
      ```
    - Confirm no other call sites use the same broken pattern in this file
    - _Bug_Condition: isBugCondition_Bug4 — explicit undefined passed to count(), Prisma >= 5, tsc strict=true_
    - _Expected_Behavior: tsc --noEmit produces no TS2345 for tradeLicense.count; runtime filters by companyId when present, counts all when absent_
    - _Preservation: getDashboard() totalLicenses results unchanged for all companyId and no-companyId call patterns_
    - _Requirements: 2.8, 2.9, 2.10, 3.8, 3.9_

  - [x] 3.5 Fix Bug 5 — Guard Node.js `crypto` usage in `license-crypto.native.ts` and `utils.ts`
    - **`packages/shared/src/license-crypto.native.ts`**:
      - Remove static `import * as crypto from 'crypto'` at the top of the file
      - Add a `getCrypto()` async helper that dynamically imports `crypto` with a clear throw for browser contexts:
        ```typescript
        // Node.js only — do not call from browser contexts
        async function getCrypto(): Promise<typeof import('crypto')> {
          try { return await import('crypto'); }
          catch { throw new Error('LicenseCryptoNative: Node.js runtime required'); }
        }
        ```
      - Convert `sign()` and `verify()` to `async` methods and replace synchronous `crypto.*` calls with `const crypto = await getCrypto(); crypto.*`
      - Ensure call sites in NestJS (backend) are updated to `await` the now-async methods
    - **`packages/shared/src/utils.ts`**:
      - In `randomBytes()`, add a `typeof window === 'undefined'` guard:
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
    - Do NOT modify `tax-invoice-qr.ts`, `security/request-signing.ts`, or `eims/eims-encryption.ts` (already correct)
    - _Bug_Condition: isBugCondition_Bug5 — file contains static/unguarded Node crypto import, included in Vite browser bundle via @ovds/shared alias_
    - _Expected_Behavior: vite build emits no crypto externalization warnings; randomBytes(16) returns Uint8Array in browser context_
    - _Preservation: LicenseCryptoNative.sign() and .verify() in Node.js produce byte-for-byte identical results; sha256TaxInvoiceHashAsync() unchanged_
    - _Requirements: 2.11, 2.12, 2.13, 3.10, 3.11, 3.12_

  - [x] 3.6 Verify bug condition exploration test now passes (after all fixes applied)
    - **Property 1: Expected Behavior** - All Five Bug Conditions Resolved
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - Run `vite build` from `apps/frontend` — expect exit code 0, zero MISSING_EXPORT errors (Bug 1)
    - Run `tsc --noEmit` in `apps/backend` — expect exit code 0, no TS2322 / TS2307 / TS2345 errors (Bugs 2–4)
    - Run `vite build` from `apps/frontend` and inspect output — expect zero `crypto` externalization warnings (Bug 5)
    - **EXPECTED OUTCOME**: All exploration tests PASS — all five bugs are confirmed fixed
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13_

  - [x] 3.7 Verify preservation tests still pass (after all fixes applied)
    - **Property 2: Preservation** - No Regressions Across Any Bug Domain
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Bug 1: already-correct packages still resolve their named exports without change
    - Bug 2: `login()` with non-null `companyId` returns unchanged value; `login()` with null still returns null
    - Bug 3: `toDecimal()` and `computeTotalTaxes()` return identical `Prisma.Decimal` values
    - Bug 4: `getDashboard()` with and without `companyId` returns unchanged `totalLicenses` counts
    - Bug 5: `LicenseCryptoNative.sign()/verify()` in Node.js produces byte-for-byte identical outputs; `sha256TaxInvoiceHashAsync()` hash output unchanged
    - **EXPECTED OUTCOME**: All preservation tests PASS — no regressions introduced
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

- [x] 4. Checkpoint — Ensure all tests pass
  - Run full backend TypeScript check: `tsc --noEmit` in `apps/backend` — expect exit code 0 with zero errors
  - Run full frontend production build: `vite build` in `apps/frontend` — expect exit code 0 with zero MISSING_EXPORT errors and zero crypto externalization warnings
  - Run all unit and property-based tests — expect all to pass
  - Ensure all tests pass; ask the user if questions arise
