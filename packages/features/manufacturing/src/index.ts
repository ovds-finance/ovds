/**
 * @ovds/features/manufacturing — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  manufacturingOrdersApi, bomApi, workCentresApi
} from './services/manufacturingApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useManufacturingOrders
} from './hooks/useManufacturingOrders';
