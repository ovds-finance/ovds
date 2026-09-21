/**
 * Schedule D — Other Income & Capital Taxes
 * Proclamation No. 1395/2025
 *
 * Covers: Dividends (15%), Interest (10%/30%), Capital Gains (15%),
 * Royalties (5%/10%), Digital Content (15%), Games of Chance (20%),
 * Repatriated Profit (15%), Undistributed Profit (15%),
 * Management Fees NR (15%), Technical Fees NR (15%),
 * Rental Income (individual progressive / corporate 30%),
 * Customs Duty (0–35% on CIF).
 */
import type { ScheduleDTaxRecord } from '@ovds/shared';
import { AppPage, AppTabs } from '@ovds/ui';
import {
  SCHEDULE_D_RATES,
  calculateScheduleD,
  calculateCapitalGains,
  calculateRentalIncomeTax,
  calculateCorporateRentalTax,
  calculateCustomsDuty,
  RENTAL_INCOME_BRACKETS,
  CUSTOMS_DUTY_BANDS,
  CORPORATE_RENTAL_RATE,
  RENTAL_ALLOWABLE_EXPENSE_PCT,
  type ScheduleDTaxType,
  type CapitalGainsAssetType,
} from '@ovds/ui';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { Icon } from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';



const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtK = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
  : fmt(n);

// -- Rate reference data -------------------------------------------------------
const SCHEDULE_D_DISPLAY: Array<{
  key: ScheduleDTaxType;
  label: string;
  rate: string;
  schedule: string;
  source: string;
  withheld: boolean;
  color: string;
}> = [
  { key: 'DIVIDEND',                    label: 'Dividend Income',           rate: '15%',  schedule: 'D', source: 'Art. 52', withheld: true,  color: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' },
  { key: 'INTEREST_STANDARD',           label: 'Interest (standard)',       rate: '10%',  schedule: 'D', source: 'Art. 53', withheld: true,  color: 'bg-sky-50 border-sky-200 text-sky-800' },
  { key: 'INTEREST_FINANCIAL_INSTITUTION', label: 'Interest (FI / credit sales)', rate: '30%', schedule: 'D', source: 'Art. 53', withheld: false, color: 'bg-sky-50 border-sky-200 text-sky-800' },
  { key: 'CAPITAL_GAINS',               label: 'Capital Gains (disposal)',  rate: '15%',  schedule: 'D', source: 'Art. 59', withheld: false, color: 'bg-violet-50 border-violet-200 text-violet-800' },
  { key: 'ROYALTY_ARTISTIC',            label: 'Royalty — Artistic',        rate: '5%',   schedule: 'D', source: 'Art. 56', withheld: true,  color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { key: 'ROYALTY_TECHNICAL',           label: 'Royalty — Technical',       rate: '10%',  schedule: 'D', source: 'Art. 56', withheld: true,  color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { key: 'DIGITAL_CONTENT',             label: 'Digital Content Income',    rate: '15%',  schedule: 'D', source: 'Art. 57', withheld: false, color: 'bg-rose-50 border-rose-200 text-rose-800' },
  { key: 'GAMES_OF_CHANCE',             label: 'Games of Chance / Lottery', rate: '20%',  schedule: 'D', source: 'Art. 58', withheld: true,  color: 'bg-orange-50 border-orange-200 text-orange-800' },
  { key: 'REPATRIATED_PROFIT',          label: 'Repatriated Branch Profit', rate: '15%',  schedule: 'D', source: 'Art. 60', withheld: false, color: 'bg-teal-50 border-teal-200 text-teal-800' },
  { key: 'UNDISTRIBUTED_PROFIT',        label: 'Undistributed Profit',      rate: '15%',  schedule: 'D', source: 'Art. 61', withheld: false, color: 'bg-teal-50 border-teal-200 text-teal-800' },
  { key: 'MANAGEMENT_FEES',             label: 'Management Fees (NR)',      rate: '15%',  schedule: 'D', source: 'Art. 62', withheld: true,  color: 'bg-white border-slate-200 text-slate-700' },
  { key: 'TECHNICAL_FEES',              label: 'Technical Fees (NR)',       rate: '15%',  schedule: 'D', source: 'Art. 62', withheld: true,  color: 'bg-white border-slate-200 text-slate-700' },
];

// -- Schedule D Calculator Tab ------------------------------------------------
const ScheduleDCalculator: React.FC = () => {
  const [taxType, setTaxType] = useState<ScheduleDTaxType>('DIVIDEND');
  const [amount, setAmount]   = useState('');

  const result = amount ? calculateScheduleD(parseFloat(amount) || 0, taxType) : null;
  const cfg    = SCHEDULE_D_RATES[taxType];

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="ovds-grid-layout cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Tax Type</label>
          <select
            value={taxType}
            onChange={e => setTaxType(e.target.value as ScheduleDTaxType)}
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20"
          >
            {SCHEDULE_D_DISPLAY.map(d => (
              <option key={d.key} value={d.key}>{d.label} ({d.rate})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Gross Amount (ETB)</label>
          <input
            type="number" min="0" step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20"
          />
        </div>
      </div>

      <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
        <p><strong>Rate:</strong> {(SCHEDULE_D_RATES[taxType].rate * 100).toFixed(0)}% · <strong>Proclamation:</strong> No. 1395/2025 {cfg.proclamationRef.split('Proc. 1395/2025 ')[1] ?? ''}</p>
        <p className="text-slate-400">{cfg.notes}</p>
        <p><strong>WHT at source:</strong> {cfg.withheldAtSource ? '✅ Yes — payer deducts and remits' : '❌ No — taxpayer self-declares'}</p>
      </div>

      {result && parseFloat(amount) > 0 && (
        <div className="ovds-grid-layout cols-3">
          {[
            { label: 'Gross Amount',  value: result.grossAmount, color: 'text-slate-800' },
            { label: 'Tax Amount',    value: result.taxAmount,   color: 'text-rose-700' },
            { label: 'Net Amount',    value: result.netAmount,   color: 'text-[var(--pro-azure-dark)]' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
              <p className={`text-xl font-bold tabular-nums ${c.color}`}>ETB {fmt(c.value)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// -- Capital Gains Calculator -------------------------------------------------
const CapitalGainsCalc: React.FC = () => {
  const [cost, setCost]         = useState('');
  const [proceeds, setProceeds] = useState('');
  const [assetType, setAssetType] = useState<CapitalGainsAssetType>('SHARES');

  const result = (cost || proceeds)
    ? calculateCapitalGains(parseFloat(cost) || 0, parseFloat(proceeds) || 0, assetType)
    : null;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="ovds-grid-layout cols-3">
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Asset Type</label>
          <select value={assetType} onChange={e => setAssetType(e.target.value as CapitalGainsAssetType)}
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400/20">
            <option value="SHARES">Shares</option>
            <option value="BONDS">Bonds</option>
            <option value="IMMOVABLE_PROPERTY">Immovable Property</option>
            <option value="OTHER_SECURITIES">Other Securities</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Acquisition Cost (ETB)</label>
          <input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400/20" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Disposal Proceeds (ETB)</label>
          <input type="number" min="0" step="0.01" value={proceeds} onChange={e => setProceeds(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400/20" />
        </div>
      </div>
      {result && (
        <div className="space-y-3">
          {!result.applicable && (
            <div className="px-4 py-3 bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-xl text-sm text-[var(--pro-azure-dark)]">
              ✅ No capital gain — disposal proceeds do not exceed acquisition cost.
            </div>
          )}
          <div className="ovds-grid-layout cols-4">
            {[
              { label: 'Capital Gain',    value: result.capitalGain,   color: result.capitalGain > 0 ? 'text-amber-700' : 'text-slate-400' },
              { label: 'CGT Rate',        value: NaN,                  color: 'text-violet-700',  display: '15%' },
              { label: 'CGT Amount',      value: result.taxAmount,     color: 'text-rose-700' },
              { label: 'Net Proceeds',    value: result.netProceeds,   color: 'text-[var(--pro-azure-dark)]' },
            ].map(c => (
              <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                <p className={`text-lg font-bold tabular-nums ${c.color}`}>
                  {c.display ?? `ETB ${fmt(c.value)}`}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">Proclamation No. 1395/2025 Art. 59 — 15% on gain from disposal of shares, bonds, or immovable assets</p>
        </div>
      )}
    </div>
  );
};

// -- Rental Income Tax Calculator (Schedule B) --------------------------------
const RentalTaxCalc: React.FC = () => {
  const [taxpayerType, setTaxpayerType] = useState<'INDIVIDUAL' | 'CORPORATE'>('INDIVIDUAL');
  const [grossRent, setGrossRent]       = useState('');
  const [useActual, setUseActual]       = useState(false);
  const [actualExp, setActualExp]       = useState('');

  const grossNum  = parseFloat(grossRent) || 0;
  const actualNum = useActual ? (parseFloat(actualExp) || 0) : undefined;

  const individualResult = grossNum > 0
    ? calculateRentalIncomeTax(grossNum, actualNum)
    : null;
  const corporateResult = grossNum > 0
    ? calculateCorporateRentalTax(grossNum - (actualNum ?? grossNum * RENTAL_ALLOWABLE_EXPENSE_PCT))
    : null;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Taxpayer type */}
      <div className="ovds-grid-layout cols-2">
        {([
          { type: 'INDIVIDUAL' as const, label: 'Individual Landlord', sub: 'Progressive 0–35%' },
          { type: 'CORPORATE'  as const, label: 'Company / Body',       sub: 'Flat 30%' },
        ]).map(opt => (
          <button key={opt.type} onClick={() => setTaxpayerType(opt.type)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${taxpayerType === opt.type ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/20 dark:border-[var(--pro-azure-light)]' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{opt.label}</p>
            <p className="ovds-caption">{opt.sub}</p>
          </button>
        ))}
      </div>

      <div className="ovds-grid-layout cols-2">
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Annual Gross Rental Income (ETB)</label>
          <input type="number" min="0" step="0.01" value={grossRent} onChange={e => setGrossRent(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20" />
        </div>
        {useActual && (
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Actual Allowable Expenses (ETB)</label>
            <input type="number" min="0" step="0.01" value={actualExp} onChange={e => setActualExp(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20" />
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
        <input type="checkbox" checked={useActual} onChange={e => setUseActual(e.target.checked)} className="rounded accent-indigo-500" />
        Use actual documented expenses instead of 40% standard deduction
      </label>

      {taxpayerType === 'INDIVIDUAL' && individualResult && grossNum > 0 && (
        <div className="space-y-3">
          <div className="ovds-grid-layout cols-4">
            {[
              { label: 'Gross Rent',          value: individualResult.grossRent },
              { label: 'Deductible Expenses', value: individualResult.deductibleExpenses },
              { label: 'Net Rental Income',   value: individualResult.netRentalIncome },
              { label: 'Tax Payable',         value: individualResult.taxPayable },
            ].map((c, i) => (
              <div key={c.label} className={`border rounded-xl p-4 text-center ${i === 3 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                <p className={`text-lg font-bold tabular-nums ${i === 3 ? 'text-rose-700' : 'text-slate-800'}`}>ETB {fmt(c.value)}</p>
              </div>
            ))}
          </div>
          {individualResult.bracket && (
            <p className="text-[11px] text-slate-400">
              Bracket applied: {(individualResult.bracket.rate * 100).toFixed(0)}% · Effective rate: {(individualResult.effectiveRate * 100).toFixed(1)}%
            </p>
          )}
        </div>
      )}

      {taxpayerType === 'CORPORATE' && corporateResult && grossNum > 0 && (
        <div className="ovds-grid-layout cols-3">
          {[
            { label: 'Net Rental Income', value: corporateResult.netRentalIncome, color: 'text-slate-800' },
            { label: 'Tax Rate',          value: NaN, display: '30% flat',          color: 'text-violet-700' },
            { label: 'Tax Payable',       value: corporateResult.taxPayable,         color: 'text-rose-700' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
              <p className={`text-xl font-bold tabular-nums ${c.color}`}>
                {c.display ?? `ETB ${fmt(c.value)}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Bracket table */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="ovds-widget-header"><h3 className="ovds-card-title">Individual Rental Income Brackets</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                {['Annual Net Income (ETB)', 'Rate', 'Deduction', 'Formula'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left ovds-label">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RENTAL_INCOME_BRACKETS.map((b: typeof RENTAL_INCOME_BRACKETS[number], i: number) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-mono text-slate-600">
                    {fmt(b.min)} – {b.max === Infinity ? '∞' : fmt(b.max)}
                  </td>
                  <td className="px-4 py-2.5 font-bold text-[var(--pro-azure-dark)]">{(b.rate * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{fmt(b.deduction)}</td>
                  <td className="px-4 py-2.5 text-slate-400">
                    {b.rate === 0 ? 'Nil' : `Income × ${(b.rate * 100).toFixed(0)}% − ${fmt(b.deduction)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -- Customs Duty Calculator --------------------------------------------------
const CustomsDutyCalc: React.FC = () => {
  const [cifValue, setCifValue]         = useState('');
  const [dutyRate, setDutyRate]         = useState('0.10');
  const [exciseDuty, setExciseDuty]     = useState('');
  const [applyVat, setApplyVat]         = useState(true);

  const cif    = parseFloat(cifValue)  || 0;
  const rate   = parseFloat(dutyRate)  || 0;
  const excise = parseFloat(exciseDuty) || 0;

  const result = cif > 0 ? calculateCustomsDuty(cif, rate) : null;
  const surtax = cif > 0 ? (cif + (result?.customsDutyAmount ?? 0) + excise) * 0.10 : 0;
  const vatBase = cif + (result?.customsDutyAmount ?? 0) + excise + surtax;
  const vatAmount = applyVat ? vatBase * 0.15 : 0;
  const totalBurden = (result?.customsDutyAmount ?? 0) + excise + surtax + vatAmount;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="ovds-grid-layout cols-2">
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">CIF Value (ETB)</label>
          <input type="number" min="0" step="0.01" value={cifValue} onChange={e => setCifValue(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/20" />
          <p className="text-[10px] text-slate-400 mt-1">Cost + Insurance + Freight at Ethiopian customs</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Customs Duty Rate</label>
          <select value={dutyRate} onChange={e => setDutyRate(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/20">
            {CUSTOMS_DUTY_BANDS.map((b: typeof CUSTOMS_DUTY_BANDS[number]) => (
              <option key={b.rate} value={b.rate}>{(b.rate * 100).toFixed(0)}% — {b.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Excise Duty (ETB, if applicable)</label>
          <input type="number" min="0" step="0.01" value={exciseDuty} onChange={e => setExciseDuty(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
        <input type="checkbox" checked={applyVat} onChange={e => setApplyVat(e.target.checked)} className="rounded accent-sky-500" />
        Apply VAT 15% on (CIF + Customs + Excise + Surtax)
      </label>
      {result && cif > 0 && (
        <div className="space-y-3">
          <div className="ovds-grid-layout cols-3">
            {[
              { label: 'Customs Duty',     value: result.customsDutyAmount, color: 'text-amber-700' },
              { label: 'Import Surtax 10%',value: surtax,                   color: 'text-orange-700' },
              { label: 'VAT on Import',    value: vatAmount,                 color: 'text-violet-700' },
            ].map(c => (
              <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                <p className={`text-lg font-bold tabular-nums ${c.color}`}>ETB {fmt(c.value)}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-5 py-4 bg-slate-800 dark:bg-slate-700 rounded-xl">
            <span className="text-sm font-bold text-white">Total Tax Burden on Import</span>
            <span className="text-2xl font-black text-[var(--pro-azure-light)] tabular-nums">ETB {fmt(totalBurden)}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Formula: Customs (CIF × rate) + Excise + Surtax 10% (CIF + Customs + Excise) + VAT 15% (all above)
          </p>
        </div>
      )}
      {/* Rate reference table */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="ovds-widget-header"><h3 className="ovds-card-title">Customs Tariff Bands</h3></div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {CUSTOMS_DUTY_BANDS.map((b: typeof CUSTOMS_DUTY_BANDS[number]) => (
            <div key={b.rate} className="flex items-center justify-between px-5 py-3">
              <span className="text-[12px] text-slate-600 dark:text-slate-300">{b.label}</span>
              <span className="text-sm font-bold text-sky-700 dark:text-sky-400">{(b.rate * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// -- Rate Reference Tab -------------------------------------------------------
const RateReferenceTab: React.FC = () => (
  <div className="space-y-5">
    {/* Schedule D grid */}
    <div>
      <p className="ovds-section-title mb-3">Schedule D — Flat Rate Taxes (Proclamation No. 1395/2025)</p>
      <div className="ovds-grid-layout cols-3">
        {SCHEDULE_D_DISPLAY.map(d => (
          <div key={d.key} className={`p-4 rounded-xl border ${d.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{d.schedule}</span>
              <span className="text-lg font-black tabular-nums">{d.rate}</span>
            </div>
            <p className="text-xs font-bold leading-tight">{d.label}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[9px] font-mono opacity-60">{d.source}</span>
              <span className="text-[9px] font-semibold">
                {d.withheld ? '🏦 WHT at source' : '📋 Self-declare'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Schedule B — Rental */}
    <div>
      <p className="ovds-section-title mb-3">Schedule B — Rental Income Tax</p>
      <div className="ovds-grid-layout cols-2">
        <div className="p-4 rounded-xl border bg-sky-50 border-sky-200">
          <p className="text-xs font-bold text-sky-800 mb-1">Individual Landlord</p>
          <p className="text-lg font-black text-sky-700">0 – 35%</p>
          <p className="text-[10px] text-sky-600 mt-1">Progressive brackets · 40% standard expense deduction</p>
          <p className="text-[9px] font-mono text-sky-500 mt-1">Proc. 1395/2025 Art. 35–40</p>
        </div>
        <div className="p-4 rounded-xl border bg-violet-50 border-violet-200">
          <p className="text-xs font-bold text-violet-800 mb-1">Corporate / Body Rental Income</p>
          <p className="text-lg font-black text-violet-700">{(CORPORATE_RENTAL_RATE * 100).toFixed(0)}%</p>
          <p className="text-[10px] text-violet-600 mt-1">Flat rate on net rental income</p>
          <p className="text-[9px] font-mono text-violet-500 mt-1">Proc. 1395/2025 Art. 41</p>
        </div>
      </div>
    </div>

    {/* Import taxes */}
    <div>
      <p className="ovds-section-title mb-3">Import / Trade Taxes</p>
      <div className="ovds-grid-layout cols-3">
        {[
          { label: 'Customs Duty',       rate: '0–35%',  note: 'On CIF value, HS code dependent',       color: 'bg-amber-50 border-amber-200 text-amber-800' },
          { label: 'Import Surtax',      rate: '10%',    note: 'On CIF + Customs Duty + Excise',         color: 'bg-orange-50 border-orange-200 text-orange-800' },
          { label: 'VAT on Import',      rate: '15%',    note: 'On CIF + Customs + Excise + Surtax',     color: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' },
        ].map(t => (
          <div key={t.label} className={`p-4 rounded-xl border ${t.color}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">Import</p>
            <p className="text-lg font-black mt-1">{t.rate}</p>
            <p className="text-xs font-bold mt-1">{t.label}</p>
            <p className="text-[10px] opacity-70 mt-1">{t.note}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// -- Records Tab — Filed Schedule D Transactions --------------------------------
const RecordsTab: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const [records, setRecords]   = useState<ScheduleDTaxRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [busyId,   setBusyId]   = useState<string | null>(null);
  const [form, setForm] = useState({
    taxType:      'DIVIDEND' as ScheduleDTaxType,
    period:       new Date().toISOString().slice(0, 7),
    grossAmount:  '',
    payerName:    '',
    payerTin:     '',
    notes:        '',
  });

  const load = () => {
    setLoading(true);
    const q = companyId ? `?companyId=${companyId}` : '';
    api.get(`/tax/schedule-d${q}`, { headers: { 'x-background': '1' } } as any)
      .then((r: any) => setRecords(Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [companyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(form.grossAmount) || 0;
    if (!gross) { toast.error('Enter gross amount'); return; }
    setSaving(true);
    try {
      const cfg = SCHEDULE_D_RATES[form.taxType];
      await api.post('/tax/schedule-d', {
        taxType:        form.taxType,
        period:         form.period,
        grossAmount:    gross,
        taxRate:        cfg.rate,
        taxAmount:      Math.round(gross * cfg.rate * 100) / 100,
        netAmount:      Math.round(gross * (1 - cfg.rate) * 100) / 100,
        withheldAtSource: cfg.withheldAtSource,
        payerName:      form.payerName || undefined,
        payerTin:       form.payerTin  || undefined,
        notes:          form.notes     || undefined,
        status:         'DRAFT',
        companyId,
      });
      toast.success('Record saved');
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async (r: ScheduleDTaxRecord) => {
    if (!window.confirm(`File & mark Schedule D (${r.taxType}) as paid?`)) return;
    setBusyId(r.id);
    try {
      await api.post(`/tax/schedule-d/${r.id}/pay`, {
        paymentReference: `SD-PAY-${r.id.slice(0, 8).toUpperCase()}`,
        ercaReference: r.ercaReference ?? undefined,
      });
      toast.success('Filing marked as paid / filed');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to file');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (r: ScheduleDTaxRecord) => {
    if (!window.confirm(`Delete draft Schedule D (${r.taxType})? This cannot be undone.`)) return;
    setBusyId(r.id);
    try {
      await api.delete(`/tax/schedule-d/${r.id}`, {
        ...(companyId ? { params: { companyId } } : {}),
      } as any);
      toast.success('Record deleted');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  };

  const STATUS_CLS: Record<string, string> = {
    DRAFT:  'bg-slate-100 text-slate-600 border-slate-200',
    FILED:  'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
    PAID:   'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
    EXEMPT: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const inp = 'w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400/20';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="ovds-section-title">Filed Schedule D Transactions</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <Icon name="PLUS" size={12} />
          New Record
        </button>
      </div>

      {/* New record form */}
      {showForm && (
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header">
            <h3 className="ovds-card-title">New Schedule D Record</h3>
          </div>
          <form onSubmit={(e) => void handleSave(e)} className="p-5 space-y-4">
            <div className="ovds-grid-layout cols-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Tax Type</label>
                <select value={form.taxType} onChange={e => setForm(p => ({ ...p, taxType: e.target.value as ScheduleDTaxType }))} className={inp}>
                  {SCHEDULE_D_DISPLAY.map(d => (
                    <option key={d.key} value={d.key}>{d.label} ({d.rate})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Period (YYYY-MM)</label>
                <input type="month" value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Gross Amount (ETB)</label>
                <input type="number" min="0" step="0.01" value={form.grossAmount} onChange={e => setForm(p => ({ ...p, grossAmount: e.target.value }))} placeholder="0.00" className={inp} required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Payer Name</label>
                <input type="text" value={form.payerName} onChange={e => setForm(p => ({ ...p, payerName: e.target.value }))} placeholder="Optional" className={inp} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Payer TIN</label>
                <input type="text" value={form.payerTin} onChange={e => setForm(p => ({ ...p, payerTin: e.target.value }))} placeholder="Optional" className={inp} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" className={inp} />
              </div>
            </div>
            {/* Tax preview */}
            {parseFloat(form.grossAmount) > 0 && (() => {
              const result = calculateScheduleD(parseFloat(form.grossAmount), form.taxType);
              return (
                <div className="flex items-center gap-6 px-4 py-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl text-xs">
                  <span className="text-slate-500">Rate: <strong className="text-violet-700">{(result.taxRate * 100).toFixed(0)}%</strong></span>
                  <span className="text-slate-500">Tax: <strong className="text-rose-700">ETB {fmt(result.taxAmount)}</strong></span>
                  <span className="text-slate-500">Net: <strong className="text-[var(--pro-azure-dark)]">ETB {fmt(result.netAmount)}</strong></span>
                  <span className="text-[10px] text-slate-400">{SCHEDULE_D_RATES[form.taxType].withheldAtSource ? '🏦 WHT at source' : '📋 Self-declare'}</span>
                </div>
              );
            })()}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2">
                {saving && <Icon name="REFRESH" size={12} className="animate-spin" />}
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records table */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="ovds-empty py-12">
          <Icon name="CLIPBOARD_LIST" size={24} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No records yet</p>
          <p className="ovds-caption mt-1">Add your first Schedule D filing to track dividend, capital gains, and other income taxes.</p>
        </div>
      ) : (
        <div className="ovds-widget-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                   {['Period', 'Tax Type', 'Gross Amount', 'Tax Amount', 'Net Amount', 'Payer', 'WHT', 'Status', 'Actions'].map(h => (
                     <th key={h} className="px-4 py-3 text-left ovds-label">{h}</th>
                   ))}
                </tr>
              </thead>
              <tbody>
                {records.map(r => {
                  const display = SCHEDULE_D_DISPLAY.find(d => d.key === r.taxType);
                  return (
                    <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono text-slate-500">{r.period}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${display?.color ?? 'bg-white border-slate-200 text-slate-600'}`}>
                          {display?.label ?? r.taxType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200 text-right">ETB {fmt(r.grossAmount)}</td>
                      <td className="px-4 py-3 font-mono text-rose-600 dark:text-rose-400 text-right">ETB {fmt(r.taxAmount)}</td>
                      <td className="px-4 py-3 font-mono text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] text-right">ETB {fmt(r.netAmount)}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{r.payerName ?? '—'}</td>
                      <td className="px-4 py-3 text-center">{r.withheldAtSource ? <span className="text-[var(--pro-azure)]">✓</span> : <span className="text-slate-300">—</span>}</td>
                       <td className="px-4 py-3">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_CLS[r.status] ?? STATUS_CLS.DRAFT}`}>
                           {r.status}
                         </span>
                       </td>
                       <td className="px-4 py-3">
                         <div className="flex items-center gap-2">
                           {r.status !== 'PAID' && (
                             <button
                               onClick={() => void handlePay(r)}
                               disabled={busyId === r.id}
                               className="text-[10px] font-bold px-2 py-1 rounded border border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] hover:bg-[var(--pro-azure-50)] disabled:opacity-50 transition-colors"
                             >
                               File / Pay
                             </button>
                           )}
                           {r.status === 'DRAFT' && (
                             <button
                               onClick={() => void handleDelete(r)}
                               disabled={busyId === r.id}
                               className="text-[10px] font-bold px-2 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                             >
                               Delete
                             </button>
                           )}
                         </div>
                       </td>
                     </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-white dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                  <td colSpan={2} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Totals ({records.length} records)</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200 text-right">
                    ETB {fmtK(records.reduce((s, r) => s + r.grossAmount, 0))}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-rose-600 dark:text-rose-400 text-right">
                    ETB {fmtK(records.reduce((s, r) => s + r.taxAmount, 0))}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] text-right">
                    ETB {fmtK(records.reduce((s, r) => s + r.netAmount, 0))}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// -- Main page ----------------------------------------------------------------
type TabKey = 'rates' | 'schedule_d_calc' | 'capital_gains' | 'rental' | 'customs' | 'records';

const ScheduleDTax: React.FC = () => {
  usePageTitle('Schedule D & Other Taxes');
  const { selectedCompanyId } = useBusiness();
  const [activeTab, setActiveTab] = useState<TabKey>('rates');

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'rates',          label: 'Rate Reference' },
    { key: 'schedule_d_calc',label: 'Schedule D Calculator' },
    { key: 'capital_gains',  label: 'Capital Gains' },
    { key: 'rental',         label: 'Rental Income Tax' },
    { key: 'customs',        label: 'Customs & Import Duty' },
    { key: 'records',        label: 'Filed Records' },
  ];

  return (
    <AppPage
      title="Schedule D & Other Taxes"
      subtitle="Dividends, Capital Gains, Royalties, Digital Content, Rental, Customs · Proclamation No. 1395/2025 · Banking & ovds · Investment Trends · Market Value · Revenue"
      icon={<span className="text-white text-xs font-black">D</span>}
      iconBg="bg-violet-500"
      crumbs={[{ label: 'Tax & Compliance', to: '/tax/dashboard' }, { label: 'Schedule D' }]}
      tabs={
        <AppTabs
          tabs={TABS.map(t => ({ key: t.key, label: t.label }))}
          active={activeTab}
          onChange={k => setActiveTab(k as TabKey)}
        />
      }
    >
      {activeTab === 'rates'          && <RateReferenceTab />}
      {activeTab === 'schedule_d_calc'&& <ScheduleDCalculator />}
      {activeTab === 'capital_gains'  && <CapitalGainsCalc />}
      {activeTab === 'rental'         && <RentalTaxCalc />}
      {activeTab === 'customs'        && <CustomsDutyCalc />}
      {activeTab === 'records'        && <RecordsTab companyId={selectedCompanyId ?? undefined} />}
    </AppPage>
  );
};

export default ScheduleDTax;
