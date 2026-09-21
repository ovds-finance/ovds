import type { NavTreeDto, NavGroupDto, NavItemDto, AdminMenuItemDto } from '@ovds/contracts/schemas';
import { useEffect, useMemo, useState, useCallback } from 'react';

import type { NavGroup, NavItem } from '../components/utils/navGroups';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';

const NAV_CACHE_KEY = 'nav_tree_cache';
const NAV_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedNavTree {
  data: NavTreeDto;
  cachedAt: number;
  role: string;
}

function readNavCache(requestedRole: string): CachedNavTree | null {
  try {
    const raw = localStorage.getItem(NAV_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedNavTree;
    if (Date.now() - parsed.cachedAt > NAV_CACHE_TTL) {
      localStorage.removeItem(NAV_CACHE_KEY);
      return null;
    }
    if (parsed.role !== requestedRole) {
      localStorage.removeItem(NAV_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeNavCache(data: NavTreeDto, role: string): void {
  try {
    localStorage.setItem(NAV_CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now(), role }));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

function mapBackendItemToFrontend(item: NavItemDto): NavItem {
  return {
    to: item.to,
    label: item.label,
    icon: item.icon,
    i18nKey: item.i18nKey,
    permission: item.permission as NavItem['permission'],
    isNew: item.isNew,
    badge: item.badge,
    pinnable: item.pinnable,
    end: item.end,
    keywords: item.keywords,
    priority: item.priority,
    source: item.source,
  };
}

function mapBackendGroupToFrontend(g: NavGroupDto): NavGroup {
  return {
    key: g.key,
    label: g.label,
    i18nKey: g.i18nKey,
    icon: g.icon,
    permission: g.permission as NavGroup['permission'],
    flat: g.flat,
    to: g.to,
    sectionKey: g.sectionKey,
    items: (g.items ?? []).map(mapBackendItemToFrontend),
    source: g.source,
  };
}

export function useNavTree() {
  const { user } = useAuth();
  const [backendTree, setBackendTree] = useState<NavTreeDto | null>(null);
  const [adminItems, setAdminItems] = useState<AdminMenuItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const role = (user?.role ?? 'EMPLOYEE') as string;

  const fetchNavTree = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const [groupsRes, adminRes] = await Promise.allSettled([
        api.get('/nav/groups', {
          params: { companyId: localStorage.getItem('selectedCompanyId') || undefined },
          headers: { 'x-background': '1' },
        }),
        api.get('/admin-menu-items?isActive=true', {
          headers: { 'x-background': '1' },
        }),
      ]);

      if (groupsRes.status === 'fulfilled') {
        const tree = groupsRes.value.data?.data ?? groupsRes.value.data;
        if (tree) {
          setBackendTree(tree);
          writeNavCache(tree, role);
        }
      }

      if (adminRes.status === 'fulfilled') {
        const items = adminRes.value.data?.data ?? adminRes.value.data;
        setAdminItems(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch nav tree'));
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    const cached = readNavCache(role);
    if (cached && cached.data.groups) {
      setBackendTree(cached.data);
      setLoading(false);
    }
    fetchNavTree();
  }, [fetchNavTree, role]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchNavTree, NAV_CACHE_TTL);
    const onSessionExpired = () => clearInterval(interval);
    window.addEventListener('ovds:session-expired', onSessionExpired);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ovds:session-expired', onSessionExpired);
    };
  }, [user, fetchNavTree]);

  const mergedGroups = useMemo(() => {
    if (!backendTree?.groups) return [];
    const groups = backendTree.groups.map(mapBackendGroupToFrontend);

    // Overlay admin-only items not already in the tree
    for (const adminItem of adminItems) {
      if (!adminItem.parentKey) continue;
      const target = groups.find(g => g.key === adminItem.parentKey);
      if (target) {
        target.items.push({
          to: adminItem.to ?? adminItem.path,
          label: adminItem.label,
          icon: adminItem.icon ?? 'EXTERNAL_LINK',
          priority: adminItem.order,
          isNew: true,
          source: 'admin',
          permission: undefined,
          pinnable: false,
          end: false,
          keywords: [],
        });
        target.items.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
      }
    }

    return groups;
  }, [backendTree, adminItems]);

  const allItems = useMemo(() => mergedGroups.flatMap(g => g.items), [mergedGroups]);

  return {
    groups: mergedGroups,
    loading,
    error,
    refetch: fetchNavTree,
    allItems,
  };
}
