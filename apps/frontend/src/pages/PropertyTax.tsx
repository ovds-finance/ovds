/**
 * Property Tax — Ethiopia
 * Proclamation No. 1161/2019 · Regional Revenue Bureaus + ERCA oversight
 */
import {
  calculatePropertyTax,
  URBAN_LAND_RATE_ETB_PER_SQM,
  BUILDING_TAX_RATE,
  RENTAL_INCOME_TAX_RATE,
  type PropertyTaxType,
  type PropertyUseType,
  type ValuationMethod,
  type PropertyTaxStatus,
} from '@ovds/ui';
import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Select, Icon, StatusBadge, Amount,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useInterval } from '../hooks';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import {
  usePropertyTaxDashboard,
  usePropertyRecords,
  usePropertyAssessments,
} from '../services/newTaxApi';

// -- Types ---------------------------------------------------------------------
interface _PropertyRecord {
  id: string;
  propertyCode: string;
  description: string;
  address: string;
  city: string;
  propertyType: PropertyTaxType;
  useType: PropertyUseType;
  landAreaSqm: number;
  buildingAreaSqm?: number;
  assessedValue: number;
  annualTaxPayable: number;
  isExempt: boolean;
  status?: PropertyTaxStatus;
  titleDeedNumber?: string;
  lastValuationDate?: string;
  notes?: string;
  createdAt: string;
}

interface _Assessment {
  id: string;
  propertyId: string;
  period: string;
  assessedValue: number;
  annualTaxDue: number;
  penaltyAmount: number;
  totalPayable: number;
  status: PropertyTaxStatus;
  dueDate: string;
  paidAt?: string;
  municipality: string;
  createdAt: string;
}

const _today = new Date().toISOString().slice(0, 10);
const currentYear = new Date().getFullYear().toString();

const PROPERTY_TYPES: { value: PropertyTaxType; label: string }[] = [
  { value: 'URBAN_LAND',       label: 'Urban Land (Use Fee)' },
  { value: 'BUILDING',         label: 'Building / House Tax' },
  { value: 'RENTAL_INCOME',    label: 'Rental Income Tax' },
  { value: 'AGRICULTURAL_LAND',label: 'Agricultural Land' },
];

const USE_TYPES: { value: PropertyUseType; label: string }[] = [
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL',  label: 'Commercial' },
  { value: 'INDUSTRIAL',  label: 'Industrial' },
  { value: 'MIXED_USE',   label: 'Mixed Use' },
  { value: 'AGRICULTURAL',label: 'Agricultural' },
];

const MUNICIPALITY_OPTIONS = Object.keys(URBAN_LAND_RATE_ETB_PER_SQM).map(k => ({
  value: k,
  label: k.replace(/_/g, ' ').replace(/(\d+)/g, ' $1'),
}));

const STATUS_COLORS: Record<string, string> = {
  DRAFT:    'bg-slate-100 text-slate-600',
  ASSESSED: 'bg-sky-50 text-sky-700',
  NOTIFIED: 'bg-amber-50 text-amber-700',
  PAID:     'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  OVERDUE:  'bg-rose-50 text-rose-700',
  DISPUTED: 'bg-violet-50 text-violet-700',
  EXEMPT:   'bg-white text-slate-400',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtK = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : fmt(n);

// -- Calculator Panel ----------------------------------------------------------
const PropertyTaxCalculator: React.FC = () => {
  const [pType, setPType]   = useState<PropertyTaxType>('URBAN_LAND');
  const [assessedValue, setAssessedValue] = useState('');
  const [landArea, setLandArea]           = useState('');
  const [municipality, setMunicipality]   = useState<keyof typeof URBAN_LAND_RATE_ETB_PER_SQM>('ADDIS_ABABA_GRADE_3');
  const [rentalIncome, setRentalIncome]   = useState('');
  const [expenses, setExpenses]           = useState('');
  const [daysOverdue, setDaysOverdue]     = useState('0');

  const result = calculatePropertyTax({
    propertyType: pType,
    useType: 'COMMERCIAL',
    assessedValue:       parseFloat(assessedValue) || 0,
    landAreaSqm:         parseFloat(landArea) || 0,
    municipality,
    annualRentalIncome:  parseFloat(rentalIncome) || 0,
    allowableExpenses:   parseFloat(expenses) || 0,
    daysOverdue:         parseInt(daysOverdue) || 0,
  });

  return (
    <div className="space-y-5">
      <div className="ovds-grid-layout cols-3 gap-sm">
        {PROPERTY_TYPES.map(pt => (
          <button
            key={pt.value}
            onClick={() => setPType(pt.value)}
            className={`p-3 rounded-xl border text-xs font-semibold transition-colors text-left ${
              pType === pt.value
                ? 'bg-[var(--pro-azure)] text-white border-[var(--pro-azure)]'
                : 'bg-white border-slate-200 text-slate-600 hover:border-[var(--pro-azure-light)]'
            }`}
          >
            {pt.label}
          </button>
        ))}
      </div>

      <div className="ovds-grid-layout cols-2">
        {pType === 'URBAN_LAND' && (
          <>
            <FormField label="Land Area (m²)">
              <Input type="number" min="0" value={landArea} onChange={e => setLandArea(e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Municipality Grade">
              <Select value={municipality} onChange={e => setMunicipality(e as any)}>
                {MUNICIPALITY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </FormField>
          </>
        )}
        {(pType === 'BUILDING' || pType === 'AGRICULTURAL_LAND') && (
          <FormField label="Assessed Value (ETB)">
            <Input type="number" min="0" value={assessedValue} onChange={e => setAssessedValue(e.target.value)} placeholder="0.00" />
          </FormField>
        )}
        {pType === 'RENTAL_INCOME' && (
          <>
            <FormField label="Annual Gross Rental Income (ETB)">
              <Input type="number" min="0" value={rentalIncome} onChange={e => setRentalIncome(e.target.value)} placeholder="0.00" />
            </FormField>
            <FormField label="Allowable Expenses (ETB)">
              <Input type="number" min="0" value={expenses} onChange={e => setExpenses(e.target.value)} placeholder="0.00" />
            </FormField>
          </>
        )}
        <FormField label="Days Overdue (for penalty)">
          <Input type="number" min="0" value={daysOverdue} onChange={e => setDaysOverdue(e.target.value)} placeholder="0" />
        </FormField>
      </div>

      {result.annualTaxDue > 0 && (
        <div className="space-y-3">
          <div className="ovds-grid-layout cols-3">
            {[
              { label: 'Annual Tax Due',   value: result.annualTaxDue,   color: 'text-[var(--pro-azure-dark)]' },
              { label: 'Penalty',          value: result.penaltyAmount,  color: 'text-rose-600' },
              { label: 'Total Payable',    value: result.totalPayable,   color: 'text-slate-800' },
            ].map(c => (
              <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                <p className={`text-xl font-bold tabular-nums ${c.color}`}>ETB {fmt(c.value)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {result.notes.map((n, i) => (
              <p key={i} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--pro-azure-light)] shrink-0" />
                {n}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Reference rates */}
      <div className="ovds-widget-card p-5">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Ethiopian Property Tax Reference Rates</p>
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-600 bg-white rounded-lg px-3 py-2">
            Urban Land Use Fee — Addis Ababa Grade 1: ETB {URBAN_LAND_RATE_ETB_PER_SQM.ADDIS_ABABA_GRADE_1}/m² · Grade 3: ETB {URBAN_LAND_RATE_ETB_PER_SQM.ADDIS_ABABA_GRADE_3}/m²
          </div>
          <div className="text-[11px] font-semibold text-slate-600 bg-white rounded-lg px-3 py-2">
            Building / House Tax: {(BUILDING_TAX_RATE * 100).toFixed(0)}% of assessed value annually (IAS 16 cost model)
          </div>
          <div className="text-[11px] font-semibold text-slate-600 bg-white rounded-lg px-3 py-2">
            Rental Income Tax: {(RENTAL_INCOME_TAX_RATE * 100).toFixed(0)}% of net rental income (gross − allowable expenses)
          </div>
          <div className="text-[11px] font-semibold text-slate-600 bg-white rounded-lg px-3 py-2">
            Late payment penalty: 5% per annum on overdue tax · Disputes: within 30 days of assessment notice
          </div>
        </div>
      </div>
    </div>
  );
};

// -- Add Property Modal --------------------------------------------------------
function AddPropertyModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    propertyCode: '', description: '', address: '', city: 'Addis Ababa',
    propertyType: 'URBAN_LAND' as PropertyTaxType, useType: 'COMMERCIAL' as PropertyUseType,
    landAreaSqm: '', buildingAreaSqm: '', assessedValue: '', annualTaxPayable: '',
    titleDeedNumber: '', isExempt: false, notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propertyCode || !form.description || !form.address) {
      toast.error('Fill required fields'); return;
    }
    setSaving(true);
    try {
      await api.post('/ovds/property-tax/properties', {
        ...form,
        landAreaSqm: parseFloat(form.landAreaSqm) || 0,
        buildingAreaSqm: form.buildingAreaSqm ? parseFloat(form.buildingAreaSqm) : undefined,
        assessedValue: parseFloat(form.assessedValue) || 0,
        annualTaxPayable: parseFloat(form.annualTaxPayable) || 0,
      });
      toast.success('Property registered'); onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title="Register Property" onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={save}>Register</Btn></>}
    >
      <form onSubmit={save} className="space-y-4">
        <div className="ovds-grid-layout cols-2">
          <FormField label="Property Code" required>
            <Input value={form.propertyCode} onChange={e => set('propertyCode', e.target.value)} placeholder="PROP-001" />
          </FormField>
          <FormField label="Title Deed No.">
            <Input value={form.titleDeedNumber} onChange={e => set('titleDeedNumber', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Description" required>
          <Input value={form.description} onChange={e => set('description', e.target.value)} />
        </FormField>
        <div className="ovds-grid-layout cols-2">
          <FormField label="Address" required>
            <Input value={form.address} onChange={e => set('address', e.target.value)} />
          </FormField>
          <FormField label="City">
            <Input value={form.city} onChange={e => set('city', e.target.value)} />
          </FormField>
        </div>
        <div className="ovds-grid-layout cols-2">
          <FormField label="Property Type">
            <Select value={form.propertyType} onChange={e => set('propertyType', e)}>
              {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Use Type">
            <Select value={form.useType} onChange={e => set('useType', e)}>
              {USE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="ovds-grid-layout cols-2">
          <FormField label="Land Area (m²)">
            <Input type="number" min="0" value={form.landAreaSqm} onChange={e => set('landAreaSqm', e.target.value)} />
          </FormField>
          <FormField label="Building Area (m²)">
            <Input type="number" min="0" value={form.buildingAreaSqm} onChange={e => set('buildingAreaSqm', e.target.value)} />
          </FormField>
        </div>
        <div className="ovds-grid-layout cols-2">
          <FormField label="Assessed Value (ETB)">
            <Input type="number" min="0" step="0.01" value={form.assessedValue} onChange={e => set('assessedValue', e.target.value)} />
          </FormField>
          <FormField label="Annual Tax Payable (ETB)">
            <Input type="number" min="0" step="0.01" value={form.annualTaxPayable} onChange={e => set('annualTaxPayable', e.target.value)} />
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={form.isExempt} onChange={e => set('isExempt', e.target.checked)} className="rounded accent-indigo-500" />
          Property is exempt from tax
        </label>
        <FormField label="Notes">
          <Input value={form.notes} onChange={e => set('notes', e.target.value)} />
        </FormField>
      </form>
    </Modal>
  );
}

// -- Main Page -----------------------------------------------------------------
const PropertyTax: React.FC = () => {
  usePageTitle('Property Tax');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const canWrite = can('vat:write');
  const canFile  = can('vat:file');

  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'assessments' | 'payments' | 'calculator' | 'guide'>('overview');
  const [showAdd, setShowAdd]     = useState(false);
  const [search, setSearch]       = useState('');

  const { data: dashboard, loading: dashLoading, refetch: refetchDash } = usePropertyTaxDashboard(selectedCompanyId ?? undefined);
  const { properties, loading: propLoading, refetch: refetchProps }     = usePropertyRecords(selectedCompanyId ?? undefined);
  const { assessments, loading: assessLoading, refetch: refetchAssess } = usePropertyAssessments(selectedCompanyId ?? undefined);

  const loading  = dashLoading || propLoading || assessLoading;
  const fetchAll = useCallback(() => { refetchDash(); refetchProps(); refetchAssess(); }, [refetchDash, refetchProps, refetchAssess]);
  useInterval(fetchAll, 120_000);

  const filtered = (properties ?? []).filter((p: any) =>
    !search || p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.propertyCode?.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { key: 'overview',     label: 'Overview' },
    { key: 'properties',   label: `Properties (${(properties ?? []).length})` },
    { key: 'assessments',  label: `Assessments (${(assessments ?? []).length})` },
    { key: 'payments',     label: 'Payments' },
    { key: 'calculator',   label: 'Calculator' },
    { key: 'guide',        label: 'Tax Guide' },
  ] as const;

  const totalDue       = dashboard?.totalAnnualTaxDue ?? properties.reduce((s, p) => s + p.annualTaxPayable, 0);
  const totalPaid      = dashboard?.totalPaid ?? 0;
  const totalOutstanding = dashboard?.totalOutstanding ?? totalDue - totalPaid;
  const totalOverdue   = dashboard?.totalOverdue ?? 0;

  return (
    <AppPage
      title="Property Tax"
      subtitle="Urban land use fee · Building tax · Rental income tax — Proclamation No. 1161/2019 · Banking & ovds · Investment Trends · Market Value · Market Size"
      icon={<Icon name="COMPANY" size={18} />}
      crumbs={[{ label: 'Tax & Compliance', to: '/tax/dashboard' }, { label: 'Property Tax' }]}
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<Icon name="REFRESH" size={12} className={loading ? 'animate-spin' : ''} />} onClick={fetchAll}>Refresh</Btn>
          {canWrite && (
            <Btn variant="primary" size="sm" icon={<Icon name="PLUS" size={12} />} onClick={() => setShowAdd(true)}>
              Register Property
            </Btn>
          )}
        </>
      }
      tabs={
        <AppTabs tabs={TABS.map(t => ({ key: t.key, label: t.label }))} active={activeTab} onChange={k => setActiveTab(k as any)} />
      }
    >
      {/* KPI strip */}
      <AppKpi cells={[
        { label: 'Total Properties',  value: String(properties.length),      icon: <Icon name="COMPANY" size={14} />, color: 'green' },
        { label: 'Annual Tax Due',    value: `ETB ${fmtK(totalDue)}`,        icon: <Icon name="MONEY" size={14} />,   color: 'violet' },
        { label: 'Paid',              value: `ETB ${fmtK(totalPaid)}`,        icon: <Icon name="SUCCESS" size={14} />, color: 'green' },
        { label: 'Outstanding',       value: `ETB ${fmtK(totalOutstanding)}`, icon: <Icon name="WARNING" size={14} />, color: totalOverdue > 0 ? 'rose' : 'amber' },
      ]} />

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {totalOverdue > 0 && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm">
              <Icon name="WARNING" size={16} className="text-rose-600 shrink-0" />
              <div>
                <p className="font-semibold text-rose-800">Overdue Property Tax: ETB {fmt(totalOverdue)}</p>
                <p className="text-xs text-rose-600 mt-0.5">Late payment attracts 5% penalty per annum. Pay immediately to avoid compounding penalties.</p>
              </div>
            </div>
          )}

          {/* Property type breakdown */}
          <div className="ovds-grid-layout cols-4">
            {PROPERTY_TYPES.map(pt => {
              const count = properties.filter(p => p.propertyType === pt.value).length;
              const tax   = properties.filter(p => p.propertyType === pt.value).reduce((s, p) => s + p.annualTaxPayable, 0);
              return (
                <div key={pt.value} className="ovds-widget-card p-4">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{pt.label}</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{count}</p>
                  <p className="ovds-caption mt-1">ETB {fmtK(tax)} / year</p>
                </div>
              );
            })}
          </div>

          {/* Recent assessments */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Assessments</p>
              <Btn variant="ghost" size="sm" onClick={() => setActiveTab('assessments')}>View all</Btn>
            </div>
            <AppTable>
              <thead><tr>
                <AppTh>Property</AppTh>
                <AppTh>Period</AppTh>
                <AppTh align="right">Tax Due</AppTh>
                <AppTh align="right">Penalty</AppTh>
                <AppTh>Due Date</AppTh>
                <AppTh>Status</AppTh>
              </tr></thead>
              <tbody>
                {assessments.slice(0, 5).length === 0 ? (
                  <AppTr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">No assessments yet. Register your properties to begin.</td></AppTr>
                ) : assessments.slice(0, 5).map(a => (
                  <AppTr key={a.id}>
                    <AppTd className="font-semibold">{a.propertyId}</AppTd>
                    <AppTd>{a.period}</AppTd>
                    <AppTd align="right"><Amount value={a.annualTaxDue} size="sm" /></AppTd>
                    <AppTd align="right"><Amount value={a.penaltyAmount} size="sm" /></AppTd>
                    <AppTd>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}</AppTd>
                    <AppTd>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {a.status}
                      </span>
                    </AppTd>
                  </AppTr>
                ))}
              </tbody>
            </AppTable>
          </div>
        </div>
      )}

      {/* Tab: Properties register */}
      {activeTab === 'properties' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Icon name="SEARCH" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search properties…"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <span className="ovds-caption">{filtered.length} properties</span>
          </div>
          <AppTable>
            <thead><tr>
              <AppTh>Code</AppTh>
              <AppTh>Description</AppTh>
              <AppTh>Type</AppTh>
              <AppTh>Address</AppTh>
              <AppTh align="right">Land (m²)</AppTh>
              <AppTh align="right">Assessed Value</AppTh>
              <AppTh align="right">Annual Tax</AppTh>
              <AppTh>Status</AppTh>
            </tr></thead>
            <tbody>
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <AppTr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>
                ))}</AppTr>
              )) : filtered.length === 0 ? (
                <AppTr><td colSpan={8} className="py-12 text-center text-sm text-slate-400">No properties registered. Use "Register Property" to begin.</td></AppTr>
              ) : filtered.map(p => (
                <AppTr key={p.id}>
                  <AppTd className="font-mono font-bold">{p.propertyCode}</AppTd>
                  <AppTd className="font-semibold">{p.description}</AppTd>
                  <AppTd><span className="text-[10px] font-semibold text-slate-500">{p.propertyType.replace(/_/g, ' ')}</span></AppTd>
                  <AppTd className="max-w-[180px] truncate">{p.address}, {p.city}</AppTd>
                  <AppTd align="right">{p.landAreaSqm.toLocaleString()}</AppTd>
                  <AppTd align="right"><Amount value={p.assessedValue} size="sm" /></AppTd>
                  <AppTd align="right"><Amount value={p.annualTaxPayable} size="sm" /></AppTd>
                  <AppTd>
                    {p.isExempt
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">EXEMPT</span>
                      : <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status ?? 'ASSESSED']}`}>{p.status ?? 'ASSESSED'}</span>
                    }
                  </AppTd>
                </AppTr>
              ))}
            </tbody>
          </AppTable>
        </div>
      )}

      {/* Tab: Assessments */}
      {activeTab === 'assessments' && (
        <div className="space-y-3">
          {canFile && (
            <div className="flex justify-end">
              <Btn
                variant="primary" size="sm" icon={<Icon name="PLUS" size={12} />}
                onClick={async () => {
                  try {
                    await api.post('/ovds/property-tax/assessments/generate', {
                      period: currentYear,
                      companyId: selectedCompanyId,
                    });
                    toast.success('Assessments generated for ' + currentYear);
                    fetchAll();
                  } catch { toast.error('Failed to generate assessments'); }
                }}
              >
                Generate {currentYear} Assessments
              </Btn>
            </div>
          )}
          <AppTable>
            <thead><tr>
              <AppTh>Property</AppTh>
              <AppTh>Period</AppTh>
              <AppTh>Municipality</AppTh>
              <AppTh align="right">Assessed Value</AppTh>
              <AppTh align="right">Tax Due</AppTh>
              <AppTh align="right">Penalty</AppTh>
              <AppTh align="right">Total Payable</AppTh>
              <AppTh>Due Date</AppTh>
              <AppTh>Status</AppTh>
            </tr></thead>
            <tbody>
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <AppTr key={i}>{Array.from({ length: 9 }).map((_, j) => (
                  <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>
                ))}</AppTr>
              )) : assessments.length === 0 ? (
                <AppTr><td colSpan={9} className="py-12 text-center text-sm text-slate-400">No assessments found. Generate annual assessments above.</td></AppTr>
              ) : assessments.map(a => (
                <AppTr key={a.id}>
                  <AppTd className="font-semibold">{a.propertyId}</AppTd>
                  <AppTd>{a.period}</AppTd>
                  <AppTd>{a.municipality}</AppTd>
                  <AppTd align="right"><Amount value={a.assessedValue} size="sm" /></AppTd>
                  <AppTd align="right"><Amount value={a.annualTaxDue} size="sm" /></AppTd>
                  <AppTd align="right"><Amount value={a.penaltyAmount} size="sm" /></AppTd>
                  <AppTd align="right"><Amount value={a.totalPayable} size="sm" /></AppTd>
                  <AppTd>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}</AppTd>
                  <AppTd>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status]}`}>
                      {a.status}
                    </span>
                  </AppTd>
                </AppTr>
              ))}
            </tbody>
          </AppTable>
        </div>
      )}

      {/* Tab: Calculator */}
      {activeTab === 'calculator' && <PropertyTaxCalculator />}

      {/* Tab: Tax Guide */}
      {activeTab === 'guide' && (
        <div className="space-y-5">
          {[
            {
              title: 'Urban Land Use Fee',
              ref: 'Proclamation No. 1161/2019, Art. 3',
              content: 'All urban land holders pay an annual use fee based on land grade, size (m²), and municipality. Addis Ababa uses 4 grades (ETB 1.20–3.50/m²). Failure to pay within 30 days of notice attracts 5% penalty p.a. Disputes are submitted to the Regional Tax Appeal Commission within 30 days.',
              color: 'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)]',
            },
            {
              title: 'Building / House Tax',
              ref: 'Proclamation No. 1161/2019, Art. 6',
              content: 'Buildings (residential and commercial) are assessed at 1% of the official assessed value annually. Valuation is conducted every 4 years by the Revenue Bureau. New buildings: first assessment within 90 days of occupancy. Exempt: places of worship, government buildings, diplomatic properties.',
              color: 'border-sky-200 bg-sky-50',
            },
            {
              title: 'Rental Income Tax',
              ref: 'Federal Income Tax Proclamation No. 1395/2025, Art. 35–40',
              content: 'Rental income is subject to 15% income tax on net income (gross rent minus allowable expenses: maintenance, insurance, depreciation at 2% p.a.). Owners must file monthly returns by the 30th of the following month. Annual reconciliation due November 7.',
              color: 'border-amber-200 bg-amber-50',
            },
            {
              title: 'Filing & Payment Process',
              ref: 'ERCA Regulation No. 570/2025',
              content: 'File online via etax.erca.gov.et or at your local Revenue Bureau. Pay at Commercial Bank of Ethiopia (CBE), Awash Bank, or mobile banking. Keep payment receipts for 10 years (ERCA audit statute of limitations is 5 years). Dispute: Tax Appeal Commission → Federal High Court.',
              color: 'border-violet-200 bg-violet-50',
            },
            {
              title: 'IFRS Accounting Treatment',
              ref: 'IAS 40 Investment Property / IAS 16 Property, Plant & Equipment',
              content: 'Property tax paid is an IAS 16 / IAS 40 period expense. Journal entry: Dr Property Tax Expense / Cr Cash or Accrued Tax Payable. For investment property under fair value model (IAS 40.30): property tax does not affect the carrying amount. For own-use property under cost model (IAS 16): expense in P&L (operating costs).',
              color: 'border-rose-200 bg-rose-50',
            },
          ].map(item => (
            <div key={item.title} className={`p-5 rounded-xl border ${item.color}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-bold text-slate-800">{item.title}</p>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.ref}</span>
              </div>
              <p className="text-[12px] text-slate-600 leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddPropertyModal onClose={() => setShowAdd(false)} onSaved={fetchAll} />}
    </AppPage>
  );
};

export default PropertyTax;


