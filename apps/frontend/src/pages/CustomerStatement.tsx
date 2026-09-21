/**
 * CustomerStatement — Standalone customer statement page.
 * Full transaction history, invoices, payments, and running balance per customer.
 * ovds-style design with print/export support.
 */
import { Skeleton, AppPage } from '@ovds/ui';
import DOMPurify from 'dompurify';
import {
  FileText, Download, Printer, Filter, RefreshCw,
  CheckCircle2, AlertTriangle, TrendingUp,
  User, Phone, Mail, ArrowUpRight,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { downloadBlob } from '../utils/download';
import { fmtCurrency } from '../utils/fmt';


// -- Types ---------------------------------------------------------------------
interface CustomerOption {
  customerId: string;
  customerName: string;
  email?: string;
  phone?: string;
  tin?: string;
  balance?: number;
}

interface StatementTransaction {
  date:        string;
  type:        'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  reference?:  string;
  description?: string;
  debit?:      number;
  credit?:     number;
  balance:     number;
}

interface Statement {
  customerName:    string;
  customerEmail?:  string;
  customerPhone?:  string;
  customerTin?:    string;
  customerAddress?: string;
  openingBalance:  number;
  totalDebit:      number;
  totalCredit:     number;
  closingBalance:  number;
  transactions:    StatementTransaction[];
}

// -- Component -----------------------------------------------------------------
const CustomerStatement: React.FC = () => {
  usePageTitle('Customer Statement');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();

  const [customers, setCustomers]     = useState<CustomerOption[]>([]);
  const [selected, setSelected]       = useState('');
  const [statement, setStatement]     = useState<Statement | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading]         = useState(false);
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');

  const canRead = can('ovds:read');
  const fmt = (n: number) => fmtCurrency(n, 'ETB');

  // Load customer list
  useEffect(() => {
    const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
    api.get(`/ovds/reports/customer-statement${cq}`, { headers: { 'x-background': '1' } } as any)
      .then((r: any) => setCustomers(r.data?.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, [selectedCompanyId]);

  const loadStatement = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo)   params.set('dateTo', dateTo);
      if (selectedCompanyId) params.set('companyId', selectedCompanyId);
      const r = await api.get(`/ovds/reports/customer-statement/${selected}?${params}`);
      setStatement(r.data?.data ?? r.data);
    } catch { toast.error('Failed to load statement'); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!statement) return;
    const header = 'Date,Type,Reference,Description,Debit,Credit,Balance\n';
    const rows = statement.transactions.map(t =>
      `"${new Date(t.date).toLocaleDateString()}","${t.type}","${t.reference ?? ''}","${t.description ?? ''}",${t.debit ?? 0},${t.credit ?? 0},${t.balance ?? 0}`
    ).join('\n');
    downloadBlob(
      new Blob([header + rows], { type: 'text/csv' }),
      `statement_${statement.customerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  const printStatement = () => {
    if (!statement) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (v: any) => DOMPurify.sanitize(String(v ?? ''));
    const rows = (statement.transactions ?? []).map((t: any) =>
      `<tr><td>${esc(new Date(t.date).toLocaleDateString())}</td><td>${esc(t.type)}</td><td>${esc(t.reference ?? '')}</td><td>${esc(t.description ?? '')}</td><td class="debit">${t.debit ? fmt(t.debit) : ''}</td><td class="credit">${t.credit ? fmt(t.credit) : ''}</td><td class="balance">${fmt(t.balance)}</td></tr>`
    ).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Customer Statement — ${esc(statement.customerName)}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;font-size:13px}
      h1{font-size:20px;margin-bottom:4px}
      .meta{color:#64748b;font-size:11px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}
      th{background:#f8fafc;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.05em}
      tr:nth-child(even){background:#f8fafc}
      .total{font-weight:700;background:#f0fff8}
      .debit{color:#00E784}.credit{color:#00E784}.balance{font-weight:700}
      @media print{body{padding:0}}
    </style></head><body>
    <h1>Customer Statement</h1>
    <div class="meta">
      <strong>${esc(statement.customerName)}</strong>
      ${statement.customerTin ? ` · TIN: ${esc(statement.customerTin)}` : ''}
      ${statement.customerEmail ? ` · ${esc(statement.customerEmail)}` : ''}
      <br/>Period: ${esc(dateFrom || 'All time')} to ${esc(dateTo || 'Today')} · Generated: ${esc(new Date().toLocaleDateString())}
    </div>
    <table>
      <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
      <tbody>
        ${rows}
        <tr class="total">
          <td colspan="4">Closing Balance</td>
          <td class="debit">${fmt(statement.totalDebit)}</td>
          <td class="credit">${fmt(statement.totalCredit)}</td>
          <td class="balance">${fmt(statement.closingBalance)}</td>
        </tr>
      </tbody>
    </table>
    </body></html>`);
    w.document.close();
    w.print();
  };

  const selectedCustomer = customers.find(c => (c.customerId ?? (c as any).id) === selected);

  const closingPositive = statement ? statement.closingBalance > 0 : false;

  return (
    <AppPage
      title="Customer Statement"
      subtitle="Full transaction history, invoices, payments, and running balance per customer"
      icon={<FileText size={16} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      actions={statement && (
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Download size={13} /> CSV
          </button>
          <button onClick={printStatement}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Printer size={13} /> Print
          </button>
        </div>
      )}
    >
      <>
      {/* -- Filter bar -------------------------------------------------------- */}
      <div className="ovds-widget-card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-52">
            <label className="block ovds-label mb-1.5">Customer</label>
            {listLoading ? (
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : (
              <select
                value={selected}
                onChange={e => { setSelected(e.target.value); setStatement(null); }}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-slate-200"
              >
                <option value="">— Select customer —</option>
                {customers.map((c, idx) => (
                  <option key={c.customerId ?? (c as any).id ?? idx} value={c.customerId ?? (c as any).id}>
                    {c.customerName ?? (c as any).name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block ovds-label mb-1.5">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-slate-200" />
          </div>
          <div>
            <label className="block ovds-label mb-1.5">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-slate-200" />
          </div>
          <button
            onClick={loadStatement}
            disabled={!selected || loading || !canRead}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 transition-colors shadow-sm shadow-green-500/20 dark:shadow-green-500/10/30"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Filter size={14} />}
            Generate
          </button>
        </div>
      </div>

      {/* -- Customer info card ------------------------------------------------- */}
      {selectedCustomer && (
        <div className="ovds-widget-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--pro-azure-100)] dark:bg-green-950/40 flex items-center justify-center shrink-0">
            <User size={18} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 dark:text-slate-100">{selectedCustomer.customerName}</p>
            <div className="flex flex-wrap gap-3 mt-0.5">
              {selectedCustomer.email && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400"><Mail size={10} /> {selectedCustomer.email}</span>
              )}
              {selectedCustomer.phone && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400"><Phone size={10} /> {selectedCustomer.phone}</span>
              )}
              {selectedCustomer.tin && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">TIN: {selectedCustomer.tin}</span>
              )}
            </div>
          </div>
          {selectedCustomer.balance !== undefined && (
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Outstanding</p>
              <p className={`text-lg font-bold tabular-nums ${selectedCustomer.balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'}`}>
                {fmt(selectedCustomer.balance)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* -- Loading skeleton --------------------------------------------------- */}
      {loading && (
        <div className="space-y-3">
          <div className="ovds-grid-layout cols-4">
            {[1,2,3,4].map(i => <Skeleton.Line key={i} className="h-20 rounded-xl" />)}
          </div>
          <Skeleton.Line className="h-64 rounded-xl" />
        </div>
      )}

      {/* -- Statement --------------------------------------------------------- */}
      {statement && !loading && (
        <>
          {/* Summary KPIs */}
          <div className="ovds-grid-layout cols-4">
            {[
              { label: 'Opening Balance', value: fmt(statement.openingBalance), iconName: 'up',    color: 'text-slate-700 dark:text-slate-200',         bg: 'bg-slate-100 dark:bg-slate-800'           },
              { label: 'Total Invoiced',  value: fmt(statement.totalDebit),     iconName: 'trend', color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',     bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30'     },
              { label: 'Total Paid',      value: fmt(statement.totalCredit),    iconName: 'check', color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',     bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30'     },
              { label: 'Closing Balance', value: fmt(statement.closingBalance), iconName: closingPositive ? 'warn' : 'check', color: closingPositive ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]', bg: closingPositive ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-[var(--pro-azure-50)] dark:bg-green-950/30' },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center shrink-0 ${c.color}`}>
                  {c.iconName === 'up'    && <ArrowUpRight size={16} />}
                  {c.iconName === 'trend' && <TrendingUp size={16} />}
                  {c.iconName === 'check' && <CheckCircle2 size={16} />}
                  {c.iconName === 'warn'  && <AlertTriangle size={16} />}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{c.label}</p>
                  <p className={`text-base font-bold tabular-nums mt-0.5 ${c.color}`}>{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Transaction table */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{statement.customerName}</h3>
                <p className="ovds-caption mt-0.5">
                  {dateFrom || 'All time'} → {dateTo || 'Today'} · {statement.transactions.length} transactions
                </p>
              </div>
              {statement.customerTin && (
                <span className="text-xs text-slate-400 font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded-lg">TIN: {statement.customerTin}</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    {['Date', 'Type', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'].map(h => (
                      <th key={h} className="px-4 py-3 text-left ovds-label">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statement.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">
                        No transactions in this period
                      </td>
                    </tr>
                  ) : statement.transactions.map((t, i) => (
                    <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.type === 'INVOICE'     ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)]'
                          : t.type === 'PAYMENT'   ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)]'
                          : t.type === 'CREDIT_NOTE' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>{t.type.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{t.reference ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{t.description ?? '—'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] tabular-nums">
                        {t.debit ? fmt(t.debit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] tabular-nums">
                        {t.credit ? fmt(t.credit) : '—'}
                      </td>
                      <td className={`px-4 py-3 text-xs font-bold tabular-nums ${t.balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'}`}>
                        {fmt(t.balance)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-white dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                    <td colSpan={4} className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">
                      Closing Balance
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] tabular-nums text-xs">{fmt(statement.totalDebit)}</td>
                    <td className="px-4 py-3 font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] tabular-nums text-xs">{fmt(statement.totalCredit)}</td>
                    <td className={`px-4 py-3 font-bold tabular-nums text-xs ${statement.closingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'}`}>
                      {fmt(statement.closingBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* -- Empty states ------------------------------------------------------- */}
      {!statement && !loading && selected && (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
          <Filter size={24} className="text-slate-300" />
          <p className="text-sm">Click Generate to load the statement</p>
        </div>
      )}
      {!selected && !listLoading && (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
          <User size={24} className="text-slate-300" />
          <p className="text-sm">Select a customer above to generate their statement</p>
        </div>
      )}
      </>
    </AppPage>
  );
};

export default CustomerStatement;


