import { evalMath } from '@ovds/ui';
import { 
  Warehouse as WarehouseIcon, ArrowLeftRight, ArrowRight, Activity, 
  TrendingUp, TrendingDown, Plus, Edit2, Trash2,
  X, CheckCircle2, AlertCircle,
  FileText, MapPin,
  User, BarChart3, PieChart, LineChart as LineChartIcon
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { Skeleton, AppPage, Btn } from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';
import { useWarehouses, useTransferOrders, useInventoryValuation, useItems, useInventoryHistory, useLowStockAlerts, useInventorySummary, useProductSalesPerformance, useOutOfStockAlerts } from '../services/inventoryApi';
import { confirm } from '../utils/confirm';
import { fmtCurrency, fmtDate } from '../utils/fmt';


const Inventory: React.FC = () => {
  usePageTitle('Inventory Management');
  const { selectedCompanyId } = useBusiness();
  const [activeTab, setActiveTab] = useState<'WAREHOUSES' | 'TRANSFERS' | 'VALUATION' | 'ADJUSTMENTS' | 'NRV' | 'STOCKTAKE' | 'REPORTS'>('WAREHOUSES');
  
  const { warehouses, loading: loadingW, create: createW, update: updateW, remove: removeW } = useWarehouses();
  const { transfers, loading: loadingT, create: createT, updateStatus: updateTStatus } = useTransferOrders();
  const { data: valuation } = useInventoryValuation('WA');
  const { items, adjustStock, refetch: refetchItems } = useItems({ limit: 500 });
  const { history: adjustments, loading: loadingA, refetch: refetchA } = useInventoryHistory();

  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  const handleDeleteWarehouse = async (id: string) => {
    if (!(await confirm({ title: 'Delete Warehouse?', message: 'This will remove the warehouse. Ensure it has no stock.', variant: 'danger' }))) return;
    try {
      await removeW(id);
      toast.success('Warehouse deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Delete failed');
    }
  };

  const WarehouseModal = () => {
    const [form, setForm] = useState(editingWarehouse || {
      name: '',
      code: `WH-${Date.now().toString().slice(-4)}`,
      address: '',
      city: '',
      phone: '',
      email: '',
      manager: '',
      isDefault: false,
      isActive: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingWarehouse) {
          await updateW(editingWarehouse.id, form);
          toast.success('Warehouse updated');
        } else {
          await createW({ ...form, companyId: selectedCompanyId ?? undefined });
          toast.success('Warehouse created');
        }
        setShowWarehouseModal(false);
      } catch (err: any) {
        toast.error(err.response?.data?.message ?? 'Save failed');
      }
    };

    const inp = "w-full px-3 py-2 bg-white border border-[var(--pro-azure-100)] rounded-lg text-sm text-[var(--pro-azure-dark)] outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all";
    const lbl = "block text-[11px] font-semibold text-[var(--pro-azure-dark)] uppercase tracking-wider mb-1";

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[var(--pro-azure-100)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--pro-azure-100)] flex items-center justify-between">
            <h3 className="font-bold text-[var(--pro-azure-dark)]">{editingWarehouse ? 'Edit Warehouse' : 'New Warehouse'}</h3>
            <button onClick={() => setShowWarehouseModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="ovds-grid-layout cols-2">
              <div className="col-span-2">
                <label className={lbl}>Name *</label>
                <input className={inp} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className={lbl}>Code *</label>
                <input className={inp} value={form.code} onChange={e => setForm({...form, code: e.target.value})} required />
              </div>
              <div>
                <label className={lbl}>City</label>
                <input className={inp} value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Address</label>
                <textarea className={inp} rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div>
                <label className={lbl}>Manager</label>
                <input className={inp} value={form.manager} onChange={e => setForm({...form, manager: e.target.value})} />
              </div>
              <div>
                <label className={lbl}>Phone</label>
                <input className={inp} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} />
              <label htmlFor="isDefault" className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase">Set as Default Warehouse</label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowWarehouseModal(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[var(--pro-azure)] text-white rounded-lg text-sm font-bold">Save Warehouse</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const TransferModal = () => {
    const [form, setForm] = useState({
      fromWarehouseId: '',
      toWarehouseId: '',
      notes: '',
      items: [{ itemId: '', quantity: 1 }]
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.fromWarehouseId || !form.toWarehouseId) return toast.error('Select warehouses');
      if (form.fromWarehouseId === form.toWarehouseId) return toast.error('Source and destination must be different');
      try {
        await createT({ ...form, companyId: selectedCompanyId ?? undefined });
        toast.success('Transfer order created');
        setShowTransferModal(false);
      } catch (err: any) {
        toast.error(err.response?.data?.message ?? 'Create failed');
      }
    };

    const inp = "w-full px-3 py-2 bg-white border border-[var(--pro-azure-100)] rounded-lg text-sm text-[var(--pro-azure-dark)] outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all";
    const lbl = "block text-[11px] font-semibold text-[var(--pro-azure-dark)] uppercase tracking-wider mb-1";

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-[var(--pro-azure-100)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--pro-azure-100)] flex items-center justify-between">
            <h3 className="font-bold text-[var(--pro-azure-dark)]">Create Transfer Order</h3>
            <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="ovds-grid-layout cols-2">
              <div>
                <label className={lbl}>From Warehouse *</label>
                <select className={inp} value={form.fromWarehouseId} onChange={e => setForm({...form, fromWarehouseId: e.target.value})} required>
                  <option value="">Select source…</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>To Warehouse *</label>
                <select className={inp} value={form.toWarehouseId} onChange={e => setForm({...form, toWarehouseId: e.target.value})} required>
                  <option value="">Select destination…</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className={lbl}>Items to Transfer</label>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <select className={inp} value={item.itemId} onChange={e => {
                      const newItems = [...form.items];
                      newItems[idx].itemId = e.target.value;
                      setForm({...form, items: newItems});
                    }} required>
                      <option value="">Select item…</option>
                      {items.filter(i => i.itemType === 'PRODUCT').map(i => <option key={i.id} value={i.id}>{i.name} ({i.stock} {i.unit})</option>)}
                    </select>
                  </div>
                 <div className="w-24">
                   <input type="text" className={inp} value={item.quantity} onChange={e => {
                     const newItems = [...form.items];
                     newItems[idx].quantity = parseInt(String(evalMath(e.target.value) ?? e.target.value)) || 1;
                     setForm({...form, items: newItems});
                   }} required min="1" />
                 </div>
                  <button type="button" onClick={() => setForm({...form, items: form.items.filter((_, i) => i !== idx)})} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              ))}
              <button type="button" onClick={() => setForm({...form, items: [...form.items, { itemId: '', quantity: 1 }]})} className="text-xs font-bold text-[var(--pro-azure)] hover:underline">+ Add Another Item</button>
            </div>

            <div>
              <label className={lbl}>Internal Notes</label>
              <textarea className={inp} rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Reason for transfer, special handling, etc." />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[var(--pro-azure)] text-white rounded-lg text-sm font-bold shadow-lg shadow-green-500/20">Create Transfer</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AdjustmentModal = () => {
    const [form, setForm] = useState({
      itemId: '',
      quantity: 1,
      type: 'ADD' as 'ADD' | 'SUBTRACT',
      reason: '',
      warehouseId: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.itemId) return toast.error('Select an item');
      try {
        await adjustStock(form.itemId, form);
        toast.success('Stock adjusted');
        refetchA();
        setShowAdjustmentModal(false);
      } catch (err: any) {
        toast.error(err.response?.data?.message ?? 'Adjustment failed');
      }
    };

    const inp = "w-full px-3 py-2 bg-white border border-[var(--pro-azure-100)] rounded-lg text-sm text-[var(--pro-azure-dark)] outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all";
    const lbl = "block text-[11px] font-semibold text-[var(--pro-azure-dark)] uppercase tracking-wider mb-1";

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[var(--pro-azure-100)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--pro-azure-100)] flex items-center justify-between">
            <h3 className="font-bold text-[var(--pro-azure-dark)]">Inventory Adjustment</h3>
            <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className={lbl}>Item *</label>
              <select className={inp} value={form.itemId} onChange={e => setForm({...form, itemId: e.target.value})} required>
                <option value="">Select item…</option>
                {items.filter(i => i.itemType === 'PRODUCT').map(i => <option key={i.id} value={i.id}>{i.name} ({i.stock} {i.unit})</option>)}
              </select>
            </div>
            <div className="ovds-grid-layout cols-2">
              <div>
                <label className={lbl}>Adjustment Type *</label>
                <select className={inp} value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} required>
                  <option value="ADD">Add Stock (+)</option>
                  <option value="SUBTRACT">Subtract Stock (-)</option>
                </select>
              </div>
               <div>
                 <label className={lbl}>Quantity *</label>
                 <input type="text" className={inp} value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(String(evalMath(e.target.value) ?? e.target.value)) || 1})} required min="1" />
               </div>
            </div>
            <div>
              <label className={lbl}>Warehouse (Optional)</label>
              <select className={inp} value={form.warehouseId} onChange={e => setForm({...form, warehouseId: e.target.value})}>
                <option value="">Select warehouse…</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Reason / Reference</label>
              <input className={inp} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Damage, Correction, Return, etc." />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowAdjustmentModal(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[var(--pro-azure)] text-white rounded-lg text-sm font-bold">Apply Adjustment</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderWarehouses = () => (
    <div className="space-y-6">
      <div className="ovds-grid-layout cols-3 gap-lg">
        {loadingW ? [1,2,3].map(i => <Skeleton.Line key={i} className="h-40 rounded-xl" />) : warehouses.map(w => (
          <div key={w.id} className={`ovds-panel p-5 transition-all group ${w.isDefault ? 'border-[var(--pro-azure)] ring-2 ring-[var(--pro-azure)]/10' : 'hover:border-slate-200'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[var(--pro-azure-50)] dark:bg-green-950/30 flex items-center justify-center text-[var(--pro-azure)] group-hover:scale-110 transition-transform">
                <WarehouseIcon size={24}/>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingWarehouse(w); setShowWarehouseModal(true); }} className="p-2 text-slate-400 hover:text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] rounded-xl transition-all"><Edit2 size={18}/></button>
                {!w.isDefault && <button onClick={() => handleDeleteWarehouse(w.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>}
              </div>
            </div>
            <h3 className="font-black text-[var(--pro-azure-dark)] text-lg mb-1">{w.name}</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{w.code}</span>
              {w.isDefault && <span className="bg-[var(--pro-azure-50)] text-[var(--pro-azure)] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Primary</span>}
            </div>
            
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
              <div className="flex items-center gap-3 text-slate-500">
                <MapPin size={14} className="shrink-0" />
                <span className="text-xs truncate">{w.address || 'No address'}, {w.city}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <User size={14} className="shrink-0" />
                <span className="text-xs">{w.manager || 'No manager assigned'}</span>
              </div>
            </div>
          </div>
        ))}
        {!loadingW && (
          <button onClick={() => { setEditingWarehouse(null); setShowWarehouseModal(true); }} className="h-40 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)] transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center group-hover:bg-[var(--pro-azure-50)] transition-colors">
              <Plus size={24}/>
            </div>
            <span className="text-sm font-bold uppercase tracking-widest">Add Warehouse</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderTransfers = () => (
    <div className="ovds-panel overflow-hidden">
      <table className="ovds-table w-full text-left border-collapse">
        <thead>
          <tr className="bg-[var(--pro-azure-50)]/50">
            <th className="px-6 py-5 text-[10px] font-black text-[var(--pro-azure)] uppercase tracking-widest">Reference</th>
            <th className="px-6 py-5 text-[10px] font-black text-[var(--pro-azure)] uppercase tracking-widest">Movement</th>
            <th className="px-6 py-5 text-[10px] font-black text-[var(--pro-azure)] uppercase tracking-widest">Status</th>
            <th className="px-6 py-5 text-[10px] font-black text-[var(--pro-azure)] uppercase tracking-widest">Created</th>
            <th className="px-6 py-5 text-[10px] font-black text-[var(--pro-azure)] uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {loadingT ? [1,2,3].map(i => (
            <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton.Line className="h-12 w-full" /></td></tr>
          )) : transfers.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400">No transfer orders found</td></tr>
          ) : transfers.map(t => (
            <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><FileText size={20}/></div>
                  <span className="font-bold text-slate-800">{t.reference}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <p className="font-bold text-slate-700">{t.fromWarehouse?.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-tight">{t.fromWarehouse?.code}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300" />
                  <div className="text-sm">
                    <p className="font-bold text-slate-700">{t.toWarehouse?.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-tight">{t.toWarehouse?.code}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  t.status === 'RECEIVED' ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' :
                  t.status === 'SENT' ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' :
                  t.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {t.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-slate-600">{fmtDate(t.createdAt)}</p>
                <p className="ovds-caption">By: {t.createdBy || 'System'}</p>
              </td>
              <td className="px-6 py-4 text-right">
                {t.status === 'DRAFT' && (
                  <button onClick={() => updateTStatus(t.id, 'SENT')} className="px-4 py-1.5 bg-[var(--pro-azure)] text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Mark as Sent</button>
                )}
                {t.status === 'SENT' && (
                  <button onClick={() => updateTStatus(t.id, 'RECEIVED')} className="px-4 py-1.5 bg-[var(--pro-azure)] text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Mark Received</button>
                )}
                {t.status === 'RECEIVED' && <CheckCircle2 size={20} className="inline text-[var(--pro-azure)]" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderValuation = () => (
    <div className="space-y-6">
      <div className="ovds-grid-layout cols-3 gap-lg">
        <div className="ovds-panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--pro-azure-50)] flex items-center justify-center text-[var(--pro-azure)]"><TrendingUp size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Value</p>
            <p className="text-2xl font-black text-[var(--pro-azure-dark)]">{fmtCurrency(valuation?.totalValue || 0)}</p>
          </div>
        </div>
        <div className="ovds-panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--pro-azure-50)] flex items-center justify-center text-[var(--pro-azure)]"><BarChart3 size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Method</p>
            <p className="text-2xl font-black text-[var(--pro-azure-dark)]">{valuation?.method || 'WA'}</p>
          </div>
        </div>
        <div className="ovds-panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600"><PieChart size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Items Tracked</p>
            <p className="text-2xl font-black text-[var(--pro-azure-dark)]">{valuation?.items?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="ovds-grid-layout cols-4 gap-lg">
        {/* Top Performers */}
        {valuation?.items?.slice(0, 2).map((item, idx) => (
          <div key={item.id} className="ovds-panel p-4 flex flex-col gap-2.5 group hover:border-slate-200 transition-all">
            <div className="flex justify-between items-start">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${idx === 0 ? 'bg-amber-50 text-amber-500' : 'bg-white text-slate-400'}`}>
                <TrendingUp size={20} />
              </div>
              <span className="text-[10px] font-black text-[var(--pro-azure)] bg-[var(--pro-azure-50)] px-2 py-1 rounded-lg uppercase">
                Best Performer
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Top Item</p>
              <h4 className="font-bold text-[var(--pro-azure-dark)] truncate">{item.name}</h4>
            </div>
            <div className="flex items-end justify-between mt-2">
              <p className="text-lg font-black text-[var(--pro-azure)]">{fmtCurrency(item.totalValue)}</p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)]">
                <TrendingUp size={12}/> +{24 - idx * 4}%
              </div>
            </div>
          </div>
        ))}

        {/* Low Stock Alerts */}
        {items.filter(i => i.itemType === 'PRODUCT' && i.stock <= (i.reorderLevel ?? 0)).slice(0, 2).map((item) => (
          <div key={item.id} className="ovds-panel p-4 border-rose-100 dark:border-rose-900/30 flex flex-col gap-2.5 group hover:border-rose-300 transition-all">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg uppercase">
                Low Stock
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.code}</p>
              <h4 className="font-bold text-[var(--pro-azure-dark)] truncate">{item.name}</h4>
            </div>
            <div className="flex items-end justify-between mt-2">
              <p className="text-lg font-black text-rose-600">{item.stock} {item.unit}</p>
              <div className="text-[10px] font-bold text-slate-400">
                Limit: {item.reorderLevel}
              </div>
            </div>
          </div>
        ))}

        {items.filter(i => i.itemType === 'PRODUCT' && i.stock <= (i.reorderLevel ?? 0)).length === 0 && (
          <div className="col-span-2 bg-[var(--pro-azure-50)]/30 dark:bg-green-950/10 rounded-xl p-5 border border-dashed border-[var(--pro-azure-100)] dark:border-green-800 flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--pro-azure-100)] text-[var(--pro-azure)] flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] uppercase tracking-wider">All Stock Levels Healthy</p>
              <p className="text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure)]/70">No items are currently below reorder levels.</p>
            </div>
          </div>
        )}
      </div>

      <div className="ovds-panel p-4">
         <h4 className="px-4 py-2 text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 mb-4">Stock Valuation Breakdown</h4>
         <div className="overflow-x-auto">
           <table className="ovds-table w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">In Stock</th>
                  <th className="px-4 py-3">Avg. Cost</th>
                  <th className="px-4 py-3">Inventory Value</th>
                  <th className="px-4 py-3 text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {valuation?.items?.map(item => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-700">{item.name} <span className="text-[10px] text-slate-400 font-normal ml-2">{item.code}</span></td>
                    <td className="px-4 py-4 text-sm font-black text-slate-600">{item.stock} <span className="ovds-caption">{item.unit}</span></td>
                    <td className="px-4 py-4 text-sm font-black text-[var(--pro-azure)]">{fmtCurrency(item.unitCost)}</td>
                    <td className="px-4 py-4 text-sm font-black text-slate-800">{fmtCurrency(item.totalValue)}</td>
                    <td className="px-4 py-4 text-right">
                       <span className="flex items-center justify-end gap-1 text-[10px] font-black text-[var(--pro-azure)] bg-[var(--pro-azure-50)] px-2 py-1 rounded-lg uppercase tracking-tight">
                         <TrendingUp size={10}/> 12%
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
         </div>
      </div>
    </div>
  );

  const renderAdjustments = () => (
    <div className="ovds-panel overflow-hidden">
      <table className="ovds-table w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-800/50">
            <th className="px-6 py-5 ovds-label">Reference</th>
            <th className="px-6 py-5 ovds-label">Item</th>
            <th className="px-6 py-5 ovds-label">Type</th>
            <th className="px-6 py-5 ovds-label">Qty</th>
            <th className="px-6 py-5 ovds-label">Reason</th>
            <th className="px-6 py-5 ovds-label">Adjusted By</th>
            <th className="px-6 py-5 ovds-label">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {loadingA ? [1,2,3].map(i => (
            <tr key={i}><td colSpan={7} className="px-6 py-4"><Skeleton.Line className="h-12 w-full" /></td></tr>
          )) : adjustments.length === 0 ? (
            <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400">No adjustments recorded yet</td></tr>
          ) : adjustments.map((a: any) => {
            const isAdd = ['ADD', 'RETURN'].includes(a.type);
            return (
              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-[10px] font-mono text-slate-400">{a.reference}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{a.item?.name ?? '—'}</div>
                  <div className="ovds-caption">{a.item?.code}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    isAdd ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' : 'bg-rose-50 text-rose-600'
                  }`}>{a.type}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-black ${isAdd ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>
                    {isAdd ? '+' : '-'}{a.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-600">{a.reason || '—'}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{a.adjustedBy || 'System'}</td>
                <td className="px-6 py-4 text-xs text-slate-500">{fmtDate(a.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <AppPage
      title="Inventory"
      subtitle="Warehouses, internal transfers, and stock valuation · Supply Chain · Manufacturing & Logistics · Retail & E-commerce · Market Size · Market Segmentation · Revenue"
      icon={<WarehouseIcon size={18} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      crumbs={[{ label: 'Inventory' }]}
      actions={
        <>
          {activeTab === 'WAREHOUSES' && (
            <Btn variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setEditingWarehouse(null); setShowWarehouseModal(true); }}>Add Warehouse</Btn>
          )}
          {activeTab === 'TRANSFERS' && (
            <Btn variant="primary" size="sm" icon={<ArrowLeftRight size={14} />} onClick={() => setShowTransferModal(true)}>New Transfer</Btn>
          )}
          { activeTab === 'REPORTS' && (
            <Btn variant="secondary" size="sm" icon={<FileText size={14} />}>Export CSV</Btn>
          )}
          {activeTab === 'ADJUSTMENTS' && (
            <Btn variant="primary" size="sm" icon={<Activity size={14} />} onClick={() => setShowAdjustmentModal(true)}>New Adjustment</Btn>
          )}
        </>
      }
    >

      {/* Tabs — consistent with AppTabs design system style */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl w-fit shadow-sm flex-wrap">
        {[
          { id: 'WAREHOUSES',  label: 'Warehouses',  icon: <WarehouseIcon size={15}/> },
          { id: 'TRANSFERS',   label: 'Transfers',   icon: <ArrowLeftRight size={15}/> },
          { id: 'ADJUSTMENTS', label: 'Adjustments', icon: <Activity size={15}/> },
          { id: 'VALUATION',   label: 'Valuation',   icon: <BarChart3 size={15}/> },
          { id: 'NRV',         label: 'NRV (IAS 2)', icon: <TrendingDown size={15}/> },
          { id: 'STOCKTAKE',   label: 'Stocktake',   icon: <CheckCircle2 size={15}/> },
          { id: 'REPORTS',     label: 'Reports',     icon: <FileText size={15}/> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wide transition-all duration-150',
              activeTab === t.id
                ? 'bg-white dark:bg-slate-900 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50',
            ].join(' ')}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'WAREHOUSES'  && renderWarehouses()}
        {activeTab === 'TRANSFERS'   && renderTransfers()}
        {activeTab === 'ADJUSTMENTS' && renderAdjustments()}
        {activeTab === 'VALUATION'   && renderValuation()}
      {activeTab === 'NRV'         && <NrvTab companyId={selectedCompanyId ?? undefined} />}
      {activeTab === 'STOCKTAKE'   && <StocktakeTab companyId={selectedCompanyId ?? undefined} items={items} refetchItems={refetchItems} />}
      {activeTab === 'REPORTS'     && <ReportsTab companyId={selectedCompanyId ?? undefined} />}
      </div>

      {showWarehouseModal && <WarehouseModal />}
      {showTransferModal && <TransferModal />}
      {showAdjustmentModal && <AdjustmentModal />}
    </AppPage>
  );
};

// -- NRV Write-Down Tab (IAS 2.28) ---------------------------------------------

const NrvTab: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const [candidates, setCandidates] = React.useState<any[]>([]);
  const [totalExposure, setTotalExposure] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [writeDownItem, setWriteDownItem] = React.useState<any | null>(null);
  const [nrvInput, setNrvInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = companyId ? `?companyId=${companyId}` : '';
      const res = await api.get(`/ovds/inventory/nrv-candidates${q}`).catch(() => ({ data: { data: { candidates: [], totalExposure: 0 } } }));
      const d = res.data?.data ?? res.data;
      setCandidates(d?.candidates ?? []);
      setTotalExposure(d?.totalExposure ?? 0);
    } finally { setLoading(false); }
  }, [companyId]);

  React.useEffect(() => { load(); }, [load]);

  const handleWriteDown = async () => {
    if (!writeDownItem || !nrvInput) { toast.error('Enter NRV amount'); return; }
    const nrv = parseFloat(nrvInput);
    if (isNaN(nrv) || nrv < 0) { toast.error('Enter a valid NRV'); return; }
    setSaving(true);
    try {
      const res = await api.post(`/ovds/inventory/items/${writeDownItem.id}/nrv-writedown`, {
        nrvAmount: nrv,
        reason: 'IAS 2.28 write-down — cost exceeds NRV',
        companyId,
      });
      const d = res.data?.data ?? res.data;
      toast.success(`Write-down applied: ETB ${fmtCurrency(d.totalWriteDown)} total`);
      setWriteDownItem(null);
      setNrvInput('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Write-down failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-700 dark:text-amber-300">
        <p className="font-bold text-[12px] mb-1">IAS 2.28 — Lower of Cost and Net Realisable Value</p>
        <p>Inventories must be written down to NRV when NRV is below cost. The write-down is recognised as an expense in the period incurred (IAS 2.34). Items below show where <strong>cost price exceeds sale price</strong>.</p>
      </div>

      {/* KPIs */}
      <div className="ovds-grid-layout cols-3 gap-sm">
        {[
          { label: 'Write-Down Candidates', value: candidates.length,           accent: 'bg-amber-500' },
          { label: 'Total Exposure (ETB)',   value: fmtCurrency(totalExposure), accent: 'bg-rose-500'  },
          { label: 'Reviewed',               value: 0,                           accent: 'bg-[var(--pro-azure-50)]0' },
        ].map(k => (
          <div key={k.label} className="ovds-widget-card p-4">
            <div className={`w-1 h-6 rounded-full ${k.accent} mb-2`} />
            <p className="ovds-value-sm font-black">{k.value}</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Candidates table */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="ovds-widget-header">
          <p className="ovds-card-title">Write-Down Candidates</p>
          <button onClick={load} className="ml-auto text-[10px] text-slate-400 hover:text-[var(--pro-azure)]">Refresh</button>
        </div>
        {loading ? (
          <div className="py-10 text-center"><div className="animate-spin w-5 h-5 border-2 border-[var(--pro-azure)] border-t-transparent rounded-full mx-auto" /></div>
        ) : candidates.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 size={24} className="mx-auto text-[var(--pro-azure-light)] mb-2" />
            <p className="text-sm font-semibold text-[var(--pro-azure-dark)]">All inventory items are at or below cost — no write-downs required.</p>
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                {['Item', 'Code', 'Cost Price', 'NRV (Sale Price)', 'Write-Down/Unit', 'Stock', 'Total Exposure', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {candidates.map((c: any) => (
                <tr key={c.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{c.name}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-400">{c.code}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{fmtCurrency(c.costPrice)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-amber-600 font-semibold">{fmtCurrency(c.nrvPrice)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-rose-600 font-bold">{fmtCurrency(c.writeDownPerUnit)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{c.stock}</td>
                  <td className="px-4 py-2.5 tabular-nums font-black text-rose-700">{fmtCurrency(c.totalWriteDown)}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => { setWriteDownItem(c); setNrvInput(String(c.nrvPrice)); }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                    >
                      Write Down
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Write-down modal */}
      {writeDownItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-md space-y-4 shadow-2xl">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Write Down: {writeDownItem.name}</p>
            <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-white dark:bg-slate-800 rounded-xl">
              <div><p className="text-slate-400">Cost Price</p><p className="font-bold">{fmtCurrency(writeDownItem.costPrice)}</p></div>
              <div><p className="text-slate-400">Total Exposure</p><p className="font-bold text-rose-600">{fmtCurrency(writeDownItem.totalWriteDown)}</p></div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">New NRV Amount (ETB per unit)</label>
              <input
                type="number" step="0.01" min="0"
                value={nrvInput} onChange={e => setNrvInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white dark:bg-slate-800"
                placeholder="0.00"
                autoFocus
              />
            </div>
            {nrvInput && parseFloat(nrvInput) < writeDownItem.costPrice && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl text-[11px] font-bold text-rose-700">
                Write-down: ETB {fmtCurrency((writeDownItem.costPrice - parseFloat(nrvInput)) * writeDownItem.stock)} total
                (ETB {fmtCurrency(writeDownItem.costPrice - parseFloat(nrvInput))}/unit × {writeDownItem.stock} units)
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setWriteDownItem(null)} className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleWriteDown} disabled={saving} className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl">
                {saving ? 'Saving…' : 'Apply Write-Down'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -- Stocktake Tab -------------------------------------------------------------

const StocktakeTab: React.FC<{ companyId?: string; items: any[]; refetchItems: () => void }> = ({ companyId, items }) => {
  const [counts, setCounts] = React.useState<Record<string, string>>({});
  const [notes, setNotes]   = React.useState<Record<string, string>>({});
  const [postAdj, setPostAdj] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<any | null>(null);
  const [search, setSearch] = React.useState('');
  const countDate = new Date().toISOString().slice(0, 10);

  const productItems = React.useMemo(() =>
    items.filter(i => i.itemType === 'PRODUCT' || i.stock !== undefined)
      .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.code ?? '').toLowerCase().includes(search.toLowerCase()))
  , [items, search]);

  const handleSubmit = async () => {
    const filled = Object.entries(counts).filter(([, v]) => v !== '');
    if (filled.length === 0) { toast.error('Enter physical count for at least one item'); return; }
    if (!await confirm({ title: 'Submit Stocktake?', message: `${filled.length} items counted. ${postAdj ? 'Stock adjustments will be posted automatically.' : 'No adjustments will be posted.'}`, confirmLabel: 'Submit', variant: 'warning' })) return;

    setSubmitting(true);
    try {
      const payload = {
        countDate,
        counts: filled.map(([itemId, qty]) => ({
          itemId,
          physicalQty: parseFloat(qty),
          notes: notes[itemId] || undefined,
        })),
        postAdjustments: postAdj,
        companyId,
      };
      const res = await api.post('/ovds/inventory/stocktake', payload);
      const d = res.data?.data ?? res.data;
      setResult(d);
      toast.success(`Stocktake complete — ${d.matchedCount} matched, ${d.shortageCount} shortages, ${d.surplusCount} surplus`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Stocktake failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-xl text-[11px] text-sky-700 dark:text-sky-300">
        <p className="font-bold text-[12px] mb-1">Physical Inventory Count (Stocktake)</p>
        <p>Enter the physical quantity counted for each item. The system will calculate variances against the current stock balance. <strong>{postAdj ? 'Adjustments will be automatically posted.' : 'Review-only mode — no adjustments will be posted.'}</strong></p>
      </div>

      {/* Result summary */}
      {result && (
        <div className="p-4 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl space-y-2">
          <p className="font-bold text-[var(--pro-azure-dark)] dark:text-green-200 text-[12px]">✓ Stocktake Complete — {result.countDate}</p>
          <div className="grid grid-cols-4 gap-3 text-[11px]">
            {[
              { label: 'Items Counted', value: result.totalItemsCounted },
              { label: 'Matched',       value: result.matchedCount,   cls: 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' },
              { label: 'Shortages',     value: result.shortageCount,  cls: 'text-rose-600' },
              { label: 'Surplus',       value: result.surplusCount,   cls: 'text-amber-600' },
            ].map(k => (
              <div key={k.label} className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-[var(--pro-azure-100)] dark:border-green-900">
                <p className="text-slate-400">{k.label}</p>
                <p className={`font-black text-[14px] ${k.cls ?? ''}`}>{k.value}</p>
              </div>
            ))}
          </div>
          {result.totalVarianceValue > 0 && (
            <p className="text-[11px] text-rose-600 font-semibold">
              Total variance value: ETB {fmtCurrency(result.totalVarianceValue)}
            </p>
          )}
          <button onClick={() => setResult(null)} className="text-[10px] text-[var(--pro-azure)] hover:underline mt-1">Start new count</button>
        </div>
      )}

      {!result && (
        <>
          <div className="flex items-center gap-4 flex-wrap">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search items…"
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] bg-white dark:bg-slate-800 outline-none focus:border-teal-400 w-56"
            />
            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
                <div
                  onClick={() => setPostAdj(p => !p)}
                  className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${postAdj ? 'bg-[var(--pro-azure-50)]0' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${postAdj ? 'left-4' : 'left-0.5'}`} />
                </div>
                Post adjustments automatically
              </label>
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(counts).filter(k => counts[k] !== '').length === 0}
                className="px-4 py-2 bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 text-white text-[11px] font-bold rounded-xl transition-colors"
              >
                {submitting ? 'Submitting…' : `Submit Count (${Object.keys(counts).filter(k => counts[k] !== '').length})`}
              </button>
            </div>
          </div>

          <div className="ovds-widget-card overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  {['Item', 'Code', 'System Qty', 'Physical Count', 'Variance', 'Notes'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {productItems.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400">No items found.</td></tr>
                ) : productItems.map((item: any) => {
                  const system   = Number(item.stock ?? 0);
                  const physical = counts[item.id] !== undefined && counts[item.id] !== '' ? parseFloat(counts[item.id]) : null;
                  const variance = physical !== null ? physical - system : null;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${variance !== null && variance !== 0 ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                      <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">{item.code}</td>
                      <td className="px-4 py-2.5 tabular-nums font-bold text-slate-700 dark:text-slate-300">{system}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number" min="0" step="1"
                          value={counts[item.id] ?? ''}
                          onChange={e => setCounts(c => ({ ...c, [item.id]: e.target.value }))}
                          placeholder={String(system)}
                          className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-center focus:outline-none focus:border-teal-400 bg-white dark:bg-slate-800 tabular-nums"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        {variance !== null ? (
                          <span className={`font-bold tabular-nums ${variance > 0 ? 'text-[var(--pro-azure)]' : variance < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {variance > 0 ? `+${variance}` : variance}
                          </span>
                        ) : <span className="text-slate-200 dark:text-slate-700">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          value={notes[item.id] ?? ''}
                          onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                          placeholder="optional…"
                          className="w-32 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] focus:outline-none focus:border-slate-400 bg-white dark:bg-slate-800"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// -- Reports Tab ---------------------------------------------------------------
const ReportsTab: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const [reportType, setReportType] = useState<'SUMMARY' | 'SALES'>('SUMMARY');
  const [dateFrom, setDateFrom] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: summary, loading: loadingSummary, refetch: refetchSummary } = useInventorySummary({ companyId, dateFrom, dateTo });
  const { data: salesPerf, loading: loadingSales } = useProductSalesPerformance({ companyId, dateFrom, dateTo });
  const { alerts: lowStockAlerts } = useLowStockAlerts();
  const { alerts: outOfStockAlerts } = useOutOfStockAlerts();

  const handleExportCsv = () => {
    if (!summary?.items?.length) { toast.error('No data to export'); return; }
    const headers = 'Item,Code,Opening Qty,Received,Sold,Adjusted,Closing Qty,Opening Value,Closing Value\n';
    const rows = summary.items.map(l => `"${l.itemName}","${l.itemCode}",${l.openingQty},${l.receivedQty},${l.soldQty},${l.adjustedQty},${l.closingQty},${l.openingValue},${l.closingValue}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `inventory-summary-${dateFrom}-to-${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-6">
      <div className="ovds-grid-layout cols-4 gap-sm">
        {[
          { label: 'Total Items', value: summary?.items?.length ?? 0, accent: 'bg-[var(--pro-azure-50)]0' },
          { label: 'Opening Value', value: summary ? fmtCurrency(summary.totalOpeningValue) : '—', accent: 'bg-sky-500' },
          { label: 'Closing Value', value: summary ? fmtCurrency(summary.totalClosingValue) : '—', accent: 'bg-violet-500' },
          { label: 'Value Change', value: summary ? `${summary.totalClosingValue >= summary.totalOpeningValue ? '+' : ''}${fmtCurrency(summary.totalClosingValue - summary.totalOpeningValue)}` : '—', accent: summary && summary.totalClosingValue >= summary.totalOpeningValue ? 'bg-[var(--pro-azure-50)]0' : 'bg-rose-500' },
        ].map(k => (
          <div key={k.label} className="ovds-widget-card p-4">
            <div className={`w-1 h-6 rounded-full ${k.accent} mb-2`} />
            <p className="ovds-value-sm font-black">{k.value}</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {(['SUMMARY', 'SALES'] as const).map(t => (
            <button key={t} onClick={() => setReportType(t)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all ${reportType === t ? 'bg-[var(--pro-azure)] text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>{t === 'SUMMARY' ? 'Inventory Summary' : 'Sales Performance'}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white dark:bg-slate-800" />
          <span className="text-[10px] text-slate-400 font-bold">TO</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white dark:bg-slate-800" />
          <button onClick={() => { refetchSummary(); }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg">Apply</button>
          <button onClick={handleExportCsv} className="px-3 py-1.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-[11px] font-bold rounded-lg">Export CSV</button>
        </div>
      </div>

      {reportType === 'SUMMARY' && (
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header">
            <p className="ovds-card-title">Inventory Summary Report</p>
            <span className="text-[10px] text-slate-400">{dateFrom} → {dateTo}</span>
          </div>
          {loadingSummary ? (
            <div className="py-10 text-center"><div className="animate-spin w-5 h-5 border-2 border-[var(--pro-azure)] border-t-transparent rounded-full mx-auto" /></div>
          ) : summary?.items?.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No inventory data for this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    {['Item', 'Code', 'Opening', 'Received', 'Sold', 'Adjusted', 'Closing', 'Open Value', 'Close Value'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {summary?.items?.map((l) => (
                    <tr key={l.itemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{l.itemName}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">{l.itemCode}</td>
                      <td className="px-4 py-2.5 tabular-nums">{l.openingQty}</td>
                      <td className="px-4 py-2.5 tabular-nums text-[var(--pro-azure)] font-semibold">+{l.receivedQty}</td>
                      <td className="px-4 py-2.5 tabular-nums text-rose-600 font-semibold">-{l.soldQty}</td>
                      <td className="px-4 py-2.5 tabular-nums">{l.adjustedQty >= 0 ? '+' : ''}{l.adjustedQty}</td>
                      <td className="px-4 py-2.5 tabular-nums font-black text-slate-800">{l.closingQty}</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-600">{fmtCurrency(l.openingValue)}</td>
                      <td className="px-4 py-2.5 tabular-nums font-bold text-slate-800">{fmtCurrency(l.closingValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {reportType === 'SALES' && (
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header">
            <p className="ovds-card-title">Product Sales Performance</p>
            <span className="text-[10px] text-slate-400">{dateFrom} → {dateTo}</span>
          </div>
          {loadingSales ? (
            <div className="py-10 text-center"><div className="animate-spin w-5 h-5 border-2 border-[var(--pro-azure)] border-t-transparent rounded-full mx-auto" /></div>
          ) : salesPerf?.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No sales data for this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    {['Item', 'Code', 'Unit', 'Qty Sold', 'Revenue', 'COGS', 'Gross Profit', 'Margin', 'Txns'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {salesPerf?.map((p) => (
                    <tr key={p.itemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{p.itemName}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">{p.itemCode}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.unit}</td>
                      <td className="px-4 py-2.5 tabular-nums font-bold">{p.totalQtySold}</td>
                      <td className="px-4 py-2.5 tabular-nums text-[var(--pro-azure)] font-semibold">{fmtCurrency(p.totalRevenue)}</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-500">{fmtCurrency(p.totalCost)}</td>
                      <td className="px-4 py-2.5 tabular-nums font-black text-slate-800">{fmtCurrency(p.grossProfit)}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${p.marginPct >= 30 ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' : p.marginPct >= 10 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                          {p.marginPct}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-500">{p.transactionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Low-Stock Alerts Summary */}
      {(lowStockAlerts.length > 0 || outOfStockAlerts.length > 0) && (
        <div className="ovds-widget-card p-4">
          <p className="ovds-card-title mb-3">Active Stock Alerts</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Low Stock ({lowStockAlerts.length})</p>
              {lowStockAlerts.slice(0, 5).map(a => (
                <div key={a.itemId} className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div>
                    <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">{a.itemName}</p>
                    <p className="text-[10px] text-amber-600">{a.warehouseName} · stock: {a.currentStock} / min: {a.reorderLevel}</p>
                  </div>
                  <span className="text-[11px] font-black text-amber-600 tabular-nums">{a.shortageQty} short</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Out of Stock ({outOfStockAlerts.length})</p>
              {outOfStockAlerts.slice(0, 5).map(a => (
                <div key={a.itemId} className="flex items-center justify-between p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg">
                  <div>
                    <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">{a.itemName}</p>
                    <p className="text-[10px] text-rose-600">{a.warehouseName} · reorder est: {fmtCurrency(a.estimatedReorderCost)}</p>
                  </div>
                  <span className="text-[11px] font-black text-rose-600 tabular-nums">0 in stock</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;





