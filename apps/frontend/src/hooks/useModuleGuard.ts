import { useMemo } from 'react';

import { useModuleRegistry } from '../context/ExtensionSlotRegistry';

export interface ModuleGuardResult {
  /** True when the requested module is installed and enabled for the current company */
  allowed: boolean;
  /** Where to redirect when the module is inactive — defaults to '/forbidden' */
  redirectTo: string;
  /** Imperative check for any module key */
  canAccess: (moduleKey: string) => boolean;
}

export function useModuleGuard(moduleKey?: string): ModuleGuardResult {
  const { getActiveModules } = useModuleRegistry();

  const activeModules = useMemo(() => {
    try {
      return getActiveModules().map((m) => m.id);
    } catch {
      return [];
    }
  }, [getActiveModules]);

  const canAccess = (key: string): boolean => {
    return activeModules.includes(key);
  };

  const allowed = moduleKey ? canAccess(moduleKey) : true;

  return {
    allowed,
    redirectTo: '/forbidden',
    canAccess,
  };
}
