import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ovds/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      '@ovds/design-system': path.resolve(__dirname, '../design-system/src/index.ts'),
    },
  },
  test: {
    name: 'ui:unit',
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts', 'tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    pool: 'threads',
  },
});
