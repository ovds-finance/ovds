import {
  ArrowDownToLine, ArrowUpFromLine, BookOpen,
  Download, RefreshCw, Plus, Edit2, Trash2,
  FileText, X,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Textarea, Select,
  SearchBar, Amount, Pagination, Icon, EmptyState,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { confirm } from '../utils/confirm';
import { downloadCSV } from '../utils/download';
import { fmtETB } from '../utils/ethiopianTax';
import { fmtDate } from '../utils/fmt';

type EntryType = 'ALL' | 'BILL' | 'PAYMENT' | 'DEBIT_NOTE' | 'CREDIT_NOTE' | 'WHT' | 'ADJUSTMENT' | 'OPENING_BALANCE';

interface VendorLedgerEntry {
  id: string;
  date: string;
  vendorId: string;
  vendorName: string;
  entryType: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance?: number;
}

const ENTRY_TABS: EntryType[] = ['ALL', 'BILL', 'PAYMENT', 'DEBIT_NOTE', 'CREDIT_NOTE', 'WHT', 'ADJUSTMENT', 'OPENING_BALANCE'];

const ENTRY_COLORS: Record<string, string> = {
  BILL: 'bg-violet-100 text-violet-700',
  PAYMENT: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  DEBIT_NOTE: 'bg-rose-100 text-rose-700',
  CREDIT_NOTE: 'bg-sky-100 text-sky-700',
  WHT: 'bg-amber-100 text-amber-700',
  ADJUSTMENT: 'bg-orange-100 text-orange-700',
  OPENING_BALANCE: 'bg-slate-100 text-slate-700',
};

const VendorLedgerForm: React.FC<{
  data: Partial<VendorLedgerEntry>;
  onChange: (d: Partial<VendorLedgerEntry>) => void;
  vendors: any[];
}> = ({ data, onChange, vendors }) => {
  const set = (k: keyof VendorLedgerEntry, v: any) => onChange({ ...data, [k]: v });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date" required>
          <Input type="date" value={data.date?.slice(0, 10) ?? ''} onChange={e => set('date', e.target.value)} />
        </FormField>
        <FormField label="Entry Type" required>
          <Select value={data.entryType ?? ''} onChange={e => set('entryType', e)}>
            <option value="">Select type…</option>
            {ENTRY_TABS.filter(t => t !== 'ALL').map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Vendor" required>
          <Select value={data.vendorName ?? ''} onChange={e => {
            const v = vendors.find(vv => vv.name === e);
            set('vendorName', e);
            set('vendorId', v?.id ?? '');
          }}>
            <option value="">Select vendor…</option>
            {vendors.map((v: any) => <option key={v.id} value={v.name}>{v.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Reference">
          <Input value={data.reference ?? ''} onChange={e => set('reference', e.target.value)} placeholder="BILL-001 / PMT-001…" />
        </FormField>
      </div>
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="Entry description…" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Debit (ETB)">
          <Input type="number" min="0" step="0.01" value={data.debit ?? ''} onChange={e => set('debit', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
        <FormField label="Credit (ETB)">
          <Input type="number" min="0" step="0.01" value={data.credit ?? ''} onChange={e => set('credit', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
      </div>
    </div>
  );
};

const VendorLedger: React.FC = () => {
  usePageTitle('Vendor Ledger');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab] = useState<EntryType>('ALL');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<VendorLedgerEntry> }>({ open: false, data: {} });
  const [vendors, setVendors] = useState<any[]>([]);
  const [ledgerData, setLedgerData] = useState<VendorLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchVendors = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const res = await api.get(`/ovds/vendors?companyId=${selectedCompanyId}`, { headers: { 'x-background': '1' } });
      const raw = res.data?.data ?? res.data;
      setVendors(Array.isArray(raw) ? raw : (raw?.data ?? []));
    } catch {
      setVendors([]);
    }
  }, [selectedCompanyId]);

  const fetchLedger = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ companyId: selectedCompanyId, page: String(page), limit: String(pageSize) });
      if (vendorFilter) qs.set('vendorId', vendorFilter);
      if (dateFrom) qs.set('dateFrom', dateFrom);
      if (dateTo) qs.set('dateTo', dateTo);
      if (tab !== 'ALL') qs.set('entryType', tab);
      const res = await api.get(`/procurement/vendor-ledger?${qs}`);
      const d = res.data?.data ?? res.data;
      const arr: VendorLedgerEntry[] = Array.isArray(d) ? d : (d?.data ?? []);
      setLedgerData(arr);
    } catch {
      setLedgerData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, vendorFilter, dateFrom, dateTo, tab, page, pageSize]);

  React.useEffect(() => { fetchVendors(); }, [fetchVendors]);
  React.useEffect(() => { fetchLedger(); }, [fetchLedger]);

  const filtered = useMemo(() => {
    let list = ledgerData;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        [e.vendorName, e.reference, e.description].some(x => String(x ?? '').toLowerCase().includes(q))
      );
    }
    return list;
  }, [ledgerData, search]);

  const runningBalance = useMemo(() => {
    let balance = 0;
    return filtered.map(entry => {
      balance += (Number(entry.debit) || 0) - (Number(entry.credit) || 0);
      return { ...entry, computedBalance: balance };
    });
  }, [filtered]);

  const summary = useMemo(() => {
    const totalDebits = runningBalance.reduce((s, e) => s + Number(e.debit || 0), 0);
    const totalCredits = runningBalance.reduce((s, e) => s + Number(e.credit || 0), 0);
    return {
      totalDebits,
      totalCredits,
      netBalance: totalDebits - totalCredits,
      entryCount: runningBalance.length,
    };
  }, [runningBalance]);

  const kpiCells = useMemo(() => [
    { label: 'Total Debits', value: fmtETB(summary.totalDebits), color: 'violet' as const, icon: <ArrowDownToLine size={15} /> },
    { label: 'Total Credits', value: fmtETB(summary.totalCredits), color: 'green' as const, icon: <ArrowUpFromLine size={15} /> },
    { label: 'Net Balance', value: fmtETB(summary.netBalance), color: summary.netBalance > 0 ? 'rose' as const : 'sky' as const },
    { label: 'Entries', value: String(summary.entryCount), color: 'slate' as const },
  ], [summary]);

  const handleSave = useCallback(async () => {
    if (!modal.data.vendorName) { toast.error('Vendor is required'); return; }
    try {
      await api.post('/procurement/vendor-ledger', modal.data);
      toast.success('Ledger entry created');
      setModal(m => ({ ...m, open: false }));
      fetchLedger();
    } catch {
      toast.error('Failed to save entry');
    }
  }, [modal.data, fetchLedger]);

  const handleDelete = useCallback(async (id: string) => {
    if (!(await confirm({ title: 'Delete entry?', variant: 'danger' }))) return;
    try {
      await api.delete(`/procurement/vendor-ledger/${id}`);
      toast.success('Deleted');
      fetchLedger();
    } catch {
      toast.error('Failed to delete');
    }
  }, [fetchLedger]);

  const handleExport = () => {
    if (!runningBalance.length) return;
    const headers = 'Date,Vendor,Type,Reference,Description,Debit,Credit,Balance\n';
    const rows = runningBalance.map(e =>
      `"${e.date}","${e.vendorName}","${e.entryType}","${e.reference}","${e.description}",${e.debit},${e.credit},${e.computedBalance}`
    ).join('\n');
    downloadCSV(headers + rows, `vendor-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="Vendor Ledger"
      subtitle="Transaction-level AP ledger per vendor · Accounts Payable · Supply Chain"
      icon={<BookOpen size={18} />}
      crumbs={[{ label: 'Vendor Ledger' }]}
      tabs={
        <AppTabs
          tabs={ENTRY_TABS.map(t => ({ key: t, label: t.replace(/_/g, ' ') }))}
          active={tab}
          onChange={k => { setTab(k as EntryType); setPage(1); }}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={fetchLedger}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {can('bills:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { date: new Date().toISOString().slice(0, 10) } })}>New Entry</Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search ledger…" className="w-52" />
        <Select value={vendorFilter} onChange={e => { setVendorFilter(e); setPage(1); }} className="w-48">
          <option value="">All Vendors</option>
          {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </Select>
        <div className="flex items-center gap-1.5">
          <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="w-36" />
          <span className="text-slate-400 text-xs">to</span>
          <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="w-36" />
        </div>
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} entries</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Date</AppTh>
          <AppTh>Vendor</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Reference</AppTh>
          <AppTh>Description</AppTh>
          <AppTh align="right">Debit</AppTh>
          <AppTh align="right">Credit</AppTh>
          <AppTh align="right">Balance</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : runningBalance.length === 0 ? (
            <tr><td colSpan={9}>
              <EmptyState icon={<BookOpen size={18} />} title="No ledger entries" desc="Create your first entry to start tracking" action={can('bills:write') ? { label: 'New Entry', onClick: () => setModal({ open: true, data: { date: new Date().toISOString().slice(0, 10) } }) } : undefined} />
            </td></tr>
          ) : runningBalance.map(e => (
            <AppTr key={e.id}>
              <AppTd>{fmtDate(e.date)}</AppTd>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-amber-50 flex items-center justify-center"><FileText size={10} className="text-amber-600" /></div>
                  <span className="text-[12px] text-slate-700">{e.vendorName ?? '—'}</span>
                </div>
              </AppTd>
              <AppTd><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ENTRY_COLORS[e.entryType] ?? 'bg-slate-100 text-slate-600'}`}>{e.entryType.replace(/_/g, ' ')}</span></AppTd>
              <AppTd><span className="font-mono text-[11px] text-slate-600">{e.reference ?? '—'}</span></AppTd>
              <AppTd><span className="text-[12px] text-slate-600 truncate max-w-[200px] block">{e.description ?? '—'}</span></AppTd>
              <AppTd align="right"><Amount value={Number(e.debit)} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={Number(e.credit)} size="sm" /></AppTd>
              <AppTd align="right"><span className={`text-[12px] font-bold font-mono ${e.computedBalance >= 0 ? 'text-[var(--pro-azure-dark)]' : 'text-rose-600'}`}>{fmtETB(e.computedBalance)}</span></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {can('bills:write') && (
                    <>
                      <button onClick={() => setModal({ open: true, data: { ...e } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all" title="Edit"><Edit2 size={11} /></button>
                      <button onClick={() => handleDelete(e.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                    </>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>

      <div className="mt-3"><Pagination page={page} total={Math.ceil(ledgerData.length / pageSize) * pageSize} pageSize={pageSize} onChange={setPage} /></div>

      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.data.id ? 'Edit Ledger Entry' : 'New Ledger Entry'}
        subtitle="Accounts Payable · Vendor ledger management"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={false} onClick={handleSave}>Save Entry</Btn></>}
      >
        <VendorLedgerForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} vendors={vendors} />
      </Modal>
    </AppPage>
  );
};

export default VendorLedger;
