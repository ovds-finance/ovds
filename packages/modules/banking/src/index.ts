/**
 * @ovds/modules/banking
 *
 * Canonical DDD module: "Banking, Transactions & Reconciliation".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules/banking';        // domain types & logic
 *   import { web } from '@ovds/modules/banking';        // namespaced UI slice
 *   import ... from '@ovds/modules/banking/web';         // UI subpath
 *   import ... from '@ovds/modules/banking/domain';      // types subpath
 *   import ... from '@ovds/modules/banking/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
