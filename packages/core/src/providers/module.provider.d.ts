import type { ModuleContainer } from '../kernel/module.interface';
import type { EventBusInterface } from '../events/event.interface';
export interface ModuleProvider {
    register(eventBus: EventBusInterface): void | Promise<void>;
    boot?(container: ModuleContainer): void | Promise<void>;
}
//# sourceMappingURL=module.provider.d.ts.map