# Bugfix Requirements Document

## Introduction

Five confirmed bugs are blocking production builds and strict-mode compilation across the OVDS monorepo. Together they prevent the frontend from building entirely (63 bundler errors), break the NestJS backend TypeScript compilation (3 errors across 2 files), and introduce silent runtime failures in browser environments through misuse of Node.js-only APIs. All five bugs must be fixed to restore a deployable, type-safe system.

---

## Bug Analysis

### Bug 1 — Frontend Build Failure: 63 Missing Exports

**Trigger condition:** The rolldown bundler (Vite 8 production build) resolves `@ovds/features/tax`, `@ovds/features/eims`, and other feature packages through the `vite.config.ts` alias map, which points each package to its `packages/features/<name>/src/index.ts` source file. However, some feature packages (e.g. `@ovds/features-tax`) have their `package.json` `main` field set to `./dist/index.js` rather than `./src/index.ts`, and those `dist/` outputs do not exist because the packages have never been built. Others (e.g. `@ovds/features-eims`) point `main` to `./src/index.js` which also does not exist on disk. When rolldown encounters a re-export at the module boundary it cannot statically resolve all named exports, producing MISSING_EXPORT errors for every symbol imported by frontend pages.

#### Current Behavior (Defect)

1.1 WHEN a frontend page imports a named export (e.g. `calculateTot`, `triggerAutoComputeTot`) from `@ovds/features/tax` THEN the rolldown bundler reports a MISSING_EXPORT error and the production build fails

1.2 WHEN a frontend page imports a named export (e.g. `useCyberAuditList`, `useCyberAudit`) from `@ovds/features/eims` THEN the rolldown bundler reports a MISSING_EXPORT error and the production build fails

1.3 WHEN any of the 63 named exports across all affected feature packages are imported by any frontend page THEN the production build exits with a non-zero status code, producing no deployable output

#### Expected Behavior (Correct)

2.1 WHEN a frontend page imports `calculateTot` or `triggerAutoComputeTot` from `@ovds/features/tax` THEN the bundler SHALL resolve those symbols to their implementations in `packages/features/tax/src/services/taxApi.ts` and include them in the bundle without error

2.2 WHEN a frontend page imports `useCyberAuditList` or `useCyberAudit` from `@ovds/features/eims` THEN the bundler SHALL resolve those symbols to their implementations in `packages/features/eims/src/hooks/useEims.ts` and include them in the bundle without error

2.3 WHEN a production build is triggered THEN the system SHALL complete without MISSING_EXPORT errors for any feature-package symbol

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Vite dev server resolves workspace package aliases at development time THEN the system SHALL CONTINUE TO serve feature-package modules via the alias paths defined in `vite.config.ts`

3.2 WHEN the workspace alias for a feature package is looked up THEN the system SHALL CONTINUE TO resolve it to the `src/index.ts` source entry point for dev-mode HMR

3.3 WHEN an existing named export from a feature package index file is imported THEN the system SHALL CONTINUE TO expose that symbol to consumers without breaking the public API surface

---

### Bug 2 — Backend TS2322: `string | null` not assignable to `string` in auth.service.ts

**Trigger condition:** `auth.service.ts` declares `resolvedCompanyId` as `string | null` (it can be null for users not yet associated with a company). This variable is passed into an object literal that TypeScript infers — or a type annotation requires — as `{ companyId: string }`, producing a TS2322 error at line 324 and failing `tsc --noEmit` in strict mode.

#### Current Behavior (Defect)

1.4 WHEN `resolvedCompanyId` evaluates to `null` at runtime AND it is assigned to a property typed as `string` THEN the TypeScript compiler reports error TS2322: Type `string | null` is not assignable to type `string`

1.5 WHEN the backend is compiled with TypeScript strict mode THEN the `auth.service.ts` file fails to compile due to the null-safety violation at the assignment site

#### Expected Behavior (Correct)

2.4 WHEN `resolvedCompanyId` is `null` THEN the system SHALL assign it to `companyId` only where the target type accepts `string | null`, ensuring type safety without a non-null assertion

2.5 WHEN the backend is compiled in strict mode THEN the `auth.service.ts` file SHALL compile without TS2322 errors

#### Unchanged Behavior (Regression Prevention)

3.4 WHEN `resolvedCompanyId` is a non-null string THEN the system SHALL CONTINUE TO include it in the JWT payload and the login response body under the `companyId` key

3.5 WHEN `resolvedCompanyId` is null (user has no company association) THEN the system SHALL CONTINUE TO return `null` in the `companyId` field of the login response without throwing or coercing it

---

### Bug 3 — Backend TS2307: Cannot find module `@prisma/client/runtime/library`

**Trigger condition:** `trade.service.ts` line 24 contains an import from `@prisma/client/runtime/library`. This internal sub-path was present in Prisma v4 and below but was removed in Prisma v5+. The monorepo uses Prisma 7, where `Prisma.Decimal` and all runtime types are available via the top-level `import { Prisma } from '@prisma/client'` — no internal runtime import is needed.

#### Current Behavior (Defect)

1.6 WHEN the TypeScript compiler processes `trade.service.ts` THEN it reports error TS2307: Cannot find module `@prisma/client/runtime/library` or its corresponding type declarations

1.7 WHEN `trade.service.ts` is compiled THEN the build fails because the Prisma 7 package no longer exposes the `/runtime/library` sub-path

#### Expected Behavior (Correct)

2.6 WHEN `trade.service.ts` is compiled with Prisma 7 THEN the system SHALL import `Decimal` and other Prisma runtime types exclusively from `@prisma/client` (top-level) without referencing internal sub-paths

2.7 WHEN the backend TypeScript build runs THEN `trade.service.ts` SHALL compile without TS2307 errors

#### Unchanged Behavior (Regression Prevention)

3.6 WHEN `Prisma.Decimal` is used inside `trade.service.ts` (e.g. in `toDecimal()` and `computeTotalTaxes()`) THEN the system SHALL CONTINUE TO use Prisma's Decimal type for arithmetic precision

3.7 WHEN the trade service performs financial calculations (customs duty, import VAT, excise duty, withholding tax) THEN the system SHALL CONTINUE TO produce correctly typed `Prisma.Decimal` results

---

### Bug 4 — Backend TS2345: Prisma `tradeLicense.count()` called with `undefined`

**Trigger condition:** `trade.service.ts` line 98 calls `this.prisma.tradeLicense.count(companyId ? { where: { companyId } } : undefined)`. In Prisma 7's strict typings, `count()` expects either a valid args object or no argument — passing `undefined` explicitly is not valid and triggers a TS2345 type error because the union `{ where: { companyId: string } } | {}` is not assignable to the expected parameter type.

#### Current Behavior (Defect)

1.8 WHEN `companyId` is falsy AND `tradeLicense.count()` is called with an explicit `undefined` argument THEN the TypeScript compiler reports error TS2345: Argument of type `{ where: { companyId: string; }; } | {}` is not assignable to parameter of type `Subset<...> | undefined`, because `{}` is missing the `where` property

1.9 WHEN the backend TypeScript build runs THEN `trade.service.ts` fails to compile due to the invalid Prisma count argument

#### Expected Behavior (Correct)

2.8 WHEN `companyId` is provided THEN the system SHALL call `tradeLicense.count({ where: { companyId } })` to filter by company

2.9 WHEN `companyId` is absent THEN the system SHALL call `tradeLicense.count()` with no argument (not `undefined`) to count all trade licenses

2.10 WHEN the backend TypeScript build runs THEN `trade.service.ts` SHALL compile without TS2345 errors on the `tradeLicense.count()` call

#### Unchanged Behavior (Regression Prevention)

3.8 WHEN `companyId` is provided to `getDashboard()` THEN the system SHALL CONTINUE TO count only trade licenses belonging to that company

3.9 WHEN `companyId` is absent from `getDashboard()` THEN the system SHALL CONTINUE TO return a total count across all trade licenses

---

### Bug 5 — Frontend Runtime: Node.js `crypto` module bundled into browser code

**Trigger condition:** Multiple files inside `packages/shared/src/` import or `require()` Node.js's built-in `crypto` module (`import * as crypto from 'crypto'`; `require('crypto')`). Because `@ovds/shared` is aliased directly to its `src/` directory in `vite.config.ts`, Vite includes these files in the browser bundle. Vite externalizes Node's `crypto` module and emits 8+ warnings; at runtime, any code path that calls these functions in the browser will throw an error or silently fail because `crypto.createHmac`, `crypto.timingSafeEqual`, and similar Node APIs are unavailable in the browser.

Affected files:
- `packages/shared/src/license-crypto.native.ts` — uses `import * as crypto from 'crypto'`
- `packages/shared/src/utils.ts` — uses `require('crypto')` in `randomBytes()`
- `packages/shared/src/tax-invoice-qr.ts` — uses `require('crypto')` with an `isNode` guard
- `packages/shared/src/security/request-signing.ts` — uses Node crypto
- `packages/shared/src/eims/csr-encoder.ts` — uses Node crypto
- `packages/shared/src/eims/eims-encryption.ts` — uses Node crypto
- `packages/shared/src/eims/eims-signing.ts` — uses Node crypto
- `packages/shared/src/ovds/etax-payload.types.ts` — uses Node crypto

#### Current Behavior (Defect)

1.10 WHEN Vite bundles `@ovds/shared` for the browser build THEN the build emits externalization warnings for the Node.js `crypto` module for each of the 8 affected files

1.11 WHEN browser code calls a function from `license-crypto.native.ts` (e.g. `LicenseCryptoNative.sign()`) THEN the system crashes at runtime because `import * as crypto from 'crypto'` is externalized and unavailable in the browser

1.12 WHEN browser code reaches the `require('crypto')` branch in `utils.ts:randomBytes()` THEN the system throws or silently returns undefined because the Node.js `crypto` module is not available in the browser bundle

#### Expected Behavior (Correct)

2.11 WHEN Vite bundles `@ovds/shared` for the browser THEN the system SHALL NOT emit externalization warnings for Node.js `crypto` for any of the affected files

2.12 WHEN browser code calls cryptographic utility functions in `@ovds/shared` THEN the system SHALL use the Web Crypto API (`globalThis.crypto` / `SubtleCrypto`) so those functions operate correctly without Node.js runtime

2.13 WHEN server-side (NestJS) code calls Node-only cryptographic functions (e.g. `LicenseCryptoNative.sign()`) THEN the system SHALL CONTINUE TO use Node.js `crypto` for HMAC and timing-safe operations

#### Unchanged Behavior (Regression Prevention)

3.10 WHEN `randomBytes()` is called in a Node.js environment THEN the system SHALL CONTINUE TO return cryptographically-secure random bytes via Node's `crypto.randomBytes`

3.11 WHEN `sha256TaxInvoiceHashAsync()` is called in a browser environment THEN the system SHALL CONTINUE TO compute the hash via `SubtleCrypto` (the existing browser path in `tax-invoice-qr.ts` already does this correctly and must not be broken)

3.12 WHEN any existing backend test or service uses `LicenseCryptoNative` THEN the system SHALL CONTINUE TO produce the same signed license keys and verification results as before the fix

---

## Bug Condition Derivations

### Bug 1 — Missing Export Condition

```pascal
FUNCTION isBugCondition_Bug1(pkg)
  INPUT: pkg of type FeaturePackage
  OUTPUT: boolean

  // Returns true when a feature package cannot be resolved by rolldown
  RETURN (pkg.packageJson.main POINTS TO non-existent dist)
      OR (pkg.packageJson.main POINTS TO non-existent src/index.js)
END FUNCTION

// Fix Checking
FOR ALL pkg WHERE isBugCondition_Bug1(pkg) DO
  result ← buildFrontend()
  ASSERT result.exitCode = 0
  ASSERT result.errors CONTAINS NO MISSING_EXPORT FOR pkg.symbols
END FOR

// Preservation Checking
FOR ALL pkg WHERE NOT isBugCondition_Bug1(pkg) DO
  ASSERT resolvedModule(pkg) = resolvedModule'(pkg)
END FOR
```

### Bug 2 — Null CompanyId Condition

```pascal
FUNCTION isBugCondition_Bug2(user)
  INPUT: user of type AuthUser
  OUTPUT: boolean

  RETURN user.companyId IS NULL AND user.employee IS NULL
END FUNCTION

// Fix Checking
FOR ALL user WHERE isBugCondition_Bug2(user) DO
  result ← tsc --noEmit (auth.service.ts)
  ASSERT result.exitCode = 0
  ASSERT result.errors CONTAINS NO TS2322
END FOR

// Preservation Checking
FOR ALL user WHERE NOT isBugCondition_Bug2(user) DO
  ASSERT login(user).companyId = user.companyId
END FOR
```

### Bug 3 — Prisma Runtime Import Condition

```pascal
FUNCTION isBugCondition_Bug3(file)
  INPUT: file of type TypeScriptFile
  OUTPUT: boolean

  RETURN file CONTAINS import FROM '@prisma/client/runtime/library'
END FUNCTION

// Fix Checking
FOR ALL file WHERE isBugCondition_Bug3(file) DO
  result ← tsc --noEmit
  ASSERT result.errors CONTAINS NO TS2307 FOR file
END FOR
```

### Bug 4 — Prisma Count Undefined Condition

```pascal
FUNCTION isBugCondition_Bug4(args)
  INPUT: args of type PrismaCountArgs
  OUTPUT: boolean

  RETURN args IS undefined (explicit undefined passed)
END FUNCTION

// Fix Checking
FOR ALL call WHERE isBugCondition_Bug4(call.args) DO
  result ← tsc --noEmit
  ASSERT result.errors CONTAINS NO TS2345 FOR tradeLicense.count
END FOR
```

### Bug 5 — Node Crypto in Browser Bundle Condition

```pascal
FUNCTION isBugCondition_Bug5(file)
  INPUT: file of type SharedPackageFile
  OUTPUT: boolean

  RETURN file IMPORTS 'crypto' (Node built-in) via static import or require
      AND file IS INCLUDED IN browser bundle (vite.config alias points to src/)
END FUNCTION

// Fix Checking
FOR ALL file WHERE isBugCondition_Bug5(file) DO
  result ← viteBuild()
  ASSERT result.warnings CONTAINS NO externalization warning FOR file
  ASSERT browserRuntime(file.publicFunctions) DOES NOT THROW
END FOR

// Preservation Checking
FOR ALL file WHERE NOT isBugCondition_Bug5(file) DO
  ASSERT nodeRuntime(file.publicFunctions) = nodeRuntime'(file.publicFunctions)
END FOR
```
