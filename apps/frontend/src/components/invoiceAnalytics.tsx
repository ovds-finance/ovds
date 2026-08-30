/* eslint-disable */
import React, { useMemo, useState } from 'react';
import {
  TrendingUp, Award, ShieldCheck, AlertCircle, Clock3, BarChart2,
  ChevronDown, ChevronUp, DollarSign,
} from 'lucide-react';
import { ContextualInsight } from '@ovds/ui';
import type { Invoice } from '../types/api';

interface Props {
  stats: any;
  invoices: Invoice[];
  statusCounts: Record<string, number>;
  monthlyData: any[];
  aging: any[];
  ifrsAnalytics: any;
  arHealthScore: any | null;
  topCustomers: any[];
  invoiceGaps: number[];
  collectionRate: number;
  overdueCount: number;
  dso?: number | null;
  currency: string;
  settings: any;
  maxMonthly: number;
  showAnalytics?: boolean;
}

// -- Tiny sparkline (pure SVG) -------------------------------------------------
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 32 }) => {
  if (!data.length || data.every(v => v === 0)) return null;
  const max = Math.max(...data, 1);
  const w = 80;
  const h = height;
  const pts = data.map((v, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * w : w / 2;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// -- Status donut --------------------------------------------------------------
const StatusDonut: React.FC<{ counts: Record<string, number>; total: number }> = ({ counts, total }) => {
  const segs = [
    { key: 'PAID',    color: '#00E784', label: 'Paid' },
    { key: 'PENDING', color: '#f59e0b', label: 'Pending' },
    { key: 'OVERDUE', color: '#ef4444', label: 'Overdue' },
    { key: 'DRAFT',   color: '#94a3b8', label: 'Draft' },
  ];
  const r = 14;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const arcs = segs.map(s => {
    const pct = total > 0 ? (counts[s.key] ?? 0) / total : 0;
    const dash = pct * circ;
    const a = { ...s, dash, gap: circ - dash, off, pct };
    off += dash;
    return a;
  });
  return (
    <div className="flex items-center gap-5">
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <circle cx="18" cy="18" r={r} fill="none" stroke="#f1f5f9" strokeWidth="4" className="dark:stroke-slate-700" />
          {arcs.map(a => a.pct > 0 && (
            <circle key={a.key} cx="18" cy="18" r={r} fill="none"
              stroke={a.color} strokeWidth="4"
              strokeDasharray={`${a.dash} ${a.gap}`}
              strokeDashoffset={-a.off}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-none">{total}</span>
          <span className="text-[8px] text-slate-400 font-bold">total</span>
        </div>
      </div>
      <div className="space-y-1.5 flex-1">
        {arcs.map(a => (
          <div key={a.key} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color }} />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex-1">{a.label}</span>
            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{counts[a.key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// -- Main component ------------------------------------------------------------
export const InvoiceAnalytics: React.FC<Props> = React.memo(({
  invoices, statusCounts, monthlyData, aging, ifrsAnalytics,
  arHealthScore, topCustomers, invoiceGaps, collectionRate,
  overdueCount, dso, currency, maxMonthly, showAnalytics = true,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const fmt  = (n: number) => Intl.NumberFormat('en-ET', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  const fmtF = (n: number) => Intl.NumberFormat('en-ET', { style: 'currency', currency }).format(n);

  const totalInvoices  = useMemo(() => Object.values(statusCounts).reduce((s, v) => s + v, 0), [statusCounts]);
  const totalBilled    = useMemo(() => invoices.reduce((s, i) => s + Number(i.totalAmount), 0), [invoices]);
  const totalCollected = useMemo(() => invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.totalAmount), 0), [invoices]);
  const totalOverdue   = useMemo(() => invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + Number(i.totalAmount), 0), [invoices]);
  const totalVat       = useMemo(() => invoices.reduce((s, i) => s + Number(i.vatAmount || 0), 0), [invoices]);
  const avgInvoice     = useMemo(() => totalInvoices > 0 ? totalBilled / totalInvoices : 0, [totalBilled, totalInvoices]);

  const momTrend = useMemo(() => {
    if (monthlyData.length < 2) return null;
    const cur  = monthlyData[monthlyData.length - 1]?.invoiced ?? 0;
    const prev = monthlyData[monthlyData.length - 2]?.invoiced ?? 0;
    if (!prev) return null;
    return Math.round(((cur - prev) / prev) * 100);
  }, [monthlyData]);

  const revenueSparkline   = useMemo(() => monthlyData.map((m: any) => m.invoiced), [monthlyData]);
  const collectedSparkline = useMemo(() => monthlyData.map((m: any) => m.collected), [monthlyData]);

  if (!showAnalytics) return null;

  return (
    <div className="space-y-6">

      {/* -- High-Fidelity Performance Strip ------------------------------- */}
      <div className="ovds-grid-layout cols-4 gap-sm">
        {/* Total Billed */}
        <div className="group dash-stat-cell relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <DollarSign size={48} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Receivables</p>
          <div className="flex items-baseline gap-2">
            <h3 className="ovds-value text-slate-800 dark:text-white">{fmt(totalBilled)}</h3>
            {momTrend !== null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                momTrend >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
              }`}>
                {momTrend > 0 ? '+' : ''}{momTrend}%
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="ovds-caption">Monthly Trend</span>
              <div className="h-6 mt-1">
                <Sparkline data={revenueSparkline} color="#00E784" height={24} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{totalInvoices}</p>
              <p className="ovds-caption uppercase">Documents</p>
            </div>
          </div>
        </div>

        {/* Collection Performance */}
        <div className="group dash-stat-cell relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <TrendingUp size={48} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Collection Rate</p>
          <div className="flex items-baseline gap-2">
            <h3 className="ovds-value text-emerald-600 dark:text-emerald-400">{collectionRate}%</h3>
            <span className="ovds-caption font-bold">{fmt(totalCollected)}</span>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Efficiency</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{collectionRate}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Overdue Exposure */}
        <div className="group dash-stat-cell relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <AlertCircle size={48} className="text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">At-Risk Capital</p>
          <div className="flex items-baseline gap-2">
            <h3 className={`ovds-value ${totalOverdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
              {fmt(totalOverdue)}
            </h3>
            {overdueCount > 0 && (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded-md">
                {overdueCount} Late
              </span>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[...Array(Math.min(overdueCount, 4))].map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                    <AlertCircle size={8} className="text-rose-600 dark:text-rose-400" />
                  </div>
                ))}
              </div>
              <span className="ovds-caption">Critical attention required</span>
            </div>
          </div>
        </div>

        {/* DSO / Velocity */}
        <div className="group dash-stat-cell relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <Clock3 size={48} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Payment Velocity</p>
          <div className="flex items-baseline gap-2">
            <h3 className="ovds-value" style={{ color: 'var(--aki-blue)' }}>
              {dso != null ? `${dso} Days` : '—'}
            </h3>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Financial Health</span>
              <span className={`text-[10px] font-bold ${arHealthScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {arHealthScore >= 80 ? 'Excellent' : 'Stable'}
              </span>
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${
                  i < (arHealthScore / 20) ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'
                }`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* -- Collapsible detail section ---------------------------------------- */}
      <div className="ovds-widget-card overflow-hidden">
        <button
          onClick={() => setCollapsed(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <BarChart2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left">
              <span className="block ovds-card-title">Deep Insights</span>
              <span className="block ovds-caption mt-0.5">
                Customer concentration · Tax liability · Receivables aging · Compliance
              </span>
            </div>
          </div>
          <div className={`p-1.5 rounded-full transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'} bg-slate-100 dark:bg-slate-800 text-slate-500`}>
            <ChevronDown size={14} />
          </div>
        </button>

        {!collapsed && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Status donut + AR health */}
              <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">Portfolio Distribution</p>
                <StatusDonut counts={statusCounts} total={totalInvoices} />
                {arHealthScore !== null && (
                  <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-4">
                    <div className="relative w-14 h-14 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-700" />
                        <circle cx="18" cy="18" r="14" fill="none"
                          stroke={arHealthScore >= 85 ? '#00E784' : arHealthScore >= 70 ? '#00E784' : arHealthScore >= 55 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="3"
                          strokeDasharray={`${arHealthScore * 0.879} 100`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{arHealthScore}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Score</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Credit Quality</p>
                      <p className={`text-sm font-bold ${
                        arHealthScore >= 85 ? 'text-emerald-600' :
                        arHealthScore >= 70 ? 'text-emerald-600' :
                        arHealthScore >= 55 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        Class {arHealthScore >= 85 ? 'Premium (A+)' : arHealthScore >= 70 ? 'Standard (B)' : arHealthScore >= 55 ? 'Watch (C)' : 'Sub-prime (F)'}
                      </p>
                      <p className="ovds-caption mt-1">Based on {totalInvoices} active accounts</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Top customers */}
              <div className="ovds-widget-card p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Top Customers</p>
                  <Award size={14} className="text-amber-500" />
                </div>
                {topCustomers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No customer data yet</p>
                ) : (
                  <div className="space-y-3">
                    {topCustomers.map((c: any, i: number) => {
                      const pct = topCustomers[0].revenue > 0 ? Math.round((c.revenue / topCustomers[0].revenue) * 100) : 0;
                      return (
                        <div key={c.name} className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
                            i === 0 ? 'bg-amber-100 text-amber-600' :
                            i === 1 ? 'bg-slate-100 text-slate-500' :
                            'bg-orange-50 text-orange-500'
                          }`}>{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{c.name}</span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-white ml-2 shrink-0 tabular-nums">
                                {fmtF(c.revenue)}
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                            c.payRate >= 80 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            c.payRate >= 50 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                          }`}>{c.payRate}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Monthly trend */}
              <div className="ovds-widget-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">6-Month Trend</p>
                  <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-100 dark:bg-emerald-900/40 inline-block" />Billed</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />Collected</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {monthlyData.map((m: any) => {
                    const collPct = m.invoiced > 0 ? Math.round((m.collected / m.invoiced) * 100) : 0;
                    return (
                      <div key={m.label} className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-8 shrink-0">{m.label}</span>
                        <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative"
                          title={`Billed: ${fmtF(m.invoiced)} · Collected: ${fmtF(m.collected)}`}>
                          <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg" style={{ width: `${maxMonthly > 0 ? (m.invoiced / maxMonthly) * 100 : 0}%` }} />
                          <div className="absolute inset-0 bg-emerald-500 rounded-lg" style={{ width: `${maxMonthly > 0 ? (m.collected / maxMonthly) * 100 : 0}%` }} />
                          {m.count > 0 && (
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-semibold text-white/80">{m.count}</span>
                          )}
                        </div>
                        <div className="text-right w-20 shrink-0">
                          <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{fmt(m.invoiced)}</p>
                          {collPct > 0 && <p className="text-[9px] text-emerald-600 font-bold">{collPct}%</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">6-month total</span>
                  <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{fmt(monthlyData.reduce((s: number, m: any) => s + m.invoiced, 0))}</span>
                </div>
              </div>

              {/* AR Aging */}
              <div className="ovds-widget-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock3 size={14} className="text-amber-500" />
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">AR Aging</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                    {fmt(aging.reduce((s: number, b: any) => s + b.amount, 0))} unpaid
                  </span>
                </div>
                <div className="space-y-2">
                  {aging.map((b: any) => (
                    <div key={b.label} className={`${b.bg} dark:bg-opacity-10 rounded-xl p-3`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-semibold ${b.textColor}`}>{b.label}</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{b.count}</span>
                      </div>
                      <p className={`text-sm font-semibold ${b.textColor} tabular-nums`}>{fmtF(b.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* VAT + DRRF */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-violet-100 dark:border-violet-900/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck size={14} className="text-violet-600" />
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">VAT & DRRF</p>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full ml-auto">
                    Proc. 1341/2024
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      label: 'VAT Collected',
                      value: invoices.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + Number(i.vatAmount || 0), 0),
                      color: 'text-emerald-600', sub: 'Remit to ERCA',
                    },
                    {
                      label: 'VAT Pending',
                      value: invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'DRAFT').reduce((s: number, i: any) => s + Number(i.vatAmount || 0), 0),
                      color: 'text-amber-600', sub: 'Awaiting payment',
                    },
                    {
                      label: 'DRRF (1%)',
                      value: invoices.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + (Number(i.subtotal || Number(i.totalAmount) - Number(i.vatAmount || 0)) * 0.01), 0),
                      color: 'text-orange-600', sub: 'Remit to EDRRFO',
                    },
                  ].map(v => (
                    <div key={v.label} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                      <div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{v.label}</p>
                        <p className="ovds-caption">{v.sub}</p>
                      </div>
                      <p className={`text-sm font-semibold tabular-nums ${v.color}`}>{fmtF(v.value)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-violet-600 dark:text-violet-400 font-bold">
                  <AlertCircle size={10} />
                  File VAT by 30th · ETB 500/day late penalty
                </div>
              </div>

              {/* IFRS 9/15 Exposure */}
              {ifrsAnalytics && (ifrsAnalytics.withIfrs > 0 || ifrsAnalytics.eclExposure > 0) && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/40 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">IFRS 9 / 15 Exposure</p>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full ml-auto">
                      Live
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {/* ECL staging */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Stage 3 (Impaired)</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">{ifrsAnalytics.stage3}</span>
                        <span className="text-[10px] text-slate-400 ml-1">invoices</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Stage 2 (SICR)</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{ifrsAnalytics.stage2}</span>
                        <span className="text-[10px] text-slate-400 ml-1">invoices</span>
                      </div>
                    </div>
                    {ifrsAnalytics.eclExposure > 0 && (
                      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">ECL Provision</p>
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">{fmtF(ifrsAnalytics.eclExposure)}</p>
                      </div>
                    )}
                    {ifrsAnalytics.warrantyProvision > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Warranty Provision</p>
                        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 tabular-nums">{fmtF(ifrsAnalytics.warrantyProvision)}</p>
                      </div>
                    )}
                    {ifrsAnalytics.nonCurrent > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Non-current Receivables</p>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">{ifrsAnalytics.nonCurrent}</span>
                      </div>
                    )}
                    {ifrsAnalytics.contractRefs > 0 && (
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                        <AlertCircle size={10} />
                        {ifrsAnalytics.contractRefs} IFRS 15 contract{ifrsAnalytics.contractRefs !== 1 ? 's' : ''} with performance obligations
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contextual insights */}
              {(collectionRate < 70 || overdueCount > 3 || (dso != null && dso > 45) || (collectionRate >= 85 && overdueCount === 0)) && (
                <div className="lg:col-span-3 space-y-2">
                  {collectionRate < 70 && (
                    <ContextualInsight variant="warning"
                      text={`Collection rate is ${collectionRate}% — follow up on pending invoices to improve cash flow.`} />
                  )}
                  {overdueCount > 3 && (
                    <ContextualInsight variant="warning"
                      text={`${overdueCount} invoices are overdue. Send reminders or escalate to collections.`} />
                  )}
                  {dso != null && dso > 45 && (
                    <ContextualInsight variant="info"
                      text={`DSO is ${dso} days — above the 45-day benchmark. Consider tightening payment terms.`} />
                  )}
                  {collectionRate >= 85 && overdueCount === 0 && (
                    <ContextualInsight variant="positive"
                      text={`AR health is strong — ${collectionRate}% collection rate with no overdue invoices.`} />
                  )}
                  {/* Customer concentration risk */}
                  {topCustomers.length > 0 && (() => {
                    const top1Pct = totalBilled > 0 ? Math.round((topCustomers[0].revenue / totalBilled) * 100) : 0;
                    const top3Total = topCustomers.slice(0, 3).reduce((s: number, c: any) => s + c.revenue, 0);
                    const top3Pct   = totalBilled > 0 ? Math.round((top3Total / totalBilled) * 100) : 0;
                    if (top1Pct >= 50) return (
                      <ContextualInsight variant="warning"
                        text={`Customer concentration risk: ${topCustomers[0].name} represents ${top1Pct}% of total revenue. Diversify to reduce exposure.`} />
                    );
                    if (top3Pct >= 80) return (
                      <ContextualInsight variant="info"
                        text={`Top 3 customers account for ${top3Pct}% of revenue. Consider diversifying your client base.`} />
                    );
                    return null;
                  })()}
                </div>
              )}

              {/* Invoice sequence gaps */}
              {invoiceGaps && invoiceGaps.length > 0 && (
                <div className="lg:col-span-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Invoice Sequence Gaps — {invoiceGaps.length} missing number{invoiceGaps.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                        Missing: #{invoiceGaps.slice(0, 8).join(', #')}{invoiceGaps.length > 8 ? ` +${invoiceGaps.length - 8} more` : ''}
                      </p>
                      <p className="text-[10px] text-amber-500 mt-1">
                        ERCA requires sequential numbering. Document any gaps for audit compliance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
});

InvoiceAnalytics.displayName = 'InvoiceAnalytics';








