export type { ModuleRegistration, BootstrapResult, BootstrapOptions } from './module-bootstrap';
/**
 * Register an array of module factories into ModuleDiscovery.
 * Called by the app-level bootstrap file, not by @ovds/core itself.
 */
export declare function registerModules(registrations: Array<{
    name: string;
    factory: () => any;
    enabled?: boolean;
}>): void;
/**
 * Boot all registered modules and return a result summary.
 */
export declare function bootstrapModules(options?: {
    enabledModules?: string[];
    disabledModules?: string[];
    runHealthChecks?: boolean;
}): Promise<import('./module-bootstrap').BootstrapResult>;
/**
 * Get a lightweight manifest of all registered modules
 * (for frontend menu generation, without actually instantiating full modules).
 */
export declare function getModuleManifest(): Array<{
    name: string;
    displayName: string;
    icon: string;
    description: string;
    version: string;
    category: string;
    installType: 'core' | 'app';
    subscriptionTiers?: string[];
    complianceStandards?: string[];
}>;
//# sourceMappingURL=module-auto-discovery.d.ts.map