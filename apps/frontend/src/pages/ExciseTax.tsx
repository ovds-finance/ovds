/**
 * Excise Tax — Ethiopia
 * Proclamation No. 1186/2020 + Amendment Proclamation No. 1239/2021
 * Administered by: ERCA
 */
import {
  calculateExciseTax,
  EXCISE_RATES,
  type ExciseGoodsCategory,
  type ExciseTaxOrigin,
  type ExciseTaxStatus,
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
  useExciseDashboard,
  useExciseRecords,
  useExciseFilings,
} from '../services/newTaxApi';

const _today = new Date().toISOString().slice(0, 10);
const currentPeriod = new Date().toISOString().slice(0, 7);

const GOODS_CATEGORIES: { value: ExciseGoodsCategory; label: string; group: string }[] = [
  { value: 'TOBACCO_CIGARETTES',       label: 'Cigarettes',              group: 'Tobacco' },
  { value: 'TOBACCO_OTHER',            label: 'Other Tobacco Products',  group: 'Tobacco' },
  { value: 'ALCOHOL_WINE',             label: 'Wine',                    group: 'Alcohol' },
  { value: 'ALCOHOL_BEER',             label: 'Beer',                    group: 'Alcohol' },
  { value: 'ALCOHOL_SPIRITS',          label: 'Spirits / Liquor',        group: 'Alcohol' },
  { value: 'SOFT_DRINKS',              label: 'Soft Drinks',             group: 'Beverages' },
  { value: 'PERFUMES_COSMETICS',       label: 'Perfumes & Cosmetics',    group: 'Personal Care' },
  { value: 'VEHICLES_UP_TO_1300CC',    label: 'Vehicles ≤ 1300cc',       group: 'Vehicles' },
  { value: 'VEHICLES_1300_TO_1800CC',  label: 'Vehicles 1301–1800cc',    group: 'Vehicles' },
  { value: 'VEHICLES_ABOVE_1800CC',    label: 'Vehicles > 1800cc',       group: 'Vehicles' },
  { value: 'VEHICLES_TRUCKS',          label: 'Commercial Trucks',       group: 'Vehicles' },
  { value: 'FUEL_PETROL',              label: 'Petrol',                  group: 'Fuel' },
  { value: 'FUEL_DIESEL',              label: 'Diesel',                  group: 'Fuel' },
  { value: 'PLASTIC_BAGS',             label: 'Plastic Bags',            group: 'Environment' },
  { value: 'ELECTRONICS',              label: 'Electronics',             group: 'Goods' },
  { value: 'LUXURY_GOODS',             label: 'Luxury Goods',            group: 'Goods' },
  { value: 'SALT',                     label: 'Salt',                    group: 'Food' },
  { value: 'SUGAR',                    label: 'Sugar',                   group: 'Food' },
  { value: 'OTHER',                    label: 'Other',                   group: 'Other' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-600',
  PENDING:   'bg-amber-50 text-amber-700',
  PAID:      'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  FILED:     'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  OVERDUE:   'bg-rose-50 text-rose-700',
  EXEMPTED:  'bg-white text-slate-400',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtK = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : fmt(n);

// -- Rate Reference Table ------------------------------------------------------
const ExciseRateReference: React.FC = () => {
  const groups: Record<string, typeof GOODS_CATEGORIES> = {};
  GOODS_CATEGORIES.forEach(c => {
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  });

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group} className="ovds-widget-card overflow-hidden">
          <div className="px-5 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{group}</p>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {items.map(item => {
              const rate = EXCISE_RATES[item.value];
              return (
                <div key={item.value} className="flex items-center justify-between px-5 py-3">
                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{item.label}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-500">
                      {rate.basis === 'PERCENTAGE'
                        ? rate.rate === 0 ? 'Exempt' : `${((rate.rate ?? 0) * 100).toFixed(0)}%`
                        : `ETB ${rate.specificRate} ${rate.unit ?? ''}`}
                    </span>
                    <span className="text-[10px] text-slate-400 max-w-[200px] truncate">{rate.notes}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// -- Live Calculator -----------------------------------------------------------
const ExciseCalculator: React.FC = () => {
  const [category, setCategory] = useState<ExciseGoodsCategory>('TOBACCO_CIGARETTES');
  const [baseValue, setBaseValue] = useState('');
  const [quantity, setQuantity]   = useState('');
  const [applyVat, setApplyVat]   = useState(false);

  const result = calculateExciseTax({
    category,
    baseValue:   parseFloat(baseValue) || 0,
    quantity:    parseFloat(quantity) || undefined,
    applyVatOnTop: applyVat,
  });

  const config = EXCISE_RATES[category];
  const needsQuantity = config.basis === 'SPECIFIC_ETB' || config.basis === 'HYBRID';

  return (
    <div className="space-y-5">
      <div className="ovds-grid-layout cols-2">
        <FormField label="Goods Category">
          <Select value={category} onChange={e => setCategory(e as ExciseGoodsCategory)}>
            {GOODS_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </FormField>
        <FormField label="Base Value / CIF (ETB)" hint="Ex-factory price for local goods; CIF value for imports">
          <Input type="number" min="0" step="0.01" value={baseValue} onChange={e => setBaseValue(e.target.value)} placeholder="0.00" />
        </FormField>
        {needsQuantity && (
          <FormField label={`Quantity (${config.unit ?? 'units'})`}>
            <Input type="number" min="0" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
          </FormField>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
        <input type="checkbox" checked={applyVat} onChange={e => setApplyVat(e.target.checked)} className="rounded accent-indigo-500" />
        Also calculate VAT on (base value + excise) — applicable to most excisable goods
      </label>

      <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
        {config.notes}
      </div>

      {(parseFloat(baseValue) > 0 || parseFloat(quantity) > 0) && (
        <div className="space-y-3">
          <div className="ovds-grid-layout cols-3">
            {[
              { label: 'Excise Tax Due', value: result.exciseTaxDue, color: 'text-rose-700' },
              { label: 'VAT (if applied)', value: result.vatIfApplied ?? 0, color: 'text-amber-700' },
              { label: 'Total Tax Burden', value: result.totalTaxBurden, color: 'text-slate-800' },
            ].map(c => (
              <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                <p className={`text-xl font-bold tabular-nums ${c.color}`}>ETB {fmt(c.value)}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Effective excise rate: {(result.effectiveRate * 100).toFixed(1)}% of base value
          </p>
        </div>
      )}
    </div>
  );
};

// -- Add Record Modal ----------------------------------------------------------
function AddExciseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    period: currentPeriod, goodsCategory: 'TOBACCO_CIGARETTES' as ExciseGoodsCategory,
    goodsDescription: '', origin: 'LOCAL' as ExciseTaxOrigin,
    quantity: '', unit: 'units', baseValue: '',
    customsDeclarationNo: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const result = form.baseValue ? calculateExciseTax({
    category: form.goodsCategory,
    baseValue: parseFloat(form.baseValue) || 0,
    quantity: parseFloat(form.quantity) || undefined,
    applyVatOnTop: true,
  }) : null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.goodsDescription || !form.baseValue) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await api.post('/ovds/excise-tax/records', {
        ...form,
        quantity: parseFloat(form.quantity) || 0,
        baseValue: parseFloat(form.baseValue) || 0,
        exciseTaxDue: result?.exciseTaxDue ?? 0,
        vatOnExcise: result?.vatIfApplied ?? 0,
        totalTaxDue: result?.totalTaxBurden ?? 0,
      });
      toast.success('Excise record added'); onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title="Add Excise Tax Record" onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={save}>Save</Btn></>}
    >
      <form onSubmit={save} className="space-y-4">
        <div className="ovds-grid-layout cols-2">
          <FormField label="Period (YYYY-MM)">
            <Input value={form.period} onChange={e => set('period', e.target.value)} />
          </FormField>
          <FormField label="Origin">
            <Select value={form.origin} onChange={e => set('origin', e)}>
              <option value="LOCAL">Local (Ex-factory)</option>
              <option value="IMPORT">Import (CIF Value)</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Goods Category">
          <Select value={form.goodsCategory} onChange={e => set('goodsCategory', e)}>
            {GOODS_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </FormField>
        <FormField label="Goods Description" required>
          <Input value={form.goodsDescription} onChange={e => set('goodsDescription', e.target.value)} />
        </FormField>
        <div className="ovds-grid-layout cols-2">
          <FormField label="Base Value / CIF (ETB)" required>
            <Input type="number" min="0" step="0.01" value={form.baseValue} onChange={e => set('baseValue', e.target.value)} />
          </FormField>
          <FormField label="Quantity">
            <Input type="number" min="0" step="0.01" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
          </FormField>
        </div>
        {form.origin === 'IMPORT' && (
          <FormField label="Customs Declaration No.">
            <Input value={form.customsDeclarationNo} onChange={e => set('customsDeclarationNo', e.target.value)} />
          </FormField>
        )}
        {result && result.exciseTaxDue > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Excise Tax Due</span>
              <span className="font-bold text-rose-700">ETB {fmt(result.exciseTaxDue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">VAT on (base + excise)</span>
              <span className="font-bold text-amber-700">ETB {fmt(result.vatIfApplied ?? 0)}</span>
            </div>
            <div className="flex justify-between border-t border-rose-200 pt-1">
              <span className="font-bold text-slate-700">Total Tax Burden</span>
              <span className="font-bold text-slate-800">ETB {fmt(result.totalTaxBurden)}</span>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}

// -- Main Page -----------------------------------------------------------------
const ExciseTax: React.FC = () => {
  usePageTitle('Excise Tax');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const canWrite = can('vat:write');
  const canFile  = can('vat:file');

  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'filings' | 'calculator' | 'rates'>('overview');
  const [showAdd, setShowAdd]     = useState(false);
  const [period, setPeriod]       = useState(currentPeriod);

  const { data: dashboard, loading: dashLoading, refetch: refetchDash } = useExciseDashboard(period, selectedCompanyId ?? undefined);
  const { records,  loading: recLoading,  refetch: refetchRec  }        = useExciseRecords(period, selectedCompanyId ?? undefined);
  const { filings,  loading: filLoading,  refetch: refetchFil  }        = useExciseFilings(period, selectedCompanyId ?? undefined);

  const loading  = dashLoading || recLoading || filLoading;
  const fetchAll = useCallback(() => { refetchDash(); refetchRec(); refetchFil(); }, [refetchDash, refetchRec, refetchFil]);
  useInterval(fetchAll, 120_000);

  const totalDue         = dashboard?.totalExciseDue   ?? (records ?? []).reduce((s: number, r: any) => s + Number(r.exciseTaxDue ?? 0), 0);
  const totalPaid        = dashboard?.totalPaid        ?? 0;
  const totalOutstanding = dashboard?.totalOutstanding ?? 0;
  const penaltiesAccrued = dashboard?.penaltiesAccrued ?? 0;

  const TABS = [
    { key: 'overview',    label: 'Overview' },
    { key: 'records',     label: `Records (${(records ?? []).length})` },
    { key: 'filings',     label: `Filings (${(filings ?? []).length})` },
    { key: 'calculator',  label: 'Calculator' },
    { key: 'rates',       label: 'Rate Reference' },
  ] as const;

  return (
    <AppPage
      title="Excise Tax"
      subtitle="Proclamation No. 1186/2020 · Locally manufactured & imported goods · ERCA filing · Manufacturing & Logistics · Retail & E-commerce · Revenue · Market Forecast · Challenges Analysis"
      icon={<Icon name="SHIELD" size={18} />}
      crumbs={[{ label: 'Tax & Compliance', to: '/tax/dashboard' }, { label: 'Excise Tax' }]}
      actions={
        <>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
            <Icon name="CALENDAR" size={13} className="text-slate-400" />
            <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none w-24" />
          </div>
          <Btn variant="ghost" size="sm" icon={<Icon name="REFRESH" size={12} className={loading ? 'animate-spin' : ''} />} onClick={fetchAll}>Refresh</Btn>
          {canWrite && <Btn variant="secondary" size="sm" icon={<Icon name="PLUS" size={12} />} onClick={() => setShowAdd(true)}>Add Record</Btn>}
          {canFile && (
            <Btn variant="primary" size="sm" icon={<Icon name="SEND" size={12} />} onClick={async () => {
              try {
                await api.post('/ovds/excise-tax/file', { period, companyId: selectedCompanyId });
                toast.success('Excise tax return filed'); fetchAll();
              } catch { toast.error('Failed to file'); }
            }}>
              File Return
            </Btn>
          )}
        </>
      }
      tabs={<AppTabs tabs={TABS.map(t => ({ key: t.key, label: t.label }))} active={activeTab} onChange={k => setActiveTab(k as any)} />}
    >
      <AppKpi cells={[
        { label: 'Excise Due',     value: `ETB ${fmtK(totalDue)}`,        icon: <Icon name="RECEIPT" size={14} />, color: 'rose' },
        { label: 'Total Paid',     value: `ETB ${fmtK(totalPaid)}`,        icon: <Icon name="SUCCESS" size={14} />, color: 'green' },
        { label: 'Outstanding',    value: `ETB ${fmtK(totalOutstanding)}`, icon: <Icon name="WARNING" size={14} />, color: totalOutstanding > 0 ? 'amber' : 'indigo' },
        { label: 'Penalties',      value: `ETB ${fmtK(penaltiesAccrued)}`, icon: <Icon name="ALERT_TRIANGLE" size={14} />, color: penaltiesAccrued > 0 ? 'rose' : 'indigo' },
      ]} />

      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-2">
              <Icon name="WARNING" size={14} /> Excise Tax — Key Rules (Proclamation No. 1186/2020)
            </p>
            <ul className="text-[11px] text-amber-700 space-y-1 ml-5 list-disc">
              <li>Excise tax is levied before VAT — the tax base for VAT includes excise tax</li>
              <li>Monthly return due by the 30th of the following month via eTax portal</li>
              <li>Late filing: ETB 500/day penalty + 25% of tax due after 30 days</li>
              <li>Local manufacturers: ex-factory price is the tax base</li>
              <li>Importers: CIF value at customs clearance is the tax base</li>
              <li>Exemptions: goods re-exported within 12 months, diplomatic imports</li>
            </ul>
          </div>

          {/* Category breakdown */}
          <div className="ovds-grid-layout cols-3">
            {['TOBACCO_CIGARETTES', 'ALCOHOL_BEER', 'VEHICLES_UP_TO_1300CC', 'SOFT_DRINKS', 'FUEL_PETROL', 'LUXURY_GOODS'].map(cat => {
              const catRecords = records.filter(r => r.goodsCategory === cat);
              const catTotal = catRecords.reduce((s: number, r: any) => s + Number(r.exciseTaxDue ?? 0), 0);
              const label = GOODS_CATEGORIES.find(c => c.value === cat)?.label ?? cat;
              const config = EXCISE_RATES[cat as ExciseGoodsCategory];
              const rateStr = config.basis === 'PERCENTAGE'
                ? `${((config.rate ?? 0) * 100).toFixed(0)}%`
                : `ETB ${config.specificRate} / ${config.unit}`;
              return (
                <div key={cat} className="ovds-widget-card p-4">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{catRecords.length} records</p>
                  <p className="text-sm font-semibold text-rose-600 mt-1">ETB {fmtK(catTotal)}</p>
                  <p className="ovds-caption mt-1">Rate: {rateStr}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <AppTable>
          <thead><tr>
            <AppTh>Period</AppTh>
            <AppTh>Category</AppTh>
            <AppTh>Description</AppTh>
            <AppTh>Origin</AppTh>
            <AppTh align="right">Base Value</AppTh>
            <AppTh align="right">Excise Tax</AppTh>
            <AppTh align="right">VAT on Excise</AppTh>
            <AppTh>Status</AppTh>
          </tr></thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <AppTr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>
              ))}</AppTr>
            )) : records.length === 0 ? (
              <AppTr><td colSpan={8} className="py-12 text-center text-sm text-slate-400">No excise tax records for this period.</td></AppTr>
            ) : records.map((r: any) => (
              <AppTr key={r.id}>
                <AppTd>{r.period}</AppTd>
                <AppTd className="text-[11px]">{GOODS_CATEGORIES.find(c => c.value === r.goodsCategory)?.label ?? r.goodsCategory}</AppTd>
                <AppTd className="max-w-[180px] truncate">{r.goodsDescription}</AppTd>
                <AppTd>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.origin === 'LOCAL' ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'}`}>
                    {r.origin}
                  </span>
                </AppTd>
                <AppTd align="right"><Amount value={r.baseValue} size="sm" /></AppTd>
                <AppTd align="right"><Amount value={r.exciseTaxDue} size="sm" /></AppTd>
                <AppTd align="right"><Amount value={r.vatOnExcise ?? 0} size="sm" /></AppTd>
                <AppTd>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status ?? 'DRAFT']}`}>
                    {r.status ?? 'DRAFT'}
                  </span>
                </AppTd>
              </AppTr>
            ))}
          </tbody>
        </AppTable>
      )}

      {activeTab === 'filings' && (
        <AppTable>
          <thead><tr>
            <AppTh>Period</AppTh>
            <AppTh align="right">Total Excise Due</AppTh>
            <AppTh align="right">Total Paid</AppTh>
            <AppTh align="right">Penalty</AppTh>
            <AppTh>Due Date</AppTh>
            <AppTh>Status</AppTh>
            <AppTh>ERCA Ref</AppTh>
          </tr></thead>
          <tbody>
            {filings.length === 0 ? (
              <AppTr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No filings yet. Add records and file a return.</td></AppTr>
            ) : filings.map((f: any) => (
              <AppTr key={f.id}>
                <AppTd className="font-bold">{f.period}</AppTd>
                <AppTd align="right"><Amount value={f.totalExciseDue} size="sm" /></AppTd>
                <AppTd align="right"><Amount value={f.totalPaid} size="sm" /></AppTd>
                <AppTd align="right"><Amount value={f.penaltyAmount ?? 0} size="sm" /></AppTd>
                <AppTd>{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}</AppTd>
                <AppTd>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[f.status ?? 'PENDING']}`}>
                    {f.status}
                  </span>
                </AppTd>
                <AppTd className="font-mono text-[11px]">{f.ercaReferenceNo ?? '—'}</AppTd>
              </AppTr>
            ))}
          </tbody>
        </AppTable>
      )}

      {activeTab === 'calculator' && <ExciseCalculator />}
      {activeTab === 'rates'      && <ExciseRateReference />}

      {showAdd && <AddExciseModal onClose={() => setShowAdd(false)} onSaved={fetchAll} />}
    </AppPage>
  );
};

export default ExciseTax;


