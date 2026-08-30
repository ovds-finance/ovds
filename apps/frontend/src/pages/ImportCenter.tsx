/**
 * ImportCenter — Bulk data import
 * OVDS Grid UI · CSV/Excel for all entities · Ethiopian data formats
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Download, CheckCircle2, AlertTriangle, RefreshCw,
  FileText, Users2, Building2, Package, Banknote, X,
  Info, ChevronRight, Zap, Clock, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import { GridHero, ContextStrip, ContextPill } from '@ovds/ui';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface ImportJob {
  id: string;
  entity: string;
  label: string;
  filename: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total?: number;
  imported?: number;
  errors?: number;
  createdAt: string;
}

interface ImportTemplate {
  entity: string;
  label: string;
  icon: React.ReactNode;
  accent: string;        // Tailwind colour key
  description: string;
  fields: string[];
  requiredFields: string[];
  endpoint: string;
}

/* ── Templates ──────────────────────────────────────────────────────────────── */
const TEMPLATES: ImportTemplate[] = [
  {
    entity: 'customers',
    label: 'Customers',
    icon: <Users2 size={15} />,
    accent: 'sky',
    description: 'Import client records with TIN, payment terms and credit limits',
    fields: ['name', 'email', 'phone', 'tin', 'vatNumber', 'businessType', 'paymentTerms', 'creditLimit', 'address'],
    requiredFields: ['name', 'email'],
    endpoint: '/ovds/ingestion/jobs',
  },
  {
    entity: 'vendors',
    label: 'Vendors',
    icon: <Building2 size={15} />,
    accent: 'amber',
    description: 'Import supplier records with WHT applicability and bank details',
    fields: ['name', 'email', 'phone', 'tin', 'category', 'paymentTerms', 'whtApplicable', 'bankName', 'accountNumber'],
    requiredFields: ['name'],
    endpoint: '/ovds/ingestion/jobs',
  },
  {
    entity: 'items',
    label: 'Items & Products',
    icon: <Package size={15} />,
    accent: 'emerald',
    description: 'Import product catalogue with pricing, SKU and VAT flags',
    fields: ['name', 'sku', 'type', 'unit', 'salePrice', 'purchasePrice', 'vatApplicable', 'stockQuantity'],
    requiredFields: ['name', 'salePrice'],
    endpoint: '/ovds/ingestion/jobs',
  },
  {
    entity: 'employees',
    label: 'Employees',
    icon: <Users2 size={15} />,
    accent: 'violet',
    description: 'Import HR records with salary, position and employment type',
    fields: ['firstName', 'lastName', 'email', 'phone', 'position', 'employmentType', 'basicSalary', 'hireDate'],
    requiredFields: ['firstName', 'lastName', 'basicSalary'],
    endpoint: '/ovds/ingestion/jobs',
  },
  {
    entity: 'bank_transactions',
    label: 'Bank Transactions',
    icon: <Banknote size={15} />,
    accent: 'rose',
    description: 'Import bank statement rows for reconciliation',
    fields: ['date', 'description', 'amount', 'type', 'reference', 'bankAccountId'],
    requiredFields: ['date', 'amount', 'type'],
    endpoint: '/ovds/ingestion/jobs',
  },
];

/* ── Colour map ─────────────────────────────────────────────────────────────── */
const ACC: Record<string, { icon: string; badge: string; ring: string; dot: string }> = {
  sky:     { icon: 'bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',         badge: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800',         ring: 'ring-sky-400/50',     dot: 'bg-sky-400' },
  amber:   { icon: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', ring: 'ring-amber-400/50',   dot: 'bg-amber-400' },
  emerald: { icon: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', ring: 'ring-emerald-400/50', dot: 'bg-emerald-400' },
  violet:  { icon: 'bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400', badge: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800', ring: 'ring-violet-400/50',  dot: 'bg-violet-400' },
  rose:    { icon: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',     badge: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',     ring: 'ring-rose-400/50',    dot: 'bg-rose-400' },
};

/* ── ImportCenter ───────────────────────────────────────────────────────────── */
const ImportCenter: React.FC = () => {
  usePageTitle('Import Center');
  const { selectedCompanyId } = useBusiness();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [selected,  setSelected]  = useState<ImportTemplate | null>(null);
  const [file,      setFile]      = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobs,      setJobs]      = useState<ImportJob[]>([]);
  const [dragOver,  setDragOver]  = useState(false);

  /* ── File helpers ─────────────────────────────────────────────────────────── */
  const handleFileSelect = (f: File) => {
    if (!f.name.match(/\.(csv|xlsx|xls)$/i)) { toast.error('Only CSV and Excel files are supported'); return; }
    setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
   
  }, []);

  const clearFile = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ── Upload ───────────────────────────────────────────────────────────────── */
  const handleUpload = async () => {
    if (!selected || !file) { toast.error('Select an entity type and file'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('entityType', selected.entity.toUpperCase());
      if (selectedCompanyId) fd.append('companyId', selectedCompanyId);
      const res = await api.post(selected.endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } } as any);
      const r = res.data?.data ?? res.data;
      setJobs(prev => [{
        id: r?.jobId ?? r?.id ?? Date.now().toString(),
        entity: selected.entity,
        label: selected.label,
        filename: file.name,
        status: r?.status ?? 'COMPLETED',
        total:    r?.total    ?? r?.rowCount ?? 0,
        imported: r?.imported ?? r?.created  ?? r?.committed ?? 0,
        errors:   r?.errors   ?? r?.failed   ?? 0,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      toast.success(`${selected.label} import queued`);
      clearFile();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Import failed');
      setJobs(prev => [{
        id: Date.now().toString(),
        entity: selected.entity,
        label: selected.label,
        filename: file.name,
        status: 'FAILED',
        createdAt: new Date().toISOString(),
      }, ...prev]);
    } finally { setUploading(false); }
  };

  /* ── Template CSV download ────────────────────────────────────────────────── */
  const downloadTemplate = (t: ImportTemplate, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const header = t.fields.join(',') + '\n';
    const row = t.fields.map(f => {
      if (f.includes('Price') || f.includes('Amount') || f.includes('Salary') || f.includes('Limit')) return '1000.00';
      if (f.includes('Date'))        return '2026-01-01';
      if (f.includes('email'))       return 'example@company.com';
      if (f.includes('phone'))       return '+251911000000';
      if (f.includes('tin'))         return '0000000000';
      if (f.includes('Applicable') || f.includes('Active')) return 'true';
      return `Sample ${f}`;
    }).join(',') + '\n';
    const blob = new Blob([header + row], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${t.entity}-template.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${t.label} template downloaded`);
  };

  /* ── Stats ────────────────────────────────────────────────────────────────── */
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
  const failedJobs    = jobs.filter(j => j.status === 'FAILED').length;
  const totalImported = jobs.reduce((s, j) => s + (j.imported ?? 0), 0);

  /* ── Render ───────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-12">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <GridHero
        title="Import Center"
        subtitle="Bulk import customers, vendors, items, employees and transactions via CSV or Excel · ERP · Supply Chain · Manufacturing & Logistics · Market Segmentation · All End Users"
        crumbs={[{ label: 'System Administration' }, { label: 'Import Center' }]}
        actions={
          <button
            onClick={handleUpload}
            disabled={!selected || !file || uploading}
            className="ovds-btn-primary flex items-center gap-2 disabled:opacity-40">
            {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            {uploading ? 'Importing…' : `Import ${selected?.label ?? 'Data'}`}
          </button>
        }
      />

      {/* ── Context strip ───────────────────────────────────────────── */}
      <ContextStrip>
        <ContextPill leading={<Upload size={11} />} label="CSV · XLSX · XLS" />
        <ContextPill variant="info" label="Max 10 MB per file" />
        {selected && (
          <ContextPill leading={<span className={`w-2 h-2 rounded-full ${ACC[selected.accent]?.dot}`} />} label={selected.label} />
        )}
        {totalImported > 0 && <ContextPill variant="success" label={`${totalImported} records imported`} className="ml-auto" />}
        {failedJobs > 0 && <ContextPill variant="alert" label={`${failedJobs} failed`} />}
      </ContextStrip>

      {/* ── Info banner ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-xl">
        <Info size={14} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <p className="ovds-caption text-sky-700 dark:text-sky-300">
          Download a template CSV first to ensure correct column headers.
          TIN numbers must be <strong>10 digits</strong> (ERCA format).
          Date fields use <strong>YYYY-MM-DD</strong>. Boolean fields accept <strong>true</strong> / <strong>false</strong>.
        </p>
      </div>

      {/* ── Main layout: entity list + upload panel ──────────────────── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '280px 1fr' }}>

        {/* ── Left: entity selector ─────────────────────────────────── */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">1 — Choose entity type</p>
          {TEMPLATES.map(t => {
            const ac = ACC[t.accent];
            const isActive = selected?.entity === t.entity;
            return (
              <button
                key={t.entity}
                onClick={() => setSelected(t)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all group ${
                  isActive
                    ? `border-current ring-2 ring-offset-1 ${ac.ring} ${ac.badge}`
                    : 'ovds-widget-card hover:shadow-md'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${ac.icon}`}>
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`ovds-body font-semibold truncate ${isActive ? '' : 'text-slate-800 dark:text-slate-200'}`}>{t.label}</p>
                  <p className="ovds-caption">{t.fields.length} fields</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={e => downloadTemplate(t, e)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-emerald-600 transition-all"
                    title="Download CSV template"
                  >
                    <Download size={12} />
                  </button>
                  {isActive && <ChevronRight size={13} className="text-current opacity-60" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Right: upload + preview ───────────────────────────────── */}
        <div className="space-y-4">

          {/* Step 2: drop zone */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1 mb-2">2 — Upload file</p>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                  : file
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="ovds-body font-semibold text-slate-800 dark:text-slate-100 truncate">{file.name}</p>
                    <p className="ovds-caption">{(file.size / 1024).toFixed(1)} KB · ready to import</p>
                  </div>
                  <button onClick={clearFile}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <Upload size={24} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <div>
                    <p className="ovds-body font-semibold text-slate-600 dark:text-slate-300">Drop file here or click to browse</p>
                    <p className="ovds-caption mt-1">CSV · XLSX · XLS — max 10 MB</p>
                  </div>
                  {!selected && (
                    <p className="ovds-caption text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={11} /> Select an entity type first
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Field map preview */}
          {selected && (
            <div className="ovds-widget-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Column map — {selected.label}</p>
                <button
                  onClick={() => downloadTemplate(selected)}
                  className="ovds-btn-secondary flex items-center gap-1.5 text-[11px] py-1">
                  <Download size={11} /> Template CSV
                </button>
              </div>
              <p className="ovds-caption">{selected.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.fields.map(f => {
                  const required = selected.requiredFields.includes(f);
                  return (
                    <span key={f}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                        required
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                      {f}{required && ' *'}
                    </span>
                  );
                })}
              </div>
              <p className="ovds-caption">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Green *</span> = required fields
              </p>
            </div>
          )}

          {/* Import button (also available here for convenience) */}
          <button
            onClick={handleUpload}
            disabled={!selected || !file || uploading}
            className="ovds-btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40">
            {uploading ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
            {uploading ? 'Importing…' : selected ? `Import ${selected.label}` : 'Select entity & file to import'}
          </button>

          {/* Import history */}
          {jobs.length > 0 && (
            <div className="ovds-widget-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Import History</p>
                <div className="flex items-center gap-3">
                  {completedJobs > 0 && <span className="ovds-caption text-emerald-600 dark:text-emerald-400 font-semibold">{completedJobs} completed</span>}
                  {failedJobs > 0 && <span className="ovds-caption text-rose-500 font-semibold">{failedJobs} failed</span>}
                </div>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {jobs.map(job => {
                  const ac = ACC[TEMPLATES.find(t => t.entity === job.entity)?.accent ?? 'emerald'];
                  return (
                    <div key={job.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        job.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-950/30' :
                        job.status === 'FAILED'    ? 'bg-rose-50 dark:bg-rose-950/30' :
                        'bg-amber-50 dark:bg-amber-950/30'
                      }`}>
                        {job.status === 'COMPLETED' ? <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> :
                         job.status === 'FAILED'    ? <XCircle size={14} className="text-rose-500" /> :
                         <RefreshCw size={14} className="text-amber-500 animate-spin" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="ovds-body font-semibold text-slate-800 dark:text-slate-200 truncate">{job.filename}</p>
                        <p className="ovds-caption">
                          {job.label}
                          {job.status === 'COMPLETED' && (
                            <> · <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{job.imported} imported</span>
                            {(job.errors ?? 0) > 0 && <>, <span className="text-rose-500 font-semibold">{job.errors} errors</span></>}
                            </>
                          )}
                          {job.status === 'FAILED' && <> · <span className="text-rose-500 font-semibold">Failed</span></>}
                          {job.status === 'PROCESSING' && <> · <span className="text-amber-600 font-semibold">Processing…</span></>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          job.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                          job.status === 'FAILED'    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
                          'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}>{job.status}</span>
                        <span className="ovds-caption text-slate-400">
                          {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportCenter;

