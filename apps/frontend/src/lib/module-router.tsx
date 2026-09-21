import { ModuleInterface, ModuleRoute, EventBus } from '@ovds/core';
import React, { useState, useEffect, Suspense, type ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';

import { useModules } from '../context/ModuleContext';


interface ModuleRouterProps {
  modules?: ModuleInterface[];
  fallback?: ReactNode;
}

const COMPONENT_CACHE: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {};

function resolveComponent(componentPath: string): React.LazyExoticComponent<React.ComponentType<any>> | null {
  if (COMPONENT_CACHE[componentPath]) return COMPONENT_CACHE[componentPath];

  let mapped: string | null = null;

  if (componentPath.startsWith('@ovds/modules/hr/pages/')) {
    mapped = `../modules/hr/pages/${componentPath.split('/').pop()}`;
  } else if (componentPath.startsWith('@ovds/modules/ovds/pages/')) {
    mapped = `../modules/ovds/pages/${componentPath.split('/').pop()}`;
  } else if (componentPath.startsWith('@ovds/modules/maintaining-technology/pages/')) {
    mapped = `../modules/maintaining-technology/pages/${componentPath.split('/').pop()}`;
  }

  if (!mapped) return null;

  const lazy = React.lazy(() =>
    import(/* @vite-ignore */ mapped).then((mod) => ({
      default: mod.default || Object.values(mod).find((v: any) => typeof v === 'function') as any,
    }))
  );

  COMPONENT_CACHE[componentPath] = lazy;
  return lazy;
}

const ModuleRouteFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="text-sm text-slate-400">Loading module…</div>
  </div>
);

export const ModuleRouter: React.FC<ModuleRouterProps> = ({ modules: propModules, fallback }) => {
  const ctxModules = useModules();
  const [moduleRoutes, setModuleRoutes] = useState<ModuleRoute[]>([]);

  const modules = propModules ?? ctxModules.activeModules;

  useEffect(() => {
    const routes: ModuleRoute[] = [];
    for (const mod of modules) {
      try {
        const modRoutes = mod.routes();
        routes.push(...modRoutes);
      } catch (error) {
        console.error(`[ModuleRouter] Failed to resolve routes for module [${mod.info.name}]:`, error);
      }
    }
    setModuleRoutes(routes);
  }, [modules]);

  if (!moduleRoutes.length) {
    return fallback ?? null;
  }

  return (
    <Suspense fallback={<ModuleRouteFallback />}>
      <Routes>
        {moduleRoutes.map((route) => {
          const Component = resolveComponent(route.component);
          if (!Component) return null;
          return (
            <Route
              key={`${route.path}-${route.component}`}
              path={route.path}
              element={<Component />}
            />
          );
        })}
      </Routes>
    </Suspense>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useModuleEvents(modules: ModuleInterface[]) {
  const [events, setEvents] = useState<Array<{ name: string; payload: unknown; timestamp: Date }>>([]);

  useEffect(() => {
    const eventBus = EventBus.getInstance();
    const handlers: string[] = [];

    for (const mod of modules) {
      try {
        const register = mod.register(eventBus as any);
        if (register instanceof Promise) {
          register.catch(console.error);
        }
      } catch (error) {
        console.error(`[useModuleEvents] Failed to register module [${mod.info.name}]:`, error);
      }
    }

    const listenerId = eventBus.listen(
      '*',
      (event) => {
        setEvents((prev) => [...prev.slice(-99), event]);
      },
      { priority: 100 },
    );
    handlers.push(listenerId);

    return () => {
      for (const id of handlers) {
        eventBus.removeListener(id);
      }
    };
  }, [modules]);

  return events;
}
