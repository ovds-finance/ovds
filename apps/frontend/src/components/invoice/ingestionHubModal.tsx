import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, 
  Upload, 
  History, 
  Zap, 
  Plus, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Database, 
  Cpu, 
  Search,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Smartphone,
  QrCode,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  Camera,
  Ticket
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useBusiness } from '../../context/businessContext';
import { IngestionWorkflowOverview } from './ingestionWorkflowOverview';

interface Props {
  onClose: () => void;
  onRefresh?: () => void;
}

type Tab = 'NEW' | 'HISTORY' | 'PIPELINE';

export const IngestionHubModal: React.FC<Props> = ({ onClose, onRefresh }) => {
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab] = useState<Tab>('NEW');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Review State
  const [reviewRows, setReviewRows] = useState<any[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  
  // New Job State
  const [sourceType, setSourceType] = useState<string>('IMAGE');
  const [targetType, setTargetType] = useState<string>('INVOICE');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [banks, setBanks] = useState<any[]>([]);
  const [payload, setPayload] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      toast.error('Could not access camera');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
        setPayload(base64);
        setSourceType('IMAGE');
        setFileName(`camera-capture-${Date.now()}.jpg`);
        setMimeType('image/jpeg');
        stopCamera();
        toast.success('Photo captured');
      }
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const fetchJobs = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const res = await api.get(`/ovds/ingestion/jobs?companyId=${selectedCompanyId}&limit=10`);
      const _jobs = res.data?.data; setJobs(Array.isArray(_jobs) ? _jobs : []);
    } catch {
      // silent — jobs list is non-critical
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const fetchBanks = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const res = await api.get(`/ovds/bank-accounts?companyId=${selectedCompanyId}`);
      const _banks = res.data?.data ?? res.data; setBanks(Array.isArray(_banks) ? _banks : []);
    } catch {
      // silent — bank list is non-critical
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (tab === 'NEW' && targetType === 'BANK_TRANSACTION') {
      fetchBanks();
    }
  }, [tab, targetType, fetchBanks]);

  const handleCreateJob = async () => {
    if (!payload && !['IMAGE', 'PDF', 'CSV'].includes(sourceType)) {
      toast.error('Please provide input data');
      return;
    }

    setLoading(true);
    try {
      // Use /scan for image/PDF sources, /jobs for CSV
      const endpoint = ['IMAGE', 'PDF'].includes(sourceType)
        ? '/ovds/ingestion/scan'
        : '/ovds/ingestion/jobs';

      const res = await api.post(endpoint, {
        sourceType,
        targetType,
        companyId: selectedCompanyId,
        payload,
        fileName,
        mimeType,
        autoCommitThreshold: 0.85,
        bankAccountId: targetType === 'BANK_TRANSACTION' ? bankAccountId : undefined
      });
      
      toast.success('Ingestion job started');
      setTab('HISTORY');
      fetchJobs();
      if (onRefresh) onRefresh();
      
      // Reset form
      setPayload('');
      setFileName('');
      setMimeType('');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to start ingestion job');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setMimeType(file.type);
    
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      setSourceType(file.type.startsWith('image/') ? 'IMAGE' : 'PDF');
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setPayload(base64);
      };
      reader.readAsDataURL(file);
    } else if (file.name.endsWith('.csv')) {
      setSourceType('CSV');
      const reader = new FileReader();
      reader.onload = (event) => {
        setPayload(event.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      toast.error('Unsupported file type');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMMITTED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'FAILED': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'REVIEW': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'PARSING':
      case 'ENRICHING': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 animate-pulse';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const startReview = (job: any) => {
    try {
      const rows = JSON.parse(job.parsedPayload || '[]');
      setReviewRows(rows);
      setSelectedJob(job);
      setIsReviewing(true);
    } catch (err) {
      toast.error('Failed to load review data');
    }
  };

  const updateReviewRow = (index: number, updates: any) => {
    const next = [...reviewRows];
    next[index] = { ...next[index], ...updates };
    setReviewRows(next);
  };

  const commitRow = async (index: number) => {
    if (!selectedJob) return;
    try {
      await api.post(`/ovds/ingestion/jobs/${selectedJob.id}/commit-row`, {
        rowIndex: index,
        overrides: reviewRows[index],
        companyId: selectedCompanyId,
        userId: 'current-user', // Backend should handle this via guard
        targetType: selectedJob.targetType,
      });
      
      toast.success('Row committed');
      // Mark as done locally
      const next = [...reviewRows];
      next[index] = { ...next[index], _committed: true };
      setReviewRows(next);
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to commit row');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="aki-card w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden" style={{ borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl flex items-center justify-center" style={{ background: 'var(--aki-success-bg)', color: 'white', boxShadow: 'var(--shadow)' }}>
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Ingestion Hub</h2>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Multi-Source AI Processing Pipeline</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="aki-btn aki-btn-ghost"
            style={{ borderRadius: '12px' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation — ovds style */}
        <div className="aki-tab-nav px-6" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface)' }}>
          {[
            { id: 'NEW',      label: 'Start Ingestion',       icon: <Plus size={14} /> },
            { id: 'HISTORY',  label: 'Processing History',    icon: <History size={14} /> },
            { id: 'PIPELINE', label: 'Pipeline Architecture', icon: <Zap size={14} /> }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`ovds-tab ${tab === t.id ? 'active' : ''}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {tab === 'NEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Input Options */}
              <div className="lg:col-span-7 space-y-8">
                 <div>
                   <h3 className="aki-section-title" style={{ marginBottom: '16px' }}>Select Source</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                     {[
                       { id: 'IMAGE', label: 'Image', icon: <Smartphone size={18} /> },
                       { id: 'PDF', label: 'PDF Doc', icon: <FileText size={18} /> },
                       { id: 'CSV', label: 'CSV/Excel', icon: <FileSpreadsheet size={18} /> },
                       { id: 'QR', label: 'QR Scan', icon: <QrCode size={18} /> },
                       { id: 'VOUCHER', label: 'Voucher', icon: <Ticket size={18} /> },
                       { id: 'CAMERA', label: 'Camera', icon: <Camera size={18} /> },
                       { id: 'MANUAL', label: 'Raw Text', icon: <FileCode size={18} /> }
                     ].map((s) => (
                       <button
                         key={s.id}
                         onClick={() => {
                           setSourceType(s.id);
                           if (s.id === 'CAMERA') startCamera();
                           else stopCamera();
                         }}
                         className="aki-card flex flex-col items-center gap-2 transition-all"
                         style={{ borderRadius: '16px', padding: '12px', border: `2px solid ${sourceType === s.id ? 'var(--aki-success-border)' : 'var(--border)'}`, color: sourceType === s.id ? 'var(--aki-success-text)' : 'var(--text-4)', background: sourceType === s.id ? 'var(--aki-success-bg)' : 'var(--surface)' }}
                       >
                         {s.icon}
                         <span className="text-[10px] font-semibold uppercase tracking-wider">{s.label}</span>
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-4">
                   <h3 className="aki-section-title">Input Payload</h3>
                   
                   {sourceType === 'CAMERA' ? (
                     <div className="relative w-full aspect-video rounded-2xl overflow-hidden" style={{ background: 'black', border: '1px solid var(--border)' }}>
                       {isCameraActive ? (
                         <>
                           <video 
                             ref={videoRef} 
                             autoPlay 
                             playsInline 
                             className="w-full h-full object-cover"
                           />
                           <div className="absolute inset-0 border-2 pointer-events-none flex items-center justify-center" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                             <div className="w-64 h-64 border-2 border-dashed rounded-2xl" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />
                           </div>
                           <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                             <button 
                               onClick={stopCamera}
                               className="aki-btn aki-btn-success"
                             >
                               Cancel
                             </button>
                             <button 
                               onClick={capturePhoto}
                               className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4"
                               style={{ background: 'white', borderColor: 'var(--border)' }}
                             >
                               <div className="w-10 h-10 rounded-full" style={{ background: 'var(--aki-success-bg)' }} />
                             </button>
                           </div>
                         </>
                       ) : (
                         <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'var(--text-4)' }}>
                           <Camera size={48} />
                           <button 
                             onClick={startCamera}
                             className="aki-btn aki-btn-success"
                           >
                             Re-activate Camera
                           </button>
                         </div>
                       )}
                     </div>
                   ) : sourceType === 'QR' || sourceType === 'VOUCHER' ? (
                     <div className="space-y-4">
                       <div className="aki-card flex items-center gap-3" style={{ borderRadius: '12px', padding: '16px' }}>
                         {sourceType === 'QR' ? <QrCode style={{ color: 'var(--aki-success-text)' }} /> : <Ticket style={{ color: 'var(--aki-success-text)' }} />}
                         <input 
                           type="text"
                           value={payload}
                           onChange={(e) => setPayload(e.target.value)}
                           placeholder={sourceType === 'QR' ? "Paste QR string or NBE code..." : "Enter voucher code or bank reference..."}
                           className="aki-input"
                           style={{ background: 'transparent', border: 'none', padding: 0 }}
                         />
                       </div>
                       <p className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: 'var(--text-4)' }}>
                         {sourceType === 'QR' 
                           ? "Supports EMVCo, NBE-IQR, and Telebirr Instant Pay formats"
                           : "Supports CBE Birr, Telebirr vouchers and digital payment tokens"}
                       </p>
                     </div>
                   ) : sourceType === 'MANUAL' ? (
                     <textarea 
                       value={payload}
                       onChange={(e) => setPayload(e.target.value)}
                       placeholder="Paste JSON, POS records, or CSV content here..."
                       className="aki-textarea"
                       style={{ minHeight: '192px', background: 'var(--surface)', border: '1px solid var(--border)' }}
                     />
                   ) : (
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="aki-card w-full flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors"
                       style={{ minHeight: '192px', borderStyle: 'dashed', borderColor: 'var(--border)' }}
                     >
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         onChange={handleFileChange}
                       />
                       <div className="p-4 rounded-xl" style={{ background: 'var(--surface-alt)' }}>
                         <Upload size={32} style={{ color: 'var(--text-4)' }} />
                       </div>
                       <div className="text-center">
                         <p className="font-bold" style={{ color: 'var(--text)' }}>{fileName || 'Click or drag to upload'}</p>
                         <p className="ovds-caption">Supported: JPG, PNG, PDF, CSV</p>
                       </div>
                     </div>
                   )}
                 </div>

                 <div className="flex flex-col sm:flex-row items-end gap-4 pt-4">
                   <div className="flex-1 w-full">
                     <label className="aki-label">Target Entity</label>
                     <select 
                       value={targetType}
                       onChange={(e) => setTargetType(e.target.value)}
                       className="aki-input aki-select"
                     >
                       <option value="INVOICE">Invoices</option>
                       <option value="BILL">Bills / Expenses</option>
                       <option value="BANK_TRANSACTION">Bank Transactions</option>
                     </select>
                   </div>

                   {targetType === 'BANK_TRANSACTION' && (
                     <div className="flex-1 w-full animate-in slide-in-from-left-4 duration-300">
                       <label className="aki-label">Target Bank Account</label>
                       <select 
                         value={bankAccountId}
                         onChange={(e) => setBankAccountId(e.target.value)}
                         className="aki-input aki-select"
                       >
                         <option value="">Select account...</option>
                         {banks.map((b) => (
                           <option key={b.id} value={b.id}>
                             {b.bankName} - {b.accountNumber} ({b.currency})
                           </option>
                         ))}
                       </select>
                     </div>
                   )}

                   <button 
                     onClick={handleCreateJob}
                     disabled={loading || (!payload && !['IMAGE', 'PDF', 'CSV'].includes(sourceType)) || (targetType === 'BANK_TRANSACTION' && !bankAccountId)}
                     className="aki-btn aki-btn-success flex-[2] w-full justify-center"
                   >
                     {loading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                     Process Ingestion
                   </button>
                 </div>
              </div>

               {/* Right: Helpful Info */}
               <div className="lg:col-span-5 space-y-5">
                 <div className="aki-card" style={{ borderRadius: '16px', padding: '24px', background: 'var(--aki-success-bg)', border: `1px solid var(--aki-success-border)` }}>
                   <h4 className="aki-section-title flex items-center gap-2" style={{ marginBottom: '16px', color: 'white' }}>
                     <Zap size={16} /> Intelligent Pipeline
                   </h4>
                   <ul className="space-y-4">
                     {[
                       { icon: <Cpu size={16} />, text: "AI-powered entity extraction & normalization" },
                       { icon: <ShieldCheck size={16} />, text: "Automated Ethiopian tax law compliance validation" },
                       { icon: <CheckCircle2 size={16} />, text: "Direct integration with GL and VAT ledgers" },
                       { icon: <Database size={16} />, text: "Immutable audit trail & raw data archival" }
                     ].map((item, i) => (
                       <li key={i} className="flex gap-3 text-sm leading-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>
                         <div className="mt-0.5" style={{ color: 'white' }}>{item.icon}</div>
                         {item.text}
                       </li>
                     ))}
                   </ul>
                 </div>

                 <div className="aki-card" style={{ borderRadius: '12px', padding: '24px' }}>
                   <h4 className="aki-section-title" style={{ marginBottom: '16px' }}>Batch Progress</h4>
                   <div className="space-y-3">
                     {jobs.filter(j => j.status !== 'COMMITTED' && j.status !== 'FAILED').slice(0, 3).map((job) => (
                       <div key={job.id} className="aki-card" style={{ borderRadius: '12px', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border-alt)' }}>
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-4)' }}>{job.sourceType} → {job.targetType}</span>
                           <span className={`aki-badge xs ${getStatusColor(job.status)}`}>{job.status}</span>
                         </div>
                         <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-alt)' }}>
                           <div 
                             className="aki-progress-bar success h-full rounded-full" 
                             style={{ width: `${(job.rowsCommitted / (job.rowsParsed || 1)) * 100}%` }}
                           />
                         </div>
                       </div>
                     ))}
                     {jobs.filter(j => j.status !== 'COMMITTED' && j.status !== 'FAILED').length === 0 && (
                       <div className="text-center py-4">
                         <p className="text-xs font-bold italic" style={{ color: 'var(--text-4)' }}>No active background jobs</p>
                       </div>
                     )}
                   </div>
                </div>
              </div>
            </div>
          )}

           {tab === 'HISTORY' && (
             <div className="space-y-5">
               <div className="flex items-center justify-between mb-2">
                 <h3 className="aki-section-title" style={{ fontSize: '18px', marginBottom: 0 }}>Recent Ingestion Jobs</h3>
                 <div className="flex items-center gap-2">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} size={16} />
                     <input 
                       type="text" 
                       placeholder="Search jobs..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="aki-input"
                       style={{ paddingLeft: '40px', width: '256px' }}
                     />
                   </div>
                   <button onClick={fetchJobs} className="aki-btn aki-btn-ghost">
                     <RefreshCw size={18} style={{ color: 'var(--text-4)' }} />
                   </button>
                 </div>
               </div>

               <div className="aki-card overflow-hidden" style={{ borderRadius: 0 }}>
                 <table className="w-full text-left">
                   <thead>
                     <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-alt)' }}>
                       <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Source / File</th>
                       <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Target</th>
                       <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Status</th>
                       <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Result</th>
                       <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Date</th>
                       <th className="px-6 py-4 text-right"></th>
                     </tr>
                   </thead>
                   <tbody className="divide-y" style={{ borderColor: 'var(--border-alt)' }}>
                     {jobs.filter(j => 
                       j.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       j.sourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       j.status.toLowerCase().includes(searchTerm.toLowerCase())
                     ).map((job) => (
                       <tr key={job.id} className="transition-colors group" onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-alt)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="p-2 rounded-lg" style={{ background: 'var(--surface-alt)' }}>
                               {job.sourceType === 'IMAGE' ? <Smartphone size={16} /> : 
                                job.sourceType === 'PDF' ? <FileText size={16} /> : 
                                job.sourceType === 'CSV' ? <FileSpreadsheet size={16} /> : 
                                job.sourceType === 'QR' ? <QrCode size={16} /> :
                                job.sourceType === 'VOUCHER' ? <Ticket size={16} /> :
                                job.sourceType === 'CAMERA' ? <Camera size={16} /> :
                                <FileCode size={16} />}
                             </div>
                             <div>
                               <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{job.fileName || 'Direct Submission'}</p>
                               <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-4)' }}>{job.sourceType}</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className="aki-badge xs" style={{ background: 'var(--surface-alt)', color: 'var(--text-2)' }}>
                             {job.targetType}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`aki-badge xs ${getStatusColor(job.status)}`}>
                             {job.status}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-4">
                             <div className="text-center">
                               <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{job.rowsCommitted}</p>
                               <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-4)' }}>Done</p>
                             </div>
                             {job.rowsForReview > 0 && (
                               <div className="text-center">
                                 <p className="text-sm font-semibold" style={{ color: 'var(--aki-warning-text)' }}>{job.rowsForReview}</p>
                                 <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-4)' }}>Review</p>
                               </div>
                             )}
                             {job.rowsFailed > 0 && (
                               <div className="text-center">
                                 <p className="text-sm font-semibold" style={{ color: 'var(--aki-danger-text)' }}>{job.rowsFailed}</p>
                                 <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-4)' }}>Fail</p>
                               </div>
                             )}
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{new Date(job.createdAt).toLocaleDateString()}</p>
                           <p className="ovds-caption">{new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button 
                             onClick={() => setSelectedJob(job)}
                             className="aki-btn aki-btn-soft-blue"
                             style={{ borderRadius: '12px' }}
                          >
                            <ArrowRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'PIPELINE' && (
            <div className="max-w-4xl mx-auto">
              <IngestionWorkflowOverview />
            </div>
          )}
        </div>

        {/* Selected Job Modal (Review/Details) */}
        {selectedJob && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-8" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
            <div className="aki-card w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden" style={{ borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
              <div className="flex items-center justify-between px-10 py-8" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${getStatusColor(selectedJob.status)}`} style={{ background: 'var(--aki-blue)', color: 'white' }}>
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Job Details</h3>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>{selectedJob.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedJob(null)} className="aki-btn aki-btn-ghost">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                <div className="aki-grid cols-4 gap-4">
                  {[
                    { label: 'Total Rows', val: selectedJob.rowsParsed, color: 'var(--text)' },
                    { label: 'Committed', val: selectedJob.rowsCommitted, color: 'var(--aki-success-text)' },
                    { label: 'Failed', val: selectedJob.rowsFailed, color: 'var(--aki-danger-text)' },
                    { label: 'For Review', val: selectedJob.rowsForReview, color: 'var(--aki-warning-text)' }
                  ].map((stat, i) => (
                    <div key={i} className="aki-card text-center" style={{ borderRadius: '12px', padding: '24px' }}>
                      <p className="text-3xl font-semibold mb-1 font-mono tracking-tighter" style={{ color: stat.color }}>{stat.val}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {selectedJob.errors && (() => {
                  let parsedErrors: string[] = [];
                  try { parsedErrors = JSON.parse(selectedJob.errors); } catch { /* ignore malformed errors field */ }
                  return parsedErrors.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="aki-section-title flex items-center gap-2" style={{ color: 'var(--aki-danger-text)' }}>
                        <AlertTriangle size={16} /> Extraction Errors
                      </h4>
                      <div className="aki-card space-y-2" style={{ borderRadius: '12px', padding: '20px', background: 'var(--aki-danger-bg)', border: `1px solid var(--aki-danger-border)` }}>
                        {parsedErrors.map((err: string, i: number) => (
                          <p key={i} className="text-sm flex gap-2" style={{ color: 'var(--aki-danger-text)' }}>
                            <span className="font-bold opacity-50">#{(i+1).toString().padStart(2,'0')}</span>
                            {err}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                <div className="space-y-4">
                  <h4 className="aki-section-title">Raw Metadata Summary</h4>
                  <div className="aki-card" style={{ borderRadius: '12px', padding: '20px' }}>
                    <pre className="text-[11px] font-mono whitespace-pre-wrap overflow-hidden leading-relaxed" style={{ color: 'var(--text-2)' }}>
                      {selectedJob.rawPayload}...
                    </pre>
                  </div>
                </div>
              </div>

              <div className="px-10 py-8 flex justify-end gap-4" style={{ background: 'var(--surface-alt)', borderTop: '1px solid var(--border-alt)' }}>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="aki-btn aki-btn-secondary"
                >
                  Close
                </button>
                {selectedJob.status === 'REVIEW' && (
                  <button 
                    onClick={() => startReview(selectedJob)}
                    className="aki-btn aki-btn-success"
                  >
                    Review {selectedJob.rowsForReview} Rows <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Review Ingestion Modal */}
        {isReviewing && selectedJob && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)' }}>
            <div className="aki-card w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden" style={{ borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
              <div className="flex items-center justify-between px-10 py-8" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl" style={{ background: 'var(--aki-warning-bg)', color: 'var(--aki-warning-text)' }}>
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Review Extractions</h3>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Job: {selectedJob.fileName || selectedJob.id}</p>
                  </div>
                </div>
                <button onClick={() => setIsReviewing(false)} className="aki-btn aki-btn-ghost">
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10">
                <div className="space-y-5">
                  {reviewRows.map((row, idx) => (
                    <div 
                      key={idx} 
                      className="aki-card p-6 transition-all"
                      style={{ borderRadius: '16px', border: `1px solid ${row._committed ? 'var(--aki-success-border)' : row.confidence < 0.8 ? 'var(--aki-warning-border)' : 'var(--border)'}`, opacity: row._committed ? 0.6 : 1, background: row._committed ? 'var(--aki-success-bg)' : row.confidence < 0.8 ? 'var(--aki-warning-bg)' : 'var(--surface)' }}
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm border" style={{ background: 'var(--surface)', border: '1px solid var(--border-alt)' }}>
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                              {row.description || 'No Description'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`aki-badge xs ${row.confidence >= 0.8 ? 'solid-success' : 'solid-warning'}`}>
                                {Math.round(row.confidence * 100)}% Confidence
                              </span>
                              {row.date && <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-4)' }}><Clock size={10} /> {row.date}</span>}
                            </div>
                          </div>
                        </div>
                        
                        {!row._committed && (
                          <button 
                            onClick={() => commitRow(idx)}
                            className="aki-btn aki-btn-success sm"
                          >
                            Commit Row <ArrowRight size={14} />
                          </button>
                        )}
                        {row._committed && (
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--aki-success-text)' }}>
                            <CheckCircle2 size={16} /> Committed
                          </div>
                        )}
                      </div>

                      <div className="aki-grid cols-4 gap-4">
                        {[
                          { label: 'Customer', key: 'customerName', type: 'text' },
                          { label: 'Amount', key: 'amount', type: 'number' },
                          { label: 'Reference', key: 'reference', type: 'text' },
                          { label: 'Date', key: 'date', type: 'date' },
                          { label: 'VAT Amount', key: 'vatAmount', type: 'number' },
                          { label: 'Currency', key: 'currency', type: 'text' },
                          { label: 'Bank', key: 'bankName', type: 'text' },
                          { label: 'Source', key: 'paymentSource', type: 'text' },
                          { label: 'Telecom Ref', key: 'telecomRef', type: 'text' }
                        ].map((field) => (
                          <div key={field.key} className="aki-field">
                            <label className="aki-label">{field.label}</label>
                            <input 
                              type={field.type}
                              value={row[field.key] || ''}
                              disabled={row._committed}
                              onChange={(e) => updateReviewRow(idx, { [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                              className="aki-input"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-10 py-8 flex justify-between items-center" style={{ background: 'var(--surface-alt)', borderTop: '1px solid var(--border-alt)' }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>
                  {reviewRows.filter(r => r._committed).length} of {reviewRows.length} rows committed
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsReviewing(false)}
                    className="aki-btn aki-btn-secondary"
                  >
                    Finish Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};











