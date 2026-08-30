/**
 * @ovds/modules-tax
 *
 * Canonical DDD module: "Tax, VAT, WHT & Declarations".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules-tax';        // domain types & logic
 *   import { web } from '@ovds/modules-tax';        // namespaced UI slice
 *   import ... from '@ovds/modules-tax/web';         // UI subpath
 *   import ... from '@ovds/modules-tax/domain';      // types subpath
 *   import ... from '@ovds/modules-tax/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
