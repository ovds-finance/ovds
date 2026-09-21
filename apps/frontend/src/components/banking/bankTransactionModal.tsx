import { X, Sparkles, AlertCircle } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useEscapeKey } from '../../hooks';
import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';

interface BankTransactionModalProps {
  bankAccountId: string;
  bankName: string;
  onClose: () => void;
  onSave: () => void;
}

// -- Auto-detect parser --------------------------------------------------------
// Parses common Ethiopian bank transfer SMS/receipt text formats
function parseTransferText(text: string): Partial<{
  date: string;
  description: string;
  amount: string;
  reference: string;
  type: 'CREDIT' | 'DEBIT';
}> {
  const result: ReturnType<typeof parseTransferText> = {};

  // Amount patterns: "ETB 1,234.56", "ETB1234.56", "Birr 1234.56", "Amount: 500.00"
  const amountMatch = text.match(
    /(?:ETB|Birr|Amount[:\s]+|Br\.?\s*)[\s]*([\d,]+(?:\.\d{1,2})?)/i,
  ) ?? text.match(/([\d,]+(?:\.\d{1,2})?)(?:\s*ETB|\s*Birr)/i);
  if (amountMatch) {
    result.amount = amountMatch[1].replace(/,/g, '');
  }

  // Reference patterns: "Ref: ABC123", "TXN: 123456", "Transaction ID: ..."
  const refMatch = text.match(
    /(?:Ref(?:erence)?[:\s#]+|TXN[:\s]+|Transaction\s*(?:ID|No\.?)[:\s]+|Receipt[:\s#]+)([\w-/]+)/i,
  );
  if (refMatch) result.reference = refMatch[1];

  // Date patterns: "2024-01-15", "15/01/2024", "Jan 15, 2024"
  const dateMatch = text.match(
    /(\d{4}-\d{2}-\d{2})|(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  );
  if (dateMatch) {
    const raw = dateMatch[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      result.date = raw;
    } else {
      const parts = raw.split(/[/-]/);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        const year = y.length === 2 ? `20${y}` : y;
        result.date = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
  }

  // Type detection
  const lc = text.toLowerCase();
  if (
    /\b(credit|received|deposited|incoming|inward|credited)\b/.test(lc)
  ) {
    result.type = 'CREDIT';
  } else if (
    /\b(debit|sent|paid|withdrawn|outgoing|outward|debited|payment)\b/.test(lc)
  ) {
    result.type = 'DEBIT';
  }

  // Description: first meaningful line that isn't just numbers/refs
  const lines = text
    .split(/[\n\r]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 5 && !/^[\d\s-/:.]+$/.test(l));
  if (lines.length > 0 && !result.description) {
    result.description = lines[0].slice(0, 120);
  }

  return result;
}

const BankTransactionModal: React.FC<BankTransactionModalProps> = ({
  bankAccountId,
  bankName,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    reference: '',
    type: 'CREDIT' as 'CREDIT' | 'DEBIT',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showPastePanel, setShowPastePanel] = useState(false);
  const [detected, setDetected] = useState<ReturnType<typeof parseTransferText> | null>(null);
  const { can } = useAuth();
  const canWrite = can('ovds:write');
  useEscapeKey(onClose);

  const handleAutoDetect = useCallback(() => {
    if (!pasteText.trim()) {
      toast.error('Paste transfer text first');
      return;
    }
    const parsed = parseTransferText(pasteText);
    setDetected(parsed);
    setForm((prev) => ({
      ...prev,
      ...(parsed.date && { date: parsed.date }),
      ...(parsed.description && { description: parsed.description }),
      ...(parsed.amount && { amount: parsed.amount }),
      ...(parsed.reference && { reference: parsed.reference }),
      ...(parsed.type && { type: parsed.type }),
    }));
    toast.success('Transfer details detected — review and confirm');
    setShowPastePanel(false);
    setPasteText('');
  }, [pasteText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (!canWrite) {
      setSaving(false);
      toast.error('Insufficient permissions');
      return;
    }
    try {
      const amount =
        form.type === 'DEBIT'
          ? -Math.abs(parseFloat(form.amount))
          : Math.abs(parseFloat(form.amount));
      await api.post(`/ovds/bank-accounts/${bankAccountId}/transactions`, {
        date: form.date,
        description: form.description,
        amount,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Transaction recorded');
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Record Bank Transaction — ${bankName}`}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-semibold text-slate-800 dark:text-white">Record Transaction</p>
            <p className="text-xs text-slate-400">{bankName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPastePanel((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30 rounded-xl text-xs font-bold hover:bg-violet-100 transition-colors"
              title="Auto-detect from transfer text"
            >
              <Sparkles size={12} />
              Auto-detect
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Auto-detect paste panel */}
        {showPastePanel && (
          <div className="px-6 py-4 bg-violet-50 dark:bg-violet-500/5 border-b border-violet-100 dark:border-violet-500/20 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-700 dark:text-violet-400">
                Paste your bank SMS, transfer receipt, or transaction text below. The system will extract date, amount, reference, and type automatically.
              </p>
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`e.g.\nCBE Transfer Alert\nAmount: ETB 5,000.00\nRef: TXN20240115001\nDate: 2024-01-15\nCredited to your account`}
              rows={5}
              autoFocus
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-500/30 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-400/30 resize-none placeholder:text-slate-400"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAutoDetect}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-white rounded-xl text-xs font-bold hover:bg-teal-500-dark transition-colors"
              >
                <Sparkles size={12} /> Detect & Fill
              </button>
              <button
                type="button"
                onClick={() => { setShowPastePanel(false); setPasteText(''); }}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Detected badge */}
        {detected && !showPastePanel && (
          <div className="px-6 py-2 bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 border-b border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/20 flex items-center gap-2">
            <Sparkles size={12} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            <p className="text-xs text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] font-semibold">
              Auto-detected {Object.keys(detected).length} field(s) — review below
            </p>
            <button
              type="button"
              onClick={() => setDetected(null)}
              className="ml-auto text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Credit / Debit toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'CREDIT' })}
              className={`py-3 rounded-lg text-sm font-medium transition-all ${form.type === 'CREDIT' ? 'bg-[var(--pro-azure)] text-white shadow-md shadow-green-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              + Credit (In)
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'DEBIT' })}
              className={`py-3 rounded-lg text-sm font-medium transition-all ${form.type === 'DEBIT' ? 'bg-rose-600 text-white shadow-md shadow-rose-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              − Debit (Out)
            </button>
          </div>

          {[
            { label: 'Date', field: 'date', type: 'date' },
            { label: 'Description *', field: 'description', type: 'text', placeholder: 'e.g. Invoice payment received' },
            { label: 'Amount (ETB) *', field: 'amount', type: 'number', placeholder: '0.00' },
            { label: 'Reference', field: 'reference', type: 'text', placeholder: 'Cheque no., transfer ref...' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {label}
              </label>
              <input
                required={field !== 'reference'}
                type={type}
                value={(form as any)[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                placeholder={placeholder}
                min={type === 'number' ? '0.01' : undefined}
                step={type === 'number' ? '0.01' : undefined}
                className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-white transition-colors ${
                  detected && detected[field as keyof typeof detected]
                    ? 'border-[var(--pro-azure-light)] dark:border-[var(--pro-azure)]/40 bg-[var(--pro-azure-50)]/50 dark:bg-[var(--pro-azure-50)]0/5'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional internal notes..."
              rows={2}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-500-dark disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankTransactionModal;







