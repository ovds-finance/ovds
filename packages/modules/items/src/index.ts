/**
 * @ovds/modules-items
 *
 * Canonical DDD module: "Items, Inventory & Manufacturing".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules-items';        // domain types & logic
 *   import { web } from '@ovds/modules-items';        // namespaced UI slice
 *   import ... from '@ovds/modules-items/web';         // UI subpath
 *   import ... from '@ovds/modules-items/domain';      // types subpath
 *   import ... from '@ovds/modules-items/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
