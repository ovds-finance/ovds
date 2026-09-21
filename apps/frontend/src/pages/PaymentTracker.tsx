/**
 * PaymentTracker — ovds-style payment monitoring
 * AppPage · AppKpi · AppTable · useApiCrud
 * Track outstanding payments, overdue alerts, collection pipeline
 */
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard, RefreshCw, Download, AlertTriangle,
  Clock, Calendar, ShieldCheck, ChevronDown,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import { PaymentVerificationPanel } from '../components/ovds';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, SearchBar, EmptyState, Pagination, Amount,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';
import { fmtETB } from '../utils/ethiopianTax';

interface PaymentItem {
  id: string;
  type: 'INVOICE' | 'BILL';
  number: string;
  partyName: string;
  amount: number;
  paidAmount?: number;
  dueDate: string;
  status: string;
  daysOverdue?: number;
  companyId?: string;
}

type FilterTab = 'ALL' | 'OVERDUE' | 'DUE_SOON' | 'INVOICES' | 'BILLS';

const PaymentTracker: React.FC = () => {
  usePageTitle('Payment Tracker');
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [showVerify, setShowVerify] = useState(false);
  const PAGE_SIZE = 25;

  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['payment-tracker', selectedCompanyId, page],
    queryFn: async () => {
      const params = selectedCompanyId ? `?companyId=${selectedCompanyId}&page=${page}&limit=${PAGE_SIZE}` : `?page=${page}&limit=${PAGE_SIZE}`;
      // Fetch both invoices and bills in parallel
      const [invRes, billRes] = await Promise.all([
        api.get(`/ovds/invoices${params}&status=PENDING,OVERDUE`).then((r: any) => r.data).catch(() => null),
        api.get(`/ovds/bills${params}&status=PENDING,OVERDUE`).then((r: any) => r.data).catch(() => null),
      ]);
      const invs: PaymentItem[] = (Array.isArray(invRes?.data?.invoices) ? invRes.data.invoices : Array.isArray(invRes?.data) ? invRes.data : []).map((i: any) => ({
        id: i.id, type: 'INVOICE' as const,
        number: i.invoiceNumber ?? i.number ?? '',
        partyName: i.customer ?? i.customerName ?? '',
        amount: Number(i.total ?? i.totalAmount ?? 0),
        paidAmount: Number(i.paidAmount ?? 0),
        dueDate: i.dueDate ?? i.date,
        status: i.status,
        daysOverdue: i.dueDate ? Math.max(0, Math.floor((Date.now() - new Date(i.dueDate).getTime()) / 86400000)) : 0,
      }));
      const bills: PaymentItem[] = (Array.isArray(billRes?.data) ? billRes.data : []).map((b: any) => ({
        id: b.id, type: 'BILL' as const,
        number: b.billNumber ?? '',
        partyName: b.vendor ?? b.vendorName ?? '',
        amount: Number(b.total ?? b.amount ?? 0),
        paidAmount: 0,
        dueDate: b.dueDate ?? b.date,
        status: b.status,
        daysOverdue: b.dueDate ? Math.max(0, Math.floor((Date.now() - new Date(b.dueDate).getTime()) / 86400000)) : 0,
      }));
      return [...invs, ...bills].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    },
    staleTime: 30_000,
  });

  const rows: PaymentItem[] = useMemo(() => {
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [raw]);

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'OVERDUE')   list = list.filter(r => r.status === 'OVERDUE' || (r.daysOverdue ?? 0) > 0);
    if (tab === 'DUE_SOON')  list = list.filter(r => {
      const days = Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / 86400000);
      return days >= 0 && days <= 7;
    });
    if (tab === 'INVOICES')  list = list.filter(r => r.type === 'INVOICE');
    if (tab === 'BILLS')     list = list.filter(r => r.type === 'BILL');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => [r.number, r.partyName].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => {
    const overdue   = rows.filter(r => r.status === 'OVERDUE' || (r.daysOverdue ?? 0) > 0);
    const dueSoon   = rows.filter(r => { const d = Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / 86400000); return d >= 0 && d <= 7; });
    const totalAR   = rows.filter(r => r.type === 'INVOICE').reduce((s, r) => s + r.amount, 0);
    const totalAP   = rows.filter(r => r.type === 'BILL').reduce((s, r) => s + r.amount, 0);
    return [
      { label: 'Overdue',   value: overdue.length,   color: 'rose' as const },
      { label: 'Due Soon',  value: dueSoon.length,   color: 'amber' as const },
      { label: 'AR Total',  value: fmtETB(totalAR),  color: 'green' as const },
      { label: 'AP Total',  value: fmtETB(totalAP),  color: 'violet' as const },
    ];
  }, [rows]);

  const handleExport = () => {
    const headers = 'Type,Number,Party,Amount,Due Date,Days Overdue,Status\n';
    const csvRows = filtered.map(r =>
      `"${r.type}","${r.number}","${r.partyName}",${r.amount},"${r.dueDate}",${r.daysOverdue ?? 0},"${r.status}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `payment-tracker-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="Payment Tracker"
      subtitle="Outstanding invoices & bills · Overdue alerts · Collection pipeline · Banking & ovds · Retail & E-commerce · Revenue · Market Share · Consumer Insights"
      icon={<CreditCard size={18} />}
      crumbs={[{ label: 'Payment Tracker' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',      label: 'All',       count: rows.length },
            { key: 'OVERDUE',  label: 'Overdue',   count: rows.filter(r => r.status === 'OVERDUE' || (r.daysOverdue ?? 0) > 0).length },
            { key: 'DUE_SOON', label: 'Due Soon',  count: rows.filter(r => { const d = Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / 86400000); return d >= 0 && d <= 7; }).length },
            { key: 'INVOICES', label: 'Invoices',  count: rows.filter(r => r.type === 'INVOICE').length },
            { key: 'BILLS',    label: 'Bills',     count: rows.filter(r => r.type === 'BILL').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => refetch()}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
        </>
      }
    >
      <AppKpi cells={kpiCells} />

      {/* -- Payment Verification -------------------------------------------- */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowVerify(v => !v)}
          className="flex items-center gap-2 w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-left hover:border-[var(--pro-azure-light)] hover:bg-[var(--pro-azure-50)]/30 transition-all group"
        >
          <div className="w-6 h-6 rounded-lg bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] flex items-center justify-center shrink-0">
            <ShieldCheck size={13} className="text-[var(--pro-azure)]" />
          </div>
          <span className="text-[12px] font-semibold text-slate-700 flex-1">
            Verify Customer Payment
          </span>
          <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">
            CBE Birr · Telebirr · Awash · Dashen · Amole
          </span>
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform duration-200 ${showVerify ? 'rotate-180' : ''}`}
          />
        </button>

        {showVerify && (
          <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <PaymentVerificationPanel
              currency="ETB"
              onVerified={() => refetch()}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search payments…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} items</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Type</AppTh>
          <AppTh>Number</AppTh>
          <AppTh>Party</AppTh>
          <AppTh align="right">Amount</AppTh>
          <AppTh>Due Date</AppTh>
          <AppTh>Overdue</AppTh>
          <AppTh>Status</AppTh>
        </tr></thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={7} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={7}><EmptyState icon={<CreditCard size={18} />} title="No outstanding payments" desc="All invoices and bills are settled" /></td></tr>
          ) : filtered.map(r => {
            const isOverdue = (r.daysOverdue ?? 0) > 0;
            const dueDays   = Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / 86400000);
            return (
              <AppTr key={`${r.type}-${r.id}`}>
                <AppTd>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${r.type === 'INVOICE' ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                    {r.type}
                  </span>
                </AppTd>
                <AppTd><span className="font-mono text-[11px] font-semibold text-slate-800">{r.number}</span></AppTd>
                <AppTd>
                  <span className="text-[12px] text-slate-700">
                    {typeof r.partyName === 'object' ? (r.partyName as any)?.name : r.partyName}
                  </span>
                </AppTd>
                <AppTd align="right"><Amount value={r.amount} size="sm" /></AppTd>
                <AppTd>
                  <div className={`flex items-center gap-1 text-[10px] font-mono ${isOverdue ? 'text-rose-600' : dueDays <= 7 ? 'text-amber-600' : 'text-slate-600'}`}>
                    <Calendar size={9} className="text-slate-300" />
                    {new Date(r.dueDate).toLocaleDateString()}
                  </div>
                </AppTd>
                <AppTd>
                  {isOverdue ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600">
                      <AlertTriangle size={10} /> {r.daysOverdue}d
                    </div>
                  ) : dueDays <= 7 ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                      <Clock size={10} /> {dueDays}d left
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300">—</span>
                  )}
                </AppTd>
                <AppTd><StatusBadge status={r.status} /></AppTd>
              </AppTr>
            );
          })}
        </tbody>
      </AppTable>
      {rows.length > PAGE_SIZE && (
        <div className="mt-3"><Pagination page={page} total={rows.length} pageSize={PAGE_SIZE} onChange={setPage} /></div>
      )}
    </AppPage>
  );
};

export default PaymentTracker;
