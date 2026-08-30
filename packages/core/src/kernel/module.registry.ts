import type { ModuleInterface, ModuleContainer, LoggerInterface } from './module.interface';
import type { EventBusInterface } from '../events/event.interface';
import type { SettingsServiceInterface } from '../settings/settings.interface';
import { ModuleApp } from '../module-app';

export interface RegisteredModule {
  module: ModuleInterface;
  enabled: boolean;
  loadedAt: Date;
  bootedAt?: Date;
  registeredAt?: Date;
  error?: string;
  installType: 'core' | 'app';
  subscriptionTiers?: string[];
}

export interface EntitlementContext {
  subscriptionTier: 'free' | 'starter' | 'professional' | 'enterprise';
  installedApps: string[];
}

export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules: Map<string, RegisteredModule> = new Map();
  private container?: ModuleContainer;
  private eventBus?: EventBusInterface;
  private logger?: LoggerInterface;
  private entitlementContext?: EntitlementContext;

  private constructor() {}

  static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  static reset(): void {
    ModuleRegistry.instance = new ModuleRegistry();
  }

  setContainer(container: ModuleContainer): void {
    this.container = container;
  }

  setEventBus(eventBus: EventBusInterface): void {
    this.eventBus = eventBus;
  }

  setLogger(logger: LoggerInterface): void {
    this.logger = logger;
  }

  setEntitlementContext(context: EntitlementContext): void {
    this.entitlementContext = context;
  }

  register(module: ModuleInterface, enabled = true): void {
    if (this.modules.has(module.info.name)) {
      throw new Error(`Module [${module.info.name}] is already registered.`);
    }

    const entry: RegisteredModule = {
      module,
      enabled,
      loadedAt: new Date(),
      installType: module.info.installType,
      subscriptionTiers: module.info.subscriptionTiers,
    };

    this.modules.set(module.info.name, entry);
    this.log(module.info.name, 'registered', module.info.name);
  }

  get(name: string): ModuleInterface | undefined {
    const entry = this.modules.get(name);
    return entry?.module;
  }

  getAll(): ModuleInterface[] {
    return Array.from(this.modules.values()).map((entry) => entry.module);
  }

  getEnabled(): ModuleInterface[] {
    return this.getAll().filter((m) => this.isEnabled(m.info.name));
  }

  isEnabled(name: string): boolean {
    return this.modules.get(name)?.enabled ?? false;
  }

  getRegisteredModule(name: string): RegisteredModule | undefined {
    return this.modules.get(name);
  }

  getAllRegistered(): RegisteredModule[] {
    return Array.from(this.modules.values());
  }

  isEntitled(name: string): boolean {
    const entry = this.modules.get(name);
    if (!entry) return false;

    if (entry.installType === 'core') return true;

    if (!this.entitlementContext) return entry.enabled;

    const tier = this.entitlementContext.subscriptionTier;
    const tiers = entry.subscriptionTiers ?? [];
    if (tiers.length === 0) return entry.enabled;
    return tiers.includes(tier) && entry.enabled;
  }

  getEntitledModules(): ModuleInterface[] {
    return this.getAll().filter((m) => this.isEntitled(m.info.name));
  }

  async bootAll(container?: ModuleContainer): Promise<void> {
    const targetContainer = container ?? this.container;
    if (!targetContainer) {
      throw new Error('ModuleRegistry: container not set. Call setContainer() first.');
    }

    const sorted = this.getDependencyOrder();
    for (const name of sorted) {
      const entry = this.modules.get(name);
      if (!entry || !entry.enabled) continue;
      if (!this.isEntitled(name)) {
        this.log(name, 'skipped_entitlement', `Module [${name}] is not entitled for current subscription tier`);
        continue;
      }
      try {
        this.log(name, 'booting', name);
        await entry.module.boot(targetContainer);
        entry.bootedAt = new Date();
        if (entry.module instanceof ModuleApp) {
          entry.module.markBooted();
        }
        this.log(name, 'booted', name);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        entry.error = message;
        this.log(name, 'boot_failed', `${name}: ${message}`);
        console.error(`[ModuleRegistry] Failed to boot module [${name}]:`, error);
      }
    }
  }

  async registerAll(eventBus?: EventBusInterface): Promise<void> {
    const targetEventBus = eventBus ?? this.eventBus;
    if (!targetEventBus) {
      throw new Error('ModuleRegistry: eventBus not set. Call setEventBus() first.');
    }

    const sorted = this.getDependencyOrder();
    for (const name of sorted) {
      const entry = this.modules.get(name);
      if (!entry || !entry.enabled) continue;
      if (!this.isEntitled(name)) {
        this.log(name, 'skipped_entitlement', `Module [${name}] is not entitled for current subscription tier`);
        continue;
      }
      try {
        this.log(name, 'registering', name);
        await entry.module.register(targetEventBus);
        entry.registeredAt = new Date();
        if (entry.module instanceof ModuleApp) {
          entry.module.markRegistered();
        }
        this.log(name, 'registered', name);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        entry.error = message;
        this.log(name, 'register_failed', `${name}: ${message}`);
        console.error(`[ModuleRegistry] Failed to register module [${name}]:`, error);
      }
    }
  }

  getDependencyOrder(): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving module [${name}].`);
      }
      visiting.add(name);

      const entry = this.modules.get(name);
      if (!entry) return;

      const deps = entry.module.info.dependsOn ?? [];
      for (const dep of deps) {
        if (this.modules.has(dep)) {
          visit(dep);
        }
      }

      visiting.delete(name);
      visited.add(name);
      sorted.push(name);
    };

    for (const name of this.modules.keys()) {
      visit(name);
    }

    return sorted;
  }

  has(name: string): boolean {
    return this.modules.has(name);
  }

  clear(): void {
    this.modules.clear();
  }

  private log(moduleName: string, action: string, message: string): void {
    if (this.logger) {
      this.logger.log(`[${action}] ${message}`, 'ModuleRegistry');
    } else {
      console.log(`[ModuleRegistry] [${moduleName}] [${action}] ${message}`);
    }
  }
}
