/**
 * @ovds/modules/security
 *
 * Canonical DDD module: "Security & Cyber Audit".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules/security';        // domain types & logic
 *   import { web } from '@ovds/modules/security';        // namespaced UI slice
 *   import ... from '@ovds/modules/security/web';         // UI subpath
 *   import ... from '@ovds/modules/security/domain';      // types subpath
 *   import ... from '@ovds/modules/security/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
