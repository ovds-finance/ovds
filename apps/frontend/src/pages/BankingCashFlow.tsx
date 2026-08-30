/**
 * BankingCashFlow — Monthly cash inflow vs outflow report
 *
 * Section 6 of the banking user flow:
 *   "Cash Flow Report: monthly cash inflows versus outflows to help track
 *    liquidity trends."
 *
 * API:
 *   GET /banking/reports/cash-flow?companyId=&months=6
 */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowLeftRight, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtETB } from '../utils/ethiopianTax';
import { AppPage, AppKpi, Card, Btn } from '../components/ui';

interface CashFlowMonth {
  month: string; totalIn: number; totalOut: number; net: number;
  reconciledIn: number; reconciledOut: number;
}
interface CashFlowReport {
  months: CashFlowMonth[];
  totals: { totalIn: number; totalOut: number; net: number };
  period: { from: string; to: string };
}

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-3 py-2.5 text-[11px] min-w-[160px]">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }} className="font-semibold">{p.name}</span>
          <span className="tabular-nums font-mono text-slate-600 dark:text-slate-400">{fmtETB(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const BankingCashFlow: React.FC = () => {
  usePageTitle('Cash Flow');
  const { selectedCompanyId } = useBusiness();
  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}&months=6` : '?months=6';

  const { data, isLoading, refetch } = useQuery<CashFlowReport | null>({
    queryKey: ['banking-cashflow', selectedCompanyId],
    queryFn: () => api.get(`/banking/reports/cash-flow${cq}`).then(r => r.data?.data ?? r.data).catch(() => null),
    staleTime: 60_000,
  });

  const months = data?.months ?? [];

  const chartData = useMemo(() => months.map(m => ({
    name: m.month,
    'Cash In':  Math.round(m.totalIn),
    'Cash Out': Math.round(m.totalOut),
    'Net':      Math.round(m.net),
  })), [months]);

  const kpi = [
    { label: 'Total In (6mo)',  value: data ? fmtETB(data.totals.totalIn)  : '—', color: 'emerald' as const },
    { label: 'Total Out (6mo)', value: data ? fmtETB(data.totals.totalOut) : '—', color: 'rose'    as const },
    { label: 'Net Flow',        value: data ? fmtETB(data.totals.net)      : '—', color: (data?.totals.net ?? 0) >= 0 ? 'emerald' as const : 'rose' as const },
    { label: 'Months Analysed', value: months.length, color: 'sky' as const },
  ];

  return (
    <AppPage
      title="Cash Flow"
      subtitle="Monthly inflows vs outflows · Liquidity trend analysis"
      icon={<ArrowLeftRight size={18} />}
      iconBg="bg-sky-500"
      crumbs={[{ label: 'Banking', href: '/banking' }, { label: 'Cash Flow' }]}
      actions={<Btn variant="ghost" size="sm" icon={<RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Btn>}
    >
      <AppKpi cells={kpi} loading={isLoading} />

      {/* Area chart */}
      <Card className="p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Cash In vs Cash Out</p>
        {isLoading ? (
          <div className="h-52 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cfIn"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.01} /></linearGradient>
                <linearGradient id="cfOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.12} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => fmtETB(v, 0)} width={72} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="Cash In"  stroke="#10b981" strokeWidth={2} fill="url(#cfIn)"  dot={false} />
              <Area type="monotone" dataKey="Cash Out" stroke="#f43f5e" strokeWidth={2} fill="url(#cfOut)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Bar chart — net */}
      <Card className="p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Net Cash Flow by Month</p>
        {isLoading ? (
          <div className="h-44 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => fmtETB(v, 0)} width={72} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="Net" radius={[4, 4, 0, 0]}
                fill="#0ea5e9"
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Monthly breakdown table */}
      {months.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Month</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Cash In</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-rose-500 uppercase tracking-widest">Cash Out</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-sky-500 uppercase tracking-widest">Net</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reconciled In</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => (
                <tr key={m.month} className={`border-b border-slate-50 dark:border-slate-800/50 ${i % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-900/30'}`}>
                  <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{m.month}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">{fmtETB(m.totalIn)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-rose-600 dark:text-rose-400 font-semibold">{fmtETB(m.totalOut)}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${m.net >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {m.net >= 0 ? '+' : ''}{fmtETB(m.net)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-400 font-mono text-[10px]">{fmtETB(m.reconciledIn)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200">Total</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-400 font-bold">{fmtETB(data?.totals.totalIn ?? 0)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-rose-600 dark:text-rose-400 font-bold">{fmtETB(data?.totals.totalOut ?? 0)}</td>
                <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${(data?.totals.net ?? 0) >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {(data?.totals.net ?? 0) >= 0 ? '+' : ''}{fmtETB(data?.totals.net ?? 0)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </Card>
      )}
    </AppPage>
  );
};

export default BankingCashFlow;
