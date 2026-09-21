/**
 * InvoiceBatchModal — Batch operations for multiple invoices
 *
 * Modes: send | cancel | duplicate | remind
 */
import {
  Send, X, AlertTriangle, CheckCircle2, Loader2,
  XCircle, FileText, ChevronRight, Ban, Copy, Bell,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import api from '../../services/api';
import { invoicesApi } from '../../services/ovdsApi';
import { fmtCurrencyDecimal } from '../../utils/fmt';

const fmt = (n: number) => fmtCurrencyDecimal(n, 'ETB');

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
}

interface Props {
  mode: 'send' | 'cancel' | 'duplicate' | 'remind';
  invoices: Invoice[];
  onClose: () => void;
  onDone: () => void;
}

const MODE_CONFIG = {
  send: {
    label: 'Batch Send Invoices',
    icon: Send,
    color: 'bg-[var(--pro-azure-100)] dark:bg-green-950/40',
    iconColor: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    btnColor: 'bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)]',
    eligibleFilter: (inv: Invoice) => inv.status === 'DRAFT',
    ineligibleReason: 'not DRAFT',
    warning: null,
  },
  cancel: {
    label: 'Batch Cancel Invoices',
    icon: Ban,
    color: 'bg-rose-100 dark:bg-rose-950/40',
    iconColor: 'text-rose-600',
    btnColor: 'bg-rose-600 hover:bg-rose-700',
    eligibleFilter: (inv: Invoice) => inv.status !== 'PAID' && inv.status !== 'CANCELLED',
    ineligibleReason: 'already PAID or CANCELLED',
    warning: 'Cancelling invoices is irreversible. Paid invoices are automatically excluded. Consider creating credit notes instead for accounting accuracy.',
  },
  duplicate: {
    label: 'Batch Duplicate Invoices',
    icon: Copy,
    color: 'bg-[var(--pro-azure-100)] dark:bg-green-950/40',
    iconColor: 'text-[var(--pro-azure)]',
    btnColor: 'bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)]',
    eligibleFilter: () => true,
    ineligibleReason: '',
    warning: 'Each invoice will be duplicated as a new DRAFT with a new invoice number.',
  },
  remind: {
    label: 'Batch Send Reminders',
    icon: Bell,
    color: 'bg-amber-100 dark:bg-amber-950/40',
    iconColor: 'text-amber-600',
    btnColor: 'bg-amber-600 hover:bg-amber-700',
    eligibleFilter: (inv: Invoice) => inv.status === 'PENDING' || inv.status === 'OVERDUE',
    ineligibleReason: 'not PENDING or OVERDUE',
    warning: 'Reminders will be sent to the customer email on each invoice. Requires SMTP to be configured.',
  },
};

const InvoiceBatchModal: React.FC<Props> = ({ mode, invoices, onClose, onDone }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ id: string; ok: boolean; error?: string }[] | null>(null);

  const cfg = MODE_CONFIG[mode];
  const Icon = cfg.icon;
  const eligible = invoices.filter(cfg.eligibleFilter);
  const ineligible = invoices.filter(inv => !cfg.eligibleFilter(inv));
  const totalAmount = eligible.reduce((s, inv) => s + Number(inv.totalAmount), 0);

  const handleRun = async () => {
    if (eligible.length === 0) return;
    setRunning(true);
    try {
      const ids = eligible.map(i => i.id);

      if (mode === 'send') {
        const res = await invoicesApi.bulkSend(ids);
        const { sent, failed } = (res as any) ?? {};
        toast.success(`${sent ?? eligible.length} invoice(s) sent`);
        if (failed > 0) toast.error(`${failed} failed to send`);
        onDone();
        onClose();

      } else if (mode === 'cancel') {
        const res = await invoicesApi.bulkCancel(ids);
        const { cancelled, failed, errors } = (res as any) ?? {};
        const settled = eligible.map((inv, i) => ({
          id: inv.id,
          ok: i < (cancelled ?? eligible.length),
          error: errors?.[i],
        }));
        setResults(settled);
        toast.success(`${cancelled ?? eligible.length} invoice(s) cancelled`);
        if (failed > 0) toast.error(`${failed} failed`);
        onDone();

      } else if (mode === 'duplicate') {
        // bulk-duplicate has no typed helper — keep raw but clean up
        const res = await api.post('/ovds/invoices/bulk-duplicate', { ids });
        const { duplicated, failed } = res.data?.data ?? {};
        toast.success(`${duplicated ?? eligible.length} invoice(s) duplicated as DRAFT`);
        if (failed > 0) toast.error(`${failed} failed`);
        onDone();
        onClose();

      } else if (mode === 'remind') {
        const settled = await Promise.allSettled(
          eligible.map(inv =>
            invoicesApi.sendReminder(inv.id)
              .then(() => ({ id: inv.id, ok: true }))
              .catch((e: any) => ({ id: inv.id, ok: false, error: e?.response?.data?.message ?? 'Failed' }))
          )
        );
        const res = settled.map(r => r.status === 'fulfilled' ? r.value : { id: '', ok: false });
        setResults(res);
        const ok = res.filter(r => r.ok).length;
        toast.success(`${ok} reminder(s) sent`);
        onDone();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Batch operation failed');
    } finally {
      setRunning(false);
    }
  };

  const actionLabel = {
    send: `Send ${eligible.length} Invoice(s)`,
    cancel: `Cancel ${eligible.length} Invoice(s)`,
    duplicate: `Duplicate ${eligible.length} Invoice(s)`,
    remind: `Send ${eligible.length} Reminder(s)`,
  }[mode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="aki-card w-full max-w-lg border max-h-[90vh] flex flex-col" style={{ borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.color}`}>
              <Icon size={16} className={cfg.iconColor} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>{cfg.label}</p>
              <p className="text-xs" style={{ color: 'var(--text-4)' }}>
                {eligible.length} eligible · {ineligible.length} skipped
              </p>
            </div>
          </div>
          <button onClick={onClose} className="aki-btn aki-btn-ghost">
            <X size={16} />
          </button>
        </div>

        {/* Summary */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface)' }}>
          <div className="aki-grid cols-3 text-center">
            <div>
              <p className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{eligible.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Eligible</p>
            </div>
            <div>
              <p className="text-2xl font-semibold" style={{ color: 'var(--aki-warning-text)' }}>{ineligible.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Skipped</p>
            </div>
            <div>
              <p className="text-lg font-semibold" style={{ color: 'var(--aki-success-text)' }}>{fmt(totalAmount)}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Total Value</p>
            </div>
          </div>
        </div>

        {/* Invoice list */}
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-alt)' }}>
          {eligible.map(inv => {
            const result = results?.find(r => r.id === inv.id);
            return (
              <div key={inv.id} className="flex items-center gap-3 px-6 py-3">
                <FileText size={14} style={{ color: 'var(--text-4)' }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{inv.invoiceNumber}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-4)' }}>{inv.customerName}</p>
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: 'var(--text-2)' }}>{fmt(inv.totalAmount)}</span>
                {result && (
                  result.ok
                    ? <CheckCircle2 size={14} style={{ color: 'var(--aki-success-text)' }} className="shrink-0" />
                    : <span title={result.error}><XCircle size={14} style={{ color: 'var(--aki-danger-text)' }} className="shrink-0" /></span>
                )}
              </div>
            );
          })}
          {ineligible.length > 0 && (
            <div className="px-6 py-3" style={{ background: 'var(--aki-warning-bg)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--aki-warning-text)' }}>
                Skipped ({ineligible.length}) — {cfg.ineligibleReason}
              </p>
              {ineligible.map(inv => (
                <div key={inv.id} className="flex items-center gap-2 py-1">
                  <span className="text-xs font-mono" style={{ color: 'var(--aki-warning-text)' }}>{inv.invoiceNumber}</span>
                  <ChevronRight size={10} style={{ color: 'var(--aki-warning-text)' }} />
                  <span className="text-xs" style={{ color: 'var(--aki-warning-text)' }}>{inv.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning */}
        {cfg.warning && (
          <div className="px-6 py-3 flex items-start gap-2" style={{ borderTop: `1px solid var(--aki-warning-border)`, background: 'var(--aki-warning-bg)' }}>
            <AlertTriangle size={14} style={{ color: 'var(--aki-warning-text)' }} className="shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: 'var(--aki-warning-text)' }}>{cfg.warning}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border-alt)' }}>
          <button onClick={onClose} disabled={running} className="aki-btn aki-btn-secondary flex-1 justify-center">
            Close
          </button>
          <button
            onClick={handleRun}
            disabled={running || eligible.length === 0}
            className={`aki-btn flex-1 justify-center ${
              mode === 'cancel' ? 'aki-btn-danger' :
              mode === 'send'   ? 'aki-btn-primary' :
              mode === 'remind' ? 'aki-btn-warning' : 'aki-btn-success'
            }`}
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
            {running ? 'Processing…' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceBatchModal;






