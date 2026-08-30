/**
 * App-module registry — typed, declarative composition for thin apps.
 *
 * Turns the "thin apps, thick libraries" principle into a mechanical rule:
 * an app's `@Module({ imports: [...] })` is built from a *typed array* of
 * module registrations, so the app never grows a one-off import per domain.
 *
 * Apps consume this via `createAppModules(...)`:
 *
 *   import { createAppModules } from '@ovds/core';
 *   import { AccountingModule } from './accounting/accounting.module';
 *   import { BankingModule } from './banks/banking.module';
 *
 *   export const appModules = createAppModules([
 *     { name: 'accounting', module: AccountingModule, enabled: true },
 *     { name: 'banking',    module: BankingModule,    enabled: true },
 *   ]);
 *
 * Then in `app.module.ts`:
 *
 *   @Module({
 *     imports: [
 *       ...appModules.toImports(),
 *       // global concerns only below
 *       ScheduleModule.forRoot(),
 *       ...
 *     ],
 *   })
 *   export class AppModule {}
 *
 * This registry is intentionally **framework-agnostic**: it does not import
 * from `@nestjs/common`, so `@ovds/core` (the shared kernel) stays free of
 * runtime framework dependencies. The `module` field is typed as a generic
 * function/class so both NestJS module classes and other registrables work.
 */

/**
 * A single thin-app module registration.
 *
 * `module` is the app-level NestJS module class (or any registrable object).
 * It is typed generically so this kernel library does not depend on Nest.
 */
export interface AppModuleRegistration<M = unknown> {
  /** Stable, unique module identifier (used for logging + tests). */
  name: string;
  /** The module class/object to import. */
  module: M;
  /** Whether the module participates in the final imports array. */
  enabled?: boolean;
  /** Optional array of module names this one depends on (for validation). */
  dependsOn?: string[];
}

/**
 * A typed dependency validation error.
 */
export interface DependencyError {
  /** The module that has the missing dependency. */
  module: string;
  /** The dependency that is missing or disabled. */
  dependency: string;
  /** Human-readable error message. */
  message: string;
}

/**
 * A registry of app modules with a stable iteration order.
 */
export class AppModuleRegistry<M = unknown> {
  private readonly entries = new Map<string, AppModuleRegistration<M>>();

  constructor(registrations: AppModuleRegistration<M>[] = []) {
    for (const reg of registrations) {
      this.add(reg);
    }
  }

  add(reg: AppModuleRegistration<M>): this {
    const resolvedName =
      reg.name ??
      ((reg.module as { name?: string } | undefined)?.name ?? '');
    if (!resolvedName) {
      throw new Error(
        'AppModuleRegistry: every registration needs a stable `name` so the ' +
          'thin-app composition can be logged/tested deterministically.',
      );
    }
    this.entries.set(resolvedName, { enabled: true, ...reg, name: resolvedName });
    return this;
  }

  has(name: string): boolean {
    return this.entries.has(name);
  }

  get(name: string): AppModuleRegistration<M> | undefined {
    return this.entries.get(name);
  }

  names(): string[] {
    return [...this.entries.keys()];
  }

  /**
   * The ordered list of enabled module classes/objects, ready to spread into
   * `@Module({ imports: [...] })`.
   */
  toImports(): M[] {
    const out: M[] = [];
    for (const reg of this.entries.values()) {
      if (reg.enabled === false) continue;
      out.push(reg.module);
    }
    return out;
  }

  /**
   * Enable a module by name. Returns true if the module exists.
   */
  enable(name: string): boolean {
    const reg = this.entries.get(name);
    if (!reg) return false;
    this.entries.set(name, { ...reg, enabled: true });
    return true;
  }

  /**
   * Disable a module by name. Returns true if the module exists.
   */
  disable(name: string): boolean {
    const reg = this.entries.get(name);
    if (!reg) return false;
    this.entries.set(name, { ...reg, enabled: false });
    return true;
  }

  /**
   * Get modules in dependency-safe order (topological sort).
   * Modules with no dependencies come first.
   */
  getModuleOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }
      visiting.add(name);
      const reg = this.entries.get(name);
      if (reg?.dependsOn) {
        for (const dep of reg.dependsOn) {
          if (this.entries.has(dep)) {
            visit(dep);
          }
        }
      }
      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    for (const name of this.entries.keys()) {
      visit(name);
    }

    return order;
  }

  /**
   * Fail fast if a hard dependency is missing or disabled.
   * Returns typed dependency errors instead of plain strings.
   */
  validate(): DependencyError[] {
    const errors: DependencyError[] = [];
    for (const reg of this.entries.values()) {
      for (const dep of reg.dependsOn ?? []) {
        const target = this.entries.get(dep);
        if (!target) {
          errors.push({
            module: reg.name,
            dependency: dep,
            message: `Module [${reg.name}] depends on [${dep}] which is not registered.`,
          });
        } else if (target.enabled === false) {
          errors.push({
            module: reg.name,
            dependency: dep,
            message: `Module [${reg.name}] depends on [${dep}] which is disabled.`,
          });
        }
      }
    }
    return errors;
  }

  /**
   * Get only the enabled modules.
   */
  getEnabledModules(): AppModuleRegistration<M>[] {
    return [...this.entries.values()].filter((reg) => reg.enabled !== false);
  }

  /**
   * Get only the disabled modules.
   */
  getDisabledModules(): AppModuleRegistration<M>[] {
    return [...this.entries.values()].filter((reg) => reg.enabled === false);
  }

  /**
   * Count of registered modules.
   */
  get count(): number {
    return this.entries.size;
  }

  /**
   * Count of enabled modules.
   */
  get enabledCount(): number {
    return this.getEnabledModules().length;
  }
}

/**
 * Create an `AppModuleRegistry` from a plain array of registrations.
 */
export function createAppModules<M = unknown>(
  registrations: AppModuleRegistration<M>[],
): AppModuleRegistry<M> {
  return new AppModuleRegistry<M>(registrations);
}

/**
 * Compose a flat list of module classes/objects from a plain array of
 * registrations. Convenience for the common case where an app just wants the
 * imports array.
 */
export function composeAppModules<M = unknown>(
  registrations: AppModuleRegistration<M>[],
): M[] {
  return createAppModules<M>(registrations).toImports();
}

