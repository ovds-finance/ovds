/**
 * Debit Notes — issue debit notes to vendors for returning goods
 */
import React, { useState, useMemo } from 'react';
import { FilePlus, Plus, Edit2, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { confirm } from '../utils/confirm';
import { evalMath } from '@ovds/ui';
import {
  AppPage, AppTabs, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Textarea,
  EmptyState, Pagination, Amount,
} from '../components/ui';
import api from '../services/api';

interface DebitNote {
  id: string;
  debitNoteNumber: string;
  billId?: string;
  billNumber?: string;
  vendorId?: string;
  vendorName?: string;
  debitDate: string;
  reason?: string;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  notes?: string;
  status: string;
  companyId?: string;
  createdAt: string;
}

type FilterTab = 'ALL' | 'DRAFT' | 'ISSUED' | 'APPLIED' | 'VOIDED';

const DebitNoteForm: React.FC<{
  data: Partial<DebitNote>;
  onChange: (d: Partial<DebitNote>) => void;
}> = ({ data, onChange }) => {
  const set = (k: keyof DebitNote, v: any) => onChange({ ...data, [k]: v });
  const evalField = (value: string) => {
    const result = evalMath(value);
    return result !== null ? result : parseFloat(value) || 0;
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Debit Note Number" required>
          <Input value={data.debitNoteNumber ?? ''} onChange={e => set('debitNoteNumber', e.target.value)} placeholder="DN-2026-001" />
        </FormField>
        <FormField label="Vendor Name">
          <Input value={data.vendorName ?? ''} onChange={e => set('vendorName', e.target.value)} placeholder="Vendor name" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Debit Date">
          <Input type="date" value={data.debitDate ? new Date(data.debitDate).toISOString().split('T')[0] : ''} onChange={e => set('debitDate', e.target.value)} />
        </FormField>
        <FormField label="Related Bill #">
          <Input value={data.billNumber ?? ''} onChange={e => set('billNumber', e.target.value)} placeholder="BILL-2026-001" />
        </FormField>
      </div>
      <FormField label="Reason for Debit Note">
        <Input value={data.reason ?? ''} onChange={e => set('reason', e.target.value)} placeholder="e.g. Returned goods to vendor, pricing dispute" />
      </FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Subtotal">
          <Input type="number" value={data.subtotal ?? ''} onChange={e => set('subtotal', parseFloat(e.target.value) || 0)} onBlur={e => set('subtotal', evalField(e.target.value))} placeholder="0.00" />
        </FormField>
        <FormField label="Tax Amount">
          <Input type="number" value={data.taxAmount ?? ''} onChange={e => set('taxAmount', parseFloat(e.target.value) || 0)} onBlur={e => set('taxAmount', evalField(e.target.value))} placeholder="0.00" />
        </FormField>
        <FormField label="Total Debit">
          <Input type="number" value={data.total ?? ''} onChange={e => set('total', parseFloat(e.target.value) || 0)} onBlur={e => set('total', evalField(e.target.value))} placeholder="0.00" />
        </FormField>
      </div>
      <FormField label="Notes">
        <Textarea value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Additional notes" />
      </FormField>
    </div>
  );
};

const DebitNotes: React.FC = () => {
  usePageTitle('Debit Notes');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<DebitNote> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<DebitNote>({
    endpoint: '/ovds/debit-notes',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(r => r.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => [r.debitNoteNumber, r.billNumber, r.vendorName].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',   value: rows.length, cls: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
    { label: 'Draft',   value: rows.filter(r => r.status === 'DRAFT').length, cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
    { label: 'Issued',  value: rows.filter(r => r.status === 'ISSUED').length, cls: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400' },
    { label: 'Applied', value: rows.filter(r => r.status === 'APPLIED').length, cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  ], [rows]);

  const blank = (): Partial<DebitNote> => ({
    debitNoteNumber: `DN-${new Date().getFullYear()}-${String(rows.length + 1).padStart(3, '0')}`,
    status: 'DRAFT',
    debitDate: new Date().toISOString().split('T')[0],
  });

  const handleSave = async (data: Partial<DebitNote>) => {
    const result = await save(data as any);
    if (result) {
      toast.success(data.id ? 'Debit note updated' : 'Debit note created');
      setModal({ open: false, data: {} });
    }
  };

  const handleIssue = async (id: string) => {
    try {
      await api.patch(`/ovds/debit-notes/${id}/status`, { status: 'ISSUED' });
      toast.success('Debit note issued');
      refetch();
    } catch {
      toast.error('Failed to issue debit note');
    }
  };

  return (
    <AppPage
      title="Debit Notes"
      subtitle="Issue debit notes to your vendors for returning goods"
      icon={<FilePlus size={18} />}
      crumbs={[{ label: 'Debit Notes' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',     label: 'All',     count: rows.length },
            { key: 'DRAFT',   label: 'Draft',   count: rows.filter(r => r.status === 'DRAFT').length },
            { key: 'ISSUED',  label: 'Issued',  count: rows.filter(r => r.status === 'ISSUED').length },
            { key: 'APPLIED', label: 'Applied', count: rows.filter(r => r.status === 'APPLIED').length },
            { key: 'VOIDED',  label: 'Voided',  count: rows.filter(r => r.status === 'VOIDED').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          {can('bills:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: blank() })}>New Debit Note</Btn>
          )}
        </>
      }
    >
      <div className="ovds-grid-layout cols-4 gap-sm">
        {kpiCells.map(k => (
          <div key={k.label} className={`${k.cls} rounded-xl p-3 text-center`}>
            <p className="text-xl font-bold">{k.value}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-3 mt-4">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search debit notes…" className="w-52" />
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Debit Note #</AppTh>
          <AppTh>Vendor</AppTh>
          <AppTh>Related Bill</AppTh>
          <AppTh>Debit Date</AppTh>
          <AppTh>Reason</AppTh>
          <AppTh align="right">Total</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="100px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}><EmptyState icon={<FilePlus size={18} />} title="No debit notes" desc="Issue debit notes to vendors when goods are returned" /></td></tr>
          ) : filtered.map(dn => (
            <AppTr key={dn.id}>
              <AppTd><span className="font-mono text-[11px] font-semibold text-slate-800">{dn.debitNoteNumber}</span></AppTd>
              <AppTd><span className="text-[12px] text-slate-700 font-medium">{dn.vendorName ?? '—'}</span></AppTd>
              <AppTd><span className="font-mono text-[10px] text-slate-500">{dn.billNumber ?? '—'}</span></AppTd>
              <AppTd><span className="text-[11px] text-slate-500">{new Date(dn.debitDate).toLocaleDateString()}</span></AppTd>
              <AppTd><span className="text-[11px] text-slate-500 truncate max-w-[120px] block">{dn.reason ?? '—'}</span></AppTd>
              <AppTd align="right"><Amount value={Number(dn.total ?? 0)} size="sm" /></AppTd>
              <AppTd><StatusBadge status={dn.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1">
                  {dn.status === 'DRAFT' && (
                    <button onClick={() => handleIssue(dn.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all" title="Issue"><CheckCircle2 size={11} /></button>
                  )}
                  {dn.status === 'DRAFT' && can('bills:write') && (
                    <button onClick={() => setModal({ open: true, data: { ...dn } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all" title="Edit"><Edit2 size={11} /></button>
                  )}
                  {dn.status === 'DRAFT' && (
                    <button onClick={async () => { if (await confirm({ title: `Delete "${dn.debitNoteNumber}"?` })) { await remove(dn.id); refetch(); } }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      {total > 25 && <Pagination page={page} total={total} pageSize={25} onChange={setPage} />}

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: {} })} title={modal.data.id ? 'Edit Debit Note' : 'New Debit Note'}>
        {modal.open && (
          <DebitNoteForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: { ...m.data, ...d } }))} />
        )}
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Btn variant="ghost" onClick={() => setModal({ open: false, data: {} })}>Cancel</Btn>
          <Btn variant="primary" onClick={() => handleSave(modal.data)} disabled={saving || !modal.data.debitNoteNumber}>{saving ? 'Saving…' : 'Save Debit Note'}</Btn>
        </div>
      </Modal>
    </AppPage>
  );
};

export default DebitNotes;
