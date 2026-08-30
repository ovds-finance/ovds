/**
 * Re-export shim — settings catalog API has moved to @ovds/features/settings.
 *
 * All existing imports of '../services/settingsCatalogApi' continue to work.
 * New code should import from '@ovds/features/settings' directly.
 */
export { settingsCatalog } from '@ovds/features/settings';
export { settingsCatalog as default } from '@ovds/features/settings';

export type {
  SettingCategory,
  SettingGroup,
  SettingDefinition,
  SettingValueResponse,
  SettingOption,
} from '@ovds/features/settings';
