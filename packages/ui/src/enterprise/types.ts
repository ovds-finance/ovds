/**
 * @ovds/ui — Enterprise Types
 *
 * Multi-entity, multi-currency, global chart of accounts, saved views,
 * bulk actions, and command palette types for advanced enterprise applications.
 */

// ============================================================================
// MULTI-ENTITY / MULTI-CURRENCY
// ============================================================================

export type EntityType =
  | 'SAAS'
  | 'PROFESSIONAL_SERVICES'
  | 'RETAIL'
  | 'MANUFACTURING'
  | 'WHOLESALE'
  | 'GOVERNMENT'
  | 'NGO'
  | 'HOLDING'
  | 'SUBSIDIARY'
  | 'BRANCH';

export interface Entity {
  id: string;
  name: string;
  code: string;
  type: EntityType;
  parentId?: string | null;
  currencyCode: string;
  currencies: string[];
  isActive: boolean;
  isDefault: boolean;
  address?: string | null;
  tin?: string | null;
  vatNumber?: string | null;
  fiscalYearEnd?: string;
  timezone?: string;
  logoUrl?: string | null;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  source: 'MANUAL' | 'API' | 'AUTO';
  createdAt: string;
}

export interface CurrencyDisplayOptions {
  showSymbol: boolean;
  symbolPosition: 'BEFORE' | 'AFTER';
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
  negativeFormat: 'MINUS' | 'PARENS';
}

// ============================================================================
// GLOBAL CHART OF ACCOUNTS
// ============================================================================

export type AccountNature = 'DEBIT' | 'CREDIT';

export interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  nature: AccountNature;
  parentCode?: string;
  level: number;
  isActive: boolean;
  isSystem: boolean;
  description?: string;
  tags?: string[];
  entityIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AccountMapping {
  id: string;
  entityId: string;
  accountId: string;
  mappingType: 'DEFAULT' | 'OVERRIDE' | 'INHERIT';
  priority: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface JournalEntry {
  id: string;
  entityId: string;
  date: string;
  reference: string;
  description: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  currencyCode: string;
  fxRateId?: string;
  lines: JournalLine[];
  createdAt: string;
  createdBy: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
  debitBase?: number;
  creditBase?: number;
  currencyCode?: string;
  taxCode?: string;
  costCenter?: string;
  dimension1?: string;
  dimension2?: string;
}

// ============================================================================
// SAVED VIEWS
// ============================================================================

export interface SavedViewColumnConfig {
  key: string;
  visible: boolean;
  width?: number;
  pinned?: 'LEFT' | 'RIGHT' | null;
  order: number;
}

export interface SavedViewFilter {
  field: string;
  operator: string;
  value: unknown;
  label?: string;
}

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  tableKey: string;
  isDefault: boolean;
  isSystem: boolean;
  columns: SavedViewColumnConfig[];
  filters: SavedViewFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
  groupBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

export type BulkActionType =
  | 'DELETE'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'EXPORT'
  | 'DUPLICATE'
  | 'ASSIGN'
  | 'STATUS_CHANGE'
  | 'EMAIL'
  | 'PRINT'
  | 'TAG'
  | 'CUSTOM';

export interface BulkActionDefinition {
  key: string;
  type: BulkActionType;
  label: string;
  icon?: string;
  description?: string;
  requiresConfirmation: boolean;
  confirmationMessage?: (count: number) => string;
  minCount?: number;
  maxCount?: number;
  roles?: string[];
  execute: (ids: string[], payload?: Record<string, unknown>) => Promise<BulkActionResult>;
}

export interface BulkActionResult {
  success: string[];
  failed: { id: string; reason: string }[];
  warnings?: { id: string; message: string }[];
}

export interface BulkOperationState {
  selectedIds: Set<string>;
  totalAvailable: number;
  action: BulkActionDefinition | null;
  status: 'IDLE' | 'CONFIRMING' | 'EXECUTING' | 'COMPLETE' | 'ERROR';
  result: BulkActionResult | null;
  error?: string;
}

// ============================================================================
// COMMAND PALETTE
// ============================================================================

export interface CommandPaletteAction {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  category: string;
  keywords?: string[];
  action: () => void;
  disabled?: boolean;
  badge?: string;
}

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  actions: CommandPaletteAction[];
  recentActions: string[];
}

// ============================================================================
// ENTERPRISE TABLE CONFIG
// ============================================================================

export interface EnterpriseTableColumn<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  required?: boolean;
  groupable?: boolean;
  resizable?: boolean;
  cellRenderer?: (row: T, column: EnterpriseTableColumn<T>) => React.ReactNode;
  headerRenderer?: (column: EnterpriseTableColumn<T>) => React.ReactNode;
  sortValue?: (row: T) => string | number | null;
  hidden?: boolean;
  pinned?: 'LEFT' | 'RIGHT' | null;
  group?: string;
}

export interface EnterpriseTableProps<T> {
  data: T[];
  columns: EnterpriseTableColumn<T>[];
  storageKey: string;
  rowKey: (row: T) => string | number;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: BulkActionDefinition[];
  savedViews?: SavedView[];
  defaultViewId?: string;
  onExport?: (format: ExportFormat, options: ExportOptions) => void;
  onCommandPalette?: () => void;
  virtualize?: boolean;
  rowHeight?: number;
  overscan?: number;
  stickyHeader?: boolean;
  className?: string;
  emptyMessage?: string;
  selectionKey?: string;
  enableGrouping?: boolean;
}

// ============================================================================
// EXPORT
// ============================================================================

export type ExportFormat = 'CSV' | 'PDF' | 'EXCEL' | 'JSON';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  selectedOnly?: boolean;
  includeHeaders?: boolean;
  dateFormat?: string;
  timezone?: string;
  pageOrientation?: 'PORTRAIT' | 'LANDSCAPE';
  pageSize?: 'A4' | 'LETTER' | 'LEGAL';
  columns?: string[];
  templateId?: string;
  watermark?: string;
}

// ============================================================================
// SIDEBAR NAVIGATION
// ============================================================================

export interface NavSection {
  id: string;
  label: string;
  icon?: React.ReactNode;
  items: NavItem[];
  /** Whether the panel section starts collapsed (sub-menus folded). */
  collapsible?: boolean;
  /** Badge shown on the rail icon. */
  badge?: number | string;
  /** Regulatory grouping label (IFRS / AABE / Commercial Code …). */
  group?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** React-router path. Preferred over `href` for internal navigation. */
  to?: string;
  href?: string;
  onClick?: () => void;
  badge?: number | string;
  badgeColor?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
  disabled?: boolean;
  children?: NavItem[];
  shortcut?: string;
  roles?: string[];
  keywords?: string[];
  /** Renders a "New" pill next to the label. */
  isNew?: boolean;
  /** Pinned / favourite item. */
  pinned?: boolean;
  /** Regulatory grouping tag (IFRS, AABE, Tax Authority, …). */
  group?: string;
}

export interface SidebarState {
  collapsed: boolean;
  activeSection: string | null;
  activeItem: string | null;
  expandedSections: Set<string>;
  mobileOpen: boolean;
}

// ============================================================================
// DASHBOARD WIDGETS
// ============================================================================

export type WidgetType =
  | 'KPI_CARD'
  | 'TABLE'
  | 'CHART_LINE'
  | 'CHART_BAR'
  | 'CHART_PIE'
  | 'CHART_DONUT'
  | 'CHART_AREA'
  | 'CHART_HEATMAP'
  | 'METRIC_STRIP'
  | 'PROGRESS'
  | 'LEDGER'
  | 'TRIAL_BALANCE'
  | 'CUSTOM';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: 'SM' | 'MD' | 'LG' | 'XL' | 'FULL';
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
  refreshInterval?: number;
  permissions?: string[];
  dataSource?: string;
  entityIds?: string[];
}

// ============================================================================
// REPORTING
// ============================================================================

export type ReportType =
  | 'INCOME_STATEMENT'
  | 'BALANCE_SHEET'
  | 'CASH_FLOW'
  | 'TRIAL_BALANCE'
  | 'GENERAL_LEDGER'
  | 'AGED_RECEIVABLES'
  | 'AGED_PAYABLES'
  | 'BUDGET_VARIANCE'
  | 'TAX_SUMMARY'
  | 'IFRS_COMPLIANCE'
  | 'CUSTOM';

export interface ReportDefinition {
  id: string;
  name: string;
  type: ReportType;
  entityIds: string[];
  period: { from: string; to: string };
  currencyCode: string;
  format: ExportFormat;
  schedule?: { frequency: string; recipients: string[] };
  filters: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
}
