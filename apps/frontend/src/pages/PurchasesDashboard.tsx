import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2, Receipt, CreditCard,
  Clock, AlertTriangle, CheckCircle2, Plus,
  Download, DollarSign, FileText, TrendingUp,
  BarChart3, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiQuery, usePagination } from '../hooks';
import { OvdsPageHeader } from '../components/ovds';
import { downloadCSV } from '../utils/download';
import { fmtDate, fmtCurrency } from '../utils/fmt';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const fmt = (n: number) => fmtCurrency(n, 'ETB');

const PurchasesDashboard: React.FC = () => {
  usePageTitle('Purchases');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const pagination = usePagination({ initialTake: 10 });

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const dashboardUrl = selectedCompanyId ? `/ovds/purchases/dashboard?companyId=${selectedCompanyId}` : '/ovds/purchases/dashboard';
  const billsUrl = selectedCompanyId
    ? `/ovds/bills?companyId=${selectedCompanyId}&take=${pagination.take}&page=${pagination.page}${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}`
    : `/ovds/bills`;

  const {
    data: dashboardData,
    loading: dashboardLoading,
    refetch: fetchDashboard,
  } = useApiQuery<any>(dashboardUrl, {
    enabled: !!selectedCompanyId,
    pollInterval: 120_000,
  });

  const {
    data: billsData,
    loading: billsLoading,
  } = useApiQuery<any>(billsUrl, {
    enabled: !!selectedCompanyId,
    pollInterval: 120_000,
  });

  const stats = dashboardData?.data ?? dashboardData;

  const totalBills = stats?.bills?.total ?? 0;
  const pendingBills = stats?.bills?.pending ?? 0;
  const paidBills = stats?.bills?.paid ?? 0;
  const overdueBills = stats?.bills?.overdue ?? 0;
  const totalVendors = stats?.vendors?.total ?? 0;
  const activeVendors = stats?.vendors?.active ?? 0;
  const totalAmount = stats?.amounts?.total ?? 0;
  const paidAmount = stats?.amounts?.paid ?? 0;
  const overdueAmount = stats?.amounts?.overdue ?? 0;
  const totalPayments = stats?.payments?.total ?? 0;

  const topVendors = stats?.topVendors ?? [];
  const recentPayments = stats?.recentPayments ?? [];

  const recentBills = useMemo(() => billsData?.data ?? billsData?.data?.data ?? [], [billsData]);

  const filteredBills = useMemo(() => {
    let list = Array.isArray(recentBills) ? recentBills : [];
    if (statusFilter !== 'ALL') {
      list = list.filter((b: any) => b.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((b: any) =>
        (b.billNumber ?? '').toLowerCase().includes(q) ||
        (b.vendorName ?? '').toLowerCase().includes(q) ||
        (b.vendor?.name ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [recentBills, statusFilter, searchTerm]);

  const handleExport = () => {
    if (!filteredBills.length) return;
    const headers = 'Bill #,Vendor,Date,Due Date,Status,Total\n';
    const rows = filteredBills.map((b: any) =>
      `"${b.billNumber}","${typeof b.vendor === 'object' ? b.vendor?.name : b.vendor}","${fmtDate(b.date)}","${fmtDate(b.dueDate)}","${b.status}",${fmt(b.total)}`
    ).join('\n');
    downloadCSV(headers + rows, `bills_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Exported to CSV');
  };

  const kpiCards = [
    {
      label: 'Total Bills',
      value: fmt(totalAmount),
      sub: `${totalBills} bills`,
      icon: <Receipt size={18} />,
      color: 'text-slate-700',
      bg: 'bg-slate-100',
      onClick: () => window.location.href = '/purchases/bills',
    },
    {
      label: 'Pending',
      value: fmt(totalAmount - paidAmount - overdueAmount),
      sub: `${pendingBills} bills`,
      icon: <Clock size={18} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      onClick: () => window.location.href = '/purchases/bills?status=PENDING',
    },
    {
      label: 'Paid',
      value: fmt(paidAmount),
      sub: `${paidBills} bills`,
      icon: <CheckCircle2 size={18} />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      onClick: () => window.location.href = '/purchases/bills?status=PAID',
    },
    {
      label: 'Overdue',
      value: fmt(overdueAmount),
      sub: `${overdueBills} bills`,
      icon: <AlertTriangle size={18} />,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      onClick: () => window.location.href = '/purchases/bills?status=OVERDUE',
    },
    {
      label: 'Vendors',
      value: totalVendors,
      sub: `${activeVendors} active`,
      icon: <Building2 size={18} />,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      onClick: () => window.location.href = '/purchases/vendors',
    },
    {
      label: 'Payments',
      value: totalPayments,
      sub: 'Recorded',
      icon: <CreditCard size={18} />,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      onClick: () => window.location.href = '/purchases/payments',
    },
   ];

  const chartData = useMemo(() => {
    const raw = dashboardData?.data ?? dashboardData;
    const trend = raw?.monthlyTrend ?? raw?.monthly ?? [];
    if (!Array.isArray(trend) || trend.length === 0) return [];
    return trend.map((m: any) => ({
      name: m.month ?? m.name ?? '',
      Bills: m.bills ?? m.total ?? 0,
      Paid: m.paid ?? 0,
    }));
  }, [dashboardData]);

  return (
    <div className="min-h-full bg-white animate-in fade-in duration-300">
      <OvdsPageHeader
        title="Purchases"
        subtitle="Accounts Payable · Vendors · Bills · Payments · Supply Chain"
        icon={<DollarSign size={16} />}
        iconBg="bg-rose-500"
        onRefresh={fetchDashboard}
        loading={dashboardLoading}
        tabs={[
          { id: 'ALL', label: 'Overview', count: totalBills },
          { id: 'PENDING', label: 'Pending', count: pendingBills },
          { id: 'OVERDUE', label: 'Overdue', count: overdueBills },
          { id: 'PAID', label: 'Paid', count: paidBills },
        ]}
        activeTab={statusFilter}
        onTabChange={(id) => setStatusFilter(id as string)}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/purchases/aged-payables" className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
              <BarChart3 size={13} /> Aged Payables
            </Link>
            {can('bills:write') && (
              <Link to="/purchases/bills?action=new" className="ovds-btn-primary">
                <Plus size={14} /> New Bill
              </Link>
            )}
          </div>
        }
      />

      <div className="p-4 sm:p-5 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpiCards.map((kpi) => (
            <button
              key={kpi.label}
              onClick={kpi.onClick}
              className="group bg-white rounded-2xl border border-slate-200 p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bg}`}>
                  <span className={kpi.color}>{kpi.icon}</span>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-800 tabular-nums">{kpi.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>
            </button>
          ))}
        </div>

        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700">Spending Trend (6 Months)</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtCurrency(v, 'ETB', 0)} width={80} />
                <Tooltip
                  formatter={(v: any) => [fmtCurrency(Number(v), 'ETB'), '']}
                  contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2e8f0' }}
                />
                <Legend formatter={(v: string) => v === 'Bills' ? 'Bills Created' : 'Bills Paid'} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Bills" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Paid" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Vendors by Spend */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Building2 size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700">Top Vendors by Spend</h3>
            </div>
            {topVendors.length === 0 ? (
              <div className="py-8 text-center">
                <Building2 size={24} className="text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No vendor spend data yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {topVendors.map((v: any, i: number) => (
                  <div key={v.vendorId} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{v.vendorName}</p>
                      <p className="text-[10px] text-slate-400">{v.billCount} bills</p>
                    </div>
                    <span className="text-xs font-bold text-slate-800 tabular-nums">{fmt(v.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <CreditCard size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700">Recent Payments</h3>
            </div>
            {recentPayments.length === 0 ? (
              <div className="py-8 text-center">
                <CreditCard size={24} className="text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No payments recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                      <CreditCard size={14} className="text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {p.bill?.billNumber ?? '—'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {p.bill?.vendorName ?? 'Unknown'} · {(p.method ?? 'OTHER').replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800 tabular-nums">{fmt(p.amount)}</p>
                      <p className="text-[10px] text-slate-400">{fmtDate(p.paidAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700">Recent Bills</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bills..."
                className="w-40 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-slate-300"
              />
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <Download size={11} /> Export
              </button>
              <Link to="/purchases/bills" className="text-xs text-emerald-600 font-semibold hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            {billsLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <RefreshCw size={20} className="animate-spin text-slate-300" />
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="py-12 text-center">
                <FileText size={32} className="text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No recent bills</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bill</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBills.slice(0, 10).map((bill: any) => {
                    const isOverdue = bill.status === 'OVERDUE' || (bill.status !== 'PAID' && bill.dueDate && new Date(bill.dueDate) < new Date());
                    return (
                      <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <Link to={`/purchases/bills/${bill.id}`} className="text-xs font-bold text-slate-800 hover:text-emerald-600 transition-colors font-mono">
                            {bill.billNumber}
                          </Link>
                          <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(bill.date)}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-slate-600">
                            {typeof bill.vendor === 'object' ? bill.vendor?.name : bill.vendorName}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-xs font-bold text-slate-800 tabular-nums">{fmt(bill.total)}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                            bill.status === 'OVERDUE' ? 'bg-rose-50 text-rose-700' :
                            bill.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-50 text-slate-500'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                            {fmtDate(bill.dueDate)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasesDashboard;
