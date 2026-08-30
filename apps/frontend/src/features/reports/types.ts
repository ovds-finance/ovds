export type AccountingBasis = 'accrual' | 'cash';
export type ExportFormat = 'pdf' | 'csv' | 'xlsx';
export type ScheduleFrequency = 'weekly' | 'monthly' | 'yearly';
export type ReportCategory = 'standard' | 'modular';
export type ReportStatus = 'draft' | 'running' | 'completed' | 'failed';

export interface ReportPeriod {
  start: string;
  end: string;
}

export interface ReportConfig {
  reportId: string;
  basis: AccountingBasis;
  period: ReportPeriod;
  groupBy?: string;
  currency?: string;
}

export interface KpiCell {
  label: string;
  value: string | number;
  color?: string;
}

export interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
}

export interface ReportRow {
  [key: string]: unknown;
}

export interface NormalizedReport {
  reportId: string;
  companyId: string;
  currency: string;
  generatedAt: string;
  basis: AccountingBasis;
  period: ReportPeriod;
  kpis: KpiCell[];
  columns: ReportColumn[];
  rows: ReportRow[];
  raw: unknown;
}

export interface ReportTemplate {
  id: string;
  category: ReportCategory;
  title: string;
  description: string;
  icon: string;
  permission: string;
  basisSupported: AccountingBasis[];
  endpoint: string;
  groupByOptions: string[];
}

export interface ScheduleEntry {
  id: string;
  name: string;
  reportId: string;
  format: ExportFormat;
  frequency: ScheduleFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  email: string;
  active: boolean;
  lastRun?: string;
  nextRun?: string;
}

export const REPORT_CATEGORIES = ['standard', 'modular'] as const;
