import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';

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
      ],
    },
  ],
};

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        browser: true,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    rules: {
      ...sharedRules,
      ...reactHooks.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'no-useless-escape': 'warn',
      'no-empty': 'warn',
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
