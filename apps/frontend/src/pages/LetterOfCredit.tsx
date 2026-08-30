import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { confirm } from '../utils/confirm';
import { fmtDate } from '../utils/fmt';
import { fmtETB } from '../utils/ethiopianTax';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Textarea, Select,
  SearchBar, Amount, Pagination, Icon, EmptyState,
} from '../components/ui';
import { OvdsEmptyState } from '../components/ovds';
import {
  FileText, Plus, Edit2, Trash2, Download, RefreshCw,
  Send, CheckCircle2, XCircle, Clock,
 } from 'lucide-react';

 const toCsv = (rows: any[], filename: string) => {
   if (!rows.length) { toast.error('No data to export'); return; }
   const headers = Object.keys(rows[0]).filter(k => !k.startsWith('_'));
   const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
   const blob = new Blob([csv], { type: 'text/csv' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
   a.click();
   URL.revokeObjectURL(url);
 };

type LcStatus = 'ALL' | 'DRAFT' | 'ISSUED' | 'AMENDED' | 'UTILISED' | 'EXPIRED' | 'CANCELLED';

interface LetterOfCredit {
  id: string;
  lcNumber: string;
  vendorName: string;
  poNumber: string;
  issuingBank: string;
  advisingBank: string;
  amount: number;
  currency: string;
  issueDate: string;
  expiryDate: string;
  latestShipmentDate: string;
  partialShipments: boolean;
  transshipmentAllowed: boolean;
  portOfLoading: string;
  portOfDischarge: string;
  incoterm: string;
  goodsDescription: string;
  hsCode: string;
  notes: string;
  status: string;
  companyId?: string;
  createdAt: string;
}

const LC_TABS: LcStatus[] = ['ALL', 'DRAFT', 'ISSUED', 'AMENDED', 'UTILISED', 'EXPIRED', 'CANCELLED'];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  ISSUED: 'bg-sky-100 text-sky-700',
  AMENDED: 'bg-amber-100 text-amber-700',
  UTILISED: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-rose-100 text-rose-700',
  CANCELLED: 'bg-orange-100 text-orange-700',
};

const LC_FORM: React.FC<{ data: Partial<LetterOfCredit>; onChange: (d: Partial<LetterOfCredit>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof LetterOfCredit, v: any) => onChange({ ...data, [k]: v });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="LC Number" required>
          <Input value={data.lcNumber ?? ''} onChange={e => set('lcNumber', e.target.value)} placeholder="LC-2026-001" />
        </FormField>
        <FormField label="Vendor Name" required>
          <Input value={data.vendorName ?? ''} onChange={e => set('vendorName', e.target.value)} placeholder="Supplier name" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="PO Number">
          <Input value={data.poNumber ?? ''} onChange={e => set('poNumber', e.target.value)} placeholder="PO-2026-001" />
        </FormField>
        <FormField label="Amount" required>
          <Input type="number" min="0" step="0.01" value={data.amount ?? ''} onChange={e => set('amount', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Currency">
          <Select value={data.currency ?? 'ETB'} onChange={e => set('currency', e)}>
            <option value="ETB">ETB</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CNY">CNY</option>
          </Select>
        </FormField>
        <FormField label="Incoterm">
          <Input value={data.incoterm ?? ''} onChange={e => set('incoterm', e.target.value)} placeholder="CIF / FOB / EXW…" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Issuing Bank">
          <Input value={data.issuingBank ?? ''} onChange={e => set('issuingBank', e.target.value)} placeholder="Bank name" />
        </FormField>
        <FormField label="Advising Bank">
          <Input value={data.advisingBank ?? ''} onChange={e => set('advisingBank', e.target.value)} placeholder="Bank name" />
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Issue Date">
          <Input type="date" value={data.issueDate?.slice(0, 10) ?? ''} onChange={e => set('issueDate', e.target.value)} />
        </FormField>
        <FormField label="Expiry Date">
          <Input type="date" value={data.expiryDate?.slice(0, 10) ?? ''} onChange={e => set('expiryDate', e.target.value)} />
        </FormField>
        <FormField label="Latest Shipment Date">
          <Input type="date" value={data.latestShipmentDate?.slice(0, 10) ?? ''} onChange={e => set('latestShipmentDate', e.target.value)} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Port of Loading">
          <Input value={data.portOfLoading ?? ''} onChange={e => set('portOfLoading', e.target.value)} placeholder="e.g. Djibouti" />
        </FormField>
        <FormField label="Port of Discharge">
          <Input value={data.portOfDischarge ?? ''} onChange={e => set('portOfDischarge', e.target.value)} placeholder="e.g. Port of Djibouti" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="HS Code">
          <Input value={data.hsCode ?? ''} onChange={e => set('hsCode', e.target.value)} placeholder="Customs HS code" />
        </FormField>
        <FormField label="Goods Description">
          <Textarea value={data.goodsDescription ?? ''} onChange={e => set('goodsDescription', e.target.value)} rows={2} placeholder="Description of goods…" />
        </FormField>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.partialShipments ?? false} onChange={e => set('partialShipments', e.target.checked)} className="accent-emerald-600" />
          <span className="text-xs font-semibold text-slate-700">Partial Shipments Allowed</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.transshipmentAllowed ?? false} onChange={e => set('transshipmentAllowed', e.target.checked)} className="accent-emerald-600" />
          <span className="text-xs font-semibold text-slate-700">Transshipment Allowed</span>
        </label>
      </div>
      <FormField label="Notes">
        <Textarea value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Additional notes…" />
      </FormField>
    </div>
  );
};

const LetterOfCredit: React.FC = () => {
  usePageTitle('Letter of Credit');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab] = useState<LcStatus>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<LetterOfCredit> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<LetterOfCredit>({
    endpoint: '/procurement/letter-of-credit',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(lc => lc.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(lc => [lc.lcNumber, lc.vendorName, lc.poNumber, lc.issuingBank].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total L/Cs', value: rows.length, color: 'emerald' as const },
    { label: 'Issued', value: rows.filter(lc => lc.status === 'ISSUED').length, color: 'sky' as const },
    { label: 'Utilised', value: rows.filter(lc => lc.status === 'UTILISED').length, color: 'violet' as const },
    { label: 'Total Value', value: fmtETB(rows.reduce((s, lc) => s + Number(lc.amount || 0), 0)), color: 'amber' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.lcNumber?.trim() || !modal.data.vendorName?.trim()) { toast.error('LC Number and Vendor are required'); return; }
    const payload = { ...modal.data, amount: Number(modal.data.amount) || 0 };
    await save(payload as any);
    setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleIssue = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/procurement/letter-of-credit/${id}/issue`);
      toast.success('L/C issued'); refetch();
    } catch { toast.error('Failed to issue'); }
  };

  const handleAmend = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/procurement/letter-of-credit/${id}/amend`);
      toast.success('L/C amended'); refetch();
    } catch { toast.error('Failed to amend'); }
  };

  const handleUtilise = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/procurement/letter-of-credit/${id}/utilise`);
      toast.success('L/C utilised'); refetch();
    } catch { toast.error('Failed to utilise'); }
  };

  const handleCancel = async (id: string) => {
    if (!(await confirm({ title: 'Cancel this Letter of Credit?', variant: 'danger' }))) return;
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/procurement/letter-of-credit/${id}/cancel`);
      toast.success('L/C cancelled'); refetch();
    } catch { toast.error('Failed to cancel'); }
  };

  const blankLC = () => ({
    lcNumber: `LC-${new Date().getFullYear()}-${String(rows.length + 1).padStart(3, '0')}`,
    status: 'DRAFT',
    currency: 'ETB',
    amount: 0,
    partialShipments: false,
    transshipmentAllowed: false,
  });

  return (
    <AppPage
      title="Letter of Credit"
      subtitle="L/C management for international trade · Trade ovds · Supply Chain"
      icon={<FileText size={18} />}
      crumbs={[{ label: 'Letter of Credit' }]}
      tabs={
        <AppTabs
          tabs={LC_TABS.map(t => ({ key: t, label: t.replace(/_/g, ' ') }))}
          active={tab}
          onChange={k => { setTab(k as LcStatus); }}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={() => toCsv(rows, 'letter-of-credit')}>Export</Btn>
          {can('purchase_orders:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: blankLC() })}>New L/C</Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />

      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search L/Cs…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} records</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>LC Number</AppTh>
          <AppTh>Vendor</AppTh>
          <AppTh>PO Reference</AppTh>
          <AppTh>Issuing Bank</AppTh>
          <AppTh align="right">Amount</AppTh>
          <AppTh>Currency</AppTh>
          <AppTh>Issue Date</AppTh>
          <AppTh>Expiry Date</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="140px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={10} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={10}>
              <EmptyState icon={<FileText size={18} />} title="No letters of credit" desc="Create your first L/C to manage trade ovds" action={can('purchase_orders:write') ? { label: 'New L/C', onClick: () => setModal({ open: true, data: blankLC() }) } : undefined} />
            </td></tr>
          ) : filtered.map(lc => (
            <AppTr key={lc.id}>
              <AppTd><span className="font-mono text-[11px] font-semibold text-slate-800">{lc.lcNumber}</span></AppTd>
              <AppTd><span className="text-[12px] text-slate-700">{lc.vendorName ?? '—'}</span></AppTd>
              <AppTd><span className="font-mono text-[11px] text-slate-600">{lc.poNumber ?? '—'}</span></AppTd>
              <AppTd><span className="text-[12px] text-slate-600">{lc.issuingBank ?? '—'}</span></AppTd>
              <AppTd align="right"><Amount value={Number(lc.amount)} size="sm" /></AppTd>
              <AppTd><span className="text-[11px] font-semibold text-slate-500">{lc.currency ?? 'ETB'}</span></AppTd>
              <AppTd>{fmtDate(lc.issueDate)}</AppTd>
              <AppTd>{fmtDate(lc.expiryDate)}</AppTd>
              <AppTd><StatusBadge status={lc.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {lc.status === 'DRAFT' && <button onClick={() => handleIssue(lc.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all" title="Issue"><Send size={11} /></button>}
                  {(lc.status === 'ISSUED' || lc.status === 'AMENDED') && <button onClick={() => handleAmend(lc.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all" title="Amend"><Edit2 size={11} /></button>}
                  {(lc.status === 'ISSUED' || lc.status === 'AMENDED') && <button onClick={() => handleUtilise(lc.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Utilise"><CheckCircle2 size={11} /></button>}
                  {(lc.status === 'ISSUED' || lc.status === 'AMENDED') && <button onClick={() => handleCancel(lc.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Cancel"><XCircle size={11} /></button>}
                  <button onClick={() => setModal({ open: true, data: { ...lc } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Edit"><Edit2 size={11} /></button>
                  <button onClick={async () => { if (await confirm({ title: `Delete "${lc.lcNumber}"?`, variant: 'danger' })) remove(lc.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>

      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>

      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.data.id ? 'Edit Letter of Credit' : 'New Letter of Credit'}
        subtitle="Trade ovds · International procurement"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create L/C'}</Btn></>}
      >
        <LC_FORM data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default LetterOfCredit;

