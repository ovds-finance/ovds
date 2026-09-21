/**
 * Departments — ovds-style department management
 * AppPage · AppKpi · AppTable · useApiCrud
 */
import {
  Building2, Plus, Edit2, Trash2, Download, RefreshCw, Users,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, EmptyState, Pagination,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { confirm } from '../utils/confirm';

interface Department {
  id: string;
  name: string;
  code?: string;
  managerId?: string;
  parentId?: string;
  description?: string;
  isActive?: boolean;
  employeeCount?: number;
  companyId?: string;
  createdAt: string;
}

const DeptForm: React.FC<{
  data: Partial<Department>;
  onChange: (d: Partial<Department>) => void;
  departments: Department[];
}> = ({ data, onChange, departments }) => {
  const set = (k: keyof Department, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Department Name" required>
          <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. ovds" />
        </FormField>
        <FormField label="Code">
          <Input value={data.code ?? ''} onChange={e => set('code', e.target.value)} placeholder="FIN" maxLength={10} />
        </FormField>
      </div>
      <FormField label="Parent Department">
        <Select value={data.parentId ?? ''} onChange={e => set('parentId', e || undefined)}>
          <option value="">None (top-level)</option>
          {departments.filter(d => d.id !== data.id).map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="Department purpose…" />
      </FormField>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="deptActive" checked={data.isActive !== false} onChange={e => set('isActive', e.target.checked)} className="accent-indigo-600" />
        <label htmlFor="deptActive" className="text-[12px] font-semibold text-slate-700 cursor-pointer">Active</label>
      </div>
    </div>
  );
};

const Departments: React.FC = () => {
  usePageTitle('Departments');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Department> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Department>({
    endpoint: '/hr/departments',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(d => [d.name, d.code, d.description].some(v => String(v ?? '').toLowerCase().includes(q)));
  }, [rows, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',    value: rows.length,                                                    color: 'green' as const },
    { label: 'Active',   value: rows.filter(d => d.isActive !== false).length,                  color: 'sky' as const },
    { label: 'Employees',value: rows.reduce((s, d) => s + (d.employeeCount ?? 0), 0),           color: 'violet' as const },
    { label: 'Top-Level',value: rows.filter(d => !d.parentId).length,                           color: 'amber' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim()) { toast.error('Department name is required'); return; }
    const result = await save({ ...modal.data } as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleExport = () => {
    const headers = 'Name,Code,Description,Active,Employees\n';
    const csvRows = filtered.map(d =>
      `"${d.name}","${d.code ?? ''}","${d.description ?? ''}","${d.isActive !== false}",${d.employeeCount ?? 0}`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `departments-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="Departments"
      subtitle={`${rows.length} departments · Organisational structure · ERP · Manufacturing & Logistics · Healthcare & Pharmaceuticals · IT & Software · Market Segments`}
      icon={<Building2 size={18} />}
      crumbs={[{ label: 'Departments' }]}
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {can('departments:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { isActive: true } })}>
              New Department
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search departments…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} departments</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Department</AppTh>
          <AppTh>Code</AppTh>
          <AppTh>Parent</AppTh>
          <AppTh align="right">Employees</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={6}><EmptyState icon={<Building2 size={18} />} title="No departments" desc="Create your organisational structure" action={can('departments:write') ? { label: 'New Department', onClick: () => setModal({ open: true, data: { isActive: true } }) } : undefined} /></td></tr>
          ) : filtered.map(d => {
            const parent = rows.find(r => r.id === d.parentId);
            return (
              <AppTr key={d.id}>
                <AppTd>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[var(--pro-azure-50)] flex items-center justify-center shrink-0">
                      <Building2 size={12} className="text-[var(--pro-azure)]" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800">{d.name}</p>
                      {d.description && <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{d.description}</p>}
                    </div>
                  </div>
                </AppTd>
                <AppTd>
                  {d.code
                    ? <span className="font-mono text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-100">{d.code}</span>
                    : <span className="text-[10px] text-slate-300">—</span>
                  }
                </AppTd>
                <AppTd>
                  {parent
                    ? <span className="text-[11px] text-slate-500">{parent.name}</span>
                    : <span className="text-[10px] text-slate-300">Top-level</span>
                  }
                </AppTd>
                <AppTd align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Users size={10} className="text-slate-300" />
                    <span className="text-[11px] font-semibold text-slate-600">{d.employeeCount ?? 0}</span>
                  </div>
                </AppTd>
                <AppTd><StatusBadge status={d.isActive !== false ? 'ACTIVE' : 'INACTIVE'} /></AppTd>
                <AppTd align="right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {can('departments:write') && (
                      <>
                        <button onClick={() => setModal({ open: true, data: { ...d } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all"><Edit2 size={11} /></button>
                        <button onClick={async () => { if (await confirm({ title: `Delete "${d.name}"?`, variant: 'danger' })) remove(d.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={11} /></button>
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
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? `Edit: ${modal.data.name}` : 'New Department'} subtitle="Organisational structure"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create'}</Btn></>}>
        <DeptForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} departments={rows} />
      </Modal>
    </AppPage>
  );
};

export default Departments;


