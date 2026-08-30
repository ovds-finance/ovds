/**
 * @ovds/modules-ledger
 *
 * Canonical DDD module: "General Ledger, Chart of Accounts & Double-Entry".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules-ledger';        // domain types & logic
 *   import { web } from '@ovds/modules-ledger';        // namespaced UI slice
 *   import ... from '@ovds/modules-ledger/web';         // UI subpath
 *   import ... from '@ovds/modules-ledger/domain';      // types subpath
 *   import ... from '@ovds/modules-ledger/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
