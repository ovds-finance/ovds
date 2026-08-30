/**
 * @ovds/features/crm — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  crmContactsApi, crmDealsApi, crmPipelinesApi, crmActivitiesApi, crmTasksApi
} from './services/crmApi';

export type { CrmListParams } from './services/crmApi';
// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useCrmContacts, useCrmDeals, useCrmDealStats
} from './hooks/useCrm';
