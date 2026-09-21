/**
 * InventoryDashboard — advanced inventory analytics dashboard
 * with charts, aging analysis, reorder suggestions, and movement tracking.
 */
import { AppPage, Btn } from '@ovds/ui';
import { 
  Package, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight,
  Activity, BarChart3, PieChart, LineChart as LineChartIcon,
  RefreshCw, Download, Filter
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  useLowStockAlerts,
  useOutOfStockAlerts,
  useInventoryValuation,
  useInventorySummary,
  useProductSalesPerformance,
  useInventoryAging,
  useReorderSuggestions,
  useStockMovements,
  useBatchAdjust,
  useDemandForecast,
  useSupplierPerformance,
} from '../services/inventoryApi';
import { fmtCurrency, fmtDate } from '../utils/fmt';

type Tab = 'OVERVIEW' | 'AGING' | 'MOVEMENTS' | 'REORDER' | 'FORECAST' | 'SUPPLIERS';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#06b6d4', '#f97316', '#ec4899'];

const InventoryDashboard: React.FC = () => {
  usePageTitle('Inventory Dashboard');
  const { selectedCompanyId } = useBusiness();
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');

  const { data: valuation } = useInventoryValuation('WA');
  const { alerts: lowStock } = useLowStockAlerts();
  const { alerts: outOfStock } = useOutOfStockAlerts();
  const { data: summary } = useInventorySummary({ companyId: selectedCompanyId ?? undefined });
  const { data: salesPerf } = useProductSalesPerformance({ companyId: selectedCompanyId ?? undefined });
  const { data: aging } = useInventoryAging(selectedCompanyId ?? undefined);
  const { data: reorderSuggestions } = useReorderSuggestions(selectedCompanyId ?? undefined);
  const { data: movements } = useStockMovements({ companyId: selectedCompanyId ?? undefined, limit: 20 });
  const { data: forecast } = useDemandForecast(selectedCompanyId ?? undefined);
  const { data: suppliers } = useSupplierPerformance(selectedCompanyId ?? undefined);

  const criticalCount = (outOfStock?.length ?? 0) + (lowStock?.length ?? 0);
  const totalStockValue = valuation?.totalValue ?? 0;
  const totalItems = valuation?.items?.length ?? 0;

  const agingData = useMemo(() => {
    if (!aging) return [];
    const buckets: Record<string, number> = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    aging.forEach(a => { buckets[a.agingBucket] += a.totalValue; });
    return Object.entries(buckets).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [aging]);

  const _categoryData = useMemo(() => {
    if (!salesPerf?.length) return [];
    return salesPerf.slice(0, 8).map(p => ({
      name: p.itemName.length > 15 ? p.itemName.slice(0, 15) + '…' : p.itemName,
      revenue: Math.round(p.totalRevenue * 100) / 100,
      profit: Math.round(p.grossProfit * 100) / 100,
      margin: p.marginPct,
    }));
  }, [salesPerf]);

  return (
    <AppPage
      title="Inventory Dashboard"
      subtitle="Real-time analytics · Supply Chain · Manufacturing & Logistics · Retail & E-commerce"
      icon={<Package size={18} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      crumbs={[{ label: 'Inventory Dashboard' }]}
      actions={
        <div className="flex gap-2">
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />}>Export</Btn>
        </div>
      }
    >

      {/* KPI Cards */}
      <div className="ovds-grid-layout cols-4 gap-lg mb-8">
        <KPICard label="Total Stock Value" value={fmtCurrency(totalStockValue)} trend={2.4} icon={<BarChart3 size={22} />} accent="bg-[var(--pro-azure-50)]0" />
        <KPICard label="Active Items" value={totalItems.toString()} trend={1.2} icon={<Package size={22} />} accent="bg-sky-500" />
        <KPICard label="Critical Alerts" value={criticalCount.toString()} trend={-5.1} icon={<AlertTriangle size={22} />} accent={criticalCount > 0 ? 'bg-rose-500' : 'bg-[var(--pro-azure-50)]0'} invertTrend />
        <KPICard label="Total Revenue" value={fmtCurrency(salesPerf?.reduce((s, p) => s + p.totalRevenue, 0) ?? 0)} trend={8.3} icon={<TrendingUp size={22} />} accent="bg-violet-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl w-fit shadow-sm mb-6">
        {[
          { id: 'OVERVIEW' as Tab, label: 'Overview', icon: <BarChart3 size={15}/> },
          { id: 'AGING' as Tab, label: 'Aging', icon: <LineChartIcon size={15}/> },
          { id: 'MOVEMENTS' as Tab, label: 'Movements', icon: <Activity size={15}/> },
          { id: 'REORDER' as Tab, label: 'Reorder', icon: <AlertTriangle size={15}/> },
          { id: 'FORECAST' as Tab, label: 'Forecast', icon: <TrendingUp size={15}/> },
          { id: 'SUPPLIERS' as Tab, label: 'Suppliers', icon: <Package size={15}/> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={[
            'flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wide transition-all duration-150',
            activeTab === t.id ? 'bg-white dark:bg-slate-900 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50',
          ].join(' ')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'OVERVIEW' && <OverviewTab valuation={valuation} salesPerf={salesPerf ?? []} summary={summary} />}
        {activeTab === 'AGING' && <AgingTab aging={aging ?? []} agingData={agingData ?? []} />}
        {activeTab === 'MOVEMENTS' && <MovementsTab movements={movements ?? []} />}
        {activeTab === 'REORDER' && <ReorderTab suggestions={reorderSuggestions ?? []} />}
        {activeTab === 'FORECAST' && <ForecastTab forecast={forecast ?? []} />}
        {activeTab === 'SUPPLIERS' && <SuppliersTab suppliers={suppliers ?? []} />}
      </div>
    </AppPage>
  );
};

// -- KPI Card ---------------------------------------------------------------
const KPICard: React.FC<{ label: string; value: string; trend?: number; icon: React.ReactNode; accent: string; invertTrend?: boolean }> = ({ label, value, trend, icon, accent, invertTrend }) => (
  <div className="ovds-panel p-5 relative overflow-hidden group">
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: '14px 14px 0 0' }}/>
    <div style={{ position: 'absolute', inset: 0, borderRadius: 14, opacity: 0, background: `${accent}08`, transition: 'opacity .2s', pointerEvents: 'none' }} className="group-hover:opacity-100"/>
    <div className="flex items-start justify-between mb-4 relative">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white`} style={{ background: accent, boxShadow: `0 4px 12px ${accent}40` }}>
        {icon}
      </div>
      {trend !== undefined && (
        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${(invertTrend ? trend < 0 : trend >= 0) ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' : 'bg-rose-50 text-rose-600'}`}>
          {(invertTrend ? trend < 0 : trend >= 0) ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-[26px] font-black text-slate-800 dark:text-slate-100 tabular-nums leading-none">{value}</p>
  </div>
);

// -- Overview Tab -----------------------------------------------------------
const OverviewTab: React.FC<{ valuation: any; salesPerf: any[]; summary: any }> = ({ valuation, salesPerf, summary }) => (
  <div className="space-y-6">
    <div className="ovds-grid-layout cols-2 gap-lg">
      <div className="ovds-panel p-5">
        <p className="ovds-card-title mb-4">Stock Valuation Breakdown</p>
        {valuation?.items?.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No valuation data available.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {valuation?.items?.slice(0, 15).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 truncate">{item.itemName}</p>
                  <p className="text-[10px] text-slate-400">{item.itemCode} · {item.currentQty} units</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-[13px] font-black text-[var(--pro-azure)] tabular-nums">{fmtCurrency(item.currentValue)}</p>
                  <p className="text-[10px] text-slate-400">{fmtCurrency(item.unitCost)}/unit</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ovds-panel p-5">
        <p className="ovds-card-title mb-4">Sales Performance (Top Items)</p>
        {salesPerf?.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No sales data for this period.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {salesPerf?.slice(0, 10).map((p: any) => (
              <div key={p.itemId} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 truncate">{p.itemName}</p>
                  <p className="text-[10px] text-slate-400">{p.unit} · {p.transactionCount} txns</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-[13px] font-black text-[var(--pro-azure)] tabular-nums">{fmtCurrency(p.totalRevenue)}</p>
                  <p className={`text-[10px] font-bold ${p.marginPct >= 30 ? 'text-[var(--pro-azure)]' : p.marginPct >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {p.marginPct}% margin
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {summary?.items?.length > 0 && (
      <div className="ovds-panel p-5">
        <p className="ovds-card-title mb-4">Inventory Movement Summary</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={summary.items.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="itemCode" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value: any) => [value, '']} />
            <Legend />
            <Bar dataKey="receivedQty" name="Received" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="soldQty" name="Sold" fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="adjustedQty" name="Adjusted" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

// -- Aging Tab ---------------------------------------------------------------
const AgingTab: React.FC<{ aging: any[]; agingData: any[] }> = ({ aging, agingData }) => (
  <div className="space-y-6">
    <div className="ovds-grid-layout cols-2 gap-lg">
      <div className="ovds-panel p-5">
        <p className="ovds-card-title mb-4">Aging Distribution (Value)</p>
        {agingData.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No aging data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <RechartsPie>
              <Pie data={agingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? 'Unknown'}: ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {agingData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [fmtCurrency(value), 'Value']} />
            </RechartsPie>
          </ResponsiveContainer>
        )}
      </div>

      <div className="ovds-panel p-5">
        <p className="ovds-card-title mb-2">Aging Summary</p>
        <div className="space-y-3 mt-4">
          {agingData.map((b, i) => (
            <div key={b.name} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{b.name} days</span>
              </div>
              <span className="text-[13px] font-black text-slate-800 tabular-nums">{fmtCurrency(b.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="ovds-panel overflow-hidden">
      <div className="ovds-widget-header">
        <p className="ovds-card-title">Inventory Aging Detail</p>
        <span className="text-[10px] text-slate-400">{aging?.length} items in stock</span>
      </div>
      {!aging?.length ? (
        <div className="py-10 text-center text-slate-400 text-sm">No aging data available.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                {['Item', 'Code', 'Warehouse', 'Stock', 'Oldest Receipt', 'Days', 'Bucket', 'Value'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {aging?.map((a) => (
                <tr key={a.itemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{a.itemName}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-400">{a.itemCode}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.warehouseName}</td>
                  <td className="px-4 py-2.5 tabular-nums font-bold">{a.currentStock}</td>
                  <td className="px-4 py-2.5 text-slate-500">{a.oldestReceiptDate ?? '—'}</td>
                  <td className="px-4 py-2.5 tabular-nums font-bold">{a.daysInStock}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      a.agingBucket === '90+' ? 'bg-rose-50 text-rose-600' :
                      a.agingBucket === '61-90' ? 'bg-amber-50 text-amber-600' :
                      a.agingBucket === '31-60' ? 'bg-sky-50 text-sky-600' :
                      'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]'
                    }`}>{a.agingBucket}</span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums font-bold text-slate-800">{fmtCurrency(a.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

// -- Movements Tab -----------------------------------------------------------
const MovementsTab: React.FC<{ movements: any }> = ({ movements }) => (
  <div className="ovds-panel overflow-hidden">
    <div className="ovds-widget-header">
      <p className="ovds-card-title">Recent Stock Movements</p>
      <span className="text-[10px] text-slate-400">{movements?.total ?? 0} records</span>
    </div>
    {!movements?.data?.length ? (
      <div className="py-10 text-center text-slate-400 text-sm">No stock movements recorded yet.</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              {['Date', 'Type', 'Qty', 'Unit Cost', 'Reference', 'From', 'To'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {movements?.data?.map((m: any) => (
              <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-2.5 text-slate-600">{fmtDate(m.createdAt)}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    m.type === 'IN' || m.type === 'PURCHASE' ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' :
                    m.type === 'OUT' || m.type === 'SALE' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>{m.type}</span>
                </td>
                <td className="px-4 py-2.5 tabular-nums font-bold">{m.quantity}</td>
                <td className="px-4 py-2.5 tabular-nums text-slate-600">{fmtCurrency(m.unitCost)}</td>
                <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate">{m.reference ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-500">{m.warehouseFrom ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-500">{m.warehouseTo ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// -- Reorder Tab -------------------------------------------------------------
const ReorderTab: React.FC<{ suggestions: any[] }> = ({ suggestions }) => {
  const { adjust } = useBatchAdjust();

  const handleReorder = async (itemIds: string[]) => {
    if (!itemIds.length) return;
    const adjustments = itemIds.map(id => {
      const s = suggestions?.find(s => s.itemId === id);
      return { itemId: id, delta: s?.suggestedQty ?? 1, reason: 'Auto-reorder from low stock alert', type: 'ADD' as const };
    });
    try {
      await adjust({ adjustments });
      toast.success(`Reorder triggered for ${itemIds.length} item(s)`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Reorder failed');
    }
  };

  return (
    <div className="space-y-6">
      {!suggestions?.length ? (
        <div className="ovds-panel p-10 text-center">
          <CheckCircleIcon className="mx-auto text-[var(--pro-azure-light)] mb-3" size={32} />
          <p className="text-sm font-semibold text-[var(--pro-azure-dark)]">All items are above reorder levels</p>
          <p className="text-xs text-slate-400 mt-1">No reorder actions needed at this time.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-slate-700">{suggestions.length} items need reordering</p>
            <button onClick={() => handleReorder(suggestions?.filter(s => s.urgency === 'CRITICAL' || s.urgency === 'HIGH').map(s => s.itemId) ?? [])} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg">
              Reorder Critical ({suggestions?.filter(s => s.urgency === 'CRITICAL' || s.urgency === 'HIGH').length ?? 0})
            </button>
          </div>

          <div className="ovds-panel overflow-hidden">
            <div className="ovds-widget-header">
              <p className="ovds-card-title">Reorder Suggestions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    {['Urgency', 'Item', 'Code', 'Warehouse', 'Current', 'Min Level', 'Suggested', 'Unit Cost', 'Est. Cost'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {suggestions?.map((s) => (
                    <tr key={s.itemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          s.urgency === 'CRITICAL' ? 'bg-rose-50 text-rose-600' :
                          s.urgency === 'HIGH' ? 'bg-amber-50 text-amber-600' :
                          s.urgency === 'MEDIUM' ? 'bg-sky-50 text-sky-600' :
                          'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]'
                        }`}>{s.urgency}</span>
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{s.itemName}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">{s.itemCode}</td>
                      <td className="px-4 py-2.5 text-slate-600">{s.warehouseName}</td>
                      <td className="px-4 py-2.5 tabular-nums font-bold text-rose-600">{s.currentStock}</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-500">{s.reorderLevel}</td>
                      <td className="px-4 py-2.5 tabular-nums font-bold text-[var(--pro-azure)]">{s.suggestedQty}</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-600">{fmtCurrency(s.unitCost)}</td>
                      <td className="px-4 py-2.5 tabular-nums font-black text-slate-800">{fmtCurrency(s.estimatedCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const CheckCircleIcon: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// -- Forecast Tab -------------------------------------------------------------
const ForecastTab: React.FC<{ forecast: any[] }> = ({ forecast }) => {
  const criticalItems = forecast?.filter(f => f.daysOfStock <= 7) ?? [];
  const warningItems = forecast?.filter(f => f.daysOfStock > 7 && f.daysOfStock <= 30) ?? [];
  const healthyItems = forecast?.filter(f => f.daysOfStock > 30) ?? [];

  const trendColor = (trend: string) => {
    if (trend === 'UP') return 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]';
    if (trend === 'DOWN') return 'text-rose-600 bg-rose-50';
    return 'text-slate-600 bg-slate-100';
  };

  const confidenceColor = (c: string) => {
    if (c === 'HIGH') return 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]';
    if (c === 'MEDIUM') return 'bg-amber-50 text-amber-600';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="space-y-6">
      <div className="ovds-grid-layout cols-3 gap-lg">
        <div className="ovds-panel p-4 text-center">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Critical (&lt;7 days)</p>
          <p className="text-[28px] font-black text-rose-600 tabular-nums">{criticalItems.length}</p>
        </div>
        <div className="ovds-panel p-4 text-center">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Warning (7-30 days)</p>
          <p className="text-[28px] font-black text-amber-600 tabular-nums">{warningItems.length}</p>
        </div>
        <div className="ovds-panel p-4 text-center">
          <p className="text-[10px] font-bold text-[var(--pro-azure)] uppercase tracking-widest mb-1">Healthy (&gt;30 days)</p>
          <p className="text-[28px] font-black text-[var(--pro-azure)] tabular-nums">{healthyItems.length}</p>
        </div>
      </div>

      <div className="ovds-panel overflow-hidden">
        <div className="ovds-widget-header">
          <p className="ovds-card-title">Demand Forecast</p>
          <span className="text-[10px] text-slate-400">{forecast?.length ?? 0} products · 90-day history · 30-day projection</span>
        </div>
        {!forecast?.length ? (
          <div className="py-10 text-center text-slate-400 text-sm">No forecast data available. Sell items to generate demand history.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  {['Item', 'Code', 'Stock', 'Avg/Day', 'Days Left', 'Projected', 'Reorder Qty', 'Trend', 'Confidence'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {forecast?.map((f) => (
                  <tr key={f.itemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{f.itemName}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">{f.itemCode}</td>
                    <td className="px-4 py-2.5 tabular-nums font-bold">{f.currentStock}</td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-600">{f.avgDailySales}</td>
                    <td className="px-4 py-2.5 tabular-nums font-bold">
                      <span className={`${f.daysOfStock <= 7 ? 'text-rose-600' : f.daysOfStock <= 30 ? 'text-amber-600' : 'text-[var(--pro-azure)]'}`}>
                        {f.daysOfStock === 999 ? '—' : `${f.daysOfStock}d`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-600">{f.projectedStock}</td>
                    <td className="px-4 py-2.5 tabular-nums font-bold text-[var(--pro-azure)]">{f.recommendedOrder > 0 ? f.recommendedOrder : '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${trendColor(f.trend)}`}>{f.trend}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${confidenceColor(f.forecastConfidence)}`}>{f.forecastConfidence}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryDashboard;

// -- Suppliers Tab ------------------------------------------------------------
const SuppliersTab: React.FC<{ suppliers: any[] }> = ({ suppliers }) => {
  const ratingColor = (rating: string) => {
    if (rating === 'EXCELLENT') return 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]';
    if (rating === 'GOOD') return 'bg-sky-50 text-sky-600';
    if (rating === 'FAIR') return 'bg-amber-50 text-amber-600';
    return 'bg-rose-50 text-rose-600';
  };

  return (
    <div className="ovds-panel overflow-hidden">
      <div className="ovds-widget-header">
        <p className="ovds-card-title">Supplier Performance</p>
        <span className="text-[10px] text-slate-400">{suppliers?.length ?? 0} vendors</span>
      </div>
      {!suppliers?.length ? (
        <div className="py-10 text-center text-slate-400 text-sm">No supplier data available.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                {['Vendor', 'Bills', 'Total Billed', 'Total Paid', 'Outstanding', 'Overdue', 'Reliability', 'Avg Days', 'Rating'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {suppliers?.map((s) => (
                <tr key={s.vendorId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{s.vendorName}</p>
                    {s.paymentTerms && <p className="text-[10px] text-slate-400">{s.paymentTerms}</p>}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{s.billCount}</td>
                  <td className="px-4 py-2.5 tabular-nums font-bold text-slate-800">{fmtCurrency(s.totalBilled)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-[var(--pro-azure)]">{fmtCurrency(s.totalPaid)}</td>
                  <td className="px-4 py-2.5 tabular-nums font-bold text-amber-600">{fmtCurrency(s.outstanding)}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    <span className={`font-bold ${s.overdueCount > 0 ? 'text-rose-600' : 'text-[var(--pro-azure)]'}`}>{s.overdueCount}</span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.paymentReliability >= 70 ? 'bg-[var(--pro-azure-50)]0' : s.paymentReliability >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${s.paymentReliability}%` }} />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums">{s.paymentReliability}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{s.avgPaymentDays}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${ratingColor(s.rating)}`}>{s.rating}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
