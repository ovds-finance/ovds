import React, { useState, useMemo } from 'react';
import {
  useEimsRegistrations,
  useRegisterInvoiceEims,
  useEimsInvoiceCancel,
  useEimsInvoiceRetry,
} from '@ovds/features/eims';
import toast from 'react-hot-toast';
import { useBusiness } from '../../context/businessContext';
import {
  Search, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Eye, FileText,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'text-emerald-600 bg-emerald-50',
  PENDING: 'text-amber-600 bg-amber-50',
  ISSUED: 'text-emerald-600 bg-emerald-50',
  EXPIRING: 'text-orange-600 bg-orange-50',
  FAILED: 'text-rose-600 bg-rose-50',
  REGISTERED: 'text-emerald-600 bg-emerald-50',
  COMPLETED: 'text-emerald-600 bg-emerald-50',
  EXPIRED: 'text-rose-600 bg-rose-50',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

const EimsInvoicesPage: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const { data: registrations = [], isLoading, refetch } = useEimsRegistrations(statusFilter || undefined);
  const registerInvoice = useRegisterInvoiceEims();
  const cancelInvoice = useEimsInvoiceCancel();
  const retryInvoice = useEimsInvoiceRetry();

  const filtered = useMemo(() => {
    if (!search.trim()) return registrations;
    const q = search.toLowerCase();
    return registrations.filter((r: any) =>
      (r.documentNumber || '').toLowerCase().includes(q) ||
      (r.irn || '').toLowerCase().includes(q)
    );
  }, [registrations, search]);

  const handleRegister = async (id: string) => {
    try {
      await registerInvoice.mutateAsync(id);
      toast.success('Invoice registered with MoR');
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelInvoice.mutateAsync({ id, reasonCode: 'CANCELLED_BY_TAXPAYER' });
      toast.success('Invoice cancelled');
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retryInvoice.mutateAsync(id);
      toast.success('Retry initiated');
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
          <FileText size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">E-Invoices</h1>
          <p className="text-sm text-slate-500">Manage invoice registrations, verification, and cancellations</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document number or IRN..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg"
        >
          <option value="">All statuses</option>
          <option value="REGISTERED">Registered</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 border rounded-lg hover:bg-slate-50"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">No invoices found.</p>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                <th className="text-left px-4 py-2 font-medium">Document</th>
                <th className="text-left px-4 py-2 font-medium">IRN</th>
                <th className="text-left px-4 py-2 font-medium">Mode</th>
                <th className="text-left px-4 py-2 font-medium">Attempts</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-right px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono">{r.documentNumber ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-[10px]">{r.irn ? r.irn.slice(0, 20) + '…' : '—'}</td>
                  <td className="px-4 py-3">{r.submissionMode}</td>
                  <td className="px-4 py-3">{r.attemptCount}</td>
                  <td className="px-4 py-3"><Badge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {r.status !== 'REGISTERED' && r.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => handleRegister(r.invoiceId)}
                          disabled={registerInvoice.isPending}
                          className="p-1.5 rounded hover:bg-teal-50 text-teal-600"
                          title="Register"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      {r.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => handleCancel(r.invoiceId)}
                          disabled={cancelInvoice.isPending}
                          className="p-1.5 rounded hover:bg-rose-50 text-rose-600"
                          title="Cancel"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                      {r.status === 'FAILED' && (
                        <button
                          type="button"
                          onClick={() => handleRetry(r.invoiceId)}
                          disabled={retryInvoice.isPending}
                          className="p-1.5 rounded hover:bg-amber-50 text-amber-600"
                          title="Retry"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EimsInvoicesPage;
