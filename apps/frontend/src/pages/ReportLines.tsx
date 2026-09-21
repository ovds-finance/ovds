/**
 * ReportLines — manage individual lines within report definitions
 *
 * Backend: ReportLineController @Controller('ovds/reports/lines')
 */
import { Plus, Edit2, Trash2, RefreshCw, List } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Select, EmptyState, SearchBar,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { reportLinesApi, reportDefinitionsApi } from '../services/ovdsApi';
import { confirm } from '../utils/confirm';

interface ReportLine {
  id: string;
  reportDefinitionId: string;
  lineOrder: number;
  accountCode: string;
  description: string;
  amount: number;
  isHeader: boolean;
  createdAt: string;
}

interface ReportDefinition {
  id: string;
  name: string;
}

const ReportLines: React.FC = () => {
  usePageTitle('Report Lines');
  const { selectedCompanyId } = useBusiness();
  const [lines, setLines] = useState<ReportLine[]>([]);
  const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDef, setSelectedDef] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<ReportLine> }>({ open: false, data: {} });
  const [saving, setSaving] = useState(false);

  const loadDefinitions = async () => {
    try {
      const data = await reportDefinitionsApi.list(selectedCompanyId ?? undefined);
      const defs = Array.isArray(data) ? data : [];
      setDefinitions(defs);
      if (defs.length > 0 && !selectedDef) setSelectedDef(defs[0].id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load report definitions');
    }
  };

  const loadLines = async () => {
    if (!selectedDef) return;
    setLoading(true);
    try {
      const data = await reportLinesApi.list(selectedDef, selectedCompanyId ?? undefined);
      setLines(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load report lines');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { loadDefinitions(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { loadLines(); }, [selectedDef]);

  const handleSave = async () => {
    if (!modal.data.reportDefinitionId || !modal.data.lineOrder || !modal.data.accountCode || !modal.data.description || modal.data.amount === undefined) {
      toast.error('All fields are required'); return;
    }
    setSaving(true);
    try {
      if (modal.data.id) {
        await reportLinesApi.update(modal.data.reportDefinitionId!, modal.data.id, { amount: modal.data.amount, description: modal.data.description, lineOrder: modal.data.lineOrder });
        toast.success('Report line updated');
      } else {
        await reportLinesApi.create(modal.data.reportDefinitionId!, {
          companyId: selectedCompanyId ?? '',
          reportDefinitionId: modal.data.reportDefinitionId,
          lineOrder: modal.data.lineOrder,
          accountCode: modal.data.accountCode,
          description: modal.data.description,
          amount: Number(modal.data.amount),
          isHeader: modal.data.isHeader ?? false,
        });
        toast.success('Report line created');
      }
      setModal({ open: false, data: {} });
      await loadLines();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (l: ReportLine) => {
    if (!await confirm({ title: `Delete line "${l.description}"?`, message: 'This cannot be undone.', variant: 'danger' })) return;
    try {
      await reportLinesApi.remove(selectedDef, l.id);
      toast.success('Report line deleted');
      await loadLines();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Delete failed');
    }
  };

  const selectedDefName = definitions.find(d => d.id === selectedDef)?.name ?? 'Select a report';

  return (
    <AppPage
      title="Report Lines"
      subtitle="Manage individual lines within report definitions"
      icon={<List size={18} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      crumbs={[{ label: 'Reports' }, { label: 'Report Lines' }]}
      actions={
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={loadLines}>Refresh</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { reportDefinitionId: selectedDef, isHeader: false } })} disabled={!selectedDef}>
            Add Line
          </Btn>
        </div>
      }
    >
      <div className="mb-4">
        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Report Definition</label>
        <select
          value={selectedDef}
          onChange={e => setSelectedDef(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[var(--pro-azure)] bg-white"
        >
          <option value="">— Select a report —</option>
          {definitions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {selectedDef && (
        <>
          <AppKpi cells={[
            { label: 'Report', value: selectedDefName, color: 'violet' as const },
            { label: 'Total Lines', value: lines.length, color: 'sky' as const },
            { label: 'Total Amount', value: `ETB ${lines.reduce((s, l) => s + Number(l.amount), 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`, color: 'green' as const },
          ]} />

          <div className="flex items-center gap-2 mb-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search lines…" className="w-52" />
            <div className="flex-1" />
            <span className="text-[11px] text-slate-400">{lines.length} lines</span>
          </div>

          <AppTable>
            <thead><tr>
              <AppTh>Order</AppTh>
              <AppTh>Account</AppTh>
              <AppTh>Description</AppTh>
              <AppTh align="right">Amount</AppTh>
              <AppTh>Type</AppTh>
              <AppTh align="right">Actions</AppTh>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
              ) : lines.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={<List size={18} />} title="No report lines" desc="Add lines to the selected report definition" action={{ label: 'Add Line', onClick: () => setModal({ open: true, data: { reportDefinitionId: selectedDef, isHeader: false } }) }} /></td></tr>
              ) : lines.map(l => (
                <AppTr key={l.id}>
                  <AppTd><span className="text-[11px] font-mono text-slate-500">{l.lineOrder}</span></AppTd>
                  <AppTd><span className="text-[11px] font-mono text-slate-600">{l.accountCode}</span></AppTd>
                  <AppTd><span className={`text-[12px] ${l.isHeader ? 'font-bold text-slate-800' : 'text-slate-700'}`}>{l.description}</span></AppTd>
                  <AppTd align="right"><span className="text-[12px] font-bold tabular-nums text-slate-700">{Number(l.amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })}</span></AppTd>
                  <AppTd><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${l.isHeader ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-white text-slate-500 border-slate-200'}`}>{l.isHeader ? 'Header' : 'Line'}</span></AppTd>
                  <AppTd align="right">
                    <div className="flex items-center justify-end gap-1">
                      <Btn size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setModal({ open: true, data: { ...l } })}><Edit2 size={11} /></Btn>
                      <Btn size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(l)}><Trash2 size={11} /></Btn>
                    </div>
                  </AppTd>
                </AppTr>
              ))}
            </tbody>
          </AppTable>
        </>
      )}

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit Report Line' : 'New Report Line'} subtitle="Add line to report definition"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create'}</Btn></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Account Code" required>
              <Input value={modal.data.accountCode ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, accountCode: e.target.value } }))} placeholder="1000" />
            </FormField>
            <FormField label="Line Order" required>
              <Input type="number" value={modal.data.lineOrder ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, lineOrder: parseInt(e.target.value) || 0 } }))} placeholder="1" />
            </FormField>
          </div>
          <FormField label="Description" required>
            <Input value={modal.data.description ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, description: e.target.value } }))} placeholder="Cash and Cash Equivalents" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount" required>
              <Input type="number" value={modal.data.amount ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, amount: parseFloat(e.target.value) || 0 } }))} placeholder="0.00" />
            </FormField>
            <FormField label="Type">
              <Select value={modal.data.isHeader ? 'header' : 'line'} onChange={e => setModal(m => ({ ...m, data: { ...m.data, isHeader: e === 'header' } }))}>
                <option value="line">Line Item</option>
                <option value="header">Header</option>
              </Select>
            </FormField>
          </div>
        </div>
      </Modal>
    </AppPage>
  );
};

export default ReportLines;

