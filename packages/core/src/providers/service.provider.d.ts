import type { ModuleContainer, LoggerInterface } from '../kernel/module.interface';
export interface CoreServiceProvider {
    register(container: ModuleContainer): void | Promise<void>;
    boot?(container: ModuleContainer): void | Promise<void>;
}
export interface ServiceProvider {
    register(container: ModuleContainer): void | Promise<void>;
    boot?(container: ModuleContainer): void | Promise<void>;
}
export declare class ServiceProviderManager {
    private static instance;
    private providers;
    private container?;
    private logger?;
    private constructor();
    static getInstance(): ServiceProviderManager;
    static reset(): void;
    setContainer(container: ModuleContainer): void;
    setLogger(logger: LoggerInterface): void;
    register(name: string, provider: CoreServiceProvider): void;
    registerAll(): Promise<void>;
    bootAll(): Promise<void>;
    has(name: string): boolean;
    get(name: string): CoreServiceProvider | undefined;
    clear(): void;
}
//# sourceMappingURL=service.provider.d.ts.map