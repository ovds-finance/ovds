/**
 * @file packages/modules/tax/src/countries/index.ts
 *
 * Barrel for all installed country VAT modules.
 *
 * Consumers (e.g. the backend orchestrator) can now write:
 *   import { etVatModule, aeVatModule } from '@ovds/modules/tax/countries';
 *
 * Adding a new country:
 *   1. Create packages/modules/tax/src/countries/<iso2>/<iso2>-vat-module.ts
 *   2. Add two export lines below — that's it.
 */

// ── Ethiopia (ET) ─────────────────────────────────────────────────────────────
export { EtVatRuleEngine } from './et/et-vat-rule-engine';
export { EtVatModule, etVatModule } from './et/et-vat-module';

// ── United Arab Emirates (AE) ─────────────────────────────────────────────────
export { AeVatRuleEngine } from './ae/ae-vat-rule-engine';
export { AeVatModule, aeVatModule } from './ae/ae-vat-module';

// ── Convenience re-export: all singleton instances as an array ────────────────
// Use with VatModuleRegistry to register every module in one line:
//
//   import { ALL_VAT_MODULES } from '@ovds/modules/tax/countries';
//   for (const mod of ALL_VAT_MODULES) registry.register(mod);
//
import { etVatModule } from './et/et-vat-module';
import { aeVatModule } from './ae/ae-vat-module';

export const ALL_VAT_MODULES = [etVatModule, aeVatModule] as const;
