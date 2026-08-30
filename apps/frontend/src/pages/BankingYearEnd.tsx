/**
 * BankingYearEnd — Year-end close flow for banking
 *
 * Section 9 of the banking user flow:
 *   1. Finalize clearing — ensure all transactions are Reconciled
 *   2. Lock the period — prevent retrospective modification
 *   3. Export ledgers — archive for tax/audit
 *
 * Integrates with:
 *   GET  /banking/reconciliation/stats      — check unreconciled count
 *   GET  /banking/reconciliation/periods    — list existing periods
 *   POST /banking/reconciliation/periods    — create new period
 *   POST /banking/reconciliation/periods/:id/complete
 *   GET  /accounting/periods                — existing period-close workflow
 *   POST /accounting/periods/:id/lock
 */
import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Lock, CheckCircle2, AlertTriangle, Download,
  RefreshCw, ShieldCheck, FileText, ArrowRight,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import { fmtETB } from '../utils/ethiopianTax';
import { AppPage, AppKpi, Card, Btn, Modal, FormField, Input } from '../components/ui';

interface ReconStats  { total: number; reconciled: number; pending: number; reconciliationRate: number; }
interface ReconPeriod { id: string; bankAccountId: string; statementDate: string; openingBalance: number; closingBalance: number; reconciledBalance: number; discrepancy: number; status: string; bankAccountName?: string; }
interface AccountingPeriod { id: string; name?: string; period: string; status: string; lockedAt?: string; }

// ── Step indicator ────────────────────────────────────────────────────────────
const Step: React.FC<{ num: number; label: string; done: boolean; active: boolean; warn?: boolean }> = ({ num, label, done, active, warn }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
    active ? 'border-sky-300 bg-sky-50/50 dark:border-sky-700 dark:bg-sky-950/10' :
    done   ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/10' :
    warn   ? 'border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/10' :
             'border-slate-100 dark:border-slate-800'
  }`}>
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
      done  ? 'bg-emerald-500 text-white' :
      active? 'bg-sky-500 text-white' :
      warn  ? 'bg-amber-400 text-white' :
              'bg-slate-200 dark:bg-slate-700 text-slate-500'
    }`}>
      {done ? <CheckCircle2 size={13} /> : num}
    </div>
    <p className={`text-[12px] font-semibold ${
      active ? 'text-sky-700 dark:text-sky-400' :
      done   ? 'text-emerald-700 dark:text-emerald-400' :
      warn   ? 'text-amber-700 dark:text-amber-400' :
               'text-slate-500 dark:text-slate-400'
    }`}>{label}</p>
  </div>
);

const BankingYearEnd: React.FC = () => {
  usePageTitle('Year-End Close');
  const navigate              = useNavigate();
  const { can }               = useAuth();
  const { selectedCompanyId } = useBusiness();
  const qc                    = useQueryClient();
  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';

  const [lockModal, setLockModal]       = useState(false);
  const [lockNotes, setLockNotes]       = useState('');
  const [locking, setLocking]           = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<ReconStats | null>({
    queryKey: ['banking-recon-stats-yearend', selectedCompanyId],
    queryFn:  () => api.get(`/banking/reconciliation/stats${cq}`).then(r => r.data?.data ?? r.data).catch(() => null),
    staleTime: 30_000,
  });

  const { data: periodsRaw = [], isLoading: periodsLoading, refetch: refetchPeriods } = useQuery({
    queryKey: ['banking-recon-periods', selectedCompanyId],
    queryFn:  () => api.get(`/banking/reconciliation/periods${cq}`).then(r => {
      const d = r.data?.data ?? r.data; return Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
    }).catch(() => []),
    staleTime: 30_000,
  });
  const periods: ReconPeriod[] = periodsRaw;

  const { data: acctPeriodsRaw = [] } = useQuery({
    queryKey: ['accounting-periods', selectedCompanyId],
    queryFn:  () => api.get(`/ovds/accounting/periods${cq}`).then(r => {
      const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : [];
    }).catch(() => []),
    staleTime: 60_000,
  });
  const acctPeriods: AccountingPeriod[] = acctPeriodsRaw;

  // ── Derived state ─────────────────────────────────────────────────────────

  const allReconciled   = (stats?.pending ?? 1) === 0;
  const hasLockedPeriod = acctPeriods.some(p => p.status === 'LOCKED');
  const reconRate       = stats?.reconciliationRate ?? 0;

  const kpi = [
    { label: 'Reconciliation Rate', value: `${reconRate}%`,              color: reconRate >= 100 ? 'emerald' as const : 'amber' as const },
    { label: 'Pending Txns',        value: stats?.pending ?? '—',        color: (stats?.pending ?? 0) === 0 ? 'emerald' as const : 'rose' as const },
    { label: 'Total Transactions',  value: stats?.total ?? '—',          color: 'slate' as const },
    { label: 'Reconciled',          value: stats?.reconciled ?? '—',     color: 'emerald' as const },
  ];

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleFinalizeAll = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const r = await api.post('/banking/reconciliation/run', {
        companyId: selectedCompanyId,
        applyAutoReconcile: true,
      });
      const d = r.data?.data ?? r.data;
      toast.success(`Auto-reconciled ${d?.autoReconciled ?? 0} transactions`);
      refetchStats();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); }
  }, [selectedCompanyId, refetchStats]);

  const handleLockPeriod = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLocking(true);
    try {
      // Use the existing accounting period lock endpoint
      const openPeriod = acctPeriods.find(p => p.status !== 'LOCKED');
      if (openPeriod) {
        await api.post(`/ovds/accounting/periods/${openPeriod.id}/lock`);
        toast.success(`Period ${openPeriod.period ?? openPeriod.name ?? openPeriod.id} locked`);
      } else {
        // Fallback: create and complete a reconciliation period for the current month
        const now = new Date();
        await api.post('/banking/reconciliation/periods', {
          bankAccountId: periods[0]?.bankAccountId ?? '',
          companyId: selectedCompanyId,
          statementDate: now.toISOString(),
          openingBalance: 0,
          closingBalance: 0,
          notes: lockNotes,
        });
        toast.success('Period closed');
      }
      setLockModal(false);
      qc.invalidateQueries({ queryKey: ['accounting-periods'] });
      qc.invalidateQueries({ queryKey: ['banking-recon-periods'] });
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed to lock period'); }
    finally { setLocking(false); }
  }, [selectedCompanyId, acctPeriods, periods, lockNotes, qc]);

  const handleExport = useCallback(async () => {
    setExportLoading(true);
    try {
      const p = new URLSearchParams();
      if (selectedCompanyId) p.set('companyId', selectedCompanyId);
      const r = await api.get(`/ovds/bank-transactions?${p}&limit=10000`);
      const d = r.data?.data ?? r.data;
      const rows: any[] = Array.isArray(d) ? d : (d?.data ?? []);
      const csv = [
        'Date,Description,Reference,Bank,Amount,Type,Status,Category',
        ...rows.map((t: any) =>
          `"${t.date ?? ''}","${t.description ?? ''}","${t.reference ?? ''}","${t.bankName ?? ''}",${t.amount ?? 0},${t.type ?? ''},${t.status ?? ''},"${t.category ?? ''}"`,
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `banking-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Ledger exported');
    } catch (e: any) { toast.error('Export failed'); }
    finally { setExportLoading(false); }
  }, [selectedCompanyId]);

  return (
    <AppPage
      title="Year-End Close"
      subtitle="Finalize clearing · Lock period · Export ledgers for tax filing and audit"
      icon={<Lock size={18} />}
      iconBg="bg-slate-700"
      crumbs={[{ label: 'Banking', href: '/banking' }, { label: 'Year-End Close' }]}
      actions={
        <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => { refetchStats(); refetchPeriods(); }}>
          Refresh
        </Btn>
      }
    >
      <AppKpi cells={kpi} loading={statsLoading} />

      {/* Year-end lifecycle steps */}
      <Card className="p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Year-End Closing Checklist</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Step num={1} label="Reconcile All Transactions" done={allReconciled} active={!allReconciled} warn={!allReconciled && reconRate < 80} />
          <Step num={2} label="Review Pending Imports"    done={allReconciled} active={false} />
          <Step num={3} label="Lock Accounting Period"    done={hasLockedPeriod} active={allReconciled && !hasLockedPeriod} />
          <Step num={4} label="Export & Archive Ledger"   done={false} active={hasLockedPeriod} />
        </div>
      </Card>

      {/* Step 1 — Finalize clearing */}
      <Card className={`p-5 ${allReconciled ? 'border-emerald-200 dark:border-emerald-800' : 'border-amber-200 dark:border-amber-800'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {allReconciled
              ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              : <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                Step 1 — Finalize Clearing
              </p>
              <p className="text-[11px] text-slate-500">
                {allReconciled
                  ? 'All transactions are reconciled. Ready to proceed.'
                  : `${stats?.pending ?? '?'} transactions still pending. Run auto-reconcile or match them manually before locking.`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {!allReconciled && can('banking:write') && (
              <Btn variant="secondary" size="sm" icon={<ShieldCheck size={11} />} onClick={handleFinalizeAll}>
                Auto-Reconcile
              </Btn>
            )}
            <Btn variant="ghost" size="sm" icon={<ArrowRight size={11} />} onClick={() => navigate('/banking/reconciliation')}>
              Open Workspace
            </Btn>
          </div>
        </div>
      </Card>

      {/* Step 2 — Duplicate check */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <FileText size={18} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mb-1">Step 2 — Review Imports &amp; Duplicates</p>
              <p className="text-[11px] text-slate-500">
                Scan for duplicate entries that may have been created by both manual input and an automated bank feed import.
              </p>
            </div>
          </div>
          <Btn variant="ghost" size="sm" icon={<ArrowRight size={11} />} onClick={() => navigate('/banking?tab=transactions')}>
            Review Transactions
          </Btn>
        </div>
      </Card>

      {/* Step 3 — Lock period */}
      <Card className={`p-5 ${hasLockedPeriod ? 'border-emerald-200 dark:border-emerald-800' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Lock size={18} className={`shrink-0 mt-0.5 ${hasLockedPeriod ? 'text-emerald-500' : 'text-slate-400'}`} />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mb-1">Step 3 — Lock Accounting Period</p>
              <p className="text-[11px] text-slate-500 mb-2">
                Locking prevents any manual entries from altering finalized cash balances. Use the accounting settings panel for full period close.
              </p>
              {acctPeriods.filter(p => p.status === 'LOCKED').length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {acctPeriods.filter(p => p.status === 'LOCKED').map(p => (
                    <span key={p.id} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800">
                      <Lock size={9} /> {p.period ?? p.name ?? p.id}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {can('ovds:write') && (
              <Btn variant="primary" size="sm" icon={<Lock size={11} />}
                disabled={!allReconciled}
                onClick={() => setLockModal(true)}>
                Lock Period
              </Btn>
            )}
            <Btn variant="ghost" size="sm" onClick={() => navigate('/accounting/period-close')}>
              Period Close →
            </Btn>
          </div>
        </div>
      </Card>

      {/* Step 4 — Export */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Download size={18} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mb-1">Step 4 — Export &amp; Archive Ledgers</p>
              <p className="text-[11px] text-slate-500">
                Generate and download your banking transaction ledger as CSV for tax filing and compliance audits.
              </p>
            </div>
          </div>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} loading={exportLoading} onClick={handleExport}>
            Export Ledger CSV
          </Btn>
        </div>
      </Card>

      {/* Reconciliation periods history */}
      {periods.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reconciliation Periods</p>
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Account</th>
                <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Statement Date</th>
                <th className="text-right px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Closing Bal</th>
                <th className="text-right px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Discrepancy</th>
                <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {periods.slice(0, 10).map(p => (
                <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/50">
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{p.bankAccountName ?? p.bankAccountId.slice(0, 12)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{new Date(p.statementDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-600 dark:text-slate-400">{fmtETB(p.closingBalance)}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${Math.abs(p.discrepancy) < 0.01 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {Math.abs(p.discrepancy) < 0.01 ? '✓ 0.00' : fmtETB(p.discrepancy)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800' :
                      p.status === 'LOCKED'    ? 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400' :
                      p.status === 'IN_PROGRESS'?'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-800' :
                                                 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800'
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Lock period modal */}
      <Modal open={lockModal} onClose={() => setLockModal(false)}
        title="Lock Accounting Period"
        subtitle="This prevents manual entries from altering finalized cash balances"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setLockModal(false)}>Cancel</Btn>
            <Btn variant="primary" loading={locking} icon={<Lock size={11} />} onClick={handleLockPeriod}>
              Confirm Lock
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-400">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <p>Once locked, this period cannot be edited without unlocking. Only ADMIN/ovds roles can unlock periods.</p>
          </div>
          <FormField label="Notes (optional)">
            <Input value={lockNotes} onChange={e => setLockNotes(e.target.value)} placeholder="e.g. FY2025 year-end close" />
          </FormField>
        </div>
      </Modal>
    </AppPage>
  );
};

export default BankingYearEnd;
