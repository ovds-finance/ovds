/**
 * @ovds/modules/tax — DTO / contract definitions.
 *
 * Zod contracts live in @ovds/contracts/schemas/tax.
 * Re-exported here so NestJS consumers can import from the canonical
 * module path without depending directly on @ovds/contracts.
 *
 * Usage (backend):
 *   import { VatFilingSchema, WhtCertificateSchema } from '@ovds/modules/tax/dto';
 */

export * from '@ovds/contracts/schemas/tax';
