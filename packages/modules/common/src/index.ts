/**
 * @ovds/modules-common
 *
 * Canonical DDD module: "Common Cross-Cutting Utilities".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules-common';        // domain types & logic
 *   import { web } from '@ovds/modules-common';        // namespaced UI slice
 *   import ... from '@ovds/modules-common/web';         // UI subpath
 *   import ... from '@ovds/modules-common/domain';      // types subpath
 *   import ... from '@ovds/modules-common/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
