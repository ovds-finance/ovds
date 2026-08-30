import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, CheckCircle2, ChevronDown, ChevronUp,
  Calendar, DollarSign, FileText, AlertTriangle,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import {
  AppPage, Btn, MetricCard, Skeleton, cn,
} from '../components/ui';
import {
  useRevenueRecognition,
} from '@ovds/features/sales';

interface ScheduleRow {
  period: string;
  scheduled: number;
  recognised: number;
  deferred: number;
  status: string;
}

interface Obligation {
  id: string;
  description: string;
  satisfactionBasis: string;
  status: string;
  schedule: ScheduleRow[];
}

interface Contract {
  id: string;
  contractRef: string;
  transactionPrice: number;
  obligations: Obligation[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2 }).format(n);

const RevenueRecognition: React.FC = () => {
  usePageTitle('Revenue Recognition');
  const { selectedCompanyId } = useBusiness();
  const navigate = useNavigate();

  const { data, loading, refetch } = useRevenueRecognition(selectedCompanyId);

  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  const totalDeferred = data?.totalDeferred ?? 0;
  const totalRecognized = data?.contracts.reduce((sum, c) => {
    return sum + c.obligations.reduce((obSum, ob) => {
      return obSum + ob.schedule.reduce((s, row) => s + row.recognised, 0);
    }, 0);
  }, 0) ?? 0;

  const obligationStatusColor = (status: string) => {
    switch (status) {
      case 'SATISFIED': return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800';
      case 'PARTIALLY_SATISFIED': return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800';
      case 'NOT_SATISFIED': return 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
      default: return 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
    }
  };

  return (
    <AppPage
      title="Revenue Recognition"
      subtitle="IFRS 15 contract performance obligations and deferred revenue schedules"
      icon={<DollarSign size={18} />}
      iconBg="bg-emerald-600"
      actions={
        <div className="flex items-center gap-2">
          <Btn variant="ghost" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" icon={<FileText size={12} />} onClick={() => navigate('/sales/invoices')}>
            View Invoices
          </Btn>
        </div>
      }
    >
      {/* KPI Strip */}
      {loading ? (
        <Skeleton.StatsRow count={3} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          <MetricCard title="Total Deferred" amount={fmt(totalDeferred)} percentage={0} isPositive={false} variant="highlight-amber" />
          <MetricCard title="Total Recognized" amount={fmt(totalRecognized)} percentage={0} isPositive={true} variant="highlight-emerald" />
          <MetricCard title="Contracts" amount={(data?.contracts?.length ?? 0).toString()} percentage={0} isPositive={true} variant="highlight-blue" />
        </div>
      )}

      {/* Contracts List */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.contracts?.length ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-10 text-center">
            <FileText size={40} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">No revenue recognition contracts</p>
            <p className="text-xs text-slate-400 mt-1">Contracts will appear here when invoices are created with IFRS 15 obligations.</p>
          </div>
        ) : (
          data.contracts.map((contract: Contract) => {
            const isExpanded = expandedContract === contract.id;
            const contractDeferred = contract.obligations.reduce((sum, ob) => {
              return sum + ob.schedule.reduce((s, row) => s + row.deferred, 0);
            }, 0);
            const contractRecognized = contract.obligations.reduce((sum, ob) => {
              return sum + ob.schedule.reduce((s, row) => s + row.recognised, 0);
            }, 0);

            return (
              <div key={contract.id} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Contract Header */}
                <div
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  onClick={() => setExpandedContract(isExpanded ? null : contract.id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{contract.contractRef}</p>
                    <p className="text-[11px] text-slate-500">{contract.obligations.length} obligation{contract.obligations.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">{fmt(contract.transactionPrice)}</p>
                    <p className="text-[10px] text-slate-400">Transaction Price</p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">{fmt(contractDeferred)}</p>
                    <p className="text-[10px] text-slate-400">Deferred</p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmt(contractRecognized)}</p>
                    <p className="text-[10px] text-slate-400">Recognized</p>
                  </div>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all shrink-0">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Obligations Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    {contract.obligations.map((ob: Obligation) => (
                      <div key={ob.id} className="px-5 py-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{ob.description}</p>
                            <p className="text-[10px] text-slate-400">{ob.satisfactionBasis}</p>
                          </div>
                          <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ring-1', obligationStatusColor(ob.status))}>
                            {ob.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Schedule Table */}
                        {ob.schedule.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700">
                                  <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                                  <th className="px-3 py-2 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Scheduled</th>
                                  <th className="px-3 py-2 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Recognized</th>
                                  <th className="px-3 py-2 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Deferred</th>
                                  <th className="px-3 py-2 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {ob.schedule.map((row: ScheduleRow, rowIdx: number) => (
                                  <tr key={rowIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-3 py-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                                      <div className="flex items-center gap-1.5">
                                        <Calendar size={10} className="text-slate-400" />
                                        {row.period}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-right text-[11px] font-mono text-slate-700 dark:text-slate-300">{fmt(row.scheduled)}</td>
                                    <td className="px-3 py-2 text-right text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{fmt(row.recognised)}</td>
                                    <td className="px-3 py-2 text-right text-[11px] font-mono text-amber-600 dark:text-amber-400">{fmt(row.deferred)}</td>
                                    <td className="px-3 py-2 text-center">
                                      <span className={cn(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ring-1',
                                        row.status === 'RECOGNISED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800' :
                                        row.status === 'DEFERRED' ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800' :
                                        'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                                      )}>
                                        {row.status === 'RECOGNISED' && <CheckCircle2 size={8} />}
                                        {row.status === 'DEFERRED' && <AlertTriangle size={8} />}
                                        {row.status.replace(/_/g, ' ')}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </AppPage>
  );
};

export default RevenueRecognition;
