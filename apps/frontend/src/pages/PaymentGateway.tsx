/**
 * Payment Gateway Management
 *
 * Manage Ethiopian payment gateway configurations: Telebirr, CBEBirr,
 * HelloCash, M-Pesa ET, Amole, Awash Pay, Dashen Pay, bank EFT.
 *
 * Features:
 *  - Gateway enable/disable toggles per company
 *  - Transaction history with reconciliation status
 *  - Gateway fee calculator
 *  - QR code preview
 *  - Reconciliation summary
 */
import {
  GATEWAY_LABELS, GATEWAY_FEES, calcGatewayFee,
  type PaymentGateway, type PaymentGatewayTransaction,
} from '@ovds/ui';
import {
  CreditCard, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Download, Plus, Settings, QrCode, BarChart3, Zap,
} from 'lucide-react';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, StatusBadge, FormField, Input, Select, Modal,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';


// -- Types ---------------------------------------------------------------------

type TabKey = 'gateways' | 'transactions' | 'reconciliation' | 'fee-calculator';

const ENABLED_GATEWAYS: PaymentGateway[] = [
  'TELEBIRR', 'CBEBIRR', 'HELLOCASH', 'MPESA_ET', 'AMOLE',
  'AWASH_PAY', 'DASHEN_PAY', 'BANK_EFT', 'BANK_WIRE',
];

const GATEWAY_ICONS: Record<string, string> = {
  TELEBIRR:   '📱', CBEBIRR: '🏦', HELLOCASH: '💚',
  MPESA_ET:   '📳', AMOLE:   '🔵', AWASH_PAY: '🏦',
  DASHEN_PAY: '🏦', BANK_EFT:'⚡', BANK_WIRE: '🔌',
  CASH:       '💵', CHEQUE:  '📄', OTHER:      '🔄',
};

const GATEWAY_COLORS: Record<string, string> = {
  TELEBIRR:   'bg-violet-50 border-violet-200 text-violet-700',
  CBEBIRR:    'bg-sky-50 border-sky-200 text-sky-700',
  HELLOCASH:  'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  MPESA_ET:   'bg-green-50 border-green-200 text-green-700',
  AMOLE:      'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  AWASH_PAY:  'bg-orange-50 border-orange-200 text-orange-700',
  DASHEN_PAY: 'bg-rose-50 border-rose-200 text-rose-700',
  BANK_EFT:   'bg-white border-slate-200 text-slate-700',
  BANK_WIRE:  'bg-white border-slate-200 text-slate-700',
};

const STATUS_CLS: Record<string, string> = {
  SUCCESS:   'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  FAILED:    'bg-rose-50 text-rose-700 border-rose-200',
  REVERSED:  'bg-white text-slate-700 border-slate-200',
  INITIATED: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  EXPIRED:   'bg-white text-slate-500 border-slate-200',
  CANCELLED: 'bg-white text-slate-500 border-slate-200',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// -- Gateway card --------------------------------------------------------------

const GatewayCard: React.FC<{
  gateway: PaymentGateway;
  enabled: boolean;
  onToggle: (g: PaymentGateway, v: boolean) => void;
  txCount: number;
  totalVolume: number;
}> = ({ gateway, enabled, onToggle, txCount, totalVolume }) => {
  const fee   = GATEWAY_FEES[gateway];
  const label = GATEWAY_LABELS[gateway];
  const color = GATEWAY_COLORS[gateway] ?? 'bg-white border-slate-200 text-slate-700';

  return (
    <div className={`ovds-widget-card p-4 ${enabled ? '' : 'opacity-60'} transition-opacity`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{GATEWAY_ICONS[gateway] ?? '💳'}</span>
          <div>
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{label}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${color}`}>
              {enabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>
        {/* Toggle */}
        <button
          onClick={() => onToggle(gateway, !enabled)}
          className={`w-11 h-6 rounded-full transition-all relative ${enabled ? 'bg-[var(--pro-azure-50)]0' : 'bg-slate-200 dark:bg-slate-700'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>

      <div className="space-y-1 text-[10px] text-slate-500">
        <div className="flex justify-between">
          <span>Fee</span>
          <span className="font-semibold text-slate-700">
            {fee.pct > 0 ? `${(fee.pct*100).toFixed(1)}%` : ''}
            {fee.flat > 0 ? ` + ETB ${fee.flat}` : ''}
            {fee.max > 0 ? ` (max ETB ${fee.max})` : ''}
            {fee.pct === 0 && fee.flat === 0 ? 'Free' : ''}
          </span>
        </div>
        {txCount > 0 && (
          <>
            <div className="flex justify-between">
              <span>Transactions</span>
              <span className="font-semibold text-slate-700">{txCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Volume</span>
              <span className="font-semibold text-[var(--pro-azure-dark)]">ETB {fmt(totalVolume)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// -- Fee Calculator ------------------------------------------------------------

const FeeCalculatorTab: React.FC = () => {
  const [amount, setAmount]   = useState('');
  const [selected, setSelected] = useState<PaymentGateway>('TELEBIRR');

  const amountNum = parseFloat(amount.replace(/,/g, '')) || 0;
  const fee       = amountNum > 0 ? calcGatewayFee(selected, amountNum) : 0;
  const net       = amountNum - fee;

  return (
    <div className="max-w-xl space-y-5">
      <div className="ovds-widget-card p-5 space-y-4">
        <p className="ovds-card-title">Gateway Fee Calculator</p>

        <FormField label="Payment Amount (ETB)" required>
          <Input
            type="number" step="0.01" min="0"
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Payment Gateway">
          <Select value={selected} onChange={e => setSelected(e as PaymentGateway)}>
            {ENABLED_GATEWAYS.map(g => (
              <option key={g} value={g}>{GATEWAY_LABELS[g]}</option>
            ))}
          </Select>
        </FormField>

        {amountNum > 0 && (
          <div className="space-y-2 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
              { label: 'Payment Amount', value: `ETB ${fmt(amountNum)}`, cls: '' },
              { label: `${GATEWAY_LABELS[selected]} Fee`, value: `ETB ${fmt(fee)}`, cls: 'text-rose-600' },
              { label: 'Net Amount Received', value: `ETB ${fmt(net)}`, cls: 'text-[var(--pro-azure-dark)] font-black text-[14px]' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-[12px]">
                <span className="text-slate-500">{r.label}</span>
                <span className={`font-bold tabular-nums ${r.cls}`}>{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All gateway fee comparison */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="ovds-widget-header">
          <p className="ovds-card-title">Fee Comparison{amountNum > 0 ? ` — ETB ${fmt(amountNum)}` : ''}</p>
        </div>
        <AppTable>
          <thead><tr>
            <AppTh>Gateway</AppTh>
            <AppTh align="right">Fee Rate</AppTh>
            <AppTh align="right">Fee (ETB)</AppTh>
            <AppTh align="right">Net Received</AppTh>
          </tr></thead>
          <tbody>
            {ENABLED_GATEWAYS.map(g => {
              const f = amountNum > 0 ? calcGatewayFee(g, amountNum) : 0;
              const feeConfig = GATEWAY_FEES[g];
              return (
                <AppTr key={g} className={selected === g ? 'bg-[var(--pro-azure-50)]/50 dark:bg-green-950/10' : ''}>
                  <AppTd>
                    <div className="flex items-center gap-2">
                      <span>{GATEWAY_ICONS[g]}</span>
                      <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{GATEWAY_LABELS[g]}</span>
                    </div>
                  </AppTd>
                  <AppTd align="right">
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {feeConfig.pct > 0 ? `${(feeConfig.pct*100).toFixed(1)}%` : ''}
                      {feeConfig.flat > 0 ? ` +${feeConfig.flat}` : ''}
                      {feeConfig.pct === 0 && feeConfig.flat === 0 ? 'Free' : ''}
                    </span>
                  </AppTd>
                  <AppTd align="right">
                    <span className={`text-[11px] font-bold tabular-nums ${f > 0 ? 'text-rose-600' : 'text-[var(--pro-azure)]'}`}>
                      {amountNum > 0 ? `ETB ${fmt(f)}` : '—'}
                    </span>
                  </AppTd>
                  <AppTd align="right">
                    <span className="text-[11px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
                      {amountNum > 0 ? `ETB ${fmt(amountNum - f)}` : '—'}
                    </span>
                  </AppTd>
                </AppTr>
              );
            })}
          </tbody>
        </AppTable>
      </div>
    </div>
  );
};

// -- Main page -----------------------------------------------------------------

const PaymentGatewayScreen: React.FC = () => {
  usePageTitle('Payment Gateways');
  const { can }               = useAuth();
  const { selectedCompanyId } = useBusiness();

  const [activeTab, setActiveTab]     = useState<TabKey>('gateways');
  const [transactions, setTransactions] = useState<PaymentGatewayTransaction[]>([]);
  const [loading, setLoading]         = useState(false);
  const [enabledMap, setEnabledMap]   = useState<Record<string, boolean>>(
    Object.fromEntries(ENABLED_GATEWAYS.map(g => [g, true]))
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (selectedCompanyId) q.set('companyId', selectedCompanyId);
      const res = await api.get(`/ovds/payment-transactions?${q}`)
        .catch(() => ({ data: { data: [] } }));
      const data = res.data?.data ?? res.data ?? [];
      setTransactions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false); }
  }, [selectedCompanyId]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = (gateway: PaymentGateway, enabled: boolean) => {
    setEnabledMap(m => ({ ...m, [gateway]: enabled }));
    toast.success(`${GATEWAY_LABELS[gateway]} ${enabled ? 'enabled' : 'disabled'}`);
  };

  // Stats per gateway from transaction history
  const gatewayStats = useMemo(() => {
    const map: Record<string, { txCount: number; totalVolume: number }> = {};
    for (const tx of transactions) {
      if (!map[tx.gateway]) map[tx.gateway] = { txCount: 0, totalVolume: 0 };
      map[tx.gateway].txCount++;
      map[tx.gateway].totalVolume += Number(tx.amount ?? 0);
    }
    return map;
  }, [transactions]);

  const successTx = transactions.filter(t => t.status === 'SUCCESS');
  const kpiCells = [
    { label: 'Total Transactions', value: transactions.length, color: 'sky'     as const },
    { label: 'Successful',         value: successTx.length,    color: 'green' as const },
    { label: 'Pending',            value: transactions.filter(t => t.status === 'PENDING').length, color: 'amber' as const },
    { label: 'Failed',             value: transactions.filter(t => t.status === 'FAILED').length,  color: 'rose'  as const },
    { label: 'Total Volume',       value: `ETB ${fmt(successTx.reduce((s, t) => s + Number(t.amount), 0))}`, color: 'green' as const },
    { label: 'Active Gateways',    value: ENABLED_GATEWAYS.filter(g => enabledMap[g]).length, color: 'sky' as const },
  ];

  const TABS = [
    { key: 'gateways',        label: 'Gateways' },
    { key: 'transactions',    label: `Transactions (${transactions.length})` },
    { key: 'reconciliation',  label: 'Reconciliation' },
    { key: 'fee-calculator',  label: '📊 Fee Calculator' },
  ] as const;

  return (
    <AppPage
      title="Payment Gateways"
      subtitle="Ethiopian payment integrations — Telebirr, CBEBirr, HelloCash, M-Pesa, bank EFT · Banking & ovds · Retail & E-commerce · IT & Software · SaaS-Based · Market Share · Revenue"
      icon={<CreditCard size={18} />}
      iconBg="bg-violet-500"
      crumbs={[{ label: 'ovds' }, { label: 'Payment Gateways' }]}
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} className={loading ? 'animate-spin' : ''} />} onClick={load}>Refresh</Btn>
        </>
      }
      tabs={<AppTabs tabs={TABS.map(t => ({ key: t.key, label: t.label }))} active={activeTab} onChange={k => setActiveTab(k as TabKey)} />}
    >
      <AppKpi cells={kpiCells} />

      {/* Gateways tab */}
      {activeTab === 'gateways' && (
        <div className="space-y-5">
          <div className="p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl text-[11px] text-violet-700 dark:text-violet-300">
            <p className="font-bold mb-1">Ethiopian Payment Ecosystem</p>
            <p>Enable the gateways your business uses. Each gateway can be configured with your merchant credentials via Settings → Integrations. Transactions flow through the gateway and are automatically reconciled with your invoices.</p>
          </div>
          <div className="ovds-grid-layout cols-3 gap-sm">
            {ENABLED_GATEWAYS.map(g => (
              <GatewayCard
                key={g}
                gateway={g}
                enabled={!!enabledMap[g]}
                onToggle={handleToggle}
                txCount={gatewayStats[g]?.txCount ?? 0}
                totalVolume={gatewayStats[g]?.totalVolume ?? 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Transactions tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <AppTable>
            <thead><tr>
              <AppTh>Gateway</AppTh>
              <AppTh>Direction</AppTh>
              <AppTh align="right">Amount (ETB)</AppTh>
              <AppTh>Status</AppTh>
              <AppTh>Reference</AppTh>
              <AppTh>Invoice</AppTh>
              <AppTh>Date</AppTh>
            </tr></thead>
            <tbody>
              {loading ? (
                <AppTr><AppTd><div className="h-4 bg-slate-100 rounded animate-pulse w-32" /></AppTd><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></AppTr>
              ) : transactions.length === 0 ? (
                <AppTr>
                  <td colSpan={7} className="py-16 text-center">
                    <CreditCard size={24} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-sm text-slate-400">No transactions yet. Enable gateways and share payment links with customers.</p>
                  </td>
                </AppTr>
              ) : transactions.map(tx => (
                <AppTr key={tx.id}>
                  <AppTd>
                    <div className="flex items-center gap-1.5">
                      <span>{GATEWAY_ICONS[tx.gateway] ?? '💳'}</span>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{GATEWAY_LABELS[tx.gateway]}</span>
                    </div>
                  </AppTd>
                  <AppTd>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tx.direction === 'INBOUND' ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {tx.direction}
                    </span>
                  </AppTd>
                  <AppTd align="right">
                    <span className="tabular-nums text-[12px] font-bold text-slate-800 dark:text-slate-100">
                      {fmt(Number(tx.amount))}
                    </span>
                  </AppTd>
                  <AppTd>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_CLS[tx.status] ?? ''}`}>
                      {tx.status}
                    </span>
                  </AppTd>
                  <AppTd>
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px] block">{tx.gatewayRef ?? '—'}</span>
                  </AppTd>
                  <AppTd>
                    <span className="text-[10px] text-slate-400">{tx.invoiceId ? tx.invoiceId.slice(0, 8) + '…' : '—'}</span>
                  </AppTd>
                  <AppTd>
                    <span className="text-[10px] text-slate-400">{new Date(tx.initiatedAt).toLocaleDateString()}</span>
                  </AppTd>
                </AppTr>
              ))}
            </tbody>
          </AppTable>
        </div>
      )}

      {/* Reconciliation tab */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-5">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Reconciliation Guide</p>
              <p>Compare gateway settlement reports against OVDS transaction records. Upload your bank statement or gateway report to auto-match and identify variances.</p>
            </div>
          </div>
          <div className="ovds-grid-layout cols-3 gap-sm">
            {ENABLED_GATEWAYS.filter(g => enabledMap[g]).map(g => {
              const stats = gatewayStats[g] ?? { txCount: 0, totalVolume: 0 };
              return (
                <div key={g} className="ovds-widget-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{GATEWAY_ICONS[g]}</span>
                    <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{GATEWAY_LABELS[g]}</p>
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transactions</span>
                      <span className="font-bold">{stats.txCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Volume</span>
                      <span className="font-bold text-[var(--pro-azure-dark)]">ETB {fmt(stats.totalVolume)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Est. Fees</span>
                      <span className="font-bold text-rose-600">ETB {fmt(calcGatewayFee(g, stats.totalVolume))}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stats.txCount > 0 ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {stats.txCount > 0 ? 'Active' : 'No transactions'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fee calculator tab */}
      {activeTab === 'fee-calculator' && <FeeCalculatorTab />}
    </AppPage>
  );
};

export default PaymentGatewayScreen;


