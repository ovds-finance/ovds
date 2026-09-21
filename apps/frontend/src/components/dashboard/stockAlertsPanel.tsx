/**
 * StockAlertsPanel — unified stock alerts display with notify action.
 *
 * Shows low-stock and out-of-stock items with severity badges,
 * and allows sending notifications to ovds users.
 */
import { Btn } from '@ovds/ui';
import { AlertTriangle, AlertCircle, Bell, BellOff, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../../context/businessContext';
import { useAllAlerts, useAlertNotifications } from '../../services/inventoryApi';
import { fmtCurrency } from '../../utils/fmt';

type SeverityFilter = 'ALL' | 'LOW' | 'OUT';

const StockAlertsPanel: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const { data: alerts, loading, refetch } = useAllAlerts(selectedCompanyId ?? undefined);
  const { notify } = useAlertNotifications();
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<SeverityFilter>('ALL');

  const totalAlerts = alerts?.total ?? 0;
  const criticalCount = alerts?.critical ?? 0;
  const warningCount = alerts?.warning ?? 0;

  const filteredLow = filter === 'ALL' || filter === 'LOW' ? alerts?.lowStock ?? [] : [];
  const filteredOut = filter === 'ALL' || filter === 'OUT' ? alerts?.outOfStock ?? [] : [];

  const handleNotify = async (severity: SeverityFilter) => {
    if (!selectedCompanyId) return;
    setSending(true);
    try {
      const result = await notify({ companyId: selectedCompanyId, severity });
      if ((result as any)?.sent > 0) {
        toast.success(`Sent ${(result as any).sent} notification(s) for ${(result as any).alertCount} alerts`);
      } else {
        toast.success((result as any)?.message ?? 'No alerts to notify');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to send notifications');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="ovds-panel p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="ovds-panel overflow-hidden">
      <div className="ovds-widget-header">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-amber-500" />
          <p className="ovds-card-title">Stock Alerts</p>
          {totalAlerts > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600">
              {totalAlerts} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="xs" icon={<RefreshCw size={10} />} onClick={refetch}>Refresh</Btn>
          {totalAlerts > 0 && (
            <>
              <Btn variant="secondary" size="xs" icon={<Bell size={10} />} onClick={() => handleNotify('ALL')} loading={sending}>
                Notify All
              </Btn>
            </>
          )}
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-700">
        <button onClick={() => setFilter('ALL')} className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${filter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          All ({totalAlerts})
        </button>
        <button onClick={() => setFilter('OUT')} className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${filter === 'OUT' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}>
          <AlertCircle size={11} /> Out of Stock ({criticalCount})
        </button>
        <button onClick={() => setFilter('LOW')} className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${filter === 'LOW' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
          <AlertTriangle size={11} /> Low Stock ({warningCount})
        </button>
      </div>

      {totalAlerts === 0 ? (
        <div className="py-8 text-center">
          <BellOff size={28} className="mx-auto text-[var(--pro-azure-light)] mb-2" />
          <p className="text-sm font-semibold text-[var(--pro-azure-dark)]">All stock levels are healthy</p>
          <p className="text-xs text-slate-400 mt-1">No low-stock or out-of-stock items detected.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                {['Severity', 'Item', 'Code', 'Current', 'Min Level', 'Shortage', 'Warehouse', 'Est. Cost'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredOut.map((a: any) => (
                <tr key={`out-${a.itemId}`} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/10">
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600">CRITICAL</span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{a.itemName}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-400">{a.itemCode}</td>
                  <td className="px-4 py-2.5 tabular-nums font-bold text-rose-600">{a.currentStock}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-500">{a.reorderLevel}</td>
                  <td className="px-4 py-2.5 tabular-nums font-bold text-rose-600">+{a.shortageQty}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.warehouseName}</td>
                  <td className="px-4 py-2.5 tabular-nums font-bold text-slate-800">{fmtCurrency(a.estimatedReorderCost)}</td>
                </tr>
              ))}
              {filteredLow.map((a: any) => (
                <tr key={`low-${a.itemId}`} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/10">
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600">WARNING</span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{a.itemName}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-400">{a.itemCode}</td>
                  <td className="px-4 py-2.5 tabular-nums font-bold text-amber-600">{a.currentStock}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-500">{a.reorderLevel}</td>
                  <td className="px-4 py-2.5 tabular-nums font-bold text-amber-600">+{a.shortageQty}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.warehouseName}</td>
                  <td className="px-4 py-2.5 tabular-nums font-bold text-slate-800">{fmtCurrency(a.estimatedReorderCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockAlertsPanel;
