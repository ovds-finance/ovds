import React, { useState, useEffect } from 'react';
import { AppPage, AppKpi, Btn } from '@ovds/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Receipt,
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Filter,
} from 'lucide-react';

interface TaxSummaryRow {
  taxRateId: string;
  taxName: string;
  calculationType: string;
  outputTax: number;
  inputTax: number;
  netPosition: number;
  transactionCount: number;
}

interface TaxSummaryResponse {
  period: string;
  companyId: string;
  generatedAt: string;
  summary: {
    totalOutputTax: number;
    totalInputTax: number;
    netPayable: number;
    netRefundable: number;
    totalTransactions: number;
    currency: string;
  };
  byTaxRate: TaxSummaryRow[];
  byDocumentType: {
    invoices: { count: number; outputTax: number };
    bills: { count: number; inputTax: number };
  };
}

const fmtETB = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const TaxSummaryPage: React.FC = () => {
  usePageTitle('Tax Summary');
  const { selectedCompanyId: companyId } = useBusiness();
  const { is: hasRole } = useAuth();

  const today = new Date();
  const [period, setPeriod] = useState(() => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TaxSummaryResponse | null>(null);

  const canView = hasRole('OVDS', 'ACCOUNTING', 'AUDITOR', 'ADMIN');

  useEffect(() => {
    if (companyId && period) {
      fetchSummary();
    }
  }, [companyId, period]);

  const fetchSummary = async () => {
    if (!companyId || !period) return;
    setLoading(true);
    try {
      const res = await api.get(`/tax/summary?companyId=${companyId}&period=${period}`);
      setData(res.data?.data ?? res.data);
      toast.success('Tax summary loaded');
    } catch {
      toast.error('Failed to load tax summary');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const csv = [
      ['Tax Rate', 'Calculation Type', 'Output Tax (ETB)', 'Input Tax (ETB)', 'Net Position (ETB)', 'Transactions'].join(','),
      ...data.byTaxRate.map((r) =>
        [r.taxName, r.calculationType, r.outputTax, r.inputTax, r.netPosition, r.transactionCount].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-summary-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const netPositionColor = (val: number) => {
    if (val > 0) return 'text-rose-600 dark:text-rose-400';
    if (val < 0) return 'text-emerald-600 dark:text-emerald-400';
    return 'text-slate-500';
  };

  return (
    <AppPage
      title="Tax Summary"
      subtitle="Output vs Input tax across invoices and bills"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200"
            />
          </div>
          <Btn variant="outline" onClick={fetchSummary} loading={loading}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Btn>
          {data && (
            <Btn variant="outline" onClick={handleExport}>
              <Download size={16} className="mr-2" />
              Export CSV
            </Btn>
          )}
        </div>
      }
    >
      {!canView && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            You need Accounting, Auditor, or Admin role to view tax summaries.
          </p>
        </div>
      )}

      {!data ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Receipt size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">No tax summary loaded</p>
          <p className="text-sm mt-1">Select a period and click Refresh to generate the report.</p>
        </div>
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <AppKpi
              title="Output Tax"
              value={fmtETB(data.summary.totalOutputTax)}
              icon={<TrendingUp className="text-emerald-500" size={20} />}
              trend="From invoices"
            />
            <AppKpi
              title="Input Tax"
              value={fmtETB(data.summary.totalInputTax)}
              icon={<TrendingDown className="text-blue-500" size={20} />}
              trend="From bills"
            />
            <AppKpi
              title="Net Payable"
              value={fmtETB(data.summary.netPayable)}
              icon={<ArrowLeftRight className="text-violet-500" size={20} />}
              trend={data.summary.netPayable > 0 ? 'Owe MoR' : 'Credit due'}
            />
            <AppKpi
              title="Transactions"
              value={String(data.summary.totalTransactions)}
              icon={<Filter className="text-amber-500" size={20} />}
              trend={`${data.byDocumentType.invoices.count} invoices / ${data.byDocumentType.bills.count} bills`}
            />
          </div>

          {/* Breakdown by Tax Rate */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Breakdown by Tax Rate
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tax Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Calc Type</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Output Tax</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Input Tax</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Net Position</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.byTaxRate.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        No tax transactions found for this period.
                      </td>
                    </tr>
                  ) : (
                    data.byTaxRate.map((row) => (
                      <tr key={row.taxRateId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {row.taxName}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {row.calculationType}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-right font-mono text-emerald-700 dark:text-emerald-400">
                          {fmtETB(row.outputTax)}
                        </td>
                        <td className="px-6 py-3 text-sm text-right font-mono text-blue-700 dark:text-blue-400">
                          {fmtETB(row.inputTax)}
                        </td>
                        <td className={`px-6 py-3 text-sm text-right font-mono font-medium ${netPositionColor(row.netPosition)}`}>
                          {fmtETB(row.netPosition)}
                        </td>
                        <td className="px-6 py-3 text-sm text-right text-slate-500">
                          {row.transactionCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Type Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-4">
                Invoices (Output Tax)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Count</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{data.byDocumentType.invoices.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Output Tax</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">{fmtETB(data.byDocumentType.invoices.outputTax)}</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-4">
                Bills (Input Tax)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Count</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{data.byDocumentType.bills.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Input Tax</span>
                  <span className="font-mono text-blue-700 dark:text-blue-400">{fmtETB(data.byDocumentType.bills.inputTax)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppPage>
  );
};

export default TaxSummaryPage;
