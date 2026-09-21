import { useEimsRegistrations, useEimsSalesReceipt } from '@ovds/features/eims';
import { Search, FileText } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../../context/businessContext';


const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  REGISTERED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  FAILED: 'text-rose-600 bg-rose-50',
  COMPLETED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

const WithholdingPage: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [search, setSearch] = useState('');
  const { data: registrations = [] } = useEimsRegistrations();
  const [receiptForm, setReceiptForm] = useState({
    invoiceId: '',
    receiptNumber: '',
    collectedAmount: 0,
    paymentMode: 'CASH',
    collectorName: '',
    reason: '',
    paymentCoverage: 'FULL' as 'FULL' | 'PARTIAL',
  });

  const salesReceipt = useEimsSalesReceipt();

  const whtRegs = useMemo(() => {
    if (!search.trim()) return registrations;
    const q = search.toLowerCase();
    return registrations.filter((r: any) =>
      (r.documentNumber || '').toLowerCase().includes(q) ||
      (r.irn || '').toLowerCase().includes(q)
    );
  }, [registrations, search]);

  const handleRegisterReceipt = async () => {
    if (!receiptForm.invoiceId || !receiptForm.receiptNumber || !receiptForm.collectedAmount) {
      toast.error('Invoice ID, receipt number, and amount are required');
      return;
    }
    try {
      await salesReceipt.mutateAsync(receiptForm);
      toast.success('Sales receipt registered');
      setReceiptForm({ invoiceId: '', receiptNumber: '', collectedAmount: 0, paymentMode: 'CASH', collectorName: '', reason: '', paymentCoverage: 'FULL' });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
          <FileText size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Withholding Tax</h1>
          <p className="text-sm text-slate-500">Manage withholding tax receipts and WHT certificates</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <h3 className="text-sm font-semibold">Register Sales Receipt</h3>
        <p className="text-xs text-slate-500">Record a new sales receipt for an invoice</p>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Invoice ID" value={receiptForm.invoiceId}
            onChange={(e) => setReceiptForm({ ...receiptForm, invoiceId: e.target.value })}
            className="px-3 py-2 text-sm border rounded-lg" />
          <input placeholder="Receipt Number" value={receiptForm.receiptNumber}
            onChange={(e) => setReceiptForm({ ...receiptForm, receiptNumber: e.target.value })}
            className="px-3 py-2 text-sm border rounded-lg" />
          <input placeholder="Amount" type="number" value={receiptForm.collectedAmount || ''}
            onChange={(e) => setReceiptForm({ ...receiptForm, collectedAmount: Number(e.target.value) })}
            className="px-3 py-2 text-sm border rounded-lg" />
          <select value={receiptForm.paymentMode}
            onChange={(e) => setReceiptForm({ ...receiptForm, paymentMode: e.target.value })}
            className="px-3 py-2 text-sm border rounded-lg">
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="CHEQUE">Cheque</option>
          </select>
          <input placeholder="Collector Name" value={receiptForm.collectorName}
            onChange={(e) => setReceiptForm({ ...receiptForm, collectorName: e.target.value })}
            className="px-3 py-2 text-sm border rounded-lg" />
          <select value={receiptForm.paymentCoverage}
            onChange={(e) => setReceiptForm({ ...receiptForm, paymentCoverage: e.target.value as any })}
            className="px-3 py-2 text-sm border rounded-lg">
            <option value="FULL">Full</option>
            <option value="PARTIAL">Partial</option>
          </select>
        </div>
        <button onClick={handleRegisterReceipt} disabled={salesReceipt.isPending}
          className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
          {salesReceipt.isPending ? 'Registering…' : 'Register Receipt'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold">WHT Submissions</h3>
        </div>
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search document or IRN..."
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
            />
          </div>
        </div>
        {whtRegs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No withholding submissions found.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                <th className="text-left px-4 py-2 font-medium">Document</th>
                <th className="text-left px-4 py-2 font-medium">IRN</th>
                <th className="text-left px-4 py-2 font-medium">Mode</th>
                <th className="text-left px-4 py-2 font-medium">Attempts</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {whtRegs.slice(0, 20).map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2 font-mono">{r.documentNumber ?? '—'}</td>
                  <td className="px-4 py-2 font-mono text-[10px]">{r.irn ? r.irn.slice(0, 16) + '…' : '—'}</td>
                  <td className="px-4 py-2">{r.submissionMode}</td>
                  <td className="px-4 py-2">{r.attemptCount}</td>
                  <td className="px-4 py-2"><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WithholdingPage;
