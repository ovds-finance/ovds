import { defineConfig } from 'vitest/config';
import path from 'path';
import fs from 'fs';

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
    '@ovds/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
    '@ovds/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
    'class-validator': path.resolve(__dirname, '../../node_modules/class-validator'),
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
    alias: buildWorkspaceAliases(),
    extensions: ['.ts', '.js', '.json'],
    conditions: ['node', 'import'],
  },
  test: {
    name: 'backend:unit',
    environment: 'node',
    globals: true,
    globalSetup: [path.resolve(__dirname, './test/global-setup.ts')],
    setupFiles: [
      path.resolve(__dirname, './vitest.setup.ts'),
      path.resolve(__dirname, './test/jest-compat.setup.ts'),
    ],
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    exclude: ['src/**/*.integration-spec.ts', 'test/**/*.playwright-spec.ts', 'test/health.e2e-spec.ts', 'test/navigation-structure.e2e-spec.ts', 'test/ovds-crud.e2e-spec.ts', 'test/security-headers.e2e-spec.ts'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        // Cap worker count to avoid over-subscribing CPU. NestJS tests
        // are I/O-heavy (DB, Redis mocks) so 4 workers is the sweet spot.
        maxThreads: 4,
        minThreads: 1,
      },
    },
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

