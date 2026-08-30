import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, 'src/common'),
      '@ovds/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@ovds/design-system': path.resolve(__dirname, '../../packages/design-system/src/index.ts'),
      '@ovds/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
      '@ovds/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@ovds/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      'class-validator': path.resolve(__dirname, '../../node_modules/class-validator'),
    },
  },
  test: {
    name: 'backend:e2e',
    environment: 'node',
    globals: true,
    setupFiles: [
      path.resolve(__dirname, './vitest.setup.ts'),
      path.resolve(__dirname, './test/jest-compat.setup.ts'),
    ],
    include: ['test/**/*.e2e-spec.ts', 'test/**/*.spec.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
