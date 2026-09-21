/**
 * Holidays — ovds-style holiday calendar
 * AppPage · AppKpi · AppTable · useApiCrud
 * Ethiopian public holidays + custom company holidays
 */
import { Star, Plus, Edit2, Trash2, RefreshCw, Calendar } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select,
  SearchBar, EmptyState, Pagination,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { confirm } from '../utils/confirm';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  isRecurring?: boolean;
  description?: string;
  companyId?: string;
}

type FilterTab = 'ALL' | 'PUBLIC' | 'RELIGIOUS' | 'COMPANY';

// Ethiopian public holidays
const ETH_HOLIDAYS = [
  { name: 'Ethiopian Christmas (Genna)',    date: '2026-01-07', type: 'RELIGIOUS' },
  { name: 'Ethiopian Epiphany (Timkat)',    date: '2026-01-19', type: 'RELIGIOUS' },
  { name: 'Victory of Adwa',               date: '2026-03-02', type: 'PUBLIC' },
  { name: 'Good Friday (Siklet)',           date: '2026-04-10', type: 'RELIGIOUS' },
  { name: 'Easter (Fasika)',               date: '2026-04-12', type: 'RELIGIOUS' },
  { name: 'International Labour Day',      date: '2026-05-01', type: 'PUBLIC' },
  { name: 'Patriots Victory Day',          date: '2026-05-05', type: 'PUBLIC' },
  { name: 'Downfall of the Derg',          date: '2026-05-28', type: 'PUBLIC' },
  { name: 'Eid al-Adha',                   date: '2026-06-17', type: 'RELIGIOUS' },
  { name: 'Ethiopian New Year (Enkutatash)',date: '2026-09-11', type: 'PUBLIC' },
  { name: 'Finding of the True Cross (Meskel)', date: '2026-09-27', type: 'RELIGIOUS' },
  { name: 'Mawlid al-Nabi',               date: '2026-09-15', type: 'RELIGIOUS' },
];

const HolidayForm: React.FC<{ data: Partial<Holiday>; onChange: (d: Partial<Holiday>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof Holiday, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      {/* Ethiopian presets */}
      <div className="p-3 bg-[var(--pro-azure-50)] rounded-xl border border-[var(--pro-azure-100)]">
        <p className="text-[10px] font-bold text-[var(--pro-azure-dark)] uppercase tracking-wider mb-2">Ethiopian Public Holidays</p>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {ETH_HOLIDAYS.map(h => (
            <button
              key={h.name}
              type="button"
              onClick={() => onChange({ ...data, name: h.name, date: h.date, type: h.type, isRecurring: true })}
              className="px-2 py-1 bg-white border border-[var(--pro-azure-100)] rounded text-[9px] font-semibold text-[var(--pro-azure-dark)] hover:bg-[var(--pro-azure-100)] transition-all"
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>
      <FormField label="Holiday Name" required>
        <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Ethiopian Christmas" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date" required>
          <Input type="date" value={data.date?.slice(0, 10) ?? ''} onChange={e => set('date', e.target.value)} />
        </FormField>
        <FormField label="Type">
          <Select value={data.type ?? 'PUBLIC'} onChange={e => set('type', e)}>
            <option value="PUBLIC">Public</option>
            <option value="RELIGIOUS">Religious</option>
            <option value="COMPANY">Company</option>
          </Select>
        </FormField>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isRecurring" checked={data.isRecurring ?? false} onChange={e => set('isRecurring', e.target.checked)} className="accent-indigo-600" />
        <label htmlFor="isRecurring" className="text-[12px] font-semibold text-slate-700 cursor-pointer">Recurring annually</label>
      </div>
    </div>
  );
};

const Holidays: React.FC = () => {
  usePageTitle('Holidays');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Holiday> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Holiday>({
    endpoint: '/hr/holidays',
    companyId: selectedCompanyId,
    pageSize: 50,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(h => h.type === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(h => h.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',     value: rows.length,                                          color: 'green' as const },
    { label: 'Public',    value: rows.filter(h => h.type === 'PUBLIC').length,         color: 'sky' as const },
    { label: 'Religious', value: rows.filter(h => h.type === 'RELIGIOUS').length,      color: 'violet' as const },
    { label: 'Company',   value: rows.filter(h => h.type === 'COMPANY').length,        color: 'amber' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim() || !modal.data.date) { toast.error('Name and date are required'); return; }
    const result = await save({ ...modal.data } as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const TYPE_CLS: Record<string, string> = {
    PUBLIC:    'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
    RELIGIOUS: 'bg-violet-50 text-violet-700 border-violet-100',
    COMPANY:   'bg-amber-50 text-amber-700 border-amber-100',
  };

  const isUpcoming = (date: string) => new Date(date) >= new Date();

  return (
    <AppPage
      title="Holidays"
      subtitle="Ethiopian public holidays · Company calendar · Manufacturing & Logistics · Healthcare & Pharmaceuticals · Retail & E-commerce · ERP · Market Segments"
      icon={<Star size={18} />}
      crumbs={[{ label: 'Holidays' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',      label: 'All',      count: rows.length },
            { key: 'PUBLIC',   label: 'Public',   count: rows.filter(h => h.type === 'PUBLIC').length },
            { key: 'RELIGIOUS',label: 'Religious',count: rows.filter(h => h.type === 'RELIGIOUS').length },
            { key: 'COMPANY',  label: 'Company',  count: rows.filter(h => h.type === 'COMPANY').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          {can('holidays:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { type: 'PUBLIC', isRecurring: true } })}>
              Add Holiday
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search holidays…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} holidays</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Holiday</AppTh>
          <AppTh>Date</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Recurring</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={6}><EmptyState icon={<Star size={18} />} title="No holidays" desc="Add Ethiopian public holidays and company days off" action={can('holidays:write') ? { label: 'Add Holiday', onClick: () => setModal({ open: true, data: { type: 'PUBLIC', isRecurring: true } }) } : undefined} /></td></tr>
          ) : filtered.map(h => (
            <AppTr key={h.id}>
              <AppTd>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Star size={12} className="text-amber-500" />
                  </div>
                  <span className="text-[12px] font-semibold text-slate-800">{h.name}</span>
                </div>
              </AppTd>
              <AppTd>
                <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                  <Calendar size={9} className="text-slate-300" />
                  {new Date(h.date).toLocaleDateString('en-ET', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </AppTd>
              <AppTd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${TYPE_CLS[h.type] ?? TYPE_CLS.PUBLIC}`}>
                  {h.type}
                </span>
              </AppTd>
              <AppTd>
                {h.isRecurring
                  ? <span className="text-[10px] font-semibold text-[var(--pro-azure)]">Annual</span>
                  : <span className="ovds-caption">Once</span>
                }
              </AppTd>
              <AppTd>
                <StatusBadge status={isUpcoming(h.date) ? 'PENDING' : 'COMPLETED'} label={isUpcoming(h.date) ? 'Upcoming' : 'Past'} />
              </AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {can('holidays:write') && (
                    <>
                      <button onClick={() => setModal({ open: true, data: { ...h } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all"><Edit2 size={11} /></button>
                      <button onClick={async () => { if (await confirm({ title: `Delete "${h.name}"?`, variant: 'danger' })) remove(h.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={11} /></button>
                    </>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={50} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit Holiday' : 'Add Holiday'} subtitle="Ethiopian public holidays · Company calendar"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Add Holiday'}</Btn></>}>
        <HolidayForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default Holidays;

