/**
 * ReimbursementPanel — Field reimbursement claims management
 * Used inside PayrollAdministration ?tab=reimbursement
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { RefreshCw, Plus, CheckCircle2, XCircle, Banknote, Trash2 } from 'lucide-react';
import { useAuth } from '../../rbac/AuthContext';
import { confirm } from '../../utils/confirm';
import api from '../../services/api';
import {
  AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, EmptyState, Pagination,
} from '../ui';

interface ReimbursementClaim {
  id: string;
  employeeId: string;
  employee?: { firstName: string; lastName: string; employeeId: string };
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  locationTier: number;
  transportCost?: number;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  /** EMPLOYEE_EXPENSE | CANDIDATE_REIMBURSEMENT */
  workflowType?: string;
  candidateName?: string;
  recoveryClause?: boolean;
}

interface Employee { id: string; firstName: string; lastName: string; employeeId: string; }

const TIER_LABELS: Record<number, string> = { 1: 'Tier 1 — Addis Ababa', 2: 'Tier 2 — Urban', 3: 'Tier 3 — Rural' };
const TIER_CLS: Record<number, string> = {
  1: 'bg-rose-50 text-rose-700 border-rose-100',
  2: 'bg-amber-50 text-amber-700 border-amber-100',
  3: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const PAGE_SIZE = 25;

interface Props { companyId?: string | null; }

const ReimbursementPanel: React.FC<Props> = ({ companyId }) => {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<ReimbursementClaim> }>({ open: false, data: {} });
  const [saving, setSaving] = useState(false);

  const canWrite  = can('payroll:write') || can('payroll:generate');
  const canApprove = can('payroll:approve');

  // -- Fetch claims ----------------------------------------------------------
  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['reimbursement', companyId, page, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (companyId) params.set('companyId', companyId);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      return api.get(`/payroll/reimbursement?${params}`).then((r: any) => r.data);
    },
    staleTime: 30_000,
  });

  const claims: ReimbursementClaim[] = useMemo(() => {
    const d = raw?.data ?? raw;
    return Array.isArray(d) ? d : (d?.data ?? d?.items ?? []);
  }, [raw]);
  const total = raw?.data?.pagination?.total ?? raw?.pagination?.total ?? raw?.total ?? claims.length;

  // -- Fetch stats -----------------------------------------------------------
  const { data: statsRaw } = useQuery({
    queryKey: ['reimbursement-stats', companyId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (companyId) params.set('companyId', companyId);
      return api.get(`/payroll/reimbursement/stats?${params}`).then((r: any) => r.data?.data ?? r.data);
    },
    staleTime: 60_000,
  });
  const stats = statsRaw ?? {};

  // -- Fetch employees for dropdown ------------------------------------------
  const { data: empRaw } = useQuery({
    queryKey: ['employees-list', companyId],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '500' });
      if (companyId) params.set('companyId', companyId);
      return api.get(`/hr/employees?${params}`).then((r: any) => r.data);
    },
    staleTime: 120_000,
  });
  const employees: Employee[] = useMemo(() => {
    const d = empRaw?.data ?? empRaw;
    return Array.isArray(d) ? d : (d?.data ?? d?.employees ?? []);
  }, [empRaw]);

  // -- Filtered list ---------------------------------------------------------
  const filtered = useMemo(() => {
    if (!search.trim()) return claims;
    const q = search.toLowerCase();
    return claims.filter(c =>
      [c.destination, c.purpose, c.employee?.firstName, c.employee?.lastName, c.employee?.employeeId]
        .some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [claims, search]);

  const kpiCells = [
    { label: 'Total',    value: stats.total    ?? 0, color: 'emerald' as const },
    { label: 'Pending',  value: stats.pending  ?? 0, color: 'amber'   as const },
    { label: 'Approved', value: stats.approved ?? 0, color: 'sky'     as const },
    { label: 'Rejected', value: stats.rejected ?? 0, color: 'rose'    as const },
    { label: 'Paid (ETB)', value: Number(stats.totalApprovedAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: 'violet' as const },
  ];

  // -- Submit claim ----------------------------------------------------------
  const handleSave = async () => {
    const d = modal.data;
    const isCandidateWorkflow = d.workflowType === 'CANDIDATE_REIMBURSEMENT';

    // For candidate reimbursements, candidateName replaces employeeId requirement
    if (!isCandidateWorkflow && !d.employeeId) {
      toast.error('Employee is required'); return;
    }
    if (isCandidateWorkflow && !d.candidateName?.trim()) {
      toast.error('Candidate name is required'); return;
    }
    if (!d.destination || !d.startDate || !d.endDate || !d.purpose || !d.locationTier) {
      toast.error('All required fields must be filled'); return;
    }
    setSaving(true);
    try {
      const payload = {
        employeeId: d.employeeId ?? '',
        destination: d.destination,
        startDate: d.startDate,
        endDate: d.endDate,
        purpose: d.purpose,
        locationTier: Number(d.locationTier),
        transportCost: d.transportCost ? Number(d.transportCost) : undefined,
        notes: d.notes,
        workflowType: d.workflowType ?? 'EMPLOYEE_EXPENSE',
        candidateName: d.candidateName,
        recoveryClause: d.recoveryClause ?? false,
        ...(companyId ? { companyId } : {}),
      };
      await api.post('/payroll/reimbursement', payload);
      toast.success('Claim submitted');
      setModal({ open: false, data: {} });
      qc.invalidateQueries({ queryKey: ['reimbursement'] });
      qc.invalidateQueries({ queryKey: ['reimbursement-stats'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit claim');
    } finally {
      setSaving(false);
    }
  };

  // -- Status update ---------------------------------------------------------
  const handleStatus = async (id: string, status: 'APPROVED' | 'REJECTED' | 'PAID') => {
    try {
      await api.patch(`/payroll/reimbursement/${id}/status`, { status });
      toast.success(`Claim ${status.toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ['reimbursement'] });
      qc.invalidateQueries({ queryKey: ['reimbursement-stats'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed');
    }
  };

  // -- Delete ----------------------------------------------------------------
  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: 'Delete reimbursement claim?', variant: 'danger' }))) return;
    try {
      await api.delete(`/payroll/reimbursement/${id}`);
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['reimbursement'] });
      qc.invalidateQueries({ queryKey: ['reimbursement-stats'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete');
    }
  };

  const empName = (c: ReimbursementClaim) =>
    c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : c.employeeId;

  return (
    <div className="space-y-4">
      <AppKpi cells={kpiCells} />

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search claims…" className="w-52" />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
        >
          <option value="ALL">All Status</option>
          {['PENDING', 'APPROVED', 'REJECTED', 'PAID'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex-1" />
        <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => { refetch(); qc.invalidateQueries({ queryKey: ['reimbursement-stats'] }); }}>Refresh</Btn>
        {canWrite && (
          <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: {} })}>
            Submit Claim
          </Btn>
        )}
      </div>

      {/* Table */}
      <AppTable>
        <thead><tr>
          <AppTh>Employee / Candidate</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Destination</AppTh>
          <AppTh>Purpose</AppTh>
          <AppTh>Tier</AppTh>
          <AppTh>Period</AppTh>
          <AppTh align="right">Amount (ETB)</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="120px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={8} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}>
              <EmptyState
                icon={<Banknote size={18} />}
                title="No reimbursement claims"
                desc="Submit a field reimbursement claim to get started"
                action={canWrite ? { label: 'Submit Claim', onClick: () => setModal({ open: true, data: {} }) } : undefined}
              />
            </td></tr>
          ) : filtered.map(c => (
            <AppTr key={c.id}>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                    {String(c.candidateName ?? c.employee?.firstName ?? c.employeeId ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-slate-800">
                      {c.workflowType === 'CANDIDATE_REIMBURSEMENT' ? (c.candidateName ?? '—') : empName(c)}
                    </div>
                    <div className="ovds-caption">{c.employee?.employeeId ?? (c.workflowType === 'CANDIDATE_REIMBURSEMENT' ? 'Candidate' : '')}</div>
                  </div>
                </div>
              </AppTd>
              <AppTd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  c.workflowType === 'CANDIDATE_REIMBURSEMENT'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-sky-50 text-sky-700 border-sky-100'
                }`}>
                  {c.workflowType === 'CANDIDATE_REIMBURSEMENT' ? 'Candidate' : 'Employee'}
                </span>
              </AppTd>
              <AppTd><span className="text-[12px] text-slate-700 font-medium">{c.destination}</span></AppTd>
              <AppTd><span className="text-[11px] text-slate-500">{c.purpose}</span></AppTd>
              <AppTd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${TIER_CLS[c.locationTier] ?? TIER_CLS[3]}`}>
                  {TIER_LABELS[c.locationTier] ?? `Tier ${c.locationTier}`}
                </span>
              </AppTd>
              <AppTd>
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}
                </span>
              </AppTd>
              <AppTd align="right">
                <span className="text-[12px] font-bold text-slate-800">
                  {Number(c.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </AppTd>
              <AppTd><StatusBadge status={c.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {c.status === 'PENDING' && canApprove && (
                    <>
                      <button onClick={() => handleStatus(c.id, 'APPROVED')} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Approve">
                        <CheckCircle2 size={11} />
                      </button>
                      <button onClick={() => handleStatus(c.id, 'REJECTED')} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Reject">
                        <XCircle size={11} />
                      </button>
                    </>
                  )}
                  {c.status === 'APPROVED' && canApprove && (
                    <button onClick={() => handleStatus(c.id, 'PAID')} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-all" title="Mark as Paid">
                      <Banknote size={11} />
                    </button>
                  )}
                  {canWrite && (
                    <button onClick={() => handleDelete(c.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete">
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>

      {total > PAGE_SIZE && (
        <div className="mt-3"><Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} /></div>
      )}

      {/* Submit Claim Modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, data: {} })}
        title="Submit Reimbursement Claim"
        subtitle="Ethiopian field per-diem reimbursement"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal({ open: false, data: {} })}>Cancel</Btn>
            <Btn variant="primary" loading={saving} onClick={handleSave}>Submit Claim</Btn>
          </>
        }
      >
        <div className="space-y-3">
          {/* Workflow type selector */}
          <FormField label="Claim Type" required>
            <Select
              value={modal.data.workflowType ?? 'EMPLOYEE_EXPENSE'}
              onChange={v => setModal(m => ({ ...m, data: { ...m.data, workflowType: v, employeeId: '', candidateName: '' } }))}
            >
              <option value="EMPLOYEE_EXPENSE">Employee Expense — standard field reimbursement</option>
              <option value="CANDIDATE_REIMBURSEMENT">Candidate Reimbursement — interview / relocation cost (Workflow B)</option>
            </Select>
          </FormField>

          {/* Employee selector (standard claims) */}
          {modal.data.workflowType !== 'CANDIDATE_REIMBURSEMENT' && (
            <FormField label="Employee" required>
              <Select
                value={modal.data.employeeId ?? ''}
                onChange={v => setModal(m => ({ ...m, data: { ...m.data, employeeId: v } }))}
              >
                <option value="">Select employee…</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                ))}
              </Select>
            </FormField>
          )}

          {/* Candidate name (Workflow B) */}
          {modal.data.workflowType === 'CANDIDATE_REIMBURSEMENT' && (
            <>
              <FormField label="Candidate Name" required>
                <Input
                  value={modal.data.candidateName ?? ''}
                  onChange={e => setModal(m => ({ ...m, data: { ...m.data, candidateName: e.target.value } }))}
                  placeholder="Full name of the external candidate"
                />
              </FormField>
              <FormField label="Cost Recovery Clause in Offer Letter?">
                <Select
                  value={modal.data.recoveryClause ? 'yes' : 'no'}
                  onChange={v => setModal(m => ({ ...m, data: { ...m.data, recoveryClause: v === 'yes' } }))}
                >
                  <option value="no">No — expense immediately (no recovery)</option>
                  <option value="yes">Yes — track as staff advance, recover via payroll</option>
                </Select>
              </FormField>
            </>
          )}

          <FormField label="Destination" required>
            <Input
              value={modal.data.destination ?? ''}
              onChange={e => setModal(m => ({ ...m, data: { ...m.data, destination: e.target.value } }))}
              placeholder="e.g. Hawassa, SNNPR"
            />
          </FormField>

          <FormField label="Purpose" required>
            <Input
              value={modal.data.purpose ?? ''}
              onChange={e => setModal(m => ({ ...m, data: { ...m.data, purpose: e.target.value } }))}
              placeholder="e.g. Field inspection, Training"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date" required>
              <Input
                type="date"
                value={modal.data.startDate ?? ''}
                onChange={e => setModal(m => ({ ...m, data: { ...m.data, startDate: e.target.value } }))}
              />
            </FormField>
            <FormField label="End Date" required>
              <Input
                type="date"
                value={modal.data.endDate ?? ''}
                onChange={e => setModal(m => ({ ...m, data: { ...m.data, endDate: e.target.value } }))}
              />
            </FormField>
          </div>

          <FormField label="Location Tier" required>
            <Select
              value={String(modal.data.locationTier ?? '')}
              onChange={v => setModal(m => ({ ...m, data: { ...m.data, locationTier: Number(v) } }))}
            >
              <option value="">Select tier…</option>
              {[1, 2, 3].map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
            </Select>
          </FormField>

          <FormField label="Transport Cost (ETB)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={modal.data.transportCost ?? ''}
              onChange={e => setModal(m => ({ ...m, data: { ...m.data, transportCost: Number(e.target.value) } }))}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Notes">
            <Textarea
              value={modal.data.notes ?? ''}
              onChange={e => setModal(m => ({ ...m, data: { ...m.data, notes: e.target.value } }))}
              rows={2}
              placeholder="Additional notes…"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default ReimbursementPanel;

