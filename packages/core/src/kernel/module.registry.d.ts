import type { ModuleInterface, ModuleContainer, LoggerInterface } from './module.interface';
import type { EventBusInterface } from '../events/event.interface';
export interface RegisteredModule {
    module: ModuleInterface;
    enabled: boolean;
    loadedAt: Date;
    bootedAt?: Date;
    registeredAt?: Date;
    error?: string;
    installType: 'core' | 'app';
    subscriptionTiers?: string[];
}
export interface EntitlementContext {
    subscriptionTier: 'free' | 'starter' | 'professional' | 'enterprise';
    installedApps: string[];
}
export declare class ModuleRegistry {
    private static instance;
    private modules;
    private container?;
    private eventBus?;
    private logger?;
    private entitlementContext?;
    private constructor();
    static getInstance(): ModuleRegistry;
    static reset(): void;
    setContainer(container: ModuleContainer): void;
    setEventBus(eventBus: EventBusInterface): void;
    setLogger(logger: LoggerInterface): void;
    setEntitlementContext(context: EntitlementContext): void;
    register(module: ModuleInterface, enabled?: boolean): void;
    get(name: string): ModuleInterface | undefined;
    getAll(): ModuleInterface[];
    getEnabled(): ModuleInterface[];
    isEnabled(name: string): boolean;
    getRegisteredModule(name: string): RegisteredModule | undefined;
    getAllRegistered(): RegisteredModule[];
    isEntitled(name: string): boolean;
    getEntitledModules(): ModuleInterface[];
    bootAll(container?: ModuleContainer): Promise<void>;
    registerAll(eventBus?: EventBusInterface): Promise<void>;
    getDependencyOrder(): string[];
    has(name: string): boolean;
    clear(): void;
    private log;
}
//# sourceMappingURL=module.registry.d.ts.map