import type { EventBusInterface } from '../events/event.interface';
import type { ModuleContainer, LoggerInterface } from '../kernel/module.interface';

export interface CoreServiceProvider {
  register(container: ModuleContainer): void | Promise<void>;
  boot?(container: ModuleContainer): void | Promise<void>;
}

export interface ServiceProvider {
  register(container: ModuleContainer): void | Promise<void>;
  boot?(container: ModuleContainer): void | Promise<void>;
}

export class ServiceProviderManager {
  private static instance: ServiceProviderManager;
  private providers: Map<string, CoreServiceProvider> = new Map();
  private container?: ModuleContainer;
  private logger?: LoggerInterface;

  private constructor() {}

  static getInstance(): ServiceProviderManager {
    if (!ServiceProviderManager.instance) {
      ServiceProviderManager.instance = new ServiceProviderManager();
    }
    return ServiceProviderManager.instance;
  }

  static reset(): void {
    ServiceProviderManager.instance = new ServiceProviderManager();
  }

  setContainer(container: ModuleContainer): void {
    this.container = container;
  }

  setLogger(logger: LoggerInterface): void {
    this.logger = logger;
  }

  register(name: string, provider: CoreServiceProvider): void {
    if (this.providers.has(name)) {
      throw new Error(`Service provider [${name}] is already registered.`);
    }
    this.providers.set(name, provider);
  }

  async registerAll(): Promise<void> {
    for (const [name, provider] of this.providers) {
      try {
        if (this.container) {
          await provider.register(this.container);
        }
      } catch (error) {
        console.error(`[ServiceProviderManager] Failed to register provider [${name}]:`, error);
      }
    }
  }

  async bootAll(): Promise<void> {
    for (const [name, provider] of this.providers) {
      try {
        if (provider.boot && this.container) {
          await provider.boot(this.container);
        }
      } catch (error) {
        console.error(`[ServiceProviderManager] Failed to boot provider [${name}]:`, error);
      }
    }
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  get(name: string): CoreServiceProvider | undefined {
    return this.providers.get(name);
  }

  clear(): void {
    this.providers.clear();
  }
}
