/**
 * @ovds/features/hr — frontend utilities.
 */

/**
 * Format an employee's full name.
 * Handles missing parts gracefully.
 */
export function formatEmployeeName(
  firstName?: string | null,
  lastName?: string | null,
  employeeId?: string | null,
): string {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (!name) return employeeId ?? 'Unknown employee';
  return employeeId ? `${name} (${employeeId})` : name;
}

/**
 * Build an EmployeeOption label from raw employee data.
 */
export function toEmployeeOption(emp: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  employeeId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
}) {
  return {
    id:          emp.id,
    label:       formatEmployeeName(emp.firstName, emp.lastName, emp.employeeId),
    departmentId: emp.departmentId ?? null,
    companyId:   emp.companyId ?? null,
  };
}

/** Map a JS Date month index (0-based) to the Ethiopian fiscal month (EFY). */
export function toEthiopianFiscalMonth(date: Date): { year: number; month: number } {
  // Ethiopian fiscal year starts July 8 (Gregorian).
  // July 8 of Gregorian year Y = month 1 of EFY (Y - 7).
  const d     = date.getDay();
  const m     = date.getMonth() + 1; // 1-based
  const y     = date.getFullYear();
  const efyYear = m > 7 || (m === 7 && date.getDate() >= 8) ? y - 7 : y - 8;
  const efyMonth = m >= 7 ? m - 6 : m + 6; // rough mapping
  return { year: efyYear, month: efyMonth };
}

/**
 * Returns an array of { year, month } objects for the last N months
 * (inclusive of the current month), newest first.
 */
export function lastNMonths(n: number): Array<{ year: number; month: number }> {
  const now    = new Date();
  const result: Array<{ year: number; month: number }> = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return result;
}
