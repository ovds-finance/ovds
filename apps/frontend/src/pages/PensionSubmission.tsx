/**
 * Pension Submission Page — Phase 7 · Pension Contributions
 *
 * Formats and submits employee pension contributions to PFSA/ERCA.
 * Rates are configurable via Settings → Tax → Global Tax Parameters.
 * Statutory defaults (Proclamation No. 1268/2023):
 *   Employee:  7% of insurable salary (capped at ETB 15,000)
 *   Employer: 11% of insurable salary (capped at ETB 15,000)
 *   Total:    18% per employee
 *
 * IAS 19: Defined contribution plan — recognised as employee benefit expense.
 * Not subject to IAS 12 (Income Taxes).
 * Generates POESSA-format schedule for ERCA submission.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Shield, RefreshCw, Download, Send, Info, CheckCircle2 } from 'lucide-react';
import { AppPage, Btn } from '@ovds/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtCurrency } from '../utils/fmt';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (n: number) => fmtCurrency(n, 'ETB');

interface PensionRecord {
  id: string;
  period: string;
  employeeCount: number;
  totalGross: number;
  employeePension: number;
  employerPension: number;
  totalRemittance: number;
  status: 'DRAFT' | 'SUBMITTED' | 'PAID';
  submittedAt?: string;
  referenceNumber?: string;
}

interface PensionEmployee {
  id: string;
  name: string;
  pensionNumber?: string;
  grossSalary: number;
  insurable: number;
  employeePension: number;
  employerPension: number;
  total: number;
}

const STATUS_CFG = {
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
  SUBMITTED: { label: 'Submitted', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  PAID:      { label: 'Paid',      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

const PensionSubmissionPage: React.FC = () => {
  usePageTitle('Pension Submissions');
  const { selectedCompanyId } = useBusiness();
  const [submissions, setSubmissions] = useState<PensionRecord[]>([]);
  const [employees, setEmployees]     = useState<PensionEmployee[]>([]);
  const [loading, setLoading]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  // Pension rates — loaded from system settings (pension_employee_rate / pension_employer_rate)
  // Fallback to statutory defaults (7% / 11%) per Proclamation No. 1268/2023.
  const [pensionEmpRate, setPensionEmpRate]   = useState(0.07);
  const [pensionEmpRRate, setPensionEmpRRate] = useState(0.11);
  const [pensionCap, setPensionCap]           = useState(15000);
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Load configurable pension rates once on mount
  useEffect(() => {
    api.get('/settings').then((res: any) => {
      const s = res.data?.data ?? res.data ?? {};
      if (s.pension_employee_rate) setPensionEmpRate(Number(s.pension_employee_rate) / 100);
      if (s.pension_employer_rate) setPensionEmpRRate(Number(s.pension_employer_rate) / 100);
      if (s.pension_cap_etb)       setPensionCap(Number(s.pension_cap_etb));
    }).catch(() => { /* use defaults */ });
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const [subRes, empRes] = await Promise.all([
        api.get('/tax/pension-submission'),
        api.get(`/payroll?period=${period}&take=200`),
      ]);
      setSubmissions(Array.isArray(subRes.data?.data) ? subRes.data.data : subRes.data ?? []);
      // Build employee pension breakdown from payroll records using configured rates
      const payrolls = Array.isArray(empRes.data?.data) ? empRes.data.data : empRes.data ?? [];
      setEmployees(payrolls.map((p: any) => {
        const insurable = Math.min(p.baseSalary ?? 0, pensionCap);
        const emp  = Math.round(insurable * pensionEmpRate  * 100) / 100;
        const empr = Math.round(insurable * pensionEmpRRate * 100) / 100;
        return {
          id:               p.employeeId ?? p.id,
          name:             p.employeeName ?? p.name ?? '—',
          pensionNumber:    p.pensionNumber,
          grossSalary:      p.baseSalary ?? 0,
          insurable,
          employeePension:  emp,
          employerPension:  empr,
          total:            emp + empr,
        };
      }));
    } catch {
      toast.error('Failed to load pension data');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, period, pensionEmpRate, pensionEmpRRate, pensionCap]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalEmployee = employees.reduce((s, e) => s + e.employeePension, 0);
  const totalEmployer = employees.reduce((s, e) => s + e.employerPension, 0);
  const totalRemit    = totalEmployee + totalEmployer;

  const submitPension = async () => {
    if (employees.length === 0) { toast.error('No payroll data for this period'); return; }
    setSubmitting(true);
    try {
      await api.post('/tax/pension-submission', {
        period,
        employeeCount:    employees.length,
        totalGross:       employees.reduce((s, e) => s + e.grossSalary, 0),
        employeePension:  totalEmployee,
        employerPension:  totalEmployer,
        totalRemittance:  totalRemit,
        employees:        employees.map(e => ({
          employeeId:      e.id,
          name:            e.name,
          pensionNumber:   e.pensionNumber,
          insurable:       e.insurable,
          employeePension: e.employeePension,
          employerPension: e.employerPension,
        })),
      });
      toast.success(`Pension submission recorded for ${period}`);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppPage
      title="Pension Submissions"
      subtitle="Format and submit to MoR · Proclamation No. 1395/2025"
      icon={<Shield size={18} />}
      iconBg="bg-emerald-500"
      crumbs={[{ label: '4 · Submit to PFSA' }, { label: 'Pension Submissions' }]}
      actions={
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <Btn variant="secondary" size="sm"
            icon={loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            onClick={fetchData} disabled={loading}>
            Refresh
          </Btn>
        </div>
      }
    >
      <div className="space-y-5">

        {/* KPI strip */}
        <div className="ovds-stat-row">
          {[
            { label: `Employee Pension (${(pensionEmpRate * 100).toFixed(0)}%)`,  value: fmt(totalEmployee), accent: 'bg-sky-500' },
            { label: `Employer Pension (${(pensionEmpRRate * 100).toFixed(0)}%)`, value: fmt(totalEmployer), accent: 'bg-violet-500' },
            { label: 'Total Remittance',       value: fmt(totalRemit),    accent: 'bg-emerald-500' },
            { label: 'Employees',              value: String(employees.length), accent: 'bg-slate-400' },
          ].map(kpi => (
            <div key={kpi.label} className="ovds-kpi-cell">
              <div className={`w-1 h-8 rounded-full shrink-0 ${kpi.accent}`} />
              <div>
                <p className="ovds-value-sm">{kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Rate reference */}
        <div className="ovds-grid-layout cols-2 gap-4">
          {[
            { label: 'Employee Contribution', rate: `${(pensionEmpRate * 100).toFixed(0)}%`,  cap: `ETB ${(pensionCap * pensionEmpRate).toLocaleString()}/month max`, cls: 'bg-sky-50 border-sky-200 text-sky-700' },
            { label: 'Employer Contribution', rate: `${(pensionEmpRRate * 100).toFixed(0)}%`, cap: `ETB ${(pensionCap * pensionEmpRRate).toLocaleString()}/month max`, cls: 'bg-violet-50 border-violet-200 text-violet-700' },
          ].map(r => (
            <div key={r.label} className={`flex items-center gap-4 p-4 rounded-xl border ${r.cls}`}>
              <div className={`text-3xl font-black tabular-nums`}>{r.rate}</div>
              <div>
                <p className="text-sm font-bold">{r.label}</p>
                <p className="text-xs opacity-75 mt-0.5">Insurable salary capped at ETB {pensionCap.toLocaleString()}</p>
                <p className="text-xs opacity-60 mt-0.5">{r.cap}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Employee schedule table */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-emerald-500" />
              <h3 className="ovds-card-title">Pension Schedule — {period}</h3>
            </div>
            <Btn
              variant="primary"
              size="sm"
              icon={submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              onClick={submitPension}
              disabled={submitting || employees.length === 0}
            >
              {submitting ? 'Submitting…' : 'Record Submission'}
            </Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  {['Employee', 'Pension No.', 'Gross Salary', 'Insurable', `Employee (${(pensionEmpRate*100).toFixed(0)}%)`, `Employer (${(pensionEmpRRate*100).toFixed(0)}%)`, 'Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i}>{Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Shield size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-sm text-slate-400">No payroll records for {period}</p>
                      <p className="text-xs text-slate-300 mt-1">Run payroll first under HR → Payroll Runs</p>
                    </td>
                  </tr>
                ) : employees.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{e.name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{e.pensionNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-xs tabular-nums text-right">{fmt(e.grossSalary)}</td>
                    <td className="px-4 py-3 text-xs tabular-nums text-right text-slate-500">{fmt(e.insurable)}</td>
                    <td className="px-4 py-3 text-xs tabular-nums text-right text-sky-600 font-medium">{fmt(e.employeePension)}</td>
                    <td className="px-4 py-3 text-xs tabular-nums text-right text-violet-600 font-medium">{fmt(e.employerPension)}</td>
                    <td className="px-4 py-3 text-xs tabular-nums text-right font-bold text-slate-800">{fmt(e.total)}</td>
                  </tr>
                ))}
              </tbody>
              {employees.length > 0 && (
                <tfoot>
                  <tr className="bg-white border-t border-slate-200 font-bold">
                    <td className="px-4 py-3 text-xs text-slate-600" colSpan={4}>Totals</td>
                    <td className="px-4 py-3 text-xs tabular-nums text-right text-sky-600">{fmt(totalEmployee)}</td>
                    <td className="px-4 py-3 text-xs tabular-nums text-right text-violet-600">{fmt(totalEmployer)}</td>
                    <td className="px-4 py-3 text-xs tabular-nums text-right text-slate-800">{fmt(totalRemit)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Submission history */}
        {submissions.length > 0 && (
          <div className="ovds-widget-card overflow-hidden">
            <div className="ovds-widget-header">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <h3 className="ovds-card-title">Submission History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    {['Period', 'Employees', 'Total Remittance', 'Status', 'Reference', 'Submitted'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {submissions.map(s => {
                    const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.DRAFT;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-slate-600">{s.period}</td>
                        <td className="px-4 py-3 text-xs text-center">{s.employeeCount}</td>
                        <td className="px-4 py-3 text-xs tabular-nums font-semibold text-right">{fmt(s.totalRemittance)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>{cfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-400">{s.referenceNumber ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('en-ET', { dateStyle: 'short' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legal note */}
        <div className="flex gap-2.5 px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs text-slate-500">
          <Info size={13} className="shrink-0 mt-0.5 text-slate-400" />
          <span>
            Pension contributions must be remitted to PFSA on or before the payroll date each month.
            Late remittance incurs a <strong>2%/month</strong> penalty on the outstanding amount.
            Insurable salary is capped at <strong>ETB 15,000</strong> per Proclamation No. 1395/2025.
          </span>
        </div>

      </div>
    </AppPage>
  );
};

export default PensionSubmissionPage;

