/**
 * @ovds/features/helpdesk — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  ticketsApi, knowledgeBaseApi
} from './services/helpdeskApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useTickets
} from './hooks/useTickets';
