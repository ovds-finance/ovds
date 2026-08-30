/**
 * ERCA Penalty & Interest Calculator
 *
 * Computes late filing penalties and interest for Ethiopian taxes:
 *   VAT   — 2% per month on unpaid tax (capped at 20 months)
 *   BIT   — 5% penalty for late filing + 2% per month interest
 *   DRRF  — 5% flat penalty on overdue levy
 *   WHT   — 5% flat penalty + 2% per month interest
 *   TOT   — 2% per month
 *   PIT   — same as BIT brackets
 *
 * References:
 *   Federal Income Tax Proclamation No. 979/2016 Art. 96–103
 *   VAT Proclamation No. 1341/2024 Art. 50–52
 *   ERCA Regulation No. 410/2017
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle, Calculator, RefreshCw, Download, Info,
  CheckCircle, FileText, Shield, Server,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr, Btn,
  FormField, Input, Select,
} from '../components/ui';
import toast from 'react-hot-toast';
import { calculatePenaltyApi, type PenaltyCalcResult } from '../services/newTaxApi';

// -- Tax type config ------------------------------------------------------------

const TAX_TYPES = [
  {
    id:          'VAT',
    label:       'VAT (Output VAT)',
    filingDue:   30,   // 30th of following month
    latePenalty: 0,    // no flat penalty for VAT — only monthly interest
    monthlyRate: 0.02, // 2% per month
    cap:         20,   // capped at 20 months
    ref:         'VAT Proc. 1341/2024 Art. 52',
  },
  {
    id:          'BIT',
    label:       'Business Income Tax (BIT)',
    filingDue:   90,   // 90 days after fiscal year end
    latePenalty: 0.05, // 5% flat on tax due
    monthlyRate: 0.02,
    cap:         24,
    ref:         'FITP 979/2016 Art. 96',
  },
  {
    id:          'WHT',
    label:       'Withholding Tax (WHT)',
    filingDue:   30,
    latePenalty: 0.05,
    monthlyRate: 0.02,
    cap:         24,
    ref:         'FITP 979/2016 Art. 97',
  },
  {
    id:          'DRRF',
    label:       'Disaster Risk Reduction Fund (DRRF)',
    filingDue:   30,
    latePenalty: 0.05,
    monthlyRate: 0.02,
    cap:         12,
    ref:         'DRRF Regulation 2020',
  },
  {
    id:          'TOT',
    label:       'Turnover Tax (TOT)',
    filingDue:   30,
    latePenalty: 0,
    monthlyRate: 0.02,
    cap:         20,
    ref:         'FITP 979/2016 Art. 98',
  },
  {
    id:          'PIT',
    label:       'Personal Income Tax (PIT / Payroll)',
    filingDue:   30,
    latePenalty: 0.05,
    monthlyRate: 0.02,
    cap:         24,
    ref:         'FITP 979/2016 Art. 96',
  },
  {
    id:          'PENSION',
    label:       'Pension Contribution',
    filingDue:   15,   // 15th of following month
    latePenalty: 0.05,
    monthlyRate: 0.02,
    cap:         12,
    ref:         'Proclamation 1268/2023 Art. 22',
  },
] as const;

type TaxTypeId = typeof TAX_TYPES[number]['id'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n));

// -- Calculation logic ---------------------------------------------------------

interface CalcResult {
  taxType:         TaxTypeId;
  taxTypeLabel:    string;
  taxDue:          number;
  dueDate:         string;
  paymentDate:     string;
  daysLate:        number;
  monthsLate:      number;
  flatPenalty:     number;
  interestAmount:  number;
  totalPenalty:    number;
  totalOwed:       number;
  isOverdue:       boolean;
  ref:             string;
}

function calcPenalty(
  taxType: (typeof TAX_TYPES)[number],
  taxDue: number,
  dueDate: Date,
  paymentDate: Date,
): CalcResult {
  const msPerDay  = 1000 * 60 * 60 * 24;
  const daysLate  = Math.max(0, Math.floor((paymentDate.getTime() - dueDate.getTime()) / msPerDay));
  const monthsLate = Math.min(Math.ceil(daysLate / 30), taxType.cap);

  const flatPenalty    = daysLate > 0 ? taxDue * taxType.latePenalty : 0;
  const interestAmount = daysLate > 0 ? taxDue * taxType.monthlyRate * monthsLate : 0;
  const totalPenalty   = Math.round((flatPenalty + interestAmount) * 100) / 100;
  const totalOwed      = Math.round((taxDue + totalPenalty) * 100) / 100;

  return {
    taxType:      taxType.id as TaxTypeId,
    taxTypeLabel: taxType.label,
    taxDue,
    dueDate:      dueDate.toISOString().slice(0, 10),
    paymentDate:  paymentDate.toISOString().slice(0, 10),
    daysLate,
    monthsLate,
    flatPenalty:  Math.round(flatPenalty    * 100) / 100,
    interestAmount: Math.round(interestAmount * 100) / 100,
    totalPenalty,
    totalOwed,
    isOverdue:    daysLate > 0,
    ref:          taxType.ref,
  };
}

// -- Main component ------------------------------------------------------------

const ErcaPenaltyCalculator: React.FC = () => {
  usePageTitle('ERCA Penalty Calculator');

  const [taxTypeId,   setTaxTypeId]   = useState<TaxTypeId>('VAT');
  const [taxDue,      setTaxDue]      = useState('');
  const [dueDateStr,  setDueDateStr]  = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 30).toISOString().slice(0, 10)
  );
  const [payDateStr,  setPayDateStr]  = useState(new Date().toISOString().slice(0, 10));
  const [results,     setResults]     = useState<CalcResult[]>([]);
  const [useBackend,  setUseBackend]  = useState(false);
  const [verifying,   setVerifying]   = useState(false);

  const taxType = TAX_TYPES.find(t => t.id === taxTypeId)!;

  const calculate = useCallback(async () => {
    const amount = parseFloat(taxDue.replace(/,/g, ''));
    if (!amount || amount <= 0) { toast.error('Enter a valid tax amount'); return; }

    const due  = new Date(dueDateStr);
    const paid = new Date(payDateStr);
    if (isNaN(due.getTime()) || isNaN(paid.getTime())) { toast.error('Invalid dates'); return; }

    // If backend verification is on, call the authoritative server endpoint
    if (useBackend) {
      setVerifying(true);
      try {
        const serverResult: PenaltyCalcResult = await calculatePenaltyApi({
          taxType:     taxTypeId,
          taxDue:      amount,
          dueDate:     dueDateStr,
          paymentDate: payDateStr,
        });
        // Map server response to local CalcResult shape
        const mapped: CalcResult = {
          taxType:         serverResult.taxType as TaxTypeId,
          taxTypeLabel:    taxType.label,
          taxDue:          serverResult.taxDue,
          dueDate:         serverResult.dueDate,
          paymentDate:     serverResult.paymentDate,
          daysLate:        serverResult.daysLate,
          monthsLate:      serverResult.monthsLate,
          flatPenalty:     serverResult.flatPenalty,
          interestAmount:  serverResult.interestAmount,
          totalPenalty:    serverResult.totalPenalty,
          totalOwed:       serverResult.totalOwed,
          isOverdue:       serverResult.isOverdue,
          ref:             serverResult.legalReference,
        };
        setResults(prev => [mapped, ...prev.slice(0, 9)]);
        if (!mapped.isOverdue) {
          toast.success('No penalty — payment is on time or early (server-verified)');
        } else {
          toast.error(`Penalty: ETB ${fmt(mapped.totalPenalty)} (server-verified)`);
        }
        return;
      } catch {
        toast.error('Server verification failed — falling back to client calculation');
      } finally {
        setVerifying(false);
      }
    }

    // Client-side calculation (default)
    const result = calcPenalty(taxType, amount, due, paid);
    setResults(prev => [result, ...prev.slice(0, 9)]);

    if (!result.isOverdue) {
      toast.success('No penalty — payment is on time or early');
    } else {
      toast.error(`Penalty: ETB ${fmt(result.totalPenalty)} on top of ETB ${fmt(result.taxDue)}`);
    }
  }, [taxType, taxDue, dueDateStr, payDateStr]);

  const latest = results[0] ?? null;

  const kpiCells = useMemo(() => latest ? [
    { label: 'Tax Due',        value: `ETB ${fmt(latest.taxDue)}`,       color: 'slate'   as const },
    { label: 'Flat Penalty',   value: `ETB ${fmt(latest.flatPenalty)}`,   color: latest.flatPenalty > 0 ? 'rose' as const : 'emerald' as const },
    { label: 'Monthly Interest', value: `ETB ${fmt(latest.interestAmount)}`, color: latest.interestAmount > 0 ? 'amber' as const : 'emerald' as const },
    { label: 'Total Penalty',  value: `ETB ${fmt(latest.totalPenalty)}`,  color: latest.totalPenalty > 0 ? 'rose' as const : 'emerald' as const },
    { label: 'Total Owed',     value: `ETB ${fmt(latest.totalOwed)}`,     color: 'sky'     as const },
    { label: 'Days Late',      value: String(latest.daysLate),            color: latest.daysLate > 0 ? 'rose' as const : 'emerald' as const },
  ] : [], [latest]);

  const exportCsv = () => {
    const header = 'Tax Type,Tax Due,Due Date,Payment Date,Days Late,Months,Flat Penalty,Interest,Total Penalty,Total Owed\n';
    const rows   = results.map(r =>
      `"${r.taxTypeLabel}",${r.taxDue},"${r.dueDate}","${r.paymentDate}",${r.daysLate},${r.monthsLate},${r.flatPenalty},${r.interestAmount},${r.totalPenalty},${r.totalOwed}`
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `erca-penalties-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="ERCA Penalty Calculator"
      subtitle="Late filing penalties & interest per Ethiopian tax law"
      icon={<Calculator size={18} />}
      iconBg="bg-rose-500"
      crumbs={[{ label: 'Tax & Compliance' }, { label: 'Penalty Calculator' }]}
      actions={
        results.length > 0 ? (
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={exportCsv}>Export CSV</Btn>
        ) : null
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calculator panel */}
        <div className="lg:col-span-1 space-y-5">
          <div className="ovds-widget-card p-5 space-y-4">
            <p className="ovds-card-title">Calculate Penalty</p>

            <FormField label="Tax Type">
              <Select value={taxTypeId} onChange={e => setTaxTypeId(e as TaxTypeId)}>
                {TAX_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </FormField>

            <FormField label="Tax Amount Due (ETB)" required>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={taxDue}
                onChange={e => setTaxDue(e.target.value)}
                placeholder="0.00"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Due Date" hint="Original filing deadline">
                <Input type="date" value={dueDateStr} onChange={e => setDueDateStr(e.target.value)} />
              </FormField>
              <FormField label="Payment Date" hint="Actual or planned payment">
                <Input type="date" value={payDateStr} onChange={e => setPayDateStr(e.target.value)} />
              </FormField>
            </div>

            <button
              onClick={calculate}
              disabled={verifying}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {verifying
                ? <RefreshCw size={14} className="animate-spin" />
                : useBackend ? <Server size={14} /> : <Calculator size={14} />
              }
              {verifying ? 'Verifying with ERCA server…' : 'Calculate Penalty'}
            </button>

            {/* Backend verify toggle */}
            <label className="flex items-center justify-between cursor-pointer select-none mt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Server size={11} className="text-slate-400" />
                Verify with backend (authoritative)
              </span>
              <div
                onClick={() => setUseBackend(p => !p)}
                className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${useBackend ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${useBackend ? 'left-4' : 'left-0.5'}`} />
              </div>
            </label>
          </div>

          {/* Rate reference card */}
          <div className="ovds-widget-card p-4 space-y-3">
            <p className="ovds-card-title text-[11px]">Rate Reference — {taxType.label}</p>
            <div className="space-y-2 text-[11px]">
              {[
                { label: 'Monthly Interest Rate', value: `${(taxType.monthlyRate * 100).toFixed(0)}% per month` },
                { label: 'Flat Late Penalty',     value: taxType.latePenalty > 0 ? `${(taxType.latePenalty * 100).toFixed(0)}%` : 'None' },
                { label: 'Cap',                   value: `${taxType.cap} months` },
                { label: 'Filing Due',            value: `Day ${taxType.filingDue} of following period` },
                { label: 'Legal Reference',       value: taxType.ref },
              ].map(r => (
                <div key={r.label} className="flex justify-between gap-2">
                  <span className="text-slate-500">{r.label}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-right">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Latest result KPIs */}
          {latest && <AppKpi cells={kpiCells} cols={3} />}

          {/* Latest result detail */}
          {latest && (
            <div className={`p-4 rounded-xl border space-y-3 ${latest.isOverdue ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'}`}>
              <div className="flex items-center gap-2">
                {latest.isOverdue
                  ? <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                  : <CheckCircle  size={14} className="text-emerald-600 shrink-0" />}
                <p className={`text-[12px] font-bold ${latest.isOverdue ? 'text-rose-800 dark:text-rose-200' : 'text-emerald-800 dark:text-emerald-200'}`}>
                  {latest.isOverdue
                    ? `${latest.daysLate} days late · ${latest.monthsLate} month${latest.monthsLate !== 1 ? 's' : ''} charged`
                    : 'Payment is on time — no penalty applicable'}
                </p>
              </div>
              {latest.isOverdue && (
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-rose-100 dark:border-rose-900">
                    <p className="text-slate-500 mb-1">Penalty Breakdown</p>
                    <p>Flat: <strong className="text-rose-600">ETB {fmt(latest.flatPenalty)}</strong></p>
                    <p>Interest ({latest.monthsLate}mo × {(taxType.monthlyRate*100).toFixed(0)}%): <strong className="text-rose-600">ETB {fmt(latest.interestAmount)}</strong></p>
                    <p className="mt-1 pt-1 border-t border-rose-100">Total: <strong className="text-rose-700">ETB {fmt(latest.totalPenalty)}</strong></p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-rose-100 dark:border-rose-900">
                    <p className="text-slate-500 mb-1">Amount to Pay ERCA</p>
                    <p>Tax Principal: <strong>ETB {fmt(latest.taxDue)}</strong></p>
                    <p>+ Penalty: <strong className="text-rose-600">ETB {fmt(latest.totalPenalty)}</strong></p>
                    <p className="mt-1 pt-1 border-t border-rose-100 font-black text-rose-700">Total: ETB {fmt(latest.totalOwed)}</p>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-slate-400">{latest.ref}</p>
            </div>
          )}

          {/* Calculation history */}
          {results.length > 0 && (
            <div className="ovds-widget-card overflow-hidden">
              <div className="ovds-widget-header">
                <p className="ovds-card-title">Calculation History</p>
                <button onClick={() => setResults([])} className="text-[10px] text-slate-400 hover:text-rose-500 ml-auto">Clear</button>
              </div>
              <AppTable>
                <thead><tr>
                  <AppTh>Tax Type</AppTh>
                  <AppTh align="right">Tax Due</AppTh>
                  <AppTh>Due Date</AppTh>
                  <AppTh>Payment Date</AppTh>
                  <AppTh align="right">Days Late</AppTh>
                  <AppTh align="right">Total Penalty</AppTh>
                  <AppTh align="right">Total Owed</AppTh>
                </tr></thead>
                <tbody>
                  {results.map((r, i) => (
                    <AppTr key={i}>
                      <AppTd>
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{r.taxTypeLabel}</span>
                      </AppTd>
                      <AppTd align="right"><span className="tabular-nums text-[11px] font-semibold">ETB {fmt(r.taxDue)}</span></AppTd>
                      <AppTd><span className="text-[11px] text-slate-500">{r.dueDate}</span></AppTd>
                      <AppTd><span className="text-[11px] text-slate-500">{r.paymentDate}</span></AppTd>
                      <AppTd align="right">
                        <span className={`text-[11px] font-bold tabular-nums ${r.daysLate > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {r.daysLate}
                        </span>
                      </AppTd>
                      <AppTd align="right">
                        <span className={`text-[11px] font-bold tabular-nums ${r.totalPenalty > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ETB {fmt(r.totalPenalty)}
                        </span>
                      </AppTd>
                      <AppTd align="right">
                        <span className="text-[12px] font-black tabular-nums text-slate-800 dark:text-slate-100">ETB {fmt(r.totalOwed)}</span>
                      </AppTd>
                    </AppTr>
                  ))}
                </tbody>
              </AppTable>
            </div>
          )}

          {/* Penalty rate reference table */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="ovds-widget-header">
              <Shield size={13} className="text-rose-500" />
              <p className="ovds-card-title">Ethiopian Tax Penalty Reference</p>
            </div>
            <AppTable>
              <thead><tr>
                <AppTh>Tax</AppTh>
                <AppTh align="right">Monthly Interest</AppTh>
                <AppTh align="right">Flat Penalty</AppTh>
                <AppTh align="right">Cap</AppTh>
                <AppTh>Legal Reference</AppTh>
              </tr></thead>
              <tbody>
                {TAX_TYPES.map(t => (
                  <AppTr key={t.id}>
                    <AppTd><span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{t.label}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] font-bold text-rose-600">{(t.monthlyRate * 100).toFixed(0)}%/mo</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] font-semibold text-amber-600">{t.latePenalty > 0 ? `${(t.latePenalty * 100).toFixed(0)}%` : '—'}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-slate-500">{t.cap} mo</span></AppTd>
                    <AppTd><span className="text-[10px] text-slate-400 font-mono">{t.ref}</span></AppTd>
                  </AppTr>
                ))}
              </tbody>
            </AppTable>
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-100 dark:border-amber-900 text-[10px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <Info size={11} className="shrink-0 mt-0.5" />
              This calculator provides estimates based on published proclamation rates. ERCA may apply different calculations in specific cases. Always confirm with ERCA directly before making payments.
            </div>
          </div>
        </div>
      </div>
    </AppPage>
  );
};

export default ErcaPenaltyCalculator;


