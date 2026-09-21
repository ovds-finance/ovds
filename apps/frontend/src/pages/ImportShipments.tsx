import {
   Ship, Plus, Edit2, Trash2, Download, RefreshCw,
   Anchor, Plane, ChevronDown, ChevronUp,
   Link2,
 } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Textarea, Select,
  SearchBar, Amount, Pagination, Icon, EmptyState,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { confirm } from '../utils/confirm';
import { fmtDate } from '../utils/fmt';

 const toCsv = (rows: any[], filename: string) => {
   if (!rows.length) { toast.error('No data to export'); return; }
   const headers = Object.keys(rows[0]).filter(k => !k.startsWith('_'));
   const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
   const blob = new Blob([csv], { type: 'text/csv' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
   a.click();
   URL.revokeObjectURL(url);
 };

type ShipmentStatus = 'ALL' | 'BOOKED' | 'IN_TRANSIT' | 'ARRIVED' | 'CLEARED' | 'DELIVERED' | 'CANCELLED';

interface ShipmentEvent {
  id: string;
  event: string;
  location: string;
  timestamp: string;
  notes?: string;
}

interface ImportShipment {
  id: string;
  shipmentRef: string;
  type: string;
  poNumber: string;
  lcNumber: string;
  freightForwarder: string;
  vesselOrFlight: string;
  etd: string;
  eta: string;
  status: string;
  trackingEvents?: ShipmentEvent[];
  companyId?: string;
  createdAt: string;
}

const SHIPMENT_TABS: ShipmentStatus[] = ['ALL', 'BOOKED', 'IN_TRANSIT', 'ARRIVED', 'CLEARED', 'DELIVERED', 'CANCELLED'];

const _STATUS_COLORS: Record<string, string> = {
  BOOKED: 'bg-slate-100 text-slate-600',
  IN_TRANSIT: 'bg-sky-100 text-sky-700',
  ARRIVED: 'bg-amber-100 text-amber-700',
  CLEARED: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  DELIVERED: 'bg-violet-100 text-violet-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const ShipmentForm: React.FC<{ data: Partial<ImportShipment>; onChange: (d: Partial<ImportShipment>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof ImportShipment, v: any) => onChange({ ...data, [k]: v });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Shipment Ref" required>
          <Input value={data.shipmentRef ?? ''} onChange={e => set('shipmentRef', e.target.value)} placeholder="SHP-2026-001" />
        </FormField>
        <FormField label="Type">
          <Select value={data.type ?? 'SEA'} onChange={e => set('type', e)}>
            <option value="SEA">Sea Freight</option>
            <option value="AIR">Air Freight</option>
            <option value="LAND">Land Freight</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="PO Number">
          <Input value={data.poNumber ?? ''} onChange={e => set('poNumber', e.target.value)} placeholder="PO-2026-001" />
        </FormField>
        <FormField label="L/C Number">
          <Input value={data.lcNumber ?? ''} onChange={e => set('lcNumber', e.target.value)} placeholder="LC-2026-001" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Freight Forwarder">
          <Input value={data.freightForwarder ?? ''} onChange={e => set('freightForwarder', e.target.value)} placeholder="Company name" />
        </FormField>
        <FormField label="Vessel / Flight">
          <Input value={data.vesselOrFlight ?? ''} onChange={e => set('vesselOrFlight', e.target.value)} placeholder="Vessel or flight name" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="ETD">
          <Input type="date" value={data.etd?.slice(0, 10) ?? ''} onChange={e => set('etd', e.target.value)} />
        </FormField>
        <FormField label="ETA">
          <Input type="date" value={data.eta?.slice(0, 10) ?? ''} onChange={e => set('eta', e.target.value)} />
        </FormField>
      </div>
    </div>
  );
};

const ImportShipments: React.FC = () => {
  usePageTitle('Import Shipments');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab] = useState<ShipmentStatus>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<ImportShipment> }>({ open: false, data: {} });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<ImportShipment>({
    endpoint: '/procurement/import-shipment',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(s => s.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => [s.shipmentRef, s.vesselOrFlight, s.freightForwarder, s.poNumber, s.lcNumber].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total Shipments', value: rows.length, color: 'green' as const },
    { label: 'In Transit', value: rows.filter(s => s.status === 'IN_TRANSIT').length, color: 'sky' as const },
    { label: 'Arrived', value: rows.filter(s => s.status === 'ARRIVED').length, color: 'amber' as const },
    { label: 'Cleared', value: rows.filter(s => s.status === 'CLEARED').length, color: 'violet' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.shipmentRef?.trim()) { toast.error('Shipment Ref is required'); return; }
    const payload = { ...modal.data };
    await save(payload as any);
    setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleLinkLC = async (id: string) => {
    const lcNumber = prompt('Enter L/C Number:');
    if (!lcNumber) return;
    try {
      const { default: api } = await import('../services/api');
      await api.post(`/procurement/import-shipment/${id}/link-lc`, { lcNumber });
      toast.success('Linked to L/C'); refetch();
    } catch { toast.error('Failed to link'); }
  };

  const handleLinkPO = async (id: string) => {
    const poNumber = prompt('Enter PO Number:');
    if (!poNumber) return;
    try {
      const { default: api } = await import('../services/api');
      await api.post(`/procurement/import-shipment/${id}/link-po`, { poNumber });
      toast.success('Linked to PO'); refetch();
    } catch { toast.error('Failed to link'); }
  };

  const handleLinkCustoms = async (id: string) => {
    const customsRef = prompt('Enter Customs Declaration Number:');
    if (!customsRef) return;
    try {
      const { default: api } = await import('../services/api');
      await api.post(`/procurement/import-shipment/${id}/link-customs`, { customsRef });
      toast.success('Linked to Customs'); refetch();
    } catch { toast.error('Failed to link'); }
  };

  const blankShipment = () => ({
    shipmentRef: `SHP-${new Date().getFullYear()}-${String(rows.length + 1).padStart(3, '0')}`,
    status: 'BOOKED',
    type: 'SEA',
  });

  return (
    <AppPage
      title="Import Shipments"
      subtitle="Track international import shipments · Trade ovds · Supply Chain"
      icon={<Ship size={18} />}
      crumbs={[{ label: 'Import Shipments' }]}
      tabs={
        <AppTabs
          tabs={SHIPMENT_TABS.map(t => ({ key: t, label: t.replace(/_/g, ' ') }))}
          active={tab}
          onChange={k => { setTab(k as ShipmentStatus); }}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={() => toCsv(rows, 'import-shipments')}>Export</Btn>
          {can('purchase_orders:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: blankShipment() })}>New Shipment</Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />

      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search shipments…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} records</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Shipment Ref</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>PO</AppTh>
          <AppTh>L/C</AppTh>
          <AppTh>Freight Forwarder</AppTh>
          <AppTh>Vessel / Flight</AppTh>
          <AppTh>ETD</AppTh>
          <AppTh>ETA</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="150px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={10} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={10}>
              <EmptyState icon={<Ship size={18} />} title="No import shipments" desc="Create your first shipment to start tracking" action={can('purchase_orders:write') ? { label: 'New Shipment', onClick: () => setModal({ open: true, data: blankShipment() }) } : undefined} />
            </td></tr>
          ) : filtered.map(s => (
            <React.Fragment key={s.id}>
              <AppTr>
                <AppTd>
                  <button onClick={() => toggleRow(s.id)} className="flex items-center gap-1.5 group">
                    {expandedRows.has(s.id) ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                    <span className="font-mono text-[11px] font-semibold text-slate-800">{s.shipmentRef}</span>
                  </button>
                </AppTd>
                <AppTd>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                    {s.type === 'SEA' ? <Anchor size={11} className="text-slate-400" /> : s.type === 'AIR' ? <Plane size={11} className="text-slate-400" /> : null}
                    {s.type}
                  </span>
                </AppTd>
                <AppTd><span className="font-mono text-[11px] text-slate-600">{s.poNumber ?? '—'}</span></AppTd>
                <AppTd><span className="font-mono text-[11px] text-slate-600">{s.lcNumber ?? '—'}</span></AppTd>
                <AppTd><span className="text-[12px] text-slate-700">{s.freightForwarder ?? '—'}</span></AppTd>
                <AppTd><span className="text-[12px] text-slate-600">{s.vesselOrFlight ?? '—'}</span></AppTd>
                <AppTd>{fmtDate(s.etd)}</AppTd>
                <AppTd>{fmtDate(s.eta)}</AppTd>
                <AppTd><StatusBadge status={s.status} /></AppTd>
                <AppTd align="right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleLinkLC(s.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all" title="Link to L/C"><Link2 size={11} /></button>
                    <button onClick={() => handleLinkPO(s.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all" title="Link to PO"><Link2 size={11} /></button>
                    <button onClick={() => handleLinkCustoms(s.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all" title="Link to Customs"><Link2 size={11} /></button>
                    <button onClick={() => setModal({ open: true, data: { ...s } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all" title="Edit"><Edit2 size={11} /></button>
                    <button onClick={async () => { if (await confirm({ title: `Delete "${s.shipmentRef}"?`, variant: 'danger' })) remove(s.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                  </div>
                </AppTd>
              </AppTr>
              {expandedRows.has(s.id) && s.trackingEvents && s.trackingEvents.length > 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-2 bg-slate-50/50">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tracking Events</p>
                      {s.trackingEvents.map((ev, idx) => (
                        <div key={ev.id || idx} className="flex items-center gap-3 text-[11px] text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-100">
                          <span className="w-2 h-2 rounded-full bg-[var(--pro-azure-light)] shrink-0" />
                          <span className="font-semibold">{ev.event}</span>
                          <span className="text-slate-400">{ev.location}</span>
                          <span className="text-slate-400 ml-auto">{fmtDate(ev.timestamp)}</span>
                          {ev.notes && <span className="text-slate-400 italic">— {ev.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </AppTable>

      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>

      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.data.id ? 'Edit Shipment' : 'New Import Shipment'}
        subtitle="International shipment tracking · Trade ovds"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create Shipment'}</Btn></>}
      >
        <ShipmentForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default ImportShipments;

