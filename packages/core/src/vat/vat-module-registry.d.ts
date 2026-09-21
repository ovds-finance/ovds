/**
 * @file vat-module-registry.ts
 * @package @ovds/core/vat
 *
 * VatModuleRegistry — the single runtime lookup table for all installed
 * country VAT modules across the entire OVDS SaaS instance.
 *
 * Architecture role
 * ─────────────────
 *  ┌──────────────────────────────────────────────┐
 *  │  Platform bootstrap (NestJS OnApplicationBootstrap) │
 *  │    → registers all VatModule instances        │
 *  └──────────────┬───────────────────────────────┘
 *                 │ register(module)
 *  ┌──────────────▼───────────────────────────────┐
 *  │         VatModuleRegistry (this file)         │
 *  │  countryCode → VatModule map                  │
 *  │  per-tenant activation state                  │
 *  └──────────────┬───────────────────────────────┘
 *                 │ resolve(countryCode, tenantId?)
 *  ┌──────────────▼───────────────────────────────┐
 *  │      VatDeclarationOrchestrator               │
 *  │  routes calculation / filing to correct module │
 *  └──────────────────────────────────────────────┘
 *
 * Multi-tenant behaviour
 * ──────────────────────
 * Every Company (tenant) may independently ACTIVATE a subset of the
 * globally-registered modules.  Activation state is persisted in
 * `TenantVatModule` (DB model added in Task 7) and synced into this
 * in-memory registry at startup and on activation changes.
 *
 * This file is intentionally NestJS-free so it can be used in tests,
 * scripts, and the frontend's type layer without pulling in framework deps.
 */
import type { VatModule } from './vat-module';
import type { IVatRuleEngine } from './vat-rule-engine';
import type { VatReportTemplate, VatJurisdictionInfo } from './vat-types';
export interface VatModuleEntry {
    module: VatModule;
    /** ISO timestamp when this module was registered into the registry */
    registeredAt: string;
    /** Whether the module has been successfully booted */
    booted: boolean;
}
export interface TenantActivation {
    tenantId: string;
    /** Set of country codes that this tenant has activated */
    activeCodes: Set<string>;
    /** ISO timestamp of last activation change */
    updatedAt: string;
}
export interface VatModuleSummary {
    countryCode: string;
    countryName: string;
    moduleVersion: string;
    displayName: string;
    authorityName: string;
    currency: string;
    ruleSetVersion: string;
    booted: boolean;
    registeredAt: string;
    reportTemplates: VatReportTemplate[];
}
export declare class VatModuleRegistry {
    /** Global module catalogue: countryCode → entry */
    private readonly modules;
    /** Per-tenant activation map: tenantId → activation */
    private readonly tenantActivations;
    /**
     * Register a VatModule into the global catalogue.
     * Called once per module during platform bootstrap.
     * Calling register() twice for the same countryCode overwrites the previous entry
     * (allows hot-reload in development).
     */
    register(module: VatModule): this;
    /** Mark a module as successfully booted */
    markBooted(countryCode: string): void;
    /**
     * Retrieve the VatModule for a given country code.
     *
     * @param countryCode  ISO-3166-1 alpha-2, case-insensitive
     * @param tenantId     When provided, also verifies the tenant has activated
     *                     this module.  Pass undefined to skip tenant check.
     * @returns The VatModule, or undefined if not found / not activated.
     */
    resolve(countryCode: string, tenantId?: string): VatModule | undefined;
    /**
     * Get the rule engine for a country directly (convenience wrapper).
     */
    ruleEngine(countryCode: string, tenantId?: string): IVatRuleEngine | undefined;
    /**
     * Get all report templates provided by a given country module.
     */
    reportTemplates(countryCode: string, tenantId?: string): VatReportTemplate[];
    /**
     * Get jurisdiction metadata for a country module.
     */
    jurisdictionInfo(countryCode: string): VatJurisdictionInfo | undefined;
    /**
     * Activate one or more VAT modules for a tenant.
     * Idempotent — activating an already-active module is a no-op.
     */
    activate(tenantId: string, countryCodes: string[]): void;
    /**
     * Deactivate one or more VAT modules for a tenant.
     */
    deactivate(tenantId: string, countryCodes: string[]): void;
    /**
     * Bulk-set the active modules for a tenant from a DB snapshot.
     * Called at startup to restore activation state from `TenantVatModule` records.
     */
    syncTenantActivations(tenantId: string, activeCodes: string[]): void;
    /**
     * Returns true if the given tenant has the given country module active.
     */
    isActive(tenantId: string, countryCode: string): boolean;
    /**
     * Returns all country codes active for the given tenant.
     */
    activeCodesFor(tenantId: string): string[];
    /** All registered country codes (regardless of tenant activation) */
    allCodes(): string[];
    /** All registered modules as summary DTOs (safe for serialisation) */
    catalogue(): VatModuleSummary[];
    /** Catalogue filtered to modules active for a given tenant */
    catalogueForTenant(tenantId: string): VatModuleSummary[];
    /** Number of registered modules */
    get size(): number;
    /** Whether any modules have been registered */
    get isEmpty(): boolean;
}
export declare function getVatModuleRegistry(): VatModuleRegistry;
/** Reset the singleton — only for tests */
export declare function resetVatModuleRegistry(): void;
//# sourceMappingURL=vat-module-registry.d.ts.map