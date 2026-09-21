import {
  HeartHandshake, CheckCircle2, TrendingUp, Zap,
  ShieldCheck, BarChart3, Receipt, X, ArrowRight,
  AlertTriangle, ChevronRight, Globe,
} from 'lucide-react';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useLocalStorage } from '../../hooks';
import api from '../../services/api';

const FEATURES = [
  { icon: <Zap size={10} className="text-amber-500" />, label: 'Automate Processes', color: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/25 dark:text-amber-200' },
  { icon: <ShieldCheck size={10} className="text-[var(--pro-azure)]" />, label: 'ERCA Compliance', color: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-[var(--pro-azure-50)]0/15 dark:border-[var(--pro-azure)]/25 dark:text-green-200' },
  { icon: <Receipt size={10} className="text-[var(--pro-azure)]" />, label: 'Documented Sales', color: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/20 dark:border-[var(--pro-azure-100)] dark:text-green-200' },
  { icon: <BarChart3 size={10} className="text-violet-600" />, label: 'Financial Transparency', color: 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-500/15 dark:border-violet-500/25 dark:text-violet-200' },
  { icon: <CheckCircle2 size={10} className="text-rose-600" />, label: 'Tax-Ready Records', color: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/25 dark:text-rose-200' },
  { icon: <TrendingUp size={10} className="text-cyan-600" />, label: 'Growth Tracking', color: 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-500/15 dark:border-cyan-500/25 dark:text-cyan-200' },
];

// ERCA compliance checklist items
const ERCA_CHECKS = [
  { id: 'qr', label: 'ERCA QR on invoices', done: true },
  { id: 'etax', label: 'e-Tax portal active', done: true },
  { id: 'vat_filing', label: 'Monthly VAT filing', done: true },
  { id: 'reverse_charge', label: 'Reverse-charge configured', done: false },
  { id: 'annual_recon', label: 'Annual reconciliation scheduled', done: false },
];

// Days until next VAT deadline (30th of next month)
function daysUntilVatDeadline(): number {
  const now = new Date();
  const deadline = new Date(now.getFullYear(), now.getMonth() + 1, 30);
  return Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 86400000));
}

const GrowthInsightsBanner: React.FC = () => {
  const [dismissed, setDismissed] = useLocalStorage<boolean>('growth_banner_dismissed', false);
  const [expanded, setExpanded] = useLocalStorage<boolean>('growth_banner_expanded', false);

  useEffect(() => {
    Promise.allSettled([
      api.get('/vat/summary', { headers: { 'x-background': '1' } } as any),
      api.get('/tax/compliance-status', { headers: { 'x-background': '1' } } as any),
    ]).then(([, compRes]) => {
      if (compRes.status === 'fulfilled') {
        const items = compRes.value.data?.data ?? compRes.value.data;
        if (Array.isArray(items) && items.length > 0) {
          // merge with static checks
        }
      }
    });
  }, []);

  if (dismissed) return null;

  const daysLeft = daysUntilVatDeadline();
  const vatUrgent = daysLeft <= 5;
  const ercaScore = Math.round((ERCA_CHECKS.filter(c => c.done).length / ERCA_CHECKS.length) * 100);

  return (
    <div className="relative bg-white dark:bg-gradient-to-br dark:from-green-950 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/15 overflow-hidden group">
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 z-20 p-1.5 rounded-lg text-slate-400 dark:text-white/25 hover:text-slate-600 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/8 transition-all"
        aria-label="Dismiss banner"
      >
        <X size={13} />
      </button>

      {/* Decorative */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none select-none text-[var(--pro-azure)] dark:text-white">
        <HeartHandshake size={130} />
      </div>
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[var(--pro-azure-light)]/10 dark:bg-[var(--pro-azure-50)]0/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-[var(--pro-azure-200)]/40 dark:from-[var(--pro-azure)]/8 to-transparent pointer-events-none hidden md:block" />

      {/* Main content */}
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            {/* Label row */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="px-2.5 py-1 bg-[var(--pro-azure-50)]0/15 border border-[var(--pro-azure)]/25 rounded-lg text-[10px] font-medium uppercase tracking-wider text-green-300">
                Ethiopian Business ovds
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Growth Insights</span>
              <span className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure)]/15 rounded-full">
                <span className="w-1.5 h-1.5 bg-[var(--pro-azure-light)] rounded-full animate-pulse" />
                <span className="text-[10px] font-medium text-[var(--pro-azure-light)] uppercase tracking-wider">Live</span>
              </span>
            </div>

            <h3 className="text-lg font-semibold mb-2.5 leading-snug text-slate-800 dark:text-white">
              Hands-on features that support your business growth and continuity.
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
              Automate processes, manage multiple clients, and eliminate manual work.
              Maintain clean records, know your tax days, and never miss them.
            </p>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-2 mt-5">
              {FEATURES.map(f => (
                <div key={f.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${f.color}`}>
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2.5 shrink-0 min-w-[160px]">
            <Link
              to="/reports/insights"
              className="flex items-center justify-between gap-3 px-5 py-3 bg-white text-slate-900 rounded-xl font-semibold text-xs hover:bg-[var(--pro-azure-50)] transition-all shadow-xl shadow-green-500/10 active:scale-95 group/btn"
            >
              Explore Insights
              <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/reports"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--pro-azure-50)] dark:bg-white/8 border border-[var(--pro-azure-100)] dark:border-white/10 hover:bg-[var(--pro-azure-100)] dark:hover:bg-white/15 text-[var(--pro-azure-dark)] dark:text-white rounded-xl font-bold text-xs transition-all active:scale-95"
            >
              <BarChart3 size={12} /> View Reports
            </Link>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/8 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/60 rounded-xl font-bold text-xs transition-all"
            >
              {expanded ? 'Less' : 'ERCA Status'}
              <ChevronRight size={11} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded ERCA compliance panel */}
        {expanded && (
          <div className="mt-6 pt-6 border-t border-[var(--pro-azure-100)] dark:border-white/8 ovds-grid-layout cols-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* ERCA score */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
                <p className="text-xs font-semibold text-slate-800 dark:text-white">ERCA Compliance</p>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className={`text-3xl font-semibold ${ercaScore >= 80 ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : ercaScore >= 60 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {ercaScore}%
                </span>
                <span className="text-xs text-slate-400 mb-1">compliance score</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${ercaScore >= 80 ? 'bg-[var(--pro-azure-50)]0' : ercaScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
                  style={{ width: `${ercaScore}%` }}
                />
              </div>
              <div className="space-y-1.5">
                {ERCA_CHECKS.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    {c.done
                      ? <CheckCircle2 size={11} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0" />
                      : <AlertTriangle size={11} className="text-amber-500 dark:text-amber-400 shrink-0" />
                    }
                    <span className={`text-[10px] font-medium ${c.done ? 'text-slate-600 dark:text-slate-300' : 'text-amber-600 dark:text-amber-300'}`}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* VAT deadline */}
            <div className={`border rounded-xl p-4 ${vatUrgent ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/25' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/8'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={14} className={vatUrgent ? 'text-rose-500 dark:text-rose-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'} />
                <p className="text-xs font-semibold text-slate-800 dark:text-white">VAT Deadline</p>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-3xl font-semibold ${vatUrgent ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>{daysLeft}</span>
                <span className="text-xs text-slate-400 mb-1">days remaining</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-3">
                Monthly VAT return due on the 30th per Proclamation No. 1341/2024
              </p>
              {vatUrgent && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 rounded-lg">
                  <AlertTriangle size={10} className="text-rose-500 dark:text-rose-400" />
                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-300">File now to avoid ETB 500/day penalty</span>
                </div>
              )}
              <Link to="/tax/vat" className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-[var(--pro-azure)] dark:text-green-300 hover:text-[var(--pro-azure-dark)] dark:hover:text-white transition-colors">
                Go to VAT Filing <ArrowRight size={9} />
              </Link>
            </div>

            {/* Quick ERCA links */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-800 dark:text-white mb-3">ERCA Quick Links</p>
              <div className="space-y-2">
                {[
                  { label: 'e-Tax Portal', href: 'https://etax.erca.gov.et', desc: 'etax.erca.gov.et' },
                  { label: 'VAT Refund Application', href: 'https://erca.gov.et', desc: 'erca.gov.et' },
                  { label: 'Proclamation 1341/2024', href: 'https://erca.gov.et', desc: 'VAT Reform Reference' },
                  { label: 'Non-Resident Registration', href: 'https://erca.gov.et', desc: 'Foreign digital services' },
                ].map(l => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between group hover:bg-[var(--pro-azure-50)] dark:hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors">
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-[var(--pro-azure-dark)] dark:group-hover:text-white transition-colors">{l.label}</p>
                      <p className="ovds-caption">{l.desc}</p>
                    </div>
                    <ArrowRight size={10} className="text-slate-300 dark:text-slate-600 group-hover:text-[var(--pro-azure)] dark:group-hover:text-slate-300 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowthInsightsBanner;





