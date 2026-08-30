/**
 * @ovds/features/contracts — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  businessContractsApi, contractTemplatesApi
} from './services/contractsApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useContracts
} from './hooks/useContracts';
