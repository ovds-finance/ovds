import React, { useState, useEffect, useCallback } from 'react';
import { AppPage, Btn, Icon } from '@ovds/ui';
import CashForecastChart from '../components/cashForecastChart';
import PaymentBatchModal from '../components/paymentBatchModal';
import {
  RefreshCw, Zap, TrendingUp, BarChart3,
  ChevronUp, ChevronDown, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useLocalStorage } from '../hooks';
import { useInterval } from '../hooks';
import { useAuditLog } from '../hooks/useAuditLog';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ContextualInsight } from '@ovds/ui';
import { useBusiness } from '../context/businessContext';

// -- Types ---------------------------------------------------------------------
type Scenario = 'base' | 'optimistic' | 'pessimistic';
const SCENARIO_META: Record<Scenario, { label: string; color: string; multiplier: number; desc: string }> = {
  base:        { label: 'Base Case',   color: 'text-emerald-600 dark:text-emerald-400',   multiplier: 1.0,  desc: 'Current trajectory maintained' },
  optimistic:  { label: 'Optimistic',  color: 'text-emerald-600', multiplier: 1.25, desc: '25% revenue uplift, costs stable' },
  pessimistic: { label: 'Pessimistic', color: 'text-rose-600',    multiplier: 0.75, desc: '25% revenue decline, costs +10%' },
};
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function buildForecast(inflows: number, outflows: number, scenario: Scenario) {
  const meta = SCENARIO_META[scenario];
const now = new Date();
return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
const projInflows  = inflows  * meta.multiplier * (1 + i * 0.02);
const projOutflows = outflows * (scenario === 'pessimistic' ? 1.1 : 1.0) * (1 + i * 0.01);
return {
      month:    MONTHS_SHORT[d.getMonth()],
      inflows:  Math.round(projInflows),
      outflows: Math.round(projOutflows),
      net:      Math.round(projInflows - projOutflows),
    };
  });
}
const fmt = (n: number) => `ETB ${Math.abs(n).toLocaleString('en-ET')}`;

// -- Component -----------------------------------------------------------------
const TreasuryForecast: React.FC = () => {
  usePageTitle('Treasury Forecast');
useAuditLog();
const { selectedCompanyId } = useBusiness();
const [showBatchModal,    setShowBatchModal]    = useState(false);
const [summary,           setSummary]           = useState<any>(null);
const [loading,           setLoading]           = useState(true);
const [generating,        setGenerating]        = useState(false);
const [scenario,          setScenario]          = useLocalStorage<Scenario>('treasury_scenario', 'base');
const [showForecastTable, setShowForecastTable] = useLocalStorage<boolean>('treasury_show_table', true);
const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/ovds/reports/cash-flow${cq}`,          { headers: { 'x-background': '1' } } as any).catch(() => ({ data: { data: null } })),
      api.get(`/ovds/reports/financial-summary${cq}`,  { headers: { 'x-background': '1' } } as any).catch(() => ({ data: { data: null } })),
    ]).then(([cfRes, fsRes]) => {
      const cf = cfRes.data?.data ?? cfRes.data;
const fs = fsRes.data?.data ?? fsRes.data;
const totalInflows  = cf?.operating?.inflows?.reduce((s: number, f: any) => s + f.amount, 0) ?? Number(cf?.totalInflows  ?? cf?.inflows  ?? fs?.revenue  ?? 0);
const totalOutflows = cf?.operating?.outflows?.reduce((s: number, f: any) => s + f.amount, 0) ?? Number(cf?.totalOutflows ?? cf?.outflows ?? fs?.expenses ?? 0);
      setSummary({
        totalInflows,
        totalOutflows,
        netCashFlow: cf?.netCashFlow ?? totalInflows - totalOutflows,
        operating:   cf?.operating?.net ?? 0,
        investing:   cf?.investing?.net ?? 0,
        financing:   cf?.financing?.net ?? 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [cq]);
useEffect(() => { fetchData(); }, [fetchData]);
useInterval(fetchData, 60_000);
const handleGenerateForecast = async () => {
    setGenerating(true);
try {
      const period = new Date().toISOString().slice(0, 7);
      await api.post('/ovds/treasury/forecast', { period });
toast.success(`Forecast generated for ${period}`);
      fetchData();
    }
catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to generate forecast');
    }
finally {
      setGenerating(false);
    }
  };
const inflows     = Number(summary?.totalInflows  ?? 0);
const outflows    = Number(summary?.totalOutflows ?? 0);
const netPosition = inflows - outflows;
const forecast    = buildForecast(inflows || 500_000, outflows || 350_000, scenario);
const forecastNet = forecast.reduce((s, m) => s + m.net, 0);
return (
    <AppPage
      title="Treasury Forecast"
      subtitle="Cash flow projections, scenario planning, and payment batch management · Investment Trends · Revenue Analytics · Market Value · Market Size · Banking & ovds"
      icon={<TrendingUp size={16} />}
      iconBg="bg-emerald-500"
      crumbs={[{ label: 'ovds' }, { label: 'Treasury' }]}
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />} onClick={fetchData} />
          <Btn variant="secondary" size="sm" icon={generating ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />} onClick={handleGenerateForecast} disabled={generating}>Generate Forecast</Btn>
          <Btn variant="primary" size="sm" icon={<BarChart3 size={14} />} onClick={() => setShowBatchModal(true)}>Payment Batch</Btn>
        </>
      }
    >
    <div className="space-y-5">

      {/* KPI cards — ovds-style */}
      <div className="ovds-widget-card overflow-hidden shadow-sm">{/* Inflow/outflow split bar */}
        {!loading && (inflows + outflows) > 0 && (
          <div className="flex h-1.5">
            <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${Math.round((inflows / (inflows + outflows)) * 100)}%` }} />
            <div className="bg-rose-400 flex-1" />
          </div>
        )}
        <div className="ovds-grid-layout cols-4 gap-sm">
          {[
            { label: 'Total Inflows',  value: loading ? '—' : fmt(inflows),     color: 'text-emerald-600 dark:text-emerald-400', sub: 'Cash received' },
            { label: 'Total Outflows', value: loading ? '—' : fmt(outflows),    color: 'text-rose-600 dark:text-rose-400',     sub: 'Cash paid out' },
            { label: 'Net Cash Flow',  value: loading ? '—' : fmt(netPosition), color: netPosition >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', sub: netPosition >= 0 ? 'Positive' : 'Negative' },
            { label: '6-Mo Forecast',  value: loading ? '—' : fmt(forecastNet), color: 'text-violet-600 dark:text-violet-400', sub: `${SCENARIO_META[scenario].label}` },
          ].map(k => (
            <div key={k.label} className="p-4">
              <div className={`flex items-center gap-1.5 ${k.color} mb-1.5`}>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</span>
              </div>
              <p className={`text-xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario selector */}
      <div className="ovds-widget-card p-5">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Scenario Planning</p>
        <div className="flex gap-3 flex-wrap">
          {(Object.entries(SCENARIO_META) as [Scenario, typeof SCENARIO_META[Scenario]][]).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setScenario(key)}
              className={`flex-1 min-w-[140px] p-4 rounded-xl border-2 text-left transition-all ${
                scenario === key
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/10 dark:bg-emerald-50 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500/40 dark:border-emerald-700'
              }`}
            >
              <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{meta.desc}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">×{meta.multiplier} revenue</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cash forecast chart */}
      <CashForecastChart />

      {/* Forecast table */}
      <div className="ovds-widget-card overflow-hidden">
        <button
          onClick={() => setShowForecastTable(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <BarChart3 size={15} className="text-emerald-600 dark:text-emerald-400" />
            6-Month Projection — <span className={SCENARIO_META[scenario].color}>{SCENARIO_META[scenario].label}</span>
          </h3>
          {showForecastTable ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </button>
        {showForecastTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm ovds-table min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50">
                  {['Month', 'Projected Inflows', 'Projected Outflows', 'Net', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left ovds-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecast.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{row.month}</td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold">{fmt(row.inflows)}</td>
                    <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-bold">{fmt(row.outflows)}</td>
                    <td className={`px-4 py-3 font-semibold ${row.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {row.net >= 0 ? '+' : '-'}{fmt(row.net)}
                    </td>
                    <td className="px-4 py-3">
                      {row.net >= 0
                        ? <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle size={11} /> Surplus</span>
                        : <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400"><AlertTriangle size={11} /> Deficit</span>
                      }
                    </td>
                  </tr>
                ))}
                <tr className="bg-white dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">6-Month Total</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{fmt(forecast.reduce((s, m) => s + m.inflows, 0))}</td>
                  <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-400">{fmt(forecast.reduce((s, m) => s + m.outflows, 0))}</td>
                  <td className={`px-4 py-3 font-semibold ${forecastNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {forecastNet >= 0 ? '+' : '-'}{fmt(forecastNet)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contextual insight */}
      <ContextualInsight
        text={`6-month ${SCENARIO_META[scenario].label} forecast: net ${forecastNet >= 0 ? 'surplus' : 'deficit'} of ${fmt(forecastNet)}. ${SCENARIO_META[scenario].desc}.`}
        variant={forecastNet >= 0 ? 'positive' : 'warning'}
      />

      {showBatchModal && <PaymentBatchModal onClose={() => setShowBatchModal(false)} onSuccess={() => { setShowBatchModal(false); fetchData(); }} />}
    </div>
    </AppPage>
  );
};
export default TreasuryForecast;









