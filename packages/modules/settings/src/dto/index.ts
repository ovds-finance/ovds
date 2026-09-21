/**
 * @ovds/modules/settings — DTO / contract definitions.
 *
 * Zod contracts live in @ovds/contracts/schemas/settings.
 * Re-exported here so NestJS consumers can import from the canonical
 * module path without depending directly on @ovds/contracts.
 *
 * Usage (backend):
 *   import { SettingCategorySchema, AppModuleSchema } from '@ovds/modules/settings/dto';
 *   import { SecuritySettingsDtoSchema } from '@ovds/modules/settings/dto';
 */

export * from '@ovds/contracts/schemas/settings';
