/**
 * @ovds/modules/banking — DTO / contract definitions.
 *
 * Zod contracts live in @ovds/contracts/schemas/banking.
 * Re-exported here so NestJS consumers can import from the canonical
 * module path without depending directly on @ovds/contracts.
 *
 * Usage (backend):
 *   import { BankingAccountSchema, BankTransactionSchema } from '@ovds/modules/banking/dto';
 */

export * from '@ovds/contracts/schemas/banking';
