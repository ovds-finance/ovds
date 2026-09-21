import { AppPage, EmptyState, Skeleton } from '@ovds/ui';
import { ContextualInsight } from '@ovds/ui';
import {
  ArrowRight,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2,
  History,
  Landmark,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  X,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

import { PipelineStageHeader } from '../components/pipelineComponents';
import { useDebounce } from '../hooks';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  DISBURSED: 'bg-teal-100 text-teal-700',
  ACTIVE: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  CLOSED: 'bg-slate-100 text-slate-500',
  REJECTED: 'bg-rose-100 text-rose-6',
};
const STATUSES = Object.keys(STATUS_COLORS);
const ScoreBar: React.FC<{ label: string; value: number; color?: string }> = ({
  label,
  value,
  color = 'bg-[var(--pro-azure-50)]0',
}) => (
  <div>
    {' '}
    <div className="flex justify-between text-xs mb-1">
      {' '}
      <span className="text-slate-500 font-bold">{label}</span>{' '}
      <span className="font-semibold text-slate-700">{value}/100</span>{' '}
    </div>{' '}
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      {' '}
      <div
        className={`h-full ${color} rounded-full transition-all`}
        style={{ width: `${value}%` }}
      />{' '}
    </div>{' '}
  </div>
);
// -- Repayment Modal -----------------------------------------------------------
const RepaymentModal: React.FC<{
  loan: any;
  onClose: () => void;
  onSaved: () => void;
}> = ({ loan, onClose, onSaved }) => {
  const [form, setForm] = useState({
    amount: '',
    method: 'BANK_TRANSFER',
    reference: '',
    paidAt: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const { can } = useAuth();
  const canWrite = can('business_loans:write');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (!canWrite) {
      setSaving(false);
      toast.error('Insufficient permissions');
      return;
    }
    try {
      await api.post(`/ovds/business-loans/${loan.id}/repayments`, {
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference || undefined,
        paidAt: form.paidAt,
        notes: form.notes || undefined,
      });
      toast.success('Repayment recorded');
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Record Loan Repayment"
    >
      {' '}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transition-colors">
        {' '}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          {' '}
          <div>
            {' '}
            <p className="font-semibold text-slate-800">Record Repayment</p>{' '}
            <p className="text-xs text-slate-400">
              {' '}
              {loan.loanNumber} · Outstanding: ETB{' '}
              {fmt(Number(loan.outstandingBalance))}{' '}
            </p>{' '}
          </div>{' '}
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"
          >
            <X size={18} />{' '}
          </button>{' '}
        </div>{' '}
        <form onSubmit={handleSubmit} className="space-y-4">
          {' '}
          <div className="space-y-1">
            {' '}
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {' '}
              Amount (ETB) *{' '}
            </label>{' '}
            <input
              type="number"
              required
              min={0.01}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/20 focus:border-teal-400"
            />{' '}
          </div>{' '}
          <div className="space-y-1">
            {' '}
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {' '}
              Method{' '}
            </label>{' '}
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
            >
              {' '}
              <option value="BANK_TRANSFER">Bank Transfer</option>{' '}
              <option value="CASH">Cash</option>{' '}
              <option value="CHEQUE">Cheque</option>{' '}
            </select>{' '}
          </div>{' '}
          <div className="flex gap-2">
            {' '}
            <button
              type="submit"
              disabled={saving || !form.amount}
              className="flex-1 bg-[var(--pro-azure)] text-white py-3 px-6 rounded-2xl font-semibold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--pro-azure-dark)] transition-all flex items-center justify-center gap-2"
            >
              {' '}
              {saving ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}{' '}
              {saving ? 'Recording...' : 'Record Payment'}{' '}
            </button>{' '}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
            >
              {' '}
              Cancel{' '}
            </button>{' '}
          </div>{' '}
        </form>{' '}
      </div>{' '}
    </div>
  );
};
// -- Loan Detail Drawer --------------------------------------------------------
const LoanDetailDrawer: React.FC<{
  loan: any;
  onClose: () => void;
  onRecordRepayment: (loan: any) => void;
}> = ({ loan, onClose, onRecordRepayment }) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  useEffect(() => {
    api
      .get(`/ovds/business-loans/${loan.id}`)
      .then((r: any) => setDetail(r.data?.data ?? r.data))
      .catch(() => toast.error('Failed to load loan details'))
      .finally(() => setLoading(false));
  }, [loan.id]);
  const repayments: any[] = detail?.LoanRepayment ?? [];
  const totalRepaid = repayments.reduce(
    (s: number, r: any) => s + Number(r.amount ?? 0),
    0,
  );
  const outstanding = Number(
    detail?.outstandingBalance ?? loan.outstandingBalance ?? 0,
  );
  const progress =
    Number(detail?.appliedAmount ?? loan.appliedAmount) > 0
      ? Math.round(
          (totalRepaid / Number(detail?.appliedAmount ?? loan.appliedAmount)) *
            100,
        )
      : 0;
  return (
    <div className="fixed inset-0 z-[80] flex" onClick={onClose}>
      {' '}
      <div className="flex-1 bg-slate-900/50 backdrop-blur-sm" />{' '}
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {' '}
        {/* Header */}{' '}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900">
          {' '}
          <div>
            {' '}
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {loan.loanNumber}
            </p>{' '}
            <p className="text-xs text-slate-400">
              {loan.bankName} · {loan.loanType?.replace(/_/g, ' ')}
            </p>{' '}
          </div>{' '}
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400"
          >
            <X size={18} />{' '}
          </button>{' '}
        </div>{' '}
        <div className="flex-1 p-6 space-y-5">
          {' '}
          {/* Status + amounts */}{' '}
          <div className="grid grid-cols-2 gap-3">
            {' '}
            {[
              {
                label: 'Applied',
                value: `ETB ${fmt(Number(loan.appliedAmount))}`,
                color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
              },
              {
                label: 'Outstanding',
                value: `ETB ${fmt(outstanding)}`,
                color: outstanding > 0 ? 'text-amber-600' : 'text-[var(--pro-azure)]',
              },
              {
                label: 'Total Repaid',
                value: `ETB ${fmt(totalRepaid)}`,
                color: 'text-[var(--pro-azure)]',
              },
              {
                label: 'Credit Score',
                value: `${loan.overallCreditScore ?? 0}/100`,
                color:
                  (loan.overallCreditScore ?? 0) >= 70
                    ? 'text-[var(--pro-azure)]'
                    : 'text-amber-600',
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-white dark:bg-slate-800/50 rounded-xl p-3"
              >
                {' '}
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {label}
                </p>{' '}
                <p className={`text-lg font-semibold mt-0.5 ${color}`}>
                  {value}
                </p>{' '}
              </div>
            ))}{' '}
          </div>{' '}
          {/* Repayment progress */}{' '}
          <div>
            {' '}
            <div className="flex items-center justify-between mb-1.5">
              {' '}
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Repayment Progress
              </p>{' '}
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {progress}%
              </span>{' '}
            </div>{' '}
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              {' '}
              <div
                className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-[var(--pro-azure-50)]0' : progress >= 50 ? 'bg-[var(--pro-azure-50)]0' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />{' '}
            </div>{' '}
          </div>{' '}
          {/* Repayment history */}{' '}
          <div>
            {' '}
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History size={10} /> Repayment History ({repayments.length}){' '}
            </p>{' '}
            {loading ? (
              <div className="space-y-2">
                {' '}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
                  />
                ))}{' '}
              </div>
            ) : repayments.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                No repayments recorded yet
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {' '}
                {repayments.map((r: any, i: number) => (
                  <div
                    key={r.id ?? i}
                    className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700"
                  >
                    {' '}
                    <div className="flex items-center gap-2.5">
                      {' '}
                      <div className="w-7 h-7 bg-[var(--pro-azure-100)] dark:bg-green-950/30 rounded-lg flex items-center justify-center">
                        <Banknote
                          size={12}
                          className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"
                        />{' '}
                      </div>{' '}
                      <div>
                        {' '}
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          ETB {fmt(Number(r.amount))}
                        </p>{' '}
                        <p className="ovds-caption">
                          {r.method?.replace(/_/g, ' ')} · {r.reference || '—'}
                        </p>{' '}
                      </div>{' '}
                    </div>{' '}
                    <div className="text-right">
                      {' '}
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {' '}
                        {r.paidAt
                          ? new Date(r.paidAt).toLocaleDateString('en-ET', {
                              month: 'short',
                              day: 'numeric',
                              year: '2-digit',
                            })
                          : '—'}{' '}
                      </p>{' '}
                    </div>{' '}
                  </div>
                ))}{' '}
              </div>
            )}{' '}
          </div>{' '}
          {/* Amortization schedule toggle */}{' '}
          {detail?.amortizationSchedule?.length > 0 && (
            <div>
              {' '}
              <button
                onClick={() => setShowSchedule((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {' '}
                <span className="flex items-center gap-2">
                  <Calendar size={12} /> Amortization Schedule
                </span>{' '}
                {showSchedule ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}{' '}
              </button>{' '}
              {showSchedule && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {' '}
                  {detail.amortizationSchedule
                    .slice(0, 12)
                    .map((s: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-1.5 text-[10px] bg-white dark:bg-slate-800/30 rounded-lg"
                      >
                        {' '}
                        <span className="text-slate-500">{s.month}</span>{' '}
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          ETB {fmt(s.payment)}
                        </span>{' '}
                        <span className="text-slate-400">
                          Bal: ETB {fmt(s.balance)}
                        </span>{' '}
                      </div>
                    ))}{' '}
                </div>
              )}{' '}
            </div>
          )}{' '}
        </div>{' '}
        {/* Footer */}{' '}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          {' '}
          <button
            onClick={() => onRecordRepayment(loan)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--pro-azure)] text-white rounded-2xl font-semibold text-sm hover:bg-[var(--pro-azure-dark)] transition-all"
          >
            <TrendingDown size={15} /> Record Repayment{' '}
          </button>{' '}
        </div>{' '}
      </div>{' '}
    </div>
  );
};
// -- New Loan Application Modal ------------------------------------------------
const NewLoanModal: React.FC<{
  onClose: () => void;
  onSaved: () => void;
}> = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    bankName: '',
    loanType: 'TERM_LOAN',
    appliedAmount: '',
    interestRate: '',
    tenureMonths: '',
    applicationDate: new Date().toISOString().split('T')[0],
    purpose: '',
    collateral: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const { can } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('business_loans:write')) {
      toast.error('Insufficient permissions');
      return;
    }
    setSaving(true);
    try {
      await api.post('/ovds/business-loans', {
        bankName: form.bankName,
        loanType: form.loanType,
        appliedAmount: Number(form.appliedAmount),
        interestRate: form.interestRate ? Number(form.interestRate) : undefined,
        tenureMonths: form.tenureMonths ? Number(form.tenureMonths) : undefined,
        applicationDate: form.applicationDate,
        purpose: form.purpose || undefined,
        collateral: form.collateral || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Loan application submitted');
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="New Loan Application"
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transition-colors">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">New Loan Application</p>
            <p className="text-xs text-slate-400">Submit a new business loan application</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="ovds-grid-layout cols-2">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Bank Name *</label>
              <input
                required
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="e.g. Commercial Bank of Ethiopia"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/20 focus:border-teal-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Loan Type</label>
              <select
                value={form.loanType}
                onChange={(e) => setForm({ ...form, loanType: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
              >
                <option value="TERM_LOAN">Term Loan</option>
                <option value="WORKING_CAPITAL">Working Capital</option>
                <option value="OVERDRAFT">Overdraft</option>
                <option value="LETTER_OF_CREDIT">Letter of Credit</option>
                <option value="EQUIPMENT_ovds">Equipment ovds</option>
                <option value="MORTGAGE">Mortgage</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Applied Amount (ETB) *</label>
              <input
                required
                type="number"
                min={1}
                value={form.appliedAmount}
                onChange={(e) => setForm({ ...form, appliedAmount: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/20 focus:border-teal-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Interest Rate (%)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.interestRate}
                onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/20 focus:border-teal-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tenure (Months)</label>
              <input
                type="number"
                min={1}
                value={form.tenureMonths}
                onChange={(e) => setForm({ ...form, tenureMonths: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/20 focus:border-teal-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Application Date</label>
              <input
                type="date"
                value={form.applicationDate}
                onChange={(e) => setForm({ ...form, applicationDate: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/20 focus:border-teal-400"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Purpose</label>
              <input
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="e.g. Equipment purchase, working capital..."
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/20 focus:border-teal-400"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Collateral</label>
              <input
                value={form.collateral}
                onChange={(e) => setForm({ ...form, collateral: e.target.value })}
                placeholder="e.g. Property, vehicle, equipment..."
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/20 focus:border-teal-400"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || !form.bankName || !form.appliedAmount}
              className="flex-1 bg-[var(--pro-azure)] text-white py-3 px-6 rounded-2xl font-semibold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--pro-azure-dark)] transition-all flex items-center justify-center gap-2"
            >
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              {saving ? 'Submitting...' : 'Submit Application'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -- Main Page Component -------------------------------------------------------
const BusinessLoans: React.FC = () => {
  const { i18n: _i18n } = useTranslation();
  usePageTitle('Business Loans');
  const { can } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canDelete = can('business_loans:write');
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [detailLoan, setDetailLoan] = useState<any>(null);
  const dSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Auto-open new loan modal when navigated to /business-loans/new
  useEffect(() => {
    if (location.pathname === '/business-loans/new') {
      setShowNewLoanModal(true);
    }
  }, [location.pathname]);
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/ovds/business-loans', {
        headers: { 'x-background': '1' },
      } as any);
      const raw = res.data?.data;
      setLoans(Array.isArray(raw) ? raw : raw?.data || []);
    } catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchAll();
  }, [fetchAll]); // Auto-refresh every 60s  useInterval(fetchAll, 60_000);
  const filtered = loans.filter(
    (l) =>
      l.loanNumber.toLowerCase().includes(dSearch.toLowerCase()) ||
      l.bankName.toLowerCase().includes(dSearch.toLowerCase()),
  );
  const totalApplied = loans.reduce((s, l) => s + Number(l.appliedAmount), 0);
  const avgScore = loans.length
    ? Math.round(
        loans.reduce((s, l) => s + (l.overallCreditScore || 0), 0) /
          loans.length,
      )
    : 0;
  const handleRecordRepayment = (loan: any) => {
    setSelectedLoan(loan);
    setShowRepaymentModal(true);
  };
  return (
    <AppPage
      title="Business Loans & Financing"
      subtitle="Manage loans, track repayments, monitor credit health"
      icon={<Landmark size={18} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      crumbs={[{ label: 'ovds' }, { label: 'Business Loans' }]}
      actions={can('business_loans:write') ? (
        <button onClick={() => setShowNewLoanModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={15} /> New Loan Application
        </button>
      ) : undefined}
    >
    <div className="space-y-5 pb-12">
      {/* -- Pipeline Stage Header -- */}
      <PipelineStageHeader
        stages={[
          { key: 'ACTIVE',   label: 'Active',   count: loans.filter((l:any)=>l.status==='ACTIVE'||l.status==='DISBURSED').length,   color: '#00E784', active: true },
          { key: 'REPAID',   label: 'Repaid',   count: loans.filter((l:any)=>l.status==='REPAID'||l.status==='CLOSED').length,   color: '#00E784', completed: true },
          { key: 'DEFAULTED',label: 'Defaulted',count: loans.filter((l:any)=>l.status==='DEFAULTED'||l.status==='OVERDUE').length,color: '#ef4444' },
        ]}
      />
      {/* Stats */}{' '}
      <div className="ovds-grid-layout cols-4 gap-sm">
          {[
            { label: 'Total Applied',   value: `ETB ${fmt(totalApplied)}`,  color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',          bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30',    sub: `${loans.length} applications` },
            { label: 'Avg Credit Score',value: `${avgScore}/100`,           color: avgScore >= 70 ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : avgScore >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400', bg: 'bg-white dark:bg-slate-800', sub: 'Bank eligibility' },
            { label: 'Active Loans',    value: loans.filter(l => l.status === 'ACTIVE').length, color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30', sub: 'Currently active' },
            { label: 'Outstanding',     value: `ETB ${fmt(loans.reduce((s, l) => s + Number(l.outstandingBalance || 0), 0))}`, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', sub: 'Balance remaining' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
              <div className={`flex items-center gap-1.5 ${s.color} mb-1.5`}>
                <span className="text-[10px] font-semibold uppercase tracking-wider">{s.label}</span>
              </div>
              <p className={`text-xl font-bold tabular-nums ${s.color}`}>{loading ? '—' : s.value}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>{' '}
      {!loading && (
        <ContextualInsight
          variant={
            avgScore >= 70
              ? 'positive'
              : avgScore >= 50
                ? 'info'
                : loans.length > 0
                  ? 'warning'
                  : 'neutral'
          }
          text={
            loans.length === 0
              ? 'No loan applications yet. Strong partnerships and documented customer relationships improve your chances of approval.'
              : avgScore >= 70
                ? `Average credit score is ${avgScore}/100 — good standing with lenders. Keep financial records clean to maintain this.`
                : avgScore >= 50
                  ? `Average credit score is ${avgScore}/100. Improving documentation and reducing outstanding bills can raise your score.`
                  : `Average credit score is ${avgScore}/100 — below the 70 threshold most Ethiopian banks require. Review compliance and financial records.`
          }
        />
      )}{' '}
      {/* Controls */}{' '}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5">
        {' '}
        <div className="relative flex-1">
          {' '}
          <input
            placeholder="Search by loan number or bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-400/20 focus:border-teal-400 bg-white text-sm font-bold"
          />
          <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />{' '}
        </div>{' '}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold focus:ring-4 focus:ring-teal-400/20 focus:border-teal-400 min-w-[140px]"
        >
          {' '}
          <option value="ALL">All Statuses</option>{' '}
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}{' '}
        </select>{' '}
        <button
          onClick={fetchAll}
          className="px-6 py-3 bg-[var(--pro-azure)] text-white rounded-2xl font-semibold uppercase tracking-wider hover:bg-[var(--pro-azure-dark)] transition-all whitespace-nowrap"
        >
          <RefreshCw className="inline w-4 h-4 mr-1 animate-spin" />{' '}
          Refresh{' '}
        </button>{' '}
      </div>{' '}
      {/* Loans Table */}{' '}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 transition-colors">
        {' '}
        <div className="p-5">
          {' '}
          {loading ? (
            <Skeleton.Table rows={5} cols={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Landmark size={36} strokeWidth={1.5} />}
              message="No business loans found"
              description="Create your first loan application to get started."
            />
          ) : (
            <div className="space-y-3">
              {' '}
              {filtered.map((loan, _i) => (
                <div
                  key={loan.id}
                  className="group bg-white dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 transition-all hover:shadow-md hover:-translate-y-1 flex items-start gap-4"
                >
                  {' '}
                  <div className="w-2 h-2 mt-2 bg-gradient-to-b from-[var(--pro-azure)] to-indigo-600 rounded-full shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />{' '}
                  <div className="flex-1 min-w-0">
                    {' '}
                    <div className="flex items-start justify-between mb-2">
                      {' '}
                      <div className="flex items-center gap-3">
                        {' '}
                        <div className="font-semibold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          {' '}
                          {loan.loanNumber}{' '}
                        </div>{' '}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[loan.status.replace(/_/g, ' ').toUpperCase()]}`}
                        >
                          {' '}
                          {loan.status.replace(/_/g, ' ').toUpperCase()}{' '}
                        </span>{' '}
                      </div>{' '}
                      <div className="flex items-center gap-2">
                        {' '}
                        {canDelete && (
                          <>
                            {' '}
                            <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                              <Edit2 size={16} />{' '}
                            </button>{' '}
                            <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                              <Trash2 size={16} />{' '}
                            </button>{' '}
                          </>
                        )}{' '}
                        <button
                          onClick={() => handleRecordRepayment(loan)}
                          className="px-4 py-1.5 bg-[var(--pro-azure)] text-white text-xs font-semibold rounded-xl hover:bg-[var(--pro-azure-dark)] transition-all whitespace-nowrap"
                        >
                          {' '}
                          Record Payment{' '}
                        </button>{' '}
                        <button
                          onClick={() => setDetailLoan(loan)}
                          className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all whitespace-nowrap"
                        >
                          {' '}
                          History{' '}
                        </button>{' '}
                      </div>{' '}
                    </div>{' '}
                    <div className="ovds-grid-layout cols-4 mb-4 text-sm">
                      {' '}
                      <div>
                        {' '}
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block mb-1">
                          Bank
                        </span>{' '}
                        <span className="font-semibold">{loan.bankName}</span>{' '}
                      </div>{' '}
                      <div>
                        {' '}
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block mb-1">
                          Type
                        </span>{' '}
                        <span className="font-semibold text-slate-800 capitalize">
                          {loan.loanType.replace(/_/g, ' ')}
                        </span>{' '}
                      </div>{' '}
                      <div>
                        {' '}
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block mb-1">
                          Applied
                        </span>{' '}
                        <div className="text-lg font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                          ETB {fmt(Number(loan.appliedAmount))}
                        </div>{' '}
                      </div>{' '}
                      <div>
                        {' '}
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block mb-1">
                          Outstanding
                        </span>{' '}
                        <div className="text-lg font-semibold text-[var(--pro-azure)]">
                          ETB {fmt(Number(loan.outstandingBalance))}
                        </div>{' '}
                      </div>{' '}
                    </div>{' '}
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                      <ScoreBar
                        label="Credit Score"
                        value={loan.overallCreditScore || 0}
                        color="bg-green-500"
                      />{' '}
                      <button className="text-xs font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline flex items-center gap-1">
                        {' '}
                        View Details <ArrowRight size={12} />{' '}
                      </button>{' '}
                    </div>{' '}
                  </div>{' '}
                </div>
              ))}{' '}
            </div>
          )}{' '}
        </div>{' '}
      </div>{' '}
      {showNewLoanModal && (
        <NewLoanModal
          onClose={() => {
            setShowNewLoanModal(false);
            if (location.pathname === '/business-loans/new') {
              navigate('/ovds/loans', { replace: true });
            }
          }}
          onSaved={() => {
            setShowNewLoanModal(false);
            if (location.pathname === '/business-loans/new') {
              navigate('/ovds/loans', { replace: true });
            }
            fetchAll();
          }}
        />
      )}{' '}
      {showRepaymentModal && selectedLoan && (
        <RepaymentModal
          loan={selectedLoan}
          onClose={() => setShowRepaymentModal(false)}
          onSaved={() => {
            setShowRepaymentModal(false);
            fetchAll();
          }}
        />
      )}{' '}
      {detailLoan && (
        <LoanDetailDrawer
          loan={detailLoan}
          onClose={() => setDetailLoan(null)}
          onRecordRepayment={(loan) => {
            setDetailLoan(null);
            setSelectedLoan(loan);
            setShowRepaymentModal(true);
          }}
        />
      )}{' '}
    </div>
    </AppPage>
  );
};
export default BusinessLoans;
















