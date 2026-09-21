/**
 * IAS 12 — Deferred Tax Page
 *
 * Tabs:
 *   1. Deferred Tax Position  — temporary differences, DTA/DTL, recognition, journal
 *   2. IAS 12 Reconciliation  — accounting profit → permanent adj → taxable income → CIT
 *   3. Dual Depreciation      — IFRS (IAS 16) vs Ethiopian Tax pool (Art. 25, Cat 1–4)
 *
 * Ethiopian BIT rate: 30% (Proclamation No. 979/2016)
 */
import type { TemporaryDifference } from '@ovds/features/reporting';
import { AppPage, Btn, AppTabs, TAX_DEPRECIATION_RATES, TAX_DEPRECIATION_CATEGORY_LABELS } from '@ovds/ui';
import {
  RefreshCw, BookOpen, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, Info, ChevronDown,
  ChevronRight, Send, GitBranch, BarChart3, ArrowRight,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { Icon } from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';
import { useDeferredTax, postDeferredTaxEntry } from '../services/reportsApi';
import { fmtCurrency } from '../utils/fmt';




const fmt = (n: number) => fmtCurrency(n, 'ETB');

// -- Local-only types (not in @ovds/features/reporting) -----------------------
interface _RecognitionAssessment {
  dtaRecognisable: boolean;
  rationale: string;
  profitabilityScore: number;
}

// -- Source icon mapping -------------------------------------------------------
function sourceIcon(source: string): React.ReactNode {
  if (source.includes('Fixed Asset'))
    return <Icon name="COMPANY" size={13} className="text-slate-400" />;
  if (source.includes('ECL'))
    return <Icon name="WARNING" size={13} className="text-rose-400" />;
  if (source.includes('Accrued'))
    return <Icon name="CLOCK" size={13} className="text-amber-400" />;
  if (source.includes('IFRS 15'))
    return <Icon name="INVOICE" size={13} className="text-violet-400" />;
  if (source.includes('Tax Loss'))
    return <Icon name="TREND_DOWN" size={13} className="text-slate-400" />;
  if (source.includes('IFRS 16'))
    return <Icon name="ITEM" size={13} className="text-sky-400" />;
  return <Icon name="CHART" size={13} className="text-slate-400" />;
}

// -- Difference row ------------------------------------------------------------
const DiffRow: React.FC<{
  diff: TemporaryDifference;
  expanded: boolean;
  onToggle: () => void;
}> = ({ diff, expanded, onToggle }) => (
  <>
    <tr
      className="hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={onToggle}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {sourceIcon(diff.source)}
          <span className="text-xs font-medium text-slate-700">
            {diff.source}
          </span>
          {diff.notes &&
            (expanded ? (
              <ChevronDown size={11} className="text-slate-300 shrink-0" />
            ) : (
              <ChevronRight size={11} className="text-slate-300 shrink-0" />
            ))}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 tabular-nums text-right">
        {fmt(diff.carryingAmount)}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 tabular-nums text-right">
        {fmt(diff.taxBase)}
      </td>
      <td className="px-4 py-3 text-xs font-medium tabular-nums text-right">
        <span
          className={diff.difference > 0 ? 'text-rose-600' : 'text-[var(--pro-azure)]'}
        >
          {diff.difference > 0 ? '+' : ''}
          {fmt(diff.difference)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            diff.type === 'TAXABLE'
              ? 'bg-rose-50 text-rose-600 border border-rose-100'
              : 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)] border border-[var(--pro-azure-100)]'
          }`}
        >
          {diff.type === 'TAXABLE' ? (
            <TrendingUp size={9} />
          ) : (
            <TrendingDown size={9} />
          )}
          {diff.type}
        </span>
      </td>
      <td className="px-4 py-3 text-xs font-bold tabular-nums text-right">
        {fmt(diff.deferredTax)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            diff.deferredTaxType === 'DTA'
              ? 'bg-sky-50 text-sky-600 border border-sky-100'
              : 'bg-amber-50 text-amber-600 border border-amber-100'
          }`}
        >
          {diff.deferredTaxType}
        </span>
      </td>
    </tr>
    {expanded && diff.notes && (
      <tr className="bg-white">
        <td colSpan={7} className="px-4 py-2.5">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {diff.notes}
          </p>
          {diff.reversalPeriod && (
            <p className="text-[10px] text-slate-400 mt-1">
              Estimated reversal: <strong>{diff.reversalPeriod}</strong>
            </p>
          )}
        </td>
      </tr>
    )}
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2: IAS 12 Reconciliation Bridge
// Accounting profit → permanent adj → temporary diff → taxable income → CIT
// ─────────────────────────────────────────────────────────────────────────────

const PERMANENT_ITEMS = [
  { label: 'Representation & entertainment expenses',     adj: '+', note: 'Non-deductible per Art. 23 — Proc. 979/2016' },
  { label: 'Donations exceeding 10% of taxable income',  adj: '+', note: 'Excess above 10% threshold is disallowed' },
  { label: 'Fines, penalties & interest on tax arrears', adj: '+', note: 'Always non-deductible' },
  { label: 'Non-VAT-compliant expenses',                  adj: '+', note: 'Expenses without valid ERCA-registered receipts' },
  { label: 'Tax-exempt income (e.g. export incentives)',  adj: '−', note: 'Deduct from accounting profit' },
];

const TEMPORARY_ITEMS = [
  { label: 'IFRS depreciation > Tax pool depreciation', adj: '+', note: 'IFRS component depr. exceeds pool rate → add back', tag: 'DTL' },
  { label: 'Tax pool depreciation > IFRS depreciation', adj: '−', note: 'Accelerated tax deduction → deductible timing diff', tag: 'DTA' },
  { label: 'ECL provision (IFRS 9)',                    adj: '+', note: 'General ECL provision not deductible until write-off', tag: 'DTA' },
  { label: 'IAS 19 leave & gratuity accruals',          adj: '+', note: 'Deductible only when paid — timing difference', tag: 'DTA' },
  { label: 'IFRS 15 deferred revenue',                  adj: '−', note: 'Already taxable on cash receipt basis', tag: 'DTA' },
  { label: 'IFRS 16 ROU asset / lease liability',       adj: '±', note: 'Net timing difference on interest vs straight-line', tag: 'DTL' },
  { label: 'Unused tax losses (carry-forward ≤ 3 yrs)', adj: '−', note: 'Recognised only if future profits probable (IAS 12.35)', tag: 'DTA' },
];

interface ReconBridgeProps { accountingProfit: number; taxableIncome: number; cit: number; }

const ReconciliationBridge: React.FC<ReconBridgeProps> = ({ accountingProfit, taxableIncome, cit }) => {
  const rate = 0.30;
  const theoretical = accountingProfit * rate;
  const permDiff = theoretical > 0 ? ((cit - theoretical) / theoretical * 100).toFixed(1) : '—';

  const BridgeRow: React.FC<{ step: string; label: string; value?: string; sub?: string; cls?: string; arrow?: boolean }> =
    ({ step, label, value, sub, cls = 'text-slate-700', arrow }) => (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 ${arrow ? '' : ''}`}>
      <div className="w-7 h-7 rounded-lg bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] text-[10px] font-black flex items-center justify-center shrink-0">{step}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${cls}`}>{label}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {value && <span className={`text-sm font-bold tabular-nums shrink-0 ${cls}`}>{value}</span>}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Bridge visual */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="ovds-widget-header">
          <GitBranch size={14} className="text-[var(--pro-azure)]" />
          <h3 className="ovds-card-title">IAS 12.79 — Tax Reconciliation Bridge</h3>
          <span className="ovds-caption ml-auto">Accounting profit → Taxable income → CIT 30%</span>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          <BridgeRow step="①" label="Net Profit Before Tax (IFRS book)"
            value={accountingProfit > 0 ? fmt(accountingProfit) : '—'}
            sub="Per Statement of Comprehensive Income (IAS 1)"
            cls="text-slate-800 dark:text-slate-100" />
          <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20">
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">+ Add: Permanent Adjustments (non-deductible)</p>
          </div>
          {PERMANENT_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`text-[10px] font-bold w-4 shrink-0 ${item.adj === '+' ? 'text-rose-500' : 'text-[var(--pro-azure)]'}`}>{item.adj}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.note}</p>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">manual entry</span>
            </div>
          ))}
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">± Process: Temporary Differences → Deferred Tax</p>
          </div>
          {TEMPORARY_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`text-[10px] font-bold w-4 shrink-0 ${item.adj === '+' ? 'text-rose-500' : item.adj === '−' ? 'text-[var(--pro-azure)]' : 'text-slate-400'}`}>{item.adj}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.note}</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${item.tag === 'DTA' ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>{item.tag}</span>
            </div>
          ))}
          <BridgeRow step="②" label="Taxable Net Income (Schedule A)"
            value={taxableIncome > 0 ? fmt(taxableIncome) : '—'}
            sub="Adjusted for ERCA — Category A Corporate Return"
            cls="text-violet-700 dark:text-violet-300" arrow />
          <BridgeRow step="③" label="Corporate Income Tax @ 30%"
            value={cit > 0 ? fmt(cit) : '—'}
            sub="Proclamation No. 979/2016 — flat 30% on taxable income"
            cls="text-rose-700 dark:text-rose-400" />
        </div>
      </div>

      {/* IAS 12.79 disclosure table */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="ovds-widget-header">
          <h3 className="ovds-card-title">IAS 12.79 — Effective Tax Rate Reconciliation</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                {['Item', 'ETB', '% of Acc. Profit'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left ovds-label">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { label: 'Accounting profit before tax',         val: accountingProfit, pct: null,      cls: 'font-bold' },
                { label: 'Theoretical tax @ 30%',               val: theoretical,       pct: 30,        cls: '' },
                { label: 'Permanent difference impact',         val: cit - theoretical, pct: parseFloat(permDiff) || 0, cls: 'text-rose-600' },
                { label: 'Actual income tax expense (CIT)',      val: cit,               pct: accountingProfit > 0 ? cit / accountingProfit * 100 : null, cls: 'font-bold text-rose-700' },
                { label: 'Effective tax rate',                   val: null,              pct: accountingProfit > 0 ? cit / accountingProfit * 100 : null, cls: 'font-bold' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className={`px-4 py-2.5 ${row.cls}`}>{row.label}</td>
                  <td className={`px-4 py-2.5 tabular-nums text-right ${row.cls}`}>{row.val !== null ? fmt(row.val) : '—'}</td>
                  <td className={`px-4 py-2.5 tabular-nums text-right ${row.cls}`}>{row.pct !== null ? `${Number(row.pct).toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-[var(--pro-azure-50)] border-t border-[var(--pro-azure-100)]">
          <p className="text-[10px] text-[var(--pro-azure)]">
            IAS 12.81(c) requires disclosure of the numerical reconciliation between tax expense and accounting profit × statutory rate. MAT applies if 2.5% × gross turnover &gt; regular CIT.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3: Dual Depreciation — IFRS (IAS 16) vs Ethiopian Tax Pool (Art. 25)
// ─────────────────────────────────────────────────────────────────────────────

type TaxCat = 'CAT_1' | 'CAT_2' | 'CAT_3' | 'CAT_4';

const CAT_COLORS: Record<TaxCat, { bg: string; text: string; border: string }> = {
  CAT_1: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  CAT_2: { bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200' },
  CAT_3: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  CAT_4: { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200' },
};

const DualDepreciationTab: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = companyId ? `?companyId=${companyId}` : '';
    api.get(`/ovds/fixed-assets${q}`, { headers: { 'x-background': '1' } } as any)
      .then((r: any) => setAssets(Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  // Map asset category → tax pool category
  const mapCategory = (cat: string): TaxCat => {
    if (['COMPUTER', 'SOFTWARE', 'IT_EQUIPMENT'].includes(cat)) return 'CAT_1';
    if (['VEHICLE', 'TRUCK', 'MACHINERY_TRANSPORT'].includes(cat)) return 'CAT_2';
    if (['INTANGIBLE', 'PATENT', 'LICENSE', 'GOODWILL'].includes(cat)) return 'CAT_4';
    return 'CAT_3'; // buildings, plant, furniture, equipment, other
  };

  const rows = assets.map((a: any) => {
    const cost     = Number(a.purchaseCost ?? 0);
    const nbv      = Number(a.netBookValue ?? cost);
    const _accDepr  = Number(a.accumulatedDepreciation ?? 0);
    const taxCat   = mapCategory(a.category ?? '');
    const taxRate  = TAX_DEPRECIATION_RATES[taxCat];
    const taxDepr  = nbv * taxRate;          // declining balance on NBV
    const ifrsLife = Number(a.usefulLifeYears ?? 5);
    const salvage  = Number(a.salvageValue ?? 0);
    const ifrsDepr = ifrsLife > 0 ? (cost - salvage) / ifrsLife : 0;
    const tempDiff = ifrsDepr - taxDepr;
    return { ...a, taxCat, taxRate, taxDepr, ifrsDepr, tempDiff, nbv };
  });

  const totIfrs = rows.reduce((s, r) => s + r.ifrsDepr, 0);
  const totTax  = rows.reduce((s, r) => s + r.taxDepr, 0);
  const totDiff = rows.reduce((s, r) => s + r.tempDiff, 0);

  return (
    <div className="space-y-5">
      {/* Category reference cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(TAX_DEPRECIATION_RATES) as [TaxCat, number][]).map(([cat, rate]) => {
          const col = CAT_COLORS[cat];
          return (
            <div key={cat} className={`p-4 rounded-xl border ${col.bg} ${col.border}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase ${col.text}`}>{cat.replace('_', ' ')}</span>
                <span className={`text-xl font-black ${col.text}`}>{(rate * 100).toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {TAX_DEPRECIATION_CATEGORY_LABELS[cat].split('—')[1]?.trim() ?? ''}
              </p>
              <p className="text-[9px] text-slate-400 mt-1">Art. 25 · Proc. 979/2016 · Declining balance</p>
            </div>
          );
        })}
      </div>

      {/* How the two books differ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="ovds-widget-card p-4">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">IFRS Book — IAS 16</p>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex gap-2"><span className="text-[var(--pro-azure)] font-bold shrink-0">✓</span>Component-based straight-line depreciation</li>
            <li className="flex gap-2"><span className="text-[var(--pro-azure)] font-bold shrink-0">✓</span>Based on specific useful life per component</li>
            <li className="flex gap-2"><span className="text-[var(--pro-azure)] font-bold shrink-0">✓</span>Revaluation model allowed (IAS 16.31)</li>
            <li className="flex gap-2"><span className="text-[var(--pro-azure)] font-bold shrink-0">✓</span>Impairment testing required (IAS 36)</li>
            <li className="flex gap-2"><span className="text-sky-500 font-bold shrink-0">→</span>Drives IFRS financial statements</li>
          </ul>
        </div>
        <div className="ovds-widget-card p-4">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tax Book — Art. 25 Pool Depreciation</p>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex gap-2"><span className="text-amber-500 font-bold shrink-0">✓</span>Assets pooled by category (Cat 1–4)</li>
            <li className="flex gap-2"><span className="text-amber-500 font-bold shrink-0">✓</span>Declining balance on pool closing balance</li>
            <li className="flex gap-2"><span className="text-amber-500 font-bold shrink-0">✓</span>No revaluation — historical cost only</li>
            <li className="flex gap-2"><span className="text-amber-500 font-bold shrink-0">✓</span>Deductible for ERCA tax purposes</li>
            <li className="flex gap-2"><span className="text-rose-500 font-bold shrink-0">→</span>Difference = IAS 12 temporary difference × 30%</li>
          </ul>
        </div>
      </div>

      {/* Asset-level comparison table */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="ovds-widget-header">
          <BarChart3 size={14} className="text-amber-500" />
          <h3 className="ovds-card-title">Asset-Level Dual Depreciation Comparison</h3>
          <span className="ovds-caption ml-auto">IFRS (IAS 16) vs Tax Pool (Art. 25) · ETB</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCw size={18} className="animate-spin text-slate-300" />
          </div>
        ) : rows.length === 0 ? (
          <div className="ovds-empty py-10">
            <p className="text-sm font-semibold text-slate-400">No fixed assets found</p>
            <p className="ovds-caption mt-1">Add assets in Fixed Assets register to see dual depreciation analysis</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white border-b border-slate-100 dark:border-slate-800">
                  {['Asset', 'Category', 'Tax Pool', 'NBV', 'IFRS Depr. (SL)', 'Tax Depr. (Pool)', 'Diff', 'IAS 12 DT'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left ovds-label whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {rows.map((r: any, i: number) => {
                  const col = CAT_COLORS[r.taxCat as TaxCat];
                  const dt  = Math.abs(r.tempDiff) * 0.30;
                  return (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200 max-w-[140px] truncate">{r.name}</td>
                      <td className="px-3 py-2.5 text-slate-500">{r.category}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${col.bg} ${col.text} ${col.border}`}>
                          {r.taxCat.replace('_', ' ')} · {(r.taxRate * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-right text-slate-600">{fmt(r.nbv)}</td>
                      <td className="px-3 py-2.5 tabular-nums text-right text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] font-semibold">{fmt(r.ifrsDepr)}</td>
                      <td className="px-3 py-2.5 tabular-nums text-right text-amber-700 dark:text-amber-400 font-semibold">{fmt(r.taxDepr)}</td>
                      <td className="px-3 py-2.5 tabular-nums text-right">
                        <span className={r.tempDiff > 0 ? 'text-rose-600' : r.tempDiff < 0 ? 'text-[var(--pro-azure)]' : 'text-slate-300'}>
                          {r.tempDiff > 0 ? '+' : ''}{fmt(r.tempDiff)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-right">
                        <span className={r.tempDiff > 0 ? 'text-amber-600 font-bold' : r.tempDiff < 0 ? 'text-sky-600 font-bold' : 'text-slate-300'}>
                          {dt > 0 ? fmt(dt) : '—'}
                          {r.tempDiff !== 0 && (
                            <span className="ml-1 text-[8px]">{r.tempDiff > 0 ? 'DTL' : 'DTA'}</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 dark:bg-slate-700 border-t border-slate-200">
                  <td colSpan={4} className="px-3 py-3 text-white font-black text-[11px] uppercase">Total</td>
                  <td className="px-3 py-3 tabular-nums text-right font-black text-[var(--pro-azure-light)]">{fmt(totIfrs)}</td>
                  <td className="px-3 py-3 tabular-nums text-right font-black text-amber-400">{fmt(totTax)}</td>
                  <td className="px-3 py-3 tabular-nums text-right font-black">
                    <span className={totDiff > 0 ? 'text-rose-400' : totDiff < 0 ? 'text-[var(--pro-azure-light)]' : 'text-slate-400'}>
                      {totDiff > 0 ? '+' : ''}{fmt(totDiff)}
                    </span>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-right font-black text-white">
                    {fmt(Math.abs(totDiff) * 0.30)}
                    <span className="ml-1 text-[9px] text-slate-400">{totDiff > 0 ? 'DTL' : totDiff < 0 ? 'DTA' : ''}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400">
        <Info size={13} className="shrink-0 mt-0.5" />
        <span>
          The difference between IFRS depreciation (IAS 16) and Tax pool depreciation (Art. 25, Proc. 979/2016) creates a
          temporary difference under IAS 12. Multiply the net timing difference by 30% to arrive at the deferred tax liability (DTL)
          or asset (DTA) to recognise on the balance sheet. This feeds directly into the IAS 12 Reconciliation Bridge above.
        </span>
      </div>
    </div>
  );
};

// -- Main page ------------------------------------------------------------------
const DeferredTax: React.FC = () => {
  usePageTitle('IAS 12 — Deferred Tax');
  const { selectedCompanyId } = useBusiness();
  const [activeTab, setActiveTab] = useState<'position' | 'reconciliation' | 'dual_depr'>('position');
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [posting, setPosting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Reconciliation bridge inputs (manual entry or loaded from API)
  const [reconProfit, setReconProfit]   = useState(0);
  const [reconTaxable, setReconTaxable] = useState(0);
  const [reconCit, setReconCit]         = useState(0);

  const { data, loading, refetch } = useDeferredTax(
    selectedCompanyId ?? undefined,
    asOf,
  );

  // Re-fetch when date changes
  useEffect(() => {
    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asOf]);

  // Load reconciliation data from BIT endpoint
  useEffect(() => {
    const year = new Date(asOf).getFullYear() - 1;
    api.get(`/tax/income-tax/${year}`, { headers: { 'x-background': '1' } } as any)
      .then((r: any) => {
        const d = r.data?.data ?? r.data;
        if (d) {
          setReconProfit(d.netProfit ?? d.annualRevenue ?? 0);
          setReconCit(d.taxPayable ?? 0);
          setReconTaxable(d.netProfit ?? 0);
        }
      })
      .catch(() => {});
  }, [asOf]);

  const toggleRow = (i: number) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });

  const handlePostJournal = async () => {
    if (!data?.journalEntry) return;
    setPosting(true);
    try {
      await postDeferredTaxEntry(selectedCompanyId ?? undefined, asOf);
      toast.success('IAS 12 deferred tax journal entry posted to GL');
      refetch();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? 'Failed to post journal entry',
      );
    } finally {
      setPosting(false);
    }
  };

  const netPos = data?.netPosition;
  const netDt = data?.netDeferredTax ?? 0;

  return (
    <AppPage
      title="Deferred Tax"
      subtitle="IAS 12 — Temporary differences · Reconciliation bridge · Dual depreciation (Art. 25) · Accounting & ovds Software · Banking & ovds · Healthcare & Pharmaceuticals · Market Value · Strategic Insights"
      icon={<BookOpen size={18} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      crumbs={[{ label: 'IFRS & Standards' }, { label: 'Deferred Tax' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'position',       label: 'Deferred Tax Position' },
            { key: 'reconciliation', label: 'IAS 12 Reconciliation' },
            { key: 'dual_depr',      label: 'Dual Depreciation' },
          ]}
          active={activeTab}
          onChange={k => setActiveTab(k as typeof activeTab)}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">As of:</label>
          <input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)]"
          />
          {activeTab === 'position' && (
            <>
              <Btn
                variant="secondary"
                size="sm"
                icon={loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                onClick={refetch}
                disabled={loading}
              >
                Recompute
              </Btn>
              {data?.journalEntry && (
                <Btn
                  variant="primary"
                  size="sm"
                  icon={posting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  onClick={handlePostJournal}
                  disabled={posting}
                >
                  Post to GL
                </Btn>
              )}
            </>
          )}
        </div>
      }
    >
      {/* ── Tab 1: Deferred Tax Position ── */}
      {activeTab === 'position' && (
      <div className="space-y-5">
        {/* -- Net position hero -- */}
        <div
          className={`ovds-widget-card overflow-hidden border-l-4 ${
            netPos === 'NET_DTA'
              ? 'border-l-sky-500'
              : netPos === 'NET_DTL'
                ? 'border-l-amber-500'
                : 'border-l-slate-300'
          }`}
        >
          <div className="p-5 flex items-center gap-6">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                netPos === 'NET_DTA'
                  ? 'bg-sky-50'
                  : netPos === 'NET_DTL'
                    ? 'bg-amber-50'
                    : 'bg-white'
              }`}
            >
              {loading ? (
                <RefreshCw size={24} className="text-slate-300 animate-spin" />
              ) : netPos === 'NET_DTA' ? (
                <TrendingUp size={24} className="text-sky-500" />
              ) : netPos === 'NET_DTL' ? (
                <TrendingDown size={24} className="text-amber-500" />
              ) : (
                <Minus size={24} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="ovds-card-title">
                {loading
                  ? 'Computing…'
                  : netPos === 'NET_DTA'
                    ? 'Net Deferred Tax Asset'
                    : netPos === 'NET_DTL'
                      ? 'Net Deferred Tax Liability'
                      : 'No Deferred Tax Position'}
              </p>
              <p
                className={`text-2xl font-black tabular-nums mt-0.5 ${
                  netPos === 'NET_DTA'
                    ? 'text-sky-600'
                    : netPos === 'NET_DTL'
                      ? 'text-amber-600'
                      : 'text-slate-400'
                }`}
              >
                {loading ? '—' : fmt(Math.abs(netDt))}
              </p>
              <p className="ovds-caption mt-1">
                Ethiopian BIT rate: {((data?.taxRate ?? 0.3) * 100).toFixed(0)}%
                · As of {asOf}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 shrink-0">
              <div className="text-center px-4 py-2 bg-sky-50 rounded-xl">
                <p className="text-lg font-bold text-sky-600 tabular-nums">
                  {loading ? '—' : fmt(data?.totalDta ?? 0)}
                </p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Gross DTA</p>
              </div>
              <div className="text-center px-4 py-2 bg-amber-50 rounded-xl">
                <p className="text-lg font-bold text-amber-600 tabular-nums">
                  {loading ? '—' : fmt(data?.totalDtl ?? 0)}
                </p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Gross DTL</p>
              </div>
            </div>
          </div>
        </div>

        {/* -- DTA Recognition Assessment -- */}
        {data?.recognitionAssessment && (
          <div
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
              data.recognitionAssessment.dtaRecognisable
                ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {data.recognitionAssessment.dtaRecognisable ? (
              <CheckCircle2
                size={16}
                className="shrink-0 mt-0.5 text-[var(--pro-azure)]"
              />
            ) : (
              <AlertTriangle
                size={16}
                className="shrink-0 mt-0.5 text-amber-600"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <strong>IAS 12.35 — DTA Recognition:</strong>
                <span>
                  {data.recognitionAssessment.dtaRecognisable
                    ? 'Probable'
                    : 'Uncertain'}
                </span>
                <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded bg-white/60">
                  Score: {data.recognitionAssessment.profitabilityScore}%
                </span>
              </div>
              <p className="text-xs mt-1 opacity-80">
                {data.recognitionAssessment.rationale}
              </p>
            </div>
          </div>
        )}

        {/* -- Temporary differences table -- */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header">
            <h3 className="ovds-card-title">Temporary Differences</h3>
            <span className="ovds-caption ml-auto">
              Click a row to expand notes
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  {[
                    'Source',
                    'IFRS Carrying Amt',
                    'Tax Base',
                    'Difference',
                    'Type',
                    'Deferred Tax',
                    'DTA / DTL',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i}>
                        {Array(7)
                          .fill(0)
                          .map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div
                                className="h-4 bg-slate-100 rounded animate-pulse"
                                style={{ width: j === 0 ? '160px' : '90px' }}
                              />
                            </td>
                          ))}
                      </tr>
                    ))
                ) : (data?.differences ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <BookOpen
                        size={32}
                        className="mx-auto text-slate-200 mb-2"
                      />
                      <p className="text-sm text-slate-400">
                        No temporary differences found
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Add fixed assets, leases, or invoices with ECL
                        provisions to generate IAS 12 differences.
                      </p>
                    </td>
                  </tr>
                ) : (
                  (data?.differences ?? []).map((diff, i) => (
                    <DiffRow
                      key={i}
                      diff={diff}
                      expanded={expandedRows.has(i)}
                      onToggle={() => toggleRow(i)}
                    />
                  ))
                )}
              </tbody>
              {(data?.differences ?? []).length > 0 && (
                <tfoot>
                  <tr className="bg-white border-t border-slate-200">
                    <td
                      className="px-4 py-3 text-xs font-bold text-slate-600"
                      colSpan={5}
                    >
                      Net position
                    </td>
                    <td className="px-4 py-3 text-sm font-bold tabular-nums text-right">
                      <span
                        className={
                          netDt > 0
                            ? 'text-sky-600'
                            : netDt < 0
                              ? 'text-amber-600'
                              : 'text-slate-400'
                        }
                      >
                        {fmt(Math.abs(netDt))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          netPos === 'NET_DTA'
                            ? 'bg-sky-50 text-sky-600 border border-sky-100'
                            : netPos === 'NET_DTL'
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {netPos === 'NET_DTA'
                          ? 'Net DTA'
                          : netPos === 'NET_DTL'
                            ? 'Net DTL'
                            : 'Zero'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* -- Suggested journal entry -- */}
        {data?.journalEntry && (
          <div className="ovds-widget-card overflow-hidden">
            <div className="ovds-widget-header">
              <h3 className="ovds-card-title">
                Suggested Period-End Journal Entry
              </h3>
              <span className="text-[10px] text-slate-400 ml-auto">
                IAS 12 — Post to GL to recognise deferred tax balance
              </span>
            </div>
            <div className="ovds-widget-body">
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Debit (ETB)
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Credit (ETB)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                        Dr {data.journalEntry.debitAccount}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-800 tabular-nums text-right">
                        {fmt(data.journalEntry.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 text-right">
                        —
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700 pl-8">
                        Cr {data.journalEntry.creditAccount}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 text-right">
                        —
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-800 tabular-nums text-right">
                        {fmt(data.journalEntry.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                {data.journalEntry.description}
              </p>
              <div className="mt-3">
                <Btn
                  variant="primary"
                  size="sm"
                  icon={
                    posting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )
                  }
                  onClick={handlePostJournal}
                  disabled={posting}
                >
                  {posting ? 'Posting…' : 'Post Journal Entry to GL'}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* -- IFRS reference footer -- */}
        {data?.ifrsReference && (
          <div className="flex gap-3 px-4 py-3 bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-xl text-xs text-[var(--pro-azure)]">
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>{data.ifrsReference}</span>
          </div>
        )}
      </div>
      )} {/* end Tab 1 */}

      {/* ── Tab 2: IAS 12 Reconciliation Bridge ── */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          {/* Manual override inputs when API data unavailable */}
          <div className="ovds-widget-card p-4">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Override Inputs (auto-loaded from BIT filing)</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Accounting Profit Before Tax (ETB)', val: reconProfit,   setter: setReconProfit },
                { label: 'Taxable Net Income (ETB)',           val: reconTaxable,  setter: setReconTaxable },
                { label: 'CIT Payable (ETB)',                  val: reconCit,      setter: setReconCit },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">{f.label}</label>
                  <input
                    type="number" min="0" step="1"
                    value={f.val || ''}
                    onChange={e => f.setter(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20"
                  />
                </div>
              ))}
            </div>
          </div>
          <ReconciliationBridge
            accountingProfit={reconProfit}
            taxableIncome={reconTaxable}
            cit={reconCit}
          />
        </div>
      )}

      {/* ── Tab 3: Dual Depreciation ── */}
      {activeTab === 'dual_depr' && (
        <DualDepreciationTab companyId={selectedCompanyId ?? undefined} />
      )}
    </AppPage>
  );
};

export default DeferredTax;
