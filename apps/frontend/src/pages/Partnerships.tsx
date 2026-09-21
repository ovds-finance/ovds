/**
 * Partnerships — ovds-style business partnership management
 * AppPage · AppKpi · AppTable · useApiCrud
 */
import {
  HeartHandshake, Plus, Edit2, Trash2, RefreshCw, Download,
  Calendar,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, EmptyState, Pagination, Amount,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { confirm } from '../utils/confirm';
import { fmtETB } from '../utils/ethiopianTax';

interface Partnership {
  id: string;
  name: string;
  type: string;
  status: string;
  partnerName?: string;
  partnerTin?: string;
  sharePercentage?: number;
  investedCapital?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  companyId?: string;
  createdAt: string;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'JOINT_VENTURE' | 'CONSORTIUM';

const PARTNERSHIP_TYPES = ['JOINT_VENTURE', 'CONSORTIUM', 'STRATEGIC_ALLIANCE', 'FRANCHISE', 'DISTRIBUTION', 'OTHER'];

const PartnershipForm: React.FC<{ data: Partial<Partnership>; onChange: (d: Partial<Partnership>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof Partnership, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Partnership Name" required>
          <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Addis-Nairobi JV" />
        </FormField>
        <FormField label="Type">
          <Select value={data.type ?? 'JOINT_VENTURE'} onChange={e => set('type', e)}>
            {PARTNERSHIP_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Partner Name">
          <Input value={data.partnerName ?? ''} onChange={e => set('partnerName', e.target.value)} placeholder="Partner company name" />
        </FormField>
        <FormField label="Partner TIN">
          <Input value={data.partnerTin ?? ''} onChange={e => set('partnerTin', e.target.value)} placeholder="10-digit TIN" maxLength={10} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Share %" hint="Your ownership percentage">
          <Input type="number" min="0" max="100" step="0.01" value={data.sharePercentage ?? ''} onChange={e => set('sharePercentage', parseFloat(e.target.value) || 0)} placeholder="50.00" />
        </FormField>
        <FormField label="Invested Capital (ETB)">
          <Input type="number" step="0.01" value={data.investedCapital ?? ''} onChange={e => set('investedCapital', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start Date">
          <Input type="date" value={data.startDate?.slice(0, 10) ?? ''} onChange={e => set('startDate', e.target.value)} />
        </FormField>
        <FormField label="End Date">
          <Input type="date" value={data.endDate?.slice(0, 10) ?? ''} onChange={e => set('endDate', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="Partnership scope and objectives…" />
      </FormField>
    </div>
  );
};

const Partnerships: React.FC = () => {
  usePageTitle('Partnerships');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Partnership> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Partnership>({
    endpoint: '/ovds/partnerships',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'ACTIVE')        list = list.filter(p => p.status === 'ACTIVE');
    if (tab === 'JOINT_VENTURE') list = list.filter(p => p.type === 'JOINT_VENTURE');
    if (tab === 'CONSORTIUM')    list = list.filter(p => p.type === 'CONSORTIUM');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => [p.name, p.partnerName, p.type].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => {
    const totalCapital = rows.reduce((s, p) => s + (p.investedCapital ?? 0), 0);
    return [
      { label: 'Total',    value: rows.length,                                                    color: 'green' as const },
      { label: 'Active',   value: rows.filter(p => p.status === 'ACTIVE').length,                 color: 'sky' as const },
      { label: 'JV',       value: rows.filter(p => p.type === 'JOINT_VENTURE').length,            color: 'violet' as const },
      { label: 'Capital',  value: fmtETB(totalCapital),                                           color: 'amber' as const },
    ];
  }, [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim()) { toast.error('Partnership name is required'); return; }
    const result = await save({ ...modal.data, status: modal.data.status ?? 'ACTIVE' } as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleExport = () => {
    const headers = 'Name,Type,Partner,TIN,Share %,Capital,Status\n';
    const csvRows = filtered.map(p =>
      `"${p.name}","${p.type}","${p.partnerName ?? ''}","${p.partnerTin ?? ''}",${p.sharePercentage ?? 0},${p.investedCapital ?? 0},"${p.status}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `partnerships-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="Partnerships"
      subtitle="Joint ventures · Consortiums · Strategic alliances · Investment Trends · Market Share · Revenue · Strategic Insights · Banking & ovds · Competitive Landscape"
      icon={<HeartHandshake size={18} />}
      crumbs={[{ label: 'Partnerships' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',          label: 'All',           count: rows.length },
            { key: 'ACTIVE',       label: 'Active',        count: rows.filter(p => p.status === 'ACTIVE').length },
            { key: 'JOINT_VENTURE',label: 'Joint Ventures',count: rows.filter(p => p.type === 'JOINT_VENTURE').length },
            { key: 'CONSORTIUM',   label: 'Consortiums',   count: rows.filter(p => p.type === 'CONSORTIUM').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {can('partnerships:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { type: 'JOINT_VENTURE', status: 'ACTIVE' } })}>
              New Partnership
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search partnerships…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} partnerships</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Partnership</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Partner</AppTh>
          <AppTh align="right">Share %</AppTh>
          <AppTh align="right">Capital</AppTh>
          <AppTh>Period</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}><EmptyState icon={<HeartHandshake size={18} />} title="No partnerships" desc="Create your first business partnership" action={can('partnerships:write') ? { label: 'New Partnership', onClick: () => setModal({ open: true, data: { type: 'JOINT_VENTURE', status: 'ACTIVE' } }) } : undefined} /></td></tr>
          ) : filtered.map(p => (
            <AppTr key={p.id}>
              <AppTd>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--pro-azure-100)] to-teal-100 flex items-center justify-center text-[11px] font-bold text-[var(--pro-azure-dark)] shrink-0">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800">{p.name}</p>
                    {p.description && <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{p.description}</p>}
                  </div>
                </div>
              </AppTd>
              <AppTd>
                <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">
                  {p.type.replace(/_/g, ' ')}
                </span>
              </AppTd>
              <AppTd>
                <div>
                  <p className="text-[11px] text-slate-700">{p.partnerName ?? '—'}</p>
                  {p.partnerTin && <p className="text-[9px] font-mono text-slate-400">TIN: {p.partnerTin}</p>}
                </div>
              </AppTd>
              <AppTd align="right">
                {p.sharePercentage != null
                  ? <span className="text-[11px] font-bold text-[var(--pro-azure)]">{p.sharePercentage.toFixed(1)}%</span>
                  : <span className="text-[10px] text-slate-300">—</span>
                }
              </AppTd>
              <AppTd align="right">
                {p.investedCapital ? <Amount value={p.investedCapital} size="sm" /> : <span className="text-[10px] text-slate-300">—</span>}
              </AppTd>
              <AppTd>
                <div className="text-[10px] text-slate-500 space-y-0.5">
                  {p.startDate && <div className="flex items-center gap-1"><Calendar size={9} className="text-slate-300" />{new Date(p.startDate).toLocaleDateString()}</div>}
                  {p.endDate && <div className="flex items-center gap-1"><Calendar size={9} className="text-slate-300" />{new Date(p.endDate).toLocaleDateString()}</div>}
                </div>
              </AppTd>
              <AppTd><StatusBadge status={p.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {can('partnerships:write') && (
                    <>
                      <button onClick={() => setModal({ open: true, data: { ...p } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all"><Edit2 size={11} /></button>
                      <button onClick={async () => { if (await confirm({ title: `Delete "${p.name}"?`, variant: 'danger' })) remove(p.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={11} /></button>
                    </>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? `Edit: ${modal.data.name}` : 'New Partnership'} subtitle="Joint venture · Consortium · Strategic alliance"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create Partnership'}</Btn></>}>
        <PartnershipForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default Partnerships;


