/**
 * SupplierPaymentRun — ovds-style supplier payment run management
 * AppPage · AppKpi · AppTable · useApiCrud
 * Ethiopian WHT · cheque printing · payment scheduling
 */
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Textarea, Select,
  SearchBar, Amount, Pagination, EmptyState,
} from '../components/ui';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';
import { confirm } from '../utils/confirm';
import { fmtCurrency, fmtDate } from '../utils/fmt';

// -- Types ---------------------------------------------------------------------
interface PaymentBatchItem {
  id: string;
  billId: string;
  billNumber: string;
  vendorName: string;
  amount: number;
  whtAmount: number;
  cashDiscount: number;
  netPayable: number;
  paymentMethod: string;
  chequeNumber: string;
  status: string;
  dueDate: string;
  isPriority: boolean;
}

interface PaymentBatch {
  id: string;
  name: string;
  status: string;
  totalAmount: number;
  paymentRunDate: string;
  paymentMethod: string;
  chequeNumber: string;
  paymentReference: string;
  approvedBy: string;
  approvedAt: string;
  submittedBy: string;
  submittedAt: string;
  notes: string;
  paymentBatchItem: PaymentBatchItem[];
}

type FilterTab = 'ALL' | 'DRAFT' | 'APPROVED' | 'SUBMITTED' | 'COMPLETED' | 'PARTIAL' | 'CANCELLED';
type ProposalTab = 'ALL' | 'PRIORITY' | 'STANDARD';

const BATCH_STATUS_TABS: FilterTab[] = ['ALL', 'DRAFT', 'APPROVED', 'SUBMITTED', 'COMPLETED', 'PARTIAL', 'CANCELLED'];
const _PROPOSAL_TABS: ProposalTab[] = ['ALL', 'PRIORITY', 'STANDARD'];
const PAYMENT_METHODS = ['BANK_TRANSFER', 'CHEQUE', 'CASH', 'MOBILE_MONEY'];
const PRIORITY_OPTIONS = [
  { value: 'DUE_DATE', label: 'Due Date' },
  { value: 'AMOUNT', label: 'Amount (High to Low)' },
  { value: 'VENDOR', label: 'Vendor Name' },
];

// -- Proposal Modal -----------------------------------------------------------
interface ProposalModalProps {
  open: boolean;
  onClose: () => void;
  onCreateBatch: (data: any) => void;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ open, onClose, onCreateBatch }) => {
  const [step, setStep] = useState<'FILTERS' | 'REVIEW'>('FILTERS');
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dueDateFrom: '',
    dueDateTo: '',
    vendorIds: '',
    minAmount: '',
    maxAmount: '',
    includeWht: true,
    cashDiscount: false,
    cashDiscountPct: '',
    priority: 'DUE_DATE',
  });
  const [batchName, setBatchName] = useState(`Payment Run - ${new Date().toLocaleDateString()}`);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [bankAccountId, _setBankAccountId] = useState('');
  const [notes, setNotes] = useState('');

  const buildProposal = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
      if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
      if (filters.vendorIds) params.append('vendorIds', filters.vendorIds);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      if (!filters.includeWht) params.append('includeWht', 'false');
      if (filters.cashDiscount) {
        params.append('cashDiscount', 'true');
        if (filters.cashDiscountPct) params.append('cashDiscountPct', filters.cashDiscountPct);
      }
      if (filters.priority) params.append('priority', filters.priority);

      const { data } = await api.get('/treasury/supplier-payment-run/proposal', { params });
      setProposal(data);
      setStep('REVIEW');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to build proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!proposal || proposal.items.length === 0) {
      toast.error('No bills selected for payment');
      return;
    }

    onCreateBatch({
      name: batchName,
      billIds: proposal.items.map((i: any) => i.billId),
      paymentRunDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      bankAccountId: bankAccountId || null,
      includeWht: filters.includeWht,
      cashDiscount: filters.cashDiscount,
      cashDiscountPct: filters.cashDiscount ? Number(filters.cashDiscountPct) || 0 : null,
      notes,
    });
  };

  return (
    <Modal open={open} title={step === 'FILTERS' ? 'Build Payment Proposal' : 'Review Payment Proposal'} onClose={onClose} width="lg">
      <div className="space-y-4">
        {step === 'FILTERS' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Due Date From">
                <Input type="date" value={filters.dueDateFrom} onChange={e => setFilters({ ...filters, dueDateFrom: e.target.value })} />
              </FormField>
              <FormField label="Due Date To">
                <Input type="date" value={filters.dueDateTo} onChange={e => setFilters({ ...filters, dueDateTo: e.target.value })} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Min Amount (ETB)">
                <Input type="number" value={filters.minAmount} onChange={e => setFilters({ ...filters, minAmount: e.target.value })} placeholder="0" />
              </FormField>
              <FormField label="Max Amount (ETB)">
                <Input type="number" value={filters.maxAmount} onChange={e => setFilters({ ...filters, maxAmount: e.target.value })} placeholder="No limit" />
              </FormField>
            </div>
            <FormField label="Vendor IDs (comma-separated, optional)">
              <Input value={filters.vendorIds} onChange={e => setFilters({ ...filters, vendorIds: e.target.value })} placeholder="vendor-id-1, vendor-id-2" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Priority">
                <Select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e })}>
                  {PRIORITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Select>
              </FormField>
              <FormField label="Payment Method">
                <Select value={paymentMethod} onChange={e => setPaymentMethod(e)}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                </Select>
              </FormField>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={filters.includeWht} onChange={e => setFilters({ ...filters, includeWht: e.target.checked })} />
                Include WHT (2% on qualifying bills)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={filters.cashDiscount} onChange={e => setFilters({ ...filters, cashDiscount: e.target.checked })} />
                Apply Cash Discount
              </label>
            </div>
            {filters.cashDiscount && (
              <FormField label="Cash Discount %">
                <Input type="number" value={filters.cashDiscountPct} onChange={e => setFilters({ ...filters, cashDiscountPct: e.target.value })} placeholder="e.g. 2.5" />
              </FormField>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn onClick={buildProposal} loading={loading}>Build Proposal</Btn>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-[10px] font-bold uppercase text-slate-500">Bills</div>
                <div className="text-xl font-bold text-slate-900">{proposal?.count ?? 0}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-[10px] font-bold uppercase text-slate-500">Gross Outstanding</div>
                <div className="text-xl font-bold text-slate-900">{fmtCurrency(proposal?.totalOutstanding ?? 0)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-[10px] font-bold uppercase text-slate-500">WHT</div>
                <div className="text-xl font-bold text-rose-600">{fmtCurrency(proposal?.totalWht ?? 0)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-[10px] font-bold uppercase text-slate-500">Net Payable</div>
                <div className="text-xl font-bold text-[var(--pro-azure)]">{fmtCurrency(proposal?.totalNetPayable ?? 0)}</div>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-2 text-[10px] font-bold uppercase text-slate-500">Bill</th>
                    <th className="text-left p-2 text-[10px] font-bold uppercase text-slate-500">Vendor</th>
                    <th className="text-right p-2 text-[10px] font-bold uppercase text-slate-500">Outstanding</th>
                    <th className="text-right p-2 text-[10px] font-bold uppercase text-slate-500">WHT</th>
                    <th className="text-right p-2 text-[10px] font-bold uppercase text-slate-500">Discount</th>
                    <th className="text-right p-2 text-[10px] font-bold uppercase text-slate-500">Net Payable</th>
                    <th className="text-left p-2 text-[10px] font-bold uppercase text-slate-500">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal?.items?.map((item: any) => (
                    <tr key={item.billId} className="border-t">
                      <td className="p-2 font-mono text-xs">{item.billNumber}</td>
                      <td className="p-2">{item.vendorName}</td>
                      <td className="p-2 text-right">{fmtCurrency(item.outstanding)}</td>
                      <td className="p-2 text-right text-rose-600">{fmtCurrency(item.whtAmount)}</td>
                      <td className="p-2 text-right text-amber-600">{fmtCurrency(item.cashDiscount)}</td>
                      <td className="p-2 text-right font-bold">{fmtCurrency(item.netPayable)}</td>
                      <td className="p-2 text-xs">{fmtDate(item.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3">
              <FormField label="Batch Name">
                <Input value={batchName} onChange={e => setBatchName(e.target.value)} />
              </FormField>
              <FormField label="Notes">
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </FormField>
            </div>
            <div className="flex justify-between pt-2">
              <Btn variant="ghost" onClick={() => setStep('FILTERS')}>Back to Filters</Btn>
              <Btn onClick={handleCreate}>Create Payment Batch</Btn>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// -- Main Page -----------------------------------------------------------------
const SupplierPaymentRun: React.FC = () => {
  usePageTitle('Supplier Payment Run');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [showProposalModal, setShowProposal] = useState(false);
  const [search, setSearch] = useState('');

  const { rows: batches, refetch, loading: _isLoading } = useApiCrud<PaymentBatch>({
    endpoint: '/treasury/supplier-payment-run/batches',
    autoFetch: true,
  });

  const handleCreateBatch = async (data: any) => {
    try {
      await api.post('/treasury/supplier-payment-run/batches', data);
      toast.success('Payment batch created');
      setShowProposal(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create batch');
    }
  };

  const handleApprove = async (id: string) => {
    const ok = await confirm({ message: 'Approve this payment batch for submission?' });
    if (!ok) return;
    try {
      await api.patch(`/treasury/supplier-payment-run/batches/${id}/approve`);
      toast.success('Batch approved');
      refetch();
    } catch {
      toast.error('Failed to approve batch');
    }
  };

  const handleSubmit = async (id: string) => {
    const ok = await confirm({ message: 'Submit this payment batch for processing?' });
    if (!ok) return;
    try {
      await api.post(`/treasury/supplier-payment-run/batches/${id}/submit`);
      toast.success('Batch submitted for payment');
      refetch();
    } catch {
      toast.error('Failed to submit batch');
    }
  };

  const handleRecordPayments = async (id: string) => {
    const ok = await confirm({ message: 'Record payments for all items in this batch? This will create bill payments and update bill statuses.' });
    if (!ok) return;
    try {
      const { data } = await api.post(`/treasury/supplier-payment-run/batches/${id}/record-payments`);
      toast.success(`Recorded ${data.paidCount} of ${data.totalItems} payments`);
      refetch();
    } catch {
      toast.error('Failed to record payments');
    }
  };

  const handleCancel = async (id: string) => {
    const ok = await confirm({ message: 'Cancel this payment batch? This action cannot be undone.' });
    if (!ok) return;
    try {
      await api.delete(`/treasury/supplier-payment-run/batches/${id}`);
      toast.success('Batch cancelled');
      refetch();
    } catch {
      toast.error('Failed to cancel batch');
    }
  };

  const filteredBatches = useMemo(() => {
    if (!batches) return [];
    if (activeTab === 'ALL') return batches;
    return batches.filter((b: PaymentBatch) => b.status === activeTab);
  }, [batches, activeTab]);

  const kpis = useMemo(() => {
    if (!batches) return { total: 0, draft: 0, approved: 0, submitted: 0, completed: 0, totalAmount: 0 };
    return {
      total: batches.length,
      draft: batches.filter((b: PaymentBatch) => b.status === 'DRAFT').length,
      approved: batches.filter((b: PaymentBatch) => b.status === 'APPROVED').length,
      submitted: batches.filter((b: PaymentBatch) => b.status === 'SUBMITTED').length,
      completed: batches.filter((b: PaymentBatch) => b.status === 'COMPLETED').length,
      totalAmount: batches.reduce((s: number, b: PaymentBatch) => s + Number(b.totalAmount), 0),
    };
  }, [batches]);

  return (
    <AppPage title="Supplier Payment Run" subtitle="Manage supplier payment batches, approval workflows, and payment runs">
      <div className="space-y-4">
        {/* KPI Strip */}
        <div className="grid grid-cols-6 gap-3">
          <div className="bg-white border rounded-lg p-3">
            <div className="text-[10px] font-bold uppercase text-slate-500">Total Batches</div>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-[10px] font-bold uppercase text-amber-700">Draft</div>
            <div className="text-2xl font-bold text-amber-700">{kpis.draft}</div>
          </div>
          <div className="bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-lg p-3">
            <div className="text-[10px] font-bold uppercase text-[var(--pro-azure-dark)]">Approved</div>
            <div className="text-2xl font-bold text-[var(--pro-azure-dark)]">{kpis.approved}</div>
          </div>
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
            <div className="text-[10px] font-bold uppercase text-violet-700">Submitted</div>
            <div className="text-2xl font-bold text-violet-700">{kpis.submitted}</div>
          </div>
          <div className="bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-lg p-3">
            <div className="text-[10px] font-bold uppercase text-[var(--pro-azure-dark)]">Completed</div>
            <div className="text-2xl font-bold text-[var(--pro-azure-dark)]">{kpis.completed}</div>
          </div>
          <div className="bg-slate-50 border rounded-lg p-3">
            <div className="text-[10px] font-bold uppercase text-slate-500">Total Value</div>
            <div className="text-2xl font-bold">{fmtCurrency(kpis.totalAmount)}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="Search batches..." className="w-64" />
          </div>
          <Btn icon={<span className="text-lg">+</span>} onClick={() => setShowProposal(true)}>New Payment Run</Btn>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex gap-0">
            {BATCH_STATUS_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === tab ? 'border-[var(--pro-azure)] text-[var(--pro-azure-dark)]' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <AppTable>
            <thead className="bg-slate-50">
              <tr>
                <AppTh>Batch Name</AppTh>
                <AppTh>Run Date</AppTh>
                <AppTh>Payment Method</AppTh>
                <AppTh>Cheque / Ref</AppTh>
                <AppTh>Bills</AppTh>
                <AppTh align="right">Total Amount</AppTh>
                <AppTh>Status</AppTh>
                <AppTh>Approved By</AppTh>
                <AppTh align="right">Actions</AppTh>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch: PaymentBatch) => (
                <AppTr key={batch.id}>
                  <AppTd>
                    <div>
                      <div className="font-semibold text-sm">{batch.name}</div>
                      <div className="text-[10px] text-slate-500">ID: {batch.id.slice(0, 8)}</div>
                    </div>
                  </AppTd>
                  <AppTd className="text-xs">{fmtDate(batch.paymentRunDate)}</AppTd>
                  <AppTd>
                    <span className="text-xs">{batch.paymentMethod?.replace(/_/g, ' ') ?? 'N/A'}</span>
                  </AppTd>
                  <AppTd>
                    <div className="text-xs font-mono">{batch.chequeNumber ?? batch.paymentReference ?? '-'}</div>
                  </AppTd>
                  <AppTd>
                    <span className="text-xs">{batch.paymentBatchItem?.length ?? 0} bills</span>
                  </AppTd>
                  <AppTd className="text-right">
                    <Amount value={batch.totalAmount} />
                  </AppTd>
                  <AppTd>
                    <StatusBadge status={batch.status} />
                  </AppTd>
                  <AppTd className="text-xs">{batch.approvedBy ?? '-'}</AppTd>
                  <AppTd className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {batch.status === 'DRAFT' && (
                        <>
                          <Btn size="xs" variant="ghost" onClick={() => handleApprove(batch.id)}>Approve</Btn>
                          <Btn size="xs" variant="ghost" onClick={() => handleCancel(batch.id)}>Cancel</Btn>
                        </>
                      )}
                      {batch.status === 'APPROVED' && (
                        <Btn size="xs" variant="ghost" onClick={() => handleSubmit(batch.id)}>Submit</Btn>
                      )}
                      {batch.status === 'SUBMITTED' && (
                        <Btn size="xs" variant="primary" onClick={() => handleRecordPayments(batch.id)}>Record Payments</Btn>
                      )}
                    </div>
                  </AppTd>
                </AppTr>
              ))}
              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <EmptyState title="No payment batches" description="Create a new payment run to get started" />
                  </td>
                </tr>
              )}
            </tbody>
          </AppTable>
        </div>

        {/* Proposal Modal */}
        {showProposalModal && (
          <ProposalModal open={showProposalModal} onClose={() => setShowProposal(false)} onCreateBatch={handleCreateBatch} />
        )}
      </div>
    </AppPage>
  );
};

export default SupplierPaymentRun;
