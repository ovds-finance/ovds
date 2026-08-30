/**
 * PaymentVerificationPanel
 *
 * Allows ovds/admin users to verify customer payments against official
 * Ethiopian financial networks in real time:
 *   • CBE Birr  (Commercial Bank of Ethiopia)
 *   • Telebirr  (Ethio Telecom)
 *   • Awash Bank
 *   • Dashen Bank
 *   • Amole (Dashen digital wallet)
 *   • verify.leul.et fallback
 *
 * No static phone numbers or TINs — the backend resolves credentials from
 * per-company IntegrationSettings or environment variables.
 *
 * Usage:
 *   <PaymentVerificationPanel invoiceId="inv_xxx" expectedAmount={4500} />
 */

import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, Loader2, AlertCircle, ShieldCheck,
  Search, ChevronDown, RefreshCcw, Clock, BadgeCheck, Banknote,
} from 'lucide-react';
import api from '../../services/api';
import { fmtCurrency } from '../../utils/fmt';
import { useAuth } from '../../rbac/AuthContext';

// -- Types ---------------------------------------------------------------------

type PaymentNetwork =
  | 'CBE_BIRR'
  | 'TELEBIRR'
  | 'AWASH_BANK'
  | 'DASHEN_BANK'
  | 'AMOLE'
  | 'LEUL_FALLBACK';

interface VerificationResult {
  reference: string;
  network: PaymentNetwork;
  verified: boolean;
  confirmedAmount: number | null;
  paidAt: string | null;
  payer: string | null;
  receiver: string | null;
  amountMatches: boolean | null;
  source: 'live' | 'cache' | 'stub';
  warning?: string;
  verifiedAt: string;
}

// -- Network metadata ----------------------------------------------------------

const NETWORKS: {
  id: PaymentNetwork;
  label: string;
  color: string;
  bg: string;
  border: string;
  logo: string; // emoji stand-in; replace with real SVG if available
}[] = [
  { id: 'CBE_BIRR',     label: 'CBE Birr',     color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', logo: '🏦' },
  { id: 'TELEBIRR',     label: 'Telebirr',     color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',    logo: '📱' },
  { id: 'AWASH_BANK',   label: 'Awash Bank',   color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200',  logo: '🏛' },
  { id: 'DASHEN_BANK',  label: 'Dashen Bank',  color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',   logo: '🏛' },
  { id: 'AMOLE',        label: 'Amole',        color: 'text-rose-700',    bg: 'bg-rose-50',     border: 'border-rose-200',    logo: '💳' },
  { id: 'LEUL_FALLBACK',label: 'Leul Verify',  color: 'text-slate-700',   bg: 'bg-white',    border: 'border-slate-200',   logo: '🔍' },
];

// -- Sub-components ------------------------------------------------------------

const SourceBadge: React.FC<{ source: VerificationResult['source'] }> = ({ source }) => {
  const cfg = {
    live:    { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Live',    dot: 'bg-emerald-500' },
    cache:   { cls: 'bg-amber-100 text-amber-700 border-amber-200',       label: 'Cached',  dot: 'bg-amber-400'   },
    stub:    { cls: 'bg-slate-100 text-slate-600 border-slate-200',       label: 'Offline', dot: 'bg-slate-400'   },
  }[source];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${source === 'live' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
};

const AmountMatch: React.FC<{ matches: boolean | null; confirmed: number | null; expected?: number; currency: string }> =
  ({ matches, confirmed, expected, currency }) => {
    if (confirmed == null) return null;
    const fmt = (n: number) => fmtCurrency(n, currency);
    if (matches === true) {
      return (
        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
          <BadgeCheck size={13} /> Amount confirmed: {fmt(confirmed)}
        </div>
      );
    }
    if (matches === false) {
      return (
        <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold">
          <AlertCircle size={13} />
          Amount mismatch: received {fmt(confirmed)}, expected {fmt(expected ?? 0)}
        </div>
      );
    }
    return (
      <div className="ovds-caption">
        Confirmed: {fmt(confirmed)}
      </div>
    );
  };

// -- Main component -------------------------------------------------------------

interface Props {
  invoiceId?: string;
  expectedAmount?: number;
  currency?: string;
  /** If true, renders in a compact inline style (no card wrapper) */
  compact?: boolean;
  /** Called when a payment is successfully verified */
  onVerified?: (result: VerificationResult) => void;
}

const PaymentVerificationPanel: React.FC<Props> = ({
  invoiceId,
  expectedAmount,
  currency = 'ETB',
  compact = false,
  onVerified,
}) => {
  const { can } = useAuth();
  const [reference, setReference] = useState('');
  const [network, setNetwork] = useState<PaymentNetwork>('CBE_BIRR');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<VerificationResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const canVerify = can('ovds:write') || can('invoices:write');
  const selectedNet = NETWORKS.find(n => n.id === network)!;

  const handleVerify = async () => {
    if (!reference.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post('/ovds/payments/verify', {
        reference: reference.trim(),
        network,
        expectedAmount,
        invoiceId,
      });
      const data = (res.data?.data ?? res.data) as VerificationResult;
      setResult(data);
      setHistory(prev => [data, ...prev.slice(0, 9)]); // keep last 10
      if (data.verified && onVerified) onVerified(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
        err?.message ??
        'Verification request failed',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleVerify();
  };

  const fmt = (n: number) => fmtCurrency(n, currency);

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
          <ShieldCheck size={15} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="ovds-card-title leading-none">Payment Verification</h3>
          <p className="ovds-caption mt-0.5">Verify via official financial networks</p>
        </div>
        {expectedAmount != null && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600">
            <Banknote size={11} className="text-slate-400" />
            Expected: {fmt(expectedAmount)}
          </div>
        )}
      </div>

      {/* Network selector */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Payment Network
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {NETWORKS.map(net => (
            <button
              key={net.id}
              type="button"
              onClick={() => setNetwork(net.id)}
              className={[
                'flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 text-left transition-all duration-150',
                network === net.id
                  ? `${net.border} ${net.bg} shadow-sm`
                  : 'border-slate-200 bg-white hover:border-slate-300',
              ].join(' ')}
            >
              <span className="text-base leading-none">{net.logo}</span>
              <span className={`text-[11px] font-semibold truncate ${network === net.id ? net.color : 'text-slate-600'}`}>
                {net.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reference input */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
          Transaction / Reference Number
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${selectedNet.label} reference…`}
              disabled={!canVerify || loading}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder-slate-400/80 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 focus:bg-white transition-all disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={handleVerify}
            disabled={!canVerify || loading || !reference.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-200/60 active:translate-y-0"
            style={{ background: 'linear-gradient(135deg,#059669,#0d9488)' }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            Verify
          </button>
        </div>
        {!canVerify && (
          <p className="mt-1.5 text-[11px] text-amber-600 font-medium flex items-center gap-1">
            <AlertCircle size={10} /> Requires ovds:write permission
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 bg-rose-50 border border-rose-200 rounded-xl">
          <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700 font-medium">{error}</p>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className={[
          'rounded-2xl border overflow-hidden transition-all',
          result.verified
            ? 'border-emerald-200 bg-emerald-50/60'
            : result.source === 'stub'
            ? 'border-slate-200 bg-slate-50/60'
            : 'border-rose-200 bg-rose-50/60',
        ].join(' ')}>
          {/* Status stripe */}
          <div className={`h-1 w-full ${result.verified ? 'bg-emerald-500' : result.source === 'stub' ? 'bg-slate-300' : 'bg-rose-400'}`} />

          <div className="px-4 py-3.5 space-y-3">
            {/* Status row */}
            <div className="flex items-center gap-2.5">
              {result.verified ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <XCircle size={16} className="text-rose-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-extrabold leading-none ${result.verified ? 'text-emerald-800' : result.source === 'stub' ? 'text-slate-600' : 'text-rose-700'}`}>
                  {result.verified
                    ? 'Payment Verified'
                    : result.source === 'stub'
                    ? 'Network Not Configured'
                    : 'Payment Not Verified'}
                </p>
                <p className="ovds-caption mt-0.5 truncate">
                  ref: {result.reference}
                </p>
              </div>
              <SourceBadge source={result.source} />
            </div>

            {/* Amount match */}
            <AmountMatch
              matches={result.amountMatches}
              confirmed={result.confirmedAmount}
              expected={expectedAmount}
              currency={currency}
            />

            {/* Detail grid */}
            {(result.payer || result.paidAt || result.receiver) && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {result.payer && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payer</p>
                    <p className="text-[11px] font-semibold text-slate-700 truncate">{result.payer}</p>
                  </div>
                )}
                {result.receiver && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Receiver</p>
                    <p className="text-[11px] font-semibold text-slate-700 truncate">{result.receiver}</p>
                  </div>
                )}
                {result.paidAt && (
                  <div className="col-span-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Clock size={9} />
                    {new Date(result.paidAt).toLocaleString('en-ET', {
                      dateStyle: 'medium', timeStyle: 'short',
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Warning (stub/offline) */}
            {result.warning && (
              <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 leading-relaxed">{result.warning}</p>
              </div>
            )}

            {/* Verified-at footer */}
            <div className="flex items-center justify-between pt-1">
              <p className="ovds-caption">
                Checked {new Date(result.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <button
                type="button"
                onClick={handleVerify}
                className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <RefreshCcw size={9} /> Re-check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div>
          <button
            type="button"
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronDown
              size={12}
              className={`transition-transform ${showHistory ? 'rotate-180' : ''}`}
            />
            {history.length - 1} previous verification{history.length - 1 !== 1 ? 's' : ''}
          </button>

          {showHistory && (
            <div className="mt-2 space-y-1.5">
              {history.slice(1).map((h, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-100">
                  {h.verified
                    ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    : <XCircle size={12} className="text-slate-400 shrink-0" />}
                  <span className="text-[11px] text-slate-600 font-medium truncate flex-1">{h.reference}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {NETWORKS.find(n => n.id === h.network)?.label}
                  </span>
                  <SourceBadge source={h.source} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (compact) return content;

  return (
    <div className="ovds-widget-card p-5">
      {content}
    </div>
  );
};

export default PaymentVerificationPanel;

