// Generates the canonical, DDD-aligned module packages under packages/modules/<domain>.
// Each module owns its domain types (src/domain), DTOs (src/dto) and a web/UI slice
// (src/web), and is exposed through a single barrel (src/index.ts). The barrels
// centralize types and re-export the existing (scattered) feature/domain packages so
// the frontend keeps working while the codebase migrates onto the canonical surface.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const modulesDir = join(root, 'packages', 'modules');

// Canonical domain -> the existing scattered package it absorbs (DDD module = facade +
// home for centralized types). `domain` = backend/types source, `web` = frontend source.
const MODULES = [
  { dir: 'auth',      title: 'Authentication, Users & Access Control', domain: '@ovds/features/auth',  web: '@ovds/features/auth' },
  { dir: 'settings',  title: 'Company Profile, Currencies & Localization', domain: '@ovds/features/settings', web: '@ovds/features/settings' },
  { dir: 'ledger',    title: 'General Ledger, Chart of Accounts & Double-Entry', domain: '@ovds/domains/accounting', web: '@ovds/features/accounting' },
  { dir: 'tax',       title: 'Tax, VAT, WHT & Declarations', domain: '@ovds/domains/tax', web: '@ovds/features/tax' },
  { dir: 'sales',     title: 'Sales, Invoicing, Customers & CRM', domain: '@ovds/domains/sales', web: '@ovds/features/sales' },
  { dir: 'purchases', title: 'Purchases, Expenses, Bills & Vendors', domain: '@ovds/domains/purchases', web: '@ovds/features/purchases' },
  { dir: 'banking',   title: 'Banking, Transactions & Reconciliation', domain: '@ovds/domains/banking', web: '@ovds/features/banking' },
  { dir: 'items',     title: 'Items, Inventory & Manufacturing', domain: '@ovds/domains/items', web: '@ovds/features/items' },
  { dir: 'hr',        title: 'HR, Payroll & Workforce', domain: '@ovds/domains/hr', web: '@ovds/features/hr' },
  { dir: 'projects',  title: 'Project Accounting', domain: '@ovds/domains/projects', web: '@ovds/features/projects' },
  { dir: 'compliance',title: 'Compliance, Audit & Governance', domain: '@ovds/domains/compliance', web: '@ovds/features/compliance' },
  { dir: 'security',  title: 'Security & Cyber Audit', domain: '@ovds/features/security', web: '@ovds/features/security' },
  { dir: 'platform',  title: 'Platform, App Store & Releases', domain: '@ovds/domains/platform', web: '@ovds/features/platform' },
  { dir: 'reports',   title: 'Reports & Analytics', domain: '@ovds/domains/reporting', web: '@ovds/features/reporting' },
  { dir: 'common',    title: 'Common Cross-Cutting Utilities', domain: '@ovds/shared', web: '@ovds/ui' },
];

function pkgName(dir) {
  return `@ovds/modules-${dir}`;
}

function writeJson(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
}

function writeText(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function modulePackageJson(m) {
  const deps = {};
  if (m.domain) deps[m.domain] = '*';
  if (m.web && m.web !== m.domain) deps[m.web] = '*';
  deps['@ovds/core'] = '*';
  deps['@ovds/shared'] = '*';
  return {
    name: pkgName(m.dir),
    version: '1.0.0',
    private: true,
    main: './dist/index.js',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    source: './src/index.ts',
    exports: {
      '.': {
        source: './src/index.ts',
        import: './dist/index.js',
        require: './dist/index.js',
        types: './dist/index.d.ts',
      },
      './web': {
        source: './src/web/index.ts',
        import: './dist/web/index.js',
        types: './dist/web/index.d.ts',
      },
      './domain': {
        source: './src/domain/index.ts',
        import: './dist/domain/index.js',
        types: './dist/domain/index.d.ts',
      },
      './dto': {
        source: './src/dto/index.ts',
        import: './dist/dto/index.js',
        types: './dist/dto/index.d.ts',
      },
    },
    sideEffects: false,
    scripts: {
      build: 'tsc -p tsconfig.json',
      typecheck: 'tsc -p tsconfig.json --noEmit',
    },
    dependencies: deps,
    devDependencies: {},
  };
}

function moduleProjectJson(m) {
  return {
    name: `modules-${m.dir}`,
    root: `packages/modules/${m.dir}`,
    sourceRoot: `packages/modules/${m.dir}/src`,
    projectType: 'library',
    tags: ['type:lib', 'type:module', `domain:${m.dir}`],
    implicitDependencies: ['core', 'shared'],
    targets: {
      build: {
        executor: 'nx:run-commands',
        options: { command: 'npm run build', cwd: `packages/modules/${m.dir}` },
        dependsOn: ['^build'],
        inputs: ['production', '^production'],
        outputs: ['{projectRoot}/dist'],
        cache: true,
      },
      typecheck: {
        executor: 'nx:run-commands',
        options: { command: 'npm run typecheck', cwd: `packages/modules/${m.dir}` },
        inputs: ['default', '^production'],
        cache: true,
      },
    },
  };
}

function moduleTsConfig(m) {
  return {
    extends: '../../../tsconfig.base.json',
    compilerOptions: {
      jsx: 'react-jsx',
      composite: false,
      declaration: true,
      skipLibCheck: true,
      noEmit: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strictPropertyInitialization: false,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', 'tests', 'src/**/*.spec.ts', 'src/**/*.test.ts'],
  };
}

function domainIndex(m) {
  if (!m.domain) return `// ${m.dir}: cross-cutting module — types live in @ovds/shared / @ovds/core.\n`;
  return `// Centralized domain types & rules for the "${m.title}" module.\n// Re-exports the canonical source of truth while the codebase migrates.\nexport * from '${m.domain}';\n`;
}

function webIndex(m) {
  if (!m.web) return `// ${m.dir}: web/UI slice — populated during migration from feature packages.\n`;
  return `// Web/UI slice for the "${m.title}" module.\n// Re-exports the frontend feature surface while the codebase migrates.\nexport * from '${m.web}';\n`;
}

function dtoIndex(m) {
  return `// DTO / contract definitions for the "${m.title}" module.\n// Centralized here as part of the DDD consolidation. Add zod/class-validator\n// contracts for this bounded context.\n`;
}

function indexTs(m) {
  return `/**
 * @ovds/modules-${m.dir}
 *
 * Canonical DDD module: "${m.title}".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules-${m.dir}';        // domain types & logic
 *   import { web } from '@ovds/modules-${m.dir}';        // namespaced UI slice
 *   import ... from '@ovds/modules-${m.dir}/web';         // UI subpath
 *   import ... from '@ovds/modules-${m.dir}/domain';      // types subpath
 *   import ... from '@ovds/modules-${m.dir}/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
`;
}

function readme(m) {
  return `# ${m.title}

Canonical OVDS module (\`packages/modules/${m.dir}\`).

Akaunting-inspired, DDD-aligned module layout:

\`\`\`
modules/${m.dir}/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (${m.domain ?? '@ovds/shared'})
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (${m.web ?? '@ovds/ui'})
\`\`\`

This module absorbs the previously-scattered packages for this bounded context.
Import from \`@ovds/modules-${m.dir}\` instead of the old \`features/*\` / \`domains/*\`
packages; those remain as backward-compatible shims until fully migrated.
`;
}

function addPathAliases() {
  const basePath = join(root, 'tsconfig.base.json');
  const base = JSON.parse(readFileSync(basePath, 'utf8'));
  base.compilerOptions.paths = base.compilerOptions.paths || {};
  const paths = base.compilerOptions.paths;
  for (const m of MODULES) {
    paths[`${pkgName(m.dir)}`] = [`packages/modules/${m.dir}/src/index.ts`];
    paths[`@ovds/modules/${m.dir}`] = [`packages/modules/${m.dir}/src/index.ts`];
    paths[`@ovds/modules/${m.dir}/web`] = [`packages/modules/${m.dir}/src/web/index.ts`];
    paths[`@ovds/modules/${m.dir}/domain`] = [`packages/modules/${m.dir}/src/domain/index.ts`];
    paths[`@ovds/modules/${m.dir}/dto`] = [`packages/modules/${m.dir}/src/dto/index.ts`];
  }
  writeFileSync(basePath, JSON.stringify(base, null, 2) + '\n');
  console.log('Updated tsconfig.base.json path aliases.');
}

let created = 0;
for (const m of MODULES) {
  const dir = join(modulesDir, m.dir);
  if (existsSync(join(dir, 'package.json'))) {
    console.log(`skip (exists): ${m.dir}`);
    continue;
  }
  writeJson(join(dir, 'package.json'), modulePackageJson(m));
  writeJson(join(dir, 'project.json'), moduleProjectJson(m));
  writeJson(join(dir, 'tsconfig.json'), moduleTsConfig(m));
  writeText(join(dir, 'src', 'index.ts'), indexTs(m));
  writeText(join(dir, 'src', 'domain', 'index.ts'), domainIndex(m));
  writeText(join(dir, 'src', 'web', 'index.ts'), webIndex(m));
  writeText(join(dir, 'src', 'dto', 'index.ts'), dtoIndex(m));
  writeText(join(dir, 'README.md'), readme(m));
  created++;
  console.log(`created: modules/${m.dir}`);
}
addPathAliases();
console.log(`\nDone. Created ${created} canonical module packages.`);
