/**
 * @file useVatNavBridge.ts
 *
 * VatNavBridge — feeds active VAT country module menus() into the
 * ModuleRegistryProvider (ExtensionSlotRegistry) so they appear in
 * the sidebar via useEnrichedNavTree().
 *
 * How it works
 * ────────────
 * 1. Reads the tenant's active VAT modules from VatModuleContext.
 * 2. For each active module, synthesises a ModuleUIRegistration whose
 *    `navItems` mirrors the module's top-level menu children.
 * 3. Calls registerModule() on the ExtensionSlotRegistry — idempotent,
 *    so repeated calls on re-renders are safe.
 *
 * Mount this hook once inside a component that lives inside both
 * VatModuleProvider and ModuleRegistryProvider.  The natural place is
 * the AuthenticatedShell or a thin bridge component rendered just
 * inside Layout.
 *
 * Usage:
 *   // Inside AuthenticatedShell or any always-mounted authenticated component:
 *   import { useVatNavBridge } from '../hooks/useVatNavBridge';
 *   function VatNavBridgeMount() { useVatNavBridge(); return null; }
 */

import type { IconType } from '@ovds/shared';
import { useEffect } from 'react';

import { useModuleRegistry } from '../context/ExtensionSlotRegistry';
import type { ModuleUIRegistration } from '../context/ExtensionSlotRegistry';
import { useVatModules }     from '../context/VatModuleContext';

// ─── Icon mapping ─────────────────────────────────────────────────────────────
// VatModule.menus() returns Lucide icon names (e.g. 'FileText').
// ModuleRegistryProvider expects OVDS IconType keys (e.g. 'FILE_TEXT').
// This map covers the icons used by ET/AE modules — extend as needed.
const LUCIDE_TO_ICON_TYPE: Record<string, IconType> = {
  FileText:    'FILE_TEXT',
  Flag:        'FILE_TEXT',     // closest available for country flags
  Receipt:     'FILE_TEXT',
  Calculator:  'FILE_TEXT',
  BarChart:    'CHART',
  Settings:    'SETTINGS',
  Shield:      'SHIELD',
  Globe:       'GLOBE',
};

function toIconType(lucideName: string): IconType {
  return LUCIDE_TO_ICON_TYPE[lucideName] ?? 'FILE_TEXT';
}

// ─── Bridge country code to a unique module id ────────────────────────────────
function vatModuleId(countryCode: string): string {
  return `vat-module-${countryCode.toLowerCase()}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVatNavBridge(): void {
  const { tenantModules } = useVatModules();

  // ModuleRegistryProvider may not always be mounted (e.g. public pages).
  // Swallow the error so the hook is safe to call anywhere.
  let registerModule: ((m: ModuleUIRegistration) => void) | null = null;
  try {
     
    const registry = useModuleRegistry();
    registerModule = registry.registerModule;
  } catch {
    // Not inside ModuleRegistryProvider — skip silently
    return;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!registerModule || tenantModules.length === 0) return;

    for (const mod of tenantModules) {
      const code = mod.countryCode.toUpperCase();

      // Build navItems from the module's top-level nav structure.
      // We mirror what EtVatModule.menus() / AeVatModule.menus() declare.
      const navItems: ModuleUIRegistration['navItems'] = [
        {
          id:    `${vatModuleId(code)}-dashboard`,
          label: `${mod.countryName} VAT`,
          path:  `/tax/vat/${code.toLowerCase()}`,
          icon:  'FILE_TEXT',
          order: 200 + tenantModules.indexOf(mod),
        },
        {
          id:    `${vatModuleId(code)}-filing`,
          label: 'VAT Return',
          path:  `/tax/vat/${code.toLowerCase()}/filing`,
          icon:  'FILE_TEXT',
          requiredModule: vatModuleId(code),
          order: 201 + tenantModules.indexOf(mod),
        },
        {
          id:    `${vatModuleId(code)}-store`,
          label: 'VAT Module Store',
          path:  '/tax/vat/store',
          icon:  'FILE_TEXT',
          order: 299,
        },
      ];

      const registration: ModuleUIRegistration = {
        id:             vatModuleId(code),
        title:          mod.displayName,
        navigationPath: `/tax/vat/${code.toLowerCase()}`,
        icon:           toIconType('FileText'),
        dashboardWidgets: [],
        navItems,
      };

      registerModule(registration);
    }
  // Re-run only when the set of active module codes changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantModules.map(m => m.countryCode).join(',')]);
}
