/**
 * @file VatNavBridgeMount.tsx
 *
 * Zero-render component that activates the VatNavBridge hook.
 * Mount once inside the authenticated shell so VAT module nav items
 * appear in the sidebar for all tenants that have modules active.
 *
 * Must be inside both <VatModuleProvider> and <ModuleRegistryProvider>.
 */
import { useVatNavBridge } from '../hooks/useVatNavBridge';

export function VatNavBridgeMount(): null {
  useVatNavBridge();
  return null;
}
