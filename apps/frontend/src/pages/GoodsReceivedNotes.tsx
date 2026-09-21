import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import {
  AppPage, AppTable, AppTh, AppTd, AppTr,
  Btn, Icon, Modal, FormField, Input, Select,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';

interface GrnItem {
  id?: string;
  itemId?: string;
  description?: string;
  orderedQty: number;
  receivedQty: number;
  rejectedQty: number;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber?: string;
}

interface Bill {
  id: string;
  billNumber?: string;
}

interface Grn {
  id: string;
  grnNumber: string;
  purchaseOrderId?: string;
  billId?: string;
  vendorId?: string;
  vendorName?: string;
  status: string;
  receivedBy?: string;
  receivedAt: string;
  warehouseId?: string;
  notes?: string;
  items: GrnItem[];
  purchaseOrder?: PurchaseOrder;
  bill?: Bill;
}

interface GrnStats {
  total: number;
  pending: number;
  confirmed: number;
  billed: number;
  awaitingBill: number;
}

interface ThreeWayMatchResult {
  grnId: string;
  billId: string;
  purchaseOrderId?: string;
  matched: boolean;
  discrepancies: Array<{
    field: string;
    poValue: number | string;
    grnValue: number | string;
    billValue: number | string;
    acceptable: boolean;
  }>;
  totalPoAmount: number;
  totalGrnAmount: number;
  totalBillAmount: number;
  variancePct: number;
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  summary: string;
}

const STATUS_STYLE: Record<string, { icon: React.ReactNode; cls: string }> = {
  DRAFT: { icon: <Icon name="EDIT" size={11} />, cls: 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-600' },
  CONFIRMED: { icon: <Icon name="CHECK_CIRCLE" size={11} />, cls: 'text-[var(--pro-azure-dark)] bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] dark:text-[var(--pro-azure-light)] dark:bg-[var(--pro-azure-50)]/10 dark:border-[var(--pro-azure)]/20' },
  BILLED: { icon: <Icon name="FILE_TEXT" size={11} />, cls: 'text-[var(--pro-azure-dark)] bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] dark:text-[var(--pro-azure-light)] dark:bg-green-950/20 dark:border-green-800' },
  CANCELLED: { icon: <Icon name="X_CIRCLE" size={11} />, cls: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-800' },
};

const RECOMMENDATION_STYLE: Record<string, string> = {
  APPROVE: 'text-[var(--pro-azure-dark)] bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]',
  REVIEW: 'text-amber-700 bg-amber-50 border-amber-200',
  REJECT: 'text-rose-700 bg-rose-50 border-rose-200',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const GoodsReceivedNotes: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Grn[]>([]);
  const [stats, setStats] = useState<GrnStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedGrn, setSelectedGrn] = useState<Grn | null>(null);
  const [matchResult, setMatchResult] = useState<ThreeWayMatchResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [linkBillOpen, setLinkBillOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const companyId = selectedCompanyId || undefined;

  const fetchData = useCallback(async (cId?: string) => {
    if (!cId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('companyId', cId);
      if (statusFilter) q.set('status', statusFilter);
      q.set('page', String(page));
      q.set('take', '20');

      const [listRes, statsRes] = await Promise.all([
        api.get(`/ovds/grn?${q}`, { headers: { 'x-background': '1' } }).catch(() => ({ data: { data: [], total: 0 } })),
        api.get(`/ovds/grn/stats?companyId=${cId}`, { headers: { 'x-background': '1' } }).catch(() => ({ data: null })),
      ]);

      const listData = listRes.data?.data ?? listRes.data ?? { data: [], total: 0 };
      setData(Array.isArray(listData.data) ? listData.data : []);
      setTotal(listData.total ?? 0);
      setStats(statsRes.data?.data ?? statsRes.data ?? null);
    } catch {
      toast.error('Failed to load GRNs');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    if (companyId) fetchData(companyId);
  }, [companyId, statusFilter, page, fetchData]);

  const handleView = async (grn: Grn) => {
    try {
      const res = await api.get(`/ovds/grn/${grn.id}`, { headers: { 'x-background': '1' } });
      const detail = res.data?.data ?? res.data;
      setSelectedGrn(detail);
      setMatchResult(null);
      setModalOpen(true);
    } catch {
      toast.error('Failed to load GRN detail');
    }
  };

  const handleThreeWayMatch = async (grnId: string) => {
    try {
      const res = await api.get(`/ovds/grn/${grnId}/three-way-match`, { headers: { 'x-background': '1' } });
      const result = res.data?.data ?? res.data;
      setMatchResult(result);
    } catch {
      toast.error('Failed to run 3-way match');
    }
  };

  const handleConfirm = async (grn: Grn) => {
    if (!confirm(`Confirm GRN ${grn.grnNumber}? This will update stock levels and post GRNI journal entries.`)) return;
    setSaving(true);
    try {
      await api.post(`/ovds/grn/${grn.id}/confirm`, {});
      toast.success(`GRN ${grn.grnNumber} confirmed`);
      fetchData(companyId);
      setModalOpen(false);
    } catch {
      toast.error('Failed to confirm GRN');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkBill = async (grn: Grn) => {
    setSelectedGrn(grn);
    setLinkBillOpen(true);
  };

  const submitLinkBill = async (billId: string) => {
    if (!selectedGrn || !billId) return;
    setSaving(true);
    try {
      await api.post(`/ovds/grn/${selectedGrn.id}/link-bill`, { billId });
      toast.success('Bill linked successfully');
      setLinkBillOpen(false);
      fetchData(companyId);
      setModalOpen(false);
    } catch {
      toast.error('Failed to link bill');
    } finally {
      setSaving(false);
    }
  };

interface CreateGrnDto {
  vendorName: string;
  receivedBy?: string;
  notes?: string;
  companyId?: string;
  items: GrnItem[];
}

  const handleCreate = async (dto: CreateGrnDto) => {
    setSaving(true);
    try {
      await api.post('/ovds/grn', dto);
      toast.success('GRN created');
      setCreateOpen(false);
      fetchData(companyId);
    } catch {
      toast.error('Failed to create GRN');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (grn: Grn) => {
    if (!confirm(`Delete GRN ${grn.grnNumber}?`)) return;
    setSaving(true);
    try {
      await api.delete(`/ovds/grn/${grn.id}`);
      toast.success('GRN deleted');
      fetchData(companyId);
      setModalOpen(false);
    } catch {
      toast.error('Failed to delete GRN');
    } finally {
      setSaving(false);
    }
  };

  const blankItems = (): GrnItem[] => [{ orderedQty: 0, receivedQty: 0, rejectedQty: 0, unitCost: 0, totalCost: 0 }];

  return (
    <AppPage
      title="Goods Received Notes"
      subtitle="Procurement · 3-Way Match · GRNI"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Btn variant="primary" size="sm" onClick={() => setCreateOpen(true)} icon={<Icon name="PLUS" size={11} />}>
            New GRN
          </Btn>
          <Btn variant="secondary" size="sm" onClick={() => fetchData(companyId)} icon={<Icon name="REFRESH_CW" size={11} />}>
            Refresh
          </Btn>
        </div>
      }
    >
      {stats && (
        <div className="ovds-grid-layout cols-5 gap-sm mb-6">
          {[
            { label: 'Total GRNs', value: stats.total, color: 'text-slate-700' },
            { label: 'Draft', value: stats.pending, color: 'text-amber-600' },
            { label: 'Confirmed', value: stats.confirmed, color: 'text-[var(--pro-azure)]' },
            { label: 'Billed', value: stats.billed, color: 'text-[var(--pro-azure)]' },
            { label: 'Awaiting Bill', value: stats.awaitingBill, color: 'text-violet-600' },
          ].map((k, i) => (
            <div key={i} className="ovds-widget-card p-4">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
              {loading ? (
                <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className={`text-xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="ovds-widget-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e); }}
              className="text-xs w-40"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="BILLED">Billed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
          <span className="text-[11px] text-slate-400">{total} GRN(s)</span>
        </div>
        <AppTable>
          <thead>
            <tr>
              <AppTh>GRN Number</AppTh>
              <AppTh>Vendor</AppTh>
              <AppTh>Received At</AppTh>
              <AppTh>Items</AppTh>
              <AppTh>Total Cost</AppTh>
              <AppTh>Status</AppTh>
              <AppTh>Actions</AppTh>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-slate-400">
                  No GRNs found. Create your first GRN to get started.
                </td>
              </tr>
            ) : (
              data.map((grn) => {
                const style = STATUS_STYLE[grn.status] ?? STATUS_STYLE.DRAFT;
                const totalCost = grn.items.reduce((s, i) => s + Number(i.totalCost ?? 0), 0);
                return (
                  <AppTr key={grn.id}>
                    <AppTd>
                      <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{grn.grnNumber}</span>
                    </AppTd>
                    <AppTd>
                      <span className="text-[12px] text-slate-600 dark:text-slate-300">{grn.vendorName || '—'}</span>
                    </AppTd>
                    <AppTd>
                      <span className="text-[11px] text-slate-500">
                        {grn.receivedAt ? new Date(grn.receivedAt).toLocaleDateString('en-ET') : '—'}
                      </span>
                    </AppTd>
                    <AppTd>
                      <span className="text-[11px] text-slate-500">{grn.items.length} item(s)</span>
                    </AppTd>
                    <AppTd align="right">
                      <span className="tabular-nums text-[12px] font-semibold text-slate-700 dark:text-slate-200">{fmt(totalCost)}</span>
                    </AppTd>
                    <AppTd>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.cls}`}>
                        {style.icon}
                        {grn.status}
                      </span>
                    </AppTd>
                    <AppTd>
                      <div className="flex items-center gap-1">
                        <Btn variant="ghost" size="sm" onClick={() => handleView(grn)} icon={<Icon name="EYE" size={11} />} />
                        {grn.status === 'DRAFT' && (
                          <Btn variant="ghost" size="sm" onClick={() => handleConfirm(grn)} icon={<Icon name="CHECK" size={11} />} />
                        )}
                        {grn.status === 'CONFIRMED' && !grn.billId && (
                          <Btn variant="ghost" size="sm" onClick={() => handleLinkBill(grn)} icon={<Icon name="LINK_2" size={11} />} />
                        )}
                      </div>
                    </AppTd>
                  </AppTr>
                );
              })
            )}
          </tbody>
        </AppTable>
        {total > 20 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <Btn variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Previous
            </Btn>
            <span className="text-[11px] text-slate-400">Page {page}</span>
            <Btn variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)}>
              Next
            </Btn>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {modalOpen && selectedGrn && (
        <Modal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedGrn(null); setMatchResult(null); }}
          title={`GRN ${selectedGrn.grnNumber}`}
          footer={
            <div className="flex items-center gap-2">
              {selectedGrn.status === 'DRAFT' && (
                <Btn variant="primary" size="sm" onClick={() => handleConfirm(selectedGrn)} loading={saving}>
                  Confirm GRN
                </Btn>
              )}
              {selectedGrn.status === 'CONFIRMED' && !selectedGrn.billId && (
                <Btn variant="primary" size="sm" onClick={() => handleLinkBill(selectedGrn)} loading={saving}>
                  Link Bill
                </Btn>
              )}
              <Btn variant="ghost" size="sm" onClick={() => handleThreeWayMatch(selectedGrn.id)}>
                3-Way Match
              </Btn>
              {selectedGrn.status === 'DRAFT' && (
                <Btn variant="danger" size="sm" onClick={() => handleDelete(selectedGrn)} loading={saving}>
                  Delete
                </Btn>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vendor</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{selectedGrn.vendorName || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Received At</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {selectedGrn.receivedAt ? new Date(selectedGrn.receivedAt).toLocaleString('en-ET') : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Received By</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{selectedGrn.receivedBy || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[selectedGrn.status]?.cls ?? ''}`}>
                  {selectedGrn.status}
                </span>
              </div>
            </div>

            {selectedGrn.notes && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Notes</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{selectedGrn.notes}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Items</p>
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Description</AppTh>
                    <AppTh align="right">Ordered</AppTh>
                    <AppTh align="right">Received</AppTh>
                    <AppTh align="right">Rejected</AppTh>
                    <AppTh align="right">Unit Cost</AppTh>
                    <AppTh align="right">Total</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {selectedGrn.items.map((item, i) => (
                    <AppTr key={i}>
                      <AppTd><span className="text-[12px] text-slate-700 dark:text-slate-200">{item.description || '—'}</span></AppTd>
                      <AppTd align="right"><span className="tabular-nums text-[11px]">{Number(item.orderedQty).toFixed(2)}</span></AppTd>
                      <AppTd align="right"><span className="tabular-nums text-[11px]">{Number(item.receivedQty).toFixed(2)}</span></AppTd>
                      <AppTd align="right"><span className="tabular-nums text-[11px]">{Number(item.rejectedQty).toFixed(2)}</span></AppTd>
                      <AppTd align="right"><span className="tabular-nums text-[11px]">{fmt(Number(item.unitCost))}</span></AppTd>
                      <AppTd align="right"><span className="tabular-nums text-[11px] font-semibold">{fmt(Number(item.totalCost))}</span></AppTd>
                    </AppTr>
                  ))}
                </tbody>
              </AppTable>
            </div>

            {selectedGrn.purchaseOrder && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Linked Purchase Order</p>
                <Link to={`/purchases/orders`} className="text-xs text-[var(--pro-azure)] hover:underline">
                  {selectedGrn.purchaseOrder.poNumber || selectedGrn.purchaseOrder.id}
                </Link>
              </div>
            )}

            {selectedGrn.bill && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Linked Bill</p>
                <Link to={`/purchases/bills`} className="text-xs text-[var(--pro-azure)] hover:underline">
                  {selectedGrn.bill.billNumber || selectedGrn.bill.id}
                </Link>
              </div>
            )}

            {matchResult && (
              <div className={`p-4 rounded-xl border ${RECOMMENDATION_STYLE[matchResult.recommendation]}`}>
                <p className="text-xs font-black uppercase tracking-widest mb-1">3-Way Match: {matchResult.recommendation}</p>
                <p className="text-[11px] mb-2">{matchResult.summary}</p>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-slate-500">PO Total:</span> <span className="font-semibold">{fmt(matchResult.totalPoAmount)}</span></div>
                  <div><span className="text-slate-500">GRN Total:</span> <span className="font-semibold">{fmt(matchResult.totalGrnAmount)}</span></div>
                  <div><span className="text-slate-500">Bill Total:</span> <span className="font-semibold">{fmt(matchResult.totalBillAmount)}</span></div>
                </div>
                {matchResult.discrepancies.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {matchResult.discrepancies.map((d, i) => (
                      <div key={i} className="text-[11px]">
                        <span className="font-semibold">{d.field}:</span> PO={String(d.poValue)}, GRN={String(d.grnValue)}, Bill={String(d.billValue)}
                        {d.acceptable && <span className="text-amber-600 ml-1">(within tolerance)</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {createOpen && (
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Goods Received Note"
          footer={
            <Btn variant="primary" size="sm" onClick={() => {
              const form = document.getElementById('grn-form') as HTMLFormElement;
              if (!form) return;
              const fd = new FormData(form);
              const items: GrnItem[] = [];
              const itemRows = form.querySelectorAll('[data-item-row]');
              itemRows.forEach((row) => {
                const desc = (row.querySelector('[data-desc]') as HTMLInputElement)?.value || '';
                const ordered = parseFloat((row.querySelector('[data-ordered]') as HTMLInputElement)?.value || '0');
                const received = parseFloat((row.querySelector('[data-received]') as HTMLInputElement)?.value || '0');
                const rejected = parseFloat((row.querySelector('[data-rejected]') as HTMLInputElement)?.value || '0');
                const unitCost = parseFloat((row.querySelector('[data-unit-cost]') as HTMLInputElement)?.value || '0');
                items.push({ description: desc, orderedQty: ordered, receivedQty: received, rejectedQty: rejected, unitCost, totalCost: received * unitCost });
              });
              handleCreate({
                vendorName: fd.get('vendorName') as string,
                receivedBy: fd.get('receivedBy') as string,
                notes: fd.get('notes') as string,
                companyId,
                items,
              });
            }} loading={saving}>
              Create GRN
            </Btn>
          }
        >
          <form id="grn-form" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Vendor Name" required>
                <Input name="vendorName" placeholder="Vendor name" />
              </FormField>
              <FormField label="Received By">
                <Input name="receivedBy" placeholder="Receiver name" />
              </FormField>
            </div>
            <FormField label="Notes">
              <Input name="notes" placeholder="Optional notes" />
            </FormField>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Items</p>
              <div className="space-y-2" id="grn-items">
                {blankItems().map((_, i) => (
                  <div key={i} data-item-row className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Input data-desc placeholder="Item description" />
                    </div>
                    <div className="col-span-2">
                      <Input data-ordered type="number" step="0.01" placeholder="Ordered" />
                    </div>
                    <div className="col-span-2">
                      <Input data-received type="number" step="0.01" placeholder="Received" />
                    </div>
                    <div className="col-span-2">
                      <Input data-rejected type="number" step="0.01" placeholder="Rejected" />
                    </div>
                    <div className="col-span-2">
                      <Input data-unit-cost type="number" step="0.01" placeholder="Unit Cost" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Link Bill Modal */}
      {linkBillOpen && selectedGrn && (
        <Modal
          open={linkBillOpen}
          onClose={() => setLinkBillOpen(false)}
          title={`Link Bill to ${selectedGrn.grnNumber}`}
          footer={
            <div className="flex items-center gap-2">
              <Input
                id="link-bill-id"
                placeholder="Enter Bill ID"
                className="text-xs"
              />
              <Btn
                variant="primary"
                size="sm"
                onClick={() => {
                  const input = document.getElementById('link-bill-id') as HTMLInputElement;
                  submitLinkBill(input.value);
                }}
                loading={saving}
              >
                Link
              </Btn>
            </div>
          }
        >
          <p className="text-xs text-slate-500">
            Enter the Bill ID to link to this GRN. This will trigger the 3-way match process.
          </p>
        </Modal>
      )}
    </AppPage>
  );
};

export default GoodsReceivedNotes;

