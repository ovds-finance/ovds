/**
 * Digital Payments Page — Telebirr & Chapa daily transaction feed
 *
 * Handles real-time ingestion and matching of:
 *   - Telebirr Business API callbacks
 *   - Chapa payment gateway webhooks
 * Unmatched receipts are surfaced for manual review.
 */
import React, { useState, useCallback } from 'react';
import { CreditCard, RefreshCw, CheckCircle2, AlertTriangle, Link, Info } from 'lucide-react';
import { AppPage, Btn } from '@ovds/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtCurrency } from '../utils/fmt';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (n: number) => fmtCurrency(n, 'ETB');

interface DigitalTx {
  id: string;
  provider: 'TELEBIRR' | 'CHAPA';
  reference: string;
  amount: number;
  status: 'MATCHED' | 'UNMATCHED' | 'PARTIAL';
  invoiceId?: string;
  invoiceNumber?: string;
  createdAt: string;
}

const PROVIDER_CFG = {
  TELEBIRR: { label: 'Telebirr',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  CHAPA:    { label: 'Chapa',     cls: 'bg-violet-50 text-violet-700 border border-violet-200' },
};

const STATUS_CFG = {
  MATCHED:   { label: 'Matched',   cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: CheckCircle2 },
  UNMATCHED: { label: 'Unmatched', cls: 'bg-rose-50 text-rose-700 border border-rose-200',           icon: AlertTriangle },
  PARTIAL:   { label: 'Partial',   cls: 'bg-amber-50 text-amber-700 border border-amber-200',        icon: AlertTriangle },
};

const DigitalPaymentsPage: React.FC = () => {
  usePageTitle('Telebirr & Chapa');
  const { selectedCompanyId } = useBusiness();
  const [transactions, setTransactions] = useState<DigitalTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [invoiceInput, setInvoiceInput] = useState<Record<string, string>>({});

  const fetchTransactions = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const res = await api.get('/banking/digital-payments');
      setTransactions(Array.isArray(res.data?.data) ? res.data.data : res.data ?? []);
    } catch {
      toast.error('Failed to load digital payments');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  React.useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const matchToInvoice = async (txId: string) => {
    const invId = invoiceInput[txId];
    if (!invId?.trim()) { toast.error('Enter an invoice ID or number'); return; }
    setMatchingId(txId);
    try {
      await api.post(`/banking/digital-payments/${txId}/match`, { invoiceId: invId });
      toast.success('Payment matched to invoice');
      fetchTransactions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Match failed');
    } finally {
      setMatchingId(null);
    }
  };

  const matched   = transactions.filter(t => t.status === 'MATCHED').length;
  const unmatched = transactions.filter(t => t.status === 'UNMATCHED').length;
  const totalVol  = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <AppPage
      title="Telebirr & Chapa"
      subtitle="Digital payment transaction feed — auto-matching and manual reconciliation"
      icon={<CreditCard size={18} />}
      iconBg="bg-violet-500"
      crumbs={[{ label: 'Cash & Banking' }, { label: 'Telebirr & Chapa' }]}
      actions={
        <Btn variant="secondary" size="sm"
          icon={loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          onClick={fetchTransactions} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Btn>
      }
    >
      <div className="space-y-5">

        {/* KPI strip */}
        <div className="ovds-stat-row">
          {[
            { label: 'Total Volume',       value: fmt(totalVol),          accent: 'bg-violet-500' },
            { label: 'Matched',            value: String(matched),        accent: 'bg-emerald-500' },
            { label: 'Unmatched (action)', value: String(unmatched),      accent: unmatched > 0 ? 'bg-rose-500' : 'bg-slate-300' },
            { label: 'Total Transactions', value: String(transactions.length), accent: 'bg-sky-500' },
          ].map(kpi => (
            <div key={kpi.label} className="ovds-kpi-cell">
              <div className={`w-1 h-8 rounded-full shrink-0 ${kpi.accent}`} />
              <div>
                <p className="ovds-value-sm">{kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Setup hint */}
        <div className="flex gap-2.5 px-4 py-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-700">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>Configure Telebirr Business ID and Chapa API keys under
            <strong> Settings → Currencies & Banking → Digital Wallets</strong> and
            <strong> Chapa Payment Gateway</strong>.</span>
        </div>

        {/* Transaction table */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header">
            <CreditCard size={15} className="text-violet-500" />
            <h3 className="ovds-card-title">Transaction Feed</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  {['Provider', 'Reference', 'Amount', 'Status', 'Matched Invoice', 'Date', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i}>{Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <CreditCard size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-sm text-slate-400">No digital payments received yet</p>
                      <p className="text-xs text-slate-300 mt-1">Payments via Telebirr and Chapa will appear here automatically</p>
                    </td>
                  </tr>
                ) : transactions.map(tx => {
                  const pCfg = PROVIDER_CFG[tx.provider];
                  const sCfg = STATUS_CFG[tx.status];
                  const StatusIcon = sCfg.icon;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${pCfg.cls}`}>{pCfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">{tx.reference}</td>
                      <td className="px-4 py-3 text-xs font-semibold tabular-nums text-right">{fmt(tx.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sCfg.cls}`}>
                          <StatusIcon size={10} /> {sCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {tx.invoiceNumber ? (
                          <span className="flex items-center gap-1"><Link size={11} /> {tx.invoiceNumber}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString('en-ET', { dateStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        {tx.status !== 'MATCHED' && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="Invoice ID"
                              value={invoiceInput[tx.id] ?? ''}
                              onChange={e => setInvoiceInput(p => ({ ...p, [tx.id]: e.target.value }))}
                              className="w-28 px-2 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                            />
                            <button
                              onClick={() => matchToInvoice(tx.id)}
                              disabled={matchingId === tx.id}
                              className="px-2 py-1 text-[10px] font-medium bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {matchingId === tx.id ? <RefreshCw size={10} className="animate-spin" /> : 'Match'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppPage>
  );
};

export default DigitalPaymentsPage;
