/**
 * IotTaxPipelineTab — IoT ↔ Ethiopian Tax Workflow Pipeline UI
 *
 * Three-tier pipeline visualised in one tab:
 *   Edge Devices → OVDS AIS (VAT/TOT applied) → MoR e-Tax Portal
 *
 * Sections:
 *   1. Pipeline summary cards (tax by type, period picker)
 *   2. Fiscal event log (immutable SHA-256 signed records)
 *   3. TASS SRM registration & receipt validation
 *   4. Architecture info panel
 */
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../rbac/AuthContext';
import {
  useIotFiscalEvents,
  useIotTaxSummary,
  useApplyTaxToTrigger,
  useRegisterSrm,
  useValidateFiscalReceipt,
  type IotFiscalEvent,
  type IotTaxType,
  type IotIndustryContext,
} from '../../services/iotApi';
import { fmtDateTime, fmtCurrency } from '../../utils/fmt';
import {
  AppTable, AppTh, AppTd, AppTr,
  Btn, Icon, Modal, FormField, Input, Amount,
} from '../ui';


// ── Helpers ───────────────────────────────────────────────────────────────────

const TAX_TYPE_LABEL: Record<IotTaxType | string, string> = {
  VAT_15:          'VAT 15%',
  TOT_GOODS_2:     'TOT 2% (goods)',
  TOT_SERVICES_10: 'TOT 10% (services)',
  EXEMPT:          'Exempt',
};

const TAX_TYPE_COLOR: Record<IotTaxType | string, string> = {
  VAT_15:          'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  TOT_GOODS_2:     'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/40 dark:text-green-300',
  TOT_SERVICES_10: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  EXEMPT:          'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const INDUSTRY_ICON: Record<IotIndustryContext | string, string> = {
  SMART_VENDING_RETAIL: '🏪',
  LOGISTICS_FLEET:      '🚛',
  MANUFACTURING_AGRI:   '🏭',
  ENERGY_UTILITY:       '⚡',
  TELECOM_DIGITAL:      '📡',
  GENERAL:              '📦',
};

const INDUSTRY_LABEL: Record<IotIndustryContext | string, string> = {
  SMART_VENDING_RETAIL: 'Smart Vending / Retail',
  LOGISTICS_FLEET:      'Logistics & Fleet',
  MANUFACTURING_AGRI:   'Manufacturing / Agri',
  ENERGY_UTILITY:       'Energy & Utility',
  TELECOM_DIGITAL:      'Telecom / Digital',
  GENERAL:              'General',
};

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}


// ── Main Component ────────────────────────────────────────────────────────────

const IotTaxPipelineTab: React.FC = () => {
  const { can } = useAuth();
  const [period, setPeriod] = useState(currentPeriod);
  const [section, setSection] = useState<'fiscal' | 'srm' | 'info'>('fiscal');
  const [receiptNo, setReceiptNo] = useState('');
  const [showSrmModal, setShowSrmModal] = useState(false);
  const [srmForm, setSrmForm] = useState({
    deviceId: '', deviceSerialNo: '', deviceModel: '',
    businessAddress: '', businessName: '', tin: '',
  });

  const { data: fiscalEvents = [], isLoading: loadingFiscal, refetch } = useIotFiscalEvents(period);
  const { data: taxSummary = [] } = useIotTaxSummary(period);
  const applyTax = useApplyTaxToTrigger();
  const registerSrm = useRegisterSrm();
  const validateReceipt = useValidateFiscalReceipt();

  // Aggregate totals for the period header cards
  const totals = useMemo(() => ({
    events:   fiscalEvents.length,
    grossETB: fiscalEvents.reduce((s, e) => s + Number(e.grossAmount), 0),
    taxETB:   fiscalEvents.reduce((s, e) => s + Number(e.taxAmount), 0),
    netETB:   fiscalEvents.reduce((s, e) => s + Number(e.netPayable), 0),
  }), [fiscalEvents]);

  const handleRegisterSrm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srmForm.tin || srmForm.tin.replace(/\D/g, '').length !== 10) {
      return toast.error('TIN must be exactly 10 numeric digits');
    }
    try {
      const result = await registerSrm.mutateAsync(srmForm) as any;
      if (result.success) {
        toast.success(`SRM registered — TASS ID: ${result.tassDeviceId ?? 'stub'}`);
      } else {
        toast(result.warning ?? 'Registration returned stub mode (configure TASS_API_URL for live)', { icon: '⚠️' });
      }
      setShowSrmModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'SRM registration failed');
    }
  };

  const handleValidateReceipt = async () => {
    if (!receiptNo.trim()) return toast.error('Enter a receipt number');
    try {
      const result = await validateReceipt.mutateAsync(receiptNo.trim()) as any;
      if (result.valid) {
        toast.success(`Receipt valid — ${result.businessName ?? 'Unknown'} | VAT ETB ${(result.vatAmount ?? 0).toFixed(2)}`);
      } else {
        toast.error(`Receipt invalid: ${result.warning ?? 'Not found in TASS'}`);
      }
    } catch {
      toast.error('Receipt validation failed');
    }
  };

  return (
    <div className="space-y-5">

      {/* Pipeline diagram */}
      <div className="ovds-card p-4">
        <h3 className="ovds-card-title flex items-center gap-2 mb-3">
          <Icon name="ACTIVITY" size={14} className="text-[var(--pro-azure)]" />
          Three-Tier Data Pipeline — IoT → OVDS AIS → MoR e-Tax
        </h3>
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          {[
            { label: 'Edge Devices', sub: 'Sensors · PoS · GPS', color: 'bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-800 text-sky-700 dark:text-sky-300' },
            { arrow: true },
            { label: 'OVDS AIS', sub: 'VAT 15% / TOT 2%–10%', color: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] dark:bg-green-950/20 dark:border-green-800 text-[var(--pro-azure-dark)] dark:text-green-300' },
            { arrow: true },
            { label: 'MoR e-Tax Portal', sub: 'etax.mor.gov.et', color: 'bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800 text-violet-700 dark:text-violet-300' },
          ].map((item, i) =>
            'arrow' in item ? (
              <Icon key={i} name="CHEVRON_RIGHT" size={14} className="text-slate-400 shrink-0" />
            ) : (
              <div key={i} className={`px-3 py-2 rounded-lg border ${item.color} flex flex-col items-center min-w-[120px]`}>
                <span className="font-bold">{item.label}</span>
                <span className="opacity-70">{item.sub}</span>
              </div>
            )
          )}
          <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
            <Icon name="LOCK" size={11} />
            HTTPS / MQTT+TLS · Ethio Telecom 4G/5G
          </div>
        </div>
      </div>

      {/* Period selector + summary cards */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-slate-500">Period:</label>
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900"
          />
        </div>
        <Btn variant="ghost" size="sm" icon="REFRESH" onClick={() => refetch()}>Refresh</Btn>
      </div>


      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Fiscal Events', value: totals.events, color: 'text-slate-800 dark:text-slate-100' },
          { label: 'Gross Revenue (ETB)', value: fmtCurrency(totals.grossETB, 'ETB'), color: 'text-slate-800 dark:text-slate-100' },
          { label: 'Tax Collected (ETB)', value: fmtCurrency(totals.taxETB, 'ETB'), color: 'text-[var(--pro-azure)]' },
          { label: 'Net Payable (ETB)',   value: fmtCurrency(totals.netETB, 'ETB'),  color: 'text-[var(--pro-azure)]' },
        ].map(c => (
          <div key={c.label} className="ovds-card p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{c.label}</p>
            <p className={`text-[18px] font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tax breakdown by type (from summary endpoint) */}
      {taxSummary.length > 0 && (
        <div className="ovds-card p-4">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            Tax Breakdown — Period {period}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {taxSummary.map(row => (
              <div key={row.taxType} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800/50">
                <div className="flex-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TAX_TYPE_COLOR[row.taxType] ?? TAX_TYPE_COLOR.EXEMPT}`}>
                    {TAX_TYPE_LABEL[row.taxType] ?? row.taxType}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{row.eventCount} event{row.eventCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-bold text-[var(--pro-azure)]">{fmtCurrency(row.totalTax, 'ETB')}</p>
                  <p className="text-[10px] text-slate-400">on {fmtCurrency(row.totalGross, 'ETB')}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
            <Icon name="INFO" size={11} />
            Tax collected feeds directly into the VAT output ledger for MoR period-end filing.
          </p>
        </div>
      )}

      {/* Sub-section tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {([
          ['fiscal', 'Fiscal Events', 'SHIELD'],
          ['srm',    'SRM / TASS',    'MONITOR'],
          ['info',   'Architecture',  'INFO'],
        ] as const).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={[
              'flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold border-b-2 -mb-px transition-colors',
              section === key
                ? 'border-[var(--pro-azure)] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
                : 'border-transparent text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            <Icon name={icon} size={12} />
            {label}
          </button>
        ))}
      </div>


      {/* ── Section: Fiscal Events ─────────────────────────────────────────── */}
      {section === 'fiscal' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="SHIELD" size={13} className="text-[var(--pro-azure)]" />
            <p className="text-[11px] text-slate-500">
              Immutable records — each has a SHA-256 fiscal signature that prevents backdating.
              Required by MoR for IoT-sourced transactions.
            </p>
          </div>

          <AppTable
            loading={loadingFiscal}
           
           
           
           
          >
            <thead>
              <tr>
                <AppTh>Time (UTC)</AppTh>
                <AppTh>Device</AppTh>
                <AppTh>Industry</AppTh>
                <AppTh>Gross (ETB)</AppTh>
                <AppTh>Tax Type</AppTh>
                <AppTh>Tax (ETB)</AppTh>
                <AppTh>Net Payable</AppTh>
                <AppTh>Signature</AppTh>
                {can('iot:write') && <AppTh>Action</AppTh>}
              </tr>
            </thead>
            <tbody>
              {fiscalEvents.map((ev: IotFiscalEvent) => (
                <AppTr key={ev.id}>
                  <AppTd>
                    <span className="text-[11px] font-mono text-slate-500">{fmtDateTime(ev.recordedAt)}</span>
                  </AppTd>
                  <AppTd>
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      {ev.deviceId.slice(-8).toUpperCase()}
                    </span>
                  </AppTd>
                  <AppTd>
                    <span className="text-[12px]" title={INDUSTRY_LABEL[ev.industryContext]}>
                      {INDUSTRY_ICON[ev.industryContext] ?? '📦'}{' '}
                      <span className="text-[10px] text-slate-500">{INDUSTRY_LABEL[ev.industryContext] ?? ev.industryContext}</span>
                    </span>
                  </AppTd>
                  <AppTd>
                    <Amount value={ev.grossAmount} currency="ETB" />
                  </AppTd>
                  <AppTd>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TAX_TYPE_COLOR[ev.taxType] ?? TAX_TYPE_COLOR.EXEMPT}`}>
                      {TAX_TYPE_LABEL[ev.taxType] ?? ev.taxType}
                    </span>
                  </AppTd>
                  <AppTd>
                    <Amount value={ev.taxAmount} currency="ETB" />
                  </AppTd>
                  <AppTd>
                    <Amount value={ev.netPayable} currency="ETB" />
                  </AppTd>
                  <AppTd>
                    <span
                      className="text-[9px] font-mono text-slate-400 cursor-help"
                      title={ev.fiscalSignature}
                    >
                      {ev.fiscalSignature.slice(0, 22)}…
                    </span>
                  </AppTd>
                  {can('iot:write') && (
                    <AppTd>
                      <button
                        onClick={() =>
                          applyTax.mutate(ev.billingTriggerId, {
                            onSuccess: () => { toast.success('Tax re-applied'); refetch(); },
                            onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
                          })
                        }
                        className="text-[10px] font-bold text-[var(--pro-azure)] hover:underline"
                        title="Re-apply tax to this trigger"
                      >
                        Re-apply
                      </button>
                    </AppTd>
                  )}
                </AppTr>
              ))}
            </tbody>
          </AppTable>
        </div>
      )}


      {/* ── Section: SRM / TASS ───────────────────────────────────────────── */}
      {section === 'srm' && (
        <div className="space-y-4">
          {/* SRM registration requirement callout */}
          <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <Icon name="WARNING" size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[12px]">
              <p className="font-semibold text-amber-800 dark:text-amber-300">MoR SRM Registration Required</p>
              <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                Any IoT device capturing sales transactions must be registered as a Sales Register Machine (SRM)
                with TASS (<span className="font-mono">tass.mor.gov.et</span>). Penalty for unregistered devices:
                <strong> ETB 50,000</strong> (Tax Administration Proclamation s.26.1).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Register SRM card */}
            <div className="ovds-card p-4 space-y-3">
              <h4 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Icon name="MONITOR" size={13} className="text-[var(--pro-azure)]" />
                Register Device as SRM
              </h4>
              <p className="text-[11px] text-slate-500">
                Registers the IoT device with MoR TASS. After successful registration, affix the
                assigned TASS Device ID sticker to a visible part of the device.
              </p>
              {can('iot:write') && (
                <Btn variant="primary" size="sm" icon="PLUS" onClick={() => setShowSrmModal(true)}>
                  Register SRM with TASS
                </Btn>
              )}
            </div>

            {/* Validate fiscal receipt card */}
            <div className="ovds-card p-4 space-y-3">
              <h4 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Icon name="RECEIPT" size={13} className="text-[var(--pro-azure)]" />
                Validate ERCA Fiscal Receipt
              </h4>
              <p className="text-[11px] text-slate-500">
                Validate a vendor's fiscal receipt via TASS before crediting input VAT in your VAT
                reconciliation.
              </p>
              <div className="flex gap-2">
                <Input
                  value={receiptNo}
                  onChange={e => setReceiptNo(e.target.value)}
                  placeholder="Fiscal receipt number"
                  className="text-[12px] flex-1"
                />
                <Btn
                  variant="secondary"
                  size="sm"
                  loading={validateReceipt.isPending}
                  onClick={handleValidateReceipt}
                >
                  Validate
                </Btn>
              </div>
              {(validateReceipt.data as any) && (() => {
                const d = validateReceipt.data as any;
                return (
                <div className={`p-3 rounded-lg text-[11px] ${
                  d.valid
                    ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800'
                    : 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800'
                }`}>
                  {d.valid ? (
                    <div className="space-y-0.5 text-[var(--pro-azure-dark)] dark:text-green-300">
                      <p><strong>Valid</strong> · {d.businessName}</p>
                      <p>TIN: <span className="font-mono">{d.tin}</span></p>
                      <p>Total: ETB {(d.totalAmount ?? 0).toFixed(2)} · VAT: ETB {(d.vatAmount ?? 0).toFixed(2)}</p>
                      <p className="opacity-70 font-mono text-[9px]">{d.fiscalSignature?.slice(0, 30)}…</p>
                    </div>
                  ) : (
                    <p className="text-rose-700 dark:text-rose-300">
                      <strong>Invalid</strong> · {d.warning ?? 'Not found in TASS'}
                    </p>
                  )}
                </div>
                );
              })()}
            </div>
          </div>

          {/* MoR portal links */}
          <div className="ovds-card p-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">MoR Government Portals</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: 'MoR e-Tax Portal', url: 'https://etax.mor.gov.et', desc: 'VAT, PAYE, BIT declarations & payments' },
                { label: 'TASS', url: 'https://tass.mor.gov.et', desc: 'SRM registration, vehicle verification' },
                { label: 'Customs Trade Portal', url: 'https://ects.mor.gov.et', desc: 'e-SADs, e-Manifests, tariff lookup' },
                { label: 'Ethiopian Customs Commission', url: 'https://customs.gov.et', desc: 'Import/export procedures' },
              ].map(p => (
                <a
                  key={p.url}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-3 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <Icon name="EXTERNAL_LINK" size={12} className="text-slate-400 group-hover:text-[var(--pro-azure)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-[var(--pro-azure)]">{p.label}</p>
                    <p className="text-[10px] text-slate-400">{p.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ── Section: Architecture info ────────────────────────────────────── */}
      {section === 'info' && (
        <div className="space-y-4">
          {/* Industry examples */}
          <div className="ovds-card p-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Industry Use-Cases</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: '🏪', title: 'Smart Vending & Retail',
                  metrics: ['SALE_AMOUNT_ETB', 'ITEM_SCANNED', 'VEND_QUANTITY'],
                  tax: 'VAT 15% or TOT 2% (goods)',
                  note: 'Kiosk / telebirr / CBE Birr → auto-posted to VAT output ledger',
                },
                {
                  icon: '🚛', title: 'Logistics & Fleet',
                  metrics: ['FUEL_LITRES', 'FUEL_CONSUMED', 'GPS_DISTANCE_KM'],
                  tax: 'Fuel cost → BIT deductible',
                  note: 'Proc. 979/2016 s.22 — allowable operational expense deduction',
                },
                {
                  icon: '🏭', title: 'Manufacturing & Agriculture',
                  metrics: ['WEIGHT_KG', 'RAW_MATERIAL_KG', 'YIELD_KG'],
                  tax: 'COGS → corporate BIT deduction',
                  note: 'IAS 2 valuation — deductible cost of goods sold',
                },
              ].map(ind => (
                <div key={ind.title} className="p-3 rounded-xl bg-white dark:bg-slate-800/50 space-y-2">
                  <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{ind.icon} {ind.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {ind.metrics.map(m => (
                      <span key={m} className="text-[9px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] font-semibold text-[var(--pro-azure)]">{ind.tax}</p>
                  <p className="text-[10px] text-slate-400">{ind.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Legal compliance table */}
          <div className="ovds-card p-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Legal & Compliance Requirements
            </h4>
            <div className="space-y-2">
              {[
                { req: 'MoR Certification', impl: 'OVDS is the certified AIS; IoT devices are edge sensors only — data never sent directly to MoR' },
                { req: 'Fiscal Timestamps', impl: 'iot_fiscal_event.recordedAt set server-side (UTC); SHA-256 signature prevents backdating' },
                { req: 'Data Privacy', impl: 'HTTPS + TLS enforced; Ethio Telecom 4G/5G transport encryption for field devices' },
                { req: 'SRM Registration', impl: 'All sales-capturing IoT devices registered via TASS (tass.mor.gov.et)' },
                { req: 'VAT (Proc. 1341/2024)', impl: '15% applied to companies with annual turnover ≥ ETB 2,000,000' },
                { req: 'TOT (Proc. 1395/2025)', impl: '2% on goods / 10% on services for turnover < ETB 2M threshold' },
                { req: 'Fiscal Receipt Validation', impl: 'TASS receipt check before crediting input VAT on vendor IoT invoices' },
              ].map(row => (
                <div key={row.req} className="flex gap-3 text-[11px] py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 w-44 shrink-0">{row.req}</span>
                  <span className="text-slate-500">{row.impl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Environment variable reference */}
          <div className="ovds-card p-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Required Environment Variables
            </h4>
            <div className="bg-slate-900 rounded-lg p-3 font-mono text-[10px] text-slate-300 space-y-1 overflow-x-auto">
              {[
                ['ETAX_MODE', 'stub | sandbox | live'],
                ['ETAX_API_KEY', '# from etax.mor.gov.et'],
                ['COMPANY_TIN', '# 10-digit MoR TIN'],
                ['TASS_API_URL', 'https://api.tass.mor.gov.et'],
                ['TASS_API_KEY', '# from MoR TASS portal'],
                ['FUEL_PRICE_ETB_PER_LITRE', '38.50'],
                ['RAW_MATERIAL_COST_ETB', '0  # per-unit COGS cost'],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-[var(--pro-azure-light)]">{k}</span>
                  <span className="text-slate-500">=</span>
                  <span className="text-amber-300">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ── SRM Registration Modal ────────────────────────────────────────── */}
      {showSrmModal && (
        <Modal
          open
          title="Register IoT Device as TASS SRM"
          onClose={() => setShowSrmModal(false)}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setShowSrmModal(false)}>Cancel</Btn>
              <Btn
                variant="primary"
                loading={registerSrm.isPending}
                onClick={handleRegisterSrm}
              >
                Register with TASS
              </Btn>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-300">
              After registration, affix the TASS Device ID sticker to a visible part of the device.
              Penalty for unregistered SRMs: <strong>ETB 50,000</strong>.
            </div>
            <form onSubmit={handleRegisterSrm}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { field: 'deviceSerialNo',  label: 'Device Serial Number *', placeholder: 'SN-123456' },
                  { field: 'deviceModel',     label: 'Device Model *',         placeholder: 'EPSON TM-T88VI' },
                  { field: 'tin',             label: 'Business TIN (10 digits) *', placeholder: '1234567890' },
                  { field: 'businessName',    label: 'Business Name *',        placeholder: 'As registered with MoR' },
                  { field: 'businessAddress', label: 'Business Address *',     placeholder: 'Addis Ababa, Kirkos Sub-City' },
                  { field: 'deviceId',        label: 'OVDS Device ID',         placeholder: 'Optional — link to registered device' },
                ].map(({ field, label, placeholder }) => (
                  <FormField key={field} label={label}>
                    <Input
                      value={srmForm[field as keyof typeof srmForm]}
                      onChange={e => setSrmForm(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder={placeholder}
                    />
                  </FormField>
                ))}
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default IotTaxPipelineTab;
