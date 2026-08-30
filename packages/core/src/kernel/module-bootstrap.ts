import type { ModuleInterface } from './module.interface';
import type { EventBusInterface } from '../events/event.interface';
import type { LoggerInterface } from './module.interface';

export interface ModuleRegistration {
  name: string;
  factory: () => ModuleInterface;
  enabled?: boolean;
}

export interface BootstrapOptions {
  enabledModules?: string[];
  disabledModules?: string[];
  eventBus?: EventBusInterface;
  container?: Record<string, unknown>;
  runHealthChecks?: boolean;
}

export interface ModuleBootstrapError {
  name: string;
  message: string;
  phase: 'instantiation' | 'register' | 'boot' | 'health';
}

export interface BootstrapResult {
  modules: ModuleInterface[];
  names: string[];
  errors: ModuleBootstrapError[];
  healthResults?: Array<{ name: string; status: 'healthy' | 'degraded' | 'unhealthy'; message?: string; checkedAt: Date }>;
}

export class ModuleBootstrap {
  private static instance: ModuleBootstrap;
  private registrations: ModuleRegistration[] = [];
  private logger?: LoggerInterface;

  private constructor() {}

  static getInstance(): ModuleBootstrap {
    if (!ModuleBootstrap.instance) {
      ModuleBootstrap.instance = new ModuleBootstrap();
    }
    return ModuleBootstrap.instance;
  }

  static reset(): void {
    ModuleBootstrap.instance = new ModuleBootstrap();
  }

  setLogger(logger: LoggerInterface): void {
    this.logger = logger;
  }

  registerModule(name: string, factory: () => ModuleInterface, enabled = true): void {
    if (this.registrations.some((r) => r.name === name)) {
      const existing = this.registrations.find((r) => r.name === name);
      if (existing) existing.enabled = enabled;
      return;
    }
    this.registrations.push({ name, factory, enabled });
    this.log('register', `Module [${name}] registered for auto-discovery`);
  }

  registerAll(modules: Array<{ name: string; factory: () => ModuleInterface; enabled?: boolean }>): void {
    for (const mod of modules) {
      this.registerModule(mod.name, mod.factory, mod.enabled);
    }
  }

  getRegisteredNames(): string[] {
    return this.registrations.map((r) => r.name);
  }

  resolveOptions(options?: BootstrapOptions): { names: string[]; enabledMap: Map<string, boolean> } {
    const disabled = new Set(options?.disabledModules ?? []);
    const enabledFilter = options?.enabledModules;
    const names: string[] = [];
    const enabledMap = new Map<string, boolean>();

    for (const reg of this.registrations) {
      if (disabled.has(reg.name)) continue;
      if (enabledFilter && !enabledFilter.includes(reg.name)) continue;
      names.push(reg.name);
      enabledMap.set(reg.name, reg.enabled ?? true);
    }

    return { names, enabledMap };
  }

  async bootstrap(options: BootstrapOptions = {}): Promise<BootstrapResult> {
    const { names, enabledMap } = this.resolveOptions(options);
    const modules: ModuleInterface[] = [];
    const errors: ModuleBootstrapError[] = [];
    const healthResults: BootstrapResult['healthResults'] = [];
    const eventBus = options.eventBus;
    const container = options.container ?? {};
    const runHealthChecks = options.runHealthChecks ?? true;

    for (const name of names) {
      const reg = this.registrations.find((r) => r.name === name);
      if (!reg) continue;
      if (!enabledMap.get(name)) {
        this.log('skip', `Module [${name}] is disabled`);
        continue;
      }

      let module: ModuleInterface;
      try {
        module = reg.factory();
        modules.push(module);
        this.log('instantiate', `Module [${name}] instantiated`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ name, message, phase: 'instantiation' });
        this.log('error', `Failed to instantiate module [${name}]: ${message}`);
        continue;
      }

      if (typeof module.register === 'function' && eventBus) {
        try {
          await module.register(eventBus);
          this.log('register', `Module [${name}] registered event listeners`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push({ name, message, phase: 'register' });
          this.log('error', `Failed to register module [${name}]: ${message}`);
        }
      }

      if (typeof module.boot === 'function') {
        try {
          await module.boot(container as any);
          this.log('boot', `Module [${name}] booted`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push({ name, message, phase: 'boot' });
          this.log('error', `Failed to boot module [${name}]: ${message}`);
        }
      }

      if (runHealthChecks && typeof module.health === 'function') {
        try {
          const health = await module.health();
          healthResults.push({ name, ...health });
        } catch (healthError) {
          const message = healthError instanceof Error ? healthError.message : String(healthError);
          healthResults.push({ name, status: 'unhealthy', message: `Health check failed: ${message}`, checkedAt: new Date() });
        }
      }
    }

    return {
      modules,
      names: modules.map((m) => m.info.name),
      errors,
      healthResults: healthResults.length > 0 ? healthResults : undefined,
    };
  }

  private log(action: string, message: string): void {
    if (this.logger) {
      this.logger.log(`[${action}] ${message}`, 'ModuleBootstrap');
    } else {
      console.log(`[ModuleBootstrap] [${action}] ${message}`);
    }
  }
}
