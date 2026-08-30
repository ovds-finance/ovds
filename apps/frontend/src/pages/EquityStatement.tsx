/**
 * IAS 1 — Statement of Changes in Equity
 *
 * One of the five primary IFRS financial statements (IAS 1.10):
 *   1. Statement of Financial Position (Balance Sheet)
 *   2. Statement of Profit or Loss (P&L)
 *   3. Statement of Other Comprehensive Income
 *   4. Statement of Cash Flows
 *   5. Statement of Changes in Equity  ← this page
 *
 * Shows per equity account:
 *   Opening Balance | Net Profit | Other Movements | Dividends | OCI | Closing Balance
 */
import React, { useState } from 'react';
import {
  RefreshCw, Download, Info, TrendingUp,
  TrendingDown, Minus, BookOpen,
} from 'lucide-react';
import { AppPage, Btn } from '@ovds/ui';
import { useEquityMovements, type EquityMovementRow } from '../services/reportsApi';
import type { EquityMovementStatement } from '@ovds/features/reporting';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { fmtCurrency } from '../utils/fmt';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (n: number) => fmtCurrency(n, 'ETB');
const fmtDiff = (n: number) => n === 0 ? '—' : (n > 0 ? '+' : '') + fmt(n);

const today     = new Date();
const startOfYear = `${today.getFullYear()}-01-01`;
const todayStr    = today.toISOString().slice(0, 10);

// -- Column config -------------------------------------------------------------
const COLS: Array<{
  key: keyof EquityMovementRow | 'closingBalance';
  label: string;
  hint: string;
  cls: string;
}> = [
  { key: 'openingBalance',         label: 'Opening Balance',       hint: 'Balance at start of period',             cls: 'text-slate-700' },
  { key: 'netProfitForPeriod',     label: 'Net Profit / (Loss)',   hint: 'P&L result credited to retained earnings', cls: 'text-emerald-700' },
  { key: 'otherMovements',         label: 'Other Movements',       hint: 'Capital injections, revaluations, etc.',  cls: 'text-sky-700' },
  { key: 'dividendsPaid',          label: 'Dividends Paid',        hint: 'Distributions to shareholders (debit)',   cls: 'text-rose-600' },
  { key: 'otherComprehensiveIncome', label: 'OCI',                 hint: 'Other comprehensive income (IAS 1.82A)',  cls: 'text-violet-700' },
  { key: 'closingBalance',         label: 'Closing Balance',       hint: 'Balance at end of period',               cls: 'text-slate-800 font-bold' },
];

// -- Row component -------------------------------------------------------------
const EquityRow: React.FC<{ row: EquityMovementRow; isTotal?: boolean }> = ({ row, isTotal }) => {
  const change = row.closingBalance - row.openingBalance;
  return (
    <tr className={`${isTotal ? 'bg-white border-t-2 border-slate-200 font-semibold' : 'hover:bg-slate-50/60 border-b border-slate-50'} transition-colors`}>
      <td className={`px-4 py-3 text-sm ${isTotal ? 'font-bold text-slate-800' : 'text-slate-700'}`}>
        {isTotal ? 'Total Equity' : (
          <div>
            <p className="font-medium">{row.accountName}</p>
            <p className="text-[10px] text-slate-400 font-mono">{row.accountCode}</p>
          </div>
        )}
      </td>
      {COLS.map(col => {
        const val = col.key === 'closingBalance' ? row.closingBalance : (row as any)[col.key];
        const isNeg = col.key === 'dividendsPaid' ? val > 0 : val < 0;
        return (
          <td key={col.key} className={`px-4 py-3 text-sm tabular-nums text-right ${col.cls} ${isNeg && col.key !== 'dividendsPaid' ? '!text-rose-600' : ''}`}>
            {val === 0 && !isTotal ? <span className="text-slate-200">—</span> : (
              col.key === 'dividendsPaid' && val > 0
                ? <span className="text-rose-600">({fmt(val)})</span>
                : fmt(Math.abs(val) === val ? val : val)
            )}
          </td>
        );
      })}
      <td className="px-4 py-3 text-sm text-right">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
          change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-slate-400'
        }`}>
          {change > 0 ? <TrendingUp size={11} /> : change < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
          {fmtDiff(change)}
        </span>
      </td>
    </tr>
  );
};

// -- Main page -----------------------------------------------------------------
const EquityStatement: React.FC = () => {
  usePageTitle('Statement of Changes in Equity');
  const { selectedCompanyId } = useBusiness();
  const [startDate, setStartDate] = useState(startOfYear);
  const [endDate,   setEndDate]   = useState(todayStr);
  const [exporting, setExporting] = useState(false);

  const { data, loading, refetch } = useEquityMovements(
    selectedCompanyId ?? undefined,
    startDate,
    endDate,
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const q = new URLSearchParams({ report: 'equity', startDate, endDate });
      if (selectedCompanyId) q.set('companyId', selectedCompanyId);
      const res = await api.get(`/ovds/reports/export-pdf?${q}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `equity-statement-${endDate}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  const totals = data?.totals;

  return (
    <AppPage
      title="Changes in Equity"
      subtitle="IAS 1.106 — Statement of Changes in Equity (primary IFRS financial statement)"
      icon={<BookOpen size={18} />}
      iconBg="bg-violet-500"
      crumbs={[{ label: 'Reports' }, { label: 'Equity Statement' }]}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <label>From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
            <label>To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
          </div>
          <Btn variant="secondary" size="sm"
            icon={loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            onClick={refetch} disabled={loading}>
            Refresh
          </Btn>
          <Btn variant="secondary" size="sm"
            icon={exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            onClick={handleExport} disabled={exporting || loading}>
            Export PDF
          </Btn>
        </div>
      }
    >
      <div className="space-y-5">

        {/* -- Totals KPI strip -- */}
        {totals && (
          <div className="ovds-stat-row">
            {[
              { label: 'Opening Equity',    value: fmt(totals.openingBalance),    accent: 'bg-slate-400' },
              { label: 'Net Profit',        value: fmt(totals.netProfitForPeriod),accent: totals.netProfitForPeriod >= 0 ? 'bg-emerald-500' : 'bg-rose-500' },
              { label: 'Other Movements',   value: fmt(totals.otherMovements),    accent: 'bg-sky-500' },
              { label: 'Dividends',         value: fmt(totals.dividendsPaid),     accent: totals.dividendsPaid > 0 ? 'bg-rose-400' : 'bg-slate-200' },
              { label: 'Closing Equity',    value: fmt(totals.closingBalance),    accent: totals.closingBalance >= 0 ? 'bg-violet-500' : 'bg-rose-500' },
            ].map(kpi => (
              <div key={kpi.label} className="ovds-kpi-cell">
                <div className={`w-1 h-8 rounded-full shrink-0 ${kpi.accent}`} />
                <div>
                  <p className="ovds-value-sm tabular-nums">{kpi.value}</p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* -- IAS 1 header -- */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Statement of Changes in Equity</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                For the period {new Date(startDate).toLocaleDateString('en-ET', { day: 'numeric', month: 'long', year: 'numeric' })} to {new Date(endDate).toLocaleDateString('en-ET', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">IAS 1.106 — All amounts in Ethiopian Birr (ETB)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-white z-10 min-w-[180px]">
                    Equity Component
                  </th>
                  {COLS.map(col => (
                    <th key={col.key}
                      title={col.hint}
                      className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-help">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Movement
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 0 ? '140px' : '90px', marginLeft: j === 0 ? 0 : 'auto' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !data || data.accounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <BookOpen size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-sm text-slate-400">No equity accounts found</p>
                      <p className="text-xs text-slate-300 mt-1">
                        Seed your Chart of Accounts with EQUITY-type accounts to generate this statement.
                      </p>
                    </td>
                  </tr>
                ) : (
                  <>
                    {data.accounts.map(row => (
                      <EquityRow key={row.accountId} row={row} />
                    ))}
                    {totals && (
                      <EquityRow
                        row={{
                          accountId:              'total',
                          accountCode:            '',
                          accountName:            'Total Equity',
                          openingBalance:         totals.openingBalance,
                          netProfitForPeriod:     totals.netProfitForPeriod,
                          otherMovements:         totals.otherMovements,
                          dividendsPaid:          totals.dividendsPaid,
                          otherComprehensiveIncome: totals.otherComprehensiveIncome,
                          closingBalance:         totals.closingBalance,
                        }}
                        isTotal
                      />
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* -- Column guide -- */}
        <div className="ovds-grid-layout cols-3 gap-3">
          {COLS.slice(1, 5).map(col => (
            <div key={col.key} className="flex gap-2.5 px-3 py-2.5 bg-white border border-slate-100 rounded-xl text-xs">
              <Info size={12} className="shrink-0 mt-0.5 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-600">{col.label}</p>
                <p className="text-slate-400 mt-0.5">{col.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {/* -- IFRS note -- */}
        <div className="flex gap-3 px-4 py-3 bg-violet-50 border border-violet-100 rounded-xl text-xs text-violet-600">
          <BookOpen size={13} className="shrink-0 mt-0.5" />
          <div>
            <strong>IAS 1.106</strong> requires entities to present a statement of changes in equity as one of the five primary financial statements.
            It shows movements in each component of equity for the period, including: comprehensive income, transactions with owners, and reclassifications.
            <span className="ml-1 text-violet-400">OCI (Other Comprehensive Income) requires separate OCI accounts — extend your CoA with IAS 1.82A OCI components as needed.</span>
          </div>
        </div>

      </div>
    </AppPage>
  );
};

export default EquityStatement;

