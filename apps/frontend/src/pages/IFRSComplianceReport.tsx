/**
 * IFRSComplianceReport — Ethiopia AABE Full IFRS Compliance Report
 *
 * Enhanced features:
 *  - Sticky sidebar table of contents with active-section scroll-spy
 *  - Collapsible accordion sections (expand/collapse all)
 *  - IAS 16 Componentisation Calculator (interactive)
 *  - Deferred Tax Temporary Difference Builder (interactive)
 *  - Disclosure Gap Tracker with persistent localStorage state
 *  - IFRS 15 Five-Step interactive flow
 *  - Tax Divergence Table with DTL/DTA badges
 *  - Compliance Readiness Score rings + bar matrix
 *  - One-click Copy for basis-of-preparation note
 *  - Print layout CSS injected via style tag
 */
import DOMPurify from 'dompurify';
import React, {
  useState, useRef, useCallback, useEffect, useLayoutEffect,
} from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle, AlertTriangle, Activity, ShieldCheck,
  Building2, Landmark, Layers, ArrowRight, ExternalLink,
  Info, Clock, TrendingUp, Hash, Copy, Printer,
  ChevronDown, ChevronUp, CircleDot, ListChecks, Scale,
  Banknote, Factory, Home, Award, BookOpen, Plus, Trash2,
  Calculator, ClipboardCheck, RefreshCw,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────

const RefTag: React.FC<{ code: string }> = ({ code }) => (
  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0">
    <Hash size={7} />{code}
  </span>
);

const StdBadge: React.FC<{ code: string; color?: string }> = ({ code, color = 'emerald' }) => (
  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0
    bg-${color}-50 text-${color}-700 border-${color}-200
    dark:bg-${color}-950/30 dark:text-${color}-300 dark:border-${color}-800`}>
    {code}
  </span>
);

const RuleRow: React.FC<{
  label: string; children: React.ReactNode; icon?: React.ReactNode;
}> = ({ label, children, icon }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <div className="shrink-0 mt-0.5 text-slate-400">{icon ?? <CircleDot size={11} />}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">{label}</p>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{children}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Accordion
// ─────────────────────────────────────────────────────────────────────────────

interface AccordionProps {
  id: string; num: string; title: string; subtitle: string;
  icon: React.ReactNode; accentCls: string; children: React.ReactNode;
  openSections: Set<string>; toggle: (id: string) => void;
}

const Accordion: React.FC<AccordionProps> = ({
  id, num, title, subtitle, icon, accentCls, children, openSections, toggle,
}) => {
  const isOpen = openSections.has(id);
  return (
    <div
      id={`section-${id}`}
      className={`rounded-2xl border-2 transition-all scroll-mt-20 ${
        isOpen ? accentCls : 'border-slate-100 dark:border-slate-800'
      } overflow-hidden`}
    >
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
      >
        <span className="text-2xl font-black text-slate-100 dark:text-slate-800 leading-none select-none w-8 shrink-0">
          {num}
        </span>
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{title}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subtitle}</p>
        </div>
        <div className="shrink-0 text-slate-400">
          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Score Ring
// ─────────────────────────────────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number; label: string; color: string }> = ({
  score, label, color,
}) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[72px] h-[72px]">
        <svg width="72" height="72" className="-rotate-90 absolute inset-0">
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor"
            strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color}
            strokeWidth="6" strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.9s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">{score}%</p>
        </div>
      </div>
      <p className="text-[9px] text-slate-400 mt-1.5 text-center leading-tight max-w-[64px]">{label}</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// IAS 16 Componentisation Calculator
// ─────────────────────────────────────────────────────────────────────────────

interface Component { id: string; name: string; cost: number; life: number; }

const ComponentisationCalc: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([
    { id: '1', name: 'Structure / Shell',    cost: 5_000_000, life: 40 },
    { id: '2', name: 'Roof',                 cost: 800_000,   life: 15 },
    { id: '3', name: 'Mechanical / HVAC',    cost: 600_000,   life: 10 },
    { id: '4', name: 'Electrical Fit-out',   cost: 400_000,   life: 12 },
  ]);

  const addRow = () => setComponents(prev => [
    ...prev,
    { id: String(Date.now()), name: '', cost: 0, life: 10 },
  ]);

  const removeRow = (id: string) =>
    setComponents(prev => prev.filter(c => c.id !== id));

  const update = (id: string, field: keyof Component, val: string) =>
    setComponents(prev => prev.map(c =>
      c.id !== id ? c : {
        ...c,
        [field]: field === 'name' ? val : (parseFloat(val) || 0),
      }
    ));

  const totalCost = components.reduce((s, c) => s + c.cost, 0);

  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
        IAS 16.43 — Componentisation Calculator (ETB)
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-xs">
          <thead className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {['Component', 'Cost (ETB)', 'Useful Life (yrs)', 'Annual Dep. (ETB)', '% of Total', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {components.map((c, i) => {
              const annualDep = c.life > 0 ? c.cost / c.life : 0;
              const pct = totalCost > 0 ? (c.cost / totalCost) * 100 : 0;
              return (
                <tr key={c.id} className={`border-b border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-800/20'}`}>
                  <td className="px-3 py-2">
                    <input value={c.name} onChange={e => update(c.id, 'name', e.target.value)}
                      placeholder="Component name"
                      className="w-32 bg-transparent border-b border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 pb-0.5" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={c.cost || ''} onChange={e => update(c.id, 'cost', e.target.value)}
                      className="w-28 bg-transparent border-b border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 pb-0.5 text-right" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={c.life || ''} onChange={e => update(c.id, 'life', e.target.value)}
                      className="w-16 bg-transparent border-b border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 pb-0.5 text-center" />
                  </td>
                  <td className="px-3 py-2 font-mono text-emerald-700 dark:text-emerald-400 text-right">
                    {annualDep.toLocaleString('en-ET', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-500">{pct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeRow(c.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-emerald-50/60 dark:bg-emerald-950/20 border-t-2 border-emerald-200 dark:border-emerald-800">
            <tr>
              <td className="px-3 py-2 text-xs font-black text-slate-700 dark:text-slate-200">Total Asset Cost</td>
              <td className="px-3 py-2 font-black font-mono text-emerald-700 dark:text-emerald-400 text-right">
                {totalCost.toLocaleString('en-ET')}
              </td>
              <td />
              <td className="px-3 py-2 font-black font-mono text-emerald-700 dark:text-emerald-400 text-right">
                {components.reduce((s, c) => s + (c.life > 0 ? c.cost / c.life : 0), 0)
                  .toLocaleString('en-ET', { maximumFractionDigits: 0 })}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
      <button onClick={addRow}
        className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
        <Plus size={11} /> Add Component
      </button>
      <p className="text-[9px] text-slate-400 mt-1">
        IAS 16.43 — each part with a cost that is significant relative to the total cost must be depreciated separately.
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Deferred Tax Temporary Difference Builder
// ─────────────────────────────────────────────────────────────────────────────

interface TempDiff {
  id: string; description: string;
  ifrsBook: number; taxBase: number; type: 'DTL' | 'DTA';
}

const DeferredTaxBuilder: React.FC = () => {
  const BIT = 0.30;
  const [rows, setRows] = useState<TempDiff[]>([
    { id: '1', description: 'PPE — IFRS SL vs Tax Pool depreciation',  ifrsBook: 1_200_000, taxBase: 900_000,   type: 'DTL' },
    { id: '2', description: 'Trade receivables — ECL provision (IFRS9)', ifrsBook: 350_000,  taxBase: 500_000,   type: 'DTA' },
    { id: '3', description: 'ovds lease — ROU asset (IFRS 16)',      ifrsBook: 700_000,  taxBase: 0,         type: 'DTL' },
  ]);

  const addRow = () => setRows(prev => [
    ...prev,
    { id: String(Date.now()), description: '', ifrsBook: 0, taxBase: 0, type: 'DTL' },
  ]);

  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const update = (id: string, field: keyof TempDiff, val: string) =>
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (field === 'description') return { ...r, description: val };
      if (field === 'type') return { ...r, type: val as 'DTL' | 'DTA' };
      const num = parseFloat(val) || 0;
      const newRow = { ...r, [field]: num };
      // auto-derive type from difference
      const diff = newRow.ifrsBook - newRow.taxBase;
      newRow.type = diff > 0 ? 'DTL' : 'DTA';
      return newRow;
    }));

  const totalDTL = rows.filter(r => r.ifrsBook > r.taxBase)
    .reduce((s, r) => s + (r.ifrsBook - r.taxBase) * BIT, 0);
  const totalDTA = rows.filter(r => r.taxBase > r.ifrsBook)
    .reduce((s, r) => s + (r.taxBase - r.ifrsBook) * BIT, 0);
  const net = totalDTL - totalDTA;

  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
        IAS 12 — Temporary Difference Builder · BIT rate {(BIT * 100).toFixed(0)}%
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 mb-3">
        <table className="w-full text-xs">
          <thead className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {['Description', 'IFRS Book (ETB)', 'Tax Base (ETB)', 'Temp. Diff', 'Tax Effect (30%)', 'Type', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const diff = r.ifrsBook - r.taxBase;
              const taxEffect = Math.abs(diff) * BIT;
              const isDTL = diff > 0;
              return (
                <tr key={r.id} className={`border-b border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-800/20'}`}>
                  <td className="px-3 py-2">
                    <input value={r.description} onChange={e => update(r.id, 'description', e.target.value)}
                      placeholder="Asset / liability description"
                      className="w-44 bg-transparent border-b border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500 pb-0.5" />
                  </td>
                  {(['ifrsBook', 'taxBase'] as const).map(f => (
                    <td key={f} className="px-3 py-2">
                      <input type="number" value={r[f] || ''} onChange={e => update(r.id, f, e.target.value)}
                        className="w-28 bg-transparent border-b border-slate-200 dark:border-slate-700 text-xs text-right text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500 pb-0.5" />
                    </td>
                  ))}
                  <td className={`px-3 py-2 font-mono font-bold text-right text-xs ${diff > 0 ? 'text-rose-600 dark:text-rose-400' : diff < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {diff >= 0 ? '+' : ''}{diff.toLocaleString('en-ET')}
                  </td>
                  <td className="px-3 py-2 font-mono font-bold text-right text-xs text-violet-700 dark:text-violet-400">
                    {taxEffect.toLocaleString('en-ET', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      isDTL
                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                    }`}>
                      {isDTL ? 'DTL' : diff < 0 ? 'DTA' : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline mb-4">
        <Plus size={11} /> Add Line
      </button>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total DTL', value: totalDTL, cls: 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-800', valCls: 'text-rose-700 dark:text-rose-400' },
          { label: 'Total DTA', value: totalDTA, cls: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-800', valCls: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Net Balance', value: Math.abs(net), cls: 'border-violet-200 bg-violet-50/50 dark:bg-violet-950/10 dark:border-violet-800', valCls: 'text-violet-700 dark:text-violet-400' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-3 ${c.cls}`}>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{c.label}</p>
            <p className={`text-sm font-black font-mono ${c.valCls}`}>
              ETB {c.value.toLocaleString('en-ET', { maximumFractionDigits: 0 })}
            </p>
            {c.label === 'Net Balance' && (
              <p className="text-[9px] text-slate-400 mt-0.5">{net > 0 ? 'Net Liability' : net < 0 ? 'Net Asset' : 'Balanced'}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Disclosure Gap Tracker  (localStorage-persistent)
// ─────────────────────────────────────────────────────────────────────────────

const DISCLOSURE_ITEMS = [
  { id: 'd1',  area: 'IAS 1',   label: 'Basis of preparation note included' },
  { id: 'd2',  area: 'IAS 1',   label: 'Prior-year comparatives presented' },
  { id: 'd3',  area: 'IAS 2',   label: 'Inventory cost formula disclosed (FIFO/WAvg)' },
  { id: 'd4',  area: 'IAS 7',   label: 'Cash flow method stated (direct/indirect)' },
  { id: 'd5',  area: 'IAS 10',  label: 'Post-balance sheet events reviewed and disclosed' },
  { id: 'd6',  area: 'IAS 12',  label: 'Deferred tax schedule prepared and reconciled' },
  { id: 'd7',  area: 'IAS 12',  label: 'Tax rate reconciliation note included (30% BIT)' },
  { id: 'd8',  area: 'IAS 16',  label: 'PPE register with componentisation completed' },
  { id: 'd9',  area: 'IAS 16',  label: 'Deemed cost valuations (IFRS 1) documented' },
  { id: 'd10', area: 'IAS 19',  label: 'Pension contributions disclosed (7% + 11%)' },
  { id: 'd11', area: 'IAS 21',  label: 'FCY balances revalued at closing CBE rate' },
  { id: 'd12', area: 'IAS 21',  label: 'FX gains/losses shown separately in ovds costs' },
  { id: 'd13', area: 'IAS 24',  label: 'Related party transactions identified and disclosed' },
  { id: 'd14', area: 'IAS 36',  label: 'Impairment indicators reviewed at year-end' },
  { id: 'd15', area: 'IAS 37',  label: 'Provisions (VAT penalties, DRRF, warranties) recognised' },
  { id: 'd16', area: 'IFRS 9',  label: 'ECL provision matrix prepared for trade receivables' },
  { id: 'd17', area: 'IFRS 15', label: 'Contract liabilities recognised for advance receipts' },
  { id: 'd18', area: 'IFRS 15', label: 'Performance obligations identified in all contracts' },
  { id: 'd19', area: 'IFRS 16', label: 'ROU assets and lease liabilities recognised (>12 months)' },
  { id: 'd20', area: 'Comm.',   label: 'Legal reserve transfer (5% net profit) in equity statement' },
];

const STORAGE_KEY = 'ovds_ifrs_disclosure_tracker';

const DisclosureTracker: React.FC = () => {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(checked)));
  }, [checked]);

  const toggle = (id: string) => setChecked(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });

  const reset = () => setChecked(new Set());

  const pct = Math.round((checked.size / DISCLOSURE_ITEMS.length) * 100);
  const areas = Array.from(new Set(DISCLOSURE_ITEMS.map(i => i.area)));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {checked.size} / {DISCLOSURE_ITEMS.length} items complete
          </p>
          <p className="text-[10px] text-slate-400">Progress is saved automatically in your browser</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-black ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
            {pct}%
          </span>
          <button onClick={reset} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-500 transition-colors">
            <RefreshCw size={10} /> Reset
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Grouped by standard */}
      <div className="space-y-3">
        {areas.map(area => {
          const items = DISCLOSURE_ITEMS.filter(i => i.area === area);
          const doneCount = items.filter(i => checked.has(i.id)).length;
          return (
            <div key={area} className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <StdBadge code={area} color={doneCount === items.length ? 'emerald' : 'slate'} />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {doneCount}/{items.length}
                  </span>
                </div>
                <div className="w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(doneCount / items.length) * 100}%` }} />
                </div>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {items.map(item => (
                  <button key={item.id} onClick={() => toggle(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left group">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      checked.has(item.id)
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300 dark:border-slate-600 group-hover:border-emerald-400'
                    }`}>
                      {checked.has(item.id) && <CheckCircle size={10} className="text-white" />}
                    </div>
                    <span className={`text-[11px] transition-colors ${
                      checked.has(item.id)
                        ? 'line-through text-slate-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar TOC with scroll-spy
// ─────────────────────────────────────────────────────────────────────────────

const TOC_ITEMS = [
  { id: 's1',  num: '01', label: 'Executive Summary' },
  { id: 's2',  num: '02', label: 'FS Checklist' },
  { id: 's3',  num: '03', label: 'Focus Areas' },
  { id: 's4',  num: '04', label: 'Implementation' },
  { id: 's5',  num: '05', label: 'Note Disclosure' },
  { id: 's6',  num: '06', label: 'Industry Apps' },
  { id: 's7',  num: '07', label: 'Deficiencies' },
  { id: 's8',  num: '08', label: 'Framework' },
  { id: 's9',  num: '09', label: 'CFO Checklist' },
  { id: 's10', num: '10', label: 'Tax Divergence' },
  { id: 's11', num: '11', label: 'IFRS 15 Steps' },
  { id: 's12', num: '12', label: 'Gap Tracker' },
  { id: 's13', num: '13', label: 'Readiness Score' },
];

const SidebarTOC: React.FC<{
  active: string; openSections: Set<string>; toggle: (id: string) => void;
}> = ({ active, openSections, toggle }) => (
  <div className="w-44 shrink-0 hidden xl:block">
    <div className="sticky top-20 space-y-0.5">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Contents</p>
      {TOC_ITEMS.map(item => {
        const isActive = active === item.id;
        const isOpen = openSections.has(item.id);
        return (
          <button key={item.id}
            onClick={() => {
              if (!isOpen) toggle(item.id);
              setTimeout(() => {
                document.getElementById(`section-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
              isActive
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>
            <span className={`text-[8px] font-black w-5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`}>
              {item.num}
            </span>
            <span className="text-[10px] font-semibold truncate">{item.label}</span>
            {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-emerald-500 shrink-0" />}
          </button>
        );
      })}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const IFRSComplianceReport: React.FC = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['s1', 's2', 's3', 's4'])
  );
  const [activeSection, setActiveSection] = useState('s1');
  const [copied, setCopied] = useState(false);

  const toggle = useCallback((id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll   = () => setOpenSections(new Set(ALL_IDS));
  const collapseAll = () => setOpenSections(new Set());

  // Scroll-spy: watch which section header is nearest top of viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('section-', '');
            setActiveSection(id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    ALL_IDS.forEach(id => {
      const el = document.getElementById(`section-${id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const copyNote = () => {
    navigator.clipboard.writeText(BASIS_NOTE)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => {});
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { font-size: 11px; }
        }
      `}</style>

      <div className="flex gap-6">
        {/* Sidebar TOC */}
        <SidebarTOC active={activeSection} openSections={openSections} toggle={toggle} />

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4 pb-10">

          {/* ── Hero ───────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-violet-700 p-6 text-white shadow-lg no-print">
            <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-white/15 border border-white/25 px-2 py-0.5 rounded-full">
                      Federal Democratic Republic of Ethiopia
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-400/30 border border-emerald-300/40 px-2 py-0.5 rounded-full">
                      AABE Mandatory
                    </span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight mb-1">
                    IFRS Compliance Report
                  </h2>
                  <p className="text-sm text-white/75 leading-relaxed max-w-xl">
                    Regulator: Accounting and Audit Board of Ethiopia (AABE) ·
                    Framework: Full IFRS / IFRS for SMEs · Proclamation No. 847/2014
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button onClick={expandAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold border border-white/20 transition-all">
                    <ChevronDown size={11} /> Expand All
                  </button>
                  <button onClick={collapseAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold border border-white/20 transition-all">
                    <ChevronUp size={11} /> Collapse
                  </button>
                  <button onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold border border-white/20 transition-all">
                    <Printer size={11} /> Print
                  </button>
                </div>
              </div>
              {/* Tier pills */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/20">
                {TIER_PILLS.map(t => (
                  <div key={t.label} className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5">
                    <span className={`w-2 h-2 rounded-full ${t.dot} shrink-0`} />
                    <div>
                      <p className="text-[10px] font-bold leading-none">{t.label}</p>
                      <p className="text-[9px] text-white/60 mt-0.5">Since {t.since}</p>
                    </div>
                  </div>
                ))}
                <a href="https://aabe.gov.et" target="_blank" rel="noopener noreferrer"
                  className="ml-auto self-center flex items-center gap-1 text-[11px] font-bold text-white/70 hover:text-white transition-colors">
                  aabe.gov.et <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          {/* ── KPI strip ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
            {SCORE_CARDS.map(c => (
              <div key={c.label} className={`rounded-xl border p-4 flex items-center gap-3 ${c.bg}`}>
                <div className="shrink-0">{c.icon}</div>
                <div className="min-w-0">
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{c.label}</p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">{c.value}</p>
                  <p className="text-[9px] text-slate-400 truncate">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── §1 Executive Summary ───────────────────────────────────────── */}
          <Accordion id="s1" num="01" title="Executive Summary"
            subtitle="Transition from tax-driven cash accounting to global accrual-based fair value standards"
            icon={<FileText size={15} />} accentCls="border-emerald-300 dark:border-emerald-700"
            openSections={openSections} toggle={toggle}>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Following the mandate by the Accounting and Audit Board of Ethiopia (AABE), all public interest
              entities, financial institutions, and large/medium enterprises must report using IFRS. This
              transition shifts Ethiopian accounting from a traditional <strong>tax-driven, cash-influenced</strong>{' '}
              system to a global, accrual-based <strong>fair value</strong> standard.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              {[
                { label: 'Tier 1 — Full IFRS',     since: '7 Jul 2023', criteria: 'Turnover > ETB 300M · Assets > ETB 200M · 2 of 4 criteria', dot: 'bg-violet-500', cls: 'border-violet-200 bg-violet-50/60 dark:bg-violet-950/20 dark:border-violet-800' },
                { label: 'Tier 2 — IFRS for SMEs', since: '7 Jul 2024', criteria: 'Turnover > ETB 20M · Assets > ETB 20M · 2 of 4 criteria',  dot: 'bg-emerald-500', cls: 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800' },
                { label: 'Tier 3 — Micro-entity',  since: 'N/A',        criteria: 'Below Tier 2 on all 4 criteria — no IFRS obligation',       dot: 'bg-amber-400',  cls: 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800' },
              ].map(t => (
                <div key={t.label} className={`rounded-xl border p-3 ${t.cls}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{t.label}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Mandatory since <strong>{t.since}</strong></p>
                  <p className="text-[10px] text-slate-400 mt-0.5 italic">{t.criteria}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 flex items-start gap-2">
              <Info size={12} className="text-sky-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-sky-700 dark:text-sky-300 leading-relaxed">
                <strong>Always Tier 1 regardless of size:</strong> Banks, insurance companies, and all government-owned enterprises must apply Full IFRS from 7 July 2023.
              </p>
            </div>
          </Accordion>

          {/* ── §2 Financial Statement Checklist ───────────────────────────── */}
          <Accordion id="s2" num="02" title="Core IFRS Financial Statement Checklist"
            subtitle="Five mandatory components for AABE-compliant status — IAS 1 / IFRS 18 (2027)"
            icon={<ListChecks size={15} />} accentCls="border-emerald-300 dark:border-emerald-700"
            openSections={openSections} toggle={toggle}>
            <div className="space-y-2">
              {FS_CHECKLIST.map((item, i) => (
                <Link key={item.title} to={item.route}
                  className={`group flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${item.color}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 ${item.numCls}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-0.5">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </p>
                      <RefTag code={item.ref} />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                  <ArrowRight size={13} className="text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
                </Link>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
              <Info size={12} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                <strong>IFRS 18</strong> replaces IAS 1 effective <strong>1 January 2027</strong>.
                All five statements require prior-year comparatives presented in Ethiopian Birr (ETB).
              </p>
            </div>
          </Accordion>

          {/* ── §3 Critical Focus Areas ────────────────────────────────────── */}
          <Accordion id="s3" num="03" title="Critical Focus Areas for the Ethiopian Business Environment"
            subtitle="IAS 16 · IAS 21 · IAS 12 · IFRS 15 — Ethiopia-specific challenges with IAS 16 Calculator"
            icon={<AlertTriangle size={15} />} accentCls="border-amber-300 dark:border-amber-700"
            openSections={openSections} toggle={toggle}>
            <div className="space-y-3">
              {FOCUS_AREAS.map(fa => (
                <div key={fa.code} className={`rounded-xl border p-4 ${fa.cls}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <StdBadge code={fa.code} color={fa.badgeColor} />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{fa.title}</p>
                  </div>
                  {fa.rules.map(r => (
                    <RuleRow key={r.label} label={r.label} icon={r.icon}>{r.body}</RuleRow>
                  ))}
                  {fa.link && (
                    <Link to={fa.link.to} className={`mt-3 inline-flex items-center gap-1 text-[11px] font-bold ${fa.linkCls} hover:underline`}>
                      {fa.link.label} <ArrowRight size={10} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
            {/* IAS 16 Calculator */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <Calculator size={14} className="text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  IAS 16 Componentisation Calculator
                </p>
              </div>
              <ComponentisationCalc />
            </div>
          </Accordion>

          {/* ── §4 Implementation Workflow ─────────────────────────────────── */}
          <Accordion id="s4" num="04" title="Step-by-Step Implementation Workflow"
            subtitle="Four-phase transition roadmap to AABE statutory compliance"
            icon={<Activity size={15} />} accentCls="border-violet-300 dark:border-violet-700"
            openSections={openSections} toggle={toggle}>
            <div className="flex flex-col sm:flex-row items-stretch gap-0">
              {PHASES.map((p, i) => (
                <React.Fragment key={p.num}>
                  <div className={`flex-1 rounded-xl border p-4 ${p.cls}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl font-black text-slate-200 dark:text-slate-700 leading-none">{p.num}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{p.phase}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{p.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">{p.desc}</p>
                    {p.tasks.map(t => (
                      <div key={t} className="flex items-start gap-1.5 mt-1">
                        <CheckCircle size={10} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{t}</span>
                      </div>
                    ))}
                  </div>
                  {i < PHASES.length - 1 && (
                    <div className="hidden sm:flex items-center justify-center w-5 shrink-0">
                      <ArrowRight size={14} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2">
              <ShieldCheck size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                <strong>Phase 4 requirement:</strong> The external auditor must hold an active AABE practice licence.
                Verify licence numbers at{' '}
                <a href="https://aabe.gov.et" target="_blank" rel="noopener noreferrer" className="underline font-bold">aabe.gov.et</a>.
              </p>
            </div>
          </Accordion>

          {/* ── §5 Note Disclosure Model ───────────────────────────────────── */}
          <Accordion id="s5" num="05" title="Standard IFRS Note Disclosure Model"
            subtitle="Basis of preparation — paste directly into your Notes to Financial Statements"
            icon={<FileText size={15} />} accentCls="border-sky-300 dark:border-sky-700"
            openSections={openSections} toggle={toggle}>
            <div className="relative rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 mb-3">
              <button onClick={copyNote}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-500 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-sm">
                <Copy size={10} />{copied ? '✓ Copied!' : 'Copy'}
              </button>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 leading-loose pr-20 italic whitespace-pre-line">
                {BASIS_NOTE}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {NOTE_POLICIES.map(n => (
                <div key={n.title} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <RefTag code={n.ref} />
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{n.title}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{n.body}</p>
                </div>
              ))}
            </div>
          </Accordion>

          {/* ── §6 Industry Applications ───────────────────────────────────── */}
          <Accordion id="s6" num="06" title="Industry-Specific IFRS Application in Ethiopia"
            subtitle="Financial sector · Manufacturing (IAS 2) · Real estate & construction (IFRS 15)"
            icon={<Building2 size={15} />} accentCls="border-sky-300 dark:border-sky-700"
            openSections={openSections} toggle={toggle}>
            <div className="space-y-3">
              {INDUSTRIES.map(ind => (
                <div key={ind.sector} className={`rounded-xl border p-4 ${ind.cls}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ind.iconCls}`}>{ind.icon}</div>
                    <p className={`text-xs font-bold ${ind.titleCls}`}>{ind.sector}</p>
                  </div>
                  {ind.items.map(item => (
                    <div key={item.std} className="flex items-start gap-2 mb-2 last:mb-0">
                      <StdBadge code={item.std} color={ind.badgeColor} />
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed flex-1"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.body) }} />
                    </div>
                  ))}
                  {ind.link && (
                    <Link to={ind.link.to} className={`mt-2 inline-flex items-center gap-1 text-[11px] font-bold ${ind.linkCls} hover:underline`}>
                      {ind.link.label} <ArrowRight size={10} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </Accordion>

          {/* ── §7 Disclosure Deficiencies ─────────────────────────────────── */}
          <Accordion id="s7" num="07" title="Common Disclosure & Reconciliation Deficiencies"
            subtitle="Frequent gaps found in AABE-reviewed Ethiopian financial statements"
            icon={<AlertTriangle size={15} />} accentCls="border-rose-300 dark:border-rose-700"
            openSections={openSections} toggle={toggle}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEFICIENCIES.map(d => (
                <div key={d.title} className={`rounded-xl border p-4 ${d.cls}`}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <d.Icon size={13} className={d.iconCls} />
                    <p className={`text-xs font-bold ${d.titleCls}`}>{d.title}</p>
                    <RefTag code={d.ref} />
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {d.points.map((pt, i) => (
                      <p key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(pt) }} />
                    ))}
                  </div>
                  {d.link && (
                    <Link to={d.link.to} className={`mt-2 inline-flex items-center gap-1 text-[11px] font-bold ${d.linkCls} hover:underline`}>
                      {d.link.label} <ArrowRight size={10} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </Accordion>

          {/* ── §8 Structural Framework ────────────────────────────────────── */}
          <Accordion id="s8" num="08" title="Structural Financial Statement Presentation Framework"
            subtitle="Asset · Liability/Equity · P&L — line items with IAS references and statement linkage"
            icon={<Layers size={15} />} accentCls="border-violet-300 dark:border-violet-700"
            openSections={openSections} toggle={toggle}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {COLUMNS.map(col => (
                <div key={col.label} className={`rounded-xl border p-4 ${col.cls}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${col.titleCls}`}>{col.label}</p>
                  <div className="space-y-2">
                    {col.items.map(item => (
                      <div key={item.name} className="flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${col.dot}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{item.name}</span>
                            {item.ref && <RefTag code={item.ref} />}
                          </div>
                          {item.note && <p className="text-[9px] text-slate-400">{item.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Statement Linkage Flow</p>
              <div className="flex flex-col sm:flex-row items-center gap-1.5 text-center">
                {['P&L → Retained Earnings', 'Retained Earnings → Equity', 'Equity → Balance Sheet', 'Balance Sheet ↔ Cash Flow'].map((step, i) => (
                  <React.Fragment key={step}>
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                      {step}
                    </div>
                    {i < 3 && <ArrowRight size={11} className="text-slate-300 shrink-0 hidden sm:block" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </Accordion>

          {/* ── §9 CFO Checklist ───────────────────────────────────────────── */}
          <Accordion id="s9" num="09" title="Actionable Compliance Checklist for CFOs"
            subtitle="Five priority actions for audit readiness — verify · upgrade · document · compute · review"
            icon={<ShieldCheck size={15} />} accentCls="border-emerald-300 dark:border-emerald-700"
            openSections={openSections} toggle={toggle}>
            <div className="space-y-3">
              {CFO_CHECKLIST.map(item => (
                <div key={item.num} className={`flex items-start gap-4 p-4 rounded-xl border ${item.cls}`}>
                  <div className={`w-8 h-8 rounded-full ${item.numCls} text-white text-sm font-black flex items-center justify-center shrink-0 shadow-sm`}>
                    {item.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5">{item.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">{item.desc}</p>
                    <div className="flex flex-wrap gap-3">
                      {item.links.map(l => l.external ? (
                        <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                          {l.label} <ExternalLink size={9} />
                        </a>
                      ) : (
                        <Link key={l.label} to={l.url}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                          {l.label} <ArrowRight size={9} />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Accordion>

          {/* ── §10 Tax Divergence Table ───────────────────────────────────── */}
          <Accordion id="s10" num="10" title="IFRS vs Ethiopian Tax Law — Divergence Table"
            subtitle="Temporary differences driving deferred tax · IAS 12 · Proclamation 979/2016 · with DT Builder"
            icon={<Scale size={15} />} accentCls="border-rose-300 dark:border-rose-700"
            openSections={openSections} toggle={toggle}>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {['Area', 'IFRS Treatment', 'Ethiopian Tax Law (Proc. 979/2016)', 'Type'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TAX_DIVERGENCE.map((row, i) => (
                    <tr key={row.area} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-slate-800/20'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StdBadge code={row.std} color={row.color} />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{row.area}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-600 dark:text-slate-400 max-w-[200px]">{row.ifrs}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-600 dark:text-slate-400 max-w-[200px]">{row.eth}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          row.dtl === 'DTL' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'
                          : row.dtl === 'DTA' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>{row.dtl}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 mb-4">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> DTL — Deferred Tax Liability (IFRS book &gt; tax base)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> DTA — Deferred Tax Asset (IFRS book &lt; tax base)</span>
              <span className="ml-auto text-slate-400">BIT: 30% flat · Proclamation No. 979/2016</span>
            </div>
            {/* Deferred Tax Builder */}
            <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator size={14} className="text-violet-600 dark:text-violet-400" />
                <p className="text-xs font-bold text-violet-700 dark:text-violet-300">
                  Interactive Deferred Tax Builder
                </p>
              </div>
              <DeferredTaxBuilder />
            </div>
          </Accordion>

          {/* ── §11 IFRS 15 Five-Step Model ────────────────────────────────── */}
          <Accordion id="s11" num="11" title="IFRS 15 — Five-Step Revenue Recognition Model"
            subtitle="Critical for Ethiopian real estate, construction, and commodity trading sectors"
            icon={<TrendingUp size={15} />} accentCls="border-sky-300 dark:border-sky-700"
            openSections={openSections} toggle={toggle}>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-0 mb-4">
              {IFRS15_STEPS.map((s, i) => (
                <React.Fragment key={s.step}>
                  <div className={`flex-1 rounded-xl border p-3 ${s.cls}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full ${s.dotCls} text-white text-[10px] font-black flex items-center justify-center shrink-0`}>{s.step}</span>
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">{s.label}</p>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-200 font-semibold mb-1 leading-tight">{s.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">{s.desc}</p>
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold italic leading-relaxed">{s.eth}</p>
                  </div>
                  {i < IFRS15_STEPS.length - 1 && (
                    <div className="hidden sm:flex items-center justify-center w-4 shrink-0">
                      <ArrowRight size={12} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 flex items-start gap-2">
              <Info size={12} className="text-sky-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-sky-700 dark:text-sky-300 leading-relaxed">
                <strong>Cash ≠ Revenue.</strong> All cash received before Step 5 is a <strong>Contract Liability</strong>
                on the balance sheet. Revenue is only recognised when performance obligations are satisfied —
                not when the buyer pays.
              </p>
            </div>
          </Accordion>

          {/* ── §12 Disclosure Gap Tracker ─────────────────────────────────── */}
          <Accordion id="s12" num="12" title="Disclosure Gap Tracker"
            subtitle="20-item checklist grouped by IAS/IFRS standard — progress saved to browser storage"
            icon={<ClipboardCheck size={15} />} accentCls="border-emerald-300 dark:border-emerald-700"
            openSections={openSections} toggle={toggle}>
            <DisclosureTracker />
          </Accordion>

          {/* ── §13 Readiness Score ────────────────────────────────────────── */}
          <Accordion id="s13" num="13" title="Compliance Readiness Score"
            subtitle="Self-assessment matrix — gap analysis across IFRS focus areas"
            icon={<Award size={15} />} accentCls="border-violet-300 dark:border-violet-700"
            openSections={openSections} toggle={toggle}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-5 py-3">
              {READINESS_SCORES.map(r => <ScoreRing key={r.label} score={r.score} label={r.label} color={r.color} />)}
            </div>
            <div className="space-y-2">
              {READINESS_ITEMS.map(item => (
                <div key={item.area} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 w-36 shrink-0 truncate">{item.area}</p>
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${item.barCls}`}
                      style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 w-8 text-right shrink-0">{item.pct}%</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${item.statusCls}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </Accordion>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Regulatory References</p>
                <div className="flex flex-wrap gap-3">
                  {REFS.map(r => (
                    <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                      {r.label} <ExternalLink size={9} />
                    </a>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  Proc. 847/2014 · Reg. 332/2014 · Commercial Code 2021<br />
                  Income Tax Proc. 979/2016 · VAT Proc. 1341/2024<br />
                  Pension Proc. 714/2011 · NBE FIS/01/2012
                </p>
              </div>
            </div>
          </div>

        </div>{/* /main content */}
      </div>{/* /flex wrapper */}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Data constants
// ─────────────────────────────────────────────────────────────────────────────

const ALL_IDS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','s13'];

const BASIS_NOTE =
  '"The financial statements have been prepared in accordance with International Financial\n' +
  'Reporting Standards (IFRS) as issued by the IASB and approved by the AABE. The\n' +
  'financial statements are presented in Ethiopian Birr (ETB). Management applies critical\n' +
  'judgments in establishing asset useful lives, calculating deferred tax balances, and\n' +
  'assessing the impairment of trade receivables under the expected credit loss (ECL) model."';

const TIER_PILLS = [
  { label: 'Tier 1 — Full IFRS',     since: '7 Jul 2023', dot: 'bg-violet-400' },
  { label: 'Tier 2 — IFRS for SMEs', since: '7 Jul 2024', dot: 'bg-emerald-400' },
  { label: 'Tier 3 — Micro-entity',  since: 'N/A',        dot: 'bg-amber-400'  },
];

const SCORE_CARDS = [
  { label: 'AABE Mandate',  value: 'Tier 1',  sub: 'Since 7 Jul 2023',     bg: 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800',   icon: <Award size={20} className="text-violet-500" /> },
  { label: 'Key Standards', value: '11+',      sub: 'IAS + IFRS in scope',  bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800', icon: <BookOpen size={20} className="text-emerald-500" /> },
  { label: 'BIT Rate',      value: '30%',      sub: 'Flat · Proc. 979/2016',bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',        icon: <Banknote size={20} className="text-amber-500" /> },
  { label: 'Legal Reserve', value: '5%→10%',   sub: 'Commercial Code 2021', bg: 'bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800',                icon: <Scale size={20} className="text-sky-500" /> },
];

const FS_CHECKLIST = [
  { title: 'Statement of Financial Position',      ref: 'IAS 1.54–76', route: '/reports?type=bs',    desc: 'Assets, liabilities, and equity — current/non-current split. Minimum line items per IAS 1.54.', color: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-800', numCls: 'bg-emerald-500' },
  { title: 'Statement of Profit or Loss & OCI',   ref: 'IAS 1.81A',   route: '/reports?type=pl',    desc: 'Performance statement. OCI isolates items not reclassified to P&L — e.g. PPE revaluation surpluses, actuarial remeasurements.', color: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-800', numCls: 'bg-emerald-600' },
  { title: 'Statement of Changes in Equity',      ref: 'IAS 1.106',   route: '/reports?type=equity', desc: 'Movements in share capital, legal reserves (5% of net profit until 10% of capital — Comm. Code 2021), and retained earnings.', color: 'border-violet-200 bg-violet-50/50 dark:bg-violet-950/10 dark:border-violet-800', numCls: 'bg-violet-500' },
  { title: 'Statement of Cash Flows',             ref: 'IAS 7',       route: '/reports?type=cf',     desc: 'Operating, investing, and financing activities. Indirect method (IAS 7.18) most common; direct method (IAS 7.19) encouraged by IASB.', color: 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800', numCls: 'bg-amber-500' },
  { title: 'Notes to the Financial Statements',   ref: 'IAS 1.112',   route: '/reports?type=notes',  desc: 'Accounting policies, judgments, estimates, and detailed schedules. Must cross-reference all statement line items.', color: 'border-slate-200 bg-slate-50/50 dark:bg-slate-800/20 dark:border-slate-700', numCls: 'bg-slate-500' },
];

const FOCUS_AREAS = [
  {
    code: 'IAS 16', title: 'Property, Plant & Equipment — Deemed Cost', badgeColor: 'emerald',
    cls: 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/10 dark:border-emerald-800',
    linkCls: 'text-emerald-600 dark:text-emerald-400',
    link: { label: 'Fixed Assets Register', to: '/accounting/fixed-assets' },
    rules: [
      { label: 'Historical Records Gap',      icon: <AlertTriangle size={11} className="text-amber-500" />, body: 'Many Ethiopian businesses lack historical cost registries for old assets, making transition-date measurement difficult.' },
      { label: 'IFRS 1 Deemed Cost Solution', icon: <CheckCircle size={11} className="text-emerald-500" />, body: 'Companies can use a professional, certified valuation to establish "deemed cost" on the IFRS transition date — replacing missing historical cost.' },
      { label: 'Componentisation Required',   icon: <Layers size={11} className="text-violet-500" />,       body: 'Major assets must be broken into parts and depreciated over their unique useful lifespans (IAS 16.43–47). See calculator below.' },
    ],
  },
  {
    code: 'IAS 21', title: 'Foreign Exchange & Currency Volatility', badgeColor: 'amber',
    cls: 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/10 dark:border-amber-800',
    linkCls: 'text-amber-600 dark:text-amber-400', link: null,
    rules: [
      { label: 'Post-Floatation Risk',      icon: <AlertTriangle size={11} className="text-rose-500" />, body: 'Following the NBE currency floatation reform, ETB/USD volatility has sharply increased. All importing entities face significant translation risk.' },
      { label: 'Monetary Item Revaluation', icon: <Banknote size={11} className="text-amber-500" />,     body: 'FCY bank accounts, import LCs, and foreign trade payables must be revalued at the official CBE closing rate on the balance sheet date.' },
      { label: 'P&L Presentation',          icon: <TrendingUp size={11} className="text-emerald-500" />, body: 'Realised and unrealised FX gains/losses must be disclosed separately under ovds Costs — not netted against revenue.' },
    ],
  },
  {
    code: 'IAS 12', title: 'Income Taxes & Deferred Tax', badgeColor: 'violet',
    cls: 'border-violet-200 bg-violet-50/40 dark:bg-violet-950/10 dark:border-violet-800',
    linkCls: 'text-violet-600 dark:text-violet-400',
    link: { label: 'Deferred Tax Calculator', to: '/ifrs/deferred-tax' },
    rules: [
      { label: 'Compliance Gap',          icon: <AlertTriangle size={11} className="text-rose-500" />,   body: 'Proclamation No. 979/2016 diverges from IFRS on: asset depreciation rates (pool vs SL), bad debt provisions, entertainment caps, and penalties.' },
      { label: 'Deferred Tax Balance',    icon: <Scale size={11} className="text-violet-500" />,         body: 'A DTL or DTA is recognised on all temporary differences between IFRS carrying amount and tax base, measured at the 30% BIT rate.' },
      { label: 'Tax Reconciliation Note', icon: <FileText size={11} className="text-slate-500" />,       body: 'A reconciliation between accounting profit × 30% and actual tax charge must appear in the Notes, explaining the effective tax rate.' },
    ],
  },
  {
    code: 'IFRS 15', title: 'Revenue from Contracts with Customers', badgeColor: 'sky',
    cls: 'border-sky-200 bg-sky-50/40 dark:bg-sky-950/10 dark:border-sky-800',
    linkCls: 'text-sky-600 dark:text-sky-400', link: null,
    rules: [
      { label: 'Large Advance Payments', icon: <Banknote size={11} className="text-sky-500" />,       body: 'Ethiopian businesses frequently receive large upfront cash in real estate, construction, and commodity trading.' },
      { label: 'Revenue ≠ Cash',         icon: <AlertTriangle size={11} className="text-amber-500" />, body: 'Receipt of cash does NOT equal revenue recognition under IFRS 15. Revenue is recognised only when performance obligations are satisfied.' },
      { label: 'Contract Liability',     icon: <CheckCircle size={11} className="text-emerald-500" />, body: 'All cash received before performance obligations are met must be recorded as a Contract Liability on the balance sheet.' },
    ],
  },
];

const PHASES = [
  { num: '01', phase: 'Phase 1', title: 'Diagnostic Assessment',    cls: 'border-violet-200 bg-violet-50/50 dark:bg-violet-950/10 dark:border-violet-800', desc: 'Map all policy gaps between current tax-basis accounting and IFRS.',          tasks: ['Identify temporary differences for IAS 12', 'Review asset registry completeness', 'Assess revenue recognition policies'] },
  { num: '02', phase: 'Phase 2', title: 'Data & Ledger Cleansing',  cls: 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800',   desc: 'Fix asset registries, inventory records, and historical ledger backlogs.',  tasks: ['Physical asset inventory + componentisation', 'Deemed cost valuations (IFRS 1)', 'Establish Opening Balance Sheet'] },
  { num: '03', phase: 'Phase 3', title: 'Parallel Ledger Reporting', cls: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-800', desc: 'Run tax books alongside IFRS ledger simultaneously for the transition year.', tasks: ['Configure dual-book accounting system', 'Reconcile tax vs IFRS profit monthly', 'Prepare first IFRS trial balance'] },
  { num: '04', phase: 'Phase 4', title: 'AABE Statutory Audit',     cls: 'border-sky-200 bg-sky-50/50 dark:bg-sky-950/10 dark:border-sky-800',             desc: 'Appoint AABE-licenced external auditor to review and sign final statements.', tasks: ['Verify auditor AABE licence at aabe.gov.et', 'Submit complete 5-statement set', 'File within statutory deadline'] },
];

const NOTE_POLICIES = [
  { ref: 'IAS 2',   title: 'Inventories',       body: 'Lower of cost and NRV. FIFO or weighted average only — LIFO is prohibited under IFRS.' },
  { ref: 'IAS 16',  title: 'PP&E',              body: 'Cost model less accumulated depreciation. Revaluation model permitted where fair value measurable.' },
  { ref: 'IFRS 9',  title: 'Trade Receivables', body: 'Simplified ECL approach — lifetime expected losses recognised from initial recognition.' },
  { ref: 'IFRS 15', title: 'Revenue',           body: 'Recognised when (or as) performance obligations satisfied per the five-step model.' },
  { ref: 'IAS 12',  title: 'Deferred Tax',      body: 'Recognised on all temporary differences between IFRS carrying amount and tax base at 30% BIT.' },
  { ref: 'IAS 19',  title: 'Employee Benefits', body: 'Pension contributions: 7% employee + 11% employer, capped at ETB 15,000 insurable salary.' },
];

const INDUSTRIES = [
  {
    sector: 'Financial Sector — Banks & Insurance', badgeColor: 'sky',
    icon: <Landmark size={14} />, iconCls: 'bg-sky-100 dark:bg-sky-950/30 text-sky-600',
    titleCls: 'text-sky-700 dark:text-sky-300',
    cls: 'border-sky-200 bg-sky-50/40 dark:bg-sky-950/10 dark:border-sky-800',
    linkCls: 'text-sky-600 dark:text-sky-400',
    link: { label: 'ECL Provision Module', to: '/ifrs/ecl-provision' },
    items: [
      { std: 'IFRS 9',  body: 'Must move away from NBE directive provisioning (1% for pass loans) to the <strong>Expected Credit Loss (ECL) model</strong>, incorporating forward-looking indicators: inflation, GDP growth, NPL trends.' },
      { std: 'IFRS 17', body: 'Insurance companies must shift from the premium-clearing model to the <strong>General Measurement Model (GMM) or Premium Allocation Approach (PAA)</strong> — discounting future cash flows and isolating a Risk Adjustment factor.' },
    ],
  },
  {
    sector: 'Manufacturing & Sector-Specific Inventory', badgeColor: 'amber',
    icon: <Factory size={14} />, iconCls: 'bg-orange-100 dark:bg-orange-950/30 text-orange-600',
    titleCls: 'text-orange-700 dark:text-orange-300',
    cls: 'border-orange-200 bg-orange-50/40 dark:bg-orange-950/10 dark:border-orange-800',
    linkCls: 'text-orange-600 dark:text-orange-400', link: null,
    items: [
      { std: 'IAS 2', body: '<strong>Import Cost Capitalisation:</strong> All costs to bring raw materials to factory site must be capitalised — sea freight, ESLSE dry port charges, customs duties, local transport.' },
      { std: 'IAS 2', body: '<strong>Capacity Underutilisation:</strong> Fixed overheads allocated on <strong>normal production capacity</strong>. Unallocated overhead from operating below normal must be expensed to P&L — never capitalised into inventory.' },
    ],
  },
  {
    sector: 'Real Estate & Construction', badgeColor: 'emerald',
    icon: <Home size={14} />, iconCls: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600',
    titleCls: 'text-emerald-700 dark:text-emerald-300',
    cls: 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/10 dark:border-emerald-800',
    linkCls: 'text-emerald-600 dark:text-emerald-400', link: null,
    items: [
      { std: 'IFRS 15', body: '<strong>Advance Receipts:</strong> Addis Ababa developers frequently collect 20%–100% of purchase price before construction begins. Cash collected ≠ revenue.' },
      { std: 'IFRS 15', body: '<strong>Contract Liability:</strong> If the contract doesn\'t meet IFRS 15 over-time recognition thresholds, all collected cash sits as a <strong>Contract Liability</strong> until legal title is transferred to the buyer.' },
    ],
  },
];

const DEFICIENCIES = [
  { title: 'Legal Reserve Requirement', ref: 'Comm. Code 2021', Icon: Scale,   iconCls: 'text-amber-500', titleCls: 'text-amber-700 dark:text-amber-300', cls: 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/10 dark:border-amber-800', linkCls: 'text-amber-600 dark:text-amber-400', link: { label: 'Changes in Equity', to: '/reports?type=equity' }, points: ['Under the <strong>2021 Commercial Code</strong>, 5% of annual net profit must be transferred to a Legal Reserve until it reaches 10% of total share capital.', 'IFRS treatment: direct appropriation of equity — must appear in the Statement of Changes in Equity ONLY.', 'Common error: presenting the transfer as an expense line inside the P&L.'] },
  { title: 'Post-Balance Sheet Events', ref: 'IAS 10',          Icon: Clock,   iconCls: 'text-rose-500',  titleCls: 'text-rose-700 dark:text-rose-300',   cls: 'border-rose-200 bg-rose-50/40 dark:bg-rose-950/10 dark:border-rose-800',   linkCls: 'text-rose-600 dark:text-rose-400',   link: null,                                                         points: ['Rapid NBE exchange rate movements after year-end are non-adjusting events under IAS 10.', '<strong>Disclosure required:</strong> state the nature of currency movement and estimate the financial impact in the Notes if material to users.', 'Failure to disclose is a deficiency flagged in AABE audits.'] },
  { title: 'Deferred Tax Not Recognised', ref: 'IAS 12',        Icon: AlertTriangle, iconCls: 'text-violet-500', titleCls: 'text-violet-700 dark:text-violet-300', cls: 'border-violet-200 bg-violet-50/40 dark:bg-violet-950/10 dark:border-violet-800', linkCls: 'text-violet-600 dark:text-violet-400', link: { label: 'Deferred Tax Module', to: '/ifrs/deferred-tax' }, points: ['Many entities omit deferred tax entirely — prior tax-basis books had no concept of temporary differences.', 'DTL sources: accelerated tax depreciation vs IAS 16 SL, capitalised borrowing costs (IAS 23).', 'DTA sources: tax-disallowed bad debt provisions, IFRS 9 ECL impairment exceeding the tax threshold.'] },
  { title: 'Revenue at Cash Receipt', ref: 'IFRS 15',           Icon: TrendingUp, iconCls: 'text-sky-500', titleCls: 'text-sky-700 dark:text-sky-300',   cls: 'border-sky-200 bg-sky-50/40 dark:bg-sky-950/10 dark:border-sky-800',     linkCls: 'text-sky-600 dark:text-sky-400',     link: null,                                                         points: ['Most widespread deficiency — revenue recognised when cash is received rather than when performance obligations are satisfied.', 'Real estate developers must hold advance payments as <strong>Contract Liabilities</strong> until unit handover.', 'Construction companies using % completion must meet IFRS 15.35 over-time thresholds, not just cost-incurred ratios.'] },
];

const COLUMNS = [
  { label: 'Asset Section',     titleCls: 'text-emerald-700 dark:text-emerald-300', cls: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-800', dot: 'bg-emerald-500', items: [{ name: 'PPE', ref: 'IAS 16', note: 'Cost or revaluation; component basis' }, { name: 'Inventory', ref: 'IAS 2', note: 'Lower of cost and NRV' }, { name: 'Trade Receivables', ref: 'IFRS 9', note: 'Net of ECL provision' }, { name: 'Prepayments', ref: 'IAS 1', note: 'Current asset' }, { name: 'Cash & Equivalents', ref: 'IAS 7', note: 'CBE closing rate for FCY' }, { name: 'ROU Assets', ref: 'IFRS 16', note: 'Leases > 12 months' }] },
  { label: 'Liability / Equity', titleCls: 'text-violet-700 dark:text-violet-300', cls: 'border-violet-200 bg-violet-50/50 dark:bg-violet-950/10 dark:border-violet-800', dot: 'bg-violet-500', items: [{ name: 'Share Capital', ref: 'IAS 1', note: '' }, { name: 'Legal Reserve', ref: 'Comm. Code', note: '5% net profit → 10% cap' }, { name: 'Retained Earnings', ref: 'IAS 1', note: 'After legal reserve transfer' }, { name: 'Deferred Tax Liability', ref: 'IAS 12', note: '30% BIT rate' }, { name: 'Contract Liabilities', ref: 'IFRS 15', note: 'Advance payments received' }, { name: 'Lease Liability', ref: 'IFRS 16', note: 'PV of future lease payments' }] },
  { label: 'Profit or Loss',     titleCls: 'text-sky-700 dark:text-sky-300',       cls: 'border-sky-200 bg-sky-50/50 dark:bg-sky-950/10 dark:border-sky-800',             dot: 'bg-sky-500',     items: [{ name: 'Revenue', ref: 'IFRS 15', note: 'Performance obligation met' }, { name: 'FX Gains / Losses', ref: 'IAS 21', note: 'Realised + unrealised' }, { name: 'ECL Impairment', ref: 'IFRS 9', note: 'Expected credit losses' }, { name: 'Depreciation', ref: 'IAS 16', note: 'Component basis' }, { name: 'Admin & Operating', ref: 'IAS 1', note: 'By nature or function' }, { name: 'Income Tax Expense', ref: 'IAS 12', note: 'Current + deferred' }] },
];

const CFO_CHECKLIST = [
  { num: '1', title: 'Verify Auditor Credentials',                cls: 'border-violet-200 bg-violet-50/40 dark:bg-violet-950/10 dark:border-violet-800', numCls: 'bg-violet-500', desc: 'Confirm the external auditor\'s licence number on the AABE portal before signing the engagement letter. Unlicensed auditors cannot certify AABE-compliant statements.', links: [{ label: 'AABE Registry', url: 'https://aabe.gov.et', external: true }, { label: 'Audit Outsourcing', url: '/compliance/audit-outsourcing', external: false }] },
  { num: '2', title: 'Update IT Accounting Infrastructure',       cls: 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/10 dark:border-emerald-800', numCls: 'bg-emerald-500', desc: 'Ensure your ERP supports parallel ledgers — one for tax reporting (Proc. 979/2016) and one for IFRS entries. Single-book systems cannot produce compliant statements.', links: [{ label: 'IFRS Settings', url: '/settings?tab=ifrs-standards', external: false }, { label: 'Chart of Accounts', url: '/accounting/chart-of-accounts', external: false }] },
  { num: '3', title: 'Build the Fair Value Documentation Trail', cls: 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/10 dark:border-amber-800', numCls: 'bg-amber-500', desc: 'Retain all independent valuation reports for land, buildings, and investment properties. Document FX revaluation workings at each balance sheet date. Auditors require a complete evidence trail.', links: [{ label: 'Fixed Assets', url: '/accounting/fixed-assets', external: false }, { label: 'Audit Logs', url: '/settings/audit-logs', external: false }] },
  { num: '4', title: 'Run the Deferred Tax Computation',          cls: 'border-sky-200 bg-sky-50/40 dark:bg-sky-950/10 dark:border-sky-800', numCls: 'bg-sky-500', desc: 'Before year-end, reconcile IFRS carrying values vs tax bases for all assets and liabilities. A deferred tax schedule is mandatory for Tier 1 and Tier 2 entities.', links: [{ label: 'Deferred Tax', url: '/ifrs/deferred-tax', external: false }, { label: 'Tax Dashboard', url: '/tax/dashboard', external: false }] },
  { num: '5', title: 'Review Revenue Contracts for IFRS 15',     cls: 'border-rose-200 bg-rose-50/40 dark:bg-rose-950/10 dark:border-rose-800', numCls: 'bg-rose-500', desc: 'Review all advance-payment contracts. Identify which performance obligations are over-time vs point-in-time. Reclassify advance receipts to Contract Liabilities where required.', links: [{ label: 'Revenue Module', url: '/sales/invoices', external: false }, { label: 'Financial Statements', url: '/reports/financial-statements', external: false }] },
];

const TAX_DIVERGENCE = [
  { area: 'Asset Depreciation',      std: 'IAS 16',  color: 'emerald', ifrs: 'Straight-line over useful life; component-by-component',   eth: 'Pool rates Art. 25: Buildings 5%, Machinery 20%, Vehicles 25%', dtl: 'DTL' },
  { area: 'Bad Debt Provision',      std: 'IFRS 9',  color: 'sky',     ifrs: 'ECL model — lifetime losses from day 1 of recognition',     eth: 'Only specific provisions allowed when debt is actually written off', dtl: 'DTA' },
  { area: 'Entertainment Expenses',  std: 'IAS 1',   color: 'slate',   ifrs: 'Deductible if incurred for genuine business purpose',        eth: 'Capped at 1% of net business income; excess disallowed',       dtl: 'DTA' },
  { area: 'Borrowing Costs',         std: 'IAS 23',  color: 'violet',  ifrs: 'Capitalised for qualifying assets under construction',       eth: 'Interest expense fully deductible when paid',                  dtl: 'DTL' },
  { area: 'ovds Lease (ROU)',     std: 'IFRS 16', color: 'amber',   ifrs: 'ROU asset + lease liability on balance sheet',               eth: 'Lease payments fully deductible as rent expense',              dtl: 'DTL' },
  { area: 'Inventory Write-down',    std: 'IAS 2',   color: 'orange',  ifrs: 'Written down to NRV when NRV < cost',                        eth: 'Write-downs only on disposal — no NRV adjustments allowed',    dtl: 'DTA' },
  { area: 'Revaluation Surplus',     std: 'IAS 16',  color: 'purple',  ifrs: 'OCI item; deferred until asset is sold',                     eth: 'Gain on disposal taxed at 30%; no interim deferred tax',       dtl: 'DTL' },
  { area: 'Pension (Defined Benefit)',std: 'IAS 19', color: 'rose',    ifrs: 'Actuarial valuation: service cost + interest cost',          eth: 'Defined contribution only: 7% + 11% on capped salary',         dtl: 'Varies' },
];

const IFRS15_STEPS = [
  { step: 1, label: 'Identify Contract',       dotCls: 'bg-violet-500', cls: 'border-violet-200 bg-violet-50/50 dark:bg-violet-950/10 dark:border-violet-800', title: 'Identify the Contract',               desc: 'Contract approved, commercial substance, payment terms identified.', eth: 'Oral contracts common — written form needed for IFRS 15 recognition.' },
  { step: 2, label: 'Identify Obligations',    dotCls: 'bg-emerald-500',cls: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-800', title: 'Identify Performance Obligations', desc: 'Each distinct good or service promised in the contract.',             eth: 'Real estate: land, construction, and finishing are often separate obligations.' },
  { step: 3, label: 'Determine Price',         dotCls: 'bg-amber-500',  cls: 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800', title: 'Determine Transaction Price',         desc: 'Variable consideration, financing components, non-cash consideration.', eth: 'Long-term advance payments may contain a significant financing component.' },
  { step: 4, label: 'Allocate Price',          dotCls: 'bg-sky-500',    cls: 'border-sky-200 bg-sky-50/50 dark:bg-sky-950/10 dark:border-sky-800', title: 'Allocate to Obligations',             desc: 'Allocate based on standalone selling price of each obligation.',      eth: 'Bundled construction + maintenance must be split at relative standalone prices.' },
  { step: 5, label: 'Recognise Revenue',       dotCls: 'bg-rose-500',   cls: 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-800', title: 'Recognise Revenue',                   desc: 'Recognise when (or as) each obligation is satisfied — over time or at a point in time.', eth: 'Cash before Step 5 = Contract Liability. Revenue ≠ Cash received.' },
];

const READINESS_SCORES = [
  { label: 'Financial Statements', score: 78, color: '#10b981' },
  { label: 'Deferred Tax',         score: 52, color: '#8b5cf6' },
  { label: 'Revenue (IFRS 15)',     score: 61, color: '#0ea5e9' },
  { label: 'ECL / IFRS 9',         score: 44, color: '#f59e0b' },
];

const READINESS_ITEMS = [
  { area: 'PP&E / IAS 16',        pct: 82, barCls: 'bg-emerald-500', status: 'On Track',    statusCls: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
  { area: 'Revenue / IFRS 15',    pct: 61, barCls: 'bg-sky-500',     status: 'In Progress', statusCls: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800' },
  { area: 'Deferred Tax / IAS 12',pct: 52, barCls: 'bg-violet-500',  status: 'In Progress', statusCls: 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800' },
  { area: 'ECL / IFRS 9',         pct: 44, barCls: 'bg-amber-500',   status: 'Gap',         statusCls: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
  { area: 'Leases / IFRS 16',     pct: 70, barCls: 'bg-emerald-400', status: 'On Track',    statusCls: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
  { area: 'FX / IAS 21',          pct: 55, barCls: 'bg-sky-400',     status: 'In Progress', statusCls: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800' },
  { area: 'Disclosures / IAS 1',  pct: 67, barCls: 'bg-slate-400',   status: 'In Progress', statusCls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  { area: 'Legal Reserve',        pct: 90, barCls: 'bg-emerald-600', status: 'On Track',    statusCls: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
];

const REFS = [
  { label: 'AABE — aabe.gov.et',  url: 'https://aabe.gov.et' },
  { label: 'IASB — ifrs.org',     url: 'https://www.ifrs.org' },
  { label: 'ERCA eTax',           url: 'https://etax.erca.gov.et' },
  { label: 'NBE — nbe.gov.et',    url: 'https://www.nbe.gov.et' },
];
