/**
 * Customers — ovds-style customer management
 * Inherits: AppPage · AppKpi · AppTable · useApiCrud
 * White background · indigo text · White-blue icons
 * Ethiopian KYC + TIN validation · IFRS credit risk
 */
import { evalMath } from '@ovds/ui';
import {
  Users2, Plus, Edit2, Trash2, Eye, Download, RefreshCw,
  Mail, Phone,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { OvdsEmptyState } from '../components/ovds';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, Amount, Pagination,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { confirm } from '../utils/confirm';
import { fmtETB } from '../utils/ethiopianTax';

// -- Types ---------------------------------------------------------------------
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tin?: string;
  vatNumber?: string;
  businessType?: string;
  paymentTerms?: string;
  creditLimit?: number;
  riskLevel?: string;
  kycStatus?: string;
  currencyCode?: string;
  notes?: string;
  createdAt: string;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'HIGH_RISK' | 'KYC_PENDING';

const BUSINESS_TYPES = ['PLC', 'SOLE_PROPRIETOR', 'PARTNERSHIP', 'NGO', 'GOVERNMENT', 'INDIVIDUAL'];
const PAYMENT_TERMS  = ['IMMEDIATE', 'NET7', 'NET15', 'NET30', 'NET60'];
const RISK_LEVELS    = ['LOW', 'MEDIUM', 'HIGH'];

// -- Customer form -------------------------------------------------------------
const CustomerForm: React.FC<{
  data: Partial<Customer>;
  onChange: (d: Partial<Customer>) => void;
}> = ({ data, onChange }) => {
  const set = (k: keyof Customer, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Full Name / Company" required>
          <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Customer name" />
        </FormField>
        <FormField label="TIN Number" hint="10-digit ERCA TIN">
          <Input value={data.tin ?? ''} onChange={e => set('tin', e.target.value)} placeholder="0000000000" maxLength={10} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Email">
          <Input type="email" value={data.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="customer@example.com" />
        </FormField>
        <FormField label="Phone">
          <Input value={data.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+251 9XX XXX XXX" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Business Type">
          <Select value={data.businessType ?? ''} onChange={e => set('businessType', e)}>
            <option value="">Select type</option>
            {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </Select>
        </FormField>
        <FormField label="Payment Terms">
          <Select value={data.paymentTerms ?? 'NET30'} onChange={e => set('paymentTerms', e)}>
            {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Credit Limit (ETB)">
          <Input type="number" value={data.creditLimit ?? ''} onChange={e => set('creditLimit', e.target.value)} onBlur={e => set('creditLimit', Number((evalMath(e.target.value) ?? parseFloat(e.target.value)) || 0))} placeholder="0.00" />
        </FormField>
        <FormField label="Risk Level">
          <Select value={data.riskLevel ?? 'MEDIUM'} onChange={e => set('riskLevel', e)}>
            {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="VAT Number">
          <Input value={data.vatNumber ?? ''} onChange={e => set('vatNumber', e.target.value)} placeholder="VAT registration no." />
        </FormField>
        <FormField label="Currency">
          <Select value={data.currencyCode ?? 'ETB'} onChange={e => set('currencyCode', e)}>
            <option value="ETB">ETB — Ethiopian Birr</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Address">
        <Input value={data.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="Addis Ababa, Ethiopia" />
      </FormField>
      <FormField label="Notes">
        <Textarea value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Internal notes…" />
      </FormField>
    </div>
  );
};

// -- Main page -----------------------------------------------------------------
const Customers: React.FC = () => {
  usePageTitle('Customers');
  const navigate  = useNavigate();
  const { can }   = useAuth();
  const { selectedCompanyId } = useBusiness();

  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Customer> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Customer>({
    endpoint: '/ovds/customers',
    companyId: selectedCompanyId,
    pageSize: 25,
    pollMs: 60_000,
  });

  // -- Filter ----------------------------------------------------------------
  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'HIGH_RISK')   list = list.filter(c => c.riskLevel === 'HIGH');
    if (tab === 'KYC_PENDING') list = list.filter(c => !c.kycStatus || c.kycStatus === 'PENDING');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        [c.name, c.email, c.phone, c.tin, c.vatNumber].some(v => String(v ?? '').toLowerCase().includes(q))
      );
    }
    return list;
  }, [rows, tab, search]);

  // -- KPI cells -------------------------------------------------------------
  const kpiCells = useMemo(() => [
    { label: 'Total',       value: rows.length,                                                  color: 'green' as const, tooltip: 'All registered customers' },
    { label: 'With TIN',    value: rows.filter(c => c.tin).length,                               color: 'sky' as const,     tooltip: 'Customers with ERCA Tax Identification Number' },
    { label: 'High Risk',   value: rows.filter(c => c.riskLevel === 'HIGH').length,              color: 'rose' as const,    tooltip: 'Customers flagged as high credit risk' },
    { label: 'KYC Pending', value: rows.filter(c => !c.kycStatus || c.kycStatus === 'PENDING').length, color: 'amber' as const, tooltip: 'Customers awaiting identity verification' },
    { label: 'Credit Limit',value: fmtETB(rows.reduce((s, c) => s + (c.creditLimit ?? 0), 0)), color: 'violet' as const,  tooltip: 'Total credit extended to all customers' },
  ], [rows]);

  // -- Handlers --------------------------------------------------------------
  const openCreate = () => setModal({ open: true, data: { currencyCode: 'ETB', paymentTerms: 'NET30', riskLevel: 'MEDIUM' } });
  const openEdit   = (c: Customer) => setModal({ open: true, data: { ...c } });

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim()) { toast.error('Customer name is required'); return; }
    const result = await save({ ...modal.data } as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleDelete = useCallback(async (c: Customer) => {
    if (!can('ovds:write')) { toast.error('Insufficient permissions'); return; }
    if (!(await confirm({ title: `Delete "${c.name}"?`, variant: 'danger' }))) return;
    await remove(c.id);
  }, [can, remove]);

  const handleExport = () => {
    const headers = 'Name,Email,Phone,TIN,Business Type,Payment Terms,Credit Limit,Risk,KYC\n';
    const csvRows = filtered.map(c =>
      `"${c.name}","${c.email ?? ''}","${c.phone ?? ''}","${c.tin ?? ''}","${c.businessType ?? ''}","${c.paymentTerms ?? ''}",${c.creditLimit ?? 0},"${c.riskLevel ?? ''}","${c.kycStatus ?? ''}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} customers`);
  };

  const riskBadge = (level?: string) => {
    const map: Record<string, string> = {
      LOW:    'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
      MEDIUM: 'bg-amber-50 text-amber-700 border-amber-100',
      HIGH:   'bg-rose-50 text-rose-700 border-rose-100',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${map[level ?? 'MEDIUM'] ?? map.MEDIUM}`}>
        {level ?? 'MEDIUM'}
      </span>
    );
  };

  return (
    <AppPage
      title="Customers"
      subtitle={`${rows.length} customer accounts · ${selectedCompanyId ? 'Company filtered' : 'All companies'} · CRM · Consumer Insights · Market Segmentation · Retail & E-commerce · Banking & ovds`}
      icon={<Users2 size={18} />}
      crumbs={[{ label: 'Customers' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',         label: 'All',         count: rows.length },
            { key: 'HIGH_RISK',   label: 'High Risk',   count: rows.filter(c => c.riskLevel === 'HIGH').length },
            { key: 'KYC_PENDING', label: 'KYC Pending', count: rows.filter(c => !c.kycStatus || c.kycStatus === 'PENDING').length },
          ]}
          active={tab}
          onChange={k => { setTab(k as FilterTab); }}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {can('ovds:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={openCreate}>New Customer</Btn>
          )}
        </>
      }
    >
      {/* KPI strip */}
      <AppKpi cells={kpiCells} />

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, TIN…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} customers</span>
      </div>

      {/* Table */}
      <AppTable>
        <thead>
          <tr>
            <AppTh>Customer</AppTh>
            <AppTh>Contact</AppTh>
            <AppTh>TIN / VAT</AppTh>
            <AppTh>Terms</AppTh>
            <AppTh align="right">Credit Limit</AppTh>
            <AppTh>Risk</AppTh>
            <AppTh>KYC</AppTh>
            <AppTh align="right" width="80px">Actions</AppTh>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="px-3 py-12 text-center">
                <RefreshCw size={18} className="animate-spin text-slate-300 mx-auto" />
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <OvdsEmptyState
                  type="customer"
                  isFiltered={!!(search || tab !== 'ALL')}
                  onClearFilters={() => { setSearch(''); setTab('ALL'); }}
                  onAction={can('ovds:write') ? openCreate : undefined}
                />
              </td>
            </tr>
          ) : filtered.map(c => (
            <AppTr key={c.id}>
              <AppTd>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--pro-azure-100)] to-[var(--pro-azure-100)] flex items-center justify-center text-[11px] font-bold text-[var(--pro-azure-dark)] shrink-0">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <button
                      onClick={() => navigate(`/customer-summary/${c.id}`)}
                      className="text-[12px] font-semibold text-slate-800 hover:text-[var(--pro-azure)] transition-colors truncate block max-w-[160px] text-left"
                    >
                      {c.name}
                    </button>
                    {c.businessType && (
                      <span className="ovds-caption">{c.businessType.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                </div>
              </AppTd>
              <AppTd>
                <div className="space-y-0.5">
                  {c.email && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Mail size={9} className="text-slate-300" /> {c.email}
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Phone size={9} className="text-slate-300" /> {c.phone}
                    </div>
                  )}
                </div>
              </AppTd>
              <AppTd>
                <div className="space-y-0.5">
                  {c.tin && (
                    <span className="font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-100 block w-fit">
                      TIN: {c.tin}
                    </span>
                  )}
                  {c.vatNumber && (
                    <span className="font-mono text-[10px] text-[var(--pro-azure)] bg-[var(--pro-azure-50)] px-1.5 py-0.5 rounded border border-[var(--pro-azure-100)] block w-fit">
                      VAT: {c.vatNumber}
                    </span>
                  )}
                  {!c.tin && !c.vatNumber && <span className="text-[10px] text-slate-300">—</span>}
                </div>
              </AppTd>
              <AppTd>
                <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-100">
                  {c.paymentTerms ?? 'NET30'}
                </span>
              </AppTd>
              <AppTd align="right">
                {c.creditLimit
                  ? <Amount value={c.creditLimit} size="sm" />
                  : <span className="text-[10px] text-slate-300">—</span>
                }
              </AppTd>
              <AppTd>{riskBadge(c.riskLevel)}</AppTd>
              <AppTd>
                <StatusBadge
                  status={c.kycStatus ?? 'PENDING'}
                  label={c.kycStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                />
              </AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigate(`/customer-summary/${c.id}`)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all"
                    title="View"
                  >
                    <Eye size={11} />
                  </button>
                  {can('ovds:write') && (
                    <>
                      <button
                        onClick={() => openEdit(c)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all"
                        title="Edit"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={11} />
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
        <Pagination page={page} total={total} pageSize={25} onChange={p => { setPage(p); }} />
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.data.id ? `Edit: ${modal.data.name}` : 'New Customer'}
        subtitle="Ethiopian KYC · TIN · IFRS credit risk classification"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn>
            <Btn variant="primary" loading={saving} onClick={handleSave}>
              {modal.data.id ? 'Save Changes' : 'Create Customer'}
            </Btn>
          </>
        }
      >
        <CustomerForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default Customers;


