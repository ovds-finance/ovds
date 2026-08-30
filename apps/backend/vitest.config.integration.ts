import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for backend integration tests.
 *
 * Integration tests (*.integration-spec.ts) run against a real database.
 * Requires DATABASE_URL to point to a test database.
 * Run with: npm run test:integration
 */
export default defineConfig({
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, 'src/common'),
      '@ovds/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@ovds/design-system': path.resolve(__dirname, '../../packages/design-system/src/index.ts'),
      '@ovds/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
    },
  },
  test: {
    name: 'backend:integration',
    environment: 'node',
    globals: true,
    setupFiles: [
      path.resolve(__dirname, './vitest.setup.ts'),
      path.resolve(__dirname, './test/jest-compat.setup.ts'),
    ],
    include: ['src/**/*.integration-spec.ts', 'test/**/*.integration-spec.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // integration tests run serially to avoid DB conflicts
      },
    },
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});

