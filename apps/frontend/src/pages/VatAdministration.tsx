/**
 * VatAdministration — OVDS Online VAT Declaration System
 *
 * Three-zone Ovds UI architecture:
 *   Zone 1 (Left, 260px)  — Sticky KPI sidebar: net payable, compliance ring,
 *                            validation panel, period picker, quick actions
 *   Zone 2 (Center, flex) — Tab-driven content: ledgers, filings, WHT, refunds,
 *                            DRRF levy, tax reports
 *   Zone 3 (Right, 280px) — Context rail: audit trail, readiness check,
 *                            eTax submission status, filing deadlines
 *
 * Ovds design rules:
 *   • No aggressive shadows — structure via 1px borders only
 *   • #0056D2 (--blue-600) for primary CTAs
 *   • Monospaced tabular-nums for all financial values
 *   • White/surface-alt surface dominance
 *   • Dark navy sidebar (#0B1221) is in the shell, not here
 *
 * Ethiopian VAT Law:
 *   • Standard rate: 15% — Proclamation No. 1341/2024
 *   • Withholding: 3% — Proclamation No. 1395/2025
 *   • Filing deadline: 30th of following month
 *   • Registration threshold: ETB 2,000,000 — Regulation No. 570/2025
 */
import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../rbac/AuthContext';
import { useInterval } from '../hooks';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuditLog } from '../hooks/useAuditLog';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  AppPage, AppTabs, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Toolbar,
  Icon, Amount, StatusBadge,
} from '../components/ui';
import {
  AkiMetricCard, AkiStatStrip, AkiAuditTrail, AkiValidationPanel,
  AkiMultiStateProgress, AkiSectionHeader,
  type AkiAuditEntry, type AkiValidationError,
} from '@ovds/ui';
import {
  useVatFilings, useVatDashboard, useInputLedger, useOutputLedger,
  useWithholding, useReverseCharges, useRefundClaims,
  useEtaxSubmissions, lockVatPeriod, setVatApportionment,
} from '../services/vatApi';
import { useDeclarationReadiness } from '../services/newTaxApi';

const LevyCollectionPanel = lazy(() => import('../components/disaster-fund/LevyCollectionPanel'));
const VatReportsPanel     = lazy(() => import('../components/disaster-fund/VatReportsPanel'));

// ── Constants & Formatters ────────────────────────────────────────────────────

const today         = new Date().toISOString().slice(0, 10);
const currentPeriod = today.slice(0, 7);

const fmt  = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtK = (n: number | null | undefined) => {
  const v = n ?? 0;
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
       : v >= 1000      ? `${(v / 1000).toFixed(1)}K`
       : fmt(v);
};

// ── Entry Modals ──────────────────────────────────────────────────────────────

function AddInputModal({ onClose, onSaved, period }: { onClose: () => void; onSaved: () => void; period: string }) {
  const [form, setForm] = useState({ supplier: '', category: 'goods', invoiceNo: '', date: today, netAmount: '', vatAmount: '', claimable: true, period });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const handleNet = (v: string) => {
    set('netAmount', v);
    const n = parseFloat(v);
    if (!isNaN(n)) set('vatAmount', (n * 0.15).toFixed(2));
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier || !form.invoiceNo || !form.netAmount) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await api.post('/vat/input-ledger', { ...form, netAmount: +form.netAmount, vatAmount: +form.vatAmount || 0 });
      toast.success('Entry added'); onSaved(); onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <Modal open title="Add Input VAT Entry" onClose={onClose} footer={
      <><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={saving} onClick={save}>Save Entry</Btn></>
    }>
      <form onSubmit={save} className="space-y-4">
        <FormField label="Supplier" required><Input value={form.supplier} onChange={e => set('supplier', e.target.value)} /></FormField>
        <FormField label="Invoice No" required><Input value={form.invoiceNo} onChange={e => set('invoiceNo', e.target.value)} /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date"><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></FormField>
          <FormField label="Period"><Input value={form.period} onChange={e => set('period', e.target.value)} /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Net Amount (ETB)" required hint="VAT auto-calculated at 15%">
            <Input type="number" min="0" step="0.01" value={form.netAmount} onChange={e => handleNet(e.target.value)} />
          </FormField>
          <FormField label="VAT Amount (ETB)">
            <Input type="number" min="0" step="0.01" value={form.vatAmount} onChange={e => set('vatAmount', e.target.value)} />
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={form.claimable} onChange={e => set('claimable', e.target.checked)} className="rounded accent-[#0056D2]" />
          Claimable VAT
        </label>
      </form>
    </Modal>
  );
}

function AddOutputModal({ onClose, onSaved, period }: { onClose: () => void; onSaved: () => void; period: string }) {
  const [form, setForm] = useState({ customer: '', category: 'goods', invoiceNo: '', date: today, netAmount: '', vatAmount: '', period });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const handleNet = (v: string) => {
    set('netAmount', v);
    const n = parseFloat(v);
    if (!isNaN(n) && !['exempt', 'export'].includes(form.category)) set('vatAmount', (n * 0.15).toFixed(2));
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer || !form.invoiceNo || !form.netAmount) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await api.post('/vat/output-ledger', { ...form, netAmount: +form.netAmount, vatAmount: +form.vatAmount || 0 });
      toast.success('Entry added'); onSaved(); onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <Modal open title="Add Output VAT Entry" onClose={onClose} footer={
      <><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={saving} onClick={save}>Save Entry</Btn></>
    }>
      <form onSubmit={save} className="space-y-4">
        <FormField label="Customer" required><Input value={form.customer} onChange={e => set('customer', e.target.value)} /></FormField>
        <FormField label="Invoice No" required><Input value={form.invoiceNo} onChange={e => set('invoiceNo', e.target.value)} /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Net Amount (ETB)" required>
            <Input type="number" min="0" step="0.01" value={form.netAmount} onChange={e => handleNet(e.target.value)} />
          </FormField>
          <FormField label="VAT Amount (ETB)">
            <Input type="number" min="0" step="0.01" value={form.vatAmount} onChange={e => set('vatAmount', e.target.value)} />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

function AddWithholdingModal({ onClose, onSaved, period }: { onClose: () => void; onSaved: () => void; period: string }) {
  const [form, setForm] = useState({ supplier: '', tin: '', invoiceDate: today, invoiceAmount: '', period });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const withheld = form.invoiceAmount ? (parseFloat(form.invoiceAmount) * 0.03).toFixed(2) : '—';
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier || !form.invoiceAmount) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await api.post('/vat/withholding', { ...form, invoiceAmount: +form.invoiceAmount });
      toast.success('Entry added'); onSaved(); onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <Modal open title="Add Withholding Entry (3%)" onClose={onClose} footer={
      <><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={saving} onClick={save}>Save Entry</Btn></>
    }>
      <form onSubmit={save} className="space-y-4">
        <FormField label="Supplier" required><Input value={form.supplier} onChange={e => set('supplier', e.target.value)} /></FormField>
        <FormField label="TIN"><Input value={form.tin} onChange={e => set('tin', e.target.value)} /></FormField>
        <FormField label="Invoice Amount (ETB)" required>
          <Input type="number" min="0" step="0.01" value={form.invoiceAmount} onChange={e => set('invoiceAmount', e.target.value)} />
        </FormField>
        <div className="flex items-center justify-between px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700">
          <span className="font-semibold">Withheld VAT (3%)</span>
          <span className="font-bold font-mono">ETB {withheld}</span>
        </div>
      </form>
    </Modal>
  );
}

function AddReverseChargeModal({ onClose, onSaved, period }: { onClose: () => void; onSaved: () => void; period: string }) {
  const [form, setForm] = useState({ supplier: '', service: '', invoiceDate: today, amountETB: '', period });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const vatDue = form.amountETB ? (parseFloat(form.amountETB) * 0.15).toFixed(2) : '—';
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier || !form.service || !form.amountETB) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await api.post('/vat/reverse-charges', { ...form, amountETB: +form.amountETB });
      toast.success('Entry added'); onSaved(); onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <Modal open title="Add Reverse Charge Entry" onClose={onClose} footer={
      <><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={saving} onClick={save}>Save Entry</Btn></>
    }>
      <form onSubmit={save} className="space-y-4">
        <FormField label="Foreign Supplier" required><Input value={form.supplier} onChange={e => set('supplier', e.target.value)} /></FormField>
        <FormField label="Service Description" required><Input value={form.service} onChange={e => set('service', e.target.value)} /></FormField>
        <FormField label="Amount (ETB)" required>
          <Input type="number" min="0" step="0.01" value={form.amountETB} onChange={e => set('amountETB', e.target.value)} />
        </FormField>
        <div className="flex items-center justify-between px-3 py-2.5 bg-rose-50 rounded-lg border border-rose-100 text-xs text-rose-700">
          <span className="font-semibold">Reverse Charge VAT Due (15%)</span>
          <span className="font-bold font-mono">ETB {vatDue}</span>
        </div>
      </form>
    </Modal>
  );
}

function AddRefundModal({ onClose, onSaved, period }: { onClose: () => void; onSaved: () => void; period: string }) {
  const [form, setForm] = useState({ period, submittedDate: today, amount: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.period || !form.amount) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await api.post('/vat/refund-claims', { ...form, amount: +form.amount });
      toast.success('Claim submitted'); onSaved(); onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <Modal open title="Submit Refund Claim" onClose={onClose} footer={
      <><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={saving} onClick={save}>Submit Claim</Btn></>
    }>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Period (YYYY-MM)" required>
            <Input value={form.period} onChange={e => set('period', e.target.value)} />
          </FormField>
          <FormField label="Amount (ETB)" required>
            <Input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Notes"><Input value={form.notes} onChange={e => set('notes', e.target.value)} /></FormField>
      </form>
    </Modal>
  );
}

// ── Zone 1: Left KPI Sidebar ──────────────────────────────────────────────────

interface LeftSidebarProps {
  dashboard: any;
  loading: boolean;
  period: string;
  onPeriodChange: (p: string) => void;
  onAddOutput: () => void;
  onAddInput: () => void;
  onFileReturn: () => void;
  canWrite: boolean;
  canFile: boolean;
  readiness: any;
}

function LeftSidebar({
  dashboard, loading, period, onPeriodChange,
  onAddOutput, onAddInput, onFileReturn,
  canWrite, canFile, readiness,
}: LeftSidebarProps) {
  const output  = Number(dashboard?.totalOutputVat ?? 0);
  const input   = Number(dashboard?.totalInputVat ?? 0);
  const net     = Number(dashboard?.netPayable ?? 0);
  const wht     = Number(dashboard?.totalWithheld ?? 0);
  const rc      = Number(dashboard?.totalReverseCharge ?? 0);
  const isRefund = net < 0;

  // Derive validation items from readiness
  const validationItems: AkiValidationError[] = readiness ? [
    ...( readiness.errors?.map((e: string) => ({ field: 'Error', message: e, type: 'error' as const })) ?? []),
    ...( readiness.warnings?.map((w: string) => ({ field: 'Warning', message: w, type: 'warning' as const })) ?? []),
    ...( readiness.ready ? [{ field: 'All checks passed', message: 'Ready to submit to MoR eTax', type: 'ok' as const }] : []),
  ] : [];

  return (
    <aside
      className="shrink-0 w-[260px] min-w-[220px] max-w-[280px] flex flex-col gap-4"
      aria-label="VAT summary sidebar"
    >
      {/* Period picker */}
      <div className="aki-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-alt)] bg-[var(--surface-alt)] flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-4)]">Period</span>
          <Icon name="CALENDAR" size={12} className="text-[var(--text-4)]" />
        </div>
        <div className="px-4 py-3">
          <input
            type="month"
            value={period}
            onChange={e => onPeriodChange(e.target.value)}
            aria-label="Select VAT period"
            className="w-full text-[13px] font-bold text-[var(--text)] bg-transparent outline-none border-none font-mono"
          />
        </div>
      </div>

      {/* Net payable KPI — hero card */}
      <AkiMetricCard
        label={isRefund ? 'Refund Due' : 'Net VAT Payable'}
        value={`ETB ${fmtK(Math.abs(net))}`}
        sub={isRefund ? 'Credit to carry forward' : 'Due by 30th of next month'}
        accent={isRefund ? 'sky' : net > 0 ? 'emerald' : 'blue'}
        loading={loading}
        icon={<Icon name={isRefund ? 'SUCCESS' : 'RECEIPT'} size={16} />}
        iconBg={isRefund ? 'bg-sky-50' : 'bg-emerald-50'}
        iconColor={isRefund ? 'text-sky-600' : 'text-emerald-600'}
        sparkData={[output * 0.6, output * 0.75, output * 0.8, output * 0.9, output]}
      />

      {/* Output / Input / WHT mini-strip */}
      <div className="aki-card p-0 overflow-hidden">
        {[
          { label: 'Output VAT',     value: fmtK(output), color: 'text-emerald-600', dot: 'bg-emerald-500' },
          { label: 'Input VAT',      value: fmtK(input),  color: 'text-sky-600',     dot: 'bg-sky-500'     },
          { label: 'Reverse Charge', value: fmtK(rc),     color: 'text-rose-600',    dot: 'bg-rose-500'    },
          { label: 'WHT Collected',  value: fmtK(wht),    color: 'text-amber-600',   dot: 'bg-amber-500'   },
        ].map((row, i, arr) => (
          <div
            key={row.label}
            className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[var(--border-alt)]' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.dot}`} />
              <span className="text-[11px] text-[var(--text-3)]">{row.label}</span>
            </div>
            <span className={`text-[12px] font-bold font-mono tabular-nums ${row.color}`}>
              {loading ? <span className="aki-skeleton h-3 w-12 rounded block" /> : `ETB ${row.value}`}
            </span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="aki-card p-0 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--border-alt)] bg-[var(--surface-alt)]">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-4)]">Quick Actions</span>
        </div>
        <div className="p-3 space-y-1.5">
          {canWrite && (
            <button
              onClick={onAddOutput}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-[var(--text-2)] hover:bg-[var(--surface-alt)] transition-colors text-left"
            >
              <Icon name="PLUS" size={13} className="text-emerald-500 shrink-0" />
              Add Output Entry
              <span className="ml-auto text-[9px] font-mono text-[var(--text-4)]">N</span>
            </button>
          )}
          {canWrite && (
            <button
              onClick={onAddInput}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-[var(--text-2)] hover:bg-[var(--surface-alt)] transition-colors text-left"
            >
              <Icon name="PLUS" size={13} className="text-sky-500 shrink-0" />
              Add Input Entry
              <span className="ml-auto text-[9px] font-mono text-[var(--text-4)]">I</span>
            </button>
          )}
          {canFile && (
            <button
              onClick={onFileReturn}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-[#0056D2] bg-[var(--blue-600-50)] hover:bg-[var(--blue-600-100)] border border-[var(--blue-600-100)] transition-colors"
            >
              <Icon name="SEND" size={13} className="shrink-0" />
              File VAT Return
            </button>
          )}
        </div>
      </div>

      {/* Readiness validation panel */}
      {validationItems.length > 0 && (
        <AkiValidationPanel items={validationItems} loading={!readiness} />
      )}
    </aside>
  );
}

// ── Zone 3: Right Context Rail ────────────────────────────────────────────────

interface RightRailProps {
  period: string;
  filings: any[];
  submissions: any[];
  readiness: any;
  readinessLoading: boolean;
}

function RightRail({ period, filings, submissions, readiness, readinessLoading }: RightRailProps) {
  // Build audit trail from recent filings
  const auditEntries: AkiAuditEntry[] = filings.slice(0, 8).map(f => ({
    id: f.id ?? f.period,
    action: f.status === 'FILED' || f.status === 'SUBMITTED'
      ? `VAT Return Filed — ${f.period}`
      : f.status === 'PAID'
      ? `Payment Confirmed — ${f.period}`
      : `${f.status} — ${f.period}`,
    user: f.filedBy ?? 'System',
    time: f.filedAt ? new Date(f.filedAt).toLocaleString('en-ET', { dateStyle: 'short', timeStyle: 'short' }) : f.period,
    type: f.status === 'PAID' ? 'success' as const
        : f.status === 'OVERDUE' ? 'danger' as const
        : 'default' as const,
    detail: f.netPayable != null ? `Net payable: ETB ${fmtK(f.netPayable)}` : undefined,
  }));

  // Submission history (eTax portal)
  const recentSubs = submissions.slice(0, 3);

  // Filing workflow progress for current period
  const selectedFiling = filings.find(f => f.period === period);
  const workflowStep = selectedFiling?.status === 'PAID' ? 3
    : selectedFiling?.status === 'FILED' || selectedFiling?.status === 'SUBMITTED' ? 2
    : selectedFiling ? 1 : 0;

  return (
    <aside
      className="shrink-0 w-[280px] min-w-[240px] max-w-[300px] flex flex-col gap-4"
      aria-label="VAT context panel"
    >
      {/* Filing workflow stepper */}
      <div className="aki-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-alt)] bg-[var(--surface-alt)] flex items-center gap-2">
          <Icon name="SHIELD_CHECK" size={12} className="text-[var(--text-4)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-4)]">Filing Workflow</span>
        </div>
        <div className="p-4">
          <AkiMultiStateProgress steps={[
            { label: 'Ledger', done: workflowStep >= 1, active: workflowStep === 0 },
            { label: 'Review', done: workflowStep >= 2, active: workflowStep === 1 },
            { label: 'Filed',  done: workflowStep >= 3, active: workflowStep === 2 },
            { label: 'Paid',   done: workflowStep >= 4, active: workflowStep === 3 },
          ]} />
          {!selectedFiling && (
            <p className="text-[10px] text-[var(--text-4)] mt-3 text-center">No filing found for {period}</p>
          )}
        </div>
      </div>

      {/* Declaration readiness check */}
      <div className="aki-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-alt)] bg-[var(--surface-alt)] flex items-center gap-2">
          <Icon name="CHECK_CIRCLE" size={12} className="text-[var(--text-4)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-4)]">Declaration Readiness</span>
        </div>
        <div className="p-4">
          {readinessLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aki-skeleton h-8 rounded" />
              ))}
            </div>
          ) : readiness ? (
            <div className="space-y-2.5">
              <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-semibold ${
                readiness.ready
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-300'
              }`}>
                <Icon name={readiness.ready ? 'CHECK_CIRCLE' : 'X_CIRCLE'} size={14} className="shrink-0" />
                {readiness.ready ? 'Ready to submit' : 'Errors found'}
              </div>
              {[
                { k: 'Output VAT', v: `ETB ${fmtK(readiness.summary?.salesAnnexureVat)}` },
                { k: 'Purchase VAT', v: `ETB ${fmtK(readiness.summary?.purchaseAnnexureVat)}` },
                { k: 'WHT Certs', v: `${readiness.summary?.whtCertCount ?? 0} issued` },
              ].map(row => (
                <div key={row.k} className="flex items-center justify-between text-[10px]">
                  <span className="text-[var(--text-3)]">{row.k}</span>
                  <span className="font-mono font-semibold text-[var(--text-2)]">{row.v}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--text-4)] text-center py-2">Select a period to check readiness</p>
          )}
        </div>
      </div>

      {/* Recent eTax submissions */}
      {recentSubs.length > 0 && (
        <div className="aki-card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-alt)] bg-[var(--surface-alt)] flex items-center gap-2">
            <Icon name="SEND" size={12} className="text-[var(--text-4)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-4)]">Recent Submissions</span>
          </div>
          <div className="divide-y divide-[var(--border-alt)]">
            {recentSubs.map((s: any) => (
              <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  s.status === 'ACCEPTED' ? 'bg-emerald-500'
                  : s.status === 'REJECTED' ? 'bg-rose-500'
                  : 'bg-amber-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--text-2)] truncate">{s.period}</p>
                  <p className="text-[10px] text-[var(--text-4)]">{s.status}</p>
                </div>
                {s.ercaReferenceNo && (
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">{s.ercaReferenceNo.slice(-6)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit trail */}
      {auditEntries.length > 0 && (
        <div className="aki-card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-alt)] bg-[var(--surface-alt)] flex items-center gap-2">
            <Icon name="CLOCK" size={12} className="text-[var(--text-4)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-4)]">Filing History</span>
          </div>
          <div className="p-4">
            <AkiAuditTrail entries={auditEntries} />
          </div>
        </div>
      )}

      {/* Legal reference */}
      <div className="px-4 py-3 rounded-lg border border-[var(--border-alt)] bg-[var(--surface-alt)]">
        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--text-4)] mb-1.5">Legal Reference</p>
        <div className="space-y-0.5">
          {[
            'VAT: Proclamation 1341/2024',
            'WHT: Proclamation 1395/2025',
            'Threshold: Regulation 570/2025',
            'Rate: 15% standard / 3% WHT',
            'Deadline: 30th of next month',
          ].map(t => (
            <p key={t} className="text-[9px] text-[var(--text-3)] leading-relaxed">{t}</p>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── Zone 2: Center — Ledger & Filings Tables ──────────────────────────────────

function LedgerTable({
  entries, loading, onAdd, onDelete, canWrite, type,
}: {
  entries: any[]; loading: boolean;
  onAdd: () => void; onDelete: (id: string) => void;
  canWrite: boolean; type: 'input' | 'output';
}) {
  const [search, setSearch] = useState('');
  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    return !q || (e.supplier ?? e.customer ?? '').toLowerCase().includes(q) || (e.invoiceNo ?? '').toLowerCase().includes(q);
  });
  const totalVat = filtered.reduce((s, e) => s + Number(e.vatAmount ?? 0), 0);
  const partyLabel = type === 'input' ? 'Supplier' : 'Customer';

  return (
    <div className="space-y-3">
      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: `Search ${partyLabel.toLowerCase()}…` }}
        actions={canWrite && (
          <Btn variant="secondary" size="sm" icon={<Icon name="PLUS" size={12} />} onClick={onAdd}>Add</Btn>
        )}
        count={filtered.length}
        countLabel="entries"
      />
      <AppTable>
        <thead>
          <tr>
            <AppTh>{partyLabel}</AppTh>
            <AppTh>Invoice No</AppTh>
            <AppTh>Date</AppTh>
            <AppTh align="right">Net Amount</AppTh>
            <AppTh align="right">VAT Amount</AppTh>
            {canWrite && <AppTh align="right" width="40px">{''}</AppTh>}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <AppTr key={i}>
                  {Array.from({ length: canWrite ? 6 : 5 }).map((__, j) => (
                    <AppTd key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></AppTd>
                  ))}
                </AppTr>
              ))
            : filtered.length === 0
            ? <AppTr><td colSpan={canWrite ? 6 : 5} className="px-4 py-12 text-center text-[var(--text-4)] text-sm">No entries for this period.</td></AppTr>
            : filtered.map(e => (
                <AppTr key={e.id}>
                  <AppTd className="font-semibold">{e.supplier ?? e.customer ?? '—'}</AppTd>
                  <AppTd className="font-mono text-[11px]">{e.invoiceNo ?? '—'}</AppTd>
                  <AppTd>{e.date ? new Date(e.date).toLocaleDateString('en-ET') : '—'}</AppTd>
                  <AppTd align="right"><Amount value={e.netAmount} size="sm" /></AppTd>
                  <AppTd align="right"><Amount value={e.vatAmount} size="sm" /></AppTd>
                  {canWrite && (
                    <AppTd align="right">
                      {!e.sourceRef && (
                        <button
                          onClick={() => onDelete(e.id)}
                          aria-label="Delete entry"
                          className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                        >
                          <Icon name="CLOSE" size={12} />
                        </button>
                      )}
                    </AppTd>
                  )}
                </AppTr>
              ))
          }
        </tbody>
        {filtered.length > 0 && (
          <tfoot>
            <tr className="bg-emerald-50/50 dark:bg-emerald-950/10">
              <td colSpan={canWrite ? 4 : 3} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total VAT</td>
              <td className="px-3 py-2 text-right"><Amount value={totalVat} size="sm" /></td>
              {canWrite && <td />}
            </tr>
          </tfoot>
        )}
      </AppTable>
    </div>
  );
}

function FilingsTable({ filings, loading, canWrite, onRefresh }: {
  filings: any[]; loading: boolean; canWrite: boolean; onRefresh?: () => void;
}) {
  const [apportionModal, setApportionModal] = useState<{ open: boolean; filing: any | null }>({ open: false, filing: null });
  const [apportionPct, setApportionPct]     = useState('100');
  const [locking, setLocking]               = useState<string | null>(null);
  const [saving,  setSaving]                = useState(false);

  const handleLock = async (filing: any) => {
    if (!filing.id) return;
    if (!window.confirm(`Lock period ${filing.period}? This cannot be undone.`)) return;
    setLocking(filing.id);
    try {
      await lockVatPeriod(filing.id);
      toast.success(`Period ${filing.period} locked`);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to lock period');
    } finally { setLocking(null); }
  };

  const handleApportionment = async () => {
    if (!apportionModal.filing?.id) return;
    const pct = parseFloat(apportionPct) / 100;
    if (isNaN(pct) || pct < 0 || pct > 1) return toast.error('Enter a value between 0 and 100');
    setSaving(true);
    try {
      const result = await setVatApportionment(apportionModal.filing.id, pct);
      toast.success(`Apportionment ${apportionPct}% — claimable: ETB ${fmtK(result.claimableInputVat)}`);
      setApportionModal({ open: false, filing: null });
      onRefresh?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <AkiSectionHeader
        title="VAT Filing History"
        subtitle="Period-by-period filing records, apportionment and lock status"
        icon={<Icon name="RECEIPT" size={14} />}
      />
      <AppTable>
        <thead>
          <tr>
            <AppTh>Period</AppTh>
            <AppTh align="right">Output VAT</AppTh>
            <AppTh align="right">Input VAT</AppTh>
            <AppTh align="right">Carry-Fwd</AppTh>
            <AppTh align="right">Net Payable</AppTh>
            <AppTh>Apportion%</AppTh>
            <AppTh>Status</AppTh>
            <AppTh>Filed At</AppTh>
            {canWrite && <AppTh>Actions</AppTh>}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <AppTr key={i}>
                  {Array.from({ length: canWrite ? 9 : 8 }).map((__, j) => (
                    <AppTd key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></AppTd>
                  ))}
                </AppTr>
              ))
            : filings.length === 0
            ? <AppTr><td colSpan={canWrite ? 9 : 8} className="px-4 py-12 text-center text-[var(--text-4)] text-sm">No filings yet.</td></AppTr>
            : filings.map(f => {
                const isLocked  = !!f.periodLockedAt;
                const carryFwd  = Number(f.inputCreditCarryForward ?? 0);
                const apportion = Number(f.inputApportionmentPct ?? 1);
                return (
                  <AppTr key={f.id ?? f.period}>
                    <AppTd>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-[12px]">{f.period}</span>
                        {isLocked && (
                          <span title={`Locked ${f.periodLockedAt ? new Date(f.periodLockedAt).toLocaleDateString() : ''}`}>
                          <Icon name="LOCK" size={10} className="text-violet-500" />
                        </span>
                        )}
                      </div>
                    </AppTd>
                    <AppTd align="right"><Amount value={f.collected ?? f.outputVat} size="sm" /></AppTd>
                    <AppTd align="right"><Amount value={f.paid ?? f.inputVat} size="sm" /></AppTd>
                    <AppTd align="right">
                      {carryFwd > 0
                        ? <span className="text-sky-600 dark:text-sky-400 text-[11px] font-semibold font-mono">{fmtK(carryFwd)}</span>
                        : <span className="text-[var(--text-5)]">—</span>}
                    </AppTd>
                    <AppTd align="right"><Amount value={f.netPayable} size="sm" /></AppTd>
                    <AppTd>
                      <span className={`text-[11px] font-semibold font-mono ${apportion < 1 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-4)]'}`}>
                        {(apportion * 100).toFixed(0)}%
                      </span>
                    </AppTd>
                    <AppTd><StatusBadge status={f.status} /></AppTd>
                    <AppTd className="text-[11px] text-[var(--text-4)]">
                      {f.filedAt ? new Date(f.filedAt).toLocaleDateString('en-ET') : '—'}
                    </AppTd>
                    {canWrite && (
                      <AppTd>
                        <div className="flex items-center gap-1">
                          {!isLocked && (
                            <button onClick={() => { setApportionPct(String((apportion * 100).toFixed(0))); setApportionModal({ open: true, filing: f }); }}
                              className="text-[10px] font-bold text-sky-600 hover:underline dark:text-sky-400 px-1">
                              Apportion
                            </button>
                          )}
                          {!isLocked && ['FILED', 'PAID', 'SUBMITTED'].includes(f.status) && (
                            <button onClick={() => handleLock(f)} disabled={locking === f.id}
                              className="text-[10px] font-bold text-violet-600 hover:underline dark:text-violet-400 px-1 disabled:opacity-40">
                              {locking === f.id ? '…' : 'Lock'}
                            </button>
                          )}
                          {isLocked && <span className="text-[9px] font-bold text-violet-500 px-1">Locked</span>}
                        </div>
                      </AppTd>
                    )}
                  </AppTr>
                );
              })
          }
        </tbody>
      </AppTable>

      {apportionModal.open && apportionModal.filing && (
        <Modal open title={`Input VAT Apportionment — ${apportionModal.filing.period}`}
          onClose={() => setApportionModal({ open: false, filing: null })}
          footer={
            <><Btn variant="secondary" onClick={() => setApportionModal({ open: false, filing: null })}>Cancel</Btn>
              <Btn variant="primary" loading={saving} onClick={handleApportionment}>Apply</Btn></>
          }
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-[12px] text-amber-700 dark:text-amber-300">
              <p className="font-semibold mb-1">Proclamation 1341/2024 Art. 26 — Partial Exemption</p>
              <p className="font-mono text-[10px] mt-1">Apportionment % = Taxable Sales ÷ Total Sales × 100</p>
            </div>
            <FormField label="Claimable Input VAT %" required>
              <div className="flex items-center gap-2">
                <Input type="number" min="0" max="100" step="0.1" value={apportionPct}
                  onChange={e => setApportionPct(e.target.value)} className="w-28" />
                <span className="text-[12px] text-[var(--text-3)]">% (100% = fully claimable)</span>
              </div>
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── KPI Stat Strip (top of center zone) ──────────────────────────────────────

function VatStatStrip({ dashboard, loading }: { dashboard: any; loading: boolean }) {
  const output  = Number(dashboard?.totalOutputVat ?? 0);
  const input   = Number(dashboard?.totalInputVat ?? 0);
  const net     = Number(dashboard?.netPayable ?? 0);
  const refunds = Number(dashboard?.pendingRefunds ?? 0);
  const isRefund = net < 0;

  return (
    <AkiStatStrip
      loading={loading}
      cells={[
        { label: 'Output VAT',      value: `ETB ${fmtK(output)}`,       sub: 'Collected from customers', accentLine: 'bg-emerald-500' },
        { label: 'Input VAT',       value: `ETB ${fmtK(input)}`,        sub: 'Paid to suppliers',        accentLine: 'bg-sky-500'     },
        { label: isRefund ? 'Refund Due' : 'Net Payable', value: `ETB ${fmtK(Math.abs(net))}`, sub: isRefund ? 'Credit balance' : 'Due 30th next month', trend: isRefund ? 5.2 : -3.1, accentLine: isRefund ? 'bg-sky-500' : 'bg-[#0056D2]' },
        { label: 'Pending Refunds', value: `ETB ${fmtK(refunds)}`,      sub: 'Awaiting MoR approval',    accentLine: 'bg-violet-500'  },
      ]}
    />
  );
}

// ── Main Page — Three-Zone Shell ──────────────────────────────────────────────

export default function VatAdministration() {
  usePageTitle('VAT / ERCA Filing');
  const { t: _t } = useTranslation();
  const { can }   = useAuth();
  const canWrite  = can('vat:write');
  const canFile   = can('vat:file');
  const { log }   = useAuditLog();

  const [period, setPeriod]             = useState(currentPeriod);
  const [modal, setModal]               = useState<string | null>(null);
  const [showVatReturn, setShowVatReturn] = useState(false);
  const [activeTab, setActiveTab]       = useState<
    'overview' | 'input' | 'output' | 'withholding' | 'reverse' | 'filings' | 'refunds' | 'drrf' | 'reports'
  >('overview');

  const { filings, loading: filingsLoading, refetch: refetchFilings } = useVatFilings();
  const { data: dashboard, loading: dashLoading, refetch: refetchDash } = useVatDashboard(period);
  const { entries: inputEntries,  loading: inputLoading,  refetch: refetchInput,  remove: removeInput  } = useInputLedger(period);
  const { entries: outputEntries, loading: outputLoading, refetch: refetchOutput, remove: removeOutput } = useOutputLedger(period);
  const { entries: whEntries,     loading: whLoading,     refetch: refetchWh    } = useWithholding(period);
  const { entries: rcEntries,     loading: rcLoading,     refetch: refetchRc    } = useReverseCharges(period);
  const { claims,  loading: claimsLoading, refetch: refetchClaims  } = useRefundClaims();
  const { submissions, submitting, submitVatReturn } = useEtaxSubmissions();
  const { data: readiness, loading: readinessLoading } = useDeclarationReadiness(period);

  const loading = filingsLoading || dashLoading;

  const refetchAll = useCallback(() => {
    refetchFilings(); refetchDash(); refetchInput();
    refetchOutput(); refetchWh(); refetchRc(); refetchClaims();
  }, [refetchFilings, refetchDash, refetchInput, refetchOutput, refetchWh, refetchRc, refetchClaims]);

  useInterval(refetchAll, 60_000);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n' && canWrite) setModal('output');
      if (e.key === 'i' && canWrite) setModal('input');
      if (e.key === 'r') refetchAll();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [canWrite, refetchAll]);

  const handleModalSaved = () => { setModal(null); refetchAll(); };

  const handleSubmitVat = async () => {
    try {
      await submitVatReturn(period, Number(dashboard?.netPayable ?? 0));
      log('VAT_FILED', { period, netPayable: dashboard?.netPayable }, 'VatFiling', period);
      setShowVatReturn(false);
      refetchAll();
    } catch { /* toast shown by hook */ }
  };

  const TABS = [
    { id: 'overview',    label: 'Overview'    },
    { id: 'output',      label: `Output (${outputEntries.length})`  },
    { id: 'input',       label: `Input (${inputEntries.length})`    },
    { id: 'withholding', label: `WHT (${whEntries.length})`         },
    { id: 'reverse',     label: `Reverse (${rcEntries.length})`     },
    { id: 'filings',     label: `Filings (${filings.length})`       },
    { id: 'refunds',     label: `Refunds (${claims.length})`        },
    { id: 'drrf',        label: 'DRRF Levy'   },
    { id: 'reports',     label: 'Tax Reports' },
  ] as const;

  return (
    <AppPage
      title="VAT / ERCA Administration"
      subtitle="Ethiopian VAT 15% · Monthly filing · eTax portal submission · Proclamation 1341/2024"
      icon={<Icon name="SHIELD_CHECK" size={18} />}
      crumbs={[{ label: 'VAT Admin' }]}
      actions={
        <>
          <Btn
            variant="ghost" size="sm"
            icon={<Icon name="REFRESH" size={12} className={loading ? 'animate-spin' : ''} />}
            onClick={refetchAll}
          >
            Refresh
          </Btn>
          {canFile && (
            <Btn variant="primary" size="sm" icon={<Icon name="SEND" size={12} />} onClick={() => setShowVatReturn(true)}>
              File Return
            </Btn>
          )}
        </>
      }
      tabs={
        <AppTabs
          tabs={TABS.map(t => ({ key: t.id, label: t.label }))}
          active={activeTab}
          onChange={k => setActiveTab(k as any)}
        />
      }
    >
      {/*
       * ═══════════════════════════════════════════════════════════════════════
       * THREE-ZONE LAYOUT
       *   ┌─────────────────────────────────────────────────────────┐
       *   │  Zone 1 (260px)  │  Zone 2 (flex)    │  Zone 3 (280px)  │
       *   │  Left sidebar    │  Center content   │  Right context   │
       *   │  KPI summary     │  Tab data tables  │  Audit/readiness │
       *   └─────────────────────────────────────────────────────────┘
       * ═══════════════════════════════════════════════════════════════════════
       */}

      {/* KPI stat strip — spans full width above the three zones */}
      <div className="mb-5">
        <VatStatStrip dashboard={dashboard} loading={loading} />
      </div>

      {/* Three-zone body */}
      <div className="flex gap-5 items-start min-w-0">

        {/* ── Zone 1: Left sticky sidebar ── */}
        <div className="sticky top-[var(--header-h,48px)] self-start hidden xl:block">
          <LeftSidebar
            dashboard={dashboard}
            loading={loading}
            period={period}
            onPeriodChange={setPeriod}
            onAddOutput={() => setModal('output')}
            onAddInput={() => setModal('input')}
            onFileReturn={() => setShowVatReturn(true)}
            canWrite={canWrite}
            canFile={canFile}
            readiness={readiness}
          />
        </div>

        {/* ── Zone 2: Center content ── */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Period picker for non-xl screens (xl has it in sidebar) */}
          <div className="xl:hidden flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5">
              <Icon name="CALENDAR" size={13} className="text-[var(--text-4)]" />
              <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
                className="bg-transparent text-[12px] font-bold text-[var(--text)] outline-none font-mono" />
            </div>
            {canWrite && (
              <Btn variant="secondary" size="sm" icon={<Icon name="PLUS" size={12} />} onClick={() => setModal('output')}>
                Add Entry
              </Btn>
            )}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <FilingsTable filings={filings.slice(0, 6)} loading={filingsLoading} canWrite={canWrite} onRefresh={refetchFilings} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <LedgerTable entries={outputEntries.slice(0, 5)} loading={outputLoading} onAdd={() => setModal('output')} onDelete={removeOutput} canWrite={canWrite} type="output" />
                <LedgerTable entries={inputEntries.slice(0, 5)} loading={inputLoading} onAdd={() => setModal('input')} onDelete={removeInput} canWrite={canWrite} type="input" />
              </div>
            </div>
          )}

          {activeTab === 'output' && (
            <LedgerTable entries={outputEntries} loading={outputLoading} onAdd={() => setModal('output')} onDelete={removeOutput} canWrite={canWrite} type="output" />
          )}

          {activeTab === 'input' && (
            <LedgerTable entries={inputEntries} loading={inputLoading} onAdd={() => setModal('input')} onDelete={removeInput} canWrite={canWrite} type="input" />
          )}

          {activeTab === 'withholding' && (
            <div className="space-y-3">
              <Toolbar
                actions={canWrite && <Btn variant="secondary" size="sm" icon={<Icon name="PLUS" size={12} />} onClick={() => setModal('withholding')}>Add</Btn>}
                count={whEntries.length}
                countLabel="entries"
              />
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Supplier</AppTh><AppTh>TIN</AppTh><AppTh>Invoice Date</AppTh>
                    <AppTh align="right">Invoice Amount</AppTh><AppTh align="right">WHT (3%)</AppTh><AppTh>Status</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {whLoading
                    ? Array.from({ length: 3 }).map((_, i) => <AppTr key={i}>{Array.from({ length: 6 }).map((__, j) => <AppTd key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></AppTd>)}</AppTr>)
                    : whEntries.length === 0
                    ? <AppTr><td colSpan={6} className="px-4 py-12 text-center text-[var(--text-4)] text-sm">No withholding entries.</td></AppTr>
                    : whEntries.map(e => (
                        <AppTr key={e.id}>
                          <AppTd className="font-semibold">{e.supplier}</AppTd>
                          <AppTd className="font-mono text-[11px]">{e.tin ?? '—'}</AppTd>
                          <AppTd>{e.invoiceDate ? new Date(e.invoiceDate).toLocaleDateString('en-ET') : '—'}</AppTd>
                          <AppTd align="right"><Amount value={e.invoiceAmount} size="sm" /></AppTd>
                          <AppTd align="right"><Amount value={e.withheldVat} size="sm" /></AppTd>
                          <AppTd><StatusBadge status={e.remitted ? 'PAID' : 'PENDING'} /></AppTd>
                        </AppTr>
                      ))
                  }
                </tbody>
              </AppTable>
            </div>
          )}

          {activeTab === 'reverse' && (
            <div className="space-y-3">
              <Toolbar
                actions={canWrite && <Btn variant="secondary" size="sm" icon={<Icon name="PLUS" size={12} />} onClick={() => setModal('reverse')}>Add</Btn>}
                count={rcEntries.length}
                countLabel="entries"
              />
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Supplier</AppTh><AppTh>Service</AppTh><AppTh>Date</AppTh>
                    <AppTh align="right">Amount (ETB)</AppTh><AppTh align="right">VAT Due (15%)</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {rcLoading
                    ? Array.from({ length: 3 }).map((_, i) => <AppTr key={i}>{Array.from({ length: 5 }).map((__, j) => <AppTd key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></AppTd>)}</AppTr>)
                    : rcEntries.length === 0
                    ? <AppTr><td colSpan={5} className="px-4 py-12 text-center text-[var(--text-4)] text-sm">No reverse charge entries.</td></AppTr>
                    : rcEntries.map(e => (
                        <AppTr key={e.id}>
                          <AppTd className="font-semibold">{e.supplier}</AppTd>
                          <AppTd>{e.service}</AppTd>
                          <AppTd>{e.invoiceDate ? new Date(e.invoiceDate).toLocaleDateString('en-ET') : '—'}</AppTd>
                          <AppTd align="right"><Amount value={e.amountETB} size="sm" /></AppTd>
                          <AppTd align="right"><Amount value={e.vatDue} size="sm" negative /></AppTd>
                        </AppTr>
                      ))
                  }
                </tbody>
              </AppTable>
            </div>
          )}

          {activeTab === 'filings' && (
            <FilingsTable filings={filings} loading={filingsLoading} canWrite={canWrite} onRefresh={refetchFilings} />
          )}

          {activeTab === 'refunds' && (
            <div className="space-y-3">
              <Toolbar
                actions={canWrite && <Btn variant="secondary" size="sm" icon={<Icon name="PLUS" size={12} />} onClick={() => setModal('refund')}>New Claim</Btn>}
                count={claims.length}
                countLabel="claims"
              />
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Ref</AppTh><AppTh>Period</AppTh><AppTh align="right">Amount</AppTh><AppTh>Status</AppTh><AppTh>Submitted</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {claimsLoading
                    ? Array.from({ length: 3 }).map((_, i) => <AppTr key={i}>{Array.from({ length: 5 }).map((__, j) => <AppTd key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></AppTd>)}</AppTr>)
                    : claims.length === 0
                    ? <AppTr><td colSpan={5} className="px-4 py-12 text-center text-[var(--text-4)] text-sm">No refund claims.</td></AppTr>
                    : claims.map(c => (
                        <AppTr key={c.id}>
                          <AppTd className="font-mono text-[var(--text-4)]">{c.ref ?? '—'}</AppTd>
                          <AppTd className="font-semibold">{c.period}</AppTd>
                          <AppTd align="right"><Amount value={c.amount} size="sm" positive /></AppTd>
                          <AppTd><StatusBadge status={c.status} /></AppTd>
                          <AppTd>{c.submittedDate ? new Date(c.submittedDate).toLocaleDateString('en-ET') : '—'}</AppTd>
                        </AppTr>
                      ))
                  }
                </tbody>
              </AppTable>
            </div>
          )}

          {activeTab === 'drrf' && (
            <Suspense fallback={<div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />}>
              <LevyCollectionPanel />
            </Suspense>
          )}

          {activeTab === 'reports' && (
            <Suspense fallback={<div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />}>
              <VatReportsPanel />
            </Suspense>
          )}
        </div>

        {/* ── Zone 3: Right context rail ── */}
        <div className="sticky top-[var(--header-h,48px)] self-start hidden lg:block">
          <RightRail
            period={period}
            filings={filings}
            submissions={Array.isArray(submissions) ? submissions : []}
            readiness={readiness}
            readinessLoading={readinessLoading}
          />
        </div>

      </div>{/* end three-zone body */}

      {/* ── Entry Modals ── */}
      {modal === 'input'       && <AddInputModal       onClose={() => setModal(null)} onSaved={handleModalSaved} period={period} />}
      {modal === 'output'      && <AddOutputModal      onClose={() => setModal(null)} onSaved={handleModalSaved} period={period} />}
      {modal === 'withholding' && <AddWithholdingModal onClose={() => setModal(null)} onSaved={handleModalSaved} period={period} />}
      {modal === 'reverse'     && <AddReverseChargeModal onClose={() => setModal(null)} onSaved={handleModalSaved} period={period} />}
      {modal === 'refund'      && <AddRefundModal      onClose={() => setModal(null)} onSaved={handleModalSaved} period={period} />}

      {/* ── File VAT Return Modal ── */}
      {showVatReturn && dashboard && (
        <Modal open={showVatReturn} title={`Submit VAT Return — ${period}`} onClose={() => setShowVatReturn(false)} width="max-w-2xl">
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-800 text-[12px] text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
              <Icon name="INFO" size={13} className="flex-shrink-0 mt-0.5" />
              <span>Review the VAT return summary before submitting to the MoR e-Tax Portal (etax.mor.gov.et).</span>
            </div>

            <AppTable>
              <thead>
                <tr><AppTh>Description</AppTh><AppTh align="right">Amount (ETB)</AppTh></tr>
              </thead>
              <tbody>
                {[
                  { label: 'Box 1 — Output VAT (Sales)',        value: Number(dashboard.totalOutputVat ?? 0),     color: 'text-emerald-700' },
                  { label: 'Box 2 — Input VAT (Claimable)',     value: -Number(dashboard.claimableInputVat ?? 0), color: 'text-emerald-700' },
                  { label: 'Box 3 — Reverse Charge VAT',        value: Number(dashboard.totalReverseCharge ?? 0), color: 'text-rose-700'    },
                  { label: 'Box 4 — Withholding Tax Collected', value: Number(dashboard.totalWithheld ?? 0),      color: 'text-amber-700'   },
                ].map(r => (
                  <AppTr key={r.label}>
                    <AppTd className="text-[var(--text-3)]">{r.label}</AppTd>
                    <AppTd align="right" className={`font-bold ${r.color}`}><Amount value={r.value} size="sm" /></AppTd>
                  </AppTr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--surface-alt)]">
                  <td className="px-4 py-3 font-bold text-[var(--text)]">
                    Net VAT {Number(dashboard.netPayable ?? 0) < 0 ? 'Refundable' : 'Payable'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Amount value={Number(dashboard.netPayable ?? 0)} size="md" />
                  </td>
                </tr>
              </tfoot>
            </AppTable>

            <div className="flex gap-2">
              <Btn variant="ghost" className="flex-1" onClick={() => setShowVatReturn(false)}>Cancel</Btn>
              {canFile && (
                <Btn
                  variant="primary" className="flex-1"
                  onClick={handleSubmitVat}
                  disabled={submitting}
                  icon={<Icon name={submitting ? 'REFRESH' : 'SEND'} size={13} className={submitting ? 'animate-spin' : ''} />}
                >
                  {submitting ? 'Submitting…' : 'Submit to MoR eTax'}
                </Btn>
              )}
            </div>
          </div>
        </Modal>
      )}
    </AppPage>
  );
}
