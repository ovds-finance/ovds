import {
  ShieldCheck, ArrowRight,
  FileText, BookOpen, Banknote, Shield, Globe, TrendingUp,
  RefreshCw,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useBusiness } from '../../context/businessContext';
import api from '../../services/api';
import { fmtCurrency } from '../../utils/fmt';

interface ComplianceStatus {
  vatFiled: boolean;
  vatDue: number;
  vatPeriod: string;
  drrfPending: number;
  incomeTaxDue: number;
  lastJournalDate: string | null;
  openInvoices: number;
  overdueInvoices: number;
  complianceScore: number;
}

const CHAIN_STEPS = [
  { key: 'item',     label: 'Item',          icon: <FileText size={13} />,    color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',    bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30',    link: '/items' },
  { key: 'invoice',  label: 'Invoice/Bill',  icon: <FileText size={13} />,    color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/30',  link: '/sales/invoices' },
  { key: 'journal',  label: 'Journal Entry', icon: <BookOpen size={13} />,    color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30', link: '/accounting?tab=journal' },
  { key: 'vat',      label: 'VAT 15%',       icon: <ShieldCheck size={13} />, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', link: '/tax/vat' },
  { key: 'drrf',     label: 'DRRF Levy',     icon: <Shield size={13} />,      color: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-50 dark:bg-rose-950/30',      link: '/disaster-fund' },
  { key: 'tax',      label: 'BIT / MAT',     icon: <Banknote size={13} />,    color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', link: '/tax/business-income' },
  { key: 'tot',      label: 'TOT (Cat. B)',  icon: <TrendingUp size={13} />,  color: 'text-sky-600 dark:text-sky-400',      bg: 'bg-sky-50 dark:bg-sky-950/30',      link: '/tax/vat' },
  { key: 'erca',     label: 'ERCA eTax',     icon: <Globe size={13} />,       color: 'text-teal-600 dark:text-teal-400',    bg: 'bg-teal-50 dark:bg-teal-950/30',    link: 'https://etax.erca.gov.et' },
];

const _fmt = (n: number) => fmtCurrency(n, 'ETB'); void _fmt;

const LiveComplianceWidget: React.FC = () => {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { selectedCompanyId } = useBusiness();

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
    try {
      const [vatRes, invoiceRes, taxRes] = await Promise.allSettled([
        api.get(`/vat/summary${cq}`, { headers: { 'x-background': '1' } } as any),
        api.get(`/ovds/invoices?limit=1&status=OVERDUE${selectedCompanyId ? `&companyId=${selectedCompanyId}` : ''}`, { headers: { 'x-background': '1' } } as any),
        api.get('/tax/dashboard', { headers: { 'x-background': '1' } } as any),
      ]);

      const vat = vatRes.status === 'fulfilled' ? (vatRes.value.data?.data ?? vatRes.value.data) : null;
      const inv = invoiceRes.status === 'fulfilled' ? (invoiceRes.value.data?.data ?? invoiceRes.value.data) : null;
      const tax = taxRes.status === 'fulfilled' ? (taxRes.value.data?.data ?? taxRes.value.data) : null;

      setStatus({
        vatFiled: false,
        vatDue: vat?.netPayable ?? tax?.vatCurrent ?? 0,
        vatPeriod: new Date().toISOString().slice(0, 7),
        drrfPending: tax?.drrfCurrent ?? 0,
        incomeTaxDue: tax?.incomeTaxDue ?? 0,
        lastJournalDate: null,
        openInvoices: inv?.total ?? 0,
        overdueInvoices: inv?.total ?? 0,
        complianceScore: tax?.complianceScore ?? 0,
      });
    } catch {
      // Use defaults on error — score 0 until real data loads
      setStatus({
        vatFiled: false, vatDue: 0, vatPeriod: new Date().toISOString().slice(0, 7),
        drrfPending: 0, incomeTaxDue: 0, lastJournalDate: null,
        openInvoices: 0, overdueInvoices: 0, complianceScore: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [selectedCompanyId]);  // eslint-disable-line react-hooks/exhaustive-deps

  const score = status?.complianceScore ?? 85;
  const scoreColor = score >= 90 ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
    : score >= 70 ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400';
  const scoreBg = score >= 90 ? 'bg-[var(--pro-azure-50)]0' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500';

  // Compute days until next VAT deadline (30th of next month)
  const now = new Date();
  const vatDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 30);
  const vatDaysLeft = Math.ceil((vatDeadline.getTime() - now.getTime()) / 86_400_000);
  const vatUrgent = vatDaysLeft <= 3;
  const vatWarning = vatDaysLeft <= 7;

  // DRRF: 15th of last month of each quarter
  const quarterEndMonths = [2, 5, 8, 11];
  const nextDrrfMonth = quarterEndMonths.find(m => m >= now.getMonth()) ?? quarterEndMonths[0];
  const nextDrrfYear = nextDrrfMonth < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
  const drrfDeadline = new Date(nextDrrfYear, nextDrrfMonth, 15);
  const drrfDaysLeft = Math.ceil((drrfDeadline.getTime() - now.getTime()) / 86_400_000);

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-orange-50/50 to-white dark:from-orange-950/10 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-orange-100 dark:bg-orange-950/40 rounded-lg flex items-center justify-center">
            <ShieldCheck size={14} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tax Compliance Chain</p>
            <p className="ovds-caption">Ethiopian 2026 · Proclamation 1341/2024</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${score >= 90 ? 'bg-[var(--pro-azure-50)]0' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`} />
            <span className={`text-sm font-semibold ${scoreColor}`}>{score}%</span>
          </div>
          <button
            onClick={() => load(true)}
            className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Compliance chain */}
      <div className="px-5 py-4">
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 min-w-max">
            {CHAIN_STEPS.map((step, i) => {
              const isExternal = step.link.startsWith('http');
              const el = (
                <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${step.bg} border border-transparent hover:border-current/20 transition-all cursor-pointer min-w-[72px] text-center group`}>
                  <span className={`${step.color} group-hover:scale-110 transition-transform`}>{step.icon}</span>
                  <span className={`text-[10px] font-medium ${step.color}`}>{step.label}</span>
                </div>
              );
              return (
                <React.Fragment key={step.key}>
                  {isExternal
                    ? <a href={step.link} target="_blank" rel="noopener noreferrer">{el}</a>
                    : <Link to={step.link}>{el}</Link>
                  }
                  {i < CHAIN_STEPS.length - 1 && (
                    <ArrowRight size={10} className="text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
            <span>Compliance Score</span>
            <span className={scoreColor}>{score >= 90 ? '✓ Excellent' : score >= 70 ? '⚠ Good' : '✗ Needs Attention'} · {score}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${scoreBg} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>

      {/* Deadline countdown cards */}
      <div className="px-5 pb-4 grid grid-cols-3 gap-2.5">
        {/* VAT countdown */}
        <Link to="/tax/vat"
          className={`group p-3 rounded-xl border transition-all hover:shadow-sm ${
            vatUrgent ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' :
            vatWarning ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' :
            'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800'
          }`}>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">VAT Deadline</p>
          <p className={`text-sm font-semibold mt-0.5 tabular-nums ${vatUrgent ? 'text-rose-600 dark:text-rose-400' : vatWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
            {vatDaysLeft}d left
          </p>
          <p className="ovds-caption">{vatDeadline.toLocaleDateString('en-ET', { month: 'short', day: 'numeric' })}</p>
        </Link>

        {/* DRRF countdown */}
        <Link to="/disaster-fund"
          className={`group p-3 rounded-xl border transition-all hover:shadow-sm ${
            drrfDaysLeft <= 5 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' :
            drrfDaysLeft <= 10 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' :
            'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800'
          }`}>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">DRRF Levy</p>
          <p className={`text-sm font-semibold mt-0.5 tabular-nums ${drrfDaysLeft <= 5 ? 'text-rose-600 dark:text-rose-400' : drrfDaysLeft <= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
            {drrfDaysLeft}d left
          </p>
          <p className="ovds-caption">{drrfDeadline.toLocaleDateString('en-ET', { month: 'short', day: 'numeric' })}</p>
        </Link>

        {/* Overdue invoices */}
        <Link to="/sales/invoices?status=OVERDUE"
          className={`group p-3 rounded-xl border transition-all hover:shadow-sm ${
            (status?.overdueInvoices ?? 0) > 0
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
              : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-800'
          }`}>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Overdue</p>
          <p className={`text-sm font-semibold mt-0.5 ${(status?.overdueInvoices ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'}`}>
            {loading ? '—' : status?.overdueInvoices ?? 0}
          </p>
          <p className="ovds-caption">invoices</p>
        </Link>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <Link to="/tax/dashboard" className="flex items-center gap-1.5 text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">
          <TrendingUp size={12} /> Full Tax Dashboard
        </Link>
        <a href="https://etax.erca.gov.et" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-teal-600 transition-colors">
          <Globe size={10} /> eTax Portal ↗
        </a>
      </div>
    </div>
  );
};

export default LiveComplianceWidget;






