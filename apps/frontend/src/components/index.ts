/**
 * Components barrel export.
 * Import shared UI components from here:
 *   import { Skeleton, EmptyState, Pagination, StatsCard, PageHeader } from '../components';
 */

// -- Core UI Primitives --------------------------------------------------------
export {
  Skeleton,
  EmptyState,
  AppEmpty,
  StatusBadge,
  StatsCard,
  Pagination,
  SortableHeader,
  PageHeader,
} from './ui';
export { default as ApiErrorState } from './apiErrorState';
export { LoadMoreButton } from './ui';
export { ContextualInsight } from './ui';

export {
  PipelineBadge,
  PipelineJourney,
  PipelineFunnel,
  PipelineProgressBar,
  PipelineViewToggle,
  PipelineStageHeader,
  PipelineCard,
  KanbanBoard,
} from './pipelineComponents';
export type { PipelineView, PipelineStage, FunnelStage, KanbanColumnDef } from './pipelineComponents';

export { default as Footer } from './footer';
export { default as Header } from './header';
export { default as Layout } from './layout';
export { default as Sidebar } from './sidebar';
export { default as MobileBottomNav } from './mobileBottomNav';
export { default as SessionExpiryBanner } from './sessionExpiryBanner';
export { default as ComplianceStatusBar } from './complianceStatusBar';

export { Auth0Badge } from './auth0Badge';
export { default as Can } from './can';
export { default as RoleBadge } from './roleBadge';
export { default as PermissionTooltip } from './permissionTooltip';
export { default as RBACMatrix } from './rbacMatrix';
export { StepUpProvider, useStepUp } from './stepUpAuthModal';

export { default as ActivityFeedDrawer } from './activityFeedDrawer';
export { default as GlobalSearchModal } from './globalSearchModal';
export { default as KeyboardShortcutsModal } from './keyboardShortcutsModal';
export { default as CompanySetupWizard } from './companySetupWizard';
export { default as ScheduledExportModal } from './scheduledExportModal';
export { PaymentBatchModal } from './paymentBatchModal';
export { DeductionResolver } from './deductionResolver';
export { default as WHTCertificateModal } from './whtCertificateModal';

export { default as TelecomReceiptViewer } from './receiptViewer';
export { default as CashForecastChart } from './cashForecastChart';
export { CollectionsTable } from './collectionsTable';
export { default as InvoicesTable } from './invoicesTable';
export { InvoiceAnalytics } from './invoiceAnalytics';
export { default as LivePnLWidget } from './livePnLWidget';
export { InvoiceModalsProvider, InvoiceModals, useModals } from './invoiceModals';
export { ItemLifecycleTracker } from './itemLifecycleTracker';
export type { ItemLifecycleStage, ItemLifecycleMetrics, ItemLifecycleTrackerProps } from './itemLifecycleTracker';

export { default as PITCalculator } from './pitCalculator';

export { default as EthiopianComplianceGuide } from './ethiopianComplianceGuide';
export { default as IASBUpdateBanner } from './iasbUpdateBanner';

export { default as ColumnToggle } from './columnToggle';
export { default as DefaultTabPin } from './defaultTabPin';
export { default as AdvancedFilterBuilder } from './advancedFilterBuilder';
export { default as KPIWidgetPreview } from './kpiWidgetPreview';
export { default as WhiteLabelSettings } from './whiteLabelSettings';

// -- Blade (Akaunting-style async state machine) ---------------------------------
export {
  Blade,
  BladeLoading,
  BladeError,
  BladeSuccess,
  BladeEmpty,
} from './Blade';
export type { BladeProps } from './Blade';

// -- Charts --------------------------------------------------------------------
export {
  AttendanceTrendChart,
  PayrollCompareChart,
  RevenueExpenseChart,
  DepartmentPieChart,
  InvoiceStatusChart,
  LeaveDistributionChart,
  CashFlowChart,
  AgingChart,
  Sparkline,
  DonutGauge,
  BarGroup,
  PayrollBreakdownChart,
  AttendanceHeatmap,
  CustomerRevenueChart,
} from './ui';
