/**
 * CJS entry point for the tax module — backend-safe subset.
 * Excludes the web/UI slice (browser-only code) so this compiles
 * cleanly under a Node.js/CommonJS target without DOM lib.
 */

// Domain types & logic
export * from './domain';

// Country VAT modules
export * as countries from './countries';
export { etVatModule, EtVatModule, EtVatRuleEngine } from './countries';
export { aeVatModule, AeVatModule, AeVatRuleEngine } from './countries';
export { ALL_VAT_MODULES }                           from './countries';
