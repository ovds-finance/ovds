import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Plus, Trash2, CreditCard } from 'lucide-react';
import { treasuryApi } from '../services/treasuryApi';

interface PaymentBatchModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentBatchModal: React.FC<PaymentBatchModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState<'ACCOUNTS_RECEIVABLE' | 'ACCOUNTS_PAYABLE'>('ACCOUNTS_PAYABLE');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ invoiceId: '', billId: '', amount: 0, reference: '', notes: '' }]);

  const mutation = useMutation({
    mutationFn: treasuryApi.createBatch,
    onSuccess: onSuccess,
  });

  const addItem = () => setItems([...items, { invoiceId: '', billId: '', amount: 0, reference: '', notes: '' }]);

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = () => {
    mutation.mutate({
      type,
      notes,
      items: items.filter(item => item.amount > 0),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CreditCard size={15} className="text-emerald-600" />
            </div>
            <h2 className="text-[15px] font-bold text-slate-800">Create Payment Batch</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Batch Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Batch Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition-all"
            >
              <option value="ACCOUNTS_RECEIVABLE">AR Collection</option>
              <option value="ACCOUNTS_PAYABLE">AP Payment</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition-all resize-none"
              placeholder="Batch description..."
            />
          </div>

          {/* Payment Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="ovds-card-title text-slate-700">Payment Items</h3>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold rounded-xl transition-all"
              >
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 p-3 bg-white rounded-xl border border-slate-100">
                  <input
                    placeholder="Invoice ID"
                    value={item.invoiceId}
                    onChange={(e) => updateItem(index, 'invoiceId', e.target.value)}
                    className="flex-1 px-2.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                  <input
                    placeholder="Bill ID"
                    value={item.billId}
                    onChange={(e) => updateItem(index, 'billId', e.target.value)}
                    className="flex-1 px-2.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={item.amount || ''}
                    onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                  <input
                    placeholder="Ref"
                    value={item.reference}
                    onChange={(e) => updateItem(index, 'reference', e.target.value)}
                    className="w-20 px-2.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
              ) : (
                <><CreditCard size={14} /> Create Batch</>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentBatchModal;




