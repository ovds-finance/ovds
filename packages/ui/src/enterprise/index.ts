/**
 * @ovds/ui — Enterprise Components
 *
 * Central export point for all enterprise-grade UI components:
 *   - Multi-entity / multi-currency infrastructure
 *   - Global chart of accounts browser
 *   - Enterprise data tables (dense, virtualized, bulk-aware)
 *   - Command palette, sidebar navigation
 *   - Saved views, bulk action toolbars
 *   - Progressive disclosure panels
 *   - Export system
 *   - Reporting primitives
 *
 * Import from '@ovds/ui' in app code — never from sub-paths.
 */

// -- Core enterprise infrastructure -------------------------------------------
export { EntityCurrencyProvider, useEntityCurrency, useEntity, useCurrencyConverter } from './EntityCurrencyContext';
export type { EntityCurrencyProviderProps } from './EntityCurrencyContext';

// -- Enterprise components ----------------------------------------------------
export {
  SidebarNavigation,
  MobileSidebar,
} from './SidebarNavigation';
export type { SidebarNavigationProps, MobileSidebarProps } from './SidebarNavigation';

export { CommandPalette } from './CommandPalette';
export type { CommandPaletteProps } from './CommandPalette';

export { BulkActionToolbar } from './BulkActionToolbar';
export type { BulkActionToolbarProps } from './BulkActionToolbar';

export { EnterpriseTable } from './EnterpriseTable';

export { ChartOfAccountsBrowser } from './ChartOfAccountsBrowser';
export type { ChartOfAccountsBrowserProps } from './ChartOfAccountsBrowser';

export { CurrencySwitcher } from './CurrencySwitcher';
export type { CurrencySwitcherProps } from './CurrencySwitcher';

export { EntitySwitcher } from './EntitySwitcher';
export type { EntitySwitcherProps } from './EntitySwitcher';

export { SavedViewSelector } from './SavedViews';
export type { SavedViewSelectorProps } from './SavedViews';

export { ExportMenu } from './ExportSystem';
export type { ExportButtonProps } from './ExportSystem';

export {
  ReportHeader,
  FinancialStatement,
  TrialBalance,
  GeneralLedger,
} from './ReportingPrimitives';
export type {
  ReportHeaderProps,
  FinancialStatementProps,
  StatementLine,
  TrialBalanceProps,
  GeneralLedgerProps,
} from './ReportingPrimitives';

export {
  DisclosureSection,
  DisclosureTabs,
  AdvancedFieldGroup,
  ExpandableCard,
} from './ProgressiveDisclosure';
export type {
  DisclosureSectionProps,
  DisclosureTab,
  DisclosureTabsProps,
  AdvancedFieldGroupProps,
  ExpandableCardProps,
} from './ProgressiveDisclosure';

// -- ERP Accounting Sidebar Menu (IFRS, Commercial Code, AABE) ----------------
export {
  erpMenuSections,
  erpQuickActions,
  ifrsStandards,
  commercialCodeArticles,
  aabeRegulations,
} from './erpMenu';

// -- Ovds SaaS tree-view sidebar --------------------------------------
export {
  TreeViewSidebar,
} from './TreeViewSidebar';
export type {
  TreeViewSidebarProps,
  TreeViewCompany,
  TreeViewNotification,
  TreeViewProfile,
  TreeViewQuickAction,
  TreeViewAction,
} from './TreeViewSidebar';

export {
  ConsolidatedSidebar,
} from './ConsolidatedSidebar';
export type {
  ConsolidatedSidebarProps,
} from './ConsolidatedSidebar';

// -- Enterprise types ---------------------------------------------------------
export type {
  Entity,
  EntityType,
  CurrencyRate,
  CurrencyDisplayOptions,
  GLAccount,
  AccountMapping,
  JournalEntry,
  JournalLine,
  SavedView,
  SavedViewColumnConfig,
  SavedViewFilter,
  BulkActionDefinition,
  BulkActionResult,
  BulkOperationState,
  CommandPaletteAction,
  CommandPaletteState,
  EnterpriseTableProps,
  ExportFormat,
  ExportOptions,
  NavSection,
  NavItem,
  SidebarState,
  DashboardWidget,
  WidgetType,
  ReportDefinition,
  ReportType,
  AccountNature,
} from './types';

// -- Enterprise hooks ---------------------------------------------------------
export {
  useSavedViews,
  useBulkActions,
  useCommandPalette,
  useEnterpriseTable,
  useFXRate,
  useChartOfAccounts,
  useJournalEntryBuilder,
} from './hooks';
export type {
  UseSavedViewsOptions,
  UseSavedViewsResult,
  UseBulkActionsOptions,
  UseBulkActionsResult,
  UseCommandPaletteOptions,
  UseCommandPaletteResult,
  UseEnterpriseTableOptions,
  UseEnterpriseTableResult,
  UseFXRateOptions,
  UseFXRateResult,
  UseChartOfAccountsOptions,
  UseChartOfAccountsResult,
  JournalEntryBuilderOptions,
  JournalEntryBuilderResult,
} from './hooks';
