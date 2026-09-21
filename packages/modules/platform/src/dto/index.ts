/**
 * @ovds/modules/platform — DTO / contract definitions.
 *
 * Platform covers App Store, feature flags, releases, and module management.
 * Zod contracts live in @ovds/contracts/schemas/monetization (app/pricing shapes)
 * and @ovds/contracts/schemas/sync (module manifest / sync shapes).
 *
 * Usage (backend):
 *   import { AppSchema, ReleaseSchema } from '@ovds/modules/platform/dto';
 */

export * from '@ovds/contracts/schemas/monetization';
export * from '@ovds/contracts/schemas/sync';
