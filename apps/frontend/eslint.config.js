// Lint debt tracker — inline eslint-disable-next-line suppressions were added
// when file-level ignores were removed as part of Fix B4 (ovds-docs-portal-fixes).
// Files affected: InvoiceAnalytics.tsx, PeriodClose.tsx, TransactionCategories.tsx,
//                 DisasterFund.tsx, Reports.tsx, Accounting.tsx
// Target: replace all /* eslint-disable */ headers with targeted inline suppressions,
//         then progressively fix underlying issues to remove suppressions entirely.
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
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
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-useless-escape': 'warn',
      'no-empty': 'warn',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-shadow-restricted-names': 'off',
    },
  },
);
