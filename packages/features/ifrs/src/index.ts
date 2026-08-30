/**
 * @ovds/features/ifrs — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  leasesApi, fixedAssetsApi, impairmentApi, disclosureNotesApi
} from './services/ifrsApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useLeases, useLeaseSummary
} from './hooks/useLeases';
