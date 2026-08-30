/**
 * Array / API response utilities — re-exported from @ovds/shared (single source of truth).
 *
 * The full implementation lives in packages/shared/src/utils.ts
 * so both frontend and backend use identical response-unwrapping logic.
 *
 * DO NOT add implementations here. Edit packages/shared/src/utils.ts instead.
 */
 export {
   toArray,
   unwrapArray,
   unwrapNestedArray,
   unwrapPagination,
 } from '@ovds/shared';

