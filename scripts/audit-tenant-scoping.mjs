/**
 * Tenant Scoping Audit Script
 *
 * Scans the Prisma schema for models that have `companyId` but are NOT
 * in the TENANT_SCOPED_MODELS registry in prisma.service.ts.
 *
 * Model names in the schema are PascalCase (e.g., `BankAccount`) but
 * Prisma client delegates are camelCase (e.g., `bankAccount`). This script
 * converts schema names to camelCase before comparing.
 *
 * Usage:
 *   node scripts/audit-tenant-scoping.mjs
 *
 * Exit codes:
 *   0 - All tenant-scoped models are registered
 *   1 - Missing registrations found
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const schemaPath = join(root, 'packages/database/prisma/schema.prisma');
const servicePath = join(root, 'apps/backend/src/prisma/prisma.service.ts');

let schemaContent;
let serviceContent;

try {
  schemaContent = readFileSync(schemaPath, 'utf-8');
  serviceContent = readFileSync(servicePath, 'utf-8');
} catch (err) {
  console.error('Failed to read required files:', err.message);
  process.exit(1);
}

// Convert PascalCase model name to camelCase (Prisma client delegate naming)
function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Extract models with companyId from schema
const schemaModelRegex = /model\s+(\w+)\s*\{[^}]*companyId\s+String\??/gs;
const schemaModels = new Set();
let match;

while ((match = schemaModelRegex.exec(schemaContent)) !== null) {
  const modelName = match[1];
  // Skip models that don't follow standard Prisma naming
  if (modelName && modelName[0] === modelName[0].toUpperCase()) {
    schemaModels.add(toCamelCase(modelName));
  }
}

// Extract registered models from prisma.service.ts
const registryMatch = serviceContent.match(
  /const\s+_TENANT_SCOPED_MODELS\s*=\s*new\s+Set\(\[([\s\S]*?)\]\);/,
);

const registeredModels = new Set();
if (registryMatch) {
  const modelEntries = registryMatch[1].match(/"(\w+)"/g);
  if (modelEntries) {
    for (const entry of modelEntries) {
      registeredModels.add(entry.slice(1, -1));
    }
  }
}

// Find models in schema but not in registry
const missing = [...schemaModels].filter((m) => !registeredModels.has(m));

console.log('\nTenant Scoping Audit');
console.log('====================');
console.log(`Models with companyId in schema: ${schemaModels.size}`);
console.log(`Models in TENANT_SCOPED_MODELS registry: ${registeredModels.size}`);

if (missing.length > 0) {
  console.log(`\n⚠️  Missing registrations (${missing.length}):`);
  for (const model of missing) {
    console.log(`   - ${model}`);
  }
  console.log(
    '\nThese models have companyId in the schema but are not registered in prisma.service.ts.\n' +
    'Add them to _TENANT_SCOPED_MODELS to ensure defense-in-depth tenant enforcement.',
  );
  process.exit(1);
} else {
  console.log(`\n✅ All ${schemaModels.size} tenant-scoped models are registered.`);
  process.exit(0);
}
