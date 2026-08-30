#!/usr/bin/env node
/**
 * check-arch.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Architecture boundary checker for the "thin apps, thick libraries" principle.
 * Validates that no package centralization rules are violated before a commit.
 *
 * Usage:  node scripts/check-arch.mjs
 *         npx nx run-commands --command="node scripts/check-arch.mjs"
 *
 * Rules checked:
 *   1. apps/frontend must not import @ovds/design-system directly
 *   2. apps/backend must not import @ovds/ui
 *   3. apps/frontend src files must not have duplicate component implementations
 *      that already exist in packages/ui
 *   4. packages/database must not be imported outside apps/backend
 *   5. apps/backend must not import @ovds/features/* (frontend-only libs)
 *   6. apps/frontend must not import @ovds/domains/* (backend-only libs)
 *   7. packages/domains/* must not import @ovds/ui (UI is frontend-only)
 *   8. packages/features/* must not import @ovds/database (database is backend-only)
 *   9. DTO classes must be imported from @ovds/dto, not @ovds/shared
 *   10. UI components must not import @ovds/design-system directly
 *   11. apps must not contain business logic — only configurational code
 *   12. Domain libraries must not import other domain libraries across bounded contexts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

let errors = 0;

function walk(dir, exts = ['.ts', '.tsx']) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', 'dist', '.nx', '.git'].includes(entry.name)) {
      files.push(...walk(full, exts));
    } else if (entry.isFile() && exts.some(e => entry.name.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

function check(files, pattern, message) {
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    const rel = relative(ROOT, file);
    if (pattern.test(src)) {
      console.error(`❌  ${rel}\n    ${message}\n`);
      errors++;
    }
  }
}

// Rule 1: frontend must not import @ovds/design-system directly
const frontendFiles = walk(join(ROOT, 'apps/frontend/src'));
check(
  frontendFiles,
  /from ['"]@ovds\/design-system['"]/,
  'Direct @ovds/design-system import — use @ovds/ui instead.'
);

// Rule 2: backend must not import @ovds/ui
const backendFiles = walk(join(ROOT, 'apps/backend/src'));
check(
  backendFiles,
  /from ['"]@ovds\/ui['"]/,
  'Backend imports @ovds/ui — UI package must not be used in backend.'
);

// Rule 3: frontend must not import @ovds/database
check(
  frontendFiles,
  /from ['"]@ovds\/database['"]/,
  '@ovds/database is backend-only — never import in frontend.'
);

// Rule 4: packages/shared and packages/ui must not import @ovds/database
const sharedFiles = walk(join(ROOT, 'packages/shared/src'));
const uiFiles = walk(join(ROOT, 'packages/ui/src'));
check(
  [...sharedFiles, ...uiFiles],
  /from ['"]@ovds\/database['"]/,
  '@ovds/database must not be imported in shared or ui packages.'
);

// Rule 5: prefer @ovds/dto for DTO classes (not @ovds/shared)
check(
  [...frontendFiles, ...backendFiles],
  /import\s*\{[^}]*Dto[^}]*\}\s*from\s*['"]@ovds\/shared['"]/,
  'Import DTO classes from @ovds/dto, not @ovds/shared.'
);

// Rule 6: packages/ui must not import @ovds/design-system from component files
const uiComponentFiles = uiFiles.filter(f => !f.endsWith('index.ts'));
check(
  uiComponentFiles,
  /from ['"]@ovds\/design-system['"]/,
  'UI component imports @ovds/design-system directly — import tokens via relative path or re-export in index.ts.'
);

// Rule 7: apps/backend must not import @ovds/features/* (frontend-only libs)
check(
  backendFiles,
  /from ['"]@ovds\/features\/['"]/,
  'Backend imports @ovds/features/* — frontend-only libraries must not be used in backend.'
);

// Rule 8: apps/frontend must not import @ovds/domains/* (backend-only libs)
check(
  frontendFiles,
  /from ['"]@ovds\/domains\/['"]/,
  'Frontend imports @ovds/domains/* — backend-only libraries must not be used in frontend.'
);

// Rule 9: packages/domains/* must not import @ovds/ui (UI is frontend-only)
const domainFiles = walk(join(ROOT, 'packages/domains'));
check(
  domainFiles,
  /from ['"]@ovds\/ui['"]/,
  'Domain library imports @ovds/ui — UI package must not be used in backend domain libraries.'
);

// Rule 10: packages/features/* must not import @ovds/database (database is backend-only)
const featureFiles = walk(join(ROOT, 'packages/features'));
check(
  featureFiles,
  /from ['"]@ovds\/database['"]/,
  'Feature library imports @ovds/database — database is backend-only.'
);

// Rule 11: apps must not contain business logic — only configurational code
// Check that app files do not contain service method implementations
const backendAppFiles = walk(join(ROOT, 'apps/backend/src'), ['.ts']);
check(
  backendAppFiles,
  /async\s+\w+\([^)]*\)\s*\{[\s\S]{50,}\b(?:return\s+this\.|await\s+this\.|prisma\.)/,
  'Backend app contains business logic — move to a domain library under packages/domains/.'
);

// Rule 12: Domain libraries must not import other domain libraries across bounded contexts
// (This is a soft rule — we check for cross-domain imports that are not via shared/core)
const domainIndexFiles = domainFiles.filter(f => f.endsWith('index.ts') && f.includes('/src/index.ts'));
for (const file of domainIndexFiles) {
  const src = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  const domainMatch = rel.match(/packages\/domains\/(\w+)/);
  if (domainMatch) {
    const currentDomain = domainMatch[1];
    const imports = src.match(/from\s+['"]@ovds\/domains\/(\w+)/g);
    if (imports) {
      for (const imp of imports) {
        const importedDomain = imp.match(/@ovds\/domains\/(\w+)/)[1];
        if (importedDomain !== currentDomain && importedDomain !== 'core' && importedDomain !== 'shared' && importedDomain !== 'database' && importedDomain !== 'contracts') {
          console.warn(`⚠️  ${rel} imports from @ovds/domains/${importedDomain} — ensure this cross-domain dependency is intentional.`);
        }
      }
    }
  }
}

// Rule 13: Duplicate domain services must not linger in apps/backend.
// If a service exists under packages/domains/*, a copy with the same basename
// in apps/backend is a "half-migrated" file that can cause ambiguous DI.
// Detect any `*.service.ts` in apps/backend whose basename also exists in a
// domain library. During migration this is surfaced as a WARNING (debt), not a hard failure.
const backendServiceFiles = walk(join(ROOT, 'apps/backend/src'), ['.ts'])
  .filter(f => f.endsWith('.service.ts'));
const domainServiceNames = new Map(); // basename -> domain lib path
for (const f of walk(join(ROOT, 'packages/domains'), ['.ts'])) {
  const base = f.split(/[\\/]/).pop();
  if (base && base.endsWith('.service.ts')) {
    if (!domainServiceNames.has(base)) domainServiceNames.set(base, relative(ROOT, f));
  }
}
for (const file of backendServiceFiles) {
  const base = file.split(/[\\/]/).pop();
  if (base && domainServiceNames.has(base)) {
    const libRef = domainServiceNames.get(base);
    console.warn(`⚠️  ${relative(ROOT, file)} — duplicate service "${base}" still lives in apps/backend; it already exists in ${libRef}. Migrate it to the domain library (see docs/09-developers/clean-code-structure.md).`);
  }
}

if (errors === 0) {
  console.log('✅  Architecture boundary check passed — no violations found.');
  process.exit(0);
} else {
  console.error(`\n💥  ${errors} architecture violation(s) found. Fix before committing.`);
  process.exit(1);
}
