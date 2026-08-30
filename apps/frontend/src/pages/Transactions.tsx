/**
 * Transactions — ovds-style unified transaction ledger
 * White background · Emerald text · White-blue icons
 * Shows all bank transactions with reconciliation status
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownRight, RefreshCw, Download,
  CheckCircle2, Clock, AlertCircle, Landmark,
  ArrowLeftRight, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtETB } from '../utils/ethiopianTax';
import {
  AppPage, AppTabs, AppKpi,
  StatusBadge, Btn, Toolbar, IconBox, Amount, DataTable, DataTableColumn,
} from '@ovds/ui';
import { Modal, FormField, Input, Textarea } from '../components/ui';

type TxType = 'ALL' | 'CREDIT' | 'DEBIT';
type TxStatus = 'ALL' | 'PENDING' | 'RECONCILED' | 'UNRECONCILED';

const Transactions: React.FC = () => {
  usePageTitle('Transactions');
  const { selectedCompanyId } = useBusiness();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch]     = useState('');
  const [txType, setTxType]     = useState<TxType>('ALL');
  const [status, setStatus]     = useState<TxStatus>('ALL');
  const [page, setPage]         = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  // New Income / Expense modal
  type TxModalType = 'income' | 'expense' | null;
  const [txModal, setTxModal] = useState<TxModalType>(null);
  const [txForm, setTxForm] = useState<{ description: string; amount: string; date: string; reference: string; notes: string }>({
    description: '', amount: '', date: new Date().toISOString().split('T')[0], reference: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Auto-open modal from URL param (?action=income | ?action=expense)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'income' || action === 'expense') {
      setTxModal(action);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSaveTx = async () => {
    if (!txForm.description || !txForm.amount) { toast.error('Description and amount are required'); return; }
    setSaving(true);
    try {
      await api.post('/ovds/bank-transactions', {
        description: txForm.description,
        amount: txModal === 'income' ? Math.abs(parseFloat(txForm.amount)) : -Math.abs(parseFloat(txForm.amount)),
        type: txModal === 'income' ? 'CREDIT' : 'DEBIT',
        date: txForm.date,
        reference: txForm.reference || undefined,
        notes: txForm.notes || undefined,
        companyId: selectedCompanyId,
      });
      toast.success(txModal === 'income' ? 'Income recorded' : 'Expense recorded');
      setTxModal(null);
      setTxForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    } catch {
      toast.error('Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['transactions', selectedCompanyId, page, txType, status, search, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (selectedCompanyId) params.set('companyId', selectedCompanyId);
      if (txType !== 'ALL') params.set('type', txType);
      if (status !== 'ALL') params.set('status', status);
      if (search) params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return api.get(`/ovds/bank-transactions?${params}`).then((r: any) => r.data?.data ?? r.data).catch(() => null);
    },
    staleTime: 30_000,
  });

  const rows: any[]   = Array.isArray(raw) ? raw : (raw?.data ?? raw?.transactions ?? []);
  const total: number = raw?.pagination?.total ?? raw?.total ?? rows.length;

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r: any) =>
      [r.description, r.reference, r.counterparty, r.bankName].some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [rows, search]);

  const reconcileMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/ovds/bank-transactions/${id}/reconcile`, {}),
    onSuccess: () => { toast.success('Marked as reconciled'); qc.invalidateQueries({ queryKey: ['transactions'] }); },
    onError: () => toast.error('Failed to reconcile'),
  });

  // -- KPI -------------------------------------------------------------------
  const kpiItems = useMemo(() => {
    const credits = rows.filter((r: any) => r.type === 'CREDIT' || parseFloat(r.amount) > 0);
    const debits  = rows.filter((r: any) => r.type === 'DEBIT'  || parseFloat(r.amount) < 0);
    const totalIn  = credits.reduce((s: number, r: any) => s + Math.abs(parseFloat(r.amount ?? 0)), 0);
    const totalOut = debits.reduce((s: number, r: any) => s + Math.abs(parseFloat(r.amount ?? 0)), 0);
    const pending  = rows.filter((r: any) => r.status === 'PENDING').length;
    const recon    = rows.filter((r: any) => r.status === 'RECONCILED').length;
    return [
      { label: 'Total In',    value: fmtETB(totalIn),  icon: <ArrowUpRight size={13} />,   iconCls: 'bg-emerald-50 text-emerald-600', color: 'emerald' as const },
      { label: 'Total Out',   value: fmtETB(totalOut), icon: <ArrowDownRight size={13} />, iconCls: 'bg-rose-50 text-rose-600',       color: 'rose' as const },
      { label: 'Net',         value: fmtETB(totalIn - totalOut), icon: <ArrowLeftRight size={13} />, iconCls: 'bg-sky-50 text-sky-600', color: 'sky' as const },
      { label: 'Pending',     value: pending,           icon: <Clock size={13} />,          iconCls: 'bg-amber-50 text-amber-600',     color: 'amber' as const },
      { label: 'Reconciled',  value: recon,             icon: <CheckCircle2 size={13} />,   iconCls: 'bg-emerald-50 text-emerald-600', color: 'emerald' as const },
    ];
  }, [rows]);

  const cols: DataTableColumn<any>[] = [
    {
      key: 'date', label: 'Date', sortable: true, required: true,
      sortValue: (r: any) => (r.date ? new Date(r.date).getTime() : 0),
      render: (r: any) => (
        <span className="text-[11px] text-slate-500 font-mono tabular-nums tracking-tight">
          {r.date ? new Date(r.date).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: 'description', label: 'Description', sortable: true,
      render: (r: any) => (
        <div>
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">{r.description}</p>
          {r.counterparty && <p className="text-[10px] text-slate-400 truncate mt-0.5">{r.counterparty}</p>}
        </div>
      ),
    },
    {
      key: 'reference', label: 'Reference', sortable: true,
      render: (r: any) => <span className="font-mono text-[11px] text-slate-500">{r.reference ?? '—'}</span>,
    },
    {
      key: 'bankName', label: 'Bank', sortable: true,
      render: (r: any) => (
        <div className="flex items-center gap-1.5">
          <IconBox icon={<Landmark size={10} />} color="sky" />
          <span className="text-[11px] text-slate-600 dark:text-slate-400">{r.bankName ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'amount', label: 'Amount', align: 'right' as const, sortable: true,
      sortValue: (r: any) => parseFloat(r.amount ?? 0),
      render: (r: any) => {
        const amt = parseFloat(r.amount ?? 0);
        const isCredit = r.type === 'CREDIT' || amt > 0;
        return (
          <div className="flex items-center justify-end gap-1 font-mono tabular-nums">
            {isCredit
              ? <ArrowUpRight size={11} className="text-emerald-500" />
              : <ArrowDownRight size={11} className="text-rose-500" />}
            <Amount value={Math.abs(amt)} positive={isCredit} negative={!isCredit} />
          </div>
        );
      },
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (r: any) => <StatusBadge status={r.status ?? 'PENDING'} />,
    },
  ];

  const rowActions = (r: any) => (
    r.status !== 'RECONCILED' ? (
      <button
        onClick={() => reconcileMutation.mutate(r.id)}
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 transition-all"
        title="Mark reconciled"
      >
        <CheckCircle2 size={10} /> Reconcile
      </button>
    ) : null
  );

  const handleExport = () => {
    if (!rows.length) return;
    const headers = 'Date,Description,Reference,Bank,Amount,Type,Status\n';
    const csvRows = rows.map((r: any) =>
      `"${r.date ?? ''}","${r.description ?? ''}","${r.reference ?? ''}","${r.bankName ?? ''}",${r.amount ?? 0},${r.type ?? ''},${r.status ?? ''}`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="Transactions"
      subtitle="Bank transaction ledger with reconciliation · Banking & ovds · Retail & E-commerce · Revenue tracking · Market Share"
      icon={<ArrowLeftRight size={18} />}
      crumbs={[{ label: 'Transactions' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',    label: 'All',      count: rows.length },
            { key: 'CREDIT', label: 'Credits',  count: rows.filter((r: any) => r.type === 'CREDIT').length },
            { key: 'DEBIT',  label: 'Debits',   count: rows.filter((r: any) => r.type === 'DEBIT').length },
          ]}
          active={txType}
          onChange={k => { setTxType(k as TxType); setPage(1); }}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          <Btn variant="ghost" className="w-max-w-md" icon={<RefreshCw size={11} />} onClick={() => refetch()}>Refresh</Btn>
          <Btn variant="secondary" className="w-max-w-md" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          <Btn
            variant="ghost"
            icon={<Plus size={11} />}
            onClick={() => { setTxForm(f => ({ ...f })); setTxModal('expense'); }}
            className="text-rose-600 border-rose-100 hover:bg-rose-50"
          >
            New Expense
          </Btn>
          <Btn
            variant="primary" className="w-max-w-md"
            icon={<Plus size={11} />}
            onClick={() => { setTxForm(f => ({ ...f })); setTxModal('income'); }}
          >
            New Income
          </Btn>
        </div>
      }
    >
      <AppKpi cells={kpiItems.map(k => ({ label: k.label, value: k.value, color: k.color, icon: k.icon }))} />

      {/* Filters */}
      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Search transactions…' }}
        count={filtered.length}
        countLabel="transactions"
        filters={
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={e => { setStatus(e.target.value as TxStatus); setPage(1); }}
              className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="RECONCILED">Reconciled</option>
              <option value="UNRECONCILED">Unreconciled</option>
            </select>
            <input
              type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400"
            />
            <span className="text-[10px] text-slate-400 font-medium">to</span>
            <input
              type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400"
            />
          </div>
        }
      />

      <DataTable
        storageKey="transactions"
        data={filtered}
        columns={cols}
        loading={isLoading}
        rowKey={(r: any) => r.id}
        page={page}
        pageSize={25}
        total={total}
        onPageChange={setPage}
        actionHeader="Actions"
        renderActions={(r: any) => rowActions(r)}
      />

      {/* ── New Income / New Expense modal ── */}
      <Modal
        open={!!txModal}
        onClose={() => setTxModal(null)}
        title={txModal === 'income' ? 'New Income' : 'New Expense'}
       
      >
        {!!txModal && (
          <div className="space-y-3">
            {/* colour band */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold ${
              txModal === 'income'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}>
              {txModal === 'income'
                ? <ArrowDownRight size={13} />
                : <ArrowUpRight size={13} />}
              {txModal === 'income'
                ? 'Enter the details and create your first income record'
                : 'Enter the details and create your first expense record'}
            </div>

            <FormField label="Description" required>
              <Input
                value={txForm.description}
                onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))}
                placeholder={txModal === 'income' ? 'e.g. Customer payment' : 'e.g. Office supplies'}
                autoFocus
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Amount" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={txForm.amount}
                  onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </FormField>
              <FormField label="Date">
                <Input
                  type="date"
                  value={txForm.date}
                  onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))}
                />
              </FormField>
            </div>

            <FormField label="Reference / Invoice #">
              <Input
                value={txForm.reference}
                onChange={e => setTxForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="e.g. INV-2026-001"
              />
            </FormField>

            <FormField label="Notes">
              <Textarea
                value={txForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTxForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Optional notes"
              />
            </FormField>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Btn variant="ghost" onClick={() => setTxModal(null)}>Cancel</Btn>
          <Btn
            variant="primary"
            onClick={handleSaveTx}
            disabled={saving || !txForm.description || !txForm.amount}
          >
            {saving ? 'Saving…' : txModal === 'income' ? 'Save Income' : 'Save Expense'}
          </Btn>
        </div>
      </Modal>
    </AppPage>
  );
};

export default Transactions;

