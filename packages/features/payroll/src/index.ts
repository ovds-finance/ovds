/**
 * @ovds/features/payroll — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  payrollRunsApi, payslipsApi, shiftsApi
} from './services/payrollApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  usePayrollRun, usePayrollDashboard
} from './hooks/usePayroll';
