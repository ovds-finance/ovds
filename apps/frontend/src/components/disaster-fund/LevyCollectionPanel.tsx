import {
  ShieldAlert, Plus, Send, CheckCircle2, Clock, AlertTriangle,
  Printer, Search, Info, Trash2, RefreshCw, Banknote, X,
  Calculator, FileText, BarChart3, TrendingUp, Download, Zap,
  Edit2, Receipt, ChevronUp, ChevronDown,
  CalendarClock, ArrowRight, Link2, Users, Receipt as ReceiptIcon,
  Building2, Fuel, Cigarette, Landmark, Ticket,
} from 'lucide-react';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

import api from '../../services/api';
import { fmtDecimal } from '../../utils/fmt';

/** Escape a value for safe HTML interpolation in document.write print windows. */
const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

// -- Types ---------------------------------------------------------------------
type LevyCategory =
  | 'LOAN_VALUE' | 'INSURANCE_PREMIUM' | 'SERVICE_FEES' | 'AIRTIME_SALES'
  | 'TICKET_SALES' | 'ANNUAL_SALES_REVENUE' | 'FUEL_SALES' | 'TOBACCO_ALCOHOL'
  | 'GOVERNMENT_SERVICES' | 'GOVERNMENT_BUDGET' | 'SALARY_CONTRIBUTION' | 'DIVIDEND' | 'OTHER';

type LevyStatus = 'COLLECTED' | 'REMITTED' | 'OVERDUE';

interface LevyEntry {
  id: string;
  category: LevyCategory;
  customerName: string;
  description: string;
  saleAmount: number;
  levyAmount: number;
  isFlat: boolean;
  transactionDate: string;
  period: string;
  status: LevyStatus;
  remittedAt?: string;
  referenceNo?: string;
}

interface MonthlyRemittance {
  id: string;
  period: string;
  totalLevy: number;
  bankName: string;
  referenceNo: string;
  remittedAt: string;
  remittedBy: string;
  notes?: string;
  onTime: boolean;
  penaltyAmount: number;
}

// -- Levy rules — DRRF Regulation Nov 11, 2025 ---------------------------------
const LEVY_RULES: Record<LevyCategory, {
  label: string; rate: number; isFlat: boolean; flatAmount?: number; desc: string; color: string;
}> = {
  LOAN_VALUE:           { label: 'Loan Value',           rate: 0.01,   isFlat: false, desc: '1% of loan value disbursed',                    color: '#4FBA6F' }, // brand green
  INSURANCE_PREMIUM:    { label: 'Insurance Premium',    rate: 0.01,   isFlat: false, desc: '1% of insurance premium collected',             color: '#7c3aed' }, // ovds-secondary
  SERVICE_FEES:         { label: 'Service Fees',         rate: 0.05,   isFlat: false, desc: '5% of service fees charged',                    color: '#f59e0b' }, // ovds-warning
  AIRTIME_SALES:        { label: 'Airtime Sales',        rate: 0.05,   isFlat: false, desc: '5% of airtime sold',                            color: '#0ea5e9' }, // sky-500
  TICKET_SALES:         { label: 'Ticket Sales',         rate: 0,      isFlat: true,  flatAmount: 100, desc: 'ETB 100 flat per ticket sold',  color: '#e11d48' }, // ovds-danger
  ANNUAL_SALES_REVENUE: { label: 'Annual Sales Revenue', rate: 0.05,   isFlat: false, desc: '5% of annual sales revenue',                    color: '#2ED47A' }, // brand vibrant green
  FUEL_SALES:           { label: 'Fuel Sales',           rate: 0,      isFlat: true,  flatAmount: 200, desc: 'ETB 200 flat per fuel issuance',color: '#f59e0b' }, // ovds-warning
  TOBACCO_ALCOHOL:      { label: 'Tobacco & Alcohol',    rate: 0.05,   isFlat: false, desc: '5% levy on tobacco & alcohol sales',            color: '#e11d48' }, // ovds-danger
  GOVERNMENT_SERVICES:  { label: 'Government Services',  rate: 0,      isFlat: true,  flatAmount: 200, desc: 'ETB 200 surcharge per service', color: '#64748b' }, // slate
  GOVERNMENT_BUDGET:    { label: 'Government Budget',    rate: 0.0025, isFlat: false, desc: '0.25% of annual budget allocation',             color: '#7c3aed' }, // ovds-secondary
  SALARY_CONTRIBUTION:  { label: 'Salary Contribution',  rate: 0.01,   isFlat: false, desc: '1% of net salary paid',                         color: '#4FBA6F' }, // brand green
  DIVIDEND:             { label: 'Dividends',            rate: 0.01,   isFlat: false, desc: '1% of dividend distributions',                  color: '#7c3aed' }, // ovds-secondary
  OTHER:                { label: 'Other',                rate: 0.01,   isFlat: false, desc: '1% of sales or import value',                   color: '#94a3b8' }, // slate
};

// -- Helpers -------------------------------------------------------------------
const fmt = fmtDecimal;

const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const computeLevy = (cat: LevyCategory, amount: number, qty = 1) => {
  const r = LEVY_RULES[cat];
  return r.isFlat ? (r.flatAmount ?? 0) * qty : Math.round(amount * r.rate * 100) / 100;
};

// Deadline = 10th of the month after the period
const getDeadline = (period: string) => {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m, 10); // m is already next month (0-indexed)
};

const isPeriodOverdue = (period: string) => new Date() > getDeadline(period);

const calcPenalty = (levy: number, period: string, remittedAt?: string) => {
  const deadline = getDeadline(period);
  const end = remittedAt ? new Date(remittedAt) : new Date();
  if (end <= deadline) return 0;
  const months = Math.ceil((end.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24 * 30));
  return Math.round(levy * 0.05 * months * 100) / 100;
};

// Forecast next period levy based on trailing 3-month average
const forecastNextPeriod = (byPeriod: Record<string, { levy: number }>) => {
  const sorted = Object.entries(byPeriod).sort((a, b) => a[0].localeCompare(b[0]));
  const last3 = sorted.slice(-3).map(([, v]) => v.levy);
  if (!last3.length) return 0;
  return Math.round((last3.reduce((s, v) => s + v, 0) / last3.length) * 100) / 100;
};

const STATUS_CLS: Record<LevyStatus, string> = {
  COLLECTED: 'bg-amber-50 text-amber-600 border-amber-200',
  REMITTED:  'bg-[var(--pro-azure-200)]/10 text-slate-800 border-[var(--pro-azure-100)]/20',
  OVERDUE:   'bg-rose-50 text-rose-600 border-rose-200',
};

// -- Seed data removed — component now fetches from /disaster-fund API ---------

// -- Mini trend bars -----------------------------------------------------------
const TrendBars: React.FC<{ data: { period: string; levy: number; remitted: number }[] }> = ({ data }) => {
  if (!data.length) return <p className="text-slate-400 dark:text-slate-500 text-xs text-center py-6">No trend data yet.</p>;
  const max = Math.max(...data.map((d) => d.levy), 1);
  return (
    <div className="flex items-end gap-1.5 h-24 w-full">
      {data.slice(-10).map((d) => (
        <div key={d.period} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-700 border border-slate-600 text-slate-900 dark:text-white text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-xl">
            <p className="font-semibold mb-0.5">{d.period}</p>
            <p className="text-amber-600">Collected: ETB {fmt(d.levy)}</p>
            <p className="text-[var(--pro-azure-light)]">Remitted: ETB {fmt(d.remitted)}</p>
          </div>
          <div className="w-full rounded-t-sm bg-slate-700/40 relative overflow-hidden" style={{ height: `${(d.levy / max) * 100}%`, minHeight: 4 }}>
            <div className="absolute bottom-0 left-0 right-0 bg-[var(--pro-azure-50)]0/60 rounded-t-sm" style={{ height: `${(d.remitted / Math.max(d.levy, 1)) * 100}%` }} />
          </div>
          <span className="text-[8px] text-slate-400 dark:text-slate-600 truncate w-full text-center">{d.period.slice(5)}</span>
        </div>
      ))}
    </div>
  );
};

// -- Compliance ring -----------------------------------------------------------
const ComplianceRing: React.FC<{ rate: number; label: string }> = ({ rate, label }) => {
  const r = 34; const circ = 2 * Math.PI * r;
  const color = rate >= 90 ? '#4FBA6F' : rate >= 70 ? '#f59e0b' : '#e11d48';
  const grade = rate >= 90 ? 'A' : rate >= 75 ? 'B' : rate >= 60 ? 'C' : 'D';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" className="-rotate-90 absolute inset-0">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={`${(rate / 100) * circ} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-semibold" style={{ color }}>{rate.toFixed(0)}%</span>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Grade {grade}</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 text-center">{label}</p>
    </div>
  );
};

// -- Category donut ------------------------------------------------------------
const CategoryDonut: React.FC<{ data: { cat: LevyCategory; levy: number }[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + d.levy, 0);
  if (!total) return <p className="text-slate-400 dark:text-slate-500 text-xs text-center py-6">No data yet.</p>;
  let cum = -90;
  const slices = data.filter((d) => d.levy > 0).map((d) => {
    const angle = (d.levy / total) * 360;
    const start = cum; cum += angle;
    const toRad = (a: number) => (a * Math.PI) / 180;
    const r = 52; const cx = 64; const cy = 64;
    const x1 = cx + r * Math.cos(toRad(start)); const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(start + angle)); const y2 = cy + r * Math.sin(toRad(start + angle));
    return { ...d, color: LEVY_RULES[d.cat].color, path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${angle > 180 ? 1 : 0},1 ${x2},${y2} Z` };
  });
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width="128" height="128" className="shrink-0">
        {slices.map((s) => <path key={s.cat} d={s.path} fill={s.color} opacity={0.85} />)}
        <circle cx="64" cy="64" r="32" fill="#0f172a" />
        <text x="64" y="60" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">TOTAL</text>
        <text x="64" y="72" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">ETB {fmt(total)}</text>
      </svg>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {slices.slice(0, 7).map((s) => (
          <div key={s.cat} className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 dark:text-slate-400 truncate flex-1">{LEVY_RULES[s.cat].label}</span>
            <span className="text-[11px] text-slate-900 dark:text-white font-mono shrink-0">{((s.levy / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// -- Edit levy modal -----------------------------------------------------------
const EditLevyModal: React.FC<{
  entry: LevyEntry;
  onClose: () => void;
  onSave: (updated: LevyEntry) => void;
}> = ({ entry, onClose, onSave }) => {
  const [form, setForm] = useState({
    customerName: entry.customerName,
    description: entry.description,
    transactionDate: entry.transactionDate,
    period: entry.period,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName) { toast.error('Customer name is required'); return; }
    onSave({ ...entry, ...form });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2"><Edit2 size={15} className="text-[var(--pro-azure-light)]" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Edit Entry</h3></div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {/* read-only summary */}
          <div className="bg-slate-100/60 dark:bg-slate-800/60 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: LEVY_RULES[entry.category].color }} />
              <span className="text-xs font-bold text-slate-400 dark:text-slate-600 dark:text-slate-300">{LEVY_RULES[entry.category].label}</span>
            </div>
            <span className="text-sm font-semibold text-amber-600">ETB {fmt(entry.levyAmount)}</span>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Customer Name *</label>
            <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Transaction Date</label>
              <input type="date" value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400/30" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Period</label>
              <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400/30" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/30" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-700 text-slate-400 dark:text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors">
              <CheckCircle2 size={14} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -- Period drawer -------------------------------------------------------------
const PeriodDrawer: React.FC<{
  period: string;
  entries: LevyEntry[];
  remittance?: MonthlyRemittance;
  onClose: () => void;
  onRemit: () => void;
}> = ({ period, entries, remittance, onClose, onRemit }) => {
  const total = entries.reduce((s, e) => s + e.levyAmount, 0);
  const remittedAmt = entries.filter((e) => e.status === 'REMITTED').reduce((s, e) => s + e.levyAmount, 0);
  const pending = total - remittedAmt;
  const deadline = getDeadline(period);
  const overdue = isPeriodOverdue(period) && pending > 0;
  const byCat: Partial<Record<LevyCategory, number>> = {};
  for (const e of entries) byCat[e.category] = (byCat[e.category] ?? 0) + e.levyAmount;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-rose-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Period: {period}</h3>
            {overdue && <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-medium uppercase">Overdue</span>}
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total Levy', value: `ETB ${fmt(total)}`, color: 'text-slate-900 dark:text-white' },
              { label: 'Remitted',   value: `ETB ${fmt(remittedAmt)}`, color: 'text-[var(--pro-azure-light)]' },
              { label: 'Pending',    value: `ETB ${fmt(pending)}`, color: pending > 0 ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/40 rounded-xl p-3 text-center">
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-sm font-semibold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Deadline info */}
          <div className={`rounded-xl p-3 flex items-center gap-3 ${overdue ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-slate-100/40 dark:bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/40'}`}>
            <Clock size={14} className={overdue ? 'text-rose-400' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400'} />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-600 dark:text-slate-300">Remittance Deadline</p>
              <p className={`text-[11px] ${overdue ? 'text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>{deadline.toLocaleDateString('en-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            {overdue && pending > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-rose-400 font-semibold">Penalty</p>
                <p className="text-xs font-semibold text-rose-300">ETB {fmt(calcPenalty(pending, period))}</p>
              </div>
            )}
          </div>

          {/* Remittance record */}
          {remittance ? (
            <div className="bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure)]/20 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-[var(--pro-azure-light)]" />
                <p className="text-xs font-semibold text-green-300">Remittance Recorded</p>
              </div>
              {[
                ['Bank', remittance.bankName],
                ['Reference', remittance.referenceNo],
                ['Date', remittance.remittedAt],
                ['By', remittance.remittedBy],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500">{k}</span>
                  <span className="text-slate-400 dark:text-slate-600 dark:text-slate-300 font-bold">{v}</span>
                </div>
              ))}
              {remittance.penaltyAmount > 0 && (
                <div className="flex justify-between text-[11px] pt-1 border-t border-[var(--pro-azure)]/20">
                  <span className="text-rose-400">Penalty paid</span>
                  <span className="text-rose-300 font-semibold">ETB {fmt(remittance.penaltyAmount)}</span>
                </div>
              )}
            </div>
          ) : pending > 0 ? (
            <button onClick={onRemit} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--pro-azure-50)]0 text-slate-900 dark:text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors">
              <Send size={14} /> Record Remittance for {period}
            </button>
          ) : null}

          {/* Category breakdown */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">By Category</p>
            <div className="space-y-1.5">
              {(Object.entries(byCat) as [LevyCategory, number][]).sort((a, b) => b[1] - a[1]).map(([cat, levy]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: LEVY_RULES[cat].color }} />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 dark:text-slate-400 flex-1">{LEVY_RULES[cat].label}</span>
                  <span className="text-[11px] font-semibold text-slate-900 dark:text-white font-mono">ETB {fmt(levy)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Transactions ({entries.length})</p>
            <div className="space-y-1.5">
              {entries.map((e) => (
                <div key={e.id} className="bg-slate-100/40 dark:bg-slate-800/40 border border-slate-700/30 rounded-xl px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{e.customerName}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{e.transactionDate} · {LEVY_RULES[e.category].label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-orange-400">ETB {fmt(e.levyAmount)}</p>
                    <span className={`text-[10px] font-medium ${e.status === 'REMITTED' ? 'text-[var(--pro-azure-light)]' : e.status === 'OVERDUE' ? 'text-rose-400' : 'text-amber-400'}`}>{e.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -- Receipt printer -----------------------------------------------------------
const printReceipt = (entry: LevyEntry) => {
  const w = window.open('', '_blank'); if (!w) return;
  const rule = LEVY_RULES[entry.category];
  w.document.write(`<html><head><title>DRRF Levy Receipt</title>
    <style>
      body{font-family:Arial,sans-serif;padding:0;margin:0;color:#0f172a}
      .receipt{max-width:380px;margin:40px auto;border:2px solid #e2e8f0;border-radius:12px;overflow:hidden}
      .header{background:#0f172a;color:white;padding:20px;text-align:center}
      .body{padding:20px}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:12px}
      .row:last-child{border:none}
      .label{color:#64748b}
      .value{font-weight:900}
      .total{background:#fffbeb;padding:16px;text-align:center;border-top:2px solid #fef3c7}
      .footer{padding:12px 20px;background:#f8fafc;font-size:10px;color:#94a3b8;text-align:center}
    </style></head><body>
    <div class="receipt">
      <div class="header">
        <p style="font-size:10px;letter-spacing:.2em;opacity:.6;margin:0 0 4px">OFFICIAL LEVY RECEIPT</p>
        <h2 style="margin:0;font-size:16px">Disaster Risk Response Fund</h2>
        <p style="font-size:10px;opacity:.5;margin:4px 0 0">Ethiopian DRRF Regulation — Nov 11, 2025</p>
      </div>
      <div class="body">
        <div class="row"><span class="label">Receipt No.</span><span class="value">${esc(entry.id.slice(0, 8).toUpperCase())}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${esc(entry.transactionDate)}</span></div>
        <div class="row"><span class="label">Period</span><span class="value">${esc(entry.period)}</span></div>
        <div class="row"><span class="label">Customer</span><span class="value">${esc(entry.customerName)}</span></div>
        <div class="row"><span class="label">Category</span><span class="value">${esc(rule.label)}</span></div>
        <div class="row"><span class="label">Description</span><span class="value">${esc(entry.description || '—')}</span></div>
        <div class="row"><span class="label">Sale Amount</span><span class="value">ETB ${fmt(entry.saleAmount)}</span></div>
        <div class="row"><span class="label">Levy Rate</span><span class="value">${rule.isFlat ? `ETB ${rule.flatAmount} flat` : `${(rule.rate * 100).toFixed(2)}%`}</span></div>
        <div class="row"><span class="label">Status</span><span class="value" style="color:${entry.status === 'REMITTED' ? '#4FBA6F' : '#f59e0b'}">${entry.status}</span></div>
        ${entry.referenceNo ? `<div class="row"><span class="label">Ref No.</span><span class="value">${entry.referenceNo}</span></div>` : ''}
      </div>
      <div class="total">
        <p style="font-size:10px;color:#b45309;margin:0 0 4px;font-weight:900;text-transform:uppercase;letter-spacing:.1em">Levy Collected from Customer</p>
        <p style="font-size:28px;font-weight:900;color:#f59e0b;margin:0">ETB ${fmt(entry.levyAmount)}</p>
      </div>
      <div class="footer">This levy is a pass-through charge collected on behalf of the DRRF Office. Remittance due by the 10th of the following month.</div>
    </div>
  </body></html>`);
  w.document.close(); w.print(); w.addEventListener('afterprint', () => w.close());
};

const SOURCE_META: Record<string, { label: string; icon: React.ReactNode; desc: string; color: string }> = {
  SALARY_CONTRIBUTION:  { label: 'Payroll',          icon: <Users size={14} />,     desc: '1% of approved net pay',              color: '#4FBA6F' },
  ANNUAL_SALES_REVENUE: { label: 'Sales Invoices',   icon: <ReceiptIcon size={14} />,desc: '5% of paid invoice subtotals',        color: '#2ED47A' },
  SERVICE_FEES:         { label: 'Service Invoices', icon: <Link2 size={14} />,     desc: '5% of mobile/bank payment invoices',  color: '#f59e0b' },
  TICKET_SALES:         { label: 'Ticket Invoices',  icon: <Ticket size={14} />,    desc: 'ETB 100 flat per ticket invoice',     color: '#e11d48' },
  LOAN_VALUE:           { label: 'Business Loans',   icon: <Building2 size={14} />, desc: '1% of disbursed loan amounts',        color: '#4FBA6F' },
  INSURANCE_PREMIUM:    { label: 'Insurance Bills',  icon: <ShieldAlert size={14} />,desc: '1% of paid insurance bills',         color: '#7c3aed' },
  AIRTIME_SALES:        { label: 'Airtime Bills',    icon: <Zap size={14} />,       desc: '5% of paid airtime bills',            color: '#0ea5e9' },
  FUEL_SALES:           { label: 'Fuel Bills',       icon: <Fuel size={14} />,      desc: 'ETB 200 flat per fuel bill',          color: '#f59e0b' },
  TOBACCO_ALCOHOL:      { label: 'Tobacco/Alcohol',  icon: <Cigarette size={14} />, desc: '5% of tobacco & alcohol bills',       color: '#e11d48' },
  GOVERNMENT_SERVICES:  { label: 'Govt. Service Bills',icon: <Landmark size={14} />,desc: 'ETB 200 flat per govt service bill',  color: '#64748b' },
};

interface SyncPreviewItem {
  category: string;
  description: string;
  baseAmount: number;
  levyAmount: number;
  source: string;
  sourceCount: number;
}

const SyncModal: React.FC<{
  onClose: () => void;
  onSynced: (items: LevyEntry[]) => void;
}> = ({ onClose, onSynced }) => {
  const [period, setPeriod] = useState(currentPeriod());
  const [selected, setSelected] = useState<string[]>(Object.keys(SOURCE_META));
  const [previewing, setPreviewing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [previews, setPreviews] = useState<SyncPreviewItem[] | null>(null);

  const toggle = (key: string) =>
    setSelected((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key]);

  const handlePreview = async () => {
    if (!selected.length) { toast.error('Select at least one source'); return; }
    setPreviewing(true);
    setPreviews(null);
    try {
      const res = await api.post('/disaster-fund/auto-generate', {
        period, sources: selected, dryRun: true,
      });
      const data = res.data.data;
      const items: SyncPreviewItem[] = data.previews ?? data.items ?? [];
      setPreviews(items);
      if (!items.length) toast('No activity found for this period', { icon: 'ℹ️' });
    } catch (err: any) {
      if (!err?.isRateLimited) toast.error('Preview failed — check API connection');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSync = async () => {
    if (!previews?.length) return;
    setSyncing(true);
    try {
      const res = await api.post('/disaster-fund/auto-generate', {
        period, sources: selected, dryRun: false,
      });
      const data = res.data.data;
      // Convert API response to local LevyEntry format for immediate display
      const newEntries: LevyEntry[] = (data.previews ?? previews).map((p: SyncPreviewItem) => ({
        id: `sync-${p.category}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        category: p.category as LevyCategory,
        customerName: p.source,
        description: p.description,
        saleAmount: p.baseAmount,
        levyAmount: p.levyAmount,
        isFlat: LEVY_RULES[p.category as LevyCategory]?.isFlat ?? false,
        transactionDate: new Date().toISOString().split('T')[0],
        period,
        status: 'COLLECTED' as LevyStatus,
      }));
      onSynced(newEntries);
      toast.success(
        `Synced ${data.generated ?? newEntries.length} levy entries from system${data.skipped ? ` (${data.skipped} skipped — already exist)` : ''}`,
      );
      onClose();
    } catch (err: any) {
      if (!err?.isRateLimited) toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const totalLevy = previews?.reduce((s, p) => s + p.levyAmount, 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-rose-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Sync Levy from System Activity</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white"><X size={16} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Period */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Collection Period *</label>
            <input value={period} onChange={(e) => { setPeriod(e.target.value); setPreviews(null); }}
              placeholder="YYYY-MM"
              className="w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500/50" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Scans all system activity within this calendar month</p>
          </div>

          {/* Source selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Sources</label>
              <div className="flex gap-2">
                <button onClick={() => setSelected(Object.keys(SOURCE_META))} className="text-[10px] text-rose-600 font-semibold hover:text-rose-600-dark">All</button>
                <span className="text-slate-400 dark:text-slate-600">·</span>
                <button onClick={() => setSelected([])} className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold hover:text-slate-600 dark:text-slate-300">None</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SOURCE_META).map(([key, meta]) => (
                <button key={key} onClick={() => toggle(key)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${selected.includes(key) ? 'border-rose-500/40 bg-rose-50' : 'border-slate-700/60 bg-slate-100/40 dark:bg-slate-800/40 hover:border-slate-600'}`}>
                  <span className={`shrink-0 ${selected.includes(key) ? 'text-rose-600' : 'text-slate-400 dark:text-slate-500'}`}>{meta.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${selected.includes(key) ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{meta.label}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{meta.desc}</p>
                  </div>
                  {selected.includes(key) && <CheckCircle2 size={12} className="text-rose-600 shrink-0 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preview results */}
          {previews !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preview — {period}</p>
                {previews.length > 0 && (
                  <span className="text-xs font-semibold text-orange-400">Total levy: ETB {fmt(totalLevy)}</span>
                )}
              </div>
              {previews.length === 0 ? (
                <div className="bg-slate-100/40 dark:bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/40 rounded-xl p-6 text-center">
                  <p className="text-slate-400 dark:text-slate-500 text-xs">No activity found for {period}. Try a different period or check that data exists in the system.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {previews.map((p) => {
                    const meta = SOURCE_META[p.category];
                    const rule = LEVY_RULES[p.category as LevyCategory];
                    return (
                      <div key={p.category} className="bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/40 rounded-xl px-4 py-3 flex items-center gap-3">
                        <span className="shrink-0" style={{ color: rule?.color ?? '#94a3b8' }}>{meta?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{meta?.label ?? p.category}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{p.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-orange-400">ETB {fmt(p.levyAmount)}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">{p.sourceCount} record{p.sourceCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onClose} className="px-4 py-2.5 bg-slate-700 text-slate-400 dark:text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            Cancel
          </button>
          <button onClick={handlePreview} disabled={previewing || !selected.length}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-600 disabled:opacity-50 transition-colors">
            {previewing ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            {previewing ? 'Scanning...' : 'Preview'}
          </button>
          <button onClick={handleSync} disabled={syncing || !previews?.length}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-slate-900 dark:text-white rounded-xl text-sm font-bold hover:bg-rose-500 disabled:opacity-50 transition-colors">
            {syncing ? <RefreshCw size={14} className="animate-spin" /> : <Link2 size={14} />}
            {syncing ? 'Syncing...' : `Sync ${previews?.length ?? 0} Entries to Collection Register`}
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Rules modal ---------------------------------------------------------------
const RulesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-orange-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Levy Rate Schedule — DRRF Regulation (Nov 11, 2025)</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white"><X size={16} /></button>
      </div>
      <div className="overflow-y-auto p-4 space-y-4">
        <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 italic">
          Levies are collected from customers at point of sale and remitted monthly to the Disaster Risk Response Fund Office.
          The business acts as a collection agent — this is a pass-through cost to the consumer.
        </p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
              <th className="text-center py-2 px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rate</th>
              <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(Object.entries(LEVY_RULES) as [LevyCategory, typeof LEVY_RULES[LevyCategory]][]).map(([key, rule]) => (
              <tr key={key} className="hover:bg-slate-100/40 dark:hover:bg-slate-100/40 dark:bg-slate-800/40">
                <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: rule.color }} />
                    {rule.label}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: rule.color + '22', color: rule.color }}>
                    {rule.isFlat ? `ETB ${rule.flatAmount} flat` : `${(rule.rate * 100).toFixed(2)}%`}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 dark:text-slate-400">{rule.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl flex gap-2">
            <Info size={14} className="text-[var(--pro-azure-light)] shrink-0 mt-0.5" />
            <p className="text-[11px] text-green-300">Remittance deadline: 10th of the following month. Late remittance attracts a 5% penalty per month.</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-2">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300">Effective: November 11, 2025. All registered businesses are mandated to comply.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// -- Add levy modal ------------------------------------------------------------
const AddLevyModal: React.FC<{ onClose: () => void; onAdd: (e: LevyEntry) => void }> = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    category: 'SERVICE_FEES' as LevyCategory,
    customerName: '', description: '', saleAmount: '', qty: '1',
    transactionDate: new Date().toISOString().split('T')[0],
    period: currentPeriod(),
  });
  const rule = LEVY_RULES[form.category];
  const saleAmt = parseFloat(form.saleAmount) || 0;
  const qty = parseInt(form.qty) || 1;
  const preview = (saleAmt > 0 || rule.isFlat) ? computeLevy(form.category, saleAmt, qty) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || (!saleAmt && !rule.isFlat)) { toast.error('Customer name and amount are required'); return; }
    onAdd({
      id: `lv${Date.now()}`, category: form.category, customerName: form.customerName,
      description: form.description, saleAmount: saleAmt,
      levyAmount: computeLevy(form.category, saleAmt, qty),
      isFlat: rule.isFlat, transactionDate: form.transactionDate,
      period: form.period, status: 'COLLECTED',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2"><Plus size={16} className="text-orange-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Record Levy Collection</h3></div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Levy Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as LevyCategory })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500/50">
                {(Object.entries(LEVY_RULES) as [LevyCategory, typeof LEVY_RULES[LevyCategory]][]).map(([k, r]) => (
                  <option key={k} value={k}>{r.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">{rule.desc}</p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Customer Name *</label>
              <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="Customer / payer name"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Transaction Date *</label>
              <input type="date" value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                {rule.isFlat ? 'Quantity / Units *' : 'Sale Amount (ETB) *'}
              </label>
              <input type="number" min="0" step={rule.isFlat ? '1' : '0.01'}
                value={rule.isFlat ? form.qty : form.saleAmount}
                onChange={(e) => rule.isFlat ? setForm({ ...form, qty: e.target.value }) : setForm({ ...form, saleAmount: e.target.value })}
                placeholder={rule.isFlat ? 'Number of units' : '0.00'}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Period (YYYY-MM) *</label>
              <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                placeholder="2026-03"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
          </div>
          {preview !== null && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><Calculator size={14} className="text-amber-600" /><span className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-300">Levy to collect from customer</span></div>
              <span className="text-lg font-semibold text-amber-600">ETB {fmt(preview)}</span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-700 text-slate-400 dark:text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-slate-900 dark:text-white rounded-xl text-sm font-bold hover:bg-amber-500-dark transition-colors">
              <Plus size={14} /> Record Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -- Remittance modal ----------------------------------------------------------
const RemittanceModal: React.FC<{
  period: string; totalLevy: number;
  onClose: () => void; onConfirm: (d: Omit<MonthlyRemittance, 'id'>) => void;
}> = ({ period, totalLevy, onClose, onConfirm }) => {
  const [form, setForm] = useState({
    bankName: '', referenceNo: `DRRF-${period}-001`, remittedBy: '', notes: '',
    remittedAt: new Date().toISOString().split('T')[0],
  });
  const [busy, setBusy] = useState(false);
  const deadline = getDeadline(period);
  const late = new Date(form.remittedAt) > deadline;
  const penalty = calcPenalty(totalLevy, period, form.remittedAt);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bankName || !form.referenceNo || !form.remittedBy) { toast.error('Fill in all required fields'); return; }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    onConfirm({ period, totalLevy, ...form, onTime: !late, penaltyAmount: penalty });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2"><Send size={16} className="text-[var(--pro-azure-light)]" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Record Monthly Remittance</h3></div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-slate-100/60 dark:bg-slate-800/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Period</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{period}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Deadline: {deadline.toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Levy to Remit</p>
              <p className="text-xl font-semibold text-amber-600">ETB {fmt(totalLevy)}</p>
            </div>
          </div>
          {late && (
            <div className="bg-rose-50 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-rose-600-dark">Late remittance — penalty applies</p>
                <p className="text-[11px] text-rose-600 mt-0.5">Estimated penalty: ETB {fmt(penalty)} (5% per month overdue)</p>
              </div>
            </div>
          )}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Bank Name *</label>
            <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              placeholder="e.g. Commercial Bank of Ethiopia"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Reference No. *</label>
              <input value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Remittance Date *</label>
              <input type="date" value={form.remittedAt} onChange={(e) => setForm({ ...form, remittedAt: e.target.value })}
                className={`w-full bg-slate-800 border rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/30 ${late ? 'border-rose-500/60' : 'border-slate-700'}`} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Remitted By *</label>
            <input value={form.remittedBy} onChange={(e) => setForm({ ...form, remittedBy: e.target.value })}
              placeholder="Name of person who remitted"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-700 text-slate-400 dark:text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={busy} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 transition-colors">
              {busy ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              {busy ? 'Recording...' : 'Record Remittance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -- Main panel ----------------------------------------------------------------
const LevyCollectionPanel: React.FC = () => {
  // -- Real API state (replaces localStorage seed data) ----------------------
  const [entries, setEntries] = useState<LevyEntry[]>([]);
  const [remittances, setRemittances] = useState<MonthlyRemittance[]>([]);
  const [, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const [contribRes, remitRes] = await Promise.all([
        api.get('/disaster-fund', { headers: { 'x-background': '1' } }),
        api.get('/disaster-fund/schedule/' + new Date().getFullYear(), { headers: { 'x-background': '1' } }),
      ]);
      const raw = contribRes.data?.data ?? contribRes.data ?? [];
      // Map backend DisasterFundContribution → LevyEntry shape
      setEntries(
        (Array.isArray(raw) ? raw : raw.data ?? []).map((c: any) => ({
          id: c.id,
          category: c.category ?? 'OTHER',
          customerName: c.customerName ?? c.description ?? '—',
          description: c.description ?? '',
          saleAmount: Number(c.saleAmount ?? c.amount ?? 0),
          levyAmount: Number(c.levyAmount ?? c.amount ?? 0),
          isFlat: c.isFlat ?? false,
          transactionDate: (c.transactionDate ?? c.createdAt ?? '').split('T')[0],
          period: c.period ?? (c.createdAt ?? '').slice(0, 7),
          status: (c.status ?? 'COLLECTED') as LevyStatus,
          remittedAt: c.remittedAt ?? undefined,
          referenceNo: c.referenceNo ?? undefined,
        }))
      );
      const remitRaw = remitRes.data?.data ?? remitRes.data ?? [];
      setRemittances(
        (Array.isArray(remitRaw) ? remitRaw : []).map((r: any) => ({
          id: r.id,
          period: r.period ?? '',
          totalLevy: Number(r.totalLevy ?? r.amount ?? 0),
          bankName: r.bankName ?? '',
          referenceNo: r.referenceNo ?? '',
          remittedAt: (r.remittedAt ?? r.createdAt ?? '').split('T')[0],
          remittedBy: r.remittedBy ?? '',
          notes: r.notes ?? '',
          onTime: r.onTime ?? true,
          penaltyAmount: Number(r.penaltyAmount ?? 0),
        }))
      );
    } catch {
      // Silently degrade — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  const [tab, setTab] = useState<'collections' | 'analytics' | 'remittances'>('collections');
  const [showAdd, setShowAdd] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [remitPeriod, setRemitPeriod] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterStatus, setFilterStatus] = useState<LevyStatus | ''>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editEntry, setEditEntry] = useState<LevyEntry | null>(null);
  const [drawerPeriod, setDrawerPeriod] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<keyof LevyEntry>('transactionDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
   
  const [remittanceSearch] = useState('');
  const [now, setNow] = useState(() => new Date());

  // Refresh "now" every minute so deadline countdown stays accurate
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-flag overdue: collected entries past their deadline become OVERDUE
  const entriesWithOverdue = useMemo<LevyEntry[]>(() =>
    entries.map((e) =>
      e.status === 'COLLECTED' && isPeriodOverdue(e.period)
        ? { ...e, status: 'OVERDUE' as LevyStatus }
        : e,
    ), [entries]);

  // -- Stats ------------------------------------------------------------------
  const stats = useMemo(() => {
    const all = entriesWithOverdue;
    const totalAll   = all.reduce((s, e) => s + e.levyAmount, 0);
    const collected  = all.filter((e) => e.status === 'COLLECTED').reduce((s, e) => s + e.levyAmount, 0);
    const remitted   = all.filter((e) => e.status === 'REMITTED').reduce((s, e) => s + e.levyAmount, 0);
    const overdue    = all.filter((e) => e.status === 'OVERDUE').reduce((s, e) => s + e.levyAmount, 0);
    const complianceRate = totalAll > 0 ? (remitted / totalAll) * 100 : 0;

    const byPeriod: Record<string, { levy: number; remitted: number; count: number }> = {};
    for (const e of all) {
      if (!byPeriod[e.period]) byPeriod[e.period] = { levy: 0, remitted: 0, count: 0 };
      byPeriod[e.period].count++;
      byPeriod[e.period].levy += e.levyAmount;
      if (e.status === 'REMITTED') byPeriod[e.period].remitted += e.levyAmount;
    }

    const byCategory: Partial<Record<LevyCategory, number>> = {};
    for (const e of all) byCategory[e.category] = (byCategory[e.category] ?? 0) + e.levyAmount;

    const totalPenalty = remittances.reduce((s, r) => s + r.penaltyAmount, 0);
    const onTimeCount  = remittances.filter((r) => r.onTime).length;
    const onTimeRate   = remittances.length > 0 ? (onTimeCount / remittances.length) * 100 : 100;

    return { totalAll, collected, remitted, overdue, complianceRate, byPeriod, byCategory, totalPenalty, onTimeRate };
  }, [entriesWithOverdue, remittances]);

  const pendingPeriods = useMemo(() =>
    Object.entries(stats.byPeriod)
      .filter(([, v]) => v.levy > v.remitted)
      .map(([period, v]) => ({ period, amount: v.levy - v.remitted, count: v.count, overdue: isPeriodOverdue(period) }))
      .sort((a, b) => b.period.localeCompare(a.period)),
    [stats.byPeriod]);

  const trendData = useMemo(() =>
    Object.entries(stats.byPeriod)
      .map(([period, v]) => ({ period, levy: v.levy, remitted: v.remitted }))
      .sort((a, b) => a.period.localeCompare(b.period)),
    [stats.byPeriod]);

  const catData = useMemo(() =>
    (Object.entries(stats.byCategory) as [LevyCategory, number][])
      .map(([cat, levy]) => ({ cat, levy }))
      .sort((a, b) => b.levy - a.levy),
    [stats.byCategory]);

   
  // Period-over-period comparison (last 6 periods)
   
  const periods = useMemo(() =>
    [...new Set(entries.map((e) => e.period))].sort().reverse(), [entries]);

  const filtered = useMemo(() =>
    entriesWithOverdue.filter((e) => {
      if (filterPeriod && e.period !== filterPeriod) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.customerName.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          LEVY_RULES[e.category].label.toLowerCase().includes(q);
      }
      return true;
    }), [entriesWithOverdue, filterPeriod, filterStatus, search]);

  const sortedFiltered = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = String(a[sortCol] ?? '');
      const bv = String(b[sortCol] ?? '');
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  const handleSort = (col: keyof LevyEntry) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
  };

   
  const _filteredRemittances = useMemo(() => {
    if (!remittanceSearch.trim()) return remittances;
    const q = remittanceSearch.toLowerCase();
    return remittances.filter((r) =>
      r.period.includes(q) || r.bankName.toLowerCase().includes(q) ||
      r.referenceNo.toLowerCase().includes(q) || r.remittedBy.toLowerCase().includes(q),
    );
  }, [remittances, remittanceSearch]);

  const nextDeadline = useMemo(() => {
    const deadline = new Date(now.getFullYear(), now.getMonth() + 1, 10);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return { period, deadline, daysLeft };
  }, [now]);
  const forecastLevy = useMemo(() => forecastNextPeriod(stats.byPeriod), [stats.byPeriod]);

  // -- Actions (real API) ----------------------------------------------------
  const handleAdd = useCallback(async (entry: LevyEntry) => {
    try {
      const res = await api.post('/disaster-fund', {
        category: entry.category,
        customerName: entry.customerName,
        description: entry.description,
        saleAmount: entry.saleAmount,
        levyAmount: entry.levyAmount,
        isFlat: entry.isFlat,
        transactionDate: entry.transactionDate,
        period: entry.period,
        status: entry.status,
      });
      const created = res.data?.data ?? res.data;
      setEntries((prev) => [{ ...entry, id: created.id ?? entry.id }, ...prev]);
      toast.success(`Levy of ETB ${fmt(entry.levyAmount)} recorded`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save levy entry');
    }
  }, []);

  const handleSynced = useCallback((newEntries: LevyEntry[]) => {
    setEntries((prev) => {
      const existing = new Set(prev.map((e) => `${e.category}|${e.period}`));
      const fresh = newEntries.filter((e) => !existing.has(`${e.category}|${e.period}`));
      return [...fresh, ...prev];
    });
    fetchEntries(); // Re-sync from server after auto-generate
  }, [fetchEntries]);

  const handleEdit = useCallback(async (updated: LevyEntry) => {
    try {
      await api.patch(`/disaster-fund/${updated.id}`, {
        customerName: updated.customerName,
        description: updated.description,
        transactionDate: updated.transactionDate,
        period: updated.period,
      });
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success('Entry updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update entry');
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/disaster-fund/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      toast.success('Entry removed');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete entry');
    }
  }, []);

  const markRemitted = useCallback(async (ids: string[], refNo?: string) => {
    try {
      await api.patch('/disaster-fund/bulk-remit', { ids, referenceNo: refNo });
      setEntries((prev) => prev.map((e) =>
        ids.includes(e.id) ? { ...e, status: 'REMITTED' as LevyStatus, remittedAt: new Date().toISOString(), referenceNo: refNo } : e,
      ));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to mark as remitted');
    }
  }, []);

  const handleBulkRemit = async () => {
    if (!selected.size) return;
    const ids = [...selected];
    await markRemitted(ids);
    setSelected(new Set());
    toast.success(`${ids.length} entries marked as remitted`);
  };

  const handleConfirmRemittance = useCallback(async (data: Omit<MonthlyRemittance, 'id'>) => {
    try {
      // Record remittance against the first matching contribution for this period
      const periodEntries = entriesWithOverdue.filter((e) => e.period === data.period && e.status !== 'REMITTED');
      if (periodEntries.length > 0) {
        await api.post(`/disaster-fund/${periodEntries[0].id}/remittances`, {
          bankName: data.bankName,
          referenceNo: data.referenceNo,
          remittedAt: data.remittedAt,
          remittedBy: data.remittedBy,
          notes: data.notes,
          amount: data.totalLevy,
        });
      }
      const id = `rem${Date.now()}`;
      setRemittances((prev) => [{ ...data, id }, ...prev]);
      const ids = periodEntries.map((e) => e.id);
      await markRemitted(ids, data.referenceNo);
      toast.success(`Remittance for ${data.period} recorded — ETB ${fmt(data.totalLevy)}`);
      setRemitPeriod(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to record remittance');
    }
  }, [entriesWithOverdue, markRemitted]);

  const exportCsv = () => {
    const rows = [
      ['Date', 'Customer', 'Category', 'Description', 'Sale Amount', 'Levy Amount', 'Period', 'Status', 'Reference'],
      ...filtered.map((e) => [
        e.transactionDate, e.customerName, LEVY_RULES[e.category].label,
        e.description, e.saleAmount, e.levyAmount, e.period, e.status, e.referenceNo ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drrf-levy-${filterPeriod || 'all'}-${Date.now()}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const printReport = (period: string) => {
    const pe = entriesWithOverdue.filter((e) => e.period === period);
    const total = pe.reduce((s, e) => s + e.levyAmount, 0);
    const w = window.open('', '_blank'); if (!w) return;
    const rows = pe.map((e) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${esc(e.transactionDate)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${esc(e.customerName)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${esc(LEVY_RULES[e.category].label)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">ETB ${fmt(e.saleAmount)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:900;color:#ea580c">ETB ${fmt(e.levyAmount)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">
          <span style="padding:2px 8px;border-radius:999px;font-size:10px;font-weight:900;background:${e.status === 'REMITTED' ? '#99ffd4' : '#fef3c7'};color:${e.status === 'REMITTED' ? '#444444' : '#92400e'}">${esc(e.status)}</span>
        </td>
      </tr>`).join('');
    w.document.write(`<html><head><title>DRRF Levy Report — ${esc(period)}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#1e293b}table{width:100%;border-collapse:collapse}th{background:#f8fafc;padding:10px 12px;text-align:left;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#64748b;border-bottom:2px solid #e2e8f0}</style>
      </head><body>
      <div style="display:flex;justify-content:space-between;margin-bottom:32px">
        <div><h1 style="font-size:20px;font-weight:900;margin:0 0 4px">Disaster Risk Response Fund</h1>
        <h2 style="font-size:14px;font-weight:700;color:#64748b;margin:0">Monthly Levy Collection Report — ${period}</h2></div>
        <div style="text-align:right"><p style="font-size:10px;color:#64748b;margin:0">Generated: ${new Date().toLocaleDateString()}</p>
        <p style="font-size:10px;color:#64748b;margin:0">Regulation effective: November 11, 2025</p></div>
      </div>
      <table><thead><tr><th>Date</th><th>Customer</th><th>Category</th><th style="text-align:right">Sale Amount</th><th style="text-align:right">Levy Collected</th><th style="text-align:center">Status</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr style="background:#fff7ed"><td colspan="4" style="padding:12px;font-weight:900;font-size:13px">Total Levy Collected</td>
      <td style="padding:12px;text-align:right;font-weight:900;font-size:16px;color:#ea580c">ETB ${fmt(total)}</td><td></td></tr></tfoot></table>
      <div style="margin-top:32px;padding:16px;background:#f0fff8;border:1px solid #99ffd4;border-radius:8px">
        <p style="font-size:11px;color:#166534;margin:0;font-weight:700">This levy is collected from customers as a pass-through charge per the Ethiopian DRRF Regulation (Nov 11, 2025). Remittance is due by the 10th of the following month.</p>
      </div></body></html>`);
    w.document.close(); w.print(); w.addEventListener('afterprint', () => w.close());
  };

  const toggleSelect = (id: string) => setSelected((prev) => {
    const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n;
  });
  const toggleAll = () => {
    const ids = filtered.map((e) => e.id);
    const allSel = ids.every((id) => selected.has(id));
    setSelected(allSel ? new Set() : new Set(ids));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={18} className="text-rose-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Disaster Risk Response Fund — Levy Collection</h2>
            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-semibold uppercase tracking-wider">Effective Nov 11, 2025</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 max-w-xl">
            Track levies collected from customers at point of sale. Remit monthly to the DRRF Office by the 10th of each month.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowRules(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-slate-400 dark:text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <FileText size={13} /> Rate Schedule
          </button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-slate-400 dark:text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => setShowSync(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[var(--pro-azure-50)]0 text-slate-900 dark:text-white rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-dark)] transition-colors shadow-lg shadow-green-500/20 dark:shadow-green-500/10/30">
            <Link2 size={13} /> Sync from System
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-slate-900 dark:text-white rounded-xl text-xs font-bold hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20">
            <Plus size={13} /> Record Collection
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Collected',    value: `ETB ${fmt(stats.totalAll)}`,   color: 'text-slate-900 dark:text-white',        icon: <Banknote size={15} className="text-rose-400" /> },
          { label: 'Pending Remittance', value: `ETB ${fmt(stats.collected)}`,  color: 'text-amber-400',    icon: <Clock size={15} className="text-amber-400" /> },
          { label: 'Total Remitted',     value: `ETB ${fmt(stats.remitted)}`,   color: 'text-[var(--pro-azure-light)]',  icon: <CheckCircle2 size={15} className="text-[var(--pro-azure-light)]" /> },
          { label: 'Overdue',            value: `ETB ${fmt(stats.overdue)}`,    color: stats.overdue > 0 ? 'text-rose-400' : 'text-slate-400 dark:text-slate-500', icon: <AlertTriangle size={15} className={stats.overdue > 0 ? 'text-rose-400' : 'text-slate-400 dark:text-slate-600'} /> },
          { label: 'Compliance Rate',    value: `${stats.complianceRate.toFixed(1)}%`, color: stats.complianceRate >= 80 ? 'text-[var(--pro-azure-light)]' : 'text-amber-400', icon: <TrendingUp size={15} className="text-[var(--pro-azure-light)]" /> },
        ].map((s) => (
          <div key={s.label} className="bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/60 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">{s.icon}<p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p></div>
            <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Deadline countdown + forecast row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Next deadline */}
        <div className={`rounded-xl p-4 flex items-center gap-4 border ${nextDeadline.daysLeft <= 3 ? 'bg-rose-500/10 border-rose-500/30' : nextDeadline.daysLeft <= 7 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-100/40 dark:bg-slate-800/40 border-slate-700/50'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${nextDeadline.daysLeft <= 3 ? 'bg-rose-500/20' : nextDeadline.daysLeft <= 7 ? 'bg-amber-500/20' : 'bg-slate-200/60 dark:bg-slate-700/60'}`}>
            <CalendarClock size={20} className={nextDeadline.daysLeft <= 3 ? 'text-rose-400' : nextDeadline.daysLeft <= 7 ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Next Remittance Deadline</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{nextDeadline.period} — due {nextDeadline.deadline.toLocaleDateString()}</p>
            <p className={`text-xs font-bold mt-0.5 ${nextDeadline.daysLeft <= 3 ? 'text-rose-400' : nextDeadline.daysLeft <= 7 ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400'}`}>
              {nextDeadline.daysLeft <= 0 ? 'Overdue!' : `${nextDeadline.daysLeft} day${nextDeadline.daysLeft !== 1 ? 's' : ''} remaining`}
            </p>
          </div>
          {stats.collected > 0 && (
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">To Remit</p>
              <p className="text-base font-semibold text-orange-400">ETB {fmt(stats.collected)}</p>
            </div>
          )}
        </div>

        {/* Forecast */}
        <div className="bg-slate-100/40 dark:bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--pro-azure-100)] dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="text-[var(--pro-azure-light)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Forecast — Next Period</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })()}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Based on 3-month trailing average</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Est. Levy</p>
            <p className="text-base font-semibold text-[var(--pro-azure-light)]">ETB {fmt(forecastLevy)}</p>
          </div>
        </div>
      </div>

      {/* Overdue / pending alert */}
      {pendingPeriods.length > 0 && (
        <div className={`border rounded-xl p-4 ${pendingPeriods.some((p) => p.overdue) ? 'bg-rose-500/10 border-rose-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className={pendingPeriods.some((p) => p.overdue) ? 'text-rose-400' : 'text-amber-400'} />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Periods Awaiting Remittance</p>
            {pendingPeriods.some((p) => p.overdue) && (
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-medium uppercase">Overdue</span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {pendingPeriods.map((p) => (
              <div key={p.period} className={`rounded-xl p-3 flex items-center justify-between border ${p.overdue ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-500/20' : 'bg-slate-800/60 border-slate-700/40'}`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.period}</p>
                    {p.overdue && <span className="text-[10px] font-medium text-rose-400 uppercase">Overdue</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400">{p.count} transactions</p>
                  {p.overdue && <p className="text-[10px] text-rose-400 mt-0.5">Penalty: ETB {fmt(calcPenalty(p.amount, p.period))}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-orange-400">ETB {fmt(p.amount)}</p>
                  <button onClick={() => setRemitPeriod(p.period)} className="flex items-center gap-1 text-[10px] font-semibold text-[var(--pro-azure-light)] hover:text-green-300 mt-0.5 transition-colors">
                    <Send size={10} /> Remit Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100/40 dark:bg-slate-100/40 dark:bg-slate-800/40 p-1 rounded-xl w-fit border border-slate-700/50">
        {([
          { key: 'collections', label: `Collections (${entries.length})`, icon: <Banknote size={12} /> },
          { key: 'analytics',   label: 'Analytics',                       icon: <BarChart3 size={12} /> },
          { key: 'remittances', label: `Remittances (${remittances.length})`, icon: <Send size={12} /> },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.key ? (t.key === 'collections' ? 'bg-rose-600 text-slate-900 dark:text-white' : t.key === 'analytics' ? 'bg-[var(--pro-azure-50)]0 text-slate-900 dark:text-white' : 'bg-[var(--pro-azure-50)]0 text-slate-900 dark:text-white') : 'text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* -- Collections tab -- */}
      {tab === 'collections' && (
        <div className="bg-slate-100/40 dark:bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/60 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, category..."
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-400 dark:text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50" />
            </div>
            <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400 dark:text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500/50">
              <option value="">All Periods</option>
              {periods.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as LevyStatus | '')}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400 dark:text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500/50">
              <option value="">All Statuses</option>
              <option value="COLLECTED">Pending Remittance</option>
              <option value="OVERDUE">Overdue</option>
              <option value="REMITTED">Remitted</option>
            </select>
            {filterPeriod && (
              <button onClick={() => printReport(filterPeriod)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-slate-400 dark:text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <Printer size={12} /> Print
              </button>
            )}
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="px-4 py-2.5 bg-rose-600/10 border-b border-rose-500/20 flex items-center gap-3">
              <span className="text-xs font-bold text-rose-300">{selected.size} selected</span>
              <button onClick={handleBulkRemit} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure-100)] text-[var(--pro-azure-light)] rounded-lg text-xs font-bold hover:bg-[var(--pro-azure-100)] transition-colors">
                <CheckCircle2 size={12} /> Mark Remitted
              </button>
              <button onClick={() => { [...selected].forEach(handleDelete); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-500/20 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
              <button onClick={() => setSelected(new Set())} className="ml-auto text-slate-400 dark:text-slate-500 hover:text-slate-400 dark:text-slate-600 dark:text-slate-300 transition-colors"><X size={14} /></button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/60">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" checked={filtered.length > 0 && filtered.every((e) => selected.has(e.id))} onChange={toggleAll}
                      className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-rose-500 focus:ring-rose-500/30" />
                  </th>
                  {([
                    { label: 'Date',           col: 'transactionDate' as keyof LevyEntry },
                    { label: 'Customer',       col: 'customerName'    as keyof LevyEntry },
                    { label: 'Category',       col: 'category'        as keyof LevyEntry },
                    { label: 'Sale Amount',    col: 'saleAmount'      as keyof LevyEntry },
                    { label: 'Levy Collected', col: 'levyAmount'      as keyof LevyEntry },
                    { label: 'Period',         col: 'period'          as keyof LevyEntry },
                    { label: 'Status',         col: 'status'          as keyof LevyEntry },
                  ]).map(({ label, col }) => (
                    <th key={col} onClick={() => handleSort(col)}
                      className="px-3 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-slate-400 dark:text-slate-600 dark:text-slate-300 select-none transition-colors">
                      <span className="flex items-center gap-1">
                        {label}
                        {sortCol === col
                          ? sortDir === 'asc' ? <ChevronUp size={10} className="text-rose-400" /> : <ChevronDown size={10} className="text-rose-400" />
                          : <ChevronDown size={10} className="opacity-20" />}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/40">
                {sortedFiltered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-xs">No levy entries found.</td></tr>
                ) : sortedFiltered.map((e) => (
                  <tr key={e.id} className={`hover:bg-slate-100 dark:hover:bg-slate-700/20 transition-colors ${selected.has(e.id) ? 'bg-rose-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)}
                        className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-rose-500 focus:ring-rose-500/30" />
                    </td>
                    <td className="px-3 py-3 text-slate-400 dark:text-slate-500 dark:text-slate-400 whitespace-nowrap">{e.transactionDate}</td>
                    <td className="px-3 py-3 font-bold text-slate-700 dark:text-slate-200">{e.customerName}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: LEVY_RULES[e.category].color }} />
                        <span className="text-slate-400 dark:text-slate-600 dark:text-slate-300">{LEVY_RULES[e.category].label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-400 dark:text-slate-600 dark:text-slate-300 text-right font-mono">ETB {fmt(e.saleAmount)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-orange-400 font-mono">ETB {fmt(e.levyAmount)}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => setDrawerPeriod(e.period)}
                        className="text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-rose-300 font-mono flex items-center gap-1 transition-colors group">
                        {e.period}
                        <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border w-fit ${STATUS_CLS[e.status]}`}>
                          {e.status === 'COLLECTED' ? 'Pending' : e.status}
                        </span>
                        {e.status === 'OVERDUE' && (
                          <span className="text-[9px] text-rose-400 font-bold">+ETB {fmt(calcPenalty(e.levyAmount, e.period))}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => printReceipt(e)} title="Print receipt"
                          className="text-slate-400 dark:text-slate-600 hover:text-[var(--pro-azure-light)] transition-colors"><Receipt size={13} /></button>
                        <button onClick={() => setEditEntry(e)} title="Edit"
                          className="text-slate-400 dark:text-slate-600 hover:text-amber-400 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(e.id)} title="Delete"
                          className="text-slate-400 dark:text-slate-600 hover:text-rose-400 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {sortedFiltered.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-200 dark:border-slate-800/60 bg-slate-100/40 dark:bg-slate-800/40">
                    <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400">{sortedFiltered.length} entries</td>
                    <td className="px-3 py-3 text-right font-semibold text-orange-400 font-mono">
                      ETB {fmt(sortedFiltered.reduce((s, e) => s + e.levyAmount, 0))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* -- Analytics tab -- */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          <div className="ovds-grid-layout cols-3">
            {/* Compliance rings */}
            <div className="bg-slate-100/40 dark:bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={15} className="text-[var(--pro-azure-light)]" />
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 dark:text-slate-300 uppercase tracking-wider">Compliance Overview</p>
              </div>
              <div className="flex justify-around">
                <ComplianceRing rate={stats.complianceRate} label="Remittance Rate" />
                <ComplianceRing rate={stats.onTimeRate} label="On-Time Rate" />
              </div>
              {stats.totalPenalty > 0 && (
                <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={13} className="text-rose-400 shrink-0" />
                  <p className="text-[11px] text-rose-300">Total penalties incurred: <span className="font-semibold">ETB {fmt(stats.totalPenalty)}</span></p>
                </div>
              )}
            </div>

            {/* Category breakdown */}
            <div className="bg-slate-100/40 dark:bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={15} className="text-purple-400" />
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 dark:text-slate-300 uppercase tracking-wider">By Category</p>
              </div>
              <CategoryDonut data={catData} />
            </div>

            {/* Quick stats */}
            <div className="bg-slate-100/40 dark:bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={15} className="text-amber-400" />
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 dark:text-slate-300 uppercase tracking-wider">Quick Stats</p>
              </div>
              {[
                { label: 'Total transactions', value: entries.length.toString() },
                { label: 'Periods tracked', value: periods.length.toString() },
                { label: 'Remittances filed', value: remittances.length.toString() },
                { label: 'Avg levy per transaction', value: entries.length ? `ETB ${fmt(stats.totalAll / entries.length)}` : '—' },
                { label: 'Highest single levy', value: entries.length ? `ETB ${fmt(Math.max(...entries.map((e) => e.levyAmount)))}` : '—' },
                { label: 'Pending periods', value: pendingPeriods.length.toString() },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-slate-200/40 dark:border-slate-700/40 last:border-0">
                  <span className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">{s.label}</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly trend */}
          <div className="bg-slate-100/40 dark:bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-[var(--pro-azure-light)]" />
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 dark:text-slate-300 uppercase tracking-wider">Monthly Levy Trend</p>
              <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-600 inline-block" /> Collected</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[var(--pro-azure-50)]0/60 inline-block" /> Remitted</span>
              </div>
            </div>
            <TrendBars data={trendData} />
          </div>

          {/* Category table */}
          <div className="bg-slate-100/40 dark:bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/60">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 dark:text-slate-300 uppercase tracking-wider">Category Breakdown</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/60">
                  {['Category', 'Rate', 'Transactions', 'Total Levy', 'Share'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/40">
                {catData.map(({ cat, levy }) => {
                  const rule = LEVY_RULES[cat];
                  const count = entries.filter((e) => e.category === cat).length;
                  const share = stats.totalAll > 0 ? (levy / stats.totalAll) * 100 : 0;
                  return (
                    <tr key={cat} className="hover:bg-slate-100 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: rule.color }} />
                          <span className="font-bold text-slate-700 dark:text-slate-200">{rule.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: rule.color + '22', color: rule.color }}>
                          {rule.isFlat ? `ETB ${rule.flatAmount} flat` : `${(rule.rate * 100).toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 dark:text-slate-400">{count}</td>
                      <td className="px-4 py-3 font-semibold text-orange-400 font-mono">ETB {fmt(levy)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${share}%`, background: rule.color }} />
                          </div>
                          <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400 w-10 text-right">{share.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -- Remittances tab -- */}
      {tab === 'remittances' && (
        <div className="bg-slate-100/40 dark:bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 dark:text-slate-300 uppercase tracking-wider">Monthly Remittance History</p>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
              <Info size={12} />
              <span>Deadline: 10th of following month · Late penalty: 5%/month</span>
            </div>
          </div>
          {remittances.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">No remittances recorded yet.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/60">
                  {['Period', 'Remitted At', 'Bank', 'Reference No.', 'Total Levy', 'Penalty', 'On Time', 'Remitted By'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/40">
                {remittances.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-100 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.period}</td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500 dark:text-slate-400">{r.remittedAt}</td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-600 dark:text-slate-300">{r.bankName}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 dark:text-slate-600 dark:text-slate-300">{r.referenceNo}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--pro-azure-light)] font-mono">ETB {fmt(r.totalLevy)}</td>
                    <td className="px-4 py-3">
                      {r.penaltyAmount > 0
                        ? <span className="text-rose-400 font-semibold">ETB {fmt(r.penaltyAmount)}</span>
                        : <span className="text-slate-400 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.onTime
                        ? <span className="flex items-center gap-1 text-[var(--pro-azure-light)] font-semibold"><CheckCircle2 size={12} /> Yes</span>
                        : <span className="flex items-center gap-1 text-rose-400 font-semibold"><AlertTriangle size={12} /> Late</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500 dark:text-slate-400">{r.remittedBy}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-slate-800/60 bg-slate-100/40 dark:bg-slate-800/40">
                  <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400">{remittances.length} remittances</td>
                  <td className="px-4 py-3 font-semibold text-[var(--pro-azure-light)] font-mono">ETB {fmt(remittances.reduce((s, r) => s + r.totalLevy, 0))}</td>
                  <td className="px-4 py-3 font-semibold text-rose-400 font-mono">
                    {remittances.some((r) => r.penaltyAmount > 0) ? `ETB ${fmt(remittances.reduce((s, r) => s + r.penaltyAmount, 0))}` : '—'}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      {showAdd && <AddLevyModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {showSync && <SyncModal onClose={() => setShowSync(false)} onSynced={handleSynced} />}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {editEntry && <EditLevyModal entry={editEntry} onClose={() => setEditEntry(null)} onSave={handleEdit} />}
      {drawerPeriod && (
        <PeriodDrawer
          period={drawerPeriod}
          entries={entriesWithOverdue.filter((e) => e.period === drawerPeriod)}
          remittance={remittances.find((r) => r.period === drawerPeriod)}
          onClose={() => setDrawerPeriod(null)}
          onRemit={() => { setRemitPeriod(drawerPeriod); setDrawerPeriod(null); }}
        />
      )}
      {remitPeriod && (
        <RemittanceModal
          period={remitPeriod}
          totalLevy={stats.byPeriod[remitPeriod]?.levy - (stats.byPeriod[remitPeriod]?.remitted ?? 0)}
          onClose={() => setRemitPeriod(null)}
          onConfirm={handleConfirmRemittance}
        />
      )}
    </div>
  );
};

export default LevyCollectionPanel;









