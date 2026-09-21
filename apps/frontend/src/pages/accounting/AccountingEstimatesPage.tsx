import { useEstimatesList, useCreateEstimate, useDeleteEstimate } from '@ovds/features/accounting';
import { Calculator, FileText, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../../context/businessContext';

const AccountingEstimatesPage: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const { data, isLoading, refetch } = useEstimatesList();
  const createMutation = useCreateEstimate();
  const deleteMutation = useDeleteEstimate();

  const handleCreate = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    try {
      await createMutation.mutateAsync({ key: newKey.trim(), value: newValue.trim() });
      toast.success('Estimate record created');
      setNewKey('');
      setNewValue('');
      refetch();
    } catch (_e) {
      toast.error('Failed to create estimate record');
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteMutation.mutateAsync(key);
      toast.success('Estimate record deleted');
      refetch();
    } catch (_e) {
      toast.error('Failed to delete estimate record');
    }
  };

  const records = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30">
          <Calculator className="w-6 h-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Estimates & Judgments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            IFRS-compliant accounting estimates and critical judgments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <FileText className="w-5 h-5 text-violet-500 mb-2" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Key Estimates</h3>
          <p className="text-xs text-slate-500 mt-1">Depreciation, provisions, and allowance estimates</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <AlertTriangle className="w-5 h-5 text-amber-500 mb-2" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Critical Judgments</h3>
          <p className="text-xs text-slate-500 mt-1">Significant judgment areas in financial reporting</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <Calculator className="w-5 h-5 text-[var(--pro-azure)] mb-2" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Sensitivity Analysis</h3>
          <p className="text-xs text-slate-500 mt-1">Impact of changes in key assumptions</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Estimate Records</h3>
        {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
        {!isLoading && records.length === 0 && (
          <p className="text-sm text-slate-500">No estimate records yet.</p>
        )}
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{r.key}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">{r.value}</p>
              </div>
              <button
                onClick={() => handleDelete(r.key.replace('estimates.', ''))}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Key (e.g. depreciation-rate)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          />
          <input
            type="text"
            placeholder="Value (JSON or text)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="flex-[2] px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          />
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="px-4 py-2 text-sm font-semibold bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {selectedCompanyId && (
        <p className="text-xs text-slate-400">
          Company ID: {selectedCompanyId}
        </p>
      )}
    </div>
  );
};

export default AccountingEstimatesPage;
