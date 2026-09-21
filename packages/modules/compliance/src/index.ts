/**
 * @ovds/modules/compliance
 *
 * Canonical DDD module: "Compliance, Audit & Governance".
 *
 * Public surface:
 *   import { ... } from '@ovds/modules/compliance';        // domain types & logic
 *   import { web } from '@ovds/modules/compliance';        // namespaced UI slice
 *   import ... from '@ovds/modules/compliance/web';         // UI subpath
 *   import ... from '@ovds/modules/compliance/domain';      // types subpath
 *   import ... from '@ovds/modules/compliance/dto';         // contracts subpath
 */

// Domain types & logic (the bounded context's single source of truth).
export * from './domain';

// Web/UI slice, namespaced to avoid clashing with domain exports.
export * as web from './web';
