/**
 * @ovds/ui — single export point
 *
 * This is the ONLY place UI components, hooks, utilities, and theme context
 * should be imported from across the entire OVDS monorepo.
 *
 * DO NOT import directly from sub-paths like '@ovds/ui/src/components/...'
 * DO NOT duplicate any of these in apps/frontend/src/
 */

// -- Ovds SaaS Grid-over-Card UI system --------------------------------
// GridShell: layout shell (header, actions row, metrics slot, content area)
export * from './components/GridShell';
// MetricsGrid: ReceivablesMetric, PayablesMetric, CashFlowMetric, MetricsCard, MetricsGrid
export * from './components/MetricsGrid';
// AkDataGrid: high-density data grid with hover-to-reveal row actions
export * from './components/AkDataGrid';

// -- Components ----------------------------------------------------------------
// Ovds-signature premium UI components (single source of truth)
export * from './components/AkiComponents';
export * from './components/BaseComponents';
export * from './components/AppPage';
export * from './components/NotificationBanner';
export * from './components/PipelineFlow';
export * from './components/PageWrapper';
export * from './components/ChartWidgets';
export * from './components/StatsCard';
export * from './components/Skeleton';
export * from './components/EmptyState';
export * from './components/PageHeader';
export * from './components/SortableHeader';
export * from './components/Pagination';
export * from './components/StatusBadge';
export * from './components/ContextualInsight';
export * from './components/LoadMoreButton';
export * from './components/Confirm';

// -- Advanced navigation primitives -------------------------------------------
export * from './components/NavigationPrimitives';

// -- Grid layout + dashboard primitives (single source) -------------------------
// GridLayout, GridItem, WidgetCard, StatRow, StatCell,
// ContextPill, ContextStrip, SectionTitle, FavNav
export * from './components/DashboardPrimitives';

// -- Grid Hero & page-level grid primitives ------------------------------------
// GridHero, GridHeroSlim, GridStatBar, GridStatCell,
// GridSummaryRow, GridModuleCard, GridSection
export * from './components/GridHero';

// -- v5.0 Module System components ---------------------------------------------
// ModuleDiscoveryGallery, SecuritySandbox, ModuleInstallationOverlay, ModuleInstallationBadge
export * from './components/ModuleDiscoveryGallery';
export * from './components/SecuritySandbox';
export * from './components/ModuleInstallationOverlay';

// -- Dashboard Slider (seamless multi-dashboard switching) ---------------------
export * from './components/DashboardSlider';

// -- Document Stack Layout (invoice / bill / estimate page) --------------------
export * from './components/DocStackLayout';

// -- Ovds UI components (KPI cards, page headers, stats, toolbars, etc.) -------
export * from './components/ovds';

// -- Metric Display Cards ------------------------------------------------------
export { MetricCard } from './components/dashboard/MetricCard';
export type { MetricCardProps } from './components/dashboard/MetricCard';

// -- Primitive UI components ---------------------------------------------------
export * from './components/ui/button';
export * from './components/ui/badge';
export * from './components/ui/icon';
export * from './components/ui/tooltip';
export * from './components/ui/input';
export * from './components/ui/label';
export * from './components/ui/select';
export * from './components/ui/checkbox';
export * from './components/ui/radio-group';
export * from './components/ui/switch';
export * from './components/ui/textarea';
export * from './components/ui/form';
export * from './components/ui/dialog';
export * from './components/ui/drawer';

// -- Enterprise header & offline resilience -------------------------------------
export { EnterpriseHeader } from './components/EnterpriseHeader';
export type { EnterpriseHeaderProps } from './components/EnterpriseHeader';

export { OfflineStatus } from './components/OfflineStatus';
export type { OfflineStatusProps } from './components/OfflineStatus';

export { NetworkIndicator } from './components/NetworkIndicator';
export type { NetworkIndicatorProps } from './components/NetworkIndicator';

// -- Utility components --------------------------------------------------------
export * from './components/KeyValueRow';
export * from './components/SearchInput';
export * from './components/NotificationBell';
// DataTable — re-export with explicit names to avoid SortOrder collision with useTableSort
export { DataTable } from './components/DataTable';
export type { DataTableColumn, DataTableProps, SortOrder as DataTableSortOrder } from './components/DataTable';

// -- Wizard Stepper (multi-step wizard progress indicator) ---------------------
export * from './components/WizardStepper';
// -- Advanced AI, validation, inheritance, audit, and trust UI ------------------
export * from './components/ai';
// -- New UI primitives ---------------------------------------------------------
export * from './components/FilterBar';
export * from './components/AlertBanner';
export * from './components/TabNav';
export * from './components/PrintLayout';

// -- Advanced layout system (Bento, Split, Sticky, MegaMenu, Scrolly) ----------
export * from './components/BentoGrid';
export * from './components/AdvancedLayout';

// -- Financial data table primitives ------------------------------------------
export * from './components/FinancialDataPrimitives';

// -- Progressive form components (wizard, slider, stepper, validation) ---------
export * from './components/ProgressiveFormComponents';

// -- Hooks ---------------------------------------------------------------------
export * from './hooks/useCountUp';
export * from './hooks/usePagination';
export * from './hooks/useDebounce';
export * from './hooks/useClickOutside';
export * from './hooks/useFocusTrap';
export * from './hooks/useInterval';
export * from './hooks/useKeyboardShortcut';
export * from './hooks/usePrevious';
export * from './hooks/useRelativeTime';
export * from './hooks/useTableSort';
export * from './hooks/useEscapeKey';
export * from './hooks/useLocalStorage';
export * from './hooks/useLastRefreshed';
export * from './hooks/useFormDirty';
export * from './hooks/useFormValidation';
export * from './hooks/useZodForm';
export * from './hooks/useDesignTokens';
export * from './hooks/useStatusColor';
export * from './hooks/useAnimatedValue';
export * from './hooks/useToast';
export type { StructuredToastOptions, ToastVariant } from './hooks/useToast';
export * from './hooks/useNetworkStatus';
export * from './hooks/usePageTitle';
export * from './hooks/useEthiopianTax';
// -- Module installation state machine ------------------------------------------
export * from './hooks/useModuleInstallation';

// -- New hooks ------------------------------------------------------------------
export * from './hooks/useMediaQuery';
export * from './hooks/useScrollLock';
export * from './hooks/useVirtualList';
export * from './hooks/useUrlState';
export * from './hooks/useClipboard';
export * from './hooks/useNotifications';
export * from './hooks/usePersistedState';
export * from './hooks/useDebounceCallback';
// -- Enhanced hooks ------------------------------------------------------------
export * from './hooks/useAsyncState';
export * from './hooks/useDebouncedSearch';
export * from './hooks/useMultiSelect';
export * from './hooks/useTableState';
export * from './hooks/useDisclosure';
export * from './hooks/useWindowSize';
export * from './hooks/useIdleTimer';
export * from './hooks/useKeyboardNav';
export * from './hooks/use-offline';
export * from './hooks/useApiError';

// -- Utilities -----------------------------------------------------------------
export * from './lib/utils';
export * from './lib/download';
export * from './utils/typed-api';
export * from './utils/errors';

// -- Enterprise-grade multi-entity, multi-currency, chart of accounts -----
export * from './enterprise';

// -- V&V (Verification & Validation) process screen ---------------------------
// Ovds-style V&V flow: wizard header, inline validation fields, summary
// cards, split-view comparison, sticky action footer, auto-save indicator.
export * from './components/vandv';

// -- Theme / Dark mode ---------------------------------------------------------
export { ThemeProvider, useTheme } from './context/ThemeContext';
export type { ThemeContextValue } from './context/ThemeContext';

// -- Design tokens (re-exported so app code never imports @ovds/design-system) -
// Components and app code must import tokens from '@ovds/ui', not '@ovds/design-system'
export {
  colors,
  typography,
  spacing,
  borderRadius,
  zIndex,
  shadows,
  layout,
  compact,
  animation,
  darkColors,
  // New tokens
  breakpoints,
  mediaQueries,
  iconSizes,
  statusColors,
  chartColors,
  chartGradients,
  print as printTokens,
  // v5.0 tokens
  surfaceTokens,
  brandTokens,
  typographyScales,
} from '@ovds/design-system';

// -- Shared utilities re-exported for convenience -------------------------------
// These live in @ovds/shared but are surfaced here so app code has one import
export {
  // Formatting
  fmtNum, fmtCurrency, fmtDecimal, fmtCurrencyDecimal, fmtCompact,
  fmtPct, fmtDate, fmtDateShort, fmtDateTime, fmtRelative, fmtDaysLeft,
  fmtRelativeTime, safeJsonParse,
  // New formatters
  fmtTin, fmtPhone, fmtBytes, fmtDuration, fmtOrdinal, fmtRange,
  // Ethiopian & business formatters (new)
  fmtBirr, fmtEFY, fmtTaxRate, fmtWhtRate, fmtBankAccount,
  fmtDocRef, fmtChange, fmtRatio, fmtWeight, fmtTruncate, fmtAddress, fmtInvoicePeriod,
  // Array / API response
  toArray, unwrapArray, unwrapNestedArray, unwrapPagination,
  // Status
  statusLabel, statusColor, STATUS_BADGE_VARIANTS, getStatusMetadata,
  // Tax
  ETH_TAX, PIT_BRACKETS, calculatePIT, calcVAT, calcWHT, getWhtLabel,
  calculateCorporateBIT, calculateBIT, calcDRRF, fmtETB, isVatRegistered,
  classifyIfrs18, getEthFiscalYear, getEthFiscalYearDates,
  getBITFilingDeadline, getNextVatDeadline, getNextDrrfDeadline, getVatPeriod,
  // Business roles
  prefixedRole, baseRole, allPrefixed, BUSINESS_ROLE_INHERITANCE,
  SENSITIVE_ROUTES, requiresMfa,
  // String/number utils
  truncate, toTitleCase, clamp, round,
  // New utils
  slugify, maskSensitive, capitalize, isUuid,
  lerp, pct, sum, deepEqual, pick, omit, groupBy,
  sleep, withRetry,
  // Extended utils (new)
  isValidTin, isValidEthPhone, isNonEmptyString, isPositiveNumber,
  parseDate, toDateString, startOfDay, endOfDay, addDays, daysBetween,
  unique, uniqueBy, chunk, flatten, sortBy, minOf, maxOf, avg,
  isNode, isBrowser, env,
} from '@ovds/shared';

// -- Shared types re-exported for convenience -----------------------------------
// These live in @ovds/shared but are surfaced here so app code has one import
export { Role } from '@ovds/shared';
export type { IconType } from '@ovds/shared';
export type { Bill } from '@ovds/shared';
export type { DealStage, MonetizationProduct, AlertSeverity, Alert } from '@ovds/shared';
export { CRM_STAGES, FEATURE_KEYS } from '@ovds/shared';
export type { PartnershipType, PartnershipStatus } from '@ovds/shared';
export type { ovdsSummary, InvoiceStats, VatSummary, TaxpayerStatus } from '@ovds/shared';
export type { EntitlementStatusResponse } from '@ovds/shared';
export type { TrialRestriction } from '@ovds/shared';
export type { HealthStatus, NetworkEvent } from '@ovds/shared';
export type { ApiResponse } from '@ovds/shared';
export type {
  MonetizationEntitlementDecision,
  MonetizationSubscription,
  MonetizationPurchase,
  MonetizationTrial,
  CreateSubscriptionDto,
  CreatePurchaseDto,
  StartTrialDto,
  CancelSubscriptionDto,
} from '@ovds/shared';

// -- Dashboard & reporting types ------------------------------------------------
export type {
  DashboardKpi,
  TrendPoint,
  ReportPeriodType,
  ResolvedPeriod,
  StrategicInsights,
} from '@ovds/shared';
export { resolveReportPeriod } from '@ovds/shared';

// -- Notification types ---------------------------------------------------------
export type {
  AppNotification,
  NotificationSummary,
  NotificationPriority,
  NotificationCategory,
  NotificationPreference,
} from '@ovds/shared';

// -- Budget & FX Rate types -----------------------------------------------------
export type {
  Budget,
  BudgetLineItem,
  BudgetVarianceRow,
  BudgetVarianceSummary,
  BudgetStatus,
  BudgetPeriod,
  CreateBudgetDto,
  UpdateBudgetDto,
  FxRate,
  FxRateQuery,
  CreateFxRateDto,
} from '@ovds/shared';
export { convertCurrency, crossRate } from '@ovds/shared';

// -- Audit trail types ----------------------------------------------------------
export type {
   AuditLogEntry,
   AuditLogQuery,
   AuditLogSummary,
   AuditAction,
   AuditSeverity,
 } from '@ovds/shared';
 export { diffObjects, auditSeverityForAction } from '@ovds/shared';
 
 // -- Offline types (Regulation No. 570/2025) ------------------------------------
 export type {
   OfflineInvoiceQueue,
   OfflineQueueStatus,
   OfflineInvoiceData,
   OfflineInvoiceItem,
   OfflineSyncPayload,
   UniversalInvoiceBill,
   UniversalLineItem,
   EthiopianTaxCompliance,
   OfflineCapabilities,
   RegulatedSector,
 } from '@ovds/shared';
 export { REGULATED_SECTORS } from '@ovds/shared';

// -- Payment Gateway types ------------------------------------------------------
export type {
  PaymentGateway,
  PaymentGatewayStatus,
  PaymentGatewayDirection,
  PaymentGatewayTransaction,
  PaymentGatewayConfig,
  PaymentQrPayload,
  PaymentGatewayWebhookEvent,
  GatewayReconciliationSummary,
  InitiatePaymentDto,
  PaymentWebhookResponseDto,
} from '@ovds/shared';
export { GATEWAY_FEES, GATEWAY_LABELS, calcGatewayFee } from '@ovds/shared';

// -- Ethiopian calendar & EFY types --------------------------------------------
export type { EthiopianDate, EFYPeriod } from '@ovds/shared';
export {
  ETH_MONTHS,
  gregorianToEFY, efyBounds, currentEFY,
  ethiopianMonthName, bitFilingDeadline, vatFilingDeadline,
  drrfQuarterDeadline, efyPeriodLabel, daysUntil, efyTaxDeadlines,
} from '@ovds/shared';

// -- Excise tax types (Ethiopian Proclamation 1186/2020) ------------------------
export type {
  ExciseGoodsCategory,
  ExciseTaxOrigin,
  ExciseTaxStatus,
} from '@ovds/shared';
export { calculateExciseTax, EXCISE_RATES } from '@ovds/shared';

// -- Property tax types (Ethiopian Proclamation 1161/2019) ---------------------
export type {
  PropertyTaxType,
  PropertyUseType,
  ValuationMethod,
  PropertyTaxStatus,
} from '@ovds/shared';
export {
  calculatePropertyTax,
  URBAN_LAND_RATE_ETB_PER_SQM,
  BUILDING_TAX_RATE,
  RENTAL_INCOME_TAX_RATE,
} from '@ovds/shared';

// -- Stamp duty types (Ethiopian Proclamation 110/1998) ------------------------
export type { StampDutyDocumentType } from '@ovds/shared';
export { calculateStampDuty, STAMP_DUTY_RATES } from '@ovds/shared';

// -- Pagination type -----------------------------------------------------------
export type { PaginatedResult, PaginatedResponse } from '@ovds/shared';

// -- Convenience breakpoints (from useMediaQuery) ------------------------------
export { useIsMobile, useIsTablet, useIsDesktop, useIsWide, usePrefersDark, usePrefersReducedMotion } from './hooks/useMediaQuery';

// -- Schedule D & other income taxes (Proclamation No. 1395/2025) --------------
export type {
  ScheduleDTaxType,
  CapitalGainsAssetType,
  ScheduleDCalcResult,
  ScheduleDTaxRecord,
  RentalIncomeTaxRecord,
  CustomsDutyRecord,
} from '@ovds/shared';
export {
  SCHEDULE_D_RATES,
  RENTAL_INCOME_BRACKETS,
  CORPORATE_RENTAL_RATE,
  RENTAL_ALLOWABLE_EXPENSE_PCT,
  CUSTOMS_DUTY_BANDS,
  CUSTOMS_DUTY_MIN_RATE,
  CUSTOMS_DUTY_MAX_RATE,
  calculateScheduleD,
  calculateCapitalGains,
  calculateRentalIncomeTax,
  calculateCorporateRentalTax,
  calculateCustomsDuty,
} from '@ovds/shared';

// -- General Ledger, Dual Depreciation & IFRS Accounting types -----------------
// Covers: IAS 2/9/12/15/16/19 · Ethiopian Tax Pool Depreciation (Art. 25)
export type {
  LedgerBook,
  AccountType,
  AccountSubType,
  JournalLine,
  JournalEntry,
  JournalEntrySource,
  GLAccount,
  LedgerEntry,
  TrialBalance,
  TrialBalanceLine,
  PerformanceObligation,
  PerformanceObligationStatus,
  InventoryValuationLine,
  InventoryValuationMethod,
  TaxDepreciationCategory,
  DualDepreciationLine,
  DualDepreciationSchedule,
  LeaveAccrualLine,
  SeveranceAccrual,
  EmployeeBenefitSummary,
  PermanentAdjustmentType,
  TaxReconciliationItem,
  IAS12ReconciliationBridge,
  EclProvisionLine,
  EclProvisionMatrix,
  EclStage,
  RevenueRecognitionLine,
} from '@ovds/shared';
export {
  TAX_DEPRECIATION_RATES,
  TAX_DEPRECIATION_CATEGORY_LABELS,
} from '@ovds/shared';

// -- Shared API client (single source of truth for HTTP) -----------------------
export {
  api,
  apiRequest,
  createApiClient,
  qs,
  type ApiClient,
  type ApiClientOptions,
} from './api-client';
