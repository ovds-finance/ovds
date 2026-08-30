import { useState, useEffect, useCallback } from "react";
import { appstoreApi, AppInstallation } from "../services/appstoreApi";

export interface UseAppInstallationsResult {
  data: AppInstallation[];
  loading: boolean;
  error: string | null;
  installedIds: Set<string>;
  updatesAvailable: AppInstallation[];
  refetch: () => void;
  install: (appId: string, version?: string) => Promise<AppInstallation | null>;
  uninstall: (appId: string) => Promise<boolean>;
  update: (appId: string, targetVersion?: string) => Promise<any>;
  configure: (appId: string, config: Record<string, unknown>) => Promise<any>;
}

export function useAppInstallations(params: {
  companyId?: string | null;
  enabled?: boolean;
} = {}): UseAppInstallationsResult {
  const { enabled = true, companyId } = params;

  const [data, setData]       = useState<AppInstallation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchInstalled = useCallback(async () => {
    if (!enabled || !companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await appstoreApi.installed(companyId);
      setData(Array.isArray(result) ? result : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load installed apps");
    } finally {
      setLoading(false);
    }
  }, [enabled, companyId]);

  useEffect(() => { fetchInstalled(); }, [fetchInstalled]);

  const install = useCallback(async (
    appId: string,
    version?: string,
  ): Promise<AppInstallation | null> => {
    try {
      const result = await appstoreApi.install(appId, companyId, version);
      await fetchInstalled(); // re-sync from server
      return result;
    } catch (e: any) {
      throw new Error(e?.message ?? "Install failed");
    }
  }, [companyId, fetchInstalled]);

  const uninstall = useCallback(async (appId: string): Promise<boolean> => {
    try {
      await appstoreApi.uninstall(appId, companyId);
      setData((prev) => prev.filter((i) => i.appId !== appId));
      return true;
    } catch (e: any) {
      throw new Error(e?.message ?? "Uninstall failed");
    }
  }, [companyId]);

  const update = useCallback(async (
    appId: string,
    targetVersion?: string,
  ) => {
    try {
      const result = await appstoreApi.update(appId, companyId, targetVersion);
      await fetchInstalled();
      return result;
    } catch (e: any) {
      throw new Error(e?.message ?? "Update failed");
    }
  }, [companyId, fetchInstalled]);

  const configure = useCallback(async (
    appId: string,
    config: Record<string, unknown>,
  ) => {
    try {
      const result = await appstoreApi.configure(appId, config, companyId);
      await fetchInstalled();
      return result;
    } catch (e: any) {
      throw new Error(e?.message ?? "Configure failed");
    }
  }, [companyId, fetchInstalled]);

  const installedIds = new Set(
    data.filter((i) => i.status === "ACTIVE").map((i) => i.appId),
  );

  const updatesAvailable = data.filter(
    (i) => i.status === "ACTIVE" && i.hasUpdate,
  );

  return {
    data,
    loading,
    error,
    installedIds,
    updatesAvailable,
    refetch: fetchInstalled,
    install,
    uninstall,
    update,
    configure,
  };
}
