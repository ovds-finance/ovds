#!/usr/bin/env node
/**
 * scripts/validate-zod-coverage.mjs — validates zod-bridge coverage against class-validator DTOs
 *
 * For each domain in @ovds/dto, this script:
 *  1. Lists all class-validator DTO classes (CreateXxxDto, UpdateXxxDto, etc.)
 *  2. Checks if corresponding Zod schemas exist in zod-bridge.ts
 *  3. Reports missing coverage
 *
 * Usage:
 *   node scripts/validate-zod-coverage.mjs
 *   node scripts/validate-zod-coverage.mjs --strict  (exit 1 if any missing)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

const DTO_DIR = join(root, 'packages/shared/dto/src');
const DTO_CLASS_REGEX = /export\s+class\s+(Create|Update|List|Get)\s*(\w+)\s*(?:Dto)?\s*\{/g;
const ZOD_SCHEMA_REGEX = /export\s+const\s+(Create|Update|List|Get)?\s*(\w+)Schema\s*=/g;

let totalDtos = 0;
let coveredDtos = 0;
let missingCoverage = [];

function scanDomain(domainDir) {
  const domain = relative(DTO_DIR, domainDir);
  
  // Skip common, lib, modules
  if (['common', 'lib', 'modules'].includes(domain)) return;

  // Find all DTO files in the domain
  const dtoFiles = [];
  try {
    const items = readdirSync(domainDir, { withFileTypes: true });
    for (const item of items) {
      if (item.isFile() && item.name.endsWith('.dto.ts')) {
        dtoFiles.push(join(domainDir, item.name));
      }
    }
  } catch (e) {
    return;
  }

  // Find zod-bridge.ts
  const zodBridgePath = join(domainDir, 'zod-bridge.ts');
  if (!statSync(zodBridgePath).isFile()) {
    console.log(`  ⚠️  ${domain} — no zod-bridge.ts found`);
    return;
  }

  const zodBridgeContent = readFileSync(zodBridgePath, 'utf8');

  // Extract DTO class names
  const dtos = new Set();
  for (const file of dtoFiles) {
    const content = readFileSync(file, 'utf8');
    let match;
    while ((match = DTO_CLASS_REGEX.exec(content)) !== null) {
      const prefix = match[1];
      const name = match[2];
      // Normalize: CreateInvoiceDto → CreateInvoice
      const normalized = prefix + name;
      dtos.add(normalized);
    }
  }

  // Extract Zod schema names
  const schemas = new Set();
  let schemaMatch;
  while ((schemaMatch = ZOD_SCHEMA_REGEX.exec(zodBridgeContent)) !== null) {
    const prefix = schemaMatch[1] || '';
    const name = schemaMatch[2];
    const normalized = prefix + name;
    schemas.add(normalized);
  }

  // Compare coverage
  const domainDtos = Array.from(dtos).sort();
  totalDtos += domainDtos.length;

  for (const dto of domainDtos) {
    // Check if there's a matching schema (flexible matching)
    const baseName = dto.replace(/^(Create|Update|List|Get)/, '');
    const hasSchema = Array.from(schemas).some(s => 
      s === dto || s === baseName + 'Schema' || s.includes(baseName)
    );
    
    if (hasSchema) {
      coveredDtos++;
    } else {
      missingCoverage.push({ domain, dto });
    }
  }

  if (domainDtos.length === 0) {
    console.log(`  ⚠️  ${domain} — no DTO classes found`);
  } else {
    const coverage = Math.round((coveredDtos / totalDtos) * 100);
    console.log(`  ${domain}: ${coveredDtos}/${totalDtos} DTOs covered (${coverage}%)`);
  }
}

// Main execution
console.log('🔍 Zod Bridge Coverage Validation\n');

const domains = readdirSync(DTO_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

console.log('Scanning domains...\n');
domains.forEach(domain => {
  scanDomain(join(DTO_DIR, domain));
});

console.log('\n' + '─'.repeat(50));
console.log(`\n📊 Coverage Summary:`);
console.log(`   Total DTOs: ${totalDtos}`);
console.log(`   Covered: ${coveredDtos}`);
console.log(`   Missing: ${missingCoverage.length}`);

if (missingCoverage.length > 0) {
  console.log('\n❌ Missing Zod schemas for:');
  missingCoverage.forEach(({ domain, dto }) => {
    console.log(`   - ${domain}/${dto}`);
  });
  console.log('\nRun: node scripts/scaffold-domain.mjs <domain> to create missing bridges');
}

const coverage = totalDtos > 0 ? Math.round((coveredDtos / totalDtos) * 100) : 0;
console.log(`\n📈 Overall Coverage: ${coverage}%`);

if (coverage < 100) {
  console.log('⚠️  Not all DTOs have Zod schemas. Consider adding missing bridges.');
  process.exitCode = 1;
} else {
  console.log('✅ All DTOs have Zod schema coverage!');
}
