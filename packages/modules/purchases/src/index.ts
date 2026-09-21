/**
 * @ovds/modules/purchases
 *
 * Canonical DDD module: "Purchases, Expenses, Bills & Vendors".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules/purchases';        // domain types & logic
 *   import { web } from '@ovds/modules/purchases';        // namespaced UI slice
 *   import ... from '@ovds/modules/purchases/web';         // UI subpath
 *   import ... from '@ovds/modules/purchases/domain';      // types subpath
 *   import ... from '@ovds/modules/purchases/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
