import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eimsApi } from '@ovds/features/eims';
import toast from 'react-hot-toast';
import { useBusiness } from '../../context/businessContext';
import { useEimsRegistrations } from '@ovds/features/eims';
import { Search, Download, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  REGISTERED: 'text-emerald-600 bg-emerald-50',
  FAILED: 'text-rose-600 bg-rose-50',
  COMPLETED: 'text-emerald-600 bg-emerald-50',
  CANCELLED: 'text-slate-600 bg-slate-100',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

const EimsReceiptsPage: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [search, setSearch] = useState('');
  const { data: registrations = [] } = useEimsRegistrations();
  const { data: receipts = [], isLoading, refetch } = useQuery({
    queryKey: ['eims', 'receipts', 'all'],
    queryFn: () => eimsApi.receipts.list(),
  });

  const mapped = useMemo(() => {
    const items: any[] = [];
    registrations.forEach((r: any) => items.push({ ...r, _kind: 'registration' }));
    receipts.forEach((rc: any) => items.push({ ...rc, _kind: 'receipt' }));
    if (search.trim()) {
      const q = search.toLowerCase();
      return items.filter((it) =>
        (it.receiptNumber || it.documentNumber || '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [registrations, receipts, search]);

  const handleExport = () => {
    if (!mapped.length) {
      toast.error('No data to export');
      return;
    }
    const header = 'Type,Number,Document,Status,Date\n';
    const body = mapped.map((it) => [
      it._kind,
      `"${String(it.receiptNumber || it.irn || it.documentNumber || '').replace(/"/g, '""')}"`,
      `"${String(it.documentNumber || '').replace(/"/g, '""')}"`,
      it.status,
      it.createdAt ? new Date(it.createdAt).toLocaleDateString() : '',
    ].join(',')).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eims-receipts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
          <Download size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">E-Receipts</h1>
          <p className="text-sm text-slate-500">Sales and withholding receipt management</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt or document number..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
          />
        </div>
        <button type="button" onClick={() => refetch()} className="p-2 border rounded-lg hover:bg-slate-50">
          <RefreshCw size={16} />
        </button>
        <button type="button" onClick={handleExport} className="flex items-center gap-1 px-3 py-2 text-xs font-medium border rounded-lg hover:bg-slate-50">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Receipts', value: receipts.length },
          { label: 'Registrations', value: registrations.length },
          { label: 'Showing', value: mapped.length },
        ].map((s) => (
          <div key={s.label} className="p-2 bg-white dark:bg-slate-900 rounded-xl border text-center">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
        </div>
      ) : mapped.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">No receipts found.</p>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Number</th>
                <th className="text-left px-4 py-2 font-medium">Document</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mapped.map((it: any, idx: number) => (
                <tr key={it.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {it._kind}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {it.receiptNumber || it.irn ? String(it.receiptNumber || it.irn).slice(0, 20) + '…' : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono">{it.documentNumber ?? '—'}</td>
                  <td className="px-4 py-3"><Badge status={it.status} /></td>
                  <td className="px-4 py-3">{it.createdAt ? new Date(it.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EimsReceiptsPage;
