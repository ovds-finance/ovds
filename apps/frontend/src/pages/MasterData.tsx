/**
 * MasterData — Unified ovds-style automated accounting pipeline
 * Pure white · indigo text · Calibri/Arial/Helvetica/Georgia/Garamond
 * White-blue icons · Items · Customers · Vendors · Tax Types · Banks · Companies
 * Ethiopian ERCA tax rules · IFRS compliance · Zero duplication
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Users2, Building2, ShieldCheck, Landmark, Briefcase,
  Plus, Edit2, Trash2, RefreshCw, Download, Upload,
  CheckCircle2, AlertCircle, TrendingUp, ArrowRight,
  Phone, Mail, Hash, Globe, Zap, FileText, BarChart3,
} from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn,
  Toolbar, EmptyState, Modal, FormField,
  Input, Select, Textarea, IconBox, EthTaxBadge, Amount,
  PipelineBar, Pagination, Breadcrumb, BlueIcon, confirm,
} from '../components/ui';
import api from '../services/api';
import { fmtETB, calcVAT, calcWHT } from '../utils/ethiopianTax';
import type { WhtType } from '../utils/ethiopianTax';

// -----------------------------------------------------------------------------
// SHARED STYLE TOKENS — single source, no duplication
// -----------------------------------------------------------------------------
const S = {
  // Font stack: Calibri → Arial → Helvetica → Georgia → Garamond → serif
  font: 'font-[Calibri,Arial,Helvetica,Georgia,Garamond,serif]',
  // White card with indigo border
  card: 'bg-white border border-[var(--pro-azure-100)] rounded-xl shadow-[0_1px_4px_0_rgb(5_150_105/0.06)]',
  // indigo text hierarchy
  h1:   'text-[15px] font-bold text-[var(--pro-azure-dark)] leading-tight',
  h2:   'text-[13px] font-bold text-[var(--pro-azure-dark)]',
  h3:   'text-[11px] font-semibold text-[var(--pro-azure-dark)]',
  body: 'text-[12px] text-[var(--pro-azure-dark)]',
  muted:'text-[11px] text-[var(--pro-azure)]/60',
  // White-blue icon boxes
  iconindigo: 'w-8 h-8 rounded-lg bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] text-[var(--pro-azure)] flex items-center justify-center shrink-0',
  iconSky:     'w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0',
  iconAmber:   'w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0',
  iconViolet:  'w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shrink-0',
  iconRose:    'w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0',
  iconSlate:   'w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center shrink-0',
  // Row action buttons
  rowBtn: 'w-6 h-6 rounded flex items-center justify-center transition-all',
  rowEdit:   'text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)]',
  rowDelete: 'text-slate-400 hover:bg-rose-50 hover:text-rose-600',
};

// -----------------------------------------------------------------------------
// TAB CONFIGURATION — single definition drives tabs, icons, endpoints, columns
// -----------------------------------------------------------------------------
type TabKey = 'items' | 'customers' | 'vendors' | 'tax-types' | 'banks' | 'companies';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  iconCls: string;
  endpoint: string;
  description: string;
  color: 'green' | 'sky' | 'amber' | 'violet' | 'rose' | 'slate';
}

const TABS: TabConfig[] = [
  { key: 'items',      label: 'Items',      icon: <BlueIcon icon={<Package size={14}/>} size="sm" />,     iconCls: '', endpoint: '/ovds/items',          description: 'Products & services catalog',       color: 'green' },
  { key: 'customers',  label: 'Customers',  icon: <BlueIcon icon={<Users2 size={14}/>} size="sm" />,      iconCls: '',     endpoint: '/ovds/customers',      description: 'Customer accounts & contacts',      color: 'sky'     },
  { key: 'vendors',    label: 'Vendors',    icon: <BlueIcon icon={<Building2 size={14}/>} size="sm" />,   iconCls: '',   endpoint: '/ovds/vendors',        description: 'Supplier & vendor accounts',        color: 'amber'   },
  { key: 'tax-types',  label: 'Tax Types',  icon: <BlueIcon icon={<ShieldCheck size={14}/>} size="sm" />, iconCls: '',  endpoint: '/ovds/tax-rates',      description: 'Ethiopian ERCA tax rates & rules',  color: 'violet'  },
  { key: 'banks',      label: 'Banks',      icon: <BlueIcon icon={<Landmark size={14}/>} size="sm" />,    iconCls: '',    endpoint: '/ovds/bank-accounts',  description: 'Bank accounts & balances',          color: 'rose'    },
  { key: 'companies',  label: 'Companies',  icon: <BlueIcon icon={<Briefcase size={14}/>} size="sm" />,   iconCls: '',   endpoint: '/ovds/companies',      description: 'Company profiles & settings',       color: 'slate'   },
];

// -----------------------------------------------------------------------------
// COLUMN DEFINITIONS — one hook, all tabs, no duplication
// -----------------------------------------------------------------------------
function useTabCols(tab: TabKey, onEdit: (r: any) => void, onDelete: (r: any) => void) {
  const navigate = useNavigate();

  const actions = (row: any) => (
    <>
      <button onClick={() => onEdit(row)} className={`${S.rowBtn} ${S.rowEdit}`} title="Edit"><Edit2 size={11}/></button>
      <button onClick={() => onDelete(row)} className={`${S.rowBtn} ${S.rowDelete}`} title="Delete"><Trash2 size={11}/></button>
    </>
  );

  const cols: Record<TabKey, any[]> = {
    items: [
      { key: 'name',      label: 'Item',       render: (r: any) => (
        <div className="flex items-center gap-2">
          <div className={S.iconindigo}><Package size={12}/></div>
          <div>
            <p className={S.h3}>{r.name}</p>
            {r.description && <p className={S.muted + ' truncate max-w-[160px]'}>{r.description}</p>}
          </div>
        </div>
      )},
      { key: 'sku',       label: 'SKU',        render: (r: any) => <span className="font-mono text-[11px] text-[var(--pro-azure-dark)]">{r.sku ?? r.code ?? '—'}</span> },
      { key: 'type',      label: 'Type',       render: (r: any) => <StatusBadge status={r.itemType ?? r.type ?? 'PRODUCT'} label={r.itemType ?? r.type ?? 'Product'}/> },
      { key: 'salePrice', label: 'Sale Price', align: 'right' as const, render: (r: any) => <Amount value={r.salePrice ?? r.price ?? 0} size="sm"/> },
      { key: 'vatRate',   label: 'VAT',        render: (r: any) => r.vatApplicable !== false ? <EthTaxBadge type="VAT" rate={r.vatRate ?? 15}/> : <span className={S.muted}>Exempt</span> },
      { key: 'stock',     label: 'Stock',      align: 'right' as const, render: (r: any) => r.itemType === 'SERVICE' ? <span className={S.muted}>N/A</span> : <span className="font-bold text-[12px] text-[var(--pro-azure-dark)] tabular-nums">{r.stock ?? 0} {r.unit ?? ''}</span> },
      { key: 'isActive',  label: 'Status',     render: (r: any) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'}/> },
    ],
    customers: [
      { key: 'name',        label: 'Customer',     render: (r: any) => (
        <button onClick={() => navigate(`/customer-summary/${r.id}`)} className="flex items-center gap-2 group text-left">
          <div className={S.iconSky}><Users2 size={12}/></div>
          <div>
            <p className={S.h3 + ' group-hover:text-[var(--pro-azure)] transition-colors'}>{r.name}</p>
            {r.businessType && <p className={S.muted}>{r.businessType}</p>}
          </div>
        </button>
      )},
      { key: 'email',       label: 'Email',        render: (r: any) => r.email ? <span className="flex items-center gap-1 text-[11px] text-[var(--pro-azure-dark)]"><Mail size={10}/>{r.email}</span> : <span className={S.muted}>—</span> },
      { key: 'phone',       label: 'Phone',        render: (r: any) => r.phone ? <span className="flex items-center gap-1 text-[11px] text-[var(--pro-azure-dark)]"><Phone size={10}/>{r.phone}</span> : <span className={S.muted}>—</span> },
      { key: 'tin',         label: 'TIN',          render: (r: any) => r.tin ? <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--pro-azure-dark)]"><Hash size={10}/>{r.tin}</span> : <span className={S.muted}>—</span> },
      { key: 'creditLimit', label: 'Credit Limit', align: 'right' as const, render: (r: any) => r.creditLimit ? <Amount value={r.creditLimit} size="sm"/> : <span className={S.muted}>—</span> },
      { key: 'kycStatus',   label: 'KYC',          render: (r: any) => <StatusBadge status={r.kycStatus ?? 'PENDING'}/> },
    ],
    vendors: [
      { key: 'name',         label: 'Vendor',       render: (r: any) => (
        <div className="flex items-center gap-2">
          <div className={S.iconAmber}><Building2 size={12}/></div>
          <div>
            <p className={S.h3}>{r.name}</p>
            {r.businessType && <p className={S.muted}>{r.businessType}</p>}
          </div>
        </div>
      )},
      { key: 'email',        label: 'Email',        render: (r: any) => r.email ? <span className="flex items-center gap-1 text-[11px] text-[var(--pro-azure-dark)]"><Mail size={10}/>{r.email}</span> : <span className={S.muted}>—</span> },
      { key: 'phone',        label: 'Phone',        render: (r: any) => r.phone ? <span className="flex items-center gap-1 text-[11px] text-[var(--pro-azure-dark)]"><Phone size={10}/>{r.phone}</span> : <span className={S.muted}>—</span> },
      { key: 'tin',          label: 'TIN',          render: (r: any) => r.tin ? <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--pro-azure-dark)]"><Hash size={10}/>{r.tin}</span> : <span className={S.muted}>—</span> },
      { key: 'whtApplicable',label: 'WHT',          render: (r: any) => r.whtApplicable ? <EthTaxBadge type="WHT" rate={3}/> : <span className={S.muted}>N/A</span> },
      { key: 'billCount',    label: 'Bills',        align: 'right' as const, render: (r: any) => <span className="font-bold text-[12px] text-[var(--pro-azure-dark)]">{r.billCount ?? 0}</span> },
      { key: 'isActive',     label: 'Status',       render: (r: any) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'}/> },
    ],
    'tax-types': [
      { key: 'name',        label: 'Tax Name',   render: (r: any) => (
        <div className="flex items-center gap-2">
          <div className={S.iconViolet}><ShieldCheck size={12}/></div>
          <div>
            <p className={S.h3}>{r.name}</p>
            {r.description && <p className={S.muted + ' truncate max-w-[200px]'}>{r.description}</p>}
          </div>
        </div>
      )},
      { key: 'type',        label: 'Type',       render: (r: any) => {
        const t = (r.type ?? 'VAT') as 'VAT' | 'WHT' | 'BIT' | 'PENSION' | 'DRRF';
        return <EthTaxBadge type={t} rate={r.rate ? +(r.rate * 100).toFixed(1) : undefined}/>;
      }},
      { key: 'rate',        label: 'Rate',       align: 'right' as const, render: (r: any) => (
        <span className="font-bold text-[13px] text-[var(--pro-azure-dark)] tabular-nums">{((r.rate ?? 0) * 100).toFixed(1)}%</span>
      )},
      { key: 'appliesTo',   label: 'Applies To', render: (r: any) => {
        const arr = Array.isArray(r.appliesTo) ? r.appliesTo : [];
        return arr.length ? (
          <div className="flex gap-1 flex-wrap">
            {arr.map((a: string) => <span key={a} className="px-1.5 py-0.5 bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] rounded text-[9px] font-bold border border-[var(--pro-azure-100)]">{a}</span>)}
          </div>
        ) : <span className={S.muted}>All</span>;
      }},
      { key: 'isActive',    label: 'Status',     render: (r: any) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'}/> },
    ],
    banks: [
      { key: 'name',          label: 'Account',      render: (r: any) => (
        <div className="flex items-center gap-2">
          <div className={S.iconRose}><Landmark size={12}/></div>
          <div>
            <p className={S.h3}>{r.name}</p>
            <p className={S.muted}>{r.bankName}</p>
          </div>
        </div>
      )},
      { key: 'accountNumber', label: 'Account No.',  render: (r: any) => <span className="font-mono text-[11px] text-[var(--pro-azure-dark)]">{r.accountNumber}</span> },
      { key: 'currencyCode',  label: 'Currency',     render: (r: any) => (
        <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-[10px] font-bold border border-sky-100">{r.currencyCode ?? 'ETB'}</span>
      )},
      { key: 'balance',       label: 'Balance',      align: 'right' as const, render: (r: any) => <Amount value={r.computedBalance ?? r.balance ?? 0} size="sm"/> },
      { key: 'unreconciledCount', label: 'Unreconciled', align: 'right' as const, render: (r: any) => {
        const n = r.unreconciledCount ?? 0;
        return n > 0
          ? <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">{n} pending</span>
          : <span className="flex items-center gap-1 text-[10px] text-[var(--pro-azure)] font-bold"><CheckCircle2 size={10}/>Reconciled</span>;
      }},
    ],
    companies: [
      { key: 'name',        label: 'Company',    render: (r: any) => (
        <div className="flex items-center gap-2">
          <div className={S.iconSlate}><Briefcase size={12}/></div>
          <div>
            <p className={S.h3}>{r.name}</p>
            {r.tin && <p className={S.muted + ' font-mono'}>TIN: {r.tin}</p>}
          </div>
        </div>
      )},
      { key: 'type',        label: 'Type',       render: (r: any) => <StatusBadge status={r.type ?? 'PLC'} label={r.type ?? 'PLC'}/> },
      { key: 'currencyCode',label: 'Currency',   render: (r: any) => (
        <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-[10px] font-bold border border-sky-100">{r.currencyCode ?? 'ETB'}</span>
      )},
      { key: 'website',     label: 'Website',    render: (r: any) => r.website ? <span className="flex items-center gap-1 text-[11px] text-sky-600"><Globe size={10}/>{r.website}</span> : <span className={S.muted}>—</span> },
      { key: 'environment', label: 'Env',        render: (r: any) => <StatusBadge status={r.environment ?? 'PRODUCTION'} label={r.environment ?? 'PROD'}/> },
    ],
  };

  return { cols: cols[tab], actions };
}

// -----------------------------------------------------------------------------
// FORM COMPONENTS — one per entity, shared FormField/Input/Select/Textarea
// -----------------------------------------------------------------------------
const ETHIOPIAN_BANKS = [
  'Commercial Bank of Ethiopia (CBE)', 'Awash Bank', 'Dashen Bank',
  'Abyssinia Bank', 'United Bank', 'Nib International Bank',
  'Cooperative Bank of Oromia', 'Berhan Bank', 'Bunna Bank',
  'Zemen Bank', 'Oromia International Bank', 'Addis International Bank',
  'Enat Bank', 'Amhara Bank', 'Tsedey Bank', 'Siinqee Bank',
];

const UNITS = ['UNIT', 'KG', 'LITRE', 'HOUR', 'DAY', 'MONTH', 'PIECE', 'BOX', 'METRE', 'QUINTAL'];

const ItemForm: React.FC<{ data: any; onChange: (d: any) => void }> = ({ data, onChange }) => {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  const vatPreview = data.salePrice && data.vatApplicable !== false
    ? calcVAT(parseFloat(String(data.salePrice)) || 0) : null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Item Name" required>
          <Input value={data.name ?? ''} onChange={e => set('', e)} placeholder="e.g. Consulting Service"/>
        </FormField>
        <FormField label="SKU / Code">
          <Input value={data.sku ?? data.code ?? ''} onChange={e => set('', e)} placeholder="ITEM-001"/>
        </FormField>
      </div>
      <div className="ovds-grid-layout cols-3 gap-sm">
        <FormField label="Type">
          <Select value={data.itemType ?? data.type ?? 'PRODUCT'} onChange={e => set('', e)}>
            <option value="PRODUCT">Product</option>
            <option value="SERVICE">Service</option>
          </Select>
        </FormField>
        <FormField label="Unit">
          <Select value={data.unit ?? 'UNIT'} onChange={e => set('', e)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </Select>
        </FormField>
        <FormField label="Category">
          <Input value={data.category ?? ''} onChange={e => set('', e)} placeholder="e.g. Electronics"/>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Sale Price (ETB)" required>
          <Input type="number" step="0.01" value={data.salePrice ?? ''} onChange={e => set('salePrice', parseFloat(e.target.value) || 0)} placeholder="0.00"/>
        </FormField>
        <FormField label="Cost Price (ETB)">
          <Input type="number" step="0.01" value={data.costPrice ?? ''} onChange={e => set('costPrice', parseFloat(e.target.value) || 0)} placeholder="0.00"/>
        </FormField>
      </div>
      {/* VAT toggle with live preview */}
      <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${data.vatApplicable !== false ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' : 'bg-white border-slate-200'}`}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.vatApplicable !== false} onChange={e => set('vatApplicable', e.target.checked)} className="accent-indigo-600 w-4 h-4"/>
          <span className="text-[12px] font-semibold text-[var(--pro-azure-dark)]">VAT Applicable — 15% (ERCA Proclamation 285/2002)</span>
        </label>
        {vatPreview && (
          <span className="text-[10px] font-bold text-[var(--pro-azure-dark)] tabular-nums">
            +{fmtETB(vatPreview.vatAmount)} → {fmtETB(vatPreview.grossAmount)}
          </span>
        )}
      </div>
      {(data.itemType ?? data.type) !== 'SERVICE' && (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Stock Quantity">
            <Input type="number" value={data.stock ?? data.stockQuantity ?? ''} onChange={e => set('stock', parseInt(e.target.value) || 0)} placeholder="0"/>
          </FormField>
          <FormField label="Reorder Level">
            <Input type="number" value={data.reorderLevel ?? ''} onChange={e => set('reorderLevel', parseInt(e.target.value) || 0)} placeholder="5"/>
          </FormField>
        </div>
      )}
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('', e)} rows={2} placeholder="Optional description"/>
      </FormField>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={data.isActive !== false} onChange={e => set('isActive', e.target.checked)} className="accent-indigo-600 w-4 h-4"/>
        <span className="text-[12px] font-semibold text-[var(--pro-azure-dark)]">Active item</span>
      </label>
    </div>
  );
};

const CustomerForm: React.FC<{ data: any; onChange: (d: any) => void }> = ({ data, onChange }) => {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Full Name" required>
          <Input value={data.name ?? ''} onChange={e => set('', e)} placeholder="Customer name"/>
        </FormField>
        <FormField label="Business Type">
          <Select value={data.businessType ?? 'INDIVIDUAL'} onChange={e => set('', e)}>
            <option value="INDIVIDUAL">Individual</option>
            <option value="SOLE_PROPRIETOR">Sole Proprietor</option>
            <option value="PLC">PLC</option>
            <option value="PARTNERSHIP">Partnership</option>
            <option value="NGO">NGO</option>
            <option value="GOVERNMENT">Government</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Email">
          <Input type="email" value={data.email ?? ''} onChange={e => set('', e)} placeholder="customer@example.com"/>
        </FormField>
        <FormField label="Phone">
          <Input value={data.phone ?? ''} onChange={e => set('', e)} placeholder="+251 9XX XXX XXX"/>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="TIN (Tax ID)" hint="Ethiopian Revenue Authority TIN">
          <Input value={data.tin ?? ''} onChange={e => set('', e)} placeholder="0000000000"/>
        </FormField>
        <FormField label="VAT Number">
          <Input value={data.vatNumber ?? ''} onChange={e => set('', e)} placeholder="VAT-XXXXXXXXXX"/>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Credit Limit (ETB)">
          <Input type="number" step="0.01" value={data.creditLimit ?? ''} onChange={e => set('creditLimit', parseFloat(e.target.value) || 0)} placeholder="0.00"/>
        </FormField>
        <FormField label="Payment Terms">
          <Select value={data.paymentTerms ?? 'NET_30'} onChange={e => set('', e)}>
            <option value="IMMEDIATE">Immediate</option>
            <option value="NET_7">Net 7</option>
            <option value="NET_15">Net 15</option>
            <option value="NET_30">Net 30</option>
            <option value="NET_60">Net 60</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="KYC Status">
          <Select value={data.kycStatus ?? 'PENDING'} onChange={e => set('', e)}>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </FormField>
        <FormField label="Risk Level">
          <Select value={data.riskLevel ?? 'LOW'} onChange={e => set('', e)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Address">
        <Textarea value={data.address ?? ''} onChange={e => set('', e)} rows={2} placeholder="Street, City, Region"/>
      </FormField>
      <FormField label="Notes">
        <Textarea value={data.notes ?? ''} onChange={e => set('', e)} rows={2} placeholder="Internal notes"/>
      </FormField>
    </div>
  );
};

const VendorForm: React.FC<{ data: any; onChange: (d: any) => void }> = ({ data, onChange }) => {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  const whtPreview = data.whtApplicable && data.whtType
    ? calcWHT(10000, data.whtType as WhtType) : null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Vendor Name" required>
          <Input value={data.name ?? ''} onChange={e => set('', e)} placeholder="Vendor / Supplier name"/>
        </FormField>
        <FormField label="Business Type">
          <Select value={data.businessType ?? 'PLC'} onChange={e => set('', e)}>
            <option value="INDIVIDUAL">Individual</option>
            <option value="SOLE_PROPRIETOR">Sole Proprietor</option>
            <option value="PLC">PLC</option>
            <option value="PARTNERSHIP">Partnership</option>
            <option value="NGO">NGO</option>
            <option value="GOVERNMENT">Government</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Email">
          <Input type="email" value={data.email ?? ''} onChange={e => set('', e)} placeholder="vendor@example.com"/>
        </FormField>
        <FormField label="Phone">
          <Input value={data.phone ?? ''} onChange={e => set('', e)} placeholder="+251 9XX XXX XXX"/>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="TIN (Tax ID)">
          <Input value={data.tin ?? ''} onChange={e => set('', e)} placeholder="0000000000"/>
        </FormField>
        <FormField label="Payment Terms">
          <Select value={data.paymentTerms ?? 'NET_30'} onChange={e => set('', e)}>
            <option value="IMMEDIATE">Immediate</option>
            <option value="NET_7">Net 7</option>
            <option value="NET_15">Net 15</option>
            <option value="NET_30">Net 30</option>
            <option value="NET_60">Net 60</option>
          </Select>
        </FormField>
      </div>
      {/* WHT section */}
      <div className={`p-3 rounded-xl border transition-all ${data.whtApplicable ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={!!data.whtApplicable} onChange={e => set('whtApplicable', e.target.checked)} className="accent-amber-600 w-4 h-4"/>
          <span className="text-[12px] font-semibold text-amber-800">Withholding Tax (WHT) Applicable — ERCA</span>
        </label>
        {data.whtApplicable && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <FormField label="WHT Type">
              <Select value={data.whtType ?? 'SERVICES'} onChange={e => set('', e)}>
                <option value="GOODS">Goods (2%)</option>
                <option value="SERVICES">Services Resident (2%)</option>
                <option value="SERVICES_NR">Services Non-Resident (15%)</option>
                <option value="RENT">Rent (30%)</option>
                <option value="DIVIDEND">Dividend (10%)</option>
                <option value="INTEREST">Interest (5%)</option>
              </Select>
            </FormField>
            {whtPreview && (
              <div className="flex flex-col justify-center">
                <p className="text-[10px] text-amber-700 font-semibold">On ETB 10,000 payment:</p>
                <p className="text-[12px] font-bold text-amber-800">WHT: {fmtETB(whtPreview.whtAmount)} → Net: {fmtETB(whtPreview.netPayable)}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <FormField label="Address">
        <Textarea value={data.address ?? ''} onChange={e => set('', e)} rows={2} placeholder="Street, City, Region"/>
      </FormField>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={data.isActive !== false} onChange={e => set('isActive', e.target.checked)} className="accent-indigo-600 w-4 h-4"/>
        <span className="text-[12px] font-semibold text-[var(--pro-azure-dark)]">Active vendor</span>
      </label>
    </div>
  );
};

const TaxTypeForm: React.FC<{ data: any; onChange: (d: any) => void }> = ({ data, onChange }) => {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  const PRESETS = [
    { label: 'VAT 15%',          type: 'VAT',        rate: 0.15, desc: 'Standard VAT — Proclamation No. 1341/2024' },
    { label: 'WHT Goods 3%',     type: 'WITHHOLDING', rate: 0.03, desc: 'WHT on goods payments ≥ ETB 20,000 — Proc. 1395/2025' },
    { label: 'WHT Services 3%',  type: 'WITHHOLDING', rate: 0.03, desc: 'WHT on service payments ≥ ETB 10,000 — Proc. 1395/2025' },
    { label: 'WHT Non-Res 15%',  type: 'WITHHOLDING', rate: 0.15, desc: 'WHT on non-resident service payments' },
    { label: 'BIT 30%',          type: 'CUSTOM',      rate: 0.30, desc: 'Business Income Tax — flat rate for companies' },
    { label: 'Pension Emp 7%',   type: 'CUSTOM',      rate: 0.07, desc: 'Employee pension contribution' },
    { label: 'Pension Empr 11%', type: 'CUSTOM',      rate: 0.11, desc: 'Employer pension contribution' },
    { label: 'DRRF 1%',          type: 'CUSTOM',      rate: 0.01, desc: 'Disaster Risk & Resilience Fund' },
  ];
  return (
    <div className="space-y-3">
      {/* Quick presets */}
      <div>
        <p className="text-[10px] font-bold text-[var(--pro-azure-dark)] uppercase tracking-wider mb-2">Ethiopian Tax Presets (ERCA)</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map(p => (
            <button key={p.label} type="button"
              onClick={() => onChange({ ...data, name: p.label, type: p.type, rate: p.rate, description: p.desc })}
              className="text-left px-2.5 py-2 rounded-lg border border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)]/50 hover:bg-[var(--pro-azure-100)] hover:border-[var(--pro-azure)]/40 transition-all">
              <p className="text-[11px] font-bold text-[var(--pro-azure-dark)]">{p.label}</p>
              <p className="text-[9px] text-[var(--pro-azure)]/70 truncate">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="h-px bg-[var(--pro-azure-100)]"/>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tax Name" required>
          <Input value={data.name ?? ''} onChange={e => set('', e)} placeholder="e.g. VAT Standard Rate"/>
        </FormField>
        <FormField label="Type">
          <Select value={data.type ?? 'VAT'} onChange={e => set('', e)}>
            <option value="VAT">VAT</option>
            <option value="WITHHOLDING">Withholding Tax</option>
            <option value="SALES_TAX">Sales Tax</option>
            <option value="CUSTOM">Custom</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Rate (decimal)" required hint="e.g. 0.15 for 15%">
        <Input type="number" step="0.001" min="0" max="1" value={data.rate ?? ''} onChange={e => set('rate', parseFloat(e.target.value) || 0)} placeholder="0.15"/>
      </FormField>
      {data.rate > 0 && (
        <div className="flex items-center gap-2 p-2 bg-[var(--pro-azure-50)] rounded-lg border border-[var(--pro-azure-100)]">
          <CheckCircle2 size={12} className="text-[var(--pro-azure)]"/>
          <span className="text-[11px] text-[var(--pro-azure-dark)] font-semibold">
            Rate: {(data.rate * 100).toFixed(2)}% — On ETB 1,000: tax = {fmtETB(data.rate * 1000)}
          </span>
        </div>
      )}
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('', e)} rows={2} placeholder="ERCA regulation reference"/>
      </FormField>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={data.isActive !== false} onChange={e => set('isActive', e.target.checked)} className="accent-indigo-600 w-4 h-4"/>
        <span className="text-[12px] font-semibold text-[var(--pro-azure-dark)]">Active tax rate</span>
      </label>
    </div>
  );
};

const BankForm: React.FC<{ data: any; onChange: (d: any) => void }> = ({ data, onChange }) => {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Account Name" required>
          <Input value={data.name ?? ''} onChange={e => set('', e)} placeholder="e.g. Main Operating Account"/>
        </FormField>
        <FormField label="Bank Name" required>
          <Select value={data.bankName ?? ''} onChange={e => set('', e)}>
            <option value="">Select bank…</option>
            {ETHIOPIAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Account Number" required>
          <Input value={data.accountNumber ?? ''} onChange={e => set('', e)} placeholder="1000XXXXXXXXXX"/>
        </FormField>
        <FormField label="Currency">
          <Select value={data.currencyCode ?? 'ETB'} onChange={e => set('', e)}>
            <option value="ETB">ETB — Ethiopian Birr</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Opening Balance (ETB)">
        <Input type="number" step="0.01" value={data.openingBalance ?? ''} onChange={e => set('openingBalance', parseFloat(e.target.value) || 0)} placeholder="0.00"/>
      </FormField>
    </div>
  );
};

const CompanyForm: React.FC<{ data: any; onChange: (d: any) => void }> = ({ data, onChange }) => {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Company Name" required>
          <Input value={data.name ?? ''} onChange={e => set('', e)} placeholder="Company name"/>
        </FormField>
        <FormField label="Type">
          <Select value={data.type ?? 'PLC'} onChange={e => set('', e)}>
            <option value="PLC">PLC</option>
            <option value="SOLE_PROPRIETOR">Sole Proprietor</option>
            <option value="PARTNERSHIP">Partnership</option>
            <option value="NGO">NGO</option>
            <option value="GOVERNMENT">Government</option>
            <option value="LARGE_ENTERPRISE">Large Enterprise</option>
            <option value="MANUFACTURING">Manufacturing</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="TIN (Tax ID)" hint="Ethiopian Revenue Authority TIN">
          <Input value={data.tin ?? ''} onChange={e => set('', e)} placeholder="0000000000"/>
        </FormField>
        <FormField label="Currency">
          <Select value={data.currencyCode ?? 'ETB'} onChange={e => set('', e)}>
            <option value="ETB">ETB — Ethiopian Birr</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Phone">
          <Input value={data.phone ?? ''} onChange={e => set('', e)} placeholder="+251 11 XXX XXXX"/>
        </FormField>
        <FormField label="Email">
          <Input type="email" value={data.email ?? ''} onChange={e => set('', e)} placeholder="info@company.com"/>
        </FormField>
      </div>
      <FormField label="Website">
        <Input value={data.website ?? ''} onChange={e => set('', e)} placeholder="https://company.com"/>
      </FormField>
      <FormField label="Address">
        <Textarea value={data.address ?? ''} onChange={e => set('', e)} rows={2} placeholder="Street, City, Region, Ethiopia"/>
      </FormField>
    </div>
  );
};

const FORM_MAP: Record<TabKey, React.FC<{ data: any; onChange: (d: any) => void }>> = {
  items:       ItemForm,
  customers:   CustomerForm,
  vendors:     VendorForm,
  'tax-types': TaxTypeForm,
  banks:       BankForm,
  companies:   CompanyForm,
};

// -----------------------------------------------------------------------------
// KPI BUILDER — derives metrics from rows, per tab
// -----------------------------------------------------------------------------
function buildKpis(tab: TabKey, rows: any[], tabCfg: TabConfig) {
  const count  = rows.length;
  const active = rows.filter(r => r.isActive !== false).length;

  const base = [
    { label: 'Total',    value: count,  icon: tabCfg.icon, color: tabCfg.color as any },
    { label: 'Active',   value: active, color: 'green' as const },
    { label: 'Inactive', value: count - active, color: 'rose' as const },
  ];

  if (tab === 'items') {
    const products = rows.filter(r => (r.itemType ?? r.type) !== 'SERVICE').length;
    const services = rows.filter(r => (r.itemType ?? r.type) === 'SERVICE').length;
    const vatItems = rows.filter(r => r.vatApplicable !== false).length;
    const lowStock = rows.filter(r => (r.itemType ?? r.type) !== 'SERVICE' && (r.stock ?? r.stockQuantity ?? 0) <= (r.reorderLevel ?? 5)).length;
    return [
      { label: 'Total Items', value: count,    color: 'green' as const },
      { label: 'Products',    value: products, color: 'sky' as const },
      { label: 'Services',    value: services, color: 'violet' as const },
      { label: 'VAT Items',   value: vatItems, color: 'amber' as const },
      { label: 'Low Stock',   value: lowStock, color: 'rose' as const },
    ];
  }
  if (tab === 'customers') {
    const withTin  = rows.filter(r => r.tin).length;
    const verified = rows.filter(r => r.kycStatus === 'VERIFIED').length;
    const highRisk = rows.filter(r => r.riskLevel === 'HIGH').length;
    return [
      ...base,
      { label: 'With TIN',  value: withTin,  color: 'violet' as const },
      { label: 'KYC Done',  value: verified, color: 'sky' as const },
      { label: 'High Risk', value: highRisk, color: 'rose' as const },
    ];
  }
  if (tab === 'vendors') {
    const whtVendors = rows.filter(r => r.whtApplicable).length;
    const totalBilled = rows.reduce((s, r) => s + (r.totalBilled ?? 0), 0);
    return [
      ...base,
      { label: 'WHT Applicable', value: whtVendors, color: 'amber' as const },
      { label: 'Total Billed',   value: fmtETB(totalBilled), color: 'sky' as const },
    ];
  }
  if (tab === 'banks') {
    const totalBal = rows.reduce((s, r) => s + parseFloat(String(r.computedBalance ?? r.balance ?? 0)), 0);
    const unreconciled = rows.reduce((s, r) => s + (r.unreconciledCount ?? 0), 0);
    return [
      { label: 'Accounts',     value: count,              color: 'green' as const },
      { label: 'Total Balance',value: fmtETB(totalBal),   color: 'sky' as const },
      { label: 'Unreconciled', value: unreconciled,       color: unreconciled > 0 ? 'amber' as const : 'indigo' as const },
    ];
  }
  if (tab === 'tax-types') {
    const vatRates = rows.filter(r => r.type === 'VAT').length;
    const whtRates = rows.filter(r => r.type === 'WITHHOLDING').length;
    return [
      { label: 'Total Rates', value: count,    color: 'green' as const },
      { label: 'Active',      value: active,   color: 'green' as const },
      { label: 'VAT Rates',   value: vatRates, color: 'violet' as const },
      { label: 'WHT Rates',   value: whtRates, color: 'amber' as const },
    ];
  }
  return base;
}

// -----------------------------------------------------------------------------
// PIPELINE STAGES — per tab, drives the visual pipeline bar
// -----------------------------------------------------------------------------
function buildPipeline(tab: TabKey, rows: any[]) {
  if (tab === 'customers') return [
    { key: 'lead',    label: 'Leads',    count: rows.filter(r => r.kycStatus === 'PENDING').length,  color: 'bg-slate-400',   icon: <AlertCircle size={12}/> },
    { key: 'kyc',     label: 'KYC Done', count: rows.filter(r => r.kycStatus === 'VERIFIED').length, color: 'bg-sky-500',     icon: <CheckCircle2 size={12}/> },
    { key: 'active',  label: 'Active',   count: rows.filter(r => r.isActive !== false).length,       color: 'bg-[var(--pro-azure-50)]0', icon: <TrendingUp size={12}/> },
    { key: 'onhold',  label: 'On Hold',  count: rows.filter(r => r.riskLevel === 'HIGH').length,     color: 'bg-amber-500',   icon: <AlertCircle size={12}/> },
  ];
  if (tab === 'vendors') return [
    { key: 'all',    label: 'All',     count: rows.length,                                          color: 'bg-slate-400',   icon: <Building2 size={12}/> },
    { key: 'wht',    label: 'WHT',     count: rows.filter(r => r.whtApplicable).length,             color: 'bg-amber-500',   icon: <ShieldCheck size={12}/> },
    { key: 'active', label: 'Active',  count: rows.filter(r => r.isActive !== false).length,        color: 'bg-[var(--pro-azure-50)]0', icon: <CheckCircle2 size={12}/> },
  ];
  if (tab === 'items') return [
    { key: 'all',      label: 'All',       count: rows.length,                                                                                                    color: 'bg-slate-400',   icon: <Package size={12}/> },
    { key: 'products', label: 'Products',  count: rows.filter(r => (r.itemType ?? r.type) !== 'SERVICE').length,                                                  color: 'bg-[var(--pro-azure-50)]0', icon: <Package size={12}/> },
    { key: 'services', label: 'Services',  count: rows.filter(r => (r.itemType ?? r.type) === 'SERVICE').length,                                                  color: 'bg-sky-500',     icon: <Zap size={12}/> },
    { key: 'lowstock', label: 'Low Stock', count: rows.filter(r => (r.itemType ?? r.type) !== 'SERVICE' && (r.stock ?? 0) <= (r.reorderLevel ?? 5)).length,       color: 'bg-rose-500',    icon: <AlertCircle size={12}/> },
  ];
  if (tab === 'banks') return [
    { key: 'all',    label: 'All Accounts', count: rows.length,                                                                                                   color: 'bg-slate-400',   icon: <Landmark size={12}/> },
    { key: 'etb',    label: 'ETB',          count: rows.filter(r => (r.currencyCode ?? 'ETB') === 'ETB').length,                                                  color: 'bg-[var(--pro-azure-50)]0', icon: <FileText size={12}/> },
    { key: 'fx',     label: 'Foreign',      count: rows.filter(r => r.currencyCode && r.currencyCode !== 'ETB').length,                                           color: 'bg-sky-500',     icon: <Globe size={12}/> },
    { key: 'recon',  label: 'Reconciled',   count: rows.filter(r => (r.unreconciledCount ?? 0) === 0).length,                                                    color: 'bg-[var(--pro-azure-50)]0', icon: <CheckCircle2 size={12}/> },
  ];
  return [];
}

// -----------------------------------------------------------------------------
// IFRS COMPLIANCE BANNER — shown contextually per tab
// -----------------------------------------------------------------------------
const IFRSBanner: React.FC<{ tab: TabKey }> = ({ tab }) => {
  const messages: Partial<Record<TabKey, { icon: React.ReactNode; text: string; ref: string }>> = {
    items:      { icon: <BarChart3 size={12}/>, text: 'Inventory measured at lower of cost and NRV per IAS 2. VAT 15% per ERCA Proclamation 285/2002.', ref: 'IAS 2 · ERCA' },
    customers:  { icon: <FileText size={12}/>,  text: 'Revenue recognised when performance obligations satisfied per IFRS 15. KYC required for credit customers.', ref: 'IFRS 15 · NBE' },
    vendors:    { icon: <ShieldCheck size={12}/>,text: 'WHT deducted at source per ERCA Proclamation 286/2002. Payables measured at amortised cost per IFRS 9.', ref: 'IFRS 9 · ERCA' },
    'tax-types':{ icon: <ShieldCheck size={12}/>,text: 'Tax rates per Ethiopian Revenue & Customs Authority (ERCA). VAT 15%, WHT 2–30%, BIT 30%, Pension 7%/11%, DRRF 1%.', ref: 'ERCA 2024' },
    banks:      { icon: <Landmark size={12}/>,  text: 'Bank accounts reconciled monthly per IAS 7. Foreign currency balances translated at closing rate per IAS 21.', ref: 'IAS 7 · IAS 21' },
    companies:  { icon: <Briefcase size={12}/>, text: 'Financial statements prepared under IFRS for SMEs (Tier 2) or full IFRS (Tier 1) per NBE Directive.', ref: 'IFRS · NBE' },
  };
  const m = messages[tab];
  if (!m) return null;
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-xl mb-3">
      <div className="w-6 h-6 rounded-lg bg-[var(--pro-azure-100)] text-[var(--pro-azure)] flex items-center justify-center shrink-0 mt-0.5">{m.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[var(--pro-azure-dark)] leading-relaxed">{m.text}</p>
      </div>
      <span className="text-[9px] font-bold text-[var(--pro-azure)] bg-[var(--pro-azure-100)] px-1.5 py-0.5 rounded shrink-0">{m.ref}</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------
const MasterData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('items');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState<{ open: boolean; mode: 'create' | 'edit'; data: any }>({
    open: false, mode: 'create', data: {},
  });

  const qc  = useQueryClient();
  const tab = TABS.find(t => t.key === activeTab)!;

  // -- Data fetch --------------------------------------------------------------
  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['master-data', activeTab, page],
    queryFn: () => api.get(`${tab.endpoint}?page=${page}&limit=25`).then((r: any) => r.data),
    staleTime: 30_000,
  });

  // Normalise response shape — handles plain array, { data }, { items }, { rows }
  const rawRows = Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? raw?.rows ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows: any[] = Array.isArray(rawRows) ? rawRows : [];
  const total: number = raw?.total ?? rows.length;

  // -- Filtered rows -----------------------------------------------------------
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q)));
  }, [rows, search]);

  // -- Mutations ---------------------------------------------------------------
  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      modal.mode === 'create'
        ? api.post(tab.endpoint, payload)
        : api.patch(`${tab.endpoint}/${payload.id}`, payload),
    onSuccess: () => {
      toast.success(modal.mode === 'create' ? 'Created successfully' : 'Updated successfully');
      qc.invalidateQueries({ queryKey: ['master-data', activeTab] });
      setModal(m => ({ ...m, open: false }));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${tab.endpoint}/${id}`),
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['master-data', activeTab] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Delete failed'),
  });

  // -- Handlers ----------------------------------------------------------------
  const handleEdit   = useCallback((row: any) => setModal({ open: true, mode: 'edit', data: { ...row } }), []);
  const handleDelete = useCallback(async (row: any) => {
    const ok = await confirm({ title: `Delete "${row.name}"?`, message: 'This cannot be undone.', variant: 'danger', confirmLabel: 'Delete' });
    if (ok) deleteMutation.mutate(row.id);
  }, [deleteMutation]);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as TabKey);
    setSearch('');
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    if (!filtered.length) return toast.error('No data to export');
    const headers = Object.keys(filtered[0]).filter(k => !['id', 'companyId', 'createdAt', 'updatedAt'].includes(k));
    const csv = [
      headers.join(','),
      ...filtered.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success(`Exported ${filtered.length} ${tab.label.toLowerCase()}`);
  }, [filtered, activeTab, tab.label]);

  // -- Derived data ------------------------------------------------------------
  const { cols, actions } = useTabCols(activeTab, handleEdit, handleDelete);
  const kpis     = useMemo(() => buildKpis(activeTab, rows, tab), [activeTab, rows, tab]);
  const pipeline = useMemo(() => buildPipeline(activeTab, rows), [activeTab, rows]);
  const FormComponent = FORM_MAP[activeTab];

  return (
    <AppPage
      title="Master Data"
      subtitle="Items · Customers · Vendors · Tax Types · Banks · Companies · ERP · CRM · Market Segmentation · Banking & ovds · Manufacturing & Logistics · Healthcare & Pharmaceuticals"
      icon={<Briefcase size={16}/>}
      crumbs={[{ label: 'Master Data' }, { label: tab.label }]}
      tabs={
        <AppTabs
          tabs={TABS.map(t => ({ key: t.key, label: t.label, count: activeTab === t.key ? filtered.length : undefined }))}
          active={activeTab}
          onChange={handleTabChange}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11}/>} onClick={() => refetch()}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11}/>} onClick={handleExport}>Export</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={12}/>} onClick={() => setModal({ open: true, mode: 'create', data: {} })}>
            Add {tab.label.slice(0, -1)}
          </Btn>
        </div>
      }
    >
      {/* IFRS compliance notice */}
      <IFRSBanner tab={activeTab}/>

      {/* KPI strip */}
      <AppKpi cells={kpis.map((k: any) => ({ label: k.label, value: k.value, color: k.color, icon: k.icon ?? undefined }))} />

      {/* Pipeline bar — customers, vendors, items, banks */}
      {pipeline.length > 0 && (
        <PipelineBar stages={pipeline}/>
      )}

      {/* Tab identity row */}
      <div className="flex items-center gap-3 mb-3">
        {tab.icon}
        <div>
          <p className={S.h2}>{tab.label}</p>
          <p className={S.muted}>{tab.description}</p>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: `Search ${tab.label.toLowerCase()}…` }}
        count={filtered.length}
        countLabel={tab.label.toLowerCase()}
        actions={
          <div className="flex items-center gap-1.5">
            <Btn variant="ghost" size="sm" icon={<Upload size={11}/>}>Import</Btn>
          </div>
        }
      />

      {/* Data table */}
      <AppTable loading={isLoading}>
        <thead><tr>
          {cols.map((c: any) => <AppTh key={c.key} align={c.align}>{c.label}</AppTh>)}
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={cols.length + 1}>
                <EmptyState
                  icon={tab.icon}
                  title={`No ${tab.label.toLowerCase()} yet`}
                  desc={`Add your first ${tab.label.slice(0, -1).toLowerCase()} to get started`}
                  action={{ label: `Add ${tab.label.slice(0, -1)}`, onClick: () => setModal({ open: true, mode: 'create', data: {} }) }}
                />
              </td>
            </tr>
          ) : filtered.map((r: any) => (
            <AppTr key={r.id}>
              {cols.map((c: any) => (
                <AppTd key={c.key} align={c.align}>
                  {c.render ? c.render(r) : r[c.key]}
                </AppTd>
              ))}
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {actions(r)}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3">
        <Pagination page={page} total={total} pageSize={25} onChange={setPage}/>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={`${modal.mode === 'create' ? 'Add' : 'Edit'} ${tab.label.slice(0, -1)}`}
        subtitle={tab.description}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn>
            <Btn
              variant="primary"
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(modal.data)}
            >
              {modal.mode === 'create' ? 'Create' : 'Save Changes'}
            </Btn>
          </>
        }
      >
        <FormComponent data={modal.data} onChange={(d: any) => setModal(m => ({ ...m, data: d }))}/>
      </Modal>
    </AppPage>
  );
};

export default MasterData;


