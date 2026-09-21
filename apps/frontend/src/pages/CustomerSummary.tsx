import { StatsCard } from '@ovds/ui';
import {
  DollarSign, AlertCircle, FileText, Users, ShieldCheck,
  Download, CreditCard, ArrowLeft, Star, BarChart3,
  Search, ChevronRight, Phone, Mail,
  TrendingUp, CheckCircle2, Info, Clock,
  StickyNote, Edit2,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { useBusiness } from '../context/businessContext';
import { useAuditLog } from '../hooks/useAuditLog';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';
import { downloadCSV } from '../utils/download';
import { fmtCurrency, fmtDate } from '../utils/fmt';


interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tin?: string;
  notes?: string;
  paymentTerms?: string;
  createdAt: string;
  creditScore?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE';
  totalAmount: number;
  dueDate: string;
}

type TabId = 'invoices' | 'payments' | 'statements';

const STATUS_BADGE: Record<string, string> = {
  PAID:    'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
  OVERDUE: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  DRAFT:   'bg-white text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

const TIER_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  PLATINUM: { bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30', text: 'text-[var(--pro-azure-dark)] dark:text-green-300', border: 'border-[var(--pro-azure-100)] dark:border-green-800', dot: 'bg-[var(--pro-azure-50)]0' },
  GOLD:     { bg: 'bg-amber-50 dark:bg-amber-950/30',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-200 dark:border-amber-800',   dot: 'bg-amber-400' },
  SILVER:   { bg: 'bg-white dark:bg-slate-800/60',   text: 'text-slate-600 dark:text-slate-300',   border: 'border-slate-200 dark:border-slate-700',   dot: 'bg-slate-400' },
  BRONZE:   { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-400' },
};

// -- Avatar --------------------------------------------------------------------
const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ name, size = 'md' }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = [
    'from-violet-500 to-purple-600', 'from-green-500 to-green-600',
    'from-green-500 to-green-600',  'from-orange-500 to-amber-600',
    'from-rose-500 to-pink-600',     'from-cyan-500 to-sky-600',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const cls = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-24 h-24 text-2xl',
  }[size];
  
  return (
    <div className={`${cls} bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-white font-black shrink-0 shadow-lg border-4 border-white dark:border-slate-900`}>
      {initials}
    </div>
  );
};

// -- Stat Card -----------------------------------------------------------------
// -- Customer List View --------------------------------------------------------
const CustomerListView: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    api.get(`/ovds/customers/registry?companyId=${companyId}&limit=100`)
      .then((r: any) => {
        const raw = r.data?.data?.data ?? r.data?.data ?? r.data;
        setCustomers(Array.isArray(raw) ? raw : []);
      })
      .catch(() => toast.error('Failed to load customers'))
      .finally(() => setLoading(false));
  }, [companyId]);

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.tin ?? '').includes(search),
  );

  const getTier = (score = 0) =>
    score >= 80 ? 'PLATINUM' : score >= 60 ? 'GOLD' : score >= 40 ? 'SILVER' : 'BRONZE';

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 ovds-panel p-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Customer Analytics</h1>
          <p className="text-sm text-slate-400 font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={14} className="text-[var(--pro-azure)]" />
            Performance & Engagement History
          </p>
        </div>
        <Link to="/customers" className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-white transition-all shadow-sm active:scale-95">
          <Users size={18} strokeWidth={2.5} /> Manage Registry
        </Link>
      </div>

      <div className="relative group">
        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--pro-azure)] transition-colors" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by name, email, or TIN…"
          className="w-full pl-12 pr-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all dark:text-slate-100"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="ovds-panel p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ovds-panel p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6">
            <Users size={48} className="text-slate-200" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{search ? 'Zero Matches Found' : 'Registry is Empty'}</p>
          <p className="text-sm text-slate-400 mt-3 max-w-sm mx-auto font-bold uppercase tracking-widest">Add customers to begin tracking statements and activity.</p>
          <Link to="/customers" className="mt-10 px-8 py-4 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-2xl text-sm font-black shadow-xl shadow-green-500/30 transition-all active:scale-95">Add First Customer</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(c => {
            const tier = getTier(c.creditScore);
            const t = TIER_MAP[tier];
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/customer-summary/${c.id}`)}
                className="text-left ovds-panel p-5 hover:border-[var(--pro-azure-light)] dark:hover:border-green-700 hover:shadow-md transition-all group relative overflow-hidden active:scale-[0.99]"
              >
                <div className="flex items-start gap-4">
                  <Avatar name={c.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-[var(--pro-azure)] transition-colors tracking-tight">{c.name}</p>
                    {c.email && <p className="text-xs font-bold text-slate-400 truncate mt-1 uppercase tracking-wider">{c.email}</p>}
                    {c.tin && (
                      <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1.5 uppercase tracking-widest">
                        <ShieldCheck size={12} strokeWidth={3} /> TIN {c.tin}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={20} className="text-slate-200 group-hover:text-[var(--pro-azure)] shrink-0 mt-1.5 transition-colors" />
                </div>
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${t.bg} ${t.text} border ${t.border} shadow-sm`}>
                    <Star size={10} className="fill-current" strokeWidth={3} /> {tier}
                  </span>
                  {(c.creditScore ?? 0) > 0 && (
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Credit Score</p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-200 tracking-tight">{c.creditScore}</p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// -- Detail View ---------------------------------------------------------------
const CustomerDetailView: React.FC<{ id: string }> = ({ id }) => {
  const { logExport } = useAuditLog();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('invoices');
  const [stats, setStats] = useState({ totalInvoices: 0, totalRevenue: 0, overdueCount: 0, avgDaysToPay: 0, totalPaid: 0, totalOutstanding: 0 });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [custRes, invRes] = await Promise.all([
        api.get(`/ovds/customers/registry/${id}`),
        api.get(`/ovds/invoices?customer=${encodeURIComponent(id)}&limit=100`),
      ]);
      const cust = custRes.data?.data ?? custRes.data;
      setCustomer(cust);
      const invRaw = invRes.data?.data?.data ?? invRes.data?.data ?? invRes.data ?? [];
      const invs: Invoice[] = Array.isArray(invRaw) ? invRaw : [];
      setInvoices(invs);
      setPayments(invs.flatMap((inv: any) => (inv.payments ?? []).map((p: any) => ({ ...p, invoiceNumber: inv.invoiceNumber, invoiceId: inv.id }))));
      const overdue = invs.filter((i: any) => i.status === 'OVERDUE').length;
      const totalRevenue = invs.reduce((s: number, i: any) => s + Number(i.totalAmount), 0);
      const totalPaid = invs.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + Number(i.totalAmount), 0);
      const totalOutstanding = invs.filter((i: any) => ['PENDING', 'OVERDUE'].includes(i.status)).reduce((s: number, i: any) => s + Number(i.totalAmount), 0);
      const paidInvs = invs.filter((i: any) => i.status === 'PAID' && i.paidAt && i.date);
      const avgDaysToPay = paidInvs.length ? Math.round(paidInvs.reduce((s: number, i: any) => s + (new Date(i.paidAt).getTime() - new Date(i.date).getTime()) / 86_400_000, 0) / paidInvs.length) : 0;
      setStats({ totalInvoices: invs.length, totalRevenue, overdueCount: overdue, avgDaysToPay, totalPaid, totalOutstanding });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="h-10 w-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
      <div className="ovds-panel p-8">
        <div className="flex items-center gap-8 mb-10">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="space-y-4 flex-1">
            <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-72" />
            <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-xl w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );

  if (!customer) return (
    <div className="flex flex-col items-center justify-center py-40 text-center">
      <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/10 rounded-2xl flex items-center justify-center mb-6">
        <AlertCircle size={48} className="text-rose-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Profile Not Found</h2>
      <p className="text-sm text-slate-400 font-bold mt-2 uppercase tracking-widest">The requested identity does not exist in our registry.</p>
      <Link to="/customers/summary" className="mt-10 px-8 py-4 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl text-sm font-black shadow-xl active:scale-95 transition-all">Back to List</Link>
    </div>
  );

  const fmt = (n: number) => fmtCurrency(n, 'ETB');
  const creditScore = customer.creditScore ?? 0;
  const tier = creditScore >= 80 ? 'PLATINUM' : creditScore >= 60 ? 'GOLD' : creditScore >= 40 ? 'SILVER' : 'BRONZE';
  const totalVat = invoices.reduce((s, i: any) => s + Number(i.vatAmount || 0), 0);
  const totalTaxable = stats.totalRevenue - totalVat;
  const totalWht = totalTaxable * 0.03;
  const now = new Date();
  const aging = {
    current: invoices.filter((i: any) => ['PENDING','OVERDUE'].includes(i.status) && new Date(i.dueDate) >= now),
    d30:     invoices.filter((i: any) => ['PENDING','OVERDUE'].includes(i.status) && new Date(i.dueDate) < now && now.getTime() - new Date(i.dueDate).getTime() <= 30*86400000),
    d60:     invoices.filter((i: any) => ['PENDING','OVERDUE'].includes(i.status) && now.getTime() - new Date(i.dueDate).getTime() > 30*86400000 && now.getTime() - new Date(i.dueDate).getTime() <= 60*86400000),
    over60:  invoices.filter((i: any) => ['PENDING','OVERDUE'].includes(i.status) && now.getTime() - new Date(i.dueDate).getTime() > 60*86400000),
  };
  const agingSum = (arr: any[]) => arr.reduce((s: number, i: any) => s + Number(i.totalAmount), 0);

  const exportERCA = () => {
    const rows = [
      ['Customer ERCA Statement','','','','',''],
      [`Customer: ${customer.name}`,'','','','',''],
      [`TIN: ${customer.tin || 'N/A'}`,'','','','',''],
      [`Generated: ${new Date().toLocaleDateString('en-ET')}`,'','','','',''],
      ['','','','','',''],
      ['Invoice No.','Date','Status','Taxable (ETB)','VAT (ETB)','Total (ETB)'],
      ...invoices.map((i: any) => {
        const vat = Number(i.vatAmount || 0);
        const total = Number(i.totalAmount || 0);
        return [i.invoiceNumber, i.date, i.status, (total - vat).toFixed(2), vat.toFixed(2), total.toFixed(2)];
      }),
      ['','','','','',''],
      ['TOTALS','','', totalTaxable.toFixed(2), totalVat.toFixed(2), stats.totalRevenue.toFixed(2)],
    ];
    downloadCSV(rows.map(r => r.join(',')).join('\n'), `ERCA_${customer.name}_${new Date().toISOString().slice(0,10)}.csv`);
    logExport('ERCA Statement', 'csv');
    toast.success('ERCA Compliance Report Exported');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Detail Header & Profile */}
      <div className="ovds-widget-card p-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--pro-azure-50)] rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <Avatar name={customer.name} size="xl" />
            <div className="text-center sm:text-left pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{customer.name}</h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] ${TIER_MAP[tier].bg} ${TIER_MAP[tier].text} border ${TIER_MAP[tier].border} shadow-sm`}>
                    <Star size={12} className="fill-current" strokeWidth={3} /> {tier}
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                    ID: {customer.id.slice(0, 8)}
                  </span>
                </div>
              </div>
              
              <div className="ovds-grid-layout cols-3 gap-lg mt-8">
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--pro-azure-50)] dark:bg-green-900/20 rounded-xl flex items-center justify-center text-[var(--pro-azure)] shadow-sm">
                      <Mail size={18} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Contact</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate">{customer.email}</p>
                    </div>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--pro-azure-50)] dark:bg-green-900/20 rounded-xl flex items-center justify-center text-[var(--pro-azure)] shadow-sm">
                      <Phone size={18} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Line</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate">{customer.phone}</p>
                    </div>
                  </div>
                )}
                {customer.tin && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
                      <ShieldCheck size={18} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tax Identity (TIN)</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight">{customer.tin}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <button 
              onClick={exportERCA}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Download size={18} strokeWidth={3} /> Compliance Export
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/customers?id=' + customer.id)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <Edit2 size={16} strokeWidth={2.5} /> Edit
              </button>
              <button 
                onClick={() => navigate('/customers/summary')}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <ArrowLeft size={16} strokeWidth={2.5} /> Back
              </button>
            </div>
          </div>
        </div>

        {/* -- Summary Stats Grid -- */}
        <div className="ovds-grid-layout cols-4 gap-lg mt-12 pt-10 border-t border-slate-100 dark:border-slate-800">
          <StatsCard
            label="Gross Revenue"
            value={fmt(stats.totalRevenue)}
            color="indigo"
            trendLabel="MTD"
          />
          <StatsCard
            label="Total Receipts"
            value={fmt(stats.totalPaid)}
            color="indigo"
          />
          <StatsCard
            label="Outstanding AR"
            value={fmt(stats.totalOutstanding)}
            color="amber"
          />
          <StatsCard
            label="Collection Risk"
            value={stats.overdueCount}
            color="red"
          />
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-8">
        <div className="ovds-tab-nav border-b border-slate-100 dark:border-slate-800">
          {(['invoices', 'payments', 'statements'] as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`ovds-tab relative ${activeTab === tab ? 'active' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'invoices' && stats.overdueCount > 0 && (
                <span className="ml-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] inline-flex items-center justify-center rounded-full font-bold">
                  {stats.overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="animate-in fade-in duration-500">
          {/* -- INVOICES TAB -- */}
          {activeTab === 'invoices' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            {invoices.length === 0 ? (
              <div className="py-24 text-center">
                <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase">No invoices yet</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-tighter font-bold">Transactions will appear here once invoiced.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="ovds-table w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-5 ovds-label">Number</th>
                      <th className="px-6 py-5 ovds-label">Date</th>
                      <th className="px-6 py-5 ovds-label text-right">Amount</th>
                      <th className="px-6 py-5 ovds-label">Due / Aging</th>
                      <th className="px-6 py-5 ovds-label text-center">Status</th>
                      <th className="px-6 py-5 ovds-label text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {invoices.map(inv => {
                      const daysOverdue = new Date(inv.dueDate) < new Date() && inv.status !== 'PAID' ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000) : 0;
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => navigate(`/sales/invoices?id=${inv.id}`)}>
                          <td className="px-6 py-4 font-mono text-xs font-black text-slate-800 dark:text-slate-100">#{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(inv.date)}</td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white whitespace-nowrap text-sm">{fmt(inv.totalAmount)}</td>
                          <td className="px-6 py-4 text-xs whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-500 dark:text-slate-400">{fmtDate(inv.dueDate)}</span>
                              {daysOverdue > 0 && <span className="text-[10px] text-rose-600 dark:text-rose-400 font-black uppercase tracking-tighter mt-0.5">{daysOverdue} days overdue</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_BADGE[inv.status]}`}>{inv.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-[var(--pro-azure)] transition-transform group-hover:translate-x-1" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -- PAYMENTS TAB -- */}
        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            {payments.length === 0 ? (
              <div className="py-24 text-center">
                <CreditCard size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase">No payments yet</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-tighter font-bold">When the customer pays an invoice, it will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="ovds-table w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-5 ovds-label">Invoice</th>
                      <th className="px-6 py-5 ovds-label">Date</th>
                      <th className="px-6 py-5 ovds-label">Method</th>
                      <th className="px-6 py-5 ovds-label text-right">Amount</th>
                      <th className="px-6 py-5 ovds-label">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {payments.map((p: any, i: number) => (
                      <tr key={p.id ?? i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-black text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">#{p.invoiceNumber}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(p.paidAt || p.date)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">{p.method || 'Bank Transfer'}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] whitespace-nowrap text-sm">{fmt(p.amount)}</td>
                        <td className="px-6 py-4 text-[10px] text-slate-400 font-mono tracking-widest uppercase">{p.reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -- STATEMENTS/FINANCIALS TAB -- */}
        {activeTab === 'statements' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="ovds-grid-layout cols-4">
              {[
                { label: 'Total Sales', value: fmt(stats.totalRevenue),    color: 'text-slate-900 dark:text-white',   bg: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' },
                { label: 'Receipts',    value: fmt(stats.totalPaid),       color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]', bg: 'bg-[var(--pro-azure-50)]/30 dark:bg-green-950/20 border-[var(--pro-azure-100)] dark:border-green-800' },
                { label: 'Open AR',     value: fmt(stats.totalOutstanding), color: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-100 dark:border-rose-800' },
                { label: 'VAT Output',  value: fmt(totalVat),              color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]', bg: 'bg-[var(--pro-azure-50)]/30 dark:bg-green-950/20 border-[var(--pro-azure-100)] dark:border-green-800' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} border rounded-3xl p-6 shadow-sm`}>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-rose-600 rounded-full" />
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">ERCA Tax Compliance</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Automated Tax Calculation Summary</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-rose-50 dark:bg-rose-950/30 rounded-full border border-rose-100 dark:border-rose-900 text-[9px] font-black text-rose-600 uppercase tracking-widest">
                  Compliance Audit
                </div>
              </div>
              <div className="ovds-grid-layout cols-3 gap-lg">
                {[
                  { label: 'Taxable Base', value: fmt(totalTaxable), icon: <TrendingUp size={18} />, color: 'text-slate-900 dark:text-white' },
                  { label: 'VAT 15%',      value: fmt(totalVat),     icon: <ShieldCheck size={18} />, color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' },
                  { label: 'WHT 3%',       value: fmt(totalWht),     icon: <Info size={18} />,        color: 'text-rose-600 dark:text-rose-400' },
                ].map(r => (
                  <div key={r.label} className="p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-700/50 transition-all hover:border-slate-200">
                    <div className="flex items-center gap-2 text-slate-400 mb-3">
                      {r.icon}
                      <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                    </div>
                    <p className={`text-2xl font-black ${r.color}`}>{r.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-[var(--pro-azure-50)]0 rounded-full" />
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">AR Aging Analysis</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Receivable risk assessment by duration</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Current',    items: aging.current, color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]', bg: 'bg-[var(--pro-azure-50)]/50 dark:bg-green-950/10 border-[var(--pro-azure-100)]' },
                  { label: '1–30 Days',  items: aging.d30,     color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100' },
                  { label: '31–60 Days', items: aging.d60,     color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-50/50 dark:bg-orange-950/10 border-orange-100' },
                  { label: '60+ Days',   items: aging.over60,  color: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100' },
                ].map(b => (
                  <div key={b.label} className={`ovds-panel p-4 transition-all hover:shadow-md ${b.bg} dark:border-slate-800`}>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{b.label}</p>
                    <p className={`text-xl font-black ${b.color}`}>{fmt(agingSum(b.items))}</p>
                    <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      <FileText size={12} /> {b.items.length} Documents
                    </div>
                  </div>
                ))}
              </div>
              {stats.avgDaysToPay > 0 && (
                <div className="mt-6 p-4 ovds-panel flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--pro-azure-100)] rounded-2xl flex items-center justify-center">
                      <Clock size={20} className="text-[var(--pro-azure-light)]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Average Collection Time</p>
                      <p className="text-sm font-bold text-slate-100">
                        Typically takes <span className="text-[var(--pro-azure-light)] font-black">{stats.avgDaysToPay} days</span> to collect from this customer.
                      </p>
                    </div>
                  </div>
                  {stats.avgDaysToPay > 30 && (
                    <div className="px-4 py-2 bg-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                      Performance Risk
                    </div>
                  )}
                </div>
              )}
            </div>

            {customer.notes && (
              <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-3xl p-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pro-azure-50)] rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 text-slate-400 mb-4 font-black uppercase tracking-widest text-[11px]">
                    <div className="w-1.5 h-4 bg-[var(--pro-azure-50)]0 rounded-full" />
                    <StickyNote size={16} /> Intelligence & Notes
                  </div>
                  <p className="text-base font-medium text-slate-300 whitespace-pre-wrap leading-relaxed opacity-90">{customer.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
        </div> {/* end animate-in fade-in */}
      </div>
    </div>
  );
};

// -- Root Component ------------------------------------------------------------
const CustomerSummary: React.FC = () => {
  usePageTitle('Customer Summary');
  const { id } = useParams<{ id: string }>();
  const { selectedCompanyId } = useBusiness();

  if (!id) return <CustomerListView companyId={selectedCompanyId ?? undefined} />;
  return <CustomerDetailView id={id} />;
};

export default CustomerSummary;




