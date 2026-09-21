/**
 * @ovds/modules/security — DTO / contract definitions.
 *
 * Zod contracts live in @ovds/contracts/schemas/cyber-audit.
 * Re-exported here so NestJS consumers can import from the canonical
 * module path without depending directly on @ovds/contracts.
 *
 * Usage (backend):
 *   import { CyberAuditSchema, SecurityFindingSchema } from '@ovds/modules/security/dto';
 */

export * from '@ovds/contracts/schemas/cyber-audit';
