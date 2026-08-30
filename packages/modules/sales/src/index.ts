/**
 * @ovds/modules-sales
 *
 * Canonical DDD module: "Sales, Invoicing, Customers & CRM".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules-sales';        // domain types & logic
 *   import { web } from '@ovds/modules-sales';        // namespaced UI slice
 *   import ... from '@ovds/modules-sales/web';         // UI subpath
 *   import ... from '@ovds/modules-sales/domain';      // types subpath
 *   import ... from '@ovds/modules-sales/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
