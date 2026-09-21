import type { Event, EventListener } from './events/event.interface';
export type ModuleInstallType = 'core' | 'app';
export interface ModuleAppOptions {
    name: string;
    displayName: string;
    version?: string;
    description?: string;
    author?: string;
    category?: string;
    icon?: string;
    dependsOn?: string[];
    autoDiscover?: boolean;
    singleton?: boolean;
    installType?: ModuleInstallType;
    subscriptionTiers?: string[];
    complianceStandards?: string[];
    dataFlow?: {
        emitsTo?: string[];
        receivesFrom?: string[];
    };
}
export interface ModuleAppContainer {
    prisma: unknown;
    eventBus: unknown;
    settings: unknown;
    logger: unknown;
    get<T>(token: string): T | undefined;
    has(token: string): boolean;
}
export interface ModuleAppEventBus {
    dispatch(event: Event): Promise<void>;
    listen(eventName: string, handler: (event: Event) => Promise<void> | void, options?: {
        priority?: number;
    }): string;
    removeListener(listenerId: string): void;
    removeListeners(eventName: string, source?: string): void;
    getListeners(eventName: string): EventListener[];
    getHistory(eventName?: string): Event[];
}
export interface ModuleAppLogger {
    log(message: string, context?: string): void;
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string): void;
    debug(message: string, context?: string): void;
}
export interface ModuleAppRoute {
    path: string;
    component: string;
    permissions?: string[];
    meta?: Record<string, unknown>;
}
export interface ModuleAppMenuItem {
    key: string;
    label: string;
    path?: string;
    icon?: string;
    children?: ModuleAppMenuItem[];
    requiredPermissions?: string[];
    order: number;
    group?: string;
    badge?: number | string;
    isExternal?: boolean;
    onClick?: () => void;
}
export interface ModuleAppSetting {
    key: string;
    label: string;
    type: 'text' | 'boolean' | 'select' | 'number' | 'json';
    defaultValue: unknown;
    options?: {
        label: string;
        value: string;
    }[];
    group?: string;
}
export interface ModuleAppPermission {
    key: string;
    label: string;
    description: string;
    roles?: string[];
}
export interface ModuleAppInfo {
    name: string;
    displayName: string;
    version: string;
    description: string;
    author: string;
    category: string;
    icon: string;
    dependsOn?: string[];
    installType: ModuleInstallType;
    subscriptionTiers?: string[];
    complianceStandards?: string[];
    dataFlow?: {
        emitsTo?: string[];
        receivesFrom?: string[];
    };
}
export interface ModuleAppHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
    checkedAt: Date;
}
export interface ModuleAppInterface {
    info: ModuleAppInfo;
    register(eventBus: ModuleAppEventBus): void | Promise<void>;
    boot(container: ModuleAppContainer): void | Promise<void>;
    routes(): ModuleAppRoute[];
    menus(): ModuleAppMenuItem[];
    settings(): ModuleAppSetting[];
    permissions(): ModuleAppPermission[];
    migrations?: string[];
    health?(): Promise<ModuleAppHealth>;
}
export declare abstract class ModuleApp implements ModuleAppInterface {
    readonly info: ModuleAppInfo;
    readonly category: string;
    readonly icon: string;
    readonly dependsOn: string[];
    readonly version: string;
    readonly description: string;
    readonly author: string;
    readonly singleton: boolean;
    readonly installType: ModuleInstallType;
    readonly subscriptionTiers: string[];
    readonly complianceStandards: string[];
    readonly dataFlow: {
        emitsTo?: string[];
        receivesFrom?: string[];
    };
    protected container?: ModuleAppContainer;
    protected eventBus?: ModuleAppEventBus;
    protected logger: ModuleAppLogger;
    private _enabled;
    private _booted;
    private _registered;
    constructor(options: ModuleAppOptions);
    abstract register(eventBus: ModuleAppEventBus): void | Promise<void>;
    abstract boot(container: ModuleAppContainer): void | Promise<void>;
    setContainer(container: ModuleAppContainer): void;
    setEventBus(eventBus: ModuleAppEventBus): void;
    get isEnabled(): boolean;
    set enabled(value: boolean);
    get isBooted(): boolean;
    get isRegistered(): boolean;
    markRegistered(): void;
    markBooted(): void;
    routes(): ModuleAppRoute[];
    menus(): ModuleAppMenuItem[];
    settings(): ModuleAppSetting[];
    permissions(): ModuleAppPermission[];
    migrations?: string[];
    health?(): Promise<ModuleAppHealth>;
}
//# sourceMappingURL=module-app.d.ts.map