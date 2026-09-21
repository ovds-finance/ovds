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

// ── Frontend module plugin ─────────────────────────────────────────────────────
export {
  DoubleEntryPluginConfig,
} from './plugin';
export type { ModuleUIRegistration } from './plugin';
