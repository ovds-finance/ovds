import React, { useState, useMemo } from 'react';
import {
  useEimsBulkJobs,
  useEimsRegistrations,
  useEimsBulkRegister,
} from '@ovds/features/eims';
import toast from 'react-hot-toast';
import { useBusiness } from '../../context/businessContext';
import { Layers, Upload, XCircle, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  PROCESSING: 'text-blue-600 bg-blue-50',
  COMPLETED: 'text-emerald-600 bg-emerald-50',
  FAILED: 'text-rose-600 bg-rose-50',
  CANCELLED: 'text-slate-600 bg-slate-100',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

const BulkOperationsPage: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const { data: jobs = [], isLoading: loadingJobs, refetch: refetchJobs } = useEimsBulkJobs();
  const { data: registrations = [] } = useEimsRegistrations();
  const bulkRegister = useEimsBulkRegister();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCancelIds, setBulkCancelIds] = useState<string[]>([]);
  const [bulkCancelReason, setBulkCancelReason] = useState('CANCELLED_BY_TAXPAYER');

  const pendingRegs = useMemo(() => registrations.filter((r: any) => r.status === 'PENDING'), [registrations]);

  const handleBulkRegister = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one invoice');
      return;
    }
    try {
      await bulkRegister.mutateAsync(selectedIds);
      toast.success(`Bulk registration started for ${selectedIds.length} invoice(s)`);
      setSelectedIds([]);
      refetchJobs();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBulkCancel = async () => {
    if (bulkCancelIds.length === 0) {
      toast.error('Select at least one invoice');
      return;
    }
    try {
      const { eimsApi } = await import('@ovds/features/eims');
      await eimsApi.bulk.cancel(bulkCancelIds.map((id) => ({ invoiceId: id, reasonCode: bulkCancelReason })));
      toast.success(`Bulk cancellation started for ${bulkCancelIds.length} invoice(s)`);
      setBulkCancelIds([]);
      refetchJobs();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleSelect = (id: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
          <Layers size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Operations</h1>
          <p className="text-sm text-slate-500">Bulk invoice registration and cancellation jobs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Upload size={16} /> Bulk Register
          </h3>
          <p className="text-xs text-slate-500">Select pending invoices to register in bulk</p>
          <div className="max-h-48 overflow-y-auto border rounded-lg divide-y divide-slate-100">
            {pendingRegs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No pending invoices</p>
            ) : pendingRegs.map((r: any) => (
              <label key={r.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(r.id)}
                  onChange={() => toggleSelect(r.id, selectedIds, setSelectedIds)}
                />
                <span className="text-xs font-mono">{r.documentNumber ?? r.id}</span>
                <Badge status={r.status} />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={handleBulkRegister}
            disabled={bulkRegister.isPending}
            className="w-full px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {bulkRegister.isPending ? 'Processing…' : `Register ${selectedIds.length} Invoice(s)`}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <XCircle size={16} /> Bulk Cancel
          </h3>
          <p className="text-xs text-slate-500">Select invoices to cancel in bulk</p>
          <div className="max-h-48 overflow-y-auto border rounded-lg divide-y divide-slate-100">
            {registrations.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No invoices</p>
            ) : registrations.map((r: any) => (
              <label key={r.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkCancelIds.includes(r.id)}
                  onChange={() => toggleSelect(r.id, bulkCancelIds, setBulkCancelIds)}
                />
                <span className="text-xs font-mono">{r.documentNumber ?? r.id}</span>
                <Badge status={r.status} />
              </label>
            ))}
          </div>
          <select
            value={bulkCancelReason}
            onChange={(e) => setBulkCancelReason(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg"
          >
            <option value="CANCELLED_BY_TAXPAYER">Cancelled by Taxpayer</option>
            <option value="DOCUMENT_ERROR">Document Error</option>
            <option value="DUPLICATE_IRN">Duplicate IRN</option>
          </select>
          <button
            type="button"
            onClick={handleBulkCancel}
            disabled={bulkCancelIds.length === 0}
            className="w-full px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
          >
            Cancel {bulkCancelIds.length} Invoice(s)
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Layers size={16} /> Bulk Job Status
          </h3>
          <button type="button" onClick={() => refetchJobs()} className="p-1.5 border rounded-lg hover:bg-slate-50">
            <RefreshCw size={14} />
          </button>
        </div>
        {loadingJobs ? (
          <div className="animate-pulse space-y-3 p-4">
            {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No bulk jobs yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                <th className="text-left px-4 py-2 font-medium">Job Type</th>
                <th className="text-left px-4 py-2 font-medium">Invoices</th>
                <th className="text-left px-4 py-2 font-medium">Success</th>
                <th className="text-left px-4 py-2 font-medium">Failures</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map((job: any) => (
                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">{job.jobType?.replace('_', ' ') ?? 'Bulk Job'}</td>
                  <td className="px-4 py-3">{job.requestCount}</td>
                  <td className="px-4 py-3 text-emerald-600">{job.successCount ?? 0}</td>
                  <td className="px-4 py-3 text-rose-600">{job.failureCount ?? 0}</td>
                  <td className="px-4 py-3"><Badge status={job.status} /></td>
                  <td className="px-4 py-3">{new Date(job.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BulkOperationsPage;
