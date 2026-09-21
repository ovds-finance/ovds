/**
 * @ovds/modules/platform
 *
 * Canonical DDD module: "Platform, App Store & Releases".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules/platform';        // domain types & logic
 *   import { web } from '@ovds/modules/platform';        // namespaced UI slice
 *   import ... from '@ovds/modules/platform/web';         // UI subpath
 *   import ... from '@ovds/modules/platform/domain';      // types subpath
 *   import ... from '@ovds/modules/platform/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
