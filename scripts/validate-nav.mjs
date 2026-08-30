/**
 * Nav consistency validator — checks for drift between frontend nav definitions,
 * backend nav registrar, RBAC route policy, and app.tsx route table.
 *
 * Run with: node scripts/validate-nav.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function extractRoutes(text, pattern) {
  const matches = [...text.matchAll(new RegExp(pattern, 'g'))];
  return matches.map(m => m[1]).filter(Boolean);
}

function unique(arr) {
  return [...new Set(arr)];
}

const frontendNav = readFile('apps/frontend/src/components/utils/navGroups.ts');
const backendRegistrar = readFile('apps/backend/src/nav/nav.controller.ts');
const rbac = readFile('packages/shared/src/rbac/route-policy.ts');
const appTsx = readFile('apps/frontend/src/app.tsx');
const navJson = readFile('apps/frontend/src/i18n/nav.json');

const frontendRoutes = unique([
  ...extractRoutes(frontendNav, /to: '([^']+)'/g),
]);
const backendRoutes = unique([
  ...extractRoutes(backendRegistrar, /to: "([^"]+)"/g),
]);
const rbacRoutes = unique([
  ...extractRoutes(rbac, /^\s+'([^']+)':/gm),
]);
const appRoutes = unique([
  ...extractRoutes(appTsx, /path="([^"]+)"/g),
  ...extractRoutes(appTsx, /path='([^']+)'/g),
  ...extractRoutes(appTsx, /\[ '([^']+)'/g),
]);
const i18nKeys = unique(extractRoutes(navJson, /"([^"]+)":/g));

let errors = 0;
let warnings = 0;

function report(msg, isError = true) {
  const prefix = isError ? 'ERROR' : 'WARN';
  console.log(`  [${prefix}] ${msg}`);
  if (isError) errors++;
  else warnings++;
}

console.log('\n=== Nav Consistency Validation ===\n');

// 1. Frontend vs Backend routes
console.log('1. Frontend vs Backend routes:');
const onlyFrontend = frontendRoutes.filter(r => !backendRoutes.includes(r));
const onlyBackend = backendRoutes.filter(r => !frontendRoutes.includes(r));
if (onlyFrontend.length === 0) {
  console.log('  OK — No routes only in frontend');
} else {
  report(`Routes only in frontend (${onlyFrontend.length}):\n    ${onlyFrontend.join('\n    ')}`);
}
if (onlyBackend.length === 0) {
  console.log('  OK — No routes only in backend');
} else {
  report(`Routes only in backend (${onlyBackend.length}):\n    ${onlyBackend.join('\n    ')}`);
}

// 2. Frontend routes vs app.tsx
console.log('\n2. Frontend routes vs app.tsx:');
const missingInApp = frontendRoutes.filter(r => !appRoutes.includes(r) && !r.includes('?'));
if (missingInApp.length === 0) {
  console.log('  OK — All frontend routes exist in app.tsx (excluding query params)');
} else {
  report(`Routes in navGroups but NOT in app.tsx (${missingInApp.length}):\n    ${missingInApp.join('\n    ')}`);
}

// 3. RBAC coverage
console.log('\n3. RBAC ROUTE_POLICY coverage:');
const missingRbac = frontendRoutes.filter(r => !rbacRoutes.includes(r) && !r.includes('?'));
if (missingRbac.length === 0) {
  console.log('  OK — All frontend routes have RBAC entries');
} else {
  report(`Routes missing from RBAC ROUTE_POLICY (${missingRbac.length}):\n    ${missingRbac.join('\n    ')}`);
}

// 4. Duplicate routes in frontend
console.log('\n4. Duplicate routes in frontend navGroups.ts:');
const frontendDupes = frontendRoutes.filter((r, i, arr) => arr.indexOf(r) !== i);
if (frontendDupes.length === 0) {
  console.log('  OK — No duplicate routes in frontend');
} else {
  report(`Duplicate routes in frontend (${frontendDupes.length}):\n    ${[...new Set(frontendDupes)].join('\n    ')}`);
}

// 5. Duplicate routes in backend
console.log('\n5. Duplicate routes in backend nav-static.registrar.ts:');
const backendDupes = backendRoutes.filter((r, i, arr) => arr.indexOf(r) !== i);
if (backendDupes.length === 0) {
  console.log('  OK — No duplicate routes in backend');
} else {
  report(`Duplicate routes in backend (${backendDupes.length}):\n    ${[...new Set(backendDupes)].join('\n    ')}`);
}

// 6. i18n keys for groups
console.log('\n6. i18n keys for nav groups:');
const groupI18nKeys = frontendRoutes.filter(r => !r.includes('?') && !r.includes('/'));
// Actually check i18n keys for groups
const navGroupKeys = unique(extractRoutes(frontendNav, /key: '([^']+)'/g));
const missingGroupI18n = navGroupKeys.filter(k => !i18nKeys.includes(`nav.groups.${k}`));
if (missingGroupI18n.length === 0) {
  console.log('  OK — All nav groups have i18n keys');
} else {
  report(`Nav groups missing i18n keys (${missingGroupI18n.length}):\n    ${missingGroupI18n.join('\n    ')}`);
}

// Summary
console.log('\n=== Summary ===');
console.log(`  Errors: ${errors}`);
console.log(`  Warnings: ${warnings}`);

if (errors > 0) {
  console.log('\nValidation FAILED — fix errors above.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\nValidation passed with warnings.');
  process.exit(0);
} else {
  console.log('\nValidation PASSED — all checks OK.');
  process.exit(0);
}
