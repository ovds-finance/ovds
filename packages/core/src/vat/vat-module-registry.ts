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

import type { VatModule }        from './vat-module';
import type { IVatRuleEngine }   from './vat-rule-engine';
import type { VatReportTemplate, VatJurisdictionInfo } from './vat-types';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Registry ─────────────────────────────────────────────────────────────────

export class VatModuleRegistry {
  /** Global module catalogue: countryCode → entry */
  private readonly modules = new Map<string, VatModuleEntry>();

  /** Per-tenant activation map: tenantId → activation */
  private readonly tenantActivations = new Map<string, TenantActivation>();

  // ── Registration ────────────────────────────────────────────────────────

  /**
   * Register a VatModule into the global catalogue.
   * Called once per module during platform bootstrap.
   * Calling register() twice for the same countryCode overwrites the previous entry
   * (allows hot-reload in development).
   */
  register(module: VatModule): this {
    this.modules.set(module.countryCode, {
      module,
      registeredAt: new Date().toISOString(),
      booted: false,
    });
    return this;
  }

  /** Mark a module as successfully booted */
  markBooted(countryCode: string): void {
    const entry = this.modules.get(countryCode.toUpperCase());
    if (entry) {
      this.modules.set(countryCode.toUpperCase(), { ...entry, booted: true });
    }
  }

  // ── Resolution ──────────────────────────────────────────────────────────

  /**
   * Retrieve the VatModule for a given country code.
   *
   * @param countryCode  ISO-3166-1 alpha-2, case-insensitive
   * @param tenantId     When provided, also verifies the tenant has activated
   *                     this module.  Pass undefined to skip tenant check.
   * @returns The VatModule, or undefined if not found / not activated.
   */
  resolve(countryCode: string, tenantId?: string): VatModule | undefined {
    const code  = countryCode.toUpperCase();
    const entry = this.modules.get(code);
    if (!entry) return undefined;

    if (tenantId !== undefined) {
      const activation = this.tenantActivations.get(tenantId);
      if (!activation || !activation.activeCodes.has(code)) return undefined;
    }

    return entry.module;
  }

  /**
   * Get the rule engine for a country directly (convenience wrapper).
   */
  ruleEngine(countryCode: string, tenantId?: string): IVatRuleEngine | undefined {
    return this.resolve(countryCode, tenantId)?.ruleEngine();
  }

  /**
   * Get all report templates provided by a given country module.
   */
  reportTemplates(countryCode: string, tenantId?: string): VatReportTemplate[] {
    return this.resolve(countryCode, tenantId)?.reportTemplates() ?? [];
  }

  /**
   * Get jurisdiction metadata for a country module.
   */
  jurisdictionInfo(countryCode: string): VatJurisdictionInfo | undefined {
    return this.modules.get(countryCode.toUpperCase())?.module.jurisdictionInfo();
  }

  // ── Tenant activation management ────────────────────────────────────────

  /**
   * Activate one or more VAT modules for a tenant.
   * Idempotent — activating an already-active module is a no-op.
   */
  activate(tenantId: string, countryCodes: string[]): void {
    const existing = this.tenantActivations.get(tenantId) ?? {
      tenantId,
      activeCodes: new Set<string>(),
      updatedAt: new Date().toISOString(),
    };

    for (const code of countryCodes) {
      const upper = code.toUpperCase();
      if (!this.modules.has(upper)) {
        throw new Error(
          `VatModuleRegistry: cannot activate "${upper}" — module is not registered. ` +
          `Available modules: ${[...this.modules.keys()].join(', ')}`,
        );
      }
      existing.activeCodes.add(upper);
    }

    existing.updatedAt = new Date().toISOString();
    this.tenantActivations.set(tenantId, existing);
  }

  /**
   * Deactivate one or more VAT modules for a tenant.
   */
  deactivate(tenantId: string, countryCodes: string[]): void {
    const existing = this.tenantActivations.get(tenantId);
    if (!existing) return;

    for (const code of countryCodes) {
      existing.activeCodes.delete(code.toUpperCase());
    }
    existing.updatedAt = new Date().toISOString();
  }

  /**
   * Bulk-set the active modules for a tenant from a DB snapshot.
   * Called at startup to restore activation state from `TenantVatModule` records.
   */
  syncTenantActivations(tenantId: string, activeCodes: string[]): void {
    this.tenantActivations.set(tenantId, {
      tenantId,
      activeCodes: new Set(activeCodes.map((c) => c.toUpperCase())),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Returns true if the given tenant has the given country module active.
   */
  isActive(tenantId: string, countryCode: string): boolean {
    return this.tenantActivations.get(tenantId)?.activeCodes.has(
      countryCode.toUpperCase(),
    ) ?? false;
  }

  /**
   * Returns all country codes active for the given tenant.
   */
  activeCodesFor(tenantId: string): string[] {
    const activation = this.tenantActivations.get(tenantId);
    if (!activation) return [];
    return [...activation.activeCodes];
  }

  // ── Catalogue queries ────────────────────────────────────────────────────

  /** All registered country codes (regardless of tenant activation) */
  allCodes(): string[] {
    return [...this.modules.keys()];
  }

  /** All registered modules as summary DTOs (safe for serialisation) */
  catalogue(): VatModuleSummary[] {
    return [...this.modules.values()].map((entry) => {
      const { module, registeredAt, booted } = entry;
      const jurisdiction = module.jurisdictionInfo();
      return {
        countryCode:     module.countryCode,
        countryName:     module.countryName,
        moduleVersion:   module.version,
        displayName:     module.info.displayName,
        authorityName:   jurisdiction.authorityName,
        currency:        jurisdiction.currency,
        ruleSetVersion:  module.ruleEngine().ruleSetVersion,
        booted,
        registeredAt,
        reportTemplates: module.reportTemplates(),
      };
    });
  }

  /** Catalogue filtered to modules active for a given tenant */
  catalogueForTenant(tenantId: string): VatModuleSummary[] {
    const active = new Set(this.activeCodesFor(tenantId));
    return this.catalogue().filter((s) => active.has(s.countryCode));
  }

  /** Number of registered modules */
  get size(): number {
    return this.modules.size;
  }

  /** Whether any modules have been registered */
  get isEmpty(): boolean {
    return this.modules.size === 0;
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────
// One global registry per process.  NestJS injects this via the
// VAT_MODULE_REGISTRY provider token (defined in OvdsVatModule).

let _instance: VatModuleRegistry | null = null;

export function getVatModuleRegistry(): VatModuleRegistry {
  if (!_instance) _instance = new VatModuleRegistry();
  return _instance;
}

/** Reset the singleton — only for tests */
export function resetVatModuleRegistry(): void {
  _instance = null;
}
