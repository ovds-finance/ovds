import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt, FileText, Users, Package,
  ShoppingCart, Plus, ArrowUpRight, RefreshCw, ClipboardList,
  AlertTriangle, PiggyBank, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import {
  AppPage, Btn, Pagination, StatusBadge, MetricCard, Skeleton, cn, fmtCurrency,
} from '../components/ui';
import { useApiCrud } from '../hooks/useApiCrud';
import { useAuth } from '../rbac/AuthContext';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  invoiceDate: string;
  dueDate?: string;
  total: number;
  status: string;
  amountPaid?: number;
  balanceDue?: number;
}

interface Estimate {
  id: string;
  estimateNumber?: string;
  customerName?: string;
  estimateDate?: string;
  expiryDate?: string;
  status: string;
  total?: number;
  totalAmount?: number;
}

interface Customer {
  id: string;
  name: string;
  totalRevenue: number;
  invoiceCount: number;
}

const fmt = (n: number) => fmtCurrency(n, 'ETB');

const Sales: React.FC = () => {
  usePageTitle('Sales');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const navigate = useNavigate();

  const { rows: invoices, total, page, loading, setPage } = useApiCrud<Invoice>({
    endpoint: '/ovds/invoices',
    companyId: selectedCompanyId,
    pageSize: 100,
  });

  const { rows: estimates } = useApiCrud<Estimate>({
    endpoint: '/ovds/estimates',
    companyId: selectedCompanyId,
    pageSize: 5,
    autoFetch: true,
  });

  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((s, i) => s + (i.total || 0), 0);
    const invoicesSent = invoices.length;
    const invoicesPaid = invoices.filter(i => i.status === 'PAID').length;
    const outstandingAmount = invoices.reduce((s, i) => {
      const balance = i.balanceDue ?? i.total - (i.amountPaid ?? 0);
      return s + Math.max(0, balance);
    }, 0);
    const paidInvoices = invoices.filter(i => i.status === 'PAID' && i.invoiceDate && i.dueDate);
    const avgPaymentTerms = paidInvoices.length > 0
      ? Math.round(paidInvoices.reduce((s, i) => {
          const invDate = new Date(i.invoiceDate);
          const dueDate = new Date(i.dueDate!);
          return s + Math.max(0, (dueDate.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / paidInvoices.length)
      : 0;
    return { totalRevenue, invoicesSent, invoicesPaid, outstandingAmount, avgPaymentTerms };
  }, [invoices]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    invoices.forEach(inv => {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    });
    return counts;
  }, [invoices]);

  const revenueTrendData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data: { day: string; value: number; fullDate: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRevenue = invoices
        .filter(inv => inv.invoiceDate === dateStr)
        .reduce((s, inv) => s + (inv.total || 0), 0);
      data.push({
        day: days[d.getDay()],
        value: dayRevenue,
        fullDate: dateStr,
      });
    }
    return data;
  }, [invoices]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, Customer>();
    invoices.forEach(inv => {
      const name = inv.customerName || 'Unknown';
      if (!map.has(name)) map.set(name, { id: inv.id, name, totalRevenue: 0, invoiceCount: 0 });
      const c = map.get(name)!;
      c.totalRevenue += inv.total || 0;
      c.invoiceCount += 1;
    });
    return Array.from(map.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  }, [invoices]);

  const customerInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTotal = (est: Estimate) => Number(est.totalAmount ?? est.total ?? 0);

  const quickActions = [
    { title: 'Invoicing', desc: 'Create, customize, and email professional invoices', to: '/sales/invoices', icon: <Receipt size={18} />, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { title: 'Estimates', desc: 'Create quotes and convert to invoices', to: '/sales/estimates', icon: <FileText size={18} />, color: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
    { title: 'Sales Orders', desc: 'Track orders, delivery, and fulfillment', to: '/sales/orders', icon: <ShoppingCart size={18} />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { title: 'Customers', desc: 'Build client profiles and track histories', to: '/customers', icon: <Users size={18} />, color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
    { title: 'Recurring Invoices', desc: 'Schedule automatic weekly, monthly, or yearly invoices', to: '/sales/invoices?tab=recurring', icon: <RefreshCw size={18} />, color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
    { title: 'Collections', desc: 'Track overdue invoices and send reminders', to: '/sales/collections', icon: <AlertTriangle size={18} />, color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
    { title: 'Revenue Recognition', desc: 'IFRS 15 deferred revenue schedules', to: '/sales/revenue-recognition', icon: <PiggyBank size={18} />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { title: 'Item Catalog', desc: 'Store predefined products and services', to: '/items', icon: <Package size={18} />, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  ];

  return (
    <AppPage
      title="Sales"
      subtitle="Manage invoices, orders, estimates, and revenue from one place."
      icon={<Receipt size={18} />}
      iconBg="bg-[#0056D2]"
      actions={
        <div className="flex items-center gap-2">
          {can('invoices:write') && (
            <Btn variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/sales/invoices?action=new')}>
              New Invoice
            </Btn>
          )}
          <Btn variant="secondary" icon={<FileText size={14} />} onClick={() => navigate('/sales/estimates?action=new')}>
            New Estimate
          </Btn>
        </div>
      }
    >
      {/* KPI Strip */}
      {loading ? (
        <Skeleton.StatsRow count={5} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard title="Revenue" amount={fmtCurrency(stats.totalRevenue)} percentage={0} isPositive={true} variant="highlight-emerald" />
          <MetricCard title="Invoices Sent" amount={stats.invoicesSent.toString()} percentage={0} isPositive={true} variant="highlight-blue" />
          <MetricCard title="Paid" amount={stats.invoicesPaid.toString()} percentage={0} isPositive={true} variant="highlight-purple" />
          <MetricCard title="Outstanding" amount={fmtCurrency(stats.outstandingAmount)} percentage={0} isPositive={false} variant="highlight-amber" />
          <MetricCard title="Avg Terms" amount={`${stats.avgPaymentTerms} days`} percentage={0} isPositive={stats.avgPaymentTerms <= 30} variant="highlight-sky" />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Revenue Trend</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {fmt(revenueTrendData.reduce((s, d) => s + d.value, 0))}
              </p>
              <p className="text-[10px] text-slate-400">7-day total</p>
            </div>
          </div>
          {revenueTrendData.every(d => d.value === 0) ? (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-xs text-slate-400">No revenue data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0056D2" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0056D2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 11, color: '#fff', padding: '6px 10px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                  itemStyle={{ color: '#0056D2' }}
                  cursor={{ stroke: '#0056D2', strokeWidth: 1, strokeDasharray: '4 2' }}
                  formatter={(value: number) => [fmt(value), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0056D2"
                  strokeWidth={2.5}
                  fill="url(#salesTrendGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#0056D2', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Invoice Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Invoice Status</h3>
          <p className="text-[11px] text-slate-400 mb-4">Current breakdown</p>
          {(() => {
            const total = Object.values(statusCounts).reduce((s, v) => s + v, 0);
            const segs = [
              { key: 'PAID', color: '#00E784', label: 'Paid' },
              { key: 'SENT', color: '#3B82F6', label: 'Sent' },
              { key: 'DRAFT', color: '#94a3b8', label: 'Draft' },
              { key: 'OVERDUE', color: '#F43F5E', label: 'Overdue' },
            ];
            const r = 14;
            const circ = 2 * Math.PI * r;
            let off = 0;
            const arcs = segs.map(s => {
              const pct = total > 0 ? (statusCounts[s.key] ?? 0) / total : 0;
              const dash = pct * circ;
              const a = { ...s, dash, gap: circ - dash, off, pct };
              off += dash;
              return a;
            });
            return (
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
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
                <div className="space-y-2 flex-1">
                  {arcs.map(a => (
                    <div key={a.key} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color }} />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex-1">{a.label}</span>
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{statusCounts[a.key] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quick Actions</h3>
          <span className="text-[11px] text-slate-400 font-medium">Navigate to sales tools</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.to)}
              className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105', action.color)}>
                  {action.icon}
                </div>
                <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 mt-1" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">{action.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Estimates + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Estimates */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Estimates</h3>
            </div>
            <button onClick={() => navigate('/sales/estimates')} className="text-[11px] font-bold text-[#0056D2] dark:text-blue-400 hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            {estimates.length === 0 ? (
              <div className="py-10 text-center">
                <ClipboardList size={28} className="text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 dark:text-slate-500">No estimates yet</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estimate #</th>
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Amount</th>
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {estimates.slice(0, 5).map((est) => (
                    <tr key={est.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <button onClick={() => navigate(`/sales/estimates?id=${est.id}`)} className="text-[13px] font-bold text-slate-800 dark:text-slate-200 hover:text-[#0056D2] dark:hover:text-blue-400 transition-colors font-mono">
                          {est.estimateNumber ?? est.id}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[13px] text-slate-600 dark:text-slate-400">{est.customerName || '\u2014'}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 tabular-nums">{fmt(getTotal(est))}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusBadge status={est.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Sales Activity Table */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Invoices</h3>
            </div>
            <button onClick={() => navigate('/sales/invoices')} className="text-[11px] font-bold text-[#0056D2] dark:text-blue-400 hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="w-6 h-6 border-2 border-[#0056D2] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-10 text-center">
                <FileText size={28} className="text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 dark:text-slate-500">No recent sales activity</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice #</th>
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Amount</th>
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {invoices.slice((page - 1) * 10, page * 10).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <button onClick={() => navigate(`/sales/invoices?id=${inv.id}`)} className="text-[13px] font-bold text-slate-800 dark:text-slate-200 hover:text-[#0056D2] dark:hover:text-blue-400 transition-colors font-mono">
                          {inv.invoiceNumber}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[13px] text-slate-600 dark:text-slate-400">{inv.customerName || '\u2014'}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 tabular-nums">{fmtCurrency(inv.total || 0)}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {total > 10 && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
                <Pagination page={page} total={total} pageSize={10} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Customers Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Top Customers</h3>
        </div>
        {topCustomers.length === 0 ? (
          <div className="py-8 text-center">
            <Users size={24} className="text-slate-200 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500">No customer data yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {topCustomers.map((cust) => (
              <div key={cust.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-black shrink-0 ring-1 ring-slate-200/50 dark:ring-slate-600/30">
                  {customerInitials(cust.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{cust.name}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{cust.invoiceCount} invoice{cust.invoiceCount !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 tabular-nums shrink-0">{fmtCurrency(cust.totalRevenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppPage>
  );
};

export default Sales;
