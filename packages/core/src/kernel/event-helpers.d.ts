import type { Event, EventBusInterface } from '../events/event.interface';
export declare function dispatchEvent(eventBus: EventBusInterface | undefined, name: string, payload: unknown, source?: string): Promise<void>;
export declare function createEvent(name: string, payload: unknown, source?: string): Event;
//# sourceMappingURL=event-helpers.d.ts.map