/**
 * Re-export shim — usePayrollStats has moved to @ovds/features/hr.
 * All existing imports continue to work unchanged.
 * New code: import { usePayrollStats } from '@ovds/features/hr';
 */
export { usePayrollStats } from '@ovds/features/hr';
export type { PayrollStats, UsePayrollStatsOptions, UsePayrollStatsResult } from '@ovds/features/hr';
