import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Camera, QrCode, FileText, Clipboard, Zap, CheckCircle2, AlertTriangle, Loader2, ArrowRight, RefreshCw, Search, Upload, ScanLine, Link2, Info, Eye, Clock, CheckCheck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useBusiness } from '../../context/businessContext';
import { useAuth } from '../../rbac/AuthContext';

type Tab = 'CAPTURE' | 'PENDING' | 'REVIEW';
type CaptureMode = 'SCREENSHOT' | 'CAMERA' | 'QR' | 'PASTE' | 'MANUAL';

interface MatchCandidate { type: 'INVOICE' | 'BILL'; id: string; number: string; amount: number; date: string; counterparty: string; score: number; method: string; signals: string[]; }
interface ReconciliationProposal { transactionId: string; transaction: { id: string; date: string; description: string; amount: number; type: string; reference: string | null; telecomRef: string | null; qrCode: string | null; voucherCode: string | null; bankName: string | null; counterparty: string | null; status: string; }; candidates: MatchCandidate[]; topMatch: MatchCandidate | null; autoReconcile: boolean; }
interface PendingTx { id: string; date: string; description: string; amount: number; type: string; reference: string | null; telecomRef: string | null; voucherCode: string | null; bankName: string | null; counterparty: string | null; matchScore: number; matchMethod: string | null; matchedInvoiceId: string | null; matchedBillId: string | null; hasProposedMatch: boolean; BankAccount: { name: string; bankName: string | null }; }
interface Stats { total: number; reconciled: number; pending: number; withProposedMatch: number; reconciliationRate: number; byAccount: { accountId: string; accountName: string; bankName: string | null; pendingCount: number; pendingAmount: number }[]; }
interface Props { onClose: () => void; onRefresh?: () => void; bankAccountId?: string; }

function parseReceiptText(text: string): Record<string, string> {
  const t = text.trim(); const result: Record<string, string> = {};
  const amtM = t.match(/(?:ETB|Birr|Amount[:\s]+|Br\.?\s*)[\s]*([\d,]+(?:\.\d{1,2})?)/i) ?? t.match(/([\d,]+(?:\.\d{1,2})?)(?:\s*ETB|\s*Birr)/i);
  if (amtM) result.amount = amtM[1].replace(/,/g, '');
  const refM = t.match(/(?:Ref(?:erence)?[:\s#]+|TXN[:\s]+|Transaction\s*(?:ID|No.?)[:\s]+|Receipt[:\s#]+|Voucher[:\s#]+)([\w-/]+)/i);
  if (refM) result.reference = refM[1];
  const teleM = t.match(/(?:telebirr|telecom)[^\n]*?([A-Z0-9]{7,12})/i);
  if (teleM) result.telecomRef = teleM[1];
  const dateM = t.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
  if (dateM) { const raw = dateM[0]; if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) { result.date = raw; } else {       const p = raw.split(/[-/]/); if (p.length === 3) { const yr = p[2].length === 2 ? '20' + p[2] : p[2]; result.date = yr + '-' + p[1].padStart(2,'0') + '-' + p[0].padStart(2,'0'); } } }
  const lc = t.toLowerCase();
  if (/\b(credit|received|deposited|incoming|credited)\b/.test(lc)) result.type = 'CREDIT';
  else if (/\b(debit|sent|paid|withdrawn|outgoing|debited)\b/.test(lc)) result.type = 'DEBIT';
  const bankM = t.match(/\b(CBE|Commercial Bank|Awash|Dashen|Abyssinia|Wegagen|United|Nib|Berhan|Bunna|Zemen|Oromia|Cooperative|Lion|Addis|Enat|Amhara|Hijra|Siinqee|Gadaa|Tsehay|Shabelle|Goh|Ahadu|Rammis|Sidama|Debub|Omo|Buna|Muger|Abay)\b/i);
  if (bankM) result.bankName = bankM[1];
  const lines = t.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 5 && !/^[\d\s-:./]+$/.test(l));
  if (lines.length > 0) result.description = lines[0].slice(0, 120);
  return result;
}

function parseQrString(raw: string): Record<string, string> {
  const s = raw.trim();
  if (s.startsWith('NBE-IQR|')) { const p = s.split('|'); return { format: 'NBE-IQR', merchantId: p[1] ?? '', amount: p[2] ?? '', invoiceNumber: p[3] ?? '', currency: p[4] ?? 'ETB', vat: p[5] ?? '' }; }
  const tags: Record<string, string> = {}; let pos = 0;
  while (pos < s.length - 3) { const tag = s.slice(pos, pos + 2); const len = parseInt(s.slice(pos + 2, pos + 4), 10); if (isNaN(len) || pos + 4 + len > s.length) break; tags[tag] = s.slice(pos + 4, pos + 4 + len); pos += 4 + len; }
  if (Object.keys(tags).length > 2) return { format: 'EMV', amount: tags['54'] ?? '', reference: tags['26']?.slice(4) ?? tags['38'] ?? '', bankName: tags['59'] ?? '', mcc: tags['52'] ?? '' };
  const p = s.split('|'); if (p.length >= 2) return { format: 'PIPE', bankName: p[0] ?? '', accountNo: p[1] ?? '', name: p[2] ?? '', amount: p[3] ?? '', invoiceNumber: p[4] ?? '' };
  if (/^[A-Z0-9]{7,12}$/.test(s)) return { format: 'TELEBIRR', telecomRef: s };
  return { format: 'UNKNOWN', raw: s };
}

const METHOD_COLORS: Record<string, string> = { EXACT_REF: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', QR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', FUZZY_REF: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', AMOUNT_DATE: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', AMOUNT_ONLY: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', MANUAL: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' };

function ScoreBadge({ score, method }: { score: number; method: string }) {
  const color = score >= 85 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-slate-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" />
          <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={((score / 100) * 75.4) + ' 75.4'} className={color} strokeLinecap="round" />
        </svg>
        <span className={'absolute inset-0 flex items-center justify-center text-[10px] font-medium ' + color}>{score}</span>
      </div>
      <span className={'px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase ' + (METHOD_COLORS[method] ?? METHOD_COLORS.AMOUNT_ONLY)}>{method?.replace('_', ' ')}</span>
    </div>
  );
}

const SmartReconciliationModal: React.FC<Props> = ({ onClose, onRefresh, bankAccountId: initBankAccountId }) => {
  const { selectedCompanyId } = useBusiness();
  const { can } = useAuth();
  const canWrite = can('bank_reconciliation:write');

  const [tab, setTab] = useState<Tab>('CAPTURE');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('PASTE');
  const [pasteText, setPasteText] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [parsedQr, setParsedQr] = useState<Record<string, string> | null>(null);
  const [captureForm, setCaptureForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: '', type: 'CREDIT' as 'CREDIT' | 'DEBIT', reference: '', telecomRef: '', voucherCode: '', bankName: '', counterparty: '', qrCode: '', notes: '', bankAccountId: initBankAccountId ?? '' });
  const [detectedFields, setDetectedFields] = useState<Set<string>>(new Set());
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingTx[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [reviewTx, setReviewTx] = useState<ReconciliationProposal | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);

  useEffect(() => {
    if (!selectedCompanyId) return;
    api.get('/ovds/bank-accounts?companyId=' + selectedCompanyId).then((r: any) => { const _ba = r.data?.data ?? r.data; setBankAccounts(Array.isArray(_ba) ? _ba : []); }).catch(() => {});
  }, [selectedCompanyId]);

  const loadStats = useCallback(async () => {
    if (!selectedCompanyId) return;
    try { const r = await api.get('/ovds/reconciliation/stats?companyId=' + selectedCompanyId); setStats(r.data?.data ?? r.data); } catch { /* silent */ }
  }, [selectedCompanyId]);

  const loadPending = useCallback(async (page = 1) => {
    if (!selectedCompanyId) return;
    setPendingLoading(true);
    try {
      const params = new URLSearchParams({ companyId: selectedCompanyId, page: String(page), limit: '20' });
      if (initBankAccountId) params.set('bankAccountId', initBankAccountId);
      const r = await api.get('/ovds/reconciliation/pending?' + params.toString());
      const d = r.data?.data ?? r.data;
      setPending(d.transactions ?? []); setPendingTotal(d.total ?? 0); setPendingPage(page);
    } catch { /* silent */ } finally { setPendingLoading(false); }
  }, [selectedCompanyId, initBankAccountId]);

  useEffect(() => { loadStats(); loadPending(1); }, [loadStats, loadPending]);

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); setCameraActive(true); }
    } catch (e: any) { setCameraError(e.message ?? 'Camera access denied'); }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); videoRef.current.srcObject = null; }
    setCameraActive(false);
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current; const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    setCapturedImage(c.toDataURL('image/jpeg', 0.92)); stopCamera();
  }, [stopCamera]);

  const runOcr = useCallback(async (base64: string, mimeType = 'image/jpeg') => {
    setOcrLoading(true);
    try {
      const r = await api.post('/ovds/bank-statements/ocr', { imageBase64: base64, mimeType });
      const result = r.data?.data ?? r.data;
      const txs: any[] = result.transactions ?? [];
      if (txs.length === 0) { toast.error('No transactions found in image'); return; }
      const first = txs[0]; const detected = new Set<string>(); const updates: Partial<typeof captureForm> = {};
      if (first.date) { updates.date = first.date; detected.add('date'); }
      if (first.description) { updates.description = first.description; detected.add('description'); }
      if (first.amount) { updates.amount = String(first.amount); detected.add('amount'); }
      if (first.type) { updates.type = first.type; detected.add('type'); }
      if (first.reference) { updates.reference = first.reference; detected.add('reference'); }
      if (result.bankName) { updates.bankName = result.bankName; detected.add('bankName'); }
      setCaptureForm(prev => ({ ...prev, ...updates })); setDetectedFields(detected);
      toast.success('Extracted ' + txs.length + ' transaction(s) — review fields below');
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'OCR failed — check API key'); } finally { setOcrLoading(false); }
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => { const dataUrl = e.target?.result as string; setCapturedImage(dataUrl); runOcr(dataUrl.split(',')[1], file.type); };
    reader.readAsDataURL(file);
  }, [runOcr]);

  const handleParsePaste = useCallback(() => {
    if (!pasteText.trim()) { toast.error('Paste text first'); return; }
    const parsed = parseReceiptText(pasteText); const detected = new Set<string>(); const updates: any = {};
    Object.entries(parsed).forEach(([k, v]) => { if (v && k in captureForm) { updates[k] = v; detected.add(k); } });
    setCaptureForm(prev => ({ ...prev, ...updates })); setDetectedFields(detected); setPasteText('');
    toast.success('Detected ' + detected.size + ' field(s) — review below');
  }, [pasteText, captureForm]);

  const handleParseQr = useCallback(() => {
    if (!qrInput.trim()) { toast.error('Enter QR data first'); return; }
    const parsed = parseQrString(qrInput.trim()); setParsedQr(parsed);
    const updates: any = { qrCode: qrInput.trim() }; const detected = new Set<string>(['qrCode']);
    if (parsed.amount) { updates.amount = parsed.amount; detected.add('amount'); }
    if (parsed.invoiceNumber) { updates.reference = parsed.invoiceNumber; detected.add('reference'); }
    if (parsed.bankName) { updates.bankName = parsed.bankName; detected.add('bankName'); }
    if (parsed.telecomRef) { updates.telecomRef = parsed.telecomRef; detected.add('telecomRef'); }
    if (parsed.reference) { updates.reference = parsed.reference; detected.add('reference'); }
    setCaptureForm(prev => ({ ...prev, ...updates })); setDetectedFields(detected);
    toast.success('QR parsed (' + parsed.format + ') — review fields');
  }, [qrInput]);

  const handleSaveCapture = useCallback(async () => {
    if (!captureForm.bankAccountId) { toast.error('Select a bank account'); return; }
    if (!captureForm.description) { toast.error('Description is required'); return; }
    if (!captureForm.amount || isNaN(Number(captureForm.amount))) { toast.error('Valid amount required'); return; }
    setSaving(true);
    try {
      const amount = captureForm.type === 'DEBIT' ? -Math.abs(Number(captureForm.amount)) : Math.abs(Number(captureForm.amount));
      await api.post('/ovds/bank-transactions', { bankAccountId: captureForm.bankAccountId, date: captureForm.date, description: captureForm.description, amount, type: captureForm.type, reference: captureForm.reference || undefined, telecomRef: captureForm.telecomRef || undefined, voucherCode: captureForm.voucherCode || undefined, bankName: captureForm.bankName || undefined, counterparty: captureForm.counterparty || undefined, qrCode: captureForm.qrCode || undefined, notes: captureForm.notes || undefined, companyId: selectedCompanyId });
      toast.success('Transaction captured — running smart match...');
      setCaptureForm(prev => ({ ...prev, description: '', amount: '', reference: '', telecomRef: '', voucherCode: '', bankName: '', counterparty: '', qrCode: '', notes: '' }));
      setDetectedFields(new Set()); setCapturedImage(null); setParsedQr(null);
      await loadPending(1); await loadStats(); onRefresh?.(); setTab('PENDING');
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Failed to save'); } finally { setSaving(false); }
  }, [captureForm, selectedCompanyId, loadPending, loadStats, onRefresh]);

  const handleRunReconciliation = useCallback(async (applyAuto = false) => {
    if (!selectedCompanyId) return;
    setRunLoading(true);
    try {
      const r = await api.post('/ovds/reconciliation/run', { companyId: selectedCompanyId, bankAccountId: initBankAccountId, applyAutoReconcile: applyAuto, dateWindowDays: 3 });
      const result = r.data?.data ?? r.data;
      toast.success(applyAuto ? 'Auto-reconciled ' + result.autoReconciled + ' transaction(s)' : 'Found matches for ' + (result.needsReview + result.autoReconciled) + ' of ' + result.processed + ' transactions');
      await loadPending(1); await loadStats(); onRefresh?.();
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Reconciliation failed'); } finally { setRunLoading(false); }
  }, [selectedCompanyId, initBankAccountId, loadPending, loadStats, onRefresh]);

  const openReview = useCallback(async (txId: string) => {
    setReviewLoading(true); setTab('REVIEW');
    try { const r = await api.get('/ovds/reconciliation/transaction/' + txId + '/proposals?companyId=' + selectedCompanyId); setReviewTx(r.data?.data ?? r.data); }
    catch { toast.error('Failed to load proposals'); } finally { setReviewLoading(false); }
  }, [selectedCompanyId]);

  const handleConfirmMatch = useCallback(async (matchType: 'INVOICE' | 'BILL', matchId: string) => {
    if (!reviewTx) return;
    try {
      await api.post('/ovds/reconciliation/transaction/' + reviewTx.transactionId + '/confirm', { matchType, matchId });
      toast.success('Match confirmed — transaction reconciled');
      setReviewTx(null); setTab('PENDING'); await loadPending(1); await loadStats(); onRefresh?.();
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Failed to confirm'); }
  }, [reviewTx, loadPending, loadStats, onRefresh]);

  const handleDismiss = useCallback(async () => {
    if (!reviewTx) return;
    try {
      await api.post('/ovds/reconciliation/transaction/' + reviewTx.transactionId + '/dismiss');
      toast.success('Transaction reconciled without match');
      setReviewTx(null); setTab('PENDING'); await loadPending(1); await loadStats(); onRefresh?.();
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Failed'); }
  }, [reviewTx, loadPending, loadStats, onRefresh]);

  const filteredPending = useMemo(() => pending.filter(tx => {
    if (!search) return true;
    return [tx.description, tx.reference, tx.telecomRef, tx.counterparty].some(f => f?.toLowerCase().includes(search.toLowerCase()));
  }), [pending, search]);

  const fieldCls = (name: string) => 'w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-teal-400/20 dark:text-white ' + (detectedFields.has(name) ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-500/40' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700');

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden border border-white/10">

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10/30"><Link2 className="text-white" size={20} /></div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">Smart Reconciliation</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:block">Multi-bank · QR · Telebirr · EMV · Reference Matching</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats && (
              <div className="hidden sm:flex items-center gap-4 mr-2">
                <div className="text-center"><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{stats.reconciliationRate}%</p><p className="text-[9px] text-slate-400 uppercase font-bold">Reconciled</p></div>
                <div className="text-center"><p className="text-sm font-semibold text-amber-500">{stats.pending}</p><p className="text-[9px] text-slate-400 uppercase font-bold">Pending</p></div>
                <div className="text-center"><p className="text-sm font-semibold text-emerald-500">{stats.withProposedMatch}</p><p className="text-[9px] text-slate-400 uppercase font-bold">Matched</p></div>
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"><X size={20} /></button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-5 sm:px-8 py-3 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto">
          {([{ id: 'CAPTURE', label: 'Capture', icon: <Camera size={14} /> }, { id: 'PENDING', label: 'Pending' + (stats?.pending ? ' (' + stats.pending + ')' : ''), icon: <Clock size={14} /> }, { id: 'REVIEW', label: 'Review', icon: <Eye size={14} /> }] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ' + (tab === t.id ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>{t.icon} {t.label}</button>
          ))}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button onClick={() => handleRunReconciliation(false)} disabled={runLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30 rounded-xl text-xs font-bold hover:bg-violet-100 transition-colors disabled:opacity-50">
              {runLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}<span className="hidden sm:inline">Find Matches</span>
            </button>
            <button onClick={() => handleRunReconciliation(true)} disabled={runLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-slate-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50">
              {runLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}<span className="hidden sm:inline">Auto-Reconcile</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ═══════════════════════════════════════════════════════════════
              CAPTURE TAB
          ═══════════════════════════════════════════════════════════════ */}
          {tab === 'CAPTURE' && (
            <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* Left: Mode + Input */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Capture Method</p>
                  <div className="grid grid-cols-5 gap-2">
                    {([{ id: 'PASTE', label: 'SMS/Text', icon: <Clipboard size={16} /> }, { id: 'SCREENSHOT', label: 'Screenshot', icon: <Upload size={16} /> }, { id: 'CAMERA', label: 'Camera', icon: <Camera size={16} /> }, { id: 'QR', label: 'QR Code', icon: <QrCode size={16} /> }, { id: 'MANUAL', label: 'Manual', icon: <FileText size={16} /> }] as { id: CaptureMode; label: string; icon: React.ReactNode }[]).map(m => (
                      <button key={m.id} onClick={() => setCaptureMode(m.id)} className={'flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 text-center transition-all ' + (captureMode === m.id ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-200')}>
                        {m.icon}<span className="text-[10px] font-medium uppercase leading-tight">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* PASTE */}
                {captureMode === 'PASTE' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                      <Info size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">Paste any bank SMS, telebirr notification, CBE/Awash/Dashen receipt, or transfer text. Fields are auto-extracted.</p>
                    </div>
                    <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={7} autoFocus
                      placeholder={"CBE Transfer Alert\nAmount: ETB 5,000.00\nRef: TXN20240115001\nDate: 2024-01-15\nCredited to your account\n\n— or telebirr —\nYou received ETB 1,200 from +251911234567\nTransaction ID: TB7X9K2M"}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-400/20 resize-none placeholder:text-slate-400" />
                    <button onClick={handleParsePaste} className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-500-dark transition-colors shadow-lg shadow-teal-500/20">
                      <Zap size={16} /> Extract Fields
                    </button>
                  </div>
                )}

                {/* SCREENSHOT */}
                {captureMode === 'SCREENSHOT' && (
                  <div className="space-y-3">
                    <input type="file" ref={fileRef} className="hidden" accept="image/*,application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                    {!capturedImage ? (
                      <div onClick={() => fileRef.current?.click()} className="w-full h-48 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl"><Upload size={28} className="text-slate-400" /></div>
                        <div className="text-center"><p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Click to upload screenshot</p><p className="text-xs text-slate-400">JPG, PNG, PDF — telebirr, CBE, Awash, Dashen, Abyssinia</p></div>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={capturedImage} alt="Captured" className="w-full max-h-48 object-contain bg-white dark:bg-slate-800" />
                        <button onClick={() => { setCapturedImage(null); setDetectedFields(new Set()); }} className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-900/90 rounded-xl text-slate-500 hover:text-rose-500 transition-colors"><X size={14} /></button>
                        {ocrLoading && (<div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center gap-2"><Loader2 size={20} className="animate-spin text-emerald-600 dark:text-emerald-400" /><span className="text-sm font-bold text-slate-700 dark:text-slate-200">Extracting with AI...</span></div>)}
                      </div>
                    )}
                    {capturedImage && !ocrLoading && (
                      <button onClick={() => { const b = capturedImage.split(',')[1]; runOcr(b); }} className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-500-dark transition-colors"><Zap size={16} /> Re-run OCR</button>
                    )}
                  </div>
                )}

                {/* CAMERA */}
                {captureMode === 'CAMERA' && (
                  <div className="space-y-3">
                    {cameraError && (<div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30"><AlertTriangle size={14} className="text-rose-500 shrink-0" /><p className="text-xs text-rose-600 dark:text-rose-400">{cameraError}</p></div>)}
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video">
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                      <canvas ref={canvasRef} className="hidden" />
                      {!cameraActive && !capturedImage && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-3"><div className="p-4 bg-white/10 rounded-2xl"><Camera size={32} className="text-white/60" /></div><p className="text-white/60 text-sm font-bold">Camera not started</p></div>)}
                      {capturedImage && <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-contain" />}
                      {cameraActive && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-8 border-2 border-white/30 rounded-2xl" />
                          <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-emerald-600 rounded-tl-lg" />
                          <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-emerald-600 rounded-tr-lg" />
                          <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-emerald-600 rounded-bl-lg" />
                          <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-emerald-600 rounded-br-lg" />
                          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-emerald-50/50 dark:bg-emerald-950/100 animate-pulse" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!cameraActive ? (
                        <button onClick={startCamera} className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-500-dark transition-colors"><Camera size={16} /> Start Camera</button>
                      ) : (
                        <><button onClick={captureFrame} className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-500-dark transition-colors"><ScanLine size={16} /> Capture</button><button onClick={stopCamera} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">Stop</button></>
                      )}
                      {capturedImage && !ocrLoading && (<button onClick={() => { const b = capturedImage.split(',')[1]; runOcr(b); }} className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-500-dark transition-colors"><Zap size={16} /> Extract</button>)}
                    </div>
                  </div>
                )}

                {/* QR */}
                {captureMode === 'QR' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                      <QrCode size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">Paste EMV QR, NBE-IQR, telebirr QR, or pipe-delimited bank QR. Supports all Ethiopian bank QR formats per NBE Directive SB/IoT/001/2021.</p>
                    </div>
                    <textarea value={qrInput} onChange={e => setQrInput(e.target.value)} rows={5}
                      placeholder={"NBE-IQR|Ovds-01|5000.00|INV-2026-0042|ETB|750.00\n\n— or EMV TLV —\n000201010211...\n\n— or telebirr ref —\nTB7X9K2M"}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-400/20 resize-none" />
                    <button onClick={handleParseQr} className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-500-dark transition-colors"><QrCode size={16} /> Parse QR</button>
                    {parsedQr && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 space-y-2">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Parsed — {parsedQr.format}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(parsedQr).filter(([k]) => k !== 'format').map(([k, v]) => (
                            <div key={k} className="bg-white dark:bg-slate-900 rounded-xl p-2 border border-emerald-100 dark:border-emerald-900/30">
                              <p className="text-[10px] font-medium text-slate-400 uppercase">{k}</p>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Detected badge */}
                {detectedFields.size > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{detectedFields.size} field(s) auto-filled — highlighted in green below</p>
                    <button onClick={() => setDetectedFields(new Set())} className="ml-auto text-emerald-500 hover:text-emerald-700"><X size={12} /></button>
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setCaptureForm(p => ({ ...p, type: 'CREDIT' }))} className={'py-3 rounded-lg text-sm font-medium transition-all ' + (captureForm.type === 'CREDIT' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>+ Credit (In)</button>
                    <button type="button" onClick={() => setCaptureForm(p => ({ ...p, type: 'DEBIT' }))} className={'py-3 rounded-lg text-sm font-medium transition-all ' + (captureForm.type === 'DEBIT' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>− Debit (Out)</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Date *</label><input type="date" value={captureForm.date} onChange={e => setCaptureForm(p => ({ ...p, date: e.target.value }))} className={fieldCls('date')} /></div>
                    <div><label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Amount (ETB) *</label><input type="number" value={captureForm.amount} onChange={e => setCaptureForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" min="0.01" step="0.01" className={fieldCls('amount')} /></div>
                  </div>
                  <div><label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Description *</label><input type="text" value={captureForm.description} onChange={e => setCaptureForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Invoice payment received" className={fieldCls('description')} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Reference / TXN</label><input type="text" value={captureForm.reference} onChange={e => setCaptureForm(p => ({ ...p, reference: e.target.value }))} placeholder="TXN20240115001" className={fieldCls('reference')} /></div>
                    <div><label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Telebirr Ref</label><input type="text" value={captureForm.telecomRef} onChange={e => setCaptureForm(p => ({ ...p, telecomRef: e.target.value }))} placeholder="TB7X9K2M" className={fieldCls('telecomRef')} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Voucher / Cheque</label><input type="text" value={captureForm.voucherCode} onChange={e => setCaptureForm(p => ({ ...p, voucherCode: e.target.value }))} placeholder="CHQ-001234" className={fieldCls('voucherCode')} /></div>
                    <div><label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Bank Name</label><input type="text" value={captureForm.bankName} onChange={e => setCaptureForm(p => ({ ...p, bankName: e.target.value }))} placeholder="CBE, Awash, Dashen..." className={fieldCls('bankName')} /></div>
                  </div>
                  <div><label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Counterparty</label><input type="text" value={captureForm.counterparty} onChange={e => setCaptureForm(p => ({ ...p, counterparty: e.target.value }))} placeholder="Payer / payee name" className={fieldCls('counterparty')} /></div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Bank Account *</label>
                    <select value={captureForm.bankAccountId} onChange={e => setCaptureForm(p => ({ ...p, bankAccountId: e.target.value }))} className={fieldCls('bankAccountId')}>
                      <option value="">Select bank account...</option>
                      {bankAccounts.map((a: any) => (<option key={a.id} value={a.id}>{a.name} — {a.bankName}</option>))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right: Info + Save */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <h4 className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-4"><Zap size={14} /> Smart Matching</h4>
                  <ul className="space-y-3">
                    {[['QR Code', 'NBE-IQR, EMV TLV, telebirr QR — highest confidence'], ['Exact Ref', 'Transaction ID, TXN, receipt number — 95%+ match'], ['Telebirr Ref', 'telebirr transaction ID cross-referenced — 97%+ match'], ['Voucher', 'Cheque / bank voucher number — 93%+ match'], ['Amount + Date', 'Amount within 1 ETB + date ±3 days — 65% match']].map(([title, desc]) => (
                      <li key={title} className="flex gap-3 text-xs text-slate-600 dark:text-slate-400 leading-tight">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong className="text-slate-700 dark:text-slate-200">{title}:</strong> {desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="text-slate-800 dark:text-white font-semibold text-xs uppercase tracking-wider mb-3">Supported Banks</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {['CBE', 'Awash', 'Dashen', 'Abyssinia', 'Wegagen', 'United', 'Nib', 'Berhan', 'Bunna', 'Zemen', 'telebirr'].map(b => (
                      <span key={b} className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-500">{b}</span>
                    ))}
                  </div>
                </div>

                <button onClick={handleSaveCapture} disabled={saving || !canWrite} className="w-full flex items-center justify-center gap-2 py-4 bg-teal-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/20 dark:shadow-blue-600/10/25 hover:bg-teal-500-dark disabled:opacity-50 transition-all">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {saving ? 'Saving...' : 'Capture & Find Match'}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PENDING TAB
          ═══════════════════════════════════════════════════════════════ */}
          {tab === 'PENDING' && (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Stats row */}
              {stats && (
                <div className="ovds-grid-layout cols-4">
                  {[{ label: 'Total', val: stats.total, color: 'text-slate-700 dark:text-slate-200' }, { label: 'Reconciled', val: stats.reconciled, color: 'text-emerald-600' }, { label: 'Pending', val: stats.pending, color: 'text-amber-500' }, { label: 'Proposed', val: stats.withProposedMatch, color: 'text-emerald-600' }].map(s => (
                    <div key={s.label} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                      <p className={'text-2xl font-semibold font-mono ' + s.color}>{s.val}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Search + refresh */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input type="text" placeholder="Search description, reference, telebirr ref..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-white" />
                </div>
                <button onClick={() => loadPending(pendingPage)} disabled={pendingLoading} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors disabled:opacity-50">
                  <RefreshCw size={16} className={pendingLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Transaction list */}
              {pendingLoading && pending.length === 0 ? (
                <div className="flex items-center justify-center py-16 gap-3"><Loader2 size={20} className="animate-spin text-emerald-600 dark:text-emerald-400" /><span className="text-sm text-slate-500">Loading transactions...</span></div>
              ) : filteredPending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <CheckCircle2 size={40} className="text-emerald-400" />
                  <p className="font-bold text-slate-600 dark:text-slate-300">All transactions reconciled</p>
                  <p className="text-xs text-slate-400">No pending transactions found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPending.map(tx => (
                    <div key={tx.id} className={'p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ' + (tx.hasProposedMatch ? 'bg-emerald-50/50 dark:bg-emerald-900/5 border-emerald-100 dark:border-emerald-900/30' : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800')} onClick={() => openReview(tx.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ' + (tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400')}>{tx.type}</span>
                            {tx.BankAccount?.bankName && <span className="text-[9px] text-slate-400 font-bold">{tx.BankAccount.bankName}</span>}
                            {tx.telecomRef && <span className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-full text-[10px] font-medium">telebirr</span>}
                          </div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{tx.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</span>
                            {tx.reference && <span className="text-[10px] text-slate-400 font-mono">Ref: {tx.reference}</span>}
                            {tx.telecomRef && <span className="text-[10px] text-violet-500 font-mono">{tx.telecomRef}</span>}
                            {tx.voucherCode && <span className="text-[10px] text-amber-500 font-mono">Vchr: {tx.voucherCode}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className={'text-sm font-semibold ' + (tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600')}>
                              {tx.type === 'CREDIT' ? '+' : '−'} ETB {Math.abs(tx.amount).toLocaleString()}
                            </p>
                            {tx.hasProposedMatch && tx.matchScore > 0 && <ScoreBadge score={tx.matchScore} method={tx.matchMethod ?? 'AMOUNT_ONLY'} />}
                          </div>
                          <ArrowRight size={16} className="text-slate-300 dark:text-slate-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pendingTotal > 20 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-400">{pendingTotal} total · page {pendingPage}</p>
                  <div className="flex gap-2">
                    <button onClick={() => loadPending(pendingPage - 1)} disabled={pendingPage <= 1 || pendingLoading} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40">Prev</button>
                    <button onClick={() => loadPending(pendingPage + 1)} disabled={pendingPage * 20 >= pendingTotal || pendingLoading} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              REVIEW TAB
          ═══════════════════════════════════════════════════════════════ */}
          {tab === 'REVIEW' && (
            <div className="p-4 sm:p-6 space-y-5">
              {reviewLoading && (
                <div className="flex items-center justify-center py-20 gap-3"><Loader2 size={24} className="animate-spin text-emerald-600 dark:text-emerald-400" /><span className="text-sm text-slate-500">Loading match proposals...</span></div>
              )}
              {!reviewLoading && !reviewTx && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Eye size={40} className="text-slate-300 dark:text-slate-600" />
                  <p className="font-bold text-slate-500">Select a transaction from Pending tab to review</p>
                  <button onClick={() => setTab('PENDING')} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-500-dark transition-colors">Go to Pending</button>
                </div>
              )}
              {!reviewLoading && reviewTx && (
                <>
                  {/* Transaction card */}
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ' + (reviewTx.transaction.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>{reviewTx.transaction.type}</span>
                          {reviewTx.transaction.bankName && <span className="text-xs text-slate-400 font-bold">{reviewTx.transaction.bankName}</span>}
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-white text-base">{reviewTx.transaction.description}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(reviewTx.transaction.date).toLocaleDateString()}</p>
                        <div className="flex flex-wrap gap-3 mt-3">
                          {reviewTx.transaction.reference && (<div className="flex items-center gap-1.5"><span className="text-[10px] font-medium text-slate-400 uppercase">Ref</span><span className="text-xs font-mono text-slate-600 dark:text-slate-300">{reviewTx.transaction.reference}</span></div>)}
                          {reviewTx.transaction.telecomRef && (<div className="flex items-center gap-1.5"><span className="text-[10px] font-medium text-violet-400 uppercase">Telebirr</span><span className="text-xs font-mono text-violet-600 dark:text-violet-400">{reviewTx.transaction.telecomRef}</span></div>)}
                          {reviewTx.transaction.voucherCode && (<div className="flex items-center gap-1.5"><span className="text-[10px] font-medium text-amber-400 uppercase">Voucher</span><span className="text-xs font-mono text-amber-600 dark:text-amber-400">{reviewTx.transaction.voucherCode}</span></div>)}
                          {reviewTx.transaction.qrCode && (<div className="flex items-center gap-1.5"><QrCode size={12} className="text-emerald-400" /><span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-[120px]">{reviewTx.transaction.qrCode.slice(0, 20)}...</span></div>)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={'text-2xl font-semibold font-mono ' + (reviewTx.transaction.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600')}>
                          {reviewTx.transaction.type === 'CREDIT' ? '+' : '−'} ETB {Math.abs(reviewTx.transaction.amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Match candidates */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                      {reviewTx.candidates.length > 0 ? reviewTx.candidates.length + ' Match Candidate(s)' : 'No Matches Found'}
                    </h3>
                    {reviewTx.candidates.length === 0 ? (
                      <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                        <AlertTriangle size={24} className="text-amber-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No matching invoices or bills found</p>
                        <p className="text-xs text-slate-400 mt-1">You can still reconcile this transaction without a match</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reviewTx.candidates.map((c, i) => (
                          <div key={c.id} className={'p-4 rounded-2xl border transition-all ' + (i === 0 && reviewTx.autoReconcile ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50')}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ' + (c.type === 'INVOICE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400')}>{c.type}</span>
                                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{c.number}</span>
                                  {i === 0 && reviewTx.autoReconcile && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-[10px] font-medium">TOP MATCH</span>}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{c.counterparty}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{new Date(c.date).toLocaleDateString()}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {c.signals.map((s, si) => (<span key={si} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-[9px] text-slate-500 dark:text-slate-400">{s}</span>))}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">ETB {c.amount.toLocaleString()}</p>
                                <ScoreBadge score={c.score} method={c.method} />
                                <button onClick={() => handleConfirmMatch(c.type, c.id)} disabled={!canWrite} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-500-dark transition-colors disabled:opacity-50">
                                  <CheckCircle2 size={12} /> Confirm
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => { setReviewTx(null); setTab('PENDING'); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">← Back</button>
                    <button onClick={handleDismiss} disabled={!canWrite} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors disabled:opacity-50">
                      <CheckCheck size={14} /> Reconcile Without Match
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SmartReconciliationModal;











