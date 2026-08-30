/**
 * Supply Chain — Import / Export Pipeline
 * Covers: Shipments, Pipeline Steps, Forex, Proformas, Licenses
 * Portal integrations: ESLSE · Ethiopian Airlines Cargo · Cheche · EBP · verify.leul.et
 * Renamed from "Trade" — consolidates all supply chain operations in one module.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Ship, Plane, FileText, RefreshCw, Plus, Search,
  CheckCircle2, Clock, AlertTriangle,
  Globe, Building2, ShieldCheck, Package, Loader2,
  ExternalLink, Info, X, ChevronDown, ChevronUp,
  Anchor,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, SearchBar, EmptyState, Modal, FormField, Input, Select,
  Textarea, Amount,
} from '../components/ui';
import {
  shipmentsApi, stepsApi, tradeDashboardApi, portalsApi,
  type TradeShipment, type TradeShipmentStep, type CreateShipmentDto,
  type EslseResult, type EalCargoResult, type ChequePermitResult,
  type EbpResult, type LeulVerifyResult,
} from '../services/tradeApi';

// -- Helpers -------------------------------------------------------------------

const STEP_STATUS_CLS: Record<string, string> = {
  COMPLETED:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-sky-50 text-sky-700 border-sky-200',
  BLOCKED:     'bg-rose-50 text-rose-700 border-rose-200',
  PENDING:     'bg-white text-slate-500 border-slate-200',
};

const STEP_STATUS_ICON: Record<string, React.ReactNode> = {
  COMPLETED:   <CheckCircle2 size={11} className="text-emerald-500" />,
  IN_PROGRESS: <Clock size={11} className="text-sky-500" />,
  BLOCKED:     <AlertTriangle size={11} className="text-rose-500" />,
  PENDING:     <Clock size={11} className="text-slate-300" />,
};

const SOURCE_CLS: Record<string, string> = {
  live:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  cache: 'bg-sky-50 text-sky-700 border-sky-200',
  stub:  'bg-amber-50 text-amber-700 border-amber-200',
};

function SourceBadge({ source }: { source: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${SOURCE_CLS[source] ?? SOURCE_CLS.stub}`}>
      {source === 'live' ? '● LIVE' : source === 'cache' ? '◎ CACHED' : '○ STUB'}
    </span>
  );
}

function PortalWarning({ warning }: { warning?: string }) {
  if (!warning) return null;
  return (
    <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-[11px] text-amber-700 mt-2">
      <Info size={12} className="shrink-0 mt-0.5 text-amber-500" />
      <span>{warning}</span>
    </div>
  );
}

type MainTab = 'dashboard' | 'shipments' | 'portals';
type PortalTab = 'eslse' | 'eal' | 'cheche' | 'ebp' | 'leul';

// -- Portal panels -------------------------------------------------------------

function EslsePanel() {
  const [blNumber, setBlNumber] = useState('');
  const [result, setResult] = useState<EslseResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = useCallback(async (force = false) => {
    if (!blNumber.trim()) return;
    setLoading(true);
    try {
      const data = await portalsApi.eslse(blNumber.trim(), force);
      setResult(data);
    } catch {
      toast.error('Failed to fetch ESLSE tracking data');
    } finally {
      setLoading(false);
    }
  }, [blNumber]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
        <Anchor size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-blue-800">ESLSE Sea-Freight Tracking</p>
          <p className="text-[11px] text-blue-600 mt-0.5">
            Track shipments via Ethiopian Shipping and Logistics Services Enterprise (eslse.et).
            Enter your Bill of Lading number below.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={blNumber}
          onChange={e => setBlNumber(e.target.value)}
          placeholder="Bill of Lading number — e.g. ESLSE2024001234"
          className="flex-1 text-sm"
          onKeyDown={e => e.key === 'Enter' && handleTrack()}
        />
        <Btn variant="primary" size="sm" onClick={() => handleTrack()} disabled={loading || !blNumber.trim()}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
          Track
        </Btn>
        {result && (
          <Btn variant="ghost" size="sm" onClick={() => handleTrack(true)} disabled={loading}>
            <RefreshCw size={11} /> Force Refresh
          </Btn>
        )}
      </div>

      {result && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Ship size={13} className="text-slate-500" />
              <span className="text-[12px] font-semibold text-slate-700">{result.blNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <SourceBadge source={result.source} />
              {result.status && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {result.status}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100">
            {[
              { label: 'Vessel', value: result.vessel },
              { label: 'ETA', value: result.eta },
              { label: 'Port of Loading', value: result.portOfLoading },
              { label: 'Port of Discharge', value: result.portOfDischarge },
              { label: 'Containers', value: result.containerCount?.toString() },
              { label: 'Last Event', value: result.lastEvent },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white px-4 py-2.5">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-[12px] text-slate-700 mt-0.5">{value ?? <span className="text-slate-300">—</span>}</p>
              </div>
            ))}
          </div>
          <PortalWarning warning={result.warning} />
        </div>
      )}
    </div>
  );
}

function EalCargoPanel() {
  const [awbNumber, setAwbNumber] = useState('');
  const [result, setResult] = useState<EalCargoResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = useCallback(async (force = false) => {
    if (!awbNumber.trim()) return;
    setLoading(true);
    try {
      const data = await portalsApi.ealCargo(awbNumber.trim(), force);
      setResult(data);
    } catch {
      toast.error('Failed to fetch EAL Cargo tracking data');
    } finally {
      setLoading(false);
    }
  }, [awbNumber]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-100 rounded-xl">
        <Plane size={16} className="text-sky-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-sky-800">Ethiopian Airlines Cargo Tracking</p>
          <p className="text-[11px] text-sky-600 mt-0.5">
            Track air-freight shipments via Ethiopian Airlines Cargo. Enter your Air Waybill (AWB) number.
            Format: 071-XXXXXXXX
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={awbNumber}
          onChange={e => setAwbNumber(e.target.value)}
          placeholder="AWB number — e.g. 071-12345678"
          className="flex-1 text-sm"
          onKeyDown={e => e.key === 'Enter' && handleTrack()}
        />
        <Btn variant="primary" size="sm" onClick={() => handleTrack()} disabled={loading || !awbNumber.trim()}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
          Track
        </Btn>
        {result && (
          <Btn variant="ghost" size="sm" onClick={() => handleTrack(true)} disabled={loading}>
            <RefreshCw size={11} /> Force Refresh
          </Btn>
        )}
      </div>

      {result && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Plane size={13} className="text-slate-500" />
              <span className="text-[12px] font-semibold text-slate-700">{result.awbNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <SourceBadge source={result.source} />
              {result.status && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                  {result.status}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100">
            {[
              { label: 'Origin', value: result.origin },
              { label: 'Destination', value: result.destination },
              { label: 'Weight (kg)', value: result.weight?.toString() },
              { label: 'Pieces', value: result.pieces?.toString() },
              { label: 'Last Event', value: result.lastEvent },
              { label: 'Event Date', value: result.lastEventDate },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white px-4 py-2.5">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-[12px] text-slate-700 mt-0.5">{value ?? <span className="text-slate-300">—</span>}</p>
              </div>
            ))}
          </div>
          <PortalWarning warning={result.warning} />
        </div>
      )}
    </div>
  );
}

function ChequePermitPanel() {
  const [refNo, setRefNo] = useState('');
  const [result, setResult] = useState<ChequePermitResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = useCallback(async (force = false) => {
    if (!refNo.trim()) return;
    setLoading(true);
    try {
      const data = await portalsApi.cheche(refNo.trim(), force);
      setResult(data);
    } catch {
      toast.error('Failed to fetch permit status');
    } finally {
      setLoading(false);
    }
  }, [refNo]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-violet-50 border border-violet-100 rounded-xl">
        <FileText size={16} className="text-violet-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-violet-800">Cheche Government Portal — Permit Tracking</p>
          <p className="text-[11px] text-violet-600 mt-0.5">
            Check permit and licence payment status via the Cheche Government Portal.
            Enter your permit reference number.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={refNo}
          onChange={e => setRefNo(e.target.value)}
          placeholder="Permit reference number — e.g. CHECHE-2024-001234"
          className="flex-1 text-sm"
          onKeyDown={e => e.key === 'Enter' && handleCheck()}
        />
        <Btn variant="primary" size="sm" onClick={() => handleCheck()} disabled={loading || !refNo.trim()}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
          Check
        </Btn>
        {result && (
          <Btn variant="ghost" size="sm" onClick={() => handleCheck(true)} disabled={loading}>
            <RefreshCw size={11} /> Refresh
          </Btn>
        )}
      </div>

      {result && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FileText size={13} className="text-slate-500" />
              <span className="text-[12px] font-semibold text-slate-700">{result.referenceNo}</span>
            </div>
            <div className="flex items-center gap-2">
              <SourceBadge source={result.source} />
              {result.status && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  {result.status}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100">
            {[
              { label: 'Permit Type', value: result.permitType },
              { label: 'Applicant', value: result.applicant },
              { label: 'Issued Date', value: result.issuedDate },
              { label: 'Expiry Date', value: result.expiryDate },
              { label: 'Amount (ETB)', value: result.amount != null ? Number(result.amount).toLocaleString() : null },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white px-4 py-2.5">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-[12px] text-slate-700 mt-0.5">{value ?? <span className="text-slate-300">—</span>}</p>
              </div>
            ))}
          </div>
          <PortalWarning warning={result.warning} />
        </div>
      )}
    </div>
  );
}

function EbpPanel() {
  const [tin, setTin] = useState('');
  const [result, setResult] = useState<EbpResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = useCallback(async (force = false) => {
    if (!tin.trim()) return;
    setLoading(true);
    try {
      const data = await portalsApi.ebp(tin.trim(), force);
      setResult(data);
    } catch {
      toast.error('Failed to fetch business registration status');
    } finally {
      setLoading(false);
    }
  }, [tin]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
        <Building2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-emerald-800">Ethiopia Business Portal — TIN / VAT Status</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            Check TIN and VAT registration status via the Ethiopia Business Portal.
            Enter a 10-digit Ethiopian TIN number.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={tin}
          onChange={e => setTin(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit TIN — e.g. 0012345678"
          className="flex-1 text-sm font-mono"
          maxLength={10}
          onKeyDown={e => e.key === 'Enter' && handleCheck()}
        />
        <Btn variant="primary" size="sm" onClick={() => handleCheck()} disabled={loading || tin.length < 10}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
          Verify
        </Btn>
        {result && (
          <Btn variant="ghost" size="sm" onClick={() => handleCheck(true)} disabled={loading}>
            <RefreshCw size={11} /> Refresh
          </Btn>
        )}
      </div>

      {result && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Building2 size={13} className="text-slate-500" />
              <span className="text-[12px] font-semibold text-slate-700 font-mono">{result.tin}</span>
              {result.businessName && (
                <span className="text-[11px] text-slate-500">— {result.businessName}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <SourceBadge source={result.source} />
              {result.registrationStatus && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  result.registrationStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {result.registrationStatus}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100">
            {[
              { label: 'Business Name', value: result.businessName },
              { label: 'Business Type', value: result.businessType },
              { label: 'Registration Date', value: result.registrationDate },
              { label: 'VAT Registered', value: result.vatRegistered === null ? null : result.vatRegistered ? 'Yes' : 'No' },
              { label: 'VAT Status', value: result.vatStatus },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white px-4 py-2.5">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-[12px] text-slate-700 mt-0.5">{value ?? <span className="text-slate-300">—</span>}</p>
              </div>
            ))}
          </div>
          <PortalWarning warning={result.warning} />
        </div>
      )}
    </div>
  );
}

function LeulVerifyPanel() {
  const [reference, setReference] = useState('');
  const [result, setResult] = useState<LeulVerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = useCallback(async (force = false) => {
    if (!reference.trim()) return;
    setLoading(true);
    try {
      const data = await portalsApi.leulVerify(reference.trim(), force);
      setResult(data);
      if (data.verified) {
        toast.success('Receipt verified successfully');
      } else if (data.source !== 'stub') {
        toast.error('Receipt could not be verified');
      }
    } catch {
      toast.error('Failed to verify receipt');
    } finally {
      setLoading(false);
    }
  }, [reference]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-teal-50 border border-teal-100 rounded-xl">
        <ShieldCheck size={16} className="text-teal-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-teal-800">verify.leul.et — Receipt Verifier</p>
          <p className="text-[11px] text-teal-600 mt-0.5">
            Fallback receipt verification for CBE and Telebirr payments via verify.leul.et.
            Enter a transaction reference number.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={reference}
          onChange={e => setReference(e.target.value)}
          placeholder="Transaction reference — e.g. FT240001234 or Telebirr ref"
          className="flex-1 text-sm"
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
        />
        <Btn variant="primary" size="sm" onClick={() => handleVerify()} disabled={loading || !reference.trim()}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
          Verify
        </Btn>
        {result && (
          <Btn variant="ghost" size="sm" onClick={() => handleVerify(true)} disabled={loading}>
            <RefreshCw size={11} /> Refresh
          </Btn>
        )}
      </div>

      {result && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
            <div className="flex items-center gap-2">
              {result.verified
                ? <CheckCircle2 size={14} className="text-emerald-500" />
                : <AlertTriangle size={14} className="text-rose-500" />}
              <span className="text-[12px] font-semibold text-slate-700">{result.reference}</span>
            </div>
            <div className="flex items-center gap-2">
              <SourceBadge source={result.source} />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                result.verified
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {result.verified ? 'VERIFIED' : 'NOT VERIFIED'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100">
            {[
              { label: 'Amount (ETB)', value: result.amount != null ? Number(result.amount).toLocaleString() : null },
              { label: 'Paid At', value: result.paidAt },
              { label: 'Payer', value: result.payer },
              { label: 'Receiver', value: result.receiver },
              { label: 'Bank', value: result.bank },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white px-4 py-2.5">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-[12px] text-slate-700 mt-0.5">{value ?? <span className="text-slate-300">—</span>}</p>
              </div>
            ))}
          </div>
          <PortalWarning warning={result.warning} />
        </div>
      )}
    </div>
  );
}

// -- Shipment pipeline step row ------------------------------------------------

function StepRow({ step, onUpdate }: { step: TradeShipmentStep; onUpdate: (id: string, status: string, notes: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(step.notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (newStatus: string) => {
    setSaving(true);
    try {
      await onUpdate(step.id, newStatus, notes);
      toast.success(`Step "${step.stepLabel}" updated`);
    } catch {
      toast.error('Failed to update step');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <span className="shrink-0">{STEP_STATUS_ICON[step.status]}</span>
        <span className="flex-1 text-[12px] font-medium text-slate-700">{step.stepLabel}</span>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STEP_STATUS_CLS[step.status]}`}>
          {step.status}
        </span>
        {step.completedAt && (
          <span className="text-[10px] text-slate-400 hidden sm:block">
            {new Date(step.completedAt).toLocaleDateString()}
          </span>
        )}
        {expanded ? <ChevronUp size={12} className="text-slate-400 shrink-0" /> : <ChevronDown size={12} className="text-slate-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 bg-white space-y-3">
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes for this step…"
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            {(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'] as const).map((s: any) => (
              <Btn
                key={s}
                variant={step.status === s ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleSave(s)}
                disabled={saving}
              >
                {saving && step.status !== s ? null : STEP_STATUS_ICON[s]}
                {s.replace('_', ' ')}
              </Btn>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -- Shipment detail drawer ----------------------------------------------------

function ShipmentDetail({ shipment, onClose }: { shipment: TradeShipment; onClose: () => void }) {
  const qc = useQueryClient();

  const updateStep = useCallback(async (stepId: string, status: string, notes: string) => {
    await stepsApi.update(stepId, { status, notes });
    qc.invalidateQueries({ queryKey: ['trade-shipments'] });
  }, [qc]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {shipment.direction === 'IMPORT'
              ? <Ship size={16} className="text-sky-500" />
              : <Plane size={16} className="text-emerald-500" />}
            <div>
              <p className="ovds-card-title">{shipment.referenceNo}</p>
              <p className="ovds-caption">{shipment.direction} · {shipment.status}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Shipment info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'HS Code', value: shipment.hsCode },
              { label: 'Goods', value: shipment.goodsDescription },
              { label: 'Origin', value: shipment.originCountry },
              { label: 'Destination', value: shipment.destinationCountry },
              { label: 'Port of Loading', value: shipment.portOfLoading },
              { label: 'Port of Discharge', value: shipment.portOfDischarge },
              { label: 'Incoterms', value: shipment.incoterms },
              { label: 'Invoice Value', value: shipment.invoiceValue ? `${shipment.currencyCode} ${Number(shipment.invoiceValue).toLocaleString()}` : null },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-lg px-3 py-2">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-[12px] text-slate-700 mt-0.5">{value ?? <span className="text-slate-300">—</span>}</p>
              </div>
            ))}
          </div>

          {/* Pipeline steps */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Pipeline Steps</p>
            <div className="space-y-1.5">
              {shipment.steps.map(step => (
                <StepRow key={step.id} step={step} onUpdate={updateStep} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Create Shipment Modal -----------------------------------------------------

function CreateShipmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateShipmentDto>({
    direction: 'IMPORT',
    currencyCode: 'USD',
    invoiceValue: 0,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof CreateShipmentDto, v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await shipmentsApi.create(form);
      toast.success('Shipment created');
      onCreated();
      onClose();
    } catch {
      toast.error('Failed to create shipment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New Shipment" width="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Direction" required>
            <Select value={form.direction} onChange={e => set('direction', e)}>
              <option value="IMPORT">Import</option>
              <option value="EXPORT">Export</option>
            </Select>
          </FormField>
          <FormField label="Reference No">
            <Input value={form.referenceNo ?? ''} onChange={e => set('referenceNo', e.target.value)}
              placeholder="Auto-generated if blank" />
          </FormField>
          <FormField label="HS Code">
            <Input value={form.hsCode ?? ''} onChange={e => set('hsCode', e.target.value)}
              placeholder="e.g. 8471.30" />
          </FormField>
          <FormField label="HS Description">
            <Input value={form.hsDescription ?? ''} onChange={e => set('hsDescription', e.target.value)}
              placeholder="Tariff description" />
          </FormField>
          <FormField label="Goods Description">
            <div className="col-span-2">
            <Input value={form.goodsDescription ?? ''} onChange={e => set('goodsDescription', e.target.value)}
              placeholder="Brief description of goods" />
            </div>
          </FormField>
          <FormField label="Origin Country">
            <Input value={form.originCountry ?? ''} onChange={e => set('originCountry', e.target.value)}
              placeholder="e.g. CN" />
          </FormField>
          <FormField label="Destination Country">
            <Input value={form.destinationCountry ?? ''} onChange={e => set('destinationCountry', e.target.value)}
              placeholder="e.g. ET" />
          </FormField>
          <FormField label="Port of Loading">
            <Input value={form.portOfLoading ?? ''} onChange={e => set('portOfLoading', e.target.value)}
              placeholder="e.g. CNSHA" />
          </FormField>
          <FormField label="Port of Discharge">
            <Input value={form.portOfDischarge ?? ''} onChange={e => set('portOfDischarge', e.target.value)}
              placeholder="e.g. ETDJI" />
          </FormField>
          <FormField label="Incoterms">
            <Select value={form.incoterms ?? ''} onChange={e => set('incoterms', e)}>
              <option value="">Select…</option>
              {['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Currency">
            <Select value={form.currencyCode ?? 'USD'} onChange={e => set('currencyCode', e)}>
              {['USD','EUR','GBP','CNY','AED','ETB'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Invoice Value">
            <div className="col-span-2">
            <Input type="number" min={0} step="0.01"
              value={form.invoiceValue ?? 0}
              onChange={e => set('invoiceValue', parseFloat(e.target.value) || 0)} />
            </div>
          </FormField>
          <FormField label="Notes">
            <div className="col-span-2">
            <Textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="Optional notes…" />
            </div>
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="ghost" size="sm" type="button" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="sm" type="submit" disabled={saving}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Create Shipment
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// -- Dashboard tab -------------------------------------------------------------

function DashboardTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['trade-dashboard'],
    queryFn: tradeDashboardApi.get,
    staleTime: 60_000,
  });

  const kpis = useMemo(() => [
    { label: 'Imports',    value: data?.imports    ?? 0, color: 'sky'     as const },
    { label: 'Exports',    value: data?.exports    ?? 0, color: 'emerald' as const },
    { label: 'In Transit', value: data?.inTransit  ?? 0, color: 'amber'   as const },
    { label: 'Proformas',  value: data?.proformas  ?? 0, color: 'violet'  as const },
  ], [data]);

  return (
    <div className="space-y-5">
      <AppKpi cells={kpis} />

      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">Recent Shipments</p>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-300" />
          </div>
        ) : !data?.recentShipments?.length ? (
          <EmptyState
            icon={<Ship size={18} />}
            title="No shipments yet"
            desc="Create your first import or export shipment to get started"
          />
        ) : (
          <div className="space-y-2">
            {data.recentShipments.map((s: any) => {
              const done  = s.steps.filter((st: any) => st.status === 'COMPLETED').length;
              const total = s.steps.length;
              const pct   = total ? Math.round((done / total) * 100) : 0;
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    s.direction === 'IMPORT' ? 'bg-sky-50' : 'bg-emerald-50'
                  }`}>
                    {s.direction === 'IMPORT'
                      ? <Ship size={14} className="text-sky-500" />
                      : <Plane size={14} className="text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-slate-700 truncate">{s.referenceNo}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        s.direction === 'IMPORT'
                          ? 'bg-sky-50 text-sky-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>{s.direction}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 shrink-0">{done}/{total} steps</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// -- Shipments tab -------------------------------------------------------------

function ShipmentsTab() {
  const qc = useQueryClient();
  const [_direction, setDirection] = useState<'ALL' | 'IMPORT' | 'EXPORT'>('ALL');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<TradeShipment | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['trade-shipments', _direction],
    queryFn: () => shipmentsApi.list(_direction === 'ALL' ? undefined : _direction),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((s: any) =>
      s.referenceNo.toLowerCase().includes(q) ||
      (s.goodsDescription ?? '').toLowerCase().includes(q) ||
      (s.originCountry ?? '').toLowerCase().includes(q) ||
      (s.destinationCountry ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      shipmentsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-shipments'] });
      toast.success('Status updated');
    },
  });

  const STATUS_OPTIONS = ['PENDING','IN_TRANSIT','DECLARED','CUSTOMS_CLEARED','RELEASED','CANCELLED'];

  return (
    <>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search shipments…" className="w-52" />
        <div className="flex-1" />
        <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => refetch()}>Refresh</Btn>
        <Btn variant="primary" size="sm" icon={<Plus size={11} />} onClick={() => setShowCreate(true)}>
          New Shipment
        </Btn>
      </div>

      <AppTable>
        <thead>
          <tr>
            <AppTh>Reference</AppTh>
            <AppTh>Direction</AppTh>
            <AppTh>Goods</AppTh>
            <AppTh>Route</AppTh>
            <AppTh align="right">Value</AppTh>
            <AppTh>Progress</AppTh>
            <AppTh>Status</AppTh>
            <AppTh>Date</AppTh>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={8} className="py-12 text-center">
              <Loader2 size={16} className="animate-spin text-slate-300 mx-auto" />
            </td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}>
              <EmptyState
                icon={<Package size={18} />}
                title="No shipments"
                desc="Create your first shipment to start tracking the import/export pipeline"
              />
            </td></tr>
          ) : filtered.map((s: any) => {
            const done  = s.steps.filter((st: any) => st.status === 'COMPLETED').length;
            const total = s.steps.length;
            const pct   = total ? Math.round((done / total) * 100) : 0;
            return (
              <AppTr key={s.id} onClick={() => setSelected(s)} className="cursor-pointer">
                <AppTd>
                  <div className="flex items-center gap-1.5">
                    {s.direction === 'IMPORT'
                      ? <Ship size={11} className="text-sky-400 shrink-0" />
                      : <Plane size={11} className="text-emerald-400 shrink-0" />}
                    <span className="font-mono text-[11px] font-semibold text-slate-700">{s.referenceNo}</span>
                  </div>
                </AppTd>
                <AppTd>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    s.direction === 'IMPORT'
                      ? 'bg-sky-50 text-sky-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>{s.direction}</span>
                </AppTd>
                <AppTd>
                  <span className="text-[11px] text-slate-600 truncate max-w-[140px] block">
                    {s.goodsDescription ?? s.hsDescription ?? '—'}
                  </span>
                </AppTd>
                <AppTd>
                  <span className="text-[10px] text-slate-500">
                    {s.originCountry ?? '?'} → {s.destinationCountry ?? '?'}
                  </span>
                </AppTd>
                <AppTd align="right">
                  <Amount value={Number(s.invoiceValue)} size="sm" />
                  <span className="text-[9px] text-slate-400 ml-1">{s.currencyCode}</span>
                </AppTd>
                <AppTd>
                  <div className="flex items-center gap-1.5 min-w-[80px]">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0">{pct}%</span>
                  </div>
                </AppTd>
                <AppTd>
                  <select
                    value={s.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => statusMutation.mutate({ id: s.id, status: e.target.value })}
                    className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400"
                  >
                    {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                  </select>
                </AppTd>
                <AppTd>
                  <span className="ovds-caption">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </AppTd>
              </AppTr>
            );
          })}
        </tbody>
      </AppTable>

      {selected && <ShipmentDetail shipment={selected} onClose={() => setSelected(null)} />}
      {showCreate && (
        <CreateShipmentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['trade-shipments'] })}
        />
      )}
    </>
  );
}

// -- Portals tab ---------------------------------------------------------------

const PORTAL_TABS: { key: PortalTab; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'eslse',  label: 'ESLSE',          icon: <Anchor size={12} />,    color: 'text-blue-600' },
  { key: 'eal',    label: 'EAL Cargo',      icon: <Plane size={12} />,     color: 'text-sky-600' },
  { key: 'cheche', label: 'Cheche Permits', icon: <FileText size={12} />,  color: 'text-violet-600' },
  { key: 'ebp',    label: 'Business Portal',icon: <Building2 size={12} />, color: 'text-emerald-600' },
  { key: 'leul',   label: 'verify.leul.et', icon: <ShieldCheck size={12} />, color: 'text-teal-600' },
];

function PortalsTab() {
  const [active, setActive] = useState<PortalTab>('eslse');

  return (
    <div className="space-y-4">
      {/* Portal selector */}
      <div className="flex gap-1 flex-wrap">
        {PORTAL_TABS.map(pt => (
          <button
            key={pt.key}
            onClick={() => setActive(pt.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              active === pt.key
                ? 'bg-white border-slate-300 shadow-sm text-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className={active === pt.key ? pt.color : 'text-slate-400'}>{pt.icon}</span>
            {pt.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        {active === 'eslse'  && <EslsePanel />}
        {active === 'eal'    && <EalCargoPanel />}
        {active === 'cheche' && <ChequePermitPanel />}
        {active === 'ebp'    && <EbpPanel />}
        {active === 'leul'   && <LeulVerifyPanel />}
      </div>

      {/* Integration status grid */}
      <div className="ovds-grid-layout cols-3">
        {[
          {
            name: 'ESLSE',
            desc: 'Sea-freight shipment tracking via eslse.et',
            env: 'ESLSE_API_URL',
            icon: <Anchor size={14} />,
            color: 'bg-blue-50 border-blue-100',
            iconCls: 'text-blue-500',
          },
          {
            name: 'Ethiopian Airlines Cargo',
            desc: 'Air-freight AWB tracking',
            env: 'EAL_CARGO_API_URL',
            icon: <Plane size={14} />,
            color: 'bg-sky-50 border-sky-100',
            iconCls: 'text-sky-500',
          },
          {
            name: 'Cheche Government Portal',
            desc: 'Permit & licence payment tracking',
            env: 'CHECHE_API_URL',
            icon: <FileText size={14} />,
            color: 'bg-violet-50 border-violet-100',
            iconCls: 'text-violet-500',
          },
          {
            name: 'Ethiopia Business Portal',
            desc: 'TIN / VAT registration status',
            env: 'EBP_API_URL',
            icon: <Building2 size={14} />,
            color: 'bg-emerald-50 border-emerald-100',
            iconCls: 'text-emerald-500',
          },
          {
            name: 'verify.leul.et',
            desc: 'Fallback receipt verifier for CBE + Telebirr',
            env: 'LEUL_VERIFY_API_URL',
            icon: <ShieldCheck size={14} />,
            color: 'bg-teal-50 border-teal-100',
            iconCls: 'text-teal-500',
          },
        ].map(p => (
          <div key={p.name} className={`flex items-start gap-3 p-3 rounded-xl border ${p.color}`}>
            <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm ${p.iconCls}`}>
              {p.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-700">{p.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Globe size={9} className="text-slate-300" />
                <code className="text-[9px] text-slate-400 font-mono">{p.env}</code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Main Trade page -----------------------------------------------------------

const Trade: React.FC = () => {
  usePageTitle('Supply Chain');
  const [tab, setTab] = useState<MainTab>('dashboard');

  return (
    <AppPage
      title="Supply Chain"
      subtitle="Import · Export · Shipment Pipeline · Ethiopian Portal Integrations · Manufacturing & Logistics · Market Segmentation · Supply Chain Analytics"
      icon={<Ship size={18} />}
      crumbs={[{ label: 'Supply Chain' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'dashboard', label: 'Overview',   count: undefined },
            { key: 'shipments', label: 'Shipments',  count: undefined },
            { key: 'portals',   label: 'Portals',    count: 5 },
          ]}
          active={tab}
          onChange={k => setTab(k as MainTab)}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          {tab === 'portals' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg">
              <Info size={11} className="text-amber-500 shrink-0" />
              <span className="text-[10px] text-amber-700 font-medium">
                Configure portal API keys in <code className="font-mono">.env</code>
              </span>
            </div>
          )}
          <a
            href="https://www.eslse.et"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ExternalLink size={10} /> ESLSE
          </a>
          <a
            href="https://www.ethiopianairlines.com/aa/cargo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ExternalLink size={10} /> EAL Cargo
          </a>
        </div>
      }
    >
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'shipments' && <ShipmentsTab />}
      {tab === 'portals'   && <PortalsTab />}
    </AppPage>
  );
};

export default Trade;

