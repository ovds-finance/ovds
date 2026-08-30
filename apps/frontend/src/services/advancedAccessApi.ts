/**
 * Re-export shim — advanced access API has moved to @ovds/features/settings.
 *
 * All existing imports of '../services/advancedAccessApi' continue to work.
 * New code should import from '@ovds/features/settings' directly.
 */
export { advancedAccessApi } from '@ovds/features/settings';
export type { RolePermissionOverrideDTO } from '@ovds/features/settings';
