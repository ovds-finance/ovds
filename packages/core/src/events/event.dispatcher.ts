import { Event, EventListener, EventBusInterface } from './event.interface';

export class EventDispatcher implements EventBusInterface {
  private listeners: Map<string, EventListener[]> = new Map();
  private history: Event[] = [];
  private maxHistory = 1000;

  async dispatch(event: Event): Promise<void> {
    const fullEvent: Event = {
      ...event,
      timestamp: event.timestamp ?? new Date(),
    };

    this.history.push(fullEvent);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    const handlers = this.listeners.get(event.name) ?? [];
    const sorted = handlers
      .slice()
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

    for (const listener of sorted) {
      try {
        await listener.handler(fullEvent);
      } catch (error) {
        console.error(
          `[EventDispatcher] Error in listener [${listener.id ?? 'unknown'}] for event [${event.name}]:`,
          error,
        );
      }
    }
  }

  listen(
    eventName: string,
    handler: (event: Event) => Promise<void> | void,
    options?: { priority?: number },
  ): string {
    const id = `${eventName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const listener: EventListener = {
      eventName,
      handler,
      priority: options?.priority ?? 100,
      id,
    };

    const existing = this.listeners.get(eventName) ?? [];
    existing.push(listener);
    this.listeners.set(eventName, existing);

    return id;
  }

  removeListener(listenerId: string): void {
    for (const [eventName, handlers] of this.listeners) {
      const filtered = handlers.filter((h) => h.id !== listenerId);
      if (filtered.length === 0) {
        this.listeners.delete(eventName);
      } else {
        this.listeners.set(eventName, filtered);
      }
    }
  }

  removeListeners(eventName: string, source?: string): void {
    if (!source) {
      this.listeners.delete(eventName);
      return;
    }
    const existing = this.listeners.get(eventName) ?? [];
    const filtered = existing.filter((h) => !h.id?.startsWith(source));
    if (filtered.length === 0) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.set(eventName, filtered);
    }
  }

  getListeners(eventName: string): EventListener[] {
    return this.listeners.get(eventName) ?? [];
  }

  getHistory(eventName?: string): Event[] {
    if (!eventName) return this.history.slice();
    return this.history.filter((e) => e.name === eventName);
  }
}
