/**
 * UI barrel — re-exports everything from @ovds/ui.
 *
 * This is the bridge between app code and the centralized UI library.
 * Nothing is defined here — everything comes from @ovds/ui.
 */
export {
  // -- Design token helpers --------------------------------------------------
  tk,
  cn,
  // Design tokens (re-exported from @ovds/design-system via @ovds/ui)
  colors,
  typography,
  spacing,
  borderRadius,
  zIndex,
  shadows,
  layout,
  compact,

  // -- Layout / page shells --------------------------------------------------
  PageShell,
  AppPage,
  AppTabs,
  AppKpi,
  AppTable,
  AppTh,
  AppTd,
  AppTr,
  AppGrid,
  AppCard,
  AppSection,
  AppSearch,
  AppFilterBar,
  AppBadge,
  AppStat,
  AppEmpty,
  AppSkeleton,
  AppActionBar,
  PageWrapper,

  // -- Notification / banners ------------------------------------------------
  Banner,
  Sticker,
  DeadlineBanner,
  NotifDot,
  InlineAlert,
  IFRSBadge,
  EthTaxDeadlines,
  type BannerVariant,

  // -- Data display ---------------------------------------------------------
  BaseForm,
  BaseTable,
  DataTable,
  KpiStrip,
  StatsCard,
  Skeleton,
  EmptyState,
  Pagination,
  SortableHeader,
  PageHeader,
  LoadMoreButton,

  // -- Status & badges -------------------------------------------------------
  StatusBadge,
  Badge,
  badgeVariants,
  EthTaxBadge,
  Amount,

  // -- Primitives ------------------------------------------------------------
  Btn,
  Button,
  buttonVariants,
  Card,
  Modal,
  FormField,
  Input,
  Select,
  Textarea,
  IconBox,
  BlueIcon,
  Divider,
  Toolbar,
  SearchBar,
  Breadcrumb,
  SectionLabel,
  PipelineBar,
  ContextualInsight,
  type InsightVariant,
  type ContextualInsightProps,

  // -- Advanced AI / validation / inheritance / audit -------------------------
  AiConfidenceBadge,
  AiPromptTrigger,
  AiDiffViewer,
  AiAcceptRejectActions,
  InheritanceBadge,
  InheritanceOverrideToggle,
  ImpactAnalysisModal,
  DependencyTreeMap,
  ValidationSidebar,
  DualAuthorizationGate,
  AuditTrailDrawer,
  SmartSaveButton,
  SmartSearchInput,
  ToastStack,
  type AiConfidenceLevel,
  type ValidationSeverity,
  type InheritanceStatus,
  type SaveReadiness,
  type AiConfidenceBadgeProps,
  type AiPromptTriggerProps,
  type AiDiffViewerProps,
  type AiAcceptRejectActionsProps,
  type InheritanceBadgeProps,
  type InheritanceOverrideToggleProps,
  type ImpactAnalysisModalProps,
  type DependencyTreeNode,
  type DependencyTreeMapProps,
  type ValidationIssue,
  type ValidationSidebarProps,
  type DualAuthorizationApprover,
  type DualAuthorizationGateProps,
  type AuditTrailEntry,
  type AuditTrailDrawerProps,
  type SmartSaveButtonProps,
  type ToastItem,
  type ToastStackProps,
  type SmartSearchSuggestion,
  type SmartSearchInputProps,

  // -- Navigation ---------------------------------------------------------------
  FavNav,
  type FavNavProps,

  // -- Grid / Layout -----------------------------------------------------------
  GridLayout,
  GridItem,
  GridSection,
  GridStatBar,
  GridStatCell,
  WidgetCard,
  StatRow,
  StatCell,
  ContextStrip,
  ContextPill,
  SectionTitle,

  // -- Icons -----------------------------------------------------------------
  Icon,
  type IconProps,

  // -- Pipeline / Kanban -----------------------------------------------------
  PipelineFlow,
  KanbanBoard,
  ProgressPipeline,
  RouteIndicator,
  type FlowStage,
  type StageStatus,
  type KanbanColumn,

  // -- Charts ----------------------------------------------------------------
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

  // -- ovds UI ------------------------------------------------------------
  MetricCard,
  type MetricCardProps,
  ovdsKpiCard,
  ovdsPageHeader,
  ovdsSummaryBar,
  ovdsStatsStrip,
  ovdsToolbar,
  ovdsEmptyState,
  ovdsNavCard,
  ovdsHealthScore,
  type ovdsTab,
  type StripStat,

  // -- Utilities (from @ovds/shared via @ovds/ui) ---------------------------
  // Formatting
  fmtNum, fmtCurrency, fmtDecimal, fmtCurrencyDecimal, fmtCompact,
  fmtPct, fmtDate, fmtDateShort, fmtDateTime, fmtRelative, fmtDaysLeft,
  fmtRelativeTime, safeJsonParse,
  // Array / API response
  toArray, unwrapArray, unwrapNestedArray, unwrapPagination,
  // Status
  statusLabel, statusColor, STATUS_BADGE_VARIANTS, getStatusMetadata,
  // Download (browser)
  downloadBlob, downloadCSV, downloadJSON,
  // Confirm / Prompt dialogs
  confirm, prompt,
  useConfirm,
  type UseConfirmOptions,
  type ConfirmVariant,

  // -- Hooks -----------------------------------------------------------------
  useCountUp,
  usePagination,
  useDebounce,
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

  // -- Theme -----------------------------------------------------------------
  ThemeProvider,
  useTheme,
  type ThemeContextValue,
} from '@ovds/ui';

// -- Page pin (star-to-favorites) -------------------------------------------
export { default as PagePinButton } from './PagePinButton';
