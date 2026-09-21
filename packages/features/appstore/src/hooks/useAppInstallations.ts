/**
 * useAppInstallations
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the full install / uninstall lifecycle and surfaces real-time
 * download-job progress to the React UI.
 *
 * What it does
 * ────────────
 *  • Fetches the list of installed apps from /api/appstore/installations
 *  • Exposes install() which:
 *      - SaaS  → calls moduleDownloadApi.activateSaaS(), waits for DONE
 *      - On-premise → calls moduleDownloadApi.downloadLocal(), then polls
 *        /api/modules/download-status/:jobId every POLL_INTERVAL_MS until
 *        the job reaches a terminal state (DONE | FAILED | CANCELLED)
 *  • Exposes uninstall() which calls /api/appstore/installations/:id DELETE
 *  • Returns `activeJobs` — a map of moduleAlias → ModuleDownloadJob for the
 *    UI to render progress bars
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  appstoreApi,
  moduleDownloadApi,
  type AppInstallation,
  type ModuleDownloadJob,
  type DownloadJobStatus,
} from '../services/appstoreApi';

// Poll every 2 seconds while a job is in-progress
const POLL_INTERVAL_MS = 2_000;

const TERMINAL: ReadonlySet<DownloadJobStatus> = new Set([
  'DONE',
  'FAILED',
  'CANCELLED',
]);

const isSaaSMode = (): boolean => {
  // Vite injects import.meta.env at bundle time; fall back to process.env for
  // Jest / tsc environments where import.meta is not available.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (globalThis as any).__VITE_ENV__ ?? (typeof process !== 'undefined' ? process.env : {});
    return (env['VITE_IS_SAAS'] ?? env['REACT_APP_IS_SAAS'] ?? '') === 'true';
  } catch {
    return false;
  }
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseAppInstallationsOptions {
  companyId?: string | null;
  enabled?: boolean;
}

export interface UseAppInstallationsResult {
  /** Full installation records from the server */
  installations: AppInstallation[];
  /** Set of appIds that are currently ACTIVE */
  installedIds: Set<string>;
  /** Installations with a latestVersion > installedVersion */
  updatesAvailable: AppInstallation[];
  loading: boolean;
  error: string | null;
  /** Live map of moduleAlias → download job (populated while installing) */
  activeJobs: Map<string, ModuleDownloadJob>;
  /** appIds currently going through the install pipeline */
  installing: Set<string>;
  refetch: () => void;
  /**
   * Install a module.
   * @param appId        Marketplace app/slug ID
   * @param moduleAlias  Module alias used for the download endpoint
   * @param apiKey       OVDS Marketplace API key (required for on-premise only)
   */
  install: (appId: string, moduleAlias: string, apiKey?: string) => Promise<void>;
  /** Uninstall (soft-disable) a module by its appId */
  uninstall: (appId: string) => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAppInstallations(
  options: UseAppInstallationsOptions = {},
): UseAppInstallationsResult {
  const { companyId, enabled = true } = options;

  const [installations, setInstallations] = useState<AppInstallation[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [activeJobs, setActiveJobs]       = useState<Map<string, ModuleDownloadJob>>(new Map());
  const [installing, setInstalling]       = useState<Set<string>>(new Set());

  // Keep refs so polling callbacks always see the latest values
  const activeJobsRef   = useRef(activeJobs);
  const pollingTimers   = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  activeJobsRef.current = activeJobs;

  // ── Fetch installed apps ─────────────────────────────────────────────────

  const fetchInstallations = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await appstoreApi.listInstallations('ACTIVE');
      setInstallations(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load installed apps');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchInstallations();
  }, [fetchInstallations, companyId]);

  // ── Job polling ──────────────────────────────────────────────────────────

  const pollJob = useCallback((alias: string, jobId: string) => {
    const controller = new AbortController();

    const tick = async () => {
      try {
        const job = await moduleDownloadApi.getJobStatus(jobId, controller.signal);

        setActiveJobs(prev => {
          const next = new Map(prev);
          next.set(alias, job);
          return next;
        });

        if (TERMINAL.has(job.status)) {
          // Clean up this polling loop
          pollingTimers.current.delete(alias);
          setInstalling(prev => {
            const next = new Set(prev);
            next.delete(alias);
            return next;
          });

          if (job.status === 'DONE') {
            // Refresh the installations list so the UI reflects the new install
            fetchInstallations();
          }
          return; // Stop polling
        }

        // Schedule next tick
        const timer = setTimeout(tick, POLL_INTERVAL_MS);
        pollingTimers.current.set(alias, timer);
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // Component unmounted — bail silently
        // Non-abort error: mark job failed in local state and stop polling
        setActiveJobs(prev => {
          const next = new Map(prev);
          const existing = next.get(alias);
          if (existing) {
            next.set(alias, {
              ...existing,
              status: 'FAILED',
              message: err?.message ?? 'Polling error',
            });
          }
          return next;
        });
        setInstalling(prev => {
          const next = new Set(prev);
          next.delete(alias);
          return next;
        });
        pollingTimers.current.delete(alias);
      }
    };

    // Kick off the first tick immediately
    tick();

    // Return cleanup so callers can abort
    return () => {
      controller.abort();
      const timer = pollingTimers.current.get(alias);
      if (timer) {
        clearTimeout(timer);
        pollingTimers.current.delete(alias);
      }
    };
  }, [fetchInstallations]);

  // Clear all polling timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of pollingTimers.current.values()) clearTimeout(timer);
      pollingTimers.current.clear();
    };
  }, []);

  // ── Install ──────────────────────────────────────────────────────────────

  const install = useCallback(async (
    appId: string,
    moduleAlias: string,
    apiKey?: string,
  ): Promise<void> => {
    if (installing.has(appId)) return; // Already in progress

    setInstalling(prev => new Set([...prev, appId]));
    setError(null);

    try {
      let job: ModuleDownloadJob;

      if (isSaaSMode()) {
        // ── SaaS path: logical activation only ──────────────────────────────
        job = await moduleDownloadApi.activateSaaS(moduleAlias);
      } else {
        // ── On-premise path: streaming ZIP download + extraction ─────────────
        if (!apiKey?.trim()) {
          throw new Error(
            'An OVDS Marketplace API key is required for on-premises module installation.',
          );
        }
        job = await moduleDownloadApi.downloadLocal(moduleAlias, apiKey);
      }

      // Seed the activeJobs map immediately so the UI shows a progress bar
      setActiveJobs(prev => {
        const next = new Map(prev);
        next.set(moduleAlias, job);
        return next;
      });

      if (TERMINAL.has(job.status)) {
        // Job completed synchronously (e.g. SaaS activation)
        setInstalling(prev => {
          const next = new Set(prev);
          next.delete(appId);
          return next;
        });
        if (job.status === 'DONE') await fetchInstallations();
        return;
      }

      // Job is async — start polling
      pollJob(moduleAlias, job.jobId);
    } catch (e: any) {
      setError(e?.message ?? 'Installation failed');
      setInstalling(prev => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
      throw e; // Re-throw so callers (toast handlers) can catch it
    }
  }, [installing, fetchInstallations, pollJob]);

  // ── Uninstall ────────────────────────────────────────────────────────────

  const uninstall = useCallback(async (appId: string): Promise<void> => {
    // Find the installation record to get its PK
    const installation = installations.find(i => i.appId === appId);
    if (!installation) throw new Error(`App ${appId} is not currently installed.`);

    try {
      await appstoreApi.uninstall(installation.id);
      setInstallations(prev => prev.filter(i => i.appId !== appId));
    } catch (e: any) {
      throw new Error(e?.message ?? 'Uninstall failed');
    }
  }, [installations]);

  // ── Derived state ────────────────────────────────────────────────────────

  const installedIds = new Set(
    installations.filter(i => i.status === 'ACTIVE').map(i => i.appId),
  );

  // A simple heuristic: if the server returns a PENDING_UPDATE status treat
  // as an update available. Richer logic can compare version strings later.
  const updatesAvailable = installations.filter(i => i.status === 'PENDING_UPDATE');

  return {
    installations,
    installedIds,
    updatesAvailable,
    loading,
    error,
    activeJobs,
    installing,
    refetch: fetchInstallations,
    install,
    uninstall,
  };
}
