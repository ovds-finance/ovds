import { GridHero, ContextStrip, ContextPill } from '@ovds/ui';
import {
  ScanLine,
  Upload,
  Camera,
  QrCode,
  Building2,
  Smartphone,
  Search,
  Download,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  X,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  FileText,
  Zap,
  Link2,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Archive,
  Sparkles,
  BadgeCheck,
  Wifi,
  MoreVertical,
  Copy,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

import { PipelineStageHeader } from '../components/pipelineComponents';
import { EmptyState, Pagination } from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useAuditLog } from '../hooks/useAuditLog';
import { useConfirm } from '../hooks/useConfirm';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { fmtCurrency, normalizeOcrError } from '../utils';

const fmt = (n: number) => fmtCurrency(n, 'ETB');

type BillType = 'BANK' | 'TELECOM' | 'INVOICE';
type BillStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPORTED';
type CaptureTab = 'upload' | 'camera' | 'qr' | 'manual';

interface ScannedBill {
  id: string;
  billType: BillType;
  source?: string;
  referenceNo?: string;
  amount: number;
  currencyCode: string;
  paidAt?: string;
  payer?: string;
  receiver?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  telecomRef?: string;
  bankRef?: string;
  description?: string;
  creditPart?: string;
  debitPart?: string;
  paidRef?: string;
  paidName?: string;
  ocrConfidence?: number;
  status: BillStatus;
  linkedExpenseId?: string;
  linkedInvoiceId?: string;
  linkedBillId?: string;
  createdAt: string;
  // Company info returned by the API on detail views
  company?: { name?: string; tin?: string; address?: string };
  companyName?: string;
  companyTin?: string;
  companyAddress?: string;
}

const TYPE_META: Record<BillType, { label: string; color: string }> = {
  BANK: {
    label: 'Bank',
    color:
      'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/40 dark:text-green-300',
  },
  TELECOM: {
    label: 'Telecom',
    color:
      'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  INVOICE: {
    label: 'Invoice',
    color:
      'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  },
};

const STATUS_META: Record<BillStatus, { label: string; color: string }> = {
  PENDING: {
    label: 'Pending',
    color:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  },
  VERIFIED: {
    label: 'Verified',
    color:
      'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
  },
  REJECTED: {
    label: 'Rejected',
    color:
      'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
  },
  EXPORTED: {
    label: 'Exported',
    color:
      'bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  },
};

const ETHIOPIAN_BANKS = [
  'Telebirr (Ethio Telecom)',
  'Commercial Bank of Ethiopia',
  'CBE Birr',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Amhara Bank',
  'Wegagen Bank',
  'NIB International Bank',
  'Oromia Bank',
  'Zemen Bank',
  'Berhan Bank',
  'Bunna Bank',
  'Enat Bank',
  'Lion Bank',
  'Tsedey Bank',
  'Cooperative Bank of Oromia',
  'Addis International Bank',
  'Hijra Bank',
  'Siinqee Bank',
  'Gadaa Bank',
  'Hibret Bank',
  'Global Bank Ethiopia',
  'Ahadu Bank',
  'M-PESA Safaricom Ethiopia',
];

const inp =
  'w-full px-3 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-aki-blue/20 focus:border-aki-blue transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500';
const lbl =
  'block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5';

const ConfBadge: React.FC<{ v?: number }> = ({ v }) => {
  if (v == null) return null;
  const p = Math.round(v * 100);
  const c =
    p >= 80
      ? 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]'
      : p >= 50
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-rose-600 bg-rose-50 border-rose-200';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${c}`}
    >
      <Sparkles size={9} />
      {p}%
    </span>
  );
};

// -- Capture Modal -------------------------------------------------------------
const CaptureModal: React.FC<{
  onClose: () => void;
  onSave: (
    bill: Partial<ScannedBill> & { imageData?: string; rawData?: string },
  ) => void;
}> = ({ onClose, onSave }) => {
  const [tab, setTab] = useState<CaptureTab>('upload');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [qrText, setQrText] = useState('');
  const [telecomRef, setTelecomRef] = useState('');
  const [telecomFetching, setTelecomFetching] = useState(false);
  const [telecomResult, setTelecomResult] = useState<any>(null);
  const [telecomIsStub, setTelecomIsStub] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual form state
  const [form, setForm] = useState({
    billType: 'BANK' as BillType,
    source: '',
    referenceNo: '',
    amount: '',
    currency: 'ETB',
    paidAt: new Date().toISOString().split('T')[0],
    payer: '',
    receiver: '',
    bankName: '',
    bankAccountNo: '',
    bankAccountName: '',
    telecomRef: '',
    bankRef: '',
    description: '',
    paidRef: '',
    paidName: '',
  });

  const setF = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const runOcr = useCallback(async (base64: string, mimeType: string) => {
    setLoading(true);
    try {
      const r = await api.post('/ovds/invoices/ocr-extract', {
        base64Image: base64,
        mimeType,
      });
      const d = r.data?.data ?? r.data;
      setOcrResult(d);
      setForm((p) => ({
        ...p,
        billType: d.bankName ? 'BANK' : d.telecomRef ? 'TELECOM' : 'INVOICE',
        bankName: d.bankName ?? p.bankName,
        bankAccountNo: d.bankAccountNo ?? p.bankAccountNo,
        telecomRef: d.telecomRef ?? p.telecomRef,
        amount: d.totalAmount?.toString() ?? p.amount,
        payer: d.customerName ?? p.payer,
        referenceNo: d.invoiceNumber ?? p.referenceNo,
        description: d.notes ?? p.description,
      }));
      toast.success(
        `OCR complete — ${Math.round((d.confidence ?? 0) * 100)}% confidence`,
      );
    } catch (err: any) {
      toast.error(
        normalizeOcrError(err?.response?.data?.message ?? 'OCR failed. Check AI provider config.'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const processFile = useCallback(
    (file: File) => {
      const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ];
      if (!allowed.includes(file.type)) {
        toast.error('Use JPG, PNG, WebP or PDF');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (file.type !== 'application/pdf') setPreviewUrl(dataUrl);
        runOcr(dataUrl.split(',')[1], file.type);
      };
      reader.readAsDataURL(file);
    },
    [runOcr],
  );

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera access denied. Check browser permissions.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.92);
    setPreviewUrl(dataUrl);
    stopCamera();
    runOcr(dataUrl.split(',')[1], 'image/jpeg');
  };

  const fetchTelecom = async (force = false) => {
    if (!telecomRef.trim()) {
      toast.error('Enter a reference number');
      return;
    }
    setTelecomFetching(true);
    try {
      // Use the unified endpoint — auto-detects Telebirr, CBE, Awash, Dashen, BOA, etc.
      const url = `/ovds/invoices/receipt-by-ref/${encodeURIComponent(telecomRef.trim())}${force ? '?force=true' : ''}`;
      const r = await api.get(url, { headers: { 'x-background': '1' } as any });
      const d = r.data?.data ?? r.data;
      if (d?.parsed) {
        const p = d.parsed;
        setTelecomResult(p);
        setTelecomIsStub(d.source === 'stub');
        // Detect bill type from parsed bank name
        const isBank = !!(
          p.bankName && !p.bankName.toLowerCase().includes('telebirr')
        );
        setForm((prev) => ({
          ...prev,
          billType: isBank ? 'BANK' : 'TELECOM',
          telecomRef: isBank ? prev.telecomRef : telecomRef.trim(),
          bankRef: isBank ? telecomRef.trim() : prev.bankRef,
          bankName: p.bankName ?? prev.bankName,
          referenceNo: p.txnId ?? telecomRef.trim(),
          amount: p.amount != null ? p.amount.toString() : prev.amount,
          payer: p.payer ?? prev.payer,
          receiver: p.receiver ?? prev.receiver,
          bankAccountNo: p.accountNo ?? p.payerAccount ?? prev.bankAccountNo,
          paidAt: p.paidAt
            ? p.paidAt.includes('T') || p.paidAt.includes(' ')
              ? p.paidAt.split(/T| /)[0]
              : p.paidAt.split('/').length === 3
                ? `${p.paidAt.split('/')[2]}-${p.paidAt.split('/')[1]}-${p.paidAt.split('/')[0]}`
                : prev.paidAt
            : prev.paidAt,
          description: p.service
            ? `${p.service}${prev.description ? ' — ' + prev.description : ''}`
            : prev.description,
          // Map new receipt fields into existing columns
          paidRef: p.otcRef ?? p.transactionStatus ?? prev.paidRef,
          paidName: p.paymentMode ?? prev.paidName,
        }));
        if (d.warning) {
          // Only show toast for non-stub warnings (stub warning is shown inline)
          if (d.source !== 'stub') {
            toast(d.warning, { icon: '⚠️' });
          }
        } else {
          toast.success(
            d.fromCache
              ? 'Receipt loaded from cache'
              : isBank
                ? 'Bank receipt fetched'
                : 'Telecom receipt fetched',
          );
        }
      } else {
        toast.error('Receipt not found or invalid reference');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to fetch receipt');
    } finally {
      setTelecomFetching(false);
    }
  };

  const handleSave = () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) {
      toast.error('Amount is required');
      return;
    }
    const telecomSource = (() => {
      if (form.source) return form.source;
      if (telecomResult?.bankName) {
        const bn = String(telecomResult.bankName).toLowerCase();
        if (
          bn.includes('telebirr') ||
          bn.includes('ethio telecom') ||
          bn.includes('telecom')
        )
          return 'telebirr';
        if (bn.includes('cbe')) return 'cbe';
        if (bn.includes('awash')) return 'awash';
        if (bn.includes('dashen')) return 'dashen';
        if (bn.includes('abyssinia')) return 'abyssinia';
        if (bn.includes('boa') || bn.includes('bank of abyssinia'))
          return 'abyssinia';
        return 'bank';
      }
      return 'telebirr';
    })();

    onSave({
      billType: form.billType,
      source:
        form.source ||
        (form.billType === 'TELECOM' ? telecomSource : form.bankName) ||
        undefined,
      referenceNo:
        form.referenceNo || form.telecomRef || form.bankRef || undefined,
      amount: parseFloat(form.amount),
      currencyCode: form.currency,
      paidAt: form.paidAt || undefined,
      payer: form.payer || undefined,
      receiver: form.receiver || undefined,
      bankName: form.bankName || undefined,
      bankAccountNo: form.bankAccountNo || undefined,
      bankAccountName: form.bankAccountName || undefined,
      telecomRef: form.telecomRef || undefined,
      bankRef: form.bankRef || undefined,
      description: form.description || undefined,
      ocrConfidence: ocrResult?.confidence,
      imageData: previewUrl ?? undefined,
      paidRef: form.paidRef || undefined,
      paidName: form.paidName || undefined,
      // Store full parsed receipt data as rawData
      rawData: telecomResult
        ? JSON.stringify({
            ...telecomResult,
            _ref: form.telecomRef || form.bankRef,
            _fetchedAt: new Date().toISOString(),
          })
        : undefined,
    });
  };

  const TABS = [
    {
      id: 'upload' as CaptureTab,
      label: 'Upload / Drop',
      icon: <Upload size={14} />,
    },
    { id: 'camera' as CaptureTab, label: 'Camera', icon: <Camera size={14} /> },
    {
      id: 'qr' as CaptureTab,
      label: 'QR / Telecom',
      icon: <QrCode size={14} />,
    },
    {
      id: 'manual' as CaptureTab,
      label: 'Manual Entry',
      icon: <Edit2 size={14} />,
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-[20px]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-aki-blue/10 dark:bg-aki-blue/20 rounded-xl flex items-center justify-center">
              <ScanLine size={18} className="text-aki-blue" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">Scan Bill</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                OCR · QR · Camera · Manual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-4 pt-0 gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold border-b-2 transition-all whitespace-nowrap ${tab === t.id ? 'border-aki-blue text-aki-blue dark:text-aki-blue bg-aki-blue/5 dark:bg-aki-blue/10' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* UPLOAD TAB */}
            {tab === 'upload' && (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer.files[0];
                    if (f) processFile(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-aki-blue bg-aki-blue/5 dark:bg-aki-blue/10' : 'border-slate-200 dark:border-slate-700 hover:border-aki-blue/60 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2
                        size={32}
                        className="text-aki-blue animate-spin"
                      />
                      <p className="ovds-body text-slate-500">
                        Running OCR analysis…
                      </p>
                    </div>
                  ) : previewUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="max-h-36 rounded-xl object-contain shadow-md"
                      />
                      <p className="text-xs font-semibold text-[var(--pro-azure)] flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        Image captured — click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <Upload size={24} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="ovds-body font-semibold text-slate-700 dark:text-slate-200">
                          Drop files or click to browse
                        </p>
                        <p className="ovds-caption mt-1">
                          JPG · PNG · WebP · PDF — Bank slips, Telecom receipts,
                          Invoices
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) processFile(f);
                  }}
                />
                {ocrResult && (
                  <div className="p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={14} className="text-[var(--pro-azure)]" />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        OCR Extracted
                      </span>
                      <ConfBadge v={ocrResult.confidence} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ocrResult.totalAmount && (
                        <span className="text-[12px] text-slate-600 dark:text-slate-400">
                          <b className="text-slate-700 dark:text-slate-300">Amount:</b> {fmt(ocrResult.totalAmount)}
                        </span>
                      )}
                      {ocrResult.bankName && (
                        <span className="text-[12px] text-slate-600 dark:text-slate-400">
                          <b className="text-slate-700 dark:text-slate-300">Bank:</b> {ocrResult.bankName}
                        </span>
                      )}
                      {ocrResult.customerName && (
                        <span className="text-[12px] text-slate-600 dark:text-slate-400">
                          <b className="text-slate-700 dark:text-slate-300">Payer:</b> {ocrResult.customerName}
                        </span>
                      )}
                      {ocrResult.telecomRef && (
                        <span className="text-[12px] text-slate-600 dark:text-slate-400">
                          <b className="text-slate-700 dark:text-slate-300">Ref:</b> {ocrResult.telecomRef}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CAMERA TAB */}
            {tab === 'camera' && (
              <div className="space-y-4">
                {cameraError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 rounded-xl ovds-body text-rose-700 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    {cameraError}
                  </div>
                )}
                <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className={`w-full h-full object-cover ${cameraActive ? '' : 'hidden'}`}
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {!cameraActive && !previewUrl && (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Camera size={36} />
                      <p className="ovds-body">Camera not started</p>
                    </div>
                  )}
                  {previewUrl && !cameraActive && (
                    <img
                      src={previewUrl}
                      alt="captured"
                      className="w-full h-full object-contain"
                    />
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                      <Loader2 size={28} className="text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!cameraActive ? (
                    <button
                      onClick={startCamera}
                      className="flex-1 ovds-btn-primary flex items-center justify-center gap-2 py-3"
                    >
                      <Camera size={15} />
                      Start Camera
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={capturePhoto}
                        className="flex-1 ovds-btn-primary flex items-center justify-center gap-2 py-3"
                      >
                        <ScanLine size={15} />
                        Capture & Scan
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-4 py-3 ovds-btn-secondary"
                      >
                        Stop
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* QR / TELECOM TAB */}
            {tab === 'qr' && (
              <div className="space-y-4">
                <div className="p-4 bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-lg">
                  <p className="text-[11px] font-bold text-aki-blue dark:text-aki-blue uppercase tracking-widest mb-1.5">
                    Telebirr / CBE / Bank Reference
                  </p>
                  <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Paste a <b className="text-slate-700 dark:text-slate-200">plain ref</b> (FT… / dcu3e3…), a{' '}
                    <b className="text-slate-700 dark:text-slate-200">receipt link</b> (https://mbreciept.cbe.com.et/…), or
                    your full <b className="text-slate-700 dark:text-slate-200">SMS message</b> — the ref, amount and date will
                    be extracted automatically. Live verification works for{' '}
                    <b className="text-slate-700 dark:text-slate-200">Telebirr</b> and <b className="text-slate-700 dark:text-slate-200">CBE</b> (FT… refs). All other
                    Ethiopian banks (Awash, Dashen, BOA, Amhara, NIB, Wegagen,
                    Enat, Bunna, Berhan, Zemen, Oromia, Lion, Tsedey, Siinqee,
                    Abay, Ebirr, HelloCash, Amole, M-PESA) are pre-filled from
                    the SMS.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>
                    Reference, Receipt Link, or SMS Text
                  </label>
                  <div className="flex gap-2 items-start">
                    <textarea
                      value={telecomRef}
                      onChange={(e) => setTelecomRef(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          fetchTelecom();
                        }
                      }}
                      rows={3}
                      placeholder={
                        'Paste any of:\n' +
                        '• FT260918P1LH  or  dcu3e3yct1\n' +
                        '• https://mbreciept.cbe.com.et/FT260918P1LH\n' +
                        '• Full SMS: "Your Telebirr txn ref dff6wfq17k ETB 500.00 on 15/06/2026"'
                      }
                      className={inp + ' resize-none flex-1'}
                    />
                    <div className="flex flex-col gap-2 pt-0.5">
                      <button
                        onClick={() => fetchTelecom(false)}
                        disabled={telecomFetching}
                        className="ovds-btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-50 px-4 py-2.5"
                      >
                        {telecomFetching ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Wifi size={13} />
                        )}
                        Fetch
                      </button>
                      {telecomResult && (
                        <button
                          onClick={() => fetchTelecom(true)}
                          disabled={telecomFetching}
                          title="Force re-fetch (bypass cache)"
                          className="ovds-btn-secondary px-3 disabled:opacity-50 flex items-center justify-center"
                        >
                          <RefreshCw size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {telecomResult && (
                  <div
                    className={`p-4 border rounded-lg space-y-1.5 ${telecomIsStub ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {telecomIsStub ? (
                        <>
                          <AlertTriangle size={14} className="text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-widest">
                            Pre-filled — Enter Details Manually
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} className="text-[var(--pro-azure)]" />
                          <span className="text-[10px] font-bold text-[var(--pro-azure-dark)] dark:text-green-300 uppercase tracking-widest">
                            Receipt Verified
                          </span>
                        </>
                      )}
                    </div>
                    {telecomIsStub && (
                      <p className="text-[12px] text-amber-700 dark:text-amber-400 mb-2">
                        {telecomResult.bankName
                          ? `${telecomResult.bankName} does not have a public receipt portal.`
                          : 'Bank portal unreachable.'}{' '}
                        Reference
                        {telecomResult.amount != null ? ', amount' : ''}
                        {telecomResult.paidAt ? ' and date' : ''} pre-filled
                        from your input — verify and complete remaining fields.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      {telecomResult.amount != null && (
                        <p className="text-[12px] text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Amount:</span> {fmt(telecomResult.amount)}
                        </p>
                      )}
                      {telecomResult.payer && (
                        <p className="text-[12px] text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Payer:</span> {telecomResult.payer}
                        </p>
                      )}
                      {telecomResult.receiver && (
                        <p className="text-[12px] text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Receiver:</span> {telecomResult.receiver}
                        </p>
                      )}
                      {telecomResult.txnId && (
                        <p className="text-[12px] text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Ref / Invoice No:</span> {telecomResult.txnId}
                        </p>
                      )}
                      {telecomResult.bankName && (
                        <p className="text-[12px] text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Bank:</span> {telecomResult.bankName}
                        </p>
                      )}
                      {telecomResult.service && (
                        <p className="text-[12px] text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Reason:</span> {telecomResult.service}
                        </p>
                      )}
                      {telecomResult.paidAt && (
                        <p className="text-[12px] text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Date:</span>{' '}
                          {new Date(telecomResult.paidAt).toLocaleString()}
                        </p>
                      )}
                      {telecomResult.transactionStatus && (
                        <p className="text-[12px] text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Status:</span> {telecomResult.transactionStatus}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className={lbl}>Or paste QR code text</label>
                  <textarea
                    value={qrText}
                    onChange={(e) => {
                      setQrText(e.target.value);
                      if (e.target.value.includes('|')) {
                        const p = e.target.value.split('|');
                        setForm((f) => ({
                          ...f,
                          billType: 'BANK',
                          bankName: p[0]?.trim(),
                          bankAccountNo: p[1]?.trim(),
                          bankAccountName: p[2]?.trim(),
                          amount: p[3]?.replace(/[^\d.]/g, '') ?? f.amount,
                        }));
                      }
                    }}
                    rows={3}
                    placeholder="Paste EMV QR or pipe-delimited bank QR data…"
                    className={inp + ' resize-none'}
                  />
                </div>
              </div>
            )}

            {/* Shared form (shown after capture or on manual tab) */}
            {(tab === 'manual' ||
              ocrResult ||
              telecomResult ||
              (tab === 'qr' && qrText)) && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                {tab === 'manual' && !ocrResult && !telecomResult && (
                  <div className="p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Manual Entry</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">
                      Fill in the bill details. Amount is required; all other
                      fields are optional.
                    </p>
                  </div>
                )}
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Bill Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Bill Type</label>
                    <select
                      value={form.billType}
                      onChange={(e) => setF('billType', e.target.value)}
                      className={inp}
                    >
                      <option value="BANK">Bank Transfer</option>
                      <option value="TELECOM">
                        Telecom (Telebirr / CBE Birr)
                      </option>
                      <option value="INVOICE">Invoice / Receipt</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Amount (ETB) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setF('amount', e.target.value)}
                      placeholder="0.00"
                      className={inp}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Reference No.</label>
                    <input
                      value={form.referenceNo}
                      onChange={(e) => setF('referenceNo', e.target.value)}
                      placeholder="TXN-001"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Date Paid</label>
                    <input
                      type="date"
                      value={form.paidAt}
                      onChange={(e) => setF('paidAt', e.target.value)}
                      className={inp}
                    />
                  </div>
                </div>
                {form.billType === 'BANK' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Bank Name</label>
                      <select
                        value={form.bankName}
                        onChange={(e) => setF('bankName', e.target.value)}
                        className={inp}
                      >
                        <option value="">Select bank…</option>
                        {ETHIOPIAN_BANKS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Account No.</label>
                      <input
                        value={form.bankAccountNo}
                        onChange={(e) => setF('bankAccountNo', e.target.value)}
                        placeholder="1000XXXXXXXX"
                        className={inp}
                      />
                    </div>
                  </div>
                )}
                {form.billType === 'TELECOM' && (
                  <div>
                    <label className={lbl}>Telecom Reference</label>
                    <input
                      value={form.telecomRef}
                      onChange={(e) => setF('telecomRef', e.target.value)}
                      placeholder="dcu3e3yct1"
                      className={inp}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Payer</label>
                    <input
                      value={form.payer}
                      onChange={(e) => setF('payer', e.target.value)}
                      placeholder="Sender name"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Receiver</label>
                    <input
                      value={form.receiver}
                      onChange={(e) => setF('receiver', e.target.value)}
                      placeholder="Recipient name"
                      className={inp}
                    />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setF('description', e.target.value)}
                    rows={2}
                    placeholder="Payment for…"
                    className={inp + ' resize-none'}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex gap-3">
          <button
            onClick={onClose}
            className="ovds-btn-secondary flex-1 py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="ovds-btn-primary flex-[2] py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <BadgeCheck size={15} />
            )}
            Save Bill
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Detail Drawer -------------------------------------------------------------
const DetailDrawer: React.FC<{
  bill: ScannedBill;
  onClose: () => void;
  onStatusChange: (id: string, s: BillStatus) => void;
  onDelete: (id: string) => void;
}> = ({ bill, onClose, onStatusChange, onDelete }) => {
  const meta = STATUS_META[bill.status];
  const typeMeta = TYPE_META[bill.billType];
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
              Bill Details
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {bill.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${typeMeta.color}`}
            >
              {typeMeta.label}
            </span>
            <span
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${meta.color}`}
            >
              {meta.label}
            </span>
            {bill.ocrConfidence != null && <ConfBadge v={bill.ocrConfidence} />}
          </div>
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tabular-nums">
                {fmt(bill.amount)}
              </span>
            </div>
            {bill.paidAt && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {new Date(bill.paidAt).toLocaleDateString('en-ET', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {bill.referenceNo && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Reference</span>
                <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                  {bill.referenceNo}
                </span>
              </div>
            )}
          </div>
          {(bill.bankName || bill.bankAccountNo) && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Bank Details</p>
              <div className="bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-900 rounded-2xl p-4 space-y-2">
                {bill.bankName && (
                  <p className="text-sm font-bold text-[var(--pro-azure-dark)] dark:text-green-200">
                    {bill.bankName}
                  </p>
                )}
                {bill.bankAccountNo && (
                  <p className="text-xs font-mono text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                    {bill.bankAccountNo}
                  </p>
                )}
                {bill.bankAccountName && (
                  <p className="text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                    {bill.bankAccountName}
                  </p>
                )}
              </div>
            </div>
          )}
          {(bill.payer || bill.receiver) && (
            <div className="grid grid-cols-2 gap-3">
              {bill.payer && (
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Payer</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {bill.payer}
                  </p>
                </div>
              )}
              {bill.receiver && (
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Receiver</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {bill.receiver}
                  </p>
                </div>
              )}
            </div>
          )}
          {bill.telecomRef && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-2xl p-4">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                Telecom Reference
              </p>
              <p className="text-sm font-mono font-bold text-amber-800 dark:text-amber-200">
                {bill.telecomRef}
              </p>
            </div>
          )}
          {bill.bankRef && (
            <div className="bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-900 rounded-2xl p-4">
              <p className="text-[10px] font-black text-[var(--pro-azure)] uppercase tracking-widest mb-1">
                Bank Portal Reference
              </p>
              <p className="text-sm font-mono font-bold text-[var(--pro-azure-dark)] dark:text-green-200">
                {bill.bankRef}
              </p>
            </div>
          )}
          {(bill.creditPart ||
            bill.debitPart ||
            bill.paidRef ||
            bill.paidName) && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Metadata</p>
              <div className="ovds-grid-layout cols-2">
                {bill.creditPart && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      Credit Part
                    </p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {bill.creditPart}
                    </p>
                  </div>
                )}
                {bill.debitPart && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      Debit Part
                    </p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {bill.debitPart}
                    </p>
                  </div>
                )}
                {bill.paidRef && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      Paid Ref
                    </p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {bill.paidRef}
                    </p>
                  </div>
                )}
                {bill.paidName && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      Paid Name
                    </p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {bill.paidName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {bill.description && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Description</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {bill.description}
              </p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Recorded</p>
            <p className="ovds-caption">
              {new Date(bill.createdAt).toLocaleString()}
            </p>
          </div>
          {(bill.linkedExpenseId ||
            bill.linkedInvoiceId ||
            bill.linkedBillId) && (
            <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl flex items-center gap-2">
              <Link2 size={14} className="text-[var(--pro-azure)]" />
              <span className="text-xs font-bold text-[var(--pro-azure-dark)] dark:text-green-300">
                Linked to{' '}
                {bill.linkedExpenseId
                  ? 'Expense'
                  : bill.linkedInvoiceId
                    ? 'Invoice'
                    : 'Bill'}
              </span>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const win = window.open('', '_blank');
                if (!win) return;

                const company = bill.company ?? {};
                const companyName = company.name ?? bill.companyName ?? '';
                const companyTin = company.tin ?? bill.companyTin ?? '';
                const companyAddress =
                  company.address ?? bill.companyAddress ?? '';

                const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Bill ${bill.referenceNo ?? bill.id}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;padding:36px;color:#0f172a;font-size:11px}
  .container{max-width:800px;margin:0 auto}
  .print-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #e5e7eb}
  .brand{display:flex;gap:12px;align-items:flex-start}
  .logo{width:44px;height:44px;border-radius:12px;background:#ecfeff;border:1px solid #cffafe;display:flex;align-items:center;justify-content:center;color:#0891b2;font-weight:900}
  .h-title{font-size:16px;font-weight:900;margin:0;line-height:1.1}
  .h-sub{margin:4px 0 0 0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:.02em}
  .company{font-size:10px;color:#334155;font-weight:700;line-height:1.5;text-align:right}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}
  .box{border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#f8fafc}
  .label{font-size:9px;font-weight:900;text-transform:uppercase;color:#64748b;margin-bottom:6px;letter-spacing:.06em}
  .value{font-size:12px;font-weight:900;color:#0f172a;word-break:break-word}
  table{width:100%;border-collapse:collapse;margin-top:14px}
  th{background:#f1f5f9;border:1px solid #e5e7eb;padding:8px;font-size:9px;text-transform:uppercase;letter-spacing:.06em;text-align:left;color:#475569}
  td{border:1px solid #e5e7eb;padding:8px;font-size:10px;vertical-align:top}
  .totals{margin-top:16px;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;display:flex;justify-content:flex-end}
  .totals table{margin-top:0;max-width:340px}
  .totals td{border:none;padding:6px 8px}
  .grand td{font-weight:900;font-size:12px}
  .no-print{display:none}
  .print-footer{margin-top:22px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;gap:12px;align-items:center;color:#64748b;font-size:9px;font-weight:700}
  @media print{.no-print{display:none!important} body{padding:18px}}
</style></head><body>
<div class="container">
  <div class="print-header">
    <div class="brand">
      <div class="logo">OVDS</div>
      <div>
        <p class="h-title">Scanned Bill Details</p>
        <p class="h-sub">ERCA · MoR · Printed Evidence Sheet</p>
      </div>
    </div>
    <div class="company">
      <div>${companyName ? companyName : '—'}</div>
      ${companyTin ? `<div>TIN: ${companyTin}</div>` : ''}
      ${companyAddress ? `<div>${companyAddress}</div>` : ''}
    </div>
  </div>

  <div class="meta">
    <div class="box"><div class="label">Bill Reference</div><div class="value">${bill.referenceNo ?? bill.telecomRef ?? bill.id}</div></div>
    <div class="box"><div class="label">Status</div><div class="value">${bill.status}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Field</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Payer</td><td>${bill.payer ?? '—'}</td></tr>
      <tr><td>Receiver</td><td>${bill.receiver ?? '—'}</td></tr>
      <tr><td>Bill Type</td><td>${bill.billType}</td></tr>
      <tr><td>Source / Bank</td><td>${bill.bankName ?? bill.source ?? '—'}</td></tr>
      <tr><td>Amount</td><td>${fmt(Number(bill.amount) || 0)} ${bill.currencyCode ?? ''}</td></tr>
      <tr><td>Paid At</td><td>${bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('en-ET') : '—'}</td></tr>
      ${bill.bankAccountNo ? `<tr><td>Account No.</td><td>${bill.bankAccountNo}</td></tr>` : ''}
      ${bill.bankAccountName ? `<tr><td>Account Name</td><td>${bill.bankAccountName}</td></tr>` : ''}
      ${bill.telecomRef ? `<tr><td>Telecom Ref</td><td>${bill.telecomRef}</td></tr>` : ''}
      ${bill.bankRef ? `<tr><td>Bank Portal Ref</td><td>${bill.bankRef}</td></tr>` : ''}
      ${bill.description ? `<tr><td>Description</td><td>${bill.description}</td></tr>` : ''}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td class="no-print" colspan="2">&nbsp;</td></tr>
      <tr><td>Printed Total</td><td style="text-align:right;font-weight:900">${fmt(Number(bill.amount) || 0)}</td></tr>
      <tr class="grand"><td>Currency</td><td style="text-align:right">${bill.currencyCode ?? ''}</td></tr>
    </table>
  </div>

  <div class="print-footer">
    <div>OVDS ovds · Scanned Bills</div>
    <div>Generated: ${new Date().toLocaleString()}</div>
  </div>
</div>
<script>setTimeout(() => { try{ window.focus(); }catch(e){}; window.print(); }, 200);</script>
</body></html>`;

                win.document.open();
                win.document.write(html);
                win.document.close();
              }}
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1"
              title="Print bill details"
            >
              <span>🖨️</span> Print
            </button>

            {bill.status === 'PENDING' && (
              <>
                <button
                  onClick={() => onStatusChange(bill.id, 'VERIFIED')}
                  className="flex-1 py-2.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={13} />
                  Verify
                </button>
                <button
                  onClick={() => onStatusChange(bill.id, 'REJECTED')}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle size={13} />
                  Reject
                </button>
              </>
            )}
            {bill.status === 'VERIFIED' && (
              <button
                onClick={() => onStatusChange(bill.id, 'EXPORTED')}
                className="flex-1 py-2.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
              >
                <Archive size={13} />
                Mark Exported
              </button>
            )}
          </div>
          <button
            onClick={() => onDelete(bill.id)}
            className="w-full py-2.5 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} />
            Delete Record
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------
export default function ScannedBills() {
  usePageTitle('Bill Scanner');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const { logExport } = useAuditLog();
  const { confirm } = useConfirm();

  const [bills, setBills] = useState<ScannedBill[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCapture, setShowCapture] = useState(false);
  const [selectedBill, setSelectedBill] = useState<ScannedBill | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const canWrite = can('expenses:write');

  const fetchBills = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId: selectedCompanyId,
        page: String(page),
        limit: String(LIMIT),
      });
      if (search) params.set('search', search);
      if (typeFilter) params.set('billType', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const r = await api.get(`/ovds/scanned-bills?${params}`);
      const d = r.data?.data;
      setBills(d?.items ?? []);
      setTotal(d?.total ?? 0);
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, page, search, typeFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const r = await api.get(
        `/ovds/scanned-bills/stats?companyId=${selectedCompanyId}`,
      );
      setStats(r.data?.data);
    } catch {
      /* silent */
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchBills();
    fetchStats();
  }, [fetchBills, fetchStats]);

  const handleSave = async (data: any) => {
    try {
      await api.post('/ovds/scanned-bills', {
        ...data,
        companyId: selectedCompanyId,
      });
      toast.success('Bill saved successfully');
      setShowCapture(false);
      fetchBills();
      fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save');
    }
  };

  const handleStatusChange = async (id: string, status: BillStatus) => {
    try {
      await api.patch(`/ovds/scanned-bills/${id}/status`, { status });
      setBills((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      if (selectedBill?.id === id)
        setSelectedBill((prev) => (prev ? { ...prev, status } : null));
      toast.success(`Marked as ${status.toLowerCase()}`);
      fetchStats();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: 'Delete Bill?',
        message: 'This cannot be undone.',
        variant: 'danger',
      }))
    )
      return;
    try {
      await api.delete(`/ovds/scanned-bills/${id}`);
      setBills((prev) => prev.filter((b) => b.id !== id));
      if (selectedBill?.id === id) setSelectedBill(null);
      toast.success('Deleted');
      fetchStats();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleExport = async (format: 'CSV' | 'JSON' | 'ERCA') => {
    const ids =
      selected.size > 0 ? Array.from(selected) : bills.map((b) => b.id);
    if (!ids.length) {
      toast.error('No bills to export');
      return;
    }
    try {
      const r = await api.post('/ovds/scanned-bills/export', {
        ids,
        format,
      });
      const d = r.data;
      if (format === 'CSV' && d.content) {
        const blob = new Blob([d.content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bills-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (
        (format === 'JSON' || format === 'ERCA') &&
        (d.content || d.data)
      ) {
        const content = d.content ?? JSON.stringify(d.data, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bills-${format.toLowerCase()}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      logExport('ScannedBills', format === 'CSV' ? 'csv' : 'xlsx', ids.length);
      toast.success(`Exported ${ids.length} bills as ${format}`);
      fetchBills();
    } catch {
      toast.error('Export failed');
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === bills.length ? new Set() : new Set(bills.map((b) => b.id)),
    );

  const totalAmount = bills.reduce((s, b) => s + Number(b.amount), 0);
  const pendingCount = bills.filter((b) => b.status === 'PENDING').length;
  const verifiedCount = bills.filter((b) => b.status === 'VERIFIED').length;
  const last30 = stats?.last30Days;
  // ISRF supply chain tax indicators
  const taxableBills = bills.filter(
    (b) => b.billType === 'BANK' && b.amount > 0,
  );
  const estimatedWHT = taxableBills.reduce(
    (sum, b) => sum + Number(b.amount) * 0.03,
    0,
  ); // 3% WHT
  const estimatedTOT = taxableBills.reduce(
    (sum, b) => sum + Number(b.amount) * 0.02,
    0,
  ); // 2% TOT

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-12">
      {/* ── OVDS Grid Hero ─────────────────────────────────────────── */}
      <GridHero
        title="Bill Scanner"
        subtitle="OCR-powered bank & telecom bill capture, storage and reconciliation · Banking & ovds · Retail & E-commerce · Supply Chain · Manufacturing & Logistics · Consumer Insights"
        crumbs={[{ label: 'Purchases' }, { label: 'Bill Scanner' }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="ovds-btn-secondary flex items-center gap-2">
                <Download size={14} strokeWidth={2.5} /> Export{' '}
                <ChevronRight size={12} className="rotate-90" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 ovds-widget-card py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl">
                {(['CSV', 'JSON', 'ERCA'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleExport(f)}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    {f === 'ERCA' ? 'ERCA JSON' : f}
                  </button>
                ))}
              </div>
            </div>
            {canWrite && (
              <button
                onClick={() => setShowCapture(true)}
                className="ovds-btn-primary flex items-center gap-2"
              >
                <Zap size={14} strokeWidth={2.5} /> Scan Bill
              </button>
            )}
          </div>
        }
        sliderSlot={
          <PipelineStageHeader
            stages={[
              {
                key: 'PENDING',
                label: 'Pending',
                count: bills.filter((b) => b.status === 'PENDING').length,
                color: '#f59e0b',
              },
              {
                key: 'VERIFIED',
                label: 'Verified',
                count: bills.filter((b) => b.status === 'VERIFIED').length,
                color: '#00E784',
                completed: true,
              },
              {
                key: 'EXPORTED',
                label: 'Exported',
                count: bills.filter((b) => b.status === 'EXPORTED').length,
                color: '#00E784',
              },
              {
                key: 'REJECTED',
                label: 'Rejected',
                count: bills.filter((b) => b.status === 'REJECTED').length,
                color: '#ef4444',
              },
            ]}
          />
        }
      />

      {/* ── Context strip ──────────────────────────────────────────── */}
      <ContextStrip>
        <ContextPill
          leading={<ScanLine size={11} />}
          label={`${total} bills`}
        />
        {pendingCount > 0 && (
          <ContextPill
            variant="alert"
            label={`${pendingCount} pending review`}
          />
        )}
        {verifiedCount > 0 && (
          <ContextPill variant="success" label={`${verifiedCount} verified`} />
        )}
        {last30?.count > 0 && (
          <ContextPill
            variant="info"
            label={`${last30.count} this month`}
            className="ml-auto"
          />
        )}
      </ContextStrip>

      {/* ── KPI stat bar ───────────────────────────────────────────── */}
      <div className="dash-stat-grid">
        <div className="dash-stat-cell">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Bills</p>
          <p className="ovds-value-sm tabular-nums text-slate-800 dark:text-slate-100">
            {total}
          </p>
          <p className="ovds-caption">+0%</p>
        </div>
        <div className="dash-stat-cell">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Amount</p>
          <p className="ovds-value-sm tabular-nums text-slate-800 dark:text-slate-100">
            {fmt(totalAmount)}
          </p>
          <p className="ovds-caption">+0%</p>
        </div>
        <div className="dash-stat-cell">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pending Review</p>
          <p className="ovds-value-sm tabular-nums text-amber-600">
            {pendingCount}
          </p>
          <p className="ovds-caption">+0%</p>
        </div>
        <div className="dash-stat-cell">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Est. WHT</p>
          <p className="ovds-value-sm tabular-nums text-rose-600">
            {fmt(estimatedWHT)}
          </p>
          <p className="ovds-caption">+0%</p>
        </div>
      </div>
      {/* ISRF Tax Compliance Context Strip */}
      <ContextStrip>
        <ContextPill
          leading={<Zap size={11} />}
          label="ISRF Supply Chain Ready"
        />
        <ContextPill variant="info" label={`Est. TOT: ${fmt(estimatedTOT)}`} />
        <ContextPill
          variant="success"
          label={`${taxableBills.length} taxable items`}
        />
      </ContextStrip>

      {/* ── Filters + Table ────────────────────────────────────────── */}
      <div className="ovds-widget-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by reference, payer, bank…"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all dark:text-slate-200"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400"
              >
                <option value="">All Types</option>
                <option value="BANK">Bank</option>
                <option value="TELECOM">Telecom</option>
                <option value="INVOICE">Invoice</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPORTED">Exported</option>
              </select>
            </div>
          </div>
          {/* Status chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPORTED'] as const).map(
              (s) => (
                <button
                  key={s || 'ALL'}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-[var(--pro-azure)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {s || 'All'}
                </button>
              ),
            )}
            {selected.size > 0 && (
              <span className="ml-auto text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                {selected.size} selected
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <RefreshCw size={28} className="text-[var(--pro-azure)] animate-spin" />
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Loading bills…</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="py-20">
              <EmptyState
                message="No bills found"
                description="Scan a bank slip, telecom receipt, or invoice to get started."
              />
            </div>
          ) : (
            <table className="ovds-table w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selected.size === bills.length && bills.length > 0
                      }
                      onChange={toggleAll}
                      className="rounded border-slate-300 text-[var(--pro-azure)] focus:ring-teal-400"
                    />
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Bill
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Source
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">
                    Date
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Status
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {bills.map((bill) => {
                  const tm = TYPE_META[bill.billType];
                  const sm = STATUS_META[bill.status];
                  return (
                    <tr
                      key={bill.id}
                      className={`hover:bg-[var(--pro-azure-50)]/30 dark:hover:bg-green-900/10 transition-colors group ${selected.has(bill.id) ? 'bg-[var(--pro-azure-50)]/50 dark:bg-green-900/10' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selected.has(bill.id)}
                          onChange={() => toggleSelect(bill.id)}
                          className="rounded border-slate-300 text-[var(--pro-azure)] focus:ring-teal-400"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bill.billType === 'BANK' ? 'bg-[var(--pro-azure-100)] dark:bg-green-950/40' : bill.billType === 'TELECOM' ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-violet-100 dark:bg-violet-950/40'}`}
                          >
                            {bill.billType === 'BANK' ? (
                              <Building2
                                size={16}
                                className="text-[var(--pro-azure)]"
                              />
                            ) : bill.billType === 'TELECOM' ? (
                              <Smartphone
                                size={16}
                                className="text-amber-600"
                              />
                            ) : (
                              <FileText size={16} className="text-violet-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {bill.referenceNo ??
                                bill.telecomRef ??
                                bill.id.slice(0, 8).toUpperCase()}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${tm.color}`}
                              >
                                {tm.label}
                              </span>
                              {bill.ocrConfidence != null && (
                                <ConfBadge v={bill.ocrConfidence} />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {bill.bankName ?? bill.source ?? '—'}
                        </p>
                        {bill.payer && (
                          <p className="ovds-caption mt-0.5">{bill.payer}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="text-base font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                          {fmt(Number(bill.amount))}
                        </p>
                        <p className="ovds-caption">{bill.currencyCode}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="ovds-body text-slate-500">
                          {bill.paidAt
                            ? new Date(bill.paidAt).toLocaleDateString(
                                'en-ET',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                },
                              )
                            : '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${sm.color}`}
                        >
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedBill(bill)}
                            className="p-2 text-slate-400 hover:text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-900/20 rounded-lg transition-all"
                            title="View details"
                          >
                            <Eye size={15} />
                          </button>
                          {canWrite && bill.status === 'PENDING' && (
                            <button
                              onClick={() =>
                                handleStatusChange(bill.id, 'VERIFIED')
                              }
                              className="p-2 text-slate-400 hover:text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-900/20 rounded-lg transition-all"
                              title="Verify"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          {canWrite && (
                            <button
                              onClick={() => handleDelete(bill.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              page={page}
              total={total}
              pageSize={LIMIT}
              onChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showCapture && (
        <CaptureModal
          onClose={() => setShowCapture(false)}
          onSave={handleSave}
        />
      )}
      {selectedBill && (
        <DetailDrawer
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
