/**
 * Intercompany Eliminations — IFRS 10 / IAS 27
 * Detect, create and post intragroup elimination entries for consolidation.
 * Eliminates: Receivables/Payables, Revenue/Expenses, Dividends, Investments.
 */
import { AppPage, AppKpi } from '@ovds/ui';
import { GitMerge, RefreshCw, Zap, Play, RotateCcw, Plus } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../context/businessContext';
import api from '../services/api';

type EliminationType = 'RECEIVABLE' | 'PAYABLE' | 'REVENUE' | 'EXPENSE' | 'DIVIDEND' | 'INVESTMENT';
type EliminationStatus = 'PENDING' | 'POSTED' | 'REVERSED';

interface Elimination {
  id: string;
  fromCompanyId: string;
  toCompanyId: string;
  intercompanyTxId?: string;
  period: string;
  eliminationType: EliminationType;
  amount: number;
  status: EliminationStatus;
  journalEntryId?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

interface Suggestion {
  intercompanyTxId: string;
  fromCompanyId: string;
  fromCompanyName: string;
  toCompanyId: string;
  toCompanyName: string;
  amount: number;
  type: string;
  period: string;
  suggestedEliminationType: EliminationType;
}

const TYPE_COLOR: Record<EliminationType, string> = {
  RECEIVABLE:  'bg-sky-100 text-sky-700',
  PAYABLE:     'bg-amber-100 text-amber-700',
  REVENUE:     'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  EXPENSE:     'bg-rose-100 text-rose-700',
  DIVIDEND:    'bg-violet-100 text-violet-700',
  INVESTMENT:  'bg-slate-100 text-slate-600',
};

const STATUS_COLOR: Record<EliminationStatus, string> = {
  PENDING:  'bg-amber-100 text-amber-700',
  POSTED:   'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  REVERSED: 'bg-slate-100 text-slate-500',
};

const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2 });

type Tab = 'eliminations' | 'detect' | 'summary';

const IntercompanyEliminations: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const cid = selectedCompanyId ?? undefined;

  const [tab, setTab]               = useState<Tab>('eliminations');
  const [period, setPeriod]         = useState(new Date().toISOString().slice(0, 7));
  const [items, setItems]           = useState<Elimination[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [summary, setSummary]       = useState<any>(null);
  const [loading, setLoading]       = useState(false);
  const [detectLoading, setDetectLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [actionId, setActionId]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/ovds/intercompany-eliminations', { params: { companyId: cid, period } });
      setItems(Array.isArray(res.data?.data) ? res.data.data : (res.data ?? []));
    } catch { toast.error('Failed to load eliminations'); }
    finally { setLoading(false); }
  }, [cid, period]);

  const detect = useCallback(async () => {
    setDetectLoading(true);
    try {
      const res = await api.get('/ovds/intercompany-eliminations/detect', { params: { period } });
      setSuggestions(Array.isArray(res.data?.data) ? res.data.data : (res.data ?? []));
    } catch { toast.error('Detection failed'); }
    finally { setDetectLoading(false); }
  }, [period]);

  const loadSummary = useCallback(async () => {
    if (!cid) return;
    setSummaryLoading(true);
    try {
      const res = await api.get('/ovds/intercompany-eliminations/consolidated-summary', {
        params: { companyIds: cid, period },
      });
      setSummary(res.data?.data ?? res.data);
    } catch { toast.error('Failed to load summary'); }
    finally { setSummaryLoading(false); }
  }, [cid, period]);

  useEffect(() => { load(); }, [load]);

  const createFromSuggestion = async (s: Suggestion) => {
    try {
      await api.post('/ovds/intercompany-eliminations', {
        fromCompanyId:    s.fromCompanyId,
        toCompanyId:      s.toCompanyId,
        intercompanyTxId: s.intercompanyTxId,
        period:           s.period,
        eliminationType:  s.suggestedEliminationType,
        amount:           s.amount,
      });
      toast.success('Elimination entry created');
      load();
      setTab('eliminations');
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); }
  };

  const postElimination = async (id: string) => {
    setActionId(id);
    try {
      await api.patch(`/ovds/intercompany-eliminations/${id}/post`);
      toast.success('Elimination posted to journal');
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Post failed'); }
    finally { setActionId(null); }
  };

  const reverseElimination = async (id: string) => {
    if (!confirm('Reverse this elimination?')) return;
    setActionId(id);
    try {
      await api.patch(`/ovds/intercompany-eliminations/${id}/reverse`);
      toast.success('Elimination reversed');
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Reversal failed'); }
    finally { setActionId(null); }
  };

  const kpiCells = [
    { label: 'Total Entries', value: items.length.toString(),                                          accentCls: 'bg-violet-500' },
    { label: 'Pending',       value: items.filter(i => i.status === 'PENDING').length.toString(),     accentCls: 'bg-amber-500' },
    { label: 'Posted',        value: items.filter(i => i.status === 'POSTED').length.toString(),      accentCls: 'bg-[var(--pro-azure-50)]0' },
    { label: 'Total Amount',  value: `ETB ${(items.reduce((s, i) => s + Number(i.amount), 0) / 1000).toFixed(0)}K`, accentCls: 'bg-sky-500' },
  ];

  const TABS: { key: Tab; label: string }[] = [
    { key: 'eliminations', label: 'Elimination Entries' },
    { key: 'detect',       label: 'Auto-Detect' },
    { key: 'summary',      label: 'Consolidated Summary' },
  ];

  return (
    <AppPage
      title="Intercompany Eliminations"
      subtitle="IFRS 10.B86 — intragroup balance elimination for consolidated statements"
      icon={<GitMerge size={16} />}
      iconBg="bg-violet-500"
      crumbs={[{ label: 'IFRS', to: '/ifrs' }, { label: 'Intercompany Eliminations' }]}
      actions={
        <div className="flex items-center gap-2">
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" />
          <button onClick={load} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin text-[var(--pro-azure)]' : 'text-slate-500'} />
          </button>
        </div>
      }
      tabs={
        <div className="flex gap-1 ovds-tab-nav px-5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); if (t.key === 'detect') detect(); if (t.key === 'summary') loadSummary(); }}
              className={`ovds-tab ${tab === t.key ? 'active' : ''}`}>{t.label}</button>
          ))}
        </div>
      }
    >
      <AppKpi cells={kpiCells} />

      {/* -- Elimination Entries -- */}
      {tab === 'eliminations' && (
        <div className="ovds-widget-card">
          <div className="ovds-widget-header">
            <h3 className="ovds-card-title">Elimination Entries — {period}</h3>
            <span className="ovds-caption">{items.length} entries</span>
          </div>
          <div className="ovds-widget-body overflow-x-auto">
            {items.length === 0 ? (
              <div className="ovds-empty py-12">
                <GitMerge size={32} className="text-slate-300 mb-2" />
                <span>No elimination entries for {period}</span>
                <button onClick={() => { setTab('detect'); detect(); }} className="mt-3 text-sm text-violet-600 hover:underline">Auto-detect transactions</button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {['From Company','To Company','Type','Amount','Period','Status','Journal','Actions'].map(h => (
                      <th key={h} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left py-2 px-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 ovds-body font-bold truncate max-w-[140px]">{item.fromCompanyId.slice(0,8)}…</td>
                      <td className="py-2.5 px-3 ovds-body truncate max-w-[140px]">{item.toCompanyId.slice(0,8)}…</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TYPE_COLOR[item.eliminationType]}`}>
                          {item.eliminationType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 ovds-number text-right font-bold">ETB {fmt(Number(item.amount))}</td>
                      <td className="py-2.5 px-3 ovds-caption">{item.period}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLOR[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-400">{item.journalEntryId ? item.journalEntryId.slice(0, 8) + '…' : '—'}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {item.status === 'PENDING' && (
                            <button onClick={() => postElimination(item.id)} disabled={actionId === item.id}
                              title="Post elimination" className="p-1.5 hover:bg-[var(--pro-azure-100)] dark:hover:bg-green-900/30 rounded-lg text-[var(--pro-azure)] transition-colors disabled:opacity-40">
                              {actionId === item.id ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                            </button>
                          )}
                          {item.status === 'POSTED' && (
                            <button onClick={() => reverseElimination(item.id)} disabled={actionId === item.id}
                              title="Reverse" className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg text-amber-600 transition-colors disabled:opacity-40">
                              <RotateCcw size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* -- Auto-Detect -- */}
      {tab === 'detect' && (
        <div className="space-y-4">
          <div className="ovds-widget-card p-4 flex items-center gap-3">
            <Zap size={18} className="text-violet-500 shrink-0" />
            <div className="flex-1">
              <p className="ovds-card-title">Auto-Detection — IFRS 10.B86</p>
              <p className="ovds-body mt-0.5">Scans intercompany transactions for {period} and proposes elimination entries. Review and create the ones you need.</p>
            </div>
            <button onClick={detect} disabled={detectLoading} className="ovds-btn-primary flex items-center gap-1.5 disabled:opacity-50">
              {detectLoading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
              {detectLoading ? 'Scanning…' : 'Re-scan'}
            </button>
          </div>
          {suggestions.length === 0 ? (
            <div className="ovds-empty py-12 ovds-widget-card">
              <GitMerge size={32} className="text-slate-300 mb-2" />
              <span>{detectLoading ? 'Scanning transactions…' : 'No intercompany transactions found for this period'}</span>
            </div>
          ) : (
            <div className="ovds-widget-card">
              <div className="ovds-widget-header">
                <h3 className="ovds-card-title">Suggested Eliminations</h3>
                <span className="ovds-caption">{suggestions.length} found</span>
              </div>
              <div className="ovds-widget-body overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      {['From Company','To Company','Tx Type','Amount','Suggested Elimination','Action'].map(h => (
                        <th key={h} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left py-2 px-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map(s => (
                      <tr key={s.intercompanyTxId} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold">{s.fromCompanyName}</td>
                        <td className="py-2.5 px-3 ovds-body">{s.toCompanyName}</td>
                        <td className="py-2.5 px-3 ovds-caption">{s.type}</td>
                        <td className="py-2.5 px-3 ovds-number text-right font-bold text-violet-700 dark:text-violet-400">
                          ETB {fmt(s.amount)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TYPE_COLOR[s.suggestedEliminationType]}`}>
                            {s.suggestedEliminationType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <button onClick={() => createFromSuggestion(s)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-violet-500 text-white rounded-lg text-xs font-bold hover:bg-violet-600 transition-colors">
                            <Plus size={11} /> Create
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -- Consolidated Summary -- */}
      {tab === 'summary' && (
        <div className="space-y-4">
          {summaryLoading ? (
            <div className="ovds-empty py-12 ovds-widget-card"><RefreshCw size={20} className="animate-spin text-violet-500 mb-2" /><span>Computing…</span></div>
          ) : summary ? (
            <>
              <div className="ovds-widget-card p-5">
                <p className="ovds-section-title mb-3">IFRS 10.B86 Elimination Summary — {summary.period}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total to Eliminate</p>
                    <p className="ovds-value text-violet-600 dark:text-violet-400 mt-1">ETB {fmt(summary.total)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Posted</p>
                    <p className="ovds-value text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] mt-1">ETB {fmt(summary.posted)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pending</p>
                    <p className="ovds-value text-amber-600 dark:text-amber-400 mt-1">ETB {fmt(summary.pending)}</p>
                  </div>
                </div>
              </div>
              {summary.byType && Object.keys(summary.byType).length > 0 && (
                <div className="ovds-widget-card p-5">
                  <p className="ovds-card-title mb-3">Breakdown by Elimination Type</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Object.entries(summary.byType as Record<string, number>).map(([type, amount]) => (
                      <div key={type} className="bg-white dark:bg-slate-800 rounded-xl p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TYPE_COLOR[type as EliminationType] ?? 'bg-slate-100 text-slate-600'}`}>{type}</span>
                        <p className="ovds-number font-bold mt-1">ETB {fmt(amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="ovds-widget-card p-4 flex items-start gap-3 border-l-4 border-violet-500">
                <div>
                  <p className="ovds-card-title text-violet-700 dark:text-violet-400">IFRS Reference</p>
                  <p className="ovds-body mt-1">{summary.iasReference}</p>
                  <p className="ovds-caption mt-1">All intragroup balances, transactions, income and expenses must be fully eliminated on consolidation (IFRS 10.B86). Unrealised profits in inventories must also be eliminated (IFRS 10.B87).</p>
                </div>
              </div>
            </>
          ) : (
            <div className="ovds-empty py-12 ovds-widget-card">
              <span>No summary data — select a period and click Consolidated Summary</span>
            </div>
          )}
        </div>
      )}
    </AppPage>
  );
};

export default IntercompanyEliminations;

