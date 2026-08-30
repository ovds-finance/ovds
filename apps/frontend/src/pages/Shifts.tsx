/**
 * Shifts — ovds-style shift management
 * AppPage · AppKpi · AppTable · useApiCrud
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Timer, Plus, Edit2, Trash2, RefreshCw, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { confirm } from '../utils/confirm';
import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select,
  SearchBar, EmptyState, Pagination,
} from '../components/ui';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type?: string;
  isActive?: boolean;
  companyId?: string;
  description?: string;
}

const ShiftForm: React.FC<{ data: Partial<Shift>; onChange: (d: Partial<Shift>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof Shift, v: any) => onChange({ ...data, [k]: v });
  const duration = data.startTime && data.endTime ? (() => {
    const [sh, sm] = data.startTime.split(':').map(Number);
    const [eh, em] = data.endTime.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : null;
  })() : null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Shift Name" required>
          <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Morning Shift" />
        </FormField>
        <FormField label="Type">
          <Select value={data.type ?? 'REGULAR'} onChange={e => set('type', e)}>
            <option value="REGULAR">Regular</option>
            <option value="MORNING">Morning</option>
            <option value="AFTERNOON">Afternoon</option>
            <option value="NIGHT">Night</option>
            <option value="SPLIT">Split</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start Time" required>
          <Input type="time" value={data.startTime ?? ''} onChange={e => set('startTime', e.target.value)} />
        </FormField>
        <FormField label="End Time" required>
          <Input type="time" value={data.endTime ?? ''} onChange={e => set('endTime', e.target.value)} />
        </FormField>
      </div>
      {duration && (
        <div className="flex items-center gap-2 p-2.5 bg-sky-50 rounded-lg border border-sky-100 text-[11px] font-semibold text-sky-700">
          <Clock size={12} /> Duration: {duration}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input type="checkbox" id="shiftActive" checked={data.isActive !== false} onChange={e => set('isActive', e.target.checked)} className="accent-emerald-600" />
        <label htmlFor="shiftActive" className="text-[12px] font-semibold text-slate-700 cursor-pointer">Active shift</label>
      </div>
    </div>
  );
};

const Shifts: React.FC = () => {
  usePageTitle('Shifts');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Shift> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Shift>({
    endpoint: '/hr/shifts',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(s => [s.name, s.type].some(v => String(v ?? '').toLowerCase().includes(q)));
  }, [rows, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',   value: rows.length,                                          color: 'emerald' as const },
    { label: 'Active',  value: rows.filter(s => s.isActive !== false).length,        color: 'sky' as const },
    { label: 'Morning', value: rows.filter(s => s.type === 'MORNING').length,        color: 'amber' as const },
    { label: 'Night',   value: rows.filter(s => s.type === 'NIGHT').length,          color: 'violet' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim() || !modal.data.startTime || !modal.data.endTime) {
      toast.error('Name and times are required'); return;
    }
    const result = await save({ ...modal.data } as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  return (
    <AppPage
      title="Shifts"
      subtitle="Work shift schedules · Manufacturing & Logistics · Healthcare & Pharmaceuticals · Retail & E-commerce · ERP · Workforce Management"
      icon={<Timer size={18} />}
      crumbs={[{ label: 'Shifts' }]}
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          {can('shifts:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { type: 'REGULAR', isActive: true } })}>
              New Shift
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search shifts…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} shifts</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Shift</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Start</AppTh>
          <AppTh>End</AppTh>
          <AppTh>Duration</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={7}><EmptyState icon={<Timer size={18} />} title="No shifts" desc="Create work shift schedules" action={can('shifts:write') ? { label: 'New Shift', onClick: () => setModal({ open: true, data: { type: 'REGULAR', isActive: true } }) } : undefined} /></td></tr>
          ) : filtered.map(s => {
            const duration = (() => {
              try {
                const [sh, sm] = s.startTime.split(':').map(Number);
                const [eh, em] = s.endTime.split(':').map(Number);
                const mins = (eh * 60 + em) - (sh * 60 + sm);
                return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}` : '—';
              } catch { return '—'; }
            })();
            return (
              <AppTr key={s.id}>
                <AppTd>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0"><Timer size={12} className="text-sky-600" /></div>
                    <span className="text-[12px] font-semibold text-slate-800">{s.name}</span>
                  </div>
                </AppTd>
                <AppTd><span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">{s.type ?? 'REGULAR'}</span></AppTd>
                <AppTd><span className="font-mono text-[11px] text-slate-600">{s.startTime}</span></AppTd>
                <AppTd><span className="font-mono text-[11px] text-slate-600">{s.endTime}</span></AppTd>
                <AppTd><span className="text-[11px] font-semibold text-sky-600">{duration}</span></AppTd>
                <AppTd><StatusBadge status={s.isActive !== false ? 'ACTIVE' : 'INACTIVE'} /></AppTd>
                <AppTd align="right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {can('shifts:write') && (
                      <>
                        <button onClick={() => setModal({ open: true, data: { ...s } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Edit2 size={11} /></button>
                        <button onClick={async () => { if (await confirm({ title: `Delete "${s.name}"?`, variant: 'danger' })) remove(s.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={11} /></button>
                      </>
                    )}
                  </div>
                </AppTd>
              </AppTr>
            );
          })}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit Shift' : 'New Shift'} subtitle="Work schedule configuration · Manufacturing & Logistics · Healthcare & Pharmaceuticals"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create Shift'}</Btn></>}>
        <ShiftForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default Shifts;

