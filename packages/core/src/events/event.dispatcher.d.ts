import { Event, EventListener, EventBusInterface } from './event.interface';
export declare class EventDispatcher implements EventBusInterface {
    private listeners;
    private history;
    private maxHistory;
    dispatch(event: Event): Promise<void>;
    listen(eventName: string, handler: (event: Event) => Promise<void> | void, options?: {
        priority?: number;
    }): string;
    removeListener(listenerId: string): void;
    removeListeners(eventName: string, source?: string): void;
    getListeners(eventName: string): EventListener[];
    getAllListeners(): Array<EventListener & {
        eventName: string;
    }>;
    getHistory(eventName?: string): Event[];
}
//# sourceMappingURL=event.dispatcher.d.ts.map