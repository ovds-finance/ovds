import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw, Globe, Banknote, Shield,
  TrendingUp, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import { fmtCurrency } from '../../utils/fmt';

interface ChecklistItem {
  id: string;
  label: string;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
  detail?: string;
  link?: string;
  external?: boolean;
}

interface TaxDashboard {
  vatCurrent: number;
  drrfCurrent: number;
  incomeTaxDue: number;
  drrfPendingYear: number;
  overdueVat: number;
  overdueDrrf: number;
  nextDue: { vat: string; drrf: string };
  complianceScore: number;
}

const STATUS_CONFIG = {
  OK:       { icon: <CheckCircle2 size={12} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', label: 'OK' },
  WARNING:  { icon: <AlertTriangle size={12} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', label: 'Warning' },
  CRITICAL: { icon: <XCircle size={12} />, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', label: 'Critical' },
  PENDING:  { icon: <Clock size={12} />, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-white dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700', label: 'Pending' },
};

const STATIC_CHECKLIST: ChecklistItem[] = [
  { id: 'einvoice', label: 'e-Invoice QR on every invoice', status: 'OK', detail: 'ERCA-compliant QR codes active', link: '/sales/invoices' },
  { id: 'etax', label: 'eTax portal account active', status: 'OK', detail: 'etax.erca.gov.et', link: 'https://etax.erca.gov.et', external: true },
  { id: 'monthly', label: 'Monthly VAT return filing', status: 'PENDING', detail: 'Due 30th of following month', link: '/tax/vat' },
  { id: 'reverse', label: 'Reverse-charge for digital services', status: 'WARNING', detail: 'Configure for foreign suppliers', link: '/tax/vat' },
  { id: 'annual', label: 'Annual VAT reconciliation', status: 'PENDING', detail: 'End of fiscal year', link: '/tax/vat' },
  { id: 'pit', label: 'PIT brackets in payroll', status: 'OK', detail: 'Ethiopian progressive slabs active (Proc. 1395/2025)', link: '/hr/payroll' },
  { id: 'pension', label: 'Pension 7%/11% configured', status: 'OK', detail: 'Employee + employer rates set · Cap ETB 15,000', link: '/hr/payroll' },
  { id: 'disaster', label: 'DRRF levies tracked', status: 'PENDING', detail: 'Quarterly submission required · Reg. 570/2025', link: '/disaster-fund' },
  { id: 'bit', label: 'BIT declaration ready (30%)', status: 'PENDING', detail: 'Annual — within 4 months of FY end', link: '/tax/business-income' },
  { id: 'mat', label: 'MAT assessed (2.5% of turnover)', status: 'PENDING', detail: 'Minimum Alternative Tax — pay whichever is higher: BIT or MAT · Proc. 1395/2025', link: '/tax/business-income' },
  { id: 'tot', label: 'TOT compliance (Category B)', status: 'PENDING', detail: 'Turnover Tax: 2% goods / 10% services — for businesses with annual revenue < ETB 2M', link: '/tax/vat' },
  { id: 'wht', label: 'WHT remittance (3%)', status: 'PENDING', detail: 'Withholding Tax 3% on services ≥ ETB 10k and goods ≥ ETB 20k · Proc. 1395/2025', link: '/tax/vat' },
  { id: 'audit', label: 'Audit trail immutable', status: 'OK', detail: 'All operations logged', link: '/settings/audit-logs' },
];

const ERCAComplianceDashboard: React.FC = () => {
  const [taxData, setTaxData] = useState<TaxDashboard | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(STATIC_CHECKLIST);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [taxRes, complianceRes] = await Promise.allSettled([
        api.get('/tax/dashboard', { headers: { 'x-background': '1' } } as any),
        api.get('/tax/compliance-status', { headers: { 'x-background': '1' } } as any),
      ]);

      if (taxRes.status === 'fulfilled') {
        setTaxData(taxRes.value.data?.data ?? taxRes.value.data);
      }

      if (complianceRes.status === 'fulfilled') {
        const items: any[] = complianceRes.value.data?.data ?? complianceRes.value.data ?? [];
        if (Array.isArray(items) && items.length > 0) {
          setChecklist(items.map((item: any) => ({
            id: item.id,
            label: item.label,
            status: item.status,
            detail: item.detail,
            link: item.link,
            external: item.external,
          })));
        }
      }
    } catch {
      // keep static defaults
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const score = taxData?.complianceScore ?? Math.round(
    (checklist.filter(c => c.status === 'OK').length / checklist.length) * 100
  );
  const criticalCount = checklist.filter(c => c.status === 'CRITICAL').length;
  const warningCount = checklist.filter(c => c.status === 'WARNING').length;
  const okCount = checklist.filter(c => c.status === 'OK').length;

  const scoreColor = score >= 90 ? 'text-emerald-600 dark:text-emerald-400'
    : score >= 70 ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400';
  const scoreBg = score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500';

  const fmt = (n: number) => fmtCurrency(n, 'ETB');

  const visibleItems = expanded ? checklist : checklist.slice(0, 5);

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-50 dark:bg-orange-950/30 rounded-xl flex items-center justify-center">
            <ShieldCheck size={15} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">ERCA Compliance</p>
            <p className="ovds-caption">Ethiopian 2026 Regulatory Framework</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-[10px] font-medium rounded-full uppercase tracking-wider">
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-medium rounded-full uppercase tracking-wider">
              {warningCount} warning
            </span>
          )}
          <span className={`text-sm font-semibold ${scoreColor}`}>{score}%</span>
          <button onClick={() => load(true)} className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" title="Refresh">
            <RefreshCw size={12} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Score bar */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{okCount} passed
            {warningCount > 0 && <><span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-1" />{warningCount} warning</>}
            {criticalCount > 0 && <><span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-1" />{criticalCount} critical</>}
          </span>
          <span className={scoreColor}>{score}% compliant</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${scoreBg} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
        </div>
      </div>

      {/* Tax KPIs */}
      {!loading && taxData && (
        <div className="px-5 py-3 grid grid-cols-3 gap-2">
          <Link to="/tax/vat" className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/40 hover:border-orange-300 dark:hover:border-orange-700 transition-all group">
            <div className="flex items-center gap-1.5 mb-1">
              <Globe size={10} className="text-orange-500" />
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">VAT Due</p>
            </div>
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 tabular-nums">{fmt(taxData.vatCurrent)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Due {taxData.nextDue?.vat ?? '30th'}</p>
          </Link>
          <Link to="/disaster-fund" className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700 transition-all group">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield size={10} className="text-rose-500" />
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">DRRF</p>
            </div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 tabular-nums">{fmt(taxData.drrfCurrent)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Quarterly levy</p>
          </Link>
          <Link to="/tax/business-income" className="p-3 bg-violet-50 dark:bg-violet-950/20 rounded-xl border border-violet-100 dark:border-violet-900/40 hover:border-violet-300 dark:hover:border-violet-700 transition-all group">
            <div className="flex items-center gap-1.5 mb-1">
              <Banknote size={10} className="text-violet-500" />
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">BIT</p>
            </div>
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-400 tabular-nums">{fmt(taxData.incomeTaxDue)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">30% net profit</p>
          </Link>
        </div>
      )}

      {/* Checklist */}
      <div className="px-5 pb-2 space-y-1.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))
        ) : (
          visibleItems.map(item => {
            const cfg = STATUS_CONFIG[item.status];
            const content = (
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm ${cfg.bg} ${cfg.border}`}>
                <span className={cfg.color}>{cfg.icon}</span>
                <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{item.label}</span>
                {item.detail && <span className="text-[9px] text-slate-400 hidden sm:block">{item.detail}</span>}
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color} shrink-0`}>{cfg.label}</span>
                {item.external && <ExternalLink size={9} className="text-slate-300 shrink-0" />}
              </div>
            );
            if (!item.link) return <div key={item.id}>{content}</div>;
            if (item.external) return <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer">{content}</a>;
            return <Link key={item.id} to={item.link}>{content}</Link>;
          })
        )}
      </div>

      {/* Expand/collapse */}
      {checklist.length > 5 && (
        <div className="px-5 pb-3">
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors"
          >
            {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show {checklist.length - 5} more</>}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <Link to="/tax/dashboard" className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
          <TrendingUp size={12} /> Full Tax Dashboard
        </Link>
        <a href="https://etax.erca.gov.et" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-teal-600 transition-colors">
          <Globe size={10} /> eTax Portal <ExternalLink size={9} />
        </a>
      </div>
    </div>
  );
};

export default ERCAComplianceDashboard;






