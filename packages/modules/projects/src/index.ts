/**
 * @ovds/modules-projects
 *
 * Canonical DDD module: "Project Accounting".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules-projects';        // domain types & logic
 *   import { web } from '@ovds/modules-projects';        // namespaced UI slice
 *   import ... from '@ovds/modules-projects/web';         // UI subpath
 *   import ... from '@ovds/modules-projects/domain';      // types subpath
 *   import ... from '@ovds/modules-projects/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
