import { evalMath } from '@ovds/ui';
import { format } from 'date-fns';
import {
  Plus,
  Save,
  Trash2,
  Calendar,
  FileText,
  CreditCard,
  Clock,
  Repeat,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';

interface JournalLine {
  id?: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
  account?: { id: string; code: string; name: string };
}

interface JournalEntry {
  id?: string;
  date: string;
  reference: string;
  description: string;
  status: 'DRAFT' | 'POSTED';
  lines: JournalLine[];
  recurringLabel?: string;
}

// IFRS common journal entry templates
const IFRS_TEMPLATES = [
  {
    label: 'Revenue (IFRS 15)',
    description: 'Record revenue from customer contract',
    lines: [
      { accountCode: '1200', accountName: 'Accounts Receivable', debit: 0, credit: 0, side: 'debit' as const },
      { accountCode: '4000', accountName: 'Revenue', debit: 0, credit: 0, side: 'credit' as const },
      { accountCode: '2300', accountName: 'VAT Payable (15%)', debit: 0, credit: 0, side: 'credit' as const },
    ],
    iasRef: 'IFRS 15.31',
  },
  {
    label: 'Depreciation (IAS 16)',
    description: 'Monthly PPE depreciation charge',
    lines: [
      { accountCode: '5500', accountName: 'Depreciation Expense', debit: 0, credit: 0, side: 'debit' as const },
      { accountCode: '1600', accountName: 'Accumulated Depreciation', debit: 0, credit: 0, side: 'credit' as const },
    ],
    iasRef: 'IAS 16.48',
  },
  {
    label: 'Payroll (IAS 19)',
    description: 'Monthly salary and pension accrual',
    lines: [
      { accountCode: '5100', accountName: 'Salaries Expense', debit: 0, credit: 0, side: 'debit' as const },
      { accountCode: '5110', accountName: 'Employer Pension (11%)', debit: 0, credit: 0, side: 'debit' as const },
      { accountCode: '2100', accountName: 'Salaries Payable', debit: 0, credit: 0, side: 'credit' as const },
      { accountCode: '2110', accountName: 'Employee Pension Payable (7%)', debit: 0, credit: 0, side: 'credit' as const },
      { accountCode: '2120', accountName: 'PIT Payable', debit: 0, credit: 0, side: 'credit' as const },
    ],
    iasRef: 'IAS 19.11',
  },
  {
    label: 'Lease Payment (IFRS 16)',
    description: 'Monthly lease liability payment',
    lines: [
      { accountCode: '2400', accountName: 'Lease Liability', debit: 0, credit: 0, side: 'debit' as const },
      { accountCode: '5600', accountName: 'ovds Cost (Interest)', debit: 0, credit: 0, side: 'debit' as const },
      { accountCode: '1010', accountName: 'Cash / Bank', debit: 0, credit: 0, side: 'credit' as const },
    ],
    iasRef: 'IFRS 16.26',
  },
  {
    label: 'Inventory Purchase (IAS 2)',
    description: 'Purchase of inventory on credit',
    lines: [
      { accountCode: '1300', accountName: 'Inventories', debit: 0, credit: 0, side: 'debit' as const },
      { accountCode: '1310', accountName: 'Input VAT (15%)', debit: 0, credit: 0, side: 'debit' as const },
      { accountCode: '2000', accountName: 'Accounts Payable', debit: 0, credit: 0, side: 'credit' as const },
    ],
    iasRef: 'IAS 2.10',
  },
  {
    label: 'Impairment Loss (IAS 36)',
    description: 'Write-down of asset to recoverable amount',
    lines: [
      { accountCode: '5700', accountName: 'Impairment Loss', debit: 0, credit: 0, side: 'debit' as const },
      { accountCode: '1500', accountName: 'Asset (PPE / Intangible)', debit: 0, credit: 0, side: 'credit' as const },
    ],
    iasRef: 'IAS 36.59',
  },
];

interface JournalEntryFormProps {
  entry?: JournalEntry;
  accounts: any[];
  onSave?: (entry: JournalEntry) => void;
  onCancel?: () => void;
  previewMode?: boolean;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({
  entry: propEntry,
  accounts,
  onSave,
  onCancel,
  previewMode = false,
}) => {
  const { can } = useAuth();
  const canWrite = can('ovds:write');
  const [showTemplates, setShowTemplates] = useState(false);

  const applyTemplate = (tpl: typeof IFRS_TEMPLATES[0]) => {
    const newLines = tpl.lines.map(l => {
      const matched = accounts.find(a =>
        a.code === l.accountCode ||
        a.name.toLowerCase().includes(l.accountName.toLowerCase().split(' ')[0])
      );
      return { accountId: matched?.id ?? '', description: l.accountName, debit: 0, credit: 0 };
    });
    setEntry(prev => ({
      ...prev,
      description: tpl.description,
      lines: newLines.length > 0 ? newLines : prev.lines,
    }));
    setShowTemplates(false);
    toast.success(`Template applied: ${tpl.label} (${tpl.iasRef})`);
  };

  const [entry, setEntry] = useState<JournalEntry>({
    date: format(new Date(), 'yyyy-MM-dd'),
    reference: '',
    description: '',
    status: 'DRAFT' as const,
    lines: [{ accountId: '', description: '', debit: 0, credit: 0 }],
    recurringLabel: '',
  });

  const [totalDebit, totalCredit] = useMemo(() => {
    const debits = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const credits = entry.lines.reduce((sum, line) => sum + line.credit, 0);
    return [debits, credits];
  }, [entry.lines]);

  const balance = totalDebit - totalCredit;
  const isBalanced = Math.abs(balance) < 0.01;

  useEffect(() => {
    if (propEntry) {
      setEntry(propEntry);
    }
  }, [propEntry]);

  const addLine = () => {
    setEntry({
      ...entry,
      lines: [...entry.lines, { accountId: '', description: '', debit: 0, credit: 0 }],
    });
  };

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...entry.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setEntry({ ...entry, lines: newLines });
  };

  const deleteLine = (index: number) => {
    if (entry.lines.length <= 1) {
      toast.error('Journal entry must have at least one line');
      return;
    }
    setEntry({
      ...entry,
      lines: entry.lines.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced || !canWrite || previewMode) return;

    try {
      if (propEntry?.id) {
        // Update existing
        await api.patch(`/ovds/journal-entries/${propEntry.id}`, entry);
        toast.success('Journal entry updated');
      } else {
        // Create new
        const res = await api.post('/ovds/journal-entries', entry);
        toast.success('Journal entry posted successfully');
        onSave?.(res.data);
      }
      onCancel?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save journal entry');
    }
  };

  const fmt = (n: number) => n.toLocaleString('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const AccountSelect = ({ 
    value, 
    onChange, 
    placeholder = 'Select account...' 
  }: { 
    value: string; 
    onChange: (id: string) => void; 
    placeholder?: string;
  }) => {
    const selected = accounts.find(a => a.id === value);
    const typeColor: Record<string, string> = {
      ASSET: 'text-[var(--pro-azure)]', LIABILITY: 'text-rose-600',
      EQUITY: 'text-violet-600', INCOME: 'text-[var(--pro-azure)]', EXPENSE: 'text-amber-600',
    };
    return (
      <div className="flex-1 relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all bg-white dark:bg-slate-800 text-sm dark:text-slate-200"
        >
          <option value="">{placeholder}</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.code} — {acc.name} [{acc.type}]
            </option>
          ))}
        </select>
        {selected && (
          <span className={`absolute right-8 top-1/2 -translate-y-1/2 text-[8px] font-semibold pointer-events-none ${typeColor[selected.type] ?? 'text-slate-400'}`}>
            {selected.type}
          </span>
        )}
      </div>
    );
  };

  const QuickAccounts = () => (
    <div className="flex flex-wrap gap-1.5 text-xs mb-2">
      <button
        onClick={() => updateLine(0, 'accountId', accounts.find(a => a.code === '1010')?.id || '')}
        className="px-2 py-1 bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] rounded-md hover:bg-[var(--pro-azure-200)] transition-colors font-mono"
      >
        1010 Cash
      </button>
      <button
        onClick={() => updateLine(0, 'accountId', accounts.find(a => a.code === '4010')?.id || '')}
        className="px-2 py-1 bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] rounded-md hover:bg-green-200 transition-colors font-mono"
      >
        4010 Sales
      </button>
      <button
        onClick={() => updateLine(0, 'accountId', accounts.find(a => a.code === '5020')?.id || '')}
        className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors font-mono"
      >
        5020 Expenses
      </button>
    </div>
  );

  return (
    <div className="ovds-widget-card shadow-xl max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {/* IFRS reference + template picker */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Full IFRS · IAS 1</span>
            <span className="ovds-caption">Double-entry · Debits = Credits</span>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplates(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
            >
              <BookOpen size={12} />
              IFRS Templates
              <ChevronDown size={11} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
            </button>
            {showTemplates && (
              <div className="absolute right-0 top-full mt-1 z-30 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 animate-in slide-in-from-top-1 duration-150">
                <p className="px-3 py-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">Common IFRS Journal Templates</p>
                {IFRS_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{tpl.label}</p>
                      <p className="text-[10px] text-slate-400 truncate">{tpl.description}</p>
                    </div>
                    <span className="text-[8px] font-semibold text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 px-1.5 py-0.5 rounded-full shrink-0 mt-0.5">{tpl.iasRef}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-5">
          <div className="flex-1 space-y-4">
            <div className="ovds-grid-layout cols-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar size={14} />
                  Date
                </label>
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) => setEntry({ ...entry, date: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-sm font-mono bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <FileText size={14} />
                  Reference
                </label>
                <input
                  value={entry.reference}
                  onChange={(e) => setEntry({ ...entry, reference: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-sm font-mono"
                  placeholder="JE-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Repeat size={14} />
                  Recurring
                </label>
                <input
                  value={entry.recurringLabel}
                  onChange={(e) => setEntry({ ...entry, recurringLabel: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-sm font-mono bg-white"
                  placeholder="Monthly rent (TEMPLATE)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={entry.description}
                onChange={(e) => setEntry({ ...entry, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-sm resize-vertical"
                placeholder="Journal entry description..."
              />
            </div>
          </div>

          {/* Balance Preview */}
          <div className="lg:w-80 space-y-4 mt-4 lg:mt-0 lg:pt-2">
            <div className="p-6 bg-gradient-to-br from-[var(--pro-azure-50)] to-[var(--pro-azure-50)] rounded-2xl border-2 border-[var(--pro-azure-100)]/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[var(--pro-azure-dark)] uppercase tracking-wide">Trial Balance Preview</span>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  isBalanced 
                    ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' 
                    : 'bg-rose-100 text-rose-700 animate-pulse'
                }`}>
                  {isBalanced ? '✅ Balanced' : `⚠️ Off by ${fmt(Math.abs(balance))}`}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-mono">Total Debit</span>
                  <span className="font-semibold text-[var(--pro-azure-dark)] text-lg">{fmt(totalDebit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-mono">Total Credit</span>
                  <span className="font-semibold text-sky-700 text-lg">{fmt(totalCredit)}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-[var(--pro-azure-200)] to-sky-200" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>{balance >= 0 ? 'Excess Debit' : 'Excess Credit'}</span>
                  <span className={balance >= 0 ? 'text-[var(--pro-azure-dark)]' : 'text-sky-700'}>
                    {fmt(Math.abs(balance))}
                  </span>
                </div>
              </div>
            </div>

            <QuickAccounts />
          </div>
        </div>

        {/* Journal Lines */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <CreditCard size={16} />
              Journal Lines ({entry.lines.length})
              <span className="text-[9px] font-bold text-slate-400 normal-case tracking-normal">IAS 1 — Debits must equal Credits</span>
            </h4>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Plus size={12} />
              Add Line
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/20">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_70px_70px_32px] gap-2 px-4 pb-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Account</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Description</span>
              <span className="text-[10px] font-medium text-[var(--pro-azure)] uppercase tracking-wider text-right">Debit (Dr)</span>
              <span className="text-[10px] font-medium text-sky-600 uppercase tracking-wider text-right">Credit (Cr)</span>
              <span />
            </div>
            {entry.lines.map((line, index) => (
              <div key={line.id || index} className="ovds-widget-card p-4 hover:shadow-sm hover:border-slate-300 transition-all group">
                <div className="flex items-start gap-3">
                  <div className="flex-1 ovds-grid-layout cols-3">
                    <AccountSelect
                      value={line.accountId}
                      onChange={(id) => updateLine(index, 'accountId', id)}
                    />                    <input
                      value={line.description}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="lg:col-span-2 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 flex-1 max-w-[140px]">
                    <input
                      type="text"
                      value={line.debit}
                      onChange={(e) => updateLine(index, 'debit', e.target.value)}
                      onBlur={(e) => updateLine(index, 'debit', Number((evalMath(e.target.value) ?? parseFloat(e.target.value)) || 0))}
                       placeholder="0.00"
                       className="px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-right font-mono text-sm bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-50)]/50"
                     />
                     <input
                       type="text"
                       value={line.credit}
                       onChange={(e) => updateLine(index, 'credit', e.target.value)}
                       onBlur={(e) => updateLine(index, 'credit', Number((evalMath(e.target.value) ?? parseFloat(e.target.value)) || 0))}
                      placeholder="0.00"
                      className="px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-right font-mono text-sm bg-sky-50 hover:bg-sky-50/50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteLine(index)}
                    className="p-2 -m-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 ml-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {!previewMode && (
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200 bg-slate-50/50 rounded-b-3xl px-1">
            <div className="flex items-center gap-4 text-sm text-slate-600 font-mono">
              <Clock size={14} className="text-slate-400" />
              Last saved: {format(new Date(), 'MMM dd, yyyy HH:mm')}
            </div>
            <div className="flex flex-1 sm:justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isBalanced || !canWrite}
                className={`px-6 py-2.5 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 ${
                  isBalanced && canWrite
                    ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/40'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save size={16} />
                {propEntry ? 'Update & Post' : 'Post Journal Entry'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default JournalEntryForm;










