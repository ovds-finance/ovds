/**
 * @ovds/features/banking
 *
 * Banking domain feature library — hooks, API clients, types.
 * Covers: Bank Accounts, Transactions, Reconciliation, FX Rates, Treasury.
 *
 * Scope: frontend (scope:frontend, type:feature)
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  bankAccountsApi,
  bankTransactionsApi,
  reconciliationApi,
  fxRatesApi,
} from './services/bankingApi';

export type { BankAccountListParams } from './services/bankingApi';

export type { BankTransaction, TransactionListParams } from './types/banking.types';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useBankAccounts,
  useBankAccountMutations,
  useBankTransactions,
  useReconciliationStatus,
} from './hooks/useBankAccounts';
