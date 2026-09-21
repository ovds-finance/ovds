import { EventBusInterface } from './event.interface';
export declare class EventBus implements EventBusInterface {
    private static instance;
    private dispatcher;
    private constructor();
    static getInstance(): EventBus;
    dispatch(event: import('./event.interface').Event): Promise<void>;
    listen(eventName: string, handler: (event: import('./event.interface').Event) => Promise<void> | void, options?: {
        priority?: number;
    }): string;
    removeListener(listenerId: string): void;
    removeListeners(eventName: string, source?: string): void;
    getListeners(eventName: string): import('./event.interface').EventListener[];
    getAllListeners(): Array<import('./event.interface').EventListener & {
        eventName: string;
    }>;
    getHistory(eventName?: string): import('./event.interface').Event[];
}
//# sourceMappingURL=event.bus.d.ts.map