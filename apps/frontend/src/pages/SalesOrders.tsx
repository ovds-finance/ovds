import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingCart, Plus, Edit2, RefreshCw,
  CheckCircle2, XCircle, Package, Printer, ArrowUpRight,
  Search, Mail, Copy, FileText, Filter, Eye, Trash2,
  Columns3, Truck, Clock, TrendingUp, BarChart3,
  ChevronRight, AlertCircle, CalendarDays, Hash,
  SlidersHorizontal, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { confirm } from '../utils/confirm';
import DOMPurify from 'dompurify';
import {
  AppPage, AppTabs,
  Btn, Modal, FormField, Input, Textarea,
  Pagination, Skeleton, MetricCard,
  downloadCSV, fmtNum, fmtDate, cn,
} from '../components/ui';
import { evalMath } from '@ovds/ui';
import {
  PipelineBadge, PipelineViewToggle, PipelineStageHeader, PipelineCard,
  KanbanBoard, ColumnToggle, AppEmpty, PipelineFunnel,
  type PipelineView,
} from '../components';

interface SalesOrderLine {
  LineNo: number;
  ItemId: string;
  ItemType: string;
  description: string;
  OrderedQty: number;
  UnitOfMeasure: string;
  SalePriceSnapshot: number;
  DiscountType: string;
  DiscountValue: number;
  OrderedWeight: number;
  OrderedCubic: number;
}

interface SalesOrder {
  id: string;
  OrderNumber: string;
  CustomerId?: string;
  CustomerName?: string;
  OrderDate: string;
  RequestedDeliveryDate?: string;
  SalesType?: string;
  CurrencyCode?: string;
  CurrencyRate?: number;
  ShipToAddressText?: string;
  ShipToWarehouseId?: string;
  notes?: string;
  status: string;
  OrderLines?: SalesOrderLine[];
  companyId?: string;
  createdAt: string;
  dispatches?: any[];
  DeliveryPerformance?: any[];
  CreditNotes?: any[];
}

type FilterTab = 'ALL' | 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type ViewMode = PipelineView; // alias kept for readability in status checks

const STATUS_STAGES: Array<{ key: FilterTab; label: string; color: string; icon: React.ReactNode }> = [
  { key: 'DRAFT', label: 'Draft', color: '#94a3b8', icon: <Hash size={10} /> },
  { key: 'CONFIRMED', label: 'Confirmed', color: '#38bdf8', icon: <CheckCircle2 size={10} /> },
  { key: 'SHIPPED', label: 'Shipped', color: '#818cf8', icon: <Package size={10} /> },
  { key: 'DELIVERED', label: 'Delivered', color: '#00E784', icon: <Truck size={10} /> },
  { key: 'CANCELLED', label: 'Cancelled', color: '#f43f5e', icon: <XCircle size={10} /> },
];

const STATUS_SEQUENCE = ['DRAFT', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const STATUS_META: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  DRAFT:     { bg: 'bg-slate-100 dark:bg-slate-800',   text: 'text-slate-600 dark:text-slate-300', ring: 'ring-slate-200 dark:ring-slate-700', dot: 'bg-slate-400' },
  CONFIRMED: { bg: 'bg-sky-50 dark:bg-sky-900/20',     text: 'text-sky-700 dark:text-sky-300',     ring: 'ring-sky-200 dark:ring-sky-800',     dot: 'bg-sky-400' },
  SHIPPED:   { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', ring: 'ring-violet-200 dark:ring-violet-800', dot: 'bg-violet-400' },
  DELIVERED: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-200 dark:ring-emerald-800', dot: 'bg-emerald-400' },
  CANCELLED: { bg: 'bg-rose-50 dark:bg-rose-900/20',   text: 'text-rose-700 dark:text-rose-300',   ring: 'ring-rose-200 dark:ring-rose-800',   dot: 'bg-rose-400' },
};

/* ─── Order status progress stepper ─── */
const OrderStatusStepper: React.FC<{ status: string }> = ({ status }) => {
  const idx = STATUS_SEQUENCE.indexOf(status);
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 ring-1 ring-rose-200 dark:ring-rose-800">
        <XCircle size={10} className="text-rose-500" />
        <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Cancelled</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5">
      {STATUS_SEQUENCE.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        const meta = STATUS_META[s] ?? STATUS_META.DRAFT;
        return (
          <React.Fragment key={s}>
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all',
              active ? `${meta.bg} ${meta.text} ring-1 ${meta.ring}` : done ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600',
            )}>
              {done ? <CheckCircle2 size={9} className="text-emerald-500" /> : active ? <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />}
              <span className={active ? '' : done ? '' : 'hidden sm:inline'}>{s.charAt(0) + s.slice(1).toLowerCase()}</span>
            </div>
            {i < STATUS_SEQUENCE.length - 1 && (
              <ChevronRight size={10} className={cn('shrink-0', i < idx ? 'text-emerald-400' : 'text-slate-200 dark:text-slate-700')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ─── DIFOT badge (Delivered In Full On Time) ─── */
const DifotBadge: React.FC<{ inFull: boolean; onTime: boolean }> = ({ inFull, onTime }) => {
  const both = inFull && onTime;
  const neither = !inFull && !onTime;
  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ring-1',
      both ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800'
           : neither ? 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-800'
           : 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800',
    )}>
      {both ? <CheckCircle2 size={8} /> : neither ? <AlertCircle size={8} /> : <Clock size={8} />}
      {both ? 'DIFOT' : !inFull ? 'Partial' : 'Late'}
    </div>
  );
};

/* ─── Form ─── */
const SalesOrderForm: React.FC<{ data: Partial<SalesOrder>; onChange: (d: Partial<SalesOrder>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof SalesOrder, v: any) => onChange({ ...data, [k]: v });
  const lines = data.OrderLines || [];
  const updateLine = (index: number, field: keyof SalesOrderLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    onChange({ ...data, OrderLines: newLines });
  };
  const addLine = () => {
    onChange({ ...data, OrderLines: [...lines, { LineNo: lines.length + 1, ItemId: '', ItemType: '', description: '', OrderedQty: 1, UnitOfMeasure: 'PCS', SalePriceSnapshot: 0, DiscountType: 'FIXED', DiscountValue: 0, OrderedWeight: 0, OrderedCubic: 0 }] });
  };
  const removeLine = (index: number) => onChange({ ...data, OrderLines: lines.filter((_, i) => i !== index) });
  const evalField = (value: string) => { const r = evalMath(value); return r !== null ? r : parseFloat(value) || 0; };
  const lineTotal = lines.reduce((s, l) => s + (l.OrderedQty * l.SalePriceSnapshot), 0);

  return (
    <div className="space-y-5">
      {/* Header fields */}
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Details</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Order Number" required>
            <Input value={data.OrderNumber ?? ''} onChange={e => set('OrderNumber', e.target.value)} placeholder="SO-2026-001" />
          </FormField>
          <FormField label="Sales Type">
            <select value={data.SalesType ?? ''} onChange={e => set('SalesType', e.target.value)} className="w-full h-9 px-3 text-[13px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
              <option value="">— Select type —</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT">Credit</option>
              <option value="CONTRACT">Contract</option>
              <option value="CONSIGNMENT">Consignment</option>
            </select>
          </FormField>
        </div>
      </div>

      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Customer Name">
            <Input value={data.CustomerName ?? ''} onChange={e => set('CustomerName', e.target.value)} placeholder="e.g. Acme Trading PLC" />
          </FormField>
          <FormField label="Customer ID">
            <Input value={data.CustomerId ?? ''} onChange={e => set('CustomerId', e.target.value)} placeholder="CUST-001" />
          </FormField>
        </div>
      </div>

      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Dates & Delivery</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Order Date">
            <Input type="date" value={data.OrderDate ? new Date(data.OrderDate).toISOString().split('T')[0] : ''} onChange={e => set('OrderDate', e.target.value)} />
          </FormField>
          <FormField label="Requested Delivery">
            <Input type="date" value={data.RequestedDeliveryDate ? new Date(data.RequestedDeliveryDate).toISOString().split('T')[0] : ''} onChange={e => set('RequestedDeliveryDate', e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <FormField label="Ship To Warehouse">
            <Input value={data.ShipToWarehouseId ?? ''} onChange={e => set('ShipToWarehouseId', e.target.value)} placeholder="WH-01" />
          </FormField>
          <FormField label="Currency">
            <div className="flex gap-2">
              <Input value={data.CurrencyCode ?? 'ETB'} onChange={e => set('CurrencyCode', e.target.value)} placeholder="ETB" className="w-24" />
              <Input type="number" value={data.CurrencyRate ?? ''} onChange={e => set('CurrencyRate', parseFloat(e.target.value) || undefined)} placeholder="Rate (e.g. 1.0)" />
            </div>
          </FormField>
        </div>
        <div className="mt-3">
          <FormField label="Ship To Address">
            <Textarea value={data.ShipToAddressText ?? ''} onChange={e => set('ShipToAddressText', e.target.value)} rows={2} placeholder="Delivery address" />
          </FormField>
        </div>
      </div>

      {/* Order lines */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Lines</p>
          <Btn variant="ghost" size="xs" icon={<Plus size={10} />} onClick={addLine}>Add Line</Btn>
        </div>
        {lines.length === 0 ? (
          <div className="py-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-center text-[11px] text-slate-400">
            <Package size={20} className="mx-auto mb-2 text-slate-300" />
            No lines added yet
          </div>
        ) : (
          <>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-1 px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                <div className="col-span-2">Item ID</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1" />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-52 overflow-y-auto">
                {lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 px-2 py-1.5 items-center">
                    <div className="col-span-2"><Input value={line.ItemId} onChange={e => updateLine(idx, 'ItemId', e.target.value)} placeholder="Item ID" className="h-7 text-[11px] px-2" /></div>
                    <div className="col-span-2"><Input value={line.ItemType} onChange={e => updateLine(idx, 'ItemType', e.target.value)} placeholder="Type" className="h-7 text-[11px] px-2" /></div>
                    <div className="col-span-3"><Input value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} placeholder="Description" className="h-7 text-[11px] px-2" /></div>
                    <div className="col-span-1"><Input type="number" value={line.OrderedQty} onChange={e => updateLine(idx, 'OrderedQty', parseFloat(e.target.value) || 0)} onBlur={e => updateLine(idx, 'OrderedQty', evalField(e.target.value))} className="h-7 text-[11px] px-2 text-right" /></div>
                    <div className="col-span-2"><Input type="number" value={line.SalePriceSnapshot} onChange={e => updateLine(idx, 'SalePriceSnapshot', parseFloat(e.target.value) || 0)} onBlur={e => updateLine(idx, 'SalePriceSnapshot', evalField(e.target.value))} className="h-7 text-[11px] px-2 text-right" /></div>
                    <div className="col-span-1 text-right text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 pr-1">{fmtNum(line.OrderedQty * line.SalePriceSnapshot)}</div>
                    <div className="col-span-1 flex justify-end"><button onClick={() => removeLine(idx)} className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"><X size={11} /></button></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-2 px-3">
              <div className="text-right">
                <p className="text-[9px] text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-base font-black font-mono text-slate-800 dark:text-white">{fmtNum(lineTotal)}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <FormField label="Notes">
        <Textarea value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Additional notes, instructions…" />
      </FormField>
    </div>
  );
};

/* ─── Main page ─── */
const SalesOrders: React.FC = () => {
  usePageTitle('Sales Orders');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<SalesOrder> }>({ open: false, data: {} });
  const [drawer, setDrawer] = useState<{ open: boolean; data: SalesOrder | null }>({ open: false, data: null });
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [salesTypeFilter, setSalesTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [viewMode, setViewMode] = useState<PipelineView>('list');
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(['OrderNumber', 'CustomerName', 'OrderDate', 'RequestedDeliveryDate', 'OrderTotal', 'status']));
  const searchRef = useRef<HTMLInputElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  const { rows, total, page, loading, saving, save, refetch, setPage } = useApiCrud<SalesOrder>({
    endpoint: '/ovds/sales-orders',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  useEffect(() => { refetch(); }, [dateFrom, dateTo, selectedCompanyId, refetch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); setModal({ open: true, data: blankRef.current() }); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const activeFilterCount = [dateFrom, dateTo, salesTypeFilter, search].filter(Boolean).length;

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(r => r.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => [r.OrderNumber, r.CustomerName, r.CustomerId].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    if (salesTypeFilter) list = list.filter(r => r.SalesType === salesTypeFilter);
    if (dateFrom) list = list.filter(r => new Date(r.OrderDate) >= new Date(dateFrom));
    if (dateTo) list = list.filter(r => new Date(r.OrderDate) <= new Date(dateTo + 'T23:59:59'));
    return list;
  }, [rows, tab, search, salesTypeFilter, dateFrom, dateTo]);

  const orderTotal = (so: SalesOrder) => (so.OrderLines || []).reduce((s, l) => s + (l.OrderedQty * l.SalePriceSnapshot), 0);

  const stats = useMemo(() => {
    const totalVal = filtered.reduce((s, r) => s + orderTotal(r), 0);
    const byStatus = (s: string) => rows.filter(r => r.status === s);
    const delivered = byStatus('DELIVERED');
    const fulfilmentRate = rows.length > 0 ? Math.round((delivered.length / rows.length) * 100) : 0;
    return {
      total: rows.length,
      draft: byStatus('DRAFT').length,
      confirmed: byStatus('CONFIRMED').length,
      shipped: byStatus('SHIPPED').length,
      delivered: delivered.length,
      cancelled: byStatus('CANCELLED').length,
      totalVal,
      avgVal: filtered.length > 0 ? totalVal / filtered.length : 0,
      pending: byStatus('DRAFT').length + byStatus('CONFIRMED').length,
      fulfilmentRate,
    };
  }, [rows, filtered]);

  const customerInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
    setSelectAll(false);
  };

  const toggleSelectAll = () => {
    if (selectAll) { setSelectedIds(new Set()); } else { setSelectedIds(new Set(filtered.map(r => r.id))); }
    setSelectAll(!selectAll);
  };

  const bulkStatusUpdate = async (status: string) => {
    if (selectedIds.size === 0) return;
    try {
      const { default: api } = await import('../services/api');
      await api.patch('/ovds/sales-orders/bulk-status', { ids: Array.from(selectedIds), status });
      toast.success(`Updated ${selectedIds.size} order(s) to ${status}`);
      setSelectedIds(new Set());
      setSelectAll(false);
      refetch();
    } catch { toast.error('Failed to update orders'); }
  };

  const blank = useCallback(() => ({
    OrderNumber: `SO-${new Date().getFullYear()}-${String(rows.length + 1).padStart(3, '0')}`,
    status: 'DRAFT',
    OrderDate: new Date().toISOString().split('T')[0],
    CurrencyCode: 'ETB',
    OrderLines: [{ LineNo: 1, ItemId: '', ItemType: '', description: '', OrderedQty: 1, UnitOfMeasure: 'PCS', SalePriceSnapshot: 0, DiscountType: 'FIXED', DiscountValue: 0, OrderedWeight: 0, OrderedCubic: 0 }],
  }), [rows.length]);

  const blankRef = useRef(blank);
  blankRef.current = blank;

  const handleSave = async (data: Partial<SalesOrder>) => {
    try {
      const lines = data.OrderLines?.map((l: any) => ({
        LineNo: l.LineNo, ItemId: l.ItemId, ItemType: l.ItemType,
        description: l.description, OrderedQty: l.OrderedQty,
        UnitOfMeasure: l.UnitOfMeasure, SalePriceSnapshot: l.SalePriceSnapshot,
        DiscountType: l.DiscountType, DiscountValue: l.DiscountValue,
        OrderedWeight: l.OrderedWeight, OrderedCubic: l.OrderedCubic,
      })) || [];
      const totalAmount = lines.reduce((s: number, l: any) => s + (l.OrderedQty * l.SalePriceSnapshot), 0);
      await save({ OrderNumber: data.OrderNumber, CustomerId: data.CustomerId, CustomerName: data.CustomerName, OrderDate: data.OrderDate, RequestedDeliveryDate: data.RequestedDeliveryDate, SalesType: data.SalesType, CurrencyCode: data.CurrencyCode, CurrencyRate: data.CurrencyRate, ShipToAddressText: data.ShipToAddressText, ShipToWarehouseId: data.ShipToWarehouseId, notes: data.notes, totalAmount, lines } as any);
      toast.success(data.id ? 'Sales order updated' : 'Sales order created');
      setModal({ open: false, data: {} });
    } catch { toast.error('Failed to save sales order'); }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/ovds/sales-orders/${id}/status`, { status });
      toast.success('Status updated');
      refetch();
    } catch { toast.error('Failed to update status'); }
  };

  const handleViewOrder = async (so: SalesOrder) => {
    setDrawerLoading(true);
    setDrawer({ open: true, data: so });
    try {
      const { default: api } = await import('../services/api');
      const res = await api.get(`/ovds/sales-orders/${so.id}`);
      setDrawer({ open: true, data: res.data?.data ?? res.data });
    } catch { toast.error('Failed to load order details'); }
    finally { setDrawerLoading(false); }
  };

  const handleExportCSV = () => {
    const header = 'Order Number,Customer,Order Date,Delivery Date,Status,Total,Currency\n';
    const rowsCsv = filtered.map(r => `"${r.OrderNumber}","${r.CustomerName ?? ''}","${r.OrderDate}","${r.RequestedDeliveryDate ?? ''}","${r.status}","${fmtNum(orderTotal(r))}","${r.CurrencyCode ?? ''}"`).join('\n');
    downloadCSV(header + rowsCsv, `sales_orders_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Exported to CSV');
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (v: any) => DOMPurify.sanitize(String(v ?? ''));
    const rowsHtml = filtered.map(r => `<tr><td>${esc(r.OrderNumber)}</td><td>${esc(r.CustomerName ?? '—')}</td><td>${fmtDate(r.OrderDate)}</td><td>${r.RequestedDeliveryDate ? fmtDate(r.RequestedDeliveryDate) : '—'}</td><td>${esc(r.status)}</td><td>${fmtNum(orderTotal(r))}</td><td>${esc(r.CurrencyCode ?? '')}</td></tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Sales Orders</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;font-size:11px}h1{font-size:16px;font-weight:900;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#f8fafc;padding:8px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #e2e8f0}td{padding:6px 8px;border-bottom:1px solid #f1f5f9;font-size:10px}</style></head><body><h1>Sales Orders</h1><table><thead><tr><th>Order Number</th><th>Customer</th><th>Order Date</th><th>Delivery Date</th><th>Status</th><th>Total</th><th>Currency</th></tr></thead><tbody>${rowsHtml}</tbody></table><p style="margin-top:16px;font-size:9px;color:#94a3b8">Generated ${new Date().toLocaleString()}</p></body></html>`);
    w.document.close(); w.print(); w.addEventListener('afterprint', () => w.close());
  };

  const handleEmailOrder = async (so: SalesOrder) => {
    try {
      const api = (await import('../services/api')).default;
      await api.post(`/ovds/sales-orders/${so.id}/email`);
      toast.success(`Email sent for ${so.OrderNumber}`);
    } catch { toast.error('Failed to send email'); }
  };

  const handleDuplicateOrder = async (so: SalesOrder) => {
    try {
      const duplicate = { ...so, id: undefined, OrderNumber: `SO-${new Date().getFullYear()}-${String(rows.length + 1).padStart(3, '0')}`, status: 'DRAFT', createdAt: new Date().toISOString() };
      delete (duplicate as any).id;
      await save(duplicate as any);
      toast.success(`Duplicated ${so.OrderNumber}`);
      refetch();
    } catch { toast.error('Failed to duplicate order'); }
  };

  const handleConvertToInvoice = async (so: SalesOrder) => {
    try {
      const api = (await import('../services/api')).default;
      await api.post(`/ovds/sales-orders/${so.id}/convert-to-invoice`);
      toast.success(`Converted ${so.OrderNumber} to invoice`);
      refetch();
    } catch { toast.error('Failed to convert to invoice'); }
  };

  const clearFilters = () => { setDateFrom(''); setDateTo(''); setSearch(''); setSalesTypeFilter(''); };

  return (
    <AppPage
      title="Sales Orders"
      subtitle="Track and fulfil customer orders from confirmation to delivery"
      icon={<ShoppingCart size={18} />}
      crumbs={[{ label: 'Sales Orders' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL', label: 'All', count: rows.length },
            { key: 'DRAFT', label: 'Draft', count: stats.draft },
            { key: 'CONFIRMED', label: 'Confirmed', count: stats.confirmed },
            { key: 'SHIPPED', label: 'Shipped', count: stats.shipped },
            { key: 'DELIVERED', label: 'Delivered', count: stats.delivered },
            { key: 'CANCELLED', label: 'Cancelled', count: stats.cancelled },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="ghost" icon={<Printer size={11} />} onClick={handlePrint}>Print</Btn>
          <Btn variant="ghost" icon={<ArrowUpRight size={11} />} onClick={handleExportCSV}>Export</Btn>
          {can('inventory:write' as any) && (
            <Btn variant="primary" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: blank() })}>New Order</Btn>
          )}
        </>
      }
    >
      {/* ── KPI strip ── */}
      {loading ? (
        <Skeleton.StatsRow count={5} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard title="Total Orders" amount={stats.total.toString()} percentage={0} isPositive={true} variant="highlight-indigo" />
          <MetricCard title="Pending" amount={stats.pending.toString()} percentage={0} isPositive={stats.pending === 0} variant="highlight-amber" />
          <MetricCard title="In Transit" amount={stats.shipped.toString()} percentage={0} isPositive={true} variant="highlight-purple" />
          <MetricCard title="Fulfilled" amount={stats.delivered.toString()} percentage={0} isPositive={true} variant="highlight-emerald" />
          <MetricCard title="Pipeline Value" amount={fmtNum(stats.totalVal)} percentage={0} isPositive={true} variant="highlight-success" />
        </div>
      )}

      {/* ── Fulfilment rate bar ── */}
      {!loading && rows.length > 0 && (
        <div className="mt-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <TrendingUp size={14} className="text-emerald-500" />
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Fulfilment Rate</span>
          </div>
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${stats.fulfilmentRate}%` }} />
          </div>
          <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 shrink-0 tabular-nums">{stats.fulfilmentRate}%</span>
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-400 font-mono shrink-0">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" />{stats.draft}d</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" />{stats.confirmed}c</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400" />{stats.shipped}s</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />{stats.delivered}✓</span>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="ovds-toolbar rounded-2xl mt-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative group">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders…"
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-bold outline-none focus:ring-4 focus:ring-teal-400/10 focus:border-teal-400 w-56 transition-all"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[12px] font-bold transition-all',
              showFilters || activeFilterCount > 0
                ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 hover:border-slate-300',
            )}
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-teal-500 text-white text-[9px] font-black flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <X size={11} />Clear
            </button>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <PipelineViewToggle value={viewMode} onChange={setViewMode} options={['list', 'kanban', 'funnel']} />
            <div className="relative" ref={columnRef}>
              <button onClick={() => setShowColumns(!showColumns)} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all" title="Columns">
                <Columns3 size={15} />
              </button>
              {showColumns && (
                <ColumnToggle
                  columns={[
                    { key: 'OrderNumber', label: 'Order' },
                    { key: 'CustomerName', label: 'Customer' },
                    { key: 'OrderDate', label: 'Date' },
                    { key: 'RequestedDeliveryDate', label: 'Delivery' },
                    { key: 'OrderTotal', label: 'Total' },
                    { key: 'status', label: 'Status' },
                  ]}
                  storageKey="sales-orders-list"
                  onChange={setVisibleColumns}
                />
              )}
            </div>
          </div>
        </div>

        {/* Expanded filter row */}
        {showFilters && (
          <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2">
              <CalendarDays size={13} className="text-slate-400" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12px] font-bold outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all" />
              <span className="text-slate-300 text-[11px]">—</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12px] font-bold outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all" />
            </div>
            <select value={salesTypeFilter} onChange={e => setSalesTypeFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12px] font-bold outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 text-slate-600 dark:text-slate-300 transition-all">
              <option value="">All Sales Types</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT">Credit</option>
              <option value="CONTRACT">Contract</option>
              <option value="CONSIGNMENT">Consignment</option>
            </select>
          </div>
        )}

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700 animate-in fade-in duration-150">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">{selectedIds.size} selected</span>
            <Btn variant="ghost" size="xs" icon={<CheckCircle2 size={10} />} onClick={() => bulkStatusUpdate('CONFIRMED')}>Confirm</Btn>
            <Btn variant="ghost" size="xs" icon={<Package size={10} />} onClick={() => bulkStatusUpdate('SHIPPED')}>Ship</Btn>
            <Btn variant="ghost" size="xs" icon={<Truck size={10} />} onClick={() => bulkStatusUpdate('DELIVERED')}>Deliver</Btn>
            <Btn variant="ghost" size="xs" icon={<XCircle size={10} />} onClick={() => bulkStatusUpdate('CANCELLED')}>Cancel</Btn>
            <button onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }} className="ml-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold transition-colors">Clear</button>
          </div>
        )}
      </div>

      {/* ── Kanban view ── */}
      {viewMode === 'kanban' && (
        <KanbanBoard
          columns={[
            { key: 'DRAFT', label: 'Draft', color: 'text-slate-500', headerBg: 'bg-slate-50', accentColor: '#94a3b8', dotColor: 'bg-slate-400', items: filtered.filter(r => r.status === 'DRAFT'), totalAmount: fmtNum(filtered.filter(r => r.status === 'DRAFT').reduce((s, r) => s + orderTotal(r), 0)) },
            { key: 'CONFIRMED', label: 'Confirmed', color: 'text-sky-600', headerBg: 'bg-sky-50/50', accentColor: '#38bdf8', dotColor: 'bg-sky-400', items: filtered.filter(r => r.status === 'CONFIRMED'), totalAmount: fmtNum(filtered.filter(r => r.status === 'CONFIRMED').reduce((s, r) => s + orderTotal(r), 0)) },
            { key: 'SHIPPED', label: 'Shipped', color: 'text-violet-600', headerBg: 'bg-violet-50/50', accentColor: '#818cf8', dotColor: 'bg-violet-400', items: filtered.filter(r => r.status === 'SHIPPED'), totalAmount: fmtNum(filtered.filter(r => r.status === 'SHIPPED').reduce((s, r) => s + orderTotal(r), 0)) },
            { key: 'DELIVERED', label: 'Delivered', color: 'text-emerald-600', headerBg: 'bg-emerald-50/50', accentColor: '#00E784', dotColor: 'bg-emerald-400', items: filtered.filter(r => r.status === 'DELIVERED'), totalAmount: fmtNum(filtered.filter(r => r.status === 'DELIVERED').reduce((s, r) => s + orderTotal(r), 0)) },
            { key: 'CANCELLED', label: 'Cancelled', color: 'text-rose-600', headerBg: 'bg-rose-50/50', accentColor: '#f43f5e', dotColor: 'bg-rose-400', items: filtered.filter(r => r.status === 'CANCELLED'), totalAmount: fmtNum(filtered.filter(r => r.status === 'CANCELLED').reduce((s, r) => s + orderTotal(r), 0)) },
          ].filter(col => col.items.length > 0 || tab !== 'ALL')}
          renderCard={(so) => {
            const tot = orderTotal(so);
            const lines = so.OrderLines?.length ?? 0;
            return (
              <PipelineCard
                title={so.OrderNumber}
                subtitle={so.CustomerName ?? 'No customer'}
                amount={fmtNum(tot)}
                status={so.status}
                onClick={() => handleViewOrder(so)}
                actions={
                  <div className="flex items-center gap-0.5">
                    {so.status === 'DRAFT' && <button onClick={e => { e.stopPropagation(); handleStatusUpdate(so.id, 'CONFIRMED'); }} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all" title="Confirm"><CheckCircle2 size={13} /></button>}
                    {so.status === 'CONFIRMED' && <button onClick={e => { e.stopPropagation(); handleStatusUpdate(so.id, 'SHIPPED'); }} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all" title="Ship"><Package size={13} /></button>}
                    {so.status === 'SHIPPED' && <button onClick={e => { e.stopPropagation(); handleStatusUpdate(so.id, 'DELIVERED'); }} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Deliver"><Truck size={13} /></button>}
                    <button onClick={e => { e.stopPropagation(); handleViewOrder(so); }} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all" title="View"><Eye size={13} /></button>
                  </div>
                }
                meta={[
                  { icon: <CalendarDays size={10} />, label: fmtDate(so.OrderDate) },
                  { icon: <Package size={10} />, label: `${lines} line${lines !== 1 ? 's' : ''}` },
                  ...(so.RequestedDeliveryDate ? [{ icon: <Truck size={10} />, label: fmtDate(so.RequestedDeliveryDate) }] : []),
                ]}
              />
            );
          }}
          emptyLabel="No orders in this stage"
        />
      )}

      {/* ── Funnel view ── */}
      {viewMode === 'funnel' && (
        <PipelineFunnel
          className="mt-4"
          title="Sales Order Pipeline"
          stages={(() => {
            const totalCount = Math.max(stats.total, 1);
            return [
              { label: 'Draft',     count: stats.draft,     color: '#94a3b8', pct: Math.round((stats.draft     / totalCount) * 100), amount: fmtNum(filtered.filter(r => r.status === 'DRAFT').reduce((s, r)     => s + orderTotal(r), 0)) },
              { label: 'Confirmed', count: stats.confirmed, color: '#38bdf8', pct: Math.round((stats.confirmed / totalCount) * 100), amount: fmtNum(filtered.filter(r => r.status === 'CONFIRMED').reduce((s, r) => s + orderTotal(r), 0)) },
              { label: 'Shipped',   count: stats.shipped,   color: '#818cf8', pct: Math.round((stats.shipped   / totalCount) * 100), amount: fmtNum(filtered.filter(r => r.status === 'SHIPPED').reduce((s, r)   => s + orderTotal(r), 0)) },
              { label: 'Delivered', count: stats.delivered, color: '#00E784', pct: Math.round((stats.delivered / totalCount) * 100), amount: fmtNum(filtered.filter(r => r.status === 'DELIVERED').reduce((s, r) => s + orderTotal(r), 0)) },
              { label: 'Cancelled', count: stats.cancelled, color: '#f43f5e', pct: Math.round((stats.cancelled / totalCount) * 100), amount: fmtNum(filtered.filter(r => r.status === 'CANCELLED').reduce((s, r) => s + orderTotal(r), 0)) },
            ];
          })()}
        />
      )}

      {/* ── List view ── */}
      {viewMode === 'list' && (
        <div className="ovds-doc-shell mt-4">
          <table className="ovds-table w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm">
                <th className="w-10 px-3 py-3 text-center">
                  <input type="checkbox" checked={selectAll && filtered.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                </th>
                {visibleColumns.has('OrderNumber') && <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order</th>}
                {visibleColumns.has('CustomerName') && <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</th>}
                {visibleColumns.has('OrderDate') && <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ordered</th>}
                {visibleColumns.has('RequestedDeliveryDate') && <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Due</th>}
                {visibleColumns.has('OrderTotal') && <th className="text-right px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total</th>}
                {visibleColumns.has('status') && <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Progress</th>}
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16">
                    <AppEmpty
                      icon={<ShoppingCart size={40} className="text-slate-200 dark:text-slate-700" />}
                      title={tab === 'ALL' ? 'No sales orders yet' : `No ${tab.toLowerCase()} orders`}
                      description={tab === 'ALL' ? 'Create a new order to get started.' : `No orders currently in ${tab.toLowerCase()} status.`}
                    />
                  </td>
                </tr>
              ) : filtered.map(so => {
                const isSelected = selectedIds.has(so.id);
                const total = orderTotal(so);
                const isOverdue = so.RequestedDeliveryDate && so.status !== 'DELIVERED' && so.status !== 'CANCELLED' && new Date(so.RequestedDeliveryDate) < new Date();
                return (
                  <tr
                    key={so.id}
                    className={cn('border-b border-slate-50 dark:border-slate-700/50 transition-colors group cursor-pointer',
                      isSelected ? 'bg-emerald-50/60 dark:bg-emerald-900/10' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40')}
                    onClick={() => handleViewOrder(so)}
                  >
                    <td className="px-3 py-3.5 text-center" onClick={e => { e.stopPropagation(); toggleSelect(so.id); }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(so.id)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    </td>
                    {visibleColumns.has('OrderNumber') && (
                      <td className="px-4 py-3.5">
                        <p className="text-[12px] font-mono font-bold text-slate-800 dark:text-slate-200">{so.OrderNumber}</p>
                        {so.SalesType && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{so.SalesType}</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.has('CustomerName') && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[9px] font-black shrink-0 ring-1 ring-emerald-200/50 dark:ring-emerald-700/30">
                            {customerInitials(so.CustomerName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{so.CustomerName ?? '—'}</p>
                            {so.CustomerId && <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{so.CustomerId}</p>}
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.has('OrderDate') && (
                      <td className="px-4 py-3.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">{fmtDate(so.OrderDate)}</td>
                    )}
                    {visibleColumns.has('RequestedDeliveryDate') && (
                      <td className="px-4 py-3.5">
                        {so.RequestedDeliveryDate ? (
                          <span className={cn('text-[11px] font-mono whitespace-nowrap', isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400')}>
                            {isOverdue && <AlertCircle size={10} className="inline mr-1 mb-0.5" />}
                            {fmtDate(so.RequestedDeliveryDate)}
                          </span>
                        ) : <span className="text-slate-300 dark:text-slate-600 text-[11px]">—</span>}
                      </td>
                    )}
                    {visibleColumns.has('OrderTotal') && (
                      <td className="px-4 py-3.5 text-right">
                        <p className="text-[12px] font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{fmtNum(total)}</p>
                        {so.CurrencyCode && so.CurrencyCode !== 'ETB' && <p className="text-[9px] text-slate-400 font-mono text-right">{so.CurrencyCode}</p>}
                      </td>
                    )}
                    {visibleColumns.has('status') && (
                      <td className="px-4 py-3.5">
                        <OrderStatusStepper status={so.status} />
                      </td>
                    )}
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {so.status === 'DRAFT' && <button onClick={() => handleStatusUpdate(so.id, 'CONFIRMED')} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/30 transition-all" title="Confirm"><CheckCircle2 size={13} /></button>}
                        {so.status === 'CONFIRMED' && <button onClick={() => handleStatusUpdate(so.id, 'SHIPPED')} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/30 transition-all" title="Ship"><Package size={13} /></button>}
                        {so.status === 'SHIPPED' && <button onClick={() => handleStatusUpdate(so.id, 'DELIVERED')} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 transition-all" title="Deliver"><Truck size={13} /></button>}
                        {(so.status === 'DRAFT' || so.status === 'CONFIRMED') && can('inventory:write' as any) && <button onClick={e => { e.stopPropagation(); setModal({ open: true, data: { ...so } }); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 transition-all" title="Edit"><Edit2 size={13} /></button>}
                        <button onClick={() => handleEmailOrder(so)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/30 transition-all" title="Email"><Mail size={13} /></button>
                        <button onClick={() => handleDuplicateOrder(so)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 transition-all" title="Duplicate"><Copy size={13} /></button>
                        {(so.status === 'CONFIRMED' || so.status === 'SHIPPED' || so.status === 'DELIVERED') && <button onClick={() => handleConvertToInvoice(so)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 transition-all" title="Convert to Invoice"><FileText size={13} /></button>}
                        {so.status === 'DRAFT' && <button onClick={async () => { if (await confirm({ title: `Cancel "${so.OrderNumber}"?` })) handleStatusUpdate(so.id, 'CANCELLED'); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 transition-all" title="Cancel"><XCircle size={13} /></button>}
                        {so.status === 'DRAFT' && <button onClick={async e => { e.stopPropagation(); if (await confirm({ title: `Delete "${so.OrderNumber}"?` })) { try { const api = (await import('../services/api')).default; await api.delete(`/ovds/sales-orders/${so.id}`); toast.success(`Deleted`); refetch(); } catch { toast.error('Failed to delete'); } } }} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 transition-all" title="Delete"><Trash2 size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > 25 && <Pagination page={page} total={total} pageSize={25} onPageChange={setPage} />}

      {/* ── Create / Edit modal ── */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: {} })} title={modal.data.id ? `Edit — ${modal.data.OrderNumber}` : 'New Sales Order'} width="max-w-4xl">
        {modal.open && (
          <SalesOrderForm data={modal.data} onChange={d => setModal(prev => ({ ...prev, data: { ...prev.data, ...d } }))} />
        )}
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2">
            {modal.data.id && (
              <>
                <Btn variant="ghost" size="sm" icon={<Mail size={11} />} onClick={() => handleEmailOrder(modal.data as SalesOrder)}>Email</Btn>
                <Btn variant="ghost" size="sm" icon={<Copy size={11} />} onClick={() => handleDuplicateOrder(modal.data as SalesOrder)}>Duplicate</Btn>
                {(modal.data.status === 'CONFIRMED' || modal.data.status === 'SHIPPED' || modal.data.status === 'DELIVERED') && (
                  <Btn variant="ghost" size="sm" icon={<FileText size={11} />} onClick={() => handleConvertToInvoice(modal.data as SalesOrder)}>Convert to Invoice</Btn>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => setModal({ open: false, data: {} })}>Cancel</Btn>
            <Btn variant="primary" onClick={() => handleSave(modal.data)} disabled={saving || !modal.data.OrderNumber}>
              {saving ? 'Saving…' : modal.data.id ? 'Save Changes' : 'Create Order'}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* ── Detail drawer ── */}
      {drawer.open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setDrawer({ open: false, data: null })} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col max-h-screen">

            {/* Drawer header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart size={14} className="text-slate-400 shrink-0" />
                    <h3 className="text-[13px] font-black text-slate-800 dark:text-white truncate">{drawer.data?.OrderNumber}</h3>
                  </div>
                  <div className="mt-2">
                    <OrderStatusStepper status={drawer.data?.status ?? 'DRAFT'} />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {drawer.data && (drawer.data.status === 'DRAFT' || drawer.data.status === 'CONFIRMED') && can('inventory:write' as any) && (
                    <button onClick={() => { setDrawer({ open: false, data: null }); setModal({ open: true, data: { ...drawer.data } }); }} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                      <Edit2 size={11} />Edit
                    </button>
                  )}
                  <button onClick={() => setDrawer({ open: false, data: null })} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    <XCircle size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              {drawerLoading ? (
                <div className="p-6"><Skeleton.Table rows={8} cols={4} /></div>
              ) : drawer.data ? (() => {
                const d = drawer.data;
                const lines = d.OrderLines || [];
                const total = orderTotal(d);
                const difotData = d.DeliveryPerformance?.[0];
                return (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {/* Summary strip */}
                    <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                        <p className="text-[12px] font-bold text-slate-800 dark:text-white">{d.CustomerName ?? '—'}</p>
                        {d.CustomerId && <p className="text-[10px] text-slate-400 font-mono">{d.CustomerId}</p>}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Date</p>
                        <p className="text-[12px] font-bold text-slate-800 dark:text-white font-mono">{fmtDate(d.OrderDate)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery Due</p>
                        <p className={cn('text-[12px] font-bold font-mono', d.RequestedDeliveryDate && d.status !== 'DELIVERED' && d.status !== 'CANCELLED' && new Date(d.RequestedDeliveryDate) < new Date() ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white')}>
                          {d.RequestedDeliveryDate ? fmtDate(d.RequestedDeliveryDate) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Total</p>
                        <p className="text-[14px] font-black text-slate-800 dark:text-white font-mono">{fmtNum(total)}</p>
                        {d.CurrencyCode && d.CurrencyCode !== 'ETB' && <p className="text-[9px] text-slate-400 font-mono">{d.CurrencyCode}</p>}
                      </div>
                    </div>

                    {/* Meta row */}
                    {(d.SalesType || d.ShipToWarehouseId || d.ShipToAddressText) && (
                      <div className="px-6 py-3 flex flex-wrap gap-4">
                        {d.SalesType && (
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sales Type</p>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300">{d.SalesType}</span>
                          </div>
                        )}
                        {d.ShipToWarehouseId && (
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Warehouse</p>
                            <p className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">{d.ShipToWarehouseId}</p>
                          </div>
                        )}
                        {d.ShipToAddressText && (
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ship To</p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-xs">{d.ShipToAddressText}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DIFOT badge */}
                    {difotData && (
                      <div className="px-6 py-3 flex items-center gap-3">
                        <BarChart3 size={13} className="text-slate-400 shrink-0" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Delivery Performance</span>
                        <DifotBadge inFull={difotData.IsDeliveredInFull} onTime={difotData.IsDeliveredOnTime} />
                        {difotData.ActualDeliveryDate && (
                          <span className="text-[10px] text-slate-400 font-mono">Actual: {fmtDate(difotData.ActualDeliveryDate)}</span>
                        )}
                      </div>
                    )}

                    {/* Order lines table */}
                    <div className="px-6 py-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Order Lines <span className="ml-1 text-slate-300 dark:text-slate-600">({lines.length})</span>
                      </p>
                      {lines.length === 0 ? (
                        <div className="py-6 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          No order lines
                        </div>
                      ) : (
                        <div className="rounded-xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/80">
                                <th className="text-left px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">#</th>
                                <th className="text-left px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                                <th className="text-left px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                <th className="text-right px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                <th className="text-right px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                                <th className="text-right px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                              {lines.map(line => (
                                <tr key={line.LineNo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                  <td className="px-3 py-2.5 text-[10px] text-slate-400 tabular-nums">{line.LineNo}</td>
                                  <td className="px-3 py-2.5">
                                    <p className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">{line.ItemId || '—'}</p>
                                    {line.ItemType && <p className="text-[9px] text-slate-400 mt-0.5">{line.ItemType}</p>}
                                  </td>
                                  <td className="px-3 py-2.5 text-[11px] text-slate-600 dark:text-slate-400 max-w-[160px] truncate">{line.description || '—'}</td>
                                  <td className="px-3 py-2.5 text-right text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">{line.OrderedQty} {line.UnitOfMeasure ?? ''}</td>
                                  <td className="px-3 py-2.5 text-right text-[11px] font-mono text-slate-600 dark:text-slate-400 tabular-nums">{fmtNum(line.SalePriceSnapshot)}</td>
                                  <td className="px-3 py-2.5 text-right text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">{fmtNum(line.OrderedQty * line.SalePriceSnapshot)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 dark:bg-slate-800/60 border-t-2 border-slate-100 dark:border-slate-700">
                                <td colSpan={5} className="px-3 py-2.5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Order Total</td>
                                <td className="px-3 py-2.5 text-right text-[13px] font-black font-mono text-slate-800 dark:text-white">{fmtNum(total)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Dispatches */}
                    {d.dispatches && d.dispatches.length > 0 && (
                      <div className="px-6 py-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                          Dispatches <span className="ml-1 text-slate-300 dark:text-slate-600">({d.dispatches.length})</span>
                        </p>
                        <div className="space-y-2">
                          {d.dispatches.map((disp: any) => (
                            <div key={disp.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 ring-1 ring-slate-100 dark:ring-slate-700">
                              <div className="flex items-center gap-3">
                                <TruckIcon size={13} className="text-violet-500 shrink-0" />
                                <div>
                                  <p className="text-[11px] font-bold text-slate-800 dark:text-white">{disp.DispatchNumber ?? disp.id}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{disp.DispatchDate ? fmtDate(disp.DispatchDate) : '—'}</p>
                                </div>
                              </div>
                              <PipelineBadge status={disp.status} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delivery performance full list */}
                    {d.DeliveryPerformance && d.DeliveryPerformance.length > 1 && (
                      <div className="px-6 py-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Delivery Performance</p>
                        <div className="space-y-2">
                          {d.DeliveryPerformance.map((dp: any, i: number) => (
                            <div key={dp.id ?? i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-2.5 ring-1 ring-slate-100 dark:ring-slate-700 text-[11px]">
                              <div className="flex gap-3 flex-1 min-w-0">
                                <div><span className="text-slate-400">Promised </span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">{dp.PromisedDeliveryDate ? fmtDate(dp.PromisedDeliveryDate) : '—'}</span></div>
                                <div><span className="text-slate-400">Actual </span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">{dp.ActualDeliveryDate ? fmtDate(dp.ActualDeliveryDate) : '—'}</span></div>
                              </div>
                              <DifotBadge inFull={dp.IsDeliveredInFull} onTime={dp.IsDeliveredOnTime} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Credit notes */}
                    {d.CreditNotes && d.CreditNotes.length > 0 && (
                      <div className="px-6 py-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Credit Notes</p>
                        <div className="space-y-2">
                          {d.CreditNotes.map((cn: any) => (
                            <div key={cn.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 ring-1 ring-slate-100 dark:ring-slate-700">
                              <div>
                                <p className="text-[11px] font-bold text-slate-800 dark:text-white">{cn.CreditNoteNo ?? cn.id}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{cn.reason ?? '—'}</p>
                              </div>
                              <span className={cn(`text-[10px] font-black`, cn.status === 'POSTED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>{cn.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {d.notes && (
                      <div className="px-6 py-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                        <p className="text-[12px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{d.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })() : null}
            </div>

            {/* Drawer footer actions */}
            {drawer.data && !drawerLoading && (
              <div className="shrink-0 px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 flex-wrap">
                {drawer.data.status === 'DRAFT' && <Btn variant="ghost" size="sm" icon={<CheckCircle2 size={11} />} onClick={() => { handleStatusUpdate(drawer.data!.id, 'CONFIRMED'); setDrawer(p => ({ ...p, data: p.data ? { ...p.data, status: 'CONFIRMED' } : null })); }}>Confirm</Btn>}
                {drawer.data.status === 'CONFIRMED' && <Btn variant="ghost" size="sm" icon={<Package size={11} />} onClick={() => { handleStatusUpdate(drawer.data!.id, 'SHIPPED'); setDrawer(p => ({ ...p, data: p.data ? { ...p.data, status: 'SHIPPED' } : null })); }}>Mark Shipped</Btn>}
                {drawer.data.status === 'SHIPPED' && <Btn variant="ghost" size="sm" icon={<Truck size={11} />} onClick={() => { handleStatusUpdate(drawer.data!.id, 'DELIVERED'); setDrawer(p => ({ ...p, data: p.data ? { ...p.data, status: 'DELIVERED' } : null })); }}>Mark Delivered</Btn>}
                {(drawer.data.status === 'CONFIRMED' || drawer.data.status === 'SHIPPED' || drawer.data.status === 'DELIVERED') && <Btn variant="ghost" size="sm" icon={<FileText size={11} />} onClick={() => handleConvertToInvoice(drawer.data!)}>Convert to Invoice</Btn>}
                <Btn variant="ghost" size="sm" icon={<Mail size={11} />} onClick={() => handleEmailOrder(drawer.data!)}>Email</Btn>
                <Btn variant="ghost" size="sm" icon={<Copy size={11} />} onClick={() => handleDuplicateOrder(drawer.data!)}>Duplicate</Btn>
                <Btn variant="ghost" size="sm" icon={<Printer size={11} />} onClick={handlePrint}>Print</Btn>
              </div>
            )}
          </div>
        </div>
      )}
    </AppPage>
  );
};

export default SalesOrders;
