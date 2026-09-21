/**
 * Purchase Receipts — save time recording receipts by uploading images
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, RefreshCw, Download, Camera, Calendar, X, Upload, Loader2, FileImage } from 'lucide-react';
import React, { useState, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppTable, AppTh, AppTd, AppTr,
  Btn, SearchBar, EmptyState, Pagination, Amount,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';
import { normalizeOcrError } from '../utils';
import { fmtETB } from '../utils/ethiopianTax';

interface PurchaseReceipt {
  id: string;
  receiptNumber?: string;
  billId?: string;
  billNumber?: string;
  vendorName?: string;
  amount: number;
  paymentMethod?: string;
  paidAt: string;
  imageUrl?: string;
  status?: string;
  companyId?: string;
}

type FilterTab = 'ALL' | 'CASH' | 'BANK' | 'MOBILE';

// ── Upload Receipt Modal ─────────────────────────────────────────────────────

interface UploadReceiptModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  onSuccess: () => void;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,application/pdf';
const MAX_MB = 10;

const UploadReceiptModal: React.FC<UploadReceiptModalProps> = ({ open, onClose, companyId, onSuccess }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => { setFile(null); setPreview(null); };

  const handleFile = (f: File) => {
    if (f.size > MAX_MB * 1024 * 1024) { toast.error(`File exceeds ${MAX_MB} MB`); return; }
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null); // PDF — no preview
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !companyId) return;
    setUploading(true);
    try {
      // Convert to base64 for the scan endpoint
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve((e.target?.result as string).split(',')[1] ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await api.post('/ingestion/scan', {
        payload: base64,
        mimeType: file.type,
        fileName: file.name,
        targetType: 'BILL',
        companyId,
      });

      toast.success('Receipt uploaded — extracting data…');
      onSuccess();
      onClose();
      reset();
    } catch (err: any) {
      toast.error(normalizeOcrError(err?.response?.data?.message ?? 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className="fixed z-[201] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Camera size={15} className="text-sky-500" />
            <span className="font-bold text-[14px] text-slate-800 dark:text-slate-100">Upload Receipt</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-8 cursor-pointer transition-all
              ${dragOver ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-sky-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            role="button"
            aria-label="Upload receipt image"
          >
            <input ref={fileRef} type="file" accept={ACCEPT} className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            {preview ? (
              <img src={preview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
            ) : file ? (
              <div className="flex flex-col items-center gap-1.5">
                <FileImage size={32} className="text-sky-400" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{file.name}</span>
                <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={28} className="text-slate-300 dark:text-slate-600" />
                <div className="text-center">
                  <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Drop receipt here or click to browse</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP, HEIC or PDF · max {MAX_MB} MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Change file button */}
          {file && (
            <button type="button" onClick={reset}
              className="text-[11px] font-semibold text-sky-500 hover:text-sky-600 self-start -mt-2 transition-colors">
              Change file
            </button>
          )}

          <p className="text-[10px] text-slate-400 leading-relaxed">
            The image will be scanned using OCR to extract vendor, amount, and date.
            Review the extracted data in <strong>Import Center</strong> before committing.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!file || uploading}
            className="flex-1 py-2 rounded-xl text-[13px] font-bold text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
            {uploading ? <><Loader2 size={13} className="animate-spin" /> Scanning…</> : <><Upload size={13} /> Upload & Scan</>}
          </button>
        </div>
      </div>
    </>
  );
};

const PurchaseReceipts: React.FC = () => {
  usePageTitle('Purchase Receipts');
  const { selectedCompanyId } = useBusiness();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const PAGE_SIZE = 25;

  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['purchase-receipts', selectedCompanyId, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (selectedCompanyId) params.set('companyId', selectedCompanyId);
      return api.get(`/ovds/purchase-receipts?${params}`).then((r: any) => r.data).catch(() => null);
    },
    staleTime: 30_000,
  });

  const rows: PurchaseReceipt[] = useMemo(() => {
    const d = raw?.data ?? raw;
    return Array.isArray(d) ? d : (d?.data ?? []);
  }, [raw]);
  const total = raw?.total ?? rows.length;

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'CASH')   list = list.filter(r => r.paymentMethod === 'CASH');
    if (tab === 'BANK')   list = list.filter(r => ['BANK_TRANSFER', 'CHEQUE'].includes(r.paymentMethod ?? ''));
    if (tab === 'MOBILE') list = list.filter(r => ['TELEBIRR', 'CHAPA', 'CBE_BIRR'].includes(r.paymentMethod ?? ''));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => [r.receiptNumber, r.billNumber, r.vendorName].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',    value: rows.length,                                                    color: 'green' as const },
    { label: 'Cash',     value: rows.filter(r => r.paymentMethod === 'CASH').length,            color: 'sky' as const },
    { label: 'Bank',     value: rows.filter(r => ['BANK_TRANSFER','CHEQUE'].includes(r.paymentMethod ?? '')).length, color: 'violet' as const },
    { label: 'Total ETB',value: fmtETB(rows.reduce((s, r) => s + Number(r.amount ?? 0), 0)),   color: 'amber' as const },
  ], [rows]);

  const handleExport = () => {
    const headers = 'Receipt #,Bill #,Vendor,Amount,Method,Date\n';
    const csvRows = filtered.map(r =>
      `"${r.receiptNumber ?? ''}","${r.billNumber ?? ''}","${r.vendorName ?? ''}",${r.amount},"${r.paymentMethod ?? ''}","${r.paidAt}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `purchase-receipts-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const METHOD_CLS: Record<string, string> = {
    CASH:          'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
    BANK_TRANSFER: 'bg-sky-50 text-sky-700 border-sky-100',
    CHEQUE:        'bg-white text-slate-600 border-slate-200',
    TELEBIRR:      'bg-violet-50 text-violet-700 border-violet-100',
    CHAPA:         'bg-amber-50 text-amber-700 border-amber-100',
    CBE_BIRR:      'bg-teal-50 text-teal-700 border-teal-100',
  };

  return (
    <AppPage
      title="Purchase Receipts"
      subtitle="Save time recording receipts by just uploading their images"
      icon={<Receipt size={18} />}
      crumbs={[{ label: 'Purchase Receipts' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',    label: 'All',    count: rows.length },
            { key: 'CASH',   label: 'Cash',   count: rows.filter(r => r.paymentMethod === 'CASH').length },
            { key: 'BANK',   label: 'Bank',   count: rows.filter(r => ['BANK_TRANSFER','CHEQUE'].includes(r.paymentMethod ?? '')).length },
            { key: 'MOBILE', label: 'Mobile', count: rows.filter(r => ['TELEBIRR','CHAPA','CBE_BIRR'].includes(r.paymentMethod ?? '')).length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => refetch()}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Camera size={11} />} onClick={() => setShowUpload(true)}>Upload Receipt</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
        </>
      }
    >
      <div className="ovds-grid-layout cols-4 gap-sm">
        {kpiCells.map(k => (
          <div key={k.label} className={`bg-${k.color}-50 dark:bg-${k.color}-500/10 text-${k.color}-700 dark:text-${k.color}-400 rounded-xl p-3 text-center`}>
            <p className="text-xl font-bold">{k.value}</p>
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-wide mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-3 mt-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search purchase receipts…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} receipts</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Receipt #</AppTh>
          <AppTh>Bill</AppTh>
          <AppTh>Vendor</AppTh>
          <AppTh align="right">Amount</AppTh>
          <AppTh>Method</AppTh>
          <AppTh>Date</AppTh>
        </tr></thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={6} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={6}><EmptyState icon={<Receipt size={18} />} title="No purchase receipts" desc="Upload or record receipts for your vendor payments" /></td></tr>
          ) : filtered.map(r => (
            <AppTr key={r.id}>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <Receipt size={12} className="text-sky-500 shrink-0" />
                  <span className="font-mono text-[11px] font-semibold text-slate-800">{r.receiptNumber ?? r.id.slice(0, 8)}</span>
                </div>
              </AppTd>
              <AppTd><span className="font-mono text-[10px] text-slate-500">{r.billNumber ?? '—'}</span></AppTd>
              <AppTd><span className="text-[12px] text-slate-700">{r.vendorName ?? '—'}</span></AppTd>
              <AppTd align="right"><Amount value={Number(r.amount)} size="sm" /></AppTd>
              <AppTd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${METHOD_CLS[r.paymentMethod ?? 'CASH'] ?? METHOD_CLS.CASH}`}>
                  {r.paymentMethod ?? 'CASH'}
                </span>
              </AppTd>
              <AppTd>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Calendar size={9} className="text-slate-300" />
                  {new Date(r.paidAt).toLocaleDateString()}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      {total > PAGE_SIZE && (
        <div className="mt-3"><Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} /></div>
      )}

      <UploadReceiptModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        companyId={selectedCompanyId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['purchase-receipts'] })}
      />
    </AppPage>
  );
};

export default PurchaseReceipts;
