import type { Event, EventBusInterface } from '../events/event.interface';

export function dispatchEvent(
  eventBus: EventBusInterface | undefined,
  name: string,
  payload: unknown,
  source = 'module',
): Promise<void> {
  if (!eventBus) return Promise.resolve();
  return eventBus.dispatch({ name, payload, timestamp: new Date(), source });
}

export function createEvent(name: string, payload: unknown, source = 'module'): Event {
  return { name, payload, timestamp: new Date(), source };
}
