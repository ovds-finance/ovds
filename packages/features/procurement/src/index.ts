/**
 * @ovds/features/procurement — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  requisitionsApi, rfqApi, procurementContractsApi
} from './services/procurementApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useRequisitions
} from './hooks/useRequisitions';
