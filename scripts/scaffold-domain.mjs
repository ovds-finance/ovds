#!/usr/bin/env node
/**
 * scripts/scaffold-domain.mjs — scaffolds a new domain zod-bridge in @ovds/dto
 *
 * Usage:
 *   node scripts/scaffold-domain.mjs <domain-name>
 *
 * Example:
 *   node scripts/scaffold-domain.mjs support
 *
 * This creates:
 *   packages/shared/dto/src/<domain>/zod-bridge.ts
 *   packages/shared/dto/src/<domain>/index.ts (if missing)
 *   Updates packages/shared/dto/src/<domain>/index.ts to export zod-bridge
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

const domain = process.argv[2];
if (!domain) {
  console.error('Usage: node scripts/scaffold-domain.mjs <domain-name>');
  console.error('Example: node scripts/scaffold-domain.mjs support');
  process.exit(1);
}

const domainDir = join(root, 'packages/shared/dto/src', domain);
const zodBridgePath = join(domainDir, 'zod-bridge.ts');
const indexPath = join(domainDir, 'index.ts');

if (existsSync(zodBridgePath)) {
  console.error(`❌ ${zodBridgePath} already exists`);
  process.exit(1);
}

const pascalDomain = toPascalCase(domain);
const camelDomain = toCamelCase(domain);

const zodBridgeContent = `/**
 * @ovds/dto/${domain}/zod-bridge — Zod schemas for the ${domain} domain
 *
 * Provides Zod versions of the ${domain} DTOs.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 */

import { z } from 'zod';

// ── ${pascalDomain} Schemas ─────────────────────────────────────────────────

export const ${camelDomain}Schema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  companyId: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const Create${pascalDomain}Schema = ${camelDomain}Schema.omit({
  id: true, createdAt: true, updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const Update${pascalDomain}Schema = Create${pascalDomain}Schema.partial();

// ── Type exports ─────────────────────────────────────────────────────────────

export type ${pascalDomain} = z.infer<typeof ${camelDomain}Schema>;
export type Create${pascalDomain} = z.infer<typeof Create${pascalDomain}Schema>;
export type Update${pascalDomain} = z.infer<typeof Update${pascalDomain}Schema>;
`;

writeFileSync(zodBridgePath, zodBridgeContent);
console.log(`✅ Created: packages/shared/dto/src/${domain}/zod-bridge.ts`);

if (!existsSync(indexPath)) {
  writeFileSync(indexPath, `export * from './zod-bridge';\n`);
  console.log(`✅ Created: packages/shared/dto/src/${domain}/index.ts`);
} else {
  let indexContent = readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('zod-bridge')) {
    indexContent = indexContent.trim() + "\nexport * from './zod-bridge';\n";
    writeFileSync(indexPath, indexContent);
    console.log(`✅ Updated: packages/shared/dto/src/${domain}/index.ts`);
  } else {
    console.log(`ℹ️  Already exports zod-bridge: packages/shared/dto/src/${domain}/index.ts`);
  }
}

console.log(`\n🎉 Domain '${domain}' scaffolded successfully!`);
console.log(`\nNext steps:`);
console.log(`  1. Edit packages/shared/dto/src/${domain}/zod-bridge.ts`);
console.log(`  2. Mirror schemas in @ovds/contracts/src/schemas/${domain}.ts`);
console.log(`  3. Import from '@ovds/dto' in your React/NestJS code`);
