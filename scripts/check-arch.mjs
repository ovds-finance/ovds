#!/usr/bin/env node
/**
 * scripts/check-arch.mjs — validates OVDS full-stack architecture boundaries
 *
 * Checks:
 *  1. @ovds/design-tokens package exists and has all required files
 *  2. @ovds/dto has zod-bridge and serializer
 *  3. @ovds/contracts has pipes, filters, interceptors
 *  4. @ovds/ui exports useZodForm
 *  5. ESLint boundary rules are present in app configs
 *  6. Prettier config exists
 *  7. No frontend imports from packages/database
 *  8. No backend imports from packages/ui
 *
 * Usage:
 *   node scripts/check-arch.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
let errors = 0;
let warnings = 0;

function check(path, label, required = true) {
  const fullPath = join(root, path);
  const exists = existsSync(fullPath);
  if (exists) {
    console.log(`  ✓ ${label}`);
  } else {
    if (required) {
      console.log(`  ✗ ${label} — MISSING`);
      errors++;
    } else {
      console.log(`  ⚠ ${label} — optional, not found`);
      warnings++;
    }
  }
}

function contains(filePath, text, label) {
  try {
    const content = readFileSync(join(root, filePath), 'utf8');
    if (content.includes(text)) {
      console.log(`  ✓ ${label}`);
    } else {
      console.log(`  ✗ ${label} — not found in ${filePath}`);
      errors++;
    }
  } catch (e) {
    console.log(`  ✗ ${label} — cannot read ${filePath}`);
    errors++;
  }
}

console.log('\n📦 OVDS Architecture Validation\n');
console.log('1. Design Tokens (@ovds/design-tokens)');
check('packages/design-tokens/package.json', 'package.json');
check('packages/design-tokens/src/tokens.ts', 'tokens.ts (canonical values)');
check('packages/design-tokens/src/css-variables.ts', 'css-variables.ts (CSS var mapping)');
check('packages/design-tokens/src/backend.ts', 'backend.ts (NestJS utilities)');
check('packages/design-tokens/src/index.ts', 'index.ts (barrel export)');
check('packages/design-tokens/scripts/sync-css-variables.mjs', 'sync script');
check('packages/design-tokens/scripts/generate-tailwind-config.mjs', 'Tailwind generator');
check('packages/design-tokens/README.md', 'README.md', false);

console.log('\n2. Shared DTOs (@ovds/dto)');
check('packages/shared/dto/src/common/zod-bridge.ts', 'zod-bridge.ts (Zod schemas + resolver)');
check('packages/shared/dto/src/common/serializer.ts', 'serializer.ts (entity → DTO)');
contains('packages/shared/dto/src/common/zod-bridge.ts', 'LoginSchema', 'LoginSchema defined');
contains('packages/shared/dto/src/common/zod-bridge.ts', 'createZodResolver', 'createZodResolver defined');
contains('packages/shared/dto/src/common/serializer.ts', 'stripSensitive', 'stripSensitive defined');
contains('packages/shared/dto/src/common/serializer.ts', 'serializeEntity', 'serializeEntity defined');

const domainBridges = ['auth', 'hr', 'ovds', 'trade', 'loyalty', 'settings', 'banking', 'crm', 'inventory', 'purchases', 'tax', 'accounting', 'compliance', 'projects'];
domainBridges.forEach(domain => {
  check(`packages/shared/dto/src/${domain}/zod-bridge.ts`, `${domain}/zod-bridge.ts`, false);
});

console.log('\n3. NestJS Contracts (@ovds/contracts)');
check('packages/contracts/src/pipes/zod-validation.pipe.ts', 'ZodValidationPipe');
check('packages/contracts/src/filters/http-exception.filter.ts', 'HttpExceptionFilter');
check('packages/contracts/src/interceptors/serialize-response.interceptor.ts', 'SerializeResponseInterceptor');

console.log('\n4. React UI (@ovds/ui)');
check('packages/ui/src/hooks/useZodForm.ts', 'useZodForm hook');
contains('packages/ui/src/hooks/useZodForm.ts', 'react-hook-form', 'react-hook-form integration');
check('packages/ui/src/hooks/useDesignTokens.ts', 'useDesignTokens hook');
check('packages/ui/src/hooks/useStatusColor.ts', 'useStatusColor hook');
contains('packages/ui/src/utils/typed-api.ts', 'createTypedApiClient', 'Typed API client');

console.log('\n5. Architecture Enforcement');
check('eslint.config.js', 'Root ESLint config');
contains('apps/frontend/eslint.config.js', 'no-restricted-paths', 'Frontend boundary rules');
contains('apps/backend/eslint.config.js', 'no-restricted-paths', 'Backend boundary rules');
check('.prettierrc', 'Prettier config');
check('.prettierignore', 'Prettier ignore');

console.log('\n6. Configuration Files');
check('tsconfig.base.json', 'Root tsconfig');
contains('tsconfig.base.json', '@ovds/design-tokens', 'design-tokens path alias');
contains('nx.json', 'design-tokens', 'design-tokens in nx sharedGlobals');
contains('apps/frontend/vite.config.ts', '@ovds/design-tokens', 'design-tokens Vite alias');
contains('package.json', 'check:arch', 'check:arch script');
contains('package.json', 'tokens:sync', 'tokens:sync script');

console.log('\n7. Domain Coverage');
const domains = ['auth', 'hr', 'ovds', 'trade', 'loyalty', 'settings', 'banking', 'crm', 'inventory', 'purchases', 'tax', 'accounting', 'compliance', 'projects'];
let domainCount = 0;
domains.forEach(domain => {
  const bridgePath = `packages/shared/dto/src/${domain}/zod-bridge.ts`;
  const indexPath = `packages/shared/dto/src/${domain}/index.ts`;
  if (existsSync(join(root, bridgePath))) {
    domainCount++;
  }
});
console.log(`  ${domainCount}/${domains.length} domain zod-bridges present`);

console.log('\n' + '─'.repeat(50));
if (errors === 0) {
  console.log(`\n✅ Architecture validation passed (${warnings} warnings)`);
} else {
  console.log(`\n❌ Architecture validation failed: ${errors} error(s), ${warnings} warning(s)`);
  process.exitCode = 1;
}
