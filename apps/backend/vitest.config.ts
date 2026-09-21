import fs from 'fs';
import path from 'path';

import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for the NestJS backend.
 *
 * Uses @swc/core to transform TypeScript so that emitDecoratorMetadata is
 * preserved — required for NestJS dependency injection to work in tests.
 * Without this, NestJS can't resolve constructor parameter types and
 * `this.prisma` ends up undefined inside services.
 */
function buildWorkspaceAliases(): Record<string, string> {
  const alias: Record<string, string> = {
    '@common': path.resolve(__dirname, 'src/common'),
    '@ovds/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    '@ovds/design-system': path.resolve(__dirname, '../../packages/design-system/src/index.ts'),
     '@ovds/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
    // Sub-path aliases MUST come before their parent to avoid prefix matching
    '@ovds/modules/tax/countries/et/et-vat-module': path.resolve(__dirname, '../../packages/modules/tax/src/countries/et/et-vat-module.ts'),
    '@ovds/modules/tax/countries/ae/ae-vat-module': path.resolve(__dirname, '../../packages/modules/tax/src/countries/ae/ae-vat-module.ts'),
    '@ovds/modules/tax': path.resolve(__dirname, '../../packages/modules/tax/src/index.ts'),
    '@ovds/core/vat/report': path.resolve(__dirname, '../../packages/core/src/vat/report/index.ts'),
    '@ovds/core/vat': path.resolve(__dirname, '../../packages/core/src/vat/index.ts'),
    '@ovds/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
    '@ovds/contracts/schemas': path.resolve(__dirname, '../../packages/contracts/src/schemas/index.ts'),
    '@ovds/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
    '@ovds/domains-vat': path.resolve(__dirname, '../../packages/domains/vat/src/index.ts'),
    '@ovds/domains-invoice': path.resolve(__dirname, '../../packages/domains/invoice/src/index.ts'),
    '@ovds/domains-infrastructure': path.resolve(__dirname, '../../packages/domains/infrastructure/src/index.ts'),
    '@ovds/domains-double-entry': path.resolve(__dirname, '../../packages/domains/double-entry/src/index.ts'),
    '@ovds/domains-accounting': path.resolve(__dirname, '../../packages/domains/accounting/src/index.ts'),
    '@ovds/dto': path.resolve(__dirname, '../../packages/shared/dto/src/index.ts'),
    // Prefer app-local class-validator, fall back to root node_modules
    'class-validator': (() => {
      const local = path.resolve(__dirname, 'node_modules/class-validator');
      const root = path.resolve(__dirname, '../../node_modules/class-validator');
      return fs.existsSync(local) ? local : root;
    })(),
  };

  const packagesDir = path.resolve(__dirname, '../../packages');
  for (const type of ['domains', 'features']) {
    const typeDir = path.join(packagesDir, type);
    if (!fs.existsSync(typeDir)) continue;
    for (const name of fs.readdirSync(typeDir)) {
      const indexPath = path.join(typeDir, name, 'src', 'index.ts');
      if (fs.existsSync(indexPath)) {
        alias[`@ovds/${type}/${name}`] = path.resolve(indexPath);
      }
    }
  }

  return alias;
}

export default defineConfig({
  resolve: {
    alias: [
      // Sub-path aliases MUST come before their parent to avoid prefix matching
      { find: '@ovds/shared/types', replacement: path.resolve(__dirname, '../../packages/shared/src/types/index.ts') },
      { find: '@ovds/shared/ovds/budget.types', replacement: path.resolve(__dirname, '../../packages/shared/src/ovds/budget.types.ts') },
      { find: '@ovds/shared/ovds/tax.types', replacement: path.resolve(__dirname, '../../packages/shared/src/ovds/tax.types.ts') },
      ...Object.entries(buildWorkspaceAliases()).map(([find, replacement]) => ({ find, replacement })),
    ],
    extensions: ['.ts', '.js', '.json'],
    conditions: ['node', 'import'],
  },
  pool: 'threads',
  poolOptions: {
    threads: {
      singleThread: true,
      // Cap worker count to avoid over-subscribing CPU. NestJS tests
      // are I/O-heavy (DB, Redis mocks) so 4 workers is the sweet spot.
      maxThreads: 4,
      minThreads: 1,
    },
  },
  test: {
    name: 'backend:unit',
    environment: 'node',
    globals: true,
    testTimeout: 30_000,
    globalSetup: [path.resolve(__dirname, './test/global-setup.ts')],
    setupFiles: [
      path.resolve(__dirname, './vitest.setup.ts'),
      path.resolve(__dirname, './test/jest-compat.setup.ts'),
    ],
    include: ['src/**/*.spec.ts'],
     exclude: ['src/**/*.integration-spec.ts', 'src/**/*.e2e-spec.ts', 'src/auth/auth.controller.spec.ts'],
    deps: {
      inline: ['supertest'],
    },

    // which NestJS DI requires to resolve constructor parameter types.
    transform: {
      '^.+\\.(t|j)sx?$': [
        '@swc/core',
        {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: false,
              decorators: true,
            },
            transform: {
              decoratorMetadata: true,
              legacyDecorator: true,
            },
            target: 'es2021',
          },
          module: {
            type: 'commonjs',
          },
        },
      ],
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'test/**',
        '**/*.d.ts',
        '**/*.module.ts',
        '**/main.ts',
        '**/*.controller.ts',
        '**/*.dto.ts',
        '**/*.entity.ts',
        '**/*.guard.ts',
        '**/*.decorator.ts',
        '**/*.strategy.ts',
        '**/*.scheduler.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
});

