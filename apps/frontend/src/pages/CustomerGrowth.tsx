/**
 * CustomerGrowth — Customer acquisition, revenue growth, and retention trends.
 * ovds-inspired analytics with monthly breakdown and top-customer ranking.
 */
import React, { useState, useEffect } from 'react';
import { AppPage, AppKpi, AppSection, Skeleton } from '@ovds/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { fmtCurrency } from '../utils/fmt';
import {
  TrendingUp, Users2, DollarSign,
  BarChart3, Award, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

// -- Types ---------------------------------------------------------------------
interface MonthRow {
  month:          string;
  newCustomers:   number;
  totalRevenue:   number;
  avgOrderValue?: number;
}

interface TopCustomer {
  customerName: string;
  invoiceCount: number;
  totalRevenue: number;
}

interface GrowthData {
  monthly:        MonthRow[];
  totalCustomers: number;
  topCustomers:   TopCustomer[];
}

// -- Component -----------------------------------------------------------------
const CustomerGrowth: React.FC = () => {
  usePageTitle('Customer Growth & Trends');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();

  const [data, setData]       = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear]       = useState(new Date().getFullYear());

  const canRead = can('ovds:read');
  const fmt = (n: number) => fmtCurrency(n, 'ETB');

  useEffect(() => {
    if (!canRead) return;
    setLoading(true);
    const cq = selectedCompanyId ? `&companyId=${selectedCompanyId}` : '';
    api.get(`/ovds/reports/customer-growth?year=${year}${cq}`, { headers: { 'x-background': '1' } } as any)
      .then((r: any) => setData(r.data?.data ?? r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year, selectedCompanyId, canRead]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const rows: MonthRow[] = data?.monthly ?? MONTHS.map(m => ({ month: m, newCustomers: 0, totalRevenue: 0 }));
  const totals = rows.reduce(
    (acc, r) => ({ newCustomers: acc.newCustomers + r.newCustomers, totalRevenue: acc.totalRevenue + r.totalRevenue }),
    { newCustomers: 0, totalRevenue: 0 },
  );
  const maxCustomers = Math.max(1, ...rows.map(r => r.newCustomers));

  const yearOptions = [year - 2, year - 1, year, year + 1];

  const kpiCells = [
    {
      label: 'New Customers',
      value: totals.newCustomers.toString(),
      sub:   `FY ${year}`,
      icon:  <Users2 size={16} />,
      accentCls: 'bg-emerald-500',
    },
    {
      label: 'Total Revenue',
      value: fmt(totals.totalRevenue),
      sub:   'From new customers',
      icon:  <DollarSign size={16} />,
      accentCls: 'bg-emerald-500',
    },
    {
      label: 'Avg / Month',
      value: Math.round(totals.newCustomers / 12).toString(),
      sub:   'New customers/month',
      icon:  <BarChart3 size={16} />,
      accentCls: 'bg-violet-500',
    },
    {
      label: 'Total Customers',
      value: (data?.totalCustomers ?? '—').toString(),
      sub:   'All time',
      icon:  <Award size={16} />,
      accentCls: 'bg-amber-500',
    },
  ];

  return (
    <AppPage
      title="Customer Growth & Trends"
      subtitle="New customers acquired, revenue growth, and retention trends over time"
      icon={<TrendingUp size={16} />}
      iconBg="bg-emerald-500"
      actions={
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/20"
        >
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      }
    >
      {/* -- KPI strip --------------------------------------------------------- */}
      {loading ? (
        <div className="ovds-grid-layout cols-4">
          {[1,2,3,4].map(i => <Skeleton.Line key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <AppKpi cells={kpiCells} />
      )}

      {/* -- Bar chart --------------------------------------------------------- */}
      <AppSection label="Monthly New Customers" icon={<BarChart3 size={14} />}>
        <div className="ovds-widget-card p-5">
          {loading ? (
            <div className="h-40 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-end gap-1.5 h-40">
              {rows.map((r, i) => {
                const pct = maxCustomers > 0 ? (r.newCustomers / maxCustomers) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '120px' }}>
                      <div
                        className="w-full bg-emerald-500 rounded-t-lg transition-all duration-700 hover:bg-emerald-400 cursor-pointer"
                        style={{ height: `${Math.max(4, pct)}%` }}
                        title={`${r.month}: ${r.newCustomers} new customers · ${fmt(r.totalRevenue)}`}
                      />
                      {r.newCustomers > 0 && (
                        <span className="absolute -top-5 text-[9px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {r.newCustomers}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{r.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppSection>

      {/* -- Monthly table ----------------------------------------------------- */}
      <AppSection label={`Monthly Breakdown — ${year}`} icon={<TrendingUp size={14} />}>
        <div className="ovds-widget-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  {['Month', 'New Customers', 'Revenue', 'Avg Order Value', 'MoM Growth'].map(h => (
                    <th key={h} className="px-4 py-3 text-left ovds-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rows.map((r, i) => {
                  const prev = rows[i - 1];
                  const growth = prev && prev.newCustomers > 0
                    ? Math.round(((r.newCustomers - prev.newCustomers) / prev.newCustomers) * 100)
                    : null;
                  return (
                    <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{r.month}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{r.newCustomers}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmt(r.totalRevenue)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 tabular-nums">
                        {r.avgOrderValue ? fmt(r.avgOrderValue) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {growth !== null ? (
                          <span className={`flex items-center gap-1 text-[11px] font-bold ${growth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {Math.abs(growth)}%
                          </span>
                        ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                {!loading && (
                  <tr className="bg-white dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">Total</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">{totals.newCustomers}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">{fmt(totals.totalRevenue)}</td>
                    <td colSpan={2} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AppSection>

      {/* -- Top customers ----------------------------------------------------- */}
      {!loading && (data?.topCustomers ?? []).length > 0 && (
        <AppSection label={`Top Customers by Revenue — ${year}`} icon={<Award size={14} />}>
          <div className="ovds-widget-card overflow-hidden">
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {(data?.topCustomers ?? []).slice(0, 10).map((c, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    : i === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{c.customerName}</p>
                    <p className="ovds-caption">{c.invoiceCount} invoice{c.invoiceCount !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">{fmt(c.totalRevenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </AppSection>
      )}
    </AppPage>
  );
};

export default CustomerGrowth;


