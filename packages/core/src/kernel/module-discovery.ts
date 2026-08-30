/**
 * ModuleDiscovery — auto-discovers and registers module providers.
 *
 * Framework-agnostic; no NestJS imports.
 * Implements singleton pattern for global module registry.
 */

import type { ModuleInterface, ModuleInfo } from './module.interface';

export interface ModuleFactory {
  name: string;
  factory: () => ModuleInterface;
  enabled?: boolean;
}

export class ModuleDiscovery {
  private static instance: ModuleDiscovery;
  private readonly factories = new Map<string, ModuleFactory>();
  private readonly modules = new Map<string, ModuleInfo>();

  private constructor() {}

  static getInstance(): ModuleDiscovery {
    if (!ModuleDiscovery.instance) {
      ModuleDiscovery.instance = new ModuleDiscovery();
    }
    return ModuleDiscovery.instance;
  }

  static resetInstance(): void {
    ModuleDiscovery.instance = undefined as unknown as ModuleDiscovery;
  }

  registerModule(name: string, factory: () => ModuleInterface, info?: Partial<ModuleInfo>): this {
    this.factories.set(name, { name, factory, enabled: true });
    if (info) {
      const existing = this.modules.get(name);
      this.modules.set(name, {
        name: info.name ?? name,
        displayName: info.displayName ?? existing?.displayName ?? name,
        version: info.version ?? existing?.version ?? '1.0.0',
        description: info.description ?? existing?.description ?? '',
        author: info.author ?? existing?.author,
        category: info.category ?? existing?.category ?? 'general',
        icon: info.icon ?? existing?.icon ?? 'Package',
        dependsOn: info.dependsOn ?? existing?.dependsOn,
        installType: info.installType ?? existing?.installType ?? 'app',
        subscriptionTiers: info.subscriptionTiers ?? existing?.subscriptionTiers,
        complianceStandards: info.complianceStandards ?? existing?.complianceStandards,
        dataFlow: info.dataFlow ?? existing?.dataFlow,
      } as ModuleInfo);
    }
    return this;
  }

  registerFactory(registration: ModuleFactory): this {
    this.factories.set(registration.name, registration);
    return this;
  }

  hasModule(name: string): boolean {
    return this.factories.has(name);
  }

  getModule(name: string): ModuleFactory | undefined {
    return this.factories.get(name);
  }

  getModuleInfo(name: string): ModuleInfo | undefined {
    return this.modules.get(name);
  }

  getAllModules(): ModuleFactory[] {
    return [...this.factories.values()];
  }

  getEnabledModules(): ModuleFactory[] {
    return this.getAllModules().filter((m) => m.enabled !== false);
  }

  getDisabledModules(): ModuleFactory[] {
    return this.getAllModules().filter((m) => m.enabled === false);
  }

  getModulesByCategory(category: string): ModuleFactory[] {
    return this.getAllModules().filter((m) => {
      const info = this.modules.get(m.name);
      return info?.category === category;
    });
  }

  createAllModules(options?: { enabledModules?: string[]; disabledModules?: string[] }): ModuleInterface[] {
    const enabled = options?.enabledModules;
    const disabled = options?.disabledModules ?? [];

    return this.getAllModules()
      .filter((m) => {
        if (disabled.includes(m.name)) return false;
        if (enabled && !enabled.includes(m.name)) return false;
        return m.enabled !== false;
      })
      .map((m) => m.factory());
  }

  createModule(name: string): ModuleInterface | undefined {
    const factory = this.factories.get(name);
    if (!factory) return undefined;
    return factory.factory();
  }

  removeModule(name: string): boolean {
    return this.factories.delete(name);
  }

  clear(): void {
    this.factories.clear();
    this.modules.clear();
  }

  get count(): number {
    return this.factories.size;
  }

  get enabledCount(): number {
    return this.getEnabledModules().length;
  }
}
