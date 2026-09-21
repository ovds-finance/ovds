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
export declare class AppModuleRegistry<M = unknown> {
    private readonly entries;
    constructor(registrations?: AppModuleRegistration<M>[]);
    add(reg: AppModuleRegistration<M>): this;
    has(name: string): boolean;
    get(name: string): AppModuleRegistration<M> | undefined;
    names(): string[];
    /**
     * The ordered list of enabled module classes/objects, ready to spread into
     * `@Module({ imports: [...] })`.
     */
    toImports(): M[];
    /**
     * Enable a module by name. Returns true if the module exists.
     */
    enable(name: string): boolean;
    /**
     * Disable a module by name. Returns true if the module exists.
     */
    disable(name: string): boolean;
    /**
     * Get modules in dependency-safe order (topological sort).
     * Modules with no dependencies come first.
     */
    getModuleOrder(): string[];
    /**
     * Fail fast if a hard dependency is missing or disabled.
     * Returns typed dependency errors instead of plain strings.
     */
    validate(): DependencyError[];
    /**
     * Get only the enabled modules.
     */
    getEnabledModules(): AppModuleRegistration<M>[];
    /**
     * Get only the disabled modules.
     */
    getDisabledModules(): AppModuleRegistration<M>[];
    /**
     * Count of registered modules.
     */
    get count(): number;
    /**
     * Count of enabled modules.
     */
    get enabledCount(): number;
}
/**
 * Create an `AppModuleRegistry` from a plain array of registrations.
 */
export declare function createAppModules<M = unknown>(registrations: AppModuleRegistration<M>[]): AppModuleRegistry<M>;
/**
 * Compose a flat list of module classes/objects from a plain array of
 * registrations. Convenience for the common case where an app just wants the
 * imports array.
 */
export declare function composeAppModules<M = unknown>(registrations: AppModuleRegistration<M>[]): M[];
//# sourceMappingURL=app-modules.d.ts.map