/**
 * Vendors — ovds-style vendor/supplier management
 * Inherits: AppPage · AppKpi · AppTable · useApiCrud
 * White background · indigo text · White-blue icons
 * Ethiopian WHT · TIN validation · ERCA compliance
 */
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import { OvdsEmptyState } from '../components/ovds';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, EthTaxBadge, Amount, Pagination,
  Icon,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { confirm } from '../utils/confirm';
import { fmtETB, calcWHT, getWhtLabel } from '../utils/ethiopianTax';
import type { WhtType } from '../utils/ethiopianTax';

// -- Types ---------------------------------------------------------------------
interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tin?: string;
  vatNumber?: string;
  notes?: string;
  paymentTerms?: string;
  category?: string;
  isActive?: boolean;
  whtApplicable?: boolean;
  whtType?: WhtType;
  bankName?: string;
  accountNumber?: string;
  outstandingBalance?: number;
  totalBills?: number;
  createdAt: string;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'WHT' | 'INACTIVE';

const CATEGORIES    = ['SUPPLIER', 'CONTRACTOR', 'SERVICE_PROVIDER', 'UTILITY', 'GOVERNMENT', 'OTHER'];
const PAYMENT_TERMS = ['IMMEDIATE', 'NET15', 'NET30', 'NET45', 'NET60', 'COD'];
const WHT_TYPES: WhtType[] = ['GOODS', 'SERVICES', 'SERVICES_NR', 'RENT', 'DIVIDEND', 'INTEREST'];
const ETH_BANKS = [
  'Commercial Bank of Ethiopia', 'Awash Bank', 'Dashen Bank', 'Abyssinia Bank',
  'Wegagen Bank', 'United Bank', 'Nib International Bank', 'Cooperative Bank of Oromia',
  'Berhan Bank', 'Bunna Bank', 'Zemen Bank', 'Oromia International Bank', 'Other',
];

// -- Vendor form ---------------------------------------------------------------
const VendorForm: React.FC<{
  data: Partial<Vendor>;
  onChange: (d: Partial<Vendor>) => void;
}> = ({ data, onChange }) => {
  const set = (k: keyof Vendor, v: any) => onChange({ ...data, [k]: v });
  const [formTab, setFormTab] = useState<'IDENTITY' | 'FISCAL' | 'BANKING'>('IDENTITY');

  const whtPreview = data.whtApplicable && data.whtType
    ? calcWHT(100_000, data.whtType)
    : null;

  return (
    <div>
      {/* Mini tabs */}
      <div className="flex gap-0 border-b border-slate-100 mb-4 -mx-5 px-5">
        {(['IDENTITY', 'FISCAL', 'BANKING'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setFormTab(t)}
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
              formTab === t ? 'border-[var(--pro-azure)] text-[var(--pro-azure-dark)]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {formTab === 'IDENTITY' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Vendor Name" required>
              <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Supplier / Vendor name" />
            </FormField>
            <FormField label="Category">
              <Select value={data.category ?? 'SUPPLIER'} onChange={e => set('category', e)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email">
              <Input type="email" value={data.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="vendor@example.com" />
            </FormField>
            <FormField label="Phone">
              <Input value={data.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+251 9XX XXX XXX" />
            </FormField>
          </div>
          <FormField label="Address">
            <Input value={data.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="Addis Ababa, Ethiopia" />
          </FormField>
          <FormField label="Notes">
            <Textarea value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Internal notes…" />
          </FormField>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
            <input
              type="checkbox"
              id="isActive"
              checked={data.isActive !== false}
              onChange={e => set('isActive', e.target.checked)}
              className="accent-green-600"
            />
            <label htmlFor="isActive" className="text-[12px] font-semibold text-slate-700 cursor-pointer">Active vendor</label>
          </div>
        </div>
      )}

      {formTab === 'FISCAL' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="TIN Number" hint="10-digit ERCA TIN">
              <Input value={data.tin ?? ''} onChange={e => set('tin', e.target.value)} placeholder="0000000000" maxLength={10} />
            </FormField>
            <FormField label="Payment Terms">
              <Select value={data.paymentTerms ?? 'NET30'} onChange={e => set('paymentTerms', e)}>
                {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </FormField>
          </div>
          {/* WHT section */}
          <div className={`p-3 rounded-xl border transition-all ${data.whtApplicable ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                id="whtApplicable"
                checked={data.whtApplicable ?? false}
                onChange={e => set('whtApplicable', e.target.checked)}
                className="accent-amber-600"
              />
              <label htmlFor="whtApplicable" className="text-[12px] font-semibold text-amber-800 cursor-pointer">
                WHT Applicable — Proclamation No. 1395/2025
              </label>
            </div>
            {data.whtApplicable && (
              <div className="space-y-2 mt-2">
                <FormField label="WHT Type">
                  <Select value={data.whtType ?? 'GOODS'} onChange={e => set('whtType', e as WhtType)}>
                    {WHT_TYPES.map(t => <option key={t} value={t}>{getWhtLabel(t)}</option>)}
                  </Select>
                </FormField>
                {whtPreview && (
                  <div className="flex items-center justify-between text-[10px] bg-white rounded-lg px-3 py-2 border border-amber-100">
                    <span className="text-slate-500">On ETB 100,000 payment:</span>
                    <span className="font-bold text-amber-700">
                      WHT = {fmtETB(whtPreview.whtAmount)} · Net = {fmtETB(whtPreview.netPayable)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {formTab === 'BANKING' && (
        <div className="space-y-3">
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-[11px] text-sky-700 font-semibold">
            Bank details are used for fund transfers and accounts payable processing.
          </div>
          <FormField label="Bank Name">
            <Select value={data.bankName ?? ''} onChange={e => set('bankName', e)}>
              <option value="">Select bank</option>
              {ETH_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </Select>
          </FormField>
          <FormField label="Account Number">
            <Input
              value={data.accountNumber ?? ''}
              onChange={e => set('accountNumber', e.target.value)}
              placeholder="Bank account number"
              className="font-mono"
            />
          </FormField>
        </div>
      )}
    </div>
  );
};

// -- Main page -----------------------------------------------------------------
const Vendors: React.FC = () => {
  usePageTitle('Vendors');
  const { can }   = useAuth();
  const { selectedCompanyId } = useBusiness();

  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Vendor> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Vendor>({
    endpoint: '/ovds/vendors',
    companyId: selectedCompanyId,
    pageSize: 25,
    pollMs: 60_000,
  });

  // -- Filter ----------------------------------------------------------------
  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'ACTIVE')   list = list.filter(v => v.isActive !== false);
    if (tab === 'INACTIVE') list = list.filter(v => v.isActive === false);
    if (tab === 'WHT')      list = list.filter(v => v.whtApplicable);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        [v.name, v.email, v.phone, v.tin, v.category].some(x => String(x ?? '').toLowerCase().includes(q))
      );
    }
    return list;
  }, [rows, tab, search]);

  // -- KPI cells -------------------------------------------------------------
  const kpiCells = useMemo(() => [
    { label: 'Total',       value: rows.length,                                                    color: 'green' as const, tooltip: 'All registered vendors and suppliers' },
    { label: 'Active',      value: rows.filter(v => v.isActive !== false).length,                  color: 'sky' as const,     tooltip: 'Vendors currently active and available for billing' },
    { label: 'WHT Vendors', value: rows.filter(v => v.whtApplicable).length,                       color: 'amber' as const,   tooltip: 'Vendors subject to 3% Withholding Tax (Proclamation 1395/2025)' },
    { label: 'Net Payables',value: fmtETB(rows.reduce((s, v) => s + (v.outstandingBalance ?? 0), 0)), color: 'violet' as const, tooltip: 'Total outstanding balance owed to all vendors' },
    { label: 'Total Bills', value: rows.reduce((s, v) => s + (v.totalBills ?? 0), 0),              color: 'rose' as const,    tooltip: 'Total number of bills across all vendors' },
  ], [rows]);

  // -- Handlers --------------------------------------------------------------
  const openCreate = () => setModal({ open: true, data: { isActive: true, paymentTerms: 'NET30', category: 'SUPPLIER' } });
  const openEdit   = (v: Vendor) => setModal({ open: true, data: { ...v } });

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim()) { toast.error('Vendor name is required'); return; }
    const result = await save({ ...modal.data } as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleDelete = useCallback(async (v: Vendor) => {
    if (!can('bills:write')) { toast.error('Insufficient permissions'); return; }
    if (!(await confirm({ title: `Delete "${v.name}"?`, variant: 'danger' }))) return;
    await remove(v.id);
  }, [can, remove]);

  const handleExport = () => {
    const headers = 'Name,Email,Phone,TIN,Category,Payment Terms,WHT,Outstanding\n';
    const csvRows = filtered.map(v =>
      `"${v.name}","${v.email ?? ''}","${v.phone ?? ''}","${v.tin ?? ''}","${v.category ?? ''}","${v.paymentTerms ?? ''}","${v.whtApplicable ? 'Yes' : 'No'}",${v.outstandingBalance ?? 0}`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `vendors-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} vendors`);
  };

  return (
    <AppPage
      title="Vendors"
      subtitle={`${rows.length} supplier accounts · Accounts Payable · Supply Chain · Manufacturing & Logistics · Retail & E-commerce · Consumer Insights · Market Segmentation`}
      icon={<Icon name="COMPANY" size={18} />}
      crumbs={[{ label: 'Vendors' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',      label: 'All',      count: rows.length },
            { key: 'ACTIVE',   label: 'Active',   count: rows.filter(v => v.isActive !== false).length },
            { key: 'WHT',      label: 'WHT',      count: rows.filter(v => v.whtApplicable).length },
            { key: 'INACTIVE', label: 'Inactive', count: rows.filter(v => v.isActive === false).length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<Icon name="REFRESH" size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Icon name="DOWNLOAD" size={11} />} onClick={handleExport}>Export</Btn>
          {can('bills:write') && (
            <Btn variant="primary" size="sm" icon={<Icon name="ADD" size={12} />} onClick={openCreate}>New Vendor</Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, TIN…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} vendors</span>
      </div>

      <AppTable>
        <thead>
          <tr>
            <AppTh>Vendor</AppTh>
            <AppTh>Contact</AppTh>
            <AppTh>TIN</AppTh>
            <AppTh>Terms</AppTh>
            <AppTh>WHT</AppTh>
            <AppTh align="right">Outstanding</AppTh>
            <AppTh>Status</AppTh>
            <AppTh align="right" width="80px">Actions</AppTh>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="px-3 py-12 text-center">
              <Icon name="REFRESH" size={18} className="animate-spin text-slate-300 mx-auto" />
            </td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}>
              <OvdsEmptyState
                type="vendor"
                isFiltered={!!(search || tab !== 'ALL')}
                onClearFilters={() => { setSearch(''); setTab('ALL'); }}
                onAction={can('bills:write') ? openCreate : undefined}
              />
            </td></tr>
          ) : filtered.map(v => (
            <AppTr key={v.id}>
              <AppTd>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-[11px] font-bold text-amber-700 shrink-0">
                    {v.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 truncate max-w-[160px]">{v.name}</p>
                    {v.category && (
                      <span className="ovds-caption">{v.category.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                </div>
              </AppTd>
              <AppTd>
                <div className="space-y-0.5">
                  {v.email && <div className="flex items-center gap-1 text-[10px] text-slate-500"><Icon name="MAIL" size={9} className="text-slate-300" />{v.email}</div>}
                  {v.phone && <div className="flex items-center gap-1 text-[10px] text-slate-500"><Icon name="PHONE" size={9} className="text-slate-300" />{v.phone}</div>}
                </div>
              </AppTd>
              <AppTd>
                {v.tin
                  ? <span className="font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-100">{v.tin}</span>
                  : <span className="text-[10px] text-slate-300">—</span>
                }
              </AppTd>
              <AppTd>
                <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-100">
                  {v.paymentTerms ?? 'NET30'}
                </span>
              </AppTd>
              <AppTd>
                {v.whtApplicable
                  ? <EthTaxBadge type="WHT" rate={v.whtType ? undefined : 3} />
                  : <span className="text-[10px] text-slate-300">N/A</span>
                }
              </AppTd>
              <AppTd align="right">
                {v.outstandingBalance
                  ? <Amount value={v.outstandingBalance} negative size="sm" />
                  : <span className="text-[10px] text-slate-300">—</span>
                }
              </AppTd>
              <AppTd>
                <StatusBadge status={v.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />
              </AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {can('bills:write') && (
                    <>
                      <button onClick={() => openEdit(v)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all" title="Edit">
                        <Icon name="EDIT" size={11} />
                      </button>
                      <button onClick={() => handleDelete(v)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete">
                        <Icon name="DELETE" size={11} />
                      </button>
                    </>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>

      <div className="mt-3">
        <Pagination page={page} total={total} pageSize={25} onChange={p => setPage(p)} />
      </div>

      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.data.id ? `Edit: ${modal.data.name}` : 'New Vendor'}
        subtitle="Ethiopian WHT · TIN · ERCA Proclamation 1395/2025 · Manufacturing & Logistics · IT & Software · Banking & ovds · Market Segmentation"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn>
            <Btn variant="primary" loading={saving} onClick={handleSave}>
              {modal.data.id ? 'Save Changes' : 'Register Vendor'}
            </Btn>
          </>
        }
      >
        <VendorForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default Vendors;

