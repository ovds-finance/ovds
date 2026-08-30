/**
 * @ovds/features/hr
 *
 * HR domain feature library — hooks, API clients, components, types.
 * Import from this package in frontend pages/components.
 *
 * Scope: frontend (scope:frontend, type:feature)
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  employeesApi,
  payrollApi,
  leavesApi,
  attendanceApi,
  departmentsApi,
  hrKeys,
  payCalendarsApi,
  hrAssetsApi,
} from './services/hrApi';

export type {
  Employee,
  PayrollRecord,
  LeaveRequest,
  PayCalendar,
  HrAsset,
} from './services/hrApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export { usePayrollStats } from './hooks/usePayrollStats';
export type { PayrollStats, UsePayrollStatsOptions, UsePayrollStatsResult } from './hooks/usePayrollStats';

export { useEmployees } from './hooks/useEmployees';
export type { EmployeeFilters, UseEmployeesResult } from './hooks/useEmployees';

export { useLeaves } from './hooks/useLeaves';
export type { UseLeaveFilters, UseLeavesResult } from './hooks/useLeaves';

export { useAttendance } from './hooks/useAttendance';
export type { UseAttendanceFilters, UseAttendanceResult, AttendanceSummary } from './hooks/useAttendance';

export { useDepartments } from './hooks/useDepartments';
export type { UseDepartmentsResult } from './hooks/useDepartments';

// ── Types ──────────────────────────────────────────────────────────────────────
export type {
  PayrollPeriod,
  EmployeeOption,
  LeaveBalance,
  DailyAttendanceSummary,
} from './types';

// ── Utils ──────────────────────────────────────────────────────────────────────
export {
  formatEmployeeName,
  toEmployeeOption,
  lastNMonths,
} from './utils';
