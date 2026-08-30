/**
 * ovds components barrel.
 *
 * Pure UI components are centralized in @ovds/ui — re-exported here for
 * backward-compatible local imports.
 *
 * App-specific components (those using useAuth, useNavigate, etc.) remain here.
 */

// -- From @ovds/ui (pure, no app deps) ----------------------------------------
// Both camelCase (backward compat) and PascalCase (React convention) are exported.
export {
  ovdsKpiCard,    OvdsKpiCard,
  ovdsPageHeader, OvdsPageHeader,
  ovdsSummaryBar, OvdsSummaryBar,
  ovdsStatsStrip, OvdsStatsStrip,
  ovdsToolbar,    OvdsToolbar,
  ovdsEmptyState, OvdsEmptyState,
  ovdsNavCard,    OvdsNavCard,
  ovdsHealthScore, OvdsHealthScore,
} from '@ovds/ui';
export type { ovdsTab, StripStat } from '@ovds/ui';

// -- App-specific (use useAuth / useNavigate — cannot move to packages/ui) -----
export { ovdsQuickActions } from './ovdsQuickActions';
export { ovdsRecentActivity } from './ovdsRecentActivity';
export { default as PaymentVerificationPanel } from './paymentVerificationPanel';
export { OvdsPipelineConsole } from './OvdsPipelineConsole';
export { AabeVatFormSummary } from './AabeVatFormSummary';
