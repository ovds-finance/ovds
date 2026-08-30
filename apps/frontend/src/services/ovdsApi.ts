/**
 * Re-export shim — ovdsApi has moved to @ovds/features/accounting.
 * All existing imports continue to work unchanged.
 * New code: import { ... } from '@ovds/features/accounting';
 */
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
} from '@ovds/features/accounting';
