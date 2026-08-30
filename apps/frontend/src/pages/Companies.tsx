/**
 * Companies — ovds-style multi-company management
 * AppPage · AppKpi · AppTable · useApiCrud
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Plus, Edit2, Trash2, RefreshCw,
  Building2, Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { confirm } from '../utils/confirm';
import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select,
  SearchBar, EmptyState, Pagination, IFRSBadge,
} from '../components/ui';

interface Company {
  id: string;
  name: string;
  type: string;
  currencyCode?: string;
  tin?: string;
  environment?: string;
  autoUpdate?: boolean;
  currentVersion?: string;
  createdAt: string;
}

const COMPANY_TYPES = ['PLC', 'SOLE_PROPRIETOR', 'PARTNERSHIP', 'NGO', 'GOVERNMENT', 'SHARE_COMPANY'];

const CompanyForm: React.FC<{ data: Partial<Company>; onChange: (d: Partial<Company>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof Company, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <FormField label="Company Name" required>
        <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Acme Trading PLC" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type">
          <Select value={data.type ?? 'PLC'} onChange={e => set('type', e)}>
            {COMPANY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </Select>
        </FormField>
        <FormField label="Currency">
          <Select value={data.currencyCode ?? 'ETB'} onChange={e => set('currencyCode', e)}>
            <option value="ETB">ETB — Ethiopian Birr</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
          </Select>
        </FormField>
      </div>
      <FormField label="TIN Number" hint="10-digit ERCA TIN">
        <Input value={data.tin ?? ''} onChange={e => set('tin', e.target.value)} placeholder="0000000000" maxLength={10} />
      </FormField>
      <FormField label="Environment">
        <Select value={data.environment ?? 'PRODUCTION'} onChange={e => set('environment', e)}>
          <option value="PRODUCTION">Production</option>
          <option value="STAGING">Staging</option>
          <option value="DEVELOPMENT">Development</option>
        </Select>
      </FormField>
    </div>
  );
};

const Companies: React.FC = () => {
  usePageTitle('Companies');
  const navigate  = useNavigate();
  const { can }   = useAuth();
  const { selectedCompanyId, setSelectedCompanyId } = useBusiness();
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Company> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Company>({
    endpoint: '/ovds/companies',
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(c => [c.name, c.type, c.tin].some(v => String(v ?? '').toLowerCase().includes(q)));
  }, [rows, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',       value: rows.length,                                                    color: 'emerald' as const },
    { label: 'Production',  value: rows.filter(c => c.environment === 'PRODUCTION' || !c.environment).length, color: 'sky' as const },
    { label: 'With TIN',    value: rows.filter(c => c.tin).length,                                color: 'violet' as const },
    { label: 'Auto-Update', value: rows.filter(c => c.autoUpdate).length,                         color: 'amber' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim()) { toast.error('Company name is required'); return; }
    const result = await save(modal.data as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleDelete = useCallback(async (c: Company) => {
    if (!can('companies:write')) { toast.error('Insufficient permissions'); return; }
    if (!(await confirm({ title: `Delete "${c.name}"?`, message: 'This will permanently delete the company and all associated data.', variant: 'danger' }))) return;
    await remove(c.id);
  }, [can, remove]);

  return (
    <AppPage
      title="Companies"
      subtitle="Multi-company management · Ethiopian business registry"
      icon={<Briefcase size={18} />}
      crumbs={[{ label: 'Company Settings' }, { label: 'Companies' }]}
      actions={
        <>
          <IFRSBadge compliant />
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          {can('companies:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { type: 'PLC', currencyCode: 'ETB', environment: 'PRODUCTION' } })}>
              New Company
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search companies…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} companies</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Company</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>TIN</AppTh>
          <AppTh>Currency</AppTh>
          <AppTh>Environment</AppTh>
          <AppTh>Version</AppTh>
          <AppTh align="right" width="100px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={7}><EmptyState icon={<Building2 size={18} />} title="No companies" desc="Create your first company to get started" action={can('companies:write') ? { label: 'New Company', onClick: () => setModal({ open: true, data: { type: 'PLC', currencyCode: 'ETB' } }) } : undefined} /></td></tr>
          ) : filtered.map(c => (
            <AppTr key={c.id}>
              <AppTd>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-[11px] font-bold text-emerald-700 shrink-0">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <button onClick={() => setSelectedCompanyId(c.id)} className={`text-[12px] font-semibold hover:text-emerald-600 transition-colors text-left ${c.id === selectedCompanyId ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {c.name}
                    </button>
                    {c.id === selectedCompanyId && <span className="text-[9px] text-emerald-600 font-bold block">● Active</span>}
                  </div>
                </div>
              </AppTd>
              <AppTd><span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-100">{c.type.replace(/_/g, ' ')}</span></AppTd>
              <AppTd><span className="font-mono text-[10px] text-slate-500">{c.tin ?? '—'}</span></AppTd>
              <AppTd><span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-bold border border-sky-100">{c.currencyCode ?? 'ETB'}</span></AppTd>
              <AppTd><StatusBadge status={c.environment ?? 'PRODUCTION'} label={c.environment ?? 'PROD'} /></AppTd>
              <AppTd><span className="font-mono text-[10px] text-slate-400">{c.currentVersion ?? '—'}</span></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => navigate('/settings')} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all" title="Settings"><Settings size={11} /></button>
                  {can('companies:write') && (
                    <>
                      <button onClick={() => setModal({ open: true, data: { ...c } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Edit"><Edit2 size={11} /></button>
                      <button onClick={() => handleDelete(c)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                    </>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? `Edit: ${modal.data.name}` : 'New Company'} subtitle="Ethiopian business entity · ERCA TIN · IFRS"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create Company'}</Btn></>}>
        <CompanyForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default Companies;


