/**
 * @ovds/features/appstore — public API barrel
 * ─────────────────────────────────────────────────────────────────────────────
 * Exports the download-pipeline API clients, hooks, and types consumed by
 * AppStore.tsx and ModularSettings.tsx.
 */

// ── API clients ────────────────────────────────────────────────────────────────
export { appstoreApi, moduleDownloadApi, moduleManagerApi } from './services/appstoreApi';
export type {
  AppCatalogItem,
  AppInstallation,
  ModuleDownloadJob,
  DownloadJobStatus,
} from './services/appstoreApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export { useAppInstallations }   from './hooks/useAppInstallations';
export { useInstalledApps }      from './hooks/useInstalledApps';
export type { UseAppInstallationsOptions, UseAppInstallationsResult } from './hooks/useAppInstallations';
export type { UseInstalledAppsResult } from './hooks/useInstalledApps';
