/**
 * @ovds/features/double-entry — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  journalEntriesApi, ledgerEntriesApi, chartOfAccountsApi
} from './services/doubleEntryApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useJournalEntries
} from './hooks/useJournalEntries';
