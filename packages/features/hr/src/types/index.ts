/**
 * @ovds/features/hr — local frontend types.
 *
 * Keep types that are frontend-only here (UI state shapes, view models).
 * Types shared with the backend belong in @ovds/contracts/schemas or @ovds/shared.
 */

/** Payroll period selector used by hooks and UI components */
export interface PayrollPeriod {
  year:  number;
  month: number; // 1–12
}

/** Compact employee card shape for dropdowns and autocomplete */
export interface EmployeeOption {
  id:          string;
  label:       string; // "firstName lastName (employeeId)"
  departmentId?: string | null;
  companyId?:  string | null;
}

/** Leave balance for a given employee + year */
export interface LeaveBalance {
  year:        number;
  employeeId:  string;
  entitlement: number;
  used:        number;
  remaining:   number;
}

/** Summary row shown in the attendance daily dashboard */
export interface DailyAttendanceSummary {
  date:              string; // YYYY-MM-DD
  totalEmployees:    number;
  checkedIn:         number;
  absent:            number;
  notRecorded:       number;
  attendanceRate:    number; // 0–100
}
