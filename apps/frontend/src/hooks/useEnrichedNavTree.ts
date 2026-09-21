import type { IconType } from '@ovds/shared';
import { useMemo } from 'react';

import type { NavGroup, NavItem } from '../components/utils/navGroups';
import { useModuleRegistry } from '../context/ExtensionSlotRegistry';

import { useNavTree } from './useNavTree';

const MODULE_NAV_GROUP_KEY = 'modules';

export function useEnrichedNavTree() {
  const { groups, loading, error, refetch, allItems } = useNavTree();
  const { getActiveModules } = useModuleRegistry();

  const enrichedGroups = useMemo(() => {
    const moduleItems: NavItem[] = [];

    try {
      const activeModules = getActiveModules();
      for (const mod of activeModules) {
        if (mod.navigationPath) {
          moduleItems.push({
            to: mod.navigationPath,
            label: mod.title,
            icon: mod.icon as IconType,
            source: 'dynamic',
            pinnable: true,
            end: false,
            keywords: [mod.title, mod.id],
            priority: 100,
          });
        }
      }
    } catch {
      // ModuleRegistryProvider not mounted yet — skip module nav items
    }

    if (moduleItems.length === 0) {
      return groups;
    }

    const existingModuleGroup = groups.find(g => g.key === MODULE_NAV_GROUP_KEY);

    if (existingModuleGroup) {
      return groups.map(g => {
        if (g.key === MODULE_NAV_GROUP_KEY) {
          const merged = [...moduleItems];
          const existingTo = new Set(merged.map(i => i.to));
          for (const item of g.items) {
            if (!existingTo.has(item.to)) {
              merged.push(item);
            }
          }
          return { ...g, items: merged.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50)) };
        }
        return g;
      });
    }

    return [
      ...groups,
      {
        key: MODULE_NAV_GROUP_KEY,
        label: 'Modules',
        icon: 'LAYERS' as IconType,
        items: moduleItems.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50)),
        source: 'dynamic' as const,
      },
    ] as NavGroup[];
  }, [groups, getActiveModules]);

  const enrichedAllItems = useMemo(() => {
    return enrichedGroups.flatMap(g => g.items);
  }, [enrichedGroups]);

  return {
    groups: enrichedGroups,
    loading,
    error,
    refetch,
    allItems: enrichedAllItems,
  };
}
