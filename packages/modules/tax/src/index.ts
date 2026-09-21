/**
 * @ovds/modules/tax
 *
 * Canonical DDD module: "Tax, VAT, WHT & Declarations".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules/tax';               // domain types & logic
 *   import { web } from '@ovds/modules/tax';               // namespaced UI slice
 *   import { etVatModule } from '@ovds/modules/tax';       // country VAT module singletons
 *   import ... from '@ovds/modules/tax/web';               // UI subpath
 *   import ... from '@ovds/modules/tax/domain';            // types subpath
 *   import ... from '@ovds/modules/tax/dto';               // contracts subpath
 *   import ... from '@ovds/modules/tax/countries';         // country VAT modules subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';

// Country VAT modules — all singletons + classes + the ALL_VAT_MODULES convenience array.
// Namespaced to avoid collision with domain exports.
export * as countries from './countries';

// Direct re-exports for the most common imports so callers don't need subpath syntax:
export { etVatModule, EtVatModule, EtVatRuleEngine } from './countries';
export { aeVatModule, AeVatModule, AeVatRuleEngine } from './countries';
export { ALL_VAT_MODULES }                           from './countries';
