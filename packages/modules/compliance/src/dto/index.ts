/**
 * @ovds/modules/compliance — DTO / contract definitions.
 *
 * Zod contracts live in @ovds/contracts/schemas/compliance.
 * Re-exported here so NestJS consumers can import from the canonical
 * module path without depending directly on @ovds/contracts.
 *
 * Usage (backend):
 *   import { ComplianceCheckSchema } from '@ovds/modules/compliance/dto';
 */

export * from '@ovds/contracts/schemas/compliance';
