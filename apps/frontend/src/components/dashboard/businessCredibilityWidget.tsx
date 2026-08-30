import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, Star, Landmark, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { fmtNum } from '../../utils/fmt';
import { useBusiness } from '../../context/businessContext';

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#00E784' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-semibold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
};

const BusinessCredibilityWidget: React.FC<{ loading?: boolean }> = ({ loading: externalLoading }) => {
  const [data, setData] = useState<any>(null);
  const [overdueLoans, setOverdueLoans] = useState<any[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const { selectedCompanyId } = useBusiness();

  useEffect(() => {
    const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
    Promise.allSettled([
      api.get(`/ovds/partnerships/credibility-dashboard${cq}`, { headers: { 'x-background': '1' } } as any),
      api.get(`/ovds/business-loans/overdue${cq}`, { headers: { 'x-background': '1' } } as any),
    ]).then(([dashRes, overdueRes]) => {
      if (dashRes.status === 'fulfilled') setData(dashRes.value.data.data || dashRes.value.data);
      if (overdueRes.status === 'fulfilled') setOverdueLoans(overdueRes.value.data.data || []);
    }).finally(() => setInternalLoading(false));
  }, [selectedCompanyId]);

  const isLoading = externalLoading || internalLoading;

  if (isLoading) return (
    <div className="ovds-widget-card shadow-sm p-6 space-y-4">
      <div className="h-4 w-40 ovds-shimmer rounded" />
      <div className="h-20 ovds-shimmer rounded-2xl" />
      <div className="ovds-grid-layout cols-3">{[1,2,3].map(i => <div key={i} className="h-16 ovds-shimmer rounded-2xl" />)}</div>
    </div>
  );
  if (!data) return null;
  const s = data.summary || {};
  const avgScore = s.avgCredibilityScore ?? 0;

  const statCards = [
    {
      label: 'Active Partnerships',
      value: s.activePartnerships ?? 0,
      sub: `${s.totalPartnerships ?? 0} total`,
      icon: <HeartHandshake size={14} />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      tc: 'text-emerald-600 dark:text-emerald-400 dark:text-emerald-400',
    },
    {
      label: 'Business Loans',
      value: s.totalLoans ?? 0,
      sub: `ETB ${fmtNum(s.totalLoanOutstanding ?? 0)} outstanding`,
      icon: <Landmark size={14} />,
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      tc: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Investments',
      value: s.totalInvestments ?? 0,
      sub: `ETB ${fmtNum(s.totalInvestmentAmount ?? 0)}`,
      icon: <TrendingUp size={14} />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      tc: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="ovds-widget-card shadow-sm p-6 transition-colors">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <HeartHandshake size={14} className="text-emerald-600 dark:text-emerald-400" /> Business Credibility
        </h3>
        <Link to="/reports/insights" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
          Full Dashboard →
        </Link>
      </div>

      {/* Score + stats */}
      <div className="flex items-center gap-4 mb-4 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
        <ScoreRing score={avgScore} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Avg Credibility Score</p>
          <p className={`text-xl font-semibold mt-0.5 ${avgScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : avgScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {avgScore}/100
          </p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={10} className={i < Math.round(avgScore / 20) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'} />
            ))}
            <span className="text-[9px] text-slate-400 dark:text-slate-500 ml-1">
              {avgScore >= 80 ? 'Excellent — bank loan eligible' : avgScore >= 60 ? 'Good — improving' : avgScore >= 40 ? 'Fair — needs work' : 'Poor — action required'}
            </span>
          </div>
        </div>
      </div>

      {/* Score pillars */}
      <div className="mb-4 space-y-2">
        {[
          { label: 'Org Structure', score: Math.min(40, Math.round(avgScore * 0.4)), max: 40, color: 'bg-emerald-500' },
          { label: 'Customer Relations', score: Math.min(35, Math.round(avgScore * 0.35)), max: 35, color: 'bg-emerald-500' },
          { label: 'Financial Transparency', score: Math.min(25, Math.round(avgScore * 0.25)), max: 25, color: 'bg-violet-500' },
        ].map(pillar => (
          <div key={pillar.label}>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
              <span>{pillar.label}</span>
              <span>{pillar.score}/{pillar.max}</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${pillar.color} rounded-full transition-all duration-700`}
                style={{ width: `${(pillar.score / pillar.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="ovds-grid-layout cols-3 mb-4">
        {statCards.map(({ label, value, sub, icon, bg, tc }) => (
          <div key={label} className={`${bg} rounded-xl p-3`}>
            <div className={`${tc} mb-1`}>{icon}</div>
            <p className={`text-lg font-semibold ${tc}`}>{value}</p>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">{label}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {overdueLoans.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800 rounded-xl p-3 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-rose-500 shrink-0" />
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
              {overdueLoans.length} overdue loan payment{overdueLoans.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/ovds/loans" className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline">
            Review →
          </Link>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { label: 'Partnerships', to: '/ovds/partnerships', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400' },
          { label: 'Loans', to: '/ovds/loans', color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' },
          { label: 'Investments', to: '/ovds/investments', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
          { label: 'CRM', to: '/crm', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
        ].map((item) => (
          <Link key={item.label} to={item.to}
            className={`flex-1 text-center py-1.5 rounded-xl ${item.color} text-[10px] font-semibold hover:opacity-80 transition-all`}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BusinessCredibilityWidget;









