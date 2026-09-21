import { EventBusInterface } from './event.interface';
import { EventDispatcher } from './event.dispatcher';

export class EventBus implements EventBusInterface {
  private static instance: EventBus;
  private dispatcher: EventDispatcher;

  private constructor() {
    this.dispatcher = new EventDispatcher();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  async dispatch(event: import('./event.interface').Event): Promise<void> {
    return this.dispatcher.dispatch(event);
  }

  listen(
    eventName: string,
    handler: (event: import('./event.interface').Event) => Promise<void> | void,
    options?: { priority?: number },
  ): string {
    return this.dispatcher.listen(eventName, handler, options);
  }

  removeListener(listenerId: string): void {
    this.dispatcher.removeListener(listenerId);
  }

  removeListeners(eventName: string, source?: string): void {
    this.dispatcher.removeListeners(eventName, source);
  }

  getListeners(eventName: string): import('./event.interface').EventListener[] {
    return this.dispatcher.getListeners(eventName);
  }

  getAllListeners(): Array<import('./event.interface').EventListener & { eventName: string }> {
    return this.dispatcher.getAllListeners();
  }

  getHistory(eventName?: string): import('./event.interface').Event[] {
    return this.dispatcher.getHistory(eventName);
  }
}
