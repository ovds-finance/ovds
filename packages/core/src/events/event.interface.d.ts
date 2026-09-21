export interface Event {
    name: string;
    payload: unknown;
    timestamp: Date;
    source: string;
    payloadVersion?: string;
}
export interface EventListener {
    eventName: string;
    handler: (event: Event) => Promise<void> | void;
    priority?: number;
    id?: string;
}
export interface EventBusInterface {
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
//# sourceMappingURL=event.interface.d.ts.map