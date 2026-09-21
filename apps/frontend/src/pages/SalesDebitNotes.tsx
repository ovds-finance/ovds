/**
 * Sales Debit Notes (DBN) — MoR EIMS debit memos linked to original invoices
 */
import { useRegisterInvoiceEims } from '@ovds/features/eims';
import { FilePlus, Plus, RefreshCw, Shield, ExternalLink, Search } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import {
  AppPage, AppTabs, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input,
  EmptyState, Pagination, Amount,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { invoicesApi } from '../services/ovdsApi';

interface DebitNoteRow {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  date?: string;
  totalAmount?: number;
  status: string;
  eimsIrn?: string | null;
  eimsStatus?: string | null;
  recurringParentId?: string | null;
}

type FilterTab = 'ALL' | 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED';

const EIMS_BADGE: Record<string, string> = {
  REGISTERED: 'text-[var(--pro-azure-dark)] bg-[var(--pro-azure-50)]',
  PENDING: 'text-amber-700 bg-amber-50',
  FAILED: 'text-rose-700 bg-rose-50',
};

const SalesDebitNotes: React.FC = () => {
  usePageTitle('Sales Debit Notes');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const registerEims = useRegisterInvoiceEims();

  const [tab, setTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<DebitNoteRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [sourceInvoiceId, setSourceInvoiceId] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceInvoices, setSourceInvoices] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchDebitNotes = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const res = await invoicesApi.list({
        companyId: selectedCompanyId,
        docType: 'DEBIT_NOTE',
        page,
        limit: 25,
        search: search.trim() || undefined,
        status: tab !== 'ALL' ? tab : undefined,
      });
      const data = res?.data ?? res?.items ?? res ?? [];
      setRows(Array.isArray(data) ? data : []);
      setTotal(res?.total ?? data.length);
    } catch {
      toast.error('Failed to load debit notes');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, page, search, tab]);

  useEffect(() => { fetchDebitNotes(); }, [fetchDebitNotes]);

  const searchSourceInvoices = async (q: string) => {
    if (!selectedCompanyId || !q.trim()) { setSourceInvoices([]); return; }
    try {
      const res = await invoicesApi.list({ companyId: selectedCompanyId, search: q, limit: 10 });
      const data = res?.data ?? res?.items ?? res ?? [];
      setSourceInvoices(
        Array.isArray(data)
          ? data.filter((i: any) => i.eimsIrn && !i.invoiceNumber?.startsWith('DN-') && !i.invoiceNumber?.startsWith('CN-'))
          : [],
      );
    } catch { /* ignore */ }
  };

  const handleCreate = async () => {
    if (!sourceInvoiceId || !debitAmount || Number(debitAmount) <= 0) {
      toast.error('Select an invoice and enter a valid amount');
      return;
    }
    setCreating(true);
    try {
      await invoicesApi.debitNote(sourceInvoiceId, Number(debitAmount));
      toast.success('Debit note (DBN) created');
      setShowCreate(false);
      setSourceInvoiceId('');
      setDebitAmount('');
      fetchDebitNotes();
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create debit note');
    } finally {
      setCreating(false);
    }
  };

  const handleEimsRegister = async (id: string) => {
    try {
      await registerEims.mutateAsync(id);
      toast.success('Debit note registered with EIMS (DBN)');
      fetchDebitNotes();
    } catch (e: any) {
      toast.error(e?.message ?? 'EIMS registration failed');
    }
  };

  const kpiCells = useMemo(() => [
    { label: 'Total DBN', value: rows.length, cls: 'bg-white dark:bg-slate-800 text-slate-700' },
    { label: 'EIMS Registered', value: rows.filter(r => r.eimsStatus === 'REGISTERED').length, cls: 'bg-teal-50 text-teal-700' },
    { label: 'Pending EIMS', value: rows.filter(r => !r.eimsIrn).length, cls: 'bg-amber-50 text-amber-700' },
    { label: 'Failed', value: rows.filter(r => r.eimsStatus === 'FAILED').length, cls: 'bg-rose-50 text-rose-700' },
  ], [rows]);

  return (
    <AppPage
      title="Sales Debit Notes (DBN)"
      subtitle="MoR EIMS debit memos — additional charges on registered invoices"
      icon={<FilePlus size={18} />}
      crumbs={[{ label: 'Debit Notes' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL', label: 'All', count: rows.length },
            { key: 'PENDING', label: 'Pending', count: rows.filter(r => r.status === 'PENDING').length },
            { key: 'PAID', label: 'Applied', count: rows.filter(r => r.status === 'PAID').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Link to="/settings/eims" className="flex items-center gap-1 px-3 py-1.5 text-xs text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50">
            <Shield size={12} /> EIMS Setup
          </Link>
          <Btn variant="ghost" icon={<RefreshCw size={11} />} onClick={fetchDebitNotes}>Refresh</Btn>
          {can('invoices:write') && (
            <Btn variant="primary" icon={<Plus size={12} />} onClick={() => setShowCreate(true)}>New Debit Note</Btn>
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
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search DN-…" className="w-52" />
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Debit Note #</AppTh>
          <AppTh>Customer</AppTh>
          <AppTh>Date</AppTh>
          <AppTh align="right">Amount</AppTh>
          <AppTh>Status</AppTh>
          <AppTh>EIMS / IRN</AppTh>
          <AppTh align="right" width="120px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={7}><EmptyState icon={<FilePlus size={18} />} title="No debit notes" desc="Create a DBN from an EIMS-registered invoice" /></td></tr>
          ) : rows.map(dn => (
            <AppTr key={dn.id}>
              <AppTd><span className="font-mono text-[11px] font-semibold">{dn.invoiceNumber}</span></AppTd>
              <AppTd><span className="text-[12px]">{dn.customerName ?? '—'}</span></AppTd>
              <AppTd><span className="text-[11px] text-slate-500">{dn.date ? new Date(dn.date).toLocaleDateString() : '—'}</span></AppTd>
              <AppTd align="right"><Amount value={Number(dn.totalAmount ?? 0)} /></AppTd>
              <AppTd><StatusBadge status={dn.status} /></AppTd>
              <AppTd>
                {dn.eimsIrn ? (
                  <div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${EIMS_BADGE[dn.eimsStatus ?? 'REGISTERED'] ?? EIMS_BADGE.REGISTERED}`}>
                      {dn.eimsStatus ?? 'REGISTERED'}
                    </span>
                    <p className="text-[9px] font-mono text-slate-400 mt-0.5 truncate max-w-[120px]">{dn.eimsIrn?.slice(0, 16)}…</p>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400">Not registered</span>
                )}
              </AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1">
                  {!dn.eimsIrn && dn.status !== 'CANCELLED' && (
                    <button type="button" onClick={() => handleEimsRegister(dn.id)} disabled={registerEims.isPending}
                      className="text-[10px] px-2 py-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-100">
                      <Shield size={10} className="inline mr-0.5" /> EIMS
                    </button>
                  )}
                  <a href={`/api/ovds/invoices/${dn.id}/pdf`} target="_blank" rel="noreferrer" className="text-[10px] px-2 py-1 rounded border hover:bg-slate-50">
                    <ExternalLink size={10} className="inline" />
                  </a>
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      {total > 25 && <Pagination page={page} total={total} pageSize={25} onPageChange={setPage} />}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Debit Note (DBN)" width="max-w-lg">
        <p className="text-xs text-slate-500 mb-4">Select an EIMS-registered invoice and specify the additional charge amount.</p>
        <FormField label="Search invoice (must have EIMS IRN)">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <Input value={sourceSearch} onChange={(e) => { setSourceSearch(e.target.value); searchSourceInvoices(e.target.value); }} placeholder="Invoice number…" className="pl-8" />
          </div>
        </FormField>
        {sourceInvoices.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg divide-y">
            {sourceInvoices.map((inv) => (
              <button key={inv.id} type="button" onClick={() => { setSourceInvoiceId(inv.id); setDebitAmount(String(inv.totalAmount ?? '')); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 ${sourceInvoiceId === inv.id ? 'bg-teal-50 text-teal-700' : ''}`}>
                <span className="font-mono font-semibold">{inv.invoiceNumber}</span>
                <span className="text-slate-500 ml-2">{inv.customerName}</span>
                <span className="float-right">ETB {Number(inv.totalAmount ?? 0).toLocaleString()}</span>
              </button>
            ))}
          </div>
        )}
        <FormField label="Debit amount (ETB)">
          <Input type="number" value={debitAmount} onChange={e => setDebitAmount(e.target.value)} placeholder="0.00" />
        </FormField>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t">
          <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleCreate} disabled={creating || !sourceInvoiceId || !debitAmount}>
            {creating ? 'Creating…' : 'Create DBN'}
          </Btn>
        </div>
      </Modal>
    </AppPage>
  );
};

export default SalesDebitNotes;
