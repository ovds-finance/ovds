/**
 * @ovds/features/fiscal — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  fiscalDevicesApi, fiscalReceiptsApi, efyApi
} from './services/fiscalApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useFiscalDevices
} from './hooks/useFiscalDevices';
