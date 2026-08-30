/**
 * AuditReadinessWidget — shows audit outsourcing readiness score,
 * active engagements, open findings, and best-practice checklist progress.
 * Integrates with the AuditOutsourcing module.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, CheckCircle2, XCircle,
  ArrowRight, RefreshCw, Award, BookOpen,
} from 'lucide-react';
import api from '../../services/api';
import { useBusiness } from '../../context/businessContext';

interface AuditStats {
  firms: number;
  totalEngagements: number;
  active: number;
  completed: number;
  openFindings: number;
  criticalFindings: number;
  overdue: number;
}

const READINESS_CHECKS = [
  { id: 'firms', label: 'Audit firm registered', key: 'firms', threshold: 1 },
  { id: 'engagements', label: 'Active engagement running', key: 'active', threshold: 1 },
  { id: 'findings', label: 'No critical open findings', key: 'criticalFindings', threshold: 0, invert: true },
  { id: 'overdue', label: 'No overdue engagements', key: 'overdue', threshold: 0, invert: true },
  { id: 'completed', label: 'At least one completed audit', key: 'completed', threshold: 1 },
];

const AuditReadinessWidget: React.FC = () => {
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedCompanyId } = useBusiness();

  const load = useCallback(async () => {
    try {
      const params = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
      const res = await api.get(`/audit-outsourcing/stats${params}`, { headers: { 'x-background': '1' } } as any);
      setStats(res.data?.data ?? res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [selectedCompanyId]);

  useEffect(() => { load(); }, [load]);

  const checks = READINESS_CHECKS.map(c => {
    const val = (stats as any)?.[c.key] ?? 0;
    const passed = c.invert ? val <= c.threshold : val >= c.threshold;
    return { ...c, passed, val };
  });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const scoreColor = score >= 80 ? 'text-emerald-600 dark:text-emerald-400'
    : score >= 60 ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400';
  const scoreBg = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-50 dark:bg-violet-950/30 rounded-xl flex items-center justify-center">
            <Award size={15} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Audit Readiness</p>
            <p className="ovds-caption">External audit outsourcing status</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${scoreColor}`}>{score}%</span>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw size={12} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Score bar */}
      <div className="px-5 pt-4 pb-2">
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${scoreBg} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
        </div>
        <p className="text-[9px] text-slate-400 mt-1">{passedCount}/{checks.length} readiness checks passed</p>
      </div>

      {/* Stats row */}
      {!loading && stats && (
        <div className="px-5 py-3 grid grid-cols-4 gap-2">
          {[
            { label: 'Firms', value: stats.firms, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
            { label: 'Active', value: stats.active, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
            { label: 'Open', value: stats.openFindings, color: stats.openFindings > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
            { label: 'Critical', value: stats.criticalFindings, color: stats.criticalFindings > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500', bg: stats.criticalFindings > 0 ? 'bg-rose-50 dark:bg-rose-950/20' : 'bg-white dark:bg-slate-800/50' },
          ].map(s => (
            <div key={s.label} className={`p-2.5 rounded-xl ${s.bg} text-center`}>
              <p className={`text-lg font-semibold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Readiness checklist */}
      <div className="px-5 pb-4 space-y-1.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))
        ) : (
          checks.map(c => (
            <div key={c.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${
              c.passed
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40'
            }`}>
              {c.passed
                ? <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                : <XCircle size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
              }
              <span className={`text-xs font-semibold flex-1 ${c.passed ? 'text-slate-700 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
                {c.label}
              </span>
              {!c.passed && (
                <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">Action needed</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Best practices link */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
          <BookOpen size={12} className="text-slate-400 shrink-0" />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex-1">
            Follow best practices: define scope, choose certified firm, ensure data security
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <Link to="/compliance/audit-outsourcing" className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
          <ClipboardList size={12} /> Audit Outsourcing
        </Link>
        <Link to="/compliance/auditor" className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors">
          Compliance <ArrowRight size={9} />
        </Link>
      </div>
    </div>
  );
};

export default AuditReadinessWidget;







