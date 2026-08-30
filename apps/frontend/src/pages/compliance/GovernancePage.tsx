import React, { useState } from 'react';
import { useBusiness } from '../../context/businessContext';
import { useGovernanceList, useCreateGovernance, useDeleteGovernance } from '@ovds/features/compliance';
import toast from 'react-hot-toast';
import { Shield, Users, FileCheck, Plus, Trash2 } from 'lucide-react';

const GovernancePage: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const { data, isLoading, refetch } = useGovernanceList();
  const createMutation = useCreateGovernance();
  const deleteMutation = useDeleteGovernance();

  const handleCreate = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    try {
      await createMutation.mutateAsync({ key: newKey.trim(), value: newValue.trim() });
      toast.success('Governance record created');
      setNewKey('');
      setNewValue('');
      refetch();
    } catch (e) {
      toast.error('Failed to create governance record');
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteMutation.mutateAsync(key);
      toast.success('Governance record deleted');
      refetch();
    } catch (e) {
      toast.error('Failed to delete governance record');
    }
  };

  const records = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Corporate Governance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Board composition, policies, and compliance tracking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <Users className="w-5 h-5 text-indigo-500 mb-2" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Board Structure</h3>
          <p className="text-xs text-slate-500 mt-1">Directors, committees, and independence matrix</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <FileCheck className="w-5 h-5 text-teal-500 mb-2" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Policies</h3>
          <p className="text-xs text-slate-500 mt-1">Corporate governance policies and attestations</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <Shield className="w-5 h-5 text-rose-500 mb-2" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Disclosures</h3>
          <p className="text-xs text-slate-500 mt-1">Related party transactions and disclosures</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Governance Records</h3>
        {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
        {!isLoading && records.length === 0 && (
          <p className="text-sm text-slate-500">No governance records yet.</p>
        )}
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{r.key}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">{r.value}</p>
              </div>
              <button
                onClick={() => handleDelete(r.key.replace('governance.', ''))}
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
            placeholder="Key (e.g. board-policy)"
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
            className="px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
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

export default GovernancePage;
