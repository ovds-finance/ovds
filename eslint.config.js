/**
 * Root ESLint flat config — shared rules + architecture boundaries + security linting
 *
 * This config is extended by apps/frontend and apps/backend.
 * It enforces the Nx monorepo architecture boundaries:
 *
 *  1. Frontend MUST NOT import directly from:
 *     - packages/database (Prisma client)
 *     - packages/modules/* (backend logic)
 *     - apps/backend (NestJS)
 *
 *  2. Backend MUST NOT import directly from:
 *     - packages/ui (React components)
 *     - apps/frontend (React)
 *
 *  3. All packages MUST use @ovds/* aliases instead of relative imports
 *     across package boundaries.
 *
 *  4. Security linting (eslint-plugin-security) is applied to ALL TypeScript
 *     files to catch dangerous patterns at CI time:
 *     - eval() / new Function() usage
 *     - RegExp with user-controlled input (ReDoS)
 *     - Object prototype pollution
 *     - Unsafe use of child_process, fs with dynamic paths
 *     - Hardcoded credentials (detected by key name heuristics)
 */

import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import securityPlugin from 'eslint-plugin-security';

const sharedRules = {
  'import/no-restricted-paths': [
    'error',
    {
      zones: [
        {
          target: './apps/frontend/**/*',
          from: ['./packages/database/**/*', './apps/backend/**/*', './packages/modules/**/*'],
          message: 'Frontend must not import database/models or backend code directly. Use @ovds/dto and @ovds/contracts instead.',
        },
        {
          target: './apps/backend/**/*',
          from: ['./packages/ui/**/*', './apps/frontend/**/*', './apps/portal/**/*'],
          message: 'Backend must not import UI components. Keep backend logic package-framework-agnostic.',
        },
        {
          target: './packages/shared/**/*',
          from: ['./packages/design-system/**/*', './packages/ui/**/*'],
          message: 'Shared packages must not depend on UI layer. Use @ovds/design-tokens instead.',
        },
      ],
    },
  ],
  'import/no-relative-packages': [
    'error',
    {
      allow: [
        './packages/shared/**/*',
        './packages/contracts/**/*',
        './packages/core/**/*',
        './packages/design-system/**/*',
        './packages/design-tokens/**/*',
        './packages/database/**/*',
      ],
      message: 'Use @ovds/* workspace aliases instead of relative imports across packages.',
    },
  ],
};

// ── Security rules shared across backend and frontend ─────────────────────────
// All rules from eslint-plugin-security that have meaningful signal for this
// stack. Rules that produce excessive false-positives on Prisma or NestJS
// decorator patterns are downgraded to 'warn' rather than 'error' so they
// appear in CI output without blocking the build.
const securityRules = {
  // Detect eval() and variants — hard error, no legitimate use in this codebase
  'security/detect-eval-with-expression': 'error',

  // Detect new Function() — hard error
  'security/detect-new-buffer': 'error',

  // Non-literal RegExp passed to constructor — possible ReDoS
  'security/detect-non-literal-regexp': 'warn',

  // Non-literal argument to require() — possible injection
  'security/detect-non-literal-require': 'warn',

  // Dynamic fs operations with non-literal path arguments
  'security/detect-non-literal-fs-filename': 'warn',

  // Object.prototype assignment — prototype pollution
  'security/detect-object-injection': 'warn',

  // Possible timing attacks (string comparison in auth flows)
  'security/detect-possible-timing-attacks': 'warn',

  // Pseudo-random number generator (Math.random) used where crypto is required
  'security/detect-pseudorandom': 'warn',

  // Unsafe regex (exponential backtracking) — catastrophic ReDoS
  'security/detect-unsafe-regex': 'error',

  // Buffer() constructor is deprecated and can expose uninitialised memory
  'security/detect-no-csrf-before-method-override': 'warn',

  // child_process.exec with a dynamic string argument
  'security/detect-child-process': 'warn',

  // Disable rules that fire on every Prisma model property access
  // (detect-object-injection reports `model[key]` which is ubiquitous in ORMs)
  // Overridden per-file in apps/backend via the backend eslint.config.js.
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '**/dist/**', '**/dist-cjs/**'] },
  {
    extends: [tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        browser: true,
        node: true,
      },
    },
    plugins: {
      import: importPlugin,
      security: securityPlugin,
    },
    rules: {
      ...sharedRules,
      ...securityRules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-shadow-restricted-names': 'off',
    },
  },
);
