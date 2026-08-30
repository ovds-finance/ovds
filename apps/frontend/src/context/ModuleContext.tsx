import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ModuleInterface, ModuleAppHealth } from '@ovds/core';

interface ModuleContextValue {
  modules: ModuleInterface[];
  activeModules: ModuleInterface[];
  registerModule: (module: ModuleInterface) => void;
  setActiveModules: (names: string[]) => void;
  getModule: (name: string) => ModuleInterface | undefined;
  isActive: (name: string) => boolean;
  healthResults: Record<string, ModuleAppHealth>;
  fetchHealth: () => Promise<void>;
  loading: boolean;
}

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined);

export function useModules(): ModuleContextValue {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error('useModules must be used within ModuleProvider');
  return ctx;
}

interface ModuleProviderProps {
  children: React.ReactNode;
  initialModules?: ModuleInterface[];
  apiBaseUrl?: string;
}

export const ModuleProvider: React.FC<ModuleProviderProps> = ({
  children,
  initialModules = [],
  apiBaseUrl,
}) => {
  const [modules, setModules] = useState<ModuleInterface[]>(initialModules);
  const [activeNames, setActiveNames] = useState<Set<string>>(
    () => new Set(initialModules.map((m) => m.info.name)),
  );
  const [healthResults, setHealthResults] = useState<Record<string, ModuleAppHealth>>({});
  const [loading, setLoading] = useState(false);

  const registerModule = useCallback((module: ModuleInterface) => {
    setModules((prev) => {
      if (prev.some((m) => m.info.name === module.info.name)) return prev;
      return [...prev, module];
    });
    setActiveNames((prev) => new Set(prev).add(module.info.name));
  }, []);

  const setActiveModules = useCallback((names: string[]) => {
    setActiveNames(new Set(names));
  }, []);

  const getModule = useCallback(
    (name: string) => modules.find((m) => m.info.name === name),
    [modules],
  );

  const isActive = useCallback(
    (name: string) => activeNames.has(name),
    [activeNames],
  );

  const fetchHealth = useCallback(async () => {
    if (!apiBaseUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/modules/health`);
      if (res.ok) {
        const data = await res.json();
        setHealthResults(data.healthResults ?? data);
      }
    } catch {
      // silently ignore health fetch errors
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (apiBaseUrl) {
      fetchHealth();
      const interval = setInterval(fetchHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [apiBaseUrl, fetchHealth]);

  const activeModules = modules.filter((m) => activeNames.has(m.info.name));

  return (
    <ModuleContext.Provider
      value={{
        modules,
        activeModules,
        registerModule,
        setActiveModules,
        getModule,
        isActive,
        healthResults,
        fetchHealth,
        loading,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
};
