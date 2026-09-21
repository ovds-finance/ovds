/**
 * @ovds/modules/ledger — DTO / contract definitions.
 *
 * The General Ledger module covers chart-of-accounts, journal entries,
 * sub-ledger entries, and double-entry accounting contracts.
 * Zod schemas live in @ovds/contracts/schemas/accounting and sub-ledger.
 *
 * Usage (backend):
 *   import { AccountSchema, JournalEntrySchema } from '@ovds/modules/ledger/dto';
 *   import { SubLedgerEntrySchema } from '@ovds/modules/ledger/dto';
 */

export * from '@ovds/contracts/schemas/accounting';
export * from '@ovds/contracts/schemas/sub-ledger';
