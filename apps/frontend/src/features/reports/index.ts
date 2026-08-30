/**
 * Re-export shim — reports feature has moved to @ovds/features/reporting.
 *
 * All existing imports of '../features/reports' continue to work.
 * New code should import from '@ovds/features/reporting' directly.
 */
export {
  ReportGallery,
  ReportViewer,
  ReportBuilder,
  ScheduledDeliveryModal,
  STANDARD_REPORTS,
  MODULAR_REPORTS,
  ALL_TEMPLATES,
  findTemplate,
  templatesByCategory,
  BASIS_OPTIONS,
  normalizeReport,
  fmtMoney,
  fmtNumber,
  fmtCell,
  fetchReportJson,
  fetchReport,
  exportReportBlob,
  downloadCSV,
  downloadReportData,
  defaultPeriod,
} from '@ovds/features/reporting';

export type {
  AccountingBasis,
  ExportFormat,
  ScheduleFrequency,
  ReportCategory,
  ReportStatus,
  ReportPeriod,
  ReportConfig,
  KpiCell,
  ReportColumn,
  ReportRow,
  NormalizedReport,
  ReportTemplate,
  ScheduleEntry,
} from '@ovds/features/reporting';
