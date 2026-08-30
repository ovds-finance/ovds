/**
 * EntityGroups — IFRS 10 multi-entity group management
 *
 * Backend: EntityGroupController @Controller('ovds/accounting/entity-groups')
 */
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { confirm } from '../utils/confirm';
import { entityGroupsApi } from '../services/ovdsApi';
import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, EmptyState, SearchBar,
} from '../components/ui';

interface EntityGroup {
  id: string;
  name: string;
  parentId?: string;
  parent?: { id: string; name: string };
  reportCurrency: string;
  createdAt: string;
  updatedAt: string;
}

const EntityGroups: React.FC = () => {
  usePageTitle('Entity Groups');
  const { selectedCompanyId } = useBusiness();
  const [groups, setGroups] = useState<EntityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<EntityGroup> }>({ open: false, data: {} });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await entityGroupsApi.list();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load entity groups');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!modal.data.name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (modal.data.id) {
        await entityGroupsApi.update(modal.data.id, { name: modal.data.name, reportCurrency: modal.data.reportCurrency });
        toast.success('Entity group updated');
      } else {
        await entityGroupsApi.create({ name: modal.data.name, parentId: modal.data.parentId, reportCurrency: modal.data.reportCurrency || 'ETB' });
        toast.success('Entity group created');
      }
      setModal({ open: false, data: {} });
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (g: EntityGroup) => {
    if (!await confirm({ title: `Delete "${g.name}"?`, message: 'This cannot be undone.', variant: 'danger' })) return;
    try {
      await entityGroupsApi.remove(g.id);
      toast.success('Entity group deleted');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Delete failed');
    }
  };

  const filtered = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppPage
      title="Entity Groups"
      subtitle="IFRS 10 — Group reporting structure for multi-entity consolidation"
      icon={<Building2 size={18} />}
      crumbs={[{ label: 'IFRS & Standards' }, { label: 'Entity Groups' }]}
      actions={
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={load}>Refresh</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { reportCurrency: 'ETB' } })}>
            Add Group
          </Btn>
        </div>
      }
    >
      <AppKpi cells={[
        { label: 'Total Groups', value: groups.length, color: 'emerald' as const },
        { label: 'Report Currency', value: 'ETB', color: 'sky' as const },
      ]} />

      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search groups…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} groups</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Name</AppTh>
          <AppTh>Report Currency</AppTh>
          <AppTh>Parent</AppTh>
          <AppTh align="right">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={4}><EmptyState icon={<Building2 size={18} />} title="No entity groups" desc="Create your first group for consolidation reporting" action={{ label: 'Add Group', onClick: () => setModal({ open: true, data: { reportCurrency: 'ETB' } }) }} /></td></tr>
          ) : filtered.map(g => (
            <AppTr key={g.id}>
              <AppTd><span className="text-[12px] font-semibold text-slate-800">{g.name}</span></AppTd>
              <AppTd><span className="text-[11px] font-mono text-slate-600">{g.reportCurrency}</span></AppTd>
              <AppTd><span className="text-[11px] text-slate-500">{g.parent?.name ?? '—'}</span></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1">
                  <Btn size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setModal({ open: true, data: { ...g } })}><Edit2 size={11} /></Btn>
                  <Btn size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(g)}><Trash2 size={11} /></Btn>
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit Entity Group' : 'New Entity Group'} subtitle="IFRS 10 — Group reporting structure"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create'}</Btn></>}>
        <div className="space-y-3">
          <FormField label="Group Name" required>
            <Input value={modal.data.name ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, name: e.target.value } }))} placeholder="e.g. Main Group" />
          </FormField>
          <FormField label="Report Currency">
            <Input value={modal.data.reportCurrency ?? 'ETB'} onChange={e => setModal(m => ({ ...m, data: { ...m.data, reportCurrency: e.target.value } }))} placeholder="ETB" />
          </FormField>
        </div>
      </Modal>
    </AppPage>
  );
};

export default EntityGroups;
