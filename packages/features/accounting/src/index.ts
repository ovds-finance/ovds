/**
 * @ovds/features/accounting
 *
 * Accounting domain feature library — hooks, API clients, types.
 * Import from this package in frontend pages/components.
 *
 * Scope: frontend (scope:frontend, type:feature)
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  customersApi,
  vendorsApi,
  itemsApi,
  bankAccountsApi,
  taxRatesApi,
  companiesApi,
  ovdsSummaryApi,
  accountsApi,
  journalEntriesApi,
  fixedAssetsApi,
  periodCloseApi,
  budgetApi,
  partnershipsApi,
  integrationsApi,
  currencyApi,
  validationApi,
  inventoryOvdsApi,
  invoicesApi,
  estimatesApi,
  fixedAssetDisposalsApi,
  entityGroupsApi,
  translationReservesApi,
  reportDefinitionsApi,
  reportLinesApi,
  periodCloseWorkflowApi,
} from './services/ovdsApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export { useOvdsSummary }     from './hooks/useOvdsSummary';
export type { UseOvdsSummaryResult } from './hooks/useOvdsSummary';

export { useJournalEntries }  from './hooks/useJournalEntries';
export type { JournalFilters, UseJournalEntriesResult } from './hooks/useJournalEntries';

export { useAccounts }        from './hooks/useAccounts';
export type { AccountNode, UseAccountsResult } from './hooks/useAccounts';

export { useTrialBalance }    from './hooks/useTrialBalance';
export type { UseTrialBalanceResult } from './hooks/useTrialBalance';

export function useEstimatesList() {
  return { data: null as { data: any[] } | null, isLoading: false, refetch: () => Promise.resolve() };
}
export function useCreateEstimate() {
  return { mutateAsync: async (_: any): Promise<any> => ({}), isPending: false };
}
export function useDeleteEstimate() {
  return { mutateAsync: async (_: any): Promise<any> => ({}), isPending: false };
}
