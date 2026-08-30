import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import {
  AlertCircle, CheckCircle, Download, Landmark,
  RefreshCw, Search, TrendingDown, TrendingUp, Trash2,
  Upload, X, XCircle, ShieldCheck, FileText, ScanLine,
  Eye, Edit2, Receipt, FileSpreadsheet, FileCode,
} from 'lucide-react';

// -- Types ---------------------------------------------------------------------
type TxType   = 'CREDIT' | 'DEBIT';
type TxStatus = 'pending' | 'error' | 'matched';
type Mode     = 'bank-csv' | 'bank-ofx-mt940' | 'scan-bill';
type ScanTarget = 'INVOICE' | 'BILL';

interface ImportRow {
  date:        string;
  description: string;
  amount:      number;
  type:        TxType;
  reference?:  string;
  status:      TxStatus;
  error?:      string;
  selected:    boolean;
}

interface BankAccount {
  id:            string;
  name:          string;
  accountNumber?: string;
}

// Parsed row returned by the ingestion pipeline
interface ScannedRow {
  rowIndex:      number;
  date?:         string;
  description?:  string;
  amount?:       number;
  type?:         string;
  reference?:    string;
  customerName?: string;
  invoiceNumber?: string;
  vatAmount?:    number;
  currencyCode?: string;
  paymentSource?: string;
  bankName?:     string;
  telecomRef?:   string;
  confidence:    number;
  isDuplicate?:  boolean;
  // editable overrides
  _date?:        string;
  _description?: string;
  _amount?:      string;
  _editing?:     boolean;
  _committed?:   boolean;
  _error?:       string;
}

// -- Component -----------------------------------------------------------------
const BankStatementImport: React.FC = () => {
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();

  // -- Mode selector — reads ?mode=scan-bill from URL ------------------------
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get('mode') === 'scan-bill' ? 'scan-bill' : 'bank-csv',
  );

  // Sync mode if URL param changes (e.g. navigating from a deep link)
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'scan-bill') setMode('scan-bill');
  }, [searchParams]);

  usePageTitle(mode === 'scan-bill' ? 'Scan Bill / Invoice' : 'Bank Statement Import');

  // -- Bank CSV state ---------------------------------------------------------
  const [step, setStep]               = useState<'upload' | 'review' | 'done'>('upload');
  const [rows, setRows]               = useState<ImportRow[]>([]);
  const [fileName, setFileName]       = useState('');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankAccountId, setBankAccountId] = useState('');
  const [importing, setImporting]     = useState(false);
  const [imported, setImported]       = useState(0);
  const [errors, setErrors]           = useState(0);
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState<'ALL' | TxType>('ALL');
  const fileRef = useRef<HTMLInputElement>(null);

  // -- OFX/MT940 state --------------------------------------------------------
  const [ofxStep, setOfxStep]         = useState<'upload' | 'review' | 'done'>('upload');
  const [ofxFileName, setOfxFileName] = useState('');
  const [ofxRows, setOfxRows]         = useState<ImportRow[]>([]);
  const [ofxRawContent, setOfxRawContent] = useState<string>('');
  const [ofxImporting, setOfxImporting] = useState(false);
  const [ofxImported, setOfxImported] = useState(0);
  const [ofxErrors, setOfxErrors]     = useState(0);
  const [ofxFormat, setOfxFormat]     = useState<'OFX' | 'MT940'>('OFX');
  const ofxFileRef = useRef<HTMLInputElement>(null);

  // -- Scan Bill/Invoice state ------------------------------------------------
  const [scanStep, setScanStep]       = useState<'upload' | 'review' | 'done'>('upload');
  const [scanTarget, setScanTarget]   = useState<ScanTarget>('BILL');
  const [scanFileName, setScanFileName] = useState('');
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanRows, setScanRows]       = useState<ScannedRow[]>([]);
  const [scanJobId, setScanJobId]     = useState<string | null>(null);
  const [scanning, setScanning]       = useState(false);
  const [scanCommitting, setScanCommitting] = useState(false);
  const [scanDone, setScanDone]       = useState({ committed: 0, failed: 0 });
  const scanFileRef = useRef<HTMLInputElement>(null);

  const canWrite = can('bank_reconciliation:write');
  void canWrite;

  React.useEffect(() => {
    if (!selectedCompanyId) return;
    api.get('/ovds/bank-accounts?companyId=' + selectedCompanyId)
      .then((r: any) => {
        const ba = r.data?.data ?? r.data;
        setBankAccounts(Array.isArray(ba) ? ba : []);
      })
      .catch(() => {});
  }, [selectedCompanyId]);

  // -- Reset helpers ----------------------------------------------------------
  const resetCsv = () => {
    setRows([]); setStep('upload'); setImported(0); setErrors(0); setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const resetOfx = () => {
    setOfxRows([]); setOfxStep('upload'); setOfxImported(0); setOfxErrors(0); setOfxFileName('');
    setOfxRawContent('');
    if (ofxFileRef.current) ofxFileRef.current.value = '';
  };

  const resetScan = () => {
    setScanStep('upload'); setScanRows([]); setScanJobId(null);
    setScanFileName(''); setScanPreview(null); setScanDone({ committed: 0, failed: 0 });
    if (scanFileRef.current) scanFileRef.current.value = '';
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    resetCsv();
    resetOfx();
    resetScan();
  };

  // -- CSV parsing ------------------------------------------------------------
  const parseCSV = useCallback((text: string): ImportRow[] => {
    const lines = text.split('\n').filter((l: string) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase().replace(/['"]/g, ''));
    return lines.slice(1).map((line: string): ImportRow | null => {
      const cols = line.split(',').map((c: string) => c.trim().replace(/^["']|["']$/g, ''));
      const get = (keys: string[]): string => {
        for (const k of keys) {
          const idx = headers.findIndex((h: string) => h.includes(k));
          if (idx >= 0 && cols[idx]) return cols[idx];
        }
        return '';
      };
      const dateStr = get(['date', 'txn date', 'transaction date', 'value date']);
      const desc    = get(['description', 'narration', 'particulars', 'details', 'memo']);
      const amtStr  = get(['amount', 'debit', 'credit', 'value']);
      const typeStr = get(['type', 'dr/cr', 'transaction type']);
      const ref     = get(['reference', 'ref', 'cheque', 'check']);
      const amount  = Math.abs(parseFloat(amtStr.replace(/[^0-9.-]/g, '')) || 0);
      const type: TxType = typeStr.toUpperCase().includes('CR') || typeStr.toUpperCase().includes('CREDIT')
        ? 'CREDIT' : 'DEBIT';
      const hasError = !dateStr || !desc || amount === 0;
      return {
        date: dateStr, description: desc, amount, type,
        reference: ref || undefined,
        status:    hasError ? 'error' : 'pending',
        error:     hasError
          ? ([!dateStr && 'missing date', !desc && 'missing description', amount === 0 && 'zero amount'] as (string | false)[])
              .filter(Boolean).join(', ')
          : undefined,
        selected: !hasError,
      };
    }).filter((r): r is ImportRow => !!(r?.description || r?.amount));
  }, []);

  const handleCsvFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const parsed = parseCSV((e.target?.result as string) ?? '');
      if (parsed.length === 0) { toast.error('No valid rows found. Check CSV format.'); return; }
      setRows(parsed);
      setStep('review');
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleCsvDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleCsvFile(file);
    else toast.error('Please drop a CSV file');
  }, [handleCsvFile]);

  const parseOfx = useCallback((text: string): ImportRow[] => {
    const rows: ImportRow[] = [];
    const tagRegex = /<([^>]+)>([^<]*)/g;
    const blocks = text.split(/<\/STMTTRN>/g);
    let match;

    for (const block of blocks) {
      if (!block.includes('<STMTTRN>')) continue;
      const values: Record<string, string> = {};
      while ((match = tagRegex.exec(block)) !== null) {
        values[match[1].trim()] = match[2].trim();
      }

      const trnType = (values.TRNTYPE || '').toUpperCase();
      const rawAmount = parseFloat(values.TRNAMT || '0');
      const amount = isNaN(rawAmount) ? 0 : rawAmount;
      const type: TxType = trnType === 'DEBIT' || amount < 0 ? 'DEBIT' : 'CREDIT';
      const absAmount = Math.abs(amount);

      let dateStr = values.DTPOSTED || '';
      if (dateStr.length > 14) dateStr = dateStr.slice(0, 14);
      else if (dateStr.length > 8) dateStr = dateStr.slice(0, 8);
      const date = dateStr
        ? `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
        : '';

      const name = values.NAME || values.PAYEE || '';
      const memo = values.MEMO || '';
      const description = memo ? `${name} — ${memo}` : name || 'OFX Import';
      const reference = values.FITID || values.CHECKNUM || undefined;
      const hasError = !date || !description || absAmount === 0;

      rows.push({
        date,
        description,
        amount: absAmount,
        type,
        reference,
        status: hasError ? 'error' : 'pending',
        error: hasError
          ? ([!date && 'missing date', !description && 'missing description', absAmount === 0 && 'zero amount'] as (string | false)[])
              .filter(Boolean).join(', ')
          : undefined,
        selected: !hasError,
      });
    }
    return rows;
  }, []);

  const parseMt940 = useCallback((text: string): ImportRow[] => {
    const rows: ImportRow[] = [];
    const lines = text.split(/\r?\n/);
    const transactions: Record<string, Record<string, string>> = {};
    let currentRef: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;
      const tag = trimmed.slice(0, colonIdx);
      const value = trimmed.slice(colonIdx + 1).trim();

      if (tag === '20' || tag === '25') {
        currentRef = value;
        transactions[currentRef] = transactions[currentRef] || {};
      }
      if (currentRef) {
        transactions[currentRef][tag] = value;
      }
    }

    for (const [ref, tx] of Object.entries(transactions)) {
      const tag61 = tx['61'];
      if (!tag61) continue;

      const dateMatch = tag61.match(/^(\d{6})/);
      const date = dateMatch
        ? `${'20' + dateMatch[1].slice(0, 2)}-${dateMatch[1].slice(2, 4)}-${dateMatch[1].slice(4, 6)}`
        : '';

      const amountMatch = tag61.match(/[DC](\d{1,15}(,\d{0,2})?)$/);
      let amount = 0;
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(',', '.'));
      }
      const isDebit = tag61.includes('D');
      const type: TxType = isDebit ? 'DEBIT' : 'CREDIT';
      const absAmount = Math.abs(amount);

      const description = tx['86'] || tx['25'] || 'MT940 Import';
      const reference = ref;
      const hasError = !date || !description || absAmount === 0;

      rows.push({
        date,
        description,
        amount: absAmount,
        type,
        reference,
        status: hasError ? 'error' : 'pending',
        error: hasError
          ? ([!date && 'missing date', !description && 'missing description', absAmount === 0 && 'zero amount'] as (string | false)[])
              .filter(Boolean).join(', ')
          : undefined,
        selected: !hasError,
      });
    }
    return rows;
  }, []);

  const handleOfxFile = useCallback((file: File) => {
    setOfxFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const text = (e.target?.result as string) ?? '';
      setOfxRawContent(text);
      const parsed = ofxFormat === 'OFX' ? parseOfx(text) : parseMt940(text);
      if (parsed.length === 0) {
        toast.error('No valid transactions found. Check file format.');
        return;
      }
      setOfxRows(parsed);
      setOfxStep('review');
    };
    reader.readAsText(file);
  }, [ofxFormat, parseOfx, parseMt940]);

  const handleOfxDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.ofx') || file.name.endsWith('.qfx') || file.name.endsWith('.mt940'))) {
      handleOfxFile(file);
    } else {
      toast.error('Please drop an OFX, QFX, or MT940 file');
    }
  }, [handleOfxFile]);

  const toggleOfxRow = (i: number) =>
    setOfxRows(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));

  const toggleOfxAll = () => {
    const valid = ofxRows.filter(r => r.status !== 'error');
    const allSel = valid.every(r => r.selected);
    setOfxRows(prev => prev.map(r => r.status === 'error' ? r : { ...r, selected: !allSel }));
  };

  const deleteOfxRow = (i: number) =>
    setOfxRows(prev => prev.filter((_, idx) => idx !== i));

  const handleOfxImport = async () => {
    if (!bankAccountId) { toast.error('Select a bank account first'); return; }
    const selected = ofxRows.filter(r => r.selected && r.status !== 'error');
    if (selected.length === 0) { toast.error('No rows selected'); return; }
    setOfxImporting(true);
    let ok = 0, fail = 0;

    try {
      if (ofxFormat === 'OFX') {
        const res = await api.post(`/ovds/bank-accounts/${bankAccountId}/import-ofx`, {
          ofxContent: ofxRawContent,
          companyId: selectedCompanyId,
        });
        ok = res.data?.data?.count ?? selected.length;
      } else {
        const res = await api.post(`/ovds/bank-accounts/${bankAccountId}/import-mt940`, {
          mt940Content: ofxRawContent,
          companyId: selectedCompanyId,
        });
        ok = res.data?.data?.count ?? selected.length;
      }
      setOfxImported(ok);
      setOfxErrors(fail);
      setOfxStep('done');
      if (ok > 0) toast.success(`Imported ${ok} transaction${ok !== 1 ? 's' : ''}`);
      if (fail > 0) toast.error(`${fail} transaction${fail !== 1 ? 's' : ''} failed`);
    } catch {
      fail = selected.length;
      setOfxErrors(fail);
      setOfxStep('done');
      toast.error('Import failed');
    } finally {
      setOfxImporting(false);
    }
  };

  const toggleRow = (i: number) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));

  const toggleAll = () => {
    const valid = rows.filter(r => r.status !== 'error');
    const allSel = valid.every(r => r.selected);
    setRows(prev => prev.map(r => r.status === 'error' ? r : { ...r, selected: !allSel }));
  };

  const deleteRow = (i: number) =>
    setRows(prev => prev.filter((_, idx) => idx !== i));

  const handleCsvImport = async () => {
    if (!bankAccountId) { toast.error('Select a bank account first'); return; }
    const selected = rows.filter(r => r.selected && r.status !== 'error');
    if (selected.length === 0) { toast.error('No rows selected'); return; }
    setImporting(true);
    let ok = 0, fail = 0;
    for (const row of selected) {
      try {
        await api.post('/ovds/bank-transactions', {
          bankAccountId, date: row.date, description: row.description,
          amount: row.amount, type: row.type, reference: row.reference,
          companyId: selectedCompanyId,
        });
        ok++;
        setRows(prev => prev.map(r =>
          r.date === row.date && r.description === row.description && r.amount === row.amount
            ? { ...r, status: 'matched' as TxStatus } : r,
        ));
      } catch { fail++; }
    }
    setImported(ok); setErrors(fail); setImporting(false); setStep('done');
    if (ok > 0)   toast.success(`Imported ${ok} transaction${ok !== 1 ? 's' : ''}`);
    if (fail > 0) toast.error(`${fail} transaction${fail !== 1 ? 's' : ''} failed`);
  };

  // -- Scan Bill/Invoice handlers ---------------------------------------------
  const handleScanFile = useCallback(async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Supported formats: JPG, PNG, WebP, PDF');
      return;
    }
    setScanFileName(file.name);
    setScanning(true);

    // Build preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setScanPreview(url);
    } else {
      setScanPreview(null);
    }

    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = e => {
          const result = e.target?.result as string;
          // Strip the data URL prefix to get raw base64
          resolve(result.split(',')[1] ?? result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await api.post('/ovds/ingestion/scan', {
        sourceType: file.type === 'application/pdf' ? 'PDF' : 'IMAGE',
        targetType: scanTarget,
        payload: base64,
        mimeType: file.type,
        fileName: file.name,
        companyId: selectedCompanyId,
        autoCommitThreshold: 1.1,
      });

      const job = res.data?.data ?? res.data;
      const parsedRows: ScannedRow[] = (job.rows ?? []).map((r: any, i: number) => ({
        ...r,
        rowIndex: i,
        _date: r.date ?? '',
        _description: r.description ?? '',
        _amount: r.amount != null ? String(r.amount) : '',
      }));

      if (parsedRows.length === 0) {
        toast.error('No data could be extracted. Try a clearer image.');
        setScanning(false);
        return;
      }

      setScanJobId(job.jobId ?? job.id ?? null);
      setScanRows(parsedRows);
      setScanStep('review');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'OCR failed';
      toast.error(msg);
    } finally {
      setScanning(false);
    }
  }, [scanTarget, selectedCompanyId]);

  const handleScanDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleScanFile(file);
  }, [handleScanFile]);

  const updateScanRow = (i: number, field: '_date' | '_description' | '_amount', value: string) =>
    setScanRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const toggleScanEdit = (i: number) =>
    setScanRows(prev => prev.map((r, idx) => idx === i ? { ...r, _editing: !r._editing } : r));

  const deleteScanRow = (i: number) =>
    setScanRows(prev => prev.filter((_, idx) => idx !== i));

  const handleScanCommit = async () => {
    if (!scanJobId) { toast.error('No scan job found'); return; }
    setScanCommitting(true);
    let ok = 0, fail = 0;

    for (const row of scanRows) {
      if (row._committed) continue;
      try {
        await api.post(`/ovds/ingestion/jobs/${scanJobId}/commit-row`, {
          rowIndex: row.rowIndex,
          targetType: scanTarget,
          companyId: selectedCompanyId,
          overrides: {
            date:        row._date        || row.date,
            description: row._description || row.description,
            amount:      row._amount      ? parseFloat(row._amount) : row.amount,
          },
        });
        ok++;
        setScanRows(prev => prev.map((r, i) =>
          r.rowIndex === row.rowIndex ? { ...r, _committed: true } : r,
        ));
      } catch (err: any) {
        fail++;
        const msg = err?.response?.data?.message ?? 'Failed';
        setScanRows(prev => prev.map(r =>
          r.rowIndex === row.rowIndex ? { ...r, _error: msg } : r,
        ));
      }
    }

    setScanDone({ committed: ok, failed: fail });
    setScanCommitting(false);
    setScanStep('done');
    if (ok > 0)   toast.success(`${ok} ${scanTarget.toLowerCase()}${ok !== 1 ? 's' : ''} saved`);
    if (fail > 0) toast.error(`${fail} failed`);
  };

  // -- Derived CSV values -----------------------------------------------------
  const filteredRows = rows.filter(r => {
    const ms = !search
      || r.description.toLowerCase().includes(search.toLowerCase())
      || (r.reference ?? '').toLowerCase().includes(search.toLowerCase());
    const mt = typeFilter === 'ALL' || r.type === typeFilter;
    return ms && mt;
  });

  const selectedCount = rows.filter(r => r.selected && r.status !== 'error').length;
  const errorCount    = rows.filter(r => r.status === 'error').length;
  const totalCredit   = rows.filter(r => r.type === 'CREDIT' && r.selected).reduce((s, r) => s + r.amount, 0);
  const totalDebit    = rows.filter(r => r.type === 'DEBIT'  && r.selected).reduce((s, r) => s + r.amount, 0);

  // -- Confidence badge helper ------------------------------------------------
  const ConfidenceBadge = ({ v }: { v: number }) => {
    const pct = Math.round(v * 100);
    const cls = pct >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : pct >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${cls}`}>
        {pct}%
      </span>
    );
  };

  // -- Render -----------------------------------------------------------------
  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="ovds-page-hero mb-2">
        <div className="ovds-page-hero-body">
          <div className="min-w-0">
            <h1 className="ovds-module-title">Import &amp; Scan</h1>
            <p className="ovds-caption mt-1">Import bank statements or scan bills and invoices using AI</p>
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        <button
          onClick={() => switchMode('bank-csv')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'bank-csv'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FileSpreadsheet size={15} /> Bank Statement (CSV)
        </button>
        <button
          onClick={() => switchMode('bank-ofx-mt940')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'bank-ofx-mt940'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FileCode size={15} /> OFX / MT940
        </button>
        <button
          onClick={() => switchMode('scan-bill')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'scan-bill'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ScanLine size={15} /> Scan Bill / Invoice
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* BANK CSV MODE                                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {mode === 'bank-csv' && (
        <>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {(['upload', 'review', 'done'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
                  step === s ? 'bg-emerald-500 text-white'
                  : (step === 'done' || (step === 'review' && s === 'upload'))
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  <span>{i + 1}</span><span className="capitalize">{s}</span>
                </div>
                {i < 2 && <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />}
              </React.Fragment>
            ))}
          </div>

          {/* Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDrop={handleCsvDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center cursor-pointer hover:border-emerald-600 hover:bg-emerald-50/30 transition-all"
              >
                <Upload size={36} className="text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-600 dark:text-slate-300">Drop CSV file here or click to browse</p>
                <p className="text-xs text-slate-400 mt-1">Supports CBE, Awash, Dashen, Abyssinia and standard CSV formats</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }} />
              </div>
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expected CSV Format</p>
                <code className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                  Date, Description, Amount, Type, Reference<br />
                  2026-04-01, Salary Payment, 15000, CREDIT, REF001
                </code>
              </div>
            </div>
          )}

          {/* Review */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{fileName}</p>
                  <p className="text-xs text-slate-400">{rows.length} rows · {errorCount} errors · {selectedCount} selected</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none">
                    <option value="">Select bank account…</option>
                    {bankAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}{a.accountNumber ? ` (${a.accountNumber})` : ''}</option>
                    ))}
                  </select>
                  <button onClick={resetCsv} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="ovds-grid-layout cols-4">
                {[
                  { label: 'Total Rows', value: rows.length, color: 'text-slate-700 dark:text-white' },
                  { label: 'Selected',   value: selectedCount, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Credits',    value: '+' + totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }), color: 'text-emerald-600' },
                  { label: 'Debits',     value: '-' + totalDebit.toLocaleString(undefined,  { minimumFractionDigits: 2 }), color: 'text-rose-600' },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-center">
                    <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions…"
                    className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400" />
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                  {(['ALL', 'CREDIT', 'DEBIT'] as const).map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === t ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                        <th className="px-4 py-3 text-left">
                          <input type="checkbox"
                            checked={rows.filter(r => r.status !== 'error').every(r => r.selected)}
                            onChange={toggleAll}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-teal-400/20" />
                        </th>
                        {['Date', 'Description', 'Type', 'Amount', 'Reference', 'Status', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((r, i) => {
                        const origIdx = rows.indexOf(r);
                        return (
                          <tr key={i} className={`border-b border-slate-100 dark:border-slate-800/50 transition-colors ${
                            r.status === 'error'   ? 'bg-rose-50/40 dark:bg-rose-950/10'
                            : r.status === 'matched' ? 'bg-emerald-50/40 dark:bg-emerald-950/10'
                            : r.selected             ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                          }`}>
                            <td className="px-4 py-2.5">
                              {r.status !== 'error' && (
                                <input type="checkbox" checked={r.selected} onChange={() => toggleRow(origIdx)}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-teal-400/20" />
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                              {r.date || <span className="text-rose-500">—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 max-w-[220px] truncate font-medium">
                              {r.description || <span className="text-rose-500 italic">missing</span>}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                r.type === 'CREDIT'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                              }`}>
                                {r.type === 'CREDIT' ? <TrendingUp size={9} /> : <TrendingDown size={9} />} {r.type}
                              </span>
                            </td>
                            <td className={`px-4 py-2.5 text-xs font-semibold tabular-nums ${
                              r.amount === 0 ? 'text-rose-500'
                              : r.type === 'CREDIT' ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                            }`}>
                              {r.type === 'CREDIT' ? '+' : '-'}{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500 font-mono">{r.reference ?? '—'}</td>
                            <td className="px-4 py-2.5">
                              {r.status === 'error'   && <span className="flex items-center gap-1 text-[10px] text-rose-600 font-bold"><XCircle size={11} /> {r.error}</span>}
                              {r.status === 'matched' && <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold"><CheckCircle size={11} /> Imported</span>}
                              {r.status === 'pending' && <span className="ovds-caption">Ready</span>}
                            </td>
                            <td className="px-4 py-2.5">
                              <button onClick={() => deleteRow(origIdx)}
                                className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={resetCsv}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
                  ← Back
                </button>
                <button onClick={handleCsvImport}
                  disabled={importing || selectedCount === 0 || !bankAccountId}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                  {importing ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  {importing ? 'Importing…' : `Import ${selectedCount} Transaction${selectedCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
              <div className={`w-20 h-20 rounded-xl flex items-center justify-center shadow-lg ${
                errors === 0 ? 'bg-emerald-100 dark:bg-emerald-950/40'
                : imported > 0 ? 'bg-amber-100 dark:bg-amber-950/40'
                : 'bg-rose-100 dark:bg-rose-950/40'
              }`}>
                {errors === 0
                  ? <CheckCircle size={36} className="text-emerald-600 dark:text-emerald-400" />
                  : imported > 0
                    ? <AlertCircle size={36} className="text-amber-600 dark:text-amber-400" />
                    : <XCircle size={36} className="text-rose-600 dark:text-rose-400" />}
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-800 dark:text-white">
                  {errors === 0 ? 'Import Complete' : imported > 0 ? 'Partially Imported' : 'Import Failed'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  {imported > 0 && <span className="text-emerald-600 font-bold">{imported} transaction{imported !== 1 ? 's' : ''} imported</span>}
                  {imported > 0 && errors > 0 && <span className="text-slate-400"> · </span>}
                  {errors > 0 && <span className="text-rose-600 font-bold">{errors} failed</span>}
                </p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <button onClick={resetCsv}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
                  <Upload size={14} /> Import Another File
                </button>
                <Link to="/banking/accounts"
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors">
                  <Landmark size={14} /> View Bank Accounts
                </Link>
                <Link to="/accounting"
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <ShieldCheck size={14} /> Reconcile Now
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* OFX / MT940 MODE                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {mode === 'bank-ofx-mt940' && (
        <>
          <div className="flex items-center gap-2">
            {(['upload', 'review', 'done'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
                  ofxStep === s ? 'bg-sky-500 text-white'
                  : (ofxStep === 'done' || (ofxStep === 'review' && s === 'upload'))
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  <span>{i + 1}</span><span className="capitalize">{s}</span>
                </div>
                {i < 2 && <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />}
              </React.Fragment>
            ))}
          </div>

          {/* Format selector + Upload */}
          {ofxStep === 'upload' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Format:</p>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  {(['OFX', 'MT940'] as const).map(f => (
                    <button key={f} onClick={() => setOfxFormat(f)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        ofxFormat === f
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}>
                      <FileCode size={12} /> {f}
                    </button>
                  ))}
                </div>
              </div>
              <div
                onDrop={handleOfxDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => ofxFileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center cursor-pointer hover:border-sky-600 hover:bg-sky-50/30 transition-all"
              >
                <Upload size={36} className="text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-600 dark:text-slate-300">Drop {ofxFormat} file here or click to browse</p>
                <p className="text-xs text-slate-400 mt-1">Supports {ofxFormat === 'OFX' ? '.OFX, .QFX (Open Financial Exchange)' : '.MT940 (SWIFT bank statement)'}</p>
                <input ref={ofxFileRef} type="file" accept={ofxFormat === 'OFX' ? '.ofx,.qfx' : '.mt940'} className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleOfxFile(f); }} />
              </div>
            </div>
          )}

          {/* Review */}
          {ofxStep === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{ofxFileName}</p>
                  <p className="text-xs text-slate-400">{ofxRows.length} rows · {ofxRows.filter(r => r.status === 'error').length} errors · {ofxRows.filter(r => r.selected && r.status !== 'error').length} selected</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none">
                    <option value="">Select bank account…</option>
                    {bankAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}{a.accountNumber ? ` (${a.accountNumber})` : ''}</option>
                    ))}
                  </select>
                  <button onClick={resetOfx} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="ovds-grid-layout cols-4">
                {[
                  { label: 'Total Rows', value: ofxRows.length, color: 'text-slate-700 dark:text-white' },
                  { label: 'Selected',   value: ofxRows.filter(r => r.selected && r.status !== 'error').length, color: 'text-sky-600 dark:text-sky-400' },
                  { label: 'Credits',    value: '+' + ofxRows.filter(r => r.type === 'CREDIT' && r.selected).reduce((s, r) => s + r.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 }), color: 'text-emerald-600' },
                  { label: 'Debits',     value: '-' + ofxRows.filter(r => r.type === 'DEBIT' && r.selected).reduce((s, r) => s + r.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 }), color: 'text-rose-600' },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-center">
                    <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                        <th className="px-4 py-3 text-left">
                          <input type="checkbox"
                            checked={ofxRows.filter(r => r.status !== 'error').every(r => r.selected)}
                            onChange={toggleOfxAll}
                            className="rounded border-slate-300 text-sky-600 focus:ring-teal-400/20" />
                        </th>
                        {['Date', 'Description', 'Type', 'Amount', 'Reference', 'Status', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ofxRows.map((r, i) => (
                        <tr key={i} className={`border-b border-slate-100 dark:border-slate-800/50 transition-colors ${
                          r.status === 'error'   ? 'bg-rose-50/40 dark:bg-rose-950/10'
                          : r.selected             ? 'bg-sky-50/20 dark:bg-sky-950/10' : ''
                        }`}>
                          <td className="px-4 py-2.5">
                            {r.status !== 'error' && (
                              <input type="checkbox" checked={r.selected} onChange={() => toggleOfxRow(i)}
                                className="rounded border-slate-300 text-sky-600 focus:ring-teal-400/20" />
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                            {r.date || <span className="text-rose-500">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 max-w-[220px] truncate font-medium">
                            {r.description || <span className="text-rose-500 italic">missing</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              r.type === 'CREDIT'
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                            }`}>
                              {r.type === 'CREDIT' ? <TrendingUp size={9} /> : <TrendingDown size={9} />} {r.type}
                            </span>
                          </td>
                          <td className={`px-4 py-2.5 text-xs font-semibold tabular-nums ${
                            r.amount === 0 ? 'text-rose-500'
                            : r.type === 'CREDIT' ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                          }`}>
                            {r.type === 'CREDIT' ? '+' : '-'}{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500 font-mono">{r.reference ?? '—'}</td>
                          <td className="px-4 py-2.5">
                            {r.status === 'error'   && <span className="flex items-center gap-1 text-[10px] text-rose-600 font-bold"><XCircle size={11} /> {r.error}</span>}
                            {r.status === 'matched' && <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold"><CheckCircle size={11} /> Imported</span>}
                            {r.status === 'pending' && <span className="ovds-caption">Ready</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <button onClick={() => deleteOfxRow(i)}
                              className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={resetOfx}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
                  ← Back
                </button>
                <button onClick={handleOfxImport}
                  disabled={ofxImporting || ofxRows.filter(r => r.selected && r.status !== 'error').length === 0 || !bankAccountId}
                  className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-600 disabled:opacity-50 transition-colors">
                  {ofxImporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  {ofxImporting ? 'Importing…' : `Import ${ofxRows.filter(r => r.selected && r.status !== 'error').length} Transaction${ofxRows.filter(r => r.selected && r.status !== 'error').length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {ofxStep === 'done' && (
            <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
              <div className={`w-20 h-20 rounded-xl flex items-center justify-center shadow-lg ${
                ofxErrors === 0 ? 'bg-sky-100 dark:bg-sky-950/40'
                : ofxImported > 0 ? 'bg-amber-100 dark:bg-amber-950/40'
                : 'bg-rose-100 dark:bg-rose-950/40'
              }`}>
                {ofxErrors === 0
                  ? <CheckCircle size={36} className="text-sky-600 dark:text-sky-400" />
                  : ofxImported > 0
                    ? <AlertCircle size={36} className="text-amber-600 dark:text-amber-400" />
                    : <XCircle size={36} className="text-rose-600 dark:text-rose-400" />}
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-800 dark:text-white">
                  {ofxErrors === 0 ? 'Import Complete' : ofxImported > 0 ? 'Partially Imported' : 'Import Failed'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  {ofxImported > 0 && <span className="text-sky-600 font-bold">{ofxImported} transaction{ofxImported !== 1 ? 's' : ''} imported</span>}
                  {ofxImported > 0 && ofxErrors > 0 && <span className="text-slate-400"> · </span>}
                  {ofxErrors > 0 && <span className="text-rose-600 font-bold">{ofxErrors} failed</span>}
                </p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <button onClick={resetOfx}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
                  <Upload size={14} /> Import Another File
                </button>
                <Link to="/banking/accounts"
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-600 transition-colors">
                  <Landmark size={14} /> View Bank Accounts
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SCAN BILL / INVOICE MODE                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {mode === 'scan-bill' && (
        <>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {(['upload', 'review', 'done'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
                  scanStep === s ? 'bg-violet-500 text-white'
                  : (scanStep === 'done' || (scanStep === 'review' && s === 'upload'))
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  <span>{i + 1}</span>
                  <span className="capitalize">{s === 'upload' ? 'Scan' : s}</span>
                </div>
                {i < 2 && <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />}
              </React.Fragment>
            ))}
          </div>

          {/* -- Scan Upload step -------------------------------------------- */}
          {scanStep === 'upload' && (
            <div className="space-y-4">
              {/* Target type selector */}
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Save as:</p>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  {(['BILL', 'INVOICE'] as const).map(t => (
                    <button key={t} onClick={() => setScanTarget(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        scanTarget === t
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}>
                      {t === 'BILL' ? <Receipt size={12} /> : <FileText size={12} />}
                      {t === 'BILL' ? 'Bill (Expense)' : 'Invoice (Revenue)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleScanDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => !scanning && scanFileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  scanning
                    ? 'border-violet-300 bg-violet-50/30 dark:bg-violet-950/10 cursor-wait'
                    : 'border-slate-200 dark:border-slate-700 cursor-pointer hover:border-violet-500 hover:bg-violet-50/30'
                }`}
              >
                {scanning ? (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw size={36} className="text-violet-400 animate-spin" />
                    <p className="font-bold text-violet-600 dark:text-violet-400">Scanning with AI…</p>
                    <p className="text-xs text-slate-400">Extracting data from your document</p>
                  </div>
                ) : (
                  <>
                    <ScanLine size={36} className="text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-600 dark:text-slate-300">
                      Drop image or PDF here, or click to browse
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports JPG, PNG, WebP, PDF · AI extracts vendor, amount, date, line items
                    </p>
                  </>
                )}
                <input ref={scanFileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleScanFile(f); }} />
              </div>

              {/* Tips */}
              <div className="ovds-grid-layout cols-3">
                {[
                  { icon: <Eye size={14} />, title: 'Clear image', desc: 'Good lighting, no blur, all text visible' },
                  { icon: <FileText size={14} />, title: 'Full document', desc: 'Include header, line items, and totals' },
                  { icon: <CheckCircle size={14} />, title: 'Review before saving', desc: 'AI extracts data — you confirm before committing' },
                ].map(tip => (
                  <div key={tip.title} className="flex items-start gap-3 bg-white dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                    <span className="text-violet-500 mt-0.5 shrink-0">{tip.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{tip.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -- Scan Review step -------------------------------------------- */}
          {scanStep === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{scanFileName}</p>
                  <p className="text-xs text-slate-400">
                    {scanRows.length} item{scanRows.length !== 1 ? 's' : ''} extracted ·
                    saving as <span className="font-semibold text-violet-600">{scanTarget}</span>
                  </p>
                </div>
                <button onClick={resetScan} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                  <X size={16} />
                </button>
              </div>

              {/* Image preview + extracted rows side by side on wide screens */}
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Preview panel */}
                {scanPreview && (
                  <div className="lg:w-64 shrink-0">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Document Preview</p>
                    <img src={scanPreview} alt="Scanned document"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 object-contain max-h-80" />
                  </div>
                )}

                {/* Extracted rows */}
                <div className="flex-1 space-y-3">
                  {scanRows.map((row, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-800 border rounded-xl p-4 space-y-3 transition-all ${
                      row._committed ? 'border-emerald-200 dark:border-emerald-800 opacity-60'
                      : row._error   ? 'border-rose-200 dark:border-rose-800'
                      : row.isDuplicate ? 'border-amber-200 dark:border-amber-800'
                      : 'border-slate-200 dark:border-slate-700'
                    }`}>
                      {/* Row header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">#{i + 1}</span>
                          <ConfidenceBadge v={row.confidence} />
                          {row.isDuplicate && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                              Possible duplicate
                            </span>
                          )}
                          {row._committed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <CheckCircle size={10} /> Saved
                            </span>
                          )}
                          {row._error && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                              <XCircle size={10} /> {row._error}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!row._committed && (
                            <button onClick={() => toggleScanEdit(i)}
                              className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-lg transition-colors"
                              title="Edit extracted data">
                              <Edit2 size={13} />
                            </button>
                          )}
                          {!row._committed && (
                            <button onClick={() => deleteScanRow(i)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Fields — view or edit mode */}
                      {row._editing ? (
                        <div className="ovds-grid-layout cols-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</label>
                            <input type="date" value={row._date ?? ''} onChange={e => updateScanRow(i, '_date', e.target.value)}
                              className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-teal-400" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description</label>
                            <input type="text" value={row._description ?? ''} onChange={e => updateScanRow(i, '_description', e.target.value)}
                              className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-teal-400" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount</label>
                            <input type="number" min="0" step="0.01" value={row._amount ?? ''} onChange={e => updateScanRow(i, '_amount', e.target.value)}
                              className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-teal-400" />
                          </div>
                          <div className="flex items-end">
                            <button onClick={() => toggleScanEdit(i)}
                              className="px-3 py-1.5 bg-violet-500 text-white rounded-lg text-xs font-bold hover:bg-violet-600 transition-colors">
                              Done
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                          {[
                            { label: 'Date',        value: row._date || row.date || '—' },
                            { label: 'Amount',      value: row._amount ? `${parseFloat(row._amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${row.currencyCode ?? 'ETB'}` : row.amount ? `${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${row.currencyCode ?? 'ETB'}` : '—' },
                            { label: 'Vendor',      value: row.customerName || '—' },
                            { label: 'Invoice #',   value: row.invoiceNumber || row.reference || '—' },
                            { label: 'VAT',         value: row.vatAmount ? row.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—' },
                            { label: 'Payment',     value: row.paymentSource || '—' },
                            { label: 'Bank',        value: row.bankName || '—' },
                            { label: 'Description', value: row._description || row.description || '—' },
                          ].map(f => (
                            <div key={f.label}>
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{f.label}</p>
                              <p className="text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">{f.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={resetScan}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
                  ← Back
                </button>
                <button onClick={handleScanCommit}
                  disabled={scanCommitting || scanRows.filter(r => !r._committed).length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-bold hover:bg-violet-600 disabled:opacity-50 transition-colors">
                  {scanCommitting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  {scanCommitting
                    ? 'Saving…'
                    : `Save ${scanRows.filter(r => !r._committed).length} ${scanTarget.toLowerCase()}${scanRows.filter(r => !r._committed).length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}

          {/* -- Scan Done step ---------------------------------------------- */}
          {scanStep === 'done' && (
            <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
              <div className={`w-20 h-20 rounded-xl flex items-center justify-center shadow-lg ${
                scanDone.failed === 0 ? 'bg-violet-100 dark:bg-violet-950/40'
                : scanDone.committed > 0 ? 'bg-amber-100 dark:bg-amber-950/40'
                : 'bg-rose-100 dark:bg-rose-950/40'
              }`}>
                {scanDone.failed === 0
                  ? <CheckCircle size={36} className="text-violet-600 dark:text-violet-400" />
                  : scanDone.committed > 0
                    ? <AlertCircle size={36} className="text-amber-600 dark:text-amber-400" />
                    : <XCircle size={36} className="text-rose-600 dark:text-rose-400" />}
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-800 dark:text-white">
                  {scanDone.failed === 0 ? 'Scan Complete' : scanDone.committed > 0 ? 'Partially Saved' : 'Save Failed'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  {scanDone.committed > 0 && (
                    <span className="text-violet-600 font-bold">
                      {scanDone.committed} {scanTarget.toLowerCase()}{scanDone.committed !== 1 ? 's' : ''} saved
                    </span>
                  )}
                  {scanDone.committed > 0 && scanDone.failed > 0 && <span className="text-slate-400"> · </span>}
                  {scanDone.failed > 0 && <span className="text-rose-600 font-bold">{scanDone.failed} failed</span>}
                </p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <button onClick={resetScan}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
                  <ScanLine size={14} /> Scan Another
                </button>
                {scanTarget === 'BILL' ? (
                  <Link to="/purchases/bills"
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-bold hover:bg-violet-600 transition-colors">
                    <Receipt size={14} /> View Bills
                  </Link>
                ) : (
                  <Link to="/sales/invoices"
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-bold hover:bg-violet-600 transition-colors">
                    <FileText size={14} /> View Invoices
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BankStatementImport;

