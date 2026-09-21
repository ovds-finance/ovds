/**
 * UnifiedControlNode API — single-call dashboard for system administration.
 */
import { useQuery } from '@tanstack/react-query';

import api from './api';

/** Shape returned by GET /settings/unified-control-node. */
export interface UnifiedControlNodeDashboard {
  companyId: string;
  nodeStatus: Record<string, string>;
  health: { ok: boolean; details?: Record<string, unknown> };
  modules: Array<{ id: string; name: string; displayName: string; version: string; status: string; isEnabled?: boolean; [key: string]: unknown }>;
  lastSyncAt?: string | null;
  company?: {
    name?: string;
    tin?: string;
    status?: string;
    [key: string]: unknown;
  };
  users?: {
    total?: number;
    active?: number;
    roles?: Array<string>;
    [key: string]: unknown;
  };
  license?: {
    status?: string;
    registrationNumber?: string;
    businessStructure?: string;
    issuedAt?: string | null;
    expiresAt?: string | null;
    [key: string]: unknown;
  };
  tinMor?: {
    tin?: string;
    morStatus?: string;
    vatRegistered?: boolean;
    [key: string]: unknown;
  };
  deployment?: {
    mode?: string;
    offlineMode?: boolean;
    edgeNodeCount?: number;
    [key: string]: unknown;
  };
  system?: {
    environment?: string;
    version?: string;
    uptime?: string;
    nodeName?: string;
    [key: string]: unknown;
  };
  security?: {
    mfaEnforced?: boolean;
    mfaEnrollmentPct?: number;
    passwordPolicyMinLength?: number;
    sessionTimeoutMinutes?: number;
    bruteForceLockMinutes?: number;
    [key: string]: unknown;
  };
  /** Tax-module configuration flags. */
  tax?: {
    vatEnabled?: boolean;
    whtEnabled?: boolean;
    totEnabled?: boolean;
    bitEnabled?: boolean;
    pensionEnabled?: boolean;
    [key: string]: unknown;
  };
  /** Compliance / regulatory registration flags. */
  compliance?: {
    ercaRegistered?: boolean;
    morRegistered?: boolean;
    vatRegistered?: boolean;
    smeProfileEnabled?: boolean;
    multiCompanyEnabled?: boolean;
    ifrsEnabled?: boolean;
    [key: string]: unknown;
  };
  settings?: {
    currency?: string;
    fiscalYearStart?: string;
    language?: string;
    timezone?: string;
    [key: string]: unknown;
  };
  /** Legacy alias — prefer `tax` and `compliance` fields above. */
  taxConfig?: {
    vatEnabled?: boolean;
    whtEnabled?: boolean;
    totEnabled?: boolean;
    bitEnabled?: boolean;
    pensionEnabled?: boolean;
    ercaRegistered?: boolean;
    morRegistered?: boolean;
    vatRegistered?: boolean;
    smeProfileEnabled?: boolean;
    multiCompanyEnabled?: boolean;
    ifrsEnabled?: boolean;
    [key: string]: unknown;
  };
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
