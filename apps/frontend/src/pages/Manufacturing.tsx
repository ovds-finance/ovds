import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTable, AppTh, AppTd, AppTr,
  Btn, Icon, Modal,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';

interface WorkOrder {
  id: string;
  woNumber: string;
  itemCode?: string;
  description?: string;
  quantity: number;
  status?: string;
  companyId?: string;
  createdAt?: string;
  outputs?: Array<{ ItemCode?: string; description?: string; quantity?: number; IsByProduct?: boolean }>;
}

interface BomHeader {
  id: string;
  itemCode: string;
  description?: string;
  quantity: number;
  unit?: string;
  costRollupDate?: string;
  companyId?: string;
  lines?: Array<{ ComponentCode?: string; description?: string; quantity?: number; unit?: string; IsPhantom?: boolean }>;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const Manufacturing: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'work-orders' | 'bom'>('work-orders');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [boms, setBoms] = useState<BomHeader[]>([]);
  const [selectedWo, setSelectedWo] = useState<WorkOrder | null>(null);
  const [selectedBom, setSelectedBom] = useState<BomHeader | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const companyId = selectedCompanyId || undefined;

  const fetchWorkOrders = useCallback(async (cId?: string) => {
    if (!cId) return;
    setLoading(true);
    try {
      const res = await api.get(`/manufacturing/work-orders?companyId=${cId}`, {
        headers: { 'x-background': '1' },
      });
      const raw = res.data?.data ?? res.data ?? [];
      setWorkOrders(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBoms = useCallback(async (cId?: string) => {
    if (!cId) return;
    setLoading(true);
    try {
      const res = await api.get(`/manufacturing/bom?companyId=${cId}`, {
        headers: { 'x-background': '1' },
      });
      const raw = res.data?.data ?? res.data ?? [];
      setBoms(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load BOMs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (companyId) {
      if (activeTab === 'work-orders') fetchWorkOrders(companyId);
      else fetchBoms(companyId);
    }
  }, [companyId, activeTab, fetchWorkOrders, fetchBoms]);

  const handleViewWo = async (wo: WorkOrder) => {
    try {
      const res = await api.get(`/manufacturing/work-orders/${wo.id}`, {
        headers: { 'x-background': '1' },
      });
      const detail = res.data?.data ?? res.data;
      setSelectedWo(detail);
      setModalOpen(true);
    } catch {
      toast.error('Failed to load work order detail');
    }
  };

  const handleViewBom = async (bom: BomHeader) => {
    try {
      const res = await api.get(`/manufacturing/bom/${bom.id}`, {
        headers: { 'x-background': '1' },
      });
      const detail = res.data?.data ?? res.data;
      setSelectedBom(detail);
      setBomModalOpen(true);
    } catch {
      toast.error('Failed to load BOM detail');
    }
  };

  const handleCreateWo = async () => {
    setSaving(true);
    try {
      await api.post('/manufacturing/work-orders', {
        companyId,
        itemCode: 'NEW',
        description: 'New Work Order',
        quantity: 0,
        outputs: [],
      });
      toast.success('Work order created');
      fetchWorkOrders(companyId);
    } catch {
      toast.error('Failed to create work order');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBom = async () => {
    setSaving(true);
    try {
      await api.post('/manufacturing/bom', {
        companyId,
        itemCode: 'NEW',
        description: 'New BOM',
        quantity: 0,
        lines: [],
      });
      toast.success('BOM created');
      fetchBoms(companyId);
    } catch {
      toast.error('Failed to create BOM');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWo = async (id: string) => {
    if (!confirm('Delete this work order?')) return;
    setSaving(true);
    try {
      await api.delete(`/manufacturing/work-orders/${id}`);
      toast.success('Work order deleted');
      fetchWorkOrders(companyId);
      setModalOpen(false);
    } catch {
      toast.error('Failed to delete work order');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBom = async (id: string) => {
    if (!confirm('Delete this BOM?')) return;
    setSaving(true);
    try {
      await api.delete(`/manufacturing/bom/${id}`);
      toast.success('BOM deleted');
      fetchBoms(companyId);
      setBomModalOpen(false);
    } catch {
      toast.error('Failed to delete BOM');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppPage
      title="Manufacturing"
      subtitle="Work Orders · BOM · Production"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'work-orders' ? (
            <Btn variant="primary" size="sm" onClick={handleCreateWo} icon={<Icon name="PLUS" size={11} />}>
              New Work Order
            </Btn>
          ) : (
            <Btn variant="primary" size="sm" onClick={handleCreateBom} icon={<Icon name="PLUS" size={11} />}>
              New BOM
            </Btn>
          )}
          <Btn variant="secondary" size="sm" onClick={() => activeTab === 'work-orders' ? fetchWorkOrders(companyId) : fetchBoms(companyId)} icon={<Icon name="REFRESH_CW" size={11} />}>
            Refresh
          </Btn>
        </div>
      }
    >
      {!companyId ? (
        <div className="text-center py-10 text-sm text-slate-400">
          Please select a company to view manufacturing data.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('work-orders')}
              className={`px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === 'work-orders'
                  ? 'text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Work Orders
            </button>
            <button
              onClick={() => setActiveTab('bom')}
              className={`px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === 'bom'
                  ? 'text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Bill of Materials
            </button>
          </div>

          {/* Work Orders Table */}
          {activeTab === 'work-orders' && (
            <div className="ovds-widget-card overflow-hidden">
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>WO Number</AppTh>
                    <AppTh>Item Code</AppTh>
                    <AppTh>Description</AppTh>
                    <AppTh align="right">Quantity</AppTh>
                    <AppTh>Status</AppTh>
                    <AppTh align="right">Actions</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  ) : workOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                        No work orders found. Create your first work order to get started.
                      </td>
                    </tr>
                  ) : (
                    workOrders.map((wo) => (
                      <AppTr key={wo.id}>
                        <AppTd>
                          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{wo.woNumber || wo.id}</span>
                        </AppTd>
                        <AppTd>
                          <span className="text-[12px] text-slate-600 dark:text-slate-300">{wo.itemCode || '—'}</span>
                        </AppTd>
                        <AppTd>
                          <span className="text-[12px] text-slate-600 dark:text-slate-300">{wo.description || '—'}</span>
                        </AppTd>
                        <AppTd align="right">
                          <span className="tabular-nums text-[12px] font-semibold text-slate-700 dark:text-slate-200">{fmt(Number(wo.quantity))}</span>
                        </AppTd>
                        <AppTd>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600">
                            {wo.status || 'DRAFT'}
                          </span>
                        </AppTd>
                        <AppTd align="right">
                          <Btn variant="ghost" size="sm" onClick={() => handleViewWo(wo)} icon={<Icon name="EYE" size={11} />} />
                        </AppTd>
                      </AppTr>
                    ))
                  )}
                </tbody>
              </AppTable>
            </div>
          )}

          {/* BOM Table */}
          {activeTab === 'bom' && (
            <div className="ovds-widget-card overflow-hidden">
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Item Code</AppTh>
                    <AppTh>Description</AppTh>
                    <AppTh align="right">Quantity</AppTh>
                    <AppTh>Unit</AppTh>
                    <AppTh>Cost Rollup</AppTh>
                    <AppTh align="right">Actions</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  ) : boms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                        No BOMs found. Create your first Bill of Materials to get started.
                      </td>
                    </tr>
                  ) : (
                    boms.map((bom) => (
                      <AppTr key={bom.id}>
                        <AppTd>
                          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{bom.itemCode}</span>
                        </AppTd>
                        <AppTd>
                          <span className="text-[12px] text-slate-600 dark:text-slate-300">{bom.description || '—'}</span>
                        </AppTd>
                        <AppTd align="right">
                          <span className="tabular-nums text-[12px] font-semibold text-slate-700 dark:text-slate-200">{fmt(Number(bom.quantity))}</span>
                        </AppTd>
                        <AppTd>
                          <span className="text-[11px] text-slate-500">{bom.unit || 'EA'}</span>
                        </AppTd>
                        <AppTd>
                          <span className="text-[11px] text-slate-500">
                            {bom.costRollupDate ? new Date(bom.costRollupDate).toLocaleDateString('en-ET') : '—'}
                          </span>
                        </AppTd>
                        <AppTd align="right">
                          <Btn variant="ghost" size="sm" onClick={() => handleViewBom(bom)} icon={<Icon name="EYE" size={11} />} />
                        </AppTd>
                      </AppTr>
                    ))
                  )}
                </tbody>
              </AppTable>
            </div>
          )}
        </div>
      )}

      {/* Work Order Detail Modal */}
      {modalOpen && selectedWo && (
        <Modal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedWo(null); }}
          title={`Work Order ${selectedWo.woNumber || selectedWo.id}`}
          footer={
            <div className="flex items-center gap-2">
              <Btn variant="danger" size="sm" onClick={() => handleDeleteWo(selectedWo.id)} loading={saving}>
                Delete
              </Btn>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Item Code</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{selectedWo.itemCode || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quantity</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{fmt(Number(selectedWo.quantity))}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{selectedWo.description || '—'}</p>
              </div>
            </div>

            {selectedWo.outputs && selectedWo.outputs.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Outputs</p>
                <div className="space-y-1">
                  {selectedWo.outputs.map((o, i) => (
                    <div key={i} className="flex justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
                      <span className="text-slate-600 dark:text-slate-300">{o.description || o.ItemCode || '—'}</span>
                      <span className="tabular-nums font-semibold">{fmt(Number(o.quantity))}</span>
                      {o.IsByProduct && <span className="text-[10px] text-amber-600 ml-2">By-product</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* BOM Detail Modal */}
      {bomModalOpen && selectedBom && (
        <Modal
          open={bomModalOpen}
          onClose={() => { setBomModalOpen(false); setSelectedBom(null); }}
          title={`BOM — ${selectedBom.itemCode}`}
          footer={
            <div className="flex items-center gap-2">
              <Btn variant="danger" size="sm" onClick={() => handleDeleteBom(selectedBom.id)} loading={saving}>
                Delete
              </Btn>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{selectedBom.description || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quantity</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{fmt(Number(selectedBom.quantity))} {selectedBom.unit || 'EA'}</p>
              </div>
            </div>

            {selectedBom.lines && selectedBom.lines.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Components</p>
                <div className="space-y-1">
                  {selectedBom.lines.map((line, i) => (
                    <div key={i} className="flex justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
                      <span className="text-slate-600 dark:text-slate-300">
                        {line.ComponentCode || '—'} — {line.description || '—'}
                      </span>
                      <span className="tabular-nums font-semibold">{fmt(Number(line.quantity))} {line.unit || 'EA'}</span>
                      {line.IsPhantom && <span className="text-[10px] text-amber-600 ml-2">Phantom</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </AppPage>
  );
};

export default Manufacturing;
