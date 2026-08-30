/* eslint-disable */
/**
 * TransactionCategories — ovds-style category management
 * AppPage · AppKpi · AppTable · useApiCrud
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Tag, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { confirm } from '../utils/confirm';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Select, SearchBar, EmptyState, Pagination,
} from '../components/ui';

interface Category {
  id: string;
  name: string;
  type: string;
  color?: string;
  description?: string;
  companyId?: string;
}

type FilterTab = 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER';

const COLORS = ['#00E784', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

const CategoryForm: React.FC<{ data: Partial<Category>; onChange: (d: Partial<Category>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof Category, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <FormField label="Category Name" required>
        <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Office Supplies" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type">
          <Select value={data.type ?? 'EXPENSE'} onChange={e => set('type', e)}>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="TRANSFER">Transfer</option>
          </Select>
        </FormField>
        <FormField label="Color">
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${data.color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                style={{ background: c }}
                aria-label={`Set color ${c}`}
              />
            ))}
          </div>
        </FormField>
      </div>
      <FormField label="Description">
        <Input value={data.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Optional description" />
      </FormField>
    </div>
  );
};

const TransactionCategories: React.FC = () => {
  usePageTitle('Transaction Categories');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Category> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Category>({
    endpoint: '/ovds/transaction-categories',
    companyId: selectedCompanyId,
    pageSize: 50,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(c => c.type === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',    value: rows.length,                                          color: 'emerald' as const },
    { label: 'Income',   value: rows.filter(c => c.type === 'INCOME').length,         color: 'sky' as const },
    { label: 'Expense',  value: rows.filter(c => c.type === 'EXPENSE').length,        color: 'rose' as const },
    { label: 'Transfer', value: rows.filter(c => c.type === 'TRANSFER').length,       color: 'amber' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim()) { toast.error('Name is required'); return; }
    const result = await save({ ...modal.data } as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save, selectedCompanyId]);

  return (
    <AppPage
      title="Transaction Categories"
      subtitle="Classify income, expenses and transfers · Revenue · Growth · Market Segmentation · Accounting & ovds Software · Banking & ovds"
      icon={<Tag size={18} />}
      crumbs={[{ label: 'Categories' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',      label: 'All',      count: rows.length },
            { key: 'INCOME',   label: 'Income',   count: rows.filter(c => c.type === 'INCOME').length },
            { key: 'EXPENSE',  label: 'Expense',  count: rows.filter(c => c.type === 'EXPENSE').length },
            { key: 'TRANSFER', label: 'Transfer', count: rows.filter(c => c.type === 'TRANSFER').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          {can('ovds:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { type: 'EXPENSE', color: COLORS[0] } })}>
              New Category
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search categories…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} categories</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Category</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Description</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={4}><EmptyState icon={<Tag size={18} />} title="No categories" desc="Create categories to classify transactions" action={can('ovds:write') ? { label: 'New Category', onClick: () => setModal({ open: true, data: { type: 'EXPENSE', color: COLORS[0] } }) } : undefined} /></td></tr>
          ) : filtered.map(c => (
            <AppTr key={c.id}>
              <AppTd>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.color ? `${c.color}20` : '#f1f5f9' }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: c.color ?? '#94a3b8' }} />
                  </div>
                  <span className="text-[12px] font-semibold text-slate-800">{c.name}</span>
                </div>
              </AppTd>
              <AppTd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  c.type === 'INCOME'   ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  c.type === 'EXPENSE'  ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                          'bg-amber-50 text-amber-700 border-amber-100'
                }`}>{c.type}</span>
              </AppTd>
              <AppTd><span className="text-[11px] text-slate-400">{c.description ?? '—'}</span></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {can('ovds:write') && (
                    <>
                      <button onClick={() => setModal({ open: true, data: { ...c } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Edit2 size={11} /></button>
                      <button onClick={async () => { if (await confirm({ title: `Delete "${c.name}"?`, variant: 'danger' })) remove(c.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={11} /></button>
                    </>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={50} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit Category' : 'New Category'} subtitle="Classify transactions for reporting · Revenue · Market Segmentation · Banking & ovds"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create'}</Btn></>}>
        <CategoryForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default TransactionCategories;

