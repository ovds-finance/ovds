import React, { useState, useMemo } from 'react';
import { Package } from 'lucide-react';
import {
  AppPage, AppTable, AppTh, AppTd, AppTr,
  Btn, Icon, Modal, FormField, Input, Select, EmptyState,
} from '../components/ui';
import { useItems, useItemVariants } from '../services/inventoryApi';
import { useAuth } from '../rbac/AuthContext';
import type { ItemVariant } from '../types/inventory';
import toast from 'react-hot-toast';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const ItemVariants: React.FC = () => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [form, setForm] = useState({ name: '', sku: '', price: '', costPrice: '', stock: '', attributes: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);

  const { items } = useItems({ limit: 200 });
  const { can } = useAuth();
  const { variants, loading: variantsLoading, refetch, create, update, remove } = useItemVariants(selectedItemId);

  const selectedItem = useMemo(() => items.find(i => i.id === selectedItemId), [items, selectedItemId]);

  const openCreate = () => {
    setEditingVariant(null);
    setForm({ name: '', sku: '', price: '', costPrice: '', stock: '', attributes: '', imageUrl: '' });
    setModalOpen(true);
  };

  const openEdit = (v: ItemVariant) => {
    setEditingVariant(v);
    setForm({
      name: v.name ?? '',
      sku: v.sku ?? '',
      price: String(v.price ?? 0),
      costPrice: String(v.costPrice ?? 0),
      stock: String(v.stock ?? 0),
      attributes: v.attributes ?? '',
      imageUrl: v.imageUrl ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedItemId) return;
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error('Name and SKU are required');
      return;
    }
    setSaving(true);
    try {
      const dto = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: parseFloat(form.price) || 0,
        costPrice: parseFloat(form.costPrice) || 0,
        stock: parseInt(form.stock, 10) || 0,
        attributes: form.attributes.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
      };
      if (editingVariant) {
        await update(editingVariant.id, dto);
        toast.success('Variant updated');
      } else {
        await create(dto);
        toast.success('Variant created');
      }
      setModalOpen(false);
      refetch();
    } catch {
      toast.error('Failed to save variant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: ItemVariant) => {
    if (!confirm(`Delete variant "${v.name}" (${v.sku})?`)) return;
    try {
      await remove(v.id);
      toast.success('Variant deleted');
      refetch();
    } catch {
      toast.error('Failed to delete variant');
    }
  };

  return (
    <AppPage
      title="Item Variants"
      subtitle="Manage product variants — size, color, material"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <FormField label="Item">
            <Select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e)}
              className="text-xs w-64 mb-0"
            >
              <option value="">Select an item…</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {(item as any).name} {(item as any).sku ? `(${(item as any).sku})` : ''}
                </option>
              ))}
            </Select>
          </FormField>
          {selectedItemId && (
            <Btn variant="primary" size="sm" onClick={openCreate} icon={<Icon name="PLUS" size={11} />}>
              Add Variant
            </Btn>
          )}
        </div>
      }
    >
      {!selectedItemId ? (
        <div className="text-center py-10 text-sm text-slate-400">
          Select an item above to manage its variants.
        </div>
      ) : variantsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : variants.length === 0 ? (
        <EmptyState
          icon={<Package size={32} />}
          title="No variants yet"
          desc="Add your first variant for this item to track different sizes, colors, or materials."
          action={can('items:write') ? { label: 'Add Variant', onClick: openCreate } : undefined}
        />
      ) : (
        <div className="ovds-widget-card overflow-hidden">
          <AppTable>
            <thead>
              <tr>
                <AppTh>SKU</AppTh>
                <AppTh>Name</AppTh>
                <AppTh align="right">Sale Price</AppTh>
                <AppTh align="right">Cost Price</AppTh>
                <AppTh align="right">Stock</AppTh>
                <AppTh>Attributes</AppTh>
                <AppTh align="right">Actions</AppTh>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <AppTr key={v.id}>
                  <AppTd>
                    <span className="text-[12px] font-mono text-slate-500">{v.sku}</span>
                  </AppTd>
                  <AppTd>
                    <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{v.name}</span>
                  </AppTd>
                  <AppTd align="right">
                    <span className="tabular-nums text-[12px] font-semibold text-slate-700 dark:text-slate-200">{fmt(Number(v.price))}</span>
                  </AppTd>
                  <AppTd align="right">
                    <span className="tabular-nums text-[12px] text-slate-500">{fmt(Number(v.costPrice))}</span>
                  </AppTd>
                  <AppTd align="right">
                    <span className={`tabular-nums text-[12px] font-semibold ${Number(v.stock) > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {v.stock}
                    </span>
                  </AppTd>
                  <AppTd>
                    <span className="text-[11px] text-slate-500">{v.attributes || '—'}</span>
                  </AppTd>
                  <AppTd align="right">
                    <div className="flex items-center gap-1 justify-end">
                      <Btn variant="ghost" size="sm" onClick={() => openEdit(v)} icon={<Icon name="EDIT" size={11} />} />
                      <Btn variant="ghost" size="sm" onClick={() => handleDelete(v)} icon={<Icon name="DELETE" size={11} />} />
                    </div>
                  </AppTd>
                </AppTr>
              ))}
            </tbody>
          </AppTable>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingVariant ? `Edit Variant — ${selectedItem?.name}` : `New Variant — ${selectedItem?.name}`}
          footer={
            <div className="flex items-center gap-2">
              <Btn variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancel</Btn>
              <Btn variant="primary" size="sm" onClick={handleSave} loading={saving}>
                {editingVariant ? 'Update' : 'Create'}
              </Btn>
            </div>
          }
        >
          <div className="space-y-3">
            <FormField label="Variant Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Size L / Red / Cotton"
              />
            </FormField>
            <FormField label="SKU" required>
              <Input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="e.g. SHIRT-L-RED"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Sale Price (ETB)">
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </FormField>
              <FormField label="Cost Price (ETB)">
                <Input
                  type="number"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                />
              </FormField>
            </div>
            <FormField label="Stock Quantity">
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              />
            </FormField>
            <FormField label="Attributes (JSON or text)">
              <Input
                value={form.attributes}
                onChange={(e) => setForm((f) => ({ ...f, attributes: e.target.value }))}
                placeholder='e.g. {"size":"L","color":"red"}'
              />
            </FormField>
            <FormField label="Image URL">
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://…"
              />
            </FormField>
          </div>
        </Modal>
      )}
    </AppPage>
  );
};

export default ItemVariants;
