import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Send, AlertTriangle, Clock, DollarSign, TrendingUp,
  RefreshCw, Mail, Search, ChevronRight, X, Filter,
  CalendarDays, User, FileText,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import {
  AppPage, Btn, MetricCard, Skeleton, cn,
} from '../components/ui';
import {
  useOverdueInvoices,
  useSendReminder,
} from '@ovds/features/sales';

interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  totalAmount: number;
  daysOverdue: number;
  currency: string;
  paymentTerms: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2 }).format(n);

const Collections: React.FC = () => {
  usePageTitle('Collections');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const navigate = useNavigate();

  const { data: overdue, loading: overdueLoading, refetch: refetchOverdue } = useOverdueInvoices(selectedCompanyId);
  const { sendReminder, sending } = useSendReminder();

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minDays, setMinDays] = useState('');

  const filteredOverdue = useMemo(() => {
    if (!overdue?.invoices) return [];
    let list = overdue.invoices;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((inv: OverdueInvoice) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q)
      );
    }
    if (minDays) {
      const days = parseInt(minDays, 10);
      list = list.filter((inv: OverdueInvoice) => inv.daysOverdue >= days);
    }
    return list;
  }, [overdue, search, minDays]);

  const handleSendReminder = async (invoiceId: string, escalate = false) => {
    const result = await sendReminder(invoiceId, escalate);
    if (result) {
      toast.success(result.message);
      refetchOverdue();
    }
  };

  const stats = useMemo(() => {
    if (!overdue?.invoices) return { total: 0, totalAmount: 0, avgDays: 0, critical: 0 };
    const total = overdue.invoices.length;
    const totalAmount = overdue.invoices.reduce((s, i) => s + i.totalAmount, 0);
    const avgDays = total > 0 ? Math.round(overdue.invoices.reduce((s, i) => s + i.daysOverdue, 0) / total) : 0;
    const critical = overdue.invoices.filter((i) => i.daysOverdue > 30).length;
    return { total, totalAmount, avgDays, critical };
  }, [overdue]);

  const clearFilters = () => { setSearch(''); setMinDays(''); };

  return (
    <AppPage
      title="Collections"
      subtitle="Track overdue invoices, manage payment reminders, and monitor AR aging"
      icon={<DollarSign size={18} />}
      iconBg="bg-rose-600"
      actions={
        <div className="flex items-center gap-2">
          <Btn variant="ghost" icon={<RefreshCw size={11} />} onClick={() => { refetchOverdue(); }}>Refresh</Btn>
          {can('invoices:write') && (
            <Btn variant="primary" icon={<Send size={12} />} onClick={() => navigate('/sales/invoices')}>
              New Invoice
            </Btn>
          )}
        </div>
      }
    >
      {/* KPI Strip */}
      {(overdueLoading) ? (
        <Skeleton.StatsRow count={4} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <MetricCard title="Overdue Invoices" amount={stats.total.toString()} percentage={0} isPositive={stats.total === 0} variant="highlight-rose" />
          <MetricCard title="Total Overdue" amount={fmt(stats.totalAmount)} percentage={0} isPositive={false} variant="highlight-amber" />
          <MetricCard title="Avg Days Overdue" amount={`${stats.avgDays} days`} percentage={0} isPositive={stats.avgDays <= 14} variant="highlight-sky" />
          <MetricCard title="Critical (>30d)" amount={stats.critical.toString()} percentage={0} isPositive={stats.critical === 0} variant="highlight-red" />
        </div>
      )}

      {/* Toolbar */}
      <div className="ovds-toolbar rounded-2xl mt-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative group">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices or customers..."
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-bold outline-none focus:ring-4 focus:ring-rose-400/10 focus:border-rose-400 w-56 transition-all"
            />
          </div>

          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[12px] font-bold transition-all',
              showFilters || minDays
                ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 hover:border-slate-300',
            )}
          >
            <Filter size={13} />
            Filters
            {minDays && <span className="ml-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">1</span>}
          </button>

          {(search || minDays) && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <X size={11} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2">
              <CalendarDays size={13} className="text-slate-400" />
              <span className="text-[11px] text-slate-500 font-bold">Min days overdue:</span>
              <input
                type="number"
                value={minDays}
                onChange={(e) => setMinDays(e.target.value)}
                placeholder="0"
                className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12px] font-bold outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Overdue Table */}
      <div className="ovds-doc-shell mt-4">
        {overdueLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOverdue.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText size={40} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">No overdue invoices found</p>
            <p className="text-xs text-slate-400 mt-1">All invoices are paid or up to date.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm">
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Days Overdue</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Terms</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOverdue.map((inv: OverdueInvoice) => (
                <tr
                  key={inv.id}
                  className={cn(
                    'border-b border-slate-50 dark:border-slate-700/50 transition-colors group cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  )}
                  onClick={() => navigate(`/sales/invoices?id=${inv.id}`)}
                >
                  <td className="px-4 py-3.5">
                    <p className="text-[12px] font-mono font-bold text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-orange-100 dark:from-rose-900/40 dark:to-orange-900/40 text-rose-700 dark:text-rose-400 flex items-center justify-center text-[9px] font-black shrink-0 ring-1 ring-rose-200/50 dark:ring-rose-700/30">
                        {inv.customerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{inv.customerName}</p>
                        {inv.customerEmail && <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5 truncate">{inv.customerEmail}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <p className="text-[12px] font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{fmt(inv.totalAmount)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                      inv.daysOverdue > 30 ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-800' :
                      inv.daysOverdue > 14 ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800' :
                      'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                    )}>
                      <Clock size={9} />
                      {inv.daysOverdue}d
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">{inv.paymentTerms || '—'}</td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {can('invoices:write') && (
                        <button
                          onClick={() => handleSendReminder(inv.id, false)}
                          disabled={sending}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/30 transition-all"
                          title="Send Reminder"
                        >
                          <Mail size={13} />
                        </button>
                      )}
                      {can('invoices:write') && (
                        <button
                          onClick={() => handleSendReminder(inv.id, true)}
                          disabled={sending}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 transition-all"
                          title="Escalate"
                        >
                          <AlertTriangle size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/sales/invoices?id=${inv.id}`)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 transition-all"
                        title="View Invoice"
                      >
                        <FileText size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button onClick={() => navigate('/sales/ar-aging')} className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">AR Aging Report</p>
              <p className="text-[11px] text-slate-500">Detailed aging buckets</p>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 ml-auto" />
          </div>
        </button>
        <button onClick={() => navigate('/customers')} className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Customer Profiles</p>
              <p className="text-[11px] text-slate-500">View debt profiles</p>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 ml-auto" />
          </div>
        </button>
        <button onClick={() => navigate('/sales/revenue-recognition')} className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Revenue Recognition</p>
              <p className="text-[11px] text-slate-500">IFRS 15 schedules</p>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 ml-auto" />
          </div>
        </button>
      </div>
    </AppPage>
  );
};

export default Collections;
