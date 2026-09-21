import type { ModuleInterface } from './module.interface';
import type { EventBusInterface } from '../events/event.interface';
import type { LoggerInterface } from './module.interface';
export interface ModuleRegistration {
    name: string;
    factory: () => ModuleInterface;
    enabled?: boolean;
}
export interface BootstrapOptions {
    enabledModules?: string[];
    disabledModules?: string[];
    eventBus?: EventBusInterface;
    container?: Record<string, unknown>;
    runHealthChecks?: boolean;
}
export interface ModuleBootstrapError {
    name: string;
    message: string;
    phase: 'instantiation' | 'register' | 'boot' | 'health';
}
export interface BootstrapResult {
    modules: ModuleInterface[];
    names: string[];
    errors: ModuleBootstrapError[];
    healthResults?: Array<{
        name: string;
        status: 'healthy' | 'degraded' | 'unhealthy';
        message?: string;
        checkedAt: Date;
    }>;
}
export declare class ModuleBootstrap {
    private static instance;
    private registrations;
    private logger?;
    private constructor();
    static getInstance(): ModuleBootstrap;
    static reset(): void;
    setLogger(logger: LoggerInterface): void;
    registerModule(name: string, factory: () => ModuleInterface, enabled?: boolean): void;
    registerAll(modules: Array<{
        name: string;
        factory: () => ModuleInterface;
        enabled?: boolean;
    }>): void;
    getRegisteredNames(): string[];
    resolveOptions(options?: BootstrapOptions): {
        names: string[];
        enabledMap: Map<string, boolean>;
    };
    bootstrap(options?: BootstrapOptions): Promise<BootstrapResult>;
    private log;
}
//# sourceMappingURL=module-bootstrap.d.ts.map