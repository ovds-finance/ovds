/**
 * Leaves — ovds-style leave management
 * AppPage · AppKpi · AppTable · useApiCrud
 * Ethiopian labour law compliance
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  CalendarDays, Plus, Edit2, Trash2, RefreshCw, Download,
  CheckCircle2, XCircle, WifiOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { confirm } from '../utils/confirm';
import api from '../services/api';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, EmptyState, Pagination,
} from '../components/ui';

interface Leave {
  id: string;
  employeeId: string;
  employeeName?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days?: number;
  reason?: string;
  status: string;
  approvedBy?: string;
  companyId?: string;
  createdAt: string;
}

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const LEAVE_TYPES = ['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID', 'OTHER'];

const LeaveForm: React.FC<{ data: Partial<Leave>; onChange: (d: Partial<Leave>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof Leave, v: any) => onChange({ ...data, [k]: v });
  const days = data.startDate && data.endDate
    ? Math.max(1, Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000) + 1)
    : 0;
  return (
    <div className="space-y-3">
      <FormField label="Leave Type" required>
        <Select value={data.leaveType ?? 'ANNUAL'} onChange={e => set('leaveType', e)}>
          {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </Select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start Date" required>
          <Input type="date" value={data.startDate?.slice(0, 10) ?? ''} onChange={e => set('startDate', e.target.value)} />
        </FormField>
        <FormField label="End Date" required>
          <Input type="date" value={data.endDate?.slice(0, 10) ?? ''} onChange={e => set('endDate', e.target.value)} />
        </FormField>
      </div>
      {days > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 text-[11px] font-semibold text-emerald-700">
          <CalendarDays size={12} /> {days} working day{days !== 1 ? 's' : ''}
        </div>
      )}
      <FormField label="Reason">
        <Textarea value={data.reason ?? ''} onChange={e => set('reason', e.target.value)} rows={2} placeholder="Reason for leave…" />
      </FormField>
    </div>
  );
};

const Leaves: React.FC = () => {
  usePageTitle('Leaves');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Leave> }>({ open: false, data: {} });

  const { rows: rawRows, total, page, loading, saving, save: rawSave, remove, refetch, setPage } = useApiCrud<any>({
    endpoint: '/hr/leaves',
    companyId: selectedCompanyId,
    pageSize: 25,
    pollMs: 60_000,
  });

  const { submitOfflineSafe, queueCount } = useOfflineQueue();

  // Map backend shape (type, employee.firstName/lastName) → frontend Leave shape
  const rows: Leave[] = rawRows.map((r: any) => ({
    ...r,
    leaveType: r.leaveType ?? r.type ?? 'OTHER',
    employeeName: r.employeeName
      ?? (r.employee ? `${r.employee.firstName ?? ''} ${r.employee.lastName ?? ''}`.trim() : undefined)
      ?? r.employeeId,
  }));

  // Map frontend Leave shape → backend ApplyLeaveDto / UpdateLeaveDto
  const save = async (payload: Partial<Leave> & { id?: string }) => {
    // Strip fields the backend DTOs don't accept
    const { leaveType, companyId: _cid, employeeId: _eid, employeeName: _en, days: _d, ...rest } = payload as any;
    // Convert plain date strings (YYYY-MM-DD) to full ISO 8601 so backend @IsDateString() passes
    if (rest.startDate && !rest.startDate.includes('T')) {
      rest.startDate = new Date(rest.startDate).toISOString();
    }
    if (rest.endDate && !rest.endDate.includes('T')) {
      rest.endDate = new Date(rest.endDate).toISOString();
    }
    return rawSave({ ...rest, type: leaveType });
  };

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(l => l.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => [l.employeeName, l.leaveType, l.reason].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',    value: rows.length,                                                    color: 'emerald' as const },
    { label: 'Pending',  value: rows.filter(l => l.status === 'PENDING').length,               color: 'amber' as const },
    { label: 'Approved', value: rows.filter(l => l.status === 'APPROVED').length,              color: 'sky' as const },
    { label: 'Days Out', value: rows.filter(l => l.status === 'APPROVED').reduce((s, l) => s + (l.days ?? 1), 0), color: 'violet' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.leaveType || !modal.data.startDate || !modal.data.endDate) {
      toast.error('Leave type and dates are required'); return;
    }

    // New request — offline-safe
    if (!modal.data.id) {
      const payload = {
        type: modal.data.leaveType,
        startDate: modal.data.startDate?.includes('T')
          ? modal.data.startDate
          : new Date(modal.data.startDate!).toISOString(),
        endDate: modal.data.endDate?.includes('T')
          ? modal.data.endDate
          : new Date(modal.data.endDate!).toISOString(),
        reason: modal.data.reason,
        status: 'PENDING',
      };
      const label = `${modal.data.leaveType?.replace(/_/g, ' ')} leave — ${modal.data.startDate?.slice(0, 10)} to ${modal.data.endDate?.slice(0, 10)}`;
      try {
        const ok = await submitOfflineSafe('LEAVE_REQUEST', payload, label, selectedCompanyId ?? undefined);
        if (ok) {
          setModal(m => ({ ...m, open: false }));
          if (navigator.onLine) refetch();
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to submit leave request');
      }
      return;
    }

    // Edit existing — direct save
    const result = await save(modal.data as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save, submitOfflineSafe, selectedCompanyId, refetch]);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/hr/leaves/${id}/approve`, {});
      toast.success('Leave approved'); refetch();
    } catch { toast.error('Failed'); }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/hr/leaves/${id}/reject`, {});
      toast.success('Leave rejected'); refetch();
    } catch { toast.error('Failed'); }
  };

  const handleExport = () => {
    const headers = 'Employee,Type,Start,End,Days,Status\n';
    const csvRows = filtered.map(l =>
      `"${l.employeeName ?? l.employeeId}","${l.leaveType}","${l.startDate}","${l.endDate}",${l.days ?? 1},"${l.status}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `leaves-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const LEAVE_TYPE_CLS: Record<string, string> = {
    ANNUAL:    'bg-emerald-50 text-emerald-700 border-emerald-100',
    SICK:      'bg-rose-50 text-rose-700 border-rose-100',
    MATERNITY: 'bg-pink-50 text-pink-700 border-pink-100',
    PATERNITY: 'bg-sky-50 text-sky-700 border-sky-100',
    EMERGENCY: 'bg-amber-50 text-amber-700 border-amber-100',
    UNPAID:    'bg-white text-slate-600 border-slate-200',
    OTHER:     'bg-white text-slate-600 border-slate-200',
  };

  return (
    <AppPage
      title="Leave Management"
      subtitle="Employee leave requests · Ethiopian labour law"
      icon={<CalendarDays size={18} />}
      crumbs={[{ label: 'Leaves' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',      label: 'All',      count: rows.length },
            { key: 'PENDING',  label: 'Pending',  count: rows.filter(l => l.status === 'PENDING').length },
            { key: 'APPROVED', label: 'Approved', count: rows.filter(l => l.status === 'APPROVED').length },
            { key: 'REJECTED', label: 'Rejected', count: rows.filter(l => l.status === 'REJECTED').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { leaveType: 'ANNUAL', status: 'PENDING' } })}>
            Request Leave
          </Btn>
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search leaves…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} requests</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Employee</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Start</AppTh>
          <AppTh>End</AppTh>
          <AppTh align="right">Days</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="100px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={7}><EmptyState icon={<CalendarDays size={18} />} title="No leave requests" desc="Submit a leave request to get started" action={{ label: 'Request Leave', onClick: () => setModal({ open: true, data: { leaveType: 'ANNUAL', status: 'PENDING' } }) }} /></td></tr>
          ) : filtered.map(l => (
            <AppTr key={l.id}>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                    {String(l.employeeName ?? l.employeeId ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[12px] font-semibold text-slate-800">{l.employeeName ?? l.employeeId}</span>
                </div>
              </AppTd>
              <AppTd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${LEAVE_TYPE_CLS[l.leaveType] ?? LEAVE_TYPE_CLS.OTHER}`}>
                  {l.leaveType.replace(/_/g, ' ')}
                </span>
              </AppTd>
              <AppTd><span className="text-[11px] text-slate-600 font-mono">{new Date(l.startDate).toLocaleDateString()}</span></AppTd>
              <AppTd><span className="text-[11px] text-slate-600 font-mono">{new Date(l.endDate).toLocaleDateString()}</span></AppTd>
              <AppTd align="right"><span className="text-[11px] font-bold text-slate-700">{l.days ?? 1}d</span></AppTd>
              <AppTd><StatusBadge status={l.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {l.status === 'PENDING' && can('leaves:approve') && (
                    <>
                      <button onClick={() => handleApprove(l.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Approve"><CheckCircle2 size={11} /></button>
                      <button onClick={() => handleReject(l.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Reject"><XCircle size={11} /></button>
                    </>
                  )}
                  <button onClick={() => setModal({ open: true, data: { ...l } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all" title="Edit"><Edit2 size={11} /></button>
                  <button onClick={async () => { if (await confirm({ title: 'Delete leave request?', variant: 'danger' })) remove(l.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit Leave Request' : 'Request Leave'} subtitle="Ethiopian Labour Proclamation No. 1156/2019"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Submit Request'}</Btn></>}>
        <LeaveForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default Leaves;


