import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { rbac, type AppRole, type Permission, useAuth } from '../rbac';
import { advancedAccessApi, type RolePermissionOverrideDTO } from '@ovds/features/settings';
import {
  ROLE_HIERARCHY,
  ROLE_PRESETS,
  PRESET_META,
  permissionCatalog,
  allPermissions,
  presetOverridesForRole,
  categorizePermission,
  type PermissionCategory,
} from '@ovds/shared';

import toast from 'react-hot-toast';
import {
  Save, RefreshCw, ChevronDown, ChevronRight, Check, X,
  Shield, Users, Settings, Filter, Search, Download,
  AlertCircle, Info, Gavel, BarChart3,
} from 'lucide-react';

const ALL_ROLES = Object.keys(ROLE_HIERARCHY) as AppRole[];

function useCompanyId(): string {
  try {
    return localStorage.getItem('selectedCompanyId') ?? '';
  } catch {
    return '';
  }
}

interface OverrideMatrixProps {
  overrides: RolePermissionOverrideDTO[];
}

const ACCESS_OPTIONS: { value: 'GRANT' | 'DENY'; label: string; color: string }[] = [
  { value: 'GRANT', label: 'Grant', color: 'text-emerald-500' },
  { value: 'DENY',  label: 'Deny',  color: 'text-rose-500' },
];

function OverrideMatrix({ overrides }: OverrideMatrixProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const companyId = useCompanyId();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const catalog = useMemo(() => permissionCatalog(), []);
  const allPerms = useMemo(() => allPermissions(), []);

  const filteredCatalog = useMemo(() => {
    if (!searchTerm.trim()) return catalog;
    const term = searchTerm.toLowerCase();
    return catalog.filter((domain) => {
      if (domain.key.toLowerCase().includes(term)) return true;
      return [...domain.permissions.view, ...domain.permissions.create, ...domain.permissions.edit, ...domain.permissions.delete, ...domain.permissions.approve]
        .some((p) => p.toLowerCase().includes(term));
    });
  }, [catalog, searchTerm]);

  useEffect(() => {
    if (expandedDomain === null && filteredCatalog.length > 0) {
      setExpandedDomain(filteredCatalog[0].key);
    }
  }, [expandedDomain, filteredCatalog]);

  const overrideMap = useMemo(() => {
    const map = new Map<string, 'GRANT' | 'DENY'>();
    for (const o of overrides) {
      map.set(`${o.role}:${o.permission}`, o.access);
    }
    return map;
  }, [overrides]);

  const getOverride = (role: string, permission: string): 'GRANT' | 'DENY' | null => {
    return overrideMap.get(`${role}:${permission}`) ?? null;
  };

  const setOverride = async (
    role: string,
    permission: string,
    access: 'GRANT' | 'DENY',
  ) => {
    const newAccess = getOverride(role, permission) === access ? null : access;
    const currentOverrides = [...overrides];
    if (newAccess === null) {
      const idx = currentOverrides.findIndex(
        (o) => o.role === role && o.permission === permission,
      );
      if (idx >= 0) currentOverrides.splice(idx, 1);
    } else {
      const idx = currentOverrides.findIndex(
        (o) => o.role === role && o.permission === permission,
      );
      if (idx >= 0) {
        currentOverrides[idx].access = newAccess;
      } else {
        currentOverrides.push({ role, permission, access: newAccess });
      }
    }

    try {
      await advancedAccessApi.saveOverrides(currentOverrides, companyId || undefined);
      queryClient.setQueryData(
        ['app-access', 'overrides', companyId],
        currentOverrides,
      );
      toast.success(
        t('advancedAccess.overrideSaved', { role, permission, count: currentOverrides.length }),
      );
    } catch (err: any) {
      toast.error(err?.message ?? t('advancedAccess.errors.saveFailed'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('advancedAccess.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border rounded-md w-full"
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {overrides.length} {t('advancedAccess.activeOverrides', { count: overrides.length })}
      </div>

      <div className="space-y-2">
        {filteredCatalog.map((domain) => (
          <div key={domain.key} className="border rounded-lg">
            <button
              onClick={() =>
                setExpandedDomain(expandedDomain === domain.key ? null : domain.key)
              }
              className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50"
            >
              <span className="font-medium">{domain.label}</span>
              {expandedDomain === domain.key ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {expandedDomain === domain.key && (
              <div className="p-3 border-t overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-2 pr-2">Permission</th>
                      {ALL_ROLES.map((role) => (
                        <th key={role} className="text-center py-2 px-1 min-w-[80px]">
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(
                      new Set([
                        ...domain.permissions.view,
                        ...domain.permissions.create,
                        ...domain.permissions.edit,
                        ...domain.permissions.delete,
                        ...domain.permissions.approve,
                      ]),
                    ).map((perm) => (
                      <tr key={perm} className="border-t">
                        <td className="py-1 pr-2 font-mono">{perm}</td>
                        {ALL_ROLES.map((role) => {
                          const current = getOverride(role as string, perm);
                          return (
                            <td key={role} className="text-center py-1">
                              {current && ACCESS_OPTIONS.find((o) => o.value === current) ? (
                                <button
                                  onClick={() =>
                                    setOverride(role as string, perm, current)
                                  }
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded ${
                                    current === 'GRANT'
                                      ? 'bg-emerald-500/10 text-emerald-500'
                                      : 'bg-rose-500/10 text-rose-500'
                                  }`}
                                  title={t('advancedAccess.clearOverride', { role, permission: perm })}
                                >
                                  {current === 'GRANT' ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                </button>
                              ) : (
                                <div className="inline-flex gap-1">
                                  <button
                                    onClick={() =>
                                      setOverride(role as string, perm, 'GRANT')
                                    }
                                    className="inline-flex items-center justify-center w-5 h-5 rounded text-emerald-500 hover:bg-emerald-500/10"
                                    title={t('advancedAccess.grant')}
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setOverride(role as string, perm, 'DENY')
                                    }
                                    className="inline-flex items-center justify-center w-5 h-5 rounded text-rose-500 hover:bg-rose-500/10"
                                    title={t('advancedAccess.deny')}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdvancedAccessControls() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const userRole = user?.role;

  const {
    data: overrides,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['app-access', 'overrides', companyId],
    queryFn: () => advancedAccessApi.getOverrides(companyId || undefined),
    enabled: !!companyId,
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: ({
      overrides,
      companyKey,
    }: {
      overrides: RolePermissionOverrideDTO[];
      companyKey?: string;
    }) => advancedAccessApi.saveOverrides(overrides, companyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-access', 'overrides', companyId] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t('advancedAccess.errors.saveFailed'));
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => advancedAccessApi.saveOverrides([], companyId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-access', 'overrides', companyId] });
      toast.success(t('advancedAccess.resetComplete'));
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t('advancedAccess.errors.resetFailed'));
    },
  });

  const handleReset = () => {
    if (!confirm(t('advancedAccess.resetConfirm'))) return;
    resetMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-8">
        <AlertCircle className="h-6 w-6 text-rose-500" />
        <span className="ml-2">{t('advancedAccess.errors.loadFailed')}</span>
      </div>
    );
  }

  const safeOverrides: RolePermissionOverrideDTO[] = (Array.isArray(overrides) ? overrides : []).filter(
    (o): o is RolePermissionOverrideDTO =>
      o !== null &&
      typeof o === 'object' &&
      typeof o.role === 'string' &&
      typeof o.permission === 'string' &&
      (o.access === 'GRANT' || o.access === 'DENY'),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('advancedAccess.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('advancedAccess.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-3 py-1 border rounded-md hover:bg-muted flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('advancedAccess.refresh')}
          </button>
          <button
            onClick={handleReset}
            disabled={safeOverrides.length === 0}
            className="px-3 py-1 border border-rose-500 text-rose-500 rounded-md hover:bg-rose-500/10 flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            {t('advancedAccess.reset')}
          </button>
        </div>
      </div>

      <OverrideMatrix overrides={safeOverrides} />
    </div>
  );
}

export default AdvancedAccessControls;
