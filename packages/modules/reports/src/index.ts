/**
 * @ovds/modules/reports
 *
 * Canonical DDD module: "Reports & Analytics".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules/reports';        // domain types & logic
 *   import { web } from '@ovds/modules/reports';        // namespaced UI slice
 *   import ... from '@ovds/modules/reports/web';         // UI subpath
 *   import ... from '@ovds/modules/reports/domain';      // types subpath
 *   import ... from '@ovds/modules/reports/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
