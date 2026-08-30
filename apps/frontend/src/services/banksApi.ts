/**
 * Re-export shim — banking APIs have moved to @ovds/features/banking.
 *
 * All existing imports of '../services/banksApi' continue to work.
 * New code should import from '@ovds/features/banking' directly.
 */
export type { BankTransaction, TransactionListParams } from '@ovds/features/banking';
