/**
 * Refunds — ovds-style credit notes & refunds
 * AppPage · AppKpi · AppTable · useApiCrud
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  RotateCcw, Plus, Edit2, Trash2, RefreshCw, Download,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { confirm } from '../utils/confirm';
import { fmtETB } from '../utils/ethiopianTax';
import { evalMath } from '@ovds/ui';
import {
   AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
   StatusBadge, Btn, Modal, FormField, Input, Select,
   SearchBar, EmptyState, Pagination, Amount,
 } from '../components/ui';

interface Refund {
  id: string;
  refundNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerName?: string;
  amount: number;
  reason?: string;
  type?: string;
  status: string;
  processedAt?: string;
  companyId?: string;
  createdAt: string;
}

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'PROCESSED';

const REFUND_TYPES   = ['FULL', 'PARTIAL', 'CREDIT_NOTE'];
const REFUND_REASONS = ['CUSTOMER_REQUEST', 'DEFECTIVE_PRODUCT', 'SERVICE_NOT_DELIVERED', 'DUPLICATE_PAYMENT', 'OVERCHARGE', 'OTHER'];

const RefundForm: React.FC<{ data: Partial<Refund>; onChange: (d: Partial<Refund>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof Refund, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Invoice Number">
          <Input value={data.invoiceNumber ?? ''} onChange={e => set('invoiceNumber', e.target.value)} placeholder="INV-001" />
        </FormField>
        <FormField label="Customer Name">
          <Input value={data.customerName ?? ''} onChange={e => set('customerName', e.target.value)} placeholder="Customer name" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Refund Amount (ETB)" required>
          <Input type="text" step="0.01" value={data.amount ?? ''} onChange={e => set('amount', e.target.value)} onBlur={e => set('amount', Number((evalMath(e.target.value) ?? parseFloat(e.target.value)) || 0))} placeholder="0.00" />
        </FormField>
        <FormField label="Type">
          <Select value={data.type ?? 'PARTIAL'} onChange={e => set('type', e)}>
            {REFUND_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </Select>
        </FormField>
      </div>
      <FormField label="Reason">
        <Select value={data.reason ?? 'OTHER'} onChange={e => set('reason', e)}>
          {REFUND_REASONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </Select>
      </FormField>
    </div>
  );
};

const Refunds: React.FC = () => {
  usePageTitle('Refunds');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Refund> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Refund>({
    endpoint: '/vat/refund-claims',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(r => r.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => [r.refundNumber, r.invoiceNumber, r.customerName].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',     value: rows.length,                                                    color: 'emerald' as const },
    { label: 'Pending',   value: rows.filter(r => r.status === 'PENDING').length,               color: 'amber' as const },
    { label: 'Processed', value: rows.filter(r => r.status === 'PROCESSED').length,             color: 'sky' as const },
    { label: 'Total ETB', value: fmtETB(rows.reduce((s, r) => s + Number(r.amount ?? 0), 0)),   color: 'rose' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.amount || Number(modal.data.amount) <= 0) { toast.error('Amount is required'); return; }
    const result = await save({ ...modal.data } as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleApprove = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/vat/refund-claims/${id}/status`, { status: 'APPROVED' });
      toast.success('Refund approved'); refetch();
    } catch { toast.error('Failed'); }
  };

  const handleProcess = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/vat/refund-claims/${id}/status`, { status: 'PROCESSED' });
      toast.success('Refund processed'); refetch();
    } catch { toast.error('Failed'); }
  };

  const handleExport = () => {
    const headers = 'Refund #,Invoice,Customer,Amount,Type,Reason,Status,Date\n';
    const csvRows = filtered.map(r =>
      `"${r.refundNumber ?? ''}","${r.invoiceNumber ?? ''}","${r.customerName ?? ''}",${r.amount},"${r.type ?? ''}","${r.reason ?? ''}","${r.status}","${r.createdAt}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `refunds-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="Refunds & Credits"
      subtitle="Credit notes · Customer refunds · Accounts receivable adjustments · Banking & ovds · Retail & E-commerce · Consumer Insights · Revenue"
      icon={<RotateCcw size={18} />}
      crumbs={[{ label: 'Refunds' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',       label: 'All',       count: rows.length },
            { key: 'PENDING',   label: 'Pending',   count: rows.filter(r => r.status === 'PENDING').length },
            { key: 'APPROVED',  label: 'Approved',  count: rows.filter(r => r.status === 'APPROVED').length },
            { key: 'PROCESSED', label: 'Processed', count: rows.filter(r => r.status === 'PROCESSED').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {can('invoices:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { type: 'PARTIAL', status: 'PENDING', reason: 'OTHER' } })}>
              New Refund
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search refunds…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} refunds</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Refund</AppTh>
          <AppTh>Customer</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Reason</AppTh>
          <AppTh align="right">Amount</AppTh>
          <AppTh>Date</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="100px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}><EmptyState icon={<RotateCcw size={18} />} title="No refunds" desc="Refund requests will appear here" action={can('invoices:write') ? { label: 'New Refund', onClick: () => setModal({ open: true, data: { type: 'PARTIAL', status: 'PENDING', reason: 'OTHER' } }) } : undefined} /></td></tr>
          ) : filtered.map(r => (
            <AppTr key={r.id}>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <RotateCcw size={12} className="text-rose-400 shrink-0" />
                  <div>
                    <p className="font-mono text-[11px] font-semibold text-slate-800">{r.refundNumber ?? r.id.slice(0, 8)}</p>
                    {r.invoiceNumber && <p className="ovds-caption">Inv: {r.invoiceNumber}</p>}
                  </div>
                </div>
              </AppTd>
              <AppTd><span className="text-[12px] text-slate-700">{r.customerName ?? '—'}</span></AppTd>
              <AppTd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${r.type === 'CREDIT_NOTE' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {(r.type ?? 'PARTIAL').replace(/_/g, ' ')}
                </span>
              </AppTd>
              <AppTd><span className="text-[10px] text-slate-500">{(r.reason ?? '—').replace(/_/g, ' ')}</span></AppTd>
              <AppTd align="right"><Amount value={Number(r.amount)} negative size="sm" /></AppTd>
              <AppTd><span className="ovds-caption">{new Date(r.createdAt).toLocaleDateString()}</span></AppTd>
              <AppTd><StatusBadge status={r.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {r.status === 'PENDING' && can('invoices:write') && (
                    <button onClick={() => handleApprove(r.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Approve"><CheckCircle2 size={11} /></button>
                  )}
                  {r.status === 'APPROVED' && can('invoices:write') && (
                    <button onClick={() => handleProcess(r.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all" title="Process"><RotateCcw size={11} /></button>
                  )}
                  <button onClick={() => setModal({ open: true, data: { ...r } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Edit"><Edit2 size={11} /></button>
                  <button onClick={async () => { if (await confirm({ title: 'Delete refund?', variant: 'danger' })) remove(r.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit Refund' : 'New Refund'} subtitle="Credit note · Customer refund · Banking & ovds · Retail & E-commerce · Consumer Insights"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create Refund'}</Btn></>}>
        <RefundForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default Refunds;


