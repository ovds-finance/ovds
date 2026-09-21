import { fmtNum } from '@ovds/ui';
import { Package, ArrowUpRight, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { useBusiness } from '../../context/businessContext';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuth } from '../../rbac/AuthContext';


interface Props {
  currency?: string;
}

const InventoryWidget: React.FC<Props> = ({ currency = 'ETB' }) => {
  const { selectedCompanyId } = useBusiness();
  const { can } = useAuth();

  const { data: stats, loading: loadingStats } = useApiQuery<any>(
    `/ovds/inventory/stats${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!selectedCompanyId && can('inventory:read'), staleTime: 60_000, suppressToast: true }
  );

  const { data: lowStock, loading: loadingLow } = useApiQuery<any[]>(
    `/ovds/inventory/alerts/low-stock${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!selectedCompanyId && can('inventory:read'), staleTime: 60_000, suppressToast: true }
  );

  const { data: outOfStock, loading: loadingOut } = useApiQuery<any[]>(
    `/ovds/inventory/alerts/out-of-stock${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!selectedCompanyId && can('inventory:read'), staleTime: 60_000, suppressToast: true }
  );

  const totalItems = stats?.totalItems ?? stats?.total ?? 0;
  const lowStockCount = lowStock?.length ?? stats?.lowStockCount ?? 0;
  const outOfStockCount = outOfStock?.length ?? stats?.outOfStockCount ?? 0;
  const categories = stats?.categoryCount ?? 0;

  const criticalCount = outOfStockCount + lowStockCount;

  return (
    <div className="ovds-widget-card">
      <div className="ovds-widget-header">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center">
            <Package size={14} className="text-amber-600" />
          </div>
          <div>
            <h3 className="ovds-card-title">Inventory Summary</h3>
            <p className="ovds-caption">Real-time stock levels</p>
          </div>
        </div>
        <Link to="/inventory" className="flex items-center gap-1 text-[11px] font-semibold text-[var(--pro-azure)] hover:underline">
          Manage <ArrowUpRight size={11} />
        </Link>
      </div>
      <div className="ovds-widget-body">
        {loadingStats || loadingLow || loadingOut ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl bg-white">
                <div className="h-2.5 w-16 bg-slate-200 rounded ovds-shimmer mb-2" />
                <div className="h-5 w-10 bg-slate-200 rounded ovds-shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]">
                <p className="text-[10px] text-[var(--pro-azure)] uppercase tracking-wider mb-1">Total Items</p>
                <p className="text-[22px] font-extrabold text-[var(--pro-azure-dark)] tabular-nums">{fmtNum(totalItems)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Categories</p>
                <p className="text-[22px] font-extrabold text-slate-700 tabular-nums">{fmtNum(categories)}</p>
              </div>
            </div>

            {criticalCount > 0 && (
              <div className="space-y-2">
                {outOfStockCount > 0 && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                    <AlertTriangle size={13} className="text-rose-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-rose-700">Out of Stock</p>
                      <p className="text-[10px] text-rose-600">{outOfStockCount} item{outOfStockCount !== 1 ? 's' : ''} need immediate restocking</p>
                    </div>
                    <span className="text-[13px] font-bold text-rose-600 tabular-nums shrink-0">{outOfStockCount}</span>
                  </div>
                )}
                {lowStockCount > 0 && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                    <TrendingDown size={13} className="text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-amber-700">Low Stock</p>
                      <p className="text-[10px] text-amber-600">{lowStockCount} item{lowStockCount !== 1 ? 's' : ''} below reorder point</p>
                    </div>
                    <span className="text-[13px] font-bold text-amber-600 tabular-nums shrink-0">{lowStockCount}</span>
                  </div>
                )}
              </div>
            )}

            {criticalCount === 0 && totalItems > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]">
                <TrendingUp size={13} className="text-[var(--pro-azure)] shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-[var(--pro-azure-dark)]">All Stock Levels Healthy</p>
                  <p className="text-[10px] text-[var(--pro-azure)]">No items below reorder thresholds</p>
                </div>
              </div>
            )}

          {(lowStock?.length ?? 0) > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Top Alerts</p>
              <div className="space-y-1.5">
                {(lowStock ?? []).slice(0, 3).map((a: any) => (
                    <div key={a.itemId} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 truncate flex-1">{a.itemName}</span>
                      <span className="text-slate-400 tabular-nums">{a.currentStock}/{a.reorderLevel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InventoryWidget;
