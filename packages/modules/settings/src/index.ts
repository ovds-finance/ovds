/**
 * @ovds/modules/settings
 *
 * Canonical DDD module: "Company Profile, Currencies & Localization".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules/settings';        // domain types & logic
 *   import { web } from '@ovds/modules/settings';        // namespaced UI slice
 *   import ... from '@ovds/modules/settings/web';         // UI subpath
 *   import ... from '@ovds/modules/settings/domain';      // types subpath
 *   import ... from '@ovds/modules/settings/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
