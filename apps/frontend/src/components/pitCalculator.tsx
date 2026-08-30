/**
 * PITCalculator — Ethiopian Personal Income Tax calculator widget.
 * Computes PIT, pension (7%/11%), and net pay from gross salary.
 * Can be embedded in Payroll page or used as a standalone modal.
 */
import React, { useState, useMemo } from 'react';
import { Calculator, ChevronDown, ChevronUp, Info, PiggyBank, Banknote, Wallet } from 'lucide-react';
import { calculatePIT as _calculatePIT } from '../utils/ethiopianTax';
const calculatePIT = (gross: number, er?: number, eer?: number) =>
  _calculatePIT(gross, (er ?? 0.07) as Parameters<typeof _calculatePIT>[1], (eer ?? 0.11) as Parameters<typeof _calculatePIT>[2]);
import { fmtDecimal } from '../utils/fmt';

const fmt = fmtDecimal;

const PIT_BRACKETS_INFO = [
  { range: '0 – 2,000', rate: '0%', deduction: 0, color: 'text-emerald-600 dark:text-emerald-400' },
  { range: '2,001 – 4,000', rate: '15%', deduction: 300, color: 'text-emerald-600 dark:text-emerald-400' },
  { range: '4,001 – 7,000', rate: '20%', deduction: 500, color: 'text-teal-600 dark:text-teal-400' },
  { range: '7,001 – 10,000', rate: '25%', deduction: 850, color: 'text-violet-600 dark:text-violet-400' },
  { range: '10,001 – 14,000', rate: '30%', deduction: 1350, color: 'text-amber-600 dark:text-amber-400' },
  { range: '> 14,000', rate: '35%', deduction: 2050, color: 'text-rose-600 dark:text-rose-400' },
];

interface PITCalculatorProps {
  defaultGross?: number;
  compact?: boolean;
  onClose?: () => void;
}

const PITCalculator: React.FC<PITCalculatorProps> = ({
  defaultGross = 0,
  compact = false,
  onClose,
}) => {
  const [gross, setGross] = useState(defaultGross > 0 ? String(defaultGross) : '');
  const [pensionRate, setPensionRate] = useState(0.07);
  const [employerPensionRate, setEmployerPensionRate] = useState(0.11);
  const [showBrackets, setShowBrackets] = useState(false);

  const grossNum = parseFloat(gross) || 0;

  const result = useMemo(() => {
    const pitRes = calculatePIT(grossNum, pensionRate, employerPensionRate);
    return {
      pit: pitRes.incomeTax,
      employeePension: pitRes.pensionEmployee,
      employerPension: pitRes.pensionEmployer,
      drrf: pitRes.drrf,
      totalDeductions: pitRes.pensionEmployee + pitRes.incomeTax + pitRes.drrf,
      netPay: pitRes.netSalary,
      effectiveRate: pitRes.effectiveRate * 100,
      taxableIncome: pitRes.taxableIncome,
    };
  }, [grossNum, pensionRate, employerPensionRate]);

  // Find which bracket applies — updated for Proclamation No. 1395/2025
  const activeBracket = useMemo(() => {
    const taxable = result.taxableIncome;
    if (taxable <= 2000) return 0;
    if (taxable <= 4000) return 1;
    if (taxable <= 7000) return 2;
    if (taxable <= 10000) return 3;
    if (taxable <= 14000) return 4;
    return 5;
  }, [result.taxableIncome]);

  const bars = [
    {
      label: 'Net Pay',
      value: result.netPay,
      pct: grossNum > 0 ? (result.netPay / grossNum) * 100 : 0,
      color: 'bg-emerald-500',
    },
    {
      label: 'Income Tax',
      value: result.pit,
      pct: grossNum > 0 ? (result.pit / grossNum) * 100 : 0,
      color: 'bg-rose-400',
    },
    {
      label: 'Pension (Emp)',
      value: result.employeePension,
      pct: grossNum > 0 ? (result.employeePension / grossNum) * 100 : 0,
      color: 'bg-amber-400',
    },
    {
      label: 'DRRF',
      value: result.drrf,
      pct: grossNum > 0 ? (result.drrf / grossNum) * 100 : 0,
      color: 'bg-orange-400',
    },
  ];

  return (
    <div className={`ovds-widget-card shadow-sm overflow-hidden ${compact ? '' : 'max-w-md'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center">
            <Calculator size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">PIT Calculator</p>
            <p className="ovds-caption">Ethiopian 2026 brackets</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <ChevronUp size={14} />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Gross input */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Gross Monthly Salary (ETB)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ETB</span>
            <input
              type="number"
              value={gross}
              onChange={e => setGross(e.target.value)}
              placeholder="e.g. 8,500"
              className="w-full pl-12 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
            />
          </div>
        </div>

        {/* Pension rates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Employee Pension %
            </label>
            <input
              type="number"
              value={pensionRate * 100}
              onChange={e => setPensionRate(Number(e.target.value) / 100)}
              min={0} max={20} step={0.5}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Employer Pension %
            </label>
            <input
              type="number"
              value={employerPensionRate * 100}
              onChange={e => setEmployerPensionRate(Number(e.target.value) / 100)}
              min={0} max={20} step={0.5}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400"
            />
          </div>
        </div>

        {/* Results */}
        {grossNum > 0 && (
          <>
            {/* Stacked bar */}
            <div>
              <div className="flex h-3 rounded-full overflow-hidden gap-px mb-2">
                {bars.map(b => (
                  <div
                    key={b.label}
                    className={`${b.color} transition-all duration-500`}
                    style={{ width: `${b.pct}%` }}
                    title={`${b.label}: ETB ${fmt(b.value)}`}
                  />
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                {bars.map(b => (
                  <div key={b.label} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${b.color}`} />
                    <span className="ovds-caption">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              {[
                { label: 'Gross Salary', value: grossNum, color: 'text-slate-700 dark:text-slate-200', icon: <Banknote size={12} /> },
                { label: `Income Tax (PIT — ${result.effectiveRate.toFixed(1)}% effective)`, value: result.pit, color: 'text-rose-600 dark:text-rose-400', icon: <Calculator size={12} />, negative: true },
                { label: `Employee Pension (${(pensionRate * 100).toFixed(0)}%)`, value: result.employeePension, color: 'text-amber-600 dark:text-amber-400', icon: <PiggyBank size={12} />, negative: true },
                { label: 'DRRF (1%)', value: result.drrf, color: 'text-orange-600 dark:text-orange-400', icon: <Info size={12} />, negative: true },
                { label: `Employer Pension (${(employerPensionRate * 100).toFixed(0)}%)`, value: result.employerPension, color: 'text-orange-600 dark:text-orange-400', icon: <PiggyBank size={12} />, note: 'employer cost' },
                { label: 'Net Pay', value: result.netPay, color: 'text-emerald-600 dark:text-emerald-400', icon: <Wallet size={12} />, bold: true },
              ].map(item => (
                <div key={item.label} className={`flex items-center justify-between px-3 py-2 rounded-xl ${item.bold ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40' : 'bg-white dark:bg-slate-800/50'}`}>
                  <div className="flex items-center gap-2">
                    <span className={item.color}>{item.icon}</span>
                    <span className={`text-xs ${item.bold ? 'font-semibold' : 'font-semibold'} text-slate-600 dark:text-slate-300`}>
                      {item.label}
                    </span>
                    {item.note && <span className="ovds-caption">({item.note})</span>}
                  </div>
                  <span className={`text-xs font-semibold tabular-nums ${item.color}`}>
                    {item.negative ? '−' : ''}{item.note ? '+' : ''}ETB {fmt(item.value)}
                  </span>
                </div>
              ))}
            </div>

            {/* Active bracket indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${PIT_BRACKETS_INFO[activeBracket].color.replace('text-', 'border-').replace('dark:', 'dark:border-')} bg-current/5`}>
              <Info size={12} className={PIT_BRACKETS_INFO[activeBracket].color} />
              <span className={`text-[10px] font-bold ${PIT_BRACKETS_INFO[activeBracket].color}`}>
                Active bracket: {PIT_BRACKETS_INFO[activeBracket].range} ETB @ {PIT_BRACKETS_INFO[activeBracket].rate}
              </span>
            </div>
          </>
        )}

        {/* Brackets toggle */}
        <button
          onClick={() => setShowBrackets(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-500 dark:text-slate-400"
        >
          <span>Ethiopian PIT Brackets 2026</span>
          {showBrackets ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showBrackets && (
          <div className="space-y-1 animate-in fade-in duration-150">
            {PIT_BRACKETS_INFO.map((b, i) => (
              <div
                key={b.range}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${i === activeBracket && grossNum > 0 ? 'ring-1 ring-current/30 bg-current/5' : 'bg-white dark:bg-slate-800/50'}`}
              >
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">{b.range} ETB</span>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-semibold ${b.color}`}>{b.rate}</span>
                  {b.deduction > 0 && <span className="text-[8px] text-slate-400">− {b.deduction} ded.</span>}
                </div>
              </div>
            ))}
            <p className="text-[9px] text-slate-400 px-1 pt-1">
              Pension: Employee {(pensionRate * 100).toFixed(0)}% + Employer {(employerPensionRate * 100).toFixed(0)}% of gross salary
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PITCalculator;






