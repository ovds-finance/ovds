/**
 * @ovds/features/compliance — public API
 *
 * Covers: Business registration, sector compliance, TIN/VAT validation,
 * ERCA portal, annual return filing.
 *
 * Scope: frontend (scope:frontend, type:feature)
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  complianceApi,
  validationApi,
  businessRegistrationApi,
} from './services/complianceApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export { useComplianceStatus } from './hooks/useComplianceStatus';
export { useAgmList, useCreateAgm, useDeleteAgm, useGovernanceList, useCreateGovernance, useDeleteGovernance } from './hooks/useAgmGovernance';
