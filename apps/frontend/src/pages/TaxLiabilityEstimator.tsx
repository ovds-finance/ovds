/**
 * Tax Liability Estimator — Phase 3 · Analysis
 *
 * Live pre-computation of VAT, ToT, and Withholding taxes
 * for the current or selected period. Helps ovds teams
 * plan cash outflows before the monthly filing deadline.
 *
 * Sources:
 *   - VAT: /api/vat/summary
 *   - Tax liability: /api/tax/liability-estimate
 */
import { AppPage, Btn } from '@ovds/ui';
import { Calculator, RefreshCw, TrendingUp, Info, AlertTriangle } from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';
import { fmtCurrency } from '../utils/fmt';


const fmt = (n: number) => fmtCurrency(n, 'ETB');

interface LiabilityEstimate {
  period: string;
  outputVat: number;
  inputVat: number;
  netVat: number;
  totGoods: number;
  totServices: number;
  netTot: number;
  whtPayable: number;
  totalEstimated: number;
  dueDate: string;
  daysUntilDue: number;
}

const TaxLiabilityEstimatorPage: React.FC = () => {
  usePageTitle('Tax Liability Estimator');
  const { selectedCompanyId } = useBusiness();
  const [estimate, setEstimate] = useState<LiabilityEstimate | null>(null);
  const [loading, setLoading]   = useState(false);
  const [period, setPeriod]     = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchEstimate = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const res = await api.get(`/tax/liability-estimate?period=${period}`);
      setEstimate(res.data?.data ?? res.data);
    } catch (_err: any) {
      // Graceful fallback — build from VAT summary if dedicated endpoint not yet available
      try {
        const vat = await api.get('/vat/summary');
        const v = vat.data?.data ?? vat.data ?? {};
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 1, 30);
        const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
        setEstimate({
          period,
          outputVat:      v.outputVat      ?? 0,
          inputVat:       v.inputVat       ?? 0,
          netVat:         v.netVat         ?? 0,
          totGoods:       v.totGoods       ?? 0,
          totServices:    v.totServices    ?? 0,
          netTot:         (v.totGoods ?? 0) + (v.totServices ?? 0),
          whtPayable:     v.whtPayable     ?? 0,
          totalEstimated: (v.netVat ?? 0) + ((v.totGoods ?? 0) + (v.totServices ?? 0)) + (v.whtPayable ?? 0),
          dueDate:        dueDate.toISOString().slice(0, 10),
          daysUntilDue,
        });
      } catch {
        toast.error('Could not load tax estimate');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, period]);

  useEffect(() => { fetchEstimate(); }, [fetchEstimate]);

  const urgencyColor = (days: number) =>
    days <= 3 ? 'text-rose-600 bg-rose-50 border-rose-200' :
    days <= 7 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]';

  return (
    <AppPage
      title="Tax Liability Estimator"
      subtitle="Live pre-computation of VAT, ToT, and WHT — plan cash outflows before filing deadline"
      icon={<Calculator size={18} />}
      iconBg="bg-violet-500"
      crumbs={[{ label: '3 · Analysis' }, { label: 'Dashboards' }, { label: 'Tax Liability Estimator' }]}
      actions={
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
          <Btn
            variant="secondary"
            size="sm"
            icon={loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            onClick={fetchEstimate}
            disabled={loading}
          >
            {loading ? 'Calculating…' : 'Recalculate'}
          </Btn>
        </div>
      }
    >
      <div className="space-y-5">

        {/* Deadline urgency banner */}
        {estimate && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${urgencyColor(estimate.daysUntilDue)}`}>
            <AlertTriangle size={15} className="shrink-0" />
            <span>
              <strong>Filing deadline:</strong> {estimate.dueDate} &nbsp;·&nbsp;
              <strong>{estimate.daysUntilDue} days</strong> remaining &nbsp;·&nbsp;
              Estimated total due: <strong>{fmt(estimate.totalEstimated)}</strong>
            </span>
          </div>
        )}

        {/* Main breakdown */}
        <div className="ovds-grid-layout cols-3 gap-4">
          {/* VAT card */}
          <div className="ovds-widget-card col-span-1">
            <div className="ovds-widget-header">
              <TrendingUp size={15} className="text-[var(--pro-azure)]" />
              <h3 className="ovds-card-title">VAT Estimate</h3>
            </div>
            <div className="ovds-widget-body space-y-3">
              {[
                { label: 'Output VAT (15%)',  value: estimate?.outputVat ?? 0,  cls: 'text-slate-700' },
                { label: 'Input VAT Credit',  value: -(estimate?.inputVat ?? 0), cls: 'text-[var(--pro-azure)]' },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{row.label}</span>
                  <span className={`font-semibold tabular-nums ${row.cls}`}>{fmt(row.value)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold">
                <span className="text-slate-700">Net VAT Payable</span>
                <span className="text-[var(--pro-azure)] tabular-nums">{fmt(estimate?.netVat ?? 0)}</span>
              </div>
              <p className="text-[10px] text-slate-400">Due 30th of following month · Proc. 1341/2024</p>
            </div>
          </div>

          {/* TOT card */}
          <div className="ovds-widget-card col-span-1">
            <div className="ovds-widget-header">
              <Calculator size={15} className="text-sky-500" />
              <h3 className="ovds-card-title">TOT Estimate</h3>
            </div>
            <div className="ovds-widget-body space-y-3">
              {[
                { label: 'TOT on Goods (2%)',     value: estimate?.totGoods    ?? 0 },
                { label: 'TOT on Services (10%)', value: estimate?.totServices ?? 0 },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{row.label}</span>
                  <span className="font-semibold text-slate-700 tabular-nums">{fmt(row.value)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold">
                <span className="text-slate-700">Net TOT Payable</span>
                <span className="text-sky-600 tabular-nums">{fmt(estimate?.netTot ?? 0)}</span>
              </div>
              <p className="text-[10px] text-slate-400">Category B taxpayers only · Proc. 1395/2025</p>
            </div>
          </div>

          {/* WHT card */}
          <div className="ovds-widget-card col-span-1">
            <div className="ovds-widget-header">
              <Calculator size={15} className="text-amber-500" />
              <h3 className="ovds-card-title">WHT Estimate</h3>
            </div>
            <div className="ovds-widget-body space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">WHT on services (3%)</span>
                <span className="font-semibold text-slate-700 tabular-nums">{fmt(estimate?.whtPayable ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Threshold</span>
                <span className="text-slate-400 text-xs">≥ ETB 10,000/tx</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold">
                <span className="text-slate-700">Total WHT Payable</span>
                <span className="text-amber-600 tabular-nums">{fmt(estimate?.whtPayable ?? 0)}</span>
              </div>
              <p className="text-[10px] text-slate-400">Remit monthly with VAT return · Proc. 1395/2025</p>
            </div>
          </div>
        </div>

        {/* Total summary */}
        <div className="ovds-widget-card">
          <div className="ovds-widget-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Estimated Tax Liability — {period}</p>
                <p className="text-3xl font-black text-slate-800 tabular-nums">
                  {loading ? '—' : fmt(estimate?.totalEstimated ?? 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">VAT + TOT + WHT · Updates automatically as transactions are posted</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {[
                  { label: 'VAT',  value: estimate?.netVat     ?? 0, cls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' },
                  { label: 'TOT',  value: estimate?.netTot     ?? 0, cls: 'bg-sky-50 text-sky-700' },
                  { label: 'WHT',  value: estimate?.whtPayable ?? 0, cls: 'bg-amber-50 text-amber-700' },
                ].map(r => (
                  <span key={r.label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${r.cls}`}>
                    {r.label}: {fmt(r.value)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="flex gap-2.5 px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs text-slate-500">
          <Info size={13} className="shrink-0 mt-0.5 text-slate-400" />
          <span>
            Estimates are calculated from posted transactions in the current period.
            Unposted drafts are excluded. Actual filed amounts may differ due to
            rounding, exemptions, or adjusting entries posted after this estimate.
            File the official return via <strong>4 · Submit to MoR → e-Tax Declaration</strong>.
          </span>
        </div>

      </div>
    </AppPage>
  );
};

export default TaxLiabilityEstimatorPage;
