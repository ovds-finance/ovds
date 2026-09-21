import { DoubleEntryPluginConfig } from '@ovds/features/double-entry';
import { VatPluginConfig } from '@ovds/features/tax';
import React, { useMemo } from 'react';

import { useActiveModules } from '../hooks/useActiveModules';

import { useBusiness } from './businessContext';
import { ModuleRegistryProvider, useModuleRegistry } from './ExtensionSlotRegistry';

function DoubleEntryPlugin() {
  const { registerModule } = useModuleRegistry();
  React.useEffect(() => {
    registerModule(DoubleEntryPluginConfig);
  }, [registerModule]);
  return null;
}

function VatPlugin() {
  const { registerModule } = useModuleRegistry();
  React.useEffect(() => {
    registerModule(VatPluginConfig);
  }, [registerModule]);
  return null;
}

export const AppModuleRegistry: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { selectedCompanyId } = useBusiness();
  const { data: rawActiveModules } = useActiveModules(selectedCompanyId ?? undefined);
  // Memoize so the array reference is stable when the query returns undefined,
  // preventing ModuleRegistryProvider from re-rendering on every cycle.
  const activeModules = useMemo(() => rawActiveModules ?? [], [rawActiveModules]);

  return (
    <ModuleRegistryProvider activeModulesFromBackend={activeModules}>
      <DoubleEntryPlugin />
      <VatPlugin />
      {children}
    </ModuleRegistryProvider>
  );
};
