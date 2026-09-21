/**
 * ModuleDiscovery — auto-discovers and registers module providers.
 *
 * Framework-agnostic; no NestJS imports.
 * Implements singleton pattern for global module registry.
 */
import type { ModuleInterface, ModuleInfo } from './module.interface';
export interface ModuleFactory {
    name: string;
    factory: () => ModuleInterface;
    enabled?: boolean;
}
export declare class ModuleDiscovery {
    private static instance;
    private readonly factories;
    private readonly modules;
    private constructor();
    static getInstance(): ModuleDiscovery;
    static resetInstance(): void;
    registerModule(name: string, factory: () => ModuleInterface, info?: Partial<ModuleInfo>): this;
    registerFactory(registration: ModuleFactory): this;
    hasModule(name: string): boolean;
    getModule(name: string): ModuleFactory | undefined;
    getModuleInfo(name: string): ModuleInfo | undefined;
    getAllModules(): ModuleFactory[];
    getEnabledModules(): ModuleFactory[];
    getDisabledModules(): ModuleFactory[];
    getModulesByCategory(category: string): ModuleFactory[];
    createAllModules(options?: {
        enabledModules?: string[];
        disabledModules?: string[];
    }): ModuleInterface[];
    createModule(name: string): ModuleInterface | undefined;
    removeModule(name: string): boolean;
    clear(): void;
    get count(): number;
    get enabledCount(): number;
}
//# sourceMappingURL=module-discovery.d.ts.map