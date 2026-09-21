import type { IconType } from '@ovds/shared';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  ComponentType,
} from 'react';

/**
 * ExtensionSlotRegistry — Polymorphic React Plugin Engine (Akaunting-style)
 *
 * Allows self-contained frontend feature libraries within the Nx monorepo
 * to dynamically register UI components (dashboard widgets, settings panels,
 * nav items) into designated "slots" in the core shell layout.
 *
 * Modules register their UI at runtime based on active module flags
 * from the backend feature-flag map (`activeModulesFromBackend`).
 */

export interface ModuleUIRegistration {
  id: string;
  title: string;
  navigationPath: string;
  icon: IconType;
  dashboardWidgets: Array<{
    id: string;
    component: ComponentType<any>;
    gridSize: string;
  }>;
  settingsPanel?: ComponentType<any>;
  navItems?: Array<{
    id: string;
    label: string;
    path: string;
    icon?: IconType;
    requiredModule?: string;
    order?: number;
  }>;
}

interface ModuleRegistryContextType {
  registeredModules: Map<string, ModuleUIRegistration>;
  activeModules: string[];
  registerModule: (module: ModuleUIRegistration) => void;
  getActiveModules: () => ModuleUIRegistration[];
  getNavigationItems: () => ModuleUIRegistration['navItems'];
  renderSlot: (slotId: string, passThroughProps?: any) => React.ReactElement | null;
}

const ModuleRegistryContext = createContext<ModuleRegistryContextType | undefined>(undefined);

export interface ModuleRegistryProviderProps {
  children: ReactNode;
  activeModulesFromBackend: string[];
}

export const ModuleRegistryProvider = ({
  children,
  activeModulesFromBackend,
}: ModuleRegistryProviderProps) => {
  const [registeredModules, setRegisteredModules] = useState<Map<string, ModuleUIRegistration>>(
    new Map(),
  );

  const [registeredSlots, setRegisteredSlots] = useState<
    Record<string, ComponentType<any>[]>
  >({});

  const [registeredNavItems, setRegisteredNavItems] = useState<
    NonNullable<ModuleUIRegistration['navItems']>
  >([]);

  const registerModule = useCallback((module: ModuleUIRegistration) => {
    setRegisteredModules((prev) => {
      if (prev.has(module.id)) return prev;
      const next = new Map(prev);
      next.set(module.id, module);
      return next;
    });

    if (module.dashboardWidgets) {
      module.dashboardWidgets.forEach((widget) => {
        setRegisteredSlots((prev) => {
          const existing = prev['dashboard.metrics'] || [];
          if (existing.includes(widget.component)) return prev;
          return {
            ...prev,
            'dashboard.metrics': [...existing, widget.component],
          };
        });
      });
    }

    if (module.settingsPanel) {
      const panel = module.settingsPanel;
      const slotKey = `settings.panels.${module.id}`;
      setRegisteredSlots((prev) => {
        const existing = prev[slotKey] || [];
        if (existing.includes(panel)) return prev;
        return { ...prev, [slotKey]: [...existing, panel] };
      });
    }

    if (module.navItems && module.navItems.length > 0) {
      setRegisteredNavItems((prev) => {
        const existingIds = new Set(prev.map(n => n.id));
        const newItems = module.navItems!.filter(n => !existingIds.has(n.id));
        return [...prev, ...newItems];
      });
    }
  }, []); // stable — only uses setState setters which never change

  const getActiveModules = () => {
    return Array.from(registeredModules.values()).filter((m) =>
      activeModulesFromBackend.includes(m.id),
    );
  };

  const getNavigationItems = () => {
    return registeredNavItems.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  };

  const renderSlot = (slotId: string, passThroughProps?: any) => {
    const Components = registeredSlots[slotId] || [];
    if (Components.length === 0) return null;

    return (
      <>
        {Components.map((Component, idx) => (
          <Component key={`${slotId}-${idx}`} {...passThroughProps} />
        ))}
      </>
    );
  };

  const value: ModuleRegistryContextType = {
    registeredModules,
    activeModules: activeModulesFromBackend,
    registerModule,
    getActiveModules,
    getNavigationItems,
    renderSlot,
  };

  return (
    <ModuleRegistryContext.Provider value={value}>
      {children}
    </ModuleRegistryContext.Provider>
  );
};

/**
 * Hook for modules to register themselves with the core shell.
 * Call this in your module's root component or entry point.
 */
export const useModuleRegistry = (): ModuleRegistryContextType => {
  const context = useContext(ModuleRegistryContext);
  if (!context) {
    throw new Error('useModuleRegistry must be used within a ModuleRegistryProvider.');
  }
  return context;
};

/**
 * Render all components registered for a given slot.
 *
 * @example
 *   <ExtensionSlotRenderer slotId="dashboard.metrics" />
 */
export const ExtensionSlotRenderer = ({
  slotId,
  passThroughProps,
}: {
  slotId: string;
  passThroughProps?: any;
}): React.ReactElement | null => {
  const { renderSlot } = useModuleRegistry();
  return renderSlot(slotId, passThroughProps);
};
