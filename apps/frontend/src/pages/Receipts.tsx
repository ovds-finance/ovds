/**
 * Receipts — ovds-style payment receipts
 * AppPage · AppKpi · AppTable · useApiCrud
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck, RefreshCw, Download,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import { fmtETB } from '../utils/ethiopianTax';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, SearchBar, EmptyState, Pagination, Amount,
} from '../components/ui';

interface Receipt {
  id: string;
  receiptNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerName?: string;
  amount: number;
  paymentMethod?: string;
  paidAt: string;
  status?: string;
  companyId?: string;
}

type FilterTab = 'ALL' | 'CASH' | 'BANK' | 'MOBILE';

const Receipts: React.FC = () => {
  usePageTitle('Receipts');
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const PAGE_SIZE = 25;

  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['receipts', selectedCompanyId, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (selectedCompanyId) params.set('companyId', selectedCompanyId);
      return api.get(`/ovds/receipts?${params}`).then((r: any) => r.data).catch(() => null);
    },
    staleTime: 30_000,
  });

  const rows: Receipt[] = useMemo(() => {
    const d = raw?.data ?? raw;
    return Array.isArray(d) ? d : (d?.data ?? []);
  }, [raw]);
  const total = raw?.total ?? rows.length;

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'CASH')   list = list.filter(r => r.paymentMethod === 'CASH');
    if (tab === 'BANK')   list = list.filter(r => ['BANK_TRANSFER', 'CHEQUE'].includes(r.paymentMethod ?? ''));
    if (tab === 'MOBILE') list = list.filter(r => ['TELEBIRR', 'CHAPA', 'CBE_BIRR'].includes(r.paymentMethod ?? ''));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => [r.receiptNumber, r.invoiceNumber, r.customerName].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',    value: rows.length,                                                    color: 'emerald' as const },
    { label: 'Cash',     value: rows.filter(r => r.paymentMethod === 'CASH').length,            color: 'sky' as const },
    { label: 'Bank',     value: rows.filter(r => ['BANK_TRANSFER','CHEQUE'].includes(r.paymentMethod ?? '')).length, color: 'violet' as const },
    { label: 'Total ETB',value: fmtETB(rows.reduce((s, r) => s + Number(r.amount ?? 0), 0)),   color: 'amber' as const },
  ], [rows]);

  const handleExport = () => {
    const headers = 'Receipt #,Invoice #,Customer,Amount,Method,Date\n';
    const csvRows = filtered.map(r =>
      `"${r.receiptNumber ?? ''}","${r.invoiceNumber ?? ''}","${r.customerName ?? ''}",${r.amount},"${r.paymentMethod ?? ''}","${r.paidAt}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `receipts-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const METHOD_CLS: Record<string, string> = {
    CASH:          'bg-emerald-50 text-emerald-700 border-emerald-100',
    BANK_TRANSFER: 'bg-sky-50 text-sky-700 border-sky-100',
    CHEQUE:        'bg-white text-slate-600 border-slate-200',
    TELEBIRR:      'bg-violet-50 text-violet-700 border-violet-100',
    CHAPA:         'bg-amber-50 text-amber-700 border-amber-100',
    CBE_BIRR:      'bg-teal-50 text-teal-700 border-teal-100',
  };

  return (
    <AppPage
      title="Receipts"
      subtitle="Payment receipts · Invoice settlements · Banking & ovds · Retail & E-commerce · Revenue · Market Share"
      icon={<BadgeCheck size={18} />}
      crumbs={[{ label: 'Receipts' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',    label: 'All',    count: rows.length },
            { key: 'CASH',   label: 'Cash',   count: rows.filter(r => r.paymentMethod === 'CASH').length },
            { key: 'BANK',   label: 'Bank',   count: rows.filter(r => ['BANK_TRANSFER','CHEQUE'].includes(r.paymentMethod ?? '')).length },
            { key: 'MOBILE', label: 'Mobile', count: rows.filter(r => ['TELEBIRR','CHAPA','CBE_BIRR'].includes(r.paymentMethod ?? '')).length },
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
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search receipts…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} receipts</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Receipt #</AppTh>
          <AppTh>Invoice</AppTh>
          <AppTh>Customer</AppTh>
          <AppTh align="right">Amount</AppTh>
          <AppTh>Method</AppTh>
          <AppTh>Date</AppTh>
        </tr></thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={6} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={6}><EmptyState icon={<BadgeCheck size={18} />} title="No receipts" desc="Payment receipts will appear here when invoices are paid" /></td></tr>
          ) : filtered.map(r => (
            <AppTr key={r.id}>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <BadgeCheck size={12} className="text-emerald-500 shrink-0" />
                  <span className="font-mono text-[11px] font-semibold text-slate-800">{r.receiptNumber ?? r.id.slice(0, 8)}</span>
                </div>
              </AppTd>
              <AppTd><span className="font-mono text-[10px] text-slate-500">{r.invoiceNumber ?? '—'}</span></AppTd>
              <AppTd><span className="text-[12px] text-slate-700">{r.customerName ?? '—'}</span></AppTd>
              <AppTd align="right"><Amount value={Number(r.amount)} size="sm" positive /></AppTd>
              <AppTd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${METHOD_CLS[r.paymentMethod ?? 'CASH'] ?? METHOD_CLS.CASH}`}>
                  {r.paymentMethod ?? 'CASH'}
                </span>
              </AppTd>
              <AppTd>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Calendar size={9} className="text-slate-300" />
                  {new Date(r.paidAt).toLocaleDateString()}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      {total > PAGE_SIZE && (
        <div className="mt-3"><Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} /></div>
      )}
    </AppPage>
  );
};

export default Receipts;

