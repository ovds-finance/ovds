/**
 * FundTransfers — ovds-style inter-account transfers
 * AppPage · AppKpi · AppTable · useApiCrud
 * Ethiopian bank accounts · ETB currency
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight, Plus, RefreshCw,
  Landmark, CheckCircle2, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { fmtETB } from '../utils/ethiopianTax';
import api from '../services/api';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, Amount, EmptyState, Pagination,
} from '../components/ui';
import { evalMath } from '@ovds/ui';
import CustomFieldRenderer, { type CustomFieldValuesMap } from '../components/CustomFieldRenderer';

interface FundTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currencyCode?: string;
  type?: string;
  status: string;
  reference?: string;
  note?: string;
  companyId?: string;
  createdAt: string;
}

type FilterTab = 'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED';

const TransferForm: React.FC<{
  data: Partial<FundTransfer>;
  onChange: (d: Partial<FundTransfer>) => void;
  bankAccounts: any[];
}> = ({ data, onChange, bankAccounts }) => {
  const set = (k: keyof FundTransfer, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <FormField label="From Account" required>
        <Select value={data.fromAccountId ?? ''} onChange={e => set('fromAccountId', e)}>
          <option value="">Select source account</option>
          {bankAccounts.map(a => (
            <option key={a.id} value={a.id}>{a.name} — {a.bankName} ({fmtETB(a.balance ?? 0)})</option>
          ))}
        </Select>
      </FormField>
      <FormField label="To Account" required>
        <Select value={data.toAccountId ?? ''} onChange={e => set('toAccountId', e)}>
          <option value="">Select destination account</option>
          {bankAccounts.filter(a => a.id !== data.fromAccountId).map(a => (
            <option key={a.id} value={a.id}>{a.name} — {a.bankName}</option>
          ))}
        </Select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Amount (ETB)" required>
          <Input type="text" step="0.01" value={data.amount ?? ''} onChange={e => set('amount', e.target.value)} onBlur={e => set('amount', Number((evalMath(e.target.value) ?? parseFloat(e.target.value)) || 0))} placeholder="0.00" />
        </FormField>
        <FormField label="Type">
          <Select value={data.type ?? 'INTERNAL'} onChange={e => set('type', e)}>
            <option value="INTERNAL">Internal</option>
            <option value="ACH">ACH</option>
            <option value="WIRE">Wire Transfer</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Reference">
        <Input value={data.reference ?? ''} onChange={e => set('reference', e.target.value)} placeholder="Transfer reference" />
      </FormField>
      <FormField label="Note">
        <Textarea value={data.note ?? ''} onChange={e => set('note', e.target.value)} rows={2} placeholder="Purpose of transfer…" />
      </FormField>
    </div>
  );
};

const FundTransfers: React.FC = () => {
  usePageTitle('Fund Transfers');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<FundTransfer> }>({ open: false, data: {} });
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValuesMap>({});
  const handleCustomFieldChange = useCallback((values: CustomFieldValuesMap) => {
    setCustomFieldValues(values);
  }, []);

  // Auto-open "New Transfer" modal from ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setModal({ open: true, data: {} });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (k: FilterTab) => { setTab(k); setPage(1); };
  const handleSearch    = (v: string)    => { setSearch(v); setPage(1); };

  const { rows, total, page, loading, saving, save, refetch, setPage } = useApiCrud<FundTransfer>({
    endpoint: '/ovds/transfers',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts', selectedCompanyId],
    queryFn: () => api.get(`/ovds/bank-accounts${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`).then((r: any) => {
      const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : [];
    }).catch(() => [] as any[]),
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(t => t.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => [t.reference, t.note, t.type].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',     value: rows.length,                                                       color: 'emerald' as const },
    { label: 'Pending',   value: rows.filter(t => t.status === 'PENDING').length,                   color: 'amber' as const },
    { label: 'Completed', value: rows.filter(t => t.status === 'COMPLETED').length,                 color: 'sky' as const },
    { label: 'Volume',    value: fmtETB(rows.reduce((s, t) => s + Number(t.amount ?? 0), 0)),       color: 'violet' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.fromAccountId || !modal.data.toAccountId) { toast.error('Select both accounts'); return; }
    if (!modal.data.amount || modal.data.amount <= 0) { toast.error('Enter a valid amount'); return; }
    const payload = { ...modal.data, customFields: customFieldValues };
    const result = await save(payload as any);
    if (result) {
      setModal(m => ({ ...m, open: false }));
      setCustomFieldValues({});
    }
  }, [modal.data, save, customFieldValues]);

  const getAccountName = (id: string) => {
    if (!id) return '—';
    const acct = bankAccounts.find((a: any) => a.id === id);
    if (acct) return acct.name;
    // Bank accounts still loading — show a short placeholder, not a raw UUID
    return bankAccounts.length === 0 ? '…' : id.slice(0, 8) + '…';
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/ovds/transfers/${id}/approve`);
      toast.success('Transfer approved'); refetch();
    } catch { toast.error('Failed to approve transfer'); }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/ovds/transfers/${id}/reject`);
      toast.success('Transfer rejected'); refetch();
    } catch { toast.error('Failed to reject transfer'); }
  };

  return (
    <AppPage
      title="Fund Transfers"
      subtitle="Inter-account transfers · Ethiopian bank accounts · Banking & ovds · Accounting & ovds Software · Revenue · Market Segmentation"
      icon={<ArrowLeftRight size={18} />}
      crumbs={[{ label: 'Fund Transfers' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',       label: 'All',       count: rows.length },
            { key: 'PENDING',   label: 'Pending',   count: rows.filter(t => t.status === 'PENDING').length },
            { key: 'COMPLETED', label: 'Completed', count: rows.filter(t => t.status === 'COMPLETED').length },
            { key: 'FAILED',    label: 'Failed',    count: rows.filter(t => t.status === 'FAILED').length },
          ]}
          active={tab}
          onChange={k => handleTabChange(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          {can('fund_transfers:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { type: 'INTERNAL', currencyCode: 'ETB' } })}>
              New Transfer
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search transfers…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} transfers</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>From</AppTh>
          <AppTh>To</AppTh>
          <AppTh align="right">Amount</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Reference</AppTh>
          <AppTh>Date</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}><EmptyState icon={<ArrowLeftRight size={18} />} title="No transfers" desc="Create your first fund transfer" action={can('fund_transfers:write') ? { label: 'New Transfer', onClick: () => setModal({ open: true, data: { type: 'INTERNAL', currencyCode: 'ETB' } }) } : undefined} /></td></tr>
          ) : filtered.map(t => (
            <AppTr key={t.id}>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-sky-50 flex items-center justify-center"><Landmark size={10} className="text-sky-600" /></div>
                  <span className="text-[11px] text-slate-700 truncate max-w-[120px]">{getAccountName(t.fromAccountId)}</span>
                </div>
              </AppTd>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center"><Landmark size={10} className="text-emerald-600" /></div>
                  <span className="text-[11px] text-slate-700 truncate max-w-[120px]">{getAccountName(t.toAccountId)}</span>
                </div>
              </AppTd>
              <AppTd align="right"><Amount value={Number(t.amount)} size="sm" /></AppTd>
              <AppTd><span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">{t.type ?? 'INTERNAL'}</span></AppTd>
              <AppTd><span className="font-mono text-[10px] text-slate-400">{t.reference ?? '—'}</span></AppTd>
              <AppTd>
                <span className="ovds-caption">
                  {t.createdAt
                    ? (() => { const d = new Date(t.createdAt); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(); })()
                    : '—'}
                </span>
              </AppTd>
              <AppTd><StatusBadge status={t.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.status === 'PENDING' && can('fund_transfers:approve') && (
                    <button onClick={() => handleApprove(t.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Approve transfer">
                      <CheckCircle2 size={11} />
                    </button>
                  )}
                  {t.status === 'PENDING' && can('fund_transfers:approve') && (
                    <button onClick={() => handleReject(t.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Reject transfer">
                      <XCircle size={11} />
                    </button>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => { setModal(m => ({ ...m, open: false })); setCustomFieldValues({}); }} title="New Fund Transfer" subtitle="Inter-account transfer · Ethiopian bank accounts"
        footer={<><Btn variant="secondary" onClick={() => { setModal(m => ({ ...m, open: false })); setCustomFieldValues({}); }}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>Create Transfer</Btn></>}>
        <TransferForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} bankAccounts={bankAccounts} />
        {selectedCompanyId && (
          <div className="mt-4">
            <CustomFieldRenderer feature="fund-transfer" entityId={modal.data.id} companyId={selectedCompanyId}
              onChange={handleCustomFieldChange} initialValues={customFieldValues} showTitle={false} />
          </div>
        )}
      </Modal>
    </AppPage>
  );
};

export default FundTransfers;


