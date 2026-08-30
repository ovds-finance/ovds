/**
 * Stamp Duty — Ethiopia
 * Proclamation No. 110/1998 (as amended)
 * Regional/City Revenue Bureaus
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Select, Icon, Amount, StatusBadge,
} from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  calculateStampDuty,
  STAMP_DUTY_RATES,
  type StampDutyDocumentType,
} from '@ovds/ui';

const today = new Date().toISOString().slice(0, 10);
const fmt   = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtK  = (n: number) => Math.abs(n) >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : Math.abs(n) >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : fmt(n);

const DOC_TYPES: { value: StampDutyDocumentType; label: string }[] = [
  { value: 'MEMORANDUM_OF_ASSOCIATION', label: 'Memorandum of Association' },
  { value: 'ARTICLES_OF_ASSOCIATION',   label: 'Articles of Association' },
  { value: 'SHARE_CERTIFICATE',         label: 'Share Certificate' },
  { value: 'SHARE_TRANSFER',            label: 'Share Transfer' },
  { value: 'DEBENTURE',                 label: 'Debenture' },
  { value: 'LEASE_AGREEMENT',           label: 'Lease Agreement' },
  { value: 'PROPERTY_TRANSFER',         label: 'Property Transfer' },
  { value: 'POWER_OF_ATTORNEY',         label: 'Power of Attorney' },
  { value: 'PROMISSORY_NOTE',           label: 'Promissory Note' },
  { value: 'BILL_OF_EXCHANGE',          label: 'Bill of Exchange' },
  { value: 'CONTRACT',                  label: 'Contract' },
  { value: 'INSURANCE_POLICY',          label: 'Insurance Policy' },
  { value: 'LOAN_AGREEMENT',            label: 'Loan Agreement' },
  { value: 'RECEIPT',                   label: 'Receipt' },
  { value: 'OTHER',                     label: 'Other' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT:   'bg-slate-100 text-slate-600',
  PAID:    'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  EXEMPT:  'bg-white text-slate-400',
};

function AddStampDutyModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    documentType: 'CONTRACT' as StampDutyDocumentType,
    documentDescription: '', documentDate: today,
    transactionValue: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const stampDutyAmount = calculateStampDuty(form.documentType, parseFloat(form.transactionValue) || 0);
  const config = STAMP_DUTY_RATES[form.documentType];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.documentDescription) { toast.error('Document description required'); return; }
    setSaving(true);
    try {
      await api.post('/ovds/stamp-duty', {
        ...form,
        transactionValue: parseFloat(form.transactionValue) || 0,
        stampDutyAmount,
      });
      toast.success('Stamp duty record added'); onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title="Add Stamp Duty Record" onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={save}>Save</Btn></>}
    >
      <form onSubmit={save} className="space-y-4">
        <FormField label="Document Type">
          <Select value={form.documentType} onChange={e => set('documentType', e)}>
            {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </FormField>
        <div className="px-3 py-2 bg-white rounded-xl text-xs text-slate-600 border border-slate-200">
          {config.notes}
        </div>
        <FormField label="Description" required>
          <Input value={form.documentDescription} onChange={e => set('documentDescription', e.target.value)} />
        </FormField>
        <div className="ovds-grid-layout cols-2">
          <FormField label="Document Date">
            <Input type="date" value={form.documentDate} onChange={e => set('documentDate', e.target.value)} />
          </FormField>
          {config.type === 'PERCENTAGE' && (
            <FormField label="Transaction Value (ETB)">
              <Input type="number" min="0" step="0.01" value={form.transactionValue} onChange={e => set('transactionValue', e.target.value)} />
            </FormField>
          )}
        </div>
        {stampDutyAmount > 0 && (
          <div className="flex justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm">
            <span className="text-amber-700 font-semibold">Stamp Duty Due</span>
            <span className="font-bold text-amber-800">ETB {fmt(stampDutyAmount)}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}

const StampDuty: React.FC = () => {
  usePageTitle('Stamp Duty');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const canWrite = can('vat:write');

  const [activeTab, setActiveTab] = useState<'records' | 'rates' | 'calculator'>('records');
  const [showAdd, setShowAdd]     = useState(false);
  const [records, setRecords]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
      const res = await api.get(`/ovds/stamp-duty${cq}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: [] }));
      setRecords(res.data?.data ?? res.data ?? []);
    } finally { setLoading(false); }
  }, [selectedCompanyId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalDue  = records.reduce((s: number, r: any) => s + Number(r.stampDutyAmount ?? 0), 0);
  const totalPaid = records.filter((r: any) => r.status === 'PAID').reduce((s: number, r: any) => s + Number(r.stampDutyAmount ?? 0), 0);

  const TABS = [
    { key: 'records',    label: `Records (${records.length})` },
    { key: 'rates',      label: 'Rate Reference' },
    { key: 'calculator', label: 'Calculator' },
  ] as const;

  return (
    <AppPage
      title="Stamp Duty"
      subtitle="Proclamation No. 110/1998 · Contracts, share transfers, leases & instruments · Banking & ovds · Real Estate · Investment Trends · Market Value"
      icon={<Icon name="RECEIPT" size={18} />}
      crumbs={[{ label: 'Tax & Compliance', to: '/tax/dashboard' }, { label: 'Stamp Duty' }]}
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<Icon name="REFRESH" size={12} className={loading ? 'animate-spin' : ''} />} onClick={fetchAll}>Refresh</Btn>
          {canWrite && <Btn variant="primary" size="sm" icon={<Icon name="PLUS" size={12} />} onClick={() => setShowAdd(true)}>Add Record</Btn>}
        </>
      }
      tabs={<AppTabs tabs={TABS.map(t => ({ key: t.key, label: t.label }))} active={activeTab} onChange={k => setActiveTab(k as any)} />}
    >
      <AppKpi cells={[
        { label: 'Total Records',   value: String(records.length),           icon: <Icon name="RECEIPT" size={14} />, color: 'emerald' },
        { label: 'Total Duty Due',  value: `ETB ${fmtK(totalDue)}`,          icon: <Icon name="MONEY" size={14} />,   color: 'violet' },
        { label: 'Paid',            value: `ETB ${fmtK(totalPaid)}`,          icon: <Icon name="SUCCESS" size={14} />, color: 'emerald' },
        { label: 'Outstanding',     value: `ETB ${fmtK(totalDue - totalPaid)}`, icon: <Icon name="WARNING" size={14} />, color: 'amber' },
      ]} />

      {activeTab === 'records' && (
        <AppTable>
          <thead><tr>
            <AppTh>Document Type</AppTh>
            <AppTh>Description</AppTh>
            <AppTh>Date</AppTh>
            <AppTh align="right">Transaction Value</AppTh>
            <AppTh align="right">Stamp Duty</AppTh>
            <AppTh>Status</AppTh>
          </tr></thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <AppTr key={i}>{Array.from({ length: 6 }).map((_, j) => <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>)}</AppTr>
            )) : records.length === 0 ? (
              <AppTr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">No stamp duty records yet.</td></AppTr>
            ) : records.map((r: any) => (
              <AppTr key={r.id}>
                <AppTd className="text-[11px] font-semibold">{DOC_TYPES.find(t => t.value === r.documentType)?.label ?? r.documentType}</AppTd>
                <AppTd className="max-w-[200px] truncate">{r.documentDescription}</AppTd>
                <AppTd>{r.documentDate ? new Date(r.documentDate).toLocaleDateString() : '—'}</AppTd>
                <AppTd align="right"><Amount value={r.transactionValue ?? 0} size="sm" /></AppTd>
                <AppTd align="right" className="font-bold"><Amount value={r.stampDutyAmount} size="sm" /></AppTd>
                <AppTd>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status ?? 'DRAFT']}`}>{r.status ?? 'DRAFT'}</span>
                </AppTd>
              </AppTr>
            ))}
          </tbody>
        </AppTable>
      )}

      {activeTab === 'rates' && (
        <div className="space-y-3">
          {DOC_TYPES.map(dt => {
            const config = STAMP_DUTY_RATES[dt.value];
            return (
              <div key={dt.value} className="flex items-center justify-between px-5 py-3 ovds-widget-card">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{dt.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{config.notes}</p>
                </div>
                <span className="text-sm font-bold text-emerald-700 shrink-0 ml-4">
                  {config.type === 'FIXED' ? `ETB ${fmt(config.fixedAmount ?? 0)} flat` : `${((config.rate ?? 0) * 100).toFixed(1)}% of value`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'calculator' && (
        <div className="ovds-widget-card p-6 max-w-lg">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Stamp Duty Calculator</p>
          <StampDutyCalc />
        </div>
      )}

      {showAdd && <AddStampDutyModal onClose={() => setShowAdd(false)} onSaved={fetchAll} />}
    </AppPage>
  );
};

const StampDutyCalc: React.FC = () => {
  const [docType, setDocType] = useState<StampDutyDocumentType>('CONTRACT');
  const [value, setValue]     = useState('');
  const config = STAMP_DUTY_RATES[docType];
  const duty   = calculateStampDuty(docType, parseFloat(value) || 0);
  return (
    <div className="space-y-4">
      <FormField label="Document Type">
        <Select value={docType} onChange={e => setDocType(e as StampDutyDocumentType)}>
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </FormField>
      <div className="px-3 py-2 bg-white rounded-xl text-xs text-slate-600">{config.notes}</div>
      {config.type === 'PERCENTAGE' && (
        <FormField label="Transaction Value (ETB)">
          <Input type="number" min="0" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="0.00" />
        </FormField>
      )}
      <div className="flex justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <span className="text-sm font-semibold text-amber-700">Stamp Duty Due</span>
        <span className="text-xl font-bold tabular-nums text-amber-800">ETB {fmt(duty)}</span>
      </div>
    </div>
  );
};

export default StampDuty;

