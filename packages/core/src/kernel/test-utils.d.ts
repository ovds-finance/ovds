import type { ModuleAppContainer, ModuleAppEventBus } from '../module-app';
import type { LoggerInterface } from './module.interface';
import type { Event, EventListener } from '../events/event.interface';
export interface MockLogger extends LoggerInterface {
    logs: Array<{
        message: string;
        context?: string;
    }>;
}
export declare function createMockLogger(): MockLogger;
export interface MockEventBus extends ModuleAppEventBus {
    dispatchedEvents: Event[];
    listeners: Map<string, EventListener[]>;
}
export declare function createMockEventBus(): MockEventBus;
export interface MockContainer extends ModuleAppContainer {
    mockModules: Map<string, unknown>;
    mockData: Map<string, unknown[]>;
}
export declare function createMockContainer(): MockContainer;
//# sourceMappingURL=test-utils.d.ts.map