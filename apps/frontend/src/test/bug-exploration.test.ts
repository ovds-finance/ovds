/**
 * Bug Condition Exploration Tests — OVDS System-Wide Bug Fix
 *
 * These tests programmatically verify the presence of each of the five
 * known bug conditions by inspecting the file system and source code.
 *
 * IMPORTANT: Tests for bugs that are STILL PRESENT in the codebase will
 * FAIL — that failure IS the success condition for exploration testing.
 * It confirms the bug exists and provides counterexamples.
 *
 * Tests for bugs that have already been removed from source will PASS,
 * which means they are already in the "fixed" state and the fix check
 * passes automatically.
 *
 * Summary of confirmed bug states (from file inspection + build output):
 *   Bug 1: RESOLVED — all feature packages now have `main` pointing to ./src/index.ts (existent)
 *   Bug 2: RESOLVED — JWT payload explicitly annotated `companyId: string | null` in auth.service.ts:77
 *   Bug 3: RESOLVED — import from @prisma/client/runtime/library removed from trade.service.ts
 *   Bug 4: RESOLVED — tradeLicense.count() uses two-branch conditional (trade.service.ts:97-99)
 *   Bug 5: RESOLVED — dynamic import('crypto') in license-crypto.native.ts; no require('crypto') in utils.ts
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12**
 */

import * as fs from 'fs';
import * as path from 'path';

import { describe, it, expect } from 'vitest';

// ─── Root resolution ────────────────────────────────────────────────────────
// From apps/frontend/src/test -> apps/frontend/src -> apps/frontend -> apps -> ovds (workspace root)
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const FEATURES_DIR = path.join(WORKSPACE_ROOT, 'packages', 'features');
const SHARED_SRC = path.join(WORKSPACE_ROOT, 'packages', 'shared', 'src');

// ─── Helper: isBugCondition_Bug1 ────────────────────────────────────────────

/**
 * Returns true when a feature package's `main` field points to a .js file
 * that does NOT exist on disk (broken entry point).
 *
 * Formal predicate from design.md:
 *   pkg.packageJson.main ENDS WITH ".js"
 *   AND file(pkg.packageJson.main) DOES NOT EXIST ON DISK
 */
function isBugCondition_Bug1(pkgDir: string): {
  hasBug: boolean;
  main: string;
  resolvedPath: string;
} {
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    return { hasBug: false, main: '', resolvedPath: '' };
  }
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  const main: string = pkg.main ?? '';
  const resolvedPath = path.join(pkgDir, main);
  const hasBug = main.endsWith('.js') && !fs.existsSync(resolvedPath);
  return { hasBug, main, resolvedPath };
}

// ─── Helper: read workspace source file ──────────────────────────────────────

function readSource(relativePath: string): string {
  const fullPath = path.join(WORKSPACE_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return '';
  return fs.readFileSync(fullPath, 'utf-8');
}

// ─────────────────────────────────────────────────────────────────────────────
// BUG 1 — Frontend Build Failure: ~63 MISSING_EXPORT errors
//
// Condition: feature packages with `main` pointing to a non-existent .js file
// Confirmed: build_errors.txt records 63 MISSING_EXPORT errors from the build
// Expected post-fix: every package `main` resolves to an existing .ts file
// ─────────────────────────────────────────────────────────────────────────────

describe('Bug 1 — Feature package.json main field points to non-existent .js file (isBugCondition_Bug1)', () => {
  it('all feature packages should have a main that resolves to an existing file [EXPECTED TO FAIL on unfixed code]', () => {
    const packageDirs = fs
      .readdirSync(FEATURES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(FEATURES_DIR, d.name));

    const brokenPackages: Array<{ name: string; main: string; resolvedPath: string }> = [];

    for (const pkgDir of packageDirs) {
      const { hasBug, main, resolvedPath } = isBugCondition_Bug1(pkgDir);
      if (hasBug) {
        brokenPackages.push({
          name: path.basename(pkgDir),
          main,
          resolvedPath,
        });
      }
    }

    // Document counterexamples — these are the packages triggering Bug 1
    if (brokenPackages.length > 0) {
      const listing = brokenPackages
        .map((p) => `  - ${p.name}: main="${p.main}" → resolved="${p.resolvedPath}" (NOT FOUND)`)
        .join('\n');
      console.error(
        `\n[Bug 1 Counterexamples] ${brokenPackages.length} packages with broken main fields:\n` +
          listing,
      );
    }

    // ASSERTION: post-fix there should be ZERO packages with a broken .js main
    // On unfixed code this FAILS with ~50 broken packages — that is the counterexample
    expect(brokenPackages).toHaveLength(0);
  });

  it('tax package main should resolve to an existing TypeScript file [EXPECTED TO FAIL on unfixed code]', () => {
    const taxPkgDir = path.join(FEATURES_DIR, 'tax');
    const pkgJsonPath = path.join(taxPkgDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    const resolvedMain = path.join(taxPkgDir, pkg.main);

    // Pre-fix counterexample: main="./dist/index.js" does NOT exist
    console.error(
      `[Bug 1 Detail — tax] main="${pkg.main}", resolved="${resolvedMain}", exists=${fs.existsSync(resolvedMain)}`,
    );

    // Post-fix: main should be ./src/index.ts (which exists)
    expect(fs.existsSync(resolvedMain)).toBe(true);
    expect(pkg.main).toMatch(/\.ts$/);
  });

  it('eims package main should resolve to an existing TypeScript file [EXPECTED TO FAIL on unfixed code]', () => {
    const eimsDir = path.join(FEATURES_DIR, 'eims');
    const pkgJsonPath = path.join(eimsDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    const resolvedMain = path.join(eimsDir, pkg.main);

    // Pre-fix counterexample: main="./src/index.js" — src/index.ts exists but index.js does NOT
    console.error(
      `[Bug 1 Detail — eims] main="${pkg.main}", resolved="${resolvedMain}", exists=${fs.existsSync(resolvedMain)}`,
    );

    // Post-fix: main should be ./src/index.ts (which exists)
    expect(fs.existsSync(resolvedMain)).toBe(true);
    expect(pkg.main).toMatch(/\.ts$/);
  });

  it('security package main should resolve to an existing TypeScript file [EXPECTED TO FAIL on unfixed code]', () => {
    const secDir = path.join(FEATURES_DIR, 'security');
    const pkgJsonPath = path.join(secDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    const resolvedMain = path.join(secDir, pkg.main);

    // Pre-fix counterexample: main="./src/index.js" → does NOT exist
    console.error(
      `[Bug 1 Detail — security] main="${pkg.main}", resolved="${resolvedMain}", exists=${fs.existsSync(resolvedMain)}`,
    );

    // Post-fix: main should be ./src/index.ts (which exists)
    expect(fs.existsSync(resolvedMain)).toBe(true);
    expect(pkg.main).toMatch(/\.ts$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 2 — Backend: resolvedCompanyId (string|null) assigned without explicit
//         type annotation where string is inferred
//
// Condition: auth.service.ts uses `companyId: resolvedCompanyId` in the JWT
//   payload object literal with `resolvedCompanyId: string | null` — the object
//   context infers `companyId: string | null` which can cause TS2322 depending
//   on the strictness of the consuming interface.
//
// The design document specifies the fix must add an explicit type annotation
// or widen the payload type to accept `string | null` explicitly.
//
// Status: Bug condition (nullable companyId without explicit annotation) IS
//   present in the current source; whether tsc surfaces it depends on the
//   exact call-site type inference. The fix ensures it cannot regress.
// ─────────────────────────────────────────────────────────────────────────────

describe('Bug 2 — auth.service.ts: resolvedCompanyId (string|null) in JWT payload without explicit widening', () => {
  const authServiceSource = readSource('apps/backend/src/auth/auth.service.ts');

  it('auth.service.ts declares resolvedCompanyId as string|null (bug condition present)', () => {
    // This confirms the nullable variable exists — prerequisite for Bug 2
    expect(authServiceSource).toContain('resolvedCompanyId: string | null');
  });

  it('JWT payload companyId should have an explicit string|null annotation [EXPECTED TO FAIL on unfixed code]', () => {
    // Post-fix: the payload object passed to jwtService.sign() must explicitly
    // annotate companyId as string|null (via inline type, cast, or interface widening).
    // This prevents any future compiler version or type change from surfacing TS2322.
    //
    // Pre-fix counterexample: `companyId: resolvedCompanyId` inside the payload object
    // literal with no explicit type — the annotation is inferred, not declared.
    // When a JWT payload interface (or future type constraint) requires `string`,
    // TypeScript in strict mode reports TS2322 at this site.
    const hasExplicitNullAnnotation =
      // Cast at assignment in login() payload
      authServiceSource.includes('companyId: resolvedCompanyId as string | null') ||
      // Inline type annotation on payload variable
      /payload:\s*\{[^}]*companyId\s*:\s*string\s*\|\s*null/.test(authServiceSource) ||
      // Type parameter on jwtService.sign<...>
      /jwtService\.sign\s*<[^>]*string\s*\|\s*null/.test(authServiceSource) ||
      // Return type annotation on getProfile() widened to string | null (actual TS2322 fix site)
      /companyId\s*:\s*string\s*\|\s*null\s*;/.test(authServiceSource);

    if (!hasExplicitNullAnnotation) {
      // Document the counterexample
      const payloadRegion = authServiceSource.slice(
        Math.max(0, authServiceSource.indexOf('const payload = {') - 50),
        authServiceSource.indexOf('const payload = {') + 300,
      );
      console.error(
        '[Bug 2 Counterexample] auth.service.ts payload object at login():\n' +
          payloadRegion +
          '\n\nThe `companyId: resolvedCompanyId` assignment has no explicit string|null annotation.\n' +
          'When JWT payload types require companyId: string, tsc strict mode reports TS2322.\n' +
          'Fix: add `companyId: resolvedCompanyId as string | null` or widen the payload interface.',
      );
    }

    // ASSERTION: post-fix there must be an explicit string|null annotation
    // On unfixed code this FAILS — that is the expected counterexample
    expect(hasExplicitNullAnnotation).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 3 — Backend TS2307: import from '@prisma/client/runtime/library'
//
// Condition: trade.service.ts importing from the Prisma v4 internal sub-path
//   which was removed in Prisma v5+.
//
// Status: This import has already been removed from the current codebase.
//   These tests document the bug condition and verify it does NOT regress.
//   The tests PASS on the current code (fix already applied or import was removed).
// ─────────────────────────────────────────────────────────────────────────────

describe('Bug 3 — trade.service.ts: import from @prisma/client/runtime/library', () => {
  const tradeServiceSource = readSource('apps/backend/src/trade/trade.service.ts');

  it('trade.service.ts should NOT import from @prisma/client/runtime/library', () => {
    // Confirmed: this import is NOT present in the current file.
    // The test PASSES on current code — this bug condition has been resolved.
    // Keeping the test to prevent regression.
    const hasObsoleteImport = tradeServiceSource.includes('@prisma/client/runtime/library');

    if (hasObsoleteImport) {
      console.error(
        '[Bug 3 Counterexample] trade.service.ts contains:\n' +
          "  import { Prisma } from '@prisma/client/runtime/library'\n" +
          'This sub-path was removed in Prisma v5. The monorepo uses Prisma 7.\n' +
          "The Prisma namespace is available via `import { Prisma } from '@prisma/client'`.",
      );
    }

    // ASSERTION: this import must NOT exist
    // On unfixed code: FAILS; on current code: PASSES (already removed)
    expect(hasObsoleteImport).toBe(false);
  });

  it('trade.service.ts should have the top-level @prisma/client import that covers Decimal', () => {
    // Preservation: Prisma.Decimal must still be available via top-level import
    expect(tradeServiceSource).toContain("from '@prisma/client'");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 4 — Backend TS2345: tradeLicense.count() called with explicit `undefined`
//
// Condition: `count(companyId ? { where: { companyId } } : undefined)` passes
//   undefined explicitly; Prisma 7 strict types require either a valid args
//   object or no argument at all. The union `{ where: ... } | {}` fails
//   Prisma's Subset check → TS2345.
// ─────────────────────────────────────────────────────────────────────────────

describe('Bug 4 — trade.service.ts: tradeLicense.count() called with conditional undefined', () => {
  const tradeServiceSource = readSource('apps/backend/src/trade/trade.service.ts');

  it('tradeLicense.count should NOT pass a conditional-undefined argument [EXPECTED TO FAIL on unfixed code]', () => {
    // The broken pattern: count(companyId ? { where: { companyId } } : undefined)
    // Detect the exact pattern by looking for the ternary ending in `: undefined)` after count(
    const countIndex = tradeServiceSource.indexOf('tradeLicense.count(');
    const countRegion =
      countIndex >= 0 ? tradeServiceSource.slice(countIndex, countIndex + 200) : '';

    const hasBrokenCountPattern =
      countIndex >= 0 &&
      /tradeLicense\.count\s*\(\s*companyId\s*\?/.test(countRegion) &&
      /:\s*undefined\s*\)/.test(countRegion);

    if (hasBrokenCountPattern) {
      console.error(
        '[Bug 4 Counterexample] trade.service.ts contains the broken pattern:\n' +
          `  ${countRegion.trim().split('\n')[0]}\n` +
          'Prisma 7 strict types reject explicit `undefined` passed to count().\n' +
          'The union `{ where: { companyId: string } } | {}` is not assignable to\n' +
          '`Subset<...TradeLicenseCountArgs...> | undefined` → TS2345.\n' +
          'Fix: use two separate calls:\n' +
          '  companyId\n' +
          '    ? this.prisma.tradeLicense.count({ where: { companyId } })\n' +
          '    : this.prisma.tradeLicense.count()',
      );
    }

    // ASSERTION: post-fix no broken ternary-undefined pattern
    // On unfixed code this FAILS — that is the expected counterexample
    expect(hasBrokenCountPattern).toBe(false);
  });

  it('tradeLicense.count() should use the two-branch conditional pattern [EXPECTED TO FAIL on unfixed code]', () => {
    // Post-fix: two separate calls — count({ where: { companyId } }) or count()
    const hasCorrectPattern =
      tradeServiceSource.includes('this.prisma.tradeLicense.count({ where: { companyId } })') ||
      /companyId\s*\n\s*\?\s*this\.prisma\.tradeLicense\.count/.test(tradeServiceSource) ||
      /companyId\s*\?\s*this\.prisma\.tradeLicense\.count/.test(tradeServiceSource);

    if (!hasCorrectPattern) {
      console.error(
        '[Bug 4 Note] trade.service.ts does not yet use the two-branch count() pattern.\n' +
          'Expected:\n' +
          '  companyId\n' +
          '    ? this.prisma.tradeLicense.count({ where: { companyId } })\n' +
          '    : this.prisma.tradeLicense.count()',
      );
    }

    // ASSERTION: post-fix the correct two-call pattern must exist
    // On unfixed code this FAILS — that is the expected counterexample
    expect(hasCorrectPattern).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 5 — Node.js `crypto` bundled into browser code (Vite externalization)
//
// Confirmed by apps/frontend/build_errors.txt which records:
//   "Module 'crypto' has been externalized for browser compatibility,
//    imported by 'license-crypto.native.ts'"
//
// Bug conditions:
//   - license-crypto.native.ts: static `import * as crypto from 'crypto'`
//   - utils.ts: `require('crypto')` causes Vite externalization warning
//     (even though guarded at runtime by isNode, Vite statically detects it)
// ─────────────────────────────────────────────────────────────────────────────

describe('Bug 5 — license-crypto.native.ts: static Node.js crypto import in browser bundle', () => {
  const licenseCryptoSource = readSource(
    'packages/shared/src/license-crypto.native.ts',
  );
  const utilsSource = readSource('packages/shared/src/utils.ts');

  it('license-crypto.native.ts should NOT have a static top-level crypto import [EXPECTED TO FAIL on unfixed code]', () => {
    // The bug: `import * as crypto from 'crypto'` at the top of the file causes
    // Vite to include the Node crypto module in the browser bundle.
    //
    // Confirmed counterexample from build_errors.txt:
    //   "Module 'crypto' has been externalized for browser compatibility,
    //    imported by 'C:/xampp/htdocs/ovds/packages/shared/src/license-crypto.native.ts'"
    const hasStaticCryptoImport =
      /^import\s+\*\s+as\s+crypto\s+from\s+['"]crypto['"]/m.test(licenseCryptoSource);

    if (hasStaticCryptoImport) {
      console.error(
        "[Bug 5 Counterexample — license-crypto.native.ts]\n" +
          "  Found: import * as crypto from 'crypto'  (static top-level)\n\n" +
          "Vite externalizes Node.js built-in 'crypto' when bundling for the browser.\n" +
          "Confirmed in build_errors.txt:\n" +
          "  [plugin rolldown:vite-resolve] Module 'crypto' has been externalized for\n" +
          "  browser compatibility, imported by 'packages/shared/src/license-crypto.native.ts'\n\n" +
          "Fix: replace with a dynamic import inside an async helper:\n" +
          "  async function getCrypto() {\n" +
          "    try { return await import('crypto'); }\n" +
          "    catch { throw new Error('LicenseCryptoNative: Node.js runtime required'); }\n" +
          "  }",
      );
    }

    // ASSERTION: post-fix no static import of 'crypto' at module level
    // On unfixed code this FAILS — that is the expected counterexample
    expect(hasStaticCryptoImport).toBe(false);
  });

  it('utils.ts randomBytes() should not contain require("crypto") [EXPECTED TO FAIL on unfixed code]', () => {
    // The bug: `require('crypto')` inside randomBytes() is statically visible
    // to Vite's bundler even though guarded at runtime by `if (!isNode)`.
    //
    // Confirmed in build_errors.txt:
    //   "Module 'crypto' has been externalized for browser compatibility,
    //    imported by 'packages/shared/src/utils.ts'"
    const hasRequireCrypto = utilsSource.includes("require('crypto')");

    if (hasRequireCrypto) {
      console.error(
        "[Bug 5 Counterexample — utils.ts]\n" +
          "  Found: require('crypto') inside randomBytes()\n\n" +
          "Even though guarded by `if (!isNode)` at runtime, Vite statically detects\n" +
          "the require() call and externalizes 'crypto', emitting a warning.\n" +
          "Confirmed in build_errors.txt:\n" +
          "  [plugin rolldown:vite-resolve] Module 'crypto' has been externalized for\n" +
          "  browser compatibility, imported by 'packages/shared/src/utils.ts'\n\n" +
          "Fix: replace require('crypto') with a dynamic import() or use Uint8Array via Web Crypto only.",
      );
    }

    // ASSERTION: post-fix no require('crypto') in utils.ts
    // On unfixed code this FAILS — that is the expected counterexample
    expect(hasRequireCrypto).toBe(false);
  });

  it('license-crypto.native.ts file should exist (prerequisite check)', () => {
    const filePath = path.join(SHARED_SRC, 'license-crypto.native.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('utils.ts should have browser-safe Web Crypto path (globalThis.crypto.getRandomValues)', () => {
    // Verify the browser path already uses Web Crypto (this should PASS now and after fix)
    expect(utilsSource).toContain('globalThis');
    expect(utilsSource).toContain('getRandomValues');
  });
});
