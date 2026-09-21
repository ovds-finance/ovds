/**
 * useInstalledApps — lightweight hook for components that only need the set
 * of active app IDs (e.g. sidebar badge, settings toggle lists).
 *
 * Uses the appstoreApi.listInstallations endpoint directly without the full
 * download-job machinery of useAppInstallations.
 */
import { useState, useEffect, useCallback } from 'react';
import { appstoreApi, type AppInstallation } from '../services/appstoreApi';

export interface UseInstalledAppsResult {
  data: AppInstallation[];
  installedIds: Set<string>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInstalledApps(
  params: { enabled?: boolean } = {},
): UseInstalledAppsResult {
  const { enabled = true } = params;
  const [data, setData]       = useState<AppInstallation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await appstoreApi.listInstallations('ACTIVE');
      setData(Array.isArray(result) ? result : []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load installed apps');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const installedIds = new Set(data.map(i => i.appId));

  return { data, installedIds, loading, error, refetch: fetchData };
}
