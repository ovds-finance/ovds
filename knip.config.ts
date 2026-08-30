/**
 * knip.config.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Knip configuration for the OVDS Nx monorepo.
 * Finds unused files, exports, and dependencies across all workspace packages.
 *
 * Run:   npx knip
 *        node scripts/dep-check.mjs   (via the optimization pipeline)
 *
 * Docs:  https://knip.dev/reference/configuration
 */
import type { KnipConfig } from 'knip';
import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Dynamically enumerate all domain/feature/module packages ─────────────────
function enumWorkspacePackages(type: string): Record<string, { entry: string[] }> {
  const result: Record<string, { entry: string[] }> = {};
  const dir = join(__dirname, 'packages', type);
  if (!existsSync(dir)) return result;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const key = `packages/${type}/${name.name}`;
    result[key] = { entry: ['src/index.ts'] };
  }
  return result;
}

const domainWorkspaces  = enumWorkspacePackages('domains');
const featureWorkspaces = enumWorkspacePackages('features');
const moduleWorkspaces  = enumWorkspacePackages('modules');

const config: KnipConfig = {
  // ── Entry points ────────────────────────────────────────────────────────────
  entry: [
    // Apps
    'apps/frontend/src/main.tsx',
    'apps/frontend/src/App.tsx',
    'apps/backend/src/main.ts',
    // Scripts
    'scripts/*.mjs',
    'scripts/*.cjs',
    // Config files that import project code
    'vite.config.ts',
    'apps/frontend/vite.config.ts',
    'vitest.config.ts',
    'apps/backend/vitest.config.ts',
    'apps/frontend/vitest.config.ts',
    // Knip config itself
    'knip.config.ts',
  ],

  // ── Project files to analyse ────────────────────────────────────────────────
  project: [
    'apps/frontend/src/**/*.{ts,tsx}',
    'apps/backend/src/**/*.ts',
    'packages/*/src/**/*.{ts,tsx}',
    'packages/shared/*/src/**/*.{ts,tsx}',
    'packages/modules/*/src/**/*.{ts,tsx}',
    'packages/domains/*/src/**/*.{ts,tsx}',
    'packages/features/*/src/**/*.{ts,tsx}',
  ],

  // ── Ignore patterns ─────────────────────────────────────────────────────────
  ignore: [
    // Generated
    'packages/database/dist/**',
    'packages/contracts/src/prisma-zod/**',
    '**/dist/**',
    '**/node_modules/**',
    '**/*.d.ts',
    // Test files — knip's test-file rules handle these separately
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
    // Migration SQL
    'packages/database/migrations/**',
    'packages/database/prisma/migrations/**',
    // Scripts are entrypoints, not library code — ignore their exports
    'scripts/**',
    // Reports dir
    '.reports/**',
  ],

  // ── Ignore known-used deps that knip can't trace statically ─────────────────
  //
  // NestJS decorator pattern: modules, providers, guards etc. are registered
  // via class decorators — knip can't follow the DI graph statically.
  //
  // Prisma generators: zod-prisma-types is invoked by the Prisma CLI at codegen
  // time, not imported by application code.
  //
  // pnpm overrides: core-js and platform shims are injected by bundlers, not
  // directly imported.
  ignoreDependencies: [
    // TypeScript / polyfills
    'typescript',
    'reflect-metadata',
    'core-js',
    // NestJS runtime DI — used via decorators, not direct imports
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/platform-express',
    '@nestjs/websockets',
    '@nestjs/platform-socket.io',
    '@nestjs/event-emitter',
    '@nestjs/schedule',
    '@nestjs/bullmq',
    '@nestjs/passport',
    '@nestjs/jwt',
    '@nestjs/swagger',
    '@nestjs/throttler',
    '@nestjs/cache-manager',
    '@nestjs/config',
    '@nestjs/testing',
    // Passport strategies — registered via .use() not static imports
    'passport',
    'passport-local',
    'passport-jwt',
    // Prisma generator plugins (used by prisma generate, not app code)
    'zod-prisma-types',
    'prisma',
    // pnpm overrides / platform shims — injected by the bundler/runtime
    '@rollup/rollup-win32-x64-msvc',
    // SWC build toolchain — invoked by NestJS CLI / Vite, not imported
    '@swc/core',
    '@swc/cli',
    // Playwright — test runner, not imported by source
    '@playwright/test',
  ],

  // ── Workspace definitions ───────────────────────────────────────────────────
  //
  // Root + both apps are listed explicitly; the large domain/feature/module
  // packages are enumerated dynamically above so this file stays up to date
  // automatically as new packages are added.
  workspaces: {
    '.': {
      entry: [
        'scripts/*.mjs',
        'vitest.config.ts',
        'nx.json',
        'knip.config.ts',
      ],
    },

    // ── Apps ──────────────────────────────────────────────────────────────────
    'apps/frontend': {
      entry: [
        'src/main.tsx',
        'src/App.tsx',
        'vite.config.ts',
        'vitest.config.ts',
      ],
    },
    'apps/backend': {
      entry: [
        'src/main.ts',
        'src/app.module.ts',
        'vitest.config.ts',
      ],
    },

    // ── Core packages ─────────────────────────────────────────────────────────
    'packages/contracts':     { entry: ['src/index.ts', 'src/**/*.ts'] },
    'packages/core':          { entry: ['src/index.ts'] },
    'packages/database':      { entry: ['src/index.ts', 'prisma/seed.ts', 'prisma/seed-demo.ts'] },
    'packages/design-system': { entry: ['src/index.ts'] },
    'packages/shared':        { entry: ['src/index.ts'] },
    'packages/ui':            { entry: ['src/index.ts'] },

    // ── Domain, feature, and module packages (auto-enumerated) ────────────────
    ...domainWorkspaces,
    ...featureWorkspaces,
    ...moduleWorkspaces,
  },
};

export default config;
