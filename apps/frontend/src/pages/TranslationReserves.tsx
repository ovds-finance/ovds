/**
 * TranslationReserves — IAS 21 foreign currency translation reserves
 *
 * Backend: TranslationReserveController @Controller('ovds/accounting/translation-reserves')
 */
import React, { useState } from 'react';
import { Plus, RefreshCw, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { translationReservesApi } from '../services/ovdsApi';
import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Select, EmptyState, SearchBar,
} from '../components/ui';

interface TranslationReserve {
  id: string;
  entityId: string;
  currency: string;
  amount: number;
  period: string;
  translationType: string;
  createdAt: string;
}

const TranslationReserves: React.FC = () => {
  usePageTitle('Translation Reserves');
  const { selectedCompanyId } = useBusiness();
  const [reserves, setReserves] = useState<TranslationReserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<TranslationReserve> }>({ open: false, data: {} });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await translationReservesApi.list(selectedCompanyId ?? undefined);
      setReserves(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load translation reserves');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!modal.data.entityId || !modal.data.currency || !modal.data.amount || !modal.data.period || !modal.data.translationType) {
      toast.error('All fields are required'); return;
    }
    setSaving(true);
    try {
      await translationReservesApi.create({
        companyId: selectedCompanyId ?? '',
        entityId: modal.data.entityId,
        currency: modal.data.currency,
        amount: Number(modal.data.amount),
        period: modal.data.period,
        translationType: modal.data.translationType,
      });
      toast.success('Translation reserve created');
      setModal({ open: false, data: {} });
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = reserves.filter(r =>
    r.entityId.toLowerCase().includes(search.toLowerCase()) ||
    r.currency.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppPage
      title="Translation Reserves"
      subtitle="IAS 21 — Foreign currency translation reserves for group consolidation"
      icon={<Globe size={18} />}
      iconBg="bg-sky-500"
      crumbs={[{ label: 'IFRS & Standards' }, { label: 'Translation Reserves' }]}
      actions={
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={load}>Refresh</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: {} })}>
            Add Entry
          </Btn>
        </div>
      }
    >
      <AppKpi cells={[
        { label: 'Total Entries', value: reserves.length, color: 'emerald' as const },
        { label: 'Total Amount', value: `ETB ${reserves.reduce((s, r) => s + Number(r.amount), 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`, color: 'sky' as const },
      ]} />

      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search reserves…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} entries</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Entity</AppTh>
          <AppTh>Currency</AppTh>
          <AppTh align="right">Amount</AppTh>
          <AppTh>Period</AppTh>
          <AppTh>Type</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={5}><EmptyState icon={<Globe size={18} />} title="No translation reserves" desc="Add your first IAS 21 translation reserve entry" action={{ label: 'Add Entry', onClick: () => setModal({ open: true, data: {} }) }} /></td></tr>
          ) : filtered.map(r => (
            <AppTr key={r.id}>
              <AppTd><span className="text-[12px] font-semibold text-slate-800">{r.entityId}</span></AppTd>
              <AppTd><span className="text-[11px] font-mono text-slate-600">{r.currency}</span></AppTd>
              <AppTd align="right"><span className="text-[12px] font-bold tabular-nums text-slate-700">{Number(r.amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })}</span></AppTd>
              <AppTd><span className="text-[11px] text-slate-500">{r.period}</span></AppTd>
              <AppTd><span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">{r.translationType}</span></AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title="New Translation Reserve" subtitle="IAS 21 — Foreign currency translation"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>Create</Btn></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Entity ID" required>
              <Input value={modal.data.entityId ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, entityId: e.target.value } }))} placeholder="entity-1" />
            </FormField>
            <FormField label="Currency" required>
              <Input value={modal.data.currency ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, currency: e.target.value.toUpperCase() } }))} placeholder="USD" maxLength={3} className="font-mono uppercase" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount" required>
              <Input type="number" value={modal.data.amount ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, amount: parseFloat(e.target.value) || 0 } }))} placeholder="0.00" />
            </FormField>
            <FormField label="Period" required>
              <Input value={modal.data.period ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, period: e.target.value } }))} placeholder="2026-01" />
            </FormField>
          </div>
          <FormField label="Translation Type" required>
            <Select value={modal.data.translationType ?? 'CURRENT_RATE'} onChange={e => setModal(m => ({ ...m, data: { ...m.data, translationType: e } }))}>
              <option value="CURRENT_RATE">Current Rate (closing)</option>
              <option value="HISTORICAL_RATE">Historical Rate</option>
              <option value="AVERAGE_RATE">Average Rate</option>
            </Select>
          </FormField>
        </div>
      </Modal>
    </AppPage>
  );
};

export default TranslationReserves;
