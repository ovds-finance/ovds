/**
 * Items — ovds-style product & service catalog
 * Inherits: AppPage · AppKpi · AppTable · useApiCrud
 * White background · Emerald text · White-blue icons
 * Ethiopian VAT 15% · IFRS inventory costing
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Package, Download, RefreshCw, ChevronDown, Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { confirm } from '../utils/confirm';
import { fmtETB, ETH_TAX } from '../utils/ethiopianTax';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  Amount, Pagination, SearchBar, Icon,
} from '../components/ui';
import { OvdsEmptyState } from '../components/ovds';
import { useDebounce } from '@ovds/ui';
import { evalMath } from '@ovds/ui';
import CustomFieldRenderer, { type CustomFieldValuesMap } from '../components/CustomFieldRenderer';

interface Item {
  id: string;
  name: string;
  sku?: string;
  type?: string;
  unit?: string;
  salePrice?: number;
  purchasePrice?: number;
  vatApplicable?: boolean;
  description?: string;
  stockQuantity?: number;
  reorderLevel?: number;
  isActive?: boolean;
  category?: string;
  companyId?: string;
}

type FilterTab = 'ALL' | 'PRODUCT' | 'SERVICE' | 'LOW_STOCK';

const UNITS = ['UNIT', 'KG', 'LITRE', 'HOUR', 'DAY', 'MONTH', 'PIECE', 'BOX', 'METRE'];

const ItemForm: React.FC<{ data: Partial<Item>; onChange: (d: Partial<Item>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof Item, v: any) => onChange({ ...data, [k]: v });
  const vatPreview = data.salePrice && data.vatApplicable !== false
    ? data.salePrice
    : null;

  const applyMath = (field: keyof Item, raw: string) => {
    const v = evalMath(raw);
    set(field, v !== null ? v : (parseFloat(raw) || 0));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Item Name" required>
          <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Consulting Service" />
        </FormField>
        <FormField label="SKU / Code">
          <Input value={data.sku ?? ''} onChange={e => set('sku', e.target.value)} placeholder="ITEM-001" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type">
          <Select value={data.type ?? 'PRODUCT'} onChange={e => set('type', e)}>
            <option value="PRODUCT">Product</option>
            <option value="SERVICE">Service</option>
          </Select>
        </FormField>
        <FormField label="Unit">
          <Select value={data.unit ?? 'UNIT'} onChange={e => set('unit', e)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Sale Price (ETB)" required>
          <Input type="text" value={data.salePrice ?? ''} onChange={e => set('salePrice', e.target.value)} onBlur={e => applyMath('salePrice', e.target.value)} placeholder="0.00" />
        </FormField>
        <FormField label="Purchase Price (ETB)">
          <Input type="text" value={data.purchasePrice ?? ''} onChange={e => set('purchasePrice', e.target.value)} onBlur={e => applyMath('purchasePrice', e.target.value)} placeholder="0.00" />
        </FormField>
      </div>
      <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${data.vatApplicable !== false ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="vatApplicable"
            checked={data.vatApplicable !== false}
            onChange={e => set('vatApplicable', e.target.checked)}
            className="accent-emerald-600"
          />
          <label htmlFor="vatApplicable" className="text-[12px] font-semibold text-emerald-800 cursor-pointer">
            VAT Applicable — 15% (ERCA)
          </label>
        </div>
        {vatPreview && (
          <span className="text-[10px] font-bold text-emerald-700">
            +{fmtETB(vatPreview * 0.15)} → {fmtETB(vatPreview * 1.15)}
          </span>
        )}
      </div>
      {data.type !== 'SERVICE' && (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Stock Quantity">
            <Input type="number" value={data.stockQuantity ?? ''} onChange={e => set('stockQuantity', parseInt(e.target.value) || 0)} placeholder="0" />
          </FormField>
          <FormField label="Reorder Level">
            <Input type="number" value={data.reorderLevel ?? ''} onChange={e => set('reorderLevel', parseInt(e.target.value) || 0)} placeholder="0" />
          </FormField>
        </div>
      )}
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="Optional description" />
      </FormField>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isActive" checked={data.isActive !== false} onChange={e => set('isActive', e.target.checked)} className="accent-emerald-600" />
        <label htmlFor="isActive" className="text-[12px] font-semibold text-slate-700 cursor-pointer">Active item</label>
      </div>
    </div>
  );
};

const Items: React.FC = () => {
  usePageTitle('Items');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();

  const [tab, setTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<Item> }>({ open: false, data: {} });
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValuesMap>({});
  const handleCustomFieldChange = useCallback((values: CustomFieldValuesMap) => {
    setCustomFieldValues(values);
  }, []);

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Item>({
    endpoint: '/ovds/items',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const [typeFilter, setTypeFilter] = useState<Item['type'] | ''>('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | ''>('');
  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'PRODUCT')   list = list.filter(i => i.type === 'PRODUCT' || !i.type);
    if (tab === 'SERVICE')   list = list.filter(i => i.type === 'SERVICE');
    if (tab === 'LOW_STOCK') list = list.filter(i => i.type !== 'SERVICE' && (i.stockQuantity ?? 0) <= (i.reorderLevel ?? 5));
    if (typeFilter) list = list.filter(i => i.type === typeFilter);
    if (statusFilter) list = list.filter(i => (statusFilter === 'ACTIVE' ? i.isActive !== false : i.isActive === false));
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(i => [i.name, i.sku, i.description].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, typeFilter, statusFilter, debouncedSearch]);

  const stats = {
    total: rows.length,
    products: rows.filter(i => i.type !== 'SERVICE').length,
    services: rows.filter(i => i.type === 'SERVICE').length,
    vat: rows.filter(i => i.vatApplicable !== false).length,
    lowStock: rows.filter(i => i.type !== 'SERVICE' && (i.stockQuantity ?? 0) <= (i.reorderLevel ?? 5)).length,
  };

  const openCreate = () => setModal({ open: true, data: { type: 'PRODUCT', unit: 'UNIT', vatApplicable: true, isActive: true } });
  const openEdit   = (i: Item) => setModal({ open: true, data: { ...i } });

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim()) { toast.error('Item name is required'); return; }
    const payload = { ...modal.data, customFields: customFieldValues };
    const result = await save(payload as any);
    if (result) {
      setModal(m => ({ ...m, open: false }));
      setCustomFieldValues({});
    }
  }, [modal.data, save, customFieldValues]);

  const handleDelete = useCallback(async (i: Item) => {
    if (!can('ovds:write')) { toast.error('Insufficient permissions'); return; }
    if (!(await confirm({ title: `Delete "${i.name}"?`, variant: 'danger' }))) return;
    await remove(i.id);
  }, [can, remove]);

  const handleExport = () => {
    const headers = 'Name,SKU,Type,Unit,Sale Price,Purchase Price,VAT,Stock\n';
    const csvRows = filtered.map(i =>
      `"${i.name}","${i.sku ?? ''}","${i.type ?? 'PRODUCT'}","${i.unit ?? 'UNIT'}",${i.salePrice ?? 0},${i.purchasePrice ?? 0},"${i.vatApplicable !== false ? 'Yes' : 'No'}",${i.stockQuantity ?? 0}`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `items-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} items`);
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV file is empty or invalid'); return; }
      const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      const nameIdx = header.indexOf('name');
      const skuIdx = header.indexOf('sku');
      const typeIdx = header.indexOf('type');
      const unitIdx = header.indexOf('unit');
      const salePriceIdx = header.findIndex(h => h.includes('sale'));
      const purchasePriceIdx = header.findIndex(h => h.includes('purchase'));
      const stockIdx = header.findIndex(h => h.includes('stock'));

      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].match(/("(?:[^"]|"")*"|[^,]*)/g)?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) ?? [];
        if (!cols.length || !cols[nameIdx]) continue;
        const name = cols[nameIdx];
        const existing = rows.find(r => r.name === name || (skuIdx >= 0 && cols[skuIdx] && r.sku === cols[skuIdx]));
        if (existing) {
          await save({ ...existing, salePrice: cols[salePriceIdx] ? parseFloat(cols[salePriceIdx]) : existing.salePrice, purchasePrice: cols[purchasePriceIdx] ? parseFloat(cols[purchasePriceIdx]) : existing.purchasePrice, stockQuantity: cols[stockIdx] ? parseInt(cols[stockIdx]) : existing.stockQuantity });
        } else {
          await save({ name, sku: cols[skuIdx] ?? `IMP-${Date.now().toString().slice(-6)}`, type: (cols[typeIdx] ?? 'PRODUCT').toUpperCase() as any, unit: cols[unitIdx] ?? 'UNIT', salePrice: cols[salePriceIdx] ? parseFloat(cols[salePriceIdx]) : 0, purchasePrice: cols[purchasePriceIdx] ? parseFloat(cols[purchasePriceIdx]) : 0, vatApplicable: true, stockQuantity: cols[stockIdx] ? parseInt(cols[stockIdx]) : 0, reorderLevel: 5, isActive: true });
        }
        imported++;
      }
      toast.success(`Imported ${imported} items`);
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? 'Import failed');
    }
    e.target.value = '';
  };

  const isLowStock = (item: Item) => item.type !== 'SERVICE' && (item.stockQuantity ?? 0) <= (item.reorderLevel ?? 5);

  return (
    <AppPage
      title="Items"
      subtitle={`${rows.length} products & services · VAT ${ETH_TAX.VAT_RATE * 100}% (ERCA)`}
      icon={<Package size={18} />}
      crumbs={[{ label: 'Items' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',       label: 'All',       count: rows.length },
            { key: 'PRODUCT',   label: 'Products',  count: rows.filter(i => i.type !== 'SERVICE').length },
            { key: 'SERVICE',   label: 'Services',  count: rows.filter(i => i.type === 'SERVICE').length },
            { key: 'LOW_STOCK', label: 'Low Stock', count: rows.filter(i => i.type !== 'SERVICE' && (i.stockQuantity ?? 0) <= (i.reorderLevel ?? 5)).length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<Icon name="REFRESH" size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Icon name="DOWNLOAD" size={11} />} onClick={handleExport}>Export</Btn>
          <label className="cursor-pointer">
            <Btn variant="secondary" size="sm" icon={<Upload size={11} />} asChild>
              <span>Import</span>
            </Btn>
            <input type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
          </label>
          {can('ovds:write') && (
            <Btn variant="primary" size="sm" icon={<Icon name="PLUS" size={12} />} onClick={openCreate}>New Item</Btn>
          )}
        </>
      }
    >
      <AppKpi
        cells={[
          { label: 'Total Items', value: stats.total, color: 'emerald' as const },
          { label: 'Products', value: stats.products, color: 'sky' as const },
          { label: 'Services', value: stats.services, color: 'violet' as const },
          { label: 'VAT Items', value: stats.vat, color: 'amber' as const },
        ]}
      />

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search items by name, SKU…" className="w-52" />
        <div className="relative">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as Item['type'] | '')}
            className="pl-3 pr-8 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-slate-200 rounded-lg bg-white">
            <option value="">All Types</option>
            <option value="PRODUCT">Product</option>
            <option value="SERVICE">Service</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'ACTIVE' | 'INACTIVE' | '')}
            className="pl-3 pr-8 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-slate-200 rounded-lg bg-white">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <button onClick={refetch} className="p-1.5 rounded text-slate-400 hover:text-emerald-600 transition-colors" title="Refresh">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} items</span>
      </div>

      <AppTable>
        <thead>
          <tr>
            <AppTh>Item</AppTh>
            <AppTh>SKU</AppTh>
            <AppTh>Type</AppTh>
            <AppTh>Unit</AppTh>
            <AppTh align="right">Sale Price</AppTh>
            <AppTh align="right">Cost</AppTh>
            <AppTh>VAT</AppTh>
            <AppTh align="right">Stock</AppTh>
            <AppTh>Status</AppTh>
            <AppTh align="right" width="100px">Actions</AppTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={10} className="px-3 py-3">
                  <div className="h-10 bg-slate-100 rounded animate-pulse" />
                </td>
              </tr>
            ))
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={10}>
                <OvdsEmptyState
                  type="item"
                  isFiltered={!!(search || typeFilter || statusFilter || tab !== 'ALL')}
                  onClearFilters={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setTab('ALL'); }}
                  onAction={can('ovds:write') ? openCreate : undefined}
                />
              </td>
            </tr>
          ) : filtered.map(item => {
            const isLow = item.type !== 'SERVICE' && (item.stockQuantity ?? 0) <= (item.reorderLevel ?? 5);
            return (
              <AppTr key={item.id}>
                <AppTd>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'SERVICE' ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {item.type === 'SERVICE'
                        ? <Icon name="TAG" size={14} />
                        : <Icon name="PACKAGE" size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[12px] font-semibold truncate max-w-[200px] ${item.isActive === false ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{item.name}</p>
                      {item.description && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{item.description}</p>
                      )}
                    </div>
                  </div>
                </AppTd>
                <AppTd>
                  <span className="font-mono text-[11px] text-slate-500">{item.sku ?? '—'}</span>
                </AppTd>
                <AppTd>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    item.type === 'SERVICE'
                      ? 'bg-violet-50 text-violet-700 border-violet-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {item.type ?? 'PRODUCT'}
                  </span>
                </AppTd>
                <AppTd>
                  <span className="text-[11px] text-slate-600">{item.unit ?? 'UNIT'}</span>
                </AppTd>
                <AppTd align="right">
                  <Amount value={item.salePrice ?? 0} size="sm" />
                </AppTd>
                <AppTd align="right">
                  <span className="tabular-nums text-[11px] text-slate-500 font-medium">
                    {item.purchasePrice ? <Amount value={item.purchasePrice} size="sm" /> : '—'}
                  </span>
                </AppTd>
                <AppTd>
                  {item.vatApplicable !== false
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border bg-amber-50 text-amber-700 border-amber-100">VAT 15%</span>
                    : <span className="text-[10px] text-slate-300">N/A</span>
                  }
                </AppTd>
                <AppTd align="right">
                  <span className={`tabular-nums text-[11px] font-semibold ${isLow ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                    {item.type === 'SERVICE' ? 'N/A' : item.stockQuantity ?? 0}
                  </span>
                </AppTd>
                <AppTd>
                  <StatusBadge status={item.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />
                </AppTd>
                <AppTd align="right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {can('ovds:write') && (
                      <>
                        <button onClick={() => openEdit(item)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Edit">
                          <Icon name="EDIT" size={11} />
                        </button>
                        <button onClick={() => handleDelete(item)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete">
                          <Icon name="DELETE" size={11} />
                        </button>
                      </>
                    )}
                  </div>
                </AppTd>
              </AppTr>
            );
          })}
        </tbody>
      </AppTable>

      <div className="mt-4">
        <Pagination page={page} total={total} pageSize={25} onChange={p => setPage(p)} />
      </div>

      <Modal
        open={modal.open}
        onClose={() => { setModal(m => ({ ...m, open: false })); setCustomFieldValues({}); }}
        title={modal.data.id ? `Edit: ${modal.data.name}` : 'New Item'}
        subtitle="Products & services · VAT 15% (ERCA) · IFRS inventory"
        footer={
          <>
            <Btn variant="secondary" onClick={() => { setModal(m => ({ ...m, open: false })); setCustomFieldValues({}); }}>Cancel</Btn>
            <Btn variant="primary" loading={saving} onClick={handleSave}>
              {modal.data.id ? 'Save Changes' : 'Create Item'}
            </Btn>
          </>
        }
      >
        <ItemForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
        {selectedCompanyId && (
          <div className="mt-4">
            <CustomFieldRenderer feature="inventory-item" entityId={modal.data.id} companyId={selectedCompanyId}
              onChange={handleCustomFieldChange} initialValues={customFieldValues} showTitle={false} />
          </div>
        )}
      </Modal>
    </AppPage>
  );
};

export default Items;

