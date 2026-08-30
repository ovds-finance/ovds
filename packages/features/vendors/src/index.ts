/**
 * @ovds/features/vendors — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  vendorsApi, vendorCategoriesApi
} from './services/vendorsApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useVendors
} from './hooks/useVendors';
