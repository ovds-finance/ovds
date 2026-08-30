import type { ModuleInterface, ModuleContainer, LoggerInterface } from '../kernel/module.interface';
import type { EventBusInterface } from '../events/event.interface';
import type { CoreServiceProvider } from './service.provider';

export interface ModuleProvider {
  register(eventBus: EventBusInterface): void | Promise<void>;
  boot?(container: ModuleContainer): void | Promise<void>;
}
