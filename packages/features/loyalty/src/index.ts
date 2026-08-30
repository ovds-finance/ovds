/**
 * @ovds/features/loyalty — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  loyaltyProgramsApi, loyaltyPointsApi, loyaltyTiersApi
} from './services/loyaltyApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useLoyaltyPrograms
} from './hooks/useLoyaltyPrograms';
