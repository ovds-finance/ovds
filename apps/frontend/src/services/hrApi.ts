/**
 * Re-export shim — hrApi has moved to @ovds/features/hr.
 * All existing imports of '../services/hrApi' continue to work.
 * New code should import from '@ovds/features/hr' directly.
 */
export {
  employeesApi,
  payrollApi,
  leavesApi,
  attendanceApi,
  departmentsApi,
  payCalendarsApi,
  hrAssetsApi,
  hrKeys,
} from '@ovds/features/hr';

export type {
  Employee,
  PayrollRecord,
  LeaveRequest,
  PayCalendar,
  HrAsset,
} from '@ovds/features/hr';
