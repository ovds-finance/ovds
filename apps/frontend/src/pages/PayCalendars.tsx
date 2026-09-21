/**
 * PayCalendars — ovds-style pay calendar management
 * Configure payout frequencies (weekly, bi-weekly, monthly, quarterly)
 */
import { payCalendarsApi } from '@ovds/features/hr';
import {
  Calendar, Plus, Edit2, Trash2, RefreshCw, Clock, CheckCircle2,
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

interface PayCalendar {
  id: string;
  name: string;
  frequency: string;
  startDate: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  isActive: boolean;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'INACTIVE';

const FREQUENCIES = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BI_WEEKLY', label: 'Bi-Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
] as const;

const FREQUENCY_COLORS: Record<string, string> = {
  WEEKLY:    'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  BI_WEEKLY: 'bg-sky-50 text-sky-700 border-sky-100',
  MONTHLY:   'bg-violet-50 text-violet-700 border-violet-100',
  QUARTERLY: 'bg-amber-50 text-amber-700 border-amber-100',
};

const CalendarForm: React.FC<{
  data: Partial<PayCalendar>;
  onChange: (d: Partial<PayCalendar>) => void;
}> = ({ data, onChange }) => {
  const set = (k: keyof PayCalendar, v: any) => onChange({ ...data, [k]: v });
  const freq = data.frequency ?? 'MONTHLY';

  return (
    <div className="space-y-3">
      <FormField label="Calendar Name" required>
        <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Monthly Salary Cycle" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Frequency" required>
          <Select value={freq} onChange={e => set('frequency', e)}>
            {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </Select>
        </FormField>
        <FormField label="Start Date" required>
          <Input type="date" value={data.startDate?.slice(0, 10) ?? ''} onChange={e => set('startDate', e.target.value)} />
        </FormField>
      </div>
      {freq === 'MONTHLY' && (
        <FormField label="Day of Month" hint="Which day of the month to run payroll">
          <Input type="number" min="1" max="31" value={data.dayOfMonth ?? ''} onChange={e => set('dayOfMonth', parseInt(e.target.value) || undefined)} placeholder="28" />
        </FormField>
      )}
      {(freq === 'WEEKLY' || freq === 'BI_WEEKLY') && (
        <FormField label="Day of Week" hint="Which day of the week to run payroll">
          <Select value={String(data.dayOfWeek ?? '0')} onChange={e => set('dayOfWeek', parseInt(e))}>            <option value="0">Sunday</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
          </Select>
        </FormField>
      )}
    </div>
  );
};

const PayCalendars: React.FC = () => {
  usePageTitle('Pay Calendars');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<PayCalendar> }>({ open: false, data: {} });
  const [rows, setRows] = useState<PayCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 25;

  const fetchCalendars = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const res = await payCalendarsApi.list({ companyId: selectedCompanyId, page, take: PAGE_SIZE, search: search.trim() || undefined });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load pay calendars');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, page, search]);

  useEffect(() => { fetchCalendars(); }, [fetchCalendars]);

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'ACTIVE') list = list.filter(c => c.isActive);
    if (tab === 'INACTIVE') list = list.filter(c => !c.isActive);
    return list;
  }, [rows, tab]);

  const kpiCells = useMemo(() => {
    const active = rows.filter(c => c.isActive).length;
    const monthly = rows.filter(c => c.frequency === 'MONTHLY').length;
    return [
      { label: 'Total', value: rows.length, color: 'green' as const },
      { label: 'Active', value: active, color: 'sky' as const },
      { label: 'Monthly', value: monthly, color: 'violet' as const },
      { label: 'Inactive', value: rows.length - active, color: 'amber' as const },
    ];
  }, [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim() || !modal.data.startDate) {
      toast.error('Name and start date are required');
      return;
    }
    setSaving(true);
    try {
      if (modal.data.id) {
        await payCalendarsApi.update(modal.data.id, modal.data as any);
        toast.success('Pay calendar updated');
      } else {
        await payCalendarsApi.create({ ...modal.data, companyId: selectedCompanyId! } as any);
        toast.success('Pay calendar created');
      }
      setModal(m => ({ ...m, open: false }));
      fetchCalendars();
    } catch (err: any) {
      toast.error(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [modal.data, selectedCompanyId, fetchCalendars]);

  const handleDelete = useCallback(async (id: string) => {
    if (!await confirm({ title: 'Delete Pay Calendar', message: 'This will permanently remove this pay calendar configuration.', variant: 'danger' })) return;
    try {
      await payCalendarsApi.remove(id);
      toast.success('Deleted');
      fetchCalendars();
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed');
    }
  }, [fetchCalendars]);

  const openCreate = () => setModal({ open: true, data: { frequency: 'MONTHLY', isActive: true, dayOfMonth: 28 } });

  return (
    <AppPage
      title="Pay Calendars"
      subtitle="Configure payout frequencies and cycles · Ethiopian payroll · PIT · Pension · DRRF"
      icon={<Calendar size={18} />}
      crumbs={[{ label: 'Pay Calendars' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL', label: 'All', count: rows.length },
            { key: 'ACTIVE', label: 'Active', count: rows.filter(c => c.isActive).length },
            { key: 'INACTIVE', label: 'Inactive', count: rows.filter(c => !c.isActive).length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={fetchCalendars}>Refresh</Btn>
          {can('pay_calendars:create') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={openCreate}>New Calendar</Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search calendars…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} calendars</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Name</AppTh>
          <AppTh>Frequency</AppTh>
          <AppTh>Start Date</AppTh>
          <AppTh>Schedule</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={6}><EmptyState icon={<Calendar size={18} />} title="No pay calendars" desc="Create a pay calendar to define your payout cycles" action={can('pay_calendars:create') ? { label: 'New Calendar', onClick: openCreate } : undefined} /></td></tr>
          ) : filtered.map(c => (
            <AppTr key={c.id}>
              <AppTd>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-[12px] font-semibold text-slate-800">{c.name}</span>
                </div>
              </AppTd>
              <AppTd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${FREQUENCY_COLORS[c.frequency] ?? 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                  {c.frequency.replace(/_/g, ' ')}
                </span>
              </AppTd>
              <AppTd><span className="text-[11px] text-slate-600">{c.startDate?.slice(0, 10) ?? '—'}</span></AppTd>
              <AppTd>
                <span className="text-[10px] text-slate-500">
                  {c.frequency === 'MONTHLY' && `Day ${c.dayOfMonth ?? '—'}`}
                  {c.frequency === 'WEEKLY' && `Day ${c.dayOfWeek ?? '—'} of week`}
                  {c.frequency === 'BI_WEEKLY' && `Day ${c.dayOfWeek ?? '—'} of week`}
                  {c.frequency === 'QUARTERLY' && `Day ${c.dayOfMonth ?? '—'} of quarter`}
                </span>
              </AppTd>
              <AppTd><StatusBadge status={c.isActive ? 'ACTIVE' : 'INACTIVE'} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {can('pay_calendars:edit') && (
                    <>
                      <button onClick={() => setModal({ open: true, data: { ...c } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all"><Edit2 size={11} /></button>
                      <button onClick={() => handleDelete(c.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={11} /></button>
                    </>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit Pay Calendar' : 'New Pay Calendar'} subtitle="Define payout frequency and schedule"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create Calendar'}</Btn></>}>
        <CalendarForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default PayCalendars;

