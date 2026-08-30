/**
 * @ovds/features/device-control — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  deviceControlApi, biometricApi, fiscalDeviceApi
} from './services/deviceControlApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useDeviceControl
} from './hooks/useDeviceControl';
