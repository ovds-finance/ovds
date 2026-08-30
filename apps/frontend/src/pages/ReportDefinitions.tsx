/**
 * ReportDefinitions — custom report definition management
 *
 * Backend: ReportDefinitionController @Controller('ovds/reports/definitions')
 */
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { confirm } from '../utils/confirm';
import { reportDefinitionsApi } from '../services/ovdsApi';
import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Select, EmptyState, SearchBar,
} from '../components/ui';

interface ReportDefinition {
  id: string;
  name: string;
  type: string;
  period: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ReportDefinitions: React.FC = () => {
  usePageTitle('Report Definitions');
  const { selectedCompanyId } = useBusiness();
  const [defs, setDefs] = useState<ReportDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<ReportDefinition> }>({ open: false, data: {} });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await reportDefinitionsApi.list(selectedCompanyId ?? undefined);
      setDefs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load report definitions');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!modal.data.name || !modal.data.type || !modal.data.period) { toast.error('Name, type, and period are required'); return; }
    setSaving(true);
    try {
      if (modal.data.id) {
        await reportDefinitionsApi.update(modal.data.id, { name: modal.data.name, definition: modal.data.definition, isActive: modal.data.isActive });
        toast.success('Report definition updated');
      } else {
        await reportDefinitionsApi.create({
          companyId: selectedCompanyId ?? '',
          name: modal.data.name,
          type: modal.data.type,
          period: modal.data.period,
          definition: modal.data.definition || '{}',
        });
        toast.success('Report definition created');
      }
      setModal({ open: false, data: {} });
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d: ReportDefinition) => {
    if (!await confirm({ title: `Delete "${d.name}"?`, message: 'This cannot be undone.', variant: 'danger' })) return;
    try {
      await reportDefinitionsApi.remove(d.id);
      toast.success('Report definition deleted');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Delete failed');
    }
  };

  const filtered = defs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppPage
      title="Report Definitions"
      subtitle="Custom financial report templates and structures"
      icon={<FileText size={18} />}
      iconBg="bg-violet-500"
      crumbs={[{ label: 'Reports' }, { label: 'Report Definitions' }]}
      actions={
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={load}>Refresh</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: {} })}>
            New Definition
          </Btn>
        </div>
      }
    >
      <AppKpi cells={[
        { label: 'Total Definitions', value: defs.length, color: 'emerald' as const },
        { label: 'Active', value: defs.filter(d => d.isActive).length, color: 'sky' as const },
      ]} />

      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search definitions…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} definitions</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Name</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Period</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={5}><EmptyState icon={<FileText size={18} />} title="No report definitions" desc="Create your first custom report definition" action={{ label: 'New Definition', onClick: () => setModal({ open: true, data: {} }) }} /></td></tr>
          ) : filtered.map(d => (
            <AppTr key={d.id}>
              <AppTd><span className="text-[12px] font-semibold text-slate-800">{d.name}</span></AppTd>
              <AppTd><span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">{d.type}</span></AppTd>
              <AppTd><span className="text-[11px] text-slate-500">{d.period}</span></AppTd>
              <AppTd><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${d.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{d.isActive ? 'Active' : 'Inactive'}</span></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1">
                  <Btn size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setModal({ open: true, data: { ...d } })}><Edit2 size={11} /></Btn>
                  <Btn size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(d)}><Trash2 size={11} /></Btn>
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit Report Definition' : 'New Report Definition'} subtitle="Custom financial report structure"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create'}</Btn></>}>
        <div className="space-y-3">
          <FormField label="Name" required>
            <Input value={modal.data.name ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, name: e.target.value } }))} placeholder="Custom Balance Sheet" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type" required>
              <Select value={modal.data.type ?? 'BALANCE_SHEET'} onChange={e => setModal(m => ({ ...m, data: { ...m.data, type: e } }))}>
                <option value="BALANCE_SHEET">Balance Sheet</option>
                <option value="INCOME_STATEMENT">Income Statement</option>
                <option value="CASH_FLOW">Cash Flow</option>
                <option value="TRIAL_BALANCE">Trial Balance</option>
              </Select>
            </FormField>
            <FormField label="Period" required>
              <Input value={modal.data.period ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, period: e.target.value } }))} placeholder="2026-01" />
            </FormField>
          </div>
          <FormField label="Definition (JSON)">
            <Input value={modal.data.definition ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, definition: e.target.value } }))} placeholder='{"sections":[]}' />
          </FormField>
        </div>
      </Modal>
    </AppPage>
  );
};

export default ReportDefinitions;

