import { recordTaxFiling } from '@ovds/features/tax';
import { AppPage, Btn } from '@ovds/ui';
import type { AxiosResponse } from 'axios';
import {
  FileText,
  Send,
  RefreshCw,
  Globe,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
  TrendingUp,
  Plus,
  ExternalLink,
  Clock,
  Calculator,
  BookOpen,
  Phone,
  Mail,
  Building2,
  Download,
  Code2,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import { PipelineStageHeader } from '../components/pipelineComponents';
import { Icon } from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useAuditLog } from '../hooks/useAuditLog';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';
import {
  buildMonthlyDeclaration,
  buildAnnualBitDeclaration,
  getETaxExportUrl,
  type ETaxDeclarationResult,
} from '../services/newTaxApi';
import {
  useTaxReports,
  useTaxDashboard,
  useTaxAutomationStatus,
} from '../services/taxApi';
import { TaxType } from '../types/tax';
import { isValidEthiopianTin } from '../utils/authMode';
import { fmtCurrency, fmtCompact } from '../utils/fmt';

const fmt = (n: number) => fmtCurrency(n, 'ETB');
const fmtK = (n: number) => fmtCompact(n, 'ETB');

type ApiResponse<T> = { data?: T | { data?: T } };

type _ZeroDeclarationResponse = { message?: string; created?: boolean };

function unwrapApiResponse<T>(
  res: AxiosResponse<ApiResponse<T>>,
  fallback: T,
): T {
  const payload = res.data;
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    payload.data !== undefined
  ) {
    return payload.data as T;
  }
  return (payload as T | undefined) ?? fallback;
}

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = err.response as
      | { data?: { message?: string } }
      | undefined;
    if (typeof response?.data?.message === 'string') {
      return response.data.message;
    }
  }
  return fallback;
}

type FilingStatus = 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'FILED' | 'PAID';
const FILING_STATUSES: FilingStatus[] = [
  'DRAFT',
  'PENDING',
  'SUBMITTED',
  'FILED',
  'PAID',
];

function isFilingStatus(value: unknown): value is FilingStatus {
  return (
    typeof value === 'string' && FILING_STATUSES.includes(value as FilingStatus)
  );
}

function asFilingStatus(value: unknown): FilingStatus {
  return isFilingStatus(value) ? value : 'DRAFT';
}

type RawTaxReport = {
  period: string;
  id?: string;
  taxType?: string;
  amount?: number;
  reference?: string;
  filedAt?: string;
  type?: TaxType | string;
  status?: FilingStatus;
};

function reportTaxType(report: RawTaxReport) {
  return report.taxType ?? String(report.type ?? '');
}

function reportStatus(report: RawTaxReport) {
  return asFilingStatus(report.status ?? 'DRAFT');
}

function reportMatchesType(report: RawTaxReport, values: string[]) {
  return values.includes(reportTaxType(report));
}

function reportMatchesStatus(report: RawTaxReport, values: FilingStatus[]) {
  return values.includes(reportStatus(report));
}

type NewFilingForm = {
  type: TaxType | string;
  period: string;
  amount: number;
  notes: string;
  status: FilingStatus;
  reference: string;
  // Phase 5 — WHT
  whtType?: string;
  // Phase 6 — DRRF
  drrfCategory?: string;
  // Phase 9 — Import
  cifValue?: number;
  // IAS 12
  ias12Treatment?: string;
};

// IAS 12 treatment per filing type (shown as read-only hint in the modal)
const IAS12_TREATMENT: Record<string, { label: string; color: string }> = {
  VAT:         { label: 'IAS 12: Not income tax — indirect tax excluded', color: 'text-sky-700 dark:text-sky-300' },
  INCOME_TAX:  { label: 'IAS 12: Current tax — Dr Tax Expense / Cr Tax Payable', color: 'text-violet-700 dark:text-violet-300' },
  BIT:         { label: 'IAS 12: Current tax — Dr Tax Expense / Cr Tax Payable', color: 'text-violet-700 dark:text-violet-300' },
  TOT:         { label: 'IAS 12: Not income tax — operating levy', color: 'text-cyan-700 dark:text-cyan-300' },
  TOT_SERVICES:{ label: 'IAS 12: Not income tax — operating levy', color: 'text-cyan-700 dark:text-cyan-300' },
  DRRF:        { label: 'IAS 12: Not income tax — disaster fund levy', color: 'text-orange-700 dark:text-orange-300' },
  WITHHOLDING: { label: 'IAS 12: Not payer\'s income tax — reduces AP', color: 'text-amber-700 dark:text-amber-300' },
  WHT:         { label: 'IAS 12: Not payer\'s income tax — reduces AP', color: 'text-amber-700 dark:text-amber-300' },
  EXCISE_TAX:  { label: 'IAS 12: Not income tax — production/import levy', color: 'text-rose-700 dark:text-rose-300' },
  STAMP_DUTY:  { label: 'IAS 12: Not income tax — contract levy', color: 'text-teal-700 dark:text-teal-300' },
  PENSION:     { label: 'IAS 19: Defined contribution — not IAS 12', color: 'text-[var(--pro-azure-dark)] dark:text-green-300' },
  IMPORT_SURTAX:{ label: 'IAS 2: Capitalised into inventory cost', color: 'text-amber-700 dark:text-amber-300' },
  CAPITAL_GAINS:{ label: 'IAS 12: Current tax (Schedule D disposal)', color: 'text-violet-700 dark:text-violet-300' },
  DIVIDEND:    { label: 'IAS 12: Withheld from equity — not expense', color: 'text-[var(--pro-azure-dark)] dark:text-green-300' },
};

const TAX_TYPES = [
  {
    value: TaxType.VAT,
    label: 'VAT Return',
    sub: 'Monthly · 15%',
    rate: '15%',
    color: 'text-[var(--pro-azure-dark)] dark:text-green-300',
    bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
    border: 'border-[var(--pro-azure-100)] dark:border-green-800',
    deadline: '30th of following month',
    legal: 'Proclamation 1341/2024',
    link: '/tax/vat',
  },
  {
    value: TaxType.INCOME_TAX,
    label: 'Business Income Tax',
    sub: 'Annual · 30%',
    rate: '30%',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    deadline: 'Nov 7 (4 months after FY end)',
    legal: 'Proclamation 1395/2025',
    link: '/tax/business-income',
  },
  {
    value: TaxType.DRRF,
    label: 'DRRF Levy',
    sub: 'Quarterly · 1–5%',
    rate: '1–5%',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    deadline: '15th of last month of quarter',
    legal: 'Regulation 570/2025',
    link: '/disaster-fund',
  },
  {
    value: TaxType.WITHHOLDING,
    label: 'Withholding Tax',
    sub: 'Monthly · 3%',
    rate: '3%',
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800',
    deadline: '30th of following month',
    legal: 'Proclamation 1395/2025',
    link: '/tax/wht-certificates',
  },
  {
    value: 'TOT',
    label: 'Turnover Tax — Goods',
    sub: 'Monthly · 2%',
    rate: '2%',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-800',
    deadline: 'Monthly',
    legal: 'Proclamation 1395/2025',
    link: '/tax/tot',
  },
  {
    value: 'TOT_SERVICES',
    label: 'Turnover Tax — Services',
    sub: 'Monthly · 10%',
    rate: '10%',
    color: 'text-cyan-700 dark:text-cyan-300',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800',
    deadline: 'Monthly',
    legal: 'Proclamation 1395/2025',
    link: '/tax/tot',
  },
  {
    value: 'TOT_CONSTRUCTION',
    label: 'TOT — Construction / Grain / Farm',
    sub: 'Monthly · 2%',
    rate: '2%',
    color: 'text-lime-700 dark:text-lime-300',
    bg: 'bg-lime-50 dark:bg-lime-950/30',
    border: 'border-lime-200 dark:border-lime-800',
    deadline: 'Monthly',
    legal: 'Proclamation 1395/2025',
    link: '/tax/tot',
  },
  // -- Schedule D ---
  {
    value: 'DIVIDEND',
    label: 'Dividend Income Tax',
    sub: 'At distribution · 15%',
    rate: '15%',
    color: 'text-[var(--pro-azure-dark)] dark:text-green-300',
    bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
    border: 'border-[var(--pro-azure-100)] dark:border-green-800',
    deadline: 'Monthly WHT remittance',
    legal: 'Proc. 1395/2025 Art. 52',
    link: '/tax/schedule-d',
  },
  {
    value: 'CAPITAL_GAINS',
    label: 'Capital Gains Tax',
    sub: 'On disposal · 15%',
    rate: '15%',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    deadline: 'With annual BIT return',
    legal: 'Proc. 1395/2025 Art. 59',
    link: '/tax/schedule-d',
  },
  {
    value: 'RENTAL_INDIVIDUAL',
    label: 'Rental Income Tax (Individual)',
    sub: 'Annual · 0–35%',
    rate: '0–35%',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-800',
    deadline: 'Annual — Nov 7',
    legal: 'Proc. 1395/2025 Art. 35',
    link: '/tax/schedule-d',
  },
  {
    value: 'RENTAL_CORPORATE',
    label: 'Rental Income Tax (Corporate)',
    sub: 'Annual · 30%',
    rate: '30%',
    color: 'text-[var(--pro-azure-dark)] dark:text-green-300',
    bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
    border: 'border-[var(--pro-azure-100)] dark:border-green-800',
    deadline: 'Annual — Nov 7',
    legal: 'Proc. 1395/2025 Art. 41',
    link: '/tax/schedule-d',
  },
  {
    value: 'ROYALTY_ARTISTIC',
    label: 'Royalty — Artistic / Cultural',
    sub: 'At payment · 5%',
    rate: '5%',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    deadline: 'Monthly WHT remittance',
    legal: 'Proc. 1395/2025 Art. 56',
    link: '/tax/schedule-d',
  },
  {
    value: 'ROYALTY_TECHNICAL',
    label: 'Royalty — Technical / Copyright',
    sub: 'At payment · 10%',
    rate: '10%',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    deadline: 'Monthly WHT remittance',
    legal: 'Proc. 1395/2025 Art. 56',
    link: '/tax/schedule-d',
  },
  {
    value: 'DIGITAL_CONTENT',
    label: 'Digital Content Income',
    sub: 'Annual · 15%',
    rate: '15%',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
    deadline: 'Annual / digital reporting',
    legal: 'Proc. 1395/2025 Art. 57',
    link: '/tax/schedule-d',
  },
  {
    value: 'GAMES_OF_CHANCE',
    label: 'Games of Chance / Lottery',
    sub: 'At payout · 20%',
    rate: '20%',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    deadline: 'Monthly WHT remittance',
    legal: 'Proc. 1395/2025 Art. 58',
    link: '/tax/schedule-d',
  },
  {
    value: 'MANAGEMENT_FEES',
    label: 'Management / Technical Fees (NR)',
    sub: 'At payment · 15%',
    rate: '15%',
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-white dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    deadline: 'Monthly WHT remittance',
    legal: 'Proc. 1395/2025 Art. 62',
    link: '/tax/schedule-d',
  },
  {
    value: 'CUSTOMS_DUTY',
    label: 'Customs Import Duty',
    sub: 'At clearance · 0–35%',
    rate: '0–35%',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    deadline: 'At customs clearance',
    legal: 'Ethiopian Customs Tariff',
    link: '/tax/schedule-d',
  },
  {
    value: TaxType.EXCISE_TAX,
    label: 'Excise Tax',
    sub: 'Monthly · 5–500%',
    rate: '5–500%',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
    deadline: '30th of following month',
    legal: 'Proclamation 1186/2020',
    link: '/tax/excise-tax',
  },
  {
    value: TaxType.STAMP_DUTY,
    label: 'Stamp Duty',
    sub: 'On instrument · fixed/0.1–2%',
    rate: 'fixed/0.1–2%',
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800',
    deadline: 'At execution of document',
    legal: 'Proclamation 110/1998',
    link: '/tax/stamp-duty',
  },
  // -- Phase 7 — Pension --------------------------------------------------------
  {
    value: 'PENSION',
    label: 'Pension Remittance',
    sub: 'Monthly · 7% Emp + 11% Er',
    rate: '7% + 11%',
    color: 'text-[var(--pro-azure-dark)] dark:text-green-300',
    bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
    border: 'border-[var(--pro-azure-100)] dark:border-green-800',
    deadline: '30th of following month — to PFSA',
    legal: 'Proclamation 1268/2023',
    link: '/hr/payroll',
  },
  // -- Phase 9 — Import ---------------------------------------------------------
  {
    value: 'IMPORT_SURTAX',
    label: 'Import Surtax',
    sub: 'At clearance · 10%',
    rate: '10%',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    deadline: 'At customs clearance',
    legal: 'Ethiopian Customs Tariff',
    link: '/tax/schedule-d',
  },
] as const;

const STATUS_CFG: Record<
  FilingStatus,
  { label: string; cls: string; dot: string }
> = {
  FILED: {
    label: 'Filed',
    cls: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure-dark)] dark:text-green-300 border border-[var(--pro-azure-100)] dark:border-green-800',
    dot: 'bg-[var(--pro-azure-50)]0',
  },
  PAID: {
    label: 'Paid',
    cls: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure-dark)] dark:text-green-300 border border-[var(--pro-azure-100)] dark:border-green-800',
    dot: 'bg-[var(--pro-azure-50)]0',
  },
  SUBMITTED: {
    label: 'Submitted',
    cls: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
    dot: 'bg-teal-500',
  },
  DRAFT: {
    label: 'Draft',
    cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  PENDING: {
    label: 'Pending',
    cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
};

const inp =
  'w-full px-3 py-2.5 bg-white border border-[var(--pro-azure-100)] rounded-lg text-sm text-[var(--pro-azure-dark)] outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-colors placeholder:text-green-300';

const Field: React.FC<{
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, required, children }) => (
  <div>
    <label className="block text-xs font-medium text-[var(--pro-azure-dark)] mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

// -- Compliance Score Ring -----------------------------------------------------
const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 90 ? '#00E784' : score >= 70 ? '#f59e0b' : '#ef4444';
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D';
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="5"
          stroke="currentColor"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="5"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none" style={{ color }}>
          {grade}
        </span>
        <span className="text-[10px] text-slate-400 leading-none mt-0.5">
          {score}%
        </span>
      </div>
    </div>
  );
};

// -- New Filing Modal ----------------------------------------------------------
const NewFilingModal: React.FC<{
  onClose: () => void;
  onSaved: () => void;
}> = ({ onClose, onSaved }) => {
  const navigate = useNavigate();
  const auditLog = useAuditLog();
  const log = auditLog.log.bind(auditLog);
  const [form, setForm] = useState<NewFilingForm>({
    type: TaxType.VAT,
    period: new Date().toISOString().slice(0, 7),
    amount: 0,
    notes: '',
    status: 'DRAFT',
    reference: '',
    whtType: 'SERVICES',
    drrfCategory: 'OTHER',
    ias12Treatment: 'NOT_INCOME_TAX',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof NewFilingForm, v: NewFilingForm[keyof NewFilingForm]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type || !form.period || !form.amount) {
      toast.error('Fill all required fields');
      return;
    }

    // WHT remittances are managed through the WHT Certificates workflow.
    // Redirect the user there instead of hitting the filing endpoint.
    const formType = String(form.type);
    if (formType === String(TaxType.WITHHOLDING) || formType === 'WHT') {
      toast('WHT remittances are managed via WHT Certificates', { icon: 'ℹ️' });
      onClose();
      navigate('/tax/wht-certificates');
      return;
    }

    setSaving(true);
    try {
      await recordTaxFiling({
        type:           form.type,
        period:         form.period,
        amount:         form.amount,
        notes:          form.notes,
        // Phase-specific fields
        ...(form.whtType     ? { whtType: form.whtType }         : {}),
        ...(form.drrfCategory? { drrfCategory: form.drrfCategory }: {}),
        ...(form.cifValue    ? { cifValue: form.cifValue }        : {}),
        // // ias12Treatment not in schema // Removed: not in schema
      });
      log(
        'TAX_FILING_CREATED',
        {
          taxType: String(form.type),
          period: form.period,
          amount: form.amount,
        },
        'TaxFiling',
      );
      toast.success('Tax filing recorded');
      void onSaved();
      void onClose();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to record filing'));
    } finally {
      setSaving(false);
    }
  };

  const selectedType = TAX_TYPES.find(
    (t) => String(t.value) === String(form.type),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="ovds-widget-card shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--pro-azure-100)]">
          <div>
            <h3 className="font-semibold text-[var(--pro-azure-dark)]">
              Record Tax Filing
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Log a completed or draft tax submission
            </p>
          </div>
          <button
            onClick={() => onClose()}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
          <Field label="Tax Type *">
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              className={inp}
            >
              {TAX_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} — {t.rate}
                </option>
              ))}
            </select>
          </Field>
          {selectedType && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${selectedType.bg} ${selectedType.color} ${selectedType.border}`}
            >
              <Icon name="INFO" size={12} className="shrink-0" />
              <span>
                Deadline: <strong>{selectedType.deadline}</strong> ·{' '}
                {selectedType.legal}
              </span>
            </div>
          )}
          {/* IAS 12 treatment hint */}
          {IAS12_TREATMENT[String(form.type)] && (
            <div className={`text-[11px] font-medium px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${IAS12_TREATMENT[String(form.type)].color}`}>
              {IAS12_TREATMENT[String(form.type)].label}
            </div>
          )}
          {/* Phase 5 — WHT type selector */}
          {(String(form.type) === String(TaxType.WITHHOLDING) || String(form.type) === 'WHT') && (
            <Field label="WHT Transaction Type" hint="Determines the applicable rate and GL account">
              <select value={form.whtType ?? 'SERVICES'} onChange={e => setForm(p => ({ ...p, whtType: e.target.value }))} className={inp}>
                <option value="SERVICES">Services ≥ ETB 3K — 3% (Proc. 1395/2025)</option>
                <option value="GOODS">Goods ≥ ETB 10K — 3% (Proc. 1395/2025)</option>
                <option value="SERVICES_NR">Non-Resident Services — 15%</option>
                <option value="RENT">Rent — 30%</option>
                <option value="DIVIDEND">Dividend — 15%</option>
                <option value="INTEREST">Interest — 10%</option>
                <option value="ROYALTY_ARTISTIC">Royalties Artistic — 5%</option>
                <option value="ROYALTY_TECHNICAL">Royalties Technical — 10%</option>
                <option value="CAPITAL_GAINS">Capital Gains — 15%</option>
              </select>
            </Field>
          )}
          {/* Phase 6 — DRRF category selector */}
          {String(form.type) === String(TaxType.DRRF) && (
            <Field label="DRRF Category" hint="Determines the applicable levy rate (1% or 5%)">
              <select value={form.drrfCategory ?? 'OTHER'} onChange={e => setForm(p => ({ ...p, drrfCategory: e.target.value }))} className={inp}>
                <option value="ANNUAL_SALES_REVENUE">Annual Sales Revenue — 5%</option>
                <option value="SERVICE_FEES">Service Fees (Bank) — 5%</option>
                <option value="AIRTIME_SALES">Airtime Sales — 5%</option>
                <option value="TICKET_SALES">Ticket Sales — 5%</option>
                <option value="FUEL_SALES">Fuel Sales — 5%</option>
                <option value="TOBACCO_ALCOHOL">Tobacco / Alcohol — 5%</option>
                <option value="GOVERNMENT_SERVICES">Government Services — 5%</option>
                <option value="TELECOM_DIGITAL">Telecom / Digital — 5%</option>
                <option value="LOAN_VALUE">Loan Value — 1%</option>
                <option value="INSURANCE_PREMIUM">Insurance Premium — 1%</option>
                <option value="SALARY_CONTRIBUTION">Salary Contribution — 1%</option>
                <option value="DIVIDEND">Dividend — 1%</option>
                <option value="OTHER">Other — 1%</option>
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Period *" hint="YYYY-MM format">
              <input
                type="month"
                value={form.period}
                onChange={(e) => set('period', e.target.value)}
                className={inp}
                required
              />
            </Field>
            <Field label="Amount (ETB) *">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount ?? ''}
                onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
                className={inp}
                placeholder="0.00"
                required
              />
            </Field>
          </div>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className={inp}
            >
              {Object.entries(STATUS_CFG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Reference / eTax ID"
            hint="Optional — eTax portal submission reference"
          >
            <input
              value={form.reference ?? ''}
              onChange={(e) => set('reference', e.target.value)}
              className={inp}
              placeholder="e.g. ERCA-2026-001234"
            />
          </Field>
          <Field label="Notes">
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className={inp + ' resize-none'}
              placeholder="Any notes about this filing…"
            />
          </Field>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <Icon name="REFRESH" size={14} className="animate-spin" />
              ) : (
                <Icon name="INVOICE" size={14} />
              )}
              {saving ? 'Saving…' : 'Record Filing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -- Main TaxFiling Component --------------------------------------------------
const TaxFiling: React.FC = () => {
  usePageTitle('Tax Filing');
  const navigate = useNavigate();
  const auditLog = useAuditLog();
  const log = auditLog.log.bind(auditLog);
  const { selectedCompanyId } = useBusiness();
  const { reports, loading: reportsLoading, refetch } = useTaxReports();
  const { dashboard, loading: dashLoading } = useTaxDashboard();
  const { status: autoStatus, loading: autoLoading } = useTaxAutomationStatus(
    selectedCompanyId ?? undefined,
  );
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // eTax JSON Declaration builder state
  const [declarationTin,  setDeclarationTin]  = useState('');
  const [declarationName, setDeclarationName] = useState('');
  const [declarationPeriod, setDeclarationPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [buildingDeclaration, setBuildingDeclaration] = useState(false);
  const [declarationResult, setDeclarationResult] = useState<ETaxDeclarationResult | null>(null);

  const complianceScore = dashboard?.complianceScore ?? 0;
  const vatDue = Number(dashboard?.vatCurrent ?? 0);
  const drrfDue = Number(dashboard?.drrfPending ?? 0);
  const whtDue = Number(dashboard?.incomeTaxDue ?? 0);

  const [zeroDeclaring, setZeroDeclaring] = useState(false);

  const handleZeroDeclaration = async () => {
    setZeroDeclaring(true);
    try {
      const res = await (api.post('/tax/zero-declaration', {}) as Promise<any>);
      const d = unwrapApiResponse(res, {
        message: 'No zero-declaration needed',
      });
      if ((d as any).data?.created ?? true) {
        toast.success(d.message ?? 'Zero-declaration record created');
      } else {
        toast(d.message ?? 'No zero-declaration needed', { icon: 'ℹ️' });
      }
      void refetch();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Zero-declaration check failed'));
    } finally {
      setZeroDeclaring(false);
    }
  };

  // -- Build eTax JSON declaration -------------------------------------------
  const handleBuildDeclaration = async () => {
    if (!declarationTin.trim() || !declarationName.trim()) {
      toast.error('Enter TIN and taxpayer name');
      return;
    }
    if (!isValidEthiopianTin(declarationTin.trim())) {
      toast.error('Invalid TIN: must be exactly 10 digits (e.g. 0016324478)');
      return;
    }
    setBuildingDeclaration(true);
    try {
      const result = await buildMonthlyDeclaration({
        period:       declarationPeriod,
        tin:          declarationTin.trim(),
        taxpayerName: declarationName.trim(),
        companyId:    selectedCompanyId ?? undefined,
      });
      setDeclarationResult(result);
      if (result.validationErrors?.length) {
        toast(`Built with ${result.validationErrors.length} validation warning(s)`, { icon: '⚠️' });
      } else {
        toast.success('TaxpayerDeclaration payload built — ready for MoR submission');
      }
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to build declaration'));
    } finally {
      setBuildingDeclaration(false);
    }
  };

  // -- Download CSV export ---------------------------------------------------
  const handleDownloadCsv = (
    type: 'vat-sales' | 'paye-salary' | 'wht-certificates' | 'tot-log' | 'drrf-register',
    period: string,
  ) => {
    const url = getETaxExportUrl(type, period);
    window.open(url, '_blank');
    log('ETAX_CSV_DOWNLOAD', { type, period }, 'TaxFiling');
  };

  // -- Submit to eTax portal -------------------------------------------------
  const handleETaxSubmit = async (
    taxType: string,
    period: string,
    amount: number,
  ) => {
    setSubmitting(true);
    try {
      await api.post('/vat/etax-submissions', {
        period,
        type:
          String(taxType) === String(TaxType.VAT) ? 'VAT_RETURN' : 'WHT_RETURN',
        totalAmount: amount,
        notes: `Submitted via OVDS Tax Filing — ${new Date().toISOString()}`,
      });
      log('ETAX_SUBMITTED', { taxType, period, amount }, 'TaxFiling');
      toast.success('Submitted to eTax portal');
      void refetch();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'eTax submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const loading = reportsLoading || dashLoading;
  const rawReports = reports as RawTaxReport[];

  return (
    <AppPage
      title="Tax Filing"
      subtitle="Ethiopian tax compliance — VAT, TOT, DRRF, Withholding · Banking & ovds · Retail & E-commerce · IT & Software · Challenges Analysis · Competitive Landscape"
      icon={<Send size={18} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      crumbs={[{ label: 'ovds' }, { label: 'Tax Filing' }]}
      actions={
        <Btn
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setShowNewModal(true)}
        >
          New Filing
        </Btn>
      }
    >
      <div className="space-y-5">
        {/* -- Pipeline Stage Header — tax filing journey -- */}
        <PipelineStageHeader
          stages={[
            {
              key: 'VAT',
              label: 'VAT',
              count:
                rawReports.filter((r) => reportMatchesType(r, ['VAT']))
                  .length ?? 0,
              color: '#00E784',
              active: true,
            },
            {
              key: 'TOT',
              label: 'TOT',
              count:
                rawReports.filter((r) =>
                  reportMatchesType(r, ['TOT', 'TOT_SERVICES', 'TOT_CONSTRUCTION']),
                ).length ?? 0,
              color: '#0ea5e9',
            },
            {
              key: 'DRRF',
              label: 'DRRF',
              count:
                rawReports.filter((r) => reportMatchesType(r, ['DRRF']))
                  .length ?? 0,
              color: '#8b5cf6',
            },
            {
              key: 'WHT',
              label: 'Withholding',
              count:
                rawReports.filter((r) =>
                  reportMatchesType(r, ['WITHHOLDING', 'WHT']),
                ).length ?? 0,
              color: '#f59e0b',
            },
            {
              key: 'SCHED_D',
              label: 'Schedule D',
              count:
                rawReports.filter((r) =>
                  reportMatchesType(r, [
                    'DIVIDEND', 'CAPITAL_GAINS', 'RENTAL_INDIVIDUAL', 'RENTAL_CORPORATE',
                    'ROYALTY_ARTISTIC', 'ROYALTY_TECHNICAL', 'DIGITAL_CONTENT',
                    'GAMES_OF_CHANCE', 'MANAGEMENT_FEES', 'TECHNICAL_FEES',
                    'CUSTOMS_DUTY', 'EXCISE_TAX', 'STAMP_DUTY',
                  ]),
                ).length ?? 0,
              color: '#7c3aed',
            },
            {
              key: 'FILED',
              label: 'Filed',
              count:
                rawReports.filter((r) =>
                  reportMatchesStatus(r, ['FILED', 'PAID']),
                ).length ?? 0,
              color: '#00E784',
              completed: true,
            },
          ]}
        />

        {/* -- Automation Status Banner ------------------------------------------ */}
        {!autoLoading && autoStatus && (
          <div className="ovds-grid-layout cols-4">
            {/* VAT auto-compute status */}
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs ${
                autoStatus.vatFilingStatus === 'ZERO_DECLARATION'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : autoStatus.vatFilingStatus === 'NONE'
                    ? 'bg-white border-slate-200 text-slate-600'
                    : autoStatus.vatFilingStatus === 'OVERDUE'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  autoStatus.vatFilingStatus === 'NONE'
                    ? 'bg-slate-300'
                    : autoStatus.vatFilingStatus === 'OVERDUE'
                      ? 'bg-rose-500'
                      : autoStatus.vatFilingStatus === 'ZERO_DECLARATION'
                        ? 'bg-amber-500'
                        : 'bg-[var(--pro-azure-50)]0'
                }`}
              />
              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {autoStatus.vatFilingStatus === 'NONE'
                    ? 'VAT not yet computed'
                    : autoStatus.vatFilingStatus === 'ZERO_DECLARATION'
                      ? 'Zero declaration pending'
                      : autoStatus.vatFilingStatus === 'OVERDUE'
                        ? 'VAT filing OVERDUE'
                        : `VAT ${autoStatus.vatFilingStatus.toLowerCase()}`}
                </p>
                <p className="text-[10px] opacity-70">
                  {autoStatus.period} · Auto-computed by scheduler
                </p>
              </div>
            </div>

            {/* TOT applicability */}
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs ${
                autoStatus.totApplicable
                  ? 'bg-sky-50 border-sky-200 text-sky-800'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <TrendingUp size={14} className="shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold">
                  {autoStatus.totApplicable
                    ? 'TOT applies (Category B)'
                    : 'VAT registered (Category A)'}
                </p>
                <p className="text-[10px] opacity-70">
                  {autoStatus.vatThresholdPct}% of ETB 2M threshold
                </p>
              </div>
            </div>

            {/* Overdue count */}
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs ${
                autoStatus.overdueCount > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]'
              }`}
            >
              {autoStatus.overdueCount > 0 ? (
                <AlertTriangle size={14} className="shrink-0" />
              ) : (
                <CheckCircle2 size={14} className="shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-semibold">
                  {autoStatus.overdueCount > 0
                    ? `${autoStatus.overdueCount} overdue filing${autoStatus.overdueCount > 1 ? 's' : ''}`
                    : 'All filings on track'}
                </p>
                <p className="text-[10px] opacity-70">
                  Auto-flagged by scheduler
                </p>
              </div>
            </div>

            {/* Next deadline */}
            {autoStatus.nextDeadlines[0] && (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs ${
                  autoStatus.nextDeadlines[0].daysLeft <= 3
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : autoStatus.nextDeadlines[0].daysLeft <= 7
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Clock size={14} className="shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {autoStatus.nextDeadlines[0].label}
                  </p>
                  <p className="text-[10px] opacity-70">
                    {autoStatus.nextDeadlines[0].isOverdue
                      ? `${Math.abs(autoStatus.nextDeadlines[0].daysLeft)}d overdue`
                      : `${autoStatus.nextDeadlines[0].daysLeft}d left`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -- Compliance Score + KPIs ------------------------------------------- */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="flex h-1.5">
            <div
              className={`transition-all duration-700 ${complianceScore >= 80 ? 'bg-[var(--pro-azure-50)]0' : complianceScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${complianceScore}%` }}
            />
            <div className="bg-slate-100 dark:bg-slate-800 flex-1" />
          </div>
          <div className="p-5 flex flex-wrap items-center gap-5">
            <ScoreRing score={complianceScore} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--pro-azure-dark)]">
                Compliance Score
              </p>
              <p className="text-xs text-[var(--pro-azure-dark)] mt-0.5">
                {complianceScore >= 80
                  ? 'All filings up to date'
                  : complianceScore >= 50
                    ? 'Some filings need attention'
                    : 'Critical filings overdue'}
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                {[
                  {
                    label: 'VAT Due',
                    value: vatDue,
                    color:
                      vatDue > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                  },
                  {
                    label: 'DRRF Due',
                    value: drrfDue,
                    color:
                      drrfDue > 0
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                  },
                  {
                    label: 'WHT Due',
                    value: whtDue,
                    color:
                      whtDue > 0
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                  },
                ].map((k) => (
                  <div key={k.label} className="text-center">
                    <p
                      className={`text-base font-bold tabular-nums ${k.color}`}
                    >
                      {loading ? '—' : fmtK(k.value)}
                    </p>
                    <p className="ovds-caption">{k.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => navigate('/tax/vat')}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Send size={12} /> File VAT Return
              </button>
              <button
                onClick={() => navigate('/disaster-fund')}
                className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Shield size={12} /> DRRF Levy
              </button>
            </div>
          </div>
        </div>

        {/* -- Tax Type Cards ---------------------------------------------------- */}
        <div className="ovds-grid-layout cols-3">
          {TAX_TYPES.map((t) => (
            <div
              key={t.value}
              className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selectedType === t.value ? `${t.border} shadow-sm` : 'border-[var(--pro-azure-100)]'}`}
              onClick={() =>
                setSelectedType(selectedType === t.value ? null : t.value)
              }
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${t.bg} ${t.color} border ${t.border}`}
                >
                  {t.rate}
                </div>
                <Link
                  to={t.link}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors"
                >
                  <ExternalLink size={11} />
                </Link>
              </div>
              <p className="text-sm font-semibold text-[var(--pro-azure-dark)]">
                {t.label}
              </p>
              <p className="ovds-caption mt-0.5">{t.sub}</p>
              <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Deadline</span>
                  <span className="font-medium text-[var(--pro-azure-dark)]">
                    {t.deadline}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Legal basis</span>
                  <span className="font-medium text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                    {t.legal}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* -- Filing History ---------------------------------------------------- */}
        <div className="ovds-widget-card overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[var(--pro-azure-100)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--pro-azure-dark)] flex items-center gap-2">
              <Icon name="CHART" size={15} className="text-slate-400" /> Filing
              History
            </h3>
            <button
              onClick={() => void refetch()}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <RefreshCw
                size={13}
                className={reportsLoading ? 'animate-spin' : ''}
              />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm ovds-table">
              <thead>
                <tr className="bg-[var(--pro-azure-50)] border-b border-[var(--pro-azure-100)]">
                  {[
                    'Tax Type',
                    'Period',
                    'Amount',
                    'Status',
                    'Reference',
                    'Filed',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-[var(--pro-azure)] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i}>
                        {Array(7)
                          .fill(0)
                          .map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div
                                className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
                                style={{ width: j === 0 ? '120px' : '80px' }}
                              />
                            </td>
                          ))}
                      </tr>
                    ))
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <FileText
                        size={32}
                        className="mx-auto text-slate-200 dark:text-slate-700 mb-2"
                      />
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                        No filings recorded yet
                      </p>
                      <button
                        onClick={() => setShowNewModal(true)}
                        className="mt-3 px-4 py-2 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Record First Filing
                      </button>
                    </td>
                  </tr>
                ) : (
                  rawReports.map((r, idx) => {
                    const status = reportStatus(r);
                    const cfg = STATUS_CFG[status] ?? STATUS_CFG.DRAFT;
                    const taxTypeValue = reportTaxType(r);
                    const taxType = TAX_TYPES.find(
                      (t) => String(t.value) === taxTypeValue,
                    );
                    const amount = Number(r.amount ?? 0);
                    const reference =
                      typeof r.reference === 'string' ? r.reference : '—';
                    const filedAt =
                      typeof r.filedAt === 'string' ? r.filedAt : '';
                    return (
                      <tr
                        key={r.id ?? `${r.period}-${taxTypeValue}-${idx}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {taxType && (
                              <span
                                className={`w-2 h-2 rounded-full ${taxType.bg.split(' ')[0]} shrink-0`}
                                style={{
                                  background: taxType.color.includes('blue')
                                    ? '#00E784'
                                    : taxType.color.includes('violet')
                                      ? '#7c3aed'
                                      : taxType.color.includes('orange')
                                        ? '#ea580c'
                                        : taxType.color.includes('teal')
                                          ? '#00A859'
                                          : '#0ea5e9',
                                }}
                              />
                            )}
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                              {taxType?.label ?? taxTypeValue}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {r.period}
                        </td>
                        <td className="px-4 py-3 text-xs text-semibold text-[var(--pro-azure-dark)] tabular-nums whitespace-nowrap">
                          {fmt(amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${cfg.cls}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                            />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-slate-400 font-mono">
                          {reference}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-slate-400 whitespace-nowrap">
                          {filedAt
                            ? new Date(filedAt).toLocaleDateString('en-ET', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {(status === 'DRAFT' || status === 'PENDING') && (
                            <button
                              onClick={() =>
                                void handleETaxSubmit(
                                  taxTypeValue,
                                  r.period,
                                  amount,
                                )
                              }
                              disabled={submitting}
                              className="flex items-center gap-1 px-2 py-1 bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] rounded text-[10px] font-medium hover:bg-[var(--pro-azure-100)] dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
                              title="Submit to eTax portal"
                            >
                              <Send size={10} /> Submit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && reports.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {reports.length} filing{reports.length !== 1 ? 's' : ''}{' '}
                recorded
              </p>
              <a
                href="https://etax.erca.gov.et"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline font-medium"
              >
                Open eTax Portal <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>

        {/* -- Quick Reference --------------------------------------------------- */}
        <div className="ovds-grid-layout cols-2">
          {/* Tax Calendar */}
          <div className="ovds-widget-card p-5">
            <h4 className="text-sm font-semibold text-[var(--pro-azure-dark)] flex items-center gap-2 mb-4">
              <Icon name="CALENDAR" size={14} className="text-[var(--pro-azure-light)]" />{' '}
              Filing Calendar
            </h4>
            <div className="space-y-2.5">
              {[
                {
                  label: 'VAT Return',
                  deadline: '30th of following month',
                  color: 'bg-[var(--pro-azure-50)]0',
                  legal: 'Proc. 1341/2024',
                },
                {
                  label: 'WHT Remittance',
                  deadline: 'Monthly with VAT',
                  color: 'bg-teal-500',
                  legal: 'Proc. 1395/2025',
                },
                {
                  label: 'DRRF Levy',
                  deadline: '15th of last month of quarter',
                  color: 'bg-amber-500',
                  legal: 'Reg. 570/2025',
                },
                {
                  label: 'Business Income Tax',
                  deadline: 'November 7 (4 months after FY)',
                  color: 'bg-teal-500',
                  legal: 'Proc. 1395/2025',
                },
                {
                  label: 'Provisional Tax (Q1)',
                  deadline: 'September 7',
                  color: 'bg-teal-400',
                  legal: 'Proc. 1395/2025',
                },
                {
                  label: 'Provisional Tax (Q2)',
                  deadline: 'December 7',
                  color: 'bg-teal-400',
                  legal: 'Proc. 1395/2025',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${item.color} shrink-0`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--pro-azure-dark)] truncate">
                      {item.label}
                    </p>
                    <p className="ovds-caption">{item.deadline}</p>
                  </div>
                  <span className="text-[9px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-medium shrink-0">
                    {item.legal}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Penalties Reference */}
          <div className="ovds-widget-card p-5">
            <h4 className="text-sm font-semibold text-[var(--pro-azure-dark)] flex items-center gap-2 mb-4">
              <Icon name="WARNING" size={14} className="text-amber-500" />{' '}
              Penalty Reference
            </h4>
            <div className="space-y-2.5">
              {[
                {
                  label: 'Late VAT Filing',
                  penalty: 'ETB 500/day (max ETB 50,000)',
                  severity: 'text-amber-600 dark:text-amber-400',
                },
                {
                  label: 'Late VAT Payment',
                  penalty: '2%/month compounded',
                  severity: 'text-amber-600 dark:text-amber-400',
                },
                {
                  label: 'Late BIT Filing',
                  penalty: '5% of tax due + 2%/month',
                  severity: 'text-rose-600 dark:text-rose-400',
                },
                {
                  label: 'Failure to Register',
                  penalty: 'ETB 5,000 + 10% of tax',
                  severity: 'text-rose-600 dark:text-rose-400',
                },
                {
                  label: 'Incorrect Return',
                  penalty: '50% of understated tax',
                  severity: 'text-rose-600 dark:text-rose-400',
                },
                {
                  label: 'DRRF Non-Remittance',
                  penalty: '25% of levy + 2%/month',
                  severity: 'text-orange-600 dark:text-orange-400',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-2"
                >
                  <p className="text-xs text-[var(--pro-azure-dark)] truncate">
                    {item.label}
                  </p>
                  <p
                    className={`text-[10px] font-semibold shrink-0 ${item.severity}`}
                  >
                    {item.penalty}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Source: Proclamation No. 1341/2024 (VAT), Proclamation No.
                1395/2025 (BIT/WHT), Regulation No. 570/2025 (DRRF)
              </p>
            </div>
          </div>
        </div>

        {/* -- Zero Declaration Reminder ----------------------------------------- */}
        <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <Icon
            name="WARNING"
            size={14}
            className="text-amber-500 shrink-0 mt-0.5"
          />
          <div className="flex-1">
            <p className="font-semibold">Zero Declaration Required</p>
            <p className="text-amber-700 mt-0.5 leading-relaxed">
              Even if your business had <strong>no transactions</strong> this
              month, you must still file a zero report on the E-Tax portal by
              the end of the following month. Failure to file — even a zero
              return — incurs the standard late-filing penalty (
              <strong>ETB 500/day</strong> for VAT and TOT).
            </p>
          </div>
          <button
            onClick={() => void handleZeroDeclaration()}
            disabled={zeroDeclaring}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
          >
            {zeroDeclaring ? (
              <Icon name="REFRESH" size={11} className="animate-spin" />
            ) : (
              <Icon name="INVOICE" size={11} />
            )}
            {zeroDeclaring ? 'Checking…' : 'Check & Create'}
          </button>
        </div>

        {/* -- E-Tax Portal Guide ------------------------------------------------ */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--pro-azure-100)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--pro-azure-dark)] flex items-center gap-2">
              <Globe size={14} className="text-[var(--pro-azure)]" /> How to File
              Online — MoR E-Tax Portal
            </h3>
            <a
              href="https://etax.erca.gov.et"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-lg text-xs font-medium transition-colors"
            >
              Open E-Tax Portal <ExternalLink size={10} />
            </a>
          </div>

          <div className="p-5 space-y-5">
            {/* Steps */}
            <div className="ovds-grid-layout cols-3">
              {[
                {
                  step: 1,
                  icon: <Icon name="GLOBE" size={14} />,
                  title: 'Access the Portal',
                  desc: 'Go to etax.erca.gov.et — the official Ministry of Revenue E-Tax site.',
                  color: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
                },
                {
                  step: 2,
                  icon: <Icon name="SHIELD_CHECK" size={14} />,
                  title: 'Log In',
                  desc: 'Enter your Tax Identification Number (TIN), username, and password.',
                  color: 'bg-teal-50 border-teal-200 text-teal-700',
                },
                {
                  step: 3,
                  icon: <Icon name="INVOICE" size={14} />,
                  title: 'Navigate to Declaration',
                  desc: 'Select Tax Declaration → choose the tax type: VAT, TOT, or Withholding.',
                  color: 'bg-sky-50 border-sky-200 text-sky-700',
                },
                {
                  step: 4,
                  icon: <Icon name="CALCULATOR" size={14} />,
                  title: 'Fill in Details',
                  desc: 'Enter monthly sales, purchases, and income data. Net VAT = Output VAT − Input VAT.',
                  color: 'bg-violet-50 border-violet-200 text-violet-700',
                },
                {
                  step: 5,
                  icon: <Icon name="SEND" size={14} />,
                  title: 'Submit & Confirm',
                  desc: 'Review the entry, submit the form, and download the submission receipt.',
                  color: 'bg-rose-50 border-rose-200 text-rose-700',
                },
                {
                  step: 6,
                  icon: <Icon name="CREDIT_CARD" size={14} />,
                  title: 'Pay',
                  desc: 'Use the generated payment slip to pay via a designated commercial bank or digital payment (Telebirr, CBE Pay, etc.).',
                  color: 'bg-orange-50 border-orange-200 text-orange-700',
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`flex gap-3 p-3.5 rounded-xl border ${s.color}`}
                >
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-[10px] font-bold border border-current/20">
                      {s.step}
                    </span>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">
                      {s.title}
                    </p>
                    <p className="text-[10px] mt-1 leading-relaxed opacity-80">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Net VAT formula */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-2 mb-2">
                <Calculator size={13} className="text-[var(--pro-azure)]" /> Net VAT
                Formula
              </p>
              <div className="font-mono text-xs text-slate-600 space-y-1">
                <p>
                  <span className="text-[var(--pro-azure-dark)] font-semibold">
                    Net VAT Payable
                  </span>{' '}
                  = Output VAT − Input VAT
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Output VAT &gt; Input VAT → Pay to MoR/ERCA &nbsp;|&nbsp;
                  Input VAT &gt; Output VAT → VAT Refund (or carry forward)
                </p>
              </div>
            </div>

            {/* Documents needed + Payment methods */}
            <div className="ovds-grid-layout cols-2">
              <div>
                <p className="text-xs font-semibold text-[var(--pro-azure-dark)] flex items-center gap-1.5 mb-2">
                  <BookOpen size={12} className="text-[var(--pro-azure)]" /> Documents
                  to Prepare
                </p>
                <ul className="space-y-1.5">
                  {[
                    'All sales invoices for the period (with ERCA QR codes)',
                    'Purchase invoices from VAT-registered vendors',
                    'Bank statements for payment reference cross-check',
                    "Previous period's submission receipt (for carry-forward credits)",
                  ].map((d) => (
                    <li
                      key={d}
                      className="flex items-start gap-2 text-[11px] text-slate-600"
                    >
                      <CheckCircle2
                        size={11}
                        className="text-[var(--pro-azure)] shrink-0 mt-0.5"
                      />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--pro-azure-dark)] flex items-center gap-1.5 mb-2">
                  <Building2 size={12} className="text-[var(--pro-azure)]" /> Payment
                  Methods After Filing
                </p>
                <ul className="space-y-1.5">
                  {[
                    'Commercial banks: CBE, Awash, Dashen, Abyssinia, etc.',
                    'Telebirr (Ethio Telecom mobile money)',
                    'CBE Pay and other approved digital payment methods',
                    'Record the payment reference in OVDS after paying',
                  ].map((d) => (
                    <li
                      key={d}
                      className="flex items-start gap-2 text-[11px] text-slate-600"
                    >
                      <CheckCircle2
                        size={11}
                        className="text-[var(--pro-azure)] shrink-0 mt-0.5"
                      />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Support contact */}
            <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 w-full">
                Ministry of Revenue support:
              </p>
              <a
                href="tel:+251116629800"
                className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-[var(--pro-azure-dark)] transition-colors"
              >
                <Phone size={11} className="text-[var(--pro-azure)]" /> +251 11 662 98
                00
              </a>
              <a
                href="mailto:info.mor@mor.gov.et"
                className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-[var(--pro-azure-dark)] transition-colors"
              >
                <Mail size={11} className="text-[var(--pro-azure)]" />{' '}
                info.mor@mor.gov.et
              </a>
              <a
                href="https://mor.gov.et"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-[var(--pro-azure-dark)] transition-colors"
              >
                <Globe size={11} className="text-[var(--pro-azure)]" /> mor.gov.et{' '}
                <ExternalLink size={9} />
              </a>
              <p className="text-[10px] text-slate-400 w-full mt-1">
                Tax laws and digital platforms can change. Verify deadlines and
                procedures on the official Ministry of Revenue website.
              </p>
            </div>
          </div>
        </div>

        {/* -- eTax JSON Declaration Builder ---------------------------------------- */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header">
            <Code2 size={14} className="text-violet-500" />
            <h3 className="ovds-card-title">MoR eTax JSON Declaration Builder</h3>
            <span className="ovds-caption ml-auto">Builds a signed TaxpayerDeclaration from live DB data</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="ovds-grid-layout cols-3 gap-sm">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Taxpayer TIN *</label>
                <input value={declarationTin} onChange={e => setDeclarationTin(e.target.value)}
                  className={inp} placeholder="e.g. 0043892710" maxLength={15} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Taxpayer Name *</label>
                <input value={declarationName} onChange={e => setDeclarationName(e.target.value)}
                  className={inp} placeholder="e.g. Addis Trading PLC" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Period</label>
                <input type="month" value={declarationPeriod} onChange={e => setDeclarationPeriod(e.target.value)}
                  className={inp} />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Btn variant="primary" size="sm"
                icon={buildingDeclaration ? <RefreshCw size={12} className="animate-spin" /> : <Code2 size={12} />}
                onClick={() => void handleBuildDeclaration()}
                loading={buildingDeclaration}>
                Build JSON Payload
              </Btn>
              {['vat-sales', 'paye-salary', 'wht-certificates', 'tot-log', 'drrf-register'].map(type => (
                <button key={type}
                  onClick={() => handleDownloadCsv(type as any, declarationPeriod)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Download size={10} /> {type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} CSV
                </button>
              ))}
            </div>

            {/* Validation errors */}
            {declarationResult?.validationErrors?.length ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> {declarationResult.validationErrors.length} validation issue(s)
                </p>
                {declarationResult.validationErrors.map((e, i) => (
                  <p key={i} className="text-[10px] text-amber-700 ml-4">• {e}</p>
                ))}
              </div>
            ) : declarationResult ? (
              <div className="flex items-center gap-2 p-2.5 bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-lg">
                <CheckCircle2 size={13} className="text-[var(--pro-azure)] shrink-0" />
                <p className="text-[11px] text-[var(--pro-azure-dark)] font-semibold">
                  Payload valid — signed with SHA-256. Period: {declarationResult.declaration.Header.FilingPeriodCode}
                </p>
              </div>
            ) : null}

            {/* JSON preview */}
            {declarationResult && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">TaxpayerDeclaration.json</span>
                  <button onClick={() => {
                    navigator.clipboard?.writeText(JSON.stringify(declarationResult.declaration, null, 2));
                    toast.success('Copied to clipboard');
                  }} className="text-[10px] text-slate-400 hover:text-white transition-colors">
                    Copy
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-[10px] text-[var(--pro-azure-light)] font-mono overflow-x-auto max-h-64 leading-relaxed">
                  {JSON.stringify(declarationResult.declaration, null, 2)}
                </pre>
              </div>
            )}

            <p className="text-[10px] text-slate-400">
              Payload is signed server-side with SHA-256. Submit via <code className="bg-slate-100 px-1 rounded">POST /api/ovds/tax/declaration/monthly/:period</code> or copy and submit to the MoR eTax REST gateway.
            </p>
          </div>
        </div>

        {/* -- New Filing Modal --------------------------------------------------- */}
        {showNewModal && (
          <NewFilingModal
            onClose={() => setShowNewModal(false)}
            onSaved={() => void refetch()}
          />
        )}
      </div>
    </AppPage>
  );
};

export default TaxFiling;
