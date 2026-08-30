import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, Printer, RefreshCw, Download, Search } from 'lucide-react';
import { Skeleton } from '@ovds/ui';
import { downloadCSV } from '../../utils/download';
import { useEscapeKey } from '../../hooks';
import { fmtDecimal } from '../../utils/fmt';

const fmt = fmtDecimal;

interface LedgerEntry {
  id: string;
  date: string;
  reference?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface LedgerModalProps {
  account: any;
  onClose: () => void;
}

const LedgerModal: React.FC<LedgerModalProps> = ({ account, onClose }) => {
  useEscapeKey(onClose);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [closingBalance, setClosingBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await api.get(
        `/ovds/accounts/${account.id}/ledger?${params}`,
      );
      const data = res.data.data || res.data;
      setEntries(data.entries || []);
      setClosingBalance(data.closingBalance || 0);
    } catch {
      toast.error('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, [account.id, dateFrom, dateTo]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const filtered = search
    ? entries.filter(
        (e) =>
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          (e.reference || '').toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  const exportCSV = () => {
    const header = 'Date,Reference,Description,Debit,Credit,Balance\n';
    const rows = filtered
      .map(
        (e) =>
          `${new Date(e.date).toLocaleDateString()},"${e.reference || ''}","${e.description}",${e.debit || ''},${e.credit || ''},${e.balance}`,
      )
      .join('\n');
    downloadCSV(
      header + rows,
      `ledger_${account.code}_${new Date().toISOString().split('T')[0]}.csv`,
    );
  };

  const printLedger = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = filtered
      .map(
        (e) =>
          `<tr><td>${new Date(e.date).toLocaleDateString()}</td><td>${e.reference || '—'}</td><td>${e.description}</td>
       <td style="text-align:right">${e.debit > 0 ? fmt(e.debit) : '—'}</td>
       <td style="text-align:right">${e.credit > 0 ? fmt(e.credit) : '—'}</td>
       <td style="text-align:right;font-weight:900">${fmt(e.balance)}</td></tr>`,
      )
      .join('');
    w.document
      .write(`<!DOCTYPE html><html><head><title>Ledger — ${account.code} ${account.name}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;font-size:11px}
    h1{font-size:14px;font-weight:900;margin-bottom:4px}h2{font-size:10px;color:#64748b;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}th{background:#f8fafc;padding:6px 8px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #e2e8f0}
    td{padding:5px 8px;border-bottom:1px solid #f1f5f9;font-size:10px}</style></head>
    <body><h1>${account.code} — ${account.name}</h1><h2>${account.type} · ${account.category?.replace(/_/g, ' ')}</h2>
    <table><thead><tr><th>Date</th><th>Ref</th><th>Description</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th><th style="text-align:right">Balance</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="margin-top:16px;font-size:9px;color:#94a3b8">Closing Balance: ${fmt(closingBalance)} · Generated ${new Date().toLocaleString()}</p>
    </body></html>`);
    w.document.close();
    w.print();
    w.addEventListener('afterprint', () => w.close());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Account Ledger — ${account.code} ${account.name}`}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <p className="font-semibold text-slate-800">
              {account.code} — {account.name}
            </p>
            <p className="text-xs text-slate-400">
              {account.type} · {account.category?.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              <Download size={12} /> CSV
            </button>
            <button
              onClick={printLedger}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-teal-500-dark dark:hover:bg-slate-700"
            >
              <Printer size={12} /> Print
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-3 items-end shrink-0">
          {[
            {
              label: 'From',
              field: 'dateFrom',
              val: dateFrom,
              set: setDateFrom,
            },
            { label: 'To', field: 'dateTo', val: dateTo, set: setDateTo },
          ].map((f) => (
            <div key={f.field} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {f.label}
              </label>
              <input
                type="date"
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-400/20"
              />
            </div>
          ))}
          <button
            onClick={fetchLedger}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-white rounded-xl text-xs font-bold hover:bg-teal-500-dark"
          >
            <RefreshCw size={12} /> Apply
          </button>
          <div className="relative ml-auto">
            <Search
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries..."
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-400/20 w-48"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6">
              <Skeleton.Table rows={8} cols={6} />
            </div>
          ) : (
            <table className="ovds-table w-full text-sm">
              <thead className="sticky top-0 bg-white border-b border-slate-200">
                <tr>
                  {[
                    'Date',
                    'Reference',
                    'Description',
                    'Debit',
                    'Credit',
                    'Balance',
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${i >= 3 ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-400">
                      {e.reference || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-700 max-w-xs truncate">
                      {e.description}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-bold text-right text-emerald-600 dark:text-emerald-400">
                      {e.debit > 0 ? fmt(e.debit) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-bold text-right text-rose-700">
                      {e.credit > 0 ? fmt(e.credit) : '—'}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-xs font-semibold text-right ${e.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}
                    >
                      {fmt(e.balance)}
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-400 text-sm"
                    >
                      {search
                        ? 'No entries match your search.'
                        : 'No transactions for this account.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-3 border-t border-slate-100 flex justify-between items-center shrink-0 bg-white">
          <span className="text-xs text-slate-400">
            {filtered.length}
            {search ? ` of ${entries.length}` : ''} transactions
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              Closing Balance:
            </span>
            <span
              className={`text-sm font-semibold ${closingBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}
            >
              {fmt(closingBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerModal;







