import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuth } from '../../rbac/AuthContext';

const CompaniesWidget: React.FC = () => {
  const { can } = useAuth();

  const { data, loading } = useApiQuery<any>(
    '/companies?take=5',
    { enabled: can('companies:read'), staleTime: 120_000, suppressToast: true }
  );

  const companies: any[] = data?.data ?? data ?? [];

  return (
    <div className="ovds-widget-card">
      <div className="ovds-widget-header">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Building2 size={14} className="text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="ovds-card-title">Company Overview</h3>
            <p className="ovds-caption">{companies.length} registered</p>
          </div>
        </div>
        <Link to="/accounting-hub?tab=COMPANIES" className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline">
          Manage <ArrowUpRight size={11} />
        </Link>
      </div>
      <div className="ovds-widget-body">

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 ovds-shimmer shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 bg-slate-100 rounded ovds-shimmer" />
                <div className="h-2.5 w-20 bg-slate-100 rounded ovds-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="ovds-empty">
          <Building2 size={28} className="mb-2 text-slate-200" />
          <p className="text-[12px] font-semibold">No companies found</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {companies.slice(0, 5).map((co: any, i) => (
            <div key={co.id ?? i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/80 to-emerald-600 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-white">
                  {(co.name ?? 'C').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 truncate">{co.name}</p>
                <p className="ovds-caption">{co.tinNumber ?? co.type ?? 'Active'}</p>
              </div>
              {co.isActive !== false ? (
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              ) : (
                <Clock size={14} className="text-amber-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default CompaniesWidget;

