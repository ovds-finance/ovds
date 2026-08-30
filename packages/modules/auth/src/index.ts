/**
 * @ovds/modules-auth
 *
 * Canonical DDD module: "Authentication, Users & Access Control".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules-auth';        // domain types & logic
 *   import { web } from '@ovds/modules-auth';        // namespaced UI slice
 *   import ... from '@ovds/modules-auth/web';         // UI subpath
 *   import ... from '@ovds/modules-auth/domain';      // types subpath
 *   import ... from '@ovds/modules-auth/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
