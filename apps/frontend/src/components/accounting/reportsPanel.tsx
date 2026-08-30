import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Scale,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  FileText,
  RefreshCw,
  Printer,
  Download,
  BookOpen,
  Users,
  Layers,
  Building2,
  Globe,
  Calculator,
} from 'lucide-react';
import { Skeleton } from '@ovds/ui';
import { downloadCSV } from '../../utils/download';
import ChangesInEquityReport from './reports/changesInEquity';
import NotesToFinancials from './reports/notesToFinancials';
import IFRSComplianceMatrix from './ifrsComplianceMatrix';
import IFRSTaxRateReference from './ifrsTaxRateReference';
import IFRSDisclosureChecklist from './ifrsDisclosureChecklist';
import IASBUpdateBanner from '../iasbUpdateBanner';
import { fmtDecimal } from '../../utils/fmt';

const fmt = fmtDecimal;

type ReportType =
  | 'balance-sheet'
  | 'profit-loss'
  | 'trial-balance'
  | 'general-ledger'
  | 'ar-aging'
  | 'ap-aging'
  | 'cash-flow'
  | 'expense-summary'
  | 'changes-in-equity'
  | 'notes'
  | 'ifrs-matrix'
  | 'tax-reference'
  | 'disclosure-checklist'
  | 'iasb-updates';

const ReportsPanel: React.FC<{ initialReportType?: string }> = ({
  initialReportType,
}) => {
  const [reportType, setReportType] = useState<ReportType>(
    (initialReportType as ReportType) || 'balance-sheet',
  );

  // Sync when parent changes the active tile
  useEffect(() => {
    if (initialReportType && initialReportType !== reportType) {
      setReportType(initialReportType as ReportType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReportType, setReportType]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const firstOfYear = `${new Date().getFullYear()}-01-01`;
  const [dateFrom, setDateFrom] = useState(firstOfYear);
  const [dateTo, setDateTo] = useState(today);
  const [asOfDate, setAsOfDate] = useState(today);

  const fetchReport = useCallback(async () => {
    // These reports are rendered client-side — no API fetch needed
    if (reportType === 'changes-in-equity' || reportType === 'notes' || reportType === 'ifrs-matrix' || reportType === 'tax-reference' || reportType === 'disclosure-checklist' || reportType === 'iasb-updates') return;
    setLoading(true);
    setReportData(null);
    try {
      let res;
      if (reportType === 'balance-sheet')
        res = await api.get(`/ovds/reports/balance-sheet?date=${asOfDate}`);
      else if (reportType === 'profit-loss')
        res = await api.get(
          `/ovds/reports/profit-loss?startDate=${dateFrom}&endDate=${dateTo}`,
        );
      else if (reportType === 'trial-balance')
        res = await api.get(`/ovds/reports/trial-balance?date=${asOfDate}`);
      else if (reportType === 'general-ledger')
        res = await api.get(
          `/ovds/reports/general-ledger?startDate=${dateFrom}&endDate=${dateTo}`,
        );
      else if (reportType === 'ar-aging')
        res = await api.get('/ovds/reports/ar-aging');
      else if (reportType === 'ap-aging')
        res = await api.get('/ovds/reports/ap-aging');
      else if (reportType === 'cash-flow')
        res = await api.get(
          `/ovds/reports/cash-flow?startDate=${dateFrom}&endDate=${dateTo}`,
        );
      else if (reportType === 'expense-summary')
        res = await api.get(
          `/ovds/reports/expense-summary?startDate=${dateFrom}&endDate=${dateTo}`,
        );
      if (!res?.data) {
        toast.error('Invalid report response');
        return;
      }
      setReportData(res.data.data || res.data);
    } catch (_error) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [reportType, dateFrom, dateTo, asOfDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportCSV = () => {
    if (!reportData) return;
    let csv = '';
    if (reportType === 'trial-balance') {
      csv =
        'Code,Account,Type,Debit,Credit\n' +
        (reportData.accounts || [])
          .map(
            (a: any) =>
              `${a.code},"${a.name}",${a.type},${a.totalDebit || ''},${a.totalCredit || ''}`,
          )
          .join('\n');
    } else if (reportType === 'balance-sheet') {
      csv =
        'Section,Code,Account,Balance\n' +
        ['assets', 'liabilities', 'equity']
          .flatMap((s: string) =>
            (reportData[s]?.items || []).map(
              (a: any) => `${s},"${a.code}","${a.name}",${a.balance}`,
            ),
          )
          .join('\n');
    } else if (reportType === 'profit-loss') {
      csv =
        'Section,Code,Account,Amount\n' +
        ['income', 'expenses']
          .flatMap((s: string) =>
            (reportData[s]?.items || []).map(
              (a: any) => `${s},"${a.code}","${a.name}",${a.amount}`,
            ),
          )
          .join('\n');
    } else if (reportType === 'expense-summary') {
      csv =
        'Category,Bills,Total,Paid,Pending\n' +
        (reportData.byCategory || [])
          .map(
            (c: any) =>
              `"${c.category}",${c.count},${c.total},${c.paid},${c.pending}`,
          )
          .join('\n');
    } else if (reportType === 'general-ledger') {
      csv =
        'Account Code,Account Name,Date,Description,Reference,Debit,Credit,Balance\n' +
        (reportData.entries || reportData.lines || [])
          .map(
            (e: any) =>
              `"${e.accountCode}","${e.accountName}","${e.date}","${e.description ?? ''}","${e.reference ?? ''}",${e.debit ?? 0},${e.credit ?? 0},${e.balance ?? 0}`,
          )
          .join('\n');
    } else if (reportType === 'ar-aging' || reportType === 'ap-aging') {
      csv =
        'Number,Party,Amount,Due Date,Days Overdue,Bucket\n' +
        (reportData.rows || [])
          .map(
            (r: any) =>
              `"${r.invoiceNumber || r.billNumber}","${r.customer || r.vendor}",${r.outstanding ?? r.total},${r.dueDate},${r.daysOverdue},${r.bucket}`,
          )
          .join('\n');
    }
    if (csv)
      downloadCSV(
        csv,
        `${reportType}_${new Date().toISOString().split('T')[0]}.csv`,
      );
  };

  const printReport = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const rawContent = document.getElementById('report-content')?.innerHTML || '';
    const content = DOMPurify.sanitize(rawContent, { FORCE_BODY: true });
    w.document.write(`<!DOCTYPE html><html><head><title>Financial Report</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;font-size:11px}
    table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#f8fafc;padding:7px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;border-bottom:2px solid #e2e8f0}
    td{padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:10px}.total-row td{font-weight:900;background:#f8fafc;border-top:2px solid #e2e8f0}</style></head>
    <body>${content}</body></html>`);
    w.document.close();
    w.print();
    w.addEventListener('afterprint', () => w.close());
  };

  const REPORT_TYPES: {
    key: ReportType;
    label: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
    group: 'financial' | 'aging' | 'ifrs';
  }[] = [
    { key: 'balance-sheet',        label: 'Balance Sheet',    icon: <Scale size={15} />,          color: 'text-emerald-600 dark:text-emerald-400',    group: 'financial' },
    { key: 'profit-loss',          label: 'Profit & Loss',    icon: <TrendingUp size={15} />,     color: 'text-emerald-600',  group: 'financial' },
    { key: 'trial-balance',        label: 'Trial Balance',    icon: <BarChart3 size={15} />,      color: 'text-violet-600',   group: 'financial' },
    { key: 'general-ledger',       label: 'General Ledger',   icon: <BookOpen size={15} />,       color: 'text-emerald-600',   group: 'financial' },
    { key: 'cash-flow',            label: 'Cash Flow',        icon: <Wallet size={15} />,         color: 'text-teal-600',     group: 'financial' },
    { key: 'expense-summary',      label: 'Expenses',         icon: <FileText size={15} />,       color: 'text-orange-600',   group: 'financial' },
    { key: 'ar-aging',             label: 'AR Aging',         icon: <ArrowUpRight size={15} />,   color: 'text-amber-600',    group: 'aging' },
    { key: 'ap-aging',             label: 'AP Aging',         icon: <ArrowDownRight size={15} />, color: 'text-rose-600',     group: 'aging' },
    { key: 'changes-in-equity',    label: 'Equity Changes',   icon: <Users size={15} />,          color: 'text-purple-600',   badge: 'IFRS', group: 'ifrs' },
    { key: 'notes',                label: 'Notes (IAS 1)',    icon: <BookOpen size={15} />,       color: 'text-slate-600',    badge: 'IFRS', group: 'ifrs' },
    { key: 'ifrs-matrix',          label: 'IFRS Matrix',      icon: <Globe size={15} />,          color: 'text-emerald-600',     badge: 'NEW',  group: 'ifrs' },
    { key: 'tax-reference',        label: 'Tax Rates',        icon: <Calculator size={15} />,     color: 'text-orange-600',   badge: 'ETH',  group: 'ifrs' },
    { key: 'disclosure-checklist', label: 'Disclosures',      icon: <Layers size={15} />,         color: 'text-teal-600',     badge: 'IAS1', group: 'ifrs' },
    { key: 'iasb-updates',         label: 'IASB Updates',     icon: <Building2 size={15} />,      color: 'text-amber-600',    badge: '2027', group: 'ifrs' },
  ];

  const GROUP_LABELS = {
    financial: 'Financial Statements',
    aging:     'Aging Reports',
    ifrs:      'IFRS & Compliance',
  };

  const needsDateRange = [
    'profit-loss',
    'cash-flow',
    'expense-summary',
    'general-ledger',
  ].includes(reportType);
  const needsAsOf = ['balance-sheet', 'trial-balance'].includes(reportType);
  const isClientSide = ['changes-in-equity', 'notes', 'ifrs-matrix', 'tax-reference', 'disclosure-checklist', 'iasb-updates'].includes(reportType);

  return (
    <div className="space-y-5">
      {/* Report type selector — grouped */}
      <div className="space-y-3">
        {(['financial', 'aging', 'ifrs'] as const).map(group => (
          <div key={group}>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">{GROUP_LABELS[group]}</p>
            <div className="flex flex-wrap gap-2">
              {REPORT_TYPES.filter(r => r.group === group).map((r) => (
                <button
                  key={r.key}
                  onClick={() => setReportType(r.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all relative ${
                    reportType === r.key
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {r.badge && (
                    <span className={`absolute -top-1.5 -right-1.5 text-[7px] font-semibold px-1 py-0.5 rounded-full leading-none text-white ${r.badge === 'IFRS' ? 'bg-emerald-500' : r.badge === 'NEW' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                      {r.badge}
                    </span>
                  )}
                  <span className={r.color}>{r.icon}</span>
                  <span className={`text-xs font-bold ${reportType === r.key ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!isClientSide && (
      <div className="ovds-widget-card p-4 flex flex-wrap gap-4 items-end">
        {needsAsOf && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              As of Date
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-400/20 outline-none dark:text-slate-200"
            />
          </div>
        )}
        {needsDateRange && (
          <>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-400/20 outline-none dark:text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-400/20 outline-none dark:text-slate-200"
              />
            </div>
          </>
        )}
        <button
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-500-dark disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}{' '}
          Refresh
        </button>
        <button
          onClick={printReport}
          className="flex items-center gap-2 px-5 py-2 bg-teal-500 dark:bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-teal-500-dark dark:hover:bg-slate-700"
        >
          <Printer size={14} /> Print
        </button>
        <button
          onClick={exportCSV}
          disabled={!reportData}
          className="flex items-center gap-2 px-5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
        >
          <Download size={14} /> CSV
        </button>
      </div>
      )}

      <div
        id="report-content"
        className="ovds-widget-card overflow-hidden"
      >
        {loading && (
          <div className="p-8">
            <Skeleton.Table rows={8} cols={3} />
          </div>
        )}
        {!loading && !reportData && (
          <div className="p-12 text-center text-slate-400 text-sm">
            No data available
          </div>
        )}
        {!loading && reportData && (
          <>
            {/* -- IFRS print header (hidden on screen, shown on print) -- */}
            <div className="hidden print:block px-6 pt-6 pb-2 border-b border-slate-200">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Full IFRS · IAS 1</p>
              <h1 className="text-xl font-semibold text-slate-900 mt-0.5">
                {reportType === 'balance-sheet' && 'Statement of Financial Position'}
                {reportType === 'profit-loss' && 'Statement of Comprehensive Income'}
                {reportType === 'trial-balance' && 'Trial Balance'}
                {reportType === 'cash-flow' && 'Statement of Cash Flows (IAS 7)'}
                {reportType === 'ar-aging' && 'Accounts Receivable Aging'}
                {reportType === 'ap-aging' && 'Accounts Payable Aging'}
                {reportType === 'expense-summary' && 'Expense Summary'}
                {reportType === 'general-ledger' && 'General Ledger'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {needsAsOf ? `As of ${new Date(asOfDate).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}` : `${new Date(dateFrom).toLocaleDateString()} — ${new Date(dateTo).toLocaleDateString()}`}
              </p>
            </div>

            {/* Balance Sheet — IAS 1.54 current/non-current classification */}
            {reportType === 'balance-sheet' && (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">IAS 1.54 — Statement of Financial Position</p>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                      As of {new Date(reportData.date ?? asOfDate).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                  </div>
                </div>

                {/* Current / Non-current split per IAS 1.60 */}
                {[
                  { title: 'ASSETS', sections: [
                    { label: 'Current Assets', items: (reportData.assets?.items || []).filter((a: any) => ['CASH','BANK','ACCOUNTS_RECEIVABLE','CONTRACT_ASSET','INVENTORY','CURRENT_ASSET','CURRENT_TAX_ASSET','BIOLOGICAL_ASSET'].includes(a.category)), color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Non-current Assets', items: (reportData.assets?.items || []).filter((a: any) => ['FIXED_ASSET','RIGHT_OF_USE_ASSET','INVESTMENT_PROPERTY','INTANGIBLE_ASSET','GOODWILL','LONG_TERM_INVESTMENT','FINANCIAL_ASSET','DEFERRED_TAX_ASSET','BIOLOGICAL_ASSET_NC'].includes(a.category)), color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Other Assets', items: (reportData.assets?.items || []).filter((a: any) => !['CASH','BANK','ACCOUNTS_RECEIVABLE','CONTRACT_ASSET','INVENTORY','CURRENT_ASSET','CURRENT_TAX_ASSET','BIOLOGICAL_ASSET','FIXED_ASSET','RIGHT_OF_USE_ASSET','INVESTMENT_PROPERTY','INTANGIBLE_ASSET','GOODWILL','LONG_TERM_INVESTMENT','FINANCIAL_ASSET','DEFERRED_TAX_ASSET','BIOLOGICAL_ASSET_NC'].includes(a.category)), color: 'text-emerald-600 dark:text-emerald-400' },
                  ], total: reportData.assets?.total || 0, totalLabel: 'Total Assets', totalColor: 'text-emerald-600 dark:text-emerald-400' },
                  { title: 'LIABILITIES', sections: [
                    { label: 'Current Liabilities', items: (reportData.liabilities?.items || []).filter((a: any) => ['ACCOUNTS_PAYABLE','CONTRACT_LIABILITY','CURRENT_LIABILITY','TAX_PAYABLE','SHORT_TERM_BORROWING','LEASE_LIABILITY_CURRENT','PROVISION_CURRENT'].includes(a.category)), color: 'text-rose-700' },
                    { label: 'Non-current Liabilities', items: (reportData.liabilities?.items || []).filter((a: any) => ['LONG_TERM_LIABILITY','LEASE_LIABILITY_NC','DEFERRED_TAX','EMPLOYEE_BENEFIT_OBL','PROVISION_NC'].includes(a.category)), color: 'text-rose-700' },
                    { label: 'Other Liabilities', items: (reportData.liabilities?.items || []).filter((a: any) => !['ACCOUNTS_PAYABLE','CONTRACT_LIABILITY','CURRENT_LIABILITY','TAX_PAYABLE','SHORT_TERM_BORROWING','LEASE_LIABILITY_CURRENT','PROVISION_CURRENT','LONG_TERM_LIABILITY','LEASE_LIABILITY_NC','DEFERRED_TAX','EMPLOYEE_BENEFIT_OBL','PROVISION_NC'].includes(a.category)), color: 'text-rose-700' },
                  ], total: reportData.liabilities?.total || 0, totalLabel: 'Total Liabilities', totalColor: 'text-rose-700' },
                  { title: 'EQUITY', sections: [
                    { label: 'Equity', items: reportData.equity?.items || [], color: 'text-violet-700' },
                  ], total: reportData.equity?.total || 0, totalLabel: 'Total Equity', totalColor: 'text-violet-700' },
                ].map((group) => (
                  <div key={group.title} className="space-y-3">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">{group.title}</p>
                    {group.sections.filter(s => s.items.length > 0).map(section => (
                      <div key={section.label}>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 pl-1">{section.label}</p>
                        <table className="w-full text-sm">
                          <tbody>
                            {section.items.map((a: any) => (
                              <tr key={a.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="py-2 pl-4 text-xs text-slate-400 font-mono w-20">{a.code}</td>
                                <td className="py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{a.name}</td>
                                <td className="py-2 text-xs text-slate-400 dark:text-slate-500 hidden sm:table-cell">{a.category?.replace(/_/g, ' ')}</td>
                                <td className={`py-2 text-xs font-semibold text-right pr-2 ${a.balance < 0 ? 'text-rose-600 dark:text-rose-400' : section.color}`}>
                                  {a.balance < 0 ? `(${fmt(Math.abs(a.balance))})` : fmt(a.balance)}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-white dark:bg-slate-800/40">
                              <td colSpan={3} className="py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 pl-4">Subtotal — {section.label}</td>
                              <td className={`py-2 text-sm font-semibold text-right pr-2 ${section.color}`}>
                                {(() => { const sub = section.items.reduce((s: number, a: any) => s + (a.balance || 0), 0); return sub < 0 ? `(${fmt(Math.abs(sub))})` : fmt(sub); })()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-3 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{group.totalLabel}</span>
                      <span className={`text-base font-semibold ${group.totalColor}`}>{fmt(group.total)}</span>
                    </div>
                  </div>
                ))}

                {/* IAS 1 verification: Assets = Liabilities + Equity */}
                {(() => {
                  const assets = reportData.assets?.total || 0;
                  const liabEquity = (reportData.liabilities?.total || 0) + (reportData.equity?.total || 0);
                  const balanced = Math.abs(assets - liabEquity) < 0.01;
                  return (
                    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 ${balanced ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'}`}>
                      <div>
                        <p className={`text-xs font-semibold ${balanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                          {balanced ? '✓ IAS 1 — Balance Sheet Balances' : '⚠ Balance Sheet Does Not Balance'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Assets = Liabilities + Equity</p>
                      </div>
                      <div className="text-right">
                        <p className="ovds-caption">Assets: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(assets)}</span></p>
                        <p className="ovds-caption">L+E: <span className="font-semibold text-violet-700">{fmt(liabEquity)}</span></p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Profit & Loss — IAS 1.81A Statement of Comprehensive Income */}
            {reportType === 'profit-loss' && (
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">IAS 1.81A — Statement of Comprehensive Income</p>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                    {new Date(reportData.startDate ?? dateFrom).toLocaleDateString('en-ET', { month: 'short', year: 'numeric' })} — {new Date(reportData.endDate ?? dateTo).toLocaleDateString('en-ET', { month: 'short', year: 'numeric' })}
                  </h2>
                </div>

                {/* Revenue */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Revenue (IFRS 15)</p>
                  <table className="w-full text-sm">
                    <tbody>
                      {(reportData.income?.items || []).map((a: any) => (
                        <tr key={a.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2 pl-3 text-xs text-slate-400 font-mono w-20">{a.code}</td>
                          <td className="py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{a.name}</td>
                          <td className="py-2 text-xs font-semibold text-right pr-2 text-emerald-700">{fmt(a.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl mt-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Total Revenue</span>
                    <span className="text-sm font-semibold text-emerald-700">{fmt(reportData.income?.total || 0)}</span>
                  </div>
                </div>

                {/* Cost of Sales → Gross Profit */}
                {(() => {
                  const cogs = (reportData.expenses?.items || []).filter((a: any) => a.category === 'COST_OF_GOODS_SOLD' || a.type === 'COGS');
                  const cogsTotal = cogs.reduce((s: number, a: any) => s + (a.amount || 0), 0);
                  const grossProfit = (reportData.income?.total || 0) - cogsTotal;
                  if (cogs.length === 0) return null;
                  return (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Cost of Sales (IAS 2)</p>
                      <table className="w-full text-sm">
                        <tbody>
                          {cogs.map((a: any) => (
                            <tr key={a.id} className="border-b border-slate-50 dark:border-slate-800/50">
                              <td className="py-2 pl-3 text-xs text-slate-400 font-mono w-20">{a.code}</td>
                              <td className="py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{a.name}</td>
                              <td className="py-2 text-xs font-semibold text-right pr-2 text-rose-700">({fmt(a.amount)})</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex justify-between px-3 py-2.5 bg-teal-50 dark:bg-teal-950/20 rounded-xl mt-1 border border-teal-200 dark:border-teal-900">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Gross Profit</span>
                        <span className={`text-sm font-semibold ${grossProfit >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>{fmt(grossProfit)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Operating Expenses */}
                {(() => {
                  const opex = (reportData.expenses?.items || []).filter((a: any) => a.category !== 'COST_OF_GOODS_SOLD' && a.type !== 'COGS' && a.category !== 'ovds_COST' && a.category !== 'TAX_EXPENSE');
                  if (opex.length === 0 && (reportData.expenses?.items || []).length > 0) {
                    // fallback: show all expenses
                    return (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Operating Expenses</p>
                        <table className="w-full text-sm">
                          <tbody>
                            {(reportData.expenses?.items || []).map((a: any) => (
                              <tr key={a.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="py-2 pl-3 text-xs text-slate-400 font-mono w-20">{a.code}</td>
                                <td className="py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{a.name}</td>
                                <td className="py-2 text-xs font-semibold text-right pr-2 text-rose-700">({fmt(a.amount)})</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  if (opex.length === 0) return null;
                  return (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Operating Expenses</p>
                      <table className="w-full text-sm">
                        <tbody>
                          {opex.map((a: any) => (
                            <tr key={a.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-2 pl-3 text-xs text-slate-400 font-mono w-20">{a.code}</td>
                              <td className="py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{a.name}</td>
                              <td className="py-2 text-xs font-semibold text-right pr-2 text-rose-700">({fmt(a.amount)})</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* ovds Costs */}
                {(() => {
                  const fc = (reportData.expenses?.items || []).filter((a: any) => a.category === 'ovds_COST');
                  if (fc.length === 0) return null;
                  return (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">ovds Costs (IAS 23)</p>
                      <table className="w-full text-sm">
                        <tbody>
                          {fc.map((a: any) => (
                            <tr key={a.id} className="border-b border-slate-50 dark:border-slate-800/50">
                              <td className="py-2 pl-3 text-xs text-slate-400 font-mono w-20">{a.code}</td>
                              <td className="py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{a.name}</td>
                              <td className="py-2 text-xs font-semibold text-right pr-2 text-rose-700">({fmt(a.amount)})</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* Net Profit + Tax + Profit after Tax */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  {/* Operating profit subtotal */}
                  <div className="flex justify-between px-3 py-2 bg-white dark:bg-slate-800/40 rounded-xl">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Total Expenses</span>
                    <span className="text-xs font-semibold text-rose-700">({fmt(reportData.expenses?.total || 0)})</span>
                  </div>
                  {/* Profit before tax */}
                  <div className="flex justify-between px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Profit Before Tax</span>
                    <span className={`text-sm font-semibold ${(reportData.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-700'}`}>{fmt(reportData.netProfit || 0)}</span>
                  </div>
                  {/* Income tax (IAS 12) */}
                  {(() => {
                    const taxItems = (reportData.expenses?.items || []).filter((a: any) => a.category === 'TAX_EXPENSE');
                    const taxTotal = taxItems.reduce((s: number, a: any) => s + (a.amount || 0), 0);
                    const estimatedTax = taxTotal || Math.max(0, (reportData.netProfit || 0) * 0.30);
                    return (
                      <div className="flex justify-between px-3 py-2 bg-white dark:bg-slate-800/40 rounded-xl">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Income Tax Expense (IAS 12 · 30%)</span>
                        <span className="text-xs font-semibold text-rose-700">({fmt(estimatedTax)})</span>
                      </div>
                    );
                  })()}
                  {/* Net profit after tax */}
                  <div className={`flex items-center justify-between px-4 py-3.5 rounded-xl border-2 ${(reportData.netProfit || 0) >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'}`}>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {(reportData.netProfit || 0) >= 0 ? 'Profit for the Period' : 'Loss for the Period'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Margin: {reportData.income?.total ? ((reportData.netProfit / reportData.income.total) * 100).toFixed(1) : '0.0'}%
                      </p>
                    </div>
                    <p className={`text-xl font-semibold ${(reportData.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {fmt(Math.abs(reportData.netProfit || 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Trial Balance */}
            {reportType === 'trial-balance' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Trial Balance —{' '}
                    {new Date(reportData.date).toLocaleDateString()}
                  </h2>
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${reportData.isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                  >
                    {reportData.isBalanced ? '✓ Balanced' : '✗ Out of Balance'}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="text-left py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="text-left py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-right py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Debit
                      </th>
                      <th className="text-right py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.accounts || []).map((a: any) => (
                      <tr
                        key={a.id}
                        className="border-b border-slate-50 hover:bg-slate-50"
                      >
                        <td className="py-2 text-xs text-slate-400 font-mono">
                          {a.code}
                        </td>
                        <td className="py-2 text-xs font-bold text-slate-700">
                          {a.name}
                        </td>
                        <td className="py-2 text-xs text-slate-400">
                          {a.type}
                        </td>
                        <td className="py-2 text-xs font-bold text-right text-emerald-600 dark:text-emerald-400">
                          {a.totalDebit > 0 ? fmt(a.totalDebit) : '—'}
                        </td>
                        <td className="py-2 text-xs font-bold text-right text-rose-700">
                          {a.totalCredit > 0 ? fmt(a.totalCredit) : '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-white border-t-2 border-slate-200">
                      <td
                        colSpan={3}
                        className="py-2.5 text-xs font-semibold text-slate-700 pl-2"
                      >
                        Totals
                      </td>
                      <td className="py-2.5 text-sm font-semibold text-right text-emerald-600 dark:text-emerald-400">
                        {fmt(reportData.totals?.debit || 0)}
                      </td>
                      <td className="py-2.5 text-sm font-semibold text-right text-rose-700">
                        {fmt(reportData.totals?.credit || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* AR / AP Aging — IFRS 7.36 credit risk disclosure */}
            {(reportType === 'ar-aging' || reportType === 'ap-aging') && (
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
                    {reportType === 'ar-aging' ? 'IFRS 7.36 — Credit Risk Exposure' : 'IAS 1.54 — Trade Payables Aging'}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                    {reportType === 'ar-aging' ? 'Accounts Receivable' : 'Accounts Payable'} Aging
                  </h2>
                </div>

                {/* Bucket summary with visual bars */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'Current', key: 'current', color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900', bar: 'bg-emerald-500' },
                    { label: '1–30 Days', key: 'days30', color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900', bar: 'bg-amber-500' },
                    { label: '31–60 Days', key: 'days60', color: 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900', bar: 'bg-orange-500' },
                    { label: '61–90 Days', key: 'days90', color: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900', bar: 'bg-rose-500' },
                    { label: '90+ Days', key: 'over90', color: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900', bar: 'bg-rose-600' },
                  ].map((b) => {
                    const val = reportData.summary?.[b.key] || 0;
                    const total = reportData.total || 1;
                    const pct = Math.round((val / total) * 100);
                    return (
                      <div key={b.key} className={`${b.color} rounded-xl p-3 border`}>
                        <p className="text-[10px] font-medium uppercase tracking-wider opacity-70 mb-1">{b.label}</p>
                        <p className="text-sm font-semibold">{fmt(val)}</p>
                        <div className="mt-1.5 h-1 bg-current/10 rounded-full overflow-hidden">
                          <div className={`h-full ${b.bar} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[9px] opacity-60 mt-0.5">{pct}%</p>
                      </div>
                    );
                  })}
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {reportType === 'ar-aging' ? 'Invoice' : 'Bill'}
                      </th>
                      <th className="text-left py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {reportType === 'ar-aging' ? 'Customer' : 'Vendor'}
                      </th>
                      <th className="text-right py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="text-right py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</th>
                      <th className="text-right py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Days Overdue</th>
                      <th className="text-center py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bucket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.rows || []).map((r: any) => (
                      <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 text-xs font-mono text-slate-500">{r.invoiceNumber || r.billNumber}</td>
                        <td className="py-2 text-xs font-bold text-slate-700 dark:text-slate-300">{r.customer || r.vendor}</td>
                        <td className="py-2 text-xs font-semibold text-right text-slate-800 dark:text-slate-100">{fmt(r.outstanding ?? r.total)}</td>
                        <td className="py-2 text-xs text-right text-slate-400">{new Date(r.dueDate).toLocaleDateString()}</td>
                        <td className={`py-2 text-xs font-semibold text-right ${r.daysOverdue > 90 ? 'text-rose-600' : r.daysOverdue > 30 ? 'text-orange-600' : r.daysOverdue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {r.daysOverdue > 0 ? `${r.daysOverdue}d` : 'Current'}
                        </td>
                        <td className="py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.bucket === 'current' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : r.bucket === '1-30' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'}`}>
                            {r.bucket}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Total Outstanding</span>
                    {reportType === 'ar-aging' && (
                      <p className="ovds-caption mt-0.5">IFRS 9 ECL provision may be required for overdue amounts</p>
                    )}
                  </div>
                  <span className="text-base font-semibold text-slate-800 dark:text-slate-100">{fmt(reportData.total || 0)}</span>
                </div>
              </div>
            )}

            {/* Cash Flow — IAS 7 Statement of Cash Flows */}
            {reportType === 'cash-flow' && (
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">IAS 7 — Statement of Cash Flows (Indirect Method)</p>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-0.5">Cash Flow Statement</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(reportData.startDate ?? dateFrom).toLocaleDateString()} — {new Date(reportData.endDate ?? dateTo).toLocaleDateString()}
                  </p>
                </div>
                {[
                  {
                    title: 'Operating Activities',
                    data: reportData.operating,
                    color: 'text-emerald-600 dark:text-emerald-400',
                  },
                  {
                    title: 'Investing Activities',
                    data: reportData.investing,
                    color: 'text-violet-700',
                  },
                  {
                    title: 'Financing Activities',
                    data: reportData.financing,
                    color: 'text-teal-700',
                  },
                ].map((section) => (
                  <div key={section.title} className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {section.title}
                    </p>
                    {(section.data?.inflows || []).map((f: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between py-1.5 border-b border-slate-50"
                      >
                        <span className="text-xs text-slate-600 flex items-center gap-1.5">
                          <ArrowUpRight
                            size={12}
                            className="text-emerald-500"
                          />
                          {f.label}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">
                          +{fmt(f.amount)}
                        </span>
                      </div>
                    ))}
                    {(section.data?.outflows || []).map((f: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between py-1.5 border-b border-slate-50"
                      >
                        <span className="text-xs text-slate-600 flex items-center gap-1.5">
                          <ArrowDownRight size={12} className="text-rose-500" />
                          {f.label}
                        </span>
                        <span className="text-xs font-semibold text-rose-700">
                          -{fmt(f.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 bg-white rounded-xl px-3">
                      <span className="text-xs font-semibold text-slate-700">
                        Net {section.title}
                      </span>
                      <span
                        className={`text-xs font-semibold ${section.data?.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
                      >
                        {fmt(section.data?.net || 0)}
                      </span>
                    </div>
                  </div>
                ))}
                <div
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 ${reportData.netCashFlow >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'}`}
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Net Increase / (Decrease) in Cash</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">IAS 7.45 — Net cash movement for the period</p>
                  </div>
                  <p className={`text-xl font-semibold ${reportData.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {reportData.netCashFlow >= 0 ? '+' : '-'}{fmt(Math.abs(reportData.netCashFlow || 0))}
                  </p>
                </div>

                {/* IAS 7.45 — Opening/Closing cash reconciliation */}
                {(reportData.openingCash != null || reportData.closingCash != null) && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">IAS 7.45 — Cash Reconciliation</p>
                    {[
                      { label: 'Opening Cash & Cash Equivalents', value: reportData.openingCash ?? 0, color: 'text-slate-700 dark:text-slate-200' },
                      { label: 'Net Cash Movement', value: reportData.netCashFlow ?? 0, color: (reportData.netCashFlow ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700' },
                      { label: 'Closing Cash & Cash Equivalents', value: reportData.closingCash ?? ((reportData.openingCash ?? 0) + (reportData.netCashFlow ?? 0)), color: 'text-emerald-600 dark:text-emerald-400 font-semibold' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between px-3 py-2 bg-white dark:bg-slate-800/40 rounded-xl">
                        <span className="text-xs text-slate-600 dark:text-slate-300">{row.label}</span>
                        <span className={`text-xs font-semibold ${row.color}`}>{fmt(row.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Expense Summary */}
            {reportType === 'expense-summary' && (
              <div className="p-6 space-y-5">
                <h2 className="text-lg font-semibold text-slate-800">
                  Expense Summary by Category
                </h2>
                <div className="ovds-grid-layout cols-3">
                  {[
                    {
                      label: 'Total Expenses',
                      value: reportData.summary?.totalExpenses || 0,
                      color: 'text-slate-800',
                      bg: 'bg-white',
                    },
                    {
                      label: 'Paid',
                      value: reportData.summary?.totalPaid || 0,
                      color: 'text-emerald-700',
                      bg: 'bg-emerald-50',
                    },
                    {
                      label: 'Pending',
                      value: reportData.summary?.totalPending || 0,
                      color: 'text-amber-700',
                      bg: 'bg-amber-50',
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`${s.bg} rounded-xl p-4 border border-current/10`}
                    >
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {s.label}
                      </p>
                      <p className={`text-xl font-semibold mt-1 ${s.color}`}>
                        {fmt(s.value)}
                      </p>
                      <p className="ovds-caption mt-0.5">
                        {reportData.summary?.billCount || 0} bills
                      </p>
                    </div>
                  ))}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="text-right py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Bills
                      </th>
                      <th className="text-right py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="text-right py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Paid
                      </th>
                      <th className="text-right py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Pending
                      </th>
                      <th className="text-right py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.byCategory || []).map((c: any) => {
                      const pct =
                        reportData.summary?.totalExpenses > 0
                          ? (
                              (c.total / reportData.summary.totalExpenses) *
                              100
                            ).toFixed(1)
                          : '0.0';
                      return (
                        <tr
                          key={c.category}
                          className="border-b border-slate-50 hover:bg-slate-50"
                        >
                          <td className="py-2.5 text-xs font-bold text-slate-700">
                            {c.category.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2.5 text-xs text-right text-slate-500">
                            {c.count}
                          </td>
                          <td className="py-2.5 text-xs font-semibold text-right text-slate-800">
                            {fmt(c.total)}
                          </td>
                          <td className="py-2.5 text-xs font-bold text-right text-emerald-700">
                            {fmt(c.paid)}
                          </td>
                          <td className="py-2.5 text-xs font-bold text-right text-amber-700">
                            {fmt(c.pending)}
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-orange-400 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!reportData.byCategory?.length && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-slate-400 text-sm"
                        >
                          No expense data for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* General Ledger — all journal lines grouped by account */}
        {reportType === 'general-ledger' && (
          <div className="p-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">General Ledger</h2>
            <p className="ovds-caption">All journal entry lines grouped by account — {dateFrom} to {dateTo}</p>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
              </div>
            ) : !reportData ? (
              <div className="py-12 text-center text-slate-400 text-sm">No ledger data for this period.</div>
            ) : (
              <div className="space-y-6">
                {(reportData.accounts ?? []).map((acct: any) => (
                  <div key={acct.code} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="ovds-label font-mono">{acct.code}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{acct.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 uppercase">{acct.type}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500">Opening: <span className="font-bold text-slate-700 dark:text-slate-300">{fmt(acct.openingBalance ?? 0)}</span></span>
                        <span className="text-slate-500">Closing: <span className={`font-bold ${(acct.closingBalance ?? 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{fmt(acct.closingBalance ?? 0)}</span></span>
                      </div>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="ovds-label border-b border-slate-100 dark:border-slate-800">
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-left">Reference</th>
                          <th className="px-4 py-2 text-right">Debit</th>
                          <th className="px-4 py-2 text-right">Credit</th>
                          <th className="px-4 py-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {(acct.lines ?? acct.entries ?? []).map((line: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{line.date ? new Date(line.date).toLocaleDateString() : '—'}</td>
                            <td className="px-4 py-2 text-slate-700 dark:text-slate-300 max-w-xs truncate">{line.description ?? line.memo ?? '—'}</td>
                            <td className="px-4 py-2 text-slate-400 font-mono">{line.reference ?? '—'}</td>
                            <td className="px-4 py-2 text-right font-bold text-slate-800 dark:text-slate-100">{line.debit > 0 ? fmt(line.debit) : '—'}</td>
                            <td className="px-4 py-2 text-right font-bold text-slate-800 dark:text-slate-100">{line.credit > 0 ? fmt(line.credit) : '—'}</td>
                            <td className={`px-4 py-2 text-right font-bold ${(line.balance ?? 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{fmt(line.balance ?? 0)}</td>
                          </tr>
                        ))}
                        {!(acct.lines ?? acct.entries ?? []).length && (
                          <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-400">No transactions</td></tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-white dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-xs">
                          <td colSpan={3} className="px-4 py-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">Totals</td>
                          <td className="px-4 py-2 text-right text-slate-800 dark:text-slate-100">{fmt(acct.totalDebit ?? 0)}</td>
                          <td className="px-4 py-2 text-right text-slate-800 dark:text-slate-100">{fmt(acct.totalCredit ?? 0)}</td>
                          <td className={`px-4 py-2 text-right ${(acct.closingBalance ?? 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{fmt(acct.closingBalance ?? 0)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ))}
                {!(reportData.accounts ?? []).length && (
                  <div className="py-12 text-center text-slate-400 text-sm">No accounts with activity in this period.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* IFRS for SMEs §6 — Statement of Changes in Equity */}
        {reportType === 'changes-in-equity' && (
          <ChangesInEquityReport />
        )}

        {/* IFRS for SMEs §8 — Notes to Financial Statements */}
        {reportType === 'notes' && (
          <NotesToFinancials />
        )}

        {/* IFRS Compliance Matrix — proclamation to standard mapping */}
        {reportType === 'ifrs-matrix' && (
          <div className="p-6">
            <IFRSComplianceMatrix />
          </div>
        )}

        {/* Ethiopian Tax Rate Reference with IFRS treatment */}
        {reportType === 'tax-reference' && (
          <div className="p-6">
            <IFRSTaxRateReference />
          </div>
        )}

        {/* IFRS Disclosure Checklist — IAS 1.112–138 */}
        {reportType === 'disclosure-checklist' && (
          <div className="p-6">
            <IFRSDisclosureChecklist />
          </div>
        )}

        {/* IASB Updates — dedicated full-page view */}
        {reportType === 'iasb-updates' && (
          <div className="p-6">
            <IASBUpdateBanner businessType="ALL" showReadiness showDismissAll />
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportsPanel;







