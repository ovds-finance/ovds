/**
 * TOT Filing Page — Turnover Tax (Category B taxpayers)
 *
 * Proclamation No. 1395/2025:
 *   - 2% on goods turnover
 *   - 10% on services turnover
 *   - Applicable when annual revenue < ETB 2,000,000 (Category B)
 *   - Monthly filing, due by 30th of the following month
 */
import React, { useState, useCallback } from 'react';
import {
  Calculator, Send, RefreshCw, CheckCircle2,
  AlertTriangle, Clock, TrendingUp, FileText,
  ChevronDown, X, Info, Download,
} from 'lucide-react';
import { AppPage, Btn } from '@ovds/ui';
import { useTotFilings, useTaxpayerStatus } from '../services/taxApi';
import { calculateTot, triggerAutoComputeTot } from '@ovds/features/tax';
import type { TotFiling as TotFilingType, TotCalculation } from '@ovds/features/tax';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { fmtCurrency } from '../utils/fmt';
import { Icon } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (n: number) => fmtCurrency(n, 'ETB');
const currentPeriod = () => new Date().toISOString().slice(0, 7);
const prevPeriod = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

// -- Status config -------------------------------------------------------------
const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  DRAFT:   { label: 'Draft',   cls: 'bg-slate-100 text-slate-600 border border-slate-200',           dot: 'bg-slate-400' },
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border border-amber-200',             dot: 'bg-amber-500' },
  FILED:   { label: 'Filed',   cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',       dot: 'bg-emerald-500' },
  PAID:    { label: 'Paid',    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',       dot: 'bg-emerald-500' },
  OVERDUE: { label: 'Overdue', cls: 'bg-rose-50 text-rose-700 border border-rose-200',               dot: 'bg-rose-500' },
};

const inp =
  'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm ' +
  'outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ' +
  'transition-colors placeholder:text-slate-300';

// -- TOT Calculator card --------------------------------------------------------
const TotCalculator: React.FC<{
  period: string;
  onFilingRecorded: () => void;
}> = ({ period, onFilingRecorded }) => {
  const [calc, setCalc] = useState<TotCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [filing, setFiling] = useState(false);
  const [goodsOverride, setGoodsOverride] = useState<string>('');
  const [servicesOverride, setServicesOverride] = useState<string>('');

  const handleCalculate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await calculateTot(period);
      setCalc(result);
      setGoodsOverride(String(result.goodsAmount));
      setServicesOverride(String(result.servicesAmount));
    } catch {
      toast.error('Failed to calculate TOT — check period format');
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Derived values from overrides
  const goods = parseFloat(goodsOverride) || calc?.goodsAmount || 0;
  const services = parseFloat(servicesOverride) || calc?.servicesAmount || 0;
  const totGoods = Math.round(goods * 0.02 * 100) / 100;
  const totServices = Math.round(services * 0.1 * 100) / 100;
  const netPayable = totGoods + totServices;

  const handleRecord = async () => {
    if (netPayable <= 0 && goods <= 0 && services <= 0) {
      toast.error('Enter goods or services turnover first');
      return;
    }
    setFiling(true);
    try {
      await api.post('/tax/filing', {
        type: 'TOT',
        period,
        amount: netPayable,
        goodsAmount: goods,
        servicesAmount: services,
        totGoods,
        totServices,
        status: 'DRAFT',
      });
      toast.success(`TOT filing recorded for ${period}`);
      onFilingRecorded();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to record TOT filing');
    } finally {
      setFiling(false);
    }
  };

  return (
    <div className="ovds-widget-card overflow-hidden">
      <div className="ovds-widget-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator size={15} className="text-sky-500" />
          <h3 className="ovds-card-title">TOT Calculator — {period}</h3>
        </div>
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <RefreshCw size={12} className="animate-spin" /> : <Calculator size={12} />}
          {loading ? 'Calculating…' : 'Auto-fill from GL'}
        </button>
      </div>
      <div className="ovds-widget-body space-y-4">
        {/* Turnover inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Goods Turnover (ETB)
              <span className="ml-1.5 text-[10px] font-normal text-slate-400">2% TOT rate</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={goodsOverride}
              onChange={e => setGoodsOverride(e.target.value)}
              placeholder="0.00"
              className={inp}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Services Turnover (ETB)
              <span className="ml-1.5 text-[10px] font-normal text-slate-400">10% TOT rate</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={servicesOverride}
              onChange={e => setServicesOverride(e.target.value)}
              placeholder="0.00"
              className={inp}
            />
          </div>
        </div>

        {/* Calculated breakdown */}
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider mb-3">Tax Calculation</p>
          <div className="space-y-1.5">
            {[
              { label: 'Goods Turnover', value: goods, sub: '× 2% = ' + fmt(totGoods), valueClass: 'text-slate-700' },
              { label: 'Services Turnover', value: services, sub: '× 10% = ' + fmt(totServices), valueClass: 'text-slate-700' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-600">{row.label}</span>
                  <span className="ml-2 text-xs text-sky-500">{row.sub}</span>
                </div>
                <span className={`font-semibold tabular-nums ${row.valueClass}`}>{fmt(row.value)}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-sky-200 flex items-center justify-between">
            <span className="text-sm font-bold text-sky-800">Net TOT Payable</span>
            <span className="text-lg font-bold text-sky-700 tabular-nums">{fmt(netPayable)}</span>
          </div>
        </div>

        {/* Legal notice */}
        <div className="flex gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
          <Info size={13} className="shrink-0 mt-0.5" />
          <div>
            <strong>Proclamation No. 1395/2025</strong> — TOT is applicable for Category B taxpayers (annual
            revenue &lt; ETB 2,000,000). Filing due by the 30th of the following month via MoR e-Tax Portal.
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRecord}
            disabled={filing || (goods <= 0 && services <= 0)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {filing ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
            {filing ? 'Recording…' : 'Record as Draft'}
          </button>
          <button
            onClick={async () => {
              try {
                await api.post('/tax/filing', {
                  type: 'TOT',
                  period,
                  amount: netPayable,
                  goodsAmount: goods,
                  servicesAmount: services,
                  totGoods,
                  totServices,
                  status: 'PENDING',
                });
                toast.success('TOT filing marked as Pending — ready for eTax submission');
                onFilingRecorded();
              } catch (err: any) {
                toast.error(err?.response?.data?.message ?? 'Failed');
              }
            }}
            disabled={filing || netPayable <= 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-sky-500 text-sky-600 hover:bg-sky-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Send size={14} /> Mark as Pending
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Filing row -----------------------------------------------------------------
const FilingRow: React.FC<{ filing: TotFilingType; onUpdated: () => void }> = ({ filing, onUpdated }) => {
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CFG[filing.status] ?? STATUS_CFG.DRAFT;

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await api.patch(`/tax/tot/filings/${filing.id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      onUpdated();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-xs font-mono text-slate-600">{filing.period}</td>
      <td className="px-4 py-3 text-xs text-slate-700 tabular-nums text-right">{fmt(filing.goodsAmount)}</td>
      <td className="px-4 py-3 text-xs text-slate-700 tabular-nums text-right">{fmt(filing.servicesAmount)}</td>
      <td className="px-4 py-3 text-xs text-sky-600 tabular-nums text-right font-medium">{fmt(filing.totGoods)}</td>
      <td className="px-4 py-3 text-xs text-sky-600 tabular-nums text-right font-medium">{fmt(filing.totServices)}</td>
      <td className="px-4 py-3 text-sm font-bold text-slate-800 tabular-nums text-right">{fmt(filing.netPayable)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400 font-mono">
        {filing.eTaxReference ?? '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {filing.status === 'DRAFT' && (
            <button
              onClick={() => updateStatus('PENDING')}
              disabled={updating}
              className="px-2 py-1 text-[10px] font-medium bg-sky-50 text-sky-600 hover:bg-sky-100 rounded transition-colors"
            >
              Submit
            </button>
          )}
          {filing.status === 'PENDING' && (
            <button
              onClick={() => updateStatus('FILED')}
              disabled={updating}
              className="px-2 py-1 text-[10px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
            >
              Mark Filed
            </button>
          )}
          {filing.status === 'FILED' && (
            <button
              onClick={() => updateStatus('PAID')}
              disabled={updating}
              className="px-2 py-1 text-[10px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
            >
              Mark Paid
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// -- Main page ------------------------------------------------------------------
const TotFilingPage: React.FC = () => {
  usePageTitle('TOT Filing');
  const { selectedCompanyId } = useBusiness();
  const [period, setPeriod] = useState(prevPeriod());
  const [autoComputing, setAutoComputing] = useState(false);
  const { filings, loading, refetch } = useTotFilings();
  const { status: taxpayerStatus } = useTaxpayerStatus(selectedCompanyId ?? undefined);

  const isCategoryB = taxpayerStatus?.category === 'B' || (taxpayerStatus?.annualRevenue ?? 0) < 2_000_000;

  const handleAutoCompute = async () => {
    setAutoComputing(true);
    try {
      const result = await triggerAutoComputeTot(period);
      if (result.computed === false) {
        toast(result.message, { icon: 'ℹ️' });
      } else {
        toast.success(result.message ?? 'TOT auto-computed');
        refetch();
      }
    } catch {
      toast.error('Auto-compute failed');
    } finally {
      setAutoComputing(false);
    }
  };

  // KPI summaries from filing list
  const totalPayable = filings.reduce((s, f) => s + f.netPayable, 0);
  const totalPaid    = filings.filter(f => f.status === 'PAID').reduce((s, f) => s + f.netPayable, 0);
  const totalPending = filings.filter(f => f.status === 'PENDING' || f.status === 'DRAFT').length;
  const totalOverdue = filings.filter(f => f.status === 'OVERDUE').length;

  return (
    <AppPage
      title="Turnover Tax (TOT)"
      subtitle="Category B taxpayers — 2% goods, 10% services · Proclamation No. 1395/2025 · Retail & E-commerce · Manufacturing & Logistics · Revenue · Market Forecast"
      icon={<Calculator size={18} />}
      iconBg="bg-sky-500"
      crumbs={[{ label: 'Tax & Compliance' }, { label: 'TOT Filing' }]}
      actions={
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
          <Btn
            variant="secondary"
            size="sm"
            icon={autoComputing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            onClick={handleAutoCompute}
            disabled={autoComputing}
          >
            {autoComputing ? 'Computing…' : 'Auto-Compute'}
          </Btn>
        </div>
      }
    >
      <div className="space-y-5">

        {/* -- Category eligibility banner -- */}
        {taxpayerStatus && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
            isCategoryB
              ? 'bg-sky-50 border-sky-200 text-sky-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {isCategoryB
              ? <CheckCircle2 size={16} className="shrink-0 text-sky-600" />
              : <AlertTriangle size={16} className="shrink-0 text-amber-600" />}
            <div>
              <strong>
                {isCategoryB
                  ? 'Category B Taxpayer — TOT Applies'
                  : 'Category A Taxpayer — VAT Applies (TOT not applicable)'}
              </strong>
              <span className="ml-2 text-xs opacity-75">
                Annual revenue: {fmt(taxpayerStatus.annualRevenue ?? 0)} / ETB 2,000,000 threshold
              </span>
            </div>
          </div>
        )}

        {/* -- KPI strip -- */}
        <div className="ovds-stat-row">
          {[
            { label: 'Total TOT Payable (YTD)', value: fmt(totalPayable), accent: 'bg-sky-500' },
            { label: 'Total Paid (YTD)',         value: fmt(totalPaid),    accent: 'bg-emerald-500' },
            { label: 'Pending Filings',          value: String(totalPending), accent: totalPending > 0 ? 'bg-amber-500' : 'bg-slate-300' },
            { label: 'Overdue Filings',          value: String(totalOverdue), accent: totalOverdue > 0 ? 'bg-rose-500' : 'bg-slate-300' },
          ].map(kpi => (
            <div key={kpi.label} className="ovds-kpi-cell">
              <div className={`w-1 h-8 rounded-full shrink-0 ${kpi.accent}`} />
              <div>
                <p className="ovds-value-sm">{kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* -- Rate reference card -- */}
        <div className="ovds-grid-layout cols-2 gap-4">
          {[
            { label: 'Goods — TOT Rate',    rate: '2%',  base: 'On total goods turnover',    color: 'bg-sky-50 border-sky-200',    textCls: 'text-sky-700' },
            { label: 'Services — TOT Rate', rate: '10%', base: 'On total services turnover', color: 'bg-violet-50 border-violet-200', textCls: 'text-violet-700' },
          ].map(r => (
            <div key={r.label} className={`flex items-center gap-4 p-4 rounded-xl border ${r.color}`}>
              <div className={`text-3xl font-black tabular-nums ${r.textCls}`}>{r.rate}</div>
              <div>
                <p className={`text-sm font-bold ${r.textCls}`}>{r.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.base}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Due: 30th of following month</p>
              </div>
            </div>
          ))}
        </div>

        {/* -- Calculator -- */}
        <TotCalculator period={period} onFilingRecorded={refetch} />

        {/* -- Filing history table -- */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-slate-400" />
              <h3 className="ovds-card-title">TOT Filing History</h3>
            </div>
            <button
              onClick={refetch}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  {['Period', 'Goods Turnover', 'Services Turnover', 'TOT (Goods)', 'TOT (Services)', 'Net Payable', 'Status', 'eTax Ref', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(9).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 0 ? '80px' : '70px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <Calculator size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-sm text-slate-400">No TOT filings recorded yet</p>
                      <p className="text-xs text-slate-300 mt-1">Use the calculator above to record your first TOT filing</p>
                    </td>
                  </tr>
                ) : (
                  filings.map(f => (
                    <FilingRow key={f.id} filing={f} onUpdated={refetch} />
                  ))
                )}
              </tbody>
              {filings.length > 0 && (
                <tfoot>
                  <tr className="bg-white border-t border-slate-200">
                    <td className="px-4 py-3 text-xs font-bold text-slate-600" colSpan={5}>Totals</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800 tabular-nums text-right">
                      {fmt(totalPayable)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* -- Legal reference -- */}
        <div className="flex gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs text-slate-500">
          <Info size={14} className="shrink-0 mt-0.5 text-slate-400" />
          <div className="space-y-0.5">
            <p><strong className="text-slate-600">Legal basis:</strong> Federal Income Tax Proclamation No. 1395/2025 — Turnover Tax provisions for Category B taxpayers.</p>
            <p><strong className="text-slate-600">Category B threshold:</strong> Annual turnover below ETB 2,000,000. Category A taxpayers (above threshold) are registered for VAT instead.</p>
            <p><strong className="text-slate-600">Filing deadline:</strong> 30th of the month following the tax period. Penalty: 25% of unpaid tax + 2% per month interest (ERCA Regulations).</p>
          </div>
        </div>

      </div>
    </AppPage>
  );
};

export default TotFilingPage;


