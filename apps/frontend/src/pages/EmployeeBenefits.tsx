/**
 * IAS 19 — Employee Benefits: End-of-Service Gratuity
 *
 * Ethiopian Labour Proclamation 1156/2019 (Art. 39) mandates end-of-service
 * gratuity. IAS 19 requires this to be recognised as a defined benefit obligation.
 *
 * Gratuity schedule (Proc. 1156/2019):
 *   < 1 year       → 0 months
 *   1 year          → 1 month salary
 *   2 years         → 1.5 months salary
 *   3–9 years       → +1 month per additional year
 *   10+ years       → +1.5 months per additional year (max 12 months)
 *
 * IAS 19.83: discount at Ethiopian government bond yield (~10%).
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  RefreshCw, Users, TrendingUp, AlertTriangle,
  CheckCircle2, Info, Send, Download,
} from 'lucide-react';
import { AppPage, Btn } from '@ovds/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtCurrency } from '../utils/fmt';
import { Icon } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (n: number) => fmtCurrency(n, 'ETB');

interface BenefitObligation {
  employeeId:       string;
  employeeName:     string;
  employeeIdCode:   string;
  departmentName:   string;
  hireDate?:        string;
  yearsService:     number;
  monthlySalary:    number;
  gratuityMonths:   number;
  grossObligation:  number;
  presentValue:     number;
  fundedAmount:     number;
  deficit:          number;
  actuarialRate:    number;
  disclosureNotes:  string;
}

interface Ias19Summary {
  companyId:            string;
  asOf:                 string;
  actuarialRate:        number;
  employees:            BenefitObligation[];
  totalGrossObligation: number;
  totalPresentValue:    number;
  totalFunded:          number;
  totalDeficit:         number;
  journalEntry?: {
    debitAccount:  string;
    creditAccount: string;
    amount:        number;
    description:   string;
  };
  ifrsReference: string;
  procReference: string;
  generatedAt:   string;
}

// -- Gratuity months table -----------------------------------------------------
const GRATUITY_TABLE = [
  { years: '< 1',    months: 0,    note: 'No entitlement' },
  { years: '1',      months: 1.0,  note: '' },
  { years: '2',      months: 1.5,  note: '' },
  { years: '3',      months: 2.5,  note: '' },
  { years: '4',      months: 3.5,  note: '' },
  { years: '5',      months: 4.5,  note: '' },
  { years: '6',      months: 5.5,  note: '' },
  { years: '7',      months: 6.5,  note: '' },
  { years: '8',      months: 7.5,  note: '' },
  { years: '9',      months: 8.5,  note: '' },
  { years: '10',     months: 10.0, note: '+1.5 from year 10' },
  { years: '11',     months: 11.5, note: '' },
  { years: '12+',    months: 12.0, note: 'Maximum — 12 months' },
];

const EmployeeBenefits: React.FC = () => {
  usePageTitle('IAS 19 — Employee Benefits');
  const { selectedCompanyId } = useBusiness();
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<Ias19Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const compute = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ companyId: selectedCompanyId, asOf });
      const res = await api.get(`/ovds/reports/ias19-gratuity?${q}`);
      setData(res.data?.data ?? res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to compute IAS 19 obligation');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, asOf]);

  useEffect(() => { compute(); }, [compute]);

  const handlePost = async () => {
    if (!data?.journalEntry) return;
    setPosting(true);
    try {
      await api.post('/ovds/reports/ias19-gratuity/post', {
        companyId: selectedCompanyId,
        asOf,
      });
      toast.success('IAS 19 gratuity journal entry posted to GL');
      compute();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to post journal entry');
    } finally {
      setPosting(false);
    }
  };

  const hasDeficit = (data?.totalDeficit ?? 0) > 0;

  return (
    <AppPage
      title="Employee Benefits"
      subtitle="IAS 19 — End-of-service gratuity obligation · Ethiopian Labour Proclamation 1156/2019 · Healthcare & Pharmaceuticals · Manufacturing & Logistics · ERP · Consumer Insights · Market Segments"
      icon={<Users size={18} />}
      iconBg="bg-teal-500"
      crumbs={[{ label: 'IFRS & Standards' }, { label: 'Employee Benefits' }]}
      actions={
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">As of:</label>
          <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-400" />
          <Btn variant="secondary" size="sm"
            icon={loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            onClick={compute} disabled={loading}>
            Recompute
          </Btn>
          {data?.journalEntry && (
            <Btn variant="primary" size="sm"
              icon={posting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              onClick={handlePost} disabled={posting}>
              Post to GL
            </Btn>
          )}
        </div>
      }
    >
      <div className="space-y-5">

        {/* -- KPI strip -- */}
        <div className="ovds-stat-row">
          {[
            { label: 'Employees with Entitlement', value: String(data?.employees.length ?? '—'),       accent: 'bg-slate-400' },
            { label: 'Gross Obligation (Undiscounted)', value: data ? fmt(data.totalGrossObligation) : '—', accent: 'bg-amber-500' },
            { label: 'Present Value (IAS 19.83)',    value: data ? fmt(data.totalPresentValue)    : '—', accent: 'bg-teal-500' },
            { label: 'Total Funded',                 value: data ? fmt(data.totalFunded)          : '—', accent: 'bg-emerald-500' },
            { label: 'Unfunded Deficit',             value: data ? fmt(data.totalDeficit)         : '—', accent: hasDeficit ? 'bg-rose-500' : 'bg-slate-200' },
          ].map(kpi => (
            <div key={kpi.label} className="ovds-kpi-cell">
              <div className={`w-1 h-8 rounded-full shrink-0 ${kpi.accent}`} />
              <div>
                <p className="ovds-value-sm tabular-nums">{kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* -- Recognition assessment -- */}
        {data && (
          <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
            hasDeficit
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {hasDeficit
              ? <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              : <CheckCircle2  size={16} className="shrink-0 mt-0.5 text-emerald-600" />}
            <div>
              <strong>IAS 19 Recognition:</strong>{' '}
              {hasDeficit
                ? `Unfunded deficit of ${fmt(data.totalDeficit)} must be recognised as a liability on the balance sheet.`
                : 'Obligation fully funded — no additional liability to recognise.'}
              <p className="text-xs mt-1 opacity-70">
                Discount rate: {(data.actuarialRate * 100).toFixed(1)}% (Ethiopian govt bond yield) · As of {asOf}
              </p>
            </div>
          </div>
        )}

        {/* -- Employee obligations table -- */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header flex items-center justify-between">
            <h3 className="ovds-card-title">Employee Gratuity Obligations</h3>
            <span className="ovds-caption ml-auto">
              Proclamation 1156/2019, Art. 39 · Discounted per IAS 19.83
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  {['Employee', 'Department', 'Service (yrs)', 'Monthly Salary', 'Gratuity Months',
                    'Gross Obligation', 'Present Value', 'Funded', 'Deficit'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(9).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 0 ? '120px' : '80px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (data?.employees.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <Users size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-sm text-slate-400">No employees with gratuity entitlement</p>
                      <p className="text-xs text-slate-300 mt-1">Employees require at least 1 year of service</p>
                    </td>
                  </tr>
                ) : (
                  <>
                    {data!.employees.map(emp => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50 transition-colors" title={emp.disclosureNotes}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700 text-xs">{emp.employeeName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{emp.employeeIdCode}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{emp.departmentName}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right font-medium">{emp.yearsService.toFixed(1)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right">{fmt(emp.monthlySalary)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right text-amber-600 font-medium">{emp.gratuityMonths.toFixed(1)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right">{fmt(emp.grossObligation)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right text-teal-600 font-semibold">{fmt(emp.presentValue)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right text-emerald-600">{fmt(emp.fundedAmount)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right">
                          <span className={emp.deficit > 0 ? 'text-rose-600 font-bold' : 'text-slate-300'}>
                            {emp.deficit > 0 ? fmt(emp.deficit) : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    {data && (
                      <tr className="bg-white border-t-2 border-slate-200 font-semibold">
                        <td colSpan={5} className="px-4 py-3 text-xs font-bold text-slate-600">Total</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-right text-slate-800">{fmt(data.totalGrossObligation)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-right text-teal-700 font-bold">{fmt(data.totalPresentValue)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-right text-emerald-700">{fmt(data.totalFunded)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-right">
                          <span className={data.totalDeficit > 0 ? 'text-rose-600 font-bold' : 'text-slate-300'}>
                            {data.totalDeficit > 0 ? fmt(data.totalDeficit) : '—'}
                          </span>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* -- Journal entry -- */}
        {data?.journalEntry && (
          <div className="ovds-widget-card overflow-hidden">
            <div className="ovds-widget-header">
              <h3 className="ovds-card-title">Suggested Period-End Journal Entry</h3>
              <span className="text-[10px] text-slate-400 ml-auto">IAS 19 — Post to recognise gratuity obligation</span>
            </div>
            <div className="ovds-widget-body">
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Account</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Debit (ETB)</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Credit (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Dr {data.journalEntry.debitAccount}</td>
                      <td className="px-4 py-3 text-sm font-bold tabular-nums text-right">{fmt(data.journalEntry.amount)}</td>
                      <td className="px-4 py-3 text-sm text-slate-300 text-right">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700 pl-8">Cr {data.journalEntry.creditAccount}</td>
                      <td className="px-4 py-3 text-sm text-slate-300 text-right">—</td>
                      <td className="px-4 py-3 text-sm font-bold tabular-nums text-right">{fmt(data.journalEntry.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Btn variant="primary" size="sm"
                icon={posting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                onClick={handlePost} disabled={posting}>
                {posting ? 'Posting…' : 'Post Journal Entry'}
              </Btn>
            </div>
          </div>
        )}

        {/* -- Gratuity schedule reference -- */}
        <div className="ovds-widget-card overflow-hidden">
          <button
            onClick={() => setShowTable(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
          >
            <span className="ovds-card-title">Gratuity Rate Schedule (Proclamation 1156/2019, Art. 39)</span>
            <Icon name="CHEVRON_DOWN" size={13} className={`text-slate-400 transition-transform ${showTable ? 'rotate-180' : ''}`} />
          </button>
          {showTable && (
            <div className="border-t border-slate-100 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Completed Years of Service</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-slate-500 uppercase tracking-wider">Gratuity Entitlement</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {GRATUITY_TABLE.map(row => (
                    <tr key={row.years} className={`hover:bg-slate-50 ${row.months === 12 ? 'font-semibold bg-amber-50' : ''}`}>
                      <td className="px-4 py-2 text-slate-700">{row.years} year{row.years !== '< 1' && row.years !== '1' ? 's' : ''}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-teal-700 font-medium">
                        {row.months === 0 ? '—' : `${row.months} month${row.months !== 1 ? 's' : ''} salary`}
                      </td>
                      <td className="px-4 py-2 text-slate-400">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* -- IFRS / legal references -- */}
        {data && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'IFRS Reference', value: data.ifrsReference, color: 'bg-teal-50 border-teal-100 text-teal-700' },
              { label: 'Legal Reference', value: data.procReference, color: 'bg-amber-50 border-amber-100 text-amber-700' },
            ].map(ref => (
              <div key={ref.label} className={`flex gap-2.5 px-4 py-3 rounded-xl border text-xs ${ref.color}`}>
                <Info size={13} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">{ref.label}</p>
                  <p className="opacity-80">{ref.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppPage>
  );
};

export default EmployeeBenefits;

