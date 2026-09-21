import { Skeleton, AppPage } from '@ovds/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  CheckCircle2,
  Download,
  FileWarning,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { CollectionsTable } from '../components/collectionsTable';
import { DeductionResolver } from '../components/deductionResolver';
import { ALL_INTEGRATION_TYPES } from '../components/invoice/constants';
import { usePageTitle } from '../hooks/usePageTitle';
import { collectionsApi } from '../services/collectionsApi';
import { downloadCSV } from '../utils/download';


// -- Types ---------------------------------------------------------------------
type MainTab = 'cases' | 'disputes' | 'archive' | 'integration' | 'compliance' | 'vat_filing' | 'analytics';
const DISPUTE_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  RESOLVED: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-green-300',
  REJECTED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

// -- Dispute Resolution Modal --------------------------------------------------
const DisputeModal: React.FC<{ dispute: any; onClose: () => void }> = ({ dispute, onClose }) => {
  const qc = useQueryClient();
const [status, setStatus] = useState(dispute.status);
const [resolution, setResolution] = useState('');
const mutation = useMutation({
    mutationFn: () =>
      collectionsApi.updateDispute(dispute.id, {
        status,
        resolution: resolution || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-disputes'] });
toast.success('Dispute updated');
      onClose();
    },
    onError: () => toast.error('Failed to update dispute'),
  });
return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileWarning size={16} className="text-orange-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Resolve Dispute</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={15} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {dispute.invoiceNumber || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {dispute.customerName || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                ETB {Number(dispute.amount ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reason</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 max-w-[200px] text-right">
                {(dispute.notes || '').replace(/^DISPUTE:\s*/, '').split(' | ')[0]}
              </span>
            </div>
          </div>

          {/* Status select */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              New Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20"
            >
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Resolution notes */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Resolution Notes
            </label>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={3}
              placeholder="Document resolution details, evidence reviewed, outcome..."
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] disabled:opacity-50"
            >
              {mutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );}

// -- Disputes Tab --------------------------------------------------------------
const DisputesTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('ALL');
const [search, setSearch] = useState('');
const [selected, setSelected] = useState<any>(null);
const { data, isLoading, refetch } = useQuery({
    queryKey: ['payment-disputes', statusFilter],
    queryFn: () =>
      collectionsApi
        .getDisputes(statusFilter !== 'ALL' ? { status: statusFilter } : undefined)
        .then((r: any) => r.data?.data ?? r.data ?? []),
  });
const disputes: any[] = Array.isArray(data) ? data : [];
const filtered = disputes.filter(d => {
    if (!search) return true;
const q = search.toLowerCase();
return (
      (d.invoiceNumber || '').toLowerCase().includes(q) ||
      (d.customerName || '').toLowerCase().includes(q) ||
      (d.notes || '').toLowerCase().includes(q)
    );
  });
const exportDisputes = () => {
    const header = 'Invoice,Customer,Amount,Status,Reason,Created\n';
const rows = filtered
      .map(
        d =>
          `"${d.invoiceNumber || ''}","${d.customerName || ''}",${Number(d.amount || 0).toFixed(2)},"${d.status}","${(d.notes || '').replace(/^DISPUTE:\s*/, '').split(' | ')[0]}","${new Date(d.createdAt).toLocaleDateString()}"`,
      )
      .join('\n');
    downloadCSV(header + rows, `disputes_${new Date().toISOString().split('T')[0]}.csv`);
  };
return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice, customer..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-200 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-400/20"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button
          onClick={() => refetch()}
          className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
        >
          <RefreshCw size={14} />
        </button>

        <button
          onClick={exportDisputes}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Download size={13} /> Export
        </button>
      </div>

      {/* Table */}
      <div className="ovds-widget-card overflow-hidden">
        <table className="w-full text-sm ovds-table">
          <thead className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <tr>
              {['Invoice', 'Customer', 'Amount', 'Status', 'Reason', 'Filed', 'Actions'].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {isLoading ? (
              <Skeleton.TableRows cols={7} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <ShieldAlert size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="font-bold">No disputes found</p>
                </td>
              </tr>
            ) : (
              filtered.map((d: any) => (
                <tr
                  key={d.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">
                    {d.invoiceNumber || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-200 font-bold">
                    {d.customerName || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                    ETB {Number(d.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        DISPUTE_STATUS_COLORS[d.status] || 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {d.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                    {(d.notes || '').replace(/^DISPUTE:\s*/, '').split(' | ')[0]}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(d)}
                      className="px-3 py-1 bg-[var(--pro-azure)] text-white text-[10px] font-semibold rounded-lg hover:bg-[var(--pro-azure-dark)] transition-colors"
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && <DisputeModal dispute={selected} onClose={() => setSelected(null)} />}
    </div>
  );}

// -- Transaction Archive Tab ---------------------------------------------------
const ArchiveTab: React.FC = () => {
  const [page, setPage] = useState(1);
const [dateFrom, setDateFrom] = useState('');
const [dateTo, setDateTo] = useState('');
const [method, setMethod] = useState('');
const { data, isLoading, refetch } = useQuery({
    queryKey: ['transaction-archive', page, dateFrom, dateTo, method],
    queryFn: () =>
      collectionsApi
        .getTransactionArchive({
          page,
          limit: 50,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          method: method || undefined,
        })
        .then((r: any) => r.data?.data ?? r.data),
  });
const records: any[] = data?.data ?? [];
const pagination = data?.pagination;
const exportArchive = () => {
    const header =
      'Date,Invoice,Customer,TIN,Method,Amount,Reference,Bank,Telecom Ref,MCC,QR Type,TIN Validated,Duplicate\n';
const rows = records
      .map(
        r =>
          `"${new Date(r.paidAt).toLocaleDateString()}","${r.invoiceNumber || ''}","${r.customerName || ''}","${r.customerTin || ''}","${r.method}",${Number(r.amount).toFixed(2)},"${r.reference || ''}","${r.bankName || ''}","${r.telecomRef || ''}","${r.mcc || ''}","${r.qrType || ''}",${r.tinValidated ? 'YES' : 'NO'},${r.isDuplicate ? 'YES' : 'NO'}`,
      )
      .join('\n');
    downloadCSV(header + rows, `transaction_archive_${new Date().toISOString().split('T')[0]}.csv`);
  };
return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20"
        />
        <select
          value={method}
          onChange={e => setMethod(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20"
        >
          <option value="">All Methods</option>
          {['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_MONEY', 'CREDIT_CARD'].map(m => (
            <option key={m} value={m}>
              {m.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button
          onClick={() => { setPage(1); refetch(); }}
          className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={exportArchive}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 ml-auto"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm ovds-table">
            <thead className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                {['Date', 'Invoice', 'Customer', 'Method', 'Amount', 'Reference', 'MCC', 'QR', 'Compliance'].map(
                  h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {isLoading ? (
                <Skeleton.TableRows cols={9} />
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Archive size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="font-bold">No transactions in archive</p>
                  </td>
                </tr>
              ) : (
                records.map((r: any) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(r.paidAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">
                      {r.invoiceNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-200">
                      <div className="font-bold">{r.customerName || '—'}</div>
                      {r.customerTin && (
                        <div className="text-[10px] text-slate-400 font-mono">TIN: {r.customerTin}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                        {r.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">
                      ETB {Number(r.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {r.reference || r.telecomRef || r.bankName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.mcc ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded">
                          {r.mcc}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.qrType ? (
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            r.qrType === 'DYNAMIC'
                              ? 'bg-[var(--pro-azure-100)] dark:bg-green-950/40 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {r.qrType}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {r.tinValidated && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                            <ShieldCheck size={10} /> TIN
                          </span>
                        )}
                        {r.isDuplicate && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                            <ShieldAlert size={10} /> DUP
                          </span>
                        )}
                        {!r.tinValidated && !r.isDuplicate && (
                          <span className="text-slate-300 dark:text-slate-600 text-[10px]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-bold">
              {pagination.total} records · Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// -- Integration Monitor Tab ---------------------------------------------------
const IntegrationTab: React.FC = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['integration-stats'],
    queryFn: () =>
      collectionsApi.getIntegrationStats().then((r: any) => r.data?.data ?? r.data ?? {}),
  });
const stats = data ?? {};
const categories = [
    { key: 'NBE Payment Flow', label: 'NBE Payment Flows', color: 'amber' },
    { key: 'Architecture', label: 'Architecture Patterns', color: 'violet' },
    { key: 'Business Process', label: 'Business Processes', color: 'green' },
  ] as const;
const colorMap: Record<string, string> = {
    amber:
      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    violet:
      'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400',
    indigo:
      'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-800 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
  };
const barColor: Record<string, string> = {
    amber: 'bg-amber-400',
    violet: 'bg-teal-500',
    indigo: 'bg-[var(--pro-azure-50)]0',
  };
return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 font-bold">
          Live breakdown of all integration type tags across recorded payments
        </p>
        <button
          onClick={() => refetch()}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {categories.map(cat => {
        const types = ALL_INTEGRATION_TYPES.filter(t => t.category === cat.key);
const counts: Record<string, number> = stats[cat.key] ?? {};
const maxCount = Math.max(1, ...Object.values(counts).map(Number));
return (
          <div
            key={cat.key}
            className="ovds-widget-card overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <BarChart3 size={13} className={colorMap[cat.color].split(' ')[4]} />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{cat.label}</p>
              <span
                className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full border ${colorMap[cat.color]}`}
              >
                {types.length} types
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {types.map(t => {
                const count = Number(counts[t.value] ?? 0);
const pct = Math.round((count / maxCount) * 100);
return (
                  <div
                    key={t.value}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-lg shrink-0">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {t.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2 shrink-0">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor[cat.color]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate">{t.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="ovds-grid-layout cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
};

// -- NBE Compliance Summary Tab ------------------------------------------------
const ComplianceTab: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('');
const [dateTo, setDateTo] = useState('');
const { data, isLoading, refetch } = useQuery({
    queryKey: ['nbe-compliance', dateFrom, dateTo],
    queryFn: () =>
      collectionsApi
        .getNBEComplianceSummary({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })
        .then((r: any) => r.data?.data ?? r.data ?? {}),
  });
const s = data ?? {};
const handleExport = async () => {
    try {
      const res = await collectionsApi.exportNBECompliance({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
const a = document.createElement('a');
      a.href = url;
      a.download = `ERCA_compliance_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
toast.success('ERCA compliance report exported');
    }
catch {
      const header = 'Metric,Value\n';
const rows = Object.entries(s)
        .map(([k, v]) => `"${k}","${v}"`)
        .join('\n');
      downloadCSV(header + rows, `ERCA_compliance_${new Date().toISOString().split('T')[0]}.csv`);
toast.success('Compliance summary exported');
    }
  };
const metrics = [
    { key: 'totalPayments', label: 'Total Payments', icon: '💳', color: 'blue' },
    { key: 'tinValidatedCount', label: 'TIN Validated', icon: '🛡️', color: 'green' },
    { key: 'duplicateCount', label: 'Duplicates Detected', icon: '⚠️', color: 'red' },
    { key: 'qrPayments', label: 'QR Payments', icon: '📱', color: 'violet' },
    { key: 'dynamicQrCount', label: 'Dynamic QR', icon: '⚡', color: 'amber' },
    { key: 'staticQrCount', label: 'Static QR', icon: '📌', color: 'slate' },
    { key: 'telecomPayments', label: 'Telecom Payments', icon: '📲', color: 'orange' },
    { key: 'bankQrPayments', label: 'Bank QR Payments', icon: '🏦', color: 'blue' },
    { key: 'manualPayments', label: 'Manual Payments', icon: '✍️', color: 'slate' },
    { key: 'disputeCount', label: 'Active Disputes', icon: '⚖️', color: 'red' },
    { key: 'resolvedDisputes', label: 'Resolved Disputes', icon: '✅', color: 'green' },
    { key: 'totalAmount', label: 'Total Amount (ETB)', icon: '💰', color: 'green' },
  ];
const colorClasses: Record<string, string> = {
    blue: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-800 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    indigo:
      'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-800 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
    red: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400',
    violet:
      'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400',
    amber:
      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    orange:
      'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
    slate:
      'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
  };
return (
    <div className="space-y-5">
      {/* Filters + export */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20"
        />
        <button
          onClick={() => refetch()}
          className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--pro-azure)] text-white rounded-lg text-sm font-medium hover:bg-[var(--pro-azure-dark)] ml-auto"
        >
          <Download size={13} /> Export ERCA Report
        </button>
      </div>

      {/* NBE + ERCA directive badge */}
      <div className="flex items-center gap-3 p-4 bg-[var(--pro-azure-50)] dark:bg-green-950/30 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-2xl">
        <ShieldCheck size={20} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
            NBE Directive SB/IoT/001/2021 · ERCA Compliance
          </p>
          <p className="text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] dark:text-[var(--pro-azure-light)]/70 mt-0.5">
            All QR payments, TIN validations, duplicate checks, and MoR interactions are tracked per
            NBE interoperability and ERCA reporting standards.
          </p>
        </div>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.key} className={`border rounded-xl p-4 transition-colors ${colorClasses[m.color]}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{m.icon}</span>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{m.label}</p>
            </div>
            {isLoading ? (
              <div className="h-7 bg-current opacity-10 rounded-lg animate-pulse" />
            ) : (
              <p className="text-2xl font-semibold">
                {m.key === 'totalAmount'
                  ? `ETB ${Number(s[m.key] ?? 0).toLocaleString()}`
                  : Number(s[m.key] ?? 0).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Compliance rate bars */}
      {!isLoading && s.totalPayments > 0 && (
        <div className="ovds-widget-card p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Compliance Rates
          </p>
          {[
            {
              label: 'TIN Validated',
              count: s.tinValidatedCount ?? 0,
              total: s.totalPayments,
              color: 'bg-[var(--pro-azure-50)]0',
            },
            {
              label: 'QR Payments',
              count: s.qrPayments ?? 0,
              total: s.totalPayments,
              color: 'bg-teal-500',
            },
            {
              label: 'Duplicate-Free',
              count: (s.totalPayments ?? 0) - (s.duplicateCount ?? 0),
              total: s.totalPayments,
              color: 'bg-[var(--pro-azure-50)]0',
            },
            {
              label: 'Dispute-Free',
              count: (s.totalPayments ?? 0) - (s.disputeCount ?? 0),
              total: s.totalPayments,
              color: 'bg-amber-500',
            },
          ].map(r => {
            const pct = s.totalPayments > 0 ? Math.round((r.count / r.total) * 100) : 0;
return (
              <div key={r.label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-600 dark:text-slate-300">{r.label}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${r.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// -- ERCA VAT Filing Tab -------------------------------------------------------
const VatFilingTab: React.FC = () => {
  const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const [year, setYear] = useState(currentYear);
const [month, setMonth] = useState(currentMonth);
const { data, isLoading, refetch } = useQuery({
    queryKey: ['vat-filing', year, month],
    queryFn: () => {
      const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
const lastDay = new Date(year, month, 0).getDate();
const dateTo = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
return collectionsApi
        .getNBEComplianceSummary({ dateFrom, dateTo })
        .then((r: any) => r.data?.data ?? r.data ?? {});
    },
  });
const s = data ?? {};
const totalAmount = Number(s.totalAmount ?? 0);
const vatRate = 0.15;
const taxable = totalAmount / (1 + vatRate);
const outputVat = totalAmount - taxable;
const wht = taxable * 0.03;
const monthName = new Date(year, month - 1).toLocaleString('en-ET', {
    month: 'long',
    year: 'numeric',
  });
const handleExportVatReturn = () => {
    const rows = [
      ['ERCA VAT Return — ' + monthName, '', '', ''],
      ['Field', 'Description', 'Amount (ETB)', 'Notes'],
      ['Box 1', 'Total Sales (incl. VAT)', totalAmount.toFixed(2), 'All taxable supplies'],
      ['Box 2', 'Taxable Sales (excl. VAT)', taxable.toFixed(2), 'Box 1 ÷ 1.15'],
      ['Box 3', 'Output VAT (15%)', outputVat.toFixed(2), 'Box 1 − Box 2'],
      ['Box 4', 'WHT Deducted (3%)', wht.toFixed(2), '3% of Box 2'],
      ['Box 5', 'Net VAT Payable', (outputVat - wht).toFixed(2), 'Box 3 − Box 4'],
      ['', '', '', ''],
      ['TIN Validated Transactions', '', String(s.tinValidatedCount ?? 0), ''],
      ['QR Payments', '', String(s.qrPayments ?? 0), ''],
      ['Duplicate Flags', '', String(s.duplicateCount ?? 0), ''],
      ['Total Payments', '', String(s.totalPayments ?? 0), ''],
    ];
const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    downloadCSV(csv, `ERCA_VAT_Return_${year}_${String(month).padStart(2, '0')}.csv`);
toast.success('VAT return exported');}
const vatBoxes = [
    {
      box: 'Box 1',
      label: 'Total Sales (incl. VAT)',
      value: totalAmount,
      note: 'All taxable supplies for the period',
      color: 'blue',
    },
    {
      box: 'Box 2',
      label: 'Taxable Sales (excl. VAT)',
      value: taxable,
      note: 'Box 1 ÷ 1.15',
      color: 'slate',
    },
    {
      box: 'Box 3',
      label: 'Output VAT (15%)',
      value: outputVat,
      note: 'Box 1 − Box 2',
      color: 'amber',
    },
    {
      box: 'Box 4',
      label: 'WHT Deducted (3%)',
      value: wht,
      note: '3% of Box 2 (Proclamation 1395/2025)',
      color: 'violet',
    },
    {
      box: 'Box 5',
      label: 'Net VAT Payable',
      value: outputVat - wht,
      note: 'Box 3 − Box 4',
      color: 'green',
    },
  ];
return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>
              {new Date(2000, m - 1).toLocaleString('en-ET', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20"
        >
          {[currentYear - 1, currentYear, currentYear + 1].map(y => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={handleExportVatReturn}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--pro-azure)] text-white rounded-lg text-sm font-medium hover:bg-[var(--pro-azure-dark)] ml-auto"
        >
          <Download size={13} /> Export VAT Return
        </button>
      </div>

      {/* Period heading */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl">
        <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            ERCA VAT Return — {monthName}
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
            Proclamation No. 1341/2024 · 15% standard VAT · Filing deadline: 30th of following month
          </p>
        </div>
      </div>

      {/* VAT boxes */}
      <div className="ovds-grid-layout cols-3">
        {vatBoxes.map(b => (
          <div
            key={b.box}
            className="ovds-widget-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {b.box}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
                {b.label}
              </span>
            </div>
            {isLoading ? (
              <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ) : (
              <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                ETB {b.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">{b.note}</p>
          </div>
        ))}
      </div>

      {/* Supporting stats */}
      {!isLoading && (
        <div className="ovds-widget-card p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Supporting Statistics
          </p>
          <div className="ovds-grid-layout cols-4">
            {[
              { label: 'Total Payments', value: s.totalPayments ?? 0, icon: '💳' },
              { label: 'TIN Validated', value: s.tinValidatedCount ?? 0, icon: '🛡️' },
              { label: 'QR Payments', value: s.qrPayments ?? 0, icon: '📱' },
              { label: 'Duplicates', value: s.duplicateCount ?? 0, icon: '⚠️' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  {Number(stat.value).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );}

// -- Analytics Tab -------------------------------------------------------------
const AnalyticsTab: React.FC = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['collections-dashboard-analytics'],
    queryFn: () =>
      collectionsApi.dashboard().then((r: any) => r.data?.data ?? r.data ?? {}),
  });
const d = data ?? {};
const kpis = [
    {
      label: 'Open Cases',
      value: d.openCases ?? 0,
      icon: <AlertTriangle size={18} />,
      color: 'amber',
    },
    {
      label: 'DSO (Days)',
      value: d.dsoDays ?? 0,
      icon: <Activity size={18} />,
      color: 'blue',
    },
    {
      label: 'Collection Rate',
      value: d.collectionRate != null ? `${d.collectionRate}%` : '—',
      icon: <ShieldCheck size={18} />,
      color: 'green',
    },
    {
      label: 'Recovery Rate',
      value: d.recoveryRate != null ? `${d.recoveryRate}%` : '—',
      icon: <BarChart3 size={18} />,
      color: 'violet',
    },
  ];
const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    blue: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-800 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    indigo:
      'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-800 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
    violet: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400',
  };
const agingBuckets: Array<{ label: string; count: number; color: string }> = d.agingSummary
    ? Object.entries(d.agingSummary).map(([stage, count]) => ({
        label: stage.replace(/_/g, ' '),
        count: Number(count),
        color: 'bg-[var(--pro-azure-50)]0',
      }))
    : [];
const maxBucket = Math.max(1, ...agingBuckets.map(b => b.count));
return (
    <div className="space-y-5">
      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={() => refetch()}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI strip */}
      <div className="ovds-grid-layout cols-4">
        {kpis.map(kpi => (
          <div
            key={kpi.label}
            className={`border rounded-xl p-4 ${colorMap[kpi.color]}`}
          >
            <div className="flex items-center gap-2 mb-2 opacity-70">
              {kpi.icon}
              <p className="text-[10px] font-semibold uppercase tracking-wider">{kpi.label}</p>
            </div>
            {isLoading ? (
              <div className="h-7 bg-current opacity-10 rounded-lg animate-pulse" />
            ) : (
              <p className="text-2xl font-semibold">{kpi.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* AR Aging buckets */}
      {agingBuckets.length > 0 && (
        <div className="ovds-widget-card p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Case Stage Distribution
          </p>
          <div className="space-y-3">
            {agingBuckets.map(b => {
              const pct = Math.round((b.count / maxBucket) * 100);
return (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-600 dark:text-slate-300 capitalize">
                      {b.label}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{b.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                       className="h-full rounded-full bg-[var(--pro-azure-50)]0 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DSO trend table */}
      {d.dsoDays != null && (
        <div className="ovds-widget-card p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            DSO Summary
          </p>
          <div className="ovds-grid-layout cols-3 text-center">
            <div>
              <p className="text-3xl font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{d.dsoDays}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Current DSO
              </p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-amber-600 dark:text-amber-400">
                {d.overduePromises ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Overdue Promises
              </p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                {d.openCases ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Open Cases
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="ovds-grid-layout cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------
const TAB_CONFIG: Array<{ key: MainTab; label: string; icon: React.ReactNode }> = [
  { key: 'cases', label: 'Cases', icon: <AlertTriangle size={14} /> },
  { key: 'disputes', label: 'Disputes', icon: <FileWarning size={14} /> },
  { key: 'archive', label: 'Archive', icon: <Archive size={14} /> },
  { key: 'integration', label: 'Integration', icon: <Activity size={14} /> },
  { key: 'compliance', label: 'Compliance', icon: <ShieldCheck size={14} /> },
  { key: 'vat_filing', label: 'VAT Filing', icon: <ShieldAlert size={14} /> },
  { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} /> },
];
const AccountingCollections: React.FC = () => {
  const { t } = useTranslation();
usePageTitle('Collections & Compliance');
const [activeTab, setActiveTab] = useState<MainTab>('cases');
const [selectedDeduction, setSelectedDeduction] = useState<any>(null);
return (
    <AppPage
      title="Collections & Compliance"
      subtitle="NBE payment flows · ERCA compliance · Dispute resolution · Transaction archive"
      icon={<TrendingDown size={16} />}
      iconBg="bg-[var(--pro-azure-50)]0"
    >

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl overflow-x-auto">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'cases' && (
          <CollectionsTable
            onCaseSelect={id => {
              toast.success(`Case ${id.slice(0, 8).toUpperCase()} selected — use the View button to open details`);
            }}
          />
        )}
        {activeTab === 'disputes' && <DisputesTab />}
        {activeTab === 'archive' && <ArchiveTab />}
        {activeTab === 'integration' && <IntegrationTab />}
        {activeTab === 'compliance' && <ComplianceTab />}
        {activeTab === 'vat_filing' && <VatFilingTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>

      {/* Deduction resolver modal */}
      {selectedDeduction && (
        <DeductionResolver
          deduction={selectedDeduction}
          onClose={() => setSelectedDeduction(null)}
        />
      )}
    </AppPage>
  );
};
export default AccountingCollections;













