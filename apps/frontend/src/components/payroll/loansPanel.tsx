import { evalMath } from '@ovds/ui';
import {
  Plus, Search, XCircle, Trash2,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';

type LoanStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'CLOSED' | 'REJECTED';
type LoanCategory = 'LOAN' | 'ADVANCE' | 'RECRUITMENT_ADVANCE';

interface Loan {
  id: string;
  employeeId: string;
  employeeName?: string;
  category: LoanCategory;
  amount: number;
  outstandingBalance: number;
  installments: number;
  interestRate: number;
  status: LoanStatus;
  startDate?: string;
  notes?: string;
  /** Populated for RECRUITMENT_ADVANCE — external candidate not yet an employee */
  candidateName?: string;
}

const STATUS_COLORS: Record<LoanStatus, string> = {
  PENDING:  'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  APPROVED: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-[var(--pro-azure-50)]0/10 dark:text-[var(--pro-azure-light)]',
  ACTIVE:   'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-[var(--pro-azure-50)]0/10 dark:text-[var(--pro-azure-light)]',
  CLOSED:   'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

const LoanModal: React.FC<{ loan?: Loan | null; onClose: () => void; onSave: () => void }> = ({ loan, onClose, onSave }) => {
  const [form, setForm] = useState({
    employeeId: loan?.employeeId ?? '',
    category: loan?.category ?? 'LOAN' as LoanCategory,
    candidateName: loan?.candidateName ?? '',
    amount: loan?.amount?.toString() ?? '',
    installments: loan?.installments?.toString() ?? '12',
    interestRate: loan?.interestRate?.toString() ?? '0',
    startDate: loan?.startDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    notes: loan?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const isRecruitment = form.category === 'RECRUITMENT_ADVANCE';

  const monthlyPayment = form.amount && form.installments
    ? (parseFloat(form.amount) / parseInt(form.installments)).toFixed(2)
    : '—';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRecruitment && !form.employeeId) { toast.error('Employee ID is required'); return; }
    if (isRecruitment && !form.candidateName.trim()) { toast.error('Candidate name is required for Recruitment Advance'); return; }
    if (!form.amount) { toast.error('Amount is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        installments: parseInt(form.installments),
        interestRate: parseFloat(form.interestRate),
        candidateName: isRecruitment ? form.candidateName : undefined,
      };
      if (loan?.id) {
        await api.patch(`/payroll/loans/${loan.id}`, payload);
        toast.success('Loan updated');
      } else {
        await api.post('/payroll/loans', payload);
        toast.success(isRecruitment ? 'Recruitment advance created' : 'Loan request created');
      }
      onSave(); onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to save loan');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {loan ? 'Edit Loan' : isRecruitment ? 'New Recruitment Advance' : 'New Loan / Advance'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><XCircle size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Category first so the employee/candidate field below reacts */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as LoanCategory, employeeId: '', candidateName: '' }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white">
                <option value="LOAN">Loan</option>
                <option value="ADVANCE">Advance</option>
                <option value="RECRUITMENT_ADVANCE">Recruitment Advance — Workflow B (candidate cost recovery)</option>
              </select>
              {isRecruitment && (
                <p className="text-[10px] text-amber-600 mt-1">
                  Track as balance-sheet advance (account 1030) — move to expense when recovered via payroll or written off.
                </p>
              )}
            </div>

            {/* Employee ID — hidden for RECRUITMENT_ADVANCE */}
            {!isRecruitment && (
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Employee ID *</label>
                <input value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white"
                  placeholder="EMP-001" />
              </div>
            )}

            {/* Candidate name — only for RECRUITMENT_ADVANCE */}
            {isRecruitment && (
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Candidate Name *</label>
                <input value={form.candidateName} onChange={e => setForm(f => ({ ...f, candidateName: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white"
                  placeholder="Full name of the external candidate" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Amount (ETB) *</label>
              <input type="text" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} onBlur={e => setForm(f => ({ ...f, amount: String(evalMath(e.target.value) ?? e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Installments</label>
              <input type="number" min="1" max="60" value={form.installments} onChange={e => setForm(f => ({ ...f, installments: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white" />
            </div>
            {!isRecruitment && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Interest Rate (%)</label>
                <input type="number" min="0" step="0.1" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white" />
            </div>
          </div>
          {form.amount && (
            <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/20 rounded-xl">
              <p className="text-xs font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">
                {isRecruitment ? 'Monthly Recovery Deduction' : 'Monthly Deduction'}
              </p>
              <p className="text-lg font-semibold text-[var(--pro-azure-dark)] dark:text-green-300">ETB {monthlyPayment}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white resize-none"
              placeholder={isRecruitment ? 'Cost recovery clause reference, offer letter date…' : ''} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : loan ? 'Update' : isRecruitment ? 'Create Advance' : 'Create Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LoansPanel: React.FC = () => {
  const { can } = useAuth();
  const canWrite = can('payroll:generate');
  const canApprove = can('payroll:approve');

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/loans');
      const d = res.data?.data ?? res.data;
      const arr = Array.isArray(d) ? d : (d?.data ?? d?.items ?? d?.loans ?? []);
      setLoans(arr);
    } catch { setLoans([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/payroll/loans/${id}/approve`);
      toast.success('Loan approved');
      fetchLoans();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this loan?')) return;
    try {
      await api.delete(`/payroll/loans/${id}`);
      toast.success('Deleted');
      fetchLoans();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const filtered = loans.filter(l => {
    const q = search.toLowerCase();
    return !q || l.employeeId.toLowerCase().includes(q) || l.employeeName?.toLowerCase().includes(q);
  });

  const stats = {
    total: loans.length,
    active: loans.filter(l => l.status === 'ACTIVE').length,
    totalDisbursed: loans.filter(l => ['ACTIVE', 'CLOSED'].includes(l.status)).reduce((s, l) => s + l.amount, 0),
    outstanding: loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + l.outstandingBalance, 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="ovds-grid-layout cols-4 flex-1">
          {[
            { label: 'Total Loans', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Total Disbursed (ETB)', value: stats.totalDisbursed.toLocaleString() },
            { label: 'Outstanding (ETB)', value: stats.outstanding.toLocaleString() },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{loading ? '—' : s.value}</p>
            </div>
          ))}
        </div>
        {canWrite && (
          <button onClick={() => { setEditLoan(null); setShowModal(true); }}
            className="ml-4 flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors shrink-0">
            <Plus size={14} /> New Loan
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 max-w-sm">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee..."
          className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400" />
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
              {['Employee', 'Type', 'Amount', 'Outstanding', 'Installments', 'Monthly', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">No loans found</td></tr>
            ) : (
              filtered.map(l => (
                <tr key={l.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800 dark:text-white text-xs">
                      {l.category === 'RECRUITMENT_ADVANCE' ? (l.candidateName ?? 'Candidate') : (l.employeeName ?? l.employeeId)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {l.category === 'RECRUITMENT_ADVANCE' ? 'Candidate Advance' : l.employeeId}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      l.category === 'RECRUITMENT_ADVANCE'
                        ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>{l.category.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-xs">ETB {l.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400 text-xs">ETB {l.outstandingBalance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 text-center">{l.installments}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">ETB {(l.amount / l.installments).toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canApprove && l.status === 'PENDING' && (
                        <button onClick={() => handleApprove(l.id)}
                          className="px-2 py-1 bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] rounded-lg text-xs font-bold hover:bg-[var(--pro-azure-200)] transition-colors">
                          Approve
                        </button>
                      )}
                      {canWrite && (
                        <button onClick={() => handleDelete(l.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && <LoanModal loan={editLoan} onClose={() => setShowModal(false)} onSave={fetchLoans} />}
    </div>
  );
};

export default LoansPanel;







