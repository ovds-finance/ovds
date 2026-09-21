import {
  Download, RefreshCw, ChevronDown, ChevronRight,
  Clock, AlertTriangle, FileText, DollarSign,
  TrendingUp, CheckCircle2,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { OvdsPageHeader, OvdsStatsStrip } from '../components/ovds';
import { useBusiness } from '../context/businessContext';
import { useApiQuery } from '../hooks';
import { usePageTitle } from '../hooks/usePageTitle';
import { downloadCSV } from '../utils/download';
import { fmtCurrency } from '../utils/fmt';

const fmt = (n: number) => fmtCurrency(n, 'ETB');

const BUCKET_LABELS: Record<string, { label: string; color: string }> = {
  current: { label: 'Current', color: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' },
  days30: { label: '1–30 Days', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  days60: { label: '31–60 Days', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  days90: { label: '61+ Days', color: 'text-rose-600 bg-rose-50 border-rose-200' },
};

const AgedPayables: React.FC = () => {
  usePageTitle('Aged Payables');
  const { selectedCompanyId } = useBusiness();
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

  const url = selectedCompanyId ? `/ovds/purchases/aged-payables?companyId=${selectedCompanyId}` : '/ovds/purchases/aged-payables';

  const {
    data: apData,
    loading,
    refetch: fetchAp,
  } = useApiQuery<any>(url, {
    enabled: !!selectedCompanyId,
    pollInterval: 120_000,
  });

  const data = apData?.data ?? apData;
  const summary = data?.summary ?? {};
  const byVendor = data?.byVendor ?? [];

  const toggleVendor = (vid: string) => {
    setExpandedVendors((prev) => {
      const next = new Set(prev);
      if (next.has(vid)) next.delete(vid);
      else next.add(vid);
      return next;
    });
  };

  const handleExport = () => {
    if (!byVendor.length) return;
    const headers = 'Vendor,Current,1-30 Days,31-60 Days,61+ Days,Total,Bills\n';
    const rows = byVendor.map((v: any) => {
      const b = v.buckets ?? {};
      const billRefs = v.bills?.map((b: any) => b.billNumber).join('; ') ?? '';
      return `"${v.vendorName}",${b.current ?? 0},${b.days30 ?? 0},${b.days60 ?? 0},${b.days90 ?? 0},${v.total ?? 0},"${billRefs}"`;
    }).join('\n');
    downloadCSV(headers + rows, `aged_payables_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Aged payables exported');
  };

  return (
    <div className="min-h-full bg-white animate-in fade-in duration-300">
      <OvdsPageHeader
        title="Aged Payables"
        subtitle="Outstanding supplier debts by age · Accounts Payable"
        icon={<Clock size={16} />}
        iconBg="bg-orange-500"
        onRefresh={fetchAp}
        loading={loading}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Download size={13} /> Export
            </button>
          </div>
        }
      />

      <div className="p-4 sm:p-5 space-y-4">
        <OvdsStatsStrip
          loading={loading}
          stats={[
            {
              label: 'Current',
              tooltip: 'Bills not yet due',
              value: fmt(summary.current ?? 0),
              sub: `${byVendor.reduce((s: number, v: any) => s + (v.buckets?.count ?? 0), 0)} bills`,
              icon: <Clock size={15} />,
              iconBg: 'bg-[var(--pro-azure-50)]',
              iconColor: 'text-[var(--pro-azure)]',
            },
            {
              label: '1–30 Days',
              tooltip: 'Overdue 1-30 days',
              value: fmt(summary.days30 ?? 0),
              sub: 'Mild urgency',
              icon: <AlertTriangle size={15} />,
              iconBg: 'bg-amber-50',
              iconColor: 'text-amber-600',
            },
            {
              label: '31–60 Days',
              tooltip: 'Overdue 31-60 days',
              value: fmt(summary.days60 ?? 0),
              sub: 'Follow up',
              icon: <TrendingUp size={15} />,
              iconBg: 'bg-orange-50',
              iconColor: 'text-orange-600',
            },
            {
              label: '61+ Days',
              tooltip: 'Seriously overdue',
              value: fmt(summary.days90 ?? 0),
              sub: 'Urgent',
              icon: <AlertTriangle size={15} />,
              iconBg: 'bg-rose-50',
              iconColor: 'text-rose-600',
            },
            {
              label: 'Total Outstanding',
              tooltip: 'Total accounts payable',
              value: fmt(summary.total ?? 0),
              sub: `${summary.count ?? 0} bills`,
              icon: <DollarSign size={15} />,
              iconBg: 'bg-violet-50',
              iconColor: 'text-violet-600',
            },
          ]}
        />

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">Outstanding by Vendor</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-[200px]">
              <RefreshCw size={20} className="animate-spin text-slate-300" />
            </div>
          ) : byVendor.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 size={32} className="text-green-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No outstanding payables</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {byVendor.map((vendor: any) => {
                const isExpanded = expandedVendors.has(vendor.vendorId);
                const b = vendor.buckets ?? {};
                return (
                  <div key={vendor.vendorId} className="hover:bg-slate-50 transition-colors">
                    <button
                      onClick={() => toggleVendor(vendor.vendorId)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{vendor.vendorName}</p>
                        <p className="text-[10px] text-slate-400">{b.count ?? 0} bills outstanding</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 tabular-nums">{fmt(vendor.total)}</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-3 pl-14">
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {Object.entries(BUCKET_LABELS).map(([key, { label, color }]) => (
                            <div key={key} className={`rounded-lg px-2 py-1.5 border ${color}`}>
                              <p className="text-[9px] font-bold uppercase">{label}</p>
                              <p className="text-xs font-bold">{fmt(b[key] ?? 0)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {vendor.bills?.map((bill: any) => (
                            <div key={bill.id} className="flex items-center justify-between py-1.5 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <FileText size={12} className="text-slate-300" />
                                <Link to={`/purchases/bills/${bill.id}`} className="text-xs font-mono text-slate-700 hover:text-[var(--pro-azure)] transition-colors">
                                  {bill.billNumber}
                                </Link>
                                <span className="text-[10px] text-slate-400">{bill.category}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${bill.daysOverdue > 60 ? 'bg-rose-50 text-rose-700' : bill.daysOverdue > 30 ? 'bg-orange-50 text-orange-700' : bill.daysOverdue > 0 ? 'bg-amber-50 text-amber-700' : 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]'}`}>
                                  {bill.daysOverdue > 0 ? `${bill.daysOverdue}d overdue` : 'Current'}
                                </span>
                                <span className="text-xs font-bold text-slate-800 tabular-nums w-20 text-right">{fmt(bill.remaining)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgedPayables;
