/**
 * Inventory Valuation — IAS 2
 * FIFO and Weighted Average Cost (AVCO) stock valuation.
 * Shows current inventory value, COGS impact, and NRV write-down alerts.
 */
import { AppPage, AppKpi } from '@ovds/ui';
import { Package, RefreshCw, AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../context/businessContext';
import api from '../services/api';

interface ValuationItem {
  itemId: string;
  itemName: string;
  itemCode: string;
  currentQty: number;
  currentValue: number;
  unitCost: number;
  salePrice?: number;
  writeDownRequired?: boolean;
  belowReorder: boolean;
}

interface ValuationSummary {
  items: ValuationItem[];
  totalValue: number;
  itemCount: number;
  generatedAt: string;
}

const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2 });

const InventoryValuation: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const cid = selectedCompanyId ?? undefined;

  const [data, setData]       = useState<ValuationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [filterAlert, setFilterAlert] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/ovds/inventory/valuation', { params: { companyId: cid } });
      setData(res.data?.data ?? res.data ?? null);
    } catch { toast.error('Failed to load inventory valuation'); }
    finally { setLoading(false); }
  }, [cid]);

  useEffect(() => { load(); }, [load]);

  const filtered = (data?.items ?? []).filter(i => {
    if (filterAlert && !i.writeDownRequired && !i.belowReorder) return false;
    if (search && !i.itemName.toLowerCase().includes(search.toLowerCase()) && !i.itemCode.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const writeDownItems  = (data?.items ?? []).filter(i => i.writeDownRequired).length;
  const belowReorderItems = (data?.items ?? []).filter(i => i.belowReorder).length;

  const kpiCells = data ? [
    { label: 'Total Inventory Value', value: `ETB ${(data.totalValue / 1000).toFixed(1)}K`, accentCls: 'bg-[var(--pro-azure-50)]0' },
    { label: 'Total Items',           value: data.itemCount.toString(),                      accentCls: 'bg-sky-500' },
    { label: 'NRV Write-Downs',       value: writeDownItems.toString(),   accentCls: writeDownItems > 0 ? 'bg-rose-500' : 'bg-[var(--pro-azure-50)]0' },
    { label: 'Below Reorder Level',   value: belowReorderItems.toString(), accentCls: belowReorderItems > 0 ? 'bg-amber-500' : 'bg-[var(--pro-azure-50)]0' },
  ] : [];

  return (
    <AppPage
      title="Inventory Valuation"
      subtitle="IAS 2 — FIFO / Weighted Average Cost · NRV write-down alerts · Manufacturing & Logistics · Retail & E-commerce · Supply Chain · Market Size · Market Value · Revenue"
      icon={<Package size={16} />}
      iconBg="bg-sky-500"
      crumbs={[{ label: 'Inventory', to: '/inventory' }, { label: 'Valuation (IAS 2)' }]}
      actions={
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items…"
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 w-44"
          />
          <button
            onClick={() => setFilterAlert(v => !v)}
            className={`px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${filterAlert ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <AlertTriangle size={14} className="inline mr-1" />Alerts only
          </button>
          <button onClick={load} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin text-[var(--pro-azure)]' : 'text-slate-500'} />
          </button>
        </div>
      }
    >
      <AppKpi cells={kpiCells} />

      {/* IAS 2 principle note */}
      <div className="ovds-widget-card p-4 mb-4 flex items-start gap-3">
        <BarChart3 size={18} className="text-sky-500 mt-0.5 shrink-0" />
        <div>
          <p className="ovds-card-title">IAS 2 Measurement Basis</p>
          <p className="ovds-body mt-1">Inventories are measured at the <strong>lower of cost and net realisable value (NRV)</strong>. Cost is determined using <strong>FIFO</strong> or <strong>Weighted Average Cost (AVCO)</strong>. LIFO is prohibited. Items flagged in red have a unit cost exceeding NRV — a write-down is required per IAS 2.28.</p>
        </div>
      </div>

      {/* Valuation table */}
      <div className="ovds-widget-card">
        <div className="ovds-widget-header">
          <h3 className="ovds-card-title">Stock Valuation — {data?.generatedAt ? new Date(data.generatedAt).toLocaleString('en-ET') : 'Live'}</h3>
          <span className="ovds-caption">{filtered.length} of {data?.itemCount ?? 0} items</span>
        </div>
        <div className="ovds-widget-body overflow-x-auto">
          {loading ? (
            <div className="ovds-empty py-12"><RefreshCw size={20} className="animate-spin text-[var(--pro-azure)] mb-2" /><span>Calculating…</span></div>
          ) : filtered.length === 0 ? (
            <div className="ovds-empty py-12"><Package size={32} className="text-slate-300 mb-2" /><span>No items found</span></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Code','Item Name','Qty on Hand','Unit Cost (AVCO)','Sale Price','Current Value','IAS 2 Status','Alert'].map(h => (
                    <th key={h} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left py-2 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const hasAlert = item.writeDownRequired || item.belowReorder;
                  return (
                    <tr key={item.itemId}
                      className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${hasAlert ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{item.itemCode}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">{item.itemName}</td>
                      <td className="py-2.5 px-3 ovds-number text-right">{item.currentQty.toLocaleString('en-ET', { maximumFractionDigits: 4 })}</td>
                      <td className="py-2.5 px-3 ovds-number text-right">{fmt(item.unitCost)}</td>
                      <td className="py-2.5 px-3 ovds-number text-right">{item.salePrice ? fmt(item.salePrice) : '—'}</td>
                      <td className="py-2.5 px-3 ovds-number text-right font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">{fmt(item.currentValue)}</td>
                      <td className="py-2.5 px-3">
                        {item.writeDownRequired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                            <TrendingDown size={10} /> Write-Down Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] text-[10px] font-bold uppercase">Cost ≤ NRV ✓</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.belowReorder && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">
                            <AlertTriangle size={10} /> Reorder
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {data && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
                    <td colSpan={5} className="py-2.5 px-3 font-bold text-right text-slate-700 dark:text-slate-200">Total Inventory Value (ETB)</td>
                    <td className="py-2.5 px-3 ovds-number text-right font-black text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">{fmt(data.totalValue)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </AppPage>
  );
};

export default InventoryValuation;

