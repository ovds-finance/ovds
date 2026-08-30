/**
 * IFRS Tax Rate Reference Panel
 * Ethiopian tax rates with IFRS accounting treatment
 * IAS 12 — Income Taxes, IFRS 15 — Revenue, IAS 19 — Employee Benefits
 * Enhanced with IASB 2024–2027 update banner and role-based access.
 */
import React, { useState } from 'react';
import {
  Calculator, ChevronDown, ChevronUp, Info, TrendingUp,
  Users, Shield, Scale, Package, Globe, Lock,
} from 'lucide-react';
import IASBUpdateBanner from '../iasbUpdateBanner';
import { useIFRSAccess } from '../../hooks/useIfrsAccess';
import { useBusiness } from '../../context/businessContext';
import { PIT_BRACKETS as SHARED_PIT } from '../../utils/ethiopianTax';

// PIT display table derived from shared PIT_BRACKETS (single source of truth)
const PIT_BRACKETS: PITBracket[] = [
  { range: 'ETB 0 – 2,000',       rate: '0%',  taxFormula: `ETB 0` },
  { range: 'ETB 2,001 – 4,000',   rate: '15%', taxFormula: `(Income − 2,000) × 15%` },
  { range: 'ETB 4,001 – 7,000',   rate: '20%', taxFormula: `ETB 300 + (Income − 4,000) × 20%` },
  { range: 'ETB 7,001 – 10,000',  rate: '25%', taxFormula: `ETB 900 + (Income − 7,000) × 25%` },
  { range: 'ETB 10,001 – 14,000', rate: '30%', taxFormula: `ETB 1,650 + (Income − 10,000) × 30%` },
  { range: 'ETB > 14,000',        rate: '35%', taxFormula: `ETB 2,850 + (Income − 14,000) × 35%` },
].map((row, i) => ({ ...SHARED_PIT[i], ...row }));

interface TaxRate {
  name: string;
  rate: string;
  basis: string;
  frequency: string;
  portal: string;
  ifrsRef: string;
  ifrsNote: string;
  category: 'vat' | 'income' | 'payroll' | 'drrf' | 'excise' | 'customs';
}

interface PITBracket {
  range: string;
  rate: string;
  taxFormula: string;
}

const TAX_RATES: TaxRate[] = [
  {
    name: 'VAT — Standard Rate',
    rate: '15%',
    basis: 'Output VAT minus Input VAT',
    frequency: 'Monthly (by 30th)',
    portal: 'eTax / SIGTAS',
    ifrsRef: 'IFRS 15 / IAS 12',
    ifrsNote: 'Output VAT is a liability (not revenue). Input VAT is an asset. Net payable recognised per IAS 12.',
    category: 'vat',
  },
  {
    name: 'VAT — Zero-rated Exports',
    rate: '0%',
    basis: 'Export invoice value',
    frequency: 'Monthly',
    portal: 'eTax / SIGTAS',
    ifrsRef: 'IFRS 15.B1',
    ifrsNote: 'Zero-rated supplies still require VAT registration and monthly filing. Input VAT on related costs is fully reclaimable.',
    category: 'vat',
  },
  {
    name: 'Business Income Tax (BIT)',
    rate: '30%',
    basis: 'Net profit (corporate)',
    frequency: 'Annual (within 4 months of FY end)',
    portal: 'MoR office',
    ifrsRef: 'IAS 12.46',
    ifrsNote: 'Current tax liability recognised at 30% of taxable profit. Deferred tax recognised for all temporary differences.',
    category: 'income',
  },
  {
    name: 'Personal Income Tax (PIT)',
    rate: '0% – 35%',
    basis: 'Gross salary (progressive)',
    frequency: 'Monthly (via payroll)',
    portal: 'eTax',
    ifrsRef: 'IAS 19.11',
    ifrsNote: 'Short-term employee benefit. Recognised as expense when service is rendered. Withheld from employee and remitted to ERCA.',
    category: 'payroll',
  },
  {
    name: 'Pension — Employee',
    rate: '7%',
    basis: 'Basic salary',
    frequency: 'Monthly',
    portal: 'Pension Authority',
    ifrsRef: 'IAS 19.51',
    ifrsNote: 'Defined contribution plan. Employer obligation is limited to the contribution amount. No actuarial risk.',
    category: 'payroll',
  },
  {
    name: 'Pension — Employer',
    rate: '11%',
    basis: 'Basic salary',
    frequency: 'Monthly',
    portal: 'Pension Authority',
    ifrsRef: 'IAS 19.51',
    ifrsNote: 'Employer contribution expensed when due. Total payroll cost = gross salary + 11% employer pension.',
    category: 'payroll',
  },
  {
    name: 'DRRF — Annual Sales Revenue',
    rate: '5%',
    basis: 'Paid invoice subtotals',
    frequency: 'Monthly / Quarterly',
    portal: 'EDRRFO',
    ifrsRef: 'IAS 37.14',
    ifrsNote: 'Present obligation arising from sales. Recognised as provision per IAS 37. Remitted to designated banks (CBE).',
    category: 'drrf',
  },
  {
    name: 'DRRF — Telecom / Digital Services',
    rate: '5%',
    basis: 'Service fee value',
    frequency: 'Monthly',
    portal: 'EDRRFO',
    ifrsRef: 'IAS 37.14',
    ifrsNote: 'New category per Regulation No. 570/2025. Applies to mobile money, digital banking, and telecom services.',
    category: 'drrf',
  },
  {
    name: 'DRRF — Salary Contribution',
    rate: '1%',
    basis: 'Net salary per payroll period',
    frequency: 'Monthly',
    portal: 'EDRRFO',
    ifrsRef: 'IAS 19 / IAS 37',
    ifrsNote: 'Deducted from employee net pay. Employer remits to EDRRFO. Recognised as payroll expense.',
    category: 'drrf',
  },
  {
    name: 'Excise Tax — Tobacco / Alcohol',
    rate: '5% (DRRF) + Excise',
    basis: 'Sales value',
    frequency: 'Monthly',
    portal: 'ERCA',
    ifrsRef: 'IAS 2.10 / IFRS 15',
    ifrsNote: 'Excise duties included in inventory cost (IAS 2) for imports. For domestic sales, excise reduces net revenue per IFRS 15.',
    category: 'excise',
  },
  {
    name: 'Withholding Tax — Services',
    rate: '3%',
    basis: 'Service invoice value ≥ ETB 10,000',
    frequency: 'Monthly',
    portal: 'eTax',
    ifrsRef: 'IAS 12 / IFRS 15',
    ifrsNote: 'Raised from 2% to 3% per Proclamation No. 1395/2025 (effective July 7, 2025). Withheld by payer on service invoices ≥ ETB 10,000. Supplier receives net amount. WHT is a prepayment of income tax.',
    category: 'income',
  },
  {
    name: 'Withholding Tax — Goods',
    rate: '3%',
    basis: 'Goods invoice value ≥ ETB 20,000',
    frequency: 'Monthly',
    portal: 'eTax',
    ifrsRef: 'IAS 12 / IFRS 15',
    ifrsNote: 'Raised from 2% to 3% per Proclamation No. 1395/2025 (effective July 7, 2025). Withheld by payer on goods payments ≥ ETB 20,000.',
    category: 'income',
  },
  {
    name: 'Turnover Tax (TOT) — Goods',
    rate: '2%',
    basis: 'Gross receipts (goods)',
    frequency: 'Monthly',
    portal: 'ERCA',
    ifrsRef: 'IAS 12',
    ifrsNote: 'Applies to Category B taxpayers (annual turnover < ETB 2M, not VAT-registered). 2% on goods sales. Replaces VAT for small businesses.',
    category: 'income',
  },
  {
    name: 'Turnover Tax (TOT) — Services',
    rate: '10%',
    basis: 'Gross receipts (services)',
    frequency: 'Monthly',
    portal: 'ERCA',
    ifrsRef: 'IAS 12',
    ifrsNote: 'Applies to Category B taxpayers (annual turnover < ETB 2M, not VAT-registered). 10% on service income. Proclamation No. 1395/2025.',
    category: 'income',
  },
  {
    name: 'Minimum Alternative Tax (MAT)',
    rate: '2.5%',
    basis: 'Annual gross turnover',
    frequency: 'Annual',
    portal: 'MoR office',
    ifrsRef: 'IAS 12.46',
    ifrsNote: 'Businesses must pay whichever is higher: regular BIT (30% of net profit) or MAT (2.5% of annual turnover). Introduced by Proclamation No. 1395/2025 to prevent zero-tax reporting.',
    category: 'income',
  },
  {
    name: 'Customs Duty — Imports',
    rate: 'Varies (0%–35%)',
    basis: 'CIF value of imports',
    frequency: 'Per shipment',
    portal: 'Ethiopian Customs Commission',
    ifrsRef: 'IAS 2.10',
    ifrsNote: 'Customs duties are included in the cost of imported inventories per IAS 2. Non-refundable import taxes are capitalised.',
    category: 'customs',
  },
];

const CATEGORY_CONFIG = {
  vat:     { label: 'VAT',          color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',     icon: <Scale size={12} /> },
  income:  { label: 'Income Tax',   color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', icon: <TrendingUp size={12} /> },
  payroll: { label: 'Payroll',      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', icon: <Users size={12} /> },
  drrf:    { label: 'DRRF',         color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', icon: <Shield size={12} /> },
  excise:  { label: 'Excise',       color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',  icon: <Package size={12} /> },
  customs: { label: 'Customs',      color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',     icon: <Globe size={12} /> },
};

type CategoryFilter = 'all' | keyof typeof CATEGORY_CONFIG;

const IFRSTaxRateReference: React.FC = () => {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [showPIT, setShowPIT] = useState(false);
  const [expandedRate, setExpandedRate] = useState<string | null>(null);
  const { canView, blockedHint } = useIFRSAccess();
  const { companies, selectedCompanyId } = useBusiness();
  const company = companies.find(c => c.id === selectedCompanyId);
  const businessType = (company as any)?.type ?? 'ALL';

  if (!canView) {
    return (
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
        <Lock size={18} className="text-slate-400 shrink-0" />
        <div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Ethiopian Tax Rate Reference</p>
          <p className="text-xs text-slate-400 mt-0.5">{blockedHint('view tax rate reference')}</p>
        </div>
      </div>
    );
  }

  const filtered = filter === 'all' ? TAX_RATES : TAX_RATES.filter(r => r.category === filter);

  return (
    <div className="space-y-4">
      {/* IASB Update Banner */}
      <IASBUpdateBanner businessType={businessType} compact />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900 rounded-xl flex items-center justify-center">
            <Calculator size={18} className="text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Ethiopian Tax Rate Reference</h3>
            <p className="ovds-caption">With IFRS accounting treatment per IAS 12, IFRS 15, IAS 19, IAS 37</p>
          </div>
        </div>
        <button
          onClick={() => setShowPIT(!showPIT)}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
        >
          <Users size={13} />
          PIT Brackets
          {showPIT ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* PIT Brackets */}
      {showPIT && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Personal Income Tax Brackets (ETB/month)</p>
            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">IAS 19.11</span>
          </div>
          <div className="overflow-x-auto">
            <table className="ovds-table w-full text-xs">
              <thead>
                <tr className="border-b border-indigo-200 dark:border-indigo-800">
                  <th className="text-left py-2 pr-4 font-semibold text-indigo-700 dark:text-indigo-300">Income Range</th>
                  <th className="text-center py-2 px-4 font-semibold text-indigo-700 dark:text-indigo-300">Rate</th>
                  <th className="text-left py-2 pl-4 font-semibold text-indigo-700 dark:text-indigo-300">Tax Formula</th>
                </tr>
              </thead>
              <tbody>
                {PIT_BRACKETS.map((b, i) => (
                  <tr key={i} className="border-b border-indigo-100 dark:border-indigo-900/50">
                    <td className="py-2 pr-4 font-mono text-slate-700 dark:text-slate-200">{b.range}</td>
                    <td className="py-2 px-4 text-center">
                      <span className={`font-semibold px-2 py-0.5 rounded-full ${b.rate === '0%' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'}`}>
                        {b.rate}
                      </span>
                    </td>
                    <td className="py-2 pl-4 font-mono text-slate-500 dark:text-slate-400 text-[10px]">{b.taxFormula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-2 flex items-center gap-1">
            <Info size={11} />
            Cumulative calculation — each bracket applies only to income within that range.
          </p>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {(['all', ...Object.keys(CATEGORY_CONFIG)] as CategoryFilter[]).map(cat => {
          const cfg = cat === 'all' ? null : CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG];
          return (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === cat ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {cfg?.icon}
              {cat === 'all' ? 'All Taxes' : cfg?.label}
            </button>
          );
        })}
      </div>

      {/* Tax rate cards */}
      <div className="space-y-2">
        {filtered.map(rate => {
          const cfg = CATEGORY_CONFIG[rate.category];
          const isOpen = expandedRate === rate.name;
          return (
            <div key={rate.name} className="ovds-widget-card overflow-hidden">
              <button
                onClick={() => setExpandedRate(isOpen ? null : rate.name)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{rate.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{rate.rate}</span>
                    <span className="ovds-caption">{rate.basis}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{rate.frequency}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg block mb-1">{rate.ifrsRef}</span>
                  {isOpen ? <ChevronUp size={14} className="text-slate-400 ml-auto" /> : <ChevronDown size={14} className="text-slate-400 ml-auto" />}
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">IFRS Accounting Treatment</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{rate.ifrsNote}</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Filing Portal</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{rate.portal}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Frequency</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{rate.frequency}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900 rounded-xl p-3">
        <Info size={14} className="text-orange-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <strong>Regulation No. 570/2025</strong> (effective mid-2025): VAT registration threshold raised to ETB 2,000,000/year. New DRRF categories introduced including telecom/digital services (5%) and updated flat fees.
        </p>
      </div>
    </div>
  );
};

export default IFRSTaxRateReference;








