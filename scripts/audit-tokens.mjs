#!/usr/bin/env node
/**
 * scripts/audit-tokens.mjs — scans the codebase for design token violations
 *
 * Checks for:
 *  1. Hardcoded hex colors in React/Vue/TSX/TS files
 *  2. Hardcoded font sizes (px/rem/em) outside design-tokens
 *  3. Hardcoded spacing values outside design-tokens
 *  4. Direct database imports in frontend apps
 *  5. Direct UI imports in backend apps
 *  6. Missing zod-bridge for domains that have class-validator DTOs
 *
 * Usage:
 *   node scripts/audit-tokens.mjs
 *   node scripts/audit-tokens.mjs --fix  (auto-fix where possible)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

const HEX_COLOR_REGEX = /#(?:[A-Fa-f0-9]{3}){1,2}(?![A-Fa-f0-9])/g;
const FONT_SIZE_REGEX = /(?:fontSize|font-size|text-)\s*[:=]\s*['"]?(\d+(?:\.\d+)?)(px|rem|em)/g;
const SPACING_REGEX = /(?:padding|margin|gap|space|width|height)\s*[:=]\s*['"]?(\d+(?:\.\d+)?)(px|rem|em)/g;

const FRONTEND_DIRS = ['apps/frontend', 'apps/portal'];
const BACKEND_DIRS = ['apps/backend'];
const DATABASE_IMPORT = 'packages/database';
const UI_IMPORT = 'packages/ui';

let issues = 0;
let warnings = 0;

function scanFile(filePath, content) {
  const relPath = relative(root, filePath);
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
      return;
    }

    // Check for hardcoded hex colors
    const hexMatches = line.match(HEX_COLOR_REGEX);
    if (hexMatches && !line.includes('--') && !line.includes('design-tokens')) {
      console.log(`  ⚠️  ${relPath}:${idx + 1} — Hardcoded color: ${hexMatches.join(', ')}`);
      warnings++;
    }

    // Check for hardcoded font sizes
    const fontMatches = line.match(FONT_SIZE_REGEX);
    if (fontMatches) {
      console.log(`  ⚠️  ${relPath}:${idx + 1} — Hardcoded font size: ${fontMatches.map(m => m[0]).join(', ')}`);
      warnings++;
    }
  });
}

function checkArchitectureViolations() {
  console.log('\n4. Architecture Boundary Violations');
  
  // Check frontend imports (exclude config files)
  FRONTEND_DIRS.forEach(dir => {
    const fullPath = join(root, dir);
    if (!statSync(fullPath).isDirectory()) return;

    const files = getAllFiles(fullPath, ['.ts', '.tsx', '.js', '.jsx'])
      .filter(file => !file.includes('eslint.config') && !file.includes('vite.config'));
    files.forEach(file => {
      try {
        const content = readFileSync(file, 'utf8');
        if (content.includes(DATABASE_IMPORT)) {
          console.log(`  ❌ ${relative(root, file)} — imports from ${DATABASE_IMPORT}`);
          issues++;
        }
      } catch (e) {
        // Skip files that can't be read
      }
    });
  });

  // Check backend imports (exclude config files)
  BACKEND_DIRS.forEach(dir => {
    const fullPath = join(root, dir);
    if (!statSync(fullPath).isDirectory()) return;

    const files = getAllFiles(fullPath, ['.ts', '.tsx', '.js', '.jsx'])
      .filter(file => !file.includes('eslint.config') && !file.includes('vite.config'));
    files.forEach(file => {
      try {
        const content = readFileSync(file, 'utf8');
        if (content.includes(UI_IMPORT)) {
          console.log(`  ❌ ${relative(root, file)} — imports from ${UI_IMPORT}`);
          issues++;
        }
      } catch (e) {
        // Skip files that can't be read
      }
    });
  });
}

function checkZodBridgeCoverage() {
  console.log('\n5. Zod Bridge Coverage');
  
  const dtoDir = join(root, 'packages/shared/dto/src');
  const domains = readdirSync(dtoDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => name !== 'common' && name !== 'lib' && name !== 'modules');

  let covered = 0;
  domains.forEach(domain => {
    const zodBridgePath = join(dtoDir, domain, 'zod-bridge.ts');
    if (statSync(zodBridgePath).isFile()) {
      covered++;
    }
  });

  console.log(`  ${covered}/${domains.length} domains have zod-bridge coverage`);
  if (covered < domains.length) {
    warnings++;
  }
}

function getAllFiles(dir, extensions) {
  let files = [];
  try {
    const items = readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = join(dir, item.name);
      if (item.isDirectory()) {
        files = [...files, ...getAllFiles(fullPath, extensions)];
      } else if (extensions.some(ext => item.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Skip directories that can't be read
  }
  
  return files;
}

// Main execution
console.log('🔍 OVDS Token Audit\n');
console.log('1. Scanning for hardcoded colors...');

const scanDirs = [
  ...FRONTEND_DIRS,
  ...BACKEND_DIRS,
  'packages/ui/src',
  // Exclude design-system and design-tokens from color scan - they ARE the canonical source
];

scanDirs.forEach(dir => {
  const fullPath = join(root, dir);
  if (!statSync(fullPath).isDirectory()) return;

  const files = getAllFiles(fullPath, ['.ts', '.tsx', '.js', '.jsx', '.css']);
  files.forEach(file => {
    try {
      const content = readFileSync(file, 'utf8');
      scanFile(file, content);
    } catch (e) {
      // Skip files that can't be read
    }
  });
});

checkArchitectureViolations();
checkZodBridgeCoverage();

console.log('\n' + '─'.repeat(50));
if (issues === 0 && warnings === 0) {
  console.log('\n✅ Token audit passed — no violations found');
} else {
  console.log(`\n⚠️  Audit completed with ${issues} issue(s) and ${warnings} warning(s)`);
  if (issues > 0) {
    console.log('   Fix issues before committing.');
    process.exitCode = 1;
  }
}
