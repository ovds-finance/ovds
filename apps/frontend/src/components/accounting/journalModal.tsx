import { X, Plus } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { useEscapeKey } from '../../hooks';
import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';
import { fmtDecimal } from '../../utils/fmt';

const fmt = fmtDecimal;

interface JournalModalProps {
  accounts: any[];
  onClose: () => void;
  onSave: () => void;
  isTemplate?: boolean;
}

const JournalModal: React.FC<JournalModalProps> = ({
  accounts,
  onClose,
  onSave,
  isTemplate = false,
}) => {
  const { can } = useAuth();
  const canWrite = can('ovds:write');
  useEscapeKey(onClose);
  const [form, setForm] = useState({
    description: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    recurringLabel: '',
  });
  const [lines, setLines] = useState([
    { accountId: '', description: '', debit: '', credit: '' },
    { accountId: '', description: '', debit: '', credit: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce(
    (s, l) => s + (parseFloat(l.credit) || 0),
    0,
  );
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const updateLine = (i: number, field: string, val: string) => {
    const next = [...lines];
    next[i] = { ...next[i], [field]: val };
    setLines(next);
  };

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!canWrite) {
      toast.error('Insufficient permissions');
      return;
    }
    if (!asDraft && !isBalanced) {
      toast.error('Debits must equal Credits');
      return;
    }
    setSaving(true);
    try {
      const endpoint = isTemplate
        ? '/ovds/journal-entries/recurring'
        : '/ovds/journal-entries';
      const payload = {
        ...form,
        ...(isTemplate && {
          recurringLabel: form.recurringLabel || form.description,
        }),
        ...(asDraft && { status: 'DRAFT' }),
        lines: lines
          .filter((l) => l.accountId)
          .map((l) => ({
            accountId: l.accountId,
            description: l.description,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
          })),
      };
      await api.post(endpoint, payload);
      toast.success(
        asDraft
          ? 'Saved as draft'
          : isTemplate
            ? 'Recurring template created'
            : 'Journal entry created',
      );
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isTemplate ? 'New Recurring Template' : 'New Journal Entry'}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {isTemplate ? 'New Recurring Template' : 'New Journal Entry'}
          </p>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {' '}
          <div className="ovds-grid-layout cols-3">
            {!isTemplate && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10"
                />
              </div>
            )}
            {isTemplate && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Template Label *
                </label>
                <input
                  required
                  value={form.recurringLabel}
                  onChange={(e) =>
                    setForm({ ...form, recurringLabel: e.target.value })
                  }
                  placeholder="e.g. Monthly Rent"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Reference
              </label>
              <input
                value={form.reference}
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
                placeholder="e.g. INV-001"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Description *
              </label>
              <input
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Entry description"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              <span className="col-span-4">Account</span>
              <span className="col-span-3">Description</span>
              <span className="col-span-2 text-right">Debit</span>
              <span className="col-span-2 text-right">Credit</span>
              <span className="col-span-1" />
            </div>
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <select
                  value={line.accountId}
                  onChange={(e) => updateLine(i, 'accountId', e.target.value)}
                  className="col-span-4 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-400/20"
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
                <input
                  value={line.description}
                  onChange={(e) => updateLine(i, 'description', e.target.value)}
                  placeholder="Note"
                  className="col-span-3 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-400/20"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.debit}
                  onChange={(e) => updateLine(i, 'debit', e.target.value)}
                  placeholder="0.00"
                  className="col-span-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-right outline-none focus:ring-2 focus:ring-teal-400/20"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.credit}
                  onChange={(e) => updateLine(i, 'credit', e.target.value)}
                  placeholder="0.00"
                  className="col-span-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-right outline-none focus:ring-2 focus:ring-teal-400/20"
                />
                <button
                  type="button"
                  onClick={() => setLines(lines.filter((_, j) => j !== i))}
                  className="col-span-1 p-2 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setLines([
                  ...lines,
                  { accountId: '', description: '', debit: '', credit: '' },
                ])
              }
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:bg-[var(--pro-azure-50)] rounded-xl transition-all"
            >
              <Plus size={13} /> Add Line
            </button>
          </div>
          <div
            className={`flex items-center justify-end gap-6 p-4 rounded-2xl border ${isBalanced ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' : 'bg-rose-50 border-rose-200'}`}
          >
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Total Debit
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {fmt(totalDebit)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Total Credit
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {fmt(totalCredit)}
              </p>
            </div>
            <div
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${isBalanced ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : 'bg-rose-100 text-rose-700'}`}
            >
              {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            {!isTemplate && (
              <button
                type="button"
                disabled={saving}
                onClick={(e) => handleSubmit(e as any, true)}
                className="px-5 py-2.5 rounded-2xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
            )}
            <button
              type="submit"
              disabled={saving || (!isTemplate && !isBalanced)}
              className="px-5 py-2.5 rounded-2xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-500-dark disabled:opacity-50"
            >
              {saving
                ? 'Posting...'
                : isTemplate
                  ? 'Save Template'
                  : 'Post Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JournalModal;








