/**
 * UnifiedControlNode API — single-call dashboard for system administration.
 */
import api from './api';
import { useQuery } from '@tanstack/react-query';

/** Shape returned by GET /settings/unified-control-node. */
export interface UnifiedControlNodeDashboard {
  companyId: string;
  nodeStatus: Record<string, string>;
  health: { ok: boolean; details?: Record<string, unknown> };
  modules: Array<{ id: string; status: string }>;
  lastSyncAt?: string | null;
  [key: string]: unknown;
}

function unwrap<T>(res: { data: T | { data: T } }): T {
  const d = res.data;
  if (d && typeof d === 'object' && 'data' in (d as any)) return (d as any).data as T;
  return d as T;
}

export function useUnifiedControlNode(companyId: string) {
  return useQuery<UnifiedControlNodeDashboard>({
    queryKey: ['settings', 'unified-control-node', companyId],
    queryFn: () => api.get(`/settings/unified-control-node?companyId=${companyId}`).then(unwrap),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !!companyId,
  });
}

export const unifiedControlApi = {
  getDashboard: (companyId: string): Promise<UnifiedControlNodeDashboard> =>
    api.get(`/settings/unified-control-node?companyId=${companyId}`).then(unwrap),
};

export default unifiedControlApi;
