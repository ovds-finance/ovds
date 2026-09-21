import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { collectionsApi } from '../services/collectionsApi';

interface DeductionResolverProps {
  deduction: any;
  onClose: () => void;
}

export const DeductionResolver: React.FC<DeductionResolverProps> = ({ deduction, onClose }) => {
  const queryClient = useQueryClient();
  const [resolution, setResolution] = useState('');
  const [status, setStatus] = useState<'APPROVED' | 'RESOLVED' | 'DISPUTED'>('RESOLVED');

  const updateMutation = useMutation({
    mutationFn: (data: any) => collectionsApi.updateDeduction(deduction.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections-deductions'] });
      toast.success('Deduction resolved');
      onClose();
    },
    onError: () => toast.error('Failed to resolve deduction'),
  });

  if (!deduction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Resolve Deduction</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">ETB {Number(deduction.amount ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reason</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{deduction.reason}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Resolution Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20"
            >
              <option value="RESOLVED">Resolved</option>
              <option value="APPROVED">Approved</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Resolution Notes</label>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20 resize-none"
              placeholder="Document resolution details..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => updateMutation.mutate({ status, resolvedAt: new Date().toISOString(), resolution })}
              disabled={updateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              {updateMutation.isPending ? 'Saving…' : 'Resolve'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};





