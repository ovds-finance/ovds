/**
 * @ovds/features/appstore — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export { appstoreApi, moduleManagerApi } from "./services/appstoreApi";
export type { AppInstallation } from "./services/appstoreApi";

// ── Hooks ──────────────────────────────────────────────────────────────────────
export { useInstalledApps }   from "./hooks/useInstalledApps";
export { useAppInstallations } from "./hooks/useAppInstallations";
export type { UseAppInstallationsResult } from "./hooks/useAppInstallations";
