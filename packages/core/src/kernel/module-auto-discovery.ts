/**
 * ModuleAutoDiscovery — lightweight registry helpers for the module kernel.
 *
 * This file intentionally does NOT import any domain module packages
 * (@ovds/hr, @ovds/ovds, @ovds/projects, @ovds/settings, etc.) to keep the
 * @ovds/core build graph acyclic.
 *
 * Domain module registration belongs in the consuming app:
 *   - NestJS backend: apps/backend/src/core/module-registrations.ts
 *   - React frontend: apps/frontend/src/lib/module-registrations.ts
 */
import { ModuleDiscovery } from './module-discovery';

// Re-export bootstrap types so callers can import them from the barrel
export type { ModuleRegistration, BootstrapResult, BootstrapOptions } from './module-bootstrap';

/**
 * Register an array of module factories into ModuleDiscovery.
 * Called by the app-level bootstrap file, not by @ovds/core itself.
 */
export function registerModules(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registrations: Array<{ name: string; factory: () => any; enabled?: boolean }>,
): void {
  const discovery = ModuleDiscovery.getInstance();
  for (const { name, factory } of registrations) {
    discovery.registerModule(name, factory);
  }
}

/**
 * Boot all registered modules and return a result summary.
 */
export async function bootstrapModules(options?: {
  enabledModules?: string[];
  disabledModules?: string[];
  runHealthChecks?: boolean;
}): Promise<import('./module-bootstrap').BootstrapResult> {
  const discovery = ModuleDiscovery.getInstance();
  const modules = discovery.createAllModules(options);
  const result: import('./module-bootstrap').BootstrapResult = {
    modules,
    names: modules.map((m: { info: { name: string } }) => m.info.name),
    errors: [],
  };

  if (options?.runHealthChecks) {
    result.healthResults = [];
    for (const module of modules) {
      if (typeof module.health === 'function') {
        try {
          const health = await module.health();
          result.healthResults!.push({ name: module.info.name, ...health });
        } catch (healthError) {
          const message = healthError instanceof Error ? healthError.message : String(healthError);
          result.healthResults!.push({ name: module.info.name, status: 'unhealthy', message: `Health check failed: ${message}`, checkedAt: new Date() });
        }
      }
    }
  }

  return result;
}

/**
 * Get a lightweight manifest of all registered modules
 * (for frontend menu generation, without actually instantiating full modules).
 */
export function getModuleManifest(): Array<{
  name: string;
  displayName: string;
  icon: string;
  description: string;
  version: string;
  category: string;
  installType: 'core' | 'app';
  subscriptionTiers?: string[];
  complianceStandards?: string[];
}> {
  const discovery = ModuleDiscovery.getInstance();
  return discovery.createAllModules().map((m: any) => ({
    name: m.info.name,
    displayName: m.info.displayName ?? m.info.name,
    icon: m.info.icon ?? 'Package',
    description: m.info.description ?? '',
    version: m.info.version ?? '1.0.0',
    category: m.info.category ?? 'general',
    installType: m.info.installType ?? 'app',
    subscriptionTiers: m.info.subscriptionTiers,
    complianceStandards: m.info.complianceStandards,
  }));
}
