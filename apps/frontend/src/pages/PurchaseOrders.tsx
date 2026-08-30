/**
 * PurchaseOrders — ovds-style PO management
 * AppPage · AppKpi · AppTable · useApiCrud
 * Ethiopian VAT · WHT · ERCA compliance
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  ClipboardList, Plus, Edit2, Trash2, Download, RefreshCw,
  Send, CheckCircle2, XCircle, Building2, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { confirm } from '../utils/confirm';
import { fmtETB } from '../utils/ethiopianTax';
import { evalMath } from '@ovds/ui';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Textarea,
  SearchBar, Amount, EmptyState, Pagination,
} from '../components/ui';

interface PurchaseOrderLine {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId?: string;
  vendorName?: string;
  status: string;
  totalAmount: number;
  currencyCode?: string;
  expectedDelivery?: string;
  notes?: string;
  items?: PurchaseOrderLine[];
  companyId?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

type FilterTab = 'ALL' | 'DRAFT' | 'SENT' | 'APPROVED' | 'RECEIVED' | 'REJECTED';

const POForm: React.FC<{ data: Partial<PurchaseOrder>; onChange: (d: Partial<PurchaseOrder>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof PurchaseOrder, v: any) => onChange({ ...data, [k]: v });

  const items = data.items || [];

  const updateItem = (index: number, field: keyof PurchaseOrderLine, value: any) => {
    const newItems = [...items];
    let finalValue = value;
    if (field === 'quantity' || field === 'unitPrice') {
      const evaluated = evalMath(String(value));
      if (evaluated !== null) finalValue = evaluated;
      else finalValue = Number(value) || 0;
    }
    newItems[index] = { ...newItems[index], [field]: finalValue };
    
    // Recalculate total
    const newTotal = newItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    
    onChange({ ...data, items: newItems, totalAmount: newTotal });
  };

  const addItem = () => {
    onChange({
      ...data,
      items: [...items, { description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    onChange({ ...data, items: newItems, totalAmount: newTotal });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="PO Number" required>
          <Input
            value={data.poNumber ?? ''}
            onChange={e => set('poNumber', e.target.value.slice(0, 100).trimStart())}
            placeholder="PO-2026-001"
            maxLength={100}
          />
        </FormField>
        <FormField label="Vendor Name">
          <Input value={data.vendorName ?? ''} onChange={e => set('vendorName', e.target.value)} placeholder="Supplier name" />
        </FormField>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Items</label>
          <Btn variant="ghost" size="xs" icon={<Plus size={10} />} onClick={addItem}>Add Item</Btn>
        </div>
        
        {items.length === 0 ? (
          <div className="py-4 border-2 border-dashed border-slate-100 rounded-lg text-center text-[11px] text-slate-400">
            No items added yet
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start bg-white p-2 rounded-lg group">
                <div className="flex-1">
                  <Input 
                    value={item.description} 
                    onChange={e => updateItem(idx, 'description', e.target.value)} 
                    placeholder="Item description" 
                    className="bg-white"
                  />
                </div>
                <div className="w-20">
                  <Input 
                    type="text" 
                    value={item.quantity} 
                    onChange={e => updateItem(idx, 'quantity', e.target.value)} 
                    onBlur={e => updateItem(idx, 'quantity', e.target.value)}
                    placeholder="Qty" 
                    className="bg-white"
                  />
                </div>
                <div className="w-28">
                  <Input 
                    type="text" 
                    value={item.unitPrice} 
                    onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                    onBlur={e => updateItem(idx, 'unitPrice', e.target.value)}
                    placeholder="Price" 
                    className="bg-white"
                  />
                </div>
                <button 
                  onClick={() => removeItem(idx)}
                  className="mt-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Total Amount (ETB)" required>
          <Input 
            type="number" 
            step="0.01" 
            value={data.totalAmount ?? ''} 
            onChange={e => set('totalAmount', parseFloat(e.target.value) || 0)} 
            placeholder="0.00" 
            readOnly
            className="bg-white font-semibold"
          />
        </FormField>
        <FormField label="Expected Delivery">
          <Input type="date" value={data.expectedDelivery?.slice(0, 10) ?? ''} onChange={e => set('expectedDelivery', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Notes">
        <Textarea value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Delivery instructions, terms…" />
      </FormField>
    </div>
  );
};

const PurchaseOrders: React.FC = () => {
  usePageTitle('Purchase Orders');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<PurchaseOrder> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<PurchaseOrder>({
    endpoint: '/ovds/purchase-orders',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(p => p.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => [p.poNumber, p.vendorName].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total POs',  value: rows.length,                                                       color: 'emerald' as const },
    { label: 'Draft',      value: rows.filter(p => p.status === 'DRAFT').length,                     color: 'slate' as const },
    { label: 'Approved',   value: rows.filter(p => p.status === 'APPROVED').length,                  color: 'sky' as const },
    { label: 'Total Value',value: fmtETB(rows.reduce((s, p) => s + Number(p.totalAmount ?? 0), 0)), color: 'violet' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.poNumber?.trim()) { toast.error('PO number is required'); return; }
    
    // Validate items
    if (modal.data.items) {
      const invalid = modal.data.items.some(item => !item.description?.trim() || item.quantity <= 0);
      if (invalid) {
        toast.error('All items must have a description and quantity > 0');
        return;
      }
    }

    const payload = {
      ...modal.data,
    };
    
    // Ensure we don't send status if it's handled by transitions, 
    // although useApiCrud's sanitizePayload already does this.
    // Also ensure totalAmount is definitely a number.
    if (payload.totalAmount !== undefined) {
      payload.totalAmount = Number(payload.totalAmount);
    }

    const result = await save(payload as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleSend = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/ovds/purchase-orders/${id}`, { status: 'SENT' });
      toast.success('PO sent'); refetch();
    } catch { toast.error('Failed'); }
  };

  const handleApprove = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/ovds/purchase-orders/${id}/approve`);
      toast.success('PO approved'); refetch();
    } catch { toast.error('Failed to approve PO'); }
  };

  const handleReject = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/ovds/purchase-orders/${id}/reject`);
      toast.success('PO rejected'); refetch();
    } catch { toast.error('Failed to reject PO'); }
  };

  const handleConvertToBill = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.post(`/ovds/purchase-orders/${id}/convert-to-bill`);
      toast.success('PO converted to bill'); refetch();
    } catch { toast.error('Failed to convert PO to bill'); }
  };

  const handleExport = () => {
    const headers = 'PO Number,Vendor,Total,Status,Expected Delivery\n';
    const csvRows = filtered.map(p =>
      `"${p.poNumber}","${p.vendorName ?? ''}",${p.totalAmount},"${p.status}","${p.expectedDelivery ?? ''}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `purchase-orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const blankPO = () => ({
    poNumber: `PO-${new Date().getFullYear()}-${String(rows.length + 1).padStart(3, '0')}`,
    status: 'DRAFT',
    currencyCode: 'ETB',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    totalAmount: 0,
  });

  return (
    <AppPage
      title="Purchase Orders"
      subtitle="Procurement & supplier orders · Supply Chain · Manufacturing & Logistics · Market Size · Investment Trends"
      icon={<ClipboardList size={18} />}
      crumbs={[{ label: 'Purchase Orders' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',      label: 'All',      count: rows.length },
            { key: 'DRAFT',    label: 'Draft',    count: rows.filter(p => p.status === 'DRAFT').length },
            { key: 'SENT',     label: 'Sent',     count: rows.filter(p => p.status === 'SENT').length },
            { key: 'APPROVED', label: 'Approved', count: rows.filter(p => p.status === 'APPROVED').length },
            { key: 'RECEIVED', label: 'Received', count: rows.filter(p => p.status === 'RECEIVED').length },
            { key: 'REJECTED', label: 'Rejected', count: rows.filter(p => p.status === 'REJECTED').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {can('purchase_orders:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: blankPO() })}>New PO</Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search POs…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} orders</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>PO Number</AppTh>
          <AppTh>Vendor</AppTh>
          <AppTh align="right">Total</AppTh>
          <AppTh>Expected</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="120px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={6}><EmptyState icon={<ClipboardList size={18} />} title="No purchase orders" desc="Create your first PO to track procurement" action={can('purchase_orders:write') ? { label: 'New PO', onClick: () => setModal({ open: true, data: blankPO() }) } : undefined} /></td></tr>
          ) : filtered.map(po => (
            <AppTr key={po.id}>
              <AppTd><span className="font-mono text-[11px] font-semibold text-slate-800">{po.poNumber}</span></AppTd>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-amber-50 flex items-center justify-center"><Building2 size={10} className="text-amber-600" /></div>
                  <span className="text-[12px] text-slate-700">{po.vendorName ?? '—'}</span>
                </div>
              </AppTd>
              <AppTd align="right"><Amount value={Number(po.totalAmount)} size="sm" /></AppTd>
              <AppTd>
                {po.expectedDelivery
                  ? <div className="flex items-center gap-1 text-[10px] text-slate-500"><Calendar size={9} className="text-slate-300" />{new Date(po.expectedDelivery).toLocaleDateString()}</div>
                  : <span className="text-[10px] text-slate-300">—</span>
                }
              </AppTd>
              <AppTd><StatusBadge status={po.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {po.status === 'DRAFT' && <button onClick={() => handleSend(po.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all" title="Send to vendor"><Send size={11} /></button>}
                  {po.status === 'SENT' && <button onClick={() => handleApprove(po.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Approve"><CheckCircle2 size={11} /></button>}
                  {po.status === 'SENT' && <button onClick={() => handleReject(po.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Reject"><XCircle size={11} /></button>}
                  {po.status === 'APPROVED' && <button onClick={() => handleConvertToBill(po.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all" title="Convert to Bill"><ClipboardList size={11} /></button>}
                  <button onClick={() => setModal({ open: true, data: { ...po } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Edit"><Edit2 size={11} /></button>
                  <button onClick={async () => { if (await confirm({ title: `Delete "${po.poNumber}"?`, variant: 'danger' })) remove(po.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit PO' : 'New Purchase Order'} subtitle="Procurement · Ethiopian VAT 15% · ERCA · Supply Chain · Manufacturing & Logistics · Market Size"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create PO'}</Btn></>}>
        <POForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default PurchaseOrders;
