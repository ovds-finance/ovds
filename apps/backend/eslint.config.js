import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

const sharedRules = {
  'import/no-restricted-paths': [
    'error',
    {
      zones: [
        {
          target: './apps/backend/**/*',
          from: ['./packages/ui/**/*', './apps/frontend/**/*', './apps/portal/**/*'],
          message: 'Backend must not import UI components. Keep backend logic package-framework-agnostic.',
        },
      ],
    },
  ],
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [tseslint.configs.recommended],
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        node: true,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...sharedRules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
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
);
