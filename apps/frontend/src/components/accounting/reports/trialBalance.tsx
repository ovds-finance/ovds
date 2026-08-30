import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import {
  Download,
  Printer,
  Calendar,
  FileText,
  Database,
  TrendingUp,
  Search as SearchIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@ovds/ui';
import { Badge } from '@ovds/ui';
import { fmtCurrencyDecimal } from '../../../utils/fmt';

interface TrialBalanceItem {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: 'debit' | 'credit';
}

interface TrialBalanceData {
  asOfDate: string;
  companyName: string;
  currency: string;
  totalDebits: number;
  totalCredits: number;
  items: TrialBalanceItem[];
  unbalancedAmount: number;
}

const TrialBalanceReport: React.FC = () => {
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');

  const loadReport = async (asOfDate: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/ovds/reports/trial-balance?asOfDate=${asOfDate}`);
      setData(res.data);
    } catch {
      toast.error('Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = data?.items.filter(item => {
    const matchesSearch = !search || 
      item.code.includes(search) || 
      item.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'all' || 
      (filterType === 'debit' && item.balanceType === 'debit') ||
      (filterType === 'credit' && item.balanceType === 'credit');
    return matchesSearch && matchesFilter;
  }) || [];

  const fmt = (n: number) => fmtCurrencyDecimal(Math.abs(n), 'ETB');

  useEffect(() => {
    loadReport(date);
  }, [date]);

  const printReport = () => window.print();
  const exportCSV = () => {
    // Simplified CSV export
    const csv = [
      ['Code', 'Name', 'Type', 'Debit', 'Credit', 'Balance'],
      ...filteredItems.map(item => [
        item.code,
        item.name,
        `${item.type}/${item.category}`,
        fmt(item.debit),
        fmt(item.credit),
        fmt(item.balance)
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Trial-Balance-${date}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-14 bg-slate-200 rounded-2xl mb-8"></div>
          <div className="ovds-grid-layout cols-4">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center py-24">
        <Database size={72} className="mx-auto mb-6 text-slate-300" />
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">No Trial Balance Data</h2>
        <p className="text-xl text-slate-500 mb-8 max-w-md mx-auto">
          Generate journal entries to populate your general ledger accounts.
        </p>
        <Button size="lg" className="gap-3 font-semibold">
          <FileText size={20} />
          Create First Journal Entry
        </Button>
      </div>
    );
  }

  const isBalanced = Math.abs(data.unbalancedAmount) < 0.01;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 print:max-w-none print:px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200/50 backdrop-blur-sm mb-8 print:mb-4 print:shadow-none">
          <div className="p-8 lg:p-12 print:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-1">
              <div>
                <h1 className="text-4xl lg:text-5xl font-semibold bg-gradient-to-r from-emerald-700 to-emerald-900 dark:from-slate-100 dark:to-emerald-400 bg-clip-text text-transparent mb-4">
                  Trial Balance
                </h1>
                <p className="text-2xl font-bold text-slate-700">
                  As of {format(new Date(data.asOfDate), 'MMMM dd, yyyy')}
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm text-slate-500 bg-white px-4 py-2 rounded-xl">
                  <span>{data.companyName}</span>
                  <span>{data.currency}</span>
                  <Badge variant={isBalanced ? 'emerald' : 'rose'} className="!px-3 !py-1 !text-sm font-bold">
                    {isBalanced ? '✅ Balanced' : `⚠️ Unbalanced by ${fmt(data.unbalancedAmount)}`}
                  </Badge>
                </div>
              </div>

              {/* Date & Filters */}
              <div className="lg:col-span-2 flex flex-col sm:flex-row gap-4 items-start sm:items-end print:flex-col">
                <div className="flex items-center gap-2 bg-slate-100/50 px-4 py-2.5 rounded-2xl border flex-1 max-w-md print:w-full">
                  <Calendar size={18} />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-lg font-mono text-slate-800"
                  />
                </div>
                
                <div className="flex items-center gap-2 flex-wrap print:flex-col print:gap-2 print:w-full">
                  <div className="relative">
                    <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search accounts..."
                      className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 w-56 text-sm"
                    />
                  </div>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm"
                  >
                    <option value="all">All Balances</option>
                    <option value="debit">Debit Balances</option>
                    <option value="credit">Credit Balances</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="flex flex-wrap items-center gap-3 mt-8 pt-8 border-t border-slate-200 print:hidden">
              <Button onClick={printReport} variant="outline" className="gap-2">
                <Printer size={16} />
                Print
              </Button>
              <Button onClick={exportCSV} className="gap-2">
                <Download size={16} />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden print:bg-white print:shadow-none print:border">
          <div className="overflow-x-auto">
            <table className="ovds-table w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 sticky top-0 z-10 print:bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 print:border-slate-300">
                    Account
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 print:border-slate-300">
                    Type / Category
                  </th>
                  <th className="px-12 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 print:border-slate-300">
                    Debit
                  </th>
                  <th className="px-12 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 print:border-slate-300">
                    Credit
                  </th>
                  <th className="px-16 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 print:border-slate-300">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group print:hover:bg-transparent">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-mono font-bold text-slate-700">{item.code.slice(-2)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono font-bold text-slate-900 text-sm">{item.code}</div>
                          <div className="text-sm text-slate-600 truncate max-w-xs">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="outline" size="sm" className="text-xs !px-2.5">
                        {item.type}
                      </Badge>
                      <div className="text-xs text-slate-500 mt-0.5 font-mono">{item.category.replace(/_/g, ' ')}</div>
                    </td>
                    
                    <td className="px-12 py-4 text-right text-sm font-mono text-emerald-700 font-semibold">
                      {fmt(item.debit)}
                    </td>
                    
                    <td className="px-12 py-4 text-right text-sm font-mono text-sky-700 font-semibold">
                      {fmt(item.credit)}
                    </td>
                    
                    <td className="px-16 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Badge 
                          variant={item.balanceType === 'debit' ? 'emerald' : 'sky'} 
                          className="font-mono !px-3 !py-1.5 !text-sm"
                        >
                          {item.balanceType.toUpperCase()}
                        </Badge>
                        <span className="font-semibold text-lg text-slate-900 min-w-[120px] pr-1">
                          {fmt(item.balance)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center text-slate-400">
                      <SearchIcon size={48} className="mx-auto mb-4 opacity-50" />
                      <div className="text-lg font-medium mb-2">No accounts match your filters</div>
                      <div className="text-sm">Try adjusting your search or date range</div>
                    </td>
                  </tr>
                )}
              </tbody>
              
              {/* Totals */}
              <tfoot className="bg-gradient-to-r from-emerald-50/70 to-sky-50/70 border-t-2 border-slate-200 print:bg-white">
                <tr className="font-semibold text-lg">
                  <th className="px-6 py-6 text-right text-emerald-700 bg-transparent" colSpan={2}>
                    Total Debits
                  </th>
                  <td className="px-12 py-6 text-right text-2xl bg-emerald-100 border-l-4 border-emerald-400">
                    {fmt(data.totalDebits)}
                  </td>
                  <td className="px-12 py-6 text-right bg-transparent"></td>
                  <td className="px-16 py-6 bg-transparent"></td>
                </tr>
                <tr className="font-semibold text-lg">
                  <th className="px-6 py-4 text-right text-sky-700 bg-transparent" colSpan={2}>
                    Total Credits
                  </th>
                  <td className="px-12 py-4 bg-transparent"></td>
                  <td className="px-12 py-4 text-right text-2xl bg-sky-100 border-l-4 border-sky-400">
                    {fmt(data.totalCredits)}
                  </td>
                  <td className="px-16 py-4 bg-transparent"></td>
                </tr>
                <tr className={isBalanced ? 'bg-emerald-50 border-t-4 border-emerald-400' : 'bg-rose-50 border-t-4 border-rose-400'}>
                  <th className={`px-6 py-8 text-right font-semibold text-2xl ${isBalanced ? 'text-emerald-900' : 'text-rose-900'}`} colSpan={2}>
                    {isBalanced ? 'Grand Total (Balanced)' : `Difference`}
                  </th>
                  <td className="px-12 py-8 bg-transparent"></td>
                  <td className="px-12 py-8 bg-transparent"></td>
                  <td className={`px-16 py-8 text-right text-3xl font-semibold ${isBalanced ? 'text-emerald-900' : 'text-rose-900'} font-mono min-w-[140px]`}>
                    {fmt(Math.abs(data.unbalancedAmount))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 print:hidden">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 rounded-2xl border border-emerald-200 shadow-xl group hover:shadow-2xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border-2 border-emerald-500/20">
                  <FileText size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-emerald-900 mb-1">Active Accounts</h3>
                  <div className="text-3xl font-semibold text-emerald-700">{filteredItems.length}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-8 rounded-2xl border border-sky-200 shadow-xl group hover:shadow-2xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-sky-500/10 rounded-2xl border-2 border-sky-500/20">
                  <TrendingUp size={24} className="text-sky-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-sky-900 mb-1">Total Debits</h3>
                  <div className="text-3xl font-semibold text-sky-700">{fmt(data.totalDebits)}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl border border-slate-200 shadow-xl group hover:shadow-2xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-slate-500/10 rounded-2xl border-2 border-slate-500/20">
                  <Database size={24} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-slate-900 mb-1">Unbalanced</h3>
                  <div className={`text-3xl font-semibold ${isBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isBalanced ? '✅ 0.00' : fmt(data.unbalancedAmount)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { margin: 0.75in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @media (max-width: 768px) {
          table { font-size: 0.875rem; }
          th, td { padding: 0.75rem 0.5rem !important; }
        }
      `}</style>
    </div>
  );
};

export default TrialBalanceReport;










