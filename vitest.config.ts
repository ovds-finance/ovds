import { defineConfig } from 'vitest/config';
import path from 'path';

const domains = [
  'accounting', 'appstore', 'audit-outsourcing', 'auth', 'banking', 'compliance',
  'cost-centers', 'crm', 'currency', 'custom-fields', 'dashboard', 'device-control',
  'disaster-fund', 'double-entry', 'expense-claims', 'fiscal', 'general-ledger-compliance',
  'helpdesk', 'hr', 'ifrs', 'infrastructure', 'inventory', 'invoice', 'iot',
  'loyalty', 'manufacturing', 'monetization', 'nodes', 'notifications', 'offline-sync',
  'onboarding', 'procurement', 'purchases', 'release', 'reporting', 'sales',
  'security-evaluator', 'settings', 'sub-ledger', 'tax', 'treasury', 'websocket', 'workflow',
];

const features = [
  'accounting', 'tax', 'inventory', 'sales', 'purchases', 'treasury', 'reporting',
  'hr', 'crm', 'dashboard', 'settings', 'auth', 'payroll', 'projects', 'helpdesk',
  'loyalty', 'iot', 'device-control', 'compliance', 'procurement', 'manufacturing',
  'onboarding', 'audit-outsourcing', 'disaster-fund', 'appstore', 'offline-sync',
  'release', 'banking', 'vendors', 'customers', 'items', 'expenses', 'payments',
  'receipts', 'trade', 'contracts', 'notifications', 'double-entry', 'invoice',
  'sub-ledger', 'currency', 'cost-centers', 'general-ledger-compliance', 'ifrs',
  'expense-claims', 'fiscal', 'custom-fields', 'workflow', 'monetization', 'security-evaluator',
];

const alias: Record<string, string> = {};
for (const d of domains) {
  alias[`@ovds/domains/${d}`] = path.resolve(__dirname, `packages/domains/${d}/src/index.ts`);
}
for (const f of features) {
  alias[`@ovds/features/${f}`] = path.resolve(__dirname, `packages/features/${f}/src/index.ts`);
}

export default defineConfig({
  resolve: { alias },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['apps/backend/test/jest-compat.setup.ts'],
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    // Don't fail the suite when a package has no test files yet.
    passWithNoTests: true,
  },
});
