/**
 * @ovds/ui — ReportingPrimitives
 *
 * Enterprise reporting components for financial statements and custom reports.
 * Includes:
 *   - Financial statement layouts (Income, Balance Sheet, Cash Flow)
 *   - Report header with period and entity info
 *   - Comparative period support
 *   - Consolidation indicators
 *   - Print-ready layouts
 */

import React from 'react';
import { FileText, Printer, Download, Calendar, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ReportType, ReportDefinition, JournalLine } from './types';
import { EntitySwitcher } from './EntitySwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';

export interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  entity?: { name: string; code: string };
  period: { from: string; to: string };
  currency: string;
  reportType?: ReportType;
  onPrint?: () => void;
  onExport?: () => void;
  className?: string;
}

export function ReportHeader({
  title,
  subtitle,
  entity,
  period,
  currency,
  reportType,
  onPrint,
  onExport,
  className,
}: ReportHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--pro-azure)] text-white text-[12px] font-semibold hover:bg-[var(--pro-azure-dark)] transition-all shadow-sm shadow-[var(--pro-azure)]/20"
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
        {entity && (
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-slate-400" />
            <div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{entity.name}</p>
              <p className="text-[10px] font-mono text-slate-400">{entity.code}</p>
            </div>
          </div>
        )}

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <div>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {period.from} — {period.to}
            </p>
            <p className="text-[10px] text-slate-400">Reporting Period</p>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200 dark:border-slate-700" />

        <div>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{currency}</p>
          <p className="text-[10px] text-slate-400">Currency</p>
        </div>

        {reportType && (
          <>
            <div className="w-px h-8 bg-slate-200 dark:border-slate-700" />
            <div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {reportType.replace(/_/g, ' ')}
              </p>
              <p className="text-[10px] text-slate-400">Report Type</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export interface FinancialStatementProps {
  title: string;
  subtitle?: string;
  lines: StatementLine[];
  columns: string[];
  totals: Record<string, number>;
  onPrint?: () => void;
  onExport?: () => void;
  entity?: { name: string; code: string };
  period: { from: string; to: string };
  currency: string;
  reportType?: ReportType;
  className?: string;
}

export interface StatementLine {
  code?: string;
  description: string;
  level: number;
  isHeader?: boolean;
  isTotal?: boolean;
  isSubtotal?: boolean;
  values: Record<string, number>;
  notes?: string;
  children?: StatementLine[];
}

export function FinancialStatement({
  title,
  subtitle,
  lines,
  columns,
  totals,
  onPrint,
  onExport,
  entity,
  period,
  currency,
  reportType,
  className,
}: FinancialStatementProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <ReportHeader
        title={title}
        subtitle={subtitle}
        entity={entity}
        period={period}
        currency={currency}
        reportType={reportType}
        onPrint={onPrint}
        onExport={onExport}
      />

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[40%]">
                Description
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr
                key={index}
                className={cn(
                  'border-b border-slate-50 dark:border-slate-900/50',
                  line.isHeader && 'bg-slate-50/80 dark:bg-slate-900/60',
                  line.isTotal && 'bg-slate-100/80 dark:bg-slate-800/60 font-bold',
                  line.isSubtotal && 'bg-slate-50/50 dark:bg-slate-900/30',
                )}
              >
                <td
                  className="px-4 py-2.5"
                  style={{ paddingLeft: line.level * 16 + 16 }}
                >
                  <div className="flex items-center gap-2">
                    {line.code && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 w-12 shrink-0">
                        {line.code}
                      </span>
                    )}
                    <span
                      className={cn(
                        'text-[12px]',
                        line.isHeader && 'font-bold text-slate-800 dark:text-slate-200',
                        line.isTotal && 'font-bold text-slate-900 dark:text-slate-100',
                        line.isSubtotal && 'font-semibold text-slate-700 dark:text-slate-300',
                        !line.isHeader && !line.isTotal && !line.isSubtotal && 'text-slate-600 dark:text-slate-300',
                      )}
                    >
                      {line.description}
                    </span>
                  </div>
                  {line.notes && (
                    <p className="text-[10px] text-slate-400 mt-0.5 ml-[52px]">{line.notes}</p>
                  )}
                </td>
                {columns.map((col) => (
                  <td
                    key={col}
                    className={cn(
                      'px-4 py-2.5 text-right text-[12px] font-mono tabular-nums',
                      line.isHeader && 'font-bold text-slate-700 dark:text-slate-300',
                      line.isTotal && 'font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-600',
                      line.values[col] < 0 && !line.isHeader && 'text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {line.values[col] !== undefined
                      ? new Intl.NumberFormat('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(line.values[col])
                      : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-100/80 dark:bg-slate-800/60">
              <td className="px-4 py-3 text-[12px] font-bold text-slate-900 dark:text-slate-100">
                Total
              </td>
              {columns.map((col) => (
                <td
                  key={col}
                  className="px-4 py-3 text-right text-[12px] font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100"
                >
                  {totals[col] !== undefined
                    ? new Intl.NumberFormat('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(totals[col])
                    : '—'}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export interface TrialBalanceProps {
  accounts: { code: string; name: string; debit: number; credit: number; balance: number }[];
  period: { from: string; to: string };
  currency: string;
  entity?: { name: string; code: string };
  onPrint?: () => void;
  onExport?: () => void;
  className?: string;
}

export function TrialBalance({
  accounts,
  period,
  currency,
  entity,
  onPrint,
  onExport,
  className,
}: TrialBalanceProps) {
  const totalDebits = accounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredits = accounts.reduce((sum, a) => sum + a.credit, 0);

  return (
    <div className={cn('space-y-4', className)}>
      <ReportHeader
        title="Trial Balance"
        subtitle="Summary of all general ledger account balances"
        entity={entity}
        period={period}
        currency={currency}
        reportType="TRIAL_BALANCE"
        onPrint={onPrint}
        onExport={onExport}
      />

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[40%]">
                Account
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Debit
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Credit
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, index) => (
              <tr
                key={index}
                className="border-b border-slate-50 dark:border-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 w-12 shrink-0">
                      {account.code}
                    </span>
                    <span className="text-[12px] text-slate-700 dark:text-slate-300">{account.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right text-[12px] font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  {account.debit > 0 ? account.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right text-[12px] font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  {account.credit > 0 ? account.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                </td>
                <td
                  className={cn(
                    'px-4 py-2.5 text-right text-[12px] font-mono tabular-nums font-bold',
                    account.balance >= 0
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-rose-600 dark:text-rose-400',
                  )}
                >
                  {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-100/80 dark:bg-slate-800/60">
              <td className="px-4 py-3 text-[12px] font-bold text-slate-900 dark:text-slate-100">Total</td>
              <td className="px-4 py-3 text-right text-[12px] font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right text-[12px] font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right text-[12px] font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {(totalDebits - totalCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export interface GeneralLedgerProps {
  entries: Array<JournalLine & { date: string; reference: string; description: string }>;
  accountName?: string;
  period: { from: string; to: string };
  currency: string;
  onPrint?: () => void;
  onExport?: () => void;
  className?: string;
}

export function GeneralLedger({
  entries,
  accountName,
  period,
  currency,
  onPrint,
  onExport,
  className,
}: GeneralLedgerProps) {
  let runningBalance = 0;

  return (
    <div className={cn('space-y-4', className)}>
      <ReportHeader
        title={accountName ? `General Ledger — ${accountName}` : 'General Ledger'}
        entity={undefined}
        period={period}
        currency={currency}
        reportType="GENERAL_LEDGER"
        onPrint={onPrint}
        onExport={onExport}
      />

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reference</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Debit</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credit</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              runningBalance += (entry.debit || 0) - (entry.credit || 0);
              return (
                <tr
                  key={index}
                  className="border-b border-slate-50 dark:border-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                >
                  <td className="px-4 py-2.5 text-[12px] text-slate-600 dark:text-slate-300 font-mono">
                    {entry.date ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-slate-600 dark:text-slate-300 font-mono">
                    {entry.reference ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-slate-700 dark:text-slate-300">
                    {entry.description ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[12px] font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {entry.debit > 0 ? entry.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[12px] font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {entry.credit > 0 ? entry.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-2.5 text-right text-[12px] font-mono tabular-nums font-bold',
                      runningBalance >= 0
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
