/**
 * @ovds/features/iot — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  iotDevicesApi, iotNodesApi, iotAlertsApi
} from './services/iotApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useIotDevices
} from './hooks/useIotDevices';
