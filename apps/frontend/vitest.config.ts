import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

import fs from 'fs';

import { buildWorkspaceAliases } from './vite.config';

const localModules = path.resolve(__dirname, 'node_modules');
const rootModules = path.resolve(__dirname, '../../node_modules');
const frontendModules = fs.existsSync(path.resolve(localModules, 'react'))
  ? localModules
  : rootModules;

const frontendReact = path.resolve(frontendModules, 'react');
const frontendReactDom = path.resolve(frontendModules, 'react-dom');

const workspaceAliases = buildWorkspaceAliases();

export default defineConfig({
  tsconfig: {
    tsconfigRootDir: __dirname,
  },

  plugins: [react()],

  resolve: {
    dedupe: ['react', 'react-dom'],

    alias: {
      ...workspaceAliases,

      // Pin React to frontend local deps
      react: frontendReact,
      'react-dom': frontendReactDom,
      'class-validator': path.resolve(__dirname, '../../node_modules/class-validator'),

      // Force Vitest/Vite to resolve dom-accessibility-api from nested copy
      // shipped with @testing-library/jest-dom.
      'dom-accessibility-api/dist/index.mjs': path.resolve(__dirname, 'node_modules/dom-accessibility-api/dist/index.js'),

      'dom-accessibility-api': path.resolve(__dirname, 'node_modules/dom-accessibility-api/dist/index.js'),
    },
  },

  test: {
    name: 'frontend:unit',
    globals: true,
    environment: 'jsdom',
    pool: 'forks',
    poolOptions: {
      forks: {
        // jsdom can't share memory across threads so forks is correct here.
        // Cap at 4 to avoid 16 Node processes on high-core-count machines.
        maxForks: 4,
        minForks: 1,
      },
    },
    setupFiles: ['./src/test/setup.ts'],
    css: false,

    server: {
      deps: {
        inline: [
          '@testing-library/react',
          '@testing-library/user-event',
          '@testing-library/dom',
          '@testing-library/jest-dom',
          'dom-accessibility-api',
        ],
      },
    },

    // Use SWC legacy decorators so class-validator/class-transformer DTO decorators
    // receive the class constructor target during module evaluation.
    transform: {
      '^.+\\.(t|j)sx?$': [
        '@swc/core',
        {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: true,
              decorators: true,
            },
            transform: {
              legacyDecorator: true,
            },
            target: 'es2020',
          },
          module: {
            type: 'commonjs',
          },
        },
      ],
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        'src/main.tsx',
        'src/i18n.ts',
      ],
    },
  },
});


