/**
 * HRAssets — ovds-style HR asset allocation management
 * Track equipment distributed to employees (laptops, vehicles, keys, etc.)
 * with deployment logging and signable receipt workflow.
 */
import { hrAssetsApi, employeesApi } from '@ovds/features/hr';
import {
  Package, Plus, Edit2, Trash2, RefreshCw, User, Laptop,
  Car, Key, Smartphone, Monitor, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select,
  SearchBar, EmptyState, Pagination,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { confirm } from '../utils/confirm';

interface HrAsset {
  id: string;
  employeeId: string;
  employeeName?: string;
  assetName: string;
  assetType: string;
  serialNumber?: string;
  assignedDate: string;
  returnDate?: string;
  conditionNotes?: string;
  status: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

type FilterTab = 'ALL' | 'ASSIGNED' | 'RETURNED' | 'DAMAGED' | 'LOST';

const ASSET_TYPES = [
  { value: 'LAPTOP', label: 'Laptop', icon: <Laptop size={14} /> },
  { value: 'DESKTOP', label: 'Desktop', icon: <Monitor size={14} /> },
  { value: 'MOBILE', label: 'Mobile', icon: <Smartphone size={14} /> },
  { value: 'VEHICLE', label: 'Vehicle', icon: <Car size={14} /> },
  { value: 'KEY', label: 'Key', icon: <Key size={14} /> },
  { value: 'ACCESS_CARD', label: 'Access Card', icon: <Key size={14} /> },
  { value: 'OTHER', label: 'Other', icon: <Package size={14} /> },
] as const;

const ASSET_TYPE_COLORS: Record<string, string> = {
  LAPTOP: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  DESKTOP: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  MOBILE: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  VEHICLE: 'bg-amber-50 text-amber-700 border-amber-100',
  KEY: 'bg-slate-50 text-slate-700 border-slate-100',
  ACCESS_CARD: 'bg-violet-50 text-violet-700 border-violet-100',
  OTHER: 'bg-white text-slate-600 border-slate-200',
};

const AssetForm: React.FC<{
  data: Partial<HrAsset>;
  onChange: (d: Partial<HrAsset>) => void;
  employees: any[];
}> = ({ data, onChange, employees }) => {
  const set = (k: keyof HrAsset, v: any) => onChange({ ...data, [k]: v });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Employee" required>
          <Select value={data.employeeId ?? ''} onChange={e => set('employeeId', e)}>
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Asset Type" required>
          <Select value={data.assetType ?? 'LAPTOP'} onChange={e => set('assetType', e)}>
            {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Asset Name" required>
          <Input value={data.assetName ?? ''} onChange={e => set('assetName', e.target.value)} placeholder="e.g. MacBook Pro 16" />
        </FormField>
        <FormField label="Serial Number">
          <Input value={data.serialNumber ?? ''} onChange={e => set('serialNumber', e.target.value)} placeholder="SN-XXXX-XXXX" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Assigned Date" required>
          <Input type="date" value={data.assignedDate?.slice(0, 10) ?? ''} onChange={e => set('assignedDate', e.target.value)} />
        </FormField>
        <FormField label="Condition Notes">
          <Input value={data.conditionNotes ?? ''} onChange={e => set('conditionNotes', e.target.value)} placeholder="e.g. Like new, minor scratches" />
        </FormField>
      </div>
    </div>
  );
};

const HrAssets: React.FC = () => {
  usePageTitle('HR Assets');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<HrAsset> }>({ open: false, data: {} });
  const [employees, setEmployees] = useState<any[]>([]);
  const [rows, setRows] = useState<HrAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 25;

  const fetchAssets = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const res = await hrAssetsApi.list({ companyId: selectedCompanyId, page, take: PAGE_SIZE, search: search.trim() || undefined, status: tab === 'ALL' ? undefined : tab });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load HR assets');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, page, search, tab]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  useEffect(() => {
    if (selectedCompanyId) {
      employeesApi.list({ companyId: selectedCompanyId, limit: 100 }).then((res: any) => {
        setEmployees(res.data ?? res ?? []);
      }).catch(() => {});
    }
  }, [selectedCompanyId]);

  const kpiCells = useMemo(() => {
    const assigned = rows.filter(a => a.status === 'ASSIGNED').length;
    const totalVal = rows.length;
    return [
      { label: 'Total Allocations', value: totalVal, color: 'green' as const },
      { label: 'Assigned', value: assigned, color: 'sky' as const },
      { label: 'Returned', value: rows.filter(a => a.status === 'RETURNED').length, color: 'violet' as const },
      { label: 'Issues', value: rows.filter(a => a.status === 'DAMAGED' || a.status === 'LOST').length, color: 'rose' as const },
    ];
  }, [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.employeeId || !modal.data.assetName || !modal.data.assetType || !modal.data.assignedDate) {
      toast.error('Employee, asset name, type, and date are required');
      return;
    }
    setSaving(true);
    try {
      if (modal.data.id) {
        await hrAssetsApi.update(modal.data.id, modal.data as any);
        toast.success('Asset allocation updated');
      } else {
        await hrAssetsApi.create({ ...modal.data, companyId: selectedCompanyId! } as any);
        toast.success('Asset allocated');
      }
      setModal(m => ({ ...m, open: false }));
      fetchAssets();
    } catch (err: any) {
      toast.error(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [modal.data, selectedCompanyId, fetchAssets]);

  const handleDelete = useCallback(async (id: string) => {
    if (!await confirm({ title: 'Delete Allocation', message: 'This will permanently remove this asset allocation record.', variant: 'danger' })) return;
    try {
      await hrAssetsApi.remove(id);
      toast.success('Deleted');
      fetchAssets();
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed');
    }
  }, [fetchAssets]);

  const openCreate = () => setModal({ open: true, data: { assetType: 'LAPTOP', status: 'ASSIGNED' } });

  return (
    <AppPage
      title="HR Assets"
      subtitle="Equipment distribution · Deployment logging · Signable receipts"
      icon={<Package size={18} />}
      crumbs={[{ label: 'HR Assets' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL', label: 'All', count: rows.length },
            { key: 'ASSIGNED', label: 'Assigned', count: rows.filter(a => a.status === 'ASSIGNED').length },
            { key: 'RETURNED', label: 'Returned', count: rows.filter(a => a.status === 'RETURNED').length },
            { key: 'DAMAGED', label: 'Damaged', count: rows.filter(a => a.status === 'DAMAGED').length },
            { key: 'LOST', label: 'Lost', count: rows.filter(a => a.status === 'LOST').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={fetchAssets}>Refresh</Btn>
          {can('hr_assets:allocate') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={openCreate}>Allocate Asset</Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search assets or employees…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{rows.length} allocations</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Asset</AppTh>
          <AppTh>Employee</AppTh>
          <AppTh>Serial No.</AppTh>
          <AppTh>Assigned</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={6}><EmptyState icon={<Package size={18} />} title="No asset allocations" desc="Allocate your first asset to an employee" action={can('hr_assets:allocate') ? { label: 'Allocate Asset', onClick: openCreate } : undefined} /></td></tr>
          ) : rows.map(a => (
            <AppTr key={a.id}>
              <AppTd>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${ASSET_TYPE_COLORS[a.assetType] ?? ASSET_TYPE_COLORS.OTHER}`}>
                    {ASSET_TYPES.find(t => t.value === a.assetType)?.icon ?? <Package size={14} />}
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800">{a.assetName}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${ASSET_TYPE_COLORS[a.assetType] ?? ASSET_TYPE_COLORS.OTHER}`}>{a.assetType.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </AppTd>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-slate-400" />
                  <span className="text-[11px] text-slate-600">{a.employeeName ?? '—'}</span>
                </div>
              </AppTd>
              <AppTd><span className="text-[10px] font-mono text-slate-500">{a.serialNumber ?? '—'}</span></AppTd>
              <AppTd><span className="text-[11px] text-slate-600">{a.assignedDate?.slice(0, 10) ?? '—'}</span></AppTd>
              <AppTd><StatusBadge status={a.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {can('hr_assets:return') && a.status === 'ASSIGNED' && (
                    <button onClick={() => setModal({ open: true, data: { ...a, status: 'RETURNED', returnDate: new Date().toISOString().slice(0, 10) } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all" title="Return"><CheckCircle2 size={11} /></button>
                  )}
                  {can('hr_assets:edit') && (
                    <button onClick={() => setModal({ open: true, data: { ...a } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all" title="Edit"><Edit2 size={11} /></button>
                  )}
                  {can('hr_assets:edit') && (
                    <button onClick={() => handleDelete(a.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id && modal.data.status === 'RETURNED' ? 'Return Asset' : modal.data.id ? 'Edit Allocation' : 'Allocate Asset'} subtitle={modal.data.status === 'RETURNED' ? 'Mark asset as returned' : 'Assign equipment to employee'}
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Allocate'}</Btn></>}>
        <AssetForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} employees={employees} />
      </Modal>
    </AppPage>
  );
};

export default HrAssets;

