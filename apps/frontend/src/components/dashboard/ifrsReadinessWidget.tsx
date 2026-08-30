/**
 * IFRS Readiness Widget
 * Compact dashboard widget showing IFRS + Ethiopian compliance status
 * Covers: IAS 1, IFRS 15, IAS 12, IAS 19, IAS 37, VAT 1341/2024, DRRF 570/2025
 * Fetches live compliance data from the tax dashboard API
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Clock, Globe, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';

interface CheckItem {
  id: string;
  label: string;
  ref: string;
  status: 'ok' | 'warn' | 'pending';
  detail: string;
}

const BASE_CHECKS: CheckItem[] = [
  { id: 'ias1',    label: 'Financial Statements',  ref: 'IAS 1',    status: 'ok',      detail: 'Balance Sheet, P&L, Cash Flow, Notes' },
  { id: 'ifrs15',  label: 'Revenue Recognition',   ref: 'IFRS 15',  status: 'ok',      detail: '5-step model, VAT excluded from revenue' },
  { id: 'ias12',   label: 'Income Tax (BIT 30%)',   ref: 'IAS 12',   status: 'ok',      detail: 'Current + deferred tax recognised' },
  { id: 'ias19',   label: 'Employee Benefits',      ref: 'IAS 19',   status: 'ok',      detail: 'PIT 0–35%, Pension 7%/11% auto-calculated' },
  { id: 'ias37',   label: 'DRRF Provisions',        ref: 'IAS 37',   status: 'pending', detail: 'Levies recognised as provisions on event' },
  { id: 'ias2',    label: 'Inventory Costing',      ref: 'IAS 2',    status: 'ok',      detail: 'FIFO/WA at lower of cost and NRV (LIFO prohibited)' },
  { id: 'vat',     label: 'VAT Proclamation',       ref: '1341/2024',status: 'pending', detail: '15% standard, monthly filing, QR e-Invoice' },
  { id: 'drrf',    label: 'DRRF Regulation',        ref: '570/2025', status: 'pending', detail: '17+ levy categories, quarterly remittance' },
  { id: 'aabe',    label: 'AABE IFRS Adoption',     ref: 'AABE',     status: 'ok',      detail: 'Full IFRS for public interest entities' },
  { id: 'ifrs18',  label: 'IFRS 18 Readiness',      ref: 'IFRS 18',  status: 'warn',    detail: 'Replaces IAS 1 on 1 Jan 2027 — prepare now' },
  { id: 'ifrss1',  label: 'Sustainability Disclosures', ref: 'IFRS S1', status: 'pending', detail: 'Governance, strategy, risk management, metrics — mandatory for Tier 1 entities' },
  { id: 'ifrss2',  label: 'Climate Disclosures',    ref: 'IFRS S2',  status: 'pending', detail: 'Physical & transition risks, GHG emissions, scenario analysis — effective 1 Jan 2024' },
];

// IFRS_CHECKS is BASE_CHECKS merged with any live API data
const IFRS_CHECKS = BASE_CHECKS;

const statusIcon = {
  ok:      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />,
  warn:    <AlertCircle  size={13} className="text-amber-500 shrink-0" />,
  pending: <Clock        size={13} className="text-slate-400 shrink-0" />,
};

const IFRSReadinessWidget: React.FC = () => {
  const navigate = useNavigate();
  const { canAccessRoute } = useAuth();
  const [checks, setChecks] = useState<CheckItem[]>(IFRS_CHECKS);

  // Merge live compliance data from API — only for roles with ovds:read
  useEffect(() => {
    if (!canAccessRoute('/accounting')) return; // skip for non-ovds roles
    api.get('/tax/compliance-status', { headers: { 'x-background': '1' } } as any)
      .then((r: any) => {
        const live: any[] = r.data?.data ?? r.data ?? [];
        if (!Array.isArray(live) || live.length === 0) return;
        setChecks(prev => prev.map(c => {
          const match = live.find((l: any) => l.id === c.id);
          if (!match) return c;
          const status: CheckItem['status'] =
            match.status === 'OK' ? 'ok' :
            match.status === 'WARNING' ? 'warn' : 'pending';
          return { ...c, status, detail: match.detail ?? c.detail };
        }));
      })
      .catch(() => { /* silent — use defaults */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const okCount   = checks.filter(c => c.status === 'ok').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const score     = Math.round((okCount / checks.length) * 100);

  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D';
  const gradeColor = grade === 'A' ? 'text-emerald-600' : grade === 'B' ? 'text-emerald-600' : grade === 'C' ? 'text-amber-600' : 'text-rose-600';
  const gradeBg    = grade === 'A' ? 'bg-emerald-50 dark:bg-emerald-950/30' : grade === 'B' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-amber-50 dark:bg-amber-950/30';

  return (
    <div className="ovds-widget-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center">
            <Globe size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">IFRS Readiness</p>
            <p className="ovds-caption">AABE · Ethiopian Proclamations</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${gradeBg}`}>
          <span className={`text-xl font-semibold ${gradeColor}`}>{grade}</span>
          <div>
            <p className={`text-xs font-semibold ${gradeColor}`}>{score}%</p>
            <p className="ovds-caption">{okCount}/{IFRS_CHECKS.length} checks</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full transition-all duration-700 ${grade === 'A' ? 'bg-emerald-500' : grade === 'B' ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Check list */}
      <div className="p-4 space-y-2">
        {checks.map(c => (
          <div key={c.id} className="flex items-center gap-2.5">
            {statusIcon[c.status]}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{c.label}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${c.id === 'ifrs18' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'}`}>{c.ref}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">{c.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {warnCount > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-xl px-3 py-2">
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">{warnCount} item(s) need attention to reach full compliance.</p>
          </div>
        </div>
      )}

      <div className="px-4 pb-4">
        <button
          onClick={() => navigate('/accounting')}
          className="w-full flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
        >
          View IFRS Compliance Matrix <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default IFRSReadinessWidget;






