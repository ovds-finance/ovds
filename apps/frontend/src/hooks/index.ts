/**
 * Hooks barrel export.
 *
 * Pure utility hooks are centralized in @ovds/ui — re-exported here for
 * backward-compatible local imports.
 *
 * App-specific hooks (those using useAuth, api, useBusiness, etc.) remain local.
 */

// -- Pure utility hooks (from @ovds/ui) ---------------------------------------
export {
  useCountUp,
  usePagination,
  useDebounce,
  useDebounceCallback,
  useClickOutside,
  useFocusTrap,
  useInterval,
  useKeyboardShortcut,
  usePrevious,
  useRelativeTime,
  useTableSort,
  useEscapeKey,
  useLocalStorage,
  useLastRefreshed,
  useFormDirty,
  useFormValidation,
  useAnimatedValue,
  useNetworkStatus,
  usePageTitle,
  useEthiopianTax,
  usePersistedState,
  // Breakpoint hooks
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsWide,
  usePrefersDark,
  usePrefersReducedMotion,
  // New utility hooks
  useScrollLock,
  useVirtualList,
  useUrlState,
  useClipboard,
  useNotifications,
  // Enhanced hooks (new)
  useAsyncState,
  useDebouncedSearch,
  useMultiSelect,
  useTableState,
  useDisclosure,
  useDisclosureWithData,
  useWindowSize,
  useIdleTimer,
} from '@ovds/ui';
export type {
  NetworkQuality,
  NetworkStatus,
  TaxLineItem,
  TaxSummary,
  AppNotification,
  NotificationSummary,
  NotificationPriority,
  NotificationCategory,
  AsyncStatus,
  AsyncState,
  DebouncedSearch,
  MultiSelect,
  TableState,
  TableQuery,
  Disclosure,
  DisclosureWithData,
  WindowSize,
} from '@ovds/ui';

// -- Data fetching (app-specific — use api service) ----------------------------
export {
  useApiQuery,
  buildApiQueryError,
  invalidateQuery,
  invalidateQueryPrefix,
  clearQueryCache,
  getCacheData,
  setCacheData,
  type ApiQueryError,
} from './useApiQuery';
export { useMutation, type MutationError, type MutationMethod } from './useMutation';
export { useInfiniteScroll } from './useInfiniteScroll';
export {
  useApiPaginated,
  type UseApiPaginatedResult,
  type UseApiPaginatedOptions,
} from './useApiPaginated';

// -- Error handling ------------------------------------------------------------
export { usePageError, type PageError } from './usePageError';
export { useErrorHandler, parseApiError } from './useErrorHandler';

// -- Search --------------------------------------------------------------------
export { useSearch } from './useSearch';

// -- Offline resilience --------------------------------------------------------
export {
  useOfflineResilience,
  type OfflineCapabilities,
  type OfflineSLAReport,
  type OfflineSLAViolation,
} from './useOfflineResilience';

// -- Consolidation, ledger integrity & VAT apportionment ----------------------
export {
  useConsolidatedSummary,
  useEliminations,
  useUnmatchedBalances,
  useRunEliminations,
  useReverseElimination,
  useLedgerIntegrity,
  useAutoApportionment,
  type Elimination,
  type UnmatchedBalance,
  type RunEliminationsResult,
  type LedgerIntegrityResult,
  type AutoApportionmentResult,
  type UseConsolidatedSummaryResult,
  type UseEliminationsResult,
  type UseUnmatchedBalancesResult,
  type UseRunEliminationsResult,
  type UseReverseEliminationResult,
  type UseLedgerIntegrityResult,
  type UseAutoApportionmentResult,
} from './useConsolidation';

// -- Network & health ----------------------------------------------------------

// -- Auth & RBAC ---------------------------------------------------------------
export { useRbac, useRBAC } from './useRbac';
export { usePermissionGuard } from './usePermissionGuard';
export { useRouteGuard } from './useRouteGuard';
export { useModuleGuard } from './useModuleGuard';
export { useAuditLog } from './useAuditLog';
export { useSessionRefresh } from './useSessionRefresh';

// -- UI utilities (app-specific) -----------------------------------------------
export { useToast } from '@ovds/ui';
export { useConfirm } from './useConfirm';
export type { UseConfirmOptions, ConfirmVariant } from './useConfirm';
export { useWebSocket } from './useWebSocket';
export { useFinancialAlerts } from './useFinancialAlerts';

// -- Auth0 ---------------------------------------------------------------------
export { useAuth0Session } from './useAuth0Session';
export { useAuth0Status } from './useAuth0Status';

// -- IFRS & Compliance ---------------------------------------------------------
export { useIFRSAccess } from './useIfrsAccess';
export type { IFRSAccess } from './useIfrsAccess';

// -- Payroll -------------------------------------------------------------------
export { usePayrollStats } from './usePayrollStats';
export type { PayrollStats } from './usePayrollStats';

// -- Navigation ----------------------------------------------------------------
export { useRoleRedirect } from './useRoleRedirect';

// -- i18n ----------------------------------------------------------------------
export { useLangSync } from './useLangSync';

// -- Ethiopian tax -------------------------------------------------------------

// -- Generic CRUD --------------------------------------------------------------
export { useApiCrud, type CrudOptions, type CrudState } from './useApiCrud';

// -- ovds Summary -----------------------------------------------------------
export { useOvdsSummary, type UseOvdsSummaryResult } from './useOvdsSummary';

// -- Monetization --------------------------------------------------------------
export { useMonetization } from './useMonetization';

// -- Performance & UX ----------------------------------------------------------
export { usePrefetch } from './usePrefetch';
export { useRecentItems, type RecentItem, type UseRecentItemsResult } from './useRecentItems';
export { useKeyboardNav, type UseKeyboardNavResult, type UseKeyboardNavOptions } from '@ovds/ui';

// -- Blade state (Ovds SaaS style deterministic UI states) ----------------------
export {
  useBladeState,
  type BladeState,
  type UseBladeStateResult,
  type ApiError as BladeApiError,
} from './useBladeState';

// -- Page pin ------------------------------------------------------------------
export { usePagePin, type PagePinItem } from './usePagePin';

// -- Inline math ---------------------------------------------------------------
export { useInlineMath, useSmartQuantity } from './useInlineMath';

// -- Business registration wizard ----------------------------------------------
export { useBusinessRegistration } from './useBusinessRegistration';

// -- Export & Bulk actions ------------------------------------------------------
export { useExport, type UseExportOptions, type ExportFormat } from './useExport';
export { useBulkAction, type BulkActionState } from './useBulkAction';

// -- oRPC (type-safe contracts) ------------------------------------------------
export {
  useOrpcQuery,
  useOrpcMutation,
  useOrpcInfiniteQuery,
  useQueryClient as useOrpcQueryClient,
} from './useOrpc';
export { orpc, orpcUtils } from '../lib/orpc';

// -- Custom Fields -------------------------------------------------------------
export {
  useCustomFields,
  useCustomFieldDefs,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
  type UseCustomFieldsResult,
} from './useCustomFields';

// -- Inventory (oRPC-backed) ---------------------------------------------------
export {
  useItems,
  useItem,
  useItemMutations,
  useItemGroups,
  useItemGroupMutations,
  useWarehouses,
  useWarehouse,
  useWarehouseMutations,
  useStockTransactions,
  useInventoryAdjustments,
  useStockSummary,
  useInventoryPage,
  inventoryKeys,
} from './useInventory';
export type {
  ListItemsQuery,
  CreateItem,
  UpdateItem,
  CreateWarehouse,
  CreateItemGroup,
  CreateStockAdjustment,
} from './useInventory';

// -- Offline queue -------------------------------------------------------------
export { useOfflineQueue, type UseOfflineQueueReturn } from './useOfflineQueue';
