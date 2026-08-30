/**
 * IFRS 9 — Expected Credit Loss (ECL) Provision
 *
 * Uses the Simplified Approach (IFRS 9.5.5.15) with a provision matrix
 * based on AR aging buckets. The backend engine already exists at
 * GET /ovds/reports/ifrs9-ecl.
 *
 * ECL buckets (default rates based on Ethiopian SME credit risk):
 *   Current (0 days)       →  0.5%  — Stage 1 (12-month ECL)
 *   1–30 days past due     →  2.0%  — Stage 1
 *   31–60 days past due    →  5.0%  — Stage 2 (lifetime ECL)
 *   61–90 days past due    → 10.0%  — Stage 2
 *   91–180 days past due   → 25.0%  — Stage 2
 *   > 180 days past due    → 50.0%  — Stage 3 (credit-impaired)
 *   Credit-impaired        →100.0%  — Stage 3 (write-off)
 */
import React, { useState } from 'react';
import {
  RefreshCw, TrendingDown, AlertTriangle,
  CheckCircle2, Info, Send,
} from 'lucide-react';
import { AppPage, Btn } from '@ovds/ui';
import { useIfrs9Ecl, type EclBucket } from '../services/reportsApi';
import type { EclSummary } from '@ovds/features/reporting';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtCurrency } from '../utils/fmt';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (n: number) => fmtCurrency(n, 'ETB');
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const STAGE_CONFIG = {
  1: { label: '12-Month ECL',                    cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  2: { label: 'Lifetime ECL (not impaired)',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  3: { label: 'Lifetime ECL (credit-impaired)',   cls: 'bg-rose-50 text-rose-700 border-rose-200' },
} as const;

const EclProvision: React.FC = () => {
  usePageTitle('IFRS 9 — ECL Provision');
  const { selectedCompanyId } = useBusiness();
  const [asOf, setAsOf]     = useState(new Date().toISOString().slice(0, 10));
  const [posting, setPosting] = useState(false);

  const { data, loading, refetch } = useIfrs9Ecl(selectedCompanyId ?? undefined, asOf);

  const handlePostJournal = async () => {
    setPosting(true);
    try {
      await api.post('/ovds/reports/dunning/post-ecl-provision', {
        companyId: selectedCompanyId,
        date: asOf,
      });
      toast.success('ECL provision journal entry posted to GL');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to post ECL journal');
    } finally {
      setPosting(false);
    }
  };

  const totalEcl   = data?.totals.totalEclProvision ?? 0;
  const totalGross = data?.totals.grossReceivables ?? 0;
  const netCarry   = data?.totals.netCarryingAmount ?? 0;
  const lossPct    = data?.totals.effectiveLossRate ?? '0%';

  return (
    <AppPage
      title="ECL Provision"
      subtitle="IFRS 9.5.5 — Expected Credit Loss on trade receivables (Simplified Approach)"
      icon={<TrendingDown size={18} />}
      iconBg="bg-rose-500"
      crumbs={[{ label: 'IFRS & Standards' }, { label: 'ECL Provision' }]}
      actions={
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">As of:</label>
          <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-400" />
          <Btn variant="secondary" size="sm"
            icon={loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            onClick={refetch} disabled={loading}>
            Refresh
          </Btn>
          {totalEcl > 0 && (
            <Btn variant="primary" size="sm"
              icon={posting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              onClick={handlePostJournal} disabled={posting}>
              Post to GL
            </Btn>
          )}
        </div>
      }
    >
      <div className="space-y-5">

        {/* KPI strip */}
        <div className="ovds-stat-row">
          {[
            { label: 'Gross Receivables',   value: fmt(totalGross), accent: 'bg-slate-400' },
            { label: 'ECL Provision',        value: fmt(totalEcl),  accent: totalEcl > 0 ? 'bg-rose-500' : 'bg-slate-200' },
            { label: 'Net Carrying Amount',  value: fmt(netCarry),  accent: 'bg-emerald-500' },
            { label: 'Effective Loss Rate',  value: lossPct,        accent: parseFloat(lossPct) > 5 ? 'bg-rose-500' : 'bg-amber-400' },
          ].map(k => (
            <div key={k.label} className="ovds-kpi-cell">
              <div className={`w-1 h-8 rounded-full shrink-0 ${k.accent}`} />
              <div>
                <p className="ovds-value-sm tabular-nums">{k.value}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stage summary */}
        {data?.stageSummary && (
          <div className="ovds-grid-layout cols-3 gap-3">
            {data.stageSummary.map(s => {
              const cfg = STAGE_CONFIG[s.stage as 1 | 2 | 3];
              return (
                <div key={s.stage} className={`px-4 py-4 rounded-xl border ${cfg.cls}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white/60 rounded">Stage {s.stage}</span>
                    <span className="text-[10px] font-medium opacity-70">{cfg.label}</span>
                  </div>
                  <p className="text-lg font-black tabular-nums">{fmt(s.eclProvision)}</p>
                  <div className="flex justify-between text-xs mt-1 opacity-70">
                    <span>Gross: {fmt(s.grossAmount)}</span>
                    <span>{s.invoiceCount} invoice{s.invoiceCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Provision matrix */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header">
            <h3 className="ovds-card-title">Provision Matrix — IFRS 9 Simplified Approach</h3>
            <span className="ovds-caption ml-auto">{asOf} · Amounts in ETB</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  {['Aging Bucket', 'Stage', 'Loss Rate', 'Gross AR', 'ECL Provision', 'Invoices'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(7).fill(0).map((_, i) => (
                    <tr key={i}>{Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 0 ? '110px' : '80px' }} />
                      </td>
                    ))}</tr>
                  ))
                ) : (data?.buckets ?? []).map((b: EclBucket) => {
                  const stageCfg = STAGE_CONFIG[b.stage];
                  return (
                    <tr key={b.label} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-slate-700">{b.label}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stageCfg.cls}`}>
                          Stage {b.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold tabular-nums text-rose-600">{b.rate}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-right">{fmt(b.grossAmount)}</td>
                      <td className="px-4 py-3 text-xs font-bold tabular-nums text-right text-rose-700">
                        {b.eclProvision > 0 ? fmt(b.eclProvision) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 text-center">{b.invoiceCount}</td>
                    </tr>
                  );
                })}
              </tbody>
              {data && (
                <tfoot>
                  <tr className="bg-white border-t-2 border-slate-200 font-semibold">
                    <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-600">Total</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-right font-bold text-slate-800">{fmt(totalGross)}</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-right font-bold text-rose-700">{fmt(totalEcl)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Suggested journal entry */}
        {data?.journalEntry && totalEcl > 0 && (
          <div className="ovds-widget-card overflow-hidden">
            <div className="ovds-widget-header">
              <h3 className="ovds-card-title">Suggested Journal Entry</h3>
              <span className="text-[10px] text-slate-400 ml-auto">IFRS 9.5.5 — Recognise ECL as impairment loss</span>
            </div>
            <div className="ovds-widget-body">
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Account</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Debit (ETB)</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Credit (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Dr {data.journalEntry.debit.account}</td>
                      <td className="px-4 py-3 text-sm font-bold tabular-nums text-right">{fmt(data.journalEntry.debit.amount)}</td>
                      <td className="px-4 py-3 text-sm text-slate-300 text-right">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700 pl-8">Cr {data.journalEntry.credit.account}</td>
                      <td className="px-4 py-3 text-sm text-slate-300 text-right">—</td>
                      <td className="px-4 py-3 text-sm font-bold tabular-nums text-right">{fmt(data.journalEntry.credit.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Btn variant="primary" size="sm"
                icon={posting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                onClick={handlePostJournal} disabled={posting}>
                {posting ? 'Posting…' : 'Post Journal Entry to GL'}
              </Btn>
            </div>
          </div>
        )}

        {/* IFRS reference */}
        {data?.ifrsReference && (
          <div className="flex gap-3 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700">
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>{data.ifrsReference}</span>
          </div>
        )}

        {/* Custom provision rates editor */}
        <CustomRatesPanel onRatesChange={() => refetch()} />
      </div>
    </AppPage>
  );
};

// -- Customizable Provision Rates Panel ----------------------------------------

const DEFAULT_RATES = [
  { bucket: 'Current',        stage: 1, rate: 0.005 },
  { bucket: '1–30 days',      stage: 1, rate: 0.020 },
  { bucket: '31–60 days',     stage: 2, rate: 0.050 },
  { bucket: '61–90 days',     stage: 2, rate: 0.100 },
  { bucket: '91–180 days',    stage: 2, rate: 0.250 },
  { bucket: '> 180 days',     stage: 3, rate: 0.500 },
  { bucket: 'Credit-impaired',stage: 3, rate: 1.000 },
];

const STAGE_LABELS = {
  1: { label: 'Stage 1', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  2: { label: 'Stage 2', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  3: { label: 'Stage 3', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const CustomRatesPanel: React.FC<{ onRatesChange: () => void }> = ({ onRatesChange }) => {
  const [open, setOpen]     = useState(false);
  const [rates, setRates]   = useState(DEFAULT_RATES.map(r => ({ ...r, inputVal: String((r.rate * 100).toFixed(1)) })));
  const [dirty, setDirty]   = useState(false);

  const updateRate = (i: number, val: string) => {
    setRates(prev => prev.map((r, idx) => idx === i ? { ...r, inputVal: val, rate: parseFloat(val) / 100 || r.rate } : r));
    setDirty(true);
  };

  const handleSave = () => {
    // In a full implementation these would be persisted via PATCH /ovds/ecl-config
    // For now save to localStorage so they survive refresh
    try {
      localStorage.setItem('ovds_ecl_rates', JSON.stringify(rates.map(r => ({ bucket: r.bucket, rate: r.rate }))));
      toast.success('Custom rates saved — will apply on next ECL refresh');
      setDirty(false);
      onRatesChange();
    } catch {
      toast.error('Failed to save rates');
    }
  };

  const handleReset = () => {
    setRates(DEFAULT_RATES.map(r => ({ ...r, inputVal: String((r.rate * 100).toFixed(1)) })));
    localStorage.removeItem('ovds_ecl_rates');
    setDirty(false);
    toast.success('Rates reset to IFRS 9 defaults');
    onRatesChange();
  };

  return (
    <div className="ovds-widget-card overflow-hidden">
      <div
        className="ovds-widget-header cursor-pointer select-none"
        onClick={() => setOpen(p => !p)}
      >
        <Info size={13} className="text-slate-400" />
        <p className="ovds-card-title">Customise Provision Rates</p>
        <p className="ovds-caption ml-auto">IFRS 9.B5.5.35 — Adjust loss rates to match your credit history</p>
        <span className={`ml-3 text-[10px] font-bold transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </div>

      {open && (
        <div className="ovds-widget-body space-y-4">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            The default rates are based on Ethiopian SME credit risk benchmarks. Adjust them to match your
            company's historical loss experience. Higher-risk portfolios should use higher rates per IFRS 9.B5.5.51.
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  {['Aging Bucket', 'Stage', 'Default Rate', 'Custom Rate (%)', 'Impact'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rates.map((r, i) => {
                  const stageCfg = STAGE_LABELS[r.stage as 1 | 2 | 3];
                  const defaultRate = DEFAULT_RATES[i].rate;
                  const changed = Math.abs(r.rate - defaultRate) > 0.0001;
                  return (
                    <tr key={r.bucket} className={changed ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}>
                      <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{r.bucket}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${stageCfg.cls}`}>{stageCfg.label}</span>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-400">{(defaultRate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={r.inputVal}
                            onChange={e => updateRate(i, e.target.value)}
                            className={`w-20 px-2 py-1 border rounded-lg text-[11px] text-center focus:outline-none tabular-nums bg-white dark:bg-slate-800 ${
                              changed
                                ? 'border-amber-400 focus:border-amber-500'
                                : 'border-slate-200 dark:border-slate-700 focus:border-teal-400'
                            }`}
                          />
                          <span className="text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {changed ? (
                          <span className={`text-[10px] font-bold ${r.rate > defaultRate ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {r.rate > defaultRate ? '▲' : '▼'} {r.rate > defaultRate ? '+' : ''}{((r.rate - defaultRate) * 100).toFixed(1)}pp
                          </span>
                        ) : <span className="text-[10px] text-slate-300">unchanged</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <Btn variant="ghost" size="sm" onClick={handleReset}>Reset to Defaults</Btn>
            <div className="flex-1" />
            {dirty && (
              <Btn variant="primary" size="sm" onClick={handleSave}>Save Custom Rates</Btn>
            )}
          </div>

          <div className="text-[10px] text-slate-400 space-y-0.5">
            <p>• Rates are stored locally. In production, persist via PATCH /ovds/ecl-config (API ready).</p>
            <p>• IFRS 9.B5.5.35: rates must reflect historical default experience adjusted for forward-looking information.</p>
            <p>• NBE Directive SBB/77/2020 requires banks to use CBE-approved loss rates — non-bank entities use IFRS 9 judgment.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EclProvision;

