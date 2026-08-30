import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionsApi } from '../services/collectionsApi';
import { StatsCard, Skeleton } from '@ovds/ui';
import {
  RefreshCw, AlertTriangle, Clock, Users, TrendingDown,
  CheckSquare, Square, Calendar, ChevronDown, X, Loader2,
  CheckCircle2, ArrowUpRight, ShieldAlert, MoreHorizontal, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CollectionsTableProps {
  onCaseSelect?: (caseId: string) => void;
  initialFilters?: { stage?: string; assignedTo?: string };
}

const STAGE_COLORS: Record<string, string> = {
  CLOSED:          'bg-emerald-200/10 text-slate-800 border-emerald-200/20',
  ASSIGNED:        'bg-amber-50 text-amber-600 border-amber-200',
  PROMISE_TO_PAY:  'bg-sky-50 text-sky-600 border-sky-200',
  LEGAL:           'bg-rose-50 text-rose-600 border-rose-200',
  PARTIAL_PAYMENT: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200/20',
  NEW:             'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/20',
  CONTACTED:       'bg-emerald-200/10 text-slate-800 border-emerald-200/20',
  WRITTEN_OFF:     'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200/20',
};

const STAGES = ['NEW','ASSIGNED','CONTACTED','PROMISE_TO_PAY','PARTIAL_PAYMENT','LEGAL','WRITTEN_OFF','CLOSED'] as const;

// -- Promise-to-Pay mini modal -------------------------------------------------
const PromiseModal: React.FC<{ caseId: string; onClose: () => void }> = ({ caseId, onClose }) => {
  const qc = useQueryClient();
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const mut = useMutation({
    mutationFn: () => collectionsApi.setPromiseToPay(caseId, date, amount ? Number(amount) : undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collections-cases'] }); toast.success('Promise to pay recorded'); onClose(); },
    onError: () => toast.error('Failed to record promise'),
  });
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Calendar size={15} className="text-amber-600" /> Promise to Pay</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={14} className="text-slate-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Promise Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/20" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Amount (ETB) — optional</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Full balance if blank"
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/20" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => mut.mutate()} disabled={!date || mut.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-500-dark disabled:opacity-50">
            {mut.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Save
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// -- Escalate mini modal -------------------------------------------------------
const EscalateModal: React.FC<{ caseId: string; onClose: () => void }> = ({ caseId, onClose }) => {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const mut = useMutation({
    mutationFn: () => collectionsApi.escalateCase(caseId, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collections-cases'] }); toast.success('Case escalated'); onClose(); },
    onError: () => toast.error('Escalation failed'),
  });
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"><ArrowUpRight size={15} className="text-rose-600" /> Escalate Case</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={14} className="text-slate-400" /></button>
        </div>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for escalation…"
          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500/20 resize-none" />
        <div className="flex gap-3">
          <button onClick={() => mut.mutate()} disabled={!reason.trim() || mut.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-500-dark disabled:opacity-50">
            {mut.isPending ? <Loader2 size={13} className="animate-spin" /> : <ShieldAlert size={13} />} Escalate
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
        </div>
      </div>
    </div>
  );
};

const CollectionsRowMenu: React.FC<{
  caseRow: any;
  onCaseSelect?: (caseId: string) => void;
  onPromise: () => void;
  onEscalate: () => void;
  onClose: () => void;
}> = ({ caseRow, onCaseSelect, onPromise, onEscalate, onClose }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        title="Actions"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 overflow-hidden">
            <button type="button" onClick={() => { setOpen(false); onCaseSelect?.(caseRow.id); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <Eye size={13} className="text-teal-500" /> View
            </button>
            <button type="button" onClick={() => { setOpen(false); onPromise(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <Calendar size={13} className="text-amber-600" /> Promise
            </button>
            <button type="button" onClick={() => { setOpen(false); onEscalate(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <ArrowUpRight size={13} className="text-rose-600" /> Escalate
            </button>
            {caseRow.stage !== 'CLOSED' && (
              <button type="button" onClick={() => { setOpen(false); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <CheckCircle2 size={13} className="text-emerald-600" /> Close
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const CollectionsTable: React.FC<CollectionsTableProps> = ({
  onCaseSelect,
  initialFilters = {},
}) => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [stageFilter, setStageFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [promiseCaseId, setPromiseCaseId] = useState<string | null>(null);
  const [escalateCaseId, setEscalateCaseId] = useState<string | null>(null);
  const [bulkAssignTo, setBulkAssignTo] = useState('');
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  const { data: dashData } = useQuery({
    queryKey: ['collections-dashboard'],
    queryFn: () => collectionsApi.dashboard().then((r: any) => r.data?.data ?? r.data),
  });

  const { data: casesData, refetch, isLoading } = useQuery({
    queryKey: ['collections-cases', initialFilters, stageFilter, page],
    queryFn: () => collectionsApi.getCases({
      page, limit: 20,
      stage: stageFilter || undefined,
      ...initialFilters,
    }).then((r: any) => r.data?.data ?? r.data),
  });

  const cases: any[] = Array.isArray(casesData) ? casesData : (casesData?.data ?? []);
  const pagination = Array.isArray(casesData) ? null : casesData?.pagination;

  const closeMut = useMutation({
    mutationFn: (id: string) => collectionsApi.closeCase(id, 'Resolved via collections'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collections-cases'] }); toast.success('Case closed'); },
    onError: () => toast.error('Failed to close case'),
  });

  const bulkStageMut = useMutation({
    mutationFn: (stage: string) => collectionsApi.bulkUpdateStage([...selected], stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections-cases'] });
      setSelected(new Set());
      setShowBulkMenu(false);
      toast.success(`${selected.size} cases updated`);
    },
    onError: () => toast.error('Bulk update failed'),
  });

  const bulkAssignMut = useMutation({
    mutationFn: () => collectionsApi.bulkAssign([...selected], bulkAssignTo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections-cases'] });
      setSelected(new Set());
      setBulkAssignTo('');
      toast.success(`${selected.size} cases assigned`);
    },
    onError: () => toast.error('Bulk assign failed'),
  });

  const toggleAll = () => {
    if (selected.size === cases.length) setSelected(new Set());
    else setSelected(new Set(cases.map((c: any) => c.id)));
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="ovds-grid-layout cols-4">
        <StatsCard label="Open Cases"       value={dashData?.openCases ?? 0}       icon={<AlertTriangle size={20} />} color="amber" />
        <StatsCard label="Overdue Promises" value={dashData?.overduePromises ?? 0} icon={<Clock size={20} />}         color="red" />
        <StatsCard label="DSO Days"         value={dashData?.dsoDays ?? 0}         icon={<TrendingDown size={20} />}  color="blue" />
        <StatsCard label="Total Cases"      value={cases.length}                   icon={<Users size={20} />}         color="slate" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Stage filter pills */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button onClick={() => setStageFilter('')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${!stageFilter ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            ALL
          </button>
          {STAGES.map(s => (
            <button key={s} onClick={() => setStageFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${stageFilter === s ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <button onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:text-slate-200">
          <RefreshCw size={14} /> Refresh
        </button>
        <button
          onClick={() => {
            const header = 'Invoice No,Customer,Stage,Balance Due (ETB),Taxable (ETB),VAT 15% (ETB),WHT 3% (ETB),Aging (days),Promise Date,Assigned To,ERCA Directive\n';
            const rows = cases.map((c: any) => {
              const inv = c.invoice ?? c.Invoice ?? {};
              const balance = Number(inv.balanceDue ?? inv.totalAmount ?? 0);
              const vatRate = 0.15;
              const taxable = balance / (1 + vatRate);
              const vat = balance - taxable;
              const wht = taxable * 0.03;
              return `"${inv.invoiceNumber ?? ''}","${inv.customerName ?? inv.customer ?? ''}","${c.stage ?? ''}",${balance.toFixed(2)},${taxable.toFixed(2)},${vat.toFixed(2)},${wht.toFixed(2)},${inv.agingDays ?? 0},"${c.promiseDate ? new Date(c.promiseDate).toLocaleDateString('en-ET') : ''}","${c.assignedTo ?? ''}","ERCA VAT Proclamation No. 1341/2024"`;
            }).join('\n');
            const csv = header + rows;
            const a = Object.assign(document.createElement('a'), {
              href: URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })),
              download: `ERCA_collections_${new Date().toISOString().slice(0, 10)}.csv`,
              style: 'display:none',
            });
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(a.href), 100);
          }}
          className="flex items-center gap-2 px-4 py-2 border border-rose-200 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors"
          title="Export ERCA-compliant collections report"
        >
          <ShieldAlert size={14} /> ERCA Export
        </button>

        {/* Bulk actions — only visible when rows selected */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{selected.size} selected</span>
            <div className="relative">
              <button onClick={() => setShowBulkMenu(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600">
                Bulk Action <ChevronDown size={12} />
              </button>
              {showBulkMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                  {STAGES.map(s => (
                    <button key={s} onClick={() => bulkStageMut.mutate(s)}
                      disabled={bulkStageMut.isPending}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      Set → {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2 flex gap-2">
                    <input value={bulkAssignTo} onChange={e => setBulkAssignTo(e.target.value)}
                      placeholder="Assign to…"
                      className="flex-1 text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-teal-400/20" />
                    <button onClick={() => bulkAssignMut.mutate()} disabled={!bulkAssignTo.trim() || bulkAssignMut.isPending}
                      className="px-2 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                      {bulkAssignMut.isPending ? <Loader2 size={11} className="animate-spin" /> : 'Go'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setSelected(new Set())} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="ovds-widget-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-dense">
            <thead className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5 w-8">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {selected.size === cases.length && cases.length > 0
                      ? <CheckSquare size={14} className="text-emerald-600 dark:text-emerald-400" />
                      : <Square size={14} />}
                  </button>
                </th>
                {['Invoice','Customer','Stage','Balance Due','Aging','Promise Date','Assigned To','Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {isLoading ? (
                <Skeleton.TableRows cols={9} />
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <AlertTriangle size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="font-bold">No collection cases found</p>
                  </td>
                </tr>
              ) : cases.map((c: any) => {
                const inv = c.invoice ?? c.Invoice ?? {};
                const agingDays = inv.agingDays ?? 0;
                const isSelected = selected.has(c.id);
                const isOverduePromise = c.promiseDate && new Date(c.promiseDate) < new Date() && c.stage === 'PROMISE_TO_PAY';
                return (
                  <tr key={c.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${isSelected ? 'bg-blue-50/40 dark:bg-blue-950/10' : ''}`}>
                    <td className="px-4 py-2.5">
                      <button onClick={() => setSelected(s => { const n = new Set(s); if (n.has(c.id)) { n.delete(c.id); } else { n.add(c.id); } return n; })}
                        className="text-slate-400 hover:text-emerald-600 dark:text-emerald-400">
                        {isSelected ? <CheckSquare size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Square size={14} />}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">
                      {inv.invoiceNumber ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{inv.customerName ?? inv.customer ?? '—'}</div>
                      {inv.customerPhone && <div className="ovds-caption">{inv.customerPhone}</div>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase ${STAGE_COLORS[c.stage] ?? 'bg-slate-100 text-slate-500'}`}>
                        {c.stage?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-xs">
                      ETB {Number(inv.balanceDue ?? inv.totalAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-semibold text-xs px-2 py-0.5 rounded-lg ${agingDays > 90 ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' : agingDays > 60 ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400' : agingDays > 30 ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400' : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'}`}>
                        {agingDays}d
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {c.promiseDate ? (
                        <span className={`font-bold ${isOverduePromise ? 'text-rose-600 dark:text-rose-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                          {isOverduePromise && '⚠ '}{new Date(c.promiseDate).toLocaleDateString()}
                          {c.promiseAmount ? ` · ETB ${Number(c.promiseAmount).toLocaleString()}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">
                      {c.assignedTo ?? 'Unassigned'}
                    </td>
                    <td className="row-action-cell px-4 py-2.5">
                      <CollectionsRowMenu
                        caseRow={c}
                        onCaseSelect={onCaseSelect}
                        onPromise={() => setPromiseCaseId(c.id)}
                        onEscalate={() => setEscalateCaseId(c.id)}
                        onClose={() => closeMut.mutate(c.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-bold">
              {pagination.total} cases · Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300">
                Prev
              </button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {promiseCaseId && <PromiseModal caseId={promiseCaseId} onClose={() => setPromiseCaseId(null)} />}
      {escalateCaseId && <EscalateModal caseId={escalateCaseId} onClose={() => setEscalateCaseId(null)} />}
    </div>
  );
};








