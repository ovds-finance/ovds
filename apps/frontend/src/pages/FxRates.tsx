/**
 * FxRates — Multi-Currency & FX Rate Management (Priority 6)
 *
 * Activates the existing CurrencyService + NBECurrencyService backend.
 *
 * Features:
 *  - Live NBE rates strip with source badge (live / scrape / fallback)
 *  - Currency register: create / edit / enable-disable / delete
 *  - Exchange rate history: list, manual upsert, fetch-live from NBE
 *  - IAS 21 converter: quick foreign-amount → ETB widget
 *  - Rate trend mini-chart (recharts)
 *
 * Endpoints consumed:
 *   GET    /ovds/currency                    — list currencies
 *   POST   /ovds/currency                    — create currency
 *   PATCH  /ovds/currency/:id                — update currency
 *   DELETE /ovds/currency/:id                — delete currency
 *   GET    /ovds/currency/rates              — list exchange rates
 *   PUT    /ovds/currency/rates              — upsert rate
 *   POST   /ovds/currency/fetch-live         — fetch NBE live
 *   GET    /ovds/currency/convert            — convert amount
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw, Plus, Edit2, Trash2, Save, Zap,
  TrendingUp, TrendingDown, Globe, ArrowRight,
  Info, CheckCircle, AlertTriangle, Download,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Select, EmptyState,
  StatusBadge, SearchBar, Amount,
} from '../components/ui';
import api from '../services/api';
import { confirm } from '../utils/confirm';

// -- Types ---------------------------------------------------------------------

interface NBERate {
  currency: string;
  buying: number;
  selling: number;
  date: string;
  source: 'live' | 'scrape' | 'fallback' | 'cache';
}

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol?: string | null;
  rate?: number;
  enabled?: boolean;
}

interface CurrencyRate {
  id?: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source?: string;
  date: string;
}

type TabKey = 'rates' | 'currencies' | 'converter' | 'history' | 'revaluation';

// -- Source badge ---------------------------------------------------------------
const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const cfg = {
    live:     { label: 'NBE Live',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
    scrape:   { label: 'NBE Scraped', cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800' },
    cache:    { label: 'Cached',      cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800' },
    fallback: { label: 'Fallback',    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
    MANUAL:   { label: 'Manual',      cls: 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
    NBE_LIVE: { label: 'NBE Live',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
  } as Record<string, { label: string; cls: string }>;
  const m = cfg[source] ?? { label: source, cls: 'bg-white text-slate-500 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[9px] font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
};

// -- Rate trend mini-chart ------------------------------------------------------
const RateTrendChart: React.FC<{ data: CurrencyRate[]; currency: string }> = ({ data, currency }) => {
  const filtered = useMemo(() =>
    data
      .filter(r => r.toCurrency === currency || r.fromCurrency === currency)
      .slice(-14)
      .map(r => ({ date: r.date?.slice(0, 10) ?? '', rate: Number(r.rate) })),
    [data, currency],
  );

  if (filtered.length < 2) return (
    <p className="text-[10px] text-slate-400 italic text-center py-4">Not enough history for chart</p>
  );

  const min = Math.min(...filtered.map(d => d.rate));
  const max = Math.max(...filtered.map(d => d.rate));
  const range = max - min;

  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={filtered} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis dataKey="date" hide />
        <YAxis domain={[min - range * 0.05, max + range * 0.05]} hide />
        <Tooltip
          formatter={(v: any) => [`ETB ${Number(v).toFixed(4)}`, 'Rate']}
          labelFormatter={l => `Date: ${l}`}
          contentStyle={{ fontSize: 10 }}
        />
        <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
          {filtered.map((_, i) => (
            <Cell
              key={i}
              fill={i === filtered.length - 1 ? '#10b981' : '#e2e8f0'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// -- Currency form -------------------------------------------------------------
const CurrencyForm: React.FC<{
  data: Partial<Currency>;
  onChange: (d: Partial<Currency>) => void;
}> = ({ data, onChange }) => {
  const set = (k: keyof Currency, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Currency Name" required>
          <Input
            value={data.name ?? ''}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. US Dollar"
          />
        </FormField>
        <FormField label="ISO Code" required hint="3-letter code, e.g. USD">
          <Input
            value={data.code ?? ''}
            onChange={e => set('code', e.target.value.toUpperCase().slice(0, 3))}
            placeholder="USD"
            maxLength={3}
            className="font-mono uppercase"
          />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Symbol">
          <Input
            value={data.symbol ?? ''}
            onChange={e => set('symbol', e.target.value)}
            placeholder="$"
            maxLength={4}
          />
        </FormField>
        <FormField label="Base Rate to ETB" hint="Initial rate (updated by NBE sync)">
          <Input
            type="number"
            step="0.0001"
            min={0}
            value={data.rate ?? ''}
            onChange={e => set('rate', parseFloat(e.target.value) || 0)}
            placeholder="57.10"
          />
        </FormField>
      </div>
    </div>
  );
};

// -- Manual rate upsert form ---------------------------------------------------
const RateForm: React.FC<{
  data: Partial<CurrencyRate>;
  onChange: (d: Partial<CurrencyRate>) => void;
  currencies: Currency[];
}> = ({ data, onChange, currencies }) => {
  const set = (k: keyof CurrencyRate, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="From Currency" required>
          <Select value={data.fromCurrency ?? 'USD'} onChange={e => set('fromCurrency', e)}>
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </Select>
        </FormField>
        <FormField label="To Currency" required>
          <Select value={data.toCurrency ?? 'ETB'} onChange={e => set('toCurrency', e)}>
            <option value="ETB">ETB — Ethiopian Birr</option>
            {currencies.filter(c => c.code !== 'ETB').map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Exchange Rate" required hint="1 unit of From = ? units of To">
          <Input
            type="number"
            step="0.0001"
            min={0}
            value={data.rate ?? ''}
            onChange={e => set('rate', parseFloat(e.target.value) || 0)}
            placeholder="57.1000"
            className="font-mono"
          />
        </FormField>
        <FormField label="Effective Date">
          <Input
            type="date"
            value={data.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)}
            onChange={e => set('date', e.target.value)}
          />
        </FormField>
      </div>
      {data.fromCurrency && data.toCurrency && Number(data.rate) > 0 && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px]">
          <CheckCircle size={12} className="text-emerald-500 shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-400">
            1 <strong>{data.fromCurrency}</strong> = <strong>ETB {Number(data.rate).toFixed(4)}</strong> (IAS 21 closing rate)
          </span>
        </div>
      )}
    </div>
  );
};

// -- IAS 21 Period-End Revaluation Panel --------------------------------------
const FxRevaluationPanel: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [asOf, setAsOf]         = React.useState(new Date().toISOString().slice(0, 10));
  const [dryRun, setDryRun]     = React.useState(true);
  const [result, setResult]     = React.useState<any>(null);
  const [running, setRunning]   = React.useState(false);

  const run = async () => {
    setRunning(true);
    try {
      const res = await api.post('/ovds/currency/revalue-balances', {
        asOfDate: asOf,
        dryRun,
        companyId: selectedCompanyId,
      });
      setResult(res.data?.data ?? res.data);
      if (!dryRun && (res.data?.data ?? res.data)?.journalPosted) {
        toast.success('IAS 21 FX revaluation journal posted to GL');
      } else if (dryRun) {
        toast.success('Dry run complete — no journal posted');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Revaluation failed');
    } finally {
      setRunning(false);
    }
  };

  const fmtETB = (n: number) => `ETB ${Math.abs(n).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="ovds-widget-card p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="ovds-card-title mb-1">IAS 21 Period-End Revaluation</h3>
            <p className="ovds-body">
              Retranslates all open foreign-currency AR and AP balances at the NBE closing
              rate on the selected date. Recognises unrealised FX gains/losses in P&amp;L per
              IAS 21.23 and IAS 21.28.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Revaluation Date</label>
              <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="dry-run" checked={dryRun} onChange={e => setDryRun(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-sky-500 cursor-pointer" />
              <label htmlFor="dry-run" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                Dry run (preview only)
              </label>
            </div>
            <button onClick={run} disabled={running}
              className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                dryRun
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sm shadow-sky-500/20'
              }`}>
              {running
                ? <><RefreshCw size={14} className="animate-spin" /> Running…</>
                : dryRun
                  ? <><TrendingUp size={14} /> Preview</>
                  : <><CheckCircle size={14} /> Post to GL</>}
            </button>
          </div>
        </div>

        {!dryRun && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <AlertTriangle size={13} className="shrink-0" />
            <span><strong>Live mode:</strong> This will post a journal entry to the GL for every open foreign-currency balance. Ensure the period is not locked before proceeding.</span>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary KPIs */}
          <div className="ovds-stat-row">
            {[
              { label: 'Items Revalued',  value: String(result.itemCount),              accent: 'bg-slate-400' },
              { label: 'Total FX Gains',  value: fmtETB(result.totalGain),              accent: result.totalGain > 0  ? 'bg-emerald-500' : 'bg-slate-200' },
              { label: 'Total FX Losses', value: fmtETB(result.totalLoss),              accent: result.totalLoss > 0  ? 'bg-rose-500'    : 'bg-slate-200' },
              { label: 'Net Position',    value: fmtETB(result.netFxMovement),          accent: result.netFxMovement >= 0 ? 'bg-emerald-500' : 'bg-rose-500' },
              { label: 'GL Posted',       value: result.journalPosted ? 'Yes' : dryRun ? 'Dry Run' : 'No',
                accent: result.journalPosted ? 'bg-emerald-500' : 'bg-slate-300' },
            ].map(k => (
              <div key={k.label} className="ovds-kpi-cell">
                <div className={`w-1 h-8 rounded-full shrink-0 ${k.accent}`} />
                <div>
                  <p className="ovds-value-sm tabular-nums">{k.value}</p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Net position banner */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
            result.netPosition === 'NET_GAIN'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : result.netPosition === 'NET_LOSS'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-white border-slate-200 text-slate-600'
          }`}>
            {result.netPosition === 'NET_GAIN'
              ? <TrendingUp size={16} className="shrink-0" />
              : result.netPosition === 'NET_LOSS'
              ? <TrendingDown size={16} className="shrink-0" />
              : <Globe size={16} className="shrink-0" />}
            <div>
              <strong>
                {result.netPosition === 'NET_GAIN'  ? `Net unrealised FX gain: ${fmtETB(result.netFxMovement)}`
                : result.netPosition === 'NET_LOSS'  ? `Net unrealised FX loss: ${fmtETB(result.netFxMovement)}`
                : 'No FX differences — all balances at historical rate'}
              </strong>
              <p className="text-xs mt-0.5 opacity-75">{result.ifrsReference}</p>
            </div>
          </div>

          {/* Movement table */}
          {result.movements?.length > 0 && (
            <div className="ovds-widget-card overflow-hidden">
              <div className="ovds-widget-header">
                <h3 className="ovds-card-title">FX Movements — {result.asOfDate}</h3>
                <span className="ovds-caption ml-auto">{result.dryRun ? '⚠️ Dry run — not posted' : '✅ Posted to GL'}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white border-b border-slate-100">
                      {['Type', 'Reference', 'Currency', 'FC Amount', 'Original Rate', 'Closing Rate', 'Original ETB', 'Revalued ETB', 'FX Difference', 'G/L'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {result.movements.map((m: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            m.type === 'INVOICE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>{m.type}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-600">{m.reference}</td>
                        <td className="px-4 py-3 text-xs font-bold text-sky-600">{m.currency}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right">{Number(m.fcAmount).toLocaleString('en-ET', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right text-slate-400">{Number(m.originalRate).toFixed(4)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right font-semibold">{Number(m.closingRate).toFixed(4)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right">{fmtETB(m.originalETB)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right font-semibold">{fmtETB(m.revaluedETB)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-right">
                          <span className={m.fxDifference >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                            {m.fxDifference >= 0 ? '+' : ''}{fmtETB(m.fxDifference)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.gainOrLoss === 'GAIN'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : m.gainOrLoss === 'LOSS'
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-slate-100 text-slate-400'
                          }`}>{m.gainOrLoss}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.movements?.length === 0 && (
            <div className="px-5 py-12 text-center ovds-widget-card">
              <Globe size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No foreign-currency open balances found</p>
              <p className="text-xs text-slate-300 mt-1">All open invoices and bills are in ETB, or no open foreign-currency items exist</p>
            </div>
          )}
        </>
      )}

      {/* IAS 21 guide */}
      <div className="ovds-grid-layout cols-3 gap-3">
        {[
          { step: '1', title: 'Transaction Date', desc: 'Record at spot rate on transaction date (IAS 21.21)', color: 'bg-sky-50 border-sky-100 text-sky-700' },
          { step: '2', title: 'Closing Rate',     desc: 'Retranslate monetary items at period-end closing rate (IAS 21.23a)', color: 'bg-amber-50 border-amber-100 text-amber-700' },
          { step: '3', title: 'P&L Recognition',  desc: 'Recognise FX differences in profit or loss (IAS 21.28)', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
        ].map(c => (
          <div key={c.step} className={`px-4 py-3 rounded-xl border ${c.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-[10px] font-bold">{c.step}</span>
              <p className="text-xs font-bold">{c.title}</p>
            </div>
            <p className="text-[11px] opacity-75">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// -- Main page -----------------------------------------------------------------
const FxRates: React.FC = () => {
  usePageTitle('FX Rates & Currencies');
  const { can } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('rates');
  const [nbeRates, setNbeRates] = useState<NBERate[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rateHistory, setRateHistory] = useState<CurrencyRate[]>([]);
  const [nbeLoading, setNbeLoading] = useState(true);
  const [currLoading, setCurrLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  // Modals
  const [currModal, setCurrModal] = useState<{ open: boolean; data: Partial<Currency> }>({ open: false, data: {} });
  const [rateModal, setRateModal] = useState<{ open: boolean; data: Partial<CurrencyRate> }>({ open: false, data: {} });
  const [currSaving, setCurrSaving] = useState(false);
  const [rateSaving, setRateSaving] = useState(false);

  // IAS 21 converter
  const [convAmount, setConvAmount] = useState('');
  const [convFrom, setConvFrom] = useState('USD');
  const [convTo, setConvTo] = useState('ETB');
  const [convResult, setConvResult] = useState<{ result: number; rate: number; source: string } | null>(null);
  const [converting, setConverting] = useState(false);

  // -- Load NBE rates ---------------------------------------------------------
  const loadNbeRates = useCallback(async () => {
    setNbeLoading(true);
    try {
      const r = await api.get('/ovds/currency/rates');
      const raw = r.data?.data ?? r.data;
      // The endpoint returns either NBERate[] directly or { rates: [...] }
      const arr: any[] = Array.isArray(raw) ? raw : (raw?.rates ?? raw?.data ?? []);
      setNbeRates(arr);
    } catch {
      // Fallback: try the alias endpoint
      try {
        const r2 = await api.get('/ovds/currency-rates');
        const raw2 = r2.data?.data ?? r2.data;
        setNbeRates(Array.isArray(raw2) ? raw2 : []);
      } catch { /* silent */ }
    } finally {
      setNbeLoading(false);
    }
  }, []);

  // -- Load currencies --------------------------------------------------------
  const loadCurrencies = useCallback(async () => {
    setCurrLoading(true);
    try {
      const r = await api.get('/ovds/currency');
      const raw = r.data?.data ?? r.data;
      setCurrencies(Array.isArray(raw) ? raw : []);
    } catch { /* silent */ } finally {
      setCurrLoading(false);
    }
  }, []);

  // -- Load rate history ------------------------------------------------------
  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const r = await api.get(`/ovds/currency/rates?to=ETB`);
      const raw = r.data?.data ?? r.data;
      setRateHistory(Array.isArray(raw) ? raw : []);
    } catch { /* silent */ } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { loadNbeRates(); loadCurrencies(); }, [loadNbeRates, loadCurrencies]);
  useEffect(() => { if (activeTab === 'history') loadHistory(); }, [activeTab, loadHistory]);

  // -- Fetch live from NBE ----------------------------------------------------
  const fetchLive = async () => {
    setFetchingLive(true);
    try {
      const r = await api.post('/ovds/currency/fetch-live');
      const d = r.data?.data ?? r.data;
      toast.success(`Fetched ${d?.saved ?? d?.total ?? '?'} rates from ${d?.source ?? 'NBE'}`);
      await loadNbeRates();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to fetch live rates');
    } finally {
      setFetchingLive(false);
    }
  };

  // -- Currency CRUD ----------------------------------------------------------
  const saveCurrency = async () => {
    const { id, name, code, symbol, rate } = currModal.data;
    if (!name?.trim() || !code?.trim()) { toast.error('Name and code are required'); return; }
    setCurrSaving(true);
    try {
      if (id) {
        await api.patch(`/ovds/currency/${id}`, { name, code, symbol, rate });
        toast.success('Currency updated');
      } else {
        await api.post('/ovds/currency', { name, code, symbol, rate: rate ?? 1 });
        toast.success('Currency created');
      }
      setCurrModal({ open: false, data: {} });
      await loadCurrencies();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save currency');
    } finally {
      setCurrSaving(false);
    }
  };

  const deleteCurrency = async (c: Currency) => {
    if (!await confirm({ title: `Delete ${c.code} — ${c.name}?`, message: 'This cannot be undone. Existing transactions using this currency will not be affected.', variant: 'danger' })) return;
    try {
      await api.delete(`/ovds/currency/${c.id}`);
      toast.success(`${c.code} deleted`);
      await loadCurrencies();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Delete failed');
    }
  };

  // -- Manual rate upsert -----------------------------------------------------
  const saveRate = async () => {
    const { fromCurrency, toCurrency, rate, date } = rateModal.data;
    if (!fromCurrency || !toCurrency || !rate || rate <= 0) {
      toast.error('From, To, and Rate are required');
      return;
    }
    setRateSaving(true);
    try {
      await api.put('/ovds/currency/rates', {
        fromCurrency,
        toCurrency,
        rate,
        date: date ?? new Date().toISOString().slice(0, 10),
        source: 'MANUAL',
      });
      toast.success(`Rate ${fromCurrency}/${toCurrency} saved`);
      setRateModal({ open: false, data: {} });
      await loadNbeRates();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save rate');
    } finally {
      setRateSaving(false);
    }
  };

  // -- IAS 21 converter -------------------------------------------------------
  const runConvert = async () => {
    const amt = parseFloat(convAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setConverting(true);
    try {
      const r = await api.get(`/ovds/currency/convert?amount=${amt}&from=${convFrom}&to=${convTo}`);
      const d = r.data?.data ?? r.data;
      // The endpoint returns either a number or { amountETB, result, rate, source }
      const result = typeof d === 'number' ? d : (d?.amountETB ?? d?.result ?? d);
      const rate   = d?.rate ?? (result / amt);
      const source = d?.source ?? 'live';
      setConvResult({ result: Number(result), rate: Number(rate), source });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  // -- Derived ----------------------------------------------------------------
  const filteredNbe = useMemo(() => {
    if (!search.trim()) return nbeRates;
    const q = search.toLowerCase();
    return nbeRates.filter(r => r.currency?.toLowerCase().includes(q));
  }, [nbeRates, search]);

  const filteredCurrencies = useMemo(() => {
    if (!search.trim()) return currencies;
    const q = search.toLowerCase();
    return currencies.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [currencies, search]);

  const kpiCells = useMemo(() => [
    { label: 'Tracked Currencies', value: currencies.length,         color: 'emerald' as const },
    { label: 'Live Rates',         value: nbeRates.filter(r => r.source === 'live' || (r.source as string) === 'NBE_LIVE').length, color: 'sky' as const },
    { label: 'ETB Base',           value: 'ETB',                     color: 'emerald' as const },
    { label: 'Last Source',        value: nbeRates[0]?.source ?? '—', color: 'amber' as const },
  ], [currencies, nbeRates]);

  // Most common FX pairs for quick converter reference
  const QUICK_PAIRS = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'CNY'];
  const quickRates = useMemo(() =>
    QUICK_PAIRS.map(code => nbeRates.find(r => r.currency === code)).filter(Boolean) as NBERate[],
    [nbeRates],
  );

  // -- Export rates CSV -------------------------------------------------------
  const exportCsv = () => {
    const rows = nbeRates.map(r =>
      `${r.currency},${r.buying},${r.selling ?? r.buying},${r.date},${r.source}`
    );
    const blob = new Blob([['Currency,Buying,Selling,Date,Source', ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fx-rates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="FX Rates & Currencies"
      subtitle="IAS 21 — NBE official rates · Multi-currency management · ETB converter"
      icon={<Globe size={18} />}
      iconBg="bg-sky-500"
      crumbs={[{ label: 'ovds' }, { label: 'FX Rates' }]}
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} className={nbeLoading ? 'animate-spin' : ''} />}
            onClick={() => { loadNbeRates(); loadCurrencies(); }}>
            Refresh
          </Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={exportCsv}>
            Export CSV
          </Btn>
          {can('ovds:write') && (
            <Btn
              variant="primary"
              size="sm"
              icon={fetchingLive ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} />}
              onClick={fetchLive}
              loading={fetchingLive}
            >
              Fetch NBE Live
            </Btn>
          )}
        </>
      }
    >
      {/* KPI strip */}
      <AppKpi cells={kpiCells} />

      {/* Quick rate strip — top 6 currencies */}
      {quickRates.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {quickRates.map(r => {
            const prev = rateHistory.find(h => h.toCurrency === r.currency || h.fromCurrency === r.currency);
            const prevRate = prev ? Number(prev.rate) : r.buying;
            const change = r.buying - prevRate;
            const pct = prevRate > 0 ? (change / prevRate) * 100 : 0;
            return (
              <button
                key={r.currency}
                onClick={() => { setSelectedCurrency(r.currency); setActiveTab('history'); }}
                className="text-left p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 font-mono">{r.currency}</span>
                  <SourceBadge source={r.source} />
                </div>
                <p className="text-base font-black tabular-nums text-slate-800 dark:text-slate-100">
                  {r.buying.toFixed(4)}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">ETB per 1 {r.currency}</p>
                {Math.abs(pct) > 0.01 && (
                  <p className={`text-[9px] font-bold mt-0.5 flex items-center gap-0.5 ${pct >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {pct >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                    {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <AppTabs
        tabs={[
          { key: 'rates',        label: 'Exchange Rates',   count: nbeRates.length },
          { key: 'currencies',   label: 'Currencies',       count: currencies.length },
          { key: 'converter',    label: 'IAS 21 Converter' },
          { key: 'history',      label: 'Rate History' },
          { key: 'revaluation',  label: 'Period-End Revaluation', badge: 'IAS 21' },
        ]}
        active={activeTab}
        onChange={k => setActiveTab(k as TabKey)}
      />

      {/* Search + actions toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={activeTab === 'currencies' ? 'Search currencies…' : 'Filter by code…'}
          className="w-48"
        />
        <div className="flex-1" />
        {activeTab === 'currencies' && can('ovds:write') && (
          <Btn variant="primary" size="sm" icon={<Plus size={11} />}
            onClick={() => setCurrModal({ open: true, data: { rate: 1 } })}>
            Add Currency
          </Btn>
        )}
        {activeTab === 'rates' && can('ovds:write') && (
          <Btn variant="secondary" size="sm" icon={<Plus size={11} />}
            onClick={() => setRateModal({ open: true, data: { fromCurrency: 'USD', toCurrency: 'ETB', date: new Date().toISOString().slice(0, 10) } })}>
            Manual Rate
          </Btn>
        )}
      </div>

      {/* -- TAB: EXCHANGE RATES -- */}
      {activeTab === 'rates' && (
        <AppTable>
          <thead>
            <tr>
              <AppTh>Currency</AppTh>
              <AppTh align="right">Buying (ETB)</AppTh>
              <AppTh align="right">Selling (ETB)</AppTh>
              <AppTh>Date</AppTh>
              <AppTh>Source</AppTh>
              <AppTh align="right">Actions</AppTh>
            </tr>
          </thead>
          <tbody>
            {nbeLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredNbe.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<Globe size={20} />}
                    title="No exchange rates found"
                    desc="Click 'Fetch NBE Live' to load current rates from the National Bank of Ethiopia."
                    action={can('ovds:write') ? { label: 'Fetch NBE Live', onClick: fetchLive } : undefined}
                  />
                </td>
              </tr>
            ) : filteredNbe.map(r => (
              <AppTr key={r.currency}>
                <AppTd>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/20 flex items-center justify-center text-[10px] font-black text-sky-700 dark:text-sky-400 font-mono">
                      {r.currency.slice(0, 3)}
                    </span>
                    <div>
                      <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 font-mono">{r.currency}</p>
                      <p className="text-[9px] text-slate-400">per 1 unit → ETB</p>
                    </div>
                  </div>
                </AppTd>
                <AppTd align="right">
                  <span className="text-[13px] font-black tabular-nums text-slate-800 dark:text-slate-100">
                    {Number(r.buying).toFixed(4)}
                  </span>
                </AppTd>
                <AppTd align="right">
                  <span className="text-[12px] font-bold tabular-nums text-slate-600 dark:text-slate-400">
                    {r.selling ? Number(r.selling).toFixed(4) : '—'}
                  </span>
                </AppTd>
                <AppTd>
                  <span className="text-[11px] font-mono text-slate-500">
                    {r.date?.slice(0, 10) ?? '—'}
                  </span>
                </AppTd>
                <AppTd>
                  <SourceBadge source={r.source ?? 'MANUAL'} />
                </AppTd>
                <AppTd align="right">
                  {can('ovds:write') && (
                    <Btn
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[10px]"
                      icon={<Edit2 size={10} />}
                      onClick={() => setRateModal({
                        open: true,
                        data: {
                          fromCurrency: r.currency,
                          toCurrency: 'ETB',
                          rate: r.buying,
                          date: r.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
                        },
                      })}
                    >
                      Edit
                    </Btn>
                  )}
                </AppTd>
              </AppTr>
            ))}
          </tbody>
        </AppTable>
      )}

      {/* -- TAB: CURRENCIES -- */}
      {activeTab === 'currencies' && (
        <AppTable>
          <thead>
            <tr>
              <AppTh>Currency</AppTh>
              <AppTh>Code</AppTh>
              <AppTh>Symbol</AppTh>
              <AppTh align="right">Rate to ETB</AppTh>
              <AppTh>Status</AppTh>
              <AppTh align="right">Actions</AppTh>
            </tr>
          </thead>
          <tbody>
            {currLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredCurrencies.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<Globe size={20} />}
                    title="No currencies configured"
                    desc="Add currencies your company transacts in."
                    action={can('ovds:write') ? { label: 'Add Currency', onClick: () => setCurrModal({ open: true, data: { rate: 1 } }) } : undefined}
                  />
                </td>
              </tr>
            ) : filteredCurrencies.map(c => (
              <AppTr key={c.id}>
                <AppTd>
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">{c.name}</p>
                </AppTd>
                <AppTd>
                  <span className="text-[11px] font-black font-mono text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/20 px-2 py-0.5 rounded border border-sky-100 dark:border-sky-900">
                    {c.code}
                  </span>
                </AppTd>
                <AppTd>
                  <span className="text-[12px] font-mono text-slate-500">{c.symbol ?? '—'}</span>
                </AppTd>
                <AppTd align="right">
                  <span className="text-[12px] font-bold tabular-nums font-mono text-slate-700 dark:text-slate-300">
                    {c.rate ? Number(c.rate).toFixed(4) : '—'}
                  </span>
                </AppTd>
                <AppTd>
                  <StatusBadge
                    status={c.enabled !== false ? 'ACTIVE' : 'INACTIVE'}
                    label={c.enabled !== false ? 'Active' : 'Disabled'}
                  />
                </AppTd>
                <AppTd align="right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {can('ovds:write') && (
                      <>
                        <Btn size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => setCurrModal({ open: true, data: { ...c } })}>
                          <Edit2 size={11} />
                        </Btn>
                        <Btn size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => deleteCurrency(c)}>
                          <Trash2 size={11} />
                        </Btn>
                      </>
                    )}
                  </div>
                </AppTd>
              </AppTr>
            ))}
          </tbody>
        </AppTable>
      )}

      {/* -- TAB: IAS 21 CONVERTER -- */}
      {activeTab === 'converter' && (
        <div className="max-w-xl space-y-5">
          <div className="p-4 bg-sky-50 dark:bg-sky-950/10 border border-sky-200 dark:border-sky-800 rounded-xl">
            <div className="flex items-start gap-2 mb-3">
              <Info size={13} className="text-sky-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-sky-700 dark:text-sky-400 leading-relaxed">
                <strong>IAS 21 — The Effects of Changes in Foreign Exchange Rates.</strong> Use the closing rate
                (NBE selling rate) for monetary items at reporting date. Use the transaction date rate for
                initial recognition of foreign currency transactions.
              </p>
            </div>
          </div>

          <div className="ovds-widget-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Currency Converter</h3>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Amount">
                <Input
                  type="number"
                  step="any"
                  value={convAmount}
                  onChange={e => { setConvAmount(e.target.value); setConvResult(null); }}
                  placeholder="100.00"
                  className="font-mono text-right"
                />
              </FormField>
              <FormField label="From Currency">
                <Select value={convFrom} onChange={e => { setConvFrom(e); setConvResult(null); }}>
                  {(['USD', 'EUR', 'GBP', 'AED', 'SAR', 'CNY', 'ETB'] as const).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {currencies.filter(c => !['USD', 'EUR', 'GBP', 'AED', 'SAR', 'CNY', 'ETB'].includes(c.code))
                    .map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                </Select>
              </FormField>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-950/20 flex items-center justify-center">
                <ArrowRight size={14} className="text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            </div>

            <FormField label="To Currency">
              <Select value={convTo} onChange={e => { setConvTo(e); setConvResult(null); }}>
                <option value="ETB">ETB — Ethiopian Birr</option>
                {(['USD', 'EUR', 'GBP', 'AED', 'SAR', 'CNY'] as const).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {currencies.filter(c => !['USD', 'EUR', 'GBP', 'AED', 'SAR', 'CNY', 'ETB'].includes(c.code))
                  .map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </Select>
            </FormField>

            <Btn
              variant="primary"
              icon={converting ? <RefreshCw size={12} className="animate-spin" /> : <ArrowRight size={12} />}
              onClick={runConvert}
              loading={converting}
              className="w-full justify-center"
            >
              Convert
            </Btn>

            {convResult && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Result</p>
                  <SourceBadge source={convResult.source} />
                </div>
                <p className="text-2xl font-black tabular-nums text-slate-800 dark:text-slate-100">
                  {convTo} {convResult.result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Rate: 1 {convFrom} = {convTo} {Number(convResult.rate).toFixed(4)}
                  <span className="mx-2 text-slate-300">·</span>
                  IAS 21.21 closing rate applied
                </p>
              </div>
            )}
          </div>

          {/* Quick reference table */}
          {quickRates.length > 0 && (
            <div className="ovds-widget-card p-4">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Quick Reference — ETB Rates Today</p>
              <div className="space-y-1">
                {quickRates.map(r => (
                  <div key={r.currency} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                    <span className="text-[11px] font-black font-mono text-slate-700 dark:text-slate-300">{r.currency}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500">Buy: <strong className="text-slate-700 dark:text-slate-300 tabular-nums">{r.buying.toFixed(4)}</strong></span>
                      <span className="text-[11px] text-slate-500">Sell: <strong className="text-slate-700 dark:text-slate-300 tabular-nums">{(r.selling ?? r.buying).toFixed(4)}</strong></span>
                      <SourceBadge source={r.source} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -- TAB: RATE HISTORY -- */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Select currency:</p>
            <div className="flex items-center gap-1 flex-wrap">
              {QUICK_PAIRS.map(code => (
                <button
                  key={code}
                  onClick={() => setSelectedCurrency(code)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    selectedCurrency === code
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
            <Btn variant="ghost" size="sm" icon={<RefreshCw size={10} className={histLoading ? 'animate-spin' : ''} />}
              onClick={loadHistory}>
              Reload
            </Btn>
          </div>

          <div className="ovds-widget-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="ovds-card-title">{selectedCurrency}/ETB — Last 14 Rates</p>
              {nbeRates.find(r => r.currency === selectedCurrency) && (
                <p className="text-xl font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                  ETB {(nbeRates.find(r => r.currency === selectedCurrency)!.buying).toFixed(4)}
                </p>
              )}
            </div>
            <RateTrendChart data={rateHistory} currency={selectedCurrency} />
          </div>

          <AppTable>
            <thead>
              <tr>
                <AppTh>Date</AppTh>
                <AppTh>From</AppTh>
                <AppTh>To</AppTh>
                <AppTh align="right">Rate</AppTh>
                <AppTh>Source</AppTh>
              </tr>
            </thead>
            <tbody>
              {histLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rateHistory.filter(r => r.fromCurrency === selectedCurrency || r.toCurrency === selectedCurrency).length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon={<Globe size={18} />} title="No history for this currency" desc="Fetch live rates to populate rate history." />
                  </td>
                </tr>
              ) : rateHistory
                  .filter(r => r.fromCurrency === selectedCurrency || r.toCurrency === selectedCurrency)
                  .slice(0, 30)
                  .map((r, i) => (
                    <AppTr key={i}>
                      <AppTd><span className="text-[11px] font-mono text-slate-500">{r.date?.slice(0, 10) ?? '—'}</span></AppTd>
                      <AppTd><span className="text-[11px] font-black font-mono text-sky-700 dark:text-sky-400">{r.fromCurrency}</span></AppTd>
                      <AppTd><span className="text-[11px] font-black font-mono text-emerald-700 dark:text-emerald-400">{r.toCurrency}</span></AppTd>
                      <AppTd align="right">
                        <span className="text-[12px] font-black tabular-nums font-mono text-slate-800 dark:text-slate-100">
                          {Number(r.rate).toFixed(4)}
                        </span>
                      </AppTd>
                      <AppTd><SourceBadge source={r.source ?? 'MANUAL'} /></AppTd>
                    </AppTr>
                  ))
              }
            </tbody>
          </AppTable>
        </div>
      )}

      {/* -- TAB: IAS 21 PERIOD-END REVALUATION -- */}
      {activeTab === 'revaluation' && (
        <FxRevaluationPanel />
      )}

      {/* IAS 21 note */}
      <div className="p-4 bg-sky-50 dark:bg-sky-950/10 border border-sky-200 dark:border-sky-800 rounded-xl text-[11px] space-y-1">
        <p className="font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Info size={10} /> IAS 21 — The Effects of Changes in Foreign Exchange Rates
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          {[
            { title: 'Initial Recognition', desc: 'Record foreign currency transactions at the spot rate on the transaction date (IAS 21.21).' },
            { title: 'Monetary Items', desc: 'Translate receivables, payables, and cash at the closing rate at each reporting date (IAS 21.23a).' },
            { title: 'Exchange Differences', desc: 'Recognise exchange differences arising on settlement or retranslation in profit or loss (IAS 21.28).' },
          ].map(item => (
            <div key={item.title} className="flex gap-2">
              <AlertTriangle size={11} className="text-sky-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sky-700 dark:text-sky-400">{item.title}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Currency Modal */}
      <Modal
        open={currModal.open}
        onClose={() => setCurrModal({ open: false, data: {} })}
        title={currModal.data.id ? `Edit: ${currModal.data.code}` : 'Add Currency'}
        subtitle="ISO 4217 currency definition"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setCurrModal({ open: false, data: {} })}>Cancel</Btn>
            <Btn variant="primary" loading={currSaving} onClick={saveCurrency}>
              {currModal.data.id ? 'Save' : 'Add Currency'}
            </Btn>
          </>
        }
      >
        <CurrencyForm data={currModal.data} onChange={d => setCurrModal(m => ({ ...m, data: d }))} />
      </Modal>

      {/* Manual Rate Modal */}
      <Modal
        open={rateModal.open}
        onClose={() => setRateModal({ open: false, data: {} })}
        title="Set Exchange Rate"
        subtitle="IAS 21 — manual rate override"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setRateModal({ open: false, data: {} })}>Cancel</Btn>
            <Btn variant="primary" loading={rateSaving} onClick={saveRate}>Save Rate</Btn>
          </>
        }
      >
        <RateForm
          data={rateModal.data}
          onChange={d => setRateModal(m => ({ ...m, data: d }))}
          currencies={currencies}
        />
      </Modal>
    </AppPage>
  );
};

export default FxRates;


