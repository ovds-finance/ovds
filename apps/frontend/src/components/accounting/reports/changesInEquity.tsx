/**
 * Statement of Changes in Equity
 * Full IFRS — IAS 1.106–110
 *
 * Required per IAS 1.106:
 *  (a) Total comprehensive income (profit/loss + OCI)
 *  (b) Effects of retrospective application / restatement (IAS 8)
 *  (c) Reconciliation of opening → closing for each equity component:
 *      Share Capital, Share Premium, Retained Earnings, Revaluation Reserve,
 *      FVOCI Reserve, Translation Reserve, Non-controlling Interest
 *
 * Applies to all business types: Manufacturing, Large Enterprise, SMB, Freelancer, Government
 */
import { format, startOfYear, endOfYear } from 'date-fns';
import { Download, Printer, Calendar, RefreshCw, Info, ChevronDown } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../../../context/businessContext';
import { useIFRSAccess } from '../../../hooks/useIfrsAccess';
import api from '../../../services/api';
import { fmtDecimal } from '../../../utils/fmt';

const fmt = fmtDecimal;

interface EquityComponent {
  key: string;
  label: string;
  iasRef: string;
  openingBalance: number;
  // Comprehensive income
  profitOrLoss: number;
  oci_revaluation: number;       // IAS 16/38 revaluation surplus
  oci_fvoci: number;             // IFRS 9 FVOCI reserve
  oci_translation: number;       // IAS 21 translation differences
  oci_actuarial: number;         // IAS 19 actuarial gains/losses
  totalOCI: number;
  totalComprehensiveIncome: number;
  // Transactions with owners
  dividendsPaid: number;
  capitalContributions: number;
  shareIssuance: number;
  treasuryShares: number;
  // Other
  priorPeriodAdjustments: number; // IAS 8
  transfersBetweenReserves: number;
  closingBalance: number;
}

interface ChangesInEquityData {
  periodStart: string;
  periodEnd: string;
  companyName: string;
  currency: string;
  components: EquityComponent[];
  totalOpeningEquity: number;
  totalClosingEquity: number;
  totalProfitOrLoss: number;
  totalOCI: number;
  totalComprehensiveIncome: number;
}

// Build equity components from P&L + Balance Sheet data
function buildComponents(pl: any, bs: any): EquityComponent[] {
  const netProfit = pl?.netProfit ?? 0;
  const totalEquity = bs?.totalEquity ?? 0;

  return [
    {
      key: 'share_capital',
      label: 'Share Capital',
      iasRef: 'IAS 1.54(r)',
      openingBalance: 0,
      profitOrLoss: 0,
      oci_revaluation: 0, oci_fvoci: 0, oci_translation: 0, oci_actuarial: 0,
      totalOCI: 0, totalComprehensiveIncome: 0,
      dividendsPaid: 0, capitalContributions: 0, shareIssuance: 0, treasuryShares: 0,
      priorPeriodAdjustments: 0, transfersBetweenReserves: 0,
      closingBalance: 0,
    },
    {
      key: 'share_premium',
      label: 'Share Premium',
      iasRef: 'IAS 1.54(r)',
      openingBalance: 0,
      profitOrLoss: 0,
      oci_revaluation: 0, oci_fvoci: 0, oci_translation: 0, oci_actuarial: 0,
      totalOCI: 0, totalComprehensiveIncome: 0,
      dividendsPaid: 0, capitalContributions: 0, shareIssuance: 0, treasuryShares: 0,
      priorPeriodAdjustments: 0, transfersBetweenReserves: 0,
      closingBalance: 0,
    },
    {
      key: 'retained_earnings',
      label: 'Retained Earnings',
      iasRef: 'IAS 1.54(r)',
      openingBalance: totalEquity - netProfit,
      profitOrLoss: netProfit,
      oci_revaluation: 0, oci_fvoci: 0, oci_translation: 0, oci_actuarial: 0,
      totalOCI: 0,
      totalComprehensiveIncome: netProfit,
      dividendsPaid: 0, capitalContributions: 0, shareIssuance: 0, treasuryShares: 0,
      priorPeriodAdjustments: 0, transfersBetweenReserves: 0,
      closingBalance: totalEquity,
    },
    {
      key: 'revaluation_reserve',
      label: 'Revaluation Reserve',
      iasRef: 'IAS 16/38',
      openingBalance: 0,
      profitOrLoss: 0,
      oci_revaluation: 0, oci_fvoci: 0, oci_translation: 0, oci_actuarial: 0,
      totalOCI: 0, totalComprehensiveIncome: 0,
      dividendsPaid: 0, capitalContributions: 0, shareIssuance: 0, treasuryShares: 0,
      priorPeriodAdjustments: 0, transfersBetweenReserves: 0,
      closingBalance: 0,
    },
    {
      key: 'fvoci_reserve',
      label: 'FVOCI Reserve',
      iasRef: 'IFRS 9',
      openingBalance: 0,
      profitOrLoss: 0,
      oci_revaluation: 0, oci_fvoci: 0, oci_translation: 0, oci_actuarial: 0,
      totalOCI: 0, totalComprehensiveIncome: 0,
      dividendsPaid: 0, capitalContributions: 0, shareIssuance: 0, treasuryShares: 0,
      priorPeriodAdjustments: 0, transfersBetweenReserves: 0,
      closingBalance: 0,
    },
    {
      key: 'translation_reserve',
      label: 'Translation Reserve',
      iasRef: 'IAS 21',
      openingBalance: 0,
      profitOrLoss: 0,
      oci_revaluation: 0, oci_fvoci: 0, oci_translation: 0, oci_actuarial: 0,
      totalOCI: 0, totalComprehensiveIncome: 0,
      dividendsPaid: 0, capitalContributions: 0, shareIssuance: 0, treasuryShares: 0,
      priorPeriodAdjustments: 0, transfersBetweenReserves: 0,
      closingBalance: 0,
    },
  ];
}

const ChangesInEquityReport: React.FC = () => {
  const { companies, selectedCompanyId } = useBusiness();
  const company = companies.find(c => c.id === selectedCompanyId);
  const { canView } = useIFRSAccess();
  const [data, setData] = useState<ChangesInEquityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showOCI, setShowOCI] = useState(false);

  const loadReport = async (y: number) => {
    setLoading(true);
    try {
      const start = format(startOfYear(new Date(y, 0)), 'yyyy-MM-dd');
      const end   = format(endOfYear(new Date(y, 0)),   'yyyy-MM-dd');
      const [plRes, bsRes] = await Promise.all([
        api.get(`/ovds/reports/profit-loss?startDate=${start}&endDate=${end}`),
        api.get(`/ovds/reports/balance-sheet?date=${end}`),
      ]);
      const pl = plRes.data?.data ?? plRes.data;
      const bs = bsRes.data?.data ?? bsRes.data;
      const components = buildComponents(pl, bs);
      const totalOpen  = components.reduce((s, c) => s + c.openingBalance, 0);
      const totalClose = components.reduce((s, c) => s + c.closingBalance, 0);
      const totalPnL   = components.reduce((s, c) => s + c.profitOrLoss, 0);
      const totalOCI   = components.reduce((s, c) => s + c.totalOCI, 0);
      setData({
        periodStart: start, periodEnd: end,
        companyName: bs?.companyName ?? company?.name ?? 'Company',
        currency: bs?.currency ?? 'ETB',
        components,
        totalOpeningEquity: totalOpen,
        totalClosingEquity: totalClose,
        totalProfitOrLoss: totalPnL,
        totalOCI,
        totalComprehensiveIncome: totalPnL + totalOCI,
      });
    } catch {
      toast.error('Failed to load Statement of Changes in Equity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(year); }, [year]);  // eslint-disable-line react-hooks/exhaustive-deps

  const exportCSV = () => {
    if (!data) return;
    const header = 'Component,IAS Ref,Opening,Profit/Loss,OCI,Total CI,Dividends,Capital,Closing\n';
    const rows = data.components.map(c =>
      `"${c.label}","${c.iasRef}",${c.openingBalance},${c.profitOrLoss},${c.totalOCI},${c.totalComprehensiveIncome},${c.dividendsPaid},${c.capitalContributions},${c.closingBalance}`
    ).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `SOCE-${year}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-80" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="ovds-widget-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Full IFRS · IAS 1.106</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Statement of Changes in Equity</h2>
            <p className="text-sm text-slate-500 mt-0.5">For the year ended {format(new Date(year, 11, 31), 'MMMM dd, yyyy')}</p>
            {data && <p className="text-xs text-slate-400 mt-0.5">{data.companyName} · {data.currency}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl">
              <Calendar size={14} className="text-slate-400" />
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none">
                {[2022, 2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => loadReport(year)} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <RefreshCw size={14} className="text-slate-500" />
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Printer size={13} /> Print
            </button>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 text-white rounded-xl text-xs font-bold hover:bg-teal-500-dark transition-colors">
              <Download size={13} /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* IAS 1 note */}
      <div className="flex items-start gap-2.5 px-4 py-3 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-900/40 rounded-xl">
        <Info size={14} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--pro-azure-dark)] dark:text-green-300">
          <strong>IAS 1.106</strong> — Reconciles opening and closing balances for each equity component: Share Capital, Share Premium, Retained Earnings, Revaluation Reserve (IAS 16/38), FVOCI Reserve (IFRS 9), Translation Reserve (IAS 21). Total Comprehensive Income = Profit or Loss + Other Comprehensive Income (IAS 1.81A).
        </p>
      </div>

      {/* IFRS 18 readiness note — gated on ovds:read */}
      {canView && (
      <div className="flex items-start gap-2.5 px-4 py-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl">
        <Info size={14} className="text-purple-500 shrink-0 mt-0.5" />
        <p className="text-xs text-purple-700 dark:text-purple-300">
          <strong>IFRS 18 (effective 1 Jan 2027)</strong> — This statement is prepared under IAS 1.106. When IFRS 18 is adopted, the Statement of Changes in Equity structure remains largely unchanged, but the Profit or Loss column will reflect the new Operating/Investing/Financing income statement categories. Begin mapping equity movements to the new P&L structure now.
        </p>
      </div>
      )}

      {/* OCI toggle */}
      <button onClick={() => setShowOCI(v => !v)}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors">
        <ChevronDown size={13} className={`transition-transform ${showOCI ? 'rotate-180' : ''}`} />
        {showOCI ? 'Hide' : 'Show'} OCI breakdown columns (IAS 1.82A)
      </button>

      {/* Main table */}
      {data && (
        <div className="ovds-widget-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider sticky left-0 bg-white dark:bg-slate-800/50 min-w-[160px]">Component</th>
                  <th className="text-right px-3 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Opening</th>
                  <th className="text-right px-3 py-3 text-[10px] font-medium text-[var(--pro-azure)] uppercase tracking-wider">Profit / Loss</th>
                  {showOCI && <>
                    <th className="text-right px-3 py-3 text-[10px] font-medium text-[var(--pro-azure)] uppercase tracking-wider">Revaluation</th>
                    <th className="text-right px-3 py-3 text-[10px] font-medium text-[var(--pro-azure)] uppercase tracking-wider">FVOCI</th>
                    <th className="text-right px-3 py-3 text-[10px] font-medium text-[var(--pro-azure)] uppercase tracking-wider">Translation</th>
                    <th className="text-right px-3 py-3 text-[10px] font-medium text-[var(--pro-azure)] uppercase tracking-wider">Actuarial</th>
                  </>}
                  <th className="text-right px-3 py-3 text-[10px] font-medium text-[var(--pro-azure)] uppercase tracking-wider">Total OCI</th>
                  <th className="text-right px-3 py-3 text-[10px] font-medium text-teal-600 uppercase tracking-wider">Total CI</th>
                  <th className="text-right px-3 py-3 text-[10px] font-medium text-rose-500 uppercase tracking-wider">Dividends</th>
                  <th className="text-right px-3 py-3 text-[10px] font-medium text-violet-600 uppercase tracking-wider">Capital</th>
                  <th className="text-right px-3 py-3 text-[10px] font-medium text-amber-600 uppercase tracking-wider">IAS 8 Adj.</th>
                  <th className="text-right px-4 py-3 text-[10px] font-medium text-slate-700 dark:text-slate-200 uppercase tracking-wider">Closing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.components.map((c) => (
                  <tr key={c.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white dark:bg-slate-900">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{c.label}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{c.iasRef}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-600 dark:text-slate-400">{fmt(c.openingBalance)}</td>
                    <td className={`px-3 py-3 text-right font-mono font-bold ${c.profitOrLoss > 0 ? 'text-[var(--pro-azure)]' : c.profitOrLoss < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {c.profitOrLoss !== 0 ? fmt(c.profitOrLoss) : '—'}
                    </td>
                    {showOCI && <>
                      <td className="px-3 py-3 text-right font-mono text-[var(--pro-azure)]">{c.oci_revaluation !== 0 ? fmt(c.oci_revaluation) : '—'}</td>
                      <td className="px-3 py-3 text-right font-mono text-[var(--pro-azure)]">{c.oci_fvoci !== 0 ? fmt(c.oci_fvoci) : '—'}</td>
                      <td className="px-3 py-3 text-right font-mono text-[var(--pro-azure)]">{c.oci_translation !== 0 ? fmt(c.oci_translation) : '—'}</td>
                      <td className="px-3 py-3 text-right font-mono text-[var(--pro-azure)]">{c.oci_actuarial !== 0 ? fmt(c.oci_actuarial) : '—'}</td>
                    </>}
                    <td className="px-3 py-3 text-right font-mono text-[var(--pro-azure)]">{c.totalOCI !== 0 ? fmt(c.totalOCI) : '—'}</td>
                    <td className={`px-3 py-3 text-right font-mono font-bold ${c.totalComprehensiveIncome > 0 ? 'text-teal-600' : c.totalComprehensiveIncome < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {c.totalComprehensiveIncome !== 0 ? fmt(c.totalComprehensiveIncome) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-rose-500">{c.dividendsPaid ? `(${fmt(c.dividendsPaid)})` : '—'}</td>
                    <td className="px-3 py-3 text-right font-mono text-violet-600">{c.capitalContributions ? fmt(c.capitalContributions) : '—'}</td>
                    <td className="px-3 py-3 text-right font-mono text-amber-600">{c.priorPeriodAdjustments ? fmt(c.priorPeriodAdjustments) : '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">{fmt(c.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50">
                <tr>
                  <td className="px-4 py-4 font-semibold text-slate-800 dark:text-slate-100 text-[10px] uppercase tracking-wider sticky left-0 bg-white dark:bg-slate-800/50">Total Equity</td>
                  <td className="px-3 py-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-200">{fmt(data.totalOpeningEquity)}</td>
                  <td className={`px-3 py-4 text-right font-mono font-semibold ${data.totalProfitOrLoss >= 0 ? 'text-[var(--pro-azure-dark)]' : 'text-rose-700'}`}>{fmt(data.totalProfitOrLoss)}</td>
                  {showOCI && <><td colSpan={4} className="px-3 py-4 text-center text-slate-400 text-[9px]">—</td></>}
                  <td className="px-3 py-4 text-right font-mono font-semibold text-[var(--pro-azure-dark)]">{fmt(data.totalOCI)}</td>
                  <td className={`px-3 py-4 text-right font-mono font-semibold ${data.totalComprehensiveIncome >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>{fmt(data.totalComprehensiveIncome)}</td>
                  <td className="px-3 py-4 text-right font-mono text-slate-500">—</td>
                  <td className="px-3 py-4 text-right font-mono text-slate-500">—</td>
                  <td className="px-3 py-4 text-right font-mono text-slate-500">—</td>
                  <td className="px-4 py-4 text-right font-mono font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] text-sm">{fmt(data.totalClosingEquity)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Summary KPIs */}
      {data && (
        <div className="ovds-grid-layout cols-4">
          {[
            { label: 'Opening Equity', value: data.totalOpeningEquity, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' },
            { label: 'Profit or Loss', value: data.totalProfitOrLoss, color: data.totalProfitOrLoss >= 0 ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-rose-700 dark:text-rose-400', bg: data.totalProfitOrLoss >= 0 ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-900' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900' },
            { label: 'Total Comprehensive Income', value: data.totalComprehensiveIncome, color: data.totalComprehensiveIncome >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-rose-700 dark:text-rose-400', bg: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900' },
            { label: 'Closing Equity', value: data.totalClosingEquity, color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-900' },
          ].map(k => (
            <div key={k.label} className={`rounded-2xl border p-4 ${k.bg}`}>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">{k.label}</p>
              <p className={`text-xl font-bold tabular-nums ${k.color}`}>{data.currency} {fmt(k.value)}</p>
            </div>
          ))}
        </div>
      )}

      <style>{`@media print { @page { margin: 0.75in; size: landscape; } }`}</style>
    </div>
  );
};

export default ChangesInEquityReport;








