import type { ModuleAppContainer, ModuleAppEventBus } from '../module-app';
import type { LoggerInterface } from './module.interface';
import type { Event, EventListener } from '../events/event.interface';

export interface MockLogger extends LoggerInterface {
  logs: Array<{ message: string; context?: string }>;
}

export function createMockLogger(): MockLogger {
  const logs: Array<{ message: string; context?: string }> = [];
  return {
    logs,
    log: (message: string, context?: string) => { logs.push({ message, context }); },
    error: (message: string, _trace?: string, context?: string) => { logs.push({ message, context }); },
    warn: (message: string, context?: string) => { logs.push({ message, context }); },
    debug: (message: string, context?: string) => { logs.push({ message, context }); },
  };
}

export interface MockEventBus extends ModuleAppEventBus {
  dispatchedEvents: Event[];
  listeners: Map<string, EventListener[]>;
}

export function createMockEventBus(): MockEventBus {
  const listeners = new Map<string, EventListener[]>();
  const dispatchedEvents: Event[] = [];

  const emit = (eventName: string, event: Event): void => {
    for (const listener of (listeners.get(eventName) ?? [])) {
      listener.handler(event);
    }
  };

  return {
    dispatchedEvents,
    listeners,
    dispatch: async (event: Event) => {
      dispatchedEvents.push(event);
      if (event?.name) emit(event.name, event);
    },
    listen: (eventName: string, handler: (event: Event) => Promise<void> | void, options?: { priority?: number }) => {
      if (!listeners.has(eventName)) listeners.set(eventName, []);
      const listener: EventListener = {
        eventName,
        handler,
        priority: options?.priority ?? 100,
      };
      listeners.get(eventName)!.push(listener);
      return listener.id ?? `listener_${Date.now()}`;
    },
    removeListener: (_listenerId: string) => {},
    removeListeners: (eventName: string) => { listeners.delete(eventName); },
    getListeners: (eventName: string) => listeners.get(eventName) ?? [],
    getHistory: () => dispatchedEvents,
  };
}

export interface MockContainer extends ModuleAppContainer {
  mockModules: Map<string, unknown>;
  mockData: Map<string, unknown[]>;
}

export function createMockContainer(): MockContainer {
  const mockModules = new Map<string, unknown>();
  const mockData = new Map<string, unknown[]>();

  return {
    mockModules,
    mockData,
    prisma: {},
    eventBus: createMockEventBus(),
    settings: {
      get: () => undefined,
      set: () => {},
    },
    logger: createMockLogger(),
    get: <T>(token: string): T | undefined => mockModules.get(token) as T | undefined,
    has: (token: string): boolean => mockModules.has(token),
  };
}
